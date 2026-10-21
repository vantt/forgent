# Review p03 (seam 5 judgment files, batch 5)

Payload: s4-src-p03.json, 8 files, 159 items (24 ADMIT/preserve, 135 REJECT/preserve), 0 diffs, 0 parks, 0 patches. All source files read at pin 5eb9dc609.

## Per file

| file | verdict | items |
|---|---|---|
| test/e2e/domain-aware-stage-literals.test.mjs | ok | 15 |
| test/e2e/fixture-marketing-domain.test.mjs | ok | 5 |
| test/e2e/rebuild-determinism.test.mjs | ok | 1 |
| test/e2e/runner-loop.test.mjs | ok | 16 |
| test/e2e/self-improve-loop.test.mjs | ok | 4 |
| test/intake/discovery.test.mjs | ok | 14 |
| test/intake/plan.test.mjs | rework (one item) | 37 |
| test/report/authoritative-match.test.mjs | ok (record-text/consistency notes) | 67 |

## OUTCOME defects

1. plan.test.mjs, reference-004241, source L113-114 (comment `docs/how-to/avoid-vacuous-pass-with-node-test-test-name-pattern.md`). Rule: a live holder with the same passage means a patch, not a preserve (task rule; same as the L12-72 how-to source-slot patches to unique docs/knowledge holders). At the pin that how-to path does not exist (git ls-tree), while the unique holder `docs/knowledge/avoid-a-vacuous-pass-from-node-test-test-name-pattern/avoid-vacuous-pass-with-node-test-test-name-pattern.md` exists. The reason text justifies the preserve by "no module-header live-holder pointer", but R8 only exempts a comment that is dated provenance; this comment is an explanatory navigation pointer to a dead path, not a dated history citation (it carries no date or tsk-historical framing for the path itself, and the target is not under a retiring tree). Correction: either patch the comment to the docs/knowledge holder (comment-only change, no assertion touched, needs forward/inverse diff and replay per R22) or state a dated-provenance witness that the how-to path was already gone at authoring time. Medium confidence; escalated also as a Lead question below.

No other outcome defects found. All other preserves are justified: docs/history comment pointers (live, uniformly admit/preserve per R16), the docs/architect/doing-coordination-redesign.md comment (004061: treeRetires true, carrier declared Canonical: No, matches L12-80), and all rejects name a true non-document use.

## Verification of rejects (135)

- Temp repo/dir scalars, `initTempRepo()`, `mkTempDir`, `tmpStoreDir()`, `mkdtemp` and their descendants (featureDir under repoRoot/contentDir/os.tmpdir): true R21/R5; nothing resolves a repo document.
- `docs/history/<x>` docsRef/featureDir strings (domain-aware 004053-4055, runner-loop 004063-4065 and D019302/6/10, plan 004239): test-supplied fixture values written and read inside temp repos; the fake worker writes under the test-given featureDir, so the L613 `--name-only` assertion compares test-owned input, not a product-emitted document path.
- fixture-marketing 004058/004060/D018907-8: `compound --doc-path` is validated by bin/fgos.mjs only via `git cat-file -e HEAD:<callerpath>` and the registry on caller data; no fixed document root, so reject is right.
- authoritative-match candidate arrays (004243-4268, 004271-4275, D021395-D021426): in-memory or temp-dir fixtures. `bin/fgos.mjs` joins the caller's `--quadrant` to the temp repoRoot, so there is no fixed document root.
- `.fgos/events.jsonl` and state view (D021409-12): state-event-store, true.
- Label joins (`${stderr}`, `${mode}`, `${id}`): true text-label-join.

## Record-text / consistency notes (not outcome defects)

- authoritative-match: writeDoc fixtures at L173-174, 185, 205, 229-231 etc. REJECT, but the paired `--quadrant docs/how-to` CLI args (004277-004285) and `data.match`/`duplicateGroups` echo assertions (004269, 004270, 004276, 004286) are ADMIT/document-path-comparison. In the product the quadrant and the echoed paths come only from caller data (bin/fgos.mjs L3061-3105: `path.join(repoRoot, quadrantDir)`, `path.posix.join(quadrantDir, entry.name)`), with no fixed document root. By R6 ("path taken only from caller data => formatting => reject") these look like rejects. The L12-80 P03 ruling ("actual emitted product-path comparisons retain their separate admission") was followed, and the outcome is preserve either way, so no outcome change (R10). Lead may either keep it or make the whole file uniformly reject. Reason texts on these items also say "Preserve exact fixture input/output; no real source document is resolved", which is a reject rationale attached to an ADMIT.
- 004277-004285 are nine items with the identical matched expression `docs/how-to` and identical reasons; an exact-duplicate-reason checker could treat that as boilerplate (R12), but they are distinct spans of distinct calls.
- 004241 and 004240/004242 `resolverWitness.scope` text is the generic "test-owned synthetic input/output" even for comment pointers; label only.
- plan.test.mjs D021207/D021208 and D021213/D021214 are the same operation (L1621, L1651) carried as both text-label-join and scalar-pass-through; both REJECT, so agree.

## Lead-judgment questions

1. plan.test.mjs 004241: patch the dead `docs/how-to/avoid-vacuous-pass-...` comment pointer to the existing docs/knowledge holder, or keep as dated explanatory preserve? (Rule "live holder => patch" vs R8's dated-provenance allowance for non-header comments.)
2. authoritative-match.test.mjs: keep admit for emitted/echoed fixture paths and `--quadrant` args (per L12-80 P03) or flip to uniform reject (R6 caller-data-only)? Outcome identical.

## Counts

Items reviewed: 159 (15+5+1+16+4+14+37+67). Admits 24 (all preserve), rejects 135 (all preserve). Outcome defects: 1 (plan.test.mjs 004241, medium). Parks/patches/diffs in payload: 0, so no diff-related checks apply.

Status: DONE_WITH_CONCERNS
Summary: 159 items across 8 files reviewed; all admissions and preserves hold except one comment pointer (plan.test.mjs reference-004241) to a nonexistent docs/how-to path with a unique live docs/knowledge holder that arguably should be a patch. Consistency notes on authoritative-match admits recorded for Lead.
