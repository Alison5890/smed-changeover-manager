FROM node:20-bookworm-slim AS deps

WORKDIR /app
COPY package.json package-lock.json* ./
COPY client/package.json client/package-lock.json* ./client/
COPY server/package.json server/package-lock.json* ./server/
RUN npm install --prefix client && npm install --prefix server

FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/client/node_modules ./client/node_modules
COPY --from=deps /app/server/node_modules ./server/node_modules
COPY . .
RUN npm --prefix client run build
RUN npx --prefix server prisma generate --schema=server/prisma/schema.prisma

FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# Copy installed deps and build output
COPY --from=build /app/server ./server
COPY --from=build /app/client/dist ./client/dist
COPY --from=build /app/package.json ./package.json

EXPOSE 8080
CMD ["node", "server/scripts/startProd.js"]
