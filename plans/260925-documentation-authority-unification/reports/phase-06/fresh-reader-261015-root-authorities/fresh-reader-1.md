# Fresh reader answers: root authorities batch

Caveat for every scenario: nearly all files in scope say "Design status: Candidate" / "Canonical: No". The binding owners they name (docs/specs/work-state.md, docs/io-contract.md, docs/platform-foundations.md, docs/doc-governance.md) are outside my reading scope, so I did not open them. Where I quote candidate text, I say it is candidate and name the binding owner.

## Scenario A: `fgos add` stops requiring `--verify`

1. What to read first
   - Start at the router, not the candidate target: `docs/platform/documentation/switchboard.md#2-area-authority-routes`. The Work state row says `legacy-current`, and the canonical owner is `docs/specs/work-state.md` (CLI I/O contract: `docs/io-contract.md`). It says the candidate route `docs/platform/work-state/**` is "not read by any reader".
   - `docs/platform/documentation/switchboard.md#4-resolution-algorithm-for-readers-and-writers`: for `legacy-current`, go straight to the listed route and do not author candidate files.
   - `docs/platform/work-state/README.md#2-read-first` and `#4-legacy-source-pointers` confirm: "Canonical until the cutover: docs/specs/work-state.md, docs/io-contract.md".
   - The candidate carries of the same text, only for orientation: `docs/platform/work-state/spec.md#3-work-item-data-dictionary` (row 8 `verify`, required: yes), `docs/platform/work-state/spec.md#add-verb` (add requires `--title --description --kind --risk --verify`).
2. What kind of work
   - A behaviour change to a state-model field and a verb in the work-state area. This is a spec-level and contract-level change, and it is a code change as well.
   - It is not a candidate-doc edit. `docs/platform/migration-authoring-rules.md#1-core-principles` says to update the current owner once (`docs/specs/work-state.md`) and not to mirror into `docs/platform/`.
   - Legacy roots are ratchet-frozen: `docs/platform/migration-authoring-rules.md#2-legacy-roots-ratchet-and-exceptions` says an edit to a baselined maintained file under `docs/specs` needs a reviewed exception. That route is listed only for stale routes, urgent defects and mechanical link fixes, so a behaviour change may not fit it. I could not tell from the files in scope how a legitimate change is supposed to land. That is an open question.
3. What contract it touches
   - `verify` is the data-dictionary element that answers harness question 5, "what proof means done" (`docs/platform/work-state/spec.md#3-work-item-data-dictionary`).
   - Business rule RUL7 in `docs/platform/work-state/spec.md#11-business-rules` says the item schema must carry enough material to answer the six questions, including `verify`.
   - The `add` verb section (`docs/platform/work-state/spec.md#add-verb`) is also touched. The same spec's Entry Points section (`#2-entry-points-and-triggers`) says `submit` gives `verify` a fixed placeholder, and that planning "keeps the verify attached" and requires a real verify for children. Those later stages depend on `verify` being present.
   - The CLI I/O contract is a possible second surface: candidate `docs/platform/work-state/contracts/cli-io-contract.md#7-machine-readable-verb-registry`, binding `docs/io-contract.md`. I did not find the `--verify` requirement stated in the candidate contract text I scanned, so I could not confirm this.
   - Platform law L5 (`docs/platform/platform-foundations.md#l5-definition-of-done-sáu-câu-hỏi`) makes the six questions the acceptance test. It says a question can only be added, never removed. Dropping the proof field is in tension with that, and the candidate L5 text says "Không có [ngưỡng xem lại] — chỉ có thể THÊM câu".
4. How much risk
   - Higher than a plain edit. The change touches a locked law's intent (L5) and a required field consumed by return and planning (`docs/platform/work-state/spec.md#7-pull-door-take-and-return`: return runs `verify`).
   - The platform-foundations doc says changing a law means superseding its decision record, not editing in place (`docs/platform/platform-foundations.md#2-authority`).
   - Binding wording is in `docs/platform-foundations.md`; the entry doc is candidate.
5. What proof means done
   - The L5 rule in `docs/platform/platform-foundations.md#l5-definition-of-done-sáu-câu-hỏi` and the design gate in `docs/platform/platform-foundations.md#4-design-gate` ("What proves done?").
   - Concretely from the add-verb text: `add` without `--verify` must not return a `validation` error (exit code 4), and the item must still reach `return`. I found no test names in scope; the add-verb section names `test/cli/fgos-intake-7.test.mjs` and `test/e2e/pr-gate.test.mjs` as existing users of `add` (`docs/platform/work-state/spec.md#add-verb`).
6. What learning gets left behind
   - A settled decision goes in the decision record (`docs/platform/platform-foundations.md#2-authority`; `docs/platform/documentation/history/templates/discussion.md#7-promotion-targets` lists choice-and-rationale -> decision, current truth -> spec).
   - Record the candidate impact in migration tracking, as required by `docs/platform/migration-authoring-rules.md#1-core-principles` (principle 4).
   - Record `No component-boundary change` if that is true (`docs/platform/component-boundary.md#3-update-rule`).

Owner I identified: `docs/specs/work-state.md` (legacy-current, routed by the switchboard). I did not open it. Not the candidate `docs/platform/work-state/spec.md`.

## Scenario B: a database, not the committed event log, holds the source of truth

1. What to read first
   - `docs/platform/platform-foundations.md#3-law-summary` (L3: JSONL/event changesets are truth; databases are rebuildable views "unless a named threshold supersedes this") and then the full L3 text in the same file: `docs/platform/platform-foundations.md#l3-luật-store-truth-ở-jsonl-db-là-view`.
   - The routing: `docs/platform/documentation/switchboard.md#2-area-authority-routes` (Platform laws row: `candidate`; authoritative text is `docs/platform-foundations.md`, so enter at the platform-foundations entry for orientation and use the legacy file for binding claims).
   - `docs/platform/documentation/switchboard.md#4-resolution-algorithm-for-readers-and-writers` step 5: for `candidate`, use the retained legacy source for binding claims.
   - Work-state consequence: `docs/platform/work-state/spec.md#11-business-rules` RUL1 (event log is the only truth; the projection is derived and rebuildable) and RUL10 (premise: one writer, reopen at the named threshold).
2. What kind of work
   - A change to a locked platform law, not a feature. `docs/platform/platform-foundations.md#2-authority`: changing a law requires superseding its decision record; do not edit silently.
   - It also changes a whole-system store boundary, so it touches component ownership (`docs/platform/component-boundary.md#3-update-rule`: ownership of a state write counts).
3. What contract it touches
   - L3 itself, and L1 (log vs state classification) in `docs/platform/platform-foundations.md#l1-hai-vật-lý-của-tri-thức-log-vs-state`.
   - L10 (extend through the one door, never beside it): `docs/platform/platform-foundations.md#l10-add-through-not-alongside-mở-rộng-qua-cửa-không-đắp-cạnh-cửa`.
   - Work-state rules RUL1, RUL2, RUL3, RUL10, RUL11 in `docs/platform/work-state/spec.md#11-business-rules` (single write door, event-first write order, committed log is never rewritten).
   - The write-door/envelope contract: `docs/platform/work-state/contracts/cli-io-contract.md#single-write-door`.
4. How much risk
   - Highest of the three. The law is "immortal until its named threshold is hit". The L3 review threshold is named: it reopens when the single-writer premise breaks, i.e. when multiple agents writing concurrently becomes the main load, with beads as the case study (`docs/platform/platform-foundations.md#l3-luật-store-truth-ở-jsonl-db-là-view`). If that threshold has not been hit, the change is a law change that has not earned the right to be made. Surface this to the owner before work.
   - Also: RUL11 says the committed log is never overwritten by a migration (`docs/platform/work-state/spec.md#11-business-rules`).
5. What proof means done
   - The L3 rules give the testable bars: the DB must be rebuildable from zero by replaying the log, and all writes must go through one door (`docs/platform/platform-foundations.md#l3-luật-store-truth-ở-jsonl-db-là-view`). If truth moves to a DB, a new, explicit contract replaces those. A rebuild-equals-view test is no longer meaningful as proof, so a different proof must be defined.
   - L5 design gate: `docs/platform/platform-foundations.md#4-design-gate`.
6. What learning gets left behind
   - A new decision record that supersedes the L3 decision ID (`docs/platform/platform-foundations.md#2-authority`; the L3 text names D-ID `ae461c8b`).
   - Update the component boundary or record `No component-boundary change` (`docs/platform/component-boundary.md#5-how-to-change`).
   - Update work-state spec RUL1/RUL10 in their current owner once (`docs/platform/migration-authoring-rules.md#1-core-principles`).

Owner I identified: `docs/platform-foundations.md` (binding text, outside my scope, named by the switchboard). `docs/platform/platform-foundations.md` is a candidate entry/summary and says "Canonical: No". The candidate summary table (`#3-law-summary`) is not binding.

## Scenario C: an open design note about how work items age in priority

1. What to read first
   - `docs/platform/governance.md#4-authority-matrix` (what a scratchpad may and must not establish) and `docs/platform/governance.md#7-discussion-scratchpad-workflow`. Caution: this governance file is a candidate copy (`Canonical: No`; the legacy `docs/doc-governance.md` is the current authority per `docs/platform/documentation/switchboard.md#3-root-document-routes`, where it is `legacy-current`).
   - The current facts to avoid contradicting: `docs/platform/work-state/spec.md#3-work-item-data-dictionary` rows 25 (`priority`, ascending, set by a person or agent, never inferred by the picker) and 26 (`intent`). Read-order contract: `docs/platform/work-state/spec.md#7-pull-door-take-and-return` neighbours do not cover it; the ready-order versioned contract is stated in the Read (list/ready) text inside the same spec. No aging mechanism appears in the spec text I saw, which tells me the note is new design, not current behaviour.
2. What kind of work
   - A discussion scratchpad (active shaping, open questions), possibly promoted to a proposal later. `docs/platform/governance.md#3-document-types`: scratchpad is non-canonical shaping memory; proposal is a non-canonical candidate design option.
   - Lifecycle: Open -> Active -> Stabilizing -> Promoting -> Drained -> Delete/Archive (`docs/platform/governance.md#7-discussion-scratchpad-workflow`).
   - Template: `docs/platform/documentation/history/templates/discussion.md#1-current-summary` (sections 1 to 8, including `#7-promotion-targets`). Its original header says "Canonical for: nothing" and "Delete when: all settled content is promoted or explicitly discarded". This template is a historical carrier, "Do not use this for: current authoring rules" (`docs/platform/documentation/history/templates/README.md#template-index-added-in-candidate`), so I treat it as a shape hint only.
3. What contract it touches
   - None, for now: a scratchpad may establish only open questions, alternatives, evidence and provisional reasoning, and must not establish current behaviour, binding rules or settled decisions (`docs/platform/governance.md#4-authority-matrix`).
   - What the note would eventually touch if promoted: the frontier-order contract and data-dictionary rows 25/26 (`docs/platform/work-state/spec.md#3-work-item-data-dictionary`), and RUL42 as cited there (picker stays mechanical).
   - Placement: I could not find in scope a stated directory for scratchpads. `docs/platform/governance.md#2-placement-map` shows `proposals/` and `history/` under an area, and `docs/platform/migration-authoring-rules.md#2-legacy-roots-ratchet-and-exceptions` forbids new maintained files under `docs/specs` and `docs/architect`. So the note must not go there. The work-state area (`docs/platform/work-state/`) is a candidate area, and the switchboard (`docs/platform/documentation/switchboard.md#4-resolution-algorithm-for-readers-and-writers` step 4) says not to author candidate files for a `legacy-current` area. The note's exact home is therefore unresolved from these files; I would put it under `docs/platform/<area>/` as a clearly marked non-canonical scratchpad and ask the owner to confirm.
4. How much risk
   - Low, if it stays non-canonical and claims nothing. The risk is claiming too much: a note phrased as mandatory, or as current behaviour, forks authority (`docs/platform/governance.md#1-principles`: one claim, one owner).
   - Medium on promotion, because the ready-order is a versioned contract (the v2 order in the work-state spec Read section) and aging would change it.
5. What proof means done
   - For the note itself: it is marked non-canonical, lists open questions and promotion targets, and has no claim presented as settled (`docs/platform/governance.md#7-discussion-scratchpad-workflow`).
   - For the lifecycle: it ends Drained and then deleted or archived; archive only if the discussion itself has long-term diagnostic value.
6. What learning gets left behind
   - Promotion targets (`docs/platform/governance.md#7-discussion-scratchpad-workflow`): current truth -> spec, direction -> vision, deferred or simplified intent -> intent preservation ledger, rationale/boundary -> architecture, mandatory precision -> contract, choice and rationale -> decision, proof -> verification.
   - Settled content leaves behind a pointer in the scratchpad, or is removed from it.

Owner I identified: `docs/platform/governance.md` (candidate) for document-type rules, with the legacy `docs/doc-governance.md` as the current authority per the switchboard. For the facts, `docs/specs/work-state.md`, per the switchboard.

## Files opened, in order

1. `docs/platform/README.md`
2. `docs/platform/governance.md`
3. `docs/platform/documentation/switchboard.md`
4. `docs/platform/platform-foundations.md`
5. `docs/platform/work-state/README.md`
6. `docs/platform/work-state/spec.md`
7. `docs/platform/work-state/contracts/cli-io-contract.md`
8. `docs/platform/migration-authoring-rules.md`
9. `docs/platform/documentation/history/templates/README.md`
10. `docs/platform/documentation/history/templates/discussion.md`
11. `docs/platform/component-boundary.md`
12. `docs/platform/vision.md`
13. `docs/platform/contracts/architecture-manifest.json` (first lines only; not relevant)

I also ran `node scripts/list-doc-anchors.mjs` on files 1 to 8, 10, 11 and 12 and used only anchors it printed.

## Files opened before finding the owner

- Scenario A: 2 files opened before the switchboard (README, governance); the switchboard (file 3) named the owner, `docs/specs/work-state.md`. The owner itself is outside my scope and was not opened.
- Scenario B: 3 files opened before `docs/platform/platform-foundations.md` (file 4), which points to the binding `docs/platform-foundations.md`. The owner is the legacy file and was not opened.
- Scenario C: 1 file opened before `docs/platform/governance.md` (file 2) for the rules on what a scratchpad may claim. It is a candidate copy, so the binding source is the legacy `docs/doc-governance.md` (not opened).

Status: DONE_WITH_CONCERNS
Summary: Answered all six questions for A, B and C with citations from printed anchors. The binding owners the files name are all outside my allowed scope, so owner confirmation rests on the switchboard's routing, not on reading them.
Concerns/Blockers: README and several files still point at root paths (`docs/doc-governance.md`, `docs/specs/work-state.md`) that I could not open. The directory for a scratchpad is not stated in the in-scope files. I could not verify where the add `--verify` requirement is stated in the CLI I/O contract.
