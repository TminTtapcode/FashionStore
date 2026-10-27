-- V5__update_product_images_and_details.sql
-- Aligns product imagery with true product categories and luxury editorial standards

-- 1. Product 5: Áo Thun Heavyweight Cotton 260GSM Unisex
-- Replace portrait photo with clean, studio-lit heavyweight cotton tee
UPDATE product_images 
SET image_url = 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=900&q=80',
    alt_text = 'Áo thun heavyweight trắng phom rộng unisex'
WHERE id = 12 AND product_id = 5;

-- 2. Product 2: Áo Sơ Mi Oxford Cotton Cổ Button-Down
-- Replace necktie-focused closeup with clean Oxford button-down shirt
UPDATE product_images 
SET image_url = 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=900&q=80',
    alt_text = 'Áo sơ mi Oxford trắng cổ button-down lịch lãm'
WHERE id = 4 AND product_id = 2;

-- 3. Product 3: Áo Blazer Linen Phom Rộng Minimalist
-- Replace nylon bomber jacket with tailored relaxed luxury linen blazer
UPDATE product_images 
SET image_url = 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=80',
    alt_text = 'Áo blazer linen phom rộng tối giản be cát'
WHERE id = 7 AND product_id = 3;

-- 4. Product 4: Quần Jeans Ống Suông Cạp Cao Vintage Denim
-- Replace ripped patch jeans with clean wide-leg tailored vintage wash denim
UPDATE product_images 
SET image_url = 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=900&q=80',
    alt_text = 'Quần jeans ống suông cạp cao vintage denim'
WHERE id = 10 AND product_id = 4;

UPDATE product_images 
SET image_url = 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=900&q=80',
    alt_text = 'Dáng quần jeans ống suông vintage'
WHERE id = 11 AND product_id = 4;

