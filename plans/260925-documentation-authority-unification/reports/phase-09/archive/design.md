# Reader-justified archive design — budget stop

**Blocked under `w5-d5d-brief.md` item 1.** At source pin `3c368e5201f4ab4a5a245f4c6caf896d64bfc0a8`, the requested fixed-point link closure adds **637 files / 281,770,653 B**, exceeding the brief's approximately 50 MB stop threshold. Nothing in the proposed closure has been applied. This is not archive/cutover approval or a passing new rehearsal.

Read `receipt.md`, `link-closure.json`, `verification.json`, then the historical manifest/rehearsal evidence. `manifest.json.pendingRework` binds the stop report by digest; its existing sourceCommit, counts, audit descriptors and bundle remain historical, bound to `23f6eaccf5eb195a8f50e5788d38f386a901b6d2`.

## Retention rule and prior art

Reuse the existing `build-design.py`, explicit product-reader contracts, outside-plan exact-path scan, literal program-input closure and navigation seeds. Prior art: `git log -S'ruling link'` found no existing closure; `git log -G'cold|scratch|navigation'` identified `22ff13db5`, `7f1eb147f` and `c9826a369`. D5c added one-hop navigation retention, not the required transitive reading graph. Its review requires ruling targets and honest cold-cache evidence.

No per-file size heuristic and no hand list. After existing retained-reader resolution, the builder recognizes **kept rulings by their declared Document type** (Specification, Policy, Governance, Contract or Decision). Navigation roots use the existing seeds. Follow relative Markdown links from both sets, then links from every reached file, until a fixed point. Descendants inherit the originating root kind. A ruling edge records `ruling link: <readerPath>:<line>`; navigation edges record `navigation closure link: <readerPath>:<line>`. This is lexical reading-graph custody, not promotion to authority or executable liveness.

Compute the whole proposal before applying any of it. If newly retained bytes exceed **50,000,000**, emit the full file/blob/SHA/size/reason list to `link-closure.json`, return nonzero and leave the existing manifest/partition/audit objects intact. Do not cherry-pick the four cheap direct links or truncate a costly transitive branch. `rehearse.py` refuses a manifest marked with this stop before creating scratch. `verify-design.py` independently traverses the stopped graph and checks added-file digests/counts; its exit 2 means **verified stop, not completed archive proof**.

The three ruling roots at this pin are `minimum-constitution.md`, `evidence-payload-relocation-policy.md` and `claim-and-disposition-vocabulary.md`. The 102 navigation roots are enumerated in the report. The four requested direct targets are present in the proposal with their exact ruling locators; together they are 783,918 B. Transitivity also reaches `reports/phase-06/checkpoint-10-source-population.json` alone at 71,398,693 B. All 637 proposed additions, not just large examples, are listed in `link-closure.json.added`.

At the current pin, the **unapplied before set** has 124 kept readers / 1,029 relative links to 631 archived targets; if following one, resolve the source-relative target in `refs/heads/archive/260925-records` (verify the approved archive commit and blob/size/SHA from its partition before recovery), not at the reduced tip. The proposed full closure would leave 1 reader / 3 links / 3 archived targets, but is **not authorized or applied**. The actual repository has not been pruned; these counts describe proposed tip dispositions, not missing working files.

## Custody and checks retained from D5c

The historical manifest is a descriptor header. Compressed partition/reasons, reader/recovery scans and retirement specifications belong to the archive snapshot. Recovery uses `git cat-file blob <blobId>`, verifies archive commit/path, byte length and SHA256. Prior-pruned objects use exact reachable recovery blobs, not invented archive paths. Historical replay context remains the archive checkout, not current-code proof.

No product module/test is retired here. Current gate programs and their conservative temporary input closure remain until final-pin proofs and independent review freeze. Source pair accounting belongs to the Lead after the actual removal commit exists; this worker does none. The prior clone-only accounting and its full A/B/H/I results remain historical evidence, not proof of the new closure. No allowlist, baseline, assertion or frozen recipe was changed.

## Deferred rehearsal work

The stop prevents any new heavy clone/timing run. The prior fresh-clone first runs were page-cache-warm, not cold; `rehearsal.json` explicitly marks that evidence unfit for cold acceptance. A remains historically green after clone-only accounting, but **has not been revalidated for this proposal**. No new link-finding parity is claimed.

After owner disposition, finish the brief's remaining work: move physical scratch out of `archive/.scratch` into `/tmp/fgos-work/w5-d5d` or `$TMPDIR`; evict every timing clone `.git/objects` file with `os.posix_fadvise(..., POSIX_FADV_DONTNEED)`; record residency before/after and before each add; label each run by measured residency, not order. Run reduced and pre-freeze variants sequentially, one cold plus two warm adds each. If eviction cannot be demonstrated, use `first run, warm page cache` and require an owner `drop_caches` cold run at F. Clean scratch at the end. On this machine `/tmp` is tmpfs; choose a real-disk `$TMPDIR` for a valid timing run. These changes and timings are **deferred, not implemented** while stopped.

Deleted the redundant `audit/attempt-1/rehearsal.bundle` (1,788,526 B), as requested; the remaining attempt records are unchanged. The current `audit/rehearsal.bundle` is preserved.

Impact-analysis: degraded/unqueried because the brief prohibits fgOS CLI; direct source/history review only. No fgOS CLI, source Git write, lifecycle call, `.fgos`/secret access, npm suite, test runner, lease, publication or landing. No browser preview/service state is started under this constrained task.
