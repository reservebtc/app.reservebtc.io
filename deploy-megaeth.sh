#!/bin/bash

# MegaETH Testnet Deployment Script for ReserveBTC
# Usage: ./deploy-megaeth.sh

set -e

echo "🚀 ReserveBTC Deployment to MegaETH Testnet"
echo "==========================================="

# Check if .env.deploy exists
if [ ! -f "contracts/.env.deploy" ]; then
    echo "❌ Error: contracts/.env.deploy file not found!"
    echo "Please create it and add your PRIVATE_KEY"
    exit 1
fi

# Load environment variables
export $(grep -v '^#' contracts/.env.deploy | xargs)

# Validate required variables
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: PRIVATE_KEY not set in .env.deploy"
    echo "Please add your MetaMask private key (without 0x)"
    exit 1
fi

if [ -z "$RPC_URL" ]; then
    echo "❌ Error: RPC_URL not set"
    exit 1
fi

echo "🔍 Configuration:"
echo "RPC URL: $RPC_URL"
echo "Chain ID: 6342 (MegaETH Testnet)"

# Navigate to contracts directory
cd contracts

echo ""
echo "🔧 Checking Foundry installation..."
if ! command -v forge &> /dev/null; then
    echo "❌ Foundry not found. Please install: https://getfoundry.sh"
    exit 1
fi

echo "✅ Foundry found: $(forge --version)"

echo ""
echo "📦 Installing contract dependencies..."
forge install --no-commit

echo ""
echo "🧪 Running pre-deployment tests..."
forge test --no-match-test "testFuzz" --no-match-test "invariant" -q

if [ $? -ne 0 ]; then
    echo "❌ Tests failed. Aborting deployment."
    exit 1
fi

echo "✅ All tests passed"

echo ""
echo "🚀 Deploying to MegaETH Testnet..."
echo "This will deploy all ReserveBTC contracts..."
read -p "Continue? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 1
fi

echo ""
echo "📡 Deploying contracts to MegaETH..."

# Deploy using the custom script
forge script script/DeployMegaETH.s.sol \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast \
    --slow \
    -v

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 DEPLOYMENT SUCCESSFUL!"
    echo "================================"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Copy the contract addresses from the output above"
    echo "2. Update your frontend configuration with these addresses"
    echo "3. Add MegaETH Testnet to MetaMask:"
    echo "   - Network Name: MegaETH Testnet"
    echo "   - RPC URL: https://carrot.megaeth.com/rpc"
    echo "   - Chain ID: 6342"
    echo "   - Currency: ETH"
    echo ""
    echo "4. Test the contracts using the web interface"
    echo "5. Monitor transactions on MegaETH explorer"
    echo ""
    echo "🔗 Useful Links:"
    echo "MegaETH Explorer: https://megaexplorer.xyz"
    echo "MegaETH Docs: https://docs.megaeth.com"
    echo ""
else
    echo ""
    echo "❌ DEPLOYMENT FAILED!"
    echo "Check the error messages above and try again."
    echo ""
    echo "Common issues:"
    echo "- Insufficient testnet ETH for gas"
    echo "- Wrong private key format (should be without 0x)"
    echo "- Network connectivity issues"
    exit 1
fi