// Import necessary modules
import AOS from 'https://cdn.skypack.dev/aos';

// Attach non-critical stylesheets from <link rel="preload"> tags in <head>
function applyStylesheetFromPreload(preloadId) {
  const preload = document.getElementById(preloadId);
  if (!preload) {
    console.warn(`Preload link with id "${preloadId}" not found.`);
    return;
  }

  const href = preload.getAttribute('href');
  if (!href) {
    console.warn(`Preload link with id "${preloadId}" has no href.`);
    return;
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

// Main initialization function
document.addEventListener('DOMContentLoaded', () => {
  // Turn preloaded AOS + Font Awesome into real stylesheets (non-blocking & CSP-safe)
  applyStylesheetFromPreload('aos-css-preload');
  applyStylesheetFromPreload('fa-css-preload');
  initializeAOS();

  setupNavbarLinkHandlers();
  setupOffCanvasToggle();
  setupSubheaderScrollBehavior();
  setupSortingHandler();

  try {
    console.log('Other UI components initialized successfully.');
  } catch (error) {
    console.error('UI Components Initialization Error:', error);
  }
});

// Initialize Animate on Scroll (AOS)
function initializeAOS() {
  try {
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: true,
    });
    console.log('AOS initialized successfully.');
  } catch (error) {
    console.error('AOS Initialization Error:', error);
  }
}

// Setup click handlers for navbar links (responsive collapse)
function setupNavbarLinkHandlers() {
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
  const navbarCollapse = document.getElementById('navbarNav');

  if (!navbarCollapse) {
    console.warn('Navbar collapse element not found.');
    return;
  }

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 992) {
        const bootstrap = window.bootstrap;
        if (bootstrap && bootstrap.Collapse) {
          const bsCollapse = new bootstrap.Collapse(navbarCollapse, { toggle: true });
          bsCollapse.hide();
          console.log('Navbar collapsed after link click.');
        } else {
          console.warn('Bootstrap Collapse not found.');
        }
      }
    });
  });
}

// Setup off-canvas toggle functionality
function setupOffCanvasToggle() {
  const toggleButton = document.getElementById('toggleButton');
  const offCanvasMenu = document.getElementById('offCanvasMenu');

  if (!toggleButton || !offCanvasMenu) {
    console.warn('Off-canvas menu elements not found.');
    return;
  }

  toggleButton.addEventListener('click', () => {
    offCanvasMenu.classList.toggle('open');
    console.log('Off-canvas toggle triggered.');
  });
}

// Setup subheader scroll behavior
function setupSubheaderScrollBehavior() {
  const subheader = document.getElementById('subheader');
  const youtubeLogo = document.querySelector('.youtube-logo');
  const offcanvasToggler = document.getElementById('toggleButton');
  let lastScrollTop = 0;
  let linksAddedToNavbar = false;

  if (!subheader || !youtubeLogo || !offcanvasToggler) {
    console.warn('Subheader or related elements not found.');
    return;
  }

  const moveLinksToNavbar = () => {
    if (linksAddedToNavbar || window.innerWidth < 992) return;
    const navLinksContainer = document.createElement('div');
    navLinksContainer.className = 'navbar-dynamic-links';
    const subheaderLinks = Array.from(subheader.querySelectorAll('.nav-link'));
    subheaderLinks.forEach(link => {
      const navLink = link.cloneNode(true);
      navLinksContainer.appendChild(navLink);
    });
    youtubeLogo.parentNode.insertBefore(navLinksContainer, youtubeLogo);
    linksAddedToNavbar = true;
  };

  const restoreLinksToSubheader = () => {
    if (!linksAddedToNavbar) return;
    const dynamicLinks = document.querySelector('.navbar-dynamic-links');
    if (dynamicLinks) dynamicLinks.remove();
    linksAddedToNavbar = false;
  };

  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY || document.documentElement.scrollTop;
    if (currentScroll > lastScrollTop) {
      subheader.classList.add('hidden');
      moveLinksToNavbar();
    } else {
      subheader.classList.remove('hidden');
      restoreLinksToSubheader();
    }
    lastScrollTop = Math.max(0, currentScroll);
  });

  offcanvasToggler.addEventListener('click', restoreLinksToSubheader);
}

// Setup sorting dropdown handler
function setupSortingHandler() {
  const sortSelector = document.getElementById('sort');
  if (sortSelector) {
    sortSelector.addEventListener('change', (event) => {
      const sortBy = event.target.value;
      window.location.href = `/musings?sort=${sortBy}`;
    });
  }
}

