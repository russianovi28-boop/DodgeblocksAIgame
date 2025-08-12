(() => {
  const menu = document.getElementById('menu');
  const startBtn = document.getElementById('start-btn');
  const musicBtn = document.getElementById('music-btn');
  const gameContainer = document.getElementById('game-container');
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  const scoreEl = document.getElementById('score');
  const pauseBtn = document.getElementById('pause-btn');
  const restartBtn = document.getElementById('restart-btn');
  const gameOverEl = document.getElementById('game-over');
  const gameoverRestartBtn = document.getElementById('gameover-restart-btn');

  const bgMusic = document.getElementById('bg-music');
  bgMusic.volume = 0.25;

  let musicOn = true;
  let paused = false;
  let gameOver = false;

  function resizeCanvas() {
    canvas.width = gameContainer.clientWidth;
    canvas.height = gameContainer.clientHeight;
  }

  window.addEventListener('resize', () => {
    if (gameContainer.style.display !== 'none') {
      resizeCanvas();
      resetPlayer();
    }
  });

  const player = {
    w: 50,
    h: 50,
    x: 0,
    y: 0,
    speed: 7,
    dx: 0,
    color: '#f6d365',
  };

  let blocks = [];
  const blockW = 50;
  const blockH = 50;
  let blockSpeed = 4;
  let spawnTimer = 0;
  let spawnInterval = 1000;

  let score = 0;
  const keys = { left: false, right: false };

  function resetPlayer() {
    player.x = (canvas.width - player.w) / 2;
    player.y = canvas.height - player.h - 20;
    player.dx = 0;
    player.speed = 7;
  }

  function resetGame() {
    resetPlayer();
    blocks = [];
    blockSpeed = 4;
    spawnInterval = 1000;
    spawnTimer = 0;
    score = 0;
    gameOver = false;
    paused = false;
    updateScore();
    gameOverEl.style.display = 'none';
    pauseBtn.textContent = 'Pause';
    requestAnimationFrame(gameLoop);
  }

  function updateScore() {
    scoreEl.textContent = `Score: ${score}`;
  }

  function spawnBlock() {
    const x = Math.random() * (canvas.width - blockW);
    blocks.push({ x, y: -blockH, w: blockW, h: blockH, color: `hsl(${Math.random() * 360}, 70%, 70%)` });
  }

  function colliding(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  let lastTime = 0;
  function update(time = 0) {
    if (paused || gameOver) return;

    const delta = time - lastTime;
    lastTime = time;

    player.x += player.dx;
    if (player.x < 0) player.x = 0;
    if (player.x + player.w > canvas.width) player.x = canvas.width - player.w;

    spawnTimer += delta;
    if (spawnTimer > spawnInterval) {
      const maxBlocks = Math.min(1 + Math.floor((1000 - spawnInterval) / 200), 4);
      for (let i = 0; i < maxBlocks; i++) spawnBlock();

      spawnTimer = 0;
      if (spawnInterval > 300) spawnInterval -= 15;
      if (blockSpeed < 12) blockSpeed += 0.2;
      if (player.speed > 3) player.speed -= 0.03;
      if (keys.left && !keys.right) player.dx = -player.speed;
      if (keys.right && !keys.left) player.dx = player.speed;
    }

    for (let i = blocks.length - 1; i >= 0; i--) {
      blocks[i].y += blockSpeed;
      if (blocks[i].y > canvas.height) {
        blocks.splice(i, 1);
        score++;
        updateScore();
        continue;
      }
      if (colliding(player, blocks[i])) {
        gameOver = true;
        gameOverEl.style.display = 'block';
        break;
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = player.color;
    ctx.shadowColor = 'rgba(246,211,101,0.9)';
    ctx.shadowBlur = 20;
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.shadowBlur = 0;

    blocks.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 15;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.shadowBlur = 0;
    });
  }

  function gameLoop(time = 0) {
    if (gameOver || paused) {
      draw();
      return;
    }
    update(time);
    draw();
    requestAnimationFrame(gameLoop);
  }

  window.addEventListener('keydown', e => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      keys.left = true;
      player.dx = -player.speed;
    }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      keys.right = true;
      player.dx = player.speed;
    }
  });
  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      keys.left = false;
      if (!keys.right) player.dx = 0;
      else player.dx = player.speed;
    }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      keys.right = false;
      if (!keys.left) player.dx = 0;
      else player.dx = -player.speed;
    }
  });

  pauseBtn.addEventListener('click', () => {
    if (gameOver) return;
    paused = !paused;
    pauseBtn.textContent = paused ? 'Resume' : 'Pause';
    if (!paused) requestAnimationFrame(gameLoop);
  });

  restartBtn.addEventListener('click', resetGame);
  gameoverRestartBtn.addEventListener('click', resetGame);

  startBtn.addEventListener('click', () => {
    menu.style.display = 'none';
    gameContainer.style.display = 'block';
    resizeCanvas();
    resetGame();
    if (musicOn) bgMusic.play();
  });

  musicBtn.addEventListener('click', () => {
    musicOn = !musicOn;
    if (musicOn) {
      bgMusic.play();
      musicBtn.textContent = 'Music: On';
    } else {
      bgMusic.pause();
      musicBtn.textContent = 'Music: Off';
    }
  });
})();
