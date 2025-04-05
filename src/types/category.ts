/**
 * Defines the core data structure for a Category in HomiAI.
 * This interface reflects all current and future-supported properties.
 * It is tightly coupled with validation schemas (e.g., fullCategorySchema)
 * and used throughout the store, import/export, UI, and APIs.
 */
export interface Category {
  // --- Identification & Hierarchy ---
  id: string;                        // Unique UUID for the category
  name: string;                     // Display name of the category
  slug: string;                     // URL-friendly slug (unique within siblings)
  parentId: string | null;          // Parent category ID, null for root
  path: string;                     // Full slug path (e.g., "electronics/audio/headphones")
  depth: number;                    // Hierarchy level (root = 0)

  // --- Metadata & Presentation ---
  icon?: string;                    // Optional icon (emoji, name, etc.)
  description?: string;             // Optional rich description
  sortOrder?: number;               // Ordering among siblings
  localizedNames?: Record<string, string>; // Translations, e.g., { "en": "Books", "he": "ספרים" }
  aliases?: Record<string, string[]>;       // Synonyms per locale/context
  facets?: Record<string, string | boolean | number>; // Extra metadata for filters/search

  // --- Structure & Relations ---
  pathIds?: string[];               // Ancestor IDs + self
  relatedCategoryIds?: string[];   // Semantic links to other categories
  isLeaf?: boolean;                // True if no active children

  // --- State & Behavior ---
  version?: number;                // Revision number (incremented on update)
  archived?: boolean;              // Soft-delete indicator
  hidden?: boolean;                // Hidden from UI (not deleted)
  isSystemCategory?: boolean;     // True for built-in, immutable categories
  orphanPolicy?: 'prevent-delete' | 'cascade' | 'reassign-root'; // Children behavior on deletion
  hierarchyType?: string;         // Optional tag for tree views (e.g., location vs. category)
  accessControl?: any;            // Placeholder for future permissions (ACL/RBAC/etc.)

  // --- AI & Smart Features ---
  aiHints?: {
    autoSuggested?: boolean;       // True if system-suggested
    basedOn?: 'image' | 'barcode' | 'description' | 'llm';
    confidence?: number;           // Confidence score (0–1)
  };
  embedding?: number[];            // Vector for ML-based matching
  externalReferences?: {
    wikidata?: string;             // External knowledge graph link
    schemaOrg?: string;            // Schema.org identifier
    [key: string]: string | undefined;
  };

  // --- Timestamps ---
  createdAt: string;               // ISO timestamp of creation
  updatedAt: string;               // ISO timestamp of last update
}

/**
 * Data required when creating a new category.
 * Used by UI forms and the addCategory store method.
 * Excludes computed/auto-generated fields.
 */
export type NewCategoryData = {
  name: string;
  parentId?: string | null; // Optional parent (null = root)
  icon?: string;
  description?: string;
  sortOrder?: number;
  localizedNames?: Record<string, string>;
  facets?: Record<string, string | boolean | number>;
  aliases?: Record<string, string[]>;
  relatedCategoryIds?: string[];
  hierarchyType?: string;
};

/**
 * Partial update payload for an existing category.
 * Restricted to editable fields only.
 */
export type UpdateCategoryData = Partial<
  Omit<
    Category,
    | 'id'
    | 'parentId'   // Use moveCategory action
    | 'slug'       // System-managed
    | 'path'       // System-managed
    | 'depth'      // System-managed
    | 'createdAt'  // Set once
    | 'updatedAt'  // Auto-managed
    | 'version'    // Auto-incremented
    | 'isLeaf'     // Derived from children
    | 'pathIds'    // System-managed
    | 'itemCount'  // Not part of this model
    | 'embedding'  // Managed separately
  >
>;

/**
 * Payload for moving a category in the hierarchy.
 * Triggers updates to parentId, path, depth, slug, etc.
 */
export type MoveCategoryData = {
  categoryId: string;
  newParentId: string | null; // null for moving to root
};