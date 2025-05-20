import {createAsyncThunk} from "@reduxjs/toolkit";
import {ApiService} from "@/services/apiService";

export const setCredentialsThunk = createAsyncThunk(
    'auth/login',
    async (credentials: { email: string, password: string }) => {
        try {
            const response = await ApiService.post('/auth/login', credentials);
            console.log(response.data);
            return {
                user: response.data.user,
                access_token: response.data.access_token
            };
        } catch (error: any) {
            throw new Error(error?.response?.data?.message || 'Login failed');
        }
    }
);

