// web-client/src/components/WidgetRenderer.jsx
import React from 'react';
import Card from './widgets/Card'; // Import your component place-holders

// Map the server's 'component_type' string to the actual React component.
const componentMap = {
  // Key must match the 'component_type' string in the Widget Pydantic model
  'Card': Card, 
  // 'Hero': HeroComponent, // Add more components as you define them
  // 'TextList': TextListComponent,
};

/**
 * The core of Server-Driven UI. Renders the appropriate component 
 * based on the widget's component_type.
 * @param {object} props.widget - The Widget JSON object from the server.
 */
const WidgetRenderer = ({ widget }) => {
  const { component_type, data } = widget;

  // 1. Look up the component in the map based on the type string
  const SpecificComponent = componentMap[component_type];

  // 2. Handle unknown/missing components gracefully
  if (!SpecificComponent) {
    console.error(`Unknown component type: ${component_type}`);
    return (
      <div style={{ padding: '10px', border: '1px solid red', margin: '10px' }}>
          ⚠️ Error: Unknown Widget Type {component_type}
        </div>
    );
  }

  // 3. Render the specific component, passing the whole 'data' object
  return <SpecificComponent data={data} />;
};

export default WidgetRenderer;