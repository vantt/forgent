import fs from 'node:fs'; import path from 'node:path'; import { spawn } from 'node:child_process';
import { fixture } from '/home/vantt/projects/forgentX-s8-review/test/git/land-fixture.mjs';
import { landRunnerItem } from '/home/vantt/projects/forgentX-s8-review/src/runner/merge.mjs';
import { readSidecarFromMain } from '/home/vantt/projects/forgentX-s8-review/src/runner/documentation-cutover-lease.mjs';
const here = path.dirname(new URL(import.meta.url).pathname);
const f = fixture(); f.git('branch', '-m', 'trunk', 'main');
fs.appendFileSync(path.join(f.repo, '.git/info/exclude'), '\n.fgos/\n');
f.git('checkout', '-qb', 'scoped'); fs.mkdirSync(path.join(f.repo, 'docs')); fs.writeFileSync(path.join(f.repo, 'docs/new.md'), 'non-holder frozen-scope edit\n'); f.git('add', 'docs'); f.git('commit', '-qm', 'scoped'); f.git('checkout', '-q', 'main');
const holder = path.join(f.temp, 'holder'); f.git('worktree', 'add', '-qb', 'holder', holder);
const fgosDir = path.join(f.repo, '.fgos');
const run = (script, args) => { const c = spawn(process.execPath, [path.join(here, script), ...args], { stdio: ['ignore', 'pipe', 'inherit'] }); c.stdout.on('data', d => process.stdout.write('['+script+'] '+d)); return c; };
const slot = run('slot-holder.mjs', [fgosDir, '8000']);
await new Promise(r => slot.stdout.once('data', r));
const acq = run('acquirer.mjs', [holder, '1500']);
const exited = new Promise(r => acq.on('exit', r));
console.log('lease before land:', readSidecarFromMain(f.repo).status);
let result; try { result = await landRunnerItem(f.repo, { id: 'source', verify: 'true' }, { branch: 'scoped', callerCheckout: f.repo, lockWaitMs: 30000 }); } catch (e) { result = { error: e.code, message: e.message }; }
await exited;
console.log('land result:', JSON.stringify({ outcome: result.outcome, error: result.error, message: result.message }));
const lease = readSidecarFromMain(f.repo);
let doc = null; try { doc = f.git('show', 'main:docs/new.md'); } catch {}
console.log('main sidecar state:', lease.status, '| main:docs/new.md =', JSON.stringify(doc));
console.log(f.git('log', '--oneline', '-4', 'main'));
f.close();
