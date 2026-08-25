'use client';
import React from 'react';
import { categoryIcons } from '@/lib/categoryIcons';

/**
 * Renders a category's icon from its `icon` key, in full colour.
 *
 * Resolution order:
 *   1. `el:*` — the current bundled flat-colour artwork (see
 *      web/src/lib/categoryIcons.js, generated from server/icons/manifest.json).
 *   2. A short raw string — treated as a literal emoji character (data
 *      cached from before migration 018 shipped may still carry these).
 *   3. Anything else — falls back to the generic "Miscellaneous" icon.
 */
export default function CategoryIcon({ icon, className = '' }) {
  const iconStr = icon ? String(icon).trim() : '';

  if (iconStr.startsWith('el:') && categoryIcons[iconStr]) {
    return (
      <span
        className={className}
        dangerouslySetInnerHTML={{ __html: categoryIcons[iconStr] }}
      />
    );
  }

  // A short raw string that isn't an el: key — treat as a literal emoji.
  if (iconStr && iconStr.length <= 4 && !iconStr.startsWith('circum:')) {
    return <span className={className}>{iconStr}</span>;
  }

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: categoryIcons['el:misc'] }}
    />
  );
}
