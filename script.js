document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Loaded, starting script setup...'); // Log 1
    // Target Score for winning the game
    const TARGET_SCORE = 100;
    const TIMER_DURATION = 30000; // 30 seconds in milliseconds
    const TIMER_UPDATE_INTERVAL = 100; // How often to update timer visually (ms)
    const MAX_HIGH_SCORES = 6; // Changed to 6
    
    // Define the master sequence of numbers to add
    const MASTER_NUMBER_SEQUENCE = [6, 4, 7, 4, 8, 5, 6, 7, 4, 8, 9, 9, 5, 5, 4, 3, 3, 2, 1]; // Sums to 100
    
    // Game elements
    const num1Element = document.getElementById('num1');
    const num2Element = document.getElementById('num2');
    const num1Box = document.getElementById('num1-box');
    const num2Box = document.getElementById('num2-box');
    const answerBox = document.getElementById('answer-box');
    const operatorElement = document.getElementById('operator');
    const equalsElement = document.getElementById('equals');
    const answerInput = document.getElementById('answer-input');
    const numpadButtons = document.querySelectorAll('.numpad-btn');
    const backspaceButton = document.getElementById('backspace');
    const goButton = document.getElementById('go');
    const celebration = document.getElementById('celebration');
    const playAgainButton = document.getElementById('play-again');
    const equation = document.getElementById('equation');
    const progressFill = document.getElementById('progress-fill');
    const progressIcon = document.getElementById('progress-icon'); // Get the icon span
    const scoreDisplay = document.getElementById('game-score'); // Score element
    const timerBar = document.getElementById('timer-bar'); // Timer bar element
    const timerValueDisplay = document.getElementById('timer-value'); // Timer value circle
    const celebrationScore = document.getElementById('celebration-score'); // Span for final score
    const nameForm = document.getElementById('name-form'); // Name input form
    const playerNameInput = document.getElementById('player-name'); // Name input field
    const saveScoreBtn = document.getElementById('save-score-btn'); // Save button
    const leaderboardDiv = document.getElementById('leaderboard'); // Leaderboard container
    const highScoresList = document.getElementById('high-scores-list'); // Leaderboard UL
    const rankMessage = document.getElementById('rank-message'); // Rank message element
    const resetLeaderboardBtn = document.getElementById('reset-leaderboard-btn'); // Reset button
    const startGameButton = document.getElementById('start-game-button'); // Start button
    // const highScorePopup = document.getElementById('high-score-popup'); // --- REMOVED POPUP REFERENCE ---
    const themeDefaultButton = document.getElementById('theme-default-button'); // New Cat Button
    const themeBatmanButton = document.getElementById('theme-batman-button'); // New Batman Button
    const themeMinecraftButton = document.getElementById('theme-minecraft-button'); // New Minecraft Button
    const themeSpaceButton = document.getElementById('theme-space-button'); // New Space Button
    const progressIconElement = document.getElementById('progress-icon'); // Need this reference
    
    // --- Load Saved Theme --- 
    const savedTheme = localStorage.getItem('mathGameTheme');
    if (savedTheme !== null) { // Check if null, as empty string is valid (default)
        applyTheme(savedTheme);
    }
    // --- End Load Saved Theme ---
    
    // Elements to hide/show
    const problemBox = document.getElementById('problem-box'); 
    const timerContainer = document.querySelector('.timer-container');
    const progressContainer = document.querySelector('.progress-container');
    const numpad = document.querySelector('.numpad');
    const gameScoreDisplay = document.querySelector('.score-display'); // Add game score display
    // Restore elements to toggle list
    const gameElementsToToggle = [problemBox, timerContainer, progressContainer, numpad, gameScoreDisplay]; 
    
    // Game state
    let currentNum1 = 5;
    let currentNum2 = 3;
    let isAnimating = false;
    let gameScore = 0; // Player's score
    let currentTimerValue = 100; // Value for the current timer (0-100)
    let timerInterval = null; // Interval ID for the timer
    let timerStartTime = 0; // When the current timer started
    let scoreQualifiesForSave = false; // Track if current score allows saving
    
    // Array to hold the shuffled sequence for the current game
    let currentGameSequence = [];
    
    // Initial positioning information
    let num1OriginalPosition = 0;
    
    // Initialize the game
    console.log('Calling initGame...'); // Log 2
    initGame();
    
    // Get initial positions after the page has fully loaded
    window.addEventListener('load', () => {
        // Store the original position of num1-box
        const num1Rect = num1Box.getBoundingClientRect();
        const equationRect = equation.getBoundingClientRect();
        num1OriginalPosition = num1Rect.left - equationRect.left;
    });
    
    function initGame() {
        console.log('Inside initGame'); // Log 3
        confetti.reset(); // Reset confetti state
        
        // Prepare the number sequence for this game
        currentGameSequence = [...MASTER_NUMBER_SEQUENCE]; // Copy the master list
        shuffle(currentGameSequence); // Shuffle the copy
        
        // Start the game state by taking the first two numbers from the sequence
        currentNum1 = currentGameSequence.pop() || 0; // Get first number 
        currentNum2 = currentGameSequence.pop() || 0; // Get second number
        
        // Don't display numbers until game starts
        // num1Element.textContent = currentNum1; 
        // num2Element.textContent = currentNum2;
        answerInput.value = '';
        if (answerBox) answerBox.classList.remove('correct-animation', 'shake'); // Remove animation classes
        resetAnimationStates(true);
        celebration.classList.add('hidden');
        rankMessage.classList.add('hidden'); // Hide rank message
        // playerNameInput.value = ''; // Removed line causing error
        
        // Reset score
        gameScore = 0;
        scoreQualifiesForSave = false; // Reset qualification flag
        updateScoreDisplay();
        updateProgressBar(); // Update progress bar for initial currentNum1
        
        // Reset UI elements
        celebration.classList.add('hidden');
        rankMessage.classList.add('hidden');
        // if (highScorePopup) highScorePopup.classList.remove('show'); // --- REMOVED POPUP RESET ---
        
        // Show start button, hide problem box, show other elements
        if(startGameButton) startGameButton.style.display = 'block'; 
        if(problemBox) problemBox.style.display = 'none'; // Hide only problem box
        if (timerContainer) timerContainer.style.display = 'block';
        if (progressContainer) progressContainer.style.display = 'block';
        if (numpad) numpad.style.display = 'flex'; 
        if (gameScoreDisplay) gameScoreDisplay.style.display = 'block';
        
        // Explicitly reset timer visuals instantly
        if (timerBar) {
            timerBar.style.transition = 'none'; 
            timerBar.style.transform = 'scaleX(1)';
        }
        if (timerValueDisplay) {
            timerValueDisplay.style.transition = 'none';
            timerValueDisplay.textContent = 100; // Reset text
            timerValueDisplay.style.right = '0%'; // Reset position
        }
        // Re-enable transitions shortly after
        requestAnimationFrame(() => { // Use rAF for better timing
            if (timerBar) timerBar.style.transition = 'transform 0.1s linear';
            if (timerValueDisplay) timerValueDisplay.style.transition = 'right 0.1s linear';
        });
        
        updateScoreDisplay(); // Reset score display
        progressFill.style.width = '0%';
        if (progressIcon) progressIcon.style.left = '0%';
        answerInput.value = '';
        num1Element.textContent = currentNum1; // Set initial numbers
        num2Element.textContent = currentNum2;
        
        // Ensure Play Again button is in correct state
        playAgainButton.textContent = 'Play Again';
        playAgainButton.removeEventListener('click', handleSaveScoreClick); // Remove potential save listener
        playAgainButton.addEventListener('click', initGame); // Ensure play again listener is attached
        
        resetAnimationStates(true);
        // Timer will start AFTER clicking the Start Button
    }
    
    function updateScoreDisplay() {
        scoreDisplay.textContent = gameScore;
    }
    
    function startTimer() {
        console.log('Inside startTimer'); // Log 4
        clearInterval(timerInterval); // Ensure any previous timer is stopped
        timerInterval = null; // Reset interval ID
        currentTimerValue = 100;
        timerStartTime = Date.now();

        // Check if timer elements exist before using them
        if (!timerBar || !timerValueDisplay) {
            console.error('Timer elements not found!');
            return; // Stop if elements are missing
        }

        timerBar.style.transition = 'transform 0.1s linear'; // Re-enable transition
        timerValueDisplay.style.transition = 'right 0.1s linear';
        timerBar.style.transform = 'scaleX(1)';
        timerValueDisplay.textContent = currentTimerValue;
        timerValueDisplay.style.right = '0%';

        console.log('Setting timer interval...'); // Log 5
        timerInterval = setInterval(() => {
            const elapsedTime = Date.now() - timerStartTime;
            const timeRemaining = Math.max(0, TIMER_DURATION - elapsedTime);
            currentTimerValue = Math.round((timeRemaining / TIMER_DURATION) * 100);
            const percentRemaining = timeRemaining / TIMER_DURATION;

            if (timerBar) timerBar.style.transform = `scaleX(${percentRemaining})`;
            if (timerValueDisplay) {
                timerValueDisplay.textContent = currentTimerValue;
                timerValueDisplay.style.right = `${(1 - percentRemaining) * 100}%`;
            }

            if (timeRemaining <= 0) {
                console.log('Timer expired'); // Log 6
                clearInterval(timerInterval);
                timerInterval = null; // Clear ID when timer expires
                // Optionally handle time out - maybe show shake animation?
            }
        }, TIMER_UPDATE_INTERVAL);
        console.log('Timer interval set with ID:', timerInterval); // Log 7
    }
    
    function resetAnimationStates(isFullReset = false) {
        const elements = [num1Box, num2Box, answerBox, operatorElement, equalsElement];
        elements.forEach(el => {
            el.classList.remove('fade-out', 'fade-in');
            el.style.opacity = '1';
        });
        
        if (isFullReset) {
            answerBox.style.transform = '';
            answerBox.style.transition = '';
        }
    }
    
    // Calculate exact slide distance
    function calculateSlideDistance() {
        const num1Rect = num1Box.getBoundingClientRect();
        const answerRect = answerBox.getBoundingClientRect();
        return num1Rect.left - answerRect.left;
    }
    
    // Function to launch confetti burst (Original Version)
    function launchConfetti() {
        const isBatmanTheme = document.documentElement.className === 'theme-batman';
        const shapes = ['square', 'circle']; // Use standard shapes
        const colors = isBatmanTheme 
            ? ['#FFD700', '#fdd835', '#000000', '#546e7a'] // Batman theme colors
            : ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722']; // Default rainbow
        const scalar = 1.0; 

        confetti({
            particleCount: 200, 
            spread: 100,      
            origin: { y: 0.6 }, 
            gravity: 0.8,      
            ticks: 300,        
            colors: colors,
            shapes: shapes,
            scalar: scalar
        });
    }
    
    // Function to launch enhanced confetti for high scores
    function launchEnhancedConfetti() {
        const isBatmanTheme = document.documentElement.className === 'theme-batman';
        const shapes = ['square', 'circle']; // Use standard shapes
        const colors = isBatmanTheme 
            ? ['#FFD700', '#fdd835', '#000000', '#546e7a'] // Yellows, Black, Grey
            : ['#FFD700', '#FFFF00', '#FFA500', '#FFFFFF']; // Original Golds
        const particleCount = 400; 
        const scalar = 1.3; 

        confetti({
            particleCount: particleCount,
            spread: 180,      
            origin: { y: 0.5 }, 
            gravity: 0.6,      
            ticks: 500,       
            colors: colors,
            shapes: shapes,
            scalar: scalar, 
            zIndex: 101 
        });
    }
    
    // Function to update the progress bar
    function updateProgressBar() {
        const numForProgress = Math.max(0, currentNum1 || 0); 
        const progressPercent = Math.min(100, (numForProgress / TARGET_SCORE) * 100);
        progressFill.style.width = `${progressPercent}%`;
        
        if (progressIcon) {
            const iconPercent = Math.min(100, progressPercent);
            progressIcon.style.left = `${iconPercent}%`;
        }
    }
    
    // Handle numpad clicks
    numpadButtons.forEach(button => {
        button.addEventListener('click', () => {
            console.log(`Numpad ${button.textContent} clicked, isAnimating: ${isAnimating}`); // Log 16
            if (isAnimating) return;
            // Allow up to 3 digits
            if (answerInput.value.length < 3) {
                answerInput.value += button.textContent;
            }
        });
    });
    
    // Handle backspace button
    backspaceButton.addEventListener('click', () => {
        if (isAnimating) return;
        answerInput.value = answerInput.value.slice(0, -1);
    });
    
    // Handle go button
    goButton.addEventListener('click', () => {
        console.log(`Go button clicked, isAnimating: ${isAnimating}`); // Log 17
        checkAnswer();
    });
    
    function checkAnswer() {
        console.log('Inside checkAnswer'); // Log 8
        if (isAnimating || answerInput.value === '') {
             console.log(`checkAnswer blocked: isAnimating=${isAnimating}, answerInput.value=${answerInput.value}`); // Log 8a
             return;
        }
        
        isAnimating = true; // Set animating flag
        console.log('Set isAnimating = true'); // Log 9
        
        const userAnswer = parseInt(answerInput.value);
        const correctAnswer = currentNum1 + currentNum2;
        
        if (userAnswer === correctAnswer) {
            // --- Correct Answer --- 
            const answerValue = userAnswer;
            isAnimating = true; // BLOCK input during animation
            
            // Stop the current timer immediately
            clearInterval(timerInterval);
            timerInterval = null;
            
            // Score calculation
            gameScore += currentTimerValue; 
            updateScoreDisplay();

            // Make timer static during animation
            timerBar.style.transition = 'none'; 
            timerValueDisplay.style.transition = 'none'; 

            answerBox.classList.add('correct-animation');

            // Check win condition 
            if (correctAnswer >= TARGET_SCORE) {
                clearInterval(timerInterval); // Stop timer first
                // Hide game elements before showing celebration
                gameElementsToToggle.forEach(el => {
                    if (el) el.style.display = 'none';
                });
                
                setTimeout(() => {
                    // answerBox.classList.remove('correct-animation'); // Not needed if hiding
                    celebration.classList.remove('hidden'); 
                    isAnimating = false; // Allow interaction with celebration screen
                    
                    // Determine qualification (original position)
                    const scores = loadScores();
                    const lowestScore = scores.length < MAX_HIGH_SCORES ? -1 : scores[scores.length - 1].score;
                    scoreQualifiesForSave = gameScore > lowestScore; // Set flag
                    
                    // --- Conditionally launch confetti --- 
                    if (scoreQualifiesForSave) {
                        console.log("High score detected! Launching ENHANCED confetti."); 
                        // Launch enhanced confetti immediately and repeatedly 
                        // (It will adapt based on the theme internally)
                        launchEnhancedConfetti(); 
                        setTimeout(launchEnhancedConfetti, 200); 
                        setTimeout(launchEnhancedConfetti, 400); 
                    } else {
                        // Launch standard confetti for regular win - SINGLE BURST
                        launchConfetti(); 
                        // setTimeout(launchConfetti, 300);
                        // setTimeout(launchConfetti, 750);
                    }
                    // --- End Confetti Logic --- 

                    currentNum1 = TARGET_SCORE;
                    updateProgressBar();
                    celebrationScore.textContent = 'Your Score: ' + gameScore;

                    // Display board/input
                    displayLeaderboard(scoreQualifiesForSave ? gameScore : null); 

                    // Configure the main button based on qualification
                    if (scoreQualifiesForSave) {
                        playAgainButton.textContent = 'Save Score';
                        playAgainButton.removeEventListener('click', initGame); // Remove default listener
                        playAgainButton.addEventListener('click', handleSaveScoreClick); // Add save listener
                    } else {
                        playAgainButton.textContent = 'Play Again';
                        playAgainButton.removeEventListener('click', handleSaveScoreClick); // Ensure no save listener
                        playAgainButton.addEventListener('click', initGame); // Ensure play again listener
                        
                        if (scores.length >= MAX_HIGH_SCORES) {
                             rankMessage.textContent = `Score needed: ${lowestScore + 1}`;
                             rankMessage.classList.remove('hidden');
                        } else {
                            rankMessage.classList.add('hidden');
                        }
                    }

                }, 600);
                return; // Exit checkAnswer, game ends here until Play Again
            }

            // --- REGULAR Correct Answer Animation Sequence ---
            setTimeout(() => {
                // Fade out
                num1Box.classList.add('fade-out');
                operatorElement.classList.add('fade-out');
                num2Box.classList.add('fade-out');
                equalsElement.classList.add('fade-out');
                answerBox.classList.remove('correct-animation');

                setTimeout(() => {
                    // Slide
                    answerInput.value = answerValue;
                    const slideDistance = calculateSlideDistance();
                    answerBox.style.transition = 'transform 0.8s ease-in-out';
                    answerBox.style.transform = `translateX(${slideDistance}px)`;
                    answerBox.style.opacity = '1';

                    setTimeout(() => {
                        // Prepare next problem state (internal)
                        currentNum1 = correctAnswer;
                        currentNum2 = currentGameSequence.pop();
                        
                        // Safety check: What if the sequence runs out before hitting target?
                        if (currentNum2 === undefined) {
                            console.error("Sequence ran out unexpectedly!");
                            // Handle this scenario - maybe end the game or use a default?
                            // For now, let's just stop to avoid errors, but ideally end game.
                            isAnimating = false;
                            // Maybe force the celebration screen? 
                            // celebrationScore.textContent = 'Error: Seq. End'; 
                            // celebration.classList.remove('hidden');
                            return; 
                        }
                        
                        num2Element.textContent = currentNum2; // Update hidden num2 box content
                        num1Element.textContent = ''; // Clear num1 box for repurposing
                        
                        // Prepare visuals for fade-in
                        num1Box.style.opacity = '0'; 
                        num1Box.classList.remove('fade-out');
                        operatorElement.classList.remove('fade-out');
                        num2Box.classList.remove('fade-out');
                        equalsElement.style.opacity = '0';

                        setTimeout(() => {
                            // Fade in new elements
                            operatorElement.classList.add('fade-in');
                            num2Box.classList.add('fade-in');
                            equalsElement.classList.add('fade-in');
                            num1Box.classList.add('fade-in'); // Fading in repurposed num1Box

                            setTimeout(() => {
                                // Final cleanup & State Reset
                                num1Element.textContent = currentNum1; // Officially set number
                                answerBox.style.transform = ''; // Reset slid box
                                answerBox.style.transition = '';
                                answerInput.value = ''; // Clear input in original answer box
                                
                                // Reset visual states fully
                                resetAnimationStates(true); // Use full reset
                                
                                updateProgressBar(); // Update progress bar *after* state is final
                                
                                // *** Crucial: Reset isAnimating and start next timer ***
                                isAnimating = false; 
                                startTimer(); 

                            }, 500); // Fade-in duration
                        }, 50); // Short delay before fade-in
                    }, 800); // Slide duration
                }, 400); // Fade-out duration
            }, 600); // Delay after correct flash

        } else {
            // --- Incorrect Answer --- (Timer continues)
            answerBox.classList.add('shake');
            setTimeout(() => {
                answerBox.classList.remove('shake');
                answerInput.value = '';
                isAnimating = false;
            }, 500);
        }
    }
    
    // Add keyboard support
    document.addEventListener('keydown', (e) => {
        if (isAnimating) return;
        
        const key = e.key;
        
        // Allow up to 3 digits
        if (/^[0-9]$/.test(key) && answerInput.value.length < 3) {
            answerInput.value += key;
        } 
        // Handle backspace
        else if (key === 'Backspace') {
            answerInput.value = answerInput.value.slice(0, -1);
        } 
        // Handle enter (same as Go button)
        else if (key === 'Enter') {
            checkAnswer();
        }
    });
    
    // --- Theme Selector Logic (Simplified) ---
    
    function applyTheme(themeClass) {
        console.log(`Applying theme: ${themeClass || 'default'}`);
        document.documentElement.className = themeClass;
        localStorage.setItem('mathGameTheme', themeClass); // Save theme
        
        // Update progress icon src based on theme
        requestAnimationFrame(() => { // Use rAF to ensure styles are applied
            const computedStyle = getComputedStyle(document.documentElement);
            const newIconSrc = computedStyle.getPropertyValue('--progress-icon-src').trim().slice(4, -1).replace(/"/g, ''); // Extract URL, remove quotes
            if (progressIconElement && progressIconElement.src !== newIconSrc) {
               console.log(`Updating icon src to: ${newIconSrc}`);
               progressIconElement.src = newIconSrc;
            }
        });
    }

    if (themeDefaultButton) {
        themeDefaultButton.addEventListener('click', () => {
            applyTheme(themeDefaultButton.getAttribute('data-theme'));
        });
    }
    if (themeBatmanButton) {
        themeBatmanButton.addEventListener('click', () => {
            applyTheme(themeBatmanButton.getAttribute('data-theme'));
        });
    }
    if (themeMinecraftButton) {
        themeMinecraftButton.addEventListener('click', () => {
            applyTheme(themeMinecraftButton.getAttribute('data-theme'));
        });
    }
    if (themeSpaceButton) {
        themeSpaceButton.addEventListener('click', () => {
            applyTheme(themeSpaceButton.getAttribute('data-theme'));
        });
    }
    
    // --- End Theme Selector Logic ---

    // Function to shuffle an array (Fisher-Yates Algorithm)
    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
    }

    // --- Start Button Listener ---
    if (startGameButton) {
        startGameButton.addEventListener('click', () => {
            console.log('Start game button clicked');
            // Hide Start Button
            startGameButton.style.display = 'none';
            
            // Clear answer input just in case
            answerInput.value = '';
            
            // Show ONLY the Problem Box
            gameElementsToToggle.forEach(el => {
                if (el === problemBox) {
                    el.style.display = 'flex'; // problem-box uses flex
                } 
                /* // Other elements are already visible
                 else if (el === numpad) {
                    el.style.display = 'flex'; 
                } else {
                    el.style.display = 'block'; 
                } */
            });
            
            // Display the first problem numbers
            num1Element.textContent = currentNum1;
            num2Element.textContent = currentNum2;
            
            // Start the timer
            startTimer();
        });
    }

    // --- Leaderboard Functions ---

    // Add listener for the reset button
    if (resetLeaderboardBtn) { // Check if button exists
        resetLeaderboardBtn.addEventListener('click', () => {
            // Show confirmation dialog
            const wantsToReset = confirm('Are you sure you want to reset the leaderboard? This cannot be undone.');
            
            if (wantsToReset) {
                // Clear scores from local storage
                localStorage.removeItem('mathGameHighScores'); 
                // Refresh the display
                displayLeaderboard(); 
                // Optional: Hide rank message if it was shown due to full leaderboard
                rankMessage.classList.add('hidden');
                // Optional: Hide the reset button itself if the leaderboard is now empty
                // checkAndToggleResetButtonVisibility(); // We might add this later if needed
                console.log('Leaderboard reset.');
            }
        });
    }

    function loadScores() {
        const scoresJSON = localStorage.getItem('mathGameHighScores');
        let scores = scoresJSON ? JSON.parse(scoresJSON) : [];

        // If no scores found, populate with defaults
        if (scores.length === 0) {
            console.log("No scores found, populating with defaults.");
            scores = [
                { name: "Joker", score: 1600 },    // Base score
                { name: "Penguin", score: 1400 },  // -200
                { name: "Riddler", score: 1200 },  // -200
                { name: "Catwoman", score: 1000 },  // -200
                { name: "Mr. Freeze", score: 800 },   // -200
                { name: "King Tut", score: 600 }    // -200
            ];
            // Optional: Save these defaults back to local storage?
            // localStorage.setItem('mathGameHighScores', JSON.stringify(scores)); 
        }
        
        return scores; // Return either loaded or default scores
    }

    function saveScore(name, score) {
        const scores = loadScores();
        const newScore = { name, score };
        scores.push(newScore);
        scores.sort((a, b) => b.score - a.score);
        scores.splice(MAX_HIGH_SCORES);
        localStorage.setItem('mathGameHighScores', JSON.stringify(scores));
    }
    
    // Updated displayLeaderboard: Only inserts input field, no button
    function displayLeaderboard(scoreToEnter = null) {
        const scores = loadScores();
        highScoresList.innerHTML = ''; 
        let inputPlaced = false;
        let scoreIndex = 0; 

        for (let rank = 1; rank <= MAX_HIGH_SCORES; rank++) {
            const li = document.createElement('li');
            let shouldPlaceInput = false;

            if (scoreToEnter !== null && !inputPlaced) {
                const currentScoreData = scores[scoreIndex];
                if (!currentScoreData || scoreToEnter >= currentScoreData.score) {
                    shouldPlaceInput = true;
                }
            }

            if (shouldPlaceInput) {
                // Render LI with the input field again
                li.innerHTML = `
                    ${rank}. <input type="text" class="inline-name-input" placeholder="Your Name" maxlength="25" required>
                    <span class="score">${scoreToEnter}</span>
                `;
                inputPlaced = true;
                // Restore focus logic
                const inputField = li.querySelector('.inline-name-input'); 
                setTimeout(() => inputField?.focus(), 0); // Optional chaining for safety
            } else {
                // Display existing score or placeholder
                const scoreData = scores[scoreIndex];
                if (scoreData) {
                    li.innerHTML = `${rank}. ${scoreData.name} <span class="score">${scoreData.score}</span>`;
                    scoreIndex++; 
                } else {
                    li.innerHTML = `${rank}. --- <span class="score">---</span>`;
                }
            }
            highScoresList.appendChild(li);
        }
    }
    // --- End Leaderboard Functions ---

    // Function to handle saving score via main button
    function handleSaveScoreClick() {
        console.log("handleSaveScoreClick triggered");
        const inputField = highScoresList.querySelector('.inline-name-input');
        if (!inputField) {
            console.error("Could not find inline name input field!");
            playAgainButton.textContent = 'Play Again';
            playAgainButton.removeEventListener('click', handleSaveScoreClick);
            playAgainButton.addEventListener('click', initGame);
            return;
        }
        
        const playerName = inputField.value.trim();
        if (playerName) {
            saveScore(playerName, gameScore); 
            
            displayLeaderboard(); 
            playAgainButton.textContent = 'Play Again';
            playAgainButton.removeEventListener('click', handleSaveScoreClick);
            playAgainButton.addEventListener('click', initGame); 
            scoreQualifiesForSave = false; 

        } else {
            inputField.focus(); 
        }
    }

    console.log('Script setup finished, event listeners added.'); // Log 18
}); 