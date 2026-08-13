import { apiFetch, setAccessToken } from './client';
import type { AuthUser } from '../types';

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  did?: string;
}

interface WalletIdResponse {
  did: string;
  address: string;
}

export async function login(user: string, password: string): Promise<AuthUser> {
  const tokenRes = await apiFetch<LoginResponse>('/login', {
    method: 'POST',
    body: JSON.stringify({ user, password }),
  });
  setAccessToken(tokenRes.access_token);

  const did = tokenRes.did || (await apiFetch<WalletIdResponse>('/wallet-id', {
    method: 'POST',
    body: JSON.stringify({}),
  })).did;

  return {
    username: user,
    did,
    accessToken: tokenRes.access_token,
    refreshToken: tokenRes.refresh_token,
  };
}

export async function logout(refreshToken: string | undefined): Promise<void> {
  try {
    if (refreshToken) {
      await apiFetch('/logout', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    }
  } finally {
    setAccessToken(null);
  }
}
