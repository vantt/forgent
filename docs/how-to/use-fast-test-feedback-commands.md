# Use The Fast Test-Feedback Commands

`npm test` remains the full-suite Definition-of-Done command — nothing below replaces it.

## `npm run test:canary -- <file...>`

Runs an explicit list of test files first. If any fail, it stops there and
`npm test` never runs — useful for a fast first signal while iterating on a
known area. If the canary is green, it invokes the unchanged `npm test`
exactly once. A green canary is **never** completion proof by itself; only
the full-suite result that follows it is.

```sh
npm run test:canary -- test/state/store.test.mjs test/intake/plan.test.mjs
npm run test:canary -- --from-file /tmp/my-list.txt   # one path per line
```

Any flag-shaped argument (e.g. a reporter) applies only to the canary
sub-run, never to the full suite that follows.

## `npm run test:related -- --explain`

Computes which tests a small, auditable ownership manifest
(`test/test-ownership.mjs`) says are related to your current changes
(committed since `main`, staged, unstaged, and untracked). If every
changed path maps cleanly, it runs **only** that related subset and its
result is authoritative — typically well under a second instead of the
full suite's several minutes. If any changed path is unknown, unsafe, or
a declared full-trigger (`bin/`, `scripts/`, `package.json`, shared
`src/state/` core, `src/verbs/merge/`, etc.), it falls back to running
the unchanged full suite instead — never a narrower, unproven result.

```sh
npm run test:related -- --explain
```

**This is an inner-loop convenience command, not completion proof.**
The manifest currently covers a narrow, reality-checked pilot area
(`src/intake/**`, most of `src/report/**`, and a handful of low-fan-in
leaf modules under `src/state/**`) — real changes very often also touch
something outside that area (docs, other source files, skills), which
correctly falls back to full. `npm test` remains the only Definition-of-
Done command; Work verification, post-merge checks and CI all stay
full-suite, unaffected by this command's existence. Promoted after P05's
evaluation met every threshold (`plans/260920-immediate-test-feedback-reduction/reports/selector-shadow-evaluation.md`)
on an evidence set adapted from the plan's literal 30-historical-commit
design (a real, documented infrastructure blocker made that design
infeasible on this machine; see the report for the full root-cause
chain) — narrower evidence than originally planned, explicitly accepted
by the user rather than assumed.

## `npm run test:related:shadow -- --explain`

Same computation as `test:related`, but **always** runs the unchanged
full suite as well (even when the related subset alone would have been
enough) and prints a comparison — the full-suite result is always
authoritative here, the related result is recorded for ongoing
evaluation only. Useful for continuing to gather agreement evidence
without trusting the narrow result on its own.

```sh
npm run test:related:shadow -- --explain
```
