#!/bin/bash

# 🔐 Simple Git Authentication Setup
# This script helps you set up Git authentication safely

echo "🔐 Git Authentication Setup"
echo "=========================="
echo ""

# Check if we're in a git repo
if [ ! -d ".git" ]; then
    echo "❌ Not in a git repository!"
    exit 1
fi

echo "Choose authentication method:"
echo "1) GitHub CLI (gh) - Recommended ✅"
echo "2) Personal Access Token"
echo "3) SSH Keys"
echo ""

read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Setting up GitHub CLI authentication..."
        echo ""
        
        # Check if gh is installed
        if ! command -v gh &> /dev/null; then
            echo "❌ GitHub CLI not installed."
            echo "📦 Install it with:"
            echo "   macOS: brew install gh"
            echo "   Windows: winget install GitHub.cli"
            echo ""
            exit 1
        fi
        
        # Login with GitHub CLI
        echo "🔑 Logging in to GitHub..."
        gh auth login
        
        # Set remote to use HTTPS
        echo "🔗 Updating remote URL..."
        gh repo view --json url -q .url | xargs git remote set-url origin
        
        echo "✅ GitHub CLI authentication setup complete!"
        echo "💡 Now you can push with: git push"
        ;;
        
    2)
        echo ""
        echo "🔑 Setting up Personal Access Token..."
        echo ""
        echo "📋 Steps:"
        echo "1. Go to: https://github.com/settings/tokens"
        echo "2. Click 'Generate new token (classic)'"
        echo "3. Select scopes: 'repo', 'workflow'"
        echo "4. Copy the token"
        echo ""
        
        read -s -p "🔐 Paste your token here (hidden): " token
        echo ""
        
        if [ -z "$token" ]; then
            echo "❌ No token provided!"
            exit 1
        fi
        
        # Get username
        read -p "📝 Enter your GitHub username: " username
        
        if [ -z "$username" ]; then
            echo "❌ No username provided!"
            exit 1
        fi
        
        # Store credentials safely
        git config --local credential.helper store
        
        # Set remote URL with token
        repo_url=$(git remote get-url origin)
        repo_path=$(echo $repo_url | sed 's|.*github.com[:/]||' | sed 's|\.git$||')
        
        git remote set-url origin "https://$username:$token@github.com/$repo_path.git"
        
        echo "✅ Token authentication setup complete!"
        echo "💡 Now you can push with: git push"
        ;;
        
    3)
        echo ""
        echo "🔑 Setting up SSH authentication..."
        echo ""
        
        # Check if SSH key exists
        if [ ! -f "$HOME/.ssh/id_rsa" ] && [ ! -f "$HOME/.ssh/id_ed25519" ]; then
            echo "🆕 Creating new SSH key..."
            read -p "📧 Enter your GitHub email: " email
            
            if [ -z "$email" ]; then
                echo "❌ No email provided!"
                exit 1
            fi
            
            ssh-keygen -t ed25519 -C "$email"
            
            # Start SSH agent
            eval "$(ssh-agent -s)"
            
            # Add key to agent
            ssh-add ~/.ssh/id_ed25519
            
            echo ""
            echo "📋 Copy this public key to GitHub:"
            echo "   Go to: https://github.com/settings/ssh/new"
            echo ""
            cat ~/.ssh/id_ed25519.pub
            echo ""
            read -p "Press Enter after adding the key to GitHub..."
        fi
        
        # Set remote to SSH
        repo_url=$(git remote get-url origin)
        repo_path=$(echo $repo_url | sed 's|.*github.com[:/]||' | sed 's|\.git$||')
        
        git remote set-url origin "git@github.com:$repo_path.git"
        
        # Test SSH connection
        echo "🧪 Testing SSH connection..."
        ssh -T git@github.com
        
        echo "✅ SSH authentication setup complete!"
        echo "💡 Now you can push with: git push"
        ;;
        
    *)
        echo "❌ Invalid choice!"
        exit 1
        ;;
esac

echo ""
echo "🎉 Authentication setup complete!"
echo ""
echo "📝 Test with:"
echo "   git status"
echo "   git push"
echo ""