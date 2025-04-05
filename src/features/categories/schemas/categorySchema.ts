// src/features/categories/schemas/categorySchema.ts
import { z } from 'zod';

// Helper for validating/transforming date strings or Date objects to ISO strings
const zIsoDateString = (errorMessage = "Invalid ISO 8601 date time string format.") =>
  z.preprocess(
    // הפונקציה שתרוץ לפני הולידציה:
    (arg) => {
      // אם הקלט הוא אובייקט Date, המר אותו למחרוזת ISO
      if (arg instanceof Date) {
        return arg.toISOString();
      }
      // אחרת (אם הוא כבר מחרוזת או משהו אחר), החזר אותו כמו שהוא
      return arg;
    },
    // הולידציה שתרוץ אחרי ה-preprocess: ודא שזו מחרוזת בפורמט datetime
    z.string().datetime({ message: errorMessage })
  );

// Schema for CREATING a new category
export const newCategorySchema = z.object({
  name: z
    .string({ required_error: 'Category name is required.' })
    .trim()
    .min(1, 'Category name cannot be empty.'),
  parentId: z.string().uuid('Invalid parent ID format.').nullable().optional(), // Allow null or undefined for root
  icon: z.string().trim().optional(),
  description: z.string().trim().optional(),
  // [+] הוספנו sortOrder פעם אחת בלבד
  sortOrder: z.number().int('Sort order must be an integer.').optional(),
  // --- שאר השדות ---
  hierarchyType: z.string().trim().optional(),
  localizedNames: z.record(z.string()).optional(), // key=locale, value=name
  facets: z.record(z.union([z.string(), z.boolean(), z.number()])).optional(), // key=facetName, value=facetValue
  aliases: z.record(z.array(z.string())).optional(), // key=locale or type, value=array of aliases
  relatedCategoryIds: z.array(z.string().uuid('Invalid related category ID format.')).optional(),
});

// Type inferred from the schema for creating data
export type NewCategoryData = z.infer<typeof newCategorySchema>;


// Schema for UPDATING an existing category
export const updateCategorySchema = z
  .object({
    // Fields that can be updated
    name: z.string().trim().min(1, 'Category name cannot be empty.').optional(),
    icon: z.string().trim().optional(),
    description: z.string().trim().optional(),
    sortOrder: z.number().int('Sort order must be an integer.').optional(), // Already here, OK
    hidden: z.boolean().optional(),
    archived: z.boolean().optional(),
    localizedNames: z.record(z.string()).optional(),
    aliases: z.record(z.array(z.string())).optional(),
    facets: z.record(z.union([z.string(), z.boolean(), z.number()])).optional(),
    hierarchyType: z.string().trim().optional(),
    relatedCategoryIds: z.array(z.string().uuid('Invalid related category ID format.')).optional(),
    // Add other updatable fields from Category type if needed
    // Note: Does NOT include parentId, slug, path, depth - these are handled by moveCategory
  })
  .partial(); // Makes all fields optional for partial updates

// Type inferred from the schema for updating data
export type UpdateCategoryData = z.infer<typeof updateCategorySchema>;


// [+] סכמה לולידציה של אובייקט Category מלא מיובא
// ודא שהיא תואמת במדויק לטיפוס Category שלך ב-src/types/category.ts
// (הגדרנו אותה כאן פעם אחת בלבד)
export const fullCategorySchema = z.object({
  // שדות חובה בסיסיים שסביר לצפות בייבוא
  id: z.string().uuid({ message: "Imported category ID must be a valid UUID." }),
  name: z.string().min(1, { message: "Imported category name cannot be empty." }),
  slug: z.string().min(1, { message: "Imported category slug cannot be empty." }), // Require for validation consistency
  path: z.string().min(1, { message: "Imported category path cannot be empty." }), // Require for validation consistency
  depth: z.number().int().min(0, { message: "Imported category depth must be 0 or greater." }), // Require for validation consistency
  parentId: z.string().uuid().nullable(), // Allow null for root, require UUID otherwise
  createdAt: zIsoDateString("Invalid createdAt format."), // <-- שימוש בפונקציית העזר
  updatedAt: zIsoDateString("Invalid updatedAt format."), // <-- שימוש בפונקציית העזר
  // שדות נוספים - אופציונליים או עם ברירת מחדל
  isLeaf: z.boolean().optional(), // Can be recalculated
  version: z.number().int().min(1).optional(), // Will be managed internally
  archived: z.boolean().optional().default(false),
  hidden: z.boolean().optional().default(false),
  isSystemCategory: z.boolean().optional().default(false),
  orphanPolicy: z.enum(['prevent-delete', 'cascade', 'reassign-root']).optional(),
  icon: z.string().trim().optional(),
  description: z.string().trim().optional(),
  sortOrder: z.number().int().optional(), // Matches Category type
  localizedNames: z.record(z.string()).optional(),
  relatedCategoryIds: z.array(z.string().uuid()).optional(),
  aliases: z.record(z.array(z.string())).optional(),
  facets: z.record(z.union([z.string(), z.boolean(), z.number()])).optional(),
  hierarchyType: z.string().trim().optional(),
  // הוסף/הסר הערות מהשדות הבאים בהתאם להגדרת הטיפוס Category שלך
  // pathIds: z.array(z.string().uuid()).optional(),
  // aiHints: z.any().optional(),
  // embedding: z.array(z.number()).optional(),
  // externalReferences: z.any().optional(),
  // accessControl: z.any().optional(),
}).passthrough(); // Using passthrough for flexibility as before

// [+] סכמה למערך של קטגוריות (לשימוש ב-importCategoriesFromJson) - מוגדרת פעם אחת בלבד
export const fullCategorySchemaArray = z.array(fullCategorySchema);