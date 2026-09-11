import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const agents = sqliteTable("agents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  owner: text("owner").notNull(),
  model: text("model").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const incidentActions = sqliteTable("incident_actions", {
  incidentId: text("incident_id").primaryKey(),
  status: text("status").notNull().default("open"),
  owner: text("owner").notNull().default("Unassigned"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_incident_actions_status").on(table.status)]);
