FROM oven/bun:1 AS base
WORKDIR /usr/src/app

FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json /temp/dev/
# Skip lockfile entirely to avoid format issues
RUN cd /temp/dev && bun install

RUN mkdir -p /temp/prod
COPY package.json /temp/prod/
# Skip lockfile entirely to avoid format issues
RUN cd /temp/prod && bun install --production

FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .
# Build the React app with the new build script
RUN bun run build.ts

FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app .

# Create volume for token storage only
# Data will be mounted from host filesystem
VOLUME ["/usr/src/app/tokens"]

# Expose web server port
EXPOSE 3000/tcp

# Use healthcheck to verify app is running correctly
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Set environment variables
ENV WEB_ENABLED=true
ENV WEB_PORT=3000
ENV DATABASE_PATH="/usr/src/app/data/quotes.db"

# Create necessary directories
RUN mkdir -p dist data

ENTRYPOINT [ "bun", "run", "src/index.ts" ]
