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
    type VARCHAR(50) DEFAULT 'house_insurance',
    
    CONSTRAINT fk_widget
        FOREIGN KEY (widget_id)
        REFERENCES widgets (widget_id)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION
);

-- Insert house insurance widgets
INSERT INTO widgets (user_id, widget_id, component_type, priority, data) VALUES
(123, 'house_recommendation_header', 'SectionHeader', 100, $${
  "title": "House Insurance Recommendations",
  "subtitle": "Hide Recommendations",
  "description": "Protect your home with comprehensive coverage options tailored to your property."
}$$),
(123, 'house_premium_card', 'Card', 90, $${
  "title": "Premium Home Protection Plus",
  "subtitle": "€89.00 monthly (Rating: 1.1 very good)",
  "content": "All-Risk Coverage. Natural Disasters. Water Damage. Theft Protection. Electronics Coverage.",
  "image_url": "assets/images/companies/allianzdirect.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'house_comprehensive_card', 'Card', 80, $${
  "title": "Comprehensive House Insurance",
  "subtitle": "€65.50 monthly (Rating: 1.4 very good)",
  "content": "Fire & Storm Coverage. Water Damage. Break-in Protection. Glass Damage. €500 Deductible.",
  "image_url": "assets/images/companies/bavariaprotect.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'house_basic_card', 'Card', 70, $${
  "title": "Basic Home Coverage",
  "subtitle": "€42.00 monthly (Rating: 1.7 good)",
  "content": "Fire Coverage. Storm & Hail. Pipe Burst. Basic Theft. €1000 Deductible.",
  "image_url": "assets/images/companies/cosmosdirekt.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'house_contents_card', 'Card', 60, $${
  "title": "Contents Insurance Comfort",
  "subtitle": "€35.00 monthly (Rating: 1.5 good)",
  "content": "Furniture & Electronics. Personal Items. Theft & Burglary. Accidental Damage.",
  "image_url": "assets/images/companies/concordia.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'house_liability_card', 'Card', 50, $${
  "title": "Building Liability Insurance",
  "subtitle": "€28.50 monthly (Rating: 1.6 good)",
  "content": "Third-Party Damage. Property Owner Liability. Rental Property Coverage. Legal Protection.",
  "image_url": "assets/images/companies/devk.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'info_liability_addon', 'InfoBox', 40, $${
  "title": "Add Personal Liability?",
  "subtitle": null,
  "content": "Personal liability insurance protects you from financial claims if you accidentally damage someone else's property or cause injury. Essential coverage for homeowners and renters.",
  "footer": "View 25+ Liability Plans from €5/month"
}$$),
(123, 'house_smart_card', 'Card', 30, $${
  "title": "Smart Home Insurance",
  "subtitle": "€75.00 monthly (Rating: 1.3 very good)",
  "content": "Smart Device Coverage. Cyber Protection. IoT Security. Remote Monitoring Discount.",
  "image_url": "assets/images/companies/neodigital.svg",
  "cta_link": "https://www.check24.de/"
}$$);