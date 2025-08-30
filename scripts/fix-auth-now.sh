#!/bin/bash

# 🔧 Quick Fix for Git Authentication
# Fixes current auth issue immediately

echo "🔧 Quick Git Auth Fix"
echo "===================="

# Check current remote
echo "🔍 Current remote:"
git remote -v

echo ""
echo "🔐 Choose quick fix:"
echo "1) Use GitHub CLI (recommended)"
echo "2) Remove stored credentials and retry"
echo "3) Switch to SSH"
echo ""

read -p "Choice (1-3): " choice

case $choice in
    1)
        echo "🚀 Using GitHub CLI..."
        
        # Check if gh is installed
        if ! command -v gh &> /dev/null; then
            echo "❌ Install GitHub CLI first:"
            echo "   brew install gh"
            exit 1
        fi
        
        # Login and set remote
        gh auth login
        gh repo view --json url -q .url | xargs git remote set-url origin
        
        echo "✅ Fixed! Try pushing now."
        ;;
        
    2)
        echo "🧹 Clearing stored credentials..."
        
        # Remove stored credentials
        git config --unset credential.helper
        git config --global --unset credential.helper
        
        # Clear credential cache
        if command -v git-credential-osxkeychain &> /dev/null; then
            printf "protocol=https\nhost=github.com\n" | git-credential-osxkeychain erase
        fi
        
        echo "✅ Credentials cleared!"
        echo "💡 Next push will ask for new credentials."
        ;;
        
    3)
        echo "🔑 Switching to SSH..."
        
        # Get repo path
        repo_url=$(git remote get-url origin)
        repo_path=$(echo $repo_url | sed 's|.*github.com[:/]||' | sed 's|\.git$||')
        
        # Switch to SSH
        git remote set-url origin "git@github.com:$repo_path.git"
        
        echo "✅ Switched to SSH!"
        echo "💡 Make sure your SSH key is added to GitHub."
        ;;
esac

echo ""
echo "🧪 Testing connection..."
git ls-remote origin HEAD >/dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Connection successful!"
    echo "🚀 Ready to push!"
else
    echo "❌ Still having issues. Run:"
    echo "   ./scripts/setup-git-auth.sh"
fi