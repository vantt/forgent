import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ensureGitAddon, root } from '../../scripts/git-addon.mjs';
import { createGitWorktree } from '../../src/git/worktree.mjs';
export function fixture(backend = 'files', trackedState = false) {
  const built = ensureGitAddon();
  const loader = { descriptor: { manifest: JSON.parse(fs.readFileSync(built.manifest)), releaseRoot: root } };
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-worktree-'));
  const repoPath = path.join(temp, 'repo'); fs.mkdirSync(repoPath);
  const git = (...args) => execFileSync('git', ['-C', repoPath, ...args], { encoding: 'utf8', stdio: ['ignore','pipe','pipe'] }).trim();
  git('init','-q',`--ref-format=${backend}`,'--initial-branch=trunk');
  git('config','user.name','Fixture'); git('config','user.email','fixture@example.invalid');
  fs.writeFileSync(path.join(repoPath,'file'), 'one');
  if (trackedState) { fs.mkdirSync(path.join(repoPath,'.fgos')); fs.writeFileSync(path.join(repoPath,'.fgos','fixture'), 'tracked state'); }
  git('add','.'); git('commit','-qm','one'); const tip = git('rev-parse','HEAD');
  const fgosDir = path.join(repoPath,'.fgos');
  fs.mkdirSync(path.join(fgosDir,'locks/activation.lock'),{recursive:true});
  fs.writeFileSync(path.join(fgosDir,'locks/activation.lock/TOMBSTONE'),JSON.stringify({lock:'activation',by:'fgos git',at:'fixture'}));
  const options = { stateRoot: temp, repoPath, trustedMain: repoPath, writer: 'fixture' };
  const port = createGitWorktree(options, loader);
  return { temp, repoPath, fgosDir, git, tip, options, loader, port, cleanup() { fs.rmSync(temp,{recursive:true,force:true}); } };
}
