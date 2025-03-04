FROM oven/bun:1 AS base
WORKDIR /usr/src/app

FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json /temp/dev/
RUN cd /temp/dev && bun install

RUN mkdir -p /temp/prod
COPY package.json /temp/prod/
RUN cd /temp/prod && bun install --production

FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .
RUN bun run build
RUN mkdir -p dist/web

FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app .

VOLUME ["/usr/src/app/tokens"]
EXPOSE 3000/tcp

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

ENV WEB_ENABLED=true
ENV WEB_PORT=3000
ENV DATABASE_PATH="/usr/src/app/data/quotes.db"

RUN mkdir -p data

ENTRYPOINT [ "bun", "run", "src/index.ts" ]
