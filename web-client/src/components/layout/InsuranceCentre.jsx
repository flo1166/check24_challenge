/**
 * =========================================================================
 * InsuranceCentre.jsx - Insurance Category Centre
 * =========================================================================
 * Interactive insurance category showcase with flip-card animations.
 * Shows icon tiles (Car, Health, House, Money) that unlock on purchase
 * and flip to reveal contract details on hover.
 * 
 * Design:
 * - Only Car Insurance unlocks (based on carousel purchases)
 * - Locked tiles: grey icons, grey background
 * - Unlocked tiles: blue icons, white background
 * - No colorful accents, uses Check24 theme colors
 */

import React, { useState, useEffect } from 'react';
import { Car, Heart, Home, PiggyBank } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import '../../styles/InsuranceCentre.css';
import '../../styles/components.css';

export default function InsuranceCentre({ cartCount = 0 }) {
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

  // Track which categories have been "unlocked" (have purchased contracts)
  // Only Car Insurance unlocks when cartCount > 0
  const [unlockedCategories, setUnlockedCategories] = useState({});
  const [flippedCards, setFlippedCards] = useState({});
  const { notifications } = useNotifications();

  // Update unlocked status based on car insurance cart purchases
  useEffect(() => {
    // Only Car Insurance unlocks (when cartCount > 0 from car insurance carousel)
    setUnlockedCategories(prev => ({
      ...prev,
      car: cartCount > 0,
      health: false,
      house: false,
      money: false,
    }));
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
                </div>

                {/* Back of card - only show if unlocked */}
                {isUnlocked && (
                  <div className="insurance-tile-back">
                    <div className="back-content">
                      <h4 className="back-title">{category.label}</h4>
                      <p className="back-description">{category.description}</p>
                      <div className="back-actions">
                        <button className="back-button">View Details</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
