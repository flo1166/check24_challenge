/**
 * =========================================================================
 * ProductGrid.jsx - Product Grid Widget
 * =========================================================================
 * Displays products in a responsive grid layout (min 2x2, grows as needed).
 * Uses CardSimple for clean product display.
 */

import React from 'react';
import CardSimple from './CardSimple'; 
import { getImageUrl } from '../../utils/imageLoader';

export default function ProductGrid({ widgetData, onAddToCart }) {
  
  // Robust search for the 'products' array
  const products = 
    widgetData?.data?.products ||
    widgetData?.products ||
    widgetData?.data?.data?.products ||
    []; 

  // Safely extract the title
  const title = widgetData?.title || widgetData?.data?.title || 'Featured Deals';
  
  if (products.length === 0) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg text-gray-500">
        No products available for this grid.
      </div>
    );
  }

  // Process products to resolve image URLs
  const processedProducts = products.map(product => ({
    ...product,
    image_url: getImageUrl(product.image_url) || product.image_url
  }));

  return (
    <div className="product-grid-widget mb-8 w-full"> 
      {/* Widget Title */}
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {title}
      </h2>

      {/* 
        Grid Container: 
        - Mobile: 1 column
        - Tablet (md): 2 columns (2x2 minimum)
        - Desktop (lg): 3 columns
        - Large Desktop (xl): 4 columns
        
        The grid will automatically grow with more cards while maintaining
        this responsive structure.
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
        {processedProducts.map((product, index) => (
          <div key={product.id || product.title || index} className="h-full">
            <CardSimple data={product} />
          </div>
        ))}
      </div>
    </div>
  );
}