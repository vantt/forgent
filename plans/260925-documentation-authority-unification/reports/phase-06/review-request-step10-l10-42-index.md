# Step 10 L10-42 instruction-identity ordinary review request

Content pin: `3baafff4d7a670b30edac2ff9bcf1594eed4ec95`. Package pin: **the runner commit containing this request**, resolved by the reviewer with `git rev-parse HEAD`. Producer: `codex-session:unit-run-1792184405209-31ed32fb@2026-10-17`. Ordinary review only; the producer supplies no verdict, checkpoint sample, sensitivity pack or key.

This is **ONE bounded request: 114 entries in three small JSON parts**. It contains all 31 pending instruction-identity decisions created by `40c667c83` (6 content-preserving CLAUDE→AGENTS moves, 1 edited retained CLAUDE heading, 1 new CLAUDE live unit, 1 predecessor gap, and 22 retired CLAUDE identities) plus every one of the native carry's 83 raw registry changes. Retired identities use the established L10-16 historical collection without live-anchor targets. Every decision binds content/native identity, never ordinal position, and carries no approval.

| Request part | Decision rows | Native raw changes | Total |
|---|---:|---:|---:|
| [01](review-request-step10-l10-42-01.json) | 31 | 0 | 31 |
| [02](review-request-step10-l10-42-02.json) | 0 | 42 | 42 |
| [03](review-request-step10-l10-42-03.json) | 0 | 41 | 41 |
| **ONE request total** | **31** | **83** | **114** |

Read `review-brief.md`, the phase shared rules, `owner-answers.md` A31/A42 and L10-14/L10-16/L10-41/L10-42, this index, all three parts, and the exact rows they embed. Check that `40c667c83` makes AGENTS.md the shared instruction owner; the 22 retired CLAUDE units are historical identities with explicit dispositions, not live-target claims. Native raw changes include metadata, both root document rows, every unit/gap/retired transition, the two already-reviewed backlog tuple refreshes, and every content-stable AGENTS anchor shift. Do not infer truth, promotion, retirement authority, alias adoption or cutover.

Authenticate every entry with the self-contained helper in [step10-l10-42-reproduction.json](step10-l10-42-reproduction.json). Materialize `row-auth.mjs` into a fresh `<OUT>` under `/tmp/fgos-work/`, then run:

```sh
env -u CLAUDE_CODE_SESSION_ID node --max-old-space-size=512 <OUT>/row-auth.mjs plans/260925-documentation-authority-unification/reports/phase-06/review-request-step10-l10-42-01.json d001
```

Substitute each part path and every recorded entry id (`d001..d031`, `n001..n083`). Producer smoke validation passed **114/114**. The helper checks committed pre-carry bytes, current compact registry bytes, exact request rows, and the bounded decision overlay on retired rows separately. Reviewers need neither native generation nor global D/E. Mechanical authentication is evidence, not a verdict.

Return one ordinary report with real Author session / Reviewer session / Review mode headers and one `claimId or entry | source -> target | verdict | Notes` row per entry. Bind the actual runner request commit. Keep Notes row-specific. Do not flip statuses or author decisions while reviewing; a later close turn applies only matching committed verdicts.

Next: independent ordinary review of this request. Then a final close turn applies matching verdicts, reruns D both/each + strict E + exact comparator **without a new carry** (identity scope unchanged), runs the remaining checks left by the stopped close turn, and sets Phase 6 to `awaiting owner review` only if all proof remains green.
