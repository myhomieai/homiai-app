// =============================================
// HomiAI Core Types (Items, Reminders, etc.)
// Category types are defined in ./category.ts
// =============================================

/**
 * סטטוסים אפשריים לפריט במלאי.
 */
export type ItemStatus =
  | 'in use' | 'in storage' | 'lent out' | 'to replace' | 'archived'
  | 'in stock' | 'low stock' | 'out of stock';

/**
 * מצב פיזי של הפריט.
 */
export type ItemCondition =
  | 'new' | 'like new' | 'good' | 'fair' | 'poor' | 'broken';

/**
 * שיטת התיעוד האחרונה של הפריט.
 */
export type SeenMethod = 'manual' | 'auto' | 'camera' | 'scan' | 'unknown';

/**
 * הממשק הראשי המייצג פריט במערכת HomiAI.
 */
export interface Item {
  // --- שדות ליבה ---
  id: string;                // מזהה ייחודי (נוצר אוטומטית)
  name: string;               // שם הפריט (חובה)
  roomName: string;           // שם החדר הכללי (חובה)
  location: string;           // מיקום מפורט בחדר (חובה)
  quantity: number;           // כמות (חובה, ברירת מחדל תיקבע ב-store)
  createdAt: string;          // תאריך יצירה ISO (נוצר אוטומטית)
  updatedAt: string;          // תאריך עדכון אחרון ISO (מתעדכן אוטומטית)

  // --- קישור לקטגוריה ---
  categoryId?: string | null; // ID של הקטגוריה, או null אם אין קטגוריה (!!! שונה מ-category)

  // --- שדות ליבה אופציונליים ---
  status?: ItemStatus;        // סטטוס הפריט
  tags?: string[];            // תגיות לסינון
  notes?: string;             // הערות טקסט חופשי

  // --- שדות חכמים (אופציונליים) ---
  condition?: ItemCondition;  // מצב פיזי
  lastSeenAt?: string;        // תאריך ISO של התיעוד האחרון
  seenMethod?: SeenMethod;    // איך תועד (ברירת מחדל 'manual')
  lastSeenBy?: string;        // מי תיעד אחרון (למערכת רב-משתמשים)
  lastMovedFrom?: string;     // המיקום הקודם

  // --- שדות נוספים (אופציונליים) ---
  // category?: string; // <-- הוסר!
  photoUri?: string;          // נתיב/URL לתמונה
  furnitureName?: string;     // שם רהיט ספציפי
  brand?: string;             // מותג
  modelNumber?: string;       // מספר דגם
  serialNumber?: string;      // מספר סידורי
  color?: string;             // צבע
  linkedItemIds?: string[];   // מזהים של פריטים מקושרים

  // --- רכישה ואחריות (אופציונליים) ---
  purchaseDate?: string;      // תאריך רכישה ISO
  purchasePrice?: number;     // מחיר רכישה
  currency?: string;          // מטבע רכישה (e.g., 'ILS', 'USD')
  storeOrVendor?: string;     // חנות/ספק
  warrantyEndDate?: string;   // תאריך סיום אחריות ISO
  receiptOrInvoiceUri?: string; // נתיב/URL לקבלה

  // ... שדות עתידיים אפשריים ...
}

// ==============================
// Helper Types for Item Store Actions
// ==============================

/**
 * הטיפוס המשמש ליצירת פריט חדש.
 */
type NewItemBase = Pick<Item, 'name' | 'roomName' | 'location'>;
// הרשימה עודכנה לכלול categoryId ולהסיר category
type NewItemOptional = Partial<Pick<Item,
  'categoryId' | // <-- עודכן
  'photoUri' | 'furnitureName' | 'tags' | 'status' | 'condition' |
  'notes' | 'purchaseDate' | 'purchasePrice' | 'currency' | 'storeOrVendor' |
  'warrantyEndDate' | 'receiptOrInvoiceUri' | 'brand' | 'modelNumber' |
  'serialNumber' | 'color' | 'linkedItemIds' | 'quantity'
>>;
export type NewItemData = NewItemBase & NewItemOptional;


/**
 * הטיפוס המשמש לעדכון פריט קיים.
 * מאפשר עדכון של כל שדה פרט ל-id ו-createdAt.
 * כולל כעת גם categoryId כיוון שהוא חלק מ-Item.
 */
export type UpdateItemData = Partial<Omit<Item, 'id' | 'createdAt'>>;


// ==============================
// Reminder Related Types
// ==============================

export type ReminderPriority = 'low' | 'medium' | 'high';

export type ReminderType =
  | 'maintenance' | 'warranty' | 'shopping' | 'check status'
  | 'task' | 'note' | 'event';

export interface Reminder {
  id: string;
  title: string;
  dueDate: string; // ISO Date string
  isRecurring?: boolean;
  recurrenceRule?: string; // e.g., RRule string
  priority?: ReminderPriority;
  type?: ReminderType;
  isComplete: boolean;
  createdAt: string; // ISO Date string
  updatedAt?: string; // ISO Date string
  dismissed?: boolean;
  notes?: string;
  itemId?: string; // Optional link to an Item
}

export type NewReminderData = Omit<Reminder, 'id' | 'createdAt' | 'isComplete' | 'updatedAt' | 'dismissed'>;

export type UpdateReminderData = Partial<Omit<Reminder, 'id' | 'createdAt'>>;