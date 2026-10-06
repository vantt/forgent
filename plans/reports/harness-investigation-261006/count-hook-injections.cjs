#!/usr/bin/env node
// Count hook-injected context in Claude Code transcripts for this repo.
// Measures: per hook event, how many injections, bytes, and how often the two
// contradictory dev-rules blocks (global "Follow YAGNI" vs project "YAGNI only
// with --yagni") land together on the same prompt (same toolUseID).
// Usage: node count-hook-injections.cjs <transcriptDir> [maxFiles]
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const dir = process.argv[2];
const maxFiles = Number(process.argv[3] || 40);
const files = fs.readdirSync(dir)
  .filter((f) => f.endsWith('.jsonl'))
  .map((f) => ({ f, m: fs.statSync(path.join(dir, f)).mtimeMs }))
  .sort((a, b) => b.m - a.m)
  .slice(0, maxFiles)
  .map((x) => path.join(dir, x.f));

const GLOBAL_YAGNI = "Follow **YAGNI (You Aren't Gonna Need It) - KISS";
const PROJECT_YAGNI = 'only when the user\'s own request explicitly passes the `--yagni`';
const NAMING_GLOBAL = /-\{slug\}-report\.md/;
const DESC_GLOBAL = 'For Markdown/plain text reports and plans, use the ## Naming path';
const DESC_PROJECT = 'Skip this guidance if you are creating markdown or plain text files';

const byEvent = {}; // event -> {n, bytes}
const prompts = new Map(); // toolUseID -> {g, p}
const writes = new Map(); // toolUseID -> {g, p}
let userPrompts = 0;

async function scan(file) {
  const rl = readline.createInterface({ input: fs.createReadStream(file), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.includes('"attachment"') && !line.includes('"type":"user"')) continue;
    let o;
    try { o = JSON.parse(line); } catch { continue; }
    if (o.type === 'user' && typeof o.message?.content === 'string' && !o.isMeta) userPrompts++;
    const a = o.attachment;
    if (!a || !a.hookEvent) continue;
    const content = typeof a.content === 'string' ? a.content
      : typeof a.additionalContext === 'string' ? a.additionalContext
      : Array.isArray(a.content) ? a.content.join('\n') : '';
    if (!content) continue;
    const ev = a.hookName || a.hookEvent;
    byEvent[ev] ??= { n: 0, bytes: 0 };
    byEvent[ev].n++;
    byEvent[ev].bytes += Buffer.byteLength(content);
    if (a.hookEvent === 'UserPromptSubmit') {
      const k = file + a.toolUseID;
      const s = prompts.get(k) || { g: 0, p: 0, gNaming: 0 };
      if (content.includes(GLOBAL_YAGNI)) s.g++;
      if (content.includes(PROJECT_YAGNI)) s.p++;
      if (NAMING_GLOBAL.test(content)) s.gNaming++;
      prompts.set(k, s);
    }
    if (a.hookEvent === 'PreToolUse' && ev === 'PreToolUse:Write') {
      const k = file + a.toolUseID;
      const s = writes.get(k) || { g: 0, p: 0 };
      if (content.includes(DESC_GLOBAL)) s.g++;
      if (content.includes(DESC_PROJECT)) s.p++;
      writes.set(k, s);
    }
  }
}

(async () => {
  for (const f of files) await scan(f);
  console.log(`files scanned: ${files.length}`);
  console.log(`user text prompts (approx): ${userPrompts}`);
  console.log('hook injections by event (count, total bytes, avg bytes):');
  for (const [k, v] of Object.entries(byEvent).sort((a, b) => b[1].bytes - a[1].bytes)) {
    console.log(`  ${k}: n=${v.n} bytes=${v.bytes} avg=${Math.round(v.bytes / v.n)}`);
  }
  const rules = [...prompts.values()].filter((s) => s.g || s.p);
  const both = rules.filter((s) => s.g && s.p).length;
  console.log(`UserPromptSubmit prompts carrying a dev-rules block: ${rules.length}`);
  console.log(`  both global-YAGNI and project-YAGNI blocks on same prompt: ${both}`);
  console.log(`  only global: ${rules.filter((s) => s.g && !s.p).length}, only project: ${rules.filter((s) => !s.g && s.p).length}`);
  const w = [...writes.values()].filter((s) => s.g || s.p);
  console.log(`PreToolUse:Write calls with descriptive-name guidance: ${w.length}; both contradictory blocks: ${w.filter((s) => s.g && s.p).length}`);
})();
