# Elsydeon

A derpy Discord and Twitch chat bot.

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
