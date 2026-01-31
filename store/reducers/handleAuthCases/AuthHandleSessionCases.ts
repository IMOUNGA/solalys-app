import { ActionReducerMapBuilder, PayloadAction } from '@reduxjs/toolkit'
import { loadSessionThunk, refreshUserThunk } from '@/store/thunks/authThunks'
import {AuthState} from "@/store/slices/authSlice";

export const authHandleSessionCases = (builder: ActionReducerMapBuilder<AuthState>) => {
    builder
        // LoadSession: vérifie le token et récupère le user depuis l'API
        .addCase(loadSessionThunk.pending, (state) => {
            state.status = 'loading'
        })
        .addCase(loadSessionThunk.fulfilled, (state, action: PayloadAction<{ hasToken: boolean; user: any }>) => {
            if (action.payload.hasToken && action.payload.user) {
                state.status = 'authenticated'
                state.user = action.payload.user
            } else {
                state.status = 'idle'
                state.user = null
            }
        })
        .addCase(loadSessionThunk.rejected, (state) => {
            state.status = 'idle'
            state.user = null
        })

        // RefreshUser: mise à jour des données depuis le backend
        .addCase(refreshUserThunk.pending, (state) => {
            // On ne change pas le status, c'est un refresh silencieux
        })
        .addCase(refreshUserThunk.fulfilled, (state, action: PayloadAction<{ user: any }>) => {
            state.user = action.payload.user
            state.status = 'authenticated'
        })
        .addCase(refreshUserThunk.rejected, (state) => {
            // Si le refresh échoue (token invalide), on déconnecte
            state.status = 'idle'
            state.user = null
        })
}
