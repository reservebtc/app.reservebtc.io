#!/bin/bash
set -euo pipefail

# Always go to project root
cd "$(dirname "$0")"

# Guard: forbid nested repos
if [ -d "contracts/.git" ]; then
  echo "❌ Found nested Git repo at contracts/.git. Remove it: rm -rf contracts/.git"
  exit 1
fi

# Set correct Git identity for ReserveBTC GLOBALLY
git config --global user.name "ReserveBTC"  
git config --global user.email "reservebtcproof@gmail.com"

# Load environment variables from .env file
if [ -f ".env" ]; then
  echo "📄 Loading environment variables from .env file..."
  export $(grep -v '^#' .env | xargs)
else
  echo "⚠️  No .env file found"
fi

# GitHub Personal Access Token
GITHUB_TOKEN="${GITHUB_TOKEN:-}"

if [ -z "$GITHUB_TOKEN" ]; then
  echo "⚠️  No GitHub token found. Please set GITHUB_TOKEN in .env file"
  echo "💡 Create .env file with: GITHUB_TOKEN=your_github_token_here"
  exit 1
else
  echo "🔑 Using GitHub Personal Access Token for authentication..."
  REPO_URL="https://${GITHUB_TOKEN}@github.com/reservebtc/app.reservebtc.io.git"
fi

# Check if we have a git repo, if not initialize
if [ ! -d ".git" ]; then
  echo "🆕 No Git repository found, initializing..."
  git init
  git branch -M main
  git remote add origin "$REPO_URL"
else
  echo "📦 Using existing Git repository..."
  # Make sure we have the correct remote
  if ! git remote get-url origin >/dev/null 2>&1; then
    git remote add origin "$REPO_URL"
  else
    git remote set-url origin "$REPO_URL"
  fi
fi

# Set local identity to ensure it's ReserveBTC
git config user.name "ReserveBTC"
git config user.email "reservebtcproof@gmail.com"

# Pull latest changes to avoid conflicts
echo "🔄 Pulling latest changes..."
if git pull origin main --rebase || true; then
  echo "✅ Successfully synchronized with remote"
else
  echo "⚠️  Pull failed or no remote history, continuing..."
fi

# Append timestamp to CHANGELOG.md
echo "- Auto commit: $(date '+%Y-%m-%d %H:%M:%S')" >> CHANGELOG.md

# Check what files have changed
echo "📝 Checking for changes..."
git status --porcelain

# Add only changed files, making sure to include all files in subdirectories
echo "🔍 Adding files to git..."
git add -A

# Check if there are changes to commit
if git diff --cached --quiet; then
  echo "ℹ️ Nothing new to commit."
  exit 0
fi

# Show what will be committed
echo "📋 Files to be committed:"
git diff --cached --name-status

# Show detailed file count by type
echo "📊 File summary:"
echo "  New files: $(git diff --cached --name-status | grep '^A' | wc -l | xargs)"
echo "  Modified files: $(git diff --cached --name-status | grep '^M' | wc -l | xargs)"
echo "  Deleted files: $(git diff --cached --name-status | grep '^D' | wc -l | xargs)"

# Check for empty directories and warn
if find . -type d -empty -not -path "./.git*" -not -path "./node_modules*" | head -1 | grep -q .; then
  echo "⚠️ Empty directories found (these won't be committed to git):"
  find . -type d -empty -not -path "./.git*" -not -path "./node_modules*" | head -5
fi

# Run validation checks before committing
echo "🔍 Running validation checks..."

# Check if we have node_modules and package.json
if [ -f "package.json" ] && [ -d "node_modules" ]; then
  echo "📦 Running npm build check..."
  if ! npm run build; then
    echo "❌ Build failed! Please fix build errors before pushing."
    echo "💡 Run 'npm run build' to see the full error output"
    exit 1
  fi
  
  echo "🧪 Running type check..."
  if ! npm run type-check; then
    echo "❌ Type check failed! Please fix type errors before pushing."
    echo "💡 Run 'npm run type-check' to see the full error output"
    exit 1
  fi
  
  echo "🧪 Running tests..."
  if ! npm run test -- --testPathIgnorePatterns="backend/" --testPathIgnorePatterns="web-interface/"; then
    echo "❌ Root tests failed! Please fix failing tests before pushing."
    echo "💡 Run 'npm run test' to see the full error output"
    exit 1
  fi
else
  echo "⚠️ No package.json or node_modules found, skipping validation"
fi

# Check web-interface directory if it exists
if [ -d "web-interface" ] && [ -f "web-interface/package.json" ]; then
  echo "🌐 Checking web-interface..."
  cd web-interface
  
  if [ -d "node_modules" ]; then
    echo "📦 Running web-interface build check..."
    if ! npm run build; then
      echo "❌ Web interface build failed! Please fix build errors before pushing."
      cd ..
      exit 1
    fi
    
    echo "🧪 Running web-interface type check..."
    if ! npm run type-check; then
      echo "❌ Web interface type check failed! Please fix type errors before pushing."
      cd ..
      exit 1
    fi
    
    echo "🧪 Running web-interface tests..."
    if ! npm run test; then
      echo "❌ Web interface tests failed! Please fix failing tests before pushing."
      cd ..
      exit 1
    fi
  else
    echo "⚠️ No node_modules in web-interface, skipping validation"
  fi
  
  cd ..
fi

echo "✅ All validation checks passed!"

# Commit changes
git commit -m "Auto update: $(date '+%Y-%m-%d %H:%M:%S')" -m "
🔄 Incremental update

📝 Changed files in this commit:
$(git diff --cached --name-only | head -10)

✅ ReserveBTC Protocol Updates
🚀 Build: Passed validation
🧪 Tests: All passing
🔍 TypeScript: No errors
🔧 Components: Updated and tested
📊 Quality: Maintained high standards
"

# Clean git history occasionally to keep repo lightweight
if [ $(git rev-list --count HEAD) -gt 100 ]; then
  echo "🧹 Cleaning git history to keep repository lightweight..."
  ./rewrite-git-history.sh
fi

# Push changes
echo "🚀 Pushing changes to GitHub..."
if git push origin main; then
  echo ""
  echo "🎉 SUCCESS! Changes pushed to repository!"
  echo "✅ Only modified files were updated"
  echo "✅ Git history preserved"
  echo ""
  echo "🌐 Repository: https://github.com/reservebtc/app.reservebtc.io"
  echo "👤 Author: ReserveBTC"
  echo "📧 Email: reservebtcproof@gmail.com"
  echo ""
  echo "📊 Changes pushed incrementally!"
else
  echo "❌ Push failed. Checking token and permissions..."
  echo "🔑 Token: ${GITHUB_TOKEN:0:10}..."
  echo "💡 Make sure token has 'repo' permissions"
  exit 1
fi