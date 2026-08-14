'use client';
import React from 'react';
import { Icon } from '@iconify/react';

export default function CategoryIcon({ icon, className = '' }) {
  if (!icon) return <span>📌</span>;
  if (icon.startsWith('circum:')) {
    return <Icon icon={icon} className={className} />;
  }
  return <span className={className}>{icon}</span>;
}
