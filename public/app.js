/**
 * Loads and injects the navigation bar (dummy)
 */
function loadNavbar() {
    const navbarContainer = document.getElementById('navbar-container');
    if (navbarContainer) {
        navbarContainer.innerHTML = `
        <nav style="margin-bottom:20px;">
            <a href="index.html">Monitor</a> |
            <a href="#">History</a> |
            <a href="#">Settings</a>
        </nav>`;
    }
}


import { db } from "./firebase.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

// Reference to /current node in Realtime Database
const currentRef = ref(db, "current");

// Listen for live updates
onValue(currentRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    document.getElementById("bpmDisplay").innerText = data.bpm ?? 0;
    document.getElementById("spo2Display").innerText = data.spo2 ?? 0;

    const bpm = data.bpm ?? 75;
    const heart = document.getElementById("heartIcon");
    heart.style.animationDuration = `${60 / bpm}s`;
});

/**
 * Cute click animation for cards
 */
function addCuteClickInteraction() {
    document.addEventListener('click', (e) => {
        const target = e.target.closest('.card');
        if (target) {
            target.style.transform = 'scale(0.98)';
            setTimeout(() => {
                target.style.transform = '';
            }, 100);
        }
    });
}

// Run shared functions
document.addEventListener('DOMContentLoaded', () => {
    loadNavbar(); 
    addCuteClickInteraction();
});
