// src/components/categories/CategoryNode.tsx
"use client";

import React from "react";
import { Category } from "@/features/types.ts/category";
import { useCategoryStore } from "@/features/store/categoryStore";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2 } from "lucide-react";

interface CategoryNodeProps {
  category: Category;
  allCategories: Record<string, Category>;
}

export function CategoryNode({ category, allCategories }: CategoryNodeProps) {
  const [expandedCategories, toggleCategoryExpansion] = useCategoryStore((s) => [
    s.expandedCategories,
    s.toggleCategoryExpansion,
  ]);

  const isOpen = expandedCategories.includes(category.id);

  const children = React.useMemo(
    () =>
      Object.values(allCategories)
        .filter(
          (cat) =>
            cat?.parentId === category.id && !cat.archived && !cat.hidden
        )
        .sort(
          (a, b) =>
            (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
            a.name.localeCompare(b.name)
        ),
    [allCategories, category.id]
  );

  return (
    <li>
      <div
        className={`flex items-center justify-between p-1 rounded group cursor-pointer hover:bg-gray-100 transition-colors ${
          isOpen ? "bg-gray-50" : ""
        }`}
        onClick={(e) => {
          e.stopPropagation();
          toggleCategoryExpansion(category.id);
        }}
      >
        <div className="flex items-center">
          {children.length > 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleCategoryExpansion(category.id);
              }}
              className="mr-1 px-1 text-gray-400 hover:text-gray-700"
              aria-label={isOpen ? "Collapse" : "Expand"}
            >
              {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : (
            <span className="inline-block w-[18px] mr-1"></span>
          )}
          <span className="text-sm text-gray-800">{category.name}</span>
        </div>

        <div className="space-x-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-blue-600 hover:bg-blue-100"
            title="Add sub-category"
            onClick={(e) => {
              e.stopPropagation();
              console.log("Add child to", category.id);
            }}
          >
            <Plus size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-green-600 hover:bg-green-100"
            title="Edit category"
            onClick={(e) => {
              e.stopPropagation();
              console.log("Edit", category.id);
            }}
          >
            <Pencil size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-red-600 hover:bg-red-100"
            title="Archive category"
            onClick={(e) => {
              e.stopPropagation();
              console.log("Archive", category.id);
            }}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {isOpen && children.length > 0 && (
        <ul className="space-y-1 mt-1 pl-4 border-l border-gray-200 ml-2">
          {children.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              allCategories={allCategories}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
