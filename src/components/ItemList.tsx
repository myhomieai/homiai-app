"use client";

import React, { useState, useMemo } from "react";
import {
  useItems,
  useIsHydrated,
  useHomiLoading,
  useHomiError,
} from "@/store/useHomiStore";
import { Item, ItemStatus } from "@/types/homi";

// ודא שהמערך הזה מעודכן עם הסטטוסים האמיתיים שלך
const availableStatuses: ItemStatus[] = [
  'in use', 'in storage', 'lent out', 'to replace',
  'archived', 'in stock', 'low stock', 'out of stock'
];

// --- הגדרת הטיפוס לאפשרויות המיון ---
type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc';

const ItemList: React.FC = () => {
  // --- קריאה לכל ההוקים בתחילת הפונקציה ---
  const itemsFromStore = useItems();
  const isHydrated = useIsHydrated();
  const isLoading = useHomiLoading();
  const error = useHomiError();
  const [statusFilter, setStatusFilter] = useState<ItemStatus | "">("");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // ===========================================
  // --- הוספת הדפסת דיבוג ---
  console.log('ItemList Render - isHydrated:', isHydrated, 'isLoading:', isLoading);
  // ===========================================

  // --- חישוב הפריטים המסוננים והממוינים ---
  // useMemo נקרא כאן, לפני כל return מוקדם אפשרי
  const sortedAndFilteredItems = useMemo(() => {
    // חשוב: התחל עם עותק אם אתה מתכנן למיין בהמשך
    let items = [...itemsFromStore]; // התחל עם עותק

    // 1. סינון לפי סטטוס
    if (statusFilter) {
      items = items.filter(item => item.status === statusFilter);
    }

    // 2. סינון לפי תגית
    if (tagFilter.trim() !== "") {
      const lowerCaseTagFilter = tagFilter.trim().toLowerCase();
      items = items.filter(item =>
        item.tags?.some(tag => tag.toLowerCase().includes(lowerCaseTagFilter))
      );
    }

    // 3. מיון (כפי שהוספנו בשלב 5)
    switch (sortBy) {
      case 'name-asc':
        items.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        items.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'oldest':
        items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'newest':
      default:
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return items;
  }, [itemsFromStore, statusFilter, tagFilter, sortBy]);


  // --- קומפוננטת עזר לפקדי הסינון והמיון ---
   const FilterControls: React.FC<{
    statusFilter: ItemStatus | "";
    setStatusFilter: (value: ItemStatus | "") => void;
    tagFilter: string;
    setTagFilter: (value: string) => void;
    sortBy: SortOption;
    setSortBy: (value: SortOption) => void;
  }> = ({ statusFilter, setStatusFilter, tagFilter, setTagFilter, sortBy, setSortBy }) => (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-center gap-4 p-4 bg-gray-50 rounded-lg shadow-sm flex-wrap">
      {/* Status Filter */}
      <div>
        <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">Status:</label>
        <select id="status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ItemStatus | "")} className="block w-full sm:w-auto border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm py-2 pl-3 pr-8">
          <option value="">All</option>
          {availableStatuses.map(status => (<option key={status} value={status}>{status.replace('-', ' ')}</option>))}
        </select>
      </div>
      {/* Tag Filter */}
      <div>
        <label htmlFor="tag-filter" className="block text-sm font-medium text-gray-700 mb-1">Tag:</label>
        <input type="text" id="tag-filter" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} placeholder="Enter tag..." className="block w-full sm:w-auto border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm py-2 px-3" />
      </div>
      {/* Sort By */}
      <div>
        <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-1">Sort By:</label>
        <select id="sort-by" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="block w-full sm:w-auto border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm py-2 pl-3 pr-8">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
        </select>
      </div>
    </div>
  );


  // --- ה-return הראשי עם התצוגה המותנית ---
  return (
    <div className="mt-6 max-w-7xl mx-auto px-4">

      {/* הצג טעינה אם לא hydrated או בטעינה */}
      {(!isHydrated || isLoading) && (
        <p className="text-gray-500 text-center mt-6">Loading items...</p>
      )}

      {/* הצג שגיאה אם קיימת */}
      {error && !isLoading && ( // הצג שגיאה רק אם לא בטעינה
        <p className="text-red-500 text-center mt-6">Error loading items: {error}</p>
      )}

      {/* הצג פקדים ותוכן רק אחרי הידרציה, ללא טעינה וללא שגיאה */}
      {isHydrated && !isLoading && !error && (
        <>
          <FilterControls
             statusFilter={statusFilter}
             setStatusFilter={setStatusFilter}
             tagFilter={tagFilter}
             setTagFilter={setTagFilter}
             sortBy={sortBy}
             setSortBy={setSortBy}
          />

          {itemsFromStore.length === 0 ? (
              <p className="text-gray-400 text-center mt-6">No items found. Add some items to get started!</p>
          ) : sortedAndFilteredItems.length === 0 ? (
              <p className="text-gray-400 text-center mt-6">No items match your current filters.</p>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-4 text-center text-gray-700">
                {sortedAndFilteredItems.length} {sortedAndFilteredItems.length === 1 ? 'Item' : 'Items'} Found
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {sortedAndFilteredItems.map((item: Item) => (
                  // --- קוד הכרטיסייה (ללא שינוי) ---
                  <div key={item.id} className="p-4 border border-gray-200 rounded-xl shadow-sm bg-white hover:bg-gray-50 transition duration-200 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-600">Room: {item.roomName}</p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ItemList;