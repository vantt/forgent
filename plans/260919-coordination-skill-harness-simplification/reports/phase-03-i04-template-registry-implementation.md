# Phase 3 / Unit I04 Implementation Report: Operation Prompt-Template Registry, Deterministic Resolver, and Provenance

- **Unit:** `I04` — implement Phase 3 template registry/resolver/provenance
- **Status:** `implemented` (ready for independent review `I05`)
- **Track:** `plans/260919-coordination-skill-harness-simplification/plan.md`
- **Capability:** `code:implement` (`dispatch decide` returned `in-process`)
- **Branch:** `coordination-skill-harness-i04-template-registry`
- **Worktree:** `/home/vantt/projects/forgentX/.claude/worktrees/coordination-skill-harness-i04-template-registry`
- **Base SHA:** `15e4048503ca1ee02dae23263dee84b9c983386d`
- **Date:** 2026-09-22

---

## 1. Executive Summary

Unit I04 implements Phase 3 of the Coordination Skill and Harness Simplification track. It replaces ad-hoc role doctrine living inside coordination skills with a deterministic, domain-neutral prompt-template registry and resolver backed by FlowDefinition's existing `task.contractTemplate` contract.

Key achievements:
1. **Multi-tier Registry with Strict Precedence:** Discovers prompt templates across `project` (`<cwd>/.fgos/prompt-templates/`), `domain` (`<packageRoot>/domains/<domain>/prompt-templates/`), and `core` (`<packageRoot>/core/prompt-templates/`). Precedence is strictly project > domain > core.
2. **Authority & Bounded Variable Whitelist:** A template cannot grant or widen authority, mutation, context, budget, visibility, executor, provider, model, or graph legality. The renderer permits *only* validated bounded variables derived from the validated semantic action / ExecutionContract / Assignment: `{objective}`, `{contextRefs}`, `{artifactRefs}`, `{expectedOutputs}`, `{role}`, `{constraints}` (internal stamps like `protocol-operation:*` are automatically stripped), and `{evidenceContract}`. Unrecognized variables throw `template-invalid` immediately.
3. **Deterministic Resolution & Provenance:** At dispatch time in `assignment-runner.mjs`, `resolveAndRenderOperationPrompt` resolves the template, computes `contentDigest` (SHA-256 of template text), `renderedPromptDigest` (SHA-256 of rendered body), and snapshots `templateSnapshot`. This provenance is attached to `effectiveAssignment.provenance.template`, preserved in `run.json` (`runMeta.template`), and rendered into worker prompts, ensuring retry and replay attribution remains fully reproducible even if disk files change later.
4. **Failure Posture & Loud Refusal:** Missing, ambiguous (multiple extensions for same ID, or ID collisions across domains), invalid (bad variables or malformed content), or path-escaping templates fail loudly with typed `TemplateResolutionError` codes (`template-not-found`, `template-ambiguous`, `template-invalid`, `template-path-escape`).
5. **Legacy-Objective Migration Guardrail:** FlowDefinitions without resolvable templates on disk safely retain their explicit legacy-objective path during migration in `session-engine.mjs`.
6. **Domain-Neutral Proof:** Shipped core templates demonstrate seamless resolution across:
   - Plan-loop operation: `master-loop-review-candidate` (`core/coordination-protocols/standalone-master-coordination-loop.yaml`)
   - Deliberation advisory operation: `rfc-review-lite-propose` (plus `rfc-review-lite-convene`, `rfc-review-lite-object`, `rfc-review-lite-respond` in `core/coordination-protocols/group-thinking-rfc-review-lite.yaml`)
   - Architecture advisory operation: `architecture-advisory-panel-v1-scout-report` (`core/coordination-protocols/architecture-advisory-panel-v1.yaml`)
7. **Doctor Check & Diagnostics:** Registered `operation-prompt-templates-valid` in `src/setup/registrations.mjs` and documented in `docs/specs/distribution.md` Data Dictionary #7.

---

## 2. Design Note

### 2.1 Source-of-Truth & Discovery Precedence
Templates are markdown or text files (`<templateId>.md` or `<templateId>.txt`) scanned in 3 tiers:
1. `project`: `<cwd>/.fgos/prompt-templates/<templateId>.{md,txt}`
2. `domain`: `<packageRoot>/domains/<domain>/prompt-templates/<templateId>.{md,txt}`
3. `core`: `<packageRoot>/core/prompt-templates/<templateId>.{md,txt}`

Precedence is monotonic: project overrides domain, which overrides core.

### 2.2 Ambiguity and Collision Refusal
- If a directory contains both `<id>.md` and `<id>.txt`, resolution fails immediately with `template-ambiguous`.
- If two different domains define the same template ID, discovery refuses with `template-ambiguous`.
- If a symlink resolves outside its scan root, discovery refuses with `template-path-escape`.

### 2.3 Bounded Variables & Normalization
The template renderer only replaces the exact bounded set:
- `{objective}`: string
- `{role}`: string
- `{contextRefs}`: formatted markdown list (`- ref1\n- ref2` or `- (none)`)
- `{artifactRefs}`: alias for contextRefs
- `{expectedOutputs}`: formatted markdown list (`- out1\n- out2` or `- (none)`)
- `{constraints}`: formatted markdown list, filtering out internal engine stamps such as `protocol-operation:*`
- `{evidenceContract}`: string (`'reported'` or `'verified'`)

Any placeholder `{unknown}` throws `TemplateResolutionError('template-invalid')`.

### 2.4 Provenance Schema & Replay Determinism
Template provenance recorded in `effectiveAssignment.provenance.template` and `run.json`:
```json
{
  "id": "master-loop-review-candidate",
  "tier": "core",
  "source": "core",
  "filePath": "core/prompt-templates/master-loop-review-candidate.md",
  "contentDigest": "sha256:...",
  "renderedPromptDigest": "sha256:...",
  "templateSnapshot": "# Master Loop Review Candidate\n..."
}
```
Because `templateSnapshot` and digests are captured at dispatch time, replaying or attributing an older run is strictly deterministic and immune to subsequent edits of the template on disk.

### 2.5 Migration Seam & Legacy Objective Path
In `src/runner/coordination/session-engine.mjs`, `dispatchDeclaredOperationLocked` checks `hasOperationPromptTemplate` before threading `contractTemplate`. If a definition declared a template ID that is not yet authored on disk, it falls back to the legacy-objective path. If an Assignment explicitly specifies a `contractTemplate` that does not exist, `assignment-runner.mjs` and `assignment.mjs` fail loudly with `template-not-found`.

---

## 3. Changed Files and Core Artifacts

| File | Change Type | Purpose / Description |
|---|---|---|
| `src/runner/dispatch/operation-prompt-templates.mjs` | **New module** (`infra`) | Registry discovery, template loader, bounded variable validator, prompt renderer, and provenance compiler. |
| `test/runner/operation-prompt-templates.test.mjs` | **New test suite** | 22 comprehensive unit and integration tests for resolution, precedence, ambiguity, validation, rendering, provenance, and doctor checks. |
| `src/runner/dispatch/execution-contract.mjs` | Modification | Added `contractTemplate` to `ACCEPTED_CONTRACT_FIELDS` and schema validation. |
| `src/runner/dispatch/assignment.mjs` | Modification | Added `contractTemplate` to `buildDeclaredAssignment` and `buildInlineAssignment`; integrated template prompt rendering into `renderAssignmentPrompt`. |
| `src/runner/dispatch/assignment-runner.mjs` | Modification | Resolved template at dispatch time in `executeAssignment`, recorded `provenance.template` on `effectiveAssignment` and in `run.json` (`buildRunMeta`). |
| `src/runner/dispatch/effective-execution-contract.mjs` | Modification | Validated and preserved `provenance.template` on effective execution contracts. |
| `src/runner/coordination/session-engine.mjs` | Modification | Passed `contractTemplate` in `buildSessionContract` and resolved via `hasOperationPromptTemplate` in `dispatchDeclaredOperationLocked`. |
| `src/setup/registrations.mjs` | Modification | Registered `operation-prompt-templates-valid` doctor check. |
| `docs/specs/distribution.md` | Documentation | Added check #7 specification in Distribution Spec Data Dictionary. |
| `docs/architecture-manifest.json` | Manifest | Registered `src/runner/dispatch/operation-prompt-templates.mjs` as `infra` layer. |
| `test/setup/checks.test.mjs` | Test suite update | Added `operation-prompt-templates-valid` to expected doctor checks list. |
| `core/prompt-templates/master-loop-review-candidate.md` | **New template** | Plan-loop candidate review template. |
| `core/prompt-templates/rfc-review-lite-propose.md` | **New template** | RFC-Review-Lite proposal template. |
| `core/prompt-templates/rfc-review-lite-convene.md` | **New template** | RFC-Review-Lite convene template. |
| `core/prompt-templates/rfc-review-lite-object.md` | **New template** | RFC-Review-Lite objection template. |
| `core/prompt-templates/rfc-review-lite-respond.md` | **New template** | RFC-Review-Lite response template. |
| `core/prompt-templates/architecture-advisory-panel-v1-scout-report.md` | **New template** | AAP-v1 context investigation scout report template. |
| `core/coordination-protocols/standalone-master-coordination-loop.yaml` | Protocol definition | Declared `contractTemplate: master-loop-review-candidate` on `review-candidate`. |
| `CHANGELOG.md` | Changelog | Added Unit I04 feature note under `## [Unreleased]`. |
| `plans/260919-coordination-skill-harness-simplification/plan.md` | Track plan | Updated Unit I04 status to `implemented` with test accounting. |

---

## 4. Verification Evidence

### 4.1 Focused Test Suites

1. **`test/runner/operation-prompt-templates.test.mjs`** (dedicated suite):
   - `discoverOperationPromptTemplates discovers shipped core templates cleanly` -> **PASS**
   - `discoverOperationPromptTemplates is deterministic across repeated runs` -> **PASS**
   - `precedence: project tier overrides domain and core tiers` -> **PASS**
   - `precedence: domain tier overrides core tier when project is absent` -> **PASS**
   - `missing template throws template-not-found` -> **PASS**
   - `duplicate template in same directory with different extensions throws template-ambiguous` -> **PASS**
   - `colliding template IDs across different domains throws template-ambiguous` -> **PASS**
   - `path-escape symlink pointing outside scan root throws template-path-escape` -> **PASS**
   - `validateOperationPromptTemplate accepts all bounded variables` -> **PASS**
   - `validateOperationPromptTemplate rejects unknown or malicious variables` -> **PASS**
   - `renderOperationPromptTemplate substitutes bounded variables and strips internal stamps` -> **PASS**
   - `renderOperationPromptTemplate handles empty arrays with - (none)` -> **PASS**
   - `renderOperationPromptTemplate supports {artifactRefs} alias for {contextRefs}` -> **PASS**
   - `resolveAndRenderOperationPrompt produces rendered body and complete template provenance` -> **PASS**
   - `renderAssignmentPrompt uses contractTemplate when declared` -> **PASS**
   - `renderAssignmentPrompt preserves explicit legacy objective path when contractTemplate is omitted` -> **PASS**
   - `renderAssignmentPrompt fails loudly on missing template` -> **PASS**
   - `buildEffectiveExecutionContract attaches template provenance without secrets` -> **PASS**
   - `domain-neutral proof: 1 plan-loop + 2 advisory operations resolve via identical mechanism` -> **PASS**
   - `retry/replay attribution stability: snapshot and digests remain deterministic when disk template changes` -> **PASS**
   - `operation-prompt-templates-valid doctor check is registered and passes on repository` -> **PASS**
   - `operation-prompt-templates-valid doctor check fails when a malformed template is present` -> **PASS**
   - `I04-REV-01 regression: renderAssignmentPrompt renders from pinned snapshot when disk template changes or is deleted` -> **PASS**
   - `I04-REV-01 regression: executeAssignment retry uses pinned template snapshot when disk template changes or is deleted` -> **PASS**
   - `I04-REV-02 negative: resolver refuses corrupted contentDigest on pinned template with template-provenance-mismatch` -> **PASS**
   - `I04-REV-02 negative: resolver refuses malformed contentDigest or renderedPromptDigest on pinned template` -> **PASS**
   - `I04-REV-02 negative: resolver refuses corrupted or missing templateSnapshot on pinned provenance` -> **PASS**
   - `I04-REV-02 negative: resolver refuses corrupted renderedPromptDigest when prompt recomputed on retry does not match` -> **PASS**
   - `I04-REV-02 negative: resolver refuses templateId mismatch between contractTemplate and pinnedTemplate.id` -> **PASS**
   - `I04-REV-02 negative: validateEffectiveExecutionContract refuses corrupted or inconsistent template provenance` -> **PASS**
   - **Result:** **30 pass / 0 fail** (duration: 735ms)

2. **`test/runner/effective-execution-contract.test.mjs`**:
   - **Result:** **13 pass / 0 fail** (duration: 400ms)

3. **`test/runner/assignment-dispatch.test.mjs`** (baseline smoke suite):
   - **Result:** **75 pass / 0 fail** (duration: 17s)

3. **`test/runner/coordination-group-thinking-rfc-review-lite.test.mjs`**:
   - **Result:** **4 pass / 0 fail** (duration: 6s)

4. **`test/verbs/coordination-architecture-advisory-panel-conformance.test.mjs`**:
   - **Result:** **13 pass / 0 fail** (duration: 28s)

5. **`test/runner/coordination-declared-consult.test.mjs`**:
   - **Result:** **29 pass / 0 fail** (duration: 15s)

6. **`test/verbs/coordination-group-thinking-pack.test.mjs`**:
   - **Result:** **18 pass / 0 fail** (duration: 4.3s)

7. **`test/setup/checks.test.mjs`**:
   - **Result:** **112 pass / 0 fail** (duration: 19.8s)

8. **`test/setup/doctor-coordination-checks.test.mjs`**:
   - **Result:** **17 pass / 0 fail** (duration: 4.2s)

9. **`test/architecture.test.mjs`**:
   - **Result:** **3 pass / 0 fail** (duration: 450ms)

### 4.2 Whitespace and Formatting Checks
- `git diff --check` -> **Clean exit (code 0)**

### 4.3 Pre-existing Upstream Failures Classification
During full `npm test`, 3 test failures were observed in `test/verbs/merge/approve.test.mjs`:
- `approve (root-into-main merge): produces a diagnostic log record carrying mergedSha and mergedInto`
- `approve (--github): produces a diagnostic log record carrying mergedSha and mergedInto`
- `approve (failure path on lock-timeout): fires fault record carrying detail, mergedSha, and mergedInto`

**Proof of Pre-existing State on Exact Base SHA:**
Running `node --test test/verbs/merge/approve.test.mjs` directly in the base repository `/home/vantt/projects/forgentX` (at base SHA `15e4048503ca1ee02dae23263dee84b9c983386d`) produces the exact same failure:
```
✖ approve (root-into-main merge): produces a diagnostic log record carrying mergedSha and mergedInto
  fgos: os is not defined
✖ approve (--github): produces a diagnostic log record carrying mergedSha and mergedInto
  fgos: approve --github is explicitly forbidden (test suite bypass not allowed for trunk merges).
✖ approve (failure path on lock-timeout): fires fault record carrying detail, mergedSha, and mergedInto
  fgos: os is not defined
ℹ tests 4 | pass 1 | fail 3
```
Root cause: commit `7e682516eb32e3a40d5826324757bf3fdc9037b4` merged into `main` introduced `mergeRootIntoMainCas` calling `os.tmpdir()` without importing `node:os`. Unit I04 did not introduce or touch this code.

---

## 5. GitNexus Impact Analysis & Detect Changes Summary

### 5.1 Upstream Impact Analysis
- **`renderAssignmentPrompt`** (`src/runner/dispatch/assignment.mjs`):
  - Risk: **LOW** (direct callers: 0, affected processes: 0).
- **`executeAssignment`** (`src/runner/dispatch/assignment-runner.mjs`):
  - Risk: **HIGH** (direct callers: 4, depth-3 callers reach `createAndExecuteSessionTask`, `dispatchDeclaredOperationLocked`, `runOnce`).
- **`dispatchDeclaredOperationLocked`** (`src/runner/coordination/session-engine.mjs`):
  - Risk: **HIGH** (direct callers: 7, depth-2 callers reach session-engine and live proofs).

All HIGH risk findings were reported to the operator prior to file edits.

### 5.2 `detect-changes` Verification
Output of `node .gitnexus/run.cjs detect-changes` against base `main`:
- Changes: 10 files, 15 symbols
- All changed symbols strictly match the planned I04 scope:
  - `docs/specs/distribution.md`
  - `src/runner/coordination/session-engine.mjs` (`buildSessionContract`, `dispatchDeclaredOperationLocked`)
  - `src/runner/dispatch/assignment-runner.mjs` (`executeAssignment`)
  - `src/runner/dispatch/assignment.mjs` (`buildDeclaredAssignment`, `buildInlineAssignment`, `renderAssignmentPrompt`)
  - `src/runner/dispatch/effective-execution-contract.mjs` (`buildEffectiveExecutionContract`, `validateEffectiveExecutionContract`)
  - `src/runner/dispatch/execution-contract.mjs` (`validateExecutionContract`, `ACCEPTED_CONTRACT_FIELDS`, `ACCEPTED_CALLER_FIELDS`, `ACCEPTED_COORDINATION_CALLER_FIELDS`)
  - `src/setup/registrations.mjs`
  - `test/setup/checks.test.mjs`
  - Untracked new modules/templates: `core/prompt-templates/`, `src/runner/dispatch/operation-prompt-templates.mjs`, `test/runner/operation-prompt-templates.test.mjs`.

---

## 6. Handoff Notes for Independent Reviewer (Unit I05)

1. Review trust boundary in `src/runner/dispatch/operation-prompt-templates.mjs`:
   - Verify `validateOperationPromptTemplate` rejects all unknown placeholders.
   - Verify `assertContained` prevents directory traversal via symlinks or path manipulation.
   - Verify `formatConstraints` strips internal stamps like `protocol-operation:*`.
2. Review precedence in `loadOperationPromptTemplate` and `discoverOperationPromptTemplates`:
   - Project tier takes precedence over domain tier, domain takes precedence over core.
   - Cross-domain ID collision throws `template-ambiguous`.
3. Review provenance seams in `assignment-runner.mjs`:
   - Template provenance is captured in `effectiveAssignment.provenance.template`, passed to `buildRunMeta`, and stored in `run.json`.
4. Review migration guardrail in `session-engine.mjs`:
   - Existing definitions without a resolvable template on disk retain the explicit legacy-objective path.
5. All verification commands can be run independently using the documented test list above.

---

## 7. Reviewer Finding Resolution: I04-REV-01 (HIGH)

### 7.1 Finding Summary
- **Finding ID:** `I04-REV-01` (Severity: HIGH)
- **Reviewer Statement:** Phase 3 requires retry/replay attribution deterministic when template changes, and persisted Assignment/dispatch provenance must match the actually delivered prompt. The reviewer probe showed an assignment carrying a pinned `provenance.template.templateSnapshot` still rendered changed disk content after the template file was modified: `{"first":true,"secondUsesChanged":true,"secondUsesSnapshot":false}`.
- **Root Cause:**
  1. `executeAssignment` in `src/runner/dispatch/assignment-runner.mjs` was writing `assignment.json` *before* template resolution was invoked. Consequently, fresh `assignment.json` on disk omitted `provenance.template`.
  2. `resolveAndRenderOperationPrompt` in `src/runner/dispatch/operation-prompt-templates.mjs` always invoked `loadOperationPromptTemplate` from disk, ignoring any pre-existing `target.provenance?.template?.templateSnapshot`.
  3. `renderAssignmentPrompt` and `executeAssignment` re-resolved from disk during subsequent runs/retries rather than consuming the pinned snapshot.

### 7.2 Corrections Implemented
1. **Pinned Snapshot Consumption:**
   In `src/runner/dispatch/operation-prompt-templates.mjs`, `resolveAndRenderOperationPrompt` now inspects `target.provenance?.template ?? options.templateProvenance ?? options.pinnedTemplate`. If a pinned template with a non-empty `templateSnapshot` is present:
   - Validates that `pinnedTemplate.id` matches the requested `contractTemplate` (if specified).
   - Re-validates bounded variables directly against `templateSnapshot`.
   - Constructs `templateEntry` directly from `templateSnapshot` without touching disk (`source: 'pinned'`), preserving original `tier`, `filePath`, and `contentDigest`.
   - Renders the prompt body from the snapshot and computes `renderedPromptDigest`.
2. **Immutable Input Ordering in `assignment-runner.mjs`:**
   - In `executeAssignment`, on fresh assignment dispatch (`!fs.existsSync(assignmentJsonPath)`), template resolution is performed *prior* to writing `assignment.json`, guaranteeing that the immutable persisted `assignment.json` carries full template provenance including `templateSnapshot`.
   - If `assignment.json` already exists on disk (as in retries, second runs, or resumed runs), it is read as the immutable truth. Because it carries `provenance.template.templateSnapshot`, all subsequent resolution and prompt rendering derive strictly from the snapshot.
3. **Deterministic Retry/Replay Even When Template Is Modified or Deleted:**
   - Worker prompt, effective execution contract (`effective-execution-contract.json`), and run metadata all derive from the single immutable pinned snapshot.
   - If the template file on disk is modified or completely unlinked after the first run, retry and subsequent attempts continue to execute successfully, produce identical prompt text, and record identical digests.

### 7.3 Verification and Regression Tests
Two dedicated regression tests were added in `test/runner/operation-prompt-templates.test.mjs`:
1. `I04-REV-01 regression: renderAssignmentPrompt renders from pinned snapshot when disk template changes or is deleted`:
   Directly replicates the reviewer's probe. Asserts that after `provenance.template` is pinned, mutating the disk template file does *not* affect `renderAssignmentPrompt`, and deleting the disk file entirely does *not* throw and still renders the original snapshot.
2. `I04-REV-01 regression: executeAssignment retry uses pinned template snapshot when disk template changes or is deleted`:
   Executes a 3-run lifecycle for an assignment using `executeAssignment`:
   - Run 01: Initial execution; persists `assignment.json` with pinned snapshot and digests.
   - Run 02 (Retry): Template file on disk is modified; asserts execution uses pinned snapshot, and `runs/02/effective-execution-contract.json` records original content digest.
   - Run 03: Template file on disk is completely deleted (`fs.unlinkSync`); asserts execution still succeeds, uses pinned snapshot, and `runs/03/effective-execution-contract.json` records original content digest.
Both regression tests pass cleanly. Suite count updated to 24 pass / 0 fail.

---

## 8. Reviewer Finding Resolution: I04-REV-02 (HIGH)

### 8.1 Finding Summary
- **Finding ID:** `I04-REV-02` (Severity: HIGH)
- **Reviewer Statement:** Pinned provenance integrity was not verified. When consuming `templateSnapshot`, the resolver retained `pinnedTemplate.contentDigest` without checking it against the recomputed digest of the snapshot. An independent review probe passed a valid snapshot (`Objective: {objective}`) with a fake `contentDigest` (`sha256:0000...`), and the resolver returned the forged provenance. Additionally, `validateEffectiveExecutionContract` only validated that `provenance.template` was an object, omitting schema and digest consistency checks.
- **Root Cause:**
  1. In `src/runner/dispatch/operation-prompt-templates.mjs`, `templateEntry.contentDigest` fell back to `pinnedTemplate.contentDigest || computeSha256Digest(...)` without asserting equality with the actual computed SHA-256 digest of `templateSnapshot`.
  2. The resolver did not enforce schema formats (`id`, `tier`, `source`, `filePath`, SHA-256 digest format `^sha256:[0-9a-f]{64}$`) on pinned provenance objects.
  3. Stored `renderedPromptDigest` was never compared against the freshly recomputed rendered body digest upon retry/replay with immutable Assignment inputs.
  4. In `src/runner/dispatch/effective-execution-contract.mjs`, `validateEffectiveExecutionContract` lacked validation for template provenance fields and snapshot-to-digest consistency.

### 8.2 Corrections Implemented
1. **Recompute and Assert `templateSnapshot` Content Digest:**
   In `src/runner/dispatch/operation-prompt-templates.mjs`, `actualContentDigest = computeSha256Digest(pinnedTemplate.templateSnapshot)`. If `pinnedTemplate.contentDigest` is provided:
   - Validates that it matches `^sha256:[0-9a-f]{64}$`.
   - Recomputes the digest and throws typed refusal `TemplateResolutionError('template-provenance-mismatch')` if `pinnedTemplate.contentDigest !== actualContentDigest`. Does not silently fix or accept forged digests.
2. **Strict Schema & Format Validation for Pinned Provenance:**
   - Validates that `pinnedTemplate` is a non-null object.
   - Asserts `templateSnapshot` is a non-empty string.
   - Asserts `id` is a non-empty string and matches `contractTemplate` when declared (throws `template-provenance-mismatch` on mismatch).
   - Validates `tier` and `source` are non-empty strings when present.
   - Validates `filePath` is a string or null when present.
   - Validates `renderedPromptDigest` conforms to `^sha256:[0-9a-f]{64}$` when present.
3. **Compare Stored `renderedPromptDigest` on Retry/Replay:**
   - After rendering `renderedBody` using immutable inputs, computes `actualRenderedPromptDigest = computeSha256Digest(renderedBody)`.
   - If `pinnedTemplate.renderedPromptDigest` is present, it MUST strictly equal `actualRenderedPromptDigest`. Any tampering with stored prompt digest or inputs throws typed refusal `TemplateResolutionError('template-provenance-mismatch')`.
4. **Effective Execution Contract Validation:**
   In `src/runner/dispatch/effective-execution-contract.mjs`, `validateEffectiveExecutionContract` now verifies:
   - `provenance.template.id` is a non-empty string.
   - `contentDigest` and `renderedPromptDigest` match `^sha256:[0-9a-f]{64}$`.
   - If `templateSnapshot` is present, its recomputed SHA-256 digest MUST match `contentDigest`; throws `RunnerConfigError` on any mismatch.
   - `tier`, `source`, `filePath` match expected types.

### 8.3 Verification and Negative Tests
Six dedicated negative tests added in `test/runner/operation-prompt-templates.test.mjs`:
1. `I04-REV-02 negative: resolver refuses corrupted contentDigest on pinned template with template-provenance-mismatch` (exact review probe replication with `sha256:0000...`).
2. `I04-REV-02 negative: resolver refuses malformed contentDigest or renderedPromptDigest on pinned template`.
3. `I04-REV-02 negative: resolver refuses corrupted or missing templateSnapshot on pinned provenance`.
4. `I04-REV-02 negative: resolver refuses corrupted renderedPromptDigest when prompt recomputed on retry does not match`.
5. `I04-REV-02 negative: resolver refuses templateId mismatch between contractTemplate and pinnedTemplate.id`.
6. `I04-REV-02 negative: validateEffectiveExecutionContract refuses corrupted or inconsistent template provenance` (verifies digest mismatch, malformed digests, and missing id are rejected).

All 6 negative tests and all existing tests pass cleanly. Total `operation-prompt-templates.test.mjs` count: **30 pass / 0 fail**. Full focused matrix: **294 pass / 0 fail**.
