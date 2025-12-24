-- ============================================================================
-- HOUSE INSURANCE SERVICE - Three-Table Database Initialization Script
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
    "type" VARCHAR(50) DEFAULT 'house_insurance',
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
('default_component', 123, 'Card', 3),
('infobox', 123, 'InfoBox', 2),
('ProductGrid', 123, 'ProductGrid', 1);

-- ============================================================================
-- INSERT WIDGETS - HOUSE INSURANCE (User 123) 
-- ============================================================================

INSERT INTO widgets (user_id, widget_id, component_type, priority, data, component_id) VALUES
-- Section Header
(123, 'house_recommendation_header', 'SectionHeader', 100, '{"title": "Our House Insurance Recommendations for You", "subtitle": "Hide Recommendations", "content": "Protect your home with comprehensive coverage options tailored to your property."}', 'SectionHeader'),

-- Card: Premium Home Plus
(123, 'house_premium_card', 'Card', 90, '{"title": "Premium Home Protection Plus", "rating": {"label": "very good", "score": 1.1}, "content": "All-Risk Coverage. Natural Disasters. Water Damage. Theft Protection. Electronics Coverage.", "pricing": {"price": 89.00, "currency": "EUR", "frequency": "monthly"}, "cta_link": "https://www.check24.de/", "subtitle": "Our top-rated plan with ultimate protection", "image_url": "assets/images/companies/allianzdirect.svg"}', 'default_component'),

-- Card: Comprehensive Coverage
(123, 'house_comprehensive_card', 'Card', 80, '{"title": "Comprehensive House Insurance", "rating": {"label": "very good", "score": 1.4}, "content": "Fire & Storm Coverage. Water Damage. Break-in Protection. €500 Deductible.", "pricing": {"price": 65.50, "currency": "EUR", "frequency": "monthly"}, "cta_link": "https://www.check24.de/", "subtitle": "Excellent coverage with a low deductible", "image_url": "assets/images/companies/bavariaprotect.svg"}', 'default_component'),

-- Card: Basic Coverage
(123, 'house_basic_card', 'Card', 70, '{"title": "Basic Home Coverage", "rating": {"label": "good", "score": 1.7}, "content": "Fire Coverage. Storm & Hail. Pipe Burst. €1000 Deductible.", "pricing": {"price": 42.00, "currency": "EUR", "frequency": "monthly"}, "cta_link": "https://www.check24.de/", "subtitle": "Essential protection starting at €42", "image_url": "assets/images/companies/cosmosdirekt.svg"}', 'default_component'),

-- Info Box: Liability Add-on
(123, 'info_liability_addon', 'InfoBox', 60, '{"title": "Add Personal Liability?", "subtitle": null, "content": "Personal liability insurance protects you from financial claims if you accidentally damage someone else property.", "footer": "View 25+ Liability Plans from €5/month"}', 'infobox'),

-- Card: Contents Insurance
(123, 'house_contents_card', 'Card', 50, '{"title": "Contents Insurance Comfort", "rating": {"label": "good", "score": 1.5}, "content": "Furniture & Electronics. Personal Items. Theft & Burglary.", "pricing": {"price": 35.00, "currency": "EUR", "frequency": "monthly"}, "cta_link": "https://www.check24.de/", "subtitle": "Protect your valuables from theft", "image_url": "assets/images/companies/concordia.svg"}', 'default_component'),

-- Card: Building Liability
(123, 'house_liability_card', 'Card', 40, '{"title": "Building Liability Insurance", "rating": {"label": "good", "score": 1.6}, "content": "Third-Party Damage. Property Owner Liability. Legal Protection.", "pricing": {"price": 28.50, "currency": "EUR", "frequency": "monthly"}, "cta_link": "https://www.check24.de/", "subtitle": "Crucial protection for property owners", "image_url": "assets/images/companies/devk.svg"}', 'default_component'),

-- Product Grid: Home Services & Security
(123, 'home-services-grid', 'ProductGrid', 0, '{"id": "home-services-grid", "type": "ProductGrid", "title": "Top Home Security & Service Deals", "data": {"products": [
    {"title": "Smart Alarm System", "rating": 4.8, "content": "Full sensor set with mobile app integration and 24/7 monitoring option. Reduced insurance premium eligibility.", "pricing": {"price": 299.00, "currency": "EUR", "frequency": "one-time"}, "subtitle": "IoT Security Certified", "image_url": "assets/images/house/alarm.png"},
    {"title": "Emergency Locksmith Service", "rating": 4.5, "content": "24/7 priority access for lockouts. No call-out fee for insurance members.", "pricing": {"price": 0.00, "currency": "EUR", "frequency": "emergency cover"}, "subtitle": "Peace of Mind", "image_url": "assets/images/house/key.png"},
    {"title": "Water Leak Sensor Pro", "rating": 4.7, "content": "Detects moisture and automatically shuts off main valve. Prevents major water damage.", "pricing": {"price": 120.00, "currency": "EUR", "frequency": "unit price"}, "subtitle": "Damage Prevention", "image_url": "assets/images/house/water-sensor.png"},
    {"title": "Solar Maintenance Check", "rating": 4.3, "content": "Professional cleaning and efficiency check for rooftop solar panels.", "pricing": {"price": 150.00, "currency": "EUR", "frequency": "annual check"}, "subtitle": "Energy Efficiency", "image_url": "assets/images/house/solar.png"}
]}}', 'ProductGrid');