# Premise patches: one guarded chain contract

## Current-doc rebase

Current replay pin: `5cb7d0cddabb93f5d5fcd7a0a85468447209fb2b`.
`check_shard.py --all` exits **0** with zero unresolved findings and 24 resolved
chain markers; [current report](chain-check-5cb7d0cdd.json). The owning controls
now total **82**, all passing. Full commands, initial failures, source/history
checks and boundaries are in [the F receipt](../../fchain/receipt.md).

Existing chain-basis patches for work-state and workflow are rebased without
changing replacements or judgments. All original frozen evidence remains intact.
For f07671/f07672/f07686, the optional `preservationRebind` links the single
upstream correction of their shared provenance note, not a new patch. Its
`composedBy` is the full introducing Git commit; `pin`, `sourceLine` and a hashed
single-line `source` span authenticate the corrected preservation operand.
The checker proves source/correction/replay ancestry, exact span hashes and
one-to-one line correspondence, and rejects a commit that did not introduce
that line. No rebind leaves the original obligation unchanged; a valid rebind
never permits the F chain to overwrite its corrected line. The shared F door
uses this same helper. Earlier evidence and receipts below remain historical.

## Historical contract receipt

Checked checkout: `b005d4eba8d89a28f4b7cbd66f75354708aeb23c`.
Frozen judgment/evidence pin: `c94545de5b45873cb2eb419f10124283fd730a2e`.
Authority: [L13-21](../../owner-answers.md), [chain-contract brief](../../w26-chain-contract-brief.md).

**Mechanical proof passes; no semantic approval, authority flip, source application,
lease, gate closure, or cutover readiness is claimed.** All 787 judgments and
original evidence/successor bindings are unchanged. Only their executable patch
representation and two superseded chain-marker IDs change.

## Reproduce

From the repository root, always with `python3 -B`:

```sh
python3 -B plans/260925-documentation-authority-unification/reports/phase-09/preserve-premise/park-judgments/check_shard_controls.py
python3 -B plans/260925-documentation-authority-unification/reports/phase-09/preserve-premise/park-judgments/check_shard.py --all
```

Both exit **0**. `--shard 1`, `--shard 2`, and `--shard 3` also exit 0;
[actual command results](chain-command-results.json) retain all four invocations,
with `--all` last. The checker writes
[chain-check-b005d4eba.json](chain-check-b005d4eba.json), including input hashes,
every effective chain step, proposal roundtrips and every row check.

## Before and after

The baseline was the **actual unmodified checker on this checkout**, after the
three shard reworks, not the older pre-rework totals. Its `--all` exited 1:
37 unresolved = 2 invalidShard + 16 conflictsWithChain + 2 invalidAlreadyComposed
+ 2 successorOfSurvivingSource + 15 staleChainEntry. One duplicate was resolved.
Shards 1 and 2 stopped at validation, so that baseline did **not** inspect all
787 rows. Do not interpret its missing row findings as passing rows.

| Measure | Before | After |
|---|---:|---:|
| Invalid shards | 2 | 0 |
| Stale effective chain entries | 15 | 0 |
| Unresolved findings | 37 | 0 |
| Resolved exact chain markers | 1 reached | 24 |
| Strict chain file results | 450 / 465 | 465 / 465 |
| Checker exit | 1 | 0 |

| Shard | Rows | Pin-basis patches | Chain-basis patches | Holder patches (included) | Resolved markers | Unresolved |
|---|---:|---:|---:|---:|---:|---:|
| 1 | 263 | 20 | 5 | 0 | 17 | 0 |
| 2 | 263 | 27 | 15 | 0 | 4 | 0 |
| 3 | 261 | 10 | 26 | 2 | 3 | 0 |
| Total | 787 | 57 | 46 | 2 | 24 | 0 |

All **103 distinct file proposals** replay forward and reverse with
`patch --batch --fuzz=0 -p1`, restoring exact preimage bytes (206 executions).
Offsets remain permitted; fuzz is zero. A shared file proposal executes once,
not once per attached row. None is applied to the checkout.

## `premise-patch.v1`

All three documents declare `patchContract: "premise-patch.v1"`. The only
executable proposal is `rows[].patch`; copies for a file must be identical and
`rowIds` must equal its attached rows. There is no `chainRebases`,
`successorPatches`, `base.kind`, or parallel rollback/proposal door.

Common patch fields:

- `file`, `status: "prepared-not-applied"`, `rowIds`, `basis`;
- `sourceSha256`, `proposedSha256`, `patch` (unified diff with exact a/b headers);
- `replacements[]`: `line` is the patch-base ordinal, `sourceLine` is the frozen
  evidence ordinal, `before`, `after`, and explicit `ownerRowIds` bind it to rows.
  The pin→base line diff independently checks the two ordinals' correspondence;
  unequal replacement blocks cannot silently guess a line rebind. Each owner
  needs a replacement within its original source span. Coherent tree
  context outside that span is separately pin-bound in `contextEvidence`; this
  does not expand the judgment or invent a row.

### Pin basis

`basis: "pin"` means the proposal is generated from the frozen pin. Its
`sourceSha256`, replacement-derived postimage, exact unified diff and headers
must match. It has no chain guard or holder fields. The chain must leave the
proposal's region usable: the same diff must still replay both ways, without
fuzz, on the actual chain result. An unrelated chain retarget is not permission
to rewrite this bound occurrence.

### Chain basis

`basis: "chain"` adds:

- `chainEntryIds`: the complete ordered list of effective steps for this file;
- `chainResultSha256`: the expected exact chain result, also equal to
  `sourceSha256`.

The checker first reconstructs the actual F chain from current tracked bytes.
It refuses missing/reordered entry IDs, stale/diagnostic chains or a wrong result
hash. Replacement reconstruction and diff equality use **that chain result**,
not the frozen evidence pin; actual forward/reverse replay is still required.
The row's source evidence and `sourceLine` remain pin-bound.

### Successor holder

A successor-bound row may use the same chain-basis patch contract with
`holder: {file, sections, evidence}`. Its patch file must equal both the named
holder and the row's successor file; the row's successor section must be listed
and present in the chain result. Holder evidence spans are independently checked
against the frozen pin. The two proposals are Identity's Related/§7a writer
pointers and Workflow's §18 Pointers law link. They are not patches against the
removed source, nor unnamed future work.

Shard 3's five former bare-pin replacement proofs now live in
`frozenPinEvidence`. They retain file/row IDs, original pre/post digests and
replacement evidence, **but no executable diff**. The checker verifies their
pin custody and rejects executable fields there. Its old post-chain side doors
are removed.

### Markers, absence and preservation

- `alreadyComposed` names one exact effective entry for this file, proves the
  bound old operand → named successor in that entry, requires a strict chain,
  and permits no row patch. For f00183, normalization joins only a slash-ended
  newline/comment continuation; arbitrary words are not concatenated. A missing
  continuation, wrong successor/file/entry or parallel patch is rejected.
- Source presence is independently recorded as `already-absent`,
  `removed-by-cutover`, or `surviving`. The two Identity source rows were already
  absent at the pin; they are not counted as cutover removals. A surviving source
  still fails a successor binding. Repoints still require an actual cutover
  operand move/removal, not a pre-existing broken path. Directory/glob membership
  continues to use tracked files and the physical move proof.
- Preservation checks the row's bound operand lines, not another reference in
  the same evidence paragraph. An exact line or insertion-only gloss with every
  old path-token multiplicity intact is harmless. A removed/changed path,
  path-prefix extension, or lost preserved prose still conflicts. The three
  runner gloss rows therefore pass without becoming false retarget markers.

## Fifteen stale roots, one existing supersession door

[chain-rebases.json](chain-rebases.json) enumerates every rebase and its hashes.
The **423 phase-08 predecessor values are untouched**. All **122 existing
composition values**, including historical alternatives, also remain unchanged.
Fifteen current-byte roots were appended to `composition/patch-specs.json` using
its existing `recomposed-predecessor:<file>` and `replaces: file:<file>` convention,
and selected through the existing `effectiveSpecIds` list. This is rebasing the
old entries through their existing supersession mechanism, not modifying frozen
history or creating a second chain. The superseded phase-08 records no longer
execute; the checker still inventories them.

There are now 389 selected original predecessors, 34 named replacement roots,
94 effective composition specs, 14 deferred F specs, and 29 non-executable
historical/generator records. Selection semantics are unchanged. Historical
approval does not transfer; the new roots still require G9 delta review.

Fourteen roots reuse `compose.baseline` and Step 7's exact hunk locator. The
reading-map root needed per-primary-key-line path substitution: its session-lock
paragraph had independently changed. That rebase retains all current prose and
every authored target, including distinct destinations for repeated runner paths
and their anchors. No old paragraph is restored. The removed/added path-token
multisets (anchors included) equal the old entries for **all 15** roots.

The terminal and assignment-runner markers now name their effective replacement
IDs; their retarget decisions are unchanged. No phase-08 record edit was needed.

## Controls and independent replay

| Proof | Exit | Evidence |
|---|---:|---|
| Owning checker-only controls, 69 cases | 0 | [chain-contract-controls.json](chain-contract-controls.json) |
| Phase-08 `step-07-assemble.py:patch_roundtrip`, all 423 original roots or named replacements | 0 | [phase-08-root-replay.json](phase-08-root-replay.json) |
| Existing W13 independent composition replay, including F and generator evidence; 89 files / 251 patch invocations | 0 | [composition-full-replay.json](composition-full-replay.json) |
| Consolidated checker `--all`, 465 strict file chains / 103 proposals | 0 | [chain-check-b005d4eba.json](chain-check-b005d4eba.json) |

The old **37 control results are retained unchanged** in
[chain-check-controls.json](chain-check-controls.json); their behaviours now have
a runnable owner in `check_shard_controls.py`. Former expected-red CLI and review
outcomes remain historical witnesses; the fixed corpus must now pass, while
malformed CLI input still fails. Added controls reject both basis forgeries,
chain hash/ordering/strictness errors, parallel/frozen executable representations,
wrong holder file/section/evidence, split-path marker forgeries, false source
absence, lost preserved references/prose, missing rebase roots, and forged chain
postimages/rollbacks. No production bypass or weaker test assertion was added.

The W13 script is read from
`composition/w13-replay-recipes.json:scripts/independent-replay.py`; only its
hardcoded scratch root is relocated into an auto-cleaned tempfile. All replay
logic and packet inputs are unchanged. Phase-08 proof additionally verifies
identical original composition values, all 15 retarget deltas and all 787
unchanged judgment/evidence records.

**Pre-existing historical verifier limitation, not hidden:** the older
`composition/verify-effective.py` exits 1 both before and after this change,
with the identical missing `component-boundary-source-carriage.md` error. That
script unconditionally reads a file the already-existing packet explicitly
requires to be absent. It does not reach the added entries. The current W13
independent recipe understands absent sources and passes without bypassing any
assertion. [legacy-replay-limit.json](legacy-replay-limit.json) records both real
failures. This task does not change an out-of-scope historical verifier or claim
that it passed.

## Historical reports and scope

[chain-check-56b3c3ebf.json](chain-check-56b3c3ebf.json) preserves the original
pre-rework findings. [chain-check-c804a3213.json](chain-check-c804a3213.json)
preserves the Lead's correction: successor bindings check source removal,
not removal of every operand. Its 75 unresolved findings were 33 conflicts,
23 duplicates, 15 stale entries, 2 invalid repoints and 2 absent-source false
positives. These are historical reports, not current acceptance.

The shard Markdown files retain their earlier rework narratives, explicitly
labelled historical, and point here for the current contract/result.

Only authorized records/checker files changed. No judgment decision, consumer,
docs/, ledger, register, other script, pair accounting, Git write, fgOS CLI,
addon, product test, or service was touched. `git diff --check` exits 0.
Impact-analysis is degraded/unqueried: the brief forbids its CLI and no impact
tool is exposed. Scratch uses auto-cleaned tempfile directories under
`/tmp/fgos-work/`. Markdown preview is deferred rather than starting a service
or writing outside this task's exact scope.
