import { ActionReducerMapBuilder, PayloadAction } from '@reduxjs/toolkit'
import { loadSessionThunk, refreshUserThunk } from '@/store/thunks/authThunks'
import {AuthState} from "@/store/slices/authSlice";

export const authHandleSessionCases = (builder: ActionReducerMapBuilder<AuthState>) => {
    builder
        // LoadSession: vérifie juste le token, le user vient de redux-persist
        .addCase(loadSessionThunk.pending, (state) => {
            // Ne rien faire, le state est déjà hydraté par redux-persist
        })
        .addCase(loadSessionThunk.fulfilled, (state, action: PayloadAction<{ hasToken: boolean }>) => {
            // Si pas de token et qu'on a un user en cache, on déconnecte
            if (!action.payload.hasToken && state.user) {
                state.status = 'idle'
                state.user = null
            }
            // Si on a un token et un user en cache, on s'assure que le status est authenticated
            if (action.payload.hasToken && state.user) {
                state.status = 'authenticated'
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
