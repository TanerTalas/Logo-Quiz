'use client';

/**
 * Ephemeral Screen Guard Hook
 *
 * Protects screens that only make sense inside an ongoing session (the game round and the
 * game over summary). Reaching one of them through a document load — a refresh or a pasted
 * URL — means the round that produced it is gone, so the player is sent back to the given
 * fallback route instead of staring at a dead screen.
 *
 * Returns true while the redirect is pending so the caller can render nothing.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isDocumentEntry } from '@/lib/navigation';

export function useEphemeralScreen(fallbackHref: string = '/'): boolean {
  const router = useRouter();

  // Starts false so the client hydrates the same markup the server rendered; the decision
  // is taken in the effect below, on the very first commit.
  const [isLeaving, setIsLeaving] = useState<boolean>(false);

  useEffect(() => {
    if (!isDocumentEntry()) return;

    setIsLeaving(true);
    // replace() instead of push() so the dead screen does not linger in history.
    router.replace(fallbackHref);
  }, [fallbackHref, router]);

  return isLeaving;
}
