'use strict';
(() => {
  const examples = [
    {label:'01 / INQUIRY',title:'A new inquiry. In the right place.',avatar:'J',from:'Jamie · Website form',text:"I'm interested in a home-organizing consultation. What happens next?",explanation:'The form records the request and tells the business who needs a response. No more relying on someone to remember to forward it.'},
    {label:'02 / THE NEXT STEP',title:'A clear response, ready to go.',avatar:'✓',from:'Your business · Approved email',text:'Thanks for getting in touch, Jamie. Here is the link to request a consultation. Our team will confirm the details with you.',explanation:'The customer receives approved wording and the right link. A booking request is not presented as confirmed until your booking system confirms it.'},
    {label:'03 / THE HUMAN HANDOFF',title:'They reply. A person takes over.',avatar:'↗',from:'Example activity · Follow-up stopped',text:'Jamie replied with a question. The remaining reminders are stopped and the conversation is routed to your business contact.',explanation:'Reply, opt-out, and connected booking signals must stop reminders. These rules are tested before a real customer enters the funnel.'}
  ];
  let current=0;
  function render(){
    const example=examples[current];
    for(const [id,key] of [['demo-label','label'],['demo-title','title'],['avatar','avatar'],['message-from','from'],['message-text','text'],['demo-explanation','explanation']]) document.getElementById(id).textContent=example[key];
    document.getElementById('step-count').textContent=`${current+1} / 3`;
    document.getElementById('next-step').textContent=current===2?'Replay the example ↺':'See the next step →';
    document.querySelectorAll('[data-step]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.step)===current)));
  }
  document.querySelectorAll('[data-step]').forEach(button=>button.addEventListener('click',()=>{current=Number(button.dataset.step);render();}));
  document.getElementById('next-step').addEventListener('click',()=>{current=(current+1)%examples.length;render();});
  document.getElementById('fit-form').addEventListener('submit',event=>{
    event.preventDefault();
    const form=event.currentTarget;if(!form.reportValidity())return;
    const data=new FormData(form), demand=data.get('demand'),scope=data.get('scope');
    const fits=demand==='yes'&&scope==='standard';
    const custom=scope==='other';
    document.getElementById('fit-title').textContent=custom?'Explore a private engagement.':fits?'This looks like the right kind of project.':'This package may not be your next step.';
    document.getElementById('fit-copy').textContent=custom?'A broader project needs a separate scope. Private advisory and implementation start at $10,000 per month for new engagements. We agree on deliverables and timing before work begins.':fits?'Planned pilot pricing is $1,500 setup, then $1,500 per month from launch, plus software costs to be published before enrollment. Checkout is not open yet. You can email FLP to discuss pilot availability.':'This funnel helps existing interest turn into an inquiry or booking request. If you need people to discover your business first, you need an acquisition plan before buying this package.';
    const subject=fits?'FLP funnel pilot interest':'FLP package fit question';
    const body=`Hello FLP,\n\nI have reviewed the funnel package.\nExisting demand: ${demand==='yes'?'Yes':'No'}\nRequested scope: ${scope==='standard'?'Standard funnel package':'Broader or custom work'}\n\nPlease share the next step.\n`;
    const link=document.getElementById('inquiry-link');
    link.href=custom?'#private-advisory':'mailto:office@flpmarketinggroup.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
    link.textContent=custom?'See private advisory & implementation ↗':fits?'Email FLP about the pilot ↗':'Email FLP a fit question ↗';
    document.querySelector('#fit-result .small-copy').textContent=custom?'Review the starting price and scope, then inquire by email.':'Opens your email app. Nothing is sent automatically.';
    document.getElementById('fit-result').hidden=false;
  });
})();
