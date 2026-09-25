# Phase 01 Verification

```txt
Phase: 01 — Contain further divergence
Assignment: asgn_pi_lead_phase01_repro_fix_op_001
Role: doer
Persona: minimal-reproducibility-fixer
Verification date: 2026-09-26
Base: 38a337ecb31dc97b78aca012eba0da89c003a927 (tag peel: documentation-authority-phase-00-20260925; annotated tag object cdbae3b9ebcf2b54c9ed726576fe0374e8cdcc77)
Review unit: BASE..FIXED_END (caller-supplied immutable commit SHA; tagging forbidden until review passes; recorded in handoff result)
Status: pending independent re-review
Result: PASS for Phase 01 review findings; Phases 02–09 remain unauthorized
```

## 1. Authoritative Worktree-Isolated Verification Protocol

All authoritative verification checks MUST run inside a temporary detached clean worktree created from the required `FIXED_END` commit SHA (or consume committed blobs directly). Verification never silently runs against caller checkout or uncommitted files.

### Verification Invocation

The verified and checked-in runner executes all checks inside a temporary detached clean worktree and cleans up reliably:

```bash
node scripts/verify-phase-01.mjs --base 38a337ecb31dc97b78aca012eba0da89c003a927 --fixed-end <FIXED_END>
```

Alternatively, supply environment variables:
```bash
BASE=38a337ecb31dc97b78aca012eba0da89c003a927 FIXED_END=<FIXED_END> node scripts/verify-phase-01.mjs
```

### Invariants Enforced by `verify-phase-01.mjs`:
1. **Preconditions**: `BASE` and `FIXED_END` must be non-empty and resolve to valid commits via `git cat-file -e "${commit}^{commit}"`.
2. **Worktree Isolation**: Creates a detached clean worktree at a temporary directory via `git worktree add --detach <tempDir> <FIXED_END>`.
3. **Commit Assertion**: Asserts `git rev-parse HEAD` inside the worktree strictly equals the resolved `FIXED_END` SHA.
4. **Cleanliness Assertion**: Asserts `git status --porcelain` is completely empty upon checkout.
5. **Dependency Provisioning**: Runs `npm install` inside the worktree so declared package dependencies (such as `yaml`) are present for tests.
6. **Explicit Commit Authority for Shipped Inventory**: Inventory generation inside the worktree explicitly uses `--commit <FIXED_END>`, guaranteeing derivation solely from the immutable git tree.
7. **Reliable Cleanup**: A `finally` block removes the worktree (`git worktree remove --force`) and directory under all exit paths.

## 2. Focused Ratchet and Shipped Inventory Tests (FOCUSED_TESTS)

Command executed inside clean worktree:
```bash
node --test test/scripts/check-legacy-docs-ratchet.test.mjs test/scripts/generate-shipped-path-inventory.test.mjs
```

Outcome: exit 0; 38 tests, 38 pass, 0 fail.
- `check-legacy-docs-ratchet.test.mjs`: 28/28 passed (deterministic generation, class/scope classification, unreviewed new file refusal, accounted edit acceptance, unaccounted edit refusal, unexpected deletion refusal, malformed baseline validation, malformed exceptions validation, canonicalizeExceptionPath, lexical duplicate rejection across `./` and repeated-slash forms, traversal/absolute rejection [R2], dotfile refusal, non-regular entry refusal [R4], symlink identity enforcement, symlink target change refusal, tree escape refusal, generated spec projection classification, policy-aware classification permitting new and edited generated projections and history-evidence while strictly blocking maintained prose, file-class-mismatch prevention against spoofing, distinct error messaging, expired exception rejection against today, unused exception rejection when file does not exist, root-aware and case-safe blocking of `.txt`/`.yml`/`.MD` under `docs/specs` [F1], exact case-sensitive generated-projection matching [F1 residual], calendar date validation rejecting impossible dates and explicit expiry boundary testing [F4], CLI execution, live self-check).
- `generate-shipped-path-inventory.test.mjs`: 10/10 passed (contract scope classification with mixed contract modeling, core/ path extraction and wrapped-path non-truncation, fenced prose and multiline command handling without glued fake tokens [R1], table-driven path grammar / negative glued tokens / positive counterexamples [R1 residual], deterministic inventory generation with zero unclassified paths and exact/generalized negative checks for `src/foo.mjscapability`, `src/runner/dispatch.mjsexecute`, and `GLUED_TOKEN_REGEX`, deterministic classification of referenceKind, existenceStatus, sourceRole, resolutionStatus, and isSafeRewriteTarget distinguishing literal targets from illustrative examples/patterns/tests/generated-mirrors/stale paths, detection of nonexistent examples such as `scripts/distill.mjs`, `src/auth.mjs`, `src/foo.mjs`, `src/runner/retry.mjs`, and `test/parser.test.mjs` as non-targets, classification of the six untracked `.claude` GitNexus paths as nonexistent/example-not-target, environmental contamination immunity against untracked files on disk, fail-closed refusal on absent or non-commit inputs, explicit non-authority/non-safe-rewrite classification of `docs/specs/platform-foundations.md` [F3], CLI output).

## 3. Live Ratchet Self-Check and Regeneration Comparison

Commands executed inside clean worktree:
```bash
node scripts/check-legacy-docs-ratchet.mjs
```
Outcome: exit 0 (`check-legacy-docs-ratchet: clean (994 legacy files checked; 1 accounted edit(s), 0 accounted new file(s))`).

Regeneration determinism check:
```bash
node scripts/check-legacy-docs-ratchet.mjs --write-baseline --baseline /tmp/base1.json
node scripts/check-legacy-docs-ratchet.mjs --write-baseline --baseline /tmp/base2.json
cmp /tmp/base1.json /tmp/base2.json

node scripts/generate-shipped-path-inventory.mjs --commit "$FIXED_END" --json-out /tmp/inv1.json --md-out /tmp/inv1.md
node scripts/generate-shipped-path-inventory.mjs --commit "$FIXED_END" --json-out /tmp/inv2.json --md-out /tmp/inv2.md
cmp /tmp/inv1.json /tmp/inv2.json
cmp /tmp/inv1.md /tmp/inv2.md
cmp /tmp/inv1.json plans/260925-documentation-authority-unification/shipped-path-conventions-inventory.json
cmp /tmp/inv1.md plans/260925-documentation-authority-unification/shipped-path-conventions-inventory.md
```
Outcome: exit 0; byte-for-byte identical output for the baseline and both inventory artifacts. Newly generated JSON and Markdown inventory artifacts match their committed counterparts byte-identically.

## 4. Documentation, Citation, and Ownership Checks (AFFECTED_TESTS)

Commands executed inside clean worktree:
```bash
node --test test/docs/*.test.mjs test/scripts/check-decision-citation-drift.test.mjs
node scripts/test-ownership-lint.mjs
```

Outcome:
- `test/docs/*.test.mjs`: 11/11 passed.
- `test/scripts/check-decision-citation-drift.test.mjs`: 31/31 passed.
- Combined docs/citation test suite: 42/42 passed.
- `test-ownership-lint`: passed cleanly (exit 0).

## 5. Changed-Markdown Relative Link Verification

Verified across range `BASE..FIXED_END` inspecting committed blobs (`git show FIXED_END:path`) and tree (`git ls-tree -r --name-only FIXED_END`):
All changed Markdown blobs checked; all relative link targets exist in `FIXED_END`'s git tree.

## 6. Historical Knowledge-Registry Plan Byte-Identity Check

Executed inside clean worktree against all 13 historical plan files:
```bash
sha256sum -c <<'EOF'
55911a8ff77da199b47c9c9453888832448794a3cb88c8484468598e32ffae83  plans/260825-1841-knowledge-registry/plan.md
f375d8a9d7608dd09d1cceb48e0b1c66c52b8677aedeaf98b9be45d258240f0a  plans/260825-1841-knowledge-registry/phase-01-registry-domain-model.md
9ff04f56d309fda44ccccc55656914897b9080b8b731932cc1c72492e51b4fca  plans/260825-1841-knowledge-registry/phase-02-resolver-alias.md
0e31b46314cbb6cc17ea537e180d582112019fd6cc4baee1f62b1bb355bf906d  plans/260825-1841-knowledge-registry/phase-03-classifier-inventory.md
e86185117f678b3e97fb67ccd4ff58187cc261f576aee3ee6b909dfc35efabe6  plans/260825-1841-knowledge-registry/phase-04-bootstrap-registry.md
1f381e129d30a3429eba6c34de483c4eaa7c229746bd8c9d8298e9273030093b  plans/260825-1841-knowledge-registry/phase-05-registry-verbs.md
b457fe0ef3d5d3b8602ffc7e04413da92fb4d1cf10cd0f9b1308bd20684a79a0  plans/260825-1841-knowledge-registry/phase-06-attest-gate.md
6ddcf3f8ee364e3da5d7c0f90815152b26cca905c5c2f15cb978cae7dad626ae  plans/260825-1841-knowledge-registry/phase-07-consumers-resolver.md
bee1e02cd6181ac7fdd2360e5d0b323b312428dede03cca799dcf9707fde8c7d  plans/260825-1841-knowledge-registry/phase-08-projections-doctor.md
c3efd7511ec59c55d48dac188d42d0397d3f9eea66bcdc2f8b966b4464c3d4c6  plans/260825-1841-knowledge-registry/phase-09-writer-skill.md
9c25b20d750bc0cb3d02fd4c606fe9d605ce16cbff04ec8eba7968f9802fffef  plans/260825-1841-knowledge-registry/phase-10-writer-canary.md
7cb5bcef217ba2184f7c1c4e25974d8699d14ff2f8a9ba923c344cf9a4bfdc8b  plans/260825-1841-knowledge-registry/phase-11-migration.md
bd5e832946acb415f96eb4fcdfde1f5c06810dd435a0f4cf292bb208c793057b  plans/260825-1841-knowledge-registry/phase-12-deprecate-compound.md
EOF
```
Outcome: all 13 files match with OK; exit code 0.

## 7. Git Diff Cleanliness and Scope Boundary

Executed inside clean worktree:
```bash
git diff --check "$BASE..$FIXED_END"
```
Outcome: exit 0; no whitespace errors or merge conflicts across committed range `$BASE..$FIXED_END`.

Forbidden action checks:
- No files deleted or moved under `docs/specs/**` or `docs/architect/**`.
- No evidence payloads moved.
- No files added to `docs/platform/**` claiming universal canonical authority.
- No touches to Phase 02–09 deliverables.

GitNexus Code Intelligence checks:
- `gitnexus impact`: executed on modified symbols (`scanSurfaceFiles`, `extractPathReferences`, `classifyPathAttributes`, `generateInventory`, `runCli`). All analyzed symbols reported LOW risk, 0 affected processes.
- `gitnexus detect-changes`: executed before commits.

## 8. Full Suite (FULL_TEST)

Executed inside the isolated clean detached worktree:
```bash
npm test
```

Full suite receipt is executed and recorded for the parent tested commit, with exact totals and log digest captured in the empty boundary commit message.

## 9. Reproducible Boundary Protocol and Review Status

Because a commit cannot self-name while containing its own evidence, Phase 01 establishes a reproducible boundary:
1. All implementation and evidence fixes are committed in a normal parent commit (`P`).
2. Every focused, affected, and full suite check runs inside a clean detached worktree created from `P`.
3. An empty boundary commit is created on top of `P` (`git commit --allow-empty`), recording the execution receipt in its commit message.
4. The empty boundary commit has a byte-identical git tree hash to `P` (`git rev-parse HEAD^{tree}` == `git rev-parse HEAD~1^{tree}`).

- Base: `38a337ecb31dc97b78aca012eba0da89c003a927` (tag: `documentation-authority-phase-00-20260925`; annotated tag object `cdbae3b9ebcf2b54c9ed726576fe0374e8cdcc77`)
- Review range: `BASE..FIXED_END` where `BASE` is pinned to `38a337ecb31dc97b78aca012eba0da89c003a927` and `FIXED_END` is the caller/reviewer-supplied immutable commit SHA on `documentation-authority-unification--phase-01-repro-fix`.
- Reviewer invocation: The independent reviewer invokes verification with `node scripts/verify-phase-01.mjs --base 38a337ecb31dc97b78aca012eba0da89c003a927 --fixed-end <FIXED_END>`.
- Tagging status: Tagging is strictly forbidden until independent review passes. No git tag is created.
- Phase 01 status: `pending independent re-review` (no tag, no Phase 02).
- Residual blockers: Phases 02–09 remain unauthorized and require separate human authorization before commencement.
