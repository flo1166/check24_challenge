-- Drop table to ensure clean run if needed
DROP TABLE IF EXISTS widgets;

-- 1. Create the widgets table with JSONB
CREATE TABLE widgets (
    user_id INTEGER NOT NULL,
    widget_id VARCHAR(100) PRIMARY KEY,
    component_type VARCHAR(50) NOT NULL,
    priority INTEGER DEFAULT 0,
    data JSONB NOT NULL, -- Stores the dynamic data dictionary
    UNIQUE (user_id, widget_id)
);

-- 2. Insert all 34 entries (Header, Info Boxes, and Tariffs 1-40) in a single command
INSERT INTO widgets (user_id, widget_id, component_type, priority, data) VALUES
(123, 'tariff_recommendation_header', 'SectionHeader', 100, $${
  "title": "Our Tariff Recommendations for You",
  "subtitle": "Hide Recommendations",
  "description": "Based on price, tariff benefits, and customer reviews, we have determined the best tariffs for your Audi."
}$$),
(123, 'tariff_pl_recommendation_card', 'Card', 90, $${
  "title": "Basic Protection Kasko-Mobil (ACV Members)",
  "subtitle": "€106.54 monthly (Rating: 1.8 good)",
  "content": "Max. Sums Insured. Fair Reclassification. Limited Animal Damage Coverage. 6% Member Discount.",
  "image_url": "assets/images/companies/dadirekt.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'tariff_l_recommendation_card', 'Card', 80, $${
  "title": "AutoPremium with Workshop Service",
  "subtitle": "€151.53 monthly (Rating: 1.3 very good)",
  "content": "Max. Sums Insured. Max. Animal Damage Coverage. Fair Reclassification. New Value Comp. for 36 Months.",
  "image_url": "assets/images/companies/allianzdirect.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'tariff_1_card', 'Card', 79, $${
  "title": "Basic Protection Kasko-Mobil (ACV Members)",
  "subtitle": "€106.54 monthly (Rating: 1.8 good)",
  "content": "Max. Sums Insured. Fair Reclassification. Limited Animal Damage Coverage. 6% Member Discount.",
  "image_url": "assets/images/companies/dadirekt.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'tariff_2_card', 'Card', 78, $${
  "title": "Basic Protection Kasko-Mobil",
  "subtitle": "€113.03 monthly (Rating: 1.8 good)",
  "content": "Max. Sums Insured. Fair Reclassification. Limited Animal Damage Coverage. Expired New Value Comp.",
  "image_url": "assets/images/companies/dadirekt.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'tariff_3_card', 'Card', 77, $${
  "title": "Basic with Workshop Commitment",
  "subtitle": "€121.05 monthly (Rating: 2.5 satisfactory)",
  "content": "Limited Sums Insured. Severe Reclassification. Expired New Value Comp. Includes 20% Special Discount.",
  "image_url": "assets/images/companies/vhvversicherung.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'tariff_4_card', 'Card', 76, $${
  "title": "P-Tariff Basic with Workshop Commitment",
  "subtitle": "€121.37 monthly (Tariff score not available)",
  "content": "Max. Sums Insured. Limited Animal Damage Coverage. New Value Comp. for 6 Months. (Conclusion not possible here).",
  "image_url": "assets/images/companies/sparkasse.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'info_partial_coverage', 'InfoBox', 60, $${
  "title": "Looking for a cheaper alternative?",
  "subtitle": null,
  "content": "Partial comprehensive insurance covers theft, glass breakage, natural disasters, and wild animal accidents – reliable protection for your vehicle. However, self-inflicted accidents are not covered.",
  "footer": "Show over 53 Partial Comprehensive Tariffs starting from €32"
}$$),
(123, 'tariff_5_card', 'Card', 50, $${
  "title": "Comfort Smart with Workshop Commitment",
  "subtitle": "€129.85 monthly (Rating: 1.8 good)",
  "content": "Max. Sums Insured. Fair Reclassification. New Value Comp. for 24 Months. Includes 20% Discount + Addt'l Services.",
  "image_url": "assets/images/companies/vhvversicherung.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'tariff_6_card', 'Card', 49, $${
  "title": "P-Tariff Comfort with Workshop Commitment",
  "subtitle": "€129.88 monthly (Tariff score not available)",
  "content": "Max. Sums Insured. Max. Animal Damage Coverage. New Value Comp. for 12 Months. (Conclusion not possible here).",
  "image_url": "assets/images/companies/sparkasse.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'tariff_7_card', 'Card', 48, $${
  "title": "Basic with Workshop Commitment",
  "subtitle": "€130.55 monthly (Rating: 1.8 good)",
  "content": "Max. Sums Insured. Extended Animal Damage Coverage. Average Reclassification. New Value Comp. for 12 Months.",
  "image_url": "assets/images/companies/concordia.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'tariff_8_card', 'Card', 47, $${
  "title": "Basic with Workshop Commitment (incl. Traffic Legal Protection)",
  "subtitle": "€133.63 monthly (Rating: 1.8 good)",
  "content": "Max. Sums Insured. Extended Animal Damage Coverage. Includes Traffic Legal Protection and Cashback.",
  "image_url": "assets/images/companies/concordia.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'info_liability_coverage', 'InfoBox', 46, $${
  "title": "Only insure the essentials?",
  "subtitle": null,
  "content": "Statutory liability insurance covers damages to third-party vehicles, but damages to your own vehicle are not covered.",
  "footer": "Show 46 Liability Tariffs starting from €33"
}$$),
(123, 'tariff_9_card', 'Card', 45, $${
  "title": "Comfort with Workshop Commitment",
  "subtitle": "€138.99 monthly (Rating: 1.5 good)",
  "content": "Max. Sums Insured. Max. Animal Damage Coverage. Fair Reclassification. 20% Discount + Addt'l Services.",
  "image_url": "assets/images/companies/vhvversicherung.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'tariff_10_card', 'Card', 44, $${
  "title": "AutoBasic with Workshop Service",
  "subtitle": "€139.32 monthly (Rating: 2.0 good)",
  "content": "Max. Sums Insured. Extended Animal Damage Coverage. Severe Reclassification. Expired New Value Comp.",
  "image_url": "assets/images/companies/bavariaprotect.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'tariff_11_card', 'Card', 43, $${
  "title": "Comfort with Workshop Commitment",
  "subtitle": "€140.40 monthly (Rating: 1.7 good)",
  "content": "Max. Sums Insured. Max. Animal Damage Coverage. Average Reclassification. New Value Comp. for 24 Months.",
  "image_url": "assets/images/companies/concordia.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'tariff_12_card', 'Card', 42, $${
  "title": "Premium with Workshop Commitment",
  "subtitle": "€141.73 monthly (Rating: 1.5 good)",
  "content": "Max. Sums Insured. Max. Animal Damage Coverage. Fair Reclassification. New Value Comp. for 36 Months + 20% Discount.",
  "image_url": "assets/images/companies/vhvversicherung.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'tariff_13_card', 'Card', 41, $${
  "title": "P-Tariff Premium with Workshop Commitment",
  "subtitle": "€142.64 monthly (Tariff score not available)",
  "content": "Max. Sums Insured. Max. Animal Damage Coverage. New Value Comp. for 24 Months. (Conclusion not possible here).",
  "image_url": "assets/images/companies/sparkasse.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'tariff_14_card', 'Card', 40, $${
  "title": "Comfort with Workshop Commitment (incl. Traffic Legal Protection)",
  "subtitle": "€143.48 monthly (Rating: 1.7 good)",
  "content": "Max. Sums Insured. Max. Animal Damage Coverage. Includes Traffic Legal Protection and Cashback.",
  "image_url": "assets/images/companies/concordia.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'tariff_15_card', 'Card', 39, $${
  "title": "AutoPlusProtect with Workshop Service",
  "subtitle": "€144.63 monthly (Rating: 1.4 very good)",
  "content": "Max. Sums Insured. Max. Animal Damage Coverage. Fair Reclassification. New Value Comp. for 24 Months.",
  "image_url": "assets/images/companies/bavariaprotect.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'tariff_16_card_recommendation', 'Card', 38, $${
  "title": "AutoPremium with Workshop Service",
  "subtitle": "€151.53 monthly (Rating: 1.3 very good)",
  "content": "Max. Sums Insured. Max. Animal Damage Coverage. Fair Reclassification. New Value Comp. for 36 Months.",
  "image_url": "assets/images/companies/bavariaprotect.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'tariff_17_card', 'Card', 37, $${
  "title": "Comfort Protection Kasko-Mobil (ACV Members)",
  "subtitle": "€153.74 monthly (Rating: 1.3 very good)",
  "content": "Max. Sums Insured. Max. Animal Damage Coverage. Fair Reclassification. New Value Comp. for 18 Months + 6% Discount.",
  "image_url": "assets/images/companies/dadirekt.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'tariff_18_card', 'Card', 36, $${
  "title": "Comfort Protection Kasko-Mobil",
  "subtitle": "€163.17 monthly (Rating: 1.3 very good)",
  "content": "Max. Sums Insured. Max. Animal Damage Coverage. Fair Reclassification. New Value Comp. for 18 Months.",
  "image_url": "assets/images/companies/dadirekt.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'tariff_19_card', 'Card', 35, $${
  "title": "Premium Protection Kasko-Mobil (ACV Members)",
  "subtitle": "€167.26 monthly (Rating: 1.1 very good)",
  "content": "Max. Sums Insured. Max. Animal Damage Coverage. Fair Reclassification. New Value Comp. for 36 Months + 6% Discount.",
  "image_url": "assets/images/companies/dadirekt.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'tariff_20_card', 'Card', 34, $${
  "title": "NEO M with Workshop Commitment",
  "subtitle": "€170.78 monthly (Rating: 1.6 good)",
  "content": "Max. Sums Insured. Max. Animal Damage Coverage. Fair Reclassification. New Value Comp. for 24 Months.",
  "image_url": "assets/images/companies/neodigital.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'tariff_21_card', 'Card', 33, $${
  "title": "Comfort S online with Workshop Commitment",
  "subtitle": "€171.69 monthly (Rating: 2.4 good)",
  "content": "Limited Sums Insured. No Coverage for Gross Negligence. Fair Reclassification. New Value Comp. for 6 Months.",
  "image_url": "assets/images/companies/cosmosdirekt.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'tariff_22_card', 'Card', 32, $${
  "title": "Comfort S online with Workshop Commitment",
  "subtitle": "€173.54 monthly (Rating: 2.6 satisfactory)",
  "content": "Limited Sums Insured. No Coverage for Gross Negligence. Fair Reclassification. New in Comparison.",
  "image_url": "assets/images/companies/cosmosdirekt.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'tariff_23_card', 'Card', 31, $${
  "title": "Motor Insurance with Workshop Commitment",
  "subtitle": "€174.57 monthly (Rating: 2.2 good)",
  "content": "Max. Sums Insured. Max. Animal Damage Coverage. Severe Reclassification. Online Service Only.",
  "image_url": "assets/images/companies/fahrlehrerversicherung.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'tariff_24_card', 'Card', 30, $${
  "title": "Comfort M online with Workshop Commitment",
  "subtitle": "€175.19 monthly (Rating: 1.6 good)",
  "content": "Max. Sums Insured. Max. Animal Damage Coverage. Fair Reclassification. New Value Comp. for 6 Months.",
  "image_url": "assets/images/companies/cosmosdirekt.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'tariff_25_card', 'Card', 29, $${
  "title": "Premium with Workshop Service",
  "subtitle": "€176.02 monthly (Tariff score not available)",
  "content": "Max. Sums Insured. Max. Animal Damage Coverage. New Value Comp. for 36 Months. (Conclusion not possible here).",
  "image_url": "assets/images/companies/bavariaprotect.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'tariff_26_card', 'Card', 28, $${
  "title": "Premium with Workshop Service Fully Comprehensive Plus",
  "subtitle": "€176.77 monthly (Tariff score not available)",
  "content": "Max. Sums Insured. Max. Animal Damage Coverage. New Value Comp. for 36 Months. (Conclusion not possible here).",
  "image_url": "assets/images/companies/bavariaprotect.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'tariff_27_card', 'Card', 27, $${
  "title": "Comfort M online with Workshop Commitment",
  "subtitle": "€177.09 monthly (Rating: 1.8 good)",
  "content": "Max. Sums Insured. Max. Animal Damage Coverage. Fair Reclassification. New Value Comp. for 6 Months. New in Comparison.",
  "image_url": "assets/images/companies/cosmosdirekt.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'tariff_28_card', 'Card', 26, $${
  "title": "Premium Protection Kasko-Mobil",
  "subtitle": "€177.39 monthly (Rating: 1.1 very good)",
  "content": "Max. Sums Insured. Max. Animal Damage Coverage. Fair Reclassification. New Value Comp. for 36 Months.",
  "image_url": "assets/images/companies/dadirekt.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'tariff_29_card', 'Card', 25, $${
  "title": "NEO L with Workshop Commitment",
  "subtitle": "€179.36 monthly (Rating: 1.5 good)",
  "content": "Max. Sums Insured. Max. Animal Damage Coverage. Fair Reclassification. New Value Comp. for 36 Months.",
  "image_url": "assets/images/companies/neodigital.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'tariff_30_card', 'Card', 24, $${
  "title": "Motor Policy Compact with Workshop Service",
  "subtitle": "€180.64 monthly (Rating: 1.9 good)",
  "content": "Extended Sums Insured. Extended Animal Damage Coverage. Severe Reclassification. New Value Comp. for 12 Months.",
  "image_url": "assets/images/companies/kravag.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'tariff_31_card', 'Card', 23, $${
  "title": "Comfort M Plus online with Workshop Commitment",
  "subtitle": "€181.61 monthly (Rating: 1.4 very good)",
  "content": "Max. Sums Insured. Max. Animal Damage Coverage. Fair Reclassification. New Value Comp. for 24 Months.",
  "image_url": "assets/images/companies/cosmosdirekt.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'tariff_32_card', 'Card', 22, $${
  "title": "Classic Guarantee 2.0 Damage Service Plus Workshop Service",
  "subtitle": "€183.30 monthly (Rating: 1.8 good)",
  "content": "Max. Sums Insured. Max. Animal Damage Coverage. Average Reclassification. New Value Comp. for 24 Months.",
  "image_url": "assets/images/companies/devk.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'tariff_33_card', 'Card', 21, $${
  "title": "Comfort M Plus online with Workshop Commitment",
  "subtitle": "€183.51 monthly (Rating: 1.6 good)",
  "content": "Max. Sums Insured. Max. Animal Damage Coverage. Fair Reclassification. New Value Comp. for 24 Months. New in Comparison.",
  "image_url": "assets/images/companies/cosmosdirekt.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'tariff_34_card', 'Card', 20, $${
  "title": "Comfort L online with Workshop Commitment",
  "subtitle": "€185.12 monthly (Rating: 1.3 very good)",
  "content": "Max. Sums Insured. Max. Animal Damage Coverage. Fair Reclassification. New Value Comp. for 24 Months.",
  "image_url": "assets/images/companies/cosmosdirekt.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'tariff_35_card', 'Card', 19, $${
  "title": "Classic",
  "subtitle": "€186.38 monthly (Tariff score not available)",
  "content": "Max. Sums Insured. Limited Animal Damage Coverage. New Value Comp. for 6 Months. (Conclusion not possible here).",
  "image_url": "assets/images/companies/inshared.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'tariff_36_card', 'Card', 18, $${
  "title": "Comfort L online with Workshop Commitment",
  "subtitle": "€187.02 monthly (Rating: 1.4 very good)",
  "content": "Max. Sums Insured. Max. Animal Damage Coverage. Fair Reclassification. New Value Comp. for 24 Months. New in Comparison.",
  "image_url": "assets/images/companies/cosmosdirekt.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'tariff_37_card', 'Card', 17, $${
  "title": "DIRECT with Workshop Commitment",
  "subtitle": "€190.05 monthly (Rating: 1.5 good)",
  "content": "Max. Sums Insured. Max. Animal Damage Coverage. Fair Reclassification. Expired New Value Comp.",
  "image_url": "assets/images/companies/allianzdirect.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'tariff_38_card', 'Card', 16, $${
  "title": "AvD Comfort with Workshop Commitment",
  "subtitle": "€195.82 monthly (Rating: 1.5 good)",
  "content": "Max. Sums Insured. Max. Animal Damage Coverage. Fair Reclassification. New Value Comp. for 24 Months.",
  "image_url": "assets/images/companies/bavariadirekt.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'tariff_39_card', 'Card', 15, $${
  "title": "Motor Policy Exclusive with Workshop Service",
  "subtitle": "€196.34 monthly (Rating: 1.6 good)",
  "content": "Max. Sums Insured. Extended Animal Damage Coverage. Average Reclassification. New Value Comp. for 30 Months.",
  "image_url": "assets/images/companies/kravag.svg",
  "cta_link": "https://www.check24.de/"
}$$),
(123, 'tariff_40_card', 'Card', 14, $${
  "title": "Classic Guarantee 2.0 Exclusive Damage Service Plus Workshop Service",
  "subtitle": "€198.71 monthly (Rating: 1.7 good)",
  "content": "Max. Sums Insured. Max. Animal Damage Coverage. Average Reclassification. New Value Comp. for 36 Months.",
  "image_url": "assets/images/companies/devk.svg",
  "cta_link": "https://www.check24.de/"
}$$);