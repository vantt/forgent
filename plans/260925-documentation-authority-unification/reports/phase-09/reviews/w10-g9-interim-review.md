# w10 review: G9 interim source judgments (4f08d504d)

Reviewed at HEAD 83305ec4d (merge of 4f08d504d with 928f5cc14). Read-only; scratch was `/tmp/fgos-work/w10-g9-review/` and has been deleted. No git writes, no fgos CLI, no test suite.

**Verdict: REWORK.** One high finding (`recomposed.json` no longer matches the composition chain at HEAD, and `sweep.py --check` cannot see this). The w4 source-pin-provenance REWORK is closed for the records, but stays open at Lead level.

## Findings

### scope: APPROVE
33 files changed. 24 are under `g9/`. The other 9 are the re-pinned record files listed in the receipt: `ledger/decisions/s16-import2-resync.json`, `g0fix/needs-writes.json`, `g0fix/receipt.json`, and under `import2/` the files `binding-refresh.json`, `checks.json`, `deferred-rebinds.json`, `merge-accounting.json` and `receipt.json`, plus `late-areas/legacy-drift.json`. A JSON leaf diff shows 12 changed leaves, and every one is a pin value (92260972c→5965143b4, a27d85d0a→e70742232). That matches the receipt and `record-repins.json`. There are no changes under docs/, code, tests or .fgos. No path outside P changed between cd4f80ecc and HEAD.

### sweep-check-at-head: APPROVE
`python3 -B g9/sweep.py --check` at HEAD exits 0 in 21 s. It reports 684 memberships, 574 records, 55/68/373/78, 545 spec rows, 0 drifted, 0 judgment errors, and 84 historical preimages that differ from current bytes (32+52). That matches the receipt. `sweep.py` has no hex commit literal and `--pin` defaults to HEAD.

### recomposed-stale-at-head: REWORK (high)
After the Doer cut from cd4f80ecc, the sibling commit 928f5cc14 (merged in 83305ec4d) rewrote 5 conditional final-pin specs in `composition/patch-specs.json`: `w8:gloss:docs/platform/{agent-protocol,event-store,git,process,terminal-control}/spec.md`. Each had its diff, rollback and expectedAfterSha256 changed. `g9/recomposed.json` still consolidates the old glosses. For all 5 paths, every old-only added line is present in the recomposed body and no new-only line is. One example is the known-bad text "authenticates the the pinned publication-reader contract pin" in event-store. I rebuilt verify.py's predecessor-identity assertion read-only against `spec_chains()` at HEAD, and it fails for exactly those 5 paths, so `verify.py --pin HEAD` would fail now. `sweep.py --check` still passes because `spec_sweep` checks only the effective `beforeSha256` against the file. It never checks that the effective body still matches its composition chain.
Fix: rerun recompose/judge/verify at HEAD for these 5 paths. Add a chain-identity check to `sweep.py --check` (predecessorChain specId/expectedAfter/diffSha256 vs `spec_chains()`), so that a composition edit reopens G9.

### judgment-evidence: APPROVE
Across all 574 rows and 21,256 evidence passages, I checked every stored current line range and digest against `git show HEAD:<path>`. 20,748 match the line slice exactly or without the trailing EOL. The 8 mid-line moved passages match their stored text, which occurs once in the file at the stated line. 438 passages are absent and have no file. I took a stratified sample of 34 rows (3 per cohort × classification × disposition cell, covering 518, overlaps, W0 deferred and multi-membership rows) and checked it separately. The counts 214/7/353 and 55/68/373/78 match the json. Every park names an owner and a row-specific next action with current ranges and slot ids. For 4 sampled changed→still-valid rows, the retained non-document operands are present at HEAD at the cited lines.

### parks-are-mechanical: APPROVE (note)
The dispositions come from 5 reason templates (275 changed→park, 140 byte-equal, 78 absent, 74 operand-retained, 7 recompose), not from reading each row. 353 of 574 rows are parked, all owned by "Documentation source-binding reviewer / Lead (G9)". The brief allows this and the receipt says it plainly. Still, most of the judgment G9 needs is deferred to the Lead before F, which is not what "do the bulk now" asked for.

### duplicate-line-false-changed: REWORK (low)
20 rows classified changed and parked have changed passages whose bound text equals the current text byte for byte. One example is `runtime-r20.jsonl:34`, where `    pub path: String,` appears twice in operations.rs. `classify_passage` only treats a passage as moved when it occurs once (`now.count(text) == 1`), so a repeated line that moved is reported as changed. The error is conservative, but it inflates changed and parked by 20 and puts work on the Lead that should not be there. Fix: when the interval mapped through the line edits equals the bound text, classify it moved.

### overlap-dependency-reasons: REWORK (low)
5 still-valid rows got that disposition only because their primary passage is byte-equal. Their changed dependency is not addressed in the reason: in step04-009:3 and step04-030:4/:8 it is an explicit-overlap-dependency (`docs/architecture-manifest.json`, `docs/backlog.md`, `docs/specs/reading-map.md`), and in generators-skills-and-support:3/:96 it is the canonical coding-cell-policy source. The changed dependency is why these rows are in the overlap cohort, so the judgment should state why that change does not affect the recorded decision. This matters most for reading-map.md, which is itself an old-path park.

### replay: APPROVE
In a scratch copy I ran `patch --batch --fuzz=0 --reject-file=- -p1` forward and then rollback on 9 recomposed bodies: `docs/io-contract.md`, `.githooks/pre-commit`, `src/runner/dispatch/herdr-round.mjs`, `docs/reading-map.md`, `docs/platform/agent-protocol/spec.md` (conditional), 2 docs/knowledge files, `test/runner/dead-vocabulary-guard.test.mjs` and the requiresAbsent `.agents/skills/instruction-audit/SKILL.md`. In all 9 the preimage hash, both exit codes, the after hash and the byte-exact restore matched. The replay mechanics are sound. The agent-protocol body replays cleanly but carries the stale gloss (see the high finding).

### sha-map: APPROVE
I recomputed `git show <c> | git patch-id --stable` for 7 pairs: 92260972c/5965143b4, a27d85d0a/e70742232, 3bbfa5a80/e5af4c501, 047f03fbb/2656e7c93, 0ea3d45f2/1c3052fa4, 55f05b014/091e9109a and b3144f7d5/a8475c465. All are equal, and every new SHA is an ancestor of HEAD. Only the two equal-patch-id Doer pins were re-pinned. The 24 unresolved and 37 unavailable tokens are listed and were not re-pinned. The composite locators point to byte-equal blobs at the old and new commits (import2/receipt.json, g0fix/receipt.json). Note: a27d85d0a and e70742232 have different plans/ trees (143 paths). Only patch-id equality is proven for that pair, which is what the brief requires.

### w4-source-pin-provenance: REWORK (medium, Lead-owned)
All 12 record pin leaves now name plan-branch ancestors, so the record replays no longer depend on the w1 branches. The REWORK is not fully closed. `scripts/check-legacy-docs-ratchet.exceptions.json#/previousMainMergeAccounting/inputCommit` still names 92260972c. That file was correctly outside this brief, and the checker does not read that field. Also, `git for-each-ref --contains` returns no ref for 92260972c or a27d85d0a: both are now unreachable, so they can be garbage-collected. The pointer in the exceptions file will therefore dangle. The Lead should re-pin it or retire it in a separately scoped write.

## Not checked
I did not run `recompose.py`, `judge.py` or `verify.py`: they write into `g9/` and `/tmp/fgos-work/w9-g9/`. The verify.py chain assertion was rebuilt read-only instead. I sampled the semantic correctness of the parks but did not judge them row by row.
