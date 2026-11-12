// dispatch/cli.mjs — dispatch behavior + the thin CLI doors over it (D7, tsk-2uf-1):
// the `decide`/`probe-account`/`probe-session`/`reconcile` subcommands of `node src/runner/dispatch.mjs`
// (`runDispatchCli`). One task runs through `fgos run`, planned work through a Workflow;
// the raw `execute` and `log` subcommands are gone. See `docs/history/dispatch-activation-
// and-handoff-redesign/CONTEXT.md` D7 for the module split.

import path from 'node:path';
import fs from 'node:fs';

class StoreError extends Error {
  constructor(category, message) {
    super(message);
    this.name = 'StoreError';
    this.category = category;
  }
}

import { resolveRepoRoot, resolveMainCheckoutRoot, fgosDirFromRoot } from '../paths.mjs';
import { loadRunnerConfigForDir } from './config.mjs';
import { commandCli } from './provider-capacity.mjs';
import { decideCommand } from './decide.mjs';
import { executeAssignment } from './assignment-runner.mjs';
import { adoptRun } from '../../run-supervisor/client.mjs';
import { runAccountProbe } from './provider-account-probe.mjs';
import { runSessionProbe } from './provider-session-probe.mjs';
import { createCredentialRenewal } from './provider-credential-renewal.mjs';
import { createRoundTerminalControl } from './terminal-slot.mjs';
import { envForSession } from './worker-session.mjs';
import { resolveHerdrBin } from './transport.mjs';
import { buildAssignment, claimAssignmentId } from './assignment.mjs';
import { resolveWriterIdentity } from '../../util/session-identity.mjs';

export { watchWritesOutsideWorkspace, strayWriteWarning } from '../../run-supervisor/stray-writes.mjs';

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
 * Claude asks the human before touching a path outside its working directories, and no human answers a
 * seat. A seat's run directory lives under the store, outside its cwd (its worktree), so claude is told
 * which directories it may use. This is claude's own prompt; the OS-level posture is unchanged.
 *
 * - A claude REPL in a herdr pane is briefed with a pointer to a file in the run directory and writes its
 *   outbox there. Blind inputs are copied to assignmentDir/inputs, beside runs/NN, so it gets only that
 *   directory (when present), the run directory and the parents of settled sibling reports.
 * - A headless claude (cli-spawn) is handed its brief as the prompt and writes only its outbox, so it gets
 *   that one directory (`outboxDir`) and nothing else.
 *
 * Writing there also needs the executor's permission mode (`acceptEdits`); a directory grant alone is refused.
 */
export function withRunDirAccess({ adapter, interactiveMode, command, args, runDir, outboxDir }) {
  if (!Array.isArray(args)) return args;
  if (adapter === 'cli-spawn') {
    if (commandCli(command) !== 'claude' || !outboxDir) return args;
    return withAddDirs(args, [path.resolve(outboxDir)]);
  }
  if (adapter !== 'herdr-spawn' || interactiveMode?.kind !== 'claude' || !runDir) return args;
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
  return withAddDirs(args, directories);
}

// Operator-approved `--add-dir` entries stay after the granted ones.
function withAddDirs(args, directories) {
  const existing = args.indexOf('--add-dir');
  return existing < 0
    ? [...args, '--add-dir', ...directories]
    : [...args.slice(0, existing + 1), ...directories, ...args.slice(existing + 1)];
}


/**
 * Body of `node src/runner/dispatch.mjs <decide|probe-account|reconcile> ...`, called from the
 * barrel's script guard; `fgos dispatch decide|probe-account` reach it with `returnResult`.
 * `resolveWork` is the Work lookup `decide --work` needs, handed in by bin; without it
 * `decide --work` refuses. `executionDoor` is the execution door `probe-session` runs its seat through, handed in by bin
 * for the same reason (Dispatch sits below Execution and never imports it); without it `probe-session` refuses.
 */
export async function runDispatchCli(argv = process.argv.slice(2), { returnResult = false, resolveWork, executionDoor } = {}) {
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
        const decided = await decideCommand({
          executorId,
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
    case 'probe-session': {
      // Diagnostic: one tiny read-only seat of one executor; where its CLI wrote the session, whether it was kept.
      try {
        if (!executorId) throw new StoreError('validation', 'dispatch probe-session requires an executor id: fgos dispatch probe-session <executorId> [--invocation <id>]');
        if (typeof executionDoor !== 'function') throw new StoreError('validation', 'dispatch probe-session needs the execution door from its caller');
        const cwd = path.resolve(flagValue('--cwd') ?? flagValue('--dir') ?? process.cwd());
        const repoRoot = path.resolve(flagValue('--repo-root') ?? resolveMainCheckoutRoot(cwd) ?? resolveRepoRoot(cwd));
        const result = await runSessionProbe({
          cfg: loadRunnerConfigForDir(repoRoot),
          executorId,
          invocationId: flagValue('--invocation') ?? null,
          repoRoot,
          cwd,
          executionDoor,
        });
        // Exit 0 only when the session was kept; the category names why not.
        if (!result.kept) process.exitCode = 1;
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
      const runDir = executorId ?? flagValue('--run-dir');
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
      const msg = `unknown subcommand ${JSON.stringify(subcommand)}. Usage: node src/runner/dispatch.mjs decide <executorId> [--has-live-task-access] | decide --for <purpose> [--needs-soul] [--has-live-task-access] | decide --needs-soul [--has-live-task-access] | reconcile <runDir> | probe-account --provider <provider> --account <accountId> [--executor <id>] [--invocation <id,...>] [--timeout-ms <ms>] | probe-session <executorId> [--invocation <id>]. To run a task: fgos run "<prompt>"; decide --work: fgos dispatch decide --work <workId>\n`;
      if (returnResult) throw new StoreError('validation', msg.trim());
      process.stderr.write(msg);
      process.exitCode = 1;
    }
  }
}
