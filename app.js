'use strict';
(() => {
  const situations = {
    new: {event:'01 / Inquiry received',heading:'They know what to do next.',explanation:'Your approved confirmation gives them the booking link. Your business contact receives the inquiry.',sender:'The Good Room → Jamie',subject:'About your organizing consultation',email:'Hi Jamie, thanks for getting in touch. We’d love to hear about your space. Here’s the link to choose a consultation time.',status:'Approved confirmation + booking link'},
    quiet: {event:'02 / No response yet',heading:'The follow-up is already planned.',explanation:'If there’s no reply, booking, or opt-out, the next approved email goes out on the agreed schedule.',sender:'The Good Room → Jamie',subject:'Still thinking about your space?',email:'Hi Jamie, is organizing your space still on your list? If you’d like to talk it through, you can choose a consultation time here.',status:'Scheduled follow-up · Your approved wording'},
    reply: {event:'03 / Jamie replies',heading:'A person takes it from here.',explanation:'The sequence stops. Your business contact takes over the conversation and answers the customer’s question.',sender:'Jamie → The Good Room',subject:'Re: About your organizing consultation',email:'Hi! I’d love some help with my closet. Do you offer weekend consultations?',status:'Follow-up stopped · Reply goes to your team'}
  };
  const buttons = Array.from(document.querySelectorAll('[data-situation]'));
  buttons.forEach(button => button.addEventListener('click', () => {
    const state = situations[button.dataset.situation];
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    Object.entries(state).forEach(([key,value]) => { document.querySelector('[data-demo="'+key+'"]').textContent = value; });
  }));
  const form = document.getElementById('fit-form');
  const result = document.getElementById('fit-result');
  form.addEventListener('change', () => { result.hidden = true; });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form), demand = data.get('demand'), scope = data.get('scope');
    const fits = demand === 'yes' && scope === 'standard';
    const custom = scope === 'other';
    document.getElementById('fit-title').textContent = custom ? 'Explore a private engagement.' : fits ? 'This looks like the right kind of project.' : 'Start with finding your customers.';
    document.getElementById('fit-copy').textContent = custom ? 'A broader project needs a separate scope. Private advisory and implementation start at $10,000 per month for new engagements. We agree on deliverables and timing before work begins.' : fits ? 'The service fee is $1,500 setup, then $1,500 per month from launch. Required software and usage cost extra. Email us to confirm compatibility, the full cost, and setup availability before you commit.' : 'This package helps people who already know about your business take the next step. If you need new demand first, an acquisition plan comes before this setup.';
    const body = `Hello FLP,\n\nI have reviewed the inquiry and follow-up package.\nExisting inquiries: ${demand === 'yes' ? 'Yes' : 'No'}\nRequested scope: ${scope === 'standard' ? 'One service page, booking link, and follow-up' : 'Broader or custom work'}\n\nBusiness / website:\nCurrent email and booking tools:\nIdeal start date:\n\nPlease share the next step.\n`;
    const link = document.getElementById('inquiry-link');
    link.href = custom ? '#private-advisory' : 'mailto:shania@flpmarketinggroup.com?subject=' + encodeURIComponent(fits ? 'FLP setup availability' : 'FLP package fit question') + '&body=' + encodeURIComponent(body);
    link.textContent = custom ? 'See private advisory & implementation ↗' : fits ? 'Email FLP about setup ↗' : 'Email FLP a fit question ↗';
    document.querySelector('#fit-result .small-copy').textContent = custom ? 'Review the starting price and scope, then inquire by email.' : 'Opens your email app. Nothing is sent automatically.';
    result.hidden = false;
  });
})();
