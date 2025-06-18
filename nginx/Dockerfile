# syntax=docker/dockerfile:1

############################
# 1) Build assets
############################
FROM node:22-alpine AS builder

# Install pnpm if you prefer; here we use yarn 1.x provided by node image
WORKDIR /app

# Copy only dependency manifests first for better caching
COPY frontend/package.json frontend/yarn.lock ./frontend/
RUN cd frontend \
    && yarn install --production --non-interactive --network-timeout 100000

# Copy source and build
COPY frontend ./frontend
RUN cd frontend && yarn build

############################
# 2) Nginx runtime image
############################
FROM nginx:alpine

# Copy custom nginx conf
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Copy built static files from the previous stage
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# By default nginx exposes 80, we map in compose

HEALTHCHECK CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Metadata
LABEL org.opencontainers.image.title="Avatar Mgmt – Web UI"
LABEL org.opencontainers.image.description="Nginx image serving built Vue frontend" 
