# RESEARCH: review round on tsk-3x8's citation-drift baseline re-key

## Round 1 (tsk-6at, stage discovery)

**Goal:** real code-review pass over what tsk-3x8 landed on `main`
(commits `e4d71a09`/`57533464`) to `scripts/check-decision-citation-drift.mjs`,
its test, and the regenerated baseline — find real bugs, if any.

**Checked:** `scripts/check-decision-citation-drift.mjs` (fresh full read
off `main`), `scripts/check-decision-citation-drift.baseline.json`
(real committed data), `scripts/check-decision-codes.baseline.json` (the
sibling reference model, for comparison), `test/scripts/check-decision-citation-drift.test.mjs`.

**Bug found, real and present-day (not hypothetical): `findNewFindings`
under-detects when a file already has 2+ identical-key findings baselined.**

`findingKey(f)` (`check-decision-citation-drift.mjs:159-161`) is
`` `${f.kind}:${f.id}:${f.text}` ``. `baselineFromFindings` pushes one key
per finding into a per-file ARRAY (`:171-178`, unchanged shape from before
tsk-3x8), so a file with two identical-looking findings (same kind/id/
trimmed-line-text — a real, common shape: a templated table row or a
repeated citation phrase across two spots in one doc) gets that same key
string pushed into the array TWICE. `findNewFindings` (`:163-169`) checks
membership only — `known.includes(key)` — never count. So once a key
appears in the baseline array at all (regardless of how many times),
ANY further occurrence of that exact same key in that file is silently
treated as "already known," forever, no matter how many genuinely new
occurrences of the identical text+id get added later.

**Confirmed empirically against the real, currently-committed baseline**
(`scripts/check-decision-citation-drift.baseline.json`): 7 files already
carry duplicate-key groups today (64 groups total; some appear 3-4×),
e.g. `docs/specs/reading-map.md`'s `d-local-outside-home:D1:...` appears
3×. This is not a constructed edge case — it is live, present-day shape.

**Reproduced the actual consequence directly against the real functions:**
baselined two identical findings (`f1`,`f2`, same kind/id/text, different
lines), then ran `findNewFindings` against `[f1, f2, f3]` where `f3` is a
genuinely new third occurrence of the identical text+id, never seen
before. Result: `0` new findings reported — `f3` should have been
flagged (result should be `1`).

**Confirmed this is a real regression, not pre-existing:** re-ran the
identical scenario against the OLD (pre-tsk-3x8) line-keyed formula
(`kind:line:id`) — it correctly reports `1` new finding, because a line
number is inherently unique per occurrence within a file. The re-key
traded away that "occurrence uniqueness" property as an unintended side
effect of switching to content-keying; nothing in `plan.md`'s own risk
map or Shape section named or accepted this tradeoff.

**Checked, not a bug (as anticipated in the goal):** a citation's line
TEXT changing (without the citation moving) makes `findingKey` produce a
different key, so it reports as "new." This mirrors the sibling
`check-decision-codes.mjs`'s own established behavior (also keys on full
line text) — consistent with precedent, not a regression, and a strictly
narrower false-positive surface than the original line-number bug (only
the edited line itself is affected, not every line below it in the file).

**Checked, not a bug:** no code path reads `f.line` for
identity/dedup — `findingKey` never references it; `line` is used only
for the `message` string and the `ln` display value. `.trim()` correctly
absorbs whitespace-only edits (confirmed by direct read of
`findCitationDriftFindings`/`findCitationFormatFindings`, both call
`.trim()` on the full line before storing `text`).

**Checked, in sync:** regenerated a fresh baseline into a scratch path
(`--baseline /tmp/.../fresh-baseline.json --write-baseline`) and diffed
it byte-for-byte against the real committed
`scripts/check-decision-citation-drift.baseline.json` — identical. The
committed baseline is not stale.

**Checked, existing tests:** `node --test test/scripts/check-decision-citation-drift.test.mjs`
— 29/29 pass, including against this collision bug (none of the existing
tests, old or new-from-tsk-3x8, exercise a file with a duplicate-key
finding — this is exactly why the bug shipped undetected).

**Sibling comparison (flagged, explicitly out of this item's own scope):**
`check-decision-codes.mjs`'s `findNewFindings` has the architecturally
identical membership-only `.includes(f.text)` check — the same class of
bug is latent there too, just currently dormant (0 duplicate-text entries
in its own real baseline today, confirmed by direct count). Not fixed
here — this item's own description scopes to
`check-decision-citation-drift.mjs`; touching the sibling file is a
separate, real follow-up, not silently rolled into this one.

**Fix approach (for planning):** change `findNewFindings` from a
membership check to a per-file occurrence-COUNT consumption — build a
`key -> count` map from the baseline array, and for each candidate
finding, consume one occurrence if any remain (treat as known), else
report it as new. `baselineFromFindings`'s own output shape (array of key
strings per file) stays unchanged — this is a pure fix to the READ side's
matching logic, no format migration needed, no baseline regen required
(the stored data is already correct; only how it's consumed was wrong).

**Verify strategy:** a new regression test asserting the exact repro
above (2 baselined identical-key findings + a genuine 3rd occurrence →
1 new reported, not 0), runnable via the same
`node --test test/scripts/check-decision-citation-drift.test.mjs` surface
tsk-3x8 already uses.

## Round 2 (tsk-6at, deeper "unknown unknowns" pass before merge, per user direction)

**Goal:** look past the already-fixed bug for anything not yet anticipated
— multi-occurrence correctness, determinism, blast radius drift, citation
accuracy in this item's own docs, and unrelated breakage.

**Checked, correct (no bug):**
- **Multiple new occurrences at once** (not just one): 2 baselined + 2
  genuinely new identical-key findings → `findNewFindings` correctly
  reports 2 new (lines 15 and 22), not 1. The fix generalizes past the
  single-extra-occurrence case the regression test covers.
- **Baseline regeneration determinism:** ran `--write-baseline` twice in a
  row against the real repo tree into two separate scratch paths — the
  two output files are byte-identical. No ordering-driven diff churn risk
  from the duplicate-key array shape.
- **Blast radius, re-confirmed post-implementation:** `findNewFindings`/
  `baselineFromFindings` are still called only by this file's own
  `runCli` and imported only by this file's own test — unchanged from the
  planning-time grep.
- **Citation accuracy in this item's own docs** (the exact failure class
  the original bug report's F5 named — checked deliberately, not
  assumed clean): `plan.md`'s gate-note citation of
  `src/state/gate-bypass.mjs:232-233` re-read against the live file —
  still accurate. `RESEARCH.md` Round 1's "7 files / 64 duplicate-key
  groups" claim re-counted against the current committed baseline —
  still exactly 7/64, unchanged (expected: the fix touches read-side
  logic only, never the baseline's own stored shape).
- **Full repo suite** (`node --test 'test/**/*.test.mjs'`, 154 files):
  3504 tests, 3499 pass, 5 skipped (pre-existing, unrelated to this
  change), 0 fail. No unrelated breakage anywhere in the repo.

**Found, real but genuinely out of this item's own scope (flagged, not
fixed):** a source file whose relative path is literally the string
`"__proto__"` breaks `baselineFromFindings` — `baseline[file] = []`
on a plain object attempts to reassign the object's own prototype
instead of creating a normal property, and the following `.push()` then
throws `TypeError: ... .push is not a function`. Confirmed:
- **Pre-existing, not introduced by tsk-3x8 or tsk-6at** — the identical
  `baseline[f.file]`/`baseline[file] = []` shape already existed in the
  script at `d4a5f832` (the commit immediately before tsk-3x8's own
  first commit).
- **Shared by the sibling** `scripts/check-decision-codes.mjs` — same
  plain-object-keyed-by-file-path pattern, same theoretical exposure.
- **Not realistically exploitable here**: `file` values only ever come
  from `path.relative(cwd, ...)` over real directory listings of
  `docs/backlog.md`, `docs/specs/*.md`, and `--skills-dir` roots — local,
  trusted paths this checker's own author controls, never external or
  adversarial input. A real file literally named `__proto__` (no `.md`
  extension survives the `.endsWith('.md')` filter, so it would need to
  be `__proto__.md` specifically, which is even narrower) is not a
  plausible accident.
- **Out of this item's own scope**: fixing it would mean changing the
  baseline's storage keying (e.g. a `Map` instead of a plain object)
  across BOTH checker scripts, not a change to `findNewFindings`'s
  duplicate-key counting logic this item exists to review. Named here as
  a real, cross-cutting hardening follow-up — not silently dropped, not
  silently rolled into this item's own diff either.

**Verdict:** nothing in this item's own scope (`findNewFindings`'s
duplicate-key handling in `check-decision-citation-drift.mjs`) needed a
further fix this round. The one real gap found is pre-existing,
cross-cutting, and belongs to a separate follow-up.
