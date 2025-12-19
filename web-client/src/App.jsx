/**
 * =========================================================================
 * App.jsx - FIXED: Wait for SSE *AND* data fetch to complete
 * =========================================================================
 */

import { useState, useEffect, useCallback, useRef } from 'react';
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

  // 🔥 FIX: Track pending fetch promises
  const pendingFetchResolvers = useRef([]);

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
      
      const response = await fetch('http://localhost:8000/home', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP Error! Status: ${response.status}`);
      }

      const jsonData = await response.json();
      
      console.log(`✅ Widget data received:`, jsonData);
      setData(jsonData);
      setLoading(false);
      
      // 🔥 FIX: Resolve all pending fetch promises
      if (pendingFetchResolvers.current.length > 0) {
        console.log(`✅ Resolving ${pendingFetchResolvers.current.length} pending fetch promise(s)`);
        pendingFetchResolvers.current.forEach(resolve => {
          if (resolve.timeoutId) {
            clearTimeout(resolve.timeoutId);
          }
          resolve(jsonData);
        });
        pendingFetchResolvers.current = [];
      }
      
      return jsonData;
    } catch (error) {
      console.error('❌ Fetch failed:', error);
      setError(error.message);
      setLoading(false);
      
      // Reject pending promises
      pendingFetchResolvers.current.forEach(resolve => {
        if (resolve.timeoutId) {
          clearTimeout(resolve.timeoutId);
        }
      });
      pendingFetchResolvers.current = [];
      
      throw error;
    }
  }, []);

  /**
   * 🔥 FIX: Wait for SSE event *AND* the subsequent data fetch to complete
   * Returns the fresh data
   */
  const waitForUpdate = useCallback(() => {
    return new Promise((resolve, reject) => {
      console.log('⏳ Waiting for cache invalidation and data refresh...');
      
      // Store resolver
      pendingFetchResolvers.current.push(resolve);
      
      // Timeout after 5 seconds
      const timeout = setTimeout(() => {
        console.warn('⚠️ Update timeout after 5 seconds');
        
        // Remove this resolver
        const index = pendingFetchResolvers.current.indexOf(resolve);
        if (index > -1) {
          pendingFetchResolvers.current.splice(index, 1);
        }
        
        reject(new Error('Update timeout'));
      }, 5000);
      
      // Store timeout ID so we can clear it
      resolve.timeoutId = timeout;
    });
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
          console.log('🔄 Cache invalidated!');
          console.log(`   Reason: ${data.reason} for user ${data.user_id}`);
          
          // 🔥 FIX: Fetch fresh data - this will resolve pending promises when done
          fetchWidgetData();
          
        } else if (data.type === 'connected') {
          console.log('✅ SSE connection confirmed');
        } else if (data.type === 'ping') {
          console.log('💓 SSE keepalive ping');
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

  /**
   * 🔥 FIX: Provide waitForUpdate to children
   */
  const contextValue = {
    notifications,
    updateNotification,
    resetNotification,
    waitForUpdate  // 🔥 Returns fresh data after SSE + fetch complete
  };

  return (
    <NotificationContext.Provider value={contextValue}>
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