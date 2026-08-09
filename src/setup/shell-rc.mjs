// shell-rc.mjs — detect a user's existing shell rc file(s) and idempotently
// insert the fgos-shell-integration.sh source line into them (CONTEXT.md
// D4: bash and zsh both in scope; D6: `fgos setup` inserts and announces,
// never asks first).
//
// Never creates a new rc file: detectRcFiles only reports rc files that
// already exist on disk, and insertSourceLine only ever appends to one of
// those — it refuses rather than creating a missing file.
//
// WINDOWS (tsk-63j D3): detectRcFiles also detects PowerShell profile
// paths on win32 — detection only, scoped narrowly to what D3 locked.
// insertSourceLine/hasSourceLine stay bash/zsh-only: `source "..."` is not
// valid PowerShell syntax, and profile auto-sourcing was never part of
// D3's locked scope.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const RC_FILE_NAMES = ['.bashrc', '.zshrc'];

// Well-known default profile locations (Microsoft docs): Windows
// PowerShell 5.1 and PowerShell 7+ (pwsh) keep separate profile files
// under the user's Documents folder.
const WINDOWS_PROFILE_RELATIVE_PATHS = [
  path.join('Documents', 'PowerShell', 'Microsoft.PowerShell_profile.ps1'),
  path.join('Documents', 'WindowsPowerShell', 'Microsoft.PowerShell_profile.ps1'),
];

export function detectRcFiles(homeDir, platform = process.platform) {
  const relativeNames = platform === 'win32' ? WINDOWS_PROFILE_RELATIVE_PATHS : RC_FILE_NAMES;
  return relativeNames.map((name) => path.join(homeDir, name)).filter((candidate) =>
    fs.existsSync(candidate),
  );
}

function sourceLinePattern(integrationScriptPath) {
  const escapedPath = integrationScriptPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^\\s*(?:source|\\.)\\s+["']?${escapedPath}["']?\\s*(?:#.*)?$`, 'm');
}

export function hasSourceLine(rcFilePath, integrationScriptPath) {
  if (!fs.existsSync(rcFilePath)) {
    return false;
  }
  const content = fs.readFileSync(rcFilePath, 'utf8');
  return sourceLinePattern(integrationScriptPath).test(content);
}

// Matches any fgOS integration `source` line regardless of which path it
// names, so a dead one can be found without knowing where it came from.
// Deliberately keyed on the script's own filename: lines the user wrote
// themselves are none of fgOS's business, and are never reported.
const ANY_SOURCE_LINE_PATTERN = /^\s*(?:source|\.)\s+["']?(\S*fgos-shell-integration\.sh)["']?\s*(?:#.*)?$/gm;

/**
 * Every fgOS integration `source` line in `rcFilePath` whose target no longer
 * exists on disk. These accumulate because each removed worktree or temp
 * checkout leaves its own line behind, and every one of them makes an
 * interactive shell emit a `no such file or directory` error on open.
 *
 * Reporting only — nothing here edits the rc file. Deleting a line from a
 * user's own shell profile stays a human act.
 */
export function deadSourceLines(rcFilePath) {
  if (!fs.existsSync(rcFilePath)) {
    return [];
  }
  const content = fs.readFileSync(rcFilePath, 'utf8');
  const dead = [];
  for (const match of content.matchAll(ANY_SOURCE_LINE_PATTERN)) {
    const target = match[1].replace(/^["']|["']$/g, '');
    if (!fs.existsSync(target)) {
      dead.push(target);
    }
  }
  return dead;
}

export function insertSourceLine(rcFilePath, integrationScriptPath) {
  if (!fs.existsSync(rcFilePath)) {
    throw new Error(`refusing to create rc file that does not already exist: ${rcFilePath}`);
  }
  if (hasSourceLine(rcFilePath, integrationScriptPath)) {
    return false;
  }
  const comment = "# Added by fgos setup: source forgent's fgos/fgos-runner shell functions";
  const sourceLine = `source "${integrationScriptPath}"`;
  fs.appendFileSync(rcFilePath, `\n${comment}\n${sourceLine}\n`);
  return true;
}

/**
 * Actually invokes `fgos --help` in a disposable subshell after sourcing
 * `scriptPath`, having first stripped whichever underscore-prefixed
 * functions sourcing introduced (tsk-2wpi) — simulating what a harness's
 * shell-function snapshot can do to a real agent session (tsk-3k2's own
 * incident: `fgos`/`fgos-runner` survive such a snapshot, but a
 * `_`-prefixed helper they depend on does not). This is deliberately NOT a
 * plain "source then call" probe: that alone never reproduces the failure
 * (verified empirically -- a vanilla subprocess never strips underscore
 * functions on its own), so the strip step is what makes this test the
 * real defect instead of passing trivially both before and after a fix.
 *
 * Generalized rather than hardcoding `_fgos_repo_root`'s name: diffs the
 * function table before/after sourcing to find exactly what the script
 * itself introduced, so this stays a real regression guard against any
 * future underscore-prefixed helper the script might grow, not just
 * today's one instance.
 *
 * Never touches the user's own rc file or real shell state -- everything
 * happens inside one throwaway `bash -c` subprocess.
 */
export function probeShellIntegrationInvocation(scriptPath) {
  const script = `
before=$(declare -F | awk '{print $3}')
source "${scriptPath}" 2>/dev/null || exit 2
after=$(declare -F | awk '{print $3}')
introduced=$(comm -13 <(echo "$before" | sort) <(echo "$after" | sort) | grep '^_' || true)
for fn in $introduced; do unset -f "$fn"; done
echo "STRIPPED:$introduced"
fgos --help >/dev/null 2>&1
`;
  const result = spawnSync('bash', ['-c', script], { encoding: 'utf8' });
  const strippedLine = (result.stdout ?? '').split('\n').find((line) => line.startsWith('STRIPPED:')) ?? 'STRIPPED:';
  const strippedFunctions = strippedLine.slice('STRIPPED:'.length).trim().split(/\s+/).filter(Boolean);
  return { ok: result.status === 0, strippedFunctions };
}
