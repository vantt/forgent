# Independent Re-Review Round 5 — Unit I12 (`1089eb347`)

```txt
Document type: Independent re-review (delta, read-only against candidate)
Previous: independent-re-review-260926-1240-unit-i12-remediation-round4-report.md (REQUEST CHANGES minor @ 6362cfda3)
Base: cfdaf4bc95d44a6132d03dfb635478b084e41b35 (main, unchanged)
Evaluated SHA (code = docs tip): 1089eb347455c10164ec03ffbcbf54ae35cd2097
Branch/worktree: dispatch-hardening-i12-boundary-simplification @ .claude/worktrees/dispatch-hardening-i12-boundary-simplification
Delta reviewed: 6362cfda3..1089eb347 (one commit), 7 files +114/-14, test and docs only
Verdict: APPROVE (for exact 1089eb347455c10164ec03ffbcbf54ae35cd2097)
```

## 1. Git and cleanliness

- HEAD was `1089eb347` before and after the review. The worktree was clean before, after every mutation, and at the end.
- There are no operation markers.
- `6362cfda3` is an ancestor of HEAD. `git diff --check` is clean.
- main is still at `cfdaf4bc9`, so there is no drift.
- **The `src/` tree is identical to `6362cfda3`.** Both trees hash to `29d4ef7f88f136d97ca69cb75c012a09594d7a5f`. The delta changes only `test/runner/dispatch-reconciliation-import-graph.test.mjs`, CHANGELOG, the two control-plane docs, `plan.md`, `phase-09` and the implementation report. Every round-4 code conclusion (behavior-preserving, R3-1 closed, N1/MD locked) carries over unchanged.

## 2. Round-4 findings

| Finding | Status | Evidence |
|---|---|---|
| F-R4-1 R2 lock was textual only | **Closed** | New Rules 2–4 parse static import/export clauses and forbid references in the 10 fully-decoupled modules. **ME is killed** (35/1). The allowlist is also exact: widening `plan.mjs` to import `resolveCapabilityIdentityDetails` (ME3) is killed (35/1). |
| F-R4-2 requirement text / overstated claims | **Closed** | The original `phase-09` lines for R2 (line 9) and R4 (line 11) are present verbatim at base, with the ratification notes appended. CHANGELOG, `plan.md`, both control-plane docs and the report now say "no Work lookup implementation in dispatch core; `plan.mjs`/`cli.mjs` consume via compatibility re-export". This matches the code. The Track Manager confirmed Option A in session. |
| LOW R2 attribution | **Closed** | The report now credits `33e5b6c04` (initial) and `6362cfda3` (Option A), plus the round-4 lock. |
| LOW layer wording | **Closed** | The docs now say "registered as infra". |

## 3. Mutation proof (this round, in place with byte restore)

| ID | Mutation | Result |
|---|---|---|
| ME | `settlement.mjs` imports `executorIdForWork` from `./resolve.mjs` | killed |
| ME3 | `plan.mjs` widens its allowlisted import with `resolveCapabilityIdentityDetails` | killed |
| ME2 | `plan.mjs` uses `import * as _r from './resolve.mjs'` and calls `_r.resolveCapabilityIdentityDetails` | survived |
| ME4 | `herdr-round.mjs` (a dispatch module outside the 13-module strict list) imports `executorIdForWork` | survived |
| ME5 | `transport.mjs` uses a dynamic `import('./resolve.mjs')` and a computed property name | survived |

Tests run: `dispatch-reconciliation-import-graph.test.mjs` and `architecture.test.mjs`. HEAD and status were verified clean after each mutation.

## 4. Verification

- Full suite `env -u CLAUDE_CODE_SESSION_ID npm test` on exact `1089eb347`: 7750 tests, **7677 pass / 0 fail**, 8 skipped, 65 todo, exit 0, 387 s. Run from the candidate worktree (log header records cwd plus HEAD `1089eb347`). Log: `/tmp/claude-1000/-home-vantt-projects-forgentX/0d771ef5-71af-4196-aba2-26944961b7a9/r5logs/full-suite.log`. An earlier attempt ran by mistake in the main checkout (HEAD `cfdaf4bc9`) after the session cwd changed; it was discarded and is not counted as evidence.
- I11 safety set: covered by the full suite. The delta touches no src, so coordination code is unchanged.
- GitNexus: degraded (the index tracks main). No src changed in this delta, so there is no new impact.

## 5. Findings

### LOW (regression-lock debt, non-blocking)
- **F-R5-1 — residual evasions of the static R2 lock.**
  - ME2: a namespace import in allowlisted `plan.mjs` bypasses Rule 3 (the `* as` clause yields no names) and Rule 4 (which exempts `plan.mjs`).
  - ME4: modules outside the 13-module strict list (`herdr-round.mjs` and others) are not covered. Some of them (`cli`, `assignment`, `assignment-runner`, `operation-choice`) already import stage graphs at base, so this scope limit is pre-existing and documented.
  - ME5: a dynamic import with a computed name is beyond reasonable static enforcement.
  - All three need deliberate evasion rather than an ordinary refactor. The realistic regression (a named import of a Work lookup into strict core) is locked.
  - Suggested follow-up: in Rule 3, also treat a `* as` import of `resolve.mjs`/`prepare.mjs`/`work-compat` from strict core as forbidden.
- F13 (rollback only in reverse order) and F14 (probe-cache trust) remain as accepted LOW debt.

No BLOCKER, HIGH or MEDIUM finding remains.

## 6. Verdict

**APPROVE**. All round-4 conditions are met. The code is behavior-preserving and byte-identical in `src/` to the round-4-reviewed tree. The full suite is green on the exact candidate. Only LOW regression-lock and accounting debt remains (F-R5-1, F13, F14).

Approval, if granted, is valid only for exact code/docs tip `1089eb347455c10164ec03ffbcbf54ae35cd2097`. It does not declare I12 integrated or VERIFIED and does not open I13.
