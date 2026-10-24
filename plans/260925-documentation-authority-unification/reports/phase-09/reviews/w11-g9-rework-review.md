# W11 review of the G9 and composition rework (commit bc2a6a014)

Verdict: **REWORK** (one high, small fix). Read-only review against `w10-g9-rework-brief.md`. Branch HEAD at review time: `0e8c6c15b`, which adds only `w10-import3-brief.md` on top of `bc2a6a014`.

## Findings

| id | severity | verdict | summary |
|---|---|---|---|
| sweep-check-fails-at-commit | high | REWORK | `sweep.py --check` exits 1 at `bc2a6a014` and at HEAD. It exits 0 only at the parent `d14d89865`, which is the pin the receipt certified. |
| gloss-lowercase-after-label-removal | low | REWORK | Witnesses #61, #62 and #64 (holder-lock spec lines 420, 425, 428) lost their `D1:`…`D8:` labels and now start sentences in lowercase. The receipt says no other fault was found. |
| scope-and-repin | info | APPROVE | Scope is exact, and the exceptions diff is the single `inputCommit` line. Blobs are byte-equal and patch-ids are equal. |
| ratchet-not-caused-or-masked | info | APPROVE | The 3 digest mismatches come before this commit. No checker reads the field that was changed, and `docs/` is untouched. |
| gloss-16 | info | APPROVE | #16 now reads "in the plan, porting uses `project:porting`…". The line reads naturally, it is true, and it has no citation token. |
| recomposed-five | info | APPROVE | The five bodies equal an independent replay of the current chain. Each replays forward and rollback byte-exact with `--fuzz=0`. Only these five diffs changed. |
| chain-check-detects-staleness | info | APPROVE | Proved on a scratch copy: the check fails when the old packet is restored, fails when one body is reverted, and passes on the current packet. |
| chain-check-metadata-only | low | NOTE | The check compares the recorded `predecessorChain` metadata, not the body. A stale body that carries a refreshed `predecessorChain` passes both sweep and verify. |
| duplicate-line-fix | info | APPROVE | All 20 rows are now `moved`/still-valid, and every moved passage is byte-equal. The counts match `judgments.json` and the sweep. |
| moved-trailing-newline-gap | low | NOTE | The new mapped-interval rule needs `value == text` exactly. 274 passages differ from their bound text only by a trailing `\n` and are still `changed`. This affects 1 record's classification and no disposition. |
| five-dependency-parks | info | APPROVE | The 5 rows are owned parks. Each names its changed dependency in `nextAction`. No still-valid row hides a changed dependency. |

## Evidence

### 1. Scope and re-pin

`git show --name-only bc2a6a014` lists only `g9/**`, `composition/**` and the exceptions file. The exceptions diff is one line: `inputCommit 92260972c… → 5965143b4…`.

`git show <c>:scripts/check-legacy-docs-ratchet.exceptions.json | sha256sum` gives `67d639b0…` for both commits. Note that in zsh, `$c:s…` is a history modifier, so the revision has to be written `${c}`. `git patch-id --stable` gives `585be0a4…` for both. `5965143b4` is an ancestor of `bc2a6a014`. `sha256(JSON.stringify(mainMergeAccounting))` is `4957bd9e…` at both commits, so `objectSha256` stays true.

### Ratchet

`node scripts/check-legacy-docs-ratchet.mjs` exits 1 with the same three files: confinement-authority, reading-map and seat-binding. No `.mjs`/test reads `previousMainMergeAccounting` or `inputCommit`; the only grep hit is the JSON itself. `git diff d14d89865 bc2a6a014 -- docs` is empty. `w10-ratchet-before.json` and `w10-ratchet-after.json` have identical findings. The commit neither caused nor masked the failures.

### 2. Glosses

The `w8-citation-glosses.json` diff is the #16 `after` line only, and the `patch-specs.json` change is the matching event-store gloss spec. Replaying the current chain for event-store from `file@bc2a6a014` gives `061f4d67…` with exit 0. That equals the spec's and the body's expected-after hash, rollback is byte-exact, and the output contains "in the plan, porting uses".

`w10-citation-verification.json` records exit 0 / "no findings" after F, and 130 findings before F. I did not rerun it: that needs a full scratch tree. `CITATION_RE` finds no token in #16.

**Missed faults.** A scan of all 104 after-lines for new `. <lowercase>` sentence starts finds:

- #61: registry, primitive, route, account, bỏ, luật
- #62: hàng, hook
- #64: ba, ghi, giữ

The before text reads, for example, `Identity. D2: registry` and `cũ. D1: ba lock`. This is exactly the receipt's own fault class: "broken prose caused by removing an id". The receipt says "No other removal-induced … fault was found". Separately, `w10-gloss-audit.json` `review` is a single 179-character string, not the "complete review set" that the receipt describes.

Fix: capitalize the sentence starts, or keep a neutral list marker. Then regenerate the holder-lock gloss spec and its witnesses, replay the chain, rescan citations and recompose holder-lock. The new chain check will force the recompose.

### 3. Recomposed bodies and chain check

For each of the five paths, `chain[0].beforeSha256 == sha(file@bc2a6a014)`. Applying `spec_chains()[path]` diffs in order with `patch --batch --fuzz=0` reproduces the body's `expectedAfterSha256`. The body's own forward and rollback diffs also round-trip byte-exact. Against `d14d89865:g9/recomposed.json`, exactly these 5 paths have a different diff or after-hash; the other 540 differ only in `sourceCommit`.

The proof ran in a scratch root: symlinked repo, with g9/ copied and `GIT_DIR` exported.

- Current packet: `--check --pin d14d89865` exits 0.
- Old packet from `d14d89865`: exits 1 and names exactly the 5 paths.
- Only the event-store body reverted: exits 1 and names event-store.
- Old event-store body with the current `predecessorChain` copied in: **exits 0**. `verify.py` has the same blind spot, because it checks only self-roundtrip and chain metadata. This needs a hand edit of the packet, since `recompose.py` writes both together. A cheap hardening is to assert that `diffSha256` of the last chain edge is consistent with the body, or to replay the chain when `chain[0].beforeSha256` equals file@pin.

### High: sweep check at the committed tree

`python3 -B g9/sweep.py --check` gives:

| pin | exit |
|---|---|
| HEAD | 1 |
| `--pin bc2a6a014` | 1 |
| `--pin d14d89865` | 0 |

At the two failing pins, `judgmentErrors` holds 2 errors for `phase-08/step-05-records/citation-ratchet-roots.jsonl:7`: "judgment evidence changed" and "missing or altered current locator/digest evidence". Its 14 passages bind `scripts/check-legacy-docs-ratchet.exceptions.json`:

- 13 passages at lines 371–378: the current sha is `198e1ea6…`, the judgment has `687e9f7f…`.
- 1 whole-file passage: the current sha is `d45170ad…`, the judgment has `b0cc4d28…`.

This commit's own `inputCommit` re-pin changed those bytes. The Doer ran the check with `--pin HEAD` while HEAD was `d14d89865`. The sweep reads source bytes from git, so it could not see the uncommitted exceptions edit, while it read `g9/`/`composition/` from the working tree.

The brief requires "The final `g9/sweep.py --check` must exit 0 at your tree". The receipt's "exit 0" holds only at the parent. `verify.py` would fail at this tree too, because it asserts no judgment errors.

Fix: re-judge that row at a pin that contains the re-pin, either `bc2a6a014` or the branch head. Its disposition (absent → owned-park) should not change. Then rerun sweep and verify at that pin and correct the receipt.

### 4. Duplicate-line fix

`w10-judgment-delta.json.recordChanges` has 25 entries:

- 20 go `changed→moved` and `owned-park→still-valid`. These are runtime-r20 ×10, tests-cutover-neutral ×6 and tests-root-neutral ×4, and include `runtime-r20.jsonl:34`.
- 5 go `still-valid→owned-park`.

The sweep at `bc2a6a014` agrees: all 20 are `moved`, none has a changed or absent passage, and every moved passage has `currentSha256 == boundSha256`. Totals match the receipt and `judgments.json` counts: 55/88/353/78 records, 3,576/12,766/3,857/995 passages, and 229/7/338 dispositions.

Residual: 274 passages, in 26 records, have `currentText == boundText + "\n"` and are still `changed`. The `unchanged` branch already tolerates this with `rstrip('\r\n')`; the new moved rule does not. Only `tests-judgment-batch6.jsonl:16` would become fully moved, and it is already still-valid. The other 25 records keep other real changes, so no disposition changes.

### 5. Dependency parks

| row | changed dependency |
|---|---|
| `step04-009:3` | `docs/architecture-manifest.json` |
| `step04-030:4` | `docs/backlog.md` |
| `step04-030:8` | `docs/specs/reading-map.md`; the current sha `46c52e95…` is itself the ratchet-mismatched file |
| `generators-skills-and-support:3` and `:96` | `domains/coding/skills/_shared/coding-cell-policy.md` |

All five are `owned-park` with owner "Documentation source-binding reviewer / Lead (G9)" and have `unresolvedDependencies` set. Each `nextAction` names the dependency's path, range and slot. `judge.py` now also blocks `needs-recomposition` when the row has no changed primary passage. No still-valid row has a changed or absent dependency passage, and `verify.py` now asserts this.

## Not checked

I did not run the full composition verify or the citation scan; I relied on the recorded artifacts and on the event-store replay above. I did not run suites.

The scratch directory `/tmp/fgos-work/w11-g9-review/` has been deleted, and the worktree status is clean.
