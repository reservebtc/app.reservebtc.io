import { render, screen } from '@testing-library/react'
import { ThemeToggle } from '../theme-toggle'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock document.documentElement
const mockDocumentElement = {
  classList: {
    toggle: jest.fn(),
    add: jest.fn(),
    remove: jest.fn(),
  }
}
Object.defineProperty(document, 'documentElement', {
  value: mockDocumentElement,
  writable: true,
})

// Mock matchMedia
const mockMatchMedia = jest.fn()
Object.defineProperty(window, 'matchMedia', {
  value: mockMatchMedia,
})

describe('ThemeToggle Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    mockMatchMedia.mockReturnValue({
      matches: false,
      media: '(prefers-color-scheme: dark)',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })
  })

  test('renders theme toggle button', async () => {
    render(<ThemeToggle />)
    
    // Wait for component to mount
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  test('has accessible attributes', async () => {
    render(<ThemeToggle />)
    
    // Wait for component to mount
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label')
  })

  test('applies theme classes', async () => {
    render(<ThemeToggle />)
    
    // Wait for component to mount and effect to run
    await new Promise(resolve => setTimeout(resolve, 200))
    
    expect(mockDocumentElement.classList.toggle).toHaveBeenCalled()
  })
})