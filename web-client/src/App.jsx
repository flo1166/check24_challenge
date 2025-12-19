/**
 * =========================================================================
 * App.jsx - UPDATED WITH WIDGETS-UPDATED EVENT LISTENER
 * =========================================================================
 * 
 * ✅ FIX: Listen for 'widgets-updated' event to refetch widget data
 *    This ensures widgets reappear after contract deletion
 */

import { useState, useEffect, useCallback } from 'react';
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

  const clearWidgets = () => {
    setData(prev => prev ? {...prev, widgets: []} : null);
  };

  /**
   * Fetch widget data from Core Service BFF
   */
  const fetchWidgetData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📡 Fetching widget data from /home endpoint...');
      
      const response = await fetch('http://localhost:8000/home');
      
      if (!response.ok) {
        throw new Error(`HTTP Error! Status: ${response.status}`);
      }

      const jsonData = await response.json();
      
      // 🔥 NEW: Check if data is fresh
      const dataTimestamp = new Date(jsonData.timestamp);
      const now = new Date();
      const ageMs = now - dataTimestamp;
      
      console.log(`✅ Widget data received (age: ${ageMs}ms):`, jsonData);
      
      // If data is older than 500ms, it might be stale cache
      if (ageMs > 500) {
        console.warn('⚠️ Data might be from cache, retrying in 200ms...');
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Retry once
        const retryResponse = await fetch('http://localhost:8000/home');
        const retryData = await retryResponse.json();
        console.log('✅ Retry successful:', retryData);
        
        setData(retryData);
      } else {
        setData(jsonData);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('❌ Fetch failed:', error);
      setError(error.message);
      setLoading(false);
    }
  }, []);

  /**
   * Set up Server-Sent Events for real-time updates
   */
  useEffect(() => {
    // Initial fetch
    fetchWidgetData();
    
    // Set up SSE connection for real-time updates
    console.log('🔌 Establishing SSE connection...');
    const eventSource = new EventSource('http://localhost:8000/stream/updates');
    
    eventSource.onopen = () => {
      console.log('✅ SSE connection established');
    };
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 SSE message received:', data);
        
        // Handle different message types
        if (data.type === 'cache_invalidated') {
          console.log('🔄 Cache invalidated, refetching widgets...');
          console.log(`   Reason: ${data.reason} for user ${data.user_id}`);
          fetchWidgetData();
        } else if (data.type === 'connected') {
          console.log('✅ SSE connection confirmed');
        } else if (data.type === 'ping') {
          console.log('💓 SSE keepalive ping');
        } else {
          console.log('🔄 Generic update received, refetching widgets...');
          fetchWidgetData();
        }
      } catch (error) {
        console.error('❌ Failed to parse SSE message:', error);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('❌ SSE connection error:', error);
      console.log('🔄 SSE will attempt to reconnect...');
    };
    
    // Cleanup on unmount
    return () => {
      console.log('🔌 Closing SSE connection');
      eventSource.close();
    };
  }, [fetchWidgetData]);

  /**
   * 🔥 NEW: Listen for manual widget update requests
   * This is triggered when contracts are deleted in Insurance Centre
   */
  useEffect(() => {
    const handleWidgetsUpdate = () => {
      console.log('📢 [App] widgets-updated event received - refetching widgets...');
      fetchWidgetData();
    };
    
    window.addEventListener('widgets-updated', handleWidgetsUpdate);
    
    return () => {
      window.removeEventListener('widgets-updated', handleWidgetsUpdate);
    };
  }, [fetchWidgetData]);

  /**
   * Update notification counts
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
          onClearWidgets={clearWidgets}
        />
      </MainLayout>
    </NotificationContext.Provider>
  );
}