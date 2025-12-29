/**
 * API Types - Interfaces for API responses
 * Based on Postman documentation
 */

// Base API Response
export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
}

// Paginated Response
export interface PaginatedResponse<T> {
    current_page: number;
    data: T[];
    per_page: number;
    total: number;
    last_page?: number;
}

// User
export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string | null;
    created_at?: string;
    updated_at?: string;
}

// Auth Response
export interface AuthData {
    user: User;
    token: string;
}

// Category
export interface Category {
    id: number;
    name: string;
    icon: string;
    description?: string;
}

// Client
export interface Client {
    id: number;
    name: string;
    created_by?: number;
    is_auto_registered?: boolean;
    created_at?: string;
    updated_at?: string;
}

// Reimbursement
export interface Reimbursement {
    id: number;
    user_id: number;
    client_id: number;
    category_id: number;
    report_id?: number | null;
    amount: string;
    transaction_date: string;
    note?: string | null;
    image_path?: string | null;
    status: 'pending' | 'approved' | 'rejected' | 'in_report' | 'paid';
    created_at?: string;
    updated_at?: string;
    client?: {
        id: number;
        name: string;
    };
    category?: {
        id: number;
        name: string;
        icon: string;
    };
    report?: Report | null;
}

// Dashboard Summary
export interface DashboardSummary {
    pending_total: number;
    pending_count: number;
    category_pending: Record<string, number>;
    all_time_total: number;
}

// Report
export interface Report {
    id: number;
    user_id: number;
    period_start: string;
    period_end: string;
    total_amount: string;
    total_entries: number;
    pdf_path?: string;
    status: 'draft' | 'generated' | 'submitted' | 'paid';
    payment_date?: string | null;
    created_at?: string;
    updated_at?: string;
    reimbursements?: Reimbursement[];
}

// Reimbursement Filters
export interface ReimbursementFilters {
    status?: 'pending' | 'approved' | 'rejected' | 'in_report' | 'paid';
    month?: number;
    year?: number;
    page?: number;
    search?: string;
    date_from?: string;
    date_to?: string;
}

// Create Reimbursement Request
export interface CreateReimbursementRequest {
    client_name: string;
    category_id: number;
    amount: number;
    transaction_date: string;
    note?: string;
    image: {
        uri: string;
        type: string;
        name: string;
    };
}
