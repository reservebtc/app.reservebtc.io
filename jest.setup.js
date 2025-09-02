import '@testing-library/jest-dom'

// Set global test timeout - prevent hanging tests
jest.setTimeout(process.env.CI ? 30000 : 15000)

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

// Mock lucide-react icons - comprehensive list
jest.mock('lucide-react', () => ({
  // Theme icons
  Sun: ({ className, ...props }) => <div className={className} data-testid="sun-icon" {...props} />,
  Moon: ({ className, ...props }) => <div className={className} data-testid="moon-icon" {...props} />,
  Monitor: ({ className, ...props }) => <div className={className} data-testid="monitor-icon" {...props} />,
  // Navigation icons  
  ChevronDown: ({ className, ...props }) => <div className={className} data-testid="chevron-down-icon" {...props} />,
  ChevronUp: ({ className, ...props }) => <div className={className} data-testid="chevron-up-icon" {...props} />,
  ArrowRight: ({ className, ...props }) => <div className={className} data-testid="arrow-right-icon" {...props} />,
  ArrowLeft: ({ className, ...props }) => <div className={className} data-testid="arrow-left-icon" {...props} />,
  // Wallet & finance icons
  Wallet: ({ className, ...props }) => <div className={className} data-testid="wallet-icon" {...props} />,
  DollarSign: ({ className, ...props }) => <div className={className} data-testid="dollar-sign-icon" {...props} />,
  Bitcoin: ({ className, ...props }) => <div className={className} data-testid="bitcoin-icon" {...props} />,
  // Status icons
  CheckCircle: ({ className, ...props }) => <div className={className} data-testid="check-circle-icon" {...props} />,
  AlertCircle: ({ className, ...props }) => <div className={className} data-testid="alert-circle-icon" {...props} />,
  Info: ({ className, ...props }) => <div className={className} data-testid="info-icon" {...props} />,
  // Utility icons
  ExternalLink: ({ className, ...props }) => <div className={className} data-testid="external-link-icon" {...props} />,
  Shield: ({ className, ...props }) => <div className={className} data-testid="shield-icon" {...props} />,
  Code: ({ className, ...props }) => <div className={className} data-testid="code-icon" {...props} />,
  Book: ({ className, ...props }) => <div className={className} data-testid="book-icon" {...props} />,
  FileText: ({ className, ...props }) => <div className={className} data-testid="file-text-icon" {...props} />,
  Calendar: ({ className, ...props }) => <div className={className} data-testid="calendar-icon" {...props} />,
  Users: ({ className, ...props }) => <div className={className} data-testid="users-icon" {...props} />,
  RefreshCw: ({ className, ...props }) => <div className={className} data-testid="refresh-icon" {...props} />,
  Home: ({ className, ...props }) => <div className={className} data-testid="home-icon" {...props} />,
  Search: ({ className, ...props }) => <div className={className} data-testid="search-icon" {...props} />,
  HelpCircle: ({ className, ...props }) => <div className={className} data-testid="help-circle-icon" {...props} />,
  Zap: ({ className, ...props }) => <div className={className} data-testid="zap-icon" {...props} />,
}))

// Add global test helper for network warnings
global.testHelpers = {
  shouldShowNetworkWarning: (chainId) => chainId && chainId !== 70532
}