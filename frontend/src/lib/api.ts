const VITE_API_URL = import.meta.env.VITE_API_URL;

// Clean up trailing slash from the base URL if it exists
const API_URL = VITE_API_URL.endsWith('/') ? VITE_API_URL.slice(0, -1) : VITE_API_URL;

export const api = {
    async request(endpoint: string, options: RequestInit = {}) {
        const storedToken = localStorage.getItem('token');
        const token = storedToken ? storedToken.trim() : null;

        // Ensure endpoint starts with a slash
        const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const fullUrl = `${API_URL}${path}`;

        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers,
        };

        try {
            console.log(`[API Request] ${options.method || 'GET'} ${fullUrl}`);
            const response = await fetch(fullUrl, {
                ...options,
                headers,
            });

            // Handle 204 No Content
            if (response.status === 204) {
                return null;
            }

            const data = await response.json();
            if (!response.ok) {
                console.error(`[API Error] ${response.status}:`, data);
                throw new Error(data.message || `Request failed with status ${response.status}`);
            }
            return data;
        } catch (error: any) {
            console.error(`[Network Error] ${fullUrl}:`, error);
            if (error.message === 'Failed to fetch') {
                throw new Error('Could not connect to the server. Please check your internet connection and ensure the API is reachable.');
            }
            throw error;
        }
    },

    async post(endpoint: string, body: any, options: RequestInit = {}) {
        return this.request(endpoint, {
            ...options,
            method: options.method || 'POST',
            body: JSON.stringify(body),
        });
    },

    async get(endpoint: string, options: RequestInit = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'GET',
        });
    },

    async delete(endpoint: string, options: RequestInit = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'DELETE',
        });
    },

    async patch(endpoint: string, body: any, options: RequestInit = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PATCH',
            body: JSON.stringify(body),
        });
    }
};
