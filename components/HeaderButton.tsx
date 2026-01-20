'use client';

interface HeaderButtonProps {
  onClickHandler: () => void;
  children: React.ReactNode;
  className?: string;
}

export const HeaderButton = ({
  onClickHandler,
  children,
  className,
}: HeaderButtonProps) => {
  return (
    <button
      onClick={onClickHandler}
      className={`gray flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-gray-300 shadow-xs dark:border-gray-500 dark:shadow-sm ${className || ''}`}
    >
      {children}
    </button>
  );
};
