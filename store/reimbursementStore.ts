/**
 * Reimbursement Store - Zustand store for reimbursements
 * With real API integration
 */

import { create } from 'zustand';
import { reimbursementApi } from '../src/services';
import { Reimbursement, DashboardSummary, ReimbursementFilters, PaginatedResponse } from '../src/types';

// Map API status to UI status
export type UIStatus = 'Draft' | 'New' | 'Diajukan' | 'Finish';

const mapApiStatusToUI = (status: string): UIStatus => {
    switch (status) {
        case 'pending':
            return 'Diajukan';
        case 'approved':
            return 'Finish';
        case 'rejected':
            return 'New';
        default:
            return 'Draft';
    }
};

const mapUIStatusToApi = (status: UIStatus): 'pending' | 'approved' | 'rejected' | undefined => {
    switch (status) {
        case 'Diajukan':
            return 'pending';
        case 'Finish':
            return 'approved';
        case 'New':
            return 'rejected';
        default:
            return undefined;
    }
};

interface ReimbursementState {
    // Data
    entries: Reimbursement[];
    summary: DashboardSummary | null;
    pagination: {
        currentPage: number;
        lastPage: number;
        total: number;
    } | null;

    // Loading states
    isLoading: boolean;
    isLoadingMore: boolean;
    isSubmitting: boolean;
    error: string | null;

    // Actions
    fetchReimbursements: (filters?: ReimbursementFilters, append?: boolean) => Promise<void>;
    fetchDashboardSummary: () => Promise<void>;
    createReimbursement: (data: {
        client_name: string;
        category_id: number;
        amount: number;
        transaction_date: string;
        note?: string;
        image?: {
            uri: string;
            type: string;
            name: string;
        };
    }) => Promise<Reimbursement | null>;
    updateReimbursement: (id: number, data: any) => Promise<boolean>;
    deleteReimbursement: (id: number) => Promise<boolean>;
    getEntryById: (id: number) => Reimbursement | undefined;
    fetchReimbursementById: (id: number) => Promise<Reimbursement | null>;
    clearError: () => void;
    reset: () => void;
}

export const useReimbursementStore = create<ReimbursementState>((set, get) => ({
    entries: [],
    summary: null,
    pagination: null,
    isLoading: false,
    isLoadingMore: false,
    isSubmitting: false,
    error: null,

    /**
     * Fetch reimbursements with filters and pagination
     */
    fetchReimbursements: async (filters?: ReimbursementFilters, append = false) => {
        // Set loading state
        if (append) {
            set({ isLoadingMore: true, error: null });
        } else {
            set({ isLoading: true, error: null });
        }

        try {
            const response = await reimbursementApi.getReimbursements(filters);

            if (response.success) {
                const paginatedData = response.data;

                set((state) => ({
                    entries: append
                        ? [...state.entries, ...paginatedData.data]
                        : paginatedData.data,
                    pagination: {
                        currentPage: paginatedData.current_page,
                        lastPage: paginatedData.last_page || 1,
                        total: paginatedData.total,
                    },
                    isLoading: false,
                    isLoadingMore: false,
                }));
            } else {
                set({
                    isLoading: false,
                    isLoadingMore: false,
                    error: 'Gagal memuat data reimbursement',
                });
            }
        } catch (error: any) {
            set({
                isLoading: false,
                isLoadingMore: false,
                error: error.message || 'Gagal memuat data',
            });
        }
    },

    /**
     * Fetch dashboard summary
     */
    fetchDashboardSummary: async () => {
        try {
            const response = await reimbursementApi.getDashboardSummary();

            if (response.success) {
                set({ summary: response.data });
            }
        } catch (error: any) {
            console.error('Failed to fetch summary:', error);
        }
    },

    /**
     * Create new reimbursement
     */
    createReimbursement: async (data) => {
        set({ isSubmitting: true, error: null });

        try {
            const response = await reimbursementApi.createReimbursement(data);

            if (response.success) {
                // Add new entry to the beginning of the list
                set((state) => ({
                    entries: [response.data, ...state.entries],
                    isSubmitting: false,
                }));
                return response.data;
            } else {
                set({
                    isSubmitting: false,
                    error: response.message || 'Gagal menyimpan reimbursement',
                });
                return null;
            }
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.message ||
                error.message ||
                'Gagal menyimpan reimbursement';

            set({
                isSubmitting: false,
                error: errorMessage,
            });
            return null;
        }
    },

    /**
     * Update existing reimbursement
     */
    updateReimbursement: async (id, data) => {
        set({ isSubmitting: true, error: null });

        try {
            const response = await reimbursementApi.updateReimbursement(id, data);

            if (response.success) {
                // Update entry in the list
                set((state) => ({
                    entries: state.entries.map((e) =>
                        e.id === id ? response.data : e
                    ),
                    isSubmitting: false,
                }));
                return true;
            } else {
                set({
                    isSubmitting: false,
                    error: response.message || 'Gagal update reimbursement',
                });
                return false;
            }
        } catch (error: any) {
            set({
                isSubmitting: false,
                error: error.message || 'Gagal update reimbursement',
            });
            return false;
        }
    },

    /**
     * Delete reimbursement
     */
    deleteReimbursement: async (id) => {
        set({ isSubmitting: true, error: null });

        try {
            const response = await reimbursementApi.deleteReimbursement(id);

            if (response.success) {
                // Remove entry from the list
                set((state) => ({
                    entries: state.entries.filter((e) => e.id !== id),
                    isSubmitting: false,
                }));
                return true;
            } else {
                set({
                    isSubmitting: false,
                    error: response.message || 'Gagal menghapus reimbursement',
                });
                return false;
            }
        } catch (error: any) {
            set({
                isSubmitting: false,
                error: error.message || 'Gagal menghapus reimbursement',
            });
            return false;
        }
    },

    /**
     * Get entry by ID from local store
     */
    getEntryById: (id) => {
        return get().entries.find((e) => e.id === id);
    },

    /**
     * Fetch single entry by ID from API
     */
    fetchReimbursementById: async (id) => {
        // First check if already in store
        const existing = get().entries.find((e) => e.id === id);
        if (existing) return existing;

        try {
            const response = await reimbursementApi.getReimbursement(id);
            if (response.success) {
                // Add to entries cache
                set((state) => ({
                    entries: [...state.entries, response.data],
                }));
                return response.data;
            }
            return null;
        } catch (error) {
            console.error('Failed to fetch reimbursement:', error);
            return null;
        }
    },

    /**
     * Clear error
     */
    clearError: () => {
        set({ error: null });
    },

    /**
     * Reset store
     */
    reset: () => {
        set({
            entries: [],
            summary: null,
            pagination: null,
            isLoading: false,
            isLoadingMore: false,
            isSubmitting: false,
            error: null,
        });
    },
}));

// Export helper functions
export { mapApiStatusToUI, mapUIStatusToApi };
