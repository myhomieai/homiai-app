"use client";

import React, { useState, useMemo } from "react";
// ודא שהנתיבים נכונים
import {
  useItems,
  useIsHydrated,
  useHomiLoading,
  useHomiError,
} from "@/store/useHomiStore";
import { Item, ItemStatus } from "@/types/homi";

// רשימות וטיפוסים קבועים
const availableStatuses: ItemStatus[] = [
  'in use', 'in storage', 'lent out', 'to replace',
  'archived', 'in stock', 'low stock', 'out of stock'
];
type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc';

// ============================================================
// --- הגדרת FilterControls נמצאת כאן, מחוץ ל-ItemList ---
// ============================================================
const FilterControls: React.FC<{
  statusFilter: ItemStatus | ""; setStatusFilter: (value: ItemStatus | "") => void;
  tagFilter: string; setTagFilter: (value: string) => void;
  sortBy: SortOption; setSortBy: (value: SortOption) => void;
}> = ({ statusFilter, setStatusFilter, tagFilter, setTagFilter, sortBy, setSortBy }) => (
   <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-center gap-4 p-4 bg-gray-50 rounded-lg shadow-sm flex-wrap">
    {/* Status Filter */}
    <div>
      <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">Status:</label>
      <select
        id="status-filter"
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value as ItemStatus | "")}
        className="block w-full sm:w-auto border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm py-2 pl-3 pr-8"
      >
        <option value="">All</option>
        {availableStatuses.map(status => (
          <option key={status} value={status}>
            {status.replace('-', ' ')}
          </option>
        ))}
      </select>
    </div>
    {/* Tag Filter Input */}
    <div>
      <label htmlFor="tag-filter" className="block text-sm font-medium text-gray-700 mb-1">Tag:</label>
      <input
        type="text"
        id="tag-filter"
        value={tagFilter} // מקושר למצב של ItemList
        onChange={(e) => setTagFilter(e.target.value)} // מעדכן את המצב של ItemList
        placeholder="Enter tag..."
        className="block w-full sm:w-auto border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm py-2 px-3"
       />
    </div>
    {/* Sort By Filter */}
    <div>
      <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-1">Sort By:</label>
      <select
        id="sort-by"
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value as SortOption)}
        className="block w-full sm:w-auto border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm py-2 pl-3 pr-8"
      >
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="name-asc">Name A-Z</option>
        <option value="name-desc">Name Z-A</option>
      </select>
    </div>
   </div>
 );

// =======================================
// --- הגדרת ItemList מתחילה כאן ---
// =======================================
const ItemList: React.FC = () => {
  // --- Hooks ---
  const itemsFromStore = useItems();
  const isHydrated = useIsHydrated();
  const isLoading = useHomiLoading();
  const error = useHomiError();
  // --- State for Filters/Sort ---
  const [statusFilter, setStatusFilter] = useState<ItemStatus | "">("");
  const [tagFilter, setTagFilter] = useState<string>(""); // המצב שמקושר לשדה הסינון
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // לוג לבדיקה (אפשר להסיר כשלא צריך)
  // console.log('ItemList Render - isHydrated:', isHydrated, 'isLoading:', isLoading);

  // --- Memoized Filtering and Sorting ---
  const sortedAndFilteredItems = useMemo(() => {
    let items = [...itemsFromStore];

    // סינון לפי סטטוס
    if (statusFilter) {
      items = items.filter(item => item.status === statusFilter);
    }

    // סינון לפי תגיות (עם הגנות)
    if (tagFilter.trim() !== "") {
      const lowerCaseTag = tagFilter.trim().toLowerCase();
      items = items.filter(item =>
        Array.isArray(item.tags) &&
        item.tags.length > 0 &&
        item.tags.some(tag =>
          typeof tag === "string" &&
          tag.toLowerCase().includes(lowerCaseTag)
        )
      );
    }

    // מיון
    items.sort((a, b) => {
        switch (sortBy) {
          case 'name-asc': return a.name.localeCompare(b.name);
          case 'name-desc': return b.name.localeCompare(a.name);
          case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'newest': default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
    });

    return items;
  }, [itemsFromStore, statusFilter, tagFilter, sortBy]);

  // --- Render Logic ---
  return (
    <div className="mt-6 max-w-7xl mx-auto px-4">
      {/* שימוש בתנאים המשופרים שהוספת קודם */}
      {(!isHydrated || isLoading) && (
        <p className="text-gray-500 text-center mt-6">Loading items...</p>
      )}

      {error && !isLoading && (
        <p className="text-red-500 text-center mt-6">Error loading items: {error}</p>
      )}

      {/* הצגת תוכן רק אחרי טעינה וללא שגיאות */}
      {isHydrated && !isLoading && !error && (
        <>
          {/* שימוש בקומפוננטה שהוגדרה בחוץ */}
          <FilterControls
             statusFilter={statusFilter}
             setStatusFilter={setStatusFilter}
             tagFilter={tagFilter}
             setTagFilter={setTagFilter}
             sortBy={sortBy}
             setSortBy={setSortBy}
          />

          {/* הצגת תוכן הרשימה או הודעות מתאימות */}
          {itemsFromStore.length === 0 ? (
              <p className="text-gray-400 text-center mt-6">No items found. Add some items to get started!</p>
          ) : sortedAndFilteredItems.length === 0 ? (
              <p className="text-gray-400 text-center mt-6">No items match your current filters.</p>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-4 text-center text-gray-700">
                {sortedAndFilteredItems.length} {sortedAndFilteredItems.length === 1 ? 'Item' : 'Items'} Found
              </h2>
              {/* הצגת הרשימה עצמה */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {sortedAndFilteredItems.map((item: Item) => (
                  <div key={item.id} className="p-4 border border-gray-200 rounded-xl shadow-sm bg-white hover:bg-gray-50 transition duration-200 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-600">Room: {item.roomName}</p>
                          {/* אפשר להוסיף כאן פרטים נוספים כמו תגיות, סטטוס וכו' */}
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {/* אפשר להוסיף כאן עוד תוכן אם רוצים */}
                    </div>
                    {/* אפשר להוסיף כאן כפתורים לעריכה/מחיקה */}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}; // סוף ItemList

export default ItemList;