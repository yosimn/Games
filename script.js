document.addEventListener('DOMContentLoaded', () => {
    const player = document.getElementById('player');
    const scoreElement = document.getElementById('score');
    const startButton = document.getElementById('start-btn');
    const leftButton = document.getElementById('left-btn');
    const rightButton = document.getElementById('right-btn');
    const gameArea = document.querySelector('.game-area');
    
    // בניית מכונית השחקן
    createPlayerCar();
    
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
    let score = 0;
    let animationId;
    let speed = 5;
    
    // הגדרת נתיבים
    const lanes = [12.5, 37.5, 62.5, 87.5]; // מיקום באחוזים של 4 נתיבים
    let currentLane = 2; // נתיב התחלתי (מתוך 0-3)
    
    const playerWidth = 60; // רוחב השחקן בפיקסלים
    let gameAreaWidth = window.innerWidth; // רוחב אזור המשחק
    const obstacleFrequency = 1500; // תדירות יצירת מכשולים במילישניות
    let lastObstacleTime = 0;
    let obstacles = [];
    
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
        startButton.textContent = 'הפסק משחק';
        requestAnimationFrame(updateGame);
    }

    function endGame() {
        gameStarted = false;
        startButton.textContent = 'התחל משחק';
        cancelAnimationFrame(animationId);
    }

    function resetGame() {
        obstacles.forEach(obstacle => {
            if (obstacle.element && obstacle.element.parentNode) {
                obstacle.element.parentNode.removeChild(obstacle.element);
            }
        });
        
        obstacles = [];
        score = 0;
        scoreElement.textContent = '0';
        currentLane = 2; // החזרת השחקן לנתיב האמצעי
        updatePlayerPosition();
        gameOverElement.style.display = 'none';
        speed = 5;
        lastObstacleTime = 0;
    }

    function updatePlayerPosition() {
        const lanePosition = lanes[currentLane];
        player.style.left = `calc(${lanePosition}% - ${playerWidth/2}px)`;
    }

    function handleKeyDown(e) {
        if (!gameStarted) return;
        
        if (e.key === 'ArrowLeft') {
            movePlayer('left');
        } else if (e.key === 'ArrowRight') {
            movePlayer('right');
        }
    }

    function movePlayer(direction) {
        if (!gameStarted) return;
        
        if (direction === 'left' && currentLane > 0) {
            currentLane--;
        } else if (direction === 'right' && currentLane < lanes.length - 1) {
            currentLane++;
        }
        
        updatePlayerPosition();
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

    function updateObstacles() {
        const now = Date.now();
        
        // יצירת מכשול חדש על פי תדירות
        if (now - lastObstacleTime > obstacleFrequency) {
            createObstacle();
            lastObstacleTime = now;
            
            // הגדלת הקושי: הגברת המהירות והקטנת המרווח בין מכשולים
            if (speed < 15) {
                speed += 0.2;
            }
        }
        
        // עדכון מיקומי המכשולים
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obstacle = obstacles[i];
            obstacle.top += speed;
            obstacle.element.style.top = `${obstacle.top}px`;
            
            // בדיקת התנגשות
            if (checkCollision(obstacle)) {
                gameOver();
                return;
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

    function updateGame() {
        if (gameStarted) {
            updateObstacles();
            animationId = requestAnimationFrame(updateGame);
        }
    }
    
    // בדיקת נראות כפתורים בטעינה ראשונית
    checkButtonsVisibility();
});