-- Presentation inventory for a new installation. Replace these records with live data.
insert into public.properties (
  id, reference_code, title, description, property_type, status, price, area_m2,
  address, latitude, longitude, image_url, payment_options, completion_percent, is_published
)
values
  (
    '11111111-1111-4111-8111-111111111111', 'TWR-1001',
    '{"en":"Ankawa Garden Villa","ku":"ڤێلای باخچەی عەنکاوا","ar":"فيلا حديقة عنكاوا"}'::jsonb,
    '{"en":"A calm four-bedroom villa with a private garden and generous daylight.","ku":"ڤێلایەکی ئارامی چوار ژوور، بە باخچەی تایبەت و ڕووناکی زۆر.","ar":"فيلا هادئة من أربع غرف مع حديقة خاصة وإضاءة طبيعية."}'::jsonb,
    'house', 'available', 385000, 420, 'Ankawa, Erbil', 36.2307, 43.9955,
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85',
    array['cash','installment']::public.payment_method[], 100, true
  ),
  (
    '22222222-2222-4222-8222-222222222222', 'TWR-1002',
    '{"en":"Empire Skyline Apartment","ku":"شوقەی ئاسمانی ئیمپایەر","ar":"شقة إطلالة إمباير"}'::jsonb,
    '{"en":"A premium high-floor apartment with panoramic city views and secure parking.","ku":"شوقەیەکی نایابی نهۆمی بەرز بە دیمەنی پانۆرامای شار و پارکینگی پارێزراو.","ar":"شقة فاخرة في طابق مرتفع بإطلالة بانورامية وموقف آمن."}'::jsonb,
    'apartment', 'available', 198000, 184, 'Empire World, Erbil', 36.2093, 44.0361,
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=85',
    array['cash','installment','advance']::public.payment_method[], 100, true
  ),
  (
    '33333333-3333-4333-8333-333333333333', 'TWR-1003',
    '{"en":"English Village Family Home","ku":"خانووی خێزانی ئینگلیش ڤیلەج","ar":"منزل عائلي في القرية الإنجليزية"}'::jsonb,
    '{"en":"A finished family home with a private courtyard and quiet streets.","ku":"خانوویەکی تەواوکراوی خێزانی بە حەوشەی تایبەت و کۆڵانی ئارام.","ar":"منزل عائلي مكتمل مع فناء خاص وشوارع هادئة."}'::jsonb,
    'house', 'reserved', 310000, 360, 'English Village, Erbil', 36.1884, 44.0711,
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=85',
    array['cash','advance']::public.payment_method[], 100, true
  ),
  (
    '44444444-4444-4444-8444-444444444444', 'TWR-1004',
    '{"en":"Bakhtiary Corner Plot","ku":"زەوی سەرگۆشەی بەختیاری","ar":"قطعة زاوية في بختياري"}'::jsonb,
    '{"en":"A well-proportioned corner parcel suited to a private residence.","ku":"پارچە زەوییەکی سەرگۆشە و ڕێک بۆ خانووی تایبەت.","ar":"قطعة أرض زاوية متناسقة مناسبة لمنزل خاص."}'::jsonb,
    'land', 'available', 265000, 500, 'Bakhtiary, Erbil', 36.1966, 43.9572,
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=85',
    array['cash']::public.payment_method[], 0, true
  ),
  (
    '55555555-5555-4555-8555-555555555555', 'TWR-1005',
    '{"en":"Gulan Residence","ku":"نیشتەجێبوونی گولان","ar":"سكن گولان"}'::jsonb,
    '{"en":"A contemporary two-bedroom residence currently in its finishing stage.","ku":"شوقەیەکی هاوچەرخی دوو ژوور کە لە قۆناغی تەواوکاریدایە.","ar":"شقة عصرية بغرفتين في مرحلة التشطيب."}'::jsonb,
    'apartment', 'construction', 142000, 136, 'Gulan Street, Erbil', 36.2125, 44.0088,
    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=85',
    array['installment','advance']::public.payment_method[], 78, true
  )
on conflict (reference_code) do nothing;

select setval(
  'public.property_reference_seq',
  greatest(
    1006,
    (select coalesce(max(substring(reference_code from '[0-9]+')::bigint), 1000) from public.properties)
  )
);
