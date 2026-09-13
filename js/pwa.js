if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}),{once:true});}

const pfVis=()=>document.documentElement.classList.toggle('pf-hidden-tab',document.hidden);document.addEventListener('visibilitychange',pfVis,{passive:true});pfVis();
