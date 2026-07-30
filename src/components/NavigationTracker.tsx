'use client';

/**
 * Navigation Tracker Component
 *
 * Renders nothing. Lives in the root layout so it stays mounted for the whole document
 * and reports every App Router pathname change to the navigation module.
 */

import { usePathname } from 'next/navigation';
import { recordPathname } from '@/lib/navigation';

export function NavigationTracker(): null {
  const pathname = usePathname();

  // Reported during render rather than in an effect: the tracker renders before the page
  // below it, so page effects always observe an up to date navigation count.
  recordPathname(pathname);

  return null;
}
