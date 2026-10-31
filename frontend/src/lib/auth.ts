import type { TokenPair, User } from "@/types";

const ACCESS_TOKEN_KEY = "cardio_access_token";
const REFRESH_TOKEN_KEY = "cardio_refresh_token";
const USER_KEY = "cardio_user";

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

export function setUser(user: User): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser(): User | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedUser = window.localStorage.getItem(USER_KEY);
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
  window.localStorage.removeItem(USER_KEY);
}
