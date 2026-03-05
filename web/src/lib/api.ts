import axios from 'axios';

// ---------------------------------------------------------------------------
// In-memory access token — never written to localStorage or sessionStorage.
// XSS cannot steal it; lost on page refresh (recovered via httpOnly cookie).
// ---------------------------------------------------------------------------
let inMemoryToken: string | null = null;

export function setAccessToken(token: string) {
    inMemoryToken = token;
}

export function clearAccessToken() {
    inMemoryToken = null;
}

export function hasAccessToken() {
    return inMemoryToken !== null;
}

// ---------------------------------------------------------------------------
// Axios instance — withCredentials: true so the browser sends the httpOnly
// refresh_token cookie automatically on requests to the same origin.
// ---------------------------------------------------------------------------
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
    baseURL,
    withCredentials: true,   // required for httpOnly cookie to be sent
    headers: {
        'Content-Type': 'application/json',
    },
});

// Attach access token from memory (not localStorage) on every request
api.interceptors.request.use(
    (config) => {
        if (inMemoryToken && config.headers) {
            config.headers.Authorization = `Bearer ${inMemoryToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// On 401: attempt silent refresh using the httpOnly cookie, then replay request
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        const isAuthEndpoint =
            originalRequest.url?.includes('/auth/login') ||
            originalRequest.url?.includes('/auth/register') ||
            originalRequest.url?.includes('/auth/refresh');

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            originalRequest._retry = true;

            try {
                // POST with empty body — browser sends httpOnly cookie automatically
                const refreshResponse = await axios.post(
                    `${baseURL}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                const newToken =
                    refreshResponse.data?.data?.token ||
                    refreshResponse.data?.token;

                if (newToken) {
                    setAccessToken(newToken);
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return api(originalRequest);
                }
            } catch {
                clearAccessToken();
                window.location.href = '/login';
                return Promise.reject(error);
            }

            clearAccessToken();
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

// ---------------------------------------------------------------------------
// Call once on app startup to silently recover a session via the httpOnly
// cookie without requiring the user to log in again after a page refresh.
// ---------------------------------------------------------------------------
export async function initSession(): Promise<boolean> {
    try {
        const response = await axios.post(
            `${baseURL}/auth/refresh`,
            {},
            { withCredentials: true }
        );
        const token = response.data?.data?.token || response.data?.token;
        if (token) {
            setAccessToken(token);
            return true;
        }
    } catch {
        // No valid refresh cookie — user needs to log in
    }
    return false;
}

export default api;
