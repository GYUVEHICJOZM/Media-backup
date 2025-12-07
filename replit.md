# Discord Message Archive System

## Overview

This application is a Discord message archive dashboard that monitors and stores messages from specified Discord channels. It provides a web interface for viewing archived messages, managing bot configurations, and handling weekly backups. The system uses a Discord bot to capture messages in real-time and stores them in a SQLite database, with a React-based dashboard for browsing and managing the archive.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with TypeScript for UI components
- Vite as the build tool and development server
- Wouter for client-side routing (lightweight alternative to React Router)
- TanStack Query for server state management and data fetching
- Shadcn UI component library built on Radix UI primitives
- Tailwind CSS for styling with custom design tokens

**Design System:**
- Material Design influenced by Discord aesthetic
- Custom theme system supporting light/dark modes via CSS variables
- Typography: Inter for UI, JetBrains Mono for monospace (timestamps/metadata)
- Card-based message layout with consistent spacing units (2, 4, 6, 8)
- Sidebar navigation pattern with collapsible mobile view

**State Management:**
- TanStack Query handles all server state with optimistic updates
- Session-based authentication state managed via API calls
- No global client state management (Redux/Zustand) - relies on React Query cache

**Key Routes:**
- `/` - Dashboard with statistics and recent activity
- `/messages` - Searchable/filterable message archive
- `/backups` - Weekly backup history and management
- `/settings` - Bot configuration management
- `/login` - Password-protected authentication

**Authentication Flow:**
- Simple password-based authentication (no user accounts)
- Session stored server-side with express-session
- Password configured via environment variable (SITE_PASSWORD)
- All routes except login require authentication

### Backend Architecture

**Technology Stack:**
- Express.js server with TypeScript
- Better-sqlite3 for local SQLite database
- Drizzle ORM for type-safe database queries
- Discord.js for Discord bot integration
- Node-cron for scheduled weekly backups

**Server Structure:**
- `server/index.ts` - Express app initialization and middleware setup
- `server/routes.ts` - API endpoint definitions and request handlers
- `server/storage.ts` - Database abstraction layer with typed methods
- `server/discord.ts` - Discord bot logic and message monitoring
- `server/db.ts` - Database connection and schema initialization

**API Design:**
- RESTful endpoints for CRUD operations
- Authentication endpoints: `/api/auth/login`, `/api/auth/logout`, `/api/auth/check`
- Resource endpoints: `/api/messages`, `/api/configs`, `/api/backups`
- Manual backup trigger: `/api/backups/trigger`
- Bot status check: `/api/bot/status`

**Session Management:**
- Express-session with MemoryStore for development
- Session cookie with 7-day expiration
- HTTP-only cookies for security
- Secure flag enabled in production

**Bot Integration:**
- Discord bot monitors configured channels for messages from specific users
- Real-time message capture and storage
- Scheduled weekly backups sent to designated backup channels
- Bot status tracking (connected/disconnected)

### Data Storage

**Database Choice:**
- SQLite via better-sqlite3 for simplicity and portability
- WAL mode enabled for better concurrent access
- Single file database (`data.db`)
- No separate migration system - schema created on startup

**Schema Design:**

**Messages Table:**
- Stores archived Discord messages with full metadata
- Fields: id, discord_message_id (unique), content, author info, channel info, server info, timestamp, attachments
- Attachment URLs stored as JSON string (SQLite limitation)

**Bot Config Table:**
- Defines which channels/users to monitor
- Fields: server_id, channel_id, monitor_user_id, backup_channel_id, is_active
- Supports multiple configurations per server

**Backups Table:**
- Tracks weekly backup history
- Fields: message_count, backup_date, channel_id, status

**Type Safety:**
- Drizzle ORM generates TypeScript types from schema
- Shared schema file (`shared/schema.ts`) used by both client and server
- Zod validation schemas for API input validation

### External Dependencies

**Discord Bot Integration:**
- Requires Discord bot token (DISCORD_BOT_TOKEN environment variable)
- Uses Discord.js v14 with Gateway Intents for message monitoring
- Bot listens for messageCreate events in configured channels
- Filters messages by author ID to archive only specific users
- Scheduled weekly backups via node-cron (Sundays at midnight)

**Discord Permissions Required:**
- Guilds (server access)
- GuildMessages (read messages)
- MessageContent (access message content - privileged intent)

**Third-Party UI Libraries:**
- Radix UI primitives for accessible components (dialogs, popovers, dropdowns, etc.)
- Shadcn UI component patterns and styling
- Tailwind CSS for utility-first styling
- date-fns for date formatting and manipulation

**Build and Development Tools:**
- Vite for frontend bundling and HMR
- esbuild for server bundling in production
- PostCSS with Tailwind for CSS processing
- TypeScript compiler for type checking

**Deployment Considerations:**
- Environment variables required: DISCORD_BOT_TOKEN, SITE_PASSWORD, SESSION_SECRET
- DATABASE_URL not currently used (SQLite uses local file)
- Production build creates static frontend + bundled server
- Single data.db file for database persistence