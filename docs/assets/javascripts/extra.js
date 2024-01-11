document.addEventListener('DOMContentLoaded', function () {
    var toggleButton = document.querySelector('.md-header__button.md-icon[title="Switch to dark mode"]');
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        toggleButton.style.display = 'none';
    }
});
