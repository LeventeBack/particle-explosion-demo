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
let clicked = false;

let animationLoop = null;
let sliderInterval = [];


// SCORE COUNTERS
const LOCAL_STORAGE_SCORE_KEY = "accumulatedParticles"
let score = 0;
let totalAccumulated = parseInt(localStorage.getItem(LOCAL_STORAGE_SCORE_KEY)) || 0

// CANVAS SIZE VARIABLES
let width = window.innerWidth;
let height = window.innerHeight;

let particleAmount = Math.min(((width * height) / 6180) | 0, 160); // CHANGE 10000 to modify the particles value

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


let maxSize = 10, minSize = 6, maxV = 4;

/* Cell CLASS */
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
    ++score;
    if(typeof scoreSpan !== 'undefined') scoreSpan.textContent = score;
  }
}


/* ZAPS SECTION */
const LOCAL_STORAGE_DAILY_USED_ZAPS = "dailyUsedZaps";

const NO_REMAINING_ZAPS_ALERT = "You used all your zaps today! Come back tomorrow!"

const zapNumberDiv = document.getElementById('zaps')
let zaps;


function getTodayDateKey(){
  const today = new Date();
  return today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
}

function calculateZaps(){
  const dailyGames = JSON.parse(localStorage.getItem(LOCAL_STORAGE_DAILY_USED_ZAPS)) || {};
  const todayKey = getTodayDateKey();
  
  const playedToday = (dailyGames[todayKey]) ? dailyGames[todayKey] : 0;

  zaps = (playedToday < 15) ?  15 - playedToday : 0;
  zapNumberDiv.innerText = zaps;
}

function updateDailyGames(){
  const dailyGames = JSON.parse(localStorage.getItem(LOCAL_STORAGE_DAILY_USED_ZAPS)) || {};
  const todayKey = getTodayDateKey();

  if(dailyGames[todayKey])
    dailyGames[todayKey] ++;
  else 
    dailyGames[todayKey] = 1;

  localStorage.setItem(LOCAL_STORAGE_DAILY_USED_ZAPS, JSON.stringify(dailyGames));

  calculateZaps();
}


calculateZaps();

/* ASKING FOR NAME */ 
const TARDBILES_USERNAME_LOCAL_STORAGE_KEY = "tardibles_username"
let userName = localStorage.getItem(TARDBILES_USERNAME_LOCAL_STORAGE_KEY) || askForName();

function setupUsernames(){
  const userNameSpans = document.querySelectorAll('.username');

  userNameSpans.forEach(span => span.innerText = userName);
}

function askForName(){
  const usernameForm = document.getElementById('username-form');
  const nameOverlay = document.getElementById('nameoverlay');
  const nameInput = document.getElementById('username');

  nameOverlay.classList.remove('hidden')

  usernameForm.addEventListener('submit', e => {
    e.preventDefault();
    userName = nameInput.value;
    localStorage.setItem(TARDBILES_USERNAME_LOCAL_STORAGE_KEY, userName)
    nameOverlay.classList.add('hidden')
  })
}

if(userName) setupUsernames()