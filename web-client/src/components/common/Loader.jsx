/**
 * =========================================================================
 * Loader.jsx - Loading Spinner Component
 * =========================================================================
 * Reusable loading indicator with Check24 branding.
 */

import React from 'react';

export default function Loader() {
  return (
    <div className="flex flex-col items-center justify-center p-12">
      <div className="w-12 h-12 border-4 border-c24-light-gray border-t-c24-primary-medium rounded-full animate-spin mb-4"></div>
      <p className="text-c24-text-muted font-semibold">Loading...</p>
    </div>
  );
}