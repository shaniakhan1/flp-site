// Fixed provider destinations. No user-provided URL is fetched.
export function validate(input) {
  const data = {};
  for (const field of ['business', 'location', 'service', 'website']) {
    if (typeof input?.[field] !== 'string' || !input[field].trim() || input[field].length > 200) throw new Error('Add business, location, service, and website (200 characters maximum each).');
    data[field] = input[field].trim();
  }
  const url = new URL(data.website.includes('://') ? data.website : `https://${data.website}`);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || !url.hostname.includes('.')) throw new Error('Use a public business website.');
  data.domain = url.hostname.toLowerCase().replace(/^www\./, '');
  return data;
}
export function questions(data) {
  return [
    {kind:'discovery', text:`Who provides ${data.service} in ${data.location}?`},
    {kind:'discovery', text:`Which businesses should I compare for ${data.service} in ${data.location}?`},
    {kind:'discovery', text:`Who specializes in ${data.service} near ${data.location}?`},
    {kind:'discovery', text:`Where can I find customer reviews for providers of ${data.service} in ${data.location}?`},
    {kind:'identity', text:`What does ${data.business} in ${data.location} offer?`}
  ];
}
export function safeURL(value) {
  try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password ? u.href : null; } catch { return null; }
}
export function matchesDomain(url, domain) {
  try { const host = new URL(url).hostname.toLowerCase().replace(/^www\./, ''); return host === domain || host.endsWith('.' + domain); } catch { return false; }
}
export function webEvidence(payload, domain) {
  if (!Array.isArray(payload?.web?.results)) throw new Error('Unrecognized search response.');
  const results = payload.web.results.slice(0,10).flatMap((r, i) => {
    const url = safeURL(r.url);
    return url ? [{position:i + 1, title:String(r.title || '').slice(0,500), url, snippet:String(r.description || '').slice(0,2000), domainMatch:matchesDomain(url,domain)}] : [];
  });
  return {status:results.length ? 'observed' : 'inconclusive', domainFound:results.some(r=>r.domainMatch), results, interpretation:'Domain presence within these returned Brave web results only. Relevance and business identity need human review. This is not a Google rank or AI recommendation.'};
}
export function answerEvidence(stream, domain) {
  let joined = '';
  let completed = false;
  for (const line of stream.split(/\r?\n/)) {
    if (!line.startsWith('data:')) continue;
    const item = line.slice(5).trim();
    if (item === '[DONE]') { completed = true; continue; }
    const payload = JSON.parse(item);
    if (payload.error) throw new Error('Answer provider reported an error.');
    joined += payload.choices?.[0]?.delta?.content || '';
    if (payload.choices?.[0]?.finish_reason === 'stop') completed = true;
  }
  if (!completed) throw new Error('Incomplete answer stream.');
  const citations = [];
  const text = joined.replace(/<citation>([\s\S]*?)<\/citation>/g, (_, value) => {
    const c = JSON.parse(value), url = safeURL(c.url);
    if (url) citations.push({url, number:c.number, snippet:String(c.snippet || '').slice(0,2000), domainMatch:matchesDomain(url, domain)});
    return '';
  }).replace(/<usage>[\s\S]*?<\/usage>/g, '').trim();
  if (!text || text.includes('<citation>') || text.includes('<usage>')) throw new Error('Incomplete answer content.');
  return {status:citations.length ? 'observed' : 'inconclusive', text, citations, domainCited:citations.some(c=>c.domainMatch), interpretation:'Brave Answers API response. Human review is required to distinguish a mention, citation, and recommendation. This does not measure consumer ChatGPT, Claude, Gemini, or Google AI results.'};
}
async function readLimited(response) {
  let text = '', bytes = 0;
  const decoder = new TextDecoder();
  for await (const chunk of response.body) {
    bytes += chunk.length;
    if (bytes > 1_000_000) throw new Error('Provider response exceeded the size limit.');
    text += decoder.decode(chunk, {stream:true});
  }
  return text + decoder.decode();
}
export async function runCheck(input, {key, answers=false, fetcher=fetch, now=()=>new Date().toISOString()}={}) {
  if (!key) throw new Error('Search provider is not connected.');
  const data=validate(input);
  const report={version:1, business:data.business, website:data.website, location:data.location, service:data.service, checkedAt:now(), reviewStatus:'needs-human-review', surfaces:['Brave Web Search API', ...(answers?['Brave Answers API']:[])], notMeasured:['Google Search','Google AI answers','ChatGPT consumer app','Claude consumer app','Gemini consumer app'], checks:[]};
  async function request(question, type) {
    const startedAt=now();
    try {
      let url, options;
      if (type==='web') {
        url=new URL('https://api.search.brave.com/res/v1/web/search');
        url.search=new URLSearchParams({q:question,count:'10',country:'US',search_lang:'en',spellcheck:'false'});
        options={headers:{'X-Subscription-Token':key,'Accept':'application/json'}};
      } else {
        url='https://api.search.brave.com/res/v1/chat/completions';
        options={method:'POST',headers:{'X-Subscription-Token':key,'Content-Type':'application/json'},body:JSON.stringify({model:'brave',stream:true,messages:[{role:'user',content:question}],country:'us',language:'en',enable_citations:true,enable_research:false})};
      }
      const res=await fetcher(url,{...options,redirect:'error',signal:AbortSignal.timeout(25000)});
      if(!res.ok) throw new Error(`Provider HTTP ${res.status}`);
      const raw=await readLimited(res);
      return {startedAt, finishedAt:now(), ...(type==='web'?webEvidence(JSON.parse(raw),data.domain):answerEvidence(raw,data.domain))};
    } catch(error) {
      return {status:'unavailable',startedAt,finishedAt:now(),reason:/^Provider HTTP \d+$/.test(error.message)?error.message:'The provider response could not be verified. Retry or review manually. No absence conclusion can be drawn.'};
    }
  }
  // At most 5 web requests + 5 optional answer requests. No automatic retries.
  for (const q of questions(data)) {
    const web=await request(q.text,'web');
    const answer=answers?await request(q.text,'answer'):{status:'not-measured'};
    report.checks.push({...q,web,answer});
  }
  report.completedAt=now();
  return report;
}
