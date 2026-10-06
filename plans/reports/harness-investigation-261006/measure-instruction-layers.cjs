#!/usr/bin/env node
// Measure the always-loaded instruction layers of a Claude Code session in this
// repo: bytes, approx tokens, load order, and exact duplicated blocks across
// layers (paragraph = lines between blank lines, whitespace-normalized,
// >= 80 chars so headings/one-word lines don't count).
// Usage: node measure-instruction-layers.cjs <repoRoot>
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const repo = path.resolve(process.argv[2] || process.cwd());
const home = os.homedir();
const ls = (d) => fs.readdirSync(d).filter((f) => f.endsWith('.md')).sort().map((f) => path.join(d, f));

// Load order as rendered into the session's system-reminder (observed in a live
// subagent context on 2026-10-06): user CLAUDE.md -> its @imports -> user rules ->
// project CLAUDE.md -> its @imports -> project rules -> auto-memory index.
const layers = [
  ['user CLAUDE.md', path.join(home, '.claude/CLAUDE.md')],
  ['user @RTK.md', path.join(home, '.claude/RTK.md')],
  ...ls(path.join(home, '.claude/rules')).map((f) => ['user rules', f]),
  ['project CLAUDE.md', path.join(repo, 'CLAUDE.md')],
  ['project @AGENTS.md', path.join(repo, 'AGENTS.md')],
  ...ls(path.join(repo, '.claude/rules')).map((f) => ['project rules', f]),
  ['auto-memory MEMORY.md', path.join(home, '.claude/projects/-home-vantt-projects-forgentX/memory/MEMORY.md')],
];
const onDemand = [['domains/coding/AGENTS.md (read by fgos-routing, not auto-loaded)', path.join(repo, 'domains/coding/AGENTS.md')]];

const tok = (s) => Math.round(s.length / 3.6); // chars/3.6: mixed EN/VI markdown heuristic
let total = 0; let totalTok = 0;
const blocks = new Map(); // hash -> [{file, line}]
console.log('| # | layer | file | bytes | ~tokens |');
console.log('|---|---|---|---|---|');
layers.forEach(([layer, f], i) => {
  if (!fs.existsSync(f)) { console.log(`| ${i + 1} | ${layer} | ${f} | MISSING | |`); return; }
  const s = fs.readFileSync(f, 'utf8');
  const b = Buffer.byteLength(s);
  total += b; totalTok += tok(s);
  console.log(`| ${i + 1} | ${layer} | ${f.replace(home, '~').replace(repo + '/', '')} | ${b} | ${tok(s)} |`);
  const lines = s.split('\n');
  let start = 0; let buf = [];
  const flush = (end) => {
    const text = buf.join(' ').replace(/\s+/g, ' ').trim();
    if (text.length >= 80) {
      const h = crypto.createHash('sha1').update(text).digest('hex');
      if (!blocks.has(h)) blocks.set(h, { text, at: [] });
      blocks.get(h).at.push(`${f.replace(home, '~').replace(repo + '/', '')}:${start + 1}-${end}`);
    }
    buf = [];
  };
  lines.forEach((l, idx) => {
    if (l.trim() === '') { if (buf.length) flush(idx); start = idx + 1; } else { if (!buf.length) start = idx; buf.push(l); }
  });
  if (buf.length) flush(lines.length);
});
console.log(`\nTOTAL always-loaded markdown: ${total} bytes, ~${totalTok} tokens`);
for (const [l, f] of onDemand) {
  const s = fs.readFileSync(f, 'utf8');
  console.log(`on-demand: ${l}: ${Buffer.byteLength(s)} bytes, ~${tok(s)} tokens`);
}
const dups = [...blocks.values()].filter((v) => v.at.length > 1);
let dupBytes = 0;
console.log(`\nExact duplicated paragraphs (>=80 chars) across/within layers: ${dups.length}`);
for (const d of dups.sort((a, b) => b.text.length * b.at.length - a.text.length * a.at.length)) {
  dupBytes += d.text.length * (d.at.length - 1);
  console.log(`- x${d.at.length} (${d.text.length} ch): ${d.at.join(' ; ')} :: "${d.text.slice(0, 70)}..."`);
}
console.log(`Redundant bytes (copies beyond the first): ~${dupBytes} (${(100 * dupBytes / total).toFixed(1)}% of total)`);
