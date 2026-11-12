# DOCOS: recall measurement for the document identity spec

Date: 2026-11-12. Lead `claude-wfgg@design-lap` (`lead:DOCOS`). Repository state: main checkout of design-lap, 691 maintained documents (platform without history and verification, knowledge, explanation, how-to, tutorials, reference), split into 5729 sections.

Purpose: the [document identity spec](../../docs/platform/documentation/subcomponents/document-identity/spec.md) promises that locate finds the existing document before a writer creates a new one. Its section 15 sets the bar: other members of a same-subject group appear in the top 3 for at least 90% of members. The owner asked for the measurement before anything is signed, because admission and the write door depend on it.

This report is self-contained: the gold set is listed in the appendix; the scripts were throwaway prototypes and their method is stated here.

## 1. Gold set

An independent agent (not the author of the extractor) read the user documents and chose 37 groups covering 88 documents, plus 10 near-miss pairs that look alike but are different subjects. Rules it was given: judge by content, not by shared identifiers; at most 4 groups per topic; some groups must use different vocabulary for the same thing. Its own note: the weakest calls are groups that pair an explanation with a how-to.

## 2. Method

For each of the 88 documents: build a query from it, remove it from the index, rank the other documents by their best-matching section, and count a hit when at least one other member of its group is in the top 3 (recall@3) or top 10 (recall@10). No `area` or `question` filter was applied, because user documents carry neither today.

| Ranking | How |
|---|---|
| Identifiers only | the locate prototype of spec 8.6: `cli-verb`, `path`, `symbol`, `rule` values from backticked text, weight = ln(sections / sections carrying the value) |
| Full text | TF-IDF cosine over words (a stand-in for BM25 / FTS5) |
| Fused | reciprocal-rank fusion of the two; an approximation, see section 4 |

Two query sizes:

- **Whole document**: the document's full text. An upper bound.
- **Short**: the title and the first lines, up to 600 characters. Closer to a writer's one-paragraph statement of what it will assert.

## 3. Results

| Ranking | Query | recall@3 | recall@10 |
|---|---|---|---|
| Identifiers only | whole document | **31.8%** | 45.5% |
| Full text | whole document | **87.5%** | 100% |
| Fused | whole document | ~97.7% | — |
| Full text | short | **69.3%** | 85.2% |
| Fused | short | ~93.2% (inflated, section 4) | — |

Why identifiers fail on user documents: 25 of 88 queries share **no** identifier with any member of their group, and 21 queries carry two identifiers or fewer; 8 carry none. User documents are prose with few backticked names, and documents about the same subject often name different symbols.

Near misses (pairs that look alike but differ): with full text on whole documents, 6 of 10 second members rank in the top 4; with short queries, 4 of 10. A high rank is therefore not proof of the same subject: the writer must read the candidates, and an automatic `owner-found` verdict on full-text score alone would merge different subjects.

## 4. Limits

- One independent reviewer chose the gold set; a second reviewer was not run.
- The fused figures are approximate: the identifier ranks came from whole-document queries even in the short-query row, which inflates "fused, short".
- TF-IDF is a stand-in for FTS5 BM25; results should be close but are not identical.
- No `area` or `question` filter was used. With filters, precision improves; recall is unchanged only if the writer picks the right region.

## 5. What this means for the spec

1. **The ranking order in the spec is wrong.** Section 8.1 puts identifiers first and full text as tiebreak. Measured, identifiers alone reach 31.8%. Full text must be the primary ranking, with identifiers as a boost and a precision signal (they decide between near misses and carry platform documents and code changes).
2. **The query must be the writer's draft, not a one-line statement.** Whole-document queries reach 87.5% with full text alone; short ones 69.3%. A writer can draft the paragraph it wants to add first and locate with that draft.
3. **Return the top 10 with headings, not the top 3.** Full text with short queries reaches 85.2% at 10; reading ten titles is cheap, opening one to three is the writer's step.
4. **The verdict cannot be automatic on full-text score.** Near misses rank high; `owner-found` needs the writer's reading, or an identifier match, not a score alone.
5. **The 90% bar is not yet met for short queries.** The spec's own ladder says embeddings are proposed with the miss list as evidence. This report is that miss list. An embeddings trial on the same gold set is the next measurement.

## 6. Second round: embeddings and the owner's OHS fork (2026-11-12, afternoon)

The owner allowed local model downloads into the session scratch directory and confirmed that fgOS may use the `ohs-lang-vi` pack. A second independent agent wrote 30 Vietnamese queries in a developer's own words: 24 tied to gold groups, 6 on subjects with no document (checked by search). A third agent translated them literally into English without seeing the gold set.

### 6.1. Hand-built hybrid with `multilingual-e5-small` (BM25 + embeddings, RRF)

| Unit | Query | BM25 @3 | Semantic @3 | Fused @3 | Fused @10 |
|---|---|---|---|---|---|
| section | English short | 52.3% | 53.4% | 62.5% | 86.4% |
| document | English short | 67.0% | 61.4% | 71.6% | 88.6% |
| document | Vietnamese (about English docs) | 0% | 37.5% | 0% | 12.5% |

Ranking whole documents beats ranking single sections for short queries. Plain BM25 is blind to Vietnamese queries over English documents, and RRF fusion then makes the semantic branch worse.

gte-multilingual-base and EmbeddingGemma-300m runs were stopped: the owner's fork had already measured models for Vietnamese (report `vantt/reviews/semantic-eval-2026-11-02.md` in `vantt/obsidian-hybrid-search`): with the `vi` pack, e5-small (0.950 nDCG@5) matches e5-base, bge-m3 and halong on its 255-query set at the lowest cost; bge-m3 separates near-synonyms best.

### 6.2. The owner's OHS fork, release `v0.17.2-vantt.9` linux-x64, e5-small + `ohs-lang-vi` 0.2.0, hybrid mode

Index: 685 of 691 documents in about 7.5 minutes on CPU; 6 failed because their YAML frontmatter is invalid (a title starting with a backtick, unquoted), for example `docs/knowledge/fgos-triage-table-columns/triage-table-columns.md`. That is a documentation defect for doc-checks, not an OHS fault.

| Query | @3 | @10 |
|---|---|---|
| English short (document opening) | 65.9% | 90.9% |
| Vietnamese developer note, as written | 0% | 16.7% |
| Same note, translated to English | **91.7%** | **95.8%** |
| Vietnamese and English together (multi-query RRF) | 62.5% | 70.8% |

Why Vietnamese fails as written: every Vietnamese query ranks the large Vietnamese-language platform specs first (`runner/operations/h-51f5cd7279fd.md`, `runner/decisions/h-36d872fbb0e5.md`, `spec.md` files). The `vi` pack matches Vietnamese to Vietnamese well, so in a mixed-language corpus the query's language outweighs its subject.

No-match queries: top scores 0.74 to 1.00 (English translation) against a median of 0.956 for queries with a real owner. No score threshold separates "has an owner" from "has none".

### 6.3. What this changes

1. **Engine:** hybrid search (BM25 with the `vi` pack, plus `multilingual-e5-small`) reaches the 90% bar at top 3 for developer-style notes once the note is in the corpus's language (24 queries; a small sample). bge-m3 is not needed for this bar; it stays the option if the miss list grows.
2. **Query language:** the writer translates its draft into the language of the documents it searches before locate. Sending both languages at once is worse than English alone.
3. **Return the top 10;** the writer reads candidates. The verdict `owner-found` / `none-above-threshold` cannot come from a score.
4. **Rank whole documents, then point to sections,** rather than ranking sections alone.
5. **Mixed-language corpus:** the Vietnamese platform specs pull Vietnamese queries; an English query may in turn miss them. Not measured yet: a gold set of Vietnamese specs searched in English.

## 7. End-to-end A/B trial: does a writer grow instead of create? (2026-11-12, late afternoon)

**Design.** 26 cases, each run twice by a fresh agent (Claude Sonnet, same brief except the search tool), deciding `GROW <path>` or `CREATE` before writing:

- 20 **duplicate** cases from the gold set: the later document of a group is the knowledge to record (first 1,500 characters); the corpus is a snapshot without that document and without every document added after it (original add time from `git log --follow`), so the earlier member is the right answer. A content edit made to the earlier member after that date is a leak common to both arms.
- 6 **new** cases: the Vietnamese no-match queries, translated; no document covers them, so `CREATE` is right.
- **Arm A (today):** `ls`, `grep`/`rg` and reading files in the snapshot.
- **Arm B (proposed):** a `locate` command over the one-door path the owner named: `pkm related` (pkm built from `vantt/momentell` at `474ae36`, graph of 691 notes and 972 Markdown-link edges) seeded by OHS `v0.17.2-vantt.9` with `ohs-lang-vi`, top 10 after removing the case's excluded files; then reading files. No grep allowed.

**Results.**

| | Arm A (grep) | Arm B (pkm + OHS) |
|---|---|---|
| Duplicate cases decided right (grow the earlier document) | 12 / 20 | **15 / 20** |
| ...of which the earlier document was opened at all | 19 / 20 | 18 / 20 |
| New cases decided right (create) | 1 / 6 | **4 / 6** |
| All cases right | 13 / 26 (50%) | **19 / 26 (73%)** |
| Average tokens per run (whole agent context) | 111,605 | 101,296 |
| Average wall time per run | 20.9 s | 24.8 s (pkm CLI starts OHS on each call) |

Paired: B right and A wrong in 6 cases, A right and B wrong in 1 (c09, where B grew a wrong document). The direction is clear; with 26 cases it is not statistically settled (two-sided sign test p ≈ 0.13).

**What the trial shows.**

1. **Finding was not the main failure.** Arm A opened the right earlier document in 19 of 20 duplicate cases and still chose `CREATE` in 7 of them. The failure is the decision after finding: the writer judges the subject "different enough" and writes a new document. Arm B made that mistake 4 times (c12, c15, c17, c18).
2. **Today's writer also over-grows.** On the 6 new subjects, arm A pushed 5 into large platform specs (`observe/spec.md`, `work-state/spec.md`, `host-invocation-routing/spec.md`, `vision.md`, a herdr dashboard document) rather than create. Arm B did that twice.
3. **The proposed path is better on both errors and a little cheaper in tokens,** about 10,000 fewer per write; it is about 4 seconds slower because each `pkm related` call starts OHS (the MCP server keeps it running).
4. **The rule matters as much as the search.** The remaining errors are judgement errors that a search engine cannot fix. They are what the write door's rule (grow by default; create only with a stated reason that no candidate covers the subject) and admission (an independent reviewer) are for. That rule was not in either brief.

**Limits.** 26 cases, one run each; one reviewer chose the gold groups; the later document's own text is a strong query, closer to a full draft than to a one-line note; the new cases are short.

**Next measurement proposed:** arm C = arm B plus the write-door rule text, on the same 26 cases, to see how much of the remaining 7 errors the rule removes.

## 8. Arm C: the same path plus the write-door rule (2026-11-12, evening)

Arm C is arm B with four rule lines added to the brief: grow by default (a new wording, example, cause or follow-up fix is the same subject); create only with one sentence on why no candidate covers the subject; a different kind of question (why against how-to) may be a separate document if said so; never put a new subject into a large general specification for shared words. The agent also returns a reason and a `question_kind_differs` flag.

| | A (grep) | B (pkm + OHS) | C (B + rule) |
|---|---|---|---|
| Duplicate cases right | 12 / 20 | 15 / 20 | 14 / 20 |
| New cases right | 1 / 6 | 4 / 6 | 4 / 6 |
| All right | 50% | **73%** | 69% (73% if the one case flagged as a different question kind is accepted) |
| Tokens per run | 111,605 | 101,296 | 102,707 |
| Wall time per run | 20.9 s | 24.8 s | 33.4 s |

**The rule text added nothing measurable; it moved the errors.** "Found but created" fell, and "grew into a related but wrong document" rose: c09, c15 and c20 grew a neighbouring document after reading the rule's "a follow-up fix is the same subject".

**Several remaining errors are arguable labels, not clear mistakes.** n04 (dark mode for the web dashboard) grew the dashboard document's visual-language section; n03 (a Python client) grew the participant contract that says how a non-Node client talks to fgOS; c12 split a "why" explanation from a "how-to". A reasonable reviewer could accept each. The trial has reached the limit of what one reviewer's labels can tell apart.

**Conclusion of the three arms.**

1. The measurable gain comes from locating through the one door (pkm with OHS): 50% to 73% right decisions, and about 10,000 fewer tokens per write.
2. More rule prose in the brief does not raise it further. What remains is judgement on borderline subjects, which is the job of the independent reviewer in admission, and later of the observer's merge proposals; not of more instructions to the writer.
3. Further synthetic trials need a second, independent labeller first, to know which remaining "errors" are real. The cheaper path is to build it and measure in use through the locate log (document identity, section 8.5).

## Appendix: gold set

- g01: Merge blocked as fgos-write-rejected when a stale worker branch never touched .fgos/ but main changed it after the fork (the catchup/approve deadlock and the branchHeadAtTake trust fix).
  - docs/explanation/fgos-write-rejected-structural-deadlock.md
  - docs/explanation/write-rejected-trust-branchheadattake.md
  - docs/explanation/write-rejected-no-diff-check.md
- g02: events.jsonl history silently lost when a git stash/checkout/reset on the shared main checkout reverts the tracked log under live appends: detection, truncation guard, and recovery.
  - docs/explanation/events-jsonl-concurrent-data-loss-investigation.md
  - docs/explanation/events-jsonl-opportunistic-truncation-check.md
  - docs/knowledge/how-to-respond-when-fgos-doctor-reports-a-shared-fgos-events/resolve-an-events-jsonl-truncation.md
  - docs/knowledge/how-to-reconstruct-fgos-tracking-state-after-an-operator-mis/reconstruct-fgos-tracking-state-after-an-operator-mistake-discards-events-jsonl.md
- g03: events.jsonl corrupted by hand-resolving git merge conflicts on the tracked log, breaking seq contiguity, and how to resolve such a conflict.
  - docs/knowledge/why-the-live-events-jsonl-corrupted-and-why-the-fix-needed-a/why-live-events-jsonl-corrupted-and-how-it-was-fixed.md
  - docs/knowledge/how-to-resolve-a-git-merge-conflict-on-fgos-events-jsonl-wit/resolve-an-events-jsonl-merge-conflict.md
- g04: What to do when take/pick/approve refuses with lock-held on main-checkout.lock: check holder liveness and TTL, clear a stale lock with unlock, or wait out a live holder.
  - docs/knowledge/how-to-clear-a-stuck-fgos-main-checkout-lock/clear-a-stuck-main-checkout-lock.md
  - docs/knowledge/how-to-check-main-checkout-lock-status-before-retrying/check-main-checkout-lock-status-before-retrying.md
  - docs/knowledge/how-to-wait-out-a-genuinely-active-main-checkout-lock-holder/wait-out-an-active-main-checkout-lock-holder.md
- g05: main-checkout.lock reporting AMBIGUOUS (unparseable content) on claim: the non-atomic write window that caused it and the inline retry that self-heals it.
  - docs/explanation/claim-ambiguous-lock-inline-self-heal.md
  - docs/knowledge/why-fgos-main-checkout-lock-could-report-ambiguous-with-no-r/main-checkout-lock-toctou-race.md
- g06: The pre-commit hook acquires main-checkout.lock and never releases it, so the lock stays held after commits and blocks other sessions (release-on-exit opt-in, shorter hook TTL, early release in sweep loops).
  - docs/knowledge/why-acquiremaincheckoutlock-s-release-on-exit-is-opt-in-neve/main-checkout-lock-release-on-exit-opt-in.md
  - docs/knowledge/why-the-pre-commit-hook-got-its-own-shorter-main-checkout-lo/why-the-pre-commit-hook-got-its-own-shorter-lock-ttl.md
  - docs/explanation/main-checkout-lock-release-early-compound-cleanup.md
- g07: A worktree-isolated session's Bash guard refuses the compound out-of-process dispatch command, and the fix is a generated wrapper script.
  - docs/how-to/handle-worktree-guard-refusal-of-compound-dispatch-command.md
  - docs/how-to/write-wrapper-script-for-worktree-guard-refusal.md
- g08: reclaimOrphanedCheckout must not force-remove a worktree that is still live (uncommitted work or a session standing inside it).
  - docs/knowledge/why-reclaiming-an-orphaned-worktree-checkout-must-check-for/orphaned-worktree-reclaim-must-check-for-live-uncommitted-work.md
  - docs/knowledge/why-reclaimorphanedcheckout-refuses-a-checkout-the-calling-s/why-reclaimorphanedcheckout-refuses-a-live-session-worktree.md
- g09: A claim worktree goes stale when its branch is moved underneath it (e.g. a child merged into the root branch) and must be resynced on re-entry instead of trusted.
  - docs/knowledge/how-to-tell-a-stale-worktree-index-apart-from-real-uncommitt/tell-a-stale-worktree-index-apart-from-real-uncommitted-work.md
  - docs/explanation/driving-loop-worktree-resync-on-reentry.md
- g10: The worktree-isolation race when fanout dispatches agents concurrently into existing worktree paths, and why it is handled as a recoverable self-heal.
  - docs/explanation/worktree-isolation-existing-path-hazard.md
  - docs/knowledge/why-fgos-fanout-treats-a-dispatched-agent-s-worktree-isolati/why-fanouts-worktree-isolation-race-is-a-recoverable-self-heal-not-a-lowered-batch-cap.md
- g11: State-writing fgos verbs (merge, approve, sync-root, ask, move...) run from inside a linked worktree find no .fgos/ store and must refuse or be pointed at the main checkout.
  - docs/knowledge/why-fgos-merge-now-refuses-outside-the-main-checkout/why-fgos-merge-now-refuses-outside-the-main-checkout.md
  - docs/knowledge/how-to-recover-fgos-approve-fgos-sync-root-from-inside-a-wor/recover-approve-sync-root-from-inside-a-worktree-with-trust-dir.md
  - docs/knowledge/how-to-run-a-state-writing-fgos-verb-from-inside-a-picked-wo/run-a-state-verb-from-inside-a-worktree.md
- g12: Approve merge conflicts caused by two in-flight branches claiming the same next decision ID, resolved by hand or by the auto-resolver.
  - docs/knowledge/how-to-resolve-an-fgos-approve-merge-conflict-caused-by-two/resolve-a-decision-id-collision-merge-conflict-on-approve.md
  - docs/knowledge/why-the-decision-id-collision-auto-resolver-only-trusts-a-sh/merge-auto-resolves-decision-id-collision.md
- g13: The verify-fail-post-merge block on approve and its recovery playbook (diagnose unrelated failure, self-diagnose in merge-loop, retry through awaiting-approval).
  - docs/knowledge/how-to-diagnose-an-fgos-approve-blocked-by-verify-fail-post/diagnose-a-verify-fail-post-merge-block-on-approve.md
  - docs/knowledge/why-merge-loop-self-diagnoses-only-verify-fail-post-merge-ne/merge-loop-self-diagnoses-verify-fail-post-merge.md
  - docs/knowledge/why-the-verify-fail-post-merge-playbook-s-retry-step-moves-a/why-the-verify-fail-post-merge-playbook-retries-through-awaiting-approval-not-proposed.md
- g14: Where merge self-recovery playbooks live: scattered per skill, then a shared reference, then owned by approve itself with merge-loop as a thin caller.
  - docs/explanation/catchup-self-recovery-shared-reference.md
  - docs/explanation/approve-owns-self-recovery-merge-loop-thin-caller.md
- g15: The fgos sync-root verb: why it exists (root-to-main drift window) and its real guards and outcome shape.
  - docs/knowledge/why-fgos-added-sync-root-and-drift-detection/why-fgos-added-sync-root-and-drift-detection.md
  - docs/knowledge/fgos-sync-root-s-real-guards-and-outcome-shape/fgos-sync-root-outcome-shape.md
- g16: Detecting whether an out-of-process worker signaled [DONE]/[BLOCKED] (unsignaled outcome, quoted-token false positive, putting the signal instruction inline in the worker prompt).
  - docs/explanation/dispatch-execute-unsignaled-outcome.md
  - docs/explanation/unsignaled-detection-backtick-false-positive.md
  - docs/explanation/worker-prompt-inline-completion-signal.md
- g17: Worktree-dispatch attestation: recording what a dispatched worktree actually touched, first advisory-only, then an enforcing halt.
  - docs/knowledge/worktree-dispatch-attestation-level-1-advisory-only-never-a/worktree-dispatch-attestation-level-1-advisory-only.md
  - docs/explanation/dispatch-attestation-level-2-enforcement-halt.md
- g18: Every Agent/Task or executor dispatch must first ask dispatch decide for the mechanism rather than the skill choosing itself.
  - docs/knowledge/why-every-agent-task-tool-dispatch-is-enforced-through-a-pre/why-dispatch-decide-is-a-hard-hook-enforced-gate-not-a-convention.md
  - docs/knowledge/how-to-wire-a-skill-through-the-dispatch-decision/wire-a-skill-through-the-native-vs-cli-spawn-dispatch-decision.md
- g19: Governance over whether an executor may send prompt content to a non-Claude provider (allowCrossProvider and checking real egress, not the command name).
  - docs/explanation/cross-provider-egress-governance.md
  - docs/knowledge/executor-cross-provider-governance/executor-cross-provider-governance.md
- g20: Layout of the herdr-plugin TUI dashboard's work-item and in-process lists (panels, tabs, table columns, sort).
  - docs/knowledge/herdr-plugin-dashboard-layout-work-items-panel-action-queue/herdr-dashboard-layout-and-action-queues.md
  - docs/knowledge/why-herdr-s-dashboard-lists-became-real-tables-and-why-in-pr/herdr-dashboard-table-view-scope-and-sort.md
- g21: herdr cockpit launch guards keyed on pane labels that were not yet written, so auto-launched panes must be labeled before spawning claude.
  - docs/knowledge/why-auto-launched-herdr-panes-must-be-labeled-before-spawnin/why-auto-launched-herdr-panes-must-be-labeled-before-spawning-claude.md
  - docs/knowledge/why-herdr-cockpit-stacked-worker-launches-into-a-single-reus/why-herdr-cockpit-stacked-worker-launches-into-one-pane.md
- g22: The gate-bypass mechanism that lets skill confirmation gates auto-approve: its config shape and why it was designed that way.
  - docs/knowledge/gate-bypass-config/gate-bypass-config.md
  - docs/knowledge/why-gate-bypass-is-shaped-the-way-it-is/gate-bypass-design.md
- g23: False positives in HEAVY_KEYWORDS risk-keyword matching (substring hits, path citations) and the word-boundary fix.
  - docs/explanation/gate-bypass-keyword-floor-false-positives.md
  - docs/knowledge/why-heavy-keywords-matching-moved-from-substring-to-word-bou/why-heavy-keywords-matching-moved-to-word-boundaries.md
- g24: Cleaning up the citation-drift baseline: glossing bare ADR/RUL citations and deleting out-of-home D-ids across the spec docs.
  - docs/explanation/citation-baseline-cleanup-calibration-slice.md
  - docs/how-to/fix-bare-citation-findings.md
  - docs/explanation/citation-drift-runner-md-cleanup.md
  - docs/explanation/citation-drift-remaining-docs-cleanup.md
- g25: The enduser docs index drifting from the docs on disk, and the doctor check (and its orphan-detection widening) that catches it.
  - docs/knowledge/why-docs-enduser-docs-index-json-needed-a-doctor-check-not-j/why-the-enduser-docs-index-needed-a-doctor-check-not-just-a-regenerate-skill.md
  - docs/explanation/enduser-docs-index-stale-orphan-detection-gap.md
- g26: Splitting oversized fgOS skills into SKILL.md plus references under 300 lines and removing bare citations (the design and its per-skill applications).
  - docs/explanation/skill-prose-cleanup-design.md
  - docs/knowledge/why-fgos-s-coding-domain-skills-were-rewritten-to-a-300-line/why-fgos-skills-split-into-skillmd-plus-references-under-300-lines.md
  - docs/explanation/skill-prose-cleanup-fgos-coding-planning.md
  - docs/explanation/skill-prose-cleanup-fgos-coding-validating.md
  - docs/explanation/skill-prose-cleanup-fgos-coding-exploring.md
- g27: fgos uninstall: unwiring setup's hooks and shell-rc line, plus the package-removal spike, shipped as two pieces.
  - docs/knowledge/why-fgos-uninstall-shipped-as-two-pieces/fgos-uninstall-feature-overview.md
  - docs/knowledge/reverse-fgos-setup-s-wiring-with-fgos-uninstall/uninstall-fgos-wiring.md
  - docs/knowledge/whether-fgos-uninstall-remove-package-can-reliably-remove-it/fgos-self-uninstall-package-removal-spike.md
- g28: Plugin skills locating the fgos CLI in projects that are not a forgent checkout (global/nvm install fallback and self-healing resolution).
  - docs/knowledge/why-plugin-skills-need-a-cli-path-fallback/plugin-skill-cli-path-resolution-fallback.md
  - docs/knowledge/why-fgos-install-setup-resolves-the-fgos-binary-through-a-3/why-fgos-bin-and-skill-distribution-needed-a-3-tier-self-healing-resolution.md
- g29: return runs an item's verify field as a literal shell command, so placeholder or prose text in it fails as a shell error rather than a test failure.
  - docs/knowledge/explanation-fgos-return-runs-verify-as-a-literal-shell-comma/fgos-return-executes-verify-as-a-literal-shell-command.md
  - docs/knowledge/how-to-fix-a-verify-command-that-mixes-prose-with-a-real-com/fix-a-verify-command-broken-by-mixed-in-prose.md
- g30: 'Is this item resolved?' checks must use the full resolved-status set (wontfix, delivered, ...) instead of status === 'done'.
  - docs/knowledge/why-wontfix-had-to-join-done-at-every-is-this-resolved-check/wontfix-terminal-status-filter-consistency.md
  - docs/knowledge/why-isdepsandlineageready-uses-resolved-statuses-not-just-do/why-isdepsandlineageready-uses-resolved-statuses-not-just-done.md
- g31: Ordering of the clarify/decompose discover pool (pickNextDiscoverItem) used by discover-loop.
  - docs/knowledge/why-discover-loop-s-pool-ordering-and-stop-rules-diverge-fro/discover-loop-pool-ordering-and-stop-rules.md
  - docs/knowledge/picknextdiscoveritem-s-real-sort-key-order/discover-pool-pick-next-sort-key-order.md
- g32: Test-suite wall-clock under node --test is set by the slowest file, and what splitting files did and did not buy.
  - docs/explanation/test-suite-wallclock-file-split.md
  - docs/knowledge/why-splitting-test-files-hits-a-floor-and-why-narrowing-veri/why-splitting-test-files-hits-a-floor-and-narrowing-verify-never-helped.md
- g33: The choke-point survey of decision logic reimplemented in several places, and its ranked priority list.
  - docs/knowledge/fgos-choke-point-survey-ranked-priority-table/fgos-choke-point-ranked-priority.md
  - docs/knowledge/why-fgos-keeps-growing-the-same-decision-logic-in-more-than/fgos-choke-point-pattern.md
- g34: Failing-test-first evidence for an Iron Law-gated diff: how it is gathered and how to produce it.
  - docs/knowledge/why-the-iron-law-evidence-contract-gathers-proof-but-never-a/iron-law-evidence-contract-stays-human-gated.md
  - docs/knowledge/produce-failing-test-first-proof-for-an-iron-law-gated-diff/produce-failing-test-first-proof-for-an-iron-law-gated-diff.md
- g35: Post-land drift among sibling branches after a merge: detecting it from real changed paths and notifying live sessions.
  - docs/knowledge/why-fgos-detects-post-land-drift-among-sibling-leaves-by-int/why-post-land-drift-detection-intersects-real-changed-paths-not-declared-footprint.md
  - docs/explanation/postland-drift-notify-consumer.md
- g36: Recording merge provenance (mergedSha/mergedInto) on delivered events, and a merge that landed without it.
  - docs/knowledge/why-fgos-started-recording-mergedsha-and-mergedinto-on-the-d/why-delivered-events-now-record-real-merge-provenance-instead-of-being-inferred.md
  - docs/explanation/mergedsha-missing-unreproduced-race.md
- g37: Scoring discussion outputs with metrics eval against the discussion-quality rubric.
  - docs/how-to/compare-discussion-setups-with-metrics-eval.md
  - docs/reference/discussion-quality-rubric.md

Near misses:
- docs/knowledge/how-to-fix-a-fgos-write-rejected-merge-block-on-a-fgos-chang/fix-fgos-write-rejected-merge-block.md
  vs docs/explanation/write-rejected-trust-branchheadattake.md: Same fgos-write-rejected error, opposite cause: one is a branch that really committed a .fgos change, the other a stale branch that never touched .fgos.
- docs/knowledge/why-fgos-catchup-needed-its-own-already-caught-up-guard/why-catchup-needed-its-own-already-caught-up-guard.md
  vs docs/knowledge/why-mergerunneritem-now-checks-ancestry-before-attempting-a/merge-idempotent-on-already-merged-branch.md: Both handle an already-merged no-op, but in different verbs and opposite merge directions (catchup pulling the target into the branch vs merging the branch into the target).
- docs/knowledge/why-decisions-already-locked-and-approved-by-a-person-still/decision-record.md
  vs docs/knowledge/why-state-decisions-splits-engine-bookkeeping-from-design-de/decision-record.md: Same file name decision-record.md, but one is about restating human-approved decisions to the clarify judge and the other about splitting state.decisions zones.
- docs/knowledge/herdr-plugin-dashboard-layout-work-items-panel-action-queue/herdr-dashboard-layout-and-action-queues.md
  vs docs/knowledge/herdr-web-dashboard-layout-userflow-and-visual-language/herdr-web-dashboard-layout.md: Both are herdr dashboard layouts, but one is the Rust TUI plugin and the other the browser web dashboard.
- docs/knowledge/picknextdiscoveritem-s-real-sort-key-order/discover-pool-pick-next-sort-key-order.md
  vs docs/knowledge/rankimpact-s-real-sort-key-order/rankimpact-sort-key-order.md: Both document a real sort-key order, but for different functions (discover pool pick vs merge/triage impact ranking).
- docs/knowledge/why-a-repo-that-only-installs-fgos-as-a-claude-code-plugin-g/why-plugin-only-installs-could-not-reach-fgoss-coding-domain-dev-skills.md
  vs docs/knowledge/fix-a-project-skill-that-skill-reports-as-unknown-skill/fix-invisible-nested-project-skills.md: Both start from an 'Unknown skill' error, but one is dev-skills not shipped in the plugin and the other nested project skills invisible to discovery.
- docs/knowledge/why-the-agy-cli-executor-needs-new-project-in-its-invocation/why-agy-dispatch-needed-new-project-and-still-isnt-fully-reliable.md
  vs docs/explanation/dispatch-execute-repo-root-cwd-separation.md: Both produced a wrong-branch commit from an out-of-process worker, but one is agy ignoring its spawn cwd and the other dispatch passing the main-checkout cwd.
- docs/knowledge/why-runner-config-splits-capability-curated-vocab-executor-n/why-capability-executor-and-capacity-are-three-separate-concepts.md
  vs docs/knowledge/why-decide-for-execute-for-impact-analysis-reported-unavaila/why-capacity-for-and-capability-fields-were-unified-and-mcp-tools-get-a-hand-back.md: Share capability/capacity vocabulary, but one unifies tool-registry and dispatch vocabularies into runner.capabilities, the other fixes the capacity for/capability field mismatch.
- docs/knowledge/how-to-diagnose-a-fgos-return-blocked-by-a-verify-failure-un/diagnose-a-blocked-return-from-an-unrelated-verify-failure.md
  vs docs/knowledge/how-to-diagnose-an-fgos-approve-blocked-by-verify-fail-post/diagnose-a-verify-fail-post-merge-block-on-approve.md: Both diagnose an unrelated verify failure, but at different steps (return on the branch vs approve's post-merge verify) with different recovery.
- docs/knowledge/how-to-process-the-next-clarify-decompose-item-with-fgos-dis/process-the-next-clarify-or-decompose-item-with-discover-next.md
  vs docs/knowledge/how-to-sweep-the-clarify-decompose-backlog-with-fgos-discove/sweep-the-clarify-decompose-backlog-with-discover-loop.md: Same pool, different procedures: processing one item with discover-next vs sweeping all items with discover-loop and its stop rules.
