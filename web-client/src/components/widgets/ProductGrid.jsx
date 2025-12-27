/**
 * =========================================================================
 * ProductGrid.jsx - Product Grid Widget
 * =========================================================================
 * Displays products in a responsive grid layout (min 2x2, grows as needed).
 * Uses CardSimple for clean product display.
 * Adapts grid columns based on number of products.
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

  // Determine grid columns based on number of products
  const productCount = processedProducts.length;
  
  // Dynamic grid classes based on product count
  const getGridClasses = () => {
    if (productCount === 1) {
      // Single product: 1 column on all screens
      return "grid grid-cols-1 max-w-md mx-auto gap-6 w-full";
    } else if (productCount === 2) {
      // Two products: 1 col mobile, 2 cols tablet+
      return "grid grid-cols-1 md:grid-cols-2 gap-6 w-full";
    } else if (productCount === 3) {
      // Three products: 1 col mobile, 2 cols tablet, 3 cols desktop
      return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full";
    } else {
      // Four or more: full responsive grid
      return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full";
    }
  };

  return (
    <div className="product-grid-widget mb-8 w-full"> 
      {/* Widget Title */}
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {title}
      </h2>

      {/* 
        Dynamic Grid Container: 
        - Adapts column count based on number of products
        - 1 product: Centered single column
        - 2 products: 2 columns on tablet+
        - 3 products: Up to 3 columns
        - 4+ products: Up to 4 columns on large screens
      */}
      <div className={getGridClasses()}>
        {processedProducts.map((product, index) => (
          <div key={product.id || product.title || index} className="h-full">
            <CardSimple data={product} />
          </div>
        ))}
      </div>
    </div>
  );
}