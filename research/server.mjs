import http from 'node:http';
import {timingSafeEqual} from 'node:crypto';
import {runCheck,validate} from './check.mjs';
// Private operator endpoint; do not expose this token in a browser bundle.
export function createServer({key=process.env.BRAVE_SEARCH_API_KEY, token=process.env.FLP_RESEARCH_TOKEN, answers=process.env.FLP_ENABLE_ANSWERS==='true', run=runCheck}={}) {
  if(!token || token.length<32) throw new Error('Set FLP_RESEARCH_TOKEN to a random secret of at least 32 characters.');
  let busy=false, count=0, windowStart=Date.now();
  return http.createServer(async(req,res)=>{
    const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
    if(req.url==='/health' && req.method==='GET') return send(200,{status:'ok',searchConfigured:Boolean(key),answersEnabled:answers});
    const supplied=Buffer.from(req.headers.authorization || ''), expected=Buffer.from(`Bearer ${token}`);
    if(supplied.length!==expected.length || !timingSafeEqual(supplied,expected)) return send(401,{error:'Unauthorized'});
    if(req.url!=='/checks' || req.method!=='POST') return send(404,{error:'Not found'});
    if(!key) return send(503,{error:'Search provider is not connected.'});
    if(busy) return send(429,{error:'A check is already running.'});
    if(Date.now()-windowStart>3600000){windowStart=Date.now();count=0;}
    if(count>=5) return send(429,{error:'Hourly operator limit reached.'});
    if(!(req.headers['content-type'] || '').startsWith('application/json')) return send(415,{error:'Send JSON.'});
    busy=true;
    try {
      let body='',bytes=0;
      req.setTimeout(10000,()=>req.destroy());
      for await(const chunk of req){bytes+=chunk.length;if(bytes>4096){send(413,{error:'Request too large.'});req.destroy();return;}body+=chunk;}
      req.setTimeout(0);
      let input;
      try{input=JSON.parse(body);validate(input);}catch{return send(400,{error:'Provide a valid business, website, service, and location.'});}
      count++;
      send(200,await run(input,{key,answers}));
    } catch {if(!res.headersSent)send(500,{error:'Check could not be completed.'});}
    finally {busy=false;}
  });
}
if(process.argv[1]?.endsWith('/server.mjs')) {
  const server=createServer();server.requestTimeout=15000;server.headersTimeout=10000;
  server.listen(Number(process.env.PORT || 8787),process.env.HOST || '127.0.0.1');
}
