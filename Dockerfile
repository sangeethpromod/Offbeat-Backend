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

# Optional: ensure .env.dev is included
# If you want to use .env.dev inside the container for development,
# uncomment this line (DON’T do this for production images)
# COPY .env.dev .env.dev

# Build TypeScript to dist
RUN npm run build

# Expose backend port
EXPOSE 8080

# ✅ Command: use your local dev command (npm run dev:env)
# This will match your local setup and automatically load .env.dev
CMD ["npm", "run", "dev:env"]
