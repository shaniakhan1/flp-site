import https from 'node:https';
import {resolve4} from 'node:dns/promises';
import ipaddr from 'ipaddr.js';
import {load} from 'cheerio';
import robotsParser from 'robots-parser';
const agent='FLPVisibilityCheck';
export function publicAddress(address){try{return ipaddr.parse(address).kind()==='ipv4'&&ipaddr.parse(address).range()==='unicast';}catch{return false;}}
export function websiteURL(value){const u=new URL(value.includes('://')?value:`https://${value}`);if(u.protocol!=='https:'||u.username||u.password||u.port||!u.hostname.includes('.')||u.hostname.endsWith('.')||ipaddr.isValid(u.hostname))throw new Error('Use a public HTTPS website, without a port or login.');u.hash='';u.search='';return u;}
// Resolve once and pin the validated public address to the TLS request. Revalidate every redirect.
export async function fetchPage(value,redirects=0,follow=true){
 const u=websiteURL(value), addresses=await Promise.race([resolve4(u.hostname),new Promise((_,reject)=>{const t=setTimeout(()=>reject(new Error('DNS timeout')),5000);t.unref();})]);
 if(!addresses.length||addresses.some(a=>!publicAddress(a)))throw new Error('This address cannot be scanned.');
 const r=await new Promise((resolve,reject)=>{
  const req=https.get(u,{agent:false,lookup:(_h,o,cb)=>o.all?cb(null,[{address:addresses[0],family:4}]):cb(null,addresses[0],4),headers:{'User-Agent':`${agent}/1.0 (+https://flpmarketinggroup.com/methodology/)`,'Accept':'text/html,text/plain','Accept-Encoding':'identity'},signal:AbortSignal.timeout(8000)},res=>{
   let bytes=0;const chunks=[];res.on('data',c=>{bytes+=c.length;if(bytes>750000){res.destroy();reject(new Error('Page too large to check.'));}else chunks.push(c);});res.on('error',reject);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:Buffer.concat(chunks).toString('utf8'),url:u.href}));
  });req.on('error',reject);
 });
 if(follow&&r.status>=300&&r.status<400&&r.headers.location){if(redirects>=3)throw new Error('Too many redirects.');return fetchPage(new URL(r.headers.location,u).href,redirects+1);}
 return r;
}
export function analyzeHTML(html,url,input,headers={}){
 const $=load(html);$('script:not([type="application/ld+json"]),style,noscript,template').remove();
 $('br').replaceWith(' ');
 const title=$('title').first().text().trim(),h1=$('h1').map((i,e)=>$(e).text().trim()).get();
 const desc=$('meta[name="description"]').attr('content')?.trim()||'';
 const robots=($('meta[name="robots"]').attr('content')||'')+' '+(headers['x-robots-tag']||'');
 const text=$('body').text().replace(/\s+/g,' ').trim();
 const schema=[];$('script[type="application/ld+json"]').each((i,e)=>{try{schema.push(JSON.parse($(e).text()));}catch{}});
 const links=$('a[href]').map((i,e)=>({href:$(e).attr('href'),text:$(e).text().trim()})).get();
 const contact=links.some(a=>/^(tel:|mailto:)/i.test(a.href)||/book|contact|quote|schedule/i.test(a.text));
 const cards=[
 ['Search preview',!!title&&!!desc,`Title: ${title||'Not found'}. Description: ${desc||'Not found'}.`,'Write a specific page title and description explaining the service and location.'],
 ['A clear page heading',h1.length===1,`${h1.length} H1 heading(s) found. ${h1.join(' | ').slice(0,250)}`,'Give this page one clear main heading describing the offer.'],
 ['A next step',contact,'Checked page links for contact, quote, booking, email, or phone actions.','Add a clear way to call, request a quote, or book.'],
 ['Indexing permission',!(/\b(noindex|none)\b/i.test(robots)),`Page-level indexing instructions: ${robots.trim()||'No restriction found'}. This does not confirm indexing.`,'Review the noindex instruction before expecting this page in search.'],
 ['Business context in code',schema.length>0,`${schema.length} parseable JSON-LD block(s). Accuracy and suitability still need review.`,'Add accurate structured business information where appropriate. This is not a special AI-ranking requirement.']
 ].map(([title,found,evidence,action])=>({title,status:found?'observed':'needs-review',evidence,action:found?'Keep this accurate as the business changes.':action,source:url}));
 return {checkedAt:new Date().toISOString(),source:url,scope:'One public page, server-rendered HTML only. JavaScript-rendered content may be missed.',cards,firstAction:cards.find(c=>c.status==='needs-review')?.action||'Review your service page against the questions real customers ask.',notMeasured:['Google rankings or indexing','ChatGPT, Claude, Gemini, or Google AI recommendations','Business profile accuracy','Reviews, traffic, leads, or revenue'],summary:`${cards.filter(c=>c.status==='observed').length} of ${cards.length} website checks observed. This is not an AI visibility score.`,business:input.business};
}
export async function audit(input,{fetcher=fetchPage}={}){
 let u=websiteURL(input.website);
 for(let n=0;n<4;n++){
  const robotsURL=new URL('/robots.txt',u).href,robots=await fetcher(robotsURL);
  if(![404,410].includes(robots.status)){
   if(robots.status!==200)throw new Error('Website crawl permission could not be verified.');
   if(robotsParser(robotsURL,robots.body).isAllowed(u.href,agent)===false)throw new Error('This website asks automated checks not to crawl this page.');
  }
  const page=await fetcher(u.href,0,false);
  if(page.status>=300&&page.status<400&&page.headers.location){u=websiteURL(new URL(page.headers.location,u).href);continue;}
  if(page.status!==200||!String(page.headers['content-type']).includes('text/html'))throw new Error('The page could not be read as HTML.');
  return analyzeHTML(page.body,page.url,input,page.headers);
 }
 throw new Error('Too many redirects.');
}
