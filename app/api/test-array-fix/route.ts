/**
 * ТЕСТ: Проверка исправления массивов Bitcoin адресов
 * Этот endpoint тестирует что Oracle теперь поддерживает массивы адресов
 */
import { oracleService } from '@/lib/oracle-service'

export async function GET() {
  try {
    console.log('🧪 TESTING ARRAY FIX: Testing Bitcoin address array support...')
    
    // Получаем всех пользователей из Oracle
    const users = await oracleService.getDecryptedUsers()
    
    if (!users || users.length === 0) {
      return Response.json({
        success: false,
        error: 'No users found from Oracle',
        test: 'array_support'
      })
    }

    // Анализируем каждого пользователя на поддержку массивов
    const analysis = users.map((user, index) => {
      const userAny = user as any
      
      // Собираем все возможные Bitcoin адреса
      const allAddresses = [
        ...(user.btcAddresses || []),
        ...(userAny.bitcoinAddresses || []),
        ...(userAny.bitcoin_addresses || []),
        ...(user.btcAddress ? [user.btcAddress] : []),
        ...(user.bitcoinAddress ? [user.bitcoinAddress] : [])
      ].filter(Boolean).filter((addr, idx, array) => array.indexOf(addr) === idx)
      
      return {
        userIndex: index,
        ethAddress: user.ethAddress ? 
          `${user.ethAddress.slice(0, 8)}...${user.ethAddress.slice(-6)}` : null,
        
        // Детальная диагностика полей
        fieldAnalysis: {
          hasSingleBitcoinAddress: !!user.bitcoinAddress,
          hasSingleBtcAddress: !!user.btcAddress,
          hasBtcAddressesArray: !!(user.btcAddresses?.length),
          hasBitcoinAddressesArray: !!(userAny.bitcoinAddresses?.length),
          hasBitcoin_addressesArray: !!(userAny.bitcoin_addresses?.length)
        },
        
        // Количество адресов в массивах
        arrayCounts: {
          btcAddresses: user.btcAddresses?.length || 0,
          bitcoinAddresses: userAny.bitcoinAddresses?.length || 0,
          bitcoin_addresses: userAny.bitcoin_addresses?.length || 0
        },
        
        // Общая статистика
        totalUniqueAddresses: allAddresses.length,
        processedAddresses: allAddresses.map(addr => 
          `${addr.slice(0, 12)}...${addr.slice(-8)}`
        ),
        
        // Все доступные поля в user object
        availableFields: Object.keys(user),
        totalFields: Object.keys(user).length
      }
    })

    // Общая статистика исправления
    const fixAnalysis = {
      totalUsers: users.length,
      usersWithSingleAddressesOnly: analysis.filter(u => 
        (u.fieldAnalysis.hasSingleBitcoinAddress || u.fieldAnalysis.hasSingleBtcAddress) &&
        u.totalUniqueAddresses === 1
      ).length,
      usersWithMultipleAddresses: analysis.filter(u => u.totalUniqueAddresses > 1).length,
      usersWithArraySupport: analysis.filter(u => 
        u.fieldAnalysis.hasBtcAddressesArray || 
        u.fieldAnalysis.hasBitcoinAddressesArray || 
        u.fieldAnalysis.hasBitcoin_addressesArray
      ).length,
      totalAddressesProcessed: analysis.reduce((sum, u) => sum + u.totalUniqueAddresses, 0)
    }

    // Статус исправления
    const isFixed = fixAnalysis.usersWithArraySupport > 0
    const needsMigration = fixAnalysis.usersWithSingleAddressesOnly > 0 && fixAnalysis.usersWithArraySupport === 0

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      test: 'bitcoin_address_array_support',
      
      // Результат теста
      testResult: {
        isArraySupportWorking: isFixed,
        needsOracleServerMigration: needsMigration,
        status: isFixed ? 'FIXED' : needsMigration ? 'NEEDS_ORACLE_SERVER_UPDATE' : 'UNKNOWN'
      },
      
      // Детальный анализ
      fixAnalysis,
      userAnalysis: analysis,
      
      // Рекомендации
      recommendations: {
        nextSteps: isFixed 
          ? ['✅ Array support is working!', 'Test adding multiple addresses to one user']
          : needsMigration 
          ? ['❌ Oracle server needs update', 'Update /store-verification endpoint to handle bitcoinAddresses arrays', 'Update user storage schema']
          : ['⚠️ Unknown state - investigate Oracle server response'],
        
        criticalIssue: needsMigration 
          ? 'Oracle server is still storing single addresses instead of arrays'
          : null
      }
    }

    console.log('🧪 ARRAY FIX TEST RESULT:', result.testResult.status)
    console.log(`   Users with arrays: ${fixAnalysis.usersWithArraySupport}`)
    console.log(`   Users with single addresses: ${fixAnalysis.usersWithSingleAddressesOnly}`)
    
    return Response.json(result)
    
  } catch (error) {
    console.error('❌ ARRAY FIX TEST: Error:', error)
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      test: 'bitcoin_address_array_support',
      timestamp: new Date().toISOString()
    })
  }
}