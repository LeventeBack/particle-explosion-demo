// HTML ELEMENT SELECTORS
const canvas = document.getElementById("canvas");

const finalScoreSpan = document.getElementById("final-score");

const startScreen = document.getElementById("startscreen");
const endScreen = document.getElementById("endscreen");

const startButton = document.getElementById("start");
const restartButton = document.getElementById("restart");

const muteToggle = document.getElementById('mute-toggle')

const percentContainer = document.querySelector('.percent-container')
const percentAgree = document.querySelector('[data-percent="agree"]')
const percentDisagree = document.querySelector('[data-percent="disagree"]')

const previousToggle = document.querySelector('.previous-toggle')
const previousList = document.querySelector('.previous-list')

// GAME HISTORY
const LOCAL_STORAGE_GAME_HISTORY_KEY = "oracleGameHistory";
const oracleGameHistory = JSON.parse(localStorage.getItem(LOCAL_STORAGE_GAME_HISTORY_KEY)) || [];

// RECORDING VARIABLES
let recordedQuestionAudio;

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

  if(clicked) return;

  clicked = true;
  updateDailyGames()
    
  audioRecording(startButton, () => {
    startScreen.classList.add("hidden");
    canvas.addEventListener("click", handleCanvasClick);
  
    if(!isAudioMuted) backgroundMusic.play();
    backgroundMusic.volume = 1;
    
    setUpRangeMovement(false)    
  });
});

restartButton.addEventListener("click", () => {
  if(zaps <= 0) {
    alert(NO_REMAINING_ZAPS_ALERT); 
    return;
  } 

  if(clicked) return;

  clicked = true;
  
  updateDailyGames()
 
  audioRecording(restartButton, () => {
    endScreen.classList.add("hidden");
    hasStarted = false;
    nextInit = true;
    setUpRangeMovement(false)
  });  
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

previousToggle.addEventListener('click', () => {
  previousList.classList.toggle('hidden')
})

// HELPER FUNCTIONS
function setUpRangeMovement(flag = true){
  if(flag) 
    sliderInterval = setInterval(() => moveInvisibleSlider(), 100)
  else {
    clearInterval(sliderInterval)
    sliderInterval = null;
  }
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

function moveInvisibleSlider(){
  sliderValues.currentValue += (sliderValues.direction * sliderValues.step); 

  if(sliderValues.currentValue >= sliderValues.maxValue) 
    sliderValues.direction = -1;
  else if (sliderValues.currentValue <= sliderValues.minValue)
    sliderValues.direction = 1; 

  settings.finalSize = sliderValues.currentValue;
  settings.initialSize = BASE_SETTINGS[sliderValues.currentValue].initialSize;
  settings.frameCount = BASE_SETTINGS[sliderValues.currentValue].frameCount;
}

function resetScore() {
  score = 0;
}

function saveScore(){
  totalAccumulated += Math.min(score, particleAmount - score);
  localStorage.setItem(LOCAL_STORAGE_SCORE_KEY, totalAccumulated);
}

function getRandomColor() {
  const COLORS = ["#73fff1", "#C42FED"];
  const randomIndex = Math.floor(Math.random() * 2);

  return COLORS[randomIndex];
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

  recordedQuestionAudio.play();

  saveScore();
  endScreen.classList.remove("hidden");
  finalScoreSpan.innerText = Math.min(score, particleAmount - score);

  displayPercentages();
  
  clicked = false;
  
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

function displayPercentages(){
  const agree = (score  * 100 / particleAmount).toFixed(2);
  const disagree = (100 - agree).toFixed(2);;

  percentAgree.innerText = agree;
  percentDisagree.innerText = disagree;

  percentContainer.style.setProperty('--agree', `${agree}%`)

  updateGameHistory(agree, disagree);
}

function updateGameHistory(agree, disagree){
  const HISTORY_TEXTS = ["!!! DISAGREE !!!", "!!! AGREE !!!"];

  
  let listHTML = "";
  for(let i = 0; i < Math.min(3, oracleGameHistory.length); i++) {
    const hasAgreed = oracleGameHistory[i] ? 1 : 0;
    const listItemText = HISTORY_TEXTS[hasAgreed];
    const listItemClass = hasAgreed? 'agree' : 'disagree';
    
    listHTML += `<li class="${listItemClass}">${listItemText}</li>`
  }

  previousList.innerHTML = listHTML;
  
  const hasAgreed = agree >= disagree;
  oracleGameHistory.unshift(hasAgreed);
  localStorage.setItem(LOCAL_STORAGE_GAME_HISTORY_KEY, JSON.stringify(oracleGameHistory));
}

function audioRecording(button, callback){
  navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start();
    button.innerText = "Listening..."

    const audioChunks = [];
    mediaRecorder.addEventListener("dataavailable", event => {
      audioChunks.push(event.data);
    });
    
    mediaRecorder.addEventListener("stop", () => {
      const audioBlob = new Blob(audioChunks);
      const audioUrl = URL.createObjectURL(audioBlob);
      recordedQuestionAudio = new Audio(audioUrl);
    });

    setTimeout(() => {
      mediaRecorder.stop();
      button.innerText = "ask oracle your question";
      callback();
    }, 5000);
  });
}

window.onresize = () => location.reload();

updateMuteButton();
setUpRangeMovement(true);
init();