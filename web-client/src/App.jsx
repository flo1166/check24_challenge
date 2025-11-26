/**
 * =========================================================================
 * App.jsx - Main Application Component
 * =========================================================================
 * Root component that orchestrates the entire Check24 widget platform.
 * Manages:
 * - Widget data fetching from BFF
 * - Global notification state (badge counts)
 * - Theme context
 * - Error boundaries
 */

import { useState, useEffect } from 'react';
import MainLayout from './components/layout/MainLayout';
import HomePage from './pages/HomePage';
import { NotificationContext } from './contexts/NotificationContext';
import './styles/index.css';

export default function App() {
  const [notifications, setNotifications] = useState({
    cart: 0,
    favorites: 0,
    alerts: 0,
    hotDeals: 0,
    portfolio: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  /**
   * Fetch widget data from Core Service BFF
   * This happens on component mount and periodically via polling
   */
  useEffect(() => {
    fetchWidgetData();
    
    // Set up polling interval (every 10 seconds)
    const interval = setInterval(fetchWidgetData, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchWidgetData() {
    try {
      setLoading(true);
      setError(null);

      console.log('📡 Fetching widget data from /home endpoint...');
      
      const response = await fetch('http://localhost:8000/home');
      
      if (!response.ok) {
        throw new Error(`HTTP Error! Status: ${response.status}`);
      }

      const jsonData = await response.json();
      console.log('✅ Widget data received:', jsonData);

      setData(jsonData);
      setLoading(false);
    } catch (error) {
      console.error('❌ Fetch failed:', error);
      setError(error.message);
      setLoading(false);
    }
  }

  /**
   * Update notification counts
   * Called when user performs actions (add to cart, favorite, etc.)
   */
  const updateNotification = (type, increment = 1) => {
    setNotifications(prev => ({
      ...prev,
      [type]: Math.max(0, prev[type] + increment),
    }));
  };

  /**
   * Reset a notification count
   */
  const resetNotification = (type) => {
    setNotifications(prev => ({
      ...prev,
      [type]: 0,
    }));
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, updateNotification, resetNotification }}
    >
      <MainLayout>
        <HomePage
          data={data}
          loading={loading}
          error={error}
          onRetry={fetchWidgetData}
        />
      </MainLayout>
    </NotificationContext.Provider>
  );
}