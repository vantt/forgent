# HARDEN T2 — correctness and failure

`git rev-parse --short HEAD`: **`3bc2c1059` at entry; `a7d508e8a` at the final source check.** 2026-10-23, Asia/Saigon. Seat: correctness and failure, axes A/B.

**Outcome:** one reproduced failure-policy defect and nine inferred findings warrant arbitration. No repository files were changed. This is not an exhaustive line-by-line clearance or a T2 close recommendation.

Main advanced during this review. The original findings concern unchanged source; CF07–CF09 additionally review `sequence.rs`, introduced by `744f01743` while the review ran. The Git spec now explicitly approves its CAS-only/no-WAL protocol; the findings below do not reopen that decision.

## Part A — target shape per component

### Git

**Authority:** one Rust implementation owns repository facts, typed Git effects, and their recovery; consumers own approval, verification and business settlement.

**Ports and errors:** retain Inspect, Refs, Worktree, ScopedCommit, Sync, Land, SafeRestore, RepositoryConfig, Remote, Recovery and Publication, plus the newly landed sequence-counter operations. Keep full OIDs, exact-old writes, opaque custody loans, resource admission, one-shot TargetAttempt and observed-effect attribution. Preserve `recovery-required`, `containment-unproven`, `git-fence-missing`, explicit absence and unknown remote outcomes. No public raw-argv API or second recovery engine. Sequence transport failures must remain errors, not lost leases or permission to allocate locally.

**Rust/Node boundary:** retain the combined addon and thin `src/git` facade. I counted **250 lines in 13 facade files**, not the phase file's historical 301. Move the Land retry classification/wait policy from `src/git/land.mjs` into an asynchronous native binding; do not substitute a synchronous wait that blocks the Node thread needed to release the competing session. Keep the cold host grant-check. The one-door scanner/spy remains the owner of product-spawn enforcement.

**Delete/budget:** after WORK removes its last checkpoint caller, delete Checkpoint's bindings and implementation together. Do not prematurely remove legacy event grants or the activation tombstone. Proposed Node ceiling: **250 lines now, 225 after the Land wait migration**, with no deciding JS copy. Rust and tests should be net non-increasing across the layer; do not invent deletion savings before proof ownership is established.

**Doctor shape:** fold today's ten checks to six owning rows: `git-component-compatible`, `git-trust-topology`, `git-operation-journal`, `git-native-locks`, `git-worktree-recovery`, `git-mutation-one-door`. Preserve every condition in the doctor table, including retained-Land warnings and transport/refspec diagnoses. Keep the four registered fixes, not a new repair mechanism.

### Terminal-control

**Authority:** one Rust core owns key-to-pane placement/lifecycle; the herdr adapter owns multiplexer I/O. It does not own agent protocol, result interpretation, account selection or run deadlines.

**Ports and errors:** keep allocate/attach/launch/send/read/inspect/release/label, capabilities and reconciliation. Preserve `unsupported`, `unknown`, `gone`, `foreground-not-agent` and `kept-unknown`. Retain the landed shell-ready handshake, one-shot launch and send guard. Closing requires live ownership and incarnation evidence, not PID equality or a successful earlier probe.

**Rust/Node boundary:** use the existing combined in-process door for hot/waiting Node calls; cold doctor may keep a host route. Keep per-group scheduling as thin transport, but move terminal policy validation/default authority into Rust. Node must not directly inspect panes or turn an unavailable port into dead-server authority. Server startup itself is a process/transport concern, not pane placement.

**Delete/budget:** remove the unused group-hint writer/reader/schema/test, the raw doctor anchor-pane call, and replaced route-spawn machinery when callers migrate. Proposed ceilings: **150 lines for the client, 80 for the terminal-specific config adapter**, versus today's 240 + 143. These are proposed budgets, not measured implementation savings. Keep all three terminal doctor rows initially; make their reads genuinely observation-only.

**Layer size target:** Node −170 to −220 lines; Rust ≤ +100 net for repairs/marshaling; tests ≤ 0 net after named consolidations. Require total ≤ 0, or name the deletion paying for each increase. No new capability, background sweeper, lock kind or containment domain is proposed.

## Part B — findings

The inherited T1 report format caps inferred findings at Medium; I use that stricter ceiling. “Reproduced” below means the stated production control flow was executed, not that a real user's server was disrupted.

### CF01 — An unavailable terminal route authorizes unlinking a possibly live server socket

**A/B · High · Reproduced control flow; live-service impact inferred.** `src/runner/dispatch/worker-session-boot.mjs:34-40,80-90`.

`serverAnswers` maps every exception to false. With an existing socket, false causes unlink and a replacement-server spawn. A missing host, route timeout, temporary load or unreadable incarnation therefore becomes destructive stale-socket authority. Existing workers can remain on the old, now-unaddressable server while a new server occupies its pathname.

**Reproduction run:** called the real `ensureWorkerSession` with its existing injection seam: socket present; capabilities throws `route timed out; server fate unknown`; unlink records the action and marks the injected socket absent; spawn records the action then throws before starting anything. Output was `unlink /unmodified-example-home/.config/herdr/sessions/fgos-worker/herdr.sock`, followed by `spawn herdr --session fgos-worker server`. No real file or server was touched.

**Fix shape:** replace the boolean with alive/dead/unknown evidence. Only a positively established stale endpoint may be removed; unknown must preserve it and fail by name. Keep the existing stale-socket repair, not a second startup path. Prior art: `ec9d41c23`; the owning test currently covers dead/alive, not unknown.

### CF02 — Read-only doctor can close retained panes, then say nothing was closed

**A/B · Medium · Inferred.** `src/setup/terminal-control-checks.mjs:118,127`; `packages/terminal-control/rust/src/core.rs:752,812-819`.

Doctor calls `reconcileScan`. For expired retention, that core method calls `close_unrecorded`. The Node row nevertheless reports “nothing was closed.” The existing `core_failures.rs::retain_closes_only_past_until_on_the_same_incarnation` explicitly expects that scan to close the pane. This is a call-contract mismatch, not a request to remove retention expiry.

**Reproduce next:** extend the doctor wiring proof with an expired retained slot and assert zero close calls. I did not invoke doctor against real panes.

**Fix shape:** make doctor select observation-only behavior on the existing scan, while explicit mutating reconciliation retains expiry cleanup. Update its contract/callers together; add no background sweeper.

### CF03 — Destructive foreground ownership compares PIDs, not process identities

**A/B · Medium · Inferred.** `packages/terminal-control/rust/src/core.rs:772-776`.

`foreground_is_owned` accepts any foreground entry whose PID equals the shell PID or recorded launched PID. It does not compare the launched start time/boot identity, although the marker stores them. A retained pane can outlive the launched process long enough for its PID to be reused by a stranger in that pane. Immediate close and expiry share this guard. An empty foreground list also passes the universal predicate without positive shell/owner evidence.

**Reproduce next:** extend the existing immediate-close and retained-foreign-foreground tests with a launched marker containing the foreground PID but a mismatched creation time; expect `kept-unknown` and no close.

**Fix shape:** use the existing Process identity door and recorded tuple. Unknown/mismatch preserves the pane. This replaces the PID predicate; it introduces no new identity mechanism.

### CF04 — Terminal persistence silently converts failed durability into success

**A/B · Medium · Inferred failure impact.** `packages/terminal-control/rust/src/store.rs:144-166`.

`install_result` discards any durable-file error once `error.installed` is present, including a failed parent-directory fsync. It returns Created, allowing allocation or one-shot launch to proceed without proving the marker durable. After power loss, lost allocation/launch-requested evidence can defeat recovery or one-shot launch. The inline test `errors_before_install_propagate_and_errors_after_install_keep_the_outcome` currently codifies the suppression.

**Reproduce next:** use that existing fault seam at `parent-fsync`; assert that visible installation does not produce plain durable success. A power-cut consequence remains untested here.

**Fix shape:** preserve installed-effect information separately from persistence failure. Refuse/return unknown and retain evidence when durability is unproven; do not erase the visible-effect fact. Prior art: `90934bd96` deliberately preserved the old mapping, so this needs an explicit behavior correction, not a cosmetic refactor.

### CF05 — Config recovery acknowledges an observed rename without completing its durability

**A/B · Medium · Inferred.** `packages/git/rust/src/repository_config.rs:247-258,269-273,493-497,525-547`; receipt claim at `:66`.

After config rename, a failed parent fsync enters the error handler. Matching installed values suffice to append `Transfer { acknowledged: true }`. Interrupted-operation recovery uses the same value-only observation. Same-id replay then returns a receipt claiming “config file and parent synced,” without retrying that sync. A visible config effect and durable config effect are different facts.

**Reproduce next:** extend `dead_config_writer_recovers_wal_before_and_after_effect_without_replay` with failure immediately after `config-replaced`, before parent sync, and verify that replay/recovery performs the missing durability step before acknowledgement. Inject actual fsync failure for the EIO case.

**Fix shape:** complete file/parent durability through existing primitives before the successful terminal outcome; if it still fails, preserve pending effect-aware evidence. Do not replay the config edit or add another journal.

### CF06 — Repeated failed WAL writes turn recognized temporaries into repository-wide blockage

**B · Medium · Inferred.** `packages/git/rust/src/wal.rs:1435,1442-1453,2332-2341`; mutation admission at `packages/git/rust/src/refs.rs:133-135`.

Durable-file preserves failed-write temporaries; the WAL adapter drops their structured error context. `inspect` and pre-intent scanning count directory entries before skipping recognized `.durable-file-*.tmp` names. More than 32 accumulated interrupted/ENOSPC attempts therefore make an otherwise valid chain or empty pre-intent directory “corrupt.” Global admission subsequently refuses unrelated writes even after disk space returns. The outer scan's temporary handling does not repair these inner readers.

**Reproduce next:** extend `scan_ignores_compaction_temporaries_before_counting_the_bound` with more than 32 recognized temporaries inside an operation, both before Intent and beside a valid chain.

**Fix shape:** apply the existing temporary classification consistently before the installed-record bound. Keep unknown evidence protected; do not introduce a recursive cleanup or delete another live writer's staging file.

### CF07 — Sequence-home lookup mistakes any read failure for “no origin”

**A/B · Medium · Inferred; newly landed source.** `packages/git/rust/src/sequence.rs:68-75`.

Every `remote_url` error selects `SequenceHome::Local`, not just an absent origin. Timeout, invalid URL output or a transient read failure can make one clone allocate locally while other clones use the shared remote counter, defeating uniqueness. Later local operations may succeed, so their failure is not a reliable backstop.

**Reproduce next:** extend `tests/sequence.rs` with an existing origin whose URL contains non-UTF-8 bytes on Unix (the config reader preserves value bytes, but `remote_url` requires UTF-8); assert refusal and no local sequence ref. Also cover a URL-read timeout. A multi-line URL is not this witness: the current `line` helper does not reject embedded newlines.

**Fix shape:** distinguish explicit remote absence from an error; propagate the latter. Change all `sequence_home` callers together. Preserve the approved local mode for repositories genuinely lacking origin.

### CF08 — Any rejected sequence push is reported as a lost lease

**B · Medium · Inferred; newly landed source.** `packages/git/rust/src/sequence.rs:180-186`.

A porcelain `!` row also represents server hook rejection and remote policy/protection failures. It does not prove stale expected state. The code returns `Stale` for every such row, causing Identity to retry and eventually report contention instead of the actual refusal. The updated Git spec explicitly says non-lease rejection is an error.

**Reproduce next:** extend the remote-counter test with a bare remote's rejecting pre-receive hook; expect the original push error, not `Stale` or `sequence-contended`.

**Fix shape:** recognize the actual stale-lease verdict; preserve every other rejection and stderr as an error. Replace the broad `!` predicate, not the CAS-only protocol.

### CF09 — Local sequence success has no explicit object/ref durability boundary

**A/B · Medium · Inferred; newly landed source.** `packages/git/rust/src/sequence.rs:135-147,192-205,297-327`.

The local counter path creates a commit and updates the ref, then returns `Claimed` immediately. Neither command requests Git fsync, nor does this path call the existing loose-object/ref-directory sync primitives. With ordinary Git defaults, a power cut after a successful allocation can roll the counter back or leave its commit unavailable; a later claim can reuse an already issued number.

**Reproduce next:** extend the existing E1 order-trace/power-cut approach to the local-counter case in `tests/sequence.rs`; check object persistence before ref publication and ref-directory persistence before Claimed. No device test was run here.

**Fix shape:** reuse existing object and ref durability functions and explicit Git fsync settings. Keep the owner's no-WAL decision; no second receipt store is needed.

### CF10 — Herdr's private fd seal leaves descriptors above 1023 inheritable

**A/B · Medium · Inferred.** `packages/terminal-control/rust/src/driver/herdr.rs:241-247`.

The runner sets CLOEXEC only for `3..1024`. An inheritable lock description or other descriptor at 1024+ can reach herdr and its descendants. Under high descriptor load, that can retain authority after the original holder dies. The existing `commands_do_not_inherit_the_callers_descriptors` test allocates at 200, so it does not exercise this boundary.

**Reproduce next:** extend that same test to allocate an inheritable descriptor with `F_DUPFD` at 2048 and verify it is absent in the child.

**Fix shape:** delete the bounded fcntl loop and use Process's existing explicit-fd spawn door. Its guarantees already cover the whole fd table. Separately, this runner's unbounded `read_to_end` and blocking wait after kill (`herdr.rs:219-265`) deserve the same bounded-runner review; I do not claim an OOM/hang reproduction.

## Migration table

| Node part | Decision now | Move? / reason | Order | Node budget afterward |
|---|---|---|---|---|
| `src/git/*` factories and handover | Typed marshaling/hot-section checks | Keep thin; no raw Git fallback | After safety fixes | ≤250 lines overall |
| `src/git/land.mjs::within` | Retry classification and wait budget | Move policy to async native binding; retain event-loop progress | Git boundary migration | Overall Git ≤225 lines |
| `src/git/recovery.mjs:2` | Imports hot depth through Work state | Use existing holder-lock leaf like sibling facades; remove upper-layer dependency | Same cleanup | No growth |
| `src/terminal-control/client.mjs` | Host spawning, interpretation, group queue | Hot path to existing native door; cold doctor route may stay | After CF02–CF04 | ≤150 lines |
| `src/terminal-control/config.mjs` | Terminal defaults/floors/policy validity | Rust owns terminal decisions; CFG still owns config-file merging | Same cutover | ≤80 lines |
| `src/setup/terminal-control-checks.mjs:30` | Raw `herdr pane get` anchor access | Move behind existing terminal port; it is the concrete pane bypass found | Same cutover | Thin doctor adapter |
| `worker-session-boot.mjs` | Session startup and stale-socket judgment | Fix CF01; server start stays transport/process, not pane allocation | First | No second liveness policy |
| `herdr-round`, `herdr-agent`, deadlines, visibility, account probe | Consumer preparation, vocabulary, reporting | Keep in T4/T5; do not relocate caller policy into terminal-control | Later layers | No T2 copying |

The Node search found direct pane access in the doctor anchor check; server startup in `worker-session-boot` is a separate process boundary. Help/capability probes in setup are not pane allocation or mutation.

## Delete list

| Candidate | Evidence and disposition |
|---|---|
| Group-hint mechanism | `core.rs:230-236` writes it; production-source search found no caller of `Store::read_hint`. Only `store_publish.rs::the_group_hint_is_rewritten` reads it. Remove writer/reader/GroupHint/schema entry/test together; live grouping already reads allocation records. This also removes a dispensable post-allocation disk-write failure. |
| Raw doctor anchor subprocess | `terminal-control-checks.mjs:30` is the remaining raw pane-get site found. Delete after equivalent port observation is wired; preserve empty/missing/unknown-anchor diagnoses. |
| Terminal runner's fd loop | Replace with Process spawn; retain and strengthen its single fd-leak proof (CF10). |
| Node Land wait policy | Delete only when the async native replacement preserves existing waiting/event-loop proofs. |
| Checkpoint/legacy event support | **Conditional, not dead today:** source search finds `src/state/legacy-event-git-adapter.mjs:7` as its Node caller. WORK cutover owns deleting it; then remove `checkpoint_tracked_files`, addon dispatch and facade method with their obsolete proofs. |
| Activation tombstone / native-lock inspection | **Keep.** T1 established rollback releases still require the fence; unknown native index locks remain inspection-only. No evidence supports deleting either. |
| Wholesale Node Git tests | **Do not delete.** TEST's Git E6 report found many Node-only owning proofs and retired only three demonstrated mirrors. Reuse its `owns`, `route`, `mirrors-Rust` labels, not the historical test counts as deletion authority. |

## Doctor table

Current registration is **ten Git rows**, not nine: eight in `registrations.mjs:6354`, retained-Land at `:6367`, one-door at `:6372`. Four fixes are at `:6389-6392`.

| Current row / condition | Surviving owner / requirement |
|---|---|
| `git-component-compatible`: addon ABI/contracts, supported floor/probes; driver-directory/load errors | Same row; retain named channel/repair guidance |
| `git-durability-capability`: actual process-crash versus stable-media capability | Fold into compatible row; never turn informational capability into an unproved power-loss claim |
| `git-trust-topology`: main/common-dir/backlink/config refusal | Same row |
| `git-transport-config`: unsafe local transport/credential/proxy settings | Fold into trust row, retaining exact keys and credential remedy |
| `git-publication-refspecs`: required mapping, obsolete exact legacy mapping, reserved mirror refs | Fold into trust row; preserve configured-remote plus origin checks; no automatic foreign-ref deletion |
| `git-operation-journal`: initialized/readable/versioned/complete, errors, pending count, fence | Same row; preserve bytes and oldest unresolved; fix CF05/CF06 |
| `git-land-recovery`: retained candidates, actual pins, age, incomplete scan | Fold into journal row as warning, never success-negating failure or inferred acknowledgement |
| `git-native-locks`: index/config/packed/shallow/pin lock residue | Same row; no age/PID unlink |
| `git-worktree-recovery`: partial/missing/locked/backlink registration and pending Worktree WAL | Same row; preserve dirty/live-lock advisory versus hard-failure distinction |
| `git-mutation-one-door`: sites, payload hashes, unresolved binaries | Same row; regenerate at landing. CFG's known census regression is not evidence of a new T2 defect |
| `terminal-control`: absent driver warning; capabilities/incarnation; empty/unresolvable anchor failure; geometry fallback info | Keep; move anchor observation through the port and preserve unknown |
| `terminal-config`: unreadable config; grace/retention/policy/positive limits/40×8 floor; provenance | Keep, with Rust owning terminal validation |
| `terminal-allocations`: unlaunched shell, stale incarnation, expired retention, unreadable state | Keep observation-only; fix CF02; no misleading “nothing closed” message |
| Fixes: Git driver directories, WAL directory, Land recovery, publication refspecs; terminal directory | Keep registered typed fixes. No new row, default, env switch or infrastructure dependency proposed |

## Tests table

These are ownership/reproduction recommendations, **not test results**.

| Behavior | Owning proof to extend / retirement rule |
|---|---|
| Unknown server must not authorize unlink | `test/runner/dispatch-worker-session-boot.test.mjs`: extend existing alive/stale cases with route exception/unknown. The injected production-function reproduction here witnesses the missing branch. |
| Read-only doctor and explicit expiry cleanup | Keep Rust `core_failures.rs::retain_closes_only_past_until_on_the_same_incarnation`; extend `test/setup/terminal-control-checks.test.mjs` with one observation-only wiring proof. Do not duplicate expiry cases in Node. |
| Foreground tuple, not recycled PID, authorizes close | Extend immediate-close/retained-foreign cases in `core_failures.rs`; no Node mirror. |
| Installed terminal marker is not necessarily durable | Correct `store.rs::errors_before_install_propagate_and_errors_after_install_keep_the_outcome`; retain effect assertions and add error/durability assertions. |
| Config recovery finishes persistence, never repeats edit | Extend `tests/repository_config.rs::dead_config_writer_recovers_wal_before_and_after_effect_without_replay` at the rename/fsync gap. Keep one addon wiring case. |
| WAL temporaries do not consume record quota | Extend `wal.rs::scan_ignores_compaction_temporaries_before_counting_the_bound` to per-operation/pre-intent readers; retain real unknown-artifact refusals. |
| Sequence absence/error, rejected push, local durability | Extend newly landed `tests/sequence.rs`; its unreachable-remote case does not cover URL-discovery failure, rejecting hook or local persistence. |
| Entire fd table is sealed | Extend `herdr_driver_fake.rs::commands_do_not_inherit_the_callers_descriptors` from fd 200 to ≥2048; reuse Process primitive proof, keeping only terminal wiring. |
| Dead hint storage | Retire `store_publish.rs::the_group_hint_is_rewritten` when the mechanism goes; live grouping remains owned by core grouping rules. |
| Land async wait | Preserve Node `land.test.mjs` waiting/session-release witnesses identified by TEST N1; retarget when native async waiting owns the policy. |
| Existing safety/rollback/E4/crash cases | Keep owning Rust crash matrices and Node-only addon/borrow/controller-death proofs. Do not revive TEST's retired Land held-rank/replay and clean-Sync-abort mirrors. |
| Time-based waits | Review `core.rs` shell/identity polling, `herdr.rs` 1 ms child polling, and worker-session polling. Do not delete readiness/backoff bounds as “duplicate sleeps”; separate real timers from test synchronization. |

## Rejected hypotheses and boundaries

- **“Inspect can run outside containment.” Rejected.** OPC proved a superproject status can execute a submodule filter. The current driver keeps containment and best-effort escapee watching; no guarantee downgrade is proposed.
- **“OPC's post-kill unbounded Git wait is still the same bug.” Rejected.** The inspected contained branch checks refused kill/emptiness and returns `containment-unproven`; existing timeout/root-exit tests own it. I did not rerun them.
- **“A branch ref CAS protects checkout membership by itself.” Rejected as an assumption.** Refs takes worktree-admin and rechecks registered checkouts. These protections must remain.
- **“Free-custody probes alone prove removal race safety.” Not established.** The probes look racy in isolation, but pending lifecycle WAL also fences checkout admission. I did not establish an end-to-end producer/data-loss witness, so this is not promoted to a finding.
- **“Unknown ScopedCommit failure permits rollback solely because HEAD equals baseline.” Requires more evidence.** I inspected that rollback path but did not establish a live-writer/ABA witness through the existing custody/WAL guards; no finding is asserted.
- **“Every Node Git test mirrors Rust.” Rejected.** TEST's mutation evidence identifies addon-only and Node-only owners. Preserve them until a named lower proof actually replaces the behavior.
- **“Checkpoint is already unused.” Rejected on current main.** The temporary Work adapter still calls it. Remove only with WORK's cutover.
- **“The landed brief-shell fixes should be redesigned here.” Rejected.** Their handshake, foreground checks and tty flushing are accepted inputs; this report addresses separate close/persistence/failure boundaries.
- Windows Git build support, Event Store internals, supervisor redesign, seat selection and CFG's known census red remain outside this seat's implementation scope. H17/H24 stay T9. T1 R8 is recorded as fixed, not a new T2 finding.

## Proposed additions

**None.** In particular, no new sequence WAL, terminal sweeper, lock type, driver selector or probe crate is requested. Repairs should extend existing ports/primitives and remove the replaced path in the same change.

## Verification, coverage and remaining gaps

- Read the shared brief, criteria, parent/T2 plans and ledgers, T1 closing report, OPC arbitration/baseline/verification, reading map, relevant Git/terminal/process/boundary specs, contracts and TEST's Git E6 report.
- Read the complete `src/git` and `src/terminal-control` facades; terminal core/store/identity/driver/route/policy/record/port source; Git addon port modules; major Git driver/WAL/mutation/recovery paths and selected owning tests. Used bounded source searches and `git log -S` for prior art.
- **Coverage limitation:** I did not finish every line of the roughly 35k-line Git source/test inventory or every herdr-mentioning caller file. This report must not be used to satisfy the council's exhaustive-reading gate. Unread tails and the full assertion inventory remain a receiving-lead task, not silently certified safe.
- Ran one inline Node reproduction of CF01 against the real exported function with injected I/O callbacks. No test file, fake executable, probe crate or scratch Rust program was created. No real unlink/spawn occurred in that reproduction.
- No Cargo/Node test suite was run; no addon was staged, no full npm suite, doctor, lifecycle verb, preview server or live-pane test was started. Accordingly, Rust findings remain inferred and no green-suite claim is made.
- Checked Git status for the reviewed product paths: no pending modifications there at the final check. Pre-existing workspace changes were not touched. Main advanced concurrently; the sequence addition was explicitly inspected rather than silently attributed to the entry SHA.
- **R2:** no per-add containment timing was measured by this correctness seat. OPC's reports are context, not my measurements. The speed seat/lead still owes post-A milliseconds of containment per `addWorktreeSync`, paired fsync context, and the ≥100 ms trigger decision. Do not substitute whole-file test time or its 376→623 contained-child census for that measurement.
- The lead still owns focused reproductions, full integration verification, current census regeneration and OPC review of any Git-area repair. A reproduced High operational effect and the exhaustive-reading gate remain open before T2 can close.

Status: DONE_WITH_CONCERNS
Summary: Delivered the A/B council report with one reproduced unknown-to-unlink control-flow defect, nine inferred findings, target shapes and all four tables; no repository mutation or probe build occurred.
Concerns/Blockers: Rust findings were not executed; exhaustive Git/caller reading and R2 per-add timing are not complete. Main advanced during review, including the separately identified sequence-counter addition.
