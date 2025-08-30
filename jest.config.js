const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/web-interface-BACKUP-BEAUTIFUL-VERSION/',
  ],
  
  modulePathIgnorePatterns: [
    '<rootDir>/web-interface-BACKUP-BEAUTIFUL-VERSION/',
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