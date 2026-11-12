import { createGitInspect, gitPortOptions } from '../git/inspect.mjs';
import { resolveHolderLiveness } from '../native/process-identity.mjs';
import { checkGit, gitFloor, fixGitWal, fixGitFetchMapping, fixGitDriverDirectories } from './git-checks.mjs';
import { checkWorkflowCaseBindingSentinel, checkWorkflowCaseBindings, fixWorkflowCaseBindings } from './workflow-case-checks.mjs';
// registrations.mjs — the doctor-check / fix registry (CONTEXT.md D1/D2,
// docs/history/setup-doctor-config-registry/): the one place a module declares
// a doctor check and/or a fix. `checks.mjs` never needs editing again to pick
// up a new entry — it only re-exports `DOCTOR_CHECKS` from here (D1). A new
// module registers by importing `registerCheck`/`registerFix` from this file
// and calling them at its own module-load time, or — for the handful of
// checks fgOS ships with — by being registered directly below.
//
// `check` and `fix` registrations are independent (D2): a module may register
// only a check, only a fix, or both — never a forced pairing. Config is not
// registered here: the standard (core/config-standard) holds every default and
// the schemas (core/config-schema) every shape rule, both read through the
// config door. A check below reads the effective value through the facade only
// when it enforces a rule a schema cannot state; the rows over the config files
// themselves are config-checks.mjs's.
//
// `fgos doctor --fix` (bin/fgos.mjs) runs every registered fix via `runFixes`
// below; `doctor` without `--fix` writes nothing.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { detectRcFiles, hasSourceLine, deadSourceLines, probeShellIntegrationInvocation } from './shell-rc.mjs';
import { listDomainDirs } from '../util/domain-dirs.mjs';
import { refuseSymlink } from '../util/refuse-symlink.mjs';
import { releaseBinaryPath } from '../util/release-binary-path.mjs';
import { RELEASE_TARGETS, releaseTargetForHost } from '../util/release-targets.mjs';
import { hashFile, listLegacyNodeSourceFiles } from '../../scripts/build-rust-distribution.mjs';
import { checkCompiledDomains } from '../../scripts/build-domain-registry.mjs';
import { mainCheckoutHookWired } from './git-hooks.mjs';
import { loadRunnerConfigForDir } from '../runner/dispatch/config.mjs';
import { checkSessionKeepDeclared } from './session-keep-declared.mjs';
import { INSTALL_ROOT, agentShapeProblem, findAgentDuplicates, readAgentDefinition, scanAgentTiers } from '../runner/agent-definitions.mjs';
import { isWithinDir } from '../runner/dispatch/assignment-layout.mjs';
import { ownedSkillNames } from './skill-wrappers.mjs';
import { agentRenderWarnings, listAgents } from '../runner/agent-listing.mjs';
import { claudeCodeHookWired } from './claude-code-hooks.mjs';
import {
  checkClaudeHook,
  installClaudeHook,
  checkCodexHook,
  installCodexHook,
  checkAgyHook,
  installAgyHook,
  checkOmpHook,
  installOmpHook,
  checkPiHook,
  installPiHook,
} from './agent-hooks.mjs';
import { checkExecutorProfileWarnings } from './executor-profile-warnings.mjs';
import { crossMachineNote, mailboxOptIn, refusedConfigName } from './mailbox-limits.mjs';
import { checkMailboxClaudeAccept } from './mailbox-claude-accept.mjs';
import { checkClaudePluginMarketplace } from './agent-wiring.mjs';
import { checkMailboxSyncTimer, fixMailboxSyncTimer } from './mailbox-sync-timer.mjs';
import { checkAgentCliProjectTrusted } from './agent-cli-trust.mjs';
import { declaredActivities, readWorkflowCatalog, withUnreadableDefinitions } from './workflow-catalog-reader.mjs';
import {
  checkExecutorFamilyUnique,
  checkExecutorSkillsInstalled,
  checkTierFallback,
  checkModelPolicyPools,
  checkLlmAccountsShape,
  checkLlmAccountsVsLegacy,
} from './model-pool-checks.mjs';
import { checkBlindStepsUseProvenPools } from './blind-steps-proven-pools.mjs';
import { checkAgyPermissionsConfigured, checkAgySubHomesConfigured } from './agy-permissions.mjs';
import { BUILTIN_POLICY_IDS, validateConfinementPolicyShape, normalizeLegacyConfinement } from '../runner/dispatch/confinement/policies.mjs';
import {
  resolveMachineBackendRegistryPath,
  validateBackendRegistryShape,
  ensureMachineBackendRegistryDefaults,
  loadMachineBackendRegistry,
  defaultConfinementTempRoots,
  credentialScanRoots,
} from '../runner/dispatch/confinement/backend-registry.mjs';
import { runAllConfinementProbes, probePeerRunHidden } from '../runner/dispatch/confinement/probes/harness.mjs';
import { readOwnershipMarker, readAttemptOwnershipMarker, cleanupConfinementResource, canonicalRoot, listKeptCredentialHomes, settleHeldCredentialHomes, CREDENTIAL_KEEP_MAX_ATTEMPTS } from '../runner/dispatch/confinement/cleanup.mjs';

import { MODEL_POLICY_TIERS, validateGeneratedPathsShape, validateRunnerLoopsShape, attributeRunnerConfigError } from '../runner/dispatch/config.mjs';
import { RunnerConfigError } from '../runner/dispatch/runner-config-error.mjs';
import { shippedCatalog } from '../runner/dispatch/shipped-catalog.mjs';
import { checkCatalog } from '../runner/execution/patterns/catalog.mjs';
import { deepEqual } from '../runner/execution/patterns/catalog-entries.mjs';
import { detectRetiredPatternKeys, RESERVED_PATTERN_NAMES, SEAT_BINDING_MARKER_PATH, formatRetiredKeySentence } from '../runner/execution/patterns/retired-keys.mjs';
import { isCommandAvailable, resolveMainCheckoutRoot } from '../runner/paths.mjs';
import { capabilityEntriesOf, hasUsablePrefer } from '../runner/execution/seat-resolver.mjs';
import { detectTrunk } from '../runner/worktree.mjs';
import { listWork } from '../state/store.mjs';
import { driftStatus, unmergedDeliveries } from '../state/drift-status.mjs';
import { postLandDrift } from '../state/postland-drift.mjs';
import { isResolvedStatus } from '../state/frontier.mjs';
import { getDomain, resolveDomainName, effectiveStep, domainSteps, skillForStep } from '../state/domain-registry.mjs';
import { readLocalStatus, classifyRegistryPosture, toolsFromExecutors } from '../state/tool-registry.mjs';
import { resolveCliVersionInfo } from '../cli/version.mjs';
import { firstOnPath, inspectLauncher, writeLauncher } from './project-launcher.mjs';
import { readConfig, readMachineConfig } from '../config/facade.mjs';
import { CONFIG_CHECKS, CONFIG_FIXES, checkConfigOnce, isConfigDoorFailure } from './config-checks.mjs';
import { retiredJsonAdvice } from './runner-config-conversion.mjs';
import { legacyStateKey } from '../runner/dispatch/llm-accounts.mjs';
import { inspectProviderCapacity, defaultProviderCapacityRuntimeDir, providerAccountInventory, credentialStoreOf, credentialSourceForCli } from '../runner/dispatch/provider-capacity.mjs';
import { inspectRetainedCredentialCopies, inspectPendingCopiesOverLimit, sweepInterruptedStagings, credentialWriteBackTarget, inventoryAccount, MAX_PENDING_COPIES } from '../runner/dispatch/provider-credential-renewal.mjs';
import { resolveHerdrBin } from '../runner/dispatch/transport.mjs';
import { createTerminalControl } from '../terminal-control/client.mjs';
import { readCodexTrust, readAgyStore, defaultAgySettingsPath, operatorClaudeStorePath } from '../run-supervisor/trust-store.mjs';
import { resolveFgosBin, refreshGlobalBinCache } from './bin-discovery.mjs';
import { DEFAULT_WORKER_SLOT_CEILING } from '../state/worker-slots.mjs';
import { eventStoreDoctorOf } from './event-store-checks.mjs';
import { fixEventStoreLockDirs } from './event-store-fixes.mjs';
import { foldEvents } from '../state/replay.mjs';
import { discoverProjectPromptTemplates, TemplateResolutionError } from '../runner/dispatch/operation-prompt-templates.mjs';
import { resolveHostBin, invokeHost } from '../util/host-bin.mjs';
import { resolveActiveHostBin } from '../util/host-bin-path.mjs';
import { probeIdentity } from '../util/session-identity.mjs';
import { createSeatBindingClient, resolveSeatBindingHost } from '../seat-binding/client.mjs';
import { checkSeatBindingDryBind } from './seat-binding-checks.mjs';
import { checkRunSupervisorRoute, checkRuntimeSocketDir, fixRuntimeSocketDir, checkRunAttemptsStuck, checkRunSupervisorConfig } from './run-supervisor-checks.mjs';
import { checkIdentityMachineId, checkIdentityMachineKey, checkIdentityProjectId, checkIdentitySharedDirectory, checkIdentitySshKeygen, fixIdentityMachineId, fixIdentityMachineKey } from './identity-checks.mjs';
import { checkTerminalControl, checkTerminalAllocations } from './terminal-control-checks.mjs';
import { checkOmpNativesPresent, ompExecutorsOf } from './omp-natives-checks.mjs';
import { checkLockKernelSemantics, checkLockBorrowVectors, checkLockHolders, fixLockDirs } from './holder-lock-checks.mjs';
export { mainCheckoutHookWired } from './git-hooks.mjs';
export { claudeCodeHookWired } from './claude-code-hooks.mjs';
export { checkAgySubHomesConfigured } from './agy-permissions.mjs';

const MIN_NODE_MAJOR = 18;

// How many distinct dead paths the shell-integration check names before
// falling back to a count. Observed real profiles carry over a hundred.
const DEAD_LINE_SAMPLE_SIZE = 3;

// Live, mutated-in-place arrays (never reassigned) so a registration added
// after this module first evaluates — e.g. from a test, or from another
// module imported later in the same process — is visible through every
// existing import of `DOCTOR_CHECKS`,
// including `checks.mjs`'s own re-export (ESM re-exports are live bindings
// to the same array object, not a snapshot).
export const DOCTOR_CHECKS = [];
export const FIX_REGISTRATIONS = [];

/**
 * The effective value of one config section for the project at `cwd` (project over global over the standard),
 * as ordinary objects: the facade's results have no prototype, which the check code below does not expect. A
 * refused file throws a ConfigDoorError, which `registerCheck` turns into a failed row.
 */
export function effectiveSection(cwd, section) {
  const value = readConfig({ projectRoot: cwd, sections: [section] }).value[section];
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

/** The effective `runner` section of the machine alone (global file, accounts, standard). */
function machineRunner() {
  return JSON.parse(JSON.stringify(readMachineConfig({ sections: ['runner'] }).value.runner ?? {}));
}

/**
 * Register a doctor check (D1/D2). `id` must be unique among registered
 * checks — a duplicate is a programming error (two modules picked the same
 * name), not a runtime condition to degrade gracefully on, so it throws.
 */
export function registerCheck({ id, description, check }) {
  if (typeof id !== 'string' || !id.trim()) {
    throw new Error('registerCheck requires a non-empty id');
  }
  if (DOCTOR_CHECKS.some((entry) => entry.id === id)) {
    throw new Error(`registerCheck: "${id}" is already registered`);
  }
  if (typeof check !== 'function') {
    throw new Error(`registerCheck("${id}") requires a check function`);
  }
  // A check that throws (an unreadable store, a refused clone) fails its own row; it never stops the rest of the run.
  DOCTOR_CHECKS.push({ id, description, check(cwd, run) {
    const failed = error => ({ passed: false, message: error.message });
    try {
      const result = check(cwd, run);
      return result && typeof result.then === 'function' ? result.catch(failed) : result;
    } catch (error) { return failed(error); }
  } });
}

/**
 * One doctor run. Rows that need the same expensive fact (the Work view) ask the run for it: the first row
 * computes it, the rest reuse it, and a failure is remembered too, so a store that cannot be read is tried once.
 * A row called without a run (a test, a one-off) gets a private one and shares nothing.
 */
export function createDoctorRun() {
  const facts = new Map();
  return {
    once(key, compute) {
      if (!facts.has(key)) {
        try { facts.set(key, { value: compute() }); } catch (error) { facts.set(key, { error }); }
      }
      const fact = facts.get(key);
      if (fact.error) throw fact.error;
      return fact.value;
    },
  };
}

/**
 * The Work view a doctor row judges, read through the Event Store facade once per run, or null when this project
 * has no Work store to read (no `.fgos`, or not a Git repository). Any other failure (a refused clone, damaged
 * history) throws and fails the rows that asked.
 */
function doctorWorkView(root, run = createDoctorRun()) {
  return run.once(`work-view:${root}`, () => {
    const fgosDir = path.join(root, '.fgos');
    if (!fs.existsSync(fgosDir)) return null;
    try {
      return listWork(fgosDir);
    } catch (error) {
      if (error.code === 'event-store-no-repository') return null;
      throw error;
    }
  });
}

/**
 * Register a fix (D3, docs/history/doctor-fix-gate-bypass/CONTEXT.md):
 * `fix` is a function `(cwd) => { changed, message }` that repairs whatever
 * this entry's own `check` (if any) reports as failing — idempotent, and
 * scoped only to this entry's own concern, never another entry's. `fix`
 * registration is independent of `check`/`configDefault` (same D2 style
 * those two already follow) — a module may register any subset of the
 * three.
 *
 * `repairs` names the check rows this fix repairs when they do not share its id; a failing row it repairs
 * reports `fgos doctor --fix` as its `fix`. Default: the row with the fix's own id.
 */
export function registerFix({ id, fix, repairs = [id] }) {
  if (typeof id !== 'string' || !id.trim()) {
    throw new Error('registerFix requires a non-empty id');
  }
  if (FIX_REGISTRATIONS.some((entry) => entry.id === id)) {
    throw new Error(`registerFix: "${id}" is already registered`);
  }
  if (typeof fix !== 'function') {
    throw new Error(`registerFix("${id}") requires a fix function`);
  }
  if (!Array.isArray(repairs) || repairs.some((row) => typeof row !== 'string')) {
    throw new Error(`registerFix("${id}") requires repairs to be a list of check ids`);
  }
  FIX_REGISTRATIONS.push({ id, fix, repairs });
}

/**
 * Run every registered fix against `cwd` (`fgos doctor --fix`'s own write
 * path — the one place doctor writes, gated behind the explicit `--fix`
 * flag; without it doctor stays exactly as before). Each fix's own
 * `{changed, message}` is reported per entry, mirroring `DOCTOR_CHECKS`'
 * per-entry `{passed, message}` report shape.
 */
export function runFixes(cwd, fixes = FIX_REGISTRATIONS) {
  return fixes.map(({ id, fix }) => {
    try {
      const { changed, message } = fix(cwd);
      return { id, changed, message };
    } catch (error) { return { id, changed: false, message: error.message }; }
  });
}

const DOCTOR_FIX_COMMAND = 'fgos doctor --fix';

/**
 * The level of one row: a row that says its own `status` keeps it; otherwise a failed row is `fail`, a passing row
 * whose message opens with `warning:` is `warn` (the level convention every row module documents), and any other
 * passing row is `ok`.
 */
function rowStatus({ passed, status, message }) {
  if (status !== undefined) return status;
  if (passed === false) return 'fail';
  return typeof message === 'string' && message.startsWith('warning:') ? 'warn' : 'ok';
}

/**
 * One doctor run as agents and `--pretty` read it: `{ ok, next, fixed?, checks }`. Each row keeps `{ id, description,
 * passed, message, detail? }` and adds `status` (`ok|warn|fail|skip`) and, on a failing row, `fix` (the command that
 * repairs it, or null when only a person can). `ok` is "no row fails"; `next` is the failing rows' fix commands, once
 * each, in registry order. With `fix`, every registered fix runs first, so the rows are judged after the repair.
 * The exit code is not part of this contract (`--strict` maps `ok` to it).
 */
export async function runDoctor(repoRoot, { fix = false, checks = DOCTOR_CHECKS, fixes = FIX_REGISTRATIONS } = {}) {
  const fixed = fix ? runFixes(repoRoot, fixes) : undefined;
  const repairedByDoctor = new Set();
  for (const entry of fixes) for (const rowId of entry.repairs ?? [entry.id]) repairedByDoctor.add(rowId);
  // A check may return its result directly or as a promise (one drives promise-based runner code).
  // Rows of one run share what they read once (the Work view).
  const run = createDoctorRun();
  const rows = [];
  const next = [];
  for (const { id, description, check } of checks) {
    const result = await check(repoRoot, run);
    const status = rowStatus(result);
    const repair = result.fixCommand ?? (status === 'fail' ? (repairedByDoctor.has(id) ? DOCTOR_FIX_COMMAND : null) : undefined);
    if (status === 'fail' && repair && !next.includes(repair)) next.push(repair);
    rows.push({
      id, description, passed: result.passed, status, message: result.message,
      ...(repair !== undefined && { fix: repair }),
      ...(result.detail !== undefined && { detail: result.detail }),
    });
  }
  return { ok: rows.every((row) => row.status !== 'fail'), next, ...(fixed !== undefined && { fixed }), checks: rows };
}

/**
 * The main checkout that owns `dir` — the directory holding the real `.git` —
 * or `null` when `dir` is not inside a git checkout at all.
 *
 * `--show-toplevel` is deliberately not used: inside a linked worktree it
 * returns that worktree's own root, and treating that as the shell
 * integration's home is what made every worktree earn its own `source` line,
 * one dead line left behind per removed worktree. `--git-common-dir` points
 * at the main checkout's `.git` from anywhere in the repo, so its parent is
 * the one location stable enough for a user's rc file to name. Same
 * resolution `scripts/fgos-shell-integration.sh` already uses, and the same
 * common-dir-parent shape as `worktree.mjs`'s `isMainWorktree`. Delegates to
 * `paths.mjs`'s `resolveMainCheckoutRoot` (tsk-5hv: extracted there so
 * `dispatch.mjs`/`scripts/project-agents.mjs` can reuse the identical
 * resolution without a circular import back into this module) — this
 * export's own name/signature stay unchanged for its existing callers.
 */
export function resolveMainCheckout(dir) {
  return resolveMainCheckoutRoot(dir);
}

/**
 * Absolute path to the sourceable shell-integration script, canonicalized to
 * the main checkout, or `null` when no stable location exists for it.
 *
 * Starts from this file's own on-disk location via `import.meta.url` — that
 * is the copy actually being executed, and the only one guaranteed to exist.
 * When that copy sits inside a linked worktree, the equivalent path in the
 * main checkout is returned instead, so a worktree never earns its own rc
 * line and `checkShellIntegrationSourced` stops reporting a working setup as
 * unconfigured.
 *
 * The `existsSync` guard keeps the canonical rewrite honest for a checkout
 * that is not fgOS's own — fgOS installed under another repo's
 * `node_modules/` resolves that repo as its main checkout, which has no
 * `scripts/` of its own; the executing copy's real path is correct there.
 *
 * `null` means the executing copy is not inside a git checkout at all (an
 * unpacked tarball, an npx cache, a bare temp copy). Such a location is
 * ephemeral by nature, so there is no path worth writing into a shell
 * profile that will outlive it.
 */
export function integrationScriptPath() {
  const executingCopy = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../scripts/fgos-shell-integration.sh',
  );
  const mainCheckout = resolveMainCheckout(path.dirname(executingCopy));
  if (mainCheckout === null) {
    return null;
  }
  const canonical = path.join(mainCheckout, 'scripts', 'fgos-shell-integration.sh');
  return fs.existsSync(canonical) ? canonical : executingCopy;
}

// tsk-2ej: not a staleness detector -- `doctor` can only ever report on
// whatever build is actually running it, so it structurally cannot tell
// itself apart from a newer release. What this check gives is the thing
// that friction was missing: the running build's own version/commit made
// legible on demand, the first thing to compare when a verb comes back
// "unknown" on some other machine, without needing to read node_modules
// directly (blocked by this repo's own scout-block hook).
function checkCliVersionVisible() {
  const info = resolveCliVersionInfo();
  if (!info.packageVersion || !Array.isArray(info.verbs) || info.verbs.length === 0) {
    return { passed: false, message: 'fgos version did not resolve a packageVersion/verbs -- src/cli/version.mjs is broken' };
  }
  const commitPart = info.gitCommit ? ` (${info.gitCommit})` : ' (no git commit -- not a git checkout)';
  return { passed: true, message: `fgos ${info.packageVersion}${commitPart} — ${info.verbs.length} verbs` };
}

function checkNodeAndGit(cwd, run) {
  const major = parseInt(process.version.slice(1).split('.')[0], 10);
  if (Number.isNaN(major) || major < MIN_NODE_MAJOR) {
    return { passed: false, message: `node ${process.version} — need >=${MIN_NODE_MAJOR}` };
  }
  let floor;
  try {
    floor = gitFloor(cwd, undefined, run);
  } catch (err) {
    return { passed: false, message: `git not available: ${err.message}` };
  }
  if (!floor?.version) return { passed: false, message: 'git not available: fgos-git found no Git binary' };
  return { passed: true, message: `node ${process.version}, git available` };
}

// tsk-2qc-1 D3: an npm-installed, non-git copy has no `fgos-shell-
// integration.sh` rc line to check for at all -- npm's own global install
// already links a real `fgos` binary onto PATH, no rc sourcing needed. The
// PRE-tsk-2qc-1 behavior silently reported "nothing to check" regardless of
// whether that PATH link (or a dev/project-local bin) actually resolved --
// the fail-open gap D3 exists to close. What actually matters for this
// case is whether SOME tier of `resolveFgosBin` resolves; extracted as its
// own function so it is unit-testable without needing a genuinely
// non-git `import.meta.url` (`integrationScriptPath()` always resolves
// inside this repo's own git checkout when its OWN test suite runs it).
export function describeNonGitShellIntegration(cwd) {
  const resolved = resolveFgosBin(cwd);
  if (resolved) {
    return {
      passed: true,
      message: `not inside a git checkout — no rc sourcing needed; fgos resolved via tier ${resolved.tier} at ${resolved.path}`,
    };
  }
  return {
    passed: false,
    message: 'not inside a git checkout and no fgos bin reachable at any of the 3 tiers (dev-checkout, project-local, global PATH) -- install a release with "fgctl init" (https://github.com/vantt/forgent#install)',
  };
}

// A shell started by an agent harness (Claude Code) hands its tools a snapshot of the
// user's shell functions, and that snapshot can drop underscore-prefixed helpers. The
// probe below reproduces exactly that, so inside such a shell its verdict says nothing
// about the user's own terminal and is reported as information, not a failure.
function insideHarnessShell(env = process.env) {
  return Boolean(env.CLAUDECODE || env.CLAUDE_CODE_SESSION_ID);
}

function checkShellIntegrationSourced(cwd) {
  const scriptPath = integrationScriptPath();
  if (scriptPath === null) {
    return describeNonGitShellIntegration(cwd);
  }
  const rcFiles = detectRcFiles(os.homedir());
  if (rcFiles.length === 0) {
    return { passed: true, message: 'no shell rc file(s) detected — nothing to check' };
  }
  // Reported even when the integration itself is correctly sourced: each dead
  // line makes an interactive shell emit its own `no such file or directory`
  // error on open, which is the failure a user actually sees. Reported per rc
  // file because setup writes to every rc file it detects, so they drift apart.
  const dead = rcFiles.flatMap((rcFile) =>
    deadSourceLines(rcFile).map((target) => ({ rcFile, target })),
  );
  const missing = rcFiles.filter((rcFile) => !hasSourceLine(rcFile, scriptPath));
  const problems = [];
  if (missing.length > 0) {
    problems.push(`not sourced in: ${missing.join(', ')} — run fgos setup`);
  }
  // tsk-2wpi: a source line can be textually present and correct while the
  // function it defines is dead (e.g. a harness snapshot dropping an
  // underscore-prefixed helper the function depends on) -- the checks
  // above can't tell the difference, since neither ever actually invokes
  // the resulting shell function. Only probe once integration is active
  // somewhere (missing.length < rcFiles.length) -- the failure mode lives
  // in the shared script itself, not in which rc file references it, so
  // one probe against scriptPath covers every rc file that sources it.
  let harnessProbeNote = '';
  if (missing.length < rcFiles.length) {
    // FGOS_SHELL_INTEGRATION_PROBE_SCRIPT (test-only seam, mirrors
    // FGOS_CLAUDE_COMMAND/FGOS_GH_COMMAND below): lets a test probe a
    // disposable fixture script instead of this repo's own real, live
    // scripts/fgos-shell-integration.sh -- needed because integrationScriptPath()
    // always resolves to the real file (derived from import.meta.url, not
    // cwd), so a passing-case test would otherwise couple its own
    // assertion to whatever state that real file happens to be in.
    const probeTarget = process.env.FGOS_SHELL_INTEGRATION_PROBE_SCRIPT || scriptPath;
    const { ok, strippedFunctions } = probeShellIntegrationInvocation(probeTarget);
    if (!ok) {
      const helperNote = strippedFunctions.length > 0
        ? ` after stripping ${strippedFunctions.join(', ')} (an underscore-prefixed helper a harness shell-function snapshot can drop)`
        : '';
      const probeMessage = `sourced correctly, but "fgos --help" fails${helperNote} -- the source line being present is not proof the command actually works`;
      if (insideHarnessShell()) {
        harnessProbeNote = ` (informational, running inside an agent harness shell: ${probeMessage}; re-run fgos doctor from your own terminal to confirm)`;
      } else {
        problems.push(probeMessage);
      }
    }
  }
  if (dead.length > 0) {
    const byFile = new Map();
    for (const { rcFile, target } of dead) {
      byFile.set(rcFile, (byFile.get(rcFile) ?? 0) + 1);
    }
    const counts = [...byFile].map(([rcFile, count]) => `${rcFile} (${count})`).join(', ');
    // Only a sample of the paths: these accumulate into the hundreds, and a
    // check message that prints every one of them scrolls the rest of the
    // report off the screen. The counts above are the actionable part.
    const unique = [...new Set(dead.map(({ target }) => target))];
    const sample = unique.slice(0, DEAD_LINE_SAMPLE_SIZE).join(', ');
    const rest = unique.length - DEAD_LINE_SAMPLE_SIZE;
    problems.push(
      `${dead.length} dead fgos source line(s) in ${counts} — each one errors on every shell open; ` +
        `delete them by hand (fgos never edits your shell profile to remove a line). ` +
        `e.g. ${sample}${rest > 0 ? ` (+${rest} more path(s))` : ''}`,
    );
  }
  if (problems.length > 0) {
    return { passed: false, message: problems.join('; ') };
  }
  return { passed: true, message: `sourced in: ${rcFiles.join(', ')}${harnessProbeNote}` };
}

// The schema states each entry's keys and types; the owner's validator keeps the rule that a source scope opens with a
// literal directory. The bounds and cumulative-checker rules of runner.loops are checked by runner-patterns-config.
export function checkRunnerGeneratedPathsConfig(cwd) {
  const generatedPaths = effectiveSection(cwd, 'runner').generatedPaths ?? [];
  try {
    validateGeneratedPathsShape(generatedPaths, 'runner');
  } catch (err) {
    return { passed: false, message: err.message };
  }
  return { passed: true, message: `runner.generatedPaths is valid (${generatedPaths.length} mapping(s))` };
}

export function checkRunnerPatternsConfig(cwd, run) {
  const globalDir = path.join(os.homedir(), '.fgos');
  const display = (file) => {
    if (file?.startsWith('global:')) return path.join(globalDir, file.slice('global:'.length));
    if (file?.startsWith('project:')) return path.join(cwd, '.fgos', file.slice('project:'.length));
    return file ?? '<file>';
  };

  // The legacy JSON format itself is the door row's finding (config-format-legacy-json); this row adds what that row
  // cannot say: which retired pattern key to change and what replaces it, in a YAML or a legacy JSON file alike.
  const findings = checkConfigOnce(cwd, run).findings ?? [];
  const legacy = findings.filter((f) => f.row === 'config-format-legacy-json');
  const legacyScopes = new Set(legacy.map((f) => f.file?.split(':')[0]));
  const problems = [];
  const note = (msg) => { if (!problems.includes(msg)) problems.push(msg); };
  for (const f of legacy) {
    const targetPath = display(f.file);
    try {
      const retired = retiredJsonAdvice(targetPath);
      if (retired.length > 0) {
        const editsText = retired.map((r) => formatRetiredKeySentence(r)).join('; ');
        note(`${targetPath}: config-format-legacy-json: ${editsText}; edit ${targetPath}, then run \`fgos config migrate\``);
      }
    } catch (err) {
      note(err.message.startsWith(targetPath) ? err.message : `${targetPath}: ${err.message}`);
    }
  }
  for (const f of findings) {
    if (f.row === 'config-format-legacy-json' || legacyScopes.has(f.file?.split(':')[0])) continue;
    for (const item of f.path ? detectRetiredPatternKeys(f.path) : []) {
      note(`${display(f.file)}${f.line ? `:${f.line}` : ''}: ${formatRetiredKeySentence(item)}.`);
    }
  }
  if (problems.length > 0) {
    return { passed: false, message: problems.join('; ') };
  }
  if (legacy.length > 0) {
    return { passed: true, message: 'not evaluated: a legacy JSON config file is reported by config-format-legacy-json' };
  }

  let cfg;
  try {
    cfg = readConfig({
      projectRoot: cwd,
      sections: ['runner'],
      origins: ['runner.patterns', 'runner.loops'],
    });
  } catch (err) {
    return { passed: false, message: err.message };
  }

  const runner = cfg?.value?.runner ?? {};
  const effectivePatterns = runner.patterns ?? {};
  const effectiveLoops = runner.loops ?? {};

  try {
    validateRunnerLoopsShape(effectiveLoops, 'runner.loops');
  } catch (err) {
    const attributed = attributeRunnerConfigError(err, cfg?.origins ?? [], cwd);
    return { passed: false, message: attributed ? attributed.message : err.message };
  }

  const shipped = shippedCatalog();
  const origins = cfg?.origins ?? [];
  const { entries, problems: catalogProblems } = checkCatalog({
    shipped: shipped.patterns,
    effective: effectivePatterns,
    origins,
  });
  if (catalogProblems.length > 0) {
    const formatted = catalogProblems.map((p) => {
      const adapter = new RunnerConfigError(p.message, { code: p.code, path: p.path, detail: p.detail });
      const attributed = attributeRunnerConfigError(adapter, origins, cwd);
      return attributed ? attributed.message : p.message;
    });
    return { passed: false, message: formatted.join('; ') };
  }

  const warnings = [];
  const info = [];
  const hints = [];

  // Warn if project defines runner.loops.* but marker runner.patterns.seatBinding.schema is below 2 or absent
  const hasProjectLoops = (cfg?.origins ?? []).some((o) => o.layer === 'project' && o.path.startsWith('runner.loops'));
  if (hasProjectLoops) {
    const markerOrigin = (cfg?.origins ?? []).find((o) => o.path === SEAT_BINDING_MARKER_PATH && o.layer === 'project');
    const markerValue = markerOrigin ? cfg?.value?.runner?.patterns?.seatBinding?.schema : undefined;
    if (!markerOrigin || typeof markerValue !== 'number' || markerValue < 2) {
      warnings.push(`set \`${SEAT_BINDING_MARKER_PATH}\` to 2 so older releases refuse this file`);
    }
  }
  // 1. Warnings: defaults beyond bounds
  for (const [loopName, loopCfg] of Object.entries(effectiveLoops)) {
    const bounds = loopCfg?.bounds;
    if (!bounds || typeof bounds !== 'object') continue;
    for (const [paramName, bound] of Object.entries(bounds)) {
      if (!bound || typeof bound !== 'object') continue;
      const { min, max } = bound;
      for (const [patName, patEntry] of Object.entries(entries)) {
        if (patEntry.loop === loopName && patEntry.defaults) {
          const val = patEntry.defaults[paramName];
          if (typeof val === 'number') {
            if ((min !== undefined && val < min) || (max !== undefined && val > max)) {
              warnings.push(`pattern "${patName}" default ${paramName}=${val} is beyond loop "${loopName}" bounds [${min ?? '-inf'}, ${max ?? '+inf'}] (runs unclamped)`);
            }
          }
        }
      }
      try {
        for (const entry of readWorkflowCatalog(cwd).catalog.values()) {
          const wf = entry.workflow;
          for (const activity of declaredActivities(entry)) {
            const u = activity?.unit;
            if (!u || typeof u !== 'object') continue;
            const patName = typeof u.pattern === 'string' ? u.pattern : null;
            if (!patName) continue;
            const patEntry = entries[patName] ?? shipped.patterns?.[patName];
            const actLoop = patEntry?.loop ?? 'solo';
            if (actLoop === loopName && u.params) {
              const val = u.params[paramName];
              if (typeof val === 'number') {
                if ((min !== undefined && val < min) || (max !== undefined && val > max)) {
                  warnings.push(`workflow "${wf.id}" activity "${activity.id}" default ${paramName}=${val} is beyond loop "${loopName}" bounds [${min ?? '-inf'}, ${max ?? '+inf'}] (runs unclamped)`);
                }
              }
            }
          }
        }
      } catch {
        // workflow loading skipped if not present
      }
    }
  }

  // 2. Warnings: catalog entries or runner.loops in global file
  try {
    const machine = readMachineConfig({ origins: ['runner.patterns', 'runner.loops'] });
    const hasGlobal = (machine.origins ?? []).some(
      (o) => o.layer === 'global' && (
        o.path.startsWith('runner.loops.') ||
        (o.path.startsWith('runner.patterns.') &&
          !RESERVED_PATTERN_NAMES.has(o.path.slice('runner.patterns.'.length)) &&
          o.path !== SEAT_BINDING_MARKER_PATH)
      )
    );
    if (hasGlobal) {
      let olderNote;
      try {
        const fgctl = firstOnPath('fgctl');
        if (!fgctl) {
          olderNote = 'older releases may refuse that file (compatibility with older releases was not established)';
        } else {
          const out = execFileSync('fgctl', ['status', '--json'], {
            cwd,
            encoding: 'utf8',
            timeout: 3000,
            stdio: ['ignore', 'pipe', 'ignore'],
          });
          const parsed = JSON.parse(out);
          const releases = Array.isArray(parsed)
            ? parsed
            : (Array.isArray(parsed?.releases) ? parsed.releases : null);
          if (releases && releases.length > 1) {
            olderNote = 'older releases installed here may refuse that file (compatibility with older releases was not established)';
          } else if (releases && releases.length <= 1) {
            olderNote = 'older releases may refuse that file if installed (compatibility with older releases was not established)';
          } else {
            olderNote = 'older releases may refuse that file (compatibility with older releases was not established)';
          }
        }
      } catch {
        olderNote = 'older releases may refuse that file (compatibility with older releases was not established)';
      }
      warnings.push(`global config declares pattern catalog entries or runner.loops; ${olderNote}`);
    }
  } catch {
    // ignore machine read failures if any
  }

  // 3. Information: capability minCheckers omitting red-team for code/code:*
  const capabilities = runner.capabilities ?? {};
  for (const [capName, capDef] of Object.entries(capabilities)) {
    if (capName === 'code' || capName.startsWith('code:')) {
      if (capDef && typeof capDef === 'object' && Array.isArray(capDef.minCheckers)) {
        if (!capDef.minCheckers.includes('red-team')) {
          info.push(`capability "${capName}" minCheckers explicitly omits red-team`);
        }
      }
    }
  }

  // 4. Hints: two patterns with identical loop, params and invariants
  const patternNames = Object.keys(entries).filter((n) => !RESERVED_PATTERN_NAMES.has(n));
  for (let i = 0; i < patternNames.length; i++) {
    for (let j = i + 1; j < patternNames.length; j++) {
      const a = entries[patternNames[i]];
      const b = entries[patternNames[j]];
      if (
        a.loop === b.loop &&
        deepEqual(a.defaults ?? {}, b.defaults ?? {}) &&
        deepEqual(a.invariants ?? {}, b.invariants ?? {})
      ) {
        hints.push(`patterns "${patternNames[i]}" and "${patternNames[j]}" have identical loop, params, and invariants`);
      }
    }
  }

  const notes = [];
  if (warnings.length > 0) {
    notes.push(`warning: ${warnings.join('; ')}`);
  }
  if (info.length > 0) {
    notes.push(`info: ${info.join('; ')}`);
  }
  if (hints.length > 0) {
    notes.push(`hint: ${hints.join('; ')}`);
  }

  if (warnings.length > 0) {
    return { passed: true, message: notes.join('; ') };
  }
  if (info.length > 0) {
    return { passed: true, message: notes.join('; ') };
  }
  if (hints.length > 0) {
    return { passed: true, message: `runner patterns configuration is valid; ${notes.join('; ')}` };
  }
  return { passed: true, message: 'runner patterns configuration is valid and cumulative' };
}

function allTaskSpecs(cwd) {
  const specs = [];
  const root = path.join(cwd, 'domains');
  for (const domain of listDomainDirs(root)) {
    const taskSpecsDir = path.join(root, domain, 'task-specs');
    if (!fs.existsSync(taskSpecsDir)) continue;
    for (const file of fs.readdirSync(taskSpecsDir)) {
      if (file.endsWith('.md')) {
        specs.push({
          domain,
          specId: file.slice(0, -'.md'.length),
          filePath: path.join(taskSpecsDir, file),
        });
      }
    }
  }
  const coreRoot = path.join(cwd, 'core', 'task-specs');
  if (fs.existsSync(coreRoot)) {
    for (const file of fs.readdirSync(coreRoot)) {
      if (file.endsWith('.md')) {
        specs.push({
          domain: 'core',
          specId: file.slice(0, -'.md'.length),
          filePath: path.join(coreRoot, file),
        });
      }
    }
  }
  return specs;
}

function parseTaskSpecHeaderFields(headerLine) {
  if (!headerLine) return {};
  const parts = headerLine.split('|').map((p) => p.trim());
  const res = {};
  for (const part of parts) {
    const colonIdx = part.indexOf(':');
    if (colonIdx === -1) continue;
    const key = part.slice(0, colonIdx).trim();
    const valStr = part.slice(colonIdx + 1).trim();
    if (key === 'requires-skill' || key === 'agent') {
      if (valStr.startsWith('[') && valStr.endsWith(']')) {
        res[key] = valStr.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean);
      } else if (valStr.includes(',')) {
        res[key] = valStr.split(',').map((s) => s.trim()).filter(Boolean);
      } else if (valStr) {
        res[key] = [valStr];
      } else {
        res[key] = [];
      }
    } else {
      res[key] = valStr;
    }
  }
  return res;
}

// D32 "deterministic, never random": readdirSync's own order is
// filesystem-dependent, not a stable ordering guarantee -- sorted so
// D33's own duplicate-name scan (the caller) reports the same "first
// occurrence wins" file on every machine/run (review finding M2).
function sortedReaddir(dir) {
  return fs.readdirSync(dir).sort((a, b) => a.localeCompare(b));
}

export function allAgentYamlFiles(cwd) {
  const files = [];
  const coreDir = path.join(cwd, 'core', 'agents');
  if (fs.existsSync(coreDir)) {
    for (const f of sortedReaddir(coreDir)) {
      if (f.endsWith('.yaml') || f.endsWith('.yml')) {
        files.push({ source: 'core/agents', filePath: path.join(coreDir, f), fileName: f });
      }
    }
  }
  const domainsDir = path.join(cwd, 'domains');
  for (const domain of listDomainDirs(domainsDir)) {
    const domainAgentsDir = path.join(domainsDir, domain, 'agents');
    if (fs.existsSync(domainAgentsDir)) {
      for (const f of sortedReaddir(domainAgentsDir)) {
        if (f.endsWith('.yaml') || f.endsWith('.yml')) {
          files.push({ source: `domains/${domain}/agents`, filePath: path.join(domainAgentsDir, f), fileName: f });
        }
      }
    }
  }
  const legacyDir = path.join(cwd, 'agents');
  if (fs.existsSync(legacyDir)) {
    for (const f of sortedReaddir(legacyDir)) {
      if (f.endsWith('.yaml') || f.endsWith('.yml')) {
        const fp = path.join(legacyDir, f);
        if (!files.some((item) => item.filePath === fp)) {
          files.push({ source: 'agents', filePath: fp, fileName: f });
        }
      }
    }
  }
  return files;
}

// Reads every agent file once and maps agent name to the skills it declares. A file that cannot be
// read or is not valid YAML is left out of the map and named in `problems`, never skipped silently.
export function readAgentSkills(agentFiles) {
  const agentSkillsMap = new Map();
  const problems = [];
  for (const file of agentFiles) {
    const rel = `${file.source}/${file.fileName}`;
    let text;
    try {
      text = fs.readFileSync(file.filePath, 'utf8');
    } catch (error) {
      problems.push(`${rel}: cannot be read (${error.message})`);
      continue;
    }
    const { error, name: declared, skills } = readAgentDefinition(text, { filename: rel });
    if (error) {
      problems.push(`${rel}: ${error}`);
      continue;
    }
    agentSkillsMap.set(declared ?? file.fileName.replace(/\.yaml$|\.yml$/, ''), new Set(skills));
  }
  return { agentSkillsMap, problems };
}

// Task-spec declares agent/requires-skill, agent-type declares skills. A requires-skill claim
// resolves only when both sides hold: at least one agent-type provides it and the name is a skill
// fgOS owns (a skill source under core/skills or domains/<domain>/skills). Every pinned agent exists.
export function checkAgentClaimsResolve(cwd) {
  const agentFiles = allAgentYamlFiles(cwd);
  const { agentSkillsMap, problems: agentFileProblems } = readAgentSkills(agentFiles);

  const allProvidedSkills = new Set();
  for (const skillsSet of agentSkillsMap.values()) {
    for (const s of skillsSet) allProvidedSkills.add(s);
  }

  const taskSpecs = allTaskSpecs(cwd);
  const ownedSkills = ownedSkillNames(cwd);
  const problems = [...agentFileProblems];

  for (const spec of taskSpecs) {
    let text;
    try {
      text = fs.readFileSync(spec.filePath, 'utf8');
    } catch {
      continue;
    }
    const lines = text.split('\n');
    const headerLine = lines.find((l) => l.startsWith('domain:'));
    const parsed = parseTaskSpecHeaderFields(headerLine);

    if (Array.isArray(parsed.agent)) {
      for (const agentName of parsed.agent) {
        if (agentSkillsMap.size > 0 && !agentSkillsMap.has(agentName)) {
          problems.push(`task-spec "${spec.specId}" names unknown agent "${agentName}"`);
        }
      }
    }

    if (Array.isArray(parsed['requires-skill'])) {
      for (const reqSkill of parsed['requires-skill']) {
        const unprovided = agentSkillsMap.size > 0 && !allProvidedSkills.has(reqSkill);
        const unowned = !ownedSkills.has(reqSkill);
        if (unprovided || unowned) {
          const failed = [unprovided && 'no agent-type provides it', unowned && 'it is not an owned skill'].filter(Boolean).join(' and ');
          problems.push(`task-spec "${spec.specId}" requires skill "${reqSkill}" but ${failed}`);
        }
      }
    }
  }

  if (problems.length > 0) {
    return { passed: false, message: problems.join('; ') };
  }
  return { passed: true, message: 'every task-spec\'s requires-skill/agent eligibility declaration resolves to real agent skills' };
}

// A name is unique within a tier (fgos/agents, domains/*/agents, core/agents); a higher tier shadows a
// lower one by whole-file replacement (RUL13). The customer's own tier is also checked for shape.
// `projectTiersOnly` leaves out every tier read from inside the release (a project without its own
// domains/ or core/agents/ reads the installed ones); npm test judges those with the option off.
export function checkAgentTypeNamesUnique(cwd, { projectTiersOnly = false } = {}) {
  const fullScan = scanAgentTiers({ projectRoot: cwd });
  const scan = projectTiersOnly
    ? fullScan.filter((tier) => !tier.dirs.some((dir) => isWithinDir(INSTALL_ROOT, dir)))
    : fullScan;
  const problems = findAgentDuplicates(scan).map(({ label, name, files }) => `duplicate agent-type name "${name}" in ${label} (${files.join(', ')})`);

  const workspace = scan.find((tier) => tier.tier === 'workspace') ?? { entries: [], ignored: [] };
  const lowerEntries = fullScan.filter((tier) => tier.tier !== 'workspace').flatMap((tier) => tier.entries);
  const customizations = [];
  const notes = [];
  for (const entry of workspace.entries) {
    let text;
    try {
      text = fs.readFileSync(entry.file, 'utf8');
    } catch (error) {
      problems.push(`${entry.rel}: cannot be read (${error.message})`);
      continue;
    }
    const problem = agentShapeProblem(entry.name, text);
    if (problem) problems.push(`${entry.rel}: ${problem}`);
    // Keys the renderer drops are not an error (the file still seats); they are said here because
    // nothing else says it, and a persona that silently loses its voice or boundary is a failure.
    for (const warning of agentRenderWarnings(text)) notes.push(`${entry.rel}: ${warning}`);
    const shadowed = lowerEntries.find((lower) => lower.name === entry.name);
    customizations.push(shadowed ? `${entry.name} (replaces ${shadowed.rel})` : entry.name);
  }
  for (const rel of workspace.ignored) problems.push(`${rel} is ignored: only .yaml files are read`);

  // A project that ships its own domains/ or core/agents/ is read there instead of the install, so the
  // installed definitions it lacks cannot be seated; this is reported, not failed, because a project may
  // choose that.
  for (const hidden of listAgents({ projectRoot: cwd }).masked) {
    notes.push(`installed persona "${hidden.name}" (${hidden.source}) is hidden by ${hidden.hiddenBy}; copy it there or into fgos/agents to seat it`);
  }

  if (problems.length > 0) {
    return { passed: false, message: `agent definitions: ${problems.join('; ')}` };
  }
  const tail = notes.length > 0 ? `; warning: ${notes.join('; ')}` : '';
  return {
    passed: true,
    message: (customizations.length > 0
      ? `agent-type names are unique within each tier; fgos/agents holds ${customizations.join(', ')}`
      : 'agent-type names are unique within each tier (fgos/agents, domains/*/agents, core/agents)') + tail,
  };
}

function checkMainCheckoutHookWired(cwd) {
  if (!fs.existsSync(path.join(resolveMainCheckout(cwd) ?? cwd, '.githooks'))) {
    return { passed: true, message: 'not applicable -- this project ships no .githooks/ directory' };
  }
  if (mainCheckoutHookWired(cwd)) {
    return { passed: true, message: 'core.hooksPath = .githooks — the hook checks the main-checkout kernel lock on every commit here (a fgOS child borrows it through its description)' };
  }
  return { passed: false, message: 'core.hooksPath not wired to .githooks — commits here are NOT guarded against concurrent-writer clobbering (str65) — run fgos setup' };
}

function checkDispatchDecideHookWired(cwd) {
  return checkClaudeHook(cwd);
}

// tsk-1dj (tool-registry-capability port), CONTEXT.md D1: reports the tool
// registry's posture (inactive/degraded/full), never a hard failure — an
// empty or partially-present registry is never itself a problem (the core
// "absent capability = clean skip" contract this whole item ports), so
// `passed` is always `true` here; only the message carries the posture.
// Reports across every registered tool, never a single hardcoded capability
// (e.g. "impact-analysis") — the registry itself never names one.
//
// tsk-in1-1 D1: tools are no longer event-sourced (`view.tools`) — reads
// `runner.executors` from the effective runner section (the config door),
// same as `fgos tool check/query` (bin/fgos.mjs) now does.
function checkToolRegistryConfigured(cwd) {
  const mainCheckout = resolveMainCheckout(cwd);
  if (mainCheckout === null) {
    return { passed: true, message: 'not inside a git checkout — nothing to check' };
  }
  const fgosDir = path.join(mainCheckout, '.fgos');
  const executors = effectiveSection(mainCheckout, 'runner')?.executors;
  const tools = toolsFromExecutors(executors);
  const localStatus = readLocalStatus(fgosDir);
  const { posture, registeredCount, presentCount, missingCount, unknownCount } = classifyRegistryPosture(tools, localStatus);
  if (posture === 'inactive') {
    return { passed: true, message: 'inactive — no tool-capable executors declared (declare one under runner.executors with fgos config set)' };
  }
  if (posture === 'full') {
    return { passed: true, message: `full — ${presentCount}/${registeredCount} registered tool(s) present` };
  }
  // tsk-3oa2: degraded used to report passed:true, the same as full --
  // meaning AGENTS.md's impact-analysis capability gate's own "Degraded"
  // branch (a tool registered but not present, or present but stale) had
  // no doctor signal a person would ever see flagged. A registered tool
  // that is missing or was never checked here is a real gap, not a clean
  // skip the way "nothing registered at all" (inactive) is.
  return {
    passed: false,
    message: `degraded — ${presentCount}/${registeredCount} registered tool(s) present (${missingCount} missing, ${unknownCount} never checked — run fgos tool check)`,
  };
}

registerCheck({
  id: 'node-version-and-git',
  description: `Node >=${MIN_NODE_MAJOR} and git available`,
  check: (cwd, run) => checkNodeAndGit(cwd, run),
});

registerCheck({
  id: 'cli-version-visible',
  description: 'this build\'s own package version/commit/verb-set resolve cleanly via `fgos version`',
  check: () => checkCliVersionVisible(),
});

registerCheck({
  id: 'shell-integration-sourced',
  description: 'shell-integration source line present in detected rc file(s)',
  check: (cwd) => checkShellIntegrationSourced(cwd),
});

// A release install (no git checkout to source a script from) is reached through
// one `fgos` launcher written next to `fgctl`, which runs each project's own
// activated fgos. A source checkout keeps the shell-integration script instead.
export function checkProjectLauncher({ pathEnv = process.env.PATH, sourceCheckout = integrationScriptPath() !== null } = {}) {
  if (sourceCheckout) {
    return { passed: true, message: 'running from a source checkout -- shell integration provides fgos, no launcher needed' };
  }
  const status = inspectLauncher({ pathEnv });
  switch (status.state) {
    case 'ready':
      return { passed: true, message: `fgos on PATH is the project launcher at ${status.file}: each project runs its own activated fgos` };
    case 'stale':
      return { passed: false, message: `the fgos launcher at ${status.file} is out of date -- run fgos doctor --fix` };
    case 'foreign':
      return { passed: false, message: `the fgos found first on PATH (${status.file}) is not the project launcher, so projects may not run their own fgos -- remove it or put the fgctl directory earlier on PATH, then run fgos doctor --fix` };
    case 'missing':
      return { passed: false, message: `no fgos on PATH -- run fgos doctor --fix to write the project launcher at ${status.file}` };
    default:
      return { passed: false, message: 'neither fgos nor fgctl is on PATH -- add the directory fgctl was installed into (default ~/.local/bin) to PATH, then run fgos doctor --fix' };
  }
}

export function fixProjectLauncher({ pathEnv = process.env.PATH } = {}) {
  const status = inspectLauncher({ pathEnv });
  if (status.state === 'ready') return { fixed: false, message: 'launcher already current' };
  if (status.state === 'foreign') {
    return { fixed: false, message: `left ${status.file} alone: it is not the project launcher; remove it or put the fgctl directory earlier on PATH` };
  }
  if (status.state === 'no-fgctl') {
    return { fixed: false, message: 'neither fgos nor fgctl is on PATH, so there is no directory to write the launcher into; add the fgctl directory to PATH first' };
  }
  writeLauncher(status.file);
  return { fixed: true, message: `wrote the project launcher at ${status.file}` };
}

registerCheck({
  id: 'project-fgos-launcher',
  description: 'a release install has a single fgos on PATH that runs each project\'s own activated fgos',
  check: () => checkProjectLauncher(),
});

registerFix({
  id: 'project-fgos-launcher',
  fix: () => fixProjectLauncher(),
});

registerCheck({
  id: 'runner-generated-paths',
  description: 'runner.generatedPaths maps generated sources to render targets with well-formed write-scope entries',
  check: (cwd) => checkRunnerGeneratedPathsConfig(cwd),
});

registerCheck({
  id: 'runner-patterns-config',
  description: 'project and global runner patterns configuration is present, well-formed, and cumulative',
  check: (cwd, run) => checkRunnerPatternsConfig(cwd, run),
});

registerCheck({
  id: 'executor-family-unique',
  description: 'each agent family (providerModel) is served by exactly one executor; its transports are invocations of that executor',
  check: (cwd) => checkExecutorFamilyUnique(cwd),
});

registerCheck({
  id: 'executor-skills-installed',
  description: 'every skill an executor declares in supports.skills exists in the skill directory of each CLI the executor invokes, in the main checkout; fails naming the missing path',
  check: (cwd) => checkExecutorSkillsInstalled(cwd),
});

registerCheck({
  id: 'tier-fallback',
  description: 'every family runner.tierFallback lists for a tier has a modelPolicies cell at that tier and an agent executor; warns otherwise',
  check: (cwd) => checkTierFallback(cwd),
});

registerCheck({
  id: 'model-policy-pools',
  description: 'every pool a runner.modelPolicies cell names (model@pool) is declared in runner.llmAccounts, since a pool with no account is skipped by the walk; warns otherwise',
  check: (cwd) => checkModelPolicyPools(cwd),
});

registerCheck({
  id: 'llm-accounts-shape',
  description: 'runner.llmAccounts is global-only and well formed: pool names without "@" or a family alias, every account with a credentialStore directory per CLI',
  check: (cwd) => checkLlmAccountsShape(cwd),
});

registerCheck({
  id: 'llm-accounts-vs-legacy',
  description: 'when runner.llmAccounts is declared, it carries the same accounts and login directories as runner.providers, which the lease still reads for a pool llmAccounts does not declare; warns otherwise',
  check: (cwd) => checkLlmAccountsVsLegacy(cwd),
});

// The definition tiers of a shipped release cannot change after build, so `npm test` judges them
// (test/setup/packaged-definitions.test.mjs). A doctor row judges only what a project supplies: when the
// project directory is the release source itself, its tiers are the release's and are skipped.
const isReleaseSource = (cwd) => isWithinDir(INSTALL_ROOT, cwd) && isWithinDir(cwd, INSTALL_ROOT);
const releaseSourceNote = (what) => ({ passed: true, message: `this directory is the release source; npm test judges its ${what}` });

registerCheck({
  id: 'agent-claims-resolve',
  description: 'every task-spec a project supplies (domains/*/task-specs, core/task-specs) names real agents and skills (agents/*.yaml); the release\'s own are judged by npm test',
  check: (cwd) => (isReleaseSource(cwd) ? releaseSourceNote('task-spec claims') : checkAgentClaimsResolve(cwd)),
});

// The Work lifecycle reads each domain's compiled.json (scripts/build-domain-registry.mjs) at
// import time. A missing or unreadable file breaks every command that resolves a domain; a stale
// one (YAML edited, not rebuilt) silently serves old steps; a YAML file that cannot be parsed
// cannot be compiled at all. This check names each of those per domain, compiling from the YAML
// with the same function the build uses.
export function checkDomainRegistryCompiled(cwd) {
  const domainsDir = path.join(cwd, 'domains');
  if (!fs.existsSync(domainsDir)) return { passed: true, message: 'no domains/ directory here — nothing to check' };
  const { checked, problems } = checkCompiledDomains(domainsDir);
  if (problems.length > 0) return { passed: false, message: problems.join('; ') };
  return { passed: true, message: `${checked} domain registr${checked === 1 ? 'y' : 'ies'} compiled, readable and in step with their YAML` };
}

registerCheck({
  id: 'domain-registry-compiled',
  description: "every compiled.json of a project's own domains/ (the form the Work lifecycle reads) exists, parses and matches its registry and workflow YAML; the release's own are judged by npm test",
  check: (cwd) => (isReleaseSource(cwd) ? releaseSourceNote('domain registries') : checkDomainRegistryCompiled(cwd)),
});

registerCheck({
  id: 'agent-type-names-unique',
  description: 'agent definition names are unique within each tier a project supplies (fgos/agents, domains/*/agents, core/agents); a higher tier replaces a lower one whole, and fgos/agents files have the shape the renderer needs; tiers read from the release itself are judged by npm test',
  check: (cwd) => checkAgentTypeNamesUnique(cwd, { projectTiersOnly: true }),
});

registerCheck({
  id: 'main-checkout-hook-wired',
  description: 'core.hooksPath wired to .githooks (main-checkout kernel lock check, borrowed through the description, and source-checkout new-root-file guards)',
  check: (cwd) => checkMainCheckoutHookWired(cwd),
});

registerCheck({
  id: 'dispatch-decide-hook-wired',
  description: '.claude/settings.json PreToolUse hooks enforce dispatch.mjs decide on every Agent/Task call, the decision-question template and the main-checkout delete guard on every Bash call',
  check: (cwd) => checkDispatchDecideHookWired(cwd),
});

registerFix({
  id: 'dispatch-decide-hook-wired',
  fix: (cwd) => {
    const res = installClaudeHook(cwd);
    return { fixed: res.wired, message: res.wired ? `wired Claude Code hooks in .claude/settings.json${res.mailbox ? `; ${res.mailbox}` : ''}` : `skipped: ${res.skippedExisting}` };
  },
});

registerCheck({
  id: 'codex-hook-wired',
  description: '.codex/hooks.json PreToolUse hooks enforce dispatch.mjs decide, the decision-question template and the main-checkout delete guard',
  check: (cwd) => checkCodexHook(cwd),
});

registerFix({
  id: 'codex-hook-wired',
  fix: (cwd) => {
    const res = installCodexHook(cwd);
    return { fixed: res.wired, message: res.wired ? `wired Codex CLI hooks in .codex/hooks.json${res.mailbox ? `; ${res.mailbox}` : ''}` : `skipped: ${res.skippedExisting}` };
  },
});

registerCheck({
  id: 'agy-hook-wired',
  description: '.agents/hooks.json PreToolUse hooks enforce dispatch.mjs decide, the decision-question template and the main-checkout delete guard',
  check: (cwd) => checkAgyHook(cwd),
});

registerFix({
  id: 'agy-hook-wired',
  fix: (cwd) => {
    const res = installAgyHook(cwd);
    return { fixed: res.wired, message: res.wired ? 'wired AGY hooks in .agents/hooks.json' : `skipped: ${res.skippedExisting}` };
  },
});

registerCheck({
  id: 'omp-hook-wired',
  description: '.omp/extensions/fgos-hooks.ts in-process extension enforces dispatch.mjs decide, the decision-question template and the main-checkout delete guard',
  check: (cwd) => checkOmpHook(cwd),
});

registerFix({
  id: 'omp-hook-wired',
  fix: (cwd) => {
    const res = installOmpHook(cwd);
    return { fixed: res.wired, message: res.wired ? `wired OMP extension hook in .omp/extensions/fgos-hooks.ts${res.mailbox ? `; ${res.mailbox}` : ''}` : `skipped: ${res.skippedExisting}` };
  },
});

registerCheck({
  id: 'pi-hook-wired',
  description: '.pi/extensions/fgos-hooks.ts in-process extension enforces dispatch.mjs decide, the decision-question template and the main-checkout delete guard',
  check: (cwd) => checkPiHook(cwd),
});

registerFix({
  id: 'pi-hook-wired',
  fix: (cwd) => {
    const res = installPiHook(cwd);
    return { fixed: res.wired, message: res.wired ? `wired Pi extension hook in .pi/extensions/fgos-hooks.ts${res.mailbox ? `; ${res.mailbox}` : ''}` : `skipped: ${res.skippedExisting}` };
  },
});

registerCheck({
  id: 'tool-registry-configured',
  description: 'tool registry posture — inactive/degraded/full',
  check: (cwd) => checkToolRegistryConfigured(cwd),
});

registerCheck({
  id: 'agy-permissions-configured',
  description: 'when agy is on PATH, the person\'s own agy settings.json lets headless agy run commands under a deny list; report only, fgOS never widens it (fgos wire-agents shows the edit)',
  check: () => checkAgyPermissionsConfigured(),
});

registerCheck({
  id: 'agy-sub-homes-configured',
  description: 'agy sub-HOMEs referenced in executor configs have settings.json configured with toolPermission: always-proceed',
  // The merged config (project + global): the credential homes of the declared gemini accounts live in
  // the global one, and a confined invocation runs as one of those accounts.
  check: (cwd) => {
    let config = null;
    try { config = { runner: loadRunnerConfigForDir(cwd) }; } catch { /* fall back to the project file */ }
    return checkAgySubHomesConfigured(cwd, { config });
  },
});

let cachedBwrapResult = null;

export function checkBwrapAvailable(binary = 'bwrap') {
  if (binary === 'bwrap' && cachedBwrapResult) {
    return cachedBwrapResult;
  }
  let res;
  try {
    execFileSync(binary, ['--ro-bind', '/', '/', '--', 'true'], { stdio: 'ignore' });
    res = {
      passed: true,
      message: `${binary} is available on PATH and smoke test (bwrap --ro-bind / / -- true) passed`,
    };
  } catch (err) {
    res = {
      passed: false,
      message: `${binary} is unavailable or failed smoke test: ${err.message}`,
    };
  }
  if (binary === 'bwrap') {
    cachedBwrapResult = res;
  }
  return res;
}

// `fgctl init` shells out to the system `curl` when it downloads a release
// (no source given, FGCTL_VERSION, or a URL source). A
// machine that only ever installs from a local path never needs it, so a
// missing curl is a warning, not a failure.
export function checkCurlAvailable(binary = 'curl') {
  try {
    execFileSync(binary, ['--version'], { stdio: 'ignore' });
    return { passed: true, message: `${binary} is available on PATH` };
  } catch (err) {
    return {
      passed: true,
      message: `warning: ${binary} is not usable on PATH (${err.code ?? err.message}); fgctl init cannot download a release -- install curl or pass a local --from path`,
    };
  }
}

registerCheck({
  id: 'curl-available',
  description: 'curl resolves on PATH (fgctl init downloads releases through it); a missing curl only blocks the download paths',
  check: () => checkCurlAvailable(),
});

registerCheck({
  id: 'bwrap-available',
  description: 'bwrap binary resolves on PATH and minimal smoke test (bwrap --ro-bind / / -- true) exits 0',
  check: () => checkBwrapAvailable(),
});

// tsk-5m7 (docs/history/tsk-3bn-merge-conductor-harness-v2/): a real
// actionable problem, same class as the hook/config checks above — a root
// branch that's drifted ahead of its target with nothing having synced it
// is exactly the failure mode tsk-3bn's own origin incident reproduced.
// `passed: false` (not just an informational message) so it surfaces the
// same way a stale-config or unwired-hook check does.
// tsk-4qu: a SECOND drift class this check used to stay silent about. A leaf
// always merges into `fgw/<root>` (graph-harness.mjs's mergeTier reads
// `item.parent` alone, never the root's status), so a leaf approved after its
// root already reached delivered/retrospective/cleanup/done lands its work on
// a branch nothing will carry forward: driftStatus deliberately reports
// `needsSync: false` for a resolved root (drift-status.mjs:93), which keeps it
// out of mergeReadiness's `blockedOnSync` bucket, which is the only thing
// `fgos merge next` auto-syncs (bin/fgos.mjs's merge-next branch). Observed
// live twice before anyone noticed — tsk-4ns onto fgw/tsk-5wz, and tsk-53n
// onto fgw/tsk-1o7 — with `fgos merge list` reporting every bucket empty
// while real delivered work sat outside main.
//
// `needsSync` is deliberately NOT widened to cover this: `merge next` acts on
// it by running a real `sync-root` git mutation unattended, and auto-merging
// the branch of an item that is already closed out is a behavior change
// nobody asked for on the riskiest path here. driftStatus already computes
// the honest `aheadOfTarget` for these roots, so surfacing them is a filter
// change, not new measurement.
//
// `wontfix` is excluded on purpose: an abandoned item's branch is SUPPOSED to
// sit outside its target forever, so reporting it would be pure noise (a
// repo-wide scan at the time of writing found 4 such branches, all
// legitimate). `isResolvedStatus` alone cannot express this — it folds
// `wontfix` in with the completed statuses by design — so the completed set
// is spelled out here rather than widening frontier.mjs's exported surface
// for one caller.
const COMPLETED_ROOT_STATUSES = new Set(['delivered', 'retrospective', 'cleanup', 'done']);

function checkRootDrift(cwd, run) {
  const mainCheckout = resolveMainCheckout(cwd);
  if (mainCheckout === null) {
    return { passed: true, message: 'not inside a git checkout — nothing to check' };
  }
  const view = doctorWorkView(mainCheckout, run) ?? foldEvents([]);
  const drift = driftStatus(mainCheckout, view, { trunk: detectTrunk(mainCheckout) });

  const describe = ([id, status]) =>
    `${id} (${status.branch} is ${status.aheadOfTarget} commit(s) ahead of ${status.target})`;

  const needsSync = [];
  const strandedAfterClose = [];
  for (const entry of Object.entries(drift)) {
    const [id, status] = entry;
    // tsk-1l9 follow-up: `aheadOfTarget` answers "how many commits", not "is
    // anything stranded". A root that only merged its target back into itself
    // is many commits ahead carrying nothing, and a branch whose commits all
    // landed by another route is a stale ref. Both were reported here as
    // drift needing a sync, forever, with no sync able to clear them --
    // fgw/tsk-4n7 and fgw/tsk-19y are exactly that shape today. Skipping them
    // is a REPORTING change only: `needsSync` itself is untouched, so `fgos
    // merge next`'s auto-sync path behaves exactly as before.
    if (status.carriesContent === false) continue;
    if (status.needsSync) {
      needsSync.push(entry);
    } else if (status.aheadOfTarget > 0 && COMPLETED_ROOT_STATUSES.has(view.work[id]?.status)) {
      strandedAfterClose.push(entry);
    }
  }

  if (needsSync.length === 0 && strandedAfterClose.length === 0) {
    return { passed: true, message: 'no root branch is drifted ahead of its target' };
  }

  const parts = [];
  if (needsSync.length > 0) {
    parts.push(`drifted root branch(es) need syncing: ${needsSync.map(describe).join(', ')}`);
  }
  if (strandedAfterClose.length > 0) {
    parts.push(
      'root branch(es) closed out with work still outside their target — nothing will sync these '
        + `automatically: ${strandedAfterClose.map(describe).join(', ')}`,
    );
  }
  return {
    passed: false,
    message: `${parts.join('; ')} — run fgos sync-root <root-id>`,
  };
}

function checkLeafNotifyDrift(cwd, run) {
  const mainCheckout = resolveMainCheckout(cwd);
  if (mainCheckout === null) {
    return { passed: true, message: 'not inside a git checkout — nothing to check' };
  }
  const view = doctorWorkView(mainCheckout, run) ?? foldEvents([]);
  const drift = postLandDrift(mainCheckout, view, { trunk: detectTrunk(mainCheckout) });
  const entries = Object.entries(drift);
  if (entries.length === 0) {
    return { passed: true, message: 'no live session branch has post-land drift against its target' };
  }

  const describe = ([id, info]) =>
    `${id} (${info.branch} overlaps ${info.shared.join(', ')} with ${info.target})`;

  return {
    passed: false,
    message: `live session branch(es) have post-land drift against their target: ${entries.map(describe).join(', ')}`,
  };
}

// tsk-6ax: tsk-5wz declared the coding domain's risk/kind vocabulary
// (DOMAINS.coding.classification) and enforced it at the write door
// (validateWorkShape's touchedFields grandfathering), but that only blocks
// NEW writes — 68 items already on disk kept a pre-vocabulary risk value
// (low/medium/high), silently degrading decompose.mjs's heavy-risk gate and
// priority-formula.mjs's risk discount. This check makes that class of
// drift visible to `fgos doctor` going forward, same as root-drift above.
// Scoped to OPEN items only (`!isResolvedStatus`, the one shared open/
// closed definition frontier.mjs already exports) — a resolved item's
// stale classification no longer feeds any live gate or formula, so
// flagging it here would just be noise.
function checkWorkClassificationVocabulary(cwd, run) {
  const mainCheckout = resolveMainCheckout(cwd);
  if (mainCheckout === null) {
    return { passed: true, message: 'not inside a git checkout — nothing to check' };
  }
  const view = doctorWorkView(mainCheckout, run) ?? foldEvents([]);
  const violations = [];
  for (const item of Object.values(view.work)) {
    if (isResolvedStatus(item)) continue;
    const classification = getDomain(item.domain).classification;
    if (!classification) continue;
    if (classification.kind && !classification.kind.includes(item.kind)) {
      violations.push(`${item.id} (kind: "${item.kind}")`);
    }
    if (classification.risk && !classification.risk.includes(item.risk)) {
      violations.push(`${item.id} (risk: "${item.risk}")`);
    }
  }
  if (violations.length === 0) {
    return { passed: true, message: "every open item's risk/kind matches its domain's classification vocabulary" };
  }
  return {
    passed: false,
    message: `${violations.length} open item(s) outside their domain's classification vocabulary: ${violations.join(', ')} — run fgos edit <id> --risk/--kind <value>`,
  };
}

registerCheck({
  id: 'work-classification-vocabulary',
  description: "every open item's risk/kind matches its domain's declared classification vocabulary",
  check: (cwd, run) => checkWorkClassificationVocabulary(cwd, run),
});

// tsk-64h: the step-axis sibling of the risk/kind check above, and the
// same class of drift — a domain may retire a step (coding dropped
// `clarify` outright, tsk-qod D1/D2) while items still sit on it. Unlike
// risk/kind, there is no write door to grandfather against: `workflowStep` is
// not in `EDITABLE_FIELDS` (store.mjs) and only `moveStep` may change it, so
// a stranded item cannot be corrected by an edit at all — it has to be
// drained forward through a registered transition or migrated. That makes
// the drift quieter, not rarer.
//
// `effectiveStep`, not a bare `item.workflowStep`, so the lazy default
// (an item that never had a step written) reads as the step every
// other consumer already treats it as, instead of being flagged as
// out-of-vocabulary for being absent. OPEN items only (`!isResolvedStatus`,
// the one shared open/closed definition), same reasoning as the check
// above: a resolved item's step no longer routes anything.
function checkWorkStepVocabulary(cwd, run) {
  const mainCheckout = resolveMainCheckout(cwd);
  if (mainCheckout === null) {
    return { passed: true, message: 'not inside a git checkout — nothing to check' };
  }
  const view = doctorWorkView(mainCheckout, run) ?? foldEvents([]);
  const violations = [];
  for (const item of Object.values(view.work)) {
    if (isResolvedStatus(item)) continue;
    const domainName = resolveDomainName(item.domain, { onUnrecognized: () => {} });
    const domain = getDomain(domainName);
    const step = effectiveStep(item, domain);
    if (!domainSteps(domain, item.kind).includes(step)) {
      violations.push(`${item.id} (step: "${step}", domain: "${domainName}")`);
    }
  }
  if (violations.length === 0) {
    return { passed: true, message: 'every open item sits at a step still registered by its domain' };
  }
  return {
    passed: false,
    message: `${violations.length} open item(s) at a step their domain no longer registers: ${violations.join(', ')} — no verb can relabel a live item's step; drain each one forward through a registered transition or migrate it`,
  };
}

registerCheck({
  id: 'work-step-vocabulary',
  description: "every open item sits at a step its own domain's Workflow still registers — no item stranded on a retired step",
  check: (cwd, run) => checkWorkStepVocabulary(cwd, run),
});

// Events acknowledged on one machine whose precondition a concurrent event from another machine made false are
// recorded as conflicts and never applied. Nothing resolves them yet, so this row is how a person finds out; it
// warns and never fails, because a recorded conflict is a finished fold and not a broken store.
function checkWorkRecordedConflicts(cwd, run) {
  const mainCheckout = resolveMainCheckout(cwd);
  if (mainCheckout === null) {
    return { passed: true, message: 'not inside a git checkout — nothing to check' };
  }
  const conflicts = (doctorWorkView(mainCheckout, run) ?? foldEvents([])).conflicts ?? [];
  if (conflicts.length === 0) return { passed: true, message: 'no recorded cross-machine conflicts in the Work view' };
  const ids = [...new Set(conflicts.map((conflict) => conflict.id))].sort();
  return {
    passed: true,
    message: `warning: ${conflicts.length} recorded cross-machine conflict(s) on ${ids.length} item(s): ${ids.join(', ')} — each is an acknowledged change that another machine's concurrent change kept from applying; \`fgos show <id>\` lists them`,
  };
}

registerCheck({
  id: 'work-recorded-conflicts',
  description: 'the Work view holds no recorded cross-machine conflicts: acknowledged changes a concurrent change from another machine kept from applying (warns, never fails)',
  check: (cwd, run) => checkWorkRecordedConflicts(cwd, run),
});


registerCheck({
  id: 'root-drift',
  description: 'every fgw/<root> branch is in sync with its real target — no unsynced drift left over from a leaf merge',
  check: (cwd, run) => checkRootDrift(cwd, run),
});

registerCheck({
  id: 'leaf-notify-drift',
  description: 'every live session branch has no post-land drift against its target',
  check: (cwd, run) => checkLeafNotifyDrift(cwd, run),
});

// tsk-1l9: the LEAF-inclusive sibling of root-drift above. `root-drift` only
// walks items that some other item calls `parent`, so an ordinary leaf marked
// handed-over with its branch still off trunk is invisible to it — and
// `delivered` is reachable through a bare `fgos move`, which merges nothing
// and demands no proof that anything merged. Nothing else closes the gap:
// `fgos stale`'s post-delivery bucket waits a three-day TTL and then reports
// "forgotten", never "unmerged". It happened three times before this check
// existed — tsk-4b2, then tsk-64h and tsk-2t5 together — each time losing
// real, tested, reviewed work outside main until someone read the graph by
// hand.
//
// Mechanical, no judgment: `git merge-base --is-ancestor fgw/<id> <trunk>`,
// then a patch-id comparison to separate "this ref was never merged" from
// "this work is missing". An item with no local branch is skipped rather than
// flagged, since the branch is often cleaned up after a genuine merge; so is
// a branch whose every commit already has a patch-equivalent on trunk, which
// carried its content in by some other route and is only a stale ref.
function checkDeliveredNotOnTrunk(cwd, run) {
  const mainCheckout = resolveMainCheckout(cwd);
  if (mainCheckout === null) {
    return { passed: true, message: 'not inside a git checkout — nothing to check' };
  }
  const view = doctorWorkView(mainCheckout, run) ?? foldEvents([]);
  const stranded = unmergedDeliveries(mainCheckout, view, { trunk: detectTrunk(mainCheckout) });
  const entries = Object.entries(stranded);
  if (entries.length === 0) {
    return { passed: true, message: "every handed-over item's content is on the trunk" };
  }

  // Two causes, two fixes — see unmergedDeliveries' own comment. Reported
  // separately so the reader is not sent to re-merge a leaf that already
  // merged correctly into a root that simply has not synced yet.
  const neverMerged = entries.filter(([, s]) => s.landedOn === null);
  const awaitingRootSync = entries.filter(([, s]) => s.landedOn !== null);
  const parts = [];
  if (neverMerged.length > 0) {
    parts.push(
      `${neverMerged.length} item(s) marked handed-over whose branch merged nowhere: `
        + `${neverMerged.map(([id, s]) => `${id} (${s.status}, ${s.branch}, ${s.unmatched} commit(s) not on trunk by patch-id)`).join(', ')}`
        + ' — land the content through a new item, never by re-driving the closed item\'s status backward',
    );
  }
  if (awaitingRootSync.length > 0) {
    parts.push(
      `${awaitingRootSync.length} item(s) landed on a root branch that has not reached the trunk: `
        + `${awaitingRootSync.map(([id, s]) => `${id} (${s.status}, on ${s.landedOn})`).join(', ')}`
        + ' — run fgos sync-root on the root, not on these',
    );
  }
  return { passed: false, message: parts.join('; ') };
}

registerCheck({
  id: 'delivered-not-on-trunk',
  description: "every item whose status says its work was handed over has its fgw/<id> branch reachable from the trunk",
  check: (cwd, run) => checkDeliveredNotOnTrunk(cwd, run),
});

function checkProviderCapacityState() {
  let report;
  try {
    report = inspectProviderCapacity({ runnerConfig: machineRunner() });
  } catch (err) {
    return { passed: false, message: `provider-capacity state unreadable: ${err.message}` };
  }
  const providers = Object.values(report.providers || {});
  const accounts = providers.flatMap((provider) => Object.values(provider.accounts || {}));
  if (!accounts.length) {
    return { passed: true, message: 'inactive — no global runner.providers.*.accounts inventory configured' };
  }
  const quarantined = accounts.filter((account) => account.quarantine);
  if (!quarantined.length) {
    return { passed: true, message: `provider-capacity healthy — ${accounts.length} account(s), no quarantine` };
  }
  // C2a: inspectProviderCapacity's account shape names the field
  // `accountId`, not `id` (always undefined here before this fix), and a
  // quarantine record's own field is `kind` ('temporary' | 'manual-clear'
  // | 'manual-clear' evidence), never a `manualClear` boolean.
  const summary = quarantined
    .map((account) => `${account.accountId}:${account.quarantine.reasonCode || 'quarantined'}${account.quarantine.kind === 'manual-clear' ? ':manual-clear' : ''}${account.quarantine.until ? `:until=${account.quarantine.until}` : ''}`)
    .join(', ');
  return {
    passed: false,
    message: `provider-capacity quarantine present (${summary}) — inspect with "fgos dispatch inspect --provider-capacity"; clear manually with "fgos dispatch reconcile provider-capacity clear-quarantine" after the operator fix`,
  };
}

registerCheck({
  id: 'provider-capacity-state',
  description: 'provider-capacity account leases/quarantine state is reportable; doctor never auto-clears quarantine',
  check: () => checkProviderCapacityState(),
});

// Holder-lock (docs/platform/holder-lock/spec.md): the kernel-lock guarantee
// of both lock directories (with the state root and the fixed kill wait it
// prints), the borrow vectors, and who holds each lock (with the hot records
// of the state store). Bodies live in holder-lock-checks.mjs. The
// `lock-dirs` fix creates the two lock directories.
registerCheck({
  id: 'lock-kernel-semantics',
  description: 'the holder-lock driver gives kernel lock exclusion on <fgosDir>/locks and <lockRoot>, proven by a two-process probe on each mount',
  check: (cwd) => checkLockKernelSemantics(cwd),
});
registerCheck({
  id: 'lock-borrow-vectors',
  description: 'a lock description borrowed by a git child never leaks to a background process (fgos internal lock-borrow-vectors)',
  check: (cwd) => checkLockBorrowVectors(cwd),
});
registerCheck({
  id: 'lock-holders',
  description: 'read-only pointer: foreign lock holders, predecessor domains still running and hot records that need a person are read by fgos lock-status',
  check: () => checkLockHolders(),
});
registerFix({ id: 'lock-dirs', fix: (cwd) => fixLockDirs(cwd) });

// Run supervisor (docs/platform/run-supervisor/spec.md): the host routes with the containment driver agents
// run in, the runtime socket directory, attempts nobody holds (and the units awaiting resume) and the
// gate's kill grace with the cancel wait.
// `dispatch.gateKillGraceMs` and `dispatch.cancelWaitMs` take their values from the dispatch section of the standard and are never written by setup.
registerCheck({
  id: 'run-supervisor-route',
  description: 'the host binary serves supervise, gate, adopt and attempt-step at protocol 1 and names the containment driver agents run in and its level (kernel or best-effort)',
  check: (cwd) => checkRunSupervisorRoute(cwd),
});
registerCheck({
  id: 'runtime-socket-dir',
  description: 'the runtime socket directory exists, is owned by this user and is 0700',
  check: () => checkRuntimeSocketDir(),
});
registerCheck({
  id: 'run-attempts-stuck',
  description: 'read-only pointer: attempts with no closed.json and no lock holder, an attempt whose release was removed named with what to restore; the next fgos run adopts them, or run fgos dispatch recover (a warning, never a failure)',
  check: (cwd) => checkRunAttemptsStuck(cwd),
});
registerCheck({
  id: 'run-supervisor-config',
  description: 'dispatch.gateKillGraceMs and dispatch.cancelWaitMs read through the config door (each at least 1000 ms) and the cancel wait is not shorter than the grace',
  check: (cwd) => checkRunSupervisorConfig(cwd),
});
registerFix({ id: 'runtime-socket-dir', fix: () => fixRuntimeSocketDir() });

// The curated capability slots. The standard (core/config-standard/runner.yaml) holds the same entries and is
// what a run reads; this list stays as the reference the doctrine-table tests and the plan lint's registered
// set pin against. Deliberately no `prefer`/`aliases`/`overrides`: naming which executor serves a purpose is a
// dispatch-mechanism decision (tsk-5tm-3 D5).
// Capabilities the shipped Workflow units
// name. Without a `runner.capabilities` entry bind() has no candidate pool for
// the unit and refuses it, so a fresh project could not run these Workflows.
// Description-only on purpose (no `prefer`): which executors serve a
// capability is that project's own taste.
function workflowCapabilitySlots(verbsByDomain) {
  const slots = {};
  for (const [domain, verbs] of Object.entries(verbsByDomain)) {
    for (const verb of verbs) {
      slots[`${domain}:${verb}`] = {
        description: `Workflow unit capability "${domain}:${verb}" -- declare a "prefer" pool to choose which executors serve it.`,
      };
    }
  }
  return slots;
}

export const DEFAULT_CAPABILITY_SLOTS = Object.freeze({
  advise: {
    description:
      'Async product-decision consult -- value comes from disagreement, never changes state, one question/one answer (D2, docs/history/dispatch-activation-and-handoff-redesign/CONTEXT.md)',
    // Interim posture: P06 must first wire a production backend binding.
    // Required here would otherwise universally refuse group-thinking.
    confinement: { mode: 'unconfined' },
    serves: { outputKind: 'decision', mutates: false },
  },
  execute: {
    description:
      'Compliance-driven work -- value comes from following the plan, changes files, must pass verify (D2, docs/history/dispatch-activation-and-handoff-redesign/CONTEXT.md)',
    serves: { outputKind: 'change', mutates: true },
  },
  // I19 (core/skills/_shared/capability-matching.md, capability-catalog.md):
  // generic, domain-neutral independent review -- docs/design/spec/config,
  // never code (that stays `code:review`). No `prefer`/`overrides` either,
  // same curated-default-never-pins reasoning as every other slot here.
  review: {
    description:
      'Independent read-only review of a non-code artifact (docs, design, spec, config) before merge/decision -- distinct from code:review (I19, core/skills/_shared/capability-catalog.md).',
    confinement: { mode: 'unconfined' },
    serves: { outputKind: 'finding', mutates: false },
  },
  // The documentation counterpart of code:implement: the capability `fgos run --capability docs:write`
  // and the fgos-run skill name for writing docs. Same curated-default-never-pins reasoning.
  'docs:write': {
    description:
      'Canonical documentation authoring capability -- write or update documents (README, specs, guides) in the working tree; declare a "prefer" pool to choose which executors serve it.',
    serves: { outputKind: 'change', domain: 'docs', mutates: true },
  },
  'code:implement': {
    description:
      'Canonical coding implementation capability -- compliance-driven coding execution before implementation (D1/D2, docs/history/capability-aware-dispatch-activation/CONTEXT.md)',
    serves: { outputKind: 'change', domain: 'code', mutates: true },
  },
  // P2-runtime (docs/history/agent-coordination-foundation/plan.md):
  // extended by observed frequency, in this priority order. Deliberately
  // no `prefer`/`overrides` here either, same reasoning as `code:implement`
  // above -- a curated default never pins which executor serves it.
  'code:review': {
    description:
      'Canonical coding review capability -- independent review of a coding implementation unit before merge (P2-runtime, docs/history/agent-coordination-foundation/plan.md).',
    confinement: { mode: 'unconfined' },
    serves: { outputKind: 'finding', domain: 'code', mutates: false },
  },
  'code:test': {
    description:
      'Canonical coding test capability -- author or run tests for a coding implementation unit (P2-runtime, docs/history/agent-coordination-foundation/plan.md).',
    serves: { outputKind: 'verification', domain: 'code' },
  },
  'code:debug': {
    description:
      'Canonical coding debug capability -- root-cause investigation of a coding defect (P2-runtime, docs/history/agent-coordination-foundation/plan.md).',
    confinement: { mode: 'unconfined' },
    serves: { outputKind: 'finding', domain: 'code' },
  },
  'code:refactor': {
    description:
      'Canonical coding refactor capability -- behavior-preserving structural change to existing code (P2-runtime, docs/history/agent-coordination-foundation/plan.md).',
    serves: { outputKind: 'change', domain: 'code', mutates: true, behaviorPreserving: true },
  },
  ...workflowCapabilitySlots({
    marketing: ['research', 'write', 'publish'],
    architecture: ['frame', 'shape', 'critique', 'synthesize', 'explain'],
    business: ['frame', 'perspectives', 'critique', 'synthesize', 'plan'],
    delphi: ['propose', 'synthesize'],
    'group-cognition': ['explore', 'critique', 'synthesize'],
    'nominal-group': ['generate', 'share', 'vote', 'rank'],
    coding: ['discover', 'explore', 'plan', 'validate', 'implement'],
  }),
});

// The record's verdict as the host's `fgos mailbox status --json` reports it: the record's
// rules (its directory checks, its snapshot version and caps) stay in Rust, and status
// reads without the lock and creates nothing. Run from the main checkout without
// CLAUDE_PROJECT_DIR, which the verbs would otherwise read as the project. `null` with a
// reason when no host can answer (none resolved, or a release without `mailbox status`).
function mailboxRecordVerdict(cwd) {
  const hostBin = resolveHostBin(cwd);
  if (!hostBin) return { data: null, why: 'no host binary (FGOS_HOST_BIN unset and no active installation manifest)' };
  const { CLAUDE_PROJECT_DIR: _projectDir, ...env } = process.env;
  let stdout;
  try {
    stdout = execFileSync(hostBin, ['mailbox', 'status', '--json'], {
      cwd: resolveMainCheckoutRoot(cwd) ?? cwd, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 10000,
    });
  } catch (err) {
    // Exit 1 still prints the envelope when the record failed; anything else names why.
    stdout = err.stdout ? String(err.stdout) : '';
    if (!stdout.trim()) return { data: null, why: (err.stderr ? String(err.stderr).trim().split('\n')[0] : '') || err.message };
  }
  try {
    return { data: JSON.parse(stdout).data, why: null };
  } catch {
    return { data: null, why: 'the host answered `mailbox status` with no JSON envelope' };
  }
}

function checkMailboxHook(cwd) {
  const optIn = mailboxOptIn(cwd);
  // The config rows already fail and name a refused config; this row only says why it cannot tell.
  if (optIn.state === 'refused') {
    return { passed: true, message: `opt-in unknown: ${refusedConfigName(optIn)} is refused (${optIn.reason}${optIn.file ? ` in ${optIn.file}` : ''}); the config rows name it, and fgos setup leaves the mailbox hook rows as they are` };
  }
  if (optIn.state === 'off') {
    return { passed: true, message: 'not enabled: mailbox.enabled is false in the config; set it to true (fgos config set), then run fgos doctor --fix, to install the mailbox hook rows' };
  }
  const enabled = 'enabled: the Claude Code and Codex hook checks require the mailbox rows; limits: fgos config show --path mailbox (the standard is fgos config standard --path mailbox)';
  const { data, why } = mailboxRecordVerdict(cwd);
  if (!data) return { passed: true, message: `${enabled}; record not checked: ${why}` };
  // No record field: the verb found no record directory to read here (not a repository,
  // no .fgos), and says so in its text.
  if (!data.record) return { passed: true, message: `${enabled}; record not checked: ${data.text ?? 'no answer'}` };
  if (data.record === 'none') return { passed: true, message: `${enabled}; record: none yet (no hook has run in this project)` };
  // An unreadable or untrusted record stops send, inbox and hook delivery: readiness, so the row fails and names the verb.
  if (data.record !== 'ok') return { passed: false, message: `enabled, but the mailbox record cannot be read: ${data.record}; run \`fgos mailbox status\`` };
  const outcome = data.hookOutcome?.reason ? `, last hook outcome ${data.hookOutcome.reason}` : '';
  return { passed: true, message: `${enabled}; record: ok (${data.heads} head(s), ${data.signals?.queue?.pending ?? 0} pending${outcome})${crossMachineNote(data.crossMachine)}` };
}

registerCheck({
  id: 'mailbox-hook',
  description: 'agent mailbox: whether this project opted in to the mailbox hook rows (mailbox.enabled), and when it did, the record verdict from fgos mailbox status',
  check: (cwd) => checkMailboxHook(cwd),
});

registerCheck({
  id: 'mailbox-claude-accept',
  description: 'agent mailbox: whether the Claude Code user settings accept cross-session input (crossSessionInbound), which decides if mail wakes an idle Claude session; report only, fgOS never sets it',
  check: (cwd) => checkMailboxClaudeAccept(cwd),
});

registerCheck({
  id: 'mailbox-sync-timer',
  description: 'agent mailbox: when cross-machine mail is on, an OS timer runs the mailbox sync child every eventStore.sync.intervalSec, so mail is taken on a machine where no session runs a tool',
  check: (cwd) => checkMailboxSyncTimer(cwd),
});

registerFix({
  id: 'mailbox-sync-timer',
  fix: (cwd) => fixMailboxSyncTimer(cwd),
});

// Every capability a core/domain Workflow unit names must resolve the way
// bind() resolves it (exact name, then the bare verb). One that does not has
// no candidate pool, so that unit is refused at run time with no earlier signal.
// A declared entry that carries no `prefer` pool (exact or bare verb) is reported too.
// Definitions come from the Workflow loader's one catalog (readWorkflowCatalog): the one that runs for each
// id, project before shipped. Every string under a key named `capability`, at any depth, is a use. A file
// that cannot be read, parsed or validated is reported by name, never skipped.
function workflowCapabilityUses(catalog) {
  const uses = new Map();
  for (const [id, { raw, source }] of catalog) {
    for (const capability of capabilityValues(raw)) {
      if (!uses.has(capability)) uses.set(capability, new Set());
      uses.get(capability).add(`${id} from ${source.root}`);
    }
  }
  return uses;
}

// Every string stored under a key named `capability`, at any depth. Iterative with a visited set:
// a YAML alias can make a document reference itself, and a recursive walk would never end.
function capabilityValues(root) {
  const found = [];
  const visited = new Set();
  const queue = [root];
  for (let next = 0; next < queue.length; next += 1) {
    const node = queue[next];
    if (node === null || typeof node !== 'object' || visited.has(node)) continue;
    visited.add(node);
    for (const [key, value] of Array.isArray(node) ? node.entries() : Object.entries(node)) {
      if (key === 'capability' && typeof value === 'string' && value.trim() !== '') found.push(value.trim());
      else queue.push(value);
    }
  }
  return found;
}

// Capabilities the runner loop's worker asks for that no Workflow unit names. A coding item's
// executing step runs as a Unit of `code:implement` (work-compat.mjs's curated mapping); its other
// steps ask for `<domain>:<verb>`, the names the domain's Workflow units already use.
const RUNNER_LOOP_CAPABILITY_USES = Object.freeze([['code:implement', 'runner loop: coding executing step']]);

function checkWorkflowCapabilitiesConfigured(cwd) {
  const { catalog, unreadable } = readWorkflowCatalog(cwd);
  const uses = workflowCapabilityUses(catalog);
  for (const [capability, id] of RUNNER_LOOP_CAPABILITY_USES) {
    uses.set(capability, new Set([...(uses.get(capability) ?? []), id]));
  }
  return withUnreadableDefinitions(evaluateWorkflowCapabilities(cwd, uses), unreadable);
}

function evaluateWorkflowCapabilities(cwd, uses) {
  const declared = effectiveSection(cwd, 'runner').capabilities ?? {};
  const entriesOf = (capability) => capabilityEntriesOf({ capabilities: declared }, capability);
  const missing = [...uses].filter(([capability]) => entriesOf(capability).length === 0);
  if (missing.length > 0) {
    const list = missing.map(([cap, ids]) => `${cap} (${[...ids].join(', ')})`).join('; ');
    return {
      passed: false,
      message: `runner.capabilities has no entry for Workflow capabilities: ${list} -- declare each under runner.capabilities (fgos setup adds every shipped Workflow's)`,
    };
  }
  // Declared is not enough: a seat needs a prefer pool, on the exact entry or its prefix entry
  // (or a tierFallback list for its tier), or it is refused headless. Setup's own slots are description-only on
  // purpose (which executors serve a capability is the project's taste), so this is a
  // warning that names the gap rather than a failure on a fresh project.
  const noPool = [...uses].filter(
    ([capability]) => !entriesOf(capability).some(({ entry }) => hasUsablePrefer(entry)),
  );
  if (noPool.length > 0) {
    const list = noPool.map(([cap, ids]) => `${cap} (${[...ids].join(', ')})`).join('; ');
    return {
      passed: true,
      message: `warning: Workflow capabilities declared but with no "prefer" pool, so a headless run of those units is refused: ${list} -- add "prefer" under the exact name or its prefix entry in runner.capabilities`,
    };
  }
  return { passed: true, message: `every capability a Workflow unit names (${uses.size}) is declared in runner.capabilities with a prefer pool` };
}

registerCheck({
  id: 'workflow-capabilities-configured',
  description: 'every capability a core/domain Workflow unit names is declared in runner.capabilities',
  check: (cwd) => checkWorkflowCapabilitiesConfigured(cwd),
});

// I19 (core/skills/_shared/capability-matching.md): `serves` is optional, and the schema refuses a malformed one,
// but two capabilities that declare the identical attribute set are permanently tied (capability-matching.md's
// "Ties and misses" rule) and silently degrade Q1 steering with no error anywhere else. `review`'s presence is
// already covered generically by the standard (which always supplies it).
function normalizeServesForComparison(serves) {
  return JSON.stringify(Object.fromEntries(Object.entries(serves).sort(([a], [b]) => a.localeCompare(b))));
}

function checkCapabilityServesValid(cwd) {
  const capabilities = effectiveSection(cwd, 'runner').capabilities ?? {};
  const servesByName = new Map();
  for (const [name, entry] of Object.entries(capabilities)) {
    if (entry?.serves !== undefined) servesByName.set(name, entry.serves);
  }
  const seenBySignature = new Map();
  for (const [name, serves] of servesByName) {
    const signature = normalizeServesForComparison(serves);
    const priorName = seenBySignature.get(signature);
    if (priorName) {
      return {
        passed: false,
        message: `"${priorName}" and "${name}" declare the identical "serves" attribute set -- capability matching can never distinguish them`,
      };
    }
    seenBySignature.set(signature, name);
  }
  return {
    passed: true,
    message: `${servesByName.size} capability entr${servesByName.size === 1 ? 'y declares' : 'ies declare'} a valid "serves" attribute set, none identical`,
  };
}

registerCheck({
  id: 'capability-serves-valid',
  description: 'runner.capabilities\' "serves" attribute sets are mutually distinct (I19); the schema states their shape',
  check: (cwd) => checkCapabilityServesValid(cwd),
});

// A present-but-unusable `ceiling` is the misconfiguration that actually
// bites, and it fails SILENTLY: `hasWorkerSlotRoom` treats anything that is
// not a positive integer as "no ceiling configured" and allows every claim,
// so a project that believes it is capped runs uncapped. The schema refuses a
// string or `8.5`; `0` and `-1` are integers it admits and land there.
// `null` is the one non-positive value that is not a mistake: the standard's
// own value, meaning "deliberately unarmed".
function checkWorkerSlotsCeiling(cwd) {
  const { ceiling } = effectiveSection(cwd, 'workerSlots');
  if (ceiling === null || ceiling === undefined) {
    return {
      passed: true,
      message: `workerSlots.ceiling is unarmed (null) -- no claim is refused; set a positive integer (recommended: ${DEFAULT_WORKER_SLOT_CEILING}) to enforce a ceiling`,
    };
  }
  if (!Number.isInteger(ceiling) || ceiling <= 0) {
    return {
      passed: false,
      message: `workerSlots.ceiling is ${JSON.stringify(ceiling)}, which enforces NOTHING -- expected a positive integer (recommended: ${DEFAULT_WORKER_SLOT_CEILING}) or null to mean deliberately unarmed`,
    };
  }
  return { passed: true, message: `workerSlots.ceiling = ${ceiling} running work item(s)` };
}

registerCheck({
  id: 'worker-slots-ceiling-usable',
  description: 'workerSlots.ceiling is either a positive integer or explicitly null (a malformed value silently enforces nothing)',
  check: (cwd) => checkWorkerSlotsCeiling(cwd),
});

// The levels of ironLaw.level and the one an unreadable value degrades to at the gate itself
// (src/verbs/merge/iron-law-level.mjs): a project that never sets it gets the refusing behavior, not the
// permissive one. The schema (core/config-schema/ironLaw.schema.yaml) holds the same enum.
export const IRON_LAW_LEVELS = Object.freeze(['ask', 'warn']);
export const DEFAULT_IRON_LAW_LEVEL = 'ask';

// The rows over the config files themselves, from the config crate's contract (spec section 11), and their
// repairs; the gateway token row is the contract's machine-files row.
for (const entry of CONFIG_CHECKS) registerCheck(entry);
for (const entry of CONFIG_FIXES) registerFix(entry);

// tsk-4xg: the fgOS Claude Code plugin. The row reports; registering the marketplace and
// installing the plugin change the person's own Claude config, so only the opt-in
// `fgos wire-agents` does it (src/setup/agent-wiring.mjs).
registerCheck({
  id: 'claude-plugin-marketplace',
  description: 'fgOS Claude Code plugin marketplace is registered and the fgOS plugin is installed/enabled; report only, fgos wire-agents installs it',
  check: () => checkClaudePluginMarketplace(),
});

// tsk-2qc-1 D4: the tier-3 (global) config-cache is populated/refreshed
// only here, from `fgos doctor --fix` -- never on every `resolveFgosBin`
// call, which is the whole point of caching the PATH probe instead of
// re-running it. Idempotent and always safe to re-run: a stale cached
// path is simply overwritten with whatever `probeGlobalBin` finds now
// (or cleared, if nothing resolves).
function fixBinDiscoveryCache() {
  const { resolved, changed } = refreshGlobalBinCache();
  if (!changed) {
    return { changed: false, message: resolved ? `global bin-discovery cache already up to date: ${resolved}` : 'global bin-discovery cache already empty (no fgos on PATH)' };
  }
  return resolved
    ? { changed: true, message: `global bin-discovery cache refreshed: ${resolved}` }
    : { changed: true, message: 'global bin-discovery cache cleared (no fgos on PATH)' };
}

registerFix({
  id: 'bin-discovery-cache',
  fix: () => fixBinDiscoveryCache(),
});

function checkOperationPromptTemplatesValid(cwd) {
  try {
    const entries = discoverProjectPromptTemplates({ cwd });
    return {
      passed: true,
      message: `${entries.length} project operation prompt template(s) discovered and validated cleanly`,
    };
  } catch (err) {
    if (err instanceof TemplateResolutionError) {
      return { passed: false, message: `malformed operation prompt template -- ${err.message}` };
    }
    throw err;
  }
}

registerCheck({
  id: 'operation-prompt-templates-valid',
  description: 'every operation prompt template in the project tier (.fgos/prompt-templates) validates against bounded variables and schema; the release\'s domain and core templates are judged by npm test',
  check: (cwd) => checkOperationPromptTemplatesValid(cwd),
});

// Phase 01 group D (plans/260906-1831-dispatch-visibility-v0): the three things
// that must hold before an interactive dispatch can work at all, each turned from
// a runtime surprise into a doctor line.
//
// The confinement check is the odd one of the three, and the most important. The
// config door already refuses `permissionMode: "bypass"` without full
// confinement, so in principle this can never fire — but "in principle" is how a
// permission posture ends up decided by something nobody can see, which is
// exactly what was measured on 2026-09-06: the bypass flag reached agents through
// a shell alias and its acceptance screen was suppressed by a settings key,
// neither of them visible to any executor profile. A second, independent reading
// of the same invariant is cheap, and it catches a config that arrived by some
// route the loader never saw.

/** The folder-trust store must be readable and well-formed, or every dispatch
 * into a fresh worktree stops at a trust dialog with nobody there to answer it. */
export function checkTrustStoreWritable(storePath = operatorClaudeStorePath()) {
  let raw;
  try {
    raw = fs.readFileSync(storePath, 'utf8');
  } catch (err) {
    // claude installed but never run has no store yet: normal for a new user, so a warning with the next step.
    if (err.code === 'ENOENT') return { passed: true, message: `warning: no trust store at ${storePath} yet, claude creates it on first run; run \`claude\` once, then \`fgos doctor\`` };
    return { passed: false, message: `trust store at ${storePath} is unreadable: ${err.message}` };
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.projects || typeof parsed.projects !== 'object' || Array.isArray(parsed.projects)) {
      return { passed: false, message: `trust store at ${storePath} has no usable "projects" object -- its shape has changed` };
    }
    return { passed: true, message: `trust store at ${storePath} is readable (${Object.keys(parsed.projects).length} entries)` };
  } catch (err) {
    return { passed: false, message: `trust store at ${storePath} is not valid JSON: ${err.message}` };
  }
}

/** `checkTrustStoreWritable` only ever reads the default claude-json path --
 * an executor declaring `interactiveMode.trustStore.kind: 'codex-toml'` or
 * `'agy'`/`'agy-json'` had no doctor coverage at all before this, so an
 * unreadable codex config.toml or agy settings.json surfaced for the first
 * time as a live dispatch failure instead of a doctor line. Reuses the same
 * readers `seedCodexTrust`/`seedAgyTrust` use, so a "readable" verdict here
 * means the exact same read the real dispatch will do also succeeds. */
export function checkTrustStoresReadable(cwd, runnerCfg = {}) {
  const problems = [];
  const notes = [];
  const seen = new Set();

  function checkOne(trustStore, env, label) {
    if (!trustStore || (trustStore.kind !== 'codex-toml' && trustStore.kind !== 'agy' && trustStore.kind !== 'agy-json')) return;
    const storePath = trustStore.kind === 'codex-toml'
      ? (trustStore.path ?? path.join(env?.CODEX_HOME ?? path.join(os.homedir(), '.codex'), 'config.toml'))
      : (trustStore.path ?? defaultAgySettingsPath(env?.HOME ?? os.homedir()));
    const dedupeKey = `${trustStore.kind}:${storePath}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);
    try {
      if (trustStore.kind === 'codex-toml') {
        readCodexTrust(storePath, path.resolve(cwd));
      } else {
        readAgyStore(storePath);
      }
      notes.push(`${label}: ${trustStore.kind} trust store at ${storePath} is readable`);
    } catch (err) {
      problems.push(`${label}: ${trustStore.kind} trust store at ${storePath} is unreadable (${err.message})`);
    }
  }

  for (const [id, executor] of Object.entries(runnerCfg.executors ?? {})) {
    checkOne(executor?.interactiveMode?.trustStore, executor?.env, `executor "${id}"`);
    for (const inv of executor?.invocations ?? []) {
      checkOne(inv?.interactiveMode?.trustStore, inv?.env ?? executor?.env, `executor "${id}" invocation "${inv?.id ?? '?'}"`);
    }
  }

  if (problems.length > 0) {
    return { passed: false, message: problems.join('; ') };
  }
  return { passed: true, message: notes.length > 0 ? notes.join('; ') : 'no codex-toml or agy trust store declared' };
}

/**
 * A confined invocation that reads a login store starts in an empty private home: the account's login only
 * gets there when the machine-global provider account inventory names it. Without that entry the agent
 * starts logged out, and the first symptom is a pane sitting at a sign-in screen until the idle limit. This
 * is the doctor line that names it, per invocation, before a run does. Files of the store that are absent
 * are noted; a store with none of its files present fails, since nothing would be copied.
 */
export function checkConfinedPaneAccounts(runnerCfg = {}, providerInventory = undefined) {
  let inventory;
  if (providerInventory) {
    // The machine-global read: an unusable global config is reported by its reason (code and path only).
    if (providerInventory.inventoryUnreadable) return { passed: false, message: `provider account inventory is unreadable: ${providerInventory.inventoryUnreadable}` };
    inventory = providerInventory.inventory;
  } else {
    try {
      inventory = providerAccountInventory(runnerCfg);
    } catch (err) {
      return { passed: false, message: `provider account inventory is invalid: ${err.message}` };
    }
  }
  const expandHome = (value) => String(value ?? '').replace(/^\$\{HOME\}(?=\/|$)/, os.homedir()).replace(/^\$HOME(?=\/|$)/, os.homedir()).replace(/^~(?=\/|$)/, os.homedir());
  const problems = [];
  const notes = [];
  for (const [id, executor] of Object.entries(runnerCfg.executors ?? {})) {
    for (const inv of executor?.invocations ?? []) {
      const command = inv?.command ?? executor.command;
      const store = credentialStoreOf(inv && { ...inv, command });
      if (!store) continue;
      const label = `executor "${id}" invocation "${inv.id ?? '?'}"`;
      // A CLI this machine does not have starts no pane, so its login is nobody's to find.
      if (!isCommandAvailable(command)) { notes.push(`${label}: ${path.basename(command ?? '')} is not installed, not checked`); continue; }
      const provider = legacyStateKey(executor.providerModel ?? executor.provider);
      const providerEntry = Object.hasOwn(inventory, provider) ? inventory[provider] : undefined;
      const accountMap = providerEntry?.accounts;
      const accounts = accountMap && typeof accountMap === 'object' ? Object.keys(accountMap).filter((key) => Object.hasOwn(accountMap, key)).map((key) => accountMap[key]) : [];
      if (accounts.length === 0) {
        problems.push(`${label}: no runner.providers.${provider}.accounts in the global config, so its pane starts in an empty private home, logged out`);
        continue;
      }
      // An account that keeps one login per CLI reaches this invocation only through the store it names.
      for (const account of accounts) {
        const source = credentialSourceForCli(account, store.use);
        if (!source) {
          problems.push(`${label}: account "${account.id}" declares no credential source for store "${store.use}", so an agent leased to it starts logged out`);
          continue;
        }
        const home = expandHome(source.home);
        const files = store.files ?? (source.kind === 'home-files' ? source.files : ['auth.json']);
        const missing = files.filter((rel) => !fs.existsSync(path.join(home, rel)));
        if (missing.length === files.length) problems.push(`${label}: account "${account.id}" has none of ${files.join(', ')} under ${home}, so nothing is copied and its agent starts logged out`);
        else if (missing.length > 0) notes.push(`${label}: account "${account.id}" has ${files.length - missing.length} of ${files.length} credential file(s); absent: ${missing.join(', ')}`);
        else notes.push(`${label}: account "${account.id}" has its ${files.length} credential file(s)`);
      }
    }
  }
  if (problems.length > 0) return { passed: false, message: problems.join('; ') };
  return { passed: true, message: notes.length > 0 ? notes.join('; ') : 'no confined invocation reads a login store' };
}

/** Second reading of the config door's own C5 invariant. Names the executor and
 * the specific flags, because "confinement incomplete" leaves a reader hunting
 * through three booleans for the one that is false. */
export function checkExecutorConfinement(runnerCfg = {}) {
  const offenders = [];
  for (const [id, executor] of Object.entries(runnerCfg.executors ?? {})) {
    if (executor?.permissionMode !== 'bypass') continue;
    const c = executor.confinement ?? {};
    const missing = [];
    if (!(c.privateHome === true || c.controls?.home === 'private')) missing.push('privateHome');
    if (!(c.isolatedSession === true || c.controls?.session === 'isolated')) missing.push('isolatedSession');
    if (!(c.ownWorktree === true || c.controls?.workspace === 'own')) missing.push('ownWorktree');
    if (missing.length > 0) offenders.push(`${id} (missing ${missing.join(', ')})`);
  }
  if (offenders.length === 0) {
    return { passed: true, message: 'every executor declaring bypass also declares full confinement' };
  }
  return {
    passed: false,
    message: `executors declare "permissionMode": "bypass" without full confinement: ${offenders.join('; ')}`,
  };
}

/** A worker holds no git write grant: the runner commits what it leaves in the
 * worktree. A config that still grants `git add`/`git commit` (bare or
 * `rtk`-wrapped) through an allowlist predates that rule and lets an unconfined
 * worker move branch refs; named per executor/invocation so the fix is a
 * one-line edit. Reported as a warning, never auto-removed from a user's file. */
const GIT_WRITE_GRANT = /\bgit (add|commit)\b/;

function grantsGitWrite(args) {
  if (!Array.isArray(args)) return false;
  const at = args.indexOf('--allowedTools');
  return at !== -1 && typeof args[at + 1] === 'string' && GIT_WRITE_GRANT.test(args[at + 1]);
}

export function checkInvocationGitWriteGrants(runnerCfg = {}) {
  const offenders = [];
  if (grantsGitWrite(runnerCfg.executor?.args)) offenders.push('executor');
  for (const [id, executor] of Object.entries(runnerCfg.executors ?? {})) {
    if (grantsGitWrite(executor?.args)) offenders.push(`executors.${id}`);
    for (const invocation of executor?.invocations ?? []) {
      if (grantsGitWrite(invocation?.args)) offenders.push(`executors.${id}.invocations.${invocation.id ?? '?'}`);
    }
  }
  if (offenders.length === 0) {
    return { passed: true, message: 'no executor or invocation grants git add/git commit to a worker' };
  }
  return {
    passed: true,
    message: `warning: ${offenders.join(', ')} still grant git add/git commit in --allowedTools; workers no longer commit (the runner does) -- remove the grant`,
  };
}

/** What herdr says it can start and which integration hooks it has, asked through the
 * terminal-control port. `null` for either when herdr cannot be asked or its text cannot be
 * read: absence is already `terminal-control`'s business, and reporting it twice helps nobody. */
function askHerdrFacts() {
  try {
    const report = createTerminalControl({ herdrBin: resolveHerdrBin() }).capabilities({ agents: true });
    const known = (value) => (value !== null && typeof value === 'object' ? value : null);
    return { kinds: known(report.agentKinds), integrations: known(report.integrations) };
  } catch {
    return { kinds: null, integrations: null };
  }
}

/** herdr calls the Antigravity CLI `agy` when starting an agent but
 * `antigravity-cli` when installing its integration hook. Same tool, two
 * spellings, so a check that reads both surfaces has to bridge them. */
const HERDR_KIND_TO_INTEGRATION = Object.freeze({ agy: 'antigravity-cli' });

/**
 * Every executor dispatched through a herdr pane must name an agent kind
 * herdr can actually start, and that kind's integration hook must not be a
 * stale version.
 *
 * An `outdated` hook fails: it is installed, so herdr reads agent state
 * through it, and it is the wrong version, so what it reports may be wrong.
 * `not installed` only warns -- herdr falls back to its own detection, and
 * since nothing in this dispatch path concludes completion from agent state
 * any more, a missing hook costs latency and precision rather than
 * correctness.
 */
/** An executor's own declared invocation shape (legacy, no `invocations[]`)
 * still needs an `adapter` to check, so this falls back to the executor
 * itself when no `via: 'cli'` entry exists. */
function resolveCliInvocation(executor) {
  return (executor?.invocations ?? []).find((i) => i.via === 'cli') ?? executor;
}

export function checkHerdrExecutorKinds(runnerCfg = {}, ask = askHerdrFacts) {
  const executors = Object.entries(runnerCfg.executors ?? {});
  const herdrExecutors = [];
  for (const [id, executor] of executors) {
    const invocation = resolveCliInvocation(executor) ?? {};
    if (invocation.adapter !== 'herdr-spawn') continue;
    const declared = invocation.interactiveMode?.kind;
    const command = invocation.command;
    herdrExecutors.push({ id, kind: declared ?? (command ? path.basename(command) : null) });
  }
  if (herdrExecutors.length === 0) {
    return { passed: true, message: 'no executor dispatches through a herdr pane' };
  }

  const { kinds: supported, integrations: status } = ask();
  if (!supported) {
    return { passed: true, message: 'herdr could not be asked which agent kinds it supports; kinds not evaluated' };
  }

  const unknown = herdrExecutors.filter((e) => !e.kind || !supported.includes(e.kind));
  if (unknown.length > 0) {
    return {
      passed: false,
      message: `executors name an agent kind herdr cannot start: ${unknown.map((e) => `${e.id} (${e.kind ?? 'none declared'})`).join('; ')}. herdr supports: ${supported.join(', ')}`,
    };
  }

  const notes = [];
  const stale = [];
  for (const e of herdrExecutors) {
    const name = HERDR_KIND_TO_INTEGRATION[e.kind] ?? e.kind;
    const state = status?.[name];
    if (state === 'outdated') stale.push(`${e.id} (kind ${e.kind}, hook ${name})`);
    else if (state === 'not installed') notes.push(`${e.id}: no ${name} integration hook installed`);
  }
  if (stale.length > 0) {
    return {
      passed: false,
      message: `executors depend on an outdated herdr integration hook, so the agent state it reports may be wrong: ${stale.join('; ')}. Run: herdr integration install <name>`,
    };
  }
  return {
    passed: true,
    message: `every herdr executor names a supported kind${notes.length > 0 ? ` (${notes.join('; ')})` : ''}`,
  };
}

registerCheck({
  id: 'terminal-control',
  description: 'the terminal-control driver (herdr) answers, which capabilities it declares and which server it talks to, and terminal.* after the config merge with each value and its source; a bad FGOS_HERDR_ANCHOR_PANE or terminal.* value fails, a missing herdr only warns',
  check: (cwd) => checkTerminalControl(cwd),
});
registerCheck({
  id: 'terminal-allocations',
  description: 'terminal slots past allocationGraceMs that never launched and retained panes past their time; reports only, closes nothing',
  check: (cwd) => checkTerminalAllocations(cwd),
});

registerCheck({
  id: 'omp-natives-present',
  description: "omp's native addon for its installed version is in the natives directory omp resolves (a confined omp cannot extract it); fails only when an executor runs omp, warns when omp is missing or unused; readiness only, no repair",
  check: (cwd) => {
    let ompExecutors = null;
    try {
      ompExecutors = ompExecutorsOf(loadRunnerConfigForDir(cwd));
    } catch {
      // An unreadable runner config is its own row's failure; here it only means no executor is known to run omp.
    }
    return checkOmpNativesPresent({ ompExecutors });
  },
});

registerCheck({
  id: 'herdr-executor-kinds',
  description: 'every executor dispatched through a herdr pane names an agent kind herdr can start, and none depends on an outdated herdr integration hook',
  check: (cwd) => {
    try {
      return checkHerdrExecutorKinds(loadRunnerConfigForDir(cwd));
    } catch (err) {
      return { passed: true, message: `runner config not loadable here, herdr executor kinds not evaluated: ${err.message}` };
    }
  },
});

registerCheck({
  id: 'executor-profile-warnings',
  description: 'legacy executor entries hardcoding policy-shaped flags or account-pool-like env, each named with its documented migration target',
  check: (cwd) => {
    try {
      return checkExecutorProfileWarnings(cwd, loadRunnerConfigForDir(cwd));
    } catch (err) {
      return { passed: true, message: `runner config not loadable here, executor-profile warnings not evaluated: ${err.message}` };
    }
  },
});

registerCheck({
  id: 'session-keep-declared',
  description: 'read-only pointer: confined agent invocations that declare no session directory keep no seat transcript; fgos dispatch probe-session <executorId> shows where the CLI writes it (a warning, never a failure; doctor never runs the probe)',
  check: (cwd) => {
    try {
      return checkSessionKeepDeclared(loadRunnerConfigForDir(cwd));
    } catch (err) {
      return { passed: true, message: `runner config not loadable here, session directories not evaluated: ${err.message}` };
    }
  },
});

registerCheck({
  id: 'trust-store-readable',
  description: 'the agent folder-trust store is readable and carries a usable "projects" object, so a dispatch into a fresh worktree can be pre-trusted instead of stopping at a dialog',
  check: () => (isCommandAvailable('claude')
    ? checkTrustStoreWritable()
    : { passed: true, status: 'skip', message: 'skipped: claude is not installed on this machine, so no trust dialog can stop a dispatch' }),
});

registerCheck({
  id: 'confined-pane-accounts',
  description: 'every confined invocation that reads a login store has an account in the global provider inventory with at least one of that store\'s credential files, so its agent starts logged in',
  check: (cwd) => {
    // The account inventory is the machine's (global config and accounts file), so it is read from there whatever
    // the cwd. Executors come from the project config merged with the machine's; with no usable project config
    // the machine's own executors are judged.
    const providerInventory = readDoctorProviderInventory();
    let runnerCfg;
    try {
      runnerCfg = loadRunnerConfigForDir(cwd);
    } catch (err) {
      let globalRunner = {};
      try { globalRunner = machineRunner(); } catch { /* the inventory read reports an unreadable global config */ }
      if (!globalRunner.executors || typeof globalRunner.executors !== 'object') {
        if (providerInventory.inventoryUnreadable) return checkConfinedPaneAccounts({}, providerInventory);
        return { passed: true, message: `runner config not loadable here, confined pane accounts not evaluated: ${err.message}` };
      }
      runnerCfg = { executors: globalRunner.executors };
    }
    return checkConfinedPaneAccounts(runnerCfg, providerInventory);
  },
});

registerCheck({
  id: 'non-claude-trust-stores-readable',
  description: 'every executor or invocation declaring a codex-toml or agy/agy-json trustStore reads from a store that is actually readable, the same read a live dispatch will do',
  check: (cwd) => {
    try {
      return checkTrustStoresReadable(cwd, loadRunnerConfigForDir(cwd));
    } catch (err) {
      return { passed: true, message: `runner config not loadable here, non-claude trust stores not evaluated: ${err.message}` };
    }
  },
});

registerCheck({
  id: 'agent-cli-project-trusted',
  description: 'the project root is trusted in every codex home and agy sub-HOME the configured executors run under, so a headless dispatch does not stop at a "Trust this folder?" prompt',
  check: (cwd) => checkAgentCliProjectTrusted(cwd, { loadRunnerConfig: loadRunnerConfigForDir }),
});

// Async: the check drives the runner's own pattern code, which is promise-based. `fgos doctor`
// awaits every check, so a check may return its result directly or as a promise.
registerCheck({
  id: 'seat-binding-dry-bind',
  description: 'every seat of every Workflow unit, and every core capability (execute, code:implement, any capability declaring an agent pool) as a writing producer, binds under the committed config in a fixed headless session (no lease, nothing started); a policy refusal or a pool with no executor able to carry the confinement posture fails, no pool, account state, tier caps and shared families are information',
  check: (cwd) => checkSeatBindingDryBind(cwd, {
    loadRunnerConfig: loadRunnerConfigForDir,
  }),
});

registerCheck({
  id: 'blind-steps-use-proven-pools',
  description: 'every blind Workflow unit can only bind executors whose provider family and transport were proven to keep a worker blind (read-only, no model call)',
  check: (cwd) => checkBlindStepsUseProvenPools(cwd, {
    loadRunnerConfig: loadRunnerConfigForDir,
  }),
});

registerCheck({
  id: 'executor-confinement',
  description: 'no executor declares "permissionMode": "bypass" without privateHome, isolatedSession and ownWorktree all true',
  check: (cwd) => {
    try {
      return checkExecutorConfinement(loadRunnerConfigForDir(cwd));
    } catch (err) {
      // A directory with no loadable runner config is not a confinement problem;
      // saying otherwise would make doctor cry wolf everywhere fgOS is not set up.
      return { passed: true, message: `runner config not loadable here, confinement not evaluated: ${err.message}` };
    }
  },
});

registerCheck({
  id: 'invocation-git-write-grants',
  description: 'warns when an executor or invocation still grants git add/git commit to a worker through --allowedTools (the runner commits; workers hold no git write grant)',
  check: (cwd) => {
    try {
      return checkInvocationGitWriteGrants(loadRunnerConfigForDir(cwd));
    } catch (err) {
      return { passed: true, message: `runner config not loadable here, git write grants not evaluated: ${err.message}` };
    }
  },
});

// ─── Rust Host Release and Packaging Checks (Phase 09) ───────────────────────

/**
 * Resolves `releasePath` joined with `segments`, refusing a result that
 * escapes `releasePath` (round-2 red-team HIGH: a manifest naming an
 * absolute or `..`-escaping entry, e.g. `entries.fgos: "/bin/sh"`, must
 * not make a doctor check pass against an arbitrary system binary just
 * because that path happens to exist and be executable). Returns `null`
 * on escape instead of throwing -- a doctor check reports a clear failed
 * result, it doesn't crash the whole `fgos doctor` run over one bad
 * manifest field.
 */
function resolveConfinedManifestPath(releasePath, ...segments) {
  const resolvedBase = path.resolve(releasePath);
  const resolved = path.resolve(resolvedBase, ...segments);
  if (resolved !== resolvedBase && !resolved.startsWith(resolvedBase + path.sep)) {
    return null;
  }
  // Round-3 red-team HIGH: the lexical check above only catches a manifest
  // NAMING an escaping path directly (an absolute path, or enough `../`
  // segments) -- it says nothing about a symlink physically staged INSIDE
  // the confined lexical path that points outside it (e.g. entries.fgos:
  // "bin/fgos" where release/bin/fgos is itself a symlink to /bin/sh).
  // Resolve the real path (following symlinks) when the target exists and
  // re-confirm containment against the release root's own real path too.
  if (fs.existsSync(resolved)) {
    let realResolved;
    let realBase;
    try {
      realResolved = fs.realpathSync(resolved);
      realBase = fs.realpathSync(resolvedBase);
    } catch (_) {
      return null;
    }
    if (realResolved !== realBase && !realResolved.startsWith(realBase + path.sep)) {
      return null;
    }
  }
  return resolved;
}

function resolveActiveReleaseForDoctor(dir, scope = {}) {
  const root = resolveMainCheckout(dir) ?? dir;
  const candidateDirs = scope.candidateDirs ?? [dir, process.cwd(), root].filter((d, i, arr) => d && arr.indexOf(d) === i);
  const env = scope.env ?? process.env;

  // 1. Explicit env vars
  if (env.FGOS_ACTIVE_RELEASE_PATH) {
    const releasePath = env.FGOS_ACTIVE_RELEASE_PATH;
    const manifestPath = env.FGOS_ACTIVE_MANIFEST_PATH ||
      (fs.existsSync(path.join(releasePath, 'manifest.json'))
        ? path.join(releasePath, 'manifest.json')
        : path.join(releasePath, 'target', 'dev-manifest.json'));
    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        return { releasePath, manifestPath, manifest };
      } catch (_) {}
    }
    return { releasePath, manifestPath: null, manifest: null };
  }

  // 2. Workspace activation binding (.fgos/installation/activation.json)
  for (const candidate of candidateDirs) {
    const activationPath = path.join(candidate, '.fgos', 'installation', 'activation.json');
    if (fs.existsSync(activationPath)) {
      try {
        const act = JSON.parse(fs.readFileSync(activationPath, 'utf8'));
        if (act.releasePath) {
          const manifestPath = path.join(act.releasePath, 'manifest.json');
          if (fs.existsSync(manifestPath)) {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            return { releasePath: act.releasePath, manifestPath, manifest };
          }
          return { releasePath: act.releasePath, manifestPath: null, manifest: null };
        }
      } catch (_) {}
    }
  }

  // 3. Staged release manifest in candidate dirs
  for (const candidate of candidateDirs) {
    const rootManifest = path.join(candidate, 'manifest.json');
    if (fs.existsSync(rootManifest)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(rootManifest, 'utf8'));
        return { releasePath: candidate, manifestPath: rootManifest, manifest };
      } catch (_) {}
    }
  }

  // 4. Dev manifest in target/dev-manifest.json
  for (const candidate of candidateDirs) {
    const devManifest = path.join(candidate, 'target', 'dev-manifest.json');
    if (fs.existsSync(devManifest)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(devManifest, 'utf8'));
        return { releasePath: candidate, manifestPath: devManifest, manifest };
      } catch (_) {}
    }
  }

  // 5. Source checkout dev fallback -- any directory with a package.json is
  // NOT a sufficient signal (fgOS runs globally against other projects,
  // D-ADR0035, and nearly every Node project has a package.json); require
  // the Rust host workspace marker unique to this repo's own checkout.
  for (const candidate of candidateDirs) {
    if (fs.existsSync(path.join(candidate, 'apps', 'fgos', 'Cargo.toml'))) {
      return { releasePath: candidate, manifestPath: null, manifest: null, isDevCheckout: true };
    }
  }
  return { releasePath: dir, manifestPath: null, manifest: null, isDevCheckout: false };
}

function checkRustHostBinaryPresent(cwd) {
  const root = resolveMainCheckout(cwd) ?? cwd;
  const candidateDirs = [cwd, process.cwd(), root].filter((d, i, arr) => d && arr.indexOf(d) === i);
  const releaseInfo = resolveActiveReleaseForDoctor(cwd);
  let binaryPath = null;

  if (releaseInfo.manifest) {
    const fgosEntry = releaseInfo.manifest.entries?.fgos;
    if (!fgosEntry) {
      return { passed: false, message: 'active release manifest missing entries.fgos' };
    }
    binaryPath = resolveConfinedManifestPath(releaseInfo.releasePath, fgosEntry);
    if (binaryPath === null) {
      return {
        passed: false,
        message: `active release manifest's entries.fgos ("${fgosEntry}") escapes the active release path`,
      };
    }
  } else if (releaseInfo.isDevCheckout) {
    for (const candidate of candidateDirs) {
      const releaseTarget = releaseBinaryPath(path.join(candidate, 'target', 'release'), 'fgos');
      const debugTarget = releaseBinaryPath(path.join(candidate, 'target', 'debug'), 'fgos');
      if (fs.existsSync(releaseTarget)) {
        binaryPath = releaseTarget;
        break;
      } else if (fs.existsSync(debugTarget)) {
        binaryPath = debugTarget;
        break;
      }
    }
    if (!binaryPath) {
      binaryPath = releaseBinaryPath(path.join(cwd, 'target', 'release'), 'fgos');
    }
  } else {
    // No active release, no manifest, and not this repo's own Rust host
    // checkout -- fgOS runs globally against other projects (D-ADR0035)
    // that legitimately have no rust host binary at all. Not applicable
    // here is not a failure.
    return {
      passed: true,
      status: 'skip',
      message: 'no active fgos rust host release or dev checkout found -- rust-host-binary-present skipped',
    };
  }

  if (!fs.existsSync(binaryPath)) {
    return { passed: false, message: `rust host binary does not exist at ${binaryPath}` };
  }

  try {
    fs.accessSync(binaryPath, fs.constants.X_OK);
    return { passed: true, message: `rust host binary present and executable: ${binaryPath}` };
  } catch (err) {
    return { passed: false, message: `rust host binary at ${binaryPath} is not executable: ${err.message}` };
  }
}

export function checkRustHostTargetSupported(platform = process.platform, arch = process.arch) {
  const approvedTargets = RELEASE_TARGETS.map((t) => t.triple);
  const target = releaseTargetForHost(platform, arch);
  if (target) {
    return {
      passed: true,
      message: `current platform (${target.triple}) is an approved rust host target`,
    };
  }
  return {
    passed: false,
    message: `current platform (${arch}-${platform}) is not an approved rust host target (approved: ${approvedTargets.join(', ')})`,
  };
}

function checkLegacyNodePayloadPresent(cwd) {
  const root = resolveMainCheckout(cwd) ?? cwd;
  const candidateDirs = [cwd, process.cwd(), root].filter((d, i, arr) => d && arr.indexOf(d) === i);
  const releaseInfo = resolveActiveReleaseForDoctor(cwd);
  let payloadPath = null;

  if (releaseInfo.manifest) {
    const rootDir = releaseInfo.manifest.components?.legacyNode?.root ?? releaseInfo.manifest.root ?? '.';
    const entry = releaseInfo.manifest.components?.legacyNode?.entry ?? releaseInfo.manifest.entry ?? 'bin/fgos.mjs';
    payloadPath = resolveConfinedManifestPath(releaseInfo.releasePath, rootDir, entry);
    if (payloadPath === null) {
      return {
        passed: false,
        message: `active release manifest's legacyNode root/entry ("${rootDir}"/"${entry}") escapes the active release path`,
      };
    }
  } else if (releaseInfo.isDevCheckout) {
    for (const candidate of candidateDirs) {
      const candidatePayload = path.join(candidate, 'bin', 'fgos.mjs');
      if (fs.existsSync(candidatePayload)) {
        payloadPath = candidatePayload;
        break;
      }
    }
    if (!payloadPath) {
      payloadPath = path.join(cwd, 'bin', 'fgos.mjs');
    }
  } else {
    // Same "not applicable" reasoning as checkRustHostBinaryPresent above:
    // fgOS runs globally against other projects (D-ADR0035) with no rust
    // host release of their own.
    return {
      passed: true,
      status: 'skip',
      message: 'no active fgos rust host release or dev checkout found -- legacy-node-payload-present skipped',
    };
  }

  if (fs.existsSync(payloadPath) && fs.statSync(payloadPath).isFile()) {
    return { passed: true, message: `legacy node payload present: ${payloadPath}` };
  }
  return { passed: false, message: `legacy node payload does not exist at ${payloadPath}` };
}

// Unlike the legacy packaging checks, checkout diagnosis must not borrow cwd/main
// bindings. Keep the resolver's default behavior and explicitly scope this caller.
function doctorDriftPath(base, relative = '.', optional = false) {
  if (typeof relative !== 'string' || !relative || path.isAbsolute(relative) ||
      relative.includes('\\') || relative.split('/').includes('..')) {
    throw new Error(`Manifest path escapes containment or is invalid: ${relative}`);
  }
  const resolvedBase = path.resolve(base);
  const resolved = path.resolve(resolvedBase, relative);
  if (resolved !== resolvedBase && !resolved.startsWith(resolvedBase + path.sep)) {
    throw new Error(`Path escapes containment: ${relative}`);
  }
  // lstat each segment: realpath containment alone still accepts in-root links,
  // and existsSync hides broken links or unreadable paths as "not applicable".
  let current = path.parse(resolved).root;
  for (const segment of resolved.slice(current.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    if (refuseSymlink(current, 'checkout diagnosis', { optional }) === null) return null;
  }
  return resolved;
}

function doctorDriftActivation(checkout) {
  const activationPath = doctorDriftPath(checkout, '.fgos/installation/activation.json', true);
  if (!activationPath) return null;
  const activation = JSON.parse(fs.readFileSync(activationPath, 'utf8'));
  if (!activation || typeof activation.releasePath !== 'string' || !path.isAbsolute(activation.releasePath)) {
    throw new Error(`Invalid activation releasePath in ${activationPath}; an absolute release path is required`);
  }
  return activation;
}

function checkActiveReleaseMatchesCheckout(dir) {
  const guidance = 'B: npm run fgos:dev -- <verb> runs working-tree code. A: rebuild/stage, then fgctl upgrade --from <release> in this workspace to update plain fgos.';
  try {
    const checkout = path.resolve(dir);
    const marker = doctorDriftPath(checkout, 'apps/fgos/Cargo.toml', true);
    if (!marker) return { passed: true, status: 'skip', message: 'active-release-matches-checkout skipped: outside an fgOS source checkout (apps/fgos/Cargo.toml absent)' };
    if (!fs.statSync(marker).isFile()) throw new Error(`Source checkout marker is not a file: ${marker}`);

    const activation = doctorDriftActivation(checkout);
    const explicitRelease = process.env.FGOS_ACTIVE_RELEASE_PATH;
    let scopedEnv = {};
    // A dev wrapper binds this exact source checkout. An inherited installation
    // shim env may instead name main's release: it cannot override doctor's dir.
    if (explicitRelease && path.isAbsolute(explicitRelease) &&
        (path.resolve(explicitRelease) === checkout ||
         (activation && path.resolve(explicitRelease) === path.resolve(activation.releasePath)))) {
      scopedEnv = {
        FGOS_ACTIVE_RELEASE_PATH: explicitRelease,
        FGOS_ACTIVE_MANIFEST_PATH: process.env.FGOS_ACTIVE_MANIFEST_PATH,
      };
    } else if (!activation) {
      const main = resolveMainCheckout(checkout);
      if (main && path.resolve(main) !== checkout &&
          doctorDriftPath(main, '.fgos/installation/activation.json', true)) {
        return { passed: true, status: 'skip', message: `active-release-matches-checkout skipped: activation belongs to main checkout ${main}, not this linked worktree` };
      }
      return { passed: true, status: 'skip', message: 'active-release-matches-checkout skipped: no activation owned by doctor dir' };
    }

    const releasePath = scopedEnv.FGOS_ACTIVE_RELEASE_PATH ?? activation.releasePath;
    doctorDriftPath(releasePath);
    const manifestPath = scopedEnv.FGOS_ACTIVE_MANIFEST_PATH ??
      (scopedEnv.FGOS_ACTIVE_RELEASE_PATH && !doctorDriftPath(releasePath, 'manifest.json', true)
        ? path.join(releasePath, 'target', 'dev-manifest.json')
        : path.join(releasePath, 'manifest.json'));
    doctorDriftPath(releasePath, path.relative(path.resolve(releasePath), path.resolve(manifestPath)).replaceAll('\\', '/'));
    // Read strictly before invoking the resolver, whose older consumers tolerate
    // malformed manifests as a missing release. This check must report the error.
    JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const info = resolveActiveReleaseForDoctor(checkout, { candidateDirs: [checkout], env: scopedEnv });
    const manifest = info.manifest;
    if (!manifest || !Array.isArray(manifest.files)) throw new Error('Active release manifest must contain files[]');
    const rawRoot = manifest.components?.legacyNode?.root;
    if (typeof rawRoot !== 'string' || !rawRoot) throw new Error('Active release manifest missing components.legacyNode.root');
    if (rawRoot !== '.' && path.posix.normalize(rawRoot) !== rawRoot) {
      throw new Error(`Non-canonical legacyNode.root in active manifest: ${rawRoot}`);
    }
    const payloadRoot = doctorDriftPath(releasePath, rawRoot);
    if (rawRoot === '.' && payloadRoot === checkout) {
      return { passed: true, status: 'skip', message: 'active-release-matches-checkout skipped: development manifest uses this checkout directly (legacyNode.root=".")' };
    }
    if (!activation) {
      return { passed: true, status: 'skip', message: 'active-release-matches-checkout skipped: no activation owned by doctor dir (explicit manifest is not this checkout development payload)' };
    }

    const packagePath = doctorDriftPath(checkout, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    // Validate declared paths before the shared walker can traverse an
    // intermediate symlink (including an otherwise empty linked directory).
    for (const declared of Array.isArray(pkg.files) ? pkg.files : []) {
      doctorDriftPath(checkout, declared);
    }
    const sourceFiles = listLegacyNodeSourceFiles(checkout, () => createGitInspect(gitPortOptions(checkout))).filter((relative) =>
      relative !== 'node_modules' && !relative.startsWith('node_modules/'));
    const sourceSet = new Set(sourceFiles);
    const releaseSources = new Map();
    const manifestPaths = new Set();
    const prefix = rawRoot === '.' ? '' : rawRoot.replace(/\/+$/, '') + '/';
    for (const entry of manifest.files) {
      if (!entry || typeof entry.path !== 'string' || !entry.path ||
          entry.path.includes('\\') || path.posix.isAbsolute(entry.path) ||
          path.posix.normalize(entry.path) !== entry.path || entry.path.split('/').includes('..')) {
        throw new Error(`Non-canonical or escaping manifest files[] path: ${entry?.path}`);
      }
      if (entry.kind !== 'file' || typeof entry.digest !== 'string' || !/^sha256:[0-9a-f]{64}$/.test(entry.digest)) {
        throw new Error(`Invalid file kind or digest for manifest file ${entry.path}`);
      }
      if (manifestPaths.has(entry.path)) throw new Error(`Duplicate manifest file path: ${entry.path}`);
      manifestPaths.add(entry.path);
      const stagedPath = doctorDriftPath(releasePath, entry.path);
      if (!fs.statSync(stagedPath).isFile()) throw new Error(`Manifest entry is not a regular file: ${entry.path}`);
      if (prefix && !entry.path.startsWith(prefix)) continue;
      const relative = entry.path.slice(prefix.length);
      if (!relative || relative === 'node_modules' || relative.startsWith('node_modules/')) continue;
      const generatedShim = !sourceSet.has(relative) &&
        ((relative === 'bin/fgos' && entry.path === manifest.entries?.fgos) ||
         (relative === 'bin/fgos-runner' && entry.path === manifest.entries?.fgosRunner));
      if (generatedShim) continue;
      releaseSources.set(relative, entry.digest);
    }

    let changed = 0;
    let missing = 0;
    let extra = 0;
    const examples = [];
    const example = (kind, relative) => {
      if (examples.length < 5) examples.push(`${kind}: ${relative}`);
    };
    for (const relative of sourceFiles) {
      const sourcePath = doctorDriftPath(checkout, relative);
      const digest = hashFile(sourcePath);
      if (!releaseSources.has(relative)) {
        missing++;
        example('missing', relative);
      } else if (digest !== releaseSources.get(relative)) {
        changed++;
        example('changed', relative);
      }
    }
    for (const relative of [...releaseSources.keys()].sort()) {
      if (!sourceSet.has(relative)) {
        extra++;
        example('extra', relative);
      }
    }
    const passed = changed + missing + extra === 0;
    const metadata = `artifactDigest=${manifest.artifactDigest ?? activation.artifactDigest ?? 'unknown'}, activatedAt=${activation.activatedAt ?? 'unknown'}`;
    return {
      passed,
      message: `Node payload versus working tree: changed=${changed}, missing in release=${missing}, extra in release=${extra}; ${metadata}${examples.length ? `; examples: ${examples.join(', ')}` : ''}. Rust host/source freshness is not checked.${passed ? '' : ` ${guidance}`}`,
    };
  } catch (error) {
    return { passed: false, message: `active-release-matches-checkout could not safely compare Node payload: ${error.message}. ${guidance}` };
  }
}

registerCheck({
  id: 'rust-host-binary-present',
  description: 'the active release\'s entries.fgos binary exists and is executable',
  check: (cwd) => checkRustHostBinaryPresent(cwd),
});

registerCheck({
  id: 'rust-host-target-supported',
  description: 'current OS and architecture is an approved target for the fgos rust host (x86_64-unknown-linux-gnu, x86_64-pc-windows-msvc)',
  check: () => checkRustHostTargetSupported(),
});

registerCheck({
  id: 'legacy-node-payload-present',
  description: 'the legacy node payload components.legacyNode.root/entry resolves to a real file',
  check: (cwd) => checkLegacyNodePayloadPresent(cwd),
});

registerCheck({
  id: 'active-release-matches-checkout',
  description: 'activated legacy Node payload matches this source checkout working tree (not Rust freshness)',
  check: checkActiveReleaseMatchesCheckout,
});

const shortDigest = (digest) => String(digest).replace(/^sha256:/, '').slice(0, 12);

/**
 * The activation differs from the committed exact-digest pin: a warning, never a failure or a repair, because a
 * machine may run ahead of the pin on purpose. Reads the two files the way `pin_drift` in the distribution crate
 * does (a pin file that is not a pin is reported unreadable, an absent one skips) and prints the same lines; both are tested against one golden.
 */
export function checkActivationMatchesPin(cwd) {
  const root = resolveMainCheckoutRoot(cwd) ?? path.resolve(cwd);
  try {
    const readJson = (relative) => {
      const file = doctorDriftPath(root, relative, true);
      return file ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
    };
    const pinFile = doctorDriftPath(root, '.fgos/distribution.json', true);
    if (!pinFile) return { passed: true, status: 'skip', message: 'activation-matches-pin skipped: no committed pin' };
    let pinned;
    try { pinned = JSON.parse(fs.readFileSync(pinFile, 'utf8'))?.projectRuntime?.artifactDigest; } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
    }
    // A pin file that exists but is not a pin is not the same as no pin: say so.
    if (typeof pinned !== 'string') {
      return {
        passed: true,
        message: 'warning: the committed pin is unreadable: .fgos/distribution.json',
        fixCommand: 'restore .fgos/distribution.json from version control, or fgctl upgrade to write a new pin',
      };
    }
    const activation = readJson('.fgos/installation/activation.json');
    if (typeof activation?.artifactDigest !== 'string') return { passed: true, status: 'skip', message: 'activation-matches-pin skipped: no activation in this workspace' };
    if (activation.artifactDigest === pinned) return { passed: true, message: `active release matches the pin (${shortDigest(pinned)})` };
    const reason = typeof activation.pinOverrideReason === 'string' ? activation.pinOverrideReason : 'none';
    return {
      passed: true,
      message: `warning: active ${shortDigest(activation.artifactDigest)} != pin ${shortDigest(pinned)} (override: ${reason})`,
      fixCommand: 'fgctl init to follow the pin, or fgctl upgrade and commit the moved .fgos/distribution.json if you are ahead on purpose',
    };
  } catch (error) {
    return { passed: true, message: `warning: could not compare the activation with the pin: ${error.message}` };
  }
}

registerCheck({
  id: 'activation-matches-pin',
  description: 'the active release is the one the committed .fgos/distribution.json pin names (warns when it differs)',
  check: (cwd) => checkActivationMatchesPin(cwd),
});

// ─── Confinement Authority (Phase 01 R7, docs/platform/agent-confinement/README.md) ─

export function checkConfinementPoliciesDeclared(cwd) {
  let runner;
  try {
    runner = effectiveSection(cwd, 'runner');
  } catch (err) {
    return { passed: false, message: `runner config not readable: ${err.message}` };
  }
  if (!runner?.capabilities || typeof runner.capabilities !== 'object') {
    return { passed: true, message: 'no runner capabilities declared -- nothing to check' };
  }

  const customPolicies = runner.confinementPolicies || {};
  if (typeof customPolicies !== 'object' || Array.isArray(customPolicies)) {
    return { passed: false, message: 'runner.confinementPolicies must be an object' };
  }

  for (const [policyId, policyDoc] of Object.entries(customPolicies)) {
    try {
      validateConfinementPolicyShape(policyDoc);
    } catch (err) {
      return { passed: false, message: `custom confinement policy "${policyId}" is malformed: ${err.message}` };
    }
  }

  const undeclared = [];
  const missingAnchors = [];
  for (const [name, cap] of Object.entries(runner.capabilities)) {
    if (!cap || typeof cap !== 'object') continue;
    if (!cap.confinement) {
      missingAnchors.push(name);
    } else if (cap.confinement?.mode === 'unconfined') {
      continue;
    } else if (cap.confinement?.policy) {
      const policyId = cap.confinement.policy;
      if (!BUILTIN_POLICY_IDS.includes(policyId) && !customPolicies[policyId]) {
        undeclared.push(`capability "${name}" references unknown policy "${policyId}"`);
      }
    } else {
      missingAnchors.push(name);
    }
  }

  if (undeclared.length > 0) {
    return { passed: false, message: `undeclared confinement policies: ${undeclared.join('; ')}` };
  }

  const isStrict = Boolean(runner?.confinement?.strict);
  if (isStrict && missingAnchors.length > 0) {
    return { passed: false, message: `missing confinement anchors in strict mode: ${missingAnchors.join(', ')}` };
  }

  if (missingAnchors.length > 0) {
    return {
      passed: true,
      message: `all referenced capability confinement policies are declared; ${missingAnchors.length} capability/capabilities have no confinement anchor declared (${missingAnchors.join(', ')})`,
    };
  }

  return { passed: true, message: 'all capability confinement policies are declared' };
}

registerCheck({
  id: 'confinement-policies-declared',
  description: 'confinement policies referenced by capabilities exist in built-ins or runner.confinementPolicies',
  check: (cwd) => checkConfinementPoliciesDeclared(cwd),
});

export function checkConfinementBackendRegistryReadable() {
  const regPath = resolveMachineBackendRegistryPath();
  if (!fs.existsSync(regPath)) {
    return {
      passed: false,
      message: `machine backend registry not found at ${regPath} -- run fgos doctor --fix`,
    };
  }
  let parsed;
  try {
    const raw = fs.readFileSync(regPath, 'utf8');
    parsed = JSON.parse(raw);
  } catch (err) {
    return {
      passed: false,
      message: `machine backend registry at ${regPath} is not valid JSON: ${err.message}`,
    };
  }
  try {
    validateBackendRegistryShape(parsed);
  } catch (err) {
    return {
      passed: false,
      message: `machine backend registry at ${regPath} is malformed: ${err.message}`,
    };
  }
  const count = Object.keys(parsed.confinementBackends || {}).length;
  return {
    passed: true,
    message: `machine backend registry valid at ${regPath} (${count} backend(s) configured)`,
  };
}

export function fixConfinementBackendRegistryReadable() {
  const regPath = resolveMachineBackendRegistryPath();
  if (fs.existsSync(regPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(regPath, 'utf8'));
      validateBackendRegistryShape(parsed);
      return {
        changed: false,
        message: `machine backend registry already valid at ${regPath}`,
      };
    } catch {
      // Re-create default registry if malformed
    }
  }
  try {
    const res = ensureMachineBackendRegistryDefaults(regPath);
    return {
      changed: Boolean(res.created || res.changed),
      message: res.message ?? (res.created
        ? `created default machine backend registry at ${res.path}`
        : res.changed
          ? `repaired machine backend registry at ${res.path}`
          : `machine backend registry already valid at ${res.path}`),
    };
  } catch (err) {
    return {
      changed: false,
      message: `skipped -- ${err.message}`,
    };
  }
}

registerCheck({
  id: 'confinement-backend-registry-readable',
  description: 'machine backend registry file exists and conforms to confinement-backend-registry.v1 schema',
  check: () => checkConfinementBackendRegistryReadable(),
});

registerFix({
  id: 'confinement-backend-registry-readable',
  fix: () => fixConfinementBackendRegistryReadable(),
});

// ─── Confinement temp roots ────────────────────────────────────────────────
// A private home belongs to one attempt and only adopt's finalize-home step removes it (the
// `run-attempts-stuck` check names an attempt nobody holds). This check guards the roots they live under.

export { defaultConfinementTempRoots, credentialScanRoots };

/** Temp roots we own whose mode is not owner-only: a private home under one
 * holds a copy of an account login, so a group- or world-readable root is a
 * finding in its own right (counts only; never reads the contents). */
function looseConfinementRoots(roots) {
  const uid = typeof process.getuid === 'function' ? process.getuid() : null;
  const loose = [];
  for (const root of roots) {
    try {
      const st = fs.statSync(root);
      if ((uid === null || st.uid === uid) && (st.mode & 0o077) !== 0) loose.push(root);
    } catch { /* absent root: nothing to protect yet */ }
  }
  return loose;
}

export function checkConfinementOrphanedResourcesReaped() {
  // Read-only. A home of a dispatch outside the assignment door removes itself when that dispatch
  // settles; one whose process died is left for `doctor --fix`, since no sweep judges it. An attempt home
  // (version 2 marker) is adopt's and is named by `run-attempts-stuck`.
  const roots = defaultConfinementTempRoots();
  const deadOwned = deadOwnedConfinementDirs(roots).length;
  const loose = looseConfinementRoots(roots);
  const emptyShells = emptyDispatchShells(roots).length;
  if (deadOwned === 0 && emptyShells === 0 && loose.length === 0) return { passed: true, message: 'no orphaned confinement resources found under ' + roots.join(', ') };
  const problems = [];
  if (emptyShells > 0) problems.push(`${emptyShells} empty per-dispatch dir(s) left behind across ${roots.join(', ')}`);
  if (deadOwned > 0) problems.push(`${deadOwned} confinement resource dir(s) owned by a dead process across ${roots.join(', ')}`);
  if (loose.length > 0) problems.push(`confinement root(s) readable beyond the owner (should be 0700): ${loose.join(', ')}`);
  return { passed: false, message: `${problems.join('; ')} -- run "fgos doctor --fix"` };
}

/** How old an empty per-dispatch directory must be before it counts as left behind. */
const EMPTY_SHELL_GRACE_MS = 600000;

/** Empty per-dispatch directories old enough that no dispatch can still be about to fill them. */
function emptyDispatchShells(roots) {
  const found = [];
  for (const tempRoot of roots) {
    try {
      for (const entry of fs.readdirSync(tempRoot, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const dir = path.join(tempRoot, entry.name);
        if (fs.readdirSync(dir).length === 0 && Date.now() - fs.statSync(dir).mtimeMs > EMPTY_SHELL_GRACE_MS) found.push(dir);
      }
    } catch {
      // an unreadable or missing root has nothing to count
    }
  }
  return found;
}

function deadOwnedConfinementDirs(roots) {
  const found = [];
  for (const tempRoot of roots) {
    let entries = [];
    try { entries = fs.readdirSync(tempRoot, { withFileTypes: true }); } catch { continue; }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const dispatchDir = path.join(tempRoot, entry.name);
      const candidates = [dispatchDir];
      try {
        for (const sub of fs.readdirSync(dispatchDir, { withFileTypes: true })) {
          if (sub.isDirectory()) candidates.push(path.join(dispatchDir, sub.name));
        }
      } catch {}
      for (const cand of candidates) {
        // Only a marker of this module's own first version names a process owner.
        const marker = readOwnershipMarker(cand);
        if (!marker) continue;
        // A home held for its unstaged login is never removed; credential-copies-retained reports it.
        if ((marker.credentialKept?.attempts ?? 0) >= CREDENTIAL_KEEP_MAX_ATTEMPTS) continue;
        const alive = Number.isInteger(marker.pid) && marker.pid > 0 && resolveHolderLiveness({ pid: marker.pid }) !== 'dead';
        if (!alive) found.push({ dir: cand, dispatchId: marker.dispatchId });
      }
    }
  }
  return found;
}

export function fixConfinementOrphanedResourcesReaped() {
  const roots = defaultConfinementTempRoots();
  const tightened = looseConfinementRoots(roots);
  for (const root of tightened) {
    try { fs.chmodSync(root, 0o700); } catch { /* reported again by the check */ }
  }
  // A home whose recorded dispatcher process is dead holds a login copy nobody will remove: the owner's
  // explicit --fix is the one place that judges it, by that pid alone. A home that cannot go (a login
  // that could not be staged) stays and is counted by credential-copies-retained.
  let removedHomes = 0;
  for (const { dir, dispatchId } of deadOwnedConfinementDirs(roots)) {
    try { if (cleanupConfinementResource(dir, dispatchId).cleaned) removedHomes += 1; } catch { /* kept */ }
  }
  let removedShells = 0;
  for (const shell of emptyDispatchShells(roots)) {
    try { fs.rmdirSync(shell); removedShells += 1; } catch { /* filled meanwhile */ }
  }
  return {
    changed: removedHomes > 0 || removedShells > 0 || tightened.length > 0,
    message: [
      removedHomes > 0 ? `removed ${removedHomes} home(s) left by a dead dispatch` : '',
      removedShells > 0 ? `removed ${removedShells} empty per-dispatch dir(s)` : 'no empty per-dispatch dirs to remove',
      tightened.length > 0 ? `set ${tightened.join(', ')} to 0700` : '',
    ].filter(Boolean).join('; '),
  };
}

registerCheck({
  id: 'confinement-orphaned-resources-reaped',
  description: 'confinement temp roots are owner-only and no dispatch home is left behind by a dead process',
  check: () => checkConfinementOrphanedResourcesReaped(),
});

registerFix({
  id: 'confinement-orphaned-resources-reaped',
  fix: () => fixConfinementOrphanedResourcesReaped(),
});

// A login copy that outlives its dispatch holds a refresh token that may be the only valid one, so fgOS
// never deletes it on age alone; this check is how an owner learns one is still there. Read-only, counts
// and ages by provider/account; a held home is named by its directory. Never a token value.
const RETAINED_COPY_REPORT_AFTER_MS = 24 * 60 * 60 * 1000;

const formatAge = (ms) => (ms >= 48 * 3600 * 1000 ? `${Math.floor(ms / (24 * 3600 * 1000))}d` : `${Math.max(0, Math.floor(ms / 3600000))}h`);

function summarizeByAccount(items, label) {
  const groups = new Map();
  for (const item of items) {
    const key = `${item.provider}/${item.accountId}`;
    const group = groups.get(key) ?? { count: 0, oldestMs: 0 };
    group.count += 1;
    group.oldestMs = Math.max(group.oldestMs, item.ageMs);
    groups.set(key, group);
  }
  return [...groups].map(([key, g]) => `${key}: ${g.count} ${label}, oldest ${formatAge(g.oldestMs)}`);
}

// How the owner recovers a held home an older release left without its host record. Nothing fgOS reads from the
// home itself can name the account store (the confined agent wrote it), so the store is looked up in the host's
// own record of the attempt.
const HELD_HOME_RECOVERY = 'It may hold the only valid login of the account its attempt leased, and it has no host record, so nothing settles it by itself. '
  + 'Recover by hand: the attempt that made it ran from a run directory under the .fgos/assignments of its project, whose '
  + 'protected/confinement-finalization/<launch>.json names, on the resource whose pathRef is this home, the account store (credentialWriteBack.home); '
  + 'copy the home\'s login files (auth.json, or agent.db with any agent.db-wal and agent.db-journal) over that store only if their login expires later, then delete the home. '
  + 'Deleting the home without copying drops the login it holds.';

const UNFINALIZED_HOME_RECOVERY = 'It may hold the only valid login of the account its attempt leased. Recover by hand: '
  + 'protected/confinement-finalization/<launch>.json of that run directory, if it is still there, names on the resource whose pathRef is this home the account store (credentialWriteBack.home); '
  + 'copy the home\'s login files over that store only if their login expires later, then delete the home.';

// Attempt homes (version 2 marker) whose run directory has neither an envelope nor an attempt intent: the
// finalize-home step runs only from one of the two, so nothing will ever stage such a home's login or remove it.
function unfinalizableAttemptHomes(tempRoot) {
  const found = [];
  let dispatches = [];
  try { dispatches = fs.readdirSync(tempRoot, { withFileTypes: true }); } catch { return found; }
  for (const entry of dispatches) {
    if (!entry.isDirectory()) continue;
    const dispatchDir = path.join(tempRoot, entry.name);
    let subs = [];
    try { subs = fs.readdirSync(dispatchDir, { withFileTypes: true }).filter((sub) => sub.isDirectory()); } catch { continue; }
    for (const dir of [dispatchDir, ...subs.map((sub) => path.join(dispatchDir, sub.name))]) {
      const marker = readAttemptOwnershipMarker(dir);
      if (typeof marker?.runDir !== 'string' || typeof marker.attemptId !== 'string') continue;
      if (['envelope.json', 'attempt-intent.json'].some((name) => fs.existsSync(path.join(marker.runDir, name)))) continue;
      found.push({ dir, attemptId: marker.attemptId, runDir: marker.runDir });
    }
  }
  return found;
}

export function checkCredentialCopiesRetained({
  runtimeDir = defaultProviderCapacityRuntimeDir(),
  roots = credentialScanRoots(),
  retriedRoots = defaultConfinementTempRoots(),
  now = Date.now(),
  minAgeMs = RETAINED_COPY_REPORT_AFTER_MS,
  inventory,
  inventoryUnreadable,
} = {}) {
  // Without the provider inventory no store layout can be judged: every copy is listed at any age, and none
  // is said to wait for a dispatch, which could not run on a config that cannot be read either.
  const unjudged = inventory === undefined;
  const copies = inspectRetainedCredentialCopies({ runtimeDir, now, minAgeMs: unjudged ? 0 : minAgeMs, inventory });
  const stranded = copies.filter((c) => c.stranded);
  // A kept home under a root no reaper or dispatch retries (a registered backend's own root) never counts its
  // own attempts up, so it is held from the start: doctor fails naming it. A root nested inside another lists
  // a home twice; it is counted once.
  const retried = new Set(retriedRoots.map(canonicalRoot));
  const seenHomes = new Set();
  const firstSight = (home) => { const dir = path.join(canonicalRoot(path.dirname(home.dir)), path.basename(home.dir)); if (seenHomes.has(dir)) return false; seenHomes.add(dir); return true; };
  const homes = roots.flatMap((root) => listKeptCredentialHomes(root).map((home) => ({ ...home, held: home.held || !retried.has(canonicalRoot(root)) })))
    .filter(firstSight)
    .map((home) => ({ ...home, ageMs: home.since ? now - Date.parse(home.since) : 0 }));
  const held = homes.filter((home) => home.held);
  const retrying = homes.filter((home) => !home.held);
  const unfinalized = roots.flatMap(unfinalizableAttemptHomes).filter(firstSight);
  const overLimit = inspectPendingCopiesOverLimit({ runtimeDir, inventory });
  if (copies.length === 0 && homes.length === 0 && unfinalized.length === 0 && overLimit.length === 0) {
    return { passed: true, message: 'no login copy is being retained past its dispatch' };
  }
  // Each of these may hold the only valid refresh token, so none is ever deleted for its age. A held home is
  // a failure (nothing but the owner or a repair clears it); copies waiting for a renewal are a warning. A copy
  // in a store directory the account's layout no longer reads is never applied, so it fails like a held home
  // at any age, and it is only named, never applied to the new layout's stores or dropped.
  const unjudgedCopies = unjudged && copies.length + overLimit.length > 0;
  const problems = [
    ...(unjudgedCopies
      ? [
        `login store layout not checked: ${inventoryUnreadable ?? 'no provider account inventory was read'}`,
        ...overLimit.map((a) => `${a.provider}/${a.accountId}${a.store ? ` (store ${a.store})` : ''}: ${a.count} pending login copies, over the limit of ${MAX_PENDING_COPIES} (whether a dispatch re-checks them is not known until the provider inventory can be read; the limit drops only copies identical to another, never one that may be the only valid login)`),
        ...summarizeByAccount(copies.filter((c) => c.kind !== 'torn' && c.kind !== 'staging'), 'login copy(ies) kept (whether a dispatch applies them is not known until the provider inventory can be read)'),
      ]
      : []),
    ...(unjudgedCopies ? [] : overLimit).map((a) => (a.stranded
      ? `${a.provider}/${a.accountId}: ${a.count} pending login copies at ${a.storeDir}, over the limit of ${MAX_PENDING_COPIES}, in a directory the account's login store layout no longer reads (no dispatch re-checks or drops them; recover the logins by hand)`
      : `${a.provider}/${a.accountId}${a.store ? ` (store ${a.store})` : ''}: ${a.count} pending login copies waiting, over the limit of ${MAX_PENDING_COPIES} (the limit drops only copies identical to another, never one that may be the only valid login; a dispatch for that account re-checks them, and if the source stays unreadable recover the logins by hand)`)),
    ...strandedByStore(stranded.filter((c) => c.kind !== 'torn'), 'login copy(ies) that no dispatch applies'),
    ...strandedByStore(stranded.filter((c) => c.kind === 'torn'), 'half-written login copy(ies) kept for hand recovery'),
    ...(unjudgedCopies ? [] : summarizeByAccount(copies.filter((c) => c.kind !== 'torn' && c.kind !== 'set-aside' && c.kind !== 'staging' && c.kind !== 'agent' && !c.stranded), 'pending login copy(ies) waiting for a renewal (a dispatch for that account applies them)')),
    ...(unjudgedCopies ? [] : summarizeByAccount(copies.filter((c) => c.kind === 'agent' && !c.stranded), 'login copy(ies) renewed inside a private home (a dispatch for that account applies one once a renewal with its own refresh token returns a token signed for the leased account; one whose tokens name no signed account is never applied: recover it by hand or let it go)')),
    ...summarizeByAccount(copies.filter((c) => c.kind === 'staging' && !c.stranded), unjudged
      ? 'interrupted staging(s) of a login copy (a crash cut the copy short; "fgos doctor --fix" removes one that is empty or identical to a copy already kept, and cannot judge one against the source login of the account until the provider inventory can be read, any other stays for hand recovery)'
      : 'interrupted staging(s) of a login copy (a crash cut the copy short; "fgos doctor --fix" removes one that is empty, identical to a copy already kept, or shown by the source login of the account to be no newer, any other stays for hand recovery)'),
    ...summarizeByAccount(copies.filter((c) => c.kind === 'torn' && !c.stranded), 'half-written login copy(ies) kept for hand recovery (never applied or dropped automatically)'),
    ...summarizeByAccount(copies.filter((c) => c.kind === 'set-aside' && !c.stranded), 'login copy(ies) renewed inside a private home and set aside after renewals that returned nothing (never applied or retried: recover by hand or let it go)'),
    ...held.map((home) => `private home held ${home.attempts >= CREDENTIAL_KEEP_MAX_ATTEMPTS ? 'after repeated staging failures' : 'under a root that nothing retries by itself'}, ${formatAge(home.ageMs)} old, at ${home.dir}. ${home.record
      ? 'Its host record names where its login goes: "fgos doctor --fix", or the next attempt that ends under the same root, stages the login beside the account store and removes the home once that works.'
      : HELD_HOME_RECOVERY}`),
    ...(retrying.length > 0 ? [`${retrying.length} private home(s) kept after a staging failure, retried by the finalize-home step of their attempt, oldest ${formatAge(Math.max(...retrying.map((home) => home.ageMs)))}`] : []),
    ...unfinalized.map((home) => `private home of attempt ${home.attemptId} at ${home.dir}: its run directory ${home.runDir} has neither envelope.json nor attempt-intent.json, so no step will ever finalize it. ${UNFINALIZED_HOME_RECOVERY}`),
  ];
  const text = problems.join('; ');
  return held.length > 0 || unfinalized.length > 0 || stranded.length > 0 || overLimit.some((a) => a.stranded) || unjudgedCopies ? { passed: false, message: text } : { passed: true, message: `warning: ${text}` };
}

function strandedByStore(copies, what) {
  const groups = new Map();
  for (const copy of copies) {
    const group = groups.get(copy.storeDir) ?? { provider: copy.provider, accountId: copy.accountId, count: 0, oldestMs: 0 };
    group.count += 1;
    group.oldestMs = Math.max(group.oldestMs, copy.ageMs);
    groups.set(copy.storeDir, group);
  }
  return [...groups].map(([dir, g]) => `${g.provider}/${g.accountId}: ${g.count} ${what}, oldest ${formatAge(g.oldestMs)}, at ${dir} (the account's login store layout in the provider inventory no longer reads this directory; recover the login from them by hand, they are never applied or dropped automatically)`);
}

/**
 * The machine-global provider account inventory the doctor judges store layouts by: `{ inventory }`, or
 * `{ inventoryUnreadable }` with the reason when the global config cannot be read or is invalid. The
 * inventory lives only in the global config, so this never depends on the directory doctor runs in.
 */
export function readDoctorProviderInventory() {
  // The reason is the door's own message (file, position, path, never a value) or only an error code or class: a parse
  // or validator message of another origin could quote part of a file.
  let runner;
  try {
    runner = machineRunner();
  } catch (err) {
    return { inventoryUnreadable: `machine config unreadable (${isConfigDoorFailure(err) ? err.message : err?.code ?? err?.name ?? 'error'})` };
  }
  try {
    return { inventory: providerAccountInventory(runner) };
  } catch (err) {
    return { inventoryUnreadable: `machine config refused by the provider inventory validator (${err?.code ?? err?.name ?? 'error'})` };
  }
}

// What an interrupted staging is judged against: the source login of the store it sits in, `'stranded'` when the
// account's layout in the inventory no longer reads that store, `null` when it cannot be judged.
function stagingStoreResolver(inventory, runtimeDir) {
  if (inventory === undefined) return undefined;
  return ({ provider, accountId, store }) => {
    const account = inventoryAccount(inventory, provider, accountId);
    if (!account) return 'stranded';
    const source = store ? (account.credentialSources && Object.hasOwn(account.credentialSources, store) ? account.credentialSources[store] : undefined) : (account.credentialSources ? undefined : account.credentialSource);
    if (!source) return 'stranded';
    const target = credentialWriteBackTarget({ provider, accountId, credentialSource: source, runtimeDir });
    return target ? { layoutName: target.layout, sourceHome: target.home } : null;
  };
}

// A held private home is settled only from its host record beside it; one without a record (an older release)
// is recovered by hand, since the home's own marker is the agent's word.
export function fixCredentialCopiesRetained({ roots = credentialScanRoots(), retriedRoots = defaultConfinementTempRoots(), inventory, stagingRuntimeDir = defaultProviderCapacityRuntimeDir() } = {}) {
  const stagings = sweepInterruptedStagings({ runtimeDir: stagingRuntimeDir, resolveStore: stagingStoreResolver(inventory, stagingRuntimeDir) });
  const retried = new Set(retriedRoots.map(canonicalRoot));
  const { settled, held } = settleHeldCredentialHomes({ tempRoots: roots, unretriedRoots: roots.filter((root) => !retried.has(canonicalRoot(root))) });
  const homes = settled + held === 0
    ? 'no held private home to settle'
    : `held private home(s): ${settled} settled, ${held} still held (one without a host record is recovered by hand)`;
  const staged = stagings.removed + stagings.kept === 0 ? '' : `; interrupted staging(s): ${stagings.removed} removed, ${stagings.kept} kept for hand recovery`;
  return { changed: settled > 0 || stagings.removed > 0, message: `${homes}${staged}` };
}

registerCheck({
  id: 'credential-copies-retained',
  description: 'no login copy (pending, scratch, or a kept private home) that may hold the only valid refresh token is left unapplied',
  check: () => checkCredentialCopiesRetained(readDoctorProviderInventory()),
});

registerFix({
  id: 'credential-copies-retained',
  fix: () => fixCredentialCopiesRetained({ inventory: readDoctorProviderInventory().inventory }),
});

export function checkConfinementBwrapPlatform() {
  let registry;
  try {
    registry = loadMachineBackendRegistry();
  } catch (err) {
    return {
      passed: false,
      message: `bwrap backend status: machine registry not readable or malformed (${err.message})`,
    };
  }

  const bwrapBackend = registry.confinementBackends?.bwrap;
  if (!bwrapBackend) {
    return {
      passed: false,
      message: 'bwrap backend status: not configured in machine registry',
    };
  }

  if (bwrapBackend.enabled === false) {
    return {
      passed: true,
      message: 'bwrap backend status: disabled in machine registry',
    };
  }

  if (os.platform() !== 'linux') {
    return {
      passed: false,
      message: `bwrap backend status: unavailable (platform "${os.platform()}" is not Linux)`,
    };
  }

  const binaryPath = bwrapBackend.executable || 'bwrap';
  const probe = checkBwrapAvailable(binaryPath);
  if (!probe.passed) {
    return {
      passed: false,
      message: `bwrap backend status: unavailable (binary "${binaryPath}" failed smoke test: ${probe.message})`,
    };
  }

  return {
    passed: true,
    message: `bwrap backend status: ready (Linux, binary "${binaryPath}" working, enabled)`,
  };
}

registerCheck({
  id: 'confinement-bwrap-platform',
  description: 'bwrap backend instance configured in machine registry is enabled and its executable is verified on Linux',
  check: () => checkConfinementBwrapPlatform(),
});

export function checkConfinementProbeFreshness() {
  let registry;
  try {
    registry = loadMachineBackendRegistry();
  } catch (err) {
    return {
      passed: false,
      message: `confinement probe freshness: machine registry not readable (${err.message})`,
    };
  }

  const bwrapBackend = registry.confinementBackends?.bwrap;
  if (!bwrapBackend || bwrapBackend.enabled === false) {
    return {
      passed: true,
      message: 'confinement probe freshness: bwrap backend is disabled or not configured in machine registry',
    };
  }

  if (os.platform() !== 'linux') {
    return {
      passed: true,
      status: 'skip',
      message: `confinement probe freshness: platform "${os.platform()}" is not Linux (bwrap probes skipped)`,
    };
  }

  const binaryPath = bwrapBackend.executable || 'bwrap';
  const probeResult = runAllConfinementProbes({ bwrapBin: binaryPath });
  if (!probeResult.passed) {
    return {
      passed: false,
      message: `confinement probe freshness: failing or stale probe detected: ${probeResult.message}`,
    };
  }

  return {
    passed: true,
    message: `confinement probe freshness: all ${probeResult.results.length} local-bwrap-v1 probes passed (fresh)`,
  };
}

registerCheck({
  id: 'confinement-probe-freshness',
  description: 'confinement probe freshness status (runs the falsification probe harness against the registered bwrap backend)',
  check: () => checkConfinementProbeFreshness(),
});

// A blind unit is refused, never run unblind, when its backend cannot keep a worker from
// reading peer run state. This row says which of those a machine is in: pass, fail (the probe
// ran and failed), or backend-unsupported (no enabled bwrap backend on Linux, so every blind
// unit is refused, which is by design and not a fault of an install that runs none).
export function checkConfinementBlindRead() {
  let registry;
  try {
    registry = loadMachineBackendRegistry();
  } catch (err) {
    return { passed: false, message: `blind-read: fail (machine registry not readable: ${err.message})` };
  }

  const bwrapBackend = registry.confinementBackends?.bwrap;
  if (!bwrapBackend || bwrapBackend.enabled === false) {
    return { passed: true, message: 'blind-read: backend-unsupported (no enabled bwrap backend; blind units are refused)' };
  }
  if (os.platform() !== 'linux') {
    return { passed: true, message: `blind-read: backend-unsupported (platform "${os.platform()}" is not Linux; blind units are refused)` };
  }

  const binaryPath = bwrapBackend.executable || 'bwrap';
  const available = checkBwrapAvailable(binaryPath);
  if (!available.passed) {
    return { passed: true, message: `blind-read: backend-unsupported (bwrap "${binaryPath}" is not usable: ${available.message}; blind units are refused)` };
  }

  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-blind-probe-'));
  try {
    const result = probePeerRunHidden({ bwrapBin: binaryPath, scratchDir: scratch });
    return result.passed
      ? { passed: true, message: 'blind-read: pass (a blind worker cannot read a peer run, home or process)' }
      : { passed: false, message: `blind-read: fail (${result.detail})` };
  } finally {
    fs.rmSync(scratch, { recursive: true, force: true });
  }
}

registerCheck({
  id: 'confinement-blind-read',
  description: 'a blind unit can be enforced: the registered bwrap backend hides peer run state, homes and processes from a worker',
  check: () => checkConfinementBlindRead(),
});

export function checkConfinementStrictReadiness(cwd) {
  let runner;
  try {
    runner = effectiveSection(cwd, 'runner');
  } catch (err) {
    return { passed: false, message: `runner config not readable: ${err.message}` };
  }

  const isStrict = Boolean(runner?.confinement?.strict);
  const missing = [];
  const invalid = [];
  const capabilities = runner?.capabilities;
  const customPolicies = runner?.confinementPolicies || {};

  if (!capabilities || typeof capabilities !== 'object' || Object.keys(capabilities).length === 0) {
    missing.push('no capabilities declared');
  } else {
    for (const [name, cap] of Object.entries(capabilities)) {
      if (!cap || typeof cap !== 'object') {
        invalid.push(`capability "${name}" is malformed`);
        continue;
      }
      if (cap.confinement?.mode === 'unconfined') continue;
      const policyId = cap.confinement?.policy;
      if (!policyId) {
        missing.push(`capability "${name}" missing confinement policy`);
      } else if (!BUILTIN_POLICY_IDS.includes(policyId) && !customPolicies[policyId]) {
        invalid.push(`capability "${name}" references unknown policy "${policyId}"`);
      }
    }
  }

  const bwrapResult = checkConfinementBwrapPlatform();
  const bwrapReady = bwrapResult.passed && bwrapResult.message.includes('ready');

  if (invalid.length > 0) {
    return {
      passed: false,
      message: `strict confinement not ready: ${[...missing, ...invalid].join('; ')}`,
    };
  }

  if (missing.length > 0) {
    if (isStrict) {
      return {
        passed: false,
        message: `strict confinement not ready: ${missing.join('; ')}`,
      };
    }
    return {
      passed: true,
      message: `warning: strict confinement disabled (${missing.join('; ')})`,
    };
  }

  if (!bwrapReady) {
    if (isStrict) {
      return {
        passed: false,
        message: `strict confinement not ready: bwrap not ready (${bwrapResult.message})`,
      };
    }
    return {
      passed: true,
      message: `warning: strict confinement disabled; bwrap not ready (${bwrapResult.message})`,
    };
  }

  return {
    passed: true,
    message: 'strict confinement readiness satisfied (all capabilities declare valid policies and bwrap backend is ready)',
  };
}

registerCheck({
  id: 'confinement-strict-readiness',
  description: 'strict confinement readiness (all capabilities declared with known policies, bwrap ready)',
  check: (cwd) => checkConfinementStrictReadiness(cwd),
});

export function checkConfinementHerdrMaturity(cwd) {
  let runner;
  try {
    runner = effectiveSection(cwd, 'runner');
  } catch (err) {
    return { passed: true, status: 'skip', message: `runner config not readable, herdr maturity check skipped: ${err.message}` };
  }
  const executors = runner?.executors || {};
  const herdrExecutors = Object.entries(executors)
    .filter(([_, exec]) => {
      if (!exec || typeof exec !== 'object') return false;
      const invocation = resolveCliInvocation(exec);
      return invocation.adapter === 'herdr-spawn';
    });

  if (herdrExecutors.length === 0) {
    return {
      passed: true,
      maturity: 'not-applicable',
      message: 'herdr confinement maturity: not applicable (no herdr-spawn executors configured)',
    };
  }

  // Validate bypass pairing on herdr executors
  const invalidBypass = [];
  for (const [id, exec] of herdrExecutors) {
    if (exec.permissionMode === 'bypass') {
      const conf = exec.confinement;
      const normalized = conf ? normalizeLegacyConfinement(conf) : null;
      const hasWorkspace = Boolean(normalized?.controls?.workspace === 'own' || conf?.ownWorktree);
      const hasHome = Boolean(normalized?.controls?.home === 'private' || conf?.privateHome);
      const hasSession = Boolean(normalized?.controls?.session === 'isolated' || conf?.isolatedSession);
      if (!hasWorkspace || !hasHome || !hasSession) {
        invalidBypass.push(id);
      }
    }
  }

  if (invalidBypass.length > 0) {
    return {
      passed: false,
      maturity: 'invalid',
      message: `herdr confinement maturity check failed: executors declare bypass without full confinement (${invalidBypass.join(', ')})`,
    };
  }

  return {
    passed: true,
    maturity: 'partial',
    message: `herdr confinement maturity: partial (${herdrExecutors.length} herdr-spawn executor(s); pre-adapter validation under Authority, session/home lifecycle in adapter)`,
  };
}

registerCheck({
  id: 'confinement-herdr-maturity',
  description: 'herdr confinement convergence maturity status (partial: pre-adapter checks under Authority, session/home lifecycle adapter-managed)',
  check: (cwd) => checkConfinementHerdrMaturity(cwd),
});

// ─── Observe Component (Phase F8, plans/260929-1501-metrics-friction-rust-native) ─

export function checkObserveDirWritable(cwd) {
  const root = resolveMainCheckoutRoot(cwd) ?? cwd;
  const observeDir = path.join(root, '.fgos', 'observe');
  try {
    // The observe store creates its own directory on first write; a read-only check never does.
    if (!fs.existsSync(observeDir)) {
      return { passed: true, message: 'info: .fgos/observe does not exist yet; the observe store creates it on first write' };
    }
    const probeFile = path.join(observeDir, `.probe-${process.pid}-${Date.now()}`);
    fs.writeFileSync(probeFile, 'ok', 'utf8');
    fs.unlinkSync(probeFile);
    return { passed: true, message: '.fgos/observe is writable' };
  } catch (err) {
    return { passed: false, message: `.fgos/observe is not writable: ${err.message}` };
  }
}

export function checkObserveHostResolvable(cwd) {
  const hostBin = resolveHostBin(cwd);
  if (!hostBin) {
    return {
      passed: false,
      message: 'host binary unavailable (FGOS_HOST_BIN unset and no active installation manifest)',
    };
  }

  // A real read of the friction store, so a store the host refuses (a symlinked
  // directory or shard, an I/O error) fails the row instead of passing on a ping.
  try {
    invokeHost(['friction', 'rank', '--limit', '1'], { dir: cwd });
    return {
      passed: true,
      message: `host binary at ${hostBin} resolved and verified (friction store readable)`,
    };
  } catch (err) {
    return {
      passed: false,
      message: `host binary at ${hostBin} failed the friction read probe: ${err.message}`,
    };
  }
}

registerCheck({
  id: 'observe-dir-writable',
  description: '.fgos/observe directory is writable',
  check: (cwd) => checkObserveDirWritable(cwd),
});

registerCheck({
  id: 'observe-host-resolvable',
  description: 'Rust host binary resolves and reads the friction store (friction rank)',
  check: (cwd) => checkObserveHostResolvable(cwd),
});

/**
 * The writer identity resolves through the Rust host on both doors a write
 * can come through: the normal one (FGOS_HOST_BIN when run via the `fgos`
 * host) and the one a plain `git commit` hook takes (the workspace
 * activation, ignoring FGOS_HOST_BIN). Each binary is asked directly, never
 * through the facade's cache, so an old activated release shows up as a
 * version mismatch even when the host running doctor is newer.
 */
export function checkWriterIdentityResolvable(cwd) {
  const root = resolveMainCheckoutRoot(cwd) ?? cwd;
  const fgosDir = path.join(root, '.fgos');
  const hasActivation = fs.existsSync(path.join(fgosDir, 'installation', 'activation.json'));
  const parts = [];
  let failure = null;
  for (const [door, ignoreEnv] of [['current host', false], ['activation (git commit hook)', true]]) {
    const { bin, tried } = resolveActiveHostBin({ fgosDir, cwd, ignoreEnv });
    if (!bin) {
      if (ignoreEnv && !hasActivation) {
        parts.push(`${door}: no activation in ${root} (a plain git commit at home cannot resolve a writer)`);
        continue;
      }
      failure ??= `${door}: no host binary (tried ${tried.join('; ')}) -- run fgctl init/repair, or set FGOS_HOST_BIN`;
      continue;
    }
    try {
      const { id, source } = probeIdentity(bin, fgosDir);
      parts.push(`${door}: ${bin} -> ${JSON.stringify({ id, source })}`);
    } catch (err) {
      failure ??= `${door}: ${bin} -> ${err.code ?? 'error'}: ${err.message}`;
    }
  }
  if (failure) return { passed: false, message: [failure, ...parts].join(' | ') };
  return { passed: true, message: parts.join(' | ') };
}

registerCheck({
  id: 'writer-identity-resolvable',
  description: 'the writer identity resolves through the Rust host, both for the running host and for the activation a plain git commit hook uses',
  check: (cwd) => checkWriterIdentityResolvable(cwd),
});

registerCheck({
  id: 'identity-machine-id',
  description: 'this machine has an id minted by the Identity component (the base of every machine and session handle); absent only warns, `fgos doctor --fix` mints it',
  check: (cwd) => checkIdentityMachineId(cwd),
});
registerFix({ id: 'identity-machine-id', fix: (cwd) => fixIdentityMachineId(cwd) });

registerCheck({
  id: 'identity-machine-key',
  description: 'this machine has an ed25519 signing key minted by the Identity component (what signs for MAIL and the shared directory); absent only warns, `fgos doctor --fix` mints it once and never replaces it',
  check: (cwd) => checkIdentityMachineKey(cwd),
});
registerFix({ id: 'identity-machine-key', fix: (cwd) => fixIdentityMachineKey(cwd) });

registerCheck({
  id: 'identity-ssh-keygen',
  description: 'ssh-keygen from OpenSSH 8.1 or later is installed: the Identity component signs and verifies through it (no crypto library of its own); no fix, install OpenSSH',
  check: () => checkIdentitySshKeygen(),
});

registerCheck({
  id: 'identity-project-id',
  description: 'this repository carries one project id in the tracked file .fgos/project.json, the same in every clone; absent only warns, and there is no fix: run `fgos identity project --init` once on one machine, commit, pull elsewhere',
  check: (cwd) => checkIdentityProjectId(cwd),
});

registerCheck({
  id: 'identity-shared-directory',
  description: 'the shared directory of other machines\' sessions, read from its cache (.fgos/cache/identity-directory.json): passes with the counts; warns on entries dropped for a bad signature or a changed key (naming the machine id), on entries of another project than this clone\'s, and on a machine handle two machines share; no fix, the owner decides',
  check: (cwd) => checkIdentitySharedDirectory(cwd),
});

/**
 * The host Seat Binding would run (the same resolution the client uses:
 * the activation host inside an activated release, FGOS_HOST_BIN outside one)
 * answers `ladder` with protocol 1. Asked directly, never through the client's
 * cached host, so an old activated release shows up as a version mismatch.
 */
export function checkSeatBindingRoute(cwd, { hostBin } = {}) {
  const root = resolveMainCheckoutRoot(cwd) ?? cwd;
  const fgosDir = path.join(root, '.fgos');
  const { bin, tried, activated } = hostBin
    ? { bin: hostBin, tried: [], activated: false }
    : resolveSeatBindingHost({ cwd, fgosDir });
  if (!bin) {
    return { passed: false, message: `no host binary for the seat binding route (tried ${tried.join('; ')}) -- run fgctl init/repair, or set FGOS_HOST_BIN` };
  }
  try {
    const ladder = createSeatBindingClient({ hostBin: bin }).tierLadder();
    return {
      passed: true,
      message: `${bin} (${activated ? 'activation host' : 'host in reach'}) answers ladder at protocol 1, hostVersion ${ladder.hostVersion}, ${ladder.vocabulary.length} tiers`,
    };
  } catch (err) {
    return { passed: false, message: `${bin} -> ${err.code ?? 'error'}: ${err.message}` };
  }
}

registerCheck({
  id: 'seat-binding-route',
  description: 'the host Seat Binding runs answers the internal seat-binding route at protocol 1',
  check: (cwd) => checkSeatBindingRoute(cwd),
});

// Event Store: one setup fix and four doctor rows (`event-store-incidents` is a read-only pointer to `fgos events status`). A doctor run builds one `eventStoreDoctor`
// (its lazy store snapshot is read at most once) and every row asks it; a row called without a run gets a private one.
registerFix({ id: 'event-store-lock-dirs', fix: cwd => fixEventStoreLockDirs(cwd) });
for (const name of ['open-root', 'machine-id', 'legacy-layout', 'incidents']) {
  const id = `event-store-${name}`;
  registerCheck({ id, description: `Event Store ${name}`, check: (cwd, run = createDoctorRun()) => eventStoreDoctorOf(cwd, run)(id) });
}

// Git and Event Store share one addon ABI admission row.
for (const id of ['git-component-compatible', 'git-repository-config', 'git-operation-journal', 'git-incidents']) {
  registerCheck({ id, description: {
    'git-component-compatible': 'Combined addon contracts and Git feature floor, with the repository layout and measured durability',
    'git-repository-config': 'Repository transport settings refused by Publication/Remote, and the Event Store mirror fetch mappings',
    'git-operation-journal': 'Readable Git WAL under the controller activation fence (`git-fence-missing` when the fence is gone); open operations are `git-incidents`',
    'git-incidents': 'read-only pointer: open Git incidents, read and recovered through fgos git status / fgos git recover',
  }[id], check: (cwd, run = createDoctorRun()) => checkGit(cwd, id, undefined, run) });
}
// Workflow case bindings (docs/platform/workflow/spec.md#6-business-rules RUL-WF-27): the binding records are a view of each
// case's ledger. Bodies live in workflow-case-checks.mjs.
registerCheck({
  id: 'workflow-case-binding-sentinel',
  description: 'the worktree binding directory carries the host sentinel that tells a reader it is not a masked view',
  check: (cwd) => checkWorkflowCaseBindingSentinel(cwd),
});
registerCheck({
  id: 'workflow-case-bindings',
  description: 'every worktree binding record matches the ledger of its case, and every bound open case has its record',
  check: (cwd) => checkWorkflowCaseBindings(cwd),
});
registerFix({ id: 'workflow-case-bindings', fix: (cwd) => fixWorkflowCaseBindings(cwd) });
registerFix({ id: 'git-driver-directories', fix: fixGitDriverDirectories });
registerFix({ id: 'git-wal-dir', fix: fixGitWal, repairs: ['git-operation-journal'] });
registerFix({ id: 'git-publication-refspecs', fix: fixGitFetchMapping, repairs: ['git-repository-config'] });
