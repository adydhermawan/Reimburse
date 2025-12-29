/**
 * Report Store - Zustand store for PDF reports
 */

import { create } from 'zustand';
import { reportApi } from '../src/services';
import { Report } from '../src/types';

interface ReportState {
    reports: Report[];
    selectedReport: Report | null;
    isLoading: boolean;
    isDownloading: boolean;
    error: string | null;

    // Actions
    fetchReports: () => Promise<void>;
    fetchReportDetail: (id: number) => Promise<void>;
    downloadReport: (id: number, filename?: string) => Promise<void>;
    shareReport: (id: number, filename?: string) => Promise<void>;
    clearSelectedReport: () => void;
    clearError: () => void;
}

export const useReportStore = create<ReportState>((set, get) => ({
    reports: [],
    selectedReport: null,
    isLoading: false,
    isDownloading: false,
    error: null,

    /**
     * Fetch all reports
     */
    fetchReports: async () => {
        set({ isLoading: true, error: null });

        try {
            const response = await reportApi.getReports();

            if (response.success) {
                set({
                    reports: response.data,
                    isLoading: false,
                });
            } else {
                set({
                    isLoading: false,
                    error: 'Gagal memuat laporan',
                });
            }
        } catch (error: any) {
            set({
                isLoading: false,
                error: error.message || 'Gagal memuat laporan',
            });
        }
    },

    /**
     * Fetch single report detail with reimbursements
     */
    fetchReportDetail: async (id: number) => {
        set({ isLoading: true, error: null, selectedReport: null });

        try {
            const response = await reportApi.getReportDetail(id);

            if (response.success) {
                set({
                    selectedReport: response.data,
                    isLoading: false,
                });
            } else {
                set({
                    isLoading: false,
                    error: 'Gagal memuat detail laporan',
                });
            }
        } catch (error: any) {
            set({
                isLoading: false,
                error: error.message || 'Gagal memuat detail laporan',
            });
        }
    },

    /**
     * Clear selected report
     */
    clearSelectedReport: () => {
        set({ selectedReport: null });
    },

    /**
     * Download report PDF
     */
    downloadReport: async (id: number, filename?: string) => {
        set({ isDownloading: true, error: null });

        try {
            await reportApi.downloadReport(id, filename);
            set({ isDownloading: false });
        } catch (error: any) {
            set({
                isDownloading: false,
                error: error.message || 'Gagal download laporan',
            });
        }
    },

    /**
     * Download and share report
     */
    shareReport: async (id: number, filename?: string) => {
        set({ isDownloading: true, error: null });

        try {
            await reportApi.downloadAndShareReport(id, filename);
            set({ isDownloading: false });
        } catch (error: any) {
            set({
                isDownloading: false,
                error: error.message || 'Gagal share laporan',
            });
        }
    },

    /**
     * Clear error
     */
    clearError: () => {
        set({ error: null });
    },
}));
