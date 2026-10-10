import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const root = process.cwd();
const base = process.argv[2];
const inputPath = process.argv[3];
if (!base || !inputPath) throw new Error('Usage: node scan-coordination-liveness.mjs <source commit> <classification input>');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const roots = ['src/', 'packages/', 'apps/', 'bin/', 'core/skills/', 'domains/', 'scripts/', 'docs/specs/'];
const all = git('ls-files', '-z').split('\0').filter(Boolean);
const paths = all.filter(p => p === 'AGENTS.md' || roots.some(r => p.startsWith(r)))
  .filter(p => !p.includes('secrets.local.env') && !/(^|\/)(node_modules|target|dist|build|\.git)\//.test(p));
const live = [];
const skippedBinary = [];
for (const p of paths) {
  const bytes = fs.readFileSync(path.join(root, p));
  if (bytes.includes(0)) { skippedBinary.push(p); continue; }
  live.push({ path: p, sha256: createHash('sha256').update(bytes).digest('hex'), lines: bytes.toString('utf8').split('\n') });
}
const symbolIndex = new Map();
for (const source of live) source.lines.forEach((line, i) => {
  for (const symbol of new Set(line.match(/\b[A-Z][a-z]+(?:[A-Z][A-Za-z0-9]*)+\b/g) || [])) {
    const hits = symbolIndex.get(symbol) || [];
    hits.push({ path: source.path, line: i + 1, text: line.trim() });
    symbolIndex.set(symbol, hits);
  }
});
const findings = input.files.map(file => {
  const text = git('show', `${base}:${file.path}`);
  const basename = path.basename(file.path);
  const adr = basename.match(/^(ADR-\d+)/)?.[1];
  const basenameReference = new RegExp(`(^|[^A-Za-z0-9_./-])${basename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^A-Za-z0-9_.-])`);
  const references = [];
  const relativeReferences = new Set();
  for (const source of live) {
    for (const reference of source.lines.join('\n').matchAll(/\]\(([^)\s#]+)(?:#[^)\s]*)?\)/g)) {
      const raw = reference[1];
      if (raw.startsWith('.') && path.normalize(path.join(path.dirname(source.path), raw)) === file.path) relativeReferences.add(source.path + '|' + raw);
      if (raw.startsWith('.') && path.normalize(path.join(path.dirname(source.path), raw)) === file.path.replace('docs/platform/', 'docs/architect/')) relativeReferences.add(source.path + '|' + raw);
    }
  }
  for (const source of live) source.lines.forEach((line, i) => {
    if (line.includes(file.path) || line.includes(file.path.replace('docs/platform/', 'docs/architect/')) ||
        basenameReference.test(line) || [...relativeReferences].some(r => r.startsWith(source.path + '|') && line.includes(r.slice(source.path.length + 1))) || (adr && new RegExp(`\\b${adr}\\b`).test(line))) {
      references.push({ path: source.path, line: i + 1, text: line.trim() });
    }
  });
  const sections = file.sections.map(section => {
    const shown = text.split('\n').slice(section.startLine - 1, section.endLine).join('\n');
    const symbols = [...new Set((shown.match(/\b[A-Z][a-z]+(?:[A-Z][A-Za-z0-9]*)+\b/g) || []).filter(s => s.length >= 6))];
    const symbolHits = [];
    for (const symbol of symbols) {
      for (const hit of symbolIndex.get(symbol) || []) symbolHits.push({ ...hit, symbols: [symbol] });
    }
    const implementationPaths = [...new Set((shown.match(/(?:src|packages|apps|bin|core|domains|scripts)\/[A-Za-z0-9_./-]+\.(?:mjs|js|ts|rs|yaml|json)/g) || []))]
      .filter(p => fs.existsSync(path.join(root, p))).map(p => ({ path: p, blob: git('rev-parse', `HEAD:${p}`).trim() }));
    const protects = references.length > 0 || symbolHits.length > 0 || implementationPaths.length > 0 || file.ownerCurrent;
    return { ...section, sourceSha256: createHash('sha256').update(shown).digest('hex'), symbols,
      liveSymbolHitCount: symbolHits.length, liveSymbolExamples: symbolHits.slice(0, 25), implementationPaths,
      defaultClassification: protects ? 'current-by-default' : 'no-live-reference-found',
      retirementEligible: !protects && section.reviewLabel === 'retired',
      note: 'Direct file citations protect all sections until individually adjudicated. Symbol examples are capped at 25; the count includes all matches. Historical/comment references are not silently excluded. A lexical hit protects content by default, but is not proof that every old sentence is implemented.' };
  });
  return { path: file.path, sourceBlob: git('rev-parse', `${base}:${file.path}`).trim(),
    directReferences: references, ownerCurrent: file.ownerCurrent || false, reviewVerdict: file.reviewVerdict,
    sections, wholeFileRetirementEligible: sections.length > 0 && sections.every(s => s.retirementEligible) };
});
console.log(JSON.stringify({ version: 1, sourceCommit: base, scanCommit: git('rev-parse', 'HEAD').trim(), roots: [...roots, 'AGENTS.md'],
  liveInputs: live.map(({ path, sha256 }) => ({ path, sha256 })), skippedBinary,
  method: 'Read every tracked textual input in the required live roots. Scan exact platform/legacy paths, basenames and ADR ids, section type symbols and surviving implementation paths. Any live reference/implementation protects current material by default. Retirement requires both retired subject and no live protection; proposal status is not retirement.',
  files: findings }, null, 2));
