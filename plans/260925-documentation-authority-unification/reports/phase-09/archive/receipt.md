# Archive continuation receipt

**Task complete as a local design/rehearsal; G8 remains partial pending independent review and F.** Source pin: `e158e672682f4b305230e099f72a1b10adda25e7`. Authority: W2 D5b, L12-129/L12-137. Only `archive/**` changed; no source Git write, lifecycle call, product/test edit or real-repo pair accounting.

Read `design.md`, `manifest.json`, `verification.json`, `rehearsal.json`. The former D5 evidence remains recoverable at `c9826a369836eec9b6fedaa4e8fd49051852bac8`; obsolete expanded copies were removed here, not rewritten as successful evidence.

## Delivered

- **6,761 files partitioned:** archive 6,362 / 2,351,576,666 B; retain 399 / 493,743,978 B. No small-file threshold. Every retained row has a named reader/navigation reason; real alias, vocabulary, inventory and dropped-claim inputs are explicitly explained. Exact decision-directory JSON and both historical pilot rounds are retained; no blanket ledger/pilot retention.
- **336 retirement specs** explicitly state “behaviour retired with the plan”, never themselves as owning proof. The reviewed ten current gate replayers plus eight newly found programs are `retire-at-final-pin`. Their temporary closure is 3,363 files / 1,291,609,949 B, kept until proofs/reviews freeze.
- Main manifest: **6,573 B template** (6,611 B with the rehearsal archive commit installed). Full retained/reader audits are deterministic compressed archive-only objects: **1,657,100 B**. The main candidate contains **21,745 B** of archive-facing artifacts at measurement, not the full audit or bundle. Local design/evidence occupies approximately **3.9 MB**, down from the previous 14 MB.
- Complete custody: 2,918 prior scriptRef occurrences; 47 historical readers / 135 joins; all six restored inputs retained; all 279 prior-prune recovery blobs reachable and hash-verified. Zero unresolved literal live readers; enumeration/semantic completeness remains a bounded review queue, not a universal reachability claim.

## Real-disk rehearsal

`stat -f`: `ext2/ext3 ef53 4096`; `findmnt`: **`/dev/nvme0n1p2`, ext4**. Scratch was addressed through `/tmp/fgos-work/w2-d5b-disk`, temporarily linked to scoped `archive/.scratch` on the real filesystem. Scratch is deleted after evidence capture; the small bundle preserves exact local refs/objects with the source commit as prerequisite. No other real repository was mutated.

| Variant | Tip bytes | Three actual detached-worktree adds (s) | Median |
|---|---:|---|---:|
| After final-pin acceptance, gates retired | 679,257,054 | 5.656 / 4.589 / 4.444 | 4.589 s |
| Before final-pin acceptance, gates + inputs kept | 1,970,867,003 | 19.039 / 9.562 / 12.287 | 12.287 s |

These are warm-cache local NVMe measurements, **not F acceptance**. The ~0.2 GB aspiration is not reached because retained owning readers still consume large inventory/ownership inputs.

LOCAL archive snapshot: `c2db4ec83419e01b5513d33157ed3edc77b9a11d`, ref `refs/heads/archive/260925-records`, containing the full source tree and all nine generated audit assets. Accounted reduced candidate: `bf6c4d5fd6aeca94fc0024d92f215c66a8e92a88`; pre-freeze candidate: `8f7dcee88e85bed286e9da7097f5e7a2a24e1c58`. `audit/rehearsal.bundle` verifies with the source pin prerequisite and preserves these refs without writing the source repository's refs. Rebuild/review at F; never install an interim fixture id as a production pin.

## Check A: negative before, green after

Removal fixture commit: **`ffab973828530caa61db9ade641e67178097323c`**. Both frozen reproduction recipes flag **3,409 removal commit/path pairs**, plus **209 preexisting pending pairs**. The clone-only exception-array update accounts each exact pair: before **3,618 unaccounted / exit 1**, after **0 unaccounted / 0 working violations / exit 0** in both recipes. `audit/pair-accounting.json.gz` contains every row. Prior pending pairs are labelled fixture-only simulation, not source approval.

Only the original A slice is isolated because the unchanged owning reproduction test fails earlier in ownership. B/H/ownership are not claimed green. Recipe logic, B pins, allowlist, assertions and baselines are unchanged. The Lead must perform real exact-pair accounting after the actual removal commit exists, in both manifest exception arrays; none was written outside this scope.

## Proof and exposed correction

Ten unchanged owning test files per side: **293 cases, 291 pass / 2 fail / 0 skip**, same failing titles and assertion on both sides. The two failures are the fresh-reviewer ownership commands asserting `current.noNewDoubleOwnership`; this is an existing gap, not hidden by A-green. All other nine files pass, including constitution after the directory correction. Full stdout/stderr, command argv/exits and digests are under `audit/`.

The narrower-directory attempt exposed a real new constitution failure: its usage-amendment test reads `pilot/first-round/*.json` and `pilot/second-round/*.json`, not just current decisions. The design now retains all eight inputs. `audit/pilot-directory-correction.json` and `audit/pilot-directory-missing-input-attempt.log.gz` preserve the failed attempt. No test, assertion or production check was changed. One initial scanner invocation hit its 240-second timeout; reruns with sufficient time completed. The custody verifier caught the extra failure before this final successful parity replay.

`python3 -B .../archive/verify-design.py`: exit 0, full partition/digests, four negative probes (wrong digest/object/unsafe path/self-owning proof), bundle refs/digest, raw-log integrity, failure parity and both A receipts. `git diff --check`: exit 0. Scratch Git diff confirms no test/product/script/package/bin/app source changed. The actual activated release addon/helper was staged only in the clone through the existing descriptor; HOME/state/temp were isolated. This proves Node behaviour against that release, **not working-tree Rust freshness**.

## Handoff / limits

`audit/final-artifact-delta.json.gz` binds the final main-side artifact byte delta from the measured snapshot; completed receipts necessarily follow measurement. Final F measurement must include those bytes and every approved change. Full npm/Cargo suites were not run (npm suite prohibited); G10/G11, independent retirement/enumeration acceptance, F rescan, origin publish, main merge and real lease acquisition remain Lead/owner work. No gate is waived. Impact-analysis: degraded/unqueried under the explicit no-fgOS-CLI brief. Browser preview was deferred to avoid out-of-scope service state. `needsWrites=[]`.
