import {createHash} from 'node:crypto';
const digest=s=>createHash('sha256').update(s).digest('hex');
const cspHash=s=>`'sha256-${createHash('sha256').update(s).digest('base64')}'`;
const norm=s=>String(s||'').toLowerCase().replace(/\s+/g,' ').trim();
function businessObjects(value,facts,result=[]){
 if(!value||typeof value!=='object')return result;
 const types=Array.isArray(value['@type'])?value['@type']:[value['@type']];
 if(types.includes('Organization')&&norm(value.name)===norm(facts.business)){
  try{if(new URL(value.url).origin===new URL(facts.website).origin)result.push(value);}catch{}
 }
 for(const item of Object.values(value))if(item&&typeof item==='object')businessObjects(item,facts,result);
 return result;
}
export function planIdentityFix(html,url,facts){
 if(facts?.confirmed!==true||!facts.business||!/^\d{4}$/.test(String(facts.foundingYear))||Number(facts.foundingYear)<1600||Number(facts.foundingYear)>new Date().getUTCFullYear())throw Error('Confirm the business name, website, and founding year before preparing a change.');
 if(new URL(url).origin!==new URL(facts.website).origin)throw Error('Business website does not match the checked page.');
 let found=0,missing=0,conflict=false,cspBlocked=false;const changes=[];
 let draft=html.replace(/(<script\b[^>]*\btype\s*=\s*["']application\/ld\+json["'][^>]*>)([\s\S]*?)(<\/script\s*>)/gi,(whole,open,raw,close)=>{
  let data;try{data=JSON.parse(raw);}catch{return whole;}
  let updated=0;
  for(const obj of businessObjects(data,facts)){
   found++;
   if(obj.foundingDate!==undefined){if(String(obj.foundingDate)!==String(facts.foundingYear)&&!String(obj.foundingDate).startsWith(String(facts.foundingYear)+'-'))conflict=true;continue;}
   missing++;updated++;obj.foundingDate=String(facts.foundingYear);
  }
  if(!updated)return whole;
  const next=JSON.stringify(data);
  if(/http-equiv\s*=\s*["']Content-Security-Policy["']/i.test(html)&&!html.includes(cspHash(raw))){cspBlocked=true;return whole;}
  changes.push({field:'Organization.foundingDate',before:'Not present',after:String(facts.foundingYear),oldHash:cspHash(raw),newHash:cspHash(next)});
  return open+next+close;
 });
 if(conflict||cspBlocked){draft=html;changes.length=0;}
 for(const c of changes)draft=draft.replaceAll(c.oldHash,c.newHash);
 const status=conflict?'conflict':cspBlocked?'blocked':!found?'not-supported':missing?'draft-ready':'already-consistent';
 return {kind:'business-identity',source:url,checkedAt:new Date().toISOString(),status,confirmedFacts:{business:facts.business,website:facts.website,foundingYear:String(facts.foundingYear),source:facts.source||'Business owner confirmation'},evidence:{matchingOrganizations:found,missingFoundingYear:missing,conflictingFoundingYear:conflict},changes,beforeHash:digest(html),afterHash:digest(draft),draftHTML:draft,limits:'This verifies a business fact in page metadata. It does not measure search indexing, AI recommendations, traffic, or leads.'};
}
export function applyIdentityFix(current,plan){if(plan.status!=='draft-ready')throw Error('No supported change is ready.');if(digest(current)!==plan.beforeHash)throw Error('Page changed after review. Generate a fresh draft.');if(digest(plan.draftHTML)!==plan.afterHash)throw Error('Draft integrity check failed.');return plan.draftHTML;}
export function verifyIdentityFix(html,url,facts){const p=planIdentityFix(html,url,facts);return {source:url,verifiedAt:new Date().toISOString(),status:p.status==='already-consistent'?'verified':'not-verified',evidence:p.evidence,limits:p.limits};}
