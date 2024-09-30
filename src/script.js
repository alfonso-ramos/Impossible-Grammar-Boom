// Definimos las conjugaciones y niveles del juego con más palabras incorrectas por nivel
const verbLevels = [
    { verb: 'play', correctConjugations: ['played', 'playing', 'plays'], incorrectConjugations: ['playes', 'plaied', 'pleyd'] },
    { verb: 'walk', correctConjugations: ['walked', 'walking', 'walks'], incorrectConjugations: ['walkes', 'walkedh', 'wolked'] },
    { verb: 'jump', correctConjugations: ['jumped', 'jumping', 'jumps'], incorrectConjugations: ['jumpes', 'jmping', 'jumpted'] },
    { verb: 'look', correctConjugations: ['looked', 'looking', 'looks'], incorrectConjugations: ['lookes', 'lookede', 'luked'] },
    { verb: 'talk', correctConjugations: ['talked', 'talking', 'talks'], incorrectConjugations: ['talkes', 'talkined', 'tulks'] },
    { verb: 'go', correctConjugations: ['went', 'going', 'goes'], incorrectConjugations: ['goin', 'wented', 'goed'] },
    { verb: 'see', correctConjugations: ['saw', 'seeing', 'sees'], incorrectConjugations: ['seens', 'sawe', 'seenig'] },
    { verb: 'come', correctConjugations: ['came', 'coming', 'comes'], incorrectConjugations: ['comed', 'comies', 'commed'] },
    { verb: 'take', correctConjugations: ['took', 'taking', 'takes'], incorrectConjugations: ['taked', 'toking', 'takess'] },
    { verb: 'make', correctConjugations: ['made', 'making', 'makes'], incorrectConjugations: ['maked', 'moking', 'mades'] }
];

// Posiciones fijas para las palabras en la pantalla
const wordPositions = [
    { x: 100, y: 300 },
    { x: 300, y: 300 },
    { x: 500, y: 300 },
    { x: 700, y: 300 },
    { x: 200, y: 450 },
    { x: 400, y: 450 },
    { x: 600, y: 450 }
];

// Código Konami: arriba, arriba, abajo, abajo, izquierda, derecha, izquierda, derecha, B, A
const konamiCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
let konamiCodePosition = 0;

// Escena del menú principal
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    preload() {
        this.load.image('sky', 'assets/sky.png');
        this.load.image('ground', 'assets/platform.png');
        this.load.image('bomb', 'assets/bomb.png');
        this.load.image('logo', 'assets/grammar-boom.png'); // Cargar la imagen del logo

        // Cargar el personaje Pink Monster
        this.load.spritesheet('idle', 'assets/Pink_Monster_Idle_4.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('run', 'assets/Pink_Monster_Run_6.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('jump', 'assets/Pink_Monster_Jump_8.png', { frameWidth: 32, frameHeight: 32 });
    }   

    create() {
        this.add.image(400, 300, 'sky');
        this.add.image(150, 250, 'logo').setScale(0.9); // Posicionar el logo en el menú principal
        this.add.text(300, 200, 'Menu Principal', { fontSize: '32px', fill: '#fff', fontFamily: 'Arial' });

        var startButton = this.add.text(350, 300, 'Start Game', { fontSize: '24px', fill: '#fff', fontFamily: 'Arial' })
            .setInteractive()
            .on('pointerdown', () => this.startGame());

        // Detectar el código Konami en el menú principal
        this.input.keyboard.on('keydown', (event) => {
            if (event.keyCode === konamiCode[konamiCodePosition]) {
                konamiCodePosition++;
                if (konamiCodePosition === konamiCode.length) {
                    konamiCodePosition = 0;
                    // Código Konami completado, ir a la pantalla de felicitación
                    this.scene.start('EndScene', { score: 1000 }); // Ir a la pantalla final con un puntaje alto
                }
            } else {
                konamiCodePosition = 0; // Reiniciar si el código no se sigue correctamente
            }
        });
    }

    startGame() {
        this.scene.start('GameScene');
    }
}

// Escena del juego principal
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.currentLevel = 0;
        this.score = 0;
    }

    preload() {
        this.load.image('sky', 'assets/sky.png');
        this.load.image('ground', 'assets/platform.png');
        this.load.image('bomb', 'assets/bomb.png');
    }

    create() {
        // Crear pantalla de transición para el nivel
        this.levelTransitionScreen = this.add.text(400, 300, '', { fontSize: '48px', fill: '#000', fontFamily: 'Arial' }).setOrigin(0.5);
        this.levelTransitionScreen.setDepth(1); // Asegurar que la transición esté por encima
        this.levelTransitionScreen.visible = false;

        // Inicializar el grupo de conjugaciones y bombas
        this.conjugations = this.physics.add.group();
        this.bombs = this.physics.add.group();

        // Fondo de pantalla y plataformas
        this.add.image(400, 300, 'sky');
        this.createPlatforms();

        // Jugador con el personaje Pink Monster
        this.player = this.physics.add.sprite(600, 150, 'idle'); // Posición inicial en la plataforma superior derecha
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);

        // Animaciones del personaje Pink Monster
        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('idle', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'run',
            frames: this.anims.generateFrameNumbers('run', { start: 0, end: 5 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'jump',
            frames: this.anims.generateFrameNumbers('jump', { start: 0, end: 7 }),
            frameRate: 10,
            repeat: -1
        });

        this.physics.add.collider(this.player, this.platforms);

        // Controles
        this.cursors = this.input.keyboard.createCursorKeys();

        // Inicializar el texto del nivel y el puntaje
        this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#000', fontFamily: 'Arial' });
        this.levelText = this.add.text(16, 50, 'Level: 1', { fontSize: '32px', fill: '#000', fontFamily: 'Arial' });

        // Mostrar pantalla de transición y pausar
        this.showLevelTransition();

        // Configurar colisiones y físicas
        this.physics.add.collider(this.bombs, this.platforms);
        this.physics.add.collider(this.player, this.bombs, this.hitBomb, null, this);
    }

    showLevelTransition() {
        this.physics.pause(); // Pausar el juego
        this.levelTransitionScreen.setText(`Level ${this.currentLevel + 1}`);
        this.levelTransitionScreen.visible = true;

        setTimeout(() => {
            this.levelTransitionScreen.visible = false;
            this.physics.resume(); // Reanudar el juego

            // Reubicar el personaje en la posición inicial
            this.player.setPosition(600, 150); // Posición inicial en la plataforma superior derecha
            this.createConjugations(); // Crear conjugaciones

            // Si el nivel es 5 o superior, crear bombas adicionales
            if (this.currentLevel >= 5) {
                this.createBomb();
            }
        }, 2000); // Mostrar la pantalla por 2 segundos
    }

    createPlatforms() {
        // Crear plataformas con separación vertical y horizontal
        this.platforms = this.physics.add.staticGroup();

        this.platforms.create(400, 568, 'ground').setScale(0.7).refreshBody();
        this.platforms.create(600, 450, 'ground').setScale(0.7).refreshBody();
        this.platforms.create(200, 350, 'ground').setScale(0.7).refreshBody();
        this.platforms.create(750, 300, 'ground').setScale(0.7).refreshBody();
        this.platforms.create(50, 220, 'ground').setScale(0.7).refreshBody();
        this.platforms.create(600, 150, 'ground').setScale(0.7).refreshBody(); // Plataforma superior derecha
    }

    createConjugations() {
        // Eliminar el grupo anterior de conjugaciones y texto del verbo si existen
        this.conjugations.clear(true, true);

        if (this.verbText) {
            this.verbText.destroy();
        }

        // Cargar el verbo y conjugaciones del nivel actual
        const levelData = verbLevels[this.currentLevel];
        const { verb, correctConjugations, incorrectConjugations } = levelData;

        // Combinar correctas e incorrectas y barajar el orden
        const allConjugations = [...correctConjugations, ...incorrectConjugations];
        Phaser.Utils.Array.Shuffle(allConjugations); // Barajar el orden de las conjugaciones

        // Mostrar el verbo en la parte superior
        this.verbText = this.add.text(300, 100, 'Verb: ' + verb, { fontSize: '32px', fill: '#000', fontFamily: 'Arial' });

        for (let i = 0; i < allConjugations.length; i++) {
            if (i >= wordPositions.length) break; // Evitar desbordar las posiciones

            const { x, y } = wordPositions[i]; // Tomar una posición fija
            const conjugationText = this.add.text(x, y, allConjugations[i], { fontSize: '24px', fill: '#000', fontFamily: 'Arial' });
            this.conjugations.add(conjugationText);

            // Aplicar físicas a cada conjugación
            this.physics.add.existing(conjugationText);
            conjugationText.body.setCollideWorldBounds(true);
            conjugationText.body.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8)); // Añadir rebote

            // Marcar si la conjugación es correcta o incorrecta
            conjugationText.isCorrect = correctConjugations.includes(allConjugations[i]);
        }

        this.physics.add.collider(this.conjugations, this.platforms);
        this.physics.add.overlap(this.player, this.conjugations, this.collectConjugation, null, this);
    }

    createBomb() {
        // Crear una bomba en una posición aleatoria, asegurando que no esté en la misma posición que el jugador ni cerca
        let x;
        do {
            x = Phaser.Math.Between(50, 750); // Rango de posición X, evitar los extremos
        } while (Math.abs(x - this.player.x) < 100); // Asegurar que la bomba no esté cerca del jugador

        var bomb = this.bombs.create(x, 16, 'bomb'); // Crear la bomba
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
    }

    update() {
        // Control del movimiento del personaje
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-160);
            this.player.anims.play('run', true);
            this.player.flipX = true; // Invertir al moverse a la izquierda
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(160);
            this.player.anims.play('run', true);
            this.player.flipX = false; // Restablecer al moverse a la derecha
        } else {
            this.player.setVelocityX(0);
            this.player.anims.play('idle');
        }

        if (this.cursors.up.isDown && this.player.body.touching.down) {
            this.player.setVelocityY(-330);
            this.player.anims.play('jump');
        }
    }

    collectConjugation(player, conjugation) {
        conjugation.destroy(); // Elimina la conjugación tomada

        if (!conjugation.isCorrect) {
            // Si es una conjugación incorrecta, termina el juego
            this.scene.start('GameOverScene', { score: this.score });
        } else {
            // Incrementar la puntuación solo si es una conjugación correcta
            this.score += 10;
            this.scoreText.setText('Score: ' + this.score);

            // Verificar si todas las conjugaciones correctas fueron recolectadas
            const correctLeft = this.conjugations.getChildren().filter(c => c.isCorrect).length;
            if (correctLeft === 0) { // Si no quedan correctas
                // Pasar al siguiente nivel
                this.nextLevel();
            }
        }
    }

    nextLevel() {
        this.currentLevel++;
        this.levelText.setText('Level: ' + (this.currentLevel + 1)); // Actualizar el nivel en pantalla
        if (this.currentLevel < verbLevels.length) {
            this.showLevelTransition(); // Mostrar pantalla de transición
        } else {
            // Si se completan todos los niveles, finalizar el juego y mostrar pantalla de felicitación
            this.scene.start('EndScene', { score: this.score });
        }
    }

    hitBomb(player, bomb) {
        this.physics.pause();
        player.setTint(0xff0000);
        player.anims.play('idle');
        this.scene.start('GameOverScene', { score: this.score });
    }
}

// Escena de pantalla final
class EndScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EndScene' });
    }

    create(data) {
        this.add.image(400, 300, 'sky');
        this.add.image(150, 250, 'logo').setScale(0.9); // Posicionar el logo en la pantalla final
        this.add.text(300, 200, 'Congratulations!', { fontSize: '48px', fill: '#fff', fontFamily: 'Arial' });
        this.add.text(300, 300, 'Final Score: ' + data.score, { fontSize: '32px', fill: '#fff', fontFamily: 'Arial' });

        var nextButton = this.add.text(300, 400, 'Menu Principal', { fontSize: '24px', fill: '#fff', fontFamily: 'Arial' })
            .setInteractive()
            .on('pointerdown', () => {
                this.scene.start('MenuScene'); // Regresar al menú principal
            });
    }
}

// Escena de Game Over
class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    create(data) {
        this.add.image(400, 300, 'sky');
        this.add.image(150, 250, 'logo').setScale(0.5); // Posicionar el logo en la pantalla de Game Over
        this.add.text(300, 200, 'Game Over', { fontSize: '32px', fill: '#fff', fontFamily: 'Arial' });
        this.add.text(300, 250, 'Score: ' + data.score, { fontSize: '24px', fill: '#fff', fontFamily: 'Arial' });

        var restartButton = this.add.text(300, 350, 'Restart', { fontSize: '24px', fill: '#fff', fontFamily: 'Arial' })
            .setInteractive()
            .on('pointerdown', () => {
                this.scene.stop('GameScene');
                this.scene.start('GameScene');
                this.scene.get('GameScene').currentLevel = 0; // Reiniciar al nivel 1
                this.scene.get('GameScene').score = 0; // Reiniciar el puntaje
            });

        var menuButton = this.add.text(300, 400, 'Menu Principal', { fontSize: '24px', fill: '#fff', fontFamily: 'Arial' })
            .setInteractive()
            .on('pointerdown', () => {
                this.scene.stop('GameScene');
                this.scene.start('MenuScene');
                this.scene.get('GameScene').currentLevel = 0; // Reiniciar al nivel 1
                this.scene.get('GameScene').score = 0; // Reiniciar el puntaje
            });
    }
}

// Configuración del juego
var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: [MenuScene, GameScene, GameOverScene, EndScene]
};

// Inicialización del juego
var game = new Phaser.Game(config);
