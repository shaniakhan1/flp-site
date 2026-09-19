// Captured input stays outside the public repository. This tool does not fetch arbitrary URLs.
import{readFileSync,writeFileSync}from'node:fs';
import{planIdentityFix,applyIdentityFix,verifyIdentityFix}from'./identity.mjs';
const [command,...rest]=process.argv.slice(2),args={};for(let i=0;i<rest.length;i+=2)args[rest[i].replace(/^--/,'')]=rest[i+1];
try{
 if(command==='plan'){
  const html=readFileSync(args.html,'utf8'),facts=JSON.parse(readFileSync(args.facts,'utf8'));const plan=planIdentityFix(html,args.url,facts);writeFileSync(args.out,JSON.stringify(plan,null,2),{mode:0o600});console.log(JSON.stringify({status:plan.status,changes:plan.changes.length,plan:args.out}));
 }else if(command==='apply'){
  if(args.approve!=='yes')throw Error('Review the plan, then pass --approve yes.');const plan=JSON.parse(readFileSync(args.plan,'utf8'));const html=readFileSync(args.html,'utf8');writeFileSync(args.out,applyIdentityFix(html,plan),{mode:0o600});console.log(JSON.stringify({status:'written',file:args.out}));
 }else if(command==='verify'){
  const result=verifyIdentityFix(readFileSync(args.html,'utf8'),args.url,JSON.parse(readFileSync(args.facts,'utf8')));writeFileSync(args.out,JSON.stringify(result,null,2),{mode:0o600});console.log(JSON.stringify({status:result.status}));if(result.status!=='verified')process.exitCode=1;
 }else throw Error('Use plan --html file --facts file --url URL --out plan.json; apply --html file --plan plan.json --approve yes --out draft.html; or verify --html file --facts file --url URL --out verification.json.');
}catch(e){console.error(e.message);process.exitCode=1;}
