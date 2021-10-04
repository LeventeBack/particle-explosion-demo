const LOCAL_STORAGE_DAILY_USED_ZAPS = "dailyUsedZaps";
let zaps = calculateZaps();


function getTodayDateKey(){
  const today = new Date();
  return today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
}

function calculateZaps(){
  const dailyGames = JSON.parse(localStorage.getItem(LOCAL_STORAGE_DAILY_USED_ZAPS)) || {};
  const todayKey = getTodayDateKey();
  
  return dailyGames[todayKey] || 0;
}

function updateZaps(){
  zaps--;
  const dailyGames = JSON.parse(localStorage.getItem(LOCAL_STORAGE_DAILY_USED_ZAPS)) || {};
  const todayKey = getTodayDateKey();

  dailyGames[todayKey] = zaps;

  localStorage.setItem(LOCAL_STORAGE_DAILY_USED_ZAPS, JSON.stringify(dailyGames));
}
