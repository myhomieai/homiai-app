/**
 * src/lib/schemas/categorySchema.ts
 *
 * Zod schemas for validating incoming data structures
 * before creating or updating a Category.
 */

import { z } from 'zod';

export const newCategorySchema = z.object({
  name: z
    .string({ required_error: 'Category name is required.' })
    .trim()
    .min(1, 'Category name cannot be empty.'),
  parentId: z.string().uuid('Invalid parent ID format.').nullable(),
  icon: z.string().trim().optional(),
  description: z.string().trim().optional(),
  hierarchyType: z.string().trim().optional(),
  localizedNames: z.record(z.string()).optional(),
  facets: z.record(z.union([z.string(), z.boolean(), z.number()])).optional(),
  aliases: z.record(z.array(z.string())).optional(),
  relatedCategoryIds: z.array(z.string().uuid('Invalid related category ID format.')).optional(),
});

export type NewCategoryData = z.infer<typeof newCategorySchema>;

export const updateCategorySchema = z
  .object({
    name: z.string().trim().min(1, 'Category name cannot be empty.').optional(),
    icon: z.string().trim().optional(),
    description: z.string().trim().optional(),
    sortOrder: z.number().int().optional(),
    hidden: z.boolean().optional(),
    archived: z.boolean().optional(),
    localizedNames: z.record(z.string()).optional(),
    aliases: z.record(z.array(z.string())).optional(),
    facets: z.record(z.union([z.string(), z.boolean(), z.number()])).optional(),
    hierarchyType: z.string().trim().optional(),
    relatedCategoryIds: z.array(z.string().uuid('Invalid related category ID format.')).optional(),
  })
  .partial();

export type UpdateCategoryData = z.infer<typeof updateCategorySchema>;
