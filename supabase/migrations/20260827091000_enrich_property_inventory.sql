-- Enrich the existing public inventory for the enterprise detail experience.
update public.properties
set bedrooms = 4, bathrooms = 5, floors = 2, parking_spaces = 2, year_built = 2024,
    features = '{"amenities":["Private garden", "Smart home", "24/7 security", "Central cooling"]}'::jsonb
where id = '11111111-1111-4111-8111-111111111111';

update public.properties
set bedrooms = 3, bathrooms = 3, floors = 1, parking_spaces = 2, year_built = 2025,
    features = '{"amenities":["Skyline view", "Gym", "Concierge", "Secure parking"]}'::jsonb
where id = '22222222-2222-4222-8222-222222222222';

update public.properties
set bedrooms = 4, bathrooms = 4, floors = 2, parking_spaces = 2, year_built = 2023,
    features = '{"amenities":["Private courtyard", "Family lounge", "Security", "Storage"]}'::jsonb
where id = '33333333-3333-4333-8333-333333333333';

update public.properties
set year_built = null,
    features = '{"amenities":["Corner plot", "Wide frontage", "Residential zoning"]}'::jsonb
where id = '44444444-4444-4444-8444-444444444444';

update public.properties
set bedrooms = 2, bathrooms = 2, floors = 1, parking_spaces = 1, year_built = 2026,
    features = '{"amenities":["Flexible installments", "Elevator", "Security", "Generator"]}'::jsonb
where id = '55555555-5555-4555-8555-555555555555';
