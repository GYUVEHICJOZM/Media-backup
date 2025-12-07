import { 
  messages, 
  botConfig, 
  backups,
  users,
  type Message, 
  type InsertMessage, 
  type BotConfig, 
  type InsertBotConfig,
  type Backup,
  type InsertBackup,
  type User, 
  type InsertUser 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Messages
  getAllMessages(): Promise<Message[]>;
  getMessage(id: string): Promise<Message | undefined>;
  getMessageByDiscordId(discordMessageId: string): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  deleteMessage(id: string): Promise<void>;

  // Bot Config
  getAllConfigs(): Promise<BotConfig[]>;
  getActiveConfigs(): Promise<BotConfig[]>;
  getConfig(id: string): Promise<BotConfig | undefined>;
  createConfig(config: InsertBotConfig): Promise<BotConfig>;
  updateConfig(id: string, updates: Partial<BotConfig>): Promise<BotConfig | undefined>;
  deleteConfig(id: string): Promise<void>;

  // Backups
  getAllBackups(): Promise<Backup[]>;
  getBackup(id: string): Promise<Backup | undefined>;
  createBackup(backup: InsertBackup): Promise<Backup>;
}

// Helper to parse attachment URLs from JSON string
function parseAttachmentUrls(urls: string | null): string[] | null {
  if (!urls) return null;
  try {
    return JSON.parse(urls);
  } catch {
    return null;
  }
}

// Helper to convert message with parsed attachments
function parseMessage(msg: any): Message {
  return {
    ...msg,
    attachmentUrls: typeof msg.attachmentUrls === 'string' 
      ? parseAttachmentUrls(msg.attachmentUrls) 
      : msg.attachmentUrls,
  };
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Messages
  async getAllMessages(): Promise<Message[]> {
    const msgs = await db.select().from(messages).orderBy(desc(messages.timestamp));
    return msgs.map(parseMessage);
  }

  async getMessage(id: string): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message ? parseMessage(message) : undefined;
  }

  async getMessageByDiscordId(discordMessageId: string): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.discordMessageId, discordMessageId));
    return message ? parseMessage(message) : undefined;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    // Convert attachmentUrls array to JSON string for SQLite
    const messageToInsert = {
      ...insertMessage,
      attachmentUrls: insertMessage.attachmentUrls 
        ? JSON.stringify(insertMessage.attachmentUrls) 
        : null,
    };
    
    const [message] = await db.insert(messages).values(messageToInsert as any).returning();
    return parseMessage(message);
  }

  async deleteMessage(id: string): Promise<void> {
    await db.delete(messages).where(eq(messages.id, id));
  }

  // Bot Config
  async getAllConfigs(): Promise<BotConfig[]> {
    return db.select().from(botConfig).orderBy(desc(botConfig.createdAt));
  }

  async getActiveConfigs(): Promise<BotConfig[]> {
    return db.select().from(botConfig).where(eq(botConfig.isActive, true));
  }

  async getConfig(id: string): Promise<BotConfig | undefined> {
    const [config] = await db.select().from(botConfig).where(eq(botConfig.id, id));
    return config || undefined;
  }

  async createConfig(insertConfig: InsertBotConfig): Promise<BotConfig> {
    const [config] = await db.insert(botConfig).values(insertConfig).returning();
    return config;
  }

  async updateConfig(id: string, updates: Partial<BotConfig>): Promise<BotConfig | undefined> {
    const [config] = await db
      .update(botConfig)
      .set(updates)
      .where(eq(botConfig.id, id))
      .returning();
    return config || undefined;
  }

  async deleteConfig(id: string): Promise<void> {
    await db.delete(botConfig).where(eq(botConfig.id, id));
  }

  // Backups
  async getAllBackups(): Promise<Backup[]> {
    return db.select().from(backups).orderBy(desc(backups.backupDate));
  }

  async getBackup(id: string): Promise<Backup | undefined> {
    const [backup] = await db.select().from(backups).where(eq(backups.id, id));
    return backup || undefined;
  }

  async createBackup(insertBackup: InsertBackup): Promise<Backup> {
    const [backup] = await db.insert(backups).values(insertBackup).returning();
    return backup;
  }
}

export const storage = new DatabaseStorage();
