# 🚀 Руководство по Атомарному Деплою ReserveBTC

## 📋 Обзор

Этот документ описывает успешно протестированный метод атомарного деплоя всех трёх основных контрактов ReserveBTC с правильными перекрёстными ссылками. Использовался для исправления ошибки `0x1bc2178f (NotOracle)` в тестовой сети MegaETH и готов для применения в Mainnet.

## 🎯 Проблема, которую решает атомарный деплой

**Проблема:** Циклические зависимости между контрактами:
- `FeeVault` нужен адрес `OracleAggregator` в конструкторе
- `OracleAggregator` нужны адреса `FeeVault` и `RBTCSynth` в конструкторе  
- `RBTCSynth` нужен адрес `OracleAggregator` в конструкторе

**Результат без атомарного деплоя:** Контракты ссылаются на неправильные адреса, что приводит к ошибкам `NotOracle()` при попытке Oracle Aggregator вызвать `spendFrom()` на FeeVault.

## ✅ Решение: Атомарный деплой с предсказанием адресов

### Принцип работы

1. **Предсказание адресов:** Используем формулу `CREATE` для вычисления будущих адресов контрактов на основе nonce деплоера
2. **Последовательный деплой:** Деплоим контракты в правильном порядке, используя предсказанные адреса
3. **Верификация:** Проверяем что предсказания совпали с реальными адресами

### Скрипт: AtomicDeployFixed.s.sol

```solidity
// STEP 1: Предсказываем адреса всех трёх контрактов
uint64 nonce = vm.getNonce(deployer);
address predictedFeeVault = computeCreateAddress(deployer, nonce);
address predictedOracleAgg = computeCreateAddress(deployer, nonce + 1);
address predictedRBTCSynth = computeCreateAddress(deployer, nonce + 2);

// STEP 2: Деплоим FeeVault с предсказанным адресом Oracle
FeeVault feeVault = new FeeVault(
    predictedOracleAgg,    // oracle = предсказанный Oracle Aggregator
    payable(feeCollector)  // feeCollector = адрес получателя комиссий
);

// STEP 3: Деплоим OracleAggregator с реальным FeeVault и предсказанным RBTCSynth
OracleAggregator oracle = new OracleAggregator(
    predictedRBTCSynth,    // predicted synth address
    address(feeVault),     // actual feeVault address
    FEE_POLICY,           // existing working feePolicy
    committee,            // committee (deployer)
    MIN_CONFIRMATIONS,    // minConf
    MAX_FEE_PER_SYNC      // maxFeePerSync
);

// STEP 4: Деплоим RBTCSynth с реальным адресом Oracle
RBTCSynth rbtcSynth = new RBTCSynth(address(oracle));
```

## 🔧 Пошаговая инструкция для Mainnet

### 1. Подготовка

```bash
# Убедиться что forge установлен и настроен
forge --version

# Подготовить приватный ключ деплоера (безопасно!)
export PRIVATE_KEY="your_mainnet_private_key_here"

# Настроить RPC URL для Mainnet
export RPC_URL="https://mainnet.infura.io/v3/your_key"
# или
export RPC_URL="https://eth-mainnet.alchemyapi.io/v2/your_key"
```

### 2. Обновить конфигурацию для Mainnet

Обновить `contracts/script/AtomicDeployFixed.s.sol`:

```solidity
// Mainnet Configuration
uint256 constant CHAIN_ID = 1; // Ethereum Mainnet

// Использовать реальный FeePolicy или задеплоить новый
address constant FEE_POLICY = 0x...; // Mainnet FeePolicy address

// Mainnet параметры
uint256 constant MIN_CONFIRMATIONS = 6; // Больше подтверждений для безопасности
uint256 constant MAX_FEE_PER_SYNC = 0.01 ether; // Разумный лимит комиссий
```

### 3. Выполнить деплой

```bash
# Деплой в Mainnet (БЕЗ --broadcast для dry run)
forge script contracts/script/AtomicDeployFixed.s.sol:AtomicDeployFixed \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Если всё корректно, выполнить реальный деплой
forge script contracts/script/AtomicDeployFixed.s.sol:AtomicDeployFixed \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify
```

### 4. Верификация результата

После деплоя проверить:

```bash
# Запустить тест верификации (обновить адреса)
node test-complete-atomic-system.js
```

Ожидаемый результат:
```
✅ FeeVault → Oracle:        OK
✅ Oracle → Synth:           OK  
✅ Oracle → FeeVault:        OK
✅ Oracle → FeePolicy:       OK
✅ Synth → Oracle:           OK
```

## 📊 Результаты тестового деплоя в MegaETH

### Развёрнутые адреса (MegaETH Testnet):
- **FeeVault:** `0x9C0Bc4E6794544F8DAA39C2d913e16063898bEa1`
- **OracleAggregator:** `0x74E64267a4d19357dd03A0178b5edEC79936c643`  
- **RBTCSynth:** `0x4BC51d94937f145C7D995E146C32EC3b9CeB3ACC`
- **FeePolicy:** `0xc10fD3a2DF480CFAE8a7aBC2862a9c5724f5f4b4` (переиспользован)

### Верификация успешна:
- ✅ Все предсказания адресов совпали с реальными
- ✅ Все перекрёстные ссылки корректные
- ✅ Oracle Aggregator может вызывать `spendFrom()` на FeeVault
- ✅ Ошибка `0x1bc2178f (NotOracle)` исправлена
- ✅ Система готова к автоматическому майнингу RBTC токенов

## 🔄 Обновление системы после деплоя

### 1. Обновить Oracle Server
```bash
# Обновить конфигурацию Oracle сервера с новыми адресами
ssh user@oracle-server "sed -i 's/OLD_ORACLE_ADDRESS/NEW_ORACLE_ADDRESS/g' oracle-server.js"
ssh user@oracle-server "pm2 restart oracle-server"
```

### 2. Обновить Frontend
```typescript
// app/lib/contracts.ts
export const CONTRACTS = {
  CHAIN_ID: 1, // Mainnet
  FEE_VAULT: '0x...', // Новый FeeVault
  ORACLE_AGGREGATOR: '0x...', // Новый Oracle Aggregator
  RBTC_SYNTH: '0x...', // Новый RBTCSynth
  FEE_POLICY: '0x...', // FeePolicy (может быть переиспользован)
}
```

### 3. Обновить документацию
- Обновить адреса во всех docs страницах
- Обновить README.md
- Обновить API документацию

## ⚠️ Важные замечания

### Безопасность
- **НИКОГДА** не коммитить приватные ключи в Git
- Использовать аппаратные кошельки для Mainnet деплоя
- Тестировать на tesnet перед Mainnet
- Делать backup всех конфигураций

### Газ и комиссии
- Атомарный деплой требует ~1.9M газа
- В Mainnet учитывать высокие цены на газ
- Планировать деплой в периоды низкой нагрузки сети

### Тестирование
- Всегда запускать полную верификацию после деплоя
- Тестировать с малыми суммами перед продакшеном
- Проверять все перекрёстные ссылки контрактов

## 🎉 Заключение

Атомарный деплой решает фундаментальную проблему циклических зависимостей в ReserveBTC, обеспечивая корректную работу всех компонентов системы. Метод протестирован и готов к применению в Mainnet.

**Ключевые преимущества:**
- ✅ Решает проблему `NotOracle()` ошибок
- ✅ Обеспечивает правильные перекрёстные ссылки
- ✅ Гарантирует работоспособность Oracle системы
- ✅ Автоматизирует сложный процесс деплоя
- ✅ Включает полную верификацию результата

---
*Документ создан после успешного атомарного деплоя в MegaETH Testnet 2025-09-05*