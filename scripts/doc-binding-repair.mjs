import path from 'node:path';
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

// Author-output only: callers resolve and authenticate every unit from a row's
// binding. Old rationale text is deliberately not an input to this renderer.
export function generateBindingRationale(facts) {
  const {source, target, lastReviewed, disposition, reason, links, corrections = []} = facts;
  for (const [name, unit] of [['source', source], ...(target ? [['target', target]] : [])]) {
    if (unit?.unavailable && unit.path && unit.anchor && /^[a-f0-9]{64}$/.test(unit.textDigest)) continue;
    if (!unit?.path || !unit.anchor || !Number.isInteger(unit.startLine) ||
        !Number.isInteger(unit.endLine) || unit.startLine < 1 || unit.endLine < unit.startLine ||
        !/^[a-f0-9]{64}$/.test(unit.textDigest)) throw new Error(`Missing authenticated ${name} binding facts`);
  }
  if (!reason?.trim() || !disposition) throw new Error('Disposition and specific reason required');
  if (!links || !(Number.isInteger(links.sourceCount) || source.unavailable && links.sourceCount === null) || !(Number.isInteger(links.targetCount) || target?.unavailable && links.targetCount === null) || !Array.isArray(links.changes)) throw new Error('Bound link facts required');
  const cite = u => `${u.path}:${u.startLine}-${u.endLine}#${u.anchor}`;
  const lines = [
    source.unavailable ? `Source: ${source.path}#${source.anchor}; historical text/line witness unavailable; bound unit SHA256 ${source.textDigest}.` : `Source: ${cite(source)} (${source.commit ? 'historical witness at ' + source.commit : 'current lines'}); unit SHA256 ${source.textDigest}.`,
    target ? target.unavailable ? `Target: ${target.path}#${target.anchor}; historical text/line witness unavailable; bound unit SHA256 ${target.textDigest}.` : `Target: ${cite(target)} (${target.commit ? 'historical witness at '+target.commit+'; absent from current binding location' : 'current lines'}); unit SHA256 ${target.textDigest}.` : 'Target: none; retained identity has no mapped platform copy.',
  ];
  if (target) {
    lines.push(`Source and target unit digests ${source.textDigest === target.textDigest ? 'equal' : 'differ'}.`);
    const prior = lastReviewed?.targetUnitDigest;
    lines.push(prior ? `Target ${target.textDigest.startsWith(prior) ? 'unchanged' : 'changed'} since last reviewed digest ${prior} at ${lastReviewed.commit}.` : 'No prior reviewed target digest available; no unchanged-since-review claim.');
  }
  const changes = links.changes;
  lines.push(`Links: source ${links.sourceCount ?? 'unavailable'}, target ${links.targetCount ?? 'unavailable'}; ${changes.length} changed spellings/labels, ${changes.filter(c => c.before && c.after && c.before !== c.after).length} destination changes; ${changes.filter(c => !c.before).length} added, ${changes.filter(c => !c.after).length} removed.`);
  for (const c of changes) lines.push(`Link ${c.index + 1}: ${JSON.stringify(c.beforeLabel)} (${c.beforeSpelling}) → ${JSON.stringify(c.afterLabel)} (${c.afterSpelling}); resolved ${c.before || 'none'} → ${c.after || 'none'}.`);
  if (source.level || target?.level) lines.push(`Heading depth: ${source.level ?? 'not a heading'} → ${target?.level ?? 'not a heading'}; title ${JSON.stringify(source.title ?? source.text)} → ${JSON.stringify(target?.title ?? target?.text ?? 'none')}.`);
  if ((source.level || target?.level) && source.sectionText && target?.sectionText) {
    const d=describeSectionChange(source,target,corrections);
    lines.push(`Whole direct section ${d.equal?'equal':'differs'}; depth ${source.level??'block'} → ${target.level??'block'}; ${d.linkChanges} distinct link changes; normalized line order ${d.normalizedOrderEqual?'equal':'differs'}; ${d.unexplainedRemoved.length} removed and ${d.unexplainedAdded.length} added nonblank lines after heading/link/correction normalization.`);
  }
  if(facts.sectionExplanation)lines.push(`Section accounting (${facts.sectionExplanation.kind}): ${facts.sectionExplanation.description}`);
  lines.push(corrections.length ? 'Applicable labelled corrections:' : 'Applicable labelled corrections: none in this bound unit.');
  for (const c of corrections) {
    if (!c.id || !c.before || !c.after) throw new Error('Correction requires label and exact before/after facts');
    validateCorrection(c, source, target);
    lines.push(`${c.id}${c.intermediate ? ' [intermediate state; witness '+c.witness.commit+']' : ''}: ${JSON.stringify(c.before)} → ${JSON.stringify(c.after)}${c.evidence ? '; evidence ' + c.evidence : ''}.`);
  }
  for (const ref of facts.references || []) lines.push(`Related binding evidence ${ref.path}:${ref.line}: ${JSON.stringify(ref.text)}.`);
  lines.push(`Disposition ${disposition}: ${reason}`, 'Conservation accounting only; current truth, promotion, retirement and cutover require their own evidence.');
  return lines.join('\n');
}

// Deterministic author consistency audit, not an acceptance gate. Recompute facts
// from the binding before invoking this; never validate against saved prose.
export function checkBindingRationale(rationale, facts) {
  const expected = generateBindingRationale(facts);
  return rationale === expected ? [] : [{type:'rationale-binding-inconsistent', expected, actual:rationale}];
}

export function checkLegacyRationale(rationale, {source, target, targetIdentity = target}) {
  const findings = [];
  rationale = rationale.split(/Prior rationale:/i)[0].split(/Recorded residual:/i)[0].split('\n').filter(line=>!/^Link \d+:|^Related binding evidence |^Section accounting \(/.test(line)).join('\n');
  for (const [role, unit] of [['source', source], ['candidate', target], ['target', target]]) {
    if (!unit) continue;
    const ranges = [...rationale.matchAll(new RegExp(`\\(${role} lines? (\\d+)[-–](\\d+)\\)`, 'gi'))];
    for (const m of ranges) if (+m[1] !== unit.startLine || +m[2] !== unit.endLine) findings.push({type:'stale-rationale-lines',role,cited:[+m[1],+m[2]],bound:[unit.startLine,unit.endLine]});
    const escaped = unit.path.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    for (const m of rationale.matchAll(new RegExp(`${escaped}#([\\p{L}\\p{N}_-]+)`, 'gu'))) {
      // Historical/prior anchors may be intentionally contrasted with the current
      // binding. An explicit historical context is not a current-anchor claim.
      const context = rationale.slice(Math.max(0,m.index-90),m.index);
      if (m[1] !== unit.anchor && !(source?.path === targetIdentity?.path && [source.anchor,targetIdentity.anchor].includes(m[1])) && !/historical|prior |previous |old |predecessor/i.test(context)) findings.push({type:'stale-rationale-anchor',role,cited:m[1],bound:unit.anchor});
    }
  }
  if (source && target) {
    if (/full native unit digest is equal/i.test(rationale) && source.textDigest !== target.textDigest) findings.push({type:'false-rationale-digest-equality'});
    if (/(?:carried byte-identical|selected unit is byte-equal|complete direct unit remains byte-equal)/i.test(rationale) && source.text !== target.text) findings.push({type:'false-rationale-text-equality'});
  }
  return findings;
}

export function describeBindingLinks(source, target) {
  const extract = unit => [...((unit?.level ? unit.sectionText : unit?.text) || '').matchAll(/\[([^\]]+)\]\(([^\s)]+)\)/g)].map(m => {
    const spelling=m[2], [file, fragment]=spelling.split('#');
    const destination=/^(?:[a-z]+:|\/)/i.test(spelling) ? spelling :
      (file ? path.posix.normalize(path.posix.join(path.posix.dirname(unit.path),file)).replace(/\/$/,'') : unit.path) + (fragment !== undefined ? '#'+fragment : '');
    return {label:m[1],spelling,destination};
  });
  const a=extract(source),b=extract(target),dp=Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));
  const same=(x,y)=>x.label===y.label||x.destination===y.destination;
  for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)dp[i][j]=same(a[i],b[j])?1+dp[i+1][j+1]:Math.max(dp[i+1][j],dp[i][j+1]);
  const pairs=[];let i=0,j=0,removed=[],added=[];
  const flush=()=>{for(const n of removed)pairs.push([n,undefined]);for(const n of added)pairs.push([undefined,n]);removed=[];added=[];};
  while(i<a.length||j<b.length){
    if(i<a.length&&j<b.length&&same(a[i],b[j])){flush();pairs.push([i++,j++]);}
    else if(i<a.length&&(j===b.length||dp[i+1][j]>=dp[i][j+1]))removed.push(i++);
    else added.push(j++);
  }
  flush();
  const changes=pairs.filter(([x,y])=>a[x]?.spelling!==b[y]?.spelling||a[x]?.label!==b[y]?.label).map(([x,y])=>({
    index:y??x,sourceIndex:x??null,targetIndex:y??null,before:a[x]?.destination||null,after:b[y]?.destination||null,
    beforeSpelling:a[x]?.spelling||'none',afterSpelling:b[y]?.spelling||'none',beforeLabel:a[x]?.label||'none',afterLabel:b[y]?.label||'none',
  }));
  const distinct=new Map();
  for(const c of changes){const key=JSON.stringify([c.beforeLabel,c.afterLabel,c.beforeSpelling,c.afterSpelling]);
    if(distinct.has(key))distinct.get(key).occurrences++;else distinct.set(key,{...c,occurrences:1});}
  return {sourceCount:source?.unavailable?null:a.length,targetCount:target?.unavailable?null:b.length,changes:[...distinct.values()]};
}

// The package caller must load row from git show <commit>:<shard>, then pass it
// here. Never use an intermediate edit log's after object as current evidence.
export function reviewEntryFromCommittedRow(entry, row, commit) {
  if (!commit?.trim()) throw new Error('Committed row snapshot requires a commit');
  if ((entry.claimId || entry.relatedClaimId) !== row.claimId) throw new Error('Committed row claim mismatch');
  return {...entry, currentContentCommit:commit, authorSession:row.authoredBy,
    currentDecision:structuredClone(row),
    ...('after' in entry ? {after:typeof entry.after==='string'?row.rationale:structuredClone(row)} : {}),
  };
}

export function bindingCorrections(target, records) {
  if (!target) return [];
  const payload=target.level?target.sectionText:target.text,found=[];
  for(const record of records.filter(r=>r.path===target.path&&r.after)){
    let after=record.after;const composedWith=[];
    // Later exact corrections may revise part of an earlier corrected fragment.
    // Compose each once, then require the final fragment in the bound payload.
    for(const next of records)if(next!==record&&next.path===target.path&&next.before&&next.before!==next.after&&after.includes(next.before)){
      after=after.replace(next.before,next.after);composedWith.push(next.id);
    }
    if(payload?.includes(after))found.push({...record,after,composedWith});
  }
  return found;
}

// A deliberately reviewed rationale is an authored artifact, not renderer cache.
export function frozenRationale(row, frozen) {
  const keys=['claimId','sourcePath','sourceAnchor','sourceUnitDigest','targetOwner','targetAnchor','targetUnitDigest','targetAncestry','disposition'];
  const match=frozen.find(f=>keys.every(k=>JSON.stringify(f[k]??null)===JSON.stringify(row[k]??null)));
  return match?.rationale ?? null;
}
export function resolveSourceOccurrence(row, current, historical=[]) {
  const matches=us=>us.filter(u=>u.textDigest.startsWith(row.sourceUnitDigest));
  const old=matches(historical),now=matches(current),witness=old.find(u=>u.anchor===row.sourceAnchor);
  if(witness){
    if(old.length===now.length&&now.length)return now[old.indexOf(witness)];
    return witness;
  }
  const exact=now.find(u=>u.anchor===row.sourceAnchor);
  if(exact)return exact;
  if(now.length===1)return now[0];
  if(now.length)throw new Error(`Ambiguous source occurrence for ${row.claimId}`);
  return null;
}
export function auditSourceOccurrences(records) {
  const seen=new Map();
  for(const {claimId,source} of records){
    const key=JSON.stringify([source.path,source.commit||null,source.anchor]);
    if(seen.has(key)&&seen.get(key)!==claimId)throw new Error(`Identical units require distinct source occurrences: ${seen.get(key)}, ${claimId}`);
    seen.set(key,claimId);
  }
}
export function validateCorrection(c, source, target) {
  const payload=u=>u?.level?u.sectionText:u?.text;
  if(!payload(source)?.includes(c.before)){
    if(!c.intermediate)throw new Error(`Correction ${c.id} before text absent from bound source`);
    if(!c.witness?.commit||!c.witness.text?.includes(c.before))throw new Error(`Correction ${c.id} intermediate witness required`);
  }
  if(!payload(target)?.includes(c.after))throw new Error(`Correction ${c.id} after text absent from bound target`);
}
// A line-level conservation diagnostic. Whole direct sections follow the native
// extractor boundary (the next heading), including all intervening blocks.
export function describeSectionChange(source,target,corrections=[]) {
  const payload=u=>u?.level?u.sectionText:u?.text;
  const a=payload(source),b=payload(target);
  if(a==null||b==null)throw new Error('Whole section payload required');
  const links=describeBindingLinks(source,target);
  let revised=a;
  for(const c of [...corrections].sort((a,b)=>(b.before?.length||0)-(a.before?.length||0)))if(c.before&&revised.includes(c.before))revised=revised.split(c.before).join(c.after);
  const normalize=t=>t.replace(/^(#{1,6}) .*$/m,'<heading>').replace(/\[([^\]]+)\]\(([^\s)]+)\)/g,'<link>');
  const aa=normalize(revised).split('\n').filter(l=>l.trim()),bb=normalize(b).split('\n').filter(l=>l.trim());
  // Multisets preserve duplicate lines. Removed/added line witnesses are printed
  // in full for independent review; a missing line is never called conserved.
  const subtract=(x,y)=>{const rest=[...y];return x.filter(l=>{const i=rest.indexOf(l);if(i<0)return true;rest.splice(i,1);return false;});};
  return {equal:a===b,normalizedOrderEqual:aa.join('\n')===bb.join('\n'),depthChanged:source.level!==target.level,titleChanged:source.title!==target.title,
    linkChanges:links.changes.length,unexplainedRemoved:subtract(aa,bb),unexplainedAdded:subtract(bb,aa)};
}

export function checkSectionExplanation(delta, explanation={}) {
  const normalize=t=>t.replace(/^(#{1,6}) .*$/m,'<heading>').replace(/\[([^\]]+)\]\(([^\s)]+)\)/g,'<link>');
  const findings=[];
  for(const [side,lines] of [['removed',delta.unexplainedRemoved],['added',delta.unexplainedAdded]]){
    for(const line of lines){
      const witnesses=explanation[side+'Witnesses']||[];
      if(!witnesses.some(w=>w.path&&w.anchor&&normalize(w.text).includes(normalize(line))))findings.push({type:'unexplained-section-'+side,line});
    }
  }
  return findings;
}
