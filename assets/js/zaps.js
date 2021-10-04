const LOCAL_STORAGE_DAILY_USED_ZAPS = "dailyUsedZaps";

const NO_REMAINING_ZAPS_ALERT = "You used all your zaps today! Come back tomorrow!"

const zapNumberDiv = document.getElementById('zaps')
let zaps = calculateZaps();


function getTodayDateKey(){
  const today = new Date();
  return today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
}

function calculateZaps(){
  const dailyGames = JSON.parse(localStorage.getItem(LOCAL_STORAGE_DAILY_USED_ZAPS)) || {};
  const todayKey = getTodayDateKey();
  
  const playedToday = (dailyGames[todayKey]) ? dailyGames[todayKey] : 0;


  const zaps = (playedToday < 15) ?  15 - playedToday : 0;
  zapNumberDiv.innerText = zaps;

  return zaps;
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
