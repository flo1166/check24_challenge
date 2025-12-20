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
  
  // NEW: State for active contracts
  const [activeContracts, setActiveContracts] = useState({
    car_insurance: false,
    health_insurance: false,
    house_insurance: false,
    banking: false
  });

  /**
   * NEW: Fetch user contracts to determine which sections to hide
   */
  const fetchActiveContracts = useCallback(async () => {
    try {
      const userId = 123;
      const contractsData = await mockAPI.fetchUserContracts(userId);
      
      // Always update based on current contract state
      const activeStatus = {
        car_insurance: !!(contractsData.contracts?.car_insurance),
        health_insurance: !!(contractsData.contracts?.health_insurance),
        house_insurance: !!(contractsData.contracts?.house_insurance),
        banking: !!(contractsData.contracts?.banking)
      };
      
      setActiveContracts(activeStatus);
      console.log('📋 Active contracts updated:', activeStatus);
      
    } catch (error) {
      console.error('❌ Failed to fetch active contracts:', error);
    }
  }, []);

  /**
   * NEW: Listen for contract changes to update visibility
   */
  useEffect(() => {
    fetchActiveContracts();
    
    const handleContractUpdate = () => {
      console.log('🔄 Contract updated, refreshing active contracts...');
      fetchActiveContracts();
    };
    
    const handleMockSSE = (event) => {
      const data = event.detail;
      if (data.type === 'cache_invalidated') {
        console.log('🔄 Cache invalidated, refreshing active contracts...');
        // Small delay to ensure mock API state is updated
        setTimeout(() => {
          fetchActiveContracts();
        }, 100);
      }
    };
    
    window.addEventListener('contracts-updated', handleContractUpdate);
    window.addEventListener('mock-sse-event', handleMockSSE);
    
    return () => {
      window.removeEventListener('contracts-updated', handleContractUpdate);
      window.removeEventListener('mock-sse-event', handleMockSSE);
    };
  }, [fetchActiveContracts]);

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

        // The mockAPI.createContract already triggered cache invalidation
        // Just trigger contract refetch event
        setTimeout(() => {
          window.dispatchEvent(new Event('contracts-updated'));
        }, 500);
                
      } catch (error) {
        console.error(`❌ Failed to save ${serviceKey} contract:`, error);
        // TODO: Show error toast to user
      }
    };
  }, []);

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
          DEMO MODE - Using Mock Data (avoid costs + security risks)
        </div>
      </section>

      {/* Insurance Centre */}
      <section className="mb-16">
        <InsuranceCentre 
          cartCount={notifications.cart} 
        />
      </section>

      {/* Dynamic Widget Sections - Only show if user doesn't have an active contract */}
      {hasValidWidgets() && (
        <>
          {/* Car Insurance Section - Hide if user has active car insurance */}
          {services.car_insurance?.widgets?.length > 0 && !activeContracts.car_insurance && (
            <WidgetSection
              widgets={services.car_insurance.widgets}
              sectionTitle={services.car_insurance.title}
              onAddToCart={handleCarInsuranceAdded}
              showSectionHeaders={true}
              isCollapsed={!!collapsedSections['car_insurance']}
              onToggleCollapse={() => handleToggleCollapse('car_insurance')}
            />
          )}

          {/* Health Insurance Section - Hide if user has active health insurance */}
          {services.health_insurance?.widgets?.length > 0 && !activeContracts.health_insurance && (
            <WidgetSection
              widgets={services.health_insurance.widgets}
              sectionTitle={services.health_insurance.title}
              onAddToCart={handleHealthInsuranceAdded}
              showSectionHeaders={true}
              isCollapsed={!!collapsedSections['health_insurance']}
              onToggleCollapse={() => handleToggleCollapse('health_insurance')}
            />
          )}

          {/* House Insurance Section - Hide if user has active house insurance */}
          {services.house_insurance?.widgets?.length > 0 && !activeContracts.house_insurance && (
            <WidgetSection
              widgets={services.house_insurance.widgets}
              sectionTitle={services.house_insurance.title}
              onAddToCart={handleHouseInsuranceAdded}
              showSectionHeaders={true}
              isCollapsed={!!collapsedSections['house_insurance']}
              onToggleCollapse={() => handleToggleCollapse('house_insurance')}
            />
          )}

          {/* Banking Section - Hide if user has active banking product */}
          {services.banking?.widgets?.length > 0 && !activeContracts.banking && (
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

      {/* NEW: Message when all sections are hidden because user has contracts */}
      {hasValidWidgets() && 
       activeContracts.car_insurance && 
       activeContracts.health_insurance && 
       activeContracts.house_insurance && 
       activeContracts.banking && (
        <div className="text-center py-16">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-8 rounded-c24-lg shadow-c24-md inline-block border-2 border-green-200">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-2xl font-bold text-c24-text-dark mb-3">
              You're All Set!
            </h3>
            <p className="text-c24-text-muted mb-6 max-w-md">
              You have active contracts for all our services. Check your Insurance Centre above to manage your coverage.
            </p>
            <p className="text-sm text-green-700 font-semibold">
              💡 Delete a contract from the Insurance Centre to see more options
            </p>
          </div>
        </div>
      )}

      {/* Empty State - No widgets available */}
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