'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { getSearchData, SearchItem } from '@/lib/search-actions';
import { useRouter } from 'next/navigation';
import { IoSearch, IoBookOutline, IoFolderOutline, IoSchoolOutline, IoTimeOutline } from 'react-icons/io5';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const optionNames = {
  subject: 'Предмет',
  section: 'Розділ',
  lesson: 'Тема',
};

const RECENT_ITEMS_KEY = 'search-recent-items';
const MAX_RECENT_ITEMS = 5;

// Type for stored recent items (serializable version of SearchItem)
type RecentItem = SearchItem & { visitedAt: number };

// Helper functions for localStorage
const getRecentItems = (): RecentItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_ITEMS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveRecentItem = (item: SearchItem): void => {
  if (typeof window === 'undefined') return;
  try {
    const recentItems = getRecentItems();
    const newItem: RecentItem = { ...item, visitedAt: Date.now() };
    
    // Remove existing item with same href to avoid duplicates
    const filteredItems = recentItems.filter(i => i.href !== item.href);
    
    // Add new item at the beginning and limit to max
    const updatedItems = [newItem, ...filteredItems].slice(0, MAX_RECENT_ITEMS);
    
    localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(updatedItems));
  } catch (error) {
    console.error('Failed to save recent item:', error);
  }
};

export const SearchModal = ({ isOpen, onClose }: Props) => {
  const [query, setQuery] = useState('');
  const [allItems, setAllItems] = useState<SearchItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<SearchItem[]>([]);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [showRecentItems, setShowRecentItems] = useState(false);
  const router = useRouter();

  // Load recent items and all data when modal opens
  useEffect(() => {
    setQuery('');
    if (isOpen) {
      const loadedRecentItems = getRecentItems();
      setRecentItems(loadedRecentItems);
      getSearchData().then((data) => {
        setAllItems(data);
      });
    }
  }, [isOpen]);

  // Filter items based on query and recent items
  useEffect(() => {
    if (query.trim() === '') {
      // No query - show recent items at top, then initial items
      setShowRecentItems(true);
      const recentHrefs = new Set(recentItems.map(i => i.href));
      const otherItems = allItems.filter(item => !recentHrefs.has(item.href)).slice(0, 6 - recentItems.length);
      setFilteredItems([...recentItems, ...otherItems]);
      return;
    }

    // With query - filter all items including recent items
    setShowRecentItems(false);
    const lowerQuery = query.toLowerCase();
    const allSearchableItems = [...allItems];
    const filtered = allSearchableItems.filter(
      (item) =>
        item.title.toLowerCase().includes(lowerQuery) ||
        (item.description && item.description.toLowerCase().includes(lowerQuery)) ||
        item.subjectTitle.toLowerCase().includes(lowerQuery)
    );
    setFilteredItems(filtered.slice(0, 10)); // Limit results
  }, [query, allItems, recentItems]);

  const handleItemClick = useCallback((item: SearchItem) => {
    // Save to recent items before navigating
    saveRecentItem(item);
    // Update local state
    setRecentItems(prev => {
      const filtered = prev.filter(i => i.href !== item.href);
      return [{ ...item, visitedAt: Date.now() }, ...filtered].slice(0, MAX_RECENT_ITEMS);
    });
    router.push(item.href);
    onClose();
  }, [router, onClose]);

  if (!isOpen) return null;

  return (
    <Modal onClose={onClose} align="start" maxWidth="max-w-xl">
      <div className="mt-6 flex flex-col gap-4 select-none">
        <div className="relative">
          <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <input
            autoFocus
            type="text"
            placeholder="Знайдіть теми, розділи або предмети..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="h-[530px] overflow-y-auto">
          {filteredItems.length > 0 ? (
            <div className="flex flex-col gap-2">
              {showRecentItems && recentItems.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  <IoTimeOutline className="h-4 w-4" />
                  Нещодавні
                </div>
              )}
              {filteredItems.map((item, index) => {
                const isRecent = showRecentItems && index < recentItems.length;
                return (
                  <button
                    key={`${item.type}-${item.href}-${index}`}
                    onClick={() => handleItemClick(item)}
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
                          {optionNames[item.type] || ''}
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
                );
              })}
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
