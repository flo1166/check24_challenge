-- Drop table to ensure clean run if needed
DROP TABLE IF EXISTS contracts;
DROP TABLE IF EXISTS widgets;

--- 1. CREATE THE WIDGETS TABLE (UNCHANGED)
CREATE TABLE widgets (
    user_id INTEGER NOT NULL,
    widget_id VARCHAR(100) PRIMARY KEY,
    component_type VARCHAR(50) NOT NULL,
    priority INTEGER DEFAULT 0,
    data JSONB NOT NULL, -- Stores the dynamic data dictionary
    UNIQUE (user_id, widget_id)
);

--- 2. CREATE THE CONTRACTS TABLE (NEWLY ADDED)
CREATE TABLE contracts (
    id SERIAL PRIMARY KEY, -- Auto-incrementing primary key
    user_id INTEGER NOT NULL,
    widget_id VARCHAR(100) NOT NULL,
    type VARCHAR(50) DEFAULT 'car_insurance', -- Assuming a default type is useful
    
    -- Define the Foreign Key relationship linking to the widgets table
    CONSTRAINT fk_widget
        FOREIGN KEY (widget_id)
        REFERENCES widgets (widget_id)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION
);

-- 3. Insert all entries with restructured JSON format
-- JSON Structure with advertising subtitles
INSERT INTO widgets (user_id, widget_id, component_type, priority, data) VALUES
-- Header Widget (no pricing/rating)
(123, 'tariff_recommendation_header', 'SectionHeader', 100, $${
  "title": "Our Car Insurance Recommendations for You",
  "subtitle": "Hide Recommendations",
  "content": "Based on price, tariff benefits, and customer reviews, we have determined the best tariffs for your Audi."
}$$),

-- Price Leader Recommendation
(123, 'tariff_pl_recommendation_card', 'Card', 90, $${
  "title": "Basic Protection Kasko-Mobil (ACV Members)",
  "subtitle": "Reliable coverage with exclusive member discount - Start saving today!",
  "content": "Max Sums Insured. Fair Reclassification. Limited Animal Damage Coverage. 6% Member Discount.",
  "image_url": "assets/images/companies/dadirekt.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 106.54,
    "currency": "EUR",
    "frequency": "monthly"
  },
  "rating": {
    "score": 1.8,
    "label": "good"
  }
}$$),

-- Luxury Recommendation
(123, 'tariff_l_recommendation_card', 'Card', 80, $${
  "title": "AutoPremium with Workshop Service",
  "subtitle": "Premium protection for your Audi - Comprehensive coverage included!",
  "content": "Max Sums Insured. Max Animal Damage Coverage. Fair Reclassification. New Value Comp. for 36 Months.",
  "image_url": "assets/images/companies/allianzdirect.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 151.53,
    "currency": "EUR",
    "frequency": "monthly"
  },
  "rating": {
    "score": 1.3,
    "label": "very good"
  }
}$$),

-- Tariff 1
(123, 'tariff_1_card', 'Card', 79, $${
  "title": "Basic Protection Kasko-Mobil (ACV Members)",
  "subtitle": "Smart choice for cost-conscious drivers - Member benefits included!",
  "content": "Max Sums Insured. Fair Reclassification. Limited Animal Damage Coverage. 6% Member Discount.",
  "image_url": "assets/images/companies/dadirekt.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 106.54,
    "currency": "EUR",
    "frequency": "monthly"
  },
  "rating": {
    "score": 1.8,
    "label": "good"
  }
}$$),

-- Tariff 2
(123, 'tariff_2_card', 'Card', 78, $${
  "title": "Basic Protection Kasko-Mobil",
  "subtitle": "Solid protection at an affordable price - Perfect for everyday drivers!",
  "content": "Max Sums Insured. Fair Reclassification. Limited Animal Damage Coverage. Expired New Value Comp.",
  "image_url": "assets/images/companies/dadirekt.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 113.03,
    "currency": "EUR",
    "frequency": "monthly"
  },
  "rating": {
    "score": 1.8,
    "label": "good"
  }
}$$),

-- Tariff 3
(123, 'tariff_3_card', 'Card', 77, $${
  "title": "Basic with Workshop Commitment",
  "subtitle": "Budget-friendly option with workshop service - Save 20% now!",
  "content": "Limited Sums Insured. Severe Reclassification. Expired New Value Comp. Includes 20% Special Discount.",
  "image_url": "assets/images/companies/vhvversicherung.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 121.05,
    "currency": "EUR",
    "frequency": "monthly"
  },
  "rating": {
    "score": 2.5,
    "label": "satisfactory"
  }
}$$),

-- Tariff 4 (No rating available)
(123, 'tariff_4_card', 'Card', 76, $${
  "title": "P-Tariff Basic with Workshop Commitment",
  "subtitle": "Flexible coverage with trusted workshop partners",
  "content": "Max Sums Insured. Limited Animal Damage Coverage. New Value Comp. for 6 Months. (Conclusion not possible here).",
  "image_url": "assets/images/companies/sparkasse.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 121.37,
    "currency": "EUR",
    "frequency": "monthly"
  }
}$$),

-- InfoBox 1
(123, 'info_partial_coverage', 'InfoBox', 60, $${
  "title": "Looking for a cheaper alternative?",
  "subtitle": null,
  "content": "Partial comprehensive insurance covers theft, glass breakage, natural disasters, and wild animal accidents – reliable protection for your vehicle. However, self-inflicted accidents are not covered.",
  "footer": "Show over 53 Partial Comprehensive Tariffs starting from €32"
}$$),

-- Tariff 5
(123, 'tariff_5_card', 'Card', 50, $${
  "title": "Comfort Smart with Workshop Commitment",
  "subtitle": "Enhanced comfort with smart features - Plus 20% discount bonus!",
  "content": "Max Sums Insured. Fair Reclassification. New Value Comp. for 24 Months. Includes 20% Discount + Addt'l Services.",
  "image_url": "assets/images/companies/vhvversicherung.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 129.85,
    "currency": "EUR",
    "frequency": "monthly"
  },
  "rating": {
    "score": 1.8,
    "label": "good"
  }
}$$),

-- Tariff 6
(123, 'tariff_6_card', 'Card', 49, $${
  "title": "P-Tariff Comfort with Workshop Commitment",
  "subtitle": "Comfort meets convenience - Quality workshop service guaranteed!",
  "content": "Max Sums Insured. Max Animal Damage Coverage. New Value Comp. for 12 Months. (Conclusion not possible here).",
  "image_url": "assets/images/companies/sparkasse.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 129.88,
    "currency": "EUR",
    "frequency": "monthly"
  }
}$$),

-- Tariff 7
(123, 'tariff_7_card', 'Card', 48, $${
  "title": "Basic with Workshop Commitment",
  "subtitle": "Extended animal damage coverage - Your reliable protection partner!",
  "content": "Max Sums Insured. Extended Animal Damage Coverage. Average Reclassification. New Value Comp. for 12 Months.",
  "image_url": "assets/images/companies/concordia.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 130.55,
    "currency": "EUR",
    "frequency": "monthly"
  },
  "rating": {
    "score": 1.8,
    "label": "good"
  }
}$$),

-- Tariff 8
(123, 'tariff_8_card', 'Card', 47, $${
  "title": "Basic with Workshop Commitment (incl. Traffic Legal Protection)",
  "subtitle": "Complete peace of mind - Legal protection & cashback included!",
  "content": "Max Sums Insured. Extended Animal Damage Coverage. Includes Traffic Legal Protection and Cashback.",
  "image_url": "assets/images/companies/concordia.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 133.63,
    "currency": "EUR",
    "frequency": "monthly"
  },
  "rating": {
    "score": 1.8,
    "label": "good"
  }
}$$),

-- InfoBox 2
(123, 'info_liability_coverage', 'InfoBox', 46, $${
  "title": "Only insure the essentials?",
  "subtitle": null,
  "content": "Statutory liability insurance covers damages to third-party vehicles, but damages to your own vehicle are not covered.",
  "footer": "Show 46 Liability Tariffs starting from €33"
}$$),

-- Tariff 9
(123, 'tariff_9_card', 'Card', 45, $${
  "title": "Comfort with Workshop Commitment",
  "subtitle": "Maximum coverage with fair pricing - Plus additional services!",
  "content": "Max Sums Insured. Max Animal Damage Coverage. Fair Reclassification. 20% Discount + Addt'l Services.",
  "image_url": "assets/images/companies/vhvversicherung.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 138.99,
    "currency": "EUR",
    "frequency": "monthly"
  },
  "rating": {
    "score": 1.5,
    "label": "good"
  }
}$$),

-- Tariff 10
(123, 'tariff_10_card', 'Card', 44, $${
  "title": "AutoBasic with Workshop Service",
  "subtitle": "Solid foundation for your vehicle protection - Basic done right!",
  "content": "Max Sums Insured. Extended Animal Damage Coverage. Severe Reclassification. Expired New Value Comp.",
  "image_url": "assets/images/companies/bavariaprotect.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 139.32,
    "currency": "EUR",
    "frequency": "monthly"
  },
  "rating": {
    "score": 2.0,
    "label": "good"
  }
}$$),

-- Tariff 11
(123, 'tariff_11_card', 'Card', 43, $${
  "title": "Comfort with Workshop Commitment",
  "subtitle": "24 months new value guarantee - Protect your investment!",
  "content": "Max Sums Insured. Max Animal Damage Coverage. Average Reclassification. New Value Comp. for 24 Months.",
  "image_url": "assets/images/companies/concordia.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 140.40,
    "currency": "EUR",
    "frequency": "monthly"
  },
  "rating": {
    "score": 1.7,
    "label": "good"
  }
}$$),

-- Tariff 12
(123, 'tariff_12_card', 'Card', 42, $${
  "title": "Premium with Workshop Commitment",
  "subtitle": "Top-tier protection with 36 months coverage - Save 20% extra!",
  "content": "Max Sums Insured. Max Animal Damage Coverage. Fair Reclassification. New Value Comp. for 36 Months + 20% Discount.",
  "image_url": "assets/images/companies/vhvversicherung.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 141.73,
    "currency": "EUR",
    "frequency": "monthly"
  },
  "rating": {
    "score": 1.5,
    "label": "good"
  }
}$$),

-- Tariff 13
(123, 'tariff_13_card', 'Card', 41, $${
  "title": "P-Tariff Premium with Workshop Commitment",
  "subtitle": "Premium features with maximum protection - Your best choice!",
  "content": "Max Sums Insured. Max Animal Damage Coverage. New Value Comp. for 24 Months. (Conclusion not possible here).",
  "image_url": "assets/images/companies/sparkasse.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 142.64,
    "currency": "EUR",
    "frequency": "monthly"
  }
}$$),

-- Tariff 14
(123, 'tariff_14_card', 'Card', 40, $${
  "title": "Comfort with Workshop Commitment (incl. Traffic Legal Protection)",
  "subtitle": "Comprehensive comfort package - Legal protection & cashback bonus!",
  "content": "Max Sums Insured. Max Animal Damage Coverage. Includes Traffic Legal Protection and Cashback.",
  "image_url": "assets/images/companies/concordia.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 143.48,
    "currency": "EUR",
    "frequency": "monthly"
  },
  "rating": {
    "score": 1.7,
    "label": "good"
  }
}$$),

-- Tariff 15
(123, 'tariff_15_card', 'Card', 39, $${
  "title": "AutoPlusProtect with Workshop Service",
  "subtitle": "Enhanced protection for peace of mind - 24 months new value comp!",
  "content": "Max Sums Insured. Max Animal Damage Coverage. Fair Reclassification. New Value Comp. for 24 Months.",
  "image_url": "assets/images/companies/bavariaprotect.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 144.63,
    "currency": "EUR",
    "frequency": "monthly"
  },
  "rating": {
    "score": 1.4,
    "label": "very good"
  }
}$$),

-- Tariff 16 (Recommendation)
(123, 'tariff_16_card_recommendation', 'Card', 38, $${
  "title": "AutoPremium with Workshop Service",
  "subtitle": "Our top recommendation - 36 months premium protection!",
  "content": "Max Sums Insured. Max Animal Damage Coverage. Fair Reclassification. New Value Comp. for 36 Months.",
  "image_url": "assets/images/companies/bavariaprotect.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 151.53,
    "currency": "EUR",
    "frequency": "monthly"
  },
  "rating": {
    "score": 1.3,
    "label": "very good"
  }
}$$),

-- Tariff 17
(123, 'tariff_17_card', 'Card', 37, $${
  "title": "Comfort Protection Kasko-Mobil (ACV Members)",
  "subtitle": "Premium comfort with member discount - Exclusive 6% savings!",
  "content": "Max Sums Insured. Max Animal Damage Coverage. Fair Reclassification. New Value Comp. for 18 Months + 6% Discount.",
  "image_url": "assets/images/companies/dadirekt.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 153.74,
    "currency": "EUR",
    "frequency": "monthly"
  },
  "rating": {
    "score": 1.3,
    "label": "very good"
  }
}$$),

-- Tariff 18
(123, 'tariff_18_card', 'Card', 36, $${
  "title": "Comfort Protection Kasko-Mobil",
  "subtitle": "Comprehensive comfort for your Audi - Maximum damage coverage!",
  "content": "Max Sums Insured. Max Animal Damage Coverage. Fair Reclassification. New Value Comp. for 18 Months.",
  "image_url": "assets/images/companies/dadirekt.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 163.17,
    "currency": "EUR",
    "frequency": "monthly"
  },
  "rating": {
    "score": 1.3,
    "label": "very good"
  }
}$$),

-- Tariff 19
(123, 'tariff_19_card', 'Card', 35, $${
  "title": "Premium Protection Kasko-Mobil (ACV Members)",
  "subtitle": "Excellent rated premium coverage - 36 months + 6% member bonus!",
  "content": "Max Sums Insured. Max Animal Damage Coverage. Fair Reclassification. New Value Comp. for 36 Months + 6% Discount.",
  "image_url": "assets/images/companies/dadirekt.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 167.26,
    "currency": "EUR",
    "frequency": "monthly"
  },
  "rating": {
    "score": 1.1,
    "label": "very good"
  }
}$$),

-- Tariff 20
(123, 'tariff_20_card', 'Card', 34, $${
  "title": "NEO M with Workshop Commitment",
  "subtitle": "Modern coverage for modern drivers - 24 months new value guarantee!",
  "content": "Max Sums Insured. Max Animal Damage Coverage. Fair Reclassification. New Value Comp. for 24 Months.",
  "image_url": "assets/images/companies/neodigital.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 170.78,
    "currency": "EUR",
    "frequency": "monthly"
  },
  "rating": {
    "score": 1.6,
    "label": "good"
  }
}$$),

-- Tariff 21
(123, 'tariff_21_card', 'Card', 33, $${
  "title": "Comfort S online with Workshop Commitment",
  "subtitle": "Digital convenience with solid protection - Manage everything online!",
  "content": "Limited Sums Insured. No Coverage for Gross Negligence. Fair Reclassification. New Value Comp. for 6 Months.",
  "image_url": "assets/images/companies/cosmosdirekt.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 171.69,
    "currency": "EUR",
    "frequency": "monthly"
  },
  "rating": {
    "score": 2.4,
    "label": "good"
  }
}$$),

-- Tariff 22
(123, 'tariff_22_card', 'Card', 32, $${
  "title": "Comfort S online with Workshop Commitment",
  "subtitle": "New in comparison - Modern online insurance solution!",
  "content": "Limited Sums Insured. No Coverage for Gross Negligence. Fair Reclassification. New in Comparison.",
  "image_url": "assets/images/companies/cosmosdirekt.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 173.54,
    "currency": "EUR",
    "frequency": "monthly"
  },
  "rating": {
    "score": 2.6,
    "label": "satisfactory"
  }
}$$),

-- Tariff 23
(123, 'tariff_23_card', 'Card', 31, $${
  "title": "Motor Insurance with Workshop Commitment",
  "subtitle": "Complete online service - Maximum coverage with digital convenience!",
  "content": "Max Sums Insured. Max Animal Damage Coverage. Severe Reclassification. Online Service Only.",
  "image_url": "assets/images/companies/fahrlehrerversicherung.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 174.57,
    "currency": "EUR",
    "frequency": "monthly"
  },
  "rating": {
    "score": 2.2,
    "label": "good"
  }
}$$),

-- Tariff 24
(123, 'tariff_24_card', 'Card', 30, $${
  "title": "Comfort M online with Workshop Commitment",
  "subtitle": "Balanced comfort with fair pricing - 6 months new value protection!",
  "content": "Max Sums Insured. Max Animal Damage Coverage. Fair Reclassification. New Value Comp. for 6 Months.",
  "image_url": "assets/images/companies/cosmosdirekt.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 175.19,
    "currency": "EUR",
    "frequency": "monthly"
  },
  "rating": {
    "score": 1.6,
    "label": "good"
  }
}$$),

-- Tariff 25
(123, 'tariff_25_card', 'Card', 29, $${
  "title": "Premium with Workshop Service",
  "subtitle": "Premium quality protection - 36 months comprehensive coverage!",
  "content": "Max Sums Insured. Max Animal Damage Coverage. New Value Comp. for 36 Months. (Conclusion not possible here).",
  "image_url": "assets/images/companies/bavariaprotect.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 176.02,
    "currency": "EUR",
    "frequency": "monthly"
  }
}$$),

-- Tariff 26
(123, 'tariff_26_card', 'Card', 28, $${
  "title": "Premium with Workshop Service Fully Comprehensive Plus",
  "subtitle": "Ultimate protection package - Fully comprehensive plus features!",
  "content": "Max Sums Insured. Max Animal Damage Coverage. New Value Comp. for 36 Months. (Conclusion not possible here).",
  "image_url": "assets/images/companies/bavariaprotect.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 176.77,
    "currency": "EUR",
    "frequency": "monthly"
  }
}$$),

-- Tariff 27
(123, 'tariff_27_card', 'Card', 27, $${
  "title": "Comfort M online with Workshop Commitment",
  "subtitle": "New in comparison - Digital management with maximum convenience!",
  "content": "Max Sums Insured. Max Animal Damage Coverage. Fair Reclassification. New Value Comp. for 6 Months. New in Comparison.",
  "image_url": "assets/images/companies/cosmosdirekt.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 177.09,
    "currency": "EUR",
    "frequency": "monthly"
  },
  "rating": {
    "score": 1.8,
    "label": "good"
  }
}$$),

-- Tariff 28
(123, 'tariff_28_card', 'Card', 26, $${
  "title": "Premium Protection Kasko-Mobil",
  "subtitle": "Top-rated premium insurance - 36 months ultimate protection!",
  "content": "Max Sums Insured. Max Animal Damage Coverage. Fair Reclassification. New Value Comp. for 36 Months.",
  "image_url": "assets/images/companies/dadirekt.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 177.39,
    "currency": "EUR",
    "frequency": "monthly"
  },
  "rating": {
    "score": 1.1,
    "label": "very good"
  }
}$$),

-- Tariff 29
(123, 'tariff_29_card', 'Card', 25, $${
  "title": "NEO L with Workshop Commitment",
  "subtitle": "Advanced digital insurance - 36 months comprehensive new value comp!",
  "content": "Max Sums Insured. Max Animal Damage Coverage. Fair Reclassification. New Value Comp. for 36 Months.",
  "image_url": "assets/images/companies/neodigital.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 179.36,
    "currency": "EUR",
    "frequency": "monthly"
  },
  "rating": {
    "score": 1.5,
    "label": "good"
  }
}$$),

-- Tariff 30
(123, 'tariff_30_card', 'Card', 24, $${
  "title": "Motor Policy Compact with Workshop Service",
  "subtitle": "Compact solution with extended coverage - 12 months new value!",
  "content": "Extended Sums Insured. Extended Animal Damage Coverage. Severe Reclassification. New Value Comp. for 12 Months.",
  "image_url": "assets/images/companies/kravag.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 180.64,
    "currency": "EUR",
    "frequency": "monthly"
  },
  "rating": {
    "score": 1.9,
    "label": "good"
  }
}$$),

-- Tariff 31
(123, 'tariff_31_card', 'Card', 23, $${
  "title": "Comfort M Plus online with Workshop Commitment",
  "subtitle": "Enhanced online comfort - 24 months protection with fair pricing!",
  "content": "Max Sums Insured. Max Animal Damage Coverage. Fair Reclassification. New Value Comp. for 24 Months.",
  "image_url": "assets/images/companies/cosmosdirekt.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 181.61,
    "currency": "EUR",
    "frequency": "monthly"
  },
  "rating": {
    "score": 1.4,
    "label": "very good"
  }
}$$),

-- Tariff 32
(123, 'tariff_32_card', 'Card', 22, $${
  "title": "Classic Guarantee 2.0 Damage Service Plus Workshop Service",
  "subtitle": "Classic quality upgraded - Full workshop service included!",
  "content": "Max Sums Insured. Max Animal Damage Coverage. Average Reclassification. New Value Comp. for 24 Months.",
  "image_url": "assets/images/companies/devk.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 183.30,
    "currency": "EUR",
    "frequency": "monthly"
  },
  "rating": {
    "score": 1.8,
    "label": "good"
  }
}$$),

-- Tariff 33
(123, 'tariff_33_card', 'Card', 21, $${
  "title": "Comfort M Plus online with Workshop Commitment",
  "subtitle": "New in comparison - Plus features with online convenience!",
  "content": "Max Sums Insured. Max Animal Damage Coverage. Fair Reclassification. New Value Comp. for 24 Months. New in Comparison.",
  "image_url": "assets/images/companies/cosmosdirekt.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 183.51,
    "currency": "EUR",
    "frequency": "monthly"
  },
  "rating": {
    "score": 1.6,
    "label": "good"
  }
}$$),

-- Tariff 34
(123, 'tariff_34_card', 'Card', 20, $${
  "title": "Comfort L online with Workshop Commitment",
  "subtitle": "Premium online comfort - Excellent rating with 24 months coverage!",
  "content": "Max Sums Insured. Max Animal Damage Coverage. Fair Reclassification. New Value Comp. for 24 Months.",
  "image_url": "assets/images/companies/cosmosdirekt.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 185.12,
    "currency": "EUR",
    "frequency": "monthly"
  },
  "rating": {
    "score": 1.3,
    "label": "very good"
  }
}$$),

-- Tariff 35
(123, 'tariff_35_card', 'Card', 19, $${
  "title": "Classic",
  "subtitle": "Straightforward classic protection - Reliable and affordable!",
  "content": "Max Sums Insured. Limited Animal Damage Coverage. New Value Comp. for 6 Months. (Conclusion not possible here).",
  "image_url": "assets/images/companies/inshared.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 186.38,
    "currency": "EUR",
    "frequency": "monthly"
  }
}$$),

-- Tariff 36
(123, 'tariff_36_card', 'Card', 18, $${
  "title": "Comfort L online with Workshop Commitment",
  "subtitle": "New in comparison - Top comfort with digital ease!",
  "content": "Max Sums Insured. Max Animal Damage Coverage. Fair Reclassification. New Value Comp. for 24 Months. New in Comparison.",
  "image_url": "assets/images/companies/cosmosdirekt.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 187.02,
    "currency": "EUR",
    "frequency": "monthly"
  },
  "rating": {
    "score": 1.4,
    "label": "very good"
  }
}$$),

-- Tariff 37
(123, 'tariff_37_card', 'Card', 17, $${
  "title": "DIRECT with Workshop Commitment",
  "subtitle": "Direct benefits with maximum coverage - No middleman, pure value!",
  "content": "Max Sums Insured. Max Animal Damage Coverage. Fair Reclassification. Expired New Value Comp.",
  "image_url": "assets/images/companies/allianzdirect.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 190.05,
    "currency": "EUR",
    "frequency": "monthly"
  },
  "rating": {
    "score": 1.5,
    "label": "good"
  }
}$$),

-- Tariff 38
(123, 'tariff_38_card', 'Card', 16, $${
  "title": "AvD Comfort with Workshop Commitment",
  "subtitle": "Automotive club quality - 24 months comprehensive protection!",
  "content": "Max Sums Insured. Max Animal Damage Coverage. Fair Reclassification. New Value Comp. for 24 Months.",
  "image_url": "assets/images/companies/bavariadirekt.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 195.82,
    "currency": "EUR",
    "frequency": "monthly"
  },
  "rating": {
    "score": 1.5,
    "label": "good"
  }
}$$),

-- Tariff 39
(123, 'tariff_39_card', 'Card', 15, $${
  "title": "Motor Policy Exclusive with Workshop Service",
  "subtitle": "Exclusive protection package - Extended coverage for 30 months!",
  "content": "Max Sums Insured. Extended Animal Damage Coverage. Average Reclassification. New Value Comp. for 30 Months.",
  "image_url": "assets/images/companies/kravag.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 196.34,
    "currency": "EUR",
    "frequency": "monthly"
  },
  "rating": {
    "score": 1.6,
    "label": "good"
  }
}$$),

-- Tariff 40
(123, 'tariff_40_card', 'Card', 14, $${
  "title": "Classic Guarantee 2.0 Exclusive Damage Service Plus Workshop Service",
  "subtitle": "Exclusive classic quality - 36 months ultimate damage protection!",
  "content": "Max Sums Insured. Max Animal Damage Coverage. Average Reclassification. New Value Comp. for 36 Months.",
  "image_url": "assets/images/companies/devk.svg",
  "cta_link": "https://www.check24.de/",
  "pricing": {
    "price": 198.71,
    "currency": "EUR",
    "frequency": "monthly"
  },
  "rating": {
    "score": 1.7,
    "label": "good"
  }
}$$);