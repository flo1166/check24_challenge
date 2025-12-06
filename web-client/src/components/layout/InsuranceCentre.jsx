/**
 * =========================================================================
 * InsuranceCentre.jsx - Insurance Category Centre
 * =========================================================================
 * Interactive insurance category showcase with flip-card animations.
 * Shows icon tiles (Car, Health, House, Money) that unlock on purchase
 * and flip to reveal contract details on hover.
 * 
 * Design:
 * - Car Insurance unlocks when user has a contract OR adds to cart
 * - Locked tiles: grey icons, grey background
 * - Unlocked tiles: blue icons, white background
 * - Back of card shows actual contract details
 */

import React, { useState, useEffect } from 'react';
import { Car, Heart, Home, PiggyBank } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { getImageUrl } from '../../utils/imageLoader';
import '../../styles/InsuranceCentre.css';
import '../../styles/components.css';

export default function InsuranceCentre({ cartCount = 0, selectedCarInsurance = null }) {
  // Insurance categories with metadata
  const categories = [
    {
      id: 'car',
      label: 'Car Insurance',
      icon: 'car',
      description: 'View your car insurance contracts',
    },
    {
      id: 'health',
      label: 'Health Insurance',
      icon: 'health',
      description: 'View your health insurance contracts',
    },
    {
      id: 'house',
      label: 'House Insurance',
      icon: 'house',
      description: 'View your house insurance contracts',
    },
    {
      id: 'money',
      label: 'Money & Banking',
      icon: 'money',
      description: 'View your banking & investment products',
    },
  ];

  // State management
  const [unlockedCategories, setUnlockedCategories] = useState({});
  const [flippedCards, setFlippedCards] = useState({});
  const [contracts, setContracts] = useState({});
  const [loading, setLoading] = useState(true);
  const { notifications } = useNotifications();

  // Fetch user contracts on mount
  useEffect(() => {
    fetchUserContracts();
  }, []);

  async function fetchUserContracts() {
    try {
      setLoading(true);
      const userId = 123; // TODO: Get from auth context
      
      console.log('=== FETCHING CONTRACTS ===');
      console.log('User ID:', userId);
      
      const response = await fetch(`http://localhost:8000/user/${userId}/contracts`);
      
      if (!response.ok) {
        console.warn('Failed to fetch contracts:', response.status);
        setLoading(false);
        return;
      }

      const jsonData = await response.json();
      console.log('=== API RESPONSE ===');
      console.log('Full API response:', JSON.stringify(jsonData, null, 2));
      console.log('Response is array?:', Array.isArray(jsonData));
      
      // Handle both array and object responses
      let contractData = null;
      
      if (Array.isArray(jsonData)) {
        // Response is an array - take the first contract
        console.log('Response is array, taking first element');
        contractData = jsonData.length > 0 ? jsonData[0] : null;
      } else if (jsonData.has_contract && jsonData.contract) {
        // Response is the wrapped format: {has_contract: true, contract: {...}}
        console.log('Response has has_contract wrapper');
        contractData = jsonData.contract;
      } else if (jsonData.widget_id) {
        // Response is directly a contract object
        console.log('Response is direct contract object');
        contractData = jsonData;
      }
      
      console.log('Contract data to store:', contractData);

      // If we have contract data, store it and unlock the category
      if (contractData) {
        console.log('Storing contract in state...');
        console.log('Contract has data.title?', contractData?.data?.title);
        
        setContracts({
          car: contractData,
        });
        
        setUnlockedCategories(prev => ({
          ...prev,
          car: true,
        }));
        
        console.log('Contract stored and car unlocked');
      } else {
        console.log('No contract found');
      }
      console.log('===================');
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
      setLoading(false);
    }
  }

  // When user adds insurance to cart from carousel, store it and unlock
  useEffect(() => {
    if (selectedCarInsurance) {
      console.log('Selected car insurance from cart:', selectedCarInsurance);
      
      setContracts(prev => ({
        ...prev,
        car: selectedCarInsurance,
      }));
      
      setUnlockedCategories(prev => ({
        ...prev,
        car: true,
      }));
    }
  }, [selectedCarInsurance]);

  // Also unlock car category when items are added to cart
  useEffect(() => {
    if (cartCount > 0) {
      setUnlockedCategories(prev => ({
        ...prev,
        car: true,
      }));
    }
  }, [cartCount]);

  const toggleFlip = (categoryId) => {
    setFlippedCards(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // Map icon IDs to lucide-react components
  const iconMap = {
    car: Car,
    health: Heart,
    house: Home,
    money: PiggyBank,
  };

  const renderIcon = (iconType, isUnlocked) => {
    const IconComponent = iconMap[iconType];
    if (!IconComponent) return null;
    
    return (
      <IconComponent 
        className="insurance-icon" 
        size={80}
        strokeWidth={1.5}
      />
    );
  };

  // Render the back of the card with contract details
  const renderCardBack = (category) => {
    const contract = contracts[category.id];
    
    console.log('=== DETAILED DEBUG ===');
    console.log('Rendering back card for:', category.id);
    console.log('Contract (full object):', JSON.stringify(contract, null, 2));
    console.log('Contract keys:', Object.keys(contract || {}));
    
    // If no contract data, show generic message
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
    
    console.log('Contract data (after extraction):', JSON.stringify(contractData, null, 2));
    console.log('Contract data keys:', Object.keys(contractData || {}));
    
    // Check if data is nested further
    if (contractData && typeof contractData === 'object' && !contractData.title) {
      console.log('Title not found at top level, checking nested...');
      // Maybe it's in contract.data.data or similar
      if (contractData.data) {
        console.log('Found nested data:', contractData.data);
        contractData = contractData.data;
      }
    }
    
    const title = contractData?.title || contractData?.name || 'No Title';
    const subtitle = contractData?.subtitle || contractData?.description || 'No Subtitle';
    const imageUrl = getImageUrl(contractData?.image_url);
    
    console.log('Final extracted values:');
    console.log('Title:', title);
    console.log('Subtitle:', subtitle);
    console.log('Image URL:', imageUrl);
    console.log('=====================');

    return (
      <div className="insurance-tile-back">
        <div className="back-content">
          {/* Provider Logo */}
          {imageUrl && (
            <div className="contract-logo-container">
              <img 
                src={imageUrl} 
                alt={title} 
                className="contract-logo"
              />
            </div>
          )}

          {/* Contract Details - Always show title and subtitle from data */}
          <h4 className="back-title">{title}</h4>

          {/* Actions */}
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
                    {renderIcon(category.icon, isUnlocked)}
                  </div>

                  <h3 className="insurance-tile-label">{category.label}</h3>
                  
                  {/* Show badge if has contract */}
                  {contracts[category.id] && (
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