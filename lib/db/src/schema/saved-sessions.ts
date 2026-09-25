import { pgTable, text, integer, boolean, jsonb, timestamp, primaryKey, uniqueIndex } from "drizzle-orm/pg-core";

export const sessionTeams = pgTable("session_teams", {
  id: text("id").primaryKey(), name: text("name").notNull(),
});
export const sessionMembers = pgTable("session_members", {
  teamId: text("team_id").notNull().references(() => sessionTeams.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(), name: text("name").notNull(), role: text("role").notNull(),
}, t => [primaryKey({ columns: [t.teamId, t.userId] })]);
export const sessionInvites = pgTable("session_invites", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull().references(() => sessionTeams.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
}, t => [uniqueIndex("session_invites_team_email").on(t.teamId, t.email)]);
export const savedSessions = pgTable("saved_sessions", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull().references(() => sessionTeams.id, { onDelete: "cascade" }),
  name: text("name").notNull(), workspaceType: text("workspace_type").notNull(),
  schemaVersion: integer("schema_version").notNull(), revision: integer("revision").notNull(),
  state: jsonb("state").$type<Record<string, unknown>>().notNull(),
  thumbnailAssetId: text("thumbnail_asset_id"),
  archived: boolean("archived").notNull().default(false),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdByName: text("created_by_name").notNull(), updatedByName: text("updated_by_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export const sessionVersions = pgTable("session_versions", {
  sessionId: text("session_id").notNull().references(() => savedSessions.id, { onDelete: "cascade" }),
  revision: integer("revision").notNull(),
  snapshot: jsonb("snapshot").$type<Record<string, unknown>>().notNull(),
}, t => [primaryKey({ columns: [t.sessionId, t.revision] })]);
export const sessionAssets = pgTable("session_assets", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull().references(() => sessionTeams.id, { onDelete: "cascade" }),
  name: text("name").notNull(), contentType: text("content_type").notNull(),
  size: integer("size").notNull(), objectPath: text("object_path").notNull(),
  ready: boolean("ready").notNull().default(false),
});