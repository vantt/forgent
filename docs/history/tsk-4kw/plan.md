# plan.md — tsk-4kw

**Mode: standard**

Flag count: 1 of 10 (`existing covered behavior` —
`test/state/cleanup-harness.test.mjs` covers `checkRetrospectiveContent`
directly, including the two tsk-qrs D10 tests at :399 and :412). No auth,
no authorization, no data model (`addDecision` already accepts `kind`; no
schema changes), no external systems, no public contracts, no
cross-platform, no multi-domain, and no weak proof (the behavior has a
direct unit test).

Why not `small` despite the low flag count: this change **tightens a gate
that decides whether work reaches `done`**, so previously-passing items
start being refused — a real behavioral consequence with a measured size
(3 items, below), not a pure refactor. It also lands in `bin/fgos.mjs`, an
Iron Law path, which raises the evidence bar independently. `high-risk`
would be over-built: no hard-gate flag applies. `audit/security` was
considered and rejected — the audit record is *preserved* in full and
still surfaces in `fgos show` (which does not filter on `kind`); only its
classification changes.

## Problem

`checkRetrospectiveContent` (`src/state/cleanup-harness.mjs:260`) gates
`cleanup → done` on real retrospective content, and since tsk-qrs it
rejects engine bookkeeping:

```js
const hasDecision = (view?.decisionsById?.[id] ?? []).some((d) => d?.kind !== 'engine');
```

Two verbs write engine bookkeeping with **no `kind` at all**. Corrected at
implement time, and it is worse than first recorded: `addDecision` does not
leave the field unset, it **defaults it to `'design'`**
(`src/state/store.mjs:881`, `kind: payload.kind ?? 'design'`). So these two
records do not merely fail to say what they are — the engine actively
labels a mechanical branch merge as a *design decision*, which is a
positive false claim, not an omission. Confirmed by the red test's own
failure output: `'design' !== 'engine'`. The two sites:

- `bin/fgos.mjs:3957` — `sync-root`'s closing `addDecision`
- `bin/fgos.mjs:4161` — `promote-to-component`'s closing `addDecision`

Proven by calling the shipped function (RESEARCH.md round 1): a view whose
only `decisionsById` entry is a `sync-root` record returns
`ok: true, "retrospective content found (a decision record exists)"`,
while the `driver-report` shape correctly returns `ok: false`. This is the
exact hole tsk-qrs closed for one writer, still open through two others.

## Approach

**Chosen: tag both call sites `kind: 'engine'`.**

This is what the field is for, and the census in RESEARCH.md makes it the
conventional answer rather than a new idea: of the 18 `addDecision` call
sites in `src/` + `bin/`, 15 already pass `kind: 'engine'`, one
(`bin/fgos.mjs:1926`, the `fgos decision` verb) correctly omits it because
it records a *person's* decision, and exactly these two are untagged by
oversight. `bin/fgos.mjs:1472` — added to main *after* this defect was
first found — carries the tag correctly, which is direct evidence the
convention is understood and these two are outliers rather than the norm.

**Rejected: match on `source` or on the decision text in
`cleanup-harness.mjs`.** It avoids the Iron Law path, and that is its only
merit. Neither call site passes `source` at all, so this would mean
pattern-matching `text` prefixes (`"sync-root: merged"`,
`"promote-to-component: root"`) — a check that silently stops working the
day either message is reworded, and that pushes knowledge of which verbs
are mechanical into a module that has no business knowing. The engine
already has a field that answers this question exactly; routing around it
to dodge a review gate is the wrong reason to pick a design.

**Rejected: relax the gate to accept any decision again.** That is
reverting tsk-qrs D10, which exists because `fgos-coding-driving` records
a closing report at every stop, leaving the gate permanently green for
every driven item.

### Risk map

| Component | How risky | What would prove it |
|---|---|---|
| `bin/fgos.mjs` ×2 call sites | Low. One added field on an existing payload; `addDecision` already accepts and folds `kind`. | `npm test`. No test anywhere reads the decisions these two verbs write — all 8 test files matching `sync-root\|promote-to-component` were grepped for `decisions\|decisionsById` with zero hits (RESEARCH.md goal 3). |
| The gate itself — items newly refused | **Medium.** Tightening a done-gate means items that used to pass now stop. This is the "the fix creates a new failure" risk and needs a measured number, not a guess. | **Proof point carried to validating:** re-run the flip probe against the live view and confirm the affected set is small, correct, and not mid-flight at `cleanup`/`done`. Measured during Approach: **3 of 658 items flip** (`tsk-25b` and `tsk-tku` at `retrospective`, `tsk-2mt` at `delivered`); none at `cleanup` or `done`, so nothing currently sitting at the gate is newly blocked. All three flip *correctly* — they have no `docType`/`docPath` and their only decision was a mechanical branch sync, so they genuinely never ran retrospective. |
| `fgos show` / audit trail | None. `show` filters decisions by id only, never by `kind` (`bin/fgos.mjs:1946`), so both records stay fully visible. | Read of that line; no behavior change to assert. |

`impact-analysis: degraded` — `fgos tool query --capability
impact-analysis --status present` reports gitnexus `present`, so the
capability is not inactive; but `present` never means the index is fresh
(tsk-j7y), and this repo's index is behind HEAD. Naming the gap plainly:
no claim here rests on that index. The blast radius of both edits was
established by the `addDecision` call-site census and the test grep in
RESEARCH.md, plus the runtime flip probe above — `rg` and real execution,
which is the cross-check `CLAUDE.md` prescribes when an impact answer
cannot be trusted.

## Shape

Phase 1 — **prove it red.**

**Corrected at implement time.** This phase originally said to add the test
to `test/state/cleanup-harness.test.mjs` beside the tsk-qrs tests at
:399/:412. That would have been a **test that passes before the fix**, i.e.
proof of nothing. `checkRetrospectiveContent` is not the defective code —
it already rejects `kind: 'engine'` correctly. The defect is in the two
*writers* in `bin/fgos.mjs`, so a unit test that hand-builds a `view`
literal never exercises them and is green either way.

The red-first test must run the real verb and read what it actually wrote.
`test/cli/fgos-merge.test.mjs` already does exactly that at :213
(`sync-root records a real decision on the root item`, driving the verb end
to end via `makeDriftedRoot` + `run(cwd, ['sync-root', ...])` and reading
`eventLines`), and at :459/:528 for `promote-to-component`. The new tests
go there, asserting two things per verb:

1. the decision event the verb writes carries `kind: 'engine'`;
2. `checkRetrospectiveContent` therefore does NOT accept that item — the
   consequence that makes the tag matter, rather than a bare shape check.

Both are red against unmodified `bin/fgos.mjs` and green after.

Phase 2 — **fix.** Add `kind: 'engine'` to `bin/fgos.mjs:3957` and
`:4161`. Re-run: green.

Phase 3 — **Iron Law.** `bin/fgos.mjs` is a listed module, so
`classifyIronLaw` against the committed diff will return
`required: true`. Write `docs/history/tsk-4kw/iron-law-evidence.md` with
the real failing-before/passing-after transcript, then **stop for a
person** — never `--acknowledge-iron-law`.

Cases worth proving against, at `standard` depth:

- **The defect case** — only a `sync-root` decision, no doc → must be
  refused. (Phase 1's test.)
- **The `promote-to-component` twin** — same shape, same verdict.
- **Must not regress:** a real human decision alongside engine records
  still passes (:412 already asserts this and must stay green).
- **Must not regress:** an item with a real `docType`/`docPath` on disk
  passes regardless of its decisions (:384 asserts this).
- **Boundary:** an item with no decisions and no outcome is unchanged
  (:370).

## Proof surface

`npm test` — the standing answer, and genuinely sufficient here because
the new behavior is asserted by a real unit test rather than a text
search. This is code, not skill prose, so
`docs/how-to/write-verify-for-a-skill-prose-change.md`'s
POSITIVE/NEGATIVE grep shape does not apply.

## Assumptions

- **A1.** `addDecision` folds `kind` through to `decisionsById` unchanged.
  Grounded: `src/state/replay.mjs:357` and `:370-371` spread the whole
  payload (`{ ...event.payload }`) into both the flat `decisions` array
  and the lazy `decisionsById` map, so any field on the payload survives
  the fold.
- **A2.** Tagging these two changes no consumer other than the gate.
  Grounded: `decisionsById` has exactly one non-test reader in the whole
  repo — `cleanup-harness.mjs:260` — and `fgos show`'s decision filter
  (`bin/fgos.mjs:2002`) keys on `id` only.

(Line citations in A1/A2 corrected at validating: both were first written
against base `ebe5674d` and the lines had drifted on `a5a13e76`. The
patterns themselves were re-read on this base and are unchanged — only
the addresses moved.)
- **A3.** No item is mid-flight at `cleanup` in a state this newly blocks.
  Grounded by measurement, not assumption: the flip probe reports 3
  affected items, at `retrospective`/`delivered`, none at `cleanup`.

## Outstanding questions

None
