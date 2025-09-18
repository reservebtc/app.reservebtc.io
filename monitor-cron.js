const https = require('https');

let lastBlock = 0;
let lastTxCount = 0;

const check = () => {
  // Проверяем indexer
  https.get('https://app.reservebtc.io/api/cron/indexer?x-vercel-protection-bypass=fhBBcnm5912984Gbcdn6928457fgdbwj', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        const [from, to] = result.indexed.split('-');
        if (parseInt(to) > lastBlock) {
          console.log(`✅ [${new Date().toLocaleTimeString()}] Indexer: блоки ${from}-${to}, транзакций: ${result.transactions}`);
          lastBlock = parseInt(to);
        }
      } catch (e) {}
    });
  });
  
  // Проверяем bitcoin sync
  setTimeout(() => {
    https.get('https://app.reservebtc.io/api/cron/bitcoin-balance-sync?x-vercel-protection-bypass=fhBBcnm5912984Gbcdn6928457fgdbwj', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log(`💰 [${new Date().toLocaleTimeString()}] Bitcoin: ${result.stats.totalUsers} users, ${result.stats.totalAddresses} addresses, Balance: ${result.stats.totalBTC} BTC`);
        } catch (e) {}
      });
    });
  }, 2000);
};

console.log('🔄 Мониторинг cron функций (каждые 30 секунд)...\n');
check();
setInterval(check, 30000);
