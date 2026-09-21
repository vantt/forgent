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

## `npm run test:related:shadow -- --explain`

Computes which tests a small, auditable ownership manifest
(`test/test-ownership.mjs`) says are related to your current changes
(committed since `main`, staged, unstaged, and untracked), runs that
related subset, then **always** runs the unchanged full suite as well, and
prints a comparison. The full-suite result is always the authoritative
exit status — the related result is recorded for evaluation only.

```sh
npm run test:related:shadow -- --explain
```

This is shadow mode only. There is no `test:related` command yet — the
manifest currently covers a narrow, reality-checked pilot area
(`src/intake/**`, most of `src/report/**`, and a handful of low-fan-in
leaf modules under `src/state/**`); anything else escalates to a full-suite
run. P05's evaluation (`plans/260920-immediate-test-feedback-reduction/reports/selector-shadow-evaluation.md`)
met every promotion threshold on an adapted evidence set (real
fault-injection + real sampled edits on the current tree, not the
plan's literal 30-historical-commit design) — promoting to an adopted
`test:related` command is a deliberate follow-up decision, not
automatic just because the shadow numbers are green.
