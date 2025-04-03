import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import localforage from 'localforage';
import { v4 as uuidv4 } from 'uuid';
import slugify from 'slugify';
import { z, ZodError } from 'zod'; // ייבוא ZodError לטיפול מפורט

// --- ייבוא הטיפוסים ---
import { Category, NewCategoryData, UpdateCategoryData, MoveCategoryData } from '@/types/category';
// --- ייבוא הנתונים הראשוניים ---
import { initialCategories } from '@/lib/initial-data'; // ודא שיש קובץ כזה והנתיב נכון

// ==============================
// 🧱 הגדרות אחסון (ללא שינוי מהותי)
// ==============================
localforage.config({ name: 'HomiAI', storeName: 'homi_category_store_v1' });
const browserLocalForageStorage: StateStorage = { /* ... מימוש מלא ... */ };
const noopStorage: StateStorage = { /* ... מימוש מלא ... */ };

// ==============================
// 🛠️ פונקציות עזר (הוצאו החוצה)
// ==============================

/**
 * ממיר מערך קטגוריות למילון (Record) לגישה מהירה לפי ID.
 */
function categoriesToRecord(categories: Category[]): Record<string, Category> {
  return categories.reduce((acc, category) => {
    if (category?.id) { // בדיקת בטיחות קטנה
        acc[category.id] = category;
    }
    return acc;
  }, {} as Record<string, Category>);
}

/**
 * מייצר slug תקני ובטוח לשימוש בנתיבים.
 */
function generateSafeSlug(name: string): string {
  const slug = slugify(name?.trim() ?? '', { // בטיחות: ודא ש-name אינו null/undefined
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@?]/g, // הרחבתי מעט את התווים להסרה
    trim: true
  });
  // אם אחרי הניקוי לא נשאר כלום, החזר מחרוזת ברירת מחדל
  return slug || 'category';
}

/**
 * לוגיקת חישוב אבות קטגוריה (מוציאה מערך אובייקטים).
 * @param categoryId - ID של הקטגוריה שעבורה מחפשים אבות.
 * @param allCategories - מילון של כל הקטגוריות.
 * @returns מערך של אובייקטי Category המייצגים את האבות מהשורש עד להורה הישיר.
 */
function getAncestorsLogic(categoryId: string, allCategories: Record<string, Category>): Category[] {
  const ancestors: Category[] = [];
  let current = allCategories[categoryId];
  if (!current) return ancestors; // בדיקת בטיחות

  let parentId = current.parentId;
  while (parentId) {
    const parent = allCategories[parentId];
    if (parent) {
      ancestors.unshift(parent); // הוסף להתחלה לשמירת סדר
      parentId = parent.parentId;
    } else {
      console.warn(`[CategoryStore] Parent category ${parentId} not found while getting ancestors for ${categoryId}`);
      break; // עצור אם הורה חסר
    }
  }
  return ancestors;
}

/**
 * לוגיקת חישוב כל הצאצאים של קטגוריה (מערך אובייקטים).
 * @param categoryId - ID של קטגוריית האב.
 * @param allCategories - מילון של כל הקטגוריות.
 * @returns מערך של אובייקטי Category המייצגים את כל הצאצאים (לא כולל כאלה בארכיון).
 */
function getDescendantsLogic(categoryId: string, allCategories: Record<string, Category>): Category[] {
    const baseCategory = allCategories[categoryId];
    if (!baseCategory) return [];
    const pathPrefix = baseCategory.path + '/';
    return Object.values(allCategories).filter(
        cat => !cat.archived && cat.path.startsWith(pathPrefix)
    );
}

// ==============================
// 📐 סכמות Zod לוולידציה פנימית (מורחבות ומחודדות)
// ==============================
const newCategorySchema = z.object({
  name: z.string({ required_error: "Category name is required." })
         .trim().min(1, "Category name cannot be empty."),
  parentId: z.string().uuid("Invalid parent ID format.").nullable(), // ודא שזה UUID אם אתה משתמש ב-uuidv4
  // אופציונליים
  icon: z.string().trim().optional(),
  description: z.string().trim().optional(),
  hierarchyType: z.string().trim().optional(),
  localizedNames: z.record(z.string()).optional(),
  facets: z.record(z.union([z.string(), z.boolean(), z.number()])).optional(),
  aliases: z.record(z.array(z.string())).optional(),
  relatedCategoryIds: z.array(z.string().uuid("Invalid related category ID format.")).optional(),
});

const updateCategorySchema = z.object({
  name: z.string().trim().min(1, "Category name cannot be empty.").optional(),
  icon: z.string().trim().optional(),
  description: z.string().trim().optional(),
  sortOrder: z.number().int().optional(),
  hidden: z.boolean().optional(),
  archived: z.boolean().optional(),
  localizedNames: z.record(z.string()).optional(),
  aliases: z.record(z.array(z.string())).optional(),
  facets: z.record(z.union([z.string(), z.boolean(), z.number()])).optional(),
  hierarchyType: z.string().trim().optional(),
  relatedCategoryIds: z.array(z.string().uuid("Invalid related category ID format.")).optional(),
  // --- שדות שלא ניתנים לעדכון ישיר בפעולה זו ---
  // parentId, slug, path, pathIds, depth, version, createdAt, updatedAt, id
}).partial(); // Partial מבטיח שכל השדות אופציונליים לעדכון


// ==============================
// 🏦 הגדרת ה-Store עצמו
// ==============================
interface CategoryState {
  categories: Record<string, Category>;
  isLoading: boolean;
  error: string | null; // מחזיק הודעת שגיאה אחרונה
  _hasHydrated: boolean;
}

interface CategoryActions {
  // --- CRUD & Move ---
  addCategory: (data: NewCategoryData) => Category | null;
  updateCategory: (id: string, data: UpdateCategoryData) => boolean;
  deleteCategory: (id: string, hardDelete?: boolean) => boolean;
  moveCategory: (data: MoveCategoryData) => boolean;

  // --- Query Helpers (using extracted logic) ---
  getCategoryById: (id: string) => Category | undefined;
  getChildren: (parentId: string | null) => Category[];
  getAncestors: (categoryId: string) => Category[];
  getDescendants: (categoryId: string) => Category[];
  getFullPathObjects: (categoryId: string) => Category[];
  getFullPathString: (categoryId: string, separator?: string) => string;
  findCategoryBySlugPath: (path: string) => Category | undefined;

  // --- Actions for Advanced Fields (Signatures only - for future) ---
  setCategoryAliases: (id: string, aliases: Category['aliases']) => void;
  // ... (שאר הפעולות המתקדמות כחתימות) ...

  // --- Meta ---
  _setError: (context: string, error: unknown) => void; // מקבל קונטקסט ושגיאה
  _clearError: () => void;
}

type CategoryStore = CategoryState & CategoryActions;

// --- יצירת ה-Store ---
export const useCategoryStore = create<CategoryStore>()(
  persist(
    immer((set, get) => ({
      // --- Initial State ---
      categories: {}, isLoading: true, error: null, _hasHydrated: false,

      // --- Meta Actions Implementation ---
      _setError: (context, error) => {
          let errorMessage = `[${context}] An unexpected error occurred.`;
          if (error instanceof Error) {
              errorMessage = `[${context}] Error: ${error.message}`;
          } else if (typeof error === 'string') {
              errorMessage = `[${context}] Error: ${error}`;
          } else if (error instanceof ZodError) {
              // עיצוב טוב יותר לשגיאות Zod
              errorMessage = `[${context}] Validation Error: ${JSON.stringify(error.flatten().fieldErrors)}`;
          }
          console.error(errorMessage, error); // הדפס את השגיאה המלאה ללוג
          set({ error: errorMessage, isLoading: false });
      },
      _clearError: () => set({ error: null }),

      // --- CRUD Actions Implementation (משופר) ---
      addCategory: (data) => {
        console.log('[CategoryStore] Attempting to add category...', data);
        get()._clearError(); // נקה שגיאות קודמות
        // 1. ולידציה
        const parseResult = newCategorySchema.safeParse(data);
        if (!parseResult.success) {
          get()._setError('addCategory Validation', parseResult.error);
          return null;
        }
        const validatedData = parseResult.data;

        // 2. חישובים
        const now = new Date().toISOString();
        const parentId = validatedData.parentId; // Zod מבטיח שזה string | null
        const parent = parentId ? get().getCategoryById(parentId) : null;

        if (parentId && !parent) {
          get()._setError('addCategory', `Parent category with id ${parentId} not found.`);
          return null;
        }

        const depth = (parent?.depth ?? -1) + 1;

        // יצירת slug ייחודי
        let slug = generateSafeSlug(validatedData.name);
        const siblings = get().getChildren(parentId);
        let counter = 1;
        const baseSlug = slug;
        while (siblings.some(s => s.slug === slug)) { slug = `${baseSlug}-${++counter}`; }

        const path = parent ? `${parent.path}/${slug}` : slug;
        const newId = uuidv4();

        // 3. הרכבת האובייקט
        const newCategory: Category = {
          // --- שדות חובה ---
          id: newId,
          name: validatedData.name, // Zod כבר עשה trim אם הגדרנו
          slug: slug,
          parentId: parentId,
          path: path,
          depth: depth,
          createdAt: now,
          updatedAt: now,
          // --- שדות אופציונליים מהקלט ---
          icon: validatedData.icon,
          description: validatedData.description,
          hierarchyType: validatedData.hierarchyType,
          localizedNames: validatedData.localizedNames,
          facets: validatedData.facets,
          aliases: validatedData.aliases,
          relatedCategoryIds: validatedData.relatedCategoryIds,
          // --- ברירות מחדל לשדות אחרים מהטיפוס המלא ---
          isLeaf: true,
          version: 1,
          archived: false,
          hidden: false,
          isSystemCategory: false,
          // ... אפשר להוסיף עוד ...
        };

        // 4. עדכון המצב
        set((state) => {
          state.categories[newId] = newCategory;
          if (parent && parent.isLeaf) {
             if (state.categories[parent.id]) { // בדיקת בטיחות
                state.categories[parent.id].isLeaf = false;
                state.categories[parent.id].updatedAt = now;
             }
          }
        });
        console.log("✅ [CategoryStore] Category added:", newCategory);
        return newCategory;
      },

      updateCategory: (id, data) => {
        console.log(`[CategoryStore] Attempting to update category ${id}...`, data);
        get()._clearError();
        const category = get().getCategoryById(id);
        if (!category) { get()._setError('updateCategory', `Category ${id} not found.`); return false; }

        // ולידציה
        const parseResult = updateCategorySchema.safeParse(data);
        if (!parseResult.success) { get()._setError('updateCategory Validation', parseResult.error); return false; }
        const validatedData = parseResult.data;

        // ** חשוב: ודא שלא מנסים לעדכן שדות אסורים דרך כאן **
        // (הסכמה כבר מגבילה, אבל טוב לוודא)
        if ('parentId' in validatedData || 'slug' in validatedData || 'path' in validatedData || 'depth' in validatedData) {
            const msg = `Update failed: Cannot change parentId, slug, path, or depth using updateCategory. Use moveCategory if needed.`;
            console.error(msg, {id, data}); get()._setError('updateCategory', msg); return false;
        }

        const now = new Date().toISOString();
        set((state) => {
            if(state.categories[id]) { // בדיקת בטיחות
                state.categories[id] = {
                    ...category, // השתמש בערך שנשמר מחוץ ל-set
                    ...validatedData, // דרוס עם הערכים המותרים שעברו ולידציה
                    version: (category.version ?? 1) + 1,
                    updatedAt: now
                };
            }
        });
        console.log("✅ [CategoryStore] Category updated:", get().getCategoryById(id));
        return true;
      },

      deleteCategory: (id, hardDelete = false) => {
          console.log(`[CategoryStore] Attempting to ${hardDelete ? 'hard delete' : 'archive'} category ${id}...`);
          get()._clearError();
          const category = get().getCategoryById(id);
          if (!category) { get()._setError('deleteCategory', `Category ${id} not found.`); return false; }

          const children = get().getChildren(id); // ילדים לא בארכיון
          const policy = category.orphanPolicy ?? 'prevent-delete';

          if (hardDelete) {
              console.warn(`[CategoryStore] Hard delete requested for ${id}. Checking policy: ${policy}`);
              if (children.length > 0) {
                  if (policy === 'prevent-delete') {
                      get()._setError('deleteCategory', `Cannot hard delete category ${id}, it has children.`);
                      return false;
                  }
                  // TODO: Implement 'cascade' and 'reassign-root' logic for hard delete
                  console.error(`[CategoryStore] Hard delete policy '${policy}' not fully implemented yet for children.`);
                  get()._setError(`Hard delete policy '${policy}' not fully implemented yet.`);
                  return false; // מנע מחיקה חלקית
              }
              // TODO: טיפול בפריטים המקושרים לקטגוריה שנמחקת? (למשל, לאפס categoryId שלהם)

              set(state => { delete state.categories[id]; });
              console.log("✅ [CategoryStore] Category hard deleted:", id);
              return true;
          } else { // Soft delete (archive)
              const now = new Date().toISOString();
              set((state) => {
                  if(state.categories[id]) {
                      state.categories[id].archived = true;
                      state.categories[id].hidden = true; // הגיוני להסתיר גם
                      state.categories[id].updatedAt = now;
                      state.categories[id].version = (category.version ?? 1) + 1;
                  }
              });
              console.log("✅ [CategoryStore] Category archived:", id);
              return true;
          }
      },

      moveCategory: (data) => {
        console.log(`[CategoryStore] Attempting to move category ${data.categoryId} under ${data.newParentId}...`);
        get()._clearError();
        // --- לוגיקה חזקה מהגרסה הקודמת שלך ---
        const { categoryId, newParentId } = data;
        const allCategories = get().categories;
        const movingCategory = allCategories[categoryId];
        const currentParentId = movingCategory?.parentId;

        // 1. בדיקות תקינות
        if (!movingCategory) { get()._setError(`Move failed: Category ${categoryId} not found.`); return false; }
        if (categoryId === newParentId) { get()._setError("Move failed: Cannot move category under itself."); return false; }
        const newParent = newParentId ? allCategories[newParentId] : null;
        if (newParentId && !newParent) { get()._setError(`Move failed: New parent ${newParentId} not found.`); return false; }
        if (newParent && (newParent.path === movingCategory.path || newParent.path.startsWith(movingCategory.path + '/'))) {
             get()._setError("Move failed: Cannot move category under its own descendant."); return false;
        }
        if (movingCategory.parentId === newParentId) {
             console.log("[CategoryStore] Move skipped: Category already under the target parent.");
             return true; // אין צורך בשינוי
        }

        const now = new Date().toISOString();
        const oldPathPrefix = movingCategory.path;
        const oldDepth = movingCategory.depth;

        // 2. חישוב עומק ונתיב בסיס חדשים
        const newDepth = (newParent?.depth ?? -1) + 1;
        const newPathBase = newParent ? `${newParent.path}/${movingCategory.slug}` : movingCategory.slug;

        // 3. מצא את כל הצאצאים (כולל עצמו)
        const descendantsIncludingSelf = [movingCategory, ...getDescendantsLogic(categoryId, allCategories)];
        const updates: Record<string, Partial<Category>> = {};

        // 4. חשב עדכונים לכל צומת
        descendantsIncludingSelf.forEach(node => {
            const currentRelativePath = node.path.substring(oldPathPrefix.length);
            const newPath = newPathBase + currentRelativePath;
            const newDepthForNode = newDepth + (node.depth - oldDepth);
            updates[node.id] = {
                parentId: node.id === categoryId ? newParentId : node.parentId,
                path: newPath,
                depth: newDepthForNode,
                updatedAt: now,
                version: (node.version ?? 1) + 1
            };
        });

        // 5. עדכן את המצב
        set(state => {
            for (const id in updates) {
                if (state.categories[id]) {
                    Object.assign(state.categories[id], updates[id]);
                } else {
                    console.warn(`[CategoryStore] Node ${id} not found during move update batch.`);
                }
            }
             // עדכון isLeaf להורים
             const currentCategories = state.categories;
             const hasOtherChildren = (pId: string | null) =>
                 Object.values(currentCategories).some(c => c.parentId === pId && c.id !== categoryId && !c.archived);

             const oldParent = oldParentId ? currentCategories[oldParentId] : null;
             if(oldParent && !hasOtherChildren(oldParentId)) {
                  if (state.categories[oldParentId]) state.categories[oldParentId].isLeaf = true;
             }
             if(newParent && newParent.isLeaf){
                  if (state.categories[newParentId!]) state.categories[newParentId!].isLeaf = false;
             }
        });

        console.log(`✅ [CategoryStore] Category ${categoryId} moved successfully.`);
        return true;
      },


      // --- Query Helpers Implementation (using external logic) ---
      getCategoryById: (id) => get().categories[id],
      getChildren: (parentId) => Object.values(get().categories).filter(cat => cat.parentId === parentId && !cat.archived),
      getAncestors: (categoryId) => getAncestorsLogic(categoryId, get().categories),
      getDescendants: (categoryId) => getDescendantsLogic(categoryId, get().categories),
      getFullPathObjects: (categoryId) => {
          const category = get().getCategoryById(categoryId);
          if (!category) return [];
          return [...get().getAncestors(categoryId), category];
      },
      getFullPathString: (categoryId, separator = ' > ') => {
          return get().getFullPathObjects(categoryId).map(cat => cat.name).join(separator);
      },
      findCategoryBySlugPath: (path) => Object.values(get().categories).find(cat => cat.path === path && !cat.archived),

      // --- Placeholders for Advanced Actions ---
      setCategoryAliases: (id, aliases) => set(state => { /* ... update logic + version/updatedAt ... */ }),
      setCategoryFacets: (id, facets) => set(state => { /* ... update logic + version/updatedAt ... */ }),
      // ... (rest of placeholders with basic set implementation) ...

    })), // סיום immer
    // --- הגדרות Persist Middleware ---
    {
      name: 'homi-category-storage-v1',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? browserLocalForageStorage : noopStorage)),
      partialize: (state) => ({ categories: state.categories }),
      onRehydrateStorage: () => (state, error) => {
         // (לוגיקה משופרת מעט לבטיחות)
         console.log("🔄 [CategoryStore] onRehydrateStorage: Attempting rehydration...");
         let hydrationError = error ? "Failed to load categories from storage." : null;
         let loadedCategories = state?.categories ?? {}; // קח את מה ש-persist הצליח לטעון

         // טען נתונים ראשוניים רק אם באמת לא נטען כלום והטעינה הראשונית הצליחה
         if (!error && (!loadedCategories || Object.keys(loadedCategories).length === 0) && typeof initialCategories !== 'undefined' && initialCategories?.length > 0) {
            try {
                console.log("💾 [CategoryStore] Hydration resulted in empty state. Loading initial category data...");
                loadedCategories = arrayToRecord(initialCategories);
            } catch(initError) {
                console.error("🚨 [CategoryStore] Failed to process initial categories:", initError);
                hydrationError = "Failed to process initial categories.";
            }
         }

         // קבע את המצב הסופי
         useCategoryStore.setState({
             _hasHydrated: true,
             isLoading: false,
             error: hydrationError,
             // עדכן את הקטגוריות רק אם הן שונות מהמצב ההתחלתי הריק
             ...(Object.keys(loadedCategories).length > 0 && { categories: loadedCategories })
         });

         if (hydrationError && error) console.error("❌ [CategoryStore] Failed to rehydrate:", error); // שגיאה מקורית מהאחסון
         else if (hydrationError) console.error("❌ [CategoryStore] Hydration error:", hydrationError); // שגיאה מעיבוד הנתונים הראשוניים
         else console.log("✅ [CategoryStore] Hydration finished successfully.");
       },
      version: 1,
    }
  )
);

// --- Selectors ---
export const useCategoriesRecord = () => useCategoryStore((state) => state.categories);
export const useCategoriesArray = () => useCategoryStore((state) => Object.values(state.categories).filter(c => !c.archived));
export const useCategoryIsLoading = () => useCategoryStore((state) => state.isLoading);
export const useCategoryError = () => useCategoryStore((state) => state.error);
export const useCategoryHasHydrated = () => useCategoryStore((state) => state._hasHydrated);
export const useCategoryById = (id: string | undefined | null) => useCategoryStore((state) => id ? state.getCategoryById(id) : undefined);
export const useChildCategories = (parentId: string | null) => useCategoryStore((state) => state.getChildren(parentId));
// ... (אפשר להוסיף עוד סלקטורים שקוראים לפונקציות get האחרות) ...