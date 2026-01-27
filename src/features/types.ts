import type { UserPublic } from '../api/types';

// common
type  Status = 'idle' | 'loading' | 'succeeded' | 'failed';

type FieldErrors = Record<string, string[]>;

export type RejectedPayload = {
  status: number | null,
  detail: string,
  errors?: FieldErrors,
};

//auth
type AuthStatus = Status;

export type AuthState = {
  user: UserPublic | null,
  status: AuthStatus,
  error: string | null,
  fieldErrors: FieldErrors | null,
};

//files
type FilesStatus = Status;

export type FileDTO = {
  id: number,
  original_name: string,
  size_bytes: number,
  comment: string | null,
  uploaded: string,
  last_downloaded: string | null,
};

export type FilesState = {
  items: FileDTO[],
  status: FilesStatus,
  error: string | null,
};
