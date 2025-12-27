document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.cs-form');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const nameInput = form.querySelector('input[name="name"]');
        const emailInput = form.querySelector('input[name="email"]');
        const phoneInput = form.querySelector('input[name="phone"]');
        const messageInput = form.querySelector('textarea[name="Message"]');
        const csrfTokenInput = form.querySelector('input[name="csrfToken"]');

        const name = nameInput.value;
        const email = emailInput.value;
        const phone = phoneInput.value;
        const message = messageInput.value;
        const csrfToken = csrfTokenInput.value;

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken
                },
                body: JSON.stringify({ name, email, phone, message, csrfToken })
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
