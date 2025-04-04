"use client";

import React, { useMemo } from 'react';
import { useForm, SubmitHandler, Controller, FieldErrors } from 'react-hook-form'; // הוספנו FieldErrors
import { zodResolver } from '@hookform/resolvers/zod';

// --- ייבואים ---
import { addItemSchema, AddItemSchemaType } from '@/lib/schemas/itemSchema';
import { useHomiStore } from '@/store/useHomiStore';
// [+] ייבוא הקבועים מהטיפוסים (בהנחה שהעברת אותם לשם)
import { ItemStatus, ItemCondition, NewItemData, availableStatuses, availableConditions } from '@/types/homi';
// [+] ייבוא פונקציית העזר מהקובץ שלה
import { prepareCategoriesForSelect } from '@/features/utils/categoryUtils'; // ודא נתיב
import { useCategoryStore } from '@/features/store/categoryStore';
import { Category } from '@/features/types.ts/category';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { TagInput } from '@/components/ui/TagInput';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// --- רשימות קבועות הוסרו מכאן ---

// =====================================
// [+] קומפוננטת עזר להצגת שגיאות
// =====================================
interface FormErrorProps {
  errors: FieldErrors<AddItemSchemaType>;
  name: keyof AddItemSchemaType; // קבלת שם השדה באופן בטוח
}

const FormError: React.FC<FormErrorProps> = ({ errors, name }) => {
  const error = errors[name];
  if (!error || !error.message) {
    return null;
  }
  // Use type assertion here as error.message should be string based on zod
  return <p className="text-red-500 text-sm mt-1">{error.message as string}</p>;
};


// --- הקומפוננטה הראשית ---
export default function AddItemForm() {
  const addItem = useHomiStore((state) => state.addItem);
  const { categories: categoriesRecord, isLoading: categoriesLoading, _hasHydrated: categoriesHydrated } = useCategoryStore(state => ({
      categories: state.categories, isLoading: state.isLoading, _hasHydrated: state._hasHydrated,
  }));

  // [+] שימוש בפונקציית עזר מיובאת
  const categoryOptions = useMemo(() => {
      return prepareCategoriesForSelect(categoriesRecord);
  }, [categoriesRecord]);

  const { register, handleSubmit, formState: { errors }, reset, setValue, control, watch } = useForm<AddItemSchemaType>({
    resolver: zodResolver(addItemSchema),
    defaultValues: { /* ... */ },
  });

  const currentStatus = watch('status');
  const currentCondition = watch('condition');

  const onSubmit: SubmitHandler<AddItemSchemaType> = (data) => {
    console.log("📤 Submitting form data:", data); // לעקוב אחרי מה נשלח
    try {
      addItem(data as NewItemData); // השתמש בפונקציית Zustand
      toast.success("Item added successfully!");
      reset(); // אפס טופס
    } catch (error) {
      console.error("❌ Error adding item:", error);
      toast.error("Failed to add item.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl mx-auto p-4 border rounded-md">
      <h3 className="text-xl font-semibold text-gray-800">Add New Item</h3>

      {/* Name */}
      <div>
        <Label htmlFor="name">Name *</Label>
        <Input id="name" {...register('name')} />
        <FormError errors={errors} name="name" /> {/* [+] שימוש בקומפוננטת שגיאה */}
      </div>

      {/* Room */}
      <div>
        <Label htmlFor="roomName">Room *</Label>
        <Input id="roomName" {...register('roomName')} />
        <FormError errors={errors} name="roomName" /> {/* [+] שימוש בקומפוננטת שגיאה */}
      </div>

      {/* Location */}
      <div>
        <Label htmlFor="location">Location *</Label>
        <Input id="location" {...register('location')} />
        <FormError errors={errors} name="location" /> {/* [+] שימוש בקומפוננטת שגיאה */}
      </div>

      {/* Quantity */}
      <div>
        <Label htmlFor="quantity">Quantity</Label>
        <Input type="number" id="quantity" {...register('quantity', { valueAsNumber: true })} />
        <FormError errors={errors} name="quantity" /> {/* [+] שימוש בקומפוננטת שגיאה */}
      </div>

      {/* Status */}
      <div>
        <Label htmlFor="status">Status</Label>
        <div className="flex items-center gap-2">
          <Select value={currentStatus ?? ''} onValueChange={(value) => setValue('status', value as ItemStatus | '')}>
            <SelectTrigger><SelectValue placeholder="-- Select Status --" /></SelectTrigger>
            <SelectContent>
              {availableStatuses.map((status) => (<SelectItem key={status} value={status}>{status.replace('-', ' ')}</SelectItem>))}
            </SelectContent>
          </Select>
          <Button type="button" onClick={() => setValue('status', '')} /*...*/ >Clear</Button>
        </div>
        <FormError errors={errors} name="status" /> {/* [+] שימוש בקומפוננטת שגיאה */}
      </div>

      {/* Condition */}
      <div>
        <Label htmlFor="condition">Condition</Label>
        <div className="flex items-center gap-2">
          <Select value={currentCondition ?? ''} onValueChange={(value) => setValue('condition', value as ItemCondition | '')}>
            <SelectTrigger><SelectValue placeholder="-- Select Condition --" /></SelectTrigger>
            <SelectContent>
              {availableConditions.map((cond) => (<SelectItem key={cond} value={cond}>{cond}</SelectItem>))}
            </SelectContent>
          </Select>
          <Button type="button" onClick={() => setValue('condition', '')} /*...*/ >Clear</Button>
        </div>
        <FormError errors={errors} name="condition" /> {/* [+] שימוש בקומפוננטת שגיאה */}
      </div>

      {/* Category */}
      <div>
        <Label htmlFor="categoryId">Category</Label>
        <Controller
          name="categoryId"
          control={control}
          render={({ field }) => (
            <Select value={field.value ?? ''} onValueChange={(value) => field.onChange(value === '' ? '' : value)} disabled={!categoriesHydrated || categoriesLoading}>
              <SelectTrigger className="mt-1">
                 {(!categoriesHydrated || categoriesLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                 <SelectValue placeholder="-- Select Category --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">-- No Category --</SelectItem>
                {categoryOptions.map((cat) => ( <SelectItem key={cat.id} value={cat.id}> {cat.name} </SelectItem> ))}
                {/* ... הודעת טעינה / אין קטגוריות ... */}
              </SelectContent>
            </Select>
          )}
        />
        <FormError errors={errors} name="categoryId" /> {/* [+] שימוש בקומפוננטת שגיאה */}
      </div>

      {/* Tags */}
      <div>
        <Label htmlFor="tags">Tags (press Enter or comma to add)</Label>
        <Controller name="tags" control={control} render={({ field }) => (<TagInput id="tags" value={field.value ?? []} onChange={field.onChange} /*...*/ />)} />
        <FormError errors={errors} name="tags" /> {/* [+] שימוש בקומפוננטת שגיאה */}
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" {...register('notes')} />
        <FormError errors={errors} name="notes" /> {/* [+] שימוש בקומפוננטת שגיאה */}
      </div>

      {/* Submit */}
      <Button type="submit" disabled={!categoriesHydrated || categoriesLoading}>
        {(!categoriesHydrated || categoriesLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
         Add Item
      </Button>
    </form>
  );
}