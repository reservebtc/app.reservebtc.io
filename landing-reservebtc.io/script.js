// Launch App function
function launchApp() {
    // Smooth transition effect
    const button = document.querySelector('.launch-button');
    button.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        window.open('https://app.reservebtc.io', '_blank');
        button.style.transform = 'scale(1)';
    }, 150);
}

// Add keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        const focused = document.activeElement;
        if (focused.classList.contains('launch-button')) {
            e.preventDefault();
            launchApp();
        }
    }
});

// Enhanced torus animation with mouse interaction
document.addEventListener('mousemove', (e) => {
    const torus = document.querySelector('.torus');
    const container = document.querySelector('.main-container');
    
    if (torus && container) {
        const rect = container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const deltaX = (mouseX - centerX) / centerX;
        const deltaY = (mouseY - centerY) / centerY;
        
        // Subtle tilt effect based on mouse position
        const tiltX = deltaY * 5;
        const tiltY = -deltaX * 5;
        
        torus.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
    }
});

// Reset torus position when mouse leaves
document.addEventListener('mouseleave', () => {
    const torus = document.querySelector('.torus');
    if (torus) {
        torus.style.transform = 'rotateX(0deg) rotateY(0deg)';
    }
});

// Preload app domain for faster navigation
const link = document.createElement('link');
link.rel = 'dns-prefetch';
link.href = '//app.reservebtc.io';
document.head.appendChild(link);

// Add loading animation when button is clicked
document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('.launch-button');
    
    button.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Add loading state
        const originalText = button.textContent;
        button.textContent = 'Launching...';
        button.style.opacity = '0.8';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.opacity = '1';
            launchApp();
        }, 800);
    });
});

// Smooth scroll reveal animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Initial animation setup
document.addEventListener('DOMContentLoaded', () => {
    const elements = document.querySelectorAll('.content > *');
    elements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `opacity 0.8s ease ${index * 0.1}s, transform 0.8s ease ${index * 0.1}s`;
        
        setTimeout(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, index * 100);
    });
});

// Performance optimization: reduce animation on low-end devices
const isLowEndDevice = () => {
    return navigator.hardwareConcurrency <= 4 || 
           /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

if (isLowEndDevice()) {
    document.documentElement.style.setProperty('--animation-duration', '60s');
    const torus = document.querySelector('.torus');
    if (torus) {
        torus.style.animationDuration = '60s';
    }
}

// Add focus states for accessibility
document.addEventListener('DOMContentLoaded', () => {
    const focusableElements = document.querySelectorAll('button, a');
    
    focusableElements.forEach(element => {
        element.addEventListener('focus', () => {
            element.style.outline = '2px solid rgba(255, 255, 255, 0.5)';
            element.style.outlineOffset = '2px';
        });
        
        element.addEventListener('blur', () => {
            element.style.outline = 'none';
        });
    });
});