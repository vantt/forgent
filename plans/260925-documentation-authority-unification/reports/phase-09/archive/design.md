# Reader-justified archive design

LOCAL candidate under L12-129/L12-137 and the D5c brief. Not F, G8 acceptance, publication, lease or cutover permission. Read `manifest.json`, `verification.json`, `rehearsal.json`, then `receipt.md`. All object custody is bound to `manifest.json.sourceCommit`; rebuild at F.

## Retention and navigation

No size threshold. Keep current read inputs and exact navigation/link targets; archive other records. Every retained row in `audit/partition.json.gz` carries its reader or link locator.

The previous outside-plan basename fan-out was wrong: a run's `receipt.json`, a fixture write, a comment, help text or a mismatching constructed filename is not a read of a plan file. It is removed, not exempted or rebaselined. Outside-plan input roots now come from explicit existing input contracts and a scan of **every tracked non-symlink file outside the plan**, excluding `.fgos/`. The scan records raw full-path lines and normalized exact paths, brace alternatives, glob targets and relative Markdown links in `audit/external-references.json.gz`. Directory names identify containers, not arbitrary reads of every descendant. Actual directory-reading contracts are seeded separately.

Keep `minimum-constitution.md`, `current-authority-map-2026-09-25.md`, `reports/phase-08/step-08-preflip-gates.json`, `reports/phase-06/step-08-report.md` and every other existing exact outside-plan link/path target. Plan navigation roots (entry plan, phase contracts, owner answers, progress, execution boundary, gate status and briefs) also retain their Markdown link targets. A linked evidence report is retained as evidence, not promoted into product authority or a new executable root.

The review's 22 false reasons / 23,297,481 original bytes are each addressed in `audit/retained-set-corrections.json.gz`: **20 files move; two stay for newly identified real navigation links**, not name matches. `pilot/README.md` is linked by `phase-06-transform-all-platform-areas-as-candidate-material.md:25`; `reports/phase-06/review-6-checkpoint.md` by `reports/phase-06/progress.md:1306`. Keeping them follows the brief's stronger explicit keep-every-navigation-target rule. Their old prose/help reasons are gone. The audit enumerates every formerly archived outside-plan target, rather than relying on the review's historical count of 21 references.

Current read inputs include alias lookup, vocabulary, constitution, switchboard, claim schema, dropped-claim register, conflict/retiring-root data, evidence-consumer table, saved inventory and identity registries. Exact source paths/functions are recorded per row. Keep both shipped inventory formats (`verify-phase-01.mjs:307-308`). Frozen reproduction inputs, decision-directory JSON, both historical pilot-round JSON sets, review-pack directory filters and six L12-133 source witnesses remain bound to their existing owning tests/read expressions. No product module or owning test is retired.

Retained plan programs keep their conservative literal input closure, with source/field/line/text witnesses. Ambiguous basenames resolve beside the program or through the named plan-relative path, never every unrelated same-name file. Enumeration residues remain a review queue, not a universal program-reachability claim. Larger navigation retention is intentional, not a failed size heuristic.

## Archive custody and retirement

Reuse the existing builder, custody verifier, disposable rehearsal, L12-134/135 embedded-reader scan, original prune manifest, six restores and exact-pair accounting. Prior art: `c9826a369`, `7f1eb147f`; searches covered `thresholdBytes`, `archive/260925-records`, `L12-129` and `scriptRefs`. No product mechanism or runtime fallback is added.

Every standalone migration retirement spec binds preimage blob/SHA and expected absence, with **“behaviour retired with the plan”**, never itself as owning proof. The reviewed ten gate programs and other current Phase 09 programs remain `retire-at-final-pin`; their temporary input closure stays until final proofs and reviews freeze. Both pre-freeze and post-freeze trees are measured; neither retires an unmet gate.

The main manifest is a small descriptor header. Full partition/reasons, historical readers, prior scriptRef joins, recovery inventory and scans are compressed **archive-only** objects, each with path/blob/SHA/size/encoding. The LOCAL archive snapshot contains the source tree plus these assets and is parented by the pin. Its actual id and create-only ref are in `rehearsal.json`; the measured main header installs that id. A different existing ref target is refused. Publishing it requires separate owner approval.

Recover by verifying the archive commit and inventory-asset descriptor, decompressing its JSON, then checking `archiveCommit:path == blobId`, recovered byte length and SHA256. Previously pruned inputs use exact recovery blobs reachable through ancestry, not pretend paths in the archive tree. Missing objects fail. Historical programs run only in their bound archive checkout; repointing execution context does not make frozen code archive-aware or prove present implementation.

## Removal accounting and checks

After the **actual** removal commit exists, the Lead appends exact out-of-allowlist `{commit,path,authority}` pairs to both phase-06 reproduction manifests' embedded `checks.mjs` exception arrays (`scripts` / `readOnlyScripts`). Account the accounting commit if needed. Never guess commit ids, change recipe logic/B pins/allowlists/baselines, or pre-account source changes.

The disposable clone demonstrates this with actual removal pairs. Pending earlier source pairs are separately labelled fixture-only simulation, not source approval. `audit/pair-accounting.json.gz` preserves every row. Unlike the previous A-only slice, this rehearsal runs the **entire unchanged `checks.mjs` before and after exception accounting**, including B/H/I. Complete outputs live in `audit/before-*.json.gz` and `audit/after-*.json.gz`. A must become green; H must have zero new findings relative to the pin. Existing failures remain visible.

Eleven unchanged owning test files run individually on each side, adding the existing candidate-status owner to the previous ten-file set. The real candidate-status and retirement CLIs are attempted on both sides. If the saved inventory's uncommitted shards prevent the retirement CLI from loading inputs, record that gap; do not regenerate/rebaseline the inventory to hide it. Independently, retirement's existing `links-resolve` evaluator consumes metadata from the real tracked platform docs, constitution and switchboard. Only that link result is asserted; unrelated evaluator inputs are disclosed fixture data, not a full retirement/cutover pass. Compare complete candidate findings and link results against the pin. The owning retirement test provides its unchanged integration proof.

## Real-disk timing and one-step rebuild

Scratch is accessed through `/tmp/fgos-work/<fresh-name>` and physically confined to this writable directory's `.scratch/<fresh-name>` on real disk. Source Git/state is never written. The rehearsal creates this symlink itself and removes its own scratch after evidence capture. HOME/state/temp are isolated; the authorized activated host's real addon/helper is staged through the existing descriptor, not a bypass. This is not working-tree Rust freshness.

Record `stat -f`, `findmnt`, exact commits, logical tip bytes and three real `git worktree add --detach` calls per variant. Dropping system caches is not permitted in this worker. Per the brief, the first add in a **fresh `--no-hardlinks --no-checkout` clone** is the cold fallback; the next two are warm. This is not a claim of physical cache eviction. Preserve the exact candidates/LOCAL archive ref in a verified evidence bundle with the source pin prerequisite. Never import that bundle into this repository.

From repository root, one invocation rebuilds the partition at HEAD, rehearses, verifies custody and cleans scratch (supply the release path from the authorized activation metadata and a never-used scratch name):

```sh
python3 -B plans/260925-documentation-authority-unification/reports/phase-09/archive/rehearse.py --rebuild --scratch /tmp/fgos-work/w4-d5c-final-pin-new --release-path '<releasePath>'
```

Rehearsal/verification/receipt outputs necessarily follow their measured commits. `audit/final-artifact-delta.json.gz` reports that delta separately; F must include final bytes and independently review every changed disposition. The measured snapshot is not silently called the final landing tree.

Impact-analysis: degraded/unqueried under the no-fgOS-CLI brief; direct history/source scans replace unavailable tool evidence, not a full blast-radius claim. Full npm suite and `scripts/run-tests.mjs` are prohibited; Cargo workspace suite is not run for these records. G10/G11, F review/timing, origin publication, main landing, real lease and source pair accounting remain Lead/owner work. No gate or production check is waived. Browser preview is deferred to avoid out-of-scope service state.
