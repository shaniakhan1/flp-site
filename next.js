'use strict';
(() => {
  const $ = id => document.getElementById(id);
  document.querySelectorAll('.mobile-nav a').forEach(a => a.addEventListener('click', () => a.closest('details').removeAttribute('open')));
  const tasks = {
    profile: ['One clear version of your business.', 'Compare the service area and hours on your website with your business profile. Confirm the correct details before making changes.', 'A before-and-after record, links to the updated information, and the date checked.'],
    page: ['Give people enough information to choose.', 'Review one service page for the service area, buying questions, real customer proof, and a clear way to inquire.', 'The proposed page changes, approved factual claims, and a link to the published version.'],
    proof: ['Make real customer experience visible.', 'Prepare a request for honest feedback from actual customers. Review the wording and supported sending workflow before launch.', 'The approved request, a tested workflow, and a record of what was set up. No fabricated reviews.']
  };
  let selected = 'profile';
  const approved = new Set();
  function showTask(key) {
    selected = key;
    const t = tasks[key];
    $('task-title').textContent = t[0]; $('task-description').textContent = t[1]; $('task-evidence').textContent = t[2];
    $('task-status').textContent = approved.has(key) ? 'Sample · approval recorded' : 'Sample · ready for review';
    $('demo-approve').textContent = approved.has(key) ? 'Undo sample approval' : 'Try an approval';
    $('demo-note').textContent = approved.has(key) ? 'Example approval only. Nothing was published or sent.' : 'Demo only. This does not publish a change or create an account.';
    document.querySelectorAll('[data-task]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.task === key)));
  }
  document.querySelectorAll('[data-task]').forEach(b => b.addEventListener('click', () => showTask(b.dataset.task)));
  $('demo-approve')?.addEventListener('click', () => { approved.has(selected) ? approved.delete(selected) : approved.add(selected); showTask(selected); });
  const form = $('brief-form');
  if (!form) return;
  const key = 'flp-visibility-brief-v1';
  const fields = ['business','website','location','service','sector','priority','profile','reviews'];
  const limits = {business:100, website:220, location:100, service:120};
  function values() {return Object.fromEntries(fields.map(f => [f,$(f).value.trim()]));}
  function clearResult() { $('brief-result').hidden = true; $('brief-text').value = ''; $('email-brief').href = 'mailto:shania@flpmarketinggroup.com'; $('copy-status').textContent = ''; }
  function save() {
    try { if ($('remember').checked) {localStorage.setItem(key, JSON.stringify(values())); $('storage-note').textContent = 'Saved on this device. Not sent to FLP.';} else {localStorage.removeItem(key); $('storage-note').textContent = 'Not saved on this device.';} }
    catch { $('storage-note').textContent = 'Browser storage is unavailable. You can still build and download your brief.'; }
  }
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    if (saved && typeof saved === 'object') {
      fields.forEach(f => {if (typeof saved[f] === 'string') $(f).value = saved[f].slice(0,limits[f] || 40);});
      $('remember').checked = true; $('storage-note').textContent = 'Your saved answers are restored on this device. Build the plan to review them.';
    }
  } catch { /* A corrupt or unavailable local draft does not block the planner. */ }
  form.addEventListener('input', () => {clearResult(); $('form-error').textContent = ''; save();});
  form.addEventListener('change', () => {clearResult(); save();});
  $('clear-brief').addEventListener('click', () => {form.reset(); clearResult(); $('form-error').textContent = ''; save(); $('business').focus();});
  const planData = {
    discovery: ['Start with discovery.', 'Check where customers could find your priority service and whether your business information supports that search.', 'Compare the website and business profile against a fixed set of buyer questions.'],
    trust: ['Start with the decision to inquire.', 'You said people find you but do not inquire. Review what a prospective customer sees before expanding visibility work.', 'Check service clarity, real evidence, contact friction, and available inquiry data.'],
    followup: ['Start with what happens after the inquiry.', 'You identified follow-up as the problem. More visibility may not be the first investment to make.', 'Map confirmation, routing, response ownership, and booking. Scope follow-up work separately.']
  };
  function addCard(title,body,check) {
    const article = document.createElement('article'); article.className = 'plan-card';
    const label=document.createElement('span');label.className='pill';label.textContent='PROPOSED CHECK';
    const h=document.createElement('h3');h.textContent=title;
    const p=document.createElement('p');p.textContent=body;
    const sub=document.createElement('span');sub.className='small-label';sub.textContent='EVIDENCE TO COLLECT';
    const detail=document.createElement('p');detail.textContent=check;
    article.append(label,h,p,sub,detail);$('plan-cards').append(article);
  }
  form.addEventListener('submit', e => {
    e.preventDefault(); clearResult();
    const v=values();
    for(const f of ['business','location','service']) if(!v[f]) { $('form-error').textContent='Please add your business name, service area, and priority service.'; $(f).focus(); return; }
    if(v.website) {
      try { const u=new URL(/^[a-z][a-z0-9+.-]*:/i.test(v.website)?v.website:'https://'+v.website); if(!['http:','https:'].includes(u.protocol)||!u.hostname.includes('.')||u.username||u.password)throw Error(); v.website=u.href; }
      catch { $('form-error').textContent='Enter a public website such as yourbusiness.com, or leave the website blank.'; $('website').focus(); return; }
    }
    $('form-error').textContent='';save();
    const priority=planData[v.priority] || planData.discovery;
    const fit = v.sector==='unknown' ? 'Your starting plan is ready. A real review of your website and business comes before a paid recommendation. Add optional details if you want a more specific brief.' : !v.website ? 'A website is missing from your brief. The standard setup improves an existing site; a new website needs a separate scope.' : v.priority==='followup' ? 'Your answers point to follow-up first. The visibility package may not be your best first step. FLP should review the fit before recommending paid work.' : v.sector!=='home' ? 'The first standard service focuses on home services. FLP will check whether your business fits before agreeing to the published package.' : 'Potential fit for the visibility setup, subject to a real audit, supported access, and delivery availability. This is not an acceptance or a booking.';
    $('result-heading').textContent=v.business + ': a place to start.';
    $('result-context').textContent=v.service+' · '+v.location;
    $('fit-note').textContent=fit;
    $('plan-cards').replaceChildren();
    addCard(...priority);
    const profile = v.profile==='yes' ? ['Verify the details match.', 'You reported an up-to-date business profile. Check the facts against your website and key listings.', 'Current hours, service area, categories, contact details, and relevant listing URLs.'] : ['Establish the business facts.', 'Your business profile needs checking. Confirm eligibility and accurate details before proposing changes.', 'The current profile, actual operating hours, service area, qualifications, and website.'];
    const proof = v.reviews==='yes' ? ['Connect customer proof to the service.', 'You already request reviews. Check what useful evidence customers can see for the priority service.', 'Genuine reviews, approved project examples, and the existing request workflow.'] : ['Create a way to ask for honest feedback.', 'You did not confirm a regular review-request process. Check what can be set up with your existing tools.', 'Eligible customer touchpoints, permission to contact them, and an approved request template.'];
    addCard(...profile);addCard(...proof);
    const questions=[`Who provides ${v.service} in ${v.location}?`,`What should I compare before hiring a business for ${v.service} in ${v.location}?`,`What information is available about ${v.business} and its ${v.service} service?`];
    $('buyer-questions').replaceChildren();questions.forEach(q=>{const li=document.createElement('li');li.textContent=q;$('buyer-questions').append(li);});
    const text=['FLP VISIBILITY BRIEF','Based on owner answers. No live website or AI-search audit has been performed.','',`Business: ${v.business}`,`Website: ${v.website||'Not supplied'}`,`Service area: ${v.location}`,`Priority service: ${v.service}`,`Business type: ${$('sector').selectedOptions[0].textContent}`,`Main problem: ${$('priority').selectedOptions[0].textContent}`,`Profile status (self-reported): ${$('profile').selectedOptions[0].textContent}`,`Review requests (self-reported): ${$('reviews').selectedOptions[0].textContent}`,'','FIT TO REVIEW',fit,'','PROPOSED CHECKS',...[priority,profile,proof].map((a,i)=>`${i+1}. ${a[0]}\n${a[1]}\nEvidence: ${a[2]}`),'','QUESTIONS FOR A REAL AUDIT',...questions,'','Please confirm fit, scope, total costs, supported tools, and delivery availability. No payment or service agreement is created by this brief.'].join('\n');
    $('brief-text').value=text;
    $('email-brief').href='mailto:shania@flpmarketinggroup.com?subject='+encodeURIComponent('FLP visibility brief: '+v.business)+'&body='+encodeURIComponent(text);
    $('brief-result').hidden=false;$('result-heading').focus();$('brief-result').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  });
  $('copy-brief').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('brief-text').value);$('copy-status').textContent='Brief copied. Nothing has been sent.';}catch{$('brief-text').focus();$('brief-text').select();$('copy-status').textContent='Select and copy the brief above. Clipboard access is unavailable.';}});
  $('download-brief').addEventListener('click',()=>{const blob=new Blob([$ ('brief-text').value],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='FLP-visibility-brief.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
})();
