import {createAsyncThunk} from "@reduxjs/toolkit";
import {ApiService} from "@/services/apiService";
import {URLS} from "@/constants/apiUrls";

export const findOne = createAsyncThunk(
    'event/findOne',
    async (id: number) => {
        try {
            const response = await ApiService.get(`${URLS.EVENT.ROOT}/${id}`);
            console.log(response.data);
            return {
                event: response.data.event
            }
        } catch (error: any) {
            throw new Error(error?.response?.data?.message || 'Event fetch failed');
        }
    }
)
