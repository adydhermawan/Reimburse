/**
 * New Entry Store - Zustand store for new reimbursement form
 * Includes draft persistence using AsyncStorage
 */

import { create } from 'zustand';
import {
    saveDraftEntry,
    loadDraftEntry,
    clearDraftEntry,
    DraftEntry,
} from '../src/services/offlineStorage';

interface NewEntryState {
    step: number;
    imageUri: string | null;
    date: Date;
    category: string;
    categoryId: number | undefined;
    client: string;
    amount: string; // Keep as string for input handling
    note: string;
    compressionStatus: string | null; // null = not compressing, string = status message
    hasDraft: boolean;
    isLoadingDraft: boolean;

    // Actions
    setStep: (step: number) => void;
    setImageUri: (uri: string | null) => void;
    setDate: (date: Date) => void;
    setCategory: (category: string) => void;
    setCategoryId: (categoryId: number | undefined) => void;
    setClient: (client: string) => void;
    setAmount: (amount: string) => void;
    setNote: (note: string) => void;
    setCompressionStatus: (status: string | null) => void;
    reset: () => void;

    // Draft actions
    saveDraft: () => Promise<void>;
    loadDraft: () => Promise<boolean>;
    clearDraft: () => Promise<void>;
    checkHasDraft: () => Promise<boolean>;
    restoreFromDraft: (draft: DraftEntry) => void;
}

// Helper to auto-save draft after state changes
const saveDraftDebounced = (() => {
    let timeout: NodeJS.Timeout | null = null;
    return (getState: () => NewEntryState) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
            const state = getState();
            // Only save if there's meaningful data
            if (state.imageUri || state.category || state.client || state.amount) {
                state.saveDraft();
            }
        }, 500); // 500ms debounce
    };
})();

export const useNewEntryStore = create<NewEntryState>((set, get) => ({
    step: 1,
    imageUri: null,
    date: new Date(),
    category: '',
    categoryId: undefined,
    client: '',
    amount: '',
    note: '',
    compressionStatus: null,
    hasDraft: false,
    isLoadingDraft: false,

    setStep: (step) => {
        set({ step });
        saveDraftDebounced(get);
    },
    setImageUri: (imageUri) => {
        set({ imageUri });
        saveDraftDebounced(get);
    },
    setDate: (date) => {
        set({ date });
        saveDraftDebounced(get);
    },
    setCategory: (category) => {
        set({ category });
        saveDraftDebounced(get);
    },
    setCategoryId: (categoryId) => {
        set({ categoryId });
        saveDraftDebounced(get);
    },
    setClient: (client) => {
        set({ client });
        saveDraftDebounced(get);
    },
    setAmount: (amount) => {
        set({ amount });
        saveDraftDebounced(get);
    },
    setNote: (note) => {
        set({ note });
        saveDraftDebounced(get);
    },
    setCompressionStatus: (compressionStatus) => set({ compressionStatus }),

    reset: () => {
        set({
            step: 1,
            imageUri: null,
            date: new Date(),
            category: '',
            categoryId: undefined,
            client: '',
            amount: '',
            note: '',
            compressionStatus: null,
            hasDraft: false,
        });
        // Also clear the draft from storage
        clearDraftEntry();
    },

    /**
     * Save current state as draft
     */
    saveDraft: async () => {
        const state = get();
        const draft: DraftEntry = {
            step: state.step,
            imageUri: state.imageUri,
            date: state.date.toISOString(),
            category: state.category,
            categoryId: state.categoryId,
            client: state.client,
            amount: state.amount,
            note: state.note,
            savedAt: new Date().toISOString(),
        };

        try {
            await saveDraftEntry(draft);
            set({ hasDraft: true });
        } catch (error) {
            console.error('Failed to save draft:', error);
        }
    },

    /**
     * Load draft from storage and restore state
     * Returns true if draft was loaded
     */
    loadDraft: async () => {
        set({ isLoadingDraft: true });
        try {
            const draft = await loadDraftEntry();
            if (draft) {
                get().restoreFromDraft(draft);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to load draft:', error);
            return false;
        } finally {
            set({ isLoadingDraft: false });
        }
    },

    /**
     * Clear draft from storage
     */
    clearDraft: async () => {
        try {
            await clearDraftEntry();
            set({ hasDraft: false });
        } catch (error) {
            console.error('Failed to clear draft:', error);
        }
    },

    /**
     * Check if draft exists
     */
    checkHasDraft: async () => {
        try {
            const draft = await loadDraftEntry();
            const hasDraft = draft !== null;
            set({ hasDraft });
            return hasDraft;
        } catch (error) {
            console.error('Failed to check draft:', error);
            return false;
        }
    },

    /**
     * Restore state from draft object
     */
    restoreFromDraft: (draft: DraftEntry) => {
        set({
            step: draft.step,
            imageUri: draft.imageUri,
            date: new Date(draft.date),
            category: draft.category,
            categoryId: draft.categoryId,
            client: draft.client,
            amount: draft.amount,
            note: draft.note,
            hasDraft: true,
        });
    },
}));
