/**
 * Client API Service
 * Handles client endpoints for autocomplete and creation
 */

import api from './api';
import { ApiResponse, Client } from '../types';

export const clientApi = {
    /**
     * Get clients for autocomplete
     * @param search - Optional search query for filtering
     */
    getClients: async (search?: string): Promise<ApiResponse<Client[]>> => {
        const params = search ? { search } : {};
        const response = await api.get<ApiResponse<Client[]>>('/clients', { params });
        return response.data;
    },

    /**
     * Create a new client
     */
    createClient: async (name: string): Promise<ApiResponse<Client>> => {
        const response = await api.post<ApiResponse<Client>>('/clients', { name });
        return response.data;
    },
};

export default clientApi;
