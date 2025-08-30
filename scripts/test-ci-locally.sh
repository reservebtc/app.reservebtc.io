#!/bin/bash

# 🚀 Script for local CI environment reproduction
# Uses Docker for identity with GitHub Actions

set -e

echo "🐳 ReserveBTC - Local CI Environment Reproduction"
echo "=================================================="

# Check Docker availability
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker to continue."
    exit 1
fi

# Check docker-compose availability  
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install docker-compose to continue."
    exit 1
fi

# Runtime options
TEST_TYPE=${1:-"all"}

echo "📋 Runtime parameters:"
echo "   Test type: $TEST_TYPE"
echo "   Directory: $(pwd)"
echo ""

case "$TEST_TYPE" in
    "all")
        echo "🧪 Running full test suite..."
        docker-compose -f docker-compose.test.yml run --rm test-runner
        ;;
    "unit")
        echo "🧪 Running unit tests..."
        docker-compose -f docker-compose.test.yml run --rm unit-tests
        ;;
    "components")
        echo "🧪 Running component tests..."
        docker-compose -f docker-compose.test.yml run --rm component-tests
        ;;
    "api")
        echo "🧪 Running API tests..."
        docker-compose -f docker-compose.test.yml run --rm api-tests
        ;;
    "watch")
        echo "👀 Running tests in watch mode..."
        docker-compose -f docker-compose.test.yml run --rm test-dev
        ;;
    "env")
        echo "🔍 Checking environment..."
        docker-compose -f docker-compose.test.yml run --rm env-check
        ;;
    "build")
        echo "🏗️ Rebuilding container..."
        docker-compose -f docker-compose.test.yml build --no-cache
        echo "✅ Container rebuilt successfully"
        ;;
    "clean")
        echo "🧹 Cleaning Docker resources..."
        docker-compose -f docker-compose.test.yml down -v
        docker system prune -f
        echo "✅ Docker resources cleaned"
        ;;
    *)
        echo "❌ Unknown test type: $TEST_TYPE"
        echo ""
        echo "Available options:"
        echo "  all        - Full test suite (default)"
        echo "  unit       - Unit tests"
        echo "  components - Component tests"
        echo "  api        - API tests"  
        echo "  watch      - Interactive mode"
        echo "  env        - Environment check"
        echo "  build      - Rebuild container"
        echo "  clean      - Clean Docker resources"
        echo ""
        echo "Example: ./scripts/test-ci-locally.sh unit"
        exit 1
        ;;
esac

echo ""
echo "✅ Done! Test results above ⬆️"