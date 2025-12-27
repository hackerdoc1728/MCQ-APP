// assets/js/navbar.js

function updateNavbarHeight() {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        const navbarHeight = navbar.getBoundingClientRect().height;
        document.documentElement.style.setProperty('--navbar-height', `${navbarHeight}px`);
        console.log(`Navbar height set to: ${navbarHeight}px`);
        document.body.style.paddingTop = `${navbarHeight}px`;
    } else {
        console.log('Navbar element not found.');
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
        const footerHeight = footer.getBoundingClientRect().height;

        // Dynamically set the navigation bar's bottom property
        navBar.style.bottom = `${footerHeight}px`;
    } else {
        console.log('Footer or navigation bar element not found.');
    }
}

function initializeNavigationHeight() {
    adjustNavigationBar();

    // Adjust navigation bar on page load
    window.addEventListener('load', adjustNavigationBar);

    // Adjust navigation bar on window resize (in case the footer height changes)
    window.addEventListener('resize', adjustNavigationBar);
}



// Use MutationObserver to check if the content div is visible
const contentObserver = new MutationObserver((mutationsList, observer) => {
    for (const mutation of mutationsList) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            const content = document.getElementById('content');
            if (content && content.style.display !== 'none') {
                console.log('Content is visible.');
                initializeNavbarHeightUpdater();
                initializeNavigationHeight();
                observer.disconnect(); // Stop observing once the content is visible
            }
        }
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const content = document.getElementById('content');
    if (content) {
        contentObserver.observe(content, { attributes: true }); // Observe attribute changes
    } else {
        console.log('Content element not found.');
    }
});


