/**
 * =========================================================================
 * InsuranceCentre.jsx - Insurance Category Centre
 * =========================================================================
 * Interactive insurance category showcase with flip-card animations.
 * Shows icon tiles (Car, Health, House, Money) that unlock on purchase
 * and flip to reveal contract details on hover.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Car, Heart, Home, PiggyBank } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { getImageUrl } from '../../utils/imageLoader';
import '../../styles/InsuranceCentre.css';
import '../../styles/components.css';

// --- Configuration ---
// Map category IDs used in the component to the API service keys used by the backend
const CATEGORY_MAP = {
  car: 'car_insurance',
  health: 'health_insurance',
  house: 'house_insurance',
  money: 'banking', // Assuming 'money' category uses the 'banking' service key
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
  // contracts state will now store all fetched contracts, keyed by category ID ('car', 'health', etc.)
  const [contracts, setContracts] = useState({}); 
  const [loading, setLoading] = useState(true);
  const { notifications } = useNotifications();


  // 1. Core Logic: Fetch and Process ALL Contracts from Backend
  const fetchUserContracts = useCallback(async () => {
    try {
      setLoading(true);
      const userId = 123; // TODO: Get from auth context
      
      console.log('=== FETCHING CONTRACTS ===');
      const response = await fetch(`http://localhost:8000/user/${userId}/contracts`);
      
      if (!response.ok) {
        console.warn('Failed to fetch contracts:', response.status);
        setLoading(false);
        return;
      }

      const jsonData = await response.json();
      console.log('Full API response:', JSON.stringify(jsonData, null, 2));

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
          }
        });

        // Update states once with the consolidated data
        setContracts(newContracts);
        setUnlockedCategories(prev => ({
          ...prev, 
          ...newUnlockedStatus
        }));
        
        console.log('Contracts fetched and stored:', Object.keys(newContracts));

      } else {
        console.log('No contracts found in API response.');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
      setLoading(false);
    }
  }, []);

  // Fetch contracts on mount
  useEffect(() => {
    fetchUserContracts();
  }, [fetchUserContracts]);


  // 2. Handling external updates (Contract Purchases/Selections)
  // This handles the props coming from HomePage.jsx when a widget is added to cart/contracted.
  
  // Array of props and their corresponding category IDs
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
      // Check if the prop has changed from null to an object (a new purchase)
      if (item.prop) { 
        updatedContracts[item.id] = item.prop;
        updatedUnlocked[item.id] = true;
        console.log(`External product found for: ${item.id}`);
      }
    });

    if (Object.keys(updatedContracts).length > 0) {
      setContracts(prev => ({ ...prev, ...updatedContracts }));
      setUnlockedCategories(prev => ({ ...prev, ...updatedUnlocked }));
    }
  }, [selectedCarInsurance, selectedHealthInsurance, selectedHouseInsurance, selectedBankingProduct]);

  // --- Rendering & Utility Functions (Mostly Unchanged) ---

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
    // contract is now keyed by category ID (e.g., contracts['car'])
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

    // Try multiple ways to extract the data (This logic is robust and kept)
    let contractData = contract.data || contract;
    
    // Check if data is nested further
    if (contractData && typeof contractData === 'object' && !contractData.title) {
      if (contractData.data) {
        contractData = contractData.data;
      }
    }
    
    const title = contractData?.title || contractData?.name || contractData?.widget_id || category.label;
    const imageUrl = getImageUrl(contractData?.image_url);

    return (
      <div className="insurance-tile-back">
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
              // Only allow flip if the category is unlocked
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

                {/* Back of card - render only if UNLOCKED AND FLIPPED (The requested change) */}
                {isUnlocked && isFlipped && renderCardBack(category)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}