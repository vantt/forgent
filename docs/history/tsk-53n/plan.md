# Plan: adopt `needs`/`for` on the real capacities in `.fgos/config.json` (tsk-53n)

Mode: **standard** — 2 flags counted per `fgos-routing`'s Mode-gate: existing
covered behavior (the three capacities edited here — `judge-discovery`,
`judge-decompose`, `submit-assist-classify` — govern real, live dispatch for
every fgOS session's judge/classify calls) and weak proof around the area
(the `needs`-keyed presence-check path for a `kind:"cli"` capacity has never
been exercised against a real, production capacity before this item —
`resolveExecutorConfig`'s new branch is proven today only by synthetic tests
added in tsk-1o7). This matches the item's own pre-set `risk: medium` /
`tier: standard`.

Direct-entry into this skill (no `fgos-routing` Orient hand-off this
session — claimed via `/fgOS:pick` → `fgos-coding-driving` straight into
`decompose`): lane decided here per the fallback rule, not re-derived from a
hand-off that never happened.

## Context

`tsk-53n` carries no `docsRef`/`CONTEXT.md` of its own — it is the
`.fgos/config.json`-only split child `tsk-1o7`'s own `plan.md`
(`docs/history/task-demand-declares-needs-for-migration/plan.md`, "### Child
item" section, lines 111–121) already named at plan time, split off
specifically because ADR0020's `fgos-write-rejected` guard permanently
blocks `.fgos/config.json` from ever going through `fgos approve` on a
`fgw/<id>` branch. That parent `plan.md`'s own Context section is the locked
decision source here too (`fgos-clarifying` found `tsk-1o7`'s intent clear
enough to skip a Socratic pass for the whole family; nothing in this split
reopens that):

- **D5** — fgOS accepts US-027: binding matches by *capability promise*,
  never by tool name.
- **D6** — the demand side declares two fields: `needs` (capability → which
  provider) and `for` (purpose `gather`|`judge` → which lane).
- **D15 boundary** (out of scope here too): no `carries` field, no
  `allowCrossProvider` semantic change, no `tier` semantic change.

The parent `plan.md` also pinned one assumption for THIS item specifically:
picking `submit-assist-classify`'s real capability label is "the child
item's own call — not material to [the parent] item's code/test/scope".
That call is made below (Approach, step 1).

`docsRef` is set to `docs/history/tsk-53n` (this directory) via `fgos edit`
so a later session reads this file directly, the same `docs/history/<id>/`
shape the sibling `docs/history/tsk-1o7/iron-law-evidence.md` already uses
for a per-item artifact under the same feature family.

## Blast radius (impact-analysis: **full** — GitNexus registered and
`present`, live-checked 2026-08-09)

This item is data-only (`.fgos/config.json` values) plus one state-store
command (`fgos tool register`) — no source file changes, so a
`resolveExecutorConfig`-style blast-radius query doesn't apply the way it
did for `tsk-1o7`'s own code change. The real risk surface was already read
directly out of `resolveExecutorConfig`'s shipped code
(`src/runner/dispatch.mjs:633-669`) instead:

- **`judge-discovery` / `judge-decompose`** are `kind: "task"`.
  `resolveExecutorConfig`'s presence-check gate at `dispatch.mjs:651` reads
  `capacity.kind !== 'task'` — `kind: "task"` capacities are excluded from
  that gate entirely, `needs` or not. Setting `needs`/`for` on these two is
  therefore pure schema/vocabulary declaration today: **zero functional
  resolution risk**, confirmed by reading the gate condition directly, not
  inferred.
- **`submit-assist-classify`** is `kind: "cli"` — it DOES go through the
  gate. Today it has no `needs`, so it resolves via the pre-tsk-1o7 exact
  name lookup (`tools['submit-assist-classify']`, `dispatch.mjs:667`),
  which the tool registry currently satisfies (`capability:
  "submit-assist-classify"`, a name/capability coincidence — the exact bug
  `tsk-1o7`'s own description named). Once this item sets `capacity.needs`,
  resolution shifts to searching `tools` for `tool.capability ===
  capacity.needs` (`dispatch.mjs:655`) — **this is the one real live risk in
  this item**: if the registered tool's `capability` isn't already
  `classification` (the label chosen below) by the time `.fgos/config.json`
  is edited, the very next live `submit-assist-classify` dispatch throws
  `RunnerConfigError` (loud, not silent — this is the failure mode
  `tsk-1o7`'s presence-check was built to guarantee, per its own two-step
  "registered? / present?" error shape).

## Approach

Chosen path: two independent-mechanism actions inside this one item, run in
a specific order because they land through two different doors with two
different timings.

1. **Pick the real capability label.** `classification` — matches the
   tool's own already-registered `responsibility: "Classification"` field,
   and matches the `docs/history/dispatch-concept-boundary/DISCUSSION.md`
   §7.2 draft the parent `plan.md`'s Assumptions section cited (that doc
   currently lives on `tsk-5td`'s own unmerged branch, not this one — this
   item does not depend on it, only cites it as the prior naming lean).
   Rejected alternative: keep `submit-assist-classify` as both the tool
   name and its capability — this is the literal name/capability
   coincidence `tsk-1o7`'s own description flagged as the bug this whole
   migration exists to fix; keeping it here would defeat the item's own
   purpose.

2. **Re-register the tool under the new capability** (event-log write,
   `fgos tool remove`/`fgos tool register` — "safe on a branch" per the
   parent `plan.md`'s own framing, since neither is a `.fgos/config.json`
   edit and ADR0020's guard only names that one file):

   ```bash
   fgos tool remove --name submit-assist-classify
   fgos tool register --name submit-assist-classify --kind cli \
     --command agy --capability classification \
     --responsibility Classification \
     --description "submit-assist tier/kind/risk classification via agy (gemini backend)"
   ```

   No `edit` sub-verb exists for a tool record (`bin/fgos.mjs`'s `tool` case
   only has `register`/`check`/`query`/`remove`) — remove-then-register is
   the only path, confirmed by reading the CLI's own `case 'tool'` block
   rather than assumed.

3. **This item's branch merges before step 4 runs.** Step 2 is a normal
   event-log write on `fgw/tsk-53n` — it only takes effect on the shared
   main checkout once this item is returned and merged, the same as any
   other code change. Step 4 below must not touch the real
   `.fgos/config.json` until that merge has actually landed, or the config
   would declare `needs: "classification"` before any tool anywhere
   promises it — the exact `RunnerConfigError` window named in Blast
   radius above. Proof point: after merge, `fgos tool query --capability
   classification --status present` returns the re-registered tool BEFORE
   step 4's hand-edit is made.

4. **Hand-edit `.fgos/config.json` on the main checkout** (never through
   `fgos approve` on this branch — ADR0020's `fgos-write-rejected` guard
   blocks it permanently; `docs/how-to/fix-fgos-write-rejected-merge-block.md`,
   precedent `tsk-4eu`/`tsk-5ge`):

   - `capacities.judge-discovery.needs = "llm-judgment"`,
     `capacities.judge-discovery.for = "judge"`
   - `capacities.judge-decompose.needs = "llm-judgment"`,
     `capacities.judge-decompose.for = "judge"`
   - `capacities.submit-assist-classify.needs = "classification"`

   `llm-judgment` (judge-discovery/judge-decompose's `needs`) is pinned as a
   non-material assumption (see Assumptions below) — per Blast radius
   above, `kind:"task"` capacities never reach the code path that would
   resolve this value against a real tool, so no live behavior depends on
   the exact string today. `for: "judge"` is required to be one of
   `CAPACITY_PURPOSES` (`dispatch.mjs:405`, `['gather', 'judge']`) — both
   capacities are literally named `judge-*`, so `"judge"` is the only
   defensible value, not a free pick.

   `submit-assist-classify` gets no `for` — the item's own `verify` script
   only checks `.needs` for this one (not `.for`), matching the parent
   `plan.md`'s own note that "classify" isn't a `gather`/`judge` purpose
   the current vocabulary covers.

5. **Coordination.** Do not run this item in parallel with `tsk-5wz` item
   4 — same `submit-assist-classify` entry point, per the item's own
   description and the parent `plan.md`'s own "Order" note.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| `submit-assist-classify` needs-resolution window | MEDIUM — a real dispatch between the config edit and a matching tool registration throws `RunnerConfigError` | Step 2 (tool re-register) merged and confirmed present via `fgos tool query` BEFORE step 4 (config edit) touches the real file; item's own `verify` script re-checks all three `needs`/`for` fields are set post-edit |
| `judge-discovery`/`judge-decompose` `needs`/`for` | LOW — confirmed zero functional consumer today (`dispatch.mjs:651` excludes `kind:"task"`) | Reading the gate condition directly (done above); `npm test` (item's own verify) stays green since no existing test exercises a `kind:"task"` capacity through the presence-check path |
| Tool remove/register sequencing | LOW | `fgos tool query --capability classification --status present` after step 2, before step 4 |

## Assumptions

- `needs: "llm-judgment"` for `judge-discovery`/`judge-decompose` is this
  item's own pick, not sourced from any existing repo precedent (none
  found: no other `needs` value for a `kind:"task"` capacity exists yet).
  Pinned rather than asked, per the material/grounded/answerable filter:
  `dispatch.mjs:651`'s `kind !== 'task'` gate means this value has zero
  functional consumer today, so it cannot change this item's scope,
  behavior, or acceptance criteria — `tsk-2ie5`, named as `for`'s first
  real consumer in the parent `plan.md`, is free to revisit this label
  later without needing a decision reopened here.

## Outstanding questions

None
