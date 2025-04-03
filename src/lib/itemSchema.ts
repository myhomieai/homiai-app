import { z } from 'zod';
import { ItemStatus, ItemCondition } from '@/types/homi'; // ודא נתיב נכון

const availableStatuses: [ItemStatus, ...ItemStatus[]] = [
  'in use', 'in storage', 'lent out', 'to replace',
  'archived', 'in stock', 'low stock', 'out of stock'
];
const availableConditions: [ItemCondition, ...ItemCondition[]] = [
  'new', 'like new', 'good', 'fair', 'poor', 'broken'
];

// =========================================================
// --- סכמת Zod מומלצת ומתוקנת ---
// =========================================================
export const addItemSchema = z.object({
  // שדות חובה
  name: z.string().min(1, { message: "Item name is required." }).max(100),
  roomName: z.string().min(1, { message: "Room name is required." }).max(100),
  location: z.string().min(1, { message: "Specific location is required." }).max(150),

  // שדות אופציונליים
  quantity: z.coerce.number({ invalid_type_error: "Quantity must be a number." })
            .int().min(1).optional(),

  // --- שימוש ב-z.union כדי לאפשר '' או ערך מה-enum ---
  status: z.union([z.literal(''), z.enum(availableStatuses)])
          .optional(),

  // --- שימוש ב-z.union כדי לאפשר '' או ערך מה-enum ---
  condition: z.union([z.literal(''), z.enum(availableConditions)])
             .optional(),

  // --- ההגדרה הנכונה עבור tags כמערך ---
  tags: z.array(z.string().min(1, { message: "Tag cannot be empty." }))
        .optional(),

  notes: z.string().max(500).optional(),
});

export type AddItemSchemaType = z.infer<typeof addItemSchema>;