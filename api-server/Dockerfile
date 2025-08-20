FROM node:22.16.0-alpine
WORKDIR /app

# Install dependencies for native modules if needed
# RUN apk add --no-cache python3 make g++

# Copy package files first for better layer caching
COPY package.json yarn.lock ./

# Clear yarn cache and install dependencies
RUN yarn cache clean && yarn install --frozen-lockfile

# Copy source code (excluding node_modules and package files)
COPY . .

# Build arguments for version information
ARG BUILD_VERSION
ARG BUILD_COMMIT
ARG BUILD_TIME
ARG BUILD_REPOSITORY
ARG BUILD_BRANCH
ARG BUILD_RUN_ID
ARG RELEASE_TAG

# Generate version file from build args
RUN echo "{\
  \"version\": \"${BUILD_VERSION:-unknown}\",\
  \"commit\": \"${BUILD_COMMIT:-unknown}\",\
  \"buildTime\": \"${BUILD_TIME:-unknown}\",\
  \"buildDate\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",\
  \"imageTag\": \"${BUILD_VERSION:-unknown}\",\
  \"repository\": \"${BUILD_REPOSITORY:-unknown}\",\
  \"branch\": \"${BUILD_BRANCH:-unknown}\",\
  \"runId\": \"${BUILD_RUN_ID:-unknown}\",\
  \"releaseTag\": \"${RELEASE_TAG:-none}\"\
}" > /app/version.json

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
