// Records-only corpus scan. Tokenization is Markdown-aware; regex below only
// compares link destinations INSIDE already-tokenized literal code, never finds code.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

const modulePath = process.argv[2];
if (!modulePath) throw new Error('Pass the installed marked ESM module path');
const {marked} = await import(pathToFileURL(modulePath).href);
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const files = dir => fs.readdirSync(dir, {withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name)).flatMap(e => {
  const p = path.join(dir, e.name);
  return e.isDirectory() ? files(p) : [p];
});
const normalize = raw => raw.replace(/\]\([^)]+\)/g, '](__DESTINATION__)');
const literals = text => {
  const result = [];
  marked.walkTokens(marked.lexer(text, {gfm:true}), t => {
    if (t.type === 'codespan' || t.type === 'code') result.push({type:t.type, raw:t.raw, text:t.text});
  });
  return result;
};
const reportPath = new URL('./g0-code-span-scan.json', import.meta.url);
const previousScan = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const priorInlineRepairs = previousScan.priorInlineRepairs ?? previousScan.candidates.filter(r=>r.classification === 'rewriter corruption restored');
const committedScan = JSON.parse(execFileSync('git',['show','HEAD:plans/260925-documentation-authority-unification/reports/phase-09/rebind/g0-code-span-scan.json'],{encoding:'utf8',maxBuffer:50*1024*1024}));
const priorInlineScan = previousScan.priorInlineScan ?? {sourceHead:committedScan.sourceHead,
  beforeCodeSpans:committedScan.beforeCodeSpans, afterCodeSpans:committedScan.afterCodeSpans,
  corruptSpansRestored:committedScan.corruptSpansRestored, unresolved:committedScan.unresolved};
const platformFiles = files('docs/platform');
const sourceFiles = files('docs').filter(p => !p.startsWith('docs/platform/'));
const sourceTexts = [];
const sources = new Map();
for (const file of sourceFiles) {
  const text = fs.readFileSync(file, 'utf8');
  sourceTexts.push({file, text, fileSha256:sha(text)});
  for (const token of literals(text)) {
    if (!token.raw.includes('](')) continue;
    const key = token.type + '\0' + normalize(token.text);
    const list = sources.get(key) ?? [];
    list.push({file, fileSha256:sha(text), ...token});
    sources.set(key, list);
  }
}
for (const argument of process.argv.slice(3)) {
  const split = argument.lastIndexOf('@');
  const file = argument.slice(0, split), commit = argument.slice(split + 1);
  const text = execFileSync('git',['show',`${commit}:${file}`],{encoding:'utf8',maxBuffer:50*1024*1024});
  sourceTexts.push({file, commit, text, fileSha256:sha(text)});
}
const candidates = [], counts = {codespan:0, code:0};
for (const file of platformFiles) {
  const text = fs.readFileSync(file, 'utf8');
  for (const token of literals(text)) {
    counts[token.type]++;
    if (!token.raw.includes('](')) continue;
    const matches = sources.get(token.type + '\0' + normalize(token.text)) ?? [];
    // Historical wrappers contain Markdown, not just source code tokens.
    const witnesses = [...sourceTexts];
    for (const match of text.matchAll(/`?(docs\/[^`\s]+)`? at `?([0-9a-f]{7,40})/g)) {
      try {
        const content = execFileSync('git', ['show', `${match[2]}:${match[1]}`], {encoding:'utf8', stdio:['ignore','pipe','ignore'], maxBuffer:50*1024*1024});
        witnesses.push({file:match[1], commit:match[2], text:content, fileSha256:sha(content)});
      } catch { /* unresolved provenance remains an explicit investigation */ }
    }
    // Native same-file originals use their first commit, never current bytes.
    const first = execFileSync('git', ['log','--diff-filter=A','--format=%H','--',file], {encoding:'utf8'}).trim().split('\n').at(-1);
    if (first) {
      const content = execFileSync('git',['show',`${first}:${file}`],{encoding:'utf8',maxBuffer:50*1024*1024});
      witnesses.push({file, commit:first, text:content, fileSha256:sha(content)});
    }
    const exact = matches.find(source => source.text === token.text) ?? witnesses.find(source => source.text.includes(token.text));
    const source = exact ?? matches[0] ?? witnesses.find(source => normalize(source.text).includes(normalize(token.text)));
    candidates.push({file, type:token.type, literalSha256:sha(token.text), literalBytes:Buffer.byteLength(token.text),
      raw:token.raw.length <= 1200 ? token.raw : token.raw.slice(0, 240) + '… [full literal authenticated by digest; replay scanner]',
      line:text.slice(0, text.indexOf(token.raw)).split('\n').length,
      classification:exact ? 'exact legacy source literal' : source ? 'retargeted literal: restore required' : 'requires source investigation',
      source:source ? {path:source.file, commit:source.commit ?? 'HEAD', fileSha256:source.fileSha256,
        literalSha256:sha(token.text), byteExact:!!exact} : null});
  }
}
const restores = [];
for (const file of execFileSync('git',['diff','--name-only','--','docs/platform'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)) {
  const before = literals(execFileSync('git',['show',`HEAD:${file}`],{encoding:'utf8',maxBuffer:50*1024*1024}));
  const after = literals(fs.readFileSync(file,'utf8'));
  if (before.length !== after.length) throw new Error(`Literal census changed: ${file}`);
  before.forEach((old,i) => {
    if (old.text !== after[i].text) restores.push({file, type:old.type, before:old.raw, after:after[i].raw,
      source:candidates.find(r=>r.file === file && r.literalSha256 === sha(after[i].text))?.source});
  });
}
console.log(JSON.stringify({sourceHead:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  tokenizer:{name:'marked', version:JSON.parse(fs.readFileSync(path.resolve(path.dirname(modulePath),'../package.json'),'utf8')).version,
    module:modulePath, moduleSha256:sha(fs.readFileSync(modulePath)),
    method:'Lexer + recursive walkTokens; every codespan AND code token in every platform file; all ]( hits, no path-prefix filter.'},
  fileCount:platformFiles.length, markdownFiles:platformFiles.filter(p=>p.endsWith('.md')).length,
  sourceFileCount:sourceFiles.length, additionalSources:process.argv.slice(3), literalCounts:counts, candidates,
  priorInlineScan, priorInlineRepairs, restores, corruptSpansRestored:priorInlineRepairs.length,
  corruptFencesRestored:restores.filter(r=>r.type === 'code').length,
  replayRecipe:'node --no-addons rebind/scan-code-literals.mjs <recorded tokenizer module> <additionalSources...>; stdout is this report. Run from repository root. No native addon or package installation.',
  unresolved:candidates.filter(r=>r.classification !== 'exact legacy source literal').length,
  scanFiles:platformFiles.map(p=>({path:p,sha256:sha(fs.readFileSync(p))}))}, null, 2));
process.exitCode = candidates.some(r=>r.classification !== 'exact legacy source literal') || restores.some(r=>!r.source?.byteExact) ? 1 : 0;
