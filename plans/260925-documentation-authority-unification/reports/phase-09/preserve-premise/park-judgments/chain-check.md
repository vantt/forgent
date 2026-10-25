# Premise judgments checked against the F chain

Pin: `56b3c3ebffddca273154e482e581591113c394da` (HEAD when checked).
Authority: `../../owner-answers.md`, L13-21.1; task: `../../w24-chain-checker-brief.md`.

## Reproduce

```sh
python3 -B plans/260925-documentation-authority-unification/reports/phase-09/preserve-premise/park-judgments/check_shard.py --all
```

**Expected exit: 1.** This turn builds the checker, not the row/chain repairs.
Findings: [chain-check-56b3c3ebf.json](chain-check-56b3c3ebf.json).
Checker controls and review cross-check: [chain-check-controls.json](chain-check-controls.json).
`--shard 1`, `--shard 2` and `--shard 3` also work; `--all` was run last to leave the complete pinned report.

## Counts

All **787 rows** cover their ids exactly; their evidence spans, file/unit digests,
proof bindings and prepared-patch pre/post-images validate. Three former
checkers are removed; one checker understands their three span encodings.

| Shard | Rows | File patches | duplicateOfChain | conflictsWithChain | repointOfSurvivingPath | staleChainEntry touching shard files | Unresolved |
|---|---:|---:|---:|---:|---:|---:|---:|
| 1 | 263 | 19 | 16 | 5 | 53 | 1 | 75 |
| 2 | 263 | 16 | 4 | 12 | 6 | 0 | 22 |
| 3 | 261 | 39 | 3 | 16 | 26 | 6 | 51 |
| Unique findings across the whole chain | 787 | 74 | 23 | 33 | 85 | 15 | 156 |

Eight stale entries touch no shard source file, so the final row is not the sum
of the shard rows. A file patch is replayed once per shard, not once per row;
findings identify its affected rows. Exact forward/reverse success on the chain:
8/19, 12/16 and 32/39 file patches respectively. Duplicate patches are expected
to fail forward replay; their failures remain in `patchReplays`, but are classified
duplicate-first, not counted a second time as conflicts. Offsets are allowed;
fuzz is zero, and reverse must restore the exact chain bytes.

Of the 85 operand findings, **83 are successor-bound and two are repoints**
(`f07667`, `f08668`). The requested rule checks operands even on successor-bound
rows; this is not a semantic rejection of carrying a passage from a removed
source. An operand already absent before cutover also fails the removal trigger;
it is distinguished by `beforePresent: false` in the finding. Directory/glob
operands are expanded against the pin: a directory whose files all move is not
misreported as surviving (including the contracts directory and `docs/specs/*`).

## Replay reuse and limits

Prior art: the three shard checkers only checked bare-pin patches (introduced in
`8313bfa5e`, `b677076c0`, `42893a825`); L13-21.1 at this HEAD explicitly replaces
that gap. No old chain replay was removed or recreated here.

- Reused `composition/compose.py`'s `apply_diff` and `baseline`, which in turn
  uses `phase-08/step-07-assemble.py`'s `hunk_edits`/`locate_edit`. The module is
  imported without invoking its assembly/output door. Chain patches are applied
  and rolled back in temporary directories only.
- Inventoried all **423** predecessor records and all **122** composition specs.
  The packet's own `selectionRule` selects **404** predecessors plus **93**
  composition entries (`effectiveSpecIds`, then `finalPinFSpecIds`); **19**
  predecessors are replaced by current-byte composition roots, and **29**
  composition records are historical alternatives/generator evidence, not an
  executable second door. Their ids/replacements are in the JSON inventory.
- Simulated **465 files**, with 450 strict chain results. The **15** stale
  predecessor findings remain unresolved. For 14, the existing exact-passage
  `baseline` reconstruction supplies diagnostic bytes to expose downstream
  duplicates; it never transfers the stale entry's approval. The reading-map
  predecessor cannot be reconstructed unambiguously and remains failed. Each
  file records actual step hashes and whether its result is diagnostic.
- Reachability uses `proof.json`'s `physicalMoves` and
  `additionalStep6Removals`, exactly as `proof.py` does. The move-set input digest
  must still match the physical proof; directories/globs use tracked members.
- `alreadyComposed` must name an effective entry that changes this bound
  occurrence to its named successor, with an exact chain and no parallel patch.
  A valid marker leaves a resolved duplicate finding. Unknown/wrong-file markers,
  parallel patches and stale-entry waivers fail. No shard rows were edited here.

## Cross-check against all three reviews

All **19 named duplicate rows** are detected, with the responsible chain id:

- Shard 1: `f00148 f00156 f00158 f00161 f00162 f00163 f00175 f00177 f00178 f00181 f00183 f00187 f00189 f00191 f00193 f00478`.
- Shard 3: `f08496 f08634 f08665`. The last two are explicitly diagnostic
  duplicates and also have unresolved `staleChainEntry` findings.

All **18 named chain-conflict rows** are detected:

- Shard 1: `f00102 f00106 f00117 f00118` (AGENTS context), plus `f00477`
  (a preserved occurrence already rewritten by the chain).
- Shard 3: `f07380 f07398 f07697 f07698 f07701 f08012 f08013 f08021 f08024 f08033 f08044 f08046 f08047`.

**Classification exception:** the review also describes `f00183` as a patch
conflict after line rewrapping. It is reported as `duplicateOfChain`, not a second
`conflictsWithChain`: the exact new path is already in the chain output. The
failed forward patch is still recorded. The roadmap patch applies with an offset
at fuzz zero, as the review observed, and is not a chain conflict.

Additional detections include four duplicate gateway-yaml rows in shard 2,
seven other shard-2 patch conflicts, and preserved occurrences changed by the
chain (including the three runner gloss rows noted in review 3).

### Review issues not reported as mechanical chain conflicts

These remain the next judgment/composition turn's work, not silently accepted:

| Review rows/issues | Why this checker does not label them a chain conflict |
|---|---|
| 18 removed-door banners (16 in shard 1; `f04047`, `f04287` in shard 2) | Still preserve rows with no prepared patch and no chain edit to their occurrence; deciding that current framing is a locator is a semantic judgment. |
| `f03404` | Wrong historical rationale for a surviving live pointer; no byte conflict. |
| `f06461` | Self-referencing destination is semantically wrong, but the old operand moves and its patch replays. |
| `f06790`, `f06791` | Broken placement-tree meaning, not a GNU patch conflict; no tree-language interpretation is added. |
| `f06920`, `f06933` | Unowned live destination inside a preserved passage; there is no row patch or chain change to collide. |
| 36 `docs/history/` owned parks | Remain owned parks, not repoints; the already-settled keep decision still needs recording by their owner. |
| `f07871` | Narrowing a directory to one successor file is a semantic breadth defect; the directory really is removed and the patch applies. |
| `f07886`, `f07889` | Rewriting historical process claims is a semantic defect; `docs/specs/*` really does disappear, and the roadmap patch applies. |
| Lineage links, pre-existing broken links, uncovered successor pointers | Post-cutover link/semantic checks and authoring duties, not evidence of a prepared patch colliding with the chain. |

`f07667` and `f08668` *are* reported as `repointOfSurvivingPath`, matching the
reviews' missing-cutover-trigger objections. The checker does not claim to prove
that any replacement is merely a pointer-token change or that all live links
are covered.

## Verification and scope

- 37 checker-control cases passed: all three schemas, missing/duplicate rows,
  forged spans/digests/diffs, exact roundtrip/context rejection, rewrapped
  duplicates, directory/glob removal, valid/invalid `alreadyComposed`, and review
  coverage. These are checker-only assertions, not product tests.
- Each `--shard N` and final `--all`: exit 1, structured findings, no traceback.
- `git diff --check`: exit 0. No git writes/staging, fgOS CLI, native addons,
  product tests, pair accounting, row edits, docs edits or ledger edits.
- Impact-analysis: degraded; the brief forbids the fgOS capability-query CLI and
  this session exposes no impact-analysis tool. No blast-radius claim is made.
- Scratch is confined to auto-cleaned tempfile directories under `/tmp/fgos-work/`.

This is diagnostic evidence, not row acceptance, permission to apply the patches,
final-pin parity, gate closure or cutover readiness.

## Lead correction (L13-21.1 scope)

The brief applied the "operand must be removed or moved" rule to successor-bound rows too. A successor binding answers a different question: its *source file* is removed at cutover, while its operands may survive. The Lead changed `check_shard.py`. A successor-bound row is now checked for a removed source (`successorOfSurvivingSource`), and only repoint and `alreadyComposed` rows keep the operand rule. Rerun at c804a3213 ([chain-check-c804a3213.json](chain-check-c804a3213.json)): 75 unresolved findings, of which 33 conflictsWithChain, 23 duplicateOfChain, 15 staleChainEntry, 2 repointOfSurvivingPath and 2 successorOfSurvivingSource. The 83 earlier successor-bound operand findings were false positives of that rule.
