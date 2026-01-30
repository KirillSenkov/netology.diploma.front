import { api } from './http';
import type { UserPublic } from './types';

export type LoginRequest = {
  username: string,
  password: string,
};

export type LoginResponse = {
  detail: string,
  user: UserPublic,
};

export type MeResponse = {
  user: UserPublic,
};

export type RegisterRequest = {
  username: string,
  full_name: string,
  email: string,
  password: string,
};

export type RegisterResponse = Pick<
  UserPublic,
  'id' | 'username' | 'full_name' | 'email' | 'is_admin' | 'storage_rel_path'
>

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login/', payload);
  return data;
}

export async function logout(): Promise<{ detail: string }> {
  const { data } = await api.get<{ detail: string }>('/auth/logout/');
  return data;
}

export async function me(): Promise<MeResponse> {
  const { data } = await api.get<MeResponse>('/auth/me/');
  return data;
}

export async function register(payload: RegisterRequest): Promise<RegisterResponse> {
  const { data } = await api.post<RegisterResponse>('/auth/register/', payload);
  return data;
}
