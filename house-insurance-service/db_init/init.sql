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
    type VARCHAR(50) DEFAULT 'house_insurance', -- Default type set to 'house_insurance'
    
    -- Define the Foreign Key relationship linking to the widgets table
    CONSTRAINT fk_widget
        FOREIGN KEY (widget_id)
        REFERENCES widgets (widget_id)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION
);

-- 3. Insert all house insurance entries with the new, restructured JSON format
INSERT INTO "widgets" ("user_id", "widget_id", "component_type", "priority", "data") VALUES
-- Section Header (Simplified JSON)
(123, 'house_recommendation_header', 'SectionHeader', 100, $${
    "title": "Our House Insurance Recommendations for You",
    "subtitle": "Hide Recommendations",
    "content": "Protect your home with comprehensive coverage options tailored to your property."
}$$),

-- Premium Home Protection Plus (Card component with Rating and Pricing)
(123, 'house_premium_card', 'Card', 90, $${
    "title": "Premium Home Protection Plus",
    "rating": {"label": "very good", "score": 1.1},
    "content": "All-Risk Coverage. Natural Disasters. Water Damage. Theft Protection. Electronics Coverage.",
    "pricing": {"price": 89.00, "currency": "EUR", "frequency": "monthly"},
    "cta_link": "https://www.check24.de/",
    "subtitle": "Our top-rated 'All-Risk' plan - Ultimate protection for your home and contents!",
    "image_url": "assets/images/companies/allianzdirect.svg"
}$$),

-- Comprehensive House Insurance (Card component with Rating and Pricing)
(123, 'house_comprehensive_card', 'Card', 80, $${
    "title": "Comprehensive House Insurance",
    "rating": {"label": "very good", "score": 1.4},
    "content": "Fire & Storm Coverage. Water Damage. Break-in Protection. Glass Damage. €500 Deductible.",
    "pricing": {"price": 65.50, "currency": "EUR", "frequency": "monthly"},
    "cta_link": "https://www.check24.de/",
    "subtitle": "Excellent coverage with a low €500 deductible - Maximize your protection!",
    "image_url": "assets/images/companies/bavariaprotect.svg"
}$$),

-- Basic Home Coverage (Card component with Rating and Pricing)
(123, 'house_basic_card', 'Card', 70, $${
    "title": "Basic Home Coverage",
    "rating": {"label": "good", "score": 1.7},
    "content": "Fire Coverage. Storm & Hail. Pipe Burst. Basic Theft. €1000 Deductible.",
    "pricing": {"price": 42.00, "currency": "EUR", "frequency": "monthly"},
    "cta_link": "https://www.check24.de/",
    "subtitle": "Essential protection for your property - Secure your home starting at €42!",
    "image_url": "assets/images/companies/cosmosdirekt.svg"
}$$),

-- Contents Insurance Comfort (Card component with Rating and Pricing)
(123, 'house_contents_card', 'Card', 60, $${
    "title": "Contents Insurance Comfort",
    "rating": {"label": "good", "score": 1.5},
    "content": "Furniture & Electronics. Personal Items. Theft & Burglary. Accidental Damage.",
    "pricing": {"price": 35.00, "currency": "EUR", "frequency": "monthly"},
    "cta_link": "https://www.check24.de/",
    "subtitle": "Protect your valuables from theft and accidental damage - Complete contents security!",
    "image_url": "assets/images/companies/concordia.svg"
}$$),

-- Building Liability Insurance (Card component with Rating and Pricing)
(123, 'house_liability_card', 'Card', 50, $${
    "title": "Building Liability Insurance",
    "rating": {"label": "good", "score": 1.6},
    "content": "Third-Party Damage. Property Owner Liability. Rental Property Coverage. Legal Protection.",
    "pricing": {"price": 28.50, "currency": "EUR", "frequency": "monthly"},
    "cta_link": "https://www.check24.de/",
    "subtitle": "Crucial protection for property owners - Includes legal defense!",
    "image_url": "assets/images/companies/devk.svg"
}$$),

-- Info Box (InfoBox component)
(123, 'info_liability_addon', 'InfoBox', 40, $${
    "title": "Add Personal Liability?",
    "subtitle": null,
    "content": "Personal liability insurance protects you from financial claims if you accidentally damage someone else's property or cause injury. Essential coverage for homeowners and renters.",
    "footer": "View 25+ Liability Plans from €5/month"
}$$),

-- Smart Home Insurance (Card component with Rating and Pricing)
(123, 'house_smart_card', 'Card', 30, $${
    "title": "Smart Home Insurance",
    "rating": {"label": "very good", "score": 1.3},
    "content": "Smart Device Coverage. Cyber Protection. IoT Security. Remote Monitoring Discount.",
    "pricing": {"price": 75.00, "currency": "EUR", "frequency": "monthly"},
    "cta_link": "https://www.check24.de/",
    "subtitle": "Modern protection for your connected home - Includes cyber security!",
    "image_url": "assets/images/companies/neodigital.svg"
}$$);