# version 1.0.2
# ===========================
#  BASE STAGE
# ===========================
FROM node:24-alpine3.23 AS base

ARG PNPM_VERSION=10.33.4
# Versions APK correspond to node:24-alpine3.23 (bump when apk add fails with "breaks: world[...]")
ARG APK_GPP_VERSION=15.2.0-r2
ARG APK_MAKE_VERSION=4.4.1-r3
ARG APK_PYTHON3_VERSION=3.12.13-r0

RUN apk add --no-cache \
    g++=${APK_GPP_VERSION} \
    make=${APK_MAKE_VERSION} \
    python3=${APK_PYTHON3_VERSION} && \
    corepack enable && \
    corepack prepare pnpm@${PNPM_VERSION} --activate

# ===========================
#  DEPENDENCIES STAGE
# ===========================
FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm fetch --prefer-offline && \
    pnpm i --ignore-scripts --frozen-lockfile --offline

# ===========================
#  BUILD STAGE
# ===========================
FROM base AS builder
WORKDIR /app

# Force development so devDeps (tsc, nestjs/cli) are usable
ENV NODE_ENV=development

COPY --from=deps /app/node_modules ./node_modules
COPY nest-cli.json package.json pnpm-lock.yaml tsconfig.build.json tsconfig.json ./
COPY src ./src

RUN corepack enable pnpm && pnpm run build && \
    rm -rf /root/.pnpm-store node_modules/.store

# ===========================
#  RUNTIME STAGE
# ===========================
FROM node:24-alpine3.23 AS runner
WORKDIR /app
ENV NODE_ENV=production

# Runtime system dependencies (Puppeteer + ffmpeg)
ARG APK_CHROMIUM_VERSION=148.0.7778.178-r0
ARG APK_NSS_VERSION=3.118.1-r0
ARG APK_FREETYPE_VERSION=2.14.1-r0
ARG APK_HARFBUZZ_VERSION=12.2.0-r0
ARG APK_CA_CERTIFICATES_VERSION=20260413-r0
ARG APK_TTF_FREEFONT_VERSION=20120503-r4
ARG APK_FFMPEG_VERSION=8.0.1-r1

RUN apk add --no-cache \
      chromium=${APK_CHROMIUM_VERSION} \
      nss=${APK_NSS_VERSION} \
      freetype=${APK_FREETYPE_VERSION} \
      harfbuzz=${APK_HARFBUZZ_VERSION} \
      ca-certificates=${APK_CA_CERTIFICATES_VERSION} \
      ttf-freefont=${APK_TTF_FREEFONT_VERSION} \
      ffmpeg=${APK_FFMPEG_VERSION}

ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

COPY --from=builder --chmod=755 /app/dist ./dist
COPY --from=builder --chmod=755 /app/src/utils ./src/utils
COPY --from=builder --chmod=755 /app/node_modules ./node_modules
COPY --from=builder --chmod=755 /app/package.json ./package.json

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=60s --timeout=10s --start-period=60s --retries=4 \
  CMD wget --spider -q http://localhost:3000/ping || exit 1

CMD ["node", "dist/main.js"]
