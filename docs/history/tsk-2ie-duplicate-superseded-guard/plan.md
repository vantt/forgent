# Plan: tsk-2ie — duplicates/supersededBy field on the merge harness

Status: draft, awaiting approval
Decisions: `CONTEXT.md` D1-D4 (this directory)

## Mode

**standard** — 3 flags counted:
- **data model** — two new fields (`supersededBy`, `duplicates`) on the work
  item schema.
- **public contracts** — `fgos edit` CLI surface gets two new flags;
  `mergeReadiness`'s return shape gets a new bucket, read by
  `/fgOS:merge-list`/`/fgOS:merge-next` downstream.
- **existing covered behavior** — `mergeReadiness`, `validateWorkShape`, and
  `editWork` all have existing test suites (`work.test.mjs`,
  `graph-harness.test.mjs`, `store.test.mjs`, `fgos.test.mjs`) that must
  keep passing unmodified for every item that never sets either field.

No hard-gate flag (auth, data loss, audit/security, external provider,
removing a validation) applies — not **high-risk**. More than one gray
area with real regression exposure (`mergeReadiness`) — not **small**.

## Impact-analysis posture

`impact-analysis: full` (GitNexus present, confirmed via `fgos tool query
--capability impact-analysis --status present`). `fgos-coding-implement` must run
`impact()` on `mergeReadiness`, `validateWorkShape`, and `editWork` before
editing any of them (CLAUDE.md gate) and report the blast radius before
proceeding.

## Approach

Mirror `mergeAfter`'s already-shipped pattern (`tsk-2u0`,
`docs/history/tsk-3bn-merge-conductor-harness-v2/`) field-for-field —
that item is the closest sibling and already proved this exact shape
(optional array/string field, existence-validated at the write door, read
only by `mergeReadiness`, never touching `frontier.mjs` or the unified
cycle graph). No alternative approach was seriously considered: CONTEXT.md
D1-D3 already lock the field shape and validation strictness by direct
reference to this precedent.

### Files touched, in order

0. **Set a real `verify` command on tsk-2ie itself.** Caught at
   `fgos-coding-validating`'s reality gate: `fgos list --id tsk-2ie --json` shows
   `work.verify` is currently the literal placeholder string `"chưa xác
   định — P15 bổ sung"` — not runnable. Execute's mechanical proof path
   (and `return`'s re-verify) runs this field verbatim, so it must become a
   real command before that stage, not after. Run once, any time before
   dispatch (no ordering dependency on steps 1-4 below):
   ```
   fgos edit tsk-2ie --verify "npm test -- test/state/work.test.mjs test/state/store.test.mjs test/state/graph-harness.test.mjs test/cli/fgos.test.mjs"
   ```
   Scoped to exactly the four touched-behavior test files (narrowest
   useful test first, per dev rules) rather than the full `npm test`
   suite — `fgos-coding-implement`/`return` can still broaden to the full suite
   if a shared contract turns out touched.
1. **`src/state/work.mjs`** — `validateWorkShape`: add a `supersededBy`
   block (optional non-empty string, self-reference rejected — mirrors
   `parent`, `work.mjs:329-338`) and a `duplicates` block (optional array
   of non-empty strings, self-reference rejected per entry — mirrors
   `mergeAfter`, `work.mjs:214-234`). Add `validateSupersededBy(work,
   existingIds)` and `validateDuplicates(work, existingIds)`, both
   mirroring `validateMergeAfter` (`work.mjs:507-520`) — existence-checked
   per D3/assumption-3 in CONTEXT.md. Call both from `validateWork`
   (`work.mjs:523-529`), alongside the existing `validateDeps`/
   `validateMergeAfter` calls at `work.mjs:526-527` — confirmed by direct
   read that this is where those two calls actually live, not `store.mjs`
   (caught at `fgos-coding-validating`'s reality gate: the plan's first draft
   mis-cited this as a `store.mjs` change).
2. **`src/state/store.mjs`** — add `'supersededBy'`, `'duplicates'` to
   `EDITABLE_FIELDS` (`store.mjs:192`). No other `store.mjs` change is
   needed: `addWork` (`store.mjs:161`) and `editWork` (`store.mjs:244`)
   both already call `validateWork(candidate, existingIds)`, so step 1's
   new validators are picked up automatically once `EDITABLE_FIELDS`
   admits the two new keys. Neither field is added to `assertNoCycle`/
   `assertNoUnifiedCycle` — per CONTEXT.md's assumption, they carry
   knowledge only, never participate in the blocking-cycle graph.
3. **`src/state/graph-harness.mjs`** — `mergeReadiness`: after computing
   `syncClear` (the existing dep/mergeAfter/drift-clear candidate set,
   `graph-harness.mjs:106-115`), split out any candidate whose
   `supersededBy` target is in `RESOLVED_STATUSES` OR is itself present in
   this SAME call's `readyIdSet` (D2) into a new `supersededOut: [ids]`
   bucket (naming mirrors `blockedOnSync`'s bucket-naming pattern) — these
   ids are excluded from `ready`, never placed in `waiting` (they are not
   "eventually mergeable once a dep resolves," they are permanently
   superseded, a different semantic than `waiting`'s). Computed against the
   ORIGINAL `syncClear` set, not iteratively — so a mutual pair (A
   supersededBy B, B supersededBy A, both still `awaiting-approval`) is
   excluded on both sides deterministically, per CONTEXT.md's stall-not-
   crash assumption, rather than being order-dependent on iteration order.
   `duplicates` is read by nothing here (D4 — informational only).
4. **`bin/fgos.mjs`** — add `--superseded-by <id>` and `--duplicates
   <ids>` to the `edit` command, mirroring `--merge-after`'s exact wiring
   (`bin/fgos.mjs:1050-1058`: `parseListFlag` for `duplicates`, direct
   string assign for `superseded-by`); extend the "edit requires at least
   one field" error message (`bin/fgos.mjs:1131`) to list both new flags.

### Risk map

| Component | Risk | Proof point (fgos-coding-validating) |
|---|---|---|
| `work.mjs` validation blocks | low — mirrors `mergeAfter` verbatim | existing `work.test.mjs` `mergeAfter` cases re-read as a template; new cases for both fields (shape, self-ref, dangling-target-rejected) |
| `store.mjs` wiring | low — one-line `EDITABLE_FIELDS` add, two mirrored validator calls | existing `store.test.mjs`/`fgos.test.mjs` `--merge-after` round-trip tests re-read as a template; new `--superseded-by`/`--duplicates` round-trip cases |
| `graph-harness.mjs` exclusion (D2) | **medium** — new two-condition exclusion logic, real regression exposure against every existing `mergeReadiness` test | full existing `graph-harness.test.mjs` suite must pass unmodified for items with neither field set (regression proof); new cases: resolved-target exclusion, same-round-target exclusion, mutual-pair exclusion, `duplicates`-alone has zero effect (D4) |
| `bin/fgos.mjs` CLI flags | low-medium — public CLI contract surface | `fgos edit --superseded-by <id>` / `--duplicates <ids>` round-trip through a real `fgos list --json` read |

### Concrete cases to prove against (standard-depth sketch)

- Item with neither field set — `mergeReadiness` output byte-identical to
  today (regression floor).
- `supersededBy` target already `done`/`delivered`/`wontfix` — excluded,
  lands in `supersededOut`.
- `supersededBy` target itself in this round's `ready` — excluded, lands
  in `supersededOut`.
- `supersededBy` target still genuinely `todo`/`doing`/`blocked` (neither
  resolved nor in this round's ready-set) — NOT excluded, stays in
  `ready` (D2's condition genuinely not met yet).
- Mutual `supersededBy` (A -> B, B -> A) — both excluded (stall, not a
  crash), per CONTEXT.md's assumption.
- `supersededBy` target id does not exist — `fgos edit` rejects at
  write-time (D3), never reaches `mergeReadiness`.
- `duplicates` set with no `supersededBy` — zero effect on `ready`/
  `waiting`/`mergeSets`/`supersededOut` (D4).

## Split decision

No split. One coherent change: the schema fields, their validation, the
CLI surface, and the `mergeReadiness` read are meaningless independently
of each other (a field nobody validates or reads is dead weight; exclusion
logic with no field to read is unreachable code) — this is a single
`standard`-mode item, proceeding as itself. `fgos graph --id tsk-2ie
--json` confirms tsk-2ie is not on the global `criticalPath`/`topUnblock`
list — no other item is waiting on a partial slice of this one, so there
is no leverage argument for splitting either.
