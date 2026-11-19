// Runs scripts/plan-contract-check.mjs from a checkout or a linked worktree, where the script alone cannot
// load the native addon (src/native/door.mjs: a release manifest counts only for the payload it was staged for)
// and so fails every plan with `git-addon-unavailable`.
//
//   node plans/<this plan>/reports/run-plan-check.mjs [plan-contract-check arguments]   (cwd: the repository root)
//
// Order: (1) the manifest the caller already names in FGOS_ACTIVE_MANIFEST_PATH, else the activated release's
// manifest under <repository>/.fgos/installation; (2) only when the addon does not load that way,
// ensureAddonForScript() from scripts/lib/git-addon-stage.mjs (one cargo build, then reused).
// It refuses to report anything when a result carries `git-addon-unavailable`: a verdict produced without the
// addon says nothing about the plans.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..', '..');
const url = (file) => pathToFileURL(path.join(repoRoot, file)).href;

function activatedManifest() {
  if (process.env.FGOS_ACTIVE_MANIFEST_PATH) return process.env.FGOS_ACTIVE_MANIFEST_PATH;
  // A linked worktree shares the main checkout's .fgos: <main>/.git is the common dir of this worktree.
  const gitFile = path.join(repoRoot, '.git');
  let main = repoRoot;
  try {
    const text = fs.readFileSync(gitFile, 'utf8');
    const gitDir = /^gitdir:\s*(.+)$/m.exec(text)?.[1]?.trim();
    if (gitDir) {
      const common = fs.readFileSync(path.join(path.resolve(repoRoot, gitDir), 'commondir'), 'utf8').trim();
      main = path.dirname(path.resolve(path.resolve(repoRoot, gitDir), common));
    }
  } catch { /* a plain checkout: .git is a directory */ }
  try {
    const activation = JSON.parse(fs.readFileSync(path.join(main, '.fgos/installation/activation.json'), 'utf8'));
    const manifest = path.join(activation.releasePath, 'manifest.json');
    return fs.existsSync(manifest) ? manifest : null;
  } catch { return null; }
}

const door = await import(url('src/native/door.mjs'));
const loadable = () => { try { door.nativeDoor?.(); return true; } catch { return false; } };

const manifest = activatedManifest();
if (manifest) process.env.FGOS_ACTIVE_MANIFEST_PATH = manifest;
if (!loadable()) {
  // The activated release belongs to another payload; stage this checkout's own addon.
  delete process.env.FGOS_ACTIVE_MANIFEST_PATH;
  const stage = await import(url('scripts/lib/git-addon-stage.mjs'));
  stage.ensureAddonForScript();
  if (!loadable()) {
    console.error('run-plan-check: the native addon cannot be loaded; no verdict is reported');
    process.exit(3);
  }
}

const check = await import(url('scripts/plan-contract-check.mjs'));
const lines = [];
const code = check.main(process.argv.slice(2), (line) => { lines.push(line); console.log(line); });
if (lines.some((line) => line.includes('git-addon-unavailable'))) {
  console.error('run-plan-check: a result carries git-addon-unavailable; the output above is not a verdict');
  process.exit(3);
}
process.exit(code);
