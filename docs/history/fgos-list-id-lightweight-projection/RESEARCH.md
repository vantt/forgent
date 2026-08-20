# RESEARCH.md — fgos-list-id-lightweight-projection (tsk-4zr)

## Round 1 — 2026-08-20 (discovery stage, fgos-coding-discovering)

**Asked:** Does `fgos list --id <id> --json` currently offer any lightweight
projection (a `--fields`/`--summary`/`--brief` flag) instead of the full
decisions/discovery/gates/settlements/outcomes/frictions/learnings/
decisionsById/callThreads history for that one item? Is the item's claimed
root cause (unbounded full-text history embedded per item, no leak) still
accurate on current `main`? Is tsk-5dnt (cited by this item as a distinct,
uncertain-status neighbor) actually done, and does it overlap this item's
scope?

**Checked:**
- `bin/fgos.mjs:2186-2264` (`case 'list':` → `--id` branch) — read directly.
- `grep -n -- "--fields\|flags\.fields\|flags\.summary\|flags\.brief\|'summary'\|'brief'" bin/fgos.mjs` — zero hits.
- `grep -n "'list'"` usage-string line `bin/fgos.mjs:3962` — verb list has no `--fields`/`--summary` flag documented.
- `node bin/fgos.mjs list --id tsk-5dnt --json --dir .` — live read of tsk-5dnt's current status/stage/title/description.

**Found:**
1. No `--fields`/`--summary`/`--brief` flag exists anywhere in `bin/fgos.mjs`'s
   `list` command today (confirmed by direct grep across the whole file, zero
   matches beyond the pre-existing `flags.id` itself). The item's own claim
   ("no such flag exists today, confirmed by grep") still holds on current
   `main`.
2. `bin/fgos.mjs:2245-2258` — the `--id` branch's `singleView` object scopes
   `decisions`/`discovery`/`gates`/`settlements`/`outcomes`/`frictions`/
   `learnings`/`decisionsById`/`callThreads` all down to just the requested
   id (`scopedById`), but every one of those sections is still returned in
   FULL — the item's own complete history of decision rationale text,
   research rounds, gate records, etc., with no truncation, pagination, or
   field-subset option. This confirms tsk-4zr's root cause claim exactly:
   correctly scoped to one item (no cross-item leak), but still unbounded
   *within* that one item's own accumulated history.
3. tsk-5dnt (title: "fgos list --id <id> --json scopes… callThreads") is
   `status: delivered`, `stage: executing` — NOT reverted. Its description
   confirms the fix (`callThreads: scopedById(rawView.callThreads)`) and a
   direct read of `bin/fgos.mjs:2257` confirms that exact line is present in
   current code. tsk-5dnt is fully live and separate from this item: it
   fixed a LEAK (other items' callThreads data bleeding into a single-item
   request), not the unbounded-own-history problem tsk-4zr describes. No
   overlap in scope — tsk-4zr's suggested `--fields`/`--summary` direction is
   still open work, unaddressed by tsk-5dnt or by tsk-483 (bare `list`
   pagination fix, also done, also a different concern).

**Still open:** none for this discovery pass — root cause reproduced, no
flag exists, no distinct-item overlap. The concrete shape of a `--fields`/
`--summary` flag (exact field list, whether it also trims `title`/
`description` length, CLI flag name) is a `planning`-stage design decision,
not a `discovery`-stage blocker — discovery only needs to confirm the
problem is real and unaddressed, which it now has.
