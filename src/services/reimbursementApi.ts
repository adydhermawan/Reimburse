/**
 * Reimbursement API Service
 * Handles all reimbursement CRUD operations
 */

import api, { API_BASE_URL } from './api';
import {
    ApiResponse,
    Reimbursement,
    PaginatedResponse,
    DashboardSummary,
    ReimbursementFilters
} from '../types';

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
    createReimbursement: async (data: {
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
    }): Promise<ApiResponse<Reimbursement>> => {
        const formData = new FormData();

        formData.append('client_name', data.client_name);
        formData.append('category_id', data.category_id.toString());
        formData.append('amount', data.amount.toString());
        formData.append('transaction_date', data.transaction_date);

        if (data.note) {
            formData.append('note', data.note);
        }

        if (data.image) {
            formData.append('image', {
                uri: data.image.uri,
                type: data.image.type,
                name: data.image.name,
            } as any);
        }

        const response = await api.post<ApiResponse<Reimbursement>>(
            '/reimbursements',
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
     * Update existing reimbursement (only pending status)
     */
    updateReimbursement: async (
        id: number,
        data: {
            client_name?: string;
            category_id?: number;
            amount?: number;
            transaction_date?: string;
            note?: string;
            image?: {
                uri: string;
                type: string;
                name: string;
            };
        }
    ): Promise<ApiResponse<Reimbursement>> => {
        const formData = new FormData();

        // Method override for form-data PUT
        formData.append('_method', 'PUT');

        if (data.client_name) formData.append('client_name', data.client_name);
        if (data.category_id) formData.append('category_id', data.category_id.toString());
        if (data.amount) formData.append('amount', data.amount.toString());
        if (data.transaction_date) formData.append('transaction_date', data.transaction_date);
        if (data.note !== undefined) formData.append('note', data.note || '');

        if (data.image) {
            formData.append('image', {
                uri: data.image.uri,
                type: data.image.type,
                name: data.image.name,
            } as any);
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
};

export default reimbursementApi;
