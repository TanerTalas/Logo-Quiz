/**
 * Footer Credit Component
 * 
 * Renders the fixed bottom creator credit badge present across all application screens.
 */

import React from 'react';

export const FooterCredit: React.FC = () => {
  return (
    <div
      style={{
        position: 'fixed',
        right: '12px',
        bottom: '12px',
        zIndex: 90,
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: '5px',
        padding: '5px 10px',
        background: 'var(--color-bg)',
        border: '1px solid var(--color-divider)',
        fontSize: '9px',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'color-mix(in srgb, var(--color-text) 60%, transparent)',
        pointerEvents: 'none',
      }}
    >
      Designed &amp; coded by
      <strong style={{ color: 'var(--color-text)' }}>Taner Talas</strong>
    </div>
  );
};
