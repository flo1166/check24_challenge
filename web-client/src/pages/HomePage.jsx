/**
 * =========================================================================
 * HomePage.jsx - Component-Based Dynamic Widget Rendering  
 * =========================================================================
 * Features:
 * - Insurance Centre with flip cards
 * - Dynamic widget sections grouped by service
 * - Passes entire serviceData with components to WidgetSection
 * - Maintains collapse/expand state with localStorage
 * - WidgetSection renders components in order
 */

import { useState, useCallback, useEffect } from 'react';
import Loader from '../components/common/Loader';
import { useNotifications } from '../contexts/NotificationContext';
import InsuranceCentre from '../components/layout/InsuranceCentre';
import WidgetSection from '../components/widgets/WidgetSection';

// Constant for localStorage key
const COLLAPSE_STATE_KEY = 'widgetSectionCollapseState';

export default function HomePage({ data, loading, error, onRetry }) {
  const { notifications, waitForUpdate } = useNotifications(); 
  
  // State: Map of serviceKey -> isCollapsed (boolean)
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
   * Toggle collapsed state for a service
   */
  const handleToggleCollapse = useCallback((serviceKey) => {
    setCollapsedSections(prev => ({
      ...prev,
      [serviceKey]: !prev[serviceKey], 
    }));
  }, []);

  /**
   * Check if a service has valid components with widgets
   */
  const hasValidComponents = useCallback((service) => {
    if (!service?.components) return false;
    
    return service.components.some(component => {
      const widgets = component.widgets || [];
      return widgets.length > 0 && !widgets.every(
        w => w.widget_id === 'fallback_error_card'
      );
    });
  }, []);

  /**
   * Handler factory for adding products to cart by service
   */
  const createAddToCartHandler = useCallback((serviceKey, apiPort) => {
    return async (widgetData) => {
      const userId = 123; // TODO: Get from auth context
      const apiUrl = `http://localhost:${apiPort}/widget/${serviceKey}/contract`;
      
      const payload = {
        user_id: userId,
        widget_id: widgetData.widget_id,
      };

      try {
        console.log(`🛒 Adding ${serviceKey} to cart...`);
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to create contract: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log(`✅ Contract created for ${serviceKey}:`, result.contract_id);

        // Wait for SSE event *AND* data fetch to complete
        try {
          console.log('⏳ Waiting for cache invalidation and data refresh...');
          const freshData = await waitForUpdate();
          console.log('✅ Fresh data received, UI will update automatically:', freshData);
          
          // Also trigger contract refetch
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
  const handleCarInsuranceAdded = createAddToCartHandler('car-insurance', 8001);
  const handleHealthInsuranceAdded = createAddToCartHandler('health-insurance', 8002);
  const handleHouseInsuranceAdded = createAddToCartHandler('house-insurance', 8003);
  const handleBankingAdded = createAddToCartHandler('banking', 8004);

  /**
   * Check if ANY service has valid components
   */
  const hasAnyValidComponents = () => {
    if (!data?.services) return false;
    return Object.values(data.services).some(hasValidComponents);
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
            Make sure the Core Service (BFF) and Product Services are running.
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
      </section>

      {/* Insurance Centre */}
      <section className="mb-16">
        <InsuranceCentre 
          cartCount={notifications.cart} 
        />
      </section>

      {/* Dynamic Widget Sections - Pass serviceData to WidgetSection */}
      {hasAnyValidComponents() && (
        <>
          {/* Car Insurance Section */}
          {hasValidComponents(services.car_insurance) && (
            <WidgetSection
              serviceData={services.car_insurance}
              onAddToCart={handleCarInsuranceAdded}
              showSectionHeaders={true}
              isCollapsed={!!collapsedSections['car_insurance']}
              onToggleCollapse={() => handleToggleCollapse('car_insurance')}
            />
          )}

          {/* Health Insurance Section */}
          {hasValidComponents(services.health_insurance) && (
            <WidgetSection
              serviceData={services.health_insurance}
              onAddToCart={handleHealthInsuranceAdded}
              showSectionHeaders={true}
              isCollapsed={!!collapsedSections['health_insurance']}
              onToggleCollapse={() => handleToggleCollapse('health_insurance')}
            />
          )}

          {/* House Insurance Section */}
          {hasValidComponents(services.house_insurance) && (
            <WidgetSection
              serviceData={services.house_insurance}
              onAddToCart={handleHouseInsuranceAdded}
              showSectionHeaders={true}
              isCollapsed={!!collapsedSections['house_insurance']}
              onToggleCollapse={() => handleToggleCollapse('house_insurance')}
            />
          )}

          {/* Banking Section */}
          {hasValidComponents(services.banking) && (
            <WidgetSection
              serviceData={services.banking}
              onAddToCart={handleBankingAdded}
              showSectionHeaders={true}
              isCollapsed={!!collapsedSections['banking']}
              onToggleCollapse={() => handleToggleCollapse('banking')}
            />
          )}
        </>
      )}

      {/* Empty State - No Widgets */}
      {!hasAnyValidComponents() && (
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