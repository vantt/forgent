# Gloss polish and sweep hygiene receipt

Replay/check pin: **`8fd37e3590d3654729cf2d177c90bb0fbb17dff9`** (`HEAD` during this run), **not final pin F**. The complete reproduction, `sweep.py --check --pin HEAD` and `verify.py --pin HEAD` exit **0**. This receipt supersedes current completion claims in the previous receipt; W11 artifacts remain historical evidence at their own pins. No authority promotion, semantic acceptance, parity or gate closure is claimed.

## Bounded repairs

Repaired **14 distinct gloss witnesses** (#2, #35–#39, #47, #50, #59, #61, #62, #64, #65, #94); the four composition gloss specs have regenerated diffs, inverse diffs and expected-after hashes. See [composition receipt](../composition/receipt.md) and [w12-preparation.json](../composition/w12-preparation.json).

- Git's local list retains every number 1–9 as `(n)`, including grouped labels, capitals and no duplicated subtitles.
- Holder-lock uses `(n)` for list items, keeping `mục` for sections. The corrected Vietnamese cross-reference points to **ý (8) của đoạn main-door**, not the unrelated repo-lease decision.
- The mixed-language sentences, garbled join and nested parentheses are repaired. The flattened citation still uses the scanner's required `ID (gloss)` form.
- All **104** witness lines are checked against real replayed before/after bytes. The extended existing audit covers vertical numbered/lettered lists as well as inline lists: **102 pass + 2 explained matches**, no unresolved matches. Missing-label controls reject all five git rows and generic numbered/lettered examples.

## Recomposition and unchanged judgments

All **545 bodies** were recomposed at the check pin. Exactly **four body diffs/hashes changed**: agent-mailbox spec, git spec, holder-lock spec and runner subcomponent `h-02842f76ffd2/spec.md`; their preimages are unchanged. The other **541 body diffs/hashes are unchanged**. [w12-recomposition-delta.json](w12-recomposition-delta.json) records the old/new hashes. Fifteen historical chain inputs required the existing exact authored-edit relocation; the resulting packet has no unresolved problems or current preimage drift.

Every body passes whole-file-guarded forward/rollback replay with `patch --batch --fuzz=0 --reject-file=- -p1`. Sweep independently compares each body replay with its current chain replay and ordered predecessor metadata: **zero drift, zero chain mismatches, zero body mismatches, zero judgment errors**. Verify also passes its 545 body roundtrips, evidence joins, four existing negative controls, 10 pure-pin fields and 12 patch-id equivalences.

No judge/ledger changes were needed. Source-judgment records retain their original pin provenance (`d786e305e`); content-bound evidence checks authenticate them at this run's HEAD. Counts remain **684 cohort memberships / 574 physical records**; revisions remain distinct:

| Classification | Records | Evidence passages per row |
|---|---:|---:|
| unchanged | 55 | 3,576 |
| moved | 89 | 13,040 |
| changed | 352 | 3,583 |
| absent | 78 | 995 |
| **Total** | **574** | **21,194** |

The **21,194 per-row evidence occurrences** reference **20,621 unique passages** in `passages.json`; they are not the same count. Dispositions remain **229 still-valid-as-recorded / 7 needs-recomposition / 338 owned-park**. The LF-only classification rule and all remaining parks are unchanged.

## Temporary workspace hygiene

`recompose.py` no longer creates a directory at import. Its workspace context creates a `tempfile.TemporaryDirectory` lazily under `/tmp/fgos-work/w12-gloss`, removes it on exit, and removes the parent only if it created that parent and it is empty. Caller-owned scratch roots are preserved. `verify.py` now reuses this workspace rather than maintaining another import-time root. Sweep's docstring distinguishes disposable replay writes from persistent output.

Actual sweep/verify runs started with scratch absent and left it absent. Import-only and normal/exception cleanup controls are recorded in [w12-final-audit.json](w12-final-audit.json); the enclosing reproduction's checks are in [w12-tempfile-proof.json](w12-tempfile-proof.json).

## Commands and exits

Let `G=plans/260925-documentation-authority-unification/reports/phase-09/g9`, `C` be its sibling `composition`, and `T=/tmp/fgos-work/w12-gloss`. Every Python invocation uses **`python3 -B`**.

| Command | Exit / result |
|---|---|
| `python3 -B "$G/w12-gloss-polish.py"` | **0**, complete reproduction; scratch removed |
| `python3 -B "$G/recompose.py" --pin HEAD` | **0**, 545 bodies; 1,515 patch calls, all 0 |
| `python3 -B "$G/sweep.py" --check --pin HEAD` | **0**, 1,016 chain/body patch calls, all 0 |
| `python3 -B "$G/verify.py" --pin HEAD` | **0**, 2,014 patch calls, all 0 |
| Reused `python3 -B "$T/verify.py"` (composition) | **0**, complete chain, witnesses, citation and binding/action checks |
| Reused `python3 -B "$T/independent-replay.py"` | **0**, 74 files; 221 patch calls, all 0 |
| Scratch skill generator; citation scan, before F / full chain | **0; 1 / 0**, intentional 130 findings → zero |
| Import-only, workspace normal/exception cleanup and scope/index controls | **0**, `w12-final-audit.json` |
| `git diff --check`; read-only scope/index audit | **0** |

Exact commands/exits are in [w12-commands.json](w12-commands.json), `patch-commands.json`, `sweep-check.json`, `verification-commands.json` and composition's W12 artifacts. The verification command log retains 35 expected `git show` exit-128 absence reads; these are not successful commands. Three initial enclosing attempts exited 1 and are retained as `w12-first-attempt.json`, `w12-second-attempt.json`, `w12-third-attempt.json`: caller-owned scratch cleanup, citation-parenthesis format, then verify's inherited scratch mkdir. The third attempt created an empty historical scratch directory outside the allowed scratch root; it was removed and the independent mkdir mechanism retired. The final complete run has no such residue.

Prior art reused: G9 exact authored-hunk relocation, Step 7 parser, GNU patch, W11 audit generator and persisted full/independent composition recipes, unchanged shared resolver/extractors. **impact-analysis: degraded** under the explicit no-fgOS-CLI grant; records tooling only, no runtime changes. Only `g9/**` and `composition/**` changed; no live docs, ledgers, pair accounting, product code/tests, baseline, Git write, fgOS CLI, state/secrets or suites. No preview service was launched under the exact write grant. `needsWrites=[]`. Final-pin F, independent acceptance, cutover and residual binding drift remain Lead-owned.
