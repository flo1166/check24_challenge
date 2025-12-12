/**
 * =========================================================================
 * SectionHeader.jsx - Section Header Widget Component
 * =========================================================================
 * Displays section headers with title, subtitle, and description.
 * Used to introduce product sections and provide context.
 * Supports collapsible sections via onToggle callback.
 */

import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function SectionHeader({ data, onToggle, isCollapsed }) {
  // Safely extract data with fallbacks
  const title = data?.title || 'Section Title';
  const subtitle = data?.subtitle || null;
  const description = data?.description || null;

  // Check if subtitle indicates toggle functionality (like "Hide Recommendations")
  const hasToggle = subtitle && (
    subtitle.toLowerCase().includes('hide') || 
    subtitle.toLowerCase().includes('show')
  );

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    }
  };

  return (
    <div className="bg-gradient-to-r from-c24-primary-deep to-c24-primary-medium text-white rounded-c24-md p-6 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Title */}
          <h3 className="text-2xl font-bold mb-2">
            {title}
          </h3>

          {/* Description */}
          {description && (
            <p className="text-sm opacity-90 leading-relaxed max-w-3xl">
              {description}
            </p>
          )}
        </div>

        {/* Optional Toggle Button */}
        {hasToggle && (
          <button
            onClick={handleToggle}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-c24-sm transition-colors ml-4 flex-shrink-0"
            aria-label={isCollapsed ? 'Show recommendations' : 'Hide recommendations'}
          >
            <span className="text-sm font-semibold">
              {isCollapsed ? 'Show' : 'Hide'}
            </span>
            {isCollapsed ? (
              <ChevronDown size={18} />
            ) : (
              <ChevronUp size={18} />
            )}
          </button>
        )}
      </div>
    </div>
  );
}