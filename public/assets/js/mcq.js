document.addEventListener('DOMContentLoaded', () => {
    const mcqContainer = document.getElementById('mcq-container');
    const loader = document.getElementById('loader');
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    const backButton = document.getElementById('back-button');
    const modal = document.getElementById('question-modal');
    const closeModalButton = document.getElementById('close-question-modal');
    const questionGrid = document.getElementById('question-grid');

    // Variables
    let mcqs = [];       // Array to store MCQs
    let currentIndex = parseInt(getCookie('currentIndex')) || 0;
    let totalMCQs = 0;
    let currentPage = parseInt(new URLSearchParams(window.location.search).get('page')) || parseInt(getCookie('currentPage')) || 1;
    const questionsPerPage = 1;  // Only one question per page
    const questionsPerGridPage = 30;  // Show 30 questions per grid page

    // Helper functions to set and get cookies
    function setCookie(name, value, days) {
        const expires = days ? `; expires=${new Date(Date.now() + days * 864e5).toUTCString()}` : '';
        document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/`;
    }

    function getCookie(name) {
        return document.cookie.split('; ').reduce((r, v) => {
            const parts = v.split('=');
            return parts[0] === name ? decodeURIComponent(parts[1]) : r;
        }, '');
    }

    // Fetch MCQs based on page
    async function fetchAllMCQs(page) {
        try {
            loader.classList.remove('d-none'); // Show loader
            mcqContainer.classList.add('d-none'); // Hide mcqContainer

            const response = await fetch(`/api/mcq?page=${page}&limit=${questionsPerPage}`);
            if (!response.ok) {
                throw new Error(`Error fetching MCQs: ${response.statusText}`);
            }

            const data = await response.json();
            mcqs = data.mcqs || [];
            totalMCQs = data.totalMCQs || 0;

            if (!mcqs.length) {
                mcqContainer.textContent = 'No questions found.';
                return;
            }

            renderMCQ(mcqs[0]);  // Render the single question
            updateNavigationButtons();

            const selectedOptions = JSON.parse(getCookie('selectedOptions') || '{}');
            const markedOptionKey = selectedOptions[mcqs[0].index];
            if (markedOptionKey) {
                const optionCard = document.getElementById(`option-${markedOptionKey}`).closest('.option-card');
                optionCard.querySelector('input[type="radio"]').checked = true; // Mark the option as selected
                document.getElementById('submit-button').click(); // Trigger submit button click to validate
            }
        } catch (error) {
            console.error('Error fetching MCQs:', error);
            alert('Failed to load questions. Please try again later.');
        } finally {
            loader.classList.add('d-none'); // Hide loader
            mcqContainer.classList.remove('d-none'); // Show mcqContainer
        }
    }

    // Render a single MCQ
    function renderMCQ(mcq) {
        // Clear only the mcqContent, not the entire container
        let mcqContent = mcqContainer.querySelector('.mcq-content');
        if (mcqContent) {
            mcqContent.remove();
        }

        if (!mcq) {
            mcqContainer.innerHTML = '<p>No question found.</p>';
            return;
        }

        // Question content
        mcqContent = document.createElement('div');
        mcqContent.className = 'mcq-content fade-in';

        mcqContent.innerHTML = `
            <div class="question-number text-muted mb-3">
                Question <strong>${mcq.index}</strong> of ${totalMCQs}
            </div>
            <h5 class="mcq-question">${processContent(mcq.question)}</h5>
        `;

        // Options Grid
        const optionsGrid = document.createElement('div');
        optionsGrid.className = 'options-grid';

        // Iterate over the options object
        for (const [key, value] of Object.entries(mcq.options)) {
            const optionCard = document.createElement('div');
            optionCard.className = 'option-card';

            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'mcq-option';
            radio.id = `option-${key}`;
            radio.value = value;

            const label = document.createElement('label');
            label.htmlFor = `option-${key}`;
            label.innerHTML = processContent(value);

            optionCard.appendChild(radio);
            optionCard.appendChild(label);
            optionsGrid.appendChild(optionCard);
        }

        // Append options grid to mcqContent
        mcqContent.appendChild(optionsGrid);

        // Submit Button
        const submitButton = document.createElement('button');
        submitButton.id = 'submit-button';
        submitButton.className = 'btn btn-primary mt-3';
        submitButton.textContent = 'Submit';
        submitButton.addEventListener('click', () => {
            const selectedOptionCard = mcqContainer.querySelector('.option-card input:checked')?.closest('.option-card');
            if (selectedOptionCard) {
                selectOption(selectedOptionCard, mcq);
            } else {
                alert('Please select an option before submitting.');
            }
        });

        // Append submit button to mcqContent
        mcqContent.appendChild(submitButton);

        // Explanation Section
        const explanationDiv = document.createElement('div');
        explanationDiv.className = 'explanation';
        explanationDiv.innerHTML = `<h5 class="exp">Explanation:</h5>${processContent(mcq.explanation)}`;
        mcqContent.appendChild(explanationDiv);

        // Append mcqContent to mcqContainer
        mcqContainer.appendChild(mcqContent);

        // Append navigation icon if it doesn't already exist
        if (!document.querySelector('.navigation-icon')) {
            const navIcon = document.createElement('div');
            navIcon.className = 'navigation-icon';
            navIcon.innerHTML = `<i class="fas fa-list"></i>`;
            navIcon.addEventListener('click', () => {
                populateQuestionGrid();
                modal.style.display = 'block';  // Display the modal with the question grid
            });
            mcqContainer.appendChild(navIcon);
        }

        setCookie('currentIndex', currentIndex);
        setCookie('currentPage', currentPage);
    
    }

    // Process content for images, videos, and formatting
    function processContent(content) {
        if (typeof content !== 'string') return content;

        // Extract images and replace them with placeholders
        const imageMatches = [];
        content = content.replace(
            /<img[^>]*src="([^"]+)"[^>]*>/g,
            (match, src) => {
                imageMatches.push(`<span class="image fit"><img src="${src}" class="img-fluid"></span>`);
                return `<!--image-placeholder-->`;
            }
        );

        // Extract video URLs and replace them with placeholders
        const videoMatches = [];
        content = content.replace(
            /video:<a href="([^"]+)">[^<]+<\/a>/g,
            (_, videoUrl) => {
                const thumbnailUrl = getThumbnailUrl(videoUrl);
                videoMatches.push(`<div class="videoplay"><a href="${videoUrl}" data-fancybox="gallery" class="video-thumbnail">
                <img src="${thumbnailUrl}" class="video-fluid" alt="Video Thumbnail">
            </a></div>`);
                return `<!--video-placeholder-->`;
            }
        );

        // Split content by placeholders and reassemble with images outside of <p> tags
        const contentParts = content.split('<!--image-placeholder-->');
        let processedContent = '';
        contentParts.forEach((part, index) => {
            if (part.trim()) {  // Check if the part is not empty
                processedContent += `<p>${part}</p>`;
            }
            if (imageMatches[index]) {
                processedContent += imageMatches[index];
            }
        });
        processedContent = processedContent.replace(/<p>\s*<\/p>/g, '');

        // Append videos at the end
        videoMatches.forEach((video) => {
            processedContent += video;
        });

        return processedContent;
    }

    // Generate video thumbnails
    function getThumbnailUrl(videoUrl) {
        const videoId = videoUrl.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/)[1];
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }

    // Handle option selection
    function selectOption(optionCard, mcq, isAutomatic = false) {
        const allOptionCards = mcqContainer.querySelectorAll('.option-card');
        allOptionCards.forEach((card) => card.classList.add('disabled')); // Disable all options

        const selectedRadio = optionCard.querySelector('input[type="radio"]');
        const selectedValue = selectedRadio.value; // This is the option's value like "Paris", "London", etc.
        const correctAnswerLetter = mcq.answer; // Assuming mcq.answer is a letter like 'A', 'B', etc.

        // Check if the selected value matches the correct answer by looking at the options object
        let isCorrect = false;
        Object.entries(mcq.options).forEach(([key, value]) => {
            if (key === correctAnswerLetter && value === selectedValue) {
                isCorrect = true;
            }
        });

        // Add CSS classes to indicate if the answer is correct or incorrect
        optionCard.classList.add(isCorrect ? 'correct' : 'incorrect'); // Highlight the selected option

        if (!isCorrect) {
            // Highlight the correct answer if the selected option is wrong
            allOptionCards.forEach((card) => {
                const radio = card.querySelector('input[type="radio"]');
                const optionValue = radio ? radio.value : '';
                if (optionValue === mcq.options[correctAnswerLetter]) {
                    card.classList.add('correct'); // Highlight the correct answer
                }
            });
        }

        // Show the explanation (if it exists)
        const explanationDiv = mcqContainer.querySelector('.explanation');
        if (explanationDiv) explanationDiv.classList.add('active'); // Make the explanation visible

        // Store the selected option in session cookies if not automatic
        if (!isAutomatic) {
            const selectedOptions = JSON.parse(getCookie('selectedOptions') || '{}');
            selectedOptions[mcq.index] = selectedRadio.id.split('-')[1]; // Store the key of the selected option
            setCookie('selectedOptions', JSON.stringify(selectedOptions));
        }
    }

    // Update Prev/Next buttons
    function updateNavigationButtons() {
        const urlParams = new URLSearchParams(window.location.search);
        const page = parseInt(urlParams.get('page')) || 1;

        prevButton.disabled = page === 1;
      
        nextButton.disabled = page >= totalMCQs;
    }

    // Prev button functionality
    prevButton.addEventListener('click', () => {
        const urlParams = new URLSearchParams(window.location.search);
        const page = parseInt(urlParams.get('page')) || 1;

        if (page > 1) {
            currentPage = page - 1;
            fetchAllMCQs(currentPage);
            setPageParameter(currentPage); // Update URL
        }
    });

    // Next button functionality with transition
    nextButton.addEventListener('click', () => {
        const urlParams = new URLSearchParams(window.location.search);
        const page = parseInt(urlParams.get('page')) || 1;

        if (page < totalMCQs) {
            currentPage = page + 1;
            fetchAllMCQs(currentPage);
            setPageParameter(currentPage); // Update URL
        }
    });

    // Populate question grid inside modal with pagination
    function populateQuestionGrid() {
        questionGrid.innerHTML = '';  // Clear existing grid
        const totalPages = Math.ceil(totalMCQs / questionsPerGridPage);
        let currentGridPage = Math.floor(currentIndex / questionsPerGridPage) + 1;

        function renderGridPage(page) {
            questionGrid.innerHTML = '';  // Clear existing grid
            const startIndex = (page - 1) * questionsPerGridPage;
            const endIndex = Math.min(page * questionsPerGridPage, totalMCQs);

            for (let i = startIndex; i < endIndex; i++) {
                const circle = document.createElement('div');
                circle.className = 'circle';
                circle.textContent = i + 1;  // Show question number
                circle.addEventListener('click', () => navigateToQuestion(i));
                questionGrid.appendChild(circle);
            }

            // Add pagination controls if there are more than 30 questions
            if (totalMCQs > questionsPerGridPage) {
                addPaginationControls(page, totalPages);
            }
        }

        function addPaginationControls(currentPage, totalPages) {
            const paginationControls = document.createElement('div');
            paginationControls.className = 'pagination-controls';

            // Previous Page Button
            if (currentPage > 1) {
                const prevPageButton = document.createElement('button');
                prevPageButton.className = "pagination-button prev-button";
                prevPageButton.textContent = 'Previous';
                prevPageButton.addEventListener('click', () => {
                    renderGridPage(currentPage - 1);
                });
                paginationControls.appendChild(prevPageButton);
            }

            // Next Page Button
            if (currentPage < totalPages) {
                const nextPageButton = document.createElement('button');
                nextPageButton.className = "pagination-button next-button"
                nextPageButton.textContent = 'Next';
                nextPageButton.addEventListener('click', () => {
                    renderGridPage(currentPage + 1);
                });
                paginationControls.appendChild(nextPageButton);
            }

            questionGrid.appendChild(paginationControls);
        }

        renderGridPage(currentGridPage);
    }

    // Navigate to a specific question
    function navigateToQuestion(index) {
        currentIndex = index;
        fetchAllMCQs(Math.floor(currentIndex / questionsPerPage) + 1);
        renderMCQ(mcqs[currentIndex % questionsPerPage]);
        modal.style.display = 'none';  // Close modal after navigation
        setPageParameter(currentIndex + 1); // Set the page parameter to the question number
        updateNavigationButtons();
    }

    // Close modal button
    closeModalButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Close modal if user clicks outside of it
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Back button (go back in browser history)
    backButton.addEventListener('click', () => {
        if (!document.referrer || document.referrer === 'about:blank') {
            window.location.href = 'https://benchtobedsideneuro.com';  // Custom URL
        } else {
            window.history.back();
        }
    });

    // Set the page parameter to the question number
    function setPageParameter(questionNumber) {
        const url = new URL(window.location);
        url.searchParams.set('page', questionNumber);
        window.history.pushState({}, '', url);
    }

    // Initialize
    fetchAllMCQs(currentPage);  // Load first page of MCQs

    // Attach the event listener and explicitly pass the event object
    mcqContainer.addEventListener("click", (event) => {
        // Check for clicks on images inside .image.fit
        const span = event.target.closest(".image.fit");
        if (span) {
            console.log("Image clicked, opening modal...");
            event.stopPropagation(); // Stop event from bubbling further
            event.preventDefault(); // Prevent default action, if any
            const img = span.querySelector("img");
            if (img) {
                openImageModal(img.src, img.alt);
            }
            return; // Stop further processing
        }
    });

    // Open image modal
    function openImageModal(src, alt) {
        console.log("Opening image modal with src:", src);
        const imageModal = document.getElementById("imageModal");
        const modalImage = document.getElementById("modalImage");

        imageModal.style.display = "flex";
        modalImage.src = src;
        modalImage.alt = alt;
    }

    // Close the modal
    document.getElementById("imageModal").addEventListener("click", (e) => {
        if (e.target.classList.contains("close") || e.target.id === "imageModal") {
            console.log("Closing image modal...");
            document.getElementById("imageModal").style.display = "none";
        }
    });
});

