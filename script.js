<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PRO FOOTBALL 26</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Arial Black', Arial, sans-serif;
            overflow: hidden;
            background: #000;
        }

        #gameContainer {
            width: 100vw;
            height: 100vh;
            position: relative;
        }

        #titleScreen {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #000;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 10;
        }

        #titleText {
            font-size: 4rem;
            color: #0f0;
            text-shadow: 0 0 20px #0f0, 0 0 40px #0f0;
            letter-spacing: 8px;
            opacity: 0;
        }

        @keyframes fadeInOut {
            0% { opacity: 0; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { opacity: 0; }
        }

        .fade-animation {
            animation: fadeInOut 3s ease-in-out;
        }

        #renderCanvas {
            width: 100%;
            height: 100%;
            display: block;
        }

        #controls {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            color: #fff;
            font-size: 14px;
            text-align: center;
            background: rgba(0, 0, 0, 0.7);
            padding: 10px 20px;
            border-radius: 10px;
            z-index: 5;
        }

        @media (max-width: 768px) {
            #titleText {
                font-size: 2.5rem;
                letter-spacing: 4px;
            }
            
            #controls {
                font-size: 12px;
                padding: 8px 15px;
            }
        }
    </style>
</head>
<body>
    <div id="gameContainer">
        <div id="titleScreen">
            <div id="titleText">RED STUDIOS</div>
        </div>
        <canvas id="renderCanvas"></canvas>
        <div id="controls" style="display: none;">
            WASD: Move | SPACEBAR: Kick Ball
        </div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/tween.js/18.6.4/tween.umd.js"></script>

    <script>
        // Game state
        const gameState = {
            scene: 'title', // 'title' or 'game'
            keys: {},
            ballVelocity: { x: 0, y: 0, z: 0 }
        };

        // Three.js setup
        let scene, camera, renderer;
        let player, ball, pitch, playButton;
        const canvas = document.getElementById('renderCanvas');

        function initThreeJS() {
            // Scene
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x000000);

            // Camera
            camera = new THREE.PerspectiveCamera(
                75,
                window.innerWidth / window.innerHeight,
                0.1,
                1000
            );

            // Renderer
            renderer = new THREE.WebGLRenderer({ 
                canvas: canvas,
                antialias: true 
            });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }

        function createTitleScene() {
            // Lighting for title scene
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            scene.add(ambientLight);

            const pointLight = new THREE.PointLight(0x0f0, 1, 100);
            pointLight.position.set(0, 5, 5);
            scene.add(pointLight);

            // Create 3D PLAY button
            const buttonGeometry = new THREE.BoxGeometry(3, 1, 0.5);
            const buttonMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x00ff00,
                emissive: 0x00ff00,
                emissiveIntensity: 0.3
            });
            playButton = new THREE.Mesh(buttonGeometry, buttonMaterial);
            playButton.position.set(0, 0, 0);
            playButton.castShadow = true;
            playButton.visible = false;
            scene.add(playButton);

            // Add text to button using canvas texture
            const buttonCanvas = document.createElement('canvas');
            buttonCanvas.width = 512;
            buttonCanvas.height = 128;
            const ctx = buttonCanvas.getContext('2d');
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, 512, 128);
            ctx.fillStyle = '#0f0';
            ctx.font = 'bold 80px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('PLAY', 256, 64);

            const buttonTexture = new THREE.CanvasTexture(buttonCanvas);
            const textMaterial = new THREE.MeshBasicMaterial({ 
                map: buttonTexture,
                transparent: true
            });
            const textPlane = new THREE.Mesh(
                new THREE.PlaneGeometry(3, 0.75),
                textMaterial
            );
            textPlane.position.z = 0.26;
            playButton.add(textPlane);

            camera.position.set(0, 0, 8);
            camera.lookAt(0, 0, 0);
        }

        function createGameScene() {
            // Clear title scene
            if (playButton) {
                scene.remove(playButton);
                playButton = null;
            }
            scene.clear();

            // Lighting
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(10, 20, 10);
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = 2048;
            directionalLight.shadow.mapSize.height = 2048;
            scene.add(directionalLight);

            // Football pitch
            const pitchGeometry = new THREE.BoxGeometry(20, 0.2, 30);
            const pitchMaterial = new THREE.MeshStandardMaterial({ color: 0x00aa00 });
            pitch = new THREE.Mesh(pitchGeometry, pitchMaterial);
            pitch.receiveShadow = true;
            pitch.position.y = -0.1;
            scene.add(pitch);

            // Pitch lines
            const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
            
            // Center line
            const centerLine = new THREE.Mesh(
                new THREE.BoxGeometry(20, 0.21, 0.2),
                lineMaterial
            );
            centerLine.position.y = 0.01;
            scene.add(centerLine);

            // Goal lines
            const goalLine1 = new THREE.Mesh(
                new THREE.BoxGeometry(20, 0.21, 0.2),
                lineMaterial
            );
            goalLine1.position.set(0, 0.01, -14.9);
            scene.add(goalLine1);

            const goalLine2 = new THREE.Mesh(
                new THREE.BoxGeometry(20, 0.21, 0.2),
                lineMaterial
            );
            goalLine2.position.set(0, 0.01, 14.9);
            scene.add(goalLine2);

            // Red cube player
            const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
            const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
            player = new THREE.Mesh(playerGeometry, playerMaterial);
            player.position.set(0, 0.5, 10);
            player.castShadow = true;
            scene.add(player);

            // White sphere ball
            const ballGeometry = new THREE.SphereGeometry(0.4, 32, 32);
            const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
            ball = new THREE.Mesh(ballGeometry, ballMaterial);
            ball.position.set(0, 0.4, 8);
            ball.castShadow = true;
            scene.add(ball);

            // Camera position
            camera.position.set(0, 15, 20);
            camera.lookAt(0, 0, 0);

            // Reset ball velocity
            gameState.ballVelocity = { x: 0, y: 0, z: 0 };
        }

        // Title screen sequence
        function startTitleSequence() {
            const titleText = document.getElementById('titleText');
            
            // Show RED STUDIOS with fade animation
            titleText.textContent = 'RED STUDIOS';
            titleText.classList.add('fade-animation');

            // After 3 seconds, show PRO FOOTBALL 26
            setTimeout(() => {
                titleText.classList.remove('fade-animation');
                titleText.textContent = 'PRO FOOTBALL 26';
                titleText.style.opacity = '1';

                // Show PLAY button after title appears
                setTimeout(() => {
                    if (playButton) {
                        playButton.visible = true;
                        // Animate button appearing
                        playButton.position.y = -3;
                        new TWEEN.Tween(playButton.position)
                            .to({ y: -1 }, 1000)
                            .easing(TWEEN.Easing.Elastic.Out)
                            .start();
                    }
                }, 500);
            }, 3000);
        }

        // Handle play button interaction
        let isHoveringButton = false;
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        function onMouseMove(event) {
            if (gameState.scene !== 'title' || !playButton || !playButton.visible) return;

            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObject(playButton, true);

            if (intersects.length > 0) {
                if (!isHoveringButton) {
                    isHoveringButton = true;
                    document.body.style.cursor = 'pointer';
                    new TWEEN.Tween(playButton.position)
                        .to({ y: playButton.position.y + 0.3 }, 200)
                        .easing(TWEEN.Easing.Quadratic.Out)
                        .start();
                    new TWEEN.Tween(playButton.scale)
                        .to({ x: 1.1, y: 1.1, z: 1.1 }, 200)
                        .easing(TWEEN.Easing.Quadratic.Out)
                        .start();
                }
            } else {
                if (isHoveringButton) {
                    isHoveringButton = false;
                    document.body.style.cursor = 'default';
                    new TWEEN.Tween(playButton.position)
                        .to({ y: playButton.position.y - 0.3 }, 200)
                        .easing(TWEEN.Easing.Quadratic.Out)
                        .start();
                    new TWEEN.Tween(playButton.scale)
                        .to({ x: 1, y: 1, z: 1 }, 200)
                        .easing(TWEEN.Easing.Quadratic.Out)
                        .start();
                }
            }
        }

        function onMouseClick(event) {
            if (gameState.scene !== 'title' || !playButton || !playButton.visible) return;

            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObject(playButton, true);

            if (intersects.length > 0) {
                startGame();
            }
        }

        function startGame() {
            gameState.scene = 'game';
            document.getElementById('titleScreen').style.display = 'none';
            document.getElementById('controls').style.display = 'block';
            createGameScene();
        }

        // Keyboard controls
        function onKeyDown(event) {
            gameState.keys[event.key.toLowerCase()] = true;

            if (event.key === ' ' && gameState.scene === 'game') {
                event.preventDefault();
                kickBall();
            }
        }

        function onKeyUp(event) {
            gameState.keys[event.key.toLowerCase()] = false;
        }

        function kickBall() {
            if (!ball || !player) return;

            const dx = ball.position.x - player.position.x;
            const dz = ball.position.z - player.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            // Only kick if ball is close enough
            if (distance < 2) {
                const direction = new THREE.Vector3(dx, 0, dz).normalize();
                gameState.ballVelocity.x = direction.x * 0.3;
                gameState.ballVelocity.y = 0.2;
                gameState.ballVelocity.z = direction.z * 0.3;
            }
        }

        function updatePlayer(deltaTime) {
            if (!player) return;

            const speed = 0.1;
            let moved = false;

            if (gameState.keys['w']) {
                player.position.z -= speed;
                moved = true;
            }
            if (gameState.keys['s']) {
                player.position.z += speed;
                moved = true;
            }
            if (gameState.keys['a']) {
                player.position.x -= speed;
                moved = true;
            }
            if (gameState.keys['d']) {
                player.position.x += speed;
                moved = true;
            }

            // Keep player on pitch
            player.position.x = Math.max(-9, Math.min(9, player.position.x));
            player.position.z = Math.max(-14, Math.min(14, player.position.z));

            // Subtle rotation when moving
            if (moved) {
                player.rotation.y += 0.05;
            }
        }

        function updateBall(deltaTime) {
            if (!ball) return;

            // Apply velocity
            ball.position.x += gameState.ballVelocity.x;
            ball.position.y += gameState.ballVelocity.y;
            ball.position.z += gameState.ballVelocity.z;

            // Gravity
            gameState.ballVelocity.y -= 0.01;

            // Bounce on ground
            if (ball.position.y <= 0.4) {
                ball.position.y = 0.4;
                gameState.ballVelocity.y *= -0.6;
                gameState.ballVelocity.x *= 0.95;
                gameState.ballVelocity.z *= 0.95;

                // Stop if velocity is very low
                if (Math.abs(gameState.ballVelocity.y) < 0.02) {
                    gameState.ballVelocity.y = 0;
                }
            }

            // Friction
            gameState.ballVelocity.x *= 0.99;
            gameState.ballVelocity.z *= 0.99;

            // Keep ball on pitch
            if (Math.abs(ball.position.x) > 9.5) {
                ball.position.x = Math.sign(ball.position.x) * 9.5;
                gameState.ballVelocity.x *= -0.5;
            }
            if (Math.abs(ball.position.z) > 14.5) {
                ball.position.z = Math.sign(ball.position.z) * 14.5;
                gameState.ballVelocity.z *= -0.5;
            }

            // Rotate ball based on movement
            if (gameState.ballVelocity.x !== 0 || gameState.ballVelocity.z !== 0) {
                ball.rotation.x += gameState.ballVelocity.z * 0.5;
                ball.rotation.z -= gameState.ballVelocity.x * 0.5;
            }
        }

        // Animation loop
        function animate() {
            requestAnimationFrame(animate);

            TWEEN.update();

            if (gameState.scene === 'title') {
                // Gentle rotation for play button
                if (playButton && playButton.visible) {
                    playButton.rotation.y += 0.005;
                }
            } else if (gameState.scene === 'game') {
                updatePlayer();
                updateBall();
            }

            renderer.render(scene, camera);
        }

        // Window resize
        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        // Initialize
        function init() {
            initThreeJS();
            createTitleScene();
            startTitleSequence();

            window.addEventListener('resize', onWindowResize);
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('click', onMouseClick);
            window.addEventListener('keydown', onKeyDown);
            window.addEventListener('keyup', onKeyUp);

            // Touch support for mobile
            canvas.addEventListener('touchstart', (e) => {
                const touch = e.touches[0];
                const mouseEvent = new MouseEvent('click', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
                onMouseClick(mouseEvent);
            });

            animate();
        }

        // Start the game when page loads
        window.addEventListener('load', init);
    </script>
</body>
</html>