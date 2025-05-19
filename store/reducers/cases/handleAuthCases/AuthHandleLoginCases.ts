import {ActionReducerMapBuilder, PayloadAction} from "@reduxjs/toolkit";
import {AuthState} from "@/store/slices/authSlice";
import {setCredentialsThunk} from "@/store/thunks/authThunks";

export const authHandleLoginCases = (builder: ActionReducerMapBuilder<AuthState>) => {
    builder
        .addCase(setCredentialsThunk.pending, (state) => {
            state.status = 'loading'
        })
        .addCase(setCredentialsThunk.fulfilled, (state, action: PayloadAction<any>) => {
            state.status = 'authenticated'
            state.user = action.payload.user
            state.access_token = action.payload.access_token
        })
        .addCase(setCredentialsThunk.rejected, (state, action) => {
            state.status = 'failed'
            state.error = action.error.message ?? 'Erreur d\'authentification'
        })
}
