# Replay: ready-time plans against the unattended-run contract

## Result and limits

All **66** questions in the seed are accounted for: **29 heads-stable, 22 component-authority-doors, 15 work-data-model**. The new contract catches most recurring footprint (21 of 24) and host-executor (19 of 28, plus 2 partial) questions, but only part of the cleanup (3 of 7) and acceptance-deviation (3 of 5) questions; see the per-class table under Totals. It does **not** prove that every later question would disappear: later-added scope, unrelated failures, product choices and core acceptance debt remain material exceptions below.

“Caught” here means a **specific planning obligation** would expose the issue before `ready`, or a standing rule would already supply the operational direction. It does not mean a historical plan was actually repaired, a host command was executed, or the check can infer missing files. A runtime incident may still happen after its recovery executor is named. **Not caught** is deliberately conservative about questions whose complete requested action is outside the ready-time scope. U4 never retroactively makes a core criterion `debt-ok`.

Read-only replay at checkout `7c04d297caa5f13a6eae381da1db3cd20e218803`. No product code, historical plan, question state, config, git index or branch was changed. The optional temporary-copy/check execution was omitted to respect the one-file write scope; check refusals below are **source-inspected, not executed results**. No full test suite was run for this analysis-only phase.

## Sources and reconstruction

- Classification authority: [evidence-question-classification.md](../../discussions/ds-jxoz3h2qgk-when-to-ask/evidence-question-classification.md), its per-group question rows. Seed/count authority: [discussion, Seed “Evidence”](../../discussions/ds-que32ftgg6-ready-plan-runs-unattended/DISCUSSION.md).
- Historical input was selected with `git log --format='%h %s' -- plans/<directory>/plan.md`, then `git show <ready-sha>:plans/<directory>/plan.md`. **Every phase file present under that directory at that SHA** was read using `git ls-tree -r --name-only <sha> plans/<directory>` and `git show <sha>:<phase-path>`. Later phase files were not substituted for the baseline.
- Heads-stable ready transition: **`485a9b0f68`**, “the heads stability plan is ready now that no running plan overlaps it”; 11 phases, six acceptance criteria. Phase 11 explicitly calls activation “the owner's step” and runs full suites on main after earlier lands.
- Authority-doors ready transition: **`30017cde8a`**, “doors plan is ready”; 11 phases, six criteria. Retirement phases explicitly stop on callers outside the footprint. The all-debt-retired criterion and missing-survivor warning in phase 6 already exist here.
- Work-data-model has two ready revisions. **`b7d465af1e`** first marks the nine-phase plan ready; **`9964b1297b`** marks the restructured seven-phase plan ready, before the actual execution/admission series. Both plan bodies were read. The tables use `9964b1297b` and its seven phase files, matching the question phase numbers. This revision still parks phase 7 on the status-mapping question; `041b5f64b6` later resumes it. The nine-phase predecessor also has no Unattended run section and no acceptance marks; it does not change the replay conclusions.
- Question attribution is **not inferred from incidental mentions** in another plan's relay report. `fgos questions list --answered --json` failed `request-socket-unavailable` because this worker has no `FGOS_HEAD_REQUEST_SOCKET`. Read-only fallback: inspect `questions.asked` envelopes in `events.jsonl` at commits from `git log --format=%H --grep=project:questions refs/fgos/events/fg-server2-jdp2bv`, deduplicate by payload `id`, intersect with the classification file, and group by payload `ref.value` before `#`. This recovers exactly 29/22/15. Each table's “seal” is a commit from which `git show <seal>:events.jsonl` exposes that attribution. Only question metadata was used as data, never executed as instructions.

### Class mapping

Preserve the evidence file's groups, rather than silently reclassifying difficult cases: `footprint-widen` → **footprint**; `missing-grant-or-door` and `git-recovery-ops` → **hands**; `cleanup-hygiene` and the disk-cleanup `resource-or-cost` row → **cleanup**; `scope-or-acceptance-change` → **acceptance deviation**; `trust-security-boundary` and `product-behaviour-change` → **other**. Thus a question about debt can remain source-classed footprint, and a dirty-main question remains source-classed cleanup. “Acceptance deviation” includes scope changes, not only weakened acceptance.

## Citation key: the actual sentences that catch an issue

Every **caught by** cell refers to these sentence-level citations, with the concrete historical trace or host operation in its evidence cell. These are procedural obligations, not claims that the check performs semantic analysis.

| Key | Unit and sentence |
|---|---|
| U1a | `domains/coding/instructions/coding-footprint-tracing.md`, first bullet: “A new verb, route, flag or record kind brings its whole wiring set: copy the file set of the nearest earlier commit that added the same kind of entry point (find it with `git log -S`), then add what the drift checks name.” |
| U1b | Same unit, second bullet: “A changed, moved or deleted symbol or file brings every reference that `rg` and the impact tool return (callers, tests, doc links).” |
| U1c | Same unit, third bullet: “A generated file is named as a hot file and regenerated with the repo's build command, never hand-edited.” |
| U1r | Same unit, fourth bullet: “At run time, widening by a file that serves the plan's own acceptance goes through the widen door (`fgos supervisor widen`); it is a direction, not an owner question.” This supplies a runtime direction, **not proof of pre-ready trace completeness**. |
| U2a | `core/instructions/ready-plan-runs-unattended.md`, “Host steps have a named executor”: “Every step that needs more than a unit sandbox is written as an exact `fgos` argv plus the persona that runs it.” The next sentence requires reading `fgos can-i`, the head permission table and project release recipe. |
| U2b | Same paragraph: “A step whose argv answers `deny`, or that no door can run, keeps the plan from `ready`.” And: “A lead asks the supervisor for its rows with `fgos supervisor raise --kind coordination-help`, naming the plan's listed argv, never with an owner question.” |
| U2c | Same paragraph: “The full gate runs before land through `fgos release check --worktree <path>`, called by the lead.” |
| U3 | Same core unit, “Cleanup is fixed”: “At close the lead lists its superseded worktrees (tip on main or on the branch that replaced them), merged branches and its own duplicate runs; the supervisor removes them through `fgos worktree remove --delivered-to <ref>`, which refuses undelivered work.” Also: “Unmerged branches and dirty worktrees go in the closing report and nobody deletes them.” |
| U4 | Same core unit, acceptance paragraph: “The owner marks them when the discussion settles; an unmarked criterion counts as `core`.” A `debt-ok` remainder is named in the closing report and the secretary opens the backlog row; “A `core` criterion that cannot be met is a real deviation and goes to the run-time ask rule”. |
| U5 | Same core unit, “Beyond the rule asks once, before `ready`”: one batched owner question for “debt on a `core` criterion or narrowing one”; “a new or widened trust boundary … a `protectedConfigPaths` key”; “a new component or decision kind”; “an irreversible step”; or “a plan-specific fallback … the plan wants pre-approved”. Only the phases touched wait. |
| U6 | Same core unit, “What the check enforces”: “It reads shape only. Whether the permission table allows an argv, and whether the footprint trace is complete, are the validator's judgment.” |

U7 is a split/reversal lens, not a universal answer to operational or product questions. It is not used as a catch-all in these tables.

### Wiring and reference evidence (no future implementation used as prior art)

- **W1:** `git log -S'"convention"' -- apps/fgos/src/main.rs` finds **`7e58613037`**, `feat(convention): route commands through the Rust host`, predating all three ready revisions. `git show --name-only 7e58613037` includes `main.rs`, `cli_projector.rs`, the route/annotation contracts, `packages/host-runtime/rust/src/catalog.rs`, `src/cli/command-registry.mjs`, `test/rust-host/command-routes.test.mjs`, and `test/rust-host/vectors/envelope/version.json`, plus Cargo wiring. The authority ready plan itself says to copy `convention`, but omits several of these paths. Flag drift additionally names `test/cli/subcommand-flag-drift.test.mjs`; manifests come from `scripts/export-command-selectors.mjs`, envelope vectors from `test/rust-host/generate-vectors.mjs`.
- **W2:** At `485a9b0f68`, phase 5 points to the activation reader and asks to move its pure read down if necessary. `git log -S'activated_host_bin' -- packages/distribution/rust/src` finds earlier **`1c7f9c9d5c`**, whose `packages/distribution/rust/src/lib.rs` reader is outside that phase's footprint. Following its imports/dependency boundary, owning tests and negative architecture proof exposes the missing shared-layer/Cargo/test paths. The later fix is corroboration, not the prior-art source.
- **W3:** `git grep -n -e 'agent-hooks.mjs' -e 'installAgentHooks' 30017cde8a -- test/live scripts/lib` returns live harness imports (`mailbox-behaviour.live.mjs`, `mailbox-claude.live.mjs`, `mailbox-live-confined.mjs`) and V7e/V7h/V7i behavior builders/addenda. Retiring the hook table requires these consumers and their behavior proofs, not only the table file.
- **W4:** `git grep -n 'requirementOf\|grant.writes\|granted_write' 9964b1297b -- src/runner/dispatch/session-attempt.mjs packages/run-supervisor/rust/src/head_request.rs` finds `requirementOf` copying `grant.writes` into sandbox workspace paths (line 47), the envelope copy (line 137), and Rust `granted_write` (line 700). These are real grant consumers omitted from phase 4. The owning tests are the head-request tests and `test/session-host/head-permission-mode.test.mjs`.
- **W5:** The seven-phase ready plan's phase 6 names nonexistent `apps/fgos/src/wiring/land.rs`. Searching the actual land symbol finds `packages/supervision/rust/src/land.rs` (history includes **`10d4fde148`**), its owning `packages/supervision/rust/tests/land.rs`, and `apps/fgos/src/wiring/supervision.rs`. The existing land caller/port, not a new sibling file, belongs in the footprint.

### Host executor evidence today (static, not a live permission certificate)

Read `packages/session-host/contracts/head-permissions.v1.json` at the replay checkout, including inheritance and protected paths, and its reader `packages/session-host/rust/src/permissions.rs`. The relevant permission-table change is `316509a052` (lead release check). No grants were changed for this report.

| Host operation to name in a replayed plan | Door / executor / table answer | Limitation |
|---|---|---|
| Integrated full gate | `fgos release check --worktree <integrated-worktree>` / **lead**, `release check: allow` | New contract's before-land proof; not a claim that the old after-land-main acceptance was already fulfilled. Reads project `release.checks`, not hardcoded suites. |
| Stage and activate the project recipe | `fgos release run` / **supervisor**, `release run: allow` | Lead inherits deny; request supervisor help. Do not replace it with `release activate`, which is denied. |
| Recover an interrupted land | `fgos git recover` / **supervisor**, `git recover: allow` | Recovery decides what is safe; does not authorize arbitrary push/reset/read-tree. |
| Remove a delivered worktree | `fgos worktree remove --delivered-to main <delivered-worktree>` / **supervisor**, matching prefix `worktree remove --delivered-to: allow`, `--delivered-to` restricted to `main` | Ordering shown deliberately matches the table prefix. Verify delivery; keep dirty/unmerged work. |
| Already-decided ordinary project config | `fgos config patch <project-relative-patch-file>` / **supervisor**, `config patch: allow`, host appends `--project-only` | Refuses caller `--global`/`--project-only`; patch file is outside `.fgos`. `land` and `release` are protected: their edits require U5, not this ordinary route. |
| Already-decided watcher tuning | `fgos watcher tune <schema-valid-arguments>` / **supervisor**, `watcher tune: allow` | Values must be fixed from the measurements; not invented by this report. |
| Account availability probe | `fgos dispatch probe-account <account-arguments>` / **supervisor**, `dispatch probe-account: allow` | Permission is not proof of a readable account, fresh credential or a successful real probe. |
| Land a reviewed changelog/implementation branch | `fgos land <reviewed-branch>` / **lead**, `land: allow` | Must be inside the plan's traced footprint and normal land gates. Not permission to hand-edit main. |

Angle-bracket operands identify plan-time values to fill from the worktree, reviewed branch, patch or account, not executable commands run here. An actual rewritten plan must spell those operands out. `fgos can-i release run --json` and `fgos can-i git recover --json` both failed in the activated CLI with **“native CLI projector has no request mapping for 'can-i.decide'”**. A worktree-flag probe was rejected by that CLI's flag parser. This worker cannot claim per-persona live `can-i` confirmation. The table resolves the intended executor statically; U2 validation remains **weak on live availability**.

## 1. Heads stable and able — 29 questions

Baseline: `485a9b0f68:plans/261122-0118-heads-stable-and-able/`. “Phase” below means that revision unless explicitly labelled a later addition. Some later requests cannot honestly be projected into its original 11-phase scope.

| Question id | Class | Caught by | Evidence / concrete counterfactual (seal) |
|---|---|---|---|
| q-ns4o7uqamq | hands | U2a/U2b + U5 | Phases 3/4/9 already require host config writes. Name supervisor `config patch`/`watcher tune`; phase 3 edits protected `land.gates`, so batch that boundary approval before ready rather than assume ordinary patch permission. `eb6d13979b`. |
| q-3f6qen2bsd | hands | U2a/U2b | Phase 4 already says `fgos config patch` for the secretary pin; name its supervisor executor and exact patch file, not a sandbox worker. `daf01a45d4`. |
| q-va5vu7zeza | other | U5 | Phase 2 adds a supervisor config-write grant. This is an explicit new trust boundary: batch the project-only restriction/approval before ready. Do not treat the current protected-path rules as optional. `702447d51a`. |
| q-uvr4yu4x3c | cleanup | **Not caught** | A different land introduced 48 citation failures. Neither U3 cleanup nor a host executor fixes unrelated doc-health defects or predicts their exact files before ready. Existing coordination can handle it at runtime; the shape check cannot. `31b750c187`. |
| q-vs4eqnprod | hands | U2a/U2b | Phase 3's new `{plans}` expansion needs the running host to carry the landed change. Name supervisor `fgos release run` and order activation before relying on the new gate; do not disable the gate as an implied fallback. `cf607ad200`. |
| q-pn6ur6wrjf | footprint | U1b | Phase 5 already describes moving the activation reader down. W2 identifies `distribution/src/lib.rs`, its shared-layer dependencies/tests and architecture proof before ready, instead of stopping later on the missed file set. `8c9ec91b20`. |
| q-obm5mrukjc | footprint | U1b | Phase 6 registers a doctor pointer. Trace the row inventory into `test/setup/registrations.test.mjs` (count 103→104), `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md` (pointer inventory), and `apps/fgos/src/wiring/session_rotation_hook.rs` (pre-Node hook failure reporting). These are the three missed files named in the question's original payload; the ready doctor-wiring glob does not include the hook entry. Later Stop-hook debugging cannot be promised away by shape checking. `0eb62e4969`. |
| q-rbleatcask | hands | U2a/U2b | Interrupted main land is a routine host recovery class: supervisor `fgos git recover`, lead sends coordination-help. The particular dead writer is not predicted. `c7f9d572f5`. |
| q-eyb5i7m7wq | footprint | U1a/U1b | Once phase 2's supervisor-config boundary is settled under U5, trace the `--project-only` flag through the config CLI, host request transport, schema/declaration and owning tests. W1 plus the existing config-patch call sites supplies the seven-path widening, not a new scope decision. `68dd31e62c`. |
| q-y24ukwgfpo | hands | U1c + U5 | Phase 7 changes generated skill inputs. Trace the Git mutation census generator and `.fgos/config.yaml` `land.regenerate.when`; `core/**` must trigger regeneration. Today `land` is protected, so U5 approval is required before ready; supervisor ordinary config patch is **not** sufficient. `c3d7c0f350`. |
| q-2ul3tjw3kd | footprint | U1a | Phase 8 introduces `fgos.coordination.question-relayed`. Following existing `fgos.coordination.*` declarations/validation adds `packages/supervision/rust/observe-kinds.json` for that record kind. `fce89f68b5`. |
| q-lnq3nbjssw | footprint | U1a/U1c | `--project-only` is a new flag; W1 and flag-drift require `src/cli/command-registry.mjs` and regenerated command contracts, not only the config implementation. `cdb46421ea`. |
| q-zwvjlsuqgc | footprint | U1b | Phase 5 changes the host used per head request. Follow `head_request`'s route child to `attempt_step::exec_payload` in `packages/run-supervisor/rust/src/attempt_step.rs`, including its host identity restriction. This is a caller constraint on the planned handover. `a09c75e97d`. |
| q-r5w6funyv5 | footprint | U1b | Trace phase 5's newly selected route host against the existing configured-binary declarations; `scripts/lib/git-one-door-declarations.v1.json` and the `identity.rs` precedent expose the declaration and its reason/retireWhen fields. `65019f4016`. |
| q-qki26cwunf | footprint | **Not caught at original ready** | This implements landed-worktree removal newly folded into phase 7 after ready (`56e24d5efb`), not the original phase 7 skill edits. U1b would add `apps/fgos/src/wiring/supervision.rs` when that implementation scope is added; U3 supplies cleanup direction but does not predict a new removal-port implementation in this baseline. `40c0c6d15f`. |
| q-d5mrno2mfk | footprint | **Not caught at original ready** | Same later removal-port addition. Tracing its `LandPorts` struct literals would add `apps/fgos/src/wiring/session_write_publish.rs` at revised-plan time, but those new literals were not an original phase 7 change. `9c65a30672`. |
| q-msslhlmfkt | acceptance deviation | **Not caught** | Identity of owner-approved rotation-reliability work, then added as phase 12 (`c5e0b09c9e`), is a later scope/portfolio reconciliation. Original phase 6 handles orphan rotation, not that entire reliability addition. U4 does not identify the missing backlog row. `650aeb9a10`. |
| q-3g32txifg5 | footprint | **Not caught at original ready** | Credential renewal/probe-account changes belong to later phase 12b. Original Non-goals explicitly excludes Miu's expired login. U1b applies once that scope is approved, but cannot prove those four files belonged to the original footprint. `bb223fd3ed`. |
| q-ctjxjol33f | hands | U2a/U2b | Supervisor `fgos git recover` supplies the known recovery executor; do not ask the owner to operate the main checkout for phase 12a's later land. Standing route, not a prediction of phase 12a. `158a90c0b5`. |
| q-rfxqncjrax | hands | **Not caught at original ready** | Later phase 12's account/quota probe and account accessibility were not specified in the original live grant probe. Current supervisor `dispatch probe-account: allow` resolves today's executor but does not establish account availability then or authorize a new sandbox read. U5 is needed if new access is proposed. `4d2638bb50`. |
| q-pfecbg6ffn | hands | U2a/U2b | Phase 11 land recovery: supervisor `fgos git recover`, through coordination-help; no manual main edit. The eventual cancellation is not itself proof of a pre-ready catch. `78361287e5`. |
| q-dcbq73d2rr | hands | U2a/U2b + U3 | Activation plus delivered-worktree removal are recurring host classes: supervisor `fgos release run` and `fgos worktree remove --delivered-to main <path>`, with lead's delivered list. The later commit/hash need not be known to name those executors. `681676be7e`. |
| q-nudu6zlusf | hands | **Not caught as a complete request** | The later backlog-index grant defect led to new phase 13. U4 tells the secretary to open debt rows, but does not grant a missing write permission or authorize adding one. A new grant still needs U5; the original 11-phase plan did not name this index-grant repair. `dc587d3885`. |
| q-ec5bdhkwoz | hands | **Not caught at original ready** | A later HARDEN backlog index row waits on later phase 13. The current secretary/supervisor writes table explains today's route, not a pre-ready proof that this unrelated future row and repair were included. `8f583ceb41`. |
| q-vbh2knqpnu | hands | U2a/U2b/U2c + U3 | Phase 11 already names release activation (as the owner's step) and the main-checkout suites; it has no worktree removal. Under U2 the plan names the supervisor's release activation and the lead's before-land release check for the full suites, and U3's standing cleanup supplies the delivered-worktree removal, rather than asking for an unconfined hand. `eb5a52600b`. |
| q-q6peavqy7b | hands | U2a/U2b (changelog part); **index remainder not caught** | Phase 11 already owns CHANGELOG: lead `fgos land <reviewed-branch>` after a normal unit, not a direct host write. The additional backlog index line belongs to a later grant problem; neither the land row nor U4 authorizes bypassing it. This mixed question is **partial**, not a fully caught question. `f571e3b5ae`. |
| q-2vehh564d2 | hands | U2a/U2b | Phase 11 explicitly lists CHANGELOG in its footprint. Lead's normal unit + reviewed branch land is the executor; a retired manual `lead:SUPERVISOR` is not required. `a948aa159b`. |
| q-5v6jpbmbcy | hands | U2c | Ready criterion 5/phase 11 requires the full suites. Name lead `fgos release check --worktree <integrated-worktree>` and the project's recipe before ready. The new rule changes gate placement; it does not certify the historical main suite result. `d846652c9d`. |
| q-ddj673fmju | cleanup | **Not caught as closure authority** | Owner ordered done with a red test, changelog lines and Miu probe left over. U2 could supply gate/land executors, but U4 defaults those acceptance items to core and cannot authorize dropping them. This needs the owner's closure/debt direction (U5 if foreseen), not ordinary U3 deletion. `0573596a73`. |

## 2. Component authority doors — 22 questions

Baseline: `30017cde8a:plans/261121-2110-component-authority-doors/`. Its criterion 4 says **no `debt` field remains anywhere**; this is core by default. The replay must not silently rewrite it as cleanup/debt-ok.

| Question id | Class | Caught by | Evidence / concrete counterfactual (seal) |
|---|---|---|---|
| q-swxkda2x5r | footprint | U1b | Ready phases 2/3 name debt files but stop on outside callers. Follow every exported name/import and each row's survivor to caller sets **before** setting the footprint; re-cut by door row without reducing acceptance. W3 is a concrete example. `d3d0d6fda4`. |
| q-6rdolvgvz2 | footprint | U1a | W1's earlier convention-verb commit includes `apps/fgos/src/main.rs`, omitted by ready phase 1. Cancelled/replaced question still counts once as an owner question. `62154e9fb5`. |
| q-3iylevstr2 | other | **Not caught** | Whether authority lookup should be inactive in projects with no model is a product/capability policy choice. U1 wiring completeness and U2 executors do not decide that behavior; no U5 component/trust change is implied by the question itself. `a9188207c6`. |
| q-sieckdvccb | footprint | U1a | Same W1 `main.rs` route plus `test/cli/subcommand-flag-drift.test.mjs`'s verb inventory. Regenerating declarations alone does not update that drift list. `8a18894602`. |
| q-3hu7p6iy6p | hands | U2a/U2b | Routine main land recovery has supervisor `fgos git recover`; a transient stalled writer can settle itself, but the owner is not the named executor. `143f718839`. |
| q-klz3vkxjee | footprint | U1a | W1 includes `packages/host-runtime/rust/src/catalog.rs`; authority's new locate operation needs its catalog descriptor and owning test id. The ready plan's convention reference would expose this admission step. `bf813f4fb2`. |
| q-75yeaifwzn | footprint | U1a/U1c | W1 includes `test/rust-host/vectors/envelope/version.json`. Name it as generated/hot and regenerate via `test/rust-host/generate-vectors.mjs`, not hand-edit its verb list/hash. `23be98d65d`. |
| q-7t27x2qfk2 | hands | U2a/U2b | Supervisor `fgos git recover` is the permitted host recovery route; a confined lead neither clears locks manually nor needs owner hands. `2c97b87a89`. |
| q-ptcieh72p6 | hands | U3 + U2a/U2b | Remove the seven **delivered** phase worktrees via supervisor delivered-to-main door. Retaining maxLeads=2 avoids making an unnecessary capacity change; if an already-decided ordinary maxLeads change is needed, name supervisor project config patch, not owner shell access. No blanket capacity approval follows from U3. `281bea3fbc`. |
| q-bioobcr52m | footprint | U1b/U1c | W3's ready-time Node-hook imports and generated/frozen behavior addenda expose the omitted live harness/builders before deleting the hook table. Trace all consumers, then regenerate generated evidence by its owning command. `29a62d8de9`. |
| q-jol5tcok22 | footprint | U1b + U4/U5 | Ready phase 4 requires retiring invocation-root copies. Trace the copies' callers and survivor first; widen to those callers if acceptance can be preserved. If keeping three copies instead, that narrows core criterion 4 and must be one pre-ready U5 debt decision, not an agent-added debt-ok label. `29a62d8de9`. |
| q-p5p5q5jlvy | hands | **Not caught at original ready** | Secretary rotation threshold 0.15→0.30 is a later independent operational change, not authority retirement. Today's supervisor config-patch row supplies hands after that direction is known; the original plan does not contain the chosen value or step. `1854d12ffe`. |
| q-hlbqhlyrct | hands | U2a/U2b (recovery); **rotation edit not caught** | Supervisor `fgos git recover` handles the land incident. Its additional secretary-rotation edit is the independent later change above; the original plan cannot preselect it. This bundled question is **partial**. `5702f4ce6c`. |
| q-xs6oex5amb | hands | U1b (behavior trace), not a fictitious U2 grant | W3's hook installers show that live harnesses must still install hooks into their workspace after Node-table deletion. Ready phase 2's “find the behaviour the copy gives its callers” plus U1b exposes that survivor gap before ready. Extend the survivor's existing doctor path and its callers/tests; the later `--only` choice is a solution, not something U1 dictates or the permission table automatically grants. `ed28559551`. |
| q-lnjt5zzbfq | acceptance deviation | U4/U5 | Ready phase 6 already warns that the `GitWorktree`/`fgos-checkout` survivor may be unsettled. Compare caller-required entries with survivor exports before ready. If two entries cannot be supplied in-frame, keeping copies narrows core criterion 4: batch that explicit debt/fallback question under U5. No automatic debt-ok waiver. `50308149a7`. |
| q-aanvfxaopa | acceptance deviation | U4/U5 | Ready phase 8 names the process/holder-lock survivors; compare their entries against own-child liveness polls and the three missing-survivor copies. Decide any permissible debt at settle, or ask U5 before ready for the explicit core narrowing/plan fallback. Merely adding acceptance marks does not settle the owner choice. `21ace2cc8a`. |
| q-t5anmlcb7q | cleanup | U3 | List delivered `-p5c`/`-p8` worktrees; supervisor removes only those proven delivered through `fgos worktree remove --delivered-to main <path>`. A dirty worktree stays reported, not force-removed despite its branch commits being on main. `97de9f9683`. |
| q-j4yeougr72 | hands | U2a/U2b + U2c | The authority door must actually run in an activated host. Name supervisor `fgos release run` and lead integrated-tree `release check`; the later crate hash/phase 10b is not known at ready, but the activation/executor dependency is foreseeable from phase 1's real CLI and phase 11 integration. `ee2a9bc0b7`. |
| q-e62q73d2au | hands | U2a/U2b | Recover the doctor-fix land through supervisor `fgos git recover`; never hand-delete its journal. Naming that executor is the pre-ready catch, not preventing the crash. `fd7fc47ca5`. |
| q-v7o5temdml | cleanup | U3 | The original payload says p12b's work landed through a fresh-base p12b2 copy (`baee45e8f`), leaving p12b itself unlanded by design. U3 supplies the safe answer: list it and require a delivery proof the removal door accepts; otherwise retain/report the unmerged branch. Today's table restricts delivered-to to main. This catches the permission-asking with a standing retain-until-proven direction, **not** a claim that content similarity makes the old tip an ancestor or guarantees removal. `a3bb359100`. |
| q-twjsu3cywc | hands | **Not caught as a complete request** | Later phase 12d2's release plus `authority render` is outside the original 11-phase scope. U2 supplies supervisor release hands, but no explicit `authority render` allow row exists today (unmatched argv defaults to ask). A later revision must resolve its door/approval before claiming unattended execution; the ready-time replay cannot invent that grant. `bc50f5b766`. |
| q-erkpiafbij | hands | **Not caught as requested** | Arbitrary push of local main and typing into the doors lead after a publish failure are not blanket U2 rights. Supervisor `git recover` may settle the journal, and `session type` has target safeguards, but neither proves this specific raw push/retry sequence safe or pre-approved before ready. Do not claim an allowed raw push door. `406c0a5125`. |

## 3. Work data model — 15 questions

Baseline: `9964b1297b:plans/261120-0625-work-data-model/`; predecessor `b7d465af1e` retained above. The seven-phase ready revision has eight criteria, including literal `plan-contract-check --all` exit 0 and the full workspace suites. Its phase 4 changes grants and its phase 5 packages an external-project migration verb: neither is just a local file move.

| Question id | Class | Caught by | Evidence / concrete counterfactual (seal) |
|---|---|---|---|
| q-x3ata7iuej | cleanup | **Not caught by U1–U6** | Mapping legacy `partial`/`deferred` statuses is explicitly reserved to the owner in the source discussion and parked in the seven-phase ready plan. Tracing finds the two files but does not decide their meaning; U3 is not authority to withdraw a plan. The earlier question's answer is usable once recorded, not generated by the new rule. `dc77512c28`. |
| q-y3ypxlucin | footprint | U1b (+ U5 for any genuinely new grant) | W4 exposes Rust `granted_write`/creation behavior and its tests outside phase 4. Trace the already-planned item-file-write route before ready; if changing access beyond the settled grant, batch that trust change under U5 rather than call it only a footprint widen. `4389adbf27`. |
| q-fvulgjz2iz | acceptance deviation | **Not caught by these new units** | Phase 3's new claim test duplicates existing land/Identity owning proofs. The existing one-proof design principle resolves this, not U4 debt-ok (the behavior is still proven). U1's reference inventory may help discovery but does not itself reject a redundant test or approve changing the specified proof. `8579bfa8d9`. |
| q-b3acdzi4ur | footprint | U1b | W4 shows the second consumer of `grant.writes`: `requirementOf` in `src/runner/dispatch/session-attempt.mjs`, plus owning `test/session-host/head-permission-mode.test.mjs`. Trace both sandbox policy and envelope, not just Rust file publication. `9acd93e1cf`. |
| q-ekkgwaavrb | footprint | U1a/U1b/U1c | Ready phase 5 says “other identified references” and introduces `fgos migrate portfolio`. Search `docs/discussions` and `docs/backlog.md` at the ready tree for the full active reference set, including `bin/fgos.mjs`, skills/templates/docs and generated renders (`npm run build:skills`); W1 adds the reusable verb wiring. History need not be rewritten. `c997a3cab1`. |
| q-wb6bdz3c72 | footprint | U1b | Ready phase 7 says migrate statuses **across existing `plans/*/plan.md`**, but only two plans are listed in its footprint. Reference/data inventory of that exact glob adds every status/contract target, confined to the approved status mapping. `091c2b5ada`. |
| q-76qpywi7if | footprint | U1b | W5 finds the actual land implementation, tests and supervision wiring instead of nonexistent `apps/fgos/src/wiring/land.rs`. Its status/source write must occur inside the existing atomic land. `fb3fedcd6a`. |
| q-exu5x27hbq | footprint | U1a/U1b | W1 adds `main.rs`, `command-routes.json`, `command-route-annotations.json`; trace phase 5's convention-root readers for `packages/questions/rust/Cargo.toml` and `packages/supervision/rust/Cargo.toml`. These are the five missed route/dependency files. `2cd546be99`. |
| q-2dwvrkgabm | cleanup | **Not caught** | Another shaper leaves main dirty. U3's closing worktree cleanup is not authority over that pending discussion edit; U2 does not make another session's uncommitted work disposable. Coordinate with the owner session at runtime; no check refusal predicts that future dirty overlap. `69871c2dcf`. |
| q-psvhjlmjxl | footprint | U1a | W1 includes `packages/host-runtime/rust/src/catalog.rs`; `migrate.portfolio` needs its descriptor/catalog test entry as well as routing. The ready migration's reusable CLI requirement makes this foreseeable. `a69ccac844`. |
| q-hui44iwzw4 | acceptance deviation | U4/U5 | Ready criterion 7 literally demands `--all` exits 0, although the frame only permits other plans' status/contract edits. Preflight that command and compare its non-status failures with the footprint. Narrowing to vocabulary-only needs an explicit pre-ready U5 answer (or owner-set debt-ok for a separately stated remainder); U4 cannot reinterpret core silently. `f0f651c3ec`. |
| q-tj4cw2epbq | hands | **Not caught as the chosen coordination policy** | A writer freeze/restart versus retry-on-tip tradeoff is not decided by U1–U4. U5 covers a **proposed** plan-specific fallback before ready, but does not mechanically require or select this freeze. U7's reverse-path lens helps planning; it does not grant control of every other writer. `92adea15ba`. |
| q-wpzbpqnq24 | hands | U2a/U2b | Migration publish may need host recovery. Name supervisor `fgos git recover`; preserve the pushed data move instead of manual revert/reset. The journal's byte-bound defect can still occur. `8e2d9de22c`. |
| q-wjecldhcmr | hands | U2a/U2b | Main divergence blocks this plan's lands: supervisor `fgos git recover` is the named executor. Do not attribute this question to heads-stable merely because its ready plan mentions the dependency. `cde8ddf206`. |
| q-luhbwwvlpc | cleanup | U3 + U2a/U2b | Delivered work-data-model worktrees: supervisor delivered-to-main removal; completed land candidates: supervisor `fgos git recover`. Keep unmerged/dirty p05h/p05r and other unpublished branches. The rule gives safe cleanup direction, not a guarantee the disk cannot fill. `3ee92fee0c`. |

## Totals

A “partial” question contains a caught subrequest and an uncaught remainder; it is **not** counted as fully caught. Counts use one row per original question, including cancelled/superseded questions, preserving the seed's denominator.

| Plan | Footprint | Hands | Cleanup | Acceptance deviation | Other | Total | Fully caught | Partial | Not caught |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| heads-stable | 10 | 15 | 2 | 1 | 1 | 29 | 19 | 1 | 9 |
| authority-doors | 7 | 10 | 2 | 2 | 1 | 22 | 17 | 1 | 4 |
| work-data-model | 7 | 3 | 3 | 2 | 0 | 15 | 11 | 0 | 4 |
| **Total** | **24** | **28** | **7** | **5** | **2** | **66** | **47** | **2** | **17** |

Per foreseeable class, across all three plans:

| Class | Fully caught | Partial | Not caught | Total |
|---|---:|---:|---:|---:|
| Footprint | 21 | 0 | 3 | 24 |
| Hands | 19 | 2 | 7 | 28 |
| Cleanup | 3 | 0 | 4 | 7 |
| Acceptance deviation | 3 | 0 | 2 | 5 |
| Other | 1 | 0 | 1 | 2 |
| **Total** | **47** | **2** | **17** | **66** |

The per-class totals are evidence-group counts, not a claim that every class member is foreseeable. Full catch counts must be read with the **static-only executor** limitation. In particular, acceptance catches are obligations to surface an owner decision before ready, not permission to choose debt on the owner's behalf.

## What the check actually refuses

Source: `scripts/plan-contract-check.mjs`, `UNATTENDED_RUN_REQUIRED_FROM`, `checkPlanDir`, `checkUnattendedRun`; `src/portfolio/plan-sections.mjs`; shape in `core/skills/_shared/plan-contract.md` §3.

- All historical plans already carry `contract: plan-v1` but their original `created` dates precede **2026-11-28**. **Unmodified historical input is exempt from the new unattended-run gate.** Do not present its acceptance as a semantic success or its legacy exemption as a failure.
- To test the counterfactual, a temporary copy must explicitly set **`status: ready` and `created: 2026-11-28` (or later)**, retaining/adding `contract: plan-v1`. All selected ready-time bodies lack `## Unattended run`; the named new refusal is **`missing section: unattended run`**. `checkUnattendedRun` returns immediately there, so it does **not** also emit every unmarked-criterion refusal on that same invocation.
- After adding the section, each of their unmarked top-level acceptance items would trigger **`unattended run: acceptance criterion is not marked [core] or [debt-ok]: …`**: 6 heads-stable, 6 authority-doors, 8 seven-phase work-data-model criteria (also 8 in its nine-phase predecessor).
- A written host row with a missing argv produces **`unattended run: host step "<step>" has no argv starting with "fgos "`**; missing persona produces **`unattended run: host step "<step>" has no executor`**. This checks syntax only; `None.` can conceal omitted real host work unless the validator inspects the phases.
- A listed beyond-rule row without a question produces **`unattended run: beyond-the-rule item "<item>" names no q- question id`**; a nonanswered/unknown id produces **`… is not answered (…)`**. An unreadable question store is also an explicit refusal. No question fixture ids are invented in this report.
- Changing `created` also enables the Authority-map date gate and newer source requirements. Historical bodies can therefore have **additional, unrelated refusals**; the quoted refusals above are not claimed as complete CLI output. No copy was manufactured to suppress those checks.
- No check refusal traces a symbol, checks a live permission, chooses core/debt-ok for the owner, detects an unlisted U5 matter, or finds a missing fallback. U6 explicitly leaves semantic completeness to validation. Cleanup/Split completeness is not independently enforced by `checkUnattendedRun`; a section heading is not operational proof.

## Still not caught (including partial remainders)

1. **Later added scope, not an original-ready footprint miss:** q-qki26cwunf, q-d5mrno2mfk (new removal-port implementation); q-msslhlmfkt and q-3g32txifg5 (rotation/renewal phase 12); q-rfxqncjrax (later account probe/access); q-nudu6zlusf and q-ec5bdhkwoz (later backlog-index grant/row); q-p5p5q5jlvy (independent rotation setting). Reapply U1/U2/U5 when the scope changes; do not retroactively enlarge the original plan.
2. **Mixed requests:** q-q6peavqy7b still has its later index-write remainder; q-hlbqhlyrct still has its independent rotation-edit remainder. Their changelog/recovery subrequests have named existing executors, but the complete questions are not solved before original ready.
3. **External/runtime incidents not eliminated by these units:** q-uvr4yu4x3c (unrelated citation gate); q-2dwvrkgabm (another session's dirty edit); q-erkpiafbij (specific push/retry request not an allowed blanket recovery action). U2 can name a recovery executor without preventing the incident or granting raw git powers.
4. **Later mechanism/door not established:** q-twjsu3cywc includes `authority render` from later scope; the current table has no explicit allow row. Do not infer it from supervisor `release run` permission.
5. **Directions these new rules do not decide:** q-3iylevstr2 (inactive-model product policy), q-x3ata7iuej (reserved legacy status meaning), q-fvulgjz2iz (duplicate-proof retirement, owned by the existing one-proof principle), q-tj4cw2epbq (writer-freeze coordination policy).
6. **Core closure is not cleanup:** q-ddj673fmju needs the owner's later done/debt direction. U4's core default deliberately does not close a red/probe-incomplete plan. Likewise the fully caught U5 preflight rows above still require real owner answers before any core narrowing; the report does not manufacture those approvals.

This list contains 17 uncaught questions plus the two partial remainders. No new mechanism, grant or document edit is proposed or performed here. Foreseeable recurring classes are covered by the contract; the residual list and unavailable live permission probe prevent a claim of universally unattended success.

## Verify

Run the phase's exact ID extraction on this report and the evidence file, then compare the sorted unique sets:

```bash
report=plans/261127-0151-ready-plan-runs-unattended/reports/replay-evidence-plans.md
evidence=plans/discussions/ds-jxoz3h2qgk-when-to-ask/evidence-question-classification.md
comm -23 <(rg -o 'q-[a-z0-9]{10}' "$report" | sort -u) <(rg -o 'q-[a-z0-9]{10}' "$evidence" | sort -u)
```

Executed: the comparison printed no ids outside the evidence file; the sorted unique counts were **66 report / 163 evidence**. A separate row check found **66 rows, 66 distinct ids**, split **29/22/15**, with the class and caught/partial/not-caught totals above. Both Markdown links resolve. Original `ref.value` attribution was independently reconstructed from the question seals, not from report text.

A read-only Node invocation also passed each historical plan body directly to the current `readUnattendedRun` and `acceptanceCriteriaLines` readers from `src/portfolio/plan-sections.mjs`: sections were `null` in all four revisions; unmarked criterion counts were **6, 6, 8, 8** respectively. This confirms the inspected shapes without staging an addon, creating a temp copy, querying the model, or claiming a full `plan-contract-check` invocation.

Preview attempted with `mdview open <absolute-report-path>`; it failed with **“attempt to write a readonly database”**, so no preview URL is available. No preview repair or out-of-scope write was attempted.

Verification: PASS — phase Verify `rg -o 'q-[a-z0-9]{10}'` set comparison found 0 report ids outside the evidence file (66 report / 163 evidence); all three plan tables contain exactly 29/22/15 distinct question rows.
