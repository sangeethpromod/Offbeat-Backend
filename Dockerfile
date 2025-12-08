FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm install
ARG SERVICE_ACCOUNT_JSON
RUN echo $SERVICE_ACCOUNT_JSON > /app/serviceAccountKey.json

COPY . .

# ✅ Remove this line - we'll mount it at runtime instead
# COPY .env.dev .env.dev

RUN npm run build

EXPOSE 8080

CMD ["npm", "run", "dev:env"]