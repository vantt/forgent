import { createGitInspect, gitPortOptions } from '../git/inspect.mjs';
import { resolveHolderLiveness } from '../runner/dispatch/process-identity.mjs';
import { checkGit, checkMutationOneDoor, gitFloor, fixGitWal, fixGitFetchMapping, fixGitDriverDirectories, fixGitOperationRecovery } from './git-checks.mjs';
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
import { isDeepStrictEqual } from 'node:util';

import { detectRcFiles, hasSourceLine, deadSourceLines, probeShellIntegrationInvocation } from './shell-rc.mjs';
import { releaseBinaryPath } from '../util/release-binary-path.mjs';
import { RELEASE_TARGETS, releaseTargetForHost } from '../util/release-targets.mjs';
import { hashFile, listLegacyNodeSourceFiles } from '../../scripts/build-rust-distribution.mjs';
import { compileDomain } from '../../scripts/build-domain-registry.mjs';
import { mainCheckoutHookWired } from './git-hooks.mjs';
import { loadRunnerConfigForDir } from '../runner/dispatch/config.mjs';
import { agentShapeProblem, findAgentDuplicates, readAgentDefinition, scanAgentTiers } from '../runner/agent-definitions.mjs';
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
import { mailboxOptIn, refusedConfigName } from './mailbox-limits.mjs';
import { checkAgentCliProjectTrusted } from './agent-cli-trust.mjs';
import {
  loadWorkflowDefinitions,
  readWorkflowDefinitionFiles,
  withUnreadableDefinitions,
  workflowRoots,
} from './workflow-definition-files.mjs';
import {
  checkExecutorFamilyUnique,
  checkExecutorSkillsInstalled,
  checkTierFallback,
  checkModelPolicyPools,
  checkLlmAccountsShape,
  checkLlmAccountsVsLegacy,
  checkGlobalModelPoliciesPortable,
} from './model-pool-checks.mjs';
import { checkBlindStepsUseProvenPools } from './blind-steps-proven-pools.mjs';
import { checkExecutorPostureCoverage } from './executor-posture-coverage.mjs';
import { checkAgyPermissionsConfigured, checkAgySubHomesConfigured, fixAgyPermissionsConfigured } from './agy-permissions.mjs';
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
import { readOwnershipMarker, cleanupConfinementResource, canonicalRoot, listKeptCredentialHomes, settleHeldCredentialHomes, CREDENTIAL_KEEP_MAX_ATTEMPTS } from '../runner/dispatch/confinement/cleanup.mjs';

import { MODEL_POLICY_TIERS, validateCapabilityServesShape, validateGeneratedPathsShape, validateRunnerLoopsShape, RunnerConfigError } from '../runner/dispatch/config.mjs';
import { shippedCatalog, catalogLayersOf } from '../runner/dispatch/shipped-catalog.mjs';
import { checkCatalog } from '../runner/execution/patterns/catalog.mjs';
import { deepEqual } from '../runner/execution/patterns/catalog-entries.mjs';
import { RETIRED_CONFIG_KEYS } from '../runner/dispatch/retired-config-keys.mjs';
import { RIGOR_VALUES } from '../runner/rigor.mjs';
import { resolveExecutorAndOverrides, deriveProviderFamily } from '../runner/dispatch/resolve.mjs';
import { resolveMainCheckoutRoot } from '../runner/paths.mjs';
import { capabilityEntriesOf, hasUsablePrefer } from '../runner/execution/seat-resolver.mjs';
import { detectTrunk } from '../runner/worktree.mjs';
import { listWork, StoreError } from '../state/store.mjs';
import { driftStatus, unmergedDeliveries } from '../state/drift-status.mjs';
import { postLandDrift } from '../state/postland-drift.mjs';
import { computeEnduserDocsIndex, generateEnduserDocsIndex, manifestPathFor } from '../report/enduser-index-generate.mjs';
import { computeDecisionIndex, generateDecisionIndex, indexPathFor } from '../report/decision-index.mjs';
import { isResolvedStatus } from '../state/frontier.mjs';
import { DOMAINS, getDomain, resolveDomainName, effectiveStep, domainSteps, skillForStep } from '../state/domain-registry.mjs';
import { resolveTaskSpecPath } from '../runner/paths.mjs';
import { stepById } from '../workflow/steps.mjs';
import { readLocalStatus, classifyRegistryPosture, toolsFromExecutors } from '../state/tool-registry.mjs';
import { resolveCliVersionInfo } from '../cli/version.mjs';
import { firstOnPath, inspectLauncher, writeLauncher } from './project-launcher.mjs';
import { checkConfig, readConfig, readMachineConfig } from '../config/facade.mjs';
import { CONFIG_CHECKS, CONFIG_FIXES, isConfigDoorFailure } from './config-checks.mjs';
import { inspectProviderCapacity, defaultProviderCapacityRuntimeDir, providerAccountInventory, credentialStoreOf, credentialSourceForCli } from '../runner/dispatch/provider-capacity.mjs';
import { normalizeProviderFamily } from '../runner/dispatch/provider-adapter.mjs';
import { inspectRetainedCredentialCopies, inspectPendingCopiesOverLimit, sweepInterruptedStagings, credentialWriteBackMarker, inventoryAccount, MAX_PENDING_COPIES } from '../runner/dispatch/provider-credential-renewal.mjs';
import { resolveHerdrBin } from '../runner/dispatch/transport.mjs';
import { createTerminalControl } from '../terminal-control/client.mjs';
import { readCodexTrust, readAgyStore, defaultAgySettingsPath } from '../runner/dispatch/trust-store.mjs';
import { resolveFgosBin, refreshGlobalBinCache } from './bin-discovery.mjs';
import { DEFAULT_WORKER_SLOT_CEILING } from '../state/worker-slots.mjs';
import { computeKnowledgeProjection } from '../report/knowledge-projection.mjs';
import { eventStoreDoctor } from './event-store-checks.mjs';
import { fixEventStoreLockDirs } from './event-store-fixes.mjs';
import { foldEvents } from '../state/replay.mjs';
import { resolveDocPath } from '../report/knowledge-resolver.mjs';
import { isLiveDocLifecycle } from '../state/knowledge-registry.mjs';
import { findDuplicateAuthoritativeClaims } from '../report/authoritative-match.mjs';
import { parseFrontmatter } from '../report/frontmatter.mjs';
import { POLICY_PATCH_FIELDS } from '../runner/dispatch/execution-contract.mjs';
import { discoverOperationPromptTemplates, TemplateResolutionError } from '../runner/dispatch/operation-prompt-templates.mjs';
import { resolveHostBin, invokeHost } from '../util/host-bin.mjs';
import { resolveActiveHostBin } from '../util/host-bin-path.mjs';
import { probeIdentity } from '../util/session-identity.mjs';
import { createSeatBindingClient, resolveSeatBindingHost } from '../seat-binding/client.mjs';
import { checkSeatBindingDryBind } from './seat-binding-checks.mjs';
import { listAssignmentRuns, scanAssignmentLayout } from '../runner/dispatch/assignment-layout.mjs';
import { conventionCheck } from '../convention/convention-client.mjs';
import { checkRunSupervisorRoute, checkProcessContainment, checkRuntimeSocketDir, fixRuntimeSocketDir, checkRunAttemptsStuck, fixRunAttemptsStuck, checkGateKillGrace, checkLegacyAttemptsStuck, fixLegacyAttemptsStuck, checkUnitsAwaitingResume, checkCancelWait } from './run-supervisor-checks.mjs';
import { recoverApplyUseCase, recoverObserveUseCase } from '../verbs/dispatch/recover.mjs';
import { checkIdentityIdsUnique, checkIdentityMachineId, checkIdentityMachineKey, checkIdentityPinnedMachines, checkIdentityProjectId, checkIdentitySharedDirectory, checkIdentitySshKeygen, fixIdentityMachineId, fixIdentityMachineKey } from './identity-checks.mjs';
import { checkTerminalControl, checkTerminalAllocations } from './terminal-control-checks.mjs';
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
 */
export function registerFix({ id, fix }) {
  if (typeof id !== 'string' || !id.trim()) {
    throw new Error('registerFix requires a non-empty id');
  }
  if (FIX_REGISTRATIONS.some((entry) => entry.id === id)) {
    throw new Error(`registerFix: "${id}" is already registered`);
  }
  if (typeof fix !== 'function') {
    throw new Error(`registerFix("${id}") requires a fix function`);
  }
  FIX_REGISTRATIONS.push({ id, fix });
}

/**
 * Run every registered fix against `cwd` (`fgos doctor --fix`'s own write
 * path — the one place doctor writes, gated behind the explicit `--fix`
 * flag; without it doctor stays exactly as before). Each fix's own
 * `{changed, message}` is reported per entry, mirroring `DOCTOR_CHECKS`'
 * per-entry `{passed, message}` report shape.
 */
export function runFixes(cwd) {
  return FIX_REGISTRATIONS.map(({ id, fix }) => {
    try {
      const { changed, message } = fix(cwd);
      return { id, changed, message };
    } catch (error) { return { id, changed: false, message: error.message }; }
  });
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

function checkNodeAndGit(cwd) {
  const major = parseInt(process.version.slice(1).split('.')[0], 10);
  if (Number.isNaN(major) || major < MIN_NODE_MAJOR) {
    return { passed: false, message: `node ${process.version} — need >=${MIN_NODE_MAJOR}` };
  }
  let floor;
  try {
    floor = gitFloor(cwd);
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
    message: 'not inside a git checkout and no fgos bin reachable at any of the 3 tiers (dev-checkout, project-local, global PATH) -- run "npm install -g github:vantt/forgent"',
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
// literal directory, and the cumulative rule over the checkers of each rigor.
export function checkRunnerGeneratedPathsConfig(cwd) {
  const generatedPaths = effectiveSection(cwd, 'runner').generatedPaths ?? [];
  try {
    validateGeneratedPathsShape(generatedPaths, 'runner');
  } catch (err) {
    return { passed: false, message: err.message };
  }
  return { passed: true, message: `runner.generatedPaths is valid (${generatedPaths.length} mapping(s))` };
}

export function checkRunnerPatternsConfig(cwd) {
  const problems = [];
  const globalDir = path.join(process.env.HOME || os.homedir(), '.fgos');

  let isProjectJson = false;
  let isGlobalJson = false;

  // Check project and global config for retired keys and legacy format
  try {
    const checkRes = checkConfig({ projectRoot: cwd });
    for (const f of checkRes.findings ?? []) {
      if (f.file === 'project:config.json' || (f.file?.startsWith('project:') && f.row === 'config-format-legacy-json')) {
        isProjectJson = true;
      }
      if (f.file === 'global:config.json' || (f.file?.startsWith('global:') && f.row === 'config-format-legacy-json')) {
        isGlobalJson = true;
      }
    }

    const resolveDisplay = (rawFile) => {
      if (rawFile?.startsWith('global:')) {
        const name = isGlobalJson ? 'config.json' : rawFile.replace(/^global:/, '');
        return path.join(globalDir, name);
      }
      if (rawFile?.startsWith('project:')) {
        const name = isProjectJson ? 'config.json' : rawFile.replace(/^project:/, '');
        return path.join(cwd, '.fgos', name);
      }
      if (rawFile === 'merged' || !rawFile) {
        if (isProjectJson) return path.join(cwd, '.fgos', 'config.json');
        if (isGlobalJson) return path.join(globalDir, 'config.json');
        return rawFile ?? '<file>';
      }
      return rawFile;
    };

    for (const f of checkRes.findings ?? []) {
      const display = resolveDisplay(f.file);

      if (display.endsWith('.json') || f.row === 'config-format-legacy-json') {
        const msg = `${display}: legacy JSON configuration format must be migrated first; migrate the file format first`;
        if (!problems.includes(msg)) problems.push(msg);
        continue;
      }

      if (f.path && RETIRED_CONFIG_KEYS[f.path]) {
        const repl = RETIRED_CONFIG_KEYS[f.path].replacement;
        const msg = `${display}: ${f.path} was retired; ${repl ? `use ${repl} instead.` : 'delete the key.'}`;
        if (!problems.includes(msg)) problems.push(msg);
      }
    }
  } catch (err) {
    if (err.refusals) {
      const isProjectRefusalJson = err.refusals.some((r) => r.file === 'project:config.json' || r.id === 'config-format-legacy-json');
      const isGlobalRefusalJson = err.refusals.some((r) => r.file === 'global:config.json' || (r.file?.startsWith('global:') && r.id === 'config-format-legacy-json'));
      if (isProjectRefusalJson) isProjectJson = true;
      if (isGlobalRefusalJson) isGlobalJson = true;
      for (const r of err.refusals) {
        let display;
        if (r.file?.startsWith('global:')) {
          display = path.join(globalDir, isGlobalRefusalJson ? 'config.json' : r.file.replace(/^global:/, ''));
        } else if (r.file?.startsWith('project:')) {
          display = path.join(cwd, '.fgos', isProjectRefusalJson ? 'config.json' : r.file.replace(/^project:/, ''));
        } else {
          display = r.file ?? '<file>';
        }
        if (display.endsWith('.json') || r.id === 'config-format-legacy-json') {
          const msg = `${display}: legacy JSON configuration format must be migrated first; migrate the file format first`;
          if (!problems.includes(msg)) problems.push(msg);
          continue;
        }
        if (r.path && RETIRED_CONFIG_KEYS[r.path]) {
          const repl = RETIRED_CONFIG_KEYS[r.path].replacement;
          const msg = `${display}: ${r.path} was retired; ${repl ? `use ${repl} instead.` : 'delete the key.'}`;
          if (!problems.includes(msg)) problems.push(msg);
        }
      }
    }
  }

  if (problems.length > 0) {
    return { passed: false, message: problems.join('; ') };
  }

  let cfg;
  try {
    cfg = readConfig({
      projectRoot: cwd,
      sections: ['runner'],
      origins: ['runner.patterns'],
    });
  } catch (err) {
    if (isProjectJson) {
      return { passed: false, message: `${path.join(cwd, '.fgos', 'config.json')}: legacy JSON configuration format must be migrated first; migrate the file format first` };
    }
    if (isGlobalJson) {
      return { passed: false, message: `${path.join(globalDir, 'config.json')}: legacy JSON configuration format must be migrated first; migrate the file format first` };
    }
    if (err.refusals) {
      for (const r of err.refusals) {
        if (r.id === 'config-format-legacy-json' || r.file?.endsWith('.json')) {
          const display = r.file?.startsWith('global:') ? path.join(globalDir, 'config.json') : path.join(cwd, '.fgos', 'config.json');
          return { passed: false, message: `${display}: legacy JSON configuration format must be migrated first; migrate the file format first` };
        }
      }
    }
    return { passed: false, message: err.message };
  }

  const runner = cfg?.value?.runner ?? {};
  const effectivePatterns = runner.patterns ?? {};
  const effectiveLoops = runner.loops ?? {};

  try {
    validateRunnerLoopsShape(effectiveLoops, 'runner.loops');
  } catch (err) {
    return { passed: false, message: err.message };
  }

  const shipped = shippedCatalog();
  const layers = catalogLayersOf(cwd);
  const { entries, problems: catalogProblems } = checkCatalog({
    shipped,
    effective: effectivePatterns,
    layers,
  });
  if (catalogProblems.length > 0) {
    return { passed: false, message: catalogProblems.map((p) => p.message).join('; ') };
  }

  const warnings = [];
  const info = [];
  const hints = [];

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
        const packageRoot = resolveMainCheckoutRoot(cwd) ?? cwd;
        const loaded = loadWorkflowDefinitions(workflowRoots(cwd, packageRoot));
        for (const wf of loaded.workflows.values()) {
          for (const activity of wf.activities ?? []) {
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
          o.path !== 'runner.patterns.seatBinding' &&
          o.path !== 'runner.patterns.seatBinding.schema' &&
          o.path !== 'runner.patterns.defaultRule')
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
  const patternNames = Object.keys(entries).filter((n) => n !== 'seatBinding' && n !== 'defaultRule');
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

export function checkTierVocabularyDeadKeys(cwd) {
  const levels = [['effective', effectiveSection(cwd, 'runner')]];
  const problems = [];
  for (const [level, runner] of levels) {
    if (!runner || typeof runner !== 'object') continue;
    if ('models' in runner) {
      problems.push(`${level} config contains dead key "runner.models"; replace with "runner.modelPolicies"`);
    }
    if ('DEFAULT_TIER_TO_POLICY' in runner) {
      problems.push(`${level} config contains dead key "runner.DEFAULT_TIER_TO_POLICY"`);
    }
    if ('QUALITY_TIER_BRIDGE' in runner) {
      problems.push(`${level} config contains dead key "runner.QUALITY_TIER_BRIDGE"`);
    }
    if ('QUALITY_MODE_VALUES' in runner) {
      problems.push(`${level} config contains dead key "runner.QUALITY_MODE_VALUES"`);
    }
    if ('minTier' in runner) {
      problems.push(`${level} config contains dead key "runner.minTier"; replace with "rigor"`);
    }
    if ('minRigor' in runner) {
      problems.push(`${level} config contains dead key "runner.minRigor"; replace with "rigor"`);
    }
    if ('rigorOverrides' in runner) {
      problems.push(`${level} config contains dead key "runner.rigorOverrides"; replace by adjusting "runner.modelPolicies.<provider>"`);
    }
    if ('PLACEMENT_POLICY_SHADOW' in runner) {
      problems.push(`${level} config contains dead key "runner.PLACEMENT_POLICY_SHADOW"`);
    }
    if ('rigorToTier' in runner) {
      problems.push(`${level} config contains retired key "runner.rigorToTier"; rigor no longer chooses a tier, delete the key and declare "tier" per capability, role, persona or seat`);
    }
    for (const [execId, exec] of Object.entries(runner.executors ?? {})) {
      if (exec && typeof exec === 'object') {
        if ('rigorOverrides' in exec) {
          problems.push(`${level} config contains dead key "runner.executors.${execId}.rigorOverrides"; replace by adjusting "runner.modelPolicies.<provider>"`);
        }
        if ('models' in exec) {
          problems.push(`${level} config contains dead key "runner.executors.${execId}.models"`);
        }
      }
    }
    for (const [capName, cap] of Object.entries(runner.capabilities ?? {})) {
      if (cap && typeof cap === 'object') {
        if ('overrides' in cap) {
          problems.push(`${level} config contains dead key "runner.capabilities.${capName}.overrides"; replace with "runner.capabilities.${capName}.rigor"`);
        }
        if ('rigorOverrides' in cap) {
          problems.push(`${level} config contains dead key "runner.capabilities.${capName}.rigorOverrides"`);
        }
        if ('minTier' in cap) {
          problems.push(`${level} config contains dead key "runner.capabilities.${capName}.minTier"; replace with "rigor"`);
        }
        if ('minRigor' in cap) {
          problems.push(`${level} config contains dead key "runner.capabilities.${capName}.minRigor"; replace with "rigor"`);
        }
      }
    }
  }
  return problems.length > 0
    ? { passed: false, message: problems.join('; ') }
    : { passed: true, message: 'no retired tier vocabulary keys in the effective config' };
}

export function checkCoordinationProtocolDeadVocabulary(cwd) {
  const scanDirs = [
    path.join(cwd, '.fgos', 'coordination-protocols'),
    path.join(cwd, 'core', 'coordination-protocols'),
    path.join(cwd, 'core', 'workflows'),
    path.join(cwd, 'domains'),
  ];
  const yamlFiles = [];
  function scan(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        scan(full);
      } else if (entry.isFile() && (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml'))) {
        yamlFiles.push(full);
      }
    }
  }
  for (const dir of scanDirs) scan(dir);

  const deadPattern = /\b(minTier|minRigor|QUALITY_TIER_BRIDGE|QUALITY_MODE_VALUES)\b/;
  const problems = [];
  for (const file of yamlFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const match = content.match(deadPattern);
    if (match) {
      const rel = path.relative(cwd, file);
      problems.push(`${rel} contains retired "${match[1]}"; replace with "rigor" (low|standard|high|critical)`);
    }
  }
  return problems.length > 0
    ? { passed: false, message: problems.join('; ') }
    : { passed: true, message: 'no retired coordination protocol vocabulary in project' };
}

// tsk-2t9c (multi-role team harness, D6/D9 task-spec A-lite convention;
// AGENTS.md's install/setup/doctor gate): every operation a domain's Workflow
// declares names a task-spec id a step-skill will read as read-first material at
// runtime -- a missing file degrades that skill silently, so this makes the gap
// visible. Read-only (RUL9): never writes, never scaffolds a stub (a stub
// contract is worse than an absent one -- it looks authoritative while saying
// nothing).
//
// The domain registry these checks walk is code loaded from this install, and the
// task-spec/agent files it names ship in the same payload. They therefore resolve
// against the install's own root, never the target project's tree -- a plain target
// project carries no domains/ or core/ of its own.
const FGOS_INSTALL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export function checkTaskSpecsResolve(root = FGOS_INSTALL_ROOT) {
  const missing = [];
  for (const [domainName, domain] of Object.entries(DOMAINS)) {
    for (const wf of Object.values(domain.workflows ?? {})) {
      for (const step of wf.steps ?? []) {
        for (const op of step.operations ?? []) {
          if (!op.taskSpec) continue;
          const specPath = resolveTaskSpecPath(domainName, op.taskSpec, root);
          if (!fs.existsSync(specPath)) {
            missing.push(`${domainName}.operations.${step.id}[${op.id || op.taskSpec}] -> "${op.taskSpec}" (${path.relative(root, specPath)} not found)`);
          }
        }
      }
    }
  }
  const CORE_TASK_SPECS = [
    'fgos-routing',
    'fgos-clarifying',
    'fgos-researching',
    'fgos-lock-fence',
    'fgos-fanout',
    'fgos-indexing',
    'distill',
  ];
  for (const specId of CORE_TASK_SPECS) {
    const specPath = resolveTaskSpecPath('core', specId, root);
    if (!fs.existsSync(specPath)) {
      missing.push(`core.taskSpec -> "${specId}" (${path.relative(root, specPath)} not found)`);
    }
  }
  if (missing.length > 0) {
    return { passed: false, message: `missing task-spec file(s): ${missing.join('; ')} -- run fgos-coding-implement's own task-spec item, or docs/how-to/write-a-task-spec.md` };
  }
  return { passed: true, message: 'every domain\'s taskSpecMap entry and operation resolves to a real domains/<domain>/task-specs/ file and core/task-specs/ contains all domain-agnostic task-specs' };
}

function allTaskSpecs(cwd) {
  const specs = [];
  const root = path.join(cwd, 'domains');
  if (fs.existsSync(root)) {
    for (const domainEntry of fs.readdirSync(root, { withFileTypes: true })) {
      if (!domainEntry.isDirectory()) continue;
      const taskSpecsDir = path.join(root, domainEntry.name, 'task-specs');
      if (!fs.existsSync(taskSpecsDir)) continue;
      for (const file of fs.readdirSync(taskSpecsDir)) {
        if (file.endsWith('.md')) {
          specs.push({
            domain: domainEntry.name,
            specId: file.slice(0, -'.md'.length),
            filePath: path.join(taskSpecsDir, file),
          });
        }
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

function allAgentYamlFiles(cwd) {
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
  if (fs.existsSync(domainsDir)) {
    const domainEntries = fs.readdirSync(domainsDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const domainEntry of domainEntries) {
      if (domainEntry.isDirectory()) {
        const domainAgentsDir = path.join(domainsDir, domainEntry.name, 'agents');
        if (fs.existsSync(domainAgentsDir)) {
          for (const f of sortedReaddir(domainAgentsDir)) {
            if (f.endsWith('.yaml') || f.endsWith('.yml')) {
              files.push({ source: `domains/${domainEntry.name}/agents`, filePath: path.join(domainAgentsDir, f), fileName: f });
            }
          }
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
function readAgentSkills(agentFiles) {
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

// tsk-397 D20: eligibility direction inverted -- task-spec declares agent/requires-skill,
// agent-type declares skills. Check validates every requires-skill is provided by at least
// one agent-type, and every pinned agent exists.
function checkAgentClaimsResolve(cwd) {
  const agentFiles = allAgentYamlFiles(cwd);
  const { agentSkillsMap, problems: agentFileProblems } = readAgentSkills(agentFiles);

  const allProvidedSkills = new Set();
  for (const skillsSet of agentSkillsMap.values()) {
    for (const s of skillsSet) allProvidedSkills.add(s);
  }

  const taskSpecs = allTaskSpecs(cwd);
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
        if (agentSkillsMap.size > 0 && !allProvidedSkills.has(reqSkill)) {
          problems.push(`task-spec "${spec.specId}" requires skill "${reqSkill}" but no agent-type provides it`);
        }
      }
    }
  }

  if (problems.length > 0) {
    return { passed: false, message: problems.join('; ') };
  }
  return { passed: true, message: 'every task-spec\'s requires-skill/agent eligibility declaration resolves to real agent skills' };
}

/**
 * Validates the operations each Workflow step declares, across domain workflows (Step 02 / D19).
 *
 * @param {string} [cwd] Project directory (only its shared config is read)
 * @param {object} [domains] Domain registry map (defaults to DOMAINS)
 * @param {string} [root] Root holding the task-specs and agents the registry names (defaults to this install)
 * @returns {string[]} List of problem descriptions, empty if all valid.
 */
export function findWorkflowStageOperationProblems(cwd = process.cwd(), domains = DOMAINS, root = FGOS_INSTALL_ROOT) {
  const problems = [];

  const agentFiles = allAgentYamlFiles(root);
  const { agentSkillsMap, problems: agentFileProblems } = readAgentSkills(agentFiles);
  problems.push(...agentFileProblems);
  const allProvidedSkills = new Set();
  for (const skillsSet of agentSkillsMap.values()) {
    for (const s of skillsSet) allProvidedSkills.add(s);
  }

  const knownExecutors = new Set([
    ...Object.keys(effectiveSection(cwd, 'runner')?.executors || {}),
    // executor-provider-naming (2026-09-17): executors are now named by
    // provider, not bin -- 'agy'/'codex'/'pi'/'pi-grok'/'codex-pi' no
    // longer exist as separate ids ('agy' merged into 'gemini'; 'codex'
    // and 'pi' merged into one 'openai' executor, since providerModel is
    // executor-scoped, not per-bin; 'pi-grok' renamed to 'xai'; 'codex-pi'
    // retired as a duplicate of 'pi').
    'claude',
    'gemini',
    'openai',
    'xai',
    'glm',
    'gitnexus',
    'herdr',
  ]);

  for (const [domainName, domain] of Object.entries(domains)) {
    if (!domain) continue;

    const workflows = Object.entries(domain.workflows ?? {});

    for (const [wfName, wf] of workflows) {
      if (!wf) continue;

      // The Workflow definition's own steps carry the operations (validated for
      // shape at load by src/workflow/definition.mjs); this check adds what the
      // loader cannot know: task-spec files, roleGraph roles/edges, skills.
      const operationMap = Object.fromEntries(
        (wf.steps ?? []).filter((step) => step.operations !== undefined).map((step) => [step.id, step.operations]),
      );

      for (const [stage, ops] of Object.entries(operationMap)) {
        if (!Array.isArray(ops)) {
          const msg = `${domainName}.${wfName}.${stage}.operations: must be an array of operation objects`;
          if (!problems.includes(msg)) {
            problems.push(msg);
          }
          continue;
        }

        let primaryCount = 0;
        let primaryOp = null;
        const seenOpIds = new Set();

        for (const op of ops) {
          if (!op || typeof op !== 'object' || Array.isArray(op)) {
            problems.push(`${domainName}.${wfName}.${stage}: operation item must be a non-null object`);
            continue;
          }

          const opLabel = op.id || '?';

          if (!op.id || typeof op.id !== 'string' || op.id.trim() === '') {
            problems.push(`${domainName}.${wfName}.${stage}: operation id must be a non-empty string`);
          } else if (seenOpIds.has(op.id)) {
            problems.push(`${domainName}.${wfName}.${stage}: duplicate operation id "${op.id}"`);
          } else {
            seenOpIds.add(op.id);
          }

          if (!op.taskSpec || typeof op.taskSpec !== 'string' || op.taskSpec.trim() === '') {
            problems.push(`${domainName}.${wfName}.${stage}.operations[${opLabel}] -> taskSpec must be a non-empty string`);
          } else {
            const specPath = resolveTaskSpecPath(domainName, op.taskSpec, root);
            if (!fs.existsSync(specPath)) {
              problems.push(`${domainName}.${wfName}.${stage}.operations[${opLabel}] -> taskSpec "${op.taskSpec}" (${path.relative(root, specPath)} not found)`);
            }
          }

          if (domain.roleGraph && Array.isArray(domain.roleGraph.roles)) {
            if (!op.role || typeof op.role !== 'string' || op.role.trim() === '') {
              problems.push(`${domainName}.${wfName}.${stage}.operations[${opLabel}] -> role must be a non-empty string in roleGraph.roles [${domain.roleGraph.roles.join(', ')}]`);
            } else if (!domain.roleGraph.roles.includes(op.role)) {
              problems.push(`${domainName}.${wfName}.${stage}.operations[${opLabel}] -> role "${op.role}" not in roleGraph.roles [${domain.roleGraph.roles.join(', ')}]`);
            }
          } else if (op.role !== undefined && (typeof op.role !== 'string' || op.role.trim() === '')) {
            problems.push(`${domainName}.${wfName}.${stage}.operations[${opLabel}] -> role must be a non-empty string`);
          }

          if (!Array.isArray(op.skills) || op.skills.some((s) => typeof s !== 'string')) {
            problems.push(`${domainName}.${wfName}.${stage}.operations[${opLabel}] -> skills must be an array of strings`);
          } else if (op.skills.length === 0) {
            problems.push(`${domainName}.${wfName}.${stage}.operations[${opLabel}] -> skills must be a non-empty array of skill names`);
          } else {
            for (const skill of op.skills) {
              if (typeof skill !== 'string' || skill.trim() === '') {
                problems.push(`${domainName}.${wfName}.${stage}.operations[${opLabel}] -> skill name must be a non-empty string`);
              } else if (agentSkillsMap.size > 0 && !allProvidedSkills.has(skill)) {
                problems.push(`${domainName}.${wfName}.${stage}.operations[${opLabel}] -> skill "${skill}" not provided by any registered agent-type`);
              }
            }
          }

          if (op.reason && domain.roleGraph?.edges) {
            const stageEdges = domain.roleGraph.edges[stage];
            if (!Array.isArray(stageEdges) || stageEdges.length === 0) {
              problems.push(`${domainName}.${wfName}.${stage}.operations[${opLabel}] -> reason "${op.reason}" has no declared edges for stage "${stage}" in roleGraph`);
            } else {
              const matchingEdge = stageEdges.find((e) => e.reason === op.reason && (!op.role || e.to === op.role));
              if (!matchingEdge) {
                problems.push(`${domainName}.${wfName}.${stage}.operations[${opLabel}] -> reason "${op.reason}" (target role "${op.role}") does not match any legal roleGraph edge at stage "${stage}"`);
              }
            }
          }

          if (op.dispatch !== undefined) {
            if (!['assignment', 'human-only'].includes(op.dispatch)) {
              problems.push(`${domainName}.${wfName}.${stage}.operations[${opLabel}] -> invalid dispatch mode "${op.dispatch}" (allowed: assignment, human-only)`);
            }
            if (op.dispatch === 'human-only') {
              if (op.policy?.preferExecutor) {
                problems.push(`${domainName}.${wfName}.${stage}.operations[${opLabel}] -> dispatch: human-only operation must not declare executor policy (preferExecutor)`);
              }
            }
          }

          if (op.primary) {
            primaryCount++;
            primaryOp = op;
          }

          if (op.policy !== undefined) {
            if (typeof op.policy !== 'object' || op.policy === null || Array.isArray(op.policy)) {
              problems.push(`${domainName}.${wfName}.${stage}.operations[${opLabel}] -> policy must be an object`);
            } else {
              // M12: reads the ONE allow-list PolicyPatch validation itself
              // enforces (schema.mjs's POLICY_PATCH_FIELDS) instead of a
              // second, hand-copied Set that had already drifted (missing
              // preferInvocation/repeatMode).
              const disallowedKeys = Object.keys(op.policy).filter((k) => !POLICY_PATCH_FIELDS.has(k));
              if (disallowedKeys.length > 0) {
                problems.push(`${domainName}.${wfName}.${stage}.operations[${opLabel}] -> policy contains disallowed key(s) [${disallowedKeys.join(', ')}] (allowed: ${[...POLICY_PATCH_FIELDS].join(', ')})`);
              }
              if (op.policy.rigor && !RIGOR_VALUES.includes(op.policy.rigor)) {
                problems.push(`${domainName}.${wfName}.${stage}.operations[${opLabel}] -> policy.rigor "${op.policy.rigor}" not in recognized rigors [${RIGOR_VALUES.join(', ')}]`);
              }
              if (op.policy.preferPersona) {
                if (typeof op.policy.preferPersona !== 'string' || (agentSkillsMap.size > 0 && !agentSkillsMap.has(op.policy.preferPersona))) {
                  problems.push(`${domainName}.${wfName}.${stage}.operations[${opLabel}] -> policy.preferPersona "${op.policy.preferPersona}" not a recognized agent-type`);
                }
              }
              if (op.policy.preferExecutor) {
                if (typeof op.policy.preferExecutor !== 'string' || (knownExecutors.size > 0 && !knownExecutors.has(op.policy.preferExecutor))) {
                  problems.push(`${domainName}.${wfName}.${stage}.operations[${opLabel}] -> policy.preferExecutor "${op.policy.preferExecutor}" is not a recognized executor`);
                }
              }
              if (op.policy.visibility !== undefined) {
                if (!['headless', 'visible'].includes(op.policy.visibility)) {
                  problems.push(`${domainName}.${wfName}.${stage}.operations[${opLabel}] -> policy.visibility "${op.policy.visibility}" must be "headless" or "visible"`);
                }
              }
            }
          }
        }

        if (primaryCount > 1) {
          problems.push(`${domainName}.${wfName}.${stage}: has ${primaryCount} operations marked primary: true (at most one allowed)`);
        }

        const stageSkill = stepById(wf, stage)?.skill;
        if (primaryOp) {
          if (stageSkill && Array.isArray(primaryOp.skills) && primaryOp.skills.length > 0 && !primaryOp.skills.includes(stageSkill)) {
            problems.push(`${domainName}.${wfName}.${stage}: primary operation skills [${primaryOp.skills.join(', ')}] does not include step skill "${stageSkill}"`);
          }
        }
      }
    }
  }

  return problems;
}

// A name is unique within a tier (fgos/agents, domains/*/agents, core/agents); a higher tier shadows a
// lower one by whole-file replacement (RUL13). The customer's own tier is also checked for shape.
function checkAgentTypeNamesUnique(cwd) {
  const scan = scanAgentTiers({ projectRoot: cwd });
  const problems = findAgentDuplicates(scan).map(({ label, name, files }) => `duplicate agent-type name "${name}" in ${label} (${files.join(', ')})`);

  const workspace = scan.find((tier) => tier.tier === 'workspace');
  const lowerEntries = scan.filter((tier) => tier.tier !== 'workspace').flatMap((tier) => tier.entries);
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
  check: (cwd) => checkNodeAndGit(cwd),
});

registerCheck({
  id: 'cli-version-visible',
  description: 'this build\'s own package version/commit/verb-set resolve cleanly via `fgos version` (tsk-2ej)',
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
  check: (cwd) => checkRunnerPatternsConfig(cwd),
});

registerCheck({
  id: 'tier-vocabulary-dead-keys',
  description: 'project and global configs have no retired tier vocabulary keys (runner.models, minTier, rigorOverrides, etc.)',
  check: (cwd) => checkTierVocabularyDeadKeys(cwd),
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

registerCheck({
  id: 'global-model-policies-portable',
  description: 'runner.modelPolicies in the global config uses plain model names only, since every fgOS release on the machine reads it',
  check: () => checkGlobalModelPoliciesPortable(),
});

registerCheck({
  id: 'coordination-protocol-dead-vocabulary',
  description: 'coordination protocols and workflows in project do not contain retired minTier or minRigor',
  check: (cwd) => checkCoordinationProtocolDeadVocabulary(cwd),
});

registerCheck({
  id: 'task-specs-resolve',
  description: 'every domain\'s taskSpecMap entry resolves to a real domains/<domain>/task-specs/ file (tsk-2t9c D6/D9)',
  check: () => checkTaskSpecsResolve(),
});

registerCheck({
  id: 'agent-claims-resolve',
  description: 'every agent-type\'s claims list (agents/*.yaml) names real task-specs (tsk-2t9c D12)',
  check: (cwd) => checkAgentClaimsResolve(cwd),
});

// The Work lifecycle reads each domain's compiled.json (scripts/build-domain-registry.mjs) at
// import time. A missing or unreadable file breaks every command that resolves a domain; a stale
// one (YAML edited, not rebuilt) silently serves old steps; a YAML file that cannot be parsed
// cannot be compiled at all. This check names each of those per domain, compiling from the YAML
// with the same function the build uses.
function checkDomainRegistryCompiled(cwd) {
  const domainsDir = path.join(cwd, 'domains');
  if (!fs.existsSync(domainsDir)) return { passed: true, message: 'no domains/ directory here — nothing to check' };
  const problems = [];
  let checked = 0;
  for (const entry of fs.readdirSync(domainsDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory() || !fs.existsSync(path.join(domainsDir, entry.name, 'registry.yaml'))) continue;
    checked += 1;
    const compiled = path.join(domainsDir, entry.name, 'compiled.json');
    if (!fs.existsSync(compiled)) {
      problems.push(`domains/${entry.name}/compiled.json is missing`);
      continue;
    }
    let onDisk;
    try {
      onDisk = JSON.parse(fs.readFileSync(compiled, 'utf8'));
    } catch (err) {
      problems.push(`domains/${entry.name}/compiled.json is unreadable (${err.message})`);
      continue;
    }
    let fromYaml;
    try {
      fromYaml = JSON.parse(JSON.stringify(compileDomain(path.join(domainsDir, entry.name))));
    } catch (err) {
      problems.push(err.message);
      continue;
    }
    if (!isDeepStrictEqual(onDisk, fromYaml)) problems.push(`domains/${entry.name}/compiled.json is stale — run npm run build:domains`);
  }
  if (problems.length > 0) {
    return { passed: false, message: problems.join('; ') };
  }
  return { passed: true, message: `${checked} domain registr${checked === 1 ? 'y' : 'ies'} compiled, readable and in step with their YAML` };
}

registerCheck({
  id: 'domain-registry-compiled',
  description: "every domain's compiled.json (the form the Work lifecycle reads) exists, parses and matches its registry and workflow YAML",
  check: (cwd) => checkDomainRegistryCompiled(cwd),
});

registerCheck({
  id: 'agent-type-names-unique',
  description: 'agent definition names are unique within each tier (fgos/agents, domains/*/agents, core/agents); a higher tier replaces a lower one whole, and fgos/agents files have the shape the renderer needs',
  check: (cwd) => checkAgentTypeNamesUnique(cwd),
});

registerCheck({
  id: 'main-checkout-hook-wired',
  description: 'core.hooksPath wired to .githooks (main-checkout kernel lock check, borrowed through the description, and source-checkout new-root-file guards)',
  check: (cwd) => checkMainCheckoutHookWired(cwd),
});

registerCheck({
  id: 'dispatch-decide-hook-wired',
  description: '.claude/settings.json PreToolUse hook enforces dispatch.mjs decide on every Agent/Task call and decision-question template',
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
  description: '.codex/hooks.json PreToolUse hook enforces dispatch.mjs decide and decision-question template',
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
  description: '.agents/hooks.json PreToolUse hook enforces dispatch.mjs decide and decision-question template',
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
  description: '.omp/extensions/fgos-hooks.ts in-process extension enforces dispatch.mjs decide and decision-question template',
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
  description: '.pi/extensions/fgos-hooks.ts in-process extension enforces dispatch.mjs decide and decision-question template',
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
  description: 'tool registry posture — inactive/degraded/full (tsk-1dj)',
  check: (cwd) => checkToolRegistryConfigured(cwd),
});

registerCheck({
  id: 'agy-permissions-configured',
  description: 'agy settings.json has a working command denylist instead of relying only on --dangerously-skip-permissions (tsk-1xm)',
  check: () => checkAgyPermissionsConfigured(),
});

registerFix({
  id: 'agy-permissions-configured',
  fix: () => fixAgyPermissionsConfigured(),
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
  description: "every open item's risk/kind matches its domain's declared classification vocabulary (tsk-6ax)",
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
  description: "every open item sits at a step its own domain's Workflow still registers — no item stranded on a retired step (tsk-64h)",
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

export function checkDomainWorkflowOperationsCoverage(cwd, root = FGOS_INSTALL_ROOT) {
  const problems = findWorkflowStageOperationProblems(cwd, DOMAINS, root);
  if (problems.length === 0) {
    return {
      passed: true,
      message: "every step operation across domain workflows resolves to valid task-specs, roles, skills, and legal roleGraph edges",
    };
  }
  return {
    passed: false,
    message: `${problems.length} workflow step operation problem(s): ${problems.join('; ')}`,
  };
}

registerCheck({
  id: 'domain-workflow-operations-coverage',
  description: "every stage operation across domain workflows resolves to valid task-specs, roles, skills, and legal roleGraph edges (tsk-team-dispatch-slice-1)",
  check: (cwd) => checkDomainWorkflowOperationsCoverage(cwd),
});

registerCheck({
  id: 'root-drift',
  description: 'every fgw/<root> branch is in sync with its real target — no unsynced drift left over from a leaf merge (tsk-3bn)',
  check: (cwd, run) => checkRootDrift(cwd, run),
});

registerCheck({
  id: 'leaf-notify-drift',
  description: 'every live session branch has no post-land drift against its target (tsk-1el)',
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
  description: "every item whose status says its work was handed over has its fgw/<id> branch reachable from the trunk (tsk-1l9)",
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
  description: 'every holder of a holder-lock lock is a fgOS process or a borrowed child, no predecessor domain is left running, and the state and porting-events hot records parse and their holder can be judged',
  check: (cwd) => checkLockHolders(cwd),
});
registerFix({ id: 'lock-dirs', fix: (cwd) => fixLockDirs(cwd) });

// Run supervisor (docs/platform/run-supervisor/spec.md): the containment driver agents run in, the
// host routes, the runtime socket directory, attempts nobody holds and the gate's kill grace.
// `dispatch.gateKillGraceMs` and `dispatch.cancelWaitMs` are read with a default and never written by setup.
registerCheck({
  id: 'process-containment',
  description: 'the host names the containment driver agents run in and its level (kernel or best-effort) with the routes around it',
  check: (cwd) => checkProcessContainment(cwd),
});
registerCheck({
  id: 'run-supervisor-route',
  description: 'the host binary serves supervise, gate, adopt and attempt-step at protocol 1',
  check: (cwd) => checkRunSupervisorRoute(cwd),
});
registerCheck({
  id: 'runtime-socket-dir',
  description: 'the runtime socket directory exists, is owned by this user and is 0700',
  check: () => checkRuntimeSocketDir(),
});
registerCheck({
  id: 'run-attempts-stuck',
  description: 'no attempt with a v3 envelope is left without a closed.json while its lock is free (fgos doctor --fix adopts it)',
  check: (cwd) => checkRunAttemptsStuck(cwd),
});
registerCheck({
  id: 'gate-kill-grace',
  description: 'dispatch.gateKillGraceMs is an integer of at least 1000 ms (default 10000)',
  check: (cwd) => checkGateKillGrace(cwd),
});
registerCheck({
  id: 'legacy-attempts-stuck',
  description: 'no run from before the run supervisor is left running with every recorded process dead (fgos doctor --fix settles it as abandoned-legacy; a run that cannot be proven dead is kept and its reason named)',
  check: (cwd) => checkLegacyAttemptsStuck(cwd),
});
registerCheck({
  id: 'units-awaiting-resume',
  description: 'lists unit runs whose controller is gone and whose last attempt is closed, with the fgos run --resume command (information, never a failure)',
  check: (cwd) => checkUnitsAwaitingResume(cwd),
});
registerCheck({
  id: 'cancel-wait',
  description: 'dispatch.cancelWaitMs is an integer of at least 1000 ms and not shorter than dispatch.gateKillGraceMs (default gateKillGraceMs + 5000)',
  check: (cwd) => checkCancelWait(cwd),
});
registerFix({ id: 'runtime-socket-dir', fix: () => fixRuntimeSocketDir() });
registerFix({ id: 'run-attempts-stuck', fix: (cwd) => fixRunAttemptsStuck(cwd) });
registerFix({ id: 'legacy-attempts-stuck', fix: (cwd) => fixLegacyAttemptsStuck(cwd, { door: { observe: recoverObserveUseCase, apply: recoverApplyUseCase } }) });

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
  if (data.record !== 'ok') return { passed: false, message: `enabled, but the mailbox record cannot be read: ${data.record} (fgos mailbox status names it)` };
  const outcome = data.hookOutcome?.reason ? `, last hook outcome ${data.hookOutcome.reason}` : '';
  return { passed: true, message: `${enabled}; record: ok (${data.heads} head(s), ${data.signals?.queue?.pending ?? 0} pending${outcome})` };
}

registerCheck({
  id: 'mailbox-hook',
  description: 'agent mailbox: whether this project opted in to the mailbox hook rows (mailbox.enabled), and when it did, the record verdict from fgos mailbox status',
  check: (cwd) => checkMailboxHook(cwd),
});

// Every capability a core/domain Workflow unit names must resolve the way
// bind() resolves it (exact name, then the bare verb). One that does not has
// no candidate pool, so that unit is refused at run time with no earlier signal.
// A declared entry that carries no `prefer` pool (exact or bare verb) is reported too.
// Definition files come from the one Workflow reader (readWorkflowDefinitionFiles) and every string
// under a key named `capability`, at any depth, is a use. A file that cannot be read or parsed is
// reported by name, never skipped.
function workflowCapabilityUses(files) {
  const uses = new Map();
  for (const { fileId, raw } of files) {
    for (const capability of capabilityValues(raw)) {
      if (!uses.has(capability)) uses.set(capability, new Set());
      uses.get(capability).add(fileId);
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
  const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const { files, unreadable } = readWorkflowDefinitionFiles(workflowRoots(cwd, packageRoot));
  const uses = workflowCapabilityUses(files);
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

// I19 (core/skills/_shared/capability-matching.md): `serves` is optional at
// load time (`validateCapabilitiesShape`'s hot path never rejects an old
// entry with none), but a live config's DECLARED `serves` values still need
// a doctor signal -- a malformed one, or two capabilities that declare the
// identical attribute set (permanently tied, capability-matching.md's
// "Ties and misses" rule), silently degrades Q1 steering with no error
// anywhere else. `review`'s presence is already covered generically by
// the standard (which always supplies it).
function normalizeServesForComparison(serves) {
  return JSON.stringify(Object.fromEntries(Object.entries(serves).sort(([a], [b]) => a.localeCompare(b))));
}

function checkCapabilityServesValid(cwd) {
  const capabilities = effectiveSection(cwd, 'runner').capabilities ?? {};
  const invalid = [];
  const servesByName = new Map();
  for (const [name, entry] of Object.entries(capabilities)) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry) || entry.serves === undefined) continue;
    try {
      validateCapabilityServesShape(entry.serves, `runner.capabilities.${name}.serves`);
      servesByName.set(name, entry.serves);
    } catch (error) {
      invalid.push(`${name}: ${error.message}`);
    }
  }
  if (invalid.length > 0) {
    return { passed: false, message: `invalid "serves": ${invalid.join('; ')}` };
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
  description: 'runner.capabilities\' "serves" attribute sets are well-formed and mutually distinct (I19)',
  check: (cwd) => checkCapabilityServesValid(cwd),
});

// Unit I21 (Phase 5 item 2): every discoverable CoordinationProtocol
// operation's declared `policy.capability` resolves against the LIVE runner
// config -- the SAME `resolveExecutorAndOverrides` (dispatch/resolve.mjs) a
// real dispatch re-resolves at execution time, never a second, drifting
// lookup. An operation naming a capability with nothing registered for it
// does not fail at dispatch time (it quietly falls back to the runner's
// global default executor, per the dispatch policy's own
// precedence) -- this check is the only place that quiet degradation is
// surfaced before it happens for real. Also reports the count of distinct
// provider families reachable across every resolved capability (design
// record §12 item 3: "Doctor báo số họ provider cấu hình").
function checkOperationCapabilitiesResolve() {
  return { passed: true, message: 'no coordination protocols active (retired in favor of workflows)' };
}

registerCheck({
  id: 'operation-capability-resolves',
  description: 'every discoverable CoordinationProtocol operation\'s declared policy.capability resolves against the live runner config, and reports reachable provider-family diversity (Unit I21)',
  check: () => checkOperationCapabilitiesResolve(),
});

// tsk-slq D6 (AGENTS.md's install/setup/doctor gate — a new infra
// dependency must register into doctor's check registry, not stand alone
// undiscoverable by doctor): forgent had zero npm dependencies until tsk-slq
// added `yaml` (D4) as the first one. A bare checkout (e.g. a fresh clone,
// or a disposable worktree like `fgos return`'s own goal-check checkout)
// never runs `npm install` on its own — this check makes that gap visible
// to a human/session running `fgos doctor`, the same "absent capability =
// clean skip, never hidden" contract `checkToolRegistryConfigured` already
// gives tool-registry posture. READ-ONLY by construction (same as every
// other check here) — only fs.existsSync, doctor never writes.
function checkDependenciesInstalled(cwd) {
  const mainCheckout = resolveMainCheckout(cwd);
  const root = mainCheckout ?? cwd;
  const packageJsonPath = path.join(root, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return { passed: true, message: 'no package.json — nothing to check' };
  }
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const deps = Object.keys(pkg.dependencies ?? {});
  if (deps.length === 0) {
    return { passed: true, message: 'no runtime dependencies declared — nothing to check' };
  }
  const nodeModulesPath = path.join(root, 'node_modules');
  const missing = deps.filter((dep) => !fs.existsSync(path.join(nodeModulesPath, dep)));
  if (missing.length > 0) {
    return { passed: false, message: `missing from node_modules: ${missing.join(', ')} — run npm install` };
  }
  return { passed: true, message: `${deps.length} dependenc${deps.length === 1 ? 'y' : 'ies'} installed` };
}

registerCheck({
  id: 'dependencies-installed',
  description: 'package.json dependencies are present in node_modules (tsk-slq D6)',
  check: (cwd) => checkDependenciesInstalled(cwd),
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

// tsk-4xg (docs/history/tsk-4xg-plugin-marketplace-doctor-check/): a new
// project set up via `fgos setup` never got the fgOS Claude Code plugin
// (`.claude-plugin/marketplace.json`, `plugins/fgOS`) registered or
// installed, so it had no `/fgOS:*` skills available -- and `doctor` never
// flagged the gap. Same registerCheck/registerFix registry every other
// doctor check/fix already uses (tsk-2cs) -- a new consumer, no new
// plumbing.
//
// D3 (CONTEXT.md): the fix always adds the marketplace by its GitHub
// source (`vantt/forgent`), never a local path -- `package.json`'s own
// `"files"` list does not ship `plugins/`/`.claude-plugin/`, so a local
// path would only ever work from a dev-checkout of this repo, never for
// the actual npm-global-install target audience. The CHECK, in contrast,
// accepts a marketplace entry under this name regardless of its source
// (github, directory, or otherwise) -- a dev-checkout's own directory-
// sourced entry (this exact repo's own self-hosting case, per
// docs/distribution-vision.md's "context 3") is just as valid a pass as a
// github-sourced one; only the FIX, which only ever runs on a genuinely
// missing entry, needs to pick one source to add.
const CLAUDE_PLUGIN_MARKETPLACE_NAME = 'fgos-plugins';
const CLAUDE_PLUGIN_MARKETPLACE_GITHUB_SOURCE = 'vantt/forgent';
const CLAUDE_PLUGIN_ID_PREFIX = 'fgOS@';

// The `claude` binary this check/fix shells out to. Tests substitute a fake
// executable through FGOS_CLAUDE_COMMAND -- same test-only seam
// bin/fgos.mjs's own ghCommandOpts() already gives FGOS_GH_COMMAND for the
// `gh` binary -- so this fix (the first one to reach outside `.fgos/`/the
// repo into a real, mutating external CLI) never actually runs
// `claude plugin marketplace add`/`install` for real against a test's own
// machine. Production leaves it unset and the real `claude` on PATH is used.
function claudeCommand() {
  return process.env.FGOS_CLAUDE_COMMAND || 'claude';
}

function claudeBinaryAvailable() {
  try {
    execFileSync(claudeCommand(), ['--version'], { encoding: 'utf8', shell: process.platform === 'win32' });
    return true;
  } catch {
    return false;
  }
}

// Both `claude plugin marketplace list --json` and `claude plugin list
// --json` exit 0 with a JSON array on success (confirmed by running them
// directly, not assumed from --help alone) -- a non-zero exit or unparsable
// stdout folds to `null` here, the same fail-closed shape this file's other
// checks already use for a subprocess that could not be trusted.
function claudePluginJson(args) {
  try {
    const stdout = execFileSync(claudeCommand(), args, { encoding: 'utf8', shell: process.platform === 'win32' });
    const parsed = JSON.parse(stdout);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function fgosPluginEnabled(plugins) {
  return plugins.some((p) => typeof p?.id === 'string' && p.id.startsWith(CLAUDE_PLUGIN_ID_PREFIX) && p.enabled === true);
}

function checkClaudePluginMarketplace() {
  if (!claudeBinaryAvailable()) {
    return {
      passed: true,
      message: 'claude CLI not found on PATH — nothing to check (Claude Code plugin surface not applicable here)',
    };
  }
  const marketplaces = claudePluginJson(['plugin', 'marketplace', 'list', '--json']);
  if (marketplaces === null) {
    return { passed: false, message: '"claude plugin marketplace list --json" failed to run or parse — run fgos doctor --fix' };
  }
  if (!marketplaces.some((m) => m?.name === CLAUDE_PLUGIN_MARKETPLACE_NAME)) {
    return {
      passed: false,
      message: `Claude Code marketplace "${CLAUDE_PLUGIN_MARKETPLACE_NAME}" not configured — run fgos doctor --fix`,
    };
  }
  const plugins = claudePluginJson(['plugin', 'list', '--json']);
  if (plugins === null) {
    return { passed: false, message: '"claude plugin list --json" failed to run or parse — run fgos doctor --fix' };
  }
  if (!fgosPluginEnabled(plugins)) {
    return { passed: false, message: 'fgOS Claude Code plugin not installed/enabled — run fgos doctor --fix' };
  }
  return {
    passed: true,
    message: `Claude Code marketplace "${CLAUDE_PLUGIN_MARKETPLACE_NAME}" configured, fgOS plugin enabled`,
  };
}

// Idempotent, same "only write when something was actually missing"
// discipline fixGateBypassConfigured above already uses.
function fixClaudePluginMarketplace() {
  if (!claudeBinaryAvailable()) {
    return { changed: false, message: 'claude CLI not found on PATH — nothing to fix' };
  }
  const messages = [];
  let changed = false;

  const marketplaces = claudePluginJson(['plugin', 'marketplace', 'list', '--json']) ?? [];
  if (!marketplaces.some((m) => m?.name === CLAUDE_PLUGIN_MARKETPLACE_NAME)) {
    try {
      execFileSync(claudeCommand(), ['plugin', 'marketplace', 'add', CLAUDE_PLUGIN_MARKETPLACE_GITHUB_SOURCE], { encoding: 'utf8', shell: process.platform === 'win32' });
    } catch (err) {
      return { changed, message: `"claude plugin marketplace add ${CLAUDE_PLUGIN_MARKETPLACE_GITHUB_SOURCE}" failed: ${err.message}` };
    }
    changed = true;
    messages.push(`added marketplace "${CLAUDE_PLUGIN_MARKETPLACE_NAME}" from ${CLAUDE_PLUGIN_MARKETPLACE_GITHUB_SOURCE}`);
  }

  const plugins = claudePluginJson(['plugin', 'list', '--json']) ?? [];
  if (!fgosPluginEnabled(plugins)) {
    const pluginRef = `fgOS@${CLAUDE_PLUGIN_MARKETPLACE_NAME}`;
    try {
      execFileSync(claudeCommand(), ['plugin', 'install', pluginRef], { encoding: 'utf8', shell: process.platform === 'win32' });
    } catch (err) {
      return { changed, message: `"claude plugin install ${pluginRef}" failed: ${err.message}` };
    }
    changed = true;
    messages.push('installed and enabled fgOS plugin');
  }

  if (!changed) {
    return { changed: false, message: `marketplace "${CLAUDE_PLUGIN_MARKETPLACE_NAME}" and fgOS plugin already configured` };
  }
  return { changed: true, message: messages.join('; ') };
}

registerCheck({
  id: 'claude-plugin-marketplace',
  description: 'fgOS Claude Code plugin marketplace is registered and the fgOS plugin is installed/enabled',
  check: (cwd) => checkClaudePluginMarketplace(cwd),
});

registerFix({
  id: 'claude-plugin-marketplace',
  fix: (cwd) => fixClaudePluginMarketplace(cwd),
});

// tsk-1no D3 (tsk-2qc-1 D2 widened): the plugin skill layer (`plugins/fgOS/
// skills/*/SKILL.md`) resolves its own CLI independently of this file's
// other checks, via the same 3-tier resolution (dev-checkout > project-
// local > global, cache-first) `bin-discovery.mjs` gives every other
// caller -- this check is now a thin reporting wrapper over
// `resolveFgosBin`, not its own separate local-bin/PATH try/catch.
function checkPluginSkillCliReachable(cwd) {
  const resolved = resolveFgosBin(cwd);
  if (resolved) {
    const tierLabel = resolved.tier === 0
      ? 'workspace installation found'
      : resolved.tier === 1
        ? 'local bin/fgos.mjs found'
        : resolved.tier === 2
          ? 'project-local install found'
          : 'fgos resolved from PATH';
    return { passed: true, message: `${tierLabel} at ${resolved.path}` };
  }
  return {
    passed: false,
    message: `no bin/fgos.mjs at ${cwd}, no project-local node_modules/.bin/fgos, and no global fgos install on PATH -- every /fgOS:* slash command will fail on first use (run: npm install -g github:vantt/forgent)`,
  };
}

registerCheck({
  id: 'plugin-skill-cli-reachable',
  description: 'a fgos CLI is reachable from this project (local bin/fgos.mjs, project-local install, or a global PATH install)',
  check: (cwd) => checkPluginSkillCliReachable(cwd),
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

// tsk-32b: `plugin-skill-cli-reachable` above only confirms the `fgos` CLI
// binary is reachable -- it says nothing about whether the coding-domain
// dev-skills the plugin's own slash-command skills (deliver/discover/plan/
// pick) dispatch into via the Skill tool are actually shipped in
// plugins/fgOS/skills/ (they were not, before tsk-32b's own fix -- a
// plugin-only consumer got "Unknown skill: fgos-coding-driving" the first
// time deliver/discover/plan/pick tried to dispatch into one, with the CLI
// itself fully reachable the whole time). This check only ever fires
// against THIS repo's own source tree -- it derives the expected dev-skill
// set from `.claude/skills/fgos-*` and confirms each one also exists under
// `plugins/fgOS/skills/`, catching a maintainer who adds/renames a
// coding-domain dev-skill and forgets to re-copy it into the plugin before
// a release ships (test/skills/fgos-mirror.test.mjs enforces the same
// byte-identical content once both sides exist; this check only checks
// presence, for a fast doctor-level signal). A downstream consumer running
// doctor against their own project (no `.claude/skills/` of this repo's
// own shape at their `cwd`) has nothing for this check to compare, so it
// passes cleanly -- same "absent capability = clean skip" contract every
// other optional check in this file already follows.
function checkPluginDevSkillsPackaged(cwd) {
  const claudeSkillsRoot = path.join(cwd, '.claude', 'skills');
  const pluginSkillsRoot = path.join(cwd, 'plugins', 'fgOS', 'skills');
  if (!fs.existsSync(claudeSkillsRoot) || !fs.existsSync(pluginSkillsRoot)) {
    return { passed: true, message: 'not a forgent checkout (no .claude/skills or plugins/fgOS/skills at this project) -- nothing to check' };
  }
  const devSkillNames = fs
    .readdirSync(claudeSkillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('fgos-'))
    .map((entry) => entry.name)
    .sort();
  const missing = devSkillNames.filter((name) => !fs.existsSync(path.join(pluginSkillsRoot, name, 'SKILL.md')));
  if (missing.length === 0) {
    return { passed: true, message: `all ${devSkillNames.length} coding-domain dev-skills are packaged in plugins/fgOS/skills/` };
  }
  return {
    passed: false,
    message: `${missing.length} coding-domain dev-skill(s) missing from plugins/fgOS/skills/ (present in .claude/skills/): ${missing.join(', ')} -- any repo installing fgOS only as a plugin will hit "Unknown skill" dispatching into these`,
  };
}

registerCheck({
  id: 'plugin-dev-skills-packaged',
  description: 'every coding-domain dev-skill under .claude/skills/fgos-* is also packaged in plugins/fgOS/skills/, so a plugin-only consumer can dispatch into it',
  check: (cwd) => checkPluginDevSkillsPackaged(cwd),
});

// tsk-3ip (docs/history/automated-changelog-compound-learn/DISCUSSION.md
// §6.1/§6.4): observe/remind only -- never judges whether a change
// deserved an entry, never blocks merge (R2, tsk-28x §6.4). Exported so
// `bin/fgos.mjs`'s `collectChangelogNag` can reuse the identical
// extraction/detection logic rather than duplicating it (the doctor check
// here and the `fgos check` nag both need the same "does Unreleased have
// a real entry" read).
//
// Purely structural: looks for a `- ` bullet line inside the `##
// [Unreleased]` section, never judges the bullet's content. The exact
// heading string (with brackets) matches what the sibling bootstrap task
// (tsk-469) writes into CHANGELOG.md.
export function extractUnreleasedSection(content) {
  const heading = '## [Unreleased]';
  const idx = content.indexOf(heading);
  if (idx === -1) return '';
  const rest = content.slice(idx + heading.length);
  const nextHeadingIdx = rest.search(/\n## /);
  return nextHeadingIdx === -1 ? rest : rest.slice(0, nextHeadingIdx);
}

export function unreleasedHasEntries(content) {
  return /^-\s+\S/m.test(extractUnreleasedSection(content));
}

// READ-ONLY by construction (same as every other check here) -- only
// fs.existsSync/readFileSync, never writes. A missing CHANGELOG.md is a
// normal state (a fresh fgOS consumer hasn't adopted one yet), never an
// error -- same "absent capability = clean skip" contract
// `checkToolRegistryConfigured`/`checkDependenciesInstalled` already give
// their own missing-prerequisite cases.
function checkChangelogUnreleasedStale(cwd) {
  const mainCheckout = resolveMainCheckout(cwd);
  const root = mainCheckout ?? cwd;
  const changelogPath = path.join(root, 'CHANGELOG.md');
  if (!fs.existsSync(changelogPath)) {
    return { passed: true, message: 'CHANGELOG.md not found -- nothing to check (project has not adopted a changelog yet)' };
  }
  const content = fs.readFileSync(changelogPath, 'utf8');
  if (unreleasedHasEntries(content)) {
    return { passed: true, message: '## [Unreleased] has pending entr(ies) -- up to date' };
  }
  return {
    passed: false,
    message: '## [Unreleased] has no pending entries -- reminder only: add a line here when your next user-visible change merges (never blocks merge)',
  };
}

registerCheck({
  id: 'changelog-unreleased-stale',
  description: 'CHANGELOG.md ## [Unreleased] section has at least one pending entry (observe/remind only, never blocks merge -- tsk-3ip)',
  check: (cwd) => checkChangelogUnreleasedStale(cwd),
});

// tsk-2t8: README.md's own "## Install" section recommends `npm install -g
// github:vantt/forgent#vX.Y.Z`, a specific pinned tag -- if that tag was
// never actually cut (tag-cutting is a deliberate manual act by design,
// tsk-jtb D1/D2, never automated here), every new external user's
// recommended install command fails outright. Read-only, same "absent =
// clean skip" convention as changelog-unreleased-stale above: no
// README.md, or no pinned-tag line found in it, is not itself a problem
// this check reports on.
const README_INSTALL_TAG_PATTERN = /npm install -g github:[^#\s]+#(v\d+\.\d+\.\d+)/;

function checkReadmeInstallTagExists(cwd) {
  const mainCheckout = resolveMainCheckoutRoot(cwd) ?? cwd;
  const readmePath = path.join(mainCheckout, 'README.md');
  if (!fs.existsSync(readmePath)) {
    return { passed: true, message: 'README.md not found -- nothing to check' };
  }
  const content = fs.readFileSync(readmePath, 'utf8');
  const match = content.match(README_INSTALL_TAG_PATTERN);
  if (!match) {
    return { passed: true, message: 'README.md has no pinned-tag install command -- nothing to check' };
  }
  const tag = match[1];
  let existingTags;
  try {
    existingTags = createGitInspect(gitPortOptions(mainCheckout)).resolveRef({ name: `refs/tags/${tag}` }).kind === 'absent' ? '' : tag;
  } catch {
    return { passed: true, message: `could not list git tags -- nothing to check for "${tag}"` };
  }
  if (existingTags === tag) {
    return { passed: true, message: `README.md's pinned install tag "${tag}" exists` };
  }
  return {
    passed: false,
    message: `README.md recommends installing tag "${tag}", which does not exist -- cut it per docs/how-to/cut-a-fgos-release-tag.md, or update README.md to a tag that does exist`,
  };
}

registerCheck({
  id: 'readme-install-tag-exists',
  description: 'README.md\'s recommended install command pins a git tag that actually exists (tsk-2t8)',
  check: (cwd) => checkReadmeInstallTagExists(cwd),
});

// tsk-1m0 (docs/history/doctor-check-enduser-docs-index-stale/CONTEXT.md):
// the fgos-indexing skill's whole job is regenerating
// docs/enduser-docs-index.json after every compound-learn doc write, but
// nothing ever verified it actually ran -- real measurement showed drift
// growing from 32% to 36% of on-disk end-user docs missing from the index
// in one day, unflagged. READ-ONLY by construction (same as every other
// check here): `computeEnduserDocsIndex` enumerates docs/ and folds the
// event log but never writes -- it is the read-only half of the same
// generation path `fgos docs-index` and `fixEnduserDocsIndexStale` below
// both use, so this check never reimplements or diverges from what a real
// `docs-index` run would compute. One-directional (CONTEXT.md D2): reports
// on-disk docs missing from the index, never the reverse (a stale index
// entry whose doc was deleted) -- real measured drift has always been zero
// of the latter, out of scope for this item. A missing manifest or missing
// quadrant dir is a normal, common state (CONTEXT.md D5) -- same
// "absent capability = clean skip" contract `checkChangelogUnreleasedStale`
// already gives a missing CHANGELOG.md.
function checkEnduserDocsIndexStale(cwd) {
  const mainCheckout = resolveMainCheckout(cwd);
  const root = mainCheckout ?? cwd;
  const fgosDir = path.join(root, '.fgos');
  const { entries, previousContent } = computeEnduserDocsIndex(root, fgosDir);
  if (previousContent === undefined) {
    return {
      passed: true,
      message: `${manifestPathFor(root)} not found -- nothing to check (project has not generated an end-user doc index yet)`,
    };
  }
  const parsedIndex = JSON.parse(previousContent);
  const indexedPaths = new Set(parsedIndex.map((e) => e.docPath));
  const freshPaths = new Set(entries.map((e) => e.docPath));
  const total = entries.length;
  const missing = entries.filter((e) => !indexedPaths.has(e.docPath)).length;
  const orphans = parsedIndex.filter((e) => !freshPaths.has(e.docPath)).length;
  if (missing === 0 && orphans === 0) {
    return { passed: true, message: `${total}/${total} tài liệu end-user có trong index -- up to date` };
  }
  const parts = [];
  if (missing > 0) {
    parts.push(`${missing}/${total} tài liệu end-user chưa có trong index`);
  }
  if (orphans > 0) {
    parts.push(`${orphans} tài liệu dư thừa trong index`);
  }
  return {
    passed: false,
    message: `${parts.join(', ')} -- chạy fgos docs-index`,
  };
}

// Idempotent (same discipline `fixGateBypassConfigured` already uses):
// reuses `generateEnduserDocsIndex` -- the exact same generation path
// `fgos docs-index` runs -- so fix output is byte-identical to running
// that verb directly (CONTEXT.md D4), never a reimplementation.
function fixEnduserDocsIndexStale(cwd) {
  const mainCheckout = resolveMainCheckout(cwd);
  const root = mainCheckout ?? cwd;
  const fgosDir = path.join(root, '.fgos');
  // Refresh only: a project adopts the index by running `fgos docs-index`.
  if (!fs.existsSync(manifestPathFor(root))) return { changed: false, message: 'skipped -- no end-user doc index in this project (run fgos docs-index to adopt)' };
  const { path: manifestRelPath, count, changed } = generateEnduserDocsIndex(root, fgosDir);
  if (!changed) {
    return { changed: false, message: `${manifestRelPath} already up to date (${count} tài liệu)` };
  }
  return { changed: true, message: `regenerated ${manifestRelPath} (${count} tài liệu)` };
}

registerCheck({
  id: 'enduser-docs-index-stale',
  description: 'docs/enduser-docs-index.json covers every on-disk end-user doc (tsk-1m0)',
  check: (cwd) => checkEnduserDocsIndexStale(cwd),
});

registerFix({
  id: 'enduser-docs-index-stale',
  fix: (cwd) => fixEnduserDocsIndexStale(cwd),
});

// tsk-1lv review-fix F10: `fgos decision-index --check` (tsk-1lv-2)
// existed as a CLI verb but nothing ever called it -- not `npm test`, not
// `fgos doctor` -- so docs/decisions/index.md could drift silently from
// state.decisions the exact same way docs/enduser-docs-index.json used to
// (tsk-1m0, the direct precedent this check/fix pair mirrors: read-only
// `computeDecisionIndex` shared by both the check and the real generate
// path, so this can never diverge from what `fgos decision-index` itself
// would compute). A missing docs/decisions/index.md is a normal state for
// any project with zero platform-scoped decisions logged yet -- same
// "absent capability = clean skip" contract as the enduser-index check.
// tsk-1lv round-2 review, H2: `previousContent === undefined` used to
// always mean "nothing to check" regardless of whether real decisions
// exist to index -- so "the index was deleted (or never generated) while
// 36 real scope-carrying decisions sit in state.decisions" (the exact
// drift this check exists to catch) reported passed:true, with a message
// that asserted "no platform-scoped decisions logged yet" without ever
// looking at whether that was true. Reproduced against the live repo,
// not assumed. Fixed: "nothing to check" now requires BOTH the file
// being absent AND the freshly-computed content having no real rows --
// a missing file with real content to index is the same failure as a
// stale one, just worded for the "never generated" case specifically.
function checkDecisionIndexStale(cwd) {
  const mainCheckout = resolveMainCheckout(cwd);
  const root = mainCheckout ?? cwd;
  const fgosDir = path.join(root, '.fgos');
  const { previousContent, nextContent, changed } = computeDecisionIndex(root, fgosDir);
  const nextHasRows = /^\|.+\|.*\|\s*$/m.test(nextContent);
  if (previousContent === undefined) {
    // In the fgOS source repo a missing index with rows to project is drift;
    // in any other project the index is opt-in and only refreshed.
    if (!nextHasRows || !isFgosSourceCheckout(root)) {
      return {
        passed: true,
        message: `${indexPathFor(root)} not found -- nothing to check${nextHasRows ? ' (run fgos decision-index to adopt it)' : ''}`,
      };
    }
    return {
      passed: false,
      message: `${indexPathFor(root)} not found, but state.decisions has platform-scoped decisions to index -- run fgos decision-index`,
    };
  }
  if (!changed) {
    return { passed: true, message: `${indexPathFor(root)} up to date` };
  }
  return {
    passed: false,
    message: `${indexPathFor(root)} is stale relative to state.decisions -- run fgos decision-index`,
  };
}

// tsk-1lv round-2 review, B3: generateDecisionIndex's own F12 safety
// refusal (never overwrite real rows with an empty regenerate) escaped
// uncaught here, and `runFixes` (src/setup/checks.mjs) maps over every
// registered fix with no try/catch of its own -- so the throw aborted the
// ENTIRE `fgos doctor --fix` run, discarding every other fix's result.
// Reproduced directly: a directory with a committed, row-carrying
// docs/decisions/index.md and no readable .fgos store (this repo's own
// merged-to-main future state on a fresh clone before .fgos exists) hit
// this and returned exit 4 with no report at all. A refusal here is a
// real, legitimate "this fix can't run safely right now" outcome, not a
// crash -- report it through the same {changed, message} contract every
// other fix already promises, so one fix's refusal never takes down the
// rest of `doctor --fix`'s run.
function fixDecisionIndexStale(cwd) {
  const mainCheckout = resolveMainCheckout(cwd);
  const root = mainCheckout ?? cwd;
  const fgosDir = path.join(root, '.fgos');
  // Outside the fgOS source repo, refresh only: a project adopts the index by
  // running `fgos decision-index`.
  if (!fs.existsSync(indexPathFor(root)) && !isFgosSourceCheckout(root)) return { changed: false, message: 'skipped -- no decision index in this project (run fgos decision-index to adopt)' };
  let result;
  try {
    result = generateDecisionIndex(root, fgosDir);
  } catch (err) {
    if (err instanceof StoreError) {
      return { changed: false, message: `skipped -- ${err.message}` };
    }
    throw err;
  }
  if (!result.changed) {
    return { changed: false, message: `${result.path} already up to date` };
  }
  return { changed: true, message: `regenerated ${result.path}` };
}

registerCheck({
  id: 'decision-index-stale',
  description: 'docs/decisions/index.md matches every scope-carrying decision in state.decisions (tsk-1lv-2/tsk-1lv)',
  check: (cwd) => checkDecisionIndexStale(cwd),
});

registerFix({
  id: 'decision-index-stale',
  fix: (cwd) => fixDecisionIndexStale(cwd),
});

function runInstructionProjectionHelper(root, mode) {
  const moduleUrl = new URL('./instruction-projections.mjs', import.meta.url).href;
  const script = `
    import { inspectInstructionProjection, materializeInstructionProjection } from ${JSON.stringify(moduleUrl)};
    const root = ${JSON.stringify(root)};
    const result = ${mode === 'inspect' ? 'inspectInstructionProjection(root)' : 'materializeInstructionProjection(root)'};
    const computed = result.computed;
    console.log(JSON.stringify({
      passed: result.passed,
      changed: result.changed,
      materialized: result.materialized,
      problems: result.problems ?? [],
      destinationRelativePath: computed.destinationRelativePath,
      effectiveSetRelativePath: computed.effectiveSetRelativePath,
      ledgerRelativePath: computed.ledgerRelativePath
    }));
  `;
  try {
    return JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', script], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }));
  } catch (err) {
    const detail = err.stderr ? String(err.stderr).trim() : err.message;
    throw new Error(detail || err.message);
  }
}

function checkInstructionProjectionsStale(cwd) {
  const root = resolveMainCheckout(cwd) ?? cwd;
  if (!fs.existsSync(path.join(root, 'core', 'instructions'))) {
    return { passed: true, message: 'core/instructions not found -- nothing to project' };
  }
  try {
    const result = runInstructionProjectionHelper(root, 'inspect');
    if (result.passed) {
      if (!result.materialized) {
        return {
          passed: true,
          message: 'instruction projections not materialized -- run fgos doctor --fix to generate them',
        };
      }
      return {
        passed: true,
        message: `${result.destinationRelativePath}, ${result.effectiveSetRelativePath}, and ${result.ledgerRelativePath} up to date`,
      };
    }
    return {
      passed: false,
      message: `${result.problems.join('; ')} -- run fgos doctor --fix`,
    };
  } catch (err) {
    return { passed: false, message: err.message };
  }
}

function fixInstructionProjectionsStale(cwd) {
  const root = resolveMainCheckout(cwd) ?? cwd;
  if (!fs.existsSync(path.join(root, 'core', 'instructions'))) {
    return { changed: false, message: 'core/instructions not found -- nothing to project' };
  }
  try {
    const result = runInstructionProjectionHelper(root, 'materialize');
    if (!result.changed) {
      return { changed: false, message: 'instruction projections already up to date' };
    }
    return {
      changed: true,
      message: `regenerated ${result.destinationRelativePath}, ${result.effectiveSetRelativePath}, and ${result.ledgerRelativePath}`,
    };
  } catch (err) {
    return { changed: false, message: `skipped -- ${err.message}` };
  }
}

registerCheck({
  id: 'instruction-projections-stale',
  description: 'effective instruction-set projections and ledger are current (packaging-distribution P5)',
  check: (cwd) => checkInstructionProjectionsStale(cwd),
});

registerFix({
  id: 'instruction-projections-stale',
  fix: (cwd) => fixInstructionProjectionsStale(cwd),
});

// Same marker the release drift check uses to recognise the fgOS source repo.
function isFgosSourceCheckout(root) {
  return fs.existsSync(path.join(root, 'apps/fgos/Cargo.toml'));
}

// The doc registry is opt-in per project: doctor --fix only refreshes it.
function docRegistryAdopted(root) {
  return fs.existsSync(path.join(root, 'docs/doc-registry.md')) || fs.existsSync(path.join(root, 'docs/doc-registry.json'));
}

function checkDocRegistryStale(cwd, run) {
  const root = resolveMainCheckout(cwd) ?? cwd;
  if (!docRegistryAdopted(root)) {
    return { passed: true, message: 'not applicable -- no doc registry in this project (run fgos doc-registry to adopt)' };
  }
  const view = doctorWorkView(root, run);
  if (view === null) {
    return { passed: true, message: 'knowledge registry check skipped -- no Work store' };
  }
  const { jsonContent, mdContent } = computeKnowledgeProjection(view);
  const mdPath = path.join(root, 'docs/doc-registry.md');
  const jsonPath = path.join(root, 'docs/doc-registry.json');
  const mdOk = fs.existsSync(mdPath) && fs.readFileSync(mdPath, 'utf8') === mdContent;
  const jsonOk = fs.existsSync(jsonPath) && fs.readFileSync(jsonPath, 'utf8') === jsonContent;

  if (mdOk && jsonOk) {
    return { passed: true, message: 'doc-registry projections up to date' };
  }
  return { passed: false, message: 'docs/doc-registry.md or docs/doc-registry.json is stale -- run fgos doc-registry' };
}

function fixDocRegistryStale(cwd) {
  const mainCheckout = resolveMainCheckout(cwd);
  const root = mainCheckout ?? cwd;
  if (!docRegistryAdopted(root)) {
    return { changed: false, message: 'skipped -- no doc registry in this project (run fgos doc-registry to adopt)' };
  }
  // A fix reads the store itself: it must not act on a view an earlier row of this run read before the fixes ran.
  const view = doctorWorkView(root);
  if (view === null) {
    return { changed: false, message: 'skipped -- no Work store' };
  }
  const { jsonContent, mdContent } = computeKnowledgeProjection(view);
  const mdPath = path.join(root, 'docs/doc-registry.md');
  const jsonPath = path.join(root, 'docs/doc-registry.json');

  fs.mkdirSync(path.dirname(mdPath), { recursive: true });
  fs.writeFileSync(mdPath, mdContent, 'utf8');
  fs.writeFileSync(jsonPath, jsonContent, 'utf8');
  return { changed: true, message: 'regenerated docs/doc-registry.md and docs/doc-registry.json' };
}

// tsk-28x code review finding: this used to treat "no file on disk at the
// alias path" as broken -- but D-tsk28x-9 defines an alias as a doc's OLD
// path, kept purely as a historical lookup key (never a live location);
// after a real migration (`fgos doc move-path`), the file legitimately no
// longer exists there, which is the correct, expected post-migration
// state, not a defect. That made this check fail every doc a migration
// had already moved. The real "broken" shape (per resolveDocPath, this
// same file's own resolver) is an alias that resolves AMBIGUOUSLY: two or
// more non-retired docs claiming the identical alias string, or an alias
// that collides with a DIFFERENT doc's own currentPath.
function checkDocAliasBroken(cwd, run) {
  const root = resolveMainCheckout(cwd) ?? cwd;
  const view = doctorWorkView(root, run);
  if (view === null) return { passed: true, message: 'skipped' };
  const docs = Object.values(view.docs || {}).filter((d) => d.docLifecycle !== 'retired');
  const aliasOwners = new Map();
  for (const doc of docs) {
    for (const alias of doc.aliases || []) {
      if (!aliasOwners.has(alias)) aliasOwners.set(alias, []);
      aliasOwners.get(alias).push(doc.docId);
    }
  }
  const currentPaths = new Map(docs.map((d) => [d.currentPath, d.docId]));
  const broken = [];
  for (const [alias, owners] of aliasOwners) {
    if (owners.length > 1) {
      broken.push(`${alias}: claimed by ${owners.length} docs (${owners.join(', ')})`);
    } else if (currentPaths.has(alias) && currentPaths.get(alias) !== owners[0]) {
      broken.push(`${alias}: alias of ${owners[0]} but also the currentPath of ${currentPaths.get(alias)}`);
    }
  }
  if (broken.length === 0) return { passed: true, message: 'no broken doc aliases' };
  return { passed: false, message: `found ${broken.length} broken doc aliases: ${broken.join('; ')}` };
}

function checkDocActiveDuplicate(cwd, run) {
  const root = resolveMainCheckout(cwd) ?? cwd;
  const view = doctorWorkView(root, run);
  if (view === null) return { passed: true, message: 'skipped' };
  const counts = {};
  for (const doc of Object.values(view.docs || {})) {
    if (doc.docLifecycle === 'active') {
      const key = `${doc.topicId}:${doc.role}`;
      counts[key] = (counts[key] || 0) + 1;
    }
  }
  const dupes = Object.entries(counts).filter(([, c]) => c > 1);
  if (dupes.length === 0) return { passed: true, message: 'no duplicate active docs' };
  return { passed: false, message: `active duplicate docs found for: ${dupes.map(([k]) => k).join(', ')}` };
}

// tsk-28x code review finding: this used to pass `docsDir` (a bare string
// path) straight to findDuplicateAuthoritativeClaims, which expects an
// ARRAY of `{path, authoritativeFor}` candidates -- iterating a string
// yields its individual characters, none of which ever carry an
// `authoritativeFor` property, so the check always reported zero groups
// regardless of real duplicates. Also scoped to `docs/how-to` only, a
// layout assumption the knowledge-registry migration retires (docs move to
// a flat `docs/<purposeSlug>/<role>.md` layout, no quadrant subfolders).
// Fixed: walk the whole `docs/` tree, read each file's real frontmatter,
// and build the candidate array the function actually expects.
function checkDocNearDuplicate(cwd) {
  const root = resolveMainCheckout(cwd) ?? cwd;
  const docsDir = path.join(root, 'docs');
  if (!fs.existsSync(docsDir)) return { passed: true, message: 'skipped' };
  const candidates = [];
  for (const relPath of fs.readdirSync(docsDir, { recursive: true })) {
    if (!relPath.endsWith('.md')) continue;
    const absPath = path.join(docsDir, relPath);
    if (!fs.statSync(absPath).isFile()) continue;
    const { meta } = parseFrontmatter(fs.readFileSync(absPath, 'utf8'));
    const authoritativeFor = Array.isArray(meta.authoritative_for) ? meta.authoritative_for[0] : meta.authoritative_for;
    if (typeof authoritativeFor === 'string' && authoritativeFor.trim()) {
      candidates.push({ path: path.join('docs', relPath), authoritativeFor });
    }
  }
  const groups = findDuplicateAuthoritativeClaims(candidates);
  if (groups.length === 0) return { passed: true, message: 'no near-duplicate authoritative claims' };
  return { passed: false, message: `found ${groups.length} near-duplicate claim groups: ${groups.map((g) => g.map((c) => c.path).join(' ~ ')).join('; ')}` };
}

function checkDocProvisionalAged(cwd, run) {
  const root = resolveMainCheckout(cwd) ?? cwd;
  const view = doctorWorkView(root, run);
  if (view === null) return { passed: true, message: 'skipped' };
  const now = Date.now();
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
  const aged = [];
  for (const doc of Object.values(view.docs || {})) {
    if (doc.docLifecycle === 'provisional' && doc.updatedAt && (now - doc.updatedAt > maxAgeMs)) {
      aged.push(doc.docId);
    }
  }
  if (aged.length === 0) return { passed: true, message: 'no aged provisional docs' };
  return { passed: false, message: `provisional docs aged >7 days: ${aged.join(', ')}` };
}

function checkDocTopicOversized(cwd, run) {
  const root = resolveMainCheckout(cwd) ?? cwd;
  const view = doctorWorkView(root, run);
  if (view === null) return { passed: true, message: 'skipped' };
  const maxDocs = effectiveSection(cwd, 'docRegistry')?.topicMaxDocs ?? 10;
  const oversized = [];
  for (const topic of Object.values(view.topics || {})) {
    const count = Object.values(view.docs || {}).filter((d) => d.topicId === topic.topicId).length;
    if (count > maxDocs) oversized.push(`${topic.topicId} (${count} docs)`);
  }
  if (oversized.length === 0) return { passed: true, message: 'no oversized topics' };
  return { passed: false, message: `oversized topics: ${oversized.join(', ')}` };
}

function checkDocRoleUnderused(cwd, run) {
  const root = resolveMainCheckout(cwd) ?? cwd;
  const view = doctorWorkView(root, run);
  if (view === null) return { passed: true, message: 'skipped' };
  const roleCounts = {};
  for (const doc of Object.values(view.docs || {})) {
    roleCounts[doc.role] = (roleCounts[doc.role] || 0) + 1;
  }
  const underused = Object.entries(roleCounts).filter(([, c]) => c === 1);
  if (underused.length === 0) return { passed: true, message: 'no underused roles' };
  return { passed: true, message: `${underused.length} roles used by single doc: ${underused.map(([r]) => r).join(', ')}` };
}

// docs/architect/knowledge-registry-redesign.md §14.6: "current path absent
// at HEAD" -- a doc's own currentPath is the thing every other check
// (resolver, migration, doc-alias-broken) treats as ground truth; if the
// file isn't actually committed there, every one of those checks is
// silently trusting a path that doesn't exist.
function checkDocCurrentPathMissing(cwd, run) {
  const root = resolveMainCheckout(cwd) ?? cwd;
  const view = doctorWorkView(root, run);
  if (view === null) return { passed: true, message: 'skipped' };
  if (!fs.existsSync(path.join(root, '.git'))) return { passed: true, message: 'skipped (not a git checkout)' };
  const missing = [];
  let head = null;
  try { head = commitAt(root, 'HEAD'); } catch { /* no commit: every live path is missing at HEAD */ }
  for (const doc of Object.values(view.docs || {})) {
    if (!isLiveDocLifecycle(doc.docLifecycle)) continue;
    try {
      if (!head || !pathExistsAt(root, head, doc.currentPath)) throw new Error('current path absent at HEAD');
    } catch {
      missing.push(`${doc.docId} (${doc.currentPath})`);
    }
  }
  if (missing.length === 0) return { passed: true, message: 'every live doc currentPath exists at HEAD' };
  return { passed: false, message: `${missing.length} doc(s) with currentPath absent at HEAD: ${missing.join(', ')}` };
}

// docs/architect/knowledge-registry-redesign.md §14.6: "source capture
// linkage cannot be reached through current or alias paths." Only checks
// sourceCaptureIds entries that are themselves a repo-relative doc path
// (the shape scripts/knowledge-bootstrap.mjs seeds -- the doc's own
// original oldPath, recorded as its first "capture") -- a captureId that
// is a work-item id (via `doc.attest`) is not a path and has nothing to
// resolve here.
function looksLikeDocPath(value) {
  return typeof value === 'string' && value.startsWith('docs/') && value.endsWith('.md');
}

function checkDocSourceUnreachable(cwd, run) {
  const root = resolveMainCheckout(cwd) ?? cwd;
  const view = doctorWorkView(root, run);
  if (view === null) return { passed: true, message: 'skipped' };
  const unreachable = [];
  for (const doc of Object.values(view.docs || {})) {
    if (!isLiveDocLifecycle(doc.docLifecycle)) continue;
    for (const captureId of doc.sourceCaptureIds || []) {
      if (!looksLikeDocPath(captureId)) continue;
      const isOwnPath = captureId === doc.currentPath || (doc.aliases || []).includes(captureId);
      if (isOwnPath) continue;
      const resolved = resolveDocPath(view, captureId);
      const resolvesToSameDoc = resolved && !Array.isArray(resolved) && resolved.docId === doc.docId;
      if (!resolvesToSameDoc) {
        unreachable.push(`${doc.docId}: source '${captureId}' not reachable through its own current or alias paths`);
      }
    }
  }
  if (unreachable.length === 0) return { passed: true, message: 'every path-shaped source capture is reachable' };
  return { passed: false, message: `${unreachable.length} unreachable source capture(s): ${unreachable.join('; ')}` };
}

// docs/architect/knowledge-registry-redesign.md §13.4/§14.6: "migration
// inventory or apply loses a source." Four real conservation properties,
// not just the original outcome-reachability check:
//   1. every source captures reachable (pre-existing: view.outcomes[].docPath
//      resolves through the live registry);
//   2. every migration-inventory source appears exactly once (a classifier
//      bug assigning the same file to two rows, same shape
//      scripts/knowledge-migration.mjs's own conservation check refuses at
//      apply time -- this check catches it even when migration never runs);
//   3. every live (non-retired) doc has at least one sourceCaptureIds entry
//      -- a "target document with no source" (§13.4);
//   4. every migration-inventory source is still traceable -- either still
//      on disk at its original oldPath (not migrated yet), or reachable
//      through the live registry (properly migrated with an alias) -- never
//      neither, which would mean a source was physically lost mid-migration.
function checkDocSourceConservation(cwd, run) {
  const root = resolveMainCheckout(cwd) ?? cwd;
  const view = doctorWorkView(root, run);
  if (view === null) return { passed: true, message: 'skipped' };
  const problems = [];

  const outcomes = view.outcomes || {};
  let unreachableOutcomeCount = 0;
  for (const outcome of Object.values(outcomes)) {
    if (outcome.docPath && !resolveDocPath(view, outcome.docPath)) unreachableOutcomeCount++;
  }
  if (unreachableOutcomeCount > 0) problems.push(`${unreachableOutcomeCount} outcome source capture(s) unresolvable`);

  for (const doc of Object.values(view.docs || {})) {
    if (isLiveDocLifecycle(doc.docLifecycle) && (doc.sourceCaptureIds || []).length === 0) {
      problems.push(`${doc.docId}: target document has no source (empty sourceCaptureIds)`);
    }
  }

  const inventoryPath = path.join(root, 'docs/history/compound-learn-artifact-registry/reports/inventory-data.json');
  if (fs.existsSync(inventoryPath)) {
    let inventory = [];
    try {
      inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
    } catch {
      inventory = [];
    }
    // The try/catch above only guards a JSON *parse* failure -- valid JSON
    // that isn't an array (a buggy classifier run writing `{}`/`null`/a
    // single object) parses cleanly and would otherwise reach `for...of`
    // below and throw, taking down every OTHER doctor check in the same
    // `fgos doctor` run (bin/fgos.mjs calls every check with no per-check
    // try/catch of its own).
    if (!Array.isArray(inventory)) {
      inventory = [];
    }
    const sourceCounts = new Map();
    for (const row of inventory) {
      if (typeof row.oldPath !== 'string') continue;
      sourceCounts.set(row.oldPath, (sourceCounts.get(row.oldPath) ?? 0) + 1);
    }
    for (const [oldPath, count] of sourceCounts) {
      if (count > 1) problems.push(`inventory source '${oldPath}' appears ${count} times, not exactly once`);
    }
    const lost = [];
    for (const oldPath of sourceCounts.keys()) {
      if (fs.existsSync(path.join(root, oldPath))) continue; // not migrated yet -- still where the inventory says
      if (resolveDocPath(view, oldPath)) continue; // migrated, still traceable via alias/currentPath
      lost.push(oldPath);
    }
    if (lost.length > 0) problems.push(`${lost.length} inventory source(s) lost (neither on disk nor reachable through the registry): ${lost.join(', ')}`);
  }

  if (problems.length === 0) return { passed: true, message: 'source conservation holds' };
  return { passed: false, message: problems.join('; ') };
}

registerCheck({ id: 'doc-registry-stale', description: 'docs/doc-registry.md and doc-registry.json up to date', check: checkDocRegistryStale });
registerFix({ id: 'doc-registry-stale', fix: fixDocRegistryStale });
registerCheck({ id: 'doc-alias-broken', description: 'doc aliases point to valid paths', check: checkDocAliasBroken });
registerCheck({ id: 'doc-active-duplicate', description: 'no duplicate active docs for same topic and role', check: checkDocActiveDuplicate });
registerCheck({ id: 'doc-current-path-missing', description: 'doc currentPath absent at HEAD', check: checkDocCurrentPathMissing });
registerCheck({ id: 'doc-source-unreachable', description: 'source capture linkage reachable through current or alias paths', check: checkDocSourceUnreachable });
registerCheck({ id: 'doc-near-duplicate', description: 'near-duplicate authoritative claims check', check: checkDocNearDuplicate });
registerCheck({ id: 'doc-provisional-aged', description: 'provisional docs age check', check: checkDocProvisionalAged });
registerCheck({ id: 'doc-topic-oversized', description: 'topic size check against ceiling', check: checkDocTopicOversized });
registerCheck({ id: 'doc-role-underused', description: 'role usage frequency check', check: checkDocRoleUnderused });
registerCheck({ id: 'doc-source-conservation', description: 'source captures conservation check', check: checkDocSourceConservation });

function getMergeHeadSha(mainCheckout) {
  try {
    return createGitInspect(gitPortOptions(mainCheckout)).resolveCommit({ name: 'MERGE_HEAD' }) || null;
  } catch {
    return null;
  }
}

function checkNoStuckMergeAbort(cwd) {
  const mainCheckout = resolveMainCheckout(cwd);
  if (mainCheckout === null) {
    return { passed: true, message: 'not inside a git checkout — nothing to check' };
  }
  const sha = getMergeHeadSha(mainCheckout);
  if (sha !== null) {
    return {
      passed: false,
      message: `merge in progress or stuck (MERGE_HEAD=${sha}) — run fgos main-checkout-reset --sha ${sha} --confirm`,
    };
  }
  return { passed: true, message: 'no merge in progress or stuck MERGE_HEAD' };
}

// Unattended automation must never mutate the shared main checkout's git
// plumbing without a human reviewing real `git status` first (plan.md).
// Therefore, this fix always returns changed: false and names the manual
// recovery command `fgos main-checkout-reset --sha <sha> --confirm`.
function fixNoStuckMergeAbort(cwd) {
  const mainCheckout = resolveMainCheckout(cwd);
  if (mainCheckout === null) {
    return { changed: false, message: 'not inside a git checkout — nothing to fix' };
  }
  const sha = getMergeHeadSha(mainCheckout);
  if (sha === null) {
    return { changed: false, message: 'no merge in progress — nothing to fix' };
  }
  return {
    changed: false,
    message: `merge in progress or stuck (MERGE_HEAD=${sha}) — run fgos main-checkout-reset --sha ${sha} --confirm`,
  };
}

registerCheck({
  id: 'no-stuck-merge-abort',
  description: 'main checkout has no lingering MERGE_HEAD from an in-progress or stuck merge abort (tsk-40a)',
  check: (cwd) => checkNoStuckMergeAbort(cwd),
});

registerFix({
  id: 'no-stuck-merge-abort',
  fix: (cwd) => fixNoStuckMergeAbort(cwd),
});

// Phase 02 R8 (docs/architect/agent-coordination/contracts/flow-definition.md,
// ADR-009), AGENTS.md's install/setup/doctor gate: the new FlowDefinition
// definition surface (Workflow projection adapter + CoordinationProtocol
// loader, src/runner/definitions/) is a real infra dependency (it shells
// out to `fs`, discovers files off disk, and validates their shape) --
// this makes it discoverable through `fgos doctor` rather than standing
// alone unregistered. Both checks are READ-ONLY (same RUL9 discipline
// every other check in this file follows): `discoverCoordinationProtocols`
// only reads from disk, never writes. No new config default is registered
// alongside these -- discovery is a fixed, deterministic filesystem
// convention (project `.fgos/coordination-protocols/`, `domains/<name>/
// coordination-protocols/`, packaged `core/coordination-protocols/`), the
// same non-configurable style `domain-registry.mjs`'s own
// `domains/`/`core/task-specs/` discovery already uses -- there is no
// runtime read of a "coordination protocols path" config key to register
// a default for.

// tsk-397's `resolveTaskSpecPath`'s own `core: 'core'` convention gives
// `discoverCoordinationProtocols` its default `cwd`/`packageRoot`
// resolution already (see protocol-loader.mjs's own header) -- this check
// only needs to run it and report the FlowDefinitionError's own message,
// which already carries the offending source path (protocol-loader.mjs's
// `relativeToPackageRoot` suffix on every thrown error).
function checkCoordinationProtocolFixturesValid(cwd) {
  return { passed: true, message: 'coordination protocol fixtures retired' };
}

registerCheck({
  id: 'coordination-protocol-fixtures-valid',
  description: 'every discoverable CoordinationProtocol definition (project/domain/core tiers) normalizes through validateFlowDefinition (Phase 02 R6/R7)',
  check: (cwd) => checkCoordinationProtocolFixturesValid(cwd),
});

function checkOperationPromptTemplatesValid(cwd) {
  try {
    const entries = discoverOperationPromptTemplates({ cwd });
    return {
      passed: true,
      message: `${entries.length} operation prompt template(s) discovered and validated cleanly (project/domain/core tiers)`,
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
  description: 'every discoverable operation prompt template (project/domain/core tiers) validates against bounded variables and schema (Phase 03 I04)',
  check: (cwd) => checkOperationPromptTemplatesValid(cwd),
});

// Step 08 Phase 07 R3, AGENTS.md's install/setup/doctor gate: `fgos
// coordination run --file <request>`'s own published example request
// files (docs/how-to/coordination-examples/*.json -- one agent-led
// request, one declared consult, one research protocol, one Group
// Cognition framework example, per this phase's own requirement) are real
// package contents a user copies and edits; this check keeps them from
// silently rotting the same way `coordination-protocol-fixtures-valid`
// above already keeps the protocol yaml fixtures themselves honest. Reuses
// the SAME `validateCoordinationRequest` the CLI itself runs on every
// invocation (never a second, drifting copy of the schema), plus
// `loadCoordinationProtocol` for any example that references a protocol by
// id, so a future protocol rename/removal is caught here too. Read-only
// (RUL9): only reads the example files and the protocol registry, never
// writes.
function checkCoordinationExampleRequestsValid(cwd) {
  return { passed: true, message: 'coordination example requests retired' };
}

registerCheck({
  id: 'coordination-example-requests-valid',
  description: 'published `fgos coordination run` example request files validate against the same schema boundary the CLI itself enforces, and resolve every referenced protocolRef (Step 08 Phase 07 R3)',
  check: (cwd) => checkCoordinationExampleRequestsValid(cwd),
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
export function checkTrustStoreWritable(storePath = path.join(os.homedir(), '.claude.json')) {
  let raw;
  try {
    raw = fs.readFileSync(storePath, 'utf8');
  } catch (err) {
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
      const store = credentialStoreOf(inv && { ...inv, command: inv.command ?? executor.command });
      if (!store) continue;
      const label = `executor "${id}" invocation "${inv.id ?? '?'}"`;
      const provider = normalizeProviderFamily(executor.providerModel ?? executor.provider);
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
  description: 'Phase 06 (executor-policy-dispatch-seams): legacy executor entries hardcoding policy-shaped flags or account-pool-like env, each named with its documented migration target',
  check: (cwd) => {
    try {
      return checkExecutorProfileWarnings(cwd, loadRunnerConfigForDir(cwd));
    } catch (err) {
      return { passed: true, message: `runner config not loadable here, executor-profile warnings not evaluated: ${err.message}` };
    }
  },
});

registerCheck({
  id: 'trust-store-readable',
  description: 'the agent folder-trust store is readable and carries a usable "projects" object, so a dispatch into a fresh worktree can be pre-trusted instead of stopping at a dialog',
  check: () => checkTrustStoreWritable(),
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
  description: 'every seat of every Workflow unit binds under the committed config in a fixed headless session (no lease, nothing started); a policy refusal fails, no pool, account state, tier caps and shared families are information',
  check: (cwd) => checkSeatBindingDryBind(cwd, {
    packageRoot: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'),
    loadRunnerConfig: loadRunnerConfigForDir,
  }),
});

registerCheck({
  id: 'blind-steps-use-proven-pools',
  description: 'every blind Workflow unit can only bind executors whose provider family and transport were proven to keep a worker blind (read-only, no model call)',
  check: (cwd) => checkBlindStepsUseProvenPools(cwd, {
    packageRoot: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'),
    loadRunnerConfig: loadRunnerConfigForDir,
  }),
});

registerCheck({
  id: 'executor-posture-coverage',
  description: 'core capabilities (execute, code:implement, and capabilities declaring a pool) have at least one candidate executor capable of applying read-only and workspace-write postures',
  check: (cwd) => checkExecutorPostureCoverage(cwd, {
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
    // here is not a failure; matches command-routes-drift's own
    // pass-with-skip pattern below.
    return {
      passed: true,
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
    let stat;
    try {
      stat = fs.lstatSync(current);
    } catch (error) {
      if (optional && error.code === 'ENOENT') return null;
      throw error;
    }
    if (stat.isSymbolicLink()) throw new Error(`Symlink refused in checkout diagnosis: ${current}`);
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
    if (!marker) return { passed: true, message: 'active-release-matches-checkout skipped: outside an fgOS source checkout (apps/fgos/Cargo.toml absent)' };
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
        return { passed: true, message: `active-release-matches-checkout skipped: activation belongs to main checkout ${main}, not this linked worktree` };
      }
      return { passed: true, message: 'active-release-matches-checkout skipped: no activation owned by doctor dir' };
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
      return { passed: true, message: 'active-release-matches-checkout skipped: development manifest uses this checkout directly (legacyNode.root=".")' };
    }
    if (!activation) {
      return { passed: true, message: 'active-release-matches-checkout skipped: no activation owned by doctor dir (explicit manifest is not this checkout development payload)' };
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

function checkCommandRoutesDrift(cwd) {
  const root = resolveMainCheckout(cwd) ?? cwd;
  const candidateDirs = [cwd, process.cwd(), root].filter((d, i, arr) => d && arr.indexOf(d) === i);
  let scriptPath = null;
  let runCwd = cwd;

  for (const candidate of candidateDirs) {
    const p = path.join(candidate, 'scripts', 'export-command-selectors.mjs');
    if (fs.existsSync(p)) {
      scriptPath = p;
      runCwd = candidate;
      break;
    }
  }

  if (!scriptPath) {
    return {
      passed: true,
      message: 'scripts/export-command-selectors.mjs not present (release tree install -- command-routes-drift skipped)',
    };
  }
  try {
    execFileSync(process.execPath, [scriptPath, '--check'], {
      cwd: runCwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return {
      passed: true,
      message: 'command routes descriptor matches current command registry and annotations with no drift',
    };
  } catch (err) {
    const detail = (err.stderr || err.stdout || err.message || '').trim();
    return {
      passed: false,
      message: `command routes drift detected: ${detail}`,
    };
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

registerCheck({
  id: 'command-routes-drift',
  description: 'command routes descriptor matches current command registry and route annotations with no drift',
  check: (cwd) => checkCommandRoutesDrift(cwd),
});

// ─── Confinement Authority (Phase 01 R7, docs/specs/confinement-authority.md) ─

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
  // own attempts up, so it is held from the start: doctor fails naming it and --fix settles it. A root nested
  // inside another lists a home twice; it is counted once.
  const retried = new Set(retriedRoots.map(canonicalRoot));
  const seenHomes = new Set();
  const homes = roots.flatMap((root) => listKeptCredentialHomes(root).map((home) => ({ ...home, held: home.held || !retried.has(canonicalRoot(root)) })))
    .filter((home) => { const dir = path.join(canonicalRoot(path.dirname(home.dir)), path.basename(home.dir)); if (seenHomes.has(dir)) return false; seenHomes.add(dir); return true; })
    .map((home) => ({ ...home, ageMs: home.since ? now - Date.parse(home.since) : 0 }));
  const held = homes.filter((home) => home.held);
  const retrying = homes.filter((home) => !home.held);
  const overLimit = inspectPendingCopiesOverLimit({ runtimeDir, inventory });
  if (copies.length === 0 && homes.length === 0 && overLimit.length === 0) {
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
    ...(unjudgedCopies ? [] : summarizeByAccount(copies.filter((c) => c.kind !== 'torn' && c.kind !== 'staging' && !c.stranded), 'pending login copy(ies) waiting for a renewal (a dispatch for that account applies them)')),
    ...summarizeByAccount(copies.filter((c) => c.kind === 'staging' && !c.stranded), unjudged
      ? 'interrupted staging(s) of a login copy (a crash cut the copy short; "fgos doctor --fix" removes one that is empty or identical to a copy already kept, and cannot judge one against the source login of the account until the provider inventory can be read, any other stays for hand recovery)'
      : 'interrupted staging(s) of a login copy (a crash cut the copy short; "fgos doctor --fix" removes one that is empty, identical to a copy already kept, or shown by the source login of the account to be no newer, any other stays for hand recovery)'),
    ...summarizeByAccount(copies.filter((c) => c.kind === 'torn' && !c.stranded), 'half-written login copy(ies) kept for hand recovery (never applied or dropped automatically)'),
    ...held.map((home) => `${home.provider}/${home.accountId}: private home held ${home.attempts >= CREDENTIAL_KEEP_MAX_ATTEMPTS ? 'after repeated staging failures' : 'under a root that nothing retries by itself'}, ${formatAge(home.ageMs)} old, at ${home.dir} ("fgos doctor --fix" re-checks it and removes it once its login is shown to be applied or obsolete; otherwise recover the login from it by hand)`),
    ...summarizeByAccount(retrying, 'private home(s) kept after a staging failure, retried by the reaper'),
  ];
  const text = problems.join('; ');
  return held.length > 0 || stranded.length > 0 || overLimit.some((a) => a.stranded) || unjudgedCopies ? { passed: false, message: text } : { passed: true, message: `warning: ${text}` };
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
    const marker = credentialWriteBackMarker({ provider, accountId, credentialSource: source, runtimeDir });
    return marker ? { layoutName: marker.layout, sourceHome: marker.home } : null;
  };
}

export function fixCredentialCopiesRetained({ roots = credentialScanRoots(), retriedRoots = defaultConfinementTempRoots(), inventory, stagingRuntimeDir = defaultProviderCapacityRuntimeDir(), ...options } = {}) {
  const total = { settled: 0, held: 0 };
  const stagings = sweepInterruptedStagings({ runtimeDir: stagingRuntimeDir, resolveStore: stagingStoreResolver(inventory, stagingRuntimeDir) });
  const retried = new Set(retriedRoots.map(canonicalRoot));
  const { settled, held } = settleHeldCredentialHomes({ tempRoots: roots, unretriedRoots: roots.filter((root) => !retried.has(canonicalRoot(root))), ...options });
  total.settled += settled;
  total.held += held;
  const homes = total.settled + total.held === 0
    ? 'no held private home to re-check'
    : `re-checked ${total.settled + total.held} held private home(s): ${total.settled} removed, ${total.held} still held`;
  const staged = stagings.removed + stagings.kept === 0
    ? ''
    : `; interrupted staging(s): ${stagings.removed} removed, ${stagings.kept} kept for hand recovery`;
  return { changed: total.settled > 0 || stagings.removed > 0, message: `${homes}${staged}` };
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
    return { passed: true, message: `runner config not readable, herdr maturity check skipped: ${err.message}` };
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

// dispatch-engine-liveness-hardening Phase 7 (C1): shadow binder
// (`resolveVerifiedProviderArgs`, `recordShadowBinderDivergence`) now writes
// a real disagreement to a durable local JSONL instead of only an ephemeral
// stderr line. Informational, not a gate: a fallback-to-legacy disagreement
// is handled safely by design (the real spawn never regresses on
// divergence), so this never fails the check -- it only makes the
// otherwise-invisible event visible to `fgos doctor`, closing the exact gap
// this track's own investigation had to work around by manually grepping
// ~800 historical stderr.log files.
function checkShadowBinderDivergence(cwd) {
  const logPath = path.join(cwd, '.fgos', 'dispatch', 'shadow-binder-divergence.jsonl');
  if (!fs.existsSync(logPath)) {
    return { passed: true, message: 'no shadow-binder divergence recorded' };
  }
  let lines;
  try {
    lines = fs.readFileSync(logPath, 'utf8').split('\n').filter((line) => line.trim());
  } catch {
    return { passed: true, message: `${logPath} exists but could not be read` };
  }
  if (lines.length === 0) {
    return { passed: true, message: 'no shadow-binder divergence recorded' };
  }
  let last;
  try {
    last = JSON.parse(lines[lines.length - 1]);
  } catch {
    last = null;
  }
  const lastDesc = last ? `${last.binder ?? '(unknown)'} at ${last.ts ?? '(unknown)'}` : '(last entry unreadable)';
  return { passed: true, message: `${lines.length} shadow-binder divergence event(s) recorded — most recent: ${lastDesc}` };
}

registerCheck({
  id: 'shadow-binder-divergence',
  description: 'real PlacementPolicy/ProviderAdapter shadow-binder divergence is durably recorded, not only ephemeral stderr (dispatch-engine-liveness-hardening Phase 7, C1)',
  check: (cwd) => checkShadowBinderDivergence(cwd),
});

// ─── Observe Component (Phase F8, plans/260929-1501-metrics-friction-rust-native) ─

export function checkObserveDirWritable(cwd) {
  const root = resolveMainCheckoutRoot(cwd) ?? cwd;
  const observeDir = path.join(root, '.fgos', 'observe');
  try {
    if (!fs.existsSync(observeDir)) {
      fs.mkdirSync(observeDir, { recursive: true });
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

const CONVENTION_RULES_PATH = new URL('../../packages/convention/contracts/convention.rules.v1.json', import.meta.url);

function conventionWorkingTreeRoot(cwd) {
  try {
    const facts = createGitInspect(gitPortOptions(cwd)).resolveRepo();
    return facts.notARepository ? null : facts.worktreeRoot;
  } catch {
    return null;
  }
}

/**
 * Whether `relativePath` names an entry at `revision`. A blob larger than the
 * read budget still exists; any other unreadable answer throws.
 */
export function pathExistsAt(root, revision, relativePath) {
  const [entry] = createGitInspect(gitPortOptions(root)).pathsAtRevision({ revision, paths: [[...Buffer.from(relativePath)]], maxBlobBytes: 1 });
  if (!entry) throw new Error(`no answer for ${relativePath}`);
  if (entry.value.kind === 'error' && entry.value.cause !== 'blob-too-large') throw new Error(`${relativePath} at ${revision}: ${entry.value.cause}`);
  return entry.value.kind !== 'absent';
}

/** The commit `name` resolves to; throws when it names none. */
export function commitAt(root, name) {
  const oid = createGitInspect(gitPortOptions(root)).resolveCommit({ name });
  if (!oid) throw new Error(`${name} is not a commit`);
  return oid;
}

function packagedConventionCutoff() {
  const contract = JSON.parse(fs.readFileSync(CONVENTION_RULES_PATH, 'utf8'));
  const cutoffs = new Set(
    contract.rules
      .filter((rule) => Array.isArray(rule.scope) && rule.scope.length > 0 && rule.cutoff)
      .map((rule) => rule.cutoff),
  );
  if (cutoffs.size !== 1) {
    throw new Error(`expected one launch cutoff across scoped packaged rules, found ${cutoffs.size}`);
  }
  return [...cutoffs][0];
}

function pathWasIntroducedAfter(root, relativePath, cutoff) {
  try {
    return !pathExistsAt(root, commitAt(root, cutoff), relativePath);
  } catch {
    return true;
  }
}

export function checkConventionConformance(cwd, {
  hostRunner = conventionCheck,
  cutoffResolver = packagedConventionCutoff,
  introducedAfter = pathWasIntroducedAfter,
} = {}) {
  const root = conventionWorkingTreeRoot(cwd);
  if (!root || !fs.existsSync(path.join(root, 'apps/fgos/Cargo.toml'))) {
    return {
      passed: true,
      message: 'convention check skipped: working tree is not the fgOS source repository',
    };
  }

  let result;
  try {
    result = hostRunner({ all: true }, { dir: root });
  } catch (error) {
    const category = error?.code ?? 'client-load-error';
    const detail = error?.timedOut ? 'host timed out' : (error?.message ?? 'unknown error');
    return {
      passed: true,
      message: `convention check skipped: ${category}: ${detail}`,
    };
  }

  if (!result || !Array.isArray(result.violations)) {
    return {
      passed: true,
      message: 'convention check skipped: host returned an invalid result',
    };
  }
  if (result.violations.length === 0) {
    return {
      passed: true,
      message: `convention check passed: ${result.checked ?? 0} scoped file(s), no violations`,
    };
  }

  let cutoff;
  try {
    cutoff = cutoffResolver(root);
    commitAt(root, cutoff);
  } catch (error) {
    return {
      passed: true,
      message: `convention check skipped: cutoff cannot be inspected: ${error.message}`,
    };
  }

  const recent = [];
  const existing = [];
  for (const violation of result.violations) {
    (introducedAfter(root, violation.path, cutoff) ? recent : existing).push(violation);
  }
  const examples = result.violations
    .slice(0, 3)
    .map((violation) => `${violation.path}: ${violation.code} ${violation.message}`)
    .join('; ');
  return {
    passed: recent.length === 0,
    message: `convention violations: ${existing.length} pre-cutoff, ${recent.length} post-cutoff; checked ${result.checked ?? 0}; examples: ${examples}`,
  };
}

registerCheck({
  id: 'convention-conformance',
  description: 'source-repository report and journal paths conform to packaged naming and placement rules',
  check: (cwd) => checkConventionConformance(cwd),
});

// A run directory touched within the last minute may still be settling.
// Writers share this host's clock, so a future mtime is legitimate only within
// a small skew (e.g. a networked filesystem); beyond it the mtime is not
// trusted, so it cannot permanently widen the comparison tolerance. The same
// bounds apply to the host's recentRuns count.
const RECENT_RUN_WINDOW_MS = 60_000;
const MAX_FUTURE_MTIME_SKEW_MS = 60_000;
function isRecentRunMtime(mtimeMs, now) {
  const age = now - mtimeMs;
  return age <= RECENT_RUN_WINDOW_MS && age >= -MAX_FUTURE_MTIME_SKEW_MS;
}

export function checkObserveRunCoverage(cwd, { hostRunner = invokeHost, scan = scanAssignmentLayout, now = Date.now() } = {}) {
  const root = resolveMainCheckoutRoot(cwd) ?? cwd;
  const location = root === cwd ? root : `${root} (main checkout; requested ${cwd})`;
  let coverage;
  try {
    coverage = hostRunner(['metrics', 'coverage'], { dir: root });
  } catch (err) {
    if (err.code === 'host-version-mismatch') {
      return { passed: true, degraded: true, message: `old host predates the run layout rule; upgrade the active release (${location})` };
    }
    return { passed: false, message: `run coverage unavailable for ${location}: ${err.message}` };
  }
  if (!coverage || typeof coverage !== 'object' || Array.isArray(coverage)) {
    return { passed: false, message: `invalid run coverage response for ${location}` };
  }
  if (!Object.hasOwn(coverage, 'layoutRule')) {
    return { passed: true, degraded: true, message: `old host predates the run layout rule; upgrade the active release (${location})` };
  }
  const counts = Object.values(coverage.skipped ?? {});
  if (coverage.layoutRule !== 'v2' || !Number.isSafeInteger(coverage.runDirsSeen) || coverage.runDirsSeen < 0
    || !Number.isSafeInteger(coverage.observed) || coverage.observed < 0
    || !Number.isSafeInteger(coverage.recentRuns) || coverage.recentRuns < 0
    || coverage.recentRuns > coverage.runDirsSeen
    || !coverage.skipped || typeof coverage.skipped !== 'object' || Array.isArray(coverage.skipped)
    || counts.some((n) => !Number.isSafeInteger(n) || n < 0)
    || coverage.observed + counts.reduce((sum, n) => sum + n, 0) !== coverage.runDirsSeen) {
    return { passed: false, message: `invalid run coverage accounting or unsupported layout rule for ${location}` };
  }
  let layout;
  try {
    layout = scan(path.join(root, '.fgos'));
  } catch (err) {
    return { passed: false, message: `cannot enumerate run directories for ${location}: ${err.message}` };
  }
  let recent = 0;
  for (const run of layout.runs) {
    try {
      const stat = fs.lstatSync(run.runDir);
      if (stat.isDirectory() && isRecentRunMtime(stat.mtimeMs, now)) recent++;
    } catch {}
  }
  const directoryDifference = layout.runDirsSeen - coverage.runDirsSeen;
  const tolerance = Math.max(recent, coverage.recentRuns);
  if (Math.abs(directoryDifference) > tolerance) {
    const examples = layout.runs.slice(0, 3).map((run) => path.relative(root, run.runDir)).join(', ');
    return { passed: false, message: `run coverage differs: directories Node ${layout.runDirsSeen}, host ${coverage.runDirsSeen} (difference ${directoryDifference}); recent tolerance ${tolerance}; ${location}; sample candidates (not confirmed missing): ${examples || '(none)'}` };
  }
  return { passed: true, message: `run coverage matches: directories Node ${layout.runDirsSeen}, host ${coverage.runDirsSeen}; recent tolerance ${tolerance}; ${location}` };
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
  id: 'identity-pinned-machines',
  description: 'lists the machine keys this machine pinned the first time it saw each machine (informational, for the one-time fingerprint comparison across machines; names the pins still `seen`, not yet confirmed with `fgos identity pins --confirm <machine-id> --fingerprint <fp>`); `fgos identity pins --forget <machine-id>` accepts a re-key',
  check: (cwd) => checkIdentityPinnedMachines(cwd),
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

registerCheck({
  id: 'identity-ids-unique',
  description: 'no two backlog rows share an id, no D-ADR number is headed with two different titles and no two decision files share a number; ids that travel between machines come from `fgos identity mint <kind>`, and a repeat here means one was written by hand',
  check: (cwd) => checkIdentityIdsUnique(cwd),
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

registerCheck({
  id: 'observe-run-coverage',
  description: 'Observe run accounting is consistent and its directory totals match the Node layout scan',
  check: (cwd) => checkObserveRunCoverage(cwd),
});

// Event Store: one setup fix and eight doctor rows. A doctor run builds one `eventStoreDoctor`
// (its lazy store snapshot is read at most once) and every row asks it; a row called without a run gets a private one.
registerFix({ id: 'event-store-lock-dirs', fix: cwd => fixEventStoreLockDirs(cwd) });
for (const name of ['open-root', 'machine-id', 'refspec', 'unsealed', 'integrity', 'sync', 'native-addon', 'legacy-layout']) {
  const id = `event-store-${name}`;
  registerCheck({ id, description: `Event Store ${name}`, check: (cwd, run = createDoctorRun()) => run.once(`event-store-doctor:${cwd}`, () => eventStoreDoctor(cwd))(id) });
}

// Git and Event Store share one addon ABI admission row.
for (const id of ['git-worktree-recovery', 'git-component-compatible', 'git-repository-config', 'git-operation-journal', 'git-native-locks']) {
  registerCheck({ id, description: {
    'git-worktree-recovery': 'Orphan, dirty/stale checkout and pending worktree operations (read-only)',
    'git-component-compatible': 'Combined addon contracts and Git feature floor, with the repository layout and measured durability',
    'git-repository-config': 'Repository transport settings refused by Publication/Remote, and the Event Store mirror fetch mappings',
    'git-operation-journal': 'Readable Git WAL with no unresolved operations, under the controller activation fence (`git-fence-missing` when the fence is gone); warns about retained Land candidates awaiting Work acknowledgement',
    'git-native-locks': 'Native Git lock residue (read-only detection)',
  }[id], check: (cwd, run = createDoctorRun()) => checkGit(cwd, id, undefined, undefined, run) });
}
registerCheck({
  id: 'git-mutation-one-door',
  description: 'The release mutation census lists no Git or hook spawn outside the fgos-git driver and matches the payload it was built from',
  check: () => checkMutationOneDoor(),
});
// Workflow case bindings (docs/specs/workflow.md RUL-WF-27): the binding records are a view of each
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
registerFix({ id: 'git-wal-dir', fix: fixGitWal });
registerFix({ id: 'git-land-recovery', fix: (cwd) => fixGitOperationRecovery(cwd) });
registerFix({ id: 'git-publication-refspecs', fix: fixGitFetchMapping });
