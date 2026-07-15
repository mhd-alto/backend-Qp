export type AuthenticatedPrincipal = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  platformRole: string;
  status: string;
};
