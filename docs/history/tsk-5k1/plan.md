# plan — tsk-5k1

Mode: tiny

Flag count: 0 (auth: no, authorization: no, data model: no, audit/
security: no, external systems: no, public contracts: no,
cross-platform: no, existing covered behavior changed: no — the
described regression already stops reproducing under the repo's real
test entrypoint, no behavior is being changed here, weak proof: no —
strong direct evidence gathered at discovery, multi-domain: no).

No `CONTEXT.md` exists for this item — discovery's verdict was `clear`
(see `docs/history/tsk-5k1/RESEARCH.md`), which skips `exploring`
entirely, so there is no locked-decisions doc to cite here. Nothing in
this plan needed one: the evidence already fully resolves the question.

## Approach

**Chosen path: no code change. Confirm-and-close.**

Discovery (`docs/history/tsk-5k1/RESEARCH.md`, round 1) already proved,
with real test runs, that the regression this item describes does not
reproduce under the repo's actual `npm test` invocation:

- `runOpportunisticMainCheckoutChecks` (`src/state/events-jsonl-
  truncation-guard.mjs:209`) has an opt-out gate:
  `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1`.
- `package.json:27`'s `test` script already sets that env var for every
  `npm test` run — landed by `8607438e fix(state): add opt-out gate for
  opportunistic main checkout checks (tsk-oet)`, which sits on `main`
  *before* `tsk-5k1`'s own `branchHeadAtTake` (`c6f486d6`).
- Re-running the exact 7 tests this item names, the way `npm test`
  actually invokes them (env var set): 218/218 pass across
  `fgos-claim.test.mjs` + `fgos-read.test.mjs` + `fgos-return.test.mjs`,
  and 15/15 pass on `runner-loop.test.mjs` (including the named S2-pull
  case). Re-running the same files WITHOUT the env var (bypassing
  `package.json`'s own wrapper) reproduces the exact failures tsk-5k1
  describes — confirming causation, not coincidence.

**Alternatives rejected:**

- *Add `.fgos/events-jsonl.truncation-guard.json` to the return flow's
  `.fgos`-self-change exemption list (tsk-x5r), per this item's own
  root-cause hypothesis.* Rejected: that hypothesis predates tsk-oet's
  actual fix, which took a broader, already-landed and already-verified
  approach (an opt-out gate wired into the real `test` script) rather
  than widening an exemption list. Re-doing the same fix a second,
  narrower way would be redundant and would not address the D2
  periodic-auto-commit half of the regression the exemption-list
  approach never touched.
- *Re-verify nothing, just close as duplicate.* Rejected: tsk-5k1 was
  filed with real, specific evidence (a full `npm test` failure log) that
  is worth confirming against, not waving away — this plan performs that
  confirmation and records it, rather than asserting "already fixed"
  without proof.

**Risk map:** none carried to validating — no code is being changed, the
proof point (re-running the named tests) was already produced during
discovery and is reproducible any time via `npm test`.

**Files touched:** none (source). `docs/history/tsk-5k1/RESEARCH.md`
(already written) and `docs/history/tsk-5k1/plan.md` (this file) only.

**Impact-analysis posture:** not applicable — no proof point here leans
on blast-radius/impact-analysis evidence; the proof is a direct test run
already captured in RESEARCH.md.

## Shape

Single piece, no split. The one action: record that this item is
resolved-by-existing-fix (tsk-oet), with the verify command that proves
it, and let `fgos-coding-validating` run its gate over this plan before
the item proceeds. No behavior/code change ships from this item.

Cases already proven at discovery (see RESEARCH.md round 1):
- The 7 originally-failing tests, run the way `npm test` really invokes
  them — all pass.
- The same tests, run WITHOUT the opt-out env var — fail identically to
  this item's own description, confirming the mechanism.

## Outstanding questions

None
