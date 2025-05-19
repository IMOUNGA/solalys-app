import {createSlice} from "@reduxjs/toolkit";
import {authHandleLoginCases} from "@/store/reducers/cases/handleAuthCases/AuthHandleLoginCases";

interface User {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    groups: any[],
    creation: string;
    lastconnexion: string;
}
export interface AuthState {
    access_token: string | null,
    user: User | null,
    status: 'idle' | 'loading' | 'authenticated' | 'failed',
    error: string | null,
}

const initialState: AuthState = {
    user: null,
    access_token: null,
    status: 'idle',
    error: null,
}

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null
            state.access_token = null
            state.status = 'idle'
            state.error = null
        }
    },
    extraReducers: (builder) => {
        authHandleLoginCases(builder)
    }
});

export const {logout} = authSlice.actions;
export default authSlice.reducer;
