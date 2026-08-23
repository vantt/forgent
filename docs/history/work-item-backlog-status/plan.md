# work-item-backlog-status — plan

Item: `tsk-5wr`. Builds directly on `CONTEXT.md`'s locked decisions
(D1–D4) — nothing here reopens any of them, only shapes how to build them.

Mode: **high-risk**

## Lane decision (direct-entry fallback, per `fgos-routing`'s own Mode gate)

This session went `fgos-coding-exploring -> fgos-coding-planning` directly
(the `fgos discover` engine call routed straight here — see
`fgos-coding-driving`'s own loop), so no `plan.md` `Mode:` line existed yet
and no lane was handed off in prose. Applying `fgos-routing`'s Mode-gate
table directly (`.claude/skills/fgos-routing/SKILL.md`):

- **data model** — yes: extends `work.mjs`'s `STATUSES` (a new literal
  value) and wires `STATUS_CATEGORIES`'s already-reserved `'backlog'` slot
  for real (D3).
- **public contracts** — yes: `STATUSES`/`TRANSITIONS`
  (`status-fsm.mjs`)/`statusLabels` (`workflow-stage-graphs.mjs`) are the
  domain-agnostic tables every consumer in the system reads (`frontier.mjs`,
  `discover-pool.mjs`, `rollup`, every CLI verb, and `herdr-plugin` across
  the Node/Rust boundary).
- **cross-platform** — yes: `herdr-plugin` (Rust) needs its own fix (D4)
  alongside the Node.js state layer — two languages, two toolchains, two
  test suites.
- **existing covered behavior** — yes: `status-fsm.mjs`/`work.mjs`/
  `frontier.mjs`/`discover-pool.mjs` all carry real test coverage today
  (`test/state/fsm.test.mjs`, `work.test.mjs`, `frontier.test.mjs`,
  `discover-pool.test.mjs`) that a wrong edge or a wrong category could
  silently break.
- **multi-domain** — yes: `STATUSES`/`TRANSITIONS` are the one global
  table every domain shares (not just `coding`) — decision 0027's own
  framing, cited directly in the item's own description.

5 flags ≥ the 4+ threshold → **high-risk**, independent of any single
hard-gate flag (none of auth/data-loss/audit-security/external-provider/
removed-validation apply here — the count alone crosses the line).

`fgos graph --id tsk-5wr --json` was run per this skill's own Approach
step; it returned the whole-repo component/critical-path view rather than
a per-item unblock scope (the `--id`/positional form doesn't scope
`criticalPath`/`topUnblock` to one item in this CLI build — `topUnblock`
came back `skipped` regardless). Not useful here: `tsk-5wr` has `deps: []`
and no other item declares a dependency on it (it is a fresh, freestanding
idea), so ordering below is decided by actual code dependency (which piece
needs which other piece to exist first), not graph-derived priority.

## Approach

**Chosen path:** land the schema/global-table change first (everything
else reads it), then three independent consumer-side fixes in parallel —
split into 4 child items, each independently workable and independently
verifiable.

**Alternatives rejected:**
- *One single non-split item covering all 4 pieces* — rejected: two
  different languages/toolchains (Node test runner vs. `cargo test`) and
  4 flags already crossing high-risk means a single "one honest piece of
  work" framing understates the real shape; splitting gives each piece its
  own real, scoped verify command instead of one vague combined one.
- *A brand-new dedicated CLI verb (`fgos backlog-promote <id>`) for the
  D1 human-only `backlog -> todo` edge* — rejected below (Piece 1) once
  scouting showed the existing `fgos move` verb already always stamps
  `role: 'human'` unconditionally (`bin/fgos.mjs:1481`), the same
  attribution-only convention every other "human-only" edge in this
  codebase already relies on (D1's own grounding in `CONTEXT.md`). Adding
  a transition-table edge is sufficient; a new verb would be pure
  unnecessary surface (YAGNI).
- *A brand-new `/fgos:backlog <text>` slash command* for D2's entry point
  — rejected in favor of a `--backlog` flag on the existing `fgos submit`
  verb (Piece 2 below): `submit` already has an established pattern of
  independent optional flags (`--async`, `--domain`, `--tier`, `--urgent`,
  …) that override one field of the created item; `--backlog` is the same
  shape, and needs no new plugin skill file/registration a dedicated slash
  command would.

**Impact-analysis posture (`CLAUDE.md`'s capability gate):** `fgos tool
query --capability impact-analysis --status present` (run during
`fgos-coding-exploring`, re-confirmed here) returned GitNexus registered and
`present` → **full**. The proof points below can lean on real blast-radius
evidence where useful, not just a weakened "degraded" placeholder.

## Risk map

| Component | How risky | Proof point (for `fgos-coding-validating`) |
|---|---|---|
| Global `TRANSITIONS`/`STATUSES`/`statusLabels` tables (Piece 1) | High — every domain and every domain-agnostic consumer reads these; a wrong category could make a `backlog` item look `ready` to `frontier.mjs`, or a missing edge could leave `backlog` items permanently stuck. | `npm test` (full suite — these tables are read too widely for a scoped subset to be honest proof) green, plus a new assertion in `frontier.test.mjs` that a `statusCategory: 'backlog'` item is excluded from `ready`. |
| `discover-pool.mjs`'s `isCandidate` split (Piece 3) | Medium — getting the split condition backwards (accepting `backlog` for the `decompose`-only branch too) would let a not-yet-committed idea leak into real dispatch. | `npm test` green, plus new cases in `discover-pool.test.mjs`: a `backlog`+`exploring` item IS a candidate; a `backlog`+`planning` item is NOT. |
| `herdr-plugin` (Rust, Piece 4) | Medium — this is a cross-language contract; JS-side correctness (frontier/discover-pool already exclude non-`todo` correctly) does not imply the Rust side stays in sync, which is exactly how the item's own acceptance criterion 4 finding happened. | `cargo test` (from `herdr-plugin/`) green, plus a new `WorkTab::matches` test case for `backlog`. Per D4's human sharpening: also a manual TUI check (screenshot or live run) that a `backlog` item is actually visible/findable while browsing, not just "doesn't panic." |
| `--backlog` flag on `submit` (Piece 2) | Low — additive, optional flag; no existing caller passes it today. | `npm test` green, plus a new case asserting `fgos submit --backlog "..."` creates an item at `status: 'backlog'` while a flagless `submit` still creates `status: 'todo'` (regression guard for D2). |

## Shape — 4 pieces, one dependency edge

Split via `fgos add --parent tsk-5wr`, each carrying `--deps tsk-5vs`
(Pieces 2-4) so the dependency graph enforces Piece 1 landing first:

| Piece | Child id | Depends on |
|---|---|---|
| 1 — schema core | `tsk-5vs` | — |
| 2 — `--backlog` submit flag | `tsk-4rdi` | `tsk-5vs` |
| 3 — discover-pool candidacy | `tsk-1av` | `tsk-5vs` |
| 4 — herdr-plugin visibility | `tsk-584` | `tsk-5vs` |

**Piece 1 — schema core** (`tsk-5vs`, must land first; 2, 3, 4 all depend on it):
- Add `'backlog'` to `STATUSES` (`src/state/work.mjs`), positioned first
  in the array (before `'todo'`), matching the item's own framing of it as
  the front-of-lifecycle counterpart to the tail four.
- Add the `{ from: 'backlog', to: 'todo' }` edge to `TRANSITIONS`
  (`src/state/status-fsm.mjs`). No `reason`/`ask`/`answer` requirement —
  same plain-edge shape as `blocked -> todo` (D1 is satisfied by which
  verb exposes the edge, not by adding a payload requirement here; see
  Approach above).
- Add `backlog: 'backlog'` to `DOMAINS.coding.statusLabels`
  (`src/state/workflow-stage-graphs.mjs`) — wires the already-reserved
  `STATUS_CATEGORIES` slot (D3) for real. No change needed to
  `STATUS_CATEGORIES` itself (`work.mjs:127-134`) — `'backlog'` is already
  there.
- No `frontier.mjs` code change (confirmed in `CONTEXT.md` D3): its
  positive-match filter on `statusCategory === 'todo'` already excludes
  anything else once the category above is wired.
- Footprint: `src/state/work.mjs`, `src/state/status-fsm.mjs`,
  `src/state/workflow-stage-graphs.mjs`.
- Verify: `npm test`.

**Piece 2 — `--backlog` flag on `fgos submit`** (`tsk-4rdi`, depends on Piece 1):
- `submitWork`'s `opts.backlog` (new, optional, boolean-ish like the
  existing `opts.async`) — when set, `work.status = 'backlog'` instead of
  the hardcoded `'todo'` literal (`bin/fgos.mjs:921`). `fgos add` is left
  untouched (D2: stays `'todo'` always, no opt-in flag needed there per
  the human's answer — `add` is for already-planned work).
- Footprint: `bin/fgos.mjs`.
- Verify: `npm test`.

**Piece 3 — `discover-pool.mjs` accepts `backlog` for clarify-shaped
stages** (`tsk-1av`, depends on Piece 1):
- Per the item's own acceptance criterion 3 (unchanged by any human
  answer — never contested): split `isCandidate`'s status check so
  `discoverableStages` items (`discovery`/`exploring` for `coding`) accept
  `status IN {todo, backlog}`, while any `decompose`-stage candidate
  (drain-only legacy path) stays strict `todo`-only, unchanged.
- Footprint: `src/state/discover-pool.mjs`.
- Verify: `npm test`.

**Piece 4 — `herdr-plugin` surfaces `backlog` items** (`tsk-584`, depends on Piece 1):
- Add a `backlog` arm to `WorkTab::matches` (`herdr-plugin/src/app.rs`) —
  exact UI treatment (new `Backlog` tab vs. folding into `Todo` with a
  marker) is this piece's own implementation call, constrained by D4's
  sharpened bar: a `backlog` item must be findable through normal TUI
  browsing, not merely non-erroring.
- `next_auto_discover_candidate` (`herdr-plugin/src/main.rs:138-140`)
  needs no logic change — its literal `status == "todo"` check already
  correctly excludes `backlog` — but gains a regression test confirming
  this stays true once the `backlog` status exists.
- Footprint: `herdr-plugin/src/app.rs`, `herdr-plugin/src/main.rs`.
- Verify: `cd herdr-plugin && cargo test`.

## Concrete cases to prove against (high-risk depth)

- Empty/boundary: a `backlog` item with no other fields set (freshly
  created via Piece 2's flag) is excluded from `fgos ready` immediately.
- Existing behavior must not regress: every existing `todo`-status item's
  `ready` membership, `discover-pool` candidacy, and `herdr-plugin` tab
  membership stay byte-identical (no accidental widening of any of the
  three matches).
- Concurrent/partial: an item promoted `backlog -> todo` mid-`exploring`
  (i.e. `fgos-coding-exploring` already ran while it sat in `backlog`, per
  Piece 3) carries its `CONTEXT.md`/decisions forward unchanged — the
  promotion is a pure status move, never a state reset.

## Assumptions (implementation-only, not material to `CONTEXT.md`)

- The `backlog -> todo` edge carries no `reason` field. `CONTEXT.md`'s D1
  settled WHO (human), not whether a written reason is mechanically
  required; a plain edge matches the existing `blocked -> todo` shape and
  needs no new validation branch in `transitionWork`.
- `fgos add` gets no `--backlog` flag (only `submit` does) — explicit in
  the human's own D2 answer ("`fgos add`... vẫn nên giữ default todo").
- Piece 3's "split" is degenerate against today's code: `discover-pool.mjs`
  no longer carries a `decompose`-stage branch at all — `tsk-lya` D10/D11
  already extracted that pool into `plan-pool.mjs`, whose own
  `isCandidate` keeps the strict `status === 'todo'` check. So "the
  decompose-stage candidate stays `todo`-only, unchanged" is satisfied by
  `plan-pool.mjs` staying outside Piece 3's footprint, and
  `discover-pool.mjs`'s single remaining status check — which now only
  ever serves clarify-shaped stages — is the one that widens to
  `{todo, backlog}`. Same behavior Piece 3 describes; only the boundary
  already sits one module over.

## Outstanding questions

None
