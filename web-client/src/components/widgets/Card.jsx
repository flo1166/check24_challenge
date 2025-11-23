import React from 'react';

// Card.jsx - Defensive component that handles missing or malformed data

export default function Card({ data }) {
  // Debug: Log what we're receiving
  console.log("Card component received:", JSON.stringify(data, null, 2));

  // Defensive checks - handle undefined, null, or missing properties
  if (!data) {
    console.warn("Card: data is undefined or null");
    return (
      <div className="card p-4 bg-gray-100 border border-gray-300 rounded">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  // Safely access nested properties with fallbacks
  const title = data?.data?.title || data?.title || "Untitled";
  const content = data?.data?.content || data?.content || "No description available";
  const subtitle = data?.data?.subtitle || data?.subtitle || "";
  const imageUrl = data?.data?.image_url || data?.image_url || "";
  const ctaLink = data?.data?.cta_link || data?.cta_link || "#";

  return (
    <div className="card p-6 bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      {/* Image */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-48 object-cover rounded-md mb-4"
          onError={(e) => {
            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Crect fill='%23ddd' width='400' height='200'/%3E%3Ctext x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='16' fill='%23999'%3EImage not found%3C/text%3E%3C/svg%3E";
          }}
        />
      )}

      {/* Title */}
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>

      {/* Subtitle */}
      {subtitle && <p className="text-sm text-gray-600 mb-3 italic">{subtitle}</p>}

      {/* Content */}
      <p className="text-gray-700 mb-4 line-clamp-3">{content}</p>

      {/* CTA Button */}
      <a
        href={ctaLink}
        className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors"
      >
        Learn More
      </a>
    </div>
  );
}