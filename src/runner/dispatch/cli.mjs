// dispatch/cli.mjs — dispatch behavior + the thin CLI doors over it (D7, tsk-2uf-1):
// the `decide`/`probe-account`/`reconcile` subcommands of `node src/runner/dispatch.mjs`
// (`runDispatchCli`). One task runs through `fgos run`, planned work through a Workflow;
// the raw `execute` and `log` subcommands are gone. See `docs/history/dispatch-activation-
// and-handoff-redesign/CONTEXT.md` D7 for the module split.

import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';

class StoreError extends Error {
  constructor(category, message) {
    super(message);
    this.name = 'StoreError';
    this.category = category;
  }
}

import { resolveRepoRoot, resolveMainCheckoutRoot, fgosDirFromRoot } from '../paths.mjs';
import { projectConfigPresent } from '../../config/facade.mjs';
import { RunnerConfigError, loadRunnerConfigForDir, registeredCapabilityOf, withDefaultExecutor } from './config.mjs';
import { WORK_ITEM_KEYS, refuseWorkItemInput } from './work-item-input.mjs';
import { decideDispatchMechanism, decideExecutorDispatchMechanism } from './mechanism.mjs';
import { compileDispatchPlan } from './plan.mjs';
import { executeAssignment } from './assignment-runner.mjs';
import { adoptRun } from '../../run-supervisor/client.mjs';
import { runAccountProbe } from './provider-account-probe.mjs';
import { createCredentialRenewal } from './provider-credential-renewal.mjs';
import { createRoundTerminalControl } from './terminal-slot.mjs';
import { envForSession } from './worker-session.mjs';
import { resolveHerdrBin } from './transport.mjs';
import { buildAssignment, claimAssignmentId } from './assignment.mjs';
import { resolveWriterIdentity } from '../../util/session-identity.mjs';

export { watchWritesOutsideWorkspace, strayWriteWarning } from './stray-writes.mjs';

// Work-driven dispatch (`spawnWorker`, the executor a Work item's step resolves to) lives in
// the Work layer, src/runner/work-dispatch.mjs; this module takes what that layer resolved.

/**
 * Resolve persona/agentType for a given taskSpec header & list of registered agent-types (D20/D21/D22/D32).
 * Tie-break priority (D32):
 * 1. Task-spec declares `agent:` pin -> wins immediately, skipping skill-matching.
 * 2. No pin -> if `currentAgentType` matches all `requires-skill`, stay with `currentAgentType`.
 * 3. Otherwise -> select deterministically by declaration order (first matching agent-type in `agentDefs`).
 */
export function resolveAgentTypeForTaskSpec(taskSpecHeader, agentDefs = [], currentAgentType = null) {
  if (!taskSpecHeader) return null;

  const pinnedAgents = Array.isArray(taskSpecHeader.agent)
    ? taskSpecHeader.agent
    : typeof taskSpecHeader.agent === 'string' && taskSpecHeader.agent.trim()
      ? [taskSpecHeader.agent.trim()]
      : [];

  if (pinnedAgents.length > 0) {
    const found = agentDefs.find((a) => pinnedAgents.includes(a.name));
    return found ? found.name : null;
  }

  const requiredSkills = Array.isArray(taskSpecHeader['requires-skill'])
    ? taskSpecHeader['requires-skill']
    : typeof taskSpecHeader['requires-skill'] === 'string' && taskSpecHeader['requires-skill'].trim()
      ? [taskSpecHeader['requires-skill'].trim()]
      : [];

  if (requiredSkills.length === 0) {
    return null;
  }

  if (currentAgentType) {
    const currentDef = agentDefs.find((a) => a.name === currentAgentType);
    if (currentDef && Array.isArray(currentDef.skills)) {
      const hasAllSkills = requiredSkills.every((s) => currentDef.skills.includes(s));
      if (hasAllSkills) return currentAgentType;
    }
  }

  const matching = agentDefs.find(
    (a) => Array.isArray(a.skills) && requiredSkills.every((s) => a.skills.includes(s)),
  );
  if (matching) return matching.name;

  return null;
}


/**
 * A claude REPL in a herdr pane is briefed with a pointer to a file in the run directory,
 * and the run directory lives under the store, which is outside the worker's cwd (its
 * worktree). Claude asks the human before reading outside its working directories, and
 * nobody is there to answer. Blind inputs are copied to assignmentDir/inputs,
 * beside runs/NN, so grant only that directory (when present) and the run
 * directory. This is claude's own prompt; the OS-level posture is unchanged.
 */
export function withRunDirReadAccess({ adapter, interactiveMode, args, runDir }) {
  if (adapter !== 'herdr-spawn' || interactiveMode?.kind !== 'claude' || !runDir) return args;
  if (!Array.isArray(args)) return args;
  const run = path.resolve(runDir);
  const inputs = path.join(path.dirname(path.dirname(run)), 'inputs');
  const directories = [run, ...(fs.existsSync(inputs) ? [inputs] : [])];
  // Non-blind handoffs point at settled sibling reports, not copied inputs.
  const assignmentFile = path.join(path.dirname(path.dirname(run)), 'assignment.json');
  if (fs.existsSync(assignmentFile)) {
    const { contextRefs = [] } = JSON.parse(fs.readFileSync(assignmentFile, 'utf8'));
    for (const ref of contextRefs) {
      if (typeof ref === 'string' && path.isAbsolute(ref) && fs.existsSync(ref) && fs.statSync(ref).isFile()) {
        const parent = path.dirname(fs.realpathSync(ref));
        if (!directories.includes(parent)) directories.push(parent);
      }
    }
  }
  const existing = args.indexOf('--add-dir');
  return existing < 0
    ? [...args, '--add-dir', ...directories]
    : [...args.slice(0, existing + 1), ...directories, ...args.slice(existing + 1)];
}

/**
 * The directory whose project config a dispatch reads: the linked worktree `cwd` sits in when that worktree
 * carries a config of its own (a YAML file or a legacy JSON one), otherwise `root`, the
 * main checkout. A worktree whose config file the door refuses surfaces the refusal; only not finding a
 * repository for `cwd` falls back to `root`.
 */
function configRootFor(cwd, root) {
  if (!cwd) return root;
  let wtRoot;
  let mainRoot;
  try {
    wtRoot = resolveRepoRoot(cwd);
    mainRoot = resolveMainCheckoutRoot(cwd);
  } catch {
    return root;
  }
  return mainRoot === root && wtRoot !== root && projectConfigPresent(wtRoot) ? wtRoot : root;
}

/**
 * The `fgos run` command a caller uses instead of dispatching `executorId` directly, read from
 * the config at `cwd` without writing it. `--provider` names agent executors only, and only as a
 * preference bind may override; a tool executor has no run door, so the hint says to call the
 * tool itself. `capability` is kept when it is a registered one.
 */
export function runDoorHint({ cwd = process.cwd(), executorId, capability } = {}) {
  let cfg = null;
  try {
    cfg = loadRunnerConfigForDir(resolveMainCheckoutRoot(cwd) ?? resolveRepoRoot(cwd));
  } catch { /* no readable config: the hint names no executor */ }
  const executor = executorId && cfg?.executors && Object.hasOwn(cfg.executors, executorId) ? cfg.executors[executorId] : null;
  const isAgent = executor !== null && (executor.kind ?? 'agent') === 'agent';
  const registeredCapability = capability && cfg ? registeredCapabilityOf(cfg, capability) : undefined;
  const command = ['fgos run "<prompt>"'];
  if (isAgent) command.push(`--provider ${executorId}`);
  if (registeredCapability) command.push(`--capability ${registeredCapability}`);
  command.push('[--writes <paths> --worktree <path>]');
  const hint = `\`${command.join(' ')}\``;
  if (isAgent) return `${hint} (--provider is a preference: bind may choose another executor that serves the capability)`;
  if (executor) return `${hint}; "${executorId}" is a ${executor.kind} executor, which fgos run cannot name -- call that tool directly instead`;
  return hint;
}

/**
 * `decide <executorId>` CLI subcommand (tsk-3ik-1): lets a task-dispatch
 * consumer skill ask, before choosing whether to `execute` the command or
 * call its own Task tool natively, which mechanism
 * `decideExecutorDispatchMechanism` picks for this executor right now.
 * Prints `{"mechanism": "in-process"|"out-of-process"}` as JSON to stdout. It reads the committed
 * runner config and never runs anything: running a task is `fgos run`.
 *
 * `--has-live-task-access` is the caller's own self-declaration (never
 * probed or inferred here — same contract `decideDispatchMechanism` itself
 * documents) that this session already has live Agent/Task tool access.
 *
 * `agentType` (tsk-3ik-3, additive): included in the result, alongside
 * `mechanism`, whenever the executor declares one — a `mechanism:
 * "in-process"` result is otherwise useless to a consumer skill's own
 * Agent/Task tool call, which needs a concrete `subagent_type` to invoke,
 * not just "go in-process" with no target. Omitted (`undefined`, dropped by
 * `JSON.stringify`) for a executor with no `agentType`, e.g. every `kind:
 * "cli"` executor — `mechanism` for those always resolves
 * `"out-of-process"` anyway (rule 1/3), so no consumer ever needs
 * `agentType` in that case.
 *
 * `workId` (tsk-5tm-6 D4/D12(iii)): a work-item id, resolved by the Work layer (`resolveWork`,
 * handed in by the caller) to a generic hint -- its dispatch executor, agent type, rigor and
 * domain -- before deciding its mechanism -- the
 * lookup `fgos-fanout` needs to consult this protocol per-candidate before
 * firing an Agent, instead of assuming native dispatch unconditionally.
 * Lowest precedence of the three selectors (a real `executorIdArg` always
 * wins, `for` next, matching every pre-D4 caller's byte-identical
 * behavior) since no existing caller ever passes more than one.
 *
 * `needsSoul` (tsk-60f D2): the caller's own self-declaration that it is
 * about to fire its own Agent/Task tool with no executor or work item to
 * name -- the natural fourth signal `decide` never had, distinct from a
 * fourth lookup door (an explicit `--subtask` door was rejected: a
 * sub-task's only natural key is a purpose label, i.e. `for`). Only
 * consulted once every executorId/purpose/work resolution above came up
 * empty (a real match always wins, unchanged): when `needsSoul` is true,
 * that empty resolution defaults to native dispatch
 * (`hasNativeMechanism: true`) instead of `"unavailable"` -- the exact
 * generalization of `work`'s own `hasExplicitExecutor === false` branch
 * above, which has hardcoded this same default for every `--work` caller
 * since tsk-5tm-6.
 *
 * `configured` (tsk-60f D3, additive on every returned shape): `true` when
 * the resolved `executorId` names a real `cfg.executors` entry, `false`
 * otherwise -- distinguishing "nothing registered under this name/purpose"
 * from "registered, and its own kind resolves out-of-process", which today
 * both silently collapse into the same `mechanism: "out-of-process"`
 * value. Never a reason to throw (D3): a work item whose own
 * resolved executor has no override configured is `configured:
 * false` by design (tsk-in1 D12), not an error.
 *
 * `mcpTool` (tsk-45f D10, additive, mutually exclusive with `agentType`):
 * MCP hand-back -- a `kind:"tool"` executor whose mcp invocation declares a
 * `tools` map (piece 3) with an entry for the requested purpose gets
 * `mechanism` upgraded from `out-of-process` to `in-process`, carrying
 * `mcpTool` instead of `agentType`. Same reasoning as the agent-kind
 * hand-back: dispatch has no MCP client of its own, so the caller calls its
 * OWN MCP tool directly (AGENTS.md's Dispatch section, D12). Never builds
 * an MCP client here, never touches Gate B3 (`resolveExecutorConfig`) --
 * a caller that skips `decide` and calls `execute` directly on an mcp-only
 * executor still hits that gate exactly as before.
 */
export async function decideExecutorCli(
  executorIdArg,
  {
    cwd = process.cwd(),
    repoRoot,
    hasLiveTaskAccess = false,
    for: purpose,
    workId: workIdArg,
    assignment: assignmentArg,
    stage: stageArg,
    needsSoul = false,
    caller,
    // Work-layer lookup for `--work`: ({ workId, stage, fgosDir }) -> { workExecutorId,
    // agentType, rigor, domain } | null. Dispatch holds no Work store of its own.
    resolveWork,
  } = {},
) {
  refuseWorkItemInput(arguments[1], 'decideExecutorCli()');
  if (!executorIdArg && !purpose && !workIdArg && !assignmentArg && !needsSoul) {
    throw new RunnerConfigError(
      'usage: node src/runner/dispatch.mjs decide <executorId> [--has-live-task-access] | decide --for <purpose> [--needs-soul] [--has-live-task-access] | decide --work <workId> [--stage <stage>] [--has-live-task-access] | decide --assignment <assignmentId> [--has-live-task-access] | decide --needs-soul [--has-live-task-access]',
    );
  }
  const root = repoRoot ?? resolveMainCheckoutRoot(cwd) ?? resolveRepoRoot(cwd);
  const configRoot = configRootFor(cwd, root);
  const cfg = withDefaultExecutor(loadRunnerConfigForDir(configRoot));

  let workHint;
  if (!executorIdArg && workIdArg) {
    if (typeof resolveWork !== 'function') {
      throw new RunnerConfigError(
        `--work needs the Work layer to resolve "${workIdArg}" to its dispatch executor; run "fgos dispatch decide --work ${workIdArg}" instead of the bare dispatch module.`,
      );
    }
    const resolved = resolveWork({ workId: workIdArg, stage: stageArg, fgosDir: fgosDirFromRoot(root) });
    if (!resolved) {
      throw new RunnerConfigError(`no work item "${workIdArg}" found -- cannot resolve its dispatch executor.`);
    }
    // The executor identity is required (null when the Workflow declares none); a resolver
    // that leaves it out is refused by the plan instead of falling back to a default executor.
    refuseWorkItemInput(resolved, 'the --work resolver result', WORK_ITEM_KEYS);
    workHint = resolved;
  }

  let assignmentItem;
  if (!executorIdArg && assignmentArg) {
    const fgosDir = fgosDirFromRoot(root);
    const asgnId = typeof assignmentArg === 'string' ? assignmentArg : assignmentArg?.assignmentId;
    if (asgnId) {
      const assignmentPath = path.join(fgosDir, 'assignments', asgnId, 'assignment.json');
      if (fs.existsSync(assignmentPath)) {
        try {
          assignmentItem = JSON.parse(fs.readFileSync(assignmentPath, 'utf8'));
        } catch {
          assignmentItem = null;
        }
      }
    }
  }

  const plan = compileDispatchPlan(cfg, {
    executorId: executorIdArg,
    for: purpose,
    workId: workIdArg,
    assignment: assignmentArg,
    needsSoul,
    hasLiveTaskAccess,
    caller,
    workHint,
    assignmentItem,
  });

  const resolvedIndirectly = !executorIdArg;
  const base = plan.mcpTool
    ? {
        mechanism: 'in-process',
        mcpTool: plan.mcpTool,
        configured: plan.configured,
        reasonCodes: plan.reasonCodes ?? [],
        ...(plan.blockedReason !== undefined ? { blockedReason: plan.blockedReason } : {}),
      }
    : typeof plan.agentType === 'string' && plan.agentType
      ? {
          mechanism: plan.mechanism,
          agentType: plan.agentType,
          configured: plan.configured,
          reasonCodes: plan.reasonCodes ?? [],
          ...(plan.blockedReason !== undefined ? { blockedReason: plan.blockedReason } : {}),
        }
      : {
          mechanism: plan.mechanism,
          configured: plan.configured,
          reasonCodes: plan.reasonCodes ?? [],
          ...(plan.blockedReason !== undefined ? { blockedReason: plan.blockedReason } : {}),
        };

  return resolvedIndirectly && plan.executorId ? { ...base, executorId: plan.executorId } : base;
}

/**
 * Guard against --repo-root being passed without --cwd when process.cwd() resolves
 * to a different main-checkout root (or is not a main checkout at all, e.g. a worktree).
 * (tsk-322 / D-ADR0030)
 */
export function guardCwdRepoRootDivergence(cwd, repoRoot) {
  if (repoRoot && !cwd) {
    const mainRoot = resolveMainCheckoutRoot(process.cwd());
    const resolvedMain = mainRoot ? path.resolve(mainRoot) : null;
    const resolvedRepo = path.resolve(repoRoot);
    if (!resolvedMain || resolvedMain !== resolvedRepo) {
      const displayMain = mainRoot ? `"${mainRoot}"` : 'not a main checkout';
      throw new RunnerConfigError(
        `--repo-root ("${repoRoot}") passed without --cwd, but process.cwd() main checkout root resolved to ${displayMain} — pass --cwd explicitly.`,
      );
    }
  }
}

/**
 * Body of `node src/runner/dispatch.mjs <decide|probe-account|reconcile> ...`, called from the
 * barrel's script guard; `fgos dispatch decide|probe-account` reach it with `returnResult`.
 * `resolveWork` is the Work lookup `decide --work` needs, handed in by bin; without it
 * `decide --work` refuses.
 */
export async function runDispatchCli(argv = process.argv.slice(2), { returnResult = false, resolveWork } = {}) {
  const [subcommand, ...afterSubcommand] = argv;
  // Purpose-based binding (tsk-2c1): a caller with no pre-registered
  // executorId to name (a gather branch) passes `--for <purpose>` instead
  // of a positional id — distinguished here by whether the token right
  // after the subcommand looks like a flag. Every pre-tsk-2c1 invocation
  // always names a real, non-"--"-prefixed executorId positionally, so
  // this never changes behavior for an existing caller.
  const executorId = afterSubcommand[0] && !afterSubcommand[0].startsWith('--') ? afterSubcommand[0] : undefined;
  const rest = executorId ? afterSubcommand.slice(1) : afterSubcommand;
  const flagValue = (name) => {
    const i = rest.indexOf(name);
    return i !== -1 ? rest[i + 1] : undefined;
  };
  // Milliseconds flag: absent stays undefined (the config value applies).
  const positiveIntFlag = (name) => {
    const raw = flagValue(name);
    if (raw === undefined) return undefined;
    const value = Number(raw);
    if (!/^\d+$/.test(raw) || !Number.isSafeInteger(value) || value <= 0) {
      throw new StoreError('validation', `${name} must be a positive integer (milliseconds), got ${JSON.stringify(raw)}`);
    }
    return value;
  };
  switch (subcommand) {
    case 'decide': {
      try {
        guardCwdRepoRootDivergence(flagValue('--cwd') ?? flagValue('--dir'), flagValue('--repo-root'));
      } catch (err) {
        if (returnResult) throw err;
        process.stderr.write(`${err.message}\n`);
        process.exitCode = 1;
        break;
      }
      try {
        const decided = await decideExecutorCli(executorId, {
          cwd: flagValue('--cwd') ?? flagValue('--dir'),
          repoRoot: flagValue('--repo-root'),
          hasLiveTaskAccess: rest.includes('--has-live-task-access'),
          for: flagValue('--for'),
          workId: flagValue('--work'),
          assignment: flagValue('--assignment'),
          stage: flagValue('--stage'),
          needsSoul: rest.includes('--needs-soul'),
          resolveWork,
        });
        if (returnResult) return decided;
        process.stdout.write(`${JSON.stringify(decided)}\n`);
      } catch (err) {
        if (returnResult) throw err;
        process.stderr.write(`${err.message}\n`);
        process.exitCode = 1;
      }
      break;
    }
    case 'probe-account': {
      // Diagnostic: every CLI of one provider account at the same moment, through the real dispatch door.
      try {
        const provider = flagValue('--provider');
        const accountId = flagValue('--account');
        if (!provider || !accountId) {
          throw new StoreError('validation', 'dispatch probe-account requires --provider <provider> --account <accountId>');
        }
        const cwd = path.resolve(flagValue('--cwd') ?? flagValue('--dir') ?? process.cwd());
        const repoRoot = path.resolve(flagValue('--repo-root') ?? resolveMainCheckoutRoot(cwd) ?? resolveRepoRoot(cwd));
        const assignmentsDir = path.join(fgosDirFromRoot(repoRoot), 'assignments');
        const fgosDir = fgosDirFromRoot(repoRoot);
        const invocationFlag = flagValue('--invocation');
        const herdrBin = resolveHerdrBin();
        const result = await runAccountProbe({
          cfg: loadRunnerConfigForDir(repoRoot),
          provider,
          accountId,
          executorId: flagValue('--executor') ?? null,
          invocationIds: invocationFlag ? invocationFlag.split(',').map((s) => s.trim()).filter(Boolean) : null,
          repoRoot,
          timeoutMs: positiveIntFlag('--timeout-ms'),
          createAssignment: (contract) => claimAssignmentId(() => buildAssignment({
            options: { assignmentsDir },
            provenance: { kind: 'inline', contract, caller: { writerId: String(resolveWriterIdentity(fgosDir).id) } },
          }), assignmentsDir),
          dispatch: (assignment, { runnerConfig, cliOverride }) => executeAssignment(assignment, {
            cwd,
            repoRoot,
            runnerConfig,
            cliOverride,
            isReadOnlyMode: true,
            providerCredentialRenew: createCredentialRenewal(),
          }),
          closePane: ({ paneId, herdrSession, terminalKey }) => {
            // A run record that carries no key was written before panes were addressed by key:
            // nothing proves which pane it was, so it is left open.
            if (!terminalKey) return false;
            let closed = false;
            try {
              const tc = createRoundTerminalControl({
                herdrBin, herdrEnv: herdrSession ? envForSession(process.env, herdrSession) : process.env,
              });
              // A pane a settled round already closed is not "closed by the probe".
              if (tc.inspect({ key: terminalKey }).pane === 'live') {
                closed = tc.release({ key: terminalKey, disposition: 'close' }).result === 'released';
              }
            } catch { /* a pane that cannot be closed stays open */ }
            return closed;
          },
        });
        if (returnResult) return result;
        process.stdout.write(`${JSON.stringify(result)}\n`);
      } catch (err) {
        if (returnResult) throw err;
        process.stderr.write(`${err.message}\n`);
        process.exitCode = 1;
      }
      break;
    }
    case 'reconcile': {
      const runDir = executorId ?? flagValue('--run-dir') ?? (typeof positional !== 'undefined' ? positional[1] : undefined);
      if (!runDir) {
        const msg = 'dispatch reconcile requires a run directory: node src/runner/dispatch.mjs reconcile <runDir>\n';
        if (returnResult) throw new StoreError('validation', msg.trim());
        process.stderr.write(msg);
        process.exitCode = 1;
        break;
      }
      try {
        // The adopt door judges the attempt and finishes what its supervisor left; a run from before the
        // supervisor answers `legacy-run`.
        const result = adoptRun(path.resolve(runDir));
        if (returnResult) return result;
        process.stdout.write(`${JSON.stringify(result)}\n`);
      } catch (err) {
        if (returnResult) throw err;
        process.stderr.write(`${err.message}\n`);
        process.exitCode = 1;
      }
      break;
    }
    default: {
      const msg = `unknown subcommand ${JSON.stringify(subcommand)}. Usage: node src/runner/dispatch.mjs decide <executorId> [--has-live-task-access] | decide --for <purpose> [--needs-soul] [--has-live-task-access] | decide --needs-soul [--has-live-task-access] | reconcile <runDir> | probe-account --provider <provider> --account <accountId> [--executor <id>] [--invocation <id,...>] [--timeout-ms <ms>]. To run a task: fgos run "<prompt>"; decide --work: fgos dispatch decide --work <workId>\n`;
      if (returnResult) throw new StoreError('validation', msg.trim());
      process.stderr.write(msg);
      process.exitCode = 1;
    }
  }
}
