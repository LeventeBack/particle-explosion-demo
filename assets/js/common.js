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