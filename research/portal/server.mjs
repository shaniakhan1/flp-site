import http from 'node:http';
import {readFileSync,mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {timingSafeEqual} from 'node:crypto';
import Stripe from 'stripe';
import {audit,websiteURL} from './audit.mjs';
import {createStore,hash} from './store.mjs';
const dir=dirname(fileURLToPath(import.meta.url));
const error=(status,message)=>Object.assign(new Error(message),{status});
export function validInput(v){const r={};for(const key of ['business','location','service','website']){if(typeof v?.[key]!=='string'||!v[key].trim()||v[key].length>200)throw error(400,'Add your business, location, service, and website.');r[key]=v[key].trim();}r.website=websiteURL(r.website).href;return r;}
async function body(req){if(!String(req.headers['content-type']).startsWith('application/json'))throw error(415,'Send JSON.');let n=0;const chunks=[];for await(const c of req){n+=c.length;if(n>12000)throw error(413,'Request too large.');chunks.push(c);}return Buffer.concat(chunks).toString();}
export function createPortal({env=process.env,store=createStore(),run=audit,stripe=env.STRIPE_RESTRICTED_KEY?new Stripe(env.STRIPE_RESTRICTED_KEY,{apiVersion:'2026-07-29.dahlia',maxNetworkRetries:1}):null,verify=async token=>{const r=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:env.TURNSTILE_SECRET_KEY,response:token}),signal:AbortSignal.timeout(8000)});return r.json();}}={}){
 const origin=env.PUBLIC_ORIGIN||'http://127.0.0.1:8790';
 const operator=env.FLP_OPERATOR_TOKEN;if(!operator||operator.length<32)throw Error('Configure FLP_OPERATOR_TOKEN.');
 const publicEnabled=env.PUBLIC_SCANS==='true'&&!!env.TURNSTILE_SECRET_KEY&&!!env.TURNSTILE_SITE_KEY;
 if(env.NODE_ENV==='production'&&(!env.DATA_PATH||!origin.startsWith('https://')))throw Error('Production requires a persistent DATA_PATH and HTTPS PUBLIC_ORIGIN.');
 let working=false;
 const work=async()=>{if(working)return;working=true;try{store.cleanup();const row=store.next();if(row){try{store.finish(row.id,await run(JSON.parse(row.input)));}catch{store.finish(row.id,{message:'We could not complete this website check. The site may block crawling, require JavaScript, or be temporarily unavailable. This is not a negative result. Contact shania@flpmarketinggroup.com for a manual review.'},'unavailable');}}}finally{working=false;}};
 const timer=setInterval(work,500);timer.unref();
 const server=http.createServer({maxHeaderSize:8192},async(req,res)=>{
 const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow','Permissions-Policy':'camera=(), microphone=(), geolocation=()','Content-Security-Policy':"default-src 'none'; script-src 'self' https://challenges.cloudflare.com; style-src 'self'; img-src 'self'; connect-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"};
 if(origin.startsWith('https:'))headers['Strict-Transport-Security']='max-age=31536000';
 const send=(status,data,type='application/json')=>{res.writeHead(status,{...headers,'Content-Type':type});res.end(type==='application/json'?JSON.stringify(data):data);};
 try{
 const path=new URL(req.url,'http://local').pathname;
 if(req.method==='GET'&&path==='/health')return send(200,{status:'ok'});
 if(req.method==='GET'&&['/','/app.js','/app.css'].includes(path)){const name=path==='/'?'index.html':path.slice(1);return send(200,readFileSync(`${dir}/public/${name}`),path.endsWith('.js')?'text/javascript':path.endsWith('.css')?'text/css':'text/html');}
 if(req.method==='GET'&&path==='/api/config')return send(200,{publicEnabled,siteKey:publicEnabled?env.TURNSTILE_SITE_KEY:null});
 const supplied=Buffer.from(req.headers.authorization||''),expected=Buffer.from(`Bearer ${operator}`);
 const isOperator=supplied.length===expected.length&&timingSafeEqual(supplied,expected);
 // No proxy headers are trusted here. Edge controls may enforce finer per-IP limits.
 if(!store.quota('requests:'+hash(req.socket.remoteAddress||'unknown'),240,60000))throw error(429,'Please try again in a minute.');
 if(path==='/api/stripe-webhook'&&req.method==='POST'){
  if(!stripe||!env.STRIPE_WEBHOOK_SECRET)throw error(503,'Payments are not connected.');
  const raw=await body(req);let event;try{event=stripe.webhooks.constructEvent(raw,req.headers['stripe-signature'],env.STRIPE_WEBHOOK_SECRET);}catch{throw error(400,'Invalid signature.');}
  if(['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type)){
   const s=event.data.object;
   if(s.payment_status==='paid'&&s.mode==='payment'&&s.currency==='usd'&&s.amount_total===200000){
    const row=store.db.prepare('SELECT * FROM jobs WHERE id=? AND session=? AND approved=1').get(s.metadata?.flp_job||'',s.id);
    if(row){store.db.exec('BEGIN IMMEDIATE');try{if(!store.db.prepare('SELECT id FROM events WHERE id=?').get(event.id)){store.db.prepare('INSERT INTO events VALUES(?)').run(event.id);store.db.prepare('UPDATE jobs SET paid=1,expires=? WHERE id=?').run(Date.now()+180*86400000,row.id);}store.db.exec('COMMIT');}catch(e){store.db.exec('ROLLBACK');throw e;}}
   }
  }return send(200,{received:true});
 }
 if(req.method==='POST'&&req.headers.origin!==origin&&!isOperator)throw error(403,'Use the FLP portal to submit this request.');
 if(path==='/api/checks'&&req.method==='POST'){
  if(!isOperator&&!publicEnabled)throw error(503,'Online checks are not open yet. Contact shania@flpmarketinggroup.com.');
  const value=JSON.parse(await body(req)),input=validInput(value);
  if(!isOperator){if(typeof value.challenge!=='string'||value.challenge.length>2048)throw error(400,'Complete the security check.');const result=await verify(value.challenge);if(!result.success||result.hostname!==new URL(origin).hostname||result.action!=='audit')throw error(403,'Please repeat the security check.');}
  if(store.db.prepare("SELECT count(*) AS n FROM jobs WHERE status IN ('queued','running')").get().n>=10)throw error(429,'The check queue is full. Please try later.');
  if(!store.quota('daily-audits',50,86400000)||!store.quota('domain:'+new URL(input.website).hostname,3,86400000))throw error(429,'The check limit has been reached. Please try tomorrow.');
  return send(202,store.create(input));
 }
 if(path==='/api/operator/jobs'&&req.method==='GET'){if(!isOperator)throw error(401,'Operator access required.');return send(200,store.db.prepare('SELECT id,input,status,created,approved,paid,onboarding FROM jobs WHERE expires>? ORDER BY created DESC LIMIT 50').all(Date.now()).map(r=>({...r,input:JSON.parse(r.input),onboarding:r.onboarding?JSON.parse(r.onboarding):null})));}
 const match=path.match(/^\/api\/reports\/([a-f0-9]{32})(?:\/(approve|checkout|onboarding))?$/);
 if(match){const [,id,action]=match;const row=isOperator?store.db.prepare('SELECT * FROM jobs WHERE id=? AND expires>?').get(id,Date.now()):store.get(id,req.headers['x-report-key']);if(!row)throw error(404,'This private report link is invalid or expired.');
  if(req.method==='GET'&&!action)return send(200,{id,status:row.status,input:JSON.parse(row.input),report:row.report?JSON.parse(row.report):null,approved:!!row.approved,paid:!!row.paid,onboarded:!!row.onboarding,expires:row.expires,paymentReady:!!stripe&&!!env.STRIPE_WEBHOOK_SECRET});
  if(req.method==='POST'&&action==='approve'){if(!isOperator)throw error(403,'FLP approval is required.');if(row.status!=='ready')throw error(409,'Complete the report first.');store.db.prepare('UPDATE jobs SET approved=1 WHERE id=?').run(id);return send(200,{approved:true});}
  if(req.method==='POST'&&action==='checkout'){
   if(!row.approved||row.status!=='ready')throw error(409,'FLP needs to confirm fit and access first.');if(row.paid)throw error(409,'This setup is already paid.');if(!stripe||!env.STRIPE_WEBHOOK_SECRET)throw error(503,'Checkout is not connected yet.');
   const v=JSON.parse(await body(req));if(v.acceptedScope!==true)throw error(400,'Review and accept the setup scope.');
   if(row.session){const existing=await stripe.checkout.sessions.retrieve(row.session);if(existing.status==='open'&&existing.url)return send(200,{url:existing.url});throw error(409,'Please contact FLP to review this checkout.');}
   const session=await stripe.checkout.sessions.create({mode:'payment',integration_identifier:'flp_setup_qrzmktpa',line_items:[{price_data:{currency:'usd',unit_amount:200000,product_data:{name:'FLP Visibility Setup',description:'One location, one priority service, existing website. One revision. Monthly service is separate.'}},quantity:1}],metadata:{flp_job:id,scope_version:'2026-09-19'},success_url:origin+'/?payment=returned',cancel_url:origin+'/?payment=cancelled'},{idempotencyKey:`flp-setup-${id}`});
   store.db.prepare('UPDATE jobs SET session=? WHERE id=?').run(session.id,id);return send(200,{url:session.url});
  }
  if(req.method==='POST'&&action==='onboarding'){
   if(!row.paid)throw error(403,'Payment confirmation is required.');const v=JSON.parse(await body(req));const data={};for(const k of ['contactName','email','websitePlatform','profileURL','priority','approvalContact']){if(typeof v[k]!=='string'||!v[k].trim()||v[k].length>1000)throw error(400,'Complete each onboarding field.');data[k]=v[k].trim();}if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))throw error(400,'Enter a valid email address.');store.db.prepare('UPDATE jobs SET onboarding=? WHERE id=?').run(JSON.stringify(data),id);return send(200,{saved:true});
  }
 }
 throw error(404,'Not found');
 }catch(e){send(e.status|| (e instanceof SyntaxError?400:500),{error:e.status?e.message:'We could not complete that request. Please try again.'});}
 });server.requestTimeout=15000;server.headersTimeout=10000;server.keepAliveTimeout=5000;server.maxConnections=64;
 server.on('close',()=>clearInterval(timer));return {server,work,store};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const path=process.env.DATA_PATH||`${dir}/data/flp.sqlite`;mkdirSync(dirname(path),{recursive:true,mode:0o700});const app=createPortal({store:createStore(path)});app.server.listen(Number(process.env.PORT||8790),process.env.HOST||'127.0.0.1');}
