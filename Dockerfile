# Stage 1: build Vue SPA
# Vite reads .env.production automatically — no build args needed
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: run Express server
FROM node:20-alpine

WORKDIR /app

COPY server/package.json ./server/
RUN cd server && npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY server/index.js ./server/

EXPOSE 3000

CMD ["node", "server/index.js"]
