# RESEARCH.md — postland-drift-consumer (tsk-1el)

## Round 1 — 2026-08-20

**Asked:** Item tsk-1el claims `postLand.notify`/`postLand.stale` (produced by
`detectPostLandDrift`, tsk-2ypd D4) is computed but nothing consumes it to
actually report to a live session. Two sub-questions: (1) is there truly no
persisted trace of `postLand` anywhere today, and (2) does this repo have any
other existing "deliver info to a specific live session" mechanism this gap
could reuse.

**Checked:**

- `rg -- "postLand" src bin test --glob "*.mjs"`:
  - `src/state/graph-harness.mjs:457-469` — `classifyPostLandDrift` (pure):
    builds `{notify, stale}` arrays in memory, returns them. No fs/event
    write (module's own header comment: "PURE: no fs, no Date.now(), no
    event append, no mutation").
  - `src/runner/merge.mjs:774-857` (three call sites, one per lock path) —
    `detectPostLandDrift` computed and attached as `result.postLand`,
    purely as a returned object. `merge.mjs`'s own header comment: "This
    module never writes to `.fgos/` — every state transition stays in
    `bin/fgos.mjs`, the sole write door."
  - `src/verbs/merge/approve.mjs:644,655,800,811` — `postLand: result.postLand`
    threaded through into the verb's own returned result object, four
    return sites (leaf→root success/fault, root→main success/fault). Never
    read, transformed, or persisted — just forwarded.
  - `src/verbs/merge/sync-root.mjs:181` (or `:186` depending on file
    version at read time) — same forward-only pattern.
  - `test/runner/merge.test.mjs:1828-1851` — two tests assert `result.postLand`
    is attached (or `undefined` for a non-merge outcome). Both tests only
    check the in-memory return value; neither touches `.fgos/` state.
  - `grep -n "postLand" bin/fgos.mjs` → **zero matches.** The CLI's own
    top-level command layer never reads, prints specially, or persists
    `postLand` — it would only surface at all if the CLI's generic
    `JSON.stringify(result)` output path includes it verbatim as raw JSON
    in the *merging* session's own terminal. No human-readable summary
    line exists for it anywhere. No event-log entry, no per-item field
    (`work.<id>.postLand` does not exist in the schema), no `.fgos/`
    write of any kind.
  - **Verdict on sub-question (1): confirmed.** `postLand.notify`/`.stale`
    has zero persisted trace anywhere in `src/state`, `.fgos/` event
    schema, or item fields. It exists only as an in-memory value for the
    duration of one `approve`/`sync-root` call, visible (if at all) only
    to the session that ran that command, and only as raw JSON.

- `rg -- "notify" src scripts --glob "*.mjs"` (excluding tests):
  - `src/runner/merge.mjs:314` — a comment referencing
    `classifyPostLandDrift`'s branches ("nothing / notify the owning
    session / mark stale") — documentation of intent only, no delivery
    code.
  - `src/state/graph-harness.mjs:457,464,469` — the `notify` array itself
    (see above).
  - `scripts/herdr-cockpit-notify.mjs` — the **only** existing "alert a
    live session" mechanism in the repo. Chrome-only (`herdr`), polls
    `fgos list --all --json` on an interval, diffs the **persisted**
    `status` field for newly-`awaiting-human` items against a previously-
    seen set (`detectNewAwaitingHuman`), and fires one `herdr notification
    show` per newly-parked item. Explicitly restricted (hard rule in its
    own header) to reading fgOS's real event-log-backed state via the CLI
    — never a detection API, never anything not backed by `.fgos/`.
  - **Verdict on sub-question (2): confirmed refute-by-omission.** This is
    the only precedent, and it structurally *cannot* see `postLand` today,
    because polling only works against state that `fgos list --json`
    actually returns — and `postLand` is never written there. Reusing this
    pattern for postLand drift requires `postLand` (or a derived flag) to
    first become part of persisted, item-scoped state that `fgos list`
    exposes — which is a new write-door decision, not a wiring change.

**Still open (real product/architecture questions, not fact gaps):**

- Where should `postLand.notify`/`.stale` be persisted, given `merge.mjs`
  explicitly declares it never writes `.fgos/` state (`bin/fgos.mjs` is the
  sole write door per that module's own header)? Candidates: a new
  per-item field set on the affected leaf item at the CLI layer
  (`bin/fgos.mjs`'s `approve`/`sync-root` handlers, which already receive
  `result.postLand`), a new event-log entry type, or something else —
  each has different replay/schema implications no existing decision
  covers.
- What does "báo thật cho phiên sống" mean as a delivery target: the
  *merging* session's own terminal (trivial — just print
  `result.postLand` as text instead of leaving it JSON-only), or the
  *other* live session(s) that own the affected leaf branch(es) (requires
  the persistence + polling chain above, i.e. a herdr-cockpit-notify.mjs-
  style consumer once the data is persisted)? The item title suggests the
  latter ("báo thật cho **phiên sống**" — the live session, implying the
  leaf owner, not the merger) but this is not stated explicitly enough to
  build against without a person confirming.
- Scope: does closing this gap need to cover both `notify` (has a live
  session) and `stale` (no live session) branches, or just one?

**Verdict: unclear.** No further repo/external evidence would resolve
these — they are mechanism/scope decisions for a person to make at
`exploring`, not facts to discover.
