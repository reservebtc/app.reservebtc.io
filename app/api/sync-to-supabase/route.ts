import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const data = await request.json();
    const { eventType, userAddress, transactionData, bitcoinAddress } = data;

    console.log('📊 SYNC: Syncing to Supabase:', eventType);

    // 1. Ensure user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('eth_address', userAddress.toLowerCase())
      .single();

    if (!existingUser) {
      await supabase.from('users').insert({
        eth_address: userAddress.toLowerCase(),
        created_at: new Date().toISOString()
      });
      console.log('✅ SYNC: User created in Supabase');
    }

    // 2. Handle different event types
    switch (eventType) {
      case 'MINT':
        // Insert transaction
        if (transactionData) {
          await supabase.from('transactions').insert({
            tx_hash: transactionData.tx_hash,
            block_number: transactionData.block_number || 0,
            block_timestamp: new Date().toISOString(),
            user_address: userAddress.toLowerCase(),
            tx_type: 'MINT',
            amount: transactionData.amount,
            delta: transactionData.amount,
            fee_wei: transactionData.fee_wei || '0',
            status: 'confirmed'
          });
          console.log('✅ SYNC: Mint transaction saved');
        }

        // Add Bitcoin address if provided
        if (bitcoinAddress) {
          await supabase.from('bitcoin_addresses').upsert({
            eth_address: userAddress.toLowerCase(),
            bitcoin_address: bitcoinAddress,
            network: bitcoinAddress.startsWith('tb1') ? 'testnet' : 'mainnet',
            verified_at: new Date().toISOString(),
            is_monitoring: true
          }, {
            onConflict: 'eth_address,bitcoin_address'
          });
          console.log('✅ SYNC: Bitcoin address saved');
        }

        // Update balance snapshot
        await supabase.from('balance_snapshots').insert({
          user_address: userAddress.toLowerCase(),
          block_number: transactionData?.block_number || 0,
          rbtc_balance: transactionData?.amount || '0',
          last_sats: transactionData?.amount || '0',
          snapshot_timestamp: new Date().toISOString()
        });
        console.log('✅ SYNC: Balance snapshot saved');
        break;

      case 'VERIFY':
        // Just add Bitcoin address
        if (bitcoinAddress) {
          await supabase.from('bitcoin_addresses').upsert({
            eth_address: userAddress.toLowerCase(),
            bitcoin_address: bitcoinAddress,
            network: bitcoinAddress.startsWith('tb1') ? 'testnet' : 'mainnet',
            verified_at: new Date().toISOString(),
            is_monitoring: false
          }, {
            onConflict: 'eth_address,bitcoin_address'
          });
          console.log('✅ SYNC: Verified address saved');
        }
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ SYNC: Error syncing to Supabase:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}