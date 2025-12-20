/**
 * =========================================================================
 * App.jsx - STATIC VERSION with Mock Data
 * =========================================================================
 * Modified to use mockDataService instead of real backend API calls.
 * Perfect for static hosting on Netlify, Vercel, GitHub Pages, etc.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import MainLayout from './components/layout/MainLayout';
import HomePage from './pages/HomePage';
import { NotificationContext } from './contexts/NotificationContext';
import './styles/index.css';

// Import mock data service
import mockAPI from './services/mockDataService';

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

  // Track pending fetch promises
  const pendingFetchResolvers = useRef([]);

  const clearWidgets = () => {
    setData(prev => prev ? {...prev, widgets: []} : null);
  };

  /**
   * Fetch widget data using mock service
   */
  const fetchWidgetData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📡 Fetching widget data from MOCK service...');
      
      // Use mock API instead of real fetch
      const jsonData = await mockAPI.fetchHomeData();
      
      console.log(`✅ Widget data received:`, jsonData);
      setData(jsonData);
      setLoading(false);
      
      // Resolve all pending fetch promises
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
   * Wait for SSE event AND the subsequent data fetch to complete
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
   * Set up Mock SSE for real-time updates simulation
   */
  useEffect(() => {
    // Initial fetch
    fetchWidgetData();
    
    // Set up mock SSE connection
    console.log('🔌 Establishing MOCK SSE connection...');
    
    // Listen for mock SSE events
    const handleMockSSE = (event) => {
      const data = event.detail;
      console.log('📨 Mock SSE message received:', data);
      
      if (data.type === 'cache_invalidated') {
        console.log('🔄 Cache invalidated!');
        console.log(`   Reason: ${data.reason}`);
        
        // Fetch fresh data
        fetchWidgetData();
      }
    };
    
    window.addEventListener('mock-sse-event', handleMockSSE);
    
    // Simulate initial connection message
    setTimeout(() => {
      console.log('✅ Mock SSE connection established');
    }, 100);
    
    // Cleanup on unmount
    return () => {
      console.log('🔌 Closing mock SSE connection');
      window.removeEventListener('mock-sse-event', handleMockSSE);
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

  const contextValue = {
    notifications,
    updateNotification,
    resetNotification,
    waitForUpdate
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