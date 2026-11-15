/**
 * Pixel-perfect procedural sprite rendering engine for Chrome Dino
 * Draws directly to Canvas or OffscreenCanvas for crisp retro aesthetics.
 */

const Sprites = {
    // Color palette definitions
    colors: {
        dino: '#535353',
        dinoDark: '#acacac',
        cactus: '#535353',
        cactusDark: '#acacac',
        pterodactyl: '#535353',
        pterodactylDark: '#acacac',
        ground: '#535353',
        groundDark: '#777777',
        cloud: '#d8d8d8',
        cloudDark: '#555555',
        star: '#f0f0f0',
        moon: '#f4f4f4'
    },

    /**
     * Draw Dino standing or running
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} x 
     * @param {number} y 
     * @param {string} state - 'idle', 'run1', 'run2', 'jump', 'crash'
     * @param {boolean} isNight 
     */
    drawDino(ctx, x, y, state, isNight = false) {
        ctx.save();
        ctx.translate(Math.round(x), Math.round(y));
        const color = isNight ? this.colors.dinoDark : this.colors.dino;
        ctx.fillStyle = color;

        // Dino dimensions: 44px wide by 47px high
        // Head & Snout
        ctx.fillRect(22, 0, 20, 16);
        ctx.fillRect(42, 2, 2, 10);
        ctx.fillRect(20, 4, 2, 12);
        
        // Eye
        if (state === 'crash') {
            // X eye on crash
            ctx.fillStyle = isNight ? '#1a1a1a' : '#ffffff';
            ctx.fillRect(26, 4, 6, 6);
            ctx.fillStyle = isNight ? '#ff4d4d' : '#d93838'; // red crash X
            ctx.fillRect(27, 5, 2, 2);
            ctx.fillRect(30, 5, 2, 2);
            ctx.fillRect(28, 6, 2, 2);
            ctx.fillRect(27, 7, 2, 2);
            ctx.fillRect(30, 7, 2, 2);
            ctx.fillStyle = color;
        } else {
            // Normal eye
            ctx.fillStyle = isNight ? '#202124' : '#ffffff';
            ctx.fillRect(26, 4, 3, 3);
            ctx.fillStyle = color;
        }

        // Mouth / jaw indent
        ctx.clearRect(34, 10, 8, 2);
        if (isNight) {
            ctx.fillStyle = '#202124';
            ctx.fillRect(34, 10, 8, 2);
            ctx.fillStyle = color;
        }

        // Neck
        ctx.fillRect(20, 16, 12, 6);

        // Body
        ctx.fillRect(14, 18, 18, 14);
        ctx.fillRect(10, 20, 6, 10);
        ctx.fillRect(6, 22, 6, 6);
        ctx.fillRect(2, 24, 6, 4);
        ctx.fillRect(0, 26, 4, 2); // tail tip

        // Small arm
        ctx.fillRect(30, 22, 4, 4);
        ctx.fillRect(32, 26, 2, 2);

        // Underbelly indent
        ctx.fillRect(12, 32, 16, 4);

        // Legs depending on state
        if (state === 'idle' || state === 'jump' || state === 'crash') {
            // Both legs straight down
            ctx.fillRect(14, 36, 4, 7);
            ctx.fillRect(14, 43, 6, 2); // left foot
            ctx.fillRect(22, 36, 4, 7);
            ctx.fillRect(22, 43, 6, 2); // right foot
        } else if (state === 'run1') {
            // Left leg back/up, right leg forward/down
            ctx.fillRect(14, 36, 4, 4);
            ctx.fillRect(12, 40, 4, 3); // back leg bent
            ctx.fillRect(22, 36, 4, 8);
            ctx.fillRect(22, 44, 6, 2); // front foot down
        } else if (state === 'run2') {
            // Left leg forward/down, right leg back/up
            ctx.fillRect(14, 36, 4, 8);
            ctx.fillRect(14, 44, 6, 2); // front foot down
            ctx.fillRect(22, 36, 4, 4);
            ctx.fillRect(24, 40, 4, 3); // back leg bent
        }

        ctx.restore();
    },

    /**
     * Draw Dino ducking / crawling
     * Width: 59px, Height: 30px
     */
    drawDinoDuck(ctx, x, y, state, isNight = false) {
        ctx.save();
        ctx.translate(Math.round(x), Math.round(y));
        const color = isNight ? this.colors.dinoDark : this.colors.dino;
        ctx.fillStyle = color;

        // Elongated body
        ctx.fillRect(0, 14, 6, 4);   // tail tip
        ctx.fillRect(6, 12, 8, 6);
        ctx.fillRect(14, 8, 26, 12); // main body

        // Head extended forward
        ctx.fillRect(40, 0, 18, 14);
        ctx.fillRect(56, 2, 3, 10);

        // Eye
        ctx.fillStyle = isNight ? '#202124' : '#ffffff';
        ctx.fillRect(43, 4, 3, 3);
        ctx.fillStyle = color;

        // Snout notch
        ctx.clearRect(48, 8, 10, 2);
        if (isNight) {
            ctx.fillStyle = '#202124';
            ctx.fillRect(48, 8, 10, 2);
            ctx.fillStyle = color;
        }

        // Arm
        ctx.fillRect(40, 14, 4, 3);

        // Ducking legs
        if (state === 'run1') {
            ctx.fillRect(16, 20, 5, 6);
            ctx.fillRect(16, 26, 7, 2);
            ctx.fillRect(28, 20, 5, 4);
            ctx.fillRect(30, 24, 5, 3);
        } else {
            ctx.fillRect(16, 20, 5, 4);
            ctx.fillRect(14, 24, 5, 3);
            ctx.fillRect(28, 20, 5, 6);
            ctx.fillRect(28, 26, 7, 2);
        }

        ctx.restore();
    },

    /**
     * Draw Cactus obstacle
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} x 
     * @param {number} y 
     * @param {number} type - 0: small single, 1: small double, 2: small triple, 3: large single, 4: large double
     * @param {boolean} isNight 
     */
    drawCactus(ctx, x, y, type = 0, isNight = false) {
        ctx.save();
        ctx.translate(Math.round(x), Math.round(y));
        const color = isNight ? this.colors.cactusDark : this.colors.cactus;
        ctx.fillStyle = color;

        if (type === 0) {
            // Small single cactus (17w x 35h)
            ctx.fillRect(5, 0, 7, 35);   // main stem
            ctx.fillRect(0, 10, 5, 12);  // left arm
            ctx.fillRect(0, 8, 4, 4);
            ctx.fillRect(12, 14, 5, 10); // right arm
            ctx.fillRect(13, 12, 4, 4);
        } else if (type === 1) {
            // Small double cactus (34w x 35h)
            // First
            ctx.fillRect(5, 4, 6, 31);
            ctx.fillRect(1, 12, 4, 10);
            ctx.fillRect(1, 10, 3, 3);
            ctx.fillRect(11, 15, 4, 8);
            // Second
            ctx.fillRect(22, 0, 6, 35);
            ctx.fillRect(17, 10, 5, 11);
            ctx.fillRect(17, 8, 4, 3);
            ctx.fillRect(28, 14, 5, 10);
            ctx.fillRect(29, 12, 4, 3);
        } else if (type === 2) {
            // Small triple cactus (51w x 35h)
            // Left
            ctx.fillRect(5, 6, 5, 29);
            ctx.fillRect(1, 14, 4, 8);
            ctx.fillRect(10, 16, 4, 7);
            // Middle (tallest)
            ctx.fillRect(22, 0, 6, 35);
            ctx.fillRect(17, 9, 5, 11);
            ctx.fillRect(17, 7, 4, 3);
            ctx.fillRect(28, 12, 5, 10);
            // Right
            ctx.fillRect(39, 4, 6, 31);
            ctx.fillRect(35, 12, 4, 9);
            ctx.fillRect(45, 14, 4, 8);
        } else if (type === 3) {
            // Large single cactus (25w x 50h)
            ctx.fillRect(8, 0, 9, 50);    // stem
            ctx.fillRect(0, 12, 8, 16);   // left branch
            ctx.fillRect(0, 8, 6, 6);
            ctx.fillRect(17, 18, 8, 15);  // right branch
            ctx.fillRect(19, 14, 6, 6);
        } else {
            // Large double cactus (48w x 50h)
            ctx.fillRect(8, 5, 9, 45);
            ctx.fillRect(0, 15, 8, 16);
            ctx.fillRect(0, 10, 6, 6);
            ctx.fillRect(17, 20, 7, 14);

            ctx.fillRect(31, 0, 9, 50);
            ctx.fillRect(24, 14, 7, 15);
            ctx.fillRect(40, 16, 8, 16);
            ctx.fillRect(42, 12, 6, 6);
        }

        ctx.restore();
    },

    /**
     * Draw Pterodactyl flying dinosaur
     * Dimensions: 46w x 40h
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} x 
     * @param {number} y 
     * @param {number} frame - 0: wings up, 1: wings down
     * @param {boolean} isNight 
     */
    drawPterodactyl(ctx, x, y, frame = 0, isNight = false) {
        ctx.save();
        ctx.translate(Math.round(x), Math.round(y));
        const color = isNight ? this.colors.pterodactylDark : this.colors.pterodactyl;
        ctx.fillStyle = color;

        // Head and beak
        ctx.fillRect(0, 14, 14, 5);  // beak
        ctx.fillRect(10, 10, 10, 8); // head
        ctx.fillRect(20, 12, 4, 4);  // eye notch

        // Eye
        ctx.fillStyle = isNight ? '#202124' : '#ffffff';
        ctx.fillRect(12, 12, 2, 2);
        ctx.fillStyle = color;

        // Body
        ctx.fillRect(16, 14, 18, 8);
        ctx.fillRect(34, 16, 8, 4);  // tail

        if (frame === 0) {
            // Wings UP
            ctx.fillRect(18, 2, 8, 12);
            ctx.fillRect(14, 0, 8, 8);
            ctx.fillRect(10, 0, 4, 4);
        } else {
            // Wings DOWN
            ctx.fillRect(18, 22, 8, 12);
            ctx.fillRect(14, 28, 8, 8);
            ctx.fillRect(10, 32, 4, 4);
        }

        ctx.restore();
    },

    /**
     * Draw Cloud
     * Dimensions: 46w x 14h
     */
    drawCloud(ctx, x, y, isNight = false) {
        ctx.save();
        ctx.translate(Math.round(x), Math.round(y));
        ctx.fillStyle = isNight ? this.colors.cloudDark : this.colors.cloud;

        ctx.fillRect(16, 0, 24, 4);
        ctx.fillRect(8, 4, 36, 4);
        ctx.fillRect(0, 8, 46, 4);
        ctx.fillRect(4, 12, 38, 2);

        ctx.restore();
    },

    /**
     * Draw Star
     */
    drawStar(ctx, x, y, frame = 0) {
        ctx.save();
        ctx.translate(Math.round(x), Math.round(y));
        ctx.fillStyle = this.colors.star;

        if (frame === 0) {
            ctx.fillRect(1, 0, 1, 3);
            ctx.fillRect(0, 1, 3, 1);
        } else {
            ctx.fillRect(1, 1, 1, 1);
        }

        ctx.restore();
    },

    /**
     * Draw Moon
     */
    drawMoon(ctx, x, y) {
        ctx.save();
        ctx.translate(Math.round(x), Math.round(y));
        ctx.fillStyle = this.colors.moon;

        // Crescent moon silhouette
        ctx.beginPath();
        ctx.arc(15, 15, 14, 0, Math.PI * 2, true);
        ctx.fill();

        // Dark cutout to create crescent
        ctx.fillStyle = '#202124';
        ctx.beginPath();
        ctx.arc(9, 13, 13, 0, Math.PI * 2, true);
        ctx.fill();

        ctx.restore();
    },

    /**
     * Draw Ground segments & details
     */
    drawGroundLine(ctx, x, y, width, isNight = false) {
        ctx.save();
        ctx.fillStyle = isNight ? this.colors.groundDark : this.colors.ground;
        ctx.fillRect(x, y, width, 2);
        ctx.restore();
    }
};

window.Sprites = Sprites;
