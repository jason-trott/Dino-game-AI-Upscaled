/**
 * Chrome Dino Game Engine
 * Handles game loop, physics, input, collision detection, and procedural generation.
 */

(() => {
    // --- Constants & Config ---
    const CANVAS_WIDTH = 900;
    const CANVAS_HEIGHT = 300;
    const GROUND_Y = 240;

    const GRAVITY = 0.68;
    const JUMP_VELOCITY = -13.8;
    const INITIAL_SPEED = 6.8;
    const MAX_SPEED = 16.0;
    const SPEED_ACCEL = 0.0018;

    // Game States
    const STATE = {
        START: 'START',
        RUNNING: 'RUNNING',
        PAUSED: 'PAUSED',
        GAMEOVER: 'GAMEOVER'
    };

    class DinoGame {
        constructor() {
            this.canvas = document.getElementById('gameCanvas');
            this.ctx = this.canvas.getContext('2d');
            this.canvasContainer = document.getElementById('canvasContainer');

            // Set fixed coordinate resolution
            this.canvas.width = CANVAS_WIDTH;
            this.canvas.height = CANVAS_HEIGHT;

            // DOM elements
            this.scoreEl = document.getElementById('scoreCounter');
            this.highScoreEl = document.getElementById('highScoreCounter');
            this.speedIndicatorEl = document.getElementById('speedIndicator');
            this.startModal = document.getElementById('startModal');
            this.gameOverModal = document.getElementById('gameOverModal');
            this.pauseModal = document.getElementById('pauseModal');
            this.btnStart = document.getElementById('btnStart');
            this.btnRestart = document.getElementById('btnRestart');
            this.btnResume = document.getElementById('btnResume');
            this.btnMute = document.getElementById('btnMute');
            this.btnPause = document.getElementById('btnPause');
            this.touchJumpBtn = document.getElementById('touchJump');
            this.touchDuckBtn = document.getElementById('touchDuck');

            this.finalScoreEl = document.getElementById('finalScore');
            this.bestScoreEl = document.getElementById('bestScore');

            // Audio instance
            this.sound = window.sound;

            // State
            this.state = STATE.START;
            this.score = 0;
            this.highScore = parseInt(localStorage.getItem('dino_high_score') || '0', 10);
            this.speed = INITIAL_SPEED;
            this.distanceTraveled = 0;
            this.isNight = false;
            this.lastNightToggleScore = 0;
            this.lastMilestoneScore = 0;

            // Dino Entity
            this.dino = {
                x: 60,
                y: GROUND_Y - 47,
                width: 44,
                height: 47,
                vy: 0,
                isGrounded: true,
                isDucking: false,
                isJumping: false,
                animFrame: 'idle',
                animTimer: 0
            };

            // Input tracking
            this.keys = {
                jump: false,
                duck: false
            };
            this.jumpBuffer = 0; // jump buffer timer (ms)
            this.jumpHold = false;

            // Entities
            this.obstacles = [];
            this.clouds = [];
            this.stars = [];
            this.groundBumps = [];
            this.particles = [];

            // Timing
            this.lastTime = 0;
            this.spawnTimer = 0;
            this.minSpawnDistance = 340;

            // Initialize
            this.initGroundAndStars();
            this.updateHighScoreDisplay();
            this.initControls();
            this.updateMuteButtonUI();

            // First render
            this.render();

            // Start animation loop
            requestAnimationFrame(this.gameLoop.bind(this));
        }

        initGroundAndStars() {
            // Pre-seed clouds
            for (let x = 120; x < CANVAS_WIDTH + 300; x += 220) {
                this.clouds.push({
                    x: x + Math.random() * 80,
                    y: 35 + Math.random() * 60,
                    speed: 0.8 + Math.random() * 0.4
                });
            }

            // Pre-seed stars for night sky
            for (let i = 0; i < 24; i++) {
                this.stars.push({
                    x: Math.random() * CANVAS_WIDTH,
                    y: 20 + Math.random() * 140,
                    frame: Math.random() > 0.5 ? 0 : 1,
                    twinkleTimer: Math.random() * 60
                });
            }

            // Pre-seed ground terrain features (small dots, pebbles, cracks)
            for (let x = 0; x < CANVAS_WIDTH * 2; x += 18) {
                if (Math.random() > 0.6) {
                    this.groundBumps.push({
                        x: x,
                        y: GROUND_Y + 4 + Math.floor(Math.random() * 16),
                        width: Math.floor(Math.random() * 6) + 2,
                        height: 2
                    });
                }
            }
        }

        initControls() {
            // Keydown
            window.addEventListener('keydown', (e) => {
                // Prevent scrolling on Space / Arrows
                if (['Space', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyS'].includes(e.code)) {
                    e.preventDefault();
                }

                if (this.state === STATE.START) {
                    if (['Space', 'ArrowUp', 'KeyW', 'Enter'].includes(e.code)) {
                        this.startGame();
                        this.triggerJump();
                    }
                    return;
                }

                if (this.state === STATE.GAMEOVER) {
                    if (['Space', 'Enter'].includes(e.code)) {
                        this.restartGame();
                    }
                    return;
                }

                if (e.code === 'KeyP' || e.code === 'Escape') {
                    this.togglePause();
                    return;
                }

                if (this.state !== STATE.RUNNING) return;

                // Jump keys
                if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
                    if (!this.keys.jump) {
                        this.triggerJump();
                    }
                    this.keys.jump = true;
                    this.jumpHold = true;
                }

                // Duck keys
                if (['ArrowDown', 'KeyS'].includes(e.code)) {
                    this.keys.duck = true;
                }
            });

            // Keyup
            window.addEventListener('keyup', (e) => {
                if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
                    this.keys.jump = false;
                    this.jumpHold = false;

                    // Variable jump height: release early cuts upward boost
                    if (this.dino.vy < -4.5) {
                        this.dino.vy = -4.5;
                    }
                }

                if (['ArrowDown', 'KeyS'].includes(e.code)) {
                    this.keys.duck = false;
                }
            });

            // Canvas direct click / tap to jump
            this.canvas.addEventListener('pointerdown', (e) => {
                if (this.state === STATE.START) {
                    this.startGame();
                    this.triggerJump();
                    return;
                }
                if (this.state === STATE.GAMEOVER) {
                    this.restartGame();
                    return;
                }
                if (this.state === STATE.RUNNING) {
                    this.triggerJump();
                    this.jumpHold = true;
                }
            });

            window.addEventListener('pointerup', () => {
                this.jumpHold = false;
                if (this.dino.vy < -4.5) {
                    this.dino.vy = -4.5;
                }
            });

            // Button controls
            this.btnStart.addEventListener('click', () => {
                this.startGame();
                this.triggerJump();
            });

            this.btnRestart.addEventListener('click', () => {
                this.restartGame();
            });

            this.btnResume.addEventListener('click', () => {
                this.togglePause();
            });

            this.btnPause.addEventListener('click', () => {
                this.togglePause();
            });

            this.btnMute.addEventListener('click', () => {
                const muted = this.sound.toggleMute();
                this.updateMuteButtonUI();
                if (!muted) this.sound.playClick();
            });

            // Touch screen dedicated buttons
            const handleTouchJumpStart = (e) => {
                e.preventDefault();
                if (this.state === STATE.START) this.startGame();
                if (this.state === STATE.GAMEOVER) this.restartGame();
                if (this.state === STATE.RUNNING) {
                    this.triggerJump();
                    this.jumpHold = true;
                    this.touchJumpBtn.classList.add('active');
                }
            };
            const handleTouchJumpEnd = (e) => {
                e.preventDefault();
                this.jumpHold = false;
                this.touchJumpBtn.classList.remove('active');
                if (this.dino.vy < -4.5) {
                    this.dino.vy = -4.5;
                }
            };
            this.touchJumpBtn.addEventListener('touchstart', handleTouchJumpStart, { passive: false });
            this.touchJumpBtn.addEventListener('touchend', handleTouchJumpEnd, { passive: false });
            this.touchJumpBtn.addEventListener('mousedown', handleTouchJumpStart);
            this.touchJumpBtn.addEventListener('mouseup', handleTouchJumpEnd);

            const handleTouchDuckStart = (e) => {
                e.preventDefault();
                if (this.state === STATE.RUNNING) {
                    this.keys.duck = true;
                    this.touchDuckBtn.classList.add('active');
                }
            };
            const handleTouchDuckEnd = (e) => {
                e.preventDefault();
                this.keys.duck = false;
                this.touchDuckBtn.classList.remove('active');
            };
            this.touchDuckBtn.addEventListener('touchstart', handleTouchDuckStart, { passive: false });
            this.touchDuckBtn.addEventListener('touchend', handleTouchDuckEnd, { passive: false });
            this.touchDuckBtn.addEventListener('mousedown', handleTouchDuckStart);
            this.touchDuckBtn.addEventListener('mouseup', handleTouchDuckEnd);
        }

        updateMuteButtonUI() {
            if (this.sound.isMuted()) {
                this.btnMute.innerHTML = `<span>🔇</span><span>Unmute</span>`;
            } else {
                this.btnMute.innerHTML = `<span>🔊</span><span>Sound</span>`;
            }
        }

        triggerJump() {
            if (this.dino.isGrounded) {
                this.dino.vy = JUMP_VELOCITY;
                this.dino.isGrounded = false;
                this.dino.isJumping = true;
                this.sound.playJump();
                this.createJumpDust(this.dino.x + 18, GROUND_Y);
            } else {
                // Buffer jump if pressed shortly before landing
                this.jumpBuffer = 140; // 140ms buffer
            }
        }

        startGame() {
            this.state = STATE.RUNNING;
            this.startModal.classList.remove('active');
            this.sound.init();
        }

        togglePause() {
            if (this.state === STATE.RUNNING) {
                this.state = STATE.PAUSED;
                this.pauseModal.classList.add('active');
                this.btnPause.innerHTML = `<span>▶</span><span>Resume</span>`;
            } else if (this.state === STATE.PAUSED) {
                this.state = STATE.RUNNING;
                this.pauseModal.classList.remove('active');
                this.btnPause.innerHTML = `<span>⏸</span><span>Pause</span>`;
                this.lastTime = performance.now();
            }
        }

        restartGame() {
            this.state = STATE.RUNNING;
            this.score = 0;
            this.distanceTraveled = 0;
            this.speed = INITIAL_SPEED;
            this.isNight = false;
            this.canvasContainer.classList.remove('night');
            this.obstacles = [];
            this.particles = [];
            this.gameOverModal.classList.remove('active');

            // Reset dino
            this.dino.y = GROUND_Y - 47;
            this.dino.vy = 0;
            this.dino.isGrounded = true;
            this.dino.isDucking = false;
            this.dino.isJumping = false;
            this.dino.animFrame = 'run1';
            this.keys.jump = false;
            this.keys.duck = false;

            this.updateScoreDisplay();
            this.lastTime = performance.now();
            this.sound.playClick();
        }

        gameOver() {
            this.state = STATE.GAMEOVER;
            this.dino.animFrame = 'crash';
            this.sound.playHit();

            // Collision burst particles
            this.createCrashParticles(this.dino.x + 22, this.dino.y + 20);

            // Update high score
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('dino_high_score', this.highScore.toString());
                this.updateHighScoreDisplay();
            }

            // Show Game Over modal
            this.finalScoreEl.textContent = this.formatScore(this.score);
            this.bestScoreEl.textContent = this.formatScore(this.highScore);
            this.gameOverModal.classList.add('active');
        }

        formatScore(val) {
            return Math.floor(val).toString().padStart(5, '0');
        }

        updateScoreDisplay() {
            this.scoreEl.textContent = this.formatScore(this.score);
        }

        updateHighScoreDisplay() {
            this.highScoreEl.textContent = `HI ${this.formatScore(this.highScore)}`;
        }

        createJumpDust(x, y) {
            for (let i = 0; i < 5; i++) {
                this.particles.push({
                    x: x + (Math.random() - 0.5) * 16,
                    y: y - 2,
                    vx: -(Math.random() * 2 + 1),
                    vy: -(Math.random() * 2 + 0.5),
                    radius: Math.random() * 2.5 + 1.5,
                    alpha: 0.8,
                    life: 20
                });
            }
        }

        createRunningDust(x, y) {
            if (Math.random() < 0.25) {
                this.particles.push({
                    x: x + 4,
                    y: y - 1,
                    vx: -(this.speed * 0.4 + Math.random() * 1.5),
                    vy: -(Math.random() * 1.2),
                    radius: Math.random() * 2 + 1,
                    alpha: 0.6,
                    life: 14
                });
            }
        }

        createCrashParticles(x, y) {
            for (let i = 0; i < 18; i++) {
                const angle = Math.random() * Math.PI * 2;
                const spd = Math.random() * 4 + 1.5;
                this.particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * spd,
                    vy: Math.sin(angle) * spd - 1,
                    radius: Math.random() * 3 + 2,
                    alpha: 1,
                    life: 35
                });
            }
        }

        spawnObstacle() {
            // Can spawn Cactus or Pterodactyl (Pterodactyl introduced after score 300)
            const allowPterodactyl = this.score > 300 && Math.random() < 0.35;

            if (allowPterodactyl) {
                // Flying dinosaur at 3 distinct heights
                // 0: high (can walk under without ducking)
                // 1: mid (requires ducking)
                // 2: low (requires jumping over)
                const heightRoll = Math.random();
                let flyY;
                let altitudeType = 'mid';

                if (heightRoll < 0.33) {
                    flyY = GROUND_Y - 72; // high
                    altitudeType = 'high';
                } else if (heightRoll < 0.7) {
                    flyY = GROUND_Y - 48; // mid
                    altitudeType = 'mid';
                } else {
                    flyY = GROUND_Y - 24; // low
                    altitudeType = 'low';
                }

                this.obstacles.push({
                    type: 'pterodactyl',
                    x: CANVAS_WIDTH + 20,
                    y: flyY,
                    width: 46,
                    height: 36,
                    frame: 0,
                    animTimer: 0,
                    altitude: altitudeType
                });
            } else {
                // Cactus obstacle
                // Choose cactus variant: 0=small single, 1=small double, 2=small triple, 3=large single, 4=large double
                let cactusType;
                let width, height;

                const roll = Math.random();
                if (roll < 0.3) {
                    cactusType = 0; width = 17; height = 35;
                } else if (roll < 0.55) {
                    cactusType = 1; width = 34; height = 35;
                } else if (roll < 0.75) {
                    cactusType = 3; width = 25; height = 50;
                } else if (roll < 0.9) {
                    cactusType = 2; width = 51; height = 35;
                } else {
                    cactusType = 4; width = 48; height = 50;
                }

                this.obstacles.push({
                    type: 'cactus',
                    variant: cactusType,
                    x: CANVAS_WIDTH + 20,
                    y: GROUND_Y - height,
                    width: width,
                    height: height
                });
            }
        }

        checkCollision(dinoBox, obsBox) {
            // Use tighter inner collision boxes so player doesn't get cheated by transparent margins
            const padX = 5;
            const padY = 4;

            return (
                dinoBox.x + padX < obsBox.x + obsBox.width - padX &&
                dinoBox.x + dinoBox.width - padX > obsBox.x + padX &&
                dinoBox.y + padY < obsBox.y + obsBox.height - padY &&
                dinoBox.y + dinoBox.height - padY > obsBox.y + padY
            );
        }

        update(dt) {
            if (this.state !== STATE.RUNNING) return;

            // Update distance and score
            this.distanceTraveled += this.speed;
            const prevScore = Math.floor(this.score);
            this.score = this.distanceTraveled * 0.025;
            const currentScore = Math.floor(this.score);

            // 100-point milestone chime & flash animation
            if (currentScore > 0 && currentScore % 100 === 0 && currentScore !== this.lastMilestoneScore) {
                this.lastMilestoneScore = currentScore;
                this.sound.playScore();
                this.scoreEl.classList.remove('score-flash');
                void this.scoreEl.offsetWidth; // trigger reflow
                this.scoreEl.classList.add('score-flash');
            }

            // Day / Night cycle (inverts every 700 points for 250 points)
            const cycleScore = currentScore % 700;
            const shouldBeNight = cycleScore > 500 && cycleScore < 700;
            if (shouldBeNight !== this.isNight) {
                this.isNight = shouldBeNight;
                if (this.isNight) {
                    this.canvasContainer.classList.add('night');
                } else {
                    this.canvasContainer.classList.remove('night');
                }
            }

            // Accelerate speed gradually
            this.speed = Math.min(INITIAL_SPEED + this.score * SPEED_ACCEL, MAX_SPEED);
            this.speedIndicatorEl.textContent = `SPD ${(this.speed / INITIAL_SPEED).toFixed(1)}x`;

            // Update score display
            this.updateScoreDisplay();

            // --- Dino Physics & Animation ---
            // Ducking handling
            const wasDucking = this.dino.isDucking;
            this.dino.isDucking = this.keys.duck && this.dino.isGrounded;

            if (this.dino.isDucking) {
                this.dino.width = 59;
                this.dino.height = 30;
                this.dino.y = GROUND_Y - 30;
            } else if (wasDucking) {
                this.dino.width = 44;
                this.dino.height = 47;
                this.dino.y = GROUND_Y - 47;
            }

            // Fast fall in air if pressing down
            if (!this.dino.isGrounded && this.keys.duck) {
                this.dino.vy += GRAVITY * 2.2;
            }

            // Apply gravity
            if (!this.dino.isGrounded) {
                this.dino.vy += GRAVITY;
                this.dino.y += this.dino.vy;

                // Ground landing check
                const targetGround = this.dino.isDucking ? (GROUND_Y - 30) : (GROUND_Y - 47);
                if (this.dino.y >= targetGround) {
                    this.dino.y = targetGround;
                    this.dino.vy = 0;
                    this.dino.isGrounded = true;
                    this.dino.isJumping = false;

                    // Execute buffered jump if active
                    if (this.jumpBuffer > 0) {
                        this.jumpBuffer = 0;
                        this.triggerJump();
                    }
                }
            }

            // Decrement jump buffer
            if (this.jumpBuffer > 0) {
                this.jumpBuffer -= dt * 1000;
            }

            // Dino run leg animation
            this.dino.animTimer += this.speed * 0.08;
            if (this.dino.animTimer > 1) {
                this.dino.animTimer = 0;
                this.dino.animFrame = this.dino.animFrame === 'run1' ? 'run2' : 'run1';
            }

            if (!this.dino.isGrounded) {
                this.dino.animFrame = 'jump';
            }

            // Running dust particle generator
            if (this.dino.isGrounded) {
                this.createRunningDust(this.dino.x, GROUND_Y);
            }

            // --- Obstacle Spawning & Movement ---
            this.spawnTimer += this.speed;
            const currentMinDistance = Math.max(300, 240 + this.speed * 16);

            // Check if last obstacle is far enough away to spawn next
            const lastObstacle = this.obstacles[this.obstacles.length - 1];
            const canSpawn = !lastObstacle || (CANVAS_WIDTH - lastObstacle.x > currentMinDistance);

            if (canSpawn && Math.random() < 0.04) {
                this.spawnObstacle();
            }

            // Move obstacles
            for (let i = this.obstacles.length - 1; i >= 0; i--) {
                const obs = this.obstacles[i];
                obs.x -= this.speed;

                // Animate pterodactyl wings
                if (obs.type === 'pterodactyl') {
                    obs.animTimer += 0.12;
                    if (obs.animTimer >= 1) {
                        obs.animTimer = 0;
                        obs.frame = obs.frame === 0 ? 1 : 0;
                    }
                }

                // Check collision with dino
                const dinoBox = {
                    x: this.dino.x,
                    y: this.dino.y,
                    width: this.dino.width,
                    height: this.dino.height
                };

                if (this.checkCollision(dinoBox, obs)) {
                    this.gameOver();
                    return;
                }

                // Remove off-screen obstacles
                if (obs.x + obs.width < -30) {
                    this.obstacles.splice(i, 1);
                }
            }

            // --- Clouds Movement ---
            this.clouds.forEach(cloud => {
                cloud.x -= cloud.speed + (this.speed * 0.15);
                if (cloud.x < -60) {
                    cloud.x = CANVAS_WIDTH + Math.random() * 100;
                    cloud.y = 30 + Math.random() * 60;
                }
            });

            // --- Stars Twinkle ---
            if (this.isNight) {
                this.stars.forEach(star => {
                    star.x -= this.speed * 0.1;
                    if (star.x < -10) star.x = CANVAS_WIDTH + 10;

                    star.twinkleTimer++;
                    if (star.twinkleTimer > 40) {
                        star.twinkleTimer = 0;
                        star.frame = star.frame === 0 ? 1 : 0;
                    }
                });
            }

            // --- Ground bumps scroll ---
            this.groundBumps.forEach(bump => {
                bump.x -= this.speed;
                if (bump.x < -20) {
                    bump.x = CANVAS_WIDTH + Math.random() * 30;
                    bump.y = GROUND_Y + 3 + Math.floor(Math.random() * 18);
                }
            });

            // --- Particle update ---
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.alpha -= 1 / p.life;
                if (p.alpha <= 0) {
                    this.particles.splice(i, 1);
                }
            }
        }

        render() {
            // Clear canvas
            this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            // Night celestial elements
            if (this.isNight) {
                // Moon
                window.Sprites.drawMoon(this.ctx, CANVAS_WIDTH - 140, 30);
                // Stars
                this.stars.forEach(star => {
                    window.Sprites.drawStar(this.ctx, star.x, star.y, star.frame);
                });
            }

            // Clouds
            this.clouds.forEach(cloud => {
                window.Sprites.drawCloud(this.ctx, cloud.x, cloud.y, this.isNight);
            });

            // Ground baseline
            window.Sprites.drawGroundLine(this.ctx, 0, GROUND_Y, CANVAS_WIDTH, this.isNight);

            // Ground bumps & pebbles
            this.ctx.fillStyle = this.isNight ? Sprites.colors.groundDark : Sprites.colors.ground;
            this.groundBumps.forEach(b => {
                this.ctx.fillRect(Math.round(b.x), Math.round(b.y), b.width, b.height);
            });

            // Obstacles
            this.obstacles.forEach(obs => {
                if (obs.type === 'cactus') {
                    window.Sprites.drawCactus(this.ctx, obs.x, obs.y, obs.variant, this.isNight);
                } else if (obs.type === 'pterodactyl') {
                    window.Sprites.drawPterodactyl(this.ctx, obs.x, obs.y, obs.frame, this.isNight);
                }
            });

            // Particles (Dust & Impact)
            this.particles.forEach(p => {
                this.ctx.save();
                this.ctx.globalAlpha = Math.max(0, p.alpha);
                this.ctx.fillStyle = this.isNight ? '#cccccc' : '#737373';
                this.ctx.fillRect(Math.round(p.x), Math.round(p.y), p.radius * 1.5, p.radius * 1.5);
                this.ctx.restore();
            });

            // Dino
            if (this.dino.isDucking) {
                window.Sprites.drawDinoDuck(this.ctx, this.dino.x, this.dino.y, this.dino.animFrame, this.isNight);
            } else {
                window.Sprites.drawDino(this.ctx, this.dino.x, this.dino.y, this.dino.animFrame, this.isNight);
            }
        }

        gameLoop(timestamp) {
            if (!this.lastTime) this.lastTime = timestamp;
            const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05); // cap delta time to 50ms to prevent huge jumps on tab inactive
            this.lastTime = timestamp;

            this.update(dt);
            this.render();

            requestAnimationFrame(this.gameLoop.bind(this));
        }
    }

    // Launch game when DOM is ready
    window.addEventListener('DOMContentLoaded', () => {
        window.game = new DinoGame();
    });
})();
