// 立即执行函数
(function() {
    // 获取必要的DOM元素
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const startButton = document.getElementById('startButton');
    
    // 创建足球图片对象
    const footballImage = new Image();
    
    // 游戏状态
    let gameState = {
        player: { x: 0, y: 0 },
        teammate: { x: 0, y: 0, visible: false },
        ball: { x: 0, y: 0, moving: false },
        positions: [],
        showPositions: true,
        gameStarted: false
    };

    // 等待图片加载完成
    footballImage.onload = function() {
        console.log('Football image loaded successfully');
        // 图片加载完成后，确保按钮可用
        startButton.disabled = false;
        
        // 如果游戏已经开始，立即开始绘制
        if (gameState.gameStarted) {
            gameLoop();
        }
    };

    // 设置图片源
    footballImage.src = encodeURI('./足球.png');

    // 设置画布大小
    function resizeCanvas() {
        const displayWidth = window.innerWidth;
        const displayHeight = window.innerHeight;
        
        // 设置画布的显示大小
        canvas.style.width = displayWidth + 'px';
        canvas.style.height = displayHeight + 'px';
        
        // 设置画布的实际大小
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        
        // 更新玩家位置
        gameState.player.x = displayWidth / 2;
        gameState.player.y = displayHeight / 2;
    }

    // 初始化点位系统
    function initPositions() {
        const layers = 3; // 圆形层数
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const baseRadius = Math.min(canvas.width, canvas.height) / 6; // 根据画布大小调整半径
        
        gameState.positions = [];
        
        for (let layer = 1; layer <= layers; layer++) {
            const radius = layer * baseRadius; // 每层半径
            const points = layer * 8; // 每层点位数
            for (let i = 0; i < points; i++) {
                const angle = (i / points) * Math.PI * 2;
                gameState.positions.push({
                    x: centerX + Math.cos(angle) * radius,
                    y: centerY + Math.sin(angle) * radius
                });
            }
        }
    }

    // 绘制脚印
    function drawFootprints(x, y, color) {
        ctx.save();
        ctx.font = '60px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = color;
        ctx.fillText('👣', x, y);
        ctx.restore();
    }

    // 随机选择队友位置
    function setRandomTeammatePosition() {
        const randomIndex = Math.floor(Math.random() * gameState.positions.length);
        gameState.teammate.x = gameState.positions[randomIndex].x;
        gameState.teammate.y = gameState.positions[randomIndex].y;
        console.log('Teammate position set to:', gameState.teammate.x, gameState.teammate.y);
    }

    // 绘制足球
    function drawBall(x, y, alpha = 1) {
        ctx.save();
        ctx.globalAlpha = alpha;
        const size = 40; // 增大足球尺寸
        try {
            ctx.drawImage(
                footballImage, 
                x - size/2,  // 居中显示
                y - 40,      // 向上偏移到脚印前方
                size, 
                size
            );
            console.log('Drawing ball at:', x, y);
        } catch (error) {
            console.error('Error drawing ball:', error);
        }
        ctx.restore();
    }

    // 球的移动动画
    function animateBall() {
        let progress = 0;
        const startX = gameState.player.x;
        const startY = gameState.player.y;
        const targetX = gameState.teammate.x;
        const targetY = gameState.teammate.y;
        gameState.ball.moving = true;

        function animate() {
            if (progress >= 1) {
                gameState.ball.moving = false;
                // 确保球停在队友位置
                gameState.ball.x = targetX;
                gameState.ball.y = targetY;
                return;
            }

            progress += 0.01; // 慢速移动
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            gameState.ball.x = startX + (targetX - startX) * easeProgress;
            gameState.ball.y = startY + (targetY - startY) * easeProgress;

            requestAnimationFrame(animate);
        }

        animate();
    }

    // 添加点位震动动画函数
    function shakePosition(x, y) {
        let shakeCount = 0;
        const maxShakes = 6;
        const shakeOffset = 5;
        let currentX = x;

        function shake() {
            if (shakeCount >= maxShakes) return;

            shakeCount++;
            // 左右震动
            currentX = x + (shakeCount % 2 ? shakeOffset : -shakeOffset);

            // 绘制震动的点位
            ctx.beginPath();
            ctx.arc(currentX, y, 12, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 99, 71, 0.6)'; // 使用红色表示错误
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 99, 71, 0.8)';
            ctx.stroke();

            requestAnimationFrame(shake);
        }

        shake();
    }

    // 添加庆祝动画函数
    function celebrateSuccess() {
        let particles = [];
        const particleCount = 50;
        const colors = ['#FFD700', '#FF6B6B', '#4CAF50', '#64B5F6', '#BA68C8'];

        // 创建粒子
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: gameState.teammate.x,
                y: gameState.teammate.y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 4) * 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 8 + 4,
                life: 1
            });
        }

        function animateParticles() {
            if (particles.length === 0) return;

            particles.forEach((p, index) => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.2; // 重力效果
                p.life -= 0.02;

                if (p.life > 0) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fillStyle = p.color + Math.floor(p.life * 255).toString(16).padStart(2, '0');
                    ctx.fill();
                } else {
                    particles.splice(index, 1);
                }
            });

            if (particles.length > 0) {
                requestAnimationFrame(animateParticles);
            }
        }

        animateParticles();
    }

    // 修改显示文本框函数
    function showMessage(text) {
        let opacity = 0;
        const targetOpacity = 1;
        const fadeSpeed = 0.05;

        // 创建返回按钮
        function createReturnButton() {
            const button = document.createElement('button');
            button.textContent = '返回';
            button.style.cssText = `
                position: fixed;
                top: ${canvas.height / 4 + 80}px;
                left: 50%;
                transform: translateX(-50%);
                padding: 10px 30px;
                font-size: 18px;
                background: #4CAF50;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                z-index: 100;
            `;
            
            // 添加点击事件
            button.addEventListener('click', function() {
                // 重置游戏状态
                gameState = {
                    player: { x: canvas.width / 2, y: canvas.height / 2 },
                    teammate: { x: 0, y: 0, visible: false },
                    ball: { x: 0, y: 0, moving: false },
                    positions: [],
                    showPositions: true,
                    gameStarted: true
                };
                
                // 重新初始化点位
                initPositions();
                setRandomTeammatePosition();
                
                // 移除按钮和文本框
                document.body.removeChild(button);
                
                // 重新开始游戏循环
                gameLoop();
            });

            document.body.appendChild(button);
        }

        function animate() {
            if (opacity >= targetOpacity) {
                createReturnButton();
                return;
            }

            opacity += fadeSpeed;
            
            requestAnimationFrame(animate);
        }

        // 持续绘制文本框的函数
        function drawMessageBox() {
            // 文本框背景
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            const padding = 20;
            ctx.font = 'bold 36px Arial'; // 需要在测量文本前设置字体
            const textWidth = ctx.measureText(text).width;
            const boxWidth = textWidth + padding * 2;
            const boxHeight = 60;
            const boxX = (canvas.width - boxWidth) / 2;
            const boxY = canvas.height / 4;
            
            ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 10);
            ctx.fill();

            // 文本
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, canvas.width / 2, boxY + boxHeight / 2);
            ctx.restore();
        }

        // 修改游戏循环，添加文本框的持续绘制
        const originalGameLoop = gameLoop;
        gameLoop = function() {
            drawGame();
            drawMessageBox();
            requestAnimationFrame(gameLoop);
        };

        animate();
    }

    // 修改点击事件处理函数
    function handleClick(e) {
        if (!gameState.showPositions) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);

        // 检查是否点击在正确位置附近
        const distance = Math.sqrt(
            Math.pow(x - gameState.teammate.x, 2) + 
            Math.pow(y - gameState.teammate.y, 2)
        );

        if (distance < 50) { // 正确点击
            console.log('Correct position clicked!');
            gameState.teammate.visible = true;
            gameState.showPositions = false;
            
            // 设置球的初始位置并开始动画
            gameState.ball.x = gameState.player.x;
            gameState.ball.y = gameState.player.y;
            
            // 播放庆祝动画
            celebrateSuccess();
            
            // 开始球的移动动画
            animateBall();
            
            // 球的动画结束后显示消息和返回按钮
            setTimeout(() => {
                showMessage('NICE HIT!');
            }, 1000);
        } else {
            // 查找点击的是哪个点位
            gameState.positions.forEach(pos => {
                const clickedDistance = Math.sqrt(
                    Math.pow(x - pos.x, 2) + 
                    Math.pow(y - pos.y, 2)
                );
                if (clickedDistance < 20) {
                    shakePosition(pos.x, pos.y);
                }
            });
        }
    }

    // 绘制游戏
    function drawGame() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 绘制点位系统
        if (gameState.showPositions) {
            gameState.positions.forEach(pos => {
                // 绘制连接线
                ctx.beginPath();
                ctx.moveTo(gameState.player.x, gameState.player.y);
                ctx.lineTo(pos.x, pos.y);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.stroke();

                // 绘制点位标记
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.stroke();
            });
        }

        // 绘制玩家脚印
        drawFootprints(gameState.player.x, gameState.player.y, '#ffffff');

        // 如果队友可见，绘制队友脚印
        if (gameState.teammate.visible) {
            drawFootprints(gameState.teammate.x, gameState.teammate.y, '#000000');
        }

        // 绘制球和拖影
        if (gameState.ball.moving) {
            // 绘制拖影
            const trailCount = 8;
            for (let i = 0; i < trailCount; i++) {
                const trailAlpha = 0.3 * (1 - i / trailCount);
                const trailX = gameState.ball.x - (i * (gameState.ball.x - gameState.player.x) / trailCount);
                const trailY = gameState.ball.y - (i * (gameState.ball.y - gameState.player.y) / trailCount);
                drawBall(trailX, trailY, trailAlpha);
            }
            // 绘制当前球的位置
            drawBall(gameState.ball.x, gameState.ball.y, 1);
        } else if (gameState.teammate.visible) {
            // 如果队友可见且球不在移动，在队友脚印前方绘制球
            drawBall(gameState.teammate.x, gameState.teammate.y, 1);
        } else {
            // 在玩家脚印前方绘制球
            drawBall(gameState.player.x, gameState.player.y, 1);
        }
    }

    // 游戏循环
    function gameLoop() {
        drawGame();
        requestAnimationFrame(gameLoop);
    }

    // 初始化游戏
    function initGame() {
        console.log('Game initialized');
        startButton.style.display = 'none';
        gameState.gameStarted = true;
        
        resizeCanvas();
        initPositions();
        setRandomTeammatePosition();
        
        // 添加点击事件监听器
        canvas.addEventListener('click', handleClick);
        
        // 如果图片已加载完成，开始游戏循环
        if (footballImage.complete) {
            gameLoop();
        }
    }

    // 添加事件监听器
    window.addEventListener('load', function() {
        console.log('Window loaded');
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        // 直接添加点击事件，不需要等待图片加载
        startButton.addEventListener('click', function() {
            console.log('Start button clicked');
            initGame();
        });
    });

    console.log('Script loaded');
})(); 