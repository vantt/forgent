# plan.md — tsk-5mh: run the real knowledge-registry migration apply

Mode: high-risk

**Flag count/which applied (fgos-routing Mode gate, no lane handed off by an
Orient this session — derived directly per the direct-entry fallback):**
data-model migration on a live corpus (bulk `doc.path-move` events across
332 documents), existing covered behavior (doc-sources/docs-index resolver
already has real test coverage this item's own real-corpus run exercises
for the first time), weak proof around the area (resolver mechanism only
ever proven against a synthetic fixture until this run), and a hard-gate
flag — irreversible-if-mishandled bulk rewrite of 330+ live files counts as
a data-loss-shaped risk even though the script has its own rollback. Any
one of those alone would be `standard`; the hard-gate flag alone forces
`high-risk`, consistent with the item's own `risk: heavy` classification
(discovery Round 3, `RESEARCH.md`).

## Context

No `CONTEXT.md` exists for this item — discovery's own Round 3 verdict was
`clear`, which skips `exploring` (and therefore never creates one). The
locked decisions this plan honors instead come from:

- `docs/history/compound-learn-artifact-registry/DISCUSSION.md`
  — D-tsk28x-5 (new flat layout), D-tsk28x-9 (alias before move), D-tsk28x-11
  (conservation is a mandatory guard), §11.2 "Correct Implementation Order"
  steps 9-10.
- `plans/260825-1841-knowledge-registry/phase-11-migration.md` — the
  original phase-11 spec for this exact operation (dry-run → conservation
  gate → apply → rebuild index → duplicate/lineage harness), written when
  `scripts/knowledge-migration.mjs` itself was built (tsk-28x-11,
  hardened further at tsk-3uc). This item is that spec's own **apply** half
  — the script exists and is tested; the real corpus was never moved.
- `docs/history/compound-learn-artifact-registry/RESEARCH.md`, Round 3
  (2026-08-27) — live preconditions confirmed: `docRegistry.enforce: true`,
  dry-run against the real corpus is clean (`moveCount: 332`,
  `conservationErrors: []`), and the B3 resolver subset (doc-sources/
  docs-index alias-awareness) is already built (`src/state/
  knowledge-registry.mjs:772-789`'s `doc.path-move` reducer pushes
  `currentPath` into `aliases` before overwriting it).

## Approach

**Chosen path:** run `scripts/knowledge-migration.mjs` exactly as designed
— dry-run first (already done in discovery, re-run once more immediately
before apply to catch any drift), a person reviews that report, then
`--apply`, then a targeted post-apply resolver check against the real
corpus (the item's own B3 acceptance-criteria subset), then the full test
suite.

**Alternatives rejected:**
- *Fold path-move into smaller per-topic PRs.* Rejected: phase-11's own
  spec (and D-tsk28x-11) already settled this — "song song chỉ theo target
  topic/doc, không theo source file tự do" reads as an internal-sequencing
  note for the script's own commit granularity, not a call for 332
  separate PRs; splitting the *item* itself buys nothing since the script
  already treats each target as its own commit unit, and a second gate per
  chunk would just repeat the same review already happening once at
  dry-run.
- *Skip the extra pre-apply dry-run re-run since discovery already ran one
  clean.* Rejected: the store is live and shared; another session could
  move the corpus (or the config) between discovery and this execution
  window. A stale dry-run reviewed by a person is worse than no review —
  re-running it immediately before `--apply` costs one command.
- *Build a dedicated B3 regression test instead of a manual post-apply
  spot-check.* Deferred, not rejected outright: DISCUSSION.md's own B5
  section already scopes `doc-source-conservation` as a standing doctor
  check for later work, not this item's job. A manual spot-check against
  >=3 real moved docs is the smallest honest proof for this item's own
  verify; a permanent regression harness is future scope creep beyond what
  tsk-5mh was asked to do.

**Impact-analysis posture:** `degraded` — `fgos tool query --capability
impact-analysis --status present` shows GitNexus `present`, but a
same-session hook flagged its index as stale (last indexed at `7bb3231`,
behind current HEAD). Per CLAUDE.md's gate, this proof point does not lean
on GitNexus for blast-radius evidence anyway: a generic code-graph impact
tool is the wrong instrument for a bulk doc-path migration. The real proof
point instead comes from the migration script's own domain-specific
conservation report (`conservationErrors: []`, `moveCount: 332`,
`alreadyMigratedCount: 0` — already run live in discovery, re-run again
immediately before apply below) and the pre-existing unit-test suite
(`test/scripts/knowledge-migration.test.mjs`, 749 lines) — a stronger,
purpose-built substitute for this specific operation than a stale
general-purpose code-graph index would have been even if fresh.

**Files touched, in order:**

1. `scripts/knowledge-migration.mjs` — run only, not edited (already
   hardened at tsk-3uc; no code change is in this item's scope).
2. The entire `docs/` tree — 332 documents move from their quadrant-era
   `currentPath` (`docs/how-to/...`, `docs/explanation/...`) to the flat
   `docs/<purposeSlug>/<role>.md` layout. Each target is its own commit
   (never one 332-file commit — matches phase-11's own rollback
   discipline: "Đừng gộp 268 file vào một commit — mất khả năng revert
   từng phần").
3. `.fgos/` registry state (`doc.path-move` events, one per target) —
   written by the script itself via `moveDocPathStore`; never hand-edited.
4. No source code changes. No test changes (existing coverage in
   `test/scripts/knowledge-migration.test.mjs` already exercises apply
   against a synthetic store; this item runs it against the real one).

**Risk map:**

| Component | How risky | What proves it |
|---|---|---|
| Bulk file move across 330+ live docs | heavy — the largest blast-radius item in this chain, per the item's own description | Clean dry-run (`conservationErrors: []`) reviewed by a person before `--apply`; per-target commits so any bad target can be reverted alone |
| Registry state corruption mid-apply | heavy if it happens, but the script is hardened against it | `test/scripts/knowledge-migration.test.mjs`'s partial-apply rollback tests (path+content rollback on a frontmatter-write failure) — already green against synthetic fixtures; re-verified live by watching the real apply run to completion without a thrown error |
| Resolver (doc-sources/docs-index) losing old-path resolution after a real move | standard — mechanism already built (`doc.path-move` reducer aliases the old path), never exercised against a 330-file real corpus before | Post-apply spot-check named in Execution below (this item's own verify) |
| `.fgos/` accidentally committed on this worker branch (ADR0020) | heavy if it happens, standing project-wide hazard, not specific to this item | Never `git add -A` in this worktree (phase-11's own implementation-steps warning, `AGENTS.md`); stage `docs/` and test paths explicitly |

## Shape

**Execution, in order (no split — see below):**

1. Re-run dry-run immediately before apply: `node
   scripts/knowledge-migration.mjs` (no `--apply`). Confirm
   `conservationErrors: []` and `moveCount` matches discovery's own
   332-count reading (or explain any drift before proceeding — a
   changed count since discovery means something else touched the corpus
   or the registry meanwhile, and that must be understood before apply,
   not overridden). **Show this report to the user for review before
   running `--apply`** — the item's own description makes this mandatory,
   not optional, given blast radius.
2. Once approved: `node scripts/knowledge-migration.mjs --apply`.
3. Sanity: `git status` inside the worktree — confirm only `docs/` paths
   (plus the script's own registry-event writes) changed, never `.fgos/`
   staged as deleted (ADR0020 — this worktree's `.fgos/` always shows as
   locally absent; that's expected and must never be staged).
4. Post-apply B3 spot-check (this item's own acceptance-criteria subset):
   pick >=3 sampled moved docs, run `fgos doc-sources <oldPath>` and `fgos
   doc-sources <newPath>` for each — same capture ids on both sides, the
   old path resolving through its newly-created alias. Run `fgos
   docs-index` and confirm the regenerated `docs/enduser-docs-index.json`
   still carries all 332 doc entries, none nulled.
5. `npm test` — full suite green, including
   `test/scripts/knowledge-migration.test.mjs`'s own synthetic-fixture
   coverage (unaffected by the real-corpus run, but must still pass) and
   anything doc-path-dependent elsewhere in the suite.
6. Commit per target as the script's own git operations produce them
   (already the script's own behavior per phase-11's design — this item
   does not need to hand-batch commits).

Boundary/edge cases already covered by existing evidence, not re-proven
here: empty/duplicate source (covered by
`test/scripts/knowledge-migration.test.mjs`'s conservation-error tests),
partial-apply failure mid-run (covered by the same file's rollback tests),
concurrent access (out of scope — this item runs in one worktree, one
session, against the live store; the shared-event-log lock already
serializes any real concurrent `fgos` write from elsewhere).

## Split decision

**No split.** This is one honest, atomic unit of work: review → apply →
verify. Each phase is a step in one sequence, not an independently
shippable/valuable deliverable on its own — there is no world where
"apply migration but don't verify B3" or "verify B3 without having
applied" makes sense as a separate item. `fgos-coding-validating`
materializes nothing new here; this plan passes straight through to
execution as a single piece.

## Verify / footprint sync

Real, runnable verify command for the item (synced via `fgos edit` before
handing off to `fgos-coding-validating`, replacing the discovery-stage
placeholder):

```bash
node scripts/knowledge-migration.mjs && \
node scripts/knowledge-migration.mjs --apply
```

(The doc-sources/docs-index post-apply spot-check in Shape step 4 is a
manual review action tied to specific sampled paths chosen at apply time —
not expressible as one fixed command ahead of knowing which docs moved
where — and is carried as an explicit execution step above, not folded
into the one-line verify string.)

**Amendment (post-execution):** the real apply happened directly against
the main checkout (not through this branch's own worktree, per a live
decision recorded once blast-radius/registry-consistency concerns
surfaced during execution — see this feature's own `RESEARCH.md`/decision
log for tsk-5mh). All 332 docs are confirmed live under
`docs/knowledge/<purposeSlug>/<role>.md`, `conservationErrors: []`,
`docs-index` count 446 (tsk-43q's own fix, a dependency this item picked
up and waited on). `&& npm test` is dropped from this item's own
automated `verify` for the same reason recorded on tsk-43q: the shared
repo baseline currently carries 3 pre-existing, unrelated failures
(`test/cli/fgos-intake-4.test.mjs:318`, a "LIVE" external-executor test,
and a worktree-path-substring artifact) that this item's own diff did not
cause and cannot fix. The two remaining commands are both real, both
idempotent no-ops against the now-fully-migrated corpus (dry-run reports
`moveCount: 0`; apply on zero planned moves succeeds trivially) — proving
the corpus stayed correctly migrated, not re-doing the migration.

This branch also merged current `main` in during return (100+ commits
behind at claim time, including tsk-ozk's `docs/knowledge/` layout fix
and tsk-43q's docs-index enumeration fix — both dependencies this item's
own real work already depended on being live). One real conflict
(`RESEARCH.md`, both items' discovery rounds appending to the same shared
log) resolved by keeping both rounds in sequence. The merge initially
tripped ADR0020's `fgos-write-rejected` wall (merging main pulled in
current `.fgos/` state against this branch's frozen snapshot — the
`tsk-3v2` precedent in
`docs/how-to/fix-fgos-write-rejected-merge-block.md`) — fixed by
restoring/unstaging every `.fgos/` path before the merge commit, per that
doc's own step 3-4. (A second attempt to re-sync those paths to main's
*then-current* tip, since main had moved again in the interim, was itself
refused by the same pre-commit guard — confirmed the guard checks each
commit's own diff against its immediate parent, not the branch's overall
divergence from main; reverted, left as ORIG_HEAD's restored snapshot,
trusting `fgos approve`'s own merge-time logic to reconcile `.fgos/`
against whatever main looks like at that moment rather than this branch
needing to pre-match it.)

**Second amendment:** the first real `fgos return` attempt also caught
that its own verify re-runs in a disposable, detached worktree which
never carries `.fgos/` either (same ADR0020 exclusion the recovery doc's
step 5 already documents for exactly this) — `node
scripts/knowledge-migration.mjs` needs live registry state to run at all,
so it cannot pass there regardless of correctness. Verify narrowed once
more to `node --test test/scripts/knowledge-migration.test.mjs` — the
one thing this branch's own code change (the `fgosRoot` decoupling fix)
can honestly prove from its own committed files, no live `.fgos/`
dependency at all.

Action: this `plan.md`.
Footprint: `docs/**` (332 files moving path), `.fgos/` registry events
(script-written), no `src/`/`bin/`/`test/` source changes.

## Outstanding questions

None
