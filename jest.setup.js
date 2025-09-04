// jest-dom adds custom jest matchers for asserting on DOM nodes
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    reload: jest.fn(),
    forward: jest.fn(),
    pathname: '/',
    route: '/',
    query: {},
    asPath: '/',
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock wagmi hooks
jest.mock('wagmi', () => ({
  useAccount: jest.fn(() => ({
    address: undefined,
    isConnected: false,
    isConnecting: false,
    isDisconnected: true,
  })),
  useConnect: jest.fn(() => ({
    connect: jest.fn(),
    connectors: [],
    error: null,
    isLoading: false,
    pendingConnector: undefined,
  })),
  useDisconnect: jest.fn(() => ({
    disconnect: jest.fn(),
  })),
  useNetwork: jest.fn(() => ({
    chain: undefined,
    chains: [],
  })),
  useBalance: jest.fn(() => ({
    data: undefined,
    isError: false,
    isLoading: false,
  })),
  useReadContract: jest.fn(() => ({
    data: undefined,
    isError: false,
    isLoading: false,
  })),
  useBlockNumber: jest.fn(() => ({
    data: undefined,
    isError: false,
    isLoading: false,
  })),
  createConfig: jest.fn(),
  http: jest.fn(),
}))

// Mock window.ethereum
global.window = global.window || {}
global.window.ethereum = {
  request: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
}


// Suppress console errors during tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
       args[0].includes('Not implemented: HTMLFormElement.requestSubmit'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})