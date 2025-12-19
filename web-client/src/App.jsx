import { useState, useEffect, useCallback, useRef } from 'react';
import MainLayout from './components/layout/MainLayout';
import HomePage from './pages/HomePage';
import { NotificationContext } from './contexts/NotificationContext';
import { API_CONFIG, ENDPOINTS } from './config/api';  // ✅ Import config
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

      const endpoint = ENDPOINTS.home();  // ✅ Use config
      console.log('📡 Fetching widget data from:', endpoint);
      
      const response = await fetch(endpoint, {
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
      
      pendingFetchResolvers.current.forEach(resolve => {
        if (resolve.timeoutId) {
          clearTimeout(resolve.timeoutId);
        }
      });
      pendingFetchResolvers.current = [];
      
      throw error;
    }
  }, []);

  const waitForUpdate = useCallback(() => {
    return new Promise((resolve, reject) => {
      console.log('⏳ Waiting for cache invalidation and data refresh...');
      
      pendingFetchResolvers.current.push(resolve);
      
      const timeout = setTimeout(() => {
        console.warn('⚠️ Update timeout after 5 seconds');
        
        const index = pendingFetchResolvers.current.indexOf(resolve);
        if (index > -1) {
          pendingFetchResolvers.current.splice(index, 1);
        }
        
        reject(new Error('Update timeout'));
      }, 5000);
      
      resolve.timeoutId = timeout;
    });
  }, []);

  /**
   * Set up Server-Sent Events for real-time updates
   */
  useEffect(() => {
    fetchWidgetData();
    
    const streamEndpoint = ENDPOINTS.stream();  // ✅ Use config
    console.log('🔌 Establishing SSE connection to:', streamEndpoint);
    const eventSource = new EventSource(streamEndpoint);
    
    eventSource.onopen = () => {
      console.log('✅ SSE connection established');
    };
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 SSE message received:', data);
        
        if (data.type === 'cache_invalidated') {
          console.log('🔄 Cache invalidated!');
          console.log(`   Reason: ${data.reason} for user ${data.user_id}`);
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
    
    return () => {
      console.log('🔌 Closing SSE connection');
      eventSource.close();
    };
  }, [fetchWidgetData]);

  const updateNotification = (type, increment = 1) => {
    setNotifications(prev => ({
      ...prev,
      [type]: Math.max(0, prev[type] + increment),
    }));
  };

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