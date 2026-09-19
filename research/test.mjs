import test from 'node:test';
import assert from 'node:assert/strict';
import {validate,questions,webEvidence,answerEvidence,runCheck} from './check.mjs';
import {createServer} from './server.mjs';
const business={business:'Example HVAC',website:'example.com',location:'Houston',service:'AC repair'};
test('discovery does not leak target brand; identity is separate',()=>{
  const qs=questions(validate(business));assert.equal(qs.length,5);
  assert(qs.slice(0,4).every(q=>!q.text.includes(business.business)));
  assert.equal(qs[4].kind,'identity');
});
test('domain matching excludes impersonators and unsafe links',()=>{
  const out=webEvidence({web:{results:[{url:'https://example.com.evil.test'},{url:'javascript:alert(1)'},{url:'https://www.example.com/reviews'}]}},'example.com');
  assert.equal(out.results.length,2);assert.equal(out.results[0].domainMatch,false);assert.equal(out.results[1].domainMatch,true);
  assert.equal(webEvidence({web:{results:[]}},'example.com').status,'inconclusive');
  assert.throws(()=>webEvidence({},'example.com'));
});
function sse(parts,done=true){return parts.map(content=>'data: '+JSON.stringify({choices:[{delta:{content}}]})+'\n\n').join('')+(done?'data: [DONE]\n\n':'');}
test('split citations are preserved; missing/incomplete evidence is never success',()=>{
  const out=answerEvidence(sse(['Example HVAC. <cita','tion>{"number":1,"url":"https://example.com"}</citation>']),'example.com');
  assert.equal(out.text,'Example HVAC.');assert.equal(out.domainCited,true);
  assert.equal(answerEvidence(sse(['An uncited answer']),'example.com').status,'inconclusive');
  assert.throws(()=>answerEvidence(sse(['incomplete'],false),'example.com'));
});
test('provider failure stays unavailable; credentials and unsafe destinations excluded',async()=>{
  let calls=0;
  const report=await runCheck(business,{key:'secret-test',fetcher:async(url,opts)=>{
    calls++;assert.equal(new URL(url).hostname,'api.search.brave.com');assert.equal(opts.redirect,'error');
    return new Response('quota',{status:429});
  }});
  assert.equal(calls,5);assert(report.checks.every(c=>c.web.status==='unavailable'&&c.answer.status==='not-measured'));
  assert(!JSON.stringify(report).includes('secret-test'));
});
test('web and answer evidence remain separate, ten calls maximum',async()=>{
  let calls=0;
  const report=await runCheck(business,{key:'fixture',answers:true,fetcher:async(url)=>{
    calls++;return new URL(url).pathname.includes('completions')?new Response(sse(['A response <citation>{"url":"https://example.com","number":1}</citation>'])):Response.json({web:{results:[{url:'https://example.com',title:'Example'}]}});
  }});
  assert.equal(calls,10);assert.equal(report.reviewStatus,'needs-human-review');
  assert(report.checks.every(c=>c.web.domainFound&&c.answer.domainCited));
});
test('operator endpoint denies anonymous use and fails closed without provider',async()=>{
  const token='x'.repeat(32);const server=createServer({token,key:''});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const url=`http://127.0.0.1:${server.address().port}`;
  try{
    assert.equal((await fetch(url+'/checks',{method:'POST'})).status,401);
    assert.equal((await fetch(url+'/checks',{method:'POST',headers:{Authorization:`Bearer ${token}`}})).status,503);
  }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
test('operator rejects browser requests and oversized bodies before running searches',async()=>{
  const token='z'.repeat(32);let calls=0;
  const server=createServer({token,key:'fixture',run:async()=>{calls++;return {};}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const url=`http://127.0.0.1:${server.address().port}/checks`;
  const headers={Authorization:`Bearer ${token}`,'Content-Type':'application/json'};
  try{
    const denied=await fetch(url,{method:'POST',headers:{...headers,Origin:'https://flpmarketinggroup.com'},body:JSON.stringify(business)});
    assert.equal(denied.status,403);assert.equal(denied.headers.get('x-frame-options'),'DENY');
    assert.equal((await fetch(url,{method:'POST',headers,body:'x'.repeat(5000)})).status,413);
    assert.equal(calls,0);
    for(let n=0;n<5;n++)assert.equal((await fetch(url,{method:'POST',headers,body:JSON.stringify(business)})).status,200);
    assert.equal((await fetch(url,{method:'POST',headers,body:JSON.stringify(business)})).status,429);
    assert.equal(calls,5);
  }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
