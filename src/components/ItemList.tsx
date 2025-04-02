"use client";

import React, { useState, useMemo } from "react"; 
import {
  useItems,
  useIsHydrated,
  useHomiLoading,
  useHomiError,
} from "@/store/useHomiStore";
// --- שינוי כאן: מייבאים גם את ItemStatus ---
import { Item, ItemStatus } from "@/types/homi"; 

// --- שינוי כאן: הגדרת הסטטוסים לפי ה-Union Type שלך ---
const availableStatuses: ItemStatus[] = [
  'in use',
  'in storage',
  'lent out',
  'to replace',
  'archived',
  'in stock',
  'low stock',
  'out of stock'
];

const ItemList: React.FC = () => {
  const itemsFromStore = useItems();
  const isHydrated = useIsHydrated();
  const isLoading = useHomiLoading();
  const error = useHomiError();

  // --- State לניהול ערכי הסינון ---
  // --- שינוי כאן: משתמשים בטיפוס ItemStatus | "" ---
  const [statusFilter, setStatusFilter] = useState<ItemStatus | "">(""); 
  const [tagFilter, setTagFilter] = useState<string>("");

  // --- טיפול במצבי טעינה, הידרציה ושגיאה (ללא שינוי) ---
  if (!isHydrated || isLoading) {
    return <p className="text-gray-500 text-center mt-6">Loading items...</p>;
  }

  if (error) {
    return (
      <p className="text-red-500 text-center mt-6">
        Error loading items: {error}
      </p>
    );
  }

  // --- חישוב הפריטים המסוננים באמצעות useMemo ---
  const filteredItems = useMemo(() => {
    let items = itemsFromStore;

    // 1. סינון לפי סטטוס
    if (statusFilter) { // אם נבחר סטטוס (לא "הכל")
      items = items.filter(item => item.status === statusFilter);
    }

    // 2. סינון לפי תגית
    if (tagFilter.trim() !== "") { // אם הוכנס טקסט לסינון תגיות
      const lowerCaseTagFilter = tagFilter.trim().toLowerCase();
      items = items.filter(item =>
        item.tags?.some(tag => tag.toLowerCase().includes(lowerCaseTagFilter))
      );
    }

    // כאן נוסיף מיון בשלב הבא (שלב 5)
    // items.sort(...);

    return items;
  }, [itemsFromStore, statusFilter, tagFilter]); 

   // --- קומפוננטת עזר לפקדי הסינון ---
   const FilterControls = () => (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-center gap-4 p-4 bg-gray-50 rounded-lg shadow-sm flex-wrap">
      {/* Status Filter */}
      <div>
        <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
          Filter by Status:
        </label>
        <select
          id="status-filter"
          value={statusFilter}
          // --- שינוי כאן: הוספת Type Assertion ל-e.target.value ---
          onChange={(e) => setStatusFilter(e.target.value as ItemStatus | "")} 
          className="block w-full sm:w-auto border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm py-2 pl-3 pr-8"
        >
          <option value="">All Statuses</option>
          {/* לולאה על הסטטוסים האמיתיים */}
          {availableStatuses.map(status => ( 
            <option key={status} value={status}>
              {/* החלפת '-' ברווח (נשאר כי יש לך 'in use' וכו') */}
              {status.replace('-', ' ')} 
            </option>
          ))}
        </select>
      </div>

      {/* Tag Filter */}
      <div>
        <label htmlFor="tag-filter" className="block text-sm font-medium text-gray-700 mb-1">
          Filter by Tag:
        </label>
        <input
          type="text"
          id="tag-filter"
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          placeholder="Enter a tag..."
          className="block w-full sm:w-auto border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm py-2 px-3"
        />
      </div>
       {/* כאן נוסיף את פקד המיון בשלב 5 */}
    </div>
  );


  // --- החזרת ה-UI הראשי ---
  return (
    <div className="mt-6 max-w-7xl mx-auto px-4"> 
      {/* הצגת פקדי הסינון */}
      <FilterControls />

      {/* הצגת התוצאות (ללא שינוי מהותי בלוגיקה) */}
      {itemsFromStore.length === 0 ? (
           <p className="text-gray-400 text-center mt-6">No items found. Add some items to get started!</p>
      ) : filteredItems.length === 0 ? (
           <p className="text-gray-400 text-center mt-6">No items match your current filters.</p>
      ) : (
        <>
          <h2 className="text-xl font-semibold mb-4 text-center text-gray-700">
            {filteredItems.length} {filteredItems.length === 1 ? 'Item' : 'Items'} Found
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item: Item) => (
              <div
                key={item.id}
                className="p-4 border border-gray-200 rounded-xl shadow-sm bg-white hover:bg-gray-50 transition duration-200 flex flex-col justify-between"
              >
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
                  {/* כאן נוסיף תצוגת פרטים נוספים בשלב 6 */}
                </div>
                {/* אזור כפתורים עתידי */}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ItemList;