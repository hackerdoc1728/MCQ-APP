document.addEventListener('DOMContentLoaded', function () {
    // Initialize Swiper
    const swiper = new Swiper('.swiper-container', {
        loop: true, // Enable looping
        pagination: {
            el: '.swiper-pagination', // Pagination element
            clickable: true, // Enable clickability
        },
        navigation: {
            nextEl: '.swiper-button-next', // Next button element
            prevEl: '.swiper-button-prev', // Previous button element
        },
    });
});
