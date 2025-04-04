// =============================================
// HomiAI Core Types (Items, Reminders, etc.)
// Category types are defined in ./category.ts
// =============================================

/**
 * סטטוסים אפשריים לפריט במלאי.
 */
export const availableStatuses = [
  'in use', 'in storage', 'lent out', 'to replace',
  'archived', 'in stock', 'low stock', 'out of stock'
] as const;

export type ItemStatus = typeof availableStatuses[number];

/**
 * מצב פיזי של הפריט.
 */
export const availableConditions = [
  'new', 'like new', 'good', 'fair', 'poor', 'broken'
] as const;

export type ItemCondition = typeof availableConditions[number];

/**
 * שיטת התיעוד האחרונה של הפריט.
 */
export type SeenMethod = 'manual' | 'auto' | 'camera' | 'scan' | 'unknown';

/**
 * הממשק הראשי המייצג פריט במערכת HomiAI.
 */
export interface Item {
  // --- Core Fields ---
  id: string;
  name: string;
  roomName: string;
  location: string;
  quantity: number;
  createdAt: string; // ISO Date String
  updatedAt: string; // ISO Date String

  // --- Category Link ---
  categoryId?: string | null;

  // --- Optional Core ---
  status?: ItemStatus;
  tags?: string[];
  notes?: string;

  // --- Smart Fields (Optional) ---
  condition?: ItemCondition;
  lastSeenAt?: string;
  seenMethod?: SeenMethod;
  lastSeenBy?: string;
  lastMovedFrom?: string;

  // --- Additional Details (Optional) ---
  photoUri?: string;
  furnitureName?: string;
  brand?: string;
  modelNumber?: string;
  serialNumber?: string;
  color?: string;
  linkedItemIds?: string[];

  // --- Purchase & Warranty (Optional) ---
  purchaseDate?: string;
  purchasePrice?: number;
  currency?: string;
  storeOrVendor?: string;
  warrantyEndDate?: string;
  receiptOrInvoiceUri?: string;
}

// ==============================
// Helper Types for Item Store Actions
// ==============================

export type NewItemData = Pick<Item, 'name' | 'roomName' | 'location'> &
  Partial<Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'name' | 'roomName' | 'location'>>;

export type UpdateItemData = Partial<Omit<Item, 'id' | 'createdAt'>>;


// ==============================
// Reminder Related Types
// ==============================

export type ReminderPriority = 'low' | 'medium' | 'high';

export type ReminderType =
  | 'maintenance' | 'warranty' | 'shopping' | 'check status'
  | 'task' | 'note' | 'event' | 'other';

/**
 * תזכורת הקשורה לפריט או משימה כללית.
 */
export interface Reminder {
  id: string;
  title: string;
  dueDate: string; // ISO Date string
  isComplete: boolean;
  createdAt: string;
  itemId?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
  priority?: ReminderPriority;
  type?: ReminderType;
  updatedAt?: string;
  dismissed?: boolean;
  notes?: string;
}

export type NewReminderData = Omit<
  Reminder,
  'id' | 'createdAt' | 'isComplete' | 'updatedAt' | 'dismissed'
>;

export type UpdateReminderData = Partial<Omit<Reminder, 'id' | 'createdAt'>>;