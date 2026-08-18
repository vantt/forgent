# tsk-4hj — plan

Mode: high-risk

Flags counted (`fgos-routing`'s own Mode-gate table): **data loss** (hard
gate — the exact case CONTEXT.md's D3 exists to close: silently discarding
another item's uncommitted, hand-resolved merge state) and **public/
internal contract change** (a new `mergeRunnerItemLocked` outcome string,
consumed by three separate `bin/fgos.mjs` call sites — two by name, one via
D4's defensive guard — plus `fgos catchup`'s own accepted-reason
precondition) and **existing covered behavior**
(`test/runner/merge.test.mjs` already asserts the conflict/unclassified
split this item extends). One hard-gate flag alone forces high-risk
regardless of count; a `standard` lane would not honestly cover a change
whose whole point is preventing silent data loss across two unrelated
items' work.

Impact-analysis posture: **full** (`fgos tool query --capability
impact-analysis --status present` → `gitnexus`, `status: present` —
CONTEXT.md, same query, same result). `impact()` on
`mergeRunnerItemLocked`/`mergeHeadExists`/`abortMergeIfPossible` is run
before editing any of them, per `AGENTS.md`'s gate, full MUST rules apply.

## Approach

**Chosen path** (CONTEXT.md D1/D2/D3): add a `mergeHeadExists(repoRoot)`
read immediately before the `git merge --no-commit --no-ff branch` call
(`src/runner/merge.mjs:886`), inside `mergeRunnerItemLocked`, after the
main-checkout lock is already held (`mergeRunnerItem`, unchanged). When
that pre-call read is `true`, return a new outcome (name: `merge-blocked-
other-item`, D2's suggested example, adopted here — see Naming below) and
skip both the merge attempt and `abortMergeIfPossible` entirely (D3 — this
is the safety fix itself: never touch state this call did not create).
When `false` (the common case, unchanged), proceed exactly as today.

**Alternatives rejected** (already recorded in CONTEXT.md, cited here for
completeness): parsing `git`'s stderr text to distinguish "already had a
MERGE_HEAD" from "my merge conflicted" — rejected, fragile across git
versions/locales, no better signal than the boolean read already
available. Internal auto-retry/wait-loop inside `mergeRunnerItemLocked`
instead of a fail-fast blocked reason — rejected, contradicts the
established `fgos catchup` recovery mechanism this codebase already uses
for exactly this "may just work once retried" class (`tsk-18a` D1
precedent).

**Naming** (implementer-level per CONTEXT.md's own note, decided here
since a concrete name is needed to write call sites and the doc): outcome
string `merge-blocked-other-item`. Reads plainly at every call site
(`result.outcome === 'merge-blocked-other-item'`) and in `fgos list`
output; does not collide with any existing reason in
`bin/fgos.mjs:3568`'s `CATCHUP_REASONS` set.

## Risk map

| Component | Risk | Proof point (→ `fgos-coding-validating`) |
|---|---|---|
| `mergeHeadExists` pre-call check placement (`merge.mjs:886`) | Medium — must fire ONLY before this call's own attempt, never after (would collapse back into `tsk-18a`'s existing genuine-conflict path if misplaced) | Regression test: stage a real, unfinished `git merge --no-commit --no-ff` for branch A in a throwaway repo, then call `mergeRunnerItemLocked`/`mergeRunnerItem` for an UNRELATED branch B — assert outcome `merge-blocked-other-item`, assert branch A's MERGE_HEAD is still present afterward (proves no abort ran on it) |
| Two `approve`-path `bin/fgos.mjs` call sites (`~2999` leaf→root, `~3114` leaf→root-with-children/`integration-drift` variant) each need a matching `result.outcome === 'merge-blocked-other-item'` branch, mirroring the existing `merge-failed-unclassified` branch shape exactly (`moveWork(..., reason:)`, `addFriction`, return shape) | Medium — missing either call site leaves that path silently falling through to the generic error/throw instead of a clean `blocked` | `test/cli/fgos.test.mjs` gains one case per call site (matching how `merge-failed-unclassified` is already covered there per `docs/specs/runner.md:1043`'s own test inventory) |
| `sync-root`'s `runAndReport` (`bin/fgos.mjs:3305-3357`) needs D4's defensive `else` guard (CONTEXT.md D4, found during `fgos-coding-validating`'s first reality-gate pass on this plan) — WITHOUT it, `mergeRunnerItem`'s new outcome falls through to the success block and `sync-root` silently reports `synced` instead of blocked | High — a silent false success is strictly worse than today's `sync-root` behavior (a wrong-but-visible `blocked`/`merge-conflict`); this is the regression D1 would otherwise introduce | `test/cli/fgos.test.mjs:6121+` (existing `sync-root` suite) gains a case: stage a pre-existing MERGE_HEAD from an unrelated branch, run `sync-root`, assert it does NOT return `outcome: 'synced'` and does NOT record a "merged" decision |
| `CATCHUP_REASONS` (`bin/fgos.mjs:3568`) + `docs/specs/runner.md`'s accepted-reason list (~line 1023) must both add `merge-blocked-other-item`, mirroring `tsk-18a` D1's own precedent exactly | Low — mechanical, but a missed spot strands an item `blocked` with no recovery path (the exact gap `tsk-18a` D1 already named for its own sibling reason) | `test/cli/fgos.test.mjs`'s existing catchup precondition test (per `docs/specs/runner.md:1043`, "lý-do-không-áp-dụng-được") extended with this new reason as an ACCEPTED case |
| `mergeHeadExists` read timing vs. a genuinely concurrent process (TOCTOU: MERGE_HEAD appears between this new pre-check and the `git merge` call itself) | Low — the main-checkout lock (`acquireMainCheckoutLock`, held for the whole window since `tsk-2eq`) already serializes concurrent `approve` calls; this new check only needs to catch a LEFTOVER from a holder that already released, not a live race against a current holder | No new proof needed beyond the existing lock-window guarantee (`tsk-2eq`, already delivered) — noted here so `fgos-coding-validating` does not treat this as an open gap |

## Files touched

- `src/runner/merge.mjs` — `mergeRunnerItemLocked` (the D1/D3 fix itself).
- `bin/fgos.mjs` — two `approve`-path call sites (leaf→root ~2999,
  leaf→root-with-children ~3114) + `sync-root`'s `runAndReport` (~3305-3357,
  D4's defensive guard) + `CATCHUP_REASONS` (~3568).
- `docs/specs/runner.md` — catchup's accepted-reason list (~1023) and any
  nearby prose enumerating `merge-conflict`/`merge-failed-unclassified`
  reasons that should now also name `merge-blocked-other-item`.
- `test/runner/merge.test.mjs` — new regression test for
  `mergeRunnerItemLocked`/`mergeRunnerItem` (the risk-map's first row).
- `test/cli/fgos.test.mjs` — new case(s) for the two `approve` call sites,
  the `sync-root` defensive guard, and the extended catchup precondition
  (the risk-map's second/third/fourth rows).

No split: this is one coherent, narrowly-scoped fix (one new classification
outcome, consumed identically by the two `approve` call sites, guarded
defensively at the one call site — `sync-root` — that cannot name it
explicitly, plus the catchup allowlist it must join) — not several
independently workable pieces. A split would separate the code fix from
its own test proof, which `fgos-coding-validating`'s reality check requires stay
together.

## Order

1. `mergeHeadExists` pre-call check + new outcome in `merge.mjs` (D1/D2/D3),
   with the `merge.mjs` regression test alongside it — nothing else can be
   proven without this landing first.
2. The two `approve`-path `bin/fgos.mjs` call sites, mirroring the
   now-existing `merge-failed-unclassified` branches, AND `sync-root`'s
   defensive guard (D4) — landed together with step 1, never shipped
   separately (D4's own bar: D1 must not ship without this).
3. `CATCHUP_REASONS` + `docs/specs/runner.md` catchup precondition update.
4. `test/cli/fgos.test.mjs` coverage for step 2/3.

(`fgos graph --json` was run for this item; with no split, `criticalPath`/
`topUnblock` carry no ordering signal beyond what CONTEXT.md's own D1→D2→D3
dependency chain already fixes — noted for completeness, not cited as a
new finding.)

## Outstanding questions

None
