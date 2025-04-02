"use client"; // חובה בגלל useEffect

// ייבוא הקומפוננטות וההוקים
import ItemList from "@/components/ItemList"; // שיניתי לנתיב עם @, שנה אם צריך ל-../components/ItemList
import { useEffect } from 'react';
import localforage from 'localforage';

// --- הגדרת הקומפוננטה הראשית של העמוד ---
export default function Page() { // מקובל לקרוא לקומפוננטה Page בקובץ page.tsx

  // --- ה-useEffect לבדיקת LocalForage ---
  // מיקום נכון: בתוך גוף הקומפוננטה