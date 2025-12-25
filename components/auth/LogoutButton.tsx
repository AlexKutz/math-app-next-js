'use client';

import { handleGoogleSignOut } from '@/lib/auth/googleSignOutServerAction';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface SignOutButtonProps {
  children?: React.ReactNode;
  className?: string;
}

export const SignOutButton = (props: SignOutButtonProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const params = new URLSearchParams(searchParams.toString());
  params.delete('login');
  router.push(`${pathname}?${params.toString()}`);

  return (
    <button
      className={`cursor-pointer ${props.className}`}
      onClick={() => {
        handleGoogleSignOut();
      }}
    >
      {props.children || 'Sign Out'}
    </button>
  );
};
