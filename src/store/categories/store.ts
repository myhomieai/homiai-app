import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import localforage from '@/lib/utils/storage';
import { v4 as uuidv4 } from 'uuid';
import { z, ZodError, type ZodIssue } from 'zod';

// טיפוסים
import type {
  Category,
  MoveCategoryData,
  NewCategoryData,
  UpdateCategoryData
} from '@/types/category';

// סכמות Zod (מייבאות מקובץ חיצוני, למשל categorySchema.ts)
import {
  newCategorySchema,
  updateCategorySchema,
  fullCategorySchemaArray  // ← חייב להיות כאן!
} from '@/features/categories/schemas/categorySchema';

// פונקציות עזר (Utilities)
import {
  categoriesToRecord,
  generateSafeSlug,
  getAncestorsLogic,
  getDescendantsLogic,
} from '@/features/categories/utils';

// נתוני קטגוריות ראשוניים (אם קיימים)
import { initialCategories } from '@/features/categories/data/initialCategories';

const browserLocalForageStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const item = await localforage.getItem<string>(name);
      return item ?? null;
    } catch (error) {
      console.error(`[CategoryStore] ❌ Error getting item ${name} from localforage:`, error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await localforage.setItem(name, value);
    } catch (error) {
      console.error(`[CategoryStore] ❌ Error setting item ${name} in localforage:`, error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await localforage.removeItem(name);
    } catch (error) {
      console.error(`[CategoryStore] ❌ Error removing item ${name} from localforage:`, error);
    }
  },
};

const noopStorage: StateStorage = {
  getItem: () => Promise.resolve(null),
  setItem: () => Promise.resolve(),
  removeItem: () => Promise.resolve(),
};

// --- Interfaces ---
interface CategoryState {
  categories: Record<string, Category>;
  isLoading: boolean;
  error: string | null;
  _hasHydrated: boolean;
  expandedCategories: string[]; // IDs of categories currently expanded in a tree view
}

interface CategoryActions {
  // CRUD
  addCategory: (data: NewCategoryData) => Category | null;
  updateCategory: (id: string, data: UpdateCategoryData) => boolean;
  deleteCategory: (id: string, hardDelete?: boolean) => boolean;

  // העברה במבנה עץ
  moveCategory: (data: MoveCategoryData) => boolean;

  // ייצוא/ייבוא
  exportCategoriesToJson: () => string;
  importCategoriesFromJson: (jsonString: string) => boolean;

  // פעולות עזר
  getCategoryById: (id: string) => Category | undefined;
  getChildren: (parentId: string | null) => Category[];
  getAncestors: (categoryId: string) => Category[];
  getDescendants: (categoryId: string) => Category[];
  getFullPathObjects: (categoryId: string) => Category[];
  getFullPathString: (categoryId: string, separator?: string) => string;
  findCategoryBySlugPath: (path: string) => Category | undefined;
  setCategoryAliases: (id: string, aliases: Category['aliases']) => void;
  toggleCategoryExpansion: (id: string) => void;

  // עזר פנימי למחיקה רקורסיבית
  _cascadeDelete: (rootId: string) => number;

  // Error Handling
  _setError: (context: string, error: unknown) => void;
  _clearError: () => void;
}

export type CategoryStore = CategoryState & CategoryActions; // ייצוא הטייפ

// --- יצירת ה-Store ---
export const useCategoryStore = create<CategoryStore>()(
  devtools(
    persist(
      immer((set, get) => ({

        // --- State ---
        categories: {},
        isLoading: true,
        error: null,
        _hasHydrated: false,
        expandedCategories: [],

        // --- Error Handlers ---
        _setError: (context, error) => {
          let message = `[CategoryStore:${context}] Unexpected error.`;

          if (error instanceof Error) {
            message = `[CategoryStore:${context}] ${error.message}`;
          } else if (typeof error === 'string') {
            message = `[CategoryStore:${context}] ${error}`;
          } else if (error instanceof ZodError) {
            // פענוח שגיאות Zod
            message = `[CategoryStore:${context}] Validation Error: ${error.issues
              .map((i) => `${i.path.join('.') || 'error'}: ${i.message}`)
              .join(', ')}`;
          } else {
            message = `[CategoryStore:${context}] An unknown error occurred.`;
          }

          console.error(message, error);
          set({ error: message, isLoading: false }, false, `_setError (${context})`);
        },
        _clearError: () => set({ error: null }, false, '_clearError'),

        // --- toggleCategoryExpansion ---
        toggleCategoryExpansion: (id) => {
          set((state) => {
            const idx = state.expandedCategories.indexOf(id);
            if (idx >= 0) {
              state.expandedCategories.splice(idx, 1); // remove
            } else {
              state.expandedCategories.push(id); // add
            }
          }, false, `toggleCategoryExpansion (${id})`);
        },

        // --- עזר למחיקה רקורסיבית (cascade) ---
        _cascadeDelete: (rootId: string) => {
          const all = get().categories;
          // חיפוש צאצאים
          const descendants = getDescendantsLogic(rootId, all).map((c) => c.id);
          const toDelete = [rootId, ...descendants];

          set((state) => {
            toDelete.forEach((catId) => {
              delete state.categories[catId];
            });
          }, false, `_cascadeDelete(${rootId})`);

          return toDelete.length;
        },

        // --- addCategory ---
        addCategory: (data) => {
          get()._clearError();

          // אימות מול סכמת Zod
          const result = newCategorySchema.safeParse(data);
          if (!result.success) {
            get()._setError('addCategory', result.error);
            return null;
          }
          const validatedData = result.data;
          const now = new Date().toISOString();

          // הורה
          const parentId = validatedData.parentId ?? null;
          const parent = parentId ? get().getCategoryById(parentId) : null;
          if (parentId && !parent) {
            get()._setError('addCategory', `Parent category with ID ${parentId} not found.`);
            return null;
          }

          // מציאת Slug ייחודי
          let slug = generateSafeSlug(validatedData.name);
          const siblings = get().getChildren(validatedData.parentId ?? null);
          if (siblings.some((s) => s.slug === slug)) {
            const baseSlug = slug;
            let counter = 1;
            while (siblings.some((s) => s.slug === slug)) {
              counter++;
              slug = `${baseSlug}-${counter}`;
              if (counter > 100) {
                get()._setError('addCategory', `Could not generate unique slug for ${validatedData.name}`);
                return null;
              }
            }
            console.log(`[CategoryStore:addCategory] Adjusted slug: ${slug}`);
          }

          // יצירת אובייקט קטגוריה חדש
          const newCategory: Category = {
            id: uuidv4(),
            name: validatedData.name,
            slug,
            parentId,
            path: parent ? `${parent.path}/${slug}` : slug,
            depth: parent ? parent.depth + 1 : 0,
            createdAt: now,
            updatedAt: now,
            isLeaf: true,
            version: 1,
            archived: false,
            hidden: false,
            isSystemCategory: false,
            orphanPolicy: 'prevent-delete',
            icon: validatedData.icon,
            description: validatedData.description,
            sortOrder: validatedData.sortOrder,
            localizedNames: validatedData.localizedNames,
            relatedCategoryIds: validatedData.relatedCategoryIds ?? [],
            aliases: validatedData.aliases,
            facets: validatedData.facets,
            hierarchyType: validatedData.hierarchyType,
            pathIds: undefined,
            aiHints: undefined,
            embedding: undefined,
            externalReferences: undefined,
            accessControl: undefined,
          };

          set((state) => {
            state.categories[newCategory.id] = newCategory;
            // אם לקטגוריה האב היה isLeaf = true => עכשיו כבר לא
            if (parentId && state.categories[parentId]?.isLeaf) {
              state.categories[parentId].isLeaf = false;
              state.categories[parentId].updatedAt = now;
            }
          }, false, `addCategory (${newCategory.id})`);

          return newCategory;
        },

        // --- updateCategory ---
        updateCategory: (id, data) => {
          get()._clearError();

          const category = get().getCategoryById(id);
          if (!category) {
            get()._setError('updateCategory', `Category ${id} not found.`);
            return false;
          }
          // מניעת שינוי שדות מבניים
          if ('parentId' in data || 'slug' in data || 'path' in data || 'depth' in data) {
            get()._setError('updateCategory', 'Structural fields must be changed via moveCategory.');
            return false;
          }

          // ולידציה
          const result = updateCategorySchema.safeParse(data);
          if (!result.success) {
            get()._setError('updateCategory', result.error);
            return false;
          }
          const validatedData = result.data;
          const now = new Date().toISOString();

          set((state) => {
            state.categories[id] = {
              ...state.categories[id],
              ...validatedData,
              updatedAt: now,
              version: (category.version ?? 1) + 1,
            };
          }, false, `updateCategory (${id})`);

          return true;
        },

        // --- deleteCategory ---
        deleteCategory: (id, hardDelete = false) => {
          get()._clearError();
          const category = get().getCategoryById(id);
          if (!category) {
            get()._setError('deleteCategory', `Category ${id} not found.`);
            return false;
          }

          const children = get().getChildren(id);
          const effectivePolicy = category.orphanPolicy ?? 'prevent-delete';
          const oldParentId = category.parentId;
          const now = new Date().toISOString();
          let success = false;

          // אם יש ילדים והמדיניות מונעת מחיקה, עצור
          if (children.length > 0 && effectivePolicy === 'prevent-delete') {
            get()._setError('deleteCategory', `Category ${id} has children + orphanPolicy='prevent-delete'.`);
            return false;
          }

          if (hardDelete) {
            if (effectivePolicy === 'cascade') {
              const deletedCount = get()._cascadeDelete(id);
              console.log(`[CategoryStore] Cascade-delete removed ${deletedCount} categories (root: ${id}).`);

              if (oldParentId && get().categories[oldParentId]) {
                set((state) => {
                  const siblingsLeft = Object.values(state.categories).filter(
                    (c) => c.parentId === oldParentId
                  );
                  if (siblingsLeft.length === 0) {
                    state.categories[oldParentId].isLeaf = true;
                    state.categories[oldParentId].updatedAt = now;
                  }
                }, false, `deleteCategory-cascade (parent update: ${oldParentId})`);
              }
              success = true;
            } else if (effectivePolicy === 'reassign-root') {
              get()._setError('deleteCategory', 'Reassign-to-root not yet implemented.');
              return false;
            } else {
              set((state) => {
                delete state.categories[id];
                if (oldParentId && state.categories[oldParentId]) {
                  const stillKids = Object.values(state.categories).filter(
                    (c) => c.parentId === oldParentId
                  );
                  if (stillKids.length === 0) {
                    state.categories[oldParentId].isLeaf = true;
                    state.categories[oldParentId].updatedAt = now;
                  }
                }
              }, false, `deleteCategory-hard (${id})`);
              success = true;
            }
          } else {
            set((state) => {
              if (state.categories[id]) {
                state.categories[id].archived = true;
                state.categories[id].hidden = true;
                state.categories[id].updatedAt = now;
                state.categories[id].version = (category.version ?? 1) + 1;

                if (oldParentId && state.categories[oldParentId]) {
                  const activeSiblings = Object.values(state.categories).filter(
                    (c) => c.parentId === oldParentId && !c.archived
                  );
                  if (activeSiblings.length === 0) {
                    state.categories[oldParentId].isLeaf = true;
                    state.categories[oldParentId].updatedAt = now;
                  }
                }
              }
            }, false, `deleteCategory-soft (${id})`);
            success = true;
          }
          return success;
        },

        // --- moveCategory ---
        moveCategory: (data) => {
          get()._clearError();
          const { categoryId, newParentId } = data;
          const all = get().categories;
          const category = all[categoryId];
          const newParent = newParentId ? all[newParentId] : null;
          const now = new Date().toISOString();
          const oldParentId = category?.parentId;

          if (!category) {
            get()._setError('moveCategory', `Category ${categoryId} not found.`);
            return false;
          }
          if (categoryId === newParentId) {
            get()._setError('moveCategory', 'Cannot move category into itself.');
            return false;
          }
          if (newParent && newParent.path.startsWith(category.path + '/')) {
            get()._setError('moveCategory', 'Cannot move category into its own descendant.');
            return false;
          }
          if (category.parentId === (newParentId ?? null)) {
            console.warn(`[CategoryStore:moveCategory] No change: ${categoryId} already under ${newParentId ?? 'root'}.`);
            return true;
          }

          let newSlug = category.slug;
          const siblings = get().getChildren(newParentId);
          if (siblings.some((s) => s.id !== categoryId && s.slug === newSlug)) {
            const baseSlug = newSlug;
            let counter = 1;
            while (siblings.some((s) => s.id !== categoryId && s.slug === newSlug)) {
              counter++;
              newSlug = `${baseSlug}-${counter}`;
              if (counter > 100) {
                get()._setError('moveCategory', 'Could not generate unique slug under new parent.');
                return false;
              }
            }
          }

          const newDepth = newParent ? newParent.depth + 1 : 0;
          const newPath = newParent ? `${newParent.path}/${newSlug}` : newSlug;
          const depthDiff = newDepth - category.depth;
          const oldPathPrefix = category.path + '/';

          const updates: Record<string, Partial<Category>> = {};
          updates[categoryId] = {
            parentId: newParentId ?? null,
            slug: newSlug,
            path: newPath,
            depth: newDepth,
            updatedAt: now,
            version: (category.version ?? 1) + 1,
          };

          const descendants = getDescendantsLogic(categoryId, all);
          for (const node of descendants) {
            const relativePath = node.path.startsWith(oldPathPrefix)
              ? node.path.substring(oldPathPrefix.length)
              : node.path.substring(category.path.length + 1);

            updates[node.id] = {
              path: `${newPath}/${relativePath}`,
              depth: node.depth + depthDiff,
              updatedAt: now,
              version: (node.version ?? 1) + 1,
            };
          }

          set((state) => {
            Object.entries(updates).forEach(([id, patch]) => {
              if (state.categories[id]) {
                Object.assign(state.categories[id], patch);
              }
            });

            if (oldParentId && state.categories[oldParentId]) {
              const stillChildren = Object.values(state.categories).filter(
                (c) => c.parentId === oldParentId
              );
              if (stillChildren.length === 0) {
                state.categories[oldParentId].isLeaf = true;
                state.categories[oldParentId].updatedAt = now;
              }
            }

            if (newParentId && state.categories[newParentId] && state.categories[newParentId].isLeaf) {
              state.categories[newParentId].isLeaf = false;
              state.categories[newParentId].updatedAt = now;
            }
          }, false, `moveCategory (${categoryId} -> ${newParentId ?? 'root'})`);

          return true;
        },

        // --- ייצוא ---
        exportCategoriesToJson: () => {
          try {
            return JSON.stringify(Object.values(get().categories), null, 2);
          } catch (error) {
            get()._setError('exportCategoriesToJson', error);
            return '[]';
          }
        },

        // --- ייבוא עם ולידציה Zod ---
        importCategoriesFromJson: (jsonString) => {
          get()._clearError();
          let parsedData: unknown;
        
          try {
            parsedData = JSON.parse(jsonString);
          } catch (e) {
            get()._setError('importCategoriesFromJson', e instanceof Error ? e.message : 'Invalid JSON format');
            return false;
          }
        
          const validationResult = fullCategorySchemaArray.safeParse(parsedData);
        
          if (!validationResult.success) {
            console.error("❌ Import Validation Failed:", validationResult.error.flatten());
            const formattedError = validationResult.error.issues
              .map((issue: ZodIssue) => `Item at index {${issue.path[0]}} -> Field '${issue.path.slice(1).join('.')}' : ${issue.message}`)
              .join('; ');
            get()._setError('importCategoriesFromJson', `Invalid data format in imported JSON. Details: ${formattedError}`);
            return false;
          }
        
          const validatedCategories = validationResult.data;
          const now = new Date().toISOString();
          const importedRecord: Record<string, Category> = {};
        
          for (const cat of validatedCategories) {
            if (typeof cat.id !== 'string') {
              get()._setError('importCategoriesFromJson', `Missing ID after validation: ${JSON.stringify(cat)}`);
              return false;
            }
            importedRecord[cat.id] = {
              ...cat,
              updatedAt: now,
              version: (get().categories[cat.id]?.version ?? 0) + 1,
            };
          }
        
          set((state) => {
            console.log(`[CategoryStore] Importing ${Object.keys(importedRecord).length} valid categories. Replacing existing state.`);
            state.categories = importedRecord;
            state.expandedCategories = [];
          }, false, 'importCategoriesFromJson');
        
          return true;
        },

        // --- Getters ---
        getCategoryById: (id) => get().categories[id],
        getChildren: (parentId) =>
          Object.values(get().categories).filter((c) => c.parentId === parentId && !c.archived),
        getAncestors: (categoryId) => getAncestorsLogic(categoryId, get().categories),
        getDescendants: (categoryId) => getDescendantsLogic(categoryId, get().categories),
        getFullPathObjects: (categoryId) => {
          const ancestors = getAncestorsLogic(categoryId, get().categories).reverse();
          const self = get().getCategoryById(categoryId);
          return self ? [...ancestors, self] : ancestors;
        },
        getFullPathString: (categoryId, sep = ' > ') => {
          const objs = get().getFullPathObjects(categoryId);
          return objs.map((c) => c.name).join(sep);
        },
        findCategoryBySlugPath: (path) =>
          Object.values(get().categories).find((c) => c.path === path && !c.archived),

        // --- setCategoryAliases ---
        setCategoryAliases: (id, aliases) => {
          get()._clearError();
          const category = get().getCategoryById(id);
          if (!category) {
            get()._setError('setCategoryAliases', `Category ${id} not found.`);
            return;
          }
          const now = new Date().toISOString();
          set((state) => {
            state.categories[id].aliases = aliases;
            state.categories[id].updatedAt = now;
            state.categories[id].version = (category.version ?? 1) + 1;
          }, false, `setCategoryAliases (${id})`);
        },

      })),
      // --- Persist Config ---
      {
        name: 'homi-category-storage-v2',
        storage: createJSONStorage(() =>
          typeof window !== 'undefined' ? browserLocalForageStorage : noopStorage
        ),
        partialize: (state) => ({
          categories: state.categories,
          expandedCategories: state.expandedCategories
        }),
        version: 2,
        onRehydrateStorage: () => (state, error) => {
          const storeName = '[CategoryStore]';
          console.log(`🔄 ${storeName} onRehydrateStorage called!`);
          if (error) {
            console.error(`❌ ${storeName} Failed to rehydrate state:`, error);
            useCategoryStore.setState({
              isLoading: false,
              _hasHydrated: true,
              error: 'Failed to load categories from storage.',
            });
            return;
          }
          if (state) {
            const loadedCategories = state.categories ?? {};
            const loadedExpanded = state.expandedCategories ?? [];
            let finalCategories = loadedCategories;
            let finalExpanded = loadedExpanded;
            let finalError = null;

            if (Object.keys(loadedCategories).length === 0 && initialCategories?.length > 0) {
              try {
                console.log(`🌱 ${storeName} No persisted categories, hydrating from initial data...`);
                finalCategories = categoriesToRecord(initialCategories);
                finalExpanded = [];
              } catch (err) {
                console.error(`❌ ${storeName} Failed to process initial categories:`, err);
                finalError = 'Failed to process initial categories.';
              }
            } else {
              console.log(
                `[CategoryStore] Hydrated ${Object.keys(finalCategories).length} categories + ${finalExpanded.length} expanded states from storage.`
              );
            }

            useCategoryStore.setState({
              categories: finalCategories,
              expandedCategories: finalExpanded,
              isLoading: false,
              _hasHydrated: true,
              error: finalError,
            });
            console.log(`✅ ${storeName} Hydration finished.`);
          } else {
            console.warn(`⚠️ [CategoryStore] Rehydration finished but state is null.`);
            useCategoryStore.setState({
              isLoading: false,
              _hasHydrated: true,
              error: 'Failed to load state.',
            });
          }
        },
      }
    ),
    {
      name: 'HomiAppStore (Categories)',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// --- סלקטורים (Selectors) לשימוש בקומפוננטות ---
export const useCategoriesRecord = () =>
  useCategoryStore((s) => s.categories);

export const useCategoriesArray = () =>
  useCategoryStore((s) =>
    Object.values(s.categories).filter((c) => !c.archived && !c.hidden)
  );

export const useCategoryById = (id: string | null | undefined) =>
  useCategoryStore((s) => (id ? s.getCategoryById(id) : undefined));

export const useChildCategories = (parentId: string | null) =>
  useCategoryStore((s) => s.getChildren(parentId));

export const useCategoryIsLoading = () =>
  useCategoryStore((s) => s.isLoading);

export const useCategoryError = () =>
  useCategoryStore((s) => s.error);

export const useCategoryHasHydrated = () =>
  useCategoryStore((s) => s._hasHydrated);

export const useExpandedCategories = () =>
  useCategoryStore((s) => s.expandedCategories);