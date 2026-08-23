# live-events-seq-corruption — plan

Status: shaped, pending approval
Item: tsk-n4i
CONTEXT.md: docs/history/live-events-seq-corruption/CONTEXT.md (D1-D4)

## Mode

**high-risk.** Flags counted:

- data model/integrity — mutates the append-only event log's `seq` field on
  historical rows (D4).
- audit/security — the event log IS the audit ledger (RUL11); rewriting it,
  even under ADR-0019's exemption, touches that invariant directly.
- public contracts — `bin/fgos.mjs` echoes `event.seq` in multiple verbs'
  JSON output (`fgos.v1` contract), and at least one code comment
  (`src/state/replay.mjs:263`, "tsk-63c D1/seq 1190") cites a specific
  historical seq value as an anchor; renumbering shifts every seq from line
  273 onward.
- existing covered behavior — `test/state/events.test.mjs` and the two
  migrate scripts' own test coverage exercise this log's shape; must stay
  green.
- weak proof — no existing regression test proves seq corruption can't
  reach the live store again; this item's own D3 scope exists because that
  gap already bit twice.
- multi-domain — the repair (D4) is state-layer JS; the recurrence guard
  (D3) is git tooling/process, a different domain.

6 flags, including two hard-gate ones (audit/security, existing covered
behavior) — high-risk is the honest size; standard would understate the
audit-integrity and cross-cutting-comment risk.

`fgos graph --json` shows tsk-n4i has no deps and sits in its own
component (isolated) — no `criticalPath`/`topUnblock` signal changes
based on how this splits, so the split decision below rests on shape, not
graph leverage.

## Approach

Two genuinely different-shaped pieces, split per D3: a bounded mechanical
repair (piece A) and an open-ended prevention design (piece B). Neither
blocks the other — no ordering dependency, but A should land first since
it deals with a known, already-diagnosed instance and B's design benefits
from A's own verify tooling existing as a working reference.

### Piece A — repair the historical data (honors D1, D2, D4)

Renumber `.fgos/events.jsonl` from line 273 through EOF so `seq` stays
contiguous, lines 1-272 untouched. In-place overwrite per ADR-0019 — no
compensating event.

Risk map:

| Component | Risk | Proof point (for fgos-coding-validating) |
|---|---|---|
| Renumber correctness | medium — must not touch any field but `seq`, must not perturb lines 1-272 | diff the file before/after; assert every non-`seq` byte on line 273+ is unchanged, and lines 1-272 are byte-identical |
| Downstream comment drift | low-medium — `replay.mjs:263`'s "seq 1190" anchor may now point at the wrong line | grep the repo for other hardcoded seq references before executing; update or annotate any found |
| Test suite regression | medium — `events.test.mjs` and migrate-script tests read this log | full `npm test` green after the rewrite |

### Piece B — recurrence guard (honors D3)

Options considered:

1. **Custom git merge driver** for `.fgos/events.jsonl` (`.gitattributes` +
   a merge script that reconciles diverging appends and renumbers `seq`).
   Rejected: correctly 3-way-merging an ordered append log is itself a
   nontrivial, error-prone piece of new logic — the kind of complexity
   this item exists to clean up, not add. Also unproven at the actual
   conflict frequency (2 conflicts observed, both same session).
2. **Documented manual procedure only** (a how-to for resolving an
   events.jsonl conflict correctly). Rejected alone: relies purely on a
   person or agent remembering to follow it under merge-conflict pressure
   — exactly the condition that produced two different ad hoc resolutions
   already.
3. **Fast-fail contiguity check + documented procedure** (chosen): a small
   script (reusing the same contiguity logic the two migrate scripts
   already duplicate) run as part of `npm test` or a pre-commit/CI step,
   that fails loudly the moment `.fgos/events.jsonl` loses contiguity —
   whatever caused it. Paired with a short `docs/how-to/` procedure the
   failure message points to, describing how to renumber correctly (same
   technique as piece A). Chosen because it catches the failure mode
   immediately next time instead of letting it sit silently for days (as
   happened here — corruption from 2026-07-28 wasn't found until tsk-66l's
   dry run days later), without building new merge-time automation whose
   own correctness would need proving.

Risk map:

| Component | Risk | Proof point |
|---|---|---|
| Check placement (test vs pre-commit vs CI) | low — mechanical choice | confirm the check runs in whichever hook/suite is chosen, on a deliberately-broken fixture, and fails |
| False positives on legitimate history | low | run the check against the now-repaired live store and `dogfood-fixture`'s store; both must pass clean |

## Split

Two child items, both `parent: tsk-n4i`:

1. **"Renumber corrupted seq in live .fgos/events.jsonl (tsk-n4i piece A)"**
   Verify:
   ```
   node -e "
   const fs=require('fs');
   const lines=fs.readFileSync('.fgos/events.jsonl','utf8').split('\n').filter(Boolean);
   let prev=null;
   for (const l of lines) {
     const o = JSON.parse(l);
     if (prev !== null && o.seq !== prev + 1) { console.error('BREAK at seq', o.seq, 'after', prev); process.exit(1); }
     prev = o.seq;
   }
   console.log('contiguous:', lines.length, 'lines');
   " && node scripts/migrate-status-proposed-to-awaiting-approval.mjs --log .fgos/events.jsonl --backup /tmp/eb.json --dry-run && node scripts/migrate-actor-to-role.mjs --log .fgos/events.jsonl --backup /tmp/ea.json --dry-run && npm test
   ```

2. **"Add fast-fail seq-contiguity check + resolution how-to for events.jsonl (tsk-n4i piece B)"**
   Verify:
   ```
   npm test
   ```
   (the new check must itself be part of what `npm test` runs, and must
   fail on a deliberately-broken fixture as part of its own test coverage
   — piece B's own executing stage proves this, not a separate manual step)

## Handoff

Plan shaped. Next: `fgos-coding-validating` reality-checks this plan (both pieces'
risk maps and verify commands) before the `decompose` → `executing` edge is
picked, per D3/D4 scope locked in CONTEXT.md.

## Validation (fgos-coding-validating, READY WITH CONSTRAINTS)

Reality gate: mode fit PASS, repo fit PASS (all cited files/lines/flags
confirmed by direct read), smaller path PASS (D4 already locked by explicit
user confirmation). Baseline evidence gathered for real: both migrate
scripts' `--dry-run` against the live `.fgos/events.jsonl` currently throw
`seq gap at line 273 -- expected 273, got 272`; full `npm test` baseline is
green (1706 pass / 0 fail / 5 skipped, 92.5s).

Two constraints attached before executing either piece:

1. **Piece A must update/annotate every stale seq citation, not only
   `replay.mjs:263`.** A repo-wide grep (`seq [0-9]{3,}`-style patterns
   across `src`, `bin`, `scripts`, `docs`) found 6 more hits beyond the one
   named in this plan's Approach section: `src/state/store.mjs:628`;
   `docs/history/decision-schema-rationale-alternatives-source/CONTEXT.md:29,72`
   and `plan.md:48,49,54` (all citing "seq 1190" for the decision at
   `.fgos/events.jsonl:1206` -- after the renumber that line's seq becomes
   1206, matching its line number, so the "(seq 1190)" parenthetical goes
   stale); `docs/decisions/0022-fgos-choke-point-survey.md:59` ("seq 502");
   `docs/how-to/clear-a-stuck-main-checkout-lock.md:98` ("seq 647"); and
   `docs/history/status-proposed-rename/plan.md:94`, which already
   documents this exact bug ("272 VÀ 273 cùng mang `seq: 272`") from a
   prior investigation. Also write a backup copy of `.fgos/events.jsonl`
   before the in-place overwrite, mirroring the existing migrate scripts'
   own `--backup` convention, even though ADR-0019 does not require a
   compensating event.
2. **Piece B's verify command is under-specified as bare `npm test`** --
   that command already passes today with no contiguity check present, so
   it would pass trivially even if piece B built nothing. Read piece B's
   verify as: a new test file (picked up automatically by the
   `test/**/*.test.mjs` glob) that asserts the new check FAILs on a
   deliberately-corrupted fixture and PASSes on a clean one; `npm test`
   green is necessary but not sufficient proof on its own.

User approved proceeding with these constraints attached (not folded back
through a second `fgos-coding-planning` pass, since neither changes the chosen
mode, approach, or split -- both only sharpen proof-surface detail within
what was already approved).

## Correction during executing: one-door-write (ADR0020)

Piece A's first execution pass committed the renumbered `.fgos/events.jsonl`
onto `fgw/tsk-n4i-1` itself. `fgos merge next` correctly rejected that merge
(`fgos-write-rejected`, `src/runner/merge.mjs`'s staged-diff guard) -- a
worker branch must never carry a change under `.fgos/`; the store's one
write door is the `fgos` CLI run directly against the main checkout
(`0005`), never a worker's own commit. `createWorktree` already strips
`.fgos/` from every worker worktree for the same reason.

Corrected split, still one item (tsk-n4i-1), two separate actions:

- **Branch-committed** (goes through the normal `fgw/tsk-n4i-1` → merge
  path): the source/doc changes -- `replay.mjs`, `store.mjs`, and every doc
  citation the renumber shifts. Verify narrowed to `npm test` accordingly --
  a branch-context verify can never see the live `.fgos/events.jsonl` (per
  ADR0020, and confirmed empirically: `fgos return`'s own re-verify for a
  branch-source item runs in a disposable *detached* worktree checked out
  at the branch's commit, which never carries `.fgos/` either), so a verify
  command that checks it can never pass through this path regardless of
  whether the fix is correct.
- **Applied directly to the main checkout, out of band**: the actual
  `.fgos/events.jsonl` renumber, run once as an operator action against
  `repoRoot` (mirroring how `fgos repair` already handles the truncated-
  line corruption case) -- never staged, never committed on any branch.
  Proof for this half lives in this session's own direct verification
  (contiguity check + both migrate scripts' `--dry-run` + `npm test`, all
  run against the real live file), not in the automated `return`/merge
  machinery, since that machinery structurally cannot observe `.fgos/`
  content on a branch by design.

This is a shaping gap from the original plan, not a re-litigation of D4 --
D4's "in-place overwrite, live store only" still holds; only the
*mechanism* for landing it (direct operator action, not a branch commit)
was missing from the original approach.

## Closed

Both children done: `tsk-n4i-1` (repair -- merged, compound-learn tagged
`how-to`/`docs/how-to/fix-fgos-write-rejected-merge-block.md`, and the
live `.fgos/events.jsonl` renumber applied directly to the main checkout,
confirmed contiguous 1..1542 with both migrate scripts' `--dry-run`
succeeding) and `tsk-n4i-2` (prevention -- merged, compound-learn tagged
`how-to`/`docs/how-to/resolve-an-events-jsonl-merge-conflict.md`, the new
`scripts/check-events-seq-contiguity.mjs` wired into `npm test`). Rollup:
`doneCount: 2, totalCount: 2`. This root item carries no further work of
its own.
