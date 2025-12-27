// Scroll functionality for a specific section
document.addEventListener("DOMContentLoaded", function () {
  // Now the DOM is fully loaded, and the elements are available.
  document.getElementById("scrollButton").addEventListener("click", function () {
    // Scroll to the section with ID "creators"
    document.getElementById("creators").scrollIntoView({
      behavior: 'smooth'  // Adds smooth scrolling
    });
  });

    initializeNavbarHeightUpdater();
    initializeNavigationHeight();
});



// assets/js/navbar.js

function updateNavbarHeight() {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        const navbarHeight = navbar.offsetHeight;
        document.documentElement.style.setProperty('--navbar-height', `${navbarHeight}px`);
        console.log(`${navbarHeight}px`);
        document.body.style.paddingTop = `${navbarHeight}px`;
    }
}

function initializeNavbarHeightUpdater() {
    updateNavbarHeight(); // Initial call

    window.addEventListener('resize', updateNavbarHeight); // Update on window resize
}

function adjustNavigationBar() {
    const footer = document.querySelector('.footer');
    const navBar = document.querySelector('.navigation-bar');

    if (footer && navBar) {
        // Get the height of the footer
        const footerHeight = footer.offsetHeight;

        // Dynamically set the navigation bar's bottom property
        navBar.style.bottom = `${footerHeight}px`;
    }
}

function initializeNavigationHeight() {
    adjustNavigationBar();

    // Adjust navigation bar on page load
    window.addEventListener('load', adjustNavigationBar);

    // Adjust navigation bar on window resize (in case the footer height changes)
    window.addEventListener('resize', adjustNavigationBar);
}
