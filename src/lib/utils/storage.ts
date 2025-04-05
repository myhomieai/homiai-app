// src/lib/utils/storage.ts - הגרסה הנכונה והסופית!
import type localforageType from 'localforage'; // ייבוא הטיפוס להשלמה אוטומטית

console.log("[storage.ts] Initializing localforage..."); // לוג לדיבוג

// [+] שימוש ב-require לייבוא תקין של CommonJS, עם type assertion
const localforage = require('localforage') as typeof localforageType;

// [+] קונפיגורציה חד-פעמית ומרכזית
localforage.config({
  driver: [ // סדר עדיפות מומלץ
    localforage.INDEXEDDB,
    localforage.WEBSQL,
    localforage.LOCALSTORAGE,
  ],
  name: 'HomiAI_Storage', // שם אחיד לאחסון של האפליקציה
  description: 'Main storage for HomiAI',
});

// בדיקה שהדרייבר הוגדר
console.log("[storage.ts] Localforage configured. Driver in use:", localforage.driver());

// [+] ייצוא ברירת מחדל (default export) של האינסטנס המוגדר
export default localforage;