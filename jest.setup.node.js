// Setup for Node.js environment (API tests)

// Mock crypto for Node.js if needed
if (!global.crypto) {
  global.crypto = {
    getRandomValues: jest.fn(() => new Uint32Array(10))
  }
}

// Suppress console warnings in tests
const originalWarn = console.warn
console.warn = (...args) => {
  if (args[0]?.includes?.('Warning: ReactDOM.render is no longer supported')) {
    return
  }
  originalWarn.call(console, ...args)
}