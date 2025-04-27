document.addEventListener('DOMContentLoaded', () => {
    const player = document.getElementById('player');
    const scoreElement = document.getElementById('score');
    const startButton = document.getElementById('start-btn');
    const leftButton = document.getElementById('left-btn');
    const rightButton = document.getElementById('right-btn');
    const gameArea = document.querySelector('.game-area');
    
    let gameStarted = false;
    let score = 0;
    let animationId;
    let speed = 5;
    let playerPosition = 50; // באחוזים
    const playerWidth = 50; // רוחב השחקן בפיקסלים
    let gameAreaWidth = window.innerWidth; // רוחב אזור המשחק
    const obstacleFrequency = 1500; // תדירות יצירת מכשולים במילישניות
    let lastObstacleTime = 0;
    let obstacles = [];
    
    // עדכון גודל אזור המשחק בעת שינוי גודל חלון
    window.addEventListener('resize', () => {
        gameAreaWidth = window.innerWidth;
        player.style.left = `calc(${playerPosition}% - ${playerWidth/2}px)`;
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
    
    // תמיכה במכשירי מובייל
    leftButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        movePlayer('left');
    });
    rightButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        movePlayer('right');
    });

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
        playerPosition = 50;
        player.style.left = `calc(${playerPosition}% - ${playerWidth/2}px)`;
        gameOverElement.style.display = 'none';
        speed = 5;
        lastObstacleTime = 0;
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
        
        const moveStep = 3; // צעד תנועה קטן יותר למסך גדול
        
        if (direction === 'left' && playerPosition > 0) {
            playerPosition = Math.max(0, playerPosition - moveStep);
        } else if (direction === 'right' && playerPosition < 100) {
            playerPosition = Math.min(100, playerPosition + moveStep);
        }
        
        player.style.left = `calc(${playerPosition}% - ${playerWidth/2}px)`;
    }

    function createObstacle() {
        const obstacle = document.createElement('div');
        obstacle.classList.add('obstacle');
        
        // מיקום אקראי לרוחב הכביש
        const position = Math.random() * 80 + 10; // בין 10% ל-90%
        obstacle.style.left = `calc(${position}% - 25px)`;
        obstacle.style.top = '-80px'; // מחוץ לאזור המשחק בתחילה
        
        // צבע אקראי
        const colors = ['blue', 'green', 'purple', 'orange'];
        obstacle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        gameArea.appendChild(obstacle);
        
        obstacles.push({
            element: obstacle,
            position: position,
            top: -80,
            width: 50, // רוחב המכשול בפיקסלים
            height: 80 // גובה המכשול בפיקסלים
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
        const playerRect = player.getBoundingClientRect();
        const obstacleRect = obstacle.element.getBoundingClientRect();
        
        return !(
            playerRect.right < obstacleRect.left ||
            playerRect.left > obstacleRect.right ||
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
}); 