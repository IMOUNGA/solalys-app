import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '@/services/apiService';

export const fetchEventsThunk = createAsyncThunk(
  'events/fetchAll',
  async ({ page = 1, limit = 20 }: { page?: number; limit?: number } = {}) => {
    const response = await apiService.events.getAll(page, limit);
    return response.data;
  }
);

export const fetchEventByIdThunk = createAsyncThunk(
  'events/fetchById',
  async (id: number) => {
    const response = await apiService.events.getById(id);
    return response.data;
  }
);

export const fetchMyEventsThunk = createAsyncThunk(
  'events/fetchMyEvents',
  async () => {
    const response = await apiService.events.getMyEvents();
    return response.data;
  }
);

export const fetchMyParticipationsThunk = createAsyncThunk(
  'events/fetchMyParticipations',
  async () => {
    const response = await apiService.events.getMyParticipations();
    return response.data;
  }
);

export const joinEventThunk = createAsyncThunk(
  'events/join',
  async (id: number) => {
    const response = await apiService.events.join(id);
    return response.data;
  }
);

export const leaveEventThunk = createAsyncThunk(
  'events/leave',
  async (id: number) => {
    const response = await apiService.events.leave(id);
    return response.data;
  }
);
