// Script to verify indexer setup and dependencies
const fs = require('fs');
const path = require('path');

console.log('🔍 ReserveBTC Indexer Setup Checker\n');
console.log('=' .repeat(50));

// Define required structure
const requiredStructure = {
  directories: [
    'backend',
    'backend/indexer',
    'backend/indexer/src',
    'database',
    'app/api/v2',
    'app/api/v2/transactions',
    'app/api/v2/balance',
    'lib/hooks',
    'components/dashboard'
  ],
  files: [
    {
      path: 'database/schema.sql',
      checkContent: ['CREATE TABLE users', 'CREATE TABLE transactions']
    },
    {
      path: 'backend/indexer/package.json',
      checkContent: ['ethers', 'pg', 'node-cron']
    },
    {
      path: 'backend/indexer/src/index.ts',
      checkContent: ['EventIndexer', 'indexSyncedEvents']
    },
    {
      path: 'app/api/v2/transactions/[address]/route.ts',
      checkContent: ['export async function GET']
    },
    {
      path: 'app/api/v2/balance/[address]/route.ts',
      checkContent: ['balance_snapshots']
    },
    {
      path: 'lib/hooks/use-transaction-history.ts',
      checkContent: ['useTransactionHistory', 'useSWR']
    },
    {
      path: 'lib/hooks/use-balance-history.ts',
      checkContent: ['useBalanceHistory']
    },
    {
      path: 'components/dashboard/enhanced-dashboard.tsx',
      checkContent: ['EnhancedDashboard']
    }
  ]
};

let errors = [];
let warnings = [];
let success = [];

// Check directories
console.log('\n📁 Checking directories...');
requiredStructure.directories.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    success.push(`✅ Directory exists: ${dir}`);
  } else {
    errors.push(`❌ Missing directory: ${dir}`);
  }
});

// Check files
console.log('\n📄 Checking files...');
requiredStructure.files.forEach(file => {
  const fullPath = path.join(process.cwd(), file.path);
  if (fs.existsSync(fullPath)) {
    success.push(`✅ File exists: ${file.path}`);
    
    // Check file content
    const content = fs.readFileSync(fullPath, 'utf8');
    file.checkContent.forEach(expectedContent => {
      if (!content.includes(expectedContent)) {
        warnings.push(`⚠️  File ${file.path} might be missing: "${expectedContent}"`);
      }
    });
  } else {
    errors.push(`❌ Missing file: ${file.path}`);
  }
});

// Check Node.js dependencies
console.log('\n📦 Checking dependencies...');
const indexerPackagePath = path.join(process.cwd(), 'backend/indexer/package.json');
if (fs.existsSync(indexerPackagePath)) {
  const pkg = JSON.parse(fs.readFileSync(indexerPackagePath, 'utf8'));
  const requiredDeps = ['ethers', 'pg', 'node-cron', 'dotenv'];
  
  requiredDeps.forEach(dep => {
    if (pkg.dependencies && pkg.dependencies[dep]) {
      success.push(`✅ Dependency found: ${dep}`);
    } else {
      warnings.push(`⚠️  Missing dependency: ${dep}`);
    }
  });
}

// Check environment variables
console.log('\n🔐 Checking environment variables...');
const envVars = ['DATABASE_URL', 'RPC_URL'];
envVars.forEach(envVar => {
  if (process.env[envVar]) {
    success.push(`✅ Environment variable set: ${envVar}`);
  } else {
    warnings.push(`⚠️  Environment variable not set: ${envVar}`);
  }
});

// Print results
console.log('\n' + '=' .repeat(50));
console.log('📊 RESULTS:\n');

if (success.length > 0) {
  console.log('✅ SUCCESS (' + success.length + ')');
  success.forEach(s => console.log('   ' + s));
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS (' + warnings.length + ')');
  warnings.forEach(w => console.log('   ' + w));
}

if (errors.length > 0) {
  console.log('\n❌ ERRORS (' + errors.length + ')');
  errors.forEach(e => console.log('   ' + e));
}

// Provide setup instructions if needed
if (errors.length > 0) {
  console.log('\n' + '=' .repeat(50));
  console.log('📝 SETUP INSTRUCTIONS:\n');
  
  if (errors.some(e => e.includes('backend/indexer'))) {
    console.log('1. Create indexer structure:');
    console.log('   mkdir -p backend/indexer/src');
    console.log('   cd backend/indexer');
    console.log('   npm init -y');
    console.log('   npm install ethers pg node-cron dotenv');
    console.log('   npm install -D typescript @types/node @types/pg');
  }
  
  if (errors.some(e => e.includes('database'))) {
    console.log('\n2. Create database structure:');
    console.log('   mkdir database');
  }
  
  if (errors.some(e => e.includes('api/v2'))) {
    console.log('\n3. Create API structure:');
    console.log('   mkdir -p app/api/v2/transactions/[address]');
    console.log('   mkdir -p app/api/v2/balance/[address]');
  }
  
  if (errors.some(e => e.includes('lib/hooks'))) {
    console.log('\n4. Create hooks structure:');
    console.log('   mkdir -p lib/hooks');
  }
  
  console.log('\n5. Install required packages in main project:');
  console.log('   npm install pg swr');
}

// Create missing directories
if (errors.length > 0) {
  console.log('\n' + '=' .repeat(50));
  console.log('🔧 AUTO-FIX: Creating missing directories...\n');
  
  requiredStructure.directories.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`   Created: ${dir}`);
    }
  });
  
  console.log('\n✅ Directories created! Now add the required files.');
}

// Exit code
process.exit(errors.length > 0 ? 1 : 0);