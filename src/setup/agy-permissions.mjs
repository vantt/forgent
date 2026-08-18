// agy-permissions.mjs — infra layer: real settings.json I/O for wiring the
// `agy` (Antigravity Cli) executor's command-permission denylist (tsk-1xm,
// docs/history/agy-permission-capability-allowlist/). Mirrors git-hooks.mjs's
// two-entry-point shape:
//   - fixAgyPermissionsConfigured: the writer, run by `fgos doctor --fix`
//     and unconditionally by `fgos setup` (registerFix, same as every other
//     registered fix).
//   - checkAgyPermissionsConfigured: the read-only check, used by `fgos
//     doctor`.
//
// RESEARCH.md Round 4 (live-proven, 2026-08-18): `agy`'s `--dangerously-
// skip-permissions` flag is NOT replaceable by a true default-deny
// ALLOWLIST in headless (`-p`) mode -- `toolPermission: "strict"` and the
// settings.json default `"request-review"` both blanket-deny every
// `command`-type tool call regardless of `permissions.allow` content (6
// rule shapes tried, 0 successes). The one mode that lets commands run at
// all, `toolPermission: "always-proceed"`, runs every command BY DEFAULT
// (confirmed: an unlisted `whoami` probe succeeded) and only
// `permissions.deny` changes that outcome (confirmed: a denied pattern was
// refused with a named reason). This module therefore provisions a
// DENYLIST, not an allowlist -- default-allow, explicit-deny -- which is
// strictly narrower than today's unconditional `--dangerously-skip-
// permissions` (zero boundary at all) but not the default-deny surface the
// item's own framing originally assumed.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { mergeConfigDefaults } from './config-merge.mjs';

/**
 * Deny-rules chosen to mirror this repo's own already-documented incident
 * history (AGENTS.md's "Never run a raw git reset --hard.../Never git
 * stash..." guidance -- tsk-3au, tsk-56u) plus the other classes of
 * irreversible or exfiltration-prone commands a headless worker should
 * never run unattended: destructive recursive deletes, privilege
 * escalation, force-pushing, and raw network egress. `regex:` prefix
 * matches agy's own documented opt-in syntax (RESEARCH.md Round 1's
 * changelog citation) -- bare-token/exact-literal deny rules were never
 * tested as thoroughly, and a regex lets each rule target the dangerous
 * shape specifically rather than the whole command family.
 */
export const AGY_PERMISSIONS_DENYLIST = [
  'command(regex:^rm .*-rf)',
  'command(regex:^sudo )',
  'command(regex:^git push .*(--force|-f\\b))',
  'command(regex:^git reset .*--hard)',
  'command(regex:^git stash)',
  'command(regex:^curl )',
  'command(regex:^wget )',
];

/**
 * The fill-only default shape merged into agy's settings.json
 * (`mergeConfigDefaults` semantics: a key already present -- including an
 * empty array -- is left byte-identical, never touched or topped up).
 */
export const AGY_PERMISSIONS_DEFAULT = {
  toolPermission: 'always-proceed',
  permissions: {
    deny: AGY_PERMISSIONS_DENYLIST,
  },
};

/**
 * Absolute path to agy's one real on-disk settings file (RESEARCH.md
 * Round 1: confirmed the only agy settings file on this machine, shared
 * across every workspace/session, no per-project override exists).
 */
export function agySettingsPath() {
  return path.join(os.homedir(), '.gemini', 'antigravity-cli', 'settings.json');
}

/**
 * Reads and parses agy's settings.json. Never throws: a missing file
 * reads as `{}` (nothing configured yet), and an unparseable file also
 * reads as `{}` rather than crashing `doctor`/`setup` on a file this
 * module does not own the shape of.
 */
export function readAgySettings() {
  const settingsPath = agySettingsPath();
  if (!fs.existsSync(settingsPath)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(settingsPath, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Read-only check (RUL9: doctor never writes) — passes once
 * `toolPermission` is `"always-proceed"` and `permissions.deny` is a
 * non-empty array. Does not require every `AGY_PERMISSIONS_DENYLIST`
 * entry to be present verbatim: a user who already customized the deny
 * list has made a deliberate choice `fixAgyPermissionsConfigured`'s own
 * fill-only merge would never overwrite, and re-flagging that as a
 * failure would fight the same "never touch a value the user already
 * has" contract the fix follows.
 */
export function checkAgyPermissionsConfigured() {
  const settings = readAgySettings();
  const toolPermission = settings.toolPermission;
  const denyList = settings.permissions?.deny;
  const denyConfigured = Array.isArray(denyList) && denyList.length > 0;
  if (toolPermission === 'always-proceed' && denyConfigured) {
    return {
      passed: true,
      message: `agy settings.json: toolPermission=always-proceed, ${denyList.length} deny rule(s) configured`,
    };
  }
  return {
    passed: false,
    message:
      'agy settings.json missing a working command denylist (toolPermission must be "always-proceed" with a non-empty permissions.deny — RESEARCH.md Round 4: "strict"/"request-review" blanket-deny every command in headless mode, and permissions.allow has no effect) — run fgos doctor --fix or fgos setup',
  };
}

/**
 * Fill-only writer (RUL9: `setup` is the one write verb). Merges
 * `AGY_PERMISSIONS_DEFAULT` into whatever agy's settings.json already
 * has via the same `mergeConfigDefaults` every other config-default in
 * this repo uses — `trustedWorkspaces` and any other existing key (or an
 * already-customized `toolPermission`/`permissions.deny`) is kept
 * byte-identical. Idempotent: a second run makes no further change once
 * both keys are present.
 */
export function fixAgyPermissionsConfigured() {
  const settingsPath = agySettingsPath();
  const existing = readAgySettings();
  const { merged, addedKeys } = mergeConfigDefaults(existing, AGY_PERMISSIONS_DEFAULT);
  if (addedKeys.length === 0) {
    return { changed: false, message: 'agy settings.json already has toolPermission + permissions.deny — nothing to fix' };
  }
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, `${JSON.stringify(merged, null, 2)}\n`);
  return { changed: true, message: `agy settings.json: added ${addedKeys.join(', ')}` };
}
