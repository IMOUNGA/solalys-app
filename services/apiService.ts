import axios, {AxiosRequestConfig, AxiosResponse} from "axios";
import {store} from "@/store";
import {getAccessToken, getRefreshToken, saveTokens, clearTokens} from "@/lib/secureToken";
import {logoutState} from "@/store/slices/authSlice";
import {API_URL} from "@/lib/env";

const BASE_URL = `${API_URL}/v1`;

const apiInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    timeout: 10000, // 10 seconds
});

// Variable pour éviter les appels multiples simultanés de refresh
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

apiInstance.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        console.log('🔐 [Request Interceptor]', config.url, 'Token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
)

apiInstance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error) => {
        const originalRequest = error.config;

        // Si erreur 401 et qu'on n'a pas encore essayé de refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            console.log('🔄 [401 Interceptor] Received 401, attempting refresh...');

            if (isRefreshing) {
                console.log('⏳ [401 Interceptor] Refresh already in progress, queuing request');
                // Si un refresh est déjà en cours, on met la requête en attente
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return apiInstance(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = getRefreshToken();
            console.log('🔑 [401 Interceptor] Refresh token:', refreshToken ? 'EXISTS' : 'MISSING');

            if (!refreshToken) {
                console.log('❌ [401 Interceptor] No refresh token, logging out');
                // Pas de refresh token, on déconnecte
                await clearTokens();
                store.dispatch(logoutState());
                processQueue(error, null);
                isRefreshing = false;
                return Promise.reject(error);
            }

            try {
                console.log('📡 [401 Interceptor] Calling /auth/refresh...');
                // Appel au endpoint refresh avec le refresh token
                const response = await axios.post(`${BASE_URL}/auth/refresh`, {}, {
                    headers: {
                        Authorization: `Bearer ${refreshToken}`
                    }
                });

                const { accessToken, refreshToken: newRefreshToken } = response.data;
                console.log('✅ [401 Interceptor] New tokens received');

                // Sauvegarder les nouveaux tokens
                await saveTokens(accessToken, newRefreshToken);

                // Mettre à jour l'en-tête de la requête originale
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;

                // Traiter les requêtes en attente
                processQueue(null, accessToken);
                isRefreshing = false;

                console.log('🔄 [401 Interceptor] Retrying original request');
                // Réessayer la requête originale
                return apiInstance(originalRequest);
            } catch (refreshError: any) {
                console.log('❌ [401 Interceptor] Refresh failed:', refreshError?.response?.status);
                // Le refresh a échoué, on déconnecte l'utilisateur
                processQueue(refreshError, null);
                isRefreshing = false;
                await clearTokens();
                store.dispatch(logoutState());
                return Promise.reject(refreshError);
            }
        }

        // Autres erreurs
        if (error.response) {
            console.error("API Error:", {
                url: error.config?.url,
                status: error.response.status,
                data: error.response.data,
            })
        } else {
            console.error("API Error:", error?.message || error);
        }

        return Promise.reject(error);
    }
);

export const ApiService = {
    get: (url: string, config?: AxiosRequestConfig): Promise<AxiosRequestConfig> => {
        return apiInstance.get(url, config);
    } ,
    post: (url: string, data?: any, config?: AxiosRequestConfig):Promise<AxiosRequestConfig> => {
        return apiInstance.post(url, data, config);
    },
    put: (url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosRequestConfig> => {
        return apiInstance.put(url, data, config);
    },
    patch: (url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosRequestConfig> => {
        return apiInstance.patch(url, data, config);
    },
    delete: (url: string, config?: AxiosRequestConfig): Promise<AxiosRequestConfig> => {
        return apiInstance.delete(url, config);
    }
}

// Helper pour construire les query params
const buildQueryParams = (params: Record<string, any>) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            query.append(key, String(value));
        }
    });
    return query.toString();
};

// API Service avec méthodes typées
export const apiService = {
    // Events
    events: {
        getAll: (page = 1, limit = 20) => {
            const params = buildQueryParams({ page, limit });
            return apiInstance.get(`/events?${params}`);
        },
        getById: (id: number) => apiInstance.get(`/events/${id}`),
        getNearby: (latitude: number, longitude: number, radius = 50, page = 1, limit = 20) => {
            const params = buildQueryParams({ latitude, longitude, radius, page, limit });
            return apiInstance.get(`/events/nearby?${params}`);
        },
        search: (query?: string, latitude?: number, longitude?: number, radius = 10, page = 1, limit = 20) => {
            const params = buildQueryParams({ query, latitude, longitude, radius, page, limit });
            return apiInstance.get(`/events/search?${params}`);
        },
        getMyEvents: () => apiInstance.get('/events/me'),
        getMyParticipations: () => apiInstance.get('/events/me/participations'),
        create: (data: any) => apiInstance.post('/events', data),
        update: (id: number, data: any) => apiInstance.patch(`/events/${id}`, data),
        delete: (id: number) => apiInstance.delete(`/events/${id}`),
        join: (id: number) => apiInstance.post(`/events/${id}/join`),
        leave: (id: number) => apiInstance.post(`/events/${id}/leave`),
    },
    // Groups
    groups: {
        getAll: (page = 1, limit = 20) => {
            const params = buildQueryParams({ page, limit });
            return apiInstance.get(`/groups?${params}`);
        },
        getById: (id: number) => apiInstance.get(`/groups/${id}`),
        getMyGroups: () => apiInstance.get('/groups/me'),
        getMembers: (id: number) => apiInstance.get(`/groups/${id}/members`),
        create: (data: any) => apiInstance.post('/groups', data),
        update: (id: number, data: any) => apiInstance.patch(`/groups/${id}`, data),
        delete: (id: number) => apiInstance.delete(`/groups/${id}`),
        leave: (id: number) => apiInstance.post(`/groups/${id}/leave`),
        setPrimary: (id: number) => apiInstance.post(`/groups/${id}/set-primary`),
    },
    // Invitations (adhésion sur invitation uniquement — pas de "join" libre)
    invitations: {
        create: (groupId: number, email: string) => apiInstance.post(`/groups/${groupId}/invitations`, { email }),
        getMine: () => apiInstance.get('/invitations/me'),
        accept: (id: number) => apiInstance.post(`/invitations/${id}/accept`),
        decline: (id: number) => apiInstance.post(`/invitations/${id}/decline`),
    },
    // Opportunités (board d'opportunités business par groupe)
    opportunities: {
        getForGroup: (groupId: number) => apiInstance.get(`/groups/${groupId}/opportunities`),
        create: (groupId: number, data: { type: string; title: string; description: string }) =>
            apiInstance.post(`/groups/${groupId}/opportunities`, data),
        getOne: (id: number) => apiInstance.get(`/opportunities/${id}`),
        toggleInterest: (id: number) => apiInstance.post(`/opportunities/${id}/interest`),
        close: (id: number) => apiInstance.post(`/opportunities/${id}/close`),
        remove: (id: number) => apiInstance.delete(`/opportunities/${id}`),
    },
    // Recommandations & CA (référral BNI + dashboard personnel)
    referrals: {
        give: (groupId: number, data: { toUserId: number; description: string }) =>
            apiInstance.post(`/groups/${groupId}/referrals`, data),
        logRevenue: (groupId: number, data: { amount: number; description: string; fromUserId?: number }) =>
            apiInstance.post(`/groups/${groupId}/revenue`, data),
        getForGroup: (groupId: number) => apiInstance.get(`/groups/${groupId}/referrals`),
        updateStatus: (id: number, data: { status: string; amount?: number }) =>
            apiInstance.post(`/referrals/${id}/status`, data),
        getDashboard: (year?: number) => apiInstance.get(`/revenue/dashboard${year ? `?year=${year}` : ''}`),
        getGroupSummary: (groupId: number, year?: number) =>
            apiInstance.get(`/groups/${groupId}/revenue-summary${year ? `?year=${year}` : ''}`),
    },
    // Rôles de gouvernance de groupe
    groupRoles: {
        getForGroup: (groupId: number) => apiInstance.get(`/groups/${groupId}/roles`),
        create: (groupId: number, data: { userId: number; title: string }) =>
            apiInstance.post(`/groups/${groupId}/roles`, data),
        remove: (groupId: number, roleId: number) => apiInstance.delete(`/groups/${groupId}/roles/${roleId}`),
        transferPresident: (groupId: number, toUserId: number) =>
            apiInstance.post(`/groups/${groupId}/roles/transfer-president`, { toUserId }),
    },
    // Users
    users: {
        getMe: () => apiInstance.get('/users/me'),
        updateMe: (data: any) => apiInstance.patch('/users/me', data),
        getMyGroups: () => apiInstance.get('/users/me/groups'),
        getMyNetwork: () => apiInstance.get('/users/me/network'),
        getDeletionImpact: () => apiInstance.get('/users/me/deletion-impact'),
        deleteAccount: (password: string) => apiInstance.delete('/users/me', { data: { password } }),
        registerPushToken: (token: string) => apiInstance.post('/users/me/push-token', { token }),
    },
    // Auth
    auth: {
        signin: (email: string, password: string) => apiInstance.post('/auth/signin', { email, password }),
        signup: (data: any) => apiInstance.post('/auth/signup', data),
        logout: () => apiInstance.post('/auth/logout'),
        me: () => apiInstance.get('/auth/me'),
        forgotPassword: (email: string) => apiInstance.post('/auth/forgot-password', { email }),
        resetPassword: (token: string, newPassword: string) => apiInstance.post('/auth/reset-password', { token, newPassword }),
    },
    // Upload
    upload: {
        image: (formData: FormData) => apiInstance.post('/upload/image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }),
    },
};




