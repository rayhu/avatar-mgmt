FROM node:22-alpine
WORKDIR /app

# Copy api-server package.json for dependencies
COPY 。/package.json ./package.json
RUN npm install

# Copy api-server source
COPY 。 .

ENV NODE_ENV=production
CMD ["node", "./node_modules/tsx/dist/cli.mjs", "index.ts"] 
