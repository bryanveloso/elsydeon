# Elsydeon

A derpy chat bot for Discord and Twitch, made specifically for The Crusaders.

## Project Structure

```
/elsydeon
├── src/
│   ├── core/         # Shared core functionality (DB, schema, etc.)
│   ├── bot/          # Bot-specific code
│   │   ├── discord/  # Discord bot implementation
│   │   └── twitch/   # Twitch bot implementation
│   ├── api/          # API endpoints
│   └── web/          # Web interface
├── dist/             # Built assets for web interface
└── data/             # Database and persistent data
```

## Development

### Local Development (Recommended)

For frontend development with hot-reloading and API:

```bash
bun run dev
```

This starts both the frontend (Vite dev server) and API server.

## Setup

1. Copy `.env.example` to `.env` and fill in your credentials:

   ```
   cp .env.example .env
   ```

2. Edit the `.env` file with your Discord token, Twitch credentials, and channel names.

3. Make sure you have your Twitch token file:
   - The token file should be named `tokens.<your_twitch_user_id>.json`
   - If you don't have this file, you'll need to generate it through Twitch authentication

## Running Locally

### With Bun

```bash
# Install dependencies
bun install

# Build the web interface
bun run build

# Run in development mode (with auto-reload)
bun run dev

# Run in production mode
bun run start
```

### With Docker

```bash
# Build and run with Docker
./docker-run.sh

# Stop the container
./docker-stop.sh
```

## Environment Variables

- `DISCORD_TOKEN`: Your Discord bot token
- `TWITCH_CLIENT_ID`: Your Twitch application client ID
- `TWITCH_CLIENT_SECRET`: Your Twitch application client secret
- `TWITCH_CHANNELS`: Comma-separated list of Twitch channels to join
- `TWITCH_USER_ID`: Your Twitch user ID
- `DATABASE_PATH`: Path to the SQLite database file (default: quotes.db)
- `WEB_ENABLED`: Set to 'true' to enable the web interface
- `WEB_PORT`: Port for the web interface (default: 3000)
- `API_PORT`: Port for the standalone API server (default: 3002)

## API Endpoints

- `GET /api/quotes` - Get a list of quotes (paginated)
- `GET /api/quotes/latest` - Get the most recent quotes
- `GET /api/quotes/random` - Get random quotes
- `GET /api/quotes/search?q=...` - Search quotes by text
- `GET /api/quotes/:id` - Get a specific quote by ID
