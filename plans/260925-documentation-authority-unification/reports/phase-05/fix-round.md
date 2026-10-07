# Phase 5 fix round (one round, owner-authorized 2026-10-07)

Ruling: the first-round result was METHOD-MUST-CHANGE; one fix round and the redefinition of E7 were authorized (`plan.md` section 7.5b). Main was synced into the branch first (merge `9b28f0f4b`, exceptions re-digested `332effba6`): the refresh carried the registry forward (4,318 documents, 86,517 units), no claim id lost, three retired units dispositioned `supersede` by hand with evidence (`61e87f207`), default gate exit 0, ratchet exit 0.

## 1. What was done

| Item | Change | Commit |
|---|---|---|
| 1 `supersede` versus partial carry | Vocabulary amendment 2.3-001: new disposition `partial-carry` (blocks cutover, never satisfies a promotion gate, needs a `remainder`), `supersede` redefined as "the target carries the whole unit"; gate open data `claims-partial-carry` (strict and cutover are fatal; scoped; also counts registry gap rows), constitution row validator, retirement evaluators; decision checks: a `partial-carry` needs a substantive `remainder`, and a non-partial disposition whose rationale says content is omitted or missing is a fatal finding. The existing first-round shards were not re-disposed (moved to `pilot/first-round/`, unchanged). | `d2ec8b96a`, red-team hardening below |
| 2 short blocks | The extractor no longer drops blocks shorter than 20 non-space characters: a short block joins the previous block of its section, else the next, else stands alone. Result over all 3,139 tracked markdown files under `docs/`: 0 non-blank lines outside every unit (was 3,589 lines in 1,179 files), 0 overlapping units. | `5519051da` |
| 3 alias resolver | `path:line`, `path:line-line`, `path#L12`; relative links normalized against the consumer; unknown anchor is `unresolved (unknown-anchor)`, never a fallback; `fromPath` anchors validated against the old document; ancestor-section fallback marked with `precision`; GitHub slug spelling accepted; absolute and `..` paths and inverted ranges refused; old document read from a fixed revision with `--base`; `--exact` fails any approximate resolution. The pilot alias table now has one entry per heading (117 + 11) plus the two bare paths (130 entries), generated from the reviewed decisions. | `6c23967e7`, hardening below |
| 4 anchor lookup | `scripts/list-doc-anchors.mjs <path>` and `--check <path#anchor>`. | `2d0d67838` |
| 5 conflict | `reports/phase-05/semantic-conflicts.md` (SC-1); the two rows that carry the contradicted statements are `pending`. | `5bc5b2986` |

### Registry carry numbers (extractor change)

Before: 86,517 units, 46 retired, 161 identity gaps. After: 87,153 units, 66 retired, 2,926 gaps. Claim ids lost: 0. New claim ids: 3,421. Units whose digest changed with the claim id kept: 1,647 (in 931 files). Units whose digest changed and could not be paired (old id becomes an identity-gap row, successor gets a new id): 2,765, plus 20 retired. All 2,785 gap and retired rows were dispositioned `supersede` to the successor unit at the same path by a script that proves for each row that every line added to the unit is a non-blank line no unit covered before (35 are heading successors); 0 failures. Pilot B: 1 source unit changed (the `Ngữ nghĩa:` label joined the previous block; its decision row was re-keyed and re-reviewed by a fresh reviewer); candidate documents unchanged.

## 2. Re-runs

| Criterion | First round | After the fix round |
|---|---|---|
| E1 control (fresh blind doers, corrected brief, same forbidden files, scored by the lead) | 6 of 7 `unknown-blocking`, 1 `supersede` | 7 of 7 units blocking: 6 `unknown-blocking`, the table unit of line 73 `partial-carry` with a remainder that names `dev:<rev>`; 0 `supersede` rows in the shard (first round: 195, 134 lossy); counts 61 `unknown-blocking`, 52 `partial-carry`, 38 `merge`, 11 `promote`, 7 `archive-with-reason`. Met. One `merge` heading row whose rationale said "only part ... is carried" was caught by the new gate rule and re-filed `partial-carry`. |
| E4 (Pilot B scoped strict after the extractor change) | exit 0 | exit 0 with 366 of 366 reviewed; after item 5 exit 1 with exactly the two held conflict rows (`claims-not-reviewed: 2`), by design. |
| E6 aliases | 12 of 12; 14 of 20 | 130 of 130 table entries valid; the same 20 history references: 19 of 20 resolve (the one left is a bare file name with no path; explicit `no-alias`). Met. 14 of the 19 are `exact`; the 5 line forms are `line-to-section` (approximate by nature). |
| E7 (redefined) | 15.6% anchors | 1,130 of 1,130 classified; 79 of 79 rewrite-class edges have a document-level target (32) or are in the queue (47); 12 anchors derivable. Met by the new definition. |
| E8 fresh readers (anchor tool) | reader 1 two non-existent anchors | two fresh readers: 6 of 6 per scenario each; 0 of 20 and 0 of 17 cited anchors do not exist (checked by script); 2 to 3 files before the first owner; no legacy authority. Met. |

Gate and test numbers after the fix round: script suite 783 pass, 0 fail; ratchet exit 0.

## 3. Red-team (one pass on the fix-round diff)

Three hostile reviewers (assumption, failure mode, scope), 22 findings. Adjudicated:

| Finding | Disposition |
|---|---|
| `supersede` (and other retained dispositions) can still carry a lossy rationale and pass every gate (3 reviewers) | Accepted, fixed: `decision-loss-without-partial-carry`; the lexicon is explicit loss wording only; found one residual in the second-round shard. Not fixable by script: a reviewer who writes a loss-free rationale for a lossy row (needs token-level comparison; open for Phase 6). |
| Gap-row `partial-carry` not counted, remainder not substantive, `partial-carry` missing from the retained sets (generator and gates) | Accepted, fixed with tests |
| Resolver reads any `.md` path, absolute and `..` refs, inverted ranges; reads the working tree | Accepted, fixed (`invalid-path`, `invalid-line-range`, `--base` revision) |
| Ancestor and bare-path fallbacks exit 0 | Accepted: `--exact` added; the precision is always in the result |
| A short label ending in `:` is glued to the previous fenced block instead of the next block (393 units mix a fence with the label) | Not fixed: forward-merging labels changes unit digests again and needs a second registry carry-forward and re-review; text is not lost and ranges do not overlap. Recorded as open defect M-24 for the owner. |
| Extractor change replaces claim ids (2,785 vanished, tracked as gap rows; first-round shards orphaned) | Recorded: the lineage is in the registry gap rows; first-round shards kept as evidence outside the gate directory. Rule for Phase 6: no extractor change between decision rounds. |
| `supersede` meaning changed inside a minor amendment although the amendment rule says major version | Accepted: the amendment text now records it as an owner-authorized exception. |
| Gate edits in `check-doc-constitution.mjs` and `check-doc-retirement.mjs` beyond the literal ruling | Recorded: they only add `partial-carry` to the cutover-blocking counts ("blocks cutover like unknown-blocking"); flagged for the owner in the questions. |
| E7 "passes by construction"; stale E7 line; unexplained glob count | Stale line and glob sentence fixed; the by-construction point is the owner's own redefinition, recorded: the queue is 47 of 79 rewrite-class edges and must be worked off before Phase 8. |
| Committed manifest cannot be recomputed without the uncommitted shards; registry `toCommit` differs from `commit` | Recorded: unchanged design (decision E); the regenerate command is in the gates output. |

## 4. Open after the fix round

M-24 label gluing (above); M-05 residual: none (0 uncovered lines); the retirement check still counts only `docs/specs` and `docs/architect` as legacy roots; reviewer independence is free text; the 47-edge judgment queue; the SC-1 owner decision.
