#!/usr/bin/env node

// Простой тест без Jest для проверки функциональности

const { validateBitcoinAddress, getBitcoinAddressTypeLabel } = require('./lib/bitcoin-validation.ts')

console.log('🧪 Manual Test - Bitcoin Validation')
console.log('='.repeat(40))

const testCases = [
  {
    name: 'Valid Taproot',
    address: 'bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297',
    expected: { isValid: true, type: 'taproot' }
  },
  {
    name: 'Valid SegWit',
    address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
    expected: { isValid: true, type: 'segwit' }
  },
  {
    name: 'Valid Legacy P2PKH',
    address: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
    expected: { isValid: true, type: 'legacy' }
  },
  {
    name: 'Invalid empty',
    address: '',
    expected: { isValid: false, type: 'unknown' }
  },
  {
    name: 'Invalid format',
    address: 'invalid-address',
    expected: { isValid: false, type: 'unknown' }
  }
]

let passed = 0
let failed = 0

testCases.forEach(testCase => {
  console.log(`\n🔬 Testing: ${testCase.name}`)
  
  try {
    const result = validateBitcoinAddress(testCase.address)
    
    if (result.isValid === testCase.expected.isValid && result.type === testCase.expected.type) {
      console.log('✅ PASSED')
      passed++
    } else {
      console.log('❌ FAILED')
      console.log(`  Expected: ${JSON.stringify(testCase.expected)}`)
      console.log(`  Received: ${JSON.stringify({ isValid: result.isValid, type: result.type })}`)
      failed++
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message)
    failed++
  }
})

console.log('\n' + '='.repeat(40))
console.log(`📊 Results: ✅${passed} ❌${failed}`)

if (failed === 0) {
  console.log('🎉 All manual tests passed!')
} else {
  console.log('⚠️  Some tests failed')
}