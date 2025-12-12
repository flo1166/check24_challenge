/**
 * =========================================================================
 * ProductCarousel.jsx - Reusable Product Carousel Component
 * =========================================================================
 * Displays a horizontal carousel of Card widgets with navigation controls.
 * Features:
 * - 3 cards per view (responsive)
 * - Left/right navigation arrows
 * - Dot indicators for pages
 * - Dynamic height adjustment
 */

import { useState, useRef, useEffect } from 'react';
import WidgetRenderer from './WidgetRenderer';

export default function ProductCarousel({ widgets, onAddToCart, title }) {
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselHeight, setCarouselHeight] = useState('auto');
  const carouselRef = useRef(null);
  const slidesPerView = 3;

  // Calculate navigation bounds
  const totalWidgets = widgets.length;
  const maxCarouselIndex = totalWidgets > 0 ? totalWidgets - 1 : 0;
  const totalPages = Math.ceil(totalWidgets / slidesPerView);
  const currentPageIndex = Math.floor(carouselIndex / slidesPerView);

  const getNextIndex = () => {
    return Math.min(maxCarouselIndex, carouselIndex + slidesPerView);
  };

  const getPrevIndex = () => {
    return Math.max(0, carouselIndex - slidesPerView);
  };

  // Measure carousel height dynamically
  useEffect(() => {
    if (!carouselRef.current) return;

    const measureHeight = () => {
      const slides = carouselRef.current?.querySelectorAll('[data-carousel-slide]');
      if (slides && slides.length > 0) {
        let maxHeight = 0;
        slides.forEach((slide) => {
          const height = slide.scrollHeight;
          if (height > maxHeight) maxHeight = height;
        });
        setCarouselHeight(maxHeight > 0 ? `${maxHeight}px` : 'auto');
      }
    };

    measureHeight();
    const resizeObserver = new ResizeObserver(measureHeight);
    resizeObserver.observe(carouselRef.current);

    return () => resizeObserver.disconnect();
  }, [widgets]);

  if (!widgets || widgets.length === 0) {
    return null;
  }

  return (
    <div className="mb-16">
      {title && (
        <h2 className="text-3xl font-bold text-c24-text-dark mb-8">{title}</h2>
      )}
      
      <div className="relative">
        <div className="w-full">
          {/* Carousel Container */}
          <div 
            className="relative overflow-hidden" 
            style={{ height: carouselHeight }} 
            ref={carouselRef}
          >
            <div 
              className="flex transition-transform duration-300 ease-out items-stretch"
              style={{ 
                transform: `translateX(calc(-${carouselIndex} * (100% / ${slidesPerView})))` 
              }}
            >
              {widgets
                .sort((a, b) => (a.priority || 0) - (b.priority || 0))
                .map((widget, index) => (
                  <div 
                    key={widget.widget_id || index}
                    data-carousel-slide
                    className="w-full lg:w-1/3 flex-shrink-0 px-3"
                  >
                    <WidgetRenderer 
                      widget={widget} 
                      index={index}
                      onAddToCart={onAddToCart}
                    />
                  </div>
                ))}
            </div>
          </div>

          {/* Dot Indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: totalPages }).map((_, pageIndex) => (
              <button
                key={pageIndex}
                onClick={() => setCarouselIndex(pageIndex * slidesPerView)}
                className={`w-4 h-2 rounded-full transition-colors ${
                  currentPageIndex === pageIndex ? 'bg-c24-primary-light' : 'bg-c24-text-muted'
                }`}
                aria-label={`Go to page ${pageIndex + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Left Navigation Button */}
        <button
          onClick={() => setCarouselIndex(getPrevIndex())}
          className="absolute left-[-30px] top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-c24-text-muted/10 transition-colors disabled:opacity-50 z-10"
          disabled={carouselIndex === 0}
          aria-label="Previous 3 slides"
        >
          <svg className="w-6 h-6 text-c24-text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Right Navigation Button */}
        <button
          onClick={() => setCarouselIndex(getNextIndex())}
          className="absolute right-[-30px] top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-c24-text-muted/10 transition-colors disabled:opacity-50 z-10"
          disabled={carouselIndex >= maxCarouselIndex}
          aria-label="Next 3 slides"
        >
          <svg className="w-6 h-6 text-c24-text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}