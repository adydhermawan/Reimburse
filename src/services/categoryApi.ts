/**
 * Category API Service
 * Handles category endpoints
 */

import api from './api';
import { ApiResponse, Category } from '../types';

export const categoryApi = {
    /**
     * Get all categories
     * This is a public endpoint, no auth required
     */
    getCategories: async (): Promise<ApiResponse<Category[]>> => {
        const response = await api.get<ApiResponse<Category[]>>('/categories');
        return response.data;
    },
};

export default categoryApi;
