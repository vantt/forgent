// An earlier release's migration, as a fixture: the tracked `.fgos/events.jsonl` published as a sealed
// legacy commit at `refs/fgos/legacy` and retired from HEAD behind the tracked fence that names it.
// Plain Git plumbing builds the objects; the seal line is the canonical form the Event Store reads
// (keys in order, one final newline) and the fence carries its sha256.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export function pinLegacyHistory(repo) {
  const git = (args, input) => execFileSync('git', ['-C', repo, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.test', ...args], { encoding: 'utf8', input, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  const file = path.join(repo, '.fgos/events.jsonl');
  const bytes = fs.readFileSync(file);
  git(['add', '.fgos/events.jsonl']);
  git(['commit', '-qm', 'legacy history']);
  const from = git(['rev-parse', 'HEAD']);
  const blob = git(['hash-object', '-w', '--stdin'], bytes.toString('utf8'));
  const row = `100644 blob ${blob}\tevents.jsonl\n`;
  const seal = `${JSON.stringify({ fromCommit: from, kind: 'legacy', treeOfFgosEvents: git(['mktree'], row) })}\n`;
  const sealBlob = git(['hash-object', '-w', '--stdin'], seal);
  const commit = git(['commit-tree', git(['mktree'], `${row}100644 blob ${sealBlob}\tseal.json\n`), '-m', 'fgos-events legacy import']);
  git(['update-ref', 'refs/fgos/legacy', commit]);
  fs.rmSync(file);
  const fence = { legacyRefOid: commit, sealDigest: crypto.createHash('sha256').update(seal).digest('hex'), fromCommit: from };
  fs.writeFileSync(path.join(repo, '.fgos/events'), JSON.stringify(fence));
  git(['add', '-A', '.fgos/events.jsonl', '.fgos/events']);
  git(['commit', '-qm', 'cutover fence']);
}
