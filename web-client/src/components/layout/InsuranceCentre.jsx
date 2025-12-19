/**
 * =========================================================================
 * InsuranceCentre.jsx - Insurance Category Centre with Delete Functionality
 * =========================================================================
 * Interactive insurance category showcase with flip-card animations.
 * Shows icon tiles (Car, Health, House, Money) that unlock on purchase
 * and flip to reveal contract details on hover.
 * 
 * ✅ FIX: Added event listener to refetch contracts when 'contracts-updated' event is dispatched
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Car, Heart, Home, PiggyBank } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { getImageUrl } from '../../utils/imageLoader';
import '../../styles/InsuranceCentre.css';
import '../../styles/components.css';

// --- Configuration ---
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

// --- Component ---

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
  const { notifications, waitForSSEUpdate } = useNotifications();


  // 1. Core Logic: Fetch and Process ALL Contracts from Backend
  const fetchUserContracts = useCallback(async () => {
    try {
      setLoading(true);
      const userId = 123; // TODO: Get from auth context
      
      console.log('🔄 [InsuranceCentre] Fetching contracts...');
      const response = await fetch(`http://localhost:8000/user/${userId}/contracts`);
      
      if (!response.ok) {
        console.warn('⚠️ Failed to fetch contracts:', response.status);
        setLoading(false);
        return;
      }

      const jsonData = await response.json();
      console.log('✅ [InsuranceCentre] Contracts received:', jsonData);

      if (jsonData.has_contract && jsonData.contracts) {
        
        const newContracts = {};
        const newUnlockedStatus = {};

        // Iterate through the local categories definition
        categories.forEach(category => {
          const serviceKey = CATEGORY_MAP[category.id];
          const contractData = jsonData.contracts[serviceKey];

          if (contractData) {
            newContracts[category.id] = contractData;
            newUnlockedStatus[category.id] = true;
            console.log(`✅ Found contract for ${category.id}`);
          }
        });

        // Update states once with the consolidated data
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

  // 2. Fetch contracts on mount
  useEffect(() => {
    fetchUserContracts();
  }, [fetchUserContracts]);

  // 🔥 NEW: Listen for contract updates from HomePage
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

  // 3. Handling external updates (Contract Purchases/Selections)
  // This provides IMMEDIATE feedback while waiting for backend refetch
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

  // --- Rendering & Utility Functions ---

  const toggleFlip = (categoryId) => {
    setFlippedCards(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

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

  // Render the back of the card with contract details
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

    // Try multiple ways to extract the data
    let contractData = contract.data || contract;
    
    // Check if data is nested further
    if (contractData && typeof contractData === 'object' && !contractData.title) {
      if (contractData.data) {
        contractData = contractData.data;
      }
    }
    
    const title = contractData?.title || contractData?.name || contractData?.widget_id || category.label;
    const imageUrl = getImageUrl(contractData?.image_url);
    const widgetId = contractData?.widget_id || contract.widget_id;

    // Handle delete action
    const handleDelete = async (e) => {
      e.stopPropagation(); // Prevent card flip
      
      try {
        const userId = 123; // TODO: Get from auth context
        const serviceKey = API_SERVICE_MAP[category.id];
        
        console.log(`🗑️ Deleting contract: user ${userId}, service ${serviceKey}, widget ${widgetId}`);
        
        const response = await fetch(
          `http://localhost:8000/user/${userId}/contract/${serviceKey}/${widgetId}`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: response.statusText }));
          throw new Error(errorData.detail || `Failed to delete contract: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('✅ Contract deleted:', result);
        
        // Optimistic update - remove from local state immediately
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
        
        // 🔥 FIXED: Wait for SSE event *AND* data fetch to complete
        try {
          console.log('⏳ Waiting for cache invalidation and data refresh...');
          const freshData = await waitForUpdate();
          console.log('✅ Fresh data received:', freshData);
          
          // Trigger contracts refetch in this component
          fetchUserContracts();
        } catch (error) {
          console.warn('⚠️ Update timeout, forcing manual refresh');
          window.dispatchEvent(new Event('contracts-updated'));
          window.dispatchEvent(new Event('widgets-updated'));
        }
        
      } catch (error) {
        console.error('❌ Failed to delete contract:', error);
        // TODO: Show error toast to user
        
        // Revert optimistic update on error
        fetchUserContracts();
      }
    };
    return (
      <div className="insurance-tile-back relative">
        {/* Delete Button - Top Right Corner */}
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
                  
                  {/* Show badge if has contract */}
                  {hasContract && (
                    <div className="contract-badge">
                      <span className="badge-text">Active</span>
                    </div>
                  )}
                </div>

                {/* Back of card - only show if unlocked */}
                {isUnlocked && renderCardBack(category)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}