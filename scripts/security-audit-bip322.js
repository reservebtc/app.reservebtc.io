// security-audit-bip322-professional.js
// PROFESSIONAL BIP-322 SECURITY AUDIT - ReserveBTC Protocol v2.4
// FINAL CLEAN VERSION - Only real vulnerabilities tested
// Ready for MegaETH competition

const VALID_TEST_DATA = {
  bitcoinAddress: 'tb1qq8d4mm3x36tjslk0gk8pkjwkv834m8m9sylrjr',
  ethAddress: '0xc381F1927257fA20782a65005a2cb094637D75e1',
  message: `ReserveBTC Wallet Verification
Timestamp: 1759559297
MegaETH Address: 0xc381F1927257fA20782a65005a2cb094637D75e1
I confirm ownership of this Bitcoin address for use with ReserveBTC protocol.`,
  signature: 'ICZdgdoEoORSQbHo2HnnlsrhaQHtjEx4at12hHeQYAcgfDZw+2nLWeVXnshIi+U8G01aMMid+7QEuvoUdd70jWc='
}

const API_ENDPOINT = process.env.API_URL || 'https://app.reservebtc.io/api/verify-wallet'

console.log('🔐 PROFESSIONAL BIP-322 SECURITY AUDIT v2.4 - CLEAN')
console.log('Target:', API_ENDPOINT)
console.log('Protocol: ReserveBTC Production - MegaETH Competition Ready')
console.log('=' .repeat(80))

const attackVectors = []

// ============================================================================
// CATEGORY 1: CRYPTOGRAPHIC ATTACKS - Real vulnerabilities only
// ============================================================================

console.log('\n📁 CATEGORY 1: CRYPTOGRAPHIC ATTACKS')

attackVectors.push({
  category: 'Cryptographic',
  name: 'Wrong Signature - Random Data',
  data: {
    bitcoinAddress: VALID_TEST_DATA.bitcoinAddress,
    message: VALID_TEST_DATA.message,
    signature: 'HwkKIDPJcUQP/INVALID_SIG_HERE/5F1U/U2usec5UMX5sq/FAKE='
  },
  expectedResult: 'REJECT',
  severity: 'CRITICAL',
  reason: 'Invalid signature must be rejected'
})

attackVectors.push({
  category: 'Cryptographic',
  name: 'Address Substitution Attack',
  data: {
    bitcoinAddress: 'tb1qt75gzlur2q55dusst5tpc5qfc8a8u7lzgepdhf',
    message: VALID_TEST_DATA.message,
    signature: VALID_TEST_DATA.signature
  },
  expectedResult: 'REJECT',
  severity: 'CRITICAL',
  reason: 'Signature from different address must fail'
})

attackVectors.push({
  category: 'Cryptographic',
  name: 'Signature Replay - Different Message',
  data: {
    bitcoinAddress: VALID_TEST_DATA.bitcoinAddress,
    message: 'Malicious message content',
    signature: VALID_TEST_DATA.signature
  },
  expectedResult: 'REJECT',
  severity: 'CRITICAL',
  reason: 'Signature must be tied to specific message'
})

attackVectors.push({
  category: 'Cryptographic',
  name: 'Timestamp Manipulation',
  data: {
    bitcoinAddress: VALID_TEST_DATA.bitcoinAddress,
    message: VALID_TEST_DATA.message.replace('1759498437', '9999999999'),
    signature: VALID_TEST_DATA.signature
  },
  expectedResult: 'REJECT',
  severity: 'HIGH',
  reason: 'Modified timestamp must invalidate signature'
})

attackVectors.push({
  category: 'Cryptographic',
  name: 'ETH Address Substitution',
  data: {
    bitcoinAddress: VALID_TEST_DATA.bitcoinAddress,
    message: VALID_TEST_DATA.message.replace(
      VALID_TEST_DATA.ethAddress,
      '0xDEADBEEF00000000000000000000000000000000'
    ),
    signature: VALID_TEST_DATA.signature
  },
  expectedResult: 'REJECT',
  severity: 'CRITICAL',
  reason: 'ETH address binding must be enforced'
})

attackVectors.push({
  category: 'Cryptographic',
  name: 'Signature Truncation',
  data: {
    bitcoinAddress: VALID_TEST_DATA.bitcoinAddress,
    message: VALID_TEST_DATA.message,
    signature: VALID_TEST_DATA.signature.substring(0, 50)
  },
  expectedResult: 'REJECT',
  severity: 'HIGH',
  reason: 'Truncated signature must be rejected'
})

attackVectors.push({
  category: 'Cryptographic',
  name: 'Wrong Network - Mainnet Address',
  data: {
    bitcoinAddress: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
    message: VALID_TEST_DATA.message,
    signature: VALID_TEST_DATA.signature
  },
  expectedResult: 'REJECT',
  severity: 'HIGH',
  reason: 'Cross-network signatures must fail'
})

attackVectors.push({
  category: 'Cryptographic',
  name: 'Signature Byte Manipulation',
  data: {
    bitcoinAddress: VALID_TEST_DATA.bitcoinAddress,
    message: VALID_TEST_DATA.message,
    signature: (() => {
      const buf = Buffer.from(VALID_TEST_DATA.signature, 'base64')
      buf[10] = buf[10] ^ 0xFF
      return buf.toString('base64')
    })()
  },
  expectedResult: 'REJECT',
  severity: 'HIGH',
  reason: 'Manipulated signature must fail'
})

// ============================================================================
// CATEGORY 2: INJECTION ATTACKS
// ============================================================================

console.log('📁 CATEGORY 2: INJECTION ATTACKS')

attackVectors.push({
  category: 'Injection',
  name: 'SQL Injection - Address Field',
  data: {
    bitcoinAddress: "tb1q' OR '1'='1",
    message: VALID_TEST_DATA.message,
    signature: VALID_TEST_DATA.signature
  },
  expectedResult: 'REJECT',
  severity: 'CRITICAL',
  reason: 'SQL injection must be sanitized'
})

attackVectors.push({
  category: 'Injection',
  name: 'SQL Injection - UNION Attack',
  data: {
    bitcoinAddress: "tb1q' UNION SELECT * FROM users--",
    message: VALID_TEST_DATA.message,
    signature: VALID_TEST_DATA.signature
  },
  expectedResult: 'REJECT',
  severity: 'CRITICAL',
  reason: 'SQL UNION attack must be prevented'
})

attackVectors.push({
  category: 'Injection',
  name: 'XSS Attack - Script Tag',
  data: {
    bitcoinAddress: VALID_TEST_DATA.bitcoinAddress,
    message: '<script>alert("XSS")</script>' + VALID_TEST_DATA.message,
    signature: VALID_TEST_DATA.signature
  },
  expectedResult: 'REJECT',
  severity: 'HIGH',
  reason: 'XSS payload must be sanitized'
})

attackVectors.push({
  category: 'Injection',
  name: 'XSS Attack - Event Handler',
  data: {
    bitcoinAddress: VALID_TEST_DATA.bitcoinAddress,
    message: '<img src=x onerror="alert(1)">' + VALID_TEST_DATA.message,
    signature: VALID_TEST_DATA.signature
  },
  expectedResult: 'REJECT',
  severity: 'HIGH',
  reason: 'XSS event handlers must be blocked'
})

attackVectors.push({
  category: 'Injection',
  name: 'NoSQL Injection',
  data: {
    bitcoinAddress: { "$ne": null },
    message: VALID_TEST_DATA.message,
    signature: VALID_TEST_DATA.signature
  },
  expectedResult: 'REJECT',
  severity: 'HIGH',
  reason: 'NoSQL injection must be prevented'
})

attackVectors.push({
  category: 'Injection',
  name: 'Command Injection',
  data: {
    bitcoinAddress: VALID_TEST_DATA.bitcoinAddress + '; rm -rf /',
    message: VALID_TEST_DATA.message,
    signature: VALID_TEST_DATA.signature
  },
  expectedResult: 'REJECT',
  severity: 'CRITICAL',
  reason: 'Command injection must be sanitized'
})

attackVectors.push({
  category: 'Injection',
  name: 'Path Traversal',
  data: {
    bitcoinAddress: '../../../etc/passwd',
    message: VALID_TEST_DATA.message,
    signature: VALID_TEST_DATA.signature
  },
  expectedResult: 'REJECT',
  severity: 'HIGH',
  reason: 'Path traversal must be blocked'
})

// ============================================================================
// CATEGORY 3: INPUT VALIDATION
// ============================================================================

console.log('📁 CATEGORY 3: INPUT VALIDATION')

attackVectors.push({
  category: 'Input Validation',
  name: 'Empty Signature',
  data: {
    bitcoinAddress: VALID_TEST_DATA.bitcoinAddress,
    message: VALID_TEST_DATA.message,
    signature: ''
  },
  expectedResult: 'REJECT',
  severity: 'HIGH',
  reason: 'Empty signature must be rejected'
})

attackVectors.push({
  category: 'Input Validation',
  name: 'Null Signature',
  data: {
    bitcoinAddress: VALID_TEST_DATA.bitcoinAddress,
    message: VALID_TEST_DATA.message,
    signature: null
  },
  expectedResult: 'REJECT',
  severity: 'HIGH',
  reason: 'Null signature must be rejected'
})

attackVectors.push({
  category: 'Input Validation',
  name: 'Missing Signature',
  data: {
    bitcoinAddress: VALID_TEST_DATA.bitcoinAddress,
    message: VALID_TEST_DATA.message
  },
  expectedResult: 'REJECT',
  severity: 'HIGH',
  reason: 'Missing signature must be rejected'
})

attackVectors.push({
  category: 'Input Validation',
  name: 'Malformed Base64',
  data: {
    bitcoinAddress: VALID_TEST_DATA.bitcoinAddress,
    message: VALID_TEST_DATA.message,
    signature: 'NOT@VALID#BASE64$STRING!'
  },
  expectedResult: 'REJECT',
  severity: 'HIGH',
  reason: 'Invalid base64 must be rejected'
})

attackVectors.push({
  category: 'Input Validation',
  name: 'Buffer Overflow - Signature',
  data: {
    bitcoinAddress: VALID_TEST_DATA.bitcoinAddress,
    message: VALID_TEST_DATA.message,
    signature: 'A'.repeat(100000)
  },
  expectedResult: 'REJECT',
  severity: 'CRITICAL',
  reason: 'Oversized signature must be rejected'
})

attackVectors.push({
  category: 'Input Validation',
  name: 'Buffer Overflow - Message',
  data: {
    bitcoinAddress: VALID_TEST_DATA.bitcoinAddress,
    message: 'X'.repeat(1000000),
    signature: VALID_TEST_DATA.signature
  },
  expectedResult: 'REJECT',
  severity: 'HIGH',
  reason: 'Oversized message must be rejected'
})

attackVectors.push({
  category: 'Input Validation',
  name: 'Null Bytes - Address',
  data: {
    bitcoinAddress: VALID_TEST_DATA.bitcoinAddress + '\0malicious',
    message: VALID_TEST_DATA.message,
    signature: VALID_TEST_DATA.signature
  },
  expectedResult: 'REJECT',
  severity: 'HIGH',
  reason: 'Null bytes must be sanitized'
})

attackVectors.push({
  category: 'Input Validation',
  name: 'Null Bytes - Message',
  data: {
    bitcoinAddress: VALID_TEST_DATA.bitcoinAddress,
    message: VALID_TEST_DATA.message + '\0<script>',
    signature: VALID_TEST_DATA.signature
  },
  expectedResult: 'REJECT',
  severity: 'HIGH',
  reason: 'Null bytes must be rejected'
})

attackVectors.push({
  category: 'Input Validation',
  name: 'Case Manipulation - Uppercase',
  data: {
    bitcoinAddress: VALID_TEST_DATA.bitcoinAddress.toUpperCase(),
    message: VALID_TEST_DATA.message,
    signature: VALID_TEST_DATA.signature
  },
  expectedResult: 'REJECT',
  severity: 'MEDIUM',
  reason: 'Bech32 is case-sensitive'
})

attackVectors.push({
  category: 'Input Validation',
  name: 'Mixed Case',
  data: {
    bitcoinAddress: 'TB1qp2lwapdug2t6pedf52l629r4he7ru4wtkqpyew',
    message: VALID_TEST_DATA.message,
    signature: VALID_TEST_DATA.signature
  },
  expectedResult: 'REJECT',
  severity: 'MEDIUM',
  reason: 'Mixed case bech32 is invalid'
})

attackVectors.push({
  category: 'Input Validation',
  name: 'Leading Whitespace',
  data: {
    bitcoinAddress: '  ' + VALID_TEST_DATA.bitcoinAddress,
    message: VALID_TEST_DATA.message,
    signature: VALID_TEST_DATA.signature
  },
  expectedResult: 'REJECT',
  severity: 'MEDIUM',
  reason: 'Leading whitespace must be rejected'
})

attackVectors.push({
  category: 'Input Validation',
  name: 'Trailing Whitespace',
  data: {
    bitcoinAddress: VALID_TEST_DATA.bitcoinAddress + '  ',
    message: VALID_TEST_DATA.message,
    signature: VALID_TEST_DATA.signature
  },
  expectedResult: 'REJECT',
  severity: 'MEDIUM',
  reason: 'Trailing whitespace must be rejected'
})

// ============================================================================
// CATEGORY 4: PROTOCOL ATTACKS
// ============================================================================

console.log('📁 CATEGORY 4: PROTOCOL ATTACKS')

attackVectors.push({
  category: 'Protocol',
  name: 'Empty Bitcoin Address',
  data: {
    bitcoinAddress: '',
    message: VALID_TEST_DATA.message,
    signature: VALID_TEST_DATA.signature
  },
  expectedResult: 'REJECT',
  severity: 'CRITICAL',
  reason: 'Empty address must be rejected'
})

attackVectors.push({
  category: 'Protocol',
  name: 'Empty Message',
  data: {
    bitcoinAddress: VALID_TEST_DATA.bitcoinAddress,
    message: '',
    signature: VALID_TEST_DATA.signature
  },
  expectedResult: 'REJECT',
  severity: 'HIGH',
  reason: 'Empty message must be rejected'
})

attackVectors.push({
  category: 'Protocol',
  name: 'Invalid Bech32 Format',
  data: {
    bitcoinAddress: 'tb1qinvalidaddress',
    message: VALID_TEST_DATA.message,
    signature: VALID_TEST_DATA.signature
  },
  expectedResult: 'REJECT',
  severity: 'HIGH',
  reason: 'Invalid bech32 must be rejected'
})

// ============================================================================
// CATEGORY 5: DoS ATTACKS
// ============================================================================

console.log('📁 CATEGORY 5: DENIAL OF SERVICE')

attackVectors.push({
  category: 'DoS',
  name: 'Computational DoS',
  data: {
    bitcoinAddress: VALID_TEST_DATA.bitcoinAddress,
    message: 'X'.repeat(50000),
    signature: VALID_TEST_DATA.signature
  },
  expectedResult: 'REJECT',
  severity: 'MEDIUM',
  reason: 'Resource exhaustion prevention'
})

// ============================================================================
// LEGITIMATE TEST
// ============================================================================

console.log('\n✅ LEGITIMATE TEST')

attackVectors.push({
  category: 'Legitimate',
  name: 'Valid Signature',
  data: VALID_TEST_DATA,
  expectedResult: 'ACCEPT',
  severity: 'CRITICAL',
  reason: 'Valid signature MUST be accepted'
})

console.log('\n' + '='.repeat(80))
console.log(`Total Tests: ${attackVectors.length}`)
console.log('='.repeat(80))

// ============================================================================
// TEST EXECUTION
// ============================================================================

async function runSecurityAudit() {
  console.log('\n🚀 STARTING SECURITY AUDIT v2.4\n')
  
  const results = {
    total: attackVectors.length,
    passed: 0,
    failed: 0,
    errors: 0,
    vulnerabilities: [],
    byCategory: {},
    bySeverity: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }
  }
  
  for (let i = 0; i < attackVectors.length; i++) {
    const test = attackVectors[i]
    const testNum = `[${i + 1}/${attackVectors.length}]`
    
    console.log(`\n${testNum} ${test.category}: ${test.name}`)
    console.log(`   Severity: ${test.severity}`)
    console.log(`   Expected: ${test.expectedResult}`)
    
    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'ReserveBTC-Audit/2.4'
        },
        body: JSON.stringify(test.data)
      })
      
      const result = await response.json()
      const actualResult = result.success ? 'ACCEPT' : 'REJECT'
      
      console.log(`   Actual: ${actualResult}`)

      if (test.name === 'Valid Signature') {
        console.log('   FULL ERROR:', JSON.stringify(result, null, 2))
    }
      
      const testPassed = actualResult === test.expectedResult
      
      if (testPassed) {
        console.log('   ✅ PASS')
        results.passed++
      } else {
        console.log('   ❌ FAIL')
        results.failed++
        results.vulnerabilities.push({
          test: test.name,
          category: test.category,
          severity: test.severity,
          expected: test.expectedResult,
          actual: actualResult,
          reason: test.reason
        })
        results.bySeverity[test.severity]++
      }
      
      if (!results.byCategory[test.category]) {
        results.byCategory[test.category] = { passed: 0, failed: 0 }
      }
      results.byCategory[test.category][testPassed ? 'passed' : 'failed']++
      
    } catch (error) {
      console.log(`   ⚠️ ERROR: ${error.message}`)
      results.errors++
    }
    
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  console.log('\n' + '='.repeat(80))
  console.log('🔐 SECURITY AUDIT COMPLETE')
  console.log('='.repeat(80))
  console.log(`\n📊 RESULTS:`)
  console.log(`   Total: ${results.total}`)
  console.log(`   ✅ Passed: ${results.passed} (${((results.passed/results.total)*100).toFixed(1)}%)`)
  console.log(`   ❌ Failed: ${results.failed}`)
  console.log(`   ⚠️ Errors: ${results.errors}`)
  
  console.log(`\n📁 BY CATEGORY:`)
  Object.entries(results.byCategory).forEach(([cat, stats]) => {
    console.log(`   ${cat}: ${stats.passed}✅ ${stats.failed}❌`)
  })
  
  console.log(`\n🚨 BY SEVERITY:`)
  console.log(`   CRITICAL: ${results.bySeverity.CRITICAL}`)
  console.log(`   HIGH: ${results.bySeverity.HIGH}`)
  console.log(`   MEDIUM: ${results.bySeverity.MEDIUM}`)
  
  if (results.vulnerabilities.length > 0) {
    console.log(`\n⚠️ VULNERABILITIES FOUND:`)
    console.log('='.repeat(80))
    results.vulnerabilities.forEach((v, i) => {
      console.log(`\n${i + 1}. [${v.severity}] ${v.test}`)
      console.log(`   ${v.reason}`)
    })
  } else {
    console.log('\n' + '='.repeat(80))
    console.log('🎉 NO VULNERABILITIES!')
    console.log('✅ PRODUCTION READY FOR MEGAETH')
    console.log('='.repeat(80))
  }
  
  return results
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { attackVectors, runSecurityAudit, VALID_TEST_DATA }
}

if (typeof require !== 'undefined' && require.main === module) {
  runSecurityAudit()
    .then(results => process.exit(results.failed > 0 ? 1 : 0))
    .catch(error => {
      console.error('Fatal:', error)
      process.exit(2)
    })
}