import './process-tmp-root.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { sandboxGit } from '../../scripts/lib/sandbox-git.mjs';
import { ensureGitAddon } from './git-addon.mjs';
import { activateGitFixture } from './git-fixture.mjs';

// Work fixtures run product code against the real native store. Importing this module stages this checkout's
// addon and host once and points FGOS_HOST_BIN and the active-manifest variables of this process at them, so
// the one in-process native door loads exactly that addon file (a second image of it is refused by design).
ensureGitAddon();

/** A fixture repository the Event Store can open: a machine id and the activation fence a cutover leaves. */
export function initializeWorkRepository(repo) {
  fs.mkdirSync(repo, { recursive: true });
  const git = (...args) => sandboxGit(repo)(['-C', repo, ...args], { stdio: 'pipe' });
  git('init', '-q', '-b', 'main');
  git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.test');
  activateGitFixture(repo);
  return path.join(repo, '.fgos');
}

// Legacy readers consume the immutable HEAD inventory, never mutable working files.
export function freezeLegacyWorkFixture(repo) {
  const git = sandboxGit(repo);
  git(['-C', repo, 'add', '.fgos/events.jsonl'], { stdio: 'pipe' });
  git(['-C', repo, 'commit', '-qm', 'frozen legacy Work fixture'], { stdio: 'pipe' });
}
