// src/store/items/store.ts

import { create } from 'zustand';
import { devtools, persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import localforage from '@/lib/utils/storage'; // ספריית localforage שהגדרת

// --- Persist Adapter לחנות הפריטים (HomiStore) ---
const homiPersistStorage: StateStorage | undefined =
  typeof window !== 'undefined' && localforage
    ? {
        getItem: async (name: string): Promise<string | null> => {
          const lf = localforage!;
          console.log(`[HomiStore:persist] Reading '${name}'...`);
          const value = await lf.getItem(name);
          return JSON.stringify(value ?? null);
        },
        setItem: async (name: string, value: string): Promise<void> => {
          const lf = localforage!;
          console.log(`[HomiStore:persist] Writing '${name}'...`);
          try {
            const parsed = JSON.parse(value);
            await lf.setItem(name, parsed);
          } catch (e) {
            console.error(`[HomiStore:persist] Failed parsing value for setItem '${name}'`, e);
          }
        },
        removeItem: async (name: string): Promise<void> => {
          const lf = localforage!;
          console.log(`[HomiStore:persist] Removing '${name}'...`);
          await lf.removeItem(name);
        },
      }
    : undefined;


import { v4 as uuidv4 } from 'uuid';
// ---------- טיפוסים רלוונטיים ----------
import {
  Item,
  Reminder,
  NewItemData,
  UpdateItemData,
  NewReminderData,
  UpdateReminderData,
  ItemStatus,
  ItemCondition,
} from '@/types/homi';

// ---------- הגדרת ה־State וה־Actions ----------
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

// שילוב
export type HomiStore = HomiState & HomiActions;

// ---------- יצירת ה־store ----------
export const useHomiStore = create<HomiStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // ---- מצב התחלתי ----
        items: [],
        reminders: [],
        isLoading: true,
        error: null,
        _hasHydrated: false,

        // ---- פעולות עזר (meta) ----
        clearError: () => set({ error: null }),
        setError: (message) => set({ error: message, isLoading: false }),

        // ---- פעולות Items ----
        addItem: (data: NewItemData) => {
          const now = new Date().toISOString();
          const newItem: Item = {
            id: uuidv4(),
            createdAt: now,
            updatedAt: now,
            lastSeenAt: now,
            seenMethod: 'manual',
            name: data.name,
            roomName: data.roomName,
            location: data.location,
            quantity: data.quantity ?? 1,

            // *** שים לב לשורה הזו (categoryId) ***
            categoryId: data.categoryId, // יכול להיות null / undefined

            photoUri: data.photoUri,
            furnitureName: data.furnitureName,
            tags: data.tags ?? [],
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
            linkedItemIds: data.linkedItemIds ?? [],
          };
          set((state) => {
            state.items.push(newItem);
            state.error = null;
            console.log('!!!! STORE: Item added with data:', {
              id: newItem.id,
              name: newItem.name,
              categoryId: newItem.categoryId,
            });
          });
        },
        updateItem: (id, data) => {
          set((state) => {
            const idx = state.items.findIndex((item) => item.id === id);
            if (idx !== -1) {
              state.items[idx] = {
                ...state.items[idx],
                ...data,
                updatedAt: new Date().toISOString(),
              };
              state.error = null;
            } else {
              get().setError(`Item with id ${id} not found for update.`);
            }
          });
        },
        deleteItem: (id) => {
          set((state) => {
            const initLen = state.items.length;
            state.items = state.items.filter((item) => item.id !== id);
            if (state.items.length < initLen) {
              state.error = null;
              // מוחקים תזכורות שמקושרות ל-item
              state.reminders = state.reminders.filter((r) => r.itemId !== id);
            } else {
              get().setError(`Item with id ${id} not found for deletion.`);
            }
          });
        },
        getItemById: (id) => get().items.find((item) => item.id === id),

        // ---- פעולות Reminders ----
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
            // בדיקה אם ה־itemId קיים
            if (newReminder.itemId && !state.items.some((item) => item.id === newReminder.itemId)) {
              get().setError(
                `Cannot add reminder: Linked Item with ID "${newReminder.itemId}" does not exist.`
              );
              return;
            }
            state.reminders.push(newReminder);
            state.error = null;
          });
        },
        updateReminder: (id, data) => {
          set((state) => {
            const idx = state.reminders.findIndex((r) => r.id === id);
            if (idx !== -1) {
              if (
                data.itemId &&
                !get().items.some((item) => item.id === data.itemId)
              ) {
                get().setError(
                  `Cannot update reminder: New linked Item ID "${data.itemId}" does not exist.`
                );
                return;
              }
              state.reminders[idx] = {
                ...state.reminders[idx],
                ...data,
                updatedAt: new Date().toISOString(),
              };
              state.error = null;
            } else {
              get().setError(`Reminder with id ${id} not found for update.`);
            }
          });
        },
        deleteReminder: (id) => {
          set((state) => {
            const initLen = state.reminders.length;
            state.reminders = state.reminders.filter((r) => r.id !== id);
            if (state.reminders.length < initLen) {
              state.error = null;
            } else {
              get().setError(`Reminder with id ${id} not found for deletion.`);
            }
          });
        },
        getReminderById: (id) => get().reminders.find((r) => r.id === id),
        toggleReminderComplete: (id) => {
          set((state) => {
            const reminder = state.reminders.find((r) => r.id === id);
            if (reminder) {
              reminder.isComplete = !reminder.isComplete;
              reminder.updatedAt = new Date().toISOString();
              state.error = null;
            } else {
              get().setError(`Reminder with id ${id} not found for toggle.`);
            }
          });
        },
        dismissReminder: (id) => {
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
            }
          });
        },
      })),
      {
        name: 'homi-item-storage-v2',
        version: 2,
        storage: homiPersistStorage ? createJSONStorage(() => homiPersistStorage) : undefined,
        partialize: (state) => ({
          items: state.items,
          reminders: state.reminders,
        }),
        onRehydrateStorage: () => (state, error) => {
          const storeName = '[HomiStore]';
          console.log(`🔄 ${storeName} onRehydrateStorage called!`);
      
          useHomiStore.setState({
            _hasHydrated: true,
            isLoading: false,
            error: error ? 'Failed to load HomiStore data from storage.' : null,
          });
      
          if (error) {
            console.error(`❌ ${storeName} Failed to rehydrate state:`, error);
          } else {
            console.log(`✅ ${storeName} Hydration finished successfully.`);
          }
        }
      }
    ),
    {
      name: 'HomiAppStore (Items/Reminders)',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// ---------- סלקטורים נוספים לפי הצורך ----------
export const useIsHydrated = () => useHomiStore((s) => s._hasHydrated);
export const useItems = () => useHomiStore((s) => s.items);
export const useReminders = () => useHomiStore((s) => s.reminders);
export const useHomiLoading = () => useHomiStore((s) => s.isLoading);
export const useHomiError = () => useHomiStore((s) => s.error);

// לדוגמה: סלקטור עם פילטר
export const useFilteredItems = (status?: ItemStatus, tag?: string) =>
  useHomiStore((state) =>
    state.items.filter((item) => {
      const statusMatch = !status || item.status === status;
      const tagMatch =
        !tag ||
        (typeof tag === 'string' &&
          Array.isArray(item.tags) &&
          item.tags.some((t) => t.toLowerCase().includes(tag.toLowerCase().trim())));
      return statusMatch && tagMatch;
    })
  );

// לוג לצורכי דיבוג
if (process.env.NODE_ENV === 'development') {
  useHomiStore.subscribe((state) => {
    console.log('HomiStore update:', state);
  });
}