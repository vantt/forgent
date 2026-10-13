# Host Invocation batch report

Date: 2026-10-13. Executor: codex-session:7@2026-10-13. Step: 3. State: **closed for Phase 6 conservation under A28 and A33**. Strict closure is not claimed. This closes only the Host Invocation batch; promotion and cutover remain unapproved.

## Authorization and proof

Owner A33 at `74b3d92b202cc14bef7f1515d477d68d6cd72ea2` accepts option A of [the closure request](closure-request-host-invocation-partial-carry.md), committed at `7963b7ca6`. Acceptance is limited to exactly its 12 claim IDs at their recorded source and primary-target digests. Their `partial-carry` dispositions, remainders and review pins remain unchanged and still block cutover. Another batch cannot inherit this exception.

Fresh proof source: `74b3d92b202cc14bef7f1515d477d68d6cd72ea2`. B0: `dbe5c432852837ea01e6025b35868bcb7271495d`. SYNC: `0653419c19e7c37d8d00408ad482cdecbd45a807`. Native refresh carries the persisted working registry directly, with no carry-forward or reconstructed identity chain. Commands, outputs and reproduction helpers are recorded in the `A33ClosureVerification` entry of [host-invocation-close-verification.json](host-invocation-close-verification.json).

| Proof | Result against each prior registry |
|---|---|
| D, non-strict | Exit 0; zero fatal findings |
| Host scoped strict E | Exit 1; exactly 12 partial carries, one identical-unit exception group, 588 candidate-unverified units |
| Agent Coordination scoped strict E | Exit 1; exactly three held not-reviewed source rows, 342 exception groups, 488 candidate-unverified units |
| Native equality | All source/candidate/hold/exception identities equal; all 93,839 known IDs and path/anchor/source-digest tuples equal; no missing/additional ID or guessed graft |

The complete 12 residual rows compare equal to the committed sidecar, including shown source/primary-target/restored text, full digests, dispositions, remainders and approval pins. Every restored anchor resolves. Sidecar SHA256 remains `d47aec29839ff7bbdc9ba291890aa6478a0c4a654e55d0e096c64a7afdd4cb49`. Thus E's open set equals holds + identical-unit exceptions + committed candidate-unverified + exactly A33's 12 digest-bound rows. The strict gate remains red as required.

## Accounting

Counts come from native applied inventory, decision shards and exact tuple comparisons; the [closure request](closure-request-host-invocation-partial-carry.md) contains the complete residual appendix and preceding batch accounting.

| Class | Source rows |
|---|---:|
| Mirror | 0 |
| Unit-exact | 0 |
| Weak-exact | 0 |
| Judgment | 431 |

| Disposition | Reviewed source rows |
|---|---:|
| move | 408 |
| partial-carry | 12 |
| supersede | 11 |

All 431 source decisions and 35 Host native successors are independently reviewed. Host source holds: zero. Accepted boundary work consists of three Agent Coordination source decisions, 18 merge gaps and 43 machine re-pins, with verbatim Lead notes and original receipt authorship. Agent Coordination's 31 changed-code references remain unverified under A31. Its original Rings holds remain exactly `claim_bd4897029d5fdbab80b1b7ccee475e12`, `claim_d6db58a3090422d42154f240f54c9f5a`, and `claim_f11410ffab23bcae1d89e8b6cbedf8bc`.

Defects: the initial 14 source reworks and subsequent bounded text/rationale fixes were independently accepted. No pending boundary verdict or new content defect remains. Sensitivity: 6/6 mutations caught, 0/24 false flags. The original 30-unit truth sample found one false current assertion about setup compatibility, corrected and independently accepted; original false rate was 1/14 current assertions (7.1%), below A28's 10% stop threshold. No fresh full truth check is claimed.

Eight documented Host executor sessions now include this closure-only session (counter 7), with zero new Host source rows here. The prior request accounted seven sessions and 64 applied boundary verdicts. Three source review rounds remain 470 row instances (431 + 33 + 6): 156.67 per source review round. Across eight executor sessions, 431 initial rows give 53.875 rows/session; 470 review instances give 58.75/session. These measures do not count boundary Agent rows as Host source rows. Step 4 has not run; a combined Steps 3/4 effort baseline and token usage remain unestablished.

## Fresh-reader result and retained obligations

Under A32 and the committed key/pilot method, six reader/scenario cells scored 6/6 with partials counted correct; 25/25 distinct official anchors pass, zero legacy-authority answers, at most four files before the first correct owner. Instruction-only isolation remains **UNPROVEN**. Whole-run file counting did not meet the original phase cap (about 14 and 10 files per scenario); the accepted result uses the key/pilot counting recorded in the closure request.

Area gaps are retained: no explicit risk rubric; no area-level definition of done; restored sections need portal/pointer navigation; release-manifest ownership is outside the area; readers did not reach the deferred npm-bin clause. No area content is changed for these observations.

F6 keeps **dropped-010 deferred to Packaging-distribution (Step 4), never retired here**. Installed-default npm `bin.fgos` removal remains an open obligation; FLAGGED-obsolete verbatim retention in `architecture/release-boundaries.md` remains unchanged. A33's 12 partial carries remain explicit open cutover obligations. The alias/link preview remains 135 draft aliases and 4,031 inbound edges (3,780 immutable-history, 245 docs, six code/tests), with zero consumer edits and the active alias table untouched.

## Preservation and registry risk

Fresh preservation checks pass: 74 history witnesses, 867 inherited payloads, five frozen files; zero own allowlist violations with the same eight exemptions; extractor closure unchanged. Ratchet: 995 files, 25 accounted edits/one accounted addition. Placement: 506 files/505 matched/one recorded exception, no gaps. Only the unchanged Packaging portal metadata finding remains. Area authority statuses and reader/instruction links are unchanged. Review/apply tests with `env -u CLAUDE_CODE_SESSION_ID` pass 29/29 with zero fail/cancel/skip/todo. No full-suite, installed-release or gateway claim.

The actual proven working registry remains byte-equal to the already persisted file: 59,202,819 bytes, SHA256 `d54faf6eec8e785b33fe5902022f446d0fe25989d90e5316707c1da50e849cd9`; no rewrite is needed. Its **56.46 MB** size remains an open risk for later batches/publication (the prior request records GitHub's warning above 50 MB and hard limit at 100 MB). Compact JSON format/schema are unchanged.

No blocker remains for this batch closure. STOP after committing this report, verification, progress and the answered owner queue. No Step 4 work, promotion, cutover, push or main merge is authorized in this turn.
