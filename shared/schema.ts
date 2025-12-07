import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, sql } from "drizzle-orm";

// Discord messages captured from monitored channels
export const messages = sqliteTable("messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  discordMessageId: text("discord_message_id").notNull().unique(),
  content: text("content").notNull(),
  authorId: text("author_id").notNull(),
  authorUsername: text("author_username").notNull(),
  authorAvatar: text("author_avatar"),
  channelId: text("channel_id").notNull(),
  channelName: text("channel_name").notNull(),
  serverId: text("server_id").notNull(),
  serverName: text("server_name").notNull(),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
  hasAttachments: integer("has_attachments", { mode: "boolean" }).default(false),
  attachmentUrls: text("attachment_urls"), // JSON string for SQLite
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

// Bot configuration - which servers/channels to monitor
export const botConfig = sqliteTable("bot_config", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  serverId: text("server_id").notNull(),
  serverName: text("server_name").notNull(),
  channelId: text("channel_id").notNull(),
  channelName: text("channel_name").notNull(),
  backupChannelId: text("backup_channel_id"),
  backupChannelName: text("backup_channel_name"),
  monitorUserId: text("monitor_user_id").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

// Weekly backup history
export const backups = sqliteTable("backups", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  messageCount: integer("message_count").notNull(),
  backupDate: integer("backup_date", { mode: "timestamp" }).notNull(),
  channelId: text("channel_id").notNull(),
  status: text("status").notNull().default("completed"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

// Relations
export const messagesRelations = relations(messages, ({ }) => ({}));
export const botConfigRelations = relations(botConfig, ({ }) => ({}));
export const backupsRelations = relations(backups, ({ }) => ({}));

// Insert schemas
export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertBotConfigSchema = createInsertSchema(botConfig).omit({
  id: true,
  createdAt: true,
});

export const insertBackupSchema = createInsertSchema(backups).omit({
  id: true,
  createdAt: true,
});

// Types
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type BotConfig = typeof botConfig.$inferSelect;
export type InsertBotConfig = z.infer<typeof insertBotConfigSchema>;

export type Backup = typeof backups.$inferSelect;
export type InsertBackup = z.infer<typeof insertBackupSchema>;

// Legacy user types (keeping for compatibility)
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
