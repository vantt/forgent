// dispatch/tool-providers.mjs -- which tool executors serve a capability, and whether each is there now.
//
// A tool executor (`kind: "tool"`) declares the capabilities it serves in `for`. This module is the one reader
// of that list and the one place a tool's presence is probed, live, on every call: nothing is remembered between
// calls, so an answer is as fresh as the machine. `decide` and the doctor both ask here.

import fs from 'node:fs';
import path from 'node:path';
import { isCommandAvailable } from '../paths.mjs';
import { commitAt } from '../../git/inspect.mjs';
import { registeredCapabilityOf } from '../execution/capability-config.mjs';

/** The raw `for` list of any executor (`[]` when it declares none): the one reader of `for`. */
export function forEntriesOf(executor) {
  return Array.isArray(executor?.for) ? executor.for : [];
}

/** The capabilities a tool executor serves; an agent executor serves none (its `for` is inert). */
export function servedCapabilitiesOf(executor) {
  return executor?.kind === 'tool' ? forEntriesOf(executor) : [];
}

/** A capability label folded to kebab-case: `Impact Analysis`, `impact_analysis` and `impact-analysis` are one name. */
function normalizeCapability(raw) {
  if (typeof raw !== 'string') return '';
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Whether the tool's own index records a commit behind the repository's `HEAD`. A missing or malformed
 * `meta.json`, a record without `lastCommit`, or a `HEAD` that does not resolve all read as not stale: a probe
 * never reports a staleness it did not see.
 */
function isIndexStale(scanPath, repoRoot) {
  let lastCommit;
  try {
    const meta = JSON.parse(fs.readFileSync(path.join(scanPath, 'meta.json'), 'utf8'));
    lastCommit = typeof meta.lastCommit === 'string' ? meta.lastCommit : undefined;
  } catch {
    return false;
  }
  if (!lastCommit) return false;
  try {
    return commitAt(repoRoot, 'HEAD') !== lastCommit;
  } catch {
    return false;
  }
}

/**
 * The presence of one tool, per its first invocation: a `cli`/`binary` command is found on PATH; an
 * `mcp`/`skill` tool is found by its `scanTarget` on disk (resolved against `repoRoot`), and is `stale` when its
 * own index is behind `HEAD`. No invocation, or an `mcp`/`skill` one without a `scanTarget`, cannot be probed.
 * Never throws: absence is a fact (`missing`), not an error.
 */
function probeStatus(executor, { repoRoot, pathEnv }) {
  const probe = Array.isArray(executor.invocations) ? executor.invocations[0] : undefined;
  if (probe?.via === 'cli' || probe?.via === 'binary') {
    return isCommandAvailable(probe.command, pathEnv) ? 'present' : 'missing';
  }
  if (probe?.via === 'mcp' || probe?.via === 'skill') {
    if (!executor.scanTarget) return 'unknown';
    const scanPath = path.resolve(repoRoot, executor.scanTarget);
    if (!fs.existsSync(scanPath)) return 'missing';
    return isIndexStale(scanPath, repoRoot) ? 'stale' : 'present';
  }
  return 'unknown';
}

/** The tool an `mcp` invocation names for `capability`; its `tools` keys are compared folded, like `for`. */
function mcpToolOf(executor, capability) {
  const tools = Array.isArray(executor.invocations) ? executor.invocations.find((inv) => inv.via === 'mcp')?.tools : undefined;
  if (!tools || typeof tools !== 'object') return undefined;
  const key = Object.keys(tools).find((name) => normalizeCapability(name) === capability);
  const tool = key === undefined ? undefined : tools[key];
  return typeof tool === 'string' && tool ? tool : undefined;
}

/**
 * Every tool executor that serves `capability` (every `for` entry counts, compared folded), in the config's
 * order, each with its live status. Without `capability`, every tool executor once per capability it serves.
 *
 * @param {object} runnerConfig
 * @param {object} [options]
 * @param {string} [options.capability]
 * @param {string} [options.repoRoot] resolves a tool's `scanTarget` and its `HEAD`; the working directory when absent
 * @param {string} [options.pathEnv] the PATH a `cli` tool is searched on; the process's own when absent
 * @returns {{ executorId: string, capability: string, status: 'present'|'stale'|'missing'|'unknown', mcpTool?: string, command?: string }[]}
 */
export function toolProvidersOf(runnerConfig, { capability, repoRoot = process.cwd(), pathEnv = process.env.PATH } = {}) {
  const wanted = capability === undefined ? undefined : normalizeCapability(capability);
  if (wanted === '') return [];
  const providers = [];
  const executors = runnerConfig?.executors && typeof runnerConfig.executors === 'object' ? runnerConfig.executors : {};
  for (const [executorId, executor] of Object.entries(executors)) {
    const served = [...new Set(servedCapabilitiesOf(executor).map(normalizeCapability).filter(Boolean))];
    const matching = wanted === undefined ? served : served.filter((name) => name === wanted);
    if (matching.length === 0) continue;
    const status = probeStatus(executor, { repoRoot, pathEnv });
    const command = Array.isArray(executor.invocations) ? executor.invocations.find((inv) => inv.via === 'cli')?.command : undefined;
    for (const name of matching) {
      const mcpTool = mcpToolOf(executor, name);
      providers.push({
        executorId,
        capability: name,
        status,
        ...(mcpTool ? { mcpTool } : {}),
        ...(typeof command === 'string' && command ? { command } : {}),
      });
    }
  }
  return providers;
}

/**
 * The name of a tool ability no tool is present to serve, else undefined. A capability is a tool ability when a
 * `kind: "tool"` executor declares it in `for` (its name or one of its row's aliases); it is unserved when every
 * such tool is probed `missing` or `unknown`. A capability no tool executor names is a label, whatever its row
 * holds, so it is never reported here.
 */
export function unservedToolAbilityOf(runnerConfig, capability, { repoRoot, pathEnv } = {}) {
  const name = registeredCapabilityOf(runnerConfig, capability) ?? capability;
  const providers = toolProvidersOf(runnerConfig, { capability: name, ...(repoRoot ? { repoRoot } : {}), ...(pathEnv ? { pathEnv } : {}) });
  if (providers.length === 0) return undefined;
  return providers.some(({ status }) => status === 'present' || status === 'stale') ? undefined : name;
}
