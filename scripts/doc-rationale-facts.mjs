import path from 'node:path';
// Independent author diagnostic. Does not import the renderer, its classifier,
// its section comparison or its link pairing. Inputs are authenticated file units.
export function auditRationaleFacts(rationale,{source,target,registeredLabels=[],accountOf=()=>null,carrierOf=()=>null}) {
 const findings=[],payload=u=>u?.level?u.sectionText:u?.text;
 const a=payload(source),b=payload(target);
 if(a==null||b==null||source?.unavailable||target?.unavailable)return findings;
 const normalize=t=>t.replace(/^(#{1,6}) .*$/m,'<heading>').replace(/\[([^\]]+)\]\(([^\s)]+)\)/g,'<link>');
 let revised=a;
 const corrections=[];
 for(const line of rationale.split('\n')){
  const m=/^[^\n]+: ("(?:[^"\\]|\\.)*") → ("(?:[^"\\]|\\.)*")(?:;|\.)/.exec(line);
  if(!m)continue;
  const before=JSON.parse(m[1]),after=JSON.parse(m[2]);
  if(!b.includes(after))findings.push({type:'correction-after-absent',after});
  if(!a.includes(before)&&!line.includes('[intermediate state; witness '))findings.push({type:'correction-before-absent',before});
  corrections.push({before,after});
 }
 for(const c of corrections.sort((x,y)=>y.before.length-x.before.length))if(revised.includes(c.before))revised=revised.split(c.before).join(c.after);
 const left=normalize(revised).split('\n').filter(l=>l.trim()),right=normalize(b).split('\n').filter(l=>l.trim());
 const minus=(x,y)=>{const counts=new Map();for(const l of y)counts.set(l,(counts.get(l)||0)+1);return x.filter(l=>{const n=counts.get(l)||0;if(!n)return true;counts.set(l,n-1);return false;});};
 const removed=minus(left,right),added=minus(right,left),order=JSON.stringify(left)===JSON.stringify(right),equal=a===b;
 const section=/Whole direct section (equal|differs); depth [^;]+; (\d+) distinct link changes; normalized line order (equal|differs); (\d+) removed and (\d+) added nonblank lines/.exec(rationale);
 if(section){
  if((section[1]==='equal')!==equal)findings.push({type:'section-equality',expected:equal});
  if((section[3]==='equal')!==order||+section[4]!==removed.length||+section[5]!==added.length)findings.push({type:'section-lines',removed,added,order});
 }
 const arrays=/Exact normalized nonblank line delta: removed (\[[^\n]*\]); added (\[[^\n]*\])\./.exec(rationale);
 if(arrays&&(JSON.stringify(JSON.parse(arrays[1]))!==JSON.stringify(removed)||JSON.stringify(JSON.parse(arrays[2]))!==JSON.stringify(added)))findings.push({type:'section-line-witnesses',removed,added});
 const accounting=rationale.split('\n').filter(l=>l.startsWith('Section accounting (')).join('\n');
 const carriers=/Removed direct-section lines have distinct live carrier witnesses (.+?)\. (?:Added| Exact|Exact|$)/.exec(accounting);
 if(carriers){
  const witnesses=[...carriers[1].matchAll(/(docs\/platform\/[^\s,#]+\.md)#([^\s,.]+)/g)].map(m=>carrierOf(m[1],m[2])).filter(Boolean);
  for(const line of removed)if(!witnesses.some(w=>!(w.path===source.path&&w.anchor===source.anchor&&(w.commit||null)===(source.commit||null))&&normalize(payload(w)).split('\n').includes(line)))findings.push({type:'removed-line-not-carried',line});
 }

 if(equal&&/replacement|replaced|superseded/.test(accounting))findings.push({type:'equal-section-replacement'});
 if(/named corrected successor \/ truth-ledger-agent-coordination\.json/.test(accounting))findings.push({type:'invented-fallback-label'});
 for(const m of accounting.matchAll(/Existing correction labels (.+?) at immutable account ([0-9a-f]+):([^;\s]+);/g)){
  const account=accountOf(m[2],m[3]);
  for(const label of m[1].split(', ')){
   if(!registeredLabels.includes(label))findings.push({type:'unregistered-account-label',label});
   // Whole tokens, case-sensitive; SHA256 cannot authenticate A25.
   const tokens=account?.match(/(?<![A-Za-z0-9_])(?:A\d+|L\d+-\d+[a-z]?)(?![A-Za-z0-9_])/g)||[];
   if(!tokens.includes(label))findings.push({type:'account-label-absent',label,commit:m[2],file:m[3]});
  }
 }
 const links=(u,text)=>[...text.matchAll(/\[([^\]]+)\]\(([^\s)]+)\)/g)].map(m=>{
  const spelling=m[2],[file,fragment]=spelling.split('#');
  const destination=/^(?:[a-z]+:|\/)/i.test(spelling)?spelling:(file?path.posix.normalize(path.posix.join(path.posix.dirname(u.path),file)).replace(/\/$/,''):u.path)+(fragment!==undefined?'#'+fragment:'');
  return {label:m[1],spelling,destination};
 });
 const x=links(source,a),y=links(target,b);
 // Independently align by a longest common sequence of labels or destinations.
 const score=Array.from({length:x.length+1},()=>new Uint32Array(y.length+1));
 const same=(i,j)=>x[i].label===y[j].label||x[i].destination===y[j].destination;
 for(let i=x.length-1;i>=0;i--)for(let j=y.length-1;j>=0;j--)score[i][j]=same(i,j)?score[i+1][j+1]+1:Math.max(score[i+1][j],score[i][j+1]);
 let i=0,j=0;const changes=new Map();
 const record=(before,after)=>{if(before?.spelling===after?.spelling&&before?.label===after?.label)return;changes.set(JSON.stringify([before?.label,after?.label,before?.spelling,after?.spelling]),{before,after});};
 while(i<x.length||j<y.length){if(i<x.length&&j<y.length&&same(i,j)){record(x[i++],y[j++]);}else if(i<x.length&&(j===y.length||score[i+1][j]>=score[i][j+1]))record(x[i++],null);else record(null,y[j++]);}
 const c=[...changes.values()],counts=[x.length,y.length,c.length,c.filter(c=>c.before&&c.after&&c.before.destination!==c.after.destination).length,c.filter(c=>!c.before).length,c.filter(c=>!c.after).length];
 const line=/Links: source (\d+), target (\d+); (\d+) changed spellings\/labels, (\d+) destination changes; (\d+) added, (\d+) removed\./.exec(rationale);
 if(line&&JSON.stringify(line.slice(1).map(Number))!==JSON.stringify(counts))findings.push({type:'link-counts',expected:counts,actual:line.slice(1).map(Number)});
 if(section&&+section[2]!==c.length)findings.push({type:'section-link-count',expected:c.length,actual:+section[2]});
 return findings;
}
