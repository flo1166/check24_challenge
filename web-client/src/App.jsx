import React, { useState, useEffect } from "react";
import WidgetRenderer from "./components/WidgetRenderer";

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHomePageData();
  }, []);

  async function fetchHomePageData() {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching data from /home endpoint...");
      const response = await fetch("http://localhost:8000/home");

      if (!response.ok) {
        throw new Error(`HTTP Error! Status: ${response.status}`);
      }

      const jsonData = await response.json();
      console.log("Received data from backend:", jsonData);

      // The backend returns: { title: "...", widgets: [...] }
      // WidgetRenderer expects the full response
      setData(jsonData);
      setLoading(false);
    } catch (error) {
      console.error("Fetch failed:", error);
      setError(error.message);
      setLoading(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-700 font-semibold">Loading widgets...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Data Aggregation Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <p className="text-sm text-gray-600 mb-6">
            Check if Core Service (BFF) and Mock Product Service are running.
          </p>
          <button
            onClick={fetchHomePageData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {data?.title || "Server-Driven Home Page"}
          </h1>
          <p className="text-gray-600">Powered by SDUI Architecture</p>
        </div>

        {/* Widgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.widgets && data.widgets.length > 0 ? (
            data.widgets.map((widget, index) => (
              <WidgetRenderer key={widget.widget_id || index} widget={widget} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">No widgets available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}