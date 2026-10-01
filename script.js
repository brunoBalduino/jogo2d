const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const restartButton = document.getElementById("restartButton");
const playAgain = document.getElementById("playAgain");

const gameOverScreen = document.getElementById("gameOver");
const winnerText = document.getElementById("winnerText");
const statusText = document.getElementById("status");

const p1HealthBar = document.getElementById("p1Health");
const p2HealthBar = document.getElementById("p2Health");

const p1ScoreText = document.getElementById("p1Score");
const p2ScoreText = document.getElementById("p2Score");


/* =========================================================
   CONFIGURAÇÃO
========================================================= */

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const GRAVITY = 0.65;
const FRICTION = 0.82;

const keys = {};

let gameRunning = true;
let animationId;


/* =========================================================
   TECLADO
========================================================= */

window.addEventListener("keydown", (event) => {

    keys[event.code] = true;

    const blockedKeys = [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Space"
    ];

    if (blockedKeys.includes(event.code)) {
        event.preventDefault();
    }

});

window.addEventListener("keyup", (event) => {
    keys[event.code] = false;
});


/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function rectangleCollision(a, b) {

    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}


/* =========================================================
   PARTÍCULAS
========================================================= */

let particles = [];

function createParticles(x, y, color, amount = 12) {

    for (let i = 0; i < amount; i++) {

        particles.push({
            x,
            y,
            vx: random(-4, 4),
            vy: random(-5, 1),
            size: random(3, 7),
            life: random(20, 45),
            color
        });

    }

}

function updateParticles() {

    particles.forEach(particle => {

        particle.x += particle.vx;
        particle.y += particle.vy;

        particle.vy += 0.18;

        particle.life--;

    });

    particles = particles.filter(particle => particle.life > 0);
}

function drawParticles() {

    particles.forEach(particle => {

        ctx.globalAlpha = particle.life / 45;

        ctx.fillStyle = particle.color;

        ctx.fillRect(
            particle.x,
            particle.y,
            particle.size,
            particle.size
        );

    });

    ctx.globalAlpha = 1;
}


/* =========================================================
   CRISTAIS
========================================================= */

let crystals = [];

function createCrystal(x, y) {

    crystals.push({
        x,
        y,
        size: 12,
        collected: false,
        angle: random(0, Math.PI * 2)
    });

}

function spawnCrystals() {

    crystals = [];

    createCrystal(300, 350);
    createCrystal(550, 250);
    createCrystal(800, 350);
    createCrystal(550, 470);
}

function updateCrystals() {

    crystals.forEach(crystal => {

        if (crystal.collected) {
            return;
        }

        crystal.angle += 0.04;

        const players = [player1, player2];

        players.forEach(player => {

            if (
                !crystal.collected &&
                rectangleCollision(
                    player,
                    {
                        x: crystal.x - crystal.size,
                        y: crystal.y - crystal.size,
                        width: crystal.size * 2,
                        height: crystal.size * 2
                    }
                )
            ) {

                crystal.collected = true;

                player.crystals++;

                createParticles(
                    crystal.x,
                    crystal.y,
                    "#ffd447",
                    18
                );

            }

        });

    });

}

function drawCrystals() {

    crystals.forEach(crystal => {

        if (crystal.collected) {
            return;
        }

        ctx.save();

        ctx.translate(crystal.x, crystal.y);

        ctx.rotate(crystal.angle);

        ctx.fillStyle = "#ffd447";

        ctx.shadowColor = "#ffd447";
        ctx.shadowBlur = 15;

        ctx.beginPath();

        ctx.moveTo(0, -13);
        ctx.lineTo(9, 0);
        ctx.lineTo(0, 13);
        ctx.lineTo(-9, 0);

        ctx.closePath();

        ctx.fill();

        ctx.restore();

    });

}


/* =========================================================
   PLATAFORMAS
========================================================= */

const platforms = [

    {
        x: 0,
        y: 555,
        width: 1100,
        height: 45,
        type: "ground"
    },

    {
        x: 100,
        y: 450,
        width: 220,
        height: 25,
        type: "platform"
    },

    {
        x: 440,
        y: 400,
        width: 220,
        height: 25,
        type: "platform"
    },

    {
        x: 780,
        y: 450,
        width: 220,
        height: 25,
        type: "platform"
    },

    {
        x: 280,
        y: 300,
        width: 170,
        height: 22,
        type: "platform"
    },

    {
        x: 650,
        y: 300,
        width: 170,
        height: 22,
        type: "platform"
    }

];


/* =========================================================
   CAIXAS DESTRUTÍVEIS
========================================================= */

let boxes = [];

function createBoxes() {

    boxes = [

        {
            x: 360,
            y: 515,
            width: 40,
            height: 40,
            health: 3,
            destroyed: false
        },

        {
            x: 700,
            y: 515,
            width: 40,
            height: 40,
            health: 3,
            destroyed: false
        },

        {
            x: 500,
            y: 360,
            width: 40,
            height: 40,
            health: 3,
            destroyed: false
        }

    ];

}


/* =========================================================
   JOGADOR
========================================================= */

class Player {

    constructor(options) {

        this.name = options.name;
        this.color = options.color;

        this.x = options.x;
        this.y = options.y;

        this.spawnX = options.x;
        this.spawnY = options.y;

        this.width = 38;
        this.height = 58;

        this.vx = 0;
        this.vy = 0;

        this.speed = 5.5;

        this.jumpPower = 13;

        this.grounded = false;

        this.health = 100;

        this.maxHealth = 100;

        this.crystals = 0;

        this.facing = options.facing;

        this.attackCooldown = 0;
        this.attackTimer = 0;

        this.invincible = 0;

        this.dead = false;

    }


    reset() {

        this.x = this.spawnX;
        this.y = this.spawnY;

        this.vx = 0;
        this.vy = 0;

        this.health = this.maxHealth;

        this.crystals = 0;

        this.attackCooldown = 0;
        this.attackTimer = 0;

        this.invincible = 0;

        this.dead = false;

    }


    update(controls, enemy) {

        if (this.dead) {
            return;
        }

        /* MOVIMENTO */

        if (keys[controls.left]) {

            this.vx -= 0.8;
            this.facing = -1;

        }

        if (keys[controls.right]) {

            this.vx += 0.8;
            this.facing = 1;

        }

        this.vx *= FRICTION;

        this.vx = clamp(
            this.vx,
            -this.speed,
            this.speed
        );


        /* PULO */

        if (
            keys[controls.jump] &&
            this.grounded
        ) {

            this.vy = -this.jumpPower;

            this.grounded = false;

        }


        /* ATAQUE */

        if (
            keys[controls.attack] &&
            this.attackCooldown <= 0
        ) {

            this.attack(enemy);

        }


        this.vy += GRAVITY;

        this.x += this.vx;
        this.y += this.vy;


        /* LIMITES DA ARENA */

        if (this.x < 0) {

            this.x = 0;
            this.vx = 0;

        }

        if (this.x + this.width > WIDTH) {

            this.x = WIDTH - this.width;
            this.vx = 0;

        }


        /* COLISÃO COM PLATAFORMAS */

        this.grounded = false;

        platforms.forEach(platform => {

            const wasAbove =
                this.y + this.height - this.vy <= platform.y;

            if (
                rectangleCollision(this, platform) &&
                this.vy >= 0 &&
                wasAbove
            ) {

                this.y = platform.y - this.height;

                this.vy = 0;

                this.grounded = true;

            }

        });


        /* CAIXAS */

        boxes.forEach(box => {

            if (box.destroyed) {
                return;
            }

            const wasAbove =
                this.y + this.height - this.vy <= box.y;

            if (
                rectangleCollision(this, box) &&
                this.vy >= 0 &&
                wasAbove
            ) {

                this.y = box.y - this.height;

                this.vy = 0;

                this.grounded = true;

            }

        });


        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        }

        if (this.attackTimer > 0) {
            this.attackTimer--;
        }

        if (this.invincible > 0) {
            this.invincible--;
        }


        /* QUEDA */

        if (this.y > HEIGHT + 100) {

            this.takeDamage(25);

            this.x = this.spawnX;
            this.y = this.spawnY;

            this.vy = 0;

        }

    }


    attack(enemy) {

        this.attackCooldown = 30;

        this.attackTimer = 10;

        const attackRange = 58;

        const hitbox = {

            x:
                this.facing === 1
                    ? this.x + this.width
                    : this.x - attackRange,

            y: this.y + 12,

            width: attackRange,

            height: 32

        };


        /* ATACA O OUTRO JOGADOR */

        if (
            !enemy.dead &&
            rectangleCollision(hitbox, enemy)
        ) {

            enemy.takeDamage(12);

            enemy.vx += this.facing * 8;
            enemy.vy = -5;

            createParticles(
                enemy.x + enemy.width / 2,
                enemy.y + enemy.height / 2,
                this.color,
                15
            );

        }


        /* ATACA CAIXAS */

        boxes.forEach(box => {

            if (
                !box.destroyed &&
                rectangleCollision(hitbox, box)
            ) {

                box.health--;

                createParticles(
                    box.x + box.width / 2,
                    box.y + box.height / 2,
                    "#c87941",
                    8
                );

                if (box.health <= 0) {

                    box.destroyed = true;

                    createParticles(
                        box.x + box.width / 2,
                        box.y + box.height / 2,
                        "#ffd447",
                        20
                    );

                }

            }

        });

    }


    takeDamage(amount) {

        if (this.invincible > 0 || this.dead) {
            return;
        }

        this.health -= amount;

        this.health = Math.max(
            0,
            this.health
        );

        this.invincible = 25;

        if (this.health <= 0) {

            this.dead = true;

            createParticles(
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.color,
                35
            );

            checkWinner();

        }

    }


    draw() {

        if (this.dead) {
            return;
        }

        ctx.save();

        /* EFEITO DE INVENCIBILIDADE */

        if (
            this.invincible > 0 &&
            Math.floor(this.invincible / 4) % 2 === 0
        ) {

            ctx.globalAlpha = 0.45;

        }


        /* CORPO */

        ctx.fillStyle = this.color;

        ctx.fillRect(
            this.x,
            this.y + 18,
            this.width,
            this.height - 18
        );


        /* CABEÇA */

        ctx.fillStyle = "#f2c6a0";

        ctx.fillRect(
            this.x + 7,
            this.y,
            24,
            24
        );


        /* CABELO */

        ctx.fillStyle = "#222";

        ctx.fillRect(
            this.x + 6,
            this.y,
            26,
            7
        );


        /* OLHOS */

        ctx.fillStyle = "#111";

        if (this.facing === 1) {

            ctx.fillRect(
                this.x + 25,
                this.y + 9,
                4,
                4
            );

        } else {

            ctx.fillRect(
                this.x + 9,
                this.y + 9,
                4,
                4
            );

        }


        /* PERNAS */

        ctx.fillStyle = "#15182a";

        ctx.fillRect(
            this.x + 5,
            this.y + this.height - 5,
            10,
            8
        );

        ctx.fillRect(
            this.x + 23,
            this.y + this.height - 5,
            10,
            8
        );


        /* ATAQUE */

        if (this.attackTimer > 0) {

            ctx.fillStyle = "#ffffff";

            const swordX =
                this.facing === 1
                    ? this.x + this.width + 2
                    : this.x - 38;

            ctx.fillRect(
                swordX,
                this.y + 20,
                36,
                7
            );

            ctx.fillStyle = "#ffd447";

            ctx.fillRect(
                this.facing === 1
                    ? swordX + 27
                    : swordX,
                this.y + 14,
                7,
                19
            );

        }

        ctx.restore();


        /* BARRA DE VIDA SOBRE O JOGADOR */

        ctx.fillStyle = "#090b13";

        ctx.fillRect(
            this.x,
            this.y - 10,
            this.width,
            5
        );

        ctx.fillStyle = this.color;

        ctx.fillRect(
            this.x,
            this.y - 10,
            this.width * (this.health / this.maxHealth),
            5
        );

    }

}


/* =========================================================
   CRIAÇÃO DOS JOGADORES
========================================================= */

const player1 = new Player({

    name: "PLAYER 1",

    color: "#ff3d5a",

    x: 130,

    y: 350,

    facing: 1

});


const player2 = new Player({

    name: "PLAYER 2",

    color: "#3d8bff",

    x: 930,

    y: 350,

    facing: -1

});


const controlsP1 = {

    left: "KeyA",
    right: "KeyD",
    jump: "KeyW",
    attack: "KeyF"

};


const controlsP2 = {

    left: "ArrowLeft",
    right: "ArrowRight",
    jump: "ArrowUp",
    attack: "KeyL"

};


/* =========================================================
   CENÁRIO
========================================================= */

let backgroundStars = [];

function createBackground() {

    backgroundStars = [];

    for (let i = 0; i < 90; i++) {

        backgroundStars.push({

            x: random(0, WIDTH),

            y: random(20, 400),

            size: random(1, 3),

            alpha: random(0.2, 0.9)

        });

    }

}


function drawBackground() {

    /* CÉU */

    const gradient = ctx.createLinearGradient(
        0,
        0,
        0,
        HEIGHT
    );

    gradient.addColorStop(
        0,
        "#101936"
    );

    gradient.addColorStop(
        0.55,
        "#202750"
    );

    gradient.addColorStop(
        1,
        "#10121f"
    );

    ctx.fillStyle = gradient;

    ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );


    /* LUA */

    ctx.fillStyle = "#f3f0cf";

    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 25;

    ctx.beginPath();

    ctx.arc(
        550,
        100,
        42,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.shadowBlur = 0;


    /* ESTRELAS */

    backgroundStars.forEach(star => {

        ctx.globalAlpha = star.alpha;

        ctx.fillStyle = "#ffffff";

        ctx.fillRect(
            star.x,
            star.y,
            star.size,
            star.size
        );

    });

    ctx.globalAlpha = 1;


    /* MONTANHAS */

    ctx.fillStyle = "#0c1022";

    ctx.beginPath();

    ctx.moveTo(0, 450);

    ctx.lineTo(150, 300);
    ctx.lineTo(300, 450);

    ctx.lineTo(500, 260);
    ctx.lineTo(720, 450);

    ctx.lineTo(900, 310);
    ctx.lineTo(1100, 450);

    ctx.lineTo(1100, 600);
    ctx.lineTo(0, 600);

    ctx.closePath();

    ctx.fill();


    /* NEBLINA */

    const fog = ctx.createLinearGradient(
        0,
        380,
        0,
        560
    );

    fog.addColorStop(
        0,
        "rgba(90, 110, 180, 0)"
    );

    fog.addColorStop(
        1,
        "rgba(80, 100, 180, 0.08)"
    );

    ctx.fillStyle = fog;

    ctx.fillRect(
        0,
        380,
        WIDTH,
        180
    );

}


/* =========================================================
   DESENHAR PLATAFORMAS
========================================================= */

function drawPlatforms() {

    platforms.forEach(platform => {

        if (platform.type === "ground") {

            ctx.fillStyle = "#171b2f";

            ctx.fillRect(
                platform.x,
                platform.y,
                platform.width,
                platform.height
            );

            ctx.fillStyle = "#2d385d";

            ctx.fillRect(
                platform.x,
                platform.y,
                platform.width,
                8
            );

        } else {

            ctx.fillStyle = "#272d48";

            ctx.fillRect(
                platform.x,
                platform.y,
                platform.width,
                platform.height
            );

            ctx.fillStyle = "#6b769f";

            ctx.fillRect(
                platform.x,
                platform.y,
                platform.width,
                5
            );

            /* DETALHES */

            ctx.fillStyle = "#161a2c";

            for (
                let x = platform.x + 10;
                x < platform.x + platform.width;
                x += 35
            ) {

                ctx.fillRect(
                    x,
                    platform.y + 10,
                    3,
                    10
                );

            }

        }

    });

}


/* =========================================================
   DESENHAR CAIXAS
========================================================= */

function drawBoxes() {

    boxes.forEach(box => {

        if (box.destroyed) {
            return;
        }

        ctx.fillStyle = "#8c5a36";

        ctx.fillRect(
            box.x,
            box.y,
            box.width,
            box.height
        );

        ctx.strokeStyle = "#d89555";

        ctx.lineWidth = 3;

        ctx.strokeRect(
            box.x + 2,
            box.y + 2,
            box.width - 4,
            box.height - 4
        );

        ctx.strokeStyle = "#5a3823";

        ctx.beginPath();

        ctx.moveTo(
            box.x + 7,
            box.y + 7
        );

        ctx.lineTo(
            box.x + box.width - 7,
            box.y + box.height - 7
        );

        ctx.moveTo(
            box.x + box.width - 7,
            box.y + 7
        );

        ctx.lineTo(
            box.x + 7,
            box.y + box.height - 7
        );

        ctx.stroke();

    });

}


/* =========================================================
   ATUALIZA HUD
========================================================= */

function updateHUD() {

    p1HealthBar.style.width =
        `${player1.health}%`;

    p2HealthBar.style.width =
        `${player2.health}%`;

    p1ScoreText.textContent =
        `Cristais: ${player1.crystals}`;

    p2ScoreText.textContent =
        `Cristais: ${player2.crystals}`;

}


/* =========================================================
   VENCEDOR
========================================================= */

function checkWinner() {

    if (!player1.dead && !player2.dead) {
        return;
    }

    gameRunning = false;

    let winner;

    if (player1.dead && player2.dead) {

        winner = "EMPATE!";

    } else if (player1.dead) {

        winner = "PLAYER 2 VENCEU!";

    } else {

        winner = "PLAYER 1 VENCEU!";

    }

    winnerText.textContent = winner;

    statusText.textContent = "FIM DE JOGO";

    gameOverScreen.classList.remove("hidden");

}


/* =========================================================
   REINICIAR
========================================================= */

function restartGame() {

    cancelAnimationFrame(animationId);

    player1.reset();
    player2.reset();

    boxes.forEach(box => {
        box.destroyed = false;
        box.health = 3;
    });

    spawnCrystals();

    particles = [];

    gameRunning = true;

    gameOverScreen.classList.add("hidden");

    statusText.textContent = "LUTE!";

    updateHUD();

    gameLoop();

}


/* =========================================================
   LOOP PRINCIPAL
========================================================= */

function gameLoop() {

    if (!gameRunning) {

        draw();

        return;

    }


    update();

    draw();

    animationId = requestAnimationFrame(gameLoop);

}


/* =========================================================
   UPDATE
========================================================= */

function update() {

    player1.update(
        controlsP1,
        player2
    );

    player2.update(
        controlsP2,
        player1
    );

    updateCrystals();

    updateParticles();

    updateHUD();

}


/* =========================================================
   DRAW
========================================================= */

function draw() {

    ctx.clearRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );

    drawBackground();

    drawPlatforms();

    drawBoxes();

    drawCrystals();

    player1.draw();

    player2.draw();

    drawParticles();

}


/* =========================================================
   EVENTOS
========================================================= */

restartButton.addEventListener(
    "click",
    restartGame
);

playAgain.addEventListener(
    "click",
    restartGame
);


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

createBackground();

createBoxes();

spawnCrystals();

updateHUD();

gameLoop();
