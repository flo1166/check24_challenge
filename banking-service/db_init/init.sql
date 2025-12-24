-- ============================================================================
-- BANKING SERVICE - Three-Table Database Initialization Script
-- ============================================================================
-- Simplified structure with only specified fields
-- ============================================================================

-- Drop existing tables to ensure clean run
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS widgets CASCADE;
DROP TABLE IF EXISTS components CASCADE;

-- ============================================================================
-- TABLE 1: components
-- ============================================================================
CREATE TABLE "public"."components" (
    "component_id" VARCHAR(100) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "component_type" VARCHAR(50) NOT NULL,
    "component_order" INTEGER DEFAULT 0,
    CONSTRAINT "components_pkey" PRIMARY KEY ("component_id", "user_id")
);

CREATE INDEX idx_components_user_order ON public.components USING btree (user_id, component_order);

-- ============================================================================
-- TABLE 2: widgets  
-- ============================================================================
CREATE TABLE "public"."widgets" (
    "user_id" INTEGER NOT NULL,
    "widget_id" VARCHAR(100) NOT NULL,
    "component_type" VARCHAR(50) NOT NULL,
    "priority" INTEGER DEFAULT 0,
    "data" JSONB NOT NULL,
    "component_id" VARCHAR(100) DEFAULT 'default_component',
    CONSTRAINT "widgets_pkey" PRIMARY KEY ("widget_id"),
    CONSTRAINT "widgets_unique_user_widget" UNIQUE ("user_id", "widget_id")
);

-- Foreign key to components table
ALTER TABLE "public"."widgets" 
ADD CONSTRAINT "fk_widget_component" 
FOREIGN KEY ("component_id", "user_id") 
REFERENCES "public"."components"("component_id", "user_id") 
ON DELETE CASCADE 
ON UPDATE CASCADE;

CREATE INDEX idx_widgets_user ON public.widgets USING btree (user_id);
CREATE INDEX idx_widgets_component ON public.widgets USING btree (component_id, user_id);
CREATE INDEX idx_widgets_priority ON public.widgets USING btree (component_id, user_id, priority DESC);

-- ============================================================================
-- TABLE 3: contracts
-- ============================================================================
DROP SEQUENCE IF EXISTS contracts_id_seq CASCADE;
CREATE SEQUENCE contracts_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1;

CREATE TABLE "public"."contracts" (
    "id" INTEGER DEFAULT nextval('contracts_id_seq') NOT NULL,
    "user_id" INTEGER NOT NULL,
    "widget_id" VARCHAR(100) NOT NULL,
    "type" VARCHAR(50),
    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "contracts_unique_user_widget" UNIQUE ("user_id", "widget_id")
);

-- Foreign key to widgets table
ALTER TABLE "public"."contracts" 
ADD CONSTRAINT "fk_contract_widget" 
FOREIGN KEY ("widget_id") 
REFERENCES "public"."widgets"("widget_id") 
ON DELETE CASCADE 
ON UPDATE CASCADE;

CREATE INDEX idx_contracts_user ON public.contracts USING btree (user_id);
CREATE INDEX idx_contracts_widget ON public.contracts USING btree (widget_id);

-- ============================================================================
-- INSERT COMPONENTS (User 123)
-- ============================================================================

INSERT INTO components (component_id, user_id, component_type, component_order) VALUES
('SectionHeader', 123, 'SectionHeader', 0),
('default_component', 123, 'Card', 2),
('infobox', 123, 'InfoBox', 1),
('ProductGrid', 123, 'ProductGrid', 3);

-- ============================================================================
-- INSERT WIDGETS - BANKING (User 123) 
-- All entries mapped to specific component_ids
-- ============================================================================

INSERT INTO widgets (user_id, widget_id, component_type, priority, data, component_id) VALUES
-- Section Header
(123, 'banking_recommendation_header', 'SectionHeader', 100, '{"title": "Our Banking & Money Recommendations for You", "subtitle": "Hide Recommendations", "content": "Discover the best banking products, credit cards, and investment options tailored for you."}', 'SectionHeader'),

-- Card: Premium Account
(123, 'banking_premium_account', 'Card', 90, '{"title": "Premium Current Account", "rating": {"label": "very good", "score": 1.2}, "content": "Free ATM Withdrawals Worldwide. No Account Fees. Premium Credit Card Included. Travel Insurance.", "pricing": {"price": 0.00, "currency": "EUR", "frequency": "monthly"}, "cta_link": "https://www.check24.de/", "subtitle": "High-quality banking with exclusive travel benefits", "image_url": "assets/images/companies/sparkasse.svg"}', 'default_component'),

-- Card: Savings
(123, 'banking_savings_card', 'Card', 80, '{"title": "High-Interest Savings Account", "rating": {"label": "very good", "score": 1.4}, "content": "Competitive Interest Rate. No Minimum Balance. Online Access. FDIC Insured.", "pricing": {"price": 2.50, "currency": "APY", "frequency": "yearly"}, "cta_link": "https://www.check24.de/", "subtitle": "Grow your wealth faster with 2.5% APY", "image_url": "assets/images/companies/allianzdirect.svg"}', 'default_component'),

-- Info Box
(123, 'info_credit_comparison', 'InfoBox', 70, '{"title": "Need a Credit Card?", "subtitle": null, "content": "Compare credit cards to find the best rewards, lowest fees, and most convenient features.", "footer": "Compare 50+ Credit Cards"}', 'infobox'),

-- Card: Robo-Advisor
(123, 'banking_investment_card', 'Card', 60, '{"title": "Robo-Advisor Investment", "rating": {"label": "very good", "score": 1.3}, "content": "Automated Portfolio Management. Diversified ETFs. Low Minimum Investment.", "pricing": {"price": 0.25, "currency": "%", "frequency": "management fee"}, "cta_link": "https://www.check24.de/", "subtitle": "Automated investing with low 0.25% fee", "image_url": "assets/images/companies/cosmosdirekt.svg"}', 'default_component'),

-- Card: Home Mortgage
(123, 'banking_mortgage_card', 'Card', 50, '{"title": "Home Mortgage Fixed Rate", "rating": {"label": "very good", "score": 1.4}, "content": "Competitive Fixed Rates. Flexible Terms. Fast Pre-Approval.", "pricing": {"price": 2.80, "currency": "%", "frequency": "fixed for 10 years"}, "cta_link": "https://www.check24.de/", "subtitle": "Get pre-approved for your dream home today", "image_url": "assets/images/companies/devk.svg"}', 'default_component'),

-- Product Grid: Investment Deals
(123, 'investment-deals-grid', 'ProductGrid', 0, '{"id": "investment-deals-grid", "type": "ProductGrid", "title": "Top Investment & Savings Deals", "data": {"products": [
    {"title": "Global Equity ETF Plan", "rating": 4.8, "content": "Broad market exposure with low expense ratio. Perfect for long-term wealth building.", "pricing": {"price": 25.00, "currency": "EUR", "frequency": "min. monthly"}, "subtitle": "Sustainable growth focus", "image_url": "assets/images/banking/etf-global.png"},
    {"title": "Fixed-Term Deposit (2 Yrs)", "rating": 4.5, "content": "Guaranteed 3.2% interest rate for a 2-year term. Capital protected up to 100k.", "pricing": {"price": 3.20, "currency": "%", "frequency": "p.a."}, "subtitle": "Safe and predictable returns", "image_url": "assets/images/banking/fixed-term.png"},
    {"title": "Digital Gold Savings", "rating": 4.2, "content": "Invest in physical gold with digital ease. No storage fees for the first year.", "pricing": {"price": 10.00, "currency": "EUR", "frequency": "starting price"}, "subtitle": "Hedge against inflation", "image_url": "assets/images/banking/gold-bar.png"},
    {"title": "Tech Growth Fund", "rating": 4.1, "content": "High-growth potential focusing on AI and Cloud Computing. Managed by experts.", "pricing": {"price": 50.00, "currency": "EUR", "frequency": "min. monthly"}, "subtitle": "High risk, high reward", "image_url": "assets/images/banking/tech-fund.png"}
]}}', 'ProductGrid');