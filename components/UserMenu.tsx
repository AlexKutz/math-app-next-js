'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import { LoginButton } from './auth/LoginButton';
import { IoIosLogOut } from 'react-icons/io';
import Tooltip from './Tooltip';

export function UserMenu() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const user = session?.user;

  // Закриваємо меню, якщо клікнули поза ним
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  // Поки триває перевірка сесії, можна нічого не показувати або додати Skeleton
  if (status === 'loading')
    return <div className='h-10 w-10 animate-pulse rounded-full bg-gray-200' />;

  if (!user) {
    return (
      <Tooltip content='Увійти'>
        <LoginButton />
      </Tooltip>
    );
  }

  return (
    <div className='relative' ref={menuRef}>
      {/* Кнопка-аватар */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='flex h-10 w-10 shrink-0 cursor-pointer items-center transition hover:opacity-80 focus:outline-none'
      >
        {user.image ? (
          <Image
            src={user.image}
            alt='Аватар користувача'
            width={40}
            height={40}
            className='rounded-lg border border-gray-300 shadow dark:border-gray-600'
          />
        ) : (
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white'>
            {user.name?.charAt(0) || 'U'}
          </div>
        )}
      </button>

      <div
        className={`absolute right-1/2 z-50 mt-4 w-48 origin-top translate-1/5 transform rounded-md border border-gray-200 bg-white py-1 shadow-lg transition-all duration-200 ease-out dark:border-gray-500 dark:bg-transparent dark:shadow-sm dark:shadow-gray-700 ${
          isOpen
            ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none -translate-y-5 scale-95 opacity-0'
        } `}
      >
        <div className='border-b border-gray-100 px-4 py-2 text-sm text-gray-700 dark:border-gray-500 dark:text-gray-100'>
          <p className='truncate font-medium'>{user.name}</p>
          <p className='truncate text-xs text-gray-500 dark:text-gray-300'>
            {user.email}
          </p>
        </div>

        <button
          onClick={() => signOut()}
          className='flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-transparent'
        >
          <IoIosLogOut className='h-5 w-5' />
          Вийти
        </button>
      </div>
    </div>
  );
}
