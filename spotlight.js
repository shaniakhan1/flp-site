'use strict';
(() => {
  const stage=document.querySelector('.spotlight-visual');
  if(!stage || !matchMedia('(pointer:fine) and (prefers-reduced-motion:no-preference)').matches)return;
  stage.addEventListener('pointermove',event=>{
    const box=stage.getBoundingClientRect();
    stage.style.setProperty('--pointer-x',`${event.clientX-box.left}px`);
    stage.style.setProperty('--pointer-y',`${event.clientY-box.top}px`);
  },{passive:true});
})();
