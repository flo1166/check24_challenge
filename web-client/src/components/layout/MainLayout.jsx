/**
 * =========================================================================
 * MainLayout.jsx - Main Application Layout Wrapper
 * =========================================================================
 * Wraps all pages with header, navigation, and footer.
 * Manages layout state and responsive behavior.
 */

import React, { useState } from 'react';
import Header from './Header';
import Navigation from './Navigation';
import Footer from './Footer';

export default function MainLayout({ children }) {
  const [activeNav, setActiveNav] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavigation = (navId) => {
    setActiveNav(navId);
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <Header onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />

      {/* Navigation */}
      <Navigation
        onNavigate={handleNavigation}
        activeNav={activeNav}
      />

      {/* Main Content */}
      <main className="flex-1 w-full">
        <div className="max-w-7xl mx-auto px-4 py-12">
          {children}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}