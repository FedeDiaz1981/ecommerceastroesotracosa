export type AuthRole = "Administrador" | "Cliente";

export type ViewerSession = {
  authenticated: boolean;
  userId: number;
  authUserId: string;
  email: string;
  name: string;
  role: AuthRole;
  canSeePrices: boolean;
  active: boolean;
  isAdmin: boolean;
};

