import '@testing-library/jest-dom'

// Mock window.matchMedia only in jsdom environment
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

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock next/router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    }
  },
}))

// Mock wagmi hooks with proper defaults
jest.mock('wagmi', () => ({
  useConnect: () => ({
    connect: jest.fn(),
    connectors: [],
  }),
  useAccount: () => ({
    isConnected: false,
    address: undefined,
    chain: undefined,
  }),
  useDisconnect: () => ({
    disconnect: jest.fn(),
  }),
  useSwitchChain: () => ({
    switchChain: jest.fn(),
  }),
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Wallet: ({ className, ...props }) => <div className={className} data-testid="wallet-icon" {...props} />,
  ChevronDown: ({ className, ...props }) => <div className={className} data-testid="chevron-down-icon" {...props} />,
  Sun: ({ className, ...props }) => <div className={className} data-testid="sun-icon" {...props} />,
  Moon: ({ className, ...props }) => <div className={className} data-testid="moon-icon" {...props} />,
}))

// Add global test helper for network warnings
global.testHelpers = {
  shouldShowNetworkWarning: (chainId) => chainId && chainId !== 70532
}