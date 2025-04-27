document.addEventListener('DOMContentLoaded', () => {
    const player = document.getElementById('player');
    const scoreElement = document.getElementById('score');
    const startButton = document.getElementById('start-btn');
    const leftButton = document.getElementById('left-btn');
    const rightButton = document.getElementById('right-btn');
    const gameArea = document.querySelector('.game-area');
    
    // טיפול בחלון הוראות
    const instructionsBtn = document.getElementById('instructions-btn');
    const instructionsOverlay = document.getElementById('instructions-overlay');
    const closeInstructionsBtn = document.getElementById('close-instructions');
    
    // פתיחת חלון הוראות
    instructionsBtn.addEventListener('click', () => {
        instructionsOverlay.style.display = 'flex';
        if (gameStarted) {
            // אם המשחק כבר התחיל, נעצור אותו זמנית
            pauseGame();
        }
    });
    
    // סגירת חלון הוראות
    closeInstructionsBtn.addEventListener('click', () => {
        instructionsOverlay.style.display = 'none';
        if (gameStarted && isPaused) {
            // אם המשחק היה פעיל לפני כן, נחזור אליו
            resumeGame();
        }
    });
    
    // סגירת חלון הוראות בלחיצה מחוץ לתיבת ההוראות
    instructionsOverlay.addEventListener('click', (e) => {
        if (e.target === instructionsOverlay) {
            instructionsOverlay.style.display = 'none';
            if (gameStarted && isPaused) {
                resumeGame();
            }
        }
    });
    
    // בניית מכונית השחקן
    createPlayerCar();
    
    // יצירת מדד חיים
    const livesDisplay = document.createElement('div');
    livesDisplay.classList.add('lives-display');
    gameArea.appendChild(livesDisplay);
    
    // יצירת מדד מהירות
    const speedMeter = document.createElement('div');
    speedMeter.classList.add('speed-meter');
    speedMeter.innerHTML = `
        <div>מהירות</div>
        <div class="speed-bar">
            <div class="speed-fill"></div>
        </div>
    `;
    gameArea.appendChild(speedMeter);
    const speedFill = speedMeter.querySelector('.speed-fill');
    
    function createPlayerCar() {
        // ניקוי אלמנטים קודמים
        player.innerHTML = '';
        
        // מרכב המכונית
        const carBody = document.createElement('div');
        carBody.classList.add('car-body');
        player.appendChild(carBody);
        
        // שמשה קדמית
        const windshield = document.createElement('div');
        windshield.classList.add('car-windshield');
        player.appendChild(windshield);
        
        // גג המכונית
        const carTop = document.createElement('div');
        carTop.classList.add('car-top');
        player.appendChild(carTop);
        
        // פנסים קדמיים
        const headlightLeft = document.createElement('div');
        headlightLeft.classList.add('car-headlight', 'left');
        player.appendChild(headlightLeft);
        
        const headlightRight = document.createElement('div');
        headlightRight.classList.add('car-headlight', 'right');
        player.appendChild(headlightRight);
        
        // גלגלים
        const wheelPositions = ['front-left', 'front-right', 'back-left', 'back-right'];
        wheelPositions.forEach(position => {
            const wheel = document.createElement('div');
            wheel.classList.add('car-wheel', position);
            player.appendChild(wheel);
        });
        
        // גריל קדמי
        const grill = document.createElement('div');
        grill.classList.add('car-grill');
        player.appendChild(grill);
        
        // פגוש
        const bumper = document.createElement('div');
        bumper.classList.add('car-bumper');
        player.appendChild(bumper);
    }
    
    let gameStarted = false;
    let isPaused = false;
    let score = 0;
    let lives = 3;
    let animationId;
    let speed = 5;
    let maxSpeed = 15;
    let baseSpeed = 5;
    let boostActive = false;
    let boostTimeout = null;
    let lastTimestamp = 0;
    
    // הגדרת נתיבים
    const lanes = [12.5, 37.5, 62.5, 87.5]; // מיקום באחוזים של 4 נתיבים
    let currentLane = 2; // נתיב התחלתי (מתוך 0-3)
    
    const playerWidth = 60; // רוחב השחקן בפיקסלים
    let gameAreaWidth = window.innerWidth; // רוחב אזור המשחק
    const obstacleFrequency = 1500; // תדירות יצירת מכשולים במילישניות
    let lastObstacleTime = 0;
    let obstacles = [];
    
    // רשימות אלמנטים נוספים בנתיבים
    let coins = [];
    let puddles = [];
    let boosts = [];
    let lifes = [];
    let oilSpills = [];
    let signs = [];
    
    // תדירויות יצירת אלמנטים
    const coinFrequency = 3000; // כל 3 שניות
    const puddleFrequency = 7000; // כל 7 שניות
    const boostFrequency = 12000; // כל 12 שניות
    const lifeFrequency = 20000; // כל 20 שניות
    const oilSpillFrequency = 9000; // כל 9 שניות
    const signFrequency = 15000; // כל 15 שניות
    
    // זמני יצירה אחרונים
    let lastCoinTime = 0;
    let lastPuddleTime = 0;
    let lastBoostTime = 0;
    let lastLifeTime = 0;
    let lastOilSpillTime = 0;
    let lastSignTime = 0;
    
    // עדכון גודל אזור המשחק בעת שינוי גודל חלון
    window.addEventListener('resize', () => {
        gameAreaWidth = window.innerWidth;
        updatePlayerPosition();
    });
    
    // יצירת הודעת סיום משחק
    const gameOverElement = document.createElement('div');
    gameOverElement.classList.add('game-over');
    gameOverElement.textContent = 'המשחק נגמר! לחץ על התחל כדי לשחק שוב';
    gameArea.appendChild(gameOverElement);
    
    // אירועי מקלדת
    document.addEventListener('keydown', handleKeyDown);

    // אירועי לחיצה על כפתורים
    startButton.addEventListener('click', toggleGame);
    leftButton.addEventListener('mousedown', () => movePlayer('left'));
    rightButton.addEventListener('mousedown', () => movePlayer('right'));
    
    // תמיכה מתמשכת בלחיצה על כפתורים
    leftButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        movePlayer('left');
    });
    rightButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        movePlayer('right');
    });
    
    // טיפול במקש Escape להשהיית המשחק
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (gameStarted) {
                if (isPaused) {
                    resumeGame();
                } else {
                    pauseGame();
                }
            }
        }
    });
    
    // לוודא שהכפתורים נראים וניתן להשתמש בהם
    function checkButtonsVisibility() {
        // בדיקה אם הכפתורים מחוץ למסך
        const controlsRect = document.querySelector('.controls').getBoundingClientRect();
        if (controlsRect.bottom > window.innerHeight || controlsRect.top < 0) {
            // אם הכפתורים מחוץ למסך, נתקן את הגובה
            document.querySelector('.game-content').style.height = 
                `calc(100vh - ${document.querySelector('.score').offsetHeight}px - ${document.querySelector('.controls').offsetHeight}px)`;
        }
    }
    
    // בדיקת נראות כפתורים בטעינה ובשינוי גודל חלון
    window.addEventListener('load', checkButtonsVisibility);
    window.addEventListener('resize', checkButtonsVisibility);

    // עדכון מדד חיים
    function updateLivesDisplay() {
        livesDisplay.innerHTML = '';
        for (let i = 0; i < lives; i++) {
            const lifeIcon = document.createElement('div');
            lifeIcon.classList.add('life-icon');
            livesDisplay.appendChild(lifeIcon);
        }
    }
    
    // עדכון מדד מהירות
    function updateSpeedDisplay() {
        const speedPercentage = ((speed - baseSpeed) / (maxSpeed - baseSpeed)) * 100;
        speedFill.style.width = `${speedPercentage}%`;
    }

    function toggleGame() {
        if (gameStarted) {
            endGame();
        } else {
            startGame();
        }
    }

    function startGame() {
        resetGame();
        gameStarted = true;
        isPaused = false;
        startButton.textContent = 'הפסק משחק';
        updateLivesDisplay();
        lastTimestamp = performance.now();
        requestAnimationFrame(updateGame);
    }

    function endGame() {
        gameStarted = false;
        isPaused = false;
        startButton.textContent = 'התחל משחק';
        cancelAnimationFrame(animationId);
        
        // ניקוי הגברות פעילות
        if (boostTimeout) {
            clearTimeout(boostTimeout);
            boostTimeout = null;
        }
        boostActive = false;
    }

    function resetGame() {
        // ניקוי מכשולים
        obstacles.forEach(obstacle => {
            if (obstacle.element && obstacle.element.parentNode) {
                obstacle.element.parentNode.removeChild(obstacle.element);
            }
        });
        
        // ניקוי אלמנטים מעניינים
        clearAllItems();
        
        obstacles = [];
        score = 0;
        lives = 3;
        scoreElement.textContent = '0';
        currentLane = 2; // החזרת השחקן לנתיב האמצעי
        updatePlayerPosition();
        gameOverElement.style.display = 'none';
        speed = baseSpeed;
        updateSpeedDisplay();
        lastObstacleTime = 0;
        boostActive = false;
        
        // איפוס זמני יצירת אלמנטים
        lastCoinTime = 0;
        lastPuddleTime = 0;
        lastBoostTime = 0;
        lastLifeTime = 0;
        lastOilSpillTime = 0;
        lastSignTime = 0;
        
        // עדכון תצוגת חיים
        updateLivesDisplay();
    }
    
    // ניקוי כל האלמנטים המעניינים
    function clearAllItems() {
        const allItems = [...coins, ...puddles, ...boosts, ...lifes, ...oilSpills, ...signs];
        allItems.forEach(item => {
            if (item.element && item.element.parentNode) {
                item.element.parentNode.removeChild(item.element);
            }
        });
        
        coins = [];
        puddles = [];
        boosts = [];
        lifes = [];
        oilSpills = [];
        signs = [];
    }

    function updatePlayerPosition() {
        const lanePosition = lanes[currentLane];
        player.style.left = `calc(${lanePosition}% - ${playerWidth/2}px)`;
    }

    function handleKeyDown(e) {
        if (!gameStarted || isPaused) return;
        
        if (e.key === 'ArrowLeft') {
            movePlayer('left');
        } else if (e.key === 'ArrowRight') {
            movePlayer('right');
        }
    }

    function movePlayer(direction) {
        if (!gameStarted || isPaused) return;
        
        if (direction === 'left' && currentLane > 0) {
            currentLane--;
        } else if (direction === 'right' && currentLane < lanes.length - 1) {
            currentLane++;
        }
        
        updatePlayerPosition();
    }
    
    // פונקציות ליצירת אלמנטים מעניינים
    function createCoin() {
        const lane = Math.floor(Math.random() * lanes.length);
        const lanePosition = lanes[lane];
        
        const coin = document.createElement('div');
        coin.classList.add('coin');
        coin.style.left = `calc(${lanePosition}% - 15px)`;
        coin.style.top = '-30px';
        
        gameArea.appendChild(coin);
        
        coins.push({
            element: coin,
            lane: lane,
            top: -30,
            width: 30,
            height: 30
        });
    }
    
    function createPuddle() {
        const lane = Math.floor(Math.random() * lanes.length);
        const lanePosition = lanes[lane];
        
        const puddle = document.createElement('div');
        puddle.classList.add('puddle');
        puddle.style.left = `calc(${lanePosition}% - 35px)`;
        puddle.style.top = '-20px';
        
        gameArea.appendChild(puddle);
        
        puddles.push({
            element: puddle,
            lane: lane,
            top: -20,
            width: 70,
            height: 20
        });
    }
    
    function createBoost() {
        const lane = Math.floor(Math.random() * lanes.length);
        const lanePosition = lanes[lane];
        
        const boost = document.createElement('div');
        boost.classList.add('boost');
        boost.style.left = `calc(${lanePosition}% - 20px)`;
        boost.style.top = '-40px';
        
        gameArea.appendChild(boost);
        
        boosts.push({
            element: boost,
            lane: lane,
            top: -40,
            width: 40,
            height: 40
        });
    }
    
    function createLife() {
        const lane = Math.floor(Math.random() * lanes.length);
        const lanePosition = lanes[lane];
        
        const life = document.createElement('div');
        life.classList.add('life');
        life.style.left = `calc(${lanePosition}% - 15px)`;
        life.style.top = '-30px';
        
        gameArea.appendChild(life);
        
        lifes.push({
            element: life,
            lane: lane,
            top: -30,
            width: 30,
            height: 30
        });
    }
    
    function createOilSpill() {
        const lane = Math.floor(Math.random() * lanes.length);
        const lanePosition = lanes[lane];
        
        const oilSpill = document.createElement('div');
        oilSpill.classList.add('oil-spill');
        oilSpill.style.left = `calc(${lanePosition}% - 40px)`;
        oilSpill.style.top = '-30px';
        
        gameArea.appendChild(oilSpill);
        
        oilSpills.push({
            element: oilSpill,
            lane: lane,
            top: -30,
            width: 80,
            height: 30
        });
    }
    
    function createRoadsideSign() {
        // בחירת צד אקראי של הכביש
        const side = Math.random() > 0.5 ? 'right' : 'left';
        const position = side === 'right' ? 95 : 5;
        
        const sign = document.createElement('div');
        sign.classList.add('roadside-sign');
        sign.style.left = `${position}%`;
        sign.style.top = '-60px';
        
        gameArea.appendChild(sign);
        
        signs.push({
            element: sign,
            side: side,
            top: -60,
            width: 15,
            height: 60
        });
    }
    
    // אפקט האצה למכונית השחקן
    function activateBoost() {
        if (boostTimeout) {
            clearTimeout(boostTimeout);
        }
        
        boostActive = true;
        speed = maxSpeed;
        updateSpeedDisplay();
        
        // כעבור 5 שניות הדחף נעלם
        boostTimeout = setTimeout(() => {
            boostActive = false;
            speed = Math.min(speed, maxSpeed * 0.66); // חזרה למהירות נמוכה יותר
            updateSpeedDisplay();
            boostTimeout = null;
        }, 5000);
    }
    
    // אפקט החלקה על שלולית שמן
    function activateOilSlip() {
        // עבור באופן אקראי לנתיב אחר
        const randomLane = Math.floor(Math.random() * lanes.length);
        if (randomLane !== currentLane) {
            currentLane = randomLane;
            updatePlayerPosition();
        }
    }

    function createObstacle() {
        // בחירת נתיב אקראי
        const lane = Math.floor(Math.random() * lanes.length);
        const lanePosition = lanes[lane];
        
        // בחירת צבע אקראי
        const colors = ['blue', 'green', 'yellow', 'red'];
        const colorClass = colors[Math.floor(Math.random() * colors.length)];
        
        // יצירת אלמנט המכונית
        const obstacle = document.createElement('div');
        obstacle.classList.add('obstacle', colorClass);
        
        // מרכב המכונית
        const carBody = document.createElement('div');
        carBody.classList.add('obstacle-body');
        obstacle.appendChild(carBody);
        
        // שמשה
        const windshield = document.createElement('div');
        windshield.classList.add('obstacle-windshield');
        obstacle.appendChild(windshield);
        
        // גג
        const carTop = document.createElement('div');
        carTop.classList.add('obstacle-top');
        obstacle.appendChild(carTop);
        
        // אורות אחוריים
        const taillightLeft = document.createElement('div');
        taillightLeft.classList.add('obstacle-taillight', 'left');
        obstacle.appendChild(taillightLeft);
        
        const taillightRight = document.createElement('div');
        taillightRight.classList.add('obstacle-taillight', 'right');
        obstacle.appendChild(taillightRight);
        
        // גלגלים
        const wheelPositions = ['front-left', 'front-right', 'back-left', 'back-right'];
        wheelPositions.forEach(position => {
            const wheel = document.createElement('div');
            wheel.classList.add('obstacle-wheel', position);
            obstacle.appendChild(wheel);
        });
        
        // הגדרת מיקום
        obstacle.style.left = `calc(${lanePosition}% - 30px)`;
        obstacle.style.top = '-110px'; // מחוץ לאזור המשחק בתחילה
        
        gameArea.appendChild(obstacle);
        
        obstacles.push({
            element: obstacle,
            lane: lane,
            top: -110,
            width: 60, // רוחב המכשול בפיקסלים
            height: 110 // גובה המכשול בפיקסלים
        });
    }
    
    // עדכון אלמנטים ובדיקת התנגשויות
    function updateItems(timestamp) {
        // יצירת מטבעות
        if (timestamp - lastCoinTime > coinFrequency) {
            createCoin();
            lastCoinTime = timestamp;
        }
        
        // יצירת שלוליות
        if (timestamp - lastPuddleTime > puddleFrequency) {
            createPuddle();
            lastPuddleTime = timestamp;
        }
        
        // יצירת דחף
        if (timestamp - lastBoostTime > boostFrequency) {
            createBoost();
            lastBoostTime = timestamp;
        }
        
        // יצירת חיים
        if (timestamp - lastLifeTime > lifeFrequency) {
            createLife();
            lastLifeTime = timestamp;
        }
        
        // יצירת שלולית שמן
        if (timestamp - lastOilSpillTime > oilSpillFrequency) {
            createOilSpill();
            lastOilSpillTime = timestamp;
        }
        
        // יצירת שלט בצד הדרך
        if (timestamp - lastSignTime > signFrequency) {
            createRoadsideSign();
            lastSignTime = timestamp;
        }
        
        // עדכון מיקום מטבעות
        updateItemPositions(coins, (item) => {
            // בדיקת התנגשות עם מטבע
            if (item.lane === currentLane && checkItemCollision(item)) {
                gameArea.removeChild(item.element);
                score += 5; // 5 נקודות לכל מטבע
                scoreElement.textContent = score;
                return true; // להסיר את המטבע
            }
            return false;
        });
        
        // עדכון מיקום שלוליות
        updateItemPositions(puddles, (item) => {
            // בדיקת התנגשות עם שלולית
            if (item.lane === currentLane && checkItemCollision(item)) {
                if (speed > baseSpeed) {
                    speed = Math.max(baseSpeed, speed - 2); // האטה
                    updateSpeedDisplay();
                }
                return false; // לא להסיר את השלולית
            }
            return false;
        });
        
        // עדכון מיקום הגברות
        updateItemPositions(boosts, (item) => {
            // בדיקת התנגשות עם הגברה
            if (item.lane === currentLane && checkItemCollision(item)) {
                gameArea.removeChild(item.element);
                activateBoost();
                return true; // להסיר את ההגברה
            }
            return false;
        });
        
        // עדכון מיקום חיים
        updateItemPositions(lifes, (item) => {
            // בדיקת התנגשות עם חיים
            if (item.lane === currentLane && checkItemCollision(item)) {
                gameArea.removeChild(item.element);
                if (lives < 5) { // מקסימום 5 חיים
                    lives++;
                    updateLivesDisplay();
                }
                return true; // להסיר את החיים
            }
            return false;
        });
        
        // עדכון מיקום שלוליות שמן
        updateItemPositions(oilSpills, (item) => {
            // בדיקת התנגשות עם שלולית שמן
            if (item.lane === currentLane && checkItemCollision(item)) {
                activateOilSlip();
                return false; // לא להסיר את שלולית השמן
            }
            return false;
        });
        
        // עדכון מיקום שלטים
        updateItemPositions(signs, (item) => {
            return false; // לא להסיר שלטים לאחר התנגשות
        });
    }
    
    // עדכון מיקום של אלמנטים
    function updateItemPositions(items, collisionCallback) {
        for (let i = items.length - 1; i >= 0; i--) {
            const item = items[i];
            item.top += speed;
            item.element.style.top = `${item.top}px`;
            
            // בדיקת התנגשות
            const shouldRemove = collisionCallback(item);
            
            // הסרת אלמנטים שיצאו מהמסך או לאחר התנגשות
            if (shouldRemove || item.top > gameArea.offsetHeight) {
                if (item.element.parentNode) {
                    gameArea.removeChild(item.element);
                }
                items.splice(i, 1);
            }
        }
    }
    
    // בדיקת התנגשות עם אלמנט
    function checkItemCollision(item) {
        const playerRect = player.getBoundingClientRect();
        const itemRect = item.element.getBoundingClientRect();
        
        return !(
            playerRect.bottom < itemRect.top ||
            playerRect.top > itemRect.bottom
        );
    }

    function updateObstacles() {
        const now = Date.now();
        
        // יצירת מכשול חדש על פי תדירות
        if (now - lastObstacleTime > obstacleFrequency) {
            createObstacle();
            lastObstacleTime = now;
            
            // הגדלת הקושי: הגברת המהירות והקטנת המרווח בין מכשולים
            if (!boostActive && speed < maxSpeed) {
                speed += 0.2;
                updateSpeedDisplay();
            }
        }
        
        // עדכון מיקומי המכשולים
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obstacle = obstacles[i];
            obstacle.top += speed;
            obstacle.element.style.top = `${obstacle.top}px`;
            
            // בדיקת התנגשות
            if (checkCollision(obstacle)) {
                if (lives > 1) {
                    // איבוד חיים
                    lives--;
                    updateLivesDisplay();
                    
                    // הסרת המכשול שהתנגשנו בו
                    gameArea.removeChild(obstacle.element);
                    obstacles.splice(i, 1);
                    
                    // הקטנת המהירות לאחר התנגשות
                    speed = Math.max(baseSpeed, speed - 1);
                    updateSpeedDisplay();
                } else {
                    // אין יותר חיים, סיום משחק
                    gameOver();
                    return;
                }
            }
            
            // הסרת מכשולים שיצאו מהמסך
            if (obstacle.top > gameArea.offsetHeight) {
                gameArea.removeChild(obstacle.element);
                obstacles.splice(i, 1);
                score++;
                scoreElement.textContent = score;
            }
        }
    }

    function checkCollision(obstacle) {
        // בדיקה אם המכשול והשחקן באותו נתיב
        if (obstacle.lane !== currentLane) {
            return false;
        }
        
        const playerRect = player.getBoundingClientRect();
        const obstacleRect = obstacle.element.getBoundingClientRect();
        
        return !(
            playerRect.bottom < obstacleRect.top ||
            playerRect.top > obstacleRect.bottom
        );
    }

    function gameOver() {
        endGame();
        gameOverElement.style.display = 'block';
        startButton.textContent = 'שחק שוב';
    }

    function updateGame(timestamp) {
        if (!gameStarted || isPaused) return;
        
        // חישוב זמן שעבר מאז העדכון האחרון
        const deltaTime = timestamp - lastTimestamp;
        lastTimestamp = timestamp;
        
        updateObstacles();
        updateItems(timestamp);
        animationId = requestAnimationFrame(updateGame);
    }
    
    // בדיקת נראות כפתורים בטעינה ראשונית
    checkButtonsVisibility();
    
    // עדכון תצוגת חיים ראשונית
    updateLivesDisplay();
    updateSpeedDisplay();

    // פונקציה להשהיית המשחק
    function pauseGame() {
        if (!gameStarted || isPaused) return;
        
        isPaused = true;
        cancelAnimationFrame(animationId);
    }
    
    // פונקציה לחידוש המשחק
    function resumeGame() {
        if (!gameStarted || !isPaused) return;
        
        isPaused = false;
        lastTimestamp = performance.now();
        requestAnimationFrame(updateGame);
    }
});