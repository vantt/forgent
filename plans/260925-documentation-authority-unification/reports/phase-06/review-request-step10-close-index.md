# Step 10 backlog re-carry ordinary review request

Content pin: `38672e7f157788cbe1b2bf59511bd61046dce660`. Package pin: **the runner commit containing this request**, resolved by the reviewer with `git rev-parse HEAD`. Producer: `codex-session:unit-run-1792176628519-ac852ba4@2026-10-17`. Ordinary review only; the producer supplies no verdict, checkpoint sample, sensitivity pack or key.

This is ONE small request: **25 entries in one JSON file**. It contains exactly three pending generated-backlog decision rows (the heading, active `claim_127225b8542c701295574b1b00749594`, and predecessor gap `claim_9b3b7fac64df06547dd06e05f4f026c5`), one complete backlog re-carry accounting entry, the six list/receipt refreshes, and all 15 native registry changes from the sole persisted sync. Every decision is bound by content, not ordinal position; no approval carries.

| Request | Decisions | Re-carry accounting | List/receipt refreshes | Native changes | Total |
|---|---:|---:|---:|---:|---:|
| [review-request-step10-close.json](review-request-step10-close.json) | 3 | 1 | 6 | 15 | 25 |

Read `review-brief.md`, the phase shared rules, `owner-answers.md` A28/A31/A34/A36/A38/A43 and L10-14/L10-37..40, this index, the request and the referenced complete rows. Review both current table content and the predecessor gap. `regenerate-from-source` describes the future owning workflow; it does not authorize a renderer run, delete hand-added rows, certify backlog status truth, promote, retire or cut over.

Authenticate each entry with the self-contained helper in [step10-close-reproduction.json](step10-close-reproduction.json). Materialize `row-auth.mjs` into a fresh `<OUT>` under `/tmp/fgos-work/`, then run:

```sh
env -u CLAUDE_CODE_SESSION_ID node --max-old-space-size=512 <OUT>/row-auth.mjs plans/260925-documentation-authority-unification/reports/phase-06/review-request-step10-close.json d01
```

Substitute every recorded entry id: `d01..d03`, `a01`, `r01..r06`, `n01..n15`. Producer smoke validation passed **25/25**. Reviewers need neither native generation nor global D/E. A mechanical authentication result is evidence, not a verdict.

Return one ordinary report with the real Author session / Reviewer session / Review mode headers and one `claimId or entry | source -> target | verdict | Notes` row per entry. Bind the actual runner request commit. Keep Notes verbatim and row-specific. Do not flip statuses or author decisions while reviewing; apply only committed matching verdicts afterward.

Next: independent ordinary review of these 25 entries plus the separate [checkpoint request](review-request-step10-checkpoint.md). The checkpoint reviewer commits the sensitivity pack first, checkpoint report second, and seed key last. Only after ordinary application, population refresh, accepted checkpoint, A28 truth sample and final red-team may a separate close turn set `awaiting owner review`.
