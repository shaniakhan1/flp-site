'use strict';
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  let optedOut = false;
  try { optedOut = localStorage.getItem('flp-motion-off') === '1'; } catch {}
  let enabled = false, observer, canvas, ctx, frame = 0, trail = [], animations = [];
  const art = document.querySelector('.conversation-art');
  const control = document.createElement('button');
  control.type = 'button'; control.className = 'motion-control';
  (art || document.querySelector('.footer'))?.append(control);
  function clear() {
    cancelAnimationFrame(frame); frame = 0; trail = [];
    if (ctx) ctx.clearRect(0, 0, innerWidth, innerHeight);
    if (art) { art.style.removeProperty('--pointer-x'); art.style.removeProperty('--pointer-y'); }
  }
  function resize() {
    if (!canvas) return;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(innerWidth * ratio); canvas.height = Math.round(innerHeight * ratio);
    canvas.style.width = innerWidth + 'px'; canvas.style.height = innerHeight + 'px';
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0); clear();
  }
  function draw(now) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    trail = trail.filter(p => now - p.time < 380);
    if (trail.length > 1) {
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (let i = 1; i < trail.length; i++) {
        const p = trail[i], previous = trail[i - 1];
        ctx.strokeStyle = `rgba(67,113,180,${0.23 * (1 - (now-p.time)/380)})`;
        ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(previous.x,previous.y);
        ctx.quadraticCurveTo(previous.x,p.y,p.x,p.y); ctx.stroke();
      }
    }
    frame = trail.length ? requestAnimationFrame(draw) : 0;
  }
  function update() {
    enabled = !reduced.matches && !optedOut;
    document.documentElement.classList.toggle('flp-motion', enabled);
    control.textContent = enabled ? 'Motion on' : 'Motion off';
    control.setAttribute('aria-label', reduced.matches ? 'Motion off: device prefers reduced motion' : 'Decorative motion');
    control.setAttribute('aria-pressed', String(enabled));
    control.disabled = reduced.matches;
    if (!enabled) { clear(); observer?.disconnect(); animations.forEach(a=>a.cancel()); animations=[]; }
    else {
      if ('IntersectionObserver' in window) {
        observer?.disconnect();
        observer = new IntersectionObserver(entries => entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          if (entry.target.dataset.motionSeen) return;
          entry.target.dataset.motionSeen = '1';
          const a = entry.target.animate([{opacity:0.35,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}],{duration:650,easing:'cubic-bezier(.2,.7,.2,1)'});
          animations.push(a); a.onfinish = () => { animations = animations.filter(x=>x!==a); };
        }), {threshold:0.12});
        document.querySelectorAll('.section-heading, .service-card, .preview-grid > a, .owner-story > *, .ai-grid article, .work-gallery article, .month-grid article, .case-grid section, .social-investment').forEach(el=>observer.observe(el));
      }
    }
  }
  control.addEventListener('click',()=>{
    optedOut = !optedOut;
    try {localStorage.setItem('flp-motion-off', optedOut ? '1' : '0');} catch {}
    update();
  });
  if (art) {
    art.addEventListener('pointermove',e=>{
      if (!enabled || !fine.matches || e.pointerType === 'touch') return;
      const r=art.getBoundingClientRect();
      art.style.setProperty('--pointer-x', ((e.clientX-r.left)/r.width*100).toFixed(1)+'%');
      art.style.setProperty('--pointer-y', ((e.clientY-r.top)/r.height*100).toFixed(1)+'%');
    },{passive:true});
    art.addEventListener('pointerleave',()=>{art.style.removeProperty('--pointer-x');art.style.removeProperty('--pointer-y');});
  }
  document.addEventListener('pointermove',e=>{
    if (!enabled || !fine.matches || e.pointerType === 'touch' || document.hidden || e.target.closest('input,textarea,iframe,select')) return;
    if (!canvas) {
      canvas=document.createElement('canvas'); canvas.className='pointer-ink'; canvas.setAttribute('aria-hidden','true');
      ctx=canvas.getContext('2d'); if (!ctx) {canvas=null;return;}
      document.body.append(canvas); resize();
    }
    trail.push({x:e.clientX,y:e.clientY,time:performance.now()}); if (trail.length>16) trail.shift();
    if (!frame) frame=requestAnimationFrame(draw);
  },{passive:true});
  document.addEventListener('pointerleave',clear);
  document.addEventListener('visibilitychange',()=>{document.documentElement.classList.toggle('motion-paused',document.hidden);if(document.hidden)clear();});
  addEventListener('resize',resize,{passive:true});
  fine.addEventListener('change',clear); reduced.addEventListener('change',update);
  update();
})();
