export type UserLevel = 'user' | 'admin' | 'senior_admin' | 'superuser'

export type DownloadMode = 'download' | 'preview';

export interface UserPublic {
  id: number
  username: string
  full_name: string
  email: string
  is_admin: boolean
  is_staff?: boolean
  is_superuser?: boolean
  level?: UserLevel
  rank?: number
  storage_rel_path?: string
}

export interface FileItem {
  id: number
  original_name: string
  size_bytes: number
  comment: string | null
  uploaded: string // ISO datetime
  last_downloaded?: string | null
  share_enabled?: boolean
  share_token?: string | null
  share_url?: string | null
}

export interface ApiError {
  detail: string
  errors?: Record<string, string[]>
}
