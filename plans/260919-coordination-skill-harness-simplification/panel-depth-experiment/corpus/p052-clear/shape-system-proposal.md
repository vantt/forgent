# shape-system-proposal (real, asgn_coordinator_driver_op_021)

## Dispatched objective (verbatim)

Propose the strongest 'stay within the current system' architecture for /home/vantt/projects/herdr-gateway/web/src/block-classify.ts's terminal-detail block classification, given the reactive-patching-vs-generalize question. Use absolute paths for everything you read. Also write a short human-readable agent-report.md alongside it. Write your structured result as JSON with exactly this shape: {"status": one of "done"|"blocked"|"failed"|"no-evidence" (lowercase, no other values), "summary": a non-empty string}. You may add any other fields you find useful alongside these two required ones.

## Real agent-result.json

```json
{
  "status": "done",
  "summary": "Recommend staying reactive: keep looksStructured() in web/src/block-classify.ts as a flat, ordered OR-chain of small named detectors, not a pluggable registry. Evidence: the only consumer (terminal-render.ts) reads just block.mode and never detector reasoning; two comparable ordered-heuristic problems elsewhere in the repo (paths.rs Boundary, doctor/checks.rs) use the same flat convention, not a strategy pattern; the original design doc scoped this as a fixed tunable rule, not a plugin surface, and two detectors were already added later outside that scope with no design doc, i.e. reactive patching already works in practice; the test suite (block-classify.test.ts) already documents each detector's originating real-world shape, which is the actual generalization-proofing mechanism; and no corpus exists to generalize against (docs/specs/terminal-detail.md Open Gaps). Proposed guardrails that stay within the current system: state the ordering/monotonicity invariant explicitly above looksStructured() (mirroring paths.rs's 'ordering is the contract'), and keep formalizing new detectors as constant+function+named regression test. Named the one future signal that would justify extracting a Detector[] array (measured false-positive rate requiring runtime-suppressible detectors) as the trigger to revisit, not before.",
  "architecture_decision": "stay-reactive-patching",
  "rejected_alternative": "generalize-to-detector-registry",
  "target_file": "/home/vantt/projects/herdr-gateway/web/src/block-classify.ts",
  "evidence_files": [
    "/home/vantt/projects/herdr-gateway/web/src/terminal-render.ts",
    "/home/vantt/projects/herdr-gateway/web/test/block-classify.test.ts",
    "/home/vantt/projects/herdr-gateway/docs/specs/terminal-detail.md",
    "/home/vantt/projects/herdr-gateway/plans/260811-1426-terminal-dom-renderer-swap/phase-04-block-classifier-and-wrap-policy.md",
    "/home/vantt/projects/herdr-gateway/src/security/paths.rs",
    "/home/vantt/projects/herdr-gateway/src/doctor/checks.rs"
  ],
  "unresolved_questions": [
    "git log for block-classify.ts could not be read in this sandbox (Bash/git access denied, no human present to approve); the 'one commit per detector' claim is inferred from test-file comments and the design-doc gap, not confirmed from commit history."
  ],
  "no_code_changed": true
}
```

## Real agent-report.md (verbatim)

# block-classify.ts — reactive-patching-vs-generalize: recommendation

Target: `/home/vantt/projects/herdr-gateway/web/src/block-classify.ts` (terminal-detail
wrap/pan block classifier).

## Recommendation

**Stay reactive.** Keep `looksStructured()` as a flat, ordered OR-chain of small
named detector functions, each added one at a time when a real terminal-output
shape misclassifies. Do not extract a detector registry / plugin array / rule
engine. Tighten the existing pattern instead of replacing it.

## Evidence (read-only investigation, no code changed)

1. **Consumer indifference.** The only call site,
   `web/src/terminal-render.ts` `buildScreenFragment()` (~line 152/161), reads
   nothing but `block.mode` ("wrap"|"pan") to pick a CSS class. Nothing anywhere
   inspects *why* a block was classified. A generalized/pluggable classifier
   would buy zero consumer value — there is no runtime need to list, disable,
   reorder, or introspect detectors.

2. **Local convention already answered this.** Two comparable "ordered
   heuristic checks" problems elsewhere in this repo are solved the same flat
   way, not with a strategy/plugin array:
   - `src/security/paths.rs` `Boundary` docs state outright: *"The ordering is
     the contract, not an implementation detail."*
   - `src/doctor/checks.rs` `build_checks()` is a single function with
     numbered inline steps pushing `Check` structs.
   No `detectors[]` / `strategies[]` / `rules[]` array-of-functions pattern
   exists anywhere in `web/src` or `src/`. A registry here would be a
   stylistic outlier, not an alignment with house style.

3. **Original design doc scoped it as a fixed rule, not a plugin surface.**
   `plans/260811-1426-terminal-dom-renderer-swap/phase-04-block-classifier-and-wrap-policy.md`
   proposed a fixed 3-clause decision (gutters | box-ratio | pipes → pan, else
   wrap-if-fits, else pan-by-default) with thresholds explicitly called
   "starting points to tune" — never a detector-registry concept. The two
   newest detectors (menu-cursor, "Review your answers" Q&A pairs) were added
   later, outside that doc's scope, with no separate design doc — i.e. the
   reactive-patching workflow already happened twice, informally, and worked.

4. **The test suite is the generalization-proofing mechanism, already in
   place.** `web/test/block-classify.test.ts` has ~19 tests, most named after
   the exact real-world shape that forced a detector (box frame, tree render,
   markdown table, "footer diluted by content" box, numbered menu w/ cursor,
   yes/no menu, plain-numbered-list rejection, single stray arrow rejection,
   Q&A summary). Each new false classification already produces exactly:
   one regression test naming the shape + one small detector function + one
   line appended to the OR-chain. That loop is cheap, low-risk, and matches
   the file's own stated design philosophy (top-of-file comment): being wrong
   is asymmetric (structured-wrongly-wrapped is unrecoverable; prose-wrongly-
   panned is a shrug), so a classifier that hesitates should default to pan
   review, not invest in generality nothing downstream asks for.

5. **No corpus exists to generalize against anyway.**
   `docs/specs/terminal-detail.md` (R21-R28, Open Gaps) explicitly flags that
   real miss rates have never been measured against a corpus. Generalizing
   (e.g. a scored/statistical classifier) would require labeling
   infrastructure that doesn't exist and hasn't been requested — premature
   given YAGNI.

## Concrete guardrails to add now (still "stay within current system")

These strengthen the existing reactive pattern without changing its shape or
touching the consumer contract:

- **Make the ordering invariant explicit**, mirroring `paths.rs`'s Boundary
  comment: add one line above `looksStructured()` stating that clauses are
  independent OR-branches ordered cheapest/most-specific first, and that a
  new clause must only ever *add* pan-classifications — never require
  reordering or touching earlier clauses (this is already true of the code;
  it's just not stated, so a future edit could silently break it).
- **Keep new detectors following the existing three-part shape**: a named
  constant for any threshold, a short function with a comment naming the real
  terminal output it guards, and a regression test with the same name. This
  is already the de facto pattern (see `isFramingRule`, `countSummaryPairs`);
  formalize it as the checklist for the next addition rather than writing it
  down as a new abstraction.

## The one signal that would flip this recommendation

If `docs/specs/terminal-detail.md`'s Open Gaps are ever closed with actual
corpus data showing detectors need to be conditionally suppressed (e.g.
per-locale, per-terminal-app, or a measured false-positive rate that needs
tuning knobs at runtime) — that is the trigger to extract a
`type Detector = (content: string[]) => boolean` array. Not before. No such
requirement exists today.

## Unresolved

- Git commit history for `block-classify.ts` could not be read (Bash/git
  access was denied in this run's sandbox with no human available to approve
  it), so the literal "one commit per detector" pattern is inferred from the
  test-file comments and design-doc gap rather than confirmed from `git log`.
