/**
 * =========================================================================
 * mockDataService.js - Static Mock Data Service
 * =========================================================================
 * Replaces backend API calls with static mock data for UI-only hosting.
 * Data structure matches your PostgreSQL schema from init.sql files.
 */

// ============================================================================
// MOCK DATA FROM YOUR DATABASE SCHEMAS
// ============================================================================

const MOCK_USER_ID = 123;

// Car Insurance Widgets (from car-insurance-service/db_init/init.sql)
const CAR_INSURANCE_WIDGETS = [
  {
    user_id: 123,
    widget_id: 'car_recommendation_header',
    component_type: 'SectionHeader',
    priority: 100,
    data: {
      title: "Our Car Insurance Recommendations for You",
      subtitle: "Hide Recommendations",
      content: "Compare top-rated car insurance providers and save up to 40% on your premium"
    }
  },
  {
    user_id: 123,
    widget_id: 'car_premium_card',
    component_type: 'Card',
    priority: 90,
    data: {
      title: "Premium Coverage with Roadside Assistance",
      rating: { label: "very good", score: 1.2 },
      content: "Comprehensive Coverage. 24/7 Roadside Assistance. Free Rental Car. Windshield Repair Included.",
      pricing: { price: 89.00, currency: "EUR", frequency: "monthly" },
      cta_link: "https://www.check24.de/",
      subtitle: "Top-rated insurance with roadside help - €89.00/month",
      image_url: "companies/allianzdirect.svg"
    }
  },
  {
    user_id: 123,
    widget_id: 'car_standard_card',
    component_type: 'Card',
    priority: 80,
    data: {
      title: "Standard Car Insurance",
      rating: { label: "good", score: 1.5 },
      content: "Liability Coverage. Collision Protection. Theft Coverage. €500 Deductible.",
      pricing: { price: 65.50, currency: "EUR", frequency: "monthly" },
      cta_link: "https://www.check24.de/",
      subtitle: "Reliable protection at a great price - €65.50/month",
      image_url: "companies/cosmosdirekt.svg"
    }
  },
  {
    user_id: 123,
    widget_id: 'car_budget_card',
    component_type: 'Card',
    priority: 70,
    data: {
      title: "Budget Car Insurance",
      rating: { label: "good", score: 1.8 },
      content: "Basic Liability. Minimal Coverage. Low Monthly Payments. €1000 Deductible.",
      pricing: { price: 45.00, currency: "EUR", frequency: "monthly" },
      cta_link: "https://www.check24.de/",
      subtitle: "Affordable basic protection - Start at €45/month",
      image_url: "companies/bavariadirekt.svg"
    }
  },
  {
    user_id: 123,
    widget_id: 'car_young_driver_card',
    component_type: 'Card',
    priority: 60,
    data: {
      title: "Young Driver Special",
      rating: { label: "very good", score: 1.3 },
      content: "Age 18-25. Comprehensive Coverage. Accident Forgiveness. Driver Training Discount.",
      pricing: { price: 125.00, currency: "EUR", frequency: "monthly" },
      cta_link: "https://www.check24.de/",
      subtitle: "Specialized coverage for new drivers - Includes training discount!",
      image_url: "companies/concordia.svg"
    }
  },
  {
    user_id: 123,
    widget_id: 'info_electric_discount',
    component_type: 'InfoBox',
    priority: 40,
    data: {
      title: "💡 Electric Vehicle Discount Available",
      subtitle: null,
      content: "Switch to an electric or hybrid vehicle and save up to 15% on your car insurance premium. Ask about our green car benefits and charging station coverage.",
      footer: "Learn More About EV Discounts"
    }
  }
];

// Health Insurance Widgets (from health-insurance-service/db_init/init.sql)
const HEALTH_INSURANCE_WIDGETS = [
  {
    user_id: 123,
    widget_id: 'health_recommendation_header',
    component_type: 'SectionHeader',
    priority: 100,
    data: {
      title: "Our Health Insurance Recommendations for You",
      subtitle: "Hide Recommendations",
      content: "Compare the best health insurance plans tailored to your needs and budget."
    }
  },
  {
    user_id: 123,
    widget_id: 'health_premium_card',
    component_type: 'Card',
    priority: 90,
    data: {
      title: "Premium Health Plus",
      rating: { label: "very good", score: 1.2 },
      content: "Comprehensive Coverage. Private Hospital Treatment. Dental Included. No Deductible.",
      pricing: { price: 289.00, currency: "EUR", frequency: "monthly" },
      cta_link: "https://www.check24.de/",
      subtitle: "Top-rated comprehensive coverage - Private treatment and dental included!",
      image_url: "companies/allianzdirect.svg"
    }
  },
  {
    user_id: 123,
    widget_id: 'health_standard_card',
    component_type: 'Card',
    priority: 80,
    data: {
      title: "Standard Health Coverage",
      rating: { label: "good", score: 1.5 },
      content: "Basic Medical Coverage. Prescription Drugs. Specialist Visits. €500 Annual Deductible.",
      pricing: { price: 195.50, currency: "EUR", frequency: "monthly" },
      cta_link: "https://www.check24.de/",
      subtitle: "Reliable medical coverage for daily needs - Budget-friendly deductible!",
      image_url: "companies/bavariaprotect.svg"
    }
  },
  {
    user_id: 123,
    widget_id: 'health_budget_card',
    component_type: 'Card',
    priority: 70,
    data: {
      title: "Budget Health Basic",
      rating: { label: "good", score: 1.8 },
      content: "Essential Medical Services. Generic Medications. Limited Specialist Access. €1000 Deductible.",
      pricing: { price: 145.00, currency: "EUR", frequency: "monthly" },
      cta_link: "https://www.check24.de/",
      subtitle: "Essential services at the lowest price - Great value basic plan!",
      image_url: "companies/cosmosdirekt.svg"
    }
  },
  {
    user_id: 123,
    widget_id: 'health_family_card',
    component_type: 'Card',
    priority: 60,
    data: {
      title: "Family Health Package",
      rating: { label: "very good", score: 1.3 },
      content: "Coverage for 4 Family Members. Pediatric Care. Maternity Benefits. Preventive Check-ups.",
      pricing: { price: 425.00, currency: "EUR", frequency: "monthly" },
      cta_link: "https://www.check24.de/",
      subtitle: "Complete coverage for the whole family - Includes maternity and pediatric care!",
      image_url: "companies/concordia.svg"
    }
  },
  {
    user_id: 123,
    widget_id: 'health_senior_card',
    component_type: 'Card',
    priority: 50,
    data: {
      title: "Senior Care Plus",
      rating: { label: "very good", score: 1.4 },
      content: "Age 60+ Specialized. Chronic Disease Management. Home Care Services. Priority Appointments.",
      pricing: { price: 345.00, currency: "EUR", frequency: "monthly" },
      cta_link: "https://www.check24.de/",
      subtitle: "Specialized care for ages 60+ - Priority access and home care support!",
      image_url: "companies/devk.svg"
    }
  },
  {
    user_id: 123,
    widget_id: 'info_dental_addon',
    component_type: 'InfoBox',
    priority: 40,
    data: {
      title: "Add Dental Coverage?",
      subtitle: null,
      content: "Dental insurance covers routine check-ups, cleanings, fillings, and major procedures like crowns and implants. Supplement your health plan for complete oral health protection.",
      footer: "View 15+ Dental Plans from €19/month"
    }
  },
  {
    user_id: 123,
    widget_id: 'health_digital_card',
    component_type: 'Card',
    priority: 30,
    data: {
      title: "Digital Health 24/7",
      rating: { label: "good", score: 1.6 },
      content: "Telemedicine Consultations. Online Prescriptions. Mental Health Support. Fitness App Integration.",
      pricing: { price: 99.00, currency: "EUR", frequency: "monthly" },
      cta_link: "https://www.check24.de/",
      subtitle: "Modern healthcare 24/7 - Telemedicine and mental health support included!",
      image_url: "companies/neodigital.svg"
    }
  }
];

// House Insurance Widgets (from house-insurance-service/db_init/init.sql)
const HOUSE_INSURANCE_WIDGETS = [
  {
    user_id: 123,
    widget_id: 'house_recommendation_header',
    component_type: 'SectionHeader',
    priority: 100,
    data: {
      title: "Our House Insurance Recommendations for You",
      subtitle: "Hide Recommendations",
      content: "Protect your home with comprehensive coverage options tailored to your property."
    }
  },
  {
    user_id: 123,
    widget_id: 'house_premium_card',
    component_type: 'Card',
    priority: 90,
    data: {
      title: "Premium Home Protection Plus",
      rating: { label: "very good", score: 1.1 },
      content: "All-Risk Coverage. Natural Disasters. Water Damage. Theft Protection. Electronics Coverage.",
      pricing: { price: 89.00, currency: "EUR", frequency: "monthly" },
      cta_link: "https://www.check24.de/",
      subtitle: "Our top-rated 'All-Risk' plan - Ultimate protection for your home and contents!",
      image_url: "companies/allianzdirect.svg"
    }
  },
  {
    user_id: 123,
    widget_id: 'house_comprehensive_card',
    component_type: 'Card',
    priority: 80,
    data: {
      title: "Comprehensive House Insurance",
      rating: { label: "very good", score: 1.4 },
      content: "Fire & Storm Coverage. Water Damage. Break-in Protection. Glass Damage. €500 Deductible.",
      pricing: { price: 65.50, currency: "EUR", frequency: "monthly" },
      cta_link: "https://www.check24.de/",
      subtitle: "Excellent coverage with a low €500 deductible - Maximize your protection!",
      image_url: "companies/bavariaprotect.svg"
    }
  },
  {
    user_id: 123,
    widget_id: 'house_basic_card',
    component_type: 'Card',
    priority: 70,
    data: {
      title: "Basic Home Coverage",
      rating: { label: "good", score: 1.7 },
      content: "Fire Coverage. Storm & Hail. Pipe Burst. Basic Theft. €1000 Deductible.",
      pricing: { price: 42.00, currency: "EUR", frequency: "monthly" },
      cta_link: "https://www.check24.de/",
      subtitle: "Essential protection for your property - Secure your home starting at €42!",
      image_url: "companies/cosmosdirekt.svg"
    }
  },
  {
    user_id: 123,
    widget_id: 'house_contents_card',
    component_type: 'Card',
    priority: 60,
    data: {
      title: "Contents Insurance Comfort",
      rating: { label: "good", score: 1.5 },
      content: "Furniture & Electronics. Personal Items. Theft & Burglary. Accidental Damage.",
      pricing: { price: 35.00, currency: "EUR", frequency: "monthly" },
      cta_link: "https://www.check24.de/",
      subtitle: "Protect your valuables from theft and accidental damage - Complete contents security!",
      image_url: "companies/concordia.svg"
    }
  },
  {
    user_id: 123,
    widget_id: 'house_liability_card',
    component_type: 'Card',
    priority: 50,
    data: {
      title: "Building Liability Insurance",
      rating: { label: "good", score: 1.6 },
      content: "Third-Party Damage. Property Owner Liability. Rental Property Coverage. Legal Protection.",
      pricing: { price: 28.50, currency: "EUR", frequency: "monthly" },
      cta_link: "https://www.check24.de/",
      subtitle: "Crucial protection for property owners - Includes legal defense!",
      image_url: "companies/devk.svg"
    }
  },
  {
    user_id: 123,
    widget_id: 'info_liability_addon',
    component_type: 'InfoBox',
    priority: 40,
    data: {
      title: "Add Personal Liability?",
      subtitle: null,
      content: "Personal liability insurance protects you from financial claims if you accidentally damage someone else's property or cause injury. Essential coverage for homeowners and renters.",
      footer: "View 25+ Liability Plans from €5/month"
    }
  },
  {
    user_id: 123,
    widget_id: 'house_smart_card',
    component_type: 'Card',
    priority: 30,
    data: {
      title: "Smart Home Insurance",
      rating: { label: "very good", score: 1.3 },
      content: "Smart Device Coverage. Cyber Protection. IoT Security. Remote Monitoring Discount.",
      pricing: { price: 75.00, currency: "EUR", frequency: "monthly" },
      cta_link: "https://www.check24.de/",
      subtitle: "Modern protection for your connected home - Includes cyber security!",
      image_url: "companies/neodigital.svg"
    }
  }
];

// Banking Widgets (from banking-service/db_init/init.sql)
const BANKING_WIDGETS = [
  {
    user_id: 123,
    widget_id: 'banking_recommendation_header',
    component_type: 'SectionHeader',
    priority: 100,
    data: {
      title: "Our Banking & Money Recommendations for You",
      subtitle: "Hide Recommendations",
      content: "Discover the best banking products, credit cards, and investment options tailored for you."
    }
  },
  {
    user_id: 123,
    widget_id: 'banking_premium_account',
    component_type: 'Card',
    priority: 90,
    data: {
      title: "Premium Current Account",
      rating: { label: "very good", score: 1.2 },
      content: "Free ATM Withdrawals Worldwide. No Account Fees. Premium Credit Card Included. Travel Insurance.",
      pricing: { price: 0.00, currency: "EUR", frequency: "monthly" },
      cta_link: "https://www.check24.de/",
      subtitle: "High-quality banking with exclusive travel benefits - €0.00 monthly",
      image_url: "companies/sparkasse.svg"
    }
  },
  {
    user_id: 123,
    widget_id: 'banking_savings_card',
    component_type: 'Card',
    priority: 80,
    data: {
      title: "High-Interest Savings Account",
      rating: { label: "very good", score: 1.4 },
      content: "Competitive Interest Rate. No Minimum Balance. Online Access. FDIC Insured.",
      pricing: { price: 2.50, currency: "APY", frequency: "yearly" },
      cta_link: "https://www.check24.de/",
      subtitle: "Grow your wealth faster with 2.5% APY - Secure and flexible!",
      image_url: "companies/allianzdirect.svg"
    }
  },
  {
    user_id: 123,
    widget_id: 'banking_credit_card',
    component_type: 'Card',
    priority: 70,
    data: {
      title: "Cashback Credit Card Gold",
      rating: { label: "good", score: 1.5 },
      content: "3% Cashback on Purchases. No Foreign Transaction Fees. Travel Benefits. Contactless Payment.",
      pricing: { price: 0.00, currency: "EUR", frequency: "annual fee" },
      cta_link: "https://www.check24.de/",
      subtitle: "Earn 3% cashback on everything - No annual fee!",
      image_url: "companies/bavariadirekt.svg"
    }
  },
  {
    user_id: 123,
    widget_id: 'banking_investment_card',
    component_type: 'Card',
    priority: 60,
    data: {
      title: "Robo-Advisor Investment",
      rating: { label: "very good", score: 1.3 },
      content: "Automated Portfolio Management. Diversified ETFs. Tax-Loss Harvesting. Low Minimum Investment.",
      pricing: { price: 0.25, currency: "%", frequency: "management fee" },
      cta_link: "https://www.check24.de/",
      subtitle: "Automated investing with low 0.25% fee - Start building your future!",
      image_url: "companies/cosmosdirekt.svg"
    }
  },
  {
    user_id: 123,
    widget_id: 'banking_loan_card',
    component_type: 'Card',
    priority: 50,
    data: {
      title: "Personal Loan Flex",
      rating: { label: "good", score: 1.6 },
      content: "Quick Approval. Flexible Repayment Terms. Up to €50,000. No Prepayment Penalty.",
      pricing: { price: 3.90, currency: "%", frequency: "APR" },
      cta_link: "https://www.check24.de/",
      subtitle: "Flexible personal loans starting from 3.9% APR - Quick and easy approval!",
      image_url: "companies/concordia.svg"
    }
  },
  {
    user_id: 123,
    widget_id: 'info_credit_comparison',
    component_type: 'InfoBox',
    priority: 40,
    data: {
      title: "Need a Credit Card?",
      subtitle: null,
      content: "Compare credit cards to find the best rewards, lowest fees, and most convenient features. From cashback to travel points, find the perfect card for your spending habits.",
      footer: "Compare 50+ Credit Cards"
    }
  },
  {
    user_id: 123,
    widget_id: 'banking_mortgage_card',
    component_type: 'Card',
    priority: 30,
    data: {
      title: "Home Mortgage Fixed Rate",
      rating: { label: "very good", score: 1.4 },
      content: "Competitive Fixed Rates. Flexible Terms. Fast Pre-Approval. Expert Advisors.",
      pricing: { price: 2.80, currency: "%", frequency: "fixed for 10 years" },
      cta_link: "https://www.check24.de/",
      subtitle: "Own your home with rates fixed from 2.8% - Get pre-approved today!",
      image_url: "companies/devk.svg"
    }
  },
  {
    user_id: 123,
    widget_id: 'banking_pension_card',
    component_type: 'Card',
    priority: 20,
    data: {
      title: "Private Pension Plan",
      rating: { label: "good", score: 1.5 },
      content: "Retirement Savings Plan. Government Subsidies. Flexible Contributions. Professional Management.",
      pricing: { price: null, currency: null, frequency: null },
      cta_link: "https://www.check24.de/",
      subtitle: "Secure your retirement with tax-advantaged savings - Expert management!",
      image_url: "companies/bavariaprotect.svg"
    }
  }
];

// ============================================================================
// CONTRACT STORAGE (Simulates database)
// ============================================================================

let userContracts = {
  car_insurance: null,
  health_insurance: null,
  house_insurance: null,
  banking: null
};

// ============================================================================
// MOCK API FUNCTIONS
// ============================================================================

/**
 * Mock /home endpoint
 * Returns all widgets grouped by service
 */
export function fetchHomeData() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        services: {
          car_insurance: {
            title: "Car Insurance",
            widgets: CAR_INSURANCE_WIDGETS
          },
          health_insurance: {
            title: "Health Insurance",
            widgets: HEALTH_INSURANCE_WIDGETS
          },
          house_insurance: {
            title: "House Insurance",
            widgets: HOUSE_INSURANCE_WIDGETS
          },
          banking: {
            title: "Banking & Money",
            widgets: BANKING_WIDGETS
          }
        }
      });
    }, 300); // Simulate network delay
  });
}

/**
 * Mock /user/{user_id}/contracts endpoint
 * Returns user's active contracts
 */
export function fetchUserContracts(userId = MOCK_USER_ID) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        has_contract: Object.values(userContracts).some(c => c !== null),
        contracts: userContracts
      });
    }, 200);
  });
}

/**
 * Mock POST /widget/{service}/contract
 * Creates a new contract
 */
export function createContract(serviceKey, widgetData, userId = MOCK_USER_ID) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!widgetData || !widgetData.widget_id) {
        reject(new Error('Invalid widget data'));
        return;
      }

      // Store the contract
      userContracts[serviceKey] = {
        widget_id: widgetData.widget_id,
        data: widgetData.data || widgetData
      };

      resolve({
        contract_id: `${serviceKey}_${widgetData.widget_id}_${Date.now()}`,
        widget_id: widgetData.widget_id,
        service: serviceKey,
        created_at: new Date().toISOString()
      });
    }, 400);
  });
}

/**
 * Mock DELETE /user/{user_id}/contract/{service}/{widget_id}
 * Deletes a contract
 */
export function deleteContract(userId, serviceKey, widgetId) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!userContracts[serviceKey]) {
        reject(new Error('Contract not found'));
        return;
      }

      userContracts[serviceKey] = null;

      resolve({
        success: true,
        message: `Contract ${widgetId} deleted`,
        service: serviceKey
      });
    }, 300);
  });
}

/**
 * Mock SSE connection
 * Returns an event emitter for cache invalidation events
 */
export function createMockSSE() {
  // Create a simple event emitter
  const listeners = [];
  
  const eventSource = {
    addEventListener: (event, callback) => {
      listeners.push({ event, callback });
    },
    close: () => {
      listeners.length = 0;
    },
    // Simulate sending events
    _emit: (eventType, data) => {
      listeners
        .filter(l => l.event === eventType || l.event === 'message')
        .forEach(l => {
          l.callback({ data: JSON.stringify(data) });
        });
    }
  };

  // Send initial connection message
  setTimeout(() => {
    eventSource._emit('message', {
      type: 'connected',
      message: 'Mock SSE connected'
    });
  }, 100);

  return eventSource;
}

/**
 * Trigger a cache invalidation event
 * Call this after creating/deleting contracts to simulate backend SSE
 */
export function triggerCacheInvalidation(reason, userId = MOCK_USER_ID) {
  // This will be called automatically by create/delete contract functions
  const event = new CustomEvent('mock-sse-event', {
    detail: {
      type: 'cache_invalidated',
      reason,
      user_id: userId,
      timestamp: new Date().toISOString()
    }
  });
  window.dispatchEvent(event);
}

// ============================================================================
// RESET FUNCTION (Useful for demos)
// ============================================================================

/**
 * Reset all contracts to empty state
 */
export function resetAllContracts() {
  userContracts = {
    car_insurance: null,
    health_insurance: null,
    house_insurance: null,
    banking: null
  };
  triggerCacheInvalidation('manual_reset');
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default {
  fetchHomeData,
  fetchUserContracts,
  createContract,
  deleteContract,
  createMockSSE,
  triggerCacheInvalidation,
  resetAllContracts
};