// HTML ELEMENT SELECTORS
const canvas = document.getElementById("canvas");

const finalScoreSpan = document.getElementById("final-score");
const scoreSpan = document.getElementById("score");
const maxScoreSpan = document.getElementById("max-score");

const startScreen = document.getElementById("startscreen");
const endScreen = document.getElementById("endscreen");

const startButton = document.getElementById("start");
const restartButton = document.getElementById("restart");

const settingsRanges = document.querySelectorAll(".slider");

// VARIABLES FOR FRAME RATE CONTROL
let fps = 60;
let now;
let then = Date.now();
let interval = 1000 / fps;
let delta;

// GLOBAL VARIABLES
let hasStarted = false;
let nextInit = false;
let score = 0;

const cells = [];
const ctx = canvas.getContext("2d");

let width = window.innerWidth;
let height = window.innerHeight;
let particleAmount = ((width * height) / 10000) | 0;
let animationLoop = null;

canvas.width = width;
canvas.height = height;

const BASE_SETTINGS = {
  10: { initialSize: 2.5, frameCount: Math.round(fps * 2.5)},
  20: { initialSize: 6.5, frameCount: Math.round(fps * 2.25)},
  30: { initialSize: 10, frameCount: Math.round(fps * 2)},
  40: { initialSize: 13.75, frameCount: Math.round(fps * 1.75)},
  50: { initialSize: 20, frameCount: Math.round(fps * 1.5)},
  60: { initialSize: 22.5, frameCount: Math.round(fps * 1.25)},
  70: { initialSize: 30, frameCount: Math.round(fps * 1)},
  80: { initialSize: 35, frameCount: Math.round(fps * 0.75)},
  90: { initialSize: 40, frameCount: Math.round(fps * 0.5)},
  100: { initialSize: 50, frameCount: Math.round(fps * 0.25)},
};

let settings = {
  initialSize: 2.5,
  frameCount: Math.round(fps * 2.5),
  finalSize: 10,
  get explosionDiff(){
    return (this.finalSize - this.initialSize) / this.frameCount;
  } 
};

const backgroundMusic = new Audio("./assets/audio/background-music.mp3");

// EVENT LISTENERS
restartButton.addEventListener("click", () => {
  endScreen.classList.add("hidden");
  hasStarted = false;
  nextInit = true;
});

startButton.addEventListener("click", () => {
  startScreen.classList.add("hidden");
  canvas.addEventListener("click", handleCanvasClick);
  backgroundMusic.play();
  backgroundMusic.volume = 1;
});

settingsRanges.forEach(range => {
  range.addEventListener('input', () => {
    const selectedValue = parseInt(range.value);

    settings.finalSize = selectedValue;
    settings.initialSize = BASE_SETTINGS[selectedValue].initialSize;
    settings.frameCount = BASE_SETTINGS[selectedValue].frameCount;
  })
})

function handleCanvasClick(e) {
  if (hasStarted) return;

  hasStarted = true;

  const cell = new Cell(e.clientX, e.clientY);
  cells.push(cell);
  cell.explode();
}

function resetScore() {
  maxScoreSpan.innerText = particleAmount;
  scoreSpan.innerText = 0;
  score = 0;
}

function getRandomColor(min) {
  const r = getRandomNumberBetween(min, 255);
  const g = getRandomNumberBetween(min, 255);
  const b = getRandomNumberBetween(min, 255);

  return `rgb(${r}, ${g}, ${b})`;
}

function getRandomNumberBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function init() {
  resetScore();

  cells.length = 0;
  for (let nr = 1; nr < particleAmount; ++nr) cells.push(new Cell());

  animate();
}

let maxSize = 10, minSize = 6, maxV = 4;

class Cell {
  constructor(x, y) {
    this.color = getRandomColor(100);
    this.size = Math.random() * (maxSize - minSize) + minSize;
    this.initialSize = this.size;
    this.x = x || Math.random() * width;
    this.y = y || Math.random() * height;
    this.vx = Math.random() * maxV * 2 - maxV;
    this.vy = Math.random() * maxV * 2 - maxV;
    this.exploded = false;
    this.explosionSize = settings.initialSize;

    this.frameCount = 0;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0 || this.x > width) this.vx *= -1;
    if (this.y < 0 || this.y > height) this.vy *= -1;

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.abs(this.size / 2), 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    if (this.exploded) {
      this.frameCount++;

      this.explosionSize += settings.explosionDiff;

      this.size -= this.size / settings.frameCount;
      
      if(settings.frameCount == this.frameCount){
        cells.splice(cells.indexOf(this), 1);
      }

      ctx.beginPath();
      ctx.arc(this.x, this.y, this.explosionSize, 0, Math.PI * 2);

      for (let i = 0; i < cells.length; ++i) {
        const cell = cells[i];
        if (!cell.exploded) {
          let a = this,
            b = cell;
          let distX = a.x - b.x,
            distY = a.y - b.y,
            dist = Math.sqrt(distX * distX + distY * distY);
          if (dist <= this.explosionSize) cells[i].explode();
        }
      }

      ctx.strokeStyle = this.color;
      ctx.stroke();
      ctx.closePath();
    }
  }

  explode() {
    const waterSound = new Audio("./assets/audio/water.mp3");
    waterSound.volume = 0.5;
    waterSound.play();

    this.exploded = true;
    this.vx = this.vy = 0;
    scoreSpan.textContent = ++score;
  }
}

function draw() {
  if (hasStarted && cells.every((c) => c.exploded == 0)) {
    showEndScreen();
  }

  ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
  ctx.fillRect(0, 0, width, height);

  cells.forEach((cell) => cell.update());

  if (cells.length === 0) gameOver();
}

function gameOver() {
  cancelAnimationFrame(animationLoop);
  showEndScreen();
}

function showEndScreen() {
  endScreen.classList.remove("hidden");
  finalScoreSpan.innerText = score;
  settingsRanges.forEach(r => r.value = settings.finalSize)
}

function animate() {
  animationLoop = requestAnimationFrame(animate);

  now = Date.now();
  delta = now - then;

  if (delta > interval) {
    then = now - (delta % interval);

    if (nextInit) (nextInit = false), init();
    else draw();
  }
}

init();
