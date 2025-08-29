#!/usr/bin/env node

const { execSync } = require('child_process')

console.log('🧪 Simple Test Runner - ReserveBTC Frontend')
console.log('='.repeat(50))

const tests = [
  {
    name: 'Bitcoin Validation',
    cmd: 'npx jest lib/__tests__/bitcoin-validation.test.ts --verbose --no-cache'
  },
  {
    name: 'Validation Schemas', 
    cmd: 'npx jest lib/__tests__/validation-schemas.test.ts --verbose --no-cache'
  }
]

let passed = 0
let failed = 0

for (const test of tests) {
  console.log(`\n🔬 Running: ${test.name}`)
  console.log('-'.repeat(30))
  
  try {
    execSync(test.cmd, { stdio: 'inherit', timeout: 30000 })
    console.log('✅ PASSED')
    passed++
  } catch (error) {
    console.log('❌ FAILED')
    failed++
  }
}

console.log('\n' + '='.repeat(50))
console.log(`📊 Results: ✅${passed} ❌${failed}`)

if (failed === 0) {
  console.log('🎉 All tests passed!')
  process.exit(0)
} else {
  console.log('⚠️  Some tests failed')
  process.exit(1)
}