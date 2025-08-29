#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🧪 ReserveBTC Web Interface - Comprehensive Test Suite')
console.log('=' .repeat(60))

const testSuites = [
  {
    name: 'Unit Tests - Bitcoin Validation',
    command: 'npx jest lib/__tests__/bitcoin-validation.test.ts --verbose',
    category: 'Unit Tests'
  },
  {
    name: 'Unit Tests - Validation Schemas',
    command: 'npx jest lib/__tests__/validation-schemas.test.ts --verbose',
    category: 'Unit Tests'
  },
  {
    name: 'Component Tests - Theme Toggle',
    command: 'npx jest components/ui/__tests__/theme-toggle-simple.test.tsx --verbose',
    category: 'Component Tests'
  },
  {
    name: 'Component Tests - Wallet Connect',
    command: 'npx jest components/wallet/__tests__/wallet-connect-simple.test.tsx --verbose',
    category: 'Component Tests'
  },
  {
    name: 'API Tests - Wallet Verification',
    command: 'npx jest app/api/__tests__/verify-wallet-simple.test.ts --verbose',
    category: 'API Tests'
  },
  {
    name: 'Accessibility Tests',
    command: 'npx jest __tests__/accessibility-simple.test.tsx --verbose',
    category: 'Accessibility Tests'
  },
  {
    name: 'Security & Performance Tests',
    command: 'npm audit',
    category: 'Security Tests'
  }
]

const results = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
}

function runTest(testSuite) {
  console.log(`\n🔬 Running: ${testSuite.name}`)
  console.log('-'.repeat(50))
  
  try {
    const output = execSync(testSuite.command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      timeout: 60000 // 60 second timeout
    })
    
    console.log('✅ PASSED')
    results.passed++
    results.details.push({
      name: testSuite.name,
      category: testSuite.category,
      status: 'PASSED',
      output: output.slice(-500) // Last 500 chars
    })
    
    return true
  } catch (error) {
    // Special handling for security tests - they might pass but have coverage output
    if (testSuite.category === 'Security Tests' && error.status === 0) {
      console.log('✅ PASSED')
      results.passed++
      results.details.push({
        name: testSuite.name,
        category: testSuite.category,
        status: 'PASSED',
        output: (error.stdout || '').slice(-500)
      })
      return true
    }
    
    console.log('❌ FAILED')
    console.log(error.stdout || error.message)
    
    results.failed++
    results.details.push({
      name: testSuite.name,
      category: testSuite.category,
      status: 'FAILED',
      error: error.message,
      output: error.stdout || 'No output available'
    })
    
    return false
  }
}

// Generate coverage report
function generateCoverageReport() {
  console.log('\n📊 Generating Coverage Report...')
  try {
    const coverageOutput = execSync('npx jest --coverage --coverageReporters=text-summary', { 
      encoding: 'utf8',
      stdio: 'pipe'
    })
    
    console.log('✅ Coverage Report Generated')
    return coverageOutput
  } catch (error) {
    console.log('❌ Coverage Generation Failed')
    return null
  }
}

// Security audit
function runSecurityAudit() {
  console.log('\n🔒 Running Security Audit...')
  try {
    execSync('npm audit --audit-level moderate', { 
      encoding: 'utf8',
      stdio: 'inherit'
    })
    console.log('✅ Security Audit Passed')
    return true
  } catch (error) {
    console.log('⚠️  Security Issues Found - Check output above')
    return false
  }
}

// Main execution
async function main() {
  const startTime = Date.now()
  
  console.log('Starting comprehensive test suite...\n')
  
  // Run all test suites
  for (const testSuite of testSuites) {
    results.total++
    runTest(testSuite)
  }
  
  // Generate coverage
  const coverage = generateCoverageReport()
  
  // Run security audit
  const securityPassed = runSecurityAudit()
  
  const endTime = Date.now()
  const duration = ((endTime - startTime) / 1000).toFixed(2)
  
  // Print summary
  console.log('\n' + '='.repeat(60))
  console.log('📋 TEST SUITE SUMMARY')
  console.log('='.repeat(60))
  console.log(`⏱️  Duration: ${duration}s`)
  console.log(`✅ Passed: ${results.passed}`)
  console.log(`❌ Failed: ${results.failed}`)
  console.log(`📊 Total: ${results.total}`)
  console.log(`🎯 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`)
  
  if (securityPassed) {
    console.log('🔒 Security: PASSED')
  } else {
    console.log('🔒 Security: WARNING')
  }
  
  // Categorized results
  console.log('\n📂 Results by Category:')
  const categories = {}
  results.details.forEach(result => {
    if (!categories[result.category]) {
      categories[result.category] = { passed: 0, failed: 0 }
    }
    if (result.status === 'PASSED') {
      categories[result.category].passed++
    } else {
      categories[result.category].failed++
    }
  })
  
  Object.entries(categories).forEach(([category, stats]) => {
    const total = stats.passed + stats.failed
    const rate = ((stats.passed / total) * 100).toFixed(1)
    console.log(`  ${category}: ${stats.passed}/${total} (${rate}%)`)
  })
  
  // Generate badge information
  const badgeColor = results.failed === 0 ? 'brightgreen' : results.failed < 2 ? 'yellow' : 'red'
  const badgeText = `${results.passed}/${results.total} passing`
  
  console.log('\n🏆 Test Badge Info:')
  console.log(`[![Frontend Tests](https://img.shields.io/badge/Frontend%20Tests-${encodeURIComponent(badgeText)}-${badgeColor})](./scripts/test-runner.js)`)
  
  if (coverage) {
    console.log('\n📊 Coverage Summary:')
    console.log(coverage.split('\n').slice(-10).join('\n'))
  }
  
  // Exit with appropriate code
  if (results.failed === 0 && securityPassed) {
    console.log('\n🎉 ALL TESTS PASSED! Ready for production.')
    process.exit(0)
  } else {
    console.log('\n⚠️  Some tests failed. Please review and fix issues.')
    process.exit(1)
  }
}

// Error handling
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error.message)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

// Run the test suite
main().catch(error => {
  console.error('💥 Test runner failed:', error.message)
  process.exit(1)
})