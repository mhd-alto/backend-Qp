export type AuthenticationIdentity = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  platformRole: string;
  status: string;
  passwordHash: string;
};

export interface IdentityReader {
  findByIdentifier(identifier: string): Promise<AuthenticationIdentity | null>;
  findById(userId: string): Promise<AuthenticationIdentity | null>;
  markLoginSuccess(userId: string): Promise<void>;
}
