export interface AuthUser {
  id: string;
  email: string | null;
  emailVerified?: boolean;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}
