#!/bin/bash

# Oracle Server Contract Address Update Script
# This script updates Oracle server to use the new contract addresses

echo "🔧 Oracle Contract Address Update"
echo "================================="

# New contract addresses after atomic deployment
OLD_ORACLE_ADDRESS="0x717D12a23Bb46743b15019a52184DF7F250B061a"
NEW_ORACLE_ADDRESS="0x611AFD3808e732Ba89A0D9991d2902b0Df9bd149"

OLD_RBTC_SYNTH="0xF1C8B589005F729bfd2a722e5B171e4e0F9aCBcB" 
NEW_RBTC_SYNTH="0x37fE059490B70e2605cb3D6fD64F5292d3eB46dE"

OLD_FEE_POLICY="0x2F0f48EA3dD5bCff86A178F20f9c4AB2860CD468"
NEW_FEE_POLICY="0xc10fD3a2DF480CFAE8a7aBC2862a9c5724f5f4b4"

echo "📋 Contract Address Updates:"
echo "   OLD Oracle Aggregator: $OLD_ORACLE_ADDRESS"
echo "   NEW Oracle Aggregator: $NEW_ORACLE_ADDRESS"
echo ""
echo "   OLD RBTCSynth: $OLD_RBTC_SYNTH"
echo "   NEW RBTCSynth: $NEW_RBTC_SYNTH"
echo ""
echo "   OLD FeePolicy: $OLD_FEE_POLICY"
echo "   NEW FeePolicy: $NEW_FEE_POLICY"

echo ""
echo "🔍 Step 1: Locate Oracle Server Files"
echo "======================================"

# Find Oracle server process
ORACLE_PID=$(pgrep -f "oracle-server" | head -1)
if [ ! -z "$ORACLE_PID" ]; then
    ORACLE_CWD=$(pwdx $ORACLE_PID 2>/dev/null | cut -d' ' -f2-)
    echo "✅ Oracle server found (PID: $ORACLE_PID)"
    echo "   Working directory: $ORACLE_CWD"
else
    echo "⚠️ Oracle server process not found"
    ORACLE_CWD="/root"
fi

# Potential Oracle files to update
POTENTIAL_FILES=(
    "$ORACLE_CWD/oracle-server.js"
    "$ORACLE_CWD/config.json" 
    "$ORACLE_CWD/.env"
    "/root/oracle-server.js"
    "/root/oracle-config.json"
    "/root/.pm2/ecosystem.config.js"
)

echo ""
echo "🔍 Step 2: Find Configuration Files"
echo "=================================="

FILES_TO_UPDATE=()
for file in "${POTENTIAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "📄 Found: $file"
        if grep -q "$OLD_ORACLE_ADDRESS" "$file" 2>/dev/null; then
            echo "   ✅ Contains old Oracle address - needs update"
            FILES_TO_UPDATE+=("$file")
        fi
    fi
done

# Search for any files containing old addresses
echo ""
echo "🔍 Searching for files with old addresses..."
find "$ORACLE_CWD" -type f \( -name "*.js" -o -name "*.json" -o -name "*.env" \) -exec grep -l "$OLD_ORACLE_ADDRESS" {} \; 2>/dev/null | while read found_file; do
    echo "   📄 Found: $found_file"
    FILES_TO_UPDATE+=("$found_file")
done

echo ""
echo "🔧 Step 3: Update Contract Addresses"
echo "=================================="

FILES_UPDATED=0
for file in "${FILES_TO_UPDATE[@]}"; do
    if [ -f "$file" ]; then
        echo "🔄 Updating: $file"
        
        # Create backup
        cp "$file" "${file}.backup.$(date +%Y%m%d_%H%M%S)"
        echo "   💾 Backup created: ${file}.backup.$(date +%Y%m%d_%H%M%S)"
        
        # Update Oracle Aggregator address
        if grep -q "$OLD_ORACLE_ADDRESS" "$file"; then
            sed -i "s/$OLD_ORACLE_ADDRESS/$NEW_ORACLE_ADDRESS/g" "$file"
            echo "   ✅ Updated Oracle Aggregator address"
        fi
        
        # Update RBTCSynth address
        if grep -q "$OLD_RBTC_SYNTH" "$file"; then
            sed -i "s/$OLD_RBTC_SYNTH/$NEW_RBTC_SYNTH/g" "$file"
            echo "   ✅ Updated RBTCSynth address"
        fi
        
        # Update FeePolicy address
        if grep -q "$OLD_FEE_POLICY" "$file"; then
            sed -i "s/$OLD_FEE_POLICY/$NEW_FEE_POLICY/g" "$file"
            echo "   ✅ Updated FeePolicy address"
        fi
        
        FILES_UPDATED=$((FILES_UPDATED + 1))
        echo "   ✅ File updated successfully"
        echo ""
    fi
done

echo ""
echo "🔄 Step 4: Restart Oracle Server"
echo "==============================="

if [ $FILES_UPDATED -gt 0 ]; then
    echo "📊 Update Summary:"
    echo "   Files updated: $FILES_UPDATED"
    echo "   Oracle Aggregator: $OLD_ORACLE_ADDRESS → $NEW_ORACLE_ADDRESS"
    echo "   RBTCSynth: $OLD_RBTC_SYNTH → $NEW_RBTC_SYNTH"  
    echo "   FeePolicy: $OLD_FEE_POLICY → $NEW_FEE_POLICY"
    echo ""
    
    echo "🔄 Restarting Oracle server..."
    if command -v pm2 >/dev/null 2>&1; then
        pm2 restart oracle-server
        echo "   ✅ PM2 restart command sent"
    else
        echo "   ⚠️ PM2 not found, manual restart required"
    fi
    
    echo ""
    echo "⏱️ Waiting for Oracle to restart..."
    sleep 10
    
    echo ""
    echo "🧪 Step 5: Verify Update"
    echo "======================"
    
    echo "📊 Checking Oracle status..."
    curl -s https://oracle.reservebtc.io/ | jq . 2>/dev/null || echo "Oracle API not responding yet"
    
    echo ""
    echo "👥 Checking tracked users..."
    curl -s https://oracle.reservebtc.io/users | jq . 2>/dev/null || echo "Users API not responding yet"
    
    echo ""
    echo "✅ Update completed!"
    echo "📋 Next steps:"
    echo "   1. Monitor Oracle logs: pm2 logs oracle-server"
    echo "   2. Check Oracle status at: https://oracle.reservebtc.io/"
    echo "   3. Verify contract addresses in Oracle response"
    echo "   4. Test token minting with updated configuration"
    
else
    echo "⚠️ No files were updated. Possible reasons:"
    echo "   1. Oracle server not found"
    echo "   2. Configuration stored elsewhere"
    echo "   3. Already using correct addresses"
    echo ""
    echo "🔍 Manual check required:"
    echo "   - Check PM2 process list: pm2 status"
    echo "   - Check Oracle logs: pm2 logs oracle-server"
    echo "   - Verify Oracle API response: curl https://oracle.reservebtc.io/"
fi

echo ""
echo "🔚 Script completed!"