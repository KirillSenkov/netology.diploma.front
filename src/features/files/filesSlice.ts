import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import type { PayloadAction } from '@reduxjs/toolkit';
import { getFiles, postFile } from '../../api/files';
import type { FilesState, FileDTO, RejectedPayload } from '../types';

const initialState: FilesState = {
  items: [],
  status: 'idle',
  error: null,
  uploadStatus: 'idle',
  uploadError: null,
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

export const uploadFile = createAsyncThunk<
  FileDTO,
  { file: File, comment: string | null },
  { rejectValue: RejectedPayload }
>(
  'files/uploadFile',
  async ({ file, comment }, { rejectWithValue }) => {
    try {
      const normalizedComment = comment && comment.trim().length > 0 ? comment : null;
      const created = await postFile(file, normalizedComment);
      return created;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status ?? null;

        const data = err.response?.data as { detail?: unknown; errors?: unknown } | undefined;

        const detailRaw = data?.detail;
        const detail = typeof detailRaw === 'string' ? detailRaw : 'Failed to upload file';

        const errorsRaw = data?.errors;
        const errors = typeof errorsRaw === 'object' && errorsRaw !== null ? (errorsRaw as Record<string, string[]>) : undefined;

        return rejectWithValue({ status, detail, errors });
      }

      return rejectWithValue({ status: null, detail: 'Failed to upload file' });
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

    builder.addCase(uploadFile.pending, (state) => {
      state.uploadStatus = 'loading';
      state.uploadError = null;
    });

    builder.addCase(uploadFile.fulfilled, (state, action: PayloadAction<FileDTO>) => {
      state.uploadStatus = 'succeeded';
      state.uploadError = null;
      state.items = [action.payload, ...state.items];
    });

    builder.addCase(uploadFile.rejected, (state, action) => {
      state.uploadStatus = 'failed';
      state.uploadError = action.payload?.detail ?? 'Failed to upload file';
    });
  },
});

export default filesSlice.reducer;
