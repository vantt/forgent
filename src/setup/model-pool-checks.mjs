// model-pool-checks.mjs — doctor checks for the model / pool / account config.
//
// One agent family is served by exactly one executor; a tier cell may name the pool that serves
// a model (`model@pool`) or list several; runner.llmAccounts is the machine's account inventory,
// read beside the provider account inventory the lease still uses. These checks only read.

import { loadRunnerConfigForDir, MODEL_POLICY_TIERS } from '../runner/dispatch/config.mjs';
import { deriveProviderFamily } from '../runner/dispatch/resolve.mjs';
import { parseTierCell, isExtendedTierCell } from '../runner/dispatch/tier-cell.mjs';
import { readLlmAccounts, compareWithLegacyInventory, deriveLegacyInventory } from '../runner/dispatch/llm-accounts.mjs';
import { isConfigRefusal, readMachineConfig } from '../config/facade.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { resolveMainCheckoutRoot } from '../runner/paths.mjs';

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
    const family = deriveProviderFamily(entry);
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

// Where each agent CLI reads project skills from, keyed by the invocation's command name. A CLI
// not listed has no known skill directory here, so it is reported as not checked rather than failed.
const CLI_SKILL_DIRS = { claude: '.claude/skills', codex: '.agents/skills', omp: '.omp/skills', pi: '.pi/skills', grok: '.grok/skills' };

function invocationCliNames(entry) {
  const commands = Array.isArray(entry.invocations) && entry.invocations.length > 0
    ? entry.invocations.map(inv => inv?.command)
    : [entry.command];
  return [...new Set(commands.filter(c => typeof c === 'string' && c !== '').map(c => path.basename(c)))];
}

/**
 * An executor that declares `supports.skills` is only truthful when the skill is really installed
 * in its runtime's skill directory of the main checkout (a linked worktree has no copy of it
 * until worktreeSetup provisions one). `ak:cook` lives in `ak-cook/SKILL.md`.
 */
export function checkExecutorSkillsInstalled(cwd) {
  const { runnerConfig, skip } = loadOrExplain(cwd);
  if (skip) return skip;
  const root = resolveMainCheckoutRoot(cwd) ?? cwd;
  const missing = [];
  const unchecked = [];
  let checked = 0;
  for (const [id, entry] of Object.entries(runnerConfig.executors ?? {})) {
    const skills = entry?.supports?.skills;
    if (entry?.kind !== 'agent' || !Array.isArray(skills)) continue;
    for (const cli of invocationCliNames(entry)) {
      const dir = CLI_SKILL_DIRS[cli];
      if (!dir) { unchecked.push(`${id} (cli ${cli})`); continue; }
      for (const skill of skills) {
        checked += 1;
        if (!fs.existsSync(path.join(root, dir, skill.replaceAll(':', '-'), 'SKILL.md'))) {
          missing.push(`${id} declares ${skill} but ${dir}/${skill.replaceAll(':', '-')}/SKILL.md is missing in ${root} -- install the skill for the ${cli} CLI, or remove it from executors.${id}.supports.skills`);
        }
      }
    }
  }
  if (missing.length > 0) return { passed: false, message: missing.join('; ') };
  const note = unchecked.length > 0 ? `; not checked, no known skill directory: ${unchecked.join(', ')}` : '';
  return { passed: true, message: `${checked} declared executor skill(s) installed${note}` };
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
    if (entry?.kind === 'agent') served.add(deriveProviderFamily(entry));
  }
  const problems = MODEL_POLICY_TIERS.filter((tier) => runnerConfig.tierFallback[tier] === undefined).map((tier) => `${tier}: no list, so a seat at ${tier} has no walk after a failure`);
  for (const [tier, families] of declared) {
    for (const family of families) {
      if (runnerConfig.modelPolicies?.[family]?.[tier] === undefined) problems.push(`${tier}: ${family} has no modelPolicies cell at ${tier}`);
      else if (!served.has(family)) problems.push(`${tier}: no agent executor serves ${family}`);
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

