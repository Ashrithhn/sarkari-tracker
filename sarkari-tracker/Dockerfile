# Multi-stage Dockerfile for SarkariTracker
# Stage 1: Build React/Vite Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production Server
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

# Copy package descriptors and install only runtime dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy backend server code and configuration
COPY server/ ./server/
COPY config/ ./config/
# Copy compiled client bundle
COPY --from=frontend-builder /app/dist ./dist

# Create persistent storage mount for database
VOLUME ["/app/server"]

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

CMD ["node", "server/index.js"]
