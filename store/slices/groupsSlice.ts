import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Group } from '@/types/group';
import {
  fetchGroupsThunk,
  fetchGroupByIdThunk,
  fetchMyGroupsThunk,
  joinGroupThunk,
  leaveGroupThunk,
} from '../thunks/groupsThunks';

interface GroupsState {
  groups: Group[];
  myGroups: Group[];
  currentGroup: Group | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: GroupsState = {
  groups: [],
  myGroups: [],
  currentGroup: null,
  status: 'idle',
  error: null,
};

const groupsSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    clearCurrentGroup: (state) => {
      state.currentGroup = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch all groups
    builder
      .addCase(fetchGroupsThunk.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchGroupsThunk.fulfilled, (state, action: PayloadAction<any>) => {
        state.status = 'succeeded';
        // Handle both formats: { data: [...] } or just [...]
        const groups = action.payload.data || action.payload;
        state.groups = Array.isArray(groups) ? groups : [];
      })
      .addCase(fetchGroupsThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch groups';
      });

    // Fetch group by ID
    builder
      .addCase(fetchGroupByIdThunk.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchGroupByIdThunk.fulfilled, (state, action: PayloadAction<Group>) => {
        state.status = 'succeeded';
        state.currentGroup = action.payload;
      })
      .addCase(fetchGroupByIdThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch group';
      });

    // Fetch my groups
    builder
      .addCase(fetchMyGroupsThunk.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMyGroupsThunk.fulfilled, (state, action: PayloadAction<Group[]>) => {
        state.status = 'succeeded';
        state.myGroups = action.payload;
      })
      .addCase(fetchMyGroupsThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch my groups';
      });

    // Join group
    builder
      .addCase(joinGroupThunk.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(joinGroupThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to join group';
      });

    // Leave group
    builder
      .addCase(leaveGroupThunk.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(leaveGroupThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to leave group';
      });
  },
});

export const { clearCurrentGroup, clearError } = groupsSlice.actions;
export default groupsSlice.reducer;
