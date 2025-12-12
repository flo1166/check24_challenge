/**
 * =========================================================================
 * WidgetSection.jsx - Dynamic Widget Section Renderer
 * =========================================================================
 * Intelligently groups and renders widgets based on their component_type.
 * 
 * Supported layouts:
 * - Card widgets → ProductCarousel (horizontal scrolling)
 * - InfoBox widgets → InfoBoxGrid (2-column grid)
 * - SectionHeader widgets → Rendered inline with collapse functionality
 * - Future: ProductGrid, Hero, Banner, etc.
 * 
 * Usage:
 * <WidgetSection 
 *   widgets={allWidgets} 
 *   sectionTitle="Car Insurance Deals"
 *   onAddToCart={handleAddToCart}
 * />
 */

import { useMemo, useState } from 'react';
import ProductCarousel from './ProductCarousel';
import InfoBoxGrid from './InfoBoxGrid';
import SectionHeader from './SectionHeader';
import ProductGrid from './ProductGrid';

export default function WidgetSection({ 
  widgets, 
  sectionTitle, 
  onAddToCart,
  showSectionHeaders = true 
}) {
  // State to manage collapsed sections
  const [isCollapsed, setIsCollapsed] = useState(false);

  /**
   * Group widgets by their component_type
   * Returns an object like:
   * {
   *   Card: [...cardWidgets],
   *   InfoBox: [...infoBoxWidgets],
   *   SectionHeader: [...headerWidgets]
   * }
   */
  const groupedWidgets = useMemo(() => {
    if (!widgets || widgets.length === 0) return {};

    return widgets.reduce((groups, widget) => {
      const type = widget.component_type || 'Card'; 
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(widget);
      return groups;
    }, {});
  }, [widgets]);

  // Check if we have any widgets to render
  const hasWidgets = Object.keys(groupedWidgets).length > 0;

  if (!hasWidgets) {
    return null;
  }

  // Toggle collapsed state
  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="widget-section">
      {/* Render SectionHeader widgets first (if enabled) */}
      {showSectionHeaders && groupedWidgets.SectionHeader && (
        <div className="mb-8">
          {groupedWidgets.SectionHeader
            .sort((a, b) => (a.priority || 0) - (b.priority || 0))
            .map((widget, index) => (
              <div key={widget.widget_id || index} className="mb-6">
                <SectionHeader 
                  data={widget.data || widget} 
                  onToggle={handleToggle}
                  isCollapsed={isCollapsed}
                />
              </div>
            ))}
        </div>
      )}

      {/* Only render content widgets if NOT collapsed */}
      {!isCollapsed && (
        <>
          {/* Render Card widgets in a carousel */}
          {groupedWidgets.Card && groupedWidgets.Card.length > 0 && (
            <ProductCarousel 
              widgets={groupedWidgets.Card}
              onAddToCart={onAddToCart}
              title={!showSectionHeaders ? sectionTitle : undefined}
            />
          )}

          {/* Render InfoBox widgets in a grid */}
          {groupedWidgets.InfoBox && groupedWidgets.InfoBox.length > 0 && (
            <InfoBoxGrid 
              widgets={groupedWidgets.InfoBox}
              title={groupedWidgets.Card ? "More Options" : undefined}
            />
          )}
          {groupedWidgets.ProductGrid && groupedWidgets.ProductGrid.length > 0 && (
            <ProductGrid 
                widgetData={groupedWidgets.ProductGrid[0]} 
                onAddToCart={onAddToCart}
            />
          )}

          {/* Future: Add more layout types here */}
          {/* Example:
          {groupedWidgets.ProductGrid && (
            <ProductGrid widgets={groupedWidgets.ProductGrid} />
          )}
          */}
        </>
      )}
    </div>
  );
}