import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBotConfigSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";
import { initDiscordBot, getBotStatus, triggerManualBackup } from "./discord";

const SITE_PASSWORD = process.env.SITE_PASSWORD || "Delijnrat55.";

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.session?.isAuthenticated) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized" });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Initialize Discord bot
  initDiscordBot();

  // Auth routes (no auth required)
  app.post("/api/auth/login", (req, res) => {
    const { password } = req.body;
    if (password === SITE_PASSWORD) {
      req.session.isAuthenticated = true;
      return res.json({ success: true });
    }
    return res.status(401).json({ error: "Invalid password" });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/check", (req, res) => {
    res.json({ authenticated: !!req.session?.isAuthenticated });
  });

  // Messages API (protected)
  app.get("/api/messages", requireAuth, async (req, res) => {
    try {
      const messages = await storage.getAllMessages();
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.get("/api/messages/:id", requireAuth, async (req, res) => {
    try {
      const message = await storage.getMessage(req.params.id);
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }
      res.json(message);
    } catch (error) {
      console.error("Error fetching message:", error);
      res.status(500).json({ error: "Failed to fetch message" });
    }
  });

  app.delete("/api/messages/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteMessage(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ error: "Failed to delete message" });
    }
  });

  // Bot Config API (protected)
  app.get("/api/config", requireAuth, async (req, res) => {
    try {
      const configs = await storage.getAllConfigs();
      res.json(configs);
    } catch (error) {
      console.error("Error fetching configs:", error);
      res.status(500).json({ error: "Failed to fetch configurations" });
    }
  });

  app.post("/api/config", requireAuth, async (req, res) => {
    try {
      const validated = insertBotConfigSchema.parse(req.body);
      const config = await storage.createConfig(validated);
      res.json(config);
    } catch (error) {
      console.error("Error creating config:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create configuration" });
    }
  });

  app.patch("/api/config/:id", requireAuth, async (req, res) => {
    try {
      const config = await storage.updateConfig(req.params.id, req.body);
      if (!config) {
        return res.status(404).json({ error: "Configuration not found" });
      }
      res.json(config);
    } catch (error) {
      console.error("Error updating config:", error);
      res.status(500).json({ error: "Failed to update configuration" });
    }
  });

  app.delete("/api/config/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteConfig(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting config:", error);
      res.status(500).json({ error: "Failed to delete configuration" });
    }
  });

  // Backups API (protected)
  app.get("/api/backups", requireAuth, async (req, res) => {
    try {
      const backups = await storage.getAllBackups();
      res.json(backups);
    } catch (error) {
      console.error("Error fetching backups:", error);
      res.status(500).json({ error: "Failed to fetch backups" });
    }
  });

  app.post("/api/backups/trigger", requireAuth, async (req, res) => {
    try {
      const result = await triggerManualBackup();
      res.json(result);
    } catch (error) {
      console.error("Error triggering backup:", error);
      res.status(500).json({ error: "Failed to trigger backup" });
    }
  });

  // Bot Status API (protected)
  app.get("/api/bot/status", requireAuth, async (req, res) => {
    try {
      const status = getBotStatus();
      res.json(status);
    } catch (error) {
      console.error("Error getting bot status:", error);
      res.status(500).json({ error: "Failed to get bot status" });
    }
  });

  return httpServer;
}
