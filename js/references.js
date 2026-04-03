// /js/references.js (for references.html)
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('referenceForm');
    const resultsCard = document.getElementById('results-card');
    const normalRestingHrEl = document.getElementById('normal-resting-hr');
    const normalTargetHrEl = document.getElementById('normal-target-hr');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        calculateNormalValues();
    });

    document.getElementById('save-profile-btn').addEventListener('click', function() {
        alert("Placeholder: This feature would save user profile data to a database (e.g., Firestore).");
    });


    function calculateNormalValues() {
        const ageInput = document.getElementById('age');
        const age = parseInt(ageInput.value);
        const activity = document.getElementById('activity').value;

        if (isNaN(age) || age <= 0) {
            alert("Please enter a valid age.");
            return;
        }

        // 1. Calculate Maximum Heart Rate (Max HR)
        const maxHR = 220 - age;

        // 2. Resting Heart Rate (RHR) - Based on activity level
        let rhrMin = 60; // Standard low
        let rhrMax = 100; // Standard high

        if (activity === 'athlete') {
            rhrMin = 40; 
            rhrMax = 60; 
        } else if (activity === 'vigorous') {
            rhrMin = 50;
        }

        normalRestingHrEl.textContent = `${rhrMin} - ${rhrMax}`;


        // 3. Target Heart Rate (THR) - Based on Max HR and intensity
        let intensityMin, intensityMax;

        if (activity === 'moderate') {
            intensityMin = 0.50; // 50% Max HR
            intensityMax = 0.70; // 70% Max HR
        } else if (activity === 'vigorous' || activity === 'athlete') {
            intensityMin = 0.70; // 70% Max HR
            intensityMax = 0.85; // 85% Max HR
        } else { // Sedentary/Light
            intensityMin = 0.40; 
            intensityMax = 0.60;
        }

        const targetRangeMin = Math.round(maxHR * intensityMin);
        const targetRangeMax = Math.round(maxHR * intensityMax);

        normalTargetHrEl.textContent = `${targetRangeMin} - ${targetRangeMax}`;

        resultsCard.style.display = 'block';
    }
});