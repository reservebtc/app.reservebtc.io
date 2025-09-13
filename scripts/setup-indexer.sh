#!/bin/bash

echo "🚀 Setting up ReserveBTC Indexer"
echo "================================"

# Create directory structure
echo "📁 Creating directories..."
mkdir -p backend/indexer/src
mkdir -p database
mkdir -p app/api/v2/transactions/[address]
mkdir -p app/api/v2/balance/[address]
mkdir -p lib/hooks
mkdir -p components/dashboard

# Initialize indexer package
echo "📦 Initializing indexer package..."
cd backend/indexer
npm init -y

# Install indexer dependencies
echo "📦 Installing indexer dependencies..."
npm install ethers@^6.9.0 pg@^8.11.3 node-cron@^3.0.3 dotenv@^16.3.1
npm install -D typescript@^5.3.3 @types/node@^20.10.5 @types/pg@^8.10.9 ts-node@^10.9.2

# Create TypeScript config
echo "⚙️ Creating TypeScript config..."
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# Go back to root
cd ../..

# Install main project dependencies
echo "📦 Installing main project dependencies..."
npm install pg swr

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Add the TypeScript files to their respective directories"
echo "2. Configure your DATABASE_URL in .env"
echo "3. Run the database schema: psql your_db < database/schema.sql"
echo "4. Start the indexer: cd backend/indexer && npm run dev"