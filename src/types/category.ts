// ==============================
// HomiAI Category Types (v1.0)
// ==============================

export interface Category {
    id: string;
    name: string;
    slug: string;
    parentId?: string | null;
    path: string;
    pathIds?: string[];
    depth: number;
  
    sortOrder?: number;
    icon?: string;
    description?: string;
    isLeaf?: boolean;
  
    isSystemCategory?: boolean;
    hidden?: boolean;
    archived?: boolean;
  
    localizedNames?: Record<string, string>;
    relatedCategoryIds?: string[];
    aliases?: Record<string, string[]>;
    facets?: Record<string, string | boolean | number>;
    hierarchyType?: string;
  
    aiHints?: {
      autoSuggested?: boolean;
      basedOn?: 'image' | 'barcode' | 'description' | 'llm';
      confidence?: number;
    };
    embedding?: number[];
  
    externalReferences?: {
      wikidata?: string;
      schemaOrg?: string;
    };
  
    version?: number;
    orphanPolicy?: 'cascade' | 'reassign-root' | 'prevent-delete';
  
    createdAt: string;
    updatedAt: string;
  }
  
  // ============ טיפוסי עזר =============
  
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
  
  export type UpdateCategoryData = Partial<
    Omit<
      Category,
      'id' | 'createdAt' | 'updatedAt' | 'slug' | 'path' | 'pathIds' | 'depth' | 'version' | 'parentId'
    >
  >;
  
  export type MoveCategoryData = {
    categoryId: string;
    newParentId: string | null;
  };
  