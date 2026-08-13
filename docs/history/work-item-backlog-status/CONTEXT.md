# work-item-backlog-status — decisions

Item: `tsk-5wr`. Add a globally-shared `backlog` status before `todo` in
the work-item lifecycle — a place for "idea not yet committed to work",
distinct from `todo` ("committed, ready to start"). `backlog` is a
PHO QUAT (universal, domain-agnostic) status, symmetric with the four
tail-segment statuses (`delivered`/`retrospective`/`cleanup`/`done`) that
decision 0027 already fixed as global-only, never domain-relabeled. It sits
in front of the six domain-owned front-segment statuses (`todo`/`doing`/
`blocked`/`awaiting-human`/`awaiting-approval`/`wontfix`).

Builds on `docs/history/work-item-backlog-status/RESEARCH.md` (the
`fgos-researching` discovery pass, verdict: clear — every file/decision-doc
citation in the item's own description checked out against the real code,
line-number drift only). This doc locks the three open product decisions
that pass named, plus a fourth (herdr-plugin scope) surfaced during the
`awaiting-human` gate for this item.

## Pinned terms

- **`backlog`** — a new literal `status` value (`work.mjs`'s `STATUSES`),
  never a domain-relabeled status. Means "an idea, not yet decided whether
  to commit to." Distinct from `todo` ("decided, ready to start").
- **Never `propose`/`proposed`** — decision 0024 already retired that
  vocabulary (renamed to `awaiting-approval`, "abstract noun, doesn't say
  what it's waiting for"). Reusing it for a completely different meaning
  (initial-intake, not review-pending) would resurrect a deprecated term
  and confuse old git history/docs. `backlog` is the correct name per the
  item's own acceptance criterion 2 and the human answer below.

## Locked decisions

| D-ID | Decision |
|------|----------|
| D1 | The new `backlog -> todo` edge in `status-fsm.mjs`'s `TRANSITIONS` is fired only by a human. |
| D2 | `fgos submit` and `fgos add` both keep `status: 'todo'` as their default. A new dedicated entry point is added, in scope, to create an item directly at `backlog`. |
| D3 | `backlog` gets its own `statusCategory`, not a reuse of `'todo'`. |
| D4 | `herdr-plugin`'s `WorkTab::matches`/`next_auto_discover_candidate` fix is in scope for this item, not a follow-up. |

### D1 — role on `backlog -> todo`

**Decision:** Only a human fires `backlog -> todo`. Mirrors how
`awaiting-approval -> todo`/`awaiting-approval -> blocked` (a rejection) and
`answer`/`reject` already work in this codebase — a real commitment
decision ("start actually doing this now"), not a mechanical move.

**Grounding:** `transitionWork` (`src/state/status-fsm.mjs:202-271`) never
enforces `role` as an ACL — `role` is attribution-only, stamped onto the
event payload (`store.mjs`'s `moveWork`, lines ~502-509) and never checked
against the requested edge. The existing "human-only" edges in this
codebase (e.g. `move --to delivered`/`approve`/`done`, `bin/fgos.mjs:1481`,
`:3075`, `:3106`, `:4209`) all hardcode `role: 'human'` in the CLI handler
that exposes them, rather than authenticating the caller. `backlog ->
todo` should follow the identical shape: whichever verb/flag exposes this
edge stamps `role: 'human'` unconditionally, the same convention already
used everywhere else in this codebase for a "real commitment, not a
mechanical hop" edge. This is an implementation detail for
`fgos-coding-planning` to place (a `move`-flavored dedicated verb, or a
generic edge with `role` inferred by the CLI entry point) — not a new
runtime authorization layer, since none exists anywhere else in this
codebase today (YAGNI: don't invent one just for this edge).

### D2 — default status stays `todo`; new opt-in entry point for `backlog`

**Decision:** `fgos submit` (free-form intake) and `fgos add` (explicit
field, already-planned work) both keep creating items at `status: 'todo'`
by default — including items created through `/fgOS:cook`, since that path
always has an immediate execution plan. To mark an item as backlog from
the moment of creation, a new dedicated helper is added (e.g. a
`/fgos:backlog <text>` slash command, or a `--backlog` flag on `fgos
submit`) that creates the item directly at `status: 'backlog'` instead of
requiring submit-then-move. This helper is in scope for this item.

**Grounding:** verified directly in the current code, not just the item's
own description —

- `fgos add` hardcodes `status: 'todo'` (`bin/fgos.mjs:1146`).
- `submitWork` (backing `fgos submit`) hardcodes `status: 'todo'`
  (`bin/fgos.mjs:921`).

No behavior change to either existing default; the new helper is
additive. Exact command/flag shape (a new slash command vs. a `submit`
flag) is an implementation choice for `fgos-coding-planning`, not locked
here — see Outstanding questions below.

### D3 — `backlog` gets its own `statusCategory`

**Decision:** `backlog` is mapped to a NEW, dedicated `statusCategory`
value, never folded into `'todo'`'s existing category.

**Grounding — this is already reserved, unused, in the schema today:**
`STATUS_CATEGORIES` (`src/state/work.mjs:127-134`) already declares
exactly `['backlog', 'todo', 'in-progress', 'review', 'completed',
'canceled']` — `backlog` is already in the frozen category list, with the
schema's own comment noting it is declared "Linear-style" up front even
though "`backlog` and `completed` have no status mapped into either of
them today" (`work.mjs:115-119`). This item is exactly what maps a real
status into that already-reserved category — no new category needs
inventing, only wiring `DOMAINS.coding.statusLabels`
(`workflow-stage-graphs.mjs:274-281`) to map `backlog -> 'backlog'`.

**Consequence confirmed by RESEARCH.md, carried forward here:**
`frontier.mjs`'s `isReadyStatus` (`frontier.mjs:150`) is a *positive*-match
filter — `item.statusCategory === 'todo'` (falling back to the literal
`item.status === 'todo'` only when `statusCategory` is undefined) — not an
exclusion list. Once `backlog` carries its own distinct `statusCategory`,
`frontier.mjs` already excludes it from `ready` for free, the same
mechanism that already excludes `doing`/`blocked`/`awaiting-human` today.
Acceptance criterion 7 ("frontier.mjs phải loại backlog... mirror cách nó
đã loại awaiting-human") is answered by this same mechanism — no separate
frontier-side code change needed. This sharpens, and closes,
RESEARCH.md's still-open point 3.

### D4 — herdr-plugin fix is in scope, and must make `backlog` items genuinely visible

**Decision:** Fixing `herdr-plugin` so `backlog` items are visible and
correctly excluded from unattended auto-discover is in scope for this
item, not split into a follow-up. Sharpened by human answer: the bar is
not "doesn't error/crash" — it is that a person browsing the TUI can
actually SEE a `backlog` item exists. `backlog -> todo` is a human-only
edge (D1), fired from a person's own judgment; a `backlog` item invisible
in the one interactive surface a person uses to browse work items would
never get promoted to `todo` at all, defeating the whole feature.
Whichever concrete UI shape `fgos-coding-planning` picks (new `Backlog` tab vs.
folding into `Todo` with a marker — still open, see below) MUST satisfy
this: a `backlog` item is findable/visible through normal TUI browsing,
not just non-erroring.

**Grounding:**

- `WorkTab::matches` (`herdr-plugin/src/app.rs:120-125`) is a 4-arm
  exhaustive match over exactly 4 tabs (`Todo`/`Doing`/`Review`/`Done`),
  each a literal `status ==`/`matches!` check with no `backlog` arm — an
  item at `backlog` matches none of the 4 tabs and is invisible in the UI
  today.
- `next_auto_discover_candidate` (`herdr-plugin/src/main.rs:138-140`)
  literal-matches `item.status == "todo"` — a `backlog` item is correctly
  excluded from unattended auto-discover launch (this part already works
  correctly by construction, no fix needed there), but the invisibility
  above means a person browsing the TUI has no way to see a backlog item
  exists at all, which is the actual problem needing a fix.

Exact UI shape (a new `Backlog` tab vs. folding backlog items into the
existing `Todo` tab with a visual marker) is an implementation choice for
`fgos-coding-planning`, not locked here — see Outstanding questions below.

## Scout evidence (this pass, `fgos-coding-exploring`)

- `src/state/work.mjs:83-93` (`STATUSES`), `:100-134` (`STATUS_CATEGORIES`
  + its own doc comment already anticipating `backlog`) — read directly.
- `src/state/status-fsm.mjs:99-161` (`TRANSITIONS`, full table),
  `:202-271` (`transitionWork`, confirms `role` is attribution-only, never
  an ACL check) — read directly.
- `src/state/discover-pool.mjs:1-51` (`isCandidateStage`/`isCandidate`,
  confirms the literal `item.status === 'todo'` check RESEARCH.md already
  flagged) — read directly.
- `src/state/frontier.mjs:138-151` (`isReadyStatus`, positive-match
  confirmed), `:244-251` (`TAIL_RESOLVED_STATUSES`) — read directly.
- `src/state/workflow-stage-graphs.mjs:270-300` (`DOMAINS.coding
  .statusLabels`, `parkReason` framing) — read directly.
- `bin/fgos.mjs:1127-1170` (`add` case, `status: 'todo'` literal),
  `:1271-1313` (`submit` case), `:902-950` (`submitWork`, `status: 'todo'`
  literal) — read directly.
- `herdr-plugin/src/app.rs:70-125` (`discover_eligible`, `WorkTab` enum +
  `matches`), `herdr-plugin/src/main.rs:125-140`
  (`next_auto_discover_candidate`) — read directly.
- `fgos tool query --capability impact-analysis --status present` —
  GitNexus registered and `present` on this machine (posture: **full**,
  per `CLAUDE.md`'s capability gate). Informational only; this skill edits
  no code.

## Canonical references

- `docs/decisions/0024-doi-ten-status-proposed-thanh-awaiting-approval.md`
  — why `propose`/`proposed` is retired vocabulary (grounds the naming
  decision, pinned terms above).
- `docs/decisions/0027-domain-so-huu-status-doan-truoc-delivered-supersede-base-workflow-model-d1-d3.md`
  — establishes the tail-segment statuses as global-only; `backlog` is
  symmetric with that precedent at the front of the lifecycle.
- `docs/history/phase-2-status-category-schema/` (`CONTEXT.md`/
  `DISCUSSION.md`/`plan.md`) — original `statusCategory` foundation design.
- `docs/history/work-item-backlog-status/RESEARCH.md` — this item's own
  `fgos-researching` discovery pass (verdict: clear), which this doc
  builds on directly.
- `plans/reports/research-260730-0931-work-item-schema-multi-domain-upgrade-report.md`.

## Outstanding questions

- Exact shape of the new backlog-creation entry point (D2): a dedicated
  `/fgos:backlog <text>` slash command vs. a `--backlog` flag on `fgos
  submit`. Implementation choice, for `fgos-coding-planning`.
- Exact shape of the `backlog -> todo` edge's human-only enforcement (D1):
  a new dedicated CLI verb vs. a flag on the existing `move` verb, and
  whether it needs a `reason`/confirmation field the way
  `awaiting-approval -> todo` does. Implementation choice, for
  `fgos-coding-planning`.
- Exact herdr-plugin UI shape for surfacing `backlog` items (D4): a new
  `Backlog` tab vs. folding them into the existing `Todo` tab with a
  marker. Implementation choice, for `fgos-coding-planning`.
