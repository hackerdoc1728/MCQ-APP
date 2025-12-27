// public/assets/js/utils.js

export function showElement(element) {
    if (element) {
        element.classList.remove('d-none'); // Show the element by removing 'd-none'
    } else {
        console.error('showElement: Element is null or undefined');
    }
}

export function hideElement(element) {
    if (element) {
        element.classList.add('d-none'); // Hide the element by adding 'd-none'
    } else {
        console.error('hideElement: Element is null or undefined');
    }
}
