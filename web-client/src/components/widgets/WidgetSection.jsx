/**
 * =========================================================================
 * WidgetSection.jsx - Component-Based Widget Section Renderer
 * =========================================================================
 * Renders widgets grouped by their component structure from the API.
 * Each component is rendered separately based on component_order.
 * 
 * Supported component types:
 * - ProductGrid: Grid of products
 * - Card: Carousel of cards
 * - InfoBox: Grid of info boxes
 * - SectionHeader: Section header with collapse
 */

import { useMemo } from 'react';
import ProductCarousel from './ProductCarousel';
import InfoBoxGrid from './InfoBoxGrid';
import SectionHeader from './SectionHeader';
import ProductGrid from './ProductGrid';

/**
 * Renders a single component based on its type
 */
function ComponentRenderer({ component, onAddToCart }) {
  const { component_type, widgets = [] } = component;
  
  // Filter out fallback widgets
  const validWidgets = widgets.filter(w => w.widget_id !== 'fallback_error_card');
  
  if (validWidgets.length === 0 && component_type !== 'SectionHeader') {
    return null;
  }

  switch (component_type) {
    case 'ProductGrid':
      // ProductGrid expects the first widget's data
      return (
        <div className="mb-8">
          <ProductGrid 
            widgetData={validWidgets[0]} 
            onAddToCart={onAddToCart}
          />
        </div>
      );

    case 'Card':
      // Cards render in ProductCarousel
      return (
        <div className="mb-8">
          <ProductCarousel 
            widgets={validWidgets}
            onAddToCart={onAddToCart}
          />
        </div>
      );

    case 'InfoBox':
      // InfoBoxes render in InfoBoxGrid
      return (
        <div className="mb-8">
          <InfoBoxGrid 
            widgets={validWidgets}
          />
        </div>
      );

    case 'SectionHeader':
      // SectionHeader renders individually
      if (validWidgets.length === 0) return null;
      return (
        <div className="mb-6">
          <SectionHeader 
            data={validWidgets[0].data || validWidgets[0]}
          />
        </div>
      );

    default:
      console.warn(`Unknown component_type: ${component_type}`);
      return null;
  }
}

/**
 * Main WidgetSection Component
 * Renders components from a service in order
 */
export default function WidgetSection({ 
  serviceData,
  onAddToCart,
  showSectionHeaders = true,
  isCollapsed,        
  onToggleCollapse    
}) {
  const { title, components = [] } = serviceData;

  /**
   * Sort components by component_order
   */
  const sortedComponents = useMemo(() => {
    return [...components].sort((a, b) => 
      (a.component_order || 0) - (b.component_order || 0)
    );
  }, [components]);

  /**
   * Count total valid widgets across all components
   */
  const totalWidgets = useMemo(() => {
    return sortedComponents.reduce((sum, component) => {
      const validWidgets = (component.widgets || []).filter(
        w => w.widget_id !== 'fallback_error_card'
      );
      return sum + validWidgets.length;
    }, 0);
  }, [sortedComponents]);

  if (totalWidgets === 0) {
    return null;
  }

  // Find SectionHeader component if exists
  const sectionHeaderComponent = sortedComponents.find(
    c => c.component_type === 'SectionHeader'
  );

  return (
    <div className="widget-section mb-12">
      {/* Section Header */}
      {showSectionHeaders && (
        <div className="mb-8">
          {sectionHeaderComponent ? (
            // Use SectionHeader from data
            <SectionHeader 
              data={sectionHeaderComponent.widgets[0]?.data || {}}
              onToggle={onToggleCollapse}
              isCollapsed={isCollapsed}
            />
          ) : (
            // Fallback: use service title
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-c24-primary-deep mb-2">
                  {title}
                </h2>
                <p className="text-c24-text-muted text-sm">
                  {totalWidgets} {totalWidgets === 1 ? 'deal' : 'deals'} available
                </p>
              </div>
              
              {onToggleCollapse && (
                <button
                  onClick={onToggleCollapse}
                  className="flex items-center gap-2 px-4 py-2 text-c24-primary-medium hover:text-c24-hover-blue transition-colors font-semibold"
                >
                  {isCollapsed ? 'Show' : 'Hide'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Render Components in Order */}
      {!isCollapsed && (
        <div className="space-y-6">
          {sortedComponents.map((component, index) => {
            // Skip SectionHeader since we rendered it above
            if (component.component_type === 'SectionHeader') {
              return null;
            }

            return (
              <ComponentRenderer
                key={`${component.component_id}-${index}`}
                component={component}
                onAddToCart={onAddToCart}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}