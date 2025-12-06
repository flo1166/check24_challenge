/**
 * =========================================================================
 * WidgetRenderer.jsx - Dynamic Widget Component Mapper
 * =========================================================================
 * Maps SDUI widget data to React components based on component_type.
 * Implements the core SDUI pattern: dynamic rendering of server-sent UI.
 */

import React, { Suspense } from 'react';
import Card from './Card';
import InfoBox from './InfoBox';
import Loader from '../common/Loader';

/**
 * Component map for SDUI widget types
 * Add new component types here as they're developed
 */
const COMPONENT_MAP = {
  Card,
  InfoBox,
  // Hero: Hero,
  // ProductGrid: ProductGrid,
  // Carousel: Carousel,
  // Banner: Banner,
  // etc.
};

export default function WidgetRenderer({ widget, index, onAddToCart }) {
  if (!widget) {
    console.warn('⚠️ WidgetRenderer: widget is undefined');
    return null;
  }

  const { component_type, data, widget_id, priority } = widget;

  // Get component from map, default to Card
  const Component = COMPONENT_MAP[component_type];

  if (!Component) {
    console.warn(
      `⚠️ WidgetRenderer: Unknown component type "${component_type}". Defaulting to Card.`
    );
    return (
      <div key={widget_id || index} data-component-type={component_type} data-priority={priority} className="h-full">
        <Card data={data || widget} widgetData={widget} onAddToCart={onAddToCart} />
      </div>
    );
  }

  return (
    <div
      key={widget_id || index}
      data-component-type={component_type}
      data-priority={priority}
      // This h-full correctly ensures the widget occupies 100% of the parent slide wrapper height.
      className="h-full" 
    >
      <Suspense fallback={<Loader />}>
        <Component data={data || widget} widgetData={widget} onAddToCart={onAddToCart} />
      </Suspense>
    </div>
  );
}