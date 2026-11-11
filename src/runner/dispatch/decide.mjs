// decide.mjs -- `fgos dispatch decide`: which mechanism and executor a dispatch resolves to, read from the
// committed runner config without running anything. It is the one read the PreToolUse hook and the shell also
// make, so it lives apart from the assignment runner and the probes in cli.mjs and loads only the config, the
// plan and the repository roots.

import path from 'node:path';
import fs from 'node:fs';
import { resolveRepoRoot, resolveMainCheckoutRoot, fgosDirFromRoot } from '../paths.mjs';
import { projectConfigPresent } from '../../config/facade.mjs';
import { loadRunnerConfigForDir, registeredCapabilityOf, withDefaultExecutor } from './config.mjs';
import { RunnerConfigError } from './runner-config-error.mjs';
import { WORK_ITEM_KEYS, refuseWorkItemInput } from './work-item-input.mjs';
import { compileDispatchPlan } from './plan.mjs';

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
 * The sentence a removed `fgos dispatch` door answers with, or null for a sub-verb that is not one: each ran one
 * task straight through dispatch and now has a runUnit door. One place says which, so every caller of
 * `fgos dispatch` (shell, gateway, scripts) gets the same validation error before anything runs.
 */
export function retiredDispatchDoorMessage(sub, positional, flags) {
  if (sub === 'execute') {
    if (flags.assignment !== undefined) {
      return 'fgos dispatch execute --assignment was removed: run the unit with `fgos run --unit <file>`, or planned work with `fgos workflow start <preset>|--units <file>`.';
    }
    const executorId = positional[1] && !String(positional[1]).startsWith('--') ? positional[1] : undefined;
    const hint = runDoorHint({
      cwd: typeof flags.cwd === 'string' ? flags.cwd : process.cwd(),
      executorId,
      capability: typeof flags.for === 'string' ? flags.for : undefined,
    });
    return `fgos dispatch execute was removed: run one task with ${hint}, or a unit file with \`fgos run --unit <file>\`.`;
  }
  if (sub === 'log') {
    return 'fgos dispatch log was removed: every run records its own provenance under `.fgos/assignments/<unitRunId>/`; run work through `fgos run` and read it there.';
  }
  return null;
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
 * `fgos dispatch decide` once its flags are read: the cwd/repo-root guard, then the decision. Returns the answer
 * or throws one refusal; printing and exit codes belong to the caller, so a refusal is written once, on one stream.
 */
export async function decideCommand({ executorId, cwd, repoRoot, ...selectors }) {
  guardCwdRepoRootDivergence(cwd, repoRoot);
  return decideExecutorCli(executorId, { cwd, repoRoot, ...selectors });
}
