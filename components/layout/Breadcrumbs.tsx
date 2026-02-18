import Link from 'next/link';
import { AiOutlineHome } from 'react-icons/ai';
import { MdChevronRight } from 'react-icons/md';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className='select-none mb-8 flex' aria-label='Breadcrumb'>
      <ol className='inline-flex items-center space-x-1 md:space-x-3'>
        <li className='inline-flex items-center'>
          <Link
            href='/'
            className='inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors'
          >
            <AiOutlineHome className='mr-2.5 h-4 w-4' />
            Головна
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index}>
            <div className='flex items-center'>
              <MdChevronRight className='h-5 w-5 text-muted-foreground' />
              {item.href ? (
                <Link
                  href={item.href}
                  className='ml-1 truncate max-w-[150px] line-clamp-2 text-sm font-medium text-muted-foreground hover:text-primary md:ml-2 md:max-w-[300px] transition-colors'
                >
                  {item.label}
                </Link>
              ) : (
                <span className='ml-1 truncate max-w-[150px] line-clamp-2 text-sm font-medium text-foreground md:ml-2 md:max-w-[500px]'>
                  {item.label}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
