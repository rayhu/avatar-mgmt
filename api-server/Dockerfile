FROM node:22-alpine
WORKDIR /app

# Copy api-server package.json for dependencies
COPY api-server/package.json ./package.json
RUN npm install

# Copy api-server source
COPY api-server/ .

# Copy azure-voices-zh.json from frontend
COPY frontend/public/azure-voices-zh.json ./public/azure-voices-zh.json

ENV NODE_ENV=production
CMD ["node", "./node_modules/tsx/dist/cli.mjs", "index.ts"] 
