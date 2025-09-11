#!/bin/bash
# Quick redeploy of updated Oracle server

SSH_KEY="~/.ssh/reservebtc_oracle"
SSH_HOST="root@5.78.75.234"

echo "🔄 QUICK REDEPLOY: Updating Oracle server with version 2.1.0..."

# Загружаем обновленный сервер
echo "📤 Uploading updated file..."
scp -i $SSH_KEY professional-oracle-server.js $SSH_HOST:/root/oracle-production-v21.js

# Заменяем и перезапускаем
ssh -i $SSH_KEY $SSH_HOST "
  echo '⏹️  Stopping Oracle service...'
  systemctl stop oracle
  
  echo '🔄 Replacing with v2.1.0...'
  cp /root/oracle-production.js /root/oracle-production-v20.js
  cp /root/oracle-production-v21.js /root/oracle-production.js
  chmod +x /root/oracle-production.js
  
  echo '🚀 Starting Oracle service...'
  systemctl start oracle
  
  sleep 5
  echo '📊 Status check:'
  systemctl status oracle --no-pager -l | head -10
"

echo "✅ Quick redeploy completed!"