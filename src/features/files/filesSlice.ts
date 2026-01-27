import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import type { PayloadAction } from '@reduxjs/toolkit';
import { getFiles } from '../../api/files';
import type { FilesState, FileDTO, RejectedPayload } from '../types';

const initialState: FilesState = {
  items: [],
  status: 'idle',
  error: null,
};

export const fetchFiles = createAsyncThunk<
  FileDTO[],
  { userId?: number } | void,
  { rejectValue: RejectedPayload }
>(
  'files/fetchFiles',
  async (arg, { rejectWithValue }) => {
    try {
      const userId = arg && 'userId' in arg ? arg.userId : undefined;
      const files = await getFiles(userId);
      return files;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status ?? null;
        const detailRaw = (err.response?.data as { detail?: unknown } | undefined)?.detail;
        const detail = typeof detailRaw === 'string' ? detailRaw : 'Failed to load files';

        return rejectWithValue({ status, detail });
      }

      return rejectWithValue({ status: null, detail: 'Failed to load files' });
    }
  }
);

const filesSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder.addCase(fetchFiles.pending, (state) => {
      state.status = 'loading';
      state.error = null;
    });

    builder.addCase(fetchFiles.fulfilled, (state, action: PayloadAction<FileDTO[]>) => {
      state.status = 'succeeded';
      state.items = action.payload;
      state.error = null;
    });

    builder.addCase(fetchFiles.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.payload?.detail ?? 'Failed to load files';
    });
  },
});

export default filesSlice.reducer;
