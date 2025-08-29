import { render, screen } from '@testing-library/react'
import { WalletConnect } from '../wallet-connect'

// Mock wagmi hooks
const mockUseAccount = jest.fn()
const mockUseConnect = jest.fn()
const mockUseDisconnect = jest.fn()
const mockUseSwitchChain = jest.fn()

jest.mock('wagmi', () => ({
  useAccount: () => mockUseAccount(),
  useConnect: () => mockUseConnect(),
  useDisconnect: () => mockUseDisconnect(),
  useSwitchChain: () => mockUseSwitchChain(),
}))

// Mock the megaeth chain
jest.mock('@/web-interface/lib/chains/megaeth', () => ({
  megaeth: { id: 70532, name: 'MegaETH Testnet' }
}))

describe('WalletConnect Component', () => {
  const mockConnect = jest.fn()
  const mockDisconnect = jest.fn()
  const mockConnectors = [
    { id: 'metaMask', name: 'MetaMask' }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseConnect.mockReturnValue({
      connect: mockConnect,
      connectors: mockConnectors,
      error: null,
      isPending: false,
    })
    
    mockUseDisconnect.mockReturnValue({
      disconnect: mockDisconnect,
    })
    
    mockUseSwitchChain.mockReturnValue({
      switchChain: jest.fn(),
    })
  })

  test('renders connect button when wallet is not connected', () => {
    mockUseAccount.mockReturnValue({
      address: undefined,
      isConnected: false,
      chain: undefined,
    })

    render(<WalletConnect />)
    
    const connectButton = screen.getByRole('button', { name: /connect wallet/i })
    expect(connectButton).toBeInTheDocument()
  })

  test('renders connected wallet info', () => {
    const mockAddress = '0x742d35cc6435c0532925a3b8c17890c5e4e6f4b0'
    mockUseAccount.mockReturnValue({
      address: mockAddress,
      isConnected: true,
      chain: { id: 70532, name: 'MegaETH Testnet' },
    })

    render(<WalletConnect />)
    
    expect(screen.getByText('0x742d...f4b0')).toBeInTheDocument()
  })

  test('shows wrong network warning', () => {
    mockUseAccount.mockReturnValue({
      address: '0x742d35cc6435c0532925a3b8c17890c5e4e6f4b0',
      isConnected: true,
      chain: { id: 1, name: 'Ethereum Mainnet' },
    })

    render(<WalletConnect />)
    
    expect(screen.getByText(/switch to megaeth/i)).toBeInTheDocument()
  })
})