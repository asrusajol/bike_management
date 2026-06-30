import { apiClient } from './client';
import type { Token, UserCreate, UserResponse } from '@/types/auth';

export async function register(data: UserCreate): Promise<UserResponse> {
  return (await apiClient.post<UserResponse>('/auth/register', data)).data;
}

export async function login(data: { email: string; password: string }): Promise<Token> {
  const body = new URLSearchParams({ username: data.email, password: data.password });
  return (
    await apiClient.post<Token>('/auth/login', body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  ).data;
}

export async function getMe(): Promise<UserResponse> {
  return (await apiClient.get<UserResponse>('/auth/me')).data;
}
