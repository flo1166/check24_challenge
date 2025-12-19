/**
 * =========================================================================
 * HomePage.jsx - Main Home Page with Dynamic Widget Sections
 * =========================================================================
 * Features:
 * - Insurance Centre with flip cards
 * - Dynamic widget sections grouped by service
 * - Separate rendering for each product service
 * - Support for multiple product services/sections
 * - **NEW:** Widget section collapse/expand state is persisted using localStorage.
 */

import { useState, useCallback, useEffect } from 'react'; // <-- Added useCallback, useEffect
import Loader from '../components/common/Loader';
import { useNotifications } from '../contexts/NotificationContext';
import InsuranceCentre from '../components/layout/InsuranceCentre';
import WidgetSection from '../components/widgets/WidgetSection';

// Constant for localStorage key
const COLLAPSE_STATE_KEY = 'widgetSectionCollapseState';

export default function HomePage({ data, loading, error, onRetry }) {
  const { notifications } = useNotifications();
  
  // NEW STATE: Map of serviceKey -> isCollapsed (boolean)
  const [collapsedSections, setCollapsedSections] = useState({});

  /**
   * Effect to load state from localStorage on initial mount
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
  }, []); // Run only on mount

  /**
   * Effect to save state to localStorage whenever it changes
   */
  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_STATE_KEY, JSON.stringify(collapsedSections));
    } catch (e) {
      console.error("Could not save collapse state to localStorage:", e);
    }
  }, [collapsedSections]); // Run whenever collapsedSections changes

  /**
   * Toggles the collapsed state for a specific service key and updates localStorage
   */
  const handleToggleCollapse = useCallback((serviceKey) => {
    setCollapsedSections(prev => {
      const newState = {
        ...prev,
        // If undefined/null, default to false (expanded) and toggle to true (collapsed)
        [serviceKey]: !prev[serviceKey], 
      };
      // State will be saved by the useEffect hook
      return newState;
    });
  }, []);

  /**
   * Handler factory for adding products to cart by service
   */
  const createAddToCartHandler = (serviceKey, apiPort) => {
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

        await new Promise(resolve => setTimeout(resolve, 300));
        console.log('📢 [HomePage] Dispatching contracts-updated event');
        window.dispatchEvent(new Event('contracts-updated'));

        console.log('📢 [HomePage] Dispatching widgets-updated event');
        window.dispatchEvent(new Event('widgets-updated'));
                
      } catch (error) {
        console.error(`❌ Failed to save ${serviceKey} contract:`, error);
        // TODO: Show error toast to user
      }
    };
  };

  // Create handlers for each service
  const handleCarInsuranceAdded = createAddToCartHandler('car-insurance', 8001);
  const handleHealthInsuranceAdded = createAddToCartHandler('health-insurance', 8002);
  const handleHouseInsuranceAdded = createAddToCartHandler('house-insurance', 8003);
  const handleBankingAdded = createAddToCartHandler('banking', 8004);

  /**
   * Check if any service has valid widgets (not just fallback)
   */
  const hasValidWidgets = () => {
    if (!data?.services) {
      return false;
    }

    // Check if ANY service has valid widgets
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

      {/* Dynamic Widget Sections - Only show if valid widgets exist */}
      {hasValidWidgets() && (
        <>
          {/* Car Insurance Section */}
          {services.car_insurance?.widgets?.length > 0 && (
            <WidgetSection
              widgets={services.car_insurance.widgets}
              sectionTitle={services.car_insurance.title}
              onAddToCart={handleCarInsuranceAdded}
              showSectionHeaders={true}
              // PROP ADDITIONS: Pass the state and toggle handler
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
              // PROP ADDITIONS: Pass the state and toggle handler
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
              // PROP ADDITIONS: Pass the state and toggle handler
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
              // PROP ADDITIONS: Pass the state and toggle handler
              isCollapsed={!!collapsedSections['banking']}
              onToggleCollapse={() => handleToggleCollapse('banking')}
            />
          )}
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