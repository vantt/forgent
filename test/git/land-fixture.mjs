import '../helpers/process-tmp-root.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ensureGitAddon, root } from '../helpers/git-addon.mjs';
import { createGitLand } from '../../src/git/index.mjs';
const built = ensureGitAddon();
const loader = { descriptor: { manifest: JSON.parse(fs.readFileSync(built.manifest)), releaseRoot: root } };
export function fixture() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-land-'));
  const repo = path.join(temp, 'repo'); fs.mkdirSync(repo);
  const git = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  git('init', '-q', '--initial-branch=trunk'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid');
  fs.writeFileSync(path.join(repo, 'a'), 'base\n'); fs.writeFileSync(path.join(repo, 'b'), 'base\n'); git('add', '.'); git('commit', '-qm', 'base'); const target = git('rev-parse', 'HEAD');
  git('checkout', '-qb', 'source'); fs.writeFileSync(path.join(repo, 'a'), 'incoming\n'); git('commit', '-qam', 'source'); const source = git('rev-parse', 'HEAD'); git('checkout', '-q', 'trunk');
  const fence = path.join(repo, '.fgos/locks/activation.lock'); fs.mkdirSync(fence, { recursive: true }); fs.writeFileSync(path.join(fence, 'TOMBSTONE'), JSON.stringify({ lock: 'activation', by: 'fgos git', at: 'fixture' }));
  const options = { stateRoot: temp, repoPath: repo, trustedMain: repo, writer: 'fixture' };
  const ports = [];
  const port = () => { const p = createGitLand(options, loader); ports.push(p); return p; };
  return { temp, repo, git, port, options, loader, request: { source, target, destination: 'refs/heads/trunk', message: 'consumer land', squash: false, footprint: [], subtree: null, files: [] }, close() { for (const p of ports) p.close(); fs.rmSync(temp, { recursive: true, force: true }); } };
}
export function evidence(candidate) { return { source: candidate.source, target: candidate.target, candidate: candidate.candidate, treeDigest: candidate.treeDigest, evidenceDigest: 'consumer-verification-record' }; }
