// Jest setup file
// Add any global test setup here

// Mock jest-dom matchers manually since we can't install the package
expect.extend({
  toBeInTheDocument(element) {
    return {
      pass: element != null && document.contains(element),
      message: () => 'Element should be in document'
    }
  },
  toBeEmptyDOMElement(element) {
    return {
      pass: element != null && element.children.length === 0 && element.textContent === '',
      message: () => 'Element should be empty'
    }
  },
  toHaveAttribute(element, attr, value) {
    const hasAttr = element && element.hasAttribute(attr)
    const attrValue = hasAttr ? element.getAttribute(attr) : null
    const pass = value !== undefined ? hasAttr && attrValue === value : hasAttr
    return {
      pass,
      message: () => `Expected element to have attribute ${attr}${value !== undefined ? ` with value ${value}` : ''}`
    }
  }
})