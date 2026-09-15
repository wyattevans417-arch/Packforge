
/* SOURCE: js/game-core.v2.11.js */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const PF_COMPACT_BASE=['','K','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc'];
  function pfSuffixForGroup(group){
    if(group<PF_COMPACT_BASE.length)return PF_COMPACT_BASE[group];
    let n=group-PF_COMPACT_BASE.length,out='';
    do{out=String.fromCharCode(65+(n%26))+out;n=Math.floor(n/26)-1}while(n>=0);
    return out;
  }
  function pfCompactNumber(value,decimals=2){
    let n=Number(value)||0;if(!Number.isFinite(n))return n<0?'-∞':'∞';
    const a=Math.abs(n);if(a<1000)return n.toLocaleString(undefined,{minimumFractionDigits:decimals,maximumFractionDigits:decimals});
    const group=Math.max(1,Math.floor(Math.log10(a)/3)),scaled=n/Math.pow(1000,group);
    return `${scaled.toFixed(decimals)}${pfSuffixForGroup(group)}`;
  }
  const pfNativeNumberLocale=Number.prototype.toLocaleString;
  Number.prototype.toLocaleString=function(...args){const n=Number(this);if(args.length===0&&Number.isFinite(n)&&Math.abs(n)>=1000)return pfCompactNumber(n,2);return pfNativeNumberLocale.apply(this,args)};
  const fmt = n => '$'+pfCompactNumber(n,2);
  const saveKey='packforge_save_v1';
  const SAVE_SCHEMA=5; // Local-only save schema. No account/cloud sync is used.
  const LEGACY_SAVE_KEYS=['packforge_save','packforge_save_v0','packforge_save_v2','packforgeSave','packForgeSave'];
  /* v3.13: no deployment-triggered reset. Existing local progress is preserved. */
  function mergeSaveDefaults(defaults,saved){
    if(!saved||typeof saved!=='object'||Array.isArray(saved))return saved===undefined?defaults:saved;
    const out={...(defaults&&typeof defaults==='object'&&!Array.isArray(defaults)?defaults:{})};
    for(const [key,value] of Object.entries(saved)){
      const base=out[key];
      if(value&&typeof value==='object'&&!Array.isArray(value)&&base&&typeof base==='object'&&!Array.isArray(base))out[key]=mergeSaveDefaults(base,value);
      else out[key]=value;
    }
    return out;
  }
  const randomFacts=[
    'The speed of light in vacuum is exactly 299,792,458 metres per second in SI.',
    'The Planck constant h is exactly 6.62607015×10⁻³⁴ joule-seconds in SI.',
    'Quantum probabilities come from squared amplitudes: for position, the Born rule uses |ψ|².',
    'The position–momentum uncertainty relation is ΔxΔp ≥ ħ/2.',
    'Entanglement can produce correlations that violate Bell inequalities, but it cannot be used to send information faster than light.',
    'A 500 nm photon carries about 2.48 eV of energy.',
    'At 90% of the speed of light, the Lorentz factor γ is about 2.294.',
    'One gram of mass has a rest-energy equivalent of about 8.99×10¹³ joules through E = mc².',
    'The electron rest energy is about 0.511 MeV; the proton rest energy is about 938.272 MeV.',
    'The fine-structure constant is dimensionless and is approximately 1/137.036 at low energies.',
    'The photon is massless in the Standard Model; W and Z bosons are massive, which is tied to the weak interaction’s short range.',
    'Absolute zero is exactly 0 kelvin, equal to −273.15 °C.',
    'At room temperature near 300 K, kBT is about 0.0259 eV.',
    'The Standard Model contains six quark flavours and six leptons, plus gauge bosons and the Higgs boson.',
    'General relativity predicts that clocks run at different rates in different gravitational potentials.'
  ];
  const quizBank=[
    {q:'Which expression gives photon energy?',a:['E = hf','F = ma','pV = nRT','V = IR'],correct:0},
    {q:'What does |ψ|² represent for a particle’s position?',a:['Mass density','Probability density','Electric charge','Speed'],correct:1},
    {q:'At 90% of c, is the Lorentz factor γ greater than 1?',a:['Yes','No','Only for photons','Only in gravity'],correct:0},
    {q:'Which interaction is carried by photons?',a:['Strong','Electromagnetic','Weak','Gravity'],correct:1},
    {q:'What is the electron’s charge?',a:['+1 e','0','−1 e','−2 e'],correct:2},
    {q:'Which SI constant is NOT fixed exactly by definition?',a:['Speed of light c','Planck constant h','Elementary charge e','Gravitational constant G'],correct:3}
  ];
  let quizRound=[],quizIndex=0,quizScore=0;
  function showAstroPage(page){
    $$('.astro-page').forEach(x=>x.classList.toggle('active',x.id===`astro-page-${page}`));
    $$('[data-astro-page]').forEach(x=>{if(x.classList.contains('nav-pill'))x.classList.toggle('active',x.dataset.astroPage===page)});
    window.scrollTo({top:0,behavior:'smooth'});
    if(page==='solar')renderPhotonCalculator();
    if(page==='stars')renderRelativityCalculator();
    if(page==='missions'&&!quizRound.length)startQuiz();
  }
  $$('[data-astro-page]').forEach(b=>b.onclick=()=>showAstroPage(b.dataset.astroPage));
  function sci(n,d=3){if(!Number.isFinite(n))return'—';if(n===0)return'0';const e=Math.floor(Math.log10(Math.abs(n))),m=n/Math.pow(10,e);return `${m.toFixed(d)}×10<sup>${e}</sup>`}
  function renderPhotonCalculator(){
    const input=$('#photonWavelength'),out=$('#photonOutput');if(!input||!out)return;
    const nm=Math.max(.000001,Number(input.value)||500),lambda=nm*1e-9,c=299792458,h=6.62607015e-34,e=1.602176634e-19,f=c/lambda,E=h*f,eV=E/e;
    out.innerHTML=`<div><small>Frequency</small><b>${sci(f,3)} Hz</b></div><div><small>Energy</small><b>${sci(E,3)} J</b></div><div><small>Energy</small><b>${eV.toFixed(eV<10?3:2)} eV</b></div>`;
  }
  function renderRelativityCalculator(){
    const input=$('#relativitySpeed'),label=$('#relativitySpeedLabel'),out=$('#relativityOutput');if(!input||!out)return;
    const pct=Math.min(99.9999,Math.max(0,Number(input.value)||0)),beta=pct/100,gamma=1/Math.sqrt(1-beta*beta);if(label)label.textContent=`${pct.toFixed(2)}% c`;
    out.innerHTML=`<div><small>β = v/c</small><b>${beta.toFixed(4)}</b></div><div><small>Lorentz factor γ</small><b>${gamma.toFixed(4)}</b></div><div><small>Earth-frame time per 1 traveler year</small><b>${gamma.toFixed(3)} years</b></div>`;
  }
  if($('#photonWavelength'))$('#photonWavelength').oninput=renderPhotonCalculator;
  if($('#relativitySpeed'))$('#relativitySpeed').oninput=renderRelativityCalculator;
  renderPhotonCalculator();renderRelativityCalculator();
  function startQuiz(){quizRound=[...quizBank].sort(()=>Math.random()-.5).slice(0,3);quizIndex=0;quizScore=0;$('#quizRestart')?.classList.add('hidden');renderQuiz()}
  function renderQuiz(){const qp=$('#quizProgress'),qq=$('#quizQuestion'),qa=$('#quizAnswers'),qr=$('#quizResult'),restart=$('#quizRestart');if(!qp||!qq||!qa||!qr)return;if(quizIndex>=quizRound.length){qp.textContent='Round complete';qq.textContent=`You scored ${quizScore} / ${quizRound.length}`;qa.innerHTML='';qr.textContent=quizScore===3?'Perfect — all three correct.':quizScore===2?'Nice work — two out of three.':'Review the physics chapters above and try again.';restart?.classList.remove('hidden');return}const q=quizRound[quizIndex];qp.textContent=`Question ${quizIndex+1} of ${quizRound.length}`;qq.textContent=q.q;qr.textContent='';qa.innerHTML=q.a.map((x,i)=>`<button data-quiz-answer="${i}">${x}</button>`).join('');$$('[data-quiz-answer]').forEach(b=>b.onclick=()=>{const i=+b.dataset.quizAnswer,ok=i===q.correct;if(ok)quizScore++;$$('[data-quiz-answer]').forEach((x,j)=>{x.disabled=true;if(j===q.correct)x.classList.add('correct');else if(j===i)x.classList.add('wrong')});qr.textContent=ok?'Correct.':'Not quite — the correct answer is '+q.a[q.correct]+'.';setTimeout(()=>{quizIndex++;renderQuiz()},700)})}
  if($('#quizRestart'))$('#quizRestart').onclick=startQuiz;
  $('#randomFactBtn').onclick=()=>$('#factPanel').textContent=randomFacts[Math.floor(Math.random()*randomFacts.length)];
  $('#astroSettingsBtn').onclick=()=>$('#settingsModal').classList.remove('hidden');
  $('#secretInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.value.trim().toLowerCase()==='game'){enterGame();e.target.value='';}});
  $('#motionToggle').onclick=e=>{e.currentTarget.classList.toggle('on');$$('.wave,.particle-dot,.starfield:before,.starfield:after').forEach(el=>el.style.animationPlayState=e.currentTarget.classList.contains('on')?'running':'paused')};
  $$('[data-close]').forEach(b=>b.onclick=()=>$('#'+b.dataset.close).classList.add('hidden'));
  $$('.modal-backdrop').forEach(m=>m.addEventListener('mousedown',e=>{if(e.target===m)m.classList.add('hidden')}));
    let audioCtx=null;
  function ctx(){if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();return audioCtx}
  function tone(freq=440,dur=.08,type='sine',vol=.04,when=0){
    if(!state.sound)return;
    const punch=state.soundProfile==='punchy'?1.28:state.soundProfile==='soft'?.72:1,master=clamp(state.soundVolume??.78,0,1);
    if(master<=0||vol<=0)return;
    vol*=punch*master;
    if(vol<=.0001)return;
    const c=ctx(),o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,c.currentTime+when);g.gain.setValueAtTime(.0001,c.currentTime+when);g.gain.exponentialRampToValueAtTime(Math.max(.0001,vol),c.currentTime+when+.01);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+when+dur);o.connect(g);g.connect(c.destination);o.start(c.currentTime+when);o.stop(c.currentTime+when+dur+.03)
  }
  function noiseBurst(dur=.08,vol=.015,when=0){
    if(!state.sound)return;
    const punch=state.soundProfile==='punchy'?1.22:state.soundProfile==='soft'?.70:1,master=clamp(state.soundVolume??.78,0,1);
    if(master<=0||vol<=0)return;
    vol*=punch*master;
    if(vol<=0)return;
    const c=ctx(),buffer=c.createBuffer(1,Math.ceil(c.sampleRate*dur),c.sampleRate),d=buffer.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);const src=c.createBufferSource(),g=c.createGain();src.buffer=buffer;g.gain.value=vol;src.connect(g);g.connect(c.destination);src.start(c.currentTime+when)
  }
  function sfx(name,rarity,variant){
    if(!state.sound)return;const st=state.settings||{};
    if(name==='click'&&st.coinSounds===false)return;
    if(['reveal'].includes(name)&&st.packSounds===false)return;
    if(['buy','fuse','grade'].includes(name)&&st.rewardSounds===false)return;
    if(name==='click'){noiseBurst(.025,.006);tone(145,.035,'triangle',.025);tone(300,.045,'sine',.014,.008)}
    if(name==='critical'){noiseBurst(.045,.009);tone(250,.055,'triangle',.04);tone(510,.11,'sine',.034,.028);tone(860,.17,'sine',.021,.075)}
    if(name==='jackpot'){noiseBurst(.10,.013);[180,260,390,560,820,1120,1460].forEach((f,i)=>tone(f,.23,'triangle',.034,i*.05))}
    if(name==='buy'){noiseBurst(.045,.006);tone(250,.045,'triangle',.025);tone(410,.07,'triangle',.026,.028);tone(650,.11,'sine',.022,.068);tone(980,.12,'sine',.014,.112)}
    if(name==='reveal'){
      const base={Common:300,Uncommon:370,Rare:470,Epic:570,Legendary:690,Mythic:820,Divine:1010,Ultra:1140,Secret:1320}[rarity]||320;
      noiseBurst(.035,.005);tone(base,.085,'triangle',.028);tone(base*1.24,.15,'sine',.024,.038);
      if(st.rareSoundFlourish!==false&&['Epic','Legendary','Mythic','Divine','Ultra','Secret'].includes(rarity)){tone(base*1.51,.22,'sine',.022,.095);tone(base*2.02,.20,'sine',.010,.155)}
      if(st.rareSoundFlourish!==false&&variant&&variant!=='Normal'){tone(base*1.88,.26,'sine',.015,.145)}
    }
    if(name==='fuse'){noiseBurst(.07,.008);[320,480,720,1040].forEach((f,i)=>tone(f,.17,'sine',.027,i*.058))}
    if(name==='grade'){noiseBurst(.045,.005);[390,520,690,930,1240].forEach((f,i)=>tone(f,.18,'sine',.027,i*.054))}
    if(name==='error'){tone(126,.11,'square',.019);tone(92,.14,'triangle',.012,.035)}
  }
  function themePackSfx(themeId){
    if(!state.sound||state.settings?.packSounds===false)return;
    if(themeId==='medieval'){noiseBurst(.11,.021);tone(105,.20,'triangle',.04);tone(210,.13,'square',.012,.06)}
    else if(themeId==='food'){noiseBurst(.13,.025);tone(240,.08,'triangle',.025);tone(330,.08,'triangle',.02,.07)}
    else if(themeId==='ocean'){tone(135,.32,'sine',.03);tone(188,.28,'sine',.02,.06);noiseBurst(.08,.01,.09)}
    else if(themeId==='space'){tone(90,.35,'sine',.025);tone(420,.28,'sine',.018,.06);tone(710,.34,'sine',.012,.12)}
    else if(themeId==='monsters'){tone(72,.28,'sawtooth',.035);tone(104,.24,'triangle',.022,.08);noiseBurst(.12,.018,.04)}
    else if(themeId==='cyber'){tone(180,.06,'square',.025);tone(360,.05,'square',.02,.055);tone(720,.07,'square',.015,.11);noiseBurst(.08,.012,.04)}
  }
  const rarityOrder=['Common','Uncommon','Rare','Epic','Legendary','Mythic','Divine','Ultra'];
  const rarityMult={Common:1,Uncommon:1.6,Rare:3.2,Epic:7.5,Legendary:18,Mythic:58,Divine:130,Ultra:390,Secret:1200,Ghost:5000};
  const rarityColor={Common:'#9aa3ad',Uncommon:'#55d879',Rare:'#4f9dff',Epic:'#b75cff',Legendary:'#ffd84d',Mythic:'#ff3232',Divine:'#72ecff',Ultra:'#ff75db',Secret:'#ffffff',Ghost:'#55f7ff'};
  const RARITY_ODDS={Common:.68,Uncommon:.22,Rare:.07,Epic:.021,Legendary:.0065,Mythic:.0018,Divine:.00055,Ultra:.00015};
  const AUTO_RARITY_ODDS={Common:.705,Uncommon:.22,Rare:.0525,Epic:.01575,Legendary:.004875,Mythic:.00135,Divine:.0004125,Ultra:.0001125}; // Auto Open keeps 75% of every Rare+ base chance; removed probability goes to Common.
  const rarityTargets={Common:50,Uncommon:24,Rare:12,Epic:6,Legendary:3,Mythic:2,Divine:2,Ultra:1};
  const SECRET_CHANCE=1/100000; // Secret tier: 1 in 100,000 cards before Auto Open penalty.
  const SPECIAL_PACK_CHANCE=.04; // 1 in 25 base chance
  const variantDefs={
    Normal:{name:'Normal',chance:0,value:1},
    Foil:{name:'Foil',chance:.25,value:1.5},
    Holo:{name:'Holo',chance:.012,value:2},
    Gold:{name:'Gold',chance:.008,value:3},
    Prismatic:{name:'Prismatic',chance:.01,value:12},
    Serialized:{name:'Serialized',chance:.001,value:60}
  };
  const variantRollOrder=['Serialized','Prismatic','Gold','Holo','Foil'];
  /* Quiet collector oddities. These are intentionally rare and mostly reveal themselves only after the player notices them. */
  const FACTORY_ERROR_DEFS={
    miscut:{name:'Miscut',value:2.15,gradePenalty:.45},
    inkshift:{name:'Ink Shift',value:2.35,gradePenalty:.25},
    wrongback:{name:'Wrong Back',value:4.25,gradePenalty:.15},
    crimped:{name:'Factory Crimp',value:2.8,gradePenalty:.75},
    offcenter:{name:'Extreme Off-Center',value:1.85,gradePenalty:.65},
    printline:{name:'Print Line',value:1.65,gradePenalty:.35}
  };
  const HOLO_PATTERN_DEFS={
    swirl:{name:'Swirl',value:1.35},
    starburst:{name:'Starburst',value:1.5},
    galaxy:{name:'Galaxy',value:1.8},
    double:{name:'Double Holo',value:2.35}
  };
  const GHOST_CARD_CHANCE=1/1000000;       // Ghost tier: 1 in 1,000,000 cards before Auto Open penalty (~1 in 200,000 normal 5-card packs).
  const GOD_PACK_CHANCE=1/35000;           // Rare enough to feel like a rumor.
  const BONUS_CARD_PACK_CHANCE=1/7000;     // Six-card factory anomaly.
  const SHORT_PACK_CHANCE=1/12000;         // Four-card factory anomaly.
  const FACTORY_ERROR_CHANCE=1/4500;
  const HOLO_PATTERN_CHANCE=1/500;          // Among Holo cards only.
  const SEMI_GOD_PACK_CHANCE=1/2500;       // Semi-God family: strong, but below true God Packs.
  const HOLO_GOD_PACK_CHANCE=1/150000;     // All Rare+ and all Holo.
  const SECRET_GOD_PACK_CHANCE=1/5000000;  // All five cards are Secret-tier prints.
  const ARCHIVE_GOD_PACK_CHANCE=1/1000000000; // Archive: one of every card in the selected set.
  const SEMI_GOD_MODE_CHANCES={semi_rare:SEMI_GOD_PACK_CHANCE*.55,semi_holo:SEMI_GOD_PACK_CHANCE*.30,semi_finish:SEMI_GOD_PACK_CHANCE*.15};
  const GOD_PACK_MODE_CHANCES={rarity:GOD_PACK_CHANCE*.5,variant:GOD_PACK_CHANCE*.5,holo:HOLO_GOD_PACK_CHANCE,secret:SECRET_GOD_PACK_CHANCE,archive:ARCHIVE_GOD_PACK_CHANCE};
  const PF_PACK_MODE_DEFS={
    semi_rare:{tier:'semi',name:'Rare Rush',short:'RARE RUSH',emoji:'⚡',desc:'Every card is Rare or better.',chance:SEMI_GOD_MODE_CHANCES.semi_rare},
    semi_holo:{tier:'semi',name:'Holo Flood',short:'HOLO FLOOD',emoji:'💠',desc:'Every card is Holo; normal rarity rolls still apply.',chance:SEMI_GOD_MODE_CHANCES.semi_holo},
    semi_finish:{tier:'semi',name:'Legendary Finish',short:'LEGENDARY FINISH',emoji:'🔥',desc:'Normal pack, but the final card is guaranteed Legendary or better.',chance:SEMI_GOD_MODE_CHANCES.semi_finish},
    rarity:{tier:'god',name:'Epic+ God Pack',short:'EPIC+ GOD PACK',emoji:'🌟',desc:'Every card is Epic or better; the final card is Mythic or better.',chance:GOD_PACK_MODE_CHANCES.rarity},
    variant:{tier:'god',name:'Variant God Pack',short:'VARIANT GOD PACK',emoji:'🌈',desc:'Every card is Rare+ with a premium variant; one card is guaranteed Serialized.',chance:GOD_PACK_MODE_CHANCES.variant},
    holo:{tier:'god',name:'Holo God Pack',short:'HOLO GOD PACK',emoji:'💎',desc:'Every card is Rare or better and every card is Holo.',chance:GOD_PACK_MODE_CHANCES.holo},
    secret:{tier:'god',name:'Secret God Pack',short:'SECRET GOD PACK',emoji:'👁️',desc:'All five cards are Secret-tier cards from the selected set.',chance:GOD_PACK_MODE_CHANCES.secret},
    archive:{tier:'god',name:'Archive God Pack',short:'ARCHIVE GOD PACK',emoji:'∞',desc:'One copy of every card in the selected set.',chance:GOD_PACK_MODE_CHANCES.archive}
  };
  function pfPackModeMeta(mode){return PF_PACK_MODE_DEFS[mode]||null}
  function pfTotalGodChance(){return Object.values(GOD_PACK_MODE_CHANCES).reduce((a,b)=>a+b,0)}

  const packMutations={
    luckypulse:{id:'luckypulse',name:'Lucky Pulse',weight:22,value:1,desc:'Commons get a strong reroll chance'},
    holosurge:{id:'holosurge',name:'Holo Surge',weight:18,value:1.25,desc:'A shifting holographic special-card treatment'},
    voidbloom:{id:'voidbloom',name:'Void Bloom',weight:13,value:1.40,desc:'No Common cards and +40% value'},
    prismrift:{id:'prismrift',name:'Prism Rift',weight:8,value:1.80,desc:'Prismatic special-card treatment and +80% value'}
  };
  const premiumPackDefs={
    variant:{id:'variant',name:'Variant Pack',emoji:'🌈',cost:125,sell:75,gradient:'linear-gradient(135deg,#4f7cff,#c55cff,#ff6ea8)',glow:'rgba(177,103,255,.24)',desc:'Built for variant hunting.',effect:'Exactly 2 cards receive a standard variant. Premium variants are possible.'},
    highroller:{id:'highroller',name:'High-Roller Pack',emoji:'🎲',cost:1100,sell:660,gradient:'linear-gradient(135deg,#8f571f,#f0b94c,#6d3d18)',glow:'rgba(255,190,77,.22)',desc:'Expensive rarity chase.',effect:'No Common or Uncommon cards. Every card is Rare or better.'},
    vintage:{id:'vintage',name:'Vintage Pack',emoji:'📜',cost:125,sell:75,gradient:'linear-gradient(135deg,#3c2b20,#9b7148,#d0ae76)',glow:'rgba(218,174,111,.20)',desc:'Collector-value treatment.',effect:'All 5 cards receive a permanent Vintage treatment worth +35% collector value.'},
    secret:{id:'secret',name:'Secret Hunt Pack',emoji:'👁️',cost:3200,sell:1920,gradient:'linear-gradient(135deg,#f4f6ff,#797f92,#11141b)',glow:'rgba(255,255,255,.24)',desc:'A dangerous Secret chase.',effect:'Each card gets a greatly increased Secret roll. Still not guaranteed.'},
    graded:{id:'graded',name:'Graded Pack',emoji:'🏷️',cost:200,sell:120,gradient:'linear-gradient(135deg,#183e4b,#4db8c3,#d8f7f5)',glow:'rgba(102,231,239,.22)',desc:'Cards arrive slabbed.',effect:'Every card is automatically graded from 7.0–10.0 when opened.'}
  };
  const themeDefs=[
    {id:'medieval',name:'Medieval',emoji:'⚔️',cost:80,base:18,unlock:0,gradient:'linear-gradient(135deg,#6e4325,#ca8d3f)',desc:'Knights, keeps, relics, and monsters from a forgotten kingdom.',seeds:[['Village Squire','Common'],['Castle Cook','Common'],['Old Watchtower','Common'],['Stable Hand','Common'],['Iron Dagger','Common'],['Royal Falconer','Uncommon'],['Forest Archer','Uncommon'],['Blacksmith','Uncommon'],['Siege Ram','Uncommon'],['Silver Paladin','Rare'],['Court Wizard','Rare'],['Moonlit Keep','Epic'],['The Crown','Legendary'],['Ashen Dragon','Mythic']],a:['Iron','Royal','Forgotten','Crimson','Silver','Wandering','Old','Highland','Thorn','Winter','Golden','Raven','Stone','Lion','Oak'],n:['Knight','Keep','Banner','Squire','Archer','Forge','Helm','Blade','Tower','Chapel','Mercenary','Gate','Relic','Shield','Ballista','Monastery','Village','Cavalier','Griffin','Citadel'],secrets:['The Nameless King','Sword Beneath the World','The Thirteenth Crown','Dragon of the Empty Throne']},
    {id:'food',name:'Food',emoji:'🍕',cost:320,base:18,unlock:450,gradient:'linear-gradient(135deg,#d45f4f,#f0b34b)',desc:'Comfort food, snacks, desserts, produce, and legendary dishes.',seeds:[['Sushi','Common'],['Cake','Common'],['Cookie','Common'],['Squash','Common'],['Pizza','Common'],['Ramen','Uncommon'],['Tacos','Uncommon'],['Cheeseburger','Uncommon'],['Dumplings','Uncommon'],['Steak Dinner','Rare'],['Dragon Roll','Rare'],['Wedding Cake','Epic'],['Golden Croissant','Legendary'],['Infinite Feast','Mythic']],a:['Fresh','Crispy','Spicy','Sweet','Smoked','Golden','Roasted','Grilled','Baked','Iced','Honey','Garlic','Chocolate','Caramel','Creamy','Hot','Cold','Stuffed','Glazed','Toasted'],n:['Sushi','Cake','Cookie','Squash','Pizza','Ramen','Taco','Burger','Dumpling','Steak','Chicken','Salmon','Shrimp','Lobster','Crab Cake','Sandwich','Waffle','Pancake','Donut','Brownie','Cupcake','Pie','Cheesecake','Ice Cream','Milkshake','Pretzel','Burrito','Curry','Rice Bowl','Noodles','Soup','Chili','Mac and Cheese','Hot Dog','French Fries','Nachos','Meatball','Lasagna','Spaghetti','Bacon','Eggs','Avocado','Watermelon','Strawberry','Blueberry','Apple','Banana','Pumpkin','Corn','Potato','Carrot','Broccoli','Mushroom','Onion','Pepper','Cucumber','Peach','Cherry','Pineapple','Mango'],secrets:['The Last Slice','Forbidden Breakfast','Chef Zero’s Final Course','The Infinite Buffet']},
    {id:'ocean',name:'Ocean',emoji:'🌊',cost:1250,base:18,unlock:2500,gradient:'linear-gradient(135deg,#0f4f75,#24a7b9)',desc:'Reefs, wrecks, deep-sea creatures, and things below the light.',seeds:[['Blue Tang','Common'],['Tidepool Crab','Common'],['Bottle at Sea','Common'],['Coral Garden','Common'],['Sailboat','Common'],['Sea Turtle','Uncommon'],['Jelly Bloom','Uncommon'],['Reef Shark','Uncommon'],['Sunken Chest','Uncommon'],['Giant Manta','Rare'],['Ghost Ship','Rare'],['Abyssal Squid','Epic'],['Pearl of Tides','Legendary'],['Leviathan','Mythic']],a:['Deep','Blue','Tidal','Sunken','Coral','Storm','Abyssal','Pearl','Salt','Moonlit','Coldwater','Reef','Ghost','Emerald','Blackwater'],n:['Shark','Ray','Eel','Crab','Jellyfish','Marlin','Reef','Wreck','Anchor','Trench','Grotto','Dolphin','Whale','Octopus','Submarine','Current','Lagoon','Kelp','Seahorse','Turtle'],secrets:['The Bell Below','King of the Black Trench','Ship With No Wake','Eye of the Drowned Moon']},
    {id:'space',name:'Space',emoji:'🚀',cost:5200,base:18,unlock:12000,gradient:'linear-gradient(135deg,#312765,#7e5ad7)',desc:'Planets, rockets, moons, probes, galaxies, and deep-space phenomena.',seeds:[['Earth','Common'],['Venus','Common'],['Mars','Common'],['Mercury','Common'],['The Moon','Common'],['Jupiter','Uncommon'],['Saturn','Uncommon'],['Uranus','Uncommon'],['Neptune','Uncommon'],['Pluto','Rare'],['Rocket Ship','Rare'],['Milky Way Galaxy','Epic'],['Black Hole','Legendary'],['Observable Universe','Mythic']],a:['Lunar','Solar','Orbital','Deep Space','Interstellar','Stellar','Cosmic','Distant','Ancient','Frozen','Red','Blue','Giant','Dwarf','Binary','Outer','Inner','Exploration','Crewed','Uncrewed'],n:['Earth','Venus','Mars','Mercury','Jupiter','Saturn','Uranus','Neptune','Pluto','Ceres','Eris','Haumea','Makemake','Moon','Europa','Titan','Ganymede','Callisto','Io','Triton','Rocket Ship','Space Shuttle','Saturn V','Falcon Rocket','Lunar Lander','Mars Rover','Voyager 1','Voyager 2','Pioneer Probe','Hubble Telescope','James Webb Telescope','International Space Station','Space Capsule','Satellite','Milky Way Galaxy','Andromeda Galaxy','Whirlpool Galaxy','Sombrero Galaxy','Nebula','Orion Nebula','Crab Nebula','Black Hole','Supermassive Black Hole','Comet','Asteroid','Meteor','Meteorite','Supernova','Pulsar','Quasar','Magnetar','Red Giant','White Dwarf','Neutron Star','Exoplanet','Star Cluster','Kuiper Belt','Asteroid Belt','Oort Cloud','Solar System'],secrets:['The Star That Blinked Back','Signal From Nowhere','Planet Zero','The Last Photon']},
    {id:'monsters',name:'Monsters',emoji:'👹',cost:21000,base:18,unlock:50000,gradient:'linear-gradient(135deg,#582544,#a93853)',desc:'Folklore beasts, dungeon horrors, and rare apex creatures.',seeds:[['Bog Imp','Common'],['Cave Bat','Common'],['Bone Pile','Common'],['Slime','Common'],['Haunted Doll','Common'],['Stone Gargoyle','Uncommon'],['Mimic Chest','Uncommon'],['Moon Wolf','Uncommon'],['Grave Warden','Uncommon'],['Night Vampire','Rare'],['Swamp Hydra','Rare'],['Dread Golem','Epic'],['Ancient Lich','Legendary'],['World Eater','Mythic']],a:['Bog','Cave','Bone','Night','Grave','Dread','Moon','Ash','Rotten','Hollow','Blood','Feral','Ancient','Howling','Black'],n:['Imp','Wraith','Ghoul','Gargoyle','Mimic','Wolf','Hydra','Vampire','Golem','Banshee','Troll','Witch','Spider','Warden','Slime','Cyclops','Harpy','Specter','Beast','Demon'],secrets:['The Thing Behind the Door','Monster Without a Name','The Red Guest','Teeth in the Fog']},
    {id:'cyber',name:'Cyber',emoji:'🤖',cost:85000,base:18,unlock:190000,gradient:'linear-gradient(135deg,#103d48,#16b6a8)',desc:'Neon streets, machines, rogue code, and impossible hardware.',seeds:[['Data Chip','Common'],['Neon Sign','Common'],['Street Drone','Common'],['Code Fragment','Common'],['Battery Core','Common'],['Cyber Hound','Uncommon'],['Arcade Ghost','Uncommon'],['Mech Arm','Uncommon'],['Hover Bike','Uncommon'],['Sentinel Unit','Rare'],['Neural Crown','Rare'],['Quantum Vault','Epic'],['Black ICE','Legendary'],['Singularity AI','Mythic']],a:['Neon','Chrome','Quantum','Black','Ghost','Street','Pulse','Neural','Synthetic','Rogue','Zero','Hyper','Digital','Laser','Nano'],n:['Drone','Chip','Hound','Core','Terminal','Blade','Bike','Unit','Vault','Android','Crawler','Node','Visor','Server','Proxy','Mech','Cipher','Grid','Reactor','Protocol'],secrets:['ROOT://GODMODE','The Machine Dreaming You','Null Crown','Final Login']},
    {id:"animals",tier:2,simple:true,name:"Villains",emoji:"🔪",cost:0,base:95,unlock:0,gradient:"linear-gradient(135deg,#230d15,#7e2030)",desc:"100 famous villains from horror, movies, comics, fantasy, and science fiction.",fixedNames:["Mr. Hyde", "The Headless Horseman", "Count Orlok", "The Mummy", "The Invisible Man", "The Wolf Man", "Sweeney Todd", "The Wicked Witch", "Queen of Hearts", "Captain Hook", "Cruella de Vil", "Lady Tremaine", "Oogie Boogie", "Governor Ratcliffe", "Gaston", "Shan Yu", "Dr. Facilier", "Evil Queen", "Yzma", "Lotso", "Mother Gothel", "Judge Frollo", "Jafar", "Ursula", "Scar", "Maleficent", "Hades", "Syndrome", "The Creeper", "Victor Crowley", "Pumpkinhead", "The Tall Man", "Leprechaun", "Mick Taylor", "Esther Coleman", "Candyman", "Pinhead", "Art the Clown", "Norman Bates", "Hannibal Lecter", "Chucky", "Dracula", "Grand Moff Tarkin", "General Grievous", "Count Dooku", "Darth Maul", "Saruman", "Gollum", "Smaug", "Bellatrix Lestrange", "Dolores Umbridge", "Lucius Malfoy", "Grindelwald", "The Penguin", "Two-Face", "Poison Ivy", "The Riddler", "Scarecrow", "Bane", "Ra's al Ghul", "Deathstroke", "Black Manta", "Sinestro", "Reverse-Flash", "Brainiac", "Lex Luthor", "Vulture", "Mysterio", "Kingpin", "Doctor Octopus", "Green Goblin", "Carnage", "Red Skull", "Ultron", "Kang the Conqueror", "Loki", "Magneto", "Apocalypse", "Dormammu", "Galactus", "The Night King", "Homelander", "Nurse Ratched", "Annie Wilkes", "Anton Chigurh", "Agent Smith", "T-1000", "Jigsaw", "Voldemort", "Darkseid", "Doctor Doom", "Leatherface", "Ghostface", "Pennywise", "Michael Myers", "Freddy Krueger", "Jason Voorhees", "Darth Vader", "The Joker", "Thanos"],secrets:["The Shape in Room 13","The Uncredited Killer","The Villain Who Won","The Last Face"]},
    {id:"valuables",tier:2,simple:true,name:"Superheroes",emoji:"🦸",cost:0,base:95,unlock:0,gradient:"linear-gradient(135deg,#174d8d,#d33b4d)",desc:"100 recognizable superheroes from comics, movies, television, and games.",fixedNames:["Kick-Ass", "Hit-Girl", "The Tick", "Atom Eve", "Invincible", "Hellboy", "Spawn", "Leonardo", "Raphael", "Donatello", "Michelangelo", "Batgirl", "Robin", "Blue Beetle", "Booster Gold", "Hawkman", "Hawkgirl", "Stargirl", "Plastic Man", "The Atom", "Firestorm", "Green Arrow", "Black Canary", "Cyborg", "Martian Manhunter", "Shazam", "Supergirl", "Nightwing", "Kate Bishop", "Echo", "Quake", "Cloak", "Dagger", "Squirrel Girl", "Jessica Jones", "Iron Fist", "Luke Cage", "Daredevil", "Blade", "Moon Knight", "Ghost Rider", "The Punisher", "Elektra", "She-Hulk", "Ant-Man", "The Wasp", "Falcon", "War Machine", "Black Widow", "Hawkeye", "Vision", "Scarlet Witch", "Captain Marvel", "Shang-Chi", "Spider-Woman", "Spider-Gwen", "Miles Morales", "Kitty Pryde", "Iceman", "Colossus", "Nightcrawler", "Gambit", "Rogue", "Beast", "Storm", "Jean Grey", "Cyclops", "Professor X", "Domino", "Cable", "Deadpool", "Ms. Marvel", "America Chavez", "Nova", "Blue Marvel", "Silver Surfer", "Adam Warlock", "Star-Lord", "Gamora", "Drax", "Rocket Raccoon", "Groot", "Mantis", "Human Torch", "Invisible Woman", "Mister Fantastic", "The Thing", "Doctor Strange", "Hulk", "Wolverine", "The Flash", "Aquaman", "Black Panther", "Thor", "Captain America", "Iron Man", "Wonder Woman", "Spider-Man", "Batman", "Superman"],secrets:["The First Cape","Hero Beyond Time","The Unwritten Champion","Last Guardian"]},
    {id:"places",tier:2,simple:true,name:"Pokémon",emoji:"⚡",cost:0,base:95,unlock:0,gradient:"linear-gradient(135deg,#f0c62c,#3c6ecb)",desc:"100 Pokémon ranging from familiar early-route catches to legendary and mythical favorites.",fixedNames:["Caterpie", "Weedle", "Pidgey", "Rattata", "Spearow", "Zubat", "Oddish", "Paras", "Venonat", "Diglett", "Meowth", "Psyduck", "Mankey", "Growlithe", "Poliwag", "Abra", "Machop", "Bellsprout", "Tentacool", "Geodude", "Ponyta", "Slowpoke", "Magnemite", "Doduo", "Seel", "Grimer", "Shellder", "Gastly", "Drowzee", "Krabby", "Voltorb", "Exeggcute", "Cubone", "Koffing", "Rhyhorn", "Horsea", "Goldeen", "Staryu", "Magikarp", "Eevee", "Bulbasaur", "Charmander", "Squirtle", "Pikachu", "Vulpix", "Jigglypuff", "Dratini", "Scyther", "Pinsir", "Lapras", "Snorlax", "Gengar", "Alakazam", "Machamp", "Golem", "Rapidash", "Slowbro", "Magneton", "Farfetch'd", "Dewgong", "Muk", "Cloyster", "Hypno", "Kingler", "Electrode", "Marowak", "Hitmonlee", "Hitmonchan", "Chansey", "Kangaskhan", "Seadra", "Starmie", "Mr. Mime", "Jynx", "Electabuzz", "Magmar", "Tauros", "Ditto", "Vaporeon", "Jolteon", "Flareon", "Porygon", "Aerodactyl", "Dragonair", "Venusaur", "Charizard", "Blastoise", "Raichu", "Ninetales", "Arcanine", "Gyarados", "Dragonite", "Articuno", "Zapdos", "Moltres", "Mewtwo", "Mew", "Rayquaza", "Lugia", "Arceus"],secrets:["MissingNo.","Shiny Mew","Ancient Poké Ball","The Unknown Egg"]},
    {id:"vehicles",tier:2,simple:true,name:"Dinosaurs",emoji:"🦖",cost:0,base:95,unlock:0,gradient:"linear-gradient(135deg,#335b32,#a68344)",desc:"Real dinosaurs and prehistoric animals from the Triassic, Jurassic, and Cretaceous.",seeds:[["Compsognathus","Common"],["Protoceratops","Common"],["Coelophysis","Common"],["Dryosaurus","Common"],["Gallimimus","Common"],["Dilophosaurus","Uncommon"],["Iguanodon","Uncommon"],["Pachycephalosaurus","Uncommon"],["Ankylosaurus","Uncommon"],["Stegosaurus","Rare"],["Triceratops","Rare"],["Spinosaurus","Epic"],["Velociraptor","Legendary"],["Tyrannosaurus rex","Mythic"]],a:["Triassic","Jurassic","Cretaceous","Fossil","Adult","Juvenile","Northern","Southern","Coastal","Desert","Forest","River","Museum","Prime","Ancient"],n:["Compsognathus","Coelophysis","Plateosaurus","Dilophosaurus","Allosaurus","Apatosaurus","Brachiosaurus","Diplodocus","Stegosaurus","Ceratosaurus","Iguanodon","Parasaurolophus","Pachycephalosaurus","Ankylosaurus","Triceratops","Gallimimus","Carnotaurus","Spinosaurus","Velociraptor","Tyrannosaurus rex","Deinonychus","Utahraptor","Oviraptor","Therizinosaurus","Giganotosaurus","Carcharodontosaurus","Albertosaurus","Edmontosaurus","Maiasaura","Styracosaurus","Kentrosaurus","Argentinosaurus","Suchomimus","Baryonyx","Acrocanthosaurus","Microraptor","Archaeopteryx","Pteranodon","Quetzalcoatlus","Mosasaurus"],secrets:["Sue the T. rex","Dueling Dinosaurs Fossil","Archaeopteryx Berlin Specimen","Black Beauty T. rex"]},
    {id:"nature",tier:2,simple:true,name:"Mythology",emoji:"⚡",cost:0,base:95,unlock:0,gradient:"linear-gradient(135deg,#604720,#b78d3f)",desc:"Gods, heroes, monsters, and legendary figures from world mythology.",seeds:[["Hermes","Common"],["Eros","Common"],["Pan","Common"],["Hestia","Common"],["Nike","Common"],["Ares","Uncommon"],["Athena","Uncommon"],["Apollo","Uncommon"],["Artemis","Uncommon"],["Poseidon","Rare"],["Hades","Rare"],["Odin","Epic"],["Thor","Legendary"],["Zeus","Mythic"]],a:["Greek","Roman","Norse","Egyptian","Celtic","Japanese","Hindu","Mayan","Aztec","Slavic","Ancient","Olympian","Titan","Heroic","Underworld"],n:["Zeus","Hera","Poseidon","Demeter","Athena","Apollo","Artemis","Ares","Aphrodite","Hermes","Dionysus","Hades","Persephone","Heracles","Achilles","Odysseus","Odin","Thor","Loki","Freya","Tyr","Heimdall","Baldr","Ra","Osiris","Isis","Anubis","Horus","Set","Bastet","Quetzalcoatl","Kukulkan","Amaterasu","Susanoo","Izanagi","Izanami","Cernunnos","Morrigan","Gilgamesh","Enkidu"],secrets:["Prometheus Unbound","Ragnarök Survivor","The Golden Fleece","Pandora's Sealed Box"]},
    {id:"history",tier:3,simple:true,name:"Video Games",emoji:"🎮",cost:0,base:480,unlock:0,gradient:"linear-gradient(135deg,#362278,#2ba6a5)",desc:"Famous video games, consoles, worlds, and icons from gaming history.",seeds:[["Pong","Common"],["Tetris","Common"],["Pac-Man","Common"],["Sonic the Hedgehog","Common"],["Minecraft","Common"],["The Sims","Uncommon"],["Portal","Uncommon"],["Halo","Uncommon"],["Fallout","Uncommon"],["The Legend of Zelda","Rare"],["God of War","Rare"],["Grand Theft Auto V","Epic"],["Super Mario Bros.","Legendary"],["World of Warcraft","Mythic"]],a:["Classic","Arcade","Retro","Modern","Collector","Launch","Deluxe","Portable","Console","PC","Online","Remastered","Original","Championship","Legendary"],n:["Pong","Tetris","Pac-Man","Donkey Kong","Super Mario Bros.","The Legend of Zelda","Metroid","Sonic the Hedgehog","Street Fighter II","Mortal Kombat","Doom","Quake","Diablo","StarCraft","Warcraft III","World of Warcraft","Halo","Gears of War","Mass Effect","Fallout","The Elder Scrolls V: Skyrim","Minecraft","Terraria","Portal","Half-Life","Counter-Strike","Fortnite","Rocket League","Overwatch","The Sims","Civilization","Age of Empires","Grand Theft Auto V","Red Dead Redemption 2","God of War","The Last of Us","Uncharted","Dark Souls","Elden Ring","Pokémon Red"],secrets:["Nintendo World Championships Cartridge","Polybius Cabinet","Original Minecraft Alpha","The Last Arcade Token"]},
    {id:"technology",tier:3,simple:true,name:"Movies",emoji:"🎬",cost:0,base:480,unlock:0,gradient:"linear-gradient(135deg,#1c2430,#98552d)",desc:"Recognizable movies from horror, action, science fiction, fantasy, comedy, and adventure.",seeds:[["Jaws","Common"],["Rocky","Common"],["Alien","Common"],["Ghostbusters","Common"],["The Goonies","Common"],["Die Hard","Uncommon"],["Jurassic Park","Uncommon"],["The Matrix","Uncommon"],["Back to the Future","Uncommon"],["The Shining","Rare"],["Terminator 2","Rare"],["The Lord of the Rings","Epic"],["Star Wars","Legendary"],["The Godfather","Mythic"]],a:["Classic","Original","Theatrical","Collector","Midnight","Anniversary","Director","Cinema","Premiere","Festival","Restored","70mm","Blockbuster","Cult","Award"],n:["Jaws","Alien","Aliens","Predator","The Thing","The Shining","Halloween","Scream","Ghostbusters","Rocky","Rambo","Die Hard","Top Gun","Terminator 2","Jurassic Park","Back to the Future","E.T.","Indiana Jones","Star Wars","The Empire Strikes Back","The Godfather","Goodfellas","Pulp Fiction","The Matrix","Gladiator","Titanic","Avatar","The Lord of the Rings","The Dark Knight","Inception","Interstellar","Mad Max: Fury Road","Toy Story","The Lion King","Shrek","Finding Nemo","Home Alone","The Goonies","Blade Runner","2001: A Space Odyssey"],secrets:["Lost Director's Cut","Original 35mm Print","Unreleased Final Reel","Premiere Ticket No. 1"]},
    {id:"sports",tier:3,simple:true,name:"Supercars",emoji:"🏎️",cost:0,base:480,unlock:0,gradient:"linear-gradient(135deg,#861d24,#202833)",desc:"Real supercars, hypercars, homologation specials, and famous performance machines.",seeds:[["Mazda RX-7","Common"],["Toyota Supra","Common"],["Nissan GT-R","Common"],["Porsche 911","Common"],["Chevrolet Corvette","Common"],["Audi R8","Uncommon"],["Mercedes-AMG GT","Uncommon"],["BMW M1","Uncommon"],["Ford GT","Uncommon"],["Ferrari F40","Rare"],["Lamborghini Countach","Rare"],["Porsche Carrera GT","Epic"],["McLaren F1","Legendary"],["Bugatti Chiron","Mythic"]],a:["Classic","Track","Road","Limited","Launch","Carbon","Heritage","Performance","GT","RS","R","Competition","Anniversary","Prototype","Final"],n:["Ferrari F40","Ferrari F50","Ferrari Enzo","Ferrari LaFerrari","Ferrari 288 GTO","Lamborghini Countach","Lamborghini Diablo","Lamborghini Murciélago","Lamborghini Aventador","Lamborghini Revuelto","McLaren F1","McLaren P1","McLaren Senna","Porsche 959","Porsche Carrera GT","Porsche 918 Spyder","Bugatti Veyron","Bugatti Chiron","Pagani Zonda","Pagani Huayra","Koenigsegg Agera","Koenigsegg Jesko","Ford GT","Acura NSX","Nissan GT-R","Lexus LFA","Mercedes-Benz SLR McLaren","Mercedes-AMG One","Aston Martin Valkyrie","Chevrolet Corvette ZR1","Dodge Viper","Lotus Esprit","Jaguar XJ220","Maserati MC12","Audi R8","BMW M1","Toyota Supra","Mazda RX-7","Honda NSX","Shelby Cobra"],secrets:["McLaren F1 LM","Ferrari 250 GTO","Bugatti Type 57SC Atlantic","Mercedes-Benz 300 SLR Uhlenhaut Coupé"]},
    {id:"music",tier:3,simple:true,name:"World Wonders",emoji:"🌍",cost:0,base:480,unlock:0,gradient:"linear-gradient(135deg,#1e5a63,#b58448)",desc:"Real landmarks, natural wonders, ancient monuments, and famous places around the world.",seeds:[["Stonehenge","Common"],["Mount Rushmore","Common"],["Golden Gate Bridge","Common"],["Eiffel Tower","Common"],["Niagara Falls","Common"],["Colosseum","Uncommon"],["Petra","Uncommon"],["Machu Picchu","Uncommon"],["Angkor Wat","Uncommon"],["Grand Canyon","Rare"],["Great Barrier Reef","Rare"],["Taj Mahal","Epic"],["Great Wall of China","Legendary"],["Great Pyramid of Giza","Mythic"]],a:["Ancient","Historic","Northern","Southern","Coastal","Mountain","Desert","Sacred","Royal","World","Natural","Hidden","Famous","Protected","Monumental"],n:["Great Pyramid of Giza","Great Wall of China","Petra","Colosseum","Chichén Itzá","Machu Picchu","Taj Mahal","Christ the Redeemer","Stonehenge","Angkor Wat","Acropolis of Athens","Eiffel Tower","Statue of Liberty","Golden Gate Bridge","Mount Rushmore","Grand Canyon","Yellowstone","Yosemite","Niagara Falls","Victoria Falls","Iguazu Falls","Mount Everest","Mount Fuji","Matterhorn","Great Barrier Reef","Galápagos Islands","Amazon Rainforest","Sahara Desert","Dead Sea","Ha Long Bay","Serengeti","Uluru","Table Mountain","Santorini","Venice","Pompeii","Alhambra","Neuschwanstein Castle","Burj Khalifa","Sydney Opera House"],secrets:["Hanging Gardens of Babylon","Colossus of Rhodes","Lighthouse of Alexandria","Temple of Artemis"]},
    {id:"weather",tier:3,simple:true,name:"Mythical Creatures",emoji:"🐉",cost:0,base:480,unlock:0,gradient:"linear-gradient(135deg,#49306a,#8d355e)",desc:"Famous creatures from folklore, mythology, legends, and old monster stories.",seeds:[["Goblin","Common"],["Brownie","Common"],["Kelpie","Common"],["Satyr","Common"],["Imp","Common"],["Griffin","Uncommon"],["Centaur","Uncommon"],["Minotaur","Uncommon"],["Basilisk","Uncommon"],["Hydra","Rare"],["Phoenix","Rare"],["Kraken","Epic"],["Unicorn","Legendary"],["Dragon","Mythic"]],a:["Ancient","Northern","Greek","Norse","Celtic","Desert","Mountain","Sea","Forest","Royal","Golden","Black","White","Red","Winged"],n:["Dragon","Phoenix","Griffin","Unicorn","Pegasus","Hydra","Minotaur","Centaur","Basilisk","Kraken","Mermaid","Siren","Cyclops","Gorgon","Chimera","Sphinx","Cerberus","Werewolf","Vampire","Yeti","Sasquatch","Nessie","Kelpie","Banshee","Leprechaun","Goblin","Troll","Ogre","Fairy","Satyr","Djinn","Roc","Thunderbird","Manticore","Wyvern","Sea Serpent","Naga","Kappa","Oni","Qilin"],secrets:["Jörmungandr","Fenrir","Leviathan","World Dragon"]}
  ];
  const flavorPools={
    medieval:['Forged for a war whose banners have long since rotted away.','Nobody remembers who first carried it, only who failed to return it.','The old songs insist this piece has never known a peaceful owner.','A court relic with a history more dangerous than its edge.','It smells faintly of rain, smoke, and a ruined coronation.'],
    food:['A recipe guarded with the seriousness of a royal secret.','Best served hot, preferably before somebody else notices it.','Nobody agrees on the ingredients, which is probably for the best.','One bite and every sensible plan for the evening is immediately cancelled.','The menu simply calls it “the reason you came back.”'],
    ocean:['Recovered from water too deep for sunlight to remember.','Sailors argue about whether seeing one is lucky. The sailors who vanished cannot comment.','Salt has worn away the name, but not the story.','It drifted up from below without bubbles, sound, or explanation.','The tide always seems slightly higher when this is nearby.'],
    space:['Its signal arrives a fraction of a second before it is transmitted.','The navigation computer insists this object is not there.','Older than the map used to find it.','For twelve seconds, every telescope pointed at it recorded the same impossible shape.','It has crossed more empty distance than anything this small has a right to survive.'],
    monsters:['The warning on the cage was scratched from the inside.','Every village has a different name for it and the same rule: do not follow.','Tracks appear before the creature does. Sometimes they are yours.','It is much quieter than the stories promised.','The lantern goes out first. That is how you know it is close.'],
    cyber:['The manufacturer denies this model was ever produced.','It keeps a log file containing dates that have not happened yet.','No known user has the permissions required to shut it down.','The checksum changes whenever nobody is looking.','It was designed to solve one problem and quietly invented three new ones.'],
    animals:['A face every final survivor would recognize.','Some villains need a plan. Others only need the lights to go out.','The name alone is enough to change the mood in the room.','A collector favorite for all the wrong reasons.','You already know the music that should be playing.'],
    valuables:['The kind of name that belongs on the front of the comic, not the fine print.','A hero card built for the center of the binder.','Some capes are famous before the person wearing them even speaks.','Every collection eventually needs its icons.','The pose is practically printed into pop culture.'],
    places:['Caught, collected, traded, and immediately argued about.','A familiar name from a very large Pokédex.','Some collectors chase rarity. Others chase their favorite.','One pull away from changing the whole pack opening.','A pocket-sized reason to open one more pack.'],
    vehicles:['A name reconstructed from stone, bone, and a lot of patience.','Millions of years old and still instantly recognizable.','The museum gift shop wishes it had this pull.','Prehistoric does not mean forgettable.','A fossil-era heavyweight for the binder.'],
    nature:['A story old enough to have several different endings.','God, hero, monster, or all three depending on who tells it.','Ancient names tend to carry ancient problems.','A myth that survived because people kept retelling it.','The kind of legend that makes a normal card feel small.'],
    history:['A title that ate more hours than anyone planned to give it.','Some games become memories before the console is even unplugged.','A familiar name from the history of pressing Start.','One of those titles people can identify from a single sound.','A piece of gaming history disguised as a card.'],
    technology:['A title made for a dark theater and a giant screen.','Some movies outlive the decade that made them.','You can probably hear a line from it already.','A piece of cinema that became part of everyday culture.','The credits rolled. The collecting did not.'],
    sports:['Built for speed first and reasonable decisions much later.','A machine that turns fuel, carbon, and money into noise.','Poster-car energy in card form.','The kind of car people recognize before they see the badge.','Fast enough to make the price tag feel slow.'],
    music:['A place people cross oceans to see once.','Some landmarks look impossible even after you arrive.','A postcard subject upgraded into a collectible.','One of those places that makes scale hard to understand.','The world is full of places worth putting in a binder.'],
    weather:['Every culture seems to have invented at least one creature like this.','Old stories rarely agree on how dangerous it really is.','A legend with too many sightings to disappear completely.','The map says folklore. The card says maybe.','A creature that survived centuries without needing proof.']
  };
  function hashString(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return Math.abs(h>>>0)}
  const rarityPowerBands={
    Common:[50,110],
    Uncommon:[130,270],
    Rare:[320,480],
    Epic:[520,850],
    Legendary:[950,1500],
    Mythic:[1650,2650],
    Divine:[2800,4400],
    Ultra:[4500,7500],
    Secret:[7000,13000]
  };
  function fixedRarityPower(themeId,name,rarity){
    const band=rarityPowerBands[rarity]||rarityPowerBands.Common;
    const h=hashString(`${themeId}|${name}|${rarity}|PACKFORGE_POWER_V2`);
    const t=(h%1000000)/999999;
    return Math.round(band[0]+(band[1]-band[0])*t);
  }
  function flavorFor(themeId,key){
    const name=String(key||'This card').trim();
    const lore={
      medieval:[`${name} is recorded in the old kingdom chronicles as a name tied to banners, steel, and the uneasy peace between wars.`,`${name} survived in stories because somebody thought the name was important enough to write down after the fighting stopped.`,`${name} belongs to the medieval set's world of keeps, roads, relics, and the people whose choices shaped them.`],
      food:[`${name} earned its place in the Food collection by being the kind of dish people recognize before the plate even reaches the table.`,`${name} is the sort of food whose recipe changes from kitchen to kitchen while the name stays instantly familiar.`,`${name} belongs here for one simple reason: somebody, somewhere, is already craving it.`],
      ocean:[`${name} belongs to the Ocean collection's world of reefs, wrecks, currents, and life adapted to places humans rarely see.`,`${name} carries the mystery of the sea with it—the deeper the water, the stranger the story tends to become.`,`${name} is part of the blue half of the planet, where familiar names can still hide unfamiliar details.`],
      space:[`${name} is part of the Space collection because it helped shape how we picture the universe beyond Earth.`,`${name} belongs among planets, spacecraft, stars, and deep-space phenomena that make distance feel almost impossible.`,`${name} is a reminder that even a familiar name can represent something separated from us by enormous scales of space and time.`],
      monsters:[`${name} appears in the Monsters collection as one of the creatures, threats, or legends people would rather meet on cardboard than in the dark.`,`${name} has the kind of name monster stories are built around: memorable enough to survive long after the warning was first told.`,`${name} belongs to the set's darker folklore, where the safest rule is usually not to investigate the noise.`],
      cyber:[`${name} belongs to PackForge's Cyber set: neon hardware, rogue systems, impossible machines, and technology pushed one step too far.`,`${name} sounds like something a manufacturer would call a prototype right before denying it ever existed.`,`${name} sits comfortably in a collection about machines that are useful right up until they start making decisions for themselves.`],
      animals:[`${name} is featured in the Villains collection because the name carries the threat, conflict, or fear that made the character memorable.`,`${name} belongs among screen and page villains whose presence can change a story before they even make a move.`,`${name} earned a place in the Villains set by becoming the kind of antagonist audiences remember long after the heroes leave the scene.`],
      valuables:[`${name} is featured in the Superheroes collection as one of the names that helped define heroic stories in comics, film, or television.`,`${name} belongs in a binder full of capes, masks, symbols, and larger-than-life characters built to be remembered.`,`${name} is part of the Superheroes set because the identity itself has become collectible.`],
      places:[`${name} is represented here as part of the Pokémon collection, a roster built around creatures people catch, train, trade, and remember by name.`,`${name} belongs to a franchise where a favorite Pokémon can matter more to a collector than raw rarity ever will.`,`${name} is one small part of a Pokédex that turned collecting creatures into a worldwide obsession.`],
      vehicles:[`${name} belongs to the Dinosaurs collection, a group reconstructed from fossils and remembered through science, museums, books, and imagination.`,`${name} is a prehistoric name that survived millions of years well enough to end up recognizable on a modern card.`,`${name} represents the dinosaur set's mix of predators, giants, armor, horns, feathers, and fossil evidence.`],
      nature:[`${name} belongs to the Mythology collection, where gods, heroes, monsters, and legends often change depending on who is telling the story.`,`${name} survived through myth because generations kept repeating the name and reshaping the story around it.`,`${name} is part of an old tradition of using larger-than-life figures to explain courage, disaster, fate, and the unknown.`],
      history:[`${name} belongs to the Video Games collection because the title became part of the history of picking up a controller and pressing Start.`,`${name} is remembered not just as software, but as a game people associate with a particular era, machine, or memory.`,`${name} earned a card because some game titles stop being products and become landmarks in gaming history.`],
      technology:[`${name} belongs to the Movies collection as a title that found a lasting place in cinema and popular culture.`,`${name} is the kind of film name that can bring back a scene, a line, a score, or an entire era before the credits even roll.`,`${name} earned a place in the set because memorable movies tend to outlive the theaters that first showed them.`],
      sports:[`${name} belongs to the Supercars collection: machines built around speed, engineering, drama, and very little concern for subtlety.`,`${name} is the sort of performance car whose name can be recognizable before anyone quotes horsepower or top speed.`,`${name} earned its card by turning engineering into something people put on bedroom walls, screensavers, and dream-car lists.`],
      music:[`${name} belongs to the World Wonders collection because the place has become a destination, landmark, natural spectacle, or symbol recognized far beyond its location.`,`${name} is one of those places where photographs struggle to communicate the real scale, history, or atmosphere.`,`${name} earned a card by becoming the kind of place people travel across countries—or oceans—to see in person.`],
      weather:[`${name} belongs to the Mythical Creatures collection, where folklore preserves beings that never needed scientific proof to become famous.`,`${name} has survived through stories, sightings, art, and retellings that changed the details while keeping the creature's name alive.`,`${name} is part of the old human habit of giving a name and a shape to whatever might be waiting beyond the firelight.`]
    };
    const pool=lore[themeId]||[`${name} is part of this PackForge collection because the subject has a story, identity, or reputation worth putting on a card.`,`${name} is represented here as a collectible built around the history and identity of the name itself.`,`${name} earned its place in the set by being recognizable enough to deserve its own card.`];
    return pool[hashString(themeId+'|'+name)%pool.length]
  }
  const nameStyle={
    medieval:{rare:['of Blackmere','of Dragonfall','of the Last Keep','of Red Hollow','of the Iron Road','of Wintercourt','of Ravenwatch','of the Broken Crown'],epic:['the Unbroken','the Oathbound','the Last','the Crowned','of the Long Siege','of the Kingless Road','the Deathless']},
    food:{rare:['Deluxe','Supreme','After Dark','House Special','Secret Recipe','Extra Crispy','Reserve','Chef’s Cut'],epic:['The Impossible Order','Midnight Edition','Chef’s Masterpiece','The House Favorite','Last Course','No. 1 Special','Festival Edition']},
    ocean:{rare:['of the Deep','at High Tide','from Bluewater','of the Lost Reef','Below the Shelf','of Cold Current','from the Outer Shoal','of Blackwater'],epic:['from the Black Trench','the Uncharted','of the Silent Reef','Beneath Moonlight','the Drowned','of the Last Tide','Beyond the Shelf']},
    space:{rare:['Prime','in Retrograde','of Sector Nine','Deep-Range','Beyond Mars','of the Far Rim','Night-Side','Long-Distance'],epic:['Beyond Orbit','at First Light','of the Silent Dark','The Impossible Signal','Past the Heliopause','of the Far Horizon','Zero-G Edition']},
    monsters:{rare:['of the Moor','Under Moonlight','from the Cellar','of Red Hollow','of the Old Road','from Below','of the Graveyard','After Midnight'],epic:['the Unseen','the Unburied','the Howling','Behind the Wall','of the Last Lantern','the Uninvited','the Sleepless']},
    cyber:{rare:['MK II','Prime','Zero-Day','Night Build','Blacksite','Overclocked','Ghostline','Prototype'],epic:['ROOT Edition','the Unpatched','Blackout Build','Afterimage','the Unlicensed','Dead Channel','Final Revision']}
  };
  function generatedName(def,rarity,serial){
    const a=def.a[(serial*7+rarityOrder.indexOf(rarity)*3)%def.a.length];
    const n=def.n[(serial*11+rarityOrder.indexOf(rarity)*5)%def.n.length];
    const style=nameStyle[def.id]||nameStyle.medieval;
    if(def.simple){if(rarity==='Common')return serial<def.n.length?`${n}`:`${a} ${n}`;if(rarity==='Uncommon')return `${a} ${n}`;if(rarity==='Rare')return `${n} Reserve`;if(rarity==='Epic')return `Collector ${n}`;if(rarity==='Legendary')return `Iconic ${n}`;if(rarity==='Mythic')return `${n} Masterpiece`;if(rarity==='Divine')return `${n} World Class`;if(rarity==='Ultra')return `${n} Apex`;}
    if(rarity==='Common'&&(def.id==='food'||def.id==='space'))return `${n}`;
    if(rarity==='Common')return `${a} ${n}`;
    if(rarity==='Uncommon')return `${a} ${n}`;
    if(rarity==='Rare')return `${a} ${n} ${style.rare[serial%style.rare.length]}`;
    if(rarity==='Epic')return `${a} ${n}, ${style.epic[serial%style.epic.length]}`;
    if(rarity==='Legendary')return def.id==='cyber'?`${a} ${n} // PRIME`:`The ${a} ${n}`;
    if(rarity==='Mythic')return `${a} ${n} Ascendant`;
    if(rarity==='Divine')return def.id==='cyber'?`${a} ${n} // TRANSCENDENT`:`${a} ${n}, Beyond the Known`;
    if(rarity==='Ultra')return `${a} ${n} Apex`;
    return `${a} ${n}`;
  }
  function buildTheme(def){
    const cards=[],used=new Set();
    const add=(name,rarity)=>{if(used.has(name))return false;used.add(name);const i=cards.length,within=cards.filter(c=>c.rarity===rarity).length;cards.push({id:def.id+'_'+i,name,rarity,theme:def.id,value:Math.round(def.base*rarityMult[rarity]*(.9+(within%9)*.025)),power:fixedRarityPower(def.id,name,rarity),secret:false,flavor:flavorFor(def.id,name)});return true};
    if(Array.isArray(def.fixedNames)&&def.fixedNames.length>=100){
      let fixedIndex=0;
      for(const rarity of rarityOrder){
        for(let i=0;i<rarityTargets[rarity];i++){
          add(def.fixedNames[fixedIndex++]||`${def.name} #${fixedIndex}`,rarity);
        }
      }
    }else{
      (def.seeds||[]).forEach(x=>add(x[0],x[1]));
      for(const rarity of rarityOrder){
        let serial=0;
        while(cards.filter(c=>c.rarity===rarity).length<rarityTargets[rarity]){
          let name=generatedName(def,rarity,serial++);
          if(used.has(name))continue;
          add(name,rarity);
        }
      }
    }
    const secretCards=def.secrets.map((name,i)=>({id:`${def.id}_secret_${i}`,name,rarity:'Secret',theme:def.id,value:Math.round(def.base*rarityMult.Secret*(1+i*.24)),power:fixedRarityPower(def.id,name,'Secret'),secret:true,flavor:flavorFor(def.id,name)}));
    return {...def,cards,secretCards,allCards:[...cards,...secretCards]};
  }
  const battleHiddenDefs=[
    {id:'dinosaurs',battleHidden:true,unlockBattle:'reallyhard',name:'Dinosaurs',emoji:'🦖',shopCost:325,base:20,gradient:'linear-gradient(135deg,#31512c,#9f8f3b)',desc:'Predators, giants, armored dinosaurs, and fossils from a hidden collection.',simple:true,a:['Ancient','Fossil','Cretaceous','Jurassic','Titan','Prime','Apex','Young','Armored','Horned','Feathered','Giant'],n:['Tyrannosaurus Rex','Velociraptor','Triceratops','Stegosaurus','Brachiosaurus','Spinosaurus','Allosaurus','Ankylosaurus','Diplodocus','Parasaurolophus','Iguanodon','Carnotaurus','Pachycephalosaurus','Deinonychus','Compsognathus','Apatosaurus','Giganotosaurus','Therizinosaurus','Dilophosaurus','Gallimimus'],secrets:['The First Fossil','King of the Cretaceous','The Lost Herd','Impact Survivor']},
    {id:'superheroes',battleHidden:true,unlockBattle:'nightmare',name:'Superheroes',emoji:'🦸',shopCost:350,base:21,gradient:'linear-gradient(135deg,#174a89,#d74253)',desc:'Masked champions, cosmic protectors, and legendary defenders from a hidden collection.',simple:true,a:['Solar','Iron','Night','Scarlet','Golden','Emerald','Silver','Cosmic','Shadow','Thunder','Atomic','Sky'],n:['Guardian','Sentinel','Champion','Ranger','Defender','Avenger','Protector','Paladin','Vanguard','Titan','Beacon','Comet','Phoenix','Falcon','Knight','Voyager','Warden','Star','Shield','Arrow'],secrets:['The First Hero','Last Light of the City','Hero Beyond Time','The Unbreakable Cape']},
    {id:'pokemon',battleHidden:true,unlockBattle:'insane',name:'Pokémon',emoji:'⚡',shopCost:375,base:22,gradient:'linear-gradient(135deg,#e8b928,#2d73c9)',desc:'A hidden monster-catching collection.',simple:true,a:['Wild','Shiny','Ancient','Partner','Champion','Rare','Battle','Safari','Coastal','Mountain','Forest','Cave'],n:['Bulbasaur','Ivysaur','Venusaur','Charmander','Charmeleon','Charizard','Squirtle','Wartortle','Blastoise','Caterpie','Metapod','Butterfree','Weedle','Kakuna','Beedrill','Pidgey','Pidgeotto','Pidgeot','Rattata','Spearow','Pikachu','Raichu','Sandshrew','Nidoran','Clefairy','Vulpix','Jigglypuff','Zubat','Oddish','Diglett','Meowth','Psyduck','Mankey','Growlithe','Poliwag','Abra','Machop','Bellsprout','Tentacool','Geodude','Ponyta','Slowpoke','Magnemite','Farfetch’d','Doduo','Seel','Grimer','Shellder','Gastly','Haunter','Gengar','Drowzee','Krabby','Voltorb','Exeggcute','Cubone','Hitmonlee','Hitmonchan','Lickitung','Koffing'],secrets:['Mew','Mewtwo','MissingNo.','The Master Ball']},
    {id:'villains',battleHidden:true,unlockBattle:'hell',name:'Villains',emoji:'🔪',shopCost:400,base:23,gradient:'linear-gradient(135deg,#230d15,#8a1e33)',desc:'Horror icons, masterminds, tyrants, and monsters from a hidden collection.',simple:true,seeds:[['Jason Voorhees','Legendary'],['The Masked Killer','Rare'],['The Dark Lord','Epic'],['The Mastermind','Rare']],a:['Masked','Silent','Crimson','Black','Cold','Final','Midnight','Broken','Infernal','Hollow','Cursed','Ruthless'],n:['Killer','Mastermind','Tyrant','Witch','Hunter','Butcher','Phantom','Overlord','Assassin','Doctor','Warden','Monster','Stalker','King','Queen','Executioner','Demon','Outlaw','Conqueror','Reaper'],secrets:['The Final Villain','The One Behind the Mask','The Unwritten Ending','The Last Scream']},
    {id:'mythology',battleHidden:true,unlockBattle:'goodluck',name:'Mythology',emoji:'⚡',shopCost:425,base:24,gradient:'linear-gradient(135deg,#59411b,#9176d8)',desc:'Gods, monsters, heroes, and relics from a hidden collection.',simple:true,a:['Olympian','Norse','Egyptian','Roman','Ancient','Divine','Golden','Underworld','Storm','Sun','Moon','Sea'],n:['Zeus','Athena','Thor','Odin','Loki','Ra','Anubis','Horus','Poseidon','Hades','Ares','Apollo','Artemis','Hera','Hermes','Minotaur','Hydra','Medusa','Fenrir','Valkyrie','Sphinx','Cyclops','Pegasus','Cerberus','Kraken','Mjolnir','Excalibur','Gungnir','Aegis','Labyrinth'],secrets:['The First Thunderbolt','The Forgotten God','The Door to Valhalla','The Last Oracle']}
  ];
  const coreThemeDefs=themeDefs.filter(d=>!d.tier&&['medieval','food','ocean','space','monsters'].includes(d.id));
  const campaignHiddenDefs=[...battleHiddenDefs,...themeDefs.filter(d=>d.tier===3)].map(d=>({...d,campaignHidden:true,battleHidden:false,shopCost:1000,base:95,unlock:0}));
  const themes=[...coreThemeDefs,...campaignHiddenDefs].map(buildTheme);
  const allCards=[...themes.flatMap(t=>t.allCards)];
  const GHOST_CARD={id:'packforge_unlisted_null',name:'The Unlisted Print',rarity:'Ghost',theme:'medieval',value:500000,power:5000000,secret:true,ghost:true,flavor:'No set number. No printing record. No explanation.'};
  const cardMap={...Object.fromEntries(allCards.map(c=>[c.id,c])),[GHOST_CARD.id]:GHOST_CARD};
  let uidCounter=0;
  function uid(){uidCounter++;return `${Date.now().toString(36)}_${uidCounter.toString(36)}_${Math.random().toString(36).slice(2,7)}`}
  const defaultState=()=>({
    schemaVersion:SAVE_SCHEMA,
    upgradeReset20260910:true,
    overdrive:{points:0,clickRemainder:0,packRemainder:0,activeUntil:0,totalLaunches:0},
    adminForces:{godMode:null,bonusNext:false,ghostNext:false,blackLabelNext:false,crueNext:false,jetNext:false},
    cash:0,lifetime:0,clickLevel:0,autoLevel:0,kioskLevel:0,lineLevel:0,warehouseLevel:0,hubLevel:0,engineLevel:0,variantLensLevel:0,campaignPrepLevel:0,gradeEfficiencyLevel:0,
    inventory:{},discovered:{},history:{},favorites:{},usedSerials:{},packInventory:{},specialPackInventory:[],premiumPackInventory:{},redeemedCodes:{},legacyVault:{specialPackInventory:[]},quirkStats:{godPacks:0,semiGodPacks:0,archiveGodPacks:0,packAnomalies:0,factoryErrors:0,holoPatterns:0,ghostCards:0,blackLabels:0,nearMisses:0,crueLowe:0,jetLumagui:0},tutorialGuide:{started:false,completed:false},showcase:{slots:[null,null,null,null,null],selectedSlot:0,discoveredCombos:{},incomeEarned:0,lastIncomeAt:Date.now()},potionInventory:{},activePotions:{},packsOpened:0,totalCards:0,collectionView:'grid',collectionPage:1,sound:true,soundVolume:.78,soundProfile:'normal',settings:{quality:'high',targetFPS:60,fpsCounter:false,particles:'full',antiLag:'off',reduceMotion:false,uiScale:100,textScale:100,reduceFlashes:false,screenShake:true,backgroundStars:true,cardEffects:true,highContrast:false,coinSounds:true,packSounds:true,rewardSounds:true,rareSoundFlourish:true,autoPerformanceGuard:true},shopTier:1,luckyChain:{active:false,step:0,longest:0},lastTick:Date.now(),passiveBoostUntil:0,clickBoostUntil:0,casino:{wins:0,losses:0,biggestWin:0},rouletteBets:[],campaigns:{completed:{},active:null,active2:null,selected:[],selectedCampaign:0,offers:[],selectedOfferId:null,offerGeneration:0,lastManualRefresh:0,offerVersion:0},campaignSetOffers:{},campaignSetSeen:{},stats:{clicks:0,criticals:0,jackpots:0,packDrops:0,packsBought:0,upgradesBought:0,cardsSold:0,cashFromSales:0,gradesSubmitted:0,gradesCompleted:0,cashSpent:0,games:{},packOpenedByTheme:{},packsBoughtByTier:{},luckyChainsStarted:0,longestLuckyChain:0,campaignPowerSent:0,campaignMinutes:0,campaignPacksWon:0,campaignSpecialsWon:0,campaignPotionsWon:0}
  });
  let state=defaultState();
  let loadedSave=null,loadedSaveKey=null;
  try{
    let raw=localStorage.getItem(saveKey);loadedSaveKey=raw?saveKey:null;
    if(!raw){for(const legacyKey of LEGACY_SAVE_KEYS){const candidate=localStorage.getItem(legacyKey);if(candidate){raw=candidate;loadedSaveKey=legacyKey;break}}}
    if(raw){loadedSave=JSON.parse(raw);if(loadedSave&&typeof loadedSave==='object'&&!Array.isArray(loadedSave))state=mergeSaveDefaults(defaultState(),loadedSave)}
  }catch(e){console.warn('PackForge save could not be read; starting with a clean in-memory state without deleting the stored data.',e)}
  state.inventory=state.inventory||{};state.discovered=state.discovered||{};state.history=state.history||{};state.favorites=state.favorites||{};state.usedSerials=state.usedSerials||{};state.packInventory=state.packInventory||{};state.specialPackInventory=Array.isArray(state.specialPackInventory)?state.specialPackInventory:[];state.premiumPackInventory=state.premiumPackInventory||{};for(const id of Object.keys(premiumPackDefs))state.premiumPackInventory[id]=Math.max(0,Number(state.premiumPackInventory[id]||0));state.redeemedCodes=(state.redeemedCodes&&typeof state.redeemedCodes==='object'&&!Array.isArray(state.redeemedCodes))?state.redeemedCodes:{};state.quirkStats={godPacks:0,semiGodPacks:0,archiveGodPacks:0,packAnomalies:0,factoryErrors:0,holoPatterns:0,ghostCards:0,blackLabels:0,nearMisses:0,crueLowe:0,jetLumagui:0,...(state.quirkStats||{})};state.showcase={slots:[null,null,null,null,null],selectedSlot:0,discoveredCombos:{},incomeEarned:0,lastIncomeAt:Date.now(),...(state.showcase||{})};state.showcase.slots=Array.isArray(state.showcase.slots)?state.showcase.slots.slice(0,5):[null,null,null,null,null];while(state.showcase.slots.length<5)state.showcase.slots.push(null);state.showcase.discoveredCombos=state.showcase.discoveredCombos||{};state.showcase.selectedSlot=clamp(+(state.showcase.selectedSlot||0),0,4);state.potionInventory=state.potionInventory||{};state.activePotions=state.activePotions||{};state.overdrive={points:0,clickRemainder:0,packRemainder:0,activeUntil:0,totalLaunches:0,...(state.overdrive||{})};state.overdrive.points=clamp(Number(state.overdrive.points)||0,0,100);state.overdrive.clickRemainder=Math.max(0,Math.floor(Number(state.overdrive.clickRemainder)||0))%75;state.overdrive.packRemainder=Math.max(0,Math.floor(Number(state.overdrive.packRemainder)||0))%3;state.overdrive.activeUntil=Math.max(0,Number(state.overdrive.activeUntil)||0);state.overdrive.totalLaunches=Math.max(0,Math.floor(Number(state.overdrive.totalLaunches)||0));state.adminForces={godMode:null,bonusNext:false,ghostNext:false,blackLabelNext:false,crueNext:false,jetNext:false,...(state.adminForces||{})};state.casino=state.casino||{wins:0,losses:0,biggestWin:0};state.rouletteBets=Array.isArray(state.rouletteBets)?state.rouletteBets:[];state.campaigns=state.campaigns||{completed:{},active:null,selected:[],selectedCampaign:0,offers:[],selectedOfferId:null,offerGeneration:0};state.campaigns.active2=state.campaigns.active2||null;state.campaigns.completed=state.campaigns.completed||{};state.campaigns.selected=Array.isArray(state.campaigns.selected)?state.campaigns.selected:[];state.campaigns.selectedCampaign=Number.isFinite(+state.campaigns.selectedCampaign)?+state.campaigns.selectedCampaign:0;state.campaigns.offers=Array.isArray(state.campaigns.offers)?state.campaigns.offers:[];state.campaigns.selectedOfferId=state.campaigns.selectedOfferId||null;state.campaigns.offerGeneration=Number.isFinite(+state.campaigns.offerGeneration)?+state.campaigns.offerGeneration:0;state.campaigns.lastManualRefresh=Number.isFinite(+state.campaigns.lastManualRefresh)?+state.campaigns.lastManualRefresh:0;state.campaigns.offerVersion=Number.isFinite(+state.campaigns.offerVersion)?+state.campaigns.offerVersion:0;for(const t of themes)state.packInventory[t.id]=Math.max(0,state.packInventory[t.id]||0);if(state.packCredits){state.packInventory.medieval=(state.packInventory.medieval||0)+state.packCredits;delete state.packCredits;}
  state.stats={clicks:0,criticals:0,jackpots:0,packDrops:0,packsBought:0,upgradesBought:0,cardsSold:0,cashFromSales:0,gradesSubmitted:0,gradesCompleted:0,cashSpent:0,games:{},packOpenedByTheme:{},packsBoughtByTier:{},luckyChainsStarted:0,longestLuckyChain:0,campaignPowerSent:0,campaignMinutes:0,campaignPacksWon:0,campaignSpecialsWon:0,campaignPotionsWon:0,...(state.stats||{})};state.stats.games=state.stats.games||{};state.stats.packOpenedByTheme=state.stats.packOpenedByTheme||{};state.stats.packsBoughtByTier=state.stats.packsBoughtByTier||{};state.tutorialGuide={started:false,completed:false,...(state.tutorialGuide||{})};delete state['tut'+'orial'];state.schemaVersion=SAVE_SCHEMA;state.settings={quality:'high',targetFPS:60,fpsCounter:false,particles:'full',antiLag:'off',reduceMotion:false,uiScale:100,textScale:100,reduceFlashes:false,screenShake:true,backgroundStars:true,cardEffects:true,highContrast:false,coinSounds:true,packSounds:true,rewardSounds:true,rareSoundFlourish:true,...(state.settings||{})};state.campaignSetOffers=state.campaignSetOffers||{};state.campaignSetSeen=state.campaignSetSeen||{};state.soundVolume=Number.isFinite(+state.soundVolume)?clamp(+state.soundVolume,0,1):.78;state.soundProfile=state.soundProfile||'normal';state.shopTier=clamp(+(state.shopTier||1),1,3);state.luckyChain={active:false,step:0,longest:0,...(state.luckyChain||{})};delete state.dealer;
  state.battle={selectedDifficulty:null,selected:[],wins:{},losses:{},unlockedPacks:[],totalWins:0,totalLosses:0,...(state.battle||{})};state.battle.selected=Array.isArray(state.battle.selected)?state.battle.selected:[];state.battle.unlockedPacks=Array.isArray(state.battle.unlockedPacks)?state.battle.unlockedPacks:[];for(const id of state.battle.unlockedPacks||[]){const t=themes.find(x=>x.id===id&&x.campaignHidden);if(t&&!state.campaignSetSeen[id]){state.campaignSetSeen[id]=true;state.campaignSetOffers[id]=Math.max(state.campaignSetOffers[id]||0,10)}}
  state.stats.battlesWon=state.stats.battlesWon||0;state.stats.battlesLost=state.stats.battlesLost||0;state.stats.battleCash=state.stats.battleCash||0;state.stats.battlePacks=state.stats.battlePacks||0;
  /* Never destroy progress from retired/older collections. Unknown cards and pack counts stay in the save so a future build can restore them.
     Retired special packs are moved to a legacy vault only because the current Bag cannot safely render a pack whose collection definition no longer exists. */
  const REMOVED_TIER_THEME_IDS=['animals','valuables','places','vehicles','nature'];
  state.legacyVault=(state.legacyVault&&typeof state.legacyVault==='object')?state.legacyVault:{specialPackInventory:[]};
  state.legacyVault.specialPackInventory=Array.isArray(state.legacyVault.specialPackInventory)?state.legacyVault.specialPackInventory:[];
  {const activeSpecial=[],legacySpecial=[...state.legacyVault.specialPackInventory];for(const sp of (state.specialPackInventory||[])){if(sp&&REMOVED_TIER_THEME_IDS.includes(sp.themeId)){if(!legacySpecial.some(x=>x&&x.uid===sp.uid))legacySpecial.push(sp)}else if(sp)activeSpecial.push(sp)}state.specialPackInventory=activeSpecial;state.legacyVault.specialPackInventory=legacySpecial}
  state.cash=Number.isFinite(+state.cash)&&+state.cash>=0?+state.cash:0;
  state.lifetime=Number.isFinite(+state.lifetime)&&+state.lifetime>=0?+state.lifetime:0;
  state.packsOpened=Math.max(0,Number.isFinite(+state.packsOpened)?+state.packsOpened:0);
  state.totalCards=Math.max(0,Number.isFinite(+state.totalCards)?+state.totalCards:0);
  {const old00=(state.rouletteBets||[]).filter(b=>b.type==='straight'&&String(b.value)==='00');if(old00.length){state.cash+=old00.reduce((n,b)=>n+(b.amount||0),0);state.rouletteBets=state.rouletteBets.filter(b=>!(b.type==='straight'&&String(b.value)==='00'));}}
  function makeCopy(variant='Normal',mutation=null,serial=null){return {uid:uid(),variant,mutation,serial,grade:null,gradedAt:null,gradingStartedAt:null,gradingUntil:null,pendingGrade:null,openingPenalty:0,openingQuality:'Clean',obtainedAt:Date.now(),locked:false,source:'Pack'}}
  function migrateInventory(){
    for(const [id,it] of Object.entries(state.inventory)){
      if(!it)continue;
      if(!it.levels){
        const count=Math.max(0,it.count||0),foil=Math.min(count,it.foil||0),holo=Math.min(count,it.holo||0),copies=[];
        for(let i=0;i<holo;i++)copies.push(makeCopy('Holo'));
        for(let i=0;i<foil;i++)copies.push(makeCopy('Foil'));
        for(let i=0;i<Math.max(0,count-foil-holo);i++)copies.push(makeCopy('Normal'));
        it.levels={1:{copies}};
      }
      for(const [lv,ld] of Object.entries(it.levels||{})){
        if(!Array.isArray(ld.copies)){
          const count=Math.max(0,ld.count||0),foil=Math.min(count,ld.foil||0),holo=Math.min(count,ld.holo||0),copies=[];
          for(let i=0;i<holo;i++)copies.push(makeCopy('Holo'));
          for(let i=0;i<foil;i++)copies.push(makeCopy('Foil'));
          for(let i=0;i<Math.max(0,count-foil-holo);i++)copies.push(makeCopy('Normal'));
          ld.copies=copies;
        }
        ld.copies.forEach(cp=>{cp.uid=cp.uid||uid();cp.variant=cp.variant||'Normal';cp.mutation=cp.mutation||null;cp.serial=cp.serial||null;cp.grade=cp.grade??null;cp.gradedAt=cp.gradedAt||null;cp.gradingStartedAt=cp.gradingStartedAt||null;cp.gradingUntil=cp.gradingUntil||null;cp.pendingGrade=cp.pendingGrade||null;cp.openingPenalty=Number(cp.openingPenalty||0);cp.openingQuality=cp.openingQuality||'Clean';cp.obtainedAt=cp.obtainedAt||Date.now();cp.locked=!!cp.locked;cp.source=cp.source||'Pack'});
        delete ld.count;delete ld.foil;delete ld.holo;
      }
      if(cardMap[id]&&Object.values(it.levels||{}).some(ld=>(ld.copies||[]).length))state.discovered[id]=state.discovered[id]||Date.now();
    }
  }
  migrateInventory();
  for(const it of Object.values(state.inventory||{}))for(const ld of Object.values(it?.levels||{}))for(const cp of (ld?.copies||[])){
    if(cp.variant==='Glitch'||cp.variant==='Glitched')cp.variant='Nebula';if(cp.variant==='Negative')cp.variant='Prismatic';if(cp.mutation==='goldwave')cp.mutation='holosurge';
    if(cp.mutation==='glitchstorm')cp.mutation='holosurge';
  }
  state.specialPackInventory=(state.specialPackInventory||[]).map(sp=>sp?.mutation==='glitchstorm'?{...sp,mutation:'holosurge'}:sp).filter(Boolean);
  /* v3.13 preserves every loaded local save field. No automatic deployment or upgrade reset is performed. */
  if(loadedSave && loadedSave.upgradeReset20260910!==true) state.upgradeReset20260910=true;

  const upgrades={
    crit:{name:'Critical Chance',desc:'Slightly increases the chance a press becomes a ×5 critical.',base:20,growth:1.25,key:'warehouseLevel'},
    faster:{name:'Faster Packs',desc:'Speeds up both manual card transitions and Auto Open.',base:20,growth:1.26,key:'kioskLevel'},
    better:{name:'Better Packs',desc:'Slightly improves rarity quality, variant odds, and special-pack chance.',base:20,growth:1.28,key:'variantLensLevel'},
    gamble:{name:'Gambling Luck',desc:'Improves casino returns by about 1% per level, up to a safe cap.',base:20,growth:1.28,key:'autoLevel'},
    returnluck:{name:'Luck on Return',desc:'Rarely refunds the part of a casino bet you would have lost.',base:20,growth:1.30,key:'lineLevel'},
    campaignfast:{name:'Faster Campaigns',desc:'Makes qualified exhibition campaigns finish a little sooner.',base:20,growth:1.27,key:'campaignPrepLevel'},
    campaignluck:{name:'Luckier Campaigns',desc:'Raises the odds of bonus rewards, specialty packs, and hidden-set finds.',base:20,growth:1.30,key:'engineLevel'}
  };
  const potionDefs={
    money:{id:'money',name:'Coin Doubler',emoji:'💰',desc:'Earn 2× cash from The Coin while active.',duration:5*60*1000,mult:2,rarity:'Rare'},
    openSpeed:{id:'openSpeed',name:'Quick-Open Tonic',emoji:'⚡',desc:'Packs reveal 25% faster while active.',duration:8*60*1000,mult:1.25,rarity:'Rare'},
    variant:{id:'variant',name:'Prism Potion',emoji:'🌈',desc:'Variant odds are 1.5× while active.',duration:6*60*1000,mult:1.5,rarity:'Very Rare'},
    mutation:{id:'mutation',name:'Mutation Serum',emoji:'🧪',desc:'Special-pack mutation chance is 1.5× while active.',duration:10*60*1000,mult:1.5,rarity:'Very Rare'},
    casino:{id:'casino',name:'Lucky Chip Elixir',emoji:'🎲',desc:'Casino returns get a small temporary boost.',duration:5*60*1000,mult:1.035,rarity:'Rare'},
    campaign:{id:'campaign',name:'Curator Rush',emoji:'🏛️',desc:'Qualified campaigns run 30% faster while active.',duration:12*60*1000,mult:1.30,rarity:'Rare'}
  };
  function activePotionMultiplier(id){const a=state.activePotions?.[id];return a&&a.until>Date.now()?(a.mult||1):1}
  function potionRemaining(id){const a=state.activePotions?.[id];return a?Math.max(0,a.until-Date.now()):0}
  function addPotion(id,count=1){if(!potionDefs[id])return;state.potionInventory[id]=(state.potionInventory[id]||0)+count;state.stats.potionsFound=(state.stats.potionsFound||0)+count}
  function usePotion(id){const d=potionDefs[id],count=state.potionInventory[id]||0;if(!d||count<=0)return;state.potionInventory[id]=count-1;const now=Date.now(),old=state.activePotions[id];state.activePotions[id]={until:Math.max(now,old?.until||0)+d.duration,mult:d.mult};sfx('buy');toast(`${d.emoji} ${d.name}`,'Potion activated. Its timer continues while you are elsewhere.');save();renderHUD();renderPotions()}
  function renderPotions(){const host=$('#potionGrid');if(!host)return;const defs=Object.values(potionDefs).filter(d=>(state.potionInventory[d.id]||0)>0);if(!defs.length){host.innerHTML='<div class="no-potions">NO POTIONS</div>';updateBagCounts();return}host.innerHTML=defs.map(d=>{const count=state.potionInventory[d.id]||0,remain=potionRemaining(d.id),active=remain>0;return `<article class="potion-card ${active?'active':''}"><div class="potion-emoji">${d.emoji}</div><div class="potion-copy"><span class="potion-rarity">${d.rarity}</span><h3>${d.name}</h3><p>${d.desc}</p><small>Duration ${Math.round(d.duration/60000)} min${active?` · ACTIVE ${campaignTime(remain)}`:''}</small></div><div class="potion-actions"><b>×${count}</b><button data-use-potion="${d.id}">${active?'Extend':'Use'}</button></div></article>`}).join('');$$('[data-use-potion]').forEach(b=>b.onclick=()=>usePotion(b.dataset.usePotion));updateBagCounts()}
  let saveDirty=true,saveTimer=null,tutorialTrainingMode=false,tutorialPreservedPrefs=null,tutorialPreservedState=null;
  function markSaveDirty(){saveDirty=true}
  function compactSaveReplacer(key,value){
    if(this&&this.uid&&typeof this.variant==='string'){
      if((key==='mutation'||key==='serial'||key==='grade'||key==='gradedAt'||key==='gradingStartedAt'||key==='gradingUntil'||key==='pendingGrade')&&value==null)return undefined;
      if(key==='openingPenalty'&&Number(value||0)===0)return undefined;
      if(key==='openingQuality'&&value==='Clean')return undefined;
      if(key==='locked'&&value===false)return undefined;
      if(key==='source'&&value==='Pack')return undefined;
      if((key==='factoryError'||key==='holoPattern'||key==='openingDefect'||key==='gradeNote'||key==='pendingBlackLabel')&&value==null)return undefined;
      if(key==='blackLabel'&&value===false)return undefined;
    }
    return value
  }
  function flushSave(){
    if(saveTimer){clearTimeout(saveTimer);saveTimer=null}
    /* Tutorial progress is deliberately throwaway. Never write the training state into the real PackForge save. */
    if(tutorialTrainingMode){saveDirty=false;return true}
    if(!saveDirty)return true;
    state.lastTick=Date.now();
    try{localStorage.setItem(saveKey,JSON.stringify(state,compactSaveReplacer));saveDirty=false;return true}
    catch(e){console.warn('PackForge save failed',e);return false}
  }
  function save(force=false){
    markSaveDirty();
    if(force)return flushSave();
    if(!saveTimer)saveTimer=setTimeout(flushSave,450);
    return true
  }
  /* If an older schema/key was loaded, rewrite it once into the stable current key after all migrations finish.
     The legacy key is intentionally left untouched as a fallback copy. */
  if(loadedSave)setTimeout(()=>{markSaveDirty();flushSave()},0);
  function levelCopies(id,level,create=false){state.inventory[id]??={levels:{}};if(create&&!state.inventory[id].levels[level])state.inventory[id].levels[level]={copies:[]};return state.inventory[id].levels[level]?.copies||null}
  function totalItemCount(it){return Object.values(it?.levels||{}).reduce((n,ld)=>n+(ld.copies?.length||0),0)}
  function totalCardCount(){return Object.values(state.inventory).reduce((n,it)=>n+totalItemCount(it),0)}
  function uniqueOwnedCount(){return Object.values(state.inventory).filter(it=>totalItemCount(it)>0).length}
  function discoveredCount(){return Object.keys(state.discovered||{}).filter(id=>cardMap[id]).length}
  function themeComplete(id){const t=themes.find(x=>x.id===id);return t.cards.every(c=>!!state.discovered[c.id])}
  function completedSets(){return themes.filter(t=>themeComplete(t.id)).length}
  function collectorBonus(){return 1+completedSets()*.1}
  function clickBoost(){return Date.now()<(state.clickBoostUntil||0)?2:1}
  function overdriveActive(){return false}
  function overdriveBoost(){return 1}
  function overdriveRemaining(){return Math.max(0,Number(state.overdrive?.activeUntil||0)-Date.now())}
  function overdriveTime(ms){const sec=Math.max(0,Math.ceil(ms/1000)),m=Math.floor(sec/60),s=sec%60;return `${m}:${String(s).padStart(2,'0')}`}
  function addOverdriveProgress(kind,count=1){return false}
  function accelerateForOverdrive(now=Date.now()){
    const a=state.campaigns?.active;if(a&&a.endsAt>now){const remain=a.endsAt-now;a.endsAt=now+Math.max(1000,remain/5);if(a.startedAt)a.durationMs=Math.max(1000,a.endsAt-a.startedAt);a.speed=(a.speed||1)*5}
    for(const it of Object.values(state.inventory||{}))for(const ld of Object.values(it?.levels||{}))for(const cp of (ld?.copies||[])){if(cp.gradingUntil&&cp.gradingUntil>now){const remain=Math.max(1000,(cp.gradingUntil-now)/5);cp.gradingStartedAt=now;cp.gradingUntil=now+remain}}
  }
  function overdriveLaunchAnimation(){const burst=$('#overdriveBurst');if(burst){burst.classList.remove('hidden');setTimeout(()=>burst.classList.add('hidden'),2600)}try{noiseBurst(.22,.045);[110,165,220,330,440,660,880].forEach((f,i)=>tone(f,.28,'sawtooth',.025,i*.055));[520,780,1040].forEach((f,i)=>tone(f,.42,'sine',.025,.25+i*.09))}catch(e){}confetti(70)}
  function launchOverdrive(){
    if(tutorialTrainingMode||overdriveActive()||(state.overdrive?.points||0)<100)return false;const now=Date.now();state.overdrive.points=0;state.overdrive.clickRemainder=0;state.overdrive.packRemainder=0;state.overdrive.activeUntil=now+5*60*1000;state.overdrive.totalLaunches=(state.overdrive.totalLaunches||0)+1;accelerateForOverdrive(now);markSaveDirty();save(true);overdriveLaunchAnimation();toast('🔥 OVERDRIVE ACTIVATED','5× rewards, luck, speed, and positive chances for 5 minutes. Prices stay normal.');renderOverdrive();renderHUD();if(!$('#view-campaigns').classList.contains('hidden'))renderCampaigns();if(!$('#view-grading').classList.contains('hidden'))renderGrading();return true
  }
  function renderOverdrive(){
    const strip=$('#overdriveStrip');if(!strip)return;if(tutorialTrainingMode){strip.classList.add('hidden');return}else strip.classList.remove('hidden');
    state.overdrive=state.overdrive||{points:0,clickRemainder:0,packRemainder:0,activeUntil:0,totalLaunches:0};let active=overdriveActive();if(!active&&state.overdrive.activeUntil>0){state.overdrive.activeUntil=0;markSaveDirty();save();toast('Overdrive ended','The Forge has cooled. Build the meter to 100 to launch again.')}
    const points=clamp(Number(state.overdrive.points)||0,0,100),fill=$('#overdriveFill'),read=$('#overdriveReadout'),status=$('#overdriveStatus'),btn=$('#overdriveLaunch'),app=$('#gameApp');if(fill)fill.style.width=(active?100:points)+'%';if(read)read.textContent=active?`ACTIVE · ${overdriveTime(overdriveRemaining())}`:`${Math.floor(points)} / 100`;if(status)status.textContent=active?'5× ACTIVE — sell value, clicks, positive luck, casino payouts, grading luck, campaign rewards/speed and more.':points>=100?'Meter full. Launch when you want the 5-minute boost.':`${75-(state.overdrive.clickRemainder||0)} clicks or ${3-(state.overdrive.packRemainder||0)} packs until the next action-based point.`;if(btn){btn.classList.toggle('hidden',active||points<100);btn.disabled=active||points<100}if(app)app.classList.toggle('pf-overdrive-live',active);const nav=$('.pf-overdrive-nav'),badge=$('#overdriveNavBadge');if(badge)badge.textContent=active?overdriveTime(overdriveRemaining()):`${Math.floor(points)}%`;if(nav){nav.classList.toggle('ready',!active&&points>=100);nav.classList.toggle('live',active)}
  }
  /* Overdrive retired in v3.1: no timer or UI binding. */

  function clickValue(){return collectorBonus()*clickBoost()*activePotionMultiplier('money')*showcaseBonuses().clickMult*overdriveBoost()}
  function autoValue(){return 0}
  function casinoPayoutBoost(){return (1+Math.min(.10,(state.autoLevel||0)*.01))*activePotionMultiplier('casino')*showcaseBonuses().casinoMult*overdriveBoost()}
  function lossReturnChance(){return Math.min(.75,(state.lineLevel||0)*.005*overdriveBoost())}
  function autoRevealMs(){return Math.max(overdriveActive()?140:700,(1500-Math.min(800,(state.kioskLevel||0)*30))/(activePotionMultiplier('openSpeed')*overdriveBoost()))}
  function manualRevealMs(){return Math.max(overdriveActive()?11:55,(145-Math.min(90,(state.kioskLevel||0)*4))/(activePotionMultiplier('openSpeed')*overdriveBoost()))}
  function packDropChance(){return Math.min(.025,.005*overdriveBoost())} // Normal: exactly 1 in 200 Coin clicks. Overdrive: 5x positive chance (1 in 40).
  function criticalChance(){return Math.min(.60,(.02+Math.min(.10,(state.warehouseLevel||0)*.003))*overdriveBoost())}
  function comboWindowMs(){return 9990}
  function packBetterLevel(){return Math.max(0,state.variantLensLevel||0)}
  function packQualityPromoteChance(){return Math.min(.20,(packBetterLevel()*.0015+showcaseBonuses().packQualityAdd)*overdriveBoost())}
  function specialPackChance(){return Math.min(.45,(SPECIAL_PACK_CHANCE+packBetterLevel()*.001)*activePotionMultiplier('mutation')*showcaseBonuses().specialMult*overdriveBoost())}
  function variantLuckMultiplier(){return Math.min(7,(1+Math.min(.20,packBetterLevel()*.01))*activePotionMultiplier('variant')*showcaseBonuses().variantMult*overdriveBoost())}
  function campaignPrepMultiplier(){return (1+Math.min(.50,(state.campaignPrepLevel||0)*.02))*activePotionMultiplier('campaign')*showcaseBonuses().campaignSpeedMult*overdriveBoost()}
  function campaignLuckMultiplier(){return (1+Math.min(2,(state.engineLevel||0)*.08))*showcaseBonuses().campaignLuckMult*overdriveBoost()}
  function gradingFeeMultiplier(){return showcaseBonuses().gradeFeeMult}
  function levelBonus(level){return 1+Math.max(0,level-1)*.12}
  function gradeMultiplier(g){if(!g)return 1;if(g>=10)return 2.6;if(g>=9.5)return 1.85;if(g>=9)return 1.55;if(g>=8.5)return 1.32;if(g>=8)return 1.18;if(g>=7)return 1.08;if(g>=5)return 1;return .9}
  function mutationMultiplier(copy){return copy?.mutation?(packMutations[copy.mutation]?.value||1):1}
  function variantMultiplier(copy){const v=copy?.variant||'Normal';if(v==='Serialized'){const m=String(copy?.serial||'').match(/#(\d+)/),n=m?Math.max(1,Math.min(500,+m[1])):500;return 60+((501-n)/500)*90}return variantDefs[v]?.value||1}
  function premiumTraitMultiplier(copy){return Number(copy?.premiumValueMult||1)}
  function serialSpecialInfo(copy){
    if(copy?.variant!=='Serialized')return null;const m=String(copy?.serial||'').match(/#(\d+)/),n=m?+m[1]:0;if(!n)return null;const p=String(n).padStart(3,'0');
    if(n===1)return {name:'#001 First Print',value:2.5};if(n===500)return {name:'#500 Final Print',value:2.2};
    if(n%111===0)return {name:`#${p} Repeating Serial`,value:1.8};if(p===p.split('').reverse().join(''))return {name:`#${p} Palindrome`,value:1.5};
    if(['123','234','345','456','321','432','007'].includes(p))return {name:`#${p} Pattern Serial`,value:1.6};return null
  }
  function collectorQuirkMultiplier(copy){
    let m=1;if(copy?.factoryError&&FACTORY_ERROR_DEFS[copy.factoryError])m*=FACTORY_ERROR_DEFS[copy.factoryError].value;
    if(copy?.holoPattern&&HOLO_PATTERN_DEFS[copy.holoPattern])m*=HOLO_PATTERN_DEFS[copy.holoPattern].value;
    const serial=serialSpecialInfo(copy);if(serial)m*=serial.value;if(copy?.blackLabel)m*=5;return m
  }
  function factoryErrorGradePenalty(copy){return copy?.factoryError&&FACTORY_ERROR_DEFS[copy.factoryError]?FACTORY_ERROR_DEFS[copy.factoryError].gradePenalty:0}
  function maybeApplyCollectorQuirks(copy,card){
    if(!copy||tutorialTrainingMode||card?.ghost)return copy;
    if(!copy.factoryError&&Math.random()<FACTORY_ERROR_CHANCE){const ids=Object.keys(FACTORY_ERROR_DEFS),id=ids[Math.floor(Math.random()*ids.length)];copy.factoryError=id;state.quirkStats.factoryErrors=(state.quirkStats.factoryErrors||0)+1}
    if(copy.variant==='Holo'&&!copy.holoPattern&&Math.random()<HOLO_PATTERN_CHANCE*overdriveBoost()){const ids=Object.keys(HOLO_PATTERN_DEFS),id=ids[Math.floor(Math.random()*ids.length)];copy.holoPattern=id;state.quirkStats.holoPatterns=(state.quirkStats.holoPatterns||0)+1}
    return copy
  }
  function effectiveCardValue(card,level,copy){return card.value*levelBonus(level)*variantMultiplier(copy)*mutationMultiplier(copy)*gradeMultiplier(copy?.grade)*premiumTraitMultiplier(copy)*collectorQuirkMultiplier(copy)}
  function effectiveCardPower(card,level,copy){if(card?.ghost)return sellValue(card,level,copy);return Math.max(1,Math.round(card.power))}
  function hiddenOfferRemaining(id){return Math.max(0,Number(state.campaignSetOffers?.[id]||0))}
  function themeHasOwnedContent(t){return (state.packInventory[t.id]||0)>0||t.allCards.some(c=>totalItemCount(state.inventory[c.id])>0)}
  function themeIsVisible(t){return !t?.campaignHidden||hiddenOfferRemaining(t.id)>0||!!state.campaignSetSeen?.[t.id]||themeHasOwnedContent(t)}
  function shopThemeVisible(t){return !t?.campaignHidden||hiddenOfferRemaining(t.id)>0}
  function basePackThemes(){return themes.filter(t=>!t.campaignHidden)}
  const battleAbilityDefs={
    haste:{name:'Haste',icon:'⚡',cost:2,passive:'Attacks 20% faster.',skill:'Quickstrike',detail:'Spend 2 Energy to attack immediately for 125% damage.'},
    flying:{name:'Flying',icon:'🪽',cost:3,passive:'15% chance to dodge basic attacks.',skill:'Dive',detail:'Spend 3 Energy for a 145% damage dive that cannot be dodged.'},
    guard:{name:'Guard',icon:'🛡️',cost:3,passive:'Takes 15% less basic attack damage.',skill:'Fortify',detail:'Spend 3 Energy to gain a shield worth 35% of maximum Defense.'},
    drain:{name:'Lifesteal',icon:'🩸',cost:3,passive:'Basic attacks heal for 10% of damage dealt.',skill:'Drain',detail:'Spend 3 Energy for 120% damage and heal for half the damage dealt.'},
    pierce:{name:'Pierce',icon:'➶',cost:3,passive:'Ignores Guard damage reduction.',skill:'Piercing Strike',detail:'Spend 3 Energy for 155% damage that ignores shields by 35%.'},
    rally:{name:'Rally',icon:'✦',cost:4,passive:'Starts battle with +5% team Attack for 3 seconds.',skill:'Battle Cry',detail:'Spend 4 Energy to give the whole team +15% Attack for 4 seconds.'},
    barrier:{name:'Barrier',icon:'◈',cost:4,passive:'Starts with a small personal shield.',skill:'Protect',detail:'Spend 4 Energy to shield the weakest ally for 45% of its maximum Defense.'},
    critical:{name:'Critical',icon:'✹',cost:4,passive:'12% chance for basic attacks to deal 160% damage.',skill:'Finisher',detail:'Spend 4 Energy for a guaranteed 200% critical strike.'},
    regen:{name:'Regenerate',icon:'✚',cost:3,passive:'Restores 2% maximum Defense every 2 seconds.',skill:'Renew',detail:'Spend 3 Energy to heal the weakest ally for 28% of maximum Defense.'}
  };
  function stableHash(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
  function abilityPoolForTheme(id){return ({medieval:['guard','barrier','pierce','rally'],food:['regen','rally','barrier','drain'],ocean:['flying','haste','regen','pierce'],space:['flying','haste','critical','barrier'],monsters:['drain','critical','guard','regen'],dinosaurs:['guard','critical','pierce','haste'],superheroes:['flying','barrier','rally','haste'],pokemon:['haste','critical','regen','flying'],villains:['drain','critical','pierce','guard'],mythology:['rally','barrier','critical','regen']}[id]||['haste','guard','critical','regen'])}
  function combatProfile(card,level=1,copy={}){const p=effectiveCardPower(card,level,copy),rank=card.secret?8:Math.max(0,rarityOrder.indexOf(card.rarity)),h=stableHash(card.id),tierMult=card.secret?1.60:card.rarity==='Divine'?1.38:card.rarity==='Mythic'?1.24:card.rarity==='Legendary'?1.13:card.rarity==='Epic'?1.07:card.rarity==='Rare'?1.035:1,attack=Math.max(2,Math.round((4+Math.sqrt(p)*4.15+rank*1.8)*tierMult)),defense=Math.max(8,Math.round((attack*(3.15+((h>>>6)%11)/20)+rank*4)*(card.secret?1.12:card.rarity==='Divine'?1.07:1))),pool=abilityPoolForTheme(card.theme),abilityKey=pool[h%pool.length],ability=battleAbilityDefs[abilityKey],energyCost=Math.min(5,Math.max(2,ability.cost+(rank>=6?1:0)));return {attack,defense,abilityKey,ability,energyCost,score:attack*2+defense}}
  function showcaseRateFmt(v){v=Number(v)||0;return v<.1?'$'+v.toFixed(3):fmt(v)}
  const showcaseAbilityDefs=[
    {id:'mint',icon:'💵',name:'Mint',kind:'passive',base:.004,step:.004,fmt:v=>`+${showcaseRateFmt(v)}/sec passive cash`},
    {id:'click',icon:'👆',name:'Click Spark',kind:'click',base:.004,step:.002,fmt:v=>`+${(v*100).toFixed(2)}% click value`},
    {id:'drop',icon:'📦',name:'Pack Scout',kind:'drop',base:.012,step:.006,fmt:v=>`+${(v*100).toFixed(1)}% relative free-pack luck`},
    {id:'variant',icon:'🌈',name:'Variant Lens',kind:'variant',base:.012,step:.007,fmt:v=>`+${(v*100).toFixed(1)}% relative premium-variant luck`},
    {id:'special',icon:'✨',name:'Mutation Magnet',kind:'special',base:.012,step:.007,fmt:v=>`+${(v*100).toFixed(1)}% relative special-pack luck`},
    {id:'quality',icon:'⬆️',name:'Quality Eye',kind:'quality',base:.00008,step:.00005,fmt:v=>`+${(v*100).toFixed(3)}% rarity-promotion chance`},
    {id:'casino',icon:'🎰',name:'Lucky Charm',kind:'casino',base:.001,step:.0007,fmt:v=>`+${(v*100).toFixed(2)}% casino return boost`},
    {id:'campaign',icon:'🏆',name:'Sponsor',kind:'campaign',base:.008,step:.004,fmt:v=>`+${(v*100).toFixed(1)}% campaign reward luck`},
    {id:'speed',icon:'⏱️',name:'Fast Track',kind:'speed',base:.008,step:.004,fmt:v=>`+${(v*100).toFixed(1)}% campaign speed`},
    {id:'grade',icon:'🏷️',name:'Grader Eye',kind:'grade',base:.004,step:.002,fmt:v=>`-${(v*100).toFixed(1)}% grading fees`},
    {id:'sell',icon:'📈',name:'Hype',kind:'sell',base:.0025,step:.0012,fmt:v=>`+${(v*100).toFixed(2)}% card sell value`},
    {id:'discount',icon:'🏪',name:'Wholesale',kind:'discount',base:.0025,step:.0012,fmt:v=>`-${(v*100).toFixed(2)}% normal pack prices`}
  ];
  const showcasePassiveBase={Common:.003,Uncommon:.005,Rare:.009,Epic:.017,Legendary:.035,Mythic:.08,Divine:.16,Ultra:.38,Secret:.75,God:1.8,Ascendant:4.5};
  function copyIsShowcased(uid){return false}
  function showcaseRarity(card){return card?.secret?'Secret':card?.rarity||'Common'}
  function showcaseAbility(card,level=1,copy={}){
    const rarity=showcaseRarity(card),rank=rarity==='Ascendant'?10:rarity==='God'?9:rarity==='Wyatt Evans'?8.5:rarity==='Secret'?8:Math.max(0,rarityOrder.indexOf(rarity)),def=showcaseAbilityDefs[stableHash(card.id+'|showcase')%showcaseAbilityDefs.length];
    const polish=(1+Math.max(0,level-1)*.06)*(copy?.grade?1+Math.max(0,copy.grade-7)*.018:1)*(copy?.variant&&copy.variant!=='Normal'?1.04:1)*(copy?.premiumTrait==='Vintage'?1.04:1);
    const value=(def.base+def.step*rank)*polish;
    return {...def,value,text:def.fmt(value)}
  }
  function showcaseEquipped(){
    const slots=state.showcase?.slots||[];const out=[];
    for(let i=0;i<5;i++){const u=slots[i];if(!u)continue;const x=ownedCopyByUid(u);if(x)out.push({...x,slot:i});else slots[i]=null}
    return out
  }
  function showcaseComboDefs(){
    const defs=[{id:'planetary_alignment',name:'Planetary Alignment',icon:'🪐',kind:'cosmic',desc:'Five different planets align in the Showcase.',match:eq=>{if(eq.length!==5)return false;const planets=['mercury','venus','earth','mars','jupiter','saturn','uranus','neptune'];const found=new Set();for(const x of eq){const n=x.card.name.toLowerCase();const p=planets.find(p=>n.includes(p));if(p)found.add(p)}return found.size>=5}}];
    const comboThemes=themes.slice(0,11);
    for(const t of comboThemes)defs.push({id:`theme_${t.id}`,name:`${t.name} Five`,icon:t.emoji,kind:'theme',desc:`Five ${t.name} cards share one display.`,theme:t.id,match:eq=>eq.length===5&&eq.every(x=>x.card.theme===t.id)});
    for(const t of comboThemes)for(const r of rarityOrder.slice(0,8))defs.push({id:`${t.id}_${r.toLowerCase()}_five`,name:`${t.name} ${r} Quintet`,icon:t.emoji,kind:'rarity',rank:rarityOrder.indexOf(r),desc:`Five ${r} cards from ${t.name}.`,theme:t.id,rarity:r,match:eq=>eq.length===5&&eq.every(x=>x.card.theme===t.id&&x.card.rarity===r)});
    return defs.slice(0,100)
  }
  function activeShowcaseCombos(eq=showcaseEquipped()){return showcaseComboDefs().filter(d=>{try{return d.match(eq)}catch(e){return false}})}
  function showcaseBonuses(){return {passivePerSec:0,clickMult:1,packDropMult:1,variantMult:1,specialMult:1,packQualityAdd:0,casinoMult:1,campaignLuckMult:1,campaignSpeedMult:1,gradeFeeMult:1,sellMult:1,packCostMult:1,synergies:[],activeCombos:[]}}
  function cleanShowcaseSlots(){let changed=false;for(let i=0;i<5;i++){const u=state.showcase.slots[i];if(u&&!ownedCopyByUid(u)){state.showcase.slots[i]=null;changed=true}}return changed}
  function showcaseComboAnimation(combo,count=1){
    const cosmic=combo?.kind==='cosmic';const ov=document.createElement('div');ov.className='showcase-combo-overlay';ov.innerHTML=`<div class="showcase-combo-card ${cosmic?'cosmic':''}"><div class="showcase-combo-label">HIDDEN SHOWCASE COMBO DISCOVERED</div><div class="showcase-combo-icon">${combo?.icon||'✦'}</div><h2>${combo?.name||'Secret Combination'}</h2><p>${combo?.desc||'Your five cards formed a hidden combination.'}${count>1?`<br><b>+${count-1} more hidden combo${count===2?'':'s'} discovered at the same time.</b>`:''}</p><button>Keep Displaying</button></div>`;document.body.appendChild(ov);ov.querySelector('button').onclick=()=>ov.remove();ov.onclick=e=>{if(e.target===ov)ov.remove()};confetti(cosmic?55:22);sfx(cosmic?'jackpot':'grade')
  }
  function discoverShowcaseCombos(animate=true){const active=activeShowcaseCombos(),fresh=[];for(const c of active)if(!state.showcase.discoveredCombos[c.id]){state.showcase.discoveredCombos[c.id]={at:Date.now(),name:c.name};fresh.push(c)}if(fresh.length){save();if(animate){const first=fresh.find(x=>x.kind==='cosmic')||fresh[0];showcaseComboAnimation(first,fresh.length)}}return fresh}
  function equipShowcase(uidValue,slot=state.showcase.selectedSlot||0){const x=ownedCopyByUid(uidValue);if(!x||x.copy.gradingUntil||copyIsCampaignCommitted(uidValue))return;const existing=state.showcase.slots.indexOf(uidValue);if(existing>=0)state.showcase.slots[existing]=null;state.showcase.slots[clamp(+slot,0,4)]=uidValue;state.showcase.selectedSlot=clamp(+slot,0,4);discoverShowcaseCombos(true);save();renderShowcase();renderHUD()}
  function unequipShowcase(slot){slot=clamp(+slot,0,4);state.showcase.slots[slot]=null;state.showcase.selectedSlot=slot;save();renderShowcase();renderHUD()}
  function showcasePercent(mult){return `${((mult-1)*100).toFixed(Math.abs((mult-1)*100)<1?2:1)}%`}
  function renderShowcasePicker(){
    const host=$('#showcasePickerGrid');if(!host)return;const q=($('#showcaseSearch')?.value||'').trim().toLowerCase(),theme=$('#showcaseThemeFilter')?.value||'all',rarity=$('#showcaseRarityFilter')?.value||'all',equipped=new Set(state.showcase.slots.filter(Boolean));
    let arr=allOwnedCopies().filter(x=>!x.copy.gradingUntil&&!copyIsCampaignCommitted(x.copy.uid));if(q)arr=arr.filter(x=>(x.card.name+' '+x.card.rarity+' '+(themes.find(t=>t.id===x.card.theme)?.name||'')).toLowerCase().includes(q));if(theme!=='all')arr=arr.filter(x=>x.card.theme===theme);if(rarity!=='all')arr=arr.filter(x=>showcaseRarity(x.card)===rarity);arr.sort((a,b)=>Number(equipped.has(b.copy.uid))-Number(equipped.has(a.copy.uid))||effectiveCardValue(b.card,b.level,b.copy)-effectiveCardValue(a.card,a.level,a.copy));arr=arr.slice(0,240);
    host.innerHTML=arr.length?arr.map(x=>{const a=showcaseAbility(x.card,x.level,x.copy),isEq=equipped.has(x.copy.uid);return `<button class="showcase-pick" data-showcase-pick="${x.copy.uid}" ${isEq?'disabled':''}><span class="showcase-pick-icon" style="--rarity:${x.card.secret?'#fff':rarityColor[x.card.rarity]}">${themes.find(t=>t.id===x.card.theme)?.emoji||'◈'}</span><span class="showcase-pick-copy"><b>${x.card.name}</b><small>${showcaseRarity(x.card)} · Lv ${x.level} · ${a.icon} ${a.name}</small></span><span class="showcase-pick-power">${isEq?'EQUIPPED':a.text}</span></button>`}).join(''):'<div class="showcase-none">No matching available cards.</div>';
    $$('[data-showcase-pick]').forEach(b=>b.onclick=()=>equipShowcase(b.dataset.showcasePick,state.showcase.selectedSlot))
  }
  function renderShowcase(){
    const root=$('#showcaseRoot');if(!root)return;cleanShowcaseSlots();const eq=showcaseEquipped(),bySlot=new Map(eq.map(x=>[x.slot,x])),b=showcaseBonuses(),discovered=Object.entries(state.showcase.discoveredCombos||{}).sort((a,z)=>(z[1]?.at||0)-(a[1]?.at||0)),activeIds=new Set(b.activeCombos.map(c=>c.id));
    const slots=Array.from({length:5},(_,i)=>{const x=bySlot.get(i);if(!x)return `<div class="showcase-slot ${state.showcase.selectedSlot===i?'selected':''}" data-showcase-slot="${i}"><div class="showcase-slot-empty"><div><b>＋</b><span>Slot ${i+1}<br>Choose a card below</span></div></div></div>`;const a=showcaseAbility(x.card,x.level,x.copy);return `<div class="showcase-slot ${state.showcase.selectedSlot===i?'selected':''}" data-showcase-slot="${i}"><div class="showcase-card-wrap">${cardHTML(x.card,0,x.copy,x.level)}</div><div class="showcase-ability"><b>${a.icon} ${a.name}</b><span>${a.text}</span></div><div class="showcase-slot-actions"><button data-showcase-select="${i}">Replace</button><button class="danger" data-showcase-remove="${i}">Unequip</button></div></div>`}).join('');
    const visibleSynergies=[...b.synergies,...b.activeCombos.map(c=>({name:`✦ ${c.name}`,text:c.kind==='cosmic'?'Hidden cosmic combo active':c.kind==='rarity'?'Hidden rarity quintet active':'Hidden five-card combo active'}))];
    root.innerHTML=`<section class="showcase-hero"><div class="showcase-hero-top"><div><h2>Five-Card Showcase</h2><p>Equip five exact card copies. Every card has a deterministic passive ability, every equipped card generates a small amount of cash over time, matching cards create synergies, and there are exactly <b>100 hidden combinations</b> to discover.</p></div><div class="showcase-income"><small>SHOWCASE INCOME</small><b>${showcaseRateFmt(b.passivePerSec)}/sec</b></div></div><div class="showcase-slots">${slots}</div></section><div class="showcase-dashboard"><section class="showcase-panel"><h3>Active Bonuses</h3><div class="showcase-bonus-grid"><div class="showcase-kpi"><small>Click</small><b>+${showcasePercent(b.clickMult)}</b></div><div class="showcase-kpi"><small>Pack Drop</small><b>+${showcasePercent(b.packDropMult)}</b></div><div class="showcase-kpi"><small>Variant Luck</small><b>+${showcasePercent(b.variantMult)}</b></div><div class="showcase-kpi"><small>Special Luck</small><b>+${showcasePercent(b.specialMult)}</b></div><div class="showcase-kpi"><small>Card Sales</small><b>+${showcasePercent(b.sellMult)}</b></div><div class="showcase-kpi"><small>Pack Price</small><b>-${((1-b.packCostMult)*100).toFixed(2)}%</b></div></div><h3 style="margin-top:14px">Synergies</h3><div class="showcase-synergy-list">${visibleSynergies.length?visibleSynergies.map(s=>`<div class="showcase-synergy"><b>${s.name}</b><br>${s.text}</div>`).join(''):'<div class="showcase-none">Equip cards that share themes, variants, grades, or stranger relationships to create bonuses.</div>'}</div></section><section class="showcase-panel"><h3>Hidden Discoveries</h3><div class="showcase-discovery-count"><b>${discovered.length} / 100</b> discovered. Undiscovered recipes are not shown.</div><div class="showcase-discovered-list">${discovered.length?discovered.map(([id,d])=>`<div class="showcase-discovered"><b>${d.name||showcaseComboDefs().find(c=>c.id===id)?.name||'Unknown Combo'}</b><span>${activeIds.has(id)?'ACTIVE':'discovered'}</span></div>`).join(''):'<div class="showcase-none">Nothing discovered yet. Experiment with five cards that look like they belong together.</div>'}</div></section></div><section class="showcase-picker"><div class="showcase-picker-head"><h3>Choose a card for Slot ${(state.showcase.selectedSlot||0)+1}</h3><div class="showcase-picker-controls"><input id="showcaseSearch" placeholder="Search cards…"><select id="showcaseThemeFilter"><option value="all">All sets</option>${themes.filter(themeIsVisible).map(t=>`<option value="${t.id}">${t.name}</option>`).join('')}</select><select id="showcaseRarityFilter"><option value="all">All rarities</option>${[...rarityOrder,'God','Ascendant','Secret'].map(r=>`<option>${r}</option>`).join('')}</select></div></div><div class="showcase-picker-grid" id="showcasePickerGrid"></div></section>`;
    $$('[data-showcase-slot]').forEach(el=>el.onclick=e=>{if(e.target.closest('button'))return;state.showcase.selectedSlot=+el.dataset.showcaseSlot;renderShowcase()});$$('[data-showcase-select]').forEach(bn=>bn.onclick=()=>{state.showcase.selectedSlot=+bn.dataset.showcaseSelect;renderShowcase()});$$('[data-showcase-remove]').forEach(bn=>bn.onclick=()=>unequipShowcase(+bn.dataset.showcaseRemove));$('#showcaseSearch').oninput=renderShowcasePicker;$('#showcaseThemeFilter').onchange=renderShowcasePicker;$('#showcaseRarityFilter').onchange=renderShowcasePicker;renderShowcasePicker()
  }
  function activeCampaign(){return state.campaigns?.active||null}
  function copyIsCampaignCommitted(uid){const a=activeCampaign();return !!(a&&Date.now()<a.endsAt&&Array.isArray(a.cardUids)&&a.cardUids.includes(uid))}
  const sellBaseByRarity={Common:3,Uncommon:5,Rare:9,Epic:18,Legendary:45};
  function sellValue(card,level,copy){
    const rarity=card.secret?'Secret':card.rarity;
    if(['Mythic','Divine','Ultra','Secret'].includes(rarity)){
      const raritySellMult=card?.ghost?10:rarity==='Mythic'?1.5:rarity==='Divine'?2:rarity==='Ultra'?3:4;
      return Math.max(1,Math.round(effectiveCardValue(card,level,copy)*raritySellMult*showcaseBonuses().sellMult*overdriveBoost()))
    }
    const base=sellBaseByRarity[rarity]??10;
    const value=base*levelBonus(level)*variantMultiplier(copy)*mutationMultiplier(copy)*gradeMultiplier(copy?.grade)*premiumTraitMultiplier(copy)*showcaseBonuses().sellMult*overdriveBoost();
    return Math.max(1,Math.round(value))
  }
  function sellOneNow(id,level,sig){
    const e=findEntry(id,level,sig);if(!e)return false;
    const arr=levelCopies(id,level);if(!arr)return false;
    const i=arr.findIndex(cp=>copySignature(cp)===sig&&!cp.locked&&!cp.gradingUntil&&!copyIsCampaignCommitted(cp.uid)&&!copyIsShowcased(cp.uid));
    if(i<0){sfx('error');toast('Cannot sell','Unlock the card first, or wait for grading/campaign use to finish.');return false}
    const cp=arr[i],price=sellValue(e.c,level,cp);arr.splice(i,1);invalidateCollectionValue();markSaveDirty();earn(price);state.stats.cardsSold=(state.stats.cardsSold||0)+1;state.stats.cashFromSales=(state.stats.cashFromSales||0)+price;
    if(arr.length===0){delete state.inventory[id].levels[level];if(!Object.keys(state.inventory[id].levels||{}).length)delete state.inventory[id]}
    sfx('buy');toast('Card sold',`${e.c.name} sold for ${fmt(price)}.`);save();renderHUD();renderCollection();return true
  }
  let collectionValueCache=null;
  function invalidateCollectionValue(){collectionValueCache=null}
  function collectionValue(){if(collectionValueCache!=null)return collectionValueCache;let v=0;for(const [id,it] of Object.entries(state.inventory)){const c=cardMap[id];if(!c)continue;for(const [lv,ld] of Object.entries(it.levels||{}))for(const cp of ld.copies||[])v+=sellValue(c,+lv,cp)}collectionValueCache=Math.round(v);return collectionValueCache}
  function canAfford(n){n=Number(n);return Number.isFinite(n)&&n>=0&&state.cash>=n}
  function spend(n){n=Number(n);if(!Number.isFinite(n)||n<=0||state.cash<n)return false;state.cash-=n;state.stats.cashSpent=(state.stats.cashSpent||0)+n;markSaveDirty();return true}
  function earn(n){n=Number(n);if(!Number.isFinite(n)||n<=0)return 0;state.cash+=n;state.lifetime+=n;markSaveDirty();return n}
  function copySignature(cp){return [cp.variant||'Normal',cp.mutation||'',cp.grade??'',cp.serial||'',cp.premiumTrait||'',cp.premiumValueMult||'',cp.factoryError||'',cp.holoPattern||'',cp.blackLabel?'BL':'',cp.openingQuality||'',cp.openingDefect||'',cp.gradeNote||'',cp.gradingUntil||''].join('~')}
  function addCopy(id,level,copy){levelCopies(id,level,true).push(copy);invalidateCollectionValue();markSaveDirty()}
  function unlockedCopies(copies){return copies.filter(cp=>!cp.locked)}
  function removeMatchingCopy(id,level,sig){const arr=levelCopies(id,level);if(!arr)return null;const i=arr.findIndex(cp=>copySignature(cp)===sig&&!cp.locked&&!copyIsCampaignCommitted(cp.uid)&&!copyIsShowcased(cp.uid));if(i<0)return null;const removed=arr.splice(i,1)[0];invalidateCollectionValue();markSaveDirty();return removed}
  function groupEntriesForCard(id,level){const c=cardMap[id],arr=levelCopies(id,level)||[],groups=new Map();for(const cp of arr){const sig=copySignature(cp);if(!groups.has(sig))groups.set(sig,[]);groups.get(sig).push(cp)}return [...groups].map(([sig,copies])=>({c,level,copies,rep:copies[0],sig}))}
  function consumeForFuse(id,level,sig){const group=groupEntriesForCard(id,level).find(g=>g.sig===sig);if(!group||group.rep.grade||group.rep.gradingUntil||unlockedCopies(group.copies).filter(cp=>!cp.gradingUntil&&!copyIsCampaignCommitted(cp.uid)&&!copyIsShowcased(cp.uid)).length<2)return null;const a=removeMatchingCopy(id,level,sig),b=removeMatchingCopy(id,level,sig);if(!a||!b)return null;const fused={...a,uid:uid(),grade:null,gradedAt:null,openingPenalty:0,openingQuality:'Clean',locked:false,obtainedAt:Date.now(),source:`Fused from Level ${level}`};addCopy(id,level+1,fused);const h=state.history[id]||(state.history[id]={});h.highestLevel=Math.max(h.highestLevel||1,level+1);return fused}
  function highestLevelOwned(id){const it=state.inventory[id];if(!it)return 0;return Math.max(0,...Object.entries(it.levels||{}).filter(([,ld])=>(ld.copies||[]).length).map(([lv])=>+lv))}
  function formatDate(ts){if(!ts)return'Unknown';try{return new Date(ts).toLocaleString(undefined,{year:'numeric',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}catch(e){return'Unknown'}}
  function enterGame(){$('#settingsModal').classList.add('hidden');$('#astroApp').classList.add('hidden');$('#gameApp').classList.remove('hidden');renderAll();try{window.dispatchEvent(new Event('pf:enterGame'))}catch(err){}}
  function applyPerformanceSettings(){const st=state.settings||{};document.body.classList.toggle('quality-performance',st.quality==='performance');document.body.classList.toggle('particles-reduced',st.particles==='reduced');document.body.classList.toggle('particles-minimal',st.particles==='minimal');document.body.classList.toggle('anti-lag-aggressive',st.antiLag==='aggressive');document.body.classList.toggle('reduce-bg-motion',!!st.reduceMotion);document.body.classList.toggle('reduce-flashes',!!st.reduceFlashes);document.body.classList.toggle('no-screen-shake',st.screenShake===false);document.body.classList.toggle('no-background-stars',st.backgroundStars===false);document.body.classList.toggle('no-card-effects',st.cardEffects===false);document.body.classList.toggle('high-contrast',!!st.highContrast);document.documentElement.style.setProperty('--ui-scale',String((st.uiScale||100)/100));document.documentElement.style.fontSize=`${st.textScale||100}%`;const fps=$('#fpsCounter');if(fps)fps.classList.toggle('hidden',!st.fpsCounter)}
  function syncSettingsUI(){const st=state.settings||{};$('#soundToggle')?.classList.toggle('on',state.sound);if($('#soundVolume'))$('#soundVolume').value=Math.round((state.soundVolume??.78)*100);if($('#soundVolumeReadout'))$('#soundVolumeReadout').textContent=Math.round((state.soundVolume??.78)*100)+'%';if($('#soundProfile'))$('#soundProfile').value=state.soundProfile||'normal';$('#coinSoundToggle')?.classList.toggle('on',st.coinSounds!==false);$('#packSoundToggle')?.classList.toggle('on',st.packSounds!==false);$('#rewardSoundToggle')?.classList.toggle('on',st.rewardSounds!==false);$('#rareSoundToggle')?.classList.toggle('on',st.rareSoundFlourish!==false);if($('#qualitySetting'))$('#qualitySetting').value=st.quality||'high';if($('#targetFps'))$('#targetFps').value=String(st.targetFPS||60);$('#fpsToggle')?.classList.toggle('on',!!st.fpsCounter);if($('#particleSetting'))$('#particleSetting').value=st.particles||'full';if($('#antiLagSetting'))$('#antiLagSetting').value=st.antiLag||'off';$('#backgroundStarsToggle')?.classList.toggle('on',st.backgroundStars!==false);$('#cardEffectsToggle')?.classList.toggle('on',st.cardEffects!==false);$('#reduceMotionToggle')?.classList.toggle('on',!!st.reduceMotion);if($('#uiScaleSetting'))$('#uiScaleSetting').value=String(st.uiScale||100);if($('#textScaleSetting'))$('#textScaleSetting').value=String(st.textScale||100);$('#highContrastToggle')?.classList.toggle('on',!!st.highContrast);$('#reduceFlashesToggle')?.classList.toggle('on',!!st.reduceFlashes);$('#screenShakeToggle')?.classList.toggle('on',st.screenShake!==false);applyPerformanceSettings()}
  function setSettingsTab(tab='audio'){$$('[data-pf-settings-tab]').forEach(b=>b.classList.toggle('active',b.dataset.pfSettingsTab===tab));$$('[id^="pfSettingsPanel-"]').forEach(p=>p.classList.toggle('hidden',p.id!==`pfSettingsPanel-${tab}`));if(tab==='admin'&&typeof renderPfAdminBoard==='function')renderPfAdminBoard()}$$('[data-pf-settings-tab]').forEach(b=>b.onclick=()=>setSettingsTab(b.dataset.pfSettingsTab));$('#gameSettingsBtn').onclick=()=>{$('#gameSettingsModal').classList.remove('hidden');syncSettingsUI();setSettingsTab('audio');if($('#rewardCodeStatus'))setRewardCodeStatus('');if($('#rewardCodeInput'))$('#rewardCodeInput').value=''};
  if($('#returnAstro'))$('#returnAstro').onclick=()=>{save();$('#gameSettingsModal').classList.add('hidden');$('#gameApp').classList.add('hidden');$('#astroApp').classList.remove('hidden')};
  $('#soundToggle').onclick=e=>{state.sound=!state.sound;e.currentTarget.classList.toggle('on',state.sound);save()};
  $('#soundVolume').oninput=e=>{state.soundVolume=clamp(+e.target.value/100,0,1);$('#soundVolumeReadout').textContent=e.target.value+'%';save()};
  $('#soundProfile').onchange=e=>{state.soundProfile=e.target.value;save();sfx('buy')};
  if($('#coinSoundToggle'))$('#coinSoundToggle').onclick=e=>{state.settings.coinSounds=!state.settings.coinSounds;e.currentTarget.classList.toggle('on',state.settings.coinSounds);save();if(state.settings.coinSounds)sfx('click')};
  if($('#packSoundToggle'))$('#packSoundToggle').onclick=e=>{state.settings.packSounds=!state.settings.packSounds;e.currentTarget.classList.toggle('on',state.settings.packSounds);save();if(state.settings.packSounds)sfx('reveal','Rare','Holo')};
  if($('#rewardSoundToggle'))$('#rewardSoundToggle').onclick=e=>{state.settings.rewardSounds=!state.settings.rewardSounds;e.currentTarget.classList.toggle('on',state.settings.rewardSounds);save();if(state.settings.rewardSounds)sfx('buy')};
  if($('#rareSoundToggle'))$('#rareSoundToggle').onclick=e=>{state.settings.rareSoundFlourish=!state.settings.rareSoundFlourish;e.currentTarget.classList.toggle('on',state.settings.rareSoundFlourish);save()};
  $('#qualitySetting').onchange=e=>{state.settings.quality=e.target.value;applyPerformanceSettings();save()};
  $('#targetFps').onchange=e=>{state.settings.targetFPS=+e.target.value||60;save()};
  $('#fpsToggle').onclick=e=>{state.settings.fpsCounter=!state.settings.fpsCounter;e.currentTarget.classList.toggle('on',state.settings.fpsCounter);applyPerformanceSettings();if(state.settings.fpsCounter)ensureFpsLoop();save()};
  $('#particleSetting').onchange=e=>{state.settings.particles=e.target.value;applyPerformanceSettings();save()};
  $('#antiLagSetting').onchange=e=>{state.settings.antiLag=e.target.value;applyPerformanceSettings();save()};
  $('#reduceMotionToggle').onclick=e=>{state.settings.reduceMotion=!state.settings.reduceMotion;e.currentTarget.classList.toggle('on',state.settings.reduceMotion);applyPerformanceSettings();save()};
  if($('#backgroundStarsToggle'))$('#backgroundStarsToggle').onclick=e=>{state.settings.backgroundStars=!state.settings.backgroundStars;e.currentTarget.classList.toggle('on',state.settings.backgroundStars);applyPerformanceSettings();save()};
  if($('#cardEffectsToggle'))$('#cardEffectsToggle').onclick=e=>{state.settings.cardEffects=!state.settings.cardEffects;e.currentTarget.classList.toggle('on',state.settings.cardEffects);applyPerformanceSettings();save()};
  if($('#uiScaleSetting'))$('#uiScaleSetting').onchange=e=>{state.settings.uiScale=+e.target.value||100;applyPerformanceSettings();save()};
  if($('#textScaleSetting'))$('#textScaleSetting').onchange=e=>{state.settings.textScale=+e.target.value||100;applyPerformanceSettings();save()};
  if($('#highContrastToggle'))$('#highContrastToggle').onclick=e=>{state.settings.highContrast=!state.settings.highContrast;e.currentTarget.classList.toggle('on',state.settings.highContrast);applyPerformanceSettings();save()};
  if($('#reduceFlashesToggle'))$('#reduceFlashesToggle').onclick=e=>{state.settings.reduceFlashes=!state.settings.reduceFlashes;e.currentTarget.classList.toggle('on',state.settings.reduceFlashes);applyPerformanceSettings();save()};
  if($('#screenShakeToggle'))$('#screenShakeToggle').onclick=e=>{state.settings.screenShake=!state.settings.screenShake;e.currentTarget.classList.toggle('on',state.settings.screenShake);applyPerformanceSettings();save()};
  function grantCorePacks(count){count=Math.max(0,Math.floor(Number(count)||0));for(const t of basePackThemes())state.packInventory[t.id]=(state.packInventory[t.id]||0)+count}
  function grantRandomCorePacks(count){count=Math.max(0,Math.floor(Number(count)||0));const pool=basePackThemes();if(!pool.length)return;for(let i=0;i<count;i++){const t=pool[Math.floor(Math.random()*pool.length)];state.packInventory[t.id]=(state.packInventory[t.id]||0)+1}}
  function grantSpecialPacks(count){count=Math.max(0,Math.floor(Number(count)||0));const pool=basePackThemes(),muts=Object.values(packMutations);if(!pool.length||!muts.length)return;for(let i=0;i<count;i++){const t=pool[Math.floor(Math.random()*pool.length)],m=muts[Math.floor(Math.random()*muts.length)];state.specialPackInventory.push({uid:uid(),themeId:t.id,mutation:m.id,source:'Reward Code'})}}
  function grantPremiumPack(id,count=1){if(!premiumPackDefs[id])return;state.premiumPackInventory[id]=(state.premiumPackInventory[id]||0)+Math.max(0,Math.floor(count||0))}
  function grantEveryPackType(count=100){count=Math.max(0,Math.floor(Number(count)||0));grantCorePacks(count);for(const id of Object.keys(premiumPackDefs))grantPremiumPack(id,count);const pool=basePackThemes(),muts=Object.values(packMutations);for(const t of pool){for(const m of muts){for(let i=0;i<count;i++)state.specialPackInventory.push({uid:uid(),themeId:t.id,mutation:m.id,source:'Vault Master Code'})}}markSaveDirty()}
  function grantRandomPotion(count=1){const ids=Object.keys(potionDefs);for(let i=0;i<count;i++)addPotion(ids[Math.floor(Math.random()*ids.length)],1)}
  function grantOwnerMegaVault(){
    const count=1000;
    earn(100000000);
    grantCorePacks(count);
    const pool=basePackThemes();
    for(const id of Object.keys(potionDefs))addPotion(id,count);
    markSaveDirty();
  }
  function loseCash(amount){amount=Math.max(0,Number(amount)||0);const lost=Math.min(state.cash,amount);state.cash-=lost;markSaveDirty();return lost}
  function removeRandomCorePack(){const pool=basePackThemes().filter(t=>(state.packInventory[t.id]||0)>0);if(!pool.length)return false;const t=pool[Math.floor(Math.random()*pool.length)];state.packInventory[t.id]--;markSaveDirty();return t.name}
  function addUpgradeLevels(key,count){state[key]=(state[key]||0)+Math.max(0,Math.floor(count||0));state.stats.upgradesBought=(state.stats.upgradesBought||0)+Math.max(0,Math.floor(count||0));markSaveDirty()}
  function addEveryUpgrade(count=1){for(const u of Object.values(upgrades))addUpgradeLevels(u.key,count)}
  const rewardCodeDefs={
    "SANSAEVANS":{label:'OWNER VAULT — $100,000,000 + 1,000 core packs per set + 1,000 of every potion',apply:()=>grantOwnerMegaVault(),rewardId:"SANSAEVANS"},
    "PaCkS-FiVe":{label:'5 random core packs (tutorial training code)',tutorialOnly:true,apply:()=>grantRandomCorePacks(5),rewardId:"MOTH-7Q2-GLASS"},
    "CaSh-2500":{label:'$2,500',apply:()=>earn(2500),rewardId:"VANTA-CROW-91X"},
    "SpEcIaL-ThReE":{label:'3 random special packs',apply:()=>grantSpecialPacks(3),rewardId:"ORBITAL-FORK-6K4"},
    "CoRe-EaCh-OnE":{label:'1 of every core pack',apply:()=>grantCorePacks(1),rewardId:"CANDLE-NULL-44P"},
    "PrEmIuM-RaNdOm-TwO":{label:'2 random premium packs',apply:()=>{const ids=Object.keys(premiumPackDefs);for(let i=0;i<2;i++)grantPremiumPack(ids[Math.floor(Math.random()*ids.length)],1)},rewardId:"BRASS-ECHO-2V9"},
    "CaSh-10000":{label:'$10,000',apply:()=>earn(10000),rewardId:"RAVEN-STATIC-8M1"},
    "PaCkS-TeN":{label:'10 random core packs',apply:()=>grantRandomCorePacks(10),rewardId:"SALT-INDEX-3Q7"},
    "VaRiAnT-OnE":{label:'1 Variant Pack',apply:()=>grantPremiumPack('variant'),rewardId:"TUNDRA-KEY-5N8"},
    "HiGhRoLlEr-OnE":{label:'1 High-Roller Pack',apply:()=>grantPremiumPack('highroller'),rewardId:"HOLLOW-DICE-7C3"},
    "ViNtAgE-OnE":{label:'1 Vintage Pack',apply:()=>grantPremiumPack('vintage'),rewardId:"PAPER-GHOST-9L2"},
    "SeCrEtHuNt-OnE":{label:'1 Secret Hunt Pack',apply:()=>grantPremiumPack('secret'),rewardId:"EYELESS-MAP-4R6"},
    "GrAdEd-OnE":{label:'1 Graded Pack',apply:()=>grantPremiumPack('graded'),rewardId:"SILVER-RUST-8B5"},
    "CoInPoTiOn-ThReE":{label:'3 Coin Doubler potions',apply:()=>addPotion('money',3),rewardId:"VAULT-MOSS-1J7"},
    "OpEnToNiC-ThReE":{label:'3 Quick-Open Tonics',apply:()=>addPotion('openSpeed',3),rewardId:"PLUTO-WIRE-6D2"},
    "PrIsM-PoTiOn-TwO":{label:'2 Prism Potions',apply:()=>addPotion('variant',2),rewardId:"FROST-BELL-2X8"},
    "MuTaTiOn-SeRuM-TwO":{label:'2 Mutation Serums',apply:()=>addPotion('mutation',2),rewardId:"INK-TUNNEL-9P4"},
    "CaSiNo-ElIxIr-ThReE":{label:'3 Lucky Chip Elixirs',apply:()=>addPotion('casino',3),rewardId:"CIRCUIT-ASH-5H3"},
    "CaMpAiGn-PoTiOn-TwO":{label:'2 Curator Rush potions',apply:()=>addPotion('campaign',2),rewardId:"MARBLE-FOX-7T1"},
    "CrIt-Up-ThReE-A":{label:'+3 Critical Chance levels',apply:()=>addUpgradeLevels('warehouseLevel',3),rewardId:"RED-DOOR-0K9"},
    "CrIt-Up-ThReE-B":{label:'+3 Critical Chance levels',apply:()=>addUpgradeLevels('warehouseLevel',3),rewardId:"NIGHT-SPADE-4V2"},
    "FaStPaCk-Up-ThReE":{label:'+3 Faster Packs levels',apply:()=>addUpgradeLevels('kioskLevel',3),rewardId:"LANTERN-BYTE-8F6"},
    "BeTtErPaCk-Up-TwO":{label:'+2 Better Packs levels',apply:()=>addUpgradeLevels('variantLensLevel',2),rewardId:"DUST-CROWN-1M5"},
    "GaMbLeLuCk-Up-TwO":{label:'+2 Gambling Luck levels',apply:()=>addUpgradeLevels('autoLevel',2),rewardId:"WOLF-GLASS-3P8"},
    "LoSsReTuRn-Up-TwO":{label:'+2 Luck on Return levels',apply:()=>addUpgradeLevels('lineLevel',2),rewardId:"MIRROR-SALT-6R4"},
    "FaStCaMpAiGn-Up-ThReE":{label:'+3 Faster Campaigns levels',apply:()=>addUpgradeLevels('campaignPrepLevel',3),rewardId:"COLD-ENGINE-9J1"},
    "CaMpAiGnLuCk-Up-ThReE":{label:'+3 Luckier Campaigns levels',apply:()=>addUpgradeLevels('engineLevel',3),rewardId:"THORN-RADIO-2L7"},
    "CaSh-OnE":{label:'$1. Yes, literally one dollar.',apply:()=>earn(1),rewardId:"ZERO-PIGEON-5Q5"},
    "LoSeCaSh-250":{label:'A mysterious tax took up to $250',apply:()=>loseCash(250),rewardId:"TAXMAN-MOON-8C2"},
    "LoSePaCk-OnE":{label:'One random core pack vanished (if you had one)',apply:()=>removeRandomCorePack(),rewardId:"EMPTY-HAND-3N6"},
    "LoSeCaSh-50":{label:'A glitch ate up to $50',apply:()=>loseCash(50),rewardId:"SOFT-ERROR-7V1"},
    "CaSh-13":{label:'$13',apply:()=>earn(13),rewardId:"BENT-KEY-4K8"},
    "PoTiOn-RaNdOm-OnE":{label:'1 random potion',apply:()=>grantRandomPotion(1),rewardId:"BLACK-SPOON-9D3"},
    "SpEcIaL-FiVe":{label:'5 random special packs',apply:()=>grantSpecialPacks(5),rewardId:"FALLEN-STAR-2J4"},
    "CaSh-25000":{label:'$25,000',apply:()=>earn(25000),rewardId:"GOLDEN-STATIC-6M7"},
    "PrEmIuM-EaCh-OnE":{label:'1 of every premium pack',apply:()=>Object.keys(premiumPackDefs).forEach(id=>grantPremiumPack(id,1)),rewardId:"VOID-CANDY-1P9"},
    "PaCkS-SeVeN":{label:'7 random core packs',apply:()=>grantRandomCorePacks(7),rewardId:"MOSS-777-PRISM"},
    "UpGrAdEs-EaCh-OnE":{label:'+1 level to every upgrade',apply:()=>addEveryUpgrade(1),rewardId:"CLOCK-ASH-0R5"},
    "CaSh-5555":{label:'$5,555',apply:()=>earn(5555),rewardId:"FIVE-WOLVES-8Q8"},
    "CoRe-EaCh-TwO":{label:'2 of every core pack',apply:()=>grantCorePacks(2),rewardId:"CIPHER-LILY-3T0"},
    "MiXeD-FiVe-500":{label:'5 random packs + $500 + 1 special pack + 1 random potion',apply:()=>{grantRandomCorePacks(5);earn(500);grantSpecialPacks(1);grantRandomPotion(1)},rewardId:"LAST-LANTERN-9X9"},
    "PaCkS-EaCh-100":{label:'100 of every pack type — core, premium, graded, variant, and every special mutation/theme combination',apply:()=>grantEveryPackType(100),rewardId:"NULL-VAULT-100X-Q7M"},
    "SeMi-RaRe-RuSh":{label:'Queue 1 Rare Rush Semi-God Pack + grant a core test pack',apply:()=>{state.adminForces.godMode='semi_rare';grantRandomCorePacks(1)},rewardId:"PF32-SEMI-RARE"},
    "SeMi-HoLo-FlOoD":{label:'Queue 1 Holo Flood Semi-God Pack + grant a core test pack',apply:()=>{state.adminForces.godMode='semi_holo';grantRandomCorePacks(1)},rewardId:"PF32-SEMI-HOLO"},
    "SeMi-LeGeNd-FiNiSh":{label:'Queue 1 Legendary Finish Semi-God Pack + grant a core test pack',apply:()=>{state.adminForces.godMode='semi_finish';grantRandomCorePacks(1)},rewardId:"PF32-SEMI-FINISH"},
    "GoD-EpIc-PlUs":{label:'Queue 1 Epic+ God Pack + grant a core test pack',apply:()=>{state.adminForces.godMode='rarity';grantRandomCorePacks(1)},rewardId:"PF32-GOD-EPIC"},
    "GoD-VaRiAnT":{label:'Queue 1 Variant God Pack + grant a core test pack',apply:()=>{state.adminForces.godMode='variant';grantRandomCorePacks(1)},rewardId:"PF32-GOD-VARIANT"},
    "GoD-HoLo":{label:'Queue 1 Holo God Pack + grant a core test pack',apply:()=>{state.adminForces.godMode='holo';grantRandomCorePacks(1)},rewardId:"PF32-GOD-HOLO"},
    "GoD-SeCrEt":{label:'Queue 1 Secret God Pack + grant a core test pack',apply:()=>{state.adminForces.godMode='secret';grantRandomCorePacks(1)},rewardId:"PF32-GOD-SECRET"},
    "GoD-ArChIvE":{label:'Queue 1 Archive God Pack + grant a core test pack',apply:()=>{state.adminForces.godMode='archive';grantRandomCorePacks(1)},rewardId:"PF32-GOD-ARCHIVE"}
  };
  const legacyRewardCodeAliases={
    "MOTH-7Q2-GLASS":"PaCkS-FiVe",
    "VANTA-CROW-91X":"CaSh-2500",
    "ORBITAL-FORK-6K4":"SpEcIaL-ThReE",
    "CANDLE-NULL-44P":"CoRe-EaCh-OnE",
    "BRASS-ECHO-2V9":"PrEmIuM-RaNdOm-TwO",
    "RAVEN-STATIC-8M1":"CaSh-10000",
    "SALT-INDEX-3Q7":"PaCkS-TeN",
    "TUNDRA-KEY-5N8":"VaRiAnT-OnE",
    "HOLLOW-DICE-7C3":"HiGhRoLlEr-OnE",
    "PAPER-GHOST-9L2":"ViNtAgE-OnE",
    "EYELESS-MAP-4R6":"SeCrEtHuNt-OnE",
    "SILVER-RUST-8B5":"GrAdEd-OnE",
    "VAULT-MOSS-1J7":"CoInPoTiOn-ThReE",
    "PLUTO-WIRE-6D2":"OpEnToNiC-ThReE",
    "FROST-BELL-2X8":"PrIsM-PoTiOn-TwO",
    "INK-TUNNEL-9P4":"MuTaTiOn-SeRuM-TwO",
    "CIRCUIT-ASH-5H3":"CaSiNo-ElIxIr-ThReE",
    "MARBLE-FOX-7T1":"CaMpAiGn-PoTiOn-TwO",
    "RED-DOOR-0K9":"CrIt-Up-ThReE-A",
    "NIGHT-SPADE-4V2":"CrIt-Up-ThReE-B",
    "LANTERN-BYTE-8F6":"FaStPaCk-Up-ThReE",
    "DUST-CROWN-1M5":"BeTtErPaCk-Up-TwO",
    "WOLF-GLASS-3P8":"GaMbLeLuCk-Up-TwO",
    "MIRROR-SALT-6R4":"LoSsReTuRn-Up-TwO",
    "COLD-ENGINE-9J1":"FaStCaMpAiGn-Up-ThReE",
    "THORN-RADIO-2L7":"CaMpAiGnLuCk-Up-ThReE",
    "ZERO-PIGEON-5Q5":"CaSh-OnE",
    "TAXMAN-MOON-8C2":"LoSeCaSh-250",
    "EMPTY-HAND-3N6":"LoSePaCk-OnE",
    "SOFT-ERROR-7V1":"LoSeCaSh-50",
    "BENT-KEY-4K8":"CaSh-13",
    "BLACK-SPOON-9D3":"PoTiOn-RaNdOm-OnE",
    "FALLEN-STAR-2J4":"SpEcIaL-FiVe",
    "GOLDEN-STATIC-6M7":"CaSh-25000",
    "VOID-CANDY-1P9":"PrEmIuM-EaCh-OnE",
    "MOSS-777-PRISM":"PaCkS-SeVeN",
    "CLOCK-ASH-0R5":"UpGrAdEs-EaCh-OnE",
    "FIVE-WOLVES-8Q8":"CaSh-5555",
    "CIPHER-LILY-3T0":"CoRe-EaCh-TwO",
    "LAST-LANTERN-9X9":"MiXeD-FiVe-500",
    "NULL-VAULT-100X-Q7M":"PaCkS-EaCh-100"
  };

  const PF_V35_RETIRED_SPECIALTY_CODES=['SpEcIaL-ThReE','PrEmIuM-RaNdOm-TwO','VaRiAnT-OnE','HiGhRoLlEr-OnE','ViNtAgE-OnE','SeCrEtHuNt-OnE','GrAdEd-OnE','SpEcIaL-FiVe','PrEmIuM-EaCh-OnE','MiXeD-FiVe-500','PaCkS-EaCh-100'];
  for(const k of PF_V35_RETIRED_SPECIALTY_CODES)delete rewardCodeDefs[k];

  function setRewardCodeStatus(message,good=false){const el=$('#rewardCodeStatus');if(!el)return;el.textContent=message||'';el.classList.toggle('good',!!good);el.classList.toggle('bad',!!message&&!good)}
  function redeemRewardCode(){
    const input=$('#rewardCodeInput');if(!input)return;const typed=String(input.value||'').trim();
    if(!typed){setRewardCodeStatus('Enter a code first.');sfx('error');return}
    const legacyKey=typed.toUpperCase(),code=rewardCodeDefs[typed]?typed:(legacyRewardCodeAliases[legacyKey]||null),def=code?rewardCodeDefs[code]:null;if(!def){setRewardCodeStatus('That code is not valid. Capitalization matters for current codes.');sfx('error');return}if(def.tutorialOnly&&!tutorialTrainingMode){setRewardCodeStatus('That training code only works during the tutorial.');sfx('error');return}
    const rewardId=def.rewardId||code;state.redeemedCodes=state.redeemedCodes||{};if(state.redeemedCodes[code]||state.redeemedCodes[rewardId]){setRewardCodeStatus('That code has already been redeemed on this save.');sfx('error');return}
    try{def.apply();const redeemedAt=Date.now();state.redeemedCodes[code]=redeemedAt;state.redeemedCodes[rewardId]=redeemedAt;input.value='';setRewardCodeStatus(`Redeemed: ${def.label}.`,true);sfx('buy');toast('Code redeemed',def.label);try{window.dispatchEvent(new CustomEvent('pf:codeRedeemed',{detail:{code,label:def.label}}))}catch(e){}save(true);renderHUD();updateBagCounts();if(!$('#view-collection').classList.contains('hidden'))renderBag();if(!$('#view-shop').classList.contains('hidden'))renderShop()}catch(err){console.error('Reward code failed',err);setRewardCodeStatus('Code could not be redeemed.');sfx('error')}
  }
  if($('#redeemRewardCode'))$('#redeemRewardCode').onclick=redeemRewardCode;
  if($('#rewardCodeInput'))$('#rewardCodeInput').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();redeemRewardCode()}});

  /* ---------- PackForge owner admin board ---------- */
  let pfAdminUnlocked=false;
  const PF_ADMIN_PASSWORD_SHA256='c2fd1c1b9c8251af1322f12b24734b514605d63905bbad40f14ee8faf2cee990';
  async function pfAdminPasswordMatches(value){try{const bytes=new TextEncoder().encode(String(value||''));const digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('')===PF_ADMIN_PASSWORD_SHA256}catch(e){return false}}
  function pfAdminPackCount(){return Object.values(state.packInventory||{}).reduce((n,v)=>n+(Number(v)||0),0)+Object.values(state.premiumPackInventory||{}).reduce((n,v)=>n+(Number(v)||0),0)+(Array.isArray(state.specialPackInventory)?state.specialPackInventory.length:0)}
  function setPfAdminStatus(message,good=false,action=false){const el=$(action?'#pfAdminActionStatus':'#pfAdminStatus');if(!el)return;el.textContent=message||'';el.classList.toggle('good',!!good);el.classList.toggle('bad',!!message&&!good)}
  function renderPfAdminBoard(){const gate=$('#pfAdminGate'),board=$('#pfAdminBoard');if(!gate||!board)return;gate.classList.toggle('hidden',pfAdminUnlocked);board.classList.toggle('hidden',!pfAdminUnlocked);if(!pfAdminUnlocked)return;if($('#pfAdminCash'))$('#pfAdminCash').textContent=fmt(state.cash);if($('#pfAdminCards'))$('#pfAdminCards').textContent=totalCardCount().toLocaleString();if($('#pfAdminPacks'))$('#pfAdminPacks').textContent=pfAdminPackCount().toLocaleString();if($('#pfAdminOpened'))$('#pfAdminOpened').textContent=(Number(state.packsOpened)||0).toLocaleString();if($('#pfAdminCampaign'))$('#pfAdminCampaign').textContent=state.campaigns?.active?'ACTIVE':'NONE';if($('#pfAdminSchema'))$('#pfAdminSchema').textContent=String(state.schemaVersion||SAVE_SCHEMA);if($('#pfAdminOD'))$('#pfAdminOD').textContent=overdriveActive()?`ACTIVE ${overdriveTime(overdriveRemaining())}`:`${Math.floor(state.overdrive?.points||0)} / 100`;if($('#pfAdminGodPacks'))$('#pfAdminGodPacks').textContent=(state.quirkStats?.godPacks||0).toLocaleString();if($('#pfAdminGhostCards'))$('#pfAdminGhostCards').textContent=(state.quirkStats?.ghostCards||0).toLocaleString();if($('#pfAdminBlackLabels'))$('#pfAdminBlackLabels').textContent=(state.quirkStats?.blackLabels||0).toLocaleString();const sel=$('#pfAdminTestTheme');if(sel&&!sel.options.length)sel.innerHTML=basePackThemes().map(t=>`<option value="${t.id}">${t.emoji} ${t.name}</option>`).join('');const af=state.adminForces||{};const queued=[];if(af.godMode)queued.push(pfPackModeMeta(af.godMode)?.name||'Forced Pack');if(af.bonusNext)queued.push('6-card pack');if(af.ghostNext)queued.push('Ghost pull');if(af.blackLabelNext)queued.push('Black Label');if(af.crueNext)queued.push('Crue Lowe');if(af.jetNext)queued.push('Jet Lumagui');const fs=$('#pfAdminForceStatus');if(fs)fs.textContent=queued.length?`QUEUED: ${queued.join(' · ')}`:'No rare outcome is currently queued.'}
  function pfAdminAfterAction(message){markSaveDirty();save(true);renderAll();renderOverdrive();renderPfAdminBoard();setPfAdminStatus(message,true,true)}
  function pfAdminNumber(id,fallback=0,min=0,max=Number.MAX_SAFE_INTEGER){const el=$(id),n=Math.floor(Number(el?.value));return Number.isFinite(n)?clamp(n,min,max):fallback}
  async function unlockPfAdmin(){const input=$('#pfAdminPassword');const ok=await pfAdminPasswordMatches(input?.value||'');if(ok){pfAdminUnlocked=true;if(input)input.value='';setPfAdminStatus('');setPfAdminStatus('Admin board unlocked.',true,true);renderPfAdminBoard();pfMountAdminPanel();sfx('buy')}else{setPfAdminStatus('Incorrect admin password.');sfx('error')}}
  if($('#pfAdminUnlock'))$('#pfAdminUnlock').onclick=unlockPfAdmin;
  if($('#pfAdminPassword'))$('#pfAdminPassword').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();unlockPfAdmin()}});
  if($('#pfAdminAddCash'))$('#pfAdminAddCash').onclick=()=>{if(!pfAdminUnlocked)return;const amount=pfAdminNumber('#pfAdminCashAmount',0,0,1e15);state.cash+=amount;pfAdminAfterAction(`Added ${fmt(amount)}.`)};
  if($('#pfAdminSetCash'))$('#pfAdminSetCash').onclick=()=>{if(!pfAdminUnlocked)return;const amount=pfAdminNumber('#pfAdminCashAmount',0,0,1e15);state.cash=amount;pfAdminAfterAction(`Cash set to ${fmt(amount)}.`)};
  if($('#pfAdminCorePacks'))$('#pfAdminCorePacks').onclick=()=>{if(!pfAdminUnlocked)return;const amount=pfAdminNumber('#pfAdminPackAmount',10,1,1000);grantCorePacks(amount);pfAdminAfterAction(`Granted ${amount} of each core pack.`)};
  if($('#pfAdminPremiumPacks'))$('#pfAdminPremiumPacks').onclick=()=>{if(!pfAdminUnlocked)return;const amount=pfAdminNumber('#pfAdminPackAmount',10,1,1000);Object.keys(premiumPackDefs).forEach(id=>grantPremiumPack(id,amount));pfAdminAfterAction(`Granted ${amount} of each premium pack.`)};
  if($('#pfAdminSpecialPacks'))$('#pfAdminSpecialPacks').onclick=()=>{if(!pfAdminUnlocked)return;const amount=pfAdminNumber('#pfAdminPackAmount',10,1,1000);grantSpecialPacks(amount);pfAdminAfterAction(`Granted ${amount} random special packs.`)};
  if($('#pfAdminVault100'))$('#pfAdminVault100').onclick=()=>{if(!pfAdminUnlocked)return;grantEveryPackType(100);pfAdminAfterAction('Granted 100 of every pack type.')};
  if($('#pfAdminFillOverdrive'))$('#pfAdminFillOverdrive').onclick=()=>{if(!pfAdminUnlocked)return;state.overdrive=state.overdrive||{points:0,clickRemainder:0,packRemainder:0,activeUntil:0,totalLaunches:0};state.overdrive.points=100;state.overdrive.clickRemainder=0;state.overdrive.packRemainder=0;renderOverdrive();pfAdminAfterAction('Overdrive meter filled to 100.')};
  function pfAdminSelectedTheme(){const id=$('#pfAdminTestTheme')?.value;return basePackThemes().find(t=>t.id===id)||basePackThemes()[0]}
  function pfAdminGrantTestPack(count=1){const t=pfAdminSelectedTheme();if(!t)return null;state.packInventory[t.id]=(state.packInventory[t.id]||0)+Math.max(1,Math.floor(count));return t}
  if($('#pfAdminCash100M'))$('#pfAdminCash100M').onclick=()=>{if(!pfAdminUnlocked)return;state.cash+=100000000;pfAdminAfterAction('Added $100,000,000.')};
  if($('#pfAdminPotions1000'))$('#pfAdminPotions1000').onclick=()=>{if(!pfAdminUnlocked)return;for(const id of Object.keys(potionDefs))addPotion(id,1000);pfAdminAfterAction('Granted 1,000 of every potion.')};
  if($('#pfAdminVault1000'))$('#pfAdminVault1000').onclick=()=>{if(!pfAdminUnlocked)return;grantEveryPackType(1000);pfAdminAfterAction('Granted 1,000 of every pack type.')};
  if($('#pfAdminHighRoller10'))$('#pfAdminHighRoller10').onclick=()=>{if(!pfAdminUnlocked)return;grantPremiumPack('highroller',10);pfAdminAfterAction('Granted 10 High-Roller Packs.')};
  if($('#pfAdminSecret10'))$('#pfAdminSecret10').onclick=()=>{if(!pfAdminUnlocked)return;grantPremiumPack('secret',10);pfAdminAfterAction('Granted 10 Secret Hunt Packs.')};
  if($('#pfAdminGraded10'))$('#pfAdminGraded10').onclick=()=>{if(!pfAdminUnlocked)return;grantPremiumPack('graded',10);pfAdminAfterAction('Granted 10 Graded Packs.')};
  if($('#pfAdminGodRare'))$('#pfAdminGodRare').onclick=()=>{if(!pfAdminUnlocked)return;state.adminForces.godMode='rarity';const t=pfAdminGrantTestPack(1);pfAdminAfterAction(`Next opened pack is guaranteed to be an Epic+ God Pack. Added 1 ${t?.name||''} Pack.`)};
  if($('#pfAdminGodVariant'))$('#pfAdminGodVariant').onclick=()=>{if(!pfAdminUnlocked)return;state.adminForces.godMode='variant';const t=pfAdminGrantTestPack(1);pfAdminAfterAction(`Next opened pack is guaranteed to be an all-variant God Pack. Added 1 ${t?.name||''} Pack.`)};
  if($('#pfAdminBonusPack'))$('#pfAdminBonusPack').onclick=()=>{if(!pfAdminUnlocked)return;state.adminForces.bonusNext=true;const t=pfAdminGrantTestPack(1);pfAdminAfterAction(`Next opened pack is guaranteed to contain 6 cards. Added 1 ${t?.name||''} Pack.`)};
  if($('#pfAdminGhostPack'))$('#pfAdminGhostPack').onclick=()=>{if(!pfAdminUnlocked)return;state.adminForces.ghostNext=true;const t=pfAdminGrantTestPack(1);pfAdminAfterAction(`Next opened pack is guaranteed to contain the hidden Ghost card. Added 1 ${t?.name||''} Pack.`)};
  if($('#pfAdminBlackLabel'))$('#pfAdminBlackLabel').onclick=()=>{if(!pfAdminUnlocked)return;state.adminForces.blackLabelNext=true;pfAdminAfterAction('Next grading submission is guaranteed to return a 10.0 Perfect Black Label.')};
  if($('#pfAdminLaunchOverdrive'))$('#pfAdminLaunchOverdrive').onclick=()=>{if(!pfAdminUnlocked)return;if((state.overdrive?.points||0)<100&&!overdriveActive()){state.overdrive.points=100;state.overdrive.clickRemainder=0;state.overdrive.packRemainder=0}const ok=launchOverdrive();renderPfAdminBoard();setPfAdminStatus(ok?'Overdrive launched for 5 minutes.':'Overdrive is already active.',true,true)};
  if($('#pfAdminSaveNow'))$('#pfAdminSaveNow').onclick=()=>{if(!pfAdminUnlocked)return;save(true);renderPfAdminBoard();setPfAdminStatus('Save written to local storage.',true,true)};
  if($('#pfAdminRefresh'))$('#pfAdminRefresh').onclick=()=>{if(!pfAdminUnlocked)return;renderPfAdminBoard();setPfAdminStatus('Dashboard refreshed.',true,true)};
  if($('#pfAdminLock'))$('#pfAdminLock').onclick=()=>{pfAdminUnlocked=false;setPfAdminStatus('');setPfAdminStatus('');renderPfAdminBoard();const input=$('#pfAdminPassword');if(input)input.value=''};
  $('#resetSave').onclick=()=>{if(!confirm('Step 1 of 3: Reset all PackForge progress on this browser?'))return;if(!confirm('Step 2 of 3: This permanently deletes the local save. Continue?'))return;const typed=prompt('Step 3 of 3: Type RESET to confirm.');if(typed!=='RESET')return;pfAdminUnlocked=false;localStorage.removeItem(saveKey);state=defaultState();loadedSave=null;rouletteBets=state.rouletteBets;invalidateCollectionValue();saveDirty=true;$('#gameSettingsModal').classList.add('hidden');syncSettingsUI();showView('play');renderAll();save(true);toast('Save reset','Fresh vault, fresh luck.');try{window.dispatchEvent(new Event('pf:resetSave'))}catch(err){}};
  const frameTimes={};function frameAllowed(key,now){const target=Math.max(20,+state.settings.targetFPS||60),gap=1000/target,last=frameTimes[key]||0;if(now-last<gap)return false;frameTimes[key]=now;return true}
  let fpsFrames=0,fpsLast=performance.now(),fpsRaf=0;function fpsLoop(now){if(!state.settings.fpsCounter||document.hidden){fpsRaf=0;return}fpsFrames++;if(now-fpsLast>=500){const fps=Math.round(fpsFrames*1000/(now-fpsLast));fpsFrames=0;fpsLast=now;if($('#fpsCounter'))$('#fpsCounter').textContent=`${fps} FPS`}fpsRaf=requestAnimationFrame(fpsLoop)}function ensureFpsLoop(){if(state.settings.fpsCounter&&!document.hidden&&!fpsRaf){fpsFrames=0;fpsLast=performance.now();fpsRaf=requestAnimationFrame(fpsLoop)}}syncSettingsUI();ensureFpsLoop();
  function showView(v){$$('.view').forEach(x=>x.classList.add('hidden'));const target=$('#view-'+v);if(target)target.classList.remove('hidden');$$('.side-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===v));if(v==='collection')renderBag();if(v==='shop'){renderShop();renderUpgrades()}if(v==='casino')renderCasino();if(v==='campaigns')renderCampaigns();if(v==='overdrive')renderOverdrive();if(v==='grading')renderGrading();if(v==='stats')renderStats();if(v==='achievements')renderAchievements()}
  $$('.side-btn').forEach(b=>b.onclick=()=>showView(b.dataset.view));
  let currentShopTab='packs',currentBagTab='cards',currentStatsTab='overview';
  function setShopTab(tab){currentShopTab=tab;$$('[data-shop-tab]').forEach(b=>b.classList.toggle('active',b.dataset.shopTab===tab));$('#shopPacksTab').classList.toggle('hidden',tab!=='packs');$('#shopUpgradesTab').classList.toggle('hidden',tab!=='upgrades');if(tab==='packs')renderShop();else renderUpgrades()}
  function updateBagCounts(){const pc=$('#bagPackCount'),pt=$('#bagPotionCount');if(pc)pc.textContent=packBagTotal()?`×${packBagTotal()}`:'';const total=Object.values(state.potionInventory||{}).reduce((a,b)=>a+(+b||0),0);if(pt)pt.textContent=total?`×${total}`:''}
  function setBagTab(tab){if(!['cards','packs'].includes(tab))tab='cards';currentBagTab=tab;$$('[data-bag-tab]').forEach(b=>b.classList.toggle('active',b.dataset.bagTab===tab));$('#bagCardsTab').classList.toggle('hidden',tab!=='cards');$('#bagPacksTab').classList.toggle('hidden',tab!=='packs');if(tab==='cards')renderCollection();if(tab==='packs')renderPacks();updateBagCounts()}
  function renderBag(){setBagTab(currentBagTab)}
  $$('[data-shop-tab]').forEach(b=>b.onclick=()=>setShopTab(b.dataset.shopTab));
  $$('[data-bag-tab]').forEach(b=>b.onclick=()=>setBagTab(b.dataset.bagTab));
  $$('[data-jump]').forEach(b=>b.onclick=()=>showView(b.dataset.jump));
  let comboClicks=0,comboExpiresAt=0,upgradeRefreshTimer=null;
  function comboMultiplier(){return 1+comboClicks*.0005}
  function updateComboUI(){
    const el=$('#comboText'),remain=Math.max(0,(comboExpiresAt-Date.now())/1000);
    if(comboClicks<=0||remain<=0){if(comboClicks&&remain<=0)comboClicks=0;el.className='combo';el.textContent='';pfOrbHeat();return}
    el.className='combo active';el.innerHTML=`<span>COMBO</span><span class="combo-count">${comboClicks.toLocaleString()} CLICK${comboClicks===1?'':'S'}</span><span class="combo-bonus">+${(comboClicks*.05).toFixed(2)}%</span><span class="combo-time">${remain.toFixed(2)}s</span>`;pfOrbHeat()
  }
  let comboRaf=0,comboLastPaint=0;function comboFrame(now){if(document.hidden||comboClicks<=0){comboRaf=0;updateComboUI();return}if(now-comboLastPaint>=100){comboLastPaint=now;updateComboUI()}comboRaf=requestAnimationFrame(comboFrame)}function ensureComboLoop(){if(comboClicks>0&&!document.hidden&&!comboRaf){comboLastPaint=0;comboRaf=requestAnimationFrame(comboFrame)}}
  function scheduleUpgradeRefresh(){if(upgradeRefreshTimer)return;upgradeRefreshTimer=setTimeout(()=>{upgradeRefreshTimer=null;if(!$('#view-shop').classList.contains('hidden')&&currentShopTab==='upgrades')renderUpgrades()},180)}
  let pfLastCursor={x:null,y:null};
  document.addEventListener('pointermove',e=>{pfLastCursor.x=e.clientX;pfLastCursor.y=e.clientY},{passive:true});
  function showClickPop(amt,label,e){const el=$('#clickPop'),host=$('.press-card'),r=host.getBoundingClientRect();let x=Number(e?.clientX),y=Number(e?.clientY);const keyboardClick=!e||e.detail===0||(!x&&!y);if(keyboardClick&&Number.isFinite(pfLastCursor.x)&&Number.isFinite(pfLastCursor.y)){x=pfLastCursor.x;y=pfLastCursor.y}if(!Number.isFinite(x)||!Number.isFinite(y)){x=r.left+r.width/2;y=r.top+r.height/2}el.textContent=(label?label+'  ':'')+'+'+fmt(amt);el.style.left=clamp(x-r.left,24,r.width-24)+'px';el.style.top=clamp(y-r.top,24,r.height-24)+'px';el.classList.remove('show');void el.offsetWidth;el.classList.add('show')}
  function pfOrbCenter(){const b=$('#clickOrb'),h=$('.press-card');if(!b||!h)return null;const br=b.getBoundingClientRect(),hr=h.getBoundingClientRect();return {host:h,x:br.left-hr.left+br.width/2,y:br.top-hr.top+br.height/2}}
  function pfOrbShockwave(kind='normal'){const p=pfOrbCenter();if(!p)return;const w=document.createElement('span');w.className='pf-orb-shockwave '+(kind==='critical'?'crit':kind==='jackpot'?'jackpot':'');w.style.left=p.x+'px';w.style.top=p.y+'px';p.host.appendChild(w);setTimeout(()=>w.remove(),900)}
  function pfOrbMilestone(n){const h=$('.press-card');if(!h)return;const m=document.createElement('div');m.className='pf-orb-milestone'+(n%100===0?' big':'');m.textContent=n.toLocaleString()+' COMBO';h.appendChild(m);setTimeout(()=>m.remove(),1200);pfOrbShockwave(n%100===0?'jackpot':'critical')}
  function pfOrbHeat(){const b=$('#clickOrb'),h=$('.press-card');if(!b||!h)return;const heat=Math.max(0,Math.min(1,comboClicks/100));b.style.setProperty('--orb-heat',heat.toFixed(3));h.style.setProperty('--orb-heat',heat.toFixed(3));h.classList.toggle('orb-heated',heat>.05)}
  function animateCoin(cls,dur){const b=$('#clickOrb');b.classList.remove('bounce','critical','jackpot');void b.offsetWidth;b.classList.add(cls);pfOrbShockwave(cls==='critical'?'critical':cls==='jackpot'?'jackpot':'normal');setTimeout(()=>b.classList.remove(cls),dur)}
  function unlockedUpgradeIds(){return Object.keys(upgrades)}
  function triggerJackpot(){
    const roll=Math.random();let msg='';
    state.stats.jackpots=(state.stats.jackpots||0)+1;
    if(roll<.50){const bonus=Math.max(25,clickValue()*180);earn(bonus);msg=`Cash burst: +${fmt(bonus)}`}
    else if(roll<.76){state.clickBoostUntil=Date.now()+45000;msg='Coin value ×2 for 45 seconds.'}
    else if(roll<.94){const bonus=Math.max(10,clickValue()*90);earn(bonus);msg=`Lucky burst: +${fmt(bonus)}`}
    else{const ids=unlockedUpgradeIds(),id=ids[Math.floor(Math.random()*ids.length)],u=upgrades[id];state[u.key]=(state[u.key]||0)+1;msg=`Free ${u.name} upgrade.`}
    animateCoin('jackpot',800);sfx('jackpot');confetti(40);toast('JACKPOT!',msg);renderHUD();renderUpgrades();save()
  }
  function availablePackThemes(){return basePackThemes()}
  function rollPackDropTheme(){const arr=availablePackThemes();return arr[Math.floor(Math.random()*arr.length)]}
  function tryPackDrop(){if(Math.random()>=packDropChance())return null;const t=rollPackDropTheme();state.packInventory[t.id]=(state.packInventory[t.id]||0)+1;state.stats.packDrops=(state.stats.packDrops||0)+1;sfx('buy');toast('PACK FOUND!',`${t.name} Pack was sent to the Packs tab in Bag.`);save();return t}
  $('#clickOrb').addEventListener('click',e=>{
    const now=Date.now();
    if(now>comboExpiresAt)comboClicks=0;comboClicks++;comboExpiresAt=now+comboWindowMs();ensureComboLoop();if(comboClicks%25===0)pfOrbMilestone(comboClicks);
    state.stats.clicks=(state.stats.clicks||0)+1;addOverdriveProgress('click',1);
    const tutorialLock=window.__pfTutorialLockClick===true;
    const critical=tutorialLock?false:Math.random()<criticalChance();
    const amount=tutorialLock?1:clickValue()*comboMultiplier()*(critical?5:1);
    if(critical)state.stats.criticals=(state.stats.criticals||0)+1;
    earn(amount);
    showClickPop(amount,critical?'CRITICAL ×5':'',e);sfx(critical?'critical':'click');animateCoin(critical?'critical':'bounce',critical?430:190);updateComboUI();
    if(!tutorialLock){tryPackDrop();if(Math.random()<Math.min(.05,.0015*overdriveBoost()))triggerJackpot();}
    renderHUD();scheduleUpgradeRefresh();
    try{window.dispatchEvent(new CustomEvent('pf:click',{detail:{amount}}))}catch(err){}
  });
  const pfOrb=$('#clickOrb');
  if(pfOrb){
    // Enter is intentionally NOT a Coin control. Native focused-button activation can
    // auto-repeat extremely quickly when Enter is held, so suppress that default
    // behavior on both keydown and keyup. Spacebar/mouse/touch behavior is unchanged.
    const blockCoinEnter=e=>{if(e.key==='Enter'||e.code==='Enter'||e.code==='NumpadEnter'){e.preventDefault();e.stopImmediatePropagation()}};
    pfOrb.addEventListener('keydown',blockCoinEnter,true);
    pfOrb.addEventListener('keyup',blockCoinEnter,true);
  }
  function upgradeCost(u){const level=state[u.key]||0;return Math.max(1,Math.round(u.base*Math.pow(u.growth,level)))}
  function upgradeEffectText(id){
    if(id==='click')return `${fmt(clickValue())} per click`;
    if(id==='crit')return `Critical chance ${(criticalChance()*100).toFixed(2)}%`;
    if(id==='faster')return `Auto ${(autoRevealMs()/1000).toFixed(2)}s/card · manual ${(manualRevealMs()/1000).toFixed(2)}s`;
    if(id==='better')return `Variants ×${variantLuckMultiplier().toFixed(2)} · special ${(specialPackChance()*100).toFixed(2)}% · quality boost ${(packQualityPromoteChance()*100).toFixed(1)}%`;
    if(id==='gamble')return `Casino payout luck +${((casinoPayoutBoost()/activePotionMultiplier('casino')-1)*100).toFixed(1)}%`;
    if(id==='returnluck')return `Loss-return chance ${(lossReturnChance()*100).toFixed(1)}%`;
    if(id==='campaignfast')return `Campaign speed +${((campaignPrepMultiplier()/activePotionMultiplier('campaign')-1)*100).toFixed(1)}%`;
    if(id==='campaignluck')return `Campaign reward luck ×${campaignLuckMultiplier().toFixed(2)}`;
    return '';
  }
  function renderUpgrades(){
    const host=$('#upgradeList');if(!host)return;
    const groups=[['Coin',['crit']],['Packs',['faster','better']],['Casino',['gamble','returnluck']],['Campaigns',['campaignfast','campaignluck']]];
    host.innerHTML=groups.map(([label,ids])=>`<div class="upgrade-section"><span>${label}</span></div>`+ids.map(id=>{const u=upgrades[id],cost=upgradeCost(u),lvl=state[u.key]||0;return `<div class="upgrade-row"><div><div class="upgrade-name">${u.name} <span class="upgrade-level">Lv ${lvl}</span></div><div class="upgrade-desc">${u.desc}</div><div class="upgrade-effect">${upgradeEffectText(id)}</div></div><button class="buy-btn" data-upgrade="${id}" ${canAfford(cost)?'':'disabled'}>${fmt(cost)}</button></div>`}).join('')).join('');
    $$('[data-upgrade]').forEach(b=>b.onclick=()=>{const u=upgrades[b.dataset.upgrade],cost=upgradeCost(u);if(!spend(cost)){sfx('error');return}state[u.key]=(state[u.key]||0)+1;state.stats.upgradesBought=(state.stats.upgradesBought||0)+1;sfx('buy');renderHUD();renderUpgrades();save()})
  }
  const PACK_PRICES={1:100};
  function packPrice(theme){if(theme?.campaignHidden)return 1000;return Math.max(1,Math.round(PACK_PRICES[1]*showcaseBonuses().packCostMult))}
  function packListPrice(theme,mutation=null){if(mutation)return theme?.campaignHidden?1000:500;return theme?.campaignHidden?1000:PACK_PRICES[1]}
  function packSellValue(theme,mutation=null){return Math.round(packListPrice(theme,mutation)*.75*100)/100}
  function commonPackValue(theme){const commons=theme.cards.filter(c=>c.rarity==='Common');const avg=commons.reduce((n,c)=>n+c.value,0)/Math.max(1,commons.length);return Math.round(avg*5)}
  function renderShop(){
    const grid=$('#shopGrid');if(!grid)return;const arr=themes.filter(shopThemeVisible);
    const note=$('#packTierNote');if(note)note.textContent='Five core sets are permanent. Rare campaign discoveries appear here with exactly 10 purchases before hiding again.';
    grid.innerHTML=arr.map(t=>{const price=packPrice(t),commons=commonPackValue(t),remaining=t.campaignHidden?hiddenOfferRemaining(t.id):null;return `<article class="shop-offer ${t.campaignHidden?'limited-set':''}"><div class="shop-offer-art" style="background:${t.gradient}"><div class="shop-mini-pack" style="background:${t.gradient}"><span class="shop-pack-emoji">${t.emoji}</span><span class="shop-pack-name">${t.name.toUpperCase()}</span><small>5 CARDS</small></div></div><div class="shop-offer-copy">${t.campaignHidden?`<span class="tier-badge campaign-find-badge">CAMPAIGN FIND · ${remaining}/10 LEFT</span>`:''}<h3>${t.name} Pack</h3><p>${t.desc}</p><div class="shop-price">${fmt(price)}</div><button class="shop-buy" data-shop-buy="${t.id}" ${canAfford(price)?'':'disabled'}>Buy Pack${t.campaignHidden?` · ${remaining} left`:''}</button></div></article>`}).join('');
    $$('[data-shop-buy]').forEach(b=>b.onclick=()=>buyShopPack(b.dataset.shopBuy));if($('#premiumPackShop'))$('#premiumPackShop').innerHTML='';
  }
  function buyShopPack(themeId){const t=themes.find(x=>x.id===themeId),price=packPrice(t);if(!t||!shopThemeVisible(t)||!spend(price)){sfx('error');renderShop();return}state.packInventory[t.id]=(state.packInventory[t.id]||0)+1;if(t.campaignHidden){state.campaignSetOffers[t.id]=Math.max(0,hiddenOfferRemaining(t.id)-1)}state.stats.packsBought=(state.stats.packsBought||0)+1;sfx('buy');toast('Pack sent to Bag',`${t.name} Pack has been sent to the Packs tab in Bag.`);save();renderHUD();renderShop();updateBagCounts();if(!$('#view-collection').classList.contains('hidden')&&currentBagTab==='packs')renderPacks();try{window.dispatchEvent(new CustomEvent('pf:packBought',{detail:{themeId:t.id}}))}catch(err){}}
  function renderPremiumPackShop(){const host=$('#premiumPackShop');if(!host)return;host.innerHTML=Object.values(premiumPackDefs).map(d=>`<article class="premium-shop-card" style="--pp-glow:${d.glow}"><div class="premium-shop-icon">${d.emoji}</div><h3>${d.name}</h3><p>${d.desc}</p><div class="premium-shop-effect">${d.effect}</div><div class="premium-shop-bottom"><span class="premium-shop-price">${fmt(d.cost)}</span><button class="premium-shop-buy" data-buy-premium="${d.id}" ${canAfford(d.cost)?'':'disabled'}>Buy</button></div></article>`).join('');$$('[data-buy-premium]').forEach(b=>b.onclick=()=>buyPremiumPack(b.dataset.buyPremium))}
  function buyPremiumPack(id){const d=premiumPackDefs[id];if(!d)return;sfx('error');toast('Campaign reward only',`${d.name} is no longer sold in the Shop. Win specialty packs from Campaigns or grant them from Admin.`);renderShop()}
  function rollPackMutation(){if(Math.random()>=specialPackChance())return null;const arr=Object.values(packMutations),total=arr.reduce((n,x)=>n+x.weight,0);let r=Math.random()*total;for(const m of arr){r-=m.weight;if(r<=0)return m}return arr[arr.length-1]}
  function pickRarity(autoMode=false,qualityBoost=1){
    const baseOdds=autoMode?AUTO_RARITY_ODDS:RARITY_ODDS;
    const odds=overdriveActive()?(()=>{const boosted={...baseOdds};let rarePlus=0;for(let i=2;i<rarityOrder.length;i++){const k=rarityOrder[i];boosted[k]=(baseOdds[k]||0)*5;rarePlus+=boosted[k]}boosted.Uncommon=baseOdds.Uncommon||0;boosted.Common=Math.max(0,1-boosted.Uncommon-rarePlus);return boosted})():baseOdds;
    const roll=()=>{const raw=Math.random();let cumulative=0,chosen='Common',idx=0;for(let i=0;i<rarityOrder.length;i++){const k=rarityOrder[i];cumulative+=odds[k];if(raw<=cumulative){chosen=k;idx=i;break}}let nearMiss=null;const next=rarityOrder[idx+1],gap=cumulative-raw;if(next&&idx+1>=3&&gap>=0&&gap<Math.max(.000025,(odds[next]||0)*.02))nearMiss=next;return {rarity:chosen,nearMiss}};
    let result=roll();const step=state.luckyChain?.active?(state.luckyChain.step||1):0;if(step&&['Common','Uncommon'].includes(result.rarity)&&Math.random()<Math.min(.24,step*.04))result=roll();
    if(qualityBoost>1&&['Common','Uncommon'].includes(result.rarity)&&Math.random()<Math.min(.32,(qualityBoost-1)*.32))result=roll();
    if(Math.random()<packQualityPromoteChance()*(autoMode?.75:1)*qualityBoost){const i=rarityOrder.indexOf(result.rarity);if(i>=0&&i<rarityOrder.length-1){result={rarity:rarityOrder[i+1],nearMiss:null}}}return result
  }
  function weightedCard(theme,mutation,autoMode=false,qualityBoost=1){
    const ghostChance=GHOST_CARD_CHANCE*(autoMode?.75:1)*overdriveBoost(),specialTierRoll=Math.random();
    if(!tutorialTrainingMode&&specialTierRoll<ghostChance){state.quirkStats.ghostCards=(state.quirkStats.ghostCards||0)+1;return {card:GHOST_CARD,nearMiss:null}}
    if(!tutorialTrainingMode&&specialTierRoll<ghostChance+JET_LUMAGUI_CARD_CHANCE){state.quirkStats.jetLumagui=(state.quirkStats.jetLumagui||0)+1;return {card:JET_LUMAGUI_CARD,nearMiss:null}}
    if(Math.random()<SECRET_CHANCE*(autoMode?.75:1)*overdriveBoost())return {card:theme.secretCards[Math.floor(Math.random()*theme.secretCards.length)],nearMiss:null};
    let pick=pickRarity(autoMode,qualityBoost),chosen=pick.rarity,nearMiss=pick.nearMiss;
    if(mutation?.id==='luckypulse'&&chosen==='Common'&&Math.random()<.68){pick=pickRarity(autoMode,qualityBoost);chosen=pick.rarity;nearMiss=pick.nearMiss}
    if(mutation?.id==='voidbloom'&&chosen==='Common')chosen='Uncommon';
    const pool=theme.cards.filter(c=>c.rarity===chosen);return {card:pool[Math.floor(Math.random()*pool.length)],nearMiss}
  }
  function makeSerial(cardId){state.usedSerials[cardId]??=[];const used=new Set(state.usedSerials[cardId]);let n=1+Math.floor(Math.random()*500),tries=0;while(used.has(n)&&tries++<600)n=1+Math.floor(Math.random()*500);state.usedSerials[cardId].push(n);return `#${String(n).padStart(3,'0')} / 500`}
  function rollPackVariantName(autoMode=false,qualityBoost=1){
    const luck=variantLuckMultiplier(),autoPenalty=autoMode?.75:1,raw=Math.random();let cumulative=0,previous=null,previousChance=0;
    for(const k of variantRollOrder){const chance=variantDefs[k].chance*(k==='Foil'?1:luck)*autoPenalty*qualityBoost;const lower=cumulative;cumulative+=chance;if(raw<=cumulative){let nearMiss=null;if(previous&&['Serialized','Prismatic','Gold','Holo'].includes(previous)&&raw-lower<Math.max(.00002,previousChance*.04))nearMiss=previous;return {variant:k,nearMiss};}previous=k;previousChance=chance}
    return {variant:'Normal',nearMiss:null}
  }
  function pullScore(p){return (p.card.secret?1000:p.card.jet?560:rarityOrder.indexOf(p.card.rarity)*100)+effectiveCardValue(p.card,1,p.copy)/1000}
  function packBagTotal(){return themes.reduce((n,t)=>n+(state.packInventory[t.id]||0),0)+(state.specialPackInventory?.length||0)+Object.values(state.premiumPackInventory||{}).reduce((n,v)=>n+(+v||0),0)}
  function premiumVariantName(autoMode=false){const once=()=>{const scale=autoMode?.75:1,r=Math.random();let c=.01*scale;if(r<c)return'Serialized';c+=.10*scale;if(r<c)return'Prismatic';c+=.10*scale;if(r<c)return'Gold';c+=.15*scale;if(r<c)return'Holo';return'Foil'},rank={Foil:0,Holo:1,Gold:2,Prismatic:3,Serialized:4};let best=once();if(overdriveActive())for(let i=1;i<5;i++){const v=once();if(rank[v]>rank[best])best=v}return best}
  function premiumRareCard(theme,autoMode=false){const r=Math.random();let rarity=autoMode?(r<.70?'Rare':r<.88?'Epic':r<.9625?'Legendary':r<.99025?'Mythic':r<.99775?'Divine':'Ultra'):(r<.60?'Rare':r<.84?'Epic':r<.95?'Legendary':r<.987?'Mythic':r<.997?'Divine':'Ultra');const pool=theme.cards.filter(c=>c.rarity===rarity);return (pool.length?pool:theme.cards.filter(c=>rarityOrder.indexOf(c.rarity)>=2))[Math.floor(Math.random()*Math.max(1,(pool.length?pool:theme.cards).length))]||theme.cards[0]}
  function swapPremiumPullCard(p,card){p.card=card;p.newDiscovery=!state.discovered[card.id];if(p.copy.variant==='Serialized')p.copy.serial=makeSerial(card.id)}
  function createPremiumPackPulls(def,theme,autoMode=false){
    const pulls=createPackPulls(theme,null,autoMode);
    if(def.id==='variant'){
      const slots=[1,Math.min(3,pulls.length-1)].filter((x,i,a)=>x>=0&&x<pulls.length&&a.indexOf(x)===i);for(const i of slots){const p=pulls[i],v=premiumVariantName(autoMode);p.copy.variant=v;p.copy.serial=v==='Serialized'?makeSerial(p.card.id):null;if(v==='Holo')maybeApplyCollectorQuirks(p.copy,p.card)}
    }
    if(def.id==='highroller'){for(const p of pulls)if(!p.card.secret&&rarityOrder.indexOf(p.card.rarity)<2)swapPremiumPullCard(p,premiumRareCard(theme,autoMode))}
    if(def.id==='vintage'){for(const p of pulls){p.copy.premiumTrait='Vintage';p.copy.premiumValueMult=1.35;p.copy.source='Vintage Pack'}}
    if(def.id==='secret'){for(const p of pulls)if(!p.card.secret&&Math.random()<.004*(autoMode?.75:1)){const c=theme.secretCards[Math.floor(Math.random()*theme.secretCards.length)];swapPremiumPullCard(p,c)}}
    if(def.id==='graded'){for(const p of pulls){let g=Math.max(Math.round((7+Math.random()*3)*2)/2,rollGrade());if(Math.random()<Math.min(.09,.018*overdriveBoost()))g=10;p.copy.grade=clamp(g,7,10);p.copy.gradedAt=Date.now();p.copy.source='Graded Pack';p.copy.openingPenalty=0;p.copy.openingQuality='Factory slab';if(p.copy.grade===10&&!p.copy.factoryError&&Math.random()<Math.min(.02,.004*overdriveBoost())){p.copy.blackLabel=true;state.quirkStats.blackLabels=(state.quirkStats.blackLabels||0)+1}p.copy.gradeNote=generateGraderNote(p.copy,p.copy.grade)}}
    pulls.sort((a,b)=>pullScore(a)-pullScore(b));return pulls
  }
  function premiumDisplayTheme(def,theme){return {...theme,name:def.name.replace(/ Pack$/,''),emoji:def.emoji,gradient:def.gradient,desc:def.effect}}
  function openPremiumStoredPack(id){if(autoOpenSession)return;const def=premiumPackDefs[id];if(!def||!(state.premiumPackInventory[id]>0)){sfx('error');return}state.premiumPackInventory[id]--;const pool=basePackThemes(),theme=pool[Math.floor(Math.random()*pool.length)],pulls=createPremiumPackPulls(def,theme),display=premiumDisplayTheme(def,theme);state.stats.premiumPacksOpened=(state.stats.premiumPacksOpened||0)+1;sfx('buy');save();openPackAnimation(display,pulls,null);renderHUD();renderPacks()}
  function sellPremiumPack(id){const def=premiumPackDefs[id];if(!def||!(state.premiumPackInventory[id]>0))return;showConfirm('Sell specialty pack?',`Sell <b>1 ${def.name}</b> for <b>${fmt(def.sell)}</b>?`,`Sell Pack`,()=>{state.premiumPackInventory[id]--;earn(def.sell);state.stats.packsSold=(state.stats.packsSold||0)+1;sfx('sell');save();renderHUD();renderPacks();updateBagCounts()},false)}
  function renderPremiumPackBag(){const host=$('#premiumPackBagGrid');if(!host)return;const owned=Object.values(premiumPackDefs).filter(d=>(state.premiumPackInventory[d.id]||0)>0);host.innerHTML=owned.length?`<div class="premium-bag-label">SPECIALTY PACKS</div>`+owned.map(d=>`<article class="pack-card bag-pack"><div class="pack-art" style="background:${d.gradient}"><div class="pack-box" style="background:${d.gradient}"><span class="pack-qty-badge">×${state.premiumPackInventory[d.id]}</span><div>${d.emoji}<br>${d.name.toUpperCase()}<small>SPECIALTY · 5 CARDS</small></div></div></div><div class="pack-info"><h3>${d.name}</h3><p>${d.effect}</p><div class="pack-meta"><span>Random core collection</span></div><div class="pack-open-actions"><button class="pack-buy" data-open-premium="${d.id}">Open Pack</button><button class="pack-auto" data-auto-premium="${d.id}">Auto Open All<small>${(autoRevealMs()/1000).toFixed(2)}s / card</small></button><button class="pack-sell" data-sell-premium="${d.id}">Sell Pack · ${fmt(d.sell)}</button></div></div></article>`).join(''):'';$$('[data-open-premium]').forEach(b=>b.onclick=()=>openPremiumStoredPack(b.dataset.openPremium));$$('[data-auto-premium]').forEach(b=>b.onclick=()=>autoOpenPremiumStoredPack(b.dataset.autoPremium));$$('[data-sell-premium]').forEach(b=>b.onclick=()=>sellPremiumPack(b.dataset.sellPremium))}
  function renderPacks(){
    const normal=themes.filter(t=>(state.packInventory[t.id]||0)>0).map(t=>({kind:'normal',theme:t,count:state.packInventory[t.id]||0}));
    const grouped=new Map();
    for(const sp of (state.specialPackInventory||[])){
      if(!sp||!packMutations[sp.mutation])continue;
      const key=`${sp.themeId}|${sp.mutation}`;
      if(!grouped.has(key))grouped.set(key,{kind:'special',theme:themes.find(t=>t.id===sp.themeId)||themes[0],special:sp,count:0});
      grouped.get(key).count++;
    }
    const owned=[...grouped.values(),...normal];
    const grid=$('#packGrid');if(!grid)return;renderLuckyChainStatus();
    grid.innerHTML=owned.length?owned.map(x=>{const t=x.theme,mutation=x.special?packMutations[x.special.mutation]:null,sell=packSellValue(t,mutation);return `<article class="pack-card bag-pack ${mutation?`special-preview special-${mutation.id}`:''}"><div class="pack-art" style="background:${t.gradient}"><div class="pack-box" style="background:${t.gradient}"><span class="pack-qty-badge">×${x.count}</span><div>${t.emoji}<br>${mutation?mutation.name.toUpperCase():t.name.toUpperCase()}<small>${mutation?'SPECIAL · ':''}5 CARD PACK</small></div></div></div><div class="pack-info"><h3>${mutation?mutation.name+' ':''}${t.name} Pack</h3><p>${mutation?mutation.desc:t.desc}</p><div class="pack-meta"><span>${mutation?'1–3 special cards':'5 cards / pack'}</span></div><div class="pack-open-actions"><button type="button" class="pack-buy" ${x.kind==='special'?`data-open-special="${x.special.uid}"`:`data-open-pack="${t.id}"`} onpointerup="return window.__pfOpenPackButton(this,event)" onclick="return window.__pfOpenPackButton(this,event)">Open Pack</button><button class="pack-auto" ${x.kind==='special'?`data-auto-special="${x.special.uid}"`:`data-auto-pack="${t.id}"`}>Auto Open All<small>${(autoRevealMs()/1000).toFixed(2)}s / card</small></button><button class="pack-sell" ${x.kind==='special'?`data-sell-special="${x.special.uid}"`:`data-sell-pack="${t.id}"`}>Sell Pack · ${fmt(sell)}</button></div></div></article>`}).join(''):'<div class="bag-empty-packs"></div>';
    $$('[data-auto-pack]').forEach(b=>b.onclick=()=>autoOpenStoredPack(b.dataset.autoPack));$$('[data-auto-special]').forEach(b=>b.onclick=()=>autoOpenSpecialStoredPack(b.dataset.autoSpecial));$$('[data-sell-pack]').forEach(b=>b.onclick=()=>confirmSellPack(b.dataset.sellPack,false));$$('[data-sell-special]').forEach(b=>b.onclick=()=>confirmSellPack(b.dataset.sellSpecial,true));renderPremiumPackBag()
  }
  function confirmSellPack(idOrUid,isSpecial=false){
    if(autoOpenSession){toast('Auto Open running','Finish or stop Auto Open before selling packs.');return}
    let t=null,mutation=null,label='',sell=0;
    if(isSpecial){
      const sp=(state.specialPackInventory||[]).find(x=>x.uid===idOrUid);if(!sp)return;
      t=themes.find(x=>x.id===sp.themeId);mutation=packMutations[sp.mutation]||null;if(!t)return;
      label=`${mutation?mutation.name+' ':''}${t.name} Pack`;sell=packSellValue(t,mutation);
    }else{
      t=themes.find(x=>x.id===idOrUid);if(!t||!(state.packInventory[idOrUid]>0))return;
      label=`${t.name} Pack`;sell=packSellValue(t,null);
    }
    showConfirm('Sell this pack?',`Sell <b>1 ${label}</b> for <b>${fmt(sell)}</b>?<br><br>That is 75% of its normal Shop value.`,`Sell Pack`,()=>sellOwnedPack(idOrUid,isSpecial),false)
  }
  function sellOwnedPack(idOrUid,isSpecial=false){
    let t=null,mutation=null,sell=0;
    if(isSpecial){
      const i=(state.specialPackInventory||[]).findIndex(x=>x.uid===idOrUid);if(i<0)return;
      const sp=state.specialPackInventory[i];t=themes.find(x=>x.id===sp.themeId);mutation=packMutations[sp.mutation]||null;if(!t)return;
      state.specialPackInventory.splice(i,1);sell=packSellValue(t,mutation);
    }else{
      t=themes.find(x=>x.id===idOrUid);if(!t||!(state.packInventory[idOrUid]>0))return;
      state.packInventory[idOrUid]--;sell=packSellValue(t,null);
    }
    earn(sell);state.stats.packsSold=(state.stats.packsSold||0)+1;state.stats.cashFromPackSales=(state.stats.cashFromPackSales||0)+sell;
    sfx('sell');toast('Pack sold',`${fmt(sell)} added to your cash.`);save();renderHUD();renderPacks();updateBagCounts();
  }
  function renderLuckyChainStatus(){const el=$('#luckyChainStatus');if(!el)return;const lc=state.luckyChain||{};if(!lc.active){el.className='lucky-chain-status';el.innerHTML='';return}const bonus=Math.min(24,(lc.step||1)*4);el.className='lucky-chain-status active';el.innerHTML=`<div><b>Lucky Pack Chain · Step ${lc.step}</b><small>Rare+ keeps the chain alive. Low-rarity pulls have a ${bonus}% one-time reroll chance.</small></div><span class="chain-badge">LUCK +${bonus}%</span>`}
  function updateLuckyPackChain(pulls){const lc=state.luckyChain||(state.luckyChain={active:false,step:0,longest:0}),rarePlus=pulls.some(p=>p.card.secret||rarityOrder.indexOf(p.card.rarity)>=rarityOrder.indexOf('Rare'));if(lc.active){if(rarePlus){lc.step=Math.min(6,(lc.step||1)+1);lc.longest=Math.max(lc.longest||0,lc.step);state.stats.longestLuckyChain=Math.max(state.stats.longestLuckyChain||0,lc.step);toast('Lucky Chain continues',`Step ${lc.step} · the next pack gets a stronger rarity reroll.`)}else{toast('Lucky Chain ended',`The chain finished at Step ${lc.step}.`);lc.active=false;lc.step=0}}else if(Math.random()<.018){lc.active=true;lc.step=1;lc.longest=Math.max(lc.longest||0,1);state.stats.luckyChainsStarted=(state.stats.luckyChainsStarted||0)+1;toast('LUCKY PACK CHAIN!',`Your next pack starts with a small rarity reroll boost.`)}renderLuckyChainStatus()}
  function createPackPulls(t,mutation,autoMode=false){
    const pulls=[],seen=new Set(Object.keys(state.discovered||{}));state.packsOpened++;state.stats.packOpenedByTheme[t.id]=(state.stats.packOpenedByTheme[t.id]||0)+1;addOverdriveProgress('pack',1);
    const af=state.adminForces||(state.adminForces={godMode:null,bonusNext:false,ghostNext:false,blackLabelNext:false});
    const qualityBoost=1,variantBoost=1;
    let packMode=null;
    const queuedMode=!tutorialTrainingMode&&Array.isArray(state.godPackQueue)&&PF_PACK_MODE_DEFS[state.godPackQueue[0]]?state.godPackQueue[0]:null;
    const forcedMode=queuedMode||(!tutorialTrainingMode&&PF_PACK_MODE_DEFS[af.godMode]?af.godMode:null);
    if(forcedMode){packMode=forcedMode;if(queuedMode)state.godPackQueue.shift();else af.godMode=null}
    else if(!tutorialTrainingMode){
      let r=Math.random(),c=0;
      const ordered=[...Object.entries(GOD_PACK_MODE_CHANCES),...Object.entries(SEMI_GOD_MODE_CHANCES)];
      for(const [mode,p] of ordered){c+=p*overdriveBoost();if(r<c){packMode=mode;break}}
    }
    const packModeDef=pfPackModeMeta(packMode),godPack=packModeDef?.tier==='god',semiGodPack=packModeDef?.tier==='semi';
    if(godPack){state.quirkStats.godPacks=(state.quirkStats.godPacks||0)+1;if(packMode==='archive')state.quirkStats.archiveGodPacks=(state.quirkStats.archiveGodPacks||0)+1}
    if(semiGodPack)state.quirkStats.semiGodPacks=(state.quirkStats.semiGodPacks||0)+1;
    let packSize=packMode==='archive'?t.allCards.length:5,anomaly=null;
    if(!tutorialTrainingMode&&!godPack&&!semiGodPack){
      if(af.bonusNext){packSize=6;anomaly='Bonus Card';af.bonusNext=false;state.quirkStats.packAnomalies=(state.quirkStats.packAnomalies||0)+1}
      else{const ar=Math.random();if(ar<BONUS_CARD_PACK_CHANCE*overdriveBoost()){packSize=6;anomaly='Bonus Card';state.quirkStats.packAnomalies=(state.quirkStats.packAnomalies||0)+1}else if(ar<BONUS_CARD_PACK_CHANCE*overdriveBoost()+SHORT_PACK_CHANCE){packSize=4;anomaly='Short Pack';state.quirkStats.packAnomalies=(state.quirkStats.packAnomalies||0)+1}}
    }
    const forceGhost=!tutorialTrainingMode&&!!af.ghostNext;if(forceGhost)af.ghostNext=false;
    const specialSlots=new Set();if(mutation){const r=Math.random(),specialCount=Math.min(packSize,r<.62?1:r<.90?2:3);while(specialSlots.size<specialCount)specialSlots.add(Math.floor(Math.random()*packSize))}
    const vr=rollPackVariantName(autoMode,variantBoost),packVariant=vr.variant,variantSlot=packVariant==='Normal'?-1:Math.floor(Math.random()*packSize);
    const godRarities=['Epic','Legendary','Mythic','Divine','Ultra'],godWeights=[.45,.30,.16,.07,.02];
    const godFinisherRarities=['Mythic','Divine','Ultra'],godFinisherWeights=[.68,.24,.08];
    const godVariantRarities=['Rare','Epic','Legendary','Mythic','Divine','Ultra'],godVariantWeights=[.46,.28,.14,.075,.035,.01];
    const legendaryFinishRarities=['Legendary','Mythic','Divine','Ultra'],legendaryFinishWeights=[.73,.19,.065,.015];
    const chooseGodCard=(rarities,weights)=>{let r=Math.random(),rar=rarities[0];for(let i=0;i<rarities.length;i++){r-=weights[i];if(r<=0){rar=rarities[i];break}}const pool=t.cards.filter(c=>c.rarity===rar),floor=rarityOrder.indexOf(rarities[0]),fallback=t.cards.filter(c=>rarityOrder.indexOf(c.rarity)>=floor);return (pool.length?pool:fallback)[Math.floor(Math.random()*Math.max(1,(pool.length?pool:fallback).length))]||t.cards[0]};
    const godCard=(finisher=false)=>chooseGodCard(finisher?godFinisherRarities:godRarities,finisher?godFinisherWeights:godWeights);
    const godVariantCard=()=>chooseGodCard(godVariantRarities,godVariantWeights);
    const legendaryFinishCard=()=>chooseGodCard(legendaryFinishRarities,legendaryFinishWeights);
    const guaranteedVariant=()=>{const ids=['Holo','Gold','Prismatic','Serialized'],weights=[.30,.22,.17,.23,.08],sum=weights.reduce((a,b)=>a+b,0);let r=Math.random()*sum;for(let i=0;i<ids.length;i++){r-=weights[i];if(r<=0)return ids[i]}return'Holo'};
    const godSerializedSlot=packMode==='variant'?Math.floor(Math.random()*packSize):-1;
    for(let i=0;i<packSize;i++){
      const cardMutation=specialSlots.has(i)?mutation:null,forceGhostHere=forceGhost&&packMode!=='archive'&&i===packSize-1;
      let rolled;
      if(forceGhostHere)rolled={card:GHOST_CARD,nearMiss:null};
      else if(packMode==='archive')rolled={card:t.allCards[i],nearMiss:null};
      else if(packMode==='rarity')rolled={card:godCard(i===packSize-1),nearMiss:null};
      else if(packMode==='variant'||packMode==='holo'||packMode==='semi_rare')rolled={card:godVariantCard(),nearMiss:null};
      else if(packMode==='secret')rolled={card:t.secretCards[Math.floor(Math.random()*t.secretCards.length)],nearMiss:null};
      else if(packMode==='semi_finish'&&i===packSize-1)rolled={card:legendaryFinishCard(),nearMiss:null};
      else rolled=weightedCard(t,cardMutation,autoMode,qualityBoost);
      const card=rolled.card;if(forceGhostHere)state.quirkStats.ghostCards=(state.quirkStats.ghostCards||0)+1;
      let variant;
      if(packMode==='variant')variant=i===godSerializedSlot?'Serialized':guaranteedVariant();
      else if(packMode==='holo'||packMode==='semi_holo')variant='Holo';
      else if(packMode==='archive')variant='Normal';
      else variant=i===variantSlot?packVariant:'Normal';
      const serial=variant==='Serialized'?makeSerial(card.id):null,copy=makeCopy(variant,cardMutation?.id||null,serial);maybeApplyCollectorQuirks(copy,card);
      const isNew=!seen.has(card.id);seen.add(card.id);pulls.push({card,copy,newDiscovery:isNew,added:false,special:!!cardMutation,nearMiss:rolled.nearMiss||(i===variantSlot?vr.nearMiss:null),godPack:!!godPack,semiGodPack:!!semiGodPack})
    }
    if(forceGhost&&packMode==='archive'){
      const copy=makeCopy('Normal',null,null),isNew=!seen.has(GHOST_CARD.id);seen.add(GHOST_CARD.id);pulls.push({card:GHOST_CARD,copy,newDiscovery:isNew,added:false,special:false,nearMiss:null,godPack:true});state.quirkStats.ghostCards=(state.quirkStats.ghostCards||0)+1
    }
    if(packMode!=='archive')pulls.sort((a,b)=>pullScore(a)-pullScore(b));if(packSize===6&&pulls.length)pulls[pulls.length-1].stuckExtra=true;
    pulls._godPack=!!godPack;pulls._semiGodPack=!!semiGodPack;pulls._godMode=packMode;pulls._packModeDef=packModeDef;pulls._anomaly=anomaly;
    markSaveDirty();updateLuckyPackChain(pulls);return pulls
  }
  let autoOpenSession=null;
  function launchPack(t,mutation,auto=false,autoOptions=null){const pulls=createPackPulls(t,mutation,auto);sfx('buy');save();if(auto)showPulls(t,pulls,mutation,true,autoOptions);else openPackAnimation(t,pulls,mutation);renderHUD();renderPacks()}
  function openStoredPack(id){if(autoOpenSession)return;const t=themes.find(x=>x.id===id);if(!t||!(state.packInventory[id]>0)){sfx('error');return}state.packInventory[id]--;launchPack(t,rollPackMutation(),false)}
  function openSpecialStoredPack(uid){if(autoOpenSession)return;const i=(state.specialPackInventory||[]).findIndex(x=>x.uid===uid);if(i<0){sfx('error');return}const sp=state.specialPackInventory.splice(i,1)[0],t=themes.find(x=>x.id===sp.themeId);if(!t){sfx('error');return}launchPack(t,packMutations[sp.mutation]||Object.values(packMutations)[0],false)}
  /* Open Pack reliability path.
     The normal game function remains the source of truth, but activation no longer depends on a
     temporary rendered node keeping a listener alive. The button calls this stable global bridge
     directly on pointer release, with click/keyboard delegation as fallbacks. */
  let guaranteedOpenLock=false;
  function guaranteedOpenPack(normalId,specialUid,ev){
    if(ev){try{ev.preventDefault()}catch(e){}try{ev.stopPropagation()}catch(e){}}
    const overlay=$('#packOverlay');
    if(overlay&&!overlay.classList.contains('hidden'))return true;
    if(guaranteedOpenLock)return true;
    guaranteedOpenLock=true;
    try{
      if(normalId){
        if(!(state.packInventory[normalId]>0)){sfx('error');return false}
        openStoredPack(normalId);
      }else if(specialUid){
        if(!(state.specialPackInventory||[]).some(x=>x&&x.uid===specialUid)){sfx('error');return false}
        openSpecialStoredPack(specialUid);
      }else return false;
      return !!($('#bigPack')||($('#packOverlay')&&!$('#packOverlay').classList.contains('hidden')));
    }catch(err){console.error('Open Pack failed',err);return false}
    finally{setTimeout(()=>{guaranteedOpenLock=false},0)}
  }
  window.__pfOpenOwnedPackNow=(normalId,specialUid,ev)=>guaranteedOpenPack(normalId,specialUid,ev);
  window.__pfOpenPackButton=(btn,ev)=>btn?guaranteedOpenPack(btn.dataset.openPack,btn.dataset.openSpecial,ev):false;
  function delegatedOpenPackClick(ev){
    const btn=ev.target?.closest?.('#packGrid [data-open-pack],#packGrid [data-open-special]');
    if(!btn)return;
    guaranteedOpenPack(btn.dataset.openPack,btn.dataset.openSpecial,ev);
  }
  /* click covers keyboard activation and is also a final browser-level fallback. */
  window.addEventListener('click',delegatedOpenPackClick,true);
  function finishAutoOpen(message=true){const session=autoOpenSession;if(!session)return;autoOpenSession=null;const ov=$('#packOverlay');ov.classList.add('hidden');ov.classList.remove('auto-opening');ov.innerHTML='';renderAll();if(message)toast('Auto Open finished',`${session.opened} pack${session.opened===1?'':'s'} opened.`)}
  function autoOpenNextPack(){const s=autoOpenSession;if(!s)return;if(s.stop){finishAutoOpen();return}const next=()=>{if(!autoOpenSession)return;if(autoOpenSession.stop){finishAutoOpen();return}setTimeout(autoOpenNextPack,520)};if(s.kind==='premium'){const def=premiumPackDefs[s.premiumId];if(!def||!(state.premiumPackInventory[s.premiumId]>0)){finishAutoOpen();return}state.premiumPackInventory[s.premiumId]--;const pool=basePackThemes(),theme=pool[Math.floor(Math.random()*pool.length)];if(!theme){finishAutoOpen(false);return}const pulls=createPremiumPackPulls(def,theme,true),display=premiumDisplayTheme(def,theme);state.stats.premiumPacksOpened=(state.stats.premiumPacksOpened||0)+1;s.opened++;sfx('buy');save();showPulls(display,pulls,null,true,{packIndex:s.opened,total:s.total,onComplete:next});renderHUD();renderPacks();return}let t=null,mutation=null;if(s.kind==='normal'){if(!(state.packInventory[s.themeId]>0)){finishAutoOpen();return}t=themes.find(x=>x.id===s.themeId);if(!t){finishAutoOpen(false);return}state.packInventory[s.themeId]--;mutation=rollPackMutation()}else{const i=(state.specialPackInventory||[]).findIndex(sp=>sp.themeId===s.themeId&&sp.mutation===s.mutation);if(i<0){finishAutoOpen();return}const sp=state.specialPackInventory.splice(i,1)[0];t=themes.find(x=>x.id===sp.themeId);mutation=packMutations[sp.mutation]||Object.values(packMutations)[0];if(!t){finishAutoOpen(false);return}}s.opened++;save();launchPack(t,mutation,true,{packIndex:s.opened,total:s.total,onComplete:next})}
  function autoOpenStoredPack(id){if(autoOpenSession){toast('Auto Open already running','Finish or stop the current batch first.');return}const t=themes.find(x=>x.id===id),total=state.packInventory[id]||0;if(!t||total<=0){sfx('error');return}autoOpenSession={kind:'normal',themeId:id,total,opened:0,stop:false};autoOpenNextPack()}
  function autoOpenSpecialStoredPack(uid){if(autoOpenSession){toast('Auto Open already running','Finish or stop the current batch first.');return}const target=(state.specialPackInventory||[]).find(x=>x.uid===uid);if(!target){sfx('error');return}const total=(state.specialPackInventory||[]).filter(sp=>sp.themeId===target.themeId&&sp.mutation===target.mutation).length;autoOpenSession={kind:'special',themeId:target.themeId,mutation:target.mutation,total,opened:0,stop:false};autoOpenNextPack()}
  function autoOpenPremiumStoredPack(id){if(autoOpenSession){toast('Auto Open already running','Finish or stop the current batch first.');return}const def=premiumPackDefs[id],total=state.premiumPackInventory[id]||0;if(!def||total<=0){sfx('error');return}autoOpenSession={kind:'premium',premiumId:id,total,opened:0,stop:false};autoOpenNextPack()}
  const PF_ODDS_PAGE_SIZE=40;
  const pfOddsState={tab:'cards',themeId:basePackThemes()[0]?.id||themes[0]?.id||'medieval',page:1};
  function pfOddsPct(p){if(!(p>=0))return'—';const n=p*100;return n>=1?n.toFixed(2)+'%':n>=.01?n.toFixed(4)+'%':n>=.0001?n.toFixed(6)+'%':n.toExponential(2)+'%'}
  function pfOddsOneIn(p){if(!(p>0))return'—';const n=1/p;return `1 in ${Math.max(1,Math.round(n)).toLocaleString()}`}
  function pfOddsPackOneIn(p,n=5){return pfOddsOneIn(1-Math.pow(1-p,n))}
  function pfCardRollChance(card,theme,auto=false){
    const scale=auto?.75:1,ghost=GHOST_CARD_CHANCE*scale,jet=JET_LUMAGUI_CARD_CHANCE,remainingAfterSpecial=Math.max(0,1-ghost-jet),secret=SECRET_CHANCE*scale;
    if(card.jet)return jet;if(card.ghost)return ghost;if(card.secret)return remainingAfterSpecial*secret/Math.max(1,theme.secretCards.length);
    const table=auto?AUTO_RARITY_ODDS:RARITY_ODDS,count=theme.cards.filter(c=>c.rarity===card.rarity).length;return remainingAfterSpecial*(1-secret)*(table[card.rarity]||0)/Math.max(1,count)
  }
  function pfOddsCardEntries(theme){return [...theme.allCards,JET_LUMAGUI_CARD,GHOST_CARD].map(card=>({card,manual:pfCardRollChance(card,theme,false),auto:pfCardRollChance(card,theme,true)}))}
  function pfOddsCardPageHTML(theme){
    const entries=pfOddsCardEntries(theme),pages=Math.max(1,Math.ceil(entries.length/PF_ODDS_PAGE_SIZE));pfOddsState.page=clamp(pfOddsState.page,1,pages);const from=(pfOddsState.page-1)*PF_ODDS_PAGE_SIZE,slice=entries.slice(from,from+PF_ODDS_PAGE_SIZE);
    return `<div class="pf-odds-card-toolbar"><label>Pack / collection<select id="pfOddsThemeSelect">${themes.map(t=>`<option value="${t.id}" ${t.id===theme.id?'selected':''}>${t.emoji} ${t.name}${t.campaignHidden?' · campaign set':''}</option>`).join('')}</select></label><div><b>${entries.length}</b><span>possible listed pulls</span></div><div><b>50</b><span>cards per page max</span></div></div><div class="pf-odds-explain-box">Base manual odds are shown before Better Packs, Lucky Chain or other temporary rarity boosts. Auto Open keeps 75% of Rare+ / Secret / Ghost odds. God and Semi-God pack modes replace these normal card rolls.</div><div class="pf-card-odds-grid">${slice.map(({card,manual,auto})=>`<article class="pf-card-odds-item"><div class="pf-card-odds-preview">${cardHTML(card,0,{variant:'Normal',mutation:null,serial:null,grade:null,locked:false},1)}</div><div class="pf-card-odds-copy"><b>${card.name}</b><span style="--c:${card.ghost?rarityColor.Ghost:card.secret?'#fff':rarityColor[card.rarity]}">${card.ghost?'Ghost':card.secret?'Secret':card.rarity}</span><strong>${pfOddsOneIn(manual)} <small>per card roll</small></strong><em>${pfOddsPackOneIn(manual)} per normal 5-card pack</em><small>Auto: ${pfOddsOneIn(auto)} per card roll</small></div></article>`).join('')}</div><div class="pf-odds-pagination"><button id="pfOddsPrev" ${pfOddsState.page<=1?'disabled':''}>‹</button><span>Page ${pfOddsState.page} / ${pages}</span><button id="pfOddsNext" ${pfOddsState.page>=pages?'disabled':''}>›</button></div>`
  }
  function pfOddsVariantsHTML(){const luck=variantLuckMultiplier(),rows=variantRollOrder.slice().reverse().map(v=>{const manual=variantDefs[v].chance*(v==='Foil'?1:luck),auto=manual*.75;return `<article class="pf-odds-info-card"><i style="--c:${v==='Foil'?'#dcecff':v==='Holo'?'#72e8ff':v==='Gold'?'#ffd65b':v==='Prismatic'?'#ff75db':'#84efff'}"></i><b>${v}</b><strong>${pfOddsOneIn(manual)} packs</strong><span>${pfOddsPct(manual)} manual · ${pfOddsPct(auto)} Auto Open</span><small>Standard variants roll once per normal pack, maximum one standard variant.</small></article>`}).join('');return `<div class="pf-odds-explain-box">These are current standard-variant chances with your permanent variant luck included. Special/God packs can override normal variant rules.</div><div class="pf-odds-info-grid">${rows}</div>`}
  function pfOddsSpecialHTML(){const total=Object.values(packMutations).reduce((n,m)=>n+m.weight,0),base=specialPackChance();return `<div class="pf-odds-explain-box">A normal pack can mutate into a Special Pack. Your current overall mutation chance is <b>${pfOddsPct(base)}</b> (${pfOddsOneIn(base)}). Only 1–3 cards receive the mutation treatment.</div><div class="pf-odds-info-grid">${Object.values(packMutations).map(m=>{const p=base*(m.weight/total);return `<article class="pf-odds-info-card"><i style="--c:#c7a3ff"></i><b>${m.name}</b><strong>${pfOddsOneIn(p)} packs</strong><span>${pfOddsPct(p)}</span><small>${m.desc}</small></article>`}).join('')}</div><h3 class="pf-odds-subhead">Specialty packs sold in the Shop</h3><div class="pf-odds-info-grid">${Object.values(premiumPackDefs).map(d=>`<article class="pf-odds-info-card premium" style="--pp:${d.glow}"><i>${d.emoji}</i><b>${d.name}</b><strong>${fmt(d.cost)}</strong><span>${d.effect}</span><small>Purchased directly; these are not random Special Pack mutations.</small></article>`).join('')}</div>`}
  function pfOddsPackModeFamilyHTML(tier){const defs=Object.entries(PF_PACK_MODE_DEFS).filter(([,d])=>d.tier===tier);const total=defs.reduce((n,[,d])=>n+d.chance,0);return `<div class="pf-odds-explain-box">${tier==='semi'?`Semi-God packs are stronger than a normal pack but below true God Packs. Combined natural chance: <b>${pfOddsOneIn(total)}</b>.`:`True God Packs visibly mutate before you cut the wrapper. Combined natural chance across all God types: <b>${pfOddsOneIn(total)}</b>.`}</div><div class="pf-god-odds-grid">${defs.map(([id,d])=>`<article class="pf-god-odds-card ${tier} mode-${id}"><div class="pf-god-symbol">${d.emoji}</div><small>${tier==='semi'?'SEMI-GOD PACK':'GOD PACK'}</small><b>${d.name}</b><strong>${pfOddsOneIn(d.chance)} packs</strong><span>${pfOddsPct(d.chance)}</span><p>${d.desc}</p>${id==='archive'?'<em>The selected set contains its full 125-card checklist. Archive uses a bulk reveal so weak laptops do not render 125 animated cards at once.</em>':''}</article>`).join('')}</div>`}
  function pfRenderOddsBrowser(){
    const m=$('#oddsModal');if(!m)return;const theme=themes.find(t=>t.id===pfOddsState.themeId)||themes[0],tabs=[['cards','Cards'],['variants','Variants'],['special','Special Packs'],['semi','Semi-God Packs'],['god','God Packs']];let body='';if(pfOddsState.tab==='cards')body=pfOddsCardPageHTML(theme);else if(pfOddsState.tab==='variants')body=pfOddsVariantsHTML();else if(pfOddsState.tab==='special')body=pfOddsSpecialHTML();else if(pfOddsState.tab==='semi')body=pfOddsPackModeFamilyHTML('semi');else body=pfOddsPackModeFamilyHTML('god');
    m.innerHTML=`<div class="modal pf-master-odds-modal fade-in"><div class="pf-master-odds-head"><div><small>PACKFORGE REFERENCE</small><h2>Pack Odds & Pull Chances</h2><p>One centralized reference for cards, variants, special packs, Semi-God packs, and God Packs.</p></div><button class="close-x" id="closeOdds">×</button></div><div class="pf-master-odds-tabs">${tabs.map(([id,label])=>`<button data-pf-odds-tab="${id}" class="${pfOddsState.tab===id?'active':''}">${label}</button>`).join('')}</div><div class="pf-master-odds-body">${body}</div></div>`;
    $('#closeOdds').onclick=()=>m.classList.add('hidden');m.onmousedown=e=>{if(e.target===m)m.classList.add('hidden')};$$('[data-pf-odds-tab]').forEach(b=>b.onclick=()=>{pfOddsState.tab=b.dataset.pfOddsTab;pfOddsState.page=1;pfRenderOddsBrowser()});const sel=$('#pfOddsThemeSelect');if(sel)sel.onchange=()=>{pfOddsState.themeId=sel.value;pfOddsState.page=1;pfRenderOddsBrowser()};if($('#pfOddsPrev'))$('#pfOddsPrev').onclick=()=>{pfOddsState.page--;pfRenderOddsBrowser()};if($('#pfOddsNext'))$('#pfOddsNext').onclick=()=>{pfOddsState.page++;pfRenderOddsBrowser()}
  }
  function showPackOdds(id){if(id&&themes.some(t=>t.id===id))pfOddsState.themeId=id;pfOddsState.page=1;const m=$('#oddsModal');if(!m)return;m.classList.remove('hidden');pfRenderOddsBrowser()}
  function pfInstallCentralOddsButtons(){
    const shop=$('#shopPacksTab');if(shop&&!$('#pfShopOddsButton')){const row=document.createElement('div');row.className='pf-central-odds-launch';row.innerHTML=`<button type="button" id="pfShopOddsButton" class="pf-big-odds-btn">?</button><div><b>Pack Odds & Pull Chances</b><span>Browse every card chance, variant, Special Pack, Semi-God Pack, and God Pack in one place.</span></div>`;shop.insertBefore(row,shop.firstChild);$('#pfShopOddsButton').onclick=()=>showPackOdds(pfOddsState.themeId)}
    const bag=$('#bagPacksTab');if(bag&&!$('#pfBagOddsButton')){const row=document.createElement('div');row.className='pf-central-odds-launch bag';row.innerHTML=`<button type="button" id="pfBagOddsButton" class="pf-big-odds-btn">?</button><div><b>Pack Odds & Pull Chances</b><span>One reference replaces the individual ? buttons on every stored pack.</span></div>`;bag.insertBefore(row,bag.firstChild);$('#pfBagOddsButton').onclick=()=>showPackOdds(pfOddsState.themeId)}
  }
  function addPull(p,theme){
    if(p.added)return;p.added=true;p.copy.obtainedAt=Date.now();addCopy(p.card.id,1,p.copy);state.totalCards++;
    const h=state.history[p.card.id]||(state.history[p.card.id]={firstObtained:p.copy.obtainedAt,totalPulled:0,variants:{},specialPacks:{},highestLevel:1});
    h.firstObtained=h.firstObtained||p.copy.obtainedAt;h.lastObtained=p.copy.obtainedAt;h.totalPulled=(h.totalPulled||0)+1;h.highestLevel=Math.max(h.highestLevel||1,1);h.variants[p.copy.variant]=(h.variants[p.copy.variant]||0)+1;if(p.copy.mutation)h.specialPacks[p.copy.mutation]=(h.specialPacks[p.copy.mutation]||0)+1;
    if(!state.discovered[p.card.id])state.discovered[p.card.id]=p.copy.obtainedAt
  }
  function openingPenaltyFromCut(points,packHeight,seamY){
    if(!points?.length)return {penalty:0,quality:'Clean'};
    const deepest=Math.max(...points.map(p=>p.y));
    const depth=Math.max(0,deepest-seamY);
    const ratio=depth/Math.max(1,packHeight);
    if(ratio<.16)return {penalty:0,quality:'Clean'};
    if(ratio<.26){const pen=Math.round(((ratio-.16)/.10*.5)*10)/10;return {penalty:Math.max(.1,pen),quality:'Rough cut'}}
    if(ratio<.34){const pen=.5+((ratio-.26)/.08*.5);return {penalty:Math.round(pen*10)/10,quality:'Damaged cut'}}
    return {penalty:2,quality:'Severe cut'};
  }
  function applyOpeningQuality(pulls,result){
    const defects=['Edge Ding','Corner Bend','Surface Scratch','Wrapper Crimp'];
    for(const p of pulls){p.copy.openingPenalty=result.penalty||0;p.copy.openingQuality=result.quality||'Clean';if((result.penalty||0)>0&&Math.random()<Math.min(.9,.18+(result.penalty||0)*.32))p.copy.openingDefect=defects[Math.floor(Math.random()*defects.length)]}
  }
  function pfPackModeWrapperMeta(pulls){const def=pfPackModeMeta(pulls?._godMode);if(!def)return null;return {...def,mode:pulls._godMode}}
  function openPackAnimation(theme,pulls,mutation){
    const ov=$('#packOverlay');ov.classList.remove('hidden');const special=mutation?`<span class="mutation-head">${mutation.name}</span>`:'',modeMeta=pfPackModeWrapperMeta(pulls),modeClass=modeMeta?` pf-pack-mode pf-pack-${modeMeta.tier} mode-${modeMeta.mode}`:'';
    const count=pulls.length,small=count===5?'5 TRADING CARDS':`${count} CARD ARCHIVE`;
    ov.innerHTML=`<div class="opening-title"><h2>${theme.name} Pack ${special}</h2><p class="${mutation?'special-pack-callout':''}">${modeMeta?'Something inside this wrapper is changing…':mutation?`SPECIAL PACK · 1–3 cards inside will carry the ${mutation.name} treatment.`:'Start at either edge and cut all the way across the faint line.'}</p></div><div class="rip-stage"><div class="big-pack premium-wrapper sleek-wrapper ${mutation?`special-pack special-${mutation.id}`:''}${modeClass}" id="bigPack" style="background:${theme.gradient};color:white"><div class="pf-pack-mode-field"></div><div class="pf-pack-mode-badge"><small>${modeMeta?.tier==='semi'?'SEMI-GOD PACK':'GOD PACK'}</small><b>${modeMeta?.short||''}</b><span>${modeMeta?.desc||''}</span></div><div class="pack-rip-strip" style="background:${theme.gradient}"></div><div class="rip-line"></div><canvas class="cut-path-canvas" id="cutPathCanvas"></canvas><div class="seam-cursor" id="seamCursor"></div><div class="seam-instruction">${modeMeta?'PACK SIGNATURE DETECTED…':'HOLD + CUT FROM ONE EDGE TO THE OTHER'}</div><div class="pack-logo sleek-pack-logo"><div class="pack-theme-mark">${theme.emoji}</div><b>${theme.name} Pack</b>${mutation?`<span class="sleek-special-name">${mutation.name.toUpperCase()} SPECIAL PACK</span>`:`<span class="sleek-standard-name">PACKFORGE</span>`}<small>${small}</small></div></div></div>`;
    const pack=$('#bigPack'),canvas=$('#cutPathCanvas'),cursor=$('#seamCursor'),instruction=pack.querySelector('.seam-instruction');let modeReady=!modeMeta;
    if(modeMeta){const fast=document.body.classList.contains('quality-performance')||state.settings?.reduceMotion||state.settings?.antiLag==='aggressive',delay=fast?160:620,readyDelay=fast?360:1550;setTimeout(()=>{pack.classList.add('pf-pack-mode-awake');instruction.textContent=`${modeMeta.short} · CUT TO OPEN`;tone(modeMeta.tier==='god'?720:520,.16,'triangle',.025);if(modeMeta.tier==='god')setTimeout(()=>tone(1040,.18,'sine',.018),90)},delay);setTimeout(()=>{modeReady=true},readyDelay)}
    let dragging=false,finished=false,startSide=null,points=[],ctx=null,dpr=1,seamY=68;
    function sizeCanvas(){const r=pack.getBoundingClientRect();dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);canvas.style.width=r.width+'px';canvas.style.height=r.height+'px';ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0)}
    function clearCut(){sizeCanvas();ctx.clearRect(0,0,canvas.width/dpr,canvas.height/dpr)}
    function drawCut(){if(!ctx||points.length<2)return;ctx.clearRect(0,0,canvas.width/dpr,canvas.height/dpr);ctx.lineJoin='round';ctx.lineCap='round';ctx.shadowColor='rgba(255,255,255,.55)';ctx.shadowBlur=7;ctx.strokeStyle='rgba(245,249,255,.92)';ctx.lineWidth=2.25;ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length;i++)ctx.lineTo(points[i].x,points[i].y);ctx.stroke();ctx.shadowBlur=0;ctx.strokeStyle='rgba(18,23,31,.44)';ctx.lineWidth=.8;ctx.stroke()}
    clearCut();
    const reset=()=>{dragging=false;points=[];clearCut();cursor.style.opacity='0';pack.classList.remove('dragging')};
    const finish=()=>{if(finished)return;finished=true;dragging=false;pack.classList.remove('dragging');cursor.style.opacity='0';const r=pack.getBoundingClientRect(),result=openingPenaltyFromCut(points,r.height,seamY);applyOpeningQuality(pulls,result);if(result.penalty>=2)toast('Severe pack cut','You sliced deep into the pack. Cards from this pack can lose up to 2.0 grading points.');else if(result.penalty>=.5)toast('Rough pack cut',`Opening condition may reduce grading by up to ${result.penalty.toFixed(1)}.`);pack.classList.add('ripped');themePackSfx(theme.id);setTimeout(()=>showPulls(theme,pulls,mutation),430)};
    pack.addEventListener('pointerdown',e=>{if(finished)return;if(!modeReady){tone(180,.04,'sine',.008);return}const r=pack.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;seamY=Math.max(55,Math.min(82,r.height*.145));const edge=Math.max(28,r.width*.11);if((x>edge&&x<r.width-edge)||y<28||y>r.height-24){sfx('error');return}startSide=x<=edge?'left':'right';dragging=true;points=[{x,y}];pack.classList.add('dragging');pack.setPointerCapture(e.pointerId);cursor.style.opacity='1';cursor.style.left=x+'px';cursor.style.top=(y-12)+'px';drawCut();e.preventDefault()});
    pack.addEventListener('pointermove',e=>{if(!dragging||finished)return;const r=pack.getBoundingClientRect(),x=clamp(e.clientX-r.left,0,r.width),y=clamp(e.clientY-r.top,0,r.height);const last=points[points.length-1];if(!last||Math.hypot(x-last.x,y-last.y)>2.5)points.push({x,y});cursor.style.left=x+'px';cursor.style.top=(y-12)+'px';drawCut();const reached=startSide==='left'?x>=r.width-8:x<=8;if(reached&&points.length>5)finish();e.preventDefault()});
    const release=()=>{if(!dragging||finished)return;reset()};pack.addEventListener('pointerup',release);pack.addEventListener('pointercancel',release)
  }
  function pullRevealMeta(p){
    const rarity=p.card.secret?'Secret':p.card.rarity,variant=p.copy?.variant||'Normal',mutation=p.copy?.mutation?packMutations[p.copy.mutation]:null;
    const tier=p.card.ghost?'ghost':p.card.secret?'secret':['Epic','Legendary','Mythic','Divine','Ultra'].includes(p.card.rarity)?p.card.rarity.toLowerCase():'';
    const classes=[];if(tier)classes.push(`pull-${tier}`);if(variant!=='Normal')classes.push('has-pull-variant',`pull-variant-${variant.toLowerCase()}`);if(mutation)classes.push('has-pull-special',`pull-special-${mutation.id}`);if(p.nearMiss)classes.push('pull-near-miss');
    const specialColor=mutation?({luckypulse:'#72e4a6',holosurge:'#73dfff',voidbloom:'#9a6cff',prismrift:'#ff75d8'}[mutation.id]||'#8ddcff'):'';
    let label='';if(p.card.ghost)label='UNLISTED CARD';else if(p.card.secret)label='SECRET CARD';else if(tier)label=rarity.toUpperCase()+(variant!=='Normal'?` · ${variant.toUpperCase()}`:mutation?` · ${mutation.name.toUpperCase()}`:'');else if(mutation)label=`${mutation.name.toUpperCase()} SPECIAL`;else if(variant!=='Normal')label=`${variant.toUpperCase()} VARIANT`;
    return {rarity,variant,mutation,tier,classes,specialColor,label}
  }
  function pullRevealClasses(p){return pullRevealMeta(p).classes.join(' ')}
  function triggerPullRevealFx(p,ov,stageFx,burstLabel){
    const m=pullRevealMeta(p),fx=[];if(m.tier)fx.push(`fx-${m.tier}`);if(m.variant!=='Normal')fx.push('fx-variant');if(m.mutation)fx.push('fx-special');if(p.nearMiss){fx.push('fx-near-miss');state.quirkStats.nearMisses=(state.quirkStats.nearMisses||0)+1;tone(1030,.035,'sine',.006)}
    ov.classList.remove('secret-reveal');stageFx.className='pull-stage-fx';burstLabel.className='pull-burst-label';burstLabel.textContent='';stageFx.style.removeProperty('--special-pull');void stageFx.offsetWidth;
    if(fx.length){stageFx.className=`pull-stage-fx ${fx.join(' ')}`;if(m.specialColor)stageFx.style.setProperty('--special-pull',m.specialColor)}if(m.label){burstLabel.textContent=m.label;void burstLabel.offsetWidth;burstLabel.className='pull-burst-label show'}if(m.tier==='secret'||m.tier==='ghost'){ov.classList.add('secret-reveal');setTimeout(()=>ov.classList.remove('secret-reveal'),1900)}
  }
  function pullPreRevealHint(p,isFinal=false){if(p.card.crue)return'A FABLED PRINT IS FORMING…';const m=pullRevealMeta(p);if(p.stuckExtra)return'Two cards are stuck together…';if(p.card.ghost)return'The set number is missing…';if(p.card.secret)return'Something is wrong with this card…';if(m.tier==='ultra')return'The card is shifting through every color…';if(m.tier==='divine')return'The card is radiating…';if(m.mutation)return `${m.mutation.name} energy is building…`;if(m.variant!=='Normal')return `${m.variant} finish detected…`;return isFinal?'Final card…':'Flipping…'}
  function pullPostRevealHint(p,isFinal=false){const m=pullRevealMeta(p);if(p.card.crue)return'CRUE LOWE · THE FABLED FOOL'+(isFinal?' · click when the flash ends':'');if(p.card.ghost)return'UNLISTED PULL'+(isFinal?' · click the card to continue':'');if(p.card.secret)return'SECRET PULL · click the card to continue';if(m.tier)return `${m.rarity.toUpperCase()} PULL${m.variant!=='Normal'?` · ${m.variant.toUpperCase()}`:''}${isFinal?' · click the card to continue':''}`;if(m.mutation)return `${m.mutation.name.toUpperCase()} SPECIAL${isFinal?' · click the card to continue':''}`;if(m.variant!=='Normal')return `${m.variant.toUpperCase()} VARIANT${isFinal?' · click the card to continue':''}`;return isFinal?'Best pull · click the card to continue':p.newDiscovery?'NEW card · click it to send it aside':'Click the card to send it aside'}
  function showArchiveGodPulls(theme,pulls,auto=false,autoOptions=null){
    const ov=$('#packOverlay');ov.classList.remove('hidden');ov.classList.toggle('auto-opening',auto);if(!pulls._archiveAwarded){pulls._archiveAwarded=true;for(const p of pulls)addPull(p,theme);renderHUD();save();confetti(document.body.classList.contains('quality-performance')?24:100);toast('ARCHIVE GOD PACK',`${pulls.length.toLocaleString()} cards added — one of every card in ${theme.name}${pulls.some(p=>p.card.ghost)?' plus the Ghost card':''}.`)}
    const pageSize=20,pages=Math.max(1,Math.ceil(pulls.length/pageSize));let page=1;
    ov.innerHTML=`<div class="pf-archive-god"><div class="pf-archive-god-head"><small>∞ ARCHIVE PULL ∞</small><h2>ARCHIVE GOD PACK</h2><p>One of every card in the ${theme.name} collection has been added to your Bag. The preview is paginated so weak laptops never render the full archive at once.</p></div><div class="pf-archive-summary"><b>${pulls.length.toLocaleString()}</b><span>cards awarded</span></div><div class="pf-archive-grid" id="pfArchiveGrid"></div><div class="pf-archive-controls"><button id="pfArchivePrev">‹</button><span id="pfArchivePage"></span><button id="pfArchiveNext">›</button>${auto?'<button id="pfArchiveClose" class="hidden">Close</button>':'<button id="pfArchiveClose">Send to Bag</button>'}</div></div>`;
    const render=()=>{const from=(page-1)*pageSize,slice=pulls.slice(from,from+pageSize);$('#pfArchiveGrid').innerHTML=slice.map(p=>`<div class="pf-archive-card">${cardHTML(p.card,0,p.copy,1,{newMark:p.newDiscovery})}</div>`).join('');$('#pfArchivePage').textContent=`Page ${page} / ${pages}`;$('#pfArchivePrev').disabled=page<=1;$('#pfArchiveNext').disabled=page>=pages};
    $('#pfArchivePrev').onclick=()=>{page--;render()};$('#pfArchiveNext').onclick=()=>{page++;render()};const finish=()=>{ov.classList.add('hidden');ov.classList.remove('auto-opening');ov.innerHTML='';renderAll();if(autoOptions?.onComplete)autoOptions.onComplete()};$('#pfArchiveClose').onclick=finish;render();if(auto)setTimeout(finish,3000)
  }
  function showPulls(theme,pulls,mutation,auto=false,autoOptions=null){
    if(pulls?._godMode==='archive'&&pulls.length>30){showArchiveGodPulls(theme,pulls,auto,autoOptions);return}
    const ov=$('#packOverlay'),special=mutation?`<span class="mutation-head">${mutation.name}</span>`:'',total=Math.max(1,pulls.length),modeMeta=pfPackModeMeta(pulls?._godMode),modeTag=modeMeta?`<span class="pf-open-mode-tag ${modeMeta.tier}">${modeMeta.emoji} ${modeMeta.short}</span>`:'';ov.classList.remove('hidden');ov.classList.toggle('auto-opening',auto);
    const packProgress=auto&&autoOptions?` · PACK ${autoOptions.packIndex} / ${autoOptions.total}`:'';
    ov.innerHTML=`<div class="opening-title"><h2>${theme.name} Pack ${special} ${modeTag}</h2><p>${auto?`AUTO OPEN ALL${packProgress} · ${(autoRevealMs()/1000).toFixed(2)} seconds per card`:mutation?'Only 1–3 cards in this pack carry the special treatment.':`The best rarity you rolled is waiting at card ${total}.`}</p>${auto?'<button class="auto-stop" id="autoStop">Stop after this pack</button>':''}</div><div class="card-stack-stage"><div class="pull-stage-fx" id="pullStageFx"></div><div class="pull-burst-label" id="pullBurstLabel"></div><div class="reveal-counter" id="revealCounter">CARD 1 / ${total}</div><div class="card-stack" id="cardStack">${pulls.map((p,i)=>{const m=pullRevealMeta(p);return `<div class="stack-card ${pullRevealClasses(p)}${p.card.crue?' crue-pull-card':''}${p.stuckExtra?' stuck-extra-card':''}" data-stack-index="${i}" style="--rarity:${p.card.secret?'#ffffff':rarityColor[p.card.rarity]}${m.specialColor?`;--special-pull:${m.specialColor}`:''}"><div class="flip-shell"><div class="card-back"></div><div class="card-front-wrap">${cardHTML(p.card,0,p.copy,1,{newMark:p.newDiscovery})}</div></div></div>`}).join('')}</div><div class="reveal-hint" id="revealHint">${auto?'AUTO OPENING…':'Revealing card 1…'}</div></div>`;
    if(auto&&$('#autoStop'))$('#autoStop').onclick=()=>{if(autoOpenSession){autoOpenSession.stop=true;$('#autoStop').disabled=true;$('#autoStop').textContent='Stopping after this pack…'}};
    let current=0,revealing=false;const stack=$('#cardStack'),hint=$('#revealHint'),counter=$('#revealCounter'),stageFx=$('#pullStageFx'),burstLabel=$('#pullBurstLabel');const currentEl=()=>stack.querySelector(`[data-stack-index="${current}"]`),isFinal=()=>current===total-1;
    function finishQuirkNotices(){let delay=0,notify=(title,msg)=>{setTimeout(()=>toast(title,msg),delay);delay+=1150};if(pulls._godPack){const d=pfPackModeMeta(pulls._godMode);notify('GOD PACK DISCOVERED',d?`${d.name} · ${d.desc}`:'A God Pack broke the normal rules.')}if(pulls._semiGodPack){const d=pfPackModeMeta(pulls._godMode);notify('SEMI-GOD PACK',d?`${d.name} · ${d.desc}`:'A Semi-God Pack boosted this opening.')}if(pulls._anomaly==='Bonus Card')notify('Factory anomaly','That wrapper contained a sixth card.');if(pulls._anomaly==='Short Pack')notify('Factory anomaly','That wrapper contained only four cards.')}
    function rewardReveal(p){addPull(p,theme);sfx('reveal',p.card.crue?'Legendary':p.card.secret?'Secret':p.card.rarity,p.copy.variant);if(p.card.crue){confetti(120);toast('CRUE LOWE',`The Fabled Fool has appeared. Base odds: 1 in 500,000,000 packs.`)}else if(p.card.wyattEvans){confetti(190);[260,520,780,1040].forEach((f,i)=>tone(f,.16,'triangle',.02,i*.07));toast('✦ WYATT EVANS ✦',`Signature rarity — natural odds: 1 in 1,000,000 packs.`)}else if(p.card.ascendantRarity){confetti(220);document.body.classList.add('secret-flash');setTimeout(()=>document.body.classList.remove('secret-flash'),1500);toast('✦ ASCENDANT ✦',`${p.card.name} — 1 in 20,000,000 card rolls.`)}else if(p.card.godRarity){confetti(175);toast('☀ GOD RARITY ☀',`${p.card.name} — 1 in 2,000,000 card rolls.`)}else if(p.card.jet){confetti(14);toast('JET LUMAGUI',`A smoky one-off rarity appeared. Exact natural odds: 1 in 1,000 card rolls.`)}else if(p.card.ghost){confetti(95);toast('UNLISTED CARD',`${p.card.name} does not appear in the normal collection checklist.`)}else if(p.card.secret){confetti(130);document.body.classList.add('secret-flash');setTimeout(()=>document.body.classList.remove('secret-flash'),1200);toast('SECRET CARD!',`${p.card.name} — one of four hidden Secret cards inside this 125-card set.`)}else if(['Legendary','Mythic','Divine','Ultra'].includes(p.card.rarity)){const n=p.card.rarity==='Ultra'?85:p.card.rarity==='Divine'?58:p.card.rarity==='Mythic'?34:18;confetti(n);if(p.card.rarity==='Ultra')toast('ULTRA PULL!',p.card.name);else if(p.card.rarity==='Divine')toast('DIVINE PULL!',p.card.name)}}
    if(auto){const AUTO_MS=autoRevealMs(),rareHold=p=>{const base=p.card.wyattEvans?2300:p.card.ascendantRarity?2600:p.card.godRarity?1900:p.card.crue?650:p.card.ghost?900:p.card.secret?800:p.card.rarity==='Ultra'?1500:p.card.rarity==='Divine'?1800:p.card.rarity==='Mythic'?1100:p.card.rarity==='Legendary'?650:p.card.rarity==='Epic'?220:0,bonus=p.copy?.mutation?380:(p.copy?.variant&&p.copy.variant!=='Normal'?180:0);return Math.max(base,bonus)};
      function autoStep(){const el=currentEl();if(!el)return;const p=pulls[current],final=isFinal(),peelDelay=p.stuckExtra?650:0;counter.textContent=`CARD ${current+1} / ${total}`;hint.textContent=p.stuckExtra?'Two cards were stuck together…':pullPreRevealHint(p,final);if(p.stuckExtra)el.classList.add('peeling');setTimeout(()=>{el.classList.remove('peeling');triggerPullRevealFx(p,ov,stageFx,burstLabel);el.classList.add('revealed');setTimeout(()=>rewardReveal(p),300);if(!final)setTimeout(()=>el.classList.add(current%2===0?'fling-left':'fling-right'),900)},peelDelay);
        setTimeout(()=>{if(final){el.classList.add('last-card-glow');renderHUD();save();hint.textContent=pullPostRevealHint(p,true).replace(' · click the card to continue','');finishQuirkNotices();setTimeout(()=>{if(autoOptions?.onComplete)autoOptions.onComplete();else{ov.classList.add('hidden');ov.classList.remove('auto-opening');ov.innerHTML='';renderAll()}},500);return}el.remove();current++;autoStep()},peelDelay+AUTO_MS+rareHold(p))}
      setTimeout(autoStep,220);return}
    function revealCurrent(){const el=currentEl();if(!el||revealing)return;const p=pulls[current],final=isFinal();counter.textContent=`CARD ${current+1} / ${total}`;
      if(p.stuckExtra&&!el.dataset.peeled){hint.textContent='Two cards are stuck together · drag sideways to separate them';let sx=null,dragging=false;const down=ev=>{sx=ev.clientX;dragging=true;el.classList.add('peeling');el.setPointerCapture?.(ev.pointerId);ev.preventDefault()},move=ev=>{if(!dragging||sx==null)return;const dx=ev.clientX-sx;el.style.transform=`translateX(${dx*.55}px) rotate(${dx*.025}deg)`;if(Math.abs(dx)>=70){dragging=false;el.dataset.peeled='1';el.classList.remove('peeling');el.style.transform='';el.removeEventListener('pointerdown',down);el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',up);tone(420,.055,'triangle',.018);setTimeout(revealCurrent,70)}ev.preventDefault()},up=()=>{if(!dragging)return;dragging=false;el.classList.remove('peeling');el.style.transform='';};el.addEventListener('pointerdown',down);el.addEventListener('pointermove',move);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);return}
      revealing=true;hint.textContent=pullPreRevealHint(p,final);triggerPullRevealFx(p,ov,stageFx,burstLabel);requestAnimationFrame(()=>el.classList.add('revealed'));setTimeout(()=>rewardReveal(p),250);setTimeout(()=>{revealing=false;if(final){el.classList.add('last-card-glow');hint.textContent=pullPostRevealHint(p,true);renderHUD();save()}else hint.textContent=pullPostRevealHint(p,false)},p.card.wyattEvans?2900:p.card.ascendantRarity?3200:p.card.godRarity?2400:p.card.crue?650:p.card.ghost?900:p.card.secret?800:p.card.rarity==='Ultra'?1250:p.card.rarity==='Divine'?1000:p.card.rarity==='Mythic'?800:p.card.rarity==='Legendary'?620:360)}
    stack.addEventListener('click',e=>{if(revealing)return;const el=e.target.closest('.stack-card');if(!el||+el.dataset.stackIndex!==current||!el.classList.contains('revealed'))return;if(isFinal()){finishQuirkNotices();ov.classList.add('hidden');ov.classList.remove('auto-opening');ov.innerHTML='';renderAll();return}revealing=true;el.classList.add(current%2===0?'fling-left':'fling-right');tone(190,.06,'triangle',.022);tone(310,.07,'sine',.014,.035);setTimeout(()=>{el.remove();current++;revealing=false;revealCurrent()},manualRevealMs())});setTimeout(revealCurrent,90)
  }
  function cardHTML(card,count=0,copy=null,level=1,opts={}){
    copy=copy||{variant:'Normal',mutation:null,serial:null,grade:null,locked:false};const variant=copy?.variant||'Normal',mutation=copy?.mutation?packMutations[copy.mutation]:null,classes=[`variant-${variant.toLowerCase()}`,`rarity-${String(card.rarity).toLowerCase().replace(/\s+/g,'-')}`];if(mutation)classes.push(`mutation-${mutation.id}`);if(card.secret&&!card.ghost)classes.push('secret-card');if(card.ghost)classes.push('ghost-card');if(copy.factoryError)classes.push('factory-error-card');if(copy.holoPattern)classes.push(`holo-pattern-${copy.holoPattern}`);
    const power=effectiveCardPower(card,level,copy),value=sellValue(card,level,copy),combat=combatProfile(card,level,copy),variantTitle=(variant!=='Normal'&&variant!=='Serialized')?`<div class="card-variant-title">${variant.toUpperCase()}</div>`:'',quirkBadge=copy.factoryError?'<div class="card-quirk-badge">ERR</div>':'';
    const face=`<div class="card-face ${classes.join(' ')} ${variant!=='Normal'?'has-variant':''}" style="--rarity:${card.ghost?(rarityColor.Ghost||'#55f7ff'):card.secret?'#fff':rarityColor[card.rarity]}">${card.ghost?'<div class="ghost-aura"></div>':card.secret?'<div class="secret-aura"></div><div class="card-secret-mark">SECRET</div>':''}<div class="mutation-vfx"></div><div class="variant-vfx"></div>${opts.newMark?'<div class="card-new-mark">NEW</div>':''}${quirkBadge}<div class="card-name">${card.name}</div><div class="card-stats"><div class="card-stat"><span>Power</span><b>${power.toLocaleString()}</b></div><div class="card-stat"><span>Value</span><b>${fmt(value)}</b></div><div class="card-stat"><span>Level</span><b>${level}</b></div>${count?`<div class="card-stat card-amount"><span>Amount</span><b>×${count}</b></div>`:''}${copy?.serial?`<div class="card-serial-inline">${String(copy.serial).replace('#','').replace(/\s/g,'')}</div>`:''}</div>${variantTitle}${copy?.gradingUntil?`<div class="grading-status-badge">GRADING</div>`:''}${copy?.premiumTrait?`<div class="premium-trait-badge">${copy.premiumTrait.toUpperCase()}</div>`:''}</div>`;
    if(!copy?.grade)return face;return `<div class="psa-slab${copy.blackLabel?' black-label':''}"><div class="psa-label"><span>${copy.blackLabel?'PACKFORGE PERFECT':'PACKFORGE AUTHENTIC'}</span><strong>${copy.grade.toFixed(1)}</strong><small>${gradeLabel(copy.grade,copy)}</small></div><div class="psa-window">${face}</div></div>`
  }
  function collectionEntries(){const out=[],source=state.inventory?.[GHOST_CARD.id]?[...allCards,GHOST_CARD]:allCards;for(const c of source){const it=state.inventory[c.id];if(!it)continue;for(const [lv,ld] of Object.entries(it.levels||{})){const groups=new Map();for(const cp of ld.copies||[]){const sig=copySignature(cp);if(!groups.has(sig))groups.set(sig,[]);groups.get(sig).push(cp)}for(const [sig,copies] of groups)if(copies.length)out.push({c,level:+lv,copies,rep:copies[0],sig})}}return out}
  function sortEntries(a,b){return Number(!!state.favorites[b.c.id])-Number(!!state.favorites[a.c.id])||sellValue(b.c,b.level,b.rep)-sellValue(a.c,a.level,a.rep)||effectiveCardValue(b.c,b.level,b.rep)-effectiveCardValue(a.c,a.level,a.rep)||Number(b.c.secret)-Number(a.c.secret)||(b.c.crue?1000:b.c.ghost?950:b.c.secret?900:b.c.jet?850:rarityOrder.indexOf(b.c.rarity))-(a.c.crue?1000:a.c.ghost?950:a.c.secret?900:a.c.jet?850:rarityOrder.indexOf(a.c.rarity))||b.level-a.level||(b.rep.grade||0)-(a.rep.grade||0)||a.c.name.localeCompare(b.c.name)}
  function entryKey(e){return `${e.c.id}|${e.level}|${encodeURIComponent(e.sig)}`}
  function parseEntryKey(k){const [id,lv,...rest]=k.split('|');return{id,level:+lv,sig:decodeURIComponent(rest.join('|'))}}
  function findEntry(id,level,sig){return collectionEntries().find(e=>e.c.id===id&&e.level===level&&e.sig===sig)}
  function findCopyByUid(uidValue){
    for(const [cardId,it] of Object.entries(state.inventory||{})){
      for(const [lv,ld] of Object.entries(it?.levels||{})){
        const cp=(ld?.copies||[]).find(x=>x.uid===uidValue);
        if(cp)return {cardId,level:+lv,copy:cp};
      }
    }
    return null;
  }
  function toggleFavorite(id){state.favorites[id]=!state.favorites[id];if(!state.favorites[id])delete state.favorites[id];save();renderCollection()}
  function toggleLockGroup(id,level,sig){const e=findEntry(id,level,sig);if(!e)return false;const anyLocked=e.copies.some(cp=>!!cp.locked);e.copies.forEach(cp=>cp.locked=!anyLocked);save();renderCollection();return !anyLocked}
  function showConfirm(title,copy,confirmLabel,onConfirm,danger=false){
    const m=$('#confirmModal');m.classList.remove('hidden');m.innerHTML=`<div class="modal confirm-mini fade-in"><div class="modal-head"><h3>${title}</h3><button class="close-x" id="confirmClose">×</button></div><div class="modal-body"><div class="confirm-copy">${copy}</div><div class="confirm-actions"><button class="confirm-cancel" id="confirmCancel">Cancel</button><button class="confirm-go ${danger?'danger':''}" id="confirmGo">${confirmLabel}</button></div></div></div>`;
    const close=()=>{m.classList.add('hidden');m.innerHTML=''};$('#confirmClose').onclick=close;$('#confirmCancel').onclick=close;m.onmousedown=e=>{if(e.target===m)close()};$('#confirmGo').onclick=()=>{close();onConfirm()}
  }
  function pfHighValueSell(card){if(!card)return false;if(card.ghost||card.crue||card.jet||card.secret)return true;return ['Divine','Ultra'].includes(card.rarity)}
  function sellOne(id,level,sig){const e=findEntry(id,level,sig);if(!e)return false;if(pfHighValueSell(e.c)){const price=sellValue(e.c,level,e.rep);showConfirm('Sell high-rarity card?',`<b>${e.c.name}</b> is a ${e.c.ghost?'Ghost':e.c.jet?'Jet Lumagui':e.c.crue?'Crue Lowe':e.c.secret?'Secret':e.c.rarity} card.<br><br>Sell one for <b>${fmt(price)}</b>?`,'Sell Card',()=>sellOneNow(id,level,sig),true);return false}return sellOneNow(id,level,sig)}
  function sellCandidates(mode){
    const all=[];for(const [id,it] of Object.entries(state.inventory)){const c=cardMap[id];if(!c)continue;for(const [lv,ld] of Object.entries(it.levels||{}))for(const cp of ld.copies||[])all.push({id,level:+lv,cp,c,value:sellValue(c,+lv,cp),eligible:!cp.locked&&!cp.gradingUntil&&!copyIsCampaignCommitted(cp.uid)&&!copyIsShowcased(cp.uid)})}
    const protectedCopy=x=>pfHighValueSell(x.c)||x.cp?.variant==='Serialized'||!!x.cp?.blackLabel||Number(x.cp?.grade||0)>=10||sellValue(x.c,x.level,x.cp)>=50000;if(mode==='all')return all.filter(x=>x.eligible&&!protectedCopy(x));
    const byCard=new Map();for(const x of all){if(!byCard.has(x.id))byCard.set(x.id,[]);byCard.get(x.id).push(x)}const sell=[];
    for(const arr of byCard.values()){
      const locked=arr.filter(x=>!x.eligible||protectedCopy(x)),eligible=arr.filter(x=>x.eligible&&!protectedCopy(x)).sort((a,b)=>b.value-a.value);
      const keepCount=locked.length?0:1;for(let i=keepCount;i<eligible.length;i++)sell.push(eligible[i])
    }return sell
  }
  function executeBulkSell(mode){const list=sellCandidates(mode);if(!list.length){toast('Nothing to sell',mode==='duplicates'?'You have no unlocked duplicate cards.':'You have no unlocked cards available to sell.');return}let total=0;for(const x of list){const arr=levelCopies(x.id,x.level);if(!arr)continue;const i=arr.findIndex(cp=>cp.uid===x.cp.uid&&!cp.locked&&!cp.gradingUntil&&!copyIsCampaignCommitted(cp.uid));if(i<0)continue;total+=sellValue(x.c,x.level,arr[i]);arr.splice(i,1);if(!arr.length)delete state.inventory[x.id].levels[x.level];if(!Object.keys(state.inventory[x.id].levels||{}).length)delete state.inventory[x.id]}invalidateCollectionValue();markSaveDirty();earn(total);state.stats.cardsSold=(state.stats.cardsSold||0)+list.length;state.stats.cashFromSales=(state.stats.cashFromSales||0)+total;sfx('buy');toast(mode==='duplicates'?'Duplicates sold':'Collection sold',`${list.length.toLocaleString()} cards sold for ${fmt(total)}.`);save();renderHUD();renderCollection()}
  function confirmBulkSell(mode){const list=sellCandidates(mode),total=list.reduce((n,x)=>n+x.value,0);if(!list.length){toast('Nothing to sell',mode==='duplicates'?'You have no unlocked duplicate cards.':'You have no unlocked cards available to sell.');return}const dup=mode==='duplicates';showConfirm(dup?'Sell all duplicates?':'Sell all unlocked cards?',`This will sell <b>${list.length.toLocaleString()} card${list.length===1?'':'s'}</b> for about <b>${fmt(total)}</b>.<br><br>${dup?'One best-value copy of each card is kept. ':''}Locked cards, cards currently being graded, and cards actively committed to a campaign are always protected.`,dup?'Sell Duplicates':'Sell All',()=>executeBulkSell(mode),!dup)}
  function renderCollection(){
    const tf=$('#themeFilter'),prevTheme=tf.value,visibleThemes=themes.filter(themeIsVisible);tf.innerHTML='<option value="all">All collections</option>'+visibleThemes.map(t=>`<option value="${t.id}">${t.name}</option>`).join('');if(['all',...visibleThemes.map(t=>t.id)].includes(prevTheme))tf.value=prevTheme;const theme=tf.value,rar=$('#rarityFilter').value,mode=state.collectionView||'grid';
    $$('#collectionViewSwitch [data-collection-view]').forEach(b=>b.classList.toggle('active',b.dataset.collectionView===mode));
    let entries=collectionEntries().filter(e=>(theme==='all'||e.c.theme===theme)&&(rar==='all'||e.c.rarity===rar)).sort(sortEntries);if(mode==='showcase')entries=entries.filter(e=>state.favorites[e.c.id]);
    const perPage=25,totalPages=Math.max(1,Math.ceil(entries.length/perPage));state.collectionPage=Math.max(1,Math.min(totalPages,Number(state.collectionPage)||1));
    const pageStart=(state.collectionPage-1)*perPage,pageEntries=entries.slice(pageStart,pageStart+perPage);
    const grid=$('#collectionGrid');grid.className='card-grid '+(mode==='compact'?'compact-mode':mode==='showcase'?'showcase-mode':'');
    if(!entries.length){grid.innerHTML=`<div class="empty-collection">${mode==='showcase'?'No favorites in your Showcase yet. Inspect a card and tap Favorite to put it here.':'No cards here yet. Open a themed pack and your pulls will appear here.'}</div>`}
    else if(mode==='compact'){
      grid.innerHTML=pageEntries.map(e=>{const sellable=e.copies.some(cp=>!cp.locked&&!cp.gradingUntil&&!copyIsCampaignCommitted(cp.uid));return `<div class="collect-card compact-card" data-entry="${entryKey(e)}" style="--rarity:${rarityColor[e.c.rarity]}"><div class="compact-rarity"></div><div class="compact-copy"><b>${e.c.name}${e.c.secret?' · SECRET':''}</b><small>${e.c.rarity} · ${e.rep.variant}${e.rep.grade?' · Grade '+e.rep.grade.toFixed(1):''} · Lv ${e.level} · ×${e.copies.length}</small></div><div class="compact-actions"><button class="card-sell" data-sell="${entryKey(e)}" ${sellable?'':'disabled'}>Sell ${fmt(sellValue(e.c,e.level,e.rep))}</button></div></div>`}).join('')
    }else{
      grid.innerHTML=pageEntries.map(e=>{const sellable=e.copies.some(cp=>!cp.locked&&!cp.gradingUntil&&!copyIsCampaignCommitted(cp.uid));return `<div class="collect-card" data-entry="${entryKey(e)}">${cardHTML(e.c,e.copies.length,e.rep,e.level)}<button class="card-sell" data-sell="${entryKey(e)}" ${sellable?'':'disabled'}>Sell one · ${fmt(sellValue(e.c,e.level,e.rep))}</button></div>`}).join('')
    }
    $$('[data-sell]').forEach(b=>b.onclick=ev=>{ev.stopPropagation();const k=parseEntryKey(b.dataset.sell);sellOne(k.id,k.level,k.sig)});
    $$('[data-entry]').forEach(el=>el.onclick=e=>{if(e.target.closest('button'))return;const k=parseEntryKey(el.dataset.entry);showInspect(k.id,k.level,k.sig)});
    const pager=$('#collectionPagination');
    if(pager){
      if(entries.length<=perPage){pager.innerHTML=''}else{
        const cur=state.collectionPage;
        const pages=[];
        for(let i=1;i<=totalPages;i++)if(i===1||i===totalPages||Math.abs(i-cur)<=2)pages.push(i);
        let last=0,html=`<button data-page="${cur-1}" ${cur===1?'disabled':''}>‹</button>`;
        for(const pg of pages){if(last&&pg-last>1)html+=`<span class="collection-page-info">…</span>`;html+=`<button data-page="${pg}" class="${pg===cur?'active':''}">${pg}</button>`;last=pg}
        html+=`<button data-page="${cur+1}" ${cur===totalPages?'disabled':''}>›</button><span class="collection-page-info">Page ${cur} of ${totalPages}</span>`;
        pager.innerHTML=html;
        pager.querySelectorAll('[data-page]').forEach(btn=>btn.onclick=()=>{const pg=Number(btn.dataset.page);if(pg<1||pg>totalPages||pg===state.collectionPage)return;state.collectionPage=pg;renderCollection();$('#view-collection')?.scrollIntoView({behavior:'smooth',block:'start'})});
      }
    }
    $('#collectionSubtitle').textContent=`${uniqueOwnedCount()} unique cards owned · ${discoveredCount()} discovered`;
    const shown=entries.length?`${pageStart+1}–${Math.min(pageStart+perPage,entries.length)} of ${entries.length} shown`:'';
    $('#collectionSummary').textContent=`${totalCardCount().toLocaleString()} cards currently owned · ${completedSets()} complete sets${shown?' · '+shown:''}`
  }
  $('#themeFilter').onchange=()=>{state.collectionPage=1;renderCollection()};$('#rarityFilter').onchange=()=>{state.collectionPage=1;renderCollection()};
  $('#sellDuplicatesBtn').onclick=()=>confirmBulkSell('duplicates');$('#sellAllBtn').onclick=()=>confirmBulkSell('all');
  $$('#collectionViewSwitch [data-collection-view]').forEach(b=>b.onclick=()=>{state.collectionView=b.dataset.collectionView;state.collectionPage=1;save();renderCollection()});
  function inspectBackHTML(copy){
    const back=`<div class="inspect-card-back"><div class="packforge-back-logo"><div class="packforge-back-mark"><b>P<span>F</span></b></div><strong>PACK<span>FORGE</span></strong><small>COLLECT · OPEN · FORGE</small></div></div>`;
    if(!copy?.grade)return back;
    return `<div class="psa-slab"><div class="psa-label"><span>PACKFORGE AUTHENTIC</span><strong>${copy.grade.toFixed(1)}</strong><small>${gradeLabel(copy.grade)}</small></div><div class="psa-window">${back}</div></div>`
  }
  function showInspect(id,level=1,sig){
    processCompletedGradings(false);let e=findEntry(id,level,sig);if(!e)return;const c=e.c,t=themes.find(x=>x.id===c.theme),rep=e.rep,mutation=rep.mutation?packMutations[rep.mutation]:null,h=state.history[id]||{},unlocked=unlockedCopies(e.copies).filter(cp=>!cp.gradingUntil&&!copyIsCampaignCommitted(cp.uid)).length,fav=!!state.favorites[id],anyLocked=e.copies.some(cp=>!!cp.locked),canFuse=!rep.grade&&!rep.gradingUntil&&unlocked>=2,canSell=e.copies.some(cp=>!cp.locked&&!cp.gradingUntil&&!copyIsCampaignCommitted(cp.uid));
    const gradingLine=rep.gradingUntil?`<br>Grading <b>${formatRemaining(rep.gradingUntil-Date.now())} remaining</b>`:'',holo=rep.holoPattern?HOLO_PATTERN_DEFS[rep.holoPattern]:null,err=rep.factoryError?FACTORY_ERROR_DEFS[rep.factoryError]:null,serialInfo=serialSpecialInfo(rep),rareLines=`${holo?`<br>Holo pattern <b>${holo.name}</b>`:''}${err?`<br>Factory error <b>${err.name}</b>`:''}${serialInfo?`<br>Serial trait <b>${serialInfo.name}</b>`:''}${rep.blackLabel?'<br>Slab <b>10.0 PERFECT BLACK LABEL</b>':''}${c.ghost?'<br>Checklist <b>UNLISTED</b>':''}${rep.gradeNote?`<br>Grader note <b>${rep.gradeNote}</b>`:''}`;
    const m=$('#inspectModal');m.classList.remove('hidden');m.innerHTML=`<div class="inspect-scene fade-in"><button class="inspect-close" id="closeInspect">×</button><div class="inspect-layout"><div class="inspect-rotator"><div class="inspect-tilt ${rep.grade?'graded':''} inspect-variant-${String(rep.variant||'Normal').toLowerCase()}" id="inspectTilt">${cardHTML(c,0,rep,level)}</div></div><div class="inspect-copy"><h2>${c.name}</h2><div class="inspect-theme">${c.crue?'1 in 500,000,000 · Fabled Rarity':c.wyattEvans?'1 in 1,000,000 packs · Wyatt Evans Rarity':c.jet?'1 in 1,000 cards · Jet Lumagui Rarity':c.ghost?'Unlisted PackForge Card':`${t?.name||'Unknown'} Collection · ${c.secret?'Hidden Secret':c.rarity}`}</div><div class="float-stat">Power <b>${effectiveCardPower(c,level,rep).toLocaleString()}</b><br>Sell value <b>${fmt(sellValue(c,level,rep))}</b><br>Level <b>${level}</b><br>Owned in this version <b>${e.copies.length}</b><br>Variant <b>${rep.variant}</b>${mutation?`<br>Special pack <b>${mutation.name}</b>`:''}${rep.grade?`<br>Grade <b>${rep.grade.toFixed(1)} · ${gradeLabel(rep.grade,rep)}</b>`:''}${rep.serial?`<br>Serial <b>${rep.serial}</b>`:''}${rareLines}${gradingLine}</div><div class="inspect-flavor">“${c.flavor}”</div><div class="inspect-history"><b>Card history</b><br>First obtained: ${formatDate(h.firstObtained||state.discovered[id])}<br>Last pulled: ${formatDate(h.lastObtained||rep.obtainedAt)}<br>Total copies ever pulled: ${(h.totalPulled||e.copies.length).toLocaleString()}<br>Highest level owned: ${Math.max(h.highestLevel||1,highestLevelOwned(id))}<br>This copy source: ${rep.source||'Pack'}${mutation?` · ${mutation.name} Pack`:''}<br>Pack opening: <b>${rep.openingQuality||'Clean'}</b>${rep.openingDefect?` · ${rep.openingDefect}`:''}${rep.openingPenalty?` · grading risk −${Number(rep.openingPenalty).toFixed(1)}`:''}</div><div class="inspect-actions"><button class="favorite-card" id="favoriteCard">${fav?'★ Favorited':'☆ Favorite'}</button><button class="lock-card" id="lockCard">${anyLocked?'🔒 Unlock stack':'🔓 Lock stack'}</button>${rep.grade?`<button class="break-slab" id="breakSlab" type="button" data-copy-uid="${rep.uid||''}">Break slab · ${fmt(2000)}</button>`:''}<button class="sell-card" id="sellInspectCard" ${canSell?'':'disabled'}>Sell one · ${fmt(sellValue(c,level,rep))}</button><button class="fuse-card" id="fuseCard" ${canFuse?'':'disabled'}>${rep.grade?'Graded cards cannot fuse':rep.gradingUntil?'Card is being graded':`Fuse 2 Level ${level} → Level ${level+1}`}</button></div><div class="inspect-note">Drag the card in any direction to inspect it from steeper angles. You can turn it almost edge-on, but it will never reveal a back. Variant effects stay independent of your movement. Double-click resets the tilt. Locked copies are protected from selling and fusing, but they can still be graded and have grading slabs broken.</div></div></div></div>`;
    $('#closeInspect').onclick=()=>m.classList.add('hidden');m.onmousedown=ev=>{if(ev.target===m)m.classList.add('hidden')};$('#favoriteCard').onclick=()=>{state.favorites[id]=!state.favorites[id];if(!state.favorites[id])delete state.favorites[id];save();renderCollection();showInspect(id,level,sig)};$('#lockCard').onclick=()=>{toggleLockGroup(id,level,sig);showInspect(id,level,sig)};
    if($('#breakSlab')){const breakBtn=$('#breakSlab');breakBtn.onclick=(ev)=>{ev.preventDefault();ev.stopPropagation();const targetUid=breakBtn.dataset.copyUid||rep.uid,current=findCopyByUid(targetUid);if(!current?.copy||Number(current.copy.grade||0)<=0){sfx('error');toast('Could not break slab','That graded copy could not be found. Reopen the card and try again.');return}if(!canAfford(2000)){sfx('error');toast('Not enough cash',`Breaking a slab costs ${fmt(2000)}.`);return}showConfirm('Break grading slab?',`This costs <b>${fmt(2000)}</b>. The grade will be permanently removed from this exact copy so it can be graded again.`,`Break Slab`,()=>{const live=findCopyByUid(targetUid);if(!live?.copy||Number(live.copy.grade||0)<=0){sfx('error');toast('Could not break slab','That graded copy changed before the slab could be opened.');return}if(!spend(2000)){sfx('error');toast('Not enough cash',`Breaking a slab costs ${fmt(2000)}.`);return}live.copy.grade=null;live.copy.gradedAt=null;live.copy.pendingGrade=null;live.copy.pendingBlackLabel=null;live.copy.blackLabel=false;live.copy.gradeNote=null;live.copy.gradingStartedAt=null;live.copy.gradingUntil=null;invalidateCollectionValue();markSaveDirty();state.stats.slabsBroken=(state.stats.slabsBroken||0)+1;sfx('buy');toast('Slab broken',`${c.name} is ungraded again and can be resubmitted.`);save();m.classList.add('hidden');m.innerHTML='';renderHUD();renderCollection();renderGrading()},true)}}
    const pfProtected=()=>c.ghost||c.crue||c.secret||rep.variant==='Serialized'||!!rep.blackLabel||Number(rep.grade||0)>=10||sellValue(c,level,rep)>=50000;
    $('#sellInspectCard').onclick=()=>{const doSell=()=>{if(sellOne(id,level,sig)){m.classList.add('hidden');m.innerHTML=''}};if(pfProtected()){showConfirm('Sell protected card?',`<b>${c.name}</b> has a rare or high-value trait. Sell one copy for <b>${fmt(sellValue(c,level,rep))}</b>?`,'Sell Anyway',doSell,true)}else doSell()};
    $('#fuseCard').onclick=()=>{const doFuse=()=>{const fused=consumeForFuse(id,level,sig);if(!fused)return;sfx('fuse');toast('Card fused',`${c.name}: two Level ${level} copies became one separate Level ${level+1} card. Any remaining Level ${level} copies stay in their own stack.`);renderHUD();renderCollection();save();showInspect(id,level+1,copySignature(fused))};if(pfProtected()){showConfirm('Fuse protected cards?',`This version of <b>${c.name}</b> has a rare trait. Fusing consumes two matching copies permanently.`,'Fuse Anyway',doFuse,true)}else doFuse()};
    const tilt=$('#inspectTilt');let dragging=false,lastX=0,lastY=0,rx=-2,ry=3;const updateInspectTransform=()=>{tilt.style.transform=`rotateX(${rx}deg) rotateY(${ry}deg)`};updateInspectTransform();tilt.addEventListener('pointerdown',ev=>{dragging=true;lastX=ev.clientX;lastY=ev.clientY;tilt.classList.add('dragging');tilt.setPointerCapture(ev.pointerId);ev.preventDefault()});tilt.addEventListener('pointermove',ev=>{if(!dragging)return;const dx=ev.clientX-lastX,dy=ev.clientY-lastY;ry=clamp(ry+dx*.18,-72,72);rx=clamp(rx-dy*.18,-58,58);lastX=ev.clientX;lastY=ev.clientY;updateInspectTransform()});const stop=()=>{dragging=false;tilt.classList.remove('dragging')};tilt.addEventListener('pointerup',stop);tilt.addEventListener('pointercancel',stop);tilt.addEventListener('dblclick',()=>{rx=-2;ry=3;updateInspectTransform()})
  }
const CASINO_TARGET_RTP=.85; // ~15% long-run house edge
function rouletteReturnScale(){return CASINO_TARGET_RTP*casinoPayoutBoost()*37/36}
const rouletteOrder=['0','32','15','19','4','21','2','25','17','34','6','27','13','36','11','30','8','23','10','5','24','16','33','1','20','14','31','9','22','18','29','7','28','12','35','3','26'];
const rouletteRed=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
state.casinoHistory=state.casinoHistory||{};for(const g of ['roulette','coinflip','plinko','crash','slots','mystery'])state.casinoHistory[g]=Array.isArray(state.casinoHistory[g])?state.casinoHistory[g]:[];
let rouletteBets=state.rouletteBets,rouletteSpinning=false,rouletteRotation=0,rouletteBallAngle=-Math.PI/2,rouletteBallTrack=.12,rouletteBuilt=false;
let coinSide='Heads',coinChoice='Heads',coinSpinning=false,slotsSpinning=false;
function casinoRand(){try{if(window.crypto&&crypto.getRandomValues){const u=new Uint32Array(1);crypto.getRandomValues(u);return u[0]/4294967296}}catch(e){}return Math.random()}
function casinoInt(n){return Math.floor(casinoRand()*n)}
function gameStats(name){state.stats.games[name]=state.stats.games[name]||{plays:0,wins:0,losses:0,wagered:0,returned:0,biggestWin:0};return state.stats.games[name]}
function applyLuckyReturn(wager,returned){if(returned<wager&&casinoRand()<lossReturnChance()){const refund=Math.round((wager-returned)*100)/100;if(refund>0)earn(refund);state.stats.luckyReturns=(state.stats.luckyReturns||0)+1;toast('🍀 Lucky Return!',`Your lost ${fmt(refund)} was returned.`);return {returned:wager,refunded:true,refund}}return{returned,refunded:false,refund:0}}
function pfCasinoFloat(net){const host=document.querySelector('#view-casino .mcc-game:not(.hidden) .mcc-panel')||document.querySelector('#view-casino');if(!host||!Number.isFinite(net)||net===0)return;const el=document.createElement('div');el.className='pf-casino-float '+(net>0?'win':'loss');el.textContent=(net>0?'+':'−')+fmt(Math.abs(net));host.appendChild(el);setTimeout(()=>el.remove(),1300)}
function recordGamble(name,wager,returned,quiet=false,deferSave=false){if(!quiet)pfCasinoFloat(returned-wager);const g=gameStats(name);g.plays++;g.wagered+=wager;g.returned+=returned;if(returned>wager){g.wins++;g.biggestWin=Math.max(g.biggestWin||0,returned-wager);state.casino.wins++;state.casino.biggestWin=Math.max(state.casino.biggestWin||0,returned-wager)}else if(returned<wager){g.losses++;state.casino.losses++}if(!deferSave)save()}
function betAmount(id){const n=Number($(id)?.value);return Number.isFinite(n)&&n>=0?Math.max(0,Math.round((n+Number.EPSILON)*100)/100):0}
function setAllBet(id){const el=$(id);if(el)el.value=Math.max(0,Math.floor(state.cash*100)/100).toFixed(2)}
function pushCasinoHistory(game,item,max=12){const a=state.casinoHistory[game]||(state.casinoHistory[game]=[]);a.unshift(item);if(a.length>max)a.length=max}
function historyHTML(game,fn){return (state.casinoHistory[game]||[]).slice(0,10).map(fn).join('')}
function renderCasinoHistories(){
  const r=$('#rouletteHistory');if(r)r.innerHTML=historyHTML('roulette',x=>`<span class="history-chip ${x.color}">${x.n}</span>`);
  const c=$('#coinflipHistory');if(c)c.innerHTML=historyHTML('coinflip',x=>`<span class="history-chip ${x.win?'win':'loss'}">${x.result==='Heads'?'H':'T'}</span>`);
  const p=$('#plinkoHistory');if(p)p.innerHTML=historyHTML('plinko',x=>`<span class="history-chip ${x.mult>=2?'hot':x.mult>=1?'win':'loss'}">${x.mult}×</span>`);
  const cr=$('#crashHistory');if(cr)cr.innerHTML=historyHTML('crash',x=>`<span class="history-chip ${x.mult>=2?'win':x.mult<1.2?'loss':'hot'}">${Number(x.mult).toFixed(2)}×</span>`);
  const sl=$('#slotsHistory');if(sl)sl.innerHTML=historyHTML('slots',x=>`<span class="history-chip ${x.mult>0?'win':'loss'}">${x.mult>0?Number(x.mult).toFixed(2)+'×':'—'}</span>`);;const mh=$('#mysteryHistory');if(mh)mh.innerHTML=(state.casinoHistory.mystery||[]).slice(0,10).map(x=>`<span class="history-chip ${x.mult>=1?'win':'loss'}">${x.mult??0}×</span>`).join('')
}
/* v3.19: removed the obsolete pre-modern casino implementation. */
(function(){
  const $m=id=>document.getElementById(id);
  const roundMoney=v=>Math.round((Number(v)+Number.EPSILON)*100)/100;
  const suffixes=['','k','m','b','t','qa','qi','sx','sp','oc','no','dc'];
  const parseBet=raw=>{let s=String(raw??'').trim().toLowerCase().replace(/,/g,'').replace(/\s+/g,'');const m=s.match(/^([0-9]*\.?[0-9]+)(k|m|b|t|qa|qi|sx|sp|oc|no|dc)?$/i);if(!m)return NaN;const idx=suffixes.indexOf((m[2]||'').toLowerCase());if(idx<0)return NaN;return roundMoney(parseFloat(m[1])*Math.pow(1000,idx))};
  const compact=n=>pfCompactNumber(n,2);
  const alertMsg=(title,msg)=>{try{toast(title,msg)}catch(e){console.warn(title,msg)}};
  const sync=()=>{try{renderHUD();save()}catch(e){}};
  const spendCash=amt=>{amt=roundMoney(amt);if(!Number.isFinite(amt)||amt<0)return false;if(amt===0){sync();return true}if(!spend(amt))return false;sync();return true};
  const payCash=amt=>{amt=roundMoney(amt);if(amt>0)earn(amt);sync()};
  const exactRand=()=>{try{if(window.crypto&&crypto.getRandomValues){const u=new Uint32Array(1);crypto.getRandomValues(u);return u[0]/4294967296}}catch(e){}return Math.random()};
  const pf316Casino=()=>state.pfAdminLab?.casino||{coinWinPct:50,coinPayout:1,minesLuck:0,minesPayout:1,plinkoForcePct:0,plinkoTarget:'1000',plinkoPayout:1,slotsForcePct:0,slotsTarget:'seven',slotsPayout:1,blackjackNaturalPct:0,blackjackPayout:1,rouletteForcePct:0,rouletteNumber:7,roulettePayout:1};
  const pf316Pct=v=>Math.max(0,Math.min(100,Number(v)||0));
  const pf316Scale=(v,fb=1)=>Math.max(.01,Math.min(100,Number.isFinite(Number(v))?Number(v):fb));
  const casinoMeta=()=>{state.mccCasino=state.mccCasino||{};state.mccCasino.plinko=state.mccCasino.plinko||{drops:0,wagered:0,paid:0,best:0,hit1000:0,hit130:0,hit26:0,hit72:0,biggest:0};return state.mccCasino};
  let initialized=false,currentTab='slots';
  function setTab(tab){currentTab=['slots','coin','mines','plinko','blackjack','roulette'].includes(tab)?tab:'slots';document.querySelectorAll('#mccCasinoTabs [data-mcc-tab]').forEach(b=>b.classList.toggle('active',b.dataset.mccTab===currentTab));document.querySelectorAll('#view-casino .mcc-game').forEach(g=>g.classList.add('hidden'));$m('mcc-'+currentTab)?.classList.remove('hidden');if(currentTab==='plinko'){plinkoDraw();plinkoStatsUI()}if(currentTab==='slots'){slotsRender(slotsMatrix);slotsUpdateControls();}if(currentTab==='blackjack')bjRender();if(currentTab==='roulette'){rouletteEnsureTable();rouletteDrawWheel(rouletteWheelRotation);rouletteRenderChips()}}
  window.mccInitCasino=function(){if(!initialized){initialized=true;document.querySelectorAll('#mccCasinoTabs [data-mcc-tab]').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.mccTab)));document.querySelectorAll('#view-casino [data-mcc-all]').forEach(b=>b.addEventListener('click',()=>{const el=$m(b.dataset.mccAll);if(el)el.value=roundMoney(state.cash).toString()}));bindGames()}const cash=$m('casinoCashReadout');if(cash)cash.textContent=fmt(state.cash);setTab(currentTab)};
  let coinBusy=false;
  function coinFlip(){if(coinSpinning)return;const bet=betAmount('#coinBetInput');if(!spend(bet)){sfx('error');toast('Not enough cash',`You need ${fmt(bet)} to flip.`);return}coinSpinning=true;const cfg=pf316Casino(),adminWin=exactRand()<pf316Pct(cfg.coinWinPct)/100,result=adminWin?coinChoice:(coinChoice==='Heads'?'Tails':'Heads'),win=result===coinChoice,ret=win?roundMoney(bet*2*pf316Scale(cfg.coinPayout)):0;const coin=$('#coin');if(coin){coin.classList.remove('show-heads','show-tails');coin.classList.add('flipping');coin.dataset.face='?'}setTimeout(()=>{coinSide=result;if(coin){coin.classList.remove('flipping');coin.classList.add(result==='Heads'?'show-heads':'show-tails');coin.dataset.face=result==='Heads'?'H':'T';coin.setAttribute('aria-label',`Coin showing ${result}`)}if(ret)earn(ret);const out=$('#coinFlipResult');if(out){out.innerHTML=win?`<strong class="pf-coin-win">YOU WON ${fmt(ret-bet)}</strong><span>${result} landed — your ${coinChoice} pick hit.</span>`:`<strong class="pf-coin-loss">YOU LOST ${fmt(bet)}</strong><span>${result} landed — you picked ${coinChoice}.</span>`}pushCasinoHistory('coinflip',{result,win,choice:coinChoice});recordGamble('coinflip',bet,ret);renderHUD();renderCasinoHistories();save();sfx(win?'jackpot':'error');if(win)confetti(12);coinSpinning=false},780)}
  
  let minesActive=false,minesBet=0,minesCount=1,minesSet=new Set(),minesRevealed=new Set(),minesSafe=0,minesMult=1;
  function minesMultiplier(safeClicks,mineCount){const total=25,safeTotal=25-mineCount;let mult=1;for(let i=0;i<safeClicks;i++)mult*=(total-i)/(safeTotal-i);mult=Number.isFinite(mult)&&mult>=1?mult:1;return mult*pf316Scale(pf316Casino().minesPayout)}
  function minesUpdate(){const mult=$m('minesMultiplier'),potential=$m('minesPotential');if(mult)mult.textContent=minesMult.toFixed(2)+'x';if(potential)potential.textContent=fmt(roundMoney(minesBet*minesMult))}
  function minesBuildBoard(armed=false){const grid=$m('minesGrid');if(!grid)return;grid.innerHTML='';const frag=document.createDocumentFragment();for(let i=0;i<25;i++){const tile=document.createElement('button');tile.type='button';tile.className='mines-tile'+(armed?'':' disabled');tile.dataset.idx=i;tile.setAttribute('aria-label',armed?`Hidden Mines tile ${i+1}`:`Mines tile ${i+1}`);tile.disabled=!armed;if(armed)tile.addEventListener('click',()=>minesPick(i,tile),{once:true});frag.appendChild(tile)}grid.appendChild(frag)}
  function minesRevealAll(){document.querySelectorAll('#minesGrid .mines-tile').forEach(tile=>{const i=+tile.dataset.idx;if(minesSet.has(i)){tile.classList.add('revealed-mine');tile.textContent='💣';tile.setAttribute('aria-label','Mine')}tile.classList.add('disabled');tile.disabled=true})}
  function minesEnd(){minesActive=false;const cashout=$m('minesCashoutBtn'),start=$m('minesStartBtn');if(cashout)cashout.disabled=true;if(start)start.disabled=false}
  function minesStart(){if(minesActive)return;const bet=parseBet($m('minesBetInput')?.value),count=parseInt($m('minesCountSelect')?.value||'1',10);if(!(bet>=0))return alertMsg('Invalid Bet','Enter a valid bet of $0.00 or more.');if(!(count>=1&&count<=24))return alertMsg('Invalid Mines','Choose 1 to 24 mines.');if(bet>state.cash)return alertMsg('Not enough cash',`You only have ${fmt(state.cash)}.`);if(!spendCash(bet))return;minesActive=true;minesBet=bet;minesCount=count;minesSet=new Set();minesRevealed=new Set();minesSafe=0;minesMult=1;while(minesSet.size<count)minesSet.add(Math.floor(exactRand()*25));minesBuildBoard(true);const cashout=$m('minesCashoutBtn'),start=$m('minesStartBtn'),status=$m('minesStatus');if(cashout)cashout.disabled=true;if(start)start.disabled=true;if(status)status.textContent=`Game started! Mines: ${count}. Pick a tile.`;minesUpdate()}
  function minesPick(i,tile){if(!minesActive||minesRevealed.has(i))return;const luck=Math.max(-100,Math.min(100,Number(pf316Casino().minesLuck)||0));if(luck>0&&minesSet.has(i)&&exactRand()<luck/100){const pool=[];for(let j=0;j<25;j++)if(j!==i&&!minesSet.has(j)&&!minesRevealed.has(j))pool.push(j);if(pool.length){minesSet.delete(i);minesSet.add(pool[Math.floor(exactRand()*pool.length)])}}else if(luck<0&&!minesSet.has(i)&&exactRand()<Math.abs(luck)/100){const pool=[...minesSet].filter(j=>!minesRevealed.has(j));if(pool.length){minesSet.delete(pool[Math.floor(exactRand()*pool.length)]);minesSet.add(i)}}minesRevealed.add(i);if(minesSet.has(i)){tile.classList.add('revealed-mine');tile.textContent='💣';tile.setAttribute('aria-label','Mine');const status=$m('minesStatus');if(status)status.textContent=`BOOM! You hit a mine and lost ${fmt(minesBet)}.`;minesRevealAll();recordGamble('mines',minesBet,0);minesEnd();sync();return}minesSafe++;tile.classList.add('revealed-safe','disabled');tile.textContent='💎';tile.setAttribute('aria-label','Safe tile');tile.disabled=true;minesMult=minesMultiplier(minesSafe,minesCount);minesUpdate();const cashout=$m('minesCashoutBtn'),status=$m('minesStatus');if(cashout)cashout.disabled=false;const allSafe=minesSafe>=25-minesCount;if(status)status.textContent=allSafe?`All ${minesSafe} safe tiles found — paying out automatically.`:`Safe picks: ${minesSafe} • Mines: ${minesCount} • Cash out anytime.`;try{achMeta().maxMinesSafe=Math.max(achMeta().maxMinesSafe||0,minesSafe);checkAchievements(true)}catch(e){}if(allSafe)minesCashout()}
  function minesCashout(){if(!minesActive||minesSafe<=0)return;const payout=roundMoney(minesBet*minesMult);payCash(payout);const status=$m('minesStatus');if(status)status.textContent=`Cashed out! ${fmt(payout)} returned (x${minesMult.toFixed(2)}).`;minesRevealAll();recordGamble('mines',minesBet,payout);minesEnd();sync()}
  const PLINKO_ROWS=16,PLINKO_SPEED=.45,PLINKO_PEG_R=4,PLINKO_BALL_R=7,PLINKO_MAX_ACTIVE_BALLS=80;
  const PLINKO_MULTIPLIERS=[1000,130,26,7.2,4,2,.2,.2,.409,.2,.2,2,4,7.2,26,130,1000];
  let plinkoAnimReq=null,plinkoBalls=[],plinkoBoardCache=null;
  function plinkoCanvas(){const c=$m('plinkoCanvas');if(!c)return null;const ctx=c.getContext('2d');return ctx?{c,ctx}:null}
  function plinkoBuildBoard(w,h){const centerX=w/2,topY=58,bottomY=h-118,dy=(bottomY-topY)/PLINKO_ROWS,bins=PLINKO_ROWS+1,usableW=w-150,dx=Math.min(36,usableW/bins),leftMostBinX=centerX-(PLINKO_ROWS/2)*dx,pegs=[];for(let r=0;r<PLINKO_ROWS;r++){const count=r+1,y=topY+r*dy;for(let i=0;i<count;i++)pegs.push({x:centerX+(i-(count-1)/2)*dx,y})}const binTopY=h-96,binBottomY=h-20,binCenters=[];for(let k=0;k<bins;k++)binCenters.push({x:leftMostBinX+k*dx,y:binTopY+34});return{w,h,centerX,topY,bottomY,dx,dy,leftMostBinX,pegs,bins,binTopY,binBottomY,binCenters}}
  function plinkoBoard(){const p=plinkoCanvas();if(!p)return null;const{c}=p;if(!plinkoBoardCache||plinkoBoardCache.w!==c.width||plinkoBoardCache.h!==c.height)plinkoBoardCache=plinkoBuildBoard(c.width,c.height);return plinkoBoardCache}
  function plinkoSample(){const cfg=pf316Casino(),force=pf316Pct(cfg.plinkoForcePct)/100;if(force>0&&exactRand()<force){const target=Number(cfg.plinkoTarget),slots=[];PLINKO_MULTIPLIERS.forEach((m,i)=>{if(Math.abs(m-target)<1e-9)slots.push(i)});const slot=slots.length?slots[Math.floor(exactRand()*slots.length)]:0,path=Array(PLINKO_ROWS).fill(0);for(let i=0;i<slot;i++)path[i]=1;for(let i=path.length-1;i>0;i--){const j=Math.floor(exactRand()*(i+1));[path[i],path[j]]=[path[j],path[i]]}return{slot,path}}const path=[];let rights=0;for(let i=0;i<PLINKO_ROWS;i++){const right=exactRand()<.5;path.push(right?1:0);if(right)rights++}return{slot:rights,path}}
  function plinkoFrames(board,path){const frames=[{x:board.centerX,y:board.topY-28}];let rights=0;for(let r=1;r<=PLINKO_ROWS;r++){if(path[r-1]===1)rights++;frames.push({x:board.centerX+(2*rights-r)*(board.dx/2),y:board.topY+r*board.dy})}frames.push({x:board.binCenters[rights]?.x??board.centerX,y:board.binTopY+22});return{frames,slot:rights}}
  function plinkoStatsUI(){}
  function plinkoSettle(bet,slot){const baseMult=PLINKO_MULTIPLIERS[slot]||0,mult=baseMult*pf316Scale(pf316Casino().plinkoPayout),win=roundMoney(bet*mult),s=casinoMeta().plinko;if(win>0)payCash(win);s.paid=roundMoney((s.paid||0)+win);s.best=Math.max(s.best||0,mult);s.biggest=Math.max(s.biggest||0,win);if(baseMult===1000)s.hit1000=(s.hit1000||0)+1;if(baseMult===130)s.hit130=(s.hit130||0)+1;if(baseMult===26)s.hit26=(s.hit26||0)+1;if(baseMult===7.2)s.hit72=(s.hit72||0)+1;$m('plinkoResult').textContent=`×${Number(mult.toFixed(2))} — payout ${fmt(win)} · net ${win-bet>=0?'+':'-'}${fmt(Math.abs(win-bet))}`;recordGamble('plinko',bet,win);try{achMeta().maxPlinko=Math.max(achMeta().maxPlinko||0,mult);checkAchievements(true)}catch(e){}plinkoStatsUI();sync()}
  function plinkoDraw(){
    const p=plinkoCanvas(),board=plinkoBoard();if(!p||!board)return;const{c,ctx}=p;
    ctx.clearRect(0,0,c.width,c.height);
    const bg=ctx.createLinearGradient(0,0,0,c.height);bg.addColorStop(0,'#101a26');bg.addColorStop(.72,'#0b121b');bg.addColorStop(1,'#080d13');ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height);
    const halo=ctx.createRadialGradient(board.centerX,c.height*.30,0,board.centerX,c.height*.35,c.width*.56);halo.addColorStop(0,'rgba(109,205,235,.075)');halo.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=halo;ctx.fillRect(0,0,c.width,c.height);
    ctx.save();ctx.strokeStyle='rgba(143,171,196,.12)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(board.leftMostBinX-board.dx*.7,board.binTopY-8);ctx.lineTo(board.leftMostBinX-board.dx*.7,board.binBottomY+2);ctx.moveTo(board.binCenters[board.bins-1].x+board.dx*.7,board.binTopY-8);ctx.lineTo(board.binCenters[board.bins-1].x+board.dx*.7,board.binBottomY+2);ctx.stroke();ctx.restore();
    for(const q of board.pegs){ctx.save();ctx.shadowColor='rgba(180,220,240,.18)';ctx.shadowBlur=4;ctx.fillStyle='rgba(218,231,242,.82)';ctx.beginPath();ctx.arc(q.x,q.y,Math.max(2.15,PLINKO_PEG_R*.82),0,Math.PI*2);ctx.fill();ctx.restore()}
    const top=board.binTopY+7,h=Math.max(35,Math.min(44,board.binBottomY-board.binTopY-12));
    ctx.textAlign='center';ctx.textBaseline='middle';
    for(let k=0;k<board.bins;k++){
      const x=board.binCenters[k].x,m=PLINKO_MULTIPLIERS[k],bw=Math.max(22,board.dx-4),rx=x-bw/2,ry=top,r=6;
      const hot=m>=26,mid=m>=2;
      ctx.beginPath();ctx.roundRect?ctx.roundRect(rx,ry,bw,h,r):(ctx.rect(rx,ry,bw,h));
      const g=ctx.createLinearGradient(0,ry,0,ry+h);g.addColorStop(0,hot?'rgba(75,60,24,.94)':mid?'rgba(27,39,51,.98)':'rgba(15,24,34,.98)');g.addColorStop(1,'rgba(5,10,15,.98)');ctx.fillStyle=g;ctx.fill();
      ctx.strokeStyle=hot?'rgba(255,216,107,.33)':'rgba(157,180,200,.18)';ctx.lineWidth=1;ctx.stroke();
      ctx.fillStyle=hot?'#ffe08a':mid?'#eef5fb':'#aab6c2';ctx.font=`900 ${m>=100?8:m>=10?9:10}px system-ui`;ctx.fillText('×'+m,x,ry+h*.52);
      if(k<board.bins-1){ctx.strokeStyle='rgba(180,198,215,.12)';ctx.beginPath();ctx.moveTo(x+board.dx/2,board.binTopY-4);ctx.lineTo(x+board.dx/2,board.binTopY+5);ctx.stroke()}
    }
    for(const b of plinkoBalls){ctx.save();ctx.shadowColor='rgba(255,210,82,.45)';ctx.shadowBlur=8;const g=ctx.createRadialGradient(b.x-2,b.y-2,1,b.x,b.y,PLINKO_BALL_R);g.addColorStop(0,'#fff3b0');g.addColorStop(.42,'#f0c653');g.addColorStop(1,'#9f6d19');ctx.fillStyle=g;ctx.beginPath();ctx.arc(b.x,b.y,PLINKO_BALL_R,0,Math.PI*2);ctx.fill();ctx.restore()}
  }
  function plinkoStep(dt){const board=plinkoBoard();if(!board)return;for(let i=plinkoBalls.length-1;i>=0;i--){const b=plinkoBalls[i];b.t+=dt;while(b.t>=b.segDur&&b.k<b.frames.length-1){b.t-=b.segDur;b.k++;if(b.k>=PLINKO_ROWS)b.segDur=.085/PLINKO_SPEED}if(b.k>=b.frames.length-1){plinkoSettle(b.bet,b.slot);plinkoBalls.splice(i,1);continue}const a=b.frames[b.k],c=b.frames[b.k+1],t=Math.max(0,Math.min(1,b.t/b.segDur)),ease=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2,bob=Math.sin(t*Math.PI)*3.2;b.x=a.x+(c.x-a.x)*ease;b.y=a.y+(c.y-a.y)*ease-bob}}
  function plinkoStartAnim(){if(plinkoAnimReq)return;let last=performance.now();const tick=now=>{const dt=Math.min(.05,(now-last)/1000);last=now;plinkoStep(dt);plinkoDraw();if(plinkoBalls.length)plinkoAnimReq=requestAnimationFrame(tick);else{plinkoAnimReq=null;plinkoDraw()}};plinkoAnimReq=requestAnimationFrame(tick)}
  function plinkoDrop(){const bet=parseBet($m('plinkoBetInput')?.value);if(!(bet>=0)){$m('plinkoResult').textContent='Enter a valid bet.';return}if(bet>state.cash){$m('plinkoResult').textContent='Not enough cash.';return}if(!spendCash(bet))return;const s=casinoMeta().plinko;s.drops=(s.drops||0)+1;s.wagered=roundMoney((s.wagered||0)+bet);plinkoStatsUI();const board=plinkoBoard(),sample=plinkoSample();if(!board||plinkoBalls.length>=PLINKO_MAX_ACTIVE_BALLS){plinkoSettle(bet,sample.slot);return}const built=plinkoFrames(board,sample.path),ball={bet,frames:built.frames,slot:built.slot,k:0,t:0,segDur:.055/PLINKO_SPEED,x:built.frames[0].x,y:built.frames[0].y};plinkoBalls.push(ball);plinkoDraw();plinkoStartAnim();sync()}

  /* PackForge Classic Slots — 5 reels, 3 rows, 9 paylines, Wilds, scatters, free spins, and sequential reel stops. */
  const MCC_SLOT_SYMBOLS=[
    {id:'cherry',label:'🍒',w:30.36},{id:'lemon',label:'🍋',w:22},{id:'bell',label:'🔔',w:17},{id:'bar',label:'BAR',w:13},
    {id:'diamond',label:'◆',w:9},{id:'seven',label:'7',w:6},{id:'wild',label:'PF',w:1.13},{id:'scatter',label:'📦',w:1.51}
  ];
  const MCC_SLOT_PAY={
    cherry:{3:6,4:15,5:36},lemon:{3:8,4:18,5:46},bell:{3:12,4:30,5:76},bar:{3:18,4:60,5:184},
    diamond:{3:30,4:122,5:366},seven:{3:76,4:305,5:1525},wild:{3:153,4:610,5:3050}
  };
  const MCC_SLOT_LINES=[
    [0,0,0,0,0],[1,1,1,1,1],[2,2,2,2,2],
    [0,1,2,1,0],[2,1,0,1,2],[0,0,1,2,2],[2,2,1,0,0],[1,0,0,0,1],[1,2,2,2,1]
  ];
  function slotsPick(){let r=exactRand()*100;for(const x of MCC_SLOT_SYMBOLS){r-=x.w;if(r<0)return x}return MCC_SLOT_SYMBOLS[0]}
  function slotsMakeMatrix(){const cfg=pf316Casino(),force=pf316Pct(cfg.slotsForcePct)/100;if(force>0&&exactRand()<force){const sym=MCC_SLOT_SYMBOLS.find(s=>s.id===cfg.slotsTarget)||MCC_SLOT_SYMBOLS.find(s=>s.id==='seven')||MCC_SLOT_SYMBOLS[0];if(sym.id==='scatter'){const m=Array.from({length:5},()=>Array.from({length:3},()=>slotsPick()));for(let r=0;r<5;r++)m[r][1]=sym;return m}return Array.from({length:5},()=>Array.from({length:3},(_,row)=>row===1?sym:slotsPick()))}return Array.from({length:5},()=>Array.from({length:3},()=>slotsPick()))}
  let slotsMatrix=slotsMakeMatrix(),slotsBusy=false,slotsFree=0,slotsLastBet=5,slotsAuto=false,slotsAutoTimer=0,slotsAutoSaveCounter=0;
  function slotsMeta(){const m=casinoMeta();m.slots=m.slots||{spins:0,freeSpinsWon:0,jackpots:0,bestMult:0,biggestWin:0};return m.slots}
  function slotsEvalLine(matrix,line){
    const seq=line.map((row,reel)=>matrix[reel][row]);if(!seq.length||seq[0].id==='scatter')return null;
    let base=null;for(const sym of seq){if(sym.id==='scatter')break;if(sym.id!=='wild'){base=sym.id;break}}if(!base)base='wild';
    let count=0;for(const sym of seq){if(sym.id==='scatter')break;if(sym.id===base||sym.id==='wild')count++;else break}
    const mult=MCC_SLOT_PAY[base]?.[count]||0;return mult?{base,count,mult}:null
  }
  function slotsEvaluate(matrix,totalBet){
    const lineBet=totalBet/MCC_SLOT_LINES.length,wins=[],winCells=new Set();let returned=0,lineMultTotal=0;
    MCC_SLOT_LINES.forEach((line,li)=>{const ev=slotsEvalLine(matrix,line);if(!ev)return;const pay=lineBet*ev.mult;returned+=pay;lineMultTotal+=pay/totalBet;wins.push({...ev,line:li,pay});for(let reel=0;reel<ev.count;reel++)winCells.add(`${reel}:${line[reel]}`)});
    const scatterCells=[];for(let reel=0;reel<5;reel++)for(let row=0;row<3;row++)if(matrix[reel][row].id==='scatter')scatterCells.push(`${reel}:${row}`);
    const sc=scatterCells.length;let scatterMult=0,freeAward=0;if(sc>=5){scatterMult=25;freeAward=15}else if(sc===4){scatterMult=8;freeAward=10}else if(sc===3){scatterMult=2;freeAward=6}
    if(scatterMult){returned+=totalBet*scatterMult;scatterCells.forEach(x=>winCells.add(x))}
    returned*=pf316Scale(pf316Casino().slotsPayout);
    const totalMult=totalBet>0?returned/totalBet:0;
    return{returned:roundMoney(returned),totalMult,lineMultTotal,wins,winCells,scatterCount:sc,scatterMult,freeAward}
  }
  function slotsRender(matrix=slotsMatrix,winCells=new Set(),spinningReels=new Set(),stoppedReel=-1){
    const host=$m('slotsReels');if(!host)return;
    host.innerHTML=matrix.map((reel,ri)=>`<div class="pf-slot-reel ${spinningReels.has(ri)?'spinning':''} ${ri===stoppedReel?'stopped':''}">${reel.map((sym,row)=>`<div class="pf-slot-cell sym-${sym.id} ${winCells.has(`${ri}:${row}`)?'win':''}" data-slot-cell="${ri}:${row}">${sym.label}</div>`).join('')}</div>`).join('');
    const m=slotsMeta();if($m('slotsFreeReadout'))$m('slotsFreeReadout').textContent=`FREE SPINS: ${slotsFree}`;if($m('slotsSessionSpins'))$m('slotsSessionSpins').textContent=(m.spins||0).toLocaleString();if($m('slotsSessionFree'))$m('slotsSessionFree').textContent=(m.freeSpinsWon||0).toLocaleString();if($m('slotsSessionJackpots'))$m('slotsSessionJackpots').textContent=(m.jackpots||0).toLocaleString();if($m('slotsBestWin'))$m('slotsBestWin').textContent=(m.bestMult||0).toFixed((m.bestMult||0)>=100?0:2)+'×';
  }
  function slotsSetResult(title,copy='',big=false){const el=$m('slotsResult');if(!el)return;el.classList.toggle('big-win',!!big);el.innerHTML=`<strong>${title}</strong><span>${copy}</span>`}
  function slotsUpdateControls(){const lever=$m('slotsSpinBtn')||$m('slotsLever'),auto=$m('slotsAutoBtn');if(lever){lever.disabled=slotsBusy&&!slotsAuto;lever.classList.toggle('busy',slotsBusy)}if(auto){auto.textContent=slotsAuto?'STOP AUTO':'AUTO';auto.classList.toggle('active',slotsAuto)}if($m('slotsFeatureReadout'))$m('slotsFeatureReadout').textContent=slotsAuto?(slotsBusy?'AUTO · SPINNING':'AUTO · READY'):slotsFree>0?'FREE SPINS ACTIVE':slotsBusy?'SPINNING…':'READY';if($m('slotsBetReadout'))$m('slotsBetReadout').textContent=fmt(slotsLastBet)}
  function slotsHasAnticipation(matrix){for(const line of MCC_SLOT_LINES){const a=matrix[0][line[0]].id,b=matrix[1][line[1]].id;if((a==='seven'||a==='wild')&&(b===a||b==='wild'||a==='wild'&&b==='seven'))return true}return false}
  function slotsFinish(finalMatrix,usingFree,bet,anticipation,quiet=false,autoSpin=false){
    slotsMatrix=finalMatrix;const ev=slotsEvaluate(finalMatrix,slotsLastBet);let returned=ev.returned;if(returned>0){if(autoSpin)earn(returned);else payCash(returned)}const wagerForStats=usingFree?0:slotsLastBet;recordGamble('slots',wagerForStats,returned,quiet,autoSpin);const meta=slotsMeta();meta.bestMult=Math.max(meta.bestMult||0,ev.totalMult||0);meta.biggestWin=Math.max(meta.biggestWin||0,returned||0);
    if(ev.freeAward&&!tutorialTrainingMode){slotsFree+=ev.freeAward;meta.freeSpinsWon=(meta.freeSpinsWon||0)+ev.freeAward}const jackpot=ev.wins.some(w=>(w.base==='seven'||w.base==='wild')&&w.count===5);if(jackpot)meta.jackpots=(meta.jackpots||0)+1;
    if(!quiet){slotsRender(finalMatrix,ev.winCells,new Set());if($m('slotsLastWin'))$m('slotsLastWin').textContent=fmt(returned);if(ev.freeAward&&!tutorialTrainingMode){slotsSetResult('PACK SCATTER BONUS!',`${ev.scatterCount} Pack scatters paid ${ev.scatterMult}× and awarded ${ev.freeAward} free spins.`,true);try{sfx('jackpot')}catch(e){}confetti(32)}else if(jackpot){slotsSetResult('JACKPOT!',`${ev.totalMult.toFixed(2)}× total return · ${fmt(returned)} paid`,true);try{sfx('jackpot')}catch(e){}confetti(48)}else if(ev.totalMult>=10){slotsSetResult('BIG WIN!',`${ev.wins.length} winning line${ev.wins.length===1?'':'s'} · ${ev.totalMult.toFixed(2)}× · ${fmt(returned)} paid`,true);[430,610,850].forEach((f,i)=>{try{tone(f,.13,'triangle',.018,i*.055)}catch(e){}});confetti(18)}else if(returned>0){slotsSetResult('WIN',`${ev.wins.length} winning line${ev.wins.length===1?'':'s'} · ${ev.totalMult.toFixed(2)}× · ${fmt(returned)} paid`);try{tone(560,.10,'sine',.014)}catch(e){}}else{slotsSetResult(anticipation?'SO CLOSE':'NO WIN',anticipation?'The last reels just missed a high-symbol line.':`No payline connected. ${usingFree?'Free spin used.':fmt(slotsLastBet)+' wagered.'}`);try{tone(anticipation?185:125,.10,'sine',.009)}catch(e){}}if(jackpot||ev.totalMult>=10)$m('mcc-slots')?.classList.add('slot-celebrate');setTimeout(()=>$m('mcc-slots')?.classList.remove('slot-celebrate'),900)}
    slotsBusy=false;slotsUpdateControls();if(autoSpin){slotsAutoSaveCounter++;renderHUD();if(slotsAutoSaveCounter%5===0)save();if(slotsAuto)slotsScheduleAuto(quiet?650:220)}else sync();try{checkAchievements(true)}catch(e){}
  }
  function slotsSpin(fromAuto=false){
    if(slotsBusy)return;const usingFree=slotsFree>0;let bet=usingFree?slotsLastBet:parseBet($m('slotsBetInput')?.value);if(!(bet>=0)){slotsSetResult('INVALID BET','Type a valid total bet or press ALL.');if(fromAuto)slotsStopAuto('AUTO STOPPED · INVALID BET');return}if(!usingFree&&bet>state.cash){slotsUpdateControls();slotsSetResult('NOT ENOUGH CASH',`You only have ${fmt(state.cash)}.`);if(fromAuto)slotsStopAuto('AUTO STOPPED · OUT OF CASH');return}if(!usingFree){if(fromAuto){if(!spend(bet)){slotsStopAuto('AUTO STOPPED · OUT OF CASH');return}}else if(!spendCash(bet))return}
    slotsLastBet=roundMoney(bet);if(usingFree)slotsFree--;const meta=slotsMeta();meta.spins=(meta.spins||0)+1;slotsBusy=true;slotsUpdateControls();const visible=currentTab==='slots'&&!document.getElementById('view-casino')?.classList.contains('hidden')&&!document.hidden;if(visible)slotsSetResult(usingFree?'FREE SPIN':'SPINNING…',usingFree?'Bonus spin — no cash deducted.':fromAuto?'Auto spin · intentionally 50% slower.':'The reels are moving.');
    const finalMatrix=slotsMakeMatrix(),anticipation=slotsHasAnticipation(finalMatrix);if(fromAuto&&!visible){setTimeout(()=>slotsFinish(finalMatrix,usingFree,bet,anticipation,true,true),165);return}
    const baseStops=anticipation?[700,890,1080,1390,1740]:[610,760,910,1060,1210],speed=fromAuto?1.5:1,stops=baseStops.map(ms=>Math.round(ms*speed));slotsRender(finalMatrix,new Set(),new Set([0,1,2,3,4]));const reels=[...document.querySelectorAll('#slotsReels .pf-slot-reel')];reels.forEach((r,i)=>{r.classList.add('spinning');r.style.setProperty('--pf-reel-delay',`${i*19}ms`)});stops.forEach((ms,i)=>setTimeout(()=>{const r=reels[i];if(!r)return;r.classList.remove('spinning');r.classList.add('stopped');try{tone(210+i*38,.035,'triangle',.006)}catch(e){}if(anticipation&&i>=2&&i<4&&$m('slotsFeatureReadout'))$m('slotsFeatureReadout').textContent='ANTICIPATION…'},ms));setTimeout(()=>slotsFinish(finalMatrix,usingFree,bet,anticipation,false,fromAuto),stops[4]+130)
  }
  function slotsScheduleAuto(delay=220){clearTimeout(slotsAutoTimer);if(!slotsAuto)return;slotsAutoTimer=setTimeout(()=>{if(!slotsAuto)return;if(slotsBusy){slotsScheduleAuto(120);return}slotsSpin(true)},delay)}
  function slotsStopAuto(copy='AUTO STOPPED'){slotsAuto=false;clearTimeout(slotsAutoTimer);slotsAutoTimer=0;slotsUpdateControls();renderHUD();save();if(copy&&currentTab==='slots')slotsSetResult(copy,'Press AUTO to start again.')}
  function slotsToggleAuto(){if(slotsAuto){slotsStopAuto();return}const bet=parseBet($m('slotsBetInput')?.value);if(!(bet>0)&&slotsFree<=0){slotsSetResult('SET A BET','Auto needs a positive typed bet, or an active free spin.');return}if(slotsFree<=0&&bet>state.cash){slotsSetResult('NOT ENOUGH CASH',`You only have ${fmt(state.cash)}.`);return}slotsAuto=true;slotsAutoSaveCounter=0;slotsLastBet=slotsFree>0?slotsLastBet:roundMoney(bet);slotsUpdateControls();slotsSetResult('AUTO STARTED','Slots will keep spinning until you press STOP AUTO, even if you visit another PackForge page.');slotsScheduleAuto(160)}
  function slotsBindLever(){const lever=$m('slotsLever');if(!lever||lever.dataset.bound)return;lever.dataset.bound='1';let y0=0,pull=0,drag=false,suppress=false;const set=v=>{pull=Math.max(0,Math.min(1,v));lever.style.setProperty('--pull',pull.toFixed(3))};const fire=()=>{if(window.__pfCasinoBridge?.slotsBusy())return;lever.classList.add('firing');set(1);setTimeout(()=>{lever.classList.remove('firing');set(0);slotsSpin(false)},245)};lever.addEventListener('pointerdown',e=>{if(window.__pfCasinoBridge?.slotsBusy())return;drag=true;y0=e.clientY;set(0);lever.classList.add('grabbing');lever.setPointerCapture?.(e.pointerId);e.preventDefault()});lever.addEventListener('pointermove',e=>{if(!drag)return;set((e.clientY-y0)/78);e.preventDefault()});const end=e=>{if(!drag)return;drag=false;lever.classList.remove('grabbing');const shouldFire=pull>.58;suppress=shouldFire;if(shouldFire){lever.classList.add('firing');set(1);setTimeout(()=>{lever.classList.remove('firing');set(0);slotsSpin(false)},245)}else set(0);e?.preventDefault?.()};lever.addEventListener('pointerup',end);lever.addEventListener('pointercancel',end);lever.addEventListener('click',()=>{if(suppress){suppress=false;return}fire()});$m('slotsAutoBtn')?.addEventListener('click',slotsToggleAuto)}
  let bjDeck=[],bjPlayer=[],bjDealer=[],bjBet=0,bjInRound=false,bjHide=true,bjCanDouble=false,bjAnimating=false,bjRigQueue=[];
  const suits=['♠','♥','♦','♣'],ranks=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  function bjShuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}function bjBuild(){bjDeck=bjShuffle(suits.flatMap(s=>ranks.map(r=>({r,s}))))}function bjDraw(){if(bjRigQueue.length)return bjRigQueue.shift();if(bjDeck.length<15)bjBuild();return bjDeck.pop()}function bjVal(c){if(c.r==='A')return 11;if(['K','Q','J'].includes(c.r))return 10;return +c.r}function bjTotal(hand){let total=0,aces=0;for(const c of hand){total+=bjVal(c);if(c.r==='A')aces++}while(total>21&&aces){total-=10;aces--}return total}
  function bjCardEl(card,back=false){const el=document.createElement('div');if(back){el.className='bj-card back';const d=document.createElement('div');d.className='bj-card-back-design';el.appendChild(d);return el}const face=['J','Q','K'].includes(card.r);el.className=`bj-card ${['♥','♦'].includes(card.s)?'red':'black'}${face?' face-card':''}`;const corner=pos=>{const c=document.createElement('div');c.className='corner '+pos;c.innerHTML=`<span class="rank">${card.r}</span><span class="suit">${card.s}</span>`;return c};const pip=document.createElement('div');pip.className='pip';pip.innerHTML=face?`<span class="face-rank">${card.r}</span><span class="face-suit">${card.s}</span>`:card.s;el.append(corner('top'),pip,corner('bottom'));return el}
  function bjRender(){const ph=$m('bjPlayerHand'),dh=$m('bjDealerHand');if(ph){ph.innerHTML='';bjPlayer.forEach(c=>ph.appendChild(bjCardEl(c)))}if(dh){dh.innerHTML='';bjDealer.forEach((c,i)=>dh.appendChild(bjCardEl(c,bjHide&&i===1)))}if($m('bjPlayerTotal'))$m('bjPlayerTotal').textContent='Total: '+bjTotal(bjPlayer);if($m('bjDealerTotal'))$m('bjDealerTotal').textContent=bjHide&&bjDealer.length>=2?'Total: ?':'Total: '+bjTotal(bjDealer);if($m('bjDealBtn'))$m('bjDealBtn').disabled=bjInRound||bjAnimating;if($m('bjHitBtn'))$m('bjHitBtn').disabled=!(bjInRound&&!bjAnimating);if($m('bjStandBtn'))$m('bjStandBtn').disabled=!(bjInRound&&!bjAnimating);if($m('bjDoubleBtn'))$m('bjDoubleBtn').disabled=!(bjInRound&&bjCanDouble&&!bjAnimating)}function bjStatus(s){if($m('bjStatus'))$m('bjStatus').textContent=s||''}
  function bjFinish(returned,label){returned=roundMoney(returned);const scale=pf316Scale(pf316Casino().blackjackPayout);if(returned>bjBet&&scale!==1)returned=roundMoney(bjBet+(returned-bjBet)*scale);if(returned>0)payCash(returned);recordGamble('blackjack',bjBet,returned);bjInRound=false;bjHide=false;bjCanDouble=false;bjStatus(label);bjRender();sync()}
  function bjDealerPlay(done){bjHide=false;bjAnimating=true;bjRender();const step=()=>{if(bjTotal(bjDealer)<17){bjDealer.push(bjDraw());bjRender();setTimeout(step,260)}else{bjAnimating=false;bjRender();done()}};setTimeout(step,260)}
  function bjResolve(){const p=bjTotal(bjPlayer),d=bjTotal(bjDealer);if(p>21)return bjFinish(0,'LOSE (bust)');if(d>21)return bjFinish(bjBet*2,'WIN (dealer bust)');if(p>d)return bjFinish(bjBet*2,'WIN');if(p<d)return bjFinish(0,'LOSE');return bjFinish(bjBet,'PUSH')}
  function bjDeal(){if(bjInRound||bjAnimating)return;const bet=parseBet($m('bjBetInput')?.value);if(!(bet>=0))return alertMsg('Invalid Bet','Enter a valid bet of $0.00 or more.');if(bet>state.cash)return alertMsg('Not enough cash',`You only have ${fmt(state.cash)}.`);if(!spendCash(bet))return;bjRigQueue=[];if(exactRand()<pf316Pct(pf316Casino().blackjackNaturalPct)/100)bjRigQueue=[{r:'A',s:'♠'},{r:'9',s:'♣'},{r:'K',s:'♠'},{r:'7',s:'♦'}];bjBet=bet;bjInRound=true;bjHide=true;bjCanDouble=false;bjAnimating=true;bjPlayer=[];bjDealer=[];bjStatus('Dealing...');bjRender();const seq=['P','D','P','D'];let i=0;const step=()=>{(seq[i]==='P'?bjPlayer:bjDealer).push(bjDraw());bjRender();i++;if(i<4)return setTimeout(step,220);bjAnimating=false;bjCanDouble=bjPlayer.length===2&&state.cash>=bjBet;const p=bjTotal(bjPlayer),d=bjTotal(bjDealer);if(p===21||d===21){bjHide=false;if(p===21&&d!==21){try{achMeta().blackjackNaturals=(achMeta().blackjackNaturals||0)+1;checkAchievements(true)}catch(e){}return bjFinish(bjBet*2.5,'BLACKJACK! WIN (3:2)')}if(p===21&&d===21)return bjFinish(bjBet,'PUSH (both blackjack)');return bjFinish(0,'LOSE (dealer blackjack)')}bjStatus('Your move...');bjRender()};setTimeout(step,220)}
  function bjHit(){if(!bjInRound||bjAnimating)return;bjPlayer.push(bjDraw());bjCanDouble=false;if(bjTotal(bjPlayer)>21){bjHide=false;return bjFinish(0,'BUST! LOSE')}bjRender()}function bjStand(){if(!bjInRound||bjAnimating)return;bjDealerPlay(bjResolve)}function bjDouble(){if(!bjInRound||bjAnimating||!bjCanDouble)return;if(state.cash<bjBet)return alertMsg('Not enough cash',`You need ${fmt(bjBet)} more to double.`);if(!spendCash(bjBet))return;bjBet=roundMoney(bjBet*2);bjCanDouble=false;bjPlayer.push(bjDraw());bjRender();if(bjTotal(bjPlayer)>21){bjHide=false;return bjFinish(0,'BUST! LOSE (double)')}bjDealerPlay(bjResolve)}
  const ROULETTE_WHEEL_ORDER=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
  const ROULETTE_RED=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);let rouletteBets={},rouletteSpinning=false,rouletteWheelRotation=0,rouletteBallAngle=-Math.PI/2,rouletteBallRadius=.62,rouletteCtx=null;
  const rouletteTotal=()=>Object.values(rouletteBets).reduce((s,v)=>s+v,0);function roulettePayout(k,n){if(k==='n'+n)return 35;if(k==='red')return ROULETTE_RED.has(n)?1:0;if(k==='black')return n!==0&&!ROULETTE_RED.has(n)?1:0;if(k==='even')return n!==0&&n%2===0?1:0;if(k==='odd')return n%2===1?1:0;if(k==='low')return n>=1&&n<=18?1:0;if(k==='high')return n>=19&&n<=36?1:0;if(k==='d1')return n>=1&&n<=12?2:0;if(k==='d2')return n>=13&&n<=24?2:0;if(k==='d3')return n>=25&&n<=36?2:0;if(k==='c1')return n%3===1?2:0;if(k==='c2')return n%3===2?2:0;if(k==='c3')return n%3===0?2:0;return 0}
  function rouletteEnsureTable(){const grid=$m('rouletteNums');if(!grid||grid.dataset.built)return;grid.dataset.built='1';[[3,6,9,12,15,18,21,24,27,30,33,36],[2,5,8,11,14,17,20,23,26,29,32,35],[1,4,7,10,13,16,19,22,25,28,31,34]].forEach(row=>{const r=document.createElement('div');r.className='roulette-num-row';row.forEach(n=>{const c=document.createElement('div');c.className='roulette-num-cell '+(ROULETTE_RED.has(n)?'red':'black');c.dataset.bet='n'+n;c.textContent=n;c.title=`Bet on ${n} (pays 35:1)`;r.appendChild(c)});grid.appendChild(r)})}
  function rouletteLabel(k){if(k.startsWith('n'))return 'Number '+k.slice(1);return{red:'Red',black:'Black',even:'Even',odd:'Odd',low:'1-18',high:'19-36',d1:'1st 12',d2:'2nd 12',d3:'3rd 12',c1:'Column 1',c2:'Column 2',c3:'Column 3'}[k]||k}
  function rouletteRenderChips(){document.querySelectorAll('#rouletteTable [data-bet]').forEach(el=>{const k=el.dataset.bet,a=rouletteBets[k];let chip=el.querySelector('.roulette-chip');if(a!==undefined){if(!chip){chip=document.createElement('div');chip.className='roulette-chip';el.appendChild(chip)}chip.textContent=compact(a);el.classList.add('has-bet')}else{chip?.remove();el.classList.remove('has-bet')}});const keys=Object.keys(rouletteBets),d=$m('rouletteBetsDisplay');if(d)d.textContent=keys.length?`${keys.length} bet${keys.length>1?'s':''}: ${keys.slice(0,6).map(k=>`${rouletteLabel(k)} ${compact(rouletteBets[k])}`).join(' · ')}${keys.length>6?' …':''} — total ${fmt(rouletteTotal())}`:'Click the table to place chips.'}
  function roulettePlace(k){if(rouletteSpinning)return;const chip=parseBet($m('rouletteBetInput')?.value);if(!(chip>=0))return $m('rouletteResult').textContent='Set a chip value first.';const next=roundMoney((rouletteBets[k]||0)+chip);if(next>state.cash)return $m('rouletteResult').textContent='Not enough cash for that chip.';rouletteBets[k]=next;rouletteRenderChips();$m('rouletteResult').textContent=`${fmt(rouletteTotal())} on the table`}
  function rouletteClear(){if(rouletteSpinning)return;rouletteBets={};rouletteRenderChips();$m('rouletteResult').textContent=''}
  function rouletteDrawWheel(rotation){
    const canvas=$m('rouletteWheel');if(!canvas)return;const ctx=rouletteCtx||(rouletteCtx=canvas.getContext('2d')),w=canvas.width,h=canvas.height,cx=w/2,cy=h/2,R=Math.min(w,h)/2-11,n=ROULETTE_WHEEL_ORDER.length,TAU=Math.PI*2;
    ctx.clearRect(0,0,w,h);ctx.save();ctx.translate(cx,cy);
    ctx.beginPath();ctx.arc(0,0,R,0,TAU);ctx.fillStyle='#070a0d';ctx.fill();ctx.lineWidth=8;ctx.strokeStyle='#2d2416';ctx.stroke();ctx.beginPath();ctx.arc(0,0,R-5,0,TAU);ctx.lineWidth=2;ctx.strokeStyle='#b99655';ctx.stroke();
    ctx.rotate(rotation);
    const outer=R-9,inner=R*.38;
    for(let i=0;i<n;i++){
      const num=ROULETTE_WHEEL_ORDER[i],a0=i/n*TAU-Math.PI/2,a1=(i+1)/n*TAU-Math.PI/2,mid=(a0+a1)/2;
      const base=num===0?'#16824c':ROULETTE_RED.has(num)?'#c92e2e':'#171a1e';
      ctx.beginPath();ctx.arc(0,0,outer,a0,a1);ctx.arc(0,0,inner,a1,a0,true);ctx.closePath();ctx.fillStyle=base;ctx.fill();
      ctx.strokeStyle='#080a0c';ctx.lineWidth=2.4;ctx.stroke();
      ctx.strokeStyle='rgba(238,220,177,.28)';ctx.lineWidth=.7;ctx.stroke();
      ctx.save();ctx.rotate(mid);ctx.translate(outer*.77,0);ctx.rotate(Math.PI/2);ctx.fillStyle='#f7f1e4';ctx.shadowColor='rgba(0,0,0,.8)';ctx.shadowBlur=2;ctx.font='900 13px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(num),0,0);ctx.restore();
    }
    ctx.beginPath();ctx.arc(0,0,inner,0,TAU);ctx.fillStyle='#0c1014';ctx.fill();ctx.lineWidth=5;ctx.strokeStyle='#7d6333';ctx.stroke();
    ctx.beginPath();ctx.arc(0,0,R*.285,0,TAU);const dish=ctx.createRadialGradient(-R*.07,-R*.08,5,0,0,R*.30);dish.addColorStop(0,'#e2bf70');dish.addColorStop(.30,'#a77d34');dish.addColorStop(.72,'#55360f');dish.addColorStop(1,'#201508');ctx.fillStyle=dish;ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#d0a752';ctx.stroke();
    ctx.beginPath();ctx.arc(0,0,R*.11,0,TAU);ctx.fillStyle='#b88b3a';ctx.fill();ctx.beginPath();ctx.arc(-R*.025,-R*.025,R*.036,0,TAU);ctx.fillStyle='rgba(255,236,172,.55)';ctx.fill();
    ctx.restore();
    const bx=cx+Math.cos(rouletteBallAngle)*R*rouletteBallRadius,by=cy+Math.sin(rouletteBallAngle)*R*rouletteBallRadius,br=7.2;ctx.save();ctx.shadowColor='rgba(255,255,255,.42)';ctx.shadowBlur=7;ctx.beginPath();ctx.arc(bx,by,br,0,TAU);const ball=ctx.createRadialGradient(bx-2.5,by-2.5,.5,bx,by,br);ball.addColorStop(0,'#fff');ball.addColorStop(.5,'#e7e8e9');ball.addColorStop(1,'#73777d');ctx.fillStyle=ball;ctx.fill();ctx.restore();
  }
  function rouletteAnimate(win,done){
    const idx=ROULETTE_WHEEL_ORDER.indexOf(win),n=ROULETTE_WHEEL_ORDER.length,TAU=Math.PI*2,current=((rouletteWheelRotation%TAU)+TAU)%TAU,desired=TAU-(idx+.5)/n*TAU;let target=desired;while(target<current+TAU*7)target+=TAU;
    const start=rouletteWheelRotation,duration=document.body.classList.contains('pf-low-spec')?4550:5250,t0=performance.now(),ballStart=rouletteBallAngle,ballEnd=-Math.PI/2,ballRevs=document.body.classList.contains('pf-low-spec')?8:11;
    const step=now=>{const t=Math.min(1,(now-t0)/duration),wheelEase=1-Math.pow(1-t,4),ballEase=1-Math.pow(1-t,2.45);rouletteWheelRotation=start+(target-start)*wheelEase;rouletteBallAngle=ballStart+(ballEnd-ballStart-TAU*ballRevs)*ballEase;const drop=t<.58?0:(t-.58)/.42;rouletteBallRadius=.92-(.30*Math.min(1,drop));if(t>.72&&t<.98)rouletteBallAngle+=Math.sin(t*82)*(1-t)*.035;rouletteDrawWheel(rouletteWheelRotation);if(t<1)requestAnimationFrame(step);else{rouletteBallRadius=.62;rouletteBallAngle=ballEnd;rouletteDrawWheel(rouletteWheelRotation);done()}};requestAnimationFrame(step)
  }
  function rouletteResolve(n,total){let winnings=0,best=0,winners=[],scale=pf316Scale(pf316Casino().roulettePayout);for(const[k,a]of Object.entries(rouletteBets)){const mult=roulettePayout(k,n);if(mult>0){winnings=roundMoney(winnings+a*(mult+1)*scale);winners.push(k);best=Math.max(best,mult)}}if(winnings>0)payCash(winnings);document.querySelectorAll('#rouletteTable [data-bet]').forEach(el=>{if(winners.includes(el.dataset.bet))el.classList.add('winning')});const net=roundMoney(winnings-total),color=n===0?'GREEN':ROULETTE_RED.has(n)?'RED':'BLACK';$m('rouletteResult').textContent=`🎡 ${n} (${color}) — ${net>0?`WIN ${fmt(winnings)} (+${fmt(net)})`:net<0?`LOSS -${fmt(-net)}`:'PUSH'}`;recordGamble('roulette',total,winnings);rouletteBets={};rouletteSpinning=false;$m('rouletteSpinBtn').disabled=false;setTimeout(()=>document.querySelectorAll('#rouletteTable .winning').forEach(x=>x.classList.remove('winning')),2200);rouletteRenderChips();sync()}
  function rouletteSpin(){if(rouletteSpinning)return;const total=rouletteTotal();if(!Object.keys(rouletteBets).length)return $m('rouletteResult').textContent='Place chips on the table first.';if(total>state.cash)return $m('rouletteResult').textContent='Not enough cash for your bets.';if(!spendCash(total))return;const cfg=pf316Casino(),n=exactRand()<pf316Pct(cfg.rouletteForcePct)/100?Math.max(0,Math.min(36,Math.round(Number(cfg.rouletteNumber)||0))):Math.floor(exactRand()*37);rouletteSpinning=true;$m('rouletteSpinBtn').disabled=true;$m('rouletteResult').textContent='Spinning…';rouletteAnimate(n,()=>rouletteResolve(n,total))}

  const PF321_WHEEL_SEGMENTS=[...Array(15).fill(0),...Array(8).fill(.5),...Array(7).fill(1),...Array(4).fill(1.5),...Array(5).fill(2),5];
  const PF321_WHEEL_COLORS={0:'#241f24',.5:'#36414d',1:'#216449',1.5:'#2b6e82',2:'#5c3f86',5:'#c28a24'};
  let moneyWheelRotation=0,moneyWheelBusy=false,moneyWheelBuilt=false;
  function moneyWheelMeta(){const m=casinoMeta();m.moneywheel=m.moneywheel||{spins:0,wagered:0,paid:0,best:0,jackpots:0};return m.moneywheel}
  function moneyWheelMount(){const wheel=$m('moneyWheel');if(!wheel||moneyWheelBuilt)return;moneyWheelBuilt=true;const step=360/PF321_WHEEL_SEGMENTS.length,parts=[];PF321_WHEEL_SEGMENTS.forEach((mult,i)=>{const a0=i*step,a1=(i+1)*step,c=PF321_WHEEL_COLORS[mult]||'#333';parts.push(`${c} ${a0}deg ${a1}deg`);const label=document.createElement('i');label.className=`pf321-wheel-label m${String(mult).replace('.','_')}`;label.style.setProperty('--a',`${(i+.5)*step}deg`);label.textContent=mult===0?'BUST':`${mult}×`;wheel.appendChild(label)});wheel.style.backgroundImage=`repeating-conic-gradient(from -4.5deg,rgba(255,255,255,.72) 0deg .46deg,transparent .46deg 9deg),conic-gradient(from -4.5deg,${parts.join(',')})`;wheel.style.transform=`rotate(${moneyWheelRotation}deg)`}
  function moneyWheelPickIndex(){const cfg=pf316Casino(),force=pf316Pct(cfg.moneyWheelForcePct)/100,target=Number(cfg.moneyWheelTarget);if(force>0&&exactRand()<force){const hits=[];PF321_WHEEL_SEGMENTS.forEach((v,i)=>{if(Math.abs(v-target)<.001)hits.push(i)});if(hits.length)return hits[Math.floor(exactRand()*hits.length)]}return Math.floor(exactRand()*PF321_WHEEL_SEGMENTS.length)}
  function moneyWheelSpin(){if(moneyWheelBusy)return;moneyWheelMount();const bet=parseBet($m('moneyWheelBetInput')?.value);if(!(bet>0))return $m('moneyWheelResult').textContent='Type a positive bet or press ALL.';if(bet>state.cash)return $m('moneyWheelResult').textContent=`You only have ${fmt(state.cash)}.`;if(!spendCash(bet))return;const idx=moneyWheelPickIndex(),mult=PF321_WHEEL_SEGMENTS[idx],step=360/PF321_WHEEL_SEGMENTS.length,center=(idx+.5)*step,mod=((moneyWheelRotation%360)+360)%360,landing=(360-center)%360;let target=moneyWheelRotation+(360-mod)+landing+360*(7+Math.floor(exactRand()*3));if(target<=moneyWheelRotation+360*6)target+=360;moneyWheelBusy=true;const wheel=$m('moneyWheel'),stage=$m('moneyWheelStage'),btn=$m('moneyWheelSpinBtn');stage?.classList.add('is-spinning');wheel?.classList.add('spinning');if(btn)btn.disabled=true;if($m('moneyWheelResult'))$m('moneyWheelResult').textContent='Spinning…';requestAnimationFrame(()=>{moneyWheelRotation=target;if(wheel)wheel.style.transform=`rotate(${target}deg)`});const duration=document.body.classList.contains('pf-low-spec')?4300:5150;setTimeout(()=>{moneyWheelBusy=false;stage?.classList.remove('is-spinning');wheel?.classList.remove('spinning');if(btn)btn.disabled=false;const scale=pf316Scale(pf316Casino().moneyWheelPayout||1),returned=roundMoney(bet*mult*scale);if(returned>0)payCash(returned);recordGamble('moneywheel',bet,returned);const meta=moneyWheelMeta();meta.spins++;meta.wagered+=bet;meta.paid+=returned;meta.best=Math.max(meta.best||0,mult);if(mult>=5)meta.jackpots=(meta.jackpots||0)+1;const net=roundMoney(returned-bet),out=$m('moneyWheelResult');if(out)out.innerHTML=mult===0?`<strong>BUST</strong> · lost ${fmt(bet)}`:mult>=5?`<strong>5× JACKPOT!</strong> · ${fmt(returned)} returned`:net>0?`<strong>${mult.toFixed(2)}×</strong> · won ${fmt(net)}`:net===0?`<strong>${mult.toFixed(2)}×</strong> · money back`:`<strong>${mult.toFixed(2)}×</strong> · ${fmt(returned)} returned`;if(mult>=5){try{sfx('jackpot')}catch(e){}confetti(22)}else try{tone(mult>=1?510:160,.09,'triangle',.012)}catch(e){}sync()},duration+120)}
  function bindGames(){
    document.querySelectorAll('[data-coin-choice]').forEach(b=>b.addEventListener('click',()=>{if(coinSpinning)return;coinChoice=b.dataset.coinChoice||'Heads';document.querySelectorAll('[data-coin-choice]').forEach(x=>x.classList.toggle('active',x===b))}));$m('coinFlipBtn')?.addEventListener('click',coinFlip);$m('minesStartBtn')?.addEventListener('click',minesStart);$m('minesCashoutBtn')?.addEventListener('click',minesCashout);$m('plinkoDropBtn')?.addEventListener('click',plinkoDrop);slotsBindLever();$m('slotsSpinBtn')?.addEventListener('click',()=>slotsSpin(false));$m('slotsBetInput')?.addEventListener('input',()=>{const n=parseBet($m('slotsBetInput').value);if(n>=0){slotsLastBet=n;if($m('slotsBetReadout'))$m('slotsBetReadout').textContent=fmt(n)}});$m('bjDealBtn')?.addEventListener('click',bjDeal);$m('bjHitBtn')?.addEventListener('click',bjHit);$m('bjStandBtn')?.addEventListener('click',bjStand);$m('bjDoubleBtn')?.addEventListener('click',bjDouble);$m('rouletteSpinBtn')?.addEventListener('click',rouletteSpin);$m('rouletteClearBtn')?.addEventListener('click',rouletteClear);$m('rouletteTable')?.addEventListener('click',e=>{const cell=e.target.closest('[data-bet]');if(cell)roulettePlace(cell.dataset.bet)});document.addEventListener('keydown',e=>{if(currentTab!=='slots'||e.code!=='Space'||e.repeat||/INPUT|TEXTAREA|SELECT|BUTTON/.test(document.activeElement?.tagName||''))return;e.preventDefault();slotsSpin()});rouletteEnsureTable();rouletteDrawWheel(rouletteWheelRotation);minesBuildBoard(false);minesUpdate();plinkoDraw();plinkoStatsUI();slotsRender(slotsMatrix);slotsUpdateControls();bjRender();
  }
  window.__pfCasinoBridge={
    moneyWheelSegments:PF321_WHEEL_SEGMENTS,
    moneyWheelMount,
    moneyWheelReset(){moneyWheelBuilt=false;const wheel=$m('moneyWheel');if(wheel)wheel.innerHTML='';moneyWheelMount()},
    slotsBusy:()=>slotsBusy,
    slotsSpin:()=>slotsSpin(false),
    slotsUpdateControls
  };
  window.__pfV316CasinoHealth=()=>({hooked:true,controls:['slots','moneywheel','coin','mines','plinko','blackjack','roulette'],config:{...pf316Casino()}});
})();
function renderCasino(){try{mccInitCasino()}catch(err){console.error('PackForge casino render error',err)}const cash=$('#casinoCashReadout');if(cash)cash.textContent=fmt(state.cash)}
  const campaignTierDefs=[
    {name:'Bronze',ratio:1,bonusPacks:0,extraPackChance:0,specialBonus:0},
    {name:'Silver',ratio:2.5,bonusPacks:0,extraPackChance:.10,specialBonus:.004},
    {name:'Gold',ratio:6,bonusPacks:1,extraPackChance:.16,specialBonus:.012},
    {name:'Master',ratio:15,bonusPacks:1,extraPackChance:.32,specialBonus:.025}
  ];
  const campaignPlaces=['Riverside','Downtown','Harbor','Old Town','Lakeside','Northgate','Southbank','Hillcrest','Midtown','Union Square','Boardwalk','Market District','Museum Row','Civic Center','Skyline','University','Foundry','Garden District','Royal Arcade','Station Hall'];
  const campaignFormats=['Card Showcase','Collector Expo','Trading Card Fair','Curator Display','Gallery Exhibition','Card Convention','Collector Hall','Weekend Showcase','Card Festival','Trading Expo','Collector Meetup','Prestige Display','Card Market','Collector Summit','Card Pavilion','Collector Showcase','Card Exhibition','Collector Fair','Card Salon','Collector Invitational'];
  const campaignNamePool=campaignPlaces.flatMap(place=>campaignFormats.map(format=>`${place} ${format}`));
  const campaignTimes={
    easy:[2,3,4,5,6],
    standard:[5,7,9,11,13],
    hard:[10,12,15,18,20]
  };
  const CAMPAIGN_REFRESH_MS=15*60*1000;
  const CAMPAIGN_OFFER_VERSION=10;
  function allOwnedCopies(){const out=[];for(const [id,it] of Object.entries(state.inventory)){const c=cardMap[id];if(!c)continue;for(const [lv,ld] of Object.entries(it.levels||{}))for(const cp of ld.copies||[])out.push({card:c,level:+lv,copy:cp,power:effectiveCardPower(c,+lv,cp)})}return out}
  function ownedCopyByUid(uid){return allOwnedCopies().find(x=>x.copy.uid===uid)||null}
  function selectedCampaignCards(){const map=new Map(allOwnedCopies().map(x=>[x.copy.uid,x]));return (state.campaigns.selected||[]).map(u=>map.get(u)).filter(Boolean).filter(x=>!x.copy.gradingUntil&&!copyIsCampaignCommitted(x.copy.uid)&&!copyIsShowcased(x.copy.uid)).slice(0,5)}
  function rarityRankForCampaign(card){return card.secret?rarityOrder.length:rarityOrder.indexOf(card.rarity)}
  function selectedCampaignPower(){return selectedCampaignCards().reduce((n,x)=>n+x.power,0)}
  function campaignTier(def,power){let tier=campaignTierDefs[0];for(const t of campaignTierDefs)if(power/def.power>=t.ratio)tier=t;return tier}
  function campaignSpeed(def,power){if(!def||power<def.power)return 1;return clamp(Math.pow(Math.max(1,power/def.power),.82)*campaignPrepMultiplier(),1,10)}
  function campaignEffectiveMinutes(def,power){return (def.baseMinutes||def.minutes||1)/campaignSpeed(def,power)}
  function campaignDurationMs(def,power){return Math.max(2*60*1000,Math.round(campaignEffectiveMinutes(def,power)*60000))}
  function campaignDurationLabel(minutes){const sec=Math.max(1,Math.round(minutes*60));if(sec<60)return `${sec}s`;const m=Math.round(sec/60);if(m<60)return `${m} min`;const h=m/60;if(h<10)return `${h.toFixed(h%1?.1:0)} hr`;return `${Math.round(h)} hr`}
  function campaignTime(ms){ms=Math.max(0,ms);const total=Math.ceil(ms/1000),h=Math.floor(total/3600),m=Math.floor((total%3600)/60),sec=total%60;return h?`${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`:`${m}:${String(sec).padStart(2,'0')}`}
  function campaignAddPack(themeId=null,special=false){const pool=basePackThemes();const t=themeId?themes.find(x=>x.id===themeId):pool[Math.floor(Math.random()*Math.max(1,pool.length))];if(!t)return null;if(special){if(Math.random()<.72){const ids=Object.keys(premiumPackDefs),id=ids[Math.floor(Math.random()*ids.length)],d=premiumPackDefs[id];grantPremiumPack(id,1);return {theme:d.name,special:d.name,premium:true}}const muts=Object.values(packMutations),m=muts[Math.floor(Math.random()*muts.length)];const pack={uid:uid(),themeId:t.id,mutation:m.id,source:'Exhibition Campaign'};state.specialPackInventory.push(pack);return {theme:`${t.name} ${m.name}`,special:m.name,mutation:true}}state.packInventory[t.id]=(state.packInventory[t.id]||0)+1;return {theme:t.name,special:null}}
  function campaignPowerSnapshot(){const powers=allOwnedCopies().filter(x=>!x.copy.gradingUntil&&!copyIsCampaignCommitted(x.copy.uid)&&!copyIsShowcased(x.copy.uid)).map(x=>x.power).sort((a,b)=>b-a);return {single:powers[0]||500,topFive:powers.slice(0,5).reduce((a,b)=>a+b,0)||2500,count:powers.length}}
  function campaignRound(n,step=5){return Math.max(step,Math.round(n/step)*step)}
  function campaignPick(arr){return arr[Math.floor(Math.random()*arr.length)]}
  function campaignRandomBetween(min,max){return min+Math.random()*(max-min)}
  function campaignRewardsForMinutes(minutes,difficulty){
    const scaled=minutes*8;let packs=0,packChance=0,cash=0,special=0,potionChance=0;
    if(scaled<=30){packChance=.42;cash=70+scaled*2.2;special=.012;potionChance=.04}
    else if(scaled<=60){packs=1;packChance=.28;cash=145+scaled*2.0;special=.025;potionChance=.08}
    else if(scaled<=90){packs=2;packChance=.18;cash=220+scaled*1.8;special=.045;potionChance=.12}
    else if(scaled<=120){packs=2;packChance=.48;cash=310+scaled*1.7;special=.065;potionChance=.17}
    else {packs=3;packChance=.55;cash=430+scaled*1.55;special=.09;potionChance=.22}
    const luck=campaignLuckMultiplier();packChance=Math.min(.90,packChance*luck);special=Math.min(.22,special*luck);potionChance=Math.min(.36,potionChance*luck);
    if(difficulty==='standard')cash*=1.04;if(difficulty==='hard'){cash*=1.10;special=Math.min(.24,special+.01)}
    return {packs,packChance,cash:Math.round(cash),special,potionChance};
  }
  function campaignRewardText(def){const bits=[];if(def.packs)bits.push(`${def.packs} pack${def.packs===1?'':'s'}`);if(def.packChance)bits.push(`${Math.round(def.packChance*100)}% bonus pack`);bits.push(fmt(def.cashReward));if(def.special)bits.push(`${Math.round(def.special*100)}% special`);return bits.join(' · ')}
  function generateCampaignOffer(difficulty,index=0){
    const baseMinutes=campaignPick(campaignTimes[difficulty]),gen=(state.campaigns.offerGeneration||0)+index+1;
    const completed=state.campaigns.completed?.total||0;
    let target;
    if(difficulty==='easy'){
      target=Math.random()<.78?campaignRandomBetween(500,1600):campaignRandomBetween(1600,3200);
    }else if(difficulty==='standard'){
      target=campaignRandomBetween(1800,12000);
    }else{
      const r=Math.random();
      if(r<.08)target=campaignRandomBetween(25000,30000);
      else if(r<.26)target=campaignRandomBetween(5000,9000);
      else target=campaignRandomBetween(8500,22000);
    }
    const slowScale=1+Math.min(.35,completed*.0015);
    const step=difficulty==='easy'?25:difficulty==='standard'?100:250;
    target=campaignRound(Math.min(30000,target*slowScale),step);
    target=Math.max(500,Math.min(30000,target));
    const feeBase=difficulty==='easy'?campaignRandomBetween(1,4):difficulty==='standard'?campaignRandomBetween(3,8):campaignRandomBetween(5,14);
    const fee=Math.max(1,Math.round(feeBase+baseMinutes/90));
    const rewards=campaignRewardsForMinutes(baseMinutes,difficulty);
    return {offerId:`cg_${Date.now().toString(36)}_${gen}_${Math.random().toString(36).slice(2,6)}`,name:campaignPick(campaignNamePool),difficulty,baseMinutes,power:target,fee,packs:rewards.packs,packChance:rewards.packChance,cashReward:rewards.cash,special:rewards.special,potionChance:rewards.potionChance,createdAt:Date.now()}
  }
  function generateRareCampaignOffer(){const rewards={packs:8,packChance:1,cash:65000,special:.65,potionChance:0};return {offerId:`rare_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`,name:'The Grand Vault Invitational',difficulty:'rare',rareCampaign:true,baseMinutes:45,power:50000,fee:0,packs:rewards.packs,packChance:rewards.packChance,cashReward:rewards.cash,special:rewards.special,potionChance:0,createdAt:Date.now()}}
  function generateCampaignOffers(){
    const list=[generateCampaignOffer('easy',0),generateCampaignOffer('standard',1),Math.random()<.025?generateRareCampaignOffer():generateCampaignOffer('hard',2)];
    for(let i=list.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[list[i],list[j]]=[list[j],list[i]]}
    state.campaigns.offers=list;state.campaigns.offerGeneration=(state.campaigns.offerGeneration||0)+1;state.campaigns.offerVersion=CAMPAIGN_OFFER_VERSION;state.campaigns.selectedOfferId=null;state.campaigns.flowOfferId=null;state.campaigns.flowStep='offers';state.campaigns.selected=[];save();return list
  }
  function campaignRefreshRemaining(){return Math.max(0,CAMPAIGN_REFRESH_MS-(Date.now()-(state.campaigns.lastManualRefresh||0)))}
  function campaignRefreshLabel(ms){if(ms<=0)return 'Refresh Offers';const total=Math.ceil(ms/1000),m=Math.floor(total/60),sec=total%60;return `Refresh ${m}:${String(sec).padStart(2,'0')}`}
  function manualRefreshCampaigns(){if(activeCampaign()||campaignRefreshRemaining()>0)return;state.campaigns.lastManualRefresh=Date.now();generateCampaignOffers();save();renderCampaigns()}
  function ensureCampaignOffers(){
    const a=state.campaigns.active;
    if(a?.offer){a.offer.baseMinutes=a.offer.baseMinutes||a.offer.minutes||Math.max(1,Math.round(((a.endsAt||Date.now())-(a.startedAt||Date.now()))/60000));a.durationMs=a.durationMs||Math.max(15000,(a.endsAt||Date.now())-(a.startedAt||Date.now()));a.speed=a.speed||campaignSpeed(a.offer,a.power||a.offer.power)}
    if(a&&!a.offer){if(Date.now()<a.endsAt&&a.fee){state.cash+=(a.fee||0)}state.campaigns.active=null;state.campaigns.selected=[]}
    if((!activeCampaign()&&state.campaigns.offerVersion!==CAMPAIGN_OFFER_VERSION)||!Array.isArray(state.campaigns.offers)||state.campaigns.offers.length!==3)generateCampaignOffers();
    if(!state.campaigns.selectedOfferId||!state.campaigns.offers.some(o=>o.offerId===state.campaigns.selectedOfferId))state.campaigns.selectedOfferId=state.campaigns.offers[0]?.offerId||null;
    return state.campaigns.offers
  }
  function selectedCampaignOffer(){ensureCampaignOffers();return state.campaigns.offers.find(o=>o.offerId===state.campaigns.selectedOfferId)||state.campaigns.offers[0]||null}
  function campaignRequirementOK(def,cards){return cards.length>=1}
  function campaignEntryFee(def){return 0} // Campaigns are permanently free.
  function campaignStart(def){
    const cards=selectedCampaignCards(),power=cards.reduce((n,x)=>n+x.power,0),entryFee=campaignEntryFee(def);
    if(activeCampaign()){toast('Campaign already running','Finish the current exhibition first.');return}
    if(!def||!state.campaigns.offers.some(o=>o.offerId===def.offerId)){sfx('error');return}
    if(power<def.power||!campaignRequirementOK(def,cards)){sfx('error');toast('Not enough Power',cards.length?`You need ${def.power.toLocaleString()} total Power.`:'Select at least one card. One card is enough if it clears the Power target.');return}
    if(entryFee>0&&!spend(entryFee)){sfx('error');toast('Not enough cash',`Entry costs ${fmt(entryFee)}.`);return}
    const now=Date.now(),durationMs=campaignDurationMs(def,power),speed=campaignSpeed(def,power);state.campaigns.active={offer:{...def,fee:entryFee},offerId:def.offerId,startedAt:now,endsAt:now+durationMs,durationMs,cardUids:cards.map(x=>x.copy.uid),power,fee:entryFee,speed,notified:false};state.campaigns.selected=[];state.stats.campaignsStarted=(state.stats.campaignsStarted||0)+1;state.stats.campaignPowerSent=(state.stats.campaignPowerSent||0)+power;state.stats.campaignMinutes=(state.stats.campaignMinutes||0)+durationMs/60000;sfx('buy');save();renderHUD();renderCampaigns();toast('Campaign started',`${def.name} · ${campaignDurationLabel(durationMs/60000)} at ${speed.toFixed(speed>=10?0:1)}× speed.`)
  }
  function showCampaignRewardPopup(summary){
    const m=$('#confirmModal');m.classList.remove('hidden');const packRows=summary.packs.map(p=>`<div class="campaign-reward-line"><span>${p.special?'✦':'▣'} ${p.special?`${p.special} ${p.theme} Pack`:`${p.theme} Pack`}</span><b>${p.special?'SPECIAL':'×1'}</b></div>`).join('');
    m.innerHTML=`<div class="modal campaign-reward-modal fade-in"><div class="campaign-reward-burst">CAMPAIGN COMPLETE</div><h2>${summary.name}</h2><div class="campaign-reward-tier">${summary.tier} TIER · ${summary.power.toLocaleString()} POWER · ${summary.speed.toFixed(summary.speed>=10?0:1)}× SPEED</div><div class="campaign-reward-list"><div class="campaign-reward-line"><span>Cash reward</span><b>${fmt(summary.cash)}</b></div>${packRows||'<div class="campaign-reward-line"><span>Packs</span><b>None this run</b></div>'}${summary.hiddenSetWon?`<div class="campaign-reward-line hidden-set-win"><span>${summary.hiddenSetWon.emoji} Hidden set discovered: ${summary.hiddenSetWon.name}</span><b>10 SHOP BUYS</b></div>`:''}</div><button class="campaign-reward-done" id="campaignRewardDone">Collect & See New Offers</button></div>`;
    const close=()=>{m.classList.add('hidden');m.innerHTML=''};$('#campaignRewardDone').onclick=close;m.onmousedown=e=>{if(e.target===m)close()}
  }
  function tryUnlockCampaignSet(){
    const hidden=themes.filter(t=>t.campaignHidden),currently=new Set(hidden.filter(t=>hiddenOfferRemaining(t.id)>0).map(t=>t.id));
    const chance=Math.min(.05,.015*campaignLuckMultiplier());if(Math.random()>=chance)return null;
    let pool=hidden.filter(t=>!currently.has(t.id)&&!state.campaignSetSeen[t.id]);if(!pool.length)pool=hidden.filter(t=>!currently.has(t.id));if(!pool.length)return null;
    const t=pool[Math.floor(Math.random()*pool.length)];state.campaignSetOffers[t.id]=10;state.campaignSetSeen[t.id]=true;state.stats.hiddenSetsFound=(state.stats.hiddenSetsFound||0)+1;return t;
  }
  function collectCampaignReward(){
    const a=activeCampaign();if(!a||Date.now()<a.endsAt)return;const def=a.offer;if(!def)return;
    const tier=campaignTier(def,a.power),fallbackRewards=campaignRewardsForMinutes(def.baseMinutes||def.minutes||20,def.difficulty||'standard'),od=overdriveBoost(),cash=Math.round((def.cashReward??fallbackRewards.cash)*(1+Math.min(.35,(a.power/def.power-1)*.025))*od);if(cash>0)earn(cash);
    const packRewards=[];let packCount=((def.packs||0)+tier.bonusPacks)*od;for(let i=0;i<packCount;i++){const p=campaignAddPack(null,false);if(p)packRewards.push(p)}
    const extraChance=Math.min(.98,((def.packChance||0)+(tier.extraPackChance||0))*od);if(Math.random()<extraChance){const p=campaignAddPack(null,false);if(p)packRewards.push(p)}
    let specialWon=false;const specialChance=Math.min(.90,((def.special||0)+(tier.specialBonus||0))*od);if(Math.random()<specialChance){const p=campaignAddPack(null,true);if(p){packRewards.push(p);specialWon=true}}
    let potionWon=null;
    const hiddenSetWon=tryUnlockCampaignSet();
    state.campaigns.completed.total=(state.campaigns.completed.total||0)+1;addOverdriveProgress('campaign',1);state.campaigns.active=null;state.stats.campaignsCompleted=(state.stats.campaignsCompleted||0)+1;state.stats.campaignCash=(state.stats.campaignCash||0)+cash;state.stats.campaignPacksWon=(state.stats.campaignPacksWon||0)+packRewards.filter(p=>!p.special).length;state.stats.campaignSpecialsWon=(state.stats.campaignSpecialsWon||0)+(specialWon?1:0);state.stats.campaignPotionsWon=(state.stats.campaignPotionsWon||0)+(potionWon?1:0);
    const summary={name:def.name,tier:tier.name,power:a.power,cash,packs:packRewards,specialWon,potionWon,hiddenSetWon,speed:a.speed||campaignSpeed(def,a.power)};generateCampaignOffers();sfx('grade');confetti(tier.name==='Master'?28:14);save();renderAll();renderCampaigns();showCampaignRewardPopup(summary)
  }
  let campaignSearch='';
  function renderCampaignList(){
    const el=$('#campaignList');if(!el)return;const offers=ensureCampaignOffers(),selected=state.campaigns.selectedOfferId,refreshLeft=campaignRefreshRemaining(),busy=!!activeCampaign();
    el.innerHTML=`<div class="campaign-board-title"><div class="campaign-board-title-copy"><b>Choose 1 of 3</b><small>Three rotating exhibitions from 2 to 20 minutes. More Power shortens the timer and improves tiers.</small></div><button class="campaign-refresh" id="campaignRefresh" ${busy||refreshLeft>0?'disabled':''}>${busy?'Campaign Active':campaignRefreshLabel(refreshLeft)}</button></div>`+offers.map(d=>`<button class="campaign-row campaign-offer ${selected===d.offerId?'active':''} difficulty-${d.difficulty}" data-campaign-offer="${d.offerId}" ${busy?'disabled':''}><span class="campaign-num">${d.difficulty==='easy'?'S':d.difficulty==='hard'?'L':'M'}</span><span class="campaign-row-copy"><b>${d.name}</b><small>${d.power.toLocaleString()} Power · FREE entry · ${campaignRewardText(d)}</small></span><span class="campaign-row-time">${campaignDurationLabel(d.baseMinutes)}</span></button>`).join('');
    $$('[data-campaign-offer]').forEach(b=>b.onclick=()=>{state.campaigns.selectedOfferId=b.dataset.campaignOffer;state.campaigns.selected=[];save();renderCampaigns()});const rb=$('#campaignRefresh');if(rb)rb.onclick=manualRefreshCampaigns
  }
  function updateCampaignRefreshButton(){const b=$('#campaignRefresh');if(!b)return;const busy=!!activeCampaign(),left=campaignRefreshRemaining();b.disabled=busy||left>0;b.textContent=busy?'Campaign Active':campaignRefreshLabel(left)}
  function renderCampaignActive(){
    const stage=$('#campaignStage'),a=activeCampaign();if(!stage||!a)return false;const def=a.offer,remaining=a.endsAt-Date.now(),done=remaining<=0,duration=a.durationMs||(a.endsAt-a.startedAt)||def.baseMinutes*60000,pct=clamp((Date.now()-a.startedAt)/duration*100,0,100),tier=campaignTier(def,a.power);const ownedMap=new Map(allOwnedCopies().map(x=>[x.copy.uid,x])),team=(a.cardUids||[]).map(u=>ownedMap.get(u)).filter(Boolean);
    stage.innerHTML=`<div class="campaign-active-box ${done?'done':''}"><div class="campaign-badge">${def.difficulty.toUpperCase()} OFFER · <strong>${tier.name.toUpperCase()} TIER</strong> · ${(a.speed||campaignSpeed(def,a.power)).toFixed((a.speed||1)>=10?0:1)}× SPEED</div><h2>${def.name}</h2><p>${done?'The exhibition has ended. Your cards are back and the reward is ready.':'Your selected cards are committed until the exhibition finishes.'}</p><div class="campaign-big-timer">${done?'COMPLETE':campaignTime(remaining)}</div><div class="campaign-progress"><i style="width:${pct}%"></i></div><div class="campaign-active-team">${team.map(x=>`<span class="campaign-chip"><b>${x.card.name}</b> · ${x.power.toLocaleString()} PWR</span>`).join('')}</div><div class="campaign-power-line"><span>Power sent</span><strong class="ready">${a.power.toLocaleString()} / ${def.power.toLocaleString()}</strong></div><div class="campaign-help">Base duration ${campaignDurationLabel(def.baseMinutes||def.minutes||duration/60000)} · actual duration ${campaignDurationLabel(duration/60000)}.</div>${done?'<button class="campaign-collect" id="campaignCollect">Collect Rewards</button>':'<div class="campaign-help">The timer keeps running while you are elsewhere or the browser is closed.</div>'}</div>`;if(done&&$('#campaignCollect'))$('#campaignCollect').onclick=collectCampaignReward;return true
  }
  function renderCampaignSetup(){
    const stage=$('#campaignStage');if(!stage)return;const def=selectedCampaignOffer();if(!def){stage.innerHTML='<div class="campaign-locked-note">No campaigns available.</div>';return}
    const selected=selectedCampaignCards();state.campaigns.selected=selected.map(x=>x.copy.uid);const power=selected.reduce((n,x)=>n+x.power,0),ready=power>=def.power&&selected.length>=1&&!activeCampaign(),ratio=power/def.power,tier=campaignTier(def,power),speed=campaignSpeed(def,power),projected=campaignEffectiveMinutes(def,power);
    let entries=allOwnedCopies().filter(x=>!x.copy.gradingUntil&&!copyIsCampaignCommitted(x.copy.uid)&&!state.campaigns.selected.includes(x.copy.uid));if(campaignSearch){const q=campaignSearch.toLowerCase();entries=entries.filter(x=>x.card.name.toLowerCase().includes(q)||x.card.theme.toLowerCase().includes(q)||x.card.rarity.toLowerCase().includes(q)||(x.copy.variant||'').toLowerCase().includes(q))}entries.sort((a,b)=>b.power-a.power||rarityRankForCampaign(b.card)-rarityRankForCampaign(a.card)).splice(80);
    stage.innerHTML=`<div class="campaign-stage-head"><div><h2>${def.name}</h2><p>Base time ${campaignDurationLabel(def.baseMinutes)} · projected ${power>=def.power?campaignDurationLabel(projected):'—'}</p></div><span class="campaign-badge">${power>=def.power?`${speed.toFixed(speed>=10?0:1)}× SPEED · ${tier.name}`:'Not qualified'}</span></div><div class="campaign-requirement"><b>Power target:</b> ${def.power.toLocaleString()} total Power.<br><b>Cards required:</b> 1 minimum. One powerful card can run the campaign alone.<br><b>Base rewards:</b> ${campaignRewardText(def)}</div><div class="campaign-team">${[0,1,2,3,4].map(i=>{const x=selected[i];return x?`<div class="campaign-slot filled" style="--slot:${rarityColor[x.card.rarity]||'#fff'}"><button data-remove-campaign="${x.copy.uid}">×</button><b>${x.card.name}</b><small>${x.card.rarity} · ${x.copy.variant||'Normal'} · Lv ${x.level}</small><span class="slot-power">${x.power.toLocaleString()} PWR</span></div>`:`<div class="campaign-slot"><small>${i===0?'ONE CARD CAN BE ENOUGH':'OPTIONAL'}</small></div>`}).join('')}</div><div class="campaign-power-line"><span>Selected Power</span><strong class="${power>=def.power?'ready':''}">${power.toLocaleString()} / ${def.power.toLocaleString()}</strong></div><div class="campaign-meter"><i style="width:${Math.min(100,ratio*100)}%"></i></div><div class="campaign-actions"><button class="campaign-start" id="campaignStart" ${ready&&canAfford(campaignEntryFee(def))?'':'disabled'}>Start · ${power>=def.power?campaignDurationLabel(projected):campaignDurationLabel(def.baseMinutes)}</button><button class="campaign-clear" id="campaignClear">Clear Cards</button><span class="campaign-entry">Entry <b>FREE</b></span></div><div class="campaign-reward-preview">${campaignTierDefs.map(t=>`<div class="campaign-tier ${power>=def.power&&t.name===tier.name?'current':''}"><strong>${t.name}</strong><small>${t.ratio}× Power<br>${t.bonusPacks?`+${t.bonusPacks} pack`:t.extraPackChance?`+${Math.round(t.extraPackChance*100)}% pack chance`:'Base rewards'}</small></div>`).join('')}</div><div class="campaign-picker-head"><h3>Your cards</h3><input class="campaign-search" id="campaignSearch" value="${campaignSearch.replace(/"/g,'&quot;')}" placeholder="Search cards, set, rarity…"></div><div class="campaign-card-list">${entries.length?entries.map(x=>`<button class="campaign-pick" data-add-campaign="${x.copy.uid}" ${selected.length>=5?'disabled':''} style="--rarity:${rarityColor[x.card.rarity]||'#fff'}"><span class="rarity-stripe"></span><span><b>${x.card.name}</b><small>${themes.find(t=>t.id===x.card.theme)?.name||x.card.theme} · ${x.card.rarity} · ${x.copy.variant||'Normal'} · Lv ${x.level}${x.copy.grade?' · '+x.copy.grade.toFixed(1):''}</small></span><span class="pick-power">${x.power.toLocaleString()}</span></button>`).join(''):'<div class="campaign-locked-note">No matching eligible cards.</div>'}</div><div class="campaign-help">Campaigns range from 2 to 20 minutes before Power reductions. Strong teams can shorten them further.</div>`;
    $$('[data-remove-campaign]').forEach(b=>b.onclick=()=>{state.campaigns.selected=state.campaigns.selected.filter(u=>u!==b.dataset.removeCampaign);save();renderCampaignSetup()});$$('[data-add-campaign]').forEach(b=>b.onclick=()=>{if(state.campaigns.selected.length>=5)return;state.campaigns.selected.push(b.dataset.addCampaign);save();renderCampaignSetup()});$('#campaignClear').onclick=()=>{state.campaigns.selected=[];save();renderCampaignSetup()};$('#campaignStart').onclick=()=>campaignStart(def);$('#campaignSearch').oninput=e=>{campaignSearch=e.target.value;renderCampaignSetup();const inp=$('#campaignSearch');if(inp){inp.focus();inp.setSelectionRange(inp.value.length,inp.value.length)}}
  }
  function campaignFlowOffer(){
    ensureCampaignOffers();
    const id=state.campaigns.flowOfferId;
    return state.campaigns.offers.find(o=>o.offerId===id)||null
  }
  function campaignResetFlow(){state.campaigns.flowStep='offers';state.campaigns.flowOfferId=null;state.campaigns.selected=[]}
  function campaignOfferRewardCards(def){
    const out=[];
    if(def.packs)out.push(`${def.packs} guaranteed pack${def.packs===1?'':'s'}`);
    if(def.packChance)out.push(`${Math.round(def.packChance*100)}% bonus-pack chance`);
    if(def.special)out.push(`${Math.round(def.special*100)}% special-pack chance`);
    
    if(def.cashReward)out.push(`${fmt(def.cashReward)} cash`);
    return out
  }
  function renderCampaignOfferFlow(){
    const list=$('#campaignList'),stage=$('#campaignStage');if(!list||!stage)return;
    const offers=ensureCampaignOffers(),active=activeCampaign(),refreshLeft=campaignRefreshRemaining();
    if(active)return;
    const step=state.campaigns.flowStep||'offers';
    const listPanel=list.closest('.campaign-panel'),stagePanel=stage.closest('.campaign-panel');
    if(step==='offers'){
      if(listPanel)listPanel.style.display='block';if(stagePanel)stagePanel.style.display='block';
      list.innerHTML=`<div class="campaign-choice-head"><div><span>CHOOSE A CAMPAIGN</span><h2>Where are your cards going?</h2><p>Pick one offer, then continue to team selection.</p></div><button class="campaign-refresh" id="campaignRefresh" ${refreshLeft>0?'disabled':''}>${campaignRefreshLabel(refreshLeft)}</button></div><div class="campaign-choice-grid">${offers.map((d,i)=>{const selected=state.campaigns.flowOfferId===d.offerId;return `<button class="campaign-choice-card ${selected?'selected':''} difficulty-${d.difficulty}" data-campaign-choice="${d.offerId}"><div class="campaign-choice-kicker">${d.rareCampaign?'50,000 POWER · RARE':`${d.power.toLocaleString()} POWER REQUIRED`}</div><h3>${d.name}</h3><div class="campaign-choice-stats"><span><small>BASE TIME</small><b>${campaignDurationLabel(d.baseMinutes)}</b></span><span><small>POWER</small><b>${d.power.toLocaleString()}</b></span><span><small>ENTRY</small><b>FREE</b></span></div><div class="campaign-choice-rewards"><small>REWARDS</small>${campaignOfferRewardCards(d).map(x=>`<span>${x}</span>`).join('')}</div></button>`}).join('')}</div>`;
      const picked=campaignFlowOffer();
      stage.innerHTML=`<div class="campaign-choice-next"><div>${picked?`<b>${picked.name}</b><span>${campaignDurationLabel(picked.baseMinutes)} base · ${picked.power.toLocaleString()} Power required</span>`:'<b>Select one of the three campaigns.</b><span>Your offer will stay selected until you continue or refresh.</span>'}</div><button id="campaignOfferNext" ${picked?'':'disabled'}>NEXT →</button></div>`;
      $$('[data-campaign-choice]').forEach(b=>b.onclick=()=>{state.campaigns.flowOfferId=b.dataset.campaignChoice;state.campaigns.selectedOfferId=b.dataset.campaignChoice;state.campaigns.selected=[];save();renderCampaigns()});
      const next=$('#campaignOfferNext');if(next)next.onclick=()=>{if(!campaignFlowOffer())return;state.campaigns.flowStep='team';save();renderCampaigns()};
      const rb=$('#campaignRefresh');if(rb)rb.onclick=()=>{manualRefreshCampaigns();campaignResetFlow();save();renderCampaigns()};
      return
    }
    if(listPanel)listPanel.style.display='none';if(stagePanel)stagePanel.style.display='block';
    renderCampaignTeamFlow()
  }
  function renderCampaignTeamFlow(){
    const stage=$('#campaignStage'),def=campaignFlowOffer();if(!stage||!def){campaignResetFlow();renderCampaigns();return}
    const selected=selectedCampaignCards();state.campaigns.selected=selected.map(x=>x.copy.uid);
    const power=selected.reduce((n,x)=>n+x.power,0),ready=selected.length>=1&&power>=def.power&&!activeCampaign(),speed=campaignSpeed(def,power),projected=campaignEffectiveMinutes(def,power),tier=campaignTier(def,power);
    let entries=allOwnedCopies().filter(x=>!x.copy.gradingUntil&&!copyIsCampaignCommitted(x.copy.uid)&&!state.campaigns.selected.includes(x.copy.uid));
    if(campaignSearch){const q=campaignSearch.toLowerCase();entries=entries.filter(x=>x.card.name.toLowerCase().includes(q)||x.card.theme.toLowerCase().includes(q)||x.card.rarity.toLowerCase().includes(q)||(x.copy.variant||'').toLowerCase().includes(q))}
    entries.sort((a,b)=>b.power-a.power||rarityRankForCampaign(b.card)-rarityRankForCampaign(a.card));entries=entries.slice(0,100);
    stage.innerHTML=`<div class="campaign-flow-top"><button class="campaign-flow-back" id="campaignFlowBack">← Campaigns</button><div><small>STEP 2 OF 2</small><h2>${def.name}</h2><p>Select 1–5 cards. One card is enough if it clears the Power target.</p></div></div><div class="campaign-flow-summary"><span><small>Required Power</small><b>${def.power.toLocaleString()}</b></span><span><small>Base Time</small><b>${campaignDurationLabel(def.baseMinutes)}</b></span><span><small>Projected</small><b>${power>=def.power?campaignDurationLabel(projected):'—'}</b></span><span><small>Entry</small><b>FREE</b></span></div><div class="campaign-team">${[0,1,2,3,4].map(i=>{const x=selected[i];return x?`<div class="campaign-slot filled" style="--slot:${rarityColor[x.card.rarity]||'#fff'}"><button data-remove-campaign="${x.copy.uid}">×</button><b>${x.card.name}</b><small>${x.card.rarity} · ${x.copy.variant||'Normal'} · Lv ${x.level}</small><span class="slot-power">${x.power.toLocaleString()} PWR</span></div>`:`<div class="campaign-slot"><small>${i===0?'MINIMUM 1 CARD':'OPTIONAL'}</small></div>`}).join('')}</div><div class="campaign-power-line"><span>Selected Power</span><strong class="${power>=def.power?'ready':''}">${power.toLocaleString()} / ${def.power.toLocaleString()}</strong></div><div class="campaign-meter"><i style="width:${Math.min(100,power/def.power*100)}%"></i></div><div class="campaign-speed-readout">${power>=def.power?`${speed.toFixed(speed>=10?0:1)}× campaign speed · ${tier.name} reward tier`:'Add more Power to qualify.'}</div><div class="campaign-picker-head"><h3>Your cards</h3><input class="campaign-search" id="campaignSearch" value="${campaignSearch.replace(/"/g,'&quot;')}" placeholder="Search cards…"></div><div class="campaign-card-list">${entries.length?entries.map(x=>`<button class="campaign-pick" data-add-campaign="${x.copy.uid}" ${selected.length>=5?'disabled':''} style="--rarity:${rarityColor[x.card.rarity]||'#fff'}"><span class="rarity-stripe"></span><span><b>${x.card.name}</b><small>${themes.find(t=>t.id===x.card.theme)?.name||x.card.theme} · ${x.card.rarity} · ${x.copy.variant||'Normal'} · Lv ${x.level}</small></span><span class="pick-power">${x.power.toLocaleString()}</span></button>`).join(''):'<div class="campaign-locked-note">No eligible cards.</div>'}</div><div class="campaign-flow-footer"><button class="campaign-clear" id="campaignClear">Clear</button><div><small>${selected.length} card${selected.length===1?'':'s'} selected</small><b>${power>=def.power?campaignDurationLabel(projected):campaignDurationLabel(def.baseMinutes)} projected</b></div><button class="campaign-next-launch" id="campaignLaunchNext" ${ready&&canAfford(campaignEntryFee(def))?'':'disabled'}>NEXT →</button></div>`;
    $('#campaignFlowBack').onclick=()=>{state.campaigns.flowStep='offers';state.campaigns.selected=[];save();renderCampaigns()};
    $$('[data-remove-campaign]').forEach(b=>b.onclick=()=>{state.campaigns.selected=state.campaigns.selected.filter(u=>u!==b.dataset.removeCampaign);save();renderCampaigns()});
    $$('[data-add-campaign]').forEach(b=>b.onclick=()=>{if(state.campaigns.selected.length>=5)return;state.campaigns.selected.push(b.dataset.addCampaign);save();renderCampaigns()});
    $('#campaignClear').onclick=()=>{state.campaigns.selected=[];save();renderCampaigns()};
    $('#campaignLaunchNext').onclick=()=>{state.campaigns.selectedOfferId=def.offerId;state.campaigns.flowStep='journey';save();campaignStart(def)};
    $('#campaignSearch').oninput=e=>{campaignSearch=e.target.value;renderCampaigns();const inp=$('#campaignSearch');if(inp){inp.focus();inp.setSelectionRange(inp.value.length,inp.value.length)}}
  }
  function renderCampaignActiveFlow(){
    const stage=$('#campaignStage'),list=$('#campaignList'),a=activeCampaign();if(!stage||!a)return false;
    const lp=list?.closest('.campaign-panel');if(lp)lp.style.display='none';const sp=stage.closest('.campaign-panel');if(sp)sp.style.display='block';
    const def=a.offer,remaining=a.endsAt-Date.now(),done=remaining<=0,duration=a.durationMs||(a.endsAt-a.startedAt)||def.baseMinutes*60000,pct=clamp((Date.now()-a.startedAt)/duration*100,0,100),tier=campaignTier(def,a.power),ownedMap=new Map(allOwnedCopies().map(x=>[x.copy.uid,x])),team=(a.cardUids||[]).map(u=>ownedMap.get(u)).filter(Boolean);
    stage.innerHTML=`<div class="campaign-journey ${done?'done':''}"><div class="campaign-journey-head"><span>${done?'CAMPAIGN COMPLETE':'CAMPAIGN IN PROGRESS'}</span><h2>${def.name}</h2><p>${done?'Your cards made it back. Collect the full reward report.':'Your cards are traveling, appearing at exhibitions, and building interest along the route.'}</p></div><div class="campaign-travel-scene"><div class="campaign-sky-dot d1"></div><div class="campaign-sky-dot d2"></div><div class="campaign-horizon"></div><div class="campaign-road"></div><div class="campaign-battle-flash">✦</div><div class="campaign-travel-party">${team.map((x,i)=>`<div class="campaign-travel-card" style="--delay:${i*.18}s;--c:${rarityColor[x.card.rarity]||'#fff'}"><b>${x.card.name}</b><small>${x.power.toLocaleString()} PWR</small></div>`).join('')}</div></div><div class="campaign-big-timer">${done?'COMPLETE':campaignTime(remaining)}</div><div class="campaign-progress"><i style="width:${pct}%"></i></div><div class="campaign-active-meta"><span>${a.power.toLocaleString()} Power</span><span>${(a.speed||campaignSpeed(def,a.power)).toFixed((a.speed||1)>=10?0:1)}× speed</span><span>${tier.name} tier</span></div>${done?'<button class="campaign-collect" id="campaignCollect">COLLECT REWARDS</button>':'<div class="campaign-help">The campaign keeps running while you use the rest of the game or close the browser.</div>'}</div>`;
    if(done&&$('#campaignCollect'))$('#campaignCollect').onclick=()=>{campaignResetFlow();collectCampaignReward()};return true
  }
  function renderCampaigns(){
    ensureCampaignOffers();
    if(renderCampaignActiveFlow())return;
    renderCampaignOfferFlow()
  }
  let gradingSelection=null,lastGradeResult=null;
  const GRADING_TIME=5*60*1000;
  function gradeCost(e){return Math.max(30,Math.round(effectiveCardValue(e.c,e.level,e.rep)*.12*gradingFeeMultiplier()))}
  function gradeLabel(g,copy=null){if(copy?.blackLabel&&g>=10)return'PERFECT BLACK LABEL';if(g>=10)return'GEM MINT';if(g>=9.5)return'MINT+';if(g>=9)return'MINT';if(g>=8.5)return'NEAR MINT+';if(g>=8)return'NEAR MINT';if(g>=7)return'EXCELLENT';if(g>=5)return'GOOD';return'PLAYED'}
  function rollGrade(){const once=()=>{const r=Math.random();let g;if(r<.04)g=10;else if(r<.14)g=9.5+Math.random()*.4;else if(r<.34)g=9+Math.random()*.4;else if(r<.68)g=8+Math.random()*.9;else if(r<.96)g=7+Math.random()*.9;else g=5+Math.random()*1.9;return Math.round(g*10)/10};let best=once();if(overdriveActive())for(let i=1;i<5;i++)best=Math.max(best,once());return best}
  function generateGraderNote(copy,grade){
    if(copy?.blackLabel)return'Perfect centering · corners · edges · surface';
    const notes=[];if(copy?.openingDefect)notes.push(copy.openingDefect);if(copy?.factoryError&&FACTORY_ERROR_DEFS[copy.factoryError])notes.push(`Factory ${FACTORY_ERROR_DEFS[copy.factoryError].name}`);if(copy?.holoPattern&&HOLO_PATTERN_DEFS[copy.holoPattern])notes.push(`${HOLO_PATTERN_DEFS[copy.holoPattern].name} holo pattern`);
    if(!notes.length){if(grade>=9.8)notes.push(Math.random()<.5?'Exceptional centering':'Exceptionally clean surface');else if(grade>=9.2)notes.push(Math.random()<.5?'Strong corners and edges':'Very clean surface');else if(grade<7)notes.push(Math.random()<.5?'Visible edge wear':'Surface and centering variance');else if(grade<8.5)notes.push(Math.random()<.5?'Minor corner wear':'Light surface variance')}
    return notes.slice(0,2).join(' · ')||'No notable defects'
  }
  function formatRemaining(ms){ms=Math.max(0,ms);const sec=Math.ceil(ms/1000),m=Math.floor(sec/60),s=sec%60;return `${m}:${String(s).padStart(2,'0')}`}
  function activeGradingJob(){for(const [id,it] of Object.entries(state.inventory)){for(const [lv,ld] of Object.entries(it.levels||{})){for(const cp of ld.copies||[]){if(cp.gradingUntil&&Date.now()<cp.gradingUntil)return {id,level:+lv,copy:cp,c:cardMap[id]}}}}return null}
  function processCompletedGradings(notify=true){let changed=false;for(const [id,it] of Object.entries(state.inventory)){for(const [lv,ld] of Object.entries(it.levels||{})){for(const cp of ld.copies||[]){if(cp.gradingUntil&&Date.now()>=cp.gradingUntil){cp.grade=cp.pendingGrade||rollGrade();cp.blackLabel=!!cp.pendingBlackLabel&&cp.grade>=10;if(cp.blackLabel)state.quirkStats.blackLabels=(state.quirkStats.blackLabels||0)+1;cp.gradeNote=generateGraderNote(cp,cp.grade);cp.gradedAt=cp.gradingUntil;cp.gradingUntil=null;cp.gradingStartedAt=null;cp.pendingGrade=null;cp.pendingBlackLabel=null;const h=state.history[id]||(state.history[id]={});h.bestGrade=Math.max(h.bestGrade||0,cp.grade);h.grades=(h.grades||0)+1;state.stats.gradesCompleted=(state.stats.gradesCompleted||0)+1;addOverdriveProgress('grade',1);changed=true;if(notify){sfx('grade');if(cp.grade>=9.5)confetti(cp.blackLabel?70:cp.grade===10?45:22);toast(`Grade ${cp.grade.toFixed(1)} · ${gradeLabel(cp.grade,cp)}`,cp.blackLabel?`${cardMap[id]?.name||'Card'} returned with a perfect black label.`:`${cardMap[id]?.name||'Card'} is back from grading.`)}}}}}if(changed){invalidateCollectionValue();markSaveDirty();save()}return changed}
  function eligibleGradeEntries(){return collectionEntries().filter(e=>!e.rep.grade&&!e.rep.gradingUntil&&e.copies.some(cp=>!cp.grade&&!cp.gradingUntil&&!copyIsCampaignCommitted(cp.uid))).sort(sortEntries)}
  function renderGrading(){
    processCompletedGradings(true);const busy=activeGradingJob(),entries=eligibleGradeEntries(),list=$('#gradingList');$('#gradingCount').textContent=busy?'Grader busy':`${entries.length} version${entries.length===1?'':'s'}`;
    list.innerHTML=entries.length?entries.map(e=>{const available=e.copies.filter(cp=>!cp.grade&&!cp.gradingUntil&&!copyIsCampaignCommitted(cp.uid)).length;return `<div class="grading-card-option" style="--rarity:${rarityColor[e.c.rarity]}"><div class="grading-card-shell">${cardHTML(e.c,available,e.rep,e.level)}</div><div class="grading-card-meta"><b>${e.c.name}${e.c.secret?' · SECRET':''}</b><small>${e.c.rarity} · ${e.rep.variant}${e.rep.mutation?' · '+packMutations[e.rep.mutation].name:''}</small><button data-grade-select="${entryKey(e)}" ${busy?'disabled':''}>${busy?'Busy':'Select this card'}</button></div></div>`}).join(''):`<div class="grading-empty" style="padding:40px"><b>${busy?'Grader in use':'No eligible cards'}</b><span>${busy?'Your current card must return before another can be submitted.':'Open packs to find an ungraded card.'}</span></div>`;
    $$('[data-grade-select]').forEach(b=>b.onclick=()=>{gradingSelection=b.dataset.gradeSelect;lastGradeResult=null;renderGradingMachine()});renderGradingMachine()
  }
  function renderGradingMachine(){
    const machine=$('#gradingMachine'),job=activeGradingJob();if(job){const elapsed=Date.now()-(job.copy.gradingStartedAt||Date.now()),duration=Math.max(1,(job.copy.gradingUntil||Date.now())-(job.copy.gradingStartedAt||Date.now())),pct=clamp(elapsed/duration*100,0,100);machine.innerHTML=`<div class="grading-progress"><div class="grading-card-preview" style="margin:auto"><div class="inspect-tilt">${cardHTML(job.c,0,job.copy,job.level)}</div></div><div class="timer">${formatRemaining(job.copy.gradingUntil-Date.now())}</div><div class="progress"><i style="width:${pct}%"></i></div><h3>${job.c.name}</h3><p>Card submitted for authentication and grading. You can leave this page or close the browser; the grading timer is saved.</p></div>`;return}
    if(lastGradeResult){const {c,level,copy}=lastGradeResult;machine.innerHTML=`<div><div class="grading-card-preview"><div class="inspect-tilt graded">${cardHTML(c,0,copy,level)}</div></div><div class="grading-details"><div class="grade-result">${copy.grade.toFixed(1)}</div><h3>${gradeLabel(copy.grade,copy)}</h3><p>${c.name} is now sealed in its collector slab.${copy.gradeNote?`<br><small>${copy.gradeNote}</small>`:''} You can keep it slabbed, or break the case later from Inspect for $2,000 if you want to regrade it.</p><button class="grade-action" id="gradeDone">Grade another card</button></div></div>`;$('#gradeDone').onclick=()=>{lastGradeResult=null;renderGrading()};return}
    if(!gradingSelection){machine.innerHTML='<div class="grading-empty"><b>Select a card to grade</b><span>Submission takes exactly 5 minutes. When it returns, the graded card is displayed in a PSA-style slab. You can break the slab later from Inspect for $2,000 if you want to regrade it.</span></div>';return}
    const k=parseEntryKey(gradingSelection),e=findEntry(k.id,k.level,k.sig);if(!e||e.rep.grade||e.rep.gradingUntil||!e.copies.some(cp=>!cp.grade&&!cp.gradingUntil&&!copyIsCampaignCommitted(cp.uid))){gradingSelection=null;renderGradingMachine();return}const cost=gradeCost(e);machine.innerHTML=`<div><div class="grading-card-preview"><div class="inspect-tilt">${cardHTML(e.c,0,e.rep,e.level)}</div></div><div class="grading-details"><h3>${e.c.name}</h3><p>${e.c.rarity} · ${e.rep.variant} · Level ${e.level}<br>Grading fee: <b>${fmt(cost)}</b><br>Turnaround: <b>5:00</b></p><button class="grade-action" id="gradeNow" ${canAfford(cost)?'':'disabled'}>Submit for grading</button></div></div>`;
    $('#gradeNow').onclick=()=>{if(activeGradingJob()||!spend(cost)){sfx('error');return}const live=findEntry(k.id,k.level,k.sig),copy=live?.copies.find(cp=>!cp.grade&&!cp.gradingUntil&&!copyIsCampaignCommitted(cp.uid));if(!copy)return;const now=Date.now(),rolled=rollGrade(),damage=(copy.openingPenalty||0)+factoryErrorGradePenalty(copy),finalGrade=Math.max(1,Math.round((rolled-damage)*10)/10);copy.gradingStartedAt=now;copy.gradingUntil=now+GRADING_TIME/overdriveBoost();const forceBlack=!!state.adminForces?.blackLabelNext;if(forceBlack){state.adminForces.blackLabelNext=false;copy.pendingGrade=10;copy.pendingBlackLabel=true}else{copy.pendingGrade=finalGrade;copy.pendingBlackLabel=finalGrade>=10&&damage===0&&Math.random()<Math.min(.02,.004*overdriveBoost())}state.stats.gradesSubmitted=(state.stats.gradesSubmitted||0)+1;gradingSelection=null;lastGradeResult=null;sfx('buy');toast('Sent to grading',`${e.c.name} returns in ${formatRemaining(GRADING_TIME/overdriveBoost())}.`);save();renderHUD();renderGrading()}
  }
  function setStatsTab(tab){currentStatsTab=tab;$$('[data-stats-tab]').forEach(b=>b.classList.toggle('active',b.dataset.statsTab===tab));$$('.stats-panel').forEach(p=>p.classList.toggle('hidden',p.id!==`stats-${tab}`));renderStats()}
  $$('[data-stats-tab]').forEach(b=>b.onclick=()=>setStatsTab(b.dataset.statsTab));
  function copiesByVariant(){const out=Object.fromEntries(Object.keys(variantDefs).map(k=>[k,0]));for(const it of Object.values(state.inventory))for(const ld of Object.values(it?.levels||{}))for(const cp of ld.copies||[])out[cp.variant]=(out[cp.variant]||0)+1;return out}
  function copiesByRarity(){const out={};for(const [id,it] of Object.entries(state.inventory)){const c=cardMap[id];if(!c)continue;out[c.secret?'Secret':c.rarity]=(out[c.secret?'Secret':c.rarity]||0)+totalItemCount(it)}return out}
  function renderStats(){const g=state.stats.games||{},net=name=>{const x=g[name]||{};return (x.returned||0)-(x.wagered||0)},tile=(label,val)=>`<div class="stats-kpi"><small>${label}</small><b>${val}</b></div>`,line=(a,b)=>`<div class="deep-stat-line"><span>${a}</span><b>${b}</b></div>`;
    const grid=$('#statsGrid');if(!grid)return;const casinoWager=Object.values(g).reduce((n,x)=>n+(x.wagered||0),0),casinoReturn=Object.values(g).reduce((n,x)=>n+(x.returned||0),0);
    grid.innerHTML=[tile('Cash',fmt(state.cash)),tile('Collection Value',fmt(collectionValue())),tile('Money / Click',fmt(clickValue())),tile('Lifetime Earned',fmt(state.lifetime)),tile('Packs Opened',(state.packsOpened||0).toLocaleString()),tile('Cards Pulled',(state.totalCards||0).toLocaleString()),tile('Campaigns',(state.stats.campaignsCompleted||0).toLocaleString()),tile('Casino Net',(casinoReturn-casinoWager>=0?'+':'')+fmt(casinoReturn-casinoWager))].join('');
    $('#overviewDeepStats').innerHTML=`<div class="deep-stat-card"><h4>Active Play</h4>${line('Coin presses',(state.stats.clicks||0).toLocaleString())}${line('Critical presses',(state.stats.criticals||0).toLocaleString())}${line('Jackpots',(state.stats.jackpots||0).toLocaleString())}${line('Lucky chains started',(state.stats.luckyChainsStarted||0).toLocaleString())}${line('Longest Lucky chain','Step '+(state.stats.longestLuckyChain||0))}</div><div class="deep-stat-card"><h4>Collection</h4>${line('Cards owned',totalCardCount().toLocaleString())}${line('Unique discovered',discoveredCount().toLocaleString())}${line('Cards sold',(state.stats.cardsSold||0).toLocaleString())}${line('Grades completed',(state.stats.gradesCompleted||0).toLocaleString())}${line('Foundry income',fmt(state.foundry?.totalEarned||0))}</div>`;
    const names=[['roulette','Roulette'],['coinflip','Coin Flip'],['mines','Mines'],['plinko','Plinko'],['slots','Slots'],['blackjack','Blackjack']];$('#casinoStatsTable').innerHTML='<div class="stats-row header"><span>Game</span><span>Plays</span><span>Wins</span><span>Losses</span><span>Wagered</span><span>Net</span></div>'+names.map(([id,label])=>{const x=g[id]||{};return `<div class="stats-row"><b>${label}</b><span>${(x.plays||0).toLocaleString()}</span><span>${(x.wins||0).toLocaleString()}</span><span>${(x.losses||0).toLocaleString()}</span><span>${fmt(x.wagered||0)}</span><span style="color:${net(id)>=0?'#72e4a6':'#ff7b8f'}">${net(id)>=0?'+':''}${fmt(net(id))}</span></div>`}).join('');
    $('#setStatsGrid').innerHTML=themes.filter(themeIsVisible).map(t=>{const normal=t.cards.filter(c=>state.discovered[c.id]).length,secrets=t.secretCards.filter(c=>state.discovered[c.id]).length,total=t.allCards.filter(c=>state.discovered[c.id]).length,owned=t.allCards.reduce((n,c)=>n+totalItemCount(state.inventory[c.id]),0),god=!!state.discovered[t.godCard?.id],asc=!!state.discovered[t.ascendantCard?.id];return `<div class="set-stat"><b>${t.emoji} ${t.name}</b><span>${total}/${t.allCards.length} total discovered<br>${normal}/${t.cards.length} standard · ${secrets}/${t.secretCards.length} Secret<br>God ${god?'✓':'—'} · Ascendant ${asc?'✓':'—'}<br>${owned.toLocaleString()} cards owned</span></div>`}).join('');
    const vr=copiesByVariant(),rr=copiesByRarity();$('#variantStatsGrid').innerHTML=[...Object.entries(rr).map(([k,v])=>`<div class="variant-stat"><small>${k}</small><b>${v.toLocaleString()}</b></div>`),...Object.entries(vr).map(([k,v])=>`<div class="variant-stat"><small>${k}</small><b>${v.toLocaleString()}</b></div>`)].join('');
    $('#packTierStats').innerHTML=`<div class="stats-kpi"><small>Packs Bought</small><b>${(state.stats.packsBought||0).toLocaleString()}</b></div><div class="stats-kpi"><small>Packs in Bag</small><b>${themes.reduce((n,t)=>n+(state.packInventory[t.id]||0),0).toLocaleString()}</b></div>`;$('#packStatsTable').innerHTML='<div class="stats-row header"><span>Set</span><span>Type</span><span>Opened</span><span>Owned</span><span>Discovered</span><span>Value Base</span></div>'+themes.filter(themeIsVisible).map(t=>`<div class="stats-row"><b>${t.name}</b><span>—</span><span>${(state.stats.packOpenedByTheme[t.id]||0).toLocaleString()}</span><span>${(state.packInventory[t.id]||0).toLocaleString()}</span><span>${t.allCards.filter(c=>state.discovered[c.id]).length}/${t.allCards.length}</span><span>${fmt(t.base)}</span></div>`).join('');
    $('#campaignStatsGrid').innerHTML=[tile('Started',(state.stats.campaignsStarted||0).toLocaleString()),tile('Completed',(state.stats.campaignsCompleted||0).toLocaleString()),tile('Power Sent',Math.round(state.stats.campaignPowerSent||0).toLocaleString()),tile('Campaign Time',`${Math.round(state.stats.campaignMinutes||0).toLocaleString()} min`),tile('Cash Rewards',fmt(state.stats.campaignCash||0)),tile('Packs Won',(state.stats.campaignPacksWon||0).toLocaleString()),tile('Special Packs',(state.stats.campaignSpecialsWon||0).toLocaleString())].join('');$('#campaignDeepStats').innerHTML=`<div class="deep-stat-card"><h4>Scaling</h4>${line('Current slow-scale bonus','+'+(Math.min(.35,(state.campaigns.completed?.total||0)*.0015)*100).toFixed(1)+'% Power')}${line('Offer Power range','500–30,000')}${line('Hidden set find','Rare campaign reward')}${line('Manual refresh','15 minutes')}${line('Active campaign',activeCampaign()?activeCampaign().offer?.name||'Running':'None')}</div><div class="deep-stat-card"><h4>Campaign Timing</h4>${line('Shortest base offer','2 minutes')}${line('Longest base offer','20 minutes')}${line('Maximum Power speedup','10×')}${line('30k offers','Rare')}</div>`;
    $('#economyStatsGrid').innerHTML=[tile('Lifetime Received',fmt(state.lifetime)),tile('Lifetime Spent',fmt(state.stats.cashSpent||0)),tile('Card Sale Cash',fmt(state.stats.cashFromSales||0)),tile('Current Cash',fmt(state.cash)),tile('Casino Wagered',fmt(casinoWager)),tile('Casino Returned',fmt(casinoReturn)),tile('Packs Bought',(state.stats.packsBought||0).toLocaleString()),tile('Upgrades Bought',(state.stats.upgradesBought||0).toLocaleString())].join('');$('#economyDeepStats').innerHTML=`<div class="deep-stat-card"><h4>Current Economy</h4>${line('Core pack price',fmt(PACK_PRICES[1]))}${line('Hidden pack price',fmt(1000))}${line('Campaign max Power','30,000')}${line('Collection value',fmt(collectionValue()))}</div><div class="deep-stat-card"><h4>Acquisition</h4>${line('Free pack drops',(state.stats.packDrops||0).toLocaleString())}${line('Campaign packs won',(state.stats.campaignPacksWon||0).toLocaleString())}${line('Special packs in Bag',(state.specialPackInventory||[]).length.toLocaleString())}${line('Normal packs in Bag',themes.reduce((n,t)=>n+(state.packInventory[t.id]||0),0).toLocaleString())}</div>`;
    if($('#recordStatsGrid')){const entries=collectionEntries(),best=entries.slice().sort((a,b)=>effectiveCardValue(b.c,b.level,b.rep)-effectiveCardValue(a.c,a.level,a.rep))[0],highest=entries.slice().sort((a,b)=>b.level-a.level)[0],graded=entries.filter(e=>e.rep.grade).sort((a,b)=>(b.rep.grade||0)-(a.rep.grade||0))[0];$('#recordStatsGrid').innerHTML=[tile('Most Valuable Card',best?fmt(effectiveCardValue(best.c,best.level,best.rep)):'—'),tile('Highest Level',highest?`Lv ${highest.level}`:'—'),tile('Best Grade',graded?graded.rep.grade.toFixed(1):'—'),tile('Favorites',Object.keys(state.favorites||{}).length.toLocaleString()),tile('Hidden Sets Found',(state.stats.hiddenSetsFound||0).toLocaleString()),tile('Lucky Returns',(state.stats.luckyReturns||0).toLocaleString()),tile('Biggest Casino Win',fmt(state.casino.biggestWin||0)),tile('Longest Chain','Step '+(state.stats.longestLuckyChain||0))].join('');$('#recordDeepStats').innerHTML=`<div class="deep-stat-card"><h4>Card Records</h4>${line('Most valuable',best?best.c.name:'—')}${line('Highest level card',highest?highest.c.name:'—')}${line('Best graded card',graded?graded.c.name:'—')}</div><div class="deep-stat-card"><h4>Progress Records</h4>${line('Complete sets',completedSets().toLocaleString())}${line('Unique discovered',discoveredCount().toLocaleString())}${line('Hidden shop offers active',themes.filter(t=>t.campaignHidden&&hiddenOfferRemaining(t.id)>0).length.toLocaleString())}</div>`}
    const st=$('#statsSaveStatus');if(st)st.textContent=`Autosave active · last save ${new Date(state.lastTick||Date.now()).toLocaleTimeString([], {hour:'numeric',minute:'2-digit',second:'2-digit'})}`}
  function renderHUD(){
    renderOverdrive();$('#cashTop').textContent=fmt(state.cash);$('#collectionTop').textContent=fmt(collectionValue());const casinoCash=$('#casinoCashReadout');if(casinoCash)casinoCash.textContent=fmt(state.cash);const boosted=Date.now()<(state.clickBoostUntil||0)?' · ×2 JACKPOT BOOST':'';$('#clickValueText').textContent=`${fmt(clickValue())} per press${boosted}`;const fx=$('#activeEffects');if(fx){const now=Date.now(),active=Object.entries(state.activePotions||{}).filter(([id,a])=>a&&a.until>now&&potionDefs[id]);fx.innerHTML=active.map(([id,a])=>{const d=potionDefs[id];return `<span class="effect-pill" title="${d.name}: ${d.desc} · ${campaignTime(a.until-now)} remaining">${d.emoji}<small>${campaignTime(a.until-now)}</small></span>`}).join('')}}
  function renderAll(){cleanShowcaseSlots();renderHUD();applyPerformanceSettings();if(!$('#view-shop').classList.contains('hidden')){renderShop();if(currentShopTab==='upgrades')renderUpgrades()}if(!$('#view-casino').classList.contains('hidden'))renderCasino();if(!$('#view-collection').classList.contains('hidden'))renderBag();if(!$('#view-campaigns').classList.contains('hidden'))renderCampaigns();if(!$('#view-grading').classList.contains('hidden'))renderGrading();if(!$('#view-stats').classList.contains('hidden'))renderStats();$('#soundToggle').classList.toggle('on',state.sound);updateBagCounts()}
  function toast(title,sub){const old=$('.toast');if(old)old.remove();const t=document.createElement('div');t.className='toast';t.innerHTML=`<b>${title}</b><small>${sub}</small>`;document.body.appendChild(t);setTimeout(()=>t.remove(),3200)}
  function confetti(n=20){const low=document.body.classList.contains('quality-performance')||document.body.classList.contains('particles-minimal')||document.body.classList.contains('anti-lag-aggressive'),count=Math.min(Math.max(0,Math.floor(n||0)),low?12:45);for(let i=0;i<count;i++){const e=document.createElement('i');e.className='confetti';e.style.left=(50+Math.random()*8-4)+'vw';e.style.top=(45+Math.random()*8-4)+'vh';e.style.background=['#ffb84e','#65d685','#5fa9ff','#bd77ff','#ff5a6f','#fff'][i%6];e.style.setProperty('--x',(Math.random()*520-260)+'px');e.style.setProperty('--y',(Math.random()*380-190)+'px');document.body.appendChild(e);setTimeout(()=>e.remove(),1100)}}
  let achievementFilter='all',achievementToastQueue=[],achievementToastBusy=false;
  const achievementCoreIds=['medieval','food','ocean','space','monsters'];
  const achievementDifficultyColor={Starter:'#72e4a6',Collector:'#69b7ff',Advanced:'#bd77ff',Hard:'#ffb84e',Brutal:'#ff596f',Secret:'#ffffff'};
  function ensureAchievementState(){
    state.achievements=state.achievements||{};
    state.achievements.unlocked=state.achievements.unlocked||{};
    state.achievements.meta=state.achievements.meta||{};
    const m=state.achievements.meta;
    m.variantsEver=m.variantsEver||{};m.rarityEver=m.rarityEver||{};m.mutationsEver=m.mutationsEver||{};m.potionsUsed=m.potionsUsed||{};
    m.astroPlanets=m.astroPlanets||{};m.astroPages=m.astroPages||{};m.astroDistances=m.astroDistances||{};m.boughtThemes=m.boughtThemes||{};
    return state.achievements;
  }
  ensureAchievementState();
  function achMeta(){return ensureAchievementState().meta}
  function serialNumber(copy){const m=String(copy?.serial||'').match(/#\s*(\d+)/);return m?+m[1]:999999}
  function achievementSnapshot(){
    const copies=[],uniqueOwned=new Set(),variants=new Set(),rarities=new Set(),ownedThemes=new Set(),secretThemes=new Set(),locked=[],grades=[],levels=[],mutationSet=new Set();
    let maxPower=0,maxValue=0,secretCount=0;
    for(const [id,it] of Object.entries(state.inventory||{})){
      const card=cardMap[id];if(!card)continue;
      for(const [lv,ld] of Object.entries(it.levels||{}))for(const cp of (ld.copies||[])){
        const level=+lv||1;copies.push({card,copy:cp,level});uniqueOwned.add(card.id);ownedThemes.add(card.theme);variants.add(cp.variant||'Normal');rarities.add(card.rarity);if(cp.mutation)mutationSet.add(cp.mutation);if(card.secret){secretCount++;secretThemes.add(card.theme)}if(cp.locked)locked.push(cp);if(cp.grade)grades.push({grade:+cp.grade,card,copy:cp});levels.push(level);maxPower=Math.max(maxPower,effectiveCardPower(card,level,cp));maxValue=Math.max(maxValue,effectiveCardValue(card,level,cp));
        const meta=achMeta();meta.variantsEver[cp.variant||'Normal']=true;meta.rarityEver[card.rarity]=true;if(cp.mutation)meta.mutationsEver[cp.mutation]=true;
      }
    }
    const coreThemes=achievementCoreIds.map(id=>themes.find(t=>t.id===id)).filter(Boolean);
    const discovered=id=>!!state.discovered?.[id];
    const rarityComplete=(theme,rarity)=>theme.cards.filter(c=>c.rarity===rarity).every(c=>discovered(c.id));
    const coreRegularDiscovered=coreThemes.reduce((n,t)=>n+t.cards.filter(c=>discovered(c.id)).length,0);
    const secretByTheme=Object.fromEntries(coreThemes.map(t=>[t.id,t.secretCards.filter(c=>uniqueOwned.has(c.id)).length]));
    const rarityPlusByTheme=(minRarity)=>Object.fromEntries(coreThemes.map(t=>[t.id,t.allCards.some(c=>uniqueOwned.has(c.id)&&(c.secret||rarityOrder.indexOf(c.rarity)>=rarityOrder.indexOf(minRarity)))]));
    return {copies,uniqueOwned,variants,rarities,ownedThemes,secretThemes,secretCount,lockedCount:locked.length,grades,levels,maxPower,maxValue,collectionValue:collectionValue(),coreThemes,coreRegularDiscovered,secretByTheme,rarityComplete,rarityPlusByTheme,totalCards:copies.length,favorites:new Set(Object.keys(state.favorites||{}).filter(k=>state.favorites[k])),meta:achMeta()}
  }
  const ACHIEVEMENTS=[
    {id:'first_press',icon:'◉',name:'First Press',desc:'Press The Coin for the first time.',cat:'Coin',tier:'Starter',check:s=>(state.stats.clicks||0)>=1},
    {id:'critical_moment',icon:'✹',name:'Critical Moment',desc:'Land your first critical Coin press.',cat:'Coin',tier:'Starter',check:s=>(state.stats.criticals||0)>=1},
    {id:'coin_jackpot',icon:'💥',name:'The Coin Screamed',desc:'Trigger a Coin jackpot.',cat:'Coin',tier:'Advanced',check:s=>(state.stats.jackpots||0)>=1},
    {id:'pack_from_nowhere',icon:'📦',name:'Pack From Nowhere',desc:'Find a free pack directly from a Coin press.',cat:'Coin',tier:'Advanced',check:s=>(state.stats.packDrops||0)>=1},
    {id:'combo_25',icon:'⚡',name:'Keep It Moving',desc:'Reach 25 clicks in one active Combo.',cat:'Coin',tier:'Starter',check:s=>(s.meta.maxCombo||0)>=25},
    {id:'combo_100',icon:'🌪️',name:'Hundred-Click Rush',desc:'Reach 100 clicks before your Combo expires.',cat:'Coin',tier:'Hard',check:s=>(s.meta.maxCombo||0)>=100},
    {id:'five_figures',icon:'💵',name:'Five Figures',desc:'Hold at least $10,000 cash at one time.',cat:'Economy',tier:'Advanced',check:s=>(s.meta.maxCash||0)>=10000},
    {id:'million_motion',icon:'🏦',name:'A Million in Motion',desc:'Earn $1,000,000 over the lifetime of the save.',cat:'Economy',tier:'Hard',check:s=>(state.lifetime||0)>=1000000},
    {id:'upgrade_sampler',icon:'🧰',name:'Upgrade Sampler',desc:'Own at least one level of every upgrade.',cat:'Upgrades',tier:'Advanced',check:s=>[state.warehouseLevel,state.kioskLevel,state.variantLensLevel,state.autoLevel,state.lineLevel,state.campaignPrepLevel,state.engineLevel].every(x=>(x||0)>=1)},
    {id:'balanced_build',icon:'⚖️',name:'Perfectly Balanced',desc:'Have all seven upgrade levels exactly equal at Level 5 or higher.',cat:'Upgrades',tier:'Brutal',check:s=>{const a=[state.warehouseLevel,state.kioskLevel,state.variantLensLevel,state.autoLevel,state.lineLevel,state.campaignPrepLevel,state.engineLevel].map(x=>x||0);return Math.min(...a)>=5&&a.every(x=>x===a[0])}},
    {id:'first_pack',icon:'▣',name:'Crack the Seal',desc:'Open your first pack.',cat:'Packs',tier:'Starter',check:s=>(state.packsOpened||0)>=1},
    {id:'five_flavors',icon:'🗂️',name:'Five Flavors',desc:'Open at least one pack from each of the five original sets.',cat:'Packs',tier:'Advanced',check:s=>achievementCoreIds.every(id=>(state.stats.packOpenedByTheme?.[id]||0)>0)},
    {id:'clean_slice',icon:'✂️',name:'Surgeon Hands',desc:'Manually open a pack with a completely clean cut.',cat:'Opening',tier:'Starter',check:s=>(s.meta.cleanCuts||0)>=1},
    {id:'deep_cut',icon:'🩹',name:'You Cut the Cards',desc:'Make a severe manual cut that earns the full grading-risk penalty.',cat:'Opening',tier:'Advanced',check:s=>(s.meta.severeCuts||0)>=1},
    {id:'auto_loader',icon:'⏩',name:'Auto Loader',desc:'Start an Auto Open batch containing at least 10 packs.',cat:'Opening',tier:'Advanced',check:s=>(s.meta.autoBatchMax||0)>=10},
    {id:'no_commons',icon:'🚫',name:'Where Are the Commons?',desc:'Open a five-card pack containing no Common cards.',cat:'Packs',tier:'Hard',check:s=>!!s.meta.noCommonPack},
    {id:'two_epics',icon:'✦',name:'Double Trouble',desc:'Pull at least two Epic-or-better cards from the same pack.',cat:'Packs',tier:'Hard',check:s=>!!s.meta.twoEpicPack},
    {id:'mythic_pull',icon:'🔴',name:'Red Alert',desc:'Pull a Mythic card.',cat:'Rarity',tier:'Advanced',check:s=>!!s.meta.rarityEver.Mythic},
    {id:'divine_pull',icon:'💠',name:'Divine Intervention',desc:'Pull a Divine card.',cat:'Rarity',tier:'Hard',check:s=>!!s.meta.rarityEver.Divine},
    {id:'ultra_pull',icon:'🌈',name:'Ultra Arrival',desc:'Pull an Ultra card.',cat:'Rarity',tier:'Brutal',check:s=>!!s.meta.rarityEver.Ultra},
    {id:'secret_pull',icon:'✧',name:'White Flash',desc:'Pull a Secret card.',cat:'Rarity',tier:'Secret',check:s=>!!s.meta.rarityEver.Secret},
    {id:'special_delivery',icon:'✦',name:'Special Delivery',desc:'Open a pack that contains at least one special-pack treated card.',cat:'Special Packs',tier:'Advanced',check:s=>Object.keys(s.meta.mutationsEver).length>0},
    {id:'lucky_pulse',icon:'🍀',name:'Lucky Pulse',desc:'Pull a Lucky Pulse special card.',cat:'Special Packs',tier:'Advanced',check:s=>!!s.meta.mutationsEver.luckypulse},
    {id:'holo_surge',icon:'🫧',name:'Holo Surge',desc:'Pull a Holo Surge special card.',cat:'Special Packs',tier:'Advanced',check:s=>!!s.meta.mutationsEver.holosurge},
    {id:'void_bloom',icon:'🌌',name:'Void Bloom',desc:'Pull a Void Bloom special card.',cat:'Special Packs',tier:'Hard',check:s=>!!s.meta.mutationsEver.voidbloom},
    {id:'prism_rift',icon:'🔷',name:'Prism Rift',desc:'Pull a Prism Rift special card.',cat:'Special Packs',tier:'Hard',check:s=>!!s.meta.mutationsEver.prismrift},
    {id:'two_special_cards',icon:'²',name:'Two Treated',desc:'Get two special-pack treated cards in a single pack.',cat:'Special Packs',tier:'Advanced',check:s=>(s.meta.maxSpecialCards||0)>=2},
    {id:'three_special_cards',icon:'³',name:'Triple Treated',desc:'Get three special-pack treated cards in a single pack.',cat:'Special Packs',tier:'Brutal',check:s=>(s.meta.maxSpecialCards||0)>=3},
    {id:'chain_reaction',icon:'🔗',name:'Chain Reaction',desc:'Push a Lucky Pack Chain all the way to Step 6.',cat:'Packs',tier:'Hard',check:s=>(state.stats.longestLuckyChain||0)>=6},
    {id:'five_foundations',icon:'◆',name:'Five Foundations',desc:'Own at least one card from each original set.',cat:'Collection',tier:'Starter',check:s=>achievementCoreIds.every(id=>s.ownedThemes.has(id))},
    {id:'curators_picks',icon:'★',name:"Curator's Picks",desc:'Favorite 10 different cards.',cat:'Collection',tier:'Advanced',check:s=>s.favorites.size>=10},
    {id:'rare_tour',icon:'🔵',name:'Rare Tour',desc:'Own a Rare-or-better card from every original set.',cat:'Collection',tier:'Advanced',check:s=>Object.values(s.rarityPlusByTheme('Rare')).every(Boolean)},
    {id:'epic_tour',icon:'🟣',name:'Epic Tour',desc:'Own an Epic-or-better card from every original set.',cat:'Collection',tier:'Hard',check:s=>Object.values(s.rarityPlusByTheme('Epic')).every(Boolean)},
    {id:'core_century',icon:'💯',name:'Core Century',desc:'Discover 100 different regular cards across the five original sets.',cat:'Collection',tier:'Advanced',check:s=>s.coreRegularDiscovered>=100},
    {id:'half_forge',icon:'◐',name:'Half the Forge',desc:'Discover 250 regular cards across the five original sets.',cat:'Collection',tier:'Hard',check:s=>s.coreRegularDiscovered>=250},
    {id:'first_complete_set',icon:'📘',name:'Binder Complete',desc:'Discover every standard card in any original expanded set.',cat:'Collection',tier:'Hard',check:s=>s.coreThemes.some(t=>t.cards.every(c=>!!state.discovered[c.id]))},
    {id:'all_core_sets',icon:'📚',name:'Five Full Binders',desc:'Complete all five original expanded sets.',cat:'Collection',tier:'Brutal',check:s=>s.coreThemes.every(t=>t.cards.every(c=>!!state.discovered[c.id]))},
    {id:'common_sweep',icon:'⬜',name:'Common Sweep',desc:'Discover every Common in one original set.',cat:'Collection',tier:'Advanced',check:s=>s.coreThemes.some(t=>s.rarityComplete(t,'Common'))},
    {id:'uncommon_sweep',icon:'🟩',name:'Uncommon Knowledge',desc:'Discover every Uncommon in one original set.',cat:'Collection',tier:'Advanced',check:s=>s.coreThemes.some(t=>s.rarityComplete(t,'Uncommon'))},
    {id:'rare_sweep',icon:'🟦',name:'Rare Form',desc:'Discover every Rare in one original set.',cat:'Collection',tier:'Hard',check:s=>s.coreThemes.some(t=>s.rarityComplete(t,'Rare'))},
    {id:'epic_sweep',icon:'🟪',name:'Epic Sweep',desc:'Discover every Epic in one original set.',cat:'Collection',tier:'Hard',check:s=>s.coreThemes.some(t=>s.rarityComplete(t,'Epic'))},
    {id:'legendary_sweep',icon:'🟨',name:'Legendary Cabinet',desc:'Discover every Legendary in one original set.',cat:'Collection',tier:'Brutal',check:s=>s.coreThemes.some(t=>s.rarityComplete(t,'Legendary'))},
    {id:'mythic_pair',icon:'🔴',name:'Mythic Pair',desc:'Discover both Mythics from the same original set.',cat:'Collection',tier:'Hard',check:s=>s.coreThemes.some(t=>s.rarityComplete(t,'Mythic'))},
    {id:'divine_pair',icon:'🩵',name:'Divine Pair',desc:'Discover both Divines from the same original set.',cat:'Collection',tier:'Brutal',check:s=>s.coreThemes.some(t=>s.rarityComplete(t,'Divine'))},
    {id:'ultra_instinct',icon:'🌈',name:'Double Rainbow',desc:'Own two different Ultra card identities at the same time.',cat:'Collection',tier:'Brutal',check:s=>new Set(s.copies.filter(x=>x.card.rarity==='Ultra').map(x=>x.card.id)).size>=2},
    {id:'secret_society',icon:'✧',name:'Secret Society',desc:'Own three Secret cards at the same time.',cat:'Collection',tier:'Secret',check:s=>s.secretCount>=3},
    {id:'secret_triangle',icon:'△',name:'Secret Triangle',desc:'Own a Secret from three different original sets.',cat:'Collection',tier:'Brutal',check:s=>achievementCoreIds.filter(id=>s.secretThemes.has(id)).length>=3},
    {id:'secret_pentacle',icon:'☆',name:'Secret Pentacle',desc:'Own at least one Secret from all five original sets.',cat:'Collection',tier:'Secret',check:s=>achievementCoreIds.every(id=>s.secretThemes.has(id))},
    {id:'secret_quartet',icon:'✦',name:'The Full Hidden Page',desc:'Own all four Secret cards from one original set.',cat:'Collection',tier:'Secret',check:s=>Object.values(s.secretByTheme).some(n=>n>=4)},
    {id:'white_vault',icon:'🤍',name:'White Vault',desc:'Own 10 Secret cards at the same time.',cat:'Collection',tier:'Secret',check:s=>s.secretCount>=10},
    {id:'all_rarities',icon:'🎨',name:'One of Every Color',desc:'Own all nine rarities from Common through Secret.',cat:'Collection',tier:'Brutal',check:s=>['Common','Uncommon','Rare','Epic','Legendary','Mythic','Divine','Ultra','Secret'].every(r=>s.rarities.has(r))},
    {id:'powerhouse',icon:'⚡',name:'Five-Digit Power',desc:'Own a card with at least 10,000 printed Power.',cat:'Collection',tier:'Secret',check:s=>s.maxPower>=10000},
    {id:'million_collection',icon:'🏛️',name:'Million-Dollar Collection',desc:'Reach $1,000,000 total current collection value.',cat:'Collection',tier:'Brutal',check:s=>s.collectionValue>=1000000},
    {id:'foil_first',icon:'◩',name:'First Foil',desc:'Own a Foil variant.',cat:'Variants',tier:'Starter',check:s=>!!s.meta.variantsEver.Foil},
    {id:'holo_first',icon:'◉',name:'First Holo',desc:'Own a Holo variant.',cat:'Variants',tier:'Advanced',check:s=>!!s.meta.variantsEver.Holo},
    {id:'gold_first',icon:'◆',name:'Gold Standard',desc:'Own a Gold variant.',cat:'Variants',tier:'Hard',check:s=>!!s.meta.variantsEver.Gold},
    {id:'prismatic_first',icon:'◇',name:'Prismatic',desc:'Own a Prismatic variant.',cat:'Variants',tier:'Brutal',check:s=>!!s.meta.variantsEver.Prismatic},
    {id:'serialized_first',icon:'#',name:'Numbered',desc:'Own a Serialized card.',cat:'Variants',tier:'Brutal',check:s=>!!s.meta.variantsEver.Serialized},
    {id:'variant_spectrum',icon:'🌈',name:'Variant Spectrum',desc:'Have discovered every non-Normal variant type.',cat:'Variants',tier:'Secret',check:s=>['Foil','Holo','Gold','Prismatic','Serialized','Nebula'].every(v=>!!s.meta.variantsEver[v])},
    {id:'foil_favorite',icon:'★',name:'Foil Favorite',desc:'Favorite a card that you own as a Foil.',cat:'Variants',tier:'Advanced',check:s=>s.copies.some(x=>x.copy.variant==='Foil'&&s.favorites.has(x.card.id))},
    {id:'holo_slab',icon:'🪩',name:'Holo in Plastic',desc:'Own a graded Holo card.',cat:'Variants',tier:'Advanced',check:s=>s.copies.some(x=>x.copy.variant==='Holo'&&x.copy.grade)},
    {id:'gold_grade',icon:'🏅',name:'Golden Grade',desc:'Grade a Gold card 8.0 or higher.',cat:'Variants',tier:'Hard',check:s=>s.copies.some(x=>x.copy.variant==='Gold'&&(x.copy.grade||0)>=8)},
    {id:'prismatic_secret',icon:'✧',name:'Impossible Spectrum',desc:'Own a Secret card with the Prismatic variant.',cat:'Variants',tier:'Secret',check:s=>s.copies.some(x=>x.card.secret&&x.copy.variant==='Prismatic')},
    {id:'serial_50',icon:'#50',name:'Top Fifty',desc:'Own a Serialized card numbered #50 or better.',cat:'Serialized',tier:'Hard',check:s=>s.copies.some(x=>x.copy.variant==='Serialized'&&serialNumber(x.copy)<=50)},
    {id:'serial_10',icon:'#10',name:'Top Ten',desc:'Own a Serialized card numbered #10 or better.',cat:'Serialized',tier:'Brutal',check:s=>s.copies.some(x=>x.copy.variant==='Serialized'&&serialNumber(x.copy)<=10)},
    {id:'serial_one',icon:'#1',name:'Number One',desc:'Own Serialized card #1.',cat:'Serialized',tier:'Secret',check:s=>s.copies.some(x=>x.copy.variant==='Serialized'&&serialNumber(x.copy)===1)},
    {id:'serialized_secret',icon:'✧#',name:'The White Number',desc:'Own a Serialized Secret card.',cat:'Serialized',tier:'Secret',check:s=>s.copies.some(x=>x.card.secret&&x.copy.variant==='Serialized')},
    {id:'first_grade',icon:'▱',name:'Slabbed',desc:'Complete your first card grading.',cat:'Grading',tier:'Starter',check:s=>(state.stats.gradesCompleted||0)>=1},
    {id:'grade_seven',icon:'7',name:'Seven Club',desc:'Own a graded card from 7.0 through 7.9.',cat:'Grading',tier:'Starter',check:s=>s.grades.some(x=>x.grade>=7&&x.grade<8)},
    {id:'grade_eight',icon:'8',name:'Eight Club',desc:'Own a graded card from 8.0 through 8.9.',cat:'Grading',tier:'Starter',check:s=>s.grades.some(x=>x.grade>=8&&x.grade<9)},
    {id:'grade_nine',icon:'9',name:'Nine Club',desc:'Own a graded card from 9.0 through 9.9.',cat:'Grading',tier:'Advanced',check:s=>s.grades.some(x=>x.grade>=9&&x.grade<10)},
    {id:'grade_ten',icon:'10',name:'Gem Mint',desc:'Own a card graded exactly 10.0.',cat:'Grading',tier:'Hard',check:s=>s.grades.some(x=>x.grade===10)},
    {id:'break_slab',icon:'🔨',name:'Crack the Case',desc:'Pay to break a grading slab.',cat:'Grading',tier:'Advanced',check:s=>(state.stats.slabsBroken||0)>=1},
    {id:'second_opinion',icon:'↻',name:'Second Opinion',desc:'Have the same card identity complete grading at least twice.',cat:'Grading',tier:'Hard',check:s=>Object.values(state.history||{}).some(h=>(h?.grades||0)>=2)},
    {id:'level_five',icon:'Ⅴ',name:'Five Into One',desc:'Fuse a card all the way to Level 5.',cat:'Fusion',tier:'Hard',check:s=>Math.max(0,...s.levels)>=5},
    {id:'first_campaign',icon:'✦',name:'On Exhibition',desc:'Complete your first campaign.',cat:'Campaigns',tier:'Starter',check:s=>(state.stats.campaignsCompleted||0)>=1},
    {id:'solo_campaign',icon:'①',name:'Solo Act',desc:'Launch a campaign using exactly one card.',cat:'Campaigns',tier:'Advanced',check:s=>(s.meta.soloCampaigns||0)>=1},
    {id:'overkill_campaign',icon:'×5',name:'Overqualified',desc:'Launch a campaign with at least five times its required Power.',cat:'Campaigns',tier:'Hard',check:s=>(s.meta.overkillCampaigns||0)>=1},
    {id:'speed_campaign',icon:'⏱️',name:'Express Curator',desc:'Use Power and upgrades to launch a campaign with an actual duration of 3 minutes or less.',cat:'Campaigns',tier:'Hard',check:s=>(s.meta.fastCampaigns||0)>=1},
    {id:'hidden_discovery',icon:'?',name:'Hidden Collection',desc:'Discover a hidden campaign set.',cat:'Campaigns',tier:'Hard',check:s=>(state.stats.hiddenSetsFound||0)>=1},
    {id:'sold_out_hidden',icon:'10',name:'Bought the Whole Drop',desc:'Buy all 10 available packs from one discovered hidden-set offer.',cat:'Campaigns',tier:'Hard',check:s=>(s.meta.hiddenOfferSoldOut||0)>=1},
    {id:'campaign_specials_10',icon:'🎁',name:'Campaign Supplier',desc:'Win 10 specialty rewards from Campaigns.',cat:'Campaigns',tier:'Hard',check:s=>(state.stats.campaignSpecialsWon||0)>=10},
    {id:'pack_seller_50',icon:'📦',name:'Pack Broker',desc:'Sell 50 unopened packs.',cat:'Packs',tier:'Advanced',check:s=>(state.stats.packsSold||0)>=50},
    {id:'campaign_powerhouse',icon:'50K',name:'Powerhouse',desc:'Send at least 50,000 total campaign Power.',cat:'Campaigns',tier:'Hard',check:s=>(state.stats.campaignPowerSent||0)>=50000},
    {id:'campaign_specials_25',icon:'🎁+',name:'Curator Haul',desc:'Win 25 specialty rewards from Campaigns.',cat:'Campaigns',tier:'Brutal',check:s=>(state.stats.campaignSpecialsWon||0)>=25},
    {id:'casino_win',icon:'♠',name:'House Guest',desc:'Finish any casino game with more returned than wagered.',cat:'Casino',tier:'Starter',check:s=>(state.casino.wins||0)>=1},
    {id:'casino_tour',icon:'🎰',name:'Casino Tourist',desc:'Play Roulette, Coin Flip, Mines, Plinko, Slots, and Blackjack at least once each.',cat:'Casino',tier:'Advanced',check:s=>['roulette','coinflip','mines','plinko','slots','blackjack'].every(k=>(state.stats.games?.[k]?.plays||0)>0)},
    {id:'high_roller',icon:'💸',name:'High Roller',desc:'Place at least $1,000 on a single casino game.',cat:'Casino',tier:'Hard',check:s=>(s.meta.maxWager||0)>=1000},
    {id:'crash_five',icon:'🃏',name:'Natural 21',desc:'Be dealt a natural blackjack.',cat:'Casino',tier:'Hard',check:s=>(s.meta.blackjackNaturals||0)>=1},
    {id:'plinko_edge',icon:'🟠',name:'Edge Pocket',desc:'Land in a Plinko slot worth at least 20×.',cat:'Casino',tier:'Brutal',check:s=>(s.meta.maxPlinko||0)>=20},
    {id:'mystery_jackpot',icon:'💣',name:'Bomb Squad',desc:'Reveal at least 10 safe Mines tiles in one run.',cat:'Casino',tier:'Hard',check:s=>(s.meta.maxMinesSafe||0)>=10},
    {id:'planet_hopper',icon:'ψ',name:'Quantum Foundations',desc:'Inspect all six core quantum-mechanics principles on the Quanta Physics page.',cat:'Physics',tier:'Advanced',check:s=>Object.keys(s.meta.astroPlanets).length>=6},
    {id:'all_chapters',icon:'📖',name:'Read the Equations',desc:'Visit all five Quanta physics chapters.',cat:'Physics',tier:'Starter',check:s=>['home','solar','stars','deep','missions'].every(k=>!!s.meta.astroPages[k])},
    {id:'distance_ladder',icon:'μ',name:'Reference Table',desc:'Inspect seven force or particle reference entries on the Quanta Physics page.',cat:'Physics',tier:'Advanced',check:s=>Object.keys(s.meta.astroDistances).length>=7},
    {id:'perfect_quiz',icon:'✓',name:'Perfect Physics',desc:'Score 3 out of 3 on the Quanta physics quiz.',cat:'Physics',tier:'Hard',check:s=>!!s.meta.perfectQuiz},
    {id:'v318_apology',icon:'♥',name:'Second Chance',desc:'Claim the v3.18 economy-reset thank-you pack.',cat:'Packs',tier:'Starter',check:s=>!!state.v318ApologyClaimed},
    {id:'v318_version_bonus',icon:'V',name:'Read the Patch Notes',desc:'Use the V counter bonus at least once.',cat:'Economy',tier:'Starter',check:s=>(state.stats.versionBonuses||0)>=1},
    {id:'v318_foundry_1k',icon:'🏭',name:'Night Shift',desc:'Earn $1,000 from the Foundry.',cat:'Economy',tier:'Advanced',check:s=>(state.foundry?.totalEarned||0)>=1000},
    {id:'v318_semigod',icon:'✦',name:'Mercy Pack',desc:'Open a Semi-God Pack.',cat:'Packs',tier:'Hard',check:s=>(state.quirkStats?.semiGodPacks||0)>=1},
    {id:'v318_colin',icon:'CB',name:'Statistical Error',desc:'Own Colin Barnes.',cat:'Collection',tier:'Secret',check:s=>!!state.inventory?.colin_barnes_0}
  ];
  if(ACHIEVEMENTS.length!==100)console.error('PackForge achievement count must be 100, got',ACHIEVEMENTS.length);
  const hardestAchievementIds=new Set(ACHIEVEMENTS.filter(a=>['Brutal','Secret'].includes(a.tier)).map(a=>a.id));
  function achievementById(id){return ACHIEVEMENTS.find(a=>a.id===id)}
  function unlockedAchievementCount(){return Object.keys(ensureAchievementState().unlocked).filter(id=>achievementById(id)).length}
  function queueAchievementToast(a){achievementToastQueue.push(a);pumpAchievementToasts()}
  function pumpAchievementToasts(){if(achievementToastBusy||!achievementToastQueue.length)return;achievementToastBusy=true;const a=achievementToastQueue.shift(),c=achievementDifficultyColor[a.tier]||'#72e4a6',el=document.createElement('div');el.className='achievement-unlock-toast';el.style.setProperty('--c',c);el.innerHTML=`<div class="ico">${a.icon}</div><div><div class="kicker">ACHIEVEMENT UNLOCKED · ${a.tier.toUpperCase()}</div><b>${a.name}</b><p>${a.desc}</p></div><div class="count">${unlockedAchievementCount()} / 100</div>`;document.body.appendChild(el);try{tone(520,.09,'triangle',.024);tone(780,.14,'sine',.022,.055);if(['Brutal','Secret'].includes(a.tier))tone(1040,.20,'sine',.018,.13)}catch(e){}setTimeout(()=>{el.remove();achievementToastBusy=false;pumpAchievementToasts()},5250)}
  function awardAchievementMastery(){const ach=ensureAchievementState();if(ach.masterRewardClaimed)return;ach.masterRewardClaimed=true;for(const id of achievementCoreIds)state.packInventory[id]=(state.packInventory[id]||0)+100;save();renderHUD();updateBagCounts();confetti(70);sfx('jackpot');const ov=document.createElement('div');ov.className='achievement-master-overlay';ov.innerHTML=`<div class="achievement-master-card"><div class="star">★</div><div class="achievement-eyebrow">PACKFORGE MASTER COMPLETION</div><h2>100 / 100 Achievements</h2><p>You completed every unique achievement. Individual achievements paid nothing; this is the one completion prize.</p><div class="achievement-master-packs">${achievementCoreIds.map(id=>{const t=themes.find(x=>x.id===id);return `<div>${t?.emoji||'▣'}<b>×100</b><small>${t?.name||id}</small></div>`}).join('')}</div><p><b>500 packs total</b> have been sent to Bag → Packs.</p><button>Collect the Vault</button></div>`;document.body.appendChild(ov);ov.querySelector('button').onclick=()=>ov.remove()}
  function checkAchievements(notify=true){
    const ach=ensureAchievementState(),snap=achievementSnapshot();snap.meta.maxCash=Math.max(snap.meta.maxCash||0,state.cash||0);snap.meta.maxCombo=Math.max(snap.meta.maxCombo||0,comboClicks||0);const activePotions=Object.values(state.activePotions||{}).filter(a=>a&&a.until>Date.now()).length;snap.meta.maxActivePotions=Math.max(snap.meta.maxActivePotions||0,activePotions);
    let changed=false,newOnes=[];for(const a of ACHIEVEMENTS){if(ach.unlocked[a.id])continue;let ok=false;try{ok=!!a.check(snap)}catch(e){}if(ok){ach.unlocked[a.id]=Date.now();changed=true;newOnes.push(a)}}
    if(changed){save();if(notify)newOnes.forEach(queueAchievementToast);if(!$('#view-achievements')?.classList.contains('hidden'))renderAchievements()}
    if(pfOriginalAchievementCount()===100&&!ach.masterRewardClaimed)awardAchievementMastery();return newOnes.length
  }
  function renderAchievements(){
    const host=$('#achievementGrid');if(!host)return;const ach=ensureAchievementState(),count=unlockedAchievementCount(),pct=count;$('#achievementProgressTitle').textContent=`${count} / 100 Complete`;$('#achievementPercent').textContent=`${pct}%`;$('#achievementProgressBar').style.width=pct+'%';$('#achievementRing').style.setProperty('--ach-pct',pct+'%');$('#achievementProgressCopy').textContent=count===100?'Every challenge is complete. The Master Completion reward has been delivered.':`No individual rewards. Finish all 100 to receive 100 packs from each original set.`;
    const list=ACHIEVEMENTS.filter(a=>achievementFilter==='all'||(achievementFilter==='unlocked'&&ach.unlocked[a.id])||(achievementFilter==='locked'&&!ach.unlocked[a.id])||(achievementFilter==='hard'&&hardestAchievementIds.has(a.id)));
    $('#achievementSummary').textContent=`Showing ${list.length} · ${count} unlocked · ${100-count} remaining`;
    host.innerHTML=list.map((a,i)=>{const done=!!ach.unlocked[a.id],c=achievementDifficultyColor[a.tier]||'#9ba8b9',when=done?new Date(ach.unlocked[a.id]).toLocaleDateString():'';return `<article class="pf-achievement ${done?'unlocked':'locked'} ${hardestAchievementIds.has(a.id)?'hardest':''}" style="--ach-color:${c}"><div class="pf-ach-icon">${done?a.icon:'?'}</div><div class="pf-ach-copy"><h3>${String(ACHIEVEMENTS.indexOf(a)+1).padStart(3,'0')} · ${a.name}</h3><p>${a.desc}</p></div><div class="pf-ach-meta"><b>${a.tier}</b><small>${done?'UNLOCKED '+when:'LOCKED'}</small></div></article>`}).join('');
    $$('#achievementFilters [data-ach-filter]').forEach(b=>b.classList.toggle('active',b.dataset.achFilter===achievementFilter))
  }
  $$('#achievementFilters [data-ach-filter]').forEach(b=>b.onclick=()=>{achievementFilter=b.dataset.achFilter;renderAchievements()});
  const _achCreatePackPulls=createPackPulls;createPackPulls=function(t,mutation){const pulls=_achCreatePackPulls(t,mutation),m=achMeta();for(const p of pulls){m.rarityEver[p.card.secret?'Secret':p.card.rarity]=true;m.variantsEver[p.copy.variant||'Normal']=true;if(p.copy.mutation)m.mutationsEver[p.copy.mutation]=true;const sn=serialNumber(p.copy);if(sn<999999)m.bestSerial=Math.min(m.bestSerial||999999,sn)}const commonCount=pulls.filter(p=>p.card.rarity==='Common'&&!p.card.secret).length,epicPlus=pulls.filter(p=>p.card.secret||rarityOrder.indexOf(p.card.rarity)>=rarityOrder.indexOf('Epic')).length,special=pulls.filter(p=>p.special).length;if(commonCount===0)m.noCommonPack=true;if(epicPlus>=2)m.twoEpicPack=true;m.maxSpecialCards=Math.max(m.maxSpecialCards||0,special);if(mutation)m.mutationsEver[mutation.id]=true;checkAchievements(true);return pulls};
  const _achApplyOpeningQuality=applyOpeningQuality;applyOpeningQuality=function(pulls,result){_achApplyOpeningQuality(pulls,result);const m=achMeta();if((result?.penalty||0)<=0.001)m.cleanCuts=(m.cleanCuts||0)+1;if((result?.penalty||0)>=2)m.severeCuts=(m.severeCuts||0)+1;checkAchievements(true)};
  const _achAutoOpenStoredPack=autoOpenStoredPack;autoOpenStoredPack=function(id){const n=state.packInventory?.[id]||0;achMeta().autoBatchMax=Math.max(achMeta().autoBatchMax||0,n);const r=_achAutoOpenStoredPack(id);checkAchievements(true);return r};
  const _achAutoOpenSpecialStoredPack=autoOpenSpecialStoredPack;autoOpenSpecialStoredPack=function(uid0){const target=(state.specialPackInventory||[]).find(x=>x.uid===uid0),n=target?(state.specialPackInventory||[]).filter(x=>x.themeId===target.themeId&&x.mutation===target.mutation).length:0;achMeta().autoBatchMax=Math.max(achMeta().autoBatchMax||0,n);const r=_achAutoOpenSpecialStoredPack(uid0);checkAchievements(true);return r};
  const _achUsePotion=usePotion;usePotion=function(id){const before=state.potionInventory?.[id]||0,r=_achUsePotion(id);if(before>(state.potionInventory?.[id]||0)){achMeta().potionsUsed[id]=true;achMeta().maxActivePotions=Math.max(achMeta().maxActivePotions||0,Object.values(state.activePotions||{}).filter(a=>a&&a.until>Date.now()).length);checkAchievements(true)}return r};
  const _achCampaignStart=campaignStart;campaignStart=function(def){const cards=selectedCampaignCards(),power=cards.reduce((n,x)=>n+x.power,0),before=activeCampaign(),r=_achCampaignStart(def),after=activeCampaign(),m=achMeta();if(!before&&after){if(cards.length===1)m.soloCampaigns=(m.soloCampaigns||0)+1;if(def&&power>=def.power*5)m.overkillCampaigns=(m.overkillCampaigns||0)+1;if((after.durationMs||Infinity)<=3*60*1000)m.fastCampaigns=(m.fastCampaigns||0)+1;checkAchievements(true)}return r};
  const _achBuyShopPack=buyShopPack;buyShopPack=function(themeId){const t=themes.find(x=>x.id===themeId),before=t?.campaignHidden?hiddenOfferRemaining(themeId):0,r=_achBuyShopPack(themeId),after=t?.campaignHidden?hiddenOfferRemaining(themeId):0;if(t?.campaignHidden&&before>0&&after===0){achMeta().hiddenOfferSoldOut=(achMeta().hiddenOfferSoldOut||0)+1;checkAchievements(true)}achMeta().boughtThemes[themeId]=true;return r};
  const _achRecordGamble=recordGamble;recordGamble=function(name,wager,returned){achMeta().maxWager=Math.max(achMeta().maxWager||0,wager||0);const r=_achRecordGamble(name,wager,returned);checkAchievements(true);return r};
  const mysteryObserver=new MutationObserver(()=>{if(($('#mysteryResult')?.textContent||'').includes('JACKPOT')){achMeta().mysteryJackpot=true;checkAchievements(true)}});if($('#mysteryResult'))mysteryObserver.observe($('#mysteryResult'),{childList:true,subtree:true,characterData:true});
  $$('[data-astro-page]').forEach(b=>b.addEventListener('click',()=>{achMeta().astroPages[b.dataset.astroPage]=true;checkAchievements(true)}));
  $$('[data-physics-point]').forEach(b=>b.addEventListener('click',()=>{achMeta().astroPlanets[b.dataset.physicsPoint]=true;checkAchievements(true)}));
  $$('[data-physics-constant]').forEach(b=>b.addEventListener('click',()=>{achMeta().astroDistances[b.dataset.physicsConstant]=true;checkAchievements(true)}));
  const quizObserver=new MutationObserver(()=>{if(($('#quizProgress')?.textContent||'').includes('Round complete')&&($('#quizQuestion')?.textContent||'').includes('3 / 3')){achMeta().perfectQuiz=true;checkAchievements(true)}});if($('#quizProgress'))quizObserver.observe($('#quizProgress'),{childList:true,subtree:true,characterData:true});if($('#quizQuestion'))quizObserver.observe($('#quizQuestion'),{childList:true,subtree:true,characterData:true});
  {const a=ensureAchievementState(),first=!a.initialized;if(first){const before=unlockedAchievementCount(),gained=checkAchievements(false);a.initialized=true;save();if(gained>0)toast('Achievements added',`${gained} achievement${gained===1?'':'s'} unlocked from your existing save.`)}else checkAchievements(false)}
  setInterval(()=>{if(document.hidden)return;const m=achMeta();m.maxCombo=Math.max(m.maxCombo||0,comboClicks||0);m.maxCash=Math.max(m.maxCash||0,state.cash||0);checkAchievements(true)},6000);
  setInterval(()=>{if(document.hidden)return;const changed=processCompletedGradings(true);if(!$('#view-grading').classList.contains('hidden'))renderGradingMachine();if(changed){renderHUD();if(!$('#view-collection').classList.contains('hidden'))renderCollection()}},2500);

  setInterval(()=>{if(document.hidden)return;if(typeof window.pfCampaignHeartbeat==='function'){window.pfCampaignHeartbeat();return}const a=activeCampaign();if(a&&Date.now()>=a.endsAt&&!a.notified){a.notified=true;save();sfx('grade');toast('Campaign complete',`${a.offer?.name||'Exhibition'} is ready to collect.`)}if(!$('#view-campaigns').classList.contains('hidden')&&!a)updateCampaignRefreshButton()},1500);
  let showcaseIncomeClock=Date.now();
  setInterval(()=>{const now=Date.now(),dt=Math.min(2,Math.max(0,(now-showcaseIncomeClock)/1000));showcaseIncomeClock=now;const rate=showcaseBonuses().passivePerSec;if(rate>0&&dt>0){const gain=rate*dt;earn(gain);state.showcase.incomeEarned=(state.showcase.incomeEarned||0)+gain;state.showcase.lastIncomeAt=now;renderHUD();if(!$('#view-collection').classList.contains('hidden')&&currentBagTab==='showcase'){const el=$('.showcase-income b');if(el)el.textContent=`${showcaseRateFmt(rate)}/sec`}}},1500);
  setInterval(()=>{let changed=false;for(const [id,a] of Object.entries(state.activePotions||{})){if(a&&a.until<=Date.now()){delete state.activePotions[id];changed=true}}if(Object.keys(state.activePotions||{}).length||changed)renderHUD();if(changed)save();if(!$('#view-collection').classList.contains('hidden')&&currentBagTab==='potions')renderPotions()},5000);
  setInterval(()=>{if(saveDirty)flushSave()},8000);window.addEventListener('beforeunload',()=>save(true));window.addEventListener('pagehide',()=>save(true));document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')save(true);else{ensureFpsLoop();ensureComboLoop();processCompletedGradings(false)}});processCompletedGradings(false);applyPerformanceSettings();renderAll()

  /* Detached tutorial session. Training uses the real game UI/functions in memory, but it never touches the real save. */
  let tutorialFirstPackHoloGiven=false;
  const _tutorialCreatePackPulls=createPackPulls;
  createPackPulls=function(t,mutation,autoMode=false){
    const pulls=_tutorialCreatePackPulls(t,mutation,autoMode);
    if(tutorialTrainingMode&&!tutorialFirstPackHoloGiven&&Array.isArray(pulls)&&pulls.length){
      let holo=pulls.find(p=>p?.copy?.variant==='Holo');
      if(!holo){
        holo=pulls.find(p=>p?.copy?.variant==='Normal')||pulls[0];
        if(holo?.copy){holo.copy.variant='Holo';holo.copy.serial=null}
      }
      tutorialFirstPackHoloGiven=true;
      pulls.sort((a,b)=>pullScore(a)-pullScore(b));
    }
    return pulls
  };
  window.__pfTutorialHelpers={fundCasino:(amount=6)=>{if(!tutorialTrainingMode)return false;state.cash=Math.max(0,Number(amount)||0);renderHUD();try{window.mccInitCasino?.()}catch(e){}return true},cash:()=>state.cash,gamePlays:(name)=>state.stats.games?.[name]?.plays||0};
  window.__pfTutorialSession={
    begin:()=>{
      /* Preserve the fully migrated real save in memory. Tutorial state is throwaway, even for players arriving from older versions. */
      tutorialPreservedState=JSON.parse(JSON.stringify(state));
      tutorialPreservedPrefs={
        sound:state.sound,
        soundVolume:state.soundVolume,
        soundProfile:state.soundProfile,
        settings:JSON.parse(JSON.stringify(state.settings||{}))
      };
      tutorialTrainingMode=true;
      tutorialFirstPackHoloGiven=false;
      if(saveTimer){clearTimeout(saveTimer);saveTimer=null}
      /* Keep the real localStorage save untouched while training runs. A crash/reload cannot erase real progress. */
      state=defaultState();
      loadedSave=null;
      rouletteBets=state.rouletteBets;
      comboClicks=0;comboExpiresAt=0;
      invalidateCollectionValue();
      saveDirty=false;
      currentShopTab='packs';currentBagTab='cards';campaignSearch='';
      showView('play');renderAll();
      return true
    },
    finish:()=>{
      if(saveTimer){clearTimeout(saveTimer);saveTimer=null}
      const prefs=tutorialPreservedPrefs||{};
      state=mergeSaveDefaults(defaultState(),tutorialPreservedState||{});
      if(typeof prefs.sound==='boolean')state.sound=prefs.sound;
      if(Number.isFinite(prefs.soundVolume))state.soundVolume=prefs.soundVolume;
      if(prefs.soundProfile)state.soundProfile=prefs.soundProfile;
      if(prefs.settings&&typeof prefs.settings==='object')state.settings={...state.settings,...prefs.settings};
      loadedSave=null;
      rouletteBets=state.rouletteBets;
      comboClicks=0;comboExpiresAt=0;
      campaignSearch='';currentShopTab='packs';currentBagTab='cards';
      invalidateCollectionValue();
      tutorialTrainingMode=false;
      tutorialPreservedPrefs=null;
      tutorialPreservedState=null;
      saveDirty=true;
      showView('play');renderAll();syncSettingsUI();save(true);
      return true
    },
    active:()=>tutorialTrainingMode
  };
  /* The training campaign is intentionally trivial so the normal campaign NEXT button can never be blocked by tutorial RNG. */
  window.__pfPrepareTutorialCampaign=()=>{
    if(!tutorialTrainingMode||activeCampaign())return false;
    ensureCampaignOffers();
    const easy=(state.campaigns.offers||[]).find(o=>o&&o.difficulty==='easy');
    const available=allOwnedCopies().filter(x=>!x.copy.gradingUntil&&!copyIsCampaignCommitted(x.copy.uid)&&!copyIsShowcased(x.copy.uid));
    if(!easy||!available.length)return false;
    easy.power=1;
    easy.fee=0;
    state.campaigns.flowStep='offers';
    state.campaigns.flowOfferId=null;
    state.campaigns.selectedOfferId=null;
    state.campaigns.selected=[];
    if(!$('#view-campaigns').classList.contains('hidden'))renderCampaigns();
    return true;
  };


  /* ==========================================================
     PACKFORGE v2.5 — COLLECTOR SYSTEMS UPDATE
     Backward-compatible feature layer. The stable save key is unchanged.
     ========================================================== */
  const PF_UPDATE_ID='v317-economy-performance-20260915';
  const PF_VERSION='3.28';
  const JET_LUMAGUI_CARD_CHANCE=1/1000;
  const JET_LUMAGUI_CARD={id:'packforge_jet_lumagui',name:'Jet Lumagui',rarity:'Jet Lumagui',theme:'medieval',value:609,power:1,jet:true,flavor:'A quiet figure in the haze. Smoke curls across the print, but the card itself never explains why.'};
  const PF_CRUE_PACK_CHANCE=1/500000000;
  const PF_BACKUP_KEYS=['packforge_backup_1','packforge_backup_2','packforge_backup_3'];
  const PF_BACKUP_STAMP='packforge_backup_stamp_v1';
  const PF_CHANGELOG_KEY='packforge_changelog_'+PF_UPDATE_ID;
  const PF_CRUE_LOWE_CARD={id:'packforge_crue_lowe',name:'Crue Lowe',rarity:'Crue Lowe',theme:'medieval',value:.01,power:1,secret:true,crue:true,flavor:'The Fabled Fool of Lowe wandered into legend with a crown too large, a map upside down, and absolute confidence in every wrong turn.'};
  
  rarityColor['Jet Lumagui']='#aab3b8';
  rarityMult['Jet Lumagui']=1;
  cardMap[JET_LUMAGUI_CARD.id]=JET_LUMAGUI_CARD;
  rarityColor['Crue Lowe']='#c7ff4a';
  rarityMult['Crue Lowe']=1;
  cardMap[PF_CRUE_LOWE_CARD.id]=PF_CRUE_LOWE_CARD;
  state.quirkStats={crueLowe:0,...(state.quirkStats||{})};
  state.adminForces={crueNext:false,...(state.adminForces||{})};
  state.campaigns.active2=state.campaigns.active2||null;
  if(state.settings.autoPerformanceGuard===undefined)state.settings.autoPerformanceGuard=true;

  /* Repair the old forced-Ghost edge case: the historical counter could increment before
     the reveal was committed. Only restore when no Ghost history ever exists, so sold Ghosts are not recreated. */
  try{
    const gh=state.history?.[GHOST_CARD.id];
    const ghostOwnedBefore=(state.inventory?.[GHOST_CARD.id]&&totalItemCount(state.inventory[GHOST_CARD.id]))||0;
    if((state.quirkStats?.ghostCards||0)>0&&!ghostOwnedBefore&&!(gh?.totalPulled>0)){
      const cp=makeCopy('Normal',null,null);cp.source='Recovered Unlisted Pull';addCopy(GHOST_CARD.id,1,cp);state.totalCards=(state.totalCards||0)+1;
      state.discovered[GHOST_CARD.id]=state.discovered[GHOST_CARD.id]||Date.now();state.history[GHOST_CARD.id]={firstObtained:Date.now(),lastObtained:Date.now(),totalPulled:1,variants:{Normal:1},specialPacks:{},highestLevel:1};
      markSaveDirty();
    }
  }catch(e){console.warn('Ghost recovery migration skipped',e)}
  /* One-time stronger recovery for older saves that recorded a Ghost pull but still show zero owned.
     This intentionally runs only once so selling a real Ghost cannot create a reload loop. */
  try{
    if(!state.pfGhostRecoveryV2&&(state.quirkStats?.ghostCards||0)>0&&(!state.inventory?.[GHOST_CARD.id]||totalItemCount(state.inventory[GHOST_CARD.id])===0)){
      const cp=makeCopy('Normal',null,null);cp.source='Recovered Unlisted Pull v2';addCopy(GHOST_CARD.id,1,cp);state.totalCards=(state.totalCards||0)+1;state.discovered[GHOST_CARD.id]=state.discovered[GHOST_CARD.id]||Date.now();
      const h=state.history[GHOST_CARD.id]||(state.history[GHOST_CARD.id]={firstObtained:Date.now(),lastObtained:Date.now(),totalPulled:Math.max(1,state.quirkStats.ghostCards||1),variants:{Normal:1},specialPacks:{},highestLevel:1});h.firstObtained=h.firstObtained||Date.now();h.lastObtained=Date.now();h.totalPulled=Math.max(1,h.totalPulled||0);h.variants=h.variants||{};h.variants.Normal=Math.max(1,h.variants.Normal||0);h.highestLevel=Math.max(1,h.highestLevel||1);state.pfGhostRecoveryV2=true;markSaveDirty();
    }else if(!state.pfGhostRecoveryV2){state.pfGhostRecoveryV2=true;markSaveDirty()}
  }catch(e){console.warn('Ghost v2 recovery skipped',e)}

  /* ---------- Special collection visibility ---------- */
  const pfBaseCollectionEntries=collectionEntries;
  collectionEntries=function(){
    const out=pfBaseCollectionEntries();
    for(const c of [JET_LUMAGUI_CARD,GHOST_CARD,PF_CRUE_LOWE_CARD]){
      if(!state.inventory?.[c.id]||out.some(e=>e.c.id===c.id))continue;
      const it=state.inventory[c.id];
      for(const [lv,ld] of Object.entries(it.levels||{})){
        const groups=new Map();for(const cp of ld.copies||[]){const sig=copySignature(cp);if(!groups.has(sig))groups.set(sig,[]);groups.get(sig).push(cp)}
        for(const [sig,copies] of groups)if(copies.length)out.push({c,level:+lv,copies,rep:copies[0],sig});
      }
    }
    return out;
  };
  /* ---------- Crue + Jet pack outcomes ---------- */
  const pfBaseCreatePackPulls=createPackPulls;
  createPackPulls=function(t,mutation,autoMode=false){
    const af=state.adminForces||(state.adminForces={});
    const forceCrue=!tutorialTrainingMode&&!!af.crueNext;
    const forceJet=!tutorialTrainingMode&&!!af.jetNext;
    if(forceCrue)af.crueNext=false;if(forceJet)af.jetNext=false;
    const cruePack=!tutorialTrainingMode&&(forceCrue||Math.random()<PF_CRUE_PACK_CHANCE*overdriveBoost());
    const jetPack=!tutorialTrainingMode&&forceJet;
    const pulls=pfBaseCreatePackPulls(t,mutation,autoMode);
    if(cruePack&&pulls.length){
      let idx=pulls.findIndex(p=>!p.card.ghost);if(idx<0)idx=pulls.length-1;
      const p=pulls[idx];p.card=PF_CRUE_LOWE_CARD;p.newDiscovery=!state.discovered[PF_CRUE_LOWE_CARD.id];p.nearMiss=null;p.copy.variant='Normal';p.copy.serial=null;p.copy.mutation=null;p.copy.grade=null;p.copy.blackLabel=false;p.crueLowe=true;
      state.quirkStats.crueLowe=(state.quirkStats.crueLowe||0)+1;
    }
    if(jetPack&&pulls.length){
      let idx=pulls.findIndex(p=>!p.card.crue&&!p.card.ghost);if(idx<0)idx=pulls.length-1;
      const p=pulls[idx];p.card=JET_LUMAGUI_CARD;p.newDiscovery=!state.discovered[JET_LUMAGUI_CARD.id];p.nearMiss=null;p.copy.variant='Normal';p.copy.serial=null;p.copy.mutation=null;p.copy.grade=null;p.copy.blackLabel=false;p.jetLumagui=true;
      state.quirkStats.jetLumagui=(state.quirkStats.jetLumagui||0)+1;
    }
    pulls.sort((a,b)=>pullScore(a)-pullScore(b));markSaveDirty();return pulls;
  };
  const pfBasePullRevealMeta=pullRevealMeta;
  pullRevealMeta=function(p){
    if(p?.card?.crue)return {rarity:'Crue Lowe',variant:p.copy?.variant||'Normal',mutation:null,tier:'crue',classes:['pull-crue'],specialColor:'#c7ff4a',label:'CRUE LOWE · 1 IN 500,000,000'};
    return pfBasePullRevealMeta(p);
  };
  const pfBaseCardHTML=cardHTML;
  function pfEscapeHtml(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
  cardHTML=function(card,count=0,copy=null,level=1,opts={}){
    let html=pfBaseCardHTML(card,count,copy,level,opts);
    if(card?.crue)html=html.replace('card-face ', 'card-face crue-lowe-card ').replace('<div class="card-secret-mark">SECRET</div>','');
    if(card?.jet)html=html.replace('card-face ', 'card-face jet-lumagui-card ').replace('<div class="mutation-vfx"></div>', '<div class="jet-smoke jet-smoke-a"></div><div class="jet-smoke jet-smoke-b"></div><div class="mutation-vfx"></div>');
    return html;
  };
  const pfBaseSellValue=sellValue;
  sellValue=function(card,level,copy){if(card?.crue)return .01;if(card?.jet)return 609;return pfBaseSellValue(card,level,copy)};
  const pfBaseRewardReveal=typeof rewardReveal==='function'?rewardReveal:null;

  /* ---------- Two-card grading ---------- */
  function pfActiveGradingJobs(){const out=[];for(const [id,it] of Object.entries(state.inventory||{})){for(const [lv,ld] of Object.entries(it.levels||{})){for(const cp of ld.copies||[]){if(cp.gradingUntil&&Date.now()<cp.gradingUntil)out.push({id,level:+lv,copy:cp,c:cardMap[id]})}}}return out.sort((a,b)=>a.copy.gradingUntil-b.copy.gradingUntil)}
  activeGradingJob=function(){return pfActiveGradingJobs()[0]||null};
  renderGrading=function(){
    processCompletedGradings(true);const jobs=pfActiveGradingJobs(),entries=eligibleGradeEntries(),list=$('#gradingList');$('#gradingCount').textContent=`${jobs.length}/2 graders active · ${entries.length} eligible`;
    list.innerHTML=entries.length?entries.map(e=>{const available=e.copies.filter(cp=>!cp.grade&&!cp.gradingUntil&&!copyIsCampaignCommitted(cp.uid)).length;return `<div class="grading-card-option" style="--rarity:${rarityColor[e.c.rarity]||'#fff'}"><div class="grading-card-shell">${cardHTML(e.c,available,e.rep,e.level)}</div><div class="grading-card-meta"><b>${e.c.name}${e.c.secret?' · SECRET':''}</b><small>${e.c.rarity} · ${e.rep.variant}${e.rep.mutation?' · '+packMutations[e.rep.mutation].name:''}</small><button data-grade-select="${entryKey(e)}" ${jobs.length>=2?'disabled':''}>${jobs.length>=2?'Both graders busy':'Select this card'}</button></div></div>`}).join(''):`<div class="grading-empty" style="padding:40px"><b>${jobs.length>=2?'Both graders are working':'No eligible cards'}</b><span>${jobs.length>=2?'You can submit another card as soon as either slot returns.':'Open packs to find an ungraded card.'}</span></div>`;
    $$('[data-grade-select]').forEach(b=>b.onclick=()=>{gradingSelection=b.dataset.gradeSelect;lastGradeResult=null;renderGradingMachine()});renderGradingMachine();
  };
  renderGradingMachine=function(){
    const machine=$('#gradingMachine'),jobs=pfActiveGradingJobs();let jobsHtml='';
    if(jobs.length){jobsHtml=`<div class="pf-grade-slots">${[0,1].map(i=>{const job=jobs[i];if(!job)return `<div class="pf-grade-slot empty"><b>GRADER ${i+1}</b><span>Available</span></div>`;const elapsed=Date.now()-(job.copy.gradingStartedAt||Date.now()),duration=Math.max(1,(job.copy.gradingUntil||Date.now())-(job.copy.gradingStartedAt||Date.now())),pct=clamp(elapsed/duration*100,0,100);return `<div class="pf-grade-slot"><b>GRADER ${i+1}</b><span>${job.c?.name||'Card'}</span><strong>${formatRemaining(job.copy.gradingUntil-Date.now())}</strong><div class="progress"><i style="width:${pct}%"></i></div></div>`}).join('')}</div>`}
    if(lastGradeResult){const {c,level,copy}=lastGradeResult;machine.innerHTML=jobsHtml+`<div><div class="grading-card-preview"><div class="inspect-tilt graded">${cardHTML(c,0,copy,level)}</div></div><div class="grading-details"><div class="grade-result">${copy.grade.toFixed(1)}</div><h3>${gradeLabel(copy.grade,copy)}</h3><p>${c.name} is now sealed in its collector slab.${copy.gradeNote?`<br><small>${copy.gradeNote}</small>`:''}</p><button class="grade-action" id="gradeDone">Continue</button></div></div>`;$('#gradeDone').onclick=()=>{lastGradeResult=null;renderGrading()};return}
    if(!gradingSelection){machine.innerHTML=jobsHtml+`<div class="grading-empty"><b>${jobs.length>=2?'Both grading slots are occupied':'Select a card to grade'}</b><span>You can grade two cards at the same time. Each submission normally takes exactly 5 minutes.</span></div>`;return}
    const k=parseEntryKey(gradingSelection),e=findEntry(k.id,k.level,k.sig);if(!e||e.rep.grade||e.rep.gradingUntil||!e.copies.some(cp=>!cp.grade&&!cp.gradingUntil&&!copyIsCampaignCommitted(cp.uid))){gradingSelection=null;renderGradingMachine();return}const cost=gradeCost(e);
    machine.innerHTML=jobsHtml+`<div><div class="grading-card-preview"><div class="inspect-tilt">${cardHTML(e.c,0,e.rep,e.level)}</div></div><div class="grading-details"><h3>${e.c.name}</h3><p>${e.c.rarity} · ${e.rep.variant} · Level ${e.level}<br>Grading fee: <b>${fmt(cost)}</b><br>Turnaround: <b>5:00</b><br>Open slots: <b>${Math.max(0,2-jobs.length)}</b></p><button class="grade-action" id="gradeNow" ${canAfford(cost)&&jobs.length<2?'':'disabled'}>Submit to Grader ${jobs.length+1}</button></div></div>`;
    $('#gradeNow').onclick=()=>{if(pfActiveGradingJobs().length>=2||!spend(cost)){sfx('error');return}const live=findEntry(k.id,k.level,k.sig),copy=live?.copies.find(cp=>!cp.grade&&!cp.gradingUntil&&!copyIsCampaignCommitted(cp.uid));if(!copy)return;const now=Date.now(),rolled=e.c.crue?1:rollGrade(),damage=e.c.crue?0:(copy.openingPenalty||0)+factoryErrorGradePenalty(copy),finalGrade=e.c.crue?1:Math.max(1,Math.round((rolled-damage)*10)/10);copy.gradingStartedAt=now;copy.gradingUntil=now+GRADING_TIME/overdriveBoost();const forceBlack=!!state.adminForces?.blackLabelNext;if(e.c.crue){copy.pendingGrade=1;copy.pendingBlackLabel=false}else if(forceBlack){state.adminForces.blackLabelNext=false;copy.pendingGrade=10;copy.pendingBlackLabel=true}else{copy.pendingGrade=finalGrade;copy.pendingBlackLabel=finalGrade>=10&&damage===0&&Math.random()<Math.min(.02,.004*overdriveBoost())}state.stats.gradesSubmitted=(state.stats.gradesSubmitted||0)+1;gradingSelection=null;lastGradeResult=null;sfx('buy');toast('Sent to grading',`${e.c.name} is now using grading slot ${jobs.length+1}.`);save();renderHUD();renderGrading()};
  };

  /* ---------- Two simultaneous campaigns ---------- */
  function pfActiveCampaigns(){return [state.campaigns?.active,state.campaigns?.active2].filter(Boolean)}
  activeCampaign=function(){return state.campaigns?.active||state.campaigns?.active2||null};
  copyIsCampaignCommitted=function(uidValue){return pfActiveCampaigns().some(a=>Date.now()<a.endsAt&&Array.isArray(a.cardUids)&&a.cardUids.includes(uidValue))};
  campaignStart=function(def){
    const cards=selectedCampaignCards(),power=cards.reduce((n,x)=>n+x.power,0),entryFee=campaignEntryFee(def),runs=pfActiveCampaigns();
    if(runs.length>=2){toast('Both campaign slots are busy','Collect a finished campaign or wait for one to complete.');return}
    if(!def||!state.campaigns.offers.some(o=>o.offerId===def.offerId)){sfx('error');return}
    if(power<def.power||!campaignRequirementOK(def,cards)){sfx('error');toast('Not enough Power',cards.length?`You need ${def.power.toLocaleString()} total Power.`:'Select at least one card.');return}
    if(entryFee>0&&!spend(entryFee)){sfx('error');toast('Not enough cash',`Entry costs ${fmt(entryFee)}.`);return}
    const now=Date.now(),durationMs=campaignDurationMs(def,power),speed=campaignSpeed(def,power),run={offer:{...def,fee:entryFee},offerId:def.offerId,startedAt:now,endsAt:now+durationMs,durationMs,cardUids:cards.map(x=>x.copy.uid),power,fee:entryFee,speed,notified:false};
    if(!state.campaigns.active)state.campaigns.active=run;else state.campaigns.active2=run;state.campaigns.selected=[];state.campaigns.flowStep='offers';state.campaigns.flowOfferId=null;state.stats.campaignsStarted=(state.stats.campaignsStarted||0)+1;state.stats.campaignPowerSent=(state.stats.campaignPowerSent||0)+power;state.stats.campaignMinutes=(state.stats.campaignMinutes||0)+durationMs/60000;sfx('buy');save();renderHUD();renderCampaigns();toast('Campaign started',`${def.name} · slot ${pfActiveCampaigns().length}/2 · ${campaignDurationLabel(durationMs/60000)}.`)
  };
  function pfCollectCampaignSlot(slot){
    const key=slot===2?'active2':'active',a=state.campaigns[key];if(!a||Date.now()<a.endsAt)return;const def=a.offer;if(!def)return;
    const tier=campaignTier(def,a.power),fallbackRewards=campaignRewardsForMinutes(def.baseMinutes||def.minutes||20,def.difficulty||'standard'),od=overdriveBoost(),cash=Math.round((def.cashReward??fallbackRewards.cash)*(1+Math.min(.35,(a.power/def.power-1)*.025))*od);if(cash>0)earn(cash);
    const packRewards=[];let packCount=((def.packs||0)+tier.bonusPacks)*od;for(let i=0;i<packCount;i++){const p=campaignAddPack(null,false);if(p)packRewards.push(p)}const extraChance=Math.min(.98,((def.packChance||0)+(tier.extraPackChance||0))*od);if(Math.random()<extraChance){const p=campaignAddPack(null,false);if(p)packRewards.push(p)}let specialWon=false;const specialChance=Math.min(.90,((def.special||0)+(tier.specialBonus||0))*od);if(Math.random()<specialChance){const p=campaignAddPack(null,true);if(p){packRewards.push(p);specialWon=true}}let potionWon=null;const hiddenSetWon=tryUnlockCampaignSet();state.campaigns.completed.total=(state.campaigns.completed.total||0)+1;addOverdriveProgress('campaign',1);state.campaigns[key]=null;state.stats.campaignsCompleted=(state.stats.campaignsCompleted||0)+1;state.stats.campaignCash=(state.stats.campaignCash||0)+cash;state.stats.campaignPacksWon=(state.stats.campaignPacksWon||0)+packRewards.filter(p=>!p.special).length;state.stats.campaignSpecialsWon=(state.stats.campaignSpecialsWon||0)+(specialWon?1:0);state.stats.campaignPotionsWon=(state.stats.campaignPotionsWon||0)+(potionWon?1:0);const summary={name:def.name,tier:tier.name,power:a.power,cash,packs:packRewards,specialWon,potionWon,hiddenSetWon,speed:a.speed||campaignSpeed(def,a.power)};generateCampaignOffers();sfx('grade');confetti(tier.name==='Master'?28:14);save();renderAll();renderCampaigns();showCampaignRewardPopup(summary)
  }
  function pfCampaignRunHTML(a,slot){const def=a.offer,remaining=a.endsAt-Date.now(),done=remaining<=0,duration=a.durationMs||(a.endsAt-a.startedAt)||def.baseMinutes*60000,pct=clamp((Date.now()-a.startedAt)/duration*100,0,100),tier=campaignTier(def,a.power);return `<div class="pf-campaign-run ${done?'done':''}"><div class="pf-run-head"><span>CAMPAIGN SLOT ${slot}</span><b>${def.name}</b><small>${tier.name} tier · ${(a.speed||campaignSpeed(def,a.power)).toFixed((a.speed||1)>=10?0:1)}× speed</small></div><div class="campaign-big-timer">${done?'COMPLETE':campaignTime(remaining)}</div><div class="campaign-progress"><i style="width:${pct}%"></i></div>${done?`<button class="campaign-collect" data-pf-collect-campaign="${slot}">COLLECT REWARDS</button>`:`<div class="campaign-help">${a.power.toLocaleString()} Power committed · timer continues while away.</div>`}</div>`}
  renderCampaigns=function(){
    ensureCampaignOffers();const list=$('#campaignList'),stage=$('#campaignStage');if(!list||!stage)return;const runs=pfActiveCampaigns(),step=state.campaigns.flowStep||'offers',refreshLeft=campaignRefreshRemaining();const lp=list.closest('.campaign-panel'),sp=stage.closest('.campaign-panel');if(lp)lp.style.display='block';if(sp)sp.style.display='block';
    const runsHtml=runs.length?`<div class="pf-campaign-slots-head"><b>ACTIVE CAMPAIGNS</b><span>${runs.length}/2 slots occupied</span></div><div class="pf-campaign-runs">${state.campaigns.active?pfCampaignRunHTML(state.campaigns.active,1):'<div class="pf-campaign-run empty"><b>SLOT 1</b><span>Available</span></div>'}${state.campaigns.active2?pfCampaignRunHTML(state.campaigns.active2,2):'<div class="pf-campaign-run empty"><b>SLOT 2</b><span>Available</span></div>'}</div>`:'';
    if(step==='team'&&campaignFlowOffer()&&runs.length<2){list.innerHTML=runsHtml;renderCampaignTeamFlow();const launch=$('#campaignLaunchNext');if(launch)launch.disabled=!(selectedCampaignPower()>=campaignFlowOffer().power&&campaignRequirementOK(campaignFlowOffer(),selectedCampaignCards())&&canAfford(campaignEntryFee(campaignFlowOffer())));$$('[data-pf-collect-campaign]').forEach(b=>b.onclick=()=>pfCollectCampaignSlot(+b.dataset.pfCollectCampaign));return}
    state.campaigns.flowStep='offers';const offers=ensureCampaignOffers();list.innerHTML=runsHtml+`<div class="campaign-choice-head"><div><span>${runs.length?'OPEN CAMPAIGN SLOT':'CHOOSE A CAMPAIGN'}</span><h2>${runs.length?'Launch another exhibition':'Where are your cards going?'}</h2><p>${runs.length>=2?'Both slots are occupied. Collect a finished run to launch another.':'Pick one offer, then continue to team selection.'}</p></div><button class="campaign-refresh" id="campaignRefresh" ${refreshLeft>0||runs.length>=2?'disabled':''}>${campaignRefreshLabel(refreshLeft)}</button></div><div class="campaign-choice-grid ${runs.length>=2?'pf-disabled-grid':''}">${offers.map(d=>{const selected=state.campaigns.flowOfferId===d.offerId;return `<button class="campaign-choice-card ${selected?'selected':''} difficulty-${d.difficulty}" data-campaign-choice="${d.offerId}" ${runs.length>=2?'disabled':''}><div class="campaign-choice-kicker">${d.rareCampaign?'50,000 POWER · RARE':`${d.power.toLocaleString()} POWER REQUIRED`}</div><h3>${d.name}</h3><div class="campaign-choice-stats"><span><small>BASE TIME</small><b>${campaignDurationLabel(d.baseMinutes)}</b></span><span><small>POWER</small><b>${d.power.toLocaleString()}</b></span><span><small>ENTRY</small><b>FREE</b></span></div><div class="campaign-choice-rewards"><small>REWARDS</small>${campaignOfferRewardCards(d).map(x=>`<span>${x}</span>`).join('')}</div></button>`}).join('')}</div>`;
    const picked=campaignFlowOffer();stage.innerHTML=`<div class="campaign-choice-next"><div>${runs.length>=2?'<b>2 / 2 campaign slots occupied.</b><span>Finish or collect one before launching another.</span>':picked?`<b>${picked.name}</b><span>${campaignDurationLabel(picked.baseMinutes)} base · ${picked.power.toLocaleString()} Power required</span>`:'<b>Select one of the three campaigns.</b><span>You can run two campaigns at the same time.</span>'}</div><button id="campaignOfferNext" ${picked&&runs.length<2?'':'disabled'}>NEXT →</button></div>`;
    $$('[data-campaign-choice]').forEach(b=>b.onclick=()=>{if(pfActiveCampaigns().length>=2)return;state.campaigns.flowOfferId=b.dataset.campaignChoice;state.campaigns.selectedOfferId=b.dataset.campaignChoice;state.campaigns.selected=[];save();renderCampaigns()});const next=$('#campaignOfferNext');if(next)next.onclick=()=>{if(!campaignFlowOffer()||pfActiveCampaigns().length>=2)return;state.campaigns.flowStep='team';save();renderCampaigns()};const rb=$('#campaignRefresh');if(rb)rb.onclick=()=>{manualRefreshCampaigns();campaignResetFlow();save();renderCampaigns()};$$('[data-pf-collect-campaign]').forEach(b=>b.onclick=()=>pfCollectCampaignSlot(+b.dataset.pfCollectCampaign));
  };

  /* ---------- Admin-only Inspect editor ---------- */
  function pfAdminInspectEditor(id,level,sig){if(!pfAdminUnlocked)return;const e=findEntry(id,level,sig);if(!e)return;const cp=e.rep;const modal=$('#confirmModal');const variantOptions=['Normal','Foil','Holo','Gold','Prismatic','Nebula','Serialized'].map(v=>`<option value="${v}" ${cp.variant===v?'selected':''}>${v}</option>`).join('');const mutationOptions=['',...Object.keys(packMutations)].map(v=>`<option value="${v}" ${(cp.mutation||'')===v?'selected':''}>${v?packMutations[v].name:'None'}</option>`).join('');const errorOptions=['',...Object.keys(FACTORY_ERROR_DEFS)].map(v=>`<option value="${v}" ${(cp.factoryError||'')===v?'selected':''}>${v?FACTORY_ERROR_DEFS[v].name:'None'}</option>`).join('');const holoOptions=['',...Object.keys(HOLO_PATTERN_DEFS)].map(v=>`<option value="${v}" ${(cp.holoPattern||'')===v?'selected':''}>${v?HOLO_PATTERN_DEFS[v].name:'None'}</option>`).join('');modal.classList.remove('hidden');modal.innerHTML=`<div class="modal pf-admin-editor fade-in"><div class="modal-head"><h3>! Admin Card Editor</h3><button class="close-x" id="pfAdminEditClose">×</button></div><div class="modal-body"><div class="pf-admin-editor-name"><b>${e.c.name}</b><span>Changes affect this exact card copy only.</span></div><div class="pf-admin-edit-grid"><label>Variant<select id="pfEditVariant">${variantOptions}</select></label><label>Special Pack Effect<select id="pfEditMutation">${mutationOptions}</select></label><label>Grade<input id="pfEditGrade" type="number" min="0" max="10" step="0.1" value="${cp.grade??0}"><small>0 = ungraded</small></label><label>Factory Error<select id="pfEditError">${errorOptions}</select></label><label>Holo Pattern<select id="pfEditHolo">${holoOptions}</select></label><label>Black Label<select id="pfEditBlack"><option value="0" ${!cp.blackLabel?'selected':''}>No</option><option value="1" ${cp.blackLabel?'selected':''}>Yes</option></select></label><label>Serial<input id="pfEditSerial" type="text" value="${String(cp.serial||'').replace(/"/g,'&quot;')}" placeholder="#001 / 500"></label><label>Opening Quality<select id="pfEditQuality"><option ${cp.openingQuality==='Clean'?'selected':''}>Clean</option><option ${cp.openingQuality==='Light Wear'?'selected':''}>Light Wear</option><option ${cp.openingQuality==='Damaged'?'selected':''}>Damaged</option></select></label></div><div class="pf-admin-editor-actions"><button class="ghost-btn" id="pfEditCancel">Cancel</button><button class="ghost-btn pf-admin-god" id="pfEditSave">Apply Changes</button></div></div></div>`;const close=()=>{modal.classList.add('hidden');modal.innerHTML=''};$('#pfAdminEditClose').onclick=close;$('#pfEditCancel').onclick=close;$('#pfEditSave').onclick=()=>{const live=findCopyByUid(cp.uid)?.copy;if(!live)return close();live.variant=$('#pfEditVariant').value;live.mutation=$('#pfEditMutation').value||null;live.factoryError=$('#pfEditError').value||null;live.holoPattern=$('#pfEditHolo').value||null;let g=Number($('#pfEditGrade').value)||0;if(e.c.crue)g=1;live.grade=g>0?clamp(Math.round(g*10)/10,1,10):null;live.blackLabel=!e.c.crue&&$('#pfEditBlack').value==='1'&&live.grade>=10;live.serial=$('#pfEditSerial').value.trim()||null;live.openingQuality=$('#pfEditQuality').value;if(live.variant==='Serialized'&&!live.serial)live.serial=makeSerial(e.c.id);if(live.variant!=='Serialized')live.serial=null;live.glitchTarget=null;live.gradingUntil=null;live.gradingStartedAt=null;live.pendingGrade=null;live.pendingBlackLabel=null;invalidateCollectionValue();markSaveDirty();save();close();$('#inspectModal').classList.add('hidden');renderCollection();toast('Admin card updated',`${e.c.name} was modified.`)}}
  const pfBaseShowInspect=showInspect;
  showInspect=function(id,level=1,sig){pfBaseShowInspect(id,level,sig);if(!pfAdminUnlocked)return;const scene=$('#inspectModal .inspect-scene'),copy=$('#inspectModal .inspect-copy');if(!scene||!copy||$('#pfInspectAdminBang'))return;const bang=document.createElement('button');bang.id='pfInspectAdminBang';bang.className='pf-inspect-admin-bang';bang.type='button';bang.title='Admin card editor';bang.textContent='!';bang.onclick=e=>{e.preventDefault();e.stopPropagation();pfAdminInspectEditor(id,level,sig)};scene.appendChild(bang)};

  /* ---------- Chances + Journal ---------- */
  function pfOneIn(prob){if(!(prob>0))return'—';const x=1/prob;if(x>=1000000)return `1 in ${Math.round(x).toLocaleString()}`;if(x>=1000)return `1 in ${Math.round(x).toLocaleString()}`;if(x>=10)return `1 in ${x.toFixed(x<100?1:0)}`;return `1 in ${x.toFixed(2)}`}
  function pfPackProb(perCard,n=5){return 1-Math.pow(1-perCard,n)}
  function pfChancePct(prob){if(!(prob>=0))return'';const p=prob*100;if(p>=10)return p.toFixed(1)+'%';if(p>=1)return p.toFixed(2)+'%';if(p>=.01)return p.toFixed(3)+'%';if(p>=.0001)return p.toFixed(5)+'%';return p.toExponential(2)+'%'}
  function pfRenderChances(){
    const g=$('#pfChanceGrid');if(!g)return;const items=[],add=(group,name,prob,unit,note,label=null,cls='')=>items.push({group,name,prob,unit,note,label,cls});
    const chanceIntro=$('#stats-chances .pf-chances-head p');if(chanceIntro)chanceIntro.textContent='Base/manual odds across packs, cards, Coin clicks, grading, jackpots, and chase pulls. Auto Open modifiers are noted where they change the roll.';
    for(const r of ['Common','Uncommon','Rare','Epic','Legendary','Mythic','Divine','Ultra'])add('PACK RARITIES',r,pfPackProb(RARITY_ODDS[r]||0),'packs','At least one in a normal 5-card core pack.');
    add('JET LUMAGUI TIER','Jet Lumagui',pfPackProb(JET_LUMAGUI_CARD_CHANCE),'packs','Own one-card rarity: exactly 1 in 1,000 card rolls (about 1 in 200.4 normal five-card packs). Power 1 · exact Sell $609 · smoky card treatment.');
    add('SECRET TIER','Secret Card',pfPackProb(SECRET_CHANCE),'packs','Secret tier is 1 in 100,000 cards before modifiers; about 1 in 20,000 normal 5-card packs. Auto Open uses 75% of the per-card Secret roll.');
    add('GHOST TIER','Ghost Card',pfPackProb(GHOST_CARD_CHANCE),'packs','Separate Ghost rarity: 1 in 1,000,000 cards before modifiers; about 1 in 200,000 normal 5-card packs. Auto Open uses 75% of it. Huge sell value.');
    add('HIDDEN CARDS','Crue Lowe',PF_CRUE_PACK_CHANCE,'packs','One fabled card; Grade 1; $0.01 sell value.','', 'crue');
    for(const v of ['Foil','Holo','Gold','Prismatic','Serialized'])add('STANDARD VARIANTS',v,variantDefs[v].chance||0,'packs','Rolled once per normal pack (max one standard variant). Auto Open uses 75% of standard variant odds.');
    add('STANDARD VARIANTS','Nebula',variantDefs.Nebula?.chance||1/2000,'packs','Rigid fractured-glass finish.');
    add('COLLECTOR ODDITIES','Factory Error',pfPackProb(FACTORY_ERROR_CHANCE),'packs','At least one factory-error card in a normal 5-card pack (approx.; each card rolls independently).');
    add('COLLECTOR ODDITIES','Hidden Holo Pattern',HOLO_PATTERN_CHANCE,'Holo cards','Conditional on a card already being Holo. Swirl, Starburst, Galaxy, or Double Holo.');
    add('COLLECTOR ODDITIES','#001 Serialized',1/500,'Serialized cards','Conditional on Serialized: exact first-print serial.');
    add('COLLECTOR ODDITIES','#500 Serialized',1/500,'Serialized cards','Conditional on Serialized: exact final-print serial.');
    add('PACK ODDITIES','Special Pack mutation',SPECIAL_PACK_CHANCE,'packs','Base normal-pack mutation chance before other luck modifiers.');
    const mutationWeight=Object.values(packMutations).reduce((n,m)=>n+m.weight,0);for(const m of Object.values(packMutations))add('SPECIAL PACK TYPES',m.name,SPECIAL_PACK_CHANCE*(m.weight/mutationWeight),'packs',`${m.weight}/${mutationWeight} of Special Pack mutations · ${m.desc}.`);
    add('SEMI-GOD PACKS','Any Semi-God Pack',Object.values(SEMI_GOD_MODE_CHANCES).reduce((a,b)=>a+b,0),'packs','Rare Rush, Holo Flood, or Legendary Finish.');
    for(const [id,p] of Object.entries(SEMI_GOD_MODE_CHANCES)){const d=pfPackModeMeta(id);add('SEMI-GOD PACKS',d.name,p,'packs',d.desc)}
    add('GOD PACKS','Any God Pack',pfTotalGodChance(),'packs','Combined natural chance across every God Pack type.');
    for(const [id,p] of Object.entries(GOD_PACK_MODE_CHANCES)){const d=pfPackModeMeta(id);add('GOD PACKS',d.name,p,'packs',d.desc)}
    add('PACK ODDITIES','6-card pack',BONUS_CARD_PACK_CHANCE,'packs','Factory bonus-card anomaly.');
    add('PACK ODDITIES','4-card pack',SHORT_PACK_CHANCE,'packs','Short-pack anomaly.');
    add('PACK CHAINS','Lucky Pack Chain starts',.018,'completed packs','When no chain is active. Rare+ keeps a chain alive; low rarities get reroll help.');
    add('PREMIUM PACKS','Secret Hunt bonus Secret roll',.004,'cards','Extra Secret chance on each non-Secret card inside a Secret Hunt Pack.');
    add('COIN','Critical Coin press',criticalChance(),'clicks','Current chance with your Critical upgrades. A critical pays ×5.');
    add('COIN','Free Pack drop',packDropChance(),'clicks','Current Coin-click pack-drop chance. Base is exactly 1 in 200 before other listed modifiers.');
    add('COIN','Jackpot trigger',Math.min(.05,.0015*overdriveBoost()),'clicks','Current Coin-click jackpot chance.');
    add('JACKPOT REWARDS','Large cash burst',.50,'jackpots','Conditional on already triggering a Coin jackpot.');
    add('JACKPOT REWARDS','×2 Coin for 45 sec',.26,'jackpots','Conditional on already triggering a Coin jackpot.');
    add('JACKPOT REWARDS','Lucky cash burst',.18,'jackpots','Conditional on already triggering a Coin jackpot.');
    add('JACKPOT REWARDS','Free upgrade',.06,'jackpots','Conditional on already triggering a Coin jackpot.');
    add('GRADING','Natural 10.0 roll',.04,'grade rolls','Before opening/factory damage penalties.');
    add('GRADING','9.5–9.9 roll band',.10,'grade rolls','Base grading roll band before damage penalties.');
    add('GRADING','9.0–9.4 roll band',.20,'grade rolls','Base grading roll band before damage penalties.');
    add('GRADING','8.0–8.9 roll band',.34,'grade rolls','Base grading roll band before damage penalties.');
    add('GRADING','7.0–7.9 roll band',.28,'grade rolls','Base grading roll band before damage penalties.');
    add('GRADING','5.0–6.9 roll band',.04,'grade rolls','Base grading roll band before damage penalties.');
    add('GRADING','Perfect Black Label',.04*.004,'clean submissions','Approximate base chance: roll 10.0 (4%) then pass the 0.4% Black Label check with no damage. Conditional Black Label check itself is 1 in 250.');
    const groups=[];for(const x of items)if(!groups.includes(x.group))groups.push(x.group);
    g.innerHTML=groups.map(group=>`<div class="pf-chance-section-title"><span>${group}</span></div>`+items.filter(x=>x.group===group).map(x=>{const strong=x.label||`${pfOneIn(x.prob)} ${x.unit||''}`.trim(),pct=x.prob!=null?pfChancePct(x.prob):'';return `<article class="pf-chance-card ${x.cls||''}"><small>${group}</small><b>${x.name}</b><strong>${strong}</strong><span>${pct?pct+' · ':''}${x.note}</span><i style="--chance:${x.prob==null?0:Math.max(.5,Math.min(100,-Math.log10(Math.max(x.prob,1e-12))*10))}%"></i></article>`}).join('')).join('')
  }
  function pfOwnedCount(id){return state.inventory?.[id]?totalItemCount(state.inventory[id]):0}
  function pfRenderJournal(){const g=$('#pfJournalGrid');if(!g)return;const hasSecret=allCards.some(c=>c.secret&&state.history?.[c.id]?.totalPulled>0),q=state.quirkStats||{},journalEntries=[['🌟','God Pack',q.godPacks||0,'A wrapper where every card broke the normal rules.'],['🌫️','Jet Lumagui',q.jetLumagui||0,`${pfOwnedCount(JET_LUMAGUI_CARD.id)} currently owned · exact natural odds 1 in 1,000 cards.`],['👻','Ghost / Unlisted',q.ghostCards||0,`${pfOwnedCount(GHOST_CARD.id)} currently owned.`],['📦','Factory Pack Anomaly',q.packAnomalies||0,'A four- or six-card wrapper.'],['⚠','Factory Error Card',q.factoryErrors||0,'A true production defect with collector consequences.'],['✦','Hidden Holo Pattern',q.holoPatterns||0,'Swirl, Starburst, Galaxy, or Double Holo.'],['🏷','Perfect Black Label',q.blackLabels||0,'The rarest normal grading result.'],['☀️','God Rarity',q.godRarityCards||0,'A one-per-set chase card above Ghost. Natural odds: 1 in 2,000,000 card rolls.'],['✦','Ascendant',q.ascendantCards||0,'The highest set rarity. Natural odds: 1 in 20,000,000 card rolls.'],['👁','Secret Card',hasSecret?1:0,'One of four hidden Secret cards inside a 125-card set.'],['♜','Crue Lowe',q.crueLowe||0,`${pfOwnedCount(PF_CRUE_LOWE_CARD.id)} currently owned.`]];g.innerHTML=journalEntries.map(([icon,name,count,desc])=>{const seen=count>0;return `<article class="pf-journal-entry ${seen?'seen':'locked'}"><div class="pf-journal-icon">${seen?icon:'?'}</div><div><small>${seen?'DISCOVERED':'UNDISCOVERED'}</small><b>${seen?name:'UNDISCOVERED'}</b><span>${seen?desc:'Keep playing. PackForge does not reveal what is missing.'}</span></div>${seen?`<strong>×${Number(count).toLocaleString()}</strong>`:''}</article>`}).join('')}
  const pfBaseRenderStats=renderStats;renderStats=function(){pfBaseRenderStats();pfRenderChances();pfRenderJournal();const rs=$('#recordStatsGrid');if(rs){const jetOwned=pfOwnedCount(JET_LUMAGUI_CARD.id),ghostOwned=pfOwnedCount(GHOST_CARD.id),crueOwned=pfOwnedCount(PF_CRUE_LOWE_CARD.id);rs.insertAdjacentHTML('beforeend',`<div class="stat-tile"><small>Jet Lumagui Owned</small><b>${jetOwned.toLocaleString()}</b></div><div class="stat-tile"><small>Ghost Cards Owned</small><b>${ghostOwned.toLocaleString()}</b></div><div class="stat-tile"><small>Crue Lowe Owned</small><b>${crueOwned.toLocaleString()}</b></div>`)} };

  /* ---------- Automatic rotating backups + export/import ---------- */
  function pfBackupMeta(){return PF_BACKUP_KEYS.map((k,i)=>{try{const raw=localStorage.getItem(k);if(!raw)return null;const o=JSON.parse(raw);return {slot:i+1,key:k,raw,lastTick:Number(o.lastTick||0),cash:Number(o.cash||0),cards:Object.keys(o.inventory||{}).length}}catch(e){return null}}).filter(Boolean)}
  function pfSnapshotCurrent(force=false){if(tutorialTrainingMode)return;try{const now=Date.now(),last=Number(localStorage.getItem(PF_BACKUP_STAMP)||0);if(!force&&now-last<10*60*1000)return;const current=localStorage.getItem(saveKey);if(!current)return;JSON.parse(current);for(let i=PF_BACKUP_KEYS.length-1;i>0;i--){const prev=localStorage.getItem(PF_BACKUP_KEYS[i-1]);if(prev)localStorage.setItem(PF_BACKUP_KEYS[i],prev)}localStorage.setItem(PF_BACKUP_KEYS[0],current);localStorage.setItem(PF_BACKUP_STAMP,String(now))}catch(e){try{localStorage.removeItem(PF_BACKUP_KEYS[2]);localStorage.setItem(PF_BACKUP_STAMP,String(Date.now()))}catch(_){}}}
  const pfBaseFlushSave=flushSave;flushSave=function(){if(!tutorialTrainingMode&&saveDirty)pfSnapshotCurrent(false);return pfBaseFlushSave()};
  function pfUpdateBackupUI(){const el=$('#pfBackupSummary');if(!el)return;const m=pfBackupMeta();el.textContent=m.length?m.map(x=>`Slot ${x.slot}: ${x.lastTick?new Date(x.lastTick).toLocaleString():'unknown time'} · ${fmt(x.cash)}`).join(' | '):'No recovery snapshot yet. One will be created automatically as you continue playing.'}
  function pfExportSave(){save(true);const raw=localStorage.getItem(saveKey)||JSON.stringify(state,compactSaveReplacer),blob=new Blob([raw],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`PackForge_Save_${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Save exported','Keep that JSON file somewhere safe.')}
  function pfImportSaveFile(file){if(!file)return;const r=new FileReader();r.onload=()=>{try{const obj=JSON.parse(String(r.result||''));if(!obj||typeof obj!=='object'||Array.isArray(obj)||!obj.inventory||obj.cash===undefined)throw new Error('invalid');showConfirm('Import PackForge save?',`This will replace the current local save with the selected file. A recovery snapshot of the current save will be attempted first.`,`Import & Reload`,()=>{pfSnapshotCurrent(true);localStorage.setItem(saveKey,JSON.stringify(obj));location.reload()},true)}catch(e){sfx('error');toast('Import failed','That file does not look like a valid PackForge save.')}};r.readAsText(file)}
  function pfRestoreLatest(){const m=pfBackupMeta();if(!m.length){toast('No backup available','Keep playing and PackForge will create rotating recovery snapshots.');return}const x=m[0];showConfirm('Restore latest recovery snapshot?',`Restore Slot ${x.slot} from <b>${x.lastTick?new Date(x.lastTick).toLocaleString():'an earlier save'}</b>? Your current save will be backed up first.`,`Restore & Reload`,()=>{const raw=localStorage.getItem(x.key);if(!raw)return;const current=localStorage.getItem(saveKey);if(current)localStorage.setItem(PF_BACKUP_KEYS[1],current);localStorage.setItem(saveKey,raw);location.reload()},true)}

  /* ---------- Changelog / update badge / offline summary ---------- */
  function pfClearUpdateBadge(){try{localStorage.setItem(PF_CHANGELOG_KEY,'1')}catch(e){};$('#pfUpdateBadge')?.classList.add('hidden')}
  function pfShowWhatsNew(){pfClearUpdateBadge();const m=$('#confirmModal');m.classList.remove('hidden');m.innerHTML=`<div class="modal pf-whats-new fade-in"><div class="modal-head"><h3>PackForge v${PF_VERSION}</h3><button class="close-x" id="pfWhatsNewClose">×</button></div><div class="modal-body"><div class="pf-update-kicker">ODDS & GOD PACK UPDATE</div><h2>The pack chase just got deeper.</h2><div class="pf-change-grid"><span>❓ One centralized Pack Odds browser in Shop and Bag</span><span>🃏 Individual card odds with 50-card pagination</span><span>⚡ Three Semi-God Pack types</span><span>🌟 Five true God Pack types with wrapper mutations</span><span>💎 Guaranteed Holo and 👁️ Secret God Packs</span><span>∞ Archive God Pack · one of every card in the selected set</span><span>🛠️ Dev Board controls for every new pack mode</span><span>🔑 Dev Board Codes tab + new force-test codes</span><span>💻 Archive reveal is paginated to protect weak Chromebooks</span></div><button class="grade-action" id="pfWhatsNewDone">Got it</button></div></div>`;const close=()=>{m.classList.add('hidden');m.innerHTML=''};$('#pfWhatsNewClose').onclick=close;$('#pfWhatsNewDone').onclick=close}
  try{if(localStorage.getItem(PF_CHANGELOG_KEY)==='1')$('#pfUpdateBadge')?.classList.add('hidden')}catch(e){}
  const pfOfflineStart=Number(state.lastTick||Date.now()),pfOfflineMs=Math.max(0,Date.now()-pfOfflineStart),pfOfflineGrades=(()=>{let n=0;for(const it of Object.values(state.inventory||{}))for(const ld of Object.values(it.levels||{}))for(const cp of ld.copies||[])if(cp.gradingUntil&&cp.gradingUntil<=Date.now())n++;return n})(),pfOfflineCampaigns=pfActiveCampaigns().filter(a=>a.endsAt<=Date.now()).length;
  if(pfOfflineMs>5*60*1000&&(pfOfflineGrades||pfOfflineCampaigns))setTimeout(()=>toast('While you were away',[pfOfflineGrades?`${pfOfflineGrades} grading job${pfOfflineGrades===1?'':'s'} finished`:null,pfOfflineCampaigns?`${pfOfflineCampaigns} campaign${pfOfflineCampaigns===1?'':'s'} completed`:null].filter(Boolean).join(' · ')),1200);

  /* ---------- Automatic performance guard ---------- */
  let pfGuardFrames=0,pfGuardStart=performance.now(),pfGuardTriggered=false;
  function pfGuardLoop(now){
    if(pfGuardTriggered||state.settings?.autoPerformanceGuard===false)return;
    const gameVisible=!document.hidden&&!$('#gameApp')?.classList.contains('hidden');
    if(!gameVisible){pfGuardFrames=0;pfGuardStart=performance.now();requestAnimationFrame(pfGuardLoop);return}
    pfGuardFrames++;
    if(now-pfGuardStart<8000){requestAnimationFrame(pfGuardLoop);return}
    const fps=pfGuardFrames/Math.max(.001,(now-pfGuardStart)/1000);pfGuardTriggered=true;
    if(fps<35){state.settings.quality='performance';if(state.settings.particles==='full')state.settings.particles='reduced';if(state.settings.antiLag==='off')state.settings.antiLag='aggressive';applyPerformanceSettings();syncSettingsUI();markSaveDirty();save();toast('Performance mode enabled',`PackForge measured about ${Math.round(fps)} FPS and reduced expensive visuals. Gameplay and odds are unchanged.`)}
  }
  requestAnimationFrame(pfGuardLoop);

  /* ---------- Admin queue + controls ---------- */
  function pfAdminGrantByRarity(rarity,amount=1){
    if(!pfAdminUnlocked)return;amount=clamp(Math.floor(Number(amount)||1),1,100);let pool=[];
    if(rarity==='Jet Lumagui')pool=[JET_LUMAGUI_CARD];else if(rarity==='Ghost'||rarity==='Ghost / Unlisted')pool=[GHOST_CARD];else if(rarity==='Crue Lowe')pool=[PF_CRUE_LOWE_CARD];else if(rarity==='Secret')pool=allCards.filter(c=>c.secret);else pool=allCards.filter(c=>!c.secret&&c.rarity===rarity);
    if(!pool.length){setPfAdminStatus(`No cards found for ${rarity}.`,false,true);return}
    for(let i=0;i<amount;i++){const card=pool[Math.floor(Math.random()*pool.length)],copy=makeCopy('Normal',null,null);copy.source='Admin Rarity Grant';if(card.crue){copy.grade=1;copy.gradedAt=Date.now()}addPull({card,copy,newDiscovery:!state.discovered[card.id],added:false,special:false,nearMiss:null},themes.find(t=>t.id===card.theme)||themes[0]);if(card.jet)state.quirkStats.jetLumagui=(state.quirkStats.jetLumagui||0)+1;if(card.ghost)state.quirkStats.ghostCards=(state.quirkStats.ghostCards||0)+1;if(card.crue)state.quirkStats.crueLowe=(state.quirkStats.crueLowe||0)+1}
    invalidateCollectionValue();markSaveDirty();save(true);renderAll();renderPfAdminBoard();toast('Admin card grant',`${amount} random ${rarity} card${amount===1?'':'s'} added to Bag → Cards.`)
  }
  function pfEnsureAdminRarityGrant(){const board=$('#pfAdminBoard');if(!board||$('#pfAdminRarityGrant'))return;const wrap=document.createElement('div');wrap.id='pfAdminRarityGrant';wrap.className='pf-admin-direct-grant';wrap.innerHTML=`<div class="settings-section-title">Direct Card Grant</div><div class="pf-admin-section-note">Choose a rarity and instantly add random cards of that rarity to Bag → Cards. Ghost and Crue are included for testing.</div><div class="setting-row pf-admin-grant-row"><div><b>Give card by rarity</b><div class="hint">Uses real card copies and history/discovery tracking; it does not alter normal odds.</div></div><div class="pf-admin-grant-controls"><select class="pf-admin-select" id="pfAdminGrantRarity">${['Common','Uncommon','Rare','Epic','Legendary','Mythic','Divine','Ultra','Jet Lumagui','Secret','Ghost','Crue Lowe'].map(r=>`<option value="${r}">${r}</option>`).join('')}</select><input class="code-input pf-admin-number" id="pfAdminGrantRarityAmount" type="number" min="1" max="100" step="1" value="1"><button class="ghost-btn pf-admin-good" id="pfAdminGrantRarityBtn" type="button">Give Card</button></div></div>`;board.appendChild(wrap);$('#pfAdminGrantRarityBtn').onclick=()=>pfAdminGrantByRarity($('#pfAdminGrantRarity').value,$('#pfAdminGrantRarityAmount').value)}
  const pfBaseRenderAdmin=renderPfAdminBoard;renderPfAdminBoard=function(){pfBaseRenderAdmin();if(!pfAdminUnlocked)return;pfEnsureAdminRarityGrant();const ownedGhost=pfOwnedCount(GHOST_CARD.id),ownedCrue=pfOwnedCount(PF_CRUE_LOWE_CARD.id);if($('#pfAdminGhostOwned'))$('#pfAdminGhostOwned').textContent=ownedGhost.toLocaleString();if($('#pfAdminCrue'))$('#pfAdminCrue').textContent=(state.quirkStats.crueLowe||0).toLocaleString();const af=state.adminForces||{},items=[];if(af.godMode)items.push(['🌟',af.godMode==='rarity'?'Epic+ God Pack':'Variant God Pack','next pack']);if(af.bonusNext)items.push(['📦','6-Card Pack','next pack']);if(af.ghostNext)items.push(['👻','Ghost Card','next pack']);if(af.crueNext)items.push(['♜','Crue Lowe','next pack']);if(af.jetNext)items.push(['🌫️','Jet Lumagui','next pack']);if(af.blackLabelNext)items.push(['🏷','Black Label','next grading']);const q=$('#pfAdminQueueItems');if(q)q.innerHTML=items.length?items.map((x,i)=>`<div class="pf-queue-item"><span>${i+1}</span><b>${x[0]} ${x[1]}</b><small>${x[2]}</small></div>`).join(''):'<div class="pf-queue-empty">Queue is empty.</div>';const fs=$('#pfAdminForceStatus');if(fs)fs.textContent=items.length?`${items.length} forced outcome${items.length===1?'':'s'} queued.`:'No rare outcome is currently queued.'};
  function pfBindNewControls(){
    const c=$('#pfAdminCruePack');if(c&&!c.dataset.bound){c.dataset.bound='1';c.onclick=()=>{if(!pfAdminUnlocked)return;state.adminForces.crueNext=true;const t=pfAdminGrantTestPack(1);pfAdminAfterAction(`Crue Lowe queued for the next opened pack. Added 1 ${t?.name||''} Pack.`)}}
    const bindOnce=(el,key,fn)=>{if(el&&!el.dataset[key]){el.dataset[key]='1';el.addEventListener('click',fn)}};bindOnce($('#pfExportSave'),'pfBound',pfExportSave);bindOnce($('#pfImportSave'),'pfBound',()=>$('#pfImportSaveFile')?.click());const fi=$('#pfImportSaveFile');if(fi&&!fi.dataset.bound){fi.dataset.bound='1';fi.onchange=()=>{pfImportSaveFile(fi.files?.[0]);fi.value=''}};bindOnce($('#pfRestoreBackup'),'pfBound',pfRestoreLatest);bindOnce($('#pfRefreshBackups'),'pfBound',pfUpdateBackupUI);bindOnce($('#pfWhatsNewBtn'),'pfBound',pfShowWhatsNew);const ap=$('#pfAutoPerformanceGuard');if(ap&&!ap.dataset.bound){ap.dataset.bound='1';ap.classList.toggle('on',state.settings.autoPerformanceGuard!==false);ap.onclick=()=>{state.settings.autoPerformanceGuard=!state.settings.autoPerformanceGuard;ap.classList.toggle('on',state.settings.autoPerformanceGuard);save()}};$$('[data-stats-tab="chances"],[data-stats-tab="journal"]').forEach(b=>{if(!b.dataset.bound){b.dataset.bound='1';b.onclick=()=>{setStatsTab(b.dataset.statsTab);pfClearUpdateBadge()}}});const sn=document.querySelector('.side-btn[data-view="stats"]');if(sn&&!sn.dataset.pfUpdateBound){sn.dataset.pfUpdateBound='1';sn.addEventListener('click',pfClearUpdateBadge)};pfUpdateBackupUI();
  }
  setTimeout(pfBindNewControls,0);
  const pfBaseSyncSettings=syncSettingsUI;syncSettingsUI=function(){pfBaseSyncSettings();const ap=$('#pfAutoPerformanceGuard');if(ap)ap.classList.toggle('on',state.settings.autoPerformanceGuard!==false);pfUpdateBackupUI();pfBindNewControls()};
  const pfBaseSetSettingsTab=setSettingsTab;setSettingsTab=function(tab='audio'){pfBaseSetSettingsTab(tab);if(tab==='save')pfUpdateBackupUI();if(tab==='admin'){renderPfAdminBoard();pfBindNewControls()}};
  const pfBaseShowView=showView;showView=function(v){pfBaseShowView(v);if(v==='stats'){pfRenderChances();pfRenderJournal()}if(v==='grading')renderGrading();if(v==='campaigns')renderCampaigns()};

  /* Keep admin queue/status fresh during normal render cycles. */
  const pfBaseRenderAll=renderAll;renderAll=function(){pfBaseRenderAll();if(pfAdminUnlocked)renderPfAdminBoard();pfRenderChances();pfRenderJournal()};

  /* New rarity filter entry and a visible Unlisted status hint. */
  const rf=$('#rarityFilter');if(rf&&!Array.from(rf.options).some(o=>o.value==='Jet Lumagui')){const j=document.createElement('option');j.value='Jet Lumagui';j.textContent='Jet Lumagui';rf.appendChild(j)}
  if(rf&&!Array.from(rf.options).some(o=>o.value==='Crue Lowe')){const o=document.createElement('option');o.value='Crue Lowe';o.textContent='Crue Lowe';rf.appendChild(o)}

  /* Changelog on first returning launch; delayed so the tutorial keeps priority. */
  window.addEventListener('pf:enterGame',()=>{setTimeout(()=>{try{if(localStorage.getItem(PF_CHANGELOG_KEY)!=='1'&&!tutorialTrainingMode)pfShowWhatsNew()}catch(e){}},1800)});





  /* PackForge v3.1 — campaign-focused balance/presentation patch. Local-only; no network calls. */
  (()=>{
    'use strict';
    const $q=s=>document.querySelector(s), $$q=s=>[...document.querySelectorAll(s)];
  
    /* Retire Overdrive without deleting legacy save fields. Old saves remain readable. */
    try{if(state.overdrive){state.overdrive.points=0;state.overdrive.activeUntil=0;state.overdrive.clickRemainder=0;state.overdrive.packRemainder=0}}catch(e){}
    try{overdriveActive=()=>false;overdriveBoost=()=>1;addOverdriveProgress=()=>false;launchOverdrive=()=>false;renderOverdrive=()=>{}}catch(e){}
    document.body.classList.remove('pf-overdrive-live');
  
    /* ---------- Campaign spotlights: bonuses only ---------- */
    const PF_FOCUS_POWER=.35, PF_EXTRA_CARD_REWARD=.04, PF_MATCH_REWARD=.06, PF_TEAM_REWARD_CAP=.35;
    const PF_VARIANTS=['Foil','Holo','Gold','Prismatic'];
    function pfHash(str){let h=2166136261>>>0;for(const ch of String(str)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
    function pfFocus(def){
      if(!def)return {type:'none',label:'Open Format',detail:'Any card works normally.',key:''};
      const h=pfHash(def.offerId||def.name||'campaign');
      const mode=h%4;
      if(mode===0){const pool=basePackThemes();const t=pool[(h>>>4)%Math.max(1,pool.length)];return {type:'theme',key:t?.id||'medieval',label:`${t?.name||'Medieval'} Spotlight`,detail:`${t?.name||'Medieval'} cards gain +35% campaign Power.`}}
      if(mode===1){const pool=['Rare','Epic','Legendary'];const r=pool[(h>>>5)%pool.length];return {type:'rarity',key:r,label:`${r} Spotlight`,detail:`${r} cards gain +35% campaign Power.`}}
      if(mode===2){const v=PF_VARIANTS[(h>>>6)%PF_VARIANTS.length];return {type:'variant',key:v,label:`${v} Spotlight`,detail:`${v} cards gain +35% campaign Power.`}}
      return {type:'grade',key:'9',label:'Mint Spotlight',detail:'Cards graded 9.0+ gain +35% campaign Power.'}
    }
    function pfFocusMatch(x,focus){
      if(!x||!focus)return false;
      if(focus.type==='theme')return x.card.theme===focus.key;
      if(focus.type==='rarity')return (x.card.ghost?'Ghost':x.card.secret?'Secret':x.card.rarity)===focus.key;
      if(focus.type==='variant')return (x.copy.variant||'Normal')===focus.key;
      if(focus.type==='grade')return Number(x.copy.grade||0)>=9;
      return false;
    }
    function pfCampaignMetrics(def,cards=selectedCampaignCards()){
      const focus=pfFocus(def),rawPower=cards.reduce((n,x)=>n+x.power,0),matches=cards.filter(x=>pfFocusMatch(x,focus));
      const focusBonus=matches.reduce((n,x)=>n+x.power*PF_FOCUS_POWER,0),power=Math.round(rawPower+focusBonus);
      const teamBonus=Math.min(PF_TEAM_REWARD_CAP,Math.max(0,cards.length-1)*PF_EXTRA_CARD_REWARD+matches.length*PF_MATCH_REWARD);
      return {focus,rawPower,power,matches:matches.length,teamBonus,cards};
    }
    try{selectedCampaignPower=function(){const def=campaignFlowOffer?.()||selectedCampaignOffer?.();return pfCampaignMetrics(def,selectedCampaignCards()).power}}catch(e){}
  
    /* Campaign team picker: extra cards and spotlight matches visibly matter. */
    renderCampaignTeamFlow=function(){
      const stage=$q('#campaignStage'),def=campaignFlowOffer();if(!stage||!def){campaignResetFlow();renderCampaigns();return}
      const selected=selectedCampaignCards();state.campaigns.selected=selected.map(x=>x.copy.uid);
      const m=pfCampaignMetrics(def,selected),ready=selected.length>=1&&m.power>=def.power&&pfActiveCampaigns().length<2,speed=campaignSpeed(def,m.power),projected=campaignEffectiveMinutes(def,m.power),tier=campaignTier(def,m.power);
      let entries=allOwnedCopies().filter(x=>!x.copy.gradingUntil&&!copyIsCampaignCommitted(x.copy.uid)&&!copyIsShowcased(x.copy.uid)&&!state.campaigns.selected.includes(x.copy.uid));
      if(typeof campaignSearch!=='undefined'&&campaignSearch){const q=campaignSearch.toLowerCase();entries=entries.filter(x=>x.card.name.toLowerCase().includes(q)||x.card.theme.toLowerCase().includes(q)||x.card.rarity.toLowerCase().includes(q)||(x.copy.variant||'').toLowerCase().includes(q))}
      entries.sort((a,b)=>Number(pfFocusMatch(b,m.focus))-Number(pfFocusMatch(a,m.focus))||b.power-a.power||rarityRankForCampaign(b.card)-rarityRankForCampaign(a.card));entries=entries.slice(0,100);
      const teamBonusPct=Math.round(m.teamBonus*100);
      stage.innerHTML=`<div class="campaign-flow-top"><button class="campaign-flow-back" id="campaignFlowBack">← Campaigns</button><div><small>STEP 2 OF 2</small><h2>${def.name}</h2><p>Select 1–5 cards. Matching cards receive the spotlight Power bonus; every extra card improves the reward bonus.</p></div></div>
        <div class="pf-campaign-focus"><div><small>CAMPAIGN SPOTLIGHT</small><b>${m.focus.label}</b><span>${m.focus.detail}</span></div><strong>+35% PWR</strong></div>
        <div class="campaign-flow-summary"><span><small>Required Power</small><b>${def.power.toLocaleString()}</b></span><span><small>Base Time</small><b>${campaignDurationLabel(def.baseMinutes)}</b></span><span><small>Projected</small><b>${m.power>=def.power?campaignDurationLabel(projected):'—'}</b></span><span><small>Team Reward</small><b>+${teamBonusPct}%</b></span></div>
        <div class="campaign-team">${[0,1,2,3,4].map(i=>{const x=selected[i],match=x&&pfFocusMatch(x,m.focus);return x?`<div class="campaign-slot filled ${match?'pf-focus-match':''}" style="--slot:${rarityColor[x.card.ghost?'Ghost':x.card.rarity]||'#fff'}"><button data-remove-campaign="${x.copy.uid}">×</button>${match?'<em>SPOTLIGHT +35%</em>':''}<b>${x.card.name}</b><small>${x.card.rarity} · ${x.copy.variant||'Normal'} · Lv ${x.level}</small><span class="slot-power">${x.power.toLocaleString()} PWR${match?` → ${Math.round(x.power*1.35).toLocaleString()}`:''}</span></div>`:`<div class="campaign-slot"><small>${i===0?'MINIMUM 1 CARD':'OPTIONAL · +4% REWARD'}</small></div>`}).join('')}</div>
        <div class="campaign-power-line"><span>Effective Team Power <small>${m.rawPower.toLocaleString()} base${m.matches?` · ${m.matches} spotlight`:''}</small></span><strong class="${m.power>=def.power?'ready':''}">${m.power.toLocaleString()} / ${def.power.toLocaleString()}</strong></div><div class="campaign-meter"><i style="width:${Math.min(100,m.power/def.power*100)}%"></i></div><div class="campaign-speed-readout">${m.power>=def.power?`${speed.toFixed(speed>=10?0:1)}× campaign speed · ${tier.name} reward tier · +${teamBonusPct}% team rewards`:'Add more effective Power to qualify.'}</div>
        <div class="campaign-picker-head"><h3>Your cards</h3><input class="campaign-search" id="campaignSearch" value="${String(typeof campaignSearch!=='undefined'?campaignSearch:'').replace(/"/g,'&quot;')}" placeholder="Search cards…"></div>
        <div class="campaign-card-list">${entries.length?entries.map(x=>{const match=pfFocusMatch(x,m.focus);return `<button class="campaign-pick ${match?'pf-focus-pick':''}" data-add-campaign="${x.copy.uid}" ${selected.length>=5?'disabled':''} style="--rarity:${rarityColor[x.card.ghost?'Ghost':x.card.rarity]||'#fff'}"><span class="rarity-stripe"></span><span><b>${x.card.name}</b><small>${themes.find(t=>t.id===x.card.theme)?.name||x.card.theme} · ${x.card.rarity} · ${x.copy.variant||'Normal'} · Lv ${x.level}${match?' · SPOTLIGHT':''}</small></span><span class="pick-power">${x.power.toLocaleString()}${match?`<small>+${Math.round(x.power*.35).toLocaleString()}</small>`:''}</span></button>`}).join(''):'<div class="campaign-locked-note">No eligible cards.</div>'}</div>
        <div class="campaign-flow-footer"><button class="campaign-clear" id="campaignClear">Clear</button><div><small>${selected.length} card${selected.length===1?'':'s'} selected · ${m.matches} spotlight</small><b>${m.power>=def.power?campaignDurationLabel(projected):campaignDurationLabel(def.baseMinutes)} projected · +${teamBonusPct}% rewards</b></div><button class="campaign-next-launch" id="campaignLaunchNext" ${ready&&canAfford(campaignEntryFee(def))?'':'disabled'}>LAUNCH →</button></div>`;
      $q('#campaignFlowBack').onclick=()=>{state.campaigns.flowStep='offers';state.campaigns.selected=[];save();renderCampaigns()};
      $$q('[data-remove-campaign]').forEach(b=>b.onclick=()=>{state.campaigns.selected=state.campaigns.selected.filter(u=>u!==b.dataset.removeCampaign);save();renderCampaigns()});
      $$q('[data-add-campaign]').forEach(b=>b.onclick=()=>{if(state.campaigns.selected.length>=5)return;state.campaigns.selected.push(b.dataset.addCampaign);save();renderCampaigns()});
      $q('#campaignClear').onclick=()=>{state.campaigns.selected=[];save();renderCampaigns()};
      $q('#campaignLaunchNext').onclick=()=>{state.campaigns.selectedOfferId=def.offerId;state.campaigns.flowStep='journey';save();campaignStart(def)};
      $q('#campaignSearch').oninput=e=>{campaignSearch=e.target.value;renderCampaigns();const inp=$q('#campaignSearch');if(inp){inp.focus();inp.setSelectionRange(inp.value.length,inp.value.length)}};
    };
  
    campaignStart=function(def){
      const cards=selectedCampaignCards(),m=pfCampaignMetrics(def,cards),entryFee=campaignEntryFee(def),runs=pfActiveCampaigns();
      if(runs.length>=2){toast('Both campaign slots are busy','Collect a finished campaign or wait for one to complete.');return}
      if(!def||!state.campaigns.offers.some(o=>o.offerId===def.offerId)){sfx('error');return}
      if(m.power<def.power||!campaignRequirementOK(def,cards)){sfx('error');toast('Not enough effective Power',cards.length?`You need ${def.power.toLocaleString()} effective Power. Spotlight cards get +35%.`:'Select at least one card.');return}
      if(entryFee>0&&!spend(entryFee)){sfx('error');toast('Not enough cash',`Entry costs ${fmt(entryFee)}.`);return}
      const now=Date.now(),durationMs=campaignDurationMs(def,m.power),speed=campaignSpeed(def,m.power),run={offer:{...def,fee:entryFee},offerId:def.offerId,startedAt:now,endsAt:now+durationMs,durationMs,cardUids:cards.map(x=>x.copy.uid),rawPower:m.rawPower,power:m.power,focus:m.focus,focusMatches:m.matches,teamBonus:m.teamBonus,fee:entryFee,speed,notified:false};
      if(!state.campaigns.active)state.campaigns.active=run;else state.campaigns.active2=run;state.campaigns.selected=[];state.campaigns.flowStep='offers';state.campaigns.flowOfferId=null;state.stats.campaignsStarted=(state.stats.campaignsStarted||0)+1;state.stats.campaignPowerSent=(state.stats.campaignPowerSent||0)+m.power;state.stats.campaignMinutes=(state.stats.campaignMinutes||0)+durationMs/60000;sfx('buy');save();renderHUD();renderCampaigns();toast('Campaign launched',`${def.name} · ${m.matches} spotlight card${m.matches===1?'':'s'} · +${Math.round(m.teamBonus*100)}% team rewards.`)
    };
  
    /* Visual-only campaign clash. No combat math: the real campaign still uses Power/time/rewards. */
    pfCampaignRunHTML=function(a,slot){
      const def=a.offer,remaining=a.endsAt-Date.now(),done=remaining<=0,duration=a.durationMs||(a.endsAt-a.startedAt)||def.baseMinutes*60000,pct=clamp((Date.now()-a.startedAt)/duration*100,0,100),tier=campaignTier(def,a.power),ownedMap=new Map(allOwnedCopies().map(x=>[x.copy.uid,x])),team=(a.cardUids||[]).map(u=>ownedMap.get(u)).filter(Boolean),focus=a.focus||pfFocus(def);
      const fighters=team.slice(0,5).map((x,i)=>`<div class="pf-campaign-fighter f${i+1}" style="--fc:${rarityColor[x.card.ghost?'Ghost':x.card.rarity]||'#fff'};--fd:${i*.12}s"><b>${x.card.name}</b><small>${x.power.toLocaleString()} PWR</small></div>`).join('');
      return `<div class="pf-campaign-run pf-campaign-battle ${done?'done':''}" data-pf-campaign-slot="${slot}"><div class="pf-run-head"><span>CAMPAIGN SLOT ${slot}</span><b>${def.name}</b><small>${tier.name} tier · ${focus.label} · +${Math.round((a.teamBonus||0)*100)}% team reward</small></div><div class="pf-battle-stage" aria-hidden="true"><div class="pf-team-side">${fighters}</div><div class="pf-clash-core">✦</div><div class="pf-rival-side"><i></i><i></i><i></i></div></div><div class="campaign-big-timer">${done?'COMPLETE':campaignTime(remaining)}</div><div class="campaign-progress"><i style="width:${pct}%"></i></div>${done?`<button class="campaign-collect" data-pf-collect-campaign="${slot}">COLLECT REWARDS</button>`:`<div class="campaign-help">${a.power.toLocaleString()} effective Power · ${team.length} card${team.length===1?'':'s'} working · timer continues while away.</div>`}</div>`
    };
  
    pfCollectCampaignSlot=function(slot){
      const key=slot===2?'active2':'active',a=state.campaigns[key];if(!a||Date.now()<a.endsAt)return;const def=a.offer;if(!def)return;
      const tier=campaignTier(def,a.power),fallbackRewards=campaignRewardsForMinutes(def.baseMinutes||def.minutes||20,def.difficulty||'standard'),teamBonus=clamp(Number(a.teamBonus||0),0,PF_TEAM_REWARD_CAP),cash=Math.round((def.cashReward??fallbackRewards.cash)*(1+Math.min(.35,(a.power/def.power-1)*.025))*(1+teamBonus));if(cash>0)earn(cash);
      const packRewards=[];const packCount=(def.packs||0)+tier.bonusPacks;for(let i=0;i<packCount;i++){const p=campaignAddPack(null,false);if(p)packRewards.push(p)}const extraChance=Math.min(.98,(def.packChance||0)+(tier.extraPackChance||0)+teamBonus*.8);if(Math.random()<extraChance){const p=campaignAddPack(null,false);if(p)packRewards.push(p)}let specialWon=false;const specialChance=Math.min(.90,(def.special||0)+(tier.specialBonus||0)+teamBonus*.18);if(Math.random()<specialChance){const p=campaignAddPack(null,true);if(p){packRewards.push(p);specialWon=true}}let potionWon=null;const hiddenSetWon=tryUnlockCampaignSet();state.campaigns.completed.total=(state.campaigns.completed.total||0)+1;state.campaigns[key]=null;state.stats.campaignsCompleted=(state.stats.campaignsCompleted||0)+1;state.stats.campaignCash=(state.stats.campaignCash||0)+cash;state.stats.campaignPacksWon=(state.stats.campaignPacksWon||0)+packRewards.filter(p=>!p.special).length;state.stats.campaignSpecialsWon=(state.stats.campaignSpecialsWon||0)+(specialWon?1:0);state.stats.campaignPotionsWon=(state.stats.campaignPotionsWon||0)+(potionWon?1:0);const summary={name:def.name,tier:tier.name,power:a.power,cash,packs:packRewards,specialWon,potionWon,hiddenSetWon,speed:a.speed||campaignSpeed(def,a.power)};generateCampaignOffers();sfx('grade');confetti(tier.name==='Master'?28:14);save();renderAll();renderCampaigns();showCampaignRewardPopup(summary)
    };
  
    /* ---------- Collector Requests: rotating duplicate/card sink in Campaign Headquarters ---------- */
    const PF_REQUEST_REFRESH=15*60*1000;
    function pfRequestState(){
      if(!state.collectorRequests||typeof state.collectorRequests!=='object')state.collectorRequests={expiresAt:0,offers:[],completed:0};
      if(!Array.isArray(state.collectorRequests.offers))state.collectorRequests.offers=[];
      return state.collectorRequests;
    }
    function pfRequestEligible(){return allOwnedCopies().filter(x=>!x.card.secret&&!x.card.ghost&&!x.card.crue&&!x.card.jet&&!x.copy.locked&&!x.copy.gradingUntil&&!copyIsCampaignCommitted(x.copy.uid)&&!copyIsShowcased(x.copy.uid))}
    function pfRequestMatch(x,r){if(r.type==='theme')return x.card.theme===r.key;if(r.type==='rarity')return x.card.rarity===r.key;if(r.type==='variant')return (x.copy.variant||'Normal')===r.key;if(r.type==='grade')return Number(x.copy.grade||0)>=9;return false}
    function pfMakeRequests(){
      const pool=pfRequestEligible(),now=Date.now(),offers=[];
      const themesHere=[...new Set(pool.map(x=>x.card.theme))].filter(Boolean),raritiesHere=[...new Set(pool.map(x=>x.card.rarity))].filter(r=>['Common','Uncommon','Rare','Epic'].includes(r)),variantsHere=[...new Set(pool.map(x=>x.copy.variant||'Normal'))].filter(v=>PF_VARIANTS.includes(v));
      if(themesHere.length){const key=themesHere[Math.floor(Math.random()*themesHere.length)],name=themes.find(t=>t.id===key)?.name||key;offers.push({id:`rq_${now}_t`,type:'theme',key,need:3,title:`${name} Curator Order`,desc:`Turn in any 3 ${name} cards.`,mult:1.45,packChance:.35})}
      if(raritiesHere.length){const key=raritiesHere[Math.floor(Math.random()*raritiesHere.length)];offers.push({id:`rq_${now}_r`,type:'rarity',key,need:key==='Epic'?2:3,title:`${key} Collection Buyout`,desc:`Turn in ${key==='Epic'?2:3} ${key} cards.`,mult:1.55,packChance:.25})}
      if(variantsHere.length){const key=variantsHere[Math.floor(Math.random()*variantsHere.length)];offers.push({id:`rq_${now}_v`,type:'variant',key,need:1,title:`${key} Finish Wanted`,desc:`Turn in 1 ${key} card.`,mult:1.75,packChance:.50})}
      else if(pool.some(x=>Number(x.copy.grade||0)>=9)){offers.push({id:`rq_${now}_g`,type:'grade',key:'9',need:1,title:'Mint Grade Acquisition',desc:'Turn in 1 card graded 9.0 or better.',mult:1.80,packChance:1})}
      while(offers.length<3&&raritiesHere.length){const key=raritiesHere[(offers.length+1)%raritiesHere.length];offers.push({id:`rq_${now}_x${offers.length}`,type:'rarity',key,need:2,title:`Quick ${key} Request`,desc:`Turn in 2 ${key} cards.`,mult:1.5,packChance:.2})}
      const st=pfRequestState();st.offers=offers.slice(0,3);st.expiresAt=now+PF_REQUEST_REFRESH;markSaveDirty();save();return st.offers
    }
    function pfEnsureRequests(){const st=pfRequestState();if(Date.now()>=Number(st.expiresAt||0)||(!st.offers.length&&pfRequestEligible().length))pfMakeRequests();return st.offers}
    function pfRequestCandidates(r){return pfRequestEligible().filter(x=>pfRequestMatch(x,r)).sort((a,b)=>sellValue(a.card,a.level,a.copy)-sellValue(b.card,b.level,b.copy))}
    function pfRemoveUid(uidValue){const loc=findCopyByUid(uidValue);if(!loc)return false;const ld=state.inventory?.[loc.cardId]?.levels?.[loc.level],arr=ld?.copies;if(!arr)return false;const i=arr.findIndex(cp=>cp.uid===uidValue);if(i<0)return false;arr.splice(i,1);if(!arr.length){delete state.inventory[loc.cardId].levels[loc.level];if(!Object.keys(state.inventory[loc.cardId].levels||{}).length)delete state.inventory[loc.cardId]}invalidateCollectionValue();markSaveDirty();return true}
    function pfFulfillRequest(id){
      const r=pfEnsureRequests().find(x=>x.id===id);if(!r)return;const candidates=pfRequestCandidates(r);if(candidates.length<r.need){sfx('error');toast('Not enough matching cards',`You need ${r.need} eligible cards for this request.`);return}
      const chosen=candidates.slice(0,r.need),base=chosen.reduce((n,x)=>n+sellValue(x.card,x.level,x.copy),0),reward=Math.max(50,Math.round(base*r.mult));
      showConfirm('Fulfill collector request?',`${r.desc}<br><br>The <b>${r.need} lowest-value eligible matching card${r.need===1?'':'s'}</b> will be consumed.<br>Guaranteed payout: <b>${fmt(reward)}</b>${r.packChance?` · ${Math.round(r.packChance*100)}% chance of a bonus core pack`:''}.`,'Fulfill Request',()=>{for(const x of chosen)pfRemoveUid(x.copy.uid);earn(reward);let pack=null;if(Math.random()<r.packChance)pack=campaignAddPack(null,false);const st=pfRequestState();st.completed=(st.completed||0)+1;state.stats.collectorRequestsCompleted=(state.stats.collectorRequestsCompleted||0)+1;st.offers=st.offers.filter(x=>x.id!==r.id);sfx('grade');confetti(pack?18:9);toast('Collector request complete',`${fmt(reward)} paid${pack?` · bonus ${pack.theme} Pack`:''}.`);save();renderHUD();renderCollection();renderCampaigns()},false)
    }
    function pfRequestHTML(){const st=pfRequestState(),offers=pfEnsureRequests(),left=Math.max(0,st.expiresAt-Date.now()),min=Math.floor(left/60000),sec=Math.floor((left%60000)/1000);return `<section class="pf-collector-requests"><div class="pf-request-head"><div><small>ROTATING COLLECTOR REQUESTS</small><h3>Put spare cards to work</h3><p>Requests pay more than normal selling. Locked, graded-in-progress, Secret, Ghost, Crue Lowe, showcased, and campaign-committed cards are protected.</p></div><span data-pf-request-clock>Refresh ${min}:${String(sec).padStart(2,'0')}</span></div><div class="pf-request-grid">${offers.length?offers.map(r=>{const count=pfRequestCandidates(r).length;return `<article class="pf-request-card ${count>=r.need?'ready':''}"><small>${r.type.toUpperCase()}</small><b>${r.title}</b><p>${r.desc}</p><div><span>${count} / ${r.need} eligible</span><strong>${Math.round((r.mult-1)*100)}% above sell value</strong></div><button data-pf-request="${r.id}" ${count>=r.need?'':'disabled'}>${count>=r.need?'FULFILL':'NEED MORE CARDS'}</button></article>`}).join(''):'<div class="campaign-locked-note">Open more cards to generate collector requests.</div>'}</div></section>`}
  
    /* Wrap final campaign renderer to add spotlight tags + collector requests after the native flow. */
    const pfBaseRenderCampaigns=renderCampaigns;
    renderCampaigns=function(){
      pfBaseRenderCampaigns();
      const view=$q('#view-campaigns .campaign-layout');if(!view)return;
      const stale=$q('#pfCollectorRequestMount');if(stale)stale.remove();
      $$q('.campaign-choice-card[data-campaign-choice]').forEach(card=>{const def=state.campaigns.offers.find(o=>o.offerId===card.dataset.campaignChoice);if(!def||card.querySelector('.pf-offer-focus'))return;const f=pfFocus(def),tag=document.createElement('div');tag.className='pf-offer-focus';tag.innerHTML=`<b>${f.label}</b>`;card.querySelector('h3')?.insertAdjacentElement('afterend',tag)});
      $$q('[data-pf-collect-campaign]').forEach(b=>b.onclick=()=>pfCollectCampaignSlot(+b.dataset.pfCollectCampaign));
    };
  
  
    /* One cheap heartbeat updates timers without rebuilding the animated campaign DOM. */
    window.pfCampaignHeartbeat=function(){
      const now=Date.now(),runs=typeof pfActiveCampaigns==='function'?pfActiveCampaigns():[];
      for(const a of runs){if(now>=a.endsAt&&!a.notified){a.notified=true;save();sfx('grade');toast('Campaign complete',`${a.offer?.name||'Exhibition'} is ready to collect.`)}}
      if(!$q('#view-campaigns')||$q('#view-campaigns').classList.contains('hidden'))return;
      let needsRender=false;
      for(const slot of [1,2]){const a=state.campaigns?.[slot===2?'active2':'active'],el=$q(`.pf-campaign-run[data-pf-campaign-slot="${slot}"]`);if(!a||!el)continue;const done=now>=a.endsAt;if(done&&!el.querySelector('.campaign-collect')){needsRender=true;break}const timer=el.querySelector('.campaign-big-timer'),bar=el.querySelector('.campaign-progress i'),duration=a.durationMs||(a.endsAt-a.startedAt)||1,pct=clamp((now-a.startedAt)/duration*100,0,100);if(timer)timer.textContent=done?'COMPLETE':campaignTime(a.endsAt-now);if(bar)bar.style.width=pct+'%'}
      if(needsRender){renderCampaigns();return}
      if(!runs.length&&typeof updateCampaignRefreshButton==='function')updateCampaignRefreshButton();
    };
  
    /* ---------- Inspect fullscreen ---------- */
    const pfInspectBase=showInspect;
    showInspect=function(...args){
      pfInspectBase(...args);const modal=$q('#inspectModal'),scene=modal?.querySelector('.inspect-scene');if(!modal||!scene)return;
      modal.classList.remove('pf-inspect-fullscreen');
      scene.querySelector('.pf-inspect-view-tools')?.remove();
      const tools=document.createElement('div');tools.className='pf-inspect-view-tools pf-fullscreen-only';tools.innerHTML=`<button type="button" data-pf-fullscreen title="Fullscreen card" aria-label="Fullscreen card">⛶</button>`;scene.appendChild(tools);
      tools.querySelector('[data-pf-fullscreen]').onclick=()=>{modal.classList.toggle('pf-inspect-fullscreen');tools.querySelector('[data-pf-fullscreen]').textContent=modal.classList.contains('pf-inspect-fullscreen')?'⤢':'⛶'};
    };
  
    /* Chances page text: updated Auto Open balance; Overdrive is retired. */
    if(typeof pfRenderChances==='function'){
      const base=pfRenderChances;pfRenderChances=function(){base();const root=$q('#stats-chances');if(!root)return;root.querySelectorAll('*').forEach(el=>{if(el.childNodes.length===1&&el.firstChild?.nodeType===3){el.textContent=el.textContent.replace(/Auto Open halves/gi,'Auto Open uses 75% of').replace(/Auto Open and Overdrive modifiers/gi,'Auto Open modifiers').replace(/and Overdrive/gi,'')}})};
    }
  
    /* Stats should no longer advertise the retired mechanic. */
    if(typeof renderStats==='function'){
      const baseStats=renderStats;renderStats=function(){baseStats();$$q('#view-stats .stat-box,#view-stats .stat-card,#view-stats article').forEach(el=>{if(/overdrive/i.test(el.textContent||''))el.remove()})}
    }
  
    /* Make sure a legacy active boost cannot survive until the next reload. */
    window.addEventListener('pf:enterGame',()=>{document.body.classList.remove('pf-overdrive-live');renderCampaigns()},{once:true});
  })();


  /* ---------- PackForge v3.2: centralized odds, God Pack families, admin code catalog ---------- */
  function pfQueuePackMode(mode){if(!pfAdminUnlocked)return;const d=pfPackModeMeta(mode);if(!d)return;state.adminForces.godMode=mode;const t=pfAdminGrantTestPack(1);pfAdminAfterAction(`${d.name} queued. Added 1 ${t?.name||''} Pack for testing.`)}
  function pfEnsureV32Admin(){
    const board=$('#pfAdminBoard');if(!board)return;
    if(!$('#pfAdminTabs')){const tabs=document.createElement('div');tabs.id='pfAdminTabs';tabs.className='pf-admin-tabs';tabs.innerHTML='<button class="active" data-pf-admin-view="tools">Tools</button><button data-pf-admin-view="codes">Codes</button>';board.prepend(tabs);const codes=document.createElement('div');codes.id='pfAdminCodesPanel';codes.className='pf-admin-codes-panel hidden';board.appendChild(codes);tabs.querySelectorAll('button').forEach(b=>b.onclick=()=>{const codesView=b.dataset.pfAdminView==='codes';board.classList.toggle('pf-admin-show-codes',codesView);tabs.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));codes.classList.toggle('hidden',!codesView);if(codesView)pfRenderAdminCodes()})}
    const grid=board.querySelector('.pf-admin-grid');if(grid&&!$('#pfAdminSemiGodPacks')){const a=document.createElement('div');a.className='pf-admin-stat';a.innerHTML='<small>Semi-God Packs</small><b id="pfAdminSemiGodPacks">0</b>';grid.appendChild(a);const b=document.createElement('div');b.className='pf-admin-stat';b.innerHTML='<small>Archive God Packs</small><b id="pfAdminArchiveGodPacks">0</b>';grid.appendChild(b)}
    const godCard=[...board.querySelectorAll('.pf-admin-tool-card')].find(x=>/God Packs/i.test(x.querySelector('b')?.textContent||''));
    if(godCard&&!$('#pfAdminGodHolo')){godCard.querySelector('.hint').textContent='Force any real Semi-God or God Pack mode. These controls never alter natural odds.';const actions=godCard.querySelector('.pf-admin-actions');actions.innerHTML=`<button class="ghost-btn" id="pfAdminSemiRare">Semi: Rare Rush</button><button class="ghost-btn" id="pfAdminSemiHolo">Semi: Holo Flood</button><button class="ghost-btn" id="pfAdminSemiFinish">Semi: Legendary Finish</button><button class="ghost-btn pf-admin-god" id="pfAdminGodRare">God: Epic+</button><button class="ghost-btn pf-admin-god" id="pfAdminGodVariant">God: Variant</button><button class="ghost-btn pf-admin-god" id="pfAdminGodHolo">God: Holo</button><button class="ghost-btn pf-admin-purple" id="pfAdminGodSecret">God: Secret</button><button class="ghost-btn pf-admin-crue-btn" id="pfAdminGodArchive">God: Archive ∞</button>`;[['#pfAdminSemiRare','semi_rare'],['#pfAdminSemiHolo','semi_holo'],['#pfAdminSemiFinish','semi_finish'],['#pfAdminGodRare','rarity'],['#pfAdminGodVariant','variant'],['#pfAdminGodHolo','holo'],['#pfAdminGodSecret','secret'],['#pfAdminGodArchive','archive']].forEach(([sel,mode])=>{$(sel).onclick=()=>pfQueuePackMode(mode)})}
  }
  function pfRenderAdminCodes(){const host=$('#pfAdminCodesPanel');if(!host)return;const rows=Object.entries(rewardCodeDefs).map(([code,d])=>({code,label:d.label,used:!!(state.redeemedCodes?.[code]||state.redeemedCodes?.[d.rewardId]),tutorial:!!d.tutorialOnly}));host.innerHTML=`<div class="settings-section-title">Retired Reward Codes</div><div class="pf-admin-section-note">Reward-code redemption has been retired.</div><div class="pf-admin-code-list">${rows.map(r=>`<article class="${r.used?'used':''}"><code>${r.code}</code><div><b>${r.label}</b><span>${r.tutorial?'Tutorial only · ':''}${r.used?'USED ON THIS SAVE':'Available'}</span></div></article>`).join('')}</div>`}
  const pfV32AdminBase=renderPfAdminBoard;renderPfAdminBoard=function(){pfV32AdminBase();if(!pfAdminUnlocked)return;pfEnsureV32Admin();const af=state.adminForces||{},d=pfPackModeMeta(af.godMode);const q=$('#pfAdminQueueItems');if(q&&af.godMode){const rest=[...q.querySelectorAll('.pf-queue-item')].filter(x=>!/God Pack|Semi-God|Rare Rush|Holo Flood|Legendary Finish/i.test(x.textContent||''));q.innerHTML=`<div class="pf-queue-item"><span>1</span><b>${d?.emoji||'🌟'} ${d?.name||'Forced Pack'}</b><small>next pack</small></div>`+rest.map(x=>x.outerHTML).join('')}if($('#pfAdminSemiGodPacks'))$('#pfAdminSemiGodPacks').textContent=(state.quirkStats?.semiGodPacks||0).toLocaleString();if($('#pfAdminArchiveGodPacks'))$('#pfAdminArchiveGodPacks').textContent=(state.quirkStats?.archiveGodPacks||0).toLocaleString();pfRenderAdminCodes()};
  pfInstallCentralOddsButtons();
  const pfV32ShowView=showView;showView=function(v){pfV32ShowView(v);if(v==='shop'||v==='collection')pfInstallCentralOddsButtons()};


  /* ---------- PackForge v3.3: UI, odds browser, achievements, grading, admin panel, cinematics ---------- */
  const PF_V33_ORIGINAL_ACHIEVEMENT_IDS=new Set(ACHIEVEMENTS.map(a=>a.id));
  function pfOriginalAchievementCount(){const u=ensureAchievementState().unlocked||{};return Object.keys(u).filter(id=>u[id]&&achievementById(id)&&!String(id).startsWith('v33_')).length}
  const PF_V33_ACHIEVEMENTS=[
    {id:'v33_pack_100',icon:'📦',name:'Box Cutter',desc:'Open 100 packs.',cat:'Packs',tier:'Collector',check:s=>(state.packsOpened||0)>=100},
    {id:'v33_pack_1000',icon:'🏭',name:'Pack Factory',desc:'Open 1,000 packs.',cat:'Packs',tier:'Brutal',check:s=>(state.packsOpened||0)>=1000},
    {id:'v33_cards_500',icon:'🃏',name:'Five Hundred Strong',desc:'Pull 500 cards over the life of the save.',cat:'Collection',tier:'Collector',check:s=>(state.totalCards||0)>=500},
    {id:'v33_cards_5000',icon:'🗄️',name:'Card Warehouse',desc:'Pull 5,000 cards over the life of the save.',cat:'Collection',tier:'Hard',check:s=>(state.totalCards||0)>=5000},
    {id:'v33_value_100k',icon:'💎',name:'Six-Figure Vault',desc:'Reach $100,000 collection value.',cat:'Collection',tier:'Advanced',check:s=>s.collectionValue>=100000},
    {id:'v33_value_1m',icon:'🏛️',name:'Museum Grade',desc:'Reach $1,000,000 collection value.',cat:'Collection',tier:'Brutal',check:s=>s.collectionValue>=1000000},
    {id:'v33_grade_25',icon:'🏷️',name:'Frequent Submitter',desc:'Complete 25 grading submissions.',cat:'Grading',tier:'Advanced',check:s=>(state.stats.gradesCompleted||0)>=25},
    {id:'v33_grade_100',icon:'🧾',name:'Grading Department',desc:'Complete 100 grading submissions.',cat:'Grading',tier:'Hard',check:s=>(state.stats.gradesCompleted||0)>=100},
    {id:'v33_campaign_25',icon:'⚔️',name:'Campaign Regular',desc:'Complete 25 campaigns.',cat:'Campaigns',tier:'Advanced',check:s=>(state.stats.campaignsCompleted||0)>=25},
    {id:'v33_campaign_100',icon:'🏆',name:'Campaign Veteran',desc:'Complete 100 campaigns.',cat:'Campaigns',tier:'Hard',check:s=>(state.stats.campaignsCompleted||0)>=100},
    {id:'v33_secret',icon:'👁️',name:'Behind the Checklist',desc:'Pull a Secret card.',cat:'Rare Pulls',tier:'Hard',check:s=>s.secretCount>=1},
    {id:'v33_ghost',icon:'👻',name:'The Card That Wasn’t There',desc:'Pull a Ghost card.',cat:'Rare Pulls',tier:'Secret',check:s=>(state.quirkStats?.ghostCards||0)>=1},
    {id:'v33_glitch',icon:'🪟',name:'First Fracture',desc:'Own a Nebula variant.',cat:'Rare Pulls',tier:'Hard',check:s=>s.variants.has('Nebula')},
    {id:'v33_god',icon:'🌟',name:'Divine Wrapper',desc:'Open any God Pack.',cat:'Rare Pulls',tier:'Brutal',check:s=>(state.quirkStats?.godPacks||0)>=1},
    {id:'v33_semi',icon:'⚡',name:'Almost Divine',desc:'Open any Semi-God Pack.',cat:'Rare Pulls',tier:'Hard',check:s=>(state.quirkStats?.semiGodPacks||0)>=1},
    {id:'v33_archive',icon:'∞',name:'Archive Complete',desc:'Open an Archive God Pack.',cat:'Rare Pulls',tier:'Secret',check:s=>(state.quirkStats?.archiveGodPacks||0)>=1},
    {id:'v33_crue',icon:'♜',name:'The Fabled Fool',desc:'Pull Crue Lowe.',cat:'Rare Pulls',tier:'Secret',check:s=>(state.quirkStats?.crueLowe||0)>=1},
    {id:'v33_black',icon:'⬛',name:'Perfect Label',desc:'Receive a 10.0 Perfect Black Label.',cat:'Grading',tier:'Brutal',check:s=>(state.quirkStats?.blackLabels||0)>=1},
    {id:'v33_cash_1m',icon:'💰',name:'Millionaire Collector',desc:'Hold $1,000,000 cash at once.',cat:'Economy',tier:'Hard',check:s=>(s.meta.maxCash||0)>=1000000},
    {id:'v33_lock_25',icon:'🔒',name:'Do Not Touch',desc:'Have at least 25 locked card copies.',cat:'Collection',tier:'Advanced',check:s=>s.lockedCount>=25},
    {id:'v33_variants',icon:'🌈',name:'Finish Sampler',desc:'Own at least six different card finishes at the same time.',cat:'Variants',tier:'Hard',check:s=>s.variants.size>=6},
    {id:'v33_sets',icon:'🗂️',name:'Five Complete Collections',desc:'Complete five card sets.',cat:'Collection',tier:'Brutal',check:s=>completedSets()>=5}
  ];
  ACHIEVEMENTS.push(...PF_V33_ACHIEVEMENTS);

  let pfAchievementCategory='All';
  const pfV33RenderAchievementsBase=renderAchievements;
  renderAchievements=function(){
    const host=$('#achievementGrid');if(!host)return;const ach=ensureAchievementState(),count=unlockedAchievementCount(),total=ACHIEVEMENTS.length,pct=Math.round(count/total*100),original=pfOriginalAchievementCount();
    $('#achievementProgressTitle').textContent=`${count} / ${total} Complete`;$('#achievementPercent').textContent=`${pct}%`;$('#achievementProgressBar').style.width=pct+'%';$('#achievementRing').style.setProperty('--ach-pct',pct+'%');$('#achievementProgressCopy').textContent=original>=100?'Original 100-achievement vault reward complete. Bonus achievements continue tracking your collection.':`${original}/100 original achievements toward the 500-pack vault reward · ${total-100} bonus achievements added.`;
    let list=ACHIEVEMENTS.filter(a=>achievementFilter==='all'||(achievementFilter==='unlocked'&&ach.unlocked[a.id])||(achievementFilter==='locked'&&!ach.unlocked[a.id])||(achievementFilter==='hard'&&['Brutal','Secret'].includes(a.tier)));
    if(pfAchievementCategory!=='All')list=list.filter(a=>(a.cat||'Other')===pfAchievementCategory);
    $('#achievementSummary').textContent=`Showing ${list.length} · ${count} unlocked · ${total-count} remaining`;
    let cats=$('#pfAchievementCategories');if(!cats){cats=document.createElement('div');cats.id='pfAchievementCategories';cats.className='pf-achievement-categories';$('#achievementFilters')?.insertAdjacentElement('afterend',cats)}
    const categories=['All',...new Set(ACHIEVEMENTS.map(a=>a.cat||'Other'))];cats.innerHTML=categories.map(c=>`<button class="${c===pfAchievementCategory?'active':''}" data-ach-cat="${pfEscapeHtml(c)}">${pfEscapeHtml(c)}</button>`).join('');cats.querySelectorAll('[data-ach-cat]').forEach(b=>b.onclick=()=>{pfAchievementCategory=b.dataset.achCat;renderAchievements()});
    host.innerHTML=list.map(a=>{const done=!!ach.unlocked[a.id],c=achievementDifficultyColor[a.tier]||'#9ba8b9',when=done?new Date(ach.unlocked[a.id]).toLocaleDateString():'';return `<article class="pf-achievement ${done?'unlocked':'locked'} ${['Brutal','Secret'].includes(a.tier)?'hardest':''}" style="--ach-color:${c}"><div class="pf-ach-icon">${done?a.icon:'?'}</div><div class="pf-ach-copy"><small>${pfEscapeHtml(a.cat||'Other')}</small><h3>${String(ACHIEVEMENTS.indexOf(a)+1).padStart(3,'0')} · ${pfEscapeHtml(a.name)}</h3><p>${pfEscapeHtml(a.desc)}</p></div><div class="pf-ach-meta"><b>${pfEscapeHtml(a.tier)}</b><small>${done?'UNLOCKED '+when:'LOCKED'}</small></div></article>`}).join('');
    $$('#achievementFilters [data-ach-filter]').forEach(b=>b.classList.toggle('active',b.dataset.achFilter===achievementFilter));
  };

  /* Compact two-card grading slots with the actual cards visible. */
  const pfV33RenderGradingMachineBase=renderGradingMachine;
  renderGradingMachine=function(){
    const machine=$('#gradingMachine'),jobs=pfActiveGradingJobs();
    if(jobs.length && !gradingSelection && !lastGradeResult){
      machine.innerHTML=`<div class="pf-grade-live-grid">${[0,1].map((i)=>{const job=jobs[i];if(!job)return `<div class="pf-grade-live-slot empty"><div class="pf-grade-empty-mark">◇</div><b>GRADER ${i+1}</b><span>Available</span></div>`;const elapsed=Date.now()-(job.copy.gradingStartedAt||Date.now()),duration=Math.max(1,(job.copy.gradingUntil||Date.now())-(job.copy.gradingStartedAt||Date.now())),pct=clamp(elapsed/duration*100,0,100);return `<div class="pf-grade-live-slot"><div class="pf-grade-live-card">${cardHTML(job.c,0,job.copy,job.level)}</div><div class="pf-grade-live-info"><small>GRADER ${i+1}</small><b>${pfEscapeHtml(job.c?.name||'Card')}</b><strong>${formatRemaining(job.copy.gradingUntil-Date.now())}</strong><div class="progress"><i style="width:${pct}%"></i></div></div></div>`}).join('')}</div><div class="grading-empty compact"><b>${jobs.length>=2?'Both graders are working':'One grading slot is open'}</b><span>${jobs.length>=2?'Both cards stay visible while the timers run.':'Choose another card from the eligible list to use the second slot.'}</span></div>`;return;
    }
    pfV33RenderGradingMachineBase();
  };

  /* Central odds browser: 40/page, four across, visual selectors. */
  Object.assign(pfOddsState,{variant:pfOddsState.variant||'Normal',specialChoice:pfOddsState.specialChoice||Object.keys(packMutations)[0]});
  function pfOddsPackMock(name,emoji,kind='normal',sub='5 CARDS'){return `<div class="pf-odds-pack-mock ${kind}"><div class="pf-odds-pack-shine"></div><span>${emoji||'▣'}</span><b>${pfEscapeHtml(String(name).toUpperCase())}</b><small>${pfEscapeHtml(sub)}</small></div>`}
  pfOddsCardPageHTML=function(theme){
    const entries=pfOddsCardEntries(theme),pages=Math.max(1,Math.ceil(entries.length/PF_ODDS_PAGE_SIZE));pfOddsState.page=clamp(pfOddsState.page,1,pages);const from=(pfOddsState.page-1)*PF_ODDS_PAGE_SIZE,slice=entries.slice(from,from+PF_ODDS_PAGE_SIZE),v=pfOddsState.variant||'Normal';
    const previewCopy={variant:v,mutation:null,serial:v==='Serialized'?'#237/500':null,grade:null,locked:false};
    return `<div class="pf-odds-card-toolbar v33"><label>Collection<select id="pfOddsThemeSelect">${themes.map(t=>`<option value="${t.id}" ${t.id===theme.id?'selected':''}>${t.emoji} ${t.name}${t.campaignHidden?' · campaign set':''}</option>`).join('')}</select></label><label>Preview finish<select id="pfOddsVariantSelect">${Object.keys(variantDefs).map(x=>`<option value="${x}" ${x===v?'selected':''}>${x}</option>`).join('')}</select></label><div><b>${entries.length}</b><span>listed pulls</span></div><div><b>40</b><span>per page</span></div></div><div class="pf-odds-explain-box">Card odds stay the same when you change the preview finish here. Use <b>Variants</b> for the exact finish chance. Auto Open keeps 75% of Rare+ / Secret / Ghost odds.</div><div class="pf-card-odds-grid v33">${slice.map(({card,manual})=>`<article class="pf-card-odds-item v33"><div class="pf-card-odds-preview v33">${cardHTML(card,0,previewCopy,1)}</div><div class="pf-card-odds-rate"><b>${pfOddsOneIn(manual).replace('1 in','1 /')}</b><span>cards</span></div></article>`).join('')}</div><div class="pf-odds-pagination"><button id="pfOddsPrev" ${pfOddsState.page<=1?'disabled':''}>‹</button><span>Page ${pfOddsState.page} / ${pages}</span><button id="pfOddsNext" ${pfOddsState.page>=pages?'disabled':''}>›</button></div>`;
  };
  pfOddsVariantsHTML=function(){
    const list=['Foil','Holo','Gold','Prismatic','Serialized'],chosen=pfOddsState.variant==='Normal'?'Holo':pfOddsState.variant,card=themes.find(t=>t.id===pfOddsState.themeId)?.cards?.find(c=>c.rarity==='Rare')||allCards.find(c=>!c.secret)||allCards[0],luck=variantLuckMultiplier();let manual=(variantDefs[chosen]?.chance||0)*(chosen==='Foil'?1:luck),auto=manual*.75,copy={variant:chosen,mutation:null,serial:chosen==='Serialized'?'#237/500':null,grade:null,locked:false};
    return `<div class="pf-odds-picker-row"><label>Variant<select id="pfOddsVariantSelect">${list.map(x=>`<option value="${x}" ${x===chosen?'selected':''}>${x}</option>`).join('')}</select></label></div><div class="pf-odds-feature-detail"><div class="pf-odds-big-card">${cardHTML(card,0,copy,1)}</div><div><small>VARIANT CHANCE</small><h3>${chosen}</h3><strong>${pfOddsOneIn(manual)} packs</strong><p>${pfOddsPct(manual)} manual · ${pfOddsPct(auto)} Auto Open.</p><p>Standard variants roll once per normal pack and at most one standard variant is assigned.</p></div></div><div class="pf-odds-mini-strip">${list.map(x=>`<button data-pf-pick-variant="${x}" class="${x===chosen?'active':''}">${x}</button>`).join('')}</div>`;
  };
  pfOddsSpecialHTML=function(){
    const mutationEntries=Object.entries(packMutations).map(([id,d])=>({id:'m:'+id,name:d.name,emoji:'✦',kind:'mutation',d})),premiumEntries=Object.entries(premiumPackDefs).map(([id,d])=>({id:'p:'+id,name:d.name,emoji:d.emoji,kind:'premium',d})),all=mutationEntries.concat(premiumEntries),choice=all.find(x=>x.id===pfOddsState.specialChoice)||all[0];pfOddsState.specialChoice=choice.id;let chanceText='',body='';
    if(choice.kind==='mutation'){const total=Object.values(packMutations).reduce((n,m)=>n+m.weight,0),p=specialPackChance()*(choice.d.weight/total);chanceText=`${pfOddsOneIn(p)} normal packs · ${pfOddsPct(p)}`;body=`${choice.d.desc}. A normal pack first has to roll the overall Special Pack mutation roll.`}
    else{chanceText='Campaign reward · Admin test';body=choice.d.effect+' Specialty packs are not sold in the Shop.'}
    return `<div class="pf-odds-picker-row"><label>Special pack<select id="pfOddsSpecialSelect">${all.map(x=>`<option value="${x.id}" ${x.id===choice.id?'selected':''}>${x.kind==='mutation'?'Mutation':'Campaign reward'} · ${x.name}</option>`).join('')}</select></label></div><div class="pf-odds-feature-detail pack"><div>${pfOddsPackMock(choice.name,choice.emoji,choice.kind==='mutation'?'special':'premium',choice.kind==='mutation'?'SPECIAL MUTATION':'CAMPAIGN REWARD')}</div><div><small>${choice.kind==='mutation'?'NATURAL SPECIAL PACK':'CAMPAIGN SPECIALTY PACK'}</small><h3>${pfEscapeHtml(choice.name)}</h3><strong>${chanceText}</strong><p>${pfEscapeHtml(body)}</p></div></div><div class="pf-odds-pack-gallery">${all.map(x=>`<button data-pf-pick-special="${x.id}" class="${x.id===choice.id?'active':''}">${pfOddsPackMock(x.name,x.emoji,x.kind==='mutation'?'special':'premium',x.kind==='mutation'?'MUTATION':'CAMPAIGN')}<span>${pfEscapeHtml(x.name)}</span></button>`).join('')}</div>`;
  };
  pfOddsPackModeFamilyHTML=function(tier){
    const defs=Object.entries(PF_PACK_MODE_DEFS).filter(([,d])=>d.tier===tier),total=defs.reduce((n,[,d])=>n+d.chance,0);return `<div class="pf-odds-explain-box">${tier==='semi'?`Semi-God packs are stronger than a normal pack but below true God Packs. Combined natural chance: <b>${pfOddsOneIn(total)}</b>.`:`True God Packs visibly mutate before you cut the wrapper. Combined natural chance across all God types: <b>${pfOddsOneIn(total)}</b>.`}</div><div class="pf-god-odds-grid v33">${defs.map(([id,d])=>`<article class="pf-god-odds-card ${tier} mode-${id}">${pfOddsPackMock(d.name,d.emoji,tier+' mode-'+id,tier==='semi'?'SEMI-GOD':'GOD PACK')}<div class="pf-god-copy"><small>${tier==='semi'?'SEMI-GOD PACK':'GOD PACK'}</small><b>${d.name}</b><strong>${pfOddsOneIn(d.chance)} packs</strong><span>${pfOddsPct(d.chance)}</span><p>${d.desc}</p>${id==='archive'?'<em>One of every card in the selected set. Bulk preview stays paginated for weak laptops.</em>':''}</div></article>`).join('')}</div>`;
  };
  pfRenderOddsBrowser=function(){
    const m=$('#oddsModal');if(!m)return;const theme=themes.find(t=>t.id===pfOddsState.themeId)||themes[0],tabs=[['cards','Cards'],['variants','Variants'],['special','Special Packs'],['semi','Semi-God Packs'],['god','God Packs']];let body='';if(pfOddsState.tab==='cards')body=pfOddsCardPageHTML(theme);else if(pfOddsState.tab==='variants')body=pfOddsVariantsHTML();else if(pfOddsState.tab==='special')body=pfOddsSpecialHTML();else if(pfOddsState.tab==='semi')body=pfOddsPackModeFamilyHTML('semi');else body=pfOddsPackModeFamilyHTML('god');
    m.innerHTML=`<div class="modal pf-master-odds-modal fade-in"><div class="pf-master-odds-head"><div><small>PACKFORGE REFERENCE</small><h2>Pack Odds & Pull Chances</h2><p>Card odds, finishes, Special Packs, Semi-God Packs, and God Packs.</p></div><button class="close-x" id="closeOdds">×</button></div><div class="pf-master-odds-tabs">${tabs.map(([id,label])=>`<button data-pf-odds-tab="${id}" class="${pfOddsState.tab===id?'active':''}">${label}</button>`).join('')}</div><div class="pf-master-odds-body">${body}</div></div>`;
    $('#closeOdds').onclick=()=>m.classList.add('hidden');m.onmousedown=e=>{if(e.target===m)m.classList.add('hidden')};$$('[data-pf-odds-tab]').forEach(b=>b.onclick=()=>{pfOddsState.tab=b.dataset.pfOddsTab;pfOddsState.page=1;pfRenderOddsBrowser()});const sel=$('#pfOddsThemeSelect');if(sel)sel.onchange=()=>{pfOddsState.themeId=sel.value;pfOddsState.page=1;pfRenderOddsBrowser()};const vs=$('#pfOddsVariantSelect');if(vs)vs.onchange=()=>{pfOddsState.variant=vs.value;pfRenderOddsBrowser()};const ss=$('#pfOddsSpecialSelect');if(ss)ss.onchange=()=>{pfOddsState.specialChoice=ss.value;pfRenderOddsBrowser()};$$('[data-pf-pick-variant]').forEach(b=>b.onclick=()=>{pfOddsState.variant=b.dataset.pfPickVariant;pfRenderOddsBrowser()});$$('[data-pf-pick-special]').forEach(b=>b.onclick=()=>{pfOddsState.specialChoice=b.dataset.pfPickSpecial;pfRenderOddsBrowser()});if($('#pfOddsPrev'))$('#pfOddsPrev').onclick=()=>{pfOddsState.page--;pfRenderOddsBrowser()};if($('#pfOddsNext'))$('#pfOddsNext').onclick=()=>{pfOddsState.page++;pfRenderOddsBrowser()};
  };
  pfInstallCentralOddsButtons=function(){
    const install=(host,id)=>{if(!host||$('#'+id))return;host.classList.add('pf-odds-button-host');const b=document.createElement('button');b.type='button';b.id=id;b.className='pf-corner-odds-btn';b.title='Pack Odds & Pull Chances';b.setAttribute('aria-label','Open Pack Odds and Pull Chances');b.textContent='?';host.prepend(b);b.onclick=()=>showPackOdds(pfOddsState.themeId)};install($('#shopPacksTab'),'pfShopOddsButton');install($('#bagPacksTab'),'pfBagOddsButton')
  };

  /* Stats Chances sub-tabs. */
  let pfChanceTab='all';
  function pfChanceBucket(group){group=String(group||'').toUpperCase();if(/COIN|JACKPOT/.test(group))return'coin';if(/GRADING/.test(group))return'grading';if(/VARIANT|HIDDEN|SECRET|GHOST|RARIT/.test(group))return'cards';return'packs'}
  function pfInstallChanceTabs(){const root=$('#stats-chances'),g=$('#pfChanceGrid');if(!root||!g)return;let tabs=$('#pfChanceSubtabs');if(!tabs){tabs=document.createElement('div');tabs.id='pfChanceSubtabs';tabs.className='pf-chance-subtabs';root.querySelector('.pf-chances-head')?.insertAdjacentElement('afterend',tabs)}const defs=[['all','All'],['packs','Packs'],['cards','Cards & Variants'],['coin','Coin'],['grading','Grading']];tabs.innerHTML=defs.map(([id,l])=>`<button class="${pfChanceTab===id?'active':''}" data-pf-chance-tab="${id}">${l}</button>`).join('');let group='';[...g.children].forEach(el=>{if(el.classList.contains('pf-chance-section-title')){group=el.textContent.trim();el.dataset.chanceBucket=pfChanceBucket(group)}else if(el.classList.contains('pf-chance-card'))el.dataset.chanceBucket=pfChanceBucket(group)});const apply=()=>{[...g.children].forEach(el=>el.classList.toggle('hidden',pfChanceTab!=='all'&&el.dataset.chanceBucket!==pfChanceTab))};tabs.querySelectorAll('button').forEach(b=>b.onclick=()=>{pfChanceTab=b.dataset.pfChanceTab;pfInstallChanceTabs()});apply()}
  const pfV33ChanceBase=pfRenderChances;pfRenderChances=function(){pfV33ChanceBase();pfInstallChanceTabs()};

  /* Admin becomes a first-class side-panel after session unlock. */
  function pfMountAdminPanel(){if(!pfAdminUnlocked)return;const side=$('.side-nav'),main=$('.main-panel'),board=$('#pfAdminBoard');if(!side||!main||!board)return;let btn=$('#pfAdminSideButton');if(!btn){btn=document.createElement('button');btn.id='pfAdminSideButton';btn.className='side-btn pf-admin-side-btn';btn.dataset.view='adminpanel';btn.innerHTML='<span>🛡</span> Admin Panel';side.appendChild(btn);btn.onclick=()=>showView('adminpanel')}let view=$('#view-adminpanel');if(!view){view=document.createElement('section');view.id='view-adminpanel';view.className='view hidden pf-admin-page';view.innerHTML='<div class="view-title"><div><h1>Admin Panel</h1><p>Owner test lab · local save only.</p></div><div class="pf-admin-live-pill">SESSION UNLOCKED</div></div><div id="pfAdminPageMount"></div>';main.appendChild(view)}const mount=view.querySelector('#pfAdminPageMount');if(board.parentElement!==mount)mount.appendChild(board);board.classList.remove('hidden');$('#pfAdminGate')?.classList.add('hidden');renderPfAdminBoard();pfEnhanceAdminPanel()}
  function pfUnmountAdminPanel(){const b=$('#pfAdminSideButton'),v=$('#view-adminpanel'),board=$('#pfAdminBoard'),settings=$('#pfSettingsPanel-admin .settings-section');b?.remove();if(board&&settings)settings.appendChild(board);v?.remove();if(board)board.classList.add('hidden')}
  function pfEnhanceAdminPanel(){const board=$('#pfAdminBoard');if(!board||$('#pfAdminV33Hero'))return;const hero=document.createElement('div');hero.id='pfAdminV33Hero';hero.className='pf-admin-v33-hero';hero.innerHTML=`<div><small>OWNER TEST LAB</small><h2>PackForge Admin</h2><p>Force rare pulls, seed packs, test cinematics, inspect codes, and check local save health.</p></div><div class="pf-admin-v33-actions"><button id="pfAdminTestSecret">Test Secret Cinematic</button><button id="pfAdminTestGhost">Test Ghost Cinematic</button><button id="pfAdminTestCrue">Test Crue Cinematic</button></div>`;board.prepend(hero);$('#pfAdminTestSecret').onclick=()=>pfAdminPreviewCinematic('secret');$('#pfAdminTestGhost').onclick=()=>pfAdminPreviewCinematic('ghost');$('#pfAdminTestCrue').onclick=()=>pfAdminPreviewCinematic('crue')}
  function pfAdminPreviewCinematic(type){const fake={card:type==='crue'?PF_CRUE_LOWE_CARD:type==='ghost'?GHOST_CARD:(allCards.find(c=>c.secret)||allCards[0]),copy:{variant:'Normal'}};if(type==='secret')fake.card={...fake.card,secret:true,ghost:false,crue:false};pfStartRareCinematic(fake,document.body,true)}
  const pfV33RenderAdminBase=renderPfAdminBoard;renderPfAdminBoard=function(){pfV33RenderAdminBase();if(pfAdminUnlocked){pfEnhanceAdminPanel()}else{pfUnmountAdminPanel()}};
  if($('#pfAdminLock'))$('#pfAdminLock').onclick=()=>{pfAdminUnlocked=false;setPfAdminStatus('');renderPfAdminBoard();const input=$('#pfAdminPassword');if(input)input.value='';showView('play')};

  /* Rare-pull cinematics: transform/opacity only, tiny DOM count, no canvas. */
  function pfCinematicKind(p){return p?.card?.crue?'crue':p?.card?.ghost?'ghost':p?.card?.secret?'secret':''}
  function pfStartRareCinematic(p,host=document.body,preview=false){const kind=pfCinematicKind(p);if(!kind)return 0;host.querySelector?.('.pf-pull-cinematic')?.remove();const perf=document.body.classList.contains('quality-performance')||document.body.classList.contains('particles-minimal')||document.body.classList.contains('anti-lag-aggressive'),dur=kind==='crue'?9000:kind==='ghost'?4400:3400,fx=document.createElement('div');fx.className=`pf-pull-cinematic ${kind} ${perf?'lite':''}`;const title=kind==='crue'?'CRUE LOWE':kind==='ghost'?'UNLISTED':'SECRET';const sub=kind==='crue'?'THE FABLED FOOL · FABLED PRINT':kind==='ghost'?'THIS CARD IS NOT ON THE CHECKLIST':'HIDDEN PRINT DETECTED',n=perf?6:(kind==='crue'?24:kind==='ghost'?16:12);fx.innerHTML=`<div class="pf-cine-vortex"></div><div class="pf-cine-card"><div class="pf-cine-card-back">PF</div></div><div class="pf-cine-rings"><i></i><i></i><i></i></div><div class="pf-cine-fireworks">${Array.from({length:n},(_,i)=>`<i style="--i:${i};--a:${(i*137.5)%360}deg;--d:${.15+(i%7)*.07}s"></i>`).join('')}</div><div class="pf-cine-copy"><small>${sub}</small><b>${title}</b><span>${kind==='crue'?'1 IN 500,000,000':'DO NOT CLOSE THE PACK'}</span></div>`;host.appendChild(fx);try{tone(kind==='crue'?70:kind==='ghost'?110:180,.7,'sawtooth',.018);setTimeout(()=>tone(kind==='crue'?880:kind==='ghost'?660:520,.35,'sine',.022),dur*.52)}catch(e){}setTimeout(()=>fx.remove(),dur);return dur}
  const pfV33TriggerFxBase=triggerPullRevealFx;triggerPullRevealFx=function(p,ov,stageFx,burstLabel){pfV33TriggerFxBase(p,ov,stageFx,burstLabel);if(!ov.classList.contains('auto-opening'))pfStartRareCinematic(p,ov)};

  /* Changelog: current release + cumulative post-monolith history. */
  pfShowWhatsNew=function(){pfClearUpdateBadge();const m=$('#confirmModal');m.classList.remove('hidden');m.innerHTML=`<div class="modal pf-whats-new pf-whats-new-v33 fade-in"><div class="modal-head"><h3>PackForge v${PF_VERSION}</h3><button class="close-x" id="pfWhatsNewClose">×</button></div><div class="modal-body"><div class="pf-update-kicker">PRESENTATION & UI UPDATE</div><h2>This update</h2><div class="pf-change-grid"><span>❓ Corner Odds button + cleaner 4-across, 40-card pages</span><span>🎴 Variant previews and visual Special / Semi-God / God Pack references</span><span>🛡 Admin unlock now creates a real Admin Panel sidebar page</span><span>🏷 Two active graders now keep both submitted cards visible</span><span>🏆 25 bonus achievements + category tabs</span><span>📊 Chances page now has sub-tabs</span><span>🪙 Coin presentation polished for the Coin page</span><span>⛶ Inspect keeps fullscreen but removes zoom controls</span><span>👁 Secret / Ghost / Crue pull cinematics rebuilt</span><span>⚔ Campaign selection cleaned up and Collector Requests removed</span></div><div class="pf-update-divider"></div><h2>Everything since the original pre-split build</h2><div class="pf-change-grid cumulative"><span>⚡ Split-file architecture, PWA caching, and Chromebook-focused performance work</span><span>⚛ Astronomy replaced by the real Physics / quantum mechanics reference</span><span>🪙 Upgraded reactive Coin presentation</span><span>🧩 Nebula finish added with fractured-glass presentation</span><span>👁 Secret and Ghost separated into true rarity tiers with distinct visuals</span><span>💰 Card-face values unified with actual Sell values</span><span>📦 Premium pack Auto Open and softer Auto Open rarity penalty</span><span>⚔ Campaigns promoted above Casino with spotlight bonuses, extra-card rewards, and animated clashes</span><span>🧾 Two simultaneous grading slots</span><span>🌟 Semi-God / God Pack families, wrapper mutations, and Archive God Pack</span><span>❓ Centralized odds reference replacing per-pack question buttons</span><span>⛶ Fullscreen card Inspect</span><span>💻 Background timers, hidden-tab work, effects, and collection rendering optimized for weak Chrome hardware</span></div><button class="grade-action" id="pfWhatsNewDone">Got it</button></div></div>`;const close=()=>{m.classList.add('hidden');m.innerHTML=''};$('#pfWhatsNewClose').onclick=close;$('#pfWhatsNewDone').onclick=close};

  /* Keep special UI constrained to the correct pages. */
  const pfV33ShowViewBase=showView;showView=function(v){pfV33ShowViewBase(v);if(v==='adminpanel'&&!pfAdminUnlocked){showView('play');return}if(v==='shop'||v==='collection')pfInstallCentralOddsButtons();if(v==='stats')pfInstallChanceTabs()};

  pfInstallCentralOddsButtons();

  /* ---------- PackForge v3.4: Extra hub + single queue + presentation cleanup ---------- */
  const PF_V34_ACHIEVEMENTS=[
    {id:'v34_click_10k',icon:'⌨️',name:'Worn Spacebar',desc:'Reach 10,000 lifetime Coin presses.',cat:'Coin',tier:'Advanced',check:s=>(state.stats.clicks||0)>=10000},
    {id:'v34_click_100k',icon:'⚙️',name:'Mechanical Habit',desc:'Reach 100,000 lifetime Coin presses.',cat:'Coin',tier:'Hard',check:s=>(state.stats.clicks||0)>=100000},
    {id:'v34_crit_500',icon:'✹',name:'Critical Mass',desc:'Land 500 critical Coin presses.',cat:'Coin',tier:'Hard',check:s=>(state.stats.criticals||0)>=500},
    {id:'v34_jackpot_25',icon:'💥',name:'Jackpot Weather',desc:'Trigger 25 Coin jackpots.',cat:'Coin',tier:'Hard',check:s=>(state.stats.jackpots||0)>=25},
    {id:'v34_pack_250',icon:'📦',name:'Cardboard Mountain',desc:'Open 250 packs.',cat:'Packs',tier:'Advanced',check:s=>(state.packsOpened||0)>=250},
    {id:'v34_pack_1000',icon:'🏭',name:'Pack Factory',desc:'Open 1,000 packs.',cat:'Packs',tier:'Hard',check:s=>(state.packsOpened||0)>=1000},
    {id:'v34_cards_1000',icon:'🗃️',name:'Vault Weight',desc:'Own 1,000 total card copies at once.',cat:'Collection',tier:'Hard',check:s=>s.totalCards>=1000},
    {id:'v34_unique_250',icon:'🧭',name:'Wide Collection',desc:'Own 250 unique cards.',cat:'Collection',tier:'Advanced',check:s=>s.uniqueOwned.size>=250},
    {id:'v34_unique_400',icon:'🏛️',name:'Museum Inventory',desc:'Own 400 unique cards.',cat:'Collection',tier:'Hard',check:s=>s.uniqueOwned.size>=400},
    {id:'v34_favorite_25',icon:'★',name:'Display Case',desc:'Favorite at least 25 cards.',cat:'Collection',tier:'Advanced',check:s=>s.favorites.size>=25},
    {id:'v34_grade_250',icon:'🏷️',name:'Submission Department',desc:'Complete 250 grading submissions.',cat:'Grading',tier:'Brutal',check:s=>(state.stats.gradesCompleted||0)>=250},
    {id:'v34_black_3',icon:'⬛',name:'Three Perfects',desc:'Receive three Perfect Black Labels.',cat:'Grading',tier:'Secret',check:s=>(state.quirkStats?.blackLabels||0)>=3},
    {id:'v34_campaign_10',icon:'🎪',name:'On the Circuit',desc:'Complete 10 campaigns.',cat:'Campaigns',tier:'Advanced',check:s=>(state.stats.campaignsCompleted||0)>=10},
    {id:'v34_campaign_250',icon:'🏆',name:'Touring Legend',desc:'Complete 250 campaigns.',cat:'Campaigns',tier:'Brutal',check:s=>(state.stats.campaignsCompleted||0)>=250},
    {id:'v34_campaign_cash',icon:'💼',name:'Exhibition Business',desc:'Earn $250,000 from campaigns.',cat:'Campaigns',tier:'Hard',check:s=>(state.stats.campaignCash||0)>=250000},
    {id:'v34_sell_250',icon:'💸',name:'Dealer Volume',desc:'Sell 250 cards.',cat:'Economy',tier:'Advanced',check:s=>(state.stats.cardsSold||0)>=250},
    {id:'v34_sell_2500',icon:'📈',name:'Liquid Collection',desc:'Sell 2,500 cards.',cat:'Economy',tier:'Hard',check:s=>(state.stats.cardsSold||0)>=2500},
    {id:'v34_sales_million',icon:'💰',name:'Seven Figures in Cardboard',desc:'Earn $1,000,000 from card sales.',cat:'Economy',tier:'Hard',check:s=>(state.stats.cashFromSales||0)>=1000000},
    {id:'v34_glitch_10',icon:'🪟',name:'Glass Cabinet',desc:'Own 10 Nebula cards.',cat:'Variants',tier:'Hard',check:s=>s.copies.filter(x=>(x.copy?.variant||'Normal')==='Nebula').length>=10},
    {id:'v34_god_10',icon:'🌟',name:'Wrapper Theology',desc:'Open 10 true God Packs.',cat:'Rare Pulls',tier:'Brutal',check:s=>(state.quirkStats?.godPacks||0)>=10},
    {id:'v34_semi_25',icon:'⚡',name:'Almost Blessed',desc:'Open 25 Semi-God Packs.',cat:'Rare Pulls',tier:'Hard',check:s=>(state.quirkStats?.semiGodPacks||0)>=25},
    {id:'v34_ghost_2',icon:'👻',name:'It Happened Again',desc:'Pull a second Ghost card.',cat:'Rare Pulls',tier:'Secret',check:s=>(state.quirkStats?.ghostCards||0)>=2},
    {id:'v34_ghost_5',icon:'☠️',name:'Haunted Vault',desc:'Pull five Ghost cards.',cat:'Rare Pulls',tier:'Secret',check:s=>(state.quirkStats?.ghostCards||0)>=5},
    {id:'v34_value_1m',icon:'💎',name:'Museum Piece',desc:'Own a single card worth at least $1,000,000.',cat:'Collection',tier:'Secret',check:s=>s.maxValue>=1000000}
  ];
  if(!ACHIEVEMENTS.some(a=>a.id==='v34_click_10k'))ACHIEVEMENTS.push(...PF_V34_ACHIEVEMENTS);

  /* One campaign at a time. Preserve any second run from v3.3 as a queued legacy run. */
  function pfV34MigrateCampaignSlots(){
    state.campaigns=state.campaigns||{};
    if(state.campaigns.active2){
      if(!state.campaigns.active){state.campaigns.active=state.campaigns.active2}
      else if(!state.campaigns.legacyQueued){const q=state.campaigns.active2,d=q.durationMs||(q.endsAt-q.startedAt)||60000;state.campaigns.legacyQueued={...q,_remainingMs:Math.max(1000,q.endsAt-Date.now()),durationMs:d}}
      state.campaigns.active2=null;markSaveDirty();save();
    }
  }
  function pfV34PromoteLegacyCampaign(){const q=state.campaigns?.legacyQueued;if(!q||state.campaigns.active)return;const now=Date.now(),dur=Math.max(1000,q.durationMs||q._remainingMs||60000),rem=clamp(q._remainingMs||dur,1000,dur);delete q._remainingMs;q.startedAt=now-(dur-rem);q.endsAt=now+rem;q.notified=false;state.campaigns.active=q;state.campaigns.legacyQueued=null;markSaveDirty();save()}
  pfV34MigrateCampaignSlots();
  pfActiveCampaigns=function(){return state.campaigns?.active?[state.campaigns.active]:[]};
  activeCampaign=function(){return state.campaigns?.active||null};
  copyIsCampaignCommitted=function(uidValue){const a=state.campaigns?.active;return !!(a&&Date.now()<a.endsAt&&Array.isArray(a.cardUids)&&a.cardUids.includes(uidValue))};
  const pfV34CampaignStartBase=campaignStart;
  campaignStart=function(def){if(state.campaigns?.active){toast('Campaign already active','Finish and collect the current campaign before launching another.');sfx('error');return}return pfV34CampaignStartBase(def)};
  const pfV34CollectCampaignBase=pfCollectCampaignSlot;
  pfCollectCampaignSlot=function(){const r=pfV34CollectCampaignBase(1);setTimeout(()=>{pfV34PromoteLegacyCampaign();if(!$('#view-campaigns')?.classList.contains('hidden'))renderCampaigns()},0);return r};
  function pfV34Hash(str){let h=2166136261>>>0;for(const ch of String(str)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
  function pfV34Focus(def){
    if(!def)return {type:'none',label:'Open Format',detail:'Any card works normally.',key:''};
    const h=pfV34Hash(def.offerId||def.name||'campaign'),mode=h%4;
    if(mode===0){const pool=basePackThemes(),t=pool[(h>>>4)%Math.max(1,pool.length)];return {type:'theme',key:t?.id||'medieval',label:`${t?.name||'Medieval'} Spotlight`,detail:`${t?.name||'Medieval'} cards gain +35% campaign Power.`}}
    if(mode===1){const pool=['Rare','Epic','Legendary'],r=pool[(h>>>5)%pool.length];return {type:'rarity',key:r,label:`${r} Spotlight`,detail:`${r} cards gain +35% campaign Power.`}}
    if(mode===2){const variants=['Foil','Holo','Gold','Prismatic'],v=variants[(h>>>6)%variants.length];return {type:'variant',key:v,label:`${v} Spotlight`,detail:`${v} cards gain +35% campaign Power.`}}
    return {type:'grade',key:'9',label:'Mint Spotlight',detail:'Cards graded 9.0+ gain +35% campaign Power.'}
  }
  function pfV34CampaignLore(def){
    const f=pfV34Focus(def),place=def?.name||'Collector Exhibition';
    if(def?.difficulty==='easy')return `${place} is a smaller collector stop where local curators trade stories, compare displays, and build buzz around unusual cards. ${f.label} is drawing extra attention this visit.`;
    if(def?.difficulty==='hard')return `${place} is one of the season’s prestige exhibitions: strict judges, packed galleries, and collectors looking for cards they may never see again. ${f.label} is the rumor moving through the floor.`;
    return `${place} brings dealers, graders, and collectors into one regional showcase. A strong display can turn an ordinary stop into a major payday, especially while ${f.label} is in demand.`;
  }
  renderCampaigns=function(){
    ensureCampaignOffers();pfV34PromoteLegacyCampaign();const list=$('#campaignList'),stage=$('#campaignStage');if(!list||!stage)return;const active=state.campaigns.active,lp=list.closest('.campaign-panel'),sp=stage.closest('.campaign-panel');$('#view-campaigns')?.classList.add('pf-campaign-v34');
    if(active){if(lp)lp.style.display='none';if(sp)sp.style.display='block';stage.innerHTML=`<div class="pf-single-campaign-head"><b>ONE CAMPAIGN AT A TIME</b><span>Your cards return before another trip can begin.</span></div>${pfCampaignRunHTML(active,1)}${state.campaigns.legacyQueued?'<div class="campaign-locked-note">A second campaign from the previous version is safely queued and will resume after this run is collected.</div>':''}`;stage.querySelectorAll('[data-pf-collect-campaign]').forEach(b=>b.onclick=()=>pfCollectCampaignSlot(1));return}
    const step=state.campaigns.flowStep||'offers';if(step==='team'&&campaignFlowOffer()){if(lp)lp.style.display='none';if(sp)sp.style.display='block';renderCampaignTeamFlow();return}
    state.campaigns.flowStep='offers';if(lp)lp.style.display='block';if(sp)sp.style.display='block';const offers=ensureCampaignOffers(),refreshLeft=campaignRefreshRemaining();
    list.innerHTML=`<div class="campaign-choice-head"><div><span>CHOOSE ONE DESTINATION</span><h2>Where are your cards going?</h2><p>Pick the story first. Power, timing, and reward details appear on the next screen.</p></div><button class="campaign-refresh" id="campaignRefresh" ${refreshLeft>0?'disabled':''}>${campaignRefreshLabel(refreshLeft)}</button></div><div class="campaign-choice-grid">${offers.map(d=>{const selected=state.campaigns.flowOfferId===d.offerId,f=pfV34Focus(d);return `<button class="campaign-choice-card ${selected?'selected':''} difficulty-${d.difficulty}" data-campaign-choice="${d.offerId}"><div class="campaign-choice-kicker">${d.rareCampaign?'50,000 POWER · RARE':`${d.power.toLocaleString()} POWER REQUIRED`}</div><h3>${pfEscapeHtml(d.name)}</h3><p class="pf-campaign-lore">${pfEscapeHtml(pfV34CampaignLore(d))}</p><div class="pf-offer-focus"><b>${pfEscapeHtml(f.label)}</b></div></button>`}).join('')}</div>`;
    const picked=campaignFlowOffer();stage.innerHTML=`<div class="campaign-choice-next"><div>${picked?`<b>${pfEscapeHtml(picked.name)}</b><span>Selected. Continue for Power, timing, team bonuses, and rewards.</span>`:'<b>Select one of the three destinations.</b><span>Only one campaign can run at a time.</span>'}</div><button id="campaignOfferNext" ${picked?'':'disabled'}>NEXT →</button></div>`;
    $$('[data-campaign-choice]').forEach(b=>b.onclick=()=>{state.campaigns.flowOfferId=b.dataset.campaignChoice;state.campaigns.selectedOfferId=b.dataset.campaignChoice;state.campaigns.selected=[];save();renderCampaigns()});$('#campaignOfferNext')?.addEventListener('click',()=>{if(!campaignFlowOffer())return;state.campaigns.flowStep='team';save();renderCampaigns()});$('#campaignRefresh')?.addEventListener('click',()=>{manualRefreshCampaigns();campaignResetFlow();save();renderCampaigns()});
  };

  /* One grading job at a time. Old second jobs still finish safely, but no new second submission can start. */
  function pfV34AllGradingJobs(){const out=[];for(const [id,it] of Object.entries(state.inventory||{}))for(const [lv,ld] of Object.entries(it.levels||{}))for(const cp of (ld.copies||[]))if(cp.gradingUntil&&Date.now()<cp.gradingUntil)out.push({id,level:+lv,copy:cp,c:cardMap[id]});return out.sort((a,b)=>a.copy.gradingUntil-b.copy.gradingUntil)}
  pfActiveGradingJobs=function(){return pfV34AllGradingJobs()};
  renderGrading=function(){
    processCompletedGradings(true);const jobs=pfV34AllGradingJobs(),busy=jobs.length>0,entries=eligibleGradeEntries(),list=$('#gradingList');if(!list)return;$('#gradingCount').textContent=busy?`1 grader busy · ${entries.length} eligible`:`Grader available · ${entries.length} eligible`;
    list.innerHTML=entries.length?entries.map(e=>{const available=e.copies.filter(cp=>!cp.grade&&!cp.gradingUntil&&!copyIsCampaignCommitted(cp.uid)).length;return `<div class="grading-card-option" style="--rarity:${rarityColor[e.c.ghost?'Ghost':e.c.rarity]||'#fff'}"><div class="grading-card-shell">${cardHTML(e.c,available,e.rep,e.level)}</div><div class="grading-card-meta"><b>${pfEscapeHtml(e.c.name)}${e.c.secret?' · SECRET':''}</b><small>${pfEscapeHtml(e.c.rarity)} · ${pfEscapeHtml(e.rep.variant||'Normal')}</small><button data-grade-select="${entryKey(e)}" ${busy?'disabled':''}>${busy?'Grader busy':'Select this card'}</button></div></div>`}).join(''):`<div class="grading-empty" style="padding:40px"><b>${busy?'Your grader is working':'No eligible cards'}</b><span>${busy?'The next submission opens when this card returns.':'Open packs to find an ungraded card.'}</span></div>`;
    $$('[data-grade-select]').forEach(b=>b.onclick=()=>{if(pfV34AllGradingJobs().length)return;gradingSelection=b.dataset.gradeSelect;lastGradeResult=null;renderGradingMachine()});renderGradingMachine();
  };
  renderGradingMachine=function(){
    const machine=$('#gradingMachine'),jobs=pfV34AllGradingJobs(),job=jobs[0];if(!machine)return;
    if(lastGradeResult){const {c,level,copy}=lastGradeResult;machine.innerHTML=`<div class="pf-grade-single-live"><div class="pf-grade-single-card">${cardHTML(c,0,copy,level)}</div><div class="pf-grade-single-info"><small>GRADING COMPLETE</small><h2>${pfEscapeHtml(c.name)}</h2><strong>${copy.grade.toFixed(1)}</strong><p>${gradeLabel(copy.grade,copy)}${copy.gradeNote?`<br>${pfEscapeHtml(copy.gradeNote)}`:''}</p><button class="grade-action" id="gradeDone">Continue</button></div></div>`;$('#gradeDone').onclick=()=>{lastGradeResult=null;renderGrading()};return}
    if(job){const elapsed=Date.now()-(job.copy.gradingStartedAt||Date.now()),duration=Math.max(1,(job.copy.gradingUntil||Date.now())-(job.copy.gradingStartedAt||Date.now())),pct=clamp(elapsed/duration*100,0,100);machine.innerHTML=`<div class="pf-grade-single-live"><div class="pf-grade-single-card">${cardHTML(job.c,0,job.copy,job.level)}</div><div class="pf-grade-single-info"><small>CURRENT GRADING JOB</small><h2>${pfEscapeHtml(job.c?.name||'Card')}</h2><strong>${formatRemaining(job.copy.gradingUntil-Date.now())}</strong><p>The card stays visible while the grader works. One grading submission can run at a time.</p><div class="progress"><i style="width:${pct}%"></i></div>${jobs.length>1?'<div class="pf-grade-legacy-note">A second submission from the previous two-slot version is still finishing safely in the background. New submissions stay locked until both legacy jobs return.</div>':''}</div></div>`;return}
    if(!gradingSelection){machine.innerHTML='<div class="grading-empty"><b>Select a card to grade</b><span>One card at a time · standard turnaround 5:00.</span></div>';return}
    const k=parseEntryKey(gradingSelection),e=findEntry(k.id,k.level,k.sig);if(!e||e.rep.grade||e.rep.gradingUntil||!e.copies.some(cp=>!cp.grade&&!cp.gradingUntil&&!copyIsCampaignCommitted(cp.uid))){gradingSelection=null;renderGradingMachine();return}const cost=gradeCost(e);
    machine.innerHTML=`<div class="pf-grade-single-live"><div class="pf-grade-single-card">${cardHTML(e.c,0,e.rep,e.level)}</div><div class="pf-grade-single-info"><small>READY TO SUBMIT</small><h2>${pfEscapeHtml(e.c.name)}</h2><p>${pfEscapeHtml(e.c.rarity)} · ${pfEscapeHtml(e.rep.variant||'Normal')} · Level ${e.level}<br>Grading fee: <b>${fmt(cost)}</b><br>Turnaround: <b>5:00</b></p><button class="grade-action" id="gradeNow" ${canAfford(cost)?'':'disabled'}>Submit to Grading</button></div></div>`;
    $('#gradeNow').onclick=()=>{if(pfV34AllGradingJobs().length||!spend(cost)){sfx('error');return}const live=findEntry(k.id,k.level,k.sig),copy=live?.copies.find(cp=>!cp.grade&&!cp.gradingUntil&&!copyIsCampaignCommitted(cp.uid));if(!copy)return;const now=Date.now(),rolled=e.c.crue?1:rollGrade(),damage=e.c.crue?0:(copy.openingPenalty||0)+factoryErrorGradePenalty(copy),finalGrade=e.c.crue?1:Math.max(1,Math.round((rolled-damage)*10)/10);copy.gradingStartedAt=now;copy.gradingUntil=now+GRADING_TIME;const forceBlack=!!state.adminForces?.blackLabelNext;if(e.c.crue){copy.pendingGrade=1;copy.pendingBlackLabel=false}else if(forceBlack){state.adminForces.blackLabelNext=false;copy.pendingGrade=10;copy.pendingBlackLabel=true}else{copy.pendingGrade=finalGrade;copy.pendingBlackLabel=finalGrade>=10&&damage===0&&Math.random()<.004}state.stats.gradesSubmitted=(state.stats.gradesSubmitted||0)+1;gradingSelection=null;lastGradeResult=null;sfx('buy');toast('Sent to grading',`${e.c.name} is now with the grader.`);save();renderHUD();renderGrading()};
  };

  /* Extra replaces separate Stats + Achievements navigation. */
  let pfV34StatSort='desc';
  function pfV34MountExtraHub(){
    const statsBtn=document.querySelector('.side-btn[data-view="stats"]'),achBtn=document.querySelector('.side-btn[data-view="achievements"]'),view=$('#view-stats');if(!view)return;
    achBtn?.remove();if(statsBtn&&!statsBtn.dataset.pfExtraMounted){statsBtn.innerHTML='<span>▥</span> Extra <small class="pf-update-badge" id="pfUpdateBadge">NEW</small>';statsBtn.dataset.pfExtraMounted='1';try{if(localStorage.getItem(PF_CHANGELOG_KEY)==='1')statsBtn.querySelector('#pfUpdateBadge')?.classList.add('hidden')}catch(e){}}
    view.classList.add('pf-extra-hub');const title=view.querySelector('.view-title h1'),sub=view.querySelector('.view-title p');if(title)title.textContent='Extra';if(sub)sub.textContent='Simple lifetime stats, exact chances, and achievements.';
    const tabs=$('#statsTabs');if(tabs)tabs.innerHTML='<button class="active" data-stats-tab="overview">Stats</button><button data-stats-tab="chances">Chances</button><button data-stats-tab="achievements">Achievements</button>';
    [...view.querySelectorAll('.stats-panel')].forEach(p=>{if(!['stats-overview','stats-chances'].includes(p.id))p.classList.add('hidden')});
    let ap=$('#stats-achievements');if(!ap){ap=document.createElement('div');ap.id='stats-achievements';ap.className='stats-panel hidden pf-achievement-shell';$('#stats-chances')?.insertAdjacentElement('afterend',ap)}
    const oldAch=$('#view-achievements');if(oldAch&&oldAch.children.length){while(oldAch.firstChild)ap.appendChild(oldAch.firstChild);oldAch.remove()}
    const achP=ap.querySelector('.achievement-title p');if(achP)achP.textContent=`${ACHIEVEMENTS.length} challenges across PackForge. The original 100-achievement vault reward remains unchanged.`;const allButton=ap.querySelector('[data-ach-filter="all"]');if(allButton)allButton.textContent=`All ${ACHIEVEMENTS.length}`;
    let journal=$('#pfChanceJournalPanel');if(!journal){journal=document.createElement('div');journal.id='pfChanceJournalPanel';journal.className='hidden';const oldJournal=$('#stats-journal');if(oldJournal){while(oldJournal.firstChild)journal.appendChild(oldJournal.firstChild)}$('#stats-chances')?.appendChild(journal)}
    $$('#statsTabs [data-stats-tab]').forEach(b=>b.onclick=()=>setStatsTab(b.dataset.statsTab));
  }
  function pfV34StatRows(){const s=state.stats||{},q=state.quirkStats||{},games=s.games||{},casinoWagered=Object.values(games).reduce((n,g)=>n+(Number(g?.wagered)||0),0),casinoReturned=Object.values(games).reduce((n,g)=>n+(Number(g?.returned)||0),0),unique=Object.keys(state.discovered||{}).filter(k=>state.discovered[k]).length;return [
    ['Cash on Hand',state.cash||0,'Economy','money'],['Collection Sell Value',collectionValue(),'Economy','money'],['Lifetime Cash Earned',state.lifetime||0,'Economy','money'],['Cash from Card Sales',s.cashFromSales||0,'Economy','money'],['Cash Spent',s.cashSpent||0,'Economy','money'],['Cards Owned',totalCardCount(),'Collection','number'],['Unique Cards Discovered',unique,'Collection','number'],['Cards Sold',s.cardsSold||0,'Collection','number'],['Packs Opened',state.packsOpened||0,'Packs','number'],['Packs Bought',s.packsBought||0,'Packs','number'],['Packs in Bag',packBagTotal(),'Packs','number'],['Coin Presses',s.clicks||0,'Coin','number'],['Critical Presses',s.criticals||0,'Coin','number'],['Coin Jackpots',s.jackpots||0,'Coin','number'],['Free Pack Drops',s.packDrops||0,'Coin','number'],['Upgrades Bought',s.upgradesBought||0,'Progress','number'],['Grades Submitted',s.gradesSubmitted||0,'Grading','number'],['Grades Completed',s.gradesCompleted||0,'Grading','number'],['Campaigns Started',s.campaignsStarted||0,'Campaigns','number'],['Campaigns Completed',s.campaignsCompleted||0,'Campaigns','number'],['Campaign Cash Earned',s.campaignCash||0,'Campaigns','money'],['Campaign Packs Won',s.campaignPacksWon||0,'Campaigns','number'],['Campaign Specials Won',s.campaignSpecialsWon||0,'Campaigns','number'],['God Packs',q.godPacks||0,'Rare Pulls','number'],['Semi-God Packs',q.semiGodPacks||0,'Rare Pulls','number'],['Jet Lumagui Pulled',q.jetLumagui||0,'Rare Pulls','number'],['Ghost Cards Pulled',q.ghostCards||0,'Rare Pulls','number'],['Crue Lowe Pulled',q.crueLowe||0,'Rare Pulls','number'],['Perfect Black Labels',q.blackLabels||0,'Rare Pulls','number'],['Casino Wagered',casinoWagered,'Casino','money'],['Casino Returned',casinoReturned,'Casino','money'],['Casino Net',casinoReturned-casinoWagered,'Casino','money'],['Casino Wins',state.casino?.wins||0,'Casino','number'],['Casino Losses',state.casino?.losses||0,'Casino','number'],['Biggest Casino Win',state.casino?.biggestWin||0,'Casino','money'],['Achievements Unlocked',unlockedAchievementCount(),'Achievements','number']].map(([label,value,cat,type])=>({label,value:Number(value)||0,cat,type}))}
  function pfV34RenderSimpleStats(){const host=$('#stats-overview');if(!host)return;let rows=pfV34StatRows();if(pfV34StatSort==='asc')rows.sort((a,b)=>a.value-b.value||a.label.localeCompare(b.label));else if(pfV34StatSort==='name')rows.sort((a,b)=>a.label.localeCompare(b.label));else rows.sort((a,b)=>b.value-a.value||a.label.localeCompare(b.label));host.innerHTML=`<div class="pf-simple-stats-toolbar"><div><small>LIFETIME STATISTICS</small><h2>${rows.length} tracked stats</h2></div><label>Sort<select id="pfV34StatSort"><option value="desc" ${pfV34StatSort==='desc'?'selected':''}>Highest → lowest</option><option value="asc" ${pfV34StatSort==='asc'?'selected':''}>Lowest → highest</option><option value="name" ${pfV34StatSort==='name'?'selected':''}>A → Z</option></select></label></div><div class="pf-simple-stat-list">${rows.map(r=>`<div class="pf-simple-stat-row"><span><b>${pfEscapeHtml(r.label)}</b><small>${pfEscapeHtml(r.cat)}</small></span><strong>${r.type==='money'?fmt(r.value):Math.round(r.value).toLocaleString()}</strong></div>`).join('')}</div>`;$('#pfV34StatSort').onchange=e=>{pfV34StatSort=e.target.value;pfV34RenderSimpleStats()}}
  setStatsTab=function(tab){if(!['overview','chances','achievements'].includes(tab))tab='overview';currentStatsTab=tab;$$('#statsTabs [data-stats-tab]').forEach(b=>b.classList.toggle('active',b.dataset.statsTab===tab));$$('#view-stats .stats-panel').forEach(p=>p.classList.toggle('hidden',p.id!==`stats-${tab}`));if(tab==='overview')pfV34RenderSimpleStats();if(tab==='chances'){pfRenderChances();pfRenderJournal();pfInstallChanceTabs()}if(tab==='achievements')renderAchievements()};
  renderStats=function(){pfV34MountExtraHub();setStatsTab(currentStatsTab||'overview')};

  /* Chances are grouped more cleanly; Rare Journal lives inside Chances. */
  pfChanceBucket=function(group){group=String(group||'').toUpperCase();if(/SEMI-GOD|GOD PACK/.test(group))return'gods';if(/STANDARD VARIANT|COLLECTOR ODDIT/.test(group))return'variants';if(/SECRET|GHOST|HIDDEN CARD|PACK RARIT/.test(group))return'cards';if(/COIN|JACKPOT/.test(group))return'coin';if(/GRADING/.test(group))return'grading';return'packs'};
  pfInstallChanceTabs=function(){const root=$('#stats-chances'),g=$('#pfChanceGrid'),journal=$('#pfChanceJournalPanel');if(!root||!g)return;let tabs=$('#pfChanceSubtabs');if(!tabs){tabs=document.createElement('div');tabs.id='pfChanceSubtabs';tabs.className='pf-chance-subtabs';root.querySelector('.pf-chances-head')?.insertAdjacentElement('afterend',tabs)}const defs=[['all','All'],['packs','Packs'],['cards','Cards'],['variants','Variants'],['gods','God Packs'],['coin','Coin'],['grading','Grading'],['journal','Rare Journal']];tabs.innerHTML=defs.map(([id,l])=>`<button class="${pfChanceTab===id?'active':''}" data-pf-chance-tab="${id}">${l}</button>`).join('');let group='';[...g.children].forEach(el=>{if(el.classList.contains('pf-chance-section-title')){group=el.textContent.trim();el.dataset.chanceBucket=pfChanceBucket(group)}else if(el.classList.contains('pf-chance-card'))el.dataset.chanceBucket=pfChanceBucket(group)});const isJournal=pfChanceTab==='journal';g.classList.toggle('hidden',isJournal);journal?.classList.toggle('hidden',!isJournal);if(!isJournal)[...g.children].forEach(el=>el.classList.toggle('hidden',pfChanceTab!=='all'&&el.dataset.chanceBucket!==pfChanceTab));tabs.querySelectorAll('button').forEach(b=>b.onclick=()=>{pfChanceTab=b.dataset.pfChanceTab;if(pfChanceTab==='journal')pfRenderJournal();pfInstallChanceTabs()})};

  /* Global Odds button stays visible in a predictable place, only on Pack screens. */
  function pfV34InstallGlobalOdds(){let b=$('#pfGlobalOddsButton');if(!b){b=document.createElement('button');b.id='pfGlobalOddsButton';b.type='button';b.className='hidden';b.title='Pack Odds & Pull Chances';b.setAttribute('aria-label','Open Pack Odds and Pull Chances');b.textContent='?';document.body.appendChild(b);b.onclick=()=>showPackOdds(pfOddsState.themeId)}pfV34UpdateGlobalOdds()}
  function pfV34CurrentView(){const v=[...document.querySelectorAll('.view')].find(x=>!x.classList.contains('hidden'));return v?.id?.replace(/^view-/,'')||''}
  function pfV34UpdateGlobalOdds(){const b=$('#pfGlobalOddsButton');if(!b)return;const v=pfV34CurrentView(),show=(v==='shop'&&currentShopTab==='packs')||(v==='collection'&&currentBagTab==='packs');b.classList.toggle('hidden',!show)}
  pfInstallCentralOddsButtons=function(){pfV34InstallGlobalOdds()};
  const pfV34SetShopTabBase=setShopTab;setShopTab=function(tab){const r=pfV34SetShopTabBase(tab);pfV34UpdateGlobalOdds();return r};
  const pfV34SetBagTabBase=setBagTab;setBagTab=function(tab){const r=pfV34SetBagTabBase(tab);pfV34UpdateGlobalOdds();return r};
  const pfV34ApplyPerformanceBase=applyPerformanceSettings;applyPerformanceSettings=function(){const r=pfV34ApplyPerformanceBase();document.body.classList.toggle('fps-visible',!!state.settings.fpsCounter);pfV34UpdateGlobalOdds();return r};

  /* Short flash-only rare reveals. The card itself carries the premium look. */
  pfStartRareCinematic=function(p,host=document.body,preview=false){const kind=pfCinematicKind(p);if(!kind)return 0;host.querySelector?.('.pf-pull-cinematic')?.remove();const perf=document.body.classList.contains('quality-performance')||document.body.classList.contains('particles-minimal')||document.body.classList.contains('anti-lag-aggressive'),reduce=state.settings?.reduceFlashes,dur=kind==='crue'?1900:kind==='ghost'?1450:1050,fx=document.createElement('div'),count=perf?4:(kind==='crue'?14:kind==='ghost'?10:7);fx.className=`pf-pull-cinematic ${kind} ${perf?'lite':''}`;const label=kind==='crue'?'CRUE LOWE':kind==='ghost'?'GHOST':'SECRET';fx.innerHTML=`<div class="pf-cine-flash"></div>${reduce?'':'<div class="pf-cine-flash f2"></div><div class="pf-cine-flash f3"></div>'}<div class="pf-cine-spark-field">${Array.from({length:count},(_,i)=>`<i style="--x:${8+(i*83)%86}%;--y:${12+(i*47)%76}%;--r:${(i*53)%360}deg;--d:${(i%5)*.06}s"></i>`).join('')}</div><div class="pf-cine-stamp">${label}</div>`;host.appendChild(fx);try{tone(kind==='crue'?95:kind==='ghost'?150:240,.18,'sine',.018);setTimeout(()=>tone(kind==='crue'?760:kind==='ghost'?620:510,.14,'triangle',.016),280)}catch(e){}setTimeout(()=>fx.remove(),dur);return dur};

  /* Extra replaces direct Achievements navigation. */
  const pfV34ShowViewBase=showView;showView=function(v){if(v==='achievements'){pfV34ShowViewBase('stats');pfV34MountExtraHub();setStatsTab('achievements');pfV34UpdateGlobalOdds();return}pfV34ShowViewBase(v);if(v==='stats'){pfV34MountExtraHub();setStatsTab(currentStatsTab||'overview')}pfV34UpdateGlobalOdds()};

  /* Changelog: cumulative, but only current features are listed. */
  pfShowWhatsNew=function(){pfClearUpdateBadge();const m=$('#confirmModal');m.classList.remove('hidden');m.innerHTML=`<div class="modal pf-whats-new pf-whats-new-v33 fade-in"><div class="modal-head"><h3>PackForge v${PF_VERSION}</h3><button class="close-x" id="pfWhatsNewClose">×</button></div><div class="modal-body"><div class="pf-update-kicker">EXTRA & QUEUE CLEANUP</div><h2>This update</h2><div class="pf-change-grid"><span>❓ Odds button fixed beneath the FPS counter on Shop/Bag Pack screens</span><span>⚔ Campaigns are lore-first and limited to one active trip at a time</span><span>🏷 Grading is one card at a time with the active card kept visible</span><span>▥ Stats + Chances + Achievements merged into the new Extra sidebar page</span><span>📊 Minecraft-style sortable lifetime stat list</span><span>🎲 Cleaner Chances sub-tabs including God Packs and Rare Journal</span><span>🏆 25 more bonus achievements · 150 total</span><span>👻 Ghost cards rebuilt as the premium visual chase card</span><span>✨ Secret / Ghost / Crue reveals changed to short flash sequences instead of long card-flip cutscenes</span><span>💻 New effects retain Performance / Anti-Lag / Reduced Motion fallbacks</span><span>⚖ Premium Pack prices normalized from a Monte Carlo sell-value audit without reducing their special odds</span></div><div class="pf-update-divider"></div><h2>Everything since the original pre-split build</h2><div class="pf-change-grid cumulative"><span>⚡ Split-file architecture, PWA caching, and Chromebook-focused performance work</span><span>⚛ Astronomy replaced by the real Physics / quantum mechanics reference</span><span>🪙 Upgraded reactive Coin presentation</span><span>🧩 Nebula finish added with fractured-glass presentation</span><span>👁 Secret and Ghost separated into true rarity tiers with distinct visuals</span><span>💰 Card-face values unified with actual Sell values</span><span>📦 Premium Pack Auto Open, softer Auto Open rarity penalty, and premium-pack economy balancing</span><span>⚔ Campaign spotlights, extra-card bonuses, animated campaign scenes, and lore-first destinations</span><span>🌟 Semi-God / God Pack families, wrapper mutations, and Archive God Pack</span><span>❓ Centralized visual odds reference with card, variant, special, Semi-God, and God Pack views</span><span>🛡 Session-only Admin Panel with test tools and code reference</span><span>⛶ Fullscreen card Inspect</span><span>🏆 Expanded achievements and organized Extra / Chances views</span><span>💻 Background timers, hidden-tab work, effects, and collection rendering optimized for weak Chrome hardware</span></div><button class="grade-action" id="pfWhatsNewDone">Got it</button></div></div>`;const close=()=>{m.classList.add('hidden');m.innerHTML=''};$('#pfWhatsNewClose').onclick=close;$('#pfWhatsNewDone').onclick=close};

  pfV34MountExtraHub();applyPerformanceSettings();checkAchievements(false);


  /* ---------- PackForge v3.5: Campaign-only specialty packs + rebuilt Admin Lab + Jet Lumagui ---------- */
  function pfV35HealthCheck(){
    const checks=[
      ['Save state',!!state&&typeof state==='object'],['Card map',!!cardMap&&cardMap[JET_LUMAGUI_CARD.id]===JET_LUMAGUI_CARD],['Themes',Array.isArray(themes)&&themes.length>=5],['Premium pack definitions',Object.keys(premiumPackDefs).length===5],['Campaign engine',!!state.campaigns],['Grading inventory',!!state.inventory],['Odds engine',typeof pfRenderOddsBrowser==='function'],['Jet rarity odds',JET_LUMAGUI_CARD_CHANCE===1/1000],['Jet sell value',sellValue(JET_LUMAGUI_CARD,1,{variant:'Normal'})===609],['Jet power',JET_LUMAGUI_CARD.power===1],['Specialty Shop disabled',buyPremiumPack.toString().includes('Campaign reward only')],['Local save key',saveKey==='packforge_save_v1']
    ];
    const failed=checks.filter(x=>!x[1]);return {checks,failed,ok:failed.length===0};
  }
  function pfV35AdminStatRows(){const q=state.quirkStats||{};return [
    ['Cash',fmt(state.cash)],['Collection',fmt(collectionValue())],['Cards Owned',totalCardCount().toLocaleString()],['Packs Stored',pfAdminPackCount().toLocaleString()],['Packs Opened',(state.packsOpened||0).toLocaleString()],['Campaign',state.campaigns?.active?'ACTIVE':'IDLE'],['Jet Lumagui',(q.jetLumagui||0).toLocaleString()],['Ghost',(q.ghostCards||0).toLocaleString()],['Crue Lowe',(q.crueLowe||0).toLocaleString()],['God Packs',(q.godPacks||0).toLocaleString()],['Semi-God',(q.semiGodPacks||0).toLocaleString()],['Black Labels',(q.blackLabels||0).toLocaleString()]
  ]}
  function pfV35AdminQueue(){const af=state.adminForces||{},out=[];if(af.godMode)out.push(pfPackModeMeta(af.godMode)?.name||af.godMode);if(af.jetNext)out.push('Jet Lumagui');if(af.ghostNext)out.push('Ghost');if(af.crueNext)out.push('Crue Lowe');if(af.bonusNext)out.push('6-card pack');if(af.blackLabelNext)out.push('Black Label');return out}
  function pfV35GrantMutation(themeId,mutationId,count){const t=themes.find(x=>x.id===themeId)||basePackThemes()[0],m=packMutations[mutationId];count=clamp(Math.floor(+count||1),1,1000);if(!t||!m)return;for(let i=0;i<count;i++)state.specialPackInventory.push({uid:uid(),themeId:t.id,mutation:m.id,source:'Admin Lab'});pfAdminAfterAction(`Granted ${count} ${t.name} ${m.name} special pack${count===1?'':'s'}.`)}
  function pfV35GrantThemePacks(themeId,count){const t=themes.find(x=>x.id===themeId)||basePackThemes()[0];count=clamp(Math.floor(+count||1),1,1000);if(!t)return;state.packInventory[t.id]=(state.packInventory[t.id]||0)+count;pfAdminAfterAction(`Granted ${count} ${t.name} Pack${count===1?'':'s'}.`)}
  function pfV35FinishCampaign(){const a=state.campaigns?.active;if(!a){setPfAdminStatus('No active campaign to finish.',false,true);return}a.endsAt=Date.now()-1;save(true);renderCampaigns();setPfAdminStatus('Active campaign timer completed. Collect its reward normally.',true,true)}
  function pfV35FinishGrading(){let n=0;for(const it of Object.values(state.inventory||{}))for(const ld of Object.values(it.levels||{}))for(const cp of ld.copies||[])if(cp.gradingUntil&&cp.gradingUntil>Date.now()){cp.gradingUntil=Date.now()-1;n++}processCompletedGradings(true);save(true);renderGrading();renderHUD();setPfAdminStatus(n?`Completed ${n} grading job${n===1?'':'s'}.`:'No active grading job.',!!n,true)}
  function pfV35ClearForces(){state.adminForces={...(state.adminForces||{}),godMode:null,bonusNext:false,ghostNext:false,blackLabelNext:false,crueNext:false,jetNext:false};save(true);pfRenderAdminV35();setPfAdminStatus('Cleared all forced outcomes.',true,true)}
  function pfV35SelectedTestTheme(){const id=$('#pfV35TestTheme')?.value||$('#pfAdminTestTheme')?.value;return themes.find(x=>x.id===id)||basePackThemes()[0]}
  function pfV35QueueSpecial(flag,label){state.adminForces=state.adminForces||{};state.adminForces[flag]=true;const t=pfV35SelectedTestTheme();if(t)state.packInventory[t.id]=(state.packInventory[t.id]||0)+1;save(true);renderHUD();updateBagCounts();pfRenderAdminV35();setPfAdminStatus(`${label} queued${t?` · added 1 ${t.name} test pack`:''}.`,true,true)}
  function pfV35CodesHTML(){const rows=Object.entries(rewardCodeDefs).map(([code,d])=>({code,label:d.label,used:!!(state.redeemedCodes?.[code]||state.redeemedCodes?.[d.rewardId]),tutorial:!!d.tutorialOnly}));return `<div class="pf-v35-code-grid">${rows.map(r=>`<article class="${r.used?'used':''}"><code>${pfEscapeHtml(r.code)}</code><b>${pfEscapeHtml(r.label)}</b><small>${r.tutorial?'Tutorial only · ':''}${r.used?'USED':'AVAILABLE'}</small></article>`).join('')}</div>`}
  function pfBuildAdminV35(){
    const board=$('#pfAdminBoard');if(!board||$('#pfAdminV35Shell'))return;
    [...board.children].forEach(ch=>ch.classList.add('pf-admin-v35-legacy'));
    const shell=document.createElement('div');shell.id='pfAdminV35Shell';shell.className='pf-admin-v35-shell';
    shell.innerHTML=`<section class="pf-admin-v35-hero"><div><small>OWNER / DEVELOPMENT LAB</small><h2>PackForge Control Center</h2><p>Everything here touches only this local save. Natural odds stay unchanged unless you explicitly queue a test result.</p></div><div class="pf-admin-v35-health" id="pfAdminV35Health">CHECKING</div></section><nav class="pf-admin-v35-nav" id="pfAdminV35Nav">${[['overview','Overview'],['economy','Economy'],['packs','Packs'],['cards','Cards'],['outcomes','Outcomes'],['campaigns','Campaigns'],['system','Save & Diagnostics'],['codes','Codes']].map(([id,l],i)=>`<button data-v35-admin-tab="${id}" class="${i===0?'active':''}">${l}</button>`).join('')}</nav><div class="pf-admin-v35-body" id="pfAdminV35Body"></div>`;
    board.prepend(shell);shell.querySelectorAll('[data-v35-admin-tab]').forEach(b=>b.onclick=()=>{shell.dataset.tab=b.dataset.v35AdminTab;shell.querySelectorAll('[data-v35-admin-tab]').forEach(x=>x.classList.toggle('active',x===b));pfRenderAdminV35()});shell.dataset.tab='overview';
  }
  function pfRenderAdminV35(){
    if(!pfAdminUnlocked)return;pfBuildAdminV35();const shell=$('#pfAdminV35Shell'),body=$('#pfAdminV35Body');if(!shell||!body)return;const tab=shell.dataset.tab||'overview',health=pfV35HealthCheck(),healthEl=$('#pfAdminV35Health');if(healthEl){healthEl.textContent=health.ok?'SYSTEMS OK':`${health.failed.length} CHECK${health.failed.length===1?'':'S'} FAILED`;healthEl.classList.toggle('bad',!health.ok)}
    const themesOpts=basePackThemes().map(t=>`<option value="${t.id}">${t.emoji} ${t.name}</option>`).join(''),premOpts=Object.values(premiumPackDefs).map(d=>`<option value="${d.id}">${d.emoji} ${d.name}</option>`).join(''),mutOpts=Object.values(packMutations).map(d=>`<option value="${d.id}">${d.name}</option>`).join('');
    if(tab==='overview')body.innerHTML=`<div class="pf-admin-v35-statgrid">${pfV35AdminStatRows().map(([a,b])=>`<article><small>${a}</small><b>${b}</b></article>`).join('')}</div><div class="pf-admin-v35-columns"><section class="pf-admin-v35-card"><h3>Forced queue</h3><div class="pf-admin-v35-queue">${pfV35AdminQueue().length?pfV35AdminQueue().map((x,i)=>`<span><i>${i+1}</i>${pfEscapeHtml(x)}</span>`).join(''):'<em>Nothing forced. Natural gameplay is active.</em>'}</div><button id="pfV35ClearForces" class="danger">Clear forced outcomes</button></section><section class="pf-admin-v35-card"><h3>Quick actions</h3><div class="pf-admin-v35-btns"><button id="pfV35Save">Save Now</button><button id="pfV35Refresh">Refresh Dashboard</button><button id="pfV35TestSecret">Secret FX</button><button id="pfV35TestGhost">Ghost FX</button><button id="pfV35TestCrue">Crue FX</button></div></section></div>`;
    if(tab==='economy')body.innerHTML=`<div class="pf-admin-v35-card"><h3>Cash control</h3><p>Add cash or replace the balance exactly.</p><div class="pf-admin-v35-controls"><input id="pfV35Cash" type="number" value="10000" min="0"><button id="pfV35CashAdd">Add Cash</button><button id="pfV35CashSet">Set Cash</button><button id="pfV35Cash100M">+$100M</button></div></div><div class="pf-admin-v35-card"><h3>Progress utilities</h3><div class="pf-admin-v35-btns"><button id="pfV35Upgrade">+1 Every Upgrade</button><button id="pfV35Core100">+100 Every Core Pack</button></div></div>`;
    if(tab==='packs')body.innerHTML=`<div class="pf-admin-v35-columns"><section class="pf-admin-v35-card"><h3>Core packs</h3><label>Set<select id="pfV35PackTheme">${themesOpts}</select></label><label>Amount<input id="pfV35PackAmount" type="number" min="1" max="1000" value="10"></label><button id="pfV35GrantTheme">Grant Selected Core Pack</button></section><section class="pf-admin-v35-card accent"><h3>Campaign-only specialty packs</h3><p>These five packs are no longer purchasable. Campaigns are their normal source.</p><label>Type<select id="pfV35Premium">${premOpts}</select></label><label>Amount<input id="pfV35PremiumAmount" type="number" min="1" max="1000" value="1"></label><button id="pfV35GrantPremium">Grant Specialty Pack</button><button id="pfV35GrantAllPremium">Grant 1 of Each</button></section></div><div class="pf-admin-v35-card"><h3>Special mutation packs</h3><div class="pf-admin-v35-controls"><select id="pfV35MutationTheme">${themesOpts}</select><select id="pfV35Mutation">${mutOpts}</select><input id="pfV35MutationAmount" type="number" min="1" max="1000" value="1"><button id="pfV35GrantMutation">Grant Mutation Pack</button></div></div>`;
    if(tab==='cards')body.innerHTML=`<div class="pf-admin-v35-columns"><section class="pf-admin-v35-card"><h3>Direct rarity grant</h3><label>Rarity<select id="pfV35Rarity">${['Common','Uncommon','Rare','Epic','Legendary','Mythic','Divine','Ultra','Jet Lumagui','Secret','Ghost','Crue Lowe'].map(r=>`<option>${r}</option>`).join('')}</select></label><label>Amount<input id="pfV35RarityAmount" type="number" min="1" max="100" value="1"></label><button id="pfV35RarityGrant">Give Card</button></section><section class="pf-admin-v35-card jet"><h3>Special chase cards</h3><p>Direct test grants use real inventory/history tracking.</p><div class="pf-admin-v35-btns"><button data-v35-special-card="Jet Lumagui">🌫 Jet Lumagui</button><button data-v35-special-card="Ghost">👻 Ghost</button><button data-v35-special-card="Crue Lowe">♜ Crue Lowe</button></div></section></div><div class="pf-admin-v35-note"><b>Jet Lumagui</b> naturally rolls exactly 1 in 1,000 card rolls · Power 1 · Sell $609 · own smoky rarity.</div>`;
    if(tab==='outcomes')body.innerHTML=`<div class="pf-admin-v35-card"><h3>Test pack theme</h3><select id="pfV35TestTheme">${themesOpts}</select></div><div class="pf-admin-v35-modegrid">${Object.entries(PF_PACK_MODE_DEFS).map(([id,d])=>`<button data-v35-pack-mode="${id}" class="${d.tier}"><span>${d.emoji}</span><b>${d.name}</b><small>${d.tier==='god'?'God Pack':'Semi-God'} · ${pfOddsOneIn(d.chance)}</small></button>`).join('')}</div><div class="pf-admin-v35-card"><h3>Card / factory outcomes</h3><div class="pf-admin-v35-btns"><button id="pfV35JetNext">🌫 Queue Jet Lumagui</button><button id="pfV35GhostNext">👻 Queue Ghost</button><button id="pfV35CrueNext">♜ Queue Crue Lowe</button><button id="pfV35BonusNext">📦 Queue 6-Card Pack</button><button id="pfV35BlackNext">🏷 Queue Black Label</button></div></div>`;
    if(tab==='campaigns')body.innerHTML=`<div class="pf-admin-v35-columns"><section class="pf-admin-v35-card"><h3>Campaign controls</h3><p>${state.campaigns?.active?`${pfEscapeHtml(state.campaigns.active.offer?.name||'Campaign')} is active.`:'No active campaign.'}</p><div class="pf-admin-v35-btns"><button id="pfV35FinishCampaign">Finish Timer Now</button><button id="pfV35RefreshCampaigns">Generate New Offers</button></div></section><section class="pf-admin-v35-card"><h3>Grading controls</h3><p>${pfActiveGradingJobs().length?`${pfActiveGradingJobs().length} job active.`:'No active grading job.'}</p><button id="pfV35FinishGrade">Finish Grading Now</button></section></div>`;
    if(tab==='system')body.innerHTML=`<div class="pf-admin-v35-card"><h3>Runtime diagnostics</h3><div class="pf-admin-v35-checks">${health.checks.map(([n,ok])=>`<span class="${ok?'ok':'bad'}">${ok?'✓':'×'} ${pfEscapeHtml(n)}</span>`).join('')}</div><div class="pf-admin-v35-btns"><button id="pfV35RunHealth">Run Health Check</button><button id="pfV35Export">Export Save</button><button id="pfV35Restore">Restore Latest Backup</button><button id="pfV35Lock" class="danger">Lock Admin</button></div></div><div class="pf-admin-v35-note">Save key: <code>${saveKey}</code> · Schema ${SAVE_SCHEMA} · Admin unlock is session-only.</div>`;
    if(tab==='codes')body.innerHTML=`<div class="pf-admin-v35-card"><h3>Current reward codes</h3><p>Campaign-only specialty pack codes were retired so those packs stay exclusive to Campaign rewards and Admin testing.</p>${pfV35CodesHTML()}</div>`;
    const bind=(sel,fn)=>{const e=$(sel);if(e)e.onclick=fn};
    bind('#pfV35ClearForces',pfV35ClearForces);bind('#pfV35Save',()=>{save(true);setPfAdminStatus('Saved immediately.',true,true)});bind('#pfV35Refresh',pfRenderAdminV35);bind('#pfV35TestSecret',()=>pfAdminPreviewCinematic('secret'));bind('#pfV35TestGhost',()=>pfAdminPreviewCinematic('ghost'));bind('#pfV35TestCrue',()=>pfAdminPreviewCinematic('crue'));
    bind('#pfV35CashAdd',()=>{const n=Math.max(0,+$('#pfV35Cash').value||0);state.cash+=n;pfAdminAfterAction(`Added ${fmt(n)}.`);pfRenderAdminV35()});bind('#pfV35CashSet',()=>{const n=Math.max(0,+$('#pfV35Cash').value||0);state.cash=n;pfAdminAfterAction(`Cash set to ${fmt(n)}.`);pfRenderAdminV35()});bind('#pfV35Cash100M',()=>{state.cash+=100000000;pfAdminAfterAction('Added $100,000,000.');pfRenderAdminV35()});bind('#pfV35Potions',()=>{for(const id of Object.keys(potionDefs))addPotion(id,100);pfAdminAfterAction('Granted 100 of every potion.');pfRenderAdminV35()});bind('#pfV35Upgrade',()=>{addEveryUpgrade(1);pfAdminAfterAction('Added one level to every upgrade.');pfRenderAdminV35()});bind('#pfV35Core100',()=>{grantCorePacks(100);pfAdminAfterAction('Granted 100 of every core pack.');pfRenderAdminV35()});
    bind('#pfV35GrantTheme',()=>pfV35GrantThemePacks($('#pfV35PackTheme').value,$('#pfV35PackAmount').value));bind('#pfV35GrantPremium',()=>{const id=$('#pfV35Premium').value,n=clamp(Math.floor(+$('#pfV35PremiumAmount').value||1),1,1000);grantPremiumPack(id,n);pfAdminAfterAction(`Granted ${n} ${premiumPackDefs[id].name}${n===1?'':'s'}.`);pfRenderAdminV35()});bind('#pfV35GrantAllPremium',()=>{for(const id of Object.keys(premiumPackDefs))grantPremiumPack(id,1);pfAdminAfterAction('Granted one of every campaign-only specialty pack.');pfRenderAdminV35()});bind('#pfV35GrantMutation',()=>pfV35GrantMutation($('#pfV35MutationTheme').value,$('#pfV35Mutation').value,$('#pfV35MutationAmount').value));
    bind('#pfV35RarityGrant',()=>{pfAdminGrantByRarity($('#pfV35Rarity').value,$('#pfV35RarityAmount').value);pfRenderAdminV35()});$$('[data-v35-special-card]').forEach(b=>b.onclick=()=>{pfAdminGrantByRarity(b.dataset.v35SpecialCard,1);pfRenderAdminV35()});
    $$('[data-v35-pack-mode]').forEach(b=>b.onclick=()=>{const mode=b.dataset.v35PackMode;state.adminForces.godMode=mode;const t=themes.find(x=>x.id===($('#pfV35TestTheme')?.value||''))||basePackThemes()[0];if(t)state.packInventory[t.id]=(state.packInventory[t.id]||0)+1;save(true);renderHUD();updateBagCounts();pfRenderAdminV35();setPfAdminStatus(`${pfPackModeMeta(mode)?.name||mode} queued with a test pack.`,true,true)});
    bind('#pfV35JetNext',()=>pfV35QueueSpecial('jetNext','Jet Lumagui'));bind('#pfV35GhostNext',()=>pfV35QueueSpecial('ghostNext','Ghost'));bind('#pfV35CrueNext',()=>pfV35QueueSpecial('crueNext','Crue Lowe'));bind('#pfV35BonusNext',()=>pfV35QueueSpecial('bonusNext','6-card pack'));bind('#pfV35BlackNext',()=>{state.adminForces.blackLabelNext=true;save(true);pfRenderAdminV35();setPfAdminStatus('Black Label queued for next grading.',true,true)});
    bind('#pfV35FinishCampaign',()=>{pfV35FinishCampaign();pfRenderAdminV35()});bind('#pfV35RefreshCampaigns',()=>{if(state.campaigns?.active){setPfAdminStatus('Finish the active campaign before replacing offers.',false,true);return}generateCampaignOffers();renderCampaigns();save(true);pfRenderAdminV35();setPfAdminStatus('Generated new campaign offers.',true,true)});bind('#pfV35FinishGrade',()=>{pfV35FinishGrading();pfRenderAdminV35()});
    bind('#pfV35RunHealth',()=>{const h=pfV35HealthCheck();setPfAdminStatus(h.ok?'All runtime checks passed.':`${h.failed.length} runtime checks failed.`,h.ok,true);pfRenderAdminV35()});bind('#pfV35Export',pfExportSave);bind('#pfV35Restore',pfRestoreLatest);bind('#pfV35Lock',()=>{$('#pfAdminLock')?.click()});
  }
  const pfV35AdminRenderBase=renderPfAdminBoard;renderPfAdminBoard=function(){pfV35AdminRenderBase();if(pfAdminUnlocked)pfRenderAdminV35()};
  const pfV35AdminMountBase=pfMountAdminPanel;pfMountAdminPanel=function(){pfV35AdminMountBase();pfBuildAdminV35();pfRenderAdminV35()};

  /* Jet additions to inspect/collection/reveal metadata. */
  const pfV35InspectBase=showInspect;showInspect=function(id,level=1,sig){pfV35InspectBase(id,level,sig);const c=cardMap[id];if(c?.jet){const theme=$('#inspectModal .inspect-theme');if(theme)theme.textContent='1 in 1,000 cards · Jet Lumagui Rarity · Power 1 · Sell $609'}};
  const pfV35PullMetaBase=pullRevealMeta;pullRevealMeta=function(p){if(p?.card?.jet)return {rarity:'Jet Lumagui',variant:p.copy?.variant||'Normal',mutation:p.copy?.mutation?packMutations[p.copy.mutation]:null,tier:'jet',classes:['pull-jet'],specialColor:'#aab3b8',label:'JET LUMAGUI · 1 IN 1,000 CARDS'};return pfV35PullMetaBase(p)};

  /* What's New remains cumulative from the pre-split build. */
  pfShowWhatsNew=function(){pfClearUpdateBadge();const m=$('#confirmModal');m.classList.remove('hidden');m.innerHTML=`<div class="modal pf-whats-new pf-whats-new-v33 fade-in"><div class="modal-head"><h3>PackForge v${PF_VERSION}</h3><button class="close-x" id="pfWhatsNewClose">×</button></div><div class="modal-body"><div class="pf-update-kicker">CAMPAIGN REWARDS + ADMIN LAB</div><h2>This update</h2><div class="pf-change-grid"><span>🎁 Variant / High-Roller / Vintage / Secret Hunt / Graded packs removed from the Shop and moved to Campaign special rewards</span><span>🛡 Admin Panel rebuilt into a full tabbed development control center</span><span>🌫 Jet Lumagui added as its own 1-in-1,000-card rarity · Power 1 · $609 sell</span><span>💨 Jet cards have a lightweight animated smoke treatment</span><span>🧪 Admin now includes economy, packs, cards, outcomes, Campaign, diagnostics, and code tools</span><span>🔒 Old public specialty-pack reward codes retired so specialty acquisition stays Campaign/Admin only</span><span>🪙 Coin jackpot rewards use core packs</span><span>💻 New admin/card visuals remain transform/opacity based with low DOM counts</span></div><div class="pf-update-divider"></div><h2>Everything since the original pre-split build</h2><div class="pf-change-grid cumulative"><span>⚡ Split-file architecture, PWA caching, and Chromebook-focused performance work</span><span>⚛ Astronomy replaced by the real Physics / quantum mechanics reference</span><span>🪙 Upgraded reactive Coin presentation</span><span>🧩 Nebula finish added with fractured-glass presentation</span><span>👁 Secret and Ghost separated into true rarity tiers with distinct visuals</span><span>💰 Card-face values unified with actual Sell values</span><span>⚔ Campaign spotlights, extra-card bonuses, animated scenes, and lore-first destinations</span><span>🌟 Semi-God / God Pack families, wrapper mutations, and Archive God Pack</span><span>❓ Centralized visual odds reference with cards, variants, specials, Semi-God, and God Pack views</span><span>🛡 Session-only Admin Panel and developer testing tools</span><span>⛶ Fullscreen card Inspect</span><span>🏆 Expanded achievements and organized Extra / Chances views</span><span>💻 Background timers, hidden-tab work, effects, and collection rendering optimized for weak Chrome hardware</span></div><button class="grade-action" id="pfWhatsNewDone">Got it</button></div></div>`;const close=()=>{m.classList.add('hidden');m.innerHTML=''};$('#pfWhatsNewClose').onclick=close;$('#pfWhatsNewDone').onclick=close};


  /* ==================== PackForge v3.6 — Ghost / Jet / Odds / Potion Cleanup ==================== */
  const PF_V36_POTION_CODES=['CoInPoTiOn-ThReE','OpEnToNiC-ThReE','PrIsM-PoTiOn-TwO','MuTaTiOn-SeRuM-TwO','CaSiNo-ElIxIr-ThReE','CaMpAiGn-PoTiOn-TwO','PoTiOn-RaNdOm-OnE'];
  PF_V36_POTION_CODES.forEach(k=>{if(rewardCodeDefs[k])delete rewardCodeDefs[k]});
  if(rewardCodeDefs.SANSAEVANS)rewardCodeDefs.SANSAEVANS.label='OWNER VAULT — $100,000,000 + 1,000 of every pack';
  state.potionInventory={};state.activePotions={};
  function pfV36DisablePotions(){
    state.potionInventory={};state.activePotions={};
    const tab=document.querySelector('[data-bag-tab="potions"]');if(tab)tab.remove();
    document.getElementById('bagPotionsTab')?.remove();
    document.getElementById('pfAdminPotions1000')?.remove();
  }
  pfV36DisablePotions();
  /* Potions are fully retired from gameplay. Legacy save fields are kept only so old saves still parse. */
  addPotion=function(){};usePotion=function(){};renderPotions=function(){};grantRandomPotion=function(){};activePotionMultiplier=function(){return 1};potionRemaining=function(){return 0};
  grantOwnerMegaVault=function(){earn(100000000);grantCorePacks(1000);markSaveDirty()};
  if(rewardCodeDefs['MiXeD-FiVe-500']){rewardCodeDefs['MiXeD-FiVe-500'].label='5 random packs + $500 + 1 special pack';rewardCodeDefs['MiXeD-FiVe-500'].apply=()=>{grantRandomCorePacks(5);earn(500);grantSpecialPacks(1)}}

  /* Admin-only five-card rarity packs. These never enter Campaign or random reward pools. */
  const PF_V36_RARITY_PACKS=[
    ['Common','#95a2b3'],['Uncommon','#65d685'],['Rare','#5fa9ff'],['Epic','#bd77ff'],['Legendary','#ffb84e'],
    ['Mythic','#ff3232'],['Divine','#72ecff'],['Ultra','#ff75db'],['Secret','#ffffff'],['Ghost','#62fff0'],['Jet Lumagui','#ff8b3d'],['Crue Lowe','#e8ff6e']
  ];
  for(const [rarity,color] of PF_V36_RARITY_PACKS){
    const id='admin_rarity_'+rarity.toLowerCase().replace(/\s+/g,'_');
    if(!premiumPackDefs[id])premiumPackDefs[id]={id,name:`${rarity} Pack`,emoji:rarity==='Ghost'?'👻':rarity==='Jet Lumagui'?'🌫':rarity==='Crue Lowe'?'♜':'◆',cost:0,sell:0,adminOnly:true,adminRarity:rarity,gradient:`linear-gradient(135deg,#10151d,${color},#090d13)`,glow:color,desc:`Five ${rarity} cards.`,effect:`Exactly 5 ${rarity} cards.`};
    state.premiumPackInventory[id]=Math.max(0,Number(state.premiumPackInventory[id]||0));
  }
  /* v3.6 diagnostics understand the admin-only rarity packs and retired potion system. */
  pfV35HealthCheck=function(){
    const publicPremium=Object.values(premiumPackDefs).filter(d=>!d.adminOnly),adminPacks=Object.values(premiumPackDefs).filter(d=>d.adminOnly);
    const checks=[
      ['Save state',!!state&&typeof state==='object'],['Card map',!!cardMap&&cardMap[JET_LUMAGUI_CARD.id]===JET_LUMAGUI_CARD],['Themes',Array.isArray(themes)&&themes.length>=5],
      ['Campaign specialty packs',publicPremium.length===5],['Admin rarity packs',adminPacks.length===PF_V36_RARITY_PACKS.length],['Campaign engine',!!state.campaigns],['Grading inventory',!!state.inventory],
      ['Odds engine',typeof pfRenderOddsBrowser==='function'],['Jet rarity odds',JET_LUMAGUI_CARD_CHANCE===1/1000],['Jet sell value',sellValue(JET_LUMAGUI_CARD,1,{variant:'Normal'})===609],['Jet power',JET_LUMAGUI_CARD.power===1],
      ['Specialty Shop disabled',buyPremiumPack.toString().includes('Campaign reward only')],['Potions retired',Object.keys(state.potionInventory||{}).length===0&&Object.keys(state.activePotions||{}).length===0],['Local save key',saveKey==='packforge_save_v1']
    ];const failed=checks.filter(x=>!x[1]);return {checks,failed,ok:failed.length===0};
  };
  const pfV36PremiumPullsBase=createPremiumPackPulls;
  createPremiumPackPulls=function(def,theme,autoMode=false){
    if(!def?.adminRarity)return pfV36PremiumPullsBase(def,theme,autoMode);
    const rarity=def.adminRarity,pulls=[];
    for(let i=0;i<5;i++){
      let card=null;
      if(rarity==='Ghost')card=GHOST_CARD;
      else if(rarity==='Jet Lumagui')card=JET_LUMAGUI_CARD;
      else if(rarity==='Crue Lowe')card=PF_CRUE_LOWE_CARD;
      else if(rarity==='Secret')card=theme.secretCards[Math.floor(Math.random()*theme.secretCards.length)]||theme.secretCards[0];
      else {const pool=theme.cards.filter(c=>c.rarity===rarity);card=pool[Math.floor(Math.random()*Math.max(1,pool.length))]||theme.cards[0]}
      const copy={uid:uid(),variant:'Normal',mutation:null,serial:null,grade:null,locked:false,obtainedAt:Date.now(),source:`Admin ${rarity} Pack`,openingPenalty:0,openingQuality:'Clean'};
      pulls.push({card,copy,newDiscovery:!state.discovered[card.id],added:false});
    }
    if(rarity==='Ghost')state.quirkStats.ghostCards=(state.quirkStats.ghostCards||0)+5;
    if(rarity==='Jet Lumagui')state.quirkStats.jetLumagui=(state.quirkStats.jetLumagui||0)+5;
    if(rarity==='Crue Lowe')state.quirkStats.crueLowe=(state.quirkStats.crueLowe||0)+5;
    return pulls;
  };
  const pfV36CampaignAddPackBase=campaignAddPack;
  campaignAddPack=function(themeId=null,special=false){
    /* Preserve normal Campaign rewards while guaranteeing admin-only rarity packs never enter them. */
    if(!special)return pfV36CampaignAddPackBase(themeId,false);
    const pool=basePackThemes(),t=themeId?themes.find(x=>x.id===themeId):pool[Math.floor(Math.random()*Math.max(1,pool.length))];if(!t)return null;
    if(Math.random()<.72){const allowed=Object.values(premiumPackDefs).filter(d=>!d.adminOnly);if(allowed.length){const d=allowed[Math.floor(Math.random()*allowed.length)];grantPremiumPack(d.id,1);return {theme:d.name,special:d.name,premium:true}}}
    const muts=Object.values(packMutations),m=muts[Math.floor(Math.random()*muts.length)];const pack={uid:uid(),themeId:t.id,mutation:m.id,source:'Exhibition Campaign'};state.specialPackInventory.push(pack);return {theme:`${t.name} ${m.name}`,special:m.name,mutation:true};
  };

  /* Old-style page-local ? buttons. They scroll away with the page instead of following the viewport. */
  function pfV36RemoveGlobalOdds(){document.getElementById('pfGlobalOddsButton')?.remove();document.getElementById('pfShopOddsButton')?.closest('.pf-central-odds-launch')?.remove();document.getElementById('pfBagOddsButton')?.closest('.pf-central-odds-launch')?.remove()}
  function pfV36MountOddsButtons(){
    pfV36RemoveGlobalOdds();
    const add=(view,id,tabGetter)=>{if(!view||document.getElementById(id))return;view.classList.add('pf-v36-odds-host');const b=document.createElement('button');b.id=id;b.className='pf-v36-odds-corner';b.type='button';b.title='Pack Odds';b.setAttribute('aria-label','Open pack odds');b.textContent='?';b.onclick=()=>showPackOdds(pfOddsState.themeId);view.appendChild(b);b.dataset.tabGetter=tabGetter};
    add(document.getElementById('view-shop'),'pfV36ShopOdds','shop');add(document.getElementById('view-collection'),'pfV36BagOdds','bag');pfV36UpdateOddsButtons();
  }
  function pfV36UpdateOddsButtons(){const s=document.getElementById('pfV36ShopOdds'),b=document.getElementById('pfV36BagOdds');if(s)s.classList.toggle('hidden',currentShopTab!=='packs');if(b)b.classList.toggle('hidden',currentBagTab!=='packs')}
  pfInstallCentralOddsButtons=function(){pfV36MountOddsButtons()};
  const pfV36ShopTabBase=setShopTab;setShopTab=function(tab){const r=pfV36ShopTabBase(tab);pfV36UpdateOddsButtons();return r};
  const pfV36BagTabBase=setBagTab;setBagTab=function(tab){if(tab==='potions')tab='cards';const r=pfV36BagTabBase(tab);pfV36UpdateOddsButtons();return r};

  /* Cleaner/larger odds browser with a real Pack Chances tab and a single scrolling body. */
  function pfV36PackChancesHTML(theme){
    const rarityRows=['Common','Uncommon','Rare','Epic','Legendary','Mythic','Divine','Ultra'].map(r=>{const p=RARITY_ODDS[r]||0;return `<article class="pf-v36-chance-row"><b>${r}</b><strong>${pfOddsPct(p)}</strong><span>${pfOddsOneIn(p)} per card · ${pfOddsPackOneIn(p)} per 5-card pack</span></article>`}).join('');
    const packModes=[
      ['Special mutation',specialPackChance()],['Semi-God family',Object.values(SEMI_GOD_MODE_CHANCES).reduce((a,b)=>a+b,0)],['God Pack family',pfTotalGodChance()],['6-card pack',BONUS_CARD_PACK_CHANCE],['4-card pack',SHORT_PACK_CHANCE]
    ].map(([n,p])=>`<article class="pf-v36-chance-row"><b>${n}</b><strong>${pfOddsOneIn(p)}</strong><span>${pfOddsPct(p)}</span></article>`).join('');
    return `<div class="pf-odds-card-toolbar"><label>Collection<select id="pfOddsThemeSelect">${themes.map(t=>`<option value="${t.id}" ${t.id===theme.id?'selected':''}>${t.emoji} ${t.name}</option>`).join('')}</select></label></div><h3 class="pf-odds-subhead">Card rarity rolls</h3><div class="pf-v36-chance-list">${rarityRows}<article class="pf-v36-chance-row secret"><b>Secret</b><strong>${pfOddsOneIn(SECRET_CHANCE)}</strong><span>per card before set split</span></article><article class="pf-v36-chance-row ghost"><b>Ghost</b><strong>${pfOddsOneIn(GHOST_CARD_CHANCE)}</strong><span>per card</span></article><article class="pf-v36-chance-row jet"><b>Jet Lumagui</b><strong>${pfOddsOneIn(JET_LUMAGUI_CARD_CHANCE)}</strong><span>per card</span></article></div><h3 class="pf-odds-subhead">Special pack modes</h3><div class="pf-v36-chance-list">${packModes}</div>`;
  }
  const pfV36OddsCardPageBase=pfOddsCardPageHTML;
  pfOddsCardPageHTML=function(theme){return pfV36OddsCardPageBase(theme).replace(/<div class="pf-odds-explain-box">[\s\S]*?<\/div>/,'')};
  pfOddsSpecialHTML=function(){const total=Object.values(packMutations).reduce((n,m)=>n+m.weight,0),base=specialPackChance();return `<div class="pf-odds-info-grid">${Object.values(packMutations).map(m=>{const p=base*(m.weight/total);return `<article class="pf-odds-info-card"><i style="--c:#c7a3ff"></i><b>${m.name}</b><strong>${pfOddsOneIn(p)} packs</strong><span>${pfOddsPct(p)}</span><small>${m.desc}</small></article>`}).join('')}</div><h3 class="pf-odds-subhead">Campaign specialty packs</h3><div class="pf-odds-info-grid">${Object.values(premiumPackDefs).filter(d=>!d.adminOnly).map(d=>`<article class="pf-odds-info-card premium" style="--pp:${d.glow}"><i>${d.emoji}</i><b>${d.name}</b><span>${d.effect}</span></article>`).join('')}</div>`};
  pfOddsPackModeFamilyHTML=function(tier){const defs=Object.entries(PF_PACK_MODE_DEFS).filter(([,d])=>d.tier===tier);return `<div class="pf-god-odds-grid">${defs.map(([id,d])=>`<article class="pf-god-odds-card ${tier} mode-${id}"><div class="pf-god-symbol">${d.emoji}</div><small>${tier==='semi'?'SEMI-GOD PACK':'GOD PACK'}</small><b>${d.name}</b><strong>${pfOddsOneIn(d.chance)} packs</strong><span>${pfOddsPct(d.chance)}</span><p>${d.desc}</p></article>`).join('')}</div>`};
  pfRenderOddsBrowser=function(){
    const m=document.getElementById('oddsModal');if(!m)return;const theme=themes.find(t=>t.id===pfOddsState.themeId)||themes[0],tabs=[['pack','Pack Chances'],['cards','Cards'],['variants','Variants'],['special','Special Packs'],['semi','Semi-God'],['god','God Packs']];if(!tabs.some(x=>x[0]===pfOddsState.tab))pfOddsState.tab='pack';let body='';if(pfOddsState.tab==='pack')body=pfV36PackChancesHTML(theme);else if(pfOddsState.tab==='cards')body=pfOddsCardPageHTML(theme);else if(pfOddsState.tab==='variants')body=pfOddsVariantsHTML();else if(pfOddsState.tab==='special')body=pfOddsSpecialHTML();else if(pfOddsState.tab==='semi')body=pfOddsPackModeFamilyHTML('semi');else body=pfOddsPackModeFamilyHTML('god');
    m.innerHTML=`<div class="modal pf-master-odds-modal pf-v36-odds fade-in"><div class="pf-master-odds-head"><div><small>PACKFORGE ODDS</small><h2>Pack Odds</h2></div><button class="close-x" id="closeOdds">×</button></div><div class="pf-master-odds-tabs">${tabs.map(([id,label])=>`<button data-pf-odds-tab="${id}" class="${pfOddsState.tab===id?'active':''}">${label}</button>`).join('')}</div><div class="pf-master-odds-body">${body}</div></div>`;
    document.getElementById('closeOdds').onclick=()=>m.classList.add('hidden');m.onmousedown=e=>{if(e.target===m)m.classList.add('hidden')};document.querySelectorAll('[data-pf-odds-tab]').forEach(b=>b.onclick=()=>{pfOddsState.tab=b.dataset.pfOddsTab;pfOddsState.page=1;pfRenderOddsBrowser()});const sel=document.getElementById('pfOddsThemeSelect');if(sel)sel.onchange=()=>{pfOddsState.themeId=sel.value;pfOddsState.page=1;pfRenderOddsBrowser()};if(document.getElementById('pfOddsPrev'))document.getElementById('pfOddsPrev').onclick=()=>{pfOddsState.page--;pfRenderOddsBrowser()};if(document.getElementById('pfOddsNext'))document.getElementById('pfOddsNext').onclick=()=>{pfOddsState.page++;pfRenderOddsBrowser()}
  };
  const pfV36ShowOddsBase=showPackOdds;showPackOdds=function(id){if(!pfOddsState.tab)pfOddsState.tab='pack';return pfV36ShowOddsBase(id)};

  /* Admin: dedicated five-of-rarity pack generator, no Potion tools, campaign packs stay separate. */
  const pfV36AdminRenderBase=pfRenderAdminV35;
  pfRenderAdminV35=function(){
    pfV36AdminRenderBase();pfV36DisablePotions();
    const shell=document.getElementById('pfAdminV35Shell');if(!shell)return;
    document.getElementById('pfV35Potions')?.remove();
    const prem=document.getElementById('pfV35Premium');if(prem){const old=prem.value;prem.innerHTML=Object.values(premiumPackDefs).filter(d=>!d.adminOnly).map(d=>`<option value="${d.id}">${d.emoji} ${d.name}</option>`).join('');if([...prem.options].some(o=>o.value===old))prem.value=old}
    const all=document.getElementById('pfV35GrantAllPremium');if(all)all.onclick=()=>{for(const d of Object.values(premiumPackDefs).filter(x=>!x.adminOnly))grantPremiumPack(d.id,1);pfAdminAfterAction('Granted one of every Campaign specialty pack.');pfRenderAdminV35()};
    const tab=shell.dataset.tab,body=shell.querySelector('.pf-admin-v35-body');if(tab==='packs'&&body&&!document.getElementById('pfV36RarityPack')){
      const box=document.createElement('section');box.className='pf-admin-v35-card pf-v36-rarity-pack-admin';box.innerHTML=`<h3>Five-card rarity packs</h3><p>Admin-only packs containing exactly five cards of one selected rarity.</p><div class="pf-admin-v35-controls"><select id="pfV36RarityPack">${PF_V36_RARITY_PACKS.map(([r])=>`<option value="${r}">${r} Pack</option>`).join('')}</select><input id="pfV36RarityPackAmount" type="number" min="1" max="1000" value="1"><button id="pfV36GiveRarityPack">Give Pack</button></div><div class="pf-admin-v35-btns"><button id="pfV36GiveSecretPack">Give Secret Pack</button><button id="pfV36GiveGhostPack">Give Ghost Pack</button><button id="pfV36GiveJetPack">Give Jet Pack</button></div>`;body.appendChild(box);
      const give=r=>{const id='admin_rarity_'+r.toLowerCase().replace(/\s+/g,'_'),n=Math.max(1,Math.min(1000,Math.floor(+document.getElementById('pfV36RarityPackAmount').value||1)));grantPremiumPack(id,n);pfAdminAfterAction(`Granted ${n} ${r} Pack${n===1?'':'s'}.`);pfRenderAdminV35()};
      document.getElementById('pfV36GiveRarityPack').onclick=()=>give(document.getElementById('pfV36RarityPack').value);document.getElementById('pfV36GiveSecretPack').onclick=()=>give('Secret');document.getElementById('pfV36GiveGhostPack').onclick=()=>give('Ghost');document.getElementById('pfV36GiveJetPack').onclick=()=>give('Jet Lumagui');
    }
  };

  /* Update/reveal copy and hide Potion references left by legacy state. */
  const pfV36UpdateBagCountsBase=updateBagCounts;updateBagCounts=function(){pfV36UpdateBagCountsBase();document.getElementById('bagPotionCount')?.remove()};
  const pfV36RenderAllBase=renderAll;renderAll=function(){pfV36DisablePotions();const r=pfV36RenderAllBase();pfV36MountOddsButtons();return r};

  /* v3.6 cumulative changelog. */
  pfShowWhatsNew=function(){pfClearUpdateBadge();const m=document.getElementById('confirmModal');m.classList.remove('hidden');m.innerHTML=`<div class="modal pf-whats-new pf-whats-new-v33 fade-in"><div class="modal-head"><h3>PackForge v${PF_VERSION}</h3><button class="close-x" id="pfWhatsNewClose">×</button></div><div class="modal-body"><div class="pf-update-kicker">CARD FX & ODDS CLEANUP</div><h2>This update</h2><div class="pf-change-grid"><span>👻 Ghost card itself upgraded with animated dimensional effects</span><span>🌫 Jet Lumagui smoke strengthened and given a flowing flame border</span><span>♜ Crue Lowe pack reveal now crossfades instead of using the normal 3D card flip</span><span>🏷 Black Label grade text corrected to white</span><span># Serialized labels now scale down to fit small cards</span><span>❓ Old-style page-local Odds button restored with a Pack Chances tab</span><span>🧪 Potions removed from the playable game and reward/code paths</span><span>📦 Admin-only five-card rarity packs added, including Secret / Ghost / Jet packs</span><span>💻 New card effects retain Performance / Anti-Lag / Reduced Motion fallbacks</span></div><div class="pf-update-divider"></div><h2>Everything since the original pre-split build</h2><div class="pf-change-grid cumulative"><span>⚡ Split-file architecture, PWA caching, and Chromebook-focused performance work</span><span>⚛ Astronomy replaced by the Physics / quantum mechanics reference</span><span>🪙 Reactive Coin presentation</span><span>🧩 Nebula finish added with fractured-glass presentation</span><span>👁 Secret, Ghost, Jet Lumagui, and Crue Lowe chase tiers</span><span>💰 Card-face values unified with actual Sell values</span><span>⚔ Campaign spotlights, extra-card bonuses, animated scenes, and Campaign-only specialty packs</span><span>🌟 Semi-God / God Pack families and Archive God Pack</span><span>❓ Centralized odds reference and exact card/pack chances</span><span>🛡 Session-only Admin development dashboard</span><span>⛶ Fullscreen card Inspect</span><span>🏆 Expanded achievements and Extra / Chances organization</span><span>💻 Background timers and effects optimized for weak Chrome hardware</span></div><button class="grade-action" id="pfWhatsNewDone">Got it</button></div></div>`;const close=()=>{m.classList.add('hidden');m.innerHTML=''};document.getElementById('pfWhatsNewClose').onclick=close;document.getElementById('pfWhatsNewDone').onclick=close};

  pfV36MountOddsButtons();pfV36DisablePotions();



  /* ==================== PackForge v3.7 — Flowing chase cards + lean odds ==================== */
  let pfV37VariantPreview='Holo';
  const PF_V37_VARIANTS=['Foil','Holo','Gold','Prismatic','Nebula','Serialized'];
  function pfV37VariantChance(v){
    if(v==='Nebula')return variantDefs.Nebula?.chance||0;
    const luck=variantLuckMultiplier();
    return (variantDefs[v]?.chance||0)*(v==='Foil'?1:luck);
  }
  function pfV37VariantsHTML(theme){
    if(!PF_V37_VARIANTS.includes(pfV37VariantPreview))pfV37VariantPreview='Holo';
    const v=pfV37VariantPreview,p=pfV37VariantChance(v),auto=p*.75;
    const previewCard=theme.cards.find(c=>c.rarity==='Rare')||theme.cards[0];
    const copy={variant:v,mutation:null,serial:v==='Serialized'?'PF-0042':null,grade:null,locked:false,holoPattern:v==='Holo'?'starburst':null};
    const label='per normal pack';
    return `<div class="pf-v37-variant-toolbar"><label>Collection<select id="pfOddsThemeSelect">${themes.map(t=>`<option value="${t.id}" ${t.id===theme.id?'selected':''}>${t.emoji} ${t.name}</option>`).join('')}</select></label><label>Variant<select id="pfOddsVariantSelect">${PF_V37_VARIANTS.map(x=>`<option value="${x}" ${x===v?'selected':''}>${x}</option>`).join('')}</select></label></div><div class="pf-v37-variant-stage"><div class="pf-v37-variant-preview">${cardHTML(previewCard,0,copy,1)}</div><div class="pf-v37-variant-copy"><small>VARIANT CHANCE</small><h2>${v}</h2><strong>${pfOddsOneIn(p)} ${label}</strong><span>${pfOddsPct(p)} manual · ${pfOddsPct(auto)} Auto Open</span></div></div><div class="pf-v37-variant-pills">${PF_V37_VARIANTS.map(x=>`<button data-pf-v37-variant="${x}" class="${x===v?'active':''}">${x}</button>`).join('')}</div>`;
  }
  pfRenderOddsBrowser=function(){
    const m=document.getElementById('oddsModal');if(!m)return;
    const theme=themes.find(t=>t.id===pfOddsState.themeId)||themes[0];
    const tabs=[['pack','Pack Chances'],['variants','Variants'],['special','Special Packs'],['semi','Semi-God'],['god','God Packs']];
    if(!tabs.some(x=>x[0]===pfOddsState.tab))pfOddsState.tab='pack';
    let body='';
    if(pfOddsState.tab==='pack')body=pfV36PackChancesHTML(theme);
    else if(pfOddsState.tab==='variants')body=pfV37VariantsHTML(theme);
    else if(pfOddsState.tab==='special')body=pfOddsSpecialHTML();
    else if(pfOddsState.tab==='semi')body=pfOddsPackModeFamilyHTML('semi');
    else body=pfOddsPackModeFamilyHTML('god');
    m.innerHTML=`<div class="modal pf-master-odds-modal pf-v36-odds pf-v37-odds fade-in"><div class="pf-master-odds-head"><div><small>PACKFORGE ODDS</small><h2>Pack Odds</h2></div><button class="close-x" id="closeOdds">×</button></div><div class="pf-master-odds-tabs">${tabs.map(([id,label])=>`<button data-pf-odds-tab="${id}" class="${pfOddsState.tab===id?'active':''}">${label}</button>`).join('')}</div><div class="pf-master-odds-body">${body}</div></div>`;
    document.getElementById('closeOdds').onclick=()=>m.classList.add('hidden');
    m.onmousedown=e=>{if(e.target===m)m.classList.add('hidden')};
    document.querySelectorAll('[data-pf-odds-tab]').forEach(b=>b.onclick=()=>{pfOddsState.tab=b.dataset.pfOddsTab;pfOddsState.page=1;pfRenderOddsBrowser()});
    const themeSel=document.getElementById('pfOddsThemeSelect');if(themeSel)themeSel.onchange=()=>{pfOddsState.themeId=themeSel.value;pfRenderOddsBrowser()};
    const variantSel=document.getElementById('pfOddsVariantSelect');if(variantSel)variantSel.onchange=()=>{pfV37VariantPreview=variantSel.value;pfRenderOddsBrowser()};
    document.querySelectorAll('[data-pf-v37-variant]').forEach(b=>b.onclick=()=>{pfV37VariantPreview=b.dataset.pfV37Variant;pfRenderOddsBrowser()});
  };
  const pfV37ShowOddsBase=showPackOdds;
  showPackOdds=function(id){if(pfOddsState.tab==='cards')pfOddsState.tab='pack';return pfV37ShowOddsBase(id)};

  /* Short changelog: only major player-facing changes. */
  pfShowWhatsNew=function(){
    pfClearUpdateBadge();const m=document.getElementById('confirmModal');m.classList.remove('hidden');
    m.innerHTML=`<div class="modal pf-whats-new pf-whats-new-v33 pf-whats-new-v37 fade-in"><div class="modal-head"><h3>PackForge v${PF_VERSION}</h3><button class="close-x" id="pfWhatsNewClose">×</button></div><div class="modal-body"><div class="pf-update-kicker">CHASE CARD POLISH</div><h2>Big changes</h2><div class="pf-change-grid"><span>👻 Ghost card border now flows around the edge while its starfield drifts across the print</span><span>🔥 Jet Lumagui keeps its smoke but gets a looping flame-flow border instead of a rotating edge</span><span>❓ Odds browser simplified; Cards removed and Variants now has a live selectable preview</span><span>♜ Ghost / Crue top rarity banners removed for a cleaner card face</span><span>🌫 Jet Lumagui now sells for exactly $609</span></div><div class="pf-update-divider"></div><h2>Major upgrades since the original build</h2><div class="pf-change-grid cumulative"><span>⚡ Split/PWA architecture + Chromebook-focused optimization</span><span>⚔ Campaign-focused card use and Campaign-only specialty rewards</span><span>🌟 Semi-God / God / Archive Pack chase system</span><span>🛡 Expanded Admin tools, Extra stats/chances/achievements, and Physics reference</span></div><button class="grade-action" id="pfWhatsNewDone">Got it</button></div></div>`;
    const close=()=>{m.classList.add('hidden');m.innerHTML=''};document.getElementById('pfWhatsNewClose').onclick=close;document.getElementById('pfWhatsNewDone').onclick=close;
  };


  /* ==================== PackForge v3.12 — local-only reset + Mines + low-edge deployment ==================== */
  variantDefs.Nebula={name:'Nebula',chance:1/2000,value:22};
  if(!variantRollOrder.includes('Nebula'))variantRollOrder.splice(Math.max(1,variantRollOrder.indexOf('Serialized')+1),0,'Nebula');
  if(typeof PF_V37_VARIANTS!=='undefined'){PF_V37_VARIANTS.splice(0,PF_V37_VARIANTS.length,...['Foil','Holo','Gold','Prismatic','Nebula','Serialized']);}
  packMutations.master={id:'master',name:'Master Pack',weight:0,value:1.15,desc:'Completed-set Campaign reward. Every card is Holo or better, with one premium finish guaranteed.'};
  const pfV310RollPackMutationBase=rollPackMutation;
  rollPackMutation=function(){if(Math.random()>=specialPackChance())return null;const arr=Object.values(packMutations).filter(x=>(x.weight||0)>0&&x.id!=='goldwave'),total=arr.reduce((n,x)=>n+x.weight,0);let r=Math.random()*total;for(const m of arr){r-=m.weight;if(r<=0)return m}return arr[0]||null};
  function pfV310MasterVariant(i,total){if(i===total-1){const r=Math.random();if(r<.05)return'Serialized';if(r<.25)return'Nebula';return'Prismatic'}const r=Math.random();if(r<.53)return'Holo';if(r<.77)return'Gold';if(r<.95)return'Prismatic';if(r<.99)return'Nebula';return'Serialized'}
  const pfV310CreatePackPullsBase=createPackPulls;
  createPackPulls=function(t,mutation,autoMode=false){const pulls=pfV310CreatePackPullsBase(t,mutation,autoMode);if(mutation?.id==='master'){pulls.forEach((p,i)=>{const v=pfV310MasterVariant(i,pulls.length);p.copy.variant=v;p.copy.serial=v==='Serialized'?makeSerial(p.card.id):null;p.copy.source='Master Pack';p.copy.premiumTrait='Master Set';p.copy.premiumValueMult=(p.copy.premiumValueMult||1)*1.15;if(v==='Holo')maybeApplyCollectorQuirks(p.copy,p.card)});pulls.sort((a,b)=>pullScore(a)-pullScore(b))}return pulls};
  const pfV310CampaignAddPackBase=campaignAddPack;
  campaignAddPack=function(themeId=null,special=false){if(!special)return pfV310CampaignAddPackBase(themeId,false);const completed=themes.filter(t=>themeComplete(t.id));if(completed.length&&Math.random()<.06){let t=themeId?completed.find(x=>x.id===themeId):null;if(!t)t=completed[Math.floor(Math.random()*completed.length)];state.specialPackInventory.push({uid:uid(),themeId:t.id,mutation:'master',source:'Master Campaign Reward'});state.stats.masterPacksWon=(state.stats.masterPacksWon||0)+1;return {theme:`${t.name} Master Pack`,special:'Master Pack',mutation:true,master:true}}return pfV310CampaignAddPackBase(themeId,true)};
  /* Remove retired variants/mutations from old saves without deleting owned cards. */
  for(const [cid,it] of Object.entries(state.inventory||{}))for(const ld of Object.values(it.levels||{}))for(const cp of ld.copies||[]){if(cp.variant==='Negative')cp.variant='Prismatic';if(cp.variant==='Glitched'||cp.variant==='Glitch'){cp.variant='Nebula';cp.glitchTarget=null}if(cp.mutation==='goldwave')cp.mutation='holosurge'}
  for(const sp of state.specialPackInventory||[])if(sp?.mutation==='goldwave')sp.mutation='holosurge';
  delete packMutations.goldwave;delete variantDefs.Negative;delete variantDefs.Glitched;
  delete state.adminForces.glitchNext;delete state.quirkStats.glitchedCards;
  /* Odds view: current variants only. */
  pfV37VariantPreview='Holo';
  /* Admin health follows the cleaned rules. */
  const pfV310HealthBase=pfV35HealthCheck;pfV35HealthCheck=function(){const h=pfV310HealthBase();h.checks.push(['Nebula variant',variantDefs.Nebula?.chance===1/2000],['Retired variants removed',!variantDefs.Negative&&!variantDefs.Glitched],['Golden Wave removed',!packMutations.goldwave],['Ghost power matches sell',effectiveCardPower(GHOST_CARD,1,{variant:'Normal'})===sellValue(GHOST_CARD,1,{variant:'Normal'})]);h.failed=h.checks.filter(x=>!x[1]);h.ok=h.failed.length===0;return h};
  /* Settings reset tab and coin-choice UI bindings. */
  const pfV310SettingsSync=syncSettingsUI;syncSettingsUI=function(){pfV310SettingsSync();const adminStatus=document.getElementById('pfAdminStatus');if(adminStatus)adminStatus.classList.add('hidden')};
  pfShowWhatsNew=function(){pfClearUpdateBadge();const m=document.getElementById('confirmModal');m.classList.remove('hidden');m.innerHTML=`<div class="modal pf-whats-new pf-whats-new-v33 fade-in"><div class="modal-head"><h3>PackForge v${PF_VERSION}</h3><button class="close-x" id="pfWhatsNewClose">×</button></div><div class="modal-body"><div class="pf-update-kicker">LOCAL-ONLY RESET</div><h2>Fresh start</h2><div class="pf-change-grid"><span>🧹 Everyone is reset once when this release first opens in their browser</span><span>💾 Progress now stays in this browser/device using local storage only</span><span>☁️ No Google, Firebase, account, or cloud-save sync is used</span><span>🛟 Local rotating recovery backups still protect the current browser save</span><span>💣 The Mines fix and low-edge Vercel packaging remain included</span></div><div class="pf-update-divider"></div><h2>Important</h2><div class="pf-change-grid cumulative"><span>The reset happens only once per browser for this release. Normal progress saves after that.</span><span>Clearing browser/site data will still erase local progress because there is intentionally no cloud copy.</span></div><button class="grade-action" id="pfWhatsNewDone">Got it</button></div></div>`;const close=()=>{m.classList.add('hidden');m.innerHTML=''};document.getElementById('pfWhatsNewClose').onclick=close;document.getElementById('pfWhatsNewDone').onclick=close};


  /* ==================== PackForge v3.13 — Ascendant Expansion ==================== */
  /* No deployment-triggered reset in this version. The old marker is irrelevant now. */
  try{localStorage.removeItem('packforge_reset_20260914_local_only_v1')}catch(e){}

  /* ----- Five former Campaign sets become permanent normal packs ----- */
  const PF_V313_NEW_SET_IDS=['dinosaurs','superheroes','pokemon','villains','mythology'];
  const PF_V313_PROFILES={
    medieval:{label:'Kingdom Standard',icon:'⚔️',price:80,sellMult:1.00,blurb:'Nearly baseline odds with a tiny Rare lean.',odds:{Uncommon:.218,Rare:.074,Epic:.0205,Legendary:.0063,Mythic:.00175,Divine:.00053,Ultra:.00015}},
    food:{label:'Rare Buffet',icon:'🍔',price:320,sellMult:1.00,blurb:'More Rare cards, paid for with fewer top-end spikes.',odds:{Uncommon:.225,Rare:.080,Epic:.018,Legendary:.0058,Mythic:.0016,Divine:.00050,Ultra:.00013}},
    ocean:{label:'Deep Cut',icon:'🌊',price:1250,sellMult:1.00,blurb:'A little less Rare volume with stronger Epic-and-up odds.',odds:{Uncommon:.217,Rare:.063,Epic:.025,Legendary:.0074,Mythic:.0021,Divine:.00062,Ultra:.00016}},
    space:{label:'Cosmic Risk',icon:'🚀',price:5200,sellMult:1.00,blurb:'Top-heavy odds: fewer mid pulls, slightly more major hits.',odds:{Uncommon:.215,Rare:.058,Epic:.019,Legendary:.0085,Mythic:.0030,Divine:.00080,Ultra:.00022}},
    monsters:{label:'Horde Pack',icon:'👹',price:21000,sellMult:1.00,blurb:'A Rare/Epic-heavy profile with a softer extreme ceiling.',odds:{Uncommon:.218,Rare:.078,Epic:.023,Legendary:.0055,Mythic:.00145,Divine:.00044,Ultra:.00011}},
    dinosaurs:{label:'Fossil Frenzy',icon:'🦖',price:1250,sellMult:1.55,blurb:'More Rares and big prehistoric value, with fewer extreme spikes.',odds:{Uncommon:.205,Rare:.085,Epic:.017,Legendary:.0055,Mythic:.0015,Divine:.00045,Ultra:.00012}},
    superheroes:{label:'Heroic Foil',icon:'🦸',price:1250,sellMult:1.65,blurb:'Epic-heavy packs with a slightly stronger ceiling.',odds:{Uncommon:.215,Rare:.060,Epic:.028,Legendary:.0074,Mythic:.0018,Divine:.00050,Ultra:.00013}},
    pokemon:{label:'Master Catch',icon:'⚡',price:1250,sellMult:1.80,blurb:'Less ordinary Rare volume, more Legendary/Mythic heat.',odds:{Uncommon:.210,Rare:.055,Epic:.018,Legendary:.0105,Mythic:.0032,Divine:.00065,Ultra:.00018}},
    villains:{label:'Midnight Slasher',icon:'🔪',price:750,sellMult:1.30,blurb:'A broad collector spread with strong Rare odds and steady value.',odds:{Uncommon:.225,Rare:.075,Epic:.023,Legendary:.0058,Mythic:.0016,Divine:.00045,Ultra:.00012}},
    mythology:{label:'Pantheon Ascension',icon:'⚡',price:900,sellMult:1.40,blurb:'Trades some mid-tier pulls for Mythic and Divine upside.',odds:{Uncommon:.225,Rare:.060,Epic:.019,Legendary:.0055,Mythic:.0042,Divine:.00085,Ultra:.00020}}
  };
  function pfV313NormalizeOdds(partial){const o={...partial};o.Common=Math.max(0,1-Object.values(partial).reduce((a,b)=>a+(+b||0),0));return o}
  for(const [id,p] of Object.entries(PF_V313_PROFILES)){p.odds=pfV313NormalizeOdds(p.odds);const t=themes.find(x=>x.id===id);if(t){t.campaignHidden=false;t.battleHidden=false;t.unlock=0;t.pfPackProfile=p;t.pfSellMult=p.sellMult;state.campaignSetOffers[id]=0;state.campaignSetSeen[id]=true}}

  /* ----- 125 cards per set, without changing any old card IDs ----- */
  rarityColor.God='#ffe36e';rarityColor.Ascendant='#effcff';rarityMult.God=7000;rarityMult.Ascendant=28000;
  const GOD_RARITY_CARD_CHANCE=1/2000000;
  const ASCENDANT_CARD_CHANCE=1/20000000;
  const PF_V313_SPECIAL_NAMES={
    medieval:['The God-King’s Last Crown','Throne Beyond Eternity'],food:['Ambrosia of the First Table','The Feast at the End of Time'],ocean:['Poseidon’s Black Pearl','The Ocean Above Heaven'],space:['Heart of Creation','The Universe That Remembers'],monsters:['The First Nightmare','The Name Monsters Fear'],dinosaurs:['The Titan Before Time','Extinction Refused'],superheroes:['The First Cape','Hero Beyond the Final Page'],pokemon:['The Impossible Catch','Master Ball Zero'],villains:['The Villain Who Won','The Last Face in the Dark'],mythology:['The First Thunder','God Above the Pantheon'],history:['The Final Continue','PLAYER ∞'],technology:['The Lost Final Reel','The Film Beyond Credits'],sports:['Redline Zero','Velocity Absolute'],music:['The Eighth Wonder','The Place Beyond Maps'],weather:['The Creature Gods Remember','Myth Made Flesh']
  };
  const PF_V313_EXP_RARITIES=['Common','Common','Common','Common','Common','Common','Common','Uncommon','Uncommon','Uncommon','Uncommon','Uncommon','Rare','Rare','Rare','Epic','Epic','Legendary','Mythic'];
  const PF_V313_EXP_SUFFIX=['Encore','Afterlight','Vault Cut','First Print','Night Run','Lost Edition','Collector File','Reserve','Second Wave','Archive','Prime Cut','Legacy','Reframed','Signature','Final Form','Masterwork','Event Horizon','Crown Edition','Beyond'];
  function pfV313UniqueExpansionName(t,rarity,i,used){
    let name='';
    if(Array.isArray(t.a)&&t.a.length&&Array.isArray(t.n)&&t.n.length){
      try{name=generatedName(t,rarity,220+i)}catch(e){}
    }
    if(!name||used.has(name)){
      const seed=Array.isArray(t.fixedNames)&&t.fixedNames.length?t.fixedNames[(i*11)%t.fixedNames.length]:t.name;
      name=`${seed} · ${PF_V313_EXP_SUFFIX[i%PF_V313_EXP_SUFFIX.length]}`;
    }
    let n=2,base=name;while(used.has(name))name=`${base} ${n++}`;return name
  }
  function pfV313AddSetExpansion(t,setIndex){
    const used=new Set(t.allCards.map(c=>c.name));
    PF_V313_EXP_RARITIES.forEach((rarity,i)=>{
      const name=pfV313UniqueExpansionName(t,rarity,i,used);used.add(name);
      const within=t.cards.filter(c=>c.rarity===rarity).length;
      const card={id:`${t.id}_x_${i}`,name,rarity,theme:t.id,value:Math.round(t.base*rarityMult[rarity]*(.95+(within%7)*.027)),power:fixedRarityPower(t.id,name,rarity),secret:false,expansion:true,flavor:flavorFor(t.id,name)};
      t.cards.push(card);t.allCards.push(card);allCards.push(card);cardMap[card.id]=card;
    });
    const names=PF_V313_SPECIAL_NAMES[t.id]||[`${t.name} Godforged`,`${t.name} Ascendant`];
    const sellBoost=t.pfSellMult||1;
    const god={id:`${t.id}_god_0`,name:names[0],rarity:'God',theme:t.id,value:Math.round((1250000+setIndex*75000)*sellBoost),power:15000000+setIndex*500000,secret:false,godRarity:true,flavor:`A God-rarity ${t.name} print. The foil seems to throw light from somewhere behind the card.`};
    const asc={id:`${t.id}_ascendant_0`,name:names[1],rarity:'Ascendant',theme:t.id,value:Math.round((6000000+setIndex*300000)*sellBoost),power:100000000+setIndex*4000000,secret:false,ascendantRarity:true,flavor:`The Ascendant card of the ${t.name} set. It looks less printed than captured, as if the image is still moving somewhere deeper than the surface.`};
    t.godCard=god;t.ascendantCard=asc;t.allCards.push(god,asc);allCards.push(god,asc);cardMap[god.id]=god;cardMap[asc.id]=asc;
  }
  themes.forEach(pfV313AddSetExpansion);
  state.quirkStats={godRarityCards:0,ascendantCards:0,...(state.quirkStats||{})};

  /* ----- Different rarity tables by pack. Auto Open still keeps 75% of Rare+ odds. ----- */
  function pfV313ThemeOdds(theme,autoMode=false){
    const source=theme?.pfPackProfile?.odds||RARITY_ODDS,odds={...source};
    if(autoMode){let high=0;for(const k of ['Rare','Epic','Legendary','Mythic','Divine','Ultra']){odds[k]=(source[k]||0)*.75;high+=odds[k]}odds.Uncommon=source.Uncommon||0;odds.Common=Math.max(0,1-odds.Uncommon-high)}
    return odds
  }
  function pfV313PickThemeRarity(theme,autoMode=false,qualityBoost=1){
    const baseOdds=pfV313ThemeOdds(theme,autoMode);
    const odds=overdriveActive()?(()=>{const b={...baseOdds};let high=0;for(const k of ['Rare','Epic','Legendary','Mythic','Divine','Ultra']){b[k]=(baseOdds[k]||0)*5;high+=b[k]}b.Uncommon=baseOdds.Uncommon||0;b.Common=Math.max(0,1-b.Uncommon-high);return b})():baseOdds;
    const roll=()=>{const raw=Math.random();let cumulative=0,chosen='Common',idx=0;for(let i=0;i<rarityOrder.length;i++){const k=rarityOrder[i];cumulative+=odds[k]||0;if(raw<=cumulative){chosen=k;idx=i;break}}let nearMiss=null;const next=rarityOrder[idx+1],gap=cumulative-raw;if(next&&idx+1>=3&&gap>=0&&gap<Math.max(.000025,(odds[next]||0)*.02))nearMiss=next;return {rarity:chosen,nearMiss}};
    let result=roll(),step=state.luckyChain?.active?(state.luckyChain.step||1):0;if(step&&['Common','Uncommon'].includes(result.rarity)&&Math.random()<Math.min(.24,step*.04))result=roll();if(qualityBoost>1&&['Common','Uncommon'].includes(result.rarity)&&Math.random()<Math.min(.32,(qualityBoost-1)*.32))result=roll();if(Math.random()<packQualityPromoteChance()*(autoMode?.75:1)*qualityBoost){const i=rarityOrder.indexOf(result.rarity);if(i>=0&&i<rarityOrder.length-1)result={rarity:rarityOrder[i+1],nearMiss:null}}return result
  }
  let pfV313AutoRollContext=false;
  weightedCard=function(theme,mutation,autoMode=false,qualityBoost=1){
    autoMode=!!(autoMode||pfV313AutoRollContext);
    const chaseScale=(autoMode?.75:1)*overdriveBoost(),roll=Math.random(),ascChance=ASCENDANT_CARD_CHANCE*chaseScale,godChance=GOD_RARITY_CARD_CHANCE*chaseScale,ghostChance=GHOST_CARD_CHANCE*chaseScale,jetChance=JET_LUMAGUI_CARD_CHANCE;
    if(!tutorialTrainingMode&&roll<ascChance){state.quirkStats.ascendantCards=(state.quirkStats.ascendantCards||0)+1;return {card:theme.ascendantCard,nearMiss:null}}
    if(!tutorialTrainingMode&&roll<ascChance+godChance){state.quirkStats.godRarityCards=(state.quirkStats.godRarityCards||0)+1;return {card:theme.godCard,nearMiss:null}}
    if(!tutorialTrainingMode&&roll<ascChance+godChance+ghostChance){state.quirkStats.ghostCards=(state.quirkStats.ghostCards||0)+1;return {card:GHOST_CARD,nearMiss:null}}
    if(!tutorialTrainingMode&&roll<ascChance+godChance+ghostChance+jetChance){state.quirkStats.jetLumagui=(state.quirkStats.jetLumagui||0)+1;return {card:JET_LUMAGUI_CARD,nearMiss:null}}
    if(Math.random()<SECRET_CHANCE*(autoMode?.75:1)*overdriveBoost())return {card:theme.secretCards[Math.floor(Math.random()*theme.secretCards.length)],nearMiss:null};
    let pick=pfV313PickThemeRarity(theme,autoMode,qualityBoost),chosen=pick.rarity,nearMiss=pick.nearMiss;if(mutation?.id==='luckypulse'&&chosen==='Common'&&Math.random()<.68){pick=pfV313PickThemeRarity(theme,autoMode,qualityBoost);chosen=pick.rarity;nearMiss=pick.nearMiss}if(mutation?.id==='voidbloom'&&chosen==='Common')chosen='Uncommon';const pool=theme.cards.filter(c=>c.rarity===chosen);return {card:pool[Math.floor(Math.random()*pool.length)],nearMiss}
  };

  /* A legacy achievement wrapper dropped the Auto Open argument years ago. Carry it as a tiny local context so the displayed 75% Rare+ penalty is actually applied. */
  const pfV313CreatePackPullsBase=createPackPulls;
  createPackPulls=function(t,mutation,autoMode=false){const prev=pfV313AutoRollContext;pfV313AutoRollContext=!!autoMode;try{return pfV313CreatePackPullsBase(t,mutation,autoMode)}finally{pfV313AutoRollContext=prev}};

  /* ----- Price / sell identity for the five new permanent packs ----- */
  const pfV313PackPriceBase=packPrice,pfV313PackListPriceBase=packListPrice;
  packPrice=function(theme){if(theme?.pfPackProfile)return Math.max(1,Math.round(theme.pfPackProfile.price*showcaseBonuses().packCostMult));return pfV313PackPriceBase(theme)};
  packListPrice=function(theme,mutation=null){if(theme?.pfPackProfile&&!mutation)return theme.pfPackProfile.price;return pfV313PackListPriceBase(theme,mutation)};
  const pfV313SellValueBase=sellValue;
  sellValue=function(card,level,copy){
    if(card?.ascendantRarity)return Math.max(1,Math.round(effectiveCardValue(card,level,copy)*12*showcaseBonuses().sellMult*overdriveBoost()));
    if(card?.godRarity)return Math.max(1,Math.round(effectiveCardValue(card,level,copy)*7*showcaseBonuses().sellMult*overdriveBoost()));
    const base=pfV313SellValueBase(card,level,copy),t=themes.find(x=>x.id===card?.theme),m=t?.pfSellMult||1;return Math.max(1,Math.round(base*m))
  };
  const pfV313PullScoreBase=pullScore;pullScore=function(p){if(p?.card?.ascendantRarity)return 980000000+effectiveCardValue(p.card,1,p.copy);if(p?.card?.godRarity)return 970000000+effectiveCardValue(p.card,1,p.copy);return pfV313PullScoreBase(p)};
  const pfV313SortEntriesBase=sortEntries;sortEntries=function(a,b){const sr=c=>c?.ascendantRarity?990:c?.godRarity?970:c?.crue?1000:c?.ghost?950:c?.secret?900:c?.jet?850:0;return sr(b.c)-sr(a.c)||pfV313SortEntriesBase(a,b)};

  /* ----- Clean Shop: pack cards stay visual and simple; exact differences live in the ? odds browser. ----- */
  renderShop=function(){
    const grid=document.getElementById('shopGrid');if(!grid)return;const arr=themes.filter(shopThemeVisible),note=document.getElementById('packTierNote');if(note)note.textContent='10 permanent sets · 125 cards each. Use the ? button for exact pack odds and differences.';
    grid.innerHTML=arr.map(t=>{const price=packPrice(t);return `<article class="shop-offer"><div class="shop-offer-art" style="background:${t.gradient}"><div class="shop-mini-pack" style="background:${t.gradient}"><span class="shop-pack-emoji">${t.emoji}</span><span class="shop-pack-name">${t.name.toUpperCase()}</span><small>5 CARDS · 125 CARD SET</small></div></div><div class="shop-offer-copy"><h3>${t.name} Pack</h3><p>${t.desc}</p><div class="shop-price">${fmt(price)}</div><button class="shop-buy" data-shop-buy="${t.id}" ${canAfford(price)?'':'disabled'}>Buy Pack</button></div></article>`}).join('');
    document.querySelectorAll('[data-shop-buy]').forEach(b=>b.onclick=()=>buyShopPack(b.dataset.shopBuy));if(document.getElementById('premiumPackShop'))document.getElementById('premiumPackShop').innerHTML=''
  };

  /* ----- Better player codes: cash and packs only. No upgrade/potion/loss effects. ----- */
  const PF_V313_REMOVE_CODE=/potion|tonic|serum|upgrade|\+\d+ .*level|luck on return|mysterious tax|vanished|glitch ate|literally one dollar/i;
  for(const [code,d] of Object.entries(rewardCodeDefs))if(PF_V313_REMOVE_CODE.test(`${code} ${d?.label||''}`))delete rewardCodeDefs[code];
  for(const code of ['CaSh-13','SeMi-RaRe-RuSh','SeMi-HoLo-FlOoD','SeMi-LeGeNd-FiNiSh','GoD-EpIc-PlUs','GoD-VaRiAnT','GoD-HoLo','GoD-SeCrEt','GoD-ArChIvE'])delete rewardCodeDefs[code];
  grantOwnerMegaVault=function(){const count=1000;earn(100000000);grantCorePacks(count);grantSpecialPacks(100);markSaveDirty()};
  if(rewardCodeDefs.SANSAEVANS){rewardCodeDefs.SANSAEVANS.label='OWNER VAULT — $100,000,000 + 1,000 of every permanent pack + 100 special packs';rewardCodeDefs.SANSAEVANS.apply=()=>grantOwnerMegaVault()}
  Object.assign(rewardCodeDefs,{
    'FoRgE-StArT':{label:'$3,000 + 5 random permanent packs',apply:()=>{earn(3000);grantRandomCorePacks(5)},rewardId:'PF313-FORGE-START'},
    'NeW-SeTs':{label:'1 of every permanent pack',apply:()=>grantCorePacks(1),rewardId:'PF313-NEW-SETS'},
    'VaUlT-RaIn':{label:'$15,000 + 10 random permanent packs',apply:()=>{earn(15000);grantRandomCorePacks(10)},rewardId:'PF313-VAULT-RAIN'},
    'ChAsE-NiGhT':{label:'8 random permanent packs + 3 special packs',apply:()=>{grantRandomCorePacks(8);grantSpecialPacks(3)},rewardId:'PF313-CHASE-NIGHT'},
    'FoUnDrY-CaSh':{label:'$25,000',apply:()=>earn(25000),rewardId:'PF313-FOUNDRY-CASH'},
    'TeN-SeTs':{label:'2 of every permanent pack + $7,500',apply:()=>{grantCorePacks(2);earn(7500)},rewardId:'PF313-TEN-SETS'}
  });

  /* ----- God + Ascendant card presentation ----- */
  const pfV313CardHTMLBase=cardHTML;
  cardHTML=function(card,count=0,copy=null,level=1,opts={}){let html=pfV313CardHTMLBase(card,count,copy,level,opts);if(card?.godRarity)html=html.replace('<div class="mutation-vfx"></div>','<div class="pf-god-cosmos"></div><div class="pf-god-mark">GOD RARITY</div><div class="mutation-vfx"></div>');if(card?.ascendantRarity)html=html.replace('<div class="mutation-vfx"></div>','<div class="pf-asc-cosmos"></div><div class="pf-asc-mark">ASCENDANT</div><div class="mutation-vfx"></div>');return html};
  const pfV313PullMetaBase=pullRevealMeta;
  pullRevealMeta=function(p){if(p?.card?.ascendantRarity)return {rarity:'Ascendant',variant:p.copy?.variant||'Normal',mutation:p.copy?.mutation?packMutations[p.copy.mutation]:null,tier:'ascendant',classes:['pull-ascendant'],specialColor:'#dffcff',label:'ASCENDANT · 1 IN 20,000,000'};if(p?.card?.godRarity)return {rarity:'God',variant:p.copy?.variant||'Normal',mutation:p.copy?.mutation?packMutations[p.copy.mutation]:null,tier:'god-rarity',classes:['pull-god-rarity'],specialColor:'#ffe36e',label:'GOD RARITY · 1 IN 2,000,000'};return pfV313PullMetaBase(p)};
  function pfV313RarityCinematic(p,host){if(!p?.card?.godRarity&&!p?.card?.ascendantRarity)return;const asc=!!p.card.ascendantRarity,fx=document.createElement('div');fx.className=`pf-rarity-cinematic ${asc?'ascendant':'god'}`;fx.innerHTML=`<div class="pf-rarity-cine-copy"><small>${asc?'THE PRINT HAS TRANSCENDED':'DIVINE SIGNATURE DETECTED'}</small><b>${asc?'ASCENDANT':'GOD'}</b><span>${asc?'1 IN 20,000,000 CARD ROLLS':'1 IN 2,000,000 CARD ROLLS'}</span></div>`;host.appendChild(fx);try{tone(asc?92:130,.36,'sine',.022);setTimeout(()=>tone(asc?740:590,.3,'triangle',.022),260);setTimeout(()=>tone(asc?1110:880,.28,'sine',.018),480)}catch(e){}setTimeout(()=>fx.remove(),2150)}
  const pfV313TriggerPullFxBase=triggerPullRevealFx;triggerPullRevealFx=function(p,ov,stageFx,burstLabel){pfV313TriggerPullFxBase(p,ov,stageFx,burstLabel);if(!ov.classList.contains('auto-opening')&&(p?.card?.godRarity||p?.card?.ascendantRarity))pfV313RarityCinematic(p,ov)};

  /* Make manual reveal timing / celebration recognize the two new chase tiers. */
  const pfV313ShowPullsBase=showPulls;
  showPulls=function(theme,pulls,mutation,auto=false,autoOptions=null){return pfV313ShowPullsBase(theme,pulls,mutation,auto,autoOptions)};

  /* ----- Odds reference reflects the selected pack's actual table + new chase tiers. ----- */
  const pfV313CardRollChanceBase=pfCardRollChance;
  pfCardRollChance=function(card,theme,auto=false){const scale=auto?.75:1;if(card?.ascendantRarity)return ASCENDANT_CARD_CHANCE*scale;if(card?.godRarity)return GOD_RARITY_CARD_CHANCE*scale;if(!card?.secret&&!card?.ghost&&!card?.jet){const special=Math.min(.02,(ASCENDANT_CARD_CHANCE+GOD_RARITY_CARD_CHANCE+GHOST_CARD_CHANCE)*scale+JET_LUMAGUI_CARD_CHANCE),secret=SECRET_CHANCE*scale,table=pfV313ThemeOdds(theme,auto),count=theme.cards.filter(c=>c.rarity===card.rarity).length;return (1-special)*(1-secret)*(table[card.rarity]||0)/Math.max(1,count)}return pfV313CardRollChanceBase(card,theme,auto)};
  pfV36PackChancesHTML=function(theme){const table=pfV313ThemeOdds(theme,false),profile=theme.pfPackProfile;const rarityRows=['Common','Uncommon','Rare','Epic','Legendary','Mythic','Divine','Ultra'].map(r=>{const p=table[r]||0;return `<article class="pf-v36-chance-row"><b>${r}</b><strong>${pfOddsPct(p)}</strong><span>${pfOddsOneIn(p)} per card · ${pfOddsPackOneIn(p)} per 5-card pack</span></article>`}).join('');const packModes=[['Special mutation',specialPackChance()],['Semi-God family',Object.values(SEMI_GOD_MODE_CHANCES).reduce((a,b)=>a+b,0)],['God Pack family',pfTotalGodChance()],['6-card pack',BONUS_CARD_PACK_CHANCE],['4-card pack',SHORT_PACK_CHANCE]].map(([n,p])=>`<article class="pf-v36-chance-row"><b>${n}</b><strong>${pfOddsOneIn(p)}</strong><span>${pfOddsPct(p)}</span></article>`).join('');return `<div class="pf-odds-card-toolbar"><label>Collection<select id="pfOddsThemeSelect">${themes.map(t=>`<option value="${t.id}" ${t.id===theme.id?'selected':''}>${t.emoji} ${t.name}</option>`).join('')}</select></label>${profile?`<div><b>${profile.icon} ${profile.label}</b><span>${profile.blurb}</span></div>`:''}</div><h3 class="pf-odds-subhead">Card rarity rolls · ${theme.name}</h3><div class="pf-v36-chance-list">${rarityRows}<article class="pf-v36-chance-row secret"><b>Secret</b><strong>${pfOddsOneIn(SECRET_CHANCE)}</strong><span>per card before set split</span></article><article class="pf-v36-chance-row ghost"><b>Ghost</b><strong>${pfOddsOneIn(GHOST_CARD_CHANCE)}</strong><span>per card</span></article><article class="pf-v36-chance-row" style="--c:#ffe36e"><b>God rarity</b><strong>${pfOddsOneIn(GOD_RARITY_CARD_CHANCE)}</strong><span>per card · one unique God card per set</span></article><article class="pf-v36-chance-row" style="--c:#effcff"><b>Ascendant</b><strong>${pfOddsOneIn(ASCENDANT_CARD_CHANCE)}</strong><span>per card · highest set rarity</span></article><article class="pf-v36-chance-row jet"><b>Jet Lumagui</b><strong>${pfOddsOneIn(JET_LUMAGUI_CARD_CHANCE)}</strong><span>per card</span></article></div><h3 class="pf-odds-subhead">Special pack modes</h3><div class="pf-v36-chance-list">${packModes}</div>`};

  /* ----- Incremental money: Card Foundry. 100% local, active-tab only. ----- */
  state.foundry={level:1,totalEarned:0,...(state.foundry||{})};state.foundry.level=Math.max(1,Math.floor(Number(state.foundry.level)||1));state.foundry.totalEarned=Math.max(0,Number(state.foundry.totalEarned)||0);
  function pfFoundryRate(){return .25*Math.pow(state.foundry.level,1.55)+completedSets()*.15}
  function pfFoundryCost(){return Math.round(350*Math.pow(1.65,Math.max(0,state.foundry.level-1)))}
  let pfFoundryLast=Date.now(),pfFoundryUnsaved=0,pfFoundryPulseAt=0;
  function pfRenderFoundry(){const level=document.getElementById('pfFoundryLevel'),rate=document.getElementById('pfFoundryRate'),total=document.getElementById('pfFoundryTotal'),btn=document.getElementById('pfFoundryUpgrade'),note=document.getElementById('pfFoundryNote');if(level)level.textContent=state.foundry.level.toLocaleString();if(rate)rate.textContent=`${fmt(pfFoundryRate())}/sec`;if(total)total.textContent=fmt(state.foundry.totalEarned);const cost=pfFoundryCost();if(btn){btn.textContent=`Upgrade line · ${fmt(cost)}`;btn.disabled=!canAfford(cost)}if(note)note.textContent=`Local only · +${fmt(completedSets()*.15)}/sec from completed sets · no offline earnings.`}
  function pfUpgradeFoundry(){const cost=pfFoundryCost();if(!spend(cost)){sfx('error');pfRenderFoundry();return}state.foundry.level++;sfx('buy');markSaveDirty();save();renderHUD();pfRenderFoundry();toast('Foundry upgraded',`Production is now ${fmt(pfFoundryRate())}/sec.`)}
  const pfFoundryUpgradeBtn=document.getElementById('pfFoundryUpgrade');if(pfFoundryUpgradeBtn)pfFoundryUpgradeBtn.onclick=pfUpgradeFoundry;
  setInterval(()=>{const now=Date.now(),dt=Math.min(2,Math.max(0,(now-pfFoundryLast)/1000));pfFoundryLast=now;if(document.hidden||dt<=0)return;const amount=pfFoundryRate()*dt;if(amount>0){state.cash+=amount;state.lifetime+=amount;state.foundry.totalEarned+=amount;pfFoundryUnsaved+=dt;markSaveDirty();const cash=document.getElementById('cashTop'),casino=document.getElementById('casinoCashReadout');if(cash)cash.textContent=fmt(state.cash);if(casino)casino.textContent=fmt(state.cash);pfRenderFoundry();if(now-pfFoundryPulseAt>4000){pfFoundryPulseAt=now;const card=document.getElementById('pfFoundryCard');if(card){card.classList.add('pulse');setTimeout(()=>card.classList.remove('pulse'),500)}}if(pfFoundryUnsaved>=10){pfFoundryUnsaved=0;save()}}},1250);
  document.addEventListener('visibilitychange',()=>{pfFoundryLast=Date.now();if(document.hidden&&pfFoundryUnsaved>0){pfFoundryUnsaved=0;save(true)}});window.addEventListener('beforeunload',()=>{if(pfFoundryUnsaved>0)save(true)});pfRenderFoundry();

  /* ----- Health hooks used by the final regression pass. ----- */
  window.__pfV313Health=()=>({version:PF_VERSION,permanentSets:basePackThemes().map(t=>t.id),setCounts:Object.fromEntries(themes.map(t=>[t.id,t.allCards.length])),newPackPrices:Object.fromEntries(PF_V313_NEW_SET_IDS.map(id=>[id,packListPrice(themes.find(t=>t.id===id))])),newPackSellMultipliers:Object.fromEntries(PF_V313_NEW_SET_IDS.map(id=>[id,themes.find(t=>t.id===id)?.pfSellMult])),godChance:GOD_RARITY_CARD_CHANCE,ascendantChance:ASCENDANT_CARD_CHANCE,allSets125:themes.every(t=>t.allCards.length===125),codeHasForbiddenReward:Object.entries(rewardCodeDefs).some(([k,d])=>/potion|tonic|serum|upgrade|\+\d+ .*level|luck on return|tax|vanished|glitch ate/i.test(`${k} ${d?.label||''}`)),foundry:{level:state.foundry.level,rate:pfFoundryRate(),cost:pfFoundryCost()},resetMarkerPresent:localStorage.getItem('packforge_reset_20260914_local_only_v1')});

  pfShowWhatsNew=function(){pfClearUpdateBadge();const m=document.getElementById('confirmModal');m.classList.remove('hidden');m.innerHTML=`<div class="modal pf-whats-new pf-whats-new-v33 fade-in"><div class="modal-head"><h3>PackForge v${PF_VERSION}</h3><button class="close-x" id="pfWhatsNewClose">×</button></div><div class="modal-body"><div class="pf-update-kicker">ASCENDANT EXPANSION</div><h2>10 permanent sets · 125 cards each</h2><div class="pf-change-grid"><span>💾 Forced deployment reset removed — current local saves stay intact</span><span>🦖 Dinosaurs, 🦸 Superheroes, ⚡ Pokémon, 🔪 Villains, and ⚡ Mythology moved from Campaign discovery into the normal Shop</span><span>🎴 Every set expanded to exactly 125 cards while preserving every old card ID</span><span>☀️ God rarity added above Ghost · 1 in 2,000,000 card rolls</span><span>✦ Ascendant rarity added above God · 1 in 20,000,000 card rolls</span><span>📦 New packs use distinct rarity tables instead of identical odds</span><span>💰 Expansion-set cards sell for 1.30×–1.80× normal values; three premium packs cost $1,250</span><span>🏭 Card Foundry adds small local passive income while PackForge is open</span><span>🔑 Reward codes cleaned up: no potion, upgrade, or punishment rewards</span><span>⚡ Still self-contained and cache-first for very low Vercel edge-request usage</span></div><button class="grade-action" id="pfWhatsNewDone">Got it</button></div></div>`;const close=()=>{m.classList.add('hidden');m.innerHTML=''};document.getElementById('pfWhatsNewClose').onclick=close;document.getElementById('pfWhatsNewDone').onclick=close};


  /* ==================== PackForge v3.14 — Clean Shop / Admin / Names ==================== */
  state.godPackQueue=Array.isArray(state.godPackQueue)?state.godPackQueue.filter(x=>PF_PACK_MODE_DEFS[x]):[];

  /* Keep regular card names short and collectible-looking. IDs, rarity, value and save ownership do not change. */
  const PF_V314_EXTRA_NAMES={
    dinosaurs:['Albertosaurus','Ceratosaurus','Corythosaurus','Edmontosaurus','Euoplocephalus','Maiasaura','Monolophosaurus','Oviraptor','Protoceratops','Styracosaurus','Suchomimus','Torvosaurus','Utahraptor','Yutyrannus','Acrocanthosaurus','Argentinosaurus','Dreadnoughtus','Microraptor','Pachyrhinosaurus'],
    superheroes:['Nova','Valkyrie','Starlight','Nightwing','Tempest','Aegis','Atlas','Comet','Pulse','Oracle','Meteor','Specter','Volt','Titan','Beacon','Arrow','Sentinel','Guardian','Phoenix'],
    pokemon:['Electrode','Exeggcute','Exeggutor','Cubone','Marowak','Hitmonlee','Hitmonchan','Lickitung','Koffing','Weezing','Rhyhorn','Rhydon','Chansey','Tangela','Kangaskhan','Horsea','Seadra','Goldeen','Seaking'],
    villains:['Moriarty','Voldemort','Darth Vader','Palpatine','Thanos','Ultron','Killmonger','Red Skull','Carnage','Sabretooth','Doomsday','Darkseid','Joker','Magneto','Loki','Sauron','Freddy Krueger','Michael Myers','Leatherface'],
    mythology:['Hecate','Hephaestus','Nemesis','Nyx','Erebus','Atlas','Prometheus','Perseus','Theseus','Jason','Hector','Hercules','Hel','Frigg','Skadi','Sobek','Sekhmet','Thoth','Maui']
  };
  function pfV314Roman(n){const r=['','II','III','IV','V','VI','VII','VIII','IX','X'];return r[n]||String(n)}
  function pfV314SimpleCoreNames(t){
    const used=new Map();
    for(const c of t.cards){
      let base='';
      if(Array.isArray(t.n)){
        const low=String(c.name||'').toLowerCase();
        base=t.n.find(n=>low.includes(String(n).toLowerCase()))||'';
      }
      if(!base){
        const seed=(t.seeds||[]).find(x=>x[0]===c.name);base=seed?seed[0]:(t.n?.[t.cards.indexOf(c)%Math.max(1,t.n?.length||1)]||c.name);
      }
      base=String(base).replace(/^(The )/,'').trim();
      const k=(used.get(base)||0)+1;used.set(base,k);
      c.name=k===1?base:`${base} ${pfV314Roman(k)}`;
      c.flavor=flavorFor(t.id,c.name);
    }
  }
  for(const t of themes){
    if(PF_V313_NEW_SET_IDS.includes(t.id)){
      const source=themeDefs.find(d=>d.name===t.name&&Array.isArray(d.fixedNames)&&d.fixedNames.length>=100);
      const names=[...(source?.fixedNames||[]),...(PF_V314_EXTRA_NAMES[t.id]||[])],used=new Map();
      t.cards.forEach((c,i)=>{if(names[i]){const raw=names[i],k=(used.get(raw)||0)+1;used.set(raw,k);c.name=k===1?raw:`${raw} ${pfV314Roman(k)}`;c.flavor=flavorFor(t.id,c.name)}});
    }else if(['medieval','food','ocean','space','monsters'].includes(t.id))pfV314SimpleCoreNames(t);
  }

  /* God and Ascendant five-card rarity packs for the owner/admin. */
  for(const [rarity,color,emoji] of [['God','#ffe36e','☀️'],['Ascendant','#e9fbff','✦']]){
    const id='admin_rarity_'+rarity.toLowerCase();
    if(!premiumPackDefs[id])premiumPackDefs[id]={id,name:`${rarity} Pack`,emoji,cost:0,sell:0,adminOnly:true,adminRarity:rarity,gradient:'linear-gradient(135deg,#10151d,'+color+',#090d13)',glow:color,desc:`Five ${rarity} cards.`,effect:`Exactly 5 ${rarity} cards.`};
    state.premiumPackInventory[id]=Math.max(0,Number(state.premiumPackInventory[id]||0));
  }

  function pfV314GiveGodMode(mode,count=1){
    count=clamp(Math.floor(Number(count)||1),1,100);if(!PF_PACK_MODE_DEFS[mode])return;
    state.godPackQueue=state.godPackQueue||[];for(let i=0;i<count;i++)state.godPackQueue.push(mode);grantRandomCorePacks(count);markSaveDirty();
  }
  function pfV314GiveEverySpecial(){
    for(const d of Object.values(premiumPackDefs).filter(x=>!x.adminOnly))grantPremiumPack(d.id,1);
    const ts=basePackThemes(),ms=Object.values(packMutations);ms.forEach((m,i)=>{const t=ts[i%ts.length];state.specialPackInventory.push({uid:uid(),themeId:t.id,mutation:m.id,source:'Special Pack Code'})});markSaveDirty();
  }

  /* Codes are intentionally pack-focused. Keep the tutorial code and owner code, replace the noisy old set. */
  for(const code of Object.keys(rewardCodeDefs))if(!['SANSAEVANS','PaCkS-FiVe'].includes(code))delete rewardCodeDefs[code];
  Object.assign(rewardCodeDefs,{
    'SpEcIaL-EvErY':{label:'1 of every specialty pack + 1 of every special mutation',apply:pfV314GiveEverySpecial,rewardId:'PF314-SPECIAL-EVERY'},
    'GoD-EpIc':{label:'1 Epic+ God Pack',apply:()=>pfV314GiveGodMode('rarity'),rewardId:'PF314-GOD-EPIC'},
    'GoD-VaRiAnT':{label:'1 Variant God Pack',apply:()=>pfV314GiveGodMode('variant'),rewardId:'PF314-GOD-VARIANT'},
    'GoD-HoLo':{label:'1 Holo God Pack',apply:()=>pfV314GiveGodMode('holo'),rewardId:'PF314-GOD-HOLO'},
    'GoD-SeCrEt':{label:'1 Secret God Pack',apply:()=>pfV314GiveGodMode('secret'),rewardId:'PF314-GOD-SECRET'},
    'GoD-ArChIvE':{label:'1 Archive God Pack',apply:()=>pfV314GiveGodMode('archive'),rewardId:'PF314-GOD-ARCHIVE'},
    'SeMi-RaRe':{label:'1 Rare Rush pack',apply:()=>pfV314GiveGodMode('semi_rare'),rewardId:'PF314-SEMI-RARE'},
    'SeMi-HoLo':{label:'1 Holo Flood pack',apply:()=>pfV314GiveGodMode('semi_holo'),rewardId:'PF314-SEMI-HOLO'},
    'SeMi-FiNiSh':{label:'1 Legendary Finish pack',apply:()=>pfV314GiveGodMode('semi_finish'),rewardId:'PF314-SEMI-FINISH'},
    'GoD-CaRdS':{label:'1 God Rarity Pack',apply:()=>grantPremiumPack('admin_rarity_god',1),rewardId:'PF314-GOD-CARDS'},
    'AsCeNdAnT':{label:'1 Ascendant Pack',apply:()=>grantPremiumPack('admin_rarity_ascendant',1),rewardId:'PF314-ASCENDANT'},
    'PaCk-EaCh':{label:'1 of every permanent pack',apply:()=>grantCorePacks(1),rewardId:'PF314-PACK-EACH'},
    'CaSh-10000':{label:'$10,000',apply:()=>earn(10000),rewardId:'PF314-CASH-10K'}
  });

  /* Replace the old eight-tab Admin Lab with two useful pages. */
  pfBuildAdminV35=function(){
    const board=document.getElementById('pfAdminBoard');if(!board)return;
    const old=document.getElementById('pfAdminV35Shell');if(old)old.remove();
    [...board.children].forEach(ch=>{if(ch.id!=='pfAdminV314Shell')ch.classList.add('pf-admin-v35-legacy')});
    let shell=document.getElementById('pfAdminV314Shell');if(shell)return;
    shell=document.createElement('div');shell.id='pfAdminV314Shell';shell.className='pf-admin-v314-shell';shell.dataset.tab='give';
    shell.innerHTML=`<nav class="pf-admin-v314-nav"><button class="active" data-v314tab="give">Give Stuff</button><button data-v314tab="codes">Codes</button></nav><div id="pfAdminV314Body"></div>`;
    board.prepend(shell);shell.querySelectorAll('[data-v314tab]').forEach(b=>b.onclick=()=>{shell.dataset.tab=b.dataset.v314tab;shell.querySelectorAll('[data-v314tab]').forEach(x=>x.classList.toggle('active',x===b));pfRenderAdminV35()});
  };
  pfRenderAdminV35=function(){
    if(!pfAdminUnlocked)return;pfBuildAdminV35();const shell=document.getElementById('pfAdminV314Shell'),body=document.getElementById('pfAdminV314Body');if(!shell||!body)return;
    if(shell.dataset.tab==='codes'){const rows=Object.entries(rewardCodeDefs).map(([code,d])=>({code,label:d.label,used:!!(state.redeemedCodes?.[code]||state.redeemedCodes?.[d.rewardId])}));body.innerHTML=`<div class="pf-admin-v314-codegrid">${rows.map(r=>`<article><code>${pfEscapeHtml(r.code)}</code><b>${pfEscapeHtml(r.label)}</b><small>${r.used?'USED ON THIS SAVE':'AVAILABLE'}</small></article>`).join('')}</div>`;return}
    const modes=Object.entries(PF_PACK_MODE_DEFS);
    body.innerHTML=`<div class="pf-admin-v314-grid">
      <section class="pf-admin-v314-card"><h3>Cash</h3><p>Quick local-save money controls.</p><div class="pf-admin-v314-actions"><button id="v314Cash1m">+$1M</button><button id="v314Cash100m">+$100M</button></div></section>
      <section class="pf-admin-v314-card"><h3>Permanent packs</h3><p>Give normal Shop packs without changing odds.</p><div class="pf-admin-v314-actions"><button id="v314Each1">+1 Each</button><button id="v314Each10">+10 Each</button><button id="v314Random25">+25 Random</button></div></section>
      <section class="pf-admin-v314-card"><h3>Special packs</h3><p>Campaign/specialty pack inventory.</p><div class="pf-admin-v314-actions"><button id="v314EverySpecial">+1 Every Special</button>${Object.values(premiumPackDefs).filter(x=>!x.adminOnly).map(d=>`<button data-v314prem="${d.id}">+1 ${d.name}</button>`).join('')}</div></section>
      <section class="pf-admin-v314-card"><h3>Chase rarity packs</h3><p>Five-card owner packs for testing the rarest card tiers.</p><div class="pf-admin-v314-actions"><button class="god" data-v314prem="admin_rarity_god">+1 God Rarity Pack</button><button class="asc" data-v314prem="admin_rarity_ascendant">+1 Ascendant Pack</button><button data-v314prem="admin_rarity_ghost">+1 Ghost Pack</button><button data-v314prem="admin_rarity_crue_lowe">+1 Crue Lowe Pack</button></div></section>
    </div><section class="pf-admin-v314-card" style="margin-top:10px"><h3>God / Semi-God packs</h3><p>Each button adds one normal pack and queues that exact wrapper mode. Queue several and they open in order.</p><div class="pf-admin-v314-actions">${modes.map(([id,d])=>`<button class="${d.tier==='god'?'god':''}" data-v314mode="${id}">+1 ${d.name}</button>`).join('')}</div></section><section class="pf-admin-v314-card" style="margin-top:10px"><h3>System</h3><p>${state.godPackQueue.length?`Queued rare packs: ${state.godPackQueue.length}`:'No God/Semi-God packs queued.'}</p><div class="pf-admin-v314-actions"><button id="v314Save">Save Now</button><button id="v314ClearQueue">Clear Rare Queue</button><button id="v314Lock">Lock Admin</button></div></section>`;
    const act=(id,fn,msg)=>{const el=document.getElementById(id);if(el)el.onclick=()=>{fn();pfAdminAfterAction(msg);pfRenderAdminV35()}};
    act('v314Cash1m',()=>earn(1e6),'Added $1,000,000.');act('v314Cash100m',()=>earn(1e8),'Added $100,000,000.');act('v314Each1',()=>grantCorePacks(1),'Granted 1 of every permanent pack.');act('v314Each10',()=>grantCorePacks(10),'Granted 10 of every permanent pack.');act('v314Random25',()=>grantRandomCorePacks(25),'Granted 25 random permanent packs.');act('v314EverySpecial',pfV314GiveEverySpecial,'Granted one of every specialty pack.');
    body.querySelectorAll('[data-v314prem]').forEach(b=>b.onclick=()=>{grantPremiumPack(b.dataset.v314prem,1);pfAdminAfterAction(`Granted 1 ${premiumPackDefs[b.dataset.v314prem]?.name||'pack'}.`);pfRenderAdminV35()});
    body.querySelectorAll('[data-v314mode]').forEach(b=>b.onclick=()=>{const d=PF_PACK_MODE_DEFS[b.dataset.v314mode];pfV314GiveGodMode(b.dataset.v314mode,1);pfAdminAfterAction(`Added 1 ${d.name}.`);pfRenderAdminV35()});
    act('v314Save',()=>save(true),'Save written.');act('v314ClearQueue',()=>{state.godPackQueue=[];state.adminForces.godMode=null},'Rare pack queue cleared.');const lock=document.getElementById('v314Lock');if(lock)lock.onclick=()=>{pfAdminUnlocked=false;renderPfAdminBoard()};
  };

  /* Make the calmer Foundry copy/status match the compact side panel. */
  pfRenderFoundry=function(){const level=document.getElementById('pfFoundryLevel'),rate=document.getElementById('pfFoundryRate'),total=document.getElementById('pfFoundryTotal'),btn=document.getElementById('pfFoundryUpgrade'),note=document.getElementById('pfFoundryNote');if(level)level.textContent=state.foundry.level.toLocaleString();if(rate)rate.textContent=`${fmt(pfFoundryRate())}/sec`;if(total)total.textContent=fmt(state.foundry.totalEarned);const cost=pfFoundryCost();if(btn){btn.textContent=`Upgrade · ${fmt(cost)}`;btn.disabled=!canAfford(cost)}if(note)note.textContent='Runs only while this tab is open.'};pfRenderFoundry();

  window.__pfV314Health=()=>({version:PF_VERSION,sets:basePackThemes().length,allSets125:themes.every(t=>t.allCards.length===125),godQueue:Array.isArray(state.godPackQueue),shopHasProfileTags:String(renderShop).includes('pf-pack-profile'),codes:Object.keys(rewardCodeDefs),pokemonCharmander:themes.find(t=>t.id==='pokemon')?.cards?.some(c=>c.name==='Charmander'),monsterBanshee:themes.find(t=>t.id==='monsters')?.cards?.some(c=>c.name==='Banshee')});
  pfShowWhatsNew=function(){pfClearUpdateBadge();const m=document.getElementById('confirmModal');m.classList.remove('hidden');m.innerHTML=`<div class="modal pf-whats-new pf-whats-new-v33 fade-in"><div class="modal-head"><h3>PackForge v${PF_VERSION}</h3><button class="close-x" id="pfWhatsNewClose">×</button></div><div class="modal-body"><div class="pf-update-kicker">CLEANUP PASS</div><h2>Cleaner Shop, names, Admin, and codes</h2><div class="pf-change-grid"><span>🃏 Card names simplified — Charmander is Charmander; Banshee is Banshee</span><span>📦 Expansion packs now use the same clean Shop presentation as core packs</span><span>❓ Odds/value profile tags removed from Shop cards; exact differences stay in the ? browser</span><span>💵 Foundry moved beside the Coin and restyled as a quiet utility panel</span><span>🛡 Admin reduced to Give Stuff + Codes with direct God/Semi-God pack grants</span><span>🔑 Codes rebuilt around special packs, each God Pack type, rare packs, and simple cash/pack rewards</span><span>💾 Existing local saves remain intact</span></div><button class="grade-action" id="pfWhatsNewDone">Got it</button></div></div>`;const close=()=>{m.classList.add('hidden');m.innerHTML=''};document.getElementById('pfWhatsNewClose').onclick=close;document.getElementById('pfWhatsNewDone').onclick=close};

  /* ==================== PackForge v3.15 — Unique Names + Chase Rarity FX ==================== */
  const PF_V315_NAMES={"medieval":["Squire","Knight","Baron","Duke","Count","Earl","King","Queen","Prince","Princess","Bishop","Abbot","Monk","Friar","Bard","Jester","Herald","Scribe","Steward","Marshal","Seneschal","Bailiff","Reeve","Yeoman","Peasant","Serf","Blacksmith","Armorer","Fletcher","Cooper","Miller","Tanner","Weaver","Mason","Carpenter","Chandler","Alchemist","Apothecary","Falconer","Huntsman","Archer","Crossbowman","Pikeman","Spearman","Halberdier","Swordsman","Cavalier","Paladin","Templar","Mercenary","Guard","Watchman","Sentinel","Champion","Warden","Sheriff","Constable","Castle","Keep","Citadel","Fortress","Tower","Turret","Gatehouse","Barbican","Portcullis","Drawbridge","Moat","Bailey","Courtyard","Dungeon","Chapel","Abbey","Monastery","Cathedral","Village","Hamlet","Manor","Hall","Throne","Crown","Scepter","Chalice","Banner","Standard","Pennant","Shield","Buckler","Helmet","Gauntlet","Greave","Sabaton","Sword","Dagger","Mace","Flail","Hammer","Lance","Spear","Pike","Halberd","Axe","Bow","Crossbow","Quiver","Ballista","Trebuchet","Catapult","Ram","Anvil","Forge","Hearth","Stable","Granary","Mill","Wagon","Cart","Saddle","Bridle","Horseshoe","Scroll","Tome","Relic","Tapestry","Goblet"],"food":["Apple","Banana","Orange","Lemon","Lime","Grapefruit","Tangerine","Clementine","Peach","Plum","Pear","Cherry","Apricot","Nectarine","Mango","Papaya","Guava","Kiwi","Pineapple","Coconut","Watermelon","Cantaloupe","Honeydew","Strawberry","Blueberry","Raspberry","Blackberry","Cranberry","Gooseberry","Currant","Grape","Fig","Date","Raisin","Persimmon","Pomegranate","Avocado","Tomato","Cucumber","Carrot","Potato","Yam","Turnip","Radish","Beet","Parsnip","Celery","Lettuce","Spinach","Kale","Cabbage","Broccoli","Cauliflower","Asparagus","Artichoke","Leek","Onion","Garlic","Shallot","Scallion","Pepper","Chili","Jalapeno","Pumpkin","Squash","Zucchini","Eggplant","Okra","Pea","Bean","Lentil","Chickpea","Corn","Rice","Barley","Oat","Rye","Wheat","Quinoa","Couscous","Noodle","Pasta","Spaghetti","Ravioli","Lasagna","Gnocchi","Ramen","Sushi","Sashimi","Tempura","Dumpling","Wonton","Taco","Burrito","Nacho","Quesadilla","Pizza","Burger","Hotdog","Sandwich","Pretzel","Bagel","Croissant","Biscuit","Muffin","Pancake","Waffle","Donut","Cookie","Brownie","Cupcake","Cake","Pie","Cheesecake","Pudding","Custard","Gelato","Sorbet","Chocolate","Caramel","Toffee","Fudge","Honey","Jam","Bacon"],"ocean":["Shark","Whale","Dolphin","Orca","Marlin","Tuna","Mackerel","Sardine","Anchovy","Herring","Cod","Haddock","Halibut","Flounder","Sole","Salmon","Trout","Barracuda","Swordfish","Sailfish","Tarpon","Mahi","Wahoo","Grouper","Snapper","Bass","Eel","Moray","Ray","Manta","Skate","Seahorse","Pipefish","Angelfish","Clownfish","Tang","Wrasse","Goby","Blenny","Parrotfish","Triggerfish","Lionfish","Stonefish","Pufferfish","Surgeonfish","Butterflyfish","Damselfish","Needlefish","Flyingfish","Remora","Cobia","Sturgeon","Lamprey","Hagfish","Jellyfish","Anemone","Coral","Sponge","Barnacle","Mussel","Oyster","Clam","Scallop","Cockle","Abalone","Conch","Nautilus","Octopus","Squid","Cuttlefish","Kraken","Lobster","Crab","Shrimp","Prawn","Krill","Copepod","Starfish","Urchin","Cucumber","Brittlestar","Sanddollar","Turtle","Manatee","Dugong","Seal","Walrus","Otter","Penguin","Albatross","Pelican","Gull","Tern","Puffin","Frigate","Kelp","Seagrass","Plankton","Reef","Atoll","Lagoon","Trench","Abyss","Shelf","Current","Tide","Wave","Swell","Foam","Spray","Brine","Saltwater","Seamount","Volcano","Vent","Chimney","Wreck","Anchor","Buoy","Harbor","Marina","Pier","Jetty","Lighthouse","Submarine"],"space":["Mercury","Venus","Earth","Mars","Jupiter","Saturn","Uranus","Neptune","Pluto","Ceres","Eris","Haumea","Makemake","Sedna","Orcus","Quaoar","Gonggong","Vesta","Pallas","Hygiea","Moon","Phobos","Deimos","Io","Europa","Ganymede","Callisto","Amalthea","Titan","Rhea","Iapetus","Dione","Tethys","Enceladus","Mimas","Hyperion","Miranda","Ariel","Umbriel","Titania","Oberon","Triton","Nereid","Charon","Styx","Nix","Hydra","Kerberos","Sol","Sirius","Vega","Altair","Rigel","Betelgeuse","Antares","Polaris","Arcturus","Aldebaran","Capella","Procyon","Spica","Deneb","Regulus","Castor","Pollux","Bellatrix","Alnilam","Alnitak","Mintaka","Fomalhaut","Canopus","Achernar","Hadar","Acrux","Mimosa","Shaula","Rasalhague","Andromeda","Triangulum","Whirlpool","Sombrero","Pinwheel","Cartwheel","Centaurus","Messier","Quasar","Pulsar","Magnetar","Supernova","Nova","Nebula","Galaxy","Cosmos","Universe","Comet","Asteroid","Meteor","Meteoroid","Meteorite","Planet","Exoplanet","Moonlet","Satellite","Rocket","Shuttle","Capsule","Lander","Rover","Probe","Voyager","Pioneer","Hubble","Webb","Kepler","Galileo","Cassini","Juno","Curiosity","Perseverance","Opportunity","Spirit","Sojourner","Artemis","Apollo","Gemini"],"monsters":["Banshee","Vampire","Werewolf","Ghoul","Wraith","Specter","Phantom","Revenant","Zombie","Mummy","Lich","Skeleton","Imp","Goblin","Hobgoblin","Orc","Troll","Ogre","Giant","Cyclops","Minotaur","Centaur","Satyr","Harpy","Siren","Gorgon","Hydra","Chimera","Manticore","Griffin","Wyvern","Dragon","Drake","Basilisk","Cockatrice","Kraken","Leviathan","Behemoth","Cerberus","Hellhound","Gargoyle","Golem","Mimic","Slime","Ooze","Blob","Gremlin","Kobold","Bugbear","Gnoll","Yeti","Sasquatch","Wendigo","Chupacabra","Kelpie","Selkie","Nuckelavee","Dullahan","Draugr","Jotunn","Valkyrie","Oni","Kappa","Tengu","Yurei","Yokai","Rakshasa","Djinn","Ifrit","Marid","Ghoulkin","Lamia","Naga","Asura","Garuda","Roc","Thunderbird","Phoenix","Sphinx","Anubite","Jackalwere","Ratman","Mothman","Jerseydevil","Skinwalker","Doppelganger","Changeling","Bogeyman","Nightmare","Incubus","Succubus","Warlock","Witch","Hag","Crone","Demon","Devil","Fiend","Daemon","Horror","Abomination","Mutant","Parasite","Stalker","Reaper","Butcher","Executioner","Warden","Watcher","Creeper","Lurker","Howler","Screamer","Mawclaw","Bonefiend","Bloodling","Rotter","Graveborn","Moonbeast","Shade","Shadowling","Voidling","Fleshling","Thornspawn","Ashspawn"],"dinosaurs":["Tyrannosaurus","Velociraptor","Triceratops","Stegosaurus","Brachiosaurus","Spinosaurus","Allosaurus","Ankylosaurus","Diplodocus","Parasaurolophus","Iguanodon","Carnotaurus","Pachycephalosaurus","Deinonychus","Compsognathus","Apatosaurus","Giganotosaurus","Therizinosaurus","Dilophosaurus","Gallimimus","Utahraptor","Oviraptor","Archaeopteryx","Ceratosaurus","Plateosaurus","Coelophysis","Dryosaurus","Kentrosaurus","Styracosaurus","Maiasaura","Edmontosaurus","Albertosaurus","Suchomimus","Baryonyx","Acrocanthosaurus","Microraptor","Argentinosaurus","Carcharodontosaurus","Torvosaurus","Megalosaurus","Monolophosaurus","Cryolophosaurus","Sinraptor","Yangchuanosaurus","Mapusaurus","Tarbosaurus","Daspletosaurus","Gorgosaurus","Alioramus","Qianzhousaurus","Yutyrannus","Guanlong","Proceratosaurus","Dilong","Eotyrannus","Herrerasaurus","Eoraptor","Staurikosaurus","Saturnalia","Massospondylus","Riojasaurus","Mussaurus","Anchisaurus","Camarasaurus","Saltasaurus","Alamosaurus","Patagotitan","Dreadnoughtus","Amargasaurus","Dicraeosaurus","Supersaurus","Brontosaurus","Barosaurus","Europasaurus","Mamenchisaurus","Shunosaurus","Miragaia","Huayangosaurus","Scelidosaurus","Nodosaurus","Euoplocephalus","Sauropelta","Gastonia","Polacanthus","Minmi","Borealopelta","Zuul","Pinacosaurus","Saichania","Tarchia","Centrosaurus","Chasmosaurus","Pentaceratops","Torosaurus","Protoceratops","Psittacosaurus","Pachyrhinosaurus","Diabloceratops","Nasutoceratops","Einiosaurus","Avaceratops","Kosmoceratops","Lambeosaurus","Corythosaurus","Hypacrosaurus","Gryposaurus","Saurolophus","Tsintaosaurus","Ouranosaurus","Tenontosaurus","Hypsilophodon","Leaellynasaura","Heterodontosaurus","Lesothosaurus","Thescelosaurus","Ornithomimus","Struthiomimus","Deinocheirus","Beipiaosaurus","Caudipteryx","Sinosauropteryx","Mononykus","Austroraptor","Concavenator","Irritator"],"superheroes":["Superman","Batman","Nightwing","Robin","Batgirl","Aquaman","Flash","Cyborg","Shazam","Supergirl","Stargirl","Firestorm","Atom","Hawkman","Hawkgirl","Vixen","Zatanna","Raven","Starfire","Beastboy","Static","Icon","Rocket","Bluebeetle","Steel","Huntress","Katana","Spectre","Swampthing","Plasticman","Metamorpho","Orion","Barda","Midnighter","Apollo","Grifter","Zealot","Spawn","Hellboy","Invincible","AtomEve","Kickass","Hitgirl","Leonardo","Raphael","Donatello","Michelangelo","Daredevil","Elektra","Punisher","Blade","Moonknight","Hawkeye","Vision","Quicksilver","Falcon","WarMachine","Blackwidow","Shehulk","Wasp","Antman","Wolverine","Cyclops","Storm","Rogue","Gambit","Nightcrawler","Colossus","Iceman","Jubilee","Psylocke","Domino","Cable","Deadpool","Magik","Sunspot","Cannonball","Warpath","Wolfsbane","Havok","Polaris","Bishop","Forge","Dazzler","Longshot","Fantomex","Armor","Pixie","Surge","Hellion","Mercury","Dust","Elixir","Rockslide","Anole","Prodigy","Gentle","Tempest","Thor","Hulk","Valkyrie","Sentry","Nova","Quasar","Starlord","Gamora","Drax","Groot","Mantis","Nebula","Moondragon","Firelord","SilverSurfer","Warlock","Hercules","Ares","Echo","Quake","Cloak","Dagger","Tigra","Mockingbird","Songbird","Speedball","Darkhawk"],"villains":["Joker","Thanos","Darkseid","Doom","Magneto","Ultron","Loki","Carnage","Venom","Mysterio","Vulture","Kingpin","Bullseye","Elektra","Redskull","Crossbones","Zemo","Taskmaster","Killmonger","Klaw","Whiplash","Mandarin","Abomination","Leader","Modok","Dormammu","Mephisto","Hela","Surtur","Malekith","Ronan","Korath","Ego","Kang","Apocalypse","Sinister","Sabretooth","Mystique","Juggernaut","Pyro","Toad","Blob","Sauron","Shadowking","OmegaRed","LadyDeathstrike","SilverSamurai","Onslaught","Cassandra","Selene","Nimrod","Bastion","Dracula","Morbius","Blackheart","Annihilus","Galactus","SuperSkrull","Skrull","Talos","YonRogg","HighEvolutionary","Collector","Grandmaster","Beyonder","Hood","Osborn","Hobgoblin","Sandman","Electro","Shocker","Scorpion","Rhino","Lizard","Kraven","Chameleon","Tombstone","Hammerhead","Morlun","Spot","Jackal","HydroMan","MoltenMan","Boomerang","Beetle","Prowler","Riddler","Penguin","Bane","Scarecrow","Deathstroke","Deadshot","Firefly","Clayface","Manbat","Hush","Blackmask","RasAlGhul","Talia","PoisonIvy","Harley","Quinn","KillerCroc","Zsasz","Sinestro","Brainiac","Doomsday","Zod","Parasite","Metallo","Mongul","Desaad","Steppenwolf","Cheetah","Circe","Ares","BlackManta","OceanMaster","Grodd","Zoom","Savitar","Trigon","BrotherBlood","ReverseFlash","Slade"],"pokemon":["Bulbasaur","Ivysaur","Venusaur","Charmander","Charmeleon","Charizard","Squirtle","Wartortle","Blastoise","Caterpie","Metapod","Butterfree","Weedle","Kakuna","Beedrill","Pidgey","Pidgeotto","Pidgeot","Rattata","Raticate","Spearow","Fearow","Ekans","Arbok","Pikachu","Raichu","Sandshrew","Sandslash","Clefairy","Clefable","Vulpix","Ninetales","Jigglypuff","Wigglytuff","Zubat","Golbat","Oddish","Gloom","Vileplume","Paras","Parasect","Venonat","Venomoth","Diglett","Dugtrio","Meowth","Persian","Psyduck","Golduck","Mankey","Primeape","Growlithe","Arcanine","Poliwag","Poliwhirl","Poliwrath","Abra","Kadabra","Alakazam","Machop","Machoke","Machamp","Bellsprout","Weepinbell","Victreebel","Tentacool","Tentacruel","Geodude","Graveler","Golem","Ponyta","Rapidash","Slowpoke","Slowbro","Magnemite","Magneton","Doduo","Dodrio","Seel","Dewgong","Grimer","Muk","Shellder","Cloyster","Gastly","Haunter","Gengar","Drowzee","Hypno","Krabby","Kingler","Voltorb","Electrode","Exeggcute","Exeggutor","Cubone","Marowak","Hitmonlee","Hitmonchan","Lickitung","Koffing","Weezing","Rhyhorn","Rhydon","Chansey","Tangela","Kangaskhan","Horsea","Seadra","Goldeen","Seaking","Staryu","Starmie","Scyther","Jynx","Electabuzz","Magmar","Pinsir","Tauros","Magikarp","Gyarados","Lapras","Ditto","Eevee","Vaporeon"],"mythology":["Zeus","Hera","Poseidon","Demeter","Athena","Apollo","Artemis","Ares","Aphrodite","Hermes","Dionysus","Hades","Persephone","Hestia","Hephaestus","Heracles","Achilles","Odysseus","Theseus","Perseus","Jason","Orpheus","Atalanta","Bellerophon","Medusa","Minotaur","Cerberus","Hydra","Pegasus","Chiron","Prometheus","Atlas","Kronos","Rhea","Helios","Selene","Eos","Nyx","Erebus","Gaia","Uranus","Pan","Eros","Nike","Nemesis","Tyche","Hecate","Morpheus","Thanatos","Hypnos","Odin","Thor","Loki","Freya","Freyr","Tyr","Heimdall","Baldr","Frigg","Idunn","Bragi","Forseti","Skadi","Njord","Vidar","Vali","Sif","Fenrir","Jormungandr","Sleipnir","Mimir","Surtr","Ymir","Ra","Osiris","Isis","Anubis","Horus","Set","Bastet","Sekhmet","Hathor","Thoth","Sobek","Ptah","Nephthys","Khonsu","Amun","Aten","Geb","Nut","Maahes","Amaterasu","Susanoo","Tsukuyomi","Izanagi","Izanami","Raijin","Fujin","Inari","Hachiman","Benzaiten","Bishamon","Kannon","Shiva","Vishnu","Brahma","Indra","Agni","Varuna","Ganesha","Krishna","Rama","Hanuman","Kali","Lakshmi","Saraswati","Durga","Parvati","Quetzalcoatl","Tezcatlipoca","Tlaloc","Huitzilopochtli","Kukulkan","Chaac"]};
  const PF_V315_CHASE_NAMES={"medieval":["Excalibur","Avalon"],"food":["Ambrosia","Nectar"],"ocean":["Leviathan","Atlantis"],"space":["Cosmos","Singularity"],"monsters":["Behemoth","Oblivion"],"dinosaurs":["Tyrannosaurus","Extinction"],"superheroes":["Paragon","Zenith"],"pokemon":["Mewtwo","Arceus"],"villains":["Nemesis","Ruin"],"mythology":["Ragnarok","Olympus"]};

  function pfV315ApplyNames(){
    for(const [themeId,pool] of Object.entries(PF_V315_NAMES)){
      const t=themes.find(x=>x.id===themeId);
      if(!t||!Array.isArray(t.allCards)||t.allCards.length!==125)continue;
      const chase=PF_V315_CHASE_NAMES[themeId]||['Godcard','Ascendant'];
      const reserved=new Set(chase);
      const regular=pool.filter(n=>!reserved.has(n));
      const special=new Set([t.godCard,t.ascendantCard].filter(Boolean));
      const ordinary=t.allCards.filter(c=>!special.has(c));
      ordinary.forEach((c,i)=>{
        c.name=regular[i];
        c.flavor=flavorFor(t.id,c.name);
      });
      if(t.godCard){
        t.godCard.name=chase[0];
        t.godCard.flavor=`${chase[0]} is the God card of the ${t.name} set.`;
      }
      if(t.ascendantCard){
        t.ascendantCard.name=chase[1];
        t.ascendantCard.flavor=`${chase[1]} is the Ascendant card of the ${t.name} set.`;
      }
    }
  }
  pfV315ApplyNames();


  /* v3.14 added Admin God/Ascendant pack buttons after the older rarity-pack engine.
     Handle those two tiers explicitly so those packs actually contain the chase cards. */
  const pfV315PremiumPullsBase=createPremiumPackPulls;
  createPremiumPackPulls=function(def,theme,autoMode=false){
    if(!def?.adminRarity||!['God','Ascendant'].includes(def.adminRarity))return pfV315PremiumPullsBase(def,theme,autoMode);
    const asc=def.adminRarity==='Ascendant',card=asc?theme.ascendantCard:theme.godCard,pulls=[];
    for(let i=0;i<5;i++){
      const copy={uid:uid(),variant:'Normal',mutation:null,serial:null,grade:null,locked:false,obtainedAt:Date.now(),source:`Admin ${def.adminRarity} Pack`,openingPenalty:0,openingQuality:'Clean'};
      pulls.push({card,copy,newDiscovery:!state.discovered[card.id],added:false});
    }
    if(asc)state.quirkStats.ascendantCards=(state.quirkStats.ascendantCards||0)+5;
    else state.quirkStats.godRarityCards=(state.quirkStats.godRarityCards||0)+5;
    return pulls;
  };

  /* Treat the new tiers as protected chase cards anywhere bulk selling is concerned. */
  const pfV315HighValueSellBase=pfHighValueSell;
  pfHighValueSell=function(card){return !!(card?.godRarity||card?.ascendantRarity)||pfV315HighValueSellBase(card)};

  /* Extra embedded FX nodes. Pure CSS/DOM: zero network requests. */
  const pfV315CardHTMLBase=cardHTML;
  cardHTML=function(card,count=0,copy=null,level=1,opts={}){
    let html=pfV315CardHTMLBase(card,count,copy,level,opts);
    const sparks=Array.from({length:12},(_,i)=>`<i style="--i:${i}"></i>`).join('');
    if(card?.godRarity){
      const rich=`<div class="pf-god-cosmos pf-v315-godfx">${sparks}</div><div class="pf-v315-god-sigil">☀</div>`;
      if(html.includes('<div class="pf-god-cosmos"></div>'))html=html.replace('<div class="pf-god-cosmos"></div>',rich);
      else html=html.replace('<div class="mutation-vfx"></div>',rich+'<div class="mutation-vfx"></div>');
    }
    if(card?.ascendantRarity){
      const rich=`<div class="pf-asc-cosmos pf-v315-ascfx">${sparks}</div><div class="pf-v315-asc-ring r1"></div><div class="pf-v315-asc-ring r2"></div><div class="pf-v315-asc-sigil">✦</div>`;
      if(html.includes('<div class="pf-asc-cosmos"></div>'))html=html.replace('<div class="pf-asc-cosmos"></div>',rich);
      else html=html.replace('<div class="mutation-vfx"></div>',rich+'<div class="mutation-vfx"></div>');
    }
    return html
  };

  const pfV315PreHintBase=pullPreRevealHint;
  pullPreRevealHint=function(p,isFinal=false){
    if(p?.card?.ascendantRarity)return'The card is breaking through the wrapper…';
    if(p?.card?.godRarity)return'Gold light is leaking through the card…';
    return pfV315PreHintBase(p,isFinal)
  };
  const pfV315PostHintBase=pullPostRevealHint;
  pullPostRevealHint=function(p,isFinal=false){
    if(p?.card?.ascendantRarity)return`ASCENDANT · ${p.card.name}${isFinal?' · click the card to continue':''}`;
    if(p?.card?.godRarity)return`GOD · ${p.card.name}${isFinal?' · click the card to continue':''}`;
    return pfV315PostHintBase(p,isFinal)
  };

  function pfV315RarityCinematic(p,host){
    if(!p?.card?.godRarity&&!p?.card?.ascendantRarity)return;
    host.querySelectorAll('.pf-rarity-cinematic,.pf-v315-cinematic').forEach(n=>n.remove());
    const asc=!!p.card.ascendantRarity,fx=document.createElement('div');
    fx.className=`pf-v315-cinematic ${asc?'ascendant':'god'}`;
    const particles=Array.from({length:18},(_,i)=>`<i class="p" style="--i:${i}"></i>`).join('');
    fx.innerHTML=`<div class="pf-v315-cine-flash"></div><div class="pf-v315-cine-vortex"></div><div class="pf-v315-cine-ring a"></div><div class="pf-v315-cine-ring b"></div>${particles}<div class="pf-v315-cine-copy"><small>${asc?'IMPOSSIBLE PULL':'GOD PULL'}</small><b>${asc?'ASCENDANT':'GOD'}</b><strong>${p.card.name}</strong><span>${asc?'1 IN 20,000,000':'1 IN 2,000,000'} CARD ROLLS</span></div>`;
    host.appendChild(fx);
    try{
      tone(asc?72:104,.48,'sine',.025);
      setTimeout(()=>tone(asc?520:420,.34,'triangle',.024),180);
      setTimeout(()=>tone(asc?900:680,.34,'sine',.021),420);
      setTimeout(()=>tone(asc?1320:980,.28,'triangle',.018),700);
    }catch(e){}
    setTimeout(()=>fx.remove(),asc?3150:2350)
  }
  const pfV315TriggerPullFxBase=triggerPullRevealFx;
  triggerPullRevealFx=function(p,ov,stageFx,burstLabel){
    pfV315TriggerPullFxBase(p,ov,stageFx,burstLabel);
    if(!ov.classList.contains('auto-opening')&&(p?.card?.godRarity||p?.card?.ascendantRarity))pfV315RarityCinematic(p,ov)
  };

  window.__pfV315Health=()=>{
    const ids=Object.keys(PF_V315_NAMES),checks={};
    for(const id of ids){
      const t=themes.find(x=>x.id===id),names=t?.allCards?.map(c=>c.name)||[];
      checks[id]={
        count:names.length,
        unique:new Set(names).size,
        oneWord:names.every(n=>typeof n==='string'&&!/\s|\d/.test(n)),
        god:t?.godCard?.name||null,
        ascendant:t?.ascendantCard?.name||null
      };
    }
    return {version:PF_VERSION,checks,allGood:Object.values(checks).every(x=>x.count===125&&x.unique===125&&x.oneWord),godFx:true,ascendantFx:true};
  };

  pfShowWhatsNew=function(){
    pfClearUpdateBadge();
    const m=document.getElementById('confirmModal');m.classList.remove('hidden');
    m.innerHTML=`<div class="modal pf-whats-new pf-whats-new-v33 fade-in"><div class="modal-head"><h3>PackForge v${PF_VERSION}</h3><button class="close-x" id="pfWhatsNewClose">×</button></div><div class="modal-body"><div class="pf-update-kicker">CARD NAME + CHASE FX REBUILD</div><h2>125 real names. No filler.</h2><div class="pf-change-grid"><span>🃏 All 10 permanent packs now have 125 unique one-word card names</span><span>🚫 No numbered filler names and no generated adjective-pile names</span><span>☀ God cards now have animated solar borders, sparks, a sigil, and a full pull cinematic</span><span>✦ Ascendant cards now have animated dimensional rings, aurora motion, particles, and a longer pull cinematic</span><span>💾 Existing card IDs and local saves are preserved</span><span>⚡ Effects are CSS-only and add zero Vercel requests</span></div><button class="grade-action" id="pfWhatsNewDone">Got it</button></div></div>`;
    const close=()=>{m.classList.add('hidden');m.innerHTML=''};
    document.getElementById('pfWhatsNewClose').onclick=close;document.getElementById('pfWhatsNewDone').onclick=close
  };


  /* ==================== PackForge v3.16 — Admin Lab + Black Hole Ascendant ==================== */

  state.pfAdminLab=state.pfAdminLab||{};
  state.pfAdminLab.casino={
    coinWinPct:50,coinPayout:1,
    minesLuck:0,minesPayout:1,
    plinkoForcePct:0,plinkoTarget:'1000',plinkoPayout:1,
    slotsForcePct:0,slotsTarget:'seven',slotsPayout:1,
    blackjackNaturalPct:0,blackjackPayout:1,
    rouletteForcePct:0,rouletteNumber:7,roulettePayout:1,
    luckyReturnPct:-1,
    ...(state.pfAdminLab.casino||{})
  };
  const pf316Clamp=(v,min,max,fb=min)=>{v=Number(v);return Number.isFinite(v)?Math.max(min,Math.min(max,v)):fb};
  const pf316ThemeById=id=>themes.find(t=>t.id===id)||basePackThemes().find(t=>t.id===id)||basePackThemes()[0];
  const PF316_PACK_PROFILES=[
    {id:'normal',name:'Normal',kind:'normal',desc:'Standard pack rules.'},
    {id:'luckypulse',name:'Lucky Pulse',kind:'mutation',mutation:'luckypulse',desc:'Lucky Pulse mutation.'},
    {id:'holosurge',name:'Holo Surge',kind:'mutation',mutation:'holosurge',desc:'Holo Surge mutation.'},
    {id:'voidbloom',name:'Void Bloom',kind:'mutation',mutation:'voidbloom',desc:'Void Bloom mutation.'},
    {id:'prismrift',name:'Prism Rift',kind:'mutation',mutation:'prismrift',desc:'Prism Rift mutation.'},
    {id:'rare_rush',name:'Rare Rush',kind:'mode',mode:'semi_rare',desc:'Every card Rare or better.'},
    {id:'epic_god',name:'Epic+ God',kind:'mode',mode:'rarity',desc:'Epic+ God Pack rules.'},
    {id:'secret_god',name:'Secret God',kind:'mode',mode:'secret',desc:'Five Secret-tier cards.'},
    {id:'god',name:'God Rarity',kind:'rarity',rarity:'God',desc:'Five true God cards.'},
    {id:'ascendant',name:'Ascendant',kind:'rarity',rarity:'Ascendant',desc:'Five true Ascendant cards.'}
  ];
  const PF316_ADMIN_PACK_IDS=[];
  for(const t of basePackThemes()){
    for(const p of PF316_PACK_PROFILES){
      const id=`adminlab_${t.id}_${p.id}`;PF316_ADMIN_PACK_IDS.push(id);
      if(!premiumPackDefs[id])premiumPackDefs[id]={
        id,adminOnly:true,adminLabProfile:p.id,adminThemeId:t.id,
        name:`${t.name} ${p.name} Pack`,emoji:t.emoji,cost:0,sell:0,
        gradient:t.gradient,glow:'rgba(130,210,255,.12)',
        desc:`Admin test pack for ${t.name}.`,effect:p.desc
      };
      state.premiumPackInventory[id]=Math.max(0,Number(state.premiumPackInventory[id]||0));
    }
  }

  const pfV316PremiumPullBase=createPremiumPackPulls;
  createPremiumPackPulls=function(def,theme,autoMode=false){
    if(!def?.adminLabProfile)return pfV316PremiumPullBase(def,theme,autoMode);
    const t=pf316ThemeById(def.adminThemeId),p=PF316_PACK_PROFILES.find(x=>x.id===def.adminLabProfile)||PF316_PACK_PROFILES[0];
    if(p.kind==='normal')return createPackPulls(t,null,autoMode);
    if(p.kind==='mutation')return createPackPulls(t,packMutations[p.mutation]||null,autoMode);
    if(p.kind==='mode'){
      state.godPackQueue=state.godPackQueue||[];
      state.godPackQueue.unshift(p.mode);
      return createPackPulls(t,null,autoMode);
    }
    if(p.kind==='rarity'){
      const c=p.rarity==='Ascendant'?t.ascendantCard:t.godCard,pulls=[];
      for(let i=0;i<5;i++){
        const copy={uid:uid(),variant:'Normal',mutation:null,serial:null,grade:null,locked:false,obtainedAt:Date.now(),source:`Admin ${t.name} ${p.rarity} Pack`,openingPenalty:0,openingQuality:'Clean'};
        pulls.push({card:c,copy,newDiscovery:!state.discovered[c.id],added:false});
      }
      if(p.rarity==='Ascendant')state.quirkStats.ascendantCards=(state.quirkStats.ascendantCards||0)+5;
      else state.quirkStats.godRarityCards=(state.quirkStats.godRarityCards||0)+5;
      return pulls;
    }
    return createPackPulls(t,null,autoMode)
  };

  function pf316GrantAdminPack(themeId,profileId,count=1){
    const id=`adminlab_${themeId}_${profileId}`,n=pf316Clamp(Math.floor(count),1,10000,1);
    if(!premiumPackDefs[id])return false;
    state.premiumPackInventory[id]=(state.premiumPackInventory[id]||0)+n;markSaveDirty();return true
  }
  function pf316GrantMutationSet(themeId,count=1){
    const t=pf316ThemeById(themeId),n=pf316Clamp(Math.floor(count),1,1000,1);
    for(const m of Object.values(packMutations))for(let i=0;i<n;i++)state.specialPackInventory.push({uid:uid(),themeId:t.id,mutation:m.id,source:'Admin Lab'});
    markSaveDirty()
  }
  function pf316GrantAllPublicPremium(count=1){
    const n=pf316Clamp(Math.floor(count),1,1000,1);
    for(const d of Object.values(premiumPackDefs).filter(x=>!x.adminOnly))grantPremiumPack(d.id,n)
  }
  function pf316GrantCard(themeId,cardId,count=1,variant='Normal',grade=0,black=false){
    const t=pf316ThemeById(themeId),card=cardMap[cardId]||t?.allCards?.[0];if(!card)return 0;
    const n=pf316Clamp(Math.floor(count),1,1000,1);grade=pf316Clamp(grade,0,10,0);
    for(let i=0;i<n;i++){
      const copy={uid:uid(),variant,mutation:null,serial:variant==='Serialized'?makeSerial(card.id):null,grade:grade||null,locked:false,obtainedAt:Date.now(),source:'Admin Card Lab',openingPenalty:0,openingQuality:'Clean'};
      if(grade){copy.gradedAt=Date.now();copy.gradeNote='Admin-issued test grade';copy.blackLabel=!!black&&grade>=10}
      addPull({card,copy,newDiscovery:!state.discovered[card.id],added:false},t);
    }
    markSaveDirty();return n
  }

  /* 100 positive player reward codes. No penalties, potions, or upgrade-level rewards. */
  const PF316_CODE_KEYS=[];
  function pf316Code(code,label,apply){rewardCodeDefs[code]={label,apply,rewardId:`PF316-${code}`};PF316_CODE_KEYS.push(code)}
  for(const t of basePackThemes())pf316Code(`PF16-${t.id.toUpperCase()}-5`,`5 ${t.name} packs`,()=>{state.packInventory[t.id]=(state.packInventory[t.id]||0)+5;markSaveDirty()});
  for(const t of basePackThemes())pf316Code(`PF16-${t.id.toUpperCase()}-25`,`25 ${t.name} packs`,()=>{state.packInventory[t.id]=(state.packInventory[t.id]||0)+25;markSaveDirty()});
  for(const t of basePackThemes())pf316Code(`PF16-${t.id.toUpperCase()}-SPECIAL`,`1 of every ${t.name} mutation pack + 5 normal packs`,()=>{pf316GrantMutationSet(t.id,1);state.packInventory[t.id]=(state.packInventory[t.id]||0)+5;markSaveDirty()});
  for(const t of basePackThemes())pf316Code(`PF16-${t.id.toUpperCase()}-GOD`,`1 ${t.name} God Rarity Pack`,()=>pf316GrantAdminPack(t.id,'god',1));
  for(const t of basePackThemes())pf316Code(`PF16-${t.id.toUpperCase()}-ASC`,`1 ${t.name} Ascendant Pack`,()=>pf316GrantAdminPack(t.id,'ascendant',1));
  [5000,10000,15000,25000,40000,60000,80000,100000,150000,250000].forEach((amt,i)=>pf316Code(`PF16-CASH-${String(i+1).padStart(2,'0')}`,`${fmt(amt)} cash`,()=>earn(amt)));
  for(let i=1;i<=10;i++)pf316Code(`PF16-VAULT-${String(i).padStart(2,'0')}`,`${i} of every permanent pack`,()=>grantCorePacks(i));
  for(let i=1;i<=10;i++)pf316Code(`PF16-SPECIAL-${String(i).padStart(2,'0')}`,`${i} of every public specialty pack + ${i} mutation bundle${i===1?'':'s'}`,()=>{pf316GrantAllPublicPremium(i);for(const t of basePackThemes().slice(0,Math.min(i,10)))pf316GrantMutationSet(t.id,1)});
  const pf316Modes=['semi_rare','semi_holo','semi_finish','rarity','variant','holo','secret','archive'];
  pf316Modes.forEach((mode,i)=>pf316Code(`PF16-GODMODE-${String(i+1).padStart(2,'0')}`,`1 ${PF_PACK_MODE_DEFS[mode]?.name||mode}`,()=>pfV314GiveGodMode(mode,1)));
  pf316Code('PF16-GODMODE-09','1 random-set God Rarity Pack',()=>grantPremiumPack('admin_rarity_god',1));
  pf316Code('PF16-GODMODE-10','1 random-set Ascendant Pack',()=>grantPremiumPack('admin_rarity_ascendant',1));
  basePackThemes().forEach((t,i)=>pf316Code(`PF16-MEGA-${String(i+1).padStart(2,'0')}`,`${fmt(25000*(i+1))} + ${i+1} of every permanent pack + ${t.name} God + Ascendant packs`,()=>{earn(25000*(i+1));grantCorePacks(i+1);pf316GrantAdminPack(t.id,'god',1);pf316GrantAdminPack(t.id,'ascendant',1)}));

  /* Gambling laboratory. The six modern casino games live in their own closure, so their
     Admin Lab hooks are installed inside that closure below. Lucky Return is outer-scope. */
  const pfV316LossReturnBase=lossReturnChance;
  lossReturnChance=function(){const v=Number(state.pfAdminLab?.casino?.luckyReturnPct);return v>=0?pf316Clamp(v,0,100,0)/100:pfV316LossReturnBase()};

  function pf316CasinoPreset(name){
    const c=state.pfAdminLab.casino;
    if(name==='normal')Object.assign(c,{coinWinPct:50,coinPayout:1,minesLuck:0,minesPayout:1,plinkoForcePct:0,plinkoPayout:1,slotsForcePct:0,slotsPayout:1,blackjackNaturalPct:0,blackjackPayout:1,rouletteForcePct:0,roulettePayout:1,luckyReturnPct:-1});
    if(name==='friendly')Object.assign(c,{coinWinPct:68,coinPayout:1.15,minesLuck:45,minesPayout:1.15,plinkoForcePct:12,plinkoTarget:'26',plinkoPayout:1.15,slotsForcePct:10,slotsTarget:'seven',slotsPayout:1.12,blackjackNaturalPct:12,blackjackPayout:1.15,rouletteForcePct:0,roulettePayout:1.15,luckyReturnPct:15});
    if(name==='jackpot')Object.assign(c,{coinWinPct:100,coinPayout:4,minesLuck:100,minesPayout:5,plinkoForcePct:100,plinkoTarget:'1000',plinkoPayout:2,slotsForcePct:100,slotsTarget:'wild',slotsPayout:3,blackjackNaturalPct:100,blackjackPayout:3,rouletteForcePct:100,rouletteNumber:7,roulettePayout:5,luckyReturnPct:100});
    if(name==='brutal')Object.assign(c,{coinWinPct:10,coinPayout:.5,minesLuck:-60,minesPayout:.5,plinkoForcePct:0,plinkoPayout:.5,slotsForcePct:0,slotsPayout:.5,blackjackNaturalPct:0,blackjackPayout:.5,rouletteForcePct:0,roulettePayout:.5,luckyReturnPct:0});
    markSaveDirty();save(true)
  }

  /* Admin Lab rendering. Six pages, searchable instead of dozens of tiny tabs. */
  pfBuildAdminV35=function(){
    const board=document.getElementById('pfAdminBoard');if(!board)return;
    document.getElementById('pfAdminV314Shell')?.remove();document.getElementById('pfAdminV35Shell')?.remove();
    [...board.children].forEach(ch=>{if(ch.id!=='pfAdminV316Shell')ch.classList.add('pf316-legacy-hide')});
    let shell=document.getElementById('pfAdminV316Shell');if(shell)return;
    shell=document.createElement('div');shell.id='pfAdminV316Shell';shell.dataset.tab='overview';
    shell.innerHTML=`<header class="pf316-admin-head"><div><small>OWNER / DEV CONSOLE</small><h2>PackForge Admin Lab</h2><p>Everything here writes only to this local save.</p></div><div class="pf316-admin-summary"><span class="pf316-admin-chip">100 PACK PRESETS</span><span class="pf316-admin-chip">LOCAL DEV TOOLS</span><span class="pf316-admin-chip">CASINO RNG LAB</span></div></header><nav class="pf316-tabs">${[['overview','Overview'],['packs','100 Packs'],['cards','Card Lab'],['casino','Casino Lab'],['system','System']].map(([id,n])=>`<button data-pf316tab="${id}" class="${id==='overview'?'active':''}">${n}</button>`).join('')}</nav><div id="pfAdminV316Body"></div>`;
    board.prepend(shell);shell.querySelectorAll('[data-pf316tab]').forEach(b=>b.onclick=()=>{shell.dataset.tab=b.dataset.pf316tab;shell.querySelectorAll('[data-pf316tab]').forEach(x=>x.classList.toggle('active',x===b));pfRenderAdminV35()})
  };
  function pf316After(msg='Updated'){
    markSaveDirty();save(true);renderAll();try{pfRenderFoundry()}catch(e){};toast('Admin Lab',msg);pfRenderAdminV35()
  }
  function pf316Value(id,fb=0){const el=document.getElementById(id),n=Number(el?.value);return Number.isFinite(n)?n:fb}
  function pf316RenderOverview(body){
    const publicPrem=Object.values(premiumPackDefs).filter(x=>!x.adminOnly);
    body.innerHTML=`<div class="pf316-grid">
      <section class="pf316-card"><h3>Cash Console</h3><p>Type an exact amount. Add, subtract, or replace the current balance.</p><div class="pf316-inputs"><label class="pf316-field"><span>Amount</span><input id="pf316CashAmount" type="number" min="0" value="1000000"></label><div class="pf316-actions" style="grid-column:span 2;align-items:end"><button id="pf316CashAdd">Add</button><button id="pf316CashSet">Set</button><button id="pf316CashSub">Subtract</button></div></div><div class="pf316-actions" style="margin-top:8px"><button data-pf316cash="10000">+$10K</button><button data-pf316cash="1000000">+$1M</button><button data-pf316cash="100000000">+$100M</button><button data-pf316cash="1000000000">+$1B</button></div></section>
      <section class="pf316-card"><h3>Pack Vault</h3><p>Quick grants before using the 100-pack matrix.</p><div class="pf316-actions"><button id="pf316Every1">+1 Every Permanent</button><button id="pf316Every10">+10 Every Permanent</button><button id="pf316Premium1">+1 Every Specialty</button><button id="pf316MutationAll">+1 Every Mutation / Set</button></div></section>
      <section class="pf316-card wide"><h3>God / Semi-God / Chase Packs</h3><p>Direct testing access. These do not change global player odds.</p><div class="pf316-actions">${Object.entries(PF_PACK_MODE_DEFS).map(([id,d])=>`<button data-pf316mode="${id}" class="${d.tier==='god'?'pf316-btn warn':'pf316-btn'}">+1 ${d.name}</button>`).join('')}<button data-pf316premium="admin_rarity_god" class="pf316-btn warn">+1 God Rarity Pack</button><button data-pf316premium="admin_rarity_ascendant" class="pf316-btn asc">+1 Ascendant Pack</button><button data-pf316premium="admin_rarity_ghost">+1 Ghost Pack</button><button data-pf316premium="admin_rarity_crue_lowe">+1 Crue Lowe Pack</button></div></section>
      <section class="pf316-card"><h3>Foundry / Progress</h3><p>Set passive-income production and finish current timers.</p><div class="pf316-inputs"><label class="pf316-field"><span>Foundry Level</span><input id="pf316FoundryLevel" type="number" min="1" max="100000" value="${state.foundry?.level||1}"></label><label class="pf316-field"><span>Overdrive Points</span><input id="pf316OD" type="number" min="0" max="100" value="${state.overdrive?.points||0}"></label><div class="pf316-actions"><button id="pf316ProgressSet">Apply</button></div></div><div class="pf316-actions" style="margin-top:8px"><button id="pf316FinishGrade">Finish Grading</button><button id="pf316FinishCampaign">Finish Campaigns</button></div></section>
      <section class="pf316-card"><h3>Current Save</h3><p>${fmt(state.cash)} cash · ${totalCardCount().toLocaleString()} cards · ${pfAdminPackCount().toLocaleString()} packs.</p><div class="pf316-actions"><button id="pf316SaveNow">Save Now</button><button id="pf316LockAdmin">Lock Admin</button></div></section>
    </div>`;
    body.querySelectorAll('[data-pf316cash]').forEach(b=>b.onclick=()=>{earn(Number(b.dataset.pf316cash)||0);pf316After(`Added ${fmt(Number(b.dataset.pf316cash)||0)}.`)});
    document.getElementById('pf316CashAdd').onclick=()=>{const a=Math.max(0,pf316Value('pf316CashAmount'));earn(a);pf316After(`Added ${fmt(a)}.`)};
    document.getElementById('pf316CashSet').onclick=()=>{state.cash=Math.max(0,pf316Value('pf316CashAmount'));pf316After(`Cash set to ${fmt(state.cash)}.`)};
    document.getElementById('pf316CashSub').onclick=()=>{const a=Math.max(0,pf316Value('pf316CashAmount'));state.cash=Math.max(0,state.cash-a);pf316After(`Subtracted ${fmt(a)}.`)};
    document.getElementById('pf316Every1').onclick=()=>{grantCorePacks(1);pf316After('Granted 1 of every permanent pack.')};
    document.getElementById('pf316Every10').onclick=()=>{grantCorePacks(10);pf316After('Granted 10 of every permanent pack.')};
    document.getElementById('pf316Premium1').onclick=()=>{pf316GrantAllPublicPremium(1);pf316After('Granted every public specialty pack.')};
    document.getElementById('pf316MutationAll').onclick=()=>{for(const t of basePackThemes())pf316GrantMutationSet(t.id,1);pf316After('Granted every mutation for every set.')};
    body.querySelectorAll('[data-pf316mode]').forEach(b=>b.onclick=()=>{pfV314GiveGodMode(b.dataset.pf316mode,1);pf316After(`Granted ${PF_PACK_MODE_DEFS[b.dataset.pf316mode]?.name||'pack'}.`)});
    body.querySelectorAll('[data-pf316premium]').forEach(b=>b.onclick=()=>{grantPremiumPack(b.dataset.pf316premium,1);pf316After(`Granted ${premiumPackDefs[b.dataset.pf316premium]?.name||'pack'}.`)});
    document.getElementById('pf316ProgressSet').onclick=()=>{state.foundry=state.foundry||{};state.foundry.level=Math.max(1,Math.floor(pf316Value('pf316FoundryLevel',1)));state.overdrive.points=pf316Clamp(pf316Value('pf316OD',0),0,100,0);pf316After('Foundry and Overdrive updated.')};
    document.getElementById('pf316FinishGrade').onclick=()=>{for(const it of Object.values(state.inventory||{}))for(const ld of Object.values(it?.levels||{}))for(const cp of ld?.copies||[])if(cp.gradingUntil)cp.gradingUntil=Date.now()-1;pf316After('All grading timers completed.')};
    document.getElementById('pf316FinishCampaign').onclick=()=>{for(const k of ['active','active2'])if(state.campaigns?.[k])state.campaigns[k].endsAt=Date.now()-1;pf316After('All active campaigns completed.')};
    document.getElementById('pf316SaveNow').onclick=()=>{save(true);toast('Admin Lab','Save written.')};
    document.getElementById('pf316LockAdmin').onclick=()=>{$('#pfAdminLock')?.click()}
  }
  function pf316RenderPacks(body){
    body.innerHTML=`<section class="pf316-card"><h3>100 Pack Presets</h3><p>10 permanent sets × 10 pack profiles. Quantity applies to whichever preset you click.</p><div class="pf316-pack-toolbar"><input id="pf316PackSearch" class="pf316-search" placeholder="Search theme or pack type…"><input id="pf316PackQty" class="pf316-search" type="number" min="1" max="10000" value="1" title="Quantity"></div><div id="pf316PackMatrix" class="pf316-pack-matrix">${basePackThemes().flatMap(t=>PF316_PACK_PROFILES.map(p=>`<button class="pf316-pack-option" data-theme="${t.id}" data-profile="${p.id}"><b>${t.emoji} ${t.name}</b><span>${p.name}</span><small>${p.desc}</small></button>`)).join('')}</div><div class="pf316-status" id="pf316PackStatus">100 options loaded.</div></section>`;
    const matrix=document.getElementById('pf316PackMatrix'),search=document.getElementById('pf316PackSearch');
    search.oninput=()=>{const q=search.value.trim().toLowerCase();matrix.querySelectorAll('.pf316-pack-option').forEach(b=>b.classList.toggle('hidden',q&&!b.textContent.toLowerCase().includes(q)))};
    matrix.querySelectorAll('.pf316-pack-option').forEach(b=>b.onclick=()=>{const q=pf316Clamp(Math.floor(pf316Value('pf316PackQty',1)),1,10000,1);pf316GrantAdminPack(b.dataset.theme,b.dataset.profile,q);save(true);renderPacks();document.getElementById('pf316PackStatus').textContent=`Granted ${q} × ${premiumPackDefs[`adminlab_${b.dataset.theme}_${b.dataset.profile}`].name}.`;toast('Admin Pack Grant',`+${q} pack${q===1?'':'s'}.`)})
  }
  function pf316RenderCards(body){
    const ts=basePackThemes(),t=ts[0],variants=['Normal',...Object.keys(variantDefs).filter(x=>x!=='Normal')];
    body.innerHTML=`<div class="pf316-grid"><section class="pf316-card wide"><h3>Exact Card Generator</h3><p>Choose the exact card, variant, grade, and number of copies.</p><div class="pf316-cardlab"><label class="pf316-field"><span>Set</span><select id="pf316CardTheme">${ts.map(x=>`<option value="${x.id}">${x.emoji} ${x.name}</option>`).join('')}</select></label><label class="pf316-field span2"><span>Card</span><select id="pf316CardId"></select></label><label class="pf316-field"><span>Variant</span><select id="pf316CardVariant">${variants.map(v=>`<option>${v}</option>`).join('')}</select></label><label class="pf316-field"><span>Grade</span><select id="pf316CardGrade"><option value="0">Raw</option>${[7,7.5,8,8.5,9,9.5,10].map(g=>`<option value="${g}">${g.toFixed(1)}</option>`).join('')}</select></label><label class="pf316-field"><span>Copies</span><input id="pf316CardQty" type="number" min="1" max="1000" value="1"></label></div><div class="pf316-actions" style="margin-top:9px"><button id="pf316GiveCard" class="pf316-btn good">Give Exact Card</button><button id="pf316GiveBlack">Give PSA 10 Black Label</button></div></section>
      <section class="pf316-card wide"><h3>Chase Cards by Set</h3><p>One-click God and Ascendant testing without opening a pack.</p><div class="pf316-actions">${ts.map(x=>`<button data-direct-god="${x.id}">${x.emoji} ${x.name} God</button><button data-direct-asc="${x.id}" class="pf316-btn asc">${x.emoji} ${x.name} Ascendant</button>`).join('')}</div></section></div>`;
    const themeSel=document.getElementById('pf316CardTheme'),cardSel=document.getElementById('pf316CardId');
    const fill=()=>{const th=pf316ThemeById(themeSel.value);cardSel.innerHTML=(th.allCards||[]).map(c=>`<option value="${c.id}">${c.name} · ${c.ascendantRarity?'Ascendant':c.godRarity?'God':c.rarity}</option>`).join('')};themeSel.onchange=fill;fill();
    document.getElementById('pf316GiveCard').onclick=()=>{const n=pf316GrantCard(themeSel.value,cardSel.value,pf316Value('pf316CardQty',1),document.getElementById('pf316CardVariant').value,pf316Value('pf316CardGrade',0),false);pf316After(`Granted ${n} exact card${n===1?'':'s'}.`)};
    document.getElementById('pf316GiveBlack').onclick=()=>{const n=pf316GrantCard(themeSel.value,cardSel.value,pf316Value('pf316CardQty',1),document.getElementById('pf316CardVariant').value,10,true);pf316After(`Granted ${n} Black Label card${n===1?'':'s'}.`)};
    body.querySelectorAll('[data-direct-god]').forEach(b=>b.onclick=()=>{const th=pf316ThemeById(b.dataset.directGod);pf316GrantCard(th.id,th.godCard.id,1,'Normal',0,false);pf316After(`Granted ${th.name} God card.`)});
    body.querySelectorAll('[data-direct-asc]').forEach(b=>b.onclick=()=>{const th=pf316ThemeById(b.dataset.directAsc);pf316GrantCard(th.id,th.ascendantCard.id,1,'Normal',0,false);pf316After(`Granted ${th.name} Ascendant card.`)})
  }
  function pf316RenderCasino(body){
    const c=state.pfAdminLab.casino;
    const row=(label,desc,id,val,min,max,step=1)=>`<label class="pf316-odds-row"><span><b>${label}</b><small>${desc}</small></span><input id="${id}" type="number" min="${min}" max="${max}" step="${step}" value="${val}"></label>`;
    body.innerHTML=`<div class="pf316-grid"><section class="pf316-card wide"><h3>Casino RNG Presets</h3><p>These settings are local dev overrides and save with this browser.</p><div class="pf316-actions"><button data-cpreset="normal">Normal Game</button><button data-cpreset="friendly" class="pf316-btn good">Player Friendly</button><button data-cpreset="jackpot" class="pf316-btn warn">Jackpot Test</button><button data-cpreset="brutal" class="pf316-btn danger">Brutal</button></div></section>
      <section class="pf316-card wide"><h3>Per-Game Odds & Payouts</h3><div class="pf316-odds-grid">
      ${row('Coin win chance','Chance the result matches the side the player picked.','pf316CoinWin',c.coinWinPct,0,100)}
      ${row('Coin payout multiplier','Multiplies the normal 2× return.','pf316CoinPay',c.coinPayout,.01,100,.01)}
      ${row('Mines luck','+100 rescues every mine hit; -100 turns every safe click into a mine when possible.','pf316MinesLuck',c.minesLuck,-100,100)}
      ${row('Mines payout multiplier','Scales the displayed and paid cash-out multiplier.','pf316MinesPay',c.minesPayout,.01,100,.01)}
      ${row('Plinko forced-hit chance','Chance to send the ball to the selected multiplier bin.','pf316PlinkoForce',c.plinkoForcePct,0,100)}
      <label class="pf316-odds-row"><span><b>Plinko forced target</b><small>Exact bin target used by the forced-hit chance.</small></span><select id="pf316PlinkoTarget">${[1000,130,26,7.2,4,2,.409,.2].map(v=>`<option value="${v}" ${String(c.plinkoTarget)===String(v)?'selected':''}>${v}×</option>`).join('')}</select></label>
      ${row('Plinko payout multiplier','Scales final Plinko payout.','pf316PlinkoPay',c.plinkoPayout,.01,100,.01)}
      ${row('Slots forced-result chance','Chance to build the selected test result.','pf316SlotsForce',c.slotsForcePct,0,100)}
      <label class="pf316-odds-row"><span><b>Slots forced result</b><small>Seven / Wild fills the middle payline; Scatter forces five scatters.</small></span><select id="pf316SlotsTarget">${['seven','wild','scatter'].map(v=>`<option value="${v}" ${c.slotsTarget===v?'selected':''}>${v.toUpperCase()}</option>`).join('')}</select></label>
      ${row('Slots payout multiplier','Scales evaluated slot payout.','pf316SlotsPay',c.slotsPayout,.01,100,.01)}
      ${row('Blackjack natural chance','Chance the initial player hand is forced to A + K.','pf316BJNatural',c.blackjackNaturalPct,0,100)}
      ${row('Blackjack win payout multiplier','Scales profit above the returned stake.','pf316BJPay',c.blackjackPayout,.01,100,.01)}
      ${row('Roulette forced-number chance','Chance the wheel lands on the chosen number.','pf316RouletteForce',c.rouletteForcePct,0,100)}
      ${row('Roulette forced number','0 through 36.','pf316RouletteNumber',c.rouletteNumber,0,36)}
      ${row('Roulette payout multiplier','Scales winning roulette returns.','pf316RoulettePay',c.roulettePayout,.01,100,.01)}
      ${row('Lucky Return chance','-1 uses the normal game value; 0–100 directly overrides it.','pf316LuckyReturn',c.luckyReturnPct,-1,100)}
      </div><div class="pf316-actions" style="margin-top:10px"><button id="pf316CasinoApply" class="pf316-btn good">Apply Casino Settings</button><button id="pf316CasinoResetStats">Reset Casino Stats</button></div></section></div>`;
    body.querySelectorAll('[data-cpreset]').forEach(b=>b.onclick=()=>{pf316CasinoPreset(b.dataset.cpreset);pf316RenderCasino(body);toast('Casino Lab',`${b.textContent} preset applied.`)});
    document.getElementById('pf316CasinoApply').onclick=()=>{Object.assign(c,{coinWinPct:pf316Value('pf316CoinWin',50),coinPayout:pf316Value('pf316CoinPay',1),minesLuck:pf316Value('pf316MinesLuck',0),minesPayout:pf316Value('pf316MinesPay',1),plinkoForcePct:pf316Value('pf316PlinkoForce',0),plinkoTarget:document.getElementById('pf316PlinkoTarget').value,plinkoPayout:pf316Value('pf316PlinkoPay',1),slotsForcePct:pf316Value('pf316SlotsForce',0),slotsTarget:document.getElementById('pf316SlotsTarget').value,slotsPayout:pf316Value('pf316SlotsPay',1),blackjackNaturalPct:pf316Value('pf316BJNatural',0),blackjackPayout:pf316Value('pf316BJPay',1),rouletteForcePct:pf316Value('pf316RouletteForce',0),rouletteNumber:pf316Value('pf316RouletteNumber',7),roulettePayout:pf316Value('pf316RoulettePay',1),luckyReturnPct:pf316Value('pf316LuckyReturn',-1)});save(true);toast('Casino Lab','Odds and payouts updated.')};
    document.getElementById('pf316CasinoResetStats').onclick=()=>{state.casino={wins:0,losses:0,biggestWin:0};state.stats.games={};state.casinoHistory={};save(true);toast('Casino Lab','Casino stats reset.')}
  }
  function pf316RenderCodes(body){
    const rows=PF316_CODE_KEYS.map(code=>({code,d:rewardCodeDefs[code],used:!!(state.redeemedCodes?.[code]||state.redeemedCodes?.[rewardCodeDefs[code]?.rewardId])}));
    body.innerHTML=`<section class="pf316-card"><h3>Retired Reward Codes</h3><p>Reward-code redemption has been retired from the game.</p><div class="pf316-code-toolbar"><input id="pf316CodeSearch" class="pf316-search" placeholder="Search code or reward…"><button class="pf316-btn" id="pf316CopyCodes">Copy All</button><button class="pf316-btn danger" id="pf316ClearCodeUses">Clear PF16 Uses</button></div><div id="pf316CodeGrid" class="pf316-code-grid">${rows.map(r=>`<article class="pf316-code-row ${r.used?'used':''}"><code>${pfEscapeHtml(r.code)}</code><div><b>${pfEscapeHtml(r.d?.label||'Reward')}</b><small>${r.used?'USED ON THIS SAVE':'AVAILABLE'}</small></div></article>`).join('')}</div></section>`;
    const search=document.getElementById('pf316CodeSearch'),grid=document.getElementById('pf316CodeGrid');search.oninput=()=>{const q=search.value.toLowerCase();grid.querySelectorAll('.pf316-code-row').forEach(r=>r.classList.toggle('hidden',q&&!r.textContent.toLowerCase().includes(q)))};
    document.getElementById('pf316CopyCodes').onclick=async()=>{const txt=rows.map(r=>`${r.code} — ${r.d.label}`).join('\n');try{await navigator.clipboard.writeText(txt);toast('Admin Lab','Code list copied.')}catch(e){toast('Admin Lab','Clipboard blocked by this browser.')}}
    document.getElementById('pf316ClearCodeUses').onclick=()=>{for(const code of PF316_CODE_KEYS){delete state.redeemedCodes[code];delete state.redeemedCodes[rewardCodeDefs[code]?.rewardId]}save(true);pf316RenderCodes(body);toast('Admin Lab','PF16 code redemption flags cleared.')}
  }
  function pf316RenderSystem(body){
    const upgradeKeys=[['warehouseLevel','Critical Chance'],['kioskLevel','Pack Speed'],['variantLensLevel','Better Packs'],['autoLevel','Casino Payout'],['lineLevel','Lucky Return'],['campaignPrepLevel','Campaign Speed'],['engineLevel','Campaign Luck']];
    body.innerHTML=`<div class="pf316-grid"><section class="pf316-card wide"><h3>Upgrade State</h3><p>Admin-only direct state editing for this local save.</p><div class="pf316-inputs">${upgradeKeys.map(([k,n])=>`<label class="pf316-field"><span>${n}</span><input data-upgrade-key="${k}" type="number" min="0" max="100000" value="${state[k]||0}"></label>`).join('')}</div><div class="pf316-actions" style="margin-top:9px"><button id="pf316SetUpgrades">Apply Upgrade Levels</button><button id="pf316MaxUpgrades">Set All to 100</button></div></section>
      <section class="pf316-card wide"><h3>Raw Local Save</h3><p>Load the current JSON for backup/debugging, or paste valid PackForge JSON and apply it. This never leaves the browser.</p><textarea id="pf316SaveJson" class="pf316-textarea" spellcheck="false"></textarea><div class="pf316-actions" style="margin-top:8px"><button id="pf316LoadJson">Load Current JSON</button><button id="pf316ApplyJson" class="pf316-btn warn">Apply JSON & Reload</button><button id="pf316RestoreBackup">Restore Latest Recovery</button></div></section>
      <section class="pf316-card wide"><h3>Danger Zone</h3><p>These are destructive local-only actions.</p><div class="pf316-actions"><button id="pf316ClearRareQueue">Clear Forced Pack Queue</button><button id="pf316ClearAdminPacks">Delete Admin Test Packs</button><button id="pf316Lock2">Lock Admin</button></div></section></div>`;
    document.getElementById('pf316SetUpgrades').onclick=()=>{body.querySelectorAll('[data-upgrade-key]').forEach(el=>state[el.dataset.upgradeKey]=Math.max(0,Math.floor(Number(el.value)||0)));pf316After('Upgrade levels updated.')};
    document.getElementById('pf316MaxUpgrades').onclick=()=>{upgradeKeys.forEach(([k])=>state[k]=100);pf316After('All upgrade levels set to 100.')};
    document.getElementById('pf316LoadJson').onclick=()=>{document.getElementById('pf316SaveJson').value=localStorage.getItem(saveKey)||JSON.stringify(state,null,2)};
    document.getElementById('pf316ApplyJson').onclick=()=>{const raw=document.getElementById('pf316SaveJson').value.trim();try{JSON.parse(raw);localStorage.setItem(saveKey,raw);location.reload()}catch(e){toast('Invalid JSON','The pasted save could not be parsed.')}};
    document.getElementById('pf316RestoreBackup').onclick=()=>pfRestoreLatest();
    document.getElementById('pf316ClearRareQueue').onclick=()=>{state.godPackQueue=[];state.adminForces={godMode:null,bonusNext:false,ghostNext:false,blackLabelNext:false,crueNext:false,jetNext:false};pf316After('Forced outcome queue cleared.')};
    document.getElementById('pf316ClearAdminPacks').onclick=()=>{for(const id of PF316_ADMIN_PACK_IDS)state.premiumPackInventory[id]=0;pf316After('Admin test-pack inventory cleared.')};
    document.getElementById('pf316Lock2').onclick=()=>{$('#pfAdminLock')?.click()}
  }
  pfRenderAdminV35=function(){
    if(!pfAdminUnlocked)return;pfBuildAdminV35();const shell=document.getElementById('pfAdminV316Shell'),body=document.getElementById('pfAdminV316Body');if(!shell||!body)return;
    const tab=shell.dataset.tab||'overview';if(tab==='overview')pf316RenderOverview(body);else if(tab==='packs')pf316RenderPacks(body);else if(tab==='cards')pf316RenderCards(body);else if(tab==='casino')pf316RenderCasino(body);else pf316RenderSystem(body)
  };

  /* Black-hole Ascendant card renderer. Existing v3.15 God FX remain untouched. */
  const pfV316CardHTMLBase=cardHTML;
  cardHTML=function(card,count=0,copy=null,level=1,opts={}){
    let html=pfV316CardHTMLBase(card,count,copy,level,opts);if(!card?.ascendantRarity)return html;
    const stars=Array.from({length:12},(_,i)=>`<i style="--i:${i};--r:${58+(i%5)*17}px;--s:${1+(i%3)*.55}px;--o:${(.18+(i%6)*.09).toFixed(2)}"></i>`).join('');
    const bh=`<div class="pf-v316-blackhole"><div class="pf-v316-bh-stars">${stars}</div><b class="pf-v316-bh-disk back"></b><b class="pf-v316-bh-lens"></b><b class="pf-v316-bh-disk"></b><b class="pf-v316-bh-ring"></b><b class="pf-v316-bh-core"></b><b class="pf-v316-bh-disk front"></b></div>`;
    html=html.replace('class="card-face ','class="card-face pf-v316-ascendant-card ');
    html=html.replace('<div class="mutation-vfx"></div>',bh+'<div class="mutation-vfx"></div>');
    return html
  };
  const pfV316RarityCineBase=pfV315RarityCinematic;
  pfV315RarityCinematic=function(p,host){
    if(!p?.card?.ascendantRarity)return pfV316RarityCineBase(p,host);
    host.querySelectorAll('.pf-rarity-cinematic,.pf-v315-cinematic,.pf-v316-bh-cinematic').forEach(n=>n.remove());
    const fx=document.createElement('div');fx.className='pf-v316-bh-cinematic';
    const stars=Array.from({length:24},(_,i)=>`<i class="pf316-star" style="--a:${(i*137.5)%360}deg;--d:${(i%9)*.045}s"></i>`).join('');
    fx.innerHTML=`<div class="pf316-space"></div>${stars}<div class="pf316-disk"></div><div class="pf316-lens"></div><div class="pf316-hole"></div><div class="pf316-disk front"></div><div class="pf-v316-bh-copy"><small>EVENT HORIZON SIGNATURE DETECTED</small><b>ASCENDANT</b><strong>${pfEscapeHtml(p.card.name)}</strong><span>1 IN 20,000,000 CARD ROLLS</span></div>`;
    host.appendChild(fx);try{tone(48,.72,'sine',.028);setTimeout(()=>tone(92,.5,'sine',.022),260);setTimeout(()=>tone(660,.35,'triangle',.018),920);setTimeout(()=>tone(1180,.28,'sine',.015),1280)}catch(e){}setTimeout(()=>fx.remove(),4100)
  };

  window.__pfV316Health=()=>({
    version:PF_VERSION,
    adminPackPresets:PF316_ADMIN_PACK_IDS.length,
    rewardCodes:PF316_CODE_KEYS.length,
    allCodesPositive:PF316_CODE_KEYS.every(k=>!/lose|tax|potion|upgrade/i.test(`${k} ${rewardCodeDefs[k]?.label||''}`)),
    blackHoleFX:true,
    foundrySideColumn:true,
    casinoControls:Object.keys(state.pfAdminLab.casino),
    localSaveKey:saveKey
  });

  pfShowWhatsNew=function(){
    pfClearUpdateBadge();const m=document.getElementById('confirmModal');m.classList.remove('hidden');
    m.innerHTML=`<div class="modal pf-whats-new pf-whats-new-v33 fade-in"><div class="modal-head"><h3>PackForge v${PF_VERSION}</h3><button class="close-x" id="pfWhatsNewClose">×</button></div><div class="modal-body"><div class="pf-update-kicker">ADMIN LAB + ASCENDANT REBUILD</div><h2>The owner console is now ridiculous.</h2><div class="pf-change-grid"><span>🛡 Six-page Admin Lab with typed cash, exact cards, upgrades, timers, save tools, and direct chase grants</span><span>📦 100 searchable admin pack presets: 10 sets × 10 pack profiles</span><span>🔑 100 new positive reward codes with cash, packs, God packs, and Ascendant packs</span><span>🎰 Casino Lab can skew Coin, Mines, Plinko, Slots, Blackjack, Roulette, payouts, and Lucky Return</span><span>🕳 Ascendant cards now render as animated black holes with event horizon, lensing, and accretion-disk pull cinematic</span><span>🏭 Foundry enlarged into the full right-side Collector Floor column</span><span>⚡ All new visuals and admin systems are embedded locally: zero added asset/edge requests</span></div><button class="grade-action" id="pfWhatsNewDone">Got it</button></div></div>`;
    const close=()=>{m.classList.add('hidden');m.innerHTML=''};document.getElementById('pfWhatsNewClose').onclick=close;document.getElementById('pfWhatsNewDone').onclick=close
  };



  /* SOURCE: v3.17 internal patch — runs inside game-core scope. */
  const V317_RESET_KEY='packforge_economy_reset_v317';
  const V317_CHANGELOG=[{
    version:'3.17',date:'September 15, 2026',title:'Economy Reset + Performance Rebuild',changes:[
      ['🧾','Version menu','Added the translucent V counter. This menu starts tracking every PackForge change from v3.17 forward.'],
      ['♻️','One-time economy reset','On first v3.17 launch, cash and every stored pack are cleared once. Owned cards, grades, favorites, collection history, upgrades, and settings remain.'],
      ['📦','Pack prices normalized','Medieval, Food, Ocean, Space, and Monsters now cost $100. Dinosaurs, Superheroes, Pokémon, Villains, and Mythology all cost $1,250.'],
      ['💵','Sell economy corrected','All card sell prices are 75% of their previous value. Cards from the five $1,250 sets receive a 2× set-value multiplier before that global reduction.'],
      ['⚡','Chromebook performance pass','Reduced background polling, off-screen rendering, blur, particles, and continuous animation work. Low-spec devices get an automatic lighter rendering path.'],
      ['🧩','Static code split','The giant page was split into a small HTML shell plus cached CSS and core JS. Vercel serves a few static files once, then the service worker keeps them cache-first.'],
      ['❓','Odds browser rebuilt','The ? reference now has a cleaner layout plus a 10-pack comparison strip so pack differences are visible without Shop clutter.'],
      ['🛒','Shop pack shelf rebuilt','Pack cards are wider, cleaner, and easier to read. The pack image area was enlarged and odds badges remain off the Shop shelf.'],
      ['🏭','Foundry expanded','The Foundry now fills the right side of the Coin dashboard while keeping the calmer utility-panel look.'],
      ['🕳️','Ascendant black hole v2','The card black hole now uses asymmetric accretion brightness, tighter photon-ring lighting, cleaner lens arcs, and fewer expensive layers.']
    ]
  }];
  window.PF_CHANGELOG_V317=V317_CHANGELOG;

  function detectLowSpec(){
    const cores=Number(navigator.hardwareConcurrency||8),mem=Number(navigator.deviceMemory||8);
    return cores<=4||mem<=4;
  }
  if(detectLowSpec())document.body.classList.add('pf-low-spec');

  /* Economy definitions. Keep rarity personality, normalize prices and set-value multipliers. */
  const coreIds=['medieval','food','ocean','space','monsters'];
  const premiumIds=['dinosaurs','superheroes','pokemon','villains','mythology'];
  coreIds.forEach(id=>{const t=themes.find(x=>x.id===id);if(!t)return;t.pfPackProfile=t.pfPackProfile||{};t.pfPackProfile.price=175;t.pfPackProfile.sellMult=1;t.pfSellMult=1});
  const premiumDescriptions={dinosaurs:'Predators, giants, armored dinosaurs, and fossils from across prehistory.',superheroes:'Masked champions, cosmic protectors, and legendary defenders.',pokemon:'A monster-catching collection spanning classic favorites and rare chases.',villains:'Horror icons, masterminds, tyrants, and monsters.',mythology:'Gods, monsters, heroes, and relics from ancient legends.'};
  premiumIds.forEach(id=>{const t=themes.find(x=>x.id===id);if(!t)return;t.pfPackProfile=t.pfPackProfile||{};t.pfPackProfile.price=1750;t.pfPackProfile.sellMult=2;t.pfSellMult=2;t.desc=premiumDescriptions[id]||t.desc});

  /* Sell prices are globally 75% of the v3.16 result after the new set multiplier is applied. */
  const pfV317SellBase=sellValue;
  sellValue=function(card,level=1,copy=null){return Math.max(.01,Math.round(pfV317SellBase(card,level,copy)*.75*100)/100)};
  invalidateCollectionValue();

  function clearPackEconomy(){
    state.cash=0;state.rouletteBets=[];rouletteBets=state.rouletteBets;
    state.packInventory={};themes.forEach(t=>state.packInventory[t.id]=0);
    state.specialPackInventory=[];
    state.premiumPackInventory={};Object.keys(premiumPackDefs||{}).forEach(id=>state.premiumPackInventory[id]=0);
    if(state.legacyVault)state.legacyVault.specialPackInventory=[];
    state.godPackQueue=[];
    if(state.adminForces)state.adminForces.godMode=null;
  }
  function clearOldEconomyBackups(){
    try{['packforge_backup_1','packforge_backup_2','packforge_backup_3','packforge_backup_stamp_v1'].forEach(k=>localStorage.removeItem(k))}catch(e){}
  }
  function showEconomyResetNotice(){
    const ov=document.createElement('div');ov.className='modal-backdrop pf-v317-reset';ov.id='pfV317EconomyNotice';
    ov.innerHTML=`<div class="pf-v317-reset-card"><small>PACKFORGE v3.17 · ECONOMY MAINTENANCE</small><h1>We had to reset the economy.</h1><p>A previous code error allowed the cash and pack economy to get out of line. To make prices, selling, and progression meaningful again, this version performs one clean economy reset. It happens once on this browser.</p><div class="pf-v317-reset-list"><div class="pf-v317-reset-wipe"><b>RESET</b><span>Current cash balance</span></div><div class="pf-v317-reset-wipe"><b>RESET</b><span>Normal, special, premium, God, and Ascendant pack inventories</span></div><div class="pf-v317-reset-keep"><b>KEPT</b><span>Every owned card and its grade, variant, serial, level, lock, favorite, and collection history</span></div><div class="pf-v317-reset-keep"><b>KEPT</b><span>Upgrades, settings, achievements, Campaign progress, and local-only save behavior</span></div></div><button id="pfV317ResetContinue">Continue to PackForge</button></div>`;
    document.body.appendChild(ov);document.getElementById('pfV317ResetContinue').onclick=()=>ov.remove();
  }
  let didEconomyReset=false;
  try{if(localStorage.getItem(V317_RESET_KEY)!=='1')localStorage.setItem(V317_RESET_KEY,'1')}catch(e){}

  /* v3.18 owns the one-time economy migration and first-open notice. */
  try{renderHUD();renderShop();updateBagCounts();if(!document.getElementById('view-collection')?.classList.contains('hidden'))renderBag()}catch(e){console.warn('v3.17 UI refresh',e)}

  /* Persistent V version/changelog button. */
  function mountVersionButton(){
    if(document.getElementById('pfVButton'))return;
    const b=document.createElement('button');b.id='pfVButton';b.type='button';b.title='Version changes';b.innerHTML=`<b>V3.17</b><small>LOG</small><span class="pf-vcount-dot">${V317_CHANGELOG.reduce((n,v)=>n+v.changes.length,0)}</span>`;document.body.appendChild(b);b.onclick=openVersionLog;const sync=()=>b.classList.toggle('hidden',document.getElementById('gameApp')?.classList.contains('hidden')!==false);sync();window.addEventListener('pf:enterGame',sync);const ga=document.getElementById('gameApp');if(ga)new MutationObserver(sync).observe(ga,{attributes:true,attributeFilter:['class']});
  }
  function openVersionLog(){
    let ov=document.getElementById('pfVLogModal');if(!ov){ov=document.createElement('div');ov.id='pfVLogModal';ov.className='modal-backdrop';document.body.appendChild(ov)}
    ov.classList.remove('hidden');ov.innerHTML=`<div class="pf-v317-log"><div class="pf-v317-log-head"><div><small>PACKFORGE CHANGE RECORD</small><h2>Version Log</h2><p>Tracking changes from v3.17 forward until you tell me to stop.</p></div><button class="close-x" id="pfVLogClose">×</button></div><div class="pf-v317-log-body">${V317_CHANGELOG.map(v=>`<section class="pf-v317-version"><div class="pf-v317-version-head"><b>v${v.version} · ${v.title}</b><span>${v.date}</span></div><div class="pf-v317-changes">${v.changes.map(c=>`<div class="pf-v317-change"><i>${c[0]}</i><div><b>${pfEscapeHtml(c[1])}</b><span>${pfEscapeHtml(c[2])}</span></div></div>`).join('')}</div></section>`).join('')}</div></div>`;
    const close=()=>{ov.classList.add('hidden');ov.innerHTML=''};document.getElementById('pfVLogClose').onclick=close;ov.onmousedown=e=>{if(e.target===ov)close()};
  }
  mountVersionButton();

  /* Better ? browser: keep the underlying exact odds engine, add a pack comparison layer only when opened. */
  const pfV317OddsBase=pfRenderOddsBrowser;
  pfRenderOddsBrowser=function(){
    pfV317OddsBase();
    const body=document.querySelector('#oddsModal .pf-master-odds-body');if(!body||body.querySelector('.pf317-pack-lab'))return;
    const lab=document.createElement('section');lab.className='pf317-pack-lab';
    const cards=basePackThemes().map(t=>{const o=t.pfPackProfile?.odds||RARITY_ODDS;const rare=(Number(o.Rare||0)*100),epicPlus=(['Epic','Legendary','Mythic','Divine','Ultra'].reduce((n,k)=>n+Number(o[k]||0),0)*100);return `<button class="pf317-pack-tile ${pfOddsState.themeId===t.id?'active':''}" data-pf317-theme="${t.id}"><b>${pfEscapeHtml(t.name)}</b><strong>${fmt(packListPrice(t))}</strong><small>Rare ${rare.toFixed(2)}% · Epic+ ${epicPlus.toFixed(2)}%<br>${premiumIds.includes(t.id)?'Premium set · 2× base sell profile':'Core set'}</small></button>`}).join('');
    lab.innerHTML=`<div class="pf317-pack-lab-head"><div><b>Pack Comparison</b><span>Same five-card format, different rarity curves. Select a pack to inspect its exact card table below.</span></div><span>SELL VALUES SHOWN AFTER v3.17 ECONOMY RULES</span></div><div class="pf317-pack-strip">${cards}</div>`;
    body.prepend(lab);lab.querySelectorAll('[data-pf317-theme]').forEach(b=>b.onclick=()=>{pfOddsState.themeId=b.dataset.pf317Theme;pfOddsState.page=1;pfRenderOddsBrowser()});
  };

  /* Make the stats Chances page feel like a real reference page too. */
  const pfV317StatsBase=renderStats;
  renderStats=function(){pfV317StatsBase();const panel=document.getElementById('stats-chances');if(panel&&!panel.dataset.v317){panel.dataset.v317='1';panel.classList.add('pf-v317-stats-chances');const h=panel.querySelector('.pf-chances-head');if(h)h.insertAdjacentHTML('beforeend','<button class="ghost-btn" id="pfV317OpenMasterOdds">Open full pack reference</button>');document.getElementById('pfV317OpenMasterOdds')?.addEventListener('click',()=>showPackOdds(pfOddsState.themeId))}};

  /* Ensure new Shop text reflects the economy without adding odds badges. */
  const pfV317RenderShopBase=renderShop;
  renderShop=function(){pfV317RenderShopBase();document.querySelectorAll('#shopGrid .shop-mini-pack small').forEach(el=>el.textContent='5 CARDS · 125 CARD SET');const note=document.getElementById('packTierNote');if(note)note.textContent='Core packs are $175. Premium packs are $1,750. Pack odds and value differences are in the ? reference.'};
  try{renderShop()}catch(e){}

  /* Health/test hook. */
  window.__pfV317Health=()=>({
    version:PF_VERSION,lowSpec:document.body.classList.contains('pf-low-spec'),resetMarker:localStorage.getItem(V317_RESET_KEY),cash:state.cash,
    corePrices:Object.fromEntries(coreIds.map(id=>[id,packListPrice(themes.find(t=>t.id===id))])),premiumPrices:Object.fromEntries(premiumIds.map(id=>[id,packListPrice(themes.find(t=>t.id===id))])),
    premiumSellMult:Object.fromEntries(premiumIds.map(id=>[id,themes.find(t=>t.id===id)?.pfSellMult])),versionButton:!!document.getElementById('pfVButton'),changeCount:V317_CHANGELOG[0].changes.length,
    splitAssets:[...document.scripts].map(s=>s.src).filter(Boolean).length+document.querySelectorAll('link[rel="stylesheet"]').length
  });


  /* ==================== PackForge v3.18 — Economy Apology + Colin + Performance Polish ==================== */
  const V318_RESET_KEY='packforge_economy_reset_v318';
  const V318_CLAIM_KEY='packforge_v318_apology_claimed';
  const V318_COLIN_DEN='567^885';
  const V318_COLIN_APPROX='8.34 × 10^2436';

  V317_CHANGELOG.unshift({version:'3.18',date:'September 15, 2026',title:'Economy Apology + Colin Barnes',changes:[
    ['♥','A real apology screen','The economy migration now opens with a 30-second heartfelt typewriter message instead of a checklist.'],
    ['✦','Free Semi-God Pack','Reading the reset message unlocks a free pack containing exactly 2 Epic, 1 Legendary, and 2 Mythic cards.'],
    ['CB','Colin Barnes','A one-off impossible chase card was added at exactly 1 in 567^885 natural card rolls.'],
    ['$','Universal compact numbers','Large values now use two-decimal K / M / B / T / Qa / Qi and continuing suffixes throughout the game.'],
    ['V','Version cash shortcut','Left-clicking the V counter now grants $5,000 and still opens the full scrolling version log.'],
    ['🏭','Foundry coin','The passive-income reactor was replaced by a small unclickable coin that reacts whenever income lands.'],
    ['⚔','Simpler Campaigns','Campaigns now explain themselves as Pick → Add Cards → Start, with spotlight cards clearly optional.'],
    ['🌈','Holo rebuild','Holo particles now drift and fall across the card instead of orbiting in a spinning dot pattern.'],
    ['#','Serialized polish','Serialized numbers are larger, gold, and visually separated from normal card stats.'],
    ['◉','Ascendant black hole','The on-card event horizon, accretion disk, lensing, and low-spec fallbacks were rebuilt.'],
    ['●','Plinko polish','Multiplier bins were redrawn as clean compact pockets instead of a wall of divider lines.'],
    ['🎡','Roulette polish','The wheel now has real pocket gaps, layered rims, and a smoother ball-drop animation.'],
    ['⚡','Less startup work','The tutorial moved to a lazy-loaded chunk so returning players do not parse it on startup.']
  ]});
  window.PF_CHANGELOG_V317=V317_CHANGELOG;

  /* Semi-God apology pack. */
  if(!premiumPackDefs.apologysemi)premiumPackDefs.apologysemi={id:'apologysemi',name:'Semi-God Pack',emoji:'✦',cost:0,sell:0,adminOnly:true,gradient:'linear-gradient(135deg,#101720,#3b3047,#17131e)',glow:'#cab7e8',desc:'A one-time thank-you pack for the v3.18 economy reset.',effect:'Exactly 2 Epic · 1 Legendary · 2 Mythic'};
  state.premiumPackInventory.apologysemi=Math.max(0,Number(state.premiumPackInventory.apologysemi||0));
  const pfV318PremiumPullBase=createPremiumPackPulls;
  createPremiumPackPulls=function(def,theme,autoMode=false){
    if(def?.id!=='apologysemi')return pfV318PremiumPullBase(def,theme,autoMode);
    const plan=['Epic','Epic','Legendary','Mythic','Mythic'],seen=new Set(Object.keys(state.discovered||{})),pulls=[];state.packsOpened++;state.stats.packOpenedByTheme[theme.id]=(state.stats.packOpenedByTheme[theme.id]||0)+1;addOverdriveProgress('pack',1);
    for(const rarity of plan){const pool=theme.cards.filter(c=>c.rarity===rarity),card=pool[Math.floor(Math.random()*pool.length)]||theme.cards[0],copy=makeCopy('Normal',null,null),isNew=!seen.has(card.id);seen.add(card.id);pulls.push({card,copy,newDiscovery:isNew,added:false,special:false,nearMiss:null,semiGodPack:true,godPack:false})}
    state.quirkStats.semiGodPacks=(state.quirkStats.semiGodPacks||0)+1;pulls._semiGodPack=true;pulls._godPack=false;pulls._godMode='v318_apology';pulls._packModeDef={tier:'semi',name:'Semi-God Pack',desc:'2 Epic · 1 Legendary · 2 Mythic'};pulls._anomaly=null;pulls.sort((a,b)=>pullScore(a)-pullScore(b));markSaveDirty();return pulls
  };

  /* Colin Barnes: exact 1 / 567^885 roll. The loop almost always exits on its first draw. */
  const PF_COLIN_BARNES_CARD={id:'colin_barnes_0',name:'Colin Barnes',rarity:'Colin Barnes',theme:'colin',value:5.67e18,power:5.67e21,secret:false,colinBarnes:true,flavor:'The impossible print. There is no sensible statistical reason for this card to be in your hand.'};
  if(!cardMap[PF_COLIN_BARNES_CARD.id]){allCards.push(PF_COLIN_BARNES_CARD);cardMap[PF_COLIN_BARNES_CARD.id]=PF_COLIN_BARNES_CARD}
  rarityColor['Colin Barnes']='#ffe99a';state.quirkStats.colinBarnes=Math.max(0,Number(state.quirkStats.colinBarnes||0));
  const pfV318Uint=new Uint32Array(1),PF318_U32_LIMIT=Math.floor(4294967296/567)*567;
  function pfV318Uniform567(){if(globalThis.crypto?.getRandomValues){let u;do{crypto.getRandomValues(pfV318Uint);u=pfV318Uint[0]}while(u>=PF318_U32_LIMIT);return u%567}return Math.floor(Math.random()*567)}
  function pfV318RollColin(){for(let i=0;i<885;i++)if(pfV318Uniform567()!==0)return false;return true}
  const pfV318WeightedBase=weightedCard;
  weightedCard=function(theme,mutation,autoMode=false,qualityBoost=1){if(!tutorialTrainingMode&&pfV318RollColin()){state.quirkStats.colinBarnes=(state.quirkStats.colinBarnes||0)+1;return{card:PF_COLIN_BARNES_CARD,nearMiss:null}}return pfV318WeightedBase(theme,mutation,autoMode,qualityBoost)};
  const pfV318SellBase=sellValue;sellValue=function(card,level=1,copy=null){if(card?.colinBarnes)return Math.max(1,Math.round(5.67e14*levelBonus(level)*variantMultiplier(copy)*gradeMultiplier(copy?.grade)));return pfV318SellBase(card,level,copy)};
  const pfV318PullScoreBase=pullScore;pullScore=function(p){if(p?.card?.colinBarnes)return Number.MAX_SAFE_INTEGER;return pfV318PullScoreBase(p)};
  const pfV318SortBase=sortEntries;sortEntries=function(a,b){if(a?.c?.colinBarnes&&!b?.c?.colinBarnes)return-1;if(b?.c?.colinBarnes&&!a?.c?.colinBarnes)return 1;return pfV318SortBase(a,b)};
  const pfV318HighValueBase=pfHighValueSell;pfHighValueSell=function(card){return !!card?.colinBarnes||pfV318HighValueBase(card)};
  const pfV318CardHTMLBase=cardHTML;
  cardHTML=function(card,count=0,copy=null,level=1,opts={}){
    let html=pfV318CardHTMLBase(card,count,copy,level,opts);if(!card?.colinBarnes)return html;
    return html.replace('class="card-face ','class="card-face pf318-colin-card pf321-colin-card ')
  };
  const pfV318PreHintBase=pullPreRevealHint;pullPreRevealHint=function(p,isFinal=false){if(p?.card?.colinBarnes)return'Something mathematically absurd is inside this wrapper…';return pfV318PreHintBase(p,isFinal)};
  const pfV318PostHintBase=pullPostRevealHint;pullPostRevealHint=function(p,isFinal=false){if(p?.card?.colinBarnes)return`COLIN BARNES · 1 IN ${V318_COLIN_DEN}${isFinal?' · click the card to continue':''}`;return pfV318PostHintBase(p,isFinal)};
  const pfV318RevealFxBase=triggerPullRevealFx;triggerPullRevealFx=function(p,ov,stageFx,burstLabel){pfV318RevealFxBase(p,ov,stageFx,burstLabel);if(!p?.card?.colinBarnes||ov.classList.contains('auto-opening'))return;ov.querySelectorAll('.pf318-colin-cinematic').forEach(n=>n.remove());const fx=document.createElement('div');fx.className='pf318-colin-cinematic';fx.innerHTML='<div class="cb318-collapse"></div><div class="cb318-rings"><i></i><i></i><i></i></div><div class="cb318-title"><small>STATISTICAL IMPOSSIBILITY</small><b>COLIN BARNES</b><strong>1 IN 567<sup>885</sup></strong><span>THE IMPOSSIBLE PRINT</span></div>';ov.appendChild(fx);try{tone(45,.8,'sine',.022);setTimeout(()=>tone(567,.4,'triangle',.025),500);setTimeout(()=>tone(1134,.32,'sine',.02),980)}catch(e){}setTimeout(()=>fx.remove(),4300)};

  /* The Ascendant cinematic copy remains accurate, but the card itself is redrawn through v318 CSS. */

  /* Foundry coin: no click target, only a brief transform reaction when passive cash lands. */
  function pfV318MountFoundryCoin(){const r=document.querySelector('#pfFoundryCard .pf-foundry-reactor');if(!r||r.dataset.v318)return;r.dataset.v318='1';r.innerHTML='<div class="pf318-foundry-coin" aria-hidden="true"><span>PF</span></div>';r.setAttribute('aria-hidden','true')}
  pfV318MountFoundryCoin();let pfV318FoundrySeen=Number(state.foundry?.totalEarned||0),pfV318CoinTimer=0;
  const pfV318RenderFoundryBase=pfRenderFoundry;pfRenderFoundry=function(){pfV318RenderFoundryBase();pfV318MountFoundryCoin();const total=Number(state.foundry?.totalEarned||0);if(total>pfV318FoundrySeen){const c=document.querySelector('.pf318-foundry-coin');if(c){c.classList.remove('earn');void c.offsetWidth;c.classList.add('earn');clearTimeout(pfV318CoinTimer);pfV318CoinTimer=setTimeout(()=>c.classList.remove('earn'),330)}}pfV318FoundrySeen=total};pfRenderFoundry();

  /* Campaigns: make the task obvious instead of lore/UI first. */
  function pfV318SimplifyCampaignUI(){const view=document.getElementById('view-campaigns');if(!view)return;const title=view.querySelector('.view-title h1'),sub=view.querySelector('.view-title p'),badge=view.querySelector('.campaign-badge');if(title)title.textContent='Campaigns';if(sub)sub.textContent='Pick a campaign, add cards until your Power is high enough, then press Start. Come back when the timer finishes to collect the reward.';if(badge)badge.textContent='Spotlight cards are OPTIONAL. They only give a bonus.';if(!view.querySelector('.pf318-campaign-steps')){const steps=document.createElement('div');steps.className='pf318-campaign-steps';steps.innerHTML='<div><b>1</b><span><strong>Pick</strong><small>Choose a campaign.</small></span></div><div><b>2</b><span><strong>Add Cards</strong><small>Fill Power until it turns ready.</small></span></div><div><b>3</b><span><strong>Start</strong><small>Wait for the timer, then collect.</small></span></div>';view.querySelector('.view-title')?.after(steps)}view.querySelectorAll('.campaign-choice-card p,.campaign-team-copy p').forEach(p=>{if(p.textContent.length>170)p.textContent=p.textContent.slice(0,167)+'…'})}
  const pfV318CampaignsBase=renderCampaigns;renderCampaigns=function(){pfV318CampaignsBase();pfV318SimplifyCampaignUI()};
  const pfV318CampaignTeamBase=renderCampaignTeamFlow;renderCampaignTeamFlow=function(){pfV318CampaignTeamBase();pfV318SimplifyCampaignUI();const stage=document.getElementById('campaignStage');stage?.querySelectorAll('button').forEach(b=>{if(/launch|start/i.test(b.textContent))b.textContent='START CAMPAIGN'})};pfV318SimplifyCampaignUI();

  /* Chances: precise Colin math + perspective comparisons. */
  const pfV318ChancesBase=pfRenderChances;pfRenderChances=function(){pfV318ChancesBase();const g=document.getElementById('pfChanceGrid');if(!g||g.querySelector('.pf318-colin-chance'))return;g.insertAdjacentHTML('afterbegin',`<article class="pf318-colin-chance"><div class="pf318-colin-chance-head"><span>IMPOSSIBLE CHASE</span><h3>Colin Barnes</h3><strong>1 in 567<sup>885</sup></strong><small>≈ ${V318_COLIN_APPROX}</small></div><p>For perspective, each of these is still enormously more likely than pulling Colin Barnes:</p><div class="pf318-compare"><div><b>Exact 52-card deck order</b><span>1 in 52! ≈ 8.07 × 10<sup>67</sup></span></div><div><b>Guess a 256-bit key</b><span>1 in 2<sup>256</sup> ≈ 1.16 × 10<sup>77</sup></span></div><div><b>Call 1,000 fair coin flips</b><span>1 in 2<sup>1000</sup> ≈ 1.07 × 10<sup>301</sup></span></div><div><b>Call 8,000 fair coin flips</b><span>1 in 2<sup>8000</sup> ≈ 1.74 × 10<sup>2408</sup> — still about 4.80 × 10<sup>28</sup> times more likely</span></div></div></article>`)};
  const pfV318OddsBase=pfRenderOddsBrowser;pfRenderOddsBrowser=function(){pfV318OddsBase();const body=document.querySelector('#oddsModal .pf-master-odds-body');if(body&&!body.querySelector('.pf318-odds-colin'))body.insertAdjacentHTML('afterbegin',`<section class="pf318-odds-colin"><b>COLIN BARNES · GLOBAL CHASE</b><span>Natural card-roll odds: 1 in 567<sup>885</sup> (≈ ${V318_COLIN_APPROX}). It can replace a normal card roll in any permanent pack.</span></section>`)};

  /* One-time economy migration plus 30-second locked apology. Cards are intentionally untouched. */
  let pfV318DidReset=false;
  try{if(!['3.21','3.22'].includes(PF_VERSION)&&localStorage.getItem(V318_RESET_KEY)!=='1'){clearPackEconomy();clearOldEconomyBackups();localStorage.setItem(V318_RESET_KEY,'1');pfV318DidReset=true;markSaveDirty();save(true);clearOldEconomyBackups()}}catch(e){console.warn('v3.18 economy reset marker unavailable',e)}
  function pfV318ApologyNeeded(){if(['3.21','3.22'].includes(PF_VERSION))return false;try{return localStorage.getItem(V318_CLAIM_KEY)!=='1'&&!state.v318ApologyClaimed}catch(e){return !state.v318ApologyClaimed}}
  function pfV318ShowApology(){if(!pfV318ApologyNeeded()||document.getElementById('pfV318EconomyNotice'))return;const message=`We are sincerely sorry that we have to reset the PackForge economy. You put real time into building up your cash and packs, and having that progress changed because of a code error is frustrating. The old economy had reached a point where prices and rewards could no longer be balanced fairly without clearing the broken cash and pack totals. We did not remove your cards. Your collection is the part that matters most, and it is still yours. This reset is happening once so PackForge can have a healthier economy from here forward. Thank you for sticking with the game while we fix our mistake. We know a message cannot replace lost progress, but we hope this free Semi-God Pack is at least a small thank-you for giving us another chance.`;const ov=document.createElement('div');ov.id='pfV318EconomyNotice';ov.className='pf318-apology';ov.innerHTML='<div class="pf318-apology-card"><small>PACKFORGE v3.19 · A MESSAGE FROM US</small><h1>We owe you an apology.</h1><div class="pf318-type" id="pf318Type"></div><div class="pf318-apology-foot"><span id="pf318Countdown">Please read · 30s</span><button id="pf318Claim" disabled>CLAIM UNLOCKS IN 30s</button></div></div>';document.body.appendChild(ov);const type=document.getElementById('pf318Type'),btn=document.getElementById('pf318Claim'),count=document.getElementById('pf318Countdown'),started=performance.now(),duration=30000;let pos=0,last=0;const tick=now=>{const elapsed=now-started,target=Math.min(message.length,Math.floor(message.length*Math.min(1,elapsed/28500)));if(target!==pos){type.textContent=message.slice(0,target);pos=target}const left=Math.max(0,Math.ceil((duration-elapsed)/1000));if(left>0){count.textContent=`Please read · ${left}s`;btn.textContent=`CLAIM UNLOCKS IN ${left}s`;requestAnimationFrame(tick)}else{type.textContent=message;count.textContent='Thank you for reading.';btn.disabled=false;btn.textContent='CLICK TO CLAIM 1 FREE SEMI-GOD PACK'}};requestAnimationFrame(tick);btn.onclick=()=>{if(btn.disabled)return;grantPremiumPack('apologysemi',1);state.v318ApologyClaimed=true;try{localStorage.setItem(V318_CLAIM_KEY,'1')}catch(e){}markSaveDirty();save(true);renderHUD();renderPacks();updateBagCounts();ov.remove();toast('Semi-God Pack claimed','Bag → Packs · Jet Lumagui, Legendary, Wyatt Evans, Mythic, and a Holo Serialized Grade 10 1/1 Common.');window.dispatchEvent(new Event('pf:enterGame'))}}
  if(pfV318ApologyNeeded()){const show=()=>queueMicrotask(pfV318ShowApology);if(!document.getElementById('gameApp')?.classList.contains('hidden'))show();else window.addEventListener('pf:enterGame',show,{once:true})}

  /* V button now pays $5K on every left click and opens the changelog. */
  const pfV318VersionButton=document.getElementById('pfVButton');if(pfV318VersionButton){pfV318VersionButton.innerHTML=`<b>V3.18</b><small>LOG</small><span class="pf-vcount-dot">${V317_CHANGELOG.reduce((n,v)=>n+v.changes.length,0)}</span>`;pfV318VersionButton.title='Left click: +$5,000 and open version log';pfV318VersionButton.onclick=()=>{earn(5000);state.stats.versionBonuses=(state.stats.versionBonuses||0)+1;renderHUD();save();try{checkAchievements(true)}catch(e){}toast('Version bonus','+$5.00K');openVersionLog()};pfV318VersionButton.oncontextmenu=e=>{e.preventDefault();openVersionLog()}}

  /* Make Colin available from the normal code box for owner testing without changing natural odds. */
  rewardCodeDefs['CoLiN-BaRnEs']={label:'1 Colin Barnes card',rewardId:'PF318-COLIN-BARNES',apply:()=>{const copy=makeCopy('Normal',null,null);copy.source='Colin Barnes code';copy.openingQuality='Impossible';addCopy(PF_COLIN_BARNES_CARD.id,1,copy);state.discovered[PF_COLIN_BARNES_CARD.id]=true;const h=state.history[PF_COLIN_BARNES_CARD.id]||(state.history[PF_COLIN_BARNES_CARD.id]={});h.totalPulled=(h.totalPulled||0)+1;h.highestLevel=Math.max(h.highestLevel||1,1);state.quirkStats.colinBarnes=(state.quirkStats.colinBarnes||0)+1;markSaveDirty()}};

  /* Low-spec/cookie-clicker style guardrails: only animate visible/active surfaces. */
  const pfV318Visibility=()=>document.documentElement.classList.toggle('pf318-background-paused',document.hidden);document.addEventListener('visibilitychange',pfV318Visibility,{passive:true});pfV318Visibility();

  try{renderHUD();renderShop();renderStats();pfRenderFoundry();if(!document.getElementById('view-campaigns')?.classList.contains('hidden'))renderCampaigns()}catch(e){console.warn('v3.18 refresh',e)}


  /* ==================== v3.19 — WYATT / CASINO CLEANUP ==================== */
  V317_CHANGELOG.unshift({version:'3.19',date:'September 15, 2026',title:'Wyatt + Casino Performance',changes:[
    ['WE','Wyatt Evans','Added the signature Wyatt Evans rarity/card: natural 1 in 1,000,000 packs, 4.00K Power, and a $35.00K base sell value.'],
    ['✦','Semi-God thank-you pack','Rebuilt the free pack as Jet Lumagui + Legendary + Wyatt Evans + Mythic + a Holo / Serialized / Grade 10 / #001 of 001 Common.'],
    ['CB','Colin rarity perspective','Replaced cryptographic comparisons with absurd human-scale facts and an expected wait of about 5.3 × 10^2422 years at one million packs per second.'],
    ['🎰','Slots rebuilt','Slots is now first in Casino, spins from a physical pull lever, and uses cheaper compositor-driven reel motion.'],
    ['$','Cleaner casino bets','Casino wager controls use a typed amount plus ALL. Slots quick bets and auto-spin clutter were removed.'],
    ['🧹','Casino code cleanup','Removed the obsolete legacy casino implementation and the unused Plinko stat wall below the board.'],
    ['V','Version controls','Left-click opens this log. Right-click grants the owner $50.00K.'],
    ['📦','Pack prices','Core packs now cost $175 and premium permanent packs cost $1.75K. Existing card values were left unchanged.'],
    ['🕳','Ascendant black hole','Simplified the animated black-hole stack into fewer, stronger layers so it looks cleaner and costs less GPU time.']
  ]});

  /* New one-card rarity: Wyatt Evans. */
  const PF_WYATT_EVANS_CARD={id:'wyatt_evans_0',name:'Wyatt Evans',rarity:'Wyatt Evans',theme:'wyatt',value:35000,power:4000,secret:false,wyattEvans:true,flavor:'A one-in-a-million signature chase built to look like the crown jewel of PackForge.'};
  rarityColor['Wyatt Evans']='#fff1a8';rarityMult['Wyatt Evans']=1;
  if(!cardMap[PF_WYATT_EVANS_CARD.id]){allCards.push(PF_WYATT_EVANS_CARD);cardMap[PF_WYATT_EVANS_CARD.id]=PF_WYATT_EVANS_CARD}
  state.quirkStats.wyattEvans=state.quirkStats.wyattEvans||0;
  const pfV319SellBase=sellValue;sellValue=function(card,level=1,copy=null){if(card?.wyattEvans){return Math.max(1,Math.round(35000*levelBonus(level)*variantMultiplier(copy)*mutationMultiplier(copy)*gradeMultiplier(copy?.grade)*premiumTraitMultiplier(copy)*collectorQuirkMultiplier(copy)*100)/100)}return pfV319SellBase(card,level,copy)};
  const pfV319PullScoreBase=pullScore;pullScore=function(p){if(p?.card?.colinBarnes)return Number.MAX_SAFE_INTEGER;if(p?.card?.wyattEvans)return Number.MAX_SAFE_INTEGER-1000;return pfV319PullScoreBase(p)};
  const pfV319HighValueBase=pfHighValueSell;pfHighValueSell=function(card){return !!card?.wyattEvans||pfV319HighValueBase(card)};
  const pfV319CardHTMLBase=cardHTML;cardHTML=function(card,count=0,copy=null,level=1,opts={}){let html=pfV319CardHTMLBase(card,count,copy,level,opts);if(card?.wyattEvans){html=html.replace('card-face ','card-face pf319-wyatt-card pf321-wyatt-card ').replace('<div class="mutation-vfx"></div>','<div class="mutation-vfx"></div><div class="pf321-wyatt-fx" aria-hidden="true"><i class="cash c1">$</i><i class="cash c2">$</i><i class="cash c3">$</i><i class="cash c4">$</i><i class="cash c5">$</i><span class="wyatt-seal">WE</span></div>')}if(copy?.variant==='Holo'&&copy?.serial==='#001 / 001')html=html.replace('card-face ','card-face pf319-oneofone ');return html};
  const pfV319RevealBase=triggerPullRevealFx;triggerPullRevealFx=function(p,ov,stageFx,burstLabel){pfV319RevealBase(p,ov,stageFx,burstLabel);if(!p?.card?.wyattEvans)return;ov?.classList.add('pf319-wyatt-reveal');if(stageFx)stageFx.innerHTML='<div class="pf319-wyatt-cinematic"><i></i><i></i><i></i><b>WYATT EVANS</b><span>ONE IN A MILLION</span></div>';if(burstLabel){burstLabel.textContent='✦ WYATT EVANS ✦';burstLabel.classList.add('show')}setTimeout(()=>{ov?.classList.remove('pf319-wyatt-reveal');if(stageFx)stageFx.innerHTML='';burstLabel?.classList.remove('show')},2600)};

  /* Natural Wyatt roll is exactly pack-level: 1 in 1,000,000 packs. */
  const PF_WYATT_PACK_CHANCE=1/1000000;
  function pfV319Rand(){try{if(window.crypto&&crypto.getRandomValues){const u=new Uint32Array(1);crypto.getRandomValues(u);return u[0]/4294967296}}catch(e){}return Math.random()}
  const pfV319CreatePackBase=createPackPulls;createPackPulls=function(t,mutation,autoMode=false){const pulls=pfV319CreatePackBase(t,mutation,autoMode);if(!tutorialTrainingMode&&pulls?.length&&pfV319Rand()<PF_WYATT_PACK_CHANCE){let i=Math.max(0,pulls.length-1),p=pulls[i];p.card=PF_WYATT_EVANS_CARD;p.newDiscovery=!state.discovered[PF_WYATT_EVANS_CARD.id];if(p.copy?.variant==='Serialized')p.copy.serial=makeSerial(PF_WYATT_EVANS_CARD.id);state.quirkStats.wyattEvans=(state.quirkStats.wyattEvans||0)+1;pulls.sort((a,b)=>pullScore(a)-pullScore(b))}return pulls};

  /* Free reset pack: five exact showcase slots. */
  if(premiumPackDefs.apologysemi){premiumPackDefs.apologysemi.desc='A one-time thank-you pack rebuilt for v3.19.';premiumPackDefs.apologysemi.effect='Jet Lumagui · Legendary · Wyatt Evans · Mythic · Holo Serialized Grade 10 1/1 Common'}
  function pfV319ThemeRarity(theme,rarity){const pool=theme.cards.filter(c=>c.rarity===rarity);return pool[Math.floor(pfV319Rand()*Math.max(1,pool.length))]||theme.cards[0]}
  function pfV319Pull(card,copy){return{card,copy,newDiscovery:!state.discovered[card.id],added:false,special:false,nearMiss:null,godPack:false,semiGodPack:true}}
  const pfV319PremiumBase=createPremiumPackPulls;createPremiumPackPulls=function(def,theme,autoMode=false){if(def?.id!=='apologysemi')return pfV319PremiumBase(def,theme,autoMode);const jetCopy=makeCopy('Normal',null,null),legCopy=makeCopy('Normal',null,null),wyCopy=makeCopy('Normal',null,null),mythCopy=makeCopy('Normal',null,null),one=makeCopy('Holo',null,'#001 / 001');one.grade=10;one.gradedAt=Date.now();one.source='Semi-God Pack · 1/1';one.openingQuality='Perfect 1/1';one.premiumTrait='1/1';one.gradeNote=generateGraderNote(one,10);const common=pfV319ThemeRarity(theme,'Common');const pulls=[pfV319Pull(JET_LUMAGUI_CARD,jetCopy),pfV319Pull(pfV319ThemeRarity(theme,'Legendary'),legCopy),pfV319Pull(PF_WYATT_EVANS_CARD,wyCopy),pfV319Pull(pfV319ThemeRarity(theme,'Mythic'),mythCopy),pfV319Pull(common,one)];pulls._semiGodPack=true;pulls._godMode='v319_apology';pulls._packModeDef={tier:'semi',name:'Semi-God Thank You',emoji:'✦',short:'SEMI-GOD',desc:'Five exact thank-you pulls.'};pulls.sort((a,b)=>pullScore(a)-pullScore(b));return pulls};

  /* Human-scale Colin perspective instead of cryptographic trivia. */
  const PF_COLIN_PACKS_PER_EXPECTED_PULL='1.67 × 10^2436';
  const PF_COLIN_YEARS_AT_MILLION_PER_SEC='5.3 × 10^2422';
  const pfV319ChanceBase=pfRenderChances;pfRenderChances=function(){pfV319ChanceBase();const old=document.querySelector('.pf318-colin-chance');if(old){old.innerHTML=`<div class="pf318-colin-chance-head"><span>ABSURDLY IMPOSSIBLE CHASE</span><h3>Colin Barnes</h3><strong>1 in 567<sup>885</sup></strong><small>≈ ${V318_COLIN_APPROX}</small></div><p>This number is so ridiculous that normal comparisons stop being useful:</p><div class="pf318-compare pf319-colin-facts"><div><b>Lightning + shark</b><span>You are more likely to be struck by lightning while a shark is actively eating you.</span></div><div><b>Open 1,000,000 packs every second</b><span>The expected wait is about ${PF_COLIN_YEARS_AT_MILLION_PER_SEC} years.</span></div><div><b>Expected packs</b><span>About ${PF_COLIN_PACKS_PER_EXPECTED_PULL} packs on average — not a typo.</span></div><div><b>Age of the universe</b><span>The expected wait is roughly 3.8 × 10<sup>2412</sup> times the universe's current age.</span></div><div><b>Everybody on Earth joins in</b><span>Even billions of people each opening a million packs every second would still face a wait with more than 2,400 digits in the year count.</span></div></div>`}const grid=document.getElementById('pfChanceGrid');if(grid&&!grid.querySelector('.pf319-wyatt-chance'))grid.insertAdjacentHTML('afterbegin','<article class="pf319-wyatt-chance"><span>NEW SIGNATURE RARITY</span><h3>Wyatt Evans</h3><strong>1 in 1,000,000 packs</strong><p>4.00K Power · $35.00K base sell value · one global pack-level roll.</p></article>')};
  const pfV319OddsBase=pfRenderOddsBrowser;pfRenderOddsBrowser=function(){pfV319OddsBase();const body=document.querySelector('#oddsModal .pf-master-odds-body');if(body&&!body.querySelector('.pf319-odds-wyatt'))body.insertAdjacentHTML('afterbegin','<section class="pf319-odds-wyatt"><b>WYATT EVANS · SIGNATURE CHASE</b><span>Natural odds: 1 in 1,000,000 packs · Power 4.00K · base sell $35.00K.</span></section>')};

  /* Add Wyatt to rarity selectors where applicable. */
  const pfV319CollectionBase=renderCollection;renderCollection=function(){pfV319CollectionBase();const rf=document.getElementById('rarityFilter');if(rf&&!Array.from(rf.options).some(o=>o.value==='Wyatt Evans')){const o=document.createElement('option');o.value='Wyatt Evans';o.textContent='Wyatt Evans';rf.appendChild(o)}};
  const pfV319ShowcaseBase=renderShowcase;renderShowcase=function(){pfV319ShowcaseBase();const rf=document.getElementById('showcaseRarityFilter');if(rf&&!Array.from(rf.options).some(o=>o.value==='Wyatt Evans')){const o=document.createElement('option');o.value='Wyatt Evans';o.textContent='Wyatt Evans';rf.appendChild(o)}};

  /* Retire the old auto What's-New popup. The V log is now the single update record. */
  pfShowWhatsNew=function(){pfClearUpdateBadge();openVersionLog()};try{localStorage.setItem(PF_CHANGELOG_KEY,'1');document.getElementById('pfUpdateBadge')?.classList.add('hidden')}catch(e){}

  /* Version button: normal left click = log; right click = $50K owner bonus. */
  const pfV319VersionButton=document.getElementById('pfVButton');if(pfV319VersionButton){pfV319VersionButton.innerHTML=`<b>V3.19</b><small>LOG</small><span class="pf-vcount-dot">${V317_CHANGELOG.reduce((n,v)=>n+v.changes.length,0)}</span>`;pfV319VersionButton.title='Left click: open version log · Right click: +$50,000';pfV319VersionButton.onclick=()=>openVersionLog();pfV319VersionButton.oncontextmenu=e=>{e.preventDefault();earn(50000);state.stats.versionBonuses=(state.stats.versionBonuses||0)+1;renderHUD();save();toast('Owner version bonus','+$50.00K')}}

  /* Owner test code for the new card. */
  rewardCodeDefs['WyAtT-EvAnS']={label:'1 Wyatt Evans card',rewardId:'PF319-WYATT-EVANS',apply:()=>{const copy=makeCopy('Normal',null,null);copy.source='Wyatt Evans code';copy.openingQuality='Signature';addCopy(PF_WYATT_EVANS_CARD.id,1,copy);state.discovered[PF_WYATT_EVANS_CARD.id]=true;state.quirkStats.wyattEvans=(state.quirkStats.wyattEvans||0)+1;markSaveDirty()}};

  try{renderHUD();renderShop();renderStats()}catch(e){console.warn('v3.19 refresh',e)}
  window.__pfV319Health=()=>({version:PF_VERSION,wyattInMap:!!cardMap[PF_WYATT_EVANS_CARD.id],wyattPower:PF_WYATT_EVANS_CARD.power,wyattSell:sellValue(PF_WYATT_EVANS_CARD,1,makeCopy('Normal',null,null)),wyattPackChance:PF_WYATT_PACK_CHANCE,semiComposition:['Jet Lumagui','Legendary','Wyatt Evans','Mythic','Common Holo Serialized Grade 10 1/1'],corePrices:themes.filter(t=>['medieval','food','ocean','space','monsters'].includes(t.id)).map(t=>t.pfPackProfile?.price),premiumPrices:themes.filter(t=>['dinosaurs','superheroes','pokemon','villains','mythology'].includes(t.id)).map(t=>t.pfPackProfile?.price),changeVersions:V317_CHANGELOG.map(x=>x.version)});

  window.__pfV318Health=()=>({version:PF_VERSION,resetMarker:localStorage.getItem(V318_RESET_KEY),claimMarker:localStorage.getItem(V318_CLAIM_KEY),cash:state.cash,colinInMap:!!cardMap[PF_COLIN_BARNES_CARD.id],colinOdds:V318_COLIN_DEN,colinOwned:pfOwnedCount(PF_COLIN_BARNES_CARD.id),semiGodOwned:state.premiumPackInventory.apologysemi||0,semiComposition:['Epic','Epic','Legendary','Mythic','Mythic'],formatSamples:[fmt(1250),fmt(1120000),pfCompactNumber(9876543210,2)],tutorialExternal:!Array.from(document.scripts).some(s=>!s.src&&s.textContent?.includes('packforge_tutorial_v1')),changeVersions:V317_CHANGELOG.map(x=>x.version)});



  /* ==================== v3.20 — AUTO SLOTS / NEBULA / PLAYER LOG / ADMIN CREATOR ==================== */
  V317_CHANGELOG.unshift({version:'3.20',date:'September 15, 2026',title:'Auto Slots + Nebula',changes:[
    ['🎰','Auto Slots','Slots can keep spinning until STOP AUTO, including while you use other PackForge pages.'],
    ['75','Slots balance','Default Slots math was rebalanced to about a 75% long-run return including free spins.'],
    ['🌌','Nebula variant','Shattered was retired and replaced by the smoother animated Nebula variant.'],
    ['!','Admin card creator','Admin mode now adds a single ! button in Bag for creating custom cards.'],
    ['♥','Apology replay','The apology appears once again in v3.20 for testing, without resetting the economy again.'],
    ['MB','Matthew Bamford Bonus','Right-click the version badge once on this local save for a one-time $50.00K bonus.'],
    ['#','Serialized cleanup','Serialized numbers are back at the bottom with shiny gold text and no box.'],
    ['❓','Cleaner Chances','Removed the duplicate Wyatt/Colin banners and made the Colin rarity facts much easier to read.']
  ]});
  window.PF_CHANGELOG_V317=V317_CHANGELOG;

  /* Migrate old Shattered copies to the new Nebula finish without losing cards. */
  variantDefs.Nebula={name:'Nebula',chance:1/2000,value:22};delete variantDefs.Shattered;
  const pfNebIdx=variantRollOrder.indexOf('Shattered');if(pfNebIdx>=0)variantRollOrder.splice(pfNebIdx,1);if(!variantRollOrder.includes('Nebula'))variantRollOrder.splice(Math.max(1,variantRollOrder.indexOf('Serialized')+1),0,'Nebula');
  for(const it of Object.values(state.inventory||{}))for(const ld of Object.values(it.levels||{}))for(const cp of ld.copies||[])if(cp.variant==='Shattered')cp.variant='Nebula';
  if(state.meta?.variantsEver?.Shattered){state.meta.variantsEver.Nebula=true;delete state.meta.variantsEver.Shattered}markSaveDirty();

  /* Remove duplicate top-of-modal chase banners. The full Chances page is the single rarity explanation. */
  const pfV320OddsBase=pfRenderOddsBrowser;pfRenderOddsBrowser=function(){pfV320OddsBase();document.querySelectorAll('.pf318-odds-colin,.pf319-odds-wyatt').forEach(n=>n.remove())};

  /* Curated, player-facing version log: bigger text, no implementation trivia. */
  const PF320_PLAYER_LOG=[
    {version:'3.20',title:'Auto Slots + Nebula',items:['Slots gained AUTO / STOP AUTO and keeps playing while you visit other PackForge pages.','Nebula replaced the old Shattered variant.','Admin mode gained the custom-card creator in the Bag.','Serialized cards received the shiny gold serial-number treatment.']},
    {version:'3.19',title:'Wyatt Evans',items:['Wyatt Evans was added as a new 1-in-1,000,000 chase card.','The free Semi-God showcase pack was added.','Slots moved to the first Casino tab.']},
    {version:'3.18',title:'Colin Barnes',items:['Colin Barnes was added as PackForge’s absurdly impossible global chase card.','Foundry gained its reactive passive-income coin.','Campaign instructions were simplified.']},
    {version:'3.16',title:'Admin Lab + Ascendant',items:['The expanded Admin Lab was added with exact card and pack testing tools.','Ascendant cards received the animated black-hole treatment.']},
    {version:'3.15',title:'Card Identity Update',items:['All permanent sets were expanded to 125 unique one-word card names.','God and Ascendant chase cards received dedicated pull and card effects.']},
    {version:'3.13',title:'God + Ascendant Expansion',items:['God and Ascendant were added above Ghost.','Dinosaurs, Superheroes, Pokémon, Villains, and Mythology became permanent pack sets.','Foundry passive income was added.']}
  ];
  openVersionLog=function(){let ov=document.getElementById('pfVLogModal');if(!ov){ov=document.createElement('div');ov.id='pfVLogModal';ov.className='modal-backdrop';document.body.appendChild(ov)}ov.classList.remove('hidden');ov.innerHTML=`<div class="pf-v317-log pf320-player-log"><div class="pf-v317-log-head"><div><small>PACKFORGE UPDATES</small><h2>What's changed?</h2><p>Only the changes that matter while you are playing.</p></div><button class="close-x" id="pfVLogClose">×</button></div><div class="pf-v317-log-body">${PF320_PLAYER_LOG.map(v=>`<section class="pf-v317-version"><div class="pf-v317-version-head"><b>v${v.version} · ${v.title}</b></div><div class="pf320-log-items">${v.items.map(x=>`<p>• ${pfEscapeHtml(x)}</p>`).join('')}</div></section>`).join('')}</div></div>`;const close=()=>{ov.classList.add('hidden');ov.innerHTML=''};document.getElementById('pfVLogClose').onclick=close;ov.onmousedown=e=>{if(e.target===ov)close()}};

  /* Version badge: left = log, right = one-time local-save Matthew Bamford Bonus. */
  const V320_MATTHEW_KEY='packforge_matthew_bamford_bonus_v320';
  function pfV320MatthewClaimed(){try{return localStorage.getItem(V320_MATTHEW_KEY)==='1'||!!state.stats?.matthewBamfordBonus}catch(e){return !!state.stats?.matthewBamfordBonus}}
  function pfV320ClaimMatthew(){if(pfV320MatthewClaimed()){toast('Matthew Bamford Bonus','Already claimed on this local save.');return false}earn(50000);state.stats.matthewBamfordBonus=true;try{localStorage.setItem(V320_MATTHEW_KEY,'1')}catch(e){}renderHUD();save(true);toast('Matthew Bamford Bonus','+$50.00K · one-time bonus claimed.');return true}
  const pfV320VersionButton=document.getElementById('pfVButton');if(pfV320VersionButton){pfV320VersionButton.innerHTML=`<b>V3.20</b><small>LOG</small><span class="pf-vcount-dot">${V317_CHANGELOG.reduce((n,v)=>n+v.changes.length,0)}</span>`;pfV320VersionButton.title='Left click: update notes · Right click: Matthew Bamford Bonus ($50K once)';pfV320VersionButton.onclick=openVersionLog;pfV320VersionButton.oncontextmenu=e=>{e.preventDefault();pfV320ClaimMatthew()}}

  /* Show the apology again once for v3.20 testing, but do NOT reset money/packs again. */
  const V320_APOLOGY_KEY='packforge_v320_apology_seen';
  function pfV320ApologyNeeded(){if(['3.21','3.22'].includes(PF_VERSION))return false;try{return localStorage.getItem(V320_APOLOGY_KEY)!=='1'}catch(e){return !state.v320ApologySeen}}
  function pfV320ShowApology(testMode=false){if(document.getElementById('pfV320EconomyNotice'))return;const message=`We are sincerely sorry for the economy reset. PackForge had a code error that pushed cash and pack totals far enough out of balance that keeping those totals would have made future prices and rewards meaningless. We know that asking you to lose progress because of our mistake is frustrating, and we do not take that lightly. Your cards were kept because your collection is the heart of the game. This screen is appearing again in v3.20 so the reset message can be properly tested, but your economy is not being reset again. Thank you for sticking with PackForge while we keep making it better.`;const ov=document.createElement('div');ov.id='pfV320EconomyNotice';ov.className='pf318-apology';ov.innerHTML='<div class="pf318-apology-card"><small>PACKFORGE v3.20 · A MESSAGE FROM US</small><h1>We still owe you an apology.</h1><div class="pf318-type" id="pf320Type"></div><div class="pf318-apology-foot"><span id="pf320Countdown">Please read · 30s</span><button id="pf320Claim" disabled>CLAIM UNLOCKS IN 30s</button></div></div>';document.body.appendChild(ov);const type=document.getElementById('pf320Type'),btn=document.getElementById('pf320Claim'),count=document.getElementById('pf320Countdown'),started=performance.now(),duration=30000;let pos=0;const tick=now=>{const elapsed=now-started,target=Math.min(message.length,Math.floor(message.length*Math.min(1,elapsed/28500)));if(target!==pos){type.textContent=message.slice(0,target);pos=target}const left=Math.max(0,Math.ceil((duration-elapsed)/1000));if(left>0){count.textContent=`Please read · ${left}s`;btn.textContent=`CLAIM UNLOCKS IN ${left}s`;requestAnimationFrame(tick)}else{type.textContent=message;count.textContent='Thank you for reading.';btn.disabled=false;btn.textContent='CLICK TO CLAIM 1 FREE SEMI-GOD PACK'}};requestAnimationFrame(tick);btn.onclick=()=>{if(btn.disabled)return;grantPremiumPack('apologysemi',1);if(!testMode){state.v320ApologySeen=true;try{localStorage.setItem(V320_APOLOGY_KEY,'1')}catch(e){}}markSaveDirty();save(true);renderHUD();renderPacks();updateBagCounts();ov.remove();toast(testMode?'Admin apology test complete':'Semi-God Pack claimed','+1 Semi-God Pack in Bag → Packs.')}}
  if(pfV320ApologyNeeded()){const show=()=>queueMicrotask(()=>pfV320ShowApology(false));if(!document.getElementById('gameApp')?.classList.contains('hidden'))show();else window.addEventListener('pf:enterGame',show,{once:true})}

  /* Persistent custom cards for Admin mode. Custom cards do not expand normal 125-card set completion. */
  function pfV320CustomList(){return state.pfCustomCards=Array.isArray(state.pfCustomCards)?state.pfCustomCards:[]}
  pfV320CustomList();
  function pfV320CustomFlags(rarity){return{secret:rarity==='Secret',ghost:rarity==='Ghost',godRarity:rarity==='God',ascendantRarity:rarity==='Ascendant',jet:rarity==='Jet Lumagui',wyattEvans:rarity==='Wyatt Evans',colinBarnes:rarity==='Colin Barnes',crue:rarity==='Crue Lowe'}}
  function pfV320RegisterCustom(def){if(!def?.id||cardMap[def.id])return cardMap[def.id];const flags=pfV320CustomFlags(def.rarity);const card={id:def.id,name:def.name||'Custom',rarity:def.rarity||'Common',theme:def.theme||'medieval',value:Math.max(0,Number(def.value)||1),power:Math.max(0,Number(def.power)||1),customCard:true,flavor:def.flavor||'Admin-created PackForge card.',...flags};allCards.push(card);cardMap[card.id]=card;return card}
  pfV320CustomList().forEach(pfV320RegisterCustom);
  function pfV320OpenCustomCardBuilder(){if(!pfAdminUnlocked)return;const m=document.getElementById('confirmModal');m.classList.remove('hidden');const rarityOpts=[...rarityOrder,'God','Ascendant','Secret','Ghost','Jet Lumagui','Crue Lowe','Wyatt Evans','Colin Barnes'];const variants=['Normal',...Object.keys(variantDefs)];m.innerHTML=`<div class="modal pf320-card-maker fade-in"><div class="modal-head"><h3>! Custom Card Creator</h3><button class="close-x" id="pf320MakerClose">×</button></div><div class="modal-body"><p>Create an exact card for this local save. It will not enter normal pack pools or change 125-card set completion.</p><div class="pf320-maker-grid"><label>Name<input id="pf320MakerName" value="Custom"></label><label>Set<select id="pf320MakerTheme">${basePackThemes().map(t=>`<option value="${t.id}">${pfEscapeHtml(t.name)}</option>`).join('')}</select></label><label>Rarity<select id="pf320MakerRarity">${rarityOpts.map(r=>`<option>${r}</option>`).join('')}</select></label><label>Variant<select id="pf320MakerVariant">${variants.map(v=>`<option>${v}</option>`).join('')}</select></label><label>Power<input id="pf320MakerPower" type="number" min="0" value="1000"></label><label>Base Sell<input id="pf320MakerValue" type="number" min="0" value="1000"></label><label>Grade<input id="pf320MakerGrade" type="number" min="0" max="10" step="0.1" value="0"></label><label>Serial<input id="pf320MakerSerial" placeholder="#001 / 001"></label><label>Copies<input id="pf320MakerCount" type="number" min="1" max="100" value="1"></label><label class="wide">Flavor<input id="pf320MakerFlavor" value="Admin-created PackForge card."></label></div><button class="grade-action" id="pf320MakerCreate">CREATE CARD</button></div></div>`;const close=()=>{m.classList.add('hidden');m.innerHTML=''};document.getElementById('pf320MakerClose').onclick=close;document.getElementById('pf320MakerCreate').onclick=()=>{const name=document.getElementById('pf320MakerName').value.trim()||'Custom',def={id:`custom_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`,name,theme:document.getElementById('pf320MakerTheme').value,rarity:document.getElementById('pf320MakerRarity').value,power:Number(document.getElementById('pf320MakerPower').value)||0,value:Number(document.getElementById('pf320MakerValue').value)||0,flavor:document.getElementById('pf320MakerFlavor').value.trim()||'Admin-created PackForge card.'};pfV320CustomList().push(def);const card=pfV320RegisterCustom(def),variant=document.getElementById('pf320MakerVariant').value,grade=Number(document.getElementById('pf320MakerGrade').value)||0,serial=document.getElementById('pf320MakerSerial').value.trim(),count=Math.max(1,Math.min(100,Math.floor(Number(document.getElementById('pf320MakerCount').value)||1)));for(let i=0;i<count;i++){const cp=makeCopy(variant,null,variant==='Serialized'?(serial||makeSerial(card.id)):null);if(grade>0){cp.grade=clamp(Math.round(grade*10)/10,1,10);cp.gradedAt=Date.now();cp.gradeNote=generateGraderNote(cp,cp.grade)}cp.source='Admin Custom Card';cp.openingQuality='Custom';addCopy(card.id,1,cp)}state.discovered[card.id]=true;markSaveDirty();save(true);close();renderCollection();toast('Custom card created',`${count} × ${name}`)}}
  function pfV320MountBagAdmin(){const title=document.querySelector('#view-collection .view-title');if(!title)return;let b=document.getElementById('pf320BagAdmin');if(!pfAdminUnlocked){b?.remove();return}if(b)return;b=document.createElement('button');b.id='pf320BagAdmin';b.className='pf320-bag-admin';b.type='button';b.title='Admin custom card creator';b.textContent='!';b.onclick=pfV320OpenCustomCardBuilder;title.appendChild(b)}
  const pfV320CollectionBase=renderCollection;renderCollection=function(){pfV320CollectionBase();pfV320MountBagAdmin()};
  const pfV320AdminBoardBase=renderPfAdminBoard;renderPfAdminBoard=function(){pfV320AdminBoardBase();pfV320MountBagAdmin()};

  /* Add v3.20 controls into the deep Admin Lab. */
  const pfV320AdminRenderBase=pfRenderAdminV35;pfRenderAdminV35=function(){pfV320AdminRenderBase();pfV320MountBagAdmin();if(!pfAdminUnlocked)return;const shell=document.getElementById('pfAdminV316Shell'),body=document.getElementById('pfAdminV316Body');if(!shell||!body||document.getElementById('pf320AdminExtras'))return;const box=document.createElement('section');box.id='pf320AdminExtras';box.className='pf316-card wide pf320-admin-extra';box.innerHTML=`<h3>v3.20 Test Tools</h3><p>Current-version tools for testing without clearing the whole save.</p><div class="pf316-actions"><button id="pf320AdminMaker">! Custom Card Creator</button><button id="pf320AdminApology">Replay 30s Apology</button><button id="pf320AdminSemi">+1 Semi-God Pack</button><button id="pf320AdminWyatt">+1 Wyatt Evans</button><button id="pf320AdminColin">+1 Colin Barnes</button><button id="pf320AdminNebula">+1 Nebula Card</button><button id="pf320AdminBonusReset">Reset Matthew Bonus Claim</button></div>`;body.appendChild(box);document.getElementById('pf320AdminMaker').onclick=pfV320OpenCustomCardBuilder;document.getElementById('pf320AdminApology').onclick=()=>pfV320ShowApology(true);document.getElementById('pf320AdminSemi').onclick=()=>{grantPremiumPack('apologysemi',1);pf316After('Granted 1 Semi-God Pack.')};document.getElementById('pf320AdminWyatt').onclick=()=>{rewardCodeDefs['WyAtT-EvAnS'].apply();pf316After('Granted Wyatt Evans.')};document.getElementById('pf320AdminColin').onclick=()=>{rewardCodeDefs['CoLiN-BaRnEs'].apply();pf316After('Granted Colin Barnes.')};document.getElementById('pf320AdminNebula').onclick=()=>{const t=basePackThemes()[0],c=t.cards.find(x=>x.rarity==='Rare')||t.cards[0],cp=makeCopy('Nebula',null,null);cp.source='Admin Nebula Test';addCopy(c.id,1,cp);state.discovered[c.id]=true;pf316After('Granted a Nebula test card.')};document.getElementById('pf320AdminBonusReset').onclick=()=>{state.stats.matthewBamfordBonus=false;try{localStorage.removeItem(V320_MATTHEW_KEY)}catch(e){}save(true);toast('Admin Lab','Matthew Bamford Bonus can be claimed again for testing.')}};

  /* New public test code for Nebula and keep admin code data aware of v3.20. */
  rewardCodeDefs['NeBuLa-FiNiSh']={label:'1 Nebula variant card',rewardId:'PF320-NEBULA',apply:()=>{const t=basePackThemes()[0],c=t.cards.find(x=>x.rarity==='Rare')||t.cards[0],cp=makeCopy('Nebula',null,null);cp.source='Nebula code';addCopy(c.id,1,cp);state.discovered[c.id]=true;markSaveDirty()}};

  try{renderHUD();renderStats();renderCollection();if(pfAdminUnlocked)pfRenderAdminV35()}catch(e){console.warn('v3.20 refresh',e)}
  window.__pfV320Health=()=>({version:PF_VERSION,variant:variantDefs.Nebula?.chance,shatteredPresent:!!variantDefs.Shattered,matthewClaimed:pfV320MatthewClaimed(),apologyNeeded:pfV320ApologyNeeded(),customCards:pfV320CustomList().length,slotsTargetRTP:.75,versionLog:PF320_PLAYER_LOG.map(x=>x.version),oddsBanners:document.querySelectorAll('.pf318-odds-colin,.pf319-odds-wyatt').length});


  /* ==================== v3.21 — RECOVERY + MONEY WHEEL + LOW-LAG CSS ==================== */
  V317_CHANGELOG.unshift({version:'3.21',date:'September 15, 2026',title:'Recovery + Money Wheel',changes:[
    ['♥','Economy recovery','The corrected 30-second apology runs again and performs one final cash + pack reset while keeping every owned card.'],
    ['🌟','Free Recovery God Pack','The apology unlocks one identical fixed God Pack for every player.'],
    ['🎡','Money Wheel','A new 40-wedge casino wheel runs at an exact 80% base RTP with a 5× jackpot.'],
    ['🎰','Better Slots lever','Manual Slots now uses a longer physical pull; AUTO reel animation is 50% slower than manual.'],
    ['$','Wyatt Evans redesign','Wyatt now has a focused black/green money design with exactly five bouncing dollar symbols.'],
    ['CB','Colin redesign','Colin is intentionally almost blank: only the name remains on the card face.'],
    ['📦','Wider Bag packs','Pack boxes in Bag are wider so long pack names fit cleanly.'],
    ['⚡','No-idle-animation rule','New v3.21 casino effects animate only during play and use compositor transforms instead of permanent render loops.']
  ]});
  window.PF_CHANGELOG_V317=V317_CHANGELOG;
  PF320_PLAYER_LOG.unshift({version:'3.21',title:'Recovery + Money Wheel',items:['A final economy correction resets cash and packs to $0 while keeping every card.','Reading the apology unlocks the same fixed Recovery God Pack for everyone.','Money Wheel was added with 40 equal wedges, a 5× jackpot, and an exact 80% base RTP.','Wyatt Evans and Colin Barnes received complete card-face redesigns.','Slots has a more physical lever and AUTO spins animate 50% slower than manual.','Bag pack boxes are wider so names fit better.']});

  /* Fixed apology God Pack — EXACTLY the five-card lineup requested, identical for every player. */
  if(!premiumPackDefs.recoverygod321)premiumPackDefs.recoverygod321={id:'recoverygod321',name:'Wyatt Apology God Pack',emoji:'🌟',cost:0,sell:0,adminOnly:true,gradient:'linear-gradient(135deg,#07110b,#1c5a2d,#0b1510)',glow:'#64f095',desc:'Wyatt’s fixed five-card apology pack. Every player receives the exact same cards.',effect:'Jet Lumagui · Legendary · Wyatt Evans · Mythic · Holo Serialized Grade 10 #001/001 Common'};
  else Object.assign(premiumPackDefs.recoverygod321,{name:'Wyatt Apology God Pack',desc:'Wyatt’s fixed five-card apology pack. Every player receives the exact same cards.',effect:'Jet Lumagui · Legendary · Wyatt Evans · Mythic · Holo Serialized Grade 10 #001/001 Common'});
  state.premiumPackInventory.recoverygod321=Math.max(0,Number(state.premiumPackInventory.recoverygod321||0));
  function pfV321FixedRarity(themeId,rarity){const t=themes.find(x=>x.id===themeId)||themes[0];if(rarity==='God')return t.godCard;if(rarity==='Ascendant')return t.ascendantCard;return t.cards.find(c=>c.rarity===rarity)||t.cards[0]}
  function pfV321Pull(card,copy=null){copy=copy||makeCopy('Normal',null,null);copy.source='Wyatt Apology God Pack';copy.openingQuality='Fixed apology issue';return{card,copy,newDiscovery:!state.discovered[card.id],added:false,special:false,nearMiss:null,godPack:true,semiGodPack:false}}
  const pfV321PremiumBase=createPremiumPackPulls;createPremiumPackPulls=function(def,theme,autoMode=false){if(def?.id!=='recoverygod321')return pfV321PremiumBase(def,theme,autoMode);state.packsOpened++;addOverdriveProgress('pack',1);const one=makeCopy('Holo',null,'#001 / 001');one.grade=10;one.gradedAt=Date.now();one.source='Wyatt Apology God Pack · 1/1';one.openingQuality='Perfect 1/1';one.premiumTrait='1/1';one.gradeNote=generateGraderNote(one,10);const pulls=[pfV321Pull(JET_LUMAGUI_CARD),pfV321Pull(pfV321FixedRarity('medieval','Legendary')),pfV321Pull(PF_WYATT_EVANS_CARD),pfV321Pull(pfV321FixedRarity('space','Mythic')),pfV321Pull(pfV321FixedRarity('food','Common'),one)];pulls._godPack=true;pulls._godMode='v321_recovery';pulls._packModeDef={tier:'god',name:'Wyatt Apology God Pack',emoji:'🌟',short:'WYATT GOD PACK',desc:'Jet Lumagui · Legendary · Wyatt Evans · Mythic · Holo Serialized Grade 10 #001/001 Common.'};pulls.sort((a,b)=>pullScore(a)-pullScore(b));state.quirkStats.godPacks=(state.quirkStats.godPacks||0)+1;markSaveDirty();return pulls};

  /* Final one-time economy correction for v3.21: cash/packs only; cards are untouched. */
  const V321_RESET_KEY='packforge_economy_reset_v321';
  const V321_APOLOGY_KEY='packforge_v321_apology_claimed';
  let pfV321DidReset=false;
  try{if(localStorage.getItem(V321_RESET_KEY)!=='1'){clearPackEconomy();clearOldEconomyBackups();localStorage.setItem(V321_RESET_KEY,'1');pfV321DidReset=true;markSaveDirty();save(true);clearOldEconomyBackups()}}catch(e){console.warn('v3.21 economy reset marker unavailable',e)}
  function pfV321ApologyNeeded(){try{return localStorage.getItem(V321_APOLOGY_KEY)!=='1'&&!state.v321ApologyClaimed}catch(e){return !state.v321ApologyClaimed}}
  function pfV321ShowApology(testMode=false){if(document.getElementById('pfV321EconomyNotice'))return;const message=`As you may have seen yesterday, the 15th, there was a glitch where the packs cost way too much, and because they cost a lot, they therefore sold for a lot. This allowed people to click to get these packs, then turn around and sell them for copious amounts of money. You may not have even known about this glitch. Therefore, I am sorry, but I have to reset everybody's money and packs to $0. Blame me. For this, I am so deeply sorry. I will be giving you a free God Pack, one of the best packs in the game. It has the same cards in every single one so as not to be "unfair" to anybody. If you continue to play the game, I thank you and promise nothing like this will ever occur again. If you choose not to play anymore, then, well... that sucks. Also, there was a major update with new things added, so have fun.\n\nSincerely,\nWyatt Evans`;const ov=document.createElement('div');ov.id='pfV321EconomyNotice';ov.className='pf318-apology pf321-apology';ov.innerHTML='<div class="pf318-apology-card"><small>PACKFORGE v3.22 · A MESSAGE FROM WYATT</small><h1>I owe you another apology.</h1><div class="pf318-type" id="pf321Type"></div><div class="pf318-apology-foot"><span id="pf321Countdown">Please read · 30s</span><button id="pf321Claim" disabled>CLAIM UNLOCKS IN 30s</button></div></div>';document.body.appendChild(ov);const type=document.getElementById('pf321Type'),btn=document.getElementById('pf321Claim'),count=document.getElementById('pf321Countdown'),started=performance.now(),duration=30000;let pos=0;const tick=now=>{const elapsed=now-started,target=Math.min(message.length,Math.floor(message.length*Math.min(1,elapsed/28500)));if(target!==pos){type.textContent=message.slice(0,target);pos=target}const left=Math.max(0,Math.ceil((duration-elapsed)/1000));if(left>0){count.textContent=`Please read · ${left}s`;btn.textContent=`CLAIM UNLOCKS IN ${left}s`;requestAnimationFrame(tick)}else{type.textContent=message;count.textContent='Thank you for reading.';btn.disabled=false;btn.textContent='CLICK TO CLAIM 1 FREE GOD PACK'}};requestAnimationFrame(tick);btn.onclick=()=>{if(btn.disabled)return;grantPremiumPack('recoverygod321',1);if(!testMode){state.v321ApologyClaimed=true;try{localStorage.setItem(V321_APOLOGY_KEY,'1')}catch(e){}}markSaveDirty();save(true);renderHUD();renderPacks();updateBagCounts();ov.remove();toast(testMode?'Admin apology test complete':'Wyatt Apology God Pack claimed','+1 fixed Wyatt Apology God Pack in Bag → Packs.')}}
  if(pfV321ApologyNeeded()){const show=()=>queueMicrotask(()=>pfV321ShowApology(false));if(!document.getElementById('gameApp')?.classList.contains('hidden'))show();else window.addEventListener('pf:enterGame',show,{once:true})}

  /* Version badge remains simple: left opens notes, right uses the existing one-time Matthew Bamford Bonus. */
  const pfV321VersionButton=document.getElementById('pfVButton');if(pfV321VersionButton){pfV321VersionButton.innerHTML=`<b>V3.21</b><small>LOG</small><span class="pf-vcount-dot">${V317_CHANGELOG.reduce((n,v)=>n+v.changes.length,0)}</span>`;pfV321VersionButton.title='Left click: update notes · Right click: Matthew Bamford Bonus ($50K once)';pfV321VersionButton.onclick=openVersionLog;pfV321VersionButton.oncontextmenu=e=>{e.preventDefault();pfV320ClaimMatthew()}}

  /* Colin Inspect is deliberately empty except for the physical card. */
  const pfV321InspectBase=showInspect;showInspect=function(id,level=1,sig){pfV321InspectBase(id,level,sig);if(cardMap[id]?.colinBarnes){const scene=document.querySelector('#inspectModal .inspect-scene');scene?.classList.add('pf321-colin-inspect')}};

  /* Admin: new recovery/wheel controls. */
  state.pfAdminLab=state.pfAdminLab||{};state.pfAdminLab.casino={moneyWheelForcePct:0,moneyWheelTarget:5,moneyWheelPayout:1,...(state.pfAdminLab.casino||{})};
  const pfV321CasinoPresetBase=pf316CasinoPreset;pf316CasinoPreset=function(name){pfV321CasinoPresetBase(name);const c=state.pfAdminLab.casino;if(name==='normal')Object.assign(c,{moneyWheelForcePct:0,moneyWheelTarget:5,moneyWheelPayout:1});if(name==='friendly')Object.assign(c,{moneyWheelForcePct:8,moneyWheelTarget:2,moneyWheelPayout:1.1});if(name==='jackpot')Object.assign(c,{moneyWheelForcePct:100,moneyWheelTarget:5,moneyWheelPayout:4});if(name==='brutal')Object.assign(c,{moneyWheelForcePct:0,moneyWheelTarget:0,moneyWheelPayout:.5})};
  const pfV321RenderCasinoBase=pf316RenderCasino;pf316RenderCasino=function(body){pfV321RenderCasinoBase(body)};
  const pfV321AdminRenderBase=pfRenderAdminV35;pfRenderAdminV35=function(){pfV321AdminRenderBase();if(!pfAdminUnlocked)return;const body=document.getElementById('pfAdminV316Body');if(!body||document.getElementById('pf321AdminExtras'))return;const box=document.createElement('section');box.id='pf321AdminExtras';box.className='pf316-card wide pf320-admin-extra';box.innerHTML='<h3>v3.21 Recovery Tools</h3><p>Test the new recovery flow and chase-card presentation.</p><div class="pf316-actions"><button id="pf321AdminApology">Replay v3.21 Apology</button><button id="pf321AdminRecovery">+1 Wyatt Apology God Pack</button><button id="pf321AdminResetMarker">Reset v3.21 Apology Claim</button><button id="pf321AdminWyatt">+1 Wyatt Evans</button><button id="pf321AdminColin">+1 Colin Barnes</button></div>';body.appendChild(box);document.getElementById('pf321AdminApology').onclick=()=>pfV321ShowApology(true);document.getElementById('pf321AdminRecovery').onclick=()=>{grantPremiumPack('recoverygod321',1);pf316After('Granted 1 Wyatt Apology God Pack.')};document.getElementById('pf321AdminResetMarker').onclick=()=>{state.v321ApologyClaimed=false;try{localStorage.removeItem(V321_APOLOGY_KEY)}catch(e){}save(true);toast('Admin Lab','v3.21 apology can appear again.')};document.getElementById('pf321AdminWyatt').onclick=()=>{rewardCodeDefs['WyAtT-EvAnS'].apply();pf316After('Granted Wyatt Evans.')};document.getElementById('pf321AdminColin').onclick=()=>{rewardCodeDefs['CoLiN-BaRnEs'].apply();pf316After('Granted Colin Barnes.')}};

  try{renderHUD();renderPacks();renderCollection();if(pfAdminUnlocked)pfRenderAdminV35()}catch(e){console.warn('v3.21 refresh',e)}
  window.__pfV321Health=()=>({version:PF_VERSION,resetMarker:localStorage.getItem(V321_RESET_KEY),apologyNeeded:pfV321ApologyNeeded(),recoveryPacks:state.premiumPackInventory.recoverygod321||0,moneyWheelRTP:.80,moneyWheelSegments:40,moneyWheelJackpots:1,slotsAutoSpeed:1.5,wyattDollarCount:document.querySelectorAll('.pf321-wyatt-fx .cash').length,playerLog:PF320_PLAYER_LOG.map(x=>x.version)});


  /* ==================== v3.22 — WHEEL / LEVER / CARD POLISH ==================== */
  V317_CHANGELOG.unshift({version:'3.22',date:'September 15, 2026',title:'Wheel + Lever + Chase Polish',changes:[
    ['🎡','Money Wheel polish','The Money Wheel is larger, its wedges are mixed instead of clumped, labels reach farther toward the center, and the Spin button now sits beneath the wheel.'],
    ['🎰','Physical Slots lever','The Slots handle is larger and the entire metal arm pivots with the ball instead of visually separating.'],
    ['$','Wyatt Evans polish','Removed the center WE seal and enlarged the five moving green dollar symbols.'],
    ['CB','Colin rarity facts','Colin’s Chances facts now explain how absurdly rare he is in plain language instead of walls of scientific notation.'],
    ['🌟','Apology pack corrected','The free apology God Pack now uses the exact fixed five-card lineup Wyatt requested.']
  ]});
  window.PF_CHANGELOG_V317=V317_CHANGELOG;

  /* Keep the exact 80% return, but interleave all 40 equal wedges. No BUST wedges touch. */
  const PF322_WHEEL_SEGMENTS=[0,1,.5,0,2,0,1.5,0,.5,1,0,2,.5,0,1,0,1.5,.5,0,2,1,0,.5,0,5,1.5,0,2,.5,0,1,0,1.5,2,0,.5,1,0,.5,1];
  window.__pfCasinoBridge?.moneyWheelSegments.splice(0,window.__pfCasinoBridge.moneyWheelSegments.length,...PF322_WHEEL_SEGMENTS);
  window.__pfCasinoBridge?.moneyWheelReset();

  /* Put the action where a physical wheel expects it: directly beneath the wheel. */
  function pfV322ArrangeWheel(){const layout=document.querySelector('.pf321-wheel-layout'),stage=document.getElementById('moneyWheelStage'),spin=document.getElementById('moneyWheelSpinBtn');if(!layout||!stage||!spin)return;let main=document.querySelector('.pf322-wheel-main');if(!main){main=document.createElement('div');main.className='pf322-wheel-main';layout.insertBefore(main,stage);main.appendChild(stage)}if(spin.parentElement!==main)main.appendChild(spin)}
  pfV322ArrangeWheel();

  /* Rebuild the lever as one hinged arm so the rod and ball physically move together. */
  function pfV322RebuildLever(){const old=document.getElementById('slotsLever');if(!old||old.dataset.v322==='1')return;const lever=old.cloneNode(false);lever.id='slotsLever';lever.className='pf320-slot-lever pf322-slot-lever';lever.type='button';lever.dataset.v322='1';lever.setAttribute('aria-label','Pull slot lever to spin');lever.innerHTML='<span class="pf322-lever-shell"><span class="pf322-lever-pivot"></span><span class="pf322-lever-arm"><b class="pf322-lever-ball"></b></span><em class="pf322-lever-gate"></em></span><small>PULL TO SPIN</small>';old.replaceWith(lever);let y0=0,pull=0,drag=false,suppress=false;const set=v=>{pull=Math.max(0,Math.min(1,v));const angle=-31+(pull*78);lever.style.setProperty('--lever-angle',`${angle.toFixed(2)}deg`);lever.style.setProperty('--pull',pull.toFixed(3))};const fire=()=>{if(window.__pfCasinoBridge?.slotsBusy())return;lever.classList.add('firing');set(1);setTimeout(()=>{lever.classList.remove('firing');set(0);window.__pfCasinoBridge?.slotsSpin()},285)};lever.addEventListener('pointerdown',e=>{if(window.__pfCasinoBridge?.slotsBusy())return;drag=true;y0=e.clientY;set(0);lever.classList.add('grabbing');lever.setPointerCapture?.(e.pointerId);e.preventDefault()});lever.addEventListener('pointermove',e=>{if(!drag)return;set((e.clientY-y0)/116);e.preventDefault()});const end=e=>{if(!drag)return;drag=false;lever.classList.remove('grabbing');const shouldFire=pull>.56;suppress=shouldFire;if(shouldFire)fire();else set(0);e?.preventDefault?.()};lever.addEventListener('pointerup',end);lever.addEventListener('pointercancel',end);lever.addEventListener('click',()=>{if(suppress){suppress=false;return}fire()});set(0);window.__pfCasinoBridge?.slotsUpdateControls()}
  pfV322RebuildLever();

  /* Colin: keep the exact odds available, but explain the experience like a person instead of a calculator. */
  const pfV322ChanceBase=pfRenderChances;pfRenderChances=function(){pfV322ChanceBase();const old=document.querySelector('.pf318-colin-chance');if(old){old.innerHTML=`<div class="pf318-colin-chance-head"><span>ABSURDLY IMPOSSIBLE CHASE</span><h3>Colin Barnes</h3><strong>1 in 567<sup>885</sup></strong><small>Basically a myth hiding inside the game.</small></div><p>Colin is not meant to feel like a normal rare pull. These comparisons are closer to how ridiculous the chance actually is:</p><div class="pf318-compare pf319-colin-facts pf322-colin-facts"><div><b>Lightning while being eaten by a shark</b><span>That nightmare scenario is still more likely than naturally pulling Colin.</span></div><div><b>Open packs for the rest of your life</b><span>You would not be meaningfully closer. A human lifetime is effectively nothing against Colin’s odds.</span></div><div><b>Give everybody on Earth a pack machine</b><span>Even if billions of people opened packs nonstop together, Colin would still effectively never appear.</span></div><div><b>Keep opening long after Earth is gone</b><span>You could run pack-opening machines for longer than stars and planets last and still have no reasonable expectation of seeing him.</span></div><div><b>The point</b><span>Colin Barnes is PackForge’s impossible legend — something you can technically pull, but should never expect to.</span></div></div>`}}

  /* Version notes now contain ONLY notable features, cards, and variants. */
  PF320_PLAYER_LOG.length=0;
  PF320_PLAYER_LOG.push(
    {version:'3.22',title:'Wheel + Chase Polish',items:['Money Wheel is larger, has mixed 80% RTP wedges, deeper labels, and a Spin button beneath the wheel.','Slots has a larger hinged lever whose metal arm actually follows the handle.','Wyatt Evans has five larger green dollar symbols and no center WE seal.','Colin Barnes rarity facts were rewritten in plain language.']},
    {version:'3.21',title:'Money Wheel + Chase Cards',items:['Money Wheel joined the Casino with an 80% base return and 5× jackpot.','Wyatt Evans received its black-and-green money card design.','Colin Barnes became the intentionally strange nearly blank chase card.']},
    {version:'3.20',title:'Auto Slots + Nebula',items:['Slots added AUTO / STOP AUTO that keeps running between PackForge pages.','Nebula replaced the Shattered variant.','Admin mode added the Bag ! custom-card creator.','Serialized cards returned to clean shiny-gold numbering.']},
    {version:'3.19',title:'Wyatt Evans + Slots',items:['Wyatt Evans was added as the 1-in-1,000,000 pack chase card.','Slots moved to the first Casino game and gained a physical lever.']},
    {version:'3.18',title:'Colin Barnes + Foundry',items:['Colin Barnes was added as PackForge’s nearly impossible global chase card.','Foundry gained its small reactive passive-income coin.','Campaign instructions were simplified.']},
    {version:'3.17',title:'Chances Upgrade',items:['The Chances page received the 10-pack comparison board and detailed pack profiles.']}
  );

  /* Refresh the badge/version label while preserving the one-time Matthew Bamford right-click bonus. */
  const pfV322VersionButton=document.getElementById('pfVButton');if(pfV322VersionButton){pfV322VersionButton.innerHTML=`<b>V3.22</b><small>LOG</small><span class="pf-vcount-dot">${PF320_PLAYER_LOG.reduce((n,v)=>n+v.items.length,0)}</span>`;pfV322VersionButton.title='Left click: new features/cards/variants · Right click: Matthew Bamford Bonus ($50K once)';pfV322VersionButton.onclick=openVersionLog;pfV322VersionButton.oncontextmenu=e=>{e.preventDefault();pfV320ClaimMatthew()}}

  try{renderPacks();renderCollection();pfV322ArrangeWheel();pfV322RebuildLever()}catch(e){console.warn('v3.22 refresh',e)}
  window.__pfV322Health=()=>{const seg=window.__pfCasinoBridge?.moneyWheelSegments||[];return({version:PF_VERSION,wheelRTP:seg.length?seg.reduce((a,b)=>a+b,0)/seg.length:0,wheelSegments:[...seg],adjacentBusts:seg.some((v,i)=>v===0&&seg[(i+1)%seg.length]===0),apologyPack:premiumPackDefs.recoverygod321?.effect,apologyCards:[JET_LUMAGUI_CARD.name,pfV321FixedRarity('medieval','Legendary').name,PF_WYATT_EVANS_CARD.name,pfV321FixedRarity('space','Mythic').name,pfV321FixedRarity('food','Common').name+' · Holo · Serialized · Grade 10 · #001/001'],wyattDollars:document.querySelectorAll('.pf321-wyatt-fx .cash').length,versionNotes:PF320_PLAYER_LOG});}


  /* ==================== v3.23 — PLAYER LOG / WHEEL / LEVER FIX ==================== */
  V317_CHANGELOG.unshift({version:'3.23',date:'September 15, 2026',title:'Casino Visual Fixes',changes:[
    ['🎡','Money Wheel controls','The Money Wheel now has a large permanent Spin button directly beneath it and much clearer wedge dividers.'],
    ['🎰','Slots lever rebuild','Slots now uses a larger exposed side lever with one solid chrome arm and attached handle.'],
    ['V','Cleaner update log','The V menu now lists only new cards, rarities, packs, variants, and player-facing features.']
  ]});
  window.PF_CHANGELOG_V317=V317_CHANGELOG;

  /* Player-facing log only. No balancing, economy repair, RTP, caching, or implementation notes. */
  PF320_PLAYER_LOG.length=0;
  PF320_PLAYER_LOG.push(
    {version:'3.21',title:'Money Wheel',items:['Wyatt Evans received its black-and-green signature chase-card design.','Colin Barnes became the nearly impossible global chase card.']},
    {version:'3.20',title:'Nebula + Auto Slots',items:['Nebula was added as a new card variant, replacing Shattered.','Slots gained AUTO / STOP AUTO.','Admin mode gained the Bag ! custom-card creator.']},
    {version:'3.19',title:'Wyatt Evans',items:['Wyatt Evans was added as a new 1-in-1,000,000 chase rarity and card.','Slots became the first Casino game.']},
    {version:'3.18',title:'Colin Barnes + Foundry',items:['Colin Barnes was added as PackForge’s impossible global chase card.','Foundry passive income was added to the Coin page.']},
    {version:'3.13',title:'Ascendant Expansion',items:['God and Ascendant were added as new chase rarities above Ghost.','Dinosaurs, Superheroes, Pokémon, Villains, and Mythology were added as permanent packs.','Every permanent set expanded to 125 cards.']}
  );

  openVersionLog=function(){let ov=document.getElementById('pfVLogModal');if(!ov){ov=document.createElement('div');ov.id='pfVLogModal';ov.className='modal-backdrop';document.body.appendChild(ov)}ov.classList.remove('hidden');ov.innerHTML=`<div class="pf-v317-log pf320-player-log"><div class="pf-v317-log-head"><div><small>PACKFORGE NEW CONTENT</small><h2>New stuff added</h2><p>Cards, rarities, packs, variants, and playable features only.</p></div><button class="close-x" id="pfVLogClose">×</button></div><div class="pf-v317-log-body">${PF320_PLAYER_LOG.map(v=>`<section class="pf-v317-version"><div class="pf-v317-version-head"><b>v${v.version} · ${v.title}</b></div><div class="pf320-log-items">${v.items.map(x=>`<p>• ${pfEscapeHtml(x)}</p>`).join('')}</div></section>`).join('')}</div></div>`;const close=()=>{ov.classList.add('hidden');ov.innerHTML=''};document.getElementById('pfVLogClose').onclick=close;ov.onmousedown=e=>{if(e.target===ov)close()}};

  /* Wheel controls are static in the HTML now; this only normalizes the button state. */
  const pfV323Spin=document.getElementById('moneyWheelSpinBtn');
  if(pfV323Spin){pfV323Spin.textContent='SPIN THE WHEEL';pfV323Spin.classList.add('pf323-wheel-spin')}

  /* Replace every previous lever experiment with one exposed mechanical arm. */
  function pfV323RebuildLever(){
    const old=document.getElementById('slotsLever');if(!old||old.dataset.v323==='1')return;
    const lever=document.createElement('button');
    lever.id='slotsLever';lever.type='button';lever.className='pf323-slot-lever';lever.dataset.v323='1';lever.setAttribute('aria-label','Pull slot lever to spin');
    lever.innerHTML='<span class="pf323-lever-plate"><span class="pf323-lever-pivot"></span><span class="pf323-lever-arm"><i></i><b></b></span><span class="pf323-lever-stop"></span></span><small>PULL</small>';
    old.replaceWith(lever);
    let y0=0,pull=0,drag=false,suppress=false;
    const set=v=>{pull=Math.max(0,Math.min(1,v));lever.style.setProperty('--pull',pull.toFixed(3));lever.style.setProperty('--arm-angle',`${(-8+pull*80).toFixed(2)}deg`)};
    const fire=()=>{if(window.__pfCasinoBridge?.slotsBusy())return;lever.classList.add('firing');set(1);setTimeout(()=>{lever.classList.remove('firing');set(0);window.__pfCasinoBridge?.slotsSpin()},330)};
    lever.addEventListener('pointerdown',e=>{if(window.__pfCasinoBridge?.slotsBusy())return;drag=true;y0=e.clientY;set(0);lever.classList.add('grabbing');lever.setPointerCapture?.(e.pointerId);e.preventDefault()});
    lever.addEventListener('pointermove',e=>{if(!drag)return;set((e.clientY-y0)/138);e.preventDefault()});
    const end=e=>{if(!drag)return;drag=false;lever.classList.remove('grabbing');const go=pull>.55;suppress=go;if(go)fire();else set(0);e?.preventDefault?.()};
    lever.addEventListener('pointerup',end);lever.addEventListener('pointercancel',end);
    lever.addEventListener('click',()=>{if(suppress){suppress=false;return}fire()});
    set(0);window.__pfCasinoBridge?.slotsUpdateControls();
  }
  pfV323RebuildLever();

  const pfV323VersionButton=document.getElementById('pfVButton');if(pfV323VersionButton){pfV323VersionButton.innerHTML=`<b>V3.25</b><small>NEW</small><span class="pf-vcount-dot">${PF320_PLAYER_LOG.reduce((n,v)=>n+v.items.length,0)}</span>`;pfV323VersionButton.title='New cards, rarities, packs, variants, and features';pfV323VersionButton.onclick=openVersionLog;pfV323VersionButton.oncontextmenu=e=>{e.preventDefault();pfV320ClaimMatthew()}}

  try{pfV323RebuildLever();window.__pfCasinoBridge?.moneyWheelMount()}catch(e){console.warn('v3.23 visual refresh',e)}
  window.__pfV323Health=()=>({version:PF_VERSION,spinButton:!!document.getElementById('moneyWheelSpinBtn'),lever:document.getElementById('slotsLever')?.dataset.v323==='1',versionNotes:PF320_PLAYER_LOG});


  /* ---------- PackForge v3.25: leaderboard-ready cleanup ---------- */
  try{
    // Money Wheel is retired. Remove any legacy player/admin UI or historical game rows that might survive old markup/state.
    document.querySelectorAll('[data-mcc-tab="wheel"],#mcc-wheel,.pf321-admin-wheel-settings,.pf320-rtp-note,.pf321-wheel-rtp').forEach(n=>n.remove());
    if(state.stats?.games)delete state.stats.games.moneywheel;
    if(state.casinoHistory)delete state.casinoHistory.moneywheel;
    if(state.pfAdminLab?.casino){delete state.pfAdminLab.casino.moneyWheelForcePct;delete state.pfAdminLab.casino.moneyWheelTarget;delete state.pfAdminLab.casino.moneyWheelPayout;}
    // Reward-code redemption is retired from the player UI. Internal reward helpers remain for fixed packs/admin tools.
    document.querySelectorAll('[data-pf-settings-tab="codes"],#pfSettingsPanel-codes,[data-pf316tab="codes"]').forEach(n=>n.remove());
    PF320_PLAYER_LOG.splice(0,PF320_PLAYER_LOG.length,
      {version:'3.20',title:'Auto Slots + Nebula',items:['Slots gained AUTO / STOP AUTO and keeps playing while you visit other PackForge pages.','Nebula replaced the old Shattered variant.','Admin mode gained the custom-card creator in the Bag.','Serialized cards received the shiny gold serial-number treatment.']},
      {version:'3.19',title:'Wyatt Evans',items:['Wyatt Evans was added as a new 1-in-1,000,000 chase card.','The free Semi-God showcase pack was added.','Slots moved to the first Casino tab.']},
      {version:'3.18',title:'Colin Barnes',items:['Colin Barnes was added as PackForge’s absurdly impossible global chase card.','Foundry gained its reactive passive-income coin.','Campaign instructions were simplified.']},
      {version:'3.16',title:'Admin Lab + Ascendant',items:['The expanded Admin Lab was added with exact card and pack testing tools.','Ascendant cards received the animated black-hole treatment.']},
      {version:'3.15',title:'Card Identity Update',items:['All permanent sets were expanded to 125 unique one-word card names.','God and Ascendant chase cards received dedicated pull and card effects.']},
      {version:'3.13',title:'God + Ascendant Expansion',items:['God and Ascendant were added above Ghost.','Dinosaurs, Superheroes, Pokémon, Villains, and Mythology became permanent pack sets.','Foundry passive income was added.']}
    );
    const badge=document.getElementById('pfVButton');if(badge){badge.innerHTML=`<b>V3.25</b><small>NEW</small><span class="pf-vcount-dot">${PF320_PLAYER_LOG.reduce((n,v)=>n+v.items.length,0)}</span>`;badge.title='New cards, rarities, packs, variants, and features only';badge.onclick=openVersionLog;badge.oncontextmenu=e=>{e.preventDefault();pfV320ClaimMatthew()}}
    save(true);
  }catch(e){console.warn('v3.25 cleanup',e)}


  /* ==================== v3.26 — CAMPAIGN TOUR OVERHAUL ==================== */
  function pfV326FocusMatch(x,focus){
    if(!x||!focus)return false;
    if(focus.type==='theme')return x.card.theme===focus.key;
    if(focus.type==='rarity')return (x.card.ghost?'Ghost':x.card.secret?'Secret':x.card.rarity)===focus.key;
    if(focus.type==='variant')return (x.copy.variant||'Normal')===focus.key;
    if(focus.type==='grade')return Number(x.copy.grade||0)>=9;
    return false;
  }
  function pfV326Eligible(){return allOwnedCopies().filter(x=>!x.copy.gradingUntil&&!copyIsCampaignCommitted(x.copy.uid)&&!copyIsShowcased(x.copy.uid))}
  function pfV326Metrics(def,cards=selectedCampaignCards()){
    const focus=pfV34Focus(def),rawPower=cards.reduce((n,x)=>n+x.power,0),matches=cards.filter(x=>pfV326FocusMatch(x,focus));
    const power=Math.round(rawPower+matches.reduce((n,x)=>n+x.power*.35,0));
    const teamBonus=Math.min(.35,Math.max(0,cards.length-1)*.04+matches.length*.06);
    return {focus,rawPower,power,matches:matches.length,teamBonus,cards};
  }
  function pfV326RouteKind(def){if(def?.rareCampaign)return {label:'GRAND INVITATIONAL',icon:'✦',copy:'A rare prestige event with the richest campaign reward pool.'};if(def?.difficulty==='easy')return {label:'QUICK STOP',icon:'⚡',copy:'Short, accessible, and ideal for fast pack-and-cash runs.'};if(def?.difficulty==='hard')return {label:'PRESTIGE TOUR',icon:'♛',copy:'High Power target, longer trip, and the strongest normal reward profile.'};return {label:'MAIN EVENT',icon:'◆',copy:'Balanced Power, time, and reward potential.'}}
  function pfV326Rank(total){const ranks=[[100,'ICON'],[60,'LEGEND'],[30,'HEADLINER'],[15,'CURATOR'],[5,'TRAVELER'],[0,'ROOKIE']];return ranks.find(([n])=>total>=n)?.[1]||'ROOKIE'}
  function pfV326Meta(){state.campaigns.v326=state.campaigns.v326&&typeof state.campaigns.v326==='object'?state.campaigns.v326:{history:[]};state.campaigns.v326.history=Array.isArray(state.campaigns.v326.history)?state.campaigns.v326.history.slice(0,8):[];return state.campaigns.v326}
  pfV326Meta();
  function pfV326Preview(def,m=null){m=m||{power:def.power,teamBonus:0};const tier=campaignTier(def,Math.max(def.power,m.power||def.power)),fallback=campaignRewardsForMinutes(def.baseMinutes||10,def.difficulty||'standard'),teamBonus=clamp(Number(m.teamBonus||0),0,.35),ratio=Math.max(1,(m.power||def.power)/def.power);return {tier,cash:Math.round((def.cashReward??fallback.cash)*(1+Math.min(.35,(ratio-1)*.025))*(1+teamBonus)),packs:(def.packs||0)+tier.bonusPacks,bonusPack:Math.min(.98,(def.packChance||0)+(tier.extraPackChance||0)+teamBonus*.8),special:Math.min(.90,(def.special||0)+(tier.specialBonus||0)+teamBonus*.18)}}
  function pfV326SortedFor(def){const f=pfV34Focus(def);return pfV326Eligible().map(x=>({...x,pf326Match:pfV326FocusMatch(x,f),pf326Effective:Math.round(x.power*(pfV326FocusMatch(x,f)?1.35:1))})).sort((a,b)=>b.pf326Effective-a.pf326Effective||Number(b.pf326Match)-Number(a.pf326Match)||b.power-a.power)}
  function pfV326AutoTeam(def,mode='qualify'){
    const pool=pfV326SortedFor(def);if(!pool.length)return [];
    if(mode==='max')return pool.slice(0,5);
    const out=[];let power=0;for(const x of pool){if(out.length>=5)break;out.push(x);power+=x.pf326Effective;if(power>=def.power)break}return out;
  }
  function pfV326SetTeam(def,mode){state.campaigns.selected=pfV326AutoTeam(def,mode).map(x=>x.copy.uid);markSaveDirty();save();renderCampaigns()}
  function pfV326OfferReadiness(def){const team=pfV326AutoTeam(def,'max'),m=pfV326Metrics(def,team);return {ready:m.power>=def.power,power:m.power,need:Math.max(0,def.power-m.power)}}
  function pfV326HistoryHTML(){const h=pfV326Meta().history;if(!h.length)return '<div class="pf326-empty">Complete a campaign and your recent tours will appear here.</div>';return `<div class="pf326-history">${h.slice(0,5).map(x=>`<div class="pf326-history-row"><div><b>${pfEscapeHtml(x.name)}</b><span>${pfEscapeHtml(x.tier)} · ${new Date(x.at).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</span></div><strong>${x.packs} pack${x.packs===1?'':'s'} · ${fmt(x.cash)}</strong></div>`).join('')}</div>`}
  function pfV326SideHTML(){const total=Number(state.campaigns.completed?.total||0),stamp=total%5,rank=pfV326Rank(total);return `<div class="pf326-side"><section class="pf326-side-card"><small class="pf326-eyebrow">CAMPAIGN PASSPORT</small><h3>${rank}</h3><p>Every completed tour adds a stamp. Every 5th tour awards a bonus core pack; every 25th also adds a special campaign pack.</p><div class="pf326-passport-line"><b>${stamp} / 5</b><span>${total.toLocaleString()} tours completed</span></div><div class="pf326-passport-track"><i style="width:${stamp/5*100}%"></i></div><div class="pf326-passport-reward">Next stamp reward: ${stamp===4?'on your next campaign':'in '+(5-stamp)+' campaigns'}.</div></section><section class="pf326-side-card"><small class="pf326-eyebrow">RECENT TOURS</small><h3>Campaign Log</h3>${pfV326HistoryHTML()}</section></div>`}
  function pfV326HubHead(){const total=Number(state.campaigns.completed?.total||0),rank=pfV326Rank(total);return `<div class="pf326-hub-head"><div><small>PACKFORGE CAMPAIGN TOUR</small><h2>Send your collection on the road.</h2><p>Pick a destination. Auto-build or hand-pick a team. Stronger teams finish faster and improve rewards.</p></div><div class="pf326-rank"><span>CAMPAIGN RANK</span><b>${rank}</b><span>${total.toLocaleString()} completed</span></div></div><div class="pf326-steps"><div class="pf326-step"><b>1 · PICK</b><span>Choose Quick, Main Event, or Prestige.</span></div><div class="pf326-step"><b>2 · BUILD</b><span>Use Auto Qualify or choose up to 5 cards.</span></div><div class="pf326-step"><b>3 · LAUNCH</b><span>The timer keeps running while you play elsewhere.</span></div></div>`}
  function pfV326OfferCard(def){const kind=pfV326RouteKind(def),f=pfV34Focus(def),r=pfV326OfferReadiness(def),p=pfV326Preview(def),reward=`${p.packs?`${p.packs} guaranteed pack${p.packs===1?'':'s'} · `:''}${fmt(p.cash)} cash`;return `<article class="pf326-offer ${r.ready?'ready':''} ${def.rareCampaign?'rare':''}" data-pf326-offer="${def.offerId}"><div class="pf326-offer-top"><span class="pf326-route-kind">${kind.icon} ${kind.label}</span><span class="pf326-ready ${r.ready?'yes':''}">${r.ready?'READY NOW':`NEED ${r.need.toLocaleString()} PWR`}</span></div><h3>${pfEscapeHtml(def.name)}</h3><p class="pf326-offer-lore">${kind.copy}</p><div class="pf326-focus-pill"><span>SPOTLIGHT</span><b>${pfEscapeHtml(f.label)}</b></div><div class="pf326-offer-stats"><div class="pf326-offer-stat"><small>POWER TARGET</small><b>${def.power.toLocaleString()}</b></div><div class="pf326-offer-stat"><small>BASE TIME</small><b>${campaignDurationLabel(def.baseMinutes)}</b></div></div><div class="pf326-offer-reward"><span>BASE REWARD</span><b>${reward}</b><span>${Math.round(p.bonusPack*100)}% bonus pack · ${Math.round(p.special*100)}% special pack</span></div><button class="pf326-offer-cta" data-pf326-build="${def.offerId}">BUILD TEAM →</button></article>`}
  function pfV326SelectOffer(id){const def=state.campaigns.offers.find(o=>o.offerId===id);if(!def)return;state.campaigns.flowOfferId=id;state.campaigns.selectedOfferId=id;state.campaigns.flowStep='team';state.campaigns.selected=[];markSaveDirty();save();renderCampaigns()}
  function pfV326RenderTeam(){const stage=$('#campaignStage'),def=campaignFlowOffer();if(!stage||!def){campaignResetFlow();renderCampaigns();return}const selected=selectedCampaignCards();state.campaigns.selected=selected.map(x=>x.copy.uid);const m=pfV326Metrics(def,selected),ready=selected.length>=1&&m.power>=def.power&&!activeCampaign(),speed=campaignSpeed(def,m.power),projected=campaignEffectiveMinutes(def,m.power),tier=campaignTier(def,Math.max(def.power,m.power)),preview=pfV326Preview(def,m),kind=pfV326RouteKind(def),ratio=m.power/def.power;let entries=pfV326SortedFor(def).filter(x=>!state.campaigns.selected.includes(x.copy.uid));if(campaignSearch){const q=campaignSearch.toLowerCase();entries=entries.filter(x=>x.card.name.toLowerCase().includes(q)||x.card.theme.toLowerCase().includes(q)||x.card.rarity.toLowerCase().includes(q)||(x.copy.variant||'').toLowerCase().includes(q))}entries=entries.slice(0,80);const tiers=campaignTierDefs;
    stage.innerHTML=`<div class="pf326-team-shell"><div class="pf326-team-top"><button class="pf326-back" id="pf326Back">← Destinations</button><div><small class="pf326-eyebrow">TEAM BUILDER</small><h2>${pfEscapeHtml(def.name)}</h2><p>${pfEscapeHtml(pfV34Focus(def).detail)} Spotlight is optional, never required.</p></div><span class="pf326-route-tag">${kind.icon} ${kind.label}</span></div><div class="pf326-builder-grid"><section class="pf326-builder-main"><div class="pf326-focus-pill"><span>SPOTLIGHT BONUS</span><b>${pfEscapeHtml(pfV34Focus(def).label)} · +35% Power</b></div><div class="pf326-builder-actions"><button class="primary" id="pf326Auto">AUTO QUALIFY</button><button id="pf326Max">MAX REWARDS</button><button id="pf326Clear">CLEAR TEAM</button></div><div class="campaign-team">${[0,1,2,3,4].map(i=>{const x=selected[i],match=x&&pfV326FocusMatch(x,pfV34Focus(def));return x?`<div class="campaign-slot filled ${match?'pf-focus-match':''}" style="--slot:${rarityColor[x.card.ghost?'Ghost':x.card.rarity]||'#fff'}"><button data-pf326-remove="${x.copy.uid}">×</button>${match?'<em>SPOTLIGHT</em>':''}<b>${pfEscapeHtml(x.card.name)}</b><small>${pfEscapeHtml(x.card.rarity)} · ${pfEscapeHtml(x.copy.variant||'Normal')}</small><span class="slot-power">${x.power.toLocaleString()}${match?` → ${Math.round(x.power*1.35).toLocaleString()}`:''} PWR</span></div>`:`<div class="campaign-slot"><small>${i===0?'SELECT A CARD':'OPTIONAL BONUS SLOT'}</small></div>`}).join('')}</div><div class="pf326-power-head"><div><span>EFFECTIVE TEAM POWER</span><b class="${m.power>=def.power?'ready':''}">${m.power.toLocaleString()} / ${def.power.toLocaleString()}</b></div><small>${m.rawPower.toLocaleString()} base · ${m.matches} spotlight · +${Math.round(m.teamBonus*100)}% team reward</small></div><div class="campaign-meter"><i style="width:${Math.min(100,ratio*100)}%"></i></div><div class="pf326-tier-ladder">${tiers.map(t=>`<div class="pf326-tier ${ratio>=t.ratio?'on':''} ${t.name===tier.name?'current':''}"><b>${t.name}</b><small>${t.ratio}× Power</small></div>`).join('')}</div></section><aside class="pf326-builder-side"><small class="pf326-eyebrow">LIVE REWARD PREVIEW</small><div class="pf326-reward-preview"><div><span>Projected time</span><b>${m.power>=def.power?campaignDurationLabel(projected):campaignDurationLabel(def.baseMinutes)}</b></div><div><span>Reward tier</span><b>${tier.name}</b></div><div><span>Cash</span><b>${fmt(preview.cash)}</b></div><div><span>Guaranteed packs</span><b>${preview.packs}</b></div><div><span>Bonus pack</span><b>${Math.round(preview.bonusPack*100)}%</b></div><div><span>Special pack</span><b>${Math.round(preview.special*100)}%</b></div></div><button class="pf326-launch" id="pf326Launch" ${ready?'':'disabled'}>${ready?'LAUNCH CAMPAIGN':'NEED MORE POWER'}</button><div class="pf326-team-help">Extra cards raise campaign rewards. Spotlight matches add both Power and reward bonus. Cards are never consumed—they are only unavailable until the tour ends.</div></aside></div><section class="pf326-picker"><div class="pf326-picker-head"><div><small class="pf326-eyebrow">YOUR ELIGIBLE CARDS</small><h3>Spotlight matches are listed first.</h3></div><input id="campaignSearch" value="${String(campaignSearch||'').replace(/"/g,'&quot;')}" placeholder="Search card, set, rarity…"></div><div class="campaign-card-list">${entries.length?entries.map(x=>`<button class="campaign-pick ${x.pf326Match?'pf-focus-pick':''}" data-pf326-add="${x.copy.uid}" ${selected.length>=5?'disabled':''} style="--rarity:${rarityColor[x.card.ghost?'Ghost':x.card.rarity]||'#fff'}"><span class="rarity-stripe"></span><span><b>${pfEscapeHtml(x.card.name)}</b><small>${pfEscapeHtml(themes.find(t=>t.id===x.card.theme)?.name||x.card.theme)} · ${pfEscapeHtml(x.card.rarity)} · ${pfEscapeHtml(x.copy.variant||'Normal')}${x.pf326Match?' · SPOTLIGHT':''}</small></span><span class="pick-power">${x.power.toLocaleString()}${x.pf326Match?`<small>+${Math.round(x.power*.35).toLocaleString()}</small>`:''}</span></button>`).join(''):'<div class="campaign-locked-note">No eligible cards match this search.</div>'}</div></section></div>`;
    $('#pf326Back').onclick=()=>{state.campaigns.flowStep='offers';state.campaigns.flowOfferId=null;state.campaigns.selected=[];save();renderCampaigns()};$('#pf326Auto').onclick=()=>pfV326SetTeam(def,'qualify');$('#pf326Max').onclick=()=>pfV326SetTeam(def,'max');$('#pf326Clear').onclick=()=>{state.campaigns.selected=[];save();renderCampaigns()};$$('[data-pf326-remove]').forEach(b=>b.onclick=()=>{state.campaigns.selected=state.campaigns.selected.filter(u=>u!==b.dataset.pf326Remove);save();renderCampaigns()});$$('[data-pf326-add]').forEach(b=>b.onclick=()=>{if(state.campaigns.selected.length>=5)return;state.campaigns.selected.push(b.dataset.pf326Add);save();renderCampaigns()});$('#pf326Launch').onclick=()=>{if(!ready)return;state.campaigns.selectedOfferId=def.offerId;campaignStart(def)};$('#campaignSearch').oninput=e=>{campaignSearch=e.target.value;renderCampaigns();const inp=$('#campaignSearch');if(inp){inp.focus();inp.setSelectionRange(inp.value.length,inp.value.length)}};
  }
  function pfV326Progress(a){const duration=a.durationMs||(a.endsAt-a.startedAt)||1;return clamp((Date.now()-a.startedAt)/duration,0,1)}
  function pfV326ActiveHTML(a){const def=a.offer,done=Date.now()>=a.endsAt,p=pfV326Progress(a),tier=campaignTier(def,a.power),owned=new Map(allOwnedCopies().map(x=>[x.copy.uid,x])),team=(a.cardUids||[]).map(u=>owned.get(u)).filter(Boolean),kind=pfV326RouteKind(def),focus=a.focus||pfV34Focus(def);return `<div class="pf326-active-wrap"><div class="pf326-active-card pf-campaign-run ${done?'done':''}" data-pf-campaign-slot="1"><div class="pf326-active-head"><div><small>${done?'TOUR COMPLETE':'CAMPAIGN ON THE ROAD'}</small><h2>${pfEscapeHtml(def.name)}</h2><p>${done?'Your cards are back. Collect the reward report and passport stamp.':`${kind.label} · ${pfEscapeHtml(focus.label)} · cards return automatically when the timer ends.`}</p></div><div class="pf326-active-tier"><span>REWARD TIER</span><b>${tier.name}</b><span>${Math.round((a.teamBonus||0)*100)}% team bonus</span></div></div><div class="pf326-route"><div class="pf326-route-line"><i style="width:${p*100}%"></i></div><div class="pf326-route-stops"><div class="pf326-route-stop"><i></i><span>DEPART</span></div><div class="pf326-route-stop"><i></i><span>SHOWCASE</span></div><div class="pf326-route-stop"><i></i><span>TRADING FLOOR</span></div><div class="pf326-route-stop"><i></i><span>AWARDS</span></div></div><div class="pf326-route-marker" style="left:${2+p*96}%"></div></div><div class="campaign-big-timer">${done?'COMPLETE':campaignTime(a.endsAt-Date.now())}</div><div class="campaign-progress"><i style="width:${p*100}%"></i></div><div class="pf326-active-stats"><span><small>POWER SENT</small><b>${a.power.toLocaleString()}</b></span><span><small>SPEED</small><b>${(a.speed||campaignSpeed(def,a.power)).toFixed((a.speed||1)>=10?0:1)}×</b></span><span><small>SPOTLIGHT</small><b>${a.focusMatches||0} match${a.focusMatches===1?'':'es'}</b></span><span><small>TEAM</small><b>${team.length} card${team.length===1?'':'s'}</b></span></div><div class="pf326-active-team">${team.map(x=>`<span>${pfEscapeHtml(x.card.name)} · ${x.power.toLocaleString()} PWR</span>`).join('')}</div>${done?'<button class="campaign-collect" data-pf-collect-campaign="1">COLLECT REWARDS + STAMP</button>':'<div class="campaign-help">You can leave this page or close PackForge. The campaign uses timestamps, not a background animation loop.</div>'}</div>${pfV326SideHTML()}</div>`}

  /* Wrap reward collection with campaign passport/history rewards. */
  const pfV326CollectBase=pfCollectCampaignSlot;
  pfCollectCampaignSlot=function(){const run=state.campaigns?.active;if(!run||Date.now()<run.endsAt)return pfV326CollectBase();const before={total:Number(state.campaigns.completed?.total||0),cash:Number(state.stats.campaignCash||0),packs:Number(state.stats.campaignPacksWon||0),specials:Number(state.stats.campaignSpecialsWon||0)};const tier=campaignTier(run.offer,run.power).name;const name=run.offer?.name||'Campaign';const power=run.power||0;const result=pfV326CollectBase();const afterTotal=Number(state.campaigns.completed?.total||before.total);const meta=pfV326Meta(),cash=Math.max(0,Number(state.stats.campaignCash||0)-before.cash),packs=Math.max(0,Number(state.stats.campaignPacksWon||0)-before.packs),specials=Math.max(0,Number(state.stats.campaignSpecialsWon||0)-before.specials);meta.history.unshift({name,tier,power,cash,packs:packs+specials,at:Date.now()});meta.history=meta.history.slice(0,8);const bonuses=[];if(afterTotal>before.total&&afterTotal%5===0){const core=campaignAddPack(null,false);if(core){bonuses.push(`Passport reward: ${core.theme} Pack`);state.stats.campaignPacksWon=(state.stats.campaignPacksWon||0)+1}}if(afterTotal>before.total&&afterTotal%25===0){const special=campaignAddPack(null,true);if(special){bonuses.push(`25-tour bonus: ${special.theme} Pack`);state.stats.campaignSpecialsWon=(state.stats.campaignSpecialsWon||0)+1}}if(bonuses.length){const list=document.querySelector('#confirmModal .campaign-reward-list');if(list)for(const text of bonuses){const row=document.createElement('div');row.className='campaign-reward-line pf326-bonus-line';row.innerHTML=`<span>★ ${pfEscapeHtml(text)}</span><b>BONUS</b>`;list.appendChild(row)}toast('Campaign Passport',bonuses.join(' · '))}markSaveDirty();save(true);renderHUD();updateBagCounts();if(!$('#view-campaigns')?.classList.contains('hidden'))renderCampaigns();return result};

  renderCampaigns=function(){ensureCampaignOffers();pfV34PromoteLegacyCampaign();pfV326Meta();const view=$('#view-campaigns'),list=$('#campaignList'),stage=$('#campaignStage');if(!view||!list||!stage)return;const title=view.querySelector('.view-title h1'),subtitle=view.querySelector('.view-title p');if(title)title.textContent='Campaign Tour';if(subtitle)subtitle.textContent='Choose a destination, build a team, and send your cards on collector exhibitions for cash, packs, and campaign rewards.';view.querySelectorAll('.pf318-campaign-steps').forEach(n=>n.remove());const lp=list.closest('.campaign-panel'),sp=stage.closest('.campaign-panel'),active=state.campaigns.active;view.classList.add('pf-campaign-v34','pf-campaign-v326');view.classList.toggle('pf326-team-mode',!active&&(state.campaigns.flowStep==='team'&&!!campaignFlowOffer()));if(active){if(lp)lp.style.display='none';if(sp)sp.style.display='block';stage.innerHTML=pfV326ActiveHTML(active);stage.querySelectorAll('[data-pf-collect-campaign]').forEach(b=>b.onclick=()=>pfCollectCampaignSlot());return}if(state.campaigns.flowStep==='team'&&campaignFlowOffer()){if(lp)lp.style.display='none';if(sp)sp.style.display='block';pfV326RenderTeam();return}state.campaigns.flowStep='offers';state.campaigns.flowOfferId=null;if(lp)lp.style.display='block';if(sp)sp.style.display='block';const offers=ensureCampaignOffers(),refreshLeft=campaignRefreshRemaining();list.innerHTML=pfV326HubHead()+`<div class="pf326-offer-head"><div><small class="pf326-eyebrow">AVAILABLE DESTINATIONS</small><h3>Choose your next tour</h3><p>Offers rotate. Spotlight bonuses are optional.</p></div><button class="campaign-refresh" id="campaignRefresh" ${refreshLeft>0?'disabled':''}>${campaignRefreshLabel(refreshLeft)}</button></div><div class="pf326-offer-grid">${offers.map(pfV326OfferCard).join('')}</div>`;stage.innerHTML=pfV326SideHTML();$$('[data-pf326-build]').forEach(b=>b.onclick=e=>{e.stopPropagation();pfV326SelectOffer(b.dataset.pf326Build)});$$('[data-pf326-offer]').forEach(c=>c.onclick=e=>{if(e.target.closest('button'))return;pfV326SelectOffer(c.dataset.pf326Offer)});$('#campaignRefresh')?.addEventListener('click',()=>{manualRefreshCampaigns();campaignResetFlow();save();renderCampaigns()})};

  /* Extend the cheap existing campaign heartbeat with the route marker only while Campaigns is visible. */
  const pfV326HeartbeatBase=window.pfCampaignHeartbeat;window.pfCampaignHeartbeat=function(){if(typeof pfV326HeartbeatBase==='function')pfV326HeartbeatBase();if($('#view-campaigns')?.classList.contains('hidden'))return;const a=state.campaigns?.active,marker=$('.pf326-route-marker'),line=$('.pf326-route-line i');if(!a||!marker)return;const p=pfV326Progress(a);marker.style.left=`${2+p*96}%`;if(line)line.style.width=`${p*100}%`};

  /* Player-facing version log: only new content/features. */
  PF320_PLAYER_LOG.unshift({version:'3.26',title:'Campaign Tour',items:['Campaigns were rebuilt into the new Campaign Tour with Quick, Main Event, and Prestige destinations.','Campaign Passport adds ranks, stamps, recent-tour history, and bonus pack milestones.','Campaign Team Builder adds Auto Qualify, Max Rewards, live reward previews, and clearer Spotlight bonuses.','Active campaigns now show a lightweight four-stop travel route instead of the old battle scene.']});
  const pfV326Badge=$('#pfVButton');if(pfV326Badge){pfV326Badge.innerHTML=`<b>V3.26</b><small>NEW</small><span class="pf-vcount-dot">${PF320_PLAYER_LOG.reduce((n,v)=>n+v.items.length,0)}</span>`;pfV326Badge.title='New cards, rarities, packs, variants, and features only';pfV326Badge.onclick=openVersionLog;pfV326Badge.oncontextmenu=e=>{e.preventDefault();pfV320ClaimMatthew()}}
  window.__pfV326Health=()=>({version:PF_VERSION,offers:state.campaigns?.offers?.length||0,rank:pfV326Rank(Number(state.campaigns.completed?.total||0)),history:pfV326Meta().history.length,passportStamp:Number(state.campaigns.completed?.total||0)%5,active:!!state.campaigns?.active,autoTeam:state.campaigns?.offers?.[0]?pfV326AutoTeam(state.campaigns.offers[0],'qualify').length:0});


  /* ==================== v3.27 — 25-RANK CAMPAIGN REP ==================== */
  const PF327_RANKS=[
    [1,'ROOKIE',0],[2,'PROSPECT',250],[3,'STARTER',600],[4,'BRONZE I',1050],[5,'BRONZE II',1600],[6,'BRONZE III',2300],
    [7,'SILVER I',3150],[8,'SILVER II',4200],[9,'SILVER III',5500],[10,'GOLD I',7100],[11,'GOLD II',9000],[12,'GOLD III',11300],
    [13,'PLATINUM I',14000],[14,'PLATINUM II',17200],[15,'PLATINUM III',21000],[16,'DIAMOND I',25500],[17,'DIAMOND II',30800],[18,'DIAMOND III',37000],
    [19,'MASTER I',44200],[20,'MASTER II',52500],[21,'MASTER III',62000],[22,'ELITE I',73000],[23,'ELITE II',85500],[24,'ELITE III',99500],[25,'ICON',115000]
  ].map(([rank,name,xp])=>({rank,name,xp}));
  const PF327_RANK_COLORS=[
    ['#8fa2b8','143,162,184'],['#8fa2b8','143,162,184'],['#8fa2b8','143,162,184'],
    ['#cf8858','207,136,88'],['#cf8858','207,136,88'],['#cf8858','207,136,88'],
    ['#d9e3ef','217,227,239'],['#d9e3ef','217,227,239'],['#d9e3ef','217,227,239'],
    ['#ffd36d','255,211,109'],['#ffd36d','255,211,109'],['#ffd36d','255,211,109'],
    ['#7ce7d5','124,231,213'],['#7ce7d5','124,231,213'],['#7ce7d5','124,231,213'],
    ['#72dfff','114,223,255'],['#72dfff','114,223,255'],['#72dfff','114,223,255'],
    ['#be8cff','190,140,255'],['#be8cff','190,140,255'],['#be8cff','190,140,255'],
    ['#ff7d9d','255,125,157'],['#ff7d9d','255,125,157'],['#ff7d9d','255,125,157'],
    ['#fff0a3','255,240,163']
  ];
  function pfV327Meta(){
    const m=pfV326Meta();
    if(!Number.isFinite(Number(m.rankPoints))){m.rankPoints=Math.max(0,Math.round(Number(state.campaigns.completed?.total||0)*200));m.rankSeeded=true}
    m.rankPoints=Math.max(0,Math.floor(Number(m.rankPoints)||0));
    return m
  }
  function pfV327Rank(points=pfV327Meta().rankPoints){let cur=PF327_RANKS[0];for(const r of PF327_RANKS)if(points>=r.xp)cur=r;return cur}
  function pfV327NextRank(points=pfV327Meta().rankPoints){const cur=pfV327Rank(points);return PF327_RANKS.find(r=>r.rank===cur.rank+1)||null}
  function pfV327CampaignPoints(def){
    if(!def)return 0;const p=Math.max(1,Number(def.power)||1),mins=Math.max(1,Number(def.baseMinutes||def.minutes)||1);
    const difficulty=def.rareCampaign?250:def.difficulty==='hard'?100:def.difficulty==='standard'?45:0;
    return Math.max(100,Math.round(90+Math.sqrt(p)*3.4+mins*4+difficulty))
  }
  function pfV327RankState(points=pfV327Meta().rankPoints){const cur=pfV327Rank(points),next=pfV327NextRank(points);const base=cur.xp,span=next?Math.max(1,next.xp-base):1,pct=next?clamp((points-base)/span*100,0,100):100;const color=PF327_RANK_COLORS[cur.rank-1]||PF327_RANK_COLORS[0];return {points,cur,next,pct,color}}
  function pfV327RankBadgeHTML(){const s=pfV327RankState(),toNext=s.next?Math.max(0,s.next.xp-s.points):0;return `<div class="pf327-rank-badge" id="pf327RankBadge" style="--rank-color:${s.color[0]};--rank-rgb:${s.color[1]}" title="Campaign Rank ${s.cur.rank}: ${s.cur.name}"><div class="pf327-rank-shield"><span>CAMPAIGN RANK</span><b>${String(s.cur.rank).padStart(2,'0')}</b><strong>${s.cur.name}</strong></div><div class="pf327-rank-track"><i style="width:${s.pct}%"></i></div><small class="pf327-rank-caption">${s.next?`${pfCompactNumber(toNext,0)} REP TO RANK ${String(s.next.rank).padStart(2,'0')}`:'MAX RANK'}</small><div class="pf327-rank-panel hidden" id="pf327RankPanel"><h4>Campaign Rank</h4><p>Complete campaigns to earn REP. Harder Power requirements award more REP, so tougher tours move you faster.</p><div class="pf327-rank-list">${PF327_RANKS.map(r=>`<div class="pf327-rank-row ${r.rank===s.cur.rank?'current':r.rank<s.cur.rank?'passed':''}"><b>${String(r.rank).padStart(2,'0')}</b><span>${r.name}</span><small>${r.rank===1?'START':pfCompactNumber(r.xp,0)+' REP'}</small></div>`).join('')}</div></div></div>`}
  function pfV327EnsureRankBadge(view=$('#view-campaigns')){if(!view)return;let old=$('#pf327RankBadge');if(old)old.remove();view.insertAdjacentHTML('afterbegin',pfV327RankBadgeHTML());const badge=$('#pf327RankBadge'),panel=$('#pf327RankPanel');if(badge&&panel)badge.onclick=e=>{if(e.target.closest('.pf327-rank-panel'))return;panel.classList.toggle('hidden')}}
  function pfV327SideHTML(){const total=Number(state.campaigns.completed?.total||0),stamp=total%5;return `<div class="pf326-side"><section class="pf326-side-card pf327-stamps"><small class="pf326-eyebrow">TOUR STAMPS</small><h3>${total.toLocaleString()} completed</h3><p>Every completed tour adds a stamp. Every 5th tour awards a bonus core pack; every 25th also adds a special campaign pack.</p><div class="pf326-passport-line"><b>${stamp} / 5</b><span>next core-pack milestone</span></div><div class="pf326-passport-track"><i style="width:${stamp/5*100}%"></i></div><div class="pf326-passport-reward">${stamp===4?'Next campaign earns the stamp reward.':`${5-stamp} campaign${5-stamp===1?'':'s'} until the next stamp reward.`}</div></section><section class="pf326-side-card"><small class="pf326-eyebrow">RECENT TOURS</small><h3>Campaign Log</h3>${pfV326HistoryHTML()}</section></div>`}
  function pfV327HubHead(){return `<div class="pf326-hub-head"><div><small>PACKFORGE CAMPAIGN TOUR</small><h2>Send your collection on the road.</h2><p>Pick a destination, build a team, and earn Campaign REP while your cards tour.</p></div></div><div class="pf326-steps"><div class="pf326-step"><b>1 · PICK</b><span>Choose a destination.</span></div><div class="pf326-step"><b>2 · BUILD</b><span>Meet its Power requirement.</span></div><div class="pf326-step"><b>3 · EARN REP</b><span>Harder campaigns rank you up faster.</span></div></div>`}
  function pfV327OfferCard(def){const kind=pfV326RouteKind(def),f=pfV34Focus(def),r=pfV326OfferReadiness(def),p=pfV326Preview(def),rep=pfV327CampaignPoints(def);const reward=`${p.packs?`${p.packs} PACK${p.packs===1?'':'S'} + `:''}${fmt(p.cash)}`;return `<article class="pf326-offer ${r.ready?'ready':''} ${def.rareCampaign?'rare':''}" data-pf326-offer="${def.offerId}"><div class="pf326-offer-top"><span class="pf326-route-kind">${kind.icon} ${kind.label}</span><span class="pf326-ready ${r.ready?'yes':''}">${r.ready?'READY NOW':`NEED ${r.need.toLocaleString()} PWR`}</span></div><h3>${pfEscapeHtml(def.name)}</h3><div class="pf327-power-hero"><small>POWER</small><b>${def.power.toLocaleString()}</b></div><div class="pf327-offer-quick"><span><small>TIME</small><b>${campaignDurationLabel(def.baseMinutes)}</b></span><span><small>BASE REWARD</small><b>${reward}</b></span></div><div class="pf327-offer-minor"><strong>${pfEscapeHtml(f.label)}</strong> · +${rep.toLocaleString()} REP · ${Math.round(p.bonusPack*100)}% bonus · ${Math.round(p.special*100)}% special</div><button class="pf326-offer-cta" data-pf326-build="${def.offerId}">BUILD TEAM →</button></article>`}

  /* Award Campaign REP only when a completed campaign is actually collected. */
  const pfV327CollectBase=pfCollectCampaignSlot;
  pfCollectCampaignSlot=function(){const run=state.campaigns?.active;if(!run||Date.now()<run.endsAt)return pfV327CollectBase();const points=pfV327CampaignPoints(run.offer),before=pfV327RankState(),result=pfV327CollectBase();const meta=pfV327Meta();meta.rankPoints+=points;const after=pfV327RankState(meta.rankPoints);const list=document.querySelector('#confirmModal .campaign-reward-list');if(list){const row=document.createElement('div');row.className='campaign-reward-line pf327-rep-earned';row.innerHTML=`<span>◆ Campaign REP</span><b>+${points.toLocaleString()} REP</b>`;list.appendChild(row)}if(after.cur.rank>before.cur.rank){toast(`Campaign Rank ${after.cur.rank}`,`${after.cur.name} reached · ${pfCompactNumber(after.points,0)} total REP`);try{confetti(18)}catch(e){}}markSaveDirty();save(true);renderHUD();if(!$('#view-campaigns')?.classList.contains('hidden'))renderCampaigns();return result};

  /* Cleaner offer board + persistent 25-rank badge on every Campaign screen. */
  renderCampaigns=function(){ensureCampaignOffers();pfV34PromoteLegacyCampaign();pfV327Meta();const view=$('#view-campaigns'),list=$('#campaignList'),stage=$('#campaignStage');if(!view||!list||!stage)return;pfV327EnsureRankBadge(view);const title=view.querySelector('.view-title h1'),subtitle=view.querySelector('.view-title p');if(title)title.textContent='Campaign Tour';if(subtitle)subtitle.textContent='Choose a tour, meet the Power requirement, and earn Campaign REP toward 25 ranks.';view.querySelectorAll('.pf318-campaign-steps').forEach(n=>n.remove());const lp=list.closest('.campaign-panel'),sp=stage.closest('.campaign-panel'),active=state.campaigns.active;view.classList.add('pf-campaign-v34','pf-campaign-v326','pf-campaign-v327');view.classList.toggle('pf326-team-mode',!active&&(state.campaigns.flowStep==='team'&&!!campaignFlowOffer()));if(active){if(lp)lp.style.display='none';if(sp)sp.style.display='block';stage.innerHTML=pfV326ActiveHTML(active);const oldSide=stage.querySelector('.pf326-side');if(oldSide)oldSide.outerHTML=pfV327SideHTML();stage.querySelectorAll('[data-pf-collect-campaign]').forEach(b=>b.onclick=()=>pfCollectCampaignSlot());return}if(state.campaigns.flowStep==='team'&&campaignFlowOffer()){if(lp)lp.style.display='none';if(sp)sp.style.display='block';pfV326RenderTeam();return}state.campaigns.flowStep='offers';state.campaigns.flowOfferId=null;if(lp)lp.style.display='block';if(sp)sp.style.display='block';const offers=ensureCampaignOffers(),refreshLeft=campaignRefreshRemaining();list.innerHTML=pfV327HubHead()+`<div class="pf326-offer-head"><div><small class="pf326-eyebrow">AVAILABLE DESTINATIONS</small><h3>Choose your next tour</h3><p>Power, time, reward, and REP — everything important at a glance.</p></div><button class="campaign-refresh" id="campaignRefresh" ${refreshLeft>0?'disabled':''}>${campaignRefreshLabel(refreshLeft)}</button></div><div class="pf326-offer-grid">${offers.map(pfV327OfferCard).join('')}</div>`;stage.innerHTML=pfV327SideHTML();$$('[data-pf326-build]').forEach(b=>b.onclick=e=>{e.stopPropagation();pfV326SelectOffer(b.dataset.pf326Build)});$$('[data-pf326-offer]').forEach(c=>c.onclick=e=>{if(e.target.closest('button'))return;pfV326SelectOffer(c.dataset.pf326Offer)});$('#campaignRefresh')?.addEventListener('click',()=>{manualRefreshCampaigns();campaignResetFlow();save();renderCampaigns()})};

  PF320_PLAYER_LOG.unshift({version:'3.27',title:'Campaign Ranks',items:['Campaigns now have a 25-rank REP progression system with a large rank badge and full rank ladder.','Harder campaigns award more Campaign REP, so higher-Power tours rank you up faster.','Campaign destination cards were cleaned up so Power, time, rewards, and REP are much easier to read at a glance.']});
  const pfV327Badge=$('#pfVButton');if(pfV327Badge){pfV327Badge.innerHTML=`<b>V3.27</b><small>NEW</small><span class="pf-vcount-dot">${PF320_PLAYER_LOG.reduce((n,v)=>n+v.items.length,0)}</span>`;pfV327Badge.title='New cards, rarities, packs, variants, and features only';pfV327Badge.onclick=openVersionLog;pfV327Badge.oncontextmenu=e=>{e.preventDefault();pfV320ClaimMatthew()}}
  window.__pfV327Health=()=>{const s=pfV327RankState();return {version:PF_VERSION,rank:s.cur.rank,rankName:s.cur.name,rankPoints:s.points,nextRank:s.next?.rank||null,offerRep:(state.campaigns?.offers||[]).map(o=>pfV327CampaignPoints(o)),offers:state.campaigns?.offers?.length||0,active:!!state.campaigns?.active}};


  /* ==================== PackForge v3.28 — Campaign Counter + 250 Card Sets ==================== */
  const PF328_SET_IDS=["medieval","food","ocean","space","monsters","dinosaurs","superheroes","villains","pokemon","mythology"];
  const PF328_TOP_NAMES={"medieval":{"Ultra":["Paladin","Templar","Champion","Warlord","Warmaster","Archmage","Kingslayer","Dragonlord","Lionheart","Stormguard","Dreadknight","Spellblade","Highking","Runeblade","Warcrown"],"Secret":["Excalibur","Caliburn","Longinus","Grail","Camelot","Merlin","Morgana","Arthur","Pendragon","Lancelot"],"Ghost":["Hollowking","Graveknight","Wraithcrown","Nightkeep","Deathbanner","Lostthrone","Blackcastle"],"God":["Avalon","Everking","Godcrown","Dragonheart","Sunsword"],"Ascendant":["Eternity","Dominion","Ascension"]},"food":{"Ultra":["Caviar","Truffle","Saffron","Wagyu","Foiegras","Lobster","Omakase","Tiramisu","Macaron","Prosciutto","Burrata","Paella","Souffle","Gelato","Croissant"],"Secret":["Kobe","Beluga","Matsutake","Almas","Yubari","Iberico","Wasabi","Kopi","Manuka","Morel"],"Ghost":["Ghostpepper","Mooncake","Blackgarlic","Dragonfruit","Deathwish","Nightshade","Absinthe"],"God":["Ambrosia","Nectar","Manna","Cornucopia","Banquet"],"Ascendant":["Feast","Eden","Elysium"]},"ocean":{"Ultra":["Megalodon","Mosasaurus","Orca","Colossalsquid","GiantIsopod","Greatwhite","Bluewhale","Tigershark","Nautilus","Manta","Marlin","Swordfish","Hammerhead","Barracuda","WhaleShark"],"Secret":["Kraken","Maelstrom","Tsunami","Abyss","Trench","Blackwater","Tempest","Undertow","Whirlpool","Dreadnought"],"Ghost":["Phantomship","Drownedking","Ghostreef","Deadwater","Nighttide","Blacktrench","Siren"],"God":["Leviathan","Poseidon","Oceanus","Atlantis","Tiamat"],"Ascendant":["Charybdis","Nereus","Thalassa"]},"space":{"Ultra":["Quasar","Pulsar","Magnetar","Hypernova","Supernova","Nebula","Andromeda","Betelgeuse","Antares","Sagittarius","Kepler","Voyager","Artemis","Titan","Europa"],"Secret":["Eventhorizon","Darkmatter","Antimatter","Wormhole","Blazar","Neutronstar","Redgiant","Whitedwarf","Blackhole","Bigbang"],"Ghost":["Void","Eclipse","Darkstar","Deadstar","Nightspace","Nullspace","Shadowmoon"],"God":["Cosmos","Singularity","Infinity","Creation","Eternity"],"Ascendant":["Universe","Multiverse","Omniverse"]},"monsters":{"Ultra":["Dragon","Phoenix","Hydra","Chimera","Manticore","Basilisk","Kraken","Cerberus","Wendigo","Vampire","Werewolf","Lich","Demon","Oni","Sphinx"],"Secret":["Dracula","Cthulhu","Typhon","Jormungandr","Fenrir","Nuckelavee","Dullahan","Rakshasa","Abaddon","Lilith"],"Ghost":["Banshee","Wraith","Phantom","Revenant","Specter","Poltergeist","Nightmare"],"God":["Behemoth","Leviathan","Apophis","Ziz","Tiamat"],"Ascendant":["Oblivion","Apocalypse","Armageddon"]},"dinosaurs":{"Ultra":["Allosaurus","Carnotaurus","Baryonyx","Suchomimus","Utahraptor","Deinonychus","Ankylosaurus","Triceratops","Stegosaurus","Therizinosaurus","Albertosaurus","Daspletosaurus","Gorgosaurus","Yutyrannus","Deinocheirus"],"Secret":["Mapusaurus","Tarbosaurus","Austroraptor","Torvosaurus","Megalosaurus","Microraptor","Concavenator","Cryolophosaurus","Monolophosaurus","Irritator"],"Ghost":["Archaeopteryx","Dilophosaurus","Velociraptor","Ceratosaurus","Oviraptor","Troodon","Compsognathus"],"God":["Carcharodontosaurus","Acrocanthosaurus","Argentinosaurus","Dreadnoughtus","Patagotitan"],"Ascendant":["Tyrannosaurus","Spinosaurus","Giganotosaurus"]},"superheroes":{"Ultra":["Batman","WonderWoman","Flash","Aquaman","Shazam","Thor","Hulk","Wolverine","DoctorStrange","CaptainMarvel","GreenLantern","Supergirl","Invincible","Spawn","Hellboy"],"Secret":["IronMan","SpiderMan","BlackPanther","ScarletWitch","Vision","Nova","Quasar","MartianManhunter","GhostRider","Deadpool"],"Ghost":["Moonknight","Raven","DrFate","Swampthing","Nightwing","Daredevil","Blade"],"God":["Sentry","BlueMarvel","SilverSurfer","Hyperion","Gladiator"],"Ascendant":["Superman","Phoenix","Spectre"]},"villains":{"Ultra":["Joker","Doom","Magneto","Ultron","Loki","Carnage","Venom","Apocalypse","Sinister","Juggernaut","Doomsday","Zod","Sinestro","Brainiac","Kang"],"Secret":["Hela","Surtur","Annihilus","Onslaught","Nimrod","Trigon","ReverseFlash","Morlun","Blackheart","Shadowking"],"Ghost":["Scarecrow","Deathstroke","RaAlGhul","Blackmask","Dracula","Bane","Mysterio"],"God":["Beyonder","Knull","Dormammu","Mephisto","AntiMonitor"],"Ascendant":["Darkseid","Thanos","Galactus"]},"pokemon":{"Ultra":["Charizard","Dragonite","Tyranitar","Metagross","Garchomp","Salamence","Gyarados","Lucario","Gengar","Blaziken","Greninja","Dragapult","Baxcalibur","Volcarona","Haxorus"],"Secret":["Articuno","Zapdos","Moltres","Raikou","Entei","Suicune","Regirock","Regice","Registeel","Spiritomb"],"Ghost":["Lugia","HoOh","Rayquaza","Kyogre","Groudon","Giratina","Necrozma"],"God":["Dialga","Palkia","Zygarde","Eternatus","Deoxys"],"Ascendant":["Mew","Mewtwo","Arceus"]},"mythology":{"Ultra":["Hercules","Achilles","Perseus","Odysseus","Thor","Loki","Anubis","Horus","Quetzalcoatl","Amaterasu","Hanuman","Ganesha","Athena","Ares","Hades"],"Secret":["Fenrir","Jormungandr","Surtr","Typhon","Medusa","Cerberus","Hydra","Kraken","Sphinx","Minotaur"],"Ghost":["Nyx","Erebus","Thanatos","Hecate","Morrigan","Hel","Ankou"],"God":["Zeus","Odin","Ra","Shiva","Vishnu"],"Ascendant":["Chaos","Gaia","Brahma"]}};
  const PF328_ROOTS={"medieval":["Iron","Crown","Castle","Knight","Dragon","Raven","Wolf","Lion","Stone","Oak","Thorn","Sword","Shield","Battle","King","Queen","War","Frost","Ember","Shadow"],"food":["Apple","Berry","Cocoa","Honey","Sugar","Pepper","Garlic","Cheese","Butter","Caramel","Vanilla","Cherry","Lemon","Mango","Bacon","Truffle","Sushi","Taco","Pizza","Curry"],"ocean":["Blue","Deep","Coral","Reef","Tide","Wave","Shark","Whale","Shell","Storm","Salt","Kelp","Pearl","Harbor","Abyss","Current","Marlin","Manta","Crab","Ocean"],"space":["Star","Moon","Solar","Nova","Orbit","Lunar","Mars","Venus","Titan","Comet","Astro","Cosmo","Galaxy","Meteor","Saturn","Jupiter","Pluto","Rocket","Stellar","Void"],"monsters":["Blood","Bone","Grave","Moon","Night","Shadow","Fang","Claw","Skull","Dread","Crypt","Rot","Ash","Thorn","Mire","Hell","Doom","Gloom","Dark","Flesh"],"dinosaurs":["Aero","Terra","Raptor","Titan","Cera","Dino","Saur","Paleo","Rex","Mega","Proto","Orni","Thera","Spino","Ankylo","Stego","Tricera","Veloci","Carno","Allo"],"superheroes":["Star","Iron","Storm","Nova","Solar","Night","Steel","Thunder","Light","Shadow","Sky","Fire","Frost","Titan","Power","Valor","Justice","Rocket","Cosmic","Ultra"],"villains":["Dark","Black","Doom","Night","Blood","Void","Grave","Iron","Shadow","Death","Skull","Venom","Ruin","Chaos","War","Frost","Inferno","Terror","Vile","Dread"],"pokemon":["Poke","Kanto","Johto","Hoenn","Sinnoh","Unova","Kalos","Alola","Galar","Paldea","Leaf","Flame","Aqua","Volt","Psy","Rock","Steel","Dragon","Fairy","Ghost"],"mythology":["Aether","Titan","Oracle","Rune","Fate","Olymp","Asgard","Nile","Sun","Moon","Storm","Under","Hero","Divine","Sacred","Myth","Legend","Chaos","Star","World"]};
  const PF328_SUFFIXES={"medieval":["guard","keep","forge","blade","helm","ward","watch","gate","hall","fort","spire","march"],"food":["cake","bite","roll","tart","pie","chip","bun","bar","drop","crisp","melt","bowl"],"ocean":["fin","reef","tide","wake","shell","crest","deep","bay","shoal","spray","wharf","current"],"space":["core","star","flare","dust","field","gate","drive","scope","beam","orbit","probe","world"],"monsters":["fang","claw","spawn","fiend","maw","shade","beast","ling","born","stalker","howl","curse"],"dinosaurs":["saurus","raptor","rex","titan","ceratops","don","venator","draco","pelta","mimus","gnathus","lophus"],"superheroes":["flare","guard","bolt","strike","wing","star","force","light","shield","blade","rider","sentinel"],"villains":["bane","doom","fang","shade","wrath","scar","claw","lord","reign","terror","vex","curse"],"pokemon":["mon","fang","wing","tail","claw","spark","leaf","stone","beam","shell","horn","scale"],"mythology":["born","lord","bane","stone","fire","storm","song","crown","spear","shield","fate","wrath"]};
  const PF328_EXTRA_NAMES={"pokemon":["Meganium","Bayleef","Chikorita","Cyndaquil","Quilava","Typhlosion","Totodile","Croconaw","Feraligatr","Sentret","Furret","Hoothoot","Noctowl","Ledyba","Ledian","Spinarak","Ariados","Crobat","Chinchou","Lanturn","Pichu","Cleffa","Igglybuff","Togepi","Togetic","Natu","Xatu","Mareep","Flaaffy","Ampharos","Bellossom","Marill","Azumarill","Sudowoodo","Politoed","Hoppip","Skiploom","Jumpluff","Aipom","Sunkern","Sunflora","Yanma","Wooper","Quagsire","Espeon","Umbreon","Murkrow","Slowking","Misdreavus","Unown","Wobbuffet","Girafarig","Pineco","Forretress","Dunsparce","Gligar","Steelix","Snubbull","Granbull","Qwilfish","Scizor","Shuckle","Heracross","Sneasel","Teddiursa","Ursaring","Slugma","Magcargo","Swinub","Piloswine","Corsola","Remoraid","Octillery","Delibird","Mantine","Skarmory","Houndour","Houndoom","Kingdra","Phanpy","Donphan","Porygon2","Stantler","Smeargle","Tyrogue","Hitmontop","Smoochum","Elekid","Magby","Miltank","Blissey","Larvitar","Pupitar","Treecko","Grovyle","Sceptile","Torchic","Combusken","Mudkip","Marshtomp","Swampert","Ralts","Kirlia","Gardevoir","Slakoth","Vigoroth","Slaking","Nincada","Ninjask","Shedinja","Whismur","Loudred","Exploud","Makuhita","Hariyama","Azurill","Nosepass","Skitty","Delcatty","Sableye","Mawile","Aron","Lairon","Aggron","Meditite","Medicham","Electrike","Manectric","Plusle","Minun","Volbeat","Illumise","Roselia","Gulpin","Swalot","Carvanha","Sharpedo","Wailmer","Wailord","Numel","Camerupt","Torkoal","Spoink","Grumpig","Spinda","Trapinch","Vibrava","Flygon","Cacnea","Cacturne","Swablu","Altaria","Zangoose","Seviper","Lunatone","Solrock","Barboach","Whiscash","Corphish","Crawdaunt","Baltoy","Claydol","Lileep","Cradily","Anorith","Armaldo","Feebas","Milotic","Castform","Kecleon","Shuppet","Banette","Duskull","Dusclops","Tropius","Chimecho","Absol","Wynaut","Snorunt","Glalie","Spheal","Sealeo","Walrein","Clamperl","Huntail","Gorebyss","Relicanth","Luvdisc","Bagon","Shelgon"],"mythology":["Enki","Enlil","Ishtar","Inanna","Marduk","Tiamat","Gilgamesh","Enkidu","Ereshkigal","Nergal","Nabu","Shamash","Sin","Dagon","Baal","Asherah","Astarte","Melqart","Dagda","Lugh","Brigid","Cernunnos","Aengus","Nuada","Manannan","Balor","Fomor","Macha","Badb","Rhiannon","Arawn","Pwyll","Bran","Branwen","Taliesin","Cuchulainn","Scathach","Fionn","Diarmuid","Oisin","Maui","Pele","Kane","Ku","Lono","Kanaloa","Tangaroa","Tane","Rongo","Hine","Tawhirimatea","Papatuanuku","Ranginui","Inti","Viracocha","Pachamama","Supay","Mamaquilla","Illapa","Manco","Coatlicue","Xipe","Mictlantecuhtli","Mictlancihuatl","Tonatiuh","Coyolxauhqui","Mixcoatl","Itzamna","Ixchel","Ahpuch","Hunabku","Camazotz","Huracan","Vucubcaquix","Nantosuelta","Taranis","Epona","Sucellos","Belenus","Toutatis","Coyote","Raven","Sedna","Nanook","Glooscap","Manitou","Wakan","Anansi","Oya","Oshun","Ogun","Shango","Obatala","Yemoja","Eshu","Olokun","Orunmila","Mawu","Lisa","Nyame","Amma","Nommo"]};
  const PF328_LOW_COUNTS={Common:70,Uncommon:50,Rare:35,Epic:25,Legendary:16,Mythic:9,Divine:5};
  function pf328CleanWord(v){return String(v||'').replace(/[^A-Za-z0-9]/g,'')}
  function pf328Reserved(id){return new Set(Object.values(PF328_TOP_NAMES[id]||{}).flat().map(x=>x.toLowerCase()))}
  function pf328LowerNames(t){
    const reserved=pf328Reserved(t.id),out=[],seen=new Set();
    const add=n=>{n=pf328CleanWord(n);const k=n.toLowerCase();if(!n||reserved.has(k)||seen.has(k))return;seen.add(k);out.push(n)};
    (PF_V315_NAMES[t.id]||[]).forEach(add);
    (PF328_EXTRA_NAMES[t.id]||[]).forEach(add);
    const roots=PF328_ROOTS[t.id]||['Card'],suffix=PF328_SUFFIXES[t.id]||['forge'];
    for(const a of roots)for(const b of suffix){add(a+b);if(out.length>=210)break} 
    if(out.length<210){for(let i=0;out.length<210;i++){const a=roots[i%roots.length],b=suffix[(i*7+3)%suffix.length],c=suffix[(i*11+5)%suffix.length];add(a+b+c)}}
    return out.slice(0,210)
  }
  function pf328BaseValue(t,rarity,index){const mult=rarityMult[rarity]||1;return Math.max(1,Math.round(t.base*mult*(.94+(index%9)*.018)))}
  function pf328ApplyCard(card,t,name,rarity,index){
    card.name=name;card.theme=t.id;card.rarity=rarity;card.secret=rarity==='Secret';card.ghost=rarity==='Ghost';card.godRarity=rarity==='God';card.ascendantRarity=rarity==='Ascendant';card.expansion=true;
    if(rarity==='Ghost'){card.value=Math.round(350000+index*55000);card.power=Math.round(1500000+index*350000)}
    else if(rarity==='God'){card.value=Math.round(1300000+index*240000);card.power=Math.round(15000000+index*3500000)}
    else if(rarity==='Ascendant'){card.value=Math.round(6500000+index*1250000);card.power=Math.round(100000000+index*25000000)}
    else if(rarity==='Secret'){card.value=Math.round(t.base*rarityMult.Secret*(1.15+index*.075));card.power=Math.round(16000+index*2600)}
    else {card.value=pf328BaseValue(t,rarity,index);card.power=fixedRarityPower(t.id,name,rarity)}
    card.flavor=flavorFor(t.id,name);
    return card
  }
  function pf328ExpandSet(t){
    if(!t||!PF328_TOP_NAMES[t.id])return;
    const cards=t.allCards.slice();
    for(let i=cards.length;i<250;i++){
      const c={id:`${t.id}_v328_${String(i).padStart(3,'0')}`,name:'',rarity:'Common',theme:t.id,value:1,power:1,secret:false,expansion:true,flavor:''};
      cards.push(c);allCards.push(c);cardMap[c.id]=c;
    }
    const lower=pf328LowerNames(t);let p=0,lowIndex=0;
    for(const [rarity,count] of Object.entries(PF328_LOW_COUNTS))for(let i=0;i<count;i++,p++,lowIndex++)pf328ApplyCard(cards[p],t,lower[lowIndex],rarity,i);
    for(const rarity of ['Ultra','Secret','Ghost','God','Ascendant']){
      const names=PF328_TOP_NAMES[t.id][rarity];
      names.forEach((name,i)=>pf328ApplyCard(cards[p++],t,name,rarity,i));
    }
    t.allCards=cards.slice(0,250);
    t.cards=t.allCards.filter(c=>['Common','Uncommon','Rare','Epic','Legendary','Mythic','Divine','Ultra'].includes(c.rarity));
    t.secretCards=t.allCards.filter(c=>c.secret);
    t.ghostCards=t.allCards.filter(c=>c.ghost);
    t.godCards=t.allCards.filter(c=>c.godRarity);
    t.ascendantCards=t.allCards.filter(c=>c.ascendantRarity);
    t.godCard=t.godCards[0];t.ascendantCard=t.ascendantCards[0];
  }
  PF328_SET_IDS.map(id=>themes.find(t=>t.id===id)).filter(Boolean).forEach(pf328ExpandSet);

  /* One rarity roll still chooses the tier first, then one card inside that tier. More cards, not inflated tier odds. */
  weightedCard=function(theme,mutation,autoMode=false,qualityBoost=1){
    autoMode=!!(autoMode||pfV313AutoRollContext);
    const chaseScale=(autoMode?.75:1)*overdriveBoost(),roll=Math.random(),ascChance=ASCENDANT_CARD_CHANCE*chaseScale,godChance=GOD_RARITY_CARD_CHANCE*chaseScale,ghostChance=GHOST_CARD_CHANCE*chaseScale,jetChance=JET_LUMAGUI_CARD_CHANCE;
    const choose=a=>a[Math.floor(Math.random()*Math.max(1,a.length))];
    if(!tutorialTrainingMode&&roll<ascChance){state.quirkStats.ascendantCards=(state.quirkStats.ascendantCards||0)+1;return {card:choose(theme.ascendantCards||[theme.ascendantCard]),nearMiss:null}}
    if(!tutorialTrainingMode&&roll<ascChance+godChance){state.quirkStats.godRarityCards=(state.quirkStats.godRarityCards||0)+1;return {card:choose(theme.godCards||[theme.godCard]),nearMiss:null}}
    if(!tutorialTrainingMode&&roll<ascChance+godChance+ghostChance){state.quirkStats.ghostCards=(state.quirkStats.ghostCards||0)+1;return {card:choose(theme.ghostCards||[GHOST_CARD]),nearMiss:null}}
    if(!tutorialTrainingMode&&roll<ascChance+godChance+ghostChance+jetChance){state.quirkStats.jetLumagui=(state.quirkStats.jetLumagui||0)+1;return {card:JET_LUMAGUI_CARD,nearMiss:null}}
    if(Math.random()<SECRET_CHANCE*(autoMode?.75:1)*overdriveBoost())return {card:choose(theme.secretCards),nearMiss:null};
    let pick=pfV313PickThemeRarity(theme,autoMode,qualityBoost),chosen=pick.rarity,nearMiss=pick.nearMiss;if(mutation?.id==='luckypulse'&&chosen==='Common'&&Math.random()<.68){pick=pfV313PickThemeRarity(theme,autoMode,qualityBoost);chosen=pick.rarity;nearMiss=pick.nearMiss}if(mutation?.id==='voidbloom'&&chosen==='Common')chosen='Uncommon';const pool=theme.cards.filter(c=>c.rarity===chosen);return {card:choose(pool.length?pool:theme.cards),nearMiss}
  };
  pfCardRollChance=function(card,theme,auto=false){
    const scale=auto?.75:1;
    if(card?.ascendantRarity)return ASCENDANT_CARD_CHANCE*scale/Math.max(1,theme.ascendantCards?.length||1);
    if(card?.godRarity)return GOD_RARITY_CARD_CHANCE*scale/Math.max(1,theme.godCards?.length||1);
    if(card?.ghost&&theme?.ghostCards?.includes(card))return GHOST_CARD_CHANCE*scale/Math.max(1,theme.ghostCards.length);
    if(card?.secret)return SECRET_CHANCE*scale/Math.max(1,theme.secretCards?.length||1);
    if(!card?.ghost&&!card?.jet){const special=Math.min(.02,(ASCENDANT_CARD_CHANCE+GOD_RARITY_CARD_CHANCE+GHOST_CARD_CHANCE)*scale+JET_LUMAGUI_CARD_CHANCE),secret=SECRET_CHANCE*scale,table=pfV313ThemeOdds(theme,auto),count=theme.cards.filter(c=>c.rarity===card.rarity).length;return (1-special)*(1-secret)*(table[card.rarity]||0)/Math.max(1,count)}
    return card?.jet?JET_LUMAGUI_CARD_CHANCE:(card===GHOST_CARD?GHOST_CARD_CHANCE*scale:0)
  };
  pfOddsCardEntries=function(theme){return [...theme.allCards,JET_LUMAGUI_CARD].map(card=>({card,manual:pfCardRollChance(card,theme,false),auto:pfCardRollChance(card,theme,true)}))};

  /* Shop / reference wording follows the 250-card checklist. */
  const pf328RenderShopBase=renderShop;renderShop=function(){pf328RenderShopBase();document.querySelectorAll('#shopGrid .shop-mini-pack small').forEach(el=>el.textContent='5 CARDS · 250 CARD SET');const note=document.getElementById('packTierNote');if(note)note.textContent='10 permanent sets · 250 cards each. Exact odds and pack differences are in the ? reference.'};
  const pf328OddsFamilyBase=pfOddsPackModeFamilyHTML;pfOddsPackModeFamilyHTML=function(tier){return pf328OddsFamilyBase(tier).replace(/125-card checklist/g,'250-card checklist').replace(/125 animated cards/g,'250 animated cards')};
  const pf328StatsBase=renderStats;renderStats=function(){pf328StatsBase();const grid=$('#setStatsGrid');if(grid)grid.innerHTML=themes.filter(themeIsVisible).map(t=>{const total=t.allCards.filter(c=>state.discovered[c.id]).length,owned=t.allCards.reduce((n,c)=>n+totalItemCount(state.inventory[c.id]),0),count=r=>t.allCards.filter(c=>c.rarity===r&&state.discovered[c.id]).length;return `<div class="set-stat"><b>${t.emoji} ${t.name}</b><span>${total}/${t.allCards.length} discovered<br>${count('Ultra')}/15 Ultra · ${count('Secret')}/10 Secret · ${count('Ghost')}/7 Ghost<br>${count('God')}/5 God · ${count('Ascendant')}/3 Ascendant<br>${owned.toLocaleString()} cards owned</span></div>`}).join('')};

  /* -------------------- Campaign completion counter -------------------- */
  function pf328Count(){return Math.max(0,Number(state.campaigns?.completed?.total||0))}
  function pf328BonusPct(count=pf328Count()){return Math.min(100,count)}
  function pf328CounterTier(count=pf328Count()){return count>=100?'apex':count>=75?'gold':count>=50?'silver':count>=25?'bronze':'base'}
  function pf328MilestoneText(count=pf328Count()){const next=(Math.floor(count/25)+1)*25;if(count>=100)return `MAX +100% campaign reward bonus · next milestone at ${next}`;return `+${pf328BonusPct(count)}% campaign reward bonus · next milestone at ${next}`}
  function pf328CounterHTML(){const count=pf328Count(),tier=pf328CounterTier(count),pct=pf328BonusPct(count);return `<div class="pf328-counter ${tier}" id="pf328Counter" title="${count} campaigns completed · click for bonuses"><b>${String(count).padStart(3,'0')}</b><div class="pf328-counter-panel hidden" id="pf328CounterPanel"><h3>Campaign Level ${String(count).padStart(3,'0')}</h3><p>Every completed campaign adds exactly 1. Your campaign rewards gain +1% per completion, capped at +100% after 100 campaigns.</p><div class="pf328-bonus-grid"><span><b>+${pct}%</b> cash</span><span><b>+${pct}%</b> pack rewards</span><span><b>+${pct}%</b> special-pack chance</span></div><div class="pf328-milestones"><b>Milestones</b><span>025 · Special Pack</span><span>050 · Core + Special Pack</span><span>075 · 2 Special Packs</span><span>100 · Semi-God Pack + max bonus</span></div><small>${pf328MilestoneText(count)}</small></div></div>`}
  function pf328MountCounter(){const view=$('#view-campaigns');if(!view)return;$('#pf327RankBadge')?.remove();$('#pf328Counter')?.remove();view.insertAdjacentHTML('afterbegin',pf328CounterHTML());const box=$('#pf328Counter'),panel=$('#pf328CounterPanel');if(box&&panel)box.onclick=e=>{if(e.target.closest('.pf328-counter-panel'))return;panel.classList.toggle('hidden')}}
  function pf328ApplyPreviewBonus(p,count=pf328Count()+1){const pct=Math.min(1,pf328BonusPct(count)/100),out={...p};out.cash=Math.round(out.cash*(1+pct));out.bonusPack=Math.min(.98,1-(1-out.bonusPack)*(1-pct*.5));out.special=Math.min(.90,out.special*(1+pct));return out}
  function pf328OfferCard(def){const kind=pfV326RouteKind(def),f=pfV34Focus(def),r=pfV326OfferReadiness(def),p=pf328ApplyPreviewBonus(pfV326Preview(def)),reward=`${p.packs?`${p.packs} PACK${p.packs===1?'':'S'} + `:''}${fmt(p.cash)}`;return `<article class="pf326-offer pf328-offer ${r.ready?'ready':''} ${def.rareCampaign?'rare':''}" data-pf326-offer="${def.offerId}"><div class="pf326-offer-top"><span class="pf326-route-kind">${kind.icon} ${kind.label}</span><span class="pf326-ready ${r.ready?'yes':''}">${r.ready?'READY':`NEED ${pfCompactNumber(r.need,2)} PWR`}</span></div><h3>${pfEscapeHtml(def.name)}</h3><div class="pf328-offer-core"><div><small>POWER</small><b>${pfCompactNumber(def.power,2)}</b></div><div><small>TIME</small><b>${campaignDurationLabel(def.baseMinutes)}</b></div><div class="reward"><small>REWARD</small><b>${reward}</b></div></div><div class="pf328-offer-foot"><span>${pfEscapeHtml(f.label)}</span><span>+${pf328BonusPct(pf328Count()+1)}% LEVEL BONUS</span><span>${Math.round(p.bonusPack*100)}% BONUS · ${Math.round(p.special*100)}% SPECIAL</span></div><button class="pf326-offer-cta" data-pf326-build="${def.offerId}">BUILD TEAM →</button></article>`}
  function pf328HubHead(){return `<div class="pf326-hub-head pf328-hub"><div><small>PACKFORGE CAMPAIGN TOUR</small><h2>Pick a tour. Build the team. Let it run.</h2><p>Every completed campaign raises the counter by 1 and permanently improves future Campaign rewards up to 100.</p></div></div>`}
  function pf328SideHTML(){return `<div class="pf326-side"><section class="pf326-side-card"><small class="pf326-eyebrow">RECENT TOURS</small><h3>Campaign Log</h3>${pfV326HistoryHTML()}</section></div>`}
  function pf328ActiveHTML(a){const def=a.offer,done=Date.now()>=a.endsAt,p=pfV326Progress(a),tier=campaignTier(def,a.power),owned=new Map(allOwnedCopies().map(x=>[x.copy.uid,x])),team=(a.cardUids||[]).map(u=>owned.get(u)).filter(Boolean),kind=pfV326RouteKind(def),focus=a.focus||pfV34Focus(def);return `<div class="pf326-active-wrap"><div class="pf326-active-card pf-campaign-run ${done?'done':''}" data-pf-campaign-slot="1"><div class="pf326-active-head"><div><small>${done?'TOUR COMPLETE':'CAMPAIGN ON THE ROAD'}</small><h2>${pfEscapeHtml(def.name)}</h2><p>${done?'Your cards are back. Collect the rewards.':`${kind.label} · ${pfEscapeHtml(focus.label)}`}</p></div><div class="pf326-active-tier"><span>REWARD TIER</span><b>${tier.name}</b><span>+${pf328BonusPct()}% campaign level</span></div></div><div class="pf326-route"><div class="pf326-route-line"><i class="pf328-fluid" style="transform:scaleX(${p})"></i></div><div class="pf326-route-stops"><div class="pf326-route-stop"><i></i><span>DEPART</span></div><div class="pf326-route-stop"><i></i><span>SHOWCASE</span></div><div class="pf326-route-stop"><i></i><span>TRADING FLOOR</span></div><div class="pf326-route-stop"><i></i><span>AWARDS</span></div></div><div class="pf326-route-marker pf328-marker" style="left:${2+p*96}%"></div></div><div class="campaign-big-timer">${done?'COMPLETE':campaignTime(a.endsAt-Date.now())}</div><div class="campaign-progress"><i class="pf328-fluid" style="transform:scaleX(${p})"></i></div><div class="pf326-active-stats"><span><small>POWER SENT</small><b>${pfCompactNumber(a.power,2)}</b></span><span><small>SPEED</small><b>${(a.speed||campaignSpeed(def,a.power)).toFixed((a.speed||1)>=10?0:1)}×</b></span><span><small>SPOTLIGHT</small><b>${a.focusMatches||0} match${a.focusMatches===1?'':'es'}</b></span><span><small>TEAM</small><b>${team.length} cards</b></span></div><div class="pf326-active-team">${team.map(x=>`<span>${pfEscapeHtml(x.card.name)} · ${pfCompactNumber(x.power,2)} PWR</span>`).join('')}</div>${done?'<button class="campaign-collect" data-pf-collect-campaign="1">COLLECT REWARDS</button>':'<div class="campaign-help">You can leave this page or close PackForge. The campaign uses timestamps.</div>'}</div>${pf328SideHTML()}</div>`}
  function pf328ArmSmooth(a){if(!a||Date.now()>=a.endsAt)return;const remain=Math.max(50,a.endsAt-Date.now()),p=pfV326Progress(a);document.querySelectorAll('#view-campaigns .pf328-fluid').forEach(el=>{el.style.transition='none';el.style.transform=`scaleX(${p})`;requestAnimationFrame(()=>{el.style.transition=`transform ${remain}ms linear`;el.style.transform='scaleX(1)'})});const marker=$('#view-campaigns .pf328-marker');if(marker){marker.style.transition='none';marker.style.left=`${2+p*96}%`;requestAnimationFrame(()=>{marker.style.transition=`left ${remain}ms linear`;marker.style.left='98%'})}}

  /* Replace REP collection with one completion point and restrained milestone rewards. */
  const pf328RawCollect=pfV326CollectBase;
  pfCollectCampaignSlot=function(){
    const run=state.campaigns?.active;if(!run||Date.now()<run.endsAt)return pf328RawCollect();
    const before=pf328Count(),next=before+1,pct=Math.min(1,next/100),orig={...run.offer},basePacks=Math.max(0,Number(orig.packs||0)),extraExpected=basePacks*pct,extraWhole=Math.floor(extraExpected),extraFrac=extraExpected-extraWhole;
    run.offer={...orig,cashReward:Math.round(Number(orig.cashReward||0)*(1+pct)),packs:basePacks+extraWhole,packChance:Math.min(.98,1-(1-Number(orig.packChance||0))*(1-extraFrac)),special:Math.min(.90,Number(orig.special||0)*(1+pct))};
    const beforeCash=Number(state.stats.campaignCash||0),beforePacks=Number(state.stats.campaignPacksWon||0),beforeSpecial=Number(state.stats.campaignSpecialsWon||0),tier=campaignTier(orig,run.power).name,name=orig.name||'Campaign',power=run.power||0;
    const result=pf328RawCollect();
    const after=pf328Count(),meta=pfV326Meta(),cash=Math.max(0,Number(state.stats.campaignCash||0)-beforeCash),packs=Math.max(0,Number(state.stats.campaignPacksWon||0)-beforePacks),specials=Math.max(0,Number(state.stats.campaignSpecialsWon||0)-beforeSpecial);meta.history.unshift({name,tier,power,cash,packs:packs+specials,at:Date.now()});meta.history=meta.history.slice(0,8);
    const bonuses=[];
    if(after>before&&after%25===0){
      if(after===25){const p=campaignAddPack(null,true);if(p){bonuses.push('25 Campaigns · Special Pack');state.stats.campaignSpecialsWon=(state.stats.campaignSpecialsWon||0)+1}}
      else if(after===50){const a=campaignAddPack(null,false),b=campaignAddPack(null,true);if(a){bonuses.push('50 Campaigns · Core Pack');state.stats.campaignPacksWon=(state.stats.campaignPacksWon||0)+1}if(b){bonuses.push('50 Campaigns · Special Pack');state.stats.campaignSpecialsWon=(state.stats.campaignSpecialsWon||0)+1}}
      else if(after===75){for(let i=0;i<2;i++){const p=campaignAddPack(null,true);if(p)state.stats.campaignSpecialsWon=(state.stats.campaignSpecialsWon||0)+1}bonuses.push('75 Campaigns · 2 Special Packs')}
      else if(after===100){grantPremiumPack('apologysemi',1);bonuses.push('100 Campaigns · Semi-God Pack · +100% max Campaign bonus')}
      else {const p=campaignAddPack(null,true);if(p){bonuses.push(`${after} Campaigns · Special Pack`);state.stats.campaignSpecialsWon=(state.stats.campaignSpecialsWon||0)+1}}
    }
    if(bonuses.length){const list=document.querySelector('#confirmModal .campaign-reward-list');if(list)for(const t of bonuses){const row=document.createElement('div');row.className='campaign-reward-line pf326-bonus-line';row.innerHTML=`<span>★ ${pfEscapeHtml(t)}</span><b>MILESTONE</b>`;list.appendChild(row)}toast('Campaign Milestone',bonuses.join(' · '))}
    markSaveDirty();save(true);renderHUD();updateBagCounts();if(!$('#view-campaigns')?.classList.contains('hidden'))renderCampaigns();return result
  };

  renderCampaigns=function(){ensureCampaignOffers();pfV34PromoteLegacyCampaign();pfV326Meta();const view=$('#view-campaigns'),list=$('#campaignList'),stage=$('#campaignStage');if(!view||!list||!stage)return;pf328MountCounter();const title=view.querySelector('.view-title h1'),subtitle=view.querySelector('.view-title p');if(title)title.textContent='Campaign Tour';if(subtitle)subtitle.textContent='Every campaign is one level. Reach 100 for the full +100% Campaign reward bonus.';view.querySelectorAll('.pf318-campaign-steps').forEach(n=>n.remove());const lp=list.closest('.campaign-panel'),sp=stage.closest('.campaign-panel'),active=state.campaigns.active;view.classList.add('pf-campaign-v34','pf-campaign-v326','pf-campaign-v328');view.classList.remove('pf-campaign-v327');view.classList.toggle('pf326-team-mode',!active&&(state.campaigns.flowStep==='team'&&!!campaignFlowOffer()));if(active){if(lp)lp.style.display='none';if(sp)sp.style.display='block';stage.innerHTML=pf328ActiveHTML(active);stage.querySelectorAll('[data-pf-collect-campaign]').forEach(b=>b.onclick=()=>pfCollectCampaignSlot());pf328ArmSmooth(active);return}if(state.campaigns.flowStep==='team'&&campaignFlowOffer()){if(lp)lp.style.display='none';if(sp)sp.style.display='block';pfV326RenderTeam();return}state.campaigns.flowStep='offers';state.campaigns.flowOfferId=null;if(lp)lp.style.display='block';if(sp)sp.style.display='block';const offers=ensureCampaignOffers(),refreshLeft=campaignRefreshRemaining();list.innerHTML=pf328HubHead()+`<div class="pf326-offer-head"><div><small class="pf326-eyebrow">AVAILABLE DESTINATIONS</small><h3>Choose your next tour</h3><p>Power, time, and rewards. That is the important stuff.</p></div><button class="campaign-refresh" id="campaignRefresh" ${refreshLeft>0?'disabled':''}>${campaignRefreshLabel(refreshLeft)}</button></div><div class="pf326-offer-grid">${offers.map(pf328OfferCard).join('')}</div>`;stage.innerHTML=pf328SideHTML();$$('[data-pf326-build]').forEach(b=>b.onclick=e=>{e.stopPropagation();pfV326SelectOffer(b.dataset.pf326Build)});$$('[data-pf326-offer]').forEach(c=>c.onclick=e=>{if(e.target.closest('button'))return;pfV326SelectOffer(c.dataset.pf326Offer)});$('#campaignRefresh')?.addEventListener('click',()=>{manualRefreshCampaigns();campaignResetFlow();save();renderCampaigns()})};

  /* Cheap heartbeat: timer text only. The bars are one native CSS transition from current progress to finish. */
  window.pfCampaignHeartbeat=function(){const now=Date.now(),a=state.campaigns?.active;if(a&&now>=a.endsAt&&!a.notified){a.notified=true;save();sfx('grade');toast('Campaign complete',`${a.offer?.name||'Tour'} is ready to collect.`)}if($('#view-campaigns')?.classList.contains('hidden'))return;if(a){const el=$('.pf-campaign-run[data-pf-campaign-slot="1"]');if(a&&el){const done=now>=a.endsAt;if(done&&!el.querySelector('.campaign-collect')){renderCampaigns();return}const timer=el.querySelector('.campaign-big-timer');if(timer)timer.textContent=done?'COMPLETE':campaignTime(a.endsAt-now)}}else if(typeof updateCampaignRefreshButton==='function')updateCampaignRefreshButton()};

  /* Player-facing log: new content only. */
  PF320_PLAYER_LOG.unshift({version:'3.28',title:'Campaign Levels + 250-Card Sets',items:['Campaigns now use a simple completion counter: every finished tour adds exactly 1 level, with reward bonuses growing up to +100% at 100 campaigns.','Campaign progress bars now glide smoothly instead of jumping forward on timer ticks.','Every permanent set now contains 250 cards.','Each set now contains 15 Ultra, 10 Secret, 7 Ghost, 5 God, and 3 Ascendant cards, with stronger names toward the top of the set.','Pokémon Ascendants are Mew, Mewtwo, and Arceus.']});
  const pf328Badge=$('#pfVButton');if(pf328Badge){pf328Badge.innerHTML=`<b>V3.28</b><small>NEW</small><span class="pf-vcount-dot">${PF320_PLAYER_LOG.reduce((n,v)=>n+v.items.length,0)}</span>`;pf328Badge.title='New cards, rarities, packs, variants, and features only';pf328Badge.onclick=openVersionLog;pf328Badge.oncontextmenu=e=>{e.preventDefault();pfV320ClaimMatthew()}}
  window.__pfV328Health=()=>{const setChecks={};for(const id of PF328_SET_IDS){const t=themes.find(x=>x.id===id);setChecks[id]={total:t?.allCards?.length||0,ultra:t?.allCards?.filter(c=>c.rarity==='Ultra').length||0,secret:t?.secretCards?.length||0,ghost:t?.ghostCards?.length||0,god:t?.godCards?.length||0,ascendant:t?.ascendantCards?.length||0,unique:new Set((t?.allCards||[]).map(c=>c.name.toLowerCase())).size,oneWord:(t?.allCards||[]).every(c=>!/\s/.test(c.name))}}return {version:PF_VERSION,campaignCount:pf328Count(),campaignBonus:pf328BonusPct(),pokemonAscendants:themes.find(t=>t.id==='pokemon')?.ascendantCards?.map(c=>c.name),sets:setChecks}}

})();

;
/* SOURCE: js/pwa.js */
/* PackForge v3.14 clean-shop/admin low-edge PWA bootstrap.
   Normal page navigations are served by the cache-first SW. Existing installs perform at most one explicit SW update check per browser tab/session, keeping deploys discoverable without a request on every reload. */
if('serviceWorker' in navigator){window.addEventListener('load',()=>{const swURL='./service-worker.js?v=3.28.0',flag='pf_sw_checked_v3_28';navigator.serviceWorker.getRegistration().then(reg=>{const target=new URL(swURL,location.href).href;if(!reg||reg.active?.scriptURL!==target)return navigator.serviceWorker.register(swURL,{updateViaCache:'none'});if(!sessionStorage.getItem(flag)){sessionStorage.setItem(flag,'1');return reg.update()}return reg}).catch(()=>{});},{once:true});}
const pfVis=()=>document.documentElement.classList.toggle('pf-hidden-tab',document.hidden);document.addEventListener('visibilitychange',pfVis,{passive:true});pfVis();

