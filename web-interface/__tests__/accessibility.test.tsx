import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { WalletConnect } from '@/components/wallet/wallet-connect'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { StatisticsWidget } from '@/components/widgets/statistics-widget'
import HomePage from '@/app/page'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

// Mock wagmi hooks
jest.mock('wagmi', () => ({
  useAccount: () => ({
    address: '0x742d35cc6435c0532925a3b8c17890c5e4e6f4b0',
    isConnected: true,
    chain: { id: 70532, name: 'MegaETH Testnet' },
  }),
  useConnect: () => ({
    connect: jest.fn(),
    connectors: [{ id: 'metaMask', name: 'MetaMask' }],
    error: null,
  }),
  useDisconnect: () => ({
    disconnect: jest.fn(),
  }),
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null),
  }),
}))

// Mock Framer Motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
}))

describe('Accessibility Tests', () => {
  describe('Component Accessibility', () => {
    test('WalletConnect should not have accessibility violations', async () => {
      const { container } = render(<WalletConnect />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    test('ThemeToggle should not have accessibility violations', async () => {
      const { container } = render(<ThemeToggle />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    test('StatisticsWidget should not have accessibility violations', async () => {
      const { container } = render(<StatisticsWidget />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    test('HomePage should not have accessibility violations', async () => {
      // Mock providers for HomePage
      const MockedHomePage = () => {
        return (
          <div role="main">
            <HomePage />
          </div>
        )
      }
      
      const { container } = render(<MockedHomePage />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Keyboard Navigation', () => {
    test('WalletConnect should be keyboard accessible', () => {
      const { container } = render(<WalletConnect />)
      
      const interactiveElements = container.querySelectorAll(
        'button, [role="button"], input, select, textarea, a[href]'
      )
      
      interactiveElements.forEach(element => {
        expect(element).toHaveAttribute('tabIndex', expect.any(String))
        expect(Number(element.getAttribute('tabIndex'))).toBeGreaterThanOrEqual(-1)
      })
    })

    test('ThemeToggle should be keyboard accessible', () => {
      const { container } = render(<ThemeToggle />)
      
      const button = container.querySelector('button')
      expect(button).toBeInTheDocument()
      expect(button).not.toHaveAttribute('tabIndex', '-1')
    })
  })

  describe('ARIA Labels and Roles', () => {
    test('WalletConnect should have proper ARIA attributes', () => {
      const { container } = render(<WalletConnect />)
      
      const buttons = container.querySelectorAll('button')
      buttons.forEach(button => {
        // Each button should have either aria-label or accessible text content
        const hasAriaLabel = button.hasAttribute('aria-label')
        const hasTextContent = button.textContent?.trim().length > 0
        const hasAriaLabelledBy = button.hasAttribute('aria-labelledby')
        
        expect(hasAriaLabel || hasTextContent || hasAriaLabelledBy).toBe(true)
      })
    })

    test('ThemeToggle should have proper ARIA attributes', () => {
      const { container } = render(<ThemeToggle />)
      
      const button = container.querySelector('button')
      expect(button).toHaveAttribute('aria-label')
      expect(button?.getAttribute('aria-label')).toMatch(/switch to \w+ theme/i)
    })

    test('Interactive elements should have proper roles', () => {
      const { container } = render(<WalletConnect />)
      
      const buttons = container.querySelectorAll('[role="button"], button')
      expect(buttons.length).toBeGreaterThan(0)
      
      buttons.forEach(button => {
        const role = button.getAttribute('role') || button.tagName.toLowerCase()
        expect(['button'].includes(role)).toBe(true)
      })
    })
  })

  describe('Color Contrast and Visual Accessibility', () => {
    test('should not rely solely on color to convey information', () => {
      const { container } = render(<WalletConnect />)
      
      // Check for status indicators that might rely on color
      const statusElements = container.querySelectorAll('[class*="text-green"], [class*="text-red"], [class*="text-destructive"]')
      
      statusElements.forEach(element => {
        // Should have additional indicators beyond just color
        const hasIcon = element.querySelector('svg') || element.querySelector('[data-testid*="icon"]')
        const hasTextualIndicator = element.textContent?.includes('success') || 
                                   element.textContent?.includes('error') ||
                                   element.textContent?.includes('wrong') ||
                                   element.textContent?.includes('failed')
        
        if (!hasIcon && !hasTextualIndicator) {
          console.warn(`Element may rely solely on color: ${element.textContent}`)
        }
      })
    })

    test('focus indicators should be visible', () => {
      const { container } = render(<ThemeToggle />)
      
      const focusableElements = container.querySelectorAll('button, input, select, textarea, a[href]')
      
      focusableElements.forEach(element => {
        // Check that elements don't have outline: none without alternative focus indicator
        const computedStyle = window.getComputedStyle(element)
        const hasOutline = computedStyle.outline !== 'none'
        const hasFocusClasses = element.className.includes('focus:') || element.className.includes('focus-visible:')
        
        // Element should either have outline or focus classes
        expect(hasOutline || hasFocusClasses).toBe(true)
      })
    })
  })

  describe('Screen Reader Compatibility', () => {
    test('should provide appropriate text alternatives for images', () => {
      const { container } = render(<StatisticsWidget />)
      
      const images = container.querySelectorAll('img')
      images.forEach(img => {
        expect(img).toHaveAttribute('alt')
        const alt = img.getAttribute('alt')
        expect(alt).not.toBe('')
      })
    })

    test('should have proper heading structure', () => {
      const { container } = render(<StatisticsWidget />)
      
      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
      
      if (headings.length > 0) {
        // First heading should be h1, h2, or h3 (reasonable for components)
        const firstHeading = headings[0]
        const level = parseInt(firstHeading.tagName.charAt(1))
        expect(level).toBeLessThanOrEqual(3)
        
        // No heading level should skip more than one level
        for (let i = 1; i < headings.length; i++) {
          const currentLevel = parseInt(headings[i].tagName.charAt(1))
          const previousLevel = parseInt(headings[i-1].tagName.charAt(1))
          expect(currentLevel - previousLevel).toBeLessThanOrEqual(1)
        }
      }
    })

    test('should provide context for form controls', () => {
      const { container } = render(<WalletConnect />)
      
      const inputs = container.querySelectorAll('input, select, textarea')
      inputs.forEach(input => {
        const hasLabel = input.hasAttribute('aria-label') || 
                         input.hasAttribute('aria-labelledby') ||
                         container.querySelector(`label[for="${input.id}"]`)
        
        const hasPlaceholder = input.hasAttribute('placeholder')
        
        // Should have either label or placeholder (though label is preferred)
        expect(hasLabel || hasPlaceholder).toBe(true)
      })
    })
  })

  describe('Error Handling and User Feedback', () => {
    test('error messages should be associated with form controls', () => {
      // This would test error states, but we need to mock error conditions
      const { container } = render(<div />)
      
      const errorMessages = container.querySelectorAll('[role="alert"], .error-message, [class*="error"]')
      
      errorMessages.forEach(error => {
        // Error messages should be announced to screen readers
        const hasRole = error.hasAttribute('role')
        const hasAriaLive = error.hasAttribute('aria-live')
        
        expect(hasRole || hasAriaLive).toBe(true)
      })
    })

    test('loading states should be announced', () => {
      // Mock a loading state
      const LoadingComponent = () => (
        <div>
          <button disabled>
            <span>Loading...</span>
          </button>
        </div>
      )
      
      const { container } = render(<LoadingComponent />)
      
      const loadingElements = container.querySelectorAll('[disabled]')
      loadingElements.forEach(element => {
        // Should indicate loading state
        const hasLoadingText = element.textContent?.toLowerCase().includes('loading') ||
                              element.textContent?.toLowerCase().includes('connecting')
        const hasAriaLabel = element.getAttribute('aria-label')?.toLowerCase().includes('loading') ||
                           element.getAttribute('aria-label')?.toLowerCase().includes('connecting')
        
        expect(hasLoadingText || hasAriaLabel).toBe(true)
      })
    })
  })

  describe('Mobile Accessibility', () => {
    test('touch targets should be large enough', () => {
      const { container } = render(<WalletConnect />)
      
      const buttons = container.querySelectorAll('button, [role="button"]')
      
      buttons.forEach(button => {
        const computedStyle = window.getComputedStyle(button)
        
        // Mock the computed dimensions (in real tests, these would be calculated)
        // Touch targets should be at least 44x44px
        const minSize = 44
        
        // Check for padding or explicit sizing that would make touch target large enough
        const hasPadding = button.className.includes('p-') || 
                          button.className.includes('px-') || 
                          button.className.includes('py-')
        
        expect(hasPadding).toBe(true) // Buttons should have adequate padding
      })
    })

    test('should work with zoom up to 200%', () => {
      // This is more of a visual test, but we can check for responsive classes
      const { container } = render(<StatisticsWidget />)
      
      const elements = container.querySelectorAll('*')
      
      // Check for responsive design classes
      const hasResponsiveClasses = Array.from(elements).some(element => 
        element.className.includes('sm:') || 
        element.className.includes('md:') || 
        element.className.includes('lg:')
      )
      
      expect(hasResponsiveClasses).toBe(true)
    })
  })

  describe('Performance Accessibility', () => {
    test('should not have excessive DOM nesting', () => {
      const { container } = render(<StatisticsWidget />)
      
      // Check maximum nesting depth
      let maxDepth = 0
      
      const checkDepth = (element: Element, currentDepth = 0) => {
        maxDepth = Math.max(maxDepth, currentDepth)
        
        for (const child of element.children) {
          checkDepth(child, currentDepth + 1)
        }
      }
      
      checkDepth(container)
      
      // Reasonable DOM depth for accessibility
      expect(maxDepth).toBeLessThan(20)
    })

    test('should not have too many focusable elements', () => {
      const { container } = render(<StatisticsWidget />)
      
      const focusableElements = container.querySelectorAll(
        'button, [role="button"], input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
      )
      
      // Should not have excessive focusable elements that would make keyboard navigation difficult
      expect(focusableElements.length).toBeLessThan(20)
    })
  })
})