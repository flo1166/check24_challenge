/**
 * =========================================================================
 * InsuranceCentre.jsx - STATIC VERSION with Mock Data
 * =========================================================================
 * Modified to use mockDataService instead of real backend API calls.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Car, Heart, Home, PiggyBank } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { getImageUrl } from '../../utils/imageLoader';
import '../../styles/InsuranceCentre.css';
import '../../styles/components.css';

// Import mock data service
import mockAPI from '../../services/mockDataService';

// Configuration
const CATEGORY_MAP = {
  car: 'car_insurance',
  health: 'health_insurance',
  house: 'house_insurance',
  money: 'banking',
};

const API_SERVICE_MAP = {
  car: 'car',
  health: 'health',
  house: 'house',
  money: 'banking',
};

const categories = [
  { id: 'car', label: 'Car Insurance', icon: 'car', description: 'View your car insurance contracts' },
  { id: 'health', label: 'Health Insurance', icon: 'health', description: 'View your health insurance contracts' },
  { id: 'house', label: 'House Insurance', icon: 'house', description: 'View your house insurance contracts' },
  { id: 'money', label: 'Money & Banking', icon: 'money', description: 'View your banking & investment products' },
];

export default function InsuranceCentre({ 
  cartCount = 0, 
  selectedCarInsurance = null, 
  selectedHealthInsurance = null, 
  selectedHouseInsurance = null, 
  selectedBankingProduct = null 
}) {
  // State management
  const [unlockedCategories, setUnlockedCategories] = useState({});
  const [flippedCards, setFlippedCards] = useState({});
  const [contracts, setContracts] = useState({}); 
  const [loading, setLoading] = useState(true);
  const { notifications, waitForUpdate } = useNotifications();

  /**
   * Fetch user contracts using mock API
   */
  const fetchUserContracts = useCallback(async () => {
    try {
      setLoading(true);
      const userId = 123;
      
      console.log('🔄 [InsuranceCentre] Fetching contracts from MOCK API...');
      
      // Use mock API instead of real fetch
      const jsonData = await mockAPI.fetchUserContracts(userId);
      
      console.log('✅ [InsuranceCentre] Contracts received:', jsonData);

      if (jsonData.has_contract && jsonData.contracts) {
        const newContracts = {};
        const newUnlockedStatus = {};

        categories.forEach(category => {
          const serviceKey = CATEGORY_MAP[category.id];
          const contractData = jsonData.contracts[serviceKey];

          if (contractData) {
            newContracts[category.id] = contractData;
            newUnlockedStatus[category.id] = true;
            console.log(`✅ Found contract for ${category.id}`);
          }
        });

        setContracts(newContracts);
        setUnlockedCategories(prev => ({
          ...prev, 
          ...newUnlockedStatus
        }));
        
        console.log(`✅ [InsuranceCentre] ${Object.keys(newContracts).length} contracts loaded`);
      } else {
        console.log('ℹ️ [InsuranceCentre] No contracts found');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('❌ [InsuranceCentre] Failed to fetch contracts:', error);
      setLoading(false);
    }
  }, []);

  // Fetch contracts on mount
  useEffect(() => {
    fetchUserContracts();
  }, [fetchUserContracts]);

  // Listen for contract updates
  useEffect(() => {
    const handleRefresh = () => {
      console.log('🔄 [InsuranceCentre] Contracts updated event received - refetching...');
      fetchUserContracts();
    };
    
    window.addEventListener('contracts-updated', handleRefresh);
    
    return () => {
      window.removeEventListener('contracts-updated', handleRefresh);
    };
  }, [fetchUserContracts]);

  // Handle external products
  const externalProducts = [
    { prop: selectedCarInsurance, id: 'car' },
    { prop: selectedHealthInsurance, id: 'health' },
    { prop: selectedHouseInsurance, id: 'house' },
    { prop: selectedBankingProduct, id: 'money' },
  ];

  useEffect(() => {
    const updatedContracts = {};
    const updatedUnlocked = {};

    externalProducts.forEach(item => {
      if (item.prop) { 
        updatedContracts[item.id] = item.prop;
        updatedUnlocked[item.id] = true;
        console.log(`✅ External product found for: ${item.id}`);
      }
    });

    if (Object.keys(updatedContracts).length > 0) {
      setContracts(prev => ({ ...prev, ...updatedContracts }));
      setUnlockedCategories(prev => ({ ...prev, ...updatedUnlocked }));
    }
  }, [selectedCarInsurance, selectedHealthInsurance, selectedHouseInsurance, selectedBankingProduct]);

  // Toggle flip state
  const toggleFlip = (categoryId) => {
    setFlippedCards(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // Icon map
  const iconMap = {
    car: Car,
    health: Heart,
    house: Home,
    money: PiggyBank,
  };

  const renderIcon = (iconType) => {
    const IconComponent = iconMap[iconType];
    return IconComponent ? <IconComponent className="insurance-icon" size={80} strokeWidth={1.5} /> : null;
  };

  // Render card back
  const renderCardBack = (category) => {
    const contract = contracts[category.id]; 
    
    if (!contract) {
      return (
        <div className="insurance-tile-back">
          <div className="back-content">
            <h4 className="back-title">{category.label}</h4>
            <p className="back-description">{category.description}</p>
            <div className="back-actions">
              <button className="back-button">View Details</button>
            </div>
          </div>
        </div>
      );
    }

    let contractData = contract.data || contract;
    
    if (contractData && typeof contractData === 'object' && !contractData.title) {
      if (contractData.data) {
        contractData = contractData.data;
      }
    }
    
    const title = contractData?.title || contractData?.name || contractData?.widget_id || category.label;
    const imageUrl = getImageUrl(contractData?.image_url);
    const widgetId = contractData?.widget_id || contract.widget_id;

    // Handle delete with mock API
    const handleDelete = async (e) => {
      e.stopPropagation();
      
      try {
        const userId = 123;
        const serviceKey = API_SERVICE_MAP[category.id];
        
        console.log(`🗑️ Deleting contract: user ${userId}, service ${serviceKey}, widget ${widgetId}`);
        
        // Use mock API instead of real fetch
        const result = await mockAPI.deleteContract(userId, serviceKey, widgetId);
        
        console.log('✅ Contract deleted:', result);
        
        // Optimistic update
        setContracts(prev => {
          const newContracts = { ...prev };
          delete newContracts[category.id];
          return newContracts;
        });
        
        setUnlockedCategories(prev => ({
          ...prev,
          [category.id]: false
        }));
        
        setFlippedCards(prev => ({
          ...prev,
          [category.id]: false
        }));
        
        // Trigger mock cache invalidation
        mockAPI.triggerCacheInvalidation(`contract_deleted_${serviceKey}`, userId);
        
        // Wait for update
        try {
          console.log('⏳ Waiting for cache invalidation and data refresh...');
          const freshData = await waitForUpdate();
          console.log('✅ Fresh data received:', freshData);
          
          fetchUserContracts();
        } catch (error) {
          console.warn('⚠️ Update timeout, forcing manual refresh');
          window.dispatchEvent(new Event('contracts-updated'));
          window.dispatchEvent(new Event('widgets-updated'));
        }
        
      } catch (error) {
        console.error('❌ Failed to delete contract:', error);
        fetchUserContracts();
      }
    };

    return (
      <div className="insurance-tile-back relative">
        {/* Delete Button */}
        <button
          onClick={handleDelete}
          className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-lg"
          title="Delete contract"
          aria-label="Delete contract"
        >
          <span className="text-xl font-bold leading-none">×</span>
        </button>
        
        <div className="back-content">
          {imageUrl && (
            <div className="contract-logo-container">
              <img 
                src={imageUrl} 
                alt={title} 
                className="contract-logo"
              />
            </div>
          )}
          <h4 className="back-title">{title}</h4>
          <div className="back-actions">
            <button className="back-button back-button-primary">View Contract</button>
            <button className="back-button back-button-secondary">Manage</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="insurance-centre">
      <div className="insurance-tiles-grid">
        {categories.map(category => {
          const isUnlocked = unlockedCategories[category.id];
          const isFlipped = flippedCards[category.id];
          const hasContract = !!contracts[category.id];

          return (
            <div
              key={category.id}
              className={`insurance-tile-wrapper ${isFlipped && isUnlocked ? 'flipped' : ''} ${isUnlocked ? 'unlocked' : 'locked'}`}
              onClick={() => isUnlocked && toggleFlip(category.id)} 
            >
              <div className="insurance-tile-inner">
                {/* Front of card */}
                <div className="insurance-tile-front">
                  <div className="icon-container">
                    {renderIcon(category.icon)}
                  </div>

                  <h3 className="insurance-tile-label">{category.label}</h3>
                  
                  {hasContract && (
                    <div className="contract-badge">
                      <span className="badge-text">Active</span>
                    </div>
                  )}
                </div>

                {/* Back of card */}
                {isUnlocked && renderCardBack(category)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}