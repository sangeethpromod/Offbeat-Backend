#!/bin/bash
IMAGE="silpa14/offbeat-backend:latest"  # ← Put your username HERE only once
docker pull $IMAGE
docker stop offbeat-backend || true
docker rm offbeat-backend || true
docker run -d -p 8080:8080 --name offbeat-backend --restart unless-stopped --env-file .env.dev $IMAGE
echo "✅ Deployed!"
