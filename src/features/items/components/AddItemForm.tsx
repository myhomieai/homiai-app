"use client";

import React, { useMemo } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { addItemSchema, AddItemSchemaType } from '@/features/items/schemas/itemSchema';
import { useHomiStore } from '@/store';
import { useCategoryStore } from '@/store';
import {
  ItemStatus,
  ItemCondition,
  NewItemData,
  availableStatuses,
  availableConditions,
} from '@/types/homi';
import { prepareCategoriesForSelect } from '@/features/categories/utils';
import { useTranslation } from 'next-i18next';

// UI Components
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { TagInput } from '@/components/ui/TagInput';
import { FormError } from './FormError';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';

export default function AddItemForm() {
  const { t } = useTranslation('items');

  // 1. שימוש בסלקטורים פרימיטיביים לזוסטנד כדי למנוע לולאות אינסופיות
  const addItem = useHomiStore((state) => state.addItem);
  const homiStoreHydrated = useHomiStore((state) => state._hasHydrated);
  
  const categoriesRecord = useCategoryStore((state) => state.categories);
  const categoriesLoading = useCategoryStore((state) => state.isLoading);
  const categoriesHydrated = useCategoryStore((state) => state._hasHydrated);
  const categoriesError = useCategoryStore((state) => state.error);

  // 2. סינון ערכים לא חוקיים - ממוזכר נכון
  const filteredStatuses = useMemo(() => {
    // נשאיר רק ערכים תקינים
    return availableStatuses.filter(Boolean);
  }, []);

  const filteredConditions = useMemo(() => {
    // נשאיר רק ערכים תקינים
    return availableConditions.filter(Boolean);
  }, []);

  // 3. הכנת אפשרויות קטגוריה
  const categoryOptions = useMemo(() => {
    if (!categoriesHydrated || !categoriesRecord) return [];
    return prepareCategoriesForSelect(categoriesRecord);
  }, [categoriesRecord, categoriesHydrated]);

  // 4. הגדרת הטופס
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
    control,
    setValue,
    watch,
  } = useForm<AddItemSchemaType>({
    resolver: zodResolver(addItemSchema),
    defaultValues: {
      name: '',
      roomName: '',
      location: '',
      quantity: 1,
      status: undefined,
      condition: undefined,
      categoryId: undefined,
      tags: [],
      notes: '',
    },
  });

  // מעקב אחרי שדות שנבחרו
  const selectedStatus = watch('status');
  const selectedCondition = watch('condition');
  const selectedCategory = watch('categoryId');

  // 5. הגשת הטופס
  const onSubmit: SubmitHandler<AddItemSchemaType> = async (data) => {
    try {
      const dataToSubmit: NewItemData = {
        ...data,
        categoryId: data.categoryId || null,
        status: data.status || undefined,
        condition: data.condition || undefined,
        quantity: data.quantity ?? 1,
      };

      await addItem(dataToSubmit);
      toast.success(t('item_added_success'));
      reset();
    } catch (error) {
      console.error('❌ Error adding item:', error);
      toast.error(t('item_add_failed'));
    }
  };

  // שיטה חדשה - ניקוי כל הטופס
  const handleClearForm = () => {
    if (window.confirm(t('confirm_clear_form'))) {
      reset();
      toast.info(t('form_cleared'));
    }
  };

  // 6. מצב טעינה
  if (!homiStoreHydrated) {
    return <FormSkeleton />;
  }

  // טיפול בשגיאת טעינת קטגוריות
  if (categoriesError) {
    return (
      <Card className="max-w-xl mx-auto border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">{t('error_loading_data')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{t('categories_load_error')}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            {t('try_again')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 7. רינדור הטופס
  return (
    <ErrorBoundary fallback={<p>{t('form_error')}</p>}>
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>{t('add_new_item')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* שדות קבוצה 1: פרטים בסיסיים */}
            <fieldset className="space-y-4 p-4 border rounded-md">
              <legend className="text-sm font-medium px-2">{t('basic_details')}</legend>
              
              {/* Name */}
              <div className="space-y-1">
                <Label htmlFor="name">{t('name')} <span className="text-red-500">*</span></Label>
                <Input 
                  id="name" 
                  {...register('name')} 
                  aria-invalid={!!errors.name}
                  aria-describedby="name-error"
                  placeholder={t('name_placeholder')}
                  data-testid="item-name"
                />
                <FormError errors={errors} name="name" />
              </div>

              {/* Room */}
              <div className="space-y-1">
                <Label htmlFor="roomName">{t('room')} <span className="text-red-500">*</span></Label>
                <Input 
                  id="roomName" 
                  {...register('roomName')} 
                  aria-invalid={!!errors.roomName}
                  aria-describedby="roomName-error"
                  placeholder={t('room_placeholder')}
                  data-testid="item-room"
                />
                <FormError errors={errors} name="roomName" />
              </div>

              {/* Location */}
              <div className="space-y-1">
                <Label htmlFor="location">{t('location')} <span className="text-red-500">*</span></Label>
                <Input 
                  id="location" 
                  {...register('location')} 
                  aria-invalid={!!errors.location}
                  placeholder={t('location_placeholder')}
                  data-testid="item-location"
                />
                <FormError errors={errors} name="location" />
              </div>

              {/* Quantity */}
              <div className="space-y-1">
                <Label htmlFor="quantity">{t('quantity')}</Label>
                <Input
                  type="number"
                  id="quantity"
                  min={1}
                  max={9999}
                  {...register('quantity', { valueAsNumber: true })}
                  aria-invalid={!!errors.quantity}
                  data-testid="item-quantity"
                />
                <FormError errors={errors} name="quantity" />
              </div>
            </fieldset>

            {/* שדות קבוצה 2: מידע נוסף */}
            <fieldset className="space-y-4 p-4 border rounded-md">
              <legend className="text-sm font-medium px-2">{t('additional_info')}</legend>
              
              {/* Status */}
              <div className="space-y-1">
                <Label htmlFor="status">{t('status')}</Label>
                <div className="flex items-center gap-2">
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value ?? ""}
                        onValueChange={(value) => {
                          const newValue = value === "" ? undefined : (value as ItemStatus);
                          field.onChange(newValue);
                        }}
                        data-testid="item-status"
                      >
                        <SelectTrigger id="status" aria-invalid={!!errors.status} className="flex-1">
                          <SelectValue placeholder={t('select_status')} />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredStatuses.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {t(`status.${opt}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {selectedStatus && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setValue('status', undefined, { shouldValidate: true })}
                      data-testid="clear-status"
                    >
                      {t('clear')}
                    </Button>
                  )}
                </div>
                <FormError errors={errors} name="status" />
              </div>

              {/* Condition */}
              <div className="space-y-1">
                <Label htmlFor="condition">{t('condition')}</Label>
                <div className="flex items-center gap-2">
                  <Controller
                    name="condition"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value ?? ""}
                        onValueChange={(value) => {
                          const newValue = value === "" ? undefined : (value as ItemCondition);
                          field.onChange(newValue);
                        }}
                        data-testid="item-condition"
                      >
                        <SelectTrigger id="condition" aria-invalid={!!errors.condition} className="flex-1">
                          <SelectValue placeholder={t('select_condition')} />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredConditions.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {t(`condition.${opt}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {selectedCondition && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setValue('condition', undefined, { shouldValidate: true })}
                      data-testid="clear-condition"
                    >
                      {t('clear')}
                    </Button>
                  )}
                </div>
                <FormError errors={errors} name="condition" />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <Label htmlFor="categoryId">{t('category')}</Label>
                <div className="flex items-center gap-2">
                  <Controller
                    name="categoryId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value ?? ""}
                        onValueChange={(value) => {
                          const newValue = value === "" ? undefined : value;
                          field.onChange(newValue);
                        }}
                        disabled={categoriesLoading || !categoriesHydrated}
                        name={field.name}
                        data-testid="item-category"
                      >
                        <SelectTrigger 
                          id="categoryId" 
                          ref={field.ref} 
                          aria-invalid={!!errors.categoryId}
                          className="flex-1"
                        >
                          {categoriesLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          <SelectValue placeholder={
                            categoriesLoading 
                              ? t('loading_categories') 
                              : t('select_category')
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryOptions.length === 0 && !categoriesLoading && (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                              {t('no_categories')}
                            </div>
                          )}
                          {categoryOptions.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {selectedCategory && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setValue('categoryId', undefined, { shouldValidate: true })}
                      data-testid="clear-category"
                    >
                      {t('clear')}
                    </Button>
                  )}
                </div>
                <FormError errors={errors} name="categoryId" />
              </div>
            </fieldset>

            {/* Tags & Notes */}
            <fieldset className="space-y-4 p-4 border rounded-md">
              <legend className="text-sm font-medium px-2">{t('tags_and_notes')}</legend>
              
              {/* Tags */}
              <div className="space-y-1">
                <Label htmlFor="tags">{t('tags')} <span className="text-xs text-gray-500">({t('tags_help')})</span></Label>
                <Controller
                  name="tags"
                  control={control}
                  render={({ field }) => (
                    <TagInput
                      id="tags"
                      value={field.value ?? []}
                      onChange={field.onChange}
                      placeholder={t('tags_placeholder')}
                      className="mt-1"
                      aria-invalid={!!errors.tags}
                      data-testid="item-tags"
                    />
                  )}
                />
                <FormError errors={errors} name="tags" />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <Label htmlFor="notes">{t('notes')}</Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  aria-invalid={!!errors.notes}
                  placeholder={t('notes_placeholder')}
                  rows={4}
                  data-testid="item-notes"
                />
                <FormError errors={errors} name="notes" />
              </div>
            </fieldset>

            {/* כפתורי פעולה */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t">
              <Button 
                type="submit" 
                disabled={categoriesLoading || isSubmitting}
                className="flex-1"
                data-testid="submit-button"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('add_item')}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={handleClearForm}
                disabled={!isDirty || isSubmitting}
                data-testid="clear-button"
              >
                {t('clear_form')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
}

// רכיב סקלטון למצב טעינה
function FormSkeleton() {
  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <Skeleton className="h-8 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-2/3" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="flex gap-3 pt-4">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-10 w-1/2" />
        </div>
      </CardContent>
    </Card>
  );
}