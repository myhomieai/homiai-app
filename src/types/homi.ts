// ==============================
// HomiAI Core Types Definition
// ==============================

/**
 * סטטוסים אפשריים לפריט במלאי.
 * כולל מצב תפעולי (בשימוש, באחסון) ומצב לוגיסטי (חסר, להחלפה, מלאי).
 */
export type ItemStatus =
  | 'in use'
  | 'in storage'
  | 'lent out'        // הושאל
  | 'to replace'      // יש להחליף / נגמר
  | 'archived'        // הועבר לארכיון (לא בשימוש פעיל)
  | 'in stock'        // במלאי (רלוונטי למתכלים)
  | 'low stock'       // מלאי נמוך
  | 'out of stock';   // אזל מהמלאי

/**
 * מצב פיזי של הפריט.
 */
export type ItemCondition =
  | 'new'
  | 'like new'
  | 'good'
  | 'fair'
  | 'poor'
  | 'broken';

/**
 * שיטת התיעוד האחרונה של הפריט.
 */
export type SeenMethod = 'manual' | 'auto' | 'camera' | 'scan' | 'unknown';

/**
 * הממשק הראשי המייצג פריט במערכת HomiAI.
 * כולל פרטים בסיסיים, מיקום, סטטוס, מידע "חכם", פרטי רכישה ועוד.
 */
export interface Item {
  // --- שדות ליבה ---
  id: string;                   // מזהה ייחודי (נוצר אוטומטית)
  name: string;                 // שם הפריט (חובה)
  roomName: string;             // שם החדר הכללי (חובה)
  location: string;             // מיקום מפורט בחדר (חובה)
  quantity: number;             // כמות (חובה, ברירת מחדל תיקבע ב-store)
  createdAt: string;            // תאריך יצירה ISO (נוצר אוטומטית)
  updatedAt: string;            // תאריך עדכון אחרון ISO (מתעדכן אוטומטית)

  // --- שדות ליבה אופציונליים ---
  status?: ItemStatus;          // סטטוס הפריט
  tags?: string[];              // תגיות לסינון
  notes?: string;               // הערות טקסט חופשי

  // --- שדות חכמים (אופציונליים) ---
  condition?: ItemCondition;    // מצב פיזי
  lastSeenAt?: string;          // תאריך ISO של התיעוד האחרון (יכול להתעדכן אוטומטית)
  seenMethod?: SeenMethod;      // איך תועד (ברירת מחדל 'manual')
  lastSeenBy?: string;          // מי תיעד אחרון (למערכת רב-משתמשים)
  lastMovedFrom?: string;       // המיקום הקודם

  // --- שדות נוספים (אופציונליים) ---
  category?: string;            // קטגוריה ראשית
  photoUri?: string;            // נתיב/URL לתמונה
  furnitureName?: string;       // שם רהיט ספציפי
  brand?: string;               // מותג
  modelNumber?: string;         // מספר דגם
  serialNumber?: string;        // מספר סידורי
  color?: string;               // צבע
  linkedItemIds?: string[];     // מזהים של פריטים מקושרים

  // --- רכישה ואחריות (אופציונליים) ---
  purchaseDate?: string;        // תאריך רכישה ISO
  purchasePrice?: number;       // מחיר רכישה
  currency?: string;            // מטבע רכישה (e.g., 'ILS', 'USD')
  storeOrVendor?: string;       // חנות/ספק
  warrantyEndDate?: string;     // תאריך סיום אחריות ISO
  receiptOrInvoiceUri?: string; // נתיב/URL לקבלה

  // --- שדות עתידיים אפשריים ---
  // expirationDate?: string;
  // usageFrequency?: 'daily' | 'weekly' | 'monthly' | 'rarely';
  // isFavorite?: boolean;
  // isHidden?: boolean;
  // locationHistory?: { location: string; date: string; }[];
}

// ==============================
// Helper Types for Store Actions
// ==============================

/**
 * הטיפוס המשמש ליצירת פריט חדש.
 * דורש את שדות הליבה ההכרחיים, ומאפשר הוספת שדות אופציונליים רלוונטיים ליצירה.
 */
type NewItemBase = Pick<Item, 'name' | 'roomName' | 'location'>;
type NewItemOptional = Partial<Pick<Item,
    'category' | 'photoUri' | 'furnitureName' | 'tags' | 'status' | 'condition' |
    'notes' | 'purchaseDate' | 'purchasePrice' | 'currency' | 'storeOrVendor' |
    'warrantyEndDate' | 'receiptOrInvoiceUri' | 'brand' | 'modelNumber' |
    'serialNumber' | 'color' | 'linkedItemIds' | 'quantity' // Quantity is optional here, default handled in store
>>;
export type NewItemData = NewItemBase & NewItemOptional;


/**
 * הטיפוס המשמש לעדכון פריט קיים.
 * מאפשר עדכון של כל שדה פרט ל-id ו-createdAt.
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