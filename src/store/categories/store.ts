// src/store/useCategoryStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import localforage from 'localforage';
import { v4 as uuidv4 } from 'uuid';
import { ZodError } from 'zod';

import {
  Category,
  MoveCategoryData,
} from '@/features/types.ts/category';

import {
  newCategorySchema,
  updateCategorySchema,
  NewCategoryData,
  UpdateCategoryData,
} from '@/features/schemas/categorySchema';

import {
  categoriesToRecord,
  generateSafeSlug,
  getAncestorsLogic,
  getDescendantsLogic,
} from '@/features/utils/categoryUtils';

import { initialCategories } from '@/lib/initial-data';

// -------------------------
// אחסון מבוסס LocalForage
// -------------------------
localforage.config({
  name: 'HomiAI',
  storeName: 'homi_category_store_v1',
});

const browserLocalForageStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const item = await localforage.getItem<string>(name);
      return item ?? null;
    } catch (error) {
      console.error(`❌ Error getting item ${name} from localforage:`, error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await localforage.setItem(name, value);
    } catch (error) {
      console.error(`❌ Error setting item ${name} in localforage:`, error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await localforage.removeItem(name);
    } catch (error) {
      console.error(`❌ Error removing item ${name} from localforage:`, error);
    }
  },
};

const noopStorage: StateStorage = {
  getItem: () => Promise.resolve(null),
  setItem: () => Promise.resolve(),
  removeItem: () => Promise.resolve(),
};

interface CategoryState {
  categories: Record<string, Category>;
  isLoading: boolean;
  error: string | null;
  _hasHydrated: boolean;
  expandedCategories: string[];
}

interface CategoryActions {
  addCategory: (data: NewCategoryData) => Category | null;
  updateCategory: (id: string, data: UpdateCategoryData) => boolean;
  deleteCategory: (id: string, hardDelete?: boolean) => boolean;
  moveCategory: (data: MoveCategoryData) => boolean;

  exportCategoriesToJson: () => string;
  importCategoriesFromJson: (jsonString: string) => boolean;

  getCategoryById: (id: string) => Category | undefined;
  getChildren: (parentId: string | null) => Category[];
  getAncestors: (categoryId: string) => Category[];
  getDescendants: (categoryId: string) => Category[];
  getFullPathObjects: (categoryId: string) => Category[];
  getFullPathString: (categoryId: string, separator?: string) => string;
  findCategoryBySlugPath: (path: string) => Category | undefined;

  setCategoryAliases: (id: string, aliases: Category['aliases']) => void;

  toggleCategoryExpansion: (id: string) => void;
  _setError: (context: string, error: unknown) => void;
  _clearError: () => void;
}

type CategoryStore = CategoryState & CategoryActions;

export const useCategoryStore = create<CategoryStore>()(
  persist(
    immer((set, get) => ({
      categories: {},
      isLoading: true,
      error: null,
      _hasHydrated: false,
      expandedCategories: [],

      _setError: (context, error) => {
        let message = `[${context}] Unexpected error.`;
        if (error instanceof Error) message = `[${context}] ${error.message}`;
        else if (typeof error === 'string') message = `[${context}] ${error}`;
        else if (error instanceof ZodError) message = `[${context}] Validation: ${JSON.stringify(error.flatten().fieldErrors)}`;
        console.error(message, error);
        set({ error: message, isLoading: false });
      },

      _clearError: () => set({ error: null }),

      toggleCategoryExpansion: (id) => {
        set((state) => {
          const idx = state.expandedCategories.indexOf(id);
          if (idx >= 0) {
            state.expandedCategories.splice(idx, 1);
          } else {
            state.expandedCategories.push(id);
          }
        });
      },

      addCategory: (data) => {
        get()._clearError();
        const result = newCategorySchema.safeParse(data);
        if (!result.success) {
          get()._setError('addCategory', result.error);
          return null;
        }
        const now = new Date().toISOString();
        const validated = result.data;
        const parent = validated.parentId ? get().getCategoryById(validated.parentId) : null;
        if (validated.parentId && !parent) {
          get()._setError('addCategory', 'Parent not found');
          return null;
        }

        let slug = generateSafeSlug(validated.name);
        const siblings = get().getChildren(validated.parentId);
        const baseSlug = slug;
        let counter = 1;
        while (siblings.some(s => s.slug === slug)) slug = `${baseSlug}-${++counter}`;

        const newCategory: Category = {
          id: uuidv4(),
          name: validated.name,
          slug,
          parentId: validated.parentId,
          path: parent ? `${parent.path}/${slug}` : slug,
          depth: (parent?.depth ?? -1) + 1,
          createdAt: now,
          updatedAt: now,
          icon: validated.icon,
          description: validated.description,
          hierarchyType: validated.hierarchyType,
          localizedNames: validated.localizedNames,
          facets: validated.facets,
          aliases: validated.aliases,
          relatedCategoryIds: validated.relatedCategoryIds,
          isLeaf: true,
          version: 1,
          archived: false,
          hidden: false,
          isSystemCategory: false,
          orphanPolicy: 'prevent-delete',
        };

        set((state) => {
          state.categories[newCategory.id] = newCategory;
          if (parent && parent.isLeaf) {
            state.categories[parent.id].isLeaf = false;
            state.categories[parent.id].updatedAt = now;
          }
        });

        return newCategory;
      },

      updateCategory: (id, data) => {
        get()._clearError();
        const category = get().getCategoryById(id);
        if (!category) {
          get()._setError('updateCategory', `Category ${id} not found.`);
          return false;
        }

        const result = updateCategorySchema.safeParse(data);
        if (!result.success) {
          get()._setError('updateCategory', result.error);
          return false;
        }

        const validated = result.data;
        if ('parentId' in validated || 'slug' in validated || 'path' in validated || 'depth' in validated) {
          get()._setError('updateCategory', 'Use moveCategory to update hierarchy fields.');
          return false;
        }

        const now = new Date().toISOString();
        set((state) => {
          state.categories[id] = {
            ...category,
            ...validated,
            version: (category.version ?? 1) + 1,
            updatedAt: now,
          };
        });

        return true;
      },

      deleteCategory: (id, hardDelete = false) => {
        get()._clearError();
        const cat = get().getCategoryById(id);
        if (!cat) {
          get()._setError('deleteCategory', 'Category not found.');
          return false;
        }

        const children = get().getChildren(id);
        const policy = cat.orphanPolicy ?? 'prevent-delete';

        if (hardDelete) {
          if (children.length > 0) {
            get()._setError('deleteCategory', 'Cannot delete category with children.');
            return false;
          }
          set((state) => { delete state.categories[id]; });
        } else {
          const now = new Date().toISOString();
          set((state) => {
            const c = state.categories[id];
            c.archived = true;
            c.hidden = true;
            c.updatedAt = now;
            c.version = (c.version ?? 1) + 1;
          });
        }

        return true;
      },

      moveCategory: (data) => {
        const { categoryId, newParentId } = data;
        get()._clearError();

        const all = get().categories;
        const category = all[categoryId];
        const newParent = newParentId ? all[newParentId] : null;
        const oldParentId = category?.parentId;

        if (!category || categoryId === newParentId) {
          get()._setError('moveCategory', 'Invalid move operation.');
          return false;
        }

        if (newParent && newParent.path.startsWith(category.path)) {
          get()._setError('moveCategory', 'Cannot move category into its own descendant.');
          return false;
        }

        const now = new Date().toISOString();
        const newDepth = (newParent?.depth ?? -1) + 1;
        const oldDepth = category.depth;
        const oldPathPrefix = category.path;
        const newPathBase = newParent ? `${newParent.path}/${category.slug}` : category.slug;

        const descendants = [category, ...getDescendantsLogic(categoryId, all)];
        const updates: Record<string, Partial<Category>> = {};

        for (const node of descendants) {
          const relative = node.path.slice(oldPathPrefix.length);
          updates[node.id] = {
            path: newPathBase + relative,
            depth: newDepth + (node.depth - oldDepth),
            parentId: node.id === categoryId ? newParentId : node.parentId,
            updatedAt: now,
            version: (node.version ?? 1) + 1,
          };
        }

        set((state) => {
          Object.entries(updates).forEach(([id, patch]) => {
            Object.assign(state.categories[id], patch);
          });
        });

        return true;
      },

      exportCategoriesToJson: () => {
        return JSON.stringify(Object.values(get().categories), null, 2);
      },

      importCategoriesFromJson: (jsonString) => {
        get()._clearError();
        let parsed;
        try {
          parsed = JSON.parse(jsonString);
        } catch (e) {
          get()._setError('import', 'Invalid JSON');
          return false;
        }

        if (!Array.isArray(parsed)) return false;
        const now = new Date().toISOString();

        set((state) => {
          (parsed as Category[]).forEach((cat) => {
            state.categories[cat.id] = {
              ...state.categories[cat.id],
              ...cat,
              updatedAt: now,
              version: (state.categories[cat.id]?.version ?? 1) + 1,
            };
          });
        });

        return true;
      },

      getCategoryById: (id) => get().categories[id],
      getChildren: (parentId) =>
        Object.values(get().categories).filter(c => c.parentId === parentId && !c.archived),
      getAncestors: (id) => getAncestorsLogic(id, get().categories),
      getDescendants: (id) => getDescendantsLogic(id, get().categories),
      getFullPathObjects: (id) => {
        const cat = get().getCategoryById(id);
        return cat ? [...get().getAncestors(id), cat] : [];
      },
      getFullPathString: (id, sep = ' > ') =>
        get().getFullPathObjects(id).map(c => c.name).join(sep),
      findCategoryBySlugPath: (path) =>
        Object.values(get().categories).find((c) => c.path === path && !c.archived),

      setCategoryAliases: (id, aliases) => {
        get()._clearError();
        const now = new Date().toISOString();
        set((state) => {
          const cat = state.categories[id];
          if (!cat) {
            get()._setError('setCategoryAliases', 'Category not found');
            return;
          }
          cat.aliases = aliases;
          cat.updatedAt = now;
          cat.version = (cat.version ?? 1) + 1;
        });
      },
    })),
    {
      name: 'homi-category-storage-v1',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? browserLocalForageStorage : noopStorage
      ),
      partialize: (state) => ({ categories: state.categories }),
      version: 1,
      onRehydrateStorage: () => (state, error) => {
        const loaded = state?.categories ?? {};
        if (!error && Object.keys(loaded).length === 0 && initialCategories?.length > 0) {
          try {
            useCategoryStore.setState({
              categories: categoriesToRecord(initialCategories),
              isLoading: false,
              _hasHydrated: true,
              error: null,
              expandedCategories: [],
            });
            return;
          } catch (err) {
            console.error('❌ Failed to hydrate from initial categories:', err);
          }
        }
        useCategoryStore.setState({
          isLoading: false,
          _hasHydrated: true,
          error: error ? 'Hydration failed.' : null,
        });
      },
    }
  )
);

export const useCategoriesRecord = () =>
  useCategoryStore((s) => s.categories);

export const useCategoriesArray = () =>
  useCategoryStore((s) => Object.values(s.categories).filter((c) => !c.archived));

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
