# RESEARCH.md — tsk-597z: diagnostic-only sweep for re-surfacing status:blocked items whose park-causing check may now resolve

## Round 1 — 2026-08-14 (discovery stage)

### Asked
Is there an existing, callable, structured (non-free-text) way to identify
what park-causing check produced a given `status:blocked` item, so a
report-only sweep could re-run that same check against each blocked item
today? Three sub-questions: (1) is `checkMergeStillResolves` generic enough
to re-run against an arbitrary blocked item, or scoped only to the
cleanup/merge-recheck harness; (2) does any blocked item today carry a
structured (non-free-text) marker identifying which check parked it; (3)
what shape does a blocked item's stored park reason actually take today.

### Checked
- `src/state/cleanup-harness.mjs:1-90` — `checkMergeStillResolves` doc
  comment and signature.
- `bin/fgos.mjs:4395-4436` (the `catchup` verb's eligibility gate) —
  the ONLY other call site of `checkMergeStillResolves` besides
  `cleanup-harness.mjs` itself (confirmed via `grep -rn
  "checkMergeStillResolves" bin/fgos.mjs src/runner/*.mjs`).
- `src/state/store.mjs:487` — `moveWork(dir, { id, to, reason, ... })`
  signature: `reason` is a first-class stored field, separate from
  `detail` (which only appears on `addFriction` calls).
- `bin/fgos.mjs` grep for `to: 'blocked'` call sites (merge/catchup paths,
  ~10 sites) — every merge-time block passes a short enum `reason` (e.g.
  `'merge-conflict'`, `'verify-fail-post-merge'`,
  `'verify-timeout-post-merge'`, `'integration-drift'`,
  `'merge-failed-unclassified'`, `'merge-blocked-other-item'`), collected
  into a `CATCHUP_REASONS` `Set` at `bin/fgos.mjs:4402`.
- `bin/fgos.mjs:4415-4432` (comment block directly on the
  `mergeStillFails` line) — explicitly documents that the `cleanup ->
  blocked` park path (the one caused by `checkMergeStillResolves` failing)
  stores the FULL human-readable diagnostic text in `reason` itself
  (possibly joined with an unrelated missing-retrospective-content
  failure), so it can never match `CATCHUP_REASONS` by content — and that
  is exactly why `catchup`'s own gate does NOT string-match `reason` for
  this case. Instead it re-runs `checkMergeStillResolves(repoRoot, item, {
  view, id })` live and trusts that boolean instead of the stored text.
- `docs/history/tsk-5j0-checkmergestillresolves-decomposed-root-never-checked-against-main/CONTEXT.md`,
  `docs/history/tsk-577-cleanup-checkmergestillresolves-false-positive/CONTEXT.md`,
  `docs/explanation/why-checkmergestillresolves-can-false-positive-after-a-root-branch-prune.md`
  (surfaced by GitNexus context hook) — prior incidents of exactly this
  shape: an item stuck `blocked` because `checkMergeStillResolves` was
  itself buggy, fixed later, item never re-checked automatically.
- `grep -rn "decomposed-parent-wrong-sha"` across `src/`, `bin/`, `docs/`
  — zero hits. This string from tsk-597z's own description is prose
  describing the tsk-5j0 bug class, not a literal code/reason value.

### Found
1. **(sub-q 1) Not generic today, but directly reusable.**
   `checkMergeStillResolves(repoRoot, item, { view, id })` is exported
   from `cleanup-harness.mjs` and already called from exactly one place
   outside that module: `catchup`'s eligibility gate
   (`bin/fgos.mjs:4432`). It is read-only (`git merge-base
   --is-ancestor`, no mutation — per its own file header), takes a plain
   `item` + `view` + `id`, and returns `{ ok, ... }`. Nothing about its
   signature restricts it to items literally in `status:cleanup` — it can
   be called against any item object with the right shape (branch/head
   tracking fields), the same way `catchup` already calls it against an
   item currently sitting in `status:blocked`.
2. **(sub-q 2/3) A structured, non-free-text marker DOES exist — but it's
   not `reason`, it's the prior-status transition itself.** For
   merge-time blocks, `reason` IS already a short enum
   (`CATCHUP_REASONS`'s 6 values) — contradicts the risk note in
   tsk-597z's own description that assumed all blocked reasons are
   free text; only the `cleanup -> blocked` path's `reason` is free
   text. Critically, `catchup`'s own gate proves the fragile-string-match
   problem named in tsk-597z's description (risk #1) is a non-issue for
   the `checkMergeStillResolves`-caused case specifically: it sidesteps
   `reason` content entirely and just re-runs the live check
   unconditionally. A report-only sweep can copy this exact pattern —
   never match on `reason` text, just call `checkMergeStillResolves`
   fresh for each currently-`blocked` item and report which ones now
   return `ok: true`.
3. **Scoping gap (open, for planning, not blocking discovery):** nothing
   found yet identifies, from an item's CURRENT state alone, whether a
   given `blocked` item's most recent transition was `cleanup ->
   blocked` (where `checkMergeStillResolves` is the relevant re-check) vs
   some other park cause (`awaiting-human`-adjacent `blocked`,
   merge-conflict, etc., where re-running this specific check is
   meaningless). The item's live record (`fgos list`) does not carry
   "which status did I move FROM"; only the event log / `fgos show <id>`
   history does. Planning needs to decide: read prior-transition from
   event history per candidate item (feasible — `fgos show` already
   exposes item history), or restrict the sweep to domain-conditional
   worktree-backed items only as a coarser pre-filter, or something else.
   This is a "how to scope the candidate set" design choice, not a
   blocking unknown — the underlying check to run once scoped is already
   proven to exist and already proven safe to call read-only.
4. **This item does NOT need to solve tsk-2q8's own repro** (confirmed
   from tsk-2q8's own history folder, `docs/history/tsk-2q8/
   iron-law-evidence.md`, and `docs/history/tsk-2q8-checkmergestillresolves-rebased-root-branch-not-pruned/`)
   — those concern the rebased-root-branch case where the ancestry check
   fails forever; unrelated to this item's re-surfacing scope.

### Still open (deferred to planning, not a discovery blocker)
- How to identify a blocked item's prior status (was it `cleanup ->
  blocked`?) without string-matching `reason` — event-history read vs.
  a coarser pre-filter. Named above as the one real design decision left.
- Whether/how to surface the report (new `fgos` verb + CLI command,
  following the `fgos stale`/`fgos conflicts` read-only advisory
  pattern, vs. a standalone script) — a "how to ship it" question, not
  an ambiguity about whether the underlying mechanism exists.

### Verdict
**Clear.** The mechanism this item needs (a read-only, already-exported,
already-proven-safe live re-check — `checkMergeStillResolves`) exists
today and is already called exactly this way (against a `blocked` item,
outside the cleanup harness proper) by the `catchup` verb. The free-text
fragility risk named in the item's own description is real for `reason`
strings in general but does not block this specific check, since the
precedent (`catchup`) already avoids string-matching for it. Remaining
opens (candidate-set scoping, delivery shape) are planning-stage design
decisions, not missing evidence.

**Verify (real, runnable):** `node bin/fgos.mjs list --status blocked
--json --dir "$root"` enumerates today's actual `blocked` population this
sweep would run against — a plan can validate against this real set
rather than a hypothetical one.
