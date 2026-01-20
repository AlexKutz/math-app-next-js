import type { Adapter } from 'next-auth/adapters';
import type { OAuth2Client } from 'google-auth-library';

type AuthorizedUser = {
  id: string;
  email: string;
  name?: string;
  image?: string;
};

type Params = {
  credential: string;
  audience?: string;
  googleClient: OAuth2Client;
  adapter: Adapter;
};

export async function authorizeGoogleOneTap({
  credential,
  audience,
  googleClient,
  adapter,
}: Params): Promise<AuthorizedUser | null> {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience,
    });

    const payload = ticket.getPayload();
    if (!payload?.email || !payload.sub) return null;

    const email = payload.email.toLowerCase();
    const name = payload.name ?? null;
    const image = payload.picture ?? null;

    const accountProvider = 'google';
    const accountProviderAccountId = payload.sub;

    const existingAccountUser = await adapter.getUserByAccount?.({
      provider: accountProvider,
      providerAccountId: accountProviderAccountId,
    });

    if (existingAccountUser?.id) {
      return {
        id: String(existingAccountUser.id),
        email: existingAccountUser.email ?? email,
        name: existingAccountUser.name ?? undefined,
        image: existingAccountUser.image ?? undefined,
      };
    }

    let user = await adapter.getUserByEmail?.(email);
    if (!user) {
      user = await adapter.createUser?.({
        email,
        name,
        image,
        emailVerified: new Date(),
      } as any);
    } else if (
      (name && user.name !== name) ||
      (image && user.image !== image)
    ) {
      user = await adapter.updateUser?.({
        id: user.id,
        name,
        image,
      } as any);
    }

    if (!user?.id) return null;

    try {
      await adapter.linkAccount?.({
        userId: String(user.id),
        type: 'oauth',
        provider: accountProvider,
        providerAccountId: accountProviderAccountId,
        id_token: credential,
        token_type: 'Bearer',
      } as any);
    } catch (linkError) {
      // If a concurrent request already linked the same account, we can proceed.
      console.warn('[auth][google-onetap] linkAccount skipped', linkError);
    }

    return {
      id: String(user.id),
      email,
      name: name ?? undefined,
      image: image ?? undefined,
    };
  } catch (error) {
    console.error('[auth][google-onetap] authorize failed', error);
    return null;
  }
}
