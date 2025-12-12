-- Drop tables if they exist
DROP TABLE IF EXISTS contracts;
DROP TABLE IF EXISTS widgets;

-- Create widgets table
CREATE TABLE widgets (
    user_id INTEGER NOT NULL,
    widget_id VARCHAR(100) PRIMARY KEY,
    component_type VARCHAR(50) NOT NULL,
    priority INTEGER DEFAULT 0,
    data JSONB NOT NULL,
    UNIQUE (user_id, widget_id)
);

-- Create contracts table
CREATE TABLE contracts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    widget_id VARCHAR(100) NOT NULL,
    type VARCHAR(50) DEFAULT 'banking',
    
    CONSTRAINT fk_widget
        FOREIGN KEY (widget_id)
        REFERENCES widgets (widget_id)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION
);

-- Insert banking widgets
INSERT INTO widgets (user_id, widget_id, component_type, priority, data) VALUES
(123, 'banking_recommendation_header', 'SectionHeader', 100, $${
  "title": "Banking & Money Recommendations",
  "subtitle": "Hide Recommendations",
  "description": "Discover the best banking products, credit cards, and investment options tailored for you."
}$$),
(123, 'banking_premium_account', 'Card', 90, $${
  "title": "Premium Current Account",
  "subtitle": "€0.00 monthly (Rating: 1.2 very good)",
  "content": "Free ATM Withdrawals Worldwide. No Account Fees. Premium Credit Card Included. Travel Insurance.",
  "image_url": "assets/images/companies/sparkasse.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'banking_savings_card', 'Card', 80, $${
  "title": "High-Interest Savings Account",
  "subtitle": "2.5% APY (Rating: 1.4 very good)",
  "content": "Competitive Interest Rate. No Minimum Balance. Online Access. FDIC Insured.",
  "image_url": "assets/images/companies/allianzdirect.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'banking_credit_card', 'Card', 70, $${
  "title": "Cashback Credit Card Gold",
  "subtitle": "€0 annual fee (Rating: 1.5 good)",
  "content": "3% Cashback on Purchases. No Foreign Transaction Fees. Travel Benefits. Contactless Payment.",
  "image_url": "assets/images/companies/bavariadirekt.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'banking_investment_card', 'Card', 60, $${
  "title": "Robo-Advisor Investment",
  "subtitle": "0.25% management fee (Rating: 1.3 very good)",
  "content": "Automated Portfolio Management. Diversified ETFs. Tax-Loss Harvesting. Low Minimum Investment.",
  "image_url": "assets/images/companies/cosmosdirekt.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'banking_loan_card', 'Card', 50, $${
  "title": "Personal Loan Flex",
  "subtitle": "from 3.9% APR (Rating: 1.6 good)",
  "content": "Quick Approval. Flexible Repayment Terms. Up to €50,000. No Prepayment Penalty.",
  "image_url": "assets/images/companies/concordia.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'info_credit_comparison', 'InfoBox', 40, $${
  "title": "Need a Credit Card?",
  "subtitle": null,
  "content": "Compare credit cards to find the best rewards, lowest fees, and most convenient features. From cashback to travel points, find the perfect card for your spending habits.",
  "footer": "Compare 50+ Credit Cards"
}$$),
(123, 'banking_mortgage_card', 'Card', 30, $${
  "title": "Home Mortgage Fixed Rate",
  "subtitle": "from 2.8% fixed for 10 years (Rating: 1.4 very good)",
  "content": "Competitive Fixed Rates. Flexible Terms. Fast Pre-Approval. Expert Advisors.",
  "image_url": "assets/images/companies/devk.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'banking_pension_card', 'Card', 20, $${
  "title": "Private Pension Plan",
  "subtitle": "Tax-advantaged savings (Rating: 1.5 good)",
  "content": "Retirement Savings Plan. Government Subsidies. Flexible Contributions. Professional Management.",
  "image_url": "assets/images/companies/bavariaprotect.svg",
  "cta_link": "https://www.check24.de/"
}$$);