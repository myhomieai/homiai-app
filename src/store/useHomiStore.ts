import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import localforage from 'localforage';
import { v4 as uuidv4 } from 'uuid';

// --- ייבוא הטיפוסים ---
import {
  Item,
  Reminder,
  NewItemData,
  UpdateItemData,
  NewReminderData,
  UpdateReminderData,
  ItemStatus
  // הוסרו: ReminderPriority, ReminderType, SeenMethod, ItemCondition
} from '@/types/homi';

// --- הגדרת LocalForage ---
localforage.config({
  name: 'HomiAI',
  storeName: 'homi_data_store',
  description: 'Local storage for HomiAI inventory and reminders',
  driver: [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE],
});

// --- מתאם LocalForage ---
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
  items: Item[];
  reminders: Reminder[];
  isLoading: boolean;
  error: string | null;
  _hasHydrated: boolean;
}

interface HomiActions {
  // Item CRUD
  addItem: (data: NewItemData) => void;
  updateItem: (id: string, data: UpdateItemData) => void;
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
          id: uuidv4(),
          createdAt: now,
          updatedAt: now,
          name: data.name,
          roomName: data.roomName,
          location: data.location,
          quantity: data.quantity ?? 1,
          lastSeenAt: now,
          seenMethod: 'manual',
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

      // --- Reminder Actions (מימוש מלא) ---
      addReminder: (data: NewReminderData) => {
        const now = new Date().toISOString();
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
              get().setError(`Cannot update reminder: New linked Item with ID "${data.itemId}" does not exist.`);
              console.warn(`Cannot update reminder: New linked Item with ID "${data.itemId}" does not exist.`);
              return;
            }
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

    })), // סיום immer

    // --- הגדרות Persist Middleware ---
    {
      name: 'homi-app-storage',
      storage: createJSONStorage(() => localForageStorage),
      partialize: (state) => ({
        items: state.items,
        reminders: state.reminders,
      }),

      // ===========================================================
      // --- מימוש onRehydrateStorage האלטרנטיבי (עם setState מיידי) ---
      // ===========================================================
       onRehydrateStorage: () => (state, error) => { // state כאן הוא עדיין ה-draft מ-Immer, אך לא נשתמש בו ישירות לעדכון הראשי
         console.log("🔄 onRehydrateStorage called!");

         // קריאה מפורשת ל-setState כדי לנסות לכפות עדכון על הקומפוננטות המאזינות
         useHomiStore.setState({
           _hasHydrated: true,
           isLoading: false,
           error: error ? "Failed to load saved data." : null,
         });

         // עדיין נרשום לוגים לאבחון שגיאות בתהליך ה-persist עצמו
         if (error) {
           console.error("❌ Failed to rehydrate state from storage:", error);
           // אופציונלי: לעדכן גם את ה-draft למקרה שלוגיקה אחרת תלויה בזה מיידית
           if (state) state.error = "Failed to load saved data.";
         } else {
           console.log("✅ Hydration finished successfully.");
           // אופציונלי: לעדכן גם את ה-draft
           if (state) state.error = null;
         }
       },
      version: 1,
    } // סיום הגדרות Persist
  ) // סיום Persist middleware
); // סיום create

// --- Selector Hooks (כולל המותאמים אישית המלאים) ---
export const useIsHydrated = () => useHomiStore((state) => state._hasHydrated);
export const useItems = () => useHomiStore((state) => state.items);
export const useReminders = () => useHomiStore((state) => state.reminders);
export const useHomiLoading = () => useHomiStore((state) => state.isLoading);
export const useHomiError = () => useHomiStore((state) => state.error);

// סלקטור מותאם אישית לפריטים מסוננים
export const useFilteredItems = (status?: ItemStatus, tag?: string) => {
  return useHomiStore((state) =>
    state.items.filter((item) => {
      const statusMatch = !status || item.status === status;
      const tagMatch = !tag || item.tags?.some(t => t.toLowerCase().includes(tag.toLowerCase().trim()));
      return statusMatch && tagMatch;
    })
  );
};

// סלקטור מותאם אישית לתזכורות פעילות
export const useActiveReminders = () => {
  return useHomiStore((state) =>
    state.reminders.filter(r => !r.isComplete && !r.dismissed)
  );
}

// אופציונלי: הדפסת שינויים ב-store בסביבת פיתוח
if (process.env.NODE_ENV === 'development') {
  useHomiStore.subscribe(
    (state) => console.log('HomiStore update:', state)
  );
}