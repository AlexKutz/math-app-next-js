import { auth } from '@/lib/auth/authConfig';

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function canModerate(session: any) {
  return session?.user?.role === 'ADMIN';
}