"use client";
import React from 'react';
import type { FieldErrors } from 'react-hook-form';
import type { AddItemSchemaType } from '@/features/items/schemas/itemSchema';

interface FormErrorProps {
  errors: FieldErrors<AddItemSchemaType>;
  name: keyof AddItemSchemaType;
}

export function FormError({ errors, name }: FormErrorProps) {
  const error = errors[name];
  if (!error?.message) return null;
  return <p className="text-red-500 text-sm mt-1">{String(error.message)}</p>;
}