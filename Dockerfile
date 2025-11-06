# ✅ Use Node 20 LTS (required by New Relic)
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files first (for caching layers)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your code
COPY . .

# ✅ Include your environment file for dev use
COPY .env.dev .env.dev

# Build TypeScript
RUN npm run build

# Expose backend port
EXPOSE 8080

# ✅ Match your local command
CMD ["npm", "run", "dev:env"]
