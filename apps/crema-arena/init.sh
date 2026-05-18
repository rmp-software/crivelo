#!/bin/bash

# Crema Arena - Initialization Script
# This script sets up the project and prepares it for development

set -e

echo "🚀 Crema Arena - Initialization"
echo "================================"
echo ""

# Check Node.js version and use nvm if available
if [ -f ".nvmrc" ] && [ -s "$NVM_DIR/nvm.sh" ]; then
  echo "🔧 Loading nvm and switching to Node.js version from .nvmrc..."
  source "$NVM_DIR/nvm.sh"
  nvm install
  nvm use
  echo "✓ Using Node.js $(node --version)"
  echo ""
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
  echo "✓ Dependencies installed"
  echo ""
else
  echo "✓ Dependencies already installed"
  echo ""
fi

# Check if .env exists
if [ ! -f ".env" ]; then
  echo "⚠️  Warning: .env file not found"
  echo "   Please copy .env.example to .env and configure your database"
  echo ""
  exit 1
fi

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate
echo "✓ Prisma Client generated"
echo ""

# Run migrations (only if DATABASE_URL is configured)
if grep -q "postgresql://username:password" .env; then
  echo "⚠️  Warning: DATABASE_URL not configured in .env"
  echo "   Please update DATABASE_URL with your Neon PostgreSQL connection string"
  echo "   Then run: npx prisma migrate dev"
  echo ""
else
  echo "🗄️  Running database migrations..."
  npx prisma migrate dev --name init
  echo "✓ Migrations completed"
  echo ""

  # Seed database
  echo "🌱 Seeding database..."
  npx prisma db seed
  echo "✓ Database seeded"
  echo ""
fi

echo "================================"
echo "✓ Initialization complete!"
echo ""
echo "To start the development server:"
echo "  npm run dev"
echo ""
echo "The application will be available at:"
echo "  http://localhost:3000"
echo ""
