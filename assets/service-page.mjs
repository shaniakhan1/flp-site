// Shared, deterministic page drafting. Uses only facts supplied and confirmed by the owner.
export const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function field(v,key,max=500){if(typeof v[key]!=='string'||!v[key].trim()||v[key].length>max)throw Error(`Complete ${key} (${max} characters maximum).`);return v[key].trim();}
export function safeLink(value){const raw=String(value).trim();const u=new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw)?raw:`https://${raw}`);if(u.protocol!=='https:'||u.username||u.password)throw Error('Use an HTTPS link without a login.');return u.href;}
export function makeDraft(input){
 if(input.confirmed!==true)throw Error('Confirm your business details before making a draft.');
 const f={business:field(input,'business',100),service:field(input,'service',100),audience:field(input,'audience',150),location:field(input,'location',100),summary:field(input,'summary',300),process:field(input,'process',1000),limits:field(input,'limits',1000),cta:field(input,'cta',80),website:safeLink(field(input,'website',300)),contact:safeLink(field(input,'contact',300)),pageURL:safeLink(field(input,'pageURL',300))};
 if(new URL(f.pageURL).origin!==new URL(f.website).origin)throw Error('The page URL must belong to your business website.');
 const items=(Array.isArray(input.deliverables)?input.deliverables:String(input.deliverables||'').split('\n')).map(s=>typeof s==='string'?s.trim():s).filter(s=>s!=='');
 if(items.length<2||items.length>8||items.some(s=>typeof s!=='string'||!s.trim()||s.length>240))throw Error('Add 2 to 8 specific deliverables, one per line (240 characters each).');
 f.deliverables=items.map(s=>s.trim());
 const title=`${f.service} | ${f.business}`;
 const description=f.summary.length<=160?f.summary:f.summary.slice(0,157).replace(/\s+\S*$/,'')+'…';
 const sections=[{heading:`Who this is for`,paragraph:`${f.audience}. ${f.location}.`},{heading:'What you receive',items:f.deliverables},{heading:'How it works',paragraph:f.process},{heading:'Before we start',paragraph:f.limits}];
 return {version:1,facts:f,title,description,heading:f.service,intro:f.summary,sections,cta:{label:f.cta,url:f.contact},limits:'Draft assembled from owner-confirmed details. No search rankings, AI recommendations, or customer results have been measured.'};
}
export function renderBody(d){return d.sections.map(s=>`<section><h2>${escapeHTML(s.heading)}</h2>${s.paragraph?`<p>${escapeHTML(s.paragraph)}</p>`:`<ul>${s.items.map(i=>`<li>${escapeHTML(i)}</li>`).join('')}</ul>`}</section>`).join('')+`<aside class="article-cta"><h2>Take the next step.</h2><a class="button" href="${escapeHTML(d.cta.url)}">${escapeHTML(d.cta.label)} ↗</a></aside>`;}
export function renderDocument(d,{approved=false}={}){
 if(!approved)throw Error('Review and approve the draft before exporting a publishable page.');
 const e=escapeHTML;return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><meta name="referrer" content="no-referrer"><title>${e(d.title)}</title><meta name="description" content="${e(d.description)}"><link rel="canonical" href="${e(d.facts.pageURL)}"><style>body{max-width:860px;margin:auto;padding:28px;font:18px/1.7 system-ui,sans-serif;color:#292334;background:#fcfbff}header{border-bottom:1px solid #ddd;padding-bottom:20px}h1{font-size:clamp(36px,6vw,62px);line-height:1.1;letter-spacing:-.04em}h2{font-size:28px;line-height:1.3}section{margin:36px 0}a{color:inherit}.intro{font-size:22px;color:#61586c}.button{display:inline-block;background:#57406e;color:white;text-decoration:none;border-radius:12px;padding:14px 24px}.article-cta{padding:24px;background:#eee6f6;border-radius:20px}p,li,a{overflow-wrap:anywhere}</style></head><body><header><a href="${e(d.facts.website)}">${e(d.facts.business)}</a></header><main><h1>${e(d.heading)}</h1><p class="intro">${e(d.intro)}</p>${renderBody(d)}</main></body></html>`;
}
export function plainText(d){return [d.title,d.intro,...d.sections.flatMap(s=>[s.heading,s.paragraph||s.items.map(i=>'• '+i).join('\n')]),`${d.cta.label}: ${d.cta.url}`].join('\n\n');}
