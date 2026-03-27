import { DefaultSession } from 'next-auth';
import type { Role } from '@/lib/auth/roles';
import type { AuthProvider } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
      authProvider: AuthProvider;
      forcePasswordReset: boolean;
      discordAvatar?: string | null;
      discordGlobalName?: string | null;
      discordAccessToken?: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: Role;
    authProvider?: AuthProvider;
    forcePasswordReset?: boolean;
    discordAvatar?: string | null;
    discordGlobalName?: string | null;
    discordAccessToken?: string;
  }
}
