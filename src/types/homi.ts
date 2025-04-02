// 🟡 סטטוס פריטים – משולב משתי הגדרות
export type ItemStatus = 
  | 'in use'
  | 'in storage'
  | 'lent out'
  | 'to replace'
  | 'archived'
  | 'in stock'
  | 'low stock'
  | 'out of stock';

// 🟡 עדיפות תזכורת
export type ReminderPriority = 'low' | 'medium' | 'high';

// 🟡 סוגי תזכורות
export type ReminderType = 
  | 'maintenance'
  | 'warranty'
  | 'shopping'
  | 'check status'
  | 'task'
  | 'note'
  | 'event';

// 🟢 פריט במערכת
export interface Item {
  id: string;
  name: string;
  category?: string;
  photoUri?: string;
  roomName: string;
  furnitureName?: string;

  tags?: string[];         // ← תיוגים חופשיים
  status?: ItemStatus;     // ← סטטוס פריט (משולב)
  quantity: number;        // ← חובה – עם ברירת מחדל ל-1 בקוד
  notes?: string;

  createdAt: string;
  updatedAt: string;
}

// 🟢 תזכורת במערכת
export interface Reminder {
  id: string;
  title: string;
  dueDate: string;
  isRecurring?: boolean;
  recurrenceRule?: string;

  priority?: ReminderPriority;
  type?: ReminderType;
  isComplete: boolean;

  createdAt: string;
  updatedAt?: string;      // ← חדש: מתי עודכנה לאחרונה
  dismissed?: boolean;     // ← חדש: האם נדחתה על ידי המשתמש
  notes?: string;
  itemId?: string;
}

// 🟢 טיפוס יצירת פריט חדש (ה-id והתאריכים נוצרים אוטומטית)
export type NewItemData = Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'quantity'> & {
  quantity?: number;
};

// 🟢 טיפוס עדכון פריט (שדות חלקיים)
export type UpdateItemData = Partial<Omit<Item, 'id' | 'createdAt'>>;

// 🟢 טיפוס יצירת תזכורת חדשה
export type NewReminderData = Omit<
  Reminder,
  'id' | 'createdAt' | 'isComplete' | 'updatedAt' | 'dismissed'
>;

// 🟢 טיפוס עדכון תזכורת
export type UpdateReminderData = Partial<Omit<Reminder, 'id' | 'createdAt'>>;
