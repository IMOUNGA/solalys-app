// store/slices/authSlice.ts
import { createSlice } from '@reduxjs/toolkit'
import {User} from "@/lib/interfaces";
import {authHandleSessionCases} from "@/store/reducers/handleAuthCases/AuthHandleSessionCases";
import {authHandleLoginCases} from "@/store/reducers/handleAuthCases/AuthHandleLoginCases";

export interface AuthState {
    user: User | null
    status: 'idle' | 'loading' | 'authenticated' | 'failed'
    error: string | null
}

const initialState: AuthState = {
    user: null,
    status: 'idle',
    error: null,
}

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logoutState: (state) => {
            state.user = null
            state.status = 'idle'
            state.error = null
        },
    },
    extraReducers: (builder) => {
        authHandleLoginCases(builder)
        authHandleSessionCases(builder)
    },
})

export const { logoutState } = authSlice.actions
export default authSlice.reducer
