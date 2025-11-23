import React from 'react';
import Card from "./widgets/Card";

/**
 * WidgetRenderer: Maps component_type to React components
 * Renders the correct component based on SDUI widget definition
 */
export default function WidgetRenderer({ widget }) {
  console.log("WidgetRenderer received widget:", widget);

  if (!widget) {
    console.warn("WidgetRenderer: widget is undefined");
    return <div className="text-gray-500">Invalid widget</div>;
  }

  const { component_type, data, ...props } = widget;

  // Map component types to React components
  const componentMap = {
    Card: Card,
    // Add other component types here as needed
    // Button: Button,
    // Hero: Hero,
    // etc.
  };

  // Get the component class, default to Card if not found
  const Component = componentMap[component_type] || Card;

  // Pass the entire widget object to the component
  return (
    <div className="widget-wrapper">
      <Component data={data || widget} {...props} />
    </div>
  );
}