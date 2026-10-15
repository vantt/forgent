// Author-output repair only. This module never approves rows or changes a gate.
const digestMatches = (unit, digest) => digest && unit.textDigest.startsWith(digest);
export function bindByContent(row, before, current, sourceText) {
  // The prior anchor is meaningful only inside the prior file, never the current file.
  const priorMatches = before.filter(u=>digestMatches(u,row.targetUnitDigest));
  const contextualPrior = row.targetAncestry && priorMatches.filter(u=>JSON.stringify(u.ancestry)===JSON.stringify(row.targetAncestry));
  const prior = before.find(u => u.anchor === row.targetAnchor && digestMatches(u,row.targetUnitDigest))
    || (contextualPrior?.length===1 ? contextualPrior[0] : priorMatches.length===1 ? priorMatches[0] : null);
  let matches = current.filter(u => digestMatches(u,row.targetUnitDigest));
  if (!matches.length && prior) matches = current.filter(u => u.text === prior.text);
  if (!matches.length && sourceText) matches = current.filter(u => u.text === sourceText);
  if (matches.length === 1) return matches[0];
  if (matches.length > 1 && row.targetAncestry) {
    const contextual = matches.filter(u=>JSON.stringify(u.ancestry)===JSON.stringify(row.targetAncestry));
    if (contextual.length === 1) return contextual[0];
  }
  if (matches.length > 1 && prior) {
    const siblings = before.filter(u => u.text === prior.text);
    const same = matches.filter(u => u.text === prior.text);
    // Repeated identical footers retain their reviewed occurrence order. Never
    // choose the nearest positional anchor when occurrence counts disagree.
    if (siblings.length === same.length) return same[siblings.indexOf(prior)];
  }
  throw new Error(`Cannot bind content uniquely for ${row.claimId || row.targetAnchor}: ${matches.length} matches`);
}
export function updateRationale(before, after, specificText) {
  const sameDigest=(a,b)=>a===b || (typeof a==='string' && typeof b==='string' && Math.min(a.length,b.length)>=16 && (a.startsWith(b)||b.startsWith(a)));
  if (before.targetOwner===after.targetOwner && sameDigest(before.sourceUnitDigest,after.sourceUnitDigest) && sameDigest(before.targetUnitDigest,after.targetUnitDigest)) return before.rationale;
  if (!specificText?.trim()) throw new Error('Changed binding requires row-specific rationale');
  return specificText;
}
export function targetCollisions(rows) {
  const owners=new Map();
  for (const row of rows) {
    if (!row.targetOwner || !row.targetAnchor) continue;
    const key=JSON.stringify([row.targetOwner,row.targetAnchor]);
    if (!owners.has(key)) owners.set(key,new Set());
    owners.get(key).add(row.claimId);
  }
  return [...owners].filter(([,ids])=>ids.size>1).map(([key,ids])=>({target:JSON.parse(key),claims:[...ids]}));
}
export function replayLinks(before, actual, edits) {
  const links=text=>text.split('\n').flatMap((line,i)=>[...line.matchAll(/\[([^\]]+)\]\(([^\s)]+)\)/g)].map((m,index)=>({line:i+1,index,label:m[1],destination:m[2],cell:line.slice(0,m.index).split(/(?<!\\)\|/).length-1})));
  const expected=links(before),found=links(actual),errors=[];
  for (const edit of edits) {
    const link=expected.find(l=>l.line===edit.line&&l.index===edit.index);
    if (!link||link.label!==edit.label||link.destination!==edit.before) throw new Error('Replay edit does not match original position');
    link.destination=edit.after;
  }
  for(let i=0;i<Math.max(expected.length,found.length);i++)
    if(JSON.stringify(expected[i])!==JSON.stringify(found[i])) errors.push({expected:expected[i],actual:found[i]});
  return errors;
}
