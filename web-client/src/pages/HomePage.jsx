/**
 * =========================================================================
 * HomePage.jsx - Main Home Page Component
 * =========================================================================
 */

import React from 'react';
import WidgetRenderer from '../components/widgets/WidgetRenderer';
import Loader from '../components/common/Loader';
import { useNotifications } from '../contexts/NotificationContext';

// ⬅️ Import CategoryNav
import CategoryNav from "../components/navigation/CategoryNav";

export default function HomePage({ data, loading, error, onRetry }) {
  const { updateNotification } = useNotifications();
  

  // ⬅️ FIX: Needed for CategoryNav
  const [activeCategory, setActiveCategory] = React.useState(null);

  /**
   * Optional: handle "Bought Konto" if still needed
   */
  const handleBoughtKonto = () => {
    updateNotification('cart', 1);
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white p-8 rounded-c24-lg shadow-c24-lg text-center max-w-md border border-c24-alert-red/20">
          <h2 className="text-2xl font-bold text-c24-text-dark mb-3">⚠️ Connection Error</h2>
          <p className="text-c24-text-muted mb-4">{error}</p>
          <p className="text-xs text-c24-text-muted mb-6">
            Make sure the Core Service (BFF) and Mock Product Service are running.
          </p>
          <button 
            onClick={onRetry} 
            className="px-6 py-3 bg-c24-primary-medium text-white rounded-c24-sm font-semibold hover:bg-c24-hover-blue transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Success State
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-c24-primary-deep to-c24-primary-medium text-white p-12 rounded-c24-lg mb-12 text-center">
        <h1 className="text-5xl font-bold mb-3 text-white">
          {data?.title || "Insurance Centre"}
        </h1>

        <p className="text-lg opacity-90 mb-8">
          Find the best insurance deals tailored to your needs
        </p>
            {/*
        Category Nav Integration

        <CategoryNav
            activeCategory={activeCategory}
            onSelect={(id) => setActiveCategory(id)}
            badges={{
            versicherung: { count: 0, locked: false },
            konto:        { count: 1, locked: true },
            stromgas:     { count: 0, locked: false },
            internet:     { count: 3, locked: true },
            handy:        { count: 0, locked: false },
            reise:        { count: 5, locked: false },
            fluege:       { count: 0, locked: false },
            hotels:       { count: 0, locked: true },
            mietwagen:    { count: 1, locked: false },
            }}
        />
        //TODO: if I want to have a insurance centre*/}
      </section>
        
      {/* Widgets Grid */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-c24-text-dark mb-8">Featured Deals</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.widgets && data.widgets.length > 0 ? (
            data.widgets
              .sort((a, b) => (a.priority || 0) - (b.priority || 0))
              .map((widget, index) => (
                <WidgetRenderer key={widget.widget_id || index} widget={widget} index={index} />
              ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-c24-text-muted text-base">No deals available at the moment</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-gradient-to-r from-c24-primary-medium to-c24-primary-deep text-white text-center p-12 rounded-c24-lg">
        <h2 className="text-3xl font-bold mb-4">Ready to Save Money?</h2>
        <p className="text-lg opacity-90 mb-8">Join millions of smart shoppers finding the best deals on Check24</p>
        <button className="px-8 py-4 bg-c24-highlight-yellow text-c24-primary-deep rounded-c24-sm font-bold hover:opacity-90 transition-opacity">
          Get Started Now
        </button>
      </section>
    </div>
  );
}
