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
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastVisibleHeadings = useRef<Map<string, number>>(new Map());

  // Improved IntersectionObserver with better configuration
  useEffect(() => {
    if (headings.length === 0) return;

    // Disconnect existing observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Enhanced observer configuration
    const observer = new IntersectionObserver(
      (entries) => {
        // Don't update during manual scrolling
        if (isScrolling) return;

        // Update visibility tracking
        entries.forEach(entry => {
          const headingId = entry.target.id;
          if (entry.isIntersecting) {
            // Store intersection ratio and timestamp
            lastVisibleHeadings.current.set(headingId, entry.intersectionRatio);
          } else {
            // Remove from visible set when no longer intersecting
            lastVisibleHeadings.current.delete(headingId);
          }
        });

        // Determine the best active heading
        if (lastVisibleHeadings.current.size > 0) {
          // Strategy 1: Prefer headings that are mostly visible (> 0.7)
          let bestCandidate = null;
          let highestRatio = 0;
          
          lastVisibleHeadings.current.forEach((ratio, id) => {
            if (ratio > highestRatio) {
              highestRatio = ratio;
              bestCandidate = id;
            }
          });
          
          // Strategy 2: If no heading is highly visible, pick the one closest to viewport center
          if (!bestCandidate || highestRatio < 0.7) {
            const viewportCenter = window.scrollY + window.innerHeight / 2;
            let closestDistance = Infinity;
            
            headings.forEach(heading => {
              const element = document.getElementById(heading.id);
              if (element && lastVisibleHeadings.current.has(heading.id)) {
                const elementCenter = element.offsetTop + element.offsetHeight / 2;
                const distance = Math.abs(viewportCenter - elementCenter);
                
                if (distance < closestDistance) {
                  closestDistance = distance;
                  bestCandidate = heading.id;
                }
              }
            });
          }
          
          if (bestCandidate && bestCandidate !== activeId) {
            setActiveId(bestCandidate);
          }
        }
      },
      {
        // More generous root margin for better detection
        rootMargin: '-10% 0px -50% 0px',
        // Multiple thresholds for more granular detection
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1.0],
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

    // Cleanup function
    return () => {
      observer.disconnect();
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
      
      // Reset scrolling state after animation completes
      timeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
        // Force a recheck after scrolling completes
        setTimeout(() => {
          if (observerRef.current) {
            // Trigger manual observation check
            headings.forEach(heading => {
              const element = document.getElementById(heading.id);
              if (element) {
                const rect = element.getBoundingClientRect();
                const isInView = rect.top < window.innerHeight * 0.7 && rect.bottom > 0;
                if (isInView) {
                  lastVisibleHeadings.current.set(heading.id, 0.5); // Default ratio
                } else {
                  lastVisibleHeadings.current.delete(heading.id);
                }
              }
            });
          }
        }, 100);
      }, 1000);
    }
  }, [headings]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (headings.length === 0) return null;

  return (
    <>
      {/* Mobile/Tablet version - inline in content */}
      <nav className="mb-8 rounded-xl border border-border bg-muted/30 p-6 lg:hidden">
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
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Desktop version - positioned on the left side with 40px margin */}
      <nav className="hidden lg:block fixed left-[calc((100vw-60rem)/2-18rem)] top-1/2 -translate-y-2/5 w-64 h-[calc(100vh-5rem)] overflow-y-auto p-6 z-10">
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
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}