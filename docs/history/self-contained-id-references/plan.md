# plan.md — self-contained-id-references (tsk-37i)

Mode: **standard**

Flag count against `fgos-routing`'s Mode-gate table: only 1 of the 10 flags
applies (**existing covered behavior** — extending
`scripts/check-decision-citation-drift.mjs`, which already has
`test/scripts/check-decision-citation-drift.test.mjs` coverage). By flag
count alone that reads tiny/small. Bumped to **standard** anyway on the
"story-sized behavior" clause: this is real, non-mechanical behavior
design (two new finding types, a baseline-ratchet mechanism new to this
script, a widened scan surface) landing BEFORE a bulk mechanical edit
across ~36-69 files can safely run — two genuinely different kinds of work
in sequence, not one direct task. `tiny`/`small` assumes no gray areas and
a couple of files; this has neither, even though every gray area was
already closed in `CONTEXT.md` before this plan was written.

## Approach

**Chosen path:** exactly the two phases `CONTEXT.md` already locked (D1-D4)
— no new decisions made here, only sequencing and file-level detail.

**Alternatives rejected (from `DISCUSSION.md`, not re-litigated here):** a
brand-new `pointer_integrity.rs`-style third check script (rejected, D3 —
`check-decision-citation-drift.mjs` already owns the right scan surface);
a hard zero-tolerance gate with no baseline (rejected, D4 — this repo's own
`tsk-3ch` precedent shows that breaks `npm test` red on debt this item
never scoped to clean in one pass); reversal-sweep-on-supersede and
routing-close-gate-on-approve (out of scope entirely, D2 — owned by
`tsk-1lv`).

**Risk map:**

| Component | Risk | What proves it |
|---|---|---|
| Extending `check-decision-citation-drift.mjs` with 2 new finding types + widened scan surface | medium — touches a script with existing test coverage; a regression here could reintroduce false-negatives on the ALREADY-shipped dead-framing check | `npm test` green (existing dead-framing tests untouched/still passing) + new tests for the 2 new finding types, same file |
| Baseline-ratchet mechanism (new to this script) | medium — the ratchet logic itself (`is this finding already in the baseline?`) is new code with no precedent IN THIS SCRIPT, even though the pattern is proven in `check-decision-codes.mjs` | a test asserting a baselined finding does not fail the CLI, and a genuinely new (non-baselined) finding does |
| Widened scan surface (`.agents/skills/**/SKILL.md`, not scanned today) | low — pure additive glob, same file-reading code path already proven on `docs/backlog.md`/`docs/specs/*.md` | CLI test with a skill-prose fixture directory added to the existing tmp-fixture test shape |
| Retroactive cleanup of ~36-69 files | low — mechanical, same edit pattern repeated; risk is completeness, not correctness of any single edit | the extended check itself, run live, reports zero non-baseline findings after cleanup |

Impact-analysis capability posture (`fgos tool query --capability
impact-analysis --status present`, re-checked at planning time): 1
provider, `gitnexus`, `status: "present"`, but this session's own tool
hooks flag the index stale ("last indexed 7bb3231"). Per `CLAUDE.md`'s
gate this reads **degraded** — present but not confirmed fresh. Recorded
per the gate's own requirement; not load-bearing for this plan, since
nothing here is a code-symbol edit GitNexus's blast-radius view would
meaningfully cover (this is a script-behavior extension + prose edits, not
a call-graph change).

**Files likely touched, in order:**

1. `scripts/check-decision-citation-drift.mjs` — add the 2 new finding
   types (bare citation, D-local-cited-outside-home) and widen the scan
   glob to include `.agents/skills/**/SKILL.md` (D3).
2. `scripts/check-decision-citation-drift.baseline.json` (new file) — the
   checked-in snapshot of every currently-known finding, same shape as
   `scripts/check-decision-codes.baseline.json` (D4).
3. `test/scripts/check-decision-citation-drift.test.mjs` — extend with
   unit tests for the 2 new finding types + the baseline-ratchet logic,
   following the same pure-function + CLI-fixture pattern already in the
   file.
4. `.agents/skills/_shared/citation-format.md` (new file) — the canonical
   citation-format convention (`<ID> (<one-line gloss>)`, never bare),
   same family as `.agents/skills/_shared/executor-dispatch-fallback.md`.
5. `~36-69 files` under `.agents/skills/**/SKILL.md` and `docs/specs/*.md`
   — retroactive cleanup, one citation-format fix each, per the check's
   own live output once step 1-2 land. `fgos-coding-shaping/SKILL.md`'s
   own bare `(D2)`/`(D4)`/`(D6)` citations (the concrete example found
   during exploring) are included in this set, not a special case.

`fgos graph --json`'s `criticalPath`/`topUnblock` do not surface `tsk-37i`
(no cross-item deps declared, nothing else registered as blocked on it) —
the ordering above is intra-item sequencing only, not informed by that
call beyond confirming there is no cross-item reason to reorder.

## Shape

Phase 1 (files 1-3 above): design + build the extended check, ratchet
against a FRESH baseline generated from the repo's CURRENT state (so
`npm test` stays green the moment this phase lands — the whole point of
D4). Phase 2 (file 4): write the shared convention doc once, since every
fix in phase 3 cites it. Phase 3 (file 5): mechanical cleanup, shrinking
the baseline file as each batch of fixes lands, until the baseline is
empty or reduced to an explicitly-waived residual.

Edge cases worth proving, at standard-mode depth:

- **A citation that already has SOME parenthetical text, but it isn't a
  gloss** (e.g. `(see below)`) — must the check tell this apart from a
  real gloss? Per D3's pinned term, the check only proves STRUCTURE
  (id + a real file/heading a pointer resolves to), never gloss CONTENT
  accuracy — so `(see below)` passes the machine check and fails only
  human review. Document this boundary explicitly in the check's own
  `--help`/header comment so a future reader doesn't expect content
  judgment from it.
- **A D-local id that legitimately appears twice inside its OWN
  `CONTEXT.md`** (e.g. once in the decisions table, once in prose below)
  — must not false-positive as "cited outside home." The finding logic
  keys off FILE PATH (is this file the id's own `CONTEXT.md` or not), not
  occurrence count.
- **A citation inside a fenced code block or a quoted historical
  example** — beegog's own convention (scouted in `DISCUSSION.md` round
  6) treats a quoted/live citation as a real promise and a fenced/unquoted
  one as prose-about-a-path. Apply the same distinction here: skip fenced
  code blocks when scanning, matching the existing script's own file-read
  shape (it already reads line-by-line prose, not embedded code).
- **Existing dead-framing findings (the ALREADY-shipped check) must not
  regress** — the new finding types are additive; run the full existing
  test suite for this file unmodified as a regression guard, not just the
  new tests.

## Split

No split — this stays one item. Both phases are sequential parts of one
coherent feature (`CONTEXT.md`'s own boundary statement), not
independently workable pieces: phase 3 cannot start meaningfully before
phase 1-2 exist, and phase 1-2 alone delivers nothing a user would
recognize as "fixed" (the check would report ~36-69 known findings with
nothing done about them). `fgos-coding-validating` reads this as the
`pass-through` verdict.

## Verify

Item's `verify` field currently reads the discovery-stage placeholder
(`"chưa xác định — P15 bổ sung"`) — syncing it to a real command per this
skill's step 5 sync rule. This item touches `.agents/skills/**/SKILL.md`
prose paths, so per `docs/how-to/write-verify-for-a-skill-prose-change.md`
the shape is `npm test && POSITIVE && NEGATIVE`:

```
npm test && test -f .agents/skills/_shared/citation-format.md && grep -qE '<ID>.*<one-line gloss>' .agents/skills/_shared/citation-format.md && grep -qE 'D2 \([^)]{10,}\)' .agents/skills/fgos-coding-shaping/SKILL.md && node scripts/check-decision-citation-drift.mjs --live --baseline scripts/check-decision-citation-drift.baseline.json && ! rg --hidden -g '!node_modules' -g '!.git' -g '!**/CONTEXT.md' -P '\((?:D[0-9]+[a-z]?)(?:,\s*D[0-9]+[a-z]?)*\)' .agents/skills docs/specs
```

- `npm test` — regression guard (existing dead-framing tests) + the new
  finding-type/baseline-ratchet unit tests land here too, same file.
- POSITIVE (`test -f` + first `grep -qE`): the shared convention doc
  exists and states the id+gloss shape in its own words.
- POSITIVE (`grep -qE 'D2 \([^)]{10,}\)'`): the concrete known violation
  found during exploring — `fgos-coding-shaping/SKILL.md`'s `D2` citation
  — now carries an actual gloss (≥10 chars inside the parens, not an empty
  or trivial one).
- Live check (`node scripts/check-decision-citation-drift.mjs --live
  --baseline ...`): exits 0 once every non-baseline finding is fixed — the
  authoritative completeness proof for the ~36-69 file cleanup, reusing
  the check's own tested logic instead of a hand-rolled duplicate scan
  (avoids trap #5 from the skill-prose verify how-to: a weak ad hoc grep).
  `--live`/`--baseline` are this plan's proposed flag names for the new
  real-repo-scan mode (phase 1's own deliverable) — the implementer may
  rename them if a stronger existing convention surfaces, but the
  BEHAVIOR (default to real repo paths, respect a baseline file, exit
  non-zero only on a non-baselined finding) is the locked contract.
- NEGATIVE (final `! rg ...`): no bare `(D<n>[,D<n>...])` pattern survives
  anywhere in `.agents/skills/` or `docs/specs/` — `--hidden` (trap #4,
  skill dirs are hidden), explicit `node_modules`/`.git` exclusion (trap
  #2 shape), path-glob exclusion for `CONTEXT.md` (where a bare `D<n>` is
  the correct, locked-in-place local label, never a violation).

## Outstanding questions

None
