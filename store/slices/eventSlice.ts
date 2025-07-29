import { EventInfos } from "@/interfaces";
import {createSlice} from "@reduxjs/toolkit";
import {eventHandleFindCases} from "@/store/reducers/cases/handleEventCases/EventHandleFindCases";

export interface EventState {
    event: EventInfos | null,
    status: 'idle' | 'loading' | 'loaded' | 'failed',
    error: string | null,
}

export const initialState: EventState = {
    event: null,
    status: 'idle',
    error: null,
}

const eventSlice = createSlice({
    name: 'event',
    initialState,
    reducers: {

    },
    extraReducers: (builder) => {
        eventHandleFindCases(builder)
    }
});

export const {} = eventSlice.actions;
export default eventSlice.reducer;
