// Semantic guard for the candidate documentation link pass. Pure planning only;
// callers own writes and retain the returned classification/evidence records.
import path from 'node:path';
const posix = path.posix;
const relation = /source relationship|original source|canonical|legacy (?:source|owner|documents)|current source|source protocol|source document|source of truth|nguồn (?:gốc|chuẩn)/i;
export function specificTarget(legacy, aliases, candidates, primaryAnchor) {
  const name = posix.basename(legacy);
  const same = candidates.filter(p => posix.basename(p) === name && name !== 'README.md');
  // Preserve the area suffix where restored copies share a filename.
  const suffix = legacy.replace(/^docs\/architect\//, '');
  const exact = same.filter(p => p.endsWith(suffix));
  if (exact.length === 1) return exact[0];
  if (same.length === 1) return same[0];
  const restored = same.filter(p => !/\/(?:history|decisions)\//.test(p));
  if (restored.length === 1) return restored[0];
  const primary = primaryAnchor && aliases.find(a => a.fromPath === legacy + '#' + primaryAnchor);
  if (primary && !primary.toOwner.endsWith('/README.md')) return primary.toOwner;
  const anchored = [...new Set(aliases.filter(a => a.fromPath.startsWith(legacy + '#') && !a.toOwner.endsWith('/README.md')).map(a => a.toOwner))];
  return anchored.length === 1 ? anchored[0] : null;
}
export function planLinkPass({file, text, aliases, candidates, sourceHeadings = {}}) {
  const edits = [], classified = [], ranges = [];
  let offset = 0, fence = null, sourceTable = false, inTable = false;
  for (const line of text.split('\n')) {
    const mark = /^\s*(`{3,}|~{3,})/.exec(line)?.[1];
    if (mark) fence = fence && mark[0] === fence[0] && mark.length >= fence.length ? null : fence || mark;
    const tableRow = line.trim().startsWith('|');
    if (!tableRow) sourceTable = false;
    if (tableRow && !inTable && /current source|canonical|original source/i.test(line)) sourceTable = true;
    inTable = tableRow;
    ranges.push({start:offset, end:offset+line.length+1, protected:!!fence||!!mark, relation:relation.test(line)||sourceTable});
    offset += line.length + 1;
  }
  const result = text.replace(/\[([^\]]+)\]\(([^\s)]+)\)/g, (whole, label, destination, index) => {
    const range = ranges.find(r => r.start <= index && index < r.end);
    if (range.protected || /(^|\/)history\//.test(file) || /^(?:[a-z]+:|#|\/)/i.test(destination)) return whole;
    const [relative, fragment] = destination.split('#');
    const legacy = posix.normalize(posix.join(posix.dirname(file), relative));
    const alias = aliases.find(a => a.fromPath === legacy + (fragment ? '#' + fragment : ''));
    if (!alias) return whole;
    let target = alias.toOwner, anchor = alias.toAnchor || null, reason = 'explicit-alias';
    const record = {file, line:text.slice(0,index).split('\n').length, label, legacy, before:destination};
    if (range.relation || target === file) {
      classified.push({...record, reason:range.relation?'provenance/legacy-owner':'self-link', disposition:'retain-legacy-until-cutover'}); return whole;
    }
    if (!fragment && target.endsWith('/README.md') && posix.basename(legacy) !== 'README.md') {
      const specific = specificTarget(legacy, aliases, candidates, sourceHeadings[legacy]);
      if (!specific && !legacy.startsWith('docs/architect/')) {
        // A general area spec may intentionally resolve to its area portal.
      } else if (!specific) {classified.push({...record, reason:'portal-without-specific-target', disposition:'retain-legacy-and-queue'}); return whole;}
      if (specific) {target = specific; anchor = null; reason = 'specific-candidate';}
    }
    if (target === file) {classified.push({...record, reason:'self-link', disposition:'retain-legacy-until-cutover'}); return whole;}
    let after = posix.relative(posix.dirname(file), target);
    if (anchor) after += '#' + anchor;
    edits.push({...record, after, target, anchor, reason});
    return `[${label}](${after})`;
  });
  return {text:result, edits, classified};
}
