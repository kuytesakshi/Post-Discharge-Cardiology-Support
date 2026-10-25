import { apiFetch } from "@/lib/api";
import { clearTokens, setMockUser, setTokens } from "@/lib/auth";
import { getRoleLabel } from "@/lib/roles";
import type { TokenPair, User, UserRole } from "@/types";

type LoginInput = {
  email: string;
  password: string;
  role: UserRole;
};

const isMockMode =
  process.env.NEXT_PUBLIC_MOCK === "true" ||
  process.env.NEXT_PUBLIC_MOCK === "1";

export async function loginWithRole({
  email,
  password,
  role,
}: LoginInput): Promise<User> {
  if (isMockMode) {
    const { mockLogin } = await import("@/lib/mock");
    const { tokens, user } = mockLogin(email, password, role);
    setTokens(tokens);
    setMockUser(user);
    return user;
  }

  const tokens = await apiFetch<TokenPair>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setTokens(tokens);

  try {
    const user = await apiFetch<User>("/auth/me");
    if (user.role.name !== role) {
      throw new Error(
        `This account signs in as ${getRoleLabel(user.role.name)}. Switch the role and try again.`,
      );
    }
    return user;
  } catch (error) {
    clearTokens();
    throw error;
  }
}
