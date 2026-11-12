// model-pool-checks.mjs — doctor checks for the model / pool / account config.
//
// One agent family is served by exactly one executor; a tier cell may name the pool that serves
// a model (`model@pool`) or list several; runner.llmAccounts is the machine's account inventory,
// read beside the provider account inventory the lease still uses. These checks only read.

import { loadRunnerConfigForDir, MODEL_POLICY_TIERS } from '../runner/dispatch/config.mjs';
import { familyOf } from '../runner/dispatch/provider-adapter.mjs';
import { parseTierCell, isExtendedTierCell } from '../runner/dispatch/tier-cell.mjs';
import { readLlmAccounts, compareWithLegacyInventory, deriveLegacyInventory } from '../runner/dispatch/llm-accounts.mjs';
import { isConfigRefusal, readMachineConfig } from '../config/facade.mjs';
import { AGENT_SKILL_DIRS } from '../util/agent-skill-dirs.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { isCommandAvailable, resolveMainCheckoutRoot } from '../runner/paths.mjs';

function loadOrExplain(cwd) {
  try {
    return { runnerConfig: loadRunnerConfigForDir(cwd) };
  } catch (err) {
    return { skip: { passed: true, message: `runner config not loadable here, not evaluated: ${err.message}` } };
  }
}

/** Two agent executors of one family split its pool: which one runs then depends on the session. */
export function checkExecutorFamilyUnique(cwd) {
  const { runnerConfig, skip } = loadOrExplain(cwd);
  if (skip) return skip;
  const byFamily = new Map();
  for (const [id, entry] of Object.entries(runnerConfig.executors ?? {})) {
    if (entry?.kind !== 'agent') continue;
    const family = familyOf(entry);
    byFamily.set(family, [...(byFamily.get(family) ?? []), id]);
  }
  const shared = [...byFamily].filter(([, ids]) => ids.length > 1);
  if (shared.length > 0) {
    return {
      passed: false,
      message: `one family, several executors: ${shared.map(([f, ids]) => `${f} (${ids.join(', ')})`).join('; ')} -- merge them into one executor and keep each transport as one of its invocations`,
    };
  }
  return { passed: true, message: `each of ${byFamily.size} agent families has one executor` };
}

// A CLI absent from AGENT_SKILL_DIRS has no known skill directory, so it is reported as not checked rather than failed.
// The CLIs that also read the same directory name from the user's home. A CLI not listed here is
// only checked at project level.
const CLI_USER_SKILL_DIRS = { claude: '.claude/skills', codex: '.agents/skills' };

function invocationCommands(entry) {
  const commands = Array.isArray(entry.invocations) && entry.invocations.length > 0
    ? entry.invocations.map(inv => inv?.command)
    : [entry.command];
  return [...new Set(commands.filter(c => typeof c === 'string' && c !== ''))];
}

/** The state of one skill file: `ok` when it has content, `empty` when present with none, `missing` otherwise. */
function skillFileState(file) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    return 'missing';
  }
  return text.trim() === '' ? 'empty' : 'ok';
}

/**
 * An executor that declares `supports.skills` is only truthful when the skill is really installed
 * in its runtime's skill directory, at project level or (for the CLIs that read one) the user's
 * home, with content. This judges the main checkout only: a linked worktree gets skills from
 * worktreeSetup provisioning alone, so a pass here is not a pass inside a worktree. Skill
 * `vendor:name` lives in `vendor-name/SKILL.md`.
 */
export function checkExecutorSkillsInstalled(cwd) {
  const { runnerConfig, skip } = loadOrExplain(cwd);
  if (skip) return skip;
  const root = resolveMainCheckoutRoot(cwd) ?? cwd;
  const home = os.homedir();
  const missing = [];
  const unchecked = [];
  const notInstalled = [];
  let checked = 0;
  for (const [id, entry] of Object.entries(runnerConfig.executors ?? {})) {
    const skills = entry?.supports?.skills;
    if (entry?.kind !== 'agent' || !Array.isArray(skills)) continue;
    for (const command of invocationCommands(entry)) {
      const cli = path.basename(command);
      // A CLI this machine does not have is no runtime for its skills to be installed in.
      if (!isCommandAvailable(command)) { notInstalled.push(`${id} (cli ${cli})`); continue; }
      const dir = AGENT_SKILL_DIRS[cli];
      if (!dir) { unchecked.push(`${id} (cli ${cli})`); continue; }
      for (const skill of skills) {
        checked += 1;
        const rel = `${dir}/${skill.replaceAll(':', '-')}/SKILL.md`;
        const candidates = [path.join(root, rel)];
        if (CLI_USER_SKILL_DIRS[cli]) candidates.push(path.join(home, CLI_USER_SKILL_DIRS[cli], skill.replaceAll(':', '-'), 'SKILL.md'));
        const states = candidates.map(skillFileState);
        if (states.includes('ok')) continue;
        const where = candidates.length > 1 ? `${root} or ${home}` : root;
        const problem = states.includes('empty') ? 'is empty' : 'is missing';
        missing.push(`${id} declares ${skill} but ${rel} ${problem} in ${where} -- install the skill for the ${cli} CLI, or remove it from executors.${id}.supports.skills; a linked worktree gets skills only from worktreeSetup provisioning, so a pass in the main checkout is not a pass in a worktree`);
      }
    }
  }
  if (missing.length > 0) return { passed: false, message: missing.join('; ') };
  const note = (unchecked.length > 0 ? `; not checked, no known skill directory: ${unchecked.join(', ')}` : '')
    + (notInstalled.length > 0 ? `; skipped, CLI not installed: ${[...new Set(notInstalled)].join(', ')}` : '');
  return { passed: true, message: `${checked} declared executor skill(s) installed in the main checkout (a linked worktree gets skills only from worktreeSetup provisioning)${note}` };
}

/**
 * A family a tier's fallback list names but that has no cell at that tier, or no agent executor, is
 * skipped by the walk and recorded; a declared `tierFallback` names every tier of the ladder, `mini`
 * included, or a seat at the missing tier has no walk after a failure. Warns, never fails: the list still
 * works for the families that serve it.
 */
export function checkTierFallback(cwd) {
  const { runnerConfig, skip } = loadOrExplain(cwd);
  if (skip) return skip;
  const declared = Object.entries(runnerConfig.tierFallback ?? {});
  if (declared.length === 0) return { passed: true, message: 'runner.tierFallback not declared; every tier walks its capability prefer order after a failure' };
  const served = new Set();
  for (const entry of Object.values(runnerConfig.executors ?? {})) {
    if (entry?.kind === 'agent') served.add(familyOf(entry));
  }
  const problems = MODEL_POLICY_TIERS.filter((tier) => runnerConfig.tierFallback[tier] === undefined).map((tier) => `${tier}: no list, so a seat at ${tier} has no walk after a failure`);
  for (const [tier, families] of declared) {
    for (const family of families) {
      if (runnerConfig.modelPolicies?.[family]?.[tier] === undefined) problems.push(`${tier}: ${family} has no modelPolicies cell at ${tier}`);
      else if (!served.has(familyOf(family))) problems.push(`${tier}: no agent executor serves ${family}`);
    }
  }
  if (problems.length > 0) return { passed: true, message: `warning: tier fallback entries the walk skips: ${problems.join('; ')}` };
  return { passed: true, message: `runner.tierFallback declares the walk order of ${declared.length} tier(s): ${declared.map(([tier]) => tier).join(', ')}` };
}

/** A tier cell entry served by a pool runner.llmAccounts does not declare cannot run once pools route. */
export function checkModelPolicyPools(cwd) {
  const { runnerConfig, skip } = loadOrExplain(cwd);
  if (skip) return skip;
  const explicit = [];
  for (const [family, tiers] of Object.entries(runnerConfig.modelPolicies ?? {})) {
    for (const [tier, cell] of Object.entries(tiers ?? {})) {
      for (const entry of parseTierCell(cell, family)) {
        if (entry.explicitPool) explicit.push({ cell: `${family}.${tier}`, pool: entry.pool });
      }
    }
  }
  if (explicit.length === 0) return { passed: true, message: 'no tier cell names a pool' };
  const { pools } = readLlmAccounts(runnerConfig);
  const missing = explicit.filter((e) => !pools[e.pool]);
  if (missing.length > 0) {
    return {
      passed: true,
      message: `warning: tier cells name pools runner.llmAccounts does not declare: ${missing.map((e) => `${e.cell}@${e.pool}`).join(', ')}; the walk skips these entries until the pool has an enabled account holding a login store for the CLI of the invocation (fgos dispatch explain shows each)`,
    };
  }
  return { passed: true, message: `${explicit.length} tier cell entries name a pool declared in runner.llmAccounts` };
}

/** Every problem the account inventory reader finds. */
export function checkLlmAccountsShape(cwd) {
  const { runnerConfig, skip } = loadOrExplain(cwd);
  if (skip) return skip;
  const { pools, problems } = readLlmAccounts(runnerConfig);
  if (problems.length > 0) {
    return { passed: false, message: problems.map((p) => `${p.at}: ${p.detail}`).join('; ') };
  }
  if (runnerConfig.llmAccounts === undefined) return { passed: true, message: 'runner.llmAccounts not declared; accounts come from runner.providers' };
  const { unusable } = deriveLegacyInventory(runnerConfig);
  if (unusable.length > 0) {
    return { passed: true, message: `warning: login stores no invocation declares files for, so those accounts cannot run on that CLI: ${unusable.map((u) => `${u.pool}/${u.account} (${u.cli})`).join(', ')}` };
  }
  const count = Object.values(pools).reduce((n, p) => n + Object.keys(p.accounts).length, 0);
  return { passed: true, message: `runner.llmAccounts declares ${count} accounts in ${Object.keys(pools).length} pools` };
}

/**
 * The lease reads a pool from runner.llmAccounts when it declares it and from runner.providers
 * otherwise (the transition read), so an account declared on one side only is a surprise later.
 */
export function checkLlmAccountsVsLegacy(cwd) {
  const { runnerConfig, skip } = loadOrExplain(cwd);
  if (skip) return skip;
  if (runnerConfig.llmAccounts === undefined) return { passed: true, message: 'runner.llmAccounts not declared; nothing to compare' };
  const { onlyLegacy, onlyNew, storeMismatch } = compareWithLegacyInventory(runnerConfig);
  const parts = [];
  if (onlyLegacy.length > 0) parts.push(`only in runner.providers: ${onlyLegacy.map((a) => `${a.pool}/${a.account}`).join(', ')}`);
  if (onlyNew.length > 0) parts.push(`only in runner.llmAccounts: ${onlyNew.map((a) => `${a.pool}/${a.account}`).join(', ')}`);
  if (storeMismatch.length > 0) parts.push(`different login directories: ${storeMismatch.map((a) => `${a.pool}/${a.account}`).join(', ')}`);
  if (parts.length > 0) return { passed: true, message: `warning: the lease reads runner.llmAccounts for a pool it declares and runner.providers for the rest; ${parts.join('; ')}` };
  return { passed: true, message: 'runner.llmAccounts matches runner.providers' };
}

/**
 * Every fgOS release on the machine reads the global config; an older one fails on a list cell. The row judges the
 * global file's own cells (the standard holds list cells too), so it asks the snapshot which cells the global layer set.
 */
export function checkGlobalModelPoliciesPortable() {
  let snapshot;
  try {
    snapshot = readMachineConfig({ sections: ['runner'], origins: ['runner.modelPolicies'] });
  } catch (err) {
    if (!isConfigRefusal(err)) throw err;
    return { passed: true, message: `global config not readable, not evaluated: ${err.message}` };
  }
  const globalCells = new Set();
  for (const { path: at, layer } of snapshot.origins ?? []) {
    const cell = layer === 'global' ? /^runner\.modelPolicies\.([^.[]+)\.([^.[]+)/.exec(at) : null;
    if (cell) globalCells.add(`${cell[1]}.${cell[2]}`);
  }
  const extended = [...globalCells].filter((name) => {
    const [family, tier] = name.split('.');
    return isExtendedTierCell(snapshot.value.runner.modelPolicies?.[family]?.[tier]);
  });
  if (extended.length > 0) {
    return {
      passed: false,
      message: `~/.fgos/config.json runner.modelPolicies has list, "model@pool" or object cells (${extended.join(', ')}); older fgOS releases on this machine fail on a list or an object and run "model@pool" as a model id, and this release ignores them -- move them to the project config`,
    };
  }
  return { passed: true, message: 'global modelPolicies cells are plain model names' };
}

