import {
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
  boolean,
  uuid,
  real,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import type { AdapterAccountType } from "next-auth/adapters";

// --- NEXTAUTH TABLES ---

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  passwordHash: text("password_hash"),
  // Custom Fields from original 'profiles' table
  stripeCustomerId: text("stripe_customer_id").unique(),
  subscriptionTier: text("subscription_tier").notNull().default("free"), // enum ('free', 'starter', 'pro')
  role: text("role").notNull().default("user"), // 'user', 'admin', 'developer'
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  })
);

// --- APP TABLES (From supabase_setup.sql) ---

export const businesses = pgTable("businesses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  industry: text("industry").notNull().default("general"),
  tone: text("tone").notNull().default("professional"), // 'professional', 'friendly', 'casual', 'empathetic'
  keywords: text("keywords").array().default([]), // For text[] default '{}', use array in Postgres. In Drizzle we map it.
  googleAccountId: text("google_account_id"),
  googleLocationId: text("google_location_id"),
  googleLocationName: text("google_location_name"),
  googleAccessToken: text("google_access_token"),
  googleRefreshToken: text("google_refresh_token"),
  googleTokenExpiry: timestamp("google_token_expiry", { withTimezone: true }),
  googleAccountToken: jsonb("google_account_token"),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  isConnected: boolean("is_connected").notNull().default(false),
  autoRespond: boolean("auto_respond").default(false),
  responseLength: text("response_length").default("medium"), // 'short', 'medium', 'long'
  ownerName: text("owner_name").default(""),
  hipaaMode: boolean("hipaa_mode").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  googleReviewId: text("google_review_id").notNull().unique(),
  reviewerName: text("reviewer_name").notNull().default("Anonymous"),
  reviewerPhotoUrl: text("reviewer_photo_url"),
  starRating: integer("star_rating").notNull(),
  reviewText: text("review_text"),
  reviewReply: text("review_reply"),
  status: text("status").notNull().default("pending"), // 'pending', 'unanswered', 'draft', 'needs_review', 'published', 'skipped', 'auto_published'
  googleCreatedAt: timestamp("google_created_at", { withTimezone: true }),
  reviewDate: timestamp("review_date", { withTimezone: true }), // usually generated, here we can write normally
  syncedAt: timestamp("synced_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const responses = pgTable("responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  reviewId: uuid("review_id")
    .notNull()
    .unique()
    .references(() => reviews.id, { onDelete: "cascade" }),
  businessId: uuid("business_id")
    .references(() => businesses.id, { onDelete: "cascade" }),
  draftText: text("draft_text").notNull(),
  finalText: text("final_text"),
  generatedText: text("generated_text"),
  originalAiText: text("original_ai_text"),
  status: text("status").notNull().default("draft"), // 'draft', 'editing', 'needs_review', 'published'
  aiModel: text("ai_model").notNull().default("claude-sonnet-4-6"),
  generationModel: text("generation_model"),
  generationCount: integer("generation_count").notNull().default(1),
  similarityScore: real("similarity_score"), // FLOAT maps to real or double precision
  qaPassed: boolean("qa_passed").notNull().default(false),
  wasEdited: boolean("was_edited").default(false),
  editDistancePct: integer("edit_distance_pct").default(0),
  publishedWithoutEdit: boolean("published_without_edit").default(false),
  confidenceScore: real("confidence_score"),
  variationScore: real("variation_score"),
  flags: text("flags").array().default([]),
  alternateVersions: text("alternate_versions").array().default([]),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  stripeCustomerId: text("stripe_customer_id"),
  plan: text("plan").notNull().default("free"), // 'free', 'starter', 'pro'
  responsesUsedThisMonth: integer("responses_used_this_month").notNull().default(0),
  responsesThisMonth: integer("responses_this_month"),
  responsesLimit: integer("responses_limit").notNull().default(10),
  periodStart: timestamp("period_start", { withTimezone: true }),
  periodEnd: timestamp("period_end", { withTimezone: true }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  status: text("status").notNull().default("active"), // 'active', 'canceled', 'past_due', 'trialing'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// --- RELATIONS ---
export const usersRelations = relations(users, ({ many }) => ({
  businesses: many(businesses),
  subscriptions: many(subscriptions),
}));

export const businessesRelations = relations(businesses, ({ one, many }) => ({
  user: one(users, {
    fields: [businesses.userId],
    references: [users.id],
  }),
  reviews: many(reviews),
  responses: many(responses),
}));

export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  business: one(businesses, {
    fields: [reviews.businessId],
    references: [businesses.id],
  }),
  responses: many(responses), // Technically 1-1, but structured this way
}));

export const responsesRelations = relations(responses, ({ one }) => ({
  review: one(reviews, {
    fields: [responses.reviewId],
    references: [reviews.id],
  }),
  business: one(businesses, {
    fields: [responses.businessId],
    references: [businesses.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  tags: text("tags").array().default([]),
  lastInteractionAt: timestamp("last_interaction_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const reviewRequests = pgTable("review_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  emailId: text("email_id"),
});

export const otpTokens = pgTable("otp_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  otp: text("otp").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
