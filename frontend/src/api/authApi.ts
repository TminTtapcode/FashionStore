import type { ApiResponse, User } from '../types/auth';

const BASE_URL = '/api/v1/auth';

export async function registerApi(data: {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}): Promise<User> {
  const response = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const body: ApiResponse<User> = await response.json();
  if (!response.ok || body.error) {
    const errorMsg = body.error?.message || 'Đăng ký thất bại';
    const fieldErrors = body.error?.details?.fieldErrors;
    if (fieldErrors && Object.keys(fieldErrors).length > 0) {
      throw new Error(Object.values(fieldErrors)[0]);
    }
    throw new Error(errorMsg);
  }

  return body.data;
}

export async function loginApi(data: {
  email: string;
  password: string;
}): Promise<User> {
  const response = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const body: ApiResponse<User> = await response.json();
  if (!response.ok || body.error) {
    throw new Error(body.error?.message || 'Đăng nhập không thành công');
  }

  return body.data;
}

export async function logoutApi(): Promise<void> {
  await fetch(`${BASE_URL}/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}

export async function getMeApi(): Promise<User | null> {
  try {
    const response = await fetch(`${BASE_URL}/me`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const body: ApiResponse<User> = await response.json();
    return body.data || null;
  } catch {
    return null;
  }
}
