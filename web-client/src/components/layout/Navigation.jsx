/**
 * =========================================================================
 * Navigation.jsx - Primary Navigation Bar
 * =========================================================================
 * Horizontal navigation bar with blue icons and red notification badges.
 * Icons include: Home, Cart, Favorites, Alerts, Hot Deals, Portfolio, Pricing, Settings.
 */

import React, { useState } from 'react';
import {
  Home,
  ShoppingCart,
  Heart,
  Bell,
  Zap,
  TrendingUp,
  DollarSign,
  Settings,
} from 'lucide-react';
import NavIcon from '../navigation/NavIcon';
import { useNotifications } from '../../contexts/NotificationContext';

export default function Navigation({ onNavigate, activeNav }) {
  const { notifications } = useNotifications();

  const navItems = [
    { id: 'home', icon: Home, label: 'Home', count: 0 },
    { id: 'cart', icon: ShoppingCart, label: 'Cart', count: notifications.cart },
    { id: 'favorites', icon: Heart, label: 'Favorites', count: notifications.favorites },
    { id: 'alerts', icon: Bell, label: 'Alerts', count: notifications.alerts },
    { id: 'deals', icon: Zap, label: 'Hot Deals', count: notifications.hotDeals },
    { id: 'portfolio', icon: TrendingUp, label: 'Portfolio', count: notifications.portfolio },
    { id: 'pricing', icon: DollarSign, label: 'Pricing', count: 0 },
    { id: 'settings', icon: Settings, label: 'Settings', count: 0 },
  ];

  return (
    <nav className="sticky top-[74px] z-40 bg-c24-primary-deep border-b border-c24-primary-medium h-[70px]" id="c24-header-bottom">
      <div className="max-w-7xl mx-auto px-4 h-full">
        <div className="flex items-center justify-start gap-4 h-full">
          {navItems.map((item) => (
            <NavIcon
              key={item.id}
              icon={item.icon}
              label={item.label}
              count={item.count}
              active={activeNav === item.id}
              onClick={() => onNavigate(item.id)}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}