'use client';

import { LoginModal } from '@/components/auth/LoginModal';
import { useSearchParams } from 'next/navigation';

import { useRouter, usePathname } from 'next/navigation';
import { IoLogInOutline } from 'react-icons/io5';
import { HeaderButton } from '../HeaderButton';

export const LoginButton = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const showLogin = searchParams.get('login') === 'true';

  const buildUrl = (params: URLSearchParams) => {
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const openLogin = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('login', 'true');
    router.replace(buildUrl(params));
  };

  const closeLogin = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('login');
    router.replace(buildUrl(params));
  };

  return (
    <>
      <HeaderButton onClickHandler={openLogin}>
        <IoLogInOutline className='h-6 w-6 text-gray-500 dark:text-gray-200' />
      </HeaderButton>
      {showLogin && <LoginModal onClose={closeLogin} />}
    </>
  );
};
