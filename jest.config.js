const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  
  // CI optimizations
  maxWorkers: process.env.CI ? 2 : '50%',
  workerIdleMemoryLimit: process.env.CI ? '512MB' : undefined,
  verbose: !process.env.CI,
  
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
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