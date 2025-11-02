# Base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Build TypeScript
RUN npm run build

# Expose backend port
EXPOSE 8080

# Start the server
CMD ["npm", "start"]
