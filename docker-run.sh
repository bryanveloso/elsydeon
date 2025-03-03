#!/bin/bash
set -e

# Load environment variables from .env file if it exists
if [ -f .env ]; then
  echo "Loading environment variables from .env file..."
  export $(grep -v '^#' .env | xargs)
else
  echo "Warning: .env file not found. Make sure environment variables are set manually."
fi

# Check for required environment variables
if [ -z "$DISCORD_TOKEN" ] || [ -z "$TWITCH_CLIENT_ID" ] || [ -z "$TWITCH_CLIENT_SECRET" ] || [ -z "$TWITCH_CHANNELS" ]; then
  echo "Error: Required environment variables are not set."
  echo "Please create a .env file with the following variables:"
  echo "- DISCORD_TOKEN"
  echo "- TWITCH_CLIENT_ID"
  echo "- TWITCH_CLIENT_SECRET"
  echo "- TWITCH_CHANNELS"
  exit 1
fi

# Build the Docker image
echo "Building Docker image..."
docker build -t elsydeon:latest .

# Create token volume if it doesn't exist
docker volume create elsydeon-tokens

# Create data directory if it doesn't exist
mkdir -p ./data

# Stop and remove existing container if it exists
if docker ps -a | grep -q elsydeon; then
  echo "Stopping existing container..."
  docker stop elsydeon
  docker rm elsydeon
fi

# Run the container with environment variables
echo "Starting Elsydeon..."
docker run -d \
  --name elsydeon \
  --restart unless-stopped \
  -p 3000:3000 \
  -v elsydeon-tokens:/usr/src/app/tokens \
  -v $(pwd)/data:/usr/src/app/data \
  -e DISCORD_TOKEN="$DISCORD_TOKEN" \
  -e TWITCH_CLIENT_ID="$TWITCH_CLIENT_ID" \
  -e TWITCH_CLIENT_SECRET="$TWITCH_CLIENT_SECRET" \
  -e TWITCH_CHANNELS="$TWITCH_CHANNELS" \
  -e TWITCH_USER_ID="${TWITCH_USER_ID:-66977097}" \
  -e WEB_ENABLED="true" \
  -e WEB_PORT="3000" \
  -e DATABASE_PATH="/usr/src/app/data/quotes.db" \
  elsydeon:latest

echo "Container started!"
echo "- Bot logs: docker logs elsydeon"
echo "- Web interface: http://localhost:3000"
