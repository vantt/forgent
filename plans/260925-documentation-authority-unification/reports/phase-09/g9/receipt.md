# Source-context follow-up receipt

Judged source pin: **`d786e305eb20dfdda8d1634b227bd9f8a9328541`**, containing the third import/resync; **not final pin F**. `sweep.py --check --pin HEAD` and `verify.py --pin HEAD` both exit **0** at this pin. This receipt supersedes the previous current-count/completion claims; older artifacts remain historical evidence at their own pins. No semantic approval, authority promotion, parity or gate closure is claimed.

## Evidence refresh and counts

Joined `git diff --name-only d14d89865 HEAD` to **both original and current evidence paths** for all 574 physical records. The sole matching record is `phase-08/step-05-records/citation-ratchet-roots.jsonl:7`, bound to `scripts/check-legacy-docs-ratchet.exceptions.json`; its current digests/locators were rejudged and it remains **owned-park**. The entire 574-row judge/evidence packet was regenerated at the named pin, not merely this row.

The join also accounts explicitly for every changed source path in [w11-delta.json](w11-delta.json). Four changed documentation paths have selected G9 bodies and were recomposed. `docs/platform/seat-binding/spec.md` has **neither a bound passage in these cohorts nor a selected body**; no new record or patch was invented for it. None of the changed documentation paths is evidence for one of the 574 historical rows. This is distinct from their whole-file recomposition guards.

**684 cohort memberships / 574 physical records**, with revision rows kept distinct:

| Classification | Records | Passages |
|---|---:|---:|
| unchanged | 55 | 3,576 |
| moved | 89 | 13,040 |
| changed | 352 | 3,583 |
| absent | 78 | 995 |

Dispositions remain **229 still-valid-as-recorded / 7 needs-recomposition / 338 owned-park**. **No disposition changed.** Parks retain the named Documentation source-binding reviewer / Lead (G9), evidence, and row-specific next actions. The five previously identified dependency parks remain parks, and the seven pending recompositions do not become approvals.

The mapped-interval rule now ignores **one added/removed final LF only**, not other whitespace or CRLF. Comparing the actual old classifier to the new one at the **same current source pin** proves exactly **274 changed→moved passages in 26 records**. Only `tests-judgment-batch6.jsonl:16` changes its record classification, changed→moved; it was already still-valid. Current passage hashes still include the actual LF. Complete locators/digests and whitespace counterexamples: [w11-newline-proof.json](w11-newline-proof.json).

## Recomposition and body authentication

The packet contains **545 bodies**: 536 existing paths and nine absence-guarded creations; 46 no-byte-change bodies, 79 generator-evidence-only bodies, 14 final-pin-conditional bodies. **Seven body diffs/hashes changed** relative to the committed pre-follow-up packet:

- `docs/platform/agent-confinement/decisions/confinement-authority-decisions.md`
- `docs/platform/agent-confinement/history/rollout-and-settled-facts.md`
- `docs/platform/agent-confinement/spec.md`
- `docs/reading-map.md`
- `docs/platform/holder-lock/spec.md`
- `docs/platform/agent-mailbox/spec.md`
- `docs/platform/git/spec.md`

The first four have drifted preimages; the last three carry the repaired glosses. The other **538 body diffs/hashes are unchanged**. Composition's confinement base and its credential-store successor were rebound together. The existing explicit reading-map resolution was extended by one authored-hunk mapping: retain import-3's probe-count/private-home facts and apply only the original navigation path substitutions. No fuzzy relocation or restoration of obsolete facts.

Every body replays forward and rollback byte-exact with whole-file guards and `patch --batch --fuzz=0 --reject-file=- -p1`. `sweep.py --check` now additionally **replays each current composition chain and compares its resulting bytes to the recomposed body's replay**, including its expected-after hash. Ordered metadata equality is still checked separately. The existing exact authored-hunk locator/replay is reused, not copied into a new patch engine. `verify.py` invokes this owning check in addition to its own roundtrips.

[w11-stale-body-control.json](w11-stale-body-control.json) proves rejection in a scratch copy: an old event-store body **with current predecessorChain metadata** still self-roundtrips byte-exact, but sweep exits **1**, naming only its body/chain byte mismatch. Judgment errors, source drift and metadata mismatches are zero. The real tree has **zero body mismatches, zero chain mismatches, zero drift, zero judgment errors and zero unresolved recompositions**, exit **0**.

The historical pure-pin check also encountered an actual import-3 report regeneration: `late-areas/legacy-drift.json.head` advanced to `814c06f3dca5bebcc2521fac4ff31d0248b3660d`. `sha-map.json` records that exact committed refresh. Verification checks the current whole-file bytes against `d786e305e`, its parent against the original mapped pin, and all relevant ancestry; it does not accept an arbitrary new ancestor or edit the report. All **10 pin fields / 12 patch-id equivalences** still verify.

## Commands and exits

Let `G=plans/260925-documentation-authority-unification/reports/phase-09/g9`, `C=../composition` relative to G, and `T=/tmp/fgos-work/w11-g9`. All Python commands use **`python3 -B`**, and every G9 command below passes its pin explicitly.

| Command | Final exit / result |
|---|---|
| `python3 -B "$G/w11-followup.py"` | **0**; complete reproduction, including the expected failing stale-body control |
| `python3 -B "$G/recompose.py" --pin HEAD` | **0**; 545 bodies, no problems; **1,515 patch calls, all 0** |
| `python3 -B "$G/judge.py" --pin HEAD` | **0**; all 574 rows, final 229 / 7 / 338 |
| `python3 -B "$G/sweep.py" --check --pin HEAD` | **0**; named pin above; **1,016 chain/body patch calls, all 0** |
| `python3 -B "$G/verify.py" --pin HEAD` | **0**; 545 roundtrips plus chain/body proof; **2,014 patch calls, all 0** |
| Scratch-copy `sweep.py --check --pin d786e305eb20dfdda8d1634b227bd9f8a9328541` with stale body/current metadata | **1**, expected; only event-store body mismatch |
| Old/new classifier comparison at the same pin, inside reproduction | **0**; 274 LF-only cases, one record classification change, no disposition changes |
| `python3 -B "$T/verify.py"` (composition) | **0**; full-chain, witness, citation, shared resolver/action checks |
| `python3 -B "$T/independent-replay.py"` | **0**; 74 files; 221 patch calls, all 0 |
| Scratch skill generator / citation scanner, before F and full chain | **0 / 1**, then **0 / 0**; 130 findings→0, baseline unchanged |
| Read-only Git history, pin/blob/patch-id/ancestry/diff/status inspections | **0**; missing-source `git show` exits **128** are explicit absence evidence |
| `git diff --check`; final scope/index audit; scratch deletion | **0**; see `w11-final-audit.json` |

Exact argv/exits/output digests are in `w11-commands.json`, `patch-commands.json`, `source-read-commands.json`, `verification-commands.json`, `sweep-check.json.commands`, `sweep-check.json.specSweep.bodyReplayCommands`, and composition's `w11-*` artifacts. Reproduction recipes are persisted, not dependent on surviving scratch. The final verification command log has 35 expected missing-source reads (exit 128), not hidden successes.

Two initial reproduction attempts exited **1**, retained in `w11-first-attempt.json` and `w11-second-attempt.json`: the first failed closed on the changed reading-map hunk; the second exposed the regenerated late-area report's obsolete historical pin assertion. Both were corrected by explicit byte-bound records, not by bypassing checks. Later full reproductions pass. Audit also found removal-induced capitalization at witnesses #0/#37/#38 after stripping Markdown emphasis; these were repaired alongside #61/#62/#64, with full per-witness results in composition's `w10-gloss-audit.json`.

Reused prior art: G9 exact hunk relocation/evidence joins, Step 7 parser, GNU patch, the W10 full/independent composition replay, shared ledger resolver and immutable extractors. Read-only `git log -S` traced the chain guard to `bc2a6a014` and original mechanisms to `4f08d504d`. **impact-analysis: degraded** under this explicit no-fgOS-CLI grant; caller inspection limits changes to records tooling, not product runtime.

Only `g9/**` and `composition/**` changed. No ledger change was needed. No live docs/scripts/product code/tests, checker baseline, pair accounting, Git write, fgOS CLI, state/secrets, suites or preview service. The previous assignment's ratchet blocker is historical, **not this follow-up's blocker**; this brief neither requests nor reruns that ratchet. Scratch is removed at handoff. `needsWrites=[]`. Final-pin F, independent semantic review, remaining parks/binding drift and actual cutover remain Lead-owned.
