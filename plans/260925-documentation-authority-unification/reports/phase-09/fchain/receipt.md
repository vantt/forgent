# One F composition door — records receipt

Status: **mechanical records proof passes; no product application, semantic approval, gate closure or cutover authorization.**

Replay pin: `72d516ba54692c7eacb38fde4b3fef9f6d1edc0b` (`HEAD` when checked).
G9 immutable evidence pin: `56b3c3ebffddca273154e482e581591113c394da`.
Premise evidence remains at each unchanged shard's own pin. Census authoring/replay
pin: `608a4ada5f195b0d0b9d3568a71b8dde4954aacb`.

## Read and reproduce

The sole prepared-byte replay door is [check.py](check.py), driven by
[manifest.json](manifest.json). [check.json](check.json) contains every composed
file after-hash, ordered trace, concrete base owner, source-input hash and link.
[commands.json](commands.json) retains exact argv/stdout/stderr/exit results.

With `P=plans/260925-documentation-authority-unification/reports/phase-09`, run
`python3 -B "$P/fchain/prove.py" --all` to reproduce the records proofs. This
invokes original proof functions/scripts; it does not execute product tests.

## Reused prior art, not another patch engine

- `composition/compose.py::apply_diff` remains the actual GNU
  `patch --batch --fuzz=0 -p1` application door, using its existing disposable
  scratch workspaces. `step-07-assemble.py::hunk_edits` supplies parsed changes.
- `check_shard.py::replay_chain` still selects the Step-7 roots, replacement
  roots and named composition predecessors. Its default checkout-drift guard
  remains; the F door explicitly requests immutable pin-byte replay. All shard
  contract validation and preservation helpers are reused, not reimplemented.
- `fchain/check.py` adds cross-source ownership, changed-line provenance,
  duplicate/link checks and composed hashes around that replay. It rejects
  GNU patch's otherwise silent auto-reversal of an already-applied forward diff.
- G9's independent `chain_sources`/`replay` path was removed. G9 now calls this
  shared door; `check_shard.py --all` also has one shared-door wiring check.
  The premise validator itself does not recurse through that CLI wiring.
- Historical carry and census checks remain their owning authoring/semantic
  proofs. Their immutable authoring pre/post hashes are checked separately
  from replaying their deltas over the complete current state.
- Independent composition proof reuses the recorded W13 GNU-patch recipe and
  Step-7's existing `patch_roundtrip`, rather than writing a new replay algorithm.

Prior history, packet inventory and existing receipts were inspected before
choosing the mechanism. What was missing was one composition across all prepared
sources: earlier G9 relevant-file replay could independently accept conflicting
or already-owned deltas.

## Inventory and result

| Item | Result |
|---|---:|
| Manifest sources, including witness/history readers | 19 |
| Diff-bearing Phase-9 JSON files exhaustively inventoried | 18 |
| Selected base-chain files | 465 |
| Additional executable per-file proposals | 141 |
| Explicit cross-source links, including one linked residual | 20 |
| Composed files with after-hashes | 548 |
| `sameLinesTwice` / `conflict` / `ownerless` / `duplicateWithoutLink` | **0 / 0 / 0 / 0** |
| Existing whole-body witnesses authenticated | 546 |
| Immutable G9 decisions retained | 158 |
| Premise judgments retained without alteration | 787 |

The 141 proposals comprise 103 distinct shard-file proposals, 19 direct carries,
5 selected carry replacement roots, 4 census pointers, 1 confirmed non-shard G6
prepared patch and 9 G9 residual/new patches. Base composition predecessors are
already ordered single-owner compositions, not independent owners of each line.

The manifest also inventories `preserve-premise/prepared-patches.json`, G9's
whole-body/supplemental witnesses, old gap05 candidates, generator observations,
park-review evidence and carry source-parity extraction-unit witnesses. Historical
alternatives, generated previews and extracted-unit adaptations are not second
apply doors. Whole-body witnesses split into 465 selected-chain links, 79 generator
previews, one linked workspace residual and one no-byte-change witness.
[audit.json](audit.json) records the exhaustive diff-source census and scope checks.

## Ownership resolutions

1. **Gateway:** G9 `/2`, `/3`, `/4`, `/6`, `/7`, `/8` retain their stable indices
   but no executable payload. Their `composedBy` references name f03917, f04343,
   f04357, f06830/f06831/f06837, f07976 and f07985. In particular, preserved
   f04343 and f06830/f06831 are not retargeted. `/5` remains G9-owned and is
   rebased only after the distinct existing premise Identity correction.
2. **Map:** G9 `/1` links f00527 instead of restating its patch.
3. **Carries:** `/9`–`/12`, `/17`, `/18` and the additional `/0` bin duplicate
   are link-only. `/19` explicitly links carry 3 with a named exact predecessor;
   its diff contains only the independent map pointer/heading-depth residual.
4. **Other carry collisions:** selected replacements in `rebased-patches.json`
   cover AGENTS, the retired-corpus test, the conserved network readiness clause,
   the live backlog STR70a pointer and the richer workspace residual. Original
   carry witnesses are unchanged except for five `composedBy` links. Completed
   backlog advisory history is not revived. Two exact base-chain co-composition
   edges cover the network clause and event-store line; arbitrary overlap remains
   an error. Canonical skill carries are bound through their generated headers.
5. **Governance/map readers:** G9 records 136 pinned occurrences, including 42
   surviving occurrences, with exact shard, selected-chain or new-patch owners.
   Historical/completed/projection/retiring cases retain individual evidence.
   New `/22` owns the live mailbox map citation. No surviving reader is unowned.
6. **G9 validation:** all `plans/` scan members and evidence/G6 judgment rows
   come from pinned Git bytes, including files edited or deleted after that pin.
   Gateway G6 ownership is independently rederived; relabeling it as G9 fails.
   AGENTS must name the exact composed governance path and scope-table anchor.

No shard judgment, evidence span or patch was edited. The existing 24
`duplicateOfChain` shard observations remain resolved by their owning proof;
they are not unexplained F findings. The two classifier provenance flags remain
unchanged; L13-23.1 already accepted those proposals, so this work asks no new
policy decision.

## Commands and owning evidence

All commands below exited **0**. `$P` is the Phase-9 path defined above.

| Command | Evidence / result |
|---|---|
| `python3 -B $P/fchain/prepare.py` | Reproducible manifest, link records and exact replacement proposals |
| `python3 -B $P/fchain/readers.py` | 12 gateway readers; 136 root-document occurrences; 42 surviving; 0 unowned |
| `python3 -B $P/fchain/check.py --pin HEAD` | `check.json`: 548 files; no findings |
| `python3 -B $P/fchain/controls.py` | `controls.json`: 9 probes pass, including every finding kind, forged hash, path escape, auto-reversal, edited/deleted pinned plans |
| `python3 -B $P/preserve-premise/park-judgments/check_shard_controls.py` | 69 owning contract controls pass |
| `python3 -B $P/preserve-premise/park-judgments/check_shard.py --all` | 0 unresolved; shared F exit 0; `chain-check-72d516ba5.json` |
| `python3 -B $P/g9/check_phase9_decisions.py` | 158 decisions; 12 gateway readers; complete shared replay |
| `python3 -B $P/g9/check_phase9_decisions.py --self-test` | 30 negative controls pass, including ownership relabeling, forged AGENTS path/anchor and missing root-reader coverage |
| `node $P/carries/verify-carries.mjs` | 44 claims; 24 pointer files; existing final-pin duties retained |
| `python3 -B $P/fchain/prove.py --census` | Original `census-join/join.py --pin 608a4ada5f195b0d0b9d3568a71b8dde4954aacb` twice; byte-identical outputs; 140 files / 1,126 sites; `census-replay.json` |
| `python3 -B $P/fchain/prove.py --roots` | 423 selected roots; original Step-7 forward/rollback exact-byte proof; `root-replay.json` |
| `python3 -B $P/fchain/prove.py --composition` | 94 effective + 14 deferred specs; 89 files; 251 GNU-patch invocations; `composition-replay.json` |
| `python3 -B $P/fchain/audit.py` | Exact write scope, unchanged decisions/bodies and exhaustive diff-source census |
| `python3 -B $P/fchain/prove.py --all` | Full reproducible command receipt in `commands.json` |
| `git diff --check` | No whitespace errors |

The census script hardcodes its writable output directory. The proof runner calls
its original `main` with original inputs and assertions and relocates **only** its
`dump(path,data)` output sink into an auto-cleaned tempfile. Both normal citation
`--check` calls still execute. Its exact adapter and output hashes are recorded.
The independent W13 recipe similarly changes **only** its obsolete hardcoded
scratch directory to an auto-cleaned tempfile; all replay assertions are intact.
Neither adaptation disables a check or writes outside the granted record scope.

## Boundaries

No `docs/`, ledger, register, original composition/Step-7 chain bytes, generated
product surface or runtime state was changed. No git writes, fgOS commands,
native-addon loads, npm/cargo suites, product tests, pair accounting or cutover
commands were used. Scratch consists only of auto-cleaned tempfile directories
under `/tmp/fgos-work/`. Impact analysis is unavailable under this brief's CLI/tool
constraints; no blast-radius completeness claim is made.

Remaining final-F conservation, current-truth, guard implementation and authorized
application duties are unchanged. A green mechanical replay is **not** those
acceptances and does not transfer old approvals to a future pin.
