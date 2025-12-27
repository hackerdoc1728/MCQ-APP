document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.newsletter-form');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const emailInput = form.querySelector('input[type="email"]');
        const csrfTokenInput = form.querySelector('input[name="csrfToken"]');
        const email = emailInput.value;
        const csrfToken = csrfTokenInput.value;

        try {
            const response = await fetch('/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken
                },
                body: JSON.stringify({ email, csrfToken })
            });

            if (response.ok) {
                const result = await response.text();
                alert(result);
                form.reset();
            } else {
                const error = await response.text();
                alert(`Error: ${error}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An unexpected error occurred. Please try again later.');
        }
    });
});
