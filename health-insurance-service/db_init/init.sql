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
    type VARCHAR(50) DEFAULT 'health_insurance', -- Default type set to 'health_insurance'
    
    -- Define the Foreign Key relationship linking to the widgets table
    CONSTRAINT fk_widget
        FOREIGN KEY (widget_id)
        REFERENCES widgets (widget_id)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION
);

-- 3. Insert all health insurance entries with the new, restructured JSON format
INSERT INTO "widgets" ("user_id", "widget_id", "component_type", "priority", "data") VALUES
-- Section Header (Simplified JSON)
(123, 'health_recommendation_header', 'SectionHeader', 100, $${
    "title": "Our Health Insurance Recommendations for You",
    "subtitle": "Hide Recommendations",
    "content": "Compare the best health insurance plans tailored to your needs and budget."
}$$),

-- Premium Health Plus (Card component with Rating and Pricing)
(123, 'health_premium_card', 'Card', 90, $${
    "title": "Premium Health Plus",
    "rating": {"label": "very good", "score": 1.2},
    "content": "Comprehensive Coverage. Private Hospital Treatment. Dental Included. No Deductible.",
    "pricing": {"price": 289.00, "currency": "EUR", "frequency": "monthly"},
    "cta_link": "https://www.check24.de/",
    "subtitle": "Top-rated comprehensive coverage - Private treatment and dental included!",
    "image_url": "assets/images/companies/allianzdirect.svg"
}$$),

-- Standard Health Coverage (Card component with Rating and Pricing)
(123, 'health_standard_card', 'Card', 80, $${
    "title": "Standard Health Coverage",
    "rating": {"label": "good", "score": 1.5},
    "content": "Basic Medical Coverage. Prescription Drugs. Specialist Visits. €500 Annual Deductible.",
    "pricing": {"price": 195.50, "currency": "EUR", "frequency": "monthly"},
    "cta_link": "https://www.check24.de/",
    "subtitle": "Reliable medical coverage for daily needs - Budget-friendly deductible!",
    "image_url": "assets/images/companies/bavariaprotect.svg"
}$$),

-- Budget Health Basic (Card component with Rating and Pricing)
(123, 'health_budget_card', 'Card', 70, $${
    "title": "Budget Health Basic",
    "rating": {"label": "good", "score": 1.8},
    "content": "Essential Medical Services. Generic Medications. Limited Specialist Access. €1000 Deductible.",
    "pricing": {"price": 145.00, "currency": "EUR", "frequency": "monthly"},
    "cta_link": "https://www.check24.de/",
    "subtitle": "Essential services at the lowest price - Great value basic plan!",
    "image_url": "assets/images/companies/cosmosdirekt.svg"
}$$),

-- Family Health Package (Card component with Rating and Pricing)
(123, 'health_family_card', 'Card', 60, $${
    "title": "Family Health Package",
    "rating": {"label": "very good", "score": 1.3},
    "content": "Coverage for 4 Family Members. Pediatric Care. Maternity Benefits. Preventive Check-ups.",
    "pricing": {"price": 425.00, "currency": "EUR", "frequency": "monthly"},
    "cta_link": "https://www.check24.de/",
    "subtitle": "Complete coverage for the whole family - Includes maternity and pediatric care!",
    "image_url": "assets/images/companies/concordia.svg"
}$$),

-- Senior Care Plus (Card component with Rating and Pricing)
(123, 'health_senior_card', 'Card', 50, $${
    "title": "Senior Care Plus",
    "rating": {"label": "very good", "score": 1.4},
    "content": "Age 60+ Specialized. Chronic Disease Management. Home Care Services. Priority Appointments.",
    "pricing": {"price": 345.00, "currency": "EUR", "frequency": "monthly"},
    "cta_link": "https://www.check24.de/",
    "subtitle": "Specialized care for ages 60+ - Priority access and home care support!",
    "image_url": "assets/images/companies/devk.svg"
}$$),

-- Info Box (InfoBox component, adapted from your car insurance example)
(123, 'info_dental_addon', 'InfoBox', 40, $${
    "title": "Add Dental Coverage?",
    "subtitle": null,
    "content": "Dental insurance covers routine check-ups, cleanings, fillings, and major procedures like crowns and implants. Supplement your health plan for complete oral health protection.",
    "footer": "View 15+ Dental Plans from €19/month"
}$$),

-- Digital Health 24/7 (Card component with Rating and Pricing)
(123, 'health_digital_card', 'Card', 30, $${
    "title": "Digital Health 24/7",
    "rating": {"label": "good", "score": 1.6},
    "content": "Telemedicine Consultations. Online Prescriptions. Mental Health Support. Fitness App Integration.",
    "pricing": {"price": 99.00, "currency": "EUR", "frequency": "monthly"},
    "cta_link": "https://www.check24.de/",
    "subtitle": "Modern healthcare 24/7 - Telemedicine and mental health support included!",
    "image_url": "assets/images/companies/neodigital.svg"
}$$);