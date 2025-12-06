/**
 * =========================================================================
 * InfoBox.jsx - InfoBox Widget Component
 * =========================================================================
 * Displays informational content cards with optional footer actions.
 * Used for promotional messages, tips, and alternative product suggestions.
 */

import React from 'react';
import { Info, ArrowRight } from 'lucide-react';

export default function InfoBox({ data }) {
  // Safely extract data with fallbacks
  const title = data?.title || 'Information';
  const subtitle = data?.subtitle || null;
  const content = data?.content || '';
  const footer = data?.footer || null;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-c24-md border-2 border-c24-primary-medium/20 p-6 hover:shadow-c24-lg transition-all duration-200 h-full flex flex-col">
      {/* Header with Icon */}
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-10 h-10 bg-c24-primary-medium rounded-full flex items-center justify-center">
          <Info size={20} className="text-white" />
        </div>
        
        <div className="flex-1">
          {/* Title */}
          <h3 className="text-lg font-bold text-c24-text-dark mb-1">
            {title}
          </h3>
          
          {/* Optional Subtitle */}
          {subtitle && (
            <p className="text-sm font-semibold text-c24-primary-medium">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 mb-4">
        <p className="text-c24-base text-c24-text-muted leading-relaxed">
          {content}
        </p>
      </div>

      {/* Optional Footer Action */}
      {footer && (
        <div className="mt-auto pt-4 border-t border-c24-primary-medium/20">
          <button className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-c24-sm border border-c24-primary-medium/30 hover:bg-c24-primary-medium/5 hover:border-c24-primary-medium transition-all group">
            <span className="text-sm font-semibold text-c24-primary-medium">
              {footer}
            </span>
            <ArrowRight 
              size={18} 
              className="text-c24-primary-medium group-hover:translate-x-1 transition-transform" 
            />
          </button>
        </div>
      )}
    </div>
  );
}