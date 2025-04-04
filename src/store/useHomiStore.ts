import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import localforage from 'localforage';
import { v4 as uuidv4 } from 'uuid';
// [+] הוספת ייבוא devtools
import { devtools } from 'zustand/middleware';

// --- ייבוא הטיפוסים ---
import {
  Item,
  Reminder,
  NewItemData,
  UpdateItemData,
  NewReminderData,
  UpdateReminderData,
  ItemStatus,
  ItemCondition
} from '@/types/homi'; // ודא שהטיפוסים כאן מעודכנים עם categoryId

// --- הגדרת LocalForage (כמו אצלך) ---
localforage.config({
  name: 'HomiAI',
  storeName: 'homi_data_store',
  description: 'Local storage for HomiAI inventory and reminders',
  driver: [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE],
});

// --- מתאם LocalForage עבור הדפדפן (כמו אצלך) ---
const browserLocalForageStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const item = await localforage.getItem<string>(name);
      return item ?? null;
    } catch (error) {
      console.error(`❌ Error getting item ${name} from localforage:`, error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await localforage.setItem(name, value);
    } catch (error) {
       console.error(`❌ Error setting item ${name} in localforage:`, error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await localforage.removeItem(name);
    } catch (error) {
       console.error(`❌ Error removing item ${name} from localforage:`, error);
    }
  },
};

// --- אחסון "דמה" (כמו אצלך) ---
const noopStorage: StateStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};


// --- הגדרת טיפוסי המצב (State) והפעולות (Actions) (כמו אצלך) ---
interface HomiState {
  items: Item[];
  reminders: Reminder[];
  isLoading: boolean;
  error: string | null;
  _hasHydrated: boolean;
}
interface HomiActions {
  addItem: (data: NewItemData) => void;
  updateItem: (id: string, data: UpdateItemData) => void;
  deleteItem: (id: string) => void;
  getItemById: (id: string) => Item | undefined;
  addReminder: (data: NewReminderData) => void;
  updateReminder: (id: string, data: UpdateReminderData) => void;
  deleteReminder: (id: string) => void;
  getReminderById: (id: string) => Reminder | undefined;
  toggleReminderComplete: (id: string) => void;
  dismissReminder: (id: string) => void;
  clearError: () => void;
  setError: (message: string) => void;
}
type HomiStore = HomiState & HomiActions;

// --- יצירת ה-Zustand Store ---
export const useHomiStore = create<HomiStore>()(
  // [+] הוספת עטיפת devtools
  devtools(
    persist(
      immer((set, get) => ({
        // --- מצב התחלתי (כמו אצלך) ---
        items: [],
        reminders: [],
        isLoading: true,
        error: null,
        _hasHydrated: false,

        // --- Meta Actions (כמו אצלך) ---
        clearError: () => set({ error: null }),
        setError: (message) => set({ error: message, isLoading: false }),

        // --- Item Actions (עם התיקון היחיד ב-addItem) ---
        addItem: (data: NewItemData) => {
          const now = new Date().toISOString();
          const newItem: Item = {
            // שדות חובה מחושבים
            id: uuidv4(),
            createdAt: now,
            updatedAt: now,
            lastSeenAt: now,
            seenMethod: 'manual',
            // שדות חובה מהקלט
            name: data.name,
            roomName: data.roomName,
            location: data.location,
            quantity: data.quantity ?? 1,
            // ==============================
            // --- התיקון היחיד כאן ---
            categoryId: data.categoryId, // <<< השתמש ב-categoryId
            // ==============================
            // שדות אופציונליים מהקלט
            photoUri: data.photoUri,
            furnitureName: data.furnitureName,
            tags: data.tags ?? [], // ברירת מחדל טובה
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
            linkedItemIds: data.linkedItemIds ?? [], // ברירת מחדל טובה
          };
          set((state) => {
            state.items.push(newItem);
            state.error = null;
            // לוג שהוספנו קודם לבדיקה
            const addedItem = state.items[state.items.length - 1];
            console.log("!!!! STORE: Item added with data:", { id: addedItem.id, name: addedItem.name, categoryId: addedItem.categoryId });
          });
        },

        // --- שאר הפעולות - *המימוש המלא המקורי שלך* ---
        updateItem: (id, data) => {
          set((state) => {
            const itemIndex = state.items.findIndex((item) => item.id === id);
            if (itemIndex !== -1) {
              state.items[itemIndex] = {
                ...state.items[itemIndex],
                ...data,
                updatedAt: new Date().toISOString(),
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
              state.reminders = state.reminders.filter(r => r.itemId !== id);
            } else {
              get().setError(`Item with id ${id} not found for deletion.`);
              console.warn(`Item with id ${id} not found for deletion.`);
            }
          });
        },
        getItemById: (id) => get().items.find((item) => item.id === id),

        addReminder: (data: NewReminderData) => {
          const now = new Date().toISOString();
          // ודא שהטיפוס Reminder כולל את השדות האלה
          const newReminder: Reminder = {
            ...data,
            id: uuidv4(),
            createdAt: now,
            updatedAt: now,
            isComplete: false,
            dismissed: false,
          };
          set((state) => {
            if (newReminder.itemId && !state.items.some(item => item.id === newReminder.itemId)) {
              get().setError(`Cannot add reminder: Linked Item with ID "${newReminder.itemId}" does not exist.`);
              console.warn(`Cannot add reminder: Linked Item with ID "${newReminder.itemId}" does not exist.`);
              return;
            }
            state.reminders.push(newReminder);
            state.error = null;
          });
        },
        updateReminder: (id: string, data: UpdateReminderData) => {
          set((state) => {
            const reminderIndex = state.reminders.findIndex((r) => r.id === id);
            if (reminderIndex !== -1) {
              if (data.itemId && !get().items.some(item => item.id === data.itemId)) {
                get().setError(`Cannot update reminder: New linked Item ID "${data.itemId}" does not exist.`);
                console.warn(`Cannot update reminder: New linked Item ID "${data.itemId}" does not exist.`);
                return;
              }
              // ודא שהטיפוס Reminder כולל updatedAt
              state.reminders[reminderIndex] = {
                ...state.reminders[reminderIndex],
                ...data,
                updatedAt: new Date().toISOString(),
              };
              state.error = null;
            } else {
              get().setError(`Reminder with id ${id} not found for update.`);
              console.warn(`Reminder with id ${id} not found for update.`);
            }
          });
        },
        deleteReminder: (id: string) => {
          set((state) => {
            const initialLength = state.reminders.length;
            state.reminders = state.reminders.filter((r) => r.id !== id);
            if(state.reminders.length < initialLength) {
              state.error = null;
            } else {
              get().setError(`Reminder with id ${id} not found for deletion.`);
              console.warn(`Reminder with id ${id} not found for deletion.`);
            }
          });
        },
        getReminderById: (id: string) => get().reminders.find((reminder) => reminder.id === id),
        toggleReminderComplete: (id: string) => {
          set((state) => {
            const reminder = state.reminders.find((r) => r.id === id);
            if (reminder) {
              // ודא שהטיפוס Reminder כולל isComplete, updatedAt
              reminder.isComplete = !reminder.isComplete;
              reminder.updatedAt = new Date().toISOString();
              state.error = null;
            } else {
              get().setError(`Reminder with id ${id} not found for toggle complete.`);
              console.warn(`Reminder with id ${id} not found for toggle complete.`);
            }
          });
        },
        dismissReminder: (id: string) => {
          set((state) => {
            const reminder = state.reminders.find((r) => r.id === id);
            if (reminder) {
              // ודא שהטיפוס Reminder כולל dismissed, updatedAt
              if (!reminder.dismissed) {
                reminder.dismissed = true;
                reminder.updatedAt = new Date().toISOString();
              }
              state.error = null;
            } else {
              get().setError(`Reminder with id ${id} not found for dismissal.`);
              console.warn(`Reminder with id ${id} not found for dismissal.`);
            }
          });
        },
        // --- סוף הפעולות שלך ---

      })), // סיום immer

      // --- הגדרות Persist Middleware (כמו אצלך) ---
      {
        name: 'homi-app-storage',
        storage: createJSONStorage(() => (
          typeof window !== 'undefined' ? browserLocalForageStorage : noopStorage
        )),
        partialize: (state) => ({
          items: state.items,
          reminders: state.reminders,
        }),
         onRehydrateStorage: () => (state, error) => {
           console.log("🔄 [HomiStore] onRehydrateStorage called!");
           useHomiStore.setState({
             _hasHydrated: true,
             isLoading: false,
             error: error ? "Failed to load HomiStore data from storage." : null,
           });
           if (error) {
             console.error("❌ [HomiStore] Failed to rehydrate state:", error);
           } else {
             console.log("✅ [HomiStore] Hydration finished successfully.");
           }
         },
        version: 1,
      } // סיום הגדרות Persist
    ), // סיום persist
    // --- [+] הגדרות DevTools ---
    {
      name: "HomiAppStore (Items/Reminders)",
      enabled: process.env.NODE_ENV === 'development',
    }
    // -----------------------
  ) // <<< סיום עטיפת devtools
); // סיום create

// --- Selector Hooks (כמו אצלך) ---
export const useIsHydrated = () => useHomiStore((state) => state._hasHydrated);
export const useItems = () => useHomiStore((state) => state.items);
export const useReminders = () => useHomiStore((state) => state.reminders);
export const useHomiLoading = () => useHomiStore((state) => state.isLoading);
export const useHomiError = () => useHomiStore((state) => state.error);

export const useFilteredItems = (status?: ItemStatus, tag?: string) => {
  return useHomiStore((state) =>
    state.items.filter((item) => {
      const statusMatch = !status || item.status === status;
      const tagMatch = !tag || (
          typeof tag === 'string' &&
          Array.isArray(item.tags) &&
          item.tags.some(t =>
              typeof t === 'string' &&
              t.toLowerCase().includes(tag.toLowerCase().trim())
          )
      );
      return statusMatch && tagMatch;
    })
  );
};

export const useActiveReminders = () => {
  return useHomiStore((state) =>
    // ודא שהטיפוס Reminder כולל isComplete, dismissed
    state.reminders.filter(r => !r.isComplete && !r.dismissed)
  );
}

// הדפסת שינויים ב-store (כמו אצלך)
if (process.env.NODE_ENV === 'development') {
  useHomiStore.subscribe(
    (state) => console.log('HomiStore update:', state)
  );
}