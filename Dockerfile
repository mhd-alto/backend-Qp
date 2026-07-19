# syntax=docker/dockerfile:1

# ---- Build stage ----
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first for better layer caching
COPY package*.json ./
RUN npm ci

# Copy source
COPY . ./

# Build TypeScript -> dist/
RUN npm run build

# ---- Runtime stage ----
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Only install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built app
COPY --from=builder /app/dist ./dist

# Needed for serving static uploads
# (keeps directory present even if empty)
# uploads are usually mounted as a volume at runtime
RUN mkdir -p uploads

# Helpful defaults (override with docker-compose / env)
ENV PORT=3000
ENV HOST=0.0.0.0
ENV API_PREFIX=api

# Ghaymah Cloud expects the container to listen on this port
EXPOSE 3000

# Use exec form for proper signal handling (SIGTERM) during deploy
CMD ["node", "dist/src/main.js"]


