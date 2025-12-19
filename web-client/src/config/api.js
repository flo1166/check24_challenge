/**
 * =========================================================================
 * api.js - API Configuration from Environment Variables
 * =========================================================================
 * Centralized configuration for all API endpoints
 */

// Vite exposes env variables via import.meta.env
// All custom variables must be prefixed with VITE_

export const API_CONFIG = {
  // Base URL for Core Service (BFF)
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  
  // Product Service Ports
  ports: {
    carInsurance: import.meta.env.VITE_CAR_INSURANCE_PORT || 8001,
    healthInsurance: import.meta.env.VITE_HEALTH_INSURANCE_PORT || 8002,
    houseInsurance: import.meta.env.VITE_HOUSE_INSURANCE_PORT || 8003,
    banking: import.meta.env.VITE_BANKING_PORT || 8004,
  },
  
  // Helper to get service URL
  getServiceUrl: (port) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const baseHostname = new URL(baseUrl).hostname;
    return `http://${baseHostname}:${port}`;
  },
  
  // Environment info
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  mode: import.meta.env.MODE,
};

// Endpoint builders
export const ENDPOINTS = {
  home: () => `${API_CONFIG.baseUrl}/home`,
  userContracts: (userId) => `${API_CONFIG.baseUrl}/user/${userId}/contracts`,
  deleteContract: (userId, service, widgetId) => 
    `${API_CONFIG.baseUrl}/user/${userId}/contract/${service}/${widgetId}`,
  createContract: (serviceKey, port) => 
    `${API_CONFIG.getServiceUrl(port)}/widget/${serviceKey}/contract`,
  stream: () => `${API_CONFIG.baseUrl}/stream/updates`,
};

// Log configuration in development
if (API_CONFIG.isDevelopment) {
  console.log('🔧 API Configuration:', API_CONFIG);
}