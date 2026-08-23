# tsk-584 — herdr-plugin surfaces backlog items visibly in the TUI

Mode: standard

Parent: `tsk-5wr` (Piece 4 of
`docs/history/work-item-backlog-status/plan.md:145-156`).
Locked decisions this plan honors: `docs/history/work-item-backlog-status/CONTEXT.md`
D3 (`backlog` gets its own `statusCategory`) and D4 (herdr-plugin fix is in
scope, and a `backlog` item must be genuinely findable through normal TUI
browsing, not merely non-erroring).

Depends on Piece 1 (`tsk-5vs`), already merged into this branch: the
`backlog -> 'backlog'` mapping is present at
`src/state/workflow-stage-graphs.mjs:280`.

## Mode rationale

`standard`, on 2 flags:

1. **Existing covered behavior changes.** The tab strip is not new surface.
   Three existing tests assert the current 4-tab shape and must be updated:
   `tabs_classify_status_into_todo_doing_review_done` (`app.rs:1113-1133`),
   `next_tab_and_prev_tab_cycle_and_reset_selection` (`app.rs:1142-1154`),
   and `work_items_panel_renders_four_tabs_todo_doing_review_done`
   (`ui.rs:724-737`).

   A fourth, `next_tab_event_cycles_the_active_tab` (`main.rs:1076-1088`),
   was checked and needs **no** change: it steps forward twice from `Todo`
   and asserts `Review`, and since `Backlog` is inserted before `Todo` the
   `Todo → Doing → Review` leg is untouched — only the `Done` wrap moves. Do
   not edit it; it should stay green as a free regression check that the
   forward leg did not shift.
2. **Cross-language status-literal mirror.** The Rust side re-states status
   literals that live canonically in JS (`workflow-stage-graphs.mjs`). JS-side
   correctness does not imply the Rust side stays in sync — that divergence is
   exactly the bug this item exists to close.

Neither flag is a hard gate, and nothing here touches a locked law, so
`high-risk` would overstate it. `small` would understate it: a `small` lane
does not carry the phased shape needed to update four existing test
assertions across three files without regressing the cycle behavior.

## Approach

### Chosen: a dedicated `BACKLOG` tab, placed first in the strip

`WorkTab` (`app.rs:105-110`) gains a fifth variant, `Backlog`, matching
`status == "backlog"`; `TAB_ORDER` (`ui.rs:36`) becomes
`[Backlog, Todo, Doing, Review, Done]`.

Why a dedicated tab and not folding `backlog` into the `Todo` tab with a
marker:

- CONTEXT.md D3 deliberately gave `backlog` its own `statusCategory` rather
  than reusing `'todo'`'s, precisely so no consumer reads a `backlog` item as
  ready. Folding it into the `Todo` tab would re-introduce, in the one
  interactive surface, exactly the conflation D3 spent a decision avoiding.
- D4's bar is that a person browsing can SEE a `backlog` item exists. The tab
  strip renders every `TAB_ORDER` label unconditionally
  (`ui.rs:279-280`), so an empty-but-present `BACKLOG` tab is visible on
  screen at all times — it advertises the bucket even when nothing is in it.
  A marker inside `Todo` is only discoverable once an item already exists,
  and `backlog -> todo` is a human-only edge (D1): an item nobody knows to
  look for never gets promoted.

Why **first** and not last: `STATUS_CATEGORIES` (`src/state/work.mjs:138-145`)
already declares its frozen order as `['backlog', 'todo', 'in-progress',
'review', 'completed', 'canceled']`. Putting `BACKLOG` first makes the tab
strip mirror the schema's own category order rather than inventing a second
ordering the Rust side would have to keep in sync by hand.

**The default active tab stays `Todo`** (`app.rs:342`, `app.rs:636`).
`BACKLOG` being first in the strip is a layout choice; making it the landing
tab would change what an operator sees on every launch, which is a
regression this item was not asked for and D4 does not require — the strip
being visible already satisfies the findable-by-browsing bar.

### Rejected alternatives

- **Fold into `Todo` with a marker** — rejected above (re-conflates the
  category D3 separated; invisible until an item exists).
- **Add the arm to `WorkTab::matches` only, no new tab** — this is the
  literal minimum the item's own description names, and it does not work: an
  arm with no variant to attach it to is not expressible, and any variant
  not in `TAB_ORDER` is unreachable by `next_tab`/`prev_tab`. It would be
  non-erroring and invisible, exactly what D4 rules out.
- **A filter toggle instead of a tab** — a second interaction idiom for one
  status, in a panel whose entire classification model is already tabs.

### Risk map

`impact-analysis: degraded` — `fgos tool query --capability impact-analysis
--status present` reports the `gitnexus` provider `present`, but `present`
only means installed, never that the index is fresh (CLAUDE.md's own gate).
It is not fresh here: the index was last built at `79fead3`, and
`git diff --name-only 79fead3..HEAD` shows `herdr-plugin/src/app.rs`,
`herdr-plugin/src/ui.rs` and `herdr-plugin/src/main.rs` — precisely this
item's three files — have all changed since. So the CRITICAL / 31 impacted /
22 processes figures below come from a stale graph and are named here as
weak proof, not treated as confirmed blast radius.

What the plan actually leans on is corroborated independently, against the
current tree rather than the index: `App::visible_work_items`
(`app.rs:373-377`, read directly) is the sole caller applying
`active_tab.matches(...)`, which is what makes the radius hub-shaped, and
every existing test the plan names was located by direct read at its cited
line. The stale-index gap therefore affects the reported numbers, not the
conclusion drawn from them.

| Component | Risk | What would prove it |
|---|---|---|
| `WorkTab::matches` (`app.rs:118-128`) | **Medium.** GitNexus upstream impact reports CRITICAL / 31 impacted / 22 processes / 4 modules. Read through, it is hub-shaped, not dangerous: `direct: 1` — the single direct caller is `App::visible_work_items` (`app.rs:373-377`), and everything at depth 2-3 reaches it only through that one funnel. | `cargo test` green. The 22 "affected processes" are themselves almost entirely this crate's own tests, so the item's own verify covers the reported radius rather than leaving it unproven. |
| Tab cycle (`next`/`prev`, `app.rs:139-155`) | **Medium.** Going 4 → 5 changes the wrap point. One existing test asserts the 4-cycle by construction: `next_tab_and_prev_tab_cycle_and_reset_selection` (`app.rs:1142-1154`) steps `next_tab()` three times past `Doing` and asserts a wrap back to `Todo`, which becomes `Backlog` under the new order. | That test updated to the 5-cycle and green, with both wrap assertions (forward from `Done`, backward from `Backlog`) still explicit rather than deleted, and `main.rs`'s forward-leg test still green untouched. |
| `TAB_ORDER` arity (`ui.rs:36`) | **Low.** Typed `[WorkTab; 4]`; the compiler rejects a 5th element until the type changes, so this cannot silently half-land. | Compiles; `work_items_panel_renders_four_tabs_todo_doing_review_done` (`ui.rs:721-735`) updated to assert all five labels. |
| `next_auto_discover_candidate` (`main.rs:138-140`) | **Low.** No logic change needed — the literal `status == "todo"` check already excludes `backlog` by construction. The risk is silent future drift, not present incorrectness. | A new regression test: a `backlog` item at an otherwise discover-eligible stage with empty `blocked_by` is never returned as a candidate. |

Note the two Medium rows do not need a separate proof point carried to
`fgos-coding-validating` beyond the item's own verify: both are fully
mechanical (a Rust exhaustive `match` and a typed array), and `cargo test` is
a real, complete check of each. What `fgos-coding-validating` should confirm
is the assumption list below.

### Footprint — widened

Declared footprint on the item today is
`herdr-plugin/src/app.rs`, `herdr-plugin/src/main.rs`. That is **incomplete**:
`TAB_ORDER` at `ui.rs:36` is typed `[WorkTab; 4]` and the render test at
`ui.rs:721-735` asserts exactly four labels, so a fifth tab cannot land
without touching `ui.rs`. Corrected footprint:

```
herdr-plugin/src/app.rs
herdr-plugin/src/main.rs
herdr-plugin/src/ui.rs
```

`herdr-plugin/src/ui.rs` overlaps no sibling's declared footprint under
`tsk-5wr` (`bin/fgos.mjs`, `src/state/discover-pool.mjs`).

### Order of work

`fgos graph --json` puts this item on neither `criticalPath` (a 10-deep path
through `tsk-4vo…tsk-19y-1`, disjoint from this subtree) nor `topUnblock`
(empty), so no external work is waiting on a particular piece landing first.
The ordering below is therefore internal, driven only by what has to compile
before the next step can be written:

1. `app.rs` — add the `Backlog` variant, its `matches` arm, its `label`, and
   its place in `next`/`prev`. Nothing else compiles until the variant exists.
2. `ui.rs` — widen `TAB_ORDER` to `[WorkTab; 5]` with `Backlog` first.
3. Update the three existing tests named in the Mode rationale (leaving
   `main.rs`'s `next_tab_event_cycles_the_active_tab` alone, per the note
   there).
4. `main.rs` — add the `next_auto_discover_candidate` regression test (no
   production change in this file).

## Shape

One honest piece of work. **No split.** All four steps are the single
indivisible change "the TUI knows about a fifth status bucket" — splitting
them would leave the tree non-compiling between children, and no piece has a
runnable verify of its own separate from `cargo test`.

Verify (unchanged from the item's own):

```
cd herdr-plugin && cargo test
```

### Concrete cases to prove against

- **Empty/boundary** — the `BACKLOG` tab with zero matching items renders its
  label and an empty list without panicking (this is the normal case in a
  repo with no `backlog` items yet, and is the case D4's bar most depends on:
  the tab must advertise itself while empty).
- **Existing behavior that must not regress** — `todo` items still appear
  under `TODO` and nowhere else; the `Doing`/`Review`/`Done` groupings are
  untouched; the default landing tab is still `Todo`.
- **Cycle wrap** — `next_tab` from `Done` wraps to `Backlog`; `prev_tab` from
  `Backlog` wraps to `Done`. Both directions asserted, not just forward.
- **Classification** — a `backlog` item appears under `BACKLOG` and under no
  other tab (the existing classification test extended, not replaced).
- **Auto-discover exclusion** — a `backlog` item at stage `discovery` with
  empty `blocked_by` is not returned by `next_auto_discover_candidate`, even
  though it satisfies `discover_eligible()`.

### Assumptions

- **A1.** `backlog` is the exact status literal the Rust side must match.
  Grounded in `src/state/workflow-stage-graphs.mjs:280` on this branch
  (`backlog: 'backlog'`), merged here via `tsk-5vs`.
- **A2 — proven, no longer an open assumption.** `cargo test` from
  `herdr-plugin/` is the complete proof surface for this item. D4's sharpened
  bar mentions a manual TUI check
  (`docs/history/work-item-backlog-status/plan.md:90`), and the automated
  stand-in is real: `work_items_panel_renders_four_tabs_todo_doing_review_done`
  (`ui.rs:724-737`) drives a `ratatui::backend::TestBackend`, collects the
  rendered buffer into a string, and asserts each label appears — no live
  terminal involved. Because `App::mock()` carries no `backlog` item, simply
  extending that test to assert a fifth `BACKLOG` label IS the empty-tab
  visibility proof D4 asks for; it needs no new harness.
- **A3 — proven.** No consumer outside `herdr-plugin` reads `WorkTab`'s
  variant count or `TAB_ORDER`'s arity. Verified against the current tree by
  direct grep rather than the stale index: the only non-`target/` matches for
  `WorkTab`/`TAB_ORDER` anywhere under `herdr-plugin/`, `src/`, or `bin/` are
  `herdr-plugin/src/app.rs`, `herdr-plugin/src/ui.rs`, and
  `herdr-plugin/src/main.rs`.
- **A4 — baseline.** `cd herdr-plugin && cargo test` is green as of this
  plan: 145 passed, 4 suites. Any failure after the change is therefore
  attributable to the change itself.

## Outstanding questions

None
