# Shared Fragment: Coding-Cell Policy

This coding-domain fragment defines the technical policy for executing any mutating coding cell — whether a standalone single-cell change (e.g. via `fgos-code-panel` direct mode or `fgos-code-change`) or one step within an implementation track. It is completely self-contained and makes no assumptions about multi-cell tracks, plans, or track status tables.

---

## 1. Isolated Worktree Discipline

Every mutating coding coordination cell must execute inside its own dedicated git worktree on its own dedicated branch:

1. **Main Checkout Protection:**
   The fgOS session engine strictly enforces Mutation Rule Condition 3 (`assertMutatingDispatchAllowed`): any mutating dispatch where `--cwd` resolves to the repository root / main checkout is hard-refused. Mutating operations cannot run in the main checkout.
2. **Worktree Lifecycle:**
   - **Worktree path:** `../<prefix>-<slug>` (outside the main checkout directory).
   - **Branch:** `<prefix>--<slug>` (isolated branch derived from the target base branch).
   - **Prerequisites:** Initialize dependencies (e.g. `npm ci` or equivalent) inside the worktree so that test commands execute reliably.
3. **Pre-Dispatch Verification:**
   Before executing any mutating command, the driver must verify:
   ```sh
   # Verify cwd is not the main checkout
   [ "$(git -C "$wt" rev-parse --show-toplevel)" != "$(git rev-parse --show-toplevel)" ]
   # Verify current branch is the designated cell branch
   [ "$(git -C "$wt" rev-parse --abbrev-ref HEAD)" = "$branch" ]
   # Verify working tree is clean
   git -C "$wt" status --porcelain
   ```
4. **Explicit CWD Passing:**
   Every mutating command (`fgos coordination operation`, `fgos coordination authorize-and-dispatch`) must explicitly pass `--cwd <worktree-path>`.

---

## 2. Proof Tiers

Every coding cell must declare and satisfy a definite proof tier:

| Proof Tier | Scope | When Required |
|---|---|---|
| **Tier 1: Focused** | Targeted test suites directly exercising the touched symbols, interfaces, and contracts. | Required for every mutating cell. Must run inside the cell worktree and exit 0. |
| **Tier 2: Affected** | Subsystem and integration tests covering the blast radius of callers, dependents, and contracts. | Required when changing shared utilities, exported APIs, or core dispatch/coordination interfaces. |
| **Tier 3: Full-Suite Gate** | The full repository test suite (`npm test`). | Required when touching platform foundation invariants, isolation-breaking paths, or when an independent review escalates a proof gap to full. |

---

## 3. Independent Verification of Doer Commit and Tests

The driver must never accept worker self-narration, conversational claims, or ungrounded status reports:

1. **Verify Real Commit:**
   Directly inspect the git history inside the worktree (`git -C "$wt" log -1 --stat`) to verify that the doer committed substantive changes.
2. **Verify Clean Tree:**
   Verify that `git -C "$wt" status --porcelain` is clean (all worker edits are committed).
3. **Execute Verification Directly:**
   The driver runs the cell's required focused test command directly in the worktree:
   - Must exit with code 0.
   - Output must confirm all declared test assertions passed.
4. **Caveat Rule:**
   If a reviewer or red-team operation returns a caveat (`sharedCwdCaveat` with `status: 'recheck-required'`, `verdict: 'non-attributable'`), it must **never** be accepted as sign-off evidence. Caveats block session close and require an uncaveated recheck.

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

1. **No Session Git Authority:**
   A coordination session possesses zero git merge authority. Merging into the base/target branch is strictly a driver action performed outside the coordination session.
2. **Close Before Merge:**
   The driver must never merge a cell branch into the target branch until `fgos coordination close` has succeeded and the session manifest reflects `status: "completed"`.
3. **Post-Close Cleanup:**
   After the merge commit is verified on the target branch, the cell worktree and its temporary branch may be removed.

---

## 5. Tested and Integrated Identity

Every merged coding cell produces two distinct commit identities that must be recorded:

- **`testedSha`:** The exact commit SHA in the cell worktree where all declared proof tier tests executed and passed.
- **`integratedSha`:** The resulting commit SHA on the target branch after integration (e.g. merge commit or rebased tip).

### Non-Inference Rule

If `testedSha !== integratedSha`, proof passed on the worktree cannot be inferred to hold on the target branch:
- The gate proof must be re-executed against `integratedSha` before certifying completion.
- **Tree-Identity Exception:**
  If and only if:
  1. `git diff <testedSha> <integratedSha> -- .` is completely empty (no tracked content changes), **and**
  2. The environment fingerprint is identical (runtime/toolchain versions, lockfile hash, built prerequisites unchanged),
  then the driver may record `treeIdentical: true` and certify completion from the pre-merge run.
  If the diff is non-empty or the environment fingerprint changed, a real re-run on `integratedSha` is mandatory.
