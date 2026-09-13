
(()=>{
  const coin=document.createElement('button');coin.id='pfLuckyCoin';coin.type='button';coin.setAttribute('aria-label','Lucky floating coin');coin.innerHTML='<span class="pf-lucky-coin-ring"></span><span class="pf-lucky-coin-mark">$</span><span class="pf-lucky-coin-timer">LUCKY COIN</span>';document.body.appendChild(coin);
  let spawnTimer=0,despawnTimer=0,countdownTimer=0,expiresAt=0;
  const baseClickValue=clickValue;
  clickValue=function(){return baseClickValue()*(Date.now()<Number(state.luckyCoinFrenzyUntil||0)?7:1)};
  function rnd(min,max){return min+Math.random()*(max-min)}
  function gameVisible(){const g=document.getElementById('gameApp');return g&&!g.classList.contains('hidden')}
  function schedule(first=false){clearTimeout(spawnTimer);const delay=first?rnd(45000,135000):rnd(75000,225000);spawnTimer=setTimeout(spawn,delay)}
  function hide(missed=false){clearTimeout(despawnTimer);clearInterval(countdownTimer);coin.style.display='none';coin.classList.remove('pf-lucky-coin-pop');expiresAt=0;if(missed)schedule(false)}
  function place(){const margin=105,w=Math.max(320,innerWidth),h=Math.max(480,innerHeight),x=rnd(margin,Math.max(margin+1,w-margin)),y=rnd(105,Math.max(106,h-margin));coin.style.left=Math.round(x-47)+'px';coin.style.top=Math.round(y-47)+'px'}
  function spawn(){if(!gameVisible()||window.__pfTutorialLockClick===true){spawnTimer=setTimeout(spawn,30000);return}place();expiresAt=Date.now()+13000;coin.style.display='grid';coin.classList.remove('pf-lucky-coin-pop');const timer=coin.querySelector('.pf-lucky-coin-timer');const tick=()=>{const sec=Math.max(0,(expiresAt-Date.now())/1000);timer.textContent=`LUCKY COIN · ${sec.toFixed(1)}s`};tick();countdownTimer=setInterval(tick,100);despawnTimer=setTimeout(()=>hide(true),13000)}
  function grant(){
    if(!gameVisible()||coin.style.display==='none')return;clearTimeout(despawnTimer);clearInterval(countdownTimer);state.stats=state.stats||{};state.stats.luckyCoins=(state.stats.luckyCoins||0)+1;const roll=Math.random();let title='LUCKY COIN!',msg='';
    if(roll<.50){const base=Math.max(777,clickValue()*900),bank=Math.max(0,Number(state.cash)||0),bonus=Math.max(777,Math.round(Math.min(bank*.15+777,base)));earn(bonus);title='LUCKY!';msg=`+${fmt(bonus)} cash.`}
    else if(roll<.95){state.luckyCoinFrenzyUntil=Date.now()+77000;title='FRENZY!';msg='Coin presses are ×7 for 77 seconds.'}
    else{const bonus=Math.max(7777,Math.round(clickValue()*1800));earn(bonus);const premiums=['variant','vintage','highroller','secret','graded'],pid=premiums[Math.floor(Math.random()*premiums.length)];if(typeof grantPremiumPack==='function')grantPremiumPack(pid,1);else{const themes=basePackThemes();const t=themes[Math.floor(Math.random()*themes.length)];if(t)state.packInventory[t.id]=(state.packInventory[t.id]||0)+1}title='COIN JACKPOT!';msg=`+${fmt(bonus)} and a bonus pack.`}
    markSaveDirty();save();renderHUD();scheduleUpgradeRefresh?.();coin.classList.add('pf-lucky-coin-pop');sfx('jackpot');confetti(22);toast(title,msg);setTimeout(()=>{coin.style.display='none';coin.classList.remove('pf-lucky-coin-pop');schedule(false)},260)
  }
  coin.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();grant()});
  window.addEventListener('resize',()=>{if(coin.style.display!=='none')place()});
  window.addEventListener('pf:enterGame',()=>schedule(true));
  if(gameVisible())schedule(true);
})();
