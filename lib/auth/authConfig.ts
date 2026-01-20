import NextAuth from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import Google from 'next-auth/providers/google';
import { prisma } from '../prisma';
import Resend from 'next-auth/providers/resend';
import GitHub from 'next-auth/providers/github';
import Facebook from 'next-auth/providers/facebook';
import { OAuth2Client } from 'google-auth-library';
import Credentials from 'next-auth/providers/credentials';
import { authorizeGoogleOneTap } from './googleOneTapAuthorize';

const googleClient = new OAuth2Client(process.env.AUTH_GOOGLE_ID);

const adapter = PrismaAdapter(prisma);

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter,
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 60 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/auth/signin-popup',
  },
  providers: [
    Credentials({
      id: 'google-onetap',
      name: 'Google One Tap',
      credentials: {
        credential: { type: 'text' },
      },
      async authorize(credentials) {
        if (typeof credentials?.credential !== 'string') return null;

        return authorizeGoogleOneTap({
          credential: credentials.credential,
          audience: process.env.AUTH_GOOGLE_ID,
          googleClient,
          adapter,
        });
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY!,
      from: process.env.AUTH_RESEND_FROM,
    }),
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID!,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return { ...token, id: user.id };
      }
      return token;
    },
    async session({ session, token }) {
      // console.log('Session callback called with session:', session, 'and token:', token)
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
        },
      };
    },
  },
});
