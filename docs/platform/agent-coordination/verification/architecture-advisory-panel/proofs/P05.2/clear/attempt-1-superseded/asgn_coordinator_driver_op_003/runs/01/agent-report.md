# Terminal-detail block classification: stay-within-system architecture proposal

**Target:** `/home/vantt/projects/herdr-gateway/web/src/block-classify.ts`
**Question:** reactive-patching vs. generalize

## Recommendation

Stay with reactive patching. Do not generalize.

## What's already there

`looksStructured()` is six independent pure detector functions, combined by early-return OR:

1. `stableGutters` — whitespace-aligned tables (`ls -la`, `ps aux`)
2. `isFramingRule` — box-drawn rules that survive dilution as content grows
3. box-char ratio — trees, frames, drawn borders
4. markdown pipe-table column check
5. `MENU_CURSOR_ITEM`/`MENU_ITEM` — Claude Code's own numbered choice menu
6. `SUMMARY_QUESTION`/`SUMMARY_ANSWER` pairs — Claude's "Review your answers" Q&A summary

Each was added in its own commit, each has its own named regex/threshold constants, its own doc comment naming the false positive it guards against and the real capture that motivated it, and its own `describe`/`it` fixture in `web/test/block-classify.test.ts`. The last two commits on this file (`881fa33`, `15b1203`) are exactly this pattern — one newly observed Claude Code UI shape in, one detector out.

This isn't drift — it's speced. `docs/specs/terminal-detail.md` R21–R27 codifies the asymmetric bias directly as a business rule:

> R25: When the screen cannot tell which of the two a block is, it treats it as R22 [pan]. Getting this wrong in the R22 direction leaves the block exactly as it always looked; getting it wrong in the R23 direction would destroy an alignment the reader cannot restore, so the screen never guesses that way.

And the spec's own Open Gaps section already accepts "real miss rates have not been measured against a corpus" as a live, tracked gap — not a call to redesign.

## Why not generalize

The OR-composition of independent detectors is **monotonic**: adding a new detector can only turn more blocks into `pan`, never flip an existing `pan` verdict back to `wrap`. That's what makes R25's safety bias hold automatically, forever, as the file grows — with zero coordination needed between whoever writes detector #7 and whoever wrote #3.

A generalized approach (a weighted/scored/statistical/ML layout classifier, or a "structuredness score" combining signals with thresholds) gives that invariant up. Any scoring model can, in principle, have its output tuned or a new signal added that pulls a previously-`pan` block's score below threshold — silently regressing exactly the failure mode the design exists to prevent. It also adds tuning surface, training/calibration overhead, and a whole new class of "why did this regress" debugging that the current architecture structurally cannot produce. This is disproportionate to a domain where the fallback (`wrap`) is defined as "exactly the behaviour that shipped before" — i.e., cheap to be wrong about, by design.

Per YAGNI/KISS: six detectors is not an unwieldy chain. There is no signal in the codebase (spec, tests, or git history) that the reactive-patching cost has become a real problem — quite the opposite, it's the well-tested, low-risk shipping pattern the last two commits used successfully.

## Concrete guidance for future patches

1. **Keep the convention.** New Claude Code UI shape discovered → one small named pure detector function, own regex/threshold constants, own doc comment (false positive it avoids + the real capture that motivated it), own test fixture using the actual captured lines. This is not a stopgap; it's the intended steady state.
2. **Don't extract a registry yet.** Only mechanically extract the flat if-chain in `looksStructured()` into a `DETECTORS: Array<(content: string[]) => boolean>` + `.some()` once it exceeds roughly 10–12 checks. That's an extraction for readability, not a redesign of the detection logic, and isn't warranted at 6.
3. **Preserve the monotonicity invariant** as the one thing any future refactor of this file must not break: new detectors add `pan`, never remove it.
4. **The spec's open gap (unmeasured miss rate)** is best closed cheaply by continuing to add each newly-discovered real-world shape as a permanent fixture in the test suite — which is already exactly what's been happening — rather than building a separate corpus/regression harness.

## Evidence read

- `web/src/block-classify.ts` (full file)
- `web/test/block-classify.test.ts` (full file)
- `web/src/terminal-render.ts` (confirms `classifyBlocks` is the sole consumer, used per-block for wrap/pan DOM class)
- `docs/specs/terminal-detail.md` (R21–R31, Open Gaps, Pointers)
- `docs/specs/reading-map.md` (located the terminal-detail spec)

## Environment note

Bash was sandboxed to `/home/vantt/projects/herdr-gateway` for this session, so `git log`/`grep` on `block-classify.ts`'s history were unavailable; commit subjects were taken from the git-status summary already in context. All source-of-truth reading used the `Read` tool directly and was sufficient to answer the question.

## Unresolved questions

- None from the repo side. If there is a specific new real-world screen capture that prompted this assignment (a shape none of the six current detectors catch), that capture should be supplied — the recommendation above is "add detector #7 the same way as #1–#6," but no such capture was included in this assignment's context.
