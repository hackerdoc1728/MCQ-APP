window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  const content = document.getElementById('content');

  // Ensure the preloader and content elements exist
  if (!preloader || !content) {
    console.warn('Preloader or content element not found.');
    return;
  }

  // Select the hero element
  const hero = document.querySelector('.hero');

  // Ensure the hero element exists
  if (!hero) {
    console.warn('Hero element not found.');
    return;
  }

  // Get the background image URL of the hero element
  const heroBackground = getComputedStyle(hero).backgroundImage;

  // Check if the background image exists in the computed style
  if (!heroBackground || heroBackground === 'none') {
    console.warn('Hero background image not found.');
    hidePreloader(); // Proceed with hiding preloader even if no background is found
    return;
  }

  // Extract the URL from the computed style
  const url = heroBackground.slice(5, -2); // Removing the 'url("...")' part

  // Create a new Image object to check if the background image is fully loaded
  const img = new Image();
  img.src = url;

  // Check if the background image is already loaded
  if (img.complete) {
    hidePreloader();
  } else {
    // Otherwise, wait for the image to load
    img.onload = hidePreloader;
  }

  // Function to hide the preloader
  function hidePreloader() {
    if (preloader) {
      preloader.classList.add('hidden');
    }
    if (content) {
      content.style.display = 'block'; // Show the main content (e.g., hero, other sections)
    }
  }
});
