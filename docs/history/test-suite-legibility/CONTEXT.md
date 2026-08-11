# Test suite legibility & dedup (tsk-3wr)

## Feature boundary

The `test/` suite (node `--test`, `.test.mjs` files) is a verify/evidence
layer for CoS/DoD, not just a machine gate — it must read as self-standing
proof of what's actually verified, without a reader needing to open
`docs/history/<slug>/CONTEXT.md` to decode a test's own description.

In scope: every `.test.mjs` file under `test/`.

Out of scope: `dogfood-fixture/test/` — scouted separately (5 files, zero
decision-code references found), confirming it was never part of the
problem this item describes.

Two concrete defects, both must be fixed without losing real coverage:

1. **Illegible names.** A test's description string embeds internal
   decision labels (`D4`, `str89-fgos-domain-skills`, etc.) instead of
   describing the invariant in plain language. Example from the item:
   `DOMAINS.coding.skillMap maps every stage... to its skill
   (str89-fgos-domain-skills D4/D6)` — a reader must trace the label back
   to a plan doc to know what's actually being checked. This also
   violates the standing rule in `review-audit-self-decision.md` (Stable
   Code Artifacts): plan IDs, phase numbers, audit labels, and finding
   codes never belong in test names — the invariant gets explained
   directly instead.
2. **Redundant granularity.** Some invariants are re-verified multiple
   times at different levels of detail (e.g. a registry-frozen check
   walking each field separately when one behavioral assertion would
   cover the same guarantee), inflating count and runtime without adding
   real assurance.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Verify command: run `node --experimental-test-coverage` before and after the cleanup and diff the result. The change passes only if line/branch coverage percentage does not drop, in addition to a fully green `npm test` run. Chosen over review-only because the suite is meant to be self-standing evidence — a number beats a reviewer's say-so for proving no coverage was lost. |
| D2 | Dedup scope is open-ended and duplication-driven — no target test-count or runtime-reduction percentage is pinned. Merge or remove a test only where a real duplicate invariant exists (the registry-frozen field-by-field pattern is the concrete example); every distinct invariant must remain verified exactly once afterward. Chosen over a pinned target because forcing a number risks cutting tests to hit it rather than following actual duplication. |

## Pinned terms

- **"Test names"** in the item's own title means the description string
  passed to `test()`/`it()`/`describe()` — not inline comments or
  variable names inside the test body.
- **"Decision code"** (the thing to strip out) means plan/phase/audit
  labels — patterns like `D<n>`, `str##-<slug>`, `STR##`, `RUL##`,
  `tsk-<id>` — cited as a traceability shortcut. It does not mean real
  code symbols under test (e.g. `DOMAINS.coding.skillMap` itself is fine
  to name — it's the thing being tested, not a label pointing away from
  the test).

## Scout evidence

- `rg` over `test/**/*.test.mjs` for `\b(str\d{2,3}|D\d{1,2}\b|RUL\d{2,3}|STR\d{2,3}|tsk-[0-9a-z]{3})\b`
  matches in 48 of 72 files (67%) — confirms the item's own claim (it
  measured 34/70, 49%, with a narrower pattern); either count shows the
  problem is real and widespread, not isolated to one file.
- Heaviest offenders by match count: `test/cli/fgos.test.mjs` (D1–D8,
  D17), `test/e2e/runner-loop.test.mjs` (D4, D7), `test/intake/judge-executor.test.mjs`
  (str68), `test/evolve/iron-law.test.mjs` (D14).
- `dogfood-fixture/test/*.test.mjs` (5 files) — zero matches for the same
  pattern, confirming that directory was never in scope.
- No `P15` reference exists anywhere in the repo (`rg -n "P15" -g '*.md'`
  returns nothing) — the item's own "verify: chưa xác định — P15 bổ sung"
  note was a forward placeholder, not a pointer to an existing doc; D1
  above is what actually settles it now.
- No prior `judgeDiscovery` verdicts existed for this item
  (`view.discovery["tsk-3wr"]` was `undefined`) and no earlier CONTEXT.md
  existed under `docs/history/` for this feature — this is the first
  clarify pass.

## Outstanding questions deferred to planning

- Whether/how to group the 48 offending files into batches for the
  implementer (by module, by decision-code density, or file-by-file) is
  an implementation/shaping call, not a product decision — left to
  `fgos-coding-planning`.
- Whether removed/merged tests need any "formerly verified by X" trace
  (e.g. for CI dashboards or flaky-test history) was considered and
  judged to matter only to the implementer, not to product scope — also
  left to planning to decide if it's worth doing at all.
