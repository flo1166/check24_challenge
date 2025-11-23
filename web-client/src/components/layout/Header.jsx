/**
 * =========================================================================
 * Header.jsx - Top Navigation Header
 * =========================================================================
 * Primary header component with logo and utility buttons.
 * Includes responsive hamburger menu for mobile.
 */

import React, { useState } from 'react';
import { Menu, X, Search, User } from 'lucide-react'; 
import Check24LogoSvg from '../../assets/images/Check24_Logo_2020.svg';

export default function Header({ onMenuToggle }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Define utility classes for the common height of the search bar (h-9 = 36px)
  const searchBarHeightClasses = 'h-9'; 

  return (
    // Header height remains 74px for standard site height
    <header className="sticky top-0 z-40 bg-c24-primary-deep border-b border-c24-primary-medium h-[74px]" id="c24-header-top">
      {/* Container: max-w-7xl centered, full height, items-center ensures vertical alignment */}
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between gap-4"> 
        
        {/* 1. Logo Section */}
        <div className="flex items-center flex-shrink-0">
          <img 
            src={Check24LogoSvg} 
            alt="Check24 Logo" 
            // *** CHANGED: Increased logo size (w-20 h-10) ***
            className="w-30 h-10 text-white" 
            style={{ fill: 'currentColor' }}
          />
        </div>

        {/* 2. Center Search - Spans the full available gap (flex-1) */}
        <div className="hidden md:block flex-1"> 
          <div className="relative flex">
            <input
              type="text"
              placeholder="Search products, deals..."
              // Pill-shaped, fixed height
              className={`w-full pl-5 pr-10 py-2 ${searchBarHeightClasses} rounded-full border border-c24-border-gray bg-white text-c24-base outline-none focus:border-c24-focus-blue focus:ring-2 focus:ring-c24-focus-blue focus:ring-opacity-10`}
              onFocus={() => setIsSearchOpen(true)}
              onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
            />
            {/* Search Icon */}
            <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-c24-text-muted p-1" aria-label="Search">
              <Search size={18} />
            </button>
          </div>
        </div>

        {/* 3. Right Section - Customer Sign and Mobile Menu Toggle */}
        <div className="flex items-center space-x-4 flex-shrink-0">
          
          {/* Customer Sign Section - Outline Icon and name (Desktop only) */}
          <div className="hidden md:flex items-center text-white cursor-pointer hover:opacity-80 transition-opacity">
            {/* Circular Icon Container */}
            <div className={`w-9 ${searchBarHeightClasses} rounded-full border border-white text-white flex items-center justify-center mr-2`}>
              <User size={30} />
            </div>
            {/* User Name */}
            <span className="font-bold text-sm whitespace-nowrap">Florian Korn</span>
          </div>

          {/* Mobile Menu Toggle (Mobile only) */}
          <div className="md:hidden">
            <button
              onClick={onMenuToggle}
              className="bg-none border-none text-white cursor-pointer p-2"
              aria-label="Toggle menu"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}