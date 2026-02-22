import axios from 'axios';

// Default configuration for API client pointing to the Spring Boot backend
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor
api.interceptors.request.use(
    (config) => {
        // Attempt to get token from localStorage
        const token = localStorage.getItem('token');

        // In strict TypeScript environments we assert config.headers exists
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Prevent infinite loops if the refresh fails
        if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/login' && originalRequest.url !== '/auth/refresh') {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    // Check your backend refresh route carefully
                    // The Spring Boot app has POST /api/auth/refresh mapped to RefreshTokenRequest
                    const response = await axios.post(`${baseURL}/auth/refresh`, {
                        refreshToken: refreshToken
                    });

                    const newToken = response.data?.data?.token || response.data?.token;

                    if (newToken) {
                        localStorage.setItem('token', newToken);
                        // Also update the failed request Authorization header and try again
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        return api(originalRequest);
                    }
                }
            } catch (refreshError) {
                // If the refresh token is also invalid or expired, log out the user
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }

            // If we made it here but didn't have a valid refresh token, redirect
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
