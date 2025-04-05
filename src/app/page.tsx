// src/app/page.tsx
"use client";

// --- ייבוא הקומפוננטות מהמיקום החדש (עם default import) ---
import ItemList from "@/features/items/components/ItemList";         // ✅ תקין
import AddItemForm from '@/features/items/components/AddItemForm';// -----------------------------------------------------------

// [+] ייבוא לצורך בדיקת localforage
import { useEffect } from 'react';
import localforage from 'localforage';
// ---------------------------------

export default function Page() {

  // [+] קוד ה-useEffect לבדיקת LocalForage נוסף כאן
  useEffect(() => {
    const testLocalForage = async () => {
      try {
        // הדפסה לקונסול כדי שנוכל לעקוב
        console.log('>>> [TEST] Attempting localforage.setItem...');
        await localforage.setItem('homiTestKey', 'homiTestValue');
        console.log('>>> [TEST] localforage.setItem succeeded.');

        console.log('>>> [TEST] Attempting localforage.getItem...');
        const value = await localforage.getItem('homiTestKey');
        console.log('>>> [TEST] localforage.getItem succeeded. Value:', value);

        console.log('>>> [TEST] Attempting localforage.removeItem...');
        await localforage.removeItem('homiTestKey');
        console.log('>>> [TEST] localforage.removeItem succeeded.');

        console.log('✅✅✅ Direct localforage test PASSED! ✅✅✅');

      } catch (err) {
        // אם נגיע לכאן - זו הבעיה!
        console.error('❌❌❌ Direct localforage test FAILED:', err);
      }
    };
    // הרץ את הבדיקה פעם אחת כשהקומפוננטה נטענת בצד הלקוח
    testLocalForage();
  }, []); // המערך הריק מבטיח ריצה חד-פעמית אחרי Mount
  // ----------------------------------------------------

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