import axios, {AxiosRequestConfig, AxiosResponse} from "axios";
import {store} from "@/store";
import {getAccessToken} from "@/lib/secureToken";
//const BASE_URL = 'http://127.0.0.1:3000/v1';
const BASE_URL = 'http://158.69.200.150:3000/v1';
//const BASE_URL = 'http://192.168.1.107:3000'; // Utiliser l'adresse IP de la machine car localhost ne fonctionne pas sur mobile

const apiInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    timeout: 10000, // 10 seconds
});

apiInstance.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
)

apiInstance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error) => {
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




