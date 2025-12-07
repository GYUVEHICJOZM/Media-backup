import { Client, GatewayIntentBits, Partials, TextChannel, EmbedBuilder } from "discord.js";
import cron from "node-cron";
import { storage } from "./storage";
import type { InsertMessage } from "@shared/schema";

let client: Client | null = null;
let isConnected = false;
let botUsername: string | undefined;

export function initDiscordBot() {
  const token = process.env.DISCORD_BOT_TOKEN;
  
  if (!token) {
    console.log("ADD YO DAMN BOT TOKEN.");
    return;
  }

  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Message, Partials.Channel],
  });

  client.once("ready", () => {
    console.log(`Discord bot logged in as ${client?.user?.tag}`);
    isConnected = true;
    botUsername = client?.user?.username;
    
    // Schedule weekly backup - every Sunday at midnight
    scheduleWeeklyBackup();
  });

  client.on("messageCreate", async (message) => {
    // Ignore bot messages
    if (message.author.bot) return;

    try {
      // Get active configurations
      const configs = await storage.getActiveConfigs();
      
      // Check if this message is from a monitored channel by the configured user
      const matchingConfig = configs.find(
        (config) =>
          config.channelId === message.channel.id &&
          config.monitorUserId === message.author.id
      );

      if (!matchingConfig) return;

      // Check if message has attachments (media)
      const hasMedia = message.attachments.size > 0;
      
      // Only save if there's media OR content
      if (!hasMedia && !message.content) return;

      // Extract attachment URLs
      const attachmentUrls = message.attachments.map((att) => att.url);

      // Check if message already exists
      const existing = await storage.getMessageByDiscordId(message.id);
      if (existing) return;

      // Save the message with media
      const messageData: InsertMessage = {
        discordMessageId: message.id,
        content: message.content || "",
        authorId: message.author.id,
        authorUsername: message.author.username,
        authorAvatar: message.author.displayAvatarURL(),
        channelId: message.channel.id,
        channelName: (message.channel as TextChannel).name || "unknown",
        serverId: message.guild?.id || "",
        serverName: message.guild?.name || "Unknown Server",
        timestamp: message.createdAt,
        hasAttachments: hasMedia,
        attachmentUrls: attachmentUrls.length > 0 ? attachmentUrls : null,
      };

      await storage.createMessage(messageData);
      console.log(`Saved media message from ${message.author.username} in #${(message.channel as TextChannel).name}`);
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  client.on("error", (error) => {
    console.error("Discord client error:", error);
    isConnected = false;
  });

  client.on("disconnect", () => {
    console.log("Discord bot disconnected");
    isConnected = false;
  });

  client.login(token).catch((error) => {
    console.error("Failed to login to Discord:", error);
    isConnected = false;
  });
}

function scheduleWeeklyBackup() {
  // Run every Sunday at 00:00 (midnight)
  cron.schedule("0 0 * * 0", async () => {
    console.log("Running weekly backup...");
    await performBackup();
  });
  console.log("Weekly backup scheduled for every Sunday at midnight");
}

async function performBackup() {
  if (!client || !isConnected) {
    console.log("Bot not connected, skipping backup");
    return { success: false, error: "Bot not connected" };
  }

  try {
    const configs = await storage.getActiveConfigs();
    const messages = await storage.getAllMessages();

    if (messages.length === 0) {
      console.log("No messages to backup");
      return { success: true, messageCount: 0 };
    }

    // Find a config with a backup channel
    const configWithBackup = configs.find((c) => c.backupChannelId);
    
    if (!configWithBackup || !configWithBackup.backupChannelId) {
      console.log("No backup channel configured");
      return { success: false, error: "No backup channel configured" };
    }

    const backupChannel = await client.channels.fetch(configWithBackup.backupChannelId);
    
    if (!backupChannel || !(backupChannel instanceof TextChannel)) {
      console.log("Backup channel not found or not a text channel");
      return { success: false, error: "Invalid backup channel" };
    }

    // Create backup summary embed
    const embed = new EmbedBuilder()
      .setTitle("Weekly Media Archive Backup")
      .setColor(0x5865F2)
      .setDescription(`Backup completed with **${messages.length}** total media items archived.`)
      .setTimestamp()
      .addFields(
        { name: "Total Items", value: `${messages.length}`, inline: true },
        { name: "With Media", value: `${messages.filter(m => m.hasAttachments).length}`, inline: true },
      );

    await backupChannel.send({ embeds: [embed] });

    // Send media in batches (to avoid rate limits)
    const mediaMessages = messages.filter(m => m.hasAttachments && m.attachmentUrls);
    
    // Group messages by date for better organization
    const messagesByDate = new Map<string, typeof messages>();
    for (const msg of mediaMessages) {
      const dateKey = new Date(msg.timestamp).toISOString().split('T')[0];
      if (!messagesByDate.has(dateKey)) {
        messagesByDate.set(dateKey, []);
      }
      messagesByDate.get(dateKey)!.push(msg);
    }

    // Send grouped by date
    for (const [date, msgs] of messagesByDate) {
      const dateEmbed = new EmbedBuilder()
        .setTitle(`Media from ${date}`)
        .setColor(0x3498db);
      
      let description = "";
      for (const msg of msgs.slice(0, 10)) { // Limit to 10 per date
        const urls = msg.attachmentUrls?.join("\n") || "";
        description += `**${msg.authorUsername}** in #${msg.channelName}:\n${msg.content || "(no caption)"}\n${urls}\n\n`;
      }
      
      dateEmbed.setDescription(description.slice(0, 4000)); // Discord limit
      
      await backupChannel.send({ embeds: [dateEmbed] });
      
      // Add a small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Record the backup
    await storage.createBackup({
      messageCount: messages.length,
      backupDate: new Date(),
      channelId: configWithBackup.backupChannelId,
      status: "completed",
    });

    console.log(`Backup completed: ${messages.length} messages`);
    return { success: true, messageCount: messages.length };
  } catch (error) {
    console.error("Backup failed:", error);
    
    // Record failed backup
    const configs = await storage.getActiveConfigs();
    const configWithBackup = configs.find((c) => c.backupChannelId);
    
    if (configWithBackup?.backupChannelId) {
      await storage.createBackup({
        messageCount: 0,
        backupDate: new Date(),
        channelId: configWithBackup.backupChannelId,
        status: "failed",
      });
    }
    
    return { success: false, error: String(error) };
  }
}

export async function triggerManualBackup() {
  return performBackup();
}

export function getBotStatus() {
  return {
    connected: isConnected,
    username: botUsername,
  };
}
