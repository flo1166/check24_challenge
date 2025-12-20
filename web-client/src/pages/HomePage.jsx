/**
 * =========================================================================
 * HomePage.jsx - STATIC VERSION with Mock Data
 * =========================================================================
 * Modified to use mockDataService instead of real backend API calls.
 */

import { useState, useCallback, useEffect } from 'react';
import Loader from '../components/common/Loader';
import { useNotifications } from '../contexts/NotificationContext';
import InsuranceCentre from '../components/layout/InsuranceCentre';
import WidgetSection from '../components/widgets/WidgetSection';

// Import mock data service
import mockAPI from '../services/mockDataService';

// Constant for localStorage key
const COLLAPSE_STATE_KEY = 'widgetSectionCollapseState';

export default function HomePage({ data, loading, error, onRetry }) {
  const { notifications, waitForUpdate } = useNotifications(); 
  
  // State for collapsed sections
  const [collapsedSections, setCollapsedSections] = useState({});

  /**
   * Load collapse state from localStorage on mount
   */
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(COLLAPSE_STATE_KEY);
      if (savedState) {
        setCollapsedSections(JSON.parse(savedState));
      }
    } catch (e) {
      console.error("Could not load collapse state from localStorage:", e);
    }
  }, []);

  /**
   * Save collapse state to localStorage whenever it changes
   */
  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_STATE_KEY, JSON.stringify(collapsedSections));
    } catch (e) {
      console.error("Could not save collapse state to localStorage:", e);
    }
  }, [collapsedSections]);

  /**
   * Toggle collapsed state for a section
   */
  const handleToggleCollapse = useCallback((serviceKey) => {
    setCollapsedSections(prev => ({
      ...prev,
      [serviceKey]: !prev[serviceKey], 
    }));
  }, []);

  /**
   * Handler factory for adding products to cart
   * Uses mock API instead of real HTTP calls
   */
  const createAddToCartHandler = useCallback((serviceKey) => {
    return async (widgetData) => {
      const userId = 123;

      try {
        console.log(`🛒 Adding ${serviceKey} to cart...`);
        
        // Use mock API instead of real fetch
        const result = await mockAPI.createContract(serviceKey, widgetData, userId);
        
        console.log(`✅ Contract created for ${serviceKey}:`, result.contract_id);

        // Trigger mock cache invalidation
        mockAPI.triggerCacheInvalidation(`contract_created_${serviceKey}`, userId);

        // Wait for update
        try {
          console.log('⏳ Waiting for cache invalidation and data refresh...');
          const freshData = await waitForUpdate();
          console.log('✅ Fresh data received, UI will update automatically:', freshData);
          
          // Trigger contract refetch
          window.dispatchEvent(new Event('contracts-updated'));
        } catch (error) {
          console.warn('⚠️ Update timeout, forcing manual refresh');
          window.dispatchEvent(new Event('contracts-updated'));
          window.dispatchEvent(new Event('widgets-updated'));
        }
                
      } catch (error) {
        console.error(`❌ Failed to save ${serviceKey} contract:`, error);
        // TODO: Show error toast to user
      }
    };
  }, [waitForUpdate]);

  // Create handlers for each service
  const handleCarInsuranceAdded = createAddToCartHandler('car_insurance');
  const handleHealthInsuranceAdded = createAddToCartHandler('health_insurance');
  const handleHouseInsuranceAdded = createAddToCartHandler('house_insurance');
  const handleBankingAdded = createAddToCartHandler('banking');

  /**
   * Check if any service has valid widgets
   */
  const hasValidWidgets = () => {
    if (!data?.services) {
      return false;
    }

    return Object.values(data.services).some(service => {
      const widgets = service.widgets || [];
      return widgets.length > 0 && !widgets.every(
        widget => widget.widget_id === 'fallback_error_card'
      );
    });
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
            Make sure the mock data service is loaded correctly.
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

  // Extract services data
  const services = data?.services || {};

  // Success State
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-c24-primary-deep to-c24-primary-medium text-white p-12 rounded-c24-lg mb-12 text-center">
        <h1 className="text-5xl font-bold mb-3 text-white">
          Insurance & Banking Centre
        </h1>

        <p className="text-lg opacity-90 mb-8">
          Find the best insurance deals and banking products tailored to your needs
        </p>
        
        {/* Demo Badge */}
        <div className="inline-block bg-c24-highlight-yellow text-c24-primary-deep px-4 py-2 rounded-full text-sm font-bold">
          🎭 DEMO MODE - Using Mock Data
        </div>
      </section>

      {/* Insurance Centre */}
      <section className="mb-16">
        <InsuranceCentre 
          cartCount={notifications.cart} 
        />
      </section>

      {/* Dynamic Widget Sections */}
      {hasValidWidgets() && (
        <>
          {/* Car Insurance Section */}
          {services.car_insurance?.widgets?.length > 0 && (
            <WidgetSection
              widgets={services.car_insurance.widgets}
              sectionTitle={services.car_insurance.title}
              onAddToCart={handleCarInsuranceAdded}
              showSectionHeaders={true}
              isCollapsed={!!collapsedSections['car_insurance']}
              onToggleCollapse={() => handleToggleCollapse('car_insurance')}
            />
          )}

          {/* Health Insurance Section */}
          {services.health_insurance?.widgets?.length > 0 && (
            <WidgetSection
              widgets={services.health_insurance.widgets}
              sectionTitle={services.health_insurance.title}
              onAddToCart={handleHealthInsuranceAdded}
              showSectionHeaders={true}
              isCollapsed={!!collapsedSections['health_insurance']}
              onToggleCollapse={() => handleToggleCollapse('health_insurance')}
            />
          )}

          {/* House Insurance Section */}
          {services.house_insurance?.widgets?.length > 0 && (
            <WidgetSection
              widgets={services.house_insurance.widgets}
              sectionTitle={services.house_insurance.title}
              onAddToCart={handleHouseInsuranceAdded}
              showSectionHeaders={true}
              isCollapsed={!!collapsedSections['house_insurance']}
              onToggleCollapse={() => handleToggleCollapse('house_insurance')}
            />
          )}

          {/* Banking Section */}
          {services.banking?.widgets?.length > 0 && (
            <WidgetSection
              widgets={services.banking.widgets}
              sectionTitle={services.banking.title}
              onAddToCart={handleBankingAdded}
              showSectionHeaders={true}
              isCollapsed={!!collapsedSections['banking']}
              onToggleCollapse={() => handleToggleCollapse('banking')}
            />
          )}
        </>
      )}

      {/* Empty State */}
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