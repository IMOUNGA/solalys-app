import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Event } from '@/types/event';
import {
  fetchEventsThunk,
  fetchEventByIdThunk,
  fetchMyEventsThunk,
  fetchMyParticipationsThunk,
  joinEventThunk,
  leaveEventThunk,
} from '../thunks/eventsThunks';

interface EventsState {
  events: Event[];
  myEvents: Event[];
  myParticipations: Event[];
  currentEvent: Event | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: EventsState = {
  events: [],
  myEvents: [],
  myParticipations: [],
  currentEvent: null,
  status: 'idle',
  error: null,
};

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    clearCurrentEvent: (state) => {
      state.currentEvent = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch all events
    builder
      .addCase(fetchEventsThunk.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchEventsThunk.fulfilled, (state, action: PayloadAction<any>) => {
        state.status = 'succeeded';
        // Handle both formats: { data: [...] } or just [...]
        const events = action.payload.data || action.payload;
        state.events = Array.isArray(events) ? events : [];
      })
      .addCase(fetchEventsThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch events';
      });

    // Fetch event by ID
    builder
      .addCase(fetchEventByIdThunk.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchEventByIdThunk.fulfilled, (state, action: PayloadAction<Event>) => {
        state.status = 'succeeded';
        state.currentEvent = action.payload;
      })
      .addCase(fetchEventByIdThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch event';
      });

    // Fetch my events
    builder
      .addCase(fetchMyEventsThunk.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMyEventsThunk.fulfilled, (state, action: PayloadAction<Event[]>) => {
        state.status = 'succeeded';
        state.myEvents = action.payload;
      })
      .addCase(fetchMyEventsThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch my events';
      });

    // Fetch my participations
    builder
      .addCase(fetchMyParticipationsThunk.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMyParticipationsThunk.fulfilled, (state, action: PayloadAction<Event[]>) => {
        state.status = 'succeeded';
        state.myParticipations = action.payload;
      })
      .addCase(fetchMyParticipationsThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch participations';
      });

    // Join event
    builder
      .addCase(joinEventThunk.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(joinEventThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to join event';
      });

    // Leave event
    builder
      .addCase(leaveEventThunk.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(leaveEventThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to leave event';
      });
  },
});

export const { clearCurrentEvent, clearError } = eventsSlice.actions;
export default eventsSlice.reducer;
