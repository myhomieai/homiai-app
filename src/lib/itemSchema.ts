import { z } from 'zod';
import { ItemStatus, ItemCondition } from '@/types/homi'; // ייבוא הטיפוסים

// --- מערכים של הערכים המותרים ל-enum/union types ---
// (חשוב שיהיו זהים לאלו המוגדרים ב-types/homi.ts ובקומפוננטות)
const availableStatuses: [ItemStatus, ...ItemStatus[]] = [ // מבנה שמבטיח לפחות ערך אחד
  'in use', 'in storage', 'lent out', 'to replace',
  'archived', 'in stock', 'low stock', 'out of stock'
];

const availableConditions: [ItemCondition, ...ItemCondition[]] = [
  'new', 'like new', 'good', 'fair', 'poor', 'broken'
];

// --- סכמת Zod לולידציה של טופס הוספת פריט ---
export const addItemSchema = z.object({
  // שדות חובה
  name: z.string().min(1, { message: "Item name is required." })
          .max(100, { message: "Name cannot exceed 100 characters."}),
  roomName: z.string().min(1, { message: "Room name is required." })
              .max(100, { message: "Room name cannot exceed 100 characters."}),
  location: z.string().min(1, { message: "Specific location is required." })
             .max(150, { message: "Location cannot exceed 150 characters."}),

  // שדות אופציונליים
  quantity: z.coerce // נשתמש ב-coerce כדי להמיר אוטומטית מחרוזת מה-input למספר
            .number({ invalid_type_error: "Quantity must be a number." })
            .int({ message: "Quantity must be a whole number." })
            .min(1, { message: "Quantity must be at least 1." })
            .optional(), // נאפשר השמטה (ברירת המחדל תיקבע ב-store)

  status: z.enum(availableStatuses) // ודא שהערך הוא אחד מהסטטוסים המותרים
          .optional() // השדה אופציונלי
          .or(z.literal('')) // מאפשר גם מחרוזת ריקה (מ-select עם אופציית "All")
          .transform(val => val === '' ? undefined : val), // המר מחרוזת ריקה ל-undefined

  condition: z.enum(availableConditions) // ודא שהערך הוא אחד מהמצבים המותרים
             .optional()
             .or(z.literal(''))
             .transform(val => val === '' ? undefined : val),

  tags: z.string() // נקבל מחרוזת מה-input
         .optional()
         .transform(val => val ? val.split(',').map(tag => tag.trim()).filter(Boolean) : undefined), // נהפוך למערך או undefined

  notes: z.string().max(500, { message: "Notes cannot exceed 500 characters."})
         .optional(),
  
  // שדות נוספים מהטיפוס המלא (כמו brand, purchaseDate וכו')
  // אפשר להוסיף אותם כאן כ-optional אם נרצה לאפשר להזין אותם כבר בטופס ההוספה,
  // או שנדלג עליהם כרגע ונוסיף אותם לטופס העריכה בהמשך.
  // כרגע נשאר עם שדות הליבה שסיכמנו.
});

// --- יצירת טיפוס TypeScript מהסכמה של Zod ---
// זה הטיפוס שנשתמש בו ב-React Hook Form
export type AddItemSchemaType = z.infer<typeof addItemSchema>;