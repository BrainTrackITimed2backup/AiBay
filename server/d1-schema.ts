export const D1_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_url TEXT NOT NULL,
  generated_title TEXT NOT NULL,
  generated_html TEXT NOT NULL,
  images TEXT NOT NULL,
  raw_data TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  item_specifics TEXT,
  suggested_categories TEXT,
  title_score TEXT,
  processed_images TEXT,
  lifestyle_images TEXT,
  image_metadata TEXT,
  source_data TEXT,
  bulk_group_id TEXT
);

CREATE TABLE IF NOT EXISTS bulk_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  status TEXT NOT NULL DEFAULT 'pending',
  total_urls INTEGER NOT NULL DEFAULT 0,
  completed_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  results TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS watchlist_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_title TEXT NOT NULL,
  product_url TEXT,
  image_url TEXT,
  search_keyword TEXT,
  target_price TEXT,
  current_avg_price TEXT,
  sell_through_rate TEXT,
  notes TEXT,
  marketplace TEXT DEFAULT 'EBAY-US',
  last_checked_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS tracked_sellers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  feedback_score INTEGER,
  positive_feedback_percent TEXT,
  total_listings INTEGER,
  top_categories TEXT,
  avg_price TEXT,
  snapshot_data TEXT,
  last_checked_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS keyword_searches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query TEXT NOT NULL,
  marketplace TEXT NOT NULL DEFAULT 'EBAY-US',
  results TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS supplier_searches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query TEXT NOT NULL,
  results TEXT,
  result_count INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS profit_scenarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL DEFAULT 'Untitled Scenario',
  inputs TEXT NOT NULL,
  outputs TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  blocks TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  versions TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS admin_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_name TEXT NOT NULL DEFAULT 'AIBAY',
  support_email TEXT NOT NULL DEFAULT 'support@aibay.app',
  registration_enabled INTEGER NOT NULL DEFAULT 1,
  maintenance_mode INTEGER NOT NULL DEFAULT 0,
  default_trial_days INTEGER NOT NULL DEFAULT 14,
  trial_price_usd TEXT NOT NULL DEFAULT '1.00',
  enable_wise_payments INTEGER NOT NULL DEFAULT 0,
  feature_flags TEXT,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS subscription_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  price_usd TEXT NOT NULL DEFAULT '0.00',
  billing_interval TEXT NOT NULL DEFAULT 'monthly',
  trial_days INTEGER NOT NULL DEFAULT 14,
  is_active INTEGER NOT NULL DEFAULT 1,
  features TEXT,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_watchlist_items_created_at ON watchlist_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_keyword_searches_created_at ON keyword_searches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_supplier_searches_created_at ON supplier_searches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profit_scenarios_created_at ON profit_scenarios(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_templates_created_at ON templates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_slug ON subscription_plans(slug);
`;
