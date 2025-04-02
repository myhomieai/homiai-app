import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import localforage from 'localforage';
import { v4 as uuidv4 } from 'uuid';

// --- ייבוא הטיפוסים העדכניים והמלאים ---
import {
  Item,
  Reminder,
  NewItemData,    // הטיפוס המתוקן
  UpdateItemData, // הטיפוס המתוקן
  NewReminderData,
  UpdateReminderData,
  ItemStatus,
  ReminderPriority,
  ReminderType,
  SeenMethod,
  ItemCondition
} from '@/types/homi';

// --- הגדרת LocalForage (ללא שינוי) ---
localforage.config({
  name: 'HomiAI',
  storeName: 'homi_data_store',
  description: 'Local storage for HomiAI inventory and reminders',
  driver: [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE],
});

// --- מתאם LocalForage (ללא שינוי) ---
const localForageStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const item = await localforage.getItem<string>(name);
      return item ?? null;
    } catch (error) {
      console.error(`Error getting item ${name} from localforage:`, error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await localforage.setItem(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await localforage.removeItem(name);
  },
};

// --- הגדרת טיפוסי המצב (State) והפעולות (Actions) ---
interface HomiState {
  items: Item[]; // משתמש ב-Item המעודכן
  reminders: Reminder[];
  isLoading: boolean;
  error: string | null;
  _hasHydrated: boolean;
}

interface HomiActions {
  // Item CRUD
  addItem: (data: NewItemData) => void; // משתמש ב-NewItemData המעודכן
  updateItem: (id: string, data: UpdateItemData) => void; // משתמש ב-UpdateItemData המעודכן
  deleteItem: (id: string) => void;
  getItemById: (id: string) => Item | undefined;

  // Reminder CRUD
  addReminder: (data: NewReminderData) => void;
  updateReminder: (id: string, data: UpdateReminderData) => void;
  deleteReminder: (id: string) => void;
  getReminderById: (id: string) => Reminder | undefined;
  toggleReminderComplete: (id: string) => void;
  dismissReminder: (id: string) => void;

  // Meta Actions
  clearError: () => void;
  setError: (message: string) => void;
}

type HomiStore = HomiState & HomiActions;

// --- יצירת ה-Zustand Store ---
export const useHomiStore = create<HomiStore>()(
  persist(
    immer((set, get) => ({
      // --- מצב התחלתי ---
      items: [],
      reminders: [],
      isLoading: true,
      error: null,
      _hasHydrated: false,

      // --- Meta Actions ---
      clearError: () => set({ error: null }),
      setError: (message) => set({ error: message, isLoading: false }),

      // --- Item Actions (מותאמים לטיפוסים החדשים) ---
      addItem: (data) => {
        const now = new Date().toISOString();
        const newItem: Item = {
          // שדות חובה שלא מגיעים מ-NewItemBase
          id: uuidv4(),
          createdAt: now,
          updatedAt: now,
          // שדות ליבה מ-NewItemBase
          name: data.name,
          roomName: data.roomName,
          location: data.location,
          // ברירות מחדל / ערכים אוטומטיים לשדות אחרים ב-Item
          quantity: data.quantity ?? 1, // קח מה-data אם סופק, אחרת 1
          lastSeenAt: now,              // ברירת מחדל: זמן היצירה
          seenMethod: 'manual',         // ברירת מחדל: הוספה ידנית
          // מיזוג שאר השדות האופציונליים מ-NewItemOptional אם סופקו
          category: data.category,
          photoUri: data.photoUri,
          furnitureName: data.furnitureName,
          tags: data.tags,
          status: data.status,
          condition: data.condition,
          notes: data.notes,
          purchaseDate: data.purchaseDate,
          purchasePrice: data.purchasePrice,
          currency: data.currency,
          storeOrVendor: data.storeOrVendor,
          warrantyEndDate: data.warrantyEndDate,
          receiptOrInvoiceUri: data.receiptOrInvoiceUri,
          brand: data.brand,
          modelNumber: data.modelNumber,
          serialNumber: data.serialNumber,
          color: data.color,
          linkedItemIds: data.linkedItemIds,
          // שדות נוספים ללא ברירת מחדל כרגע: lastSeenBy, lastMovedFrom
        };
        set((state) => {
          state.items.push(newItem);
          state.error = null;
        });
      },

      updateItem: (id, data) => {
        set((state) => {
          const itemIndex = state.items.findIndex((item) => item.id === id);
          if (itemIndex !== -1) {
            // מיזוג פשוט - דורס רק את השדות שהגיעו ב-data
            state.items[itemIndex] = {
              ...state.items[itemIndex],
              ...data,
              updatedAt: new Date().toISOString(), // עדכון חובה ל-updatedAt
            };
            state.error = null;
          } else {
            get().setError(`Item with id ${id} not found for update.`);
            console.warn(`Item with id ${id} not found for update.`);
          }
        });
      },

      deleteItem: (id) => {
        set((state) => {
          const initialLength = state.items.length;
          state.items = state.items.filter((item) => item.id !== id);
          if(state.items.length < initialLength) {
            state.error = null;
            // מחיקת תזכורות קשורות - חשוב אם רוצים עקביות
            state.reminders = state.reminders.filter(r => r.itemId !== id);
          } else {
            get().setError(`Item with id ${id} not found for deletion.`);
            console.warn(`Item with id ${id} not found for deletion.`);
          }
        });
      },

      getItemById: (id) => get().items.find((item) => item.id === id),

      // --- Reminder Actions (מימוש מלא - ללא שינוי מהותי) ---
      addReminder: (data) => { /* ... (כמו בקוד המלא הקודם) ... */ },
      updateReminder: (id, data) => { /* ... (כמו בקוד המלא הקודם) ... */ },
      deleteReminder: (id) => { /* ... (כמו בקוד המלא הקודם) ... */ },
      getReminderById: (id) => get().reminders.find((reminder) => reminder.id === id),
      toggleReminderComplete: (id) => { /* ... (כמו בקוד המלא הקודם) ... */ },
      dismissReminder: (id) => { /* ... (כמו בקוד המלא הקודם) ... */ },
      // *** להשלמת הקריאות, אני משאיר את פעולות התזכורות מקוצרות כאן ***
      // *** אנא ודא שהמימוש המלא שלהן נשאר אצלך בקובץ מהגרסה הקודמת ***

    })), // סיום immer

    // --- הגדרות Persist Middleware ---
    {
      name: 'homi-app-storage',
      storage: createJSONStorage(() => localForageStorage),
      partialize: (state) => ({
        items: state.items,       // שומר את מבנה ה-Item המלא
        reminders: state.reminders, // שומר את מבנה ה-Reminder המלא
      }),
      onRehydrateStorage: () => (state, error) => {
        console.log("🔄 onRehydrateStorage called!");
        if (state) {
          state._hasHydrated = true;
          state.isLoading = false;
          if (error) {
            console.error("❌ Failed to rehydrate state from storage:", error);
            state.error = "Failed to load saved data.";
          } else {
            console.log("✅ Hydration finished successfully.");
            state.error = null;
          }
        } else {
           console.warn("⚠️ Rehydration finished but state draft is undefined.");
           useHomiStore.setState({ isLoading: false, _hasHydrated: true, error: "Rehydration failed unexpectedly." });
        }
      },
      version: 1,
    } // סיום הגדרות Persist
  ) // סיום Persist middleware
); // סיום create

// --- Selector Hooks (כולל המותאמים אישית) ---
export const useIsHydrated = () => useHomiStore((state) => state._hasHydrated);
export const useItems = () => useHomiStore((state) => state.items);
export const useReminders = () => useHomiStore((state) => state.reminders);
export const useHomiLoading = () => useHomiStore((state) => state.isLoading);
export const useHomiError = () => useHomiStore((state) => state.error);

export const useFilteredItems = (status?: ItemStatus, tag?: string) => {
  // ... (כמו בקוד המלא הקודם) ...
};
export const useActiveReminders = () => {
  // ... (כמו בקוד המלא הקודם) ...
};

// אופציונלי: הדפסת שינויים ב-store בסביבת פיתוח
if (process.env.NODE_ENV === 'development') {
  // ... (כמו בקוד המלא הקודם) ...
}