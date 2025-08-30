# 🚀 CI/CD Documentation - ReserveBTC

## Профессиональная настройка тестирования

### 📁 Структура файлов

```
.
├── .github/workflows/
│   ├── ci.yml                    # 🚀 Основной CI/CD pipeline
│   ├── frontend-test-suite.yml   # 🎯 Frontend тесты
│   ├── security-tests.yml        # 🔒 Security тесты
│   └── smart-contract-tests.yml  # ⛓️  Smart contract тесты
├── scripts/
│   └── test-ci-locally.sh        # 🐳 Локальное воспроизведение CI
├── Dockerfile.test               # 🐳 Docker для тестов
├── docker-compose.test.yml       # 🐳 Docker Compose конфигурация
├── .nvmrc                        # 📌 Версия Node.js
├── .npmrc                        # 📌 Настройки npm
└── CI-CD-README.md              # 📚 Эта документация
```

### 🎯 Автоматическое тестирование

**Триггеры:**
- ✅ Push в `main` или `develop`
- ✅ Pull Request в `main`
- ✅ Ручной запуск (workflow_dispatch)

**Этапы CI/CD:**

1. **🔍 Code Quality Check**
   - TypeScript проверка
   - ESLint проверка
   - Проверка изменений

2. **🧪 Test Suite (Matrix Strategy)**
   - Unit тесты
   - Component тесты
   - API тесты
   - Accessibility тесты

3. **🔒 Security Audit**
   - NPM security audit
   - Security тесты

4. **🏗️ Build Check**
   - Production сборка
   - Проверка артефактов

### 🐳 Локальное воспроизведение CI

```bash
# Полный набор тестов (как в GitHub Actions)
./scripts/test-ci-locally.sh

# Отдельные виды тестов
./scripts/test-ci-locally.sh unit
./scripts/test-ci-locally.sh components
./scripts/test-ci-locally.sh api

# Интерактивный режим
./scripts/test-ci-locally.sh watch

# Проверка окружения
./scripts/test-ci-locally.sh env

# Docker команды
./scripts/test-ci-locally.sh build  # Пересобрать
./scripts/test-ci-locally.sh clean  # Очистить
```

### 📌 Фиксация версий

**Строгое соответствие версий:**
- `Node.js`: 22.14.0 (фиксировано в `.nvmrc`)
- `NPM`: 10.9.2 (фиксировано в `package.json` engines)
- Зависимости: точные версии (`--exact` в `.npmrc`)

### 🔧 Переменные окружения

**В CI (GitHub Actions):**
```yaml
env:
  NODE_ENV: test
  CI: true
  FORCE_COLOR: 3
```

**В Docker:**
```dockerfile
ENV NODE_ENV=test
ENV CI=true
ENV FORCE_COLOR=3
```

### 📊 Мониторинг и артефакты

**Загружаемые артефакты:**
- 📊 Результаты тестов
- 📈 Coverage отчеты
- 🏗️ Build файлы

**Срок хранения:** 7 дней

### 🎯 Статусы сборки

Все workflow возвращают статус:
- ✅ **Success**: все тесты прошли
- ❌ **Failure**: есть проблемы
- 🟡 **Cancelled**: отменено

### 🛠️ Отладка

**Включить отладку:**
```bash
# В GitHub Actions с tmate debugging
# Используй input "debug_enabled: true"
```

**Локальная отладка:**
```bash
# Проверить окружение
./scripts/test-ci-locally.sh env

# Интерактивный режим
./scripts/test-ci-locally.sh watch
```

### 🚫 Важные правила

1. **НЕ ТРОГАТЬ тестовые файлы** - они работают идеально
2. **Настраивать только окружение** под существующие тесты
3. **Использовать точные версии** во всех средах
4. **Тестировать локально** перед push

### 📈 Метрики качества

**Цель:** 100% успешность тестов
**Текущий статус:** 7/7 (100%) ✅

**Типы тестов:**
- Unit Tests: 39 тестов ✅
- Component Tests: 6 тестов ✅  
- API Tests: 6 тестов ✅
- Accessibility Tests: ✅
- Security Tests: ✅

### 🎉 Результат

Профессиональная CI/CD система с:
- ✅ Идентичностью локальной и CI среды
- ✅ Автоматическим запуском на push/PR
- ✅ Возможностью локального воспроизведения
- ✅ Строгим контролем версий
- ✅ Безопасностью и аудитом

**Больше никаких различий между локальной и CI средой!** 🚀