import '@testing-library/jest-dom'

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock matchMedia (only in browser environment)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}

// Mock localStorage (only in browser environment)
if (typeof window !== 'undefined') {
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn(),
  }
  global.localStorage = localStorageMock
}

// Mock window.crypto (only in browser environment)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'crypto', {
    value: {
      getRandomValues: jest.fn(() => new Uint32Array(10))
    }
  })
} else {
  // For Node.js environment
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