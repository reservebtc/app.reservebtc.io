# 🚀 CI/CD Documentation - ReserveBTC

## Professional Testing Setup

### 📁 File Structure

```
.
├── .github/workflows/
│   ├── ci.yml                    # 🚀 Main CI/CD pipeline
│   ├── frontend-test-suite.yml   # 🎯 Frontend tests
│   ├── security-tests.yml        # 🔒 Security tests
│   └── smart-contract-tests.yml  # ⛓️  Smart contract tests
├── scripts/
│   └── test-ci-locally.sh        # 🐳 Local CI reproduction
├── Dockerfile.test               # 🐳 Docker for tests
├── docker-compose.test.yml       # 🐳 Docker Compose configuration
├── .nvmrc                        # 📌 Node.js version
├── .npmrc                        # 📌 npm settings
└── CI-CD-README.md              # 📚 This documentation
```

### 🎯 Automated Testing

**Triggers:**
- ✅ Push to `main` or `develop`
- ✅ Pull Request to `main`
- ✅ Manual run (workflow_dispatch)

**CI/CD Stages:**

1. **🔍 Code Quality Check**
   - TypeScript validation
   - ESLint check
   - Change detection

2. **🧪 Test Suite (Matrix Strategy)**
   - Unit tests
   - Component tests
   - API tests
   - Accessibility tests

3. **🔒 Security Audit**
   - NPM security audit
   - Security tests

4. **🏗️ Build Check**
   - Production build
   - Artifact verification

### 🐳 Local CI Reproduction

```bash
# Full test suite (as in GitHub Actions)
./scripts/test-ci-locally.sh

# Individual test types
./scripts/test-ci-locally.sh unit
./scripts/test-ci-locally.sh components
./scripts/test-ci-locally.sh api

# Interactive mode
./scripts/test-ci-locally.sh watch

# Environment check
./scripts/test-ci-locally.sh env

# Docker commands
./scripts/test-ci-locally.sh build  # Rebuild
./scripts/test-ci-locally.sh clean  # Clean up
```

### 📌 Version Locking

**Strict version compliance:**
- `Node.js`: 22.14.0 (locked in `.nvmrc`)
- `NPM`: 10.9.2 (locked in `package.json` engines)
- Dependencies: exact versions (`--exact` in `.npmrc`)

### 🔧 Environment Variables

**In CI (GitHub Actions):**
```yaml
env:
  NODE_ENV: test
  CI: true
  FORCE_COLOR: 3
```

**In Docker:**
```dockerfile
ENV NODE_ENV=test
ENV CI=true
ENV FORCE_COLOR=3
```

### 📊 Monitoring and Artifacts

**Uploaded artifacts:**
- 📊 Test results
- 📈 Coverage reports
- 🏗️ Build files

**Retention period:** 7 days

### 🎯 Build Status

All workflows return status:
- ✅ **Success**: all tests passed
- ❌ **Failure**: issues found
- 🟡 **Cancelled**: canceled

### 🛠️ Debugging

**Enable debugging:**
```bash
# In GitHub Actions with tmate debugging
# Use input "debug_enabled: true"
```

**Local debugging:**
```bash
# Check environment
./scripts/test-ci-locally.sh env

# Interactive mode
./scripts/test-ci-locally.sh watch
```

### 🚫 Important Rules

1. **DO NOT TOUCH test files** - they work perfectly
2. **Only configure environment** to match existing tests
3. **Use exact versions** in all environments
4. **Test locally** before push

### 📈 Quality Metrics

**Target:** 100% test success rate
**Current status:** 7/7 (100%) ✅

**Test types:**
- Unit Tests: 39 tests ✅
- Component Tests: 6 tests ✅  
- API Tests: 6 tests ✅
- Accessibility Tests: ✅
- Security Tests: ✅

### 🎉 Result

Professional CI/CD system with:
- ✅ Local and CI environment parity
- ✅ Automatic execution on push/PR
- ✅ Local reproduction capability
- ✅ Strict version control
- ✅ Security and audit

**No more differences between local and CI environments!** 🚀