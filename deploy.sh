#!/bin/bash

set -e  # Exit on any error

DEPLOY_DIR="/home/ubuntu/Offbeat-Backend"
ENV_FILE="$DEPLOY_DIR/.env.dev"
CONTAINER_NAME="offbeat-backend"

echo " Starting deployment in $DEPLOY_DIR..."

# Navigate to deployment directory
cd "$DEPLOY_DIR" || { echo " Directory not found: $DEPLOY_DIR"; exit 1; }

echo " Pulling latest changes..."
git fetch origin main
git reset --hard origin/main
echo " Git pull completed"

echo " Building and deploying container..."
docker build -t offbeat-backend:latest .

echo " Stopping and removing old container..."
docker stop $CONTAINER_NAME || true
docker rm $CONTAINER_NAME || true

echo " Starting new container..."
docker run -d \
  -p 8080:8080 \
  --name $CONTAINER_NAME \
  --restart unless-stopped \
  --env-file $ENV_FILE \
  offbeat-backend:latest

# Wait for container to be healthy
echo " Waiting for container to start..."
sleep 5

if docker ps --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}"; then
  echo " Deployment successful!"