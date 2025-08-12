const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth * 0.9;
canvas.height = window.innerHeight * 0.8;

let keys = {};
let gameOver = false;
let paused = false;

let lastTime = 0;
let spawnTimer = 0;
let spawnInterval = 600; // spawn interval (ms), faster from start
let blockSpeed = 8;      // block falling speed from start
let blocks = [];

let powerUp = null;
let powerUpTimer = 0;
let nextPowerUpSpawn = randomRange(5000, 15000); // 5-15 seconds
let powerUpActive = false;
let powerUpDuration = 5000; // 5 seconds
let powerUpEndTime = 0;

const player = {
  w: 50,
  h: 50,
  x: canvas.width / 2 - 25,
  y: canvas.height - 60,
  speed: 5,
  baseSpeed: 5,
  dx: 0,
  color: '#f6d365',
};

function randomRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function spawnBlock() {
  const size = randomRange(20, 50);
  const x = randomRange(0, canvas.width - size);
  blocks.push({ x, y: -size, w: size, h: size, speed: blockSpeed, color: '#fc4a1a' });
}

function spawnPowerUp() {
  console.log('Power-up spawned!');
  const size = 50;
  const x = randomRange(0, canvas.width - size);
  const y = canvas.height - size - 10; // 10 px above bottom edge
  powerUp = { x, y, w: size, h: size, speed: 0, color: '#4ade80', spawnTime: performance.now() };
  playBeep();
}

function playBeep() {
  try {
    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
    oscillator.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.15);
  } catch {
    // ignore if not supported
  }
}

function drawRect(obj) {
  ctx.fillStyle = obj.color;
  ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
}

function drawPowerUp(obj, time) {
  const pulse = 0.5 + 0.5 * Math.sin(time / 200);
  ctx.shadowColor = `rgba(74, 222, 128, ${pulse})`;
  ctx.shadowBlur = 20 * pulse;
  ctx.fillStyle = obj.color;
  ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
  ctx.shadowBlur = 0;
}

function update(time = 0) {
  if (paused || gameOver) return;
  const delta = time - lastTime;
  lastTime = time;

  // Move player
  player.x += player.dx;
  if (player.x < 0) player.x = 0;
  if (player.x + player.w > canvas.width) player.x = canvas.width - player.w;

  // Spawn blocks multiple times quickly (hard from start)
  spawnTimer += delta;
  if (spawnTimer > spawnInterval) {
    for (let i = 0; i < 3; i++) spawnBlock();
    spawnTimer = 0;

    // Slightly increase difficulty over time
    if (spawnInterval > 300) spawnInterval -= 10;
    if (blockSpeed < 15) blockSpeed += 0.2;
    if (player.speed > 3) player.speed -= 0.01;
  }

  // Update blocks
  for (let i = blocks.length - 1; i >= 0; i--) {
    const b = blocks[i];
    b.y += b.speed;

    // Remove blocks that fall out
    if (b.y > canvas.height) blocks.splice(i, 1);

    // Check collision with player -> game over
    if (
      b.x < player.x + player.w &&
      b.x + b.w > player.x &&
      b.y < player.y + player.h &&
      b.h + b.y > player.y
    ) {
      gameOver = true;
    }
  }

  // Power-up spawn timer
  powerUpTimer += delta;
  if (!powerUp && powerUpTimer > nextPowerUpSpawn) {
    spawnPowerUp();
    powerUpTimer = 0;
    nextPowerUpSpawn = randomRange(5000, 15000);
  }

  // Power-up despawn logic after 5 seconds if not collected
  if (powerUp && (time - powerUp.spawnTime > 5000)) {
    powerUp = null;
  }

  // Check collision with player -> activate power-up
  if (powerUp &&
      powerUp.x < player.x + player.w &&
      powerUp.x + powerUp.w > player.x &&
      powerUp.y < player.y + player.h &&
      powerUp.h + powerUp.y > player.y) {
    powerUp = null;
    powerUpActive = true;
    powerUpEndTime = time + powerUpDuration;
    player.speed = player.baseSpeed * 1.5;
  }

  // Check if power-up duration ended
  if (powerUpActive && time > powerUpEndTime) {
    powerUpActive = false;
    player.speed = player.baseSpeed;
  }

  // Set player horizontal speed based on keys
  if (keys.left && !keys.right) player.dx = -player.speed;
  else if (keys.right && !keys.left) player.dx = player.speed;
  else player.dx = 0;

  draw(time);
  requestAnimationFrame(update);
}

function draw(time = 0) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw player
  drawRect(player);

  // Draw blocks
  blocks.forEach(drawRect);

  // Draw power-up with glow if present
  if (powerUp) drawPowerUp(powerUp, time);

  // Draw UI
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.fillText(`Game ${gameOver ? 'Over!' : powerUpActive ? 'Speed Boost Active!' : ''}`, 10, 30);
  if (gameOver) {
    ctx.fillText('Press R to Restart', 10, 60);
  }
}

function restartGame() {
  blocks = [];
  gameOver = false;
  spawnTimer = 0;
  spawnInterval = 600;
  blockSpeed = 8;
  player.speed = player.baseSpeed;
  player.x = canvas.width / 2 - player.w / 2;
  powerUp = null;
  powerUpTimer = 0;
  powerUpActive = false;
  lastTime = 0;
  update();
}

window.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (e.key.toLowerCase() === 'r' && gameOver) restartGame();
  if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
  if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
});

window.addEventListener('keyup', e => {
  keys[e.key] = false;
  if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
  if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
});

// Start game
restartGame();
