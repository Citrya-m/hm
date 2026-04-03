document.addEventListener('DOMContentLoaded', () => {

    setTimeout(() => { 

        if (typeof LOGS_REF === 'undefined') {
            console.error("Firebase LOGS_REF is not defined after timeout. Check config and network.");
            document.getElementById('year-list').innerHTML = '<p style="text-align: center; color: var(--color-warning);">Error: Configuration not loaded. Check browser console.</p>';
            return;
        }

        const yearListEl = document.getElementById('year-list');
        const monthListEl = document.getElementById('month-list');
        const monthTitleEl = document.getElementById('month-selection-title');
        
        const monthNames = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonthIndex = today.getMonth();
        
        let selectedYear = currentYear;
        let availableYears = [];

        const historyDepth = 3; 
        const futureDepth = 0;  

        const startYear = currentYear - historyDepth;
        const endYear = currentYear + futureDepth;

        for (let y = startYear; y <= endYear; y++) {
            availableYears.push(y);
        }

        // Monster image dimensions (bottom-left corner) - RESPONSIVE
        const getMonsterDimensions = (containerWidth) => {
            // Scale monster based on container width
            if (containerWidth < 600) {
                // Mobile: smaller monster
                return { width: 180, height: 200 };
            } else if (containerWidth < 900) {
                // Tablet: medium monster
                return { width: 250, height: 280 };
            } else {
                // Desktop: full size monster
                return { width: 320, height: 360 };
            }
        };
        
        const MIN_GAP = 5; // Minimum gap between bubbles (just don't touch!)

        // --- Check if bubble overlaps with monster image ---
        function overlapsMonster(x, y, size, containerHeight, monsterWidth, monsterHeight) {
            const bubbleRight = x + size;
            const bubbleBottom = y + size;
            const monsterTop = containerHeight - monsterHeight;
            
            // Rectangle collision: bubble vs monster
            return !(x >= monsterWidth || bubbleRight <= 0 || 
                    y >= containerHeight || bubbleBottom <= monsterTop);
        }

        // --- Check if two bubbles overlap ---
        function bubblesOverlap(x1, y1, size1, x2, y2, size2) {
            const dx = (x1 + size1/2) - (x2 + size2/2);
            const dy = (y1 + size1/2) - (y2 + size2/2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = (size1/2) + (size2/2) + MIN_GAP;
            return distance < minDistance;
        }

        // --- Find a valid random position ---
        function getRandomPosition(existingPositions, containerWidth, containerHeight, bubbleSize, monsterWidth, monsterHeight) {
            const maxAttempts = 500;
            
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                // Random position anywhere in the container
                const x = Math.random() * (containerWidth - bubbleSize);
                const y = Math.random() * (containerHeight - bubbleSize);
                
                // Check if it overlaps with monster
                if (overlapsMonster(x, y, bubbleSize, containerHeight, monsterWidth, monsterHeight)) {
                    continue;
                }
                
                // Check if it overlaps with any existing bubble
                let valid = true;
                for (const pos of existingPositions) {
                    if (bubblesOverlap(x, y, bubbleSize, pos.x, pos.y, pos.size)) {
                        valid = false;
                        break;
                    }
                }
                
                if (valid) {
                    return { x, y };
                }
            }
            
            // Fallback: place at top-right
            return { x: containerWidth - bubbleSize - 20, y: 20 };
        }

        // --- Render Year Selectors ---
        function renderYears() {
            yearListEl.innerHTML = ''; 
            availableYears.forEach(year => {
                const isActive = year === selectedYear;
                const yearDiv = document.createElement('div');
                
                yearDiv.innerHTML = `
                    <button 
                        class="year-button ${isActive ? 'active-year' : ''}" 
                        data-year="${year}"
                        onclick="selectYear(${year})">
                        ${year}
                    </button>
                `;
                yearListEl.appendChild(yearDiv);
            });
        }

        // --- Render Month Bubbles ---
        function renderMonths(year) {
            monthListEl.innerHTML = ''; 
            monthTitleEl.textContent = `Months for ${year}:`;

            let startMonthIndex;
            
            if (year > currentYear) {
                startMonthIndex = currentMonthIndex;
            } else if (year === currentYear) {
                startMonthIndex = currentMonthIndex;
            } else {
                startMonthIndex = 11; 
            }

            const endMonthIndex = 0; 
            
            if (startMonthIndex < 0) {
                monthListEl.innerHTML = '<p style="text-align: center; color: var(--color-text);">No log data expected for this year yet.</p>';
                return;
            }

            // Get container dimensions
            const containerWidth = monthListEl.offsetWidth || 1000;
            const containerHeight = 550;
            
            // Get responsive monster dimensions
            const monsterDimensions = getMonsterDimensions(containerWidth);
            const monsterWidth = monsterDimensions.width;
            const monsterHeight = monsterDimensions.height;
            
            const existingPositions = [];
            const bubbles = [];

            // Create each month bubble
            for (let i = startMonthIndex; i >= endMonthIndex; i--) {
                const monthName = monthNames[i];
                const monthYearKey = `${year}-${String(i + 1).padStart(2, '0')}`; 

                // Random size variation - RESPONSIVE based on container width
                let minSize, maxSize;
                if (containerWidth < 600) {
                    // Mobile: smaller bubbles
                    minSize = 60;
                    maxSize = 80;
                } else if (containerWidth < 900) {
                    // Tablet: medium bubbles
                    minSize = 75;
                    maxSize = 100;
                } else {
                    // Desktop: full size bubbles
                    minSize = 95;
                    maxSize = 125;
                }
                const size = minSize + Math.random() * (maxSize - minSize);
                
                // Get random position that doesn't overlap
                const position = getRandomPosition(existingPositions, containerWidth, containerHeight, size, monsterWidth, monsterHeight);
                existingPositions.push({ x: position.x, y: position.y, size: size });
                
                // Create bubble wrapper
                const bubbleWrapper = document.createElement('div');
                bubbleWrapper.className = 'bubble-wrapper';
                bubbleWrapper.style.left = `${position.x}px`;
                bubbleWrapper.style.top = `${position.y}px`;
                
                // Create the clickable bubble
                const bubble = document.createElement('a');
                bubble.href = `calendar.html?month=${monthYearKey}`;
                bubble.className = 'month-circle';
                bubble.style.width = `${size}px`;
                bubble.style.height = `${size}px`;
                bubble.style.fontSize = `${size /50}rem`;
                bubble.textContent = monthName.toUpperCase();
                
                // Add click handler for pop animation
                bubble.addEventListener('click', function(e) {
                    e.preventDefault();
                    const url = this.href;
                    this.classList.add('bubble-popping');
                    setTimeout(() => {
                        window.location.href = url;
                    }, 500);
                });
                
                bubbleWrapper.appendChild(bubble);
                monthListEl.appendChild(bubbleWrapper);

                // Store bubble data for physics - speed scaled based on container
                const angle = Math.random() * Math.PI * 2;
                const baseSpeed = containerWidth < 600 ? 0.15 : 0.2; // Slower on mobile
                const speed = baseSpeed + Math.random() * 0.2;
                
                bubbles.push({
                    element: bubbleWrapper,
                    x: position.x,
                    y: position.y,
                    size: size,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed
                });
            }

            // Start physics with monster dimensions
            startBubblePhysics(bubbles, containerWidth, containerHeight, monsterWidth, monsterHeight);
        }

        // --- Simple Bubble Physics ---
        function startBubblePhysics(bubbles, containerWidth, containerHeight, monsterWidth, monsterHeight) {
            
            function updateBubbles() {
                for (let i = 0; i < bubbles.length; i++) {
                    const bubble = bubbles[i];
                    
                    // Move bubble
                    bubble.x += bubble.vx;
                    bubble.y += bubble.vy;
                    
                    // Bounce off edges
                    if (bubble.x <= 0 || bubble.x + bubble.size >= containerWidth) {
                        bubble.vx = -bubble.vx;
                        bubble.x = Math.max(0, Math.min(bubble.x, containerWidth - bubble.size));
                    }
                    if (bubble.y <= 0 || bubble.y + bubble.size >= containerHeight) {
                        bubble.vy = -bubble.vy;
                        bubble.y = Math.max(0, Math.min(bubble.y, containerHeight - bubble.size));
                    }
                    
                    // Bounce off monster
                    if (overlapsMonster(bubble.x, bubble.y, bubble.size, containerHeight, monsterWidth, monsterHeight)) {
                        // Push bubble away from monster
                        const monsterCenterX = monsterWidth / 2;
                        const monsterCenterY = containerHeight - monsterHeight / 2;
                        const bubbleCenterX = bubble.x + bubble.size / 2;
                        const bubbleCenterY = bubble.y + bubble.size / 2;
                        
                        // Determine which side to push
                        if (bubbleCenterX < monsterCenterX) {
                            // Push left
                            bubble.x = -10; // Will bounce off left edge
                            bubble.vx = Math.abs(bubble.vx);
                        } else {
                            // Push right
                            bubble.x = monsterWidth + 5;
                            bubble.vx = Math.abs(bubble.vx);
                        }
                        
                        if (bubbleCenterY < monsterCenterY) {
                            // Push up
                            bubble.y = containerHeight - monsterHeight - bubble.size - 5;
                            bubble.vy = -Math.abs(bubble.vy);
                        } else {
                            // Push down
                            bubble.y = containerHeight - monsterHeight + 5;
                            bubble.vy = Math.abs(bubble.vy);
                        }
                    }
                    
                    // Check collision with other bubbles
                    for (let j = 0; j < bubbles.length; j++) {
                        if (i === j) continue;
                        
                        const other = bubbles[j];
                        
                        if (bubblesOverlap(bubble.x, bubble.y, bubble.size, other.x, other.y, other.size)) {
                            // Calculate collision normal
                            const dx = (bubble.x + bubble.size/2) - (other.x + other.size/2);
                            const dy = (bubble.y + bubble.size/2) - (other.y + other.size/2);
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            
                            if (distance > 0) {
                                const nx = dx / distance;
                                const ny = dy / distance;
                                
                                // Separate bubbles
                                const overlap = ((bubble.size/2) + (other.size/2) + MIN_GAP) - distance;
                                bubble.x += nx * overlap * 0.5;
                                bubble.y += ny * overlap * 0.5;
                                other.x -= nx * overlap * 0.5;
                                other.y -= ny * overlap * 0.5;
                                
                                // Bounce velocities
                                const relativeVx = bubble.vx - other.vx;
                                const relativeVy = bubble.vy - other.vy;
                                const impulse = (relativeVx * nx + relativeVy * ny) * 0.8;
                                
                                bubble.vx -= impulse * nx;
                                bubble.vy -= impulse * ny;
                                other.vx += impulse * nx;
                                other.vy += impulse * ny;
                            }
                        }
                    }
                    
                    // Update DOM
                    bubble.element.style.left = `${bubble.x}px`;
                    bubble.element.style.top = `${bubble.y}px`;
                }
                
                requestAnimationFrame(updateBubbles);
            }
            
            requestAnimationFrame(updateBubbles);
        }

        // --- Global Handler for Year Selection ---
        window.selectYear = function(year) {
            if (selectedYear === year) return; 
            selectedYear = year;
            renderYears(); 
            renderMonths(year);
        }

        // --- Initialization ---
        renderYears();
        renderMonths(currentYear);

    }, 200);
});