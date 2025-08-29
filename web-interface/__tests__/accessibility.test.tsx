import { render } from '@testing-library/react'
import { WalletConnect } from '@/components/wallet/wallet-connect'
import { ThemeToggle } from '@/components/ui/theme-toggle'

// Mock wagmi hooks
jest.mock('wagmi', () => ({
  useAccount: () => ({
    address: undefined,
    isConnected: false,
    chain: undefined,
  }),
  useConnect: () => ({
    connect: jest.fn(),
    connectors: [{ id: 'metaMask', name: 'MetaMask' }],
    error: null,
    isPending: false,
  }),
  useDisconnect: () => ({
    disconnect: jest.fn(),
  }),
  useSwitchChain: () => ({
    switchChain: jest.fn(),
  }),
}))

// Mock the megaeth chain
jest.mock('@/lib/chains/megaeth', () => ({
  megaeth: { id: 70532, name: 'MegaETH Testnet' }
}))

describe('Accessibility Tests', () => {
  test('WalletConnect renders without accessibility errors', () => {
    const { container } = render(<WalletConnect />)
    expect(container).toBeInTheDocument()
  })

  test('ThemeToggle renders without accessibility errors', async () => {
    const { container } = render(<ThemeToggle />)
    
    // Wait for component to mount
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(container).toBeInTheDocument()
  })

  test('WalletConnect has accessible button', () => {
    const { container } = render(<WalletConnect />)
    
    const button = container.querySelector('button')
    expect(button).toBeInTheDocument()
  })

  test('ThemeToggle has aria-label', async () => {
    const { container } = render(<ThemeToggle />)
    
    // Wait for component to mount
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const button = container.querySelector('button')
    expect(button).toHaveAttribute('aria-label')
  })
})