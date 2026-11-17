#!/bin/bash
# RoofDynamics Production Deployment Script
# Usage: ./deploy.sh [environment]
# Environments: staging, production

set -e

ENV=${1:-staging}
echo "🚀 Deploying RoofDynamics to $ENV..."

# 1. Build frontend
echo "📦 Building frontend..."
cd frontend
npm ci
npm run build
cd ..

# 2. Build backend
echo "📦 Building backend..."
cd backend
npm ci
npm run build
cd ..

# 3. Run tests
echo "🧪 Running tests..."
npm --prefix frontend run test
cd backend && npm test && cd ..

# 4. Database migration
echo "🗄️ Running database migrations..."
cd backend
if [ "$ENV" = "production" ]; then
  npx prisma migrate deploy
else
  npx prisma migrate dev
fi
cd ..

# 5. Seed (staging only)
if [ "$ENV" = "staging" ]; then
  echo "🌱 Seeding database..."
  npm --prefix backend run prisma:seed
fi

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "  1. Copy frontend/dist to your CDN/web server"
echo "  2. Copy backend/dist to your app server"
echo "  3. Start backend: node backend/dist/server.js"
echo "  4. Configure nginx reverse proxy (see nginx.conf)"
echo "  5. Set up SSL certificates"
