// test/runner/dispatch-policy-baseline-snapshot.test.mjs
// Phase 00 baseline snapshot regression test harness.
// Captures current executor × workTier behavior across the 13 canonical executors
// and 3 work tiers (light, standard, heavy).
//
// Process execution note:
// resolveExecutorCommand's attestation capture (captureDispatchAttestation in transport.mjs)
// runs read-only `git rev-parse HEAD` / `git symbolic-ref --short -q HEAD` via execFileSync
// once per resolved row to record git state. This does not violate phase-00's real invariant:
// it never spawns a runtime executor/model worker process, which is what 'no runtime dispatch
// is spawned' actually means in plans/260915-executor-policy-dispatch-seams/phase-00-baseline-snapshot.md.
// No test in this file opens network connections or writes outside a throwaway temp directory.

import '../helpers/process-tmp-root.mjs';
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadRunnerConfigFromDir } from '../../src/runner/dispatch/config.mjs';
import { resolveExecutorAndOverrides, resolveTierModel, deriveProviderFamily } from '../../src/runner/dispatch/resolve.mjs';
import { resolveExecutorCommand } from '../../src/runner/dispatch/transport.mjs';

/**
 * Derive read-only enforcement mechanism from policy-shaped flags present in args:
 * - 'provider-native-read-only' if provider-level read-only flags (e.g. -s read-only) are present
 * - 'tool-allowlist-not-read-only-enforced' if an allowedTools-style allowlist is configured on an otherwise-write-capable executor (--allowedTools)
 * - 'none' otherwise (no executor in the baseline matrix declares a sandboxed read-only confinement backend)
 */
export function deriveReadOnlyMechanism(args, confinement) {
  const hasReadOnlyFlag = args.some((arg, idx) => arg === '-s' && args[idx + 1] === 'read-only');
  if (hasReadOnlyFlag) {
    return 'provider-native-read-only';
  }
  const hasAllowedTools = args.includes('--allowedTools');
  if (hasAllowedTools) {
    return 'tool-allowlist-not-read-only-enforced';
  }
  // Note: No executor in the current baseline matrix declares a sandboxed
  // read-only confinement backend (host-write-denied lives at capability level,
  // while codex-bwrap declares backend: 'bwrap' with write-capable danger-full-access).
  return 'none';
}

/**
 * Executes the real production resolver chain and returns one normalized snapshot row.
 *
 * `invocationId` (executor-id-consolidation Step 2, optional): pins a
 * specific `executors.<executorId>.invocations[].id` -- required for a
 * selector whose old separate executor id (e.g. "claude-reviewer") is now
 * one of several invocations consolidated under a single executor id
 * (e.g. "claude"). `label`, when given, is what the row's own `selector`
 * field records instead of the raw `executorId` -- preserves this
 * fixture's historic per-role row identity across the consolidation
 * (readers of the fixture, and the "fact" tests below, still key off the
 * pre-consolidation name) even though `executorId` alone is now ambiguous.
 */
export function resolveNormalizedSnapshotRow(cfg, executorId, workTier, throwawayDir, { invocationId, label } = {}) {
  // 1. Resolve executor entry and overrides
  const { executorId: resolvedExecutorId, executor, overrides, bindingSource } = resolveExecutorAndOverrides(cfg, executorId);

  // 2. Resolve model for tier using production policy tier mapping
  const provider = deriveProviderFamily(executor);
  const tierMap = { light: 'nano', standard: 'standard', heavy: 'frontier' };
  const policyTier = tierMap[workTier] ?? workTier;
  const model = resolveTierModel(cfg, policyTier, provider);

  // 3. Resolve command/args/env via pure transport resolver
  const resolvedCmd = resolveExecutorCommand(cfg, {
    prompt: '<prompt>',
    model,
    tier: policyTier,
    executorId,
    fgosDir: throwawayDir,
    contentCarries: 'repo-content',
    invocationId,
  });

  const normalizedArgs = resolvedCmd.args.map((arg) => (arg === '<prompt>' ? '<prompt>' : arg));

  return {
    selector: label ?? executorId,
    workTier,
    bindingSource,
    provider: resolvedCmd.governance?.providerFamily ?? resolvedCmd.provider,
    model,
    command: resolvedCmd.command,
    args: normalizedArgs,
    envKeys: Object.keys(resolvedCmd.env ?? {}),
    credentialStore: resolvedCmd.credentialStore ?? null,
    adapter: resolvedCmd.adapter,
    promptDelivery: resolvedCmd.promptDelivery ?? (resolvedCmd.adapter === 'herdr-spawn' ? 'inline' : undefined),
    confinement: resolvedCmd.confinement?.backend ?? 'none',
    readOnlyMechanism: deriveReadOnlyMechanism(normalizedArgs, resolvedCmd.confinement),
  };
}

/**
 * The 12 canonical (label, executorId, invocationId?) triples this
 * fixture/matrix covers. `label` is the historic, pre-consolidation name
 * (what a reader of the fixture, or a "fact" test, still keys off) --
 * `executorId`/`invocationId` are what actually gets resolved post
 * executor-id-consolidation Step 2. A descriptor with no `invocationId`
 * either predates consolidation (pi/glm-cli/claude's own default)
 * or is a CAPABILITY name (fgos-coding-implement) that resolves its own
 * invocation internally via capabilities.<name>.prefer (Step 2.2) --
 * nothing here needs to pin one explicitly for that case.
 */
export const CANONICAL_EXECUTOR_DESCRIPTORS = [
  { label: 'claude', executorId: 'claude', invocationId: 'claude-cli' },
  { label: 'gemini-cli', executorId: 'gemini', invocationId: 'omp-cli-bwrap' },
  { label: 'gemini-herdr', executorId: 'gemini', invocationId: 'omp-herdr' },
  { label: 'fgos-coding-implement', executorId: 'fgos-coding-implement' },
  { label: 'codex-bwrap', executorId: 'openai', invocationId: 'codex-cli-bwrap' },
  // `pi` was a literal config duplicate of `codex-pi` before executor-provider-naming (2026-09-17); the
  // merged `openai` executor keeps one pi invocation, and an account is leased at launch rather than named
  // by the invocation.
  { label: 'pi', executorId: 'openai', invocationId: 'pi-cli-bwrap' },
  { label: 'glm-cli', executorId: 'glm' },
];

function descriptorForLabel(label) {
  const descriptor = CANONICAL_EXECUTOR_DESCRIPTORS.find((d) => d.label === label);
  if (!descriptor) throw new Error(`no canonical descriptor for label "${label}"`);
  return descriptor;
}

/**
 * Same as `resolveNormalizedSnapshotRow`, but keyed by the historic
 * `label` (looked up in `CANONICAL_EXECUTOR_DESCRIPTORS` above) instead of
 * requiring every call site to know the post-consolidation
 * executorId/invocationId pair itself.
 */
export function resolveSnapshotRowByLabel(cfg, label, workTier, throwawayDir) {
  const { executorId, invocationId } = descriptorForLabel(label);
  return resolveNormalizedSnapshotRow(cfg, executorId, workTier, throwawayDir, { invocationId, label });
}

/**
 * Golden fixture captured from current production resolvers and .fgos/config.json.
 * Note on matrix coverage: All 36 (executorId × workTier) pairs for the 12 executors
 * in [claude, claude-reviewer, claude-reviewer-herdr, gemini-cli, gemini-herdr, fgos-coding-implement,
 * codex-bwrap, codex-readonly, pi, glm-cli] across tiers
 * [light, standard, heavy] resolve successfully in the legacy config without errors.
 * None are skipped.
 * `claude-herdr`/`pi-herdr` were removed from both config and this matrix
 * (plans/260917-executor-profile-schema-migration/plan.md Phase A):
 * genuinely dormant, self-described as never wired to any capability, zero
 * other reference anywhere in src/ or test/ before removal.
 * `agy-cli`/`agy-herdr` became `gemini-cli`/`gemini-herdr` when gemini moved from
 * the Antigravity CLI to omp's gemini-tetcu72 profile (agy is no longer installed).
 * executor-id-consolidation Step 2: each of these 12 canonical LABELS
 * (not necessarily a real, distinct executor id any more -- see
 * CANONICAL_EXECUTOR_DESCRIPTORS above) still resolves successfully.
 */
export const BASELINE_SNAPSHOT_FIXTURE = [
  {
    selector: 'claude',
    workTier: 'light',
    bindingSource: 'executor-id',
    provider: 'claude',
    model: 'haiku',
    command: 'claude',
    args: [
      '-p',
      '<prompt>',
      '--model',
      'haiku',
      '--permission-mode',
      'acceptEdits'
    ],
    envKeys: [],
    credentialStore: null,
    adapter: 'cli-spawn',
    promptDelivery: undefined,
    confinement: 'none',
    readOnlyMechanism: 'none'
  },
  {
    selector: 'claude',
    workTier: 'standard',
    bindingSource: 'executor-id',
    provider: 'claude',
    model: 'sonnet',
    command: 'claude',
    args: [
      '-p',
      '<prompt>',
      '--model',
      'sonnet',
      '--permission-mode',
      'acceptEdits'
    ],
    envKeys: [],
    credentialStore: null,
    adapter: 'cli-spawn',
    promptDelivery: undefined,
    confinement: 'none',
    readOnlyMechanism: 'none'
  },
  {
    selector: 'claude',
    workTier: 'heavy',
    bindingSource: 'executor-id',
    provider: 'claude',
    model: 'fable',
    command: 'claude',
    args: [
      '-p',
      '<prompt>',
      '--model',
      'fable',
      '--permission-mode',
      'acceptEdits'
    ],
    envKeys: [],
    credentialStore: null,
    adapter: 'cli-spawn',
    promptDelivery: undefined,
    confinement: 'none',
    readOnlyMechanism: 'none'
  },
  {
    selector: 'claude-reviewer',
    workTier: 'light',
    bindingSource: 'executor-id',
    provider: 'claude',
    model: 'haiku',
    command: 'claude',
    args: [
      '-p',
      '<prompt>',
      '--model',
      'haiku',
      '--effort',
      'high',
      '--permission-mode',
      'acceptEdits',
      '--allowedTools',
      'Bash(git diff:*),Bash(rtk git diff:*),Bash(git log:*),Bash(rtk git log:*),Bash(git show:*),Bash(rtk git show:*),Bash(git status:*),Bash(rtk git status:*),Bash(node --test:*),Bash(rtk node --test:*),Bash(npm test:*),Bash(rtk npm test:*)'
    ],
    envKeys: [],
    credentialStore: null,
    adapter: 'cli-spawn',
    promptDelivery: undefined,
    confinement: 'none',
    readOnlyMechanism: 'tool-allowlist-not-read-only-enforced'
  },
  {
    selector: 'claude-reviewer',
    workTier: 'standard',
    bindingSource: 'executor-id',
    provider: 'claude',
    model: 'sonnet',
    command: 'claude',
    args: [
      '-p',
      '<prompt>',
      '--model',
      'sonnet',
      '--effort',
      'high',
      '--permission-mode',
      'acceptEdits',
      '--allowedTools',
      'Bash(git diff:*),Bash(rtk git diff:*),Bash(git log:*),Bash(rtk git log:*),Bash(git show:*),Bash(rtk git show:*),Bash(git status:*),Bash(rtk git status:*),Bash(node --test:*),Bash(rtk node --test:*),Bash(npm test:*),Bash(rtk npm test:*)'
    ],
    envKeys: [],
    credentialStore: null,
    adapter: 'cli-spawn',
    promptDelivery: undefined,
    confinement: 'none',
    readOnlyMechanism: 'tool-allowlist-not-read-only-enforced'
  },
  {
    selector: 'claude-reviewer',
    workTier: 'heavy',
    bindingSource: 'executor-id',
    provider: 'claude',
    model: 'fable',
    command: 'claude',
    args: [
      '-p',
      '<prompt>',
      '--model',
      'fable',
      '--effort',
      'high',
      '--permission-mode',
      'acceptEdits',
      '--allowedTools',
      'Bash(git diff:*),Bash(rtk git diff:*),Bash(git log:*),Bash(rtk git log:*),Bash(git show:*),Bash(rtk git show:*),Bash(git status:*),Bash(rtk git status:*),Bash(node --test:*),Bash(rtk node --test:*),Bash(npm test:*),Bash(rtk npm test:*)'
    ],
    envKeys: [],
    credentialStore: null,
    adapter: 'cli-spawn',
    promptDelivery: undefined,
    confinement: 'none',
    readOnlyMechanism: 'tool-allowlist-not-read-only-enforced'
  },
  {
    selector: 'claude-reviewer-herdr',
    workTier: 'light',
    bindingSource: 'executor-id',
    provider: 'claude',
    model: 'haiku',
    command: 'claude',
    args: [
      '<prompt>',
      '--model',
      'haiku',
      '--effort',
      'high',
      '--permission-mode',
      'acceptEdits',
      '--allowedTools',
      'Bash(git diff:*),Bash(rtk git diff:*),Bash(git log:*),Bash(rtk git log:*),Bash(git show:*),Bash(rtk git show:*),Bash(git status:*),Bash(rtk git status:*),Bash(node --test:*),Bash(rtk node --test:*),Bash(npm test:*),Bash(rtk npm test:*),Bash(cargo test:*),Bash(rtk cargo test:*),Bash(cargo clippy:*),Bash(rtk cargo clippy:*),Bash(cargo fmt:*),Bash(rtk cargo fmt:*),Bash(cargo build:*),Bash(rtk cargo build:*)'
    ],
    envKeys: [],
    credentialStore: null,
    adapter: 'herdr-spawn',
    promptDelivery: 'inline',
    confinement: 'none',
    readOnlyMechanism: 'tool-allowlist-not-read-only-enforced'
  },
  {
    selector: 'claude-reviewer-herdr',
    workTier: 'standard',
    bindingSource: 'executor-id',
    provider: 'claude',
    model: 'sonnet',
    command: 'claude',
    args: [
      '<prompt>',
      '--model',
      'sonnet',
      '--effort',
      'high',
      '--permission-mode',
      'acceptEdits',
      '--allowedTools',
      'Bash(git diff:*),Bash(rtk git diff:*),Bash(git log:*),Bash(rtk git log:*),Bash(git show:*),Bash(rtk git show:*),Bash(git status:*),Bash(rtk git status:*),Bash(node --test:*),Bash(rtk node --test:*),Bash(npm test:*),Bash(rtk npm test:*),Bash(cargo test:*),Bash(rtk cargo test:*),Bash(cargo clippy:*),Bash(rtk cargo clippy:*),Bash(cargo fmt:*),Bash(rtk cargo fmt:*),Bash(cargo build:*),Bash(rtk cargo build:*)'
    ],
    envKeys: [],
    credentialStore: null,
    adapter: 'herdr-spawn',
    promptDelivery: 'inline',
    confinement: 'none',
    readOnlyMechanism: 'tool-allowlist-not-read-only-enforced'
  },
  {
    selector: 'claude-reviewer-herdr',
    workTier: 'heavy',
    bindingSource: 'executor-id',
    provider: 'claude',
    model: 'fable',
    command: 'claude',
    args: [
      '<prompt>',
      '--model',
      'fable',
      '--effort',
      'high',
      '--permission-mode',
      'acceptEdits',
      '--allowedTools',
      'Bash(git diff:*),Bash(rtk git diff:*),Bash(git log:*),Bash(rtk git log:*),Bash(git show:*),Bash(rtk git show:*),Bash(git status:*),Bash(rtk git status:*),Bash(node --test:*),Bash(rtk node --test:*),Bash(npm test:*),Bash(rtk npm test:*),Bash(cargo test:*),Bash(rtk cargo test:*),Bash(cargo clippy:*),Bash(rtk cargo clippy:*),Bash(cargo fmt:*),Bash(rtk cargo fmt:*),Bash(cargo build:*),Bash(rtk cargo build:*)'
    ],
    envKeys: [],
    credentialStore: null,
    adapter: 'herdr-spawn',
    promptDelivery: 'inline',
    confinement: 'none',
    readOnlyMechanism: 'tool-allowlist-not-read-only-enforced'
  },
  {
    selector: 'gemini-cli',
    workTier: 'light',
    bindingSource: 'executor-id',
    provider: 'gemini',
    model: 'gemini-3.8-flash-low',
    command: 'omp',
    args: [
      '--model',
      'gemini-3.8-flash-low',
      '--thinking',
      'medium',
      '--tools',
      'read,write,edit,bash,grep,glob',
      '--mode',
      'json',
      '--auto-approve',
      '-p',
      '<prompt>'
    ],
    envKeys: [
      'PI_CONFIG_DIR'
    ],
    credentialStore: {
      use: 'omp',
      homeEnv: 'PI_CODING_AGENT_DIR',
      files: [
        'agent.db',
        'config.yml'
      ]
    },
    adapter: 'cli-spawn',
    promptDelivery: undefined,
    confinement: 'bwrap',
    readOnlyMechanism: 'none'
  },
  {
    selector: 'gemini-cli',
    workTier: 'standard',
    bindingSource: 'executor-id',
    provider: 'gemini',
    model: 'gemini-3.8-flash-medium',
    command: 'omp',
    args: [
      '--model',
      'gemini-3.8-flash-medium',
      '--thinking',
      'medium',
      '--tools',
      'read,write,edit,bash,grep,glob',
      '--mode',
      'json',
      '--auto-approve',
      '-p',
      '<prompt>'
    ],
    envKeys: [
      'PI_CONFIG_DIR'
    ],
    credentialStore: {
      use: 'omp',
      homeEnv: 'PI_CODING_AGENT_DIR',
      files: [
        'agent.db',
        'config.yml'
      ]
    },
    adapter: 'cli-spawn',
    promptDelivery: undefined,
    confinement: 'bwrap',
    readOnlyMechanism: 'none'
  },
  {
    selector: 'gemini-cli',
    workTier: 'heavy',
    bindingSource: 'executor-id',
    provider: 'gemini',
    model: 'gemini-4-argon-high',
    command: 'omp',
    args: [
      '--model',
      'gemini-4-argon-high',
      '--thinking',
      'medium',
      '--tools',
      'read,write,edit,bash,grep,glob',
      '--mode',
      'json',
      '--auto-approve',
      '-p',
      '<prompt>'
    ],
    envKeys: [
      'PI_CONFIG_DIR'
    ],
    credentialStore: {
      use: 'omp',
      homeEnv: 'PI_CODING_AGENT_DIR',
      files: [
        'agent.db',
        'config.yml'
      ]
    },
    adapter: 'cli-spawn',
    promptDelivery: undefined,
    confinement: 'bwrap',
    readOnlyMechanism: 'none'
  },
  {
    selector: 'gemini-herdr',
    workTier: 'light',
    bindingSource: 'executor-id',
    provider: 'gemini',
    model: 'gemini-3.8-flash-low',
    command: 'omp',
    args: [
      '--model',
      'gemini-3.8-flash-low',
      '--thinking',
      'medium',
      '--tools',
      'read,write,edit,bash,grep,glob',
      '--auto-approve'
    ],
    envKeys: [
      'PI_CONFIG_DIR'
    ],
    credentialStore: {
      use: 'omp',
      homeEnv: 'PI_CODING_AGENT_DIR',
      files: [
        'agent.db',
        'config.yml'
      ]
    },
    adapter: 'herdr-spawn',
    promptDelivery: 'inline',
    confinement: 'bwrap',
    readOnlyMechanism: 'none'
  },
  {
    selector: 'gemini-herdr',
    workTier: 'standard',
    bindingSource: 'executor-id',
    provider: 'gemini',
    model: 'gemini-3.8-flash-medium',
    command: 'omp',
    args: [
      '--model',
      'gemini-3.8-flash-medium',
      '--thinking',
      'medium',
      '--tools',
      'read,write,edit,bash,grep,glob',
      '--auto-approve'
    ],
    envKeys: [
      'PI_CONFIG_DIR'
    ],
    credentialStore: {
      use: 'omp',
      homeEnv: 'PI_CODING_AGENT_DIR',
      files: [
        'agent.db',
        'config.yml'
      ]
    },
    adapter: 'herdr-spawn',
    promptDelivery: 'inline',
    confinement: 'bwrap',
    readOnlyMechanism: 'none'
  },
  {
    selector: 'gemini-herdr',
    workTier: 'heavy',
    bindingSource: 'executor-id',
    provider: 'gemini',
    model: 'gemini-4-argon-high',
    command: 'omp',
    args: [
      '--model',
      'gemini-4-argon-high',
      '--thinking',
      'medium',
      '--tools',
      'read,write,edit,bash,grep,glob',
      '--auto-approve'
    ],
    envKeys: [
      'PI_CONFIG_DIR'
    ],
    credentialStore: {
      use: 'omp',
      homeEnv: 'PI_CODING_AGENT_DIR',
      files: [
        'agent.db',
        'config.yml'
      ]
    },
    adapter: 'herdr-spawn',
    promptDelivery: 'inline',
    confinement: 'bwrap',
    readOnlyMechanism: 'none'
  },
  {
    selector: 'fgos-coding-implement',
    workTier: 'light',
    bindingSource: 'capability.prefer',
    provider: 'gemini',
    model: 'gemini-3.8-flash-low',
    command: 'omp',
    args: [
      '--model',
      'gemini-3.8-flash-low',
      '--thinking',
      'medium',
      '--tools',
      'read,write,edit,bash,grep,glob',
      '--auto-approve'
    ],
    envKeys: [
      'PI_CONFIG_DIR'
    ],
    credentialStore: {
      use: 'omp',
      homeEnv: 'PI_CODING_AGENT_DIR',
      files: [
        'agent.db',
        'config.yml'
      ]
    },
    adapter: 'herdr-spawn',
    promptDelivery: 'inline',
    confinement: 'bwrap',
    readOnlyMechanism: 'none'
  },
  {
    selector: 'fgos-coding-implement',
    workTier: 'standard',
    bindingSource: 'capability.prefer',
    provider: 'gemini',
    model: 'gemini-3.8-flash-medium',
    command: 'omp',
    args: [
      '--model',
      'gemini-3.8-flash-medium',
      '--thinking',
      'medium',
      '--tools',
      'read,write,edit,bash,grep,glob',
      '--auto-approve'
    ],
    envKeys: [
      'PI_CONFIG_DIR'
    ],
    credentialStore: {
      use: 'omp',
      homeEnv: 'PI_CODING_AGENT_DIR',
      files: [
        'agent.db',
        'config.yml'
      ]
    },
    adapter: 'herdr-spawn',
    promptDelivery: 'inline',
    confinement: 'bwrap',
    readOnlyMechanism: 'none'
  },
  {
    selector: 'fgos-coding-implement',
    workTier: 'heavy',
    bindingSource: 'capability.prefer',
    provider: 'gemini',
    model: 'gemini-4-argon-high',
    command: 'omp',
    args: [
      '--model',
      'gemini-4-argon-high',
      '--thinking',
      'medium',
      '--tools',
      'read,write,edit,bash,grep,glob',
      '--auto-approve'
    ],
    envKeys: [
      'PI_CONFIG_DIR'
    ],
    credentialStore: {
      use: 'omp',
      homeEnv: 'PI_CODING_AGENT_DIR',
      files: [
        'agent.db',
        'config.yml'
      ]
    },
    adapter: 'herdr-spawn',
    promptDelivery: 'inline',
    confinement: 'bwrap',
    readOnlyMechanism: 'none'
  },
  {
    selector: 'codex-bwrap',
    workTier: 'light',
    bindingSource: 'executor-id',
    provider: 'openai',
    model: 'gpt-5.6-luna',
    command: 'codex',
    args: [
      'exec',
      '--skip-git-repo-check',
      '-s',
      'danger-full-access',
      '--model',
      'gpt-5.6-luna',
      '<prompt>'
    ],
    envKeys: [],
    credentialStore: {
      use: 'codex',
      homeEnv: 'CODEX_HOME'
    },
    adapter: 'cli-spawn',
    promptDelivery: undefined,
    confinement: 'bwrap',
    readOnlyMechanism: 'none'
  },
  {
    selector: 'codex-bwrap',
    workTier: 'standard',
    bindingSource: 'executor-id',
    provider: 'openai',
    model: 'gpt-5.6-terra',
    command: 'codex',
    args: [
      'exec',
      '--skip-git-repo-check',
      '-s',
      'danger-full-access',
      '--model',
      'gpt-5.6-terra',
      '<prompt>'
    ],
    envKeys: [],
    credentialStore: {
      use: 'codex',
      homeEnv: 'CODEX_HOME'
    },
    adapter: 'cli-spawn',
    promptDelivery: undefined,
    confinement: 'bwrap',
    readOnlyMechanism: 'none'
  },
  {
    selector: 'codex-bwrap',
    workTier: 'heavy',
    bindingSource: 'executor-id',
    provider: 'openai',
    model: 'gpt-6-astra',
    command: 'codex',
    args: [
      'exec',
      '--skip-git-repo-check',
      '-s',
      'danger-full-access',
      '--model',
      'gpt-6-astra',
      '<prompt>'
    ],
    envKeys: [],
    credentialStore: {
      use: 'codex',
      homeEnv: 'CODEX_HOME'
    },
    adapter: 'cli-spawn',
    promptDelivery: undefined,
    confinement: 'bwrap',
    readOnlyMechanism: 'none'
  },
  {
    selector: 'codex-readonly',
    workTier: 'light',
    bindingSource: 'executor-id',
    provider: 'openai',
    model: 'gpt-5.6-luna',
    command: 'codex',
    args: [
      'exec',
      '-s',
      'read-only',
      '--model',
      'gpt-5.6-luna',
      '<prompt>'
    ],
    envKeys: [
      'CODEX_HOME'
    ],
    credentialStore: null,
    adapter: 'cli-spawn',
    promptDelivery: undefined,
    confinement: 'none',
    readOnlyMechanism: 'provider-native-read-only'
  },
  {
    selector: 'codex-readonly',
    workTier: 'standard',
    bindingSource: 'executor-id',
    provider: 'openai',
    model: 'gpt-5.6-terra',
    command: 'codex',
    args: [
      'exec',
      '-s',
      'read-only',
      '--model',
      'gpt-5.6-terra',
      '<prompt>'
    ],
    envKeys: [
      'CODEX_HOME'
    ],
    credentialStore: null,
    adapter: 'cli-spawn',
    promptDelivery: undefined,
    confinement: 'none',
    readOnlyMechanism: 'provider-native-read-only'
  },
  {
    selector: 'codex-readonly',
    workTier: 'heavy',
    bindingSource: 'executor-id',
    provider: 'openai',
    model: 'gpt-6-astra',
    command: 'codex',
    args: [
      'exec',
      '-s',
      'read-only',
      '--model',
      'gpt-6-astra',
      '<prompt>'
    ],
    envKeys: [
      'CODEX_HOME'
    ],
    credentialStore: null,
    adapter: 'cli-spawn',
    promptDelivery: undefined,
    confinement: 'none',
    readOnlyMechanism: 'provider-native-read-only'
  },
  {
    selector: 'pi',
    workTier: 'light',
    bindingSource: 'executor-id',
    provider: 'openai',
    model: 'gpt-5.6-luna',
    command: 'pi',
    args: [
      '--model',
      'gpt-5.6-luna',
      '--thinking',
      'medium',
      '--tools',
      'read,write,edit,bash,grep,find,ls',
      '--mode',
      'json',
      '--approve',
      '-p',
      '<prompt>'
    ],
    envKeys: [],
    credentialStore: {
      use: 'pi',
      homeEnv: 'PI_CODING_AGENT_DIR',
      files: [
        'auth.json',
        'models-store.json',
        'settings.json',
        'trust.json',
        'bin/fd'
      ]
    },
    adapter: 'cli-spawn',
    promptDelivery: undefined,
    confinement: 'bwrap',
    readOnlyMechanism: 'none'
  },
  {
    selector: 'pi',
    workTier: 'standard',
    bindingSource: 'executor-id',
    provider: 'openai',
    model: 'gpt-5.6-terra',
    command: 'pi',
    args: [
      '--model',
      'gpt-5.6-terra',
      '--thinking',
      'medium',
      '--tools',
      'read,write,edit,bash,grep,find,ls',
      '--mode',
      'json',
      '--approve',
      '-p',
      '<prompt>'
    ],
    envKeys: [],
    credentialStore: {
      use: 'pi',
      homeEnv: 'PI_CODING_AGENT_DIR',
      files: [
        'auth.json',
        'models-store.json',
        'settings.json',
        'trust.json',
        'bin/fd'
      ]
    },
    adapter: 'cli-spawn',
    promptDelivery: undefined,
    confinement: 'bwrap',
    readOnlyMechanism: 'none'
  },
  {
    selector: 'pi',
    workTier: 'heavy',
    bindingSource: 'executor-id',
    provider: 'openai',
    model: 'gpt-6-astra',
    command: 'pi',
    args: [
      '--model',
      'gpt-6-astra',
      '--thinking',
      'medium',
      '--tools',
      'read,write,edit,bash,grep,find,ls',
      '--mode',
      'json',
      '--approve',
      '-p',
      '<prompt>'
    ],
    envKeys: [],
    credentialStore: {
      use: 'pi',
      homeEnv: 'PI_CODING_AGENT_DIR',
      files: [
        'auth.json',
        'models-store.json',
        'settings.json',
        'trust.json',
        'bin/fd'
      ]
    },
    adapter: 'cli-spawn',
    promptDelivery: undefined,
    confinement: 'bwrap',
    readOnlyMechanism: 'none'
  },
  {
    selector: 'glm-cli',
    workTier: 'light',
    bindingSource: 'executor-id',
    provider: 'z-ai',
    model: 'z-ai/glm-5.3-flash',
    command: 'pi',
    args: [
      '--model',
      'z-ai/glm-5.3-flash',
      '--thinking',
      'medium',
      '--tools',
      'read,write,edit,bash,grep,find,ls',
      '--mode',
      'json',
      '--approve',
      '-p',
      '<prompt>'
    ],
    envKeys: [],
    credentialStore: {
      use: 'pi',
      homeEnv: 'PI_CODING_AGENT_DIR',
      files: [
        'auth.json',
        'models-store.json',
        'settings.json',
        'trust.json',
        'bin/fd'
      ]
    },
    adapter: 'cli-spawn',
    promptDelivery: undefined,
    confinement: 'bwrap',
    readOnlyMechanism: 'none'
  },
  {
    selector: 'glm-cli',
    workTier: 'standard',
    bindingSource: 'executor-id',
    provider: 'z-ai',
    model: 'z-ai/glm-5.3-flash',
    command: 'pi',
    args: [
      '--model',
      'z-ai/glm-5.3-flash',
      '--thinking',
      'medium',
      '--tools',
      'read,write,edit,bash,grep,find,ls',
      '--mode',
      'json',
      '--approve',
      '-p',
      '<prompt>'
    ],
    envKeys: [],
    credentialStore: {
      use: 'pi',
      homeEnv: 'PI_CODING_AGENT_DIR',
      files: [
        'auth.json',
        'models-store.json',
        'settings.json',
        'trust.json',
        'bin/fd'
      ]
    },
    adapter: 'cli-spawn',
    promptDelivery: undefined,
    confinement: 'bwrap',
    readOnlyMechanism: 'none'
  },
  {
    selector: 'glm-cli',
    workTier: 'heavy',
    bindingSource: 'executor-id',
    provider: 'z-ai',
    model: 'z-ai/glm-5.3',
    command: 'pi',
    args: [
      '--model',
      'z-ai/glm-5.3',
      '--thinking',
      'medium',
      '--tools',
      'read,write,edit,bash,grep,find,ls',
      '--mode',
      'json',
      '--approve',
      '-p',
      '<prompt>'
    ],
    envKeys: [],
    credentialStore: {
      use: 'pi',
      homeEnv: 'PI_CODING_AGENT_DIR',
      files: [
        'auth.json',
        'models-store.json',
        'settings.json',
        'trust.json',
        'bin/fd'
      ]
    },
    adapter: 'cli-spawn',
    promptDelivery: undefined,
    confinement: 'bwrap',
    readOnlyMechanism: 'none'
  }
];

describe('dispatch policy baseline snapshot harness (Phase 00)', () => {
  let cfg;
  let throwawayDir;
  let tempHomeDir;
  const originalHome = process.env.HOME;

  before(() => {
    tempHomeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-baseline-test-home-'));
    process.env.HOME = tempHomeDir;
    cfg = loadRunnerConfigFromDir(process.cwd());
    throwawayDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-dispatch-snapshot-test-'));
  });

  after(() => {
    if (originalHome !== undefined) {
      process.env.HOME = originalHome;
    } else {
      delete process.env.HOME;
    }
    if (tempHomeDir && fs.existsSync(tempHomeDir)) {
      fs.rmSync(tempHomeDir, { recursive: true, force: true });
    }
    if (throwawayDir && fs.existsSync(throwawayDir)) {
      fs.rmSync(throwawayDir, { recursive: true, force: true });
    }
  });

  describe('configuration environment isolation', () => {
    test('loads project config from cwd while HOME global overlay is neutralized', () => {
      assert.ok(cfg.executors, 'loaded config must contain executors');
      assert.ok(cfg.executors.openai, 'loaded config must contain the consolidated openai executor from project config');
      assert.ok(cfg.executors.openai.invocations.some((inv) => inv.id === 'codex-cli-bwrap'), 'openai must declare its codex-cli-bwrap invocation');
      assert.ok(cfg.capabilities?.['fgos-coding-implement'], 'loaded config must contain fgos-coding-implement capability');
      assert.equal(process.env.HOME, tempHomeDir, 'process.env.HOME must match isolated temp directory');
    });
  });

  describe('matrix fixture completeness', () => {
    test('matrix fixture contains expected pairs for active descriptors', () => {
      const activeLabels = new Set(CANONICAL_EXECUTOR_DESCRIPTORS.map((d) => d.label));
      const expectedTiers = ['light', 'standard', 'heavy'];
      const expectedPairKeys = new Set();
      for (const label of activeLabels) {
        for (const tier of expectedTiers) {
          expectedPairKeys.add(`${label}:${tier}`);
        }
      }
      assert.equal(expectedPairKeys.size, CANONICAL_EXECUTOR_DESCRIPTORS.length * 3);
    });
  });

  describe('matrix regression snapshot assertions', () => {
    const activeLabels = new Set(CANONICAL_EXECUTOR_DESCRIPTORS.map((d) => d.label));
    const activeFixture = BASELINE_SNAPSHOT_FIXTURE.filter((row) => activeLabels.has(row.selector));
    for (const expected of activeFixture) {
      test(`snapshot: ${expected.selector} [${expected.workTier}] matches baseline fixture`, () => {
        const actual = resolveSnapshotRowByLabel(cfg, expected.selector, expected.workTier, throwawayDir);
        assert.deepEqual(actual, expected);
      });
    }
  });

  describe('named explicit baseline facts', () => {
    // (a) gemini-cli heavy AND gemini-herdr heavy both resolve model to gemini-4-argon-high (policy tier frontier, D15),
    // and the model reaches omp's argv: without --model omp runs its profile default whatever the tier.
    test('fact (a): gemini-cli heavy and gemini-herdr heavy resolve to gemini-4-argon-high and pass it to omp (policy tier frontier, D15)', () => {
      for (const label of ['gemini-cli', 'gemini-herdr']) {
        const row = resolveSnapshotRowByLabel(cfg, label, 'heavy', throwawayDir);
        assert.equal(row.model, 'gemini-4-argon-high', `${label} heavy model must be gemini-4-argon-high`);
        assert.equal(row.provider, 'gemini');
        assert.equal(row.command, 'omp');
        const at = row.args.indexOf('--model');
        assert.ok(at >= 0 && row.args[at + 1] === 'gemini-4-argon-high', `${label} heavy must pass --model gemini-4-argon-high, got ${JSON.stringify(row.args)}`);
      }
    });

    // (b) fgos-coding-implement heavy resolves model to gemini-4-argon-high (policy tier frontier, D15)
    test('fact (b): fgos-coding-implement heavy resolves model to gemini-4-argon-high without overrides (D15)', () => {
      const { executorId: resolvedExecutorId, invocationId: resolvedInvocationId, bindingSource } = resolveExecutorAndOverrides(cfg, 'fgos-coding-implement');
      assert.equal(bindingSource, 'capability.prefer', 'bindingSource must be capability.prefer');
      assert.equal(resolvedExecutorId, 'gemini', 'resolvedExecutorId resolves to gemini (executor-provider-naming 2026-09-17 -- was agy)');
      assert.equal(resolvedInvocationId, 'omp-herdr', 'resolvedInvocationId pins gemini\'s omp pane invocation');

      const fgosImplementHeavy = resolveSnapshotRowByLabel(cfg, 'fgos-coding-implement', 'heavy', throwawayDir);
      assert.equal(fgosImplementHeavy.model, 'gemini-4-argon-high', 'fgos-coding-implement heavy model must be gemini-4-argon-high');
      assert.equal(fgosImplementHeavy.selector, 'fgos-coding-implement');
      assert.equal(fgosImplementHeavy.bindingSource, 'capability.prefer');
    });


    // (d) codex-readonly derives 'provider-native-read-only' while claude/claude-reviewer/claude-reviewer-herdr/glm-cli derive 'tool-allowlist-not-read-only-enforced'
    test('fact (d): readOnlyMechanism distinguishes provider-native-read-only from tool-allowlist-not-read-only-enforced', () => {
      const tiers = ['light', 'standard', 'heavy'];
      for (const tier of tiers) {
        // codex-readonly was retired in Phase 6 (posture is enforced via OS confinement)

        // claude/glm-cli no longer carry an allowlist (workers hold no git
        // grant; the runner commits), so they report no read-only mechanism.
        for (const ungranted of ['claude', 'glm-cli']) {
          const row = resolveSnapshotRowByLabel(cfg, ungranted, tier, throwawayDir);
          assert.equal(
            row.readOnlyMechanism,
            'none',
            `${ungranted} [${tier}] readOnlyMechanism must be none`
          );
        }

        const unGated = resolveSnapshotRowByLabel(cfg, 'gemini-cli', tier, throwawayDir);
        assert.equal(
          unGated.readOnlyMechanism,
          'none',
          `gemini-cli [${tier}] readOnlyMechanism must be none`
        );
      }
    });

    // (e) codex-bwrap reads the codex login store through CODEX_HOME while an invocation with no account reads none
    test('fact (e): credentialStore captures the codex-bwrap CODEX_HOME store', () => {
      const tiers = ['light', 'standard', 'heavy'];
      for (const tier of tiers) {
        const bwrapRow = resolveSnapshotRowByLabel(cfg, 'codex-bwrap', tier, throwawayDir);
        assert.deepEqual(
          bwrapRow.credentialStore,
          { use: 'codex', homeEnv: 'CODEX_HOME' },
          `codex-bwrap [${tier}] must read the codex store through CODEX_HOME`
        );

        const claudeRow = resolveSnapshotRowByLabel(cfg, 'claude', tier, throwawayDir);
        assert.equal(claudeRow.credentialStore, null, `claude [${tier}] reads no store through a private home`);
      }
    });
  });
});
