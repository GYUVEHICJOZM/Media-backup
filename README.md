# Discord Message Archive

A Discord bot that monitors and archives messages from specified channels, with a web dashboard for browsing and managing the archive.

## Features

- Real-time message monitoring from configured Discord channels
- Password-protected web dashboard
- Search and filter archived messages
- Weekly automatic backups to a designated Discord channel
- Manual backup triggers
- Dark/Light theme support

## Tech Stack

### Frontend
- React with TypeScript
- Vite (build tool)
- Tailwind CSS
- Shadcn UI components
- TanStack Query

### Backend
- Express.js with TypeScript
- SQLite database (better-sqlite3)
- Drizzle ORM
- Discord.js

## Setup

### Prerequisites
- Node.js 18+
- A Discord bot token

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/discord-archive.git
cd discord-archive
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Fill in your environment variables:
- `DISCORD_BOT_TOKEN` - Your Discord bot token
- `SITE_PASSWORD` - Password to access the web dashboard
- `SESSION_SECRET` - A random string for session encryption

5. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5000`

### Discord Bot Setup

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to the "Bot" section and create a bot
4. Enable these Privileged Gateway Intents:
   - Message Content Intent
   - Server Members Intent (optional)
5. Copy the bot token to your `.env` file
6. Go to OAuth2 > URL Generator, select:
   - Scopes: `bot`
   - Bot Permissions: `Read Messages/View Channels`, `Read Message History`
7. Use the generated URL to invite the bot to your server

### Configuration

After logging into the web dashboard:
1. Go to the **Settings** page
2. Add a new configuration with:
   - **Server ID**: Right-click your server > Copy ID
   - **Channel ID**: Right-click the channel to monitor > Copy ID
   - **User ID**: Right-click the user to archive > Copy ID
   - **Backup Channel ID** (optional): Where weekly backups are posted

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:push` - Push database schema changes

## Project Structure

```
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utilities
│   │   └── pages/       # Page components
│   └── index.html
├── server/              # Express backend
│   ├── db.ts            # Database connection
│   ├── discord.ts       # Discord bot logic
│   ├── routes.ts        # API routes
│   └── storage.ts       # Database operations
├── shared/              # Shared types and schemas
│   └── schema.ts        # Drizzle database schema
├── .env.example         # Environment variables template
├── .gitignore           # Git ignore rules
└── package.json
```

## License

MIT
