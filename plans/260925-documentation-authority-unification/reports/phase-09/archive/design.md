# Reader-justified archive design

Candidate only under L12-129/L12-137; **not F, cutover permission or G8 acceptance**. Start with `manifest.json`, `verification.json`, `rehearsal.json`, then `receipt.md`. The source pin is `e158e672682f4b305230e099f72a1b10adda25e7`.

## Reused authority and correction

The W2 D5b brief adopts moving the small-record tranche too. This replaces the earlier 1 MB heuristic, not any product contract. Reused: L12-134/135 lexical embedded-reader scan, original prune manifest custody, the six L12-133 restores, and the frozen reproduction recipes' **exact commit/path exception accounting**. Prior implementation `c9826a369` and its review are historical evidence; the old tmpfs timing is not real-disk acceptance. History searches covered `thresholdBytes`, `archive/260925-records`, `L12-129`, and `scriptRefs`. No removed product mechanism is resurrected.

## Retention, without a size threshold

The partition has **6,761 files / 2,845,320,644 B** outside this archive directory:

| Final-pin disposition | Files | Bytes |
|---|---:|---:|
| Archive | 6,362 | 2,351,576,666 |
| Retain | 399 | 493,743,978 |

Every retained row has a reader or navigation reason in `audit/partition.json.gz`; no row is kept for being small. Conservative literal basename joins may over-retain output/provenance mentions; these are identified as reader-closure evidence, not a claim of arbitrary-program reachability.

- `alias-table.json`: `scripts/doc-alias-resolver.mjs` loads the default alias lookup table.
- `claim-and-disposition-vocabulary.json`: constitution, inventory gates and Phase 02 verifier consume the classification vocabulary.
- `shipped-path-conventions-inventory.json`: Phase 01 verifier reads the committed inventory; inventory generation also reads the pinned historical blob. Keep the live file and its history, not just its old object id.
- `dropped-claims-register.json`: inventory gates load the current claim-disposition register.
- `plan.md`, phase contracts, briefs, owner answers, execution plan, progress and gate status: retained plan navigation/boundary. They are not product authority and their historical evidence links resolve through the archive inventory rather than implying every report remains at tip.
- JSON files in `ledger/decisions/` and `pilot/decisions/`, both identity registries and all Phase 02 parts: retained ownership/audit/inventory consumers, including directory/constructed-name inputs. The unchanged constitution owning test additionally enumerates all JSON in `pilot/first-round/` and `pilot/second-round/` (lines 668–675); these eight inputs are retained explicitly. Other ledger/pilot files are not retained merely for their directory; they need a separate reader/navigation reason. `audit/pilot-directory-*` preserves the attempt that exposed this missing directory closure and the correction; no assertion was changed.
- Frozen rationale manifests, selected embedded libraries/checks/audits, standalone liveness/rationale programs, audit baselines, round3/4 filtered review packs, and the six restored witnesses: current owning-proof inputs, unchanged except the **exception arrays** in the disposable accounting fixture.

No `test/`, product `scripts/`, `src/` or package source is retired. The roughly 0.2 GB whole-tip aspiration remains unattained because current tests/readers still consume large inventory/ownership inputs. Removing them would require a separately approved reader redesign, not false retirement.

## Retirement means the behaviour ends

All 336 standalone migration entrypoint specs state **“behaviour retired with the plan”**. They do not cite themselves as owning proof, nor pretend a product test proves an obsolete migration replay. Generic product behaviour remains owned by the unchanged product tests. Every spec binds the complete preimage blob/SHA and expected absence.

The ten programs named by the review are explicitly tagged `retire-at-final-pin`, as are eight additional current Phase 09 programs discovered at this pin. They remain available, with their conservative transitive input closure, until their final proofs and independent reviews freeze. The temporary set is **3,363 files / 1,291,609,949 B** beyond permanent retention. Both pre-freeze and post-freeze tip variants are measured. Rehearsing the post-freeze removal does not authorize retiring an unmet gate.

## Small main manifest; audit belongs to the archive

`manifest.json` is a small header with `{path, blobId, sha256, size, encoding}` object descriptors. The full archive partition, retained audit/reasons, retirement specs, 2,918 prior scriptRef joins, 47 historical readers / 135 joins, enumeration queue and 279 prior-prune recovery rows are deterministic gzip JSON assets. These assets are **archive-only** in the candidate main tree. Their compact local copies enable review before the runner commits this design; bulky previous artifacts are recoverable at `c9826a369` and the source pin rather than duplicated here.

The LOCAL rehearsal archive snapshot is the full source tree plus the generated audit assets, parented by the source pin. Thus both original record bytes and newly generated audit objects remain reachable. `rehearsal.json` records the actual archive commit; its measured main header installs that id. At F rebuild, review and install the approved archive id in the landing header. Never copy this interim id blindly.

Recovery: verify the archive commit, fetch the inventory asset by its manifest blob id, verify compressed length/SHA, decompress JSON, then resolve the requested path to its original blob/SHA/size. Check `archiveCommit:path == blobId` for new moves before reading the blob. Previously pruned paths use their exact recovery blob and reachable ancestry, not a pretend path in the snapshot. Check recovered byte length and SHA. No automatic fallback, generator, loader or network dependency is added. Missing objects fail. The archive ref is create-only, refuses a conflicting target, and is published only with separate owner cutover approval; main still lands by real merge, never history rewrite.

Historical recipes are executed only in their bound archive checkout with their original constraints. Execution-context repointing is not a claim that their frozen source became archive-aware or proves current code.

## Removal commit requires pair accounting

Check A uses first-parent/no-merges commit/path pairs, including deletions. Therefore after the removal commit exists, the Lead must append each actual out-of-allowlist `{commit,path,authority}` pair to **both** phase-06 manifest `checks.mjs` exception arrays (`scripts` / `readOnlyScripts`). Account the accounting commit itself if necessary. Keep recipe code, B pins, allowlist, baselines and assertions unchanged; never pre-account a guessed commit id.

`rehearse.py` performs this solely in the disposable clone. The exact removal fixture commit, removal pairs and preexisting pending pairs are named in `rehearsal.json` and `receipt.md`. It runs the unchanged A slice before accounting (red), appends exact pairs, then runs it again (green: zero unaccounted/working violations). Preexisting unaccounted commits are separately labelled **fixture-only simulation of pending Lead accounting**, not retroactive source approval. `audit/pair-accounting.json.gz` contains every row. Only A is isolated because the full owning reproduction test currently stops earlier in ownership; A-green is not B/H/ownership-green or a full recipe pass.

## Rehearsal boundary

Scratch is addressed at `/tmp/fgos-work/w2-d5b-disk`, a temporary symlink to this writable archive directory's `.scratch`. This uses real NVMe/ext4 without writing another repository or an unapproved `/var/tmp` location. All clone Git writes are physically within the disposable scoped scratch; it is removed after evidence capture. The source Git index/refs, live `.fgos`, secrets, owner records and lifecycle are untouched. The activation metadata is read only for the prescribed release path.

`stat -f` and `findmnt`, three actual `git worktree add --detach` runs per variant, logical tip bytes, exact measured main artifacts, accounting and unchanged single-file test results are in `rehearsal.json`. Warm-cache local timings are not F acceptance. `audit/rehearsal.bundle` preserves the exact LOCAL snapshot/candidate refs and new objects, with the source commit as prerequisite; it is archive-only, not part of the measured main tip. Import it only into a fresh disposable clone, never this repository. The last receipt/rehearsal outputs are necessarily later than their measured tree; the receipt reports that delta. Single tests use the prescribed activated host with its real addon/helper descriptor in scratch and isolated HOME/state. This does not certify working-tree Rust freshness.

Final observed measurements and exact commit ids are in `rehearsal.json` and `receipt.md`, including the measured main-side artifact bytes. Completed receipt/rehearsal/verifier outputs are later, with their byte delta recorded separately. Ten unchanged owning files run per side; existing `audit-ownership.mjs` assertions of `current.noNewDoubleOwnership` remain an explicit baseline gap. A-green must not erase that ownership gap or hide any newly introduced missing-input failure.

Reproduce from this source pin with `python3 -B .../archive/build-design.py --output-dir .../archive`, then `python3 -B .../archive/verify-design.py`. For the disk rehearsal, create an empty `.scratch` here and the `/tmp/fgos-work/w2-d5b-disk` symlink to it, then run `python3 -B .../archive/rehearse.py --scratch /tmp/fgos-work/w2-d5b-disk --release-path <authorized-releasePath>`. Run only against a fresh scratch target; never import the evidence bundle into the real repository. All source mutations stay in this archive directory; scratch Git writes are disposable.

Impact-analysis: degraded/unqueried under the explicit no-fgOS-CLI brief. Full npm/Cargo suite, G10/G11, F rescan/review, origin publication, main landing and real lease acquisition remain unclaimed.
