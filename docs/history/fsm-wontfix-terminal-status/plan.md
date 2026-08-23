# fsm-wontfix-terminal-status — plan

Item: `tsk-1ua`. Decisions: `docs/history/fsm-wontfix-terminal-status/CONTEXT.md` (D1-D5).

## Mode

Flags counted against the mechanical list:

| Flag | Applies? | Why |
|---|---|---|
| data model | yes | `STATUSES` (`src/state/work.mjs:34`) and the FSM transition table (`src/state/fsm.mjs`) are the item schema's own data model. |
| public contracts | yes | `STATUSES` is validated on every `work.add`/`work.move` event and is a contract the CLI (`move`), `docs/specs/work-state.md`'s Data Dictionary #4, and any external consumer of `.fgos/events.jsonl` all read. |
| existing covered behavior | yes | `fsm.test.mjs`, `frontier.test.mjs`, `work.test.mjs`, and `backward-compat.test.mjs` all assert against the current 6-status shape. |
| auth / authorization / audit-security / external systems / cross-platform / weak-proof-area / multi-domain | no | none apply — this is a self-contained state-layer change. |
| story-sized | yes | one coherent behavior (a new terminal status usable end-to-end), not a one-file tweak. |

3 flags, story-sized, no hard-gate flag → **standard**. Not `high-risk`: no
auth/data-loss/audit/external-provider/validation-removal flag fires. Not
`small`: touches 3 modules plus a doc, each needing its own test proof.

## Approach

**Chosen path**: extend the existing FSM/status machinery in place —
add `wontfix` to `STATUSES`, add 3 transition edges to `TRANSITIONS`, and
update `hasOpenDescendant`'s terminal check. No new CLI verb.

**Alternative rejected**: a dedicated `fgos wontfix <id>` CLI verb (mirroring
`fgos reject`). Rejected because the existing generic `move` verb
(`src/cli/command-registry.mjs:146-160`, `fgos move <id> --to <status>
[--reason]`) already accepts any FSM-legal target status and already
accepts an optional `--reason` — exactly the shape D2/D3 need. A dedicated
verb would duplicate that surface for no behavioral gain (YAGNI).

**Reason mechanics**: today `blocked` entry (`todo→blocked`, `doing→blocked`)
does **not** mechanically require a `reason` field in `transitionWork` —
only `proposed→todo`/`proposed→blocked` do. D2's "the same way blocked
reasons already do today" therefore means: `--reason` is accepted (optional,
passed straight through via `move`) and the closure reason is expected to
land in the decision log via `fgos decision`, same convention as existing
`blocked` closures (e.g. tsk-4fu-1). No new mechanical validation is added
to `fsm.mjs` for the `wontfix` edges — consistent with the edges they
mirror.

### Risk map

| Component | Risk | Proof point (validated at `fgos-coding-validating`, executed at `fgos-coding-implement`) |
|---|---|---|
| `src/state/fsm.mjs` (`TRANSITIONS`) | medium — a wrong edge set is a silent modeling bug, not a crash | `fsm.test.mjs`: each of the 3 new edges (`blocked→wontfix`, `todo→wontfix`, `doing→wontfix`) transitions cleanly; every edge OUT of `wontfix` is rejected (`precondition`), mirroring the existing `done`-is-terminal test. |
| `src/state/work.mjs` (`STATUSES`) | medium — every event validator and `backward-compat.test.mjs` reads this list | `work.test.mjs`: `wontfix` accepted as a valid `work.status`; `backward-compat.test.mjs` still green (legacy events with no `v` still replay). |
| `src/state/frontier.mjs` (`hasOpenDescendant`) | low — single boolean predicate | `frontier.test.mjs`: a parent with one `wontfix` child and the rest `done` IS in the frontier (not anchored); a parent with one `blocked` (non-terminal) child is still correctly excluded (regression guard). |
| `docs/specs/work-state.md` (Data Dictionary #4) | none (docs) | manual read-through: row #4's prose lists `wontfix` alongside the other 6, states its 3 entry edges and terminal (no exit). |

`fgos graph tsk-1ua --json` shows `tsk-1ua` as an isolated size-1 component
(no deps, no children today) — no ordering/unblock signal applies; this
plan's phase order is dependency-only (schema before consumers), not
graph-informed.

## Shape (standard — phased plan)

**Phase 1 — state layer.**
- `src/state/work.mjs`: add `'wontfix'` to `STATUSES`.
- `src/state/fsm.mjs`: add 3 `Object.freeze` entries to `TRANSITIONS`
  (`blocked→wontfix`, `todo→wontfix`, `doing→wontfix`); extend the header
  doc comment the same way the `awaiting-human`/`done` edges are already
  documented there (per-edge rationale, citing D1/D3/D4 by ID).
- `src/state/frontier.mjs`: change `hasOpenDescendant`'s check from
  `child.status !== 'done'` to also treat `'wontfix'` as resolved (e.g.
  `!['done', 'wontfix'].includes(child.status)`).
- Tests: `test/state/fsm.test.mjs` (new edges + terminality),
  `test/state/frontier.test.mjs` (wontfix child does not anchor parent),
  `test/state/work.test.mjs` (schema accepts `wontfix`).

Concrete cases to prove: entry from all 3 legal sources; rejection from
`proposed`/`done`/`awaiting-human` (edges that must stay illegal); zero
legal edges out of `wontfix`; a multi-child parent where only the
`wontfix` child is non-`done` is correctly unblocked; a multi-child parent
with a genuinely `blocked` (not `wontfix`) child is still correctly
anchored (regression guard against over-broadening the predicate).

**Phase 2 — CLI + docs surface.**
- No code change expected for the CLI itself (`move` is already generic);
  add one CLI-level test exercising `fgos move <id> --to wontfix --reason
  "..."` end-to-end (from each of the 3 legal source statuses) to lock the
  surface in as intentional, not incidental.
- `docs/specs/work-state.md`: update Data Dictionary row #4 (currently
  documents exactly 6 statuses) to add `wontfix`, its 3 entry edges, and
  its terminal (no-exit) shape, in the same prose style as the existing
  `awaiting-human`/`done` entries in that row.

**Phase 3 — verify.**
- `npm test` full suite green.
- `detect_changes({scope: "compare", base_ref: "main"})` — confirm the
  diff's affected symbols/flows are exactly `STATUSES`, `TRANSITIONS`,
  `hasOpenDescendant`, and their direct test/doc consumers; no unrelated
  symbol touched.

## Split decision

No split. One coherent standard-sized item — schema, predicate, and docs
change together as a single reviewable unit; none of the three pieces is
independently useful without the others (a `wontfix` status with no
`hasOpenDescendant` fix still leaves the frontier bug; the predicate fix
alone has no status to resolve toward). Proceeds as `tsk-1ua` itself, no
child items created.

## Deferred / left to engine

Whether `tsk-4fu-1` and `tsk-5h4`/`tsk-2ib` themselves get moved to
`wontfix` once it exists is explicitly out of this plan's scope (per
CONTEXT.md's own "Deferred to planning" note) — a follow-up application of
this item's output, not part of building the status itself.
