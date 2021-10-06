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

// CANVAS CONTEXT
const ctx = canvas.getContext("2d");
canvas.width = width;
canvas.height = height;

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
      sliderInterval[index] = setInterval(() => moveSlider(range, index), 100)
    })
  else
    sliderInterval.forEach(interval => {
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

  console.log('okay')

  cells.length = 0;
  for (let nr = 1; nr < particleAmount; ++nr) 
    cells.push(new Cell());
  
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