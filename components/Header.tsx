import Link from 'next/link';
import { UserMenu } from './UserMenu';
import { ThemeToggle } from './ThemeSwither/ThemeSwitcher';
import { SearchButton } from './Search/SearchButton';
import Tooltip from './Tooltip';
import { ChangeLanguageButton } from './ChangeLanguageButton';
import { MobileMenu } from './MobileMenu';
import { AiOutlineHome } from 'react-icons/ai';
import { TbMathFunction } from 'react-icons/tb';
import { LuAtom } from 'react-icons/lu';
import { BiMath } from 'react-icons/bi';
import { TbGeometry } from 'react-icons/tb';

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
      className='flex items-center gap-2 rounded-lg py-2 pr-4 pl-3 hover:bg-muted dark:text-shadow-gray-600 dark:text-shadow-xs'
    >
      <Icon className='mb-0.5 h-5 w-5' />
      {label}
    </Link>
  );
};

export default async function Header() {
  const showTooltips = true;

  return (
    <header className='fixed z-10 mt-2 w-full border-t border-b border-border bg-background px-2 py-1 sm:px-8 dark:shadow-2xl dark:shadow-[#5c5c387e]'>
      <div className='m-auto flex max-w-5xl items-center justify-between gap-3 px-2 sm:px-12'>
        {/* Mobile menu */}
        <MobileMenu />

        {/* Desktop navigation */}
        <nav className='text-md mr-8 hidden h-12 items-center gap-2 text-foreground lg:flex'>
          <NavigationLink href='/' icon={AiOutlineHome} label='Головна' />
          <div className='h-1.5 w-1.5 rounded-3xl bg-muted-foreground'></div>
          <NavigationLink href='/math' icon={BiMath} label='Математика' />
          <div className='h-1.5 w-1.5 rounded-3xl bg-muted-foreground'></div>
          <NavigationLink
            href='/algebra'
            icon={TbMathFunction}
            label='Алгебра'
          />
          <div className='h-1.5 w-1.5 rounded-3xl bg-muted-foreground'></div>

          <NavigationLink
            href='/geometry'
            icon={TbGeometry}
            label='Геометрія'
          />
          <div className='h-1.5 w-1.5 rounded-3xl bg-muted-foreground'></div>
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
