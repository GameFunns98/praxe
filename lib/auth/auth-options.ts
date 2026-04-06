import { prisma } from '@/lib/prisma';
import type { Role } from '@/lib/auth/roles';
import bcrypt from 'bcryptjs';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import DiscordProvider from 'next-auth/providers/discord';

const DISCORD_SCOPE = 'identify email guilds';

type DiscordProfile = {
  id: string;
  email?: string;
  username?: string;
  global_name?: string;
  avatar?: string;
};

function resolveDiscordAvatar(profile: DiscordProfile) {
  if (!profile.avatar) return null;
  return `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'LocalSuperadmin',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Heslo', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user || !user.active || !user.isSuperadmin) return null;
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;

        if (user.forcePasswordReset) {
          console.warn(`[Auth] Superadmin ${user.email} has forcePasswordReset=true; allowing fallback login to prevent lockout.`);
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date(), authProvider: user.discordUserId ? 'HYBRID' : 'LOCAL' }
        });

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          authProvider: user.discordUserId ? 'HYBRID' : 'LOCAL',
          forcePasswordReset: user.forcePasswordReset,
          discordAvatar: user.discordAvatar,
          discordGlobalName: user.discordGlobalName
        };
      }
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID ?? '',
      clientSecret: process.env.DISCORD_CLIENT_SECRET ?? '',
      authorization: { params: { scope: DISCORD_SCOPE } }
    })
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== 'discord') return true;

      const discordProfile = profile as DiscordProfile;
      const email = discordProfile.email?.toLowerCase();
      const discordUserId = discordProfile.id;

      if (!email) {
        console.warn('[Auth] Discord login failed: missing email in profile', { discordUserId });
        return '/login?error=DiscordEmailMissing';
      }

      const existingByDiscord = await prisma.user.findUnique({ where: { discordUserId } });
      if (existingByDiscord) {
        if (!existingByDiscord.active) {
          console.info('[Auth] Discord login blocked: account disabled', { userId: existingByDiscord.id });
          return '/login?error=AccountDisabled';
        }
        await prisma.user.update({
          where: { id: existingByDiscord.id },
          data: {
            discordUsername: discordProfile.username,
            discordGlobalName: discordProfile.global_name,
            discordAvatar: resolveDiscordAvatar(discordProfile),
            lastLoginAt: new Date(),
            authProvider: existingByDiscord.isSuperadmin ? 'HYBRID' : 'DISCORD'
          }
        });
        return true;
      }

      const existingByEmail = await prisma.user.findUnique({ where: { email } });
      if (existingByEmail) {
        if (!existingByEmail.active) {
          console.info('[Auth] Discord login blocked after email link: account disabled', { userId: existingByEmail.id });
          return '/login?error=AccountDisabled';
        }
        await prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            discordUserId,
            discordUsername: discordProfile.username,
            discordGlobalName: discordProfile.global_name,
            discordAvatar: resolveDiscordAvatar(discordProfile),
            lastLoginAt: new Date(),
            authProvider: existingByEmail.isSuperadmin ? 'HYBRID' : 'DISCORD'
          }
        });
        return true;
      }

      await prisma.user.create({
        data: {
          fullName: discordProfile.global_name || discordProfile.username || 'Nový uživatel',
          callsign: `PENDING-${discordUserId.slice(0, 6)}`,
          rankTitle: 'Čeká na schválení',
          email,
          passwordHash: await bcrypt.hash(crypto.randomUUID(), 10),
          role: 'TRAINEE',
          active: true,
          authProvider: 'DISCORD',
          discordUserId,
          discordUsername: discordProfile.username,
          discordGlobalName: discordProfile.global_name,
          discordAvatar: resolveDiscordAvatar(discordProfile)
        }
      });

      console.info('[Auth] Discord login created active user with TRAINEE role', { email, discordUserId });
      return true;
    },
    async jwt({ token, user, account }) {
      if (user?.id) {
        token.sub = user.id;
      }

      let dbUser = null;
      if (account?.provider === 'discord' && account.providerAccountId) {
        dbUser = await prisma.user.findUnique({ where: { discordUserId: account.providerAccountId } });
      } else if (token.sub) {
        dbUser = await prisma.user.findUnique({ where: { id: token.sub } });
      }

      if (dbUser) {
        token.sub = dbUser.id;
        token.role = dbUser.role as Role;
        token.authProvider = dbUser.authProvider;
        token.forcePasswordReset = dbUser.forcePasswordReset;
        token.discordAvatar = dbUser.discordAvatar;
        token.discordGlobalName = dbUser.discordGlobalName;
      }

      if (account?.provider === 'discord' && account.access_token) {
        token.discordAccessToken = account.access_token;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? '';
        session.user.role = token.role as Role;
        session.user.authProvider = (token.authProvider as any) ?? 'DISCORD';
        session.user.forcePasswordReset = Boolean(token.forcePasswordReset);
        session.user.discordAvatar = token.discordAvatar;
        session.user.discordGlobalName = token.discordGlobalName;
        session.user.discordAccessToken = token.discordAccessToken;
      }
      return session;
    }
  }
};
