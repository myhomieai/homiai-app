/**
 * src/lib/utils/categoryUtils.ts
 *
 * Utility functions for category management (slug generation,
 * retrieving ancestors/descendants, converting arrays to records, preparing select options etc.).
 */

import slugify from 'slugify'; // ודא שהתקנת: npm install slugify @types/slugify -D
import { Category } from '@/features/types.ts/category'; // ודא שהנתיב נכון

/**
 * Convert an array of Category objects to a Record keyed by category ID.
 */
export function categoriesToRecord(categories: Category[]): Record<string, Category> {
  return categories.reduce((acc, category) => {
    if (category?.id) { // בדיקת בטיחות
      acc[category.id] = category;
    }
    return acc;
  }, {} as Record<string, Category>);
}

/**
 * Generate a "safe" slug by cleaning up input strings
 * and defaulting to 'category' if nothing remains.
 */
export function generateSafeSlug(name: string): string {
  const slug = slugify(name?.trim() ?? '', {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@?]/g, // תווים להסרה
    trim: true,
  });
  return slug || 'category'; // Fallback
}

/**
 * Return a list of ancestor Category objects for the given category.
 */
export function getAncestorsLogic(categoryId: string, allCategories: Record<string, Category>): Category[] {
  const ancestors: Category[] = [];
  let current = allCategories[categoryId];
  if (!current) {
    console.warn(`[CategoryUtils] Category ${categoryId} not found for getAncestorsLogic`);
    return ancestors; // בטיחות
  }

  let parentId = current.parentId;
  while (parentId) {
    const parent = allCategories[parentId];
    if (parent) {
      ancestors.unshift(parent); // הוסף להתחלה לשמירת סדר
      parentId = parent.parentId;
    } else {
      console.warn(`[CategoryUtils] Parent category ${parentId} not found while getting ancestors for ${categoryId}`);
      break; // עצור אם הורה חסר
    }
  }
  return ancestors;
}

/**
 * Return a list of descendant Category objects for the given category
 * (excluding archived categories).
 */
export function getDescendantsLogic(categoryId: string, allCategories: Record<string, Category>): Category[] {
    const baseCategory = allCategories[categoryId];
    if (!baseCategory) {
        console.warn(`[CategoryUtils] Category ${categoryId} not found for getDescendantsLogic`);
        return []; // בטיחות
    }
    const pathPrefix = baseCategory.path + '/';
    return Object.values(allCategories).filter(
        cat => cat.id !== categoryId && !cat.archived && cat.path.startsWith(pathPrefix) // ודאנו שלא כולל את עצמו
    );
}

/**
 * מכינה מערך קטגוריות שטוח ומסודר להצגה ב-Select, כולל הזחה ויזואלית.
 * @param categories - מילון של כל הקטגוריות מה-store.
 * @returns מערך של אובייקטים עם id, name (עם הזחה), ו-depth.
 */
export function prepareCategoriesForSelect(categories: Record<string, Category>): { id: string; name: string; depth: number }[] {
    if (!categories || Object.keys(categories).length === 0) {
        return [];
    }
    // מיון לפי נתיב מבטיח סדר היררכי
    const sorted: Category[] = Object.values(categories)
        .filter(cat => !cat.archived && !cat.hidden) // סנן החוצה לא פעילים/מוסתרים
        .sort((a, b) => a.path.localeCompare(b.path)); // מיין לפי נתיב

    return sorted.map(cat => ({
        id: cat.id,
        // יצירת שם עם רווחים מובילים להזחה ויזואלית
        name: `${'\u00A0\u00A0'.repeat(cat.depth * 2)}${cat.name}`, // u00A0 הוא רווח קשיח
        depth: cat.depth,
    }));
}

// אפשר להוסיף כאן עוד פונקציות עזר בעתיד, למשל לבניית עץ מלא וכו'.