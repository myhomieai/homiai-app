"use client"; 

// ייבוא הקומפוננטות הנדרשות
import ItemList from "@/components/ItemList"; 
import AddItemForm from "@/components/AddItemForm"; // <-- ייבוא שהיה חסר

// ייבוא מיותר - אפשר למחוק אם לא משתמשים בו יותר
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