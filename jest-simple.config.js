module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/lib/__tests__/**/*.test.{js,ts}',
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: [
    'lib/**/*.{js,ts}',
    '!lib/**/*.d.ts',
    '!lib/__tests__/**',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
  ],
}