-- Drop tables to ensure a clean run
DROP TABLE IF EXISTS contracts;
DROP TABLE IF EXISTS widgets;

--- 1. CREATE THE WIDGETS TABLE (Structure UNCHANGED)
CREATE TABLE widgets (
    user_id INTEGER NOT NULL,
    widget_id VARCHAR(100) PRIMARY KEY,
    component_type VARCHAR(50) NOT NULL,
    priority INTEGER DEFAULT 0,
    data JSONB NOT NULL, -- Stores the dynamic data dictionary with the new structure
    UNIQUE (user_id, widget_id)
);

--- 2. CREATE THE CONTRACTS TABLE (Structure UNCHANGED)
CREATE TABLE contracts (
    id SERIAL PRIMARY KEY, -- Auto-incrementing primary key
    user_id INTEGER NOT NULL,
    widget_id VARCHAR(100) NOT NULL,
    type VARCHAR(50) DEFAULT 'banking', -- Default type changed to 'banking' for relevance
    
    -- Define the Foreign Key relationship linking to the widgets table
    CONSTRAINT fk_widget
        FOREIGN KEY (widget_id)
        REFERENCES widgets (widget_id)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION
);

-- 3. Insert all banking entries with the new, restructured JSON format (like the car insurance example)
INSERT INTO "widgets" ("user_id", "widget_id", "component_type", "priority", "data") VALUES
-- Section Header (Simplified JSON)
(123, 'banking_recommendation_header', 'SectionHeader', 100, $${
    "title": "Our Banking & Money Recommendations for You",
    "subtitle": "Hide Recommendations",
    "content": "Discover the best banking products, credit cards, and investment options tailored for you."
}$$),

-- Premium Current Account (Card component with Rating and Pricing)
(123, 'banking_premium_account', 'Card', 90, $${
    "title": "Premium Current Account",
    "rating": {"label": "very good", "score": 1.2},
    "content": "Free ATM Withdrawals Worldwide. No Account Fees. Premium Credit Card Included. Travel Insurance.",
    "pricing": {"price": 0.00, "currency": "EUR", "frequency": "monthly"},
    "cta_link": "https://www.check24.de/",
    "subtitle": "High-quality banking with exclusive travel benefits - €0.00 monthly",
    "image_url": "assets/images/companies/sparkasse.svg"
}$$),

-- High-Interest Savings Account (Card component with Rating and Pricing/APY)
(123, 'banking_savings_card', 'Card', 80, $${
    "title": "High-Interest Savings Account",
    "rating": {"label": "very good", "score": 1.4},
    "content": "Competitive Interest Rate. No Minimum Balance. Online Access. FDIC Insured.",
    "pricing": {"price": 2.50, "currency": "APY", "frequency": "yearly"},
    "cta_link": "https://www.check24.de/",
    "subtitle": "Grow your wealth faster with 2.5% APY - Secure and flexible!",
    "image_url": "assets/images/companies/allianzdirect.svg"
}$$),

-- Cashback Credit Card (Card component with Rating and Pricing/Annual Fee)
(123, 'banking_credit_card', 'Card', 70, $${
    "title": "Cashback Credit Card Gold",
    "rating": {"label": "good", "score": 1.5},
    "content": "3% Cashback on Purchases. No Foreign Transaction Fees. Travel Benefits. Contactless Payment.",
    "pricing": {"price": 0.00, "currency": "EUR", "frequency": "annual fee"},
    "cta_link": "https://www.check24.de/",
    "subtitle": "Earn 3% cashback on everything - No annual fee!",
    "image_url": "assets/images/companies/bavariadirekt.svg"
}$$),

-- Robo-Advisor Investment (Card component with Rating and Pricing/Management Fee)
(123, 'banking_investment_card', 'Card', 60, $${
    "title": "Robo-Advisor Investment",
    "rating": {"label": "very good", "score": 1.3},
    "content": "Automated Portfolio Management. Diversified ETFs. Tax-Loss Harvesting. Low Minimum Investment.",
    "pricing": {"price": 0.25, "currency": "%", "frequency": "management fee"},
    "cta_link": "https://www.check24.de/",
    "subtitle": "Automated investing with low 0.25% fee - Start building your future!",
    "image_url": "assets/images/companies/cosmosdirekt.svg"
}$$),

-- Personal Loan Flex (Card component with Rating and Pricing/APR)
(123, 'banking_loan_card', 'Card', 50, $${
    "title": "Personal Loan Flex",
    "rating": {"label": "good", "score": 1.6},
    "content": "Quick Approval. Flexible Repayment Terms. Up to €50,000. No Prepayment Penalty.",
    "pricing": {"price": 3.90, "currency": "%", "frequency": "APR"},
    "cta_link": "https://www.check24.de/",
    "subtitle": "Flexible personal loans starting from 3.9% APR - Quick and easy approval!",
    "image_url": "assets/images/companies/concordia.svg"
}$$),

-- Info Box (InfoBox component, adapted from your car insurance example)
(123, 'info_credit_comparison', 'InfoBox', 40, $${
    "title": "Need a Credit Card?",
    "subtitle": null,
    "content": "Compare credit cards to find the best rewards, lowest fees, and most convenient features. From cashback to travel points, find the perfect card for your spending habits.",
    "footer": "Compare 50+ Credit Cards"
}$$),

-- Home Mortgage Fixed Rate (Card component with Rating and Pricing/Fixed Rate)
(123, 'banking_mortgage_card', 'Card', 30, $${
    "title": "Home Mortgage Fixed Rate",
    "rating": {"label": "very good", "score": 1.4},
    "content": "Competitive Fixed Rates. Flexible Terms. Fast Pre-Approval. Expert Advisors.",
    "pricing": {"price": 2.80, "currency": "%", "frequency": "fixed for 10 years"},
    "cta_link": "https://www.check24.de/",
    "subtitle": "Own your home with rates fixed from 2.8% - Get pre-approved today!",
    "image_url": "assets/images/companies/devk.svg"
}$$),

-- Private Pension Plan (Card component with Rating)
(123, 'banking_pension_card', 'Card', 20, $${
    "title": "Private Pension Plan",
    "rating": {"label": "good", "score": 1.5},
    "content": "Retirement Savings Plan. Government Subsidies. Flexible Contributions. Professional Management.",
    "pricing": {"price": null, "currency": null, "frequency": null},
    "cta_link": "https://www.check24.de/",
    "subtitle": "Secure your retirement with tax-advantaged savings - Expert management!",
    "image_url": "assets/images/companies/bavariaprotect.svg"
}$$);