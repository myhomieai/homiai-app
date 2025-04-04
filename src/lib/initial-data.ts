import { v4 as uuidv4 } from 'uuid';
import slugify from 'slugify';
import { Category } from '@/features/types.ts/category'; // Adjust import path if needed

// Helper function for slug generation (identical to what you use in your store)
function generateSafeSlug(name: string): string {
  const slug = slugify(name?.trim() ?? '', {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@?]/g,
    trim: true,
  });
  return slug || 'category';
}

const now = new Date().toISOString();

// --- Define IDs ---
const id_root_electronics = uuidv4();
const id_sub_computing = uuidv4();
const id_sub_laptops = uuidv4();
const id_sub_accessories = uuidv4();
const id_sub_audio_video = uuidv4();
const id_sub_headphones = uuidv4();
const id_sub_tvs = uuidv4();

const id_root_furniture = uuidv4();
const id_sub_seating = uuidv4();
const id_sub_tables = uuidv4();
const id_sub_storage_furniture = uuidv4();

const id_root_kitchen = uuidv4();
const id_sub_appliances = uuidv4();
const id_sub_cookware = uuidv4();

const id_root_clothing = uuidv4();
const id_sub_clothing_men = uuidv4();
const id_sub_clothing_women = uuidv4();

const id_root_documents = uuidv4();
const id_root_tools = uuidv4();
const id_root_other = uuidv4();

// --- The initial array of categories ---
export const initialCategories: Category[] = [
  // ========================
  //         Electronics
  // ========================
  {
    id: id_root_electronics,
    name: 'Electronics',
    slug: generateSafeSlug('Electronics'),
    parentId: null,
    path: 'electronics',
    depth: 0,
    createdAt: now,
    updatedAt: now,
    isLeaf: false,
    orphanPolicy: 'prevent-delete',
    hidden: false,
    archived: false,
    version: 1,
  },
  {
    id: id_sub_computing,
    name: 'Computing',
    slug: generateSafeSlug('Computing'),
    parentId: id_root_electronics,
    path: 'electronics/computing',
    depth: 1,
    createdAt: now,
    updatedAt: now,
    isLeaf: false,
    orphanPolicy: 'prevent-delete',
    hidden: false,
    archived: false,
    version: 1,
  },
  {
    id: id_sub_laptops,
    name: 'Laptops',
    slug: generateSafeSlug('Laptops'),
    parentId: id_sub_computing,
    path: 'electronics/computing/laptops',
    depth: 2,
    createdAt: now,
    updatedAt: now,
    isLeaf: true,
    orphanPolicy: 'prevent-delete',
    hidden: false,
    archived: false,
    version: 1,
  },
  {
    id: id_sub_accessories,
    name: 'Accessories',
    slug: generateSafeSlug('Accessories'),
    parentId: id_sub_computing,
    path: 'electronics/computing/accessories',
    depth: 2,
    createdAt: now,
    updatedAt: now,
    isLeaf: true, // e.g., keyboards, mice
    orphanPolicy: 'prevent-delete',
    hidden: false,
    archived: false,
    version: 1,
  },
  {
    id: id_sub_audio_video,
    name: 'Audio/Video',
    slug: generateSafeSlug('Audio/Video'),
    parentId: id_root_electronics,
    path: 'electronics/audio-video',
    depth: 1,
    createdAt: now,
    updatedAt: now,
    isLeaf: false,
    orphanPolicy: 'prevent-delete',
    hidden: false,
    archived: false,
    version: 1,
  },
  {
    id: id_sub_headphones,
    name: 'Headphones',
    slug: generateSafeSlug('Headphones'),
    parentId: id_sub_audio_video,
    path: 'electronics/audio-video/headphones',
    depth: 2,
    createdAt: now,
    updatedAt: now,
    isLeaf: true,
    orphanPolicy: 'prevent-delete',
    hidden: false,
    archived: false,
    version: 1,
  },
  {
    id: id_sub_tvs,
    name: 'Televisions',
    slug: generateSafeSlug('Televisions'),
    parentId: id_sub_audio_video,
    path: 'electronics/audio-video/televisions',
    depth: 2,
    createdAt: now,
    updatedAt: now,
    isLeaf: true,
    orphanPolicy: 'prevent-delete',
    hidden: false,
    archived: false,
    version: 1,
  },

  // ========================
  //         Furniture
  // ========================
  {
    id: id_root_furniture,
    name: 'Furniture',
    slug: generateSafeSlug('Furniture'),
    parentId: null,
    path: 'furniture',
    depth: 0,
    createdAt: now,
    updatedAt: now,
    isLeaf: false,
    orphanPolicy: 'prevent-delete',
    hidden: false,
    archived: false,
    version: 1,
  },
  {
    id: id_sub_seating,
    name: 'Seating',
    slug: generateSafeSlug('Seating'),
    parentId: id_root_furniture,
    path: 'furniture/seating',
    depth: 1,
    createdAt: now,
    updatedAt: now,
    isLeaf: true, // e.g., chairs, sofas
    orphanPolicy: 'prevent-delete',
    hidden: false,
    archived: false,
    version: 1,
  },
  {
    id: id_sub_tables,
    name: 'Tables',
    slug: generateSafeSlug('Tables'),
    parentId: id_root_furniture,
    path: 'furniture/tables',
    depth: 1,
    createdAt: now,
    updatedAt: now,
    isLeaf: true,
    orphanPolicy: 'prevent-delete',
    hidden: false,
    archived: false,
    version: 1,
  },
  {
    id: id_sub_storage_furniture,
    name: 'Storage Furniture',
    slug: generateSafeSlug('Storage Furniture'),
    parentId: id_root_furniture,
    path: 'furniture/storage-furniture',
    depth: 1,
    createdAt: now,
    updatedAt: now,
    isLeaf: true, // e.g., cabinets, shelves
    orphanPolicy: 'prevent-delete',
    hidden: false,
    archived: false,
    version: 1,
  },

  // ========================
  //          Kitchen
  // ========================
  {
    id: id_root_kitchen,
    name: 'Kitchen',
    slug: generateSafeSlug('Kitchen'),
    parentId: null,
    path: 'kitchen',
    depth: 0,
    createdAt: now,
    updatedAt: now,
    isLeaf: false,
    orphanPolicy: 'prevent-delete',
    hidden: false,
    archived: false,
    version: 1,
  },
  {
    id: id_sub_appliances,
    name: 'Appliances',
    slug: generateSafeSlug('Appliances'),
    parentId: id_root_kitchen,
    path: 'kitchen/appliances',
    depth: 1,
    createdAt: now,
    updatedAt: now,
    isLeaf: true, // e.g., mixer, toaster
    orphanPolicy: 'prevent-delete',
    hidden: false,
    archived: false,
    version: 1,
  },
  {
    id: id_sub_cookware,
    name: 'Cookware',
    slug: generateSafeSlug('Cookware'),
    parentId: id_root_kitchen,
    path: 'kitchen/cookware',
    depth: 1,
    createdAt: now,
    updatedAt: now,
    isLeaf: true, // e.g., pots, pans
    orphanPolicy: 'prevent-delete',
    hidden: false,
    archived: false,
    version: 1,
  },

  // ========================
  //         Clothing
  // ========================
  {
    id: id_root_clothing,
    name: 'Clothing',
    slug: generateSafeSlug('Clothing'),
    parentId: null,
    path: 'clothing',
    depth: 0,
    createdAt: now,
    updatedAt: now,
    isLeaf: false,
    orphanPolicy: 'prevent-delete',
    hidden: false,
    archived: false,
    version: 1,
  },
  {
    id: id_sub_clothing_men,
    name: "Men's Clothing",
    slug: generateSafeSlug("Men's Clothing"),
    parentId: id_root_clothing,
    path: 'clothing/men-s-clothing', // slugify might produce 'men-s-clothing'
    depth: 1,
    createdAt: now,
    updatedAt: now,
    isLeaf: true,
    orphanPolicy: 'prevent-delete',
    hidden: false,
    archived: false,
    version: 1,
  },
  {
    id: id_sub_clothing_women,
    name: "Women's Clothing",
    slug: generateSafeSlug("Women's Clothing"),
    parentId: id_root_clothing,
    path: 'clothing/women-s-clothing', // slugify might produce 'women-s-clothing'
    depth: 1,
    createdAt: now,
    updatedAt: now,
    isLeaf: true,
    orphanPolicy: 'prevent-delete',
    hidden: false,
    archived: false,
    version: 1,
  },

  // ========================
  //  Other Top-Level Roots
  // ========================
  {
    id: id_root_documents,
    name: 'Documents',
    slug: generateSafeSlug('Documents'),
    parentId: null,
    path: 'documents',
    depth: 0,
    createdAt: now,
    updatedAt: now,
    isLeaf: true,
    orphanPolicy: 'prevent-delete',
    hidden: false,
    archived: false,
    version: 1,
  },
  {
    id: id_root_tools,
    name: 'Tools',
    slug: generateSafeSlug('Tools'),
    parentId: null,
    path: 'tools',
    depth: 0,
    createdAt: now,
    updatedAt: now,
    isLeaf: true,
    orphanPolicy: 'prevent-delete',
    hidden: false,
    archived: false,
    version: 1,
  },
  {
    id: id_root_other,
    name: 'Other',
    slug: generateSafeSlug('Other'),
    parentId: null,
    path: 'other',
    depth: 0,
    createdAt: now,
    updatedAt: now,
    isLeaf: true,
    orphanPolicy: 'prevent-delete',
    hidden: false,
    archived: false,
    version: 1,
  },
];
