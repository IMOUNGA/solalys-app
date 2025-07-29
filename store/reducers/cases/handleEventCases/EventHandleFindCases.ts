import {ActionReducerMapBuilder, PayloadAction} from "@reduxjs/toolkit";
import {EventState} from "@/store/slices/eventSlice";
import {findOne} from "@/store/thunks/eventThunks";

export const eventHandleFindCases = (builder: ActionReducerMapBuilder<EventState>) => {
    builder
        .addCase(findOne.pending, (state) => {
            state.status = 'loading'
        })
        .addCase(findOne.fulfilled, (state, action: PayloadAction<any>) => {
            state.status = 'loaded'
            state.event = action.payload.event
        })
        .addCase(findOne.rejected, (state, action) => {
            state.status = 'failed'
            state.error = action.error.message ?? 'Erreur lors de la récupération de l\'événement'
        })
}
