-- =============================================
-- OMIX MARKETPLACE — Complete Database Schema
-- PostgreSQL via Supabase
-- Modules: Marketplace, Escrow, Messaging, AI Assistant,
--          Seller Stores, Analytics, Trust & Verification,
--          Logistics, Business Services
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. PROFILES (extends auth.users)
-- =============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  location_city TEXT,
  location_region TEXT,
  seller_bio TEXT,
  rating_avg DECIMAL(2,1) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  verified_badge BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  id_verified BOOLEAN DEFAULT false,
  stripe_account_id TEXT,
  store_slug TEXT UNIQUE,
  store_name TEXT,
  store_description TEXT,
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_profiles_phone ON profiles(phone);
CREATE INDEX idx_profiles_store_slug ON profiles(store_slug);
CREATE INDEX idx_profiles_location ON profiles(location_city, location_region);

-- =============================================
-- 2. CATEGORIES (self-referential for nesting)
-- =============================================
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  icon TEXT,
  sort_order INTEGER DEFAULT 0
);

INSERT INTO categories (name, slug, sort_order) VALUES
  ('Electronics', 'electronics', 1),
  ('Furniture', 'furniture', 2),
  ('Clothing & Fashion', 'clothing', 3),
  ('Books & Stationery', 'books', 4),
  ('Vehicles & Auto', 'vehicles', 5),
  ('Home & Garden', 'home-garden', 6),
  ('Sports & Fitness', 'sports', 7),
  ('Toys & Games', 'toys-games', 8),
  ('Health & Beauty', 'health-beauty', 9),
  ('Business Services', 'business-services', 10),
  ('Others', 'others', 99)
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- 3. LISTINGS (Marketplace core)
-- =============================================
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL CHECK (price > 0),
  condition TEXT CHECK (condition IN ('new', 'like-new', 'good', 'fair', 'poor')),
  location_city TEXT,
  location_region TEXT,
  is_negotiable BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'active', 'sold', 'archived', 'reported', 'rejected')),
  views INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_listings_seller ON listings(seller_id);
CREATE INDEX idx_listings_category ON listings(category_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_price ON listings(price);
CREATE INDEX idx_listings_location ON listings(location_city);
CREATE INDEX idx_listings_featured ON listings(featured) WHERE featured = true;

-- =============================================
-- 4. LISTING_IMAGES
-- =============================================
CREATE TABLE listing_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  storage_path TEXT,
  is_primary BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0
);

CREATE INDEX idx_listing_images_listing ON listing_images(listing_id);

-- =============================================
-- 5. ORDERS (Escrow Payments)
-- =============================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id),
  buyer_id UUID NOT NULL REFERENCES profiles(id),
  seller_id UUID NOT NULL REFERENCES profiles(id),
  amount_cents INTEGER NOT NULL,
  commission_cents INTEGER NOT NULL,
  seller_earns_cents INTEGER NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded', 'disputed')),
  shipping_tracking TEXT,
  buyer_confirmed_receipt BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_listing ON orders(listing_id);
CREATE INDEX idx_orders_status ON orders(status);

-- =============================================
-- 6. CONVERSATIONS (Messaging module)
-- =============================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_conversations_listing ON conversations(listing_id);
CREATE INDEX idx_conversations_order ON conversations(order_id);
CREATE INDEX idx_conversations_last ON conversations(last_message_at DESC);

-- =============================================
-- 7. CONVERSATION_MEMBERS
-- =============================================
CREATE TABLE conversation_members (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  last_read_message_id UUID,
  unread_count INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX idx_conversation_members_user ON conversation_members(user_id);

-- =============================================
-- 8. MESSAGES (WhatsApp-level via Realtime)
-- =============================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'audio', 'offer', 'system')),
  content TEXT NOT NULL,
  attachment_url TEXT,
  attachment_duration INTEGER,  -- for audio: seconds
  offer_cents INTEGER,          -- for offer messages
  offer_status TEXT CHECK (offer_status IN ('pending', 'accepted', 'declined', 'countered')),
  reply_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- =============================================
-- 9. MESSAGE_READS
-- =============================================
CREATE TABLE message_reads (
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);

-- =============================================
-- 10. MESSAGE_REACTIONS
-- =============================================
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);

-- =============================================
-- 11. DELIVERY_LOGISTICS
-- =============================================
CREATE TABLE delivery_logistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  pickup_address TEXT,
  pickup_lat DECIMAL(10,8),
  pickup_lng DECIMAL(11,8),
  dropoff_address TEXT,
  dropoff_lat DECIMAL(10,8),
  dropoff_lng DECIMAL(11,8),
  estimated_distance_km DECIMAL(8,2),
  estimated_fee_cents INTEGER,
  delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'picked_up', 'in_transit', 'delivered', 'cancelled')),
  courier_name TEXT,
  courier_phone TEXT,
  tracking_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_delivery_order ON delivery_logistics(order_id);
CREATE INDEX idx_delivery_tracking ON delivery_logistics(tracking_number);

-- =============================================
-- 12. REVIEWS
-- =============================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  reviewee_id UUID NOT NULL REFERENCES profiles(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(order_id, reviewer_id)
);

CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_reviews_order ON reviews(order_id);

-- =============================================
-- 13. USER_FAVORITES (bookmarks)
-- =============================================
CREATE TABLE user_favorites (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, listing_id)
);

CREATE INDEX idx_favorites_user ON user_favorites(user_id);

-- =============================================
-- 14. DISPUTES
-- =============================================
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  opened_by UUID NOT NULL REFERENCES profiles(id),
  reason TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'rejected')),
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_disputes_order ON disputes(order_id);
CREATE INDEX idx_disputes_status ON disputes(status);

-- =============================================
-- 15. NOTIFICATIONS
-- =============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('order_status', 'message', 'review', 'offer', 'system', 'dispute', 'logistics')),
  title TEXT,
  content TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- =============================================
-- 16. AI_CONVERSATIONS (AI Assistant module)
-- =============================================
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Chat',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_conv_user ON ai_conversations(user_id, updated_at DESC);

-- =============================================
-- 17. AI_MESSAGES
-- =============================================
CREATE TABLE ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_msg_conversation ON ai_messages(conversation_id, created_at);

-- =============================================
-- 18. ANALYTICS_DAILY (for dashboard charts)
-- =============================================
CREATE TABLE analytics_daily (
  date DATE NOT NULL,
  metric TEXT NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  value INTEGER DEFAULT 0,
  PRIMARY KEY (date, metric, category_id)
);

CREATE INDEX idx_analytics_date ON analytics_daily(date DESC);

-- =============================================
-- 19. TRUST_VERIFICATION
-- =============================================
CREATE TABLE trust_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('phone', 'id', 'email', 'address', 'business')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  document_url TEXT,
  document_type TEXT,
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_trust_user ON trust_verification(user_id, verification_type);

-- =============================================
-- 20. REPORTS (user-to-user or listing reports)
-- =============================================
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id),
  reported_listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  reported_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'resolved', 'dismissed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_reports_status ON reports(status);

-- =============================================
-- 21. BUSINESS_SERVICES (for Business Services module)
-- =============================================
CREATE TABLE business_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  price_type TEXT DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'hourly', 'negotiable')),
  location_city TEXT,
  is_remote BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  rating_avg DECIMAL(2,1) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_business_services_provider ON business_services(provider_id);
CREATE INDEX idx_business_services_category ON business_services(category);
CREATE INDEX idx_business_services_status ON business_services(status);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_logistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_services ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PROFILES POLICIES
-- =============================================
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================
-- CATEGORIES POLICIES
-- =============================================
CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT USING (true);

CREATE POLICY "Authenticated can insert categories"
  ON categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =============================================
-- LISTINGS POLICIES
-- =============================================
CREATE POLICY "Active listings are viewable by everyone"
  ON listings FOR SELECT USING (
    status = 'active' OR seller_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Sellers can create listings"
  ON listings FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own listings"
  ON listings FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete own listings"
  ON listings FOR DELETE USING (auth.uid() = seller_id);

CREATE POLICY "Admins can moderate all listings"
  ON listings FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- =============================================
-- LISTING_IMAGES POLICIES
-- =============================================
CREATE POLICY "Listing images viewable with listing"
  ON listing_images FOR SELECT USING (true);

CREATE POLICY "Sellers can insert images for own listings"
  ON listing_images FOR INSERT WITH CHECK (
    auth.uid() = (SELECT seller_id FROM listings WHERE id = listing_images.listing_id)
  );

CREATE POLICY "Sellers can delete own listing images"
  ON listing_images FOR DELETE USING (
    auth.uid() = (SELECT seller_id FROM listings WHERE id = listing_images.listing_id)
  );

-- =============================================
-- ORDERS POLICIES
-- =============================================
CREATE POLICY "Order participants can view"
  ON orders FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Buyers can confirm receipt"
  ON orders FOR UPDATE USING (auth.uid() = buyer_id);

-- =============================================
-- CONVERSATIONS POLICIES
-- =============================================
CREATE POLICY "Conversation members can view"
  ON conversations FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_members
      WHERE conversation_id = conversations.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create conversations"
  ON conversations FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =============================================
-- CONVERSATION_MEMBERS POLICIES
-- =============================================
CREATE POLICY "Conversation members can view"
  ON conversation_members FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can join conversations"
  ON conversation_members FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can update own read status"
  ON conversation_members FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- MESSAGES POLICIES
-- =============================================
CREATE POLICY "Conversation participants can read messages"
  ON messages FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_members
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Conversation participants can send messages"
  ON messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversation_members
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Sender can edit/delete own messages"
  ON messages FOR UPDATE USING (auth.uid() = sender_id);

-- =============================================
-- MESSAGE_READS POLICIES
-- =============================================
CREATE POLICY "Conversation participants can read"
  ON message_reads FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_members cm ON m.conversation_id = cm.conversation_id
      WHERE m.id = message_reads.message_id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can mark messages as read"
  ON message_reads FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- MESSAGE_REACTIONS POLICIES
-- =============================================
CREATE POLICY "Conversation participants can view reactions"
  ON message_reactions FOR SELECT USING (true);

CREATE POLICY "Conversation participants can react"
  ON message_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions"
  ON message_reactions FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- DELIVERY_LOGISTICS POLICIES
-- =============================================
CREATE POLICY "Order participants can view delivery"
  ON delivery_logistics FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders WHERE id = delivery_logistics.order_id
      AND (buyer_id = auth.uid() OR seller_id = auth.uid())
    )
  );

CREATE POLICY "Sellers can create delivery"
  ON delivery_logistics FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders WHERE id = delivery_logistics.order_id AND seller_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can update delivery"
  ON delivery_logistics FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM orders WHERE id = delivery_logistics.order_id AND seller_id = auth.uid()
    )
  );

-- =============================================
-- REVIEWS POLICIES
-- =============================================
CREATE POLICY "Reviews are viewable by everyone"
  ON reviews FOR SELECT USING (true);

CREATE POLICY "Buyers can create reviews for their orders"
  ON reviews FOR INSERT WITH CHECK (
    auth.uid() = reviewer_id AND
    auth.uid() = (SELECT buyer_id FROM orders WHERE id = reviews.order_id)
  );

-- =============================================
-- USER_FAVORITES POLICIES
-- =============================================
CREATE POLICY "Users can view own favorites"
  ON user_favorites FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON user_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own favorites"
  ON user_favorites FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- DISPUTES POLICIES
-- =============================================
CREATE POLICY "Dispute participants can view"
  ON disputes FOR SELECT USING (
    auth.uid() = opened_by OR
    auth.uid() = (SELECT buyer_id FROM orders WHERE id = disputes.order_id) OR
    auth.uid() = (SELECT seller_id FROM orders WHERE id = disputes.order_id) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Order participants can open disputes"
  ON disputes FOR INSERT WITH CHECK (
    auth.uid() = opened_by AND (
      auth.uid() = (SELECT buyer_id FROM orders WHERE id = disputes.order_id) OR
      auth.uid() = (SELECT seller_id FROM orders WHERE id = disputes.order_id)
    )
  );

CREATE POLICY "Admins can resolve disputes"
  ON disputes FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- =============================================
-- NOTIFICATIONS POLICIES
-- =============================================
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- AI_CONVERSATIONS POLICIES
-- =============================================
CREATE POLICY "Users can view own AI conversations"
  ON ai_conversations FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create AI conversations"
  ON ai_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI conversations"
  ON ai_conversations FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own AI conversations"
  ON ai_conversations FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- AI_MESSAGES POLICIES
-- =============================================
CREATE POLICY "Users can view own AI messages"
  ON ai_messages FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ai_conversations WHERE id = ai_messages.conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert AI messages"
  ON ai_messages FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_conversations WHERE id = ai_messages.conversation_id AND user_id = auth.uid()
    )
  );

-- =============================================
-- ANALYTICS_DAILY POLICIES
-- =============================================
CREATE POLICY "Everyone can view analytics"
  ON analytics_daily FOR SELECT USING (true);

-- =============================================
-- TRUST_VERIFICATION POLICIES
-- =============================================
CREATE POLICY "Users can view own verifications"
  ON trust_verification FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can submit verifications"
  ON trust_verification FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update verifications"
  ON trust_verification FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- =============================================
-- REPORTS POLICIES
-- =============================================
CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports"
  ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
  ON reports FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update reports"
  ON reports FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- =============================================
-- BUSINESS_SERVICES POLICIES
-- =============================================
CREATE POLICY "Active services viewable by everyone"
  ON business_services FOR SELECT USING (status = 'active' OR provider_id = auth.uid());

CREATE POLICY "Providers can create services"
  ON business_services FOR INSERT WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can update own services"
  ON business_services FOR UPDATE USING (auth.uid() = provider_id);

CREATE POLICY "Providers can delete own services"
  ON business_services FOR DELETE USING (auth.uid() = provider_id);

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update profile rating on new review
CREATE OR REPLACE FUNCTION public.update_profile_rating()
RETURNS trigger AS $$
BEGIN
  UPDATE profiles
  SET
    rating_avg = sub.avg_rating,
    rating_count = sub.cnt
  FROM (
    SELECT AVG(rating)::DECIMAL(2,1) as avg_rating, COUNT(*) as cnt
    FROM reviews
    WHERE reviewee_id = NEW.reviewee_id
  ) sub
  WHERE id = NEW.reviewee_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_created ON reviews;
CREATE TRIGGER on_review_created
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_rating();

-- Update conversation last_message_at on new message
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS trigger AS $$
BEGIN
  UPDATE conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_created ON messages;
CREATE TRIGGER on_message_created
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION public.update_conversation_timestamp();

-- Update listing views counter
CREATE OR REPLACE FUNCTION public.increment_listing_views()
RETURNS trigger AS $$
BEGIN
  UPDATE listings SET views = views + 1 WHERE id = NEW.listing_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =============================================
-- PUSH NOTIFICATIONS (Web Push subscriptions)
-- =============================================
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);

-- RLS: Users can only see/manage their own subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own push subscriptions"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own push subscriptions"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- STORAGE BUCKET: listing-images
-- Run this in Supabase Dashboard SQL editor or via Management API:
--
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'listing-images',
--   'listing-images',
--   true,
--   5242880,  -- 5MB
--   ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
-- );
--
-- Storage RLS Policies:
-- CREATE POLICY "Anyone can view listing images" ON storage.objects
--   FOR SELECT USING (bucket_id = 'listing-images');
-- CREATE POLICY "Authenticated users can upload listing images" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'listing-images' AND auth.role() = 'authenticated');
-- CREATE POLICY "Owners can delete their listing images" ON storage.objects
--   FOR DELETE USING (bucket_id = 'listing-images');
-- =============================================
