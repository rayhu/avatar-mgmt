FROM node:22.16.0-alpine
WORKDIR /app

# Install dependencies for native modules if needed
RUN apk add --no-cache python3 make g++

# Copy package files first for better layer caching
COPY api-server/package.json api-server/yarn.lock* ./

# Clear yarn cache and install dependencies
RUN yarn cache clean && yarn install --frozen-lockfile --production=false

# Copy source code
COPY api-server/ .

# Copy azure-voices-zh.json from frontend
COPY frontend/public/azure-voices-zh.json ./public/azure-voices-zh.json

# Set environment variables
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["yarn", "start"] 
