# One F composition door — current-doc rebase receipt

Status: **mechanical records proof passes; no product application, semantic approval,
gate closure or cutover authorization.** Authority: L13-21.1 and L13-24, under the
[w27 records brief](../w27-fchain-rebase-brief.md).

Replay pin: `5cb7d0cddabb93f5d5fcd7a0a85468447209fb2b` (`HEAD` during this turn).
G9 immutable decision/evidence pin: `56b3c3ebffddca273154e482e581591113c394da`.
Original premise evidence pin: `c94545de5b45873cb2eb419f10124283fd730a2e`.
Census authoring/replay pin: `608a4ada5f195b0d0b9d3568a71b8dde4954aacb`.

## Read and reproduce

The only prepared-byte replay door remains [check.py](check.py), using the
unchanged [manifest.json](manifest.json). [check.json](check.json) records all
548 composed after-hashes, selected predecessors, concrete owners and source hashes.
[rebase-commands.json](rebase-commands.json) retains exact final argv, stdout,
stderr and exits, plus initial failed diagnostic results.
[rebase-validation.json](rebase-validation.json) records decision/history/scope
conservation checks. [rebase-history.json](rebase-history.json) retains all 21
initial findings and the six old/new spec references and pre/post hashes.

With `P=plans/260925-documentation-authority-unification/reports/phase-09`, use
the commands below. No source document is applied or edited by these proofs.

## Resolutions: 16 conflict, 3 sameLinesTwice, 2 ownerless → zero

1. **Nine stale chain findings across five files:** append six replacement steps
   in `composition/patch-specs.json`, preserving all 137 historical spec objects
   and all 423 Step-7 specs byte-for-byte. Select the replacements through the
   existing effective-id lists, `replaces`, `supersedes` and exact predecessor
   fields, as the earlier chain rebase did. The files are component-boundary,
   runner dispatch-vocabulary architecture, runner business rules, work-state
   and workflow. Component-boundary retains its two distinct steps: the evaluator
   pointer correction and the approved source-carriage relocation. No decision
   or approved placement is redesigned.
2. **Five whole-body witness conflicts:** rebase exactly those five G9 witnesses
   onto current pin bytes and link them to the selected steps. Their old full
   records remain retrievable through each `rebaseHistory` Git commit/selector;
   the other 541 witnesses are unchanged. Witnesses remain non-executable readers.
3. **Shard contract and workflow proposal conflicts:** refresh the existing
   `basis: chain` contract in four row copies: f08069/f08076/f08084 (one work-state
   patch) and f08335 (one workflow patch). The exact replacements, owners, frozen
   evidence, successor bindings, judgments and pin/chain basis choices do not change.
4. **Two ownerless roots:** the successfully replayed work-state and workflow
   replacement steps now bind to their concrete composition-record selectors in
   `check.json.baseOwners`. They are not independent extra patches or invented owners.
5. **Three sameLinesTwice preservation findings:** f07671/f07672/f07686 all
   observe the same dispatch-vocabulary provenance note, already corrected by
   upstream commit `594fe4194` (turn 722). Each links that single upstream owner
   through `preservationRebind.composedBy`, with full pin/file/unit hashes and
   source ordinals; none carries an executable patch. Original judgments and
   frozen evidence remain unchanged. The note is preserved in its corrected form,
   not reverted to obsolete citation wording.

The premise checker owns rebind authentication through the existing Git/span
proof primitives: both ancestry edges, exact source identity, one-to-one line
correspondence and the commit that actually introduced the corrected line.
Without a rebind, the original preservation obligation stays strict. The F door
calls this same owning helper rather than maintaining a second interpretation.
A valid rebind still cannot authorize a later F patch to rewrite the corrected note.

## Reused mechanisms and bounded checker correction

`check_shard.replay_chain`, `composition/compose.py::apply_diff`,
`step-07-assemble.py::hunk_edits`/`locate_edit`, exact forward/inverse diffs and
`replacement_result` remain the replay and rebase primitives. Prior history,
including the earlier appended-root rebase, was inspected before choosing this
representation. No alternative patch engine or permanent rebase script was added.

The first G9 run also exposed an unrelated global-byte-drift guard: all five
changed documents have **zero gateway operand occurrences at both pins**. Its
scanner now authenticates that absence in both domains for changed non-readers.
Actual gateway readers still require exact pin/checkout bytes; adding, removing
or editing a gateway reader remains an error. This does not re-pin decisions,
exclude any file, or change the 473-file / 12-active-reader census.

The complete result retains the upstream inline/fenced-code literal repairs,
work-state priority error-reporting correction and corrected vocabulary citations.
These are explicitly checked in `rebase-validation.json`, not inferred from green
patch application alone.

## Commands and exits

All final commands below exited **0**. Each Python invocation uses `-B`.

| Command | Result / owning evidence |
|---|---|
| `python3 -B $P/fchain/check.py --pin HEAD` | 548 files; 141 executable proposals; 20 existing links; zero findings (`check.json`) |
| `python3 -B $P/preserve-premise/park-judgments/check_shard.py --all` | 787 rows; zero unresolved; 24 existing resolved markers; shared F exit 0 (`chain-check-5cb7d0cdd.json`) |
| `python3 -B $P/g9/check_phase9_decisions.py` | All 158 decisions; 136 root-document occurrences; 12 gateway readers; pass |
| `node $P/carries/verify-carries.mjs` | 44 claims; 24 pointer files; 1,208 live successor bindings; existing final-pin duties unchanged |
| `python3 -B $P/fchain/prove.py --census` | Original `census-join/join.py --pin 608a4ada5f195b0d0b9d3568a71b8dde4954aacb` twice; both exit 0; all JSON outputs byte-identical; 140 files / 1,126 sites |
| `python3 -B $P/fchain/controls.py` | 13 controls pass, including non-reader drift and rejection of added/removed/edited gateway readers |
| `python3 -B $P/preserve-premise/park-judgments/check_shard_controls.py` | 82 controls pass, including forged source/owner/hash/ordinal, wrong ancestry, parallel patch and downstream rewrite rejection |
| `python3 -B $P/g9/check_phase9_decisions.py --self-test` | All 30 existing negative controls pass |
| `git diff --check` | Exit 0; no whitespace errors |

Initial diagnostics were not successes: the original F check exited **1** with
16 conflict / 3 sameLinesTwice / 2 ownerless; after the six-step rebase it exited
**1** with only the three preservation findings. The first G9 run exited **1**
with `non-record scan inputs differ from sourcePin`; the bounded scanner correction
above resolves that separately. A first disposable rebase-script attempt failed
before persisting records and was corrected; the successful run and all final
proofs are reflected above. One aggregate verification shell hit its 300-second
harness timeout during the optional G9 self-test; its complete rerun finished
successfully with a longer command budget. No test was disabled or skipped.

The census proof reuses the existing output-only `dump` relocation into
auto-cleaned tempfiles; original inputs, assertions and both citation `--check`
calls still execute. Its existing `census-replay.json` was restored because only
checkout/tempfile argv paths changed; source hash, stdout, exits and every output
hash were identical. Final invocation evidence is in `rebase-commands.json`.

`commands.json`, `root-replay.json`, `composition-replay.json` and `audit.json`
remain historical receipts of the previous turn, not proofs at this pin.
`prove.py --all` includes that turn's deliberately frozen-body audit; it is not
this brief's reproduction command. No old audit was weakened to accept new bytes.

## Boundaries and remaining duties

All 787 original judgments/evidence, the entire 158-decision G9 file, historical
spec objects, Step-7 packet and carry/census authoring packets are unchanged.
Only permitted records/checkers were changed; no `docs/`, ledger, register,
review, product/runtime file or private state was written. No git writes, fgOS
CLI, native addons, npm/cargo/product tests, pair accounting or cutover commands
were used. Scratch was confined to disposable `/tmp/fgos-work/` directories.

Impact analysis is degraded under the brief's CLI/tool constraints: no provider
query or impact tools are available here. Static callers of the changed checker
paths are the premise CLI, shared F checker, G9 checker and their owning controls;
no blast-radius completeness claim is made.

Conservation/current-truth acceptance, independent review, final-F rebind duties,
lease and authorized product application remain unchanged. Green mechanical
replay does not transfer old approvals to new hashes or authorize the cutover.
