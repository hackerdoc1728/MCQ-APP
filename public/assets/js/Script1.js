// public/scripts.js

// API Credentials and Configuration
// Removed API key, channelId, and maxResults from the frontend for security reasons.
// These should be handled securely on the backend.

let nextPageToken = null; // Token for the next page
let prevPageToken = null; // Token for the previous page
let currentPage = 1; // Tracks the current page number

/**
 * Fetch the videos from the backend API and update the page
 * @param {string} pageToken - Token for pagination (next/prev page)
 */
async function fetchChannelVideos(pageToken = '') {
    console.log('Fetching videos with pageToken:', pageToken);

    // Show loading indicators
    showLoading();


    try {
        const params = {};
        if (pageToken) {
            params.pageToken = pageToken;
        }

        // Construct query string
        const queryString = new URLSearchParams(params).toString();

        // Fetch videos from the backend API
        const response = await fetch(`/api/videos?${queryString}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.items) {
            // Populate video data into skeleton boxes
            await populateVideoData(data.items); // Wait for all thumbnails to load

            // Update pagination tokens
            nextPageToken = data.nextPageToken || null;
            prevPageToken = data.prevPageToken || null;

            // Update current page number based on tokens
            // Assuming that if a nextPageToken is present, we're moving forward
            if (pageToken && pageToken === nextPageToken) {
                currentPage += 1;
            }
            // If a prevPageToken is present, we're moving backward
            else if (pageToken && pageToken === prevPageToken) {
                currentPage = Math.max(currentPage - 1, 1);
            }

            // Update pagination controls visibility and page info
            updatePaginationControls();
           
        } else {
            throw new Error('No video items found in the response.');
        }
   

    } finally {
        // Hide loading indicators
        hideLoading();
    }
}

/**
 * Show loading indicators when fetching new data
 */
function showLoading() {
    const skeletonBoxes = document.querySelectorAll('#video-list-container .box');
    skeletonBoxes.forEach(box => {
        box.style.display = ''; // Ensure skeletons are visible
        box.innerHTML = `
      <div class="image fit">
        <div class="placeholder skeleton-thumbnail"></div>
      </div>
      <div class="inner">
        <div class="content-wrapper">
          <h3 class="placeholder col-6"></h3>
          <p class="placeholder col-8"></p>
        </div>
        <div class="button-wrapper">
          <button class="placeholder btn btn-secondary col-4" disabled>Loading</button>
        </div>
      </div>
    `;
        box.classList.add('placeholder-glow');
    });

    
}

/**
 * Hide loading indicators after data is fetched
 */
function hideLoading() {
    const skeletonBoxes = document.querySelectorAll('#video-list-container .box');
    skeletonBoxes.forEach(box => {
        box.classList.remove('placeholder-glow'); // Remove placeholder style
    });

   
}



/**
 * Populate video data into static skeleton boxes
 * Wait for all thumbnails to load before removing skeletons
 * @param {Array} videos - List of video items from the API
 */
function populateVideoData(videos) {
    return new Promise(resolve => {
        const skeletonBoxes = document.querySelectorAll('#video-list-container .box');
        let imagesLoaded = 0;

        videos.forEach((item, index) => {
            if (index >= skeletonBoxes.length) return; // Skip if more videos than skeletons

            const box = skeletonBoxes[index];
            const videoId = item.id.videoId;
            const snippet = item.snippet;
            const title = snippet.title;
            const description = snippet.description;
            const thumbnail = snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url;
            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

            // Create a temporary image to track loading
            const img = new Image();
            img.src = thumbnail;

            img.onload = () => {
                imagesLoaded++;

                // Populate content
                box.innerHTML = `
  <div class="image fit">
    <a href="${videoUrl}" data-fancybox="video" data-width="800" data-height="400">
      <img src="${thumbnail}" alt="${title}" loading="lazy" />
    </a>
    <div class="content-wrapper">
      <h3>
        <a href="${videoUrl}" data-fancybox="video" data-width="800" data-height="400">${title}</a>
      </h3>
      <p>${description}</p>
    </div>
  </div>
  <div class="inner">
    <div class="button-wrapper">
      <a href="${videoUrl}" class="button fit" data-fancybox="video" data-width="800" data-height="400">Watch</a>
    </div>
  </div>
`;

                // Remove placeholder style
                box.classList.remove('placeholder-glow');

                // Check if all thumbnails are loaded
                if (imagesLoaded === videos.length) {
                    resolve(); // All thumbnails are ready
                }
            };

            img.onerror = () => {
                console.error(`Failed to load thumbnail for video: ${title}`);
                imagesLoaded++;

                // Populate content with a placeholder image or message
                box.innerHTML = `
          <div class="image fit">
            <img src="placeholder.png" alt="Placeholder" loading="lazy" />
            <div class="content-wrapper">
              <h3><a href="${videoUrl}" target="_blank" rel="noopener noreferrer">${title}</a></h3>
              <p>${description}</p>
            </div>
          </div>
          <div class="inner">
            <div class="button-wrapper">
              <a href="${videoUrl}" class="button fit" target="_blank" rel="noopener noreferrer">Watch</a>
            </div>
          </div>
        `;

                // Remove placeholder style
                box.classList.remove('placeholder-glow');

                // Check if all thumbnails are loaded
                if (imagesLoaded === videos.length) {
                    resolve(); // Proceed even if some thumbnails fail to load
                }
            };
        });

        // Hide remaining skeletons if fewer videos are fetched
        skeletonBoxes.forEach((box, index) => {
            if (index >= videos.length) {
                box.style.display = 'none'; // Hide unused skeletons
            }
        });
    });
}

/**
 * Update pagination buttons' visibility and state
 */
function updatePaginationControls() {
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');

    if (prevPageToken) {
        prevButton.disabled = false;
        prevButton.style.display = 'inline-block';
    } else {
        prevButton.disabled = true;
        prevButton.style.display = 'none';
    }

    if (nextPageToken) {
        nextButton.disabled = false;
        nextButton.style.display = 'inline-block';
    } else {
        nextButton.disabled = true;
        nextButton.style.display = 'none';
    }
}



/**
 * Update the URL with the current pageToken using history.pushState
 * @param {string} pageToken - The pageToken to include in the URL
 */
function updateURL(pageToken) {
    const url = new URL(window.location);
    if (pageToken) {
        url.searchParams.set('pageToken', pageToken);
    } else {
        url.searchParams.delete('pageToken');
    }
    history.pushState({ pageToken }, '', url);
}

/**
 * Handle browser navigation (Back/Forward buttons)
 */
window.addEventListener('popstate', (event) => {
    const pageToken = event.state?.pageToken || '';
    console.log('Handling popstate event with pageToken:', pageToken);
    fetchChannelVideos(pageToken);
});

/**
 * Initialize event listeners and fetch initial videos on DOM content loaded
 */
document.addEventListener('DOMContentLoaded', function () {
    try {
        const bannerSection = document.getElementById('banner');
        const prevButton = document.getElementById('prev-button');

        if (!bannerSection) {
            throw new Error("Element with ID 'banner' not found.");
        }

        if (!prevButton) {
            throw new Error("Element with ID 'prev-button' not found.");
        }

        // Initial check for display style
        if (getComputedStyle(prevButton).display === 'block') {
            bannerSection.style.display = 'none';
            console.log("'banner' section hidden successfully.");
        }

        // Observe changes to the 'prev-button' display style
        const observer = new MutationObserver(() => {
            const displayStyle = getComputedStyle(prevButton).display;
            console.log(`'prev-button' display style changed to: ${displayStyle}`);

            if (displayStyle === 'block') {
                bannerSection.style.display = 'none';
                console.log("'banner' section hidden successfully.");
            } else {
                bannerSection.style.display = ''; // Restore default display style
                console.log("'banner' section restored.");
            }
        });

        // Configure observer to monitor attribute changes
        observer.observe(prevButton, { attributes: true, attributeFilter: ['style'] });

        // Parse pageToken from URL on page load
        const urlParams = new URLSearchParams(window.location.search);
        const initialPageToken = urlParams.get('pageToken') || '';

        if (initialPageToken) {
            // Optionally, determine the current page number based on history or other logic
            // For simplicity, we'll start with page 1 and adjust based on tokens
            currentPage = 2; // Assuming the first page has no pageToken
        }

        // Fetch videos based on the initial pageToken
        fetchChannelVideos(initialPageToken);

    } catch (error) {
        console.error("An error occurred:", error.message);
        console.error("Stack trace:", error.stack);
    }
});

/**
 * Event listeners for pagination buttons
 */
document.getElementById('prev-button').addEventListener('click', () => {
    if (prevPageToken) {
        // Update URL with prevPageToken
        updateURL(prevPageToken);
        // Fetch videos for prevPageToken
        fetchChannelVideos(prevPageToken);
    }
});

document.getElementById('next-button').addEventListener('click', () => {
    if (nextPageToken) {
        // Update URL with nextPageToken
        updateURL(nextPageToken);
        // Fetch videos for nextPageToken
        fetchChannelVideos(nextPageToken);
    }
});
