// What `fgos run` asks of the Execution Core: the request parameter flags (--params, --param) and, above them,
// `buildRunRequest`, which checks every flag of the three ways to run (a "<prompt>", --unit, --resume) and builds
// the options `runUnit` takes, so a wrong flag leaves no unit run behind. The shell only parses flags and prints.

import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { parseListFlag } from '../../cli/parse-args.mjs';
import { slugOf } from '../../util/slug.mjs';
import { loadRunnerConfigForDir, parseRunTimeout } from '../dispatch/config.mjs';
import { RunnerConfigError } from '../dispatch/runner-config-error.mjs';
import { resolveAgentDefinition } from '../agent-definitions.mjs';

// A flag that is bare (`--flag` with no value) or empty means no value was given: refused, never passed on.
function requireField(value, message) {
  if (value === undefined || value === null || value === '' || value === true) throw new RunnerConfigError(message);
  return value;
}

export class RunRequestError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'RunRequestError';
    this.code = code;
  }
}

function makeScalar(key, raw) {
  const scalar = { key, raw };
  Object.defineProperty(scalar, 'value', {
    get() {
      return this.raw;
    },
    enumerable: false,
    configurable: true,
  });
  return scalar;
}

/**
 * Normalizes request parameter flags into a canonical request shape.
 *
 * @param {object} [flags]
 * @param {string} [flags.params] JSON string representing a plain object
 * @param {string|string[]|boolean} [flags.param] Key-value parameter specification(s)
 * @returns {{ params?: object, scalars: Array<{ key: string, raw: string }> }}
 */
export function requestFromFlags(flags = {}) {
  const params = flags?.params;
  const param = flags?.param;
  let parsedParams;

  if (params !== undefined) {
    if (typeof params !== 'string') {
      throw new RunRequestError('param-invalid', '--params must be a JSON string');
    }
    let parsed;
    try {
      parsed = JSON.parse(params);
    } catch (e) {
      throw new RunRequestError('param-invalid', `--params must be valid JSON: ${e.message}`);
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new RunRequestError('param-invalid', '--params must parse to a plain JSON object');
    }
    parsedParams = parsed;
  }

  const scalars = [];
  const seenParamKeys = new Set();

  if (param !== undefined) {
    if (param === true) {
      throw new RunRequestError('param-invalid', '--param requires a key=value pair');
    }
    const rawList = Array.isArray(param) ? param : [param];
    for (const item of rawList) {
      if (typeof item !== 'string') {
        throw new RunRequestError('param-invalid', '--param value must be a string key=value pair');
      }
      const eqIdx = item.indexOf('=');
      if (eqIdx === -1) {
        throw new RunRequestError('param-invalid', `--param "${item}" missing "=" delimiter`);
      }
      const key = item.slice(0, eqIdx);
      const raw = item.slice(eqIdx + 1);
      if (key === '') {
        throw new RunRequestError('param-invalid', `--param "${item}" key cannot be empty`);
      }
      if (raw === '') {
        throw new RunRequestError('param-invalid', `--param "${item}" value cannot be empty`);
      }
      if (seenParamKeys.has(key)) {
        throw new RunRequestError('param-request-conflict', `parameter "${key}" specified more than once in --param`);
      }
      seenParamKeys.add(key);

      if (parsedParams && Object.hasOwn(parsedParams, key)) {
        throw new RunRequestError('param-request-conflict', `parameter "${key}" specified in both --params and --param`);
      }

      scalars.push(makeScalar(key, raw));
    }
  }

  const result = { scalars };
  if (parsedParams !== undefined) {
    result.params = parsedParams;
  }
  return result;
}

/**
 * A run-level setting (`--effort`, `--timeout`, `--account`) as overrides: `key: value` on every override that
 * does not name that key, and as a trailing unscoped override when none is unscoped, so a role no scoped
 * override names still gets it. Returns a new list; the input is not changed.
 */
export function foldRunSetting(overrides, key, value) {
  const folded = overrides.map((ov) => (ov && typeof ov === 'object' ? { ...ov } : ov));
  if (!folded.some((ov) => ov && typeof ov === 'object' && !ov.scope)) folded.push({});
  for (const ov of folded) {
    if (ov && typeof ov === 'object' && ov[key] === undefined) ov[key] = value;
  }
  return folded;
}

/** `--override <json>`: one override object or a list of them. */
function parseOverrideFlag(text) {
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (e) {
    throw new RunnerConfigError(`invalid JSON for --override: ${e.message}`);
  }
}

/** The overrides a run's flags imply, and nothing else: each fold is the one rule, `foldRunSetting`. */
function overridesFromFlags(flags, resumeUnitRunId) {
  let overrides = parseOverrideFlag(flags.override);
  // `--effort <level>` is a reasoningEffort override; bind() checks it against the chosen executor.
  if (flags.effort !== undefined) {
    overrides = foldRunSetting(overrides, 'reasoningEffort', requireField(flags.effort, '--effort requires a level (low, medium, high, max)'));
  }
  // `--timeout <dur>` (90m, 5400s, 2h) gives the run its own time instead of runner.timeoutMs. It is kept in
  // unit.json, so a resumed run keeps it and --timeout cannot change it.
  if (flags.timeout !== undefined) {
    if (resumeUnitRunId) throw new RunnerConfigError('--timeout cannot change a resumed unit run: it keeps the timeout it was started with');
    let timeoutMs;
    try {
      timeoutMs = parseRunTimeout(requireField(flags.timeout, '--timeout requires a duration, e.g. 90m or 5400s'));
    } catch (err) {
      throw new RunnerConfigError(err.message);
    }
    overrides = foldRunSetting(overrides, 'timeoutMs', timeoutMs);
  }
  // `--account <pool/account>` pins the account; runUnit checks it against each seat's bound executor before the
  // unit run exists, and a resumed run keeps the account its bindings already carry.
  if (flags.account !== undefined) {
    if (resumeUnitRunId) throw new RunnerConfigError('--account cannot change a resumed unit run: it keeps the account its seats were bound to');
    overrides = foldRunSetting(overrides, 'account', requireField(flags.account, '--account requires pool/account (an account of a pool in ~/.fgos/private/accounts.yaml, for example openai/work)'));
  }
  return overrides;
}

/**
 * The Unit `fgos run "<prompt>"` stands for: the prompt is its objective, `--writes` its write scope
 * (none: a read-only unit), `--provider` its soft executor preference, `--persona` its persona,
 * `--input` the files it is handed (Unit `inputs`) and `--verify` the command that checks its work.
 * Every flag is checked against the config and the persona tiers here. A writing unit needs a linked
 * worktree; this never creates one.
 */
function adhocUnitFromPrompt(prompt, flags, { mainRoot, isLinkedWorktree }) {
  // `--sync <ref>` without a prompt is a sync-only unit: the runner merges the ref and a worker
  // runs only when the merge stops on conflicts.
  const syncOnly = prompt === undefined && flags.sync !== undefined;
  if (!syncOnly && (typeof prompt !== 'string' || !prompt.trim())) {
    throw new RunnerConfigError('fgos run "<prompt>" needs a non-empty prompt');
  }
  const syncBase = flags.sync === undefined ? undefined : requireField(flags.sync, '--sync requires a ref to merge (a branch, tag or commit, e.g. main)');
  const writes = parseListFlag(flags.writes);
  if (syncBase !== undefined && flags.writes === undefined) {
    throw new RunnerConfigError('fgos run --sync needs --writes: merging a ref changes the branch, so the unit is a writing unit in a linked worktree (the conflicted paths join the scope by themselves)');
  }
  if (flags.writes !== undefined && writes.length === 0) {
    throw new RunnerConfigError('fgos run "<prompt>" --writes needs at least one path; omit it for a read-only unit');
  }
  if (writes.length > 0 && !isLinkedWorktree()) {
    throw new RunnerConfigError('fgos run "<prompt>" --writes needs a linked worktree: create one with `git worktree add <path>` and pass --worktree <path> (or run from inside it)');
  }
  const inputs = parseListFlag(flags.input);
  if (flags.input !== undefined && inputs.length === 0) {
    throw new RunnerConfigError('fgos run "<prompt>" --input needs at least one repo-relative path (comma-separated); omit it for a unit with no input files');
  }
  const prefer = parseListFlag(flags.provider);
  if (flags.provider !== undefined) {
    const executors = loadRunnerConfigForDir(mainRoot).executors ?? {};
    const valid = Object.keys(executors).filter((id) => (executors[id]?.kind ?? 'agent') === 'agent');
    const unknown = prefer.find((id) => !valid.includes(id));
    if (prefer.length === 0 || unknown !== undefined) {
      throw new RunnerConfigError(`unknown --provider "${unknown ?? ''}"; valid providers: ${valid.join(', ') || '(none registered)'}`);
    }
  }
  if (flags.persona !== undefined) {
    const persona = requireField(flags.persona, '--persona requires a persona name');
    try {
      resolveAgentDefinition(persona, { projectRoot: mainRoot });
    } catch (err) {
      throw new RunnerConfigError(err.message);
    }
  }
  return {
    id: `adhoc-${slugOf(syncOnly ? `sync-${syncBase}` : prompt, 'task')}-${randomBytes(2).toString('hex')}`,
    ...(syncOnly ? {} : { objective: prompt }),
    ...(syncBase !== undefined ? { syncBase } : {}),
    capability: flags.capability === undefined ? 'execute' : requireField(flags.capability, '--capability requires a capability name'),
    writes,
    ...(flags.rigor !== undefined ? { rigor: requireField(flags.rigor, '--rigor requires a level') } : {}),
    ...(prefer.length > 0 ? { prefer } : {}),
    ...(flags.persona !== undefined ? { persona: flags.persona } : {}),
    ...(inputs.length > 0 ? { inputs } : {}),
    ...(flags.verify !== undefined ? { verify: requireField(flags.verify, '--verify requires a command, e.g. --verify "npm test"') } : {}),
  };
}

/** `--case <id> --activity <id>` names the case this run is an activity of; the other case flags mean nothing without them. */
function caseRefFromFlags(flags, resumeUnitRunId) {
  const given = ['case', 'activity', 'route', 'reason'].filter((f) => flags[f] !== undefined);
  if (given.length === 0) return undefined;
  if (resumeUnitRunId) throw new RunnerConfigError('--case cannot change a resumed unit run: it keeps the case it was admitted into');
  const caseId = requireField(flags.case, `--${given.find((f) => f !== 'case') ?? 'case'} needs --case <caseId>: ${given.join(', ')} only apply to a run that names a case`);
  const activity = requireField(flags.activity, '--case needs --activity <id>: the activity of the case\'s guide this run is');
  if (flags.route !== undefined && !['should', 'may-instead', 'unlisted'].includes(flags.route)) {
    throw new RunnerConfigError('--route must be should, may-instead or unlisted');
  }
  return {
    caseId,
    activity,
    ...(flags.route !== undefined ? { route: flags.route } : {}),
    ...(flags.reason !== undefined ? { reason: requireField(flags.reason, '--reason requires text') } : {}),
  };
}

/** The ways to say what to run are exclusive, and the flags of one way mean nothing to another: refused, never dropped. */
function refuseConflictingFlags(flags, positional) {
  const unitPath = flags.unit;
  const resumeUnitRunId = flags.resume;
  const prompt = positional[0];
  if (!unitPath && !resumeUnitRunId && prompt === undefined && flags.sync === undefined) {
    throw new RunnerConfigError('fgos run requires --unit <file|-> or --resume <unitRunId>, a "<prompt>", or --sync <ref>');
  }
  if ([unitPath, resumeUnitRunId, prompt].filter((v) => v !== undefined).length > 1) {
    throw new RunnerConfigError('fgos run takes either a "<prompt>", --unit or --resume, not more than one');
  }
  if (positional.length > 1) {
    throw new RunnerConfigError(`fgos run takes one prompt; quote the prompt ("${positional.join(' ')}")`);
  }
  // A bare `--sync <ref>` builds a sync-only unit from the same flags (a --unit file names `syncBase`).
  if (flags.sync !== undefined && (unitPath || resumeUnitRunId)) {
    throw new RunnerConfigError('--sync only applies to fgos run "<prompt>" or a bare --sync <ref>; a --unit file names syncBase, and a resume keeps the sync it started with');
  }
  const buildsUnit = prompt !== undefined || flags.sync !== undefined;
  const promptOnlyFlag = !buildsUnit && ['provider', 'persona', 'writes', 'capability', 'rigor', 'input', 'verify'].find((f) => flags[f] !== undefined);
  if (promptOnlyFlag) throw new RunnerConfigError(`--${promptOnlyFlag} only applies to fgos run "<prompt>"`);
}

/**
 * Everything `fgos run` decides before a unit run exists: the flags of the three ways to run, the Unit a prompt
 * stands for, the overrides, the request parameters and the case the run is an activity of. Returns the options
 * `runUnit` takes, or throws one refusal.
 *
 * `roots` is what the caller owns: `cwd`, `gitRoots(cwd)` (`{ mainCheckoutRoot, isLinkedWorktree }`) and
 * `caseAdmission` (`createPort({ repoRoot })`, `activityUnitOf({ mainRoot, caseId, activity })`), the Workflow's
 * port, handed in so the Execution Core never imports the Workflow. A run's own account pin is `strict`: no seat
 * taking it refuses the run, and a pin never moves a seat to another pool.
 */
export function buildRunRequest(flags, positional, roots) {
  refuseConflictingFlags(flags, positional);
  const unitPath = flags.unit;
  const resumeUnitRunId = flags.resume;
  const prompt = positional[0];
  const buildsUnit = prompt !== undefined || flags.sync !== undefined;
  const overrides = overridesFromFlags(flags, resumeUnitRunId);

  const repoRoot = flags.dir;
  const worktree = flags.worktree;
  const portRoot = repoRoot ? path.resolve(repoRoot) : (() => { try { return roots.gitRoots(roots.cwd).mainCheckoutRoot; } catch { return null; } })();
  // Everything about the one-liner is checked here, before runUnit creates a unit run.
  const unitData = !buildsUnit ? undefined : adhocUnitFromPrompt(prompt, flags, {
    mainRoot: repoRoot ? path.resolve(repoRoot) : roots.gitRoots(roots.cwd).mainCheckoutRoot,
    // Where a writing unit would run: --worktree, else here. Only a linked worktree may be written.
    isLinkedWorktree: () => roots.gitRoots(worktree ? path.resolve(worktree) : roots.cwd).isLinkedWorktree,
  });
  if (resumeUnitRunId) {
    if (flags.params !== undefined) throw new RunnerConfigError('--params cannot change a resumed unit run: it keeps the request it was started with');
    if (flags.param !== undefined) throw new RunnerConfigError('--param cannot change a resumed unit run: it keeps the request it was started with');
  }
  let request;
  if (flags.params !== undefined || flags.param !== undefined) {
    try {
      request = requestFromFlags({ params: flags.params, param: flags.param });
    } catch (err) {
      throw new RunnerConfigError(`${err.code}: ${err.message}`, { code: err.code, phase: 'pre-admission' });
    }
  }
  // A run that names a case is admitted into it (entry, MUST rules, write overlap, frame) before anything exists;
  // without one it is standalone, and a writing one goes on only into a worktree no case owns.
  const caseRef = caseRefFromFlags(flags, resumeUnitRunId);
  const activityUnit = caseRef ? roots.caseAdmission.activityUnitOf({ mainRoot: portRoot, caseId: caseRef.caseId, activity: caseRef.activity }) : undefined;

  return {
    unitPath,
    unitData,
    ...(portRoot ? { caseAdmission: roots.caseAdmission.createPort({ repoRoot: portRoot }) } : {}),
    ...(caseRef ? { caseRef } : {}),
    ...(activityUnit !== undefined ? { activityUnit } : {}),
    ...(request !== undefined ? { request } : {}),
    // No door of this release can attest a person, so an override tier above the resolved one, or an accepted
    // dependence, is refused by name. A prompt-built unit's --capability and --persona are the unit's own
    // declarations, like the same keys of a --unit file.
    raiseAuthorized: false,
    accountPin: 'strict',
    pattern: flags.pattern,
    stanceOptions: flags['stance-options'] === undefined ? undefined : requireField(flags['stance-options'], '--stance-options requires pipe-separated option labels').split('|'),
    overrides,
    resumeUnitRunId,
    repoRoot,
    cwd: roots.cwd,
    worktree,
  };
}
