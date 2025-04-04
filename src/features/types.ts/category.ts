
/**
 * src/types/category.ts
 *
 * Contains TypeScript interfaces and types related to Category data.
 * This version merges the new fields (aiHints, embedding, externalReferences, etc.)
 * with the existing Category definition.
 */

// ==============================
// HomiAI Category Types (v1.0)
// ==============================

export interface Category {
  id: string;
  name: string;
  slug: string;

  /**
   * Parent category ID (optional). If omitted or null, this category is at the root level.
   */
  parentId?: string | null;

  /**
   * Hierarchical path, such as "food/beverages/tea" or just "electronics".
   */
  path: string;

  /**
   * Array of ancestor IDs (optional). E.g. ["rootId", "foodId", "beverageId"] if needed.
   */
  pathIds?: string[];

  /**
   * Depth in the hierarchy (e.g. 0 for root, 1 for children, 2 for grandchildren, etc.).
   */
  depth: number;

  /**
   * Sorting index or priority (optional).
   */
  sortOrder?: number;

  /**
   * Optional icon reference, can be a string indicating a particular icon asset or URI.
   */
  icon?: string;

  /**
   * Human-readable description for the category.
   */
  description?: string;

  /**
   * Indicates whether this category currently has no active children.
   */
  isLeaf?: boolean;

  /**
   * Whether this category is system-defined (non-removable) or user-created.
   */
  isSystemCategory?: boolean;

  /**
   * Whether this category is hidden from normal views.
   */
  hidden?: boolean;

  /**
   * Whether this category is archived (soft-deleted).
   */
  archived?: boolean;

  /**
   * A map of locale => translated name. e.g. { "en": "Food", "he": "אוכל" }
   */
  localizedNames?: Record<string, string>;

  /**
   * Array of category IDs related to this category (associations or synonyms).
   */
  relatedCategoryIds?: string[];

  /**
   * A map of different alias "types" to arrays of alternative names. e.g. { "common": ["Groceries"] }
   */
  aliases?: Record<string, string[]>;

  /**
   * Additional "facets" or metadata relevant to the category.
   * Could be key-value pairs describing category properties (e.g., "temperature": "cold").
   */
  facets?: Record<string, string | boolean | number>;

  /**
   * A string describing the type of hierarchy used by this category (e.g. "product-type").
   */
  hierarchyType?: string;

  /**
   * Hints from AI about how or why this category was auto-assigned.
   */
  aiHints?: {
    autoSuggested?: boolean;
    basedOn?: 'image' | 'barcode' | 'description' | 'llm';
    confidence?: number;
  };

  /**
   * A vector embedding for advanced AI retrieval, classification, or similarity.
   */
  embedding?: number[];

  /**
   * References to external data sources such as Wikidata, Schema.org, etc.
   */
  externalReferences?: {
    wikidata?: string;
    schemaOrg?: string;
  };

  /**
   * Incremented every time the category is updated.
   */
  version?: number;

  /**
   * Defines how to handle orphaned children when deleting a category:
   * 'prevent-delete' | 'cascade' | 'reassign-root'.
   */
  orphanPolicy?: 'cascade' | 'reassign-root' | 'prevent-delete';

  /**
   * Timestamps
   */
  createdAt: string;  // e.g. ISO string
  updatedAt: string;  // e.g. ISO string
}

// ============ Additional Types =============

/**
 * Used when creating a new category; excludes auto-generated fields like ID, slug, path, etc.
 */
export type NewCategoryData = {
  name: string;
  parentId?: string | null;
  icon?: string;
  description?: string;
  hierarchyType?: string;
  localizedNames?: Record<string, string>;
  facets?: Record<string, string | boolean | number>;
  relatedCategoryIds?: string[];
  aliases?: Record<string, string[]>;
};

/**
 * Used for partial updates of an existing category.
 * Omits fields we do NOT allow the user to update directly (ID, slug, path, etc.).
 * Uses Partial to make all fields optional, but excludes certain fields from any updates.
 */
export type UpdateCategoryData = Partial<
  Omit<
    Category,
    | 'id'
    | 'createdAt'
    | 'updatedAt'
    | 'slug'
    | 'path'
    | 'pathIds'
    | 'depth'
    | 'version'
    | 'parentId'
  >
>;

/**
 * Payload for moving a category under a different parent.
 */
export type MoveCategoryData = {
  categoryId: string;
  newParentId: string | null;
};
