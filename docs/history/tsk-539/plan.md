# tsk-539 — plan

Mode: **standard** (3 flags, direct-entry fallback — no lane handed off by
`fgos-routing`, applied its Mode-gate table directly per
`fgos-coding-planning`'s own Bootstrap step): **public contracts** (`ask`/
`answer` are core CLI verbs every skill and every human operator uses),
**existing covered behavior** (real, bounded, not exhaustively enumerated
at planning time — a broadened reality-gate sweep found 15 test files
matching `ask`/`putInAwaiting`/`to: 'awaiting-human'` patterns, up from an
initial 6-file CLI-only scout; enumerating every one precisely is
execution-time work `npm test` surfaces directly and mechanically, not a
planning-time design question — see Risk map below for why this doesn't
change the approach), **weak proof / no precedent**
(zero content-shape validation exists anywhere in this codebase today —
confirmed in `RESEARCH.md` round 1). No hard-gate flag applies (no auth,
no data loss, no audit/security, no external provider, nothing being
removed) — genuinely additive.

## Approach

**Chosen path (corrected at `fgos-coding-validating`'s reality gate —
repo-fit FAIL on the original claim below, real evidence substituted):**
`putInAwaiting` (`src/state/store.mjs:870`) is a thin wrapper over
`moveWork`, itself a shared facade for every status transition, not only
`ask` — the wrong place to add an ask-specific check. The real hook point
is `transitionWork` (`src/state/status-fsm.mjs:211`), which already owns
this exact edge: the `to === 'awaiting-human'` block at lines 259-267
already throws `FsmError('validation', ...)` when `ask` is empty. Extend
that SAME block with the structural-completeness check below, same error
class, right after the existing non-empty check — not a new function, not
a second validation site. This is still every `ask` call regardless of
caller (a skill, a human typing `fgos ask` by hand, a future non-coding
domain), since every edge into `awaiting-human` passes through
`transitionWork` — the "no skill-prose, no citation-checker-extension"
reasoning below is unchanged, only the exact file/function corrected. This
satisfies D11 exactly (real machine enforcement, simple check) and — as a
side effect, for free — also satisfies D9's Markdown requirement for the
ask/gate-approve surface specifically, since the required structure below
*is* Markdown headings.

**Required structure (new, locked here since a Shape decision, not a
CONTEXT.md product decision, per this skill's own remit):** `ask --text`
must contain two Markdown headings, each followed by non-empty content
(trimmed, minimum 20 characters — stated explicitly here, unlike
`isGlossed`'s undocumented 15-character cliff that the tsk-37i audit
flagged as F9, `plans/reports/from-code-reviewer-to-planner-260817-2010-
tsk-37i-post-merge-audit-report.md`):

```markdown
## Context

<what's already known/decided, restated so the reader never opens another
file to follow along>

## Why this matters

<the reasoning that turns that context into the actual problem being
asked about>
```

The question itself is NOT required to sit under a third heading — bullet
1 of `CONTEXT.md`'s locked scope (wording must stand alone) already covers
that; this check only adds the two-heading floor, nothing else. Order of
the two headings is not enforced (either first is fine) — only presence +
non-empty content.

**Alternatives rejected:**
- Extending `scripts/check-decision-citation-drift.mjs` — rejected in
  `CONTEXT.md` already (the checker scans `.md` files on disk, not
  `.fgos/events.jsonl`; wrong surface entirely).
- A skill-prose-only reminder (no code) — rejected: catches nothing when a
  human or a future caller hand-types `fgos ask`, and D8/D11 both call for
  real enforcement, not a convention that has already been proven (152
  measured questions) not to hold on its own.
- A free-text minimum-length check instead of required headings — rejected:
  length alone doesn't distinguish "long and rambling" from "restates
  context and explains why"; the two-heading structure is what makes the
  check *mean* something instead of measuring the wrong thing.

**Risk map:**

| Component | Risk | Proof point |
|---|---|---|
| `transitionWork`'s `to === 'awaiting-human'` block (extended) | Medium — a genuinely new code path on a hot, widely-shared FSM function | `npm test` full suite green; a fresh `ask` missing either heading is rejected with a clear `FsmError('validation', ...)` naming which heading is missing (NEGATIVE); a well-formed one succeeds unchanged (POSITIVE) |
| Existing test call sites (corrected below — repo-fit check found more than the plan's first pass) | Medium — their existing `ask`/`--text` fixtures will fail the new check as written | Update each fixture to the required two-heading shape; `npm test` green proves nothing else regressed |
| Citation-format convention pointer (prose, `fgos-coding-exploring`/`fgos-coding-validating`/`fgos-coding-implement`/`fgos-coding-shaping`) | Low — prose-only, additive | `docs/how-to/write-verify-for-a-skill-prose-change.md`'s POSITIVE/NEGATIVE shape (grep for the pointer line present; grep for the specific old prose absent, where applicable) |

Impact-analysis capability posture (`CLAUDE.md`'s gate): `fgos tool query
--capability impact-analysis --status present` → GitNexus registered,
`present` → **full**. `transitionWork`'s callers are a bounded, greppable
set; this is recorded for completeness, not leaned on for a proof point no
plain `rg` already covers just as well.

**Files touched, in order:**

1. `src/state/status-fsm.mjs` — extend the existing `to === 'awaiting-human'`
   block (lines 259-267) with the two-heading structural-completeness
   check, throwing `FsmError('validation', ...)` naming the missing
   heading(s) — same error class the sibling non-empty-`ask` check right
   above it already uses, no new error class.
2. **Every existing test fixture whose `ask`/`--text` no longer satisfies
   the new check** — deliberately not enumerated exhaustively here.
   Directly confirmed at the reality gate: `test/state/fsm.test.mjs`
   directly unit-tests `transitionWork`, including a sweep test (lines
   178-196) that enters `awaiting-human` with bare short `ask` text
   (`'sweep-test ask'`, `'which auth method?'`) across every
   `todo->awaiting-human`/`doing->awaiting-human` case, plus dedicated
   tests for the non-empty-`ask` rejection this new check sits right next
   to (lines 209-231) — the single most-affected file, confirmed by direct
   `Read`, not grep alone (a grep pass on this same investigation was
   caught returning a corrupted identifier for `transitionWork` — cross-
   verified against source before trusting it, see the how-to note this
   incident produced). `test/runner/anti-loop.test.mjs` also calls
   `transitionWork` but only exercises the `answer`-leaving edge (confirmed
   via `grep -n "to: 'awaiting-human'"` → no hits) — unaffected, not
   touched. Beyond these two directly-confirmed files, a broader sweep
   found up to 15 test files matching `ask`/`putInAwaiting`/`to:
   'awaiting-human'` patterns; the honest, smaller path is not to hand-walk
   all 15 now but to run `npm test` during Execute and fix each real
   failure by adding the required two-heading shape — a uniform, mechanical
   fix with no design choice per file, exactly the ordinary fallout `npm
   test`'s own feedback loop exists to surface. This is not a gap in the
   plan's proof surface: the new check is scoped strictly inside the `if
   (to === 'awaiting-human')` block (confirmed by direct `Read` of
   `status-fsm.mjs:259-267`), so nothing outside that one edge can regress,
   and every regression inside it is the exact same one-line fix.
3. `.agents/skills/fgos-coding-exploring/SKILL.md`,
   `.agents/skills/fgos-coding-validating/SKILL.md`,
   `.agents/skills/fgos-coding-implement/SKILL.md`,
   `.agents/skills/fgos-coding-shaping/SKILL.md` **and their
   `plugins/fgOS/skills/` mirrors** — corrected at the reality gate: these
   mirrors are NOT generated by `tsk-1qi`'s wrapper generator (that
   generator only produces the short `.claude/skills/*` pointer stubs,
   confirmed by `rg -n "plugins/fgOS/skills"` returning zero hits in
   `src/setup/skill-wrappers.mjs`). Direct `diff` confirms the two copies
   are byte-identical today — a manually-synced full duplicate, not a
   generated artifact — so BOTH the `.agents/skills/` and
   `plugins/fgOS/skills/` copy of each of the 4 files need the same
   one-line edit, 8 files total, not 4. Add one line pointing at
   `../_shared/citation-format.md` (D-locked 2026-08-17 citation
   self-containment decision) and naming the required two-heading shape
   above, so an author hits the guidance before hitting the new hard
   validation error, not only after.
4. New test coverage in `test/state/fsm.test.mjs` for the extended
   `to === 'awaiting-human'` check (a direct `transitionWork` unit test,
   same file and style as the existing non-empty-`ask` tests at lines
   209-231, not only the updated fixtures elsewhere) — proves the NEGATIVE
   case explicitly (missing heading → rejected, naming which one) rather
   than relying on the updated fixtures to imply it by omission.

No `fgos graph --what-if` run: there is exactly one buildable piece in
this item (the pieces above are one cohesive change, not independent
candidates competing for order) plus one deferred split (below) — no
ordering choice between competing pieces exists here to inform.

## Shape

Concrete cases to prove against, at `standard` depth:

- **Empty/boundary `--text`** — already rejected today (`requireField`);
  unaffected, still rejected for the same reason before the new check
  even runs.
- **Missing both headings** — rejected, error names both.
- **Missing one heading** — rejected, error names the specific missing one
  (not a generic "malformed" message).
- **Both headings present, one with empty/whitespace-only content** —
  rejected (content-length floor, not just heading presence).
- **Both headings present, correctly filled, in either order** — accepted.
- **Existing behavior that must not regress** — `answer --text` is
  UNCHANGED (this check applies only to `ask`, per `CONTEXT.md`'s own
  framing: the complaint was about questions lacking a stated problem, not
  about answers); `expectedStatus`/CAS behavior, `parentSnapshotAtAsk`, and
  every other `putInAwaiting` field stay exactly as they are today —
  `putInAwaiting` itself is untouched, only `transitionWork`, which it
  calls into via `moveWork`, gets the new check.
- **Concurrent access** — no change to `moveWork`'s existing lock
  discipline (`withEventsLockAndRefresh`, `store.mjs:559`); `transitionWork`
  already runs inside that same locked section today (`store.mjs:571`), so
  the new check runs inside the same existing lock scope, nothing new to
  prove there.
- **Partial failure** — a rejected `ask` call throws before any event is
  appended, same as every other `StoreError('validation')` path in this
  file today; no new partial-write surface.

## Verify

```
npm test && for f in .agents/skills/fgos-coding-exploring/SKILL.md .agents/skills/fgos-coding-validating/SKILL.md .agents/skills/fgos-coding-implement/SKILL.md .agents/skills/fgos-coding-shaping/SKILL.md plugins/fgOS/skills/fgos-coding-exploring/SKILL.md plugins/fgOS/skills/fgos-coding-validating/SKILL.md plugins/fgOS/skills/fgos-coding-implement/SKILL.md plugins/fgOS/skills/fgos-coding-shaping/SKILL.md; do grep -q 'citation-format.md' "$f" || exit 1; done
```

`npm test` is the real proof for the code path (step 1/2/4 above: the new
validator, the updated fixtures, and new dedicated test coverage asserting
both the POSITIVE and NEGATIVE cases directly). The 8-file loop is the
POSITIVE proof for the prose-pointer change (step 3, corrected at the
reality gate to cover both the `.agents/skills/` source and the
`plugins/fgOS/skills/` mirror per file — 4 files, not 2 copies of the same
4), per `docs/how-to/write-verify-for-a-skill-prose-change.md`. No
NEGATIVE leg:
that how-to's NEGATIVE requirement exists to catch a rename/replace
silently deleting its own deliverable — this change is purely additive
(new lines, nothing renamed or removed), so there is no old pattern whose
disappearance needs proving.

## Split

**No split — this item proceeds as itself (`pass-through`).**
`fgos-coding-validating`'s `--verdict decompose --children` is binary: a
split child is born at `stage: executing` and the parent's own remaining
work is exactly what the children array names — there is no mechanism for
"parent does piece A itself, one child does piece B," which would leave
this item anchored on that one child (per the frontier's own
anchored-by-open-children rule) with nothing of its own left to execute.
A one-child decompose here would be that exact wrong shape, not a real
split.

**D9's broader scope (every OTHER paragraph-shaped field — `description`,
`decision.text`/`rationale`/`alternatives` — beyond ask/gate-approve
questions) is real but deliberately NOT this item's own delivery.** Same
pattern this item's own `CONTEXT.md` already uses for `tsk-3uw`/`tsk-5hg`
(named, separate, live items — never a plan.md child of this one): file it
as its own future backlog item once this item's own validator design
(store.mjs choke point, `StoreError('validation')` shape) exists as a real
precedent to build from, rather than guessing its shape now. This item
still delivers real D9 coverage — the ask/gate-approve-question surface,
which the required-headings check above satisfies as Markdown by
construction — just not the full cross-field scope D9 named in the
abstract. `CONTEXT.md`'s own Scout evidence section already named
`addWork`/`editWork`/`addDecision` as the natural seam for that follow-up;
nothing new to add here.

## Outstanding questions

None
