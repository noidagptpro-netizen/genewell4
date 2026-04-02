-- GeneWell Pro Subscription Tables

-- Subscription Plans
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  price_inr DECIMAL(10, 2) NOT NULL,
  billing_cycle VARCHAR(20) DEFAULT 'monthly', -- monthly, quarterly, annual
  trial_days INT DEFAULT 7,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Subscription Products (Core + Add-ons)
CREATE TABLE subscription_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  description TEXT,
  category VARCHAR(50), -- 'core', 'addon', 'coaching'
  icon VARCHAR(100),
  price_inr DECIMAL(10, 2) DEFAULT 0,
  is_addon BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Features for Plans
CREATE TABLE plan_features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE CASCADE,
  feature_name VARCHAR(200) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  is_included BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- FAQs
CREATE TABLE subscription_faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(100), -- 'general', 'billing', 'features', 'cancellation'
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Comparison Table Data
CREATE TABLE plan_comparison (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name VARCHAR(200) NOT NULL,
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE CASCADE,
  value VARCHAR(500),
  icon VARCHAR(100),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add-ons Mapping
CREATE TABLE plan_addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE CASCADE,
  product_id UUID REFERENCES subscription_products(id) ON DELETE CASCADE,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Subscribers
CREATE TABLE subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL,
  name VARCHAR(100),
  phone VARCHAR(20),
  plan_id UUID REFERENCES subscription_plans(id),
  status VARCHAR(50) DEFAULT 'active', -- active, trial, paused, cancelled
  subscription_start TIMESTAMP,
  subscription_end TIMESTAMP,
  trial_end TIMESTAMP,
  is_trial BOOLEAN DEFAULT false,
  instamojo_order_id VARCHAR(100),
  instamojo_transaction_id VARCHAR(100),
  payment_method VARCHAR(50), -- 'instamojo', 'direct'
  last_payment TIMESTAMP,
  next_renewal TIMESTAMP,
  auto_renew BOOLEAN DEFAULT true,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Subscriber Add-ons
CREATE TABLE subscriber_addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES subscription_products(id),
  added_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Invoices
CREATE TABLE subscription_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) UNIQUE,
  amount_inr DECIMAL(10, 2) NOT NULL,
  tax_inr DECIMAL(10, 2) DEFAULT 0,
  total_inr DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed, refunded
  instamojo_transaction_id VARCHAR(100),
  due_date DATE,
  paid_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Promo Codes / Launch Offers
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  discount_type VARCHAR(20), -- 'percentage', 'fixed'
  discount_value DECIMAL(10, 2),
  max_uses INT,
  current_uses INT DEFAULT 0,
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Webhook Logs
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(100),
  provider VARCHAR(50), -- 'instamojo'
  payload JSONB,
  status VARCHAR(50), -- 'success', 'failed'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_subscribers_user_id ON subscribers(user_id);
CREATE INDEX idx_subscribers_status ON subscribers(status);
CREATE INDEX idx_subscribers_plan_id ON subscribers(plan_id);
CREATE INDEX idx_subscribers_email ON subscribers(email);
CREATE INDEX idx_invoices_subscriber_id ON subscription_invoices(subscriber_id);
CREATE INDEX idx_invoices_status ON subscription_invoices(status);
CREATE INDEX idx_plan_features_plan_id ON plan_features(plan_id);
CREATE INDEX idx_webhook_logs_created ON webhook_logs(created_at);

-- Initial Data: Plans
INSERT INTO subscription_plans (name, slug, description, price_inr, trial_days) VALUES
  ('GeneWell Pro', 'pro', 'Full personalized wellness blueprint with monthly updates', 1999, 7),
  ('GeneWell Elite', 'elite', 'Pro + 1 coaching call/month + priority support', 4999, 7),
  ('GeneWell Expert', 'expert', 'Elite + 4 coaching calls/month + DNA analysis', 9999, 7);

-- Initial Data: Core Products
INSERT INTO subscription_products (name, description, category, icon, is_addon) VALUES
  ('Personalized Blueprint', 'Your AI-generated 90-day wellness plan', 'core', 'FileText', false),
  ('Monthly Updates', '4 blueprint revisions per month based on progress', 'core', 'RefreshCw', false),
  ('Progress Tracking', 'App integration + habit tracking dashboard', 'core', 'BarChart3', false),
  ('Expert Support', 'Email + chat support from wellness experts', 'core', 'HeartHandshake', false),
  ('DNA Analysis', 'Genetic predisposition analysis (add-on)', 'addon', 'Dna', true),
  ('Supplement Stack', 'Personalized supplement recommendations (add-on)', 'addon', 'Pill', true),
  ('Meal Prep Guide', 'Weekly meal prep templates (add-on)', 'addon', 'UtensilsCrossed', true),
  ('Athletic Performance', 'Sports-specific optimization (add-on)', 'addon', 'Zap', true);

-- Initial Data: Launch Offer (45-day special)
INSERT INTO promo_codes (code, description, discount_type, discount_value, valid_from, valid_until, max_uses) VALUES
  ('LAUNCH45', '45% off first 3 months', 'percentage', 45, NOW(), NOW() + INTERVAL '45 days', 1000);
