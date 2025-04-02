import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer'; // For easier immutable updates
import localforage from 'localforage'; // For reliable async local storage
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs
import {
  Item,
  Reminder,
  NewItemData,
  UpdateItemData,
  NewReminderData,
  UpdateReminderData,
  ReminderPriority, // Keep the import from @/types/homi
  ReminderType, // Keep the import from @/types/homi
  ItemStatus // Import ItemStatus if used by useFilteredItems
} from '@/types/homi'; // Make sure this path is correct

// --- Configure LocalForage ---
localforage.config({
  name: 'HomiAI',
  storeName: 'homi_data_store',
  description: 'Local storage for HomiAI inventory and reminders',
});

// --- LocalForage Adapter for Zustand Persist ---
const localForageStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    console.log(`${name} has been retrieved`);
    return (await localforage.getItem<string>(name)) ?? null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    console.log(`${name} with value ${value} has been saved`);
    await localforage.setItem(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    console.log(`${name} has been deleted`);
    await localforage.removeItem(name);
  },
};

// --- State and Actions Types ---

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
  dismissReminder: (id: string) => void; // <<< Added dismiss action

  // Internal/Meta Actions
  setHasHydrated: (hydrated: boolean) => void;
  clearError: () => void;
  setError: (message: string) => void; // Handles Step 3 (setting error)
  setLoading: (loading: boolean) => void;
}

type HomiStore = HomiState & HomiActions;

// --- Create the Zustand Store ---

export const useHomiStore = create<HomiStore>()(
  persist(
    immer<HomiStore>((set, get) => ({
      // --- Initial State ---
      items: [],
      reminders: [],
      isLoading: true, // Start loading until hydration finishes
      error: null,
      _hasHydrated: false,

      // --- Meta Actions ---
      setHasHydrated: (hydrated) => {
        set({ _hasHydrated: hydrated });
      },
      clearError: () => {
        set({ error: null });
      },
      setError: (message) => {
        set({ error: message, isLoading: false }); // Set error and stop loading
      },
      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      // --- Item Actions ---
      // (Item actions remain largely unchanged, but ensure error handling is robust)
      addItem: (data) => {
        try {
          const now = new Date().toISOString();
          const newItem: Item = {
            ...data,
            id: uuidv4(),
            createdAt: now,
            updatedAt: now, // Items already had updatedAt
            quantity: data.quantity ?? 1,
          };
          set((state) => {
            state.items.push(newItem);
          });
        } catch (err) {
          console.error('Failed to add item:', err);
          get().setError('Failed to add item. Please try again.'); // Use setError
        }
      },

      updateItem: (id, data) => {
         try { // Optional: Add try/catch for robustness
            set((state) => {
                const itemIndex = state.items.findIndex((item) => item.id === id);
                if (itemIndex !== -1) {
                state.items[itemIndex] = {
                    ...state.items[itemIndex],
                    ...data,
                    updatedAt: new Date().toISOString(), // Update timestamp
                };
                } else {
                console.warn(`Item with id ${id} not found for update.`);
                // Optional: Set an error if item not found is critical
                // get().setError(`Item with id ${id} not found.`);
                }
            });
        } catch (err) {
             console.error('Failed to update item:', err);
             get().setError('Failed to update item. Please try again.');
         }
      },

      deleteItem: (id) => {
        set((state) => {
          state.items = state.items.filter((item) => item.id !== id);
        });
        // No error handling needed here unless deletion could fail (e.g., API call)
      },

      getItemById: (id) => {
        return get().items.find((item) => item.id === id);
      },


      // --- Reminder Actions (Updated) ---
      addReminder: (data) => {
        try {
          const now = new Date().toISOString();
          // Ensure ALL required fields from Reminder type AND the new fields are present
          const newReminder: Reminder = {
            ...data, // Spread properties from NewReminderData first
            id: uuidv4(),
            createdAt: now,
            isComplete: false, // Provide default for required field
            updatedAt: now, // <<< Added (Step 1)
            dismissed: false, // <<< Added (Step 2)
          };
          set((state) => {
            state.reminders.push(newReminder);
          });
        } catch (err) {
          console.error('Failed to add reminder:', err);
          get().setError('Failed to add reminder. Please try again.'); // Use setError (Step 3)
        }
      },

      updateReminder: (id, data) => {
        try { // Optional: Add try/catch
            set((state) => {
                const reminderIndex = state.reminders.findIndex((r) => r.id === id);
                if (reminderIndex !== -1) {
                // Ensure the update includes the new `updatedAt` timestamp
                state.reminders[reminderIndex] = {
                    ...state.reminders[reminderIndex],
                    ...data,
                    updatedAt: new Date().toISOString(), // <<< Added (Step 1)
                };
                } else {
                console.warn(`Reminder with id ${id} not found for update.`);
                // Optional: Set an error
                // get().setError(`Reminder with id ${id} not found.`);
                }
            });
        } catch (err) {
            console.error('Failed to update reminder:', err);
            get().setError('Failed to update reminder. Please try again.');
        }
      },

      deleteReminder: (id) => {
        set((state) => {
          state.reminders = state.reminders.filter((r) => r.id !== id);
        });
         // No error handling needed here unless deletion could fail
      },

      getReminderById: (id) => {
        return get().reminders.find((reminder) => reminder.id === id);
      },

      // <<< Added (Step 2) >>>
      dismissReminder: (id) => {
        try { // Optional: Add try/catch
            set((state) => {
                const reminderIndex = state.reminders.findIndex((r) => r.id === id);
                if (reminderIndex !== -1) {
                state.reminders[reminderIndex].dismissed = true;
                state.reminders[reminderIndex].updatedAt = new Date().toISOString(); // Also update timestamp
                } else {
                console.warn(`Reminder with id ${id} not found for dismissal.`);
                // Optional: Set an error
                // get().setError(`Reminder with id ${id} not found.`);
                }
            });
        } catch (err) {
            console.error('Failed to dismiss reminder:', err);
            get().setError('Failed to dismiss reminder. Please try again.');
        }
      },

    })), // End Immer middleware

    // --- Persist Middleware Configuration ---
      {
      name: 'homi-app-storage', // Local storage key
      storage: createJSONStorage(() => localForageStorage), // Use LocalForage adapter
      partialize: (state) => ({ // Only persist essential data
        items: state.items,
        reminders: state.reminders,
        // Do not persist isLoading, error, _hasHydrated
      }),
      onRehydrateStorage: () => { // Optional: Callback after rehydration
        return (state, error) => {
          if (error) {
            console.error('Failed to rehydrate state:', error);
            // Use the action to set error state properly
            state?.setError('Failed to load saved data.');
            state?.setLoading(false); // Ensure loading is off if hydration fails
          } else if (state) {
            console.log('Hydration finished successfully.');
            state.setHasHydrated(true);
            state.setLoading(false); // Stop loading indicator
          } else {
            // Handle case where state is undefined after rehydration (less common)
            console.warn('Rehydration completed but state is undefined.');
             useHomiStore.setState({ isLoading: false, _hasHydrated: true }); // Manually set defaults if needed
          }
        };
      },
      version: 1, // Optional: For migrations
    }
  ) // End Persist middleware
);

// --- Selector Hook for Hydration Status ---
export const useIsHydrated = () => useHomiStore((state) => state._hasHydrated);

// --- Basic Selector Hooks ---
export const useItems = () => useHomiStore((state) => state.items);
export const useReminders = () => useHomiStore((state) => state.reminders);

// --- Custom Selector Hook for Filtered Items (Step 4) ---
/**
 * Selects items based on optional status and tag filters.
 * @param status Optional item status to filter by.
 * @param tag Optional tag to filter by (item must include this tag).
 * @returns Filtered array of items.
 */
export const useFilteredItems = (status?: ItemStatus, tag?: string) => {
  // Ensure ItemStatus type is correctly defined in @/types/homi
  // Ensure Item type has an optional `tags?: string[]` property
  return useHomiStore((state) =>
    state.items.filter((item) =>
      (!status || item.status === status) && // Filter by status if provided
      (!tag || item.tags?.includes(tag)) // Filter by tag if provided and item has tags
    )
  );
};

// --- Selector Hook for Error State (Convenience for Step 3) ---
export const useHomiError = () => useHomiStore((state) => state.error);

// --- Selector Hook for Loading State (Convenience) ---
export const useHomiLoading = () => useHomiStore((state) => state.isLoading);


// Helper types removed as they conflict with imports from @/types/homi
// type ReminderPriority = 'low' | 'medium' | 'high'; // <<< Use import
// type ReminderType = 'task' | 'note' | 'event'; // <<< Use import