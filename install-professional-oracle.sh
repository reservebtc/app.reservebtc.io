#!/bin/bash

# Professional Oracle Server Installation Script
# This script installs and configures the Professional Oracle Server
# for enterprise-grade user profile management (10,000+ users)

echo "🏢 Professional Oracle Server Installation"
echo "=========================================="

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root" 
   exit 1
fi

echo "📦 Installing required Node.js packages..."

# Install required dependencies
npm install express cors crypto fs path viem express-rate-limit

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "📁 Creating Oracle data directories..."

# Create data directories
mkdir -p /opt/oracle/professional
mkdir -p /opt/oracle/professional/backups
chmod 755 /opt/oracle/professional
chmod 755 /opt/oracle/professional/backups

echo "✅ Data directories created"

echo ""
echo "🔐 Setting up encryption and security..."

# Generate SSL certificate for HTTPS (if not exists)
if [ ! -f /etc/ssl/certs/oracle-server.crt ]; then
    echo "🔒 Generating SSL certificate..."
    openssl req -x509 -newkey rsa:4096 -keyout /etc/ssl/private/oracle-server.key -out /etc/ssl/certs/oracle-server.crt -days 365 -nodes -subj "/C=US/ST=State/L=City/O=ReserveBTC/CN=oracle.reservebtc.io"
    chmod 600 /etc/ssl/private/oracle-server.key
    echo "✅ SSL certificate generated"
fi

echo ""
echo "⚙️ Configuring system optimizations for 10,000+ users..."

# System optimizations for high user load
cat > /etc/sysctl.d/99-oracle-performance.conf << EOF
# Oracle Server Performance Optimizations for 10,000+ users
net.core.somaxconn = 8192
net.core.netdev_max_backlog = 5000
net.core.rmem_default = 262144
net.core.rmem_max = 16777216
net.core.wmem_default = 262144
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 12582912 16777216
net.ipv4.tcp_wmem = 4096 12582912 16777216
net.ipv4.tcp_max_syn_backlog = 8096
net.ipv4.tcp_slow_start_after_idle = 0
net.ipv4.tcp_tw_reuse = 1
fs.file-max = 100000
fs.nr_open = 100000
EOF

# Apply sysctl settings
sysctl -p /etc/sysctl.d/99-oracle-performance.conf

echo "✅ System optimizations applied"

echo ""
echo "📊 Configuring log rotation..."

# Configure log rotation for Oracle server
cat > /etc/logrotate.d/oracle-server << EOF
/var/log/oracle-server/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
    postrotate
        systemctl reload oracle-professional || true
    endscript
}
EOF

# Create log directory
mkdir -p /var/log/oracle-server
chmod 755 /var/log/oracle-server

echo "✅ Log rotation configured"

echo ""
echo "🔧 Creating systemd service..."

# Create systemd service file
cat > /etc/systemd/system/oracle-professional.service << EOF
[Unit]
Description=Professional Oracle Server for ReserveBTC
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root
ExecStart=/usr/bin/node /root/professional-oracle-server.js
Restart=always
RestartSec=10
StandardOutput=append:/var/log/oracle-server/output.log
StandardError=append:/var/log/oracle-server/error.log
Environment=NODE_ENV=production

# Security settings
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/oracle /var/log/oracle-server
PrivateDevices=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true

# Resource limits for 10,000+ users
LimitNOFILE=65536
LimitNPROC=32768

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Systemd service created"

echo ""
echo "🔄 Setting up auto-restart and monitoring..."

# Create monitoring script
cat > /root/oracle-health-monitor.sh << 'EOF'
#!/bin/bash

# Oracle Server Health Monitor
# Checks server health and restarts if necessary

LOG_FILE="/var/log/oracle-server/health-monitor.log"
ORACLE_URL="http://localhost:3000/health"
MAX_RETRIES=3

log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') $1" >> $LOG_FILE
}

check_oracle_health() {
    local retry_count=0
    
    while [ $retry_count -lt $MAX_RETRIES ]; do
        if curl -s $ORACLE_URL > /dev/null; then
            log_message "✅ Oracle server health check passed"
            return 0
        fi
        
        retry_count=$((retry_count + 1))
        log_message "⚠️ Oracle health check failed (attempt $retry_count/$MAX_RETRIES)"
        sleep 5
    done
    
    log_message "❌ Oracle server health check failed after $MAX_RETRIES attempts"
    return 1
}

# Main health check
if ! check_oracle_health; then
    log_message "🔄 Restarting Oracle server..."
    systemctl restart oracle-professional
    
    # Wait for restart and verify
    sleep 30
    if check_oracle_health; then
        log_message "✅ Oracle server restarted successfully"
    else
        log_message "❌ Oracle server restart failed"
    fi
fi
EOF

chmod +x /root/oracle-health-monitor.sh

# Create cron job for health monitoring (every 5 minutes)
echo "*/5 * * * * /root/oracle-health-monitor.sh" | crontab -

echo "✅ Health monitoring configured"

echo ""
echo "🔥 Setting up firewall rules..."

# Configure UFW firewall
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# Allow SSH
ufw allow ssh

# Allow Oracle server port
ufw allow 3000/tcp

# Allow HTTPS
ufw allow 443/tcp

# Enable firewall
ufw --force enable

echo "✅ Firewall configured"

echo ""
echo "📊 Creating performance monitoring dashboard..."

# Create simple performance dashboard
cat > /root/oracle-performance-dashboard.sh << 'EOF'
#!/bin/bash

# Oracle Performance Dashboard
# Shows real-time performance metrics

clear
echo "🏢 Professional Oracle Server - Performance Dashboard"
echo "===================================================="
echo ""

while true; do
    # Get Oracle status
    ORACLE_STATUS=$(curl -s http://localhost:3000/status 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        echo "📊 Oracle Server Status: OPERATIONAL"
        
        # Extract metrics using jq if available
        if command -v jq &> /dev/null; then
            TOTAL_USERS=$(echo $ORACLE_STATUS | jq -r '.metrics.totalUsers // 0')
            TOTAL_TXS=$(echo $ORACLE_STATUS | jq -r '.metrics.totalTransactions // 0')
            UPTIME=$(echo $ORACLE_STATUS | jq -r '.uptime // 0')
            
            echo "👥 Total Users: $TOTAL_USERS"
            echo "📝 Total Transactions: $TOTAL_TXS"
            echo "⏱️  Uptime: $(($UPTIME / 1000 / 60)) minutes"
        fi
    else
        echo "❌ Oracle Server Status: OFFLINE"
    fi
    
    echo ""
    echo "💻 System Resources:"
    echo "CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
    echo "Memory Usage: $(free | grep Mem | awk '{printf("%.1f%%\n", $3/$2 * 100.0)}')"
    echo "Disk Usage: $(df -h / | tail -1 | awk '{print $5}')"
    
    echo ""
    echo "🔄 Active Connections:"
    netstat -an | grep :3000 | grep ESTABLISHED | wc -l | xargs echo "Oracle Port:"
    
    echo ""
    echo "📈 Last 5 log entries:"
    tail -5 /var/log/oracle-server/output.log 2>/dev/null | head -5
    
    echo ""
    echo "Press Ctrl+C to exit..."
    sleep 10
    clear
    echo "🏢 Professional Oracle Server - Performance Dashboard"
    echo "===================================================="
    echo ""
done
EOF

chmod +x /root/oracle-performance-dashboard.sh

echo "✅ Performance dashboard created"

echo ""
echo "📋 Installation Summary"
echo "======================"
echo "✅ Dependencies installed"
echo "✅ Data directories created: /opt/oracle/professional"
echo "✅ System optimizations applied"
echo "✅ SSL certificate generated"
echo "✅ Log rotation configured"
echo "✅ Systemd service created: oracle-professional"
echo "✅ Health monitoring enabled"
echo "✅ Firewall configured"
echo "✅ Performance dashboard available"

echo ""
echo "🚀 Next Steps:"
echo "============="
echo "1. Copy professional-oracle-server.js to /root/"
echo "2. Start the service: systemctl enable oracle-professional && systemctl start oracle-professional"
echo "3. Check status: systemctl status oracle-professional"
echo "4. View logs: journalctl -fu oracle-professional"
echo "5. Monitor performance: /root/oracle-performance-dashboard.sh"
echo "6. Check health: curl http://localhost:3000/health"

echo ""
echo "🔐 Security Notes:"
echo "=================="
echo "- SSL certificate generated for HTTPS"
echo "- Firewall configured with minimal required ports"
echo "- System resource limits set for high user load"
echo "- Automatic health monitoring and restart enabled"

echo ""
echo "📊 Capacity:"
echo "============"
echo "- Optimized for 10,000+ concurrent users"
echo "- Persistent data storage with automatic backups"
echo "- Enterprise-grade encryption (AES-256-GCM)"
echo "- Real-time blockchain event monitoring"
echo "- Comprehensive transaction history tracking"

echo ""
echo "🏁 Installation Complete!"
echo "========================"