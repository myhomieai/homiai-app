// src/app/page.tsx
"use client";

// --- ייבוא הקומפוננטות מהמיקום החדש (עם default import) ---
import ItemList from "@/features/items/components/ItemList";         // <-- תוקן ל-default import
import AddItemForm from "@/features/items/components/AddItemForm";   // <-- תוקן ל-default import
// -----------------------------------------------------------

// ייבואים שהיו בהערה נשארים בהערה
// import { useEffect } from 'react';
// import localforage from 'localforage';

export default function Page() {
  // קוד ה-useEffect לבדיקת LocalForage הוסר

  // החלק שמחזיר את ממשק המשתמש (JSX)
  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <h1 className="text-2xl font-bold mb-8">My Home Inventory</h1>

      {/* --- הוספת טופס ההוספה כאן --- */}
      <div className="w-full max-w-xl mb-12 border p-6 rounded-lg shadow-md bg-white">
        <AddItemForm /> {/* <-- התגית שמציגה את הטופס */}
      </div>
      {/* ----------------------------- */}

      {/* הצגת רשימת הפריטים */}
      <div className="w-full">
        <ItemList />
      </div>
    </main>
  );
}