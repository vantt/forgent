# Review — rununit-settle (phase 03: brief + coverage)

Reviewer: independent (not the author). Scope: `git diff main...HEAD` (953585c80 brief + claim, 46e1d01af coverage), 4 src files, 4 test files, +229/-6.
Focused tests: `env -u CLAUDE_CODE_SESSION_ID node --test` on the four touched test files: 93 pass, 0 fail.

## Verdict

The code is correct for the paths it targets. The Work path does not regress: an assignment without `writes` gives `declaredWrites = null`, so coverage stays null and the policy's `writeScope` is still null. That is exactly what it was before; `inScope` only runs when `hasScope` is true. Both `attributeWorkspaceChanges` calls receive the scope, and both matchers now go through `matchesWriteScope`.

I found no High-severity defect. The findings below are about brief wording that a strict agent can read two ways (the exact failure class this phase exists to fix) and about weak test assertions.

## High

None.

## Medium

### M1. The mutating brief tells the worker to write only inside the scope, but its result files are outside the scope and no exception is stated
- `src/runner/dispatch/assignment.mjs:877-884` (Write scope block), and the `Result artifact:` block at ~:907-925.
- Scenario: scope is `docs/guide.md`. The brief says "Write only files inside this scope", then "Write structured JSON to <runDir|outbox>/agent-result.json". The read-only branch explicitly calls result files "the exception" (`:911`). The mutating branch does not. A literal-minded worker, the same kind as the tsk-5zim / `dca2e62da` actors, either refuses to write the claim (round scores `no-evidence`) or lists its own outbox path in `needsWrites`. `dca2e62da` fixed exactly this contradiction for read-only seats; this change brings it back for mutating ones.
- Fix: add one line to the Write scope block, e.g. "- Your result files (agent-result.json, agent-report.md) are outside the scope and still required; writing them is not an outside write." Add a test assertion next to the existing four line matches.

### M2. The brief claims the runner commits "only the files inside the scope", but the runner currently stages `add -A`
- `src/runner/dispatch/assignment.mjs:880-881` versus `src/runner/execution/commit-unit-work.mjs:48` (`git add -A -- . ':(exclude).fgos'`).
- Scenario: lane 03 merges first (merge order 03 → 02 → 04). Until phase 02 lands, any out-of-scope file the worker writes anyway gets committed. That makes the brief's "only the files inside the scope" false, and so is the empty-scope line "(none declared: the runner commits nothing)". In practice that line is unreachable, because a mutating unit implies non-empty `writes`.
- This is an ordering hazard, not a code bug. Phase 02 (`phase-02-scoped-runner-commit.md` §3-7) makes the sentence true.
- Fix: either merge 02 before any real mutating unit run uses this brief, or record the gap as a known residual in the lane report so G-M1 does not read the brief as already enforced.

### M3. Nothing in the brief ranks "do not commit" above an objective that says "commit"
- `src/runner/dispatch/assignment.mjs:872-884`. The block comes after `Objective:` (or after the rendered template body), and nothing says which instruction wins.
- Scenario: this is the probe-1 root cause from the phase context: the unit objective itself told the agent to commit. With this change the prompt says "commit" in the objective and "do not commit" in the scope block. The agent has to pick one, and if it picks the objective, the read-only gitdir blocks the claim again.
- Fix: phrase it as an override: "Do not run `git add` or `git commit`, even if the objective above asks you to: …". This is a one-line text change plus an assertion.

## Low

### L1. A malformed scope entry throws inside settlement after the agent has already run (reachable only through a corrupted `unit.json`)
- Throw site: `write-scope.mjs` `matchesWriteScope` → `canonicalizeWriteEntry`. Verified that `matchesWriteScope('docs/a.md', ['/abs'])` throws `WriteScopeError`.
- How it is reached: `settlement.mjs:713` passes `assignment.writes` raw. `run.mjs:365` builds it from `unitRecord.writeScope ?? unit.writes`.
  - A fresh run: `writeScope` comes from `expandGenerated` (`run.mjs:262`), which canonicalizes and throws before spawn. Safe.
  - A fresh run's `unit.writes`: validated by `unit.mjs:187-192`. Safe.
  - A resumed run: `unitRecord` is `JSON.parse`d from disk (`run.mjs:180`). `unit` is re-validated (`:181`) but `unitRecord.writeScope` is not, and it takes precedence. A hand-edited or corrupted `writeScope` throws from `settleRunOutcome`, which `assignment-runner.mjs:2702` does not wrap. The round ends with no `result.json` after the worker has finished. No in-repo writer produces a non-canonical `writeScope`, so this is not reachable through normal use.
- Fix (outside this lane's owned files, so a follow-up): run `canonicalizeWrites` on `unitRecord.writeScope` at resume in `run.mjs`, so the failure happens before spawn. Phase 02's commit reads the same field, so a single validation covers both.

### L2. `needsWrites` is described as "must be an array" but is never checked, and its consumer has to defend itself
- `agent-result-claim-contract.mjs:15-17`. Verified that `validateAgentResultClaimContract({..., needsWrites: 'not-an-array'})` returns `{valid:true}`, and the value reaches `runResult.agentClaim` unchanged.
- Leaving it unchecked is the intended design (additive, claim version unchanged). But phase 02 (`commitUnitWork({..., needsWrites})`) will receive whatever the worker wrote.
- Fix: phase 02 should keep only string entries (`Array.isArray(x) ? x.filter(s => typeof s === 'string') : []`). Note this in the phase-02 brief.

### L3. A read-only seat in a unit that declares writes gets `coverageMatched: true` on its stray writes
- `settlement.mjs:713` keys on `assignment.writes` alone. In `run.mjs:365`, a reviewer seat of a writing unit (reviewed pattern) carries the unit's `writes` with `mutation: 'read-only'`.
- Scenario: the reviewer edits `docs/a.md`. The policy still emits `read-only-mutation-correlated` (it takes precedence at `evidence-attribution.mjs:237`), so the outcome is right. But the evidence record says `coverageMatched: true`, which looks like "inside the declared scope" for a seat that had no scope.
- Fix: `const declaredWrites = !isReadOnly && Array.isArray(...) ...`. Add a test case with a read-only assignment that carries `writes`.

### L4. Test quality gaps
- `test/runner/assignment-runresult.test.mjs` ("needsWrites leaves a claim valid…"): `assert.notEqual(category, 'failed')` does not prove the claim is valid. A claim rejected as invalid can land in a non-`failed` category such as no-evidence or blocked. Assert the claim-validity field or the exact outcome instead.
- The same helper writes `fgos-scoped-writer-*.mjs` into `os.tmpdir()` and never removes it. That adds to the known `/tmp` inode leak. Write it under `tempDir`, or clean it up.
- The `assignment-runresult` tests drive settlement with a Work `buildAssignment` plus injected `writes`, not with a `provenance.kind: 'unit-run'` assignment. Settlement is provenance-agnostic, so this is acceptable, but no end-to-end test covers a unit-run assignment through `executeAssignment`.
- No test for a mutating seat whose role is not `producer` (e.g. a panel seat; `panel.mjs:97` makes seats mutating when `writes` is non-empty). The role-independence claim below is therefore untested.
- Missing assertion that a template-rendered prompt (the `renderedTemplateResult` branch) also gets the block. By code reading it does, because the block sits after the if/else.

## Questions examined and settled

- **Role independence (`unit-run` + `mutating` instead of `role === 'producer'`)**: correct, and better than the spec's wording. The runner commits on `!readOnly && outcome === 'pass'` for any role (`run.mjs:505`), so the brief's condition matches the commit condition exactly. Keying on role would leave mutating panel seats without the instruction. The deviation from phase-03 req 1 ("role `producer`") should be stated in the lane report's spec delta.
- **Can the brief contradict itself?** Between the two "Write scope" lines, no: the Effective-contract line names the declared writes and says the mount is wider. It falls back to the mount, or to "none (read-only)", only when `runnerCommits` is false or the mount is empty. Mount empty with `mutating` cannot happen (`effective-execution-contract.mjs:218`). The real contradictions are M1 and M3.
- **Matcher semantics change** from prefix to `matchesWriteScope`. The only narrowing is that `.fgos/**` never matches, and nothing previously passed a scope there. All existing evidence-attribution tests pass.
- **`proven` / `outside-write-scope` refusal**: unreachable from settlement, because no `adapterAttestation` is passed to either call. Coverage only changes a field plus the warning set, which matches the rollback note.
- **Requirement 4 (`assignment-runner.mjs`)**: correctly left untouched. `assignment.writes` reaches `settleRunOutcome` via `effectiveAssignment`.

## Plan follow-ups (for Lead, not applied)

- Requirements 1-3: implemented. Steps 1-3 tests are green. `npm test` results are pending from the run in progress.
- Before merge: M1 and M3 are cheap text fixes in owned files. Decide whether M2 is accepted as a merge-order residual.
- Follow-up items: L1 (validate on resume in `run.mjs`), L2 (into the phase-02 brief).
- The spec delta should mention the role-independent keying.

Status: DONE_WITH_CONCERNS
Summary: Settlement and coverage wiring is correct and the Work path is unchanged; the mutating brief still has two self-contradictions a strict agent can trip on (result files sit outside the "write only inside scope" rule; nothing says "do not commit" beats an objective that says commit). Separately, the brief promises scoped commits that only exist once phase 02 lands.
