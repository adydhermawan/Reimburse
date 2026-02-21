/**
 * Report API Service
 * Handles PDF report endpoints
 * Web-compatible: uses download link on web, FileSystem + Sharing on native
 */

import { Platform } from 'react-native';
import api, { API_BASE_URL, getToken } from './api';
import { ApiResponse, Report } from '../types';

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
        if (Platform.OS === 'web') {
            // Web: trigger browser download via fetch + blob
            const token = await getToken();
            const downloadUrl = `${API_BASE_URL}/reports/${id}/download`;

            const response = await fetch(downloadUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/pdf',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to download report');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            // Trigger download
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || `Reimburse_Report_${id}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            return url;
        }

        // Native: use expo-file-system
        const FileSystem = require('expo-file-system');
        const token = await getToken();
        const downloadUrl = `${API_BASE_URL}/reports/${id}/download`;

        const fileUri = `${FileSystem.documentDirectory || ''}${filename || `Reimburse_Report_${id}.pdf`}`;

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
        if (Platform.OS === 'web') {
            // On web, just download — browser handles it
            await reportApi.downloadReport(id, filename);
            return;
        }

        // Native: download then share
        const Sharing = require('expo-sharing');
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
