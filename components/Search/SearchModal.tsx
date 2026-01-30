'use client';

import { useState, useEffect } from 'react';
import { Modal } from '../Modal';
import { getSearchData, SearchItem } from '@/lib/search-actions';
import { useRouter } from 'next/navigation';
import { IoSearch, IoBookOutline, IoFolderOutline, IoSchoolOutline } from 'react-icons/io5';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export const SearchModal = ({ isOpen, onClose }: Props) => {
  const [query, setQuery] = useState('');
  const [allItems, setAllItems] = useState<SearchItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<SearchItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    setQuery('');
    if (isOpen) {
      getSearchData().then((data) => {
        setAllItems(data);
        setFilteredItems(data.slice(0, 5)); // Show some initial items
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim() === '') {
      setFilteredItems(allItems.slice(0, 5));
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(lowerQuery) ||
        (item.description && item.description.toLowerCase().includes(lowerQuery)) ||
        item.subjectTitle.toLowerCase().includes(lowerQuery)
    );
    setFilteredItems(filtered.slice(0, 10)); // Limit results
  }, [query, allItems]);

  const handleItemClick = (href: string) => {
    router.push(href);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal onClose={onClose} align="start" maxWidth="max-w-xl">
      <div className="mt-6 flex flex-col gap-4 select-none">
        <div className="relative">
          <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <input
            autoFocus
            type="text"
            placeholder="Search topics, sections, or subjects..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="h-[450px] overflow-y-auto">
          {filteredItems.length > 0 ? (
            <div className="flex flex-col gap-2">
              {filteredItems.map((item, index) => (
                <button
                  key={`${item.type}-${item.href}-${index}`}
                  onClick={() => handleItemClick(item.href)}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted text-left transition-colors group"
                >
                  <div className="mt-1">
                    {item.type === 'subject' && <IoSchoolOutline className="h-5 w-5 text-amber-500" />}
                    {item.type === 'section' && <IoFolderOutline className="h-5 w-5 text-blue-500" />}
                    {item.type === 'lesson' && <IoBookOutline className="h-5 w-5 text-green-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground truncate">
                        {item.title}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border uppercase">
                        {item.type}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {item.description}
                      </p>
                    )}
                    <span className="text-xs text-muted-foreground/60">
                      In {item.subjectTitle}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No results found for "{query}"
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
