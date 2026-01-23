import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { isAxiosError } from 'axios';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { UserPublic } from '../../api/types';
import { login as apiLogin, logout as apiLogout } from '../../api/auth';

type AuthStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

type RejectedPayload = {
  status: number | null,
  detail: string,
};

type AuthState = {
  user: UserPublic | null,
  status: AuthStatus,
  error: string | null,
};

const initialState: AuthState = {
  user: null,
  status: 'idle',
  error: null,
};

export const login = createAsyncThunk<
  UserPublic,
  { username: string, password: string },
  { rejectValue: RejectedPayload }
>(
  'auth/login',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiLogin(payload);
      return res.user;
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const status = err.response?.status ?? null;
        const detailRaw = (err.response?.data as { detail?: unknown } | undefined)?.detail;
        const detail = typeof detailRaw === 'string' ? detailRaw : 'Login failed';

        return rejectWithValue({ status, detail });
      }

      return rejectWithValue({ status: null, detail: 'Login failed' });
    }
  }
);

export const logout = createAsyncThunk<
  void,
  void,
  { rejectValue: RejectedPayload }
>(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await apiLogout();
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const status = err.response?.status ?? null;
        const detailRaw = (err.response?.data as { detail?: unknown } | undefined)?.detail;
        const detail = typeof detailRaw === 'string' ? detailRaw : 'Logout failed';

        return rejectWithValue({ status, detail });
      }

      return rejectWithValue({ status: null, detail: 'Logout failed' });
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    resetAuthError(state) {
      state.error = null;
    },
  },
  extraReducers(builder) {
    builder.addCase(login.pending, (state) => {
      state.status = 'loading';
      state.error = null;
    });

    builder.addCase(login.fulfilled, (state, action: PayloadAction<UserPublic>) => {
      state.status = 'succeeded';
      state.user = action.payload;
      state.error = null;
    });

    builder.addCase(login.rejected, (state, action) => {
      state.status = 'failed';
      state.user = null;
      state.error = action.payload?.detail ?? 'Login failed';
    });

    builder.addCase(logout.pending, (state) => {
      state.status = 'loading';
      state.error = null;
    });

    builder.addCase(logout.fulfilled, (state) => {
      state.status = 'idle';
      state.user = null;
      state.error = null;
    });

    builder.addCase(logout.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.payload?.detail ?? 'Logout failed';
    });
  },
});

export const { resetAuthError } = authSlice.actions;

export default authSlice.reducer;
