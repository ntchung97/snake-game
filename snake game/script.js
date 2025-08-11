// Snake game - vanilla JS, canvas
(() => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  // HUD
  const scoreEl = document.getElementById("score");
  const speedEl = document.getElementById("speed");
  const btnStart = document.getElementById("btnStart");
  const btnPause = document.getElementById("btnPause");
  const btnReset = document.getElementById("btnReset");
  const touchControls = document.getElementById("touchControls");

  // logical grid size (tiles)
  const TILE_SIZE = 20; // px per tile, canvas pixel size will be multiple of this
  let cols, rows;

  // game state
  let snake = [];
  let dir = { x: 1, y: 0 }; // start moving right
  let nextDir = { x: 1, y: 0 };
  let food = null;
  let score = 0;
  let speed = 6; // tiles per second
  let tickInterval = null;
  let running = false;
  let lastMove = 0;

  // Resize canvas to exact pixel multiples of TILE_SIZE for crisp grid
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const desiredW = Math.floor(rect.width);
    const desiredH = Math.floor(rect.height);

    // Make the canvas width/height multiples of TILE_SIZE
    canvas.width = Math.floor(desiredW / TILE_SIZE) * TILE_SIZE;
    canvas.height = Math.floor(desiredH / TILE_SIZE) * TILE_SIZE;
    cols = canvas.width / TILE_SIZE;
    rows = canvas.height / TILE_SIZE;
  }

  function resetGame() {
    resizeCanvas();
    snake = [
      { x: Math.floor(cols / 2 - 1), y: Math.floor(rows / 2) },
      { x: Math.floor(cols / 2 - 2), y: Math.floor(rows / 2) },
      { x: Math.floor(cols / 2 - 3), y: Math.floor(rows / 2) },
    ];
    dir = { x: 1, y: 0 };
    nextDir = { ...dir };
    spawnFood();
    score = 0;
    speed = 6;
    updateHUD();
    draw();
  }

  function spawnFood() {
    const taken = new Set(snake.map((p) => `${p.x},${p.y}`));
    let fx, fy;
    let attempts = 0;
    do {
      fx = Math.floor(Math.random() * cols);
      fy = Math.floor(Math.random() * rows);
      attempts++;
      if (attempts > 2000) break;
    } while (taken.has(`${fx},${fy}`));
    food = { x: fx, y: fy };
  }

  function updateHUD() {
    scoreEl.textContent = score;
    speedEl.textContent = speed;
  }

  function step() {
    // apply direction change if valid (no immediate reverse)
    if (nextDir.x !== -dir.x || nextDir.y !== -dir.y) {
      dir = { ...nextDir };
    }

    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    // wrap-around behaviour (if you prefer wall collision, change here)
    if (head.x < 0) head.x = cols - 1;
    if (head.x >= cols) head.x = 0;
    if (head.y < 0) head.y = rows - 1;
    if (head.y >= rows) head.y = 0;

    // collision with self?
    if (snake.some((p) => p.x === head.x && p.y === head.y)) {
      // game over
      running = false;
      clearInterval(tickInterval);
      tickInterval = null;
      showGameOver();
      return;
    }

    snake.unshift(head);

    // ate food?
    if (food && head.x === food.x && head.y === food.y) {
      score += 1;
      // increase speed a bit every 3 points
      if (score % 3 === 0) speed = Math.min(20, speed + 1);
      spawnFood();
      updateHUD();
      resetTick();
    } else {
      snake.pop(); // normal move: remove tail
    }

    draw();
  }

  function drawGrid() {
    // subtle grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.02)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= cols; x++) {
      ctx.beginPath();
      ctx.moveTo(x * TILE_SIZE + 0.5, 0);
      ctx.lineTo(x * TILE_SIZE + 0.5, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= rows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * TILE_SIZE + 0.5);
      ctx.lineTo(canvas.width, y * TILE_SIZE + 0.5);
      ctx.stroke();
    }
  }

  function draw() {
    // background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // gradient background per tile
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, "#092734");
    g.addColorStop(1, "#071b2a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // optional grid
    drawGrid();

    // draw food
    if (food) {
      ctx.fillStyle = "#ff7b72"; // food color
      roundRectFill(
        food.x * TILE_SIZE + 2,
        food.y * TILE_SIZE + 2,
        TILE_SIZE - 4,
        TILE_SIZE - 4,
        6
      );
    }

    // draw snake
    for (let i = 0; i < snake.length; i++) {
      const p = snake[i];
      const x = p.x * TILE_SIZE;
      const y = p.y * TILE_SIZE;
      if (i === 0) {
        // head
        ctx.fillStyle = "#36d399";
        roundRectFill(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2, 5);
      } else {
        // body gradient
        const t = i / snake.length;
        ctx.fillStyle = `rgba(54,211,153,${0.9 - t * 0.6})`;
        roundRectFill(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2, 4);
      }
    }
  }

  // helper: rounded rect
  function roundRectFill(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  }

  function showGameOver() {
    // overlay
    ctx.fillStyle = "rgba(2,6,15,0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = "bold 28px Arial";
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 8);
    ctx.font = "16px Arial";
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
  }

  function resetTick() {
    if (tickInterval) {
      clearInterval(tickInterval);
    }
    const ms = Math.max(60, Math.round(1000 / speed));
    tickInterval = setInterval(step, ms);
    updateHUD();
  }

  // Controls
  function handleKey(e) {
    const key = e.key;
    if (key === "ArrowUp" || key.toLowerCase() === "w") setNextDir(0, -1);
    if (key === "ArrowDown" || key.toLowerCase() === "s") setNextDir(0, 1);
    if (key === "ArrowLeft" || key.toLowerCase() === "a") setNextDir(-1, 0);
    if (key === "ArrowRight" || key.toLowerCase() === "d") setNextDir(1, 0);
    if (key === " " || key === "Enter") toggleRunning();
    if (key === "r") {
      resetGame();
    }
  }

  function setNextDir(x, y) {
    // prevent reversing directly
    if (x === -dir.x && y === -dir.y) return;
    nextDir = { x, y };
  }

  function startGame() {
    if (running) return;
    running = true;
    resetTick();
  }
  function pauseGame() {
    if (!running) return;
    running = false;
    if (tickInterval) {
      clearInterval(tickInterval);
      tickInterval = null;
    }
  }
  function toggleRunning() {
    running ? pauseGame() : startGame();
  }

  // Touch controls binding
  function bindTouch() {
    if (!touchControls) return;
    touchControls.querySelectorAll("button[data-dir]").forEach((b) => {
      b.addEventListener(
        "touchstart",
        (ev) => {
          ev.preventDefault();
          const d = b.getAttribute("data-dir");
          if (d === "up") setNextDir(0, -1);
          if (d === "down") setNextDir(0, 1);
          if (d === "left") setNextDir(-1, 0);
          if (d === "right") setNextDir(1, 0);
          // small vibration if supported
          if (navigator.vibrate) navigator.vibrate(20);
        },
        { passive: false }
      );
    });
  }

  // event listeners
  window.addEventListener("keydown", handleKey);
  window.addEventListener("resize", () => {
    // preserve snake relative position by resetting based on new cols/rows
    resizeCanvas();
    draw();
  });

  btnStart.addEventListener("click", startGame);
  btnPause.addEventListener("click", pauseGame);
  btnReset.addEventListener("click", () => {
    pauseGame();
    resetGame();
  });

  // prevent gesture scroll on touch for the canvas
  canvas.addEventListener(
    "touchmove",
    (e) => {
      e.preventDefault();
    },
    { passive: false }
  );

  // initialize
  resizeCanvas();
  resetGame();
  bindTouch();

  // helpful: show mobile touch controls only if touch device
  function isTouchDevice() {
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
  }
  if (isTouchDevice()) {
    touchControls.style.display = "flex";
  }
})();
