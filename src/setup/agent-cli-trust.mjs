// agent-cli-trust.mjs — doctor check: has each agent CLI the project's executors run under been told
// to trust THIS project folder?
//
// codex and agy stop at a blocking "Trust this folder?" prompt in a folder their own config does not
// list, and a headless dispatch then waits out its whole timeout with nobody to answer. fgOS derives
// trust for a fresh worktree only from a root a person already trusted (trust-store.mjs), so the
// project root itself must be trusted by hand, once per CLI home.
//
// Read-only and credential-safe: the config files can sit beside credentials, so each is read only
// through trust-store.mjs's readers, which answer a yes/no for one path and surface nothing else. The
// check never writes them; the fix is a line the person adds.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { readCodexTrust, readAgyTrust, defaultAgySettingsPath } from '../runner/dispatch/trust-store.mjs';
import { findAgySubHomes, resolveSubHomePath } from './agy-permissions.mjs';

/** The config.toml of every codex home a configured executor runs under, deduplicated, each with
 * the executors that use it. A home is declared either by an executor's `codex-toml` trust store
 * or by a `CODEX_HOME` in its env. */
function codexConfigPaths(runnerConfig, homeDir) {
  const found = new Map();
  const note = (configPath, label) => {
    if (!found.has(configPath)) found.set(configPath, new Set());
    found.get(configPath).add(label);
  };
  const fromEnv = (env) => (typeof env?.CODEX_HOME === 'string' && env.CODEX_HOME.trim()
    ? path.join(path.resolve(resolveSubHomePath(env.CODEX_HOME.trim(), homeDir)), 'config.toml')
    : null);
  const consider = (label, env, trustStore) => {
    if (trustStore?.kind === 'codex-toml') {
      note(trustStore.path ?? fromEnv(env) ?? path.join(homeDir, '.codex', 'config.toml'), label);
    } else if (fromEnv(env)) {
      note(fromEnv(env), label);
    }
  };
  for (const [id, executor] of Object.entries(runnerConfig?.executors ?? {})) {
    consider(id, executor?.env, executor?.interactiveMode?.trustStore);
    for (const inv of executor?.invocations ?? []) {
      consider(`${id}/${inv?.id ?? '?'}`, inv?.env ?? executor?.env, inv?.interactiveMode?.trustStore);
    }
  }
  return found;
}

function projectPathVariants(cwd) {
  const variants = new Set([path.resolve(cwd)]);
  try { variants.add(fs.realpathSync(cwd)); } catch { /* the plain path is all there is */ }
  return [...variants];
}

/** `true` when any spelling of the project path is trusted, `false` when an entry exists but does
 * not trust it, `null` when there is no entry. */
function anyTrust(read, variants) {
  let sawEntry = false;
  for (const variant of variants) {
    const trust = read(variant);
    if (trust === true) return true;
    if (trust === false) sawEntry = true;
  }
  return sawEntry ? false : null;
}

const summarizeLabels = (labels) => {
  const list = [...labels];
  return list.length > 3 ? `${list.slice(0, 3).join(', ')} and ${list.length - 3} more` : list.join(', ');
};

/**
 * @param {string} cwd Project root.
 * @param {object} options
 * @param {() => object} options.loadRunnerConfig Returns the project's runner config; may throw.
 * @param {string} [options.homeDir] Base for `~`, `${HOME}` and the default codex home.
 * @returns {{ passed: boolean, message: string }}
 */
export function checkAgentCliProjectTrusted(cwd, { loadRunnerConfig, homeDir = os.homedir() }) {
  if (!fs.existsSync(path.join(cwd, '.git'))) {
    return { passed: true, message: 'not applicable: the project root is not a git repository, so agent CLIs do not ask to trust it' };
  }
  let runnerConfig;
  try {
    runnerConfig = loadRunnerConfig(cwd);
  } catch (err) {
    return { passed: true, message: `not applicable: runner config not loadable here, agent CLI trust not evaluated (${err.message})` };
  }

  const variants = projectPathVariants(cwd);
  const root = variants[0];
  const codexHomes = codexConfigPaths(runnerConfig, homeDir);
  const agyHomes = findAgySubHomes(cwd, { homeDir, config: { runner: runnerConfig } });
  if (codexHomes.size === 0 && agyHomes.length === 0) {
    return { passed: true, message: 'not applicable: no codex or agy executor is configured' };
  }

  const problems = [];
  const trusted = [];
  for (const [configPath, labels] of codexHomes) {
    let trust;
    try {
      trust = anyTrust((p) => readCodexTrust(configPath, p), variants);
    } catch (err) {
      problems.push(`codex config ${configPath} (${summarizeLabels(labels)}) could not be read: ${err.message}`);
      continue;
    }
    if (trust === true) {
      trusted.push(`codex ${configPath}`);
      continue;
    }
    const state = trust === false ? 'has an entry that is not trusted' : 'has no entry';
    problems.push(`codex config ${configPath} (${summarizeLabels(labels)}) ${state} for ${root}; codex will stop at "Trust this folder?" -- add to that file: [projects."${root}"] trust_level = "trusted" (fgOS never edits it)`);
  }
  for (const { rawPath, resolvedPath, executorId } of agyHomes) {
    const settingsPath = defaultAgySettingsPath(resolvedPath);
    const trust = anyTrust((p) => readAgyTrust(settingsPath, p), variants);
    if (trust === true) {
      trusted.push(`agy ${settingsPath}`);
      continue;
    }
    problems.push(`agy settings ${settingsPath} (${executorId ?? rawPath}) does not list ${root} in trustedWorkspaces; agy will stop at its folder-trust prompt -- add "${root}" to the "trustedWorkspaces" array in that file (fgOS never edits it)`);
  }

  if (problems.length > 0) return { passed: false, message: problems.join(' | ') };
  return { passed: true, message: `${root} is trusted in every configured agent CLI home (${trusted.join(', ')})` };
}
