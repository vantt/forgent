# tsk-18t — plan

Mode: small

0 hard-gate/lane flags apply (no auth, authorization, data-model, audit/
security, external-system, public-contract, cross-platform, or
validation-removal concern — `docs/history/tsk-18t/CONTEXT.md` D1-D3). A
couple of files, no gray areas — decisions are already locked, so this
stays `small` rather than `standard`.

## Approach

**Chosen path:** fix `classifySupersedes`/the comparison at
`scripts/check-decision-supersession.mjs:77` to treat `superseded_by` as
either scalar or list (per CONTEXT.md D1), add fixture tests for both
forms plus the missing-id-in-list case, and add a standalone
`npm run check:decision-supersession` script (per CONTEXT.md D3) — no CI
wiring.

**Alternatives rejected:** wiring the checker into CI/`npm test` (CONTEXT.md
D3, rejected alternative B) — deliberately out of scope, see CONTEXT.md
"Deferred".

**Files touched:**
- `scripts/check-decision-supersession.mjs` — normalize `superseded_by` to
  an array and check membership instead of strict equality.
- `test/scripts/check-decision-supersession.test.mjs` — new fixture cases.
- `package.json` — add `check:decision-supersession` script.

**Order:** single item, no dependencies (`fgos graph --json` shows this
item as its own isolated component — no `criticalPath`/`topUnblock`
consideration applies). Order within the piece: fix the comparison logic
first (it's what the tests assert against), then add tests, then add the
npm script (independent of the other two, can go anywhere but logically
last since it's just a wiring convenience).

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| Comparison-logic change at line 77 | Low | New tests: list form passes, scalar form still passes (regression guard), list missing a required id still reports the error. |
| Real docs/decisions still consistent after the fix | Low | Running `node scripts/check-decision-supersession.mjs` (real `docs/decisions/`, default `--dir`) must report zero of the two `superseded by 0028`/`superseded by 0029` findings that motivated this item (the 3 old-debt findings are expected to remain, per CONTEXT.md "Deferred" — not a regression). |
| New npm script naming/placement | Low | `npm run check:decision-supersession` runs against the real repo; exits 1 with exactly the 3 pre-existing deferred findings (no `superseded by 0028/0029` findings) — not exit 0, since the 3 deferred findings are real and intentionally out of scope (CONTEXT.md "Deferred"). |

**Impact-analysis posture:** full (GitNexus `present`, freshly queried
2026-08-09 — see CONTEXT.md). Ran `impact(classifySupersedes, upstream)`
and `impact(findSupersessionFindings, upstream)`: both report
`impactedCount: 0`, `risk: LOW`, `epistemic: exact`. Cross-checked with
`rg` per CLAUDE.md's "zero-result is worth a cross-check" rule (the
index itself was flagged stale by a separate hook) — confirmed no callers
exist beyond the script's own CLI entry point and its own test file.
Blast radius is genuinely isolated to this one script.

## Shape

One honest piece — no split. The fix, its tests, and the npm script are
one coherent unit of work with a single verify command.

Concrete cases to prove against (matching CONTEXT.md D1 and the item's
own verify field):
- `superseded_by` as a list containing the required id → no
  `missing-frontmatter-pointer` finding (the actual bug).
- `superseded_by` as a scalar matching the required id → still no finding
  (regression guard on existing behavior).
- `superseded_by` as a list missing the required id → finding still
  reported (must not silently swallow a real gap).
- Running the checker against the real `docs/decisions/` directory no
  longer reports the two 0026 findings that motivated this item.

## Assumptions

- The 3 pre-existing findings (`0027` prose-supersedes, `0026` missing
  index row ×2) are out of scope per CONTEXT.md "Deferred" — not this
  item's concern, and their continued presence in real-docs output is
  expected, not a regression.
- `check:decision-supersession`'s default `--dir` (the script's own
  existing `docs/decisions` default, `check-decision-supersession.mjs:118`)
  needs no change — the new npm script can call the script with no extra
  flags.

## D5 — verify field corrected during Implement/Verify

The item's originally-filed `verify` field was Vietnamese prose joined
with `;`. `goal-check.mjs:36` (`fgos return`'s proof mechanism) spawns
`item.verify` literally as one `shell:true` command — under real shell
semantics, `;`-joined commands each run independently and the overall
exit status is whichever command runs *last*. Parsing the original
string, that last segment was `npm test xanh`, so the field's real
mechanical effect (as opposed to its prose intent) was just "run the
whole repo's `npm test`" — none of the specific fixture/false-positive
assertions were actually machine-checked.

Confirmed by literally running the original string as a shell command
(`bash -c '<verify string>'`): exit 1, solely because of 2 pre-existing
failures already present at `branchHeadAtTake` (07fa1304, before this
item's branch existed) — `test/docs/launcher-vocabulary-guard.test.mjs`
(7 unrelated offending files) and `test/runner/dispatch.test.mjs` (the
main checkout's real `.fgos/config.json` missing a
`submit-assist-classify` capacity entry). Neither is caused by, or in
scope for, tsk-18t.

Per user approval (option A, live), rewrote `verify` via `fgos edit
--verify` to a real single command that proves this item's own two
criteria directly, without depending on unrelated repo state:

```
node --test test/scripts/check-decision-supersession.test.mjs && ! (node scripts/check-decision-supersession.mjs | grep -E "superseded by (0028|0029) but its own frontmatter")
```

Verified this command: exits 0 post-fix (all 15 fixture tests pass, the
two false-positive findings are gone from the real `docs/decisions/`
run); would have exited 1 pre-fix (the checker printed exactly those two
lines before the fix). Logged as `fgos decision` D4 on the item.

## Outstanding questions

None
