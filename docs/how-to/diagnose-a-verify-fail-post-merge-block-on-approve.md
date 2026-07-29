---
type: how-to
title: How to diagnose an `fgos approve` blocked by `verify-fail-post-merge`
tags: []
timestamp: 2026-07-29T15:01:43.000Z
source_capture_ids: [tsk-2z3]
---
# How to diagnose an `fgos approve` blocked by `verify-fail-post-merge`

Use this when `fgos approve <id>` reports `to: "blocked"`,
`reason: "verify-fail-post-merge"`, but you have already verified your own
change is correct in isolation — before assuming your merge itself is
broken, rule out an unrelated failure elsewhere in the full suite first.

## Before you start

- This applies specifically to `approve` (the merge-into-main step, run
  from the main checkout, after `fgos return` already moved the item to
  `proposed`) — not to `return`'s own verify. `return`'s own unrelated-
  failure case is a separate, related how-to (see Related below).
- `approve` stages the merge, runs the *full* test suite (not just the
  item's own recorded `verify` command — `npm test` runs every
  `test/**/*.test.mjs` file regardless of what string was recorded), and
  rolls the merge back cleanly if that full run fails. `main` is never left
  broken by a failed `approve` — the item is parked `blocked` instead.

## Steps

1. **Read the actual failure, don't assume.** `approve`'s JSON response
   includes the full `output` field. Parse it for exactly which test(s)
   failed:

   ```js
   const j = JSON.parse(approveOutput);
   console.log(j.data.to, j.data.reason, j.data.exitStatus);
   console.log(j.data.output.split('\n').filter(l => /not ok|✖/.test(l)));
   ```

2. **Check whether the failing test touches the files you actually
   changed.** If it lives in a file your item's own diff never touched,
   that's the first signal it's unrelated noise, not a regression your
   change introduced.

3. **Re-run the failing test file in isolation, a few times.** Both real
   causes seen so far were provably unrelated to the item's own diff once
   isolated:
   - A genuine pre-existing repo bug (see the real example below) —
     isolating the failing file reproduces it deterministically every
     time, which rules out flake but also confirms it predates your merge.
   - Load-induced flake — passes cleanly alone, only fails under the full
     1700+-test run.

   ```
   node --test path/to/the-failing.test.mjs
   ```

4. **If it's a genuine pre-existing bug, fix it as its own separate
   commit** on `main` — never fold an unrelated fix into the item's own
   branch/commits. Confirm the fix with the specific failing test, then
   with the full suite once more before retrying.

5. **Resume and retry.** A `blocked` item from `verify-fail-post-merge`
   sits at status `blocked`, stage unchanged from whatever it was before
   `approve` ran (still `executing` if the item hadn't reached
   `compound-learn` yet). The FSM's recovery door here is `blocked ->
   proposed` (fan-out-parallel D18 — "a mechanical reconcile"), not
   `blocked -> doing`:

   ```
   fgos move <id> --to proposed
   fgos approve <id> [--acknowledge-iron-law]
   ```

   Never retry blindly hoping a *deterministic* failure passes by luck —
   only retry after confirming (steps 2-4) the failure is genuinely
   unrelated, and after actually fixing it if it wasn't flake.

## Why this exists

`approve`'s full-suite verify is a real safety net (D4-style
byte-identical-mirror checks, e2e packaging checks, and everything else in
the suite all gate every merge, not just the files an item's own recorded
`verify` command names) — but that same breadth means an item with a
narrow, correct diff can still get blocked by something completely outside
its own scope, exactly the way `return`'s own verify can (see Related).

## Real example

Item `tsk-2z3` (fixing `deriveTitle`'s sentence-boundary regex in
`src/intake/classify.mjs`, a single-line change plus 3 new unit tests, mode
`tiny`) had its own change fully correct and green
(`npm test -- classify.test.mjs` passing 22/22 before merge). `fgos
approve` still came back blocked, twice in a row, for two different
unrelated reasons:

> `{"id":"tsk-2z3","disposition":"blocked","errorClass":"verify-miss","layer":"verification","attempts":1,"detail":"goal-check failed on staged merge (exit 1); merge aborted, main unchanged","ts":"2026-07-29T14:51:49.682Z"}`
> — real `work.friction` capture, id `tsk-2z3` (first attempt)

The first failure was `test/skills/fgos-mirror.test.mjs`'s `every mirrored
file pair is byte-identical`: a genuine pre-existing bug from a different,
already-merged item (`182f495`, "add required `--rationale` to `fgos
decision` calls") that updated `.claude/skills/fgos-exploring/SKILL.md`
and `.claude/skills/fgos-planning/SKILL.md` but never synced the
`.agents/skills` mirror counterparts — a file `tsk-2z3`'s own diff never
touched. Fixed as its own separate commit
(`7b91834`, syncing the two `.agents/skills` files), confirmed green with
the specific test file, then retried.

> `{"id":"tsk-2z3","disposition":"blocked","errorClass":"verify-miss","layer":"verification","attempts":1,"detail":"goal-check failed on staged merge (exit 1); merge aborted, main unchanged","ts":"2026-07-29T14:58:13.929Z"}`
> — real `work.friction` capture, id `tsk-2z3` (second attempt)

The second failure was `test/install-packaging.test.mjs`'s `e2e: npm pack
-> npm install -g -> fgos init from a fresh external cwd` — again a file
`tsk-2z3`'s diff never touched. Running that file alone passed cleanly
(2/2, 0 fail) with no code change, confirming load-induced flake from the
full-suite run rather than a real regression. `fgos move tsk-2z3 --to
proposed` followed by `fgos approve tsk-2z3` on the next attempt merged
cleanly.

> `{"id":"tsk-2z3","predicted":{"tier":"standard","deps":0,"priorVisits":0,"role":"session","headAtTake":"208893b2cc9e7f7102f498a42e0cbad447c57878"},"actual":{"outcome":"proposed","passed":true,"attempts":1,"errorClass":null,"aheadCount":3}}`
> — real `work.outcome` capture, id `tsk-2z3` (the eventual successful outcome)

## Related

- `docs/how-to/diagnose-a-blocked-return-from-an-unrelated-verify-failure.md`
  — the sibling how-to for `fgos return`'s own unrelated-verify-failure
  case (different call site, different recovery edge:
  `blocked -> doing` there vs. `blocked -> proposed` here).
- `fgos check <id>` — full outcome/friction history for an item, including
  the entries quoted above.
- `docs/specs/runner.md` D4 — the byte-identical-mirror invariant that
  `test/skills/fgos-mirror.test.mjs` enforces.
