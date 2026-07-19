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
RUN mkdir -p uploads
COPY --from=builder /app/uploads ./uploads

# Helpful defaults (override with docker-compose / env)
ENV PORT=3000
ENV HOST=0.0.0.0
ENV API_PREFIX=api

EXPOSE 3000

CMD ["node", "dist/src/main.js"]

