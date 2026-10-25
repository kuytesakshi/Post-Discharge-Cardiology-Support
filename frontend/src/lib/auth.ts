import type { TokenPair, User } from "@/types";

const ACCESS_TOKEN_KEY = "cardio_access_token";
const REFRESH_TOKEN_KEY = "cardio_refresh_token";
const MOCK_USER_KEY = "cardio_mock_user";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(tokens: TokenPair): void {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
}

export function setMockUser(user: User): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
}

export function getMockUser(): User | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedUser = window.localStorage.getItem(MOCK_USER_KEY);
  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as User;
  } catch {
    return null;
  }
}

export function clearTokens(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(MOCK_USER_KEY);
}
