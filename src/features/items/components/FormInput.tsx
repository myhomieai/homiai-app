"use client";
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FieldErrors } from 'react-hook-form';
import type { AddItemSchemaType } from '@/features/items/schemas/itemSchema';
import { FormError } from './FormError';

interface FormInputProps {
  label: string;
  id: keyof AddItemSchemaType;
  register: (name: keyof AddItemSchemaType) => any; 
  errors: FieldErrors<AddItemSchemaType>;
  required?: boolean;
  type?: string;
  defaultValue?: string | number;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  id,
  register,
  errors,
  required = false,
  type = 'text',
  defaultValue,
}) => {
  return (
    <div>
      <Label htmlFor={id}>
        {label}
        {required && ' *'}
      </Label>
      <Input
        id={id}
        type={type}
        defaultValue={defaultValue}
        {...register(id)}
        aria-invalid={!!errors[id]}
      />
      {/* מציגים הודעת שגיאה ספציפית לשדה */}
      <FormError errors={errors} name={id} />
    </div>
  );
};