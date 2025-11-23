/**
 * =========================================================================
 * NavIcon.jsx - Navigation Icon with Badge
 * =========================================================================
 * Single navigation icon with optional red notification badge.
 * Used in the primary navigation bar.
 */

import React from 'react';

export default function NavIcon({
  icon: Icon,
  label,
  count = 0,
  onClick,
  active = false,
  href = '#',
}) {
  const isClickable = onClick !== undefined;

  const content = (
    <>
      <div className={`relative flex items-center justify-center ${active ? 'text-white' : 'text-white'}`}>
        <Icon size={24} />
        
        {/* Red Badge */}
        {count > 0 && (
          <span className="absolute -top-2 -right-2 bg-c24-alert-red text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </div>
      <span className="text-xs text-white mt-1">{label}</span>
    </>
  );

  if (isClickable) {
    return (
      <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center p-2 rounded transition-all ${
          active ? 'bg-c24-highlight-yellow/20 border-b-2 border-c24-highlight-yellow' : 'hover:bg-white/10'
        }`}
        title={label}
        aria-label={label}
      >
        {content}
      </button>
    );
  }

  return (
    <a href={href} className={`flex flex-col items-center justify-center p-2 rounded transition-all ${active ? 'bg-c24-highlight-yellow/20 border-b-2 border-c24-highlight-yellow' : 'hover:bg-white/10'}`} title={label}>
      {content}
    </a>
  );
}