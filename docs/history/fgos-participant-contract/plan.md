# fgos-participant-contract — plan (tsk-64e)

Mode: tiny — one file authored (plus one mechanical index entry), zero
gray areas left after `CONTEXT.md` (D1 locked the only open question).
Flag count against `fgos-routing`'s Mode-gate table: 0 of 10 (no auth, no
authorization, no data model, no audit/security, no external systems, no
public-contract *change* — this doc documents an existing, already-locked
contract, it does not modify one — no cross-platform code, no existing
covered behavior touched, no weak proof, single domain). 0–1 flags →
tiny/small; picked tiny over small because this is genuinely one direct
task (write the page) with the index entry as a mechanical five-line
addendum to that same task, not a second piece of work.

No `fgos-routing` Orient step ran earlier in this session (the item went
`pick` → `fgos-coding-driving` → `fgos-coding-exploring` directly) and `plan.md`
carried no prior `Mode:` line, so this lane was decided here via the
direct-entry fallback, reading `fgos-routing`'s own Mode-gate subsection
rather than re-deriving the thresholds inline.

## Approach

**Chosen path:** write `docs/reference/fgos-participant-contract.md`
(English, per CONTEXT.md D1) as a single compilation page — no new
research, no new spec content, only gathering and citing what
`docs/io-contract.md`, `docs/specs/work-state.md` RUL10,
`src/state/work.mjs`'s `SCHEMA_VERSION`, and `src/state/replay.mjs`
already establish, plus `herdr-plugin/src/fgos.rs` as the worked example.
Structure follows the six content items already named in the item's own
description:

1. Event shape + `SCHEMA_VERSION` (currently `3`), version-token
   commitment per [decision 0011](../../decisions/0011-version-tuong-minh-cho-moi-contract.md).
2. Write door: spawn `fgos <verb>`. State plainly why never
   `.fgos/events.jsonl` directly — the verb inherits lock + CAS +
   validation + identity gate for free, and a second write door violates
   L10 (add-through-not-alongside) and L3.
3. Read door: call a read verb (`list --json`/`ready`/`triage`/`rollup`)
   instead of parsing the raw log. State the cost of the other choice:
   self-parsing means reimplementing `replay.mjs`'s fold, where every
   guard is a bug already paid for.
4. The `fgos.v1` envelope: `{contract, generated_at, data_hash, data}`;
   recognize by JSON-parse + `contract === 'fgos.v1'` check, never a text
   heuristic; success/failure via exit code, never string content.
5. The four envelope-less exceptions (manifest `--help --json`,
   `setup`/`doctor --pretty`, worker log tail, `fgos-runner`
   progress-trace) — quoted from `docs/io-contract.md`'s own "Ngoại lệ có
   lý do" section.
6. Pointer to RUL10 for the rare case of a genuine raw-log writer — not a
   restated spec, a citation.

Plus a worked-example callout citing `herdr-plugin/src/fgos.rs`
(`run_fgos()` line 297, `FgosCliSource`/`WorkItemSource` line 344-371,
envelope check at lines 378/438/468/587/659/710/757) as proof the pattern
already works in a real ~4900-line non-Node crate.

**Alternatives rejected:**
- *Write a new consolidated spec instead of a pointer page* — rejected:
  item's own "not in scope" line rules this out explicitly (RUL10 already
  covers the lock protocol; no new spec needed), and CONTEXT.md's feature
  boundary repeats it.
- *Write in Vietnamese, matching every source doc* — rejected per
  CONTEXT.md D1 (English, matching `docs/reference/`'s own convention and
  the doc's real non-Node-client-author audience).

**Risk map:**

| Component | Risk | What would prove it |
|---|---|---|
| Doc content accuracy vs. the four real sources | low | verify's `grep` checks (`fgos.v1`, `events.lock`, `SCHEMA_VERSION\|schema`) plus this plan's own citations, each traceable to a specific file/line already read during clarify |
| Staying inside declared scope (no new spec, no contract change) | low | nothing in this plan touches `bin/fgos.mjs`, `src/state/*.mjs`, or any spec file — footprint is exactly the two declared files |

No medium/high-risk entries — this is a pure documentation compile with no
code path touched, so `fgos-coding-validating`'s reality check has no blast-radius
proof point to carry forward. Impact-analysis capability gate (`fgos tool
query --capability impact-analysis --status present`): GitNexus `present`
→ **full**, but not load-bearing here since no symbol is edited.

**Files touched, in order:**

1. `docs/reference/fgos-participant-contract.md` — new file, the compiled
   page itself.
2. `docs/enduser-docs-index.json` — new entry, same shape as the existing
   hand-authored `docs/reference/work-item-pipeline-stages-verbs-and-
   handoffs.md` entry: `quadrant: "reference"`, `purpose: "Describe the
   machinery accurately and completely for lookup."`, `audience: "A user
   who needs precise facts about a specific field/command/API."`,
   `docPath: "docs/reference/fgos-participant-contract.md"`, a real
   `title`, `sourceCaptureId: null` (hand-authored, not a
   `fgos-coding-compounding` capture).

Single component in `fgos graph`'s output (no deps, `deps: []` on the item
itself, and CONTEXT.md's originating discussion states this item "blocks
nothing, is blocked by nothing") — no `criticalPath`/`topUnblock` ordering
question applies; there is exactly one piece and one order.

## Split decision

No split. One honest piece of work — a single page plus its index entry,
both landing in the same commit. `fgos graph --what-if` was not run since
there is no candidate set to compare (nothing to split).

## Proof surface

Item's own `verify` (unchanged, already real and runnable):

```bash
test -f docs/reference/fgos-participant-contract.md && grep -q "fgos.v1" docs/reference/fgos-participant-contract.md && grep -q "events.lock" docs/reference/fgos-participant-contract.md && grep -qE "SCHEMA_VERSION|schema" docs/reference/fgos-participant-contract.md
```

## Outstanding questions

None
