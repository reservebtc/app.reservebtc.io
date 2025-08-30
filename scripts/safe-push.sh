#!/bin/bash

# 🚀 Safe Git Push Script
# Pushes changes without exposing tokens in logs

echo "🚀 Safe Git Push"
echo "==============="

# Check if we're in a git repo
if [ ! -d ".git" ]; then
    echo "❌ Not in a git repository!"
    exit 1
fi

# Check if there are changes to commit
if git diff --cached --quiet; then
    echo "📝 No staged changes found."
    
    # Check if there are unstaged changes
    if ! git diff --quiet; then
        echo "🔍 Found unstaged changes. Staging all..."
        git add .
    else
        echo "✅ Nothing to commit, working tree clean."
        exit 0
    fi
fi

# Get commit message
if [ -n "$1" ]; then
    commit_msg="$1"
else
    read -p "💬 Enter commit message: " commit_msg
    
    if [ -z "$commit_msg" ]; then
        commit_msg="Update $(date '+%Y-%m-%d %H:%M')"
    fi
fi

echo ""
echo "📦 Creating commit..."
git commit -m "$commit_msg" --quiet

if [ $? -ne 0 ]; then
    echo "❌ Commit failed!"
    exit 1
fi

echo "✅ Commit created successfully!"
echo ""

# Push changes
echo "🚀 Pushing to GitHub..."
git push --quiet 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Push successful!"
    echo ""
    echo "🌐 Your changes are now on GitHub!"
    
    # Show repo URL if possible
    repo_url=$(git remote get-url origin 2>/dev/null)
    if [ $? -eq 0 ]; then
        clean_url=$(echo $repo_url | sed 's|.*@||' | sed 's|.*://||' | sed 's|.*github.com[:/]|https://github.com/|' | sed 's|\.git$||')
        echo "🔗 View at: $clean_url"
    fi
else
    echo "❌ Push failed!"
    echo ""
    echo "🔧 Try these solutions:"
    echo "1. Run authentication setup:"
    echo "   ./scripts/setup-git-auth.sh"
    echo ""
    echo "2. Or manually configure git:"
    echo "   git config --global user.name \"Your Name\""
    echo "   git config --global user.email \"your@email.com\""
    echo ""
    echo "3. Check repository permissions"
    exit 1
fi