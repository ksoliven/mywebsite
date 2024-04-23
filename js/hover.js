document.addEventListener('DOMContentLoaded', function () {
    var socialLinks = document.querySelectorAll('.social-link');
    socialLinks.forEach(function (link) {
        link.addEventListener('click', function (event) {
            // Remove focus from the link to clear any hover effects
            link.blur();

            // Prevent the default link behavior to avoid the browser navigating away
            event.preventDefault();

            // Navigate to the link after a short delay
            setTimeout(function () {
                window.open(link.href, '_blank');
            }, 100); // Adjust the delay (in milliseconds) as needed
        });
    });
});