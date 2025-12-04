/**
 * Loads and injects the common navigation bar and sets the active tab.
 */
function loadNavbar() {
    const navbarContainer = document.getElementById('navbar-container');
    if (navbarContainer) {
        // Fetch the HTML content from the components folder
        fetch('components/navbar.html')
            .then(response => response.text())
            .then(data => {
                navbarContainer.innerHTML = data;
                
                // Highlight the active tab
                const path = window.location.pathname.split('/').pop();
                const activeBtn = navbarContainer.querySelector(`[href="${path}"]`);
                if (activeBtn) {
                    activeBtn.classList.add('active');
                }
            });
    }
}

/**
 * Adds a cute "pop" animation to elements when clicked (UI interaction).
 */
function addCuteClickInteraction() {
    document.addEventListener('click', (e) => {
        // Apply the effect to cards, bubbles, and calendar days
        const target = e.target.closest('.card, .month-bubble, .cal-day');
        if (target) {
            target.style.transform = 'scale(0.98)';
            setTimeout(() => {
                target.style.transform = ''; // Clear to allow CSS styles/hover to take over
            }, 100);
        }
    });
}

// --- RUNNING THE SHARED FUNCTIONS WHEN THE PAGE IS READY ---
document.addEventListener('DOMContentLoaded', () => {
    loadNavbar(); 
    addCuteClickInteraction();
});

// Dummy Firebase exports (will be filled in the next step)
export const db = {};