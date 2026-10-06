# Implementation Report: Remediation of Governance Defects RV-01 and RV-02 (Provider Deny-List Vocabulary Synchronization)

- **Track**: `plans/260920-2217-dispatch-engine-hardening/plan.md` (Remediation of RV-01 & RV-02)
- **Unified Track**: `plans/260919-coordination-skill-harness-simplification/plan.md`
- **Date**: 2026-09-25
- **Branch**: `dispatch-governance-provider-denylist-remediation`
- **Worktree**: `/home/vantt/projects/forgentX/.claude/worktrees/dispatch-governance-provider-denylist-remediation`
- **Lineage & Identities**:
  - Implementation Base: `main@26a1038e12dd7bf05fc8ddbad9d7962911a8d2c3`
  - Origin Baseline Ancestor: `origin/main@b39898aa2377c453c9f76cbe56e4ede95fdc96b0` (main ahead 23 / behind 0)
  - Evaluated Candidate SHA: `132d377794ee02da702ff12d91cfa1c1545bb275`
  - Re-Verification Report Reference: `ad293ba7d1dd7362dfde937cc006662a8153a74b:plans/260920-2217-dispatch-engine-hardening/reports/phase-08-i08-post-integration-reverification-report.md`
- **Capability**: `code:implement`
- **Verdict**: **INTEGRATED & VERIFIED** (candidate `132d3777` + docs tip `ac19f6d1` fast-forward landed onto `main`; acceptance gate verified at `main@ac19f6d1`)

---

## 1. Executive Summary

During the post-integration re-verification of Unit I08 (`ad293ba7`), two governance defects in `disallowedProviders` evaluation were uncovered:

1. **RV-01 (HIGH, candidate regression from I08b F5)**:
   When an executor declared `providerModel: 'openai'` and governance configured `disallowedProviders: ['openai']`:
   - Direct dispatch correctly blocked egress;
   - Read-only redirect retargeting normalized the provider to canonical family `'openai-codex'`, which did not match raw deny-list entry `'openai'`, allowing the dispatch and spawning a worker.
   - This constituted an egress governance bypass and was a hard blocker for I08.

2. **RV-02 (MEDIUM, pre-existing baseline defect)**:
   When an executor declared `providerModel: 'openai'` and governance configured `disallowedProviders: ['openai-codex']`:
   - Direct dispatch failed to block because it compared raw declared provider `'openai'` directly against the deny list without canonicalization.

Both defects shared a single root cause: **vocabulary mismatch and lack of symmetric canonicalization of `disallowedProviders` and resolved provider families across the direct dispatch gate and read-only redirect gate**.

This unit definitively remediates both defects by introducing shared canonical provider governance helpers (`checkProviderDisallowed`, `normalizeDisallowedProviders`, `isProviderDisallowed`), wiring both direct and redirect gates through the identical semantic helper, and adding comprehensive regression coverage.

---

## 2. Locked Contract Decision

1. `disallowedProviders` represents canonical provider families, not executor IDs or CLI harnesses.
2. Both sides are normalized through the exact same canonical path prior to comparison:
   - Every entry in `disallowedProviders`;
   - The resolved declared vendor/provider of the executor.
3. Canonical alias mappings:
   - `openai`, `codex`, `openai-codex` → `openai-codex`
   - `glm`, `z-ai` → `z-ai`
   - `agy`, `gemini` → `gemini`
   - `claude` → `claude`
   - `deepseek` → `deepseek`
   - Unknown declared provider → normalized lowercase value of itself.
4. Declared `providerModel`/`provider` strictly takes precedence over CLI harness commands (`pi`, `claude`, `codex` do not override declared vendor).
5. Direct and redirect gates call the exact same shared semantic helper; no divergent raw-or-canonical paths exist.
6. Rejections occur strictly pre-spawn, prior to any Run materialization or worker process spawning.
7. `disallowedExecutors`, `crossProvider: true`, `allowCrossProvider`, and PlacementPolicy authority are preserved intact.

---

## 3. Technical Remediation Details

### 3.1 Shared Canonical Governance Helpers (`src/runner/dispatch/provider-adapter.mjs`)

- Updated `normalizeProviderFamily(providerFamily, command)`:
  - Explicitly mapped `deepseek` → `deepseek` and fallback command `glm` → `z-ai`.
  - Maintained declared vendor precedence over CLI harnesses (`pi`, `claude`).
- Exported `normalizeDisallowedProviders(disallowedProviders)`:
  - Normalizes every non-empty string entry in `disallowedProviders` into a `Set` of canonical provider family names using `normalizeProviderFamily`.
- Exported `checkProviderDisallowed(disallowedProviders, candidateProvider, candidateCommand)`:
  - Computes `canonicalProvider = normalizeProviderFamily(candidateProvider, candidateCommand)`.
  - Checks membership against the normalized deny Set.
  - Returns `{ disallowed: boolean, canonicalProvider: string }`.
- Exported `isProviderDisallowed(disallowedProviders, candidateProvider, candidateCommand)`:
  - Convenience boolean helper returning `checkProviderDisallowed(...).disallowed`.

### 3.2 Direct Dispatch Gate (`src/runner/dispatch/assignment-policy.mjs`)

- Imported `checkProviderDisallowed` from `./provider-adapter.mjs`.
- In `resolveAssignmentDispatchPolicy` (Step 7 Governance Check):
  ```javascript
  const providerGov = checkProviderDisallowed(options.disallowedProviders, resolvedProvider);
  if (providerGov.disallowed) {
    throw new RunnerConfigError(`governance gate rejected provider "${providerGov.canonicalProvider}": disallowed egress`, {
      code: 'governance.disallowed-provider',
    });
  }
  if (options.disallowedExecutors && options.disallowedExecutors.includes(primaryExecutor)) {
    throw new RunnerConfigError(`governance gate rejected executor "${primaryExecutor}": disallowed`, {
      code: 'governance.disallowed-executor',
    });
  }
  const governanceSource = { scope: 'governance', id: providerGov.canonicalProvider };
  ```
- Rejection throws `RunnerConfigError` with canonical provider name and `code: 'governance.disallowed-provider'`.
- Preserved independent `disallowedExecutors` evaluation.

### 3.3 Read-Only Redirect Gate (`src/runner/dispatch/assignment-runner.mjs`)

- Imported `checkProviderDisallowed` from `./provider-adapter.mjs`.
- At redirect governance check (lines 1795–1805):
  ```javascript
  if (resolvedExecutorId !== defaultExecutorId) {
    const redirectGov = checkProviderDisallowed(opts.options?.disallowedProviders, effectivePolicy.providerModel);
    if (redirectGov.disallowed) {
      throw new RunnerConfigError(`governance gate rejected provider "${redirectGov.canonicalProvider}": disallowed egress (via readOnlyRedirect "${defaultExecutorId}" -> "${resolvedExecutorId}")`, {
        code: 'governance.disallowed-provider',
      });
    }
    if (opts.options?.disallowedExecutors?.includes(resolvedExecutorId)) {
      throw new RunnerConfigError(`governance gate rejected executor "${resolvedExecutorId}": disallowed (via readOnlyRedirect "${defaultExecutorId}" -> "${resolvedExecutorId}")`, {
        code: 'governance.disallowed-executor',
      });
    }
    // ... allowCrossProvider checks ...
  }
  ```
- Evaluates canonicalized redirect target `effectivePolicy.providerModel` against the canonicalized deny Set using the identical helper.
- Pre-spawn rejection prevents `admitRunAttempt`, run directory creation, and worker process spawn.

---

## 4. GitNexus & Blast Radius

- Local index `.gitnexus/meta.json` at `16a7900d` is behind current baseline `26a1038e` (stale/degraded); GitNexus tool query inactive.
- Manual blast radius audit conducted:
  - Governance consumers: `assignment-policy.mjs:526` (direct gate), `assignment-runner.mjs:1796` (redirect gate), `placement-policy.mjs:164` (fallback candidate admission).
  - Callers of `resolveAssignmentDispatchPolicy`: `plan.mjs` (`compileDispatchPlan`), `cli.mjs` (`executeExecutorCli`), coordination and assignment execution loops.
  - Callers of `executeAssignment`: `session-engine.mjs` (`runExecutorAttempt`), runner loops, fanout batch.
- Governance blast radius assessed as **HIGH** due to egress boundary enforcement. Remediation verified clean with zero regressions.

---

## 5. Verification Probes

Reproduced both defects on baseline and verified resolution on candidate `132d3777`:

| Probe Scenario | Governance Setting | Target Executor Provider | Baseline (`26a1038e`) | Candidate (`132d3777`) | Status |
|---|---|---|---|---|---|
| **1. Direct + raw deny alias** | `disallowedProviders: ['openai']` | `providerModel: 'openai'` | REJECTED ("openai") | **REJECTED ("openai-codex")** | PASS |
| **2. Direct + canonical deny name** | `disallowedProviders: ['openai-codex']` | `providerModel: 'openai'` | **ALLOWED (RV-02 defect)** | **REJECTED ("openai-codex")** | **RESOLVED (RV-02)** |
| **3. Redirect + raw deny alias** | `disallowedProviders: ['openai']` | `providerModel: 'openai'` | **ALLOWED / SPAWNED (RV-01)** | **REJECTED pre-spawn (no worker)** | **RESOLVED (RV-01)** |
| **4. Redirect + canonical deny name** | `disallowedProviders: ['openai-codex']` | `providerModel: 'openai'` | REJECTED pre-spawn | **REJECTED pre-spawn (no worker)** | PASS |
| **5. Negative control (unrelated)** | `disallowedProviders: ['deepseek']` | `providerModel: 'openai'` | ALLOWED / SPAWNED | **ALLOWED / SPAWNED** | PASS |

All denials occur strictly pre-spawn with no run directory or worker artifacts materialized.

---

## 6. Test Evidence

### 6.1 Dedicated Regression Suite (`test/runner/dispatch-governance-provider-denylist.test.mjs`)

Comprehensive test suite verifying all required matrix behaviors without management labels:
1. `provider-adapter canonicalizes provider families and deny lists symmetrically`: tests bidirectional normalization of aliases (`openai`, `codex`, `glm`, `z-ai`, `agy`, `gemini`, `claude`, `deepseek`) and helper methods.
2. `direct dispatch gate enforces canonical provider matching for OpenAI family aliases`: deny `openai` blocks `openai`; deny `openai-codex` blocks `openai`; deny `codex` blocks `openai-codex`.
3. `read-only redirect gate enforces canonical provider matching for OpenAI family aliases`: deny `openai` blocks redirect target `openai`; deny `openai-codex` blocks redirect target `openai`; worker never spawns.
4. `governance gates enforce canonical provider matching for Z-AI family aliases across direct and redirect`: direct and redirect tests for `glm` blocking `z-ai` and `z-ai` blocking `glm`.
5. `governance gates enforce canonical provider matching for Gemini family aliases across direct and redirect`: direct and redirect tests for `agy` blocking `gemini` and `gemini` blocking `agy`.
6. `governance negative controls`: unrelated provider allowed; `disallowedExecutors` acts independently; intra-family redirect does not require `crossProvider: true`; cross-family redirect without opt-in fails closed; rejection leaves no run evidence directory.

Result: **6 passed / 0 failed (458 ms)**. Mutation-sensitive: removing canonicalization fails cases 2, 3, 4, and 5.

### 6.2 Test Matrix Summary

| Suite Scope | Files | Tests | Result | Notes |
|---|---|---|---|---|
| Dedicated Regression Suite | 1 | 6 | **6 pass / 0 fail** | `test/runner/dispatch-governance-provider-denylist.test.mjs` |
| Focused Matrix | 9 | 531 | **531 pass / 0 fail** | prompt §8 list + new regression suite |
| Affected Matrix | 56 | 1472 | **1471 pass / 0 fail / 1 skip** | dispatch, herdr, assignment, placement, redirect, etc. (1 skip: opt-in live agy-herdr) |
| Rust Host Packaging & Release | 4 | 52 | **52 pass / 0 fail** | built via `cargo build --release --workspace` |
| Full Repository Suite (`npm test`) | - | 7723 | **7647 pass / 0 fail / 8 skip / 68 todo** | exit code 0 (352.4 s); 3 failing probe outputs are `todo` entries |
| Whitespace & Hygiene (`git diff --check`) | - | - | **clean (0 warnings/errors)** | |

---

## 7. Cross-Plan Accounting

- **Unit I08**: **VERIFIED at main@ac19f6d1** (RV-01 blocker and RV-02 baseline defect resolved by candidate `132d3777` + docs tip `ac19f6d1`; acceptance gate re-verification complete: full suite run 3 exit 0 [7647 pass, 0 fail], 10/10 isolated coord pass, 10/10 isolated dispatch pass, 60/60 parallel load pass; timing instability recorded as LOW debt).
- **Unit I08b**: `integrated at main@ba8f6a9d` (candidate merge `98f501be`, candidate `d4e052a6`, post-landing verified; followed by RV-01/RV-02 remediation candidate `132d3777` integrated on `main@ac19f6d1`).
- **Unit I10**: `integrated and verified at main@605d26fe, carried forward` through synchronized main `26a1038e` and `main@ac19f6d1`.
- **Unit I11**: **READY, not yet opened** (dependencies I03, I05, I08, and I10 satisfied; pending official Track Manager checkpoint signoff).
- **Follow-up Finding N10**: unchanged, reserved for future adapter/vendor disentanglement.

---

## 8. Commit and Lineage Summary

- **Implementation Base**: `26a1038e12dd7bf05fc8ddbad9d7962911a8d2c3`
- **Evaluated Implementation Candidate SHA**: `132d377794ee02da702ff12d91cfa1c1545bb275`
  - `src/runner/dispatch/provider-adapter.mjs`
  - `src/runner/dispatch/assignment-policy.mjs`
  - `src/runner/dispatch/assignment-runner.mjs`
  - `test/runner/dispatch-governance-provider-denylist.test.mjs`
- **Status-Recording / Docs Tip SHA**: see commit carrying this accounting report.
