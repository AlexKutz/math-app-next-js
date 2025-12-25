'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import { LoginButton } from './auth/LoginButton';
import { IoIosLogOut } from 'react-icons/io';

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
    return <div className='w-10 h-10 rounded-full bg-gray-200 animate-pulse' />;

  if (!user) {
    return <LoginButton />;
  }

  return (
    <div className='relative' ref={menuRef}>
      {/* Кнопка-аватар */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='cursor-pointer flex items-center focus:outline-none transition hover:opacity-80'
      >
        {user.image ? (
          <Image
            src={user.image}
            alt='Аватар користувача'
            width={40}
            height={40}
            className='rounded-full border border-gray-300'
          />
        ) : (
          <div className='w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white'>
            {user.name?.charAt(0) || 'U'}
          </div>
        )}
      </button>

      <div
        className={`
    absolute right-1/2 translate-1/2 mt-2 w-48 bg-white border border-gray-200
    rounded-md shadow-lg py-1 z-50
    transform transition-all duration-200 ease-out
    origin-top
    ${
      isOpen
        ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
        : 'opacity-0 scale-95 -translate-y-5 pointer-events-none'
    }
  `}
      >
        <div className='px-4 py-2 text-sm text-gray-700 border-b border-gray-100'>
          <p className='font-medium truncate'>{user.name}</p>
          <p className='text-xs text-gray-500 truncate'>{user.email}</p>
        </div>

        <button
          onClick={() => signOut()}
          className='cursor-pointer flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition'
        >
          <IoIosLogOut className='w-5 h-5' />
          Вийти
        </button>
      </div>
    </div>
  );
}
