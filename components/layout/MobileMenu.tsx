'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AiOutlineHome } from 'react-icons/ai';
import { TbMathFunction } from 'react-icons/tb';
import { LuAtom } from 'react-icons/lu';
import { BiMath } from 'react-icons/bi';
import { TbGeometry } from 'react-icons/tb';
import { HiOutlineMenuAlt3, HiOutlineX } from 'react-icons/hi';

const navigationItems = [
  { href: '/', icon: AiOutlineHome, label: 'Головна' },
  { href: '/math', icon: BiMath, label: 'Математика' },
  { href: '/algebra', icon: TbMathFunction, label: 'Алгебра' },
  { href: '/geometry', icon: TbGeometry, label: 'Геометрія' },
  { href: '/physics', icon: LuAtom, label: 'Фізика' },
];

const MobileNavigationLink = ({
  href,
  icon: Icon,
  label,
  onClick,
}: {
  href: string;
  icon: any;
  label: string;
  onClick: () => void;
}) => {
  return (
    <Link
      href={href}
      onClick={onClick}
      className='flex items-center gap-3 rounded-lg px-4 py-3 text-foreground hover:bg-muted'
    >
      <Icon className='h-5 w-5' />
      {label}
    </Link>
  );
};

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <div className='lg:hidden'>
      {/* Burger button */}
      <button
        onClick={toggleMenu}
        className='flex h-10 w-10 items-center justify-center rounded-lg text-foreground hover:bg-muted'
        aria-label={isOpen ? 'Закрити меню' : 'Відкрити меню'}
      >
        {isOpen ? (
          <HiOutlineX className='h-6 w-6' />
        ) : (
          <HiOutlineMenuAlt3 className='h-6 w-6' />
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className='fixed inset-0 top-[60px] z-40 bg-black/50'
          onClick={closeMenu}
        />
      )}

      {/* Mobile menu panel */}
      <div
        className={`fixed top-[60px] right-0 left-0 z-50 transform border-b border-border bg-background shadow-lg transition-all duration-300 ease-in-out ${
          isOpen
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none -translate-y-2 opacity-0'
        }`}
      >
        <nav className='flex flex-col py-2'>
          {navigationItems.map((item) => (
            <MobileNavigationLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              onClick={closeMenu}
            />
          ))}
        </nav>
      </div>
    </div>
  );
}
