import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── Listings ───────────────────────────────────────────────────────────────
export const listings = sqliteTable("listings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productUrl: text("product_url").notNull(),
  generatedTitle: text("generated_title").notNull(),
  generatedHtml: text("generated_html").notNull(),
  images: text("images", { mode: "json" }).$type<string[]>().notNull(),
  rawData: text("raw_data", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  itemSpecifics: text("item_specifics", { mode: "json" }),
  suggestedCategories: text("suggested_categories", { mode: "json" }),
  titleScore: text("title_score", { mode: "json" }),
  processedImages: text("processed_images", { mode: "json" }),
  lifestyleImages: text("lifestyle_images", { mode: "json" }).$type<string[] | null>(),
  imageMetadata: text("image_metadata", { mode: "json" }),
  sourceData: text("source_data", { mode: "json" }),
  bulkGroupId: text("bulk_group_id"),
});

export const insertListingSchema = createInsertSchema(listings).omit({
  id: true,
  createdAt: true,
}).extend({
  rawData: z.any().optional(),
  images: z.array(z.string()),
  itemSpecifics: z.any().optional(),
  suggestedCategories: z.any().optional(),
  titleScore: z.any().optional(),
  processedImages: z.any().optional(),
  lifestyleImages: z.array(z.string()).optional(),
  imageMetadata: z.any().optional(),
  sourceData: z.any().optional(),
  bulkGroupId: z.string().optional(),
});

export type Listing = typeof listings.$inferSelect;
export type InsertListing = z.infer<typeof insertListingSchema>;

// ─── Bulk Jobs ────────────────────────────────────────────────────────────────
export const bulkJobs = sqliteTable("bulk_jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  status: text("status").notNull().default("pending"),
  totalUrls: integer("total_urls").notNull().default(0),
  completedCount: integer("completed_count").notNull().default(0),
  failedCount: integer("failed_count").notNull().default(0),
  results: text("results", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const insertBulkJobSchema = createInsertSchema(bulkJobs).omit({
  id: true,
  createdAt: true,
}).extend({
  results: z.any().optional(),
});

export type BulkJob = typeof bulkJobs.$inferSelect;
export type InsertBulkJob = z.infer<typeof insertBulkJobSchema>;

// ─── Watchlist Items ─────────────────────────────────────────────────────────
export const watchlistItems = sqliteTable("watchlist_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productTitle: text("product_title").notNull(),
  productUrl: text("product_url"),
  imageUrl: text("image_url"),
  searchKeyword: text("search_keyword"),
  targetPrice: text("target_price"),
  currentAvgPrice: text("current_avg_price"),
  sellThroughRate: text("sell_through_rate"),
  notes: text("notes"),
  marketplace: text("marketplace").default("EBAY-US"),
  lastCheckedAt: integer("last_checked_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const insertWatchlistSchema = createInsertSchema(watchlistItems).omit({
  id: true,
  createdAt: true,
});

export type WatchlistItem = typeof watchlistItems.$inferSelect;
export type InsertWatchlistItem = z.infer<typeof insertWatchlistSchema>;

// ─── Tracked Sellers ─────────────────────────────────────────────────────────
export const trackedSellers = sqliteTable("tracked_sellers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull(),
  feedbackScore: integer("feedback_score"),
  positiveFeedbackPercent: text("positive_feedback_percent"),
  totalListings: integer("total_listings"),
  topCategories: text("top_categories", { mode: "json" }).$type<string[] | null>(),
  avgPrice: text("avg_price"),
  snapshotData: text("snapshot_data", { mode: "json" }),
  lastCheckedAt: integer("last_checked_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const insertTrackedSellerSchema = createInsertSchema(trackedSellers).omit({
  id: true,
  createdAt: true,
}).extend({
  topCategories: z.array(z.string()).optional().nullable(),
  snapshotData: z.any().optional().nullable(),
});

export type TrackedSeller = typeof trackedSellers.$inferSelect;
export type InsertTrackedSeller = z.infer<typeof insertTrackedSellerSchema>;

// ─── Keyword Searches ────────────────────────────────────────────────────────
export const keywordSearches = sqliteTable("keyword_searches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  query: text("query").notNull(),
  marketplace: text("marketplace").notNull().default("EBAY-US"),
  results: text("results", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const insertKeywordSearchSchema = createInsertSchema(keywordSearches).omit({
  id: true,
  createdAt: true,
}).extend({
  results: z.any().optional().nullable(),
});

export type KeywordSearch = typeof keywordSearches.$inferSelect;
export type InsertKeywordSearch = z.infer<typeof insertKeywordSearchSchema>;

// ─── Supplier Searches ────────────────────────────────────────────────────────
export const supplierSearches = sqliteTable("supplier_searches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  query: text("query").notNull(),
  results: text("results", { mode: "json" }),
  resultCount: integer("result_count").default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const insertSupplierSearchSchema = createInsertSchema(supplierSearches).omit({
  id: true,
  createdAt: true,
}).extend({
  results: z.any().optional(),
});

export type SupplierSearch = typeof supplierSearches.$inferSelect;
export type InsertSupplierSearch = z.infer<typeof insertSupplierSearchSchema>;

// ─── Profit Scenarios ─────────────────────────────────────────────────────────
export const profitScenarios = sqliteTable("profit_scenarios", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().default("Untitled Scenario"),
  inputs: text("inputs", { mode: "json" }).notNull(),
  outputs: text("outputs", { mode: "json" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const insertProfitScenarioSchema = createInsertSchema(profitScenarios).omit({
  id: true,
  createdAt: true,
}).extend({
  inputs: z.any(),
  outputs: z.any(),
});

export type ProfitScenario = typeof profitScenarios.$inferSelect;
export type InsertProfitScenario = z.infer<typeof insertProfitScenarioSchema>;

// ─── Templates ────────────────────────────────────────────────────────────────
export const templates = sqliteTable("templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  blocks: text("blocks", { mode: "json" }).notNull(),
  isDefault: integer("is_default", { mode: "boolean" }).default(false),
  versions: text("versions", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  blocks: z.any(),
  versions: z.any().optional(),
  isDefault: z.boolean().optional(),
});

export type Template = typeof templates.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;

// ─── Admin Settings ──────────────────────────────────────────────────────────
export const adminSettings = sqliteTable("admin_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  siteName: text("site_name").notNull().default("AIBAY"),
  supportEmail: text("support_email").notNull().default("support@aibay.app"),
  registrationEnabled: integer("registration_enabled", { mode: "boolean" }).notNull().default(true),
  maintenanceMode: integer("maintenance_mode", { mode: "boolean" }).notNull().default(false),
  defaultTrialDays: integer("default_trial_days").notNull().default(14),
  trialPriceUsd: text("trial_price_usd").notNull().default("1.00"),
  enableWisePayments: integer("enable_wise_payments", { mode: "boolean" }).notNull().default(false),
  featureFlags: text("feature_flags", { mode: "json" }),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const insertAdminSettingsSchema = createInsertSchema(adminSettings).omit({
  id: true,
  updatedAt: true,
}).extend({
  featureFlags: z.record(z.boolean()).optional(),
});

export type AdminSettings = typeof adminSettings.$inferSelect;
export type InsertAdminSettings = z.infer<typeof insertAdminSettingsSchema>;

// ─── Subscription Plans ──────────────────────────────────────────────────────
export const subscriptionPlans = sqliteTable("subscription_plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  priceUsd: text("price_usd").notNull().default("0.00"),
  billingInterval: text("billing_interval").notNull().default("monthly"),
  trialDays: integer("trial_days").notNull().default(14),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  features: text("features", { mode: "json" }),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  updatedAt: true,
  createdAt: true,
}).extend({
  features: z.array(z.string()).optional(),
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;

// ─── Request/Response Schemas ────────────────────────────────────────────────
export const generateRequestSchema = z.object({
  productUrl: z.string().url("Must be a valid URL"),
  titleOverride: z.string().max(80).optional(),
});

export type GenerateRequest = z.infer<typeof generateRequestSchema>;
export type GenerateResponse = Listing;
