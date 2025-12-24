-- ============================================================================
-- HEALTH INSURANCE SERVICE - Three-Table Database Initialization Script
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
    "type" VARCHAR(50) DEFAULT 'health_insurance',
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
('default_component', 123, 'Card', 1),
('infobox', 123, 'InfoBox', 2),
('ProductGrid', 123, 'ProductGrid', 3);

-- ============================================================================
-- INSERT WIDGETS - HEALTH INSURANCE (User 123) 
-- All entries mapped to specific component_ids
-- ============================================================================

INSERT INTO widgets (user_id, widget_id, component_type, priority, data, component_id) VALUES
-- Section Header
(123, 'health_recommendation_header', 'SectionHeader', 100, '{"title": "Our Health Insurance Recommendations for You", "subtitle": "Hide Recommendations", "content": "Compare the best health insurance plans tailored to your needs and budget."}', 'SectionHeader'),

-- Card: Premium Health Plus
(123, 'health_premium_card', 'Card', 90, '{"title": "Premium Health Plus", "rating": {"label": "very good", "score": 1.2}, "content": "Comprehensive Coverage. Private Hospital Treatment. Dental Included. No Deductible.", "pricing": {"price": 289.00, "currency": "EUR", "frequency": "monthly"}, "cta_link": "https://www.check24.de/", "subtitle": "Top-rated comprehensive coverage - Private treatment included!", "image_url": "assets/images/companies/allianzdirect.svg"}', 'default_component'),

-- Card: Standard Coverage
(123, 'health_standard_card', 'Card', 80, '{"title": "Standard Health Coverage", "rating": {"label": "good", "score": 1.5}, "content": "Basic Medical Coverage. Prescription Drugs. Specialist Visits. €500 Annual Deductible.", "pricing": {"price": 195.50, "currency": "EUR", "frequency": "monthly"}, "cta_link": "https://www.check24.de/", "subtitle": "Reliable medical coverage for daily needs", "image_url": "assets/images/companies/bavariaprotect.svg"}', 'default_component'),

-- Card: Budget Basic
(123, 'health_budget_card', 'Card', 70, '{"title": "Budget Health Basic", "rating": {"label": "good", "score": 1.8}, "content": "Essential Medical Services. Generic Medications. €1000 Deductible.", "pricing": {"price": 145.00, "currency": "EUR", "frequency": "monthly"}, "cta_link": "https://www.check24.de/", "subtitle": "Essential services at the lowest price", "image_url": "assets/images/companies/cosmosdirekt.svg"}', 'default_component'),

-- Info Box: Dental Add-on
(123, 'info_dental_addon', 'InfoBox', 60, '{"title": "Add Dental Coverage?", "subtitle": null, "content": "Dental insurance covers routine check-ups, cleanings, and major procedures. Supplement your health plan for complete protection.", "footer": "View 15+ Dental Plans from €19/month"}', 'default_component'),

-- Card: Family Package
(123, 'health_family_card', 'Card', 50, '{"title": "Family Health Package", "rating": {"label": "very good", "score": 1.3}, "content": "Coverage for 4 Family Members. Pediatric Care. Maternity Benefits. Preventive Check-ups.", "pricing": {"price": 425.00, "currency": "EUR", "frequency": "monthly"}, "cta_link": "https://www.check24.de/", "subtitle": "Complete coverage for the whole family", "image_url": "assets/images/companies/concordia.svg"}', 'default_component'),

-- Card: Digital Health 24/7
(123, 'health_digital_card', 'Card', 40, '{"title": "Digital Health 24/7", "rating": {"label": "good", "score": 1.6}, "content": "Telemedicine Consultations. Online Prescriptions. Mental Health Support.", "pricing": {"price": 99.00, "currency": "EUR", "frequency": "monthly"}, "cta_link": "https://www.check24.de/", "subtitle": "Modern healthcare 24/7 via Telemedicine", "image_url": "assets/images/companies/neodigital.svg"}', 'default_component'),

-- Product Grid: Health & Wellness Services
(123, 'health-services-grid', 'ProductGrid', 0, '{"id": "health-services-grid", "type": "ProductGrid", "title": "Top Wellness & Preventive Deals", "data": {"products": [
    {"title": "Professional Teeth Cleaning", "rating": 4.6, "content": "Twice-yearly intensive cleaning and fluoride treatment. Highly recommended for oral health.", "pricing": {"price": 85.00, "currency": "EUR", "frequency": "per session"}, "subtitle": "Partner Network Exclusive", "image_url": "assets/images/health/dental-clean.png"},
    {"title": "Fitness Club Membership", "rating": 4.4, "content": "Premium access to all partner fitness studios nationwide. Includes yoga and swimming.", "pricing": {"price": 45.00, "currency": "EUR", "frequency": "monthly"}, "subtitle": "Stay Active", "image_url": "assets/images/health/gym.png"}
]}}', 'default_component');