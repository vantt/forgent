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

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadRunnerConfigFromDir } from '../../src/runner/dispatch/config.mjs';
import { resolveExecutorAndOverrides, modelForTier } from '../../src/runner/dispatch/resolve.mjs';
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
 * Stable, secret-free summary of executor resource bindings.
 * Preserves the full binding object structure (resource, target.kind, target.name, etc.)
 * so any regression in binding shape is caught.
 */
export function summarizeResourceBindings(bindings) {
  if (!Array.isArray(bindings)) return [];
  return bindings.map((b) => (typeof b === 'object' && b !== null ? structuredClone(b) : b));
}

/**
 * Executes the real production resolver chain and returns one normalized snapshot row.
 */
export function resolveNormalizedSnapshotRow(cfg, executorId, workTier, throwawayDir) {
  // 1. Resolve executor entry and overrides
  const { executorId: resolvedExecutorId, executor, overrides, bindingSource } = resolveExecutorAndOverrides(cfg, executorId);

  // 2. Resolve model for tier using exact production wiring from cli.mjs spawnWorker (~lines 294-304)
  const model = modelForTier(cfg, workTier, {
    providerModel: overrides?.providerModel ?? executor?.providerModel,
    rigorOverrides: overrides?.rigorOverrides ?? executor?.rigorOverrides,
  });

  // 3. Resolve command/args/env via pure transport resolver
  const resolvedCmd = resolveExecutorCommand(cfg, {
    prompt: '<prompt>',
    model,
    tier: workTier,
    executorId,
    fgosDir: throwawayDir,
    contentCarries: 'repo-content',
  });

  const normalizedArgs = resolvedCmd.args.map((arg) => (arg === '<prompt>' ? '<prompt>' : arg));

  return {
    selector: executorId,
    workTier,
    bindingSource,
    provider: resolvedCmd.governance?.providerFamily ?? resolvedCmd.provider,
    model,
    command: resolvedCmd.command,
    args: normalizedArgs,
    envKeys: Object.keys(resolvedCmd.env ?? {}),
    resourceBindings: summarizeResourceBindings(resolvedCmd.resourceBindings),
    adapter: resolvedCmd.adapter,
    promptDelivery: resolvedCmd.promptDelivery ?? (resolvedCmd.adapter === 'herdr-spawn' ? 'file-pointer' : undefined),
    confinement: resolvedCmd.confinement?.backend ?? 'none',
    readOnlyMechanism: deriveReadOnlyMechanism(normalizedArgs, resolvedCmd.confinement),
  };
}

/**
 * Golden fixture captured from current production resolvers and .fgos/config.json.
 * Note on matrix coverage: All 36 (executorId × workTier) pairs for the 12 executors
 * in [claude, claude-reviewer, claude-reviewer-herdr, agy-cli, agy-herdr, fgos-coding-implement,
 * codex-cli, codex-bwrap, codex-readonly, pi, codex-pi, glm-cli] across tiers
 * [light, standard, heavy] resolve successfully in the legacy config without errors.
 * None are skipped.
 * `claude-herdr`/`pi-herdr` were removed from both config and this matrix
 * (plans/260917-executor-profile-schema-migration/plan.md Phase A):
 * genuinely dormant, self-described as never wired to any capability, zero
 * other reference anywhere in src/ or test/ before removal.
 */
export const BASELINE_SNAPSHOT_FIXTURE = [
  {
    "selector": "claude",
    "workTier": "light",
    "bindingSource": "executor-id",
    "provider": "claude",
    "model": "haiku",
    "command": "claude",
    "args": [
      "-p",
      "<prompt>",
      "--model",
      "haiku",
      "--permission-mode",
      "acceptEdits",
      "--allowedTools",
      "Bash(git add:*),Bash(git commit:*),Bash(rtk git add:*),Bash(rtk git commit:*)"
    ],
    "envKeys": [],
    "resourceBindings": [],
    "adapter": "cli-spawn",
    "promptDelivery": undefined,
    "confinement": "none",
    "readOnlyMechanism": "tool-allowlist-not-read-only-enforced"
  },
  {
    "selector": "claude",
    "workTier": "standard",
    "bindingSource": "executor-id",
    "provider": "claude",
    "model": "sonnet",
    "command": "claude",
    "args": [
      "-p",
      "<prompt>",
      "--model",
      "sonnet",
      "--permission-mode",
      "acceptEdits",
      "--allowedTools",
      "Bash(git add:*),Bash(git commit:*),Bash(rtk git add:*),Bash(rtk git commit:*)"
    ],
    "envKeys": [],
    "resourceBindings": [],
    "adapter": "cli-spawn",
    "promptDelivery": undefined,
    "confinement": "none",
    "readOnlyMechanism": "tool-allowlist-not-read-only-enforced"
  },
  {
    "selector": "claude",
    "workTier": "heavy",
    "bindingSource": "executor-id",
    "provider": "claude",
    "model": "opus",
    "command": "claude",
    "args": [
      "-p",
      "<prompt>",
      "--model",
      "opus",
      "--permission-mode",
      "acceptEdits",
      "--allowedTools",
      "Bash(git add:*),Bash(git commit:*),Bash(rtk git add:*),Bash(rtk git commit:*)"
    ],
    "envKeys": [],
    "resourceBindings": [],
    "adapter": "cli-spawn",
    "promptDelivery": undefined,
    "confinement": "none",
    "readOnlyMechanism": "tool-allowlist-not-read-only-enforced"
  },
  {
    "selector": "claude-reviewer",
    "workTier": "light",
    "bindingSource": "executor-id",
    "provider": "claude",
    "model": "haiku",
    "command": "claude",
    "args": [
      "-p",
      "<prompt>",
      "--model",
      "haiku",
      "--effort",
      "high",
      "--permission-mode",
      "acceptEdits",
      "--allowedTools",
      "Bash(git diff:*),Bash(rtk git diff:*),Bash(git log:*),Bash(rtk git log:*),Bash(git show:*),Bash(rtk git show:*),Bash(git status:*),Bash(rtk git status:*),Bash(node --test:*),Bash(rtk node --test:*),Bash(npm test:*),Bash(rtk npm test:*)"
    ],
    "envKeys": [],
    "resourceBindings": [],
    "adapter": "cli-spawn",
    "promptDelivery": undefined,
    "confinement": "none",
    "readOnlyMechanism": "tool-allowlist-not-read-only-enforced"
  },
  {
    "selector": "claude-reviewer",
    "workTier": "standard",
    "bindingSource": "executor-id",
    "provider": "claude",
    "model": "sonnet",
    "command": "claude",
    "args": [
      "-p",
      "<prompt>",
      "--model",
      "sonnet",
      "--effort",
      "high",
      "--permission-mode",
      "acceptEdits",
      "--allowedTools",
      "Bash(git diff:*),Bash(rtk git diff:*),Bash(git log:*),Bash(rtk git log:*),Bash(git show:*),Bash(rtk git show:*),Bash(git status:*),Bash(rtk git status:*),Bash(node --test:*),Bash(rtk node --test:*),Bash(npm test:*),Bash(rtk npm test:*)"
    ],
    "envKeys": [],
    "resourceBindings": [],
    "adapter": "cli-spawn",
    "promptDelivery": undefined,
    "confinement": "none",
    "readOnlyMechanism": "tool-allowlist-not-read-only-enforced"
  },
  {
    "selector": "claude-reviewer",
    "workTier": "heavy",
    "bindingSource": "executor-id",
    "provider": "claude",
    "model": "opus",
    "command": "claude",
    "args": [
      "-p",
      "<prompt>",
      "--model",
      "opus",
      "--effort",
      "high",
      "--permission-mode",
      "acceptEdits",
      "--allowedTools",
      "Bash(git diff:*),Bash(rtk git diff:*),Bash(git log:*),Bash(rtk git log:*),Bash(git show:*),Bash(rtk git show:*),Bash(git status:*),Bash(rtk git status:*),Bash(node --test:*),Bash(rtk node --test:*),Bash(npm test:*),Bash(rtk npm test:*)"
    ],
    "envKeys": [],
    "resourceBindings": [],
    "adapter": "cli-spawn",
    "promptDelivery": undefined,
    "confinement": "none",
    "readOnlyMechanism": "tool-allowlist-not-read-only-enforced"
  },
  {
    "selector": "claude-reviewer-herdr",
    "workTier": "light",
    "bindingSource": "executor-id",
    "provider": "claude",
    "model": "haiku",
    "command": "claude",
    "args": [
      "<prompt>",
      "--model",
      "haiku",
      "--effort",
      "high",
      "--permission-mode",
      "acceptEdits",
      "--allowedTools",
      "Bash(git diff:*),Bash(rtk git diff:*),Bash(git log:*),Bash(rtk git log:*),Bash(git show:*),Bash(rtk git show:*),Bash(git status:*),Bash(rtk git status:*),Bash(node --test:*),Bash(rtk node --test:*),Bash(npm test:*),Bash(rtk npm test:*),Bash(cargo test:*),Bash(rtk cargo test:*),Bash(cargo clippy:*),Bash(rtk cargo clippy:*),Bash(cargo fmt:*),Bash(rtk cargo fmt:*),Bash(cargo build:*),Bash(rtk cargo build:*)"
    ],
    "envKeys": [],
    "resourceBindings": [],
    "adapter": "herdr-spawn",
    "promptDelivery": "file-pointer",
    "confinement": "none",
    "readOnlyMechanism": "tool-allowlist-not-read-only-enforced"
  },
  {
    "selector": "claude-reviewer-herdr",
    "workTier": "standard",
    "bindingSource": "executor-id",
    "provider": "claude",
    "model": "sonnet",
    "command": "claude",
    "args": [
      "<prompt>",
      "--model",
      "sonnet",
      "--effort",
      "high",
      "--permission-mode",
      "acceptEdits",
      "--allowedTools",
      "Bash(git diff:*),Bash(rtk git diff:*),Bash(git log:*),Bash(rtk git log:*),Bash(git show:*),Bash(rtk git show:*),Bash(git status:*),Bash(rtk git status:*),Bash(node --test:*),Bash(rtk node --test:*),Bash(npm test:*),Bash(rtk npm test:*),Bash(cargo test:*),Bash(rtk cargo test:*),Bash(cargo clippy:*),Bash(rtk cargo clippy:*),Bash(cargo fmt:*),Bash(rtk cargo fmt:*),Bash(cargo build:*),Bash(rtk cargo build:*)"
    ],
    "envKeys": [],
    "resourceBindings": [],
    "adapter": "herdr-spawn",
    "promptDelivery": "file-pointer",
    "confinement": "none",
    "readOnlyMechanism": "tool-allowlist-not-read-only-enforced"
  },
  {
    "selector": "claude-reviewer-herdr",
    "workTier": "heavy",
    "bindingSource": "executor-id",
    "provider": "claude",
    "model": "opus",
    "command": "claude",
    "args": [
      "<prompt>",
      "--model",
      "opus",
      "--effort",
      "high",
      "--permission-mode",
      "acceptEdits",
      "--allowedTools",
      "Bash(git diff:*),Bash(rtk git diff:*),Bash(git log:*),Bash(rtk git log:*),Bash(git show:*),Bash(rtk git show:*),Bash(git status:*),Bash(rtk git status:*),Bash(node --test:*),Bash(rtk node --test:*),Bash(npm test:*),Bash(rtk npm test:*),Bash(cargo test:*),Bash(rtk cargo test:*),Bash(cargo clippy:*),Bash(rtk cargo clippy:*),Bash(cargo fmt:*),Bash(rtk cargo fmt:*),Bash(cargo build:*),Bash(rtk cargo build:*)"
    ],
    "envKeys": [],
    "resourceBindings": [],
    "adapter": "herdr-spawn",
    "promptDelivery": "file-pointer",
    "confinement": "none",
    "readOnlyMechanism": "tool-allowlist-not-read-only-enforced"
  },
  {
    "selector": "agy-cli",
    "workTier": "light",
    "bindingSource": "executor-id",
    "provider": "gemini",
    "model": "gemini-3.8-flash-low",
    "command": "agy",
    "args": [
      "-p",
      "<prompt>",
      "--mode",
      "accept-edits",
      "--new-project",
      "--print-timeout",
      "30m",
      "--model",
      "gemini-3.8-flash-low"
    ],
    "envKeys": [
      "HOME"
    ],
    "resourceBindings": [],
    "adapter": "cli-spawn",
    "promptDelivery": undefined,
    "confinement": "none",
    "readOnlyMechanism": "none"
  },
  {
    "selector": "agy-cli",
    "workTier": "standard",
    "bindingSource": "executor-id",
    "provider": "gemini",
    "model": "gemini-3.8-flash-medium",
    "command": "agy",
    "args": [
      "-p",
      "<prompt>",
      "--mode",
      "accept-edits",
      "--new-project",
      "--print-timeout",
      "30m",
      "--model",
      "gemini-3.8-flash-medium"
    ],
    "envKeys": [
      "HOME"
    ],
    "resourceBindings": [],
    "adapter": "cli-spawn",
    "promptDelivery": undefined,
    "confinement": "none",
    "readOnlyMechanism": "none"
  },
  {
    "selector": "agy-cli",
    "workTier": "heavy",
    "bindingSource": "executor-id",
    "provider": "gemini",
    "model": "gemini-3.8-flash-high",
    "command": "agy",
    "args": [
      "-p",
      "<prompt>",
      "--mode",
      "accept-edits",
      "--new-project",
      "--print-timeout",
      "30m",
      "--model",
      "gemini-3.8-flash-high"
    ],
    "envKeys": [
      "HOME"
    ],
    "resourceBindings": [],
    "adapter": "cli-spawn",
    "promptDelivery": undefined,
    "confinement": "none",
    "readOnlyMechanism": "none"
  },
  {
    "selector": "agy-herdr",
    "workTier": "light",
    "bindingSource": "executor-id",
    "provider": "gemini",
    "model": "gemini-3.8-flash-low",
    "command": "agy",
    "args": [
      "<prompt>",
      "--mode",
      "accept-edits",
      "--new-project",
      "--model",
      "gemini-3.8-flash-low"
    ],
    "envKeys": [
      "HOME"
    ],
    "resourceBindings": [],
    "adapter": "herdr-spawn",
    "promptDelivery": "file-pointer",
    "confinement": "none",
    "readOnlyMechanism": "none"
  },
  {
    "selector": "agy-herdr",
    "workTier": "standard",
    "bindingSource": "executor-id",
    "provider": "gemini",
    "model": "gemini-3.8-flash-medium",
    "command": "agy",
    "args": [
      "<prompt>",
      "--mode",
      "accept-edits",
      "--new-project",
      "--model",
      "gemini-3.8-flash-medium"
    ],
    "envKeys": [
      "HOME"
    ],
    "resourceBindings": [],
    "adapter": "herdr-spawn",
    "promptDelivery": "file-pointer",
    "confinement": "none",
    "readOnlyMechanism": "none"
  },
  {
    "selector": "agy-herdr",
    "workTier": "heavy",
    "bindingSource": "executor-id",
    "provider": "gemini",
    "model": "gemini-3.8-flash-high",
    "command": "agy",
    "args": [
      "<prompt>",
      "--mode",
      "accept-edits",
      "--new-project",
      "--model",
      "gemini-3.8-flash-high"
    ],
    "envKeys": [
      "HOME"
    ],
    "resourceBindings": [],
    "adapter": "herdr-spawn",
    "promptDelivery": "file-pointer",
    "confinement": "none",
    "readOnlyMechanism": "none"
  },
  {
    "selector": "fgos-coding-implement",
    "workTier": "light",
    "bindingSource": "capability.prefer",
    "provider": "gemini",
    "model": "gemini-3.8-flash-medium",
    "command": "agy",
    "args": [
      "<prompt>",
      "--mode",
      "accept-edits",
      "--new-project",
      "--model",
      "gemini-3.8-flash-medium"
    ],
    "envKeys": [
      "HOME"
    ],
    "resourceBindings": [],
    "adapter": "herdr-spawn",
    "promptDelivery": "file-pointer",
    "confinement": "none",
    "readOnlyMechanism": "none"
  },
  {
    "selector": "fgos-coding-implement",
    "workTier": "standard",
    "bindingSource": "capability.prefer",
    "provider": "gemini",
    "model": "gemini-3.8-flash-medium",
    "command": "agy",
    "args": [
      "<prompt>",
      "--mode",
      "accept-edits",
      "--new-project",
      "--model",
      "gemini-3.8-flash-medium"
    ],
    "envKeys": [
      "HOME"
    ],
    "resourceBindings": [],
    "adapter": "herdr-spawn",
    "promptDelivery": "file-pointer",
    "confinement": "none",
    "readOnlyMechanism": "none"
  },
  {
    "selector": "fgos-coding-implement",
    "workTier": "heavy",
    "bindingSource": "capability.prefer",
    "provider": "gemini",
    "model": "gemini-3.8-flash-medium",
    "command": "agy",
    "args": [
      "<prompt>",
      "--mode",
      "accept-edits",
      "--new-project",
      "--model",
      "gemini-3.8-flash-medium"
    ],
    "envKeys": [
      "HOME"
    ],
    "resourceBindings": [],
    "adapter": "herdr-spawn",
    "promptDelivery": "file-pointer",
    "confinement": "none",
    "readOnlyMechanism": "none"
  },
  {
    "selector": "codex-cli",
    "workTier": "light",
    "bindingSource": "executor-id",
    "provider": "openai-codex",
    "model": "gpt-5.6-luna",
    "command": "codex",
    "args": [
      "exec",
      "--dangerously-bypass-approvals-and-sandbox",
      "--model",
      "gpt-5.6-luna",
      "<prompt>"
    ],
    "envKeys": [
      "CODEX_HOME"
    ],
    "resourceBindings": [],
    "adapter": "cli-spawn",
    "promptDelivery": undefined,
    "confinement": "none",
    "readOnlyMechanism": "none"
  },
  {
    "selector": "codex-cli",
    "workTier": "standard",
    "bindingSource": "executor-id",
    "provider": "openai-codex",
    "model": "gpt-5.6-terra",
    "command": "codex",
    "args": [
      "exec",
      "--dangerously-bypass-approvals-and-sandbox",
      "--model",
      "gpt-5.6-terra",
      "<prompt>"
    ],
    "envKeys": [
      "CODEX_HOME"
    ],
    "resourceBindings": [],
    "adapter": "cli-spawn",
    "promptDelivery": undefined,
    "confinement": "none",
    "readOnlyMechanism": "none"
  },
  {
    "selector": "codex-cli",
    "workTier": "heavy",
    "bindingSource": "executor-id",
    "provider": "openai-codex",
    "model": "gpt-5.6-sol",
    "command": "codex",
    "args": [
      "exec",
      "--dangerously-bypass-approvals-and-sandbox",
      "--model",
      "gpt-5.6-sol",
      "<prompt>"
    ],
    "envKeys": [
      "CODEX_HOME"
    ],
    "resourceBindings": [],
    "adapter": "cli-spawn",
    "promptDelivery": undefined,
    "confinement": "none",
    "readOnlyMechanism": "none"
  },
  {
    "selector": "codex-bwrap",
    "workTier": "light",
    "bindingSource": "executor-id",
    "provider": "openai-codex",
    "model": "gpt-5.6-luna",
    "command": "codex",
    "args": [
      "exec",
      "--skip-git-repo-check",
      "-s",
      "danger-full-access",
      "--model",
      "gpt-5.6-luna",
      "<prompt>"
    ],
    "envKeys": [],
    "resourceBindings": [
      {
        "resource": "private-home",
        "target": {
          "kind": "env",
          "name": "CODEX_HOME"
        }
      }
    ],
    "adapter": "cli-spawn",
    "promptDelivery": undefined,
    "confinement": "bwrap",
    "readOnlyMechanism": "none"
  },
  {
    "selector": "codex-bwrap",
    "workTier": "standard",
    "bindingSource": "executor-id",
    "provider": "openai-codex",
    "model": "gpt-5.6-terra",
    "command": "codex",
    "args": [
      "exec",
      "--skip-git-repo-check",
      "-s",
      "danger-full-access",
      "--model",
      "gpt-5.6-terra",
      "<prompt>"
    ],
    "envKeys": [],
    "resourceBindings": [
      {
        "resource": "private-home",
        "target": {
          "kind": "env",
          "name": "CODEX_HOME"
        }
      }
    ],
    "adapter": "cli-spawn",
    "promptDelivery": undefined,
    "confinement": "bwrap",
    "readOnlyMechanism": "none"
  },
  {
    "selector": "codex-bwrap",
    "workTier": "heavy",
    "bindingSource": "executor-id",
    "provider": "openai-codex",
    "model": "gpt-5.6-sol",
    "command": "codex",
    "args": [
      "exec",
      "--skip-git-repo-check",
      "-s",
      "danger-full-access",
      "--model",
      "gpt-5.6-sol",
      "<prompt>"
    ],
    "envKeys": [],
    "resourceBindings": [
      {
        "resource": "private-home",
        "target": {
          "kind": "env",
          "name": "CODEX_HOME"
        }
      }
    ],
    "adapter": "cli-spawn",
    "promptDelivery": undefined,
    "confinement": "bwrap",
    "readOnlyMechanism": "none"
  },
  {
    "selector": "codex-readonly",
    "workTier": "light",
    "bindingSource": "executor-id",
    "provider": "openai-codex",
    "model": "gpt-5.6-luna",
    "command": "codex",
    "args": [
      "exec",
      "-s",
      "read-only",
      "--model",
      "gpt-5.6-luna",
      "<prompt>"
    ],
    "envKeys": [
      "CODEX_HOME"
    ],
    "resourceBindings": [],
    "adapter": "cli-spawn",
    "promptDelivery": undefined,
    "confinement": "none",
    "readOnlyMechanism": "provider-native-read-only"
  },
  {
    "selector": "codex-readonly",
    "workTier": "standard",
    "bindingSource": "executor-id",
    "provider": "openai-codex",
    "model": "gpt-5.6-terra",
    "command": "codex",
    "args": [
      "exec",
      "-s",
      "read-only",
      "--model",
      "gpt-5.6-terra",
      "<prompt>"
    ],
    "envKeys": [
      "CODEX_HOME"
    ],
    "resourceBindings": [],
    "adapter": "cli-spawn",
    "promptDelivery": undefined,
    "confinement": "none",
    "readOnlyMechanism": "provider-native-read-only"
  },
  {
    "selector": "codex-readonly",
    "workTier": "heavy",
    "bindingSource": "executor-id",
    "provider": "openai-codex",
    "model": "gpt-5.6-sol",
    "command": "codex",
    "args": [
      "exec",
      "-s",
      "read-only",
      "--model",
      "gpt-5.6-sol",
      "<prompt>"
    ],
    "envKeys": [
      "CODEX_HOME"
    ],
    "resourceBindings": [],
    "adapter": "cli-spawn",
    "promptDelivery": undefined,
    "confinement": "none",
    "readOnlyMechanism": "provider-native-read-only"
  },
  {
    "selector": "pi",
    "workTier": "light",
    "bindingSource": "executor-id",
    "provider": "openai-codex",
    "model": "gpt-5.6-luna",
    "command": "pi",
    "args": [
      "--provider",
      "openai-codex",
      "--model",
      "gpt-5.6-luna",
      "--tools",
      "read,write,edit,bash,grep,find,ls",
      "--mode",
      "json",
      "--approve",
      "-p",
      "<prompt>"
    ],
    "envKeys": [],
    "resourceBindings": [],
    "adapter": "cli-spawn",
    "promptDelivery": undefined,
    "confinement": "none",
    "readOnlyMechanism": "none"
  },
  {
    "selector": "pi",
    "workTier": "standard",
    "bindingSource": "executor-id",
    "provider": "openai-codex",
    "model": "gpt-5.6-luna",
    "command": "pi",
    "args": [
      "--provider",
      "openai-codex",
      "--model",
      "gpt-5.6-luna",
      "--tools",
      "read,write,edit,bash,grep,find,ls",
      "--mode",
      "json",
      "--approve",
      "-p",
      "<prompt>"
    ],
    "envKeys": [],
    "resourceBindings": [],
    "adapter": "cli-spawn",
    "promptDelivery": undefined,
    "confinement": "none",
    "readOnlyMechanism": "none"
  },
  {
    "selector": "pi",
    "workTier": "heavy",
    "bindingSource": "executor-id",
    "provider": "openai-codex",
    "model": "gpt-5.6-luna",
    "command": "pi",
    "args": [
      "--provider",
      "openai-codex",
      "--model",
      "gpt-5.6-luna",
      "--tools",
      "read,write,edit,bash,grep,find,ls",
      "--mode",
      "json",
      "--approve",
      "-p",
      "<prompt>"
    ],
    "envKeys": [],
    "resourceBindings": [],
    "adapter": "cli-spawn",
    "promptDelivery": undefined,
    "confinement": "none",
    "readOnlyMechanism": "none"
  },
  {
    "selector": "codex-pi",
    "workTier": "light",
    "bindingSource": "executor-id",
    "provider": "openai-codex",
    "model": "gpt-5.6-luna",
    "command": "pi",
    "args": [
      "--provider",
      "openai-codex",
      "--model",
      "gpt-5.6-luna",
      "--tools",
      "read,write,edit,bash,grep,find,ls",
      "--mode",
      "json",
      "--approve",
      "-p",
      "<prompt>"
    ],
    "envKeys": [],
    "resourceBindings": [],
    "adapter": "cli-spawn",
    "promptDelivery": undefined,
    "confinement": "none",
    "readOnlyMechanism": "none"
  },
  {
    "selector": "codex-pi",
    "workTier": "standard",
    "bindingSource": "executor-id",
    "provider": "openai-codex",
    "model": "gpt-5.6-luna",
    "command": "pi",
    "args": [
      "--provider",
      "openai-codex",
      "--model",
      "gpt-5.6-luna",
      "--tools",
      "read,write,edit,bash,grep,find,ls",
      "--mode",
      "json",
      "--approve",
      "-p",
      "<prompt>"
    ],
    "envKeys": [],
    "resourceBindings": [],
    "adapter": "cli-spawn",
    "promptDelivery": undefined,
    "confinement": "none",
    "readOnlyMechanism": "none"
  },
  {
    "selector": "codex-pi",
    "workTier": "heavy",
    "bindingSource": "executor-id",
    "provider": "openai-codex",
    "model": "gpt-5.6-luna",
    "command": "pi",
    "args": [
      "--provider",
      "openai-codex",
      "--model",
      "gpt-5.6-luna",
      "--tools",
      "read,write,edit,bash,grep,find,ls",
      "--mode",
      "json",
      "--approve",
      "-p",
      "<prompt>"
    ],
    "envKeys": [],
    "resourceBindings": [],
    "adapter": "cli-spawn",
    "promptDelivery": undefined,
    "confinement": "none",
    "readOnlyMechanism": "none"
  },
  {
    "selector": "glm-cli",
    "workTier": "light",
    "bindingSource": "executor-id",
    "provider": "z-ai",
    "model": "z-ai/glm-5.2",
    "command": "claude",
    "args": [
      "-p",
      "<prompt>",
      "--model",
      "z-ai/glm-5.2",
      "--permission-mode",
      "acceptEdits",
      "--allowedTools",
      "Bash(git add:*),Bash(git commit:*),Bash(rtk git add:*),Bash(rtk git commit:*)"
    ],
    "envKeys": [
      "ANTHROPIC_BASE_URL",
      "ANTHROPIC_AUTH_TOKEN",
      "ANTHROPIC_MODEL",
      "ANTHROPIC_API_KEY",
      "ANTHROPIC_DEFAULT_HAIKU_MODEL",
      "ANTHROPIC_DEFAULT_SONNET_MODEL",
      "ANTHROPIC_DEFAULT_OPUS_MODEL"
    ],
    "resourceBindings": [],
    "adapter": "cli-spawn",
    "promptDelivery": undefined,
    "confinement": "none",
    "readOnlyMechanism": "tool-allowlist-not-read-only-enforced"
  },
  {
    "selector": "glm-cli",
    "workTier": "standard",
    "bindingSource": "executor-id",
    "provider": "z-ai",
    "model": "z-ai/glm-5.2",
    "command": "claude",
    "args": [
      "-p",
      "<prompt>",
      "--model",
      "z-ai/glm-5.2",
      "--permission-mode",
      "acceptEdits",
      "--allowedTools",
      "Bash(git add:*),Bash(git commit:*),Bash(rtk git add:*),Bash(rtk git commit:*)"
    ],
    "envKeys": [
      "ANTHROPIC_BASE_URL",
      "ANTHROPIC_AUTH_TOKEN",
      "ANTHROPIC_MODEL",
      "ANTHROPIC_API_KEY",
      "ANTHROPIC_DEFAULT_HAIKU_MODEL",
      "ANTHROPIC_DEFAULT_SONNET_MODEL",
      "ANTHROPIC_DEFAULT_OPUS_MODEL"
    ],
    "resourceBindings": [],
    "adapter": "cli-spawn",
    "promptDelivery": undefined,
    "confinement": "none",
    "readOnlyMechanism": "tool-allowlist-not-read-only-enforced"
  },
  {
    "selector": "glm-cli",
    "workTier": "heavy",
    "bindingSource": "executor-id",
    "provider": "z-ai",
    "model": "z-ai/glm-5.2",
    "command": "claude",
    "args": [
      "-p",
      "<prompt>",
      "--model",
      "z-ai/glm-5.2",
      "--permission-mode",
      "acceptEdits",
      "--allowedTools",
      "Bash(git add:*),Bash(git commit:*),Bash(rtk git add:*),Bash(rtk git commit:*)"
    ],
    "envKeys": [
      "ANTHROPIC_BASE_URL",
      "ANTHROPIC_AUTH_TOKEN",
      "ANTHROPIC_MODEL",
      "ANTHROPIC_API_KEY",
      "ANTHROPIC_DEFAULT_HAIKU_MODEL",
      "ANTHROPIC_DEFAULT_SONNET_MODEL",
      "ANTHROPIC_DEFAULT_OPUS_MODEL"
    ],
    "resourceBindings": [],
    "adapter": "cli-spawn",
    "promptDelivery": undefined,
    "confinement": "none",
    "readOnlyMechanism": "tool-allowlist-not-read-only-enforced"
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
      assert.ok(cfg.executors['codex-bwrap'], 'loaded config must contain codex-bwrap from project config');
      assert.ok(cfg.capabilities?.['fgos-coding-implement'], 'loaded config must contain fgos-coding-implement capability');
      assert.equal(process.env.HOME, tempHomeDir, 'process.env.HOME must match isolated temp directory');
    });
  });

  describe('matrix fixture completeness', () => {
    test('matrix fixture contains exactly 36 expected (executorId, workTier) pairs', () => {
      assert.equal(BASELINE_SNAPSHOT_FIXTURE.length, 36, 'baseline snapshot fixture must have exactly 36 rows');
      const expectedExecutors = [
        'claude',
        'claude-reviewer',
        'claude-reviewer-herdr',
        'agy-cli',
        'agy-herdr',
        'fgos-coding-implement',
        'codex-cli',
        'codex-bwrap',
        'codex-readonly',
        'pi',
        'codex-pi',
        'glm-cli',
      ];
      const expectedTiers = ['light', 'standard', 'heavy'];
      const expectedPairKeys = new Set();
      for (const exec of expectedExecutors) {
        for (const tier of expectedTiers) {
          expectedPairKeys.add(`${exec}:${tier}`);
        }
      }
      assert.equal(expectedPairKeys.size, 36);

      const actualPairKeys = new Set(BASELINE_SNAPSHOT_FIXTURE.map((row) => `${row.selector}:${row.workTier}`));
      assert.equal(actualPairKeys.size, 36, 'fixture must not contain duplicate executor × tier pairs');
      assert.deepEqual(actualPairKeys, expectedPairKeys, 'fixture must match full set of expected executor × tier pairs');
    });
  });

  describe('matrix regression snapshot assertions (36 pairs)', () => {
    for (const expected of BASELINE_SNAPSHOT_FIXTURE) {
      test(`snapshot: ${expected.selector} [${expected.workTier}] matches baseline fixture`, () => {
        const actual = resolveNormalizedSnapshotRow(cfg, expected.selector, expected.workTier, throwawayDir);
        assert.deepEqual(actual, expected);
      });
    }
  });

  describe('named explicit baseline facts', () => {
    // (a) raw agy-cli heavy AND agy-herdr heavy both resolve model to gemini-3.8-flash-high (policy tier creative)
    test('fact (a): raw agy-cli heavy and agy-herdr heavy resolve to gemini-3.8-flash-high (policy tier creative)', () => {
      const agyCliHeavy = resolveNormalizedSnapshotRow(cfg, 'agy-cli', 'heavy', throwawayDir);
      const agyHerdrHeavy = resolveNormalizedSnapshotRow(cfg, 'agy-herdr', 'heavy', throwawayDir);

      assert.equal(agyCliHeavy.model, 'gemini-3.8-flash-high', 'agy-cli heavy model must be gemini-3.8-flash-high');
      assert.equal(agyHerdrHeavy.model, 'gemini-3.8-flash-high', 'agy-herdr heavy model must be gemini-3.8-flash-high');
      assert.equal(agyCliHeavy.provider, 'gemini');
      assert.equal(agyHerdrHeavy.provider, 'gemini');
    });

    // (b) fgos-coding-implement heavy resolves model to gemini-3.8-flash-medium (policy tier standard, via its capability override)
    // Note: fgos-coding-implement is a capability id resolved via resolveExecutorAndOverrides's capability.prefer path;
    // its resolvedExecutorId will differ from 'fgos-coding-implement' itself. Assert on resolved model not executor identity.
    test('fact (b): fgos-coding-implement heavy resolves model to gemini-3.8-flash-medium via capability override', () => {
      const { executorId: resolvedExecutorId, bindingSource } = resolveExecutorAndOverrides(cfg, 'fgos-coding-implement');
      assert.equal(bindingSource, 'capability.prefer', 'bindingSource must be capability.prefer');
      assert.equal(resolvedExecutorId, 'agy-herdr', 'resolvedExecutorId resolves to agy-herdr');

      const fgosImplementHeavy = resolveNormalizedSnapshotRow(cfg, 'fgos-coding-implement', 'heavy', throwawayDir);
      assert.equal(fgosImplementHeavy.model, 'gemini-3.8-flash-medium', 'fgos-coding-implement heavy model must be gemini-3.8-flash-medium');
      assert.equal(fgosImplementHeavy.selector, 'fgos-coding-implement');
      assert.equal(fgosImplementHeavy.bindingSource, 'capability.prefer');
    });

    // (c) both claude-reviewer and claude-reviewer-herdr, for every tier, have '--effort' followed by 'high' somewhere in args
    test('fact (c): claude-reviewer and claude-reviewer-herdr for every tier have --effort high in args', () => {
      const reviewerSelectors = ['claude-reviewer', 'claude-reviewer-herdr'];
      const tiers = ['light', 'standard', 'heavy'];

      for (const selector of reviewerSelectors) {
        for (const tier of tiers) {
          const row = resolveNormalizedSnapshotRow(cfg, selector, tier, throwawayDir);
          const effortIdx = row.args.indexOf('--effort');
          assert.notEqual(effortIdx, -1, `${selector} [${tier}] must contain '--effort' in args`);
          assert.equal(row.args[effortIdx + 1], 'high', `${selector} [${tier}] '--effort' must be followed by 'high'`);
        }
      }
    });

    // (d) codex-readonly derives 'provider-native-read-only' while claude/claude-reviewer/claude-reviewer-herdr/glm-cli derive 'tool-allowlist-not-read-only-enforced'
    test('fact (d): readOnlyMechanism distinguishes provider-native-read-only from tool-allowlist-not-read-only-enforced', () => {
      const tiers = ['light', 'standard', 'heavy'];
      for (const tier of tiers) {
        const codexReadOnly = resolveNormalizedSnapshotRow(cfg, 'codex-readonly', tier, throwawayDir);
        assert.equal(
          codexReadOnly.readOnlyMechanism,
          'provider-native-read-only',
          `codex-readonly [${tier}] readOnlyMechanism must be provider-native-read-only`
        );

        for (const toolGated of ['claude', 'claude-reviewer', 'claude-reviewer-herdr', 'glm-cli']) {
          const row = resolveNormalizedSnapshotRow(cfg, toolGated, tier, throwawayDir);
          assert.equal(
            row.readOnlyMechanism,
            'tool-allowlist-not-read-only-enforced',
            `${toolGated} [${tier}] readOnlyMechanism must be tool-allowlist-not-read-only-enforced`
          );
        }

        const unGated = resolveNormalizedSnapshotRow(cfg, 'agy-cli', tier, throwawayDir);
        assert.equal(
          unGated.readOnlyMechanism,
          'none',
          `agy-cli [${tier}] readOnlyMechanism must be none`
        );
      }
    });

    // (e) codex-bwrap declares CODEX_HOME resource binding while other executors have empty bindings
    test('fact (e): resourceBindings captures codex-bwrap CODEX_HOME binding', () => {
      const tiers = ['light', 'standard', 'heavy'];
      for (const tier of tiers) {
        const bwrapRow = resolveNormalizedSnapshotRow(cfg, 'codex-bwrap', tier, throwawayDir);
        assert.deepEqual(
          bwrapRow.resourceBindings,
          [
            {
              resource: 'private-home',
              target: {
                kind: 'env',
                name: 'CODEX_HOME',
              },
            },
          ],
          `codex-bwrap [${tier}] must declare resourceBindings with private-home CODEX_HOME env target`
        );

        const cliRow = resolveNormalizedSnapshotRow(cfg, 'codex-cli', tier, throwawayDir);
        assert.deepEqual(
          cliRow.resourceBindings,
          [],
          `codex-cli [${tier}] resourceBindings must be empty`
        );
      }
    });
  });
});
