# ---- Build stage: install production dependencies ----
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- Runtime stage ----
FROM node:20-alpine

WORKDIR /app

# Copy production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source and package.json
COPY package.json ./
COPY src ./src

EXPOSE 3000

CMD ["node", "src/app.js"]
