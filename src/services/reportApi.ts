/**
 * Report API Service
 * Handles PDF report endpoints
 */

import api, { API_BASE_URL, getToken } from './api';
import { ApiResponse, Report } from '../types';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export const reportApi = {
    /**
     * Get all reports for current user
     */
    getReports: async (): Promise<ApiResponse<Report[]>> => {
        const response = await api.get<ApiResponse<Report[]>>('/reports');
        return response.data;
    },

    /**
     * Get single report detail with reimbursements
     */
    getReportDetail: async (id: number): Promise<ApiResponse<Report>> => {
        const response = await api.get<ApiResponse<Report>>(`/reports/${id}`);
        return response.data;
    },

    /**
     * Download report PDF and share/save it
     */
    downloadReport: async (id: number, filename?: string): Promise<string> => {
        const token = await getToken();
        const downloadUrl = `${API_BASE_URL}/reports/${id}/download`;

        const fileUri = `${FileSystem.documentDirectory}${filename || `Reimburse_Report_${id}.pdf`}`;

        const downloadResult = await FileSystem.downloadAsync(
            downloadUrl,
            fileUri,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/pdf',
                },
            }
        );

        if (downloadResult.status !== 200) {
            throw new Error('Failed to download report');
        }

        return downloadResult.uri;
    },

    /**
     * Download and share report
     */
    downloadAndShareReport: async (id: number, filename?: string): Promise<void> => {
        const fileUri = await reportApi.downloadReport(id, filename);

        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri, {
                mimeType: 'application/pdf',
                dialogTitle: 'Bagikan Laporan',
            });
        } else {
            throw new Error('Sharing not available on this device');
        }
    },
};

export default reportApi;
