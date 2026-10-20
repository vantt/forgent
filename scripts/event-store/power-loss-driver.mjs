// Store side of scripts/event-store/power-loss.sh: init a repository on the
// device under test, append and record acknowledgements, verify after remount.
// The acknowledgement log lives on another disk, so it survives the cut.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { sandboxGit } from '../lib/sandbox-git.mjs';
import { loadNativeAddon } from '../../src/git/native.mjs';
import { openStore } from '../../src/event-store/index.mjs';

const checkout = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const manifestPath = path.join(checkout, '.fgos/runtime/git-addon/manifest.json');
const contractOf = dir => path.join(dir, 'contract.json');
const repoOf = dir => path.join(dir, 'repo');
const stateOf = dir => path.join(dir, 'state');

function loader() {
  if (!fs.existsSync(manifestPath)) throw Error(`missing ${manifestPath}; build it first as yourself: node scripts/git-addon.mjs`);
  return { descriptor: { manifest: JSON.parse(fs.readFileSync(manifestPath, 'utf8')), releaseRoot: checkout } };
}
function store(dir) {
  const options = loader();
  const resolved = loadNativeAddon(options).resolveEventStore(repoOf(dir), stateOf(dir), repoOf(dir));
  return openStore(resolved, resolved.machineId, [contractOf(dir)], options);
}
const event = n => ({ eventType: 'powerloss.appended', schemaVersion: 1, payload: { n }, ts: new Date().toISOString() });

export function init(dir) {
  const repo = repoOf(dir);
  // The repository on the device under test is the script's own sandbox: it goes through the sandbox door.
  fs.mkdirSync(stateOf(dir), { recursive: true, mode: 0o700 });
  const sandbox = sandboxGit(dir);
  const git = (...args) => sandbox(['-C', repo, '-c', 'user.name=power-loss', '-c', 'user.email=power-loss@example.invalid', ...args]);
  sandbox(['init', '-q', path.resolve(repo)]);
  git('config', 'fgos.machineId', 'power-loss');
  git('commit', '--allow-empty', '-qm', 'seed');
  fs.mkdirSync(path.join(repo, '.git/fgos/events/locks'), { recursive: true, mode: 0o700 });
  // Git's publication WAL requires the activation fence that setup installs.
  fs.mkdirSync(path.join(repo, '.fgos/locks/activation.lock'), { recursive: true });
  fs.writeFileSync(path.join(repo, '.fgos/locks/activation.lock/TOMBSTONE'), JSON.stringify({ lock: 'activation', by: 'fgos git', at: 'power-loss' }));
  fs.writeFileSync(contractOf(dir), JSON.stringify({ v: 1, types: [{ type: 'powerloss.appended', domain: 'powerloss', schemaVersion: 1, scope: 'project', sealOnWrite: false }] }));
  execFileSync('sync');
}

// Runs until killed. A line is written and fsynced only after append returned
// (the ack point), so every complete line names a durable event.
export function write(dir, ackFile, sealEvery) {
  const s = store(dir);
  const fd = fs.openSync(ackFile, 'a');
  for (let n = 1; ; n++) {
    const batch = Array.from({ length: 1 + (n % 3) }, (_, i) => event(`${n}.${i}`));
    const result = s.append('project', batch, {}, 'power-loss', []);
    for (const e of result.events) fs.writeSync(fd, `${JSON.stringify({ origin: e.origin, seq: e.seq, h: e.h })}\n`);
    fs.fsyncSync(fd);
    if (sealEvery > 0 && n % sealEvery === 0) s.seal('project', []);
  }
}

export function verify(dir, ackFile) {
  const acked = fs.readFileSync(ackFile, 'utf8').split('\n').slice(0, -1).filter(Boolean).map(line => JSON.parse(line));
  const s = store(dir);
  const before = s.read({ streams: ['project'] }, []).events;
  const present = new Map(before.map(e => [e.h, e]));
  const lost = acked.filter(a => !present.has(a.h));
  const duplicates = before.length - present.size;
  const seqs = before.filter(e => e.origin === acked[0]?.origin).map(e => e.seq);
  const gaps = seqs.filter((seq, i) => seq !== i + 1).length;
  // The next append must recover the high-water mark and never reuse a sequence.
  const next = s.append('project', [event('after-remount')], {}, 'power-loss', []).ack.lastSeq;
  const maxSeq = Math.max(0, ...seqs);
  const seal = s.seal('project', []);
  const after = s.read({ streams: ['project'] }, []).events;
  const integrityErrors = s.status([]).integrityErrors;
  const verdict = acked.length === 0 ? 'NO-EVIDENCE' : lost.length === 0 && duplicates === 0 && gaps === 0 && next === maxSeq + 1
    && after.length === before.length + 1 && integrityErrors.length === 0 ? 'PASS' : 'FAIL';
  return { verdict, acked: acked.length, present: before.length, unackedSurvivors: before.length - (acked.length - lost.length), lost: lost.slice(0, 20), lostCount: lost.length, duplicates, gaps, maxSeq, nextSeq: next, sealedSegments: seal.segments, integrityErrors };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [mode, dir, ackFile, sealEvery] = process.argv.slice(2);
  if (mode === 'init') init(dir);
  else if (mode === 'write') write(dir, ackFile, Number(sealEvery ?? 0));
  else if (mode === 'verify') {
    const result = verify(dir, ackFile);
    console.log(JSON.stringify(result));
    process.exitCode = result.verdict === 'PASS' ? 0 : 1;
  } else {
    console.error('usage: power-loss-driver.mjs init <dir> | write <dir> <ack-file> [seal-every] | verify <dir> <ack-file>');
    process.exitCode = 2;
  }
}
