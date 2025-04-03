"use client";

import React from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addItemSchema, AddItemSchemaType } from '@/lib/itemSchema'; // ודא נתיב
import { useHomiStore } from '@/store/useHomiStore'; // ודא נתיב
import { ItemStatus, ItemCondition, NewItemData } from '@/types/homi'; // ודא נתיב
import { Input } from '@/components/ui/input'; // ודא נתיב
import { Label } from '@/components/ui/label'; // ודא נתיב
import { Textarea } from '@/components/ui/textarea'; // ודא נתיב
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // ודא נתיב
import { Button } from '@/components/ui/button'; // ודא נתיב
import { TagInput } from '@/components/ui/TagInput'; // ודא נתיב
import { toast } from 'sonner';

const availableStatuses: ItemStatus[] = [
  'in use', 'in storage', 'lent out', 'to replace',
  'archived', 'in stock', 'low stock', 'out of stock'
];
const availableConditions: ItemCondition[] = [
  'new', 'like new', 'good', 'fair', 'poor', 'broken'
];

export default function AddItemForm() {
  console.log("--- AddItemForm RENDERED ---"); // <--- לוג לאבחון

  const addItem = useHomiStore((state) => state.addItem);

  const {
    register, handleSubmit, formState: { errors }, reset, setValue, control
  } = useForm<AddItemSchemaType>({
    resolver: zodResolver(addItemSchema),
    defaultValues: {
      name: '', roomName: '', location: '', quantity: 1,
      status: '', condition: '', tags: [], notes: '',
    },
  });

  const onSubmit = (data: AddItemSchemaType) => {
    console.log("--- AddItemForm: onSubmit called with data:", data); // <--- לוג לאבחון
    const finalStatus = data.status === '' ? undefined : data.status as ItemStatus;
    const finalCondition = data.condition === '' ? undefined : data.condition as ItemCondition;
    const finalNotes = data.notes === '' ? undefined : data.notes;
    const newItem: NewItemData = {
      name: data.name, roomName: data.roomName, location: data.location,
      quantity: data.quantity, status: finalStatus, condition: finalCondition,
      tags: data.tags, notes: finalNotes,
      // שדות אופציונליים אחרים יקבלו undefined אם לא קיימים ב-data
      category: undefined, photoUri: undefined, furnitureName: undefined,
      purchaseDate: undefined, purchasePrice: undefined, currency: undefined,
      storeOrVendor: undefined, warrantyEndDate: undefined, receiptOrInvoiceUri: undefined,
      brand: undefined, modelNumber: undefined, serialNumber: undefined, color: undefined,
      linkedItemIds: undefined
    };
    addItem(newItem);
    reset();
    toast.success('Item added successfully!');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl mx-auto p-4 border rounded-md">
      <h3 className="text-xl font-semibold text-gray-800">Add New Item</h3>

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
            <SelectTrigger><SelectValue placeholder="-- Select Status --" /></SelectTrigger>
            <SelectContent>{availableStatuses.map((status) => (<SelectItem key={status} value={status}>{status.replace('-', ' ')}</SelectItem>))}</SelectContent>
          </Select>
          <Button type="button" variant="outline" size="sm" onClick={() => setValue('status', '')} className="text-xs px-2 h-8">Clear</Button>
        </div>
        {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>}
      </div>

      {/* Condition */}
      <div>
        <Label htmlFor="condition">Condition</Label>
        <div className="flex items-center gap-2">
          <Select onValueChange={(value) => setValue('condition', value as ItemCondition | '')}>
            <SelectTrigger><SelectValue placeholder="-- Select Condition --" /></SelectTrigger>
            <SelectContent>{availableConditions.map((cond) => (<SelectItem key={cond} value={cond}>{cond}</SelectItem>))}</SelectContent>
          </Select>
          <Button type="button" variant="outline" size="sm" onClick={() => setValue('condition', '')} className="text-xs px-2 h-8">Clear</Button>
        </div>
        {errors.condition && <p className="text-red-500 text-sm mt-1">{errors.condition.message}</p>}
      </div>

      {/* Tags */}
      <div>
        <Label htmlFor="tags">Tags (press Enter or comma to add)</Label>
        <Controller
          name="tags"
          control={control}
          render={({ field }) => (
            <TagInput
              id="tags"
              value={field.value ?? []}
              onChange={(newTags) => {
                console.log("--- AddItemForm: RHF Controller onChange called with:", newTags); // <--- לוג לאבחון
                field.onChange(newTags);
              }}
              placeholder="Add a tag..."
              className="mt-1"
            />
          )}
        />
        {errors.tags && (<p className="text-red-500 text-sm mt-1">{errors.tags.message || 'Invalid tag input'}</p>)}
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" {...register('notes')} />
        {errors.notes && <p className="text-red-500 text-sm mt-1">{errors.notes.message}</p>}
      </div>

      <Button type="submit">Add Item</Button>
    </form>
  );
}