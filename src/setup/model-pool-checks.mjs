// model-pool-checks.mjs — doctor checks for the model / pool / account config.
//
// One agent family is served by exactly one executor; a tier cell may name the pool that serves
// a model (`model@pool`) or list several; runner.llmAccounts is the machine's account inventory,
// read beside the provider account inventory the lease still uses. These checks only read.

import { loadRunnerConfigFromDir } from '../runner/dispatch/config.mjs';
import { deriveProviderFamily } from '../runner/dispatch/resolve.mjs';
import { parseTierCell, isExtendedTierCell } from '../runner/dispatch/tier-cell.mjs';
import { readLlmAccounts, compareWithLegacyInventory } from '../runner/dispatch/llm-accounts.mjs';
import { readSharedConfigOrEmpty } from '../config/shared-config-file.mjs';
import { loadGlobalConfig } from '../config/global-config.mjs';

function loadOrExplain(cwd) {
  try {
    return { runnerConfig: loadRunnerConfigFromDir(cwd) };
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
      message: `warning: tier cells name pools runner.llmAccounts does not declare: ${missing.map((e) => `${e.cell}@${e.pool}`).join(', ')}; these entries cannot run until the pool has accounts`,
    };
  }
  return { passed: true, message: `${explicit.length} tier cell entries name a pool declared in runner.llmAccounts` };
}

/** Every problem the account inventory reader finds. */
export function checkLlmAccountsShape(cwd) {
  const { runnerConfig, skip } = loadOrExplain(cwd);
  if (skip) return skip;
  const { pools, problems } = readLlmAccounts(runnerConfig, { projectConfig: readSharedConfigOrEmpty(cwd) });
  if (problems.length > 0) {
    return { passed: false, message: problems.map((p) => `${p.at}: ${p.detail}`).join('; ') };
  }
  if (runnerConfig.llmAccounts === undefined) return { passed: true, message: 'runner.llmAccounts not declared; accounts come from runner.providers' };
  const count = Object.values(pools).reduce((n, p) => n + Object.keys(p.accounts).length, 0);
  return { passed: true, message: `runner.llmAccounts declares ${count} accounts in ${Object.keys(pools).length} pools` };
}

/** While the lease reads runner.providers, an account declared on one side only is a surprise later. */
export function checkLlmAccountsVsLegacy(cwd) {
  const { runnerConfig, skip } = loadOrExplain(cwd);
  if (skip) return skip;
  if (runnerConfig.llmAccounts === undefined) return { passed: true, message: 'runner.llmAccounts not declared; nothing to compare' };
  const { onlyLegacy, onlyNew, storeMismatch } = compareWithLegacyInventory(runnerConfig);
  const parts = [];
  if (onlyLegacy.length > 0) parts.push(`only in runner.providers: ${onlyLegacy.map((a) => `${a.pool}/${a.account}`).join(', ')}`);
  if (onlyNew.length > 0) parts.push(`only in runner.llmAccounts: ${onlyNew.map((a) => `${a.pool}/${a.account}`).join(', ')}`);
  if (storeMismatch.length > 0) parts.push(`different login directories: ${storeMismatch.map((a) => `${a.pool}/${a.account}`).join(', ')}`);
  if (parts.length > 0) return { passed: true, message: `warning: the lease still reads runner.providers; ${parts.join('; ')}` };
  return { passed: true, message: 'runner.llmAccounts matches runner.providers' };
}

/** Every fgOS release on the machine reads the global config; an older one fails on a list cell. */
export function checkGlobalModelPoliciesPortable() {
  let globalRunner;
  try {
    globalRunner = loadGlobalConfig()?.runner;
  } catch (err) {
    return { passed: true, message: `global config not readable, not evaluated: ${err.message}` };
  }
  const extended = [];
  for (const [family, tiers] of Object.entries(globalRunner?.modelPolicies ?? {})) {
    for (const [tier, cell] of Object.entries(tiers ?? {})) {
      if (isExtendedTierCell(cell)) extended.push(`${family}.${tier}`);
    }
  }
  if (extended.length > 0) {
    return {
      passed: false,
      message: `~/.fgos/config.json runner.modelPolicies has list or "model@pool" cells (${extended.join(', ')}); older fgOS releases on this machine fail on a list and run "model@pool" as a model id, and this release ignores them -- move them to the project config`,
    };
  }
  return { passed: true, message: 'global modelPolicies cells are plain model names' };
}
