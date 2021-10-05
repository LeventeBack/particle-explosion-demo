// HTML ELEMENT SELECTORS
const canvas = document.getElementById("canvas");

const finalScoreSpan = document.getElementById("final-score");
const scoreSpan = document.getElementById("score");
const maxScoreSpan = document.getElementById("max-score");
const totalScoreSpan = document.getElementById("total-score");

const startScreen = document.getElementById("startscreen");
const endScreen = document.getElementById("endscreen");

const startButton = document.getElementById("start");
const restartButton = document.getElementById("restart");

const settingsRanges = document.querySelectorAll(".slider");

const muteToggle = document.getElementById('mute-toggle')

// VARIABLES FOR FRAME RATE CONTROL
let fps = 60;
let now;
let then = Date.now();
let interval = 1000 / fps;
let delta;

// GLOBAL VARIABLES
const cells = [];
let hasStarted = false;
let nextInit = false;

let animationLoop = null;
let rangeIntervals = [];

// SCORE COUNTERS
const LOCAL_STORAGE_SCORE_KEY = "accumulatedParticles"
let score = 0;
let totalAccumulated = parseInt(localStorage.getItem(LOCAL_STORAGE_SCORE_KEY)) || 0

totalScoreSpan.innerText = totalAccumulated;

// CANVAS SIZE VARIABLES
const ctx = canvas.getContext("2d");

let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;

let particleAmount = ((width * height) / 10000) | 0; // CHANGE 10000 to modify the particles value

// AUDIO RELATED VARIABLES
const LOCAL_STORAGE_AUDIO_MUTE_KEY = "isAudioMuted"
const backgroundMusic = new Audio("./assets/audio/background-music.mp3");
let isAudioMuted = localStorage.getItem(LOCAL_STORAGE_AUDIO_MUTE_KEY) || false; 

// PARTICLE SETTINGS AND BEHAVIOUR RELATED VARIABLES
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

const sliderValues = { 
  maxValue: 100,
  minValue: 10,
  step: 10,
  currentValue: 10,
  direction: 0
}


let maxSize = 17, minSize = 3, maxV = 8;

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
    this.waterSound = null;

    console.log(this.size, this.initialSize, this.vx, this.vy);
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

    this.waterSound = new Audio("./assets/audio/water.mp3");
    this.waterSound.volume = 0.5;
    if(!isAudioMuted) this.waterSound.play();

    this.exploded = true;
    this.vx = this.vy = 0;
    scoreSpan.textContent = ++score;
  }
}

// EVENT LISTENERS
startButton.addEventListener("click", () => {
  if(zaps <= 0) {
    alert(NO_REMAINING_ZAPS_ALERT); 
    return;
  }
  updateDailyGames()

  startScreen.classList.add("hidden");
  canvas.addEventListener("click", handleCanvasClick);

  if(!isAudioMuted) backgroundMusic.play();
  backgroundMusic.volume = 1;

  setUpRangeMovement(false)
});

restartButton.addEventListener("click", () => {
  if(zaps <= 0) {
    alert(NO_REMAINING_ZAPS_ALERT); 
    return 
  } 
  updateDailyGames()

  endScreen.classList.add("hidden");
  hasStarted = false;
  nextInit = true;
  setUpRangeMovement(false)
});

muteToggle.addEventListener('click', () => {
  isAudioMuted = !isAudioMuted;
  localStorage.setItem(LOCAL_STORAGE_AUDIO_MUTE_KEY, isAudioMuted);

  updateMuteButton();
  isAudioMuted? backgroundMusic.pause() : backgroundMusic.play();

  if(isAudioMuted) cells.forEach(cell => { 
    if(cell.waterSound) cell.waterSound.pause()
  })
})

// HELPER FUNCTIONS
function setUpRangeMovement(flag = true){
  if(flag) 
    settingsRanges.forEach((range, index) => {
      rangeIntervals[index] = setInterval(() => moveSlider(range, index), 100)
    })
  else
    rangeIntervals.forEach(interval => {
      clearInterval(interval)
      interval = null;
    })
}

function updateMuteButton(){
  const svgUse = muteToggle.querySelector('use')
  const svgID = isAudioMuted ? "volume-mute" : "volume-up";
  svgUse.setAttribute('href', `./assets/img/mute.svg#${svgID}`)
}

function handleCanvasClick(e) {
  if (hasStarted) return;
  
  hasStarted = true;

  const cell = new Cell(e.clientX, e.clientY);
  cells.push(cell);
  cell.explode();
}

function moveSlider(range, index){
  if(index == 0){
    sliderValues.maxValue = parseInt(range.max) ;  
    sliderValues.minValue = parseInt(range.min);  
    sliderValues.step = parseInt(range.step);  
    sliderValues.currentValue = parseInt(range.value);
  } 

  if(sliderValues.currentValue >= sliderValues.maxValue) 
    sliderValues.direction = -1;
  else if (sliderValues.currentValue <= sliderValues.minValue)
    sliderValues.direction = 1;

  range.value = sliderValues.currentValue + (sliderValues.direction * sliderValues.step);   

  settings.finalSize = sliderValues.currentValue;
  settings.initialSize = BASE_SETTINGS[sliderValues.currentValue].initialSize;
  settings.frameCount = BASE_SETTINGS[sliderValues.currentValue].frameCount;
   
  range.style.setProperty("--rotation", `${sliderValues.currentValue/ 100 * 720}deg`);
}

function resetScore() {
  maxScoreSpan.innerText = particleAmount;
  scoreSpan.innerText = 0;
  score = 0;
}

function saveScore(){
  totalAccumulated += score;
  localStorage.setItem(LOCAL_STORAGE_SCORE_KEY, totalAccumulated);
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


function draw() {
  if (hasStarted && cells.every((c) => c.exploded == 0)) {
    showEndScreen();
  }

  ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
  ctx.fillRect(0, 0, width, height);

  cells.forEach((cell) => cell.update());

  if (cells.length === 0) showEndScreen();
}


function showEndScreen() {
  if(!endScreen.classList.contains('hidden')) return;

  saveScore();
  endScreen.classList.remove("hidden");
  finalScoreSpan.innerText = score;
  totalScoreSpan.innerText = totalAccumulated;

  settingsRanges.forEach(r => r.value = settings.finalSize)
  setUpRangeMovement(true)
}

function animate() {
  animationLoop = requestAnimationFrame(animate);

  now = Date.now();
  delta = now - then;

  if (delta > interval) {
    then = now - (delta % interval);

    if (nextInit) {
     nextInit = false
     init();
    }
    else draw();
  }
}

window.onresize = () => location.reload();

updateMuteButton();
setUpRangeMovement(true);
init();