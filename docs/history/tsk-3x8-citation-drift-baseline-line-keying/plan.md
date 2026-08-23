# Plan: re-key check-decision-citation-drift.mjs's baseline by content, not line

Mode: **small** (0-1 flags per fgos-routing's Mode gate — only "existing
covered behavior" applies: the script already has test coverage that must
keep passing; no auth/data-loss/audit/external-provider/cross-platform/
multi-domain flag applies). No `CONTEXT.md` exists for this feature —
discovery's verdict was `clear`, which skips `exploring` entirely; every
claim below traces to `RESEARCH.md`'s Round 1 (same dir) instead.

## Approach

**Chosen path:** re-key `baselineFromFindings`/`findNewFindings` in
`scripts/check-decision-citation-drift.mjs` to match `check-decision-codes.mjs`'s
own content-keyed shape (`f.text`, the trimmed source line) instead of
`` `${f.kind}:${f.line}:${f.id}` `` (RESEARCH.md Round 1, exact citations:
`check-decision-citation-drift.mjs:157-164` vs `check-decision-codes.mjs:50-57`).
A citation-drift finding has no single canonical "changed line" the way a
decision-code finding does (a `dead-framing`/`bare-citation`/
`d-local-outside-home` finding is about a specific cited id occurring on a
specific line, and two different citations of the same id on different
lines in the same file are legitimately two different findings) — so the
key must still disambiguate by content, not collapse to bare text. The key
becomes `` `${f.kind}:${f.id}:<trimmed line text>` `` — content-anchored
(survives any line-shift elsewhere in the file) while still keeping
distinct occurrences of the same id on different lines distinct from each
other, which a bare-line-content key alone would not (two different lines
citing the same id could coincidentally have identical trimmed text only
in the offset-annotation edge case, not the common one — accepted as a
known, narrow residual case, see Risk map below).

**Rejected alternative:** hashing the whole line + surrounding context
(diff-style context lines). Rejected — adds real complexity (context-window
size, hash stability across whitespace-only edits) for a benefit `${kind}:
${id}:<text>` already gets in the common case, and the narrow residual
(two identical-text citations of the same id in one file) is rare enough
that a human still gets a legible, if occasionally over-broad, diff rather
than a silently corrupted signal.

**Files touched:**
- `scripts/check-decision-citation-drift.mjs` — `baselineFromFindings`
  (:157-164), `findNewFindings` (:149-155): change the key formula in both
  (they must agree on the same key shape by construction).
- `scripts/check-decision-citation-drift.baseline.json` — regenerate via
  `--write-baseline` once the new key shape lands, so the 1645 existing
  findings survive the format migration instead of all reporting as "new"
  on the first post-fix run.
- `test/scripts/check-decision-citation-drift.test.mjs` — extend, not
  replace: keep the existing "baselined finding does not report as new"
  and "NEW finding appended after --write-baseline still fails" tests
  (they still hold under content-keying), add the missing regression case
  (see Shape below).

**Order:** key-formula change first (both functions, one commit), then
tests (would fail against the OLD key shape — writing them first would
just describe the bug a second time), then the one-time baseline
regeneration last (depends on the new key shape being correct, verified by
the new tests, before it's trusted to snapshot 1645 real findings).

**Impact-analysis posture:** `full` per `fgos tool query --capability
impact-analysis --status present` (gitnexus registered, status `present`)
— but the live index is 435 commits behind HEAD
(`mcp__gitnexus__list_repos`), predating this very file
(`scripts/check-decision-citation-drift.mjs` is new-ish, tsk-37i), so
`impact({target:'baselineFromFindings', direction:'upstream'})` returned
`"Target not found"` — a stale-index false-negative, not a clean "no
callers." **Downgraded to degraded** per `CLAUDE.md`'s own gate ("a
suspicious zero-result or 'not found' answer... is worth a quick grep/rg
cross-check before being trusted"). Cross-checked directly: `grep -rn
"baselineFromFindings\|findNewFindings" --include="*.mjs" .` (excluding
node_modules) shows both functions are called ONLY inside
`check-decision-citation-drift.mjs`'s own `runCli` and imported ONLY by
`test/scripts/check-decision-citation-drift.test.mjs` — the same-named
functions in `check-decision-codes.mjs` are a separate module, not shared.
Blast radius is real and small, confirmed by direct grep rather than by
trusting the stale index.

## Risk map

| Component | How risky | What proves it |
|---|---|---|
| Key-formula change (2 functions) | Low — pure function, no I/O, blast radius confirmed contained to this file + its own test (grep cross-check above) | New unit test asserting content-keying survives a line insertion (see Shape) |
| `--write-baseline` regen on the real 1645-finding baseline | Low-medium — a one-time destructive overwrite of the checked-in `.baseline.json`; if the new key formula has a bug, the regenerated baseline could silently under- or over-count | Run the CLI once with `--write-baseline` against the real repo tree post-fix, diff the finding COUNT before/after (must stay 1645 — the fix changes how findings are keyed, never how many exist), then run a bare re-run and confirm "no new findings" before committing the regenerated file |
| F2 (write-baseline still has no diff-protection against real new violations) | Out of scope for THIS item per its own Goal line — flagged, not fixed here (see Outstanding questions) | n/a this item |

Impact-analysis posture: **degraded** (see Approach above) — proof for the
"blast radius contained" claim comes from the grep cross-check, not the
stale gitnexus index; recorded honestly rather than silently trusted.

## Shape

One honest piece of work, no split (pass-through — `fgos-coding-validating`
reads this as its `pass-through` verdict). Concrete cases to prove against,
scaled to `small`:

- **Regression case for F1 (the actual bug):** baseline one finding in a
  fixture file, insert an unrelated line BEFORE it (not append after —
  RESEARCH.md Round 1 confirms the existing test only covers append),
  re-run, assert `findNewFindings` returns empty. This must FAIL against
  today's code and PASS after the fix — the direct regression test for the
  hand-verified 0→64 repro.
- **Existing behavior preserved:** the two existing `--write-baseline`
  CLI-level tests (`test/scripts/check-decision-citation-drift.test.mjs:451-566`)
  keep passing unmodified — content-keying does not change either of their
  assertions.
- **Boundary: two distinct citations of the same id on different lines in
  one file** — assert both still key distinctly (not collapsed into one
  baseline entry) — this is the disambiguation `${kind}:${id}:<text>`
  exists to preserve over a bare-text-only key.
- **One-time migration proof:** after the code fix lands, running
  `--write-baseline` against the real repo tree produces a baseline whose
  total finding count is unchanged (1645) — proves the migration is a pure
  re-keying, not a silent loss/duplication of real findings.

## Verify

`node --test test/scripts/check-decision-citation-drift.test.mjs` — already
synced onto the item's own `verify` field at discovery (item's `verify` was
the discovery-stage placeholder before that sync — see discovery's own
handoff). This is a real, runnable command exercising exactly the code
this plan touches.

## Outstanding questions

None for this item's own scope (fix F1 + F2's `--write-baseline` unfairness
toward the line-keying bug it enables). F2's OTHER half — `--write-baseline`
having no protection against a genuinely new violation being silently
absorbed, independent of line-shift — and F3/F4/F5/F6/F7/F8/F9/F10 from the
item's own description are explicitly out of scope per its own Goal line
(triage/ownership questions, not technical ambiguity) — not reopened here,
not silently dropped either: worth a follow-up item once this fix lands, so
a person can decide whether `--write-baseline` should refuse/warn on
findings not explainable by pure line-shift.
