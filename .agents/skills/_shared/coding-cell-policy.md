# Shared Fragment: Coding-Cell Policy

This coding-domain fragment defines the technical policy for executing any mutating coding cell — whether a standalone single-cell change (e.g. via `fgos-code-panel` direct mode, or future `fgos-code-change` in Phase 6) or one step within an implementation track. It is completely self-contained and makes no assumptions about multi-cell tracks, plans, or multi-cell status tables.

---

## 1. Isolated Worktree Discipline

Every mutating coding coordination cell must execute inside its own dedicated git worktree on its own dedicated branch:

1. **Main Checkout Protection:**
   The fgOS session engine strictly forbids mutating execution in the main checkout: any mutating dispatch where `--cwd` resolves to the repository root is hard-refused.
2. **Canonical Lifecycle Procedure:**
   The exact shell procedure for opening, branch reuse without `-b`, `$base` recording, objective-text branch guards, and cleanup is defined in [`private-cell-worktree.md`](private-cell-worktree.md). Coding cells follow that procedure without variation:
   - Worktree path: `../<prefix>-<slug>` (outside the main checkout directory).
   - Branch: `<prefix>--<slug>` (isolated branch derived from target base branch).
   - Dependency initialization: Run dependencies install (e.g. `npm ci`) inside the worktree so test commands execute reliably.
3. **Pre-Dispatch Verification:**
   Before executing any mutating command, the driver must verify:
   - CWD is not the main checkout.
   - Current branch is the designated cell branch.
   - Working tree is clean (`git status --porcelain` empty).
4. **Explicit CWD Passing:**
   Every mutating command (`fgos coordination start`, `fgos coordination operation`, `fgos coordination authorize-and-dispatch`) must explicitly pass `--cwd <worktree-path>`.

---

## 2. Proof Tiers

Every coding cell must declare and satisfy a definite proof tier:

| Proof Tier | Scope | When Required |
|---|---|---|
| **Tier 1: Focused** | Targeted test suites directly exercising the touched symbols, interfaces, and contracts. | Required for every mutating cell. Must run inside the cell worktree and exit 0. |
| **Tier 2: Affected** | Subsystem and integration tests covering the blast radius of callers, dependents, and contracts. | Required when changing shared utilities, exported APIs, or core dispatch/coordination interfaces. |
| **Tier 3: Full-Suite Gate** | The full repository test suite (`npm test`). | Required when touching platform foundation invariants, isolation-breaking paths, or when independent review escalates a proof gap to full. |

### Test-Selection Block

Declare once per cell and inline the real command into every produce/revise/recheck objective (a dispatched worker sees only its own objective, never a driver's private notes):

```text
FOCUSED_TESTS: <command(s) for the changed module/symbol/behavior>
AFFECTED_TESTS: <command(s) covering the blast radius, or "same-as-focused">
FULL_TEST: <the project's whole test command>
DECISION: focused: <cmd>; affected: <cmd|same-as-focused>; full: <deferred-to-final-gate|triggered (<category>)|required (<reason>)>
```

**`FULL_TRIGGERS` (mechanical, fire regardless of the declared tier):** dispatch/self-host hooks; session/replay/schema core; shared invariants; migrations; test-harness foundations; package manifest/install/release-boundary scripts.

**Full suite runs once per `(tree, environment)` state, never mechanically per round.** Reuse a proof result under this key instead of re-running:

```text
proof key = (command, git rev-parse <ref>^{tree}, environment fingerprint)
```

Record the fingerprint (toolchain/lockfile/prerequisite versions) alongside the key -- two runs on an identical tree with no recorded fingerprint for either cannot be compared, so reuse is never claimed without one.

### Reviewer/Red-Team Inspect Proof by Default

Reviewer and red-team default to inspecting the recorded proof (command, tree hash, fingerprint), never re-running it, unless: the proof is stale (tree hash or fingerprint changed since it was recorded), the proof is insufficient (the declared tier does not exercise the changed contract), or a specific counterexample needs fresh output to demonstrate. An insufficient tier is a finding naming the gap -- reviewer/red-team judge sufficiency, they never self-escalate to a wider tier themselves.

### Known Engine Limit: Proof Tiers Are Lead Discipline, Not Schema-Enforced

The coordination session's request schema has no field for a proof tier, `FULL_TRIGGERS`, or an environment fingerprint, and `disposition`/`rationale` accepts any non-empty string regardless of what it claims (`schema.mjs`'s `REASON_MAX_LENGTH` bound is the only check). A driver who does not actually run `FULL_TEST`, or who mislabels a real regression as `environmental-precondition`, is not caught by anything the engine checks -- this section is entirely Lead discipline in prose, not an enforced gate.

---

## 3. Independent Verification of Doer Commit and Tests

The driver must never accept worker self-narration, conversational claims, or ungrounded status reports:

1. **Verify Real Commit:** Directly inspect git history in the worktree (`git -C "$wt" log -1 --stat`) to verify substantive changes were committed.
2. **Verify Clean Tree:** Verify `git -C "$wt" status --porcelain` is clean (all worker edits committed).
3. **Execute Verification Directly:** The driver runs the required focused test command directly in the worktree, asserting exit code 0 and all assertions passing.
4. **Caveat Rule:** Caveats reported by reviewer or red-team operations block session completion and require uncaveated re-execution per driver discipline Step 4.

---

## 4. Merge and Cleanup Only After Explicit Close

The sequence between coordination session completion and git branch integration is strictly ordered:

```text
quorum reached
  -> fgos coordination close
  -> verify session status: completed
  -> git merge --no-ff <cell-branch> (into target branch)
  -> git worktree remove <worktree-path>
```

1. **No Session Git Authority:** A coordination session possesses zero git merge authority. Merging into the base/target branch is strictly a driver action performed outside the coordination session.
2. **Close Before Merge:** The driver must never merge a cell branch into the target branch until `fgos coordination close` has succeeded and the session manifest reflects `status: "completed"`.
3. **Post-Close Cleanup:** After the merge commit is verified on the target branch, the cell worktree and temporary branch may be removed.

---

## 5. Tested and Integrated Identity

Every merged coding cell produces two distinct commit identities:

- **`testedSha`:** The exact commit SHA in the cell worktree where all declared proof tier tests executed and passed.
- **`integratedSha`:** The resulting commit SHA on the target branch after integration (merge commit or rebased tip).

### Non-Inference Rule

If `testedSha !== integratedSha`, proof passed on the worktree cannot be inferred to hold on the target branch. **Tree-Identity Exception:** If and only if `git diff <testedSha> <integratedSha> -- .` is completely empty (no tracked content changes) **and** the environment fingerprint (toolchain, lockfile, built prerequisites) is identical, the driver may record `treeIdentical: true` and certify completion from the pre-merge run. Otherwise: re-run `AFFECTED_TESTS` against `integratedSha` at minimum, escalating to `FULL_TEST` when a `FULL_TRIGGERS` category fired against the merged diff (`git diff <preMergeBase> <integratedSha>`, not just the cell's own diff -- a moved target branch can trigger it too).

### Post-Merge Verification (required before cleanup)

Record the outcome of the check above as an ordinary, tracked `--allow-empty` commit naming `testedSha`, `integratedSha`, and the result -- never a `git note` (`refs/notes/*` is outside the default commit graph and does not push/fetch by default, so it is not durable at the project level). Immediately before removing the worktree or branch, re-assert `HEAD` still equals that commit: another writer could have advanced the target branch in the meantime.
