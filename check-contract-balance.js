#!/usr/bin/env node

/**
 * Check user's actual balance in smart contract
 */

const USER_ADDRESS = '0x44dB868F99a42A5ABC7A1492E64db9bCFb946b09'
const RBTC_SYNTH_ADDRESS = '0x4BC51d94937f145C7D995E146C32EC3b9CeB3ACC'
const ORACLE_AGGREGATOR_ADDRESS = '0x74E64267a4d19357dd03A0178b5edEC79936c643'

async function checkContractBalance() {
  console.log(`🔍 Checking smart contract balance for: ${USER_ADDRESS}`)
  
  try {
    console.log('\n=== STEP 1: Check rBTC-SYNTH Contract Balance ===')
    
    // We need to use MegaETH RPC to check the balance
    const rpcUrl = 'https://carrot.megaeth.com/rpc'
    
    // Create balanceOf call data
    const balanceOfSignature = '0x70a08231' // balanceOf(address)
    const paddedAddress = USER_ADDRESS.slice(2).padStart(64, '0')
    const callData = balanceOfSignature + paddedAddress
    
    console.log('📞 Calling rBTC-SYNTH balanceOf...')
    
    const balanceResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{
          to: RBTC_SYNTH_ADDRESS,
          data: callData
        }, 'latest'],
        id: 1
      })
    })
    
    if (balanceResponse.ok) {
      const balanceData = await balanceResponse.json()
      if (balanceData.result && balanceData.result !== '0x') {
        const balanceHex = balanceData.result
        const balanceWei = BigInt(balanceHex)
        const balanceBTC = Number(balanceWei) / 100000000
        
        console.log(`✅ rBTC-SYNTH Contract Balance: ${balanceBTC} rBTC`)
        console.log(`   Raw balance: ${balanceWei} tokens`)
        
        if (balanceBTC > 0) {
          console.log('🎉 USER HAS rBTC-SYNTH TOKENS! Oracle should track this user.')
        } else {
          console.log('❌ User has 0 rBTC-SYNTH tokens - no mint happened')
        }
      } else {
        console.log('❌ rBTC-SYNTH balance call failed or returned 0')
      }
    } else {
      console.log('❌ Failed to call rBTC-SYNTH contract')
    }
    
    console.log('\n=== STEP 2: Check Oracle Aggregator Balance ===')
    
    // Check Oracle Aggregator lastSats
    const lastSatsSignature = '0x8c8885a8' // lastSats(address) - you may need to verify this
    const oracleCallData = lastSatsSignature + paddedAddress
    
    console.log('📞 Calling Oracle Aggregator lastSats...')
    
    const oracleResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{
          to: ORACLE_AGGREGATOR_ADDRESS,
          data: oracleCallData
        }, 'latest'],
        id: 2
      })
    })
    
    if (oracleResponse.ok) {
      const oracleData = await oracleResponse.json()
      if (oracleData.result && oracleData.result !== '0x') {
        const oracleBalanceHex = oracleData.result
        const oracleBalanceSats = BigInt(oracleBalanceHex)
        const oracleBalanceBTC = Number(oracleBalanceSats) / 100000000
        
        console.log(`✅ Oracle Aggregator Balance: ${oracleBalanceBTC} BTC`)
        console.log(`   Raw balance: ${oracleBalanceSats} sats`)
      } else {
        console.log('❌ Oracle Aggregator balance is 0 or call failed')
      }
    } else {
      console.log('❌ Failed to call Oracle Aggregator contract')
    }
    
    console.log('\n=== STEP 3: Diagnosis ===')
    console.log('If rBTC-SYNTH balance > 0 but Oracle database shows no user:')
    console.log('🔧 SOLUTION: Oracle server needs to scan for new mint events')
    console.log('🔧 OR: Oracle server needs manual sync for this user')
    console.log('🔧 OR: Oracle server sync mechanism is broken')
    
  } catch (error) {
    console.error('❌ Error checking contract balances:', error)
  }
}

checkContractBalance()