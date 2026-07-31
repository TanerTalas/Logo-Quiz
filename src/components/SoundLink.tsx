'use client';

/**
 * Sound Link Component
 *
 * A next/link that plays the UI click sound on navigation. It exists so that pages
 * made of otherwise static markup can stay Server Components — only this small
 * wrapper ships to the browser, instead of the whole page.
 *
 * The mute preference is read from localStorage at click time rather than held in
 * state: the click always happens after mount, so there is nothing to synchronise.
 */

import React from 'react';
import Link from 'next/link';
import type { LinkProps } from 'next/link';

import { getMuted } from '@/lib/storage';
import { soundFx } from '@/lib/soundEffects';

export interface SoundLinkProps extends LinkProps {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export const SoundLink: React.FC<SoundLinkProps> = ({ children, ...linkProps }) => {
  return (
    <Link {...linkProps} onClick={() => soundFx.click(getMuted())}>
      {children}
    </Link>
  );
};
