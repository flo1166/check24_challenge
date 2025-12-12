/**
 * =========================================================================
 * CardSimple.jsx - Simple E-commerce Product Card Component
 * =========================================================================
 * Minimalist card focusing on image, title, price, and rating for grid view.
 */

import React from 'react';
import { PriceLabel, RatingLabel } from './Card';
import { getImageUrl } from '../../utils/imageLoader';

export default function CardSimple({ data }) {
  const title = data?.title || 'Untitled Product';
  const price = data?.pricing?.price || null;
  const currency = data?.pricing?.currency || null;
  const rating = data?.rating?.score || null;
  
  // Try to resolve image URL through imageLoader first
  let resolvedImageUrl = data?.image_url;
  if (resolvedImageUrl && typeof resolvedImageUrl === 'string') {
    const loadedUrl = getImageUrl(resolvedImageUrl);
    if (loadedUrl) {
      resolvedImageUrl = loadedUrl;
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col group h-full">
      
      {/* Image Container */}
      <div className="relative h-48 overflow-hidden bg-gray-100 flex-shrink-0">
        {resolvedImageUrl ? (
          <img
            src={resolvedImageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => { 
              console.warn(`Failed to load image: ${resolvedImageUrl}`);
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = `
                <div class="w-full h-full flex items-center justify-center text-gray-400">
                  <span>No Image</span>
                </div>
              `;
            }} 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span>No Image</span>
          </div>
        )}
      </div>

      {/* Content Section (Title, Price, Rating) */}
      <div className="p-4 flex flex-col flex-1">
        
        {/* Title */}
        <h3 className="text-base font-semibold text-gray-800 mb-2 line-clamp-2 transition-colors group-hover:text-indigo-600">
          {title}
        </h3>
        
        {/* Price and Rating Row */}
        <div className="flex items-center justify-between mt-auto pt-2">
          {/* Price */}
          <PriceLabel 
            price={price} 
            currency={currency} 
          />
          
          {/* Rating */}
          {rating !== null && <RatingLabel rating={rating} />}
        </div>
      </div>
    </div>
  );
}