FROM node:20-alpine AS base

WORKDIR /app

# Copy package manifests first for caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy full source code AFTER installing dependencies
# So every code change invalidates cache correctly
COPY . .

# Inject service account
ARG SERVICE_ACCOUNT_JSON
RUN echo "$SERVICE_ACCOUNT_JSON" > /app/serviceAccountKey.json

# Build the app
RUN npm run build

EXPOSE 8080

CMD ["npm", "run", "dev:env"]
