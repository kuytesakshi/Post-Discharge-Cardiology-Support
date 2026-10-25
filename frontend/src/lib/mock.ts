import mockUsersJson from "@/mocks/users.json";
import { getRoleLabel } from "@/lib/roles";
import type { TokenPair, User, UserRole } from "@/types";

type MockUser = User & {
  password: string;
};

const mockFlag = process.env.NEXT_PUBLIC_MOCK?.toLowerCase();

export const isMockMode = mockFlag === "true" || mockFlag === "1";

const mockUsers = mockUsersJson.users as unknown as MockUser[];

export function mockLogin(
  email: string,
  password: string,
  role: UserRole,
): { tokens: TokenPair; user: User } {
  const normalizedEmail = email.trim().toLowerCase();
  const record = mockUsers.find(
    (user) => user.email.toLowerCase() === normalizedEmail,
  );

  if (!record) {
    throw new Error(
      "We couldn't find an account with that email. Check the address and try again.",
    );
  }

  if (record.password !== password) {
    throw new Error("That password doesn't match our records.");
  }

  if (record.role.name !== role) {
    throw new Error(
      `This account signs in as ${getRoleLabel(record.role.name)}. Switch the role above and try again.`,
    );
  }

  if (!record.is_active) {
    throw new Error("This account is inactive.");
  }

  const user: User = {
    id: record.id,
    email: record.email,
    name: record.name,
    role: record.role,
    is_active: record.is_active,
    created_at: record.created_at,
  };

  return {
    tokens: {
      access_token: `mock-access.${user.role.name}.${user.id}.${Date.now()}`,
      refresh_token: `mock-refresh.${user.role.name}.${user.id}.${Date.now()}`,
      token_type: "bearer",
      expires_in: 3600,
    },
    user,
  };
}
