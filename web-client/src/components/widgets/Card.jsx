/**
 * =========================================================================
 * Card.jsx - Card Widget Component
 * =========================================================================
 * Displays a single product/deal card with image, title, description,
 * price, rating, and call-to-action button.
 */

import React, { useState } from 'react';
import { Heart, ShoppingCart, Star } from 'lucide-react'; 
import { useNotifications } from '../../contexts/NotificationContext';
import { getImageUrl } from '../../utils/imageLoader';

// --- PriceLabel Component ---
export function PriceLabel({ price, currency, frequency }) {
  if (!price) return null;

  // Format price with European formatting: 1.234,56
  // 1. Convert to number and fix to 2 decimals
  const numericPrice = parseFloat(price);
  
  // 2. Split into integer and decimal parts
  const [integerPart, decimalPart] = numericPrice.toFixed(2).split('.');
  
  // 3. Add thousands separator (point) to integer part
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  // 4. Combine with comma as decimal separator
  const formattedPrice = `${formattedInteger},${decimalPart} ${currency || '€'}`;

  return (
    <div className="flex items-baseline mb-3">
      <span className="text-xl font-extrabold text-c24-text-dark mr-1">
        {formattedPrice}
      </span>
      {frequency && (
        <span className="text-c24-sm text-c24-text-muted">
          /{frequency}
        </span>
      )}
    </div>
  );
}


// --- UPDATED COMPONENT: RatingLabel (Focus on numerical value and single star icon) ---
export function RatingLabel({ rating }) {
  if (rating === null || rating === undefined) return null;

  const ratingValue = parseFloat(rating);
  const safeRating = Math.max(0, Math.min(5, ratingValue));
  
  // Format the numerical rating to one decimal place (e.g., 1.8)
  const formattedRating = safeRating.toFixed(1);

  // Use semi-transparent dark background for visibility on any image
  return (
    <div className="bg-black/50 rounded-full py-1 px-3 flex items-center shadow-md">
      <div className="flex items-center gap-1">
        {/* The numerical rating is prominent and white */}
        <span className="text-sm font-bold text-white">
          {formattedRating}
        </span>
        {/* A single yellow star icon for context */}
        <Star 
          size={20} 
          className="text-c24-alert-yellow fill-c24-highlight-yellow" 
          fill={'currentColor'}
        />
      </div>
    </div>
  );
}


function ContentList({ content }) {
  const listItems = content
    .split('.')
    .filter(item => item.trim() !== '')
    .map(item => item.trim());

  return (
    <ul className="text-c24-sm text-c24-text-muted leading-relaxed">
      {listItems.map((item, index) => (
        <li key={index} className="flex items-start mb-2">
          <span className="mr-2 flex-shrink-0">
            ✓
          </span>
          <span>
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function Card({ data, widgetData, onAddToCart }) {
  const { updateNotification } = useNotifications();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  // Safely extract data with fallbacks
  const title = data?.title || 'Untitled';
  const subtitle = data?.subtitle || '';
  const content = data?.content || 'No description available';
  const ctaLink = data?.cta_link || '#';
  const price = data?.pricing?.price || null;
  const frequency = data?.pricing?.frequency || null;
  const currency = data?.pricing?.currency || null;
  const rating = data?.rating?.score || null; 
  const resolvedImageUrl = getImageUrl(data?.image_url || null);

  /**
   * Handle adding item to cart
   */
  const handleAddToCart = () => {
    updateNotification('cart', 1);
    
    if (onAddToCart && widgetData) {
      onAddToCart(widgetData);
    }
    
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000); // Reset after 2s
  };

  /**
   * Handle favorite toggle
   */
  const handleFavorite = () => {
    const increment = isFavorite ? -1 : 1;
    updateNotification('favorites', increment);
    setIsFavorite(!isFavorite);
  };

  return (
    <div className="bg-white rounded-c24-md shadow-c24-md hover:shadow-c24-lg transition-all duration-200 overflow-hidden border border-c24-border-gray hover:border-c24-primary-medium hover:-translate-y-0.5 h-full flex flex-col">
      
      {/* 1. Image Container (Relative Parent) */}
      <div className="relative h-40 overflow-hidden bg-c24-light-gray group flex-shrink-0 flex justify-center items-center">
        {resolvedImageUrl ? (
          <img
            src={resolvedImageUrl}
            alt={title}
            className="w-65 object-cover group-hover:scale-105 transition-transform duration-200"
            onError={(e) => {
              e.target.src =
                'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22240%22%3E%3Crect fill=%22%23f5f5f5%22 width=%22400%22 height=%22240%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22Arial%22 font-size=%2216%22 fill=%22%23999%22%3ENo image available%3C/text%3E%3C/svg%3E';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-c24-text-muted">
            <span>No Image</span>
          </div>
        )}

        {/* --- RATING LABEL: Absolute position in bottom-left corner --- */}
        <div className="absolute top-2 right-2 z-10">
          <RatingLabel rating={rating} />
        </div>

        {/* Overlay Actions (Favorite Button) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-end p-3">
          <button
            onClick={handleFavorite}
            className={`rounded-full w-10 h-10 flex items-center justify-center transition-all ${
              isFavorite
                ? 'bg-c24-alert-red text-white'
                : 'bg-white text-c24-text-dark hover:bg-c24-light-gray'
            }`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* 2. Content Section */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex flex-col flex-1 mb-4">
          
          {/* Title and Subtitle */}
          <h3 className="text-base font-bold text-c24-text-dark mb-2 line-clamp-2">{title}</h3>
          {subtitle && <p className="text-xs font-semibold text-c24-primary-medium mb-2">{subtitle}</p>}
          
          {/* --- PRICE LABEL: Displayed in the content body --- */}
          <div className="flex items-center justify-start mt-1 mb-2">
            <PriceLabel 
              price={price} 
              currency={currency} 
              frequency={frequency} 
            />
          </div>
          
          {/* Description List */}
          <ContentList content={content} />
        </div>

        {/* 3. Footer/CTA */}
        <div className="mt-auto">
          <button
            onClick={handleAddToCart}
            className={`w-full px-4 py-3 rounded-c24-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              isAdded
                ? 'bg-green-500 text-white'
                : 'bg-c24-primary-medium text-white hover:bg-c24-hover-blue'
            }`}
          >
            <ShoppingCart size={16} />
            {isAdded ? 'Added!' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}