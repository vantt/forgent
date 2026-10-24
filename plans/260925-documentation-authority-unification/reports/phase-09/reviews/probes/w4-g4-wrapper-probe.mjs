import fs from 'node:fs';
import path from 'node:path';
const REV = '/home/vantt/projects/forgentX-s8-review';
const { scan } = await import(path.join(REV, 'scripts/git-one-door-scan.mjs'));
const decls = JSON.parse(fs.readFileSync(path.join(REV, 'scripts/lib/git-one-door-declarations.v1.json'), 'utf8')).declarations;
let n = 0;
function fixture(rel, mutate, declPaths = [rel]) {
  const root = `/tmp/fgos-work/w4-g4-declare/fx-${n++}`;
  fs.rmSync(root, { recursive: true, force: true });
  const src = fs.readFileSync(path.join(REV, rel), 'utf8');
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), mutate(src));
  fs.mkdirSync(path.join(root, 'scripts/lib'), { recursive: true });
  fs.writeFileSync(path.join(root, 'scripts/lib/git-one-door-declarations.v1.json'), JSON.stringify({ schema: 'git-one-door-declarations.v1', declarations: decls.filter(d => declPaths.includes(d.path)) }));
  try { const r = scan({ root }); return { sites: r.sites.map(s => `${s.path}:${s.line}${s.callers ? ' callers=' + s.callers.join(',') : ''}`), declared: r.classes.filter(c => c.siteId).map(c => `${c.path}:${c.line} ${c.class}${c.callers ? ' callers=' + c.callers.join(',') : ''}`) }; }
  catch (e) { return { error: e.message.slice(0, 200) }; }
}
const out = {};
const R = 'scripts/check-evidence-relocation.mjs';
out.baseline = fixture(R, s => s);
out.lineShift = fixture(R, s => s.replace('const HEX_40', '// shift\n// shift\n// shift\nconst HEX_40'));
out.editCall = fixture(R, s => s.replace("return execFileSync('git', args, {", "return execFileSync('git', ['-c','x=y', ...args], {"));
out.removeSite = fixture(R, s => s.replace("return execFileSync('git', args, {", "return ({"));
out.newWriteCallerThroughWrapper = fixture(R, s => s + "\nexport function wipe(r) { return git(r, ['reset', '--hard', 'HEAD']); }\n");
const A = 'scripts/doc-alias-resolver.mjs';
out.aliasBaseline = fixture(A, s => s);
out.aliasLineShift = fixture(A, s => '// a\n// b\n' + s);
const V = 'scripts/verify-phase-02.mjs';
out.v2Baseline = fixture(V, s => s);
out.v2NewWriteViaRun = fixture(V, s => s.replace("run('git', ['diff', '--check', `${baseSha}..${fixedEndSha}`]);", "run('git', ['diff', '--check', `${baseSha}..${fixedEndSha}`]);\n  run('git', ['push', '--force', 'origin', 'HEAD']);"));
const H = '.githooks/pre-commit';
out.hookBaseline = fixture(H, s => s);
fs.writeFileSync('/tmp/fgos-work/w4-g4-declare/probe-out.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 1));
