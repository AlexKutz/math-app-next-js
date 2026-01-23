import Link from 'next/link';
import { UserMenu } from './UserMenu';
import { ThemeToggle } from './ThemeSwither/ThemeSwitcher';
import { SearchButton } from './Search/SearchButton';
import Tooltip from './Tooltip';
import { ChangeLanguageButton } from './ChangeLanguageButton';
import { AiOutlineHome } from 'react-icons/ai';
import { TbMathFunction } from 'react-icons/tb';
import { LuAtom } from 'react-icons/lu';
import { BiMath } from "react-icons/bi";
import { TbGeometry } from "react-icons/tb";

const NavigationLink = ({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: any;
  label: string;
}) => {
  return (
    <Link
      href={href}
      className='flex items-center gap-2 rounded-lg py-2 pr-4 pl-3 hover:bg-gray-100 dark:text-shadow-gray-600 dark:text-shadow-xs dark:hover:bg-[#5a5a3933]'
    >
      <Icon className='mb-0.5 h-5 w-5' />
      {label}
    </Link>
  );
};

export default async function Header() {
  const showTooltips = true;

  return (
    <header className='fixed mt-2 w-full border-t border-b border-gray-300 px-8 py-1 dark:border-gray-500 dark:shadow-2xl dark:shadow-[#5c5c387e]'>
      <div className='m-auto flex max-w-5xl items-center justify-between gap-3 px-12'>
        <nav className='text-md mr-8 flex h-12 items-center gap-2 text-gray-700 dark:text-gray-100'>
          <NavigationLink href='/' icon={AiOutlineHome} label='Головна' />
          <div className='h-1.5 w-1.5 rounded-3xl bg-gray-400'></div>
          <NavigationLink
            href='/math'
            icon={BiMath}
            label='Математика'
          />
          <div className='h-1.5 w-1.5 rounded-3xl bg-gray-400'></div>
          <NavigationLink
            href='/algebra'
            icon={TbMathFunction}
            label='Алгебра'
          />
          <div className='h-1.5 w-1.5 rounded-3xl bg-gray-400'></div>

          <NavigationLink
            href='/geometry'
            icon={TbGeometry}
            label='Геометрія'
          />
          <div className='h-1.5 w-1.5 rounded-3xl bg-gray-400'></div>
          <NavigationLink href='/physics' icon={LuAtom} label='Фізика' />
        </nav>
        <div className='flex gap-2.5'>
          <Tooltip content='Пошук'>
            <SearchButton />
          </Tooltip>
          {/* <Tooltip content='Змінити мову'>
            <ChangeLanguageButton />
          </Tooltip> */}
          <Tooltip content='Нічний режим' delay={100}>
            <ThemeToggle />
          </Tooltip>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
