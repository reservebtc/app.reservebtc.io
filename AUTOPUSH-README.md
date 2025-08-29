# 🚀 ReserveBTC Autopush Guide

## 📋 Overview

The `autopush.sh` script is configured to:
- Use GitHub token from `.env` file (secure)
- Set correct ReserveBTC identity
- Push changes to https://github.com/reservebtc/app.reservebtc.io

## 🔧 Setup Instructions

### 1. **Environment File Created ✅**
The `.env` file is already created with your GitHub token:
```bash
GITHUB_TOKEN=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
```

### 2. **Security Protected ✅**
- `.env` file is in `.gitignore` - won't be committed to Git
- Token is loaded securely from environment variables
- No token exposure in commit history

### 3. **Git Identity Configured ✅**
```bash
user.name=reserveBTC
user.email=reservebtcproof@gmail.com
```

## 🎯 How to Use

### **Push Changes:**
```bash
./autopush.sh
```

### **What the script does:**
1. ✅ Loads GitHub token from `.env` file
2. ✅ Sets ReserveBTC git identity
3. ✅ Creates fresh git repository (removes all history)
4. ✅ Commits all changes with ReserveBTC authorship
5. ✅ Force pushes to GitHub as reservebtc organization

## 📊 Expected Output

```bash
🚀 ReserveBTC Autopush Script
============================================================
📄 Loading environment variables from .env file...
🔑 Using GitHub Personal Access Token for authentication...
🧹 COMPLETE CLEANUP: Removing all Git history from previous commits...
🆕 Creating absolutely new repository as ReserveBTC...
✅ FRESH Git repository created as ReserveBTC (NO previous history!)
🚀 COMPLETE REPOSITORY REPLACEMENT on GitHub as ReserveBTC...
⚡ Force-push new ReserveBTC repository...
🎉 SUCCESS! Repository completely replaced with ReserveBTC!
```

## 🔒 Security Features

- ✅ **Token in .env file** - Not committed to Git
- ✅ **No token exposure** - Secure environment loading  
- ✅ **Correct authorship** - All commits from reserveBTC
- ✅ **Clean history** - No previous commits visible

## 🎯 Repository Details

- **Organization:** https://github.com/reservebtc
- **Repository:** https://github.com/reservebtc/app.reservebtc.io  
- **Author:** reserveBTC <reservebtcproof@gmail.com>
- **Token:** Loaded from `.env` file securely

## 🚀 GitHub Actions Integration

After pushing with `./autopush.sh`, these workflows will run automatically:
- [![Frontend Tests](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/frontend-tests.yml/badge.svg?branch=main)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/frontend-tests.yml)
- [![Unit Tests](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/unit-tests.yml/badge.svg?branch=main)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/unit-tests.yml)
- [![Security Audit](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/security-audit.yml/badge.svg?branch=main)](https://github.com/reservebtc/app.reservebtc.io/actions/workflows/security-audit.yml)

## 📝 Troubleshooting

### **Error: "No GitHub token found"**
- Check that `.env` file exists in project root
- Verify `GITHUB_TOKEN=` line in `.env` file
- Make sure token has `repo` permissions

### **Error: "Push failed"**
- Verify token has access to reservebtc organization
- Check token permissions include `repo` scope
- Try running script again

### **Error: "Permission denied"**
- Make script executable: `chmod +x autopush.sh`
- Check you're in project root directory

## ✨ Ready to Use!

Everything is configured and ready. Just run:
```bash
./autopush.sh
```

The script will handle everything automatically! 🚀