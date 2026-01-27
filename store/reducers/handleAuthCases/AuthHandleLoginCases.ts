import { ActionReducerMapBuilder, PayloadAction } from '@reduxjs/toolkit'
import { AuthState } from '@/store/slices/authSlice'
import { setCredentialsThunk, registerThunk } from '@/store/thunks/authThunks'

export const authHandleLoginCases = (builder: ActionReducerMapBuilder<AuthState>) => {
    builder
        // Login cases
        .addCase(setCredentialsThunk.pending, (state) => {
            state.status = 'loading'
            state.error = null
        })
        .addCase(setCredentialsThunk.fulfilled, (state, action: PayloadAction<{ user: any }>) => {
            state.status = 'authenticated'
            state.user = action.payload.user
        })
        .addCase(setCredentialsThunk.rejected, (state, action) => {
            state.status = 'failed'
            state.error = action.error.message ?? "Erreur d'authentification"
        })
        // Register cases
        .addCase(registerThunk.pending, (state) => {
            state.status = 'loading'
            state.error = null
        })
        .addCase(registerThunk.fulfilled, (state, action: PayloadAction<{ user: any }>) => {
            state.status = 'authenticated'
            state.user = action.payload.user
        })
        .addCase(registerThunk.rejected, (state, action) => {
            state.status = 'failed'
            state.error = action.error.message ?? "Erreur lors de la création du compte"
        })
}
