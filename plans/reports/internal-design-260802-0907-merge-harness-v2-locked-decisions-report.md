# Design Decisions: Merge Harness v2 (non-daemon conductor)

Conducted: 2026-08-02. Follows and finalizes open questions from
`internal-research-260801-1823-merge-mechanism-grand-orchestrator-design-report.md`
(yesterday's report — read in full before this one; not re-summarized here
except where a decision changes it).

## Purpose (user framing, locked)

The coordinating layer for fgOS merge is **not a daemon**. It is a
harness/skill that has full visibility over all merge-relevant work items,
their relationships (deps/parent/footprint), and computes merge strategy +
order. A coding process calls it to self-merge one step; a loop or a future
background daemon is just another caller of the same functions — never a
bespoke second mechanism.

## Confirmed: the 3-layer shape already exists in embryo

```
Layer 1 — HARNESS (pure computation + read-only git inspection, never mutates)
  src/state/graph-harness.mjs :: mergeReadiness(view)
  file's own header comment: "no fs, no Date.now(), no event append, no mutation"

Layer 2 — ACTION (mutating; the only place a real git merge happens)
  bin/fgos.mjs case 'merge' -> sub 'next' takes ready[0], recurses into 'approve'
  src/runner/merge.mjs :: mergeRunnerItem / mergeRunnerItemLocked

Layer 3 — DRIVER (anything that calls Layer 2, one step or repeatedly)
  /fgOS:merge-next   — single call, one session, one step
  /fgOS:merge-loop   — wraps the generic /loop skill around merge-next
                       (explicitly refuses to write its own timer/loop —
                       see plugins/fgOS/skills/merge-loop/SKILL.md)
  a future daemon    — would be ANOTHER Layer-3 driver, nothing new below it
```

No new layer needs inventing. Layer 3 does not change shape at all in this
work — it already calls Layer 2 through a stable contract (`approve`'s
returned envelope). Layer 2 gets 8 bug fixes (already filed, already
sequenced in yesterday's report). Layer 1 gets the real design work below.

## Decisions locked this session

### D1 — Layering confirmed as target shape
Harness (Layer 1) never mutates and never runs as a background process.
Every driver (present or future, including any daemon) is a caller, not an
owner, of Layer 1/2. No dissent raised; treat as settled unless new evidence
surfaces (per this repo's audit-reversal rule — reverse only on new
evidence, not abstract concern).

### D2 — Harness v1 scope: full package, not the smallest slice
User explicitly chose the wider scope over the narrower "just drift +
sync-root first" recommendation:
- drift detection (per-branch ahead/behind vs its real target)
- `sync-root` as a first-class action (Layer 2, not Layer 1 — it mutates)
- merge-set clustering (the "collected merge" case — grouping
  not-strictly-parent-child items that must merge together, in order)
- two-tier verification (leaf→root scoped/cheap, root→main full-suite +
  drift-checked — table already specified in yesterday's report §G)

**Named risk, accepted knowingly**: only one real incident (`tsk-3bn`)
exists to validate the clustering algorithm against; the design below is
therefore a best-effort first cut, not a battle-tested one. Expect the
clustering logic specifically (not drift/sync-root, which are
single-item-scoped and lower-risk) to need a revision pass after 2-3 more
real "collected merge" cases are observed.

### D3 — Lock design tension (tsk-2eq vs tsk-45y): re-examined, no real conflict found
Initial framing (this report's first draft) treated tsk-2eq and tsk-45y as
a genuine design tension needing a human tie-break. **Code scan
(2026-08-02, this session) disproves that framing** — corrected here
rather than left wrong in a decision record:

- `main-checkout.lock` and `events.lock` (the lock guarding
  take/return/approve's `events.jsonl` writes) are, and always have been,
  **two separate lock files**. `main-checkout.lock` only guards two short
  windows, both run from the real main checkout: the `claim` moment
  (`claim-port.mjs:103`) and the `merge`/verify/commit window
  (`merge.mjs:651`). It has never guarded ordinary state writes.
- ADR0020 (`worktree.mjs:315`, `createWorktree`) deletes `.fgos` from
  every dispatch worktree immediately after `git worktree add` — by
  design, a dispatch worktree has **no writable `.fgos` path at all**. The
  scenario tsk-45y describes ("worktree cô lập `.fgos`... ghi xung đột
  main-checkout") does not match this designed path.
- The bug that actually matches tsk-45y's complaint is **`tsk-56t`**
  (status: **done**) — `EnterWorktree` + cwd-relative `dataDir()` could
  silently recreate a divergent local `.fgos/events.jsonl` during `pick`.
  Already fixed. `tsk-49a` (also done) is an unrelated session-role race,
  not a locking issue.

**Conclusion**: tsk-2eq's fix (real `repoRoot` as lock root, ephemeral
worktree path stays git-op `cwd`) does not expand `main-checkout.lock`'s
blast radius to worktrees — that lock was already this narrow. There is
nothing to supersede. tsk-45y's stated premise predates (or misdescribes)
`tsk-56t`'s fix; recommend it go through `fgos-coding-exploring` on its own
merits to re-check its premise against current code, likely closing as
resolved-by-context rather than being decided one way or the other by
this report. tsk-2eq proceeds independently, unblocked by tsk-45y.

## Design spec: Harness v2 (Layer 1)

Two composable functions, kept separate because they have different
purity classes — mirrors the existing pattern in `graph-harness.mjs`
(`mergeReadiness` already composes `rankImpact` + `footprintOverlapAmong`,
two separately-testable pure functions).

### 1. `mergeReadiness` (existing, extended) — pure, in-memory graph computation

Current signature: `mergeReadiness(view) -> {ready, waiting, conflicts}`.

Extensions:
- **Topology-aware**: read `parent` alongside `deps`. An item whose
  `parent` root has unresolved drift (see function 2) is neither `ready`
  nor `waiting` — it's `blocked-on-sync`, a new bucket, because merging it
  before the root syncs risks repeating `tsk-3bn`.
- **Merge sets, not just pairwise conflict exclusion**: today, a footprint
  conflict pair is dropped entirely from `ready` (dòng 60-70 hôm nay).
  v2 instead groups conflicting/dependent items into an ordered `mergeSets`
  array — `[{items: [id...], order: [id...], reason: 'footprint-overlap' |
  'shared-root' | 'deps-chain'}]`. A set with a resolvable order is still
  actionable (serialize inside the set); only a set whose order can't be
  determined (genuine ambiguous overlap) escalates.
- **Tier field**: every `ready`/`mergeSets` entry gets `tier: 'leaf-to-root'
  | 'root-to-main'`, computed from whether the item's target is `fgw/<its
  own parent>` or `main` directly — feeds Layer 2's two-tier verify table
  (yesterday's report §G) so Layer 2 doesn't have to re-derive it.

Stays pure: still takes only `view` (no fs, no git subprocess) — topology
and footprint are already in the work-state view (`parent`, `footprint`
fields on each item). No signature change to existing callers'
happy path (`ready`/`waiting`/`conflicts` keys stay present and mean the
same thing) — `mergeSets`/`tier`/`blocked-on-sync` are additive fields, so
`merge-list`/`merge-next` skills keep working unmodified until they're
explicitly updated to read the new fields.

### 2. `driftStatus` (new) — read-only, git-inspecting, NOT pure

New function, new file or new export in `graph-harness.mjs` (kept
separate from `mergeReadiness` specifically because it shells into git —
different testing/mocking story than pure in-memory computation).

```
driftStatus(repoRoot, view) -> {
  [rootId]: {
    branch: 'fgw/<rootId>',
    target: 'main' | 'fgw/<parentRootId>',
    aheadOfTarget: number,   // commits target doesn't have yet
    behindTarget: number,    // commits branch doesn't have yet
    lastSyncedTip: string | null,  // computed fresh each call, not cached (D4)
    needsSync: boolean       // aheadOfTarget > 0 AND item not yet fully closed
  }, ...
}
```

Implementation: `git merge-base --is-ancestor <branch> <target>` plus
`git rev-list --left-right --count <target>...<branch>` per root branch —
same primitive external research already named (stale-branch bot pattern,
yesterday's report §External Practice 3). Read-only, no writes, no lock
needed (it's inspection, not action).

### D4 — No new persisted state
`driftStatus` computes fresh from git refs on every call — no cached
"last-known-synced-tip" file. Confirmed direction (matches the purity
discipline already in `graph-harness.mjs`); avoids adding a second
state-consistency surface next to `events.jsonl`, which is already proven
fragile under concurrency (`tsk-3wq`, self-healed but real). Cost is a few
extra git subprocess calls per `merge list` invocation — acceptable; this
is not a hot path.

## Design spec: Layer 2 additions

- **`sync-root <root-id>`** (new action, mutates): merges `fgw/<root-id>`'s
  current tip into its target (per `tier`), records a real
  decision/event, does **not** change the root item's own `status`/`stage`.
  Consumes `driftStatus`'s output to know when it's needed; never invents
  its own drift check.
- **8 existing bug fixes** (`tsk-4voj`, `tsk-2j9`, `tsk-18a`, `tsk-2eq`,
  `tsk-480`, `tsk-396`, `tsk-15k`, `tsk-66x`) — unchanged from yesterday's
  sequencing, all prerequisite to trusting Layer 1's output means anything.

## Filing recommendation (not yet actioned — see open question)

The harness v2 design (drift + sync-root + merge-set clustering + tier)
is substantial enough to be its own item(s), separate from the 8 bug
fixes already under `tsk-5t3a` — those are Layer 2 correctness fixes with
no design risk; this is new Layer 1 capability with a named, accepted
design risk (D2). Recommend filing as a new heavy item (or a small root
with 2-3 children: drift-detection, merge-set-clustering, sync-root-action)
under or alongside `tsk-5t3a`'s milestone, depending on `tsk-4voj` (Iron
Law rescoping — needed before the harness's escalation policy can trust an
Iron Law hit is real) and informed by `tsk-2eq`'s fix landing first (D3
makes the lock's contention real, which the clustering/serialization logic
in `mergeReadiness` v2 depends on for correctness).

## Open questions (per report policy)

1. Should this session file the new work item(s) into fgOS now (`fgos
   submit`), or does the user want to review this report first and file
   separately? Not done yet — filing is a real backlog mutation.
2. Should `tsk-45y`'s supersession (D3) be recorded on the item now (via
   its own `fgos-coding-exploring`/`fgos-coding-planning` pass), or left for whoever
   picks `tsk-45y` next to discover via this report's reference? Not
   done yet — same reason.
3. Merge-set clustering algorithm (D2's accepted risk) has exactly one
   real incident to validate against — worth deciding now whether v1
   ships with a conservative rule ("any ambiguity escalates") vs a more
   permissive one, before more real cases accumulate.
