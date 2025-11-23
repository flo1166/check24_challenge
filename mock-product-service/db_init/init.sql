-- Creates the 'widgets' table with a JSONB column for the dynamic 'data' field.

-- Drop table to ensure clean run if needed
DROP TABLE IF EXISTS widgets;

-- 1. Create the widgets table with JSONB
CREATE TABLE widgets (
    user_id INTEGER NOT NULL,
    widget_id VARCHAR(50) PRIMARY KEY,
    component_type VARCHAR(50) NOT NULL,
    priority INTEGER DEFAULT 0,
    data JSONB NOT NULL, -- Stores the dynamic data dictionary
    -- NOTE: We don't need 'title', 'subtitle', 'content', etc., as separate columns anymore!
    -- They are now part of the JSONB 'data' field.
    UNIQUE (user_id, widget_id)
);

-- 2. Insert the 10 data entries (reformatted for the new JSONB column)
INSERT INTO widgets (user_id, widget_id, component_type, priority, data) VALUES
(123, 'car-card-101', 'Card', 10, '{"title": "Platinum Auto Policy", "subtitle": "Our most popular full-coverage plan.", "content": "Zero deductible option available. Includes roadside assistance and rental car coverage.", "image_url": "https://images.example.com/cars/deal1.png", "cta_link": "/deals/platinum-policy"}'),
(123, 'car-card-102', 'Card', 20, '{"title": "Essential Liability Insurance", "subtitle": "Affordable coverage for legal requirements.", "content": "Covers bodily injury and property damage liability up to $100k.", "image_url": "https://images.example.com/cars/deal2.png", "cta_link": "/deals/basic-liability"}'),
(123, 'car-card-103', 'Card', 30, '{"title": "Gap Insurance Included", "subtitle": "Perfect for new leases and loans.", "content": "Covers the difference between what you owe and the car’s market value if totaled.", "image_url": "https://images.example.com/cars/deal3.png", "cta_link": "/deals/new-car-gap"}'),
(123, 'car-card-104', 'Card', 40, '{"title": "Pay-Per-Mile Option", "subtitle": "Savings for remote workers and occasional drivers.", "content": "Install a tracking device and pay a base rate plus a small per-mile fee.", "image_url": "https://images.example.com/cars/deal4.png", "cta_link": "/deals/low-mileage"}'),
(123, 'car-card-105', 'Card', 50, '{"title": "Family Fleet Savings", "subtitle": "Insure two or more cars and save up to 25%.", "content": "Simplify your billing and get one lower rate for your whole family''s vehicles.", "image_url": "https://images.example.com/cars/deal5.png", "cta_link": "/deals/multi-car"}'),
(123, 'car-card-106', 'Card', 60, '{"title": "Agreed Value Policy", "subtitle": "Specialized coverage for vintage and classic automobiles.", "content": "Insure your car for its true collector value, not depreciated market price.", "image_url": "https://images.example.com/cars/deal6.png", "cta_link": "/deals/classic-auto"}'),
(123, 'car-card-107', 'Card', 70, '{"title": "Insurance Bundle Discount", "subtitle": "Combine your home and auto for maximum savings.", "content": "Enjoy premium discounts and a single point of contact for all your insurance needs.", "image_url": "https://images.example.com/cars/deal7.png", "cta_link": "/deals/bundle-offer"}'),
(123, 'car-card-108', 'Card', 80, '{"title": "Safe Driving Monitoring", "subtitle": "Discount program for young, safe drivers.", "content": "Install the telematics app and save on your premium based on driving behavior.", "image_url": "https://images.example.com/cars/deal8.png", "cta_link": "/deals/teen-safety"}'),
(123, 'car-card-109', 'Card', 90, '{"title": "Rate Protection Guarantee", "subtitle": "Your rates won''t increase after your first at-fault accident.", "content": "Peace of mind knowing a single mistake won''t impact your insurance premium.", "image_url": "https://images.example.com/cars/deal9.png", "cta_link": "/deals/accident-forgiveness"}'),
(123, 'car-card-110', 'Card', 100, '{"title": "Zero Deductible Glass Repair", "subtitle": "Get chips and cracks fixed at no cost to you.", "content": "Comprehensive coverage that includes windshield and window replacement without a deductible.", "image_url": "https://images.example.com/cars/deal10.png", "cta_link": "/deals/glass-special"}');