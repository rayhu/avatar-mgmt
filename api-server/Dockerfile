FROM node:22-alpine
WORKDIR /app

# Copy api-server package.json for dependencies
COPY api-server/package.json ./package.json
RUN npm install --omit=dev

# Copy api-server source
COPY api-server .
# Copy API route handlers
COPY api ./api

ENV NODE_ENV=production
CMD ["npm", "start"] 
