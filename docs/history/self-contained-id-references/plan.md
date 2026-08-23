# plan.md — self-contained-id-references (tsk-37i)

Mode: **standard**

Flag count against `fgos-routing`'s Mode-gate table: only 1 of the 10 flags
applies (**existing covered behavior** — extending
`scripts/check-decision-citation-drift.mjs`, which already has
`test/scripts/check-decision-citation-drift.test.mjs` coverage). By flag
count alone that reads tiny/small. Bumped to **standard** anyway on the
"story-sized behavior" clause: this is real, non-mechanical behavior
design (new finding types, a baseline-ratchet mechanism new to this
script, a widened scan surface) landing BEFORE a bulk mechanical edit
across dozens of files can safely run — two genuinely different kinds of
work in sequence, not one direct task. `tiny`/`small` assumes no gray
areas and a couple of files; this has neither, even though every gray
area was already closed in `CONTEXT.md` before this plan was written.
(Confirmed sound by plan review: mode-gate rule text explicitly allows
"2-3 flags, OR story-sized behavior" — the OR clause covers this case.)

**Revision note:** this plan.md was rewritten after an Opus
(`code-reviewer`) soundness review found 3 CRITICAL defects (the original
verify command would pass with the retroactive cleanup entirely
undone), 4 HIGH gaps (missing baseline-generator mechanism, a phantom
`--live` flag, `npm test` wiring never actually specified, 3 pre-existing
unrelated findings that would go red on day one), and several MEDIUM/LOW
issues (a scope hole on `plugins/fgOS/skills`, inflated/wrong file counts,
a stale file citation, an incomplete NEGATIVE pattern). Full report:
`plans/reports/from-code-reviewer-to-planner-260817-1842-tsk-37i-plan-soundness-review-report.md`.
Corresponding `CONTEXT.md` decisions D5-D7 record the scope/precedent
corrections; this file incorporates the implementation-shape fixes.

## Approach

**Chosen path:** the phases `CONTEXT.md` locked (D1-D7) — no new product
decisions made here, only sequencing, file-level detail, and the
implementation-shape corrections from plan review.

**Alternatives rejected (from `DISCUSSION.md`/`CONTEXT.md`, not
re-litigated here):** a brand-new `pointer_integrity.rs`-style third check
script (rejected, D3 — `check-decision-citation-drift.mjs` already owns
the right scan surface); a hard zero-tolerance gate with no baseline
(rejected, D4/D7 — this repo's own `check-decision-codes.mjs` ratchet
precedent is the correct shape to copy); reversal-sweep-on-supersede and
routing-close-gate-on-approve (out of scope entirely, D2 — owned by
`tsk-1lv`); a `--live` CLI mode (rejected during plan review — the check
already defaults to real repo paths, confirmed by running it with no
args; there is no missing "live" capability to build, only a widened
default scan surface, D3/D5).

**Risk map:**

| Component | Risk | What proves it |
|---|---|---|
| Extending `check-decision-citation-drift.mjs` with new finding types + widened scan surface | medium — touches a script with existing test coverage; a regression here could reintroduce false-negatives on the ALREADY-shipped dead-framing check | `npm test` green (existing dead-framing tests untouched/still passing) + new tests for the new finding types, same file |
| Baseline-ratchet mechanism (`--baseline`/`--write-baseline`, new to this script) | medium — new code, but the shape is directly copied from `check-decision-codes.mjs`'s own working `--write-baseline`/`baselineFromFindings()`, not invented fresh | a test asserting a baselined finding does not fail the CLI, a genuinely new (non-baselined) finding does, AND (self-consistency leg, copied from `tsk-3ch`'s own plan) `--write-baseline` followed by a bare re-run against the live repo exits 0 |
| Widened scan surface (`.agents/skills/**/SKILL.md` + `plugins/fgOS/skills/**/SKILL.md`) | low — pure additive glob, same file-reading code path already proven on `docs/backlog.md`/`docs/specs/*.md` | CLI test with skill-prose fixture directories added to the existing tmp-fixture test shape |
| Wiring a real-repo-scan into `npm test` (not just unit tests against synthetic fixtures) | medium — **no local precedent exists for this at all**, corrected during `fgos-coding-validating`'s reality gate: all 3 sibling scripts' own test files use `cwd: dir` against `fs.mkdtempSync` tmp fixtures exclusively, confirmed by grep — including `check-decision-codes.mjs`, which an earlier draft of this row wrongly claimed already does a real-repo run. `package.json` has a `"check:decision-supersession": "node scripts/check-decision-supersession.mjs"` npm script (real repo default args), but `.github/workflows/ci.yml` runs `npm test` only — that script is never invoked by CI either, confirmed by reading the workflow file. This item is introducing a genuinely new pattern for this repo, not copying a proven one — treat the risk accordingly | one new test case in `test/scripts/check-decision-citation-drift.test.mjs`, using `node:test`'s own `assert` (not a raw `spawnSync` against a fixture) against the CLI run with `cwd` = repo root and the checked-in baseline, asserting exit 0 — this is the only mechanism `npm test`/CI actually executes, so it is the only place real enforcement can live |
| Baseline must cover ALL finding kinds at generation time, including the 3 pre-existing `dead-framing` findings (D6) | low once named, high if silently missed — confirmed live today: `node scripts/check-decision-citation-drift.mjs` (no args) reports exactly 3 findings, all pre-existing | the `--write-baseline` run's own output count includes all kinds; a follow-up bare run exits 0 |
| Retroactive cleanup across `.agents/skills`, `docs/specs`, `plugins/fgOS/skills` | low — mechanical, same edit pattern repeated; risk is completeness, not correctness of any single edit | the extended check itself, run with an EMPTY baseline (`--baseline none`, see Verify below — never the checked-in one, which would trivially pass with nothing fixed) |

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

1. `scripts/check-decision-citation-drift.mjs` — add the new finding types
   (bare citation — covering `(D2)`, `(D2, D4)`, a heading-parenthetical
   `(D2 — ...)`, and a slash-list `D1/D2` shape, for ADR/RUL/D-local
   uniformly; and D-local-cited-outside-home), widen the scan surface to
   `.agents/skills/**/SKILL.md` + `plugins/fgOS/skills/**/SKILL.md`, and
   add `--baseline <path>` (default `scripts/check-decision-citation-drift.baseline.json`,
   reserved value `none` = empty baseline, every finding counts as new)
   + `--write-baseline` (copies `check-decision-codes.mjs`'s own working
   shape) (D3, D5).
2. `scripts/check-decision-citation-drift.baseline.json` (new file,
   MACHINE-GENERATED by `--write-baseline`, never hand-written) — the
   checked-in snapshot of every currently-known finding of every kind at
   generation time, including the 3 pre-existing `dead-framing` ones (D4,
   D6).
3. `test/scripts/check-decision-citation-drift.test.mjs` — extend with
   unit tests for the new finding types, the baseline-ratchet logic
   (baselined finding does not fail; new finding does), the
   `--write-baseline` self-consistency leg, AND one real-repo `npm test`
   case (`cwd` = repo root, checked-in baseline, expect exit 0) —
   following the same pure-function + CLI-fixture pattern already in the
   file.
4. `.agents/skills/_shared/citation-format.md` (new file) — the canonical
   citation-format convention (`<ID> (<one-line gloss>)` for ADR/RUL; a
   D-local id is NEVER cited outside its own `CONTEXT.md` at all — inline
   its content and delete the id instead, per `CONTEXT.md`'s pinned term),
   same family as the existing
   `.agents/skills/_shared/capacity-dispatch-fallback.md` (corrected: an
   earlier draft of this plan cited a non-existent
   `executor-dispatch-fallback.md` — that name was reverted by `tsk-34n`,
   `3d5b8d44`).
5. Retroactive cleanup across `.agents/skills/**/SKILL.md`,
   `docs/specs/*.md`, `plugins/fgOS/skills/**/SKILL.md` (D5) — one
   citation-format fix each, per the check's own live output once steps
   1-2 land. Re-measured per class inside the real 3 roots (previous
   "~36-69" range mixed in the `.claude/skills` generated-wrapper
   duplicates and the then-out-of-scope `plugins/` root — see plan review
   M3): **~48 files** with a bare D-local pattern (parens/slash forms),
   **~27 files** with a bare RUL citation (no area suffix), **~11 files**
   with a bare 4-digit ADR pattern — all approximate by hand-grep, to be
   finalized by step 1's own live output, the authoritative count.
   `fgos-coding-shaping/SKILL.md`'s own bare `(D2)`/`(D4)`/`(D6)` citations
   (the concrete example found during exploring) are included in this set,
   not a special case, and per `CONTEXT.md`'s pinned term get INLINED
   (content copied in, id deleted), not glossed.

`fgos graph --json`'s `criticalPath`/`topUnblock` do not surface `tsk-37i`
(no cross-item deps declared, nothing else registered as blocked on it) —
the ordering above is intra-item sequencing only, not informed by that
call beyond confirming there is no cross-item reason to reorder.

## Shape

Phase 1 (files 1-3 above): design + build the extended check, including
the `--write-baseline` generator and its self-consistency leg, then run
`--write-baseline` against the repo's CURRENT state (so `npm test` stays
green the moment this phase lands — the whole point of D4, now including
ALL finding kinds per D6). Phase 2 (file 4): write the shared convention
doc once, since every fix in phase 3 cites it. Phase 3 (file 5):
mechanical cleanup across all 3 roots, shrinking the checked-in baseline
file as each batch of fixes lands (re-running `--write-baseline` after
each batch, never hand-editing the JSON), until it is empty except for
the 3 D6-deferred `dead-framing` lines (explicitly out of scope, not this
item's to fix) plus any other explicitly-waived residual named with a
reason.

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
  occurrence count, and never off a glob exclusion in the verify command
  (an earlier plan draft's `-g '!**/CONTEXT.md'` verify glob wrongly
  exempted EVERY `CONTEXT.md` in the tree, not just an id's own — removed;
  this logic belongs in the check, not the verify line, per plan review
  M5).
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
- **The 3 pre-existing `dead-framing` findings (D6) must land IN the
  generated baseline, not be silently absent from it** — confirmed live
  today (`node scripts/check-decision-citation-drift.mjs`, no args) that
  they exist; a baseline generator that only captures the 2 NEW finding
  kinds would leave `npm test` red on day one for debt this item never
  scoped to clean (plan review H2).

## Split

No split — this stays one item. Both phases are sequential parts of one
coherent feature (`CONTEXT.md`'s own boundary statement), not
independently workable pieces: phase 3 cannot start meaningfully before
phase 1-2 exist, and phase 1-2 alone delivers nothing a user would
recognize as "fixed" (the check would report its full finding count with
nothing done about them). This is a defensible but not a forced choice —
phase 3's only real dependency on phase 1-2 is "the convention doc and
the extended check exist," which is a genuinely splittable-child shape;
kept as one item because the two phases are small enough in combination
to stay a single honest piece of work, not because a split would be
wrong. `fgos-coding-validating` reads this as the `pass-through` verdict.

## Verify

Item's `verify` field currently reads the discovery-stage placeholder
(`"chưa xác định — P15 bổ sung"`) — syncing it to a real command per this
skill's step 5 sync rule. This item touches `.agents/skills/**/SKILL.md`
and `plugins/fgOS/skills/**/SKILL.md` prose paths, so per
`docs/how-to/write-verify-for-a-skill-prose-change.md` the shape is
`npm test && POSITIVE && NEGATIVE`. **Every leg below was reasoned through
a real failure mode found in plan review — none is a restatement of the
original, broken verify.**

```
npm test \
  && test -f .agents/skills/_shared/citation-format.md \
  && grep -qE '<ID>.*one-line gloss' .agents/skills/_shared/citation-format.md \
  && ! grep -q 'D2' .agents/skills/fgos-coding-shaping/SKILL.md \
  && grep -q 'never write CONTEXT.md/plan.md directly' .agents/skills/fgos-coding-shaping/SKILL.md \
  && node scripts/check-decision-citation-drift.mjs --decisions-dir docs/decisions --backlog docs/backlog.md --specs-dir docs/specs --skills-dir .agents/skills --skills-dir plugins/fgOS/skills
```

- `npm test` — regression guard (existing dead-framing tests unmodified) +
  the new finding-type/baseline-ratchet/self-consistency/real-repo unit
  tests all land here too, same file (H1's fix: the real-repo case inside
  `npm test` is what actually wires enforcement in, not a separate script
  invocation nobody runs).
- POSITIVE (`test -f` + first `grep -qE`): the shared convention doc
  exists and states the id+gloss shape in its own words.
- **Fixed (was C2):** the `D2` example is no longer proven by "still cites
  D2, now with a gloss" — that would itself violate decision `0017` (a
  D-local id may never be cited outside its own `CONTEXT.md` at all, gloss
  or not). Proven instead by a NEGATIVE (`D2` no longer appears anywhere
  in the file) plus a POSITIVE pinning the actual inlined content that
  replaced it (a long, distinctive phrase, per skill-prose-verify trap
  #5 — not a weak single-word grep).
- **Fixed (was C3, then refined by D8):** the completeness leg runs the
  check against the CHECKED-IN baseline (standard mode, default path — no
  `--baseline none`). C3's real bug was a STALE baseline snapshotted
  BEFORE any cleanup and never touched again; the fix is not "require zero
  findings of any kind" but "the checked-in baseline must be regenerated,
  as part of this item's own final commit, to reflect genuine post-cleanup
  state." D8 records why: `tsk-3ch`'s own completion bar was never zero
  violations, only zero NEW ones against a checked-in snapshot — this item
  holds itself to the same bar its own precedent set, not a stricter one
  invented during plan review. The real proof of "cleanup happened, not
  skipped" lives in the baseline JSON's own commit diff (reviewable: its
  finding count measurably shrinks from a pre-cleanup scan), not in the
  shell verify line, matching `docs/how-to/write-verify-for-a-skill-
  prose-change.md`'s own boundary (verify proves the mechanism works, not
  full historical completeness — that is review's job).
- **Fixed (was C1):** the old NEGATIVE (`! rg -P ...`) is deleted outright
  — this machine's `rg` build has no PCRE2 (`rg --pcre2-version` confirmed:
  "PCRE2 is not available"), so `-P` made the whole leg exit 2 (engine
  error) on EVERY run, inverted by the leading `!` into a false pass,
  regardless of real repo state. Confirmed by running it: it reported
  green today with pre-existing violations still present. The completeness
  leg above (the extended check itself, `--baseline none`) is the sole
  source of truth for "is any bare citation left" — it is a maintained,
  unit-tested detector covering all 3 id classes across all 3 roots, which
  a hand-rolled shell regex covering the same ground would only ever
  approximate (plan review M4: the deleted regex covered exactly ONE of
  the observed citation shapes, in TWO of the three real roots, and
  covered zero of the RUL/ADR classes).

## Outstanding questions

None
