FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# ✅ Remove this line - we'll mount it at runtime instead
# COPY .env.dev .env.dev

RUN npm run build

EXPOSE 8080

CMD ["npm", "run", "dev:env"]