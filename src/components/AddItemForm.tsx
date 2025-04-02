"use client";

import React from 'react';
// ייבוא Controller מ-react-hook-form
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
// ודא שהנתיבים לסכמה, ל-store, לטיפוסים ולרכיבי UI נכונים אצלך
import { addItemSchema, AddItemSchemaType } from '@/lib/itemSchema';
import { useHomiStore } from '@/store/useHomiStore';
import { ItemStatus, ItemCondition, NewItemData } from '@/types/homi';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
// ייבוא הקומפוננטה החדשה שיצרנו
import { TagInput } from '@/components/ui/TagInput';
import { toast } from 'sonner';

// רשימות קבועות (ללא שינוי)
const availableStatuses: ItemStatus[] = [
  'in use', 'in storage', 'lent out', 'to replace',
  'archived', 'in stock', 'low stock', 'out of stock'
];
const availableConditions: ItemCondition[] = [
  'new', 'like new', 'good', 'fair', 'poor', 'broken'
];

// הגדרת הקומפוננטה
export default function AddItemForm() {
  const addItem = useHomiStore((state) => state.addItem);

  // הגדרת react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    control // הוספנו את control כדי להשתמש בו עם Controller
  } = useForm<AddItemSchemaType>({
    resolver: zodResolver(addItemSchema),
    defaultValues: { // ערכים התחלתיים
      name: '',
      roomName: '',
      location: '',
      quantity: 1,
      status: '',
      condition: '',
      tags: [], // <--- שינינו מ-'' למערך ריק
      notes: '',
    },
  });

  // פונקציית השליחה המעודכנת
  // הוספנו הגדרת טיפוס מפורשת ל-data
  const onSubmit = (data: AddItemSchemaType) => {
    // עיבוד סטטוס, מצב והערות (ללא שינוי)
    const finalStatus = data.status === '' ? undefined : data.status as ItemStatus;
    const finalCondition = data.condition === '' ? undefined : data.condition as ItemCondition;
    const finalNotes = data.notes === '' ? undefined : data.notes;

    // --- אין יותר צורך בפיצול התגיות ---
    // const parsedTags = data.tags ... <-- מחקנו את השורות האלה

    // יצירת אובייקט הפריט החדש
    const newItem: NewItemData = {
      name: data.name,
      roomName: data.roomName,
      location: data.location,
      quantity: data.quantity,
      status: finalStatus,
      condition: finalCondition,
      tags: data.tags, // <-- משתמשים ישירות ב-data.tags (שהוא כבר מערך)
      notes: finalNotes,
      // אפשר להוסיף כאן ערכים לשדות נוספים מ-NewItemData אם צריך,
      // למשל: category: undefined, photoUri: undefined, וכו'
    };

    // שליחה ל-store, איפוס והודעה (ללא שינוי)
    addItem(newItem);
    reset();
    toast.success('Item added successfully!');
  };

  // החזרת ה-JSX של הטופס
  return (
    // קושרים את הפונקציה המעודכנת ל-handleSubmit
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl mx-auto p-4 border rounded-md">
      <h3 className="text-xl font-semibold text-gray-800">Add New Item</h3>

      {/* שדות Name, Room, Location, Quantity, Status, Condition, Notes - ללא שינוי */}
      {/* Name */}
      <div>
        <Label htmlFor="name">Name *</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
      </div>

      {/* Room */}
      <div>
        <Label htmlFor="roomName">Room *</Label>
        <Input id="roomName" {...register('roomName')} />
        {errors.roomName && <p className="text-red-500 text-sm mt-1">{errors.roomName.message}</p>}
      </div>

      {/* Location */}
      <div>
        <Label htmlFor="location">Location *</Label>
        <Input id="location" {...register('location')} />
        {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>}
      </div>

      {/* Quantity */}
      <div>
        <Label htmlFor="quantity">Quantity</Label>
        <Input type="number" id="quantity" {...register('quantity', { valueAsNumber: true })} />
        {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>}
      </div>

      {/* Status */}
      <div>
        <Label htmlFor="status">Status</Label>
        <div className="flex items-center gap-2">
          <Select onValueChange={(value) => setValue('status', value as ItemStatus | '')}>
            <SelectTrigger>
              <SelectValue placeholder="-- Select Status --" />
            </SelectTrigger>
            <SelectContent>
              {availableStatuses.map((status) => (
                <SelectItem key={status} value={status}>{status.replace('-', ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setValue('status', '')}
            className="text-xs px-2 h-8"
          >
            Clear
          </Button>
        </div>
        {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>}
      </div>

      {/* Condition */}
      <div>
        <Label htmlFor="condition">Condition</Label>
        <div className="flex items-center gap-2">
          <Select onValueChange={(value) => setValue('condition', value as ItemCondition | '')}>
            <SelectTrigger>
              <SelectValue placeholder="-- Select Condition --" />
            </SelectTrigger>
            <SelectContent>
              {availableConditions.map((cond) => (
                <SelectItem key={cond} value={cond}>{cond}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setValue('condition', '')}
            className="text-xs px-2 h-8"
          >
            Clear
          </Button>
        </div>
        {errors.condition && <p className="text-red-500 text-sm mt-1">{errors.condition.message}</p>}
      </div>


      {/* =============================================== */}
      {/* --- החלפת שדה התגיות הישן בחדש --- */}
      {/* Tags - Updated with TagInput */}
      <div>
        <Label htmlFor="tags">Tags (press Enter or comma to add)</Label>
        <Controller
          name="tags" // שם השדה מהסכמה
          control={control} // אובייקט ה-control מ-useForm
          render={({ field }) => (
            <TagInput
              id="tags"
              // העבר את הערך (תמיד מערך) וה-onChange מה-field
              value={field.value ?? []}
              onChange={field.onChange}
              placeholder="Add a tag..."
              // הוסף className אם צריך עיצוב נוסף
              className="mt-1"
            />
          )}
        />
        {/* הצגת שגיאות עבור שדה התגיות (אם קיימות) */}
        {errors.tags && (
          <p className="text-red-500 text-sm mt-1">
            {/* הודעה כללית, או אפשר לבדוק שגיאות ספציפיות למערך אם צריך */}
            {errors.tags.message || 'Invalid tag input'}
          </p>
        )}
      </div>
      {/* =============================================== */}


      {/* Notes */}
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" {...register('notes')} />
        {errors.notes && <p className="text-red-500 text-sm mt-1">{errors.notes.message}</p>}
      </div>

      {/* Submit */}
      <Button type="submit">Add Item</Button>
    </form>
  );
}