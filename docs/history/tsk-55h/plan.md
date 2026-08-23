# tsk-55h — plan

Mode: tiny

0 hard-gate/lane flags apply (no auth, authorization, data-model, audit/
security, external-system, public-contract, cross-platform, or
validation-removal concern — `docs/history/tsk-55h/CONTEXT.md` D1). A
couple of files, one direct task per problem, decisions already locked —
stays `tiny`.

## Approach

**Chosen path:** two independent, already-fully-specified data fixes,
done together in this one item (per the item's own text — it explicitly
groups both "findings" into one cleanup item):

1. **VAN DE A** — add 4 rows to `docs/decisions/0000-index.md` for
   0026/0027/0028/0029, in the file's existing table format. 0026's row
   states it was superseded twice (0028, 0029), per CONTEXT.md's "Feature
   boundary" and the item's own description (exact row content already
   dictated there).
2. **VAN DE B** — in `docs/decisions/0027-...md`'s frontmatter, rename
   `supersedes: [2ae492d8]` to `supersedes_capture: 2ae492d8` (CONTEXT.md
   D1). No code change to `scripts/check-decision-supersession.mjs` —
   `classifySupersedes` never sees this field once it's renamed, so the
   record no longer classifies as `'prose'`.

**Alternatives rejected:** teaching the checker a "capture-hash" target
kind (CONTEXT.md D1, option A) — rejected per D1's rationale (captures
carry no frontmatter to verify a back-pointer against; simpler to keep
`supersedes:` single-purpose).

**Files touched:**
- `docs/decisions/0000-index.md` — add 4 table rows.
- `docs/decisions/0027-domain-so-huu-status-doan-truoc-delivered-supersede-base-workflow-model-d1-d3.md`
  — rename one frontmatter key.

**Order:** `fgos graph --json` shows tsk-55h as its own isolated
component (no deps, no dependents) — no `criticalPath`/`topUnblock`
consideration applies. Order within the piece: either fix first, since
neither depends on the other; doing VAN DE A first (pure addition) then
VAN DE B (single-line frontmatter edit) is marginally simpler to verify
incrementally.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| 4 new index rows (VAN DE A) | Low | `rg "\[002[6789]\]" docs/decisions/0000-index.md` finds all 4; running the real checker no longer reports either `0026: no row found` finding. |
| 0027 frontmatter rename (VAN DE B) | Low | `node scripts/check-decision-supersession.mjs` no longer reports the `0027: supersedes frontmatter is not a clean list of ids` finding; `parseFrontmatter` still parses 0027 cleanly (no YAML syntax break from the rename). |
| Checker script itself | None | Not touched by this item (CONTEXT.md D1) — its own existing test suite (`test/scripts/check-decision-supersession.test.mjs`) needs no new cases. |

**Impact-analysis posture:** full (GitNexus `present`, freshly queried
2026-08-09 — see CONTEXT.md). Not exercised for implementation: this
item touches no function/symbol (docs/frontmatter only, checker code
unchanged per D1), so there is no blast radius to trace.

## Shape

One honest piece — no split. Both fixes are small, related (same
checker's findings), already fully specified by CONTEXT.md/the item's own
text, and share one verify command.

Concrete cases to prove against (matching CONTEXT.md and the item's own
verify field):
- Real checker run (`node scripts/check-decision-supersession.mjs`)
  reports the pre-existing findings gone (both 0026 missing-row findings,
  the 0027 unparseable-prose finding).
- `0000-index.md` carries exactly one row each for 0026/0027/0028/0029,
  in the existing table format, with 0026's row naming both 0028 and
  0029.
- `docs/decisions/0027-...md` frontmatter parses cleanly
  (`parseFrontmatter`) with `supersedes_capture: 2ae492d8` present and no
  `supersedes:` key left on it.

## Assumptions

- The item's originally-filed `verify` field is `;`-joined Vietnamese
  prose, the same shape `docs/history/tsk-18t/plan.md`'s own "D5" section
  found to be a mechanically-vacuous check (a `;`-joined shell command's
  real exit status is whichever segment runs *last* — here, `npm test
  xanh`, i.e. just "does `npm test` pass", none of the specific
  fixture/count assertions are actually machine-checked). Per that exact
  precedent, this item's `verify` field should be corrected to a real
  single command during Implement/Verify (`fgos-coding-implement`), not
  guessed here — flagged as a known follow-up for that stage, not a gap
  in this plan's own shape.
- No test file needs new cases: the checker's pure functions
  (`classifySupersedes`, `findSupersessionFindings`) are unchanged by
  either fix (VAN DE A only edits doc content the checker reads; VAN DE B
  only removes the one input that used to hit the `'prose'` branch for a
  capture-hash — the branch itself is untouched and already covered by
  existing fixture tests).

## Outstanding questions

None
