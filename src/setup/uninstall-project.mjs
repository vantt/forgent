// uninstall-project.mjs — what `fgos uninstall` (and the Node half of `fgctl uninstall`) takes out of
// one project: the hook entries and extensions the installers wrote into the agent configs, the
// generated skill directories, the git hooks `fgos setup` wired and the mailbox sync timer. It keeps
// everything that is the person's: `.fgos` data and config, the committed pin, any hook entry or skill
// directory without fgOS's own mark, and every shell profile (reported, never edited).
//
// One function describes and applies, so the plan a person reads is the plan that runs. Every file
// the run rewrites or deletes is copied first to `<file>.pre-uninstall-<time>`; the generated skill
// directories are not copied (their stamps say they are overwritten on every setup, and `fgctl init`
// regenerates them). Removal is file by file under a root the run asserted, never through a link,
// never a recursive delete of a computed list.
//
// The release install itself (`.fgos/installation`, the activation record, the release store) is
// fgctl's: this process runs from it.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { CLAUDE_PLUGIN_MARKETPLACE_NAME, CLAUDE_PLUGIN_REF, WIRE_AGENTS_COMMAND } from './agent-wiring.mjs';
import { uninstallAgentHooks } from './agent-hooks.mjs';
import { mainCheckoutHookWired, uninstallGitHooks } from './git-hooks.mjs';
import { fixMailboxSyncTimer } from './mailbox-sync-timer.mjs';
import { detectRcFiles, hasSourceLine } from './shell-rc.mjs';
import { createProjectSkillGuard, generatedSkillDirs, ownedSkillNames } from './skill-wrappers.mjs';

/** What the project keeps, by path, for the plan to print. */
const KEPT_PATHS = [
  ['.fgos', 'your fgOS data and config (config.yaml, work, logs and the rest of .fgos)'],
  ['.fgos/distribution.json', 'the committed release pin, so `fgctl init` can bring fgOS back'],
];

const stamp = (now) => now.toISOString().replace(/[-:.]/g, '');

function assertInside(root, target) {
  const rel = path.relative(root, target);
  if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(`refusing to remove ${target}: it is not inside ${root}`);
  }
}

/** Files of one generated directory, one by one: a link or a file `keep` names stays and is listed
 * in `kept`; the directory goes only when nothing stayed. Nothing is touched unless `apply`. */
function removeGeneratedDir(root, dir, keep, apply, kept) {
  assertInside(root, dir);
  const before = kept.length;
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const file = path.join(current, entry.name);
      assertInside(root, file);
      if (entry.isSymbolicLink()) kept.push({ path: file, why: 'a symbolic link' });
      else if (entry.isDirectory()) walk(file);
      else if (keep(file, '')) kept.push({ path: file, why: 'you changed it (uncommitted edit, or a newer version than the release)' });
      else if (apply) fs.unlinkSync(file);
    }
    if (apply && fs.readdirSync(current).length === 0) fs.rmdirSync(current);
  };
  walk(dir);
  return kept.length === before;
}

function planSkills(repoRoot, packageRoot, apply) {
  if (fs.realpathSync(packageRoot) === fs.realpathSync(repoRoot)) {
    return { removed: [], kept: [], foreign: [], skipped: 'this project is the fgOS source checkout: its skill surfaces are its own render output' };
  }
  const owned = ownedSkillNames(packageRoot);
  const { ours, foreign } = generatedSkillDirs(repoRoot, owned);
  const guard = createProjectSkillGuard(repoRoot);
  const sourceRoot = path.join(packageRoot, '.agents', 'skills');
  const removed = [];
  const kept = [];
  for (const dir of ours) {
    const skillsRoot = path.dirname(dir);
    if (removeGeneratedDir(skillsRoot, dir, guard.forRoots(sourceRoot, skillsRoot), apply, kept)) removed.push(dir);
  }
  if (apply) {
    for (const root of [path.join(repoRoot, '.claude', 'skills'), path.join(repoRoot, '.agents', 'skills')]) {
      if (fs.existsSync(root) && !fs.lstatSync(root).isSymbolicLink() && fs.readdirSync(root).length === 0) fs.rmdirSync(root);
    }
  }
  return { removed, kept, foreign, skipped: null };
}

function planGitHooks(repoRoot, apply) {
  if (!apply) return { unwired: mainCheckoutHookWired(repoRoot), skippedExisting: null };
  return uninstallGitHooks(repoRoot);
}

/** The rc files that still carry the fgOS source line; they are only ever named. */
async function shellRcLines(home) {
  const { integrationScriptPath } = await import('./registrations.mjs');
  const scriptPath = integrationScriptPath();
  if (scriptPath === null) return [];
  return detectRcFiles(home)
    .filter((rcFile) => hasSourceLine(rcFile, scriptPath))
    .map((rcFile) => ({ rcFile, sourceLine: `source "${scriptPath}"` }));
}

/** What `fgos wire-agents` may have written to the person's own agent config. It keeps no record of
 * it (only `<file>.pre-wire-agents-<time>` copies beside each file it changed), so uninstall never
 * touches it and names how to undo it. */
function globalWiringNote() {
  return {
    what: `global agent config changed by \`${WIRE_AGENTS_COMMAND}\`, if you ran it: left alone, fgOS keeps no record to undo it from`,
    undo: [
      `claude plugin uninstall ${CLAUDE_PLUGIN_REF}`,
      `claude plugin marketplace remove ${CLAUDE_PLUGIN_MARKETPLACE_NAME}`,
      'restore any <file>.pre-wire-agents-<time> backup beside your agent config by hand',
    ],
  };
}

function backUp(files, now) {
  const backups = [];
  for (const file of files) {
    const backup = `${file}.pre-uninstall-${stamp(now)}`;
    fs.copyFileSync(file, backup, fs.constants.COPYFILE_EXCL);
    backups.push({ file, backup });
  }
  return backups;
}

/**
 * Describes (`apply: false`) or does (`apply: true`) the project half of an uninstall.
 * @param {string} repoRoot the project (main checkout)
 * @param {{apply?: boolean, packageRoot: string, home?: string, now?: Date}} options
 * @returns {Promise<object>} `changes` and `keeps` as printable lines, the counts behind them, the
 *   `backups` made, `failed` steps (a failure of one never stops the others), and what is left to the person.
 */
export async function uninstallProject(repoRoot, { apply = false, packageRoot, home = os.homedir(), now = new Date() }) {
  const failed = [];
  const attempt = (id, fn, fallback) => {
    try {
      return fn();
    } catch (err) {
      failed.push({ id, error: err.message });
      return fallback;
    }
  };

  const described = attempt('agent-hooks', () => uninstallAgentHooks(repoRoot, { apply: false }), []);
  const hookChanges = described.filter((r) => r.state === 'changed');
  let backups = [];
  if (apply) {
    // A step whose backup fails runs nothing and leaves the file as it is.
    try {
      backups = backUp(hookChanges.map((r) => r.file), now);
    } catch (err) {
      failed.push({ id: 'backup', error: `backup failed, nothing changed: ${err.message}` });
      return { applied: true, hooks: described, skills: null, backups, failed, changes: [], keeps: [], leftToYou: [] };
    }
    attempt('agent-hooks', () => uninstallAgentHooks(repoRoot, { apply: true }), []);
  }
  const skills = attempt('skills', () => planSkills(repoRoot, packageRoot, apply), { removed: [], kept: [], foreign: [], skipped: null });
  const gitHooks = attempt('git-hooks', () => planGitHooks(repoRoot, apply), { unwired: false, skippedExisting: null });
  const timer = apply ? attempt('mailbox-timer', () => fixMailboxSyncTimer(repoRoot, { schedule: () => null }), null) : null;
  const shellRcSourceLinesFound = await shellRcLines(home);

  const rel = (file) => path.relative(repoRoot, file) || file;
  const changes = [
    ...hookChanges.flatMap((r) => r.removed.map((name) => `${r.label}: remove the fgOS hook ${name}`)),
    ...skills.removed.map((dir) => `${rel(dir)}: remove the generated skill directory`),
    ...(gitHooks.unwired ? ['git: unset core.hooksPath (fgOS wired it) and remove the empty .githooks it left'] : []),
    ...(apply && timer?.fixed ? [timer.message] : []),
  ];
  const keeps = [
    ...KEPT_PATHS.map(([file, why]) => `${file}: ${why}`),
    ...described.flatMap((r) => r.kept),
    ...skills.kept.map((k) => `${rel(k.path)}: kept, ${k.why}`),
    ...skills.foreign.map((f) => `${rel(f.dir)}: kept, not generated by fgOS (${f.why}); remove it by hand if it is not yours`),
    ...(skills.skipped ? [`skills: ${skills.skipped}`] : []),
    ...(gitHooks.skippedExisting ? [`git: core.hooksPath ${gitHooks.skippedExisting} is yours (fgOS did not set it): kept`] : []),
  ];
  const note = globalWiringNote();
  const leftToYou = [
    ...shellRcSourceLinesFound.map((l) => `${l.rcFile}: remove the line ${l.sourceLine} by hand (fgOS never edits a shell profile)`),
    `${note.what}. To undo it: ${note.undo.join('; ')}`,
  ];

  return {
    applied: apply,
    hooks: described,
    skills,
    changes,
    keeps,
    leftToYou,
    backups,
    failed,
    // The fields `fgos uninstall` has always returned.
    hooksUnwired: gitHooks.unwired,
    hooksSkippedExisting: gitHooks.skippedExisting,
    shellRcSourceLinesFound,
    shellRcRemovalInstructions: shellRcSourceLinesFound.length > 0 ? 'fgOS never edits your shell profile — remove the line(s) above by hand.' : null,
  };
}
