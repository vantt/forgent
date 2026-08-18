# tsk-3yh-take-deps-resolved-status — plan

Status: approved (see CONTEXT.md's Locked decisions — user pre-approved
run-to-done, 2026-08-02; this item blocks other work).

## Mode gate

Flags counted against the item (auth, authorization, data model,
audit/security, external systems, public contracts, cross-platform,
existing covered behavior, weak proof around the area, multi-domain):

- **existing covered behavior** — yes. `test/cli/take-pick-claim-eligibility.test.mjs`
  already tests this exact function's rejection/acceptance paths.
- Every other flag — no. No auth, no data model change, no external
  system, no cross-platform concern, single domain (`src/state`), and the
  bug is precisely diagnosed (not weak proof — the repro is real and
  named in CONTEXT.md).

**1 flag → mode: small** (a few files, no gray areas). Not tiny, because
the fix needs real test coverage added in both directions per the
ticket's own risk callout (CONTEXT.md), not just a one-line edit with no
proof.

## Approach

**Chosen path**: in `src/state/frontier.mjs`, change
`isDepsAndLineageReady`'s dep-readiness clause (line 114) from
`work[dep]?.status === 'done'` to `RESOLVED_STATUSES.has(work[dep]?.status)`
— the exact same set `frontier()` (line 93) already uses, imported from
the module's own export (line 172). Honors CONTEXT.md's Pinned terms
(reuse the existing export, never redefine).

**Alternatives rejected**:
- Defining a second, function-local resolved-status set — rejected,
  `RESOLVED_STATUSES` already exists in this exact file for this exact
  purpose; a second definition would reintroduce the same
  comment-says-one-thing-code-does-another drift this bug already is.
- Changing `RESOLVED_STATUSES` itself — out of scope; every other
  consumer (`graph-metrics.mjs`, `entropy.mjs`, `graph-harness.mjs`,
  `impact.mjs`, `claim-port.mjs`) already relies on its current
  membership and is unaffected by this bug.

**Impact analysis (GitNexus, capability posture: full —
`fgos tool query --capability impact-analysis --status present` returned
provider `gitnexus`, `status: present`)**: `impact({target:
"isDepsAndLineageReady", direction: "upstream", file_path:
"src/state/frontier.mjs"})` → risk **LOW**, exactly 1 upstream caller
(`src/state/store.mjs`'s `isDepsAndLineageReady(dir, id)` wrapper, the
only place that reaches this function), which itself has exactly 1 call
site in `bin/fgos.mjs:1594` (`take --id`'s explicit-id branch). No HIGH/
CRITICAL warning. Confirms CONTEXT.md's scout: the blast radius is real
but narrow — `take --id` claims are affected, `pick` is not
(`claim-port.mjs:159` already uses `RESOLVED_STATUSES` directly, a
separate code path).

**Files touched** (2, both already exist — no new files):
1. `src/state/frontier.mjs` — the 1-line fix (line 114).
2. `test/cli/take-pick-claim-eligibility.test.mjs` — add coverage; this
   file already owns exactly this behavior (see CONTEXT.md scout), so a
   new test file would duplicate ownership.

**Order**: no split, no multiple pieces to sequence — this is one
honest atomic fix, so `fgos graph --what-if` ordering does not apply
(that's for choosing among candidate pieces of a multi-piece shape).
Sequence within the single piece, per this repo's Iron Law
(failing-test-first, see recent precedent
`docs/history/tsk-480-approve-movework-friction-guard/iron-law-evidence.md`,
`docs/history/tsk-2j9-*` commits):
1. Add the new test case(s) to `take-pick-claim-eligibility.test.mjs`
   against the *current* (buggy) code and confirm they fail for the
   right reason (dep at `delivered` wrongly rejected).
2. Apply the 1-line fix in `frontier.mjs`.
3. Re-run the full file and confirm all cases (old + new) pass.
4. Capture the failing-then-passing evidence the same way `tsk-2j9`'s
   history does, per whatever `fgos-coding-implement` requires at that stage.

## Risk map

| Component | How risky | Proof point (carried to fgos-coding-validating) |
|---|---|---|
| `isDepsAndLineageReady` (`frontier.mjs:108-115`) | Medium (item's own `risk` field) — sole gate for `take --id` on every `todo` item, system-wide per CONTEXT.md's own risk callout | New test: dep at `status: 'delivered'` (and one other `RESOLVED_STATUSES` member, e.g. `wontfix`) → `take --id` on the dependent succeeds. |
| Regression on the existing negative-path guard | Low — must not accidentally let a genuinely unresolved dep through | Existing test already covers dep at `status: 'todo'` (unmet) → still rejects; re-run unchanged, must still pass after the fix. |
| Blast radius beyond `take --id` | Low — GitNexus confirms exactly 1 caller, 1 caller-of-that-caller | No new proof needed beyond the impact query above; re-confirm via `detect_changes()` before commit per this repo's Always-Do rule. |

## Cases to prove (small mode — direct, no phased sketch needed)

- Dep at `delivered` → dependent claimable via `take --id` (the bug's own repro shape).
- Dep at `wontfix` → dependent claimable (same `RESOLVED_STATUSES` membership, cheap extra confidence the fix isn't accidentally string-literal-special-cased to `'delivered'` alone).
- Dep at `todo`/`doing` (genuinely unresolved) → still rejected (regression guard, already covered by existing test — must keep passing).
- Item anchored by an open decomposed child → still rejected (already covered, untouched code path — must keep passing).

## Split decision

No split. One honest piece of work: a 1-line logic fix plus its test
coverage, in the same existing files. No child items created.

## Assumptions (pinned, none require a CONTEXT.md gap)

- The item's own `verify` field (currently the placeholder
  `"chưa xác định — P15 bổ sung"`) will be set by whoever runs
  `fgos-coding-implement` to something runnable against the touched test file,
  e.g. `node --test test/cli/take-pick-claim-eligibility.test.mjs` — not
  decided here since `fgos-coding-planning` doesn't own the item's verify field
  directly; `fgos-coding-implement`/`fgos-coding-validating` set it when the plan's
  proof points are turned into a real command.
