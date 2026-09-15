(()=>{
'use strict';
const TKEY='packforge_tutorial_v1';
function legacyTGet(){try{return JSON.parse(localStorage.getItem(TKEY)||'{}')}catch(e){return{}}}
function tGet(){return legacyTGet()}
function tSet(v){try{localStorage.setItem(TKEY,JSON.stringify(v))}catch(e){}}
function isTutorialDone(){return !!tGet().completed}
function markTutorialStarted(){tSet({started:true,completed:false})}
function markTutorialDone(){tSet({started:true,completed:true})}
function clearTutorialDone(){tSet({started:false,completed:false})}

/* ---------- styles ---------- */
const style=document.createElement('style');
style.textContent=`
#pfTutRoot{position:fixed;inset:0;z-index:99990;pointer-events:none}
.pf-tut-dim{position:fixed;background:rgba(4,6,10,.58);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);pointer-events:auto;touch-action:pan-y;overscroll-behavior:auto;cursor:not-allowed;transition:opacity .18s ease}
.pf-tut-box{position:fixed;pointer-events:none;border:2.5px solid #5cff8d;box-shadow:0 0 10px rgba(92,255,141,.8),0 0 24px rgba(92,255,141,.35);border-radius:14px;animation:pfTutPulse 1.6s ease-in-out infinite;transition:left .12s ease,top .12s ease,width .12s ease,height .12s ease}
.pf-tut-box.pf-tut-click-proxy{pointer-events:auto;cursor:pointer}
.pf-tut-box.pf-tut-blocking{pointer-events:auto;cursor:wait}
@keyframes pfTutPulse{0%,100%{box-shadow:0 0 10px rgba(92,255,141,.75),0 0 22px rgba(92,255,141,.30)}50%{box-shadow:0 0 16px rgba(92,255,141,1),0 0 34px rgba(92,255,141,.55)}}
.pf-tut-arrow{position:fixed;font-size:34px;font-weight:900;color:#ffd84d;text-shadow:0 0 6px rgba(255,216,77,.9),0 0 16px rgba(255,204,51,.55);animation:pfTutBounce 1.1s ease-in-out infinite;transition:left .12s ease,top .12s ease;user-select:none}
@keyframes pfTutBounce{0%,100%{transform:translateY(0);opacity:.85}50%{transform:translateY(-8px);opacity:1}}
.pf-tut-text{position:fixed;max-width:460px;color:#fff;font-weight:700;font-size:19px;line-height:1.45;text-align:center;text-shadow:0 2px 6px rgba(0,0,0,.9),0 0 10px rgba(0,0,0,.5);transition:left .12s ease,top .12s ease;user-select:none}
body.pf-tut-variant-explain .pf-tut-text{max-width:320px;text-align:left;font-size:17px;line-height:1.5}
body.pf-tut-variant-explain #inspectModal .inspect-layout{transition:transform .16s ease-out}
.pf-tut-text .pf-tut-counter{display:block;margin-top:8px;font-size:15px;font-weight:900;color:#9cf0b8;letter-spacing:.06em}
.pf-tut-cursor{opacity:.85;animation:pfTutBlink .8s steps(1) infinite}
.pf-tut-skip{position:fixed;top:max(14px,env(safe-area-inset-top));right:max(14px,env(safe-area-inset-right));z-index:3;pointer-events:auto;border:1px solid rgba(255,255,255,.18);background:rgba(9,13,20,.88);color:#dfe7f2;border-radius:11px;padding:9px 13px;font-size:12px;font-weight:900;letter-spacing:.035em;box-shadow:0 8px 24px rgba(0,0,0,.28);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);cursor:pointer;transition:background .15s ease,border-color .15s ease,transform .15s ease}
.pf-tut-skip:hover{background:#172131;border-color:rgba(92,255,141,.46);transform:translateY(-1px)}
.pf-tut-skip:active{transform:translateY(0)}
@keyframes pfTutBlink{50%{opacity:0}}
`;
document.head.appendChild(style);

/* ---------- root & pieces ---------- */
let root=null,dimTop=null,dimBottom=null,dimLeft=null,dimRight=null,box=null,arrow=null,textEl=null,skipBtn=null;
function buildRoot(){
  if(root)return;
  root=document.createElement('div');root.id='pfTutRoot';
  dimTop=document.createElement('div');dimTop.className='pf-tut-dim';
  dimBottom=document.createElement('div');dimBottom.className='pf-tut-dim';
  dimLeft=document.createElement('div');dimLeft.className='pf-tut-dim';
  dimRight=document.createElement('div');dimRight.className='pf-tut-dim';
  box=document.createElement('div');box.className='pf-tut-box';
  arrow=document.createElement('div');arrow.className='pf-tut-arrow';arrow.textContent='▼';
  textEl=document.createElement('div');textEl.className='pf-tut-text';
  skipBtn=document.createElement('button');skipBtn.type='button';skipBtn.className='pf-tut-skip';skipBtn.textContent='Skip Tutorial';skipBtn.setAttribute('aria-label','Skip the tutorial and start a fresh game');
  root.appendChild(dimTop);root.appendChild(dimBottom);root.appendChild(dimLeft);root.appendChild(dimRight);
  root.appendChild(box);root.appendChild(arrow);root.appendChild(textEl);root.appendChild(skipBtn);
  /* Block clicks on blurred areas, but deliberately do NOT cancel wheel/touch scrolling. */
  for(const shield of [dimTop,dimBottom,dimLeft,dimRight]){
    for(const type of ['pointerdown','pointerup'])shield.addEventListener(type,ev=>{ev.stopPropagation()},{passive:true});
    for(const type of ['click','dblclick','contextmenu'])shield.addEventListener(type,ev=>{ev.preventDefault();ev.stopPropagation()});
  }
  skipBtn.addEventListener('click',skipTutorial);
  document.body.appendChild(root);
}
function destroyRoot(){
  clearInterval(typeTimer);typing=false;typingFinishedAt=0;
  document.body.classList.remove('pf-tut-variant-explain');
  const inspectLayout=document.querySelector('#inspectModal .inspect-layout');if(inspectLayout)inspectLayout.style.transform='';
  if(root&&root.parentNode)root.parentNode.removeChild(root);
  root=dimTop=dimBottom=dimLeft=dimRight=box=arrow=textEl=skipBtn=null;
}
function showSpotlightParts(show){
  [dimTop,dimBottom,dimLeft,dimRight,box,arrow].forEach(el=>{if(el)el.style.display=show?'':'none'});
}

/* ---------- typewriter ---------- */
let typeTimer=null,typing=false,fullText='',typingFinishedAt=0;
function setFloatingText(str,withCounter){
  clearInterval(typeTimer);
  fullText=str;typing=true;typingFinishedAt=0;
  let i=0;
  textEl.innerHTML='<span class="pf-tut-typed"></span><span class="pf-tut-cursor">▌</span>'+(withCounter?'<span class="pf-tut-counter" data-counter></span>':'');
  const typedSpan=textEl.querySelector('.pf-tut-typed');
  typeTimer=setInterval(()=>{
    i++;
    typedSpan.textContent=str.slice(0,i);
    if(i>=str.length){
      clearInterval(typeTimer);typing=false;typingFinishedAt=performance.now();
      const cur=textEl.querySelector('.pf-tut-cursor');if(cur)cur.remove();
      syncStepInteraction();
    }
  },52);
}
/* Tutorial text is intentionally not skippable. The highlighted control stays locked until typing finishes. */
function blockPrematureTutorialInput(ev){
  if(!active||!typing)return;
  const step=STEPS[curIndex];
  const target=curTarget||(step&&step.getTarget?step.getTarget():null);
  if(!target)return;
  const hit=ev.target===target||(target.contains&&target.contains(ev.target));
  if(hit){ev.preventDefault();ev.stopImmediatePropagation();ev.stopPropagation()}
}
document.addEventListener('pointerdown',blockPrematureTutorialInput,true);
document.addEventListener('click',blockPrematureTutorialInput,true);
function blockOutsideTutorialTarget(ev){
  /* Never block the game's own programmatic clicks used to advance tutorial UI (for example, switching Bag tabs). */
  if(!active||ev.isTrusted===false)return;const step=STEPS[curIndex];if(!step||step.noDim)return;
  const target=curTarget||(step.getTarget?step.getTarget():null);if(!target)return;
  const inside=ev.target===target||(target.contains&&target.contains(ev.target));
  const tutorialUi=ev.target&&ev.target.closest&&ev.target.closest('#pfTutRoot');
  if(!inside&&!tutorialUi){ev.preventDefault();ev.stopImmediatePropagation();ev.stopPropagation()}
}
for(const type of ['pointerdown','pointerup','click','dblclick','contextmenu'])document.addEventListener(type,blockOutsideTutorialTarget,true);
document.addEventListener('keydown',ev=>{
  if(!active)return;const step=STEPS[curIndex];if(!step||step.noDim)return;const target=curTarget||(step.getTarget?step.getTarget():null);if(!target)return;
  const focused=document.activeElement,inside=focused===target||(target.contains&&target.contains(focused));
  if(ev.key==='Tab'){ev.preventDefault();try{target.focus({preventScroll:true})}catch(e){};return}
  /* Arrow/Page/Home/End keys remain available for scrolling long tutorial screens. */
  if(!inside&&['Enter',' ','Spacebar','ArrowLeft','ArrowRight'].includes(ev.key)){ev.preventDefault();ev.stopImmediatePropagation()}
},true);

/* ---------- positioning ---------- */
function radiusOf(el){
  try{const r=getComputedStyle(el).borderRadius;const n=parseFloat(r);return Number.isFinite(n)&&n>0?Math.min(n+6,40):14}catch(e){return 14}
}
function positionAll(target){
  if(!target||!document.body.contains(target)){return false}
  const r=target.getBoundingClientRect();
  if(r.width<=0&&r.height<=0)return false;
  const pad=10,vw=window.innerWidth,vh=window.innerHeight;
  const left=Math.max(0,r.left-pad),top=Math.max(0,r.top-pad),right=Math.min(vw,r.right+pad),bottom=Math.min(vh,r.bottom+pad);
  box.style.left=left+'px';box.style.top=top+'px';box.style.width=(right-left)+'px';box.style.height=(bottom-top)+'px';
  box.style.borderRadius=radiusOf(target)+'px';
  dimTop.style.left='0px';dimTop.style.top='0px';dimTop.style.width=vw+'px';dimTop.style.height=Math.max(0,top)+'px';
  dimBottom.style.left='0px';dimBottom.style.top=bottom+'px';dimBottom.style.width=vw+'px';dimBottom.style.height=Math.max(0,vh-bottom)+'px';
  dimLeft.style.left='0px';dimLeft.style.top=top+'px';dimLeft.style.width=Math.max(0,left)+'px';dimLeft.style.height=(bottom-top)+'px';
  dimRight.style.left=right+'px';dimRight.style.top=top+'px';dimRight.style.width=Math.max(0,vw-right)+'px';dimRight.style.height=(bottom-top)+'px';
  const cx=(left+right)/2;
  const spaceAbove=top,spaceBelow=vh-bottom;
  let arrowTop,arrowBottom=false;
  if(spaceAbove>=100){arrow.textContent='▼';arrowTop=top-46;}
  else if(spaceBelow>=100){arrow.textContent='▲';arrowTop=bottom+8;arrowBottom=true;}
  else {arrow.textContent='▼';arrowTop=Math.max(4,top-46)}
  let arrowLeft=cx-14;
  arrowLeft=Math.max(8,Math.min(vw-36,arrowLeft));
  arrow.style.left=arrowLeft+'px';arrow.style.top=arrowTop+'px';
  const textW=Math.min(460,vw-32);
  textEl.style.width=textW+'px';
  let textTop;
  if(arrowBottom){textTop=arrowTop+40}
  else{textTop=Math.max(6,arrowTop-92)}
  let textLeft=cx-textW/2;
  textLeft=Math.max(12,Math.min(vw-textW-12,textLeft));
  textEl.style.left=textLeft+'px';textEl.style.top=textTop+'px';
  return true;
}
function positionVariantExplain(target){
  if(!target||!document.body.contains(target))return false;
  const layout=document.querySelector('#inspectModal .inspect-layout');
  const vw=window.innerWidth,vh=window.innerHeight;
  /* On roomy screens, nudge the inspect content right just enough to create a real black text column. */
  if(layout){
    if(vw>=1180)layout.style.transform='translateX(210px)';
    else if(vw>=980)layout.style.transform='translateX(105px)';
    else layout.style.transform='';
  }
  /* Wait one frame-worth of layout calculation, then spotlight the card at its shifted position. */
  const ok=positionAll(target);
  if(!ok)return false;
  const r=target.getBoundingClientRect();
  if(vw>=980&&r.left>250){
    const gap=28;
    const available=Math.max(220,r.left-gap-18);
    const textW=Math.min(320,available);
    textEl.style.width=textW+'px';
    textEl.style.left=Math.max(18,r.left-gap-textW)+'px';
    textEl.style.top=Math.max(18,Math.min(vh-220,r.top+18))+'px';
    textEl.style.textAlign='left';
    /* Keep the arrow with the card, but never let it occupy the text column. */
    arrow.style.left=Math.max(r.left+24,Math.min(vw-36,(r.left+r.right)/2-14))+'px';
  }else{
    /* Small screens cannot fit three columns; use the normal clear placement instead of overlapping the card. */
    const textW=Math.min(460,vw-32);
    textEl.style.width=textW+'px';
    textEl.style.left=((vw-textW)/2)+'px';
    textEl.style.top=Math.min(vh-180,r.bottom+30)+'px';
    textEl.style.textAlign='center';
  }
  return true;
}
function positionWelcomeSide(target){
  if(!target||!document.body.contains(target))return false;
  const ok=positionAll(target);if(!ok)return false;
  const r=target.getBoundingClientRect(),vw=window.innerWidth,vh=window.innerHeight,gap=36;
  const sideW=Math.min(340,Math.max(250,vw*.25));
  const roomRight=vw-r.right-gap-18,roomLeft=r.left-gap-18;
  textEl.style.width=sideW+'px';textEl.style.textAlign='left';
  if(roomRight>=sideW){
    textEl.style.left=(r.right+gap)+'px';
    textEl.style.top=Math.max(24,Math.min(vh-250,r.top+Math.max(0,(r.height-210)/2)))+'px';
  }else if(roomLeft>=sideW){
    textEl.style.left=(r.left-gap-sideW)+'px';
    textEl.style.top=Math.max(24,Math.min(vh-250,r.top+Math.max(0,(r.height-210)/2)))+'px';
  }else{
    const fallbackW=Math.min(460,vw-32);
    textEl.style.width=fallbackW+'px';textEl.style.textAlign='center';
    textEl.style.left=((vw-fallbackW)/2)+'px';
    const below=r.bottom+28;
    textEl.style.top=(below+180<vh?below:Math.max(18,r.top-190))+'px';
  }
  return true;
}
function positionCentered(){
  const vw=window.innerWidth,vh=window.innerHeight;
  const textW=Math.min(460,vw-32);
  textEl.style.width=textW+'px';
  textEl.style.left=((vw-textW)/2)+'px';
  textEl.style.top=Math.min(vh-105,vh*0.84)+'px';
  textEl.style.textAlign='center';
}

/* ---------- helpers ---------- */
const $=s=>document.querySelector(s);
function firstEnabledShopBuy(){
  const btns=document.querySelectorAll('#shopGrid [data-shop-buy]');
  for(const b of btns)if(!b.disabled)return b;
  return btns[0]||null;
}
function firstShopInfoBtn(){return document.querySelector('#pfShopOddsButton')}
function oddsOpen(){const m=$('#oddsModal');return !!m&&!m.classList.contains('hidden')}
function casinoTab(name){return document.querySelector(`[data-mcc-tab="${name}"]`)}
function casinoGameVisible(name){const el=$(`#mcc-${name}`);return !!el&&!el.classList.contains('hidden')}
function firstOpenPackBtn(){
  return document.querySelector('#packGrid [data-open-pack]')||document.querySelector('#packGrid [data-open-special]');
}
function firstCollectCard(){
  return document.querySelector('#collectionGrid .collect-card');
}
function firstHoloCollectCard(){
  const face=document.querySelector('#collectionGrid .collect-card .variant-holo');
  return face?.closest('.collect-card')||firstCollectCard();
}
function viewVisible(id){const el=document.getElementById(id);return !!el&&!el.classList.contains('hidden')}
function elExists(sel){return !!document.querySelector(sel)}
function inspectOpen(){const m=$('#inspectModal');return !!m&&!m.classList.contains('hidden')}
function campaignEasyChoice(){return document.querySelector('#campaignList .campaign-choice-card.difficulty-easy')||document.querySelector('#campaignList [data-campaign-choice]')}
function campaignTeamLoaded(){return !!document.querySelector('#campaignStage .campaign-pick')||!!document.querySelector('#campaignStage .campaign-team')}
function campaignPickTarget(){return document.querySelector('#campaignStage .campaign-pick:not(:disabled)')}
function campaignLaunchBtn(){return $('#campaignLaunchNext')}
function campaignLaunchReady(){const b=campaignLaunchBtn();return !!b&&!b.disabled}
function campaignPowerQualified(){return !!document.querySelector('#campaignStage .campaign-power-line strong.ready')}
function campaignJourneyStarted(){return !!document.querySelector('#campaignStage .campaign-journey')}
function campaignSelectionMaxed(){const filled=document.querySelectorAll('#campaignStage .campaign-slot.filled').length;return filled>=5||!campaignPickTarget()}

function settingsGear(){return $('#gameSettingsBtn')}
function settingsOpen(){const m=$('#gameSettingsModal');return !!m&&!m.classList.contains('hidden')}
function settingsTabBtn(name){return document.querySelector(`[data-pf-settings-tab="${name}"]`)}
function settingsPanelVisible(name){const p=$(`#pfSettingsPanel-${name}`);return !!p&&!p.classList.contains('hidden')}
function casinoAction(id){return $('#'+id)}
function setBetOne(id){const e=$('#'+id);if(e)e.value='1'}
function elapsedFlag(name,ms){const t=tutFlags[name];return !!t&&(performance.now()-t)>=ms}

/* ---------- step machine ---------- */
let clickCount=0,active=false,rafId=null,curIndex=0,curTarget=null;
const STEPS=[
  {id:'welcome',getTarget:()=>$('#clickOrb'),sideText:true,blockTargetAlways:true,autoAdvanceAfterTyping:1000,text:"Welcome to PackForge. This game took a lot of time, testing, trial and error, and care to make. Thank you for giving it a try. Here's a quick tour to show you how everything works."},
  {id:'click',getTarget:()=>$('#clickOrb'),text:"This is your main money button. Click it 100 times to earn enough cash for your first pack. The counter below will track your progress.",withCounter:true,onEnter:()=>{window.__pfTutorialLockClick=true;clickCount=0;updateCounter()},onExit:()=>{window.__pfTutorialLockClick=false},isComplete:()=>clickCount>=100},
  {id:'shopNav',getTarget:()=>document.querySelector('.side-btn[data-view="shop"]'),text:"Great — you have enough cash for your first pack. Click Shop in the menu to open the pack shop.",isComplete:()=>viewVisible('view-shop')},
  {id:'shopInfo',getTarget:()=>firstShopInfoBtn(),text:'Before you buy anything, click the highlighted ? button. PackForge keeps every card, variant, Special Pack, Semi-God, and God Pack chance in one reference before you spend money.',isComplete:()=>oddsOpen()},
  {id:'shopInfoExplain',getTarget:()=>$('#oddsModal .odds-modal')||$('#oddsModal'),sideText:true,text:'This is the Pack Odds & Pull Chances browser. It has tabs for every individual card, variants, Special Packs, Semi-God Packs, and God Packs. Manual opening uses the full listed odds; Auto Open has reduced chances for rare cards and variants. Look it over, then click × to close it.',isComplete:()=>!oddsOpen()},
  {id:'buyPack',getTarget:()=>firstEnabledShopBuy(),text:'Now click Buy Pack to purchase your first pack. The pack itself will be sent to your Bag.',isComplete:()=>tutFlags.packBought},
  {id:'bagNav',getTarget:()=>document.querySelector('.side-btn[data-view="collection"]'),text:'Purchased packs are stored in your Bag. Click Bag to see what you own.',isComplete:()=>viewVisible('view-collection'),onAdvance:()=>{const b=document.querySelector('[data-bag-tab="packs"]');if(b)b.click()}},
  {id:'openPack',getTarget:()=>firstOpenPackBtn(),text:'This is where your packs are stored. Click Open Pack to open your first pack.',directOpen:true,isComplete:()=>elExists('#bigPack')},
  {id:'ripPack',getTarget:()=>$('#bigPack'),text:'To open a pack, hold the tear handle and drag it from one side of the wrapper to the other. Opening carelessly can very rarely leave small condition defects that matter later when grading.',isComplete:()=>elExists('#cardStack')},
  {id:'revealCards',getTarget:()=>$('#cardStack'),text:'Now reveal the cards in your pack. Click through them until every card has been revealed.',isComplete:()=>{const ov=$('#packOverlay');return !!ov&&ov.classList.contains('hidden')}},
  {id:'cardsTab',getTarget:()=>document.querySelector('[data-bag-tab="cards"]'),text:'Every card you open is saved in Bag → Cards. Click Cards to view the cards you own.',isComplete:()=>viewVisible('bagCardsTab')},
  {id:'inspect',getTarget:()=>firstHoloCollectCard(),text:'One of your first cards is guaranteed to be a Holo variant. Find the card marked HOLO and click it to open the Inspect screen.',isComplete:()=>inspectOpen()},
  {id:'variantExplain',getTarget:()=>$('#inspectTilt')||$('#inspectModal .inspect-scene'),noDim:true,variantLeftText:true,onEnter:()=>{document.body.classList.add('pf-tut-variant-explain')},onExit:()=>{document.body.classList.remove('pf-tut-variant-explain');const l=document.querySelector('#inspectModal .inspect-layout');if(l)l.style.transform=''},text:"This is a Holo VARIANT. Variants are special versions of the same card: the name and Power stay the same, but that individual copy looks different and can be worth more. Other variants include Foil, Gold, Prismatic, Shattered, and the extremely rare Serialized variant. Inspect the Holo effect, then close this screen when you're ready.",isComplete:()=>!inspectOpen()},
  {id:'campaignNav',getTarget:()=>document.querySelector('.side-btn[data-view="campaigns"]'),text:'Now click Campaigns. Campaigns are free to enter and let you temporarily commit cards from your collection to earn rewards.',isComplete:()=>viewVisible('view-campaigns')},
  {id:'campaignChoose',getTarget:()=>campaignEasyChoice(),text:'Campaigns come in different Power ranges and durations. Start with the highlighted LOW POWER campaign by clicking it.',onEnter:()=>{try{window.__pfPrepareTutorialCampaign?.()}catch(e){}},isComplete:()=>{const b=$('#campaignOfferNext');return !!b&&!b.disabled}},
  {id:'campaignOfferNext',getTarget:()=>$('#campaignOfferNext'),text:'This is the campaign you selected. Campaign entry is always free. Click NEXT to choose which cards you want to send.',isComplete:()=>campaignTeamLoaded()},
  {id:'campaignCards',getTarget:()=>campaignPickTarget()||$('.campaign-power-line'),text:()=>campaignLaunchReady()?'You have enough Power. The launch button is ready.':'Choose 1–5 cards. Their combined Selected Power must meet or exceed the Required Power. Your cards are committed while the campaign runs, but they are not consumed.',isComplete:()=>campaignLaunchReady()||campaignPowerQualified()||campaignSelectionMaxed()},
  {id:'campaignLaunch',getTarget:()=>campaignLaunchBtn()||$('.campaign-power-line'),text:()=>campaignLaunchReady()?'You are ready. Click NEXT to launch your first campaign. Campaigns are always free.':'Meet the Required Power first. Once you qualify, NEXT will launch the campaign for free.',isComplete:()=>campaignJourneyStarted()},
  {id:'campaignWorking',getTarget:()=>document.querySelector('#campaignStage .campaign-active-box')||$('#campaignStage'),blockTargetAlways:true,autoAdvanceAfterTyping:5000,text:'Your campaign is now running. The timer and progress bar show how long your cards will be committed. Campaigns keep progressing while you visit other pages, so watch it work for a few seconds.',onAdvance:()=>{const b=document.querySelector('.side-btn[data-view="casino"]');if(b)b.click()}},
  {id:'casinoIntro',getTarget:()=>$('#mcc-coin .mcc-panel')||$('#view-casino'),blockTargetAlways:true,autoAdvanceAfterTyping:1600,onEnter:()=>{try{window.__pfTutorialHelpers?.fundCasino?.(6)}catch(e){}},text:'This is the Casino. Gambling is completely optional. For training, PackForge just gave you $6 so you can try every game once with a $1 bet. None of this training money carries into your real save.'},
  {id:'casinoCoin',getTarget:()=>casinoAction('coinFlipBtn'),onEnter:()=>setBetOne('coinBetInput'),text:'Coin Flip is a true 50/50 game. Your bet has been set to $1. Click Flip and watch the result.',isComplete:()=>elapsedFlag('casinoCoinAt',1050)},
  {id:'casinoMinesTab',getTarget:()=>casinoTab('mines'),text:'Click Mines. You will risk $1 and see how safe tiles increase the potential payout.',isComplete:()=>casinoGameVisible('mines')},
  {id:'casinoMines',getTarget:()=>casinoAction('minesStartBtn'),onEnter:()=>setBetOne('minesBetInput'),text:'Your Mines bet is set to $1. Click Start. The board will hide mines and reveal the risk/reward system.',isComplete:()=>elapsedFlag('casinoMinesAt',1000)},
  {id:'casinoPlinkoTab',getTarget:()=>casinoTab('plinko'),text:'Now click Plinko. Every bounce is a 50/50 left-or-right decision that eventually lands on a multiplier.',isComplete:()=>casinoGameVisible('plinko')},
  {id:'casinoPlinko',getTarget:()=>casinoAction('plinkoDropBtn'),onEnter:()=>setBetOne('plinkoBetInput'),text:'Your Plinko bet is set to $1. Click Drop and watch the ball work through the board.',isComplete:()=>elapsedFlag('casinoPlinkoAt',1600)},
  {id:'casinoSlotsTab',getTarget:()=>casinoTab('slots'),text:'Now click Slots. This is a classic five-reel machine with nine paylines, Wild symbols, Pack scatters, and rare free-spin bonuses.',isComplete:()=>casinoGameVisible('slots')},
  {id:'casinoSlots',getTarget:()=>casinoAction('slotsSpinBtn'),onEnter:()=>setBetOne('slotsBetInput'),text:'Your Slots bet is set to $1. Click SPIN. The reels stop one at a time, and matching symbols from the left can pay across nine different lines.',isComplete:()=>elapsedFlag('casinoSlotsAt',2400)},
  {id:'casinoBlackjackTab',getTarget:()=>casinoTab('blackjack'),text:'Click Blackjack. The goal is to finish closer to 21 than the dealer without going over.',isComplete:()=>casinoGameVisible('blackjack')},
  {id:'casinoBlackjack',getTarget:()=>casinoAction('bjDealBtn'),onEnter:()=>setBetOne('bjBetInput'),text:'Your Blackjack bet is set to $1. Click Deal to see your opening hand and the dealer\'s visible card.',isComplete:()=>elapsedFlag('casinoBlackjackAt',1300)},
  {id:'casinoRouletteTab',getTarget:()=>casinoTab('roulette'),text:'Finally, click Roulette. PackForge uses a European single-zero wheel with standard number and outside-bet payouts.',isComplete:()=>casinoGameVisible('roulette')},
  {id:'casinoRouletteBet',getTarget:()=>document.querySelector('#rouletteTable [data-bet="red"]')||document.querySelector('#rouletteTable [data-bet]'),onEnter:()=>setBetOne('rouletteBetInput'),text:'Your chip value is set to $1. Click the highlighted RED space to place a $1 roulette bet.',isComplete:()=>!!tutFlags.casinoRouletteBetAt},
  {id:'casinoRouletteSpin',getTarget:()=>casinoAction('rouletteSpinBtn'),text:'Now click Spin. Watch the wheel resolve your final $1 training bet.',isComplete:()=>elapsedFlag('casinoRouletteSpinAt',4500)},
  {id:'settingsNav',getTarget:()=>settingsGear(),text:'Before we finish, open Settings using the gear icon. PackForge has separate Audio, Video, Interface, and Save controls so you can tune the experience.',isComplete:()=>settingsOpen()},
  {id:'settingsIntro',getTarget:()=>document.querySelector('.pf-settings-tabs'),blockTargetAlways:true,autoAdvanceAfterTyping:1800,text:'These tabs let you fine-tune sound, performance, card effects, UI scale, contrast, and save behavior.'},
  {id:'settingsClose',getTarget:()=>document.querySelector('#gameSettingsModal [data-close="gameSettingsModal"]'),text:'That is Settings. Close it to finish the tutorial.',isComplete:()=>!settingsOpen()}
]
const tutFlags={packBought:false,campaignExplained:false,casinoCoinAt:0,casinoMinesAt:0,casinoPlinkoAt:0,casinoSlotsAt:0,casinoBlackjackAt:0,casinoRouletteBetAt:0,casinoRouletteSpinAt:0};
function updateCounter(){
  if(!textEl)return;
  const c=textEl.querySelector('[data-counter]');
  if(c)c.textContent=Math.min(clickCount,100)+' / 100';
}
window.addEventListener('pf:click',()=>{
  if(!active)return;
  const step=STEPS[curIndex];
  if(step&&step.id==='click'){clickCount++;updateCounter();}
});
window.addEventListener('pf:packBought',()=>{tutFlags.packBought=true});
document.addEventListener('click',e=>{if(!active)return;const id=STEPS[curIndex]?.id,now=performance.now();if(id==='casinoCoin'&&e.target.closest?.('#coinFlipBtn'))tutFlags.casinoCoinAt=now;if(id==='casinoMines'&&e.target.closest?.('#minesStartBtn'))tutFlags.casinoMinesAt=now;if(id==='casinoPlinko'&&e.target.closest?.('#plinkoDropBtn'))tutFlags.casinoPlinkoAt=now;if(id==='casinoSlots'&&e.target.closest?.('#slotsSpinBtn'))tutFlags.casinoSlotsAt=now;if(id==='casinoBlackjack'&&e.target.closest?.('#bjDealBtn'))tutFlags.casinoBlackjackAt=now;if(id==='casinoRouletteBet'&&e.target.closest?.('#rouletteTable [data-bet]'))tutFlags.casinoRouletteBetAt=now;if(id==='casinoRouletteSpin'&&e.target.closest?.('#rouletteSpinBtn'))tutFlags.casinoRouletteSpinAt=now});

function syncStepInteraction(){
  if(!box||!active)return;
  const step=STEPS[curIndex];if(!step)return;
  const directOpen=!!step.directOpen;
  const locked=typing||!!step.blockTargetAlways;
  box.classList.toggle('pf-tut-blocking',locked);
  box.classList.toggle('pf-tut-click-proxy',!locked&&(!!step.proxyClick||directOpen));
  if(locked){
    box.onpointerup=ev=>{ev.preventDefault();ev.stopPropagation()};
    box.onclick=ev=>{ev.preventDefault();ev.stopPropagation()};
    return;
  }
  box.onpointerup=directOpen?(ev=>{
    ev.preventDefault();ev.stopPropagation();
    const target=step.getTarget?step.getTarget():curTarget;
    if(target&&document.body.contains(target))window.__pfOpenPackButton?.(target,ev);
  }):null;
  box.onclick=directOpen?(ev=>{
    ev.preventDefault();ev.stopPropagation();
    const target=step.getTarget?step.getTarget():curTarget;
    if(target&&document.body.contains(target))window.__pfOpenPackButton?.(target,ev);
  }):step.proxyClick?(ev=>{ev.preventDefault();ev.stopPropagation();const target=step.getTarget?step.getTarget():curTarget;if(target&&document.body.contains(target))target.click()}):null;
}
function enterStep(i){
  curIndex=i;curTarget=null;
  const step=STEPS[i];
  if(!step){finishTutorial();return}
  if(step.onEnter)step.onEnter();
  showSpotlightParts(true);
  if(step.noDim){[dimTop,dimBottom,dimLeft,dimRight].forEach(el=>{if(el)el.style.display='none'})}
  setFloatingText(typeof step.text==='function'?step.text():step.text,!!step.withCounter);
  syncStepInteraction();
  if(step.withCounter)updateCounter();
}
function advanceStep(){
  const step=STEPS[curIndex];
  if(step&&step.onExit)step.onExit();
  if(step&&step.onAdvance)step.onAdvance();
  const next=curIndex+1;
  if(next>=STEPS.length){finishTutorial();return}
  enterStep(next);
}
function tickLoop(){
  if(!active)return;
  const step=STEPS[curIndex];
  if(step){
    const t=step.getTarget?step.getTarget():null;
    if(t){
      curTarget=t;
      if(step.variantLeftText)positionVariantExplain(t);
      else if(step.sideText)positionWelcomeSide(t);
      else positionAll(t);
    }
    if(step.autoAdvanceAfterTyping&&!typing&&typingFinishedAt&&performance.now()-typingFinishedAt>=step.autoAdvanceAfterTyping){
      advanceStep();rafId=requestAnimationFrame(tickLoop);return
    }
    if(!typing&&step.isComplete&&step.isComplete()){advanceStep();rafId=requestAnimationFrame(tickLoop);return}
  }
  rafId=requestAnimationFrame(tickLoop);
}
function startTutorial(){
  if(active)return;
  if(document.getElementById('pfV318EconomyNotice'))return;
  if(!document.getElementById('gameApp')||document.getElementById('gameApp').classList.contains('hidden'))return;
  try{window.__pfTutorialSession?.begin?.()}catch(e){console.error('Tutorial training session could not start',e);return}
  active=true;Object.assign(tutFlags,{packBought:false,campaignExplained:false,casinoCoinAt:0,casinoMinesAt:0,casinoPlinkoAt:0,casinoSlotsAt:0,casinoBlackjackAt:0,casinoRouletteBetAt:0,casinoRouletteSpinAt:0});clickCount=0;markTutorialStarted();
  buildRoot();
  enterStep(0);
  rafId=requestAnimationFrame(tickLoop);
}
function closeTutorialSurfaces(){
  for(const id of ['packOverlay','inspectModal','oddsModal','gameSettingsModal','confirmModal']){
    const el=document.getElementById(id);if(el)el.classList.add('hidden');
  }
  const finale=document.getElementById('pfMagnumFinale');if(finale)finale.remove();
}
function skipTutorial(){
  if(!active)return;
  active=false;window.__pfTutorialLockClick=false;
  if(rafId){cancelAnimationFrame(rafId);rafId=null}
  clearInterval(typeTimer);typing=false;typingFinishedAt=0;
  closeTutorialSurfaces();destroyRoot();
  markTutorialDone();
  try{window.__pfTutorialSession?.finish?.()}catch(e){console.error('Tutorial skip reset failed',e)}
}
function finishTutorial(){
  active=false;window.__pfTutorialLockClick=false;if(rafId)cancelAnimationFrame(rafId);destroyRoot();
  const old=document.getElementById('pfMagnumFinale');if(old)old.remove();
  const finale=document.createElement('div');finale.id='pfMagnumFinale';finale.className='pf-magnum-finale';finale.innerHTML=`<div class="pf-magnum-card"><div class="pf-magnum-kicker">ONE LAST THING</div><h2>Thank you for playing PackForge.</h2><p>PackForge took <b>three months</b> to make. It became my <b>magnum opus</b> — a game shaped through thousands of little decisions, systems, cards, odds, sounds, animations, experiments, fixes, and a lot of trial and error.</p><p class="pf-magnum-thanks">I am genuinely thankful that you chose to spend your time playing it. I hope you find something impossibly rare, build a collection you care about, and enjoy discovering the small details hidden throughout the game.</p><button class="pf-magnum-start" id="pfMagnumStart">START YOUR ADVENTURE</button></div>`;
  document.body.appendChild(finale);
  $('#pfMagnumStart').onclick=()=>{markTutorialDone();try{window.__pfTutorialSession?.finish?.()}catch(e){console.error('Tutorial training reset failed',e)};finale.remove()};
}

/* ---------- lifecycle hooks ---------- */
window.addEventListener('pf:enterGame',()=>{
  if(isTutorialDone())return;
  setTimeout(startTutorial,50);
});
window.addEventListener('pf:resetSave',()=>{
  clearTutorialDone();
  if(active){window.__pfTutorialLockClick=false;if(rafId)cancelAnimationFrame(rafId);destroyRoot();active=false}
  setTimeout(startTutorial,80);
});
window.addEventListener('resize',()=>{if(active&&curTarget){const step=STEPS[curIndex];if(step?.variantLeftText)positionVariantExplain(curTarget);else if(step?.sideText)positionWelcomeSide(curTarget);else positionAll(curTarget)}});

/* If the game view is already showing (e.g. script re-run), try starting once DOM is ready. */
document.addEventListener('DOMContentLoaded',()=>{
  const gameApp=document.getElementById('gameApp');
  if(gameApp&&!gameApp.classList.contains('hidden')&&!isTutorialDone())setTimeout(startTutorial,50);
});
})();

;
