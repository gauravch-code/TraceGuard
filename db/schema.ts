import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const agents = sqliteTable("agents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  owner: text("owner").notNull(),
  model: text("model").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const agentKeys = sqliteTable("agent_keys", {
  agentId: integer("agent_id").primaryKey().references(() => agents.id),
  keyHash: text("key_hash").notNull().unique(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const runs = sqliteTable("runs", {
  id: text("id").primaryKey(),
  agentId: integer("agent_id").notNull().references(() => agents.id),
  task: text("task").notNull(),
  status: text("status").notNull(),
  durationMs: integer("duration_ms").notNull(),
  costUsd: integer("cost_microusd").notNull().default(0),
  stepsJson: text("steps_json").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_runs_created_at").on(table.createdAt), index("idx_runs_agent_created_at").on(table.agentId, table.createdAt)]);

export const supportDailyUsage = sqliteTable("support_daily_usage", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  day: text("day").notNull(),
  used: integer("used").notNull().default(0),
});

export const supportReviews = sqliteTable("support_reviews", {
  runId: text("run_id").primaryKey().references(() => runs.id),
  decision: text("decision").notNull(),
  note: text("note").notNull().default(""),
  reviewerId: text("reviewer_id").notNull(),
  reviewerEmail: text("reviewer_email").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_support_reviews_created_at").on(table.createdAt)]);

export const incidentActions = sqliteTable("incident_actions", {
  incidentId: text("incident_id").primaryKey(),
  status: text("status").notNull().default("open"),
  owner: text("owner").notNull().default("Unassigned"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_incident_actions_status").on(table.status)]);
