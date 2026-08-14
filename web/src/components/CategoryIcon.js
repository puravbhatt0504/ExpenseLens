'use client';
import React from 'react';
import { Icon } from '@iconify/react';

export default function CategoryIcon({ icon, className = '' }) {
  if (!icon) return <span>📌</span>;
  
  const iconStr = String(icon).trim();
  const lowerIcon = iconStr.toLowerCase();
  
  if (lowerIcon.startsWith('circum:')) {
    // Fix common typos in database if any
    const validIcon = lowerIcon === 'circum:fork-nife' ? 'circum:fork-knife' : lowerIcon;
    return <Icon icon={validIcon} className={className} />;
  }
  
  // If it's not an emoji (length > 5), return a fallback
  if (iconStr.length > 5) {
    return <span className={className}>📌</span>;
  }
  
  return <span className={className}>{iconStr}</span>;
}
