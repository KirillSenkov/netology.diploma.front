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

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login/', payload);
  return data;
}

export async function logout(): Promise<{ detail: string }> {
  const { data } = await api.get<{ detail: string }>('/auth/logout/');
  return data;
}
