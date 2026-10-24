# Direct-link archive rework receipt

**BLOCKED on external real-disk scratch permission, not on retention budget.** A42 (`../w5-d5e-brief.md`) replaces the rejected transitive rule. Source pin: `d3efc70c5879d6b3a599cd9998615a46a73a82bd`. The direct-link partition and custody checks pass structurally; no new rehearsal, Check A/link-finding parity, cold timing, cutover or G8/F acceptance is claimed.

## Exact retention result

The general one-hop rule in `build-design.py` adds exactly **4 files / 783,918 B**, below the 50,000,000 B guard. It recognizes already-kept ruling document types and existing navigation roots; it never follows target links or uses a filename hand list. `audit/direct-links.json.gz` carries the exact additions, roots, locators and before/after sets.

| Target under the plan root | Bytes | Ruling locator (reason prefix: `ruling link: `) |
|---|---:|---|
| `alias-table-and-resolver-contract.md` | 3,951 | `minimum-constitution.md:235` |
| `cutover-write-lease-design.md` | 27,057 | `minimum-constitution.md:244`; `evidence-payload-relocation-policy.md:15` |
| `reports/phase-06/same-path-binding-blocker.json` | 59,528 | `minimum-constitution.md:332` |
| `reports/doc-inventory.md` | 693,382 | `evidence-payload-relocation-policy.md:96` |
| **Added total** | **783,918** | **4 files** |

| Disposition at the same source pin | Before files | Before bytes | After files | After bytes |
|---|---:|---:|---:|---:|
| Retained | 888 | 632,057,359 | 892 | 632,841,277 |
| Proposed archive | 6,030 | 2,266,895,891 | 6,026 | 2,266,111,973 |
| Full plan partition (excluding archive records) | 6,918 | 2,898,953,250 | 6,918 | 2,898,953,250 |

`link-closure.json` remains byte-identical (SHA256 `93be72ebb0f8b964eccdb38666c8045c29fe2bd842d0bbc473aaf447d3b4e893`): the historical 637-file / 281,770,653 B closure explains why transitivity was rejected. The current direct-link audit binds it by digest; the old closure is not current policy. The previous 22 false basename reasons remain removed: 19 files archive, two retain for real navigation links, and `reports/doc-inventory.md` now retains for its direct ruling link.

After direct retention, **123 kept files / 1,025 relative link occurrences / 628 archived targets** remain, independently recomputed in `audit/retained-archive-links.json.gz` and the verifier. `design.md` explains normalization, approved archive-ref recovery and digest checks with an example `git show` command. These historical evidence links are not newly failing product candidate links; no fresh production link-parity result is available because rehearsal did not start.

## Implementation and proof actually executed

- Builder: **exit 0**, refreshed `manifest.json` and compressed partition/reader/link audits at the current source pin. `audit/rebuild-d5e.log` records the run. No source Git write.
- Verifier: **exit 2**, explicitly `blocked-rehearsal-not-current`, with `structuralCustodyVerified: true`. It checks the complete blob/size/SHA partition, exact one-hop additions/reasons, rejected-closure digest, all remaining link occurrences, 184 outside-plan joins, 619 navigation joins, six restored inputs, 279 reachable recovery blobs, 361 retirement specifications, 47 historical readers / 135 joins, and four rejection probes. It does **not** convert an old rehearsal bundle into a new pass. See `verification.json` and `audit/verify-d5e.log`.
- Python syntax: all three modified scripts parse using `ast.parse`, without bytecode files.
- Rehearsal: **exit 1 before clone/scratch creation**, recorded in `audit/rehearse-d5e.log`. Command: `TMPDIR=/var/tmp python3 -B <archive>/rehearse.py --scratch /tmp/fgos-work/w5-d5e-cold --release-path /home/vantt/.local/state/fgos/releases/sha256:a970a7e6052bdef1bb4113212d16caf5f2a916f6a66d2a6130b744fe458328c8`.
- No new Check A, B/H/I, test parity, worktree timing or cache residency observation was produced. The historical `rehearsal.json` evidence remains bound to `23f6eaccf5eb195a8f50e5788d38f386a901b6d2`, clearly marked historical with the new attempt/blocker metadata. Its previously reviewed A pass and old warm timings do not prove this pin.

## Cold-run code and environmental blocker

`rehearse.py` now places physical scratch outside the tree at `$TMPDIR/fgos-work/<fresh-name>` (default `/tmp/fgos-work`), with any logical `/tmp` alias also external. It removes its scratch on normal/error exit after creation, runs timing variants sequentially, and never recreates `archive/.scratch`. Before each variant's first add it enumerates every timing-clone `.git/objects` file, records per-file `fincore` pages/bytes, flushes and evicts each with `os.posix_fadvise(fd, 0, 0, os.POSIX_FADV_DONTNEED)`, then records residency again. It records residency before/after all three adds and labels by measured state, not ordinal position. Unproven eviction labels run 1 `first run, warm page cache` and requires owner `drop_caches` cold evidence at F. The verifier checks the recorded arithmetic and labels if a current rehearsal exists. **These new runtime paths are not exercised by this blocked attempt.**

`/var/tmp` is on ext4, but sandbox `mkdir /var/tmp/fgos-work` fails with **errno 30, Read-only file system**. `/tmp` is tmpfs (7.7 GiB); it is not a real-disk cold-timing substitute, and the existing rehearsal free-space guard requires more than 20 GiB. No bypass, in-tree fallback, lowered guard, fake residency or old timing substitution was used. No scratch was created, so no cleanup remains. To finish, rerun in a permission frame with writable external real-disk scratch, at least the existing space guard, and the same scoped archive output; then run both variants and the full verifier. No additional repository write scope is required (`needsWrites=[]`).

`audit/attempt-1/rehearsal.bundle` stays deleted; the other attempt-1 records and current historical bundle are unchanged. No pair accounting, product/test edit, source Git write, fgOS CLI, `.fgos`/secret read, lifecycle verb, publication or landing. The runner owns committing. Impact-analysis is degraded/unqueried under the no-fgOS-CLI brief; direct source/history review only. npm test and `scripts/run-tests.mjs` are prohibited; Cargo and browser/service preview were not run for this records task.
