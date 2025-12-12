/**
 * =========================================================================
 * HomePage.jsx - Main Home Page with Dynamic Widget Sections
 * =========================================================================
 * Features:
 * - Insurance Centre with flip cards
 * - Dynamic widget sections grouped by type
 * - Separate rendering for Cards (carousel) and InfoBoxes (grid)
 * - Support for multiple product services/sections
 */

import { useState } from 'react';
import Loader from '../components/common/Loader';
import { useNotifications } from '../contexts/NotificationContext';
import InsuranceCentre from '../components/layout/InsuranceCentre';
import WidgetSection from '../components/widgets/WidgetSection';

export default function HomePage({ data, loading, error, onRetry }) {
  const { updateNotification, notifications } = useNotifications();
  const [selectedCarInsurance, setSelectedCarInsurance] = useState(null);

  /**
   * Called when user adds a car insurance widget to cart
   * Saves the widget data to pass to InsuranceCentre and backend
   */
  const handleCarInsuranceAdded = async (widgetData) => {
    // 1. Update UI first (instant)
    setSelectedCarInsurance(widgetData);
    
    const userId = 123; // TODO: Get from auth context
    const apiUrl = `http://localhost:8001/widget/car-insurance/contract`;
    
    const payload = {
      user_id: userId,
      widget_id: widgetData.widget_id,
    };

    try {
      // 2. Save to database
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(payload),
      });
      
      const result = await response.json();
      console.log('Contract created with ID:', result.contract_id);
    } catch (error) {
      console.error('Failed to save contract:', error);
    }
  };

  /**
   * Check if widgets contain valid data (not just fallback)
   * Returns true if there are real widgets, false if empty or only fallback
   */
  const hasValidWidgets = () => {
    if (!data?.widgets || data.widgets.length === 0) {
      return false;
    }

    // Check if all widgets are fallback widgets
    const onlyFallback = data.widgets.every(
      widget => widget.widget_id === 'fallback_error_card'
    );

    return !onlyFallback;
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
      </section>

      {/* Insurance Centre */}
      <section className="mb-16">
        <InsuranceCentre 
          cartCount={notifications.cart} 
          selectedCarInsurance={selectedCarInsurance}
        />
      </section>

      {/* Dynamic Widget Sections - Only show if valid widgets exist */}
      {hasValidWidgets() && (
        <>
          {/* Car Insurance Section */}
          <WidgetSection
            widgets={data.widgets}
            sectionTitle="Car Insurance Deals"
            onAddToCart={handleCarInsuranceAdded}
            showSectionHeaders={true}
          />

          {/* Future: Add more product sections here */}
          {/* Example:
          <WidgetSection
            widgets={homeInsuranceWidgets}
            sectionTitle="Home Insurance Deals"
            onAddToCart={handleHomeInsuranceAdded}
            showSectionHeaders={true}
          />
          */}
        </>
      )}

      {/* Empty State - No Widgets */}
      {!hasValidWidgets() && (
        <div className="text-center py-16">
          <div className="bg-white p-8 rounded-c24-lg shadow-c24-md inline-block">
            <h3 className="text-2xl font-bold text-c24-text-dark mb-3">
              No Deals Available
            </h3>
            <p className="text-c24-text-muted mb-6">
              Check back soon for personalized insurance recommendations!
            </p>
          </div>
        </div>
      )}

      {/* Footer CTA */}
      <section className="bg-gradient-to-r from-c24-primary-medium to-c24-primary-deep text-white text-center p-12 rounded-c24-lg">
        <h2 className="text-3xl font-bold mb-4">Ready to Save Money?</h2>
        <p className="text-lg opacity-90 mb-8">
          Join millions of smart shoppers finding the best deals on Check24
        </p>
        <button className="px-8 py-4 bg-c24-highlight-yellow text-c24-primary-deep rounded-c24-sm font-bold hover:opacity-90 transition-opacity">
          Get Started Now
        </button>
      </section>
    </div>
  );
}