const comingsoonScreen = document.getElementById("comingsoon");
const exchangeForm = document.getElementById("exchange-form");

exchangeForm.addEventListener('submit',  e => {
  e.preventDefault();
  comingsoonScreen.classList.remove("hidden")
  comingsoonScreen.addEventListener('animationend', event => {
    if(event.animationName != "fade-out") return;
    comingsoonScreen.classList.add('hidden')
  }) 
})