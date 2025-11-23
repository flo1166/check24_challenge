/**
 * =========================================================================
 * NotificationContext.jsx - Global Notification State
 * =========================================================================
 * Manages badge counts across the application.
 * Provides methods to increment/decrement notification badges.
 */

import React from 'react';

export const NotificationContext = React.createContext({
  notifications: {
    cart: 0,
    favorites: 0,
    alerts: 0,
    hotDeals: 0,
    portfolio: 0,
  },
  updateNotification: () => {},
  resetNotification: () => {},
});

export function useNotifications() {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationContext.Provider');
  }
  return context;
}