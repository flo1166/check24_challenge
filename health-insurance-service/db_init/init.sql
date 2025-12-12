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
    type VARCHAR(50) DEFAULT 'health_insurance',
    
    CONSTRAINT fk_widget
        FOREIGN KEY (widget_id)
        REFERENCES widgets (widget_id)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION
);

-- Insert health insurance widgets
INSERT INTO widgets (user_id, widget_id, component_type, priority, data) VALUES
(123, 'health_recommendation_header', 'SectionHeader', 100, $${
  "title": "Health Insurance Recommendations",
  "subtitle": "Hide Recommendations",
  "description": "Compare the best health insurance plans tailored to your needs and budget."
}$$),
(123, 'health_premium_card', 'Card', 90, $${
  "title": "Premium Health Plus",
  "subtitle": "€289.00 monthly (Rating: 1.2 very good)",
  "content": "Comprehensive Coverage. Private Hospital Treatment. Dental Included. No Deductible.",
  "image_url": "assets/images/companies/allianzdirect.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'health_standard_card', 'Card', 80, $${
  "title": "Standard Health Coverage",
  "subtitle": "€195.50 monthly (Rating: 1.5 good)",
  "content": "Basic Medical Coverage. Prescription Drugs. Specialist Visits. €500 Annual Deductible.",
  "image_url": "assets/images/companies/bavariaprotect.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'health_budget_card', 'Card', 70, $${
  "title": "Budget Health Basic",
  "subtitle": "€145.00 monthly (Rating: 1.8 good)",
  "content": "Essential Medical Services. Generic Medications. Limited Specialist Access. €1000 Deductible.",
  "image_url": "assets/images/companies/cosmosdirekt.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'health_family_card', 'Card', 60, $${
  "title": "Family Health Package",
  "subtitle": "€425.00 monthly (Rating: 1.3 very good)",
  "content": "Coverage for 4 Family Members. Pediatric Care. Maternity Benefits. Preventive Check-ups.",
  "image_url": "assets/images/companies/concordia.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'health_senior_card', 'Card', 50, $${
  "title": "Senior Care Plus",
  "subtitle": "€345.00 monthly (Rating: 1.4 very good)",
  "content": "Age 60+ Specialized. Chronic Disease Management. Home Care Services. Priority Appointments.",
  "image_url": "assets/images/companies/devk.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'info_dental_addon', 'InfoBox', 40, $${
  "title": "Add Dental Coverage?",
  "subtitle": null,
  "content": "Dental insurance covers routine check-ups, cleanings, fillings, and major procedures like crowns and implants. Supplement your health plan for complete oral health protection.",
  "footer": "View 15+ Dental Plans from €19/month"
}$$),
(123, 'health_digital_card', 'Card', 30, $${
  "title": "Digital Health 24/7",
  "subtitle": "€99.00 monthly (Rating: 1.6 good)",
  "content": "Telemedicine Consultations. Online Prescriptions. Mental Health Support. Fitness App Integration.",
  "image_url": "assets/images/companies/neodigital.svg",
  "cta_link": "https://www.check24.de/"
}$$);