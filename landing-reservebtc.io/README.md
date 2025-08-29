# ReserveBTC Landing Page

Professional landing page for reservebtc.io with animated 3D torus background and responsive design.

## Features

- ✨ **3D Animated Torus** - CSS-only 3D torus with rotating gradient colors
- 🎨 **Dynamic Gradient Background** - Matches the exact design from the reference image
- 📱 **Fully Responsive** - Adapts to desktop, tablet, and mobile screens
- ⚡ **Performance Optimized** - Smooth animations with hardware acceleration
- 🔗 **Social Media Integration** - Links to Twitter, GitHub, Email, and ChatGPT Assistant
- 🎯 **SEO Optimized** - Complete meta tags, OpenGraph, and Twitter cards
- ♿ **Accessibility Ready** - Keyboard navigation and screen reader support

## Technology Stack

- **Pure HTML5** - Semantic markup
- **CSS3** - Advanced animations and 3D transforms
- **Vanilla JavaScript** - No external dependencies
- **Inter Font** - Professional typography matching app.reservebtc.io

## Files Structure

```
landing-reservebtc.io/
├── index.html          # Main HTML file
├── styles.css          # All CSS styles and animations
├── script.js           # JavaScript functionality
└── README.md          # This documentation
```

## Key Features

### 3D Torus Animation
- Created using pure CSS with `conic-gradient` and `transform3d`
- Realistic depth and lighting effects
- Mouse interaction for subtle 3D tilt effect
- Optimized for low-end devices

### Responsive Design
- Desktop: Full-scale 800px torus
- Tablet: 600px torus with adjusted typography  
- Mobile: 400px torus with stacked features
- Small mobile: 300px torus with condensed layout

### Performance
- Hardware-accelerated animations
- Optimized for 60fps on modern devices
- Reduced animation complexity on low-end devices
- DNS prefetching for faster app navigation

### Social Links
- **Twitter/X**: https://x.com/reserveBTC
- **GitHub**: https://github.com/reservebtc  
- **Email**: reservebtcproof@gmail.com
- **ChatGPT Assistant**: Custom GPT for support

## SEO & Meta Tags

Complete SEO optimization including:
- Title and description optimization
- OpenGraph tags for social sharing
- Twitter Card support
- Semantic HTML structure
- Keywords targeting Bitcoin DeFi space

## Launch

Simply open `index.html` in a web browser or deploy to any static hosting service:

- Vercel
- Netlify  
- GitHub Pages
- AWS S3 + CloudFront

The landing page will automatically redirect users to `https://app.reservebtc.io` when they click "Launch App".

## Browser Support

- Chrome 60+ ✅
- Firefox 60+ ✅  
- Safari 12+ ✅
- Edge 79+ ✅
- Mobile browsers ✅

## Customization

Key variables can be adjusted in `styles.css`:

```css
/* Torus size */
.torus-container { width: 800px; height: 800px; }

/* Animation speed */
@keyframes rotateTorus { /* 30s duration */ }

/* Colors */
background: conic-gradient(/* gradient colors */);
```

---

**Production Ready** 🚀 - Optimized for reservebtc.io main domain