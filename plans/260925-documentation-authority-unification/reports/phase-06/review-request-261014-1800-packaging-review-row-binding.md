# Packaging ordinary review row binding

Author session: codex-session:13@2026-10-14
Review mode requested: ordinary

## Bounded request

Lead decision needed: publish a machine-bindable ordinary verdict for exactly one already accepted Host source row. No content re-review, new truth draw, or wording change is requested. All 20 ok notes remain recorded verbatim in packaging-closure-application.json, pinned to review-4-packaging-closure-resolution.md at ff3ec502574afd0e703076c0ea5702d4069d04e0.

That immutable report uses `Host source claim_6a37273a0a45d24c53e344928c3edf22` as the first table cell. Existing validateManualReview requires the cell to equal the exact claim ID (scripts/check-doc-inventory-gates.mjs:647). Direct validation reproduces decision-review-report-missing even with the correct reviewer, ordinary mode, full report commit, source digest, target digest and verbatim note. No pin, flag or generated-file change can make these strings equal. Changing the checker or editing an independent report as Doer is outside the authorization.

The source binding stays pending in the production ledger; its accepted verdict is retained as evidence, with no fabricated machine approval. Every other applied verdict is retained. dropped-001 is reviewed defer-with-owner, its Plan C/stub binding unchanged. No batch closure or step-04-report.md is claimed.

## Requested independent output

Add one ordinary row with the exact claim ID as the first cell, the identical note and full digests below. Use a new committed review report with Reviewer: reviewer:claude-session:a4954387@2026-10-14, Author session: codex-session:12@2026-10-14, and Review mode: ordinary; preserve the original report as history. If a different independent Lead session publishes it, use that actual reviewer identity. Doer must never publish this row as its own verdict.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_6a37273a0a45d24c53e344928c3edf22 | ok | Document diff is exactly the one Checked status line; source clause digest unchanged, target block-24 recomputes to aa5e2000 and the verbatim fenced clause is still retained in the same section; status names the coordinator window, 2026-10-18, the owed Packaging-distribution removal and keeps runner mapping and header | 6f959e9066321a5afcbb3c6ae57d46b03fa8da3ae18f7ce0b5454eff36ba701e | aa5e200058adad79eeb799e4c5f6057fd8b6fd68ea06e734d7c6125a05b0dd17 |

## Complete source unit

`docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-14`
Unit digest and full shown-text SHA256: `6f959e9066321a5afcbb3c6ae57d46b03fa8da3ae18f7ce0b5454eff36ba701e`

~~~~~~~~markdown
`package.json` `bin.fgos` is removed (or pointed at the workspace shim) when the Rust host becomes the installed default; `bin.fgos-runner` stays until the runner migrates. A header in `bin/fgos.mjs` and the root `AGENTS.md` state the ownership rule for editors already at that path.
~~~~~~~~

## Complete current target unit

`docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-24`
Unit digest: `aa5e200058adad79eeb799e4c5f6057fd8b6fd68ea06e734d7c6125a05b0dd17`; full shown-text SHA256: `aa5e200058adad79eeb799e4c5f6057fd8b6fd68ea06e734d7c6125a05b0dd17`

~~~~~~~~markdown
**Checked status:** Superseded by decision (owner F6 resolution, 2026-10-14): the installed-default npm `bin.fgos` removal trigger has the 2026-09-15 coordinator 30-day window as successor (`docs/platform/packaging-distribution/code-panel-rollout-plan.md:72`; compatibility-window row above, originally line 35). The Rust host is the installed default from preview; the deprecated Node fallback is supported for 30 calendar days after preview publication, earliest removal 2026-10-18. Removing or redirecting `bin.fgos` after the window remains owed to Packaging-distribution (release-owner decision). The original clause below is retained verbatim as dated design. The runner mapping and source-entry ownership header stay; nothing is removed now.
~~~~~~~~

## Boundaries and resume

Owner F6 resolution and A34 are settled. Minor reviewer notes need no text edits. Resume after Lead commits the exact-cell row: apply its note verbatim, refresh from the persisted registry, rerun both-prior D/scoped E and full native identity-set equality, then write step-04-report.md if the closure comparison is exact. No Step 5, promotion, main write/merge, push, checker/extractor/vocabulary/baseline change.
