export type UserRole =
  | "super_admin"
  | "admin"
  | "supervisor"
  | "viewer";

export type AuthUser = {
  id: string;
  name: string;
  username: string;
  email?: string | null;
  mobile?: string | null;
  role: UserRole;
  status?: string;
  isActive?: boolean;
  lastLoginAt?: string | null;
};

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export type LoginCredentials = {
  identifier: string;
  password: string;
};

