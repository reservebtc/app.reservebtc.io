const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  
  // Timeout and performance settings
  testTimeout: process.env.CI ? 30000 : 15000, // 30s in CI, 15s locally
  
  // CI optimizations
  maxWorkers: process.env.CI ? 2 : '50%',
  workerIdleMemoryLimit: process.env.CI ? '512MB' : undefined,
  verbose: !process.env.CI,
  
  // Performance optimizations for CI
  maxConcurrency: process.env.CI ? 2 : 5,
  bail: process.env.CI ? 1 : 0, // Stop after first failure in CI
  
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // Mock wallet-connect component for tests
    '^../wallet-connect$': '<rootDir>/components/wallet/__mocks__/wallet-connect',
  },
  
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/web-interface-BACKUP-BEAUTIFUL-VERSION/',
    '<rootDir>/backend/',
    '<rootDir>/contracts/',
  ],
  
  modulePathIgnorePatterns: [
    '<rootDir>/web-interface-BACKUP-BEAUTIFUL-VERSION/',
    '<rootDir>/backend/',
    '<rootDir>/contracts/',
  ],
  
  transform: {
    '^.+\\.(ts|tsx)$': '@swc/jest',
  },
  
  transformIgnorePatterns: [
    'node_modules/(?!(wagmi|viem|@wagmi|@tanstack)/)',
  ],
  
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/?(*.)+(spec|test).(ts|tsx|js)',
  ],
}

module.exports = createJestConfig(customJestConfig)