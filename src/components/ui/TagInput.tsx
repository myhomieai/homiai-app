"use client";

import React, { useState, KeyboardEvent } from 'react';
import { XIcon } from 'lucide-react';
import { cn } from "@/lib/utils/cn";

interface TagInputProps {
  value?: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  inputClassName?: string;
  chipClassName?: string;
}

export function TagInput({
  value = [],
  onChange,
  placeholder = "Add tags...",
  id,
  className,
  inputClassName,
  chipClassName,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState<string>("");
  // console.log(">>> TagInput rendered - internal inputValue:", inputValue); // הסרנו או הפכנו להערה

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // ======================================================
    // <<< הוספנו כאן עצירת הפצת האירוע >>>
    // e.stopPropagation(); // אפשר לנסות להוסיף את זה - אם כי זה לא אמור להיות נחוץ כאן בדרך כלל
    // ======================================================

    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (newTag && !value.includes(newTag)) {
        onChange([...value, newTag]);
      }
      setInputValue("");
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      handleRemoveTag(value[value.length - 1]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 p-2 border border-input rounded-md bg-background",
        className
      )}
      // onClick הוסר בגרסה קודמת
    >
      {/* הצגת הצ'יפים */}
      {value.map((tag) => (
        <div
          key={tag}
          className={cn(
            "flex items-center gap-1 bg-secondary text-secondary-foreground text-sm px-2 py-0.5 rounded",
            chipClassName
          )}
        >
          <span>{tag}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation(); // חשוב להשאיר את זה
              handleRemoveTag(tag);
            }}
            className="ml-1 rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label={`Remove ${tag}`}
          >
            <XIcon className="size-3 hover:text-destructive" />
          </button>
        </div>
      ))}
      {/* שדה הקלט הפנימי */}
      <input
        key="tag-input-field-static-key" // השארנו את ה-key מהניסיון הקודם
        id={id ?? "tag-input-internal"}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? placeholder : ""}
        className={cn(
          "flex-grow border-none shadow-none focus-visible:ring-0 h-auto p-0 bg-transparent outline-none",
          inputClassName
        )}
      />
    </div>
  );
}