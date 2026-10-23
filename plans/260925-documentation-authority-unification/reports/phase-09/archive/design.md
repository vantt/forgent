# Conservative record archive — design and local rehearsal

**Candidate, not cutover approval.** Read `receipt.md`, `manifest.json`, then `rehearsal.json`. Source pin: `cffe725b948f5a695728c8da08f114e7e97075d6`. This is the W1-close pin, **not F**. No source-repository ref, index or commit is written by this work.

## Authority and prior art

L12-129 selected an origin archive ref plus a real main merge, without rewriting history. L12-137 authorizes LOCAL pre-flip work only. The earlier prune (`ab4c65d17`) removed superseded intermediates, but the Lead measured its remaining 2.94 GB tree at 139.96 seconds. Repeating that prune without accounting for readers is not an archive design.

This design reuses the existing tree-prune manifest's blob/SHA/size custody, the L12-134 whole-plan embedded-source scan and L12-135's 47 historical reader files / 135 joins. It also retains L12-133's six restored source-witness files. No replacement inventory engine, filesystem interceptor, loader fallback, production flag or network fetch-on-read is introduced. Relevant history was inspected through `git log -G` on `scriptRefs`, `L12-129` and the archive name, and the original archive decision commit `3feda4d15`.

## Partition

`manifest.json` partitions all **6,663 files / 2,822,699,073 bytes** of the existing plan at this pin, excluding this newly authored directory:

| Disposition | Files | Logical bytes |
|---|---:|---:|
| Move off tip, exact bytes remain at archive commit | 573 | 1,750,567,128 |
| Retain unchanged | 6,090 | 1,072,131,945 |

The 573 moves comprise **260 bulk records and 313 standalone migration replay programs**. No test or product module moves. Small records stay, including historical Markdown/JSON carrying recipes; they are evidence, not executable entrypoints. Large records are not classified as regenerable.

Retained without changing bytes:

- `plan.md`, every phase document, owner answers, progress and small records;
- every ledger/pilot shard and its directory-enumerating ownership/review consumers;
- both published identity registries, the working identity registry and **all ten** Phase 02 inventory parts, including constructed-name consumers;
- the two frozen rationale reproduction manifests, their selected libraries/audits/checks, the audit comparison baselines, the full retained standalone rationale/liveness dependencies, and the six restored round3/4 witness inputs;
- current pre-flip records conservatively, except standalone migration-only entrypoints proposed for post-freeze retirement.

A retained file lists its retention reasons. Basename matches deliberately over-retain, including some output/fixture/provenance mentions. They never authorize removal. The Phase 02 inventory and the small-record population explain much of the remaining ~1.07 GB plan. **The ~0.2 GB aspirational whole-tip target is not attained by this conservative candidate.** Removing these retained inputs needs a separate product-owner-approved retirement/repoint design and its owning proofs, not a false fixture claim.

## Archive and main-side manifest

Fix the name as **`refs/heads/archive/260925-records`**. In this rehearsal it points to `cffe725b948f5a695728c8da08f114e7e97075d6`, the complete pre-removal tree. At F rebuild this manifest, independently review it and bind the ref to that approved full tree. Create the ref only if absent or already equal; do not force a different archive target.

`documentation-record-archive.v1` uses repository-relative UTF-8 paths. `records` is a path-unique, path-sorted table; looking up `path` yields `{blobId, size, sha256, archiveCommit}`. Each field describes original **blob bytes**, not formatted JSON or filesystem blocks. `archiveRef` is a discoverability pointer; the full `archiveCommit` is the immutable pin. `retained` is the conservative partition audit, not a second authority. Git modes are recorded too. No symlink is followed.

Recovery is explicit, external scratch only:

1. verify the approved ref's full commit id;
2. verify `git rev-parse '<archiveCommit>:<path>'` equals `blobId` for a newly archived record;
3. read `git cat-file blob <blobId>` into a caller-selected fresh scratch file;
4. reject unless byte length and SHA-256 equal the manifest.

`prior-prune-recovery.json` separately records all **279 already-pruned blobs**. They are not falsely presented as paths in the archive tree: recover their exact blob ids from reachable archive ancestry. No historical output is silently substituted for a different version. Missing objects are an error, not an excuse to invent a generator.

Publication and main integration remain owner/Lead work: publish the approved archive ref on origin, verify advertised commit and object recovery from an independent clone, then land the small manifest plus approved reader dispositions and removals through the real merge/Land door. Do not squash away or rewrite the archived ancestry. This worker performs none of those operations in the real repository.

## Readers and retirement semantics

Read `reader-patches/README.md`. The complete prior `scriptRefs` join has **2,918 occurrences** (2,783 string entries plus 135 historical-object entries), not merely the 47 historical files. Current product/test readers keep their exact inputs and remain unchanged.

The new pin-bounded pass scans every regular plan blob, standalone code outside the plan, recursively decoded JSON/JSONL strings, Markdown fences/inline commands and code-like log text. Its 550,597 bodies yield 19,111 conservative source/target joins. Both halves matter: a zero literal result is never accepted as proof that a directory/glob reader reads nothing. Standalone plan programs with enumeration are conservatively proposed for archival too; retained directory sets are explicit. The selected embedded ownership/audit/checks read expressions are inspected separately so exception-accounting data are not mistaken for executable reads.

The 313 deletion specs are **entrypoint retirement after final pre-flip acceptance**, not permission to bypass unmet gates. Their exact original source bytes live on the archive ref. Gate-specific migration replay stops being a maintained current-code command after the migration; the owning historical replay is named in every spec. Generic production behavior and all owning test files remain at tip. No assertion, B pin, baseline or test case is deleted or weakened.

Retained records containing historical recipes are repointed by the main-side historical execution-context table. That is a **specification/data-level repoint**, not a claim that old source code has become an archive-aware program. Use the archive checkout for an intentional historical replay, recover previously pruned inputs by their old blob receipts, and retain that replay's original input/source constraints. Do not execute an old recipe at the reduced tip or describe an archive-snapshot success as current-code evidence. Frozen embedded script text is never edited.

**Review limits:** zero unresolved *literal standalone* readers is only a bounded structural result. Enumeration candidates and 320 retained historical-record contexts remain an explicit review queue. There is no arbitrary-program reachability proof, final-pin census or independent per-entry retirement approval here. In particular, retiring Phase 09 gate replayers before their final proofs freeze is forbidden. The Lead must approve the retirement/repoint schedule together with those gates; until then G8 remains partial, not accepted.

## Rehearsal and verification

`rehearse.py` uses the already-created `git clone --no-hardlinks` under `/tmp/fgos-work/archive/`. It verifies every source digest, creates the local archive ref, applies exact whole-file deletion specs, installs the historical-context table, and creates a reduced commit with `write-tree`/`commit-tree`. No `git add` or `git commit` command is used. All 6,090 retained files are byte-verified; no `test/`, `scripts/`, `src/` or `packages/` path changes.

Ten owning files run individually both before and after reduction, with the prescribed activated host. The release's actual addon/helper is staged only as untracked scratch fixtures through the existing `native-addon.json` descriptor; HOME, temporary directories and state root are isolated. This proves current Node behavior against that release's addon, not working-tree Rust freshness.

The first rehearsal exposed two missing ownership audit baselines. `attempts/initial/` preserves that failed evidence. The design now derives the selected embedded programs' read inputs explicitly and retains both baselines. No test was changed to hide the error.

Final checkout times and exact measured-tree sizes are in `rehearsal.json`: candidate `a2206bdff60f020a05184f0b016f130a1304f9c1`, **1,269,268,322 logical bytes**, runs **8.869 / 8.523 / 8.435 seconds**, median **8.523 seconds**. Three sequential `git worktree add --detach` runs use the reduced commit and are removed through Git after each measurement. `/tmp` is **tmpfs**, warm-cache: these are local numbers, not comparable SSD evidence or F acceptance. The measured commit includes the design/spec artifacts present at measurement; later receipt/test-log bytes are listed separately, not silently called measured.

Re-run at F on the intended landing filesystem, with all final artifact bytes, current readers, review approvals, G11 release and G10 ownership rehearsal. Publication, real merge, production timing, full-suite/Cargo evidence and final cutover approval are deliberately not claimed.
