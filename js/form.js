const form = document.getElementById('contact-form');

form.addEventListener('submit', function handleSubmit(event) {
    event.preventDefault();

    // 👇️ Send data to server here

    // 👇️ Reset form here
    form.reset();
});