'use client';

import { signIn } from 'next-auth/react';
import { useEffect, use } from 'react';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function SignInPopup({ searchParams }: PageProps) {
  const resolvedSearchParams = use(searchParams);
  const provider = resolvedSearchParams.provider as string;

  useEffect(() => {
    if (provider) {
      signIn(provider, { callbackUrl: '/auth/callback-success' });
    }
  }, [provider]);

  return (
    <div className='flex items-center justify-center min-h-screen'>
      <p className='text-lg'>
        Перенаправлення до {provider[0].toUpperCase() + provider.slice(1)}...
      </p>
    </div>
  );
}
