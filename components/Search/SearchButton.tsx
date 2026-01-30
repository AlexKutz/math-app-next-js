'use client';

import { IoSearch } from 'react-icons/io5';
import { HeaderButton } from '../HeaderButton';
import { SearchModal } from './SearchModal';
import { useModalState } from '@/lib/hooks/useModal';

export const SearchButton = () => {
  const { isOpen, open, close } = useModalState(false);

  return (
    <>
      <HeaderButton onClickHandler={open}>
        <IoSearch className="h-5 w-5 text-gray-500 transition-colors duration-100 dark:text-gray-200" />
      </HeaderButton>

      <SearchModal isOpen={isOpen} onClose={close} />
    </>
  );
};
