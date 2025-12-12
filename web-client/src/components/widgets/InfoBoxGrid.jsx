/**
 * =========================================================================
 * InfoBoxGrid.jsx - InfoBox Grid Component
 * =========================================================================
 * Displays InfoBox widgets in a responsive grid layout.
 * Perfect for displaying promotional content, tips, and alternatives.
 */

import WidgetRenderer from './WidgetRenderer';

export default function InfoBoxGrid({ widgets, title }) {
  if (!widgets || widgets.length === 0) {
    return null;
  }

  return (
    <div className="mb-16">
      {title && (
        <h2 className="text-1xl font-bold text-c24-text-dark mb-8">{title}</h2>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {widgets
          .sort((a, b) => (a.priority || 0) - (b.priority || 0))
          .map((widget, index) => (
            <div key={widget.widget_id || index}>
              <WidgetRenderer 
                widget={widget} 
                index={index}
              />
            </div>
          ))}
      </div>
    </div>
  );
}