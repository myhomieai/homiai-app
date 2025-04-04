import { z } from 'zod';

// ======================================
// קבועים גלובליים — סטטוסים ומצבים
// ======================================

export const availableStatuses = [
  'in use',
  'in storage',
  'lent out',
  'to replace',
  'archived',
  'in stock',
  'low stock',
  'out of stock',
] as const;

export type ItemStatus = (typeof availableStatuses)[number];

export const availableConditions = [
  'new',
  'like new',
  'good',
  'fair',
  'poor',
  'broken',
] as const;

export type ItemCondition = (typeof availableConditions)[number];

// ======================================
// סכמת Zod עבור AddItemForm
// ======================================

export const addItemSchema = z.object({
  // --- שדות חובה ---
  name: z.string()
    .trim()
    .min(1, { message: 'Item name is required.' })
    .max(100),

  roomName: z.string()
    .trim()
    .min(1, { message: 'Room name is required.' })
    .max(100),

  location: z.string()
    .trim()
    .min(1, { message: 'Specific location is required.' })
    .max(150),

  // --- קטגוריה (אופציונלי) ---
  categoryId: z
    .string()
    .uuid('Invalid category ID format.')
    .nullable()
    .optional(),

  // --- שדות אופציונליים ---
  quantity: z
    .coerce
    .number({ invalid_type_error: 'Quantity must be a number.' })
    .int()
    .min(1)
    .optional(),

  status: z.union([
    z.literal(''),
    z.enum(availableStatuses),
  ]).optional(),

  condition: z.union([
    z.literal(''),
    z.enum(availableConditions),
  ]).optional(),

  tags: z
    .array(z.string().trim().min(1, { message: 'Tag cannot be empty.' }))
    .optional(),

  notes: z
    .string()
    .max(500, { message: 'Notes cannot exceed 500 characters.' })
    .optional()
    .transform((val) => val?.trim() || undefined),
});

// ======================================
// טיפוס TypeScript נגזר מהסכמה
// ======================================

export type AddItemSchemaType = z.infer<typeof addItemSchema>;