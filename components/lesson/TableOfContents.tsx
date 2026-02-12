'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  headings: Heading[];
}

// Smooth scroll helper function
function smoothScrollTo(element: HTMLElement) {
  const headerHeight = 80;
  const targetPosition = element.offsetTop - headerHeight;
  
  // Use native smooth scrolling
  window.scrollTo({
    top: targetPosition,
    behavior: 'smooth'
  });
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [isScrolling, setIsScrolling] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rafRef = useRef<number | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastVisibleHeadings = useRef<Map<string, {ratio: number, timestamp: number}>>(new Map());
  const scrollDirectionRef = useRef<'up' | 'down' | 'none'>('none');
  const lastScrollTopRef = useRef<number>(0);

  // Enhanced hybrid approach with improved gap handling
  useEffect(() => {
    if (headings.length === 0) return;

    let ticking = false;
    let lastUpdateTime = 0;
    
    // Enhanced scroll tracking with direction awareness
    const updateActiveHeadingFromScroll = () => {
      if (isScrolling) {
        ticking = false;
        return;
      }

      const now = Date.now();
      // Throttle to prevent excessive updates
      if (now - lastUpdateTime < 16) { // ~60fps
        ticking = false;
        return;
      }
      
      const scrollTop = window.scrollY;
      const viewportHeight = window.innerHeight;
      const headerOffset = 100; // Account for fixed header
      const triggerPoint = scrollTop + headerOffset;
      
      // Track scroll direction
      const scrollDelta = scrollTop - lastScrollTopRef.current;
      scrollDirectionRef.current = scrollDelta > 0 ? 'down' : scrollDelta < 0 ? 'up' : 'none';
      lastScrollTopRef.current = scrollTop;
      
      // Strategy 1: Primary detection - heading at or above trigger point
      let primaryCandidate = '';
      for (let i = headings.length - 1; i >= 0; i--) {
        const element = document.getElementById(headings[i].id);
        if (element && element.offsetTop <= triggerPoint) {
          primaryCandidate = headings[i].id;
          break;
        }
      }
      
      // Strategy 2: Gap handling - find heading closest to viewport top
      let gapCandidate = '';
      if (!primaryCandidate && headings.length > 0) {
        let closestHeading = null;
        let minDistance = Infinity;
        
        headings.forEach(heading => {
          const element = document.getElementById(heading.id);
          if (element) {
            const elementTop = element.offsetTop;
            const distance = Math.abs(elementTop - (scrollTop + headerOffset));
            
            // Extended detection zone for gap handling
            if (distance < minDistance && elementTop <= scrollTop + viewportHeight * 0.7) {
              minDistance = distance;
              closestHeading = heading.id;
            }
          }
        });
        
        gapCandidate = closestHeading || headings[0].id;
      }
      
      // Strategy 3: Use IntersectionObserver data for validation
      let intersectionCandidate = '';
      if (lastVisibleHeadings.current.size > 0) {
        // Sort by intersection ratio and recency
        const candidates = Array.from(lastVisibleHeadings.current.entries())
          .map(([id, data]) => ({ id, ratio: data.ratio, timestamp: data.timestamp }))
          .sort((a, b) => {
            // Primary: higher intersection ratio
            if (b.ratio !== a.ratio) return b.ratio - a.ratio;
            // Secondary: more recent timestamp
            return b.timestamp - a.timestamp;
          });
        
        intersectionCandidate = candidates[0]?.id || '';
      }
      
      // Decision logic with priority:
      // 1. Primary candidate (most reliable)
      // 2. Intersection candidate (validated by IO)
      // 3. Gap candidate (fallback for gaps)
      // 4. First heading (ultimate fallback)
      const bestCandidate = primaryCandidate || intersectionCandidate || gapCandidate || headings[0]?.id || '';
      
      // Update state if changed
      if (bestCandidate && bestCandidate !== activeId) {
        setActiveId(bestCandidate);
      }
      
      lastUpdateTime = now;
      ticking = false;
    };
    
    const requestTick = () => {
      if (!ticking) {
        rafRef.current = requestAnimationFrame(updateActiveHeadingFromScroll);
        ticking = true;
      }
    };
    
    // Enhanced IntersectionObserver with better configuration
    const setupIntersectionObserver = () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      
      const observer = new IntersectionObserver(
        (entries) => {
          if (isScrolling) return;
          
          const now = Date.now();
          
          // Update visibility tracking
          entries.forEach(entry => {
            const headingId = entry.target.id;
            if (entry.isIntersecting) {
              // Store intersection data with timestamp
              lastVisibleHeadings.current.set(headingId, {
                ratio: entry.intersectionRatio,
                timestamp: now
              });
            } else {
              // Remove from visible set when no longer intersecting
              lastVisibleHeadings.current.delete(headingId);
            }
          });
          
          // Only update if we have reliable data and no primary candidate was found
          const hasPrimaryCandidate = (() => {
            const scrollTop = window.scrollY;
            const triggerPoint = scrollTop + 100;
            return headings.some(heading => {
              const element = document.getElementById(heading.id);
              return element && element.offsetTop <= triggerPoint;
            });
          })();
          
          if (!hasPrimaryCandidate && lastVisibleHeadings.current.size > 0) {
            // Use IO data as backup when scroll-based detection fails
            const candidates = Array.from(lastVisibleHeadings.current.entries())
              .map(([id, data]) => ({ id, ratio: data.ratio, timestamp: data.timestamp }))
              .sort((a, b) => {
                if (b.ratio !== a.ratio) return b.ratio - a.ratio;
                return b.timestamp - a.timestamp;
              });
            
            const ioCandidate = candidates[0]?.id;
            if (ioCandidate && ioCandidate !== activeId) {
              setActiveId(ioCandidate);
            }
          }
        },
        {
          // Wider detection margins to catch gaps between headings
          rootMargin: '-5% 0px -40% 0px',
          // Multiple thresholds for granular detection
          threshold: [0, 0.1, 0.25, 0.5, 0.7, 0.8, 0.9, 1.0],
        }
      );
      
      observerRef.current = observer;
      
      // Observe all heading elements
      headings.forEach((heading) => {
        const element = document.getElementById(heading.id);
        if (element) {
          observer.observe(element);
        }
      });
    };
    
    // Throttled scroll handler
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(requestTick, 16); // ~60fps
    };
    
    // Set up event listeners
    window.addEventListener('scroll', handleScroll, { passive: true });
    setupIntersectionObserver();
    
    // Initial check
    requestTick();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      clearTimeout(scrollTimeout);
      lastVisibleHeadings.current.clear();
    };
  }, [headings, isScrolling, activeId]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      // Set scrolling state to prevent observer updates during animation
      setIsScrolling(true);
      smoothScrollTo(element);
      setActiveId(id);
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Reset scrolling state after animation completes with buffer time
      timeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
        // Force a recheck after scrolling completes
        setTimeout(() => {
          if (typeof requestAnimationFrame !== 'undefined') {
            requestAnimationFrame(() => {
              // Trigger manual update after scroll completes
              const event = new CustomEvent('toc-recheck');
              window.dispatchEvent(event);
            });
          }
        }, 100);
      }, 1200); // Extended timeout to ensure scroll animation completes
    }
  }, []);

  // Handle manual rechecks
  useEffect(() => {
    const handleRecheck = () => {
      if (!isScrolling && typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(() => {
          // Force immediate update
          const scrollTop = window.scrollY;
          const triggerPoint = scrollTop + 100;
          
          // Find the most appropriate heading
          let newActiveId = '';
          for (let i = headings.length - 1; i >= 0; i--) {
            const element = document.getElementById(headings[i].id);
            if (element && element.offsetTop <= triggerPoint) {
              newActiveId = headings[i].id;
              break;
            }
          }
          
          if (!newActiveId && headings.length > 0) {
            newActiveId = headings[0].id;
          }
          
          if (newActiveId && newActiveId !== activeId) {
            setActiveId(newActiveId);
          }
        });
      }
    };
    
    window.addEventListener('toc-recheck', handleRecheck);
    return () => window.removeEventListener('toc-recheck', handleRecheck);
  }, [headings, activeId, isScrolling]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  if (headings.length === 0) return null;

  return (
    <>
      {/* Mobile/Tablet version - inline in content */}
      <nav className="select-none mb-8 rounded-xl border border-border bg-muted/30 p-6 lg:hidden">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Зміст уроку</h2>
        <ul className="space-y-2">
          {headings.map((heading) => (
            <li
              key={heading.id}
              className={`${
                heading.level === 2 ? 'ml-0' : heading.level === 3 ? 'ml-4' : 'ml-8'
              }`}
            >
              <a
                href={`#${heading.id}`}
                className="block rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={(e) => handleClick(e, heading.id)}
              >
                <span className="block line-clamp-2">
                  {heading.text}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Desktop version - positioned on the left side with 40px margin */}
      <nav className="select-none border border-amber-300 hidden lg:block fixed left-[calc((100vw-55rem-3vw)/2-18rem)] top-1/6 w-56 xl:w-64 h-[calc(100vh-5rem)] overflow-y-auto px-4 py-6 z-10 lg:-translate-x-[calc((100vw-1536px)/2)] 2xl:translate-x-0">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Зміст уроку</h2>
        <ul className="space-y-1">
          {headings.map((heading) => (
            <li
              key={heading.id}
              className={`${
                heading.level === 2 ? 'ml-0' : heading.level === 3 ? 'ml-3' : 'ml-6'
              }`}
            >
              <a
                href={`#${heading.id}`}
                className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${
                  activeId === heading.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                onClick={(e) => handleClick(e, heading.id)}
              >
                <span className="block line-clamp-2">
                  {heading.text}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
