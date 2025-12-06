import { useState, useRef, useEffect } from 'react';
import WidgetRenderer from '../components/widgets/WidgetRenderer';
import Loader from '../components/common/Loader';
import { useNotifications } from '../contexts/NotificationContext';
import CategoryNav from "../components/navigation/CategoryNav";
import InsuranceCentre from '../components/layout/InsuranceCentre';

export default function HomePage({ data, loading, error, onRetry }) {
  const { updateNotification, notifications } = useNotifications();
  // We use 1 for the step to allow partial views at the end. 
  // The UI will still show 3, but the logic allows scrolling to the last widget.
  const [carouselIndex, setCarouselIndex] = useState(0); 
  const [activeCategory, setActiveCategory] = useState(null);
  const [carouselHeight, setCarouselHeight] = useState('auto');
  const [selectedCarInsurance, setSelectedCarInsurance] = useState(null);
  const carouselRef = useRef(null);

  const handleBoughtKonto = () => {
    updateNotification('cart', 1);
  };

  /**
   * Called when user adds a car insurance widget to cart
   * Saves the widget data to pass to InsuranceCentre
   */
  const handleCarInsuranceAdded = async (widgetData) => {
    // 1. Update UI first (instant)
    setSelectedCarInsurance(widgetData);
    
    const userId = 123; // TODO: Get from auth context
    const apiUrl = `http://localhost:8001/widget/car-insurance/contract`;
    
    const payload = {
      user_id: userId,
      widget_id: widgetData.widget_id,
    };

    // 2. Save to database
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest', // Force preflight
        },
        body: JSON.stringify(payload),
      });
    
    const result = await response.json();
    console.log('Contract ID:', result.contract_id);
  };

  /**
   * Check if widgets contain valid data (not just fallback)
   * Returns true if there are real widgets, false if empty or only fallback
   */
  const hasValidWidgets = () => {
    if (!data?.widgets || data.widgets.length === 0) {
      return false;
    }

    // Check if all widgets are fallback widgets
    const onlyFallback = data.widgets.every(
      widget => widget.widget_id === 'fallback_error_card'
    );

    return !onlyFallback;
  };

  // Measure the tallest card and set carousel height
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

    // Measure after render
    measureHeight();

    // Remeasure on window resize
    const resizeObserver = new ResizeObserver(measureHeight);
    resizeObserver.observe(carouselRef.current);

    return () => resizeObserver.disconnect();
  }, [data?.widgets]);

  // --- Start Navigation Helper Functions ---
  const totalWidgets = data?.widgets?.length || 0;
  const slidesPerView = 3;
  
  // Maximum index the carousel can start at.
  // We allow it to be the index of the last widget (totalWidgets - 1) 
  // so the last widget can be scrolled into view if the user clicks enough times.
  const maxCarouselIndex = totalWidgets > 0 ? totalWidgets - 1 : 0;
  
  // Calculate the index for the next page, allowing it to land on the maxCarouselIndex.
  const getNextIndex = () => {
      return Math.min(maxCarouselIndex, carouselIndex + slidesPerView);
  };

  // Calculate the index for the previous page.
  const getPrevIndex = () => {
      return Math.max(0, carouselIndex - slidesPerView);
  };

  const totalPages = Math.ceil(totalWidgets / slidesPerView);
  const currentPageIndex = Math.floor(carouselIndex / slidesPerView);

  // --- End Navigation Helper Functions ---

  // Loading State
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white p-8 rounded-c24-lg shadow-c24-lg text-center max-w-md border border-c24-alert-red/20">
          <h2 className="text-2xl font-bold text-c24-text-dark mb-3">⚠️ Connection Error</h2>
          <p className="text-c24-text-muted mb-4">{error}</p>
          <p className="text-xs text-c24-text-muted mb-6">
            Make sure the Core Service (BFF) and Mock Product Service are running.
          </p>
          <button 
            onClick={onRetry} 
            className="px-6 py-3 bg-c24-primary-medium text-white rounded-c24-sm font-semibold hover:bg-c24-hover-blue transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Success State
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-c24-primary-deep to-c24-primary-medium text-white p-12 rounded-c24-lg mb-12 text-center">
        <h1 className="text-5xl font-bold mb-3 text-white">
          {data?.title || "Insurance Centre"}
        </h1>

        <p className="text-lg opacity-90 mb-8">
          Find the best insurance deals tailored to your needs
        </p>
      </section>

      {/*Insurance Centre */}
      <section className="mb-16">
        <InsuranceCentre 
          cartCount={notifications.cart} 
          selectedCarInsurance={selectedCarInsurance}
        />
      </section>

      {/* Widgets Carousel - Only show if valid widgets exist */}
      {hasValidWidgets() && (
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-c24-text-dark mb-8">Car Insurance Deals</h2>
          
          <div className="relative">
            <div className="w-full">
              <div className="relative overflow-hidden" style={{ height: carouselHeight }} ref={carouselRef}>
                <div 
                  className="flex transition-transform duration-300 ease-out items-stretch"
                  style={{ 
                    // Use the slidesPerView variable for cleaner logic
                    transform: `translateX(calc(-${carouselIndex} * (100% / ${slidesPerView})))` 
                  }}
                >
                  {data.widgets
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
                          onAddToCart={handleCarInsuranceAdded}
                        />
                      </div>
                    ))}
                </div>
              </div>

              {/* Dot Indicators - Show pages (groups of 3) */}
              <div className="flex justify-center gap-2 mt-6">
                {Array.from({ length: totalPages }).map((_, pageIndex) => (
                  <button
                    key={pageIndex}
                    // Jump to the start of the page
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
              // Use the helper function
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
              // Use the helper function
              onClick={() => setCarouselIndex(getNextIndex())}
              className="absolute right-[-30px] top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-c24-text-muted/10 transition-colors disabled:opacity-50 z-10"
              // Corrected logic: Disable when the carousel is already showing the last reachable index.
              // This allows scrolling to the very last widget (index 42).
              disabled={carouselIndex >= maxCarouselIndex} 
              aria-label="Next 3 slides"
            >
              <svg className="w-6 h-6 text-c24-text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </section>
      )}

      {/* Footer CTA */}
      <section className="bg-gradient-to-r from-c24-primary-medium to-c24-primary-deep text-white text-center p-12 rounded-c24-lg">
        <h2 className="text-3xl font-bold mb-4">Ready to Save Money?</h2>
        <p className="text-lg opacity-90 mb-8">Join millions of smart shoppers finding the best deals on Check24</p>
        <button className="px-8 py-4 bg-c24-highlight-yellow text-c24-primary-deep rounded-c24-sm font-bold hover:opacity-90 transition-opacity">
          Get Started Now
        </button>
      </section>
    </div>
  );
}