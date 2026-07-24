import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '@/services/apiService';

export const fetchGroupsThunk = createAsyncThunk(
  'groups/fetchAll',
  async ({ page = 1, limit = 20 }: { page?: number; limit?: number } = {}) => {
    const response = await apiService.groups.getAll(page, limit);
    return response.data;
  }
);

export const fetchGroupByIdThunk = createAsyncThunk(
  'groups/fetchById',
  async (id: number) => {
    const response = await apiService.groups.getById(id);
    return response.data;
  }
);

export const fetchMyGroupsThunk = createAsyncThunk(
  'groups/fetchMyGroups',
  async () => {
    const response = await apiService.groups.getMyGroups();
    return response.data;
  }
);

export const fetchGroupMembersThunk = createAsyncThunk(
  'groups/fetchMembers',
  async (id: number) => {
    const response = await apiService.groups.getMembers(id);
    return response.data;
  }
);

export const joinGroupThunk = createAsyncThunk(
  'groups/join',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await apiService.groups.join(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue({
        message: error?.response?.data?.message || error?.message || 'Impossible de rejoindre ce groupe',
      });
    }
  }
);

export const leaveGroupThunk = createAsyncThunk(
  'groups/leave',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await apiService.groups.leave(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue({
        message: error?.response?.data?.message || error?.message || 'Impossible de quitter ce groupe',
      });
    }
  }
);
