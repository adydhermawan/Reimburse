/**
 * Reimbursement API Service
 * Handles all reimbursement CRUD operations
 * Web-compatible: handles both RN-style and web Blob/File uploads
 */

import { Platform } from 'react-native';
import api, { API_BASE_URL } from './api';
import {
    ApiResponse,
    Reimbursement,
    PaginatedResponse,
    DashboardSummary,
    ReimbursementFilters
} from '../types';

export interface CreateReimbursementRequest {
    client_name: string;
    category_id?: number | null;
    category_name?: string | null;
    amount: number;
    transaction_date: string;
    note?: string;
    image?: {
        uri: string;
        type: string;
        name: string;
    };
    // Web-only: File object from input[type=file]
    imageFile?: any;
}

/**
 * Helper: append an image to FormData in a platform-aware way
 */
function appendImageToFormData(formData: FormData, fieldName: string, image: { uri: string; type: string; name: string }, imageFile?: any) {
    if (Platform.OS === 'web') {
        if (imageFile) {
            // We have a real File object (from platformImagePicker)
            formData.append(fieldName, imageFile, imageFile.name);
        } else if (image.uri.startsWith('data:')) {
            // Convert Base64 Data URI to Blob robustly
            const arr = image.uri.split(',');
            const mime = arr[0].match(/:(.*?);/)?.[1] || image.type;
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            const blob = new Blob([u8arr], { type: mime });
            formData.append(fieldName, blob, image.name);
        } else {
            // Data URI or similar — convert to blob
            fetch(image.uri)
                .then(r => r.blob())
                .then(blob => {
                    formData.append(fieldName, blob, image.name);
                }).catch(err => {
                    console.error("Failed to fetch blob URI, appending as string fallback", err);
                    formData.append(fieldName, image.uri);
                });
        }
    } else {
        // React Native style
        formData.append(fieldName, {
            uri: image.uri,
            type: image.type,
            name: image.name,
        } as any);
    }
}

/**
 * Helper: async version of appendImageToFormData for web blob URIs
 */
async function appendImageToFormDataAsync(formData: FormData, fieldName: string, image: { uri: string; type: string; name: string }, imageFile?: any) {
    if (Platform.OS === 'web') {
        if (imageFile) {
            formData.append(fieldName, imageFile, imageFile.name);
        } else if (image.uri.startsWith('data:')) {
            // Convert Base64 Data URI to Blob robustly
            const arr = image.uri.split(',');
            const mime = arr[0].match(/:(.*?);/)?.[1] || image.type;
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            const blob = new Blob([u8arr], { type: mime });
            formData.append(fieldName, blob, image.name);
        } else {
            // Fetch the blob URI and convert to a File/Blob (for blob:http://... URIs)
            try {
                const response = await fetch(image.uri);
                const blob = await response.blob();
                formData.append(fieldName, blob, image.name);
            } catch (err) {
                console.error("Failed to fetch blob URI, appending as string fallback", err);
                formData.append(fieldName, image.uri);
            }
        }
    } else {
        formData.append(fieldName, {
            uri: image.uri,
            type: image.type,
            name: image.name,
        } as any);
    }
}

export const reimbursementApi = {
    /**
     * Get reimbursements list with pagination and filters
     */
    getReimbursements: async (
        filters?: ReimbursementFilters
    ): Promise<ApiResponse<PaginatedResponse<Reimbursement>>> => {
        const params: Record<string, string | number> = {};

        if (filters?.status) params.status = filters.status;
        if (filters?.month) params.month = filters.month;
        if (filters?.year) params.year = filters.year;
        if (filters?.page) params.page = filters.page;
        if (filters?.search) params.search = filters.search;
        if (filters?.date_from) params.date_from = filters.date_from;
        if (filters?.date_to) params.date_to = filters.date_to;

        const response = await api.get<ApiResponse<PaginatedResponse<Reimbursement>>>(
            '/reimbursements',
            { params }
        );
        return response.data;
    },

    /**
     * Get single reimbursement detail
     */
    getReimbursement: async (id: number): Promise<ApiResponse<Reimbursement>> => {
        const response = await api.get<ApiResponse<Reimbursement>>(`/reimbursements/${id}`);
        return response.data;
    },

    /**
     * Create new reimbursement with image upload
     * Uses FormData for multipart/form-data
     */
    createReimbursement: async (data: CreateReimbursementRequest): Promise<ApiResponse<Reimbursement>> => {
        const formData = new FormData();

        formData.append('client_name', data.client_name);

        if (data.category_id) {
            formData.append('category_id', data.category_id.toString());
        }

        formData.append('amount', data.amount.toString());
        formData.append('transaction_date', data.transaction_date);

        if (data.note) {
            formData.append('note', data.note);
        }

        if (data.image) {
            await appendImageToFormDataAsync(formData, 'image', data.image, data.imageFile);
        }

        const response = await api.post<ApiResponse<Reimbursement>>(
            '/reimbursements',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 120000,
            }
        );
        return response.data;
    },

    /**
     * Update existing reimbursement (only pending status)
     */
    updateReimbursement: async (
        id: number,
        data: Partial<CreateReimbursementRequest>
    ): Promise<ApiResponse<Reimbursement>> => {
        const formData = new FormData();

        // Method override for form-data PUT
        formData.append('_method', 'PUT');

        if (data.client_name) formData.append('client_name', data.client_name);
        if (data.category_id) formData.append('category_id', data.category_id.toString());
        // category_name is NOT a DB column, don't send it
        if (data.amount) formData.append('amount', data.amount.toString());
        if (data.transaction_date) formData.append('transaction_date', data.transaction_date);
        if (data.note !== undefined) formData.append('note', data.note || '');

        if (data.image) {
            await appendImageToFormDataAsync(formData, 'image', data.image, data.imageFile);
        }

        const response = await api.post<ApiResponse<Reimbursement>>(
            `/reimbursements/${id}`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    },

    /**
     * Get dashboard summary statistics
     */
    getDashboardSummary: async (): Promise<ApiResponse<DashboardSummary>> => {
        const response = await api.get<ApiResponse<DashboardSummary>>('/reimbursements/summary');
        return response.data;
    },

    /**
     * Delete a reimbursement (only pending status)
     */
    deleteReimbursement: async (id: number): Promise<ApiResponse<null>> => {
        const response = await api.delete<ApiResponse<null>>(`/reimbursements/${id}`);
        return response.data;
    },

    /**
     * Get image URL for a reimbursement
     */
    getImageUrl: (imagePath: string): string => {
        // Remove /api from base URL for storage access
        const storageBaseUrl = API_BASE_URL.replace('/api', '');
        return `${storageBaseUrl}/storage/${imagePath}`;
    },

    /**
     * Scan receipt image using AI
     */
    scanReceipt: async (imageUri: string, imageFile?: File): Promise<ApiResponse<any>> => {
        const formData = new FormData();

        const filename = imageUri.split('/').pop() || 'receipt.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        await appendImageToFormDataAsync(
            formData,
            'image',
            { uri: imageUri, type, name: filename },
            imageFile
        );

        const response = await api.post<ApiResponse<any>>('/scan-receipt', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 60000,
        });
        return response.data;
    },

    /**
     * Start a background AI scan
     * Returns the draft reimbursement immediately while AI processes in the background
     */
    draftScanReceipt: async (imageUri: string, imageFile?: File): Promise<ApiResponse<any>> => {
        const formData = new FormData();

        const filename = imageUri.split('/').pop() || 'receipt.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        await appendImageToFormDataAsync(
            formData,
            'image',
            { uri: imageUri, type, name: filename },
            imageFile
        );

        const response = await api.post<ApiResponse<any>>('/reimbursements/draft-scan', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 60000,
        });
        return response.data;
    },
};

export default reimbursementApi;
