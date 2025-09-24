const crypto = require('crypto');
const testKey = 'test-api-key-12345';
const hash = crypto.createHash('sha256').update(testKey).digest('hex');
console.log('API Key:', testKey);
console.log('Hash:', hash);
