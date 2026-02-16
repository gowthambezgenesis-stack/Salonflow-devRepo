import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

let accessToken: string | null = null;
let tokenExpiry: number | null = null;

interface DecodedToken {
  phone_number: string;
  role: 'customer' | 'owner';
  name?: string;
  exp: number;
  iat: number;
  type: 'access';
}

function decodeToken(token: string): DecodedToken | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;

  const now = Math.floor(Date.now() / 1000);
  return decoded.exp < now + 60;
}


export function setAccessToken(token: string): void {
  accessToken = token;
  const decoded = decodeToken(token);
  if (decoded && decoded.exp) {
    tokenExpiry = decoded.exp * 1000;
  }
}


export function getAccessToken(): string | null {
  return accessToken;
}


export function clearAccessToken(): void {
  accessToken = null;
  tokenExpiry = null;
}


export function isAuthenticated(): boolean {
  if (!accessToken) return false;
  return !isTokenExpired(accessToken);
}


export async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/refresh-token/`,
      {},
      {
        withCredentials: true,
      }
    );

    const { access_token, role, name, phone_number } = response.data;

    if (access_token) {
      setAccessToken(access_token);
      return access_token;
    }

    return null;
  } catch (error) {
    console.error('Token refresh failed:', error);
    clearAccessToken();
    return null;
  }
}

export async function getValidAccessToken(): Promise<string | null> {
  if (!accessToken || isTokenExpired(accessToken)) {
    const newToken = await refreshAccessToken();
    return newToken;
  }

  return accessToken;
}


export function getUserInfo(): { role: 'customer' | 'owner' | null; name?: string; phone_number?: string } {
  if (!accessToken) {
    return { role: null };
  }

  const decoded = decodeToken(accessToken);
  if (!decoded) {
    return { role: null };
  }

  return {
    role: decoded.role,
    name: decoded.name,
    phone_number: decoded.phone_number,
  };
}


export async function logout(): Promise<void> {
  try {
    await axios.post(
      `${API_BASE_URL}/logout/`,
      {},
      {
        withCredentials: true,
      }
    );
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    clearAccessToken();
  }
}


export async function initializeAuth(): Promise<{
  isAuthenticated: boolean;
  role: 'customer' | 'owner' | null;
  name?: string;
  phone_number?: string;
}> {
  try {
    const token = await refreshAccessToken();

    if (token) {
      const userInfo = getUserInfo();
      return {
        isAuthenticated: true,
        role: userInfo.role || null,
        name: userInfo.name,
        phone_number: userInfo.phone_number,
      };
    }
  } catch (error) {
    console.error('Auth initialization failed:', error);
  }

  return {
    isAuthenticated: false,
    role: null,
  };
}
