CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  role TEXT DEFAULT 'buyer' CHECK (role IN ('buyer', 'seller', 'admin')),
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  sort_order INT DEFAULT 0
);

INSERT INTO categories (name, slug, sort_order) VALUES
  ('Electronics', 'electronics', 1),
  ('Furniture', 'furniture', 2),
  ('Clothing', 'clothing', 3),
  ('Books', 'books', 4),
  ('Vehicles', 'vehicles', 5),
  ('Home & Garden', 'home-garden', 6),
  ('Sports', 'sports', 7),
  ('Toys & Games', 'toys-games', 8),
  ('Others', 'others', 9)
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS delivery_zones (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  fee INT NOT NULL
);

INSERT INTO delivery_zones (name, fee) VALUES
  ('CBD / Town Center', 15000),
  ('Nearby Estates', 25000),
  ('Outer Areas', 40000)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category_id INT REFERENCES categories(id),
  title TEXT NOT NULL,
  description TEXT,
  price INT NOT NULL CHECK (price > 0),
  condition TEXT CHECK (condition IN ('like_new', 'good', 'fair')),
  location TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'sold', 'rejected')),
  is_featured BOOLEAN DEFAULT false,
  view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'replied', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  buyer_id UUID REFERENCES profiles(id),
  seller_id UUID REFERENCES profiles(id),
  amount INT NOT NULL,
  commission INT NOT NULL,
  delivery_fee INT DEFAULT 0,
  mpesa_receipt TEXT,
  status TEXT DEFAULT 'pending_payment'
    CHECK (status IN ('pending_payment', 'paid', 'in_transit', 'delivered', 'cancelled')),
  delivery_address TEXT,
  delivery_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "view all profiles" ON profiles;
CREATE POLICY "view all profiles" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "update own profile" ON profiles;
CREATE POLICY "update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "insert own profile" ON profiles;
CREATE POLICY "insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "view active products" ON products;
CREATE POLICY "view active products" ON products FOR SELECT USING (status = 'active');
DROP POLICY IF EXISTS "seller view own products" ON products;
CREATE POLICY "seller view own products" ON products FOR SELECT USING (auth.uid() = seller_id);
DROP POLICY IF EXISTS "seller insert products" ON products;
CREATE POLICY "seller insert products" ON products FOR INSERT WITH CHECK (auth.uid() = seller_id);
DROP POLICY IF EXISTS "seller update own products" ON products;
CREATE POLICY "seller update own products" ON products FOR UPDATE USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "view inquiries" ON inquiries;
CREATE POLICY "view inquiries" ON inquiries FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() IN (SELECT seller_id FROM products WHERE id = inquiries.product_id));
DROP POLICY IF EXISTS "create inquiries" ON inquiries;
CREATE POLICY "create inquiries" ON inquiries FOR INSERT WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "view orders" ON orders;
CREATE POLICY "view orders" ON orders FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
DROP POLICY IF EXISTS "create orders" ON orders;
CREATE POLICY "create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
DROP POLICY IF EXISTS "update orders" ON orders;
CREATE POLICY "update orders" ON orders FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    COALESCE(new.email, '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_product ON inquiries(product_id);
