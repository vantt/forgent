---
title: "Git component fgos-git: implement the signed G0 spec"
description: "Build the Rust fgos-git component behind one combined N-API addon, starting with the refs/fgos/* Publication port the Event Store consumes, then every typed port, the custody lease, and the one-release switch that deletes the three parallel Node git cores."
status: pending
priority: P1
effort: 254h
branch: main
tags: [git, rust, napi, holder-lock, event-store, migration, critical]
blockedBy: []
blocks: [261018-0945-event-store-fgos-event-store]
created: 2026-10-18
---

# Plan GIT: the fgos-git component

## Sources (binding)

- [Git spec](../../docs/platform/git/spec.md) G0, signed D-ADR0057: the contract. This plan implements it and never redesigns it.
- [Event Store spec](../../docs/platform/event-store/spec.md) §3, §4, §10, §14, §17, §18, §20, §21 (D-ADR0055); [Holder-lock spec](../../docs/platform/holder-lock/spec.md) §3, §5, §7-§9, §12, §16; [run supervisor spec](../../docs/platform/run-supervisor/spec.md) (D-ADR0056); [Process spec](../../docs/platform/process/spec.md); [component boundary](../../docs/platform/component-boundary.md); [design principles](../../core/instructions/design-principles.md).
- Evidence: [lessons catalogue](../reports/research-261017-1032-git-lessons-catalogue.md), [proof fold](../reports/review-261018-0024-git-g0-proof-fold-verdicts.md), [re-check fold](../reports/review-261018-0140-git-g0-recheck-fold-verdicts.md), [scout for this plan](../reports/scout-261018-0922-git-component-plan-census.md), [red team](../reports/red-team-261018-0922-git-component-plan.md).

## Scope challenge

- **Existing code reused:** holder-lock port, registry, `run_borrowed`, predecessor rule and fences; `fgos-process` containment; run supervisor domain and lease handover; the `.githooks/pre-commit` guards; setup/doctor registry; release manifest and `fgctl` gates. Nothing in Git, the addon or a Rust LockScope exists yet (scout).
- **Requested scope:** everything the signed spec requires (no `--yagni`). Mode HOLD SCOPE; nothing added beyond the spec.
- **Complexity:** one new crate, one addon crate, one Node facade, one Rust LockScope in holder-lock; about 25 Node files migrate. Every addition is named by the spec.

## Plan decisions

| # | Decision | Why |
|---|---|---|
| D1 | Ports land on main **dormant** as each phase passes. Before phase 07 only two have production callers: Publication (Event Store) and the cutover ScopedCommit (Event Store cutover commit). Phase 07 switches every other caller family and deletes the old writers in one stop-everything release. | Spec §12 capability split and same-release invariant (Q4); short-lived branches avoid drift. |
| D2 | Combined addon = crate `fgos-node-addon` (cdylib, `napi` + `napi-derive` pinned exactly) at `packages/git/node-addon/`, owned by Git. Event Store adds one module and one dependency line to it. | Spec §4 one load; §14 "Git owns addon/core contract". |
| D3 | One ABI row: `git-component-compatible` checks addon presence, load, ABI, target, digest, single load, contract versions and the Git floor. `event-store-native-addon` reports only the Event Store facade exports and points to it. | Event Store spec §21 asks the Git plan to merge the ABI evidence. |
| D4 | Manifest key `components.nativeAddon {path, digest, target, napiVersion, crates, capabilities}`; `capabilities` carries `git-wal-v1`. One resolver: `src/run-supervisor/payload-root.mjs` (the existing payload-manifest locator) is extended and reused for the staged release, the dev manifest and the dev host's existing manifest pointer; the npm package ships prebuilt addons with a package-relative `native-addon.json`; `run-tests.mjs` builds the addon. No new env variable, no PATH or cwd lookup. The pre-commit hook never loads the addon; it asks the activated host. | Spec §12; Event Store §23.2 item 9; red team (addon routes). |
| D5 | Rust `LockScope` lives in `fgos-holder-lock` (`scope.rs`) and reads the same registry file as Node. Held locks cross N-API only as Externals minted by the addon through a capability given to `src/git/native.mjs` alone, backed by a non-owning holder-lock `BorrowedHandle` (dup, verify, close before return); never an fd number. On win32 (hold transport, no description in Node) lock-taking typed operations refuse by name until Q6 is decided. | Spec §5 option (a); design principle 2; red team (handover). |
| D6 | Old-`fgctl` fence: the `activation` lock moves to `<fgosDir>/locks/activation-v2.lock`; the new `fgctl` itself, inside the first WAL-capable activation and holding both the old and new locks, unlinks the old lock file and places a tombstone there (Rust primitive in holder-lock, same format as `fences.mjs`). The registry schema gains owner `git` and a list of fenced legacy paths so the 4.4 fence stays. C5 also refuses on a missing fence or a live old-release writer. | Spec §12 C5; holder-lock §12 pattern; red team (fence placement). |
| D7 | New registry row `repo-config` (mutex, repo scope, rank 80 leaf, `<fgosDir>/locks/repo-config.lock`, fence none) serializes RepositoryConfig. | Spec §18 open item 3 assigns the row to this plan. |
| D8 | Custody: one `dispatch-cwd` lease per unit run, held by the controller from producer start through the runner commit (its git children borrow it), receipt and handoff; the supervisor declares the domain in the lease's existing predecessor record on every platform; the controller clears its own record after the receipt (recorded handoff). Admission: a best-effort domain (`linux-pgroup`, `macos-tree`) or an unprovable one is `custody-predecessor-unknown`; a producer without a declared domain is refused at start. No new record. Phase 04 lands stop-everything. | Spec §6; holder-lock §8; red team (admission holes). |
| D9 | One-door gate = static scan (Node data flow plus Rust `Command::new`) plus a runtime spawn spy preloaded by `scripts/run-tests.mjs`; doctor `git-mutation-one-door` reads a census artifact generated at build. | Spec §12 detection rule; existing spy pattern. |
| D10 | Workflow `integrate.mjs` deletion date: the phase 07 release, target **2026-11-13**. If the Event Store cutover slips, the date moves with it and the board row records the new date. | Spec §13 Q4 gives the date to this plan. |
| D11 | Addon targets are the existing release targets (`src/util/release-targets.mjs`: linux-x64, windows-x64); no new target. A red windows-x64 build blocks the phase 07 release, which makes the addon required. | Spec §12 no fallback; red team (scope). |
| D12 | The lease-lifetime change is planned here (spec §6, signed 2026-10-18) but conflicts with 6.4's recorded decision of 2026-10-16 to fold it into 6.4; Q5 asks the owner. Default: this plan owns it and 6.4 drops its fold. | Review rule: never silently undo an owner decision. |
| D13 | Threat model: Git guarantees hold against fgOS's own and confined writers; unconfined same-user code (which can run `git commit --no-verify`) is outside, as spec §9 says for raw Git. Cheap hardening is still applied (one-shot grant, WAL root trust, config preflight). | Red team (forgery findings). |
| D14 | The no-overwrite durable install is extracted once into `fgos-durable-file` and reused by Git, the run supervisor and terminal-control. | Design principle 1; red team (third copy). |

## Phases

| Phase | Name | Depends on | Model | Effort |
|---|---|---|---|---|
| 01 | [Publication port, foundation and Event Store handover](./phase-01-publication-port.md) | G0 signed; amendment A1 decided before the interface freezes | opus | 64h |
| 02 | [Rust LockScope bridge, Inspect, Refs, Remote](./phase-02-lockscope-inspect-refs-remote.md) | 01 | sonnet | 24h |
| 03 | [Worktree port, worktree-admin wrap set, public verb](./phase-03-worktree-port-and-admin-wrap.md) | 02 | sonnet | 20h |
| 04 | [Custody lease across the runner commit, successor admission](./phase-04-custody-lease-and-successor-admission.md) | 6.3 landed, Q5 | opus | 20h |
| 05 | [ScopedCommit, Sync, write-scope leaf, hook contract, cutover grant](./phase-05-scoped-commit-sync-hooks.md) | 02, 04 | opus | 32h |
| 06 | [Land, SafeRestore, RepositoryConfig, Recovery](./phase-06-land-restore-config-recovery.md) | 02, 03, 05 | opus | 32h |
| 07 | [Caller migration, three-core deletion, one-door gate](./phase-07-caller-migration-and-one-door.md) | 01-06, Event Store legacy cutover landed | sonnet (opus review) | 44h |
| 08 | [Implementation-time proofs, docs, landing](./phase-08-proof-gate-docs-landing.md) | 07, Event Store V-EVENT green (E1 and E3 start after 01) | opus | 18h |

```text
01 ──> 02 ──> 03 ──┐
 │      └──> 05 ──┴─> 06 ──> 07 ──> 08
 │   04 ──┘                   ▲
 └──> Event Store plan ──> ES legacy cutover (uses 05's cutover ScopedCommit) ──┘
```

Parallel lanes: 02 ∥ 04; 03 ∥ 05 after 02. File ownership per phase is in each phase file; no two parallel phases own the same file.

## What the Event Store gets, and when

- **After 01:** the Publication port in Rust (in-process for `fgos-event-store`) and in the combined addon (Node), `Inspect.resolveRepo`, `RepositoryConfig.ensureFetchMapping`, the addon crate with an Event Store module slot, doctor rows and packaging. Interface in [phase 01](./phase-01-publication-port.md#interface-handed-to-the-event-store).
- **After 05:** ScopedCommit in the main checkout under main-checkout 50 with `cutoverGrant`, and hook support for the grant (spec §7), which Event Store §18 step 5 needs.
- The Event Store legacy cutover lands before the phase 07 release (spec §12 ordering). The Event Store plan removes the event-file allowlist rows with that cutover.

### Event Store interface reconciliation (M1-M10)

Reconciled 2026-10-18 10:45 (Asia/Saigon) against the Event Store plan's mismatch table. (a) = a plan-level addition that fits the signed spec as written; (b) = needs a spec amendment, listed in the next section and not planned as decided. M6 was removed by the Event Store plan itself.

| # | Need | Decision | Where | Spec basis |
|---|---|---|---|---|
| M1 | `walk_commits` stop set; ordered parents and tree id per commit | (a) | phase 01 req 9, interface, validation | §4 "walkCommits(tips,cursor,bounds)"; protocol row 3: only the Event Store decides pruning, so the caller passes the stop set and Git does not interpret it |
| M2 | Fence and `fgctl` on every machine of one shared list | (a) | phase 01 step 14 and risk row, phases 04 and 08 landing, execution model | §12 C5 (fence on every activation); the list itself is Event Store Q2 (owner) |
| M3 | A crashed PublicationCas never blocks later seals and does not stay unresolved forever | (b) | amendment A1; phase 01 req 12 implements only what the spec allows now | §10 rule 4, recovery rows 2 and 7, line 326, line 328; §12 C5 |
| M4 | Typed `rejected-non-fast-forward` push result | (a) | phase 01 req 9, interface, validation; non-interactive transport added with it | §2 receipt `remote {… rejected}`; §4 protocol row 5 |
| M5 | Read-only facts: fetch refspecs, Git floor verdict, `fgos.machineId`, remote URL | (a) | phase 01 req 13a (and req 20 provenance), interface, validation | §3 reads; §12 doctor rows already need the same evidence |
| M7 | Explicit commit date | (a) | phase 01 req 9, interface, validation | §7 "preserve … author/committer identity/date" |
| M8 | Bounded WAL records and pins per seal | (a), with a bound per operation | phase 01 req 12a, validation | §10 line 328: compaction keeps the request digest and terminal receipt; pins are reachability only. Crashed records become compactable only through A1 |
| M9 | ScopedCommit `sourceCommit` mode, hook from HEAD's tree | (b), only if Event Store Q5 stays at (b) | amendment A2; phase 05 context note | §3 ScopedCommit, §7 grant, §8: no door writes another commit's bytes into the main checkout |
| M10 | Activation refuses a payload without the addon from the Event Store cutover release | (a) | phase 05 req 7a (linux-x64), phase 07 req 5 (windows-x64) | §12 "Missing/wrong addon … fails before mutation"; rollback refusal named as C5 does |

Two further interface gaps found while reconciling, both (a): `compare_and_swap` takes `next = Absent` (exact-old delete of an own `branch-events` ref; Event Store phase 04 abandon; spec §15 V-CAS lists delete) in phase 01 req 9; and `ensure_fetch_mapping` records the remote URL in its provenance (phase 01 req 20, 13a), so the Event Store's D20 pin needs no git config write of its own.

## Spec amendments needed before Git phase 01 freezes its interface

**Owner answers, 2026-10-18 10:35:** A1 accepted (add §10 rule 4a "Publication supersession" and the `superseded` outcome; re-run M1 two-operations-one-ref with negative controls, P-WAL-ID, V-CAS on files and reftable before Git 01 freezes its interface). A2 not needed: the Event Store chose two commits in one push (ES Q5 (a)).

Each item is a problem statement and a proposal for the owner, not a decision. Phase 01 may code the rest of the port meanwhile; its interface and the Event Store phase that depends on the item do not freeze until the owner decides. A signed amendment is recorded as a dated amendment of D-ADR0057 in the spec's own history, like the Event Store amendment of 2026-10-18, and is followed by the re-check named for it.

### A1. A crashed PublicationCas must neither block the next seal nor stay unresolved forever (Event Store M3)

- **What the signed spec says.** §10 rule 4 (`docs/platform/git/spec.md:287`): a chain with a TargetAttempt and no outcome is never re-effected under its id; recovery "returns `recovery-required` (or completes a receipt as `effectObservedOnly` when the state reached next) and preserves WAL, pins and snapshots". Recovery row 2 (`:316`): `ref=expected` with such a chain is `recovery-required`. Row 7 (`:321`): `ref` neither expected nor next means "retain pins; report supersession/uncertainty", with no terminal state. `:326`: "Startup mutation checks pending entries touching its resources; bounded scan returning incomplete knowledge is not clearance to mutate." `:328`: unresolved records and pins never expire. §12 C5 (`:346`): a release without the WAL capability is activated only when the WAL "holds no unresolved record".
- **Why the Event Store needs more.** A kill after Git installs the TargetAttempt and before the target rename leaves `ref == expected` with an unknown outcome. Event Store §10's crash table says the next seal "publishes again", and its D6 starts that attempt with a new operation id. Read naturally, `:326` makes the pending record of the old id deny clearance to any new mutation of the same ref: every later seal of that stream stops, the record is never compacted (M8), doctor reports it forever and C5 refuses rollback to a pre-WAL release forever. The Event Store red team rated this Critical.
- **Is there a path inside the current text?** Partly. (1) The spec never says that a pending record of a different id blocks Publication; Publication takes no registry lock, its effect is one exact-old CAS, and its resource authority is the caller's `event-seal` 58 (§5 `:158`, R30 row `:194`). Reading `:326` as "check, do not block" for Publication lets the new id proceed. (2) Event Store seal commits are deterministic (its D6, Git M7): the retry seals the same closed segment on the same tip with the same date, identity and message, so its `next` equals the crashed attempt's `next`. Right after the new receipt, phase 01 req 12 runs recovery of the old record while the ref is still at that `next`, and row 3 completes it as `effectObservedOnly`, which is terminal. Gaps that remain: the reading of `:326` is not settled by the text; when the two `next` values differ (a seal carrying `store.promote` whose branch tip moved between attempts, or any future non-deterministic caller) the old record falls into row 7 and stays unresolved forever, with the permanent C5 and doctor effects above.
- **Proposed spec text.** Add to §10 after rule 4: "4a. **Publication supersession.** For a PublicationCas only, a chain that ends at a TargetAttempt without outcome does not block a new operation id on the same ref: a caller holding the ref's resource authority (§5: event-seal 58) may start a new operation whose expected value is the tip it reads. The old operation becomes terminal `superseded` when, under that same authority, (1) a later PublicationCas of the same ref has a durable receipt with `thisInvocationWonCas`, (2) that receipt's expected value equals the old operation's expected or next value, and (3) no retained `<ref>.lock` of that ref and no live process of the old performer's containment domain is observed (`containment-unproven` keeps it `recovery-required`). Attribution is `effectObservedOnly` when the later expected value equals the old next value and `uncertain` otherwise. A superseded operation is never re-effected and its id stays bound; its pin may be released and its chain compacted like any terminal chain. Tip equality without the later receipt is never used." Change `:326` to end: "… is not clearance to mutate (C4). A pending entry blocks a new mutation of the same resource, except a pending PublicationCas, which rule 4a resolves." Add `superseded` to the §2 result list and row 7 of the recovery table ("… report supersession/uncertainty; for a PublicationCas, rule 4a").
- **Proof to re-run.** M1 model check extended to two operations on one ref: crash on both sides of the target rename after the old TargetAttempt, the old operation's orphan git child still able to fire, an ABA control, differing and equal `next`. Required: at most one publication per operation, no attribution beyond WAL evidence, `superseded` only after the later receipt; negative controls (supersede on tip equality alone, supersede with a live old performer) must give counterexamples. P-WAL-ID with a recoverer of the old id racing the supersession record (one transition writer). On the implementation: V-CAS recovery on `files` and `reftable`, and Event Store §23.2 item 1 (kill after object write and around `update-ref`) showing no stalled seal and no unresolved record. Run on `fable` through the architecture capability.
- **Recommendation.** Amend. The inside-the-text path depends on an unsettled reading of `:326` and leaves one reachable case unresolved forever, which C5 turns into a permanent rollback block. The amendment adds one terminal state and no new effect, so no CAS is ever reissued.

### A2. A door that commits a reviewed commit's bytes on main (Event Store M9), only if Event Store Q5 stays at (b)

- **What the signed spec says.** §3 ScopedCommit (`:114`) and §8 (`:247`) stage literal paths already present in the checkout after a producer ran; §7 (`:241`) defines the cutover grant as a ScopedCommit under main-checkout 50 judged by the checkout's hook (hooks path resolved relative to the trusted main root, `:233`). Land, the only operation that moves another commit's tree into a branch, is not exposed before the Event Store cutover (§12 `:350`). No operation writes a reviewed commit's bytes into the main checkout.
- **Why the Event Store needs more.** Event Store spec §18 step 5 puts the event-file deletions and the code change in one commit on main. In forgent that commit also edits `.githooks/pre-commit` (its D16), so the hook that judges the commit would be the one the commit brings. The Event Store plan's default for Q5 is (b): one commit through a new `sourceCommit` mode with the hook run from HEAD's tree.
- **Is there a path inside the current text?** Yes: Event Store Q5 (a). The reviewed code commit lands first through today's landing door (the Node land stays the door until phase 07, §12), inert because the new release refuses Work writes until migrated (Event Store D10); then `migrate` makes the grant commit through phase 05's ScopedCommit; both go in one push inside the stop window. It changes only the Event Store spec's "same commit" wording in §18 step 5, not the Git spec, and the hook that judges the grant commit is already the reviewed one on main.
- **Proposed spec text (only for Q5 (b)).** §3 ScopedCommit row, add: "A main-checkout ScopedCommit may carry `sourceCommit {oid, parent}`: under main-checkout 50, with HEAD equal to `parent` and a clean own-file set, Git snapshots every path `parent..oid` touches, writes exactly those paths' bytes and modes from `oid` into index and work tree, adds the grant's deletions, and commits; the pre-commit guards run from the hooks of HEAD's tree, never from bytes the commit brings; any failure restores every touched path from the snapshot (SafeRestore rules)." §7: the grant paragraph names `sourceCommit` as the only way the grant commit may carry non-grant paths.
- **Proof to re-run.** P-CUTOVER with `sourceCommit`, including a negative control in which the brought hook would allow itself and must be judged by the old one; V-CRASH and P-SPACE at every materialization barrier; V-SCOPE (exact path set); V-GATE counting the new door.
- **Recommendation.** No Git amendment: the owner answers Event Store Q5 with (a), and the Event Store lead amends its own §18 step 5 wording. A2 is drafted only so that the choice is informed; it adds a door and a hook-source rule for one commit in one repository.

### Not an amendment: M8's bound

Spec §10 `:328` keeps the request digest and terminal receipt of every compacted id so the id is never reused. Phase 01 req 12a therefore bounds the WAL per operation (one ledger line, no directory, no pin), not to a constant total. The Event Store plan's acceptance item 8 ("stay bounded over 10,000 seals") is met in that sense; a constant total would need the id-reuse rule weakened, which neither plan asks for.

## Cross-plan dependencies and collisions

| Plan / lane | Relation | Rule |
|---|---|---|
| Event Store ([plan](../261018-0945-event-store-fgos-event-store/plan.md)) | Its phases 03-05 are blocked by 01 (and 04 by amendment A1); its cutover is blocked by 05 and by an activated release containing 05; phase 07 is blocked by its cutover; phase 08 by its V-EVENT run. Interface rows M1-M10 are reconciled below. Its cutover edits `merge.mjs` (event parts), `main-fgos-checkpoint.mjs`, the `.githooks/pre-commit` line-count guard and adds a module to `packages/git/node-addon` | Board row ES; Event Store plan names these edges; phase 05 lands the hook grant before the cutover touches the hook; phase 07 rebases on the cutover |
| 6.3 terminal mode (running) | Shares `assignment-runner.mjs`, supervisor crate | Phase 04 starts after 6.3 lands |
| 6.4 controller death (held) | Owns `run.mjs`, `assignment-runner.mjs`, `recovery-planner.mjs` | Whichever lands second rebases; phase 04 tells the 6.4 lead its lease contract |
| Board shared files | `src/setup/registrations.mjs`, `CHANGELOG.md`, `lock-registry.v1.json`, `fences.mjs`, `bin/fgos.mjs`, `merge.mjs`, `worktree.mjs`, `Cargo.toml` | Edit only inside the owning phase; land second means rebase |
| `.gitattributes`, `merge=union` | Event Store cutover only | Not touched here |

## Execution model

- **Doors:** every phase lead is dispatched through `fgos workflow start --units <phase units file>` (planned work) or `fgos run "<brief>" --provider <id> --writes <owned paths> --worktree <linked worktree>` (one task), after `fgos dispatch decide`. Never a raw CLI or a raw `cargo`/`git` session acting as the lead.
- **Branches and worktrees:** `git/pNN-<slug>`, worktree `.claude/worktrees/git-pNN`, from main at phase start. Until phase 03's verb ships, worktrees are created by the existing door the big lead uses today.
- **Commits:** the runner commits only each unit's declared writes. Big lead `forgentx-95` merges to main, runs the gates, updates the board row.
- **Model per phase:** table above; reviewers run `opus`; any model re-check of a changed protocol runs on `fable` through the architecture capability.
- **Landing:** phase 01 installs the new `fgctl` on every machine of the owner's list (Event Store Q2, shared as Event Store M2), then activates every listed workspace one at a time (each first activation places its fence); the Event Store writes no WAL record until every fence is reported. Phase 04 and the phase 07 release land stop-everything (holder-lock §12) on every listed workspace and machine; the owner picks the hour. Phases 02, 03, 05, 06 merge dormant.
- **Impact analysis:** `fgos tool query --capability impact-analysis` reports GitNexus registered with status `unknown` (2026-10-18 09:34), so the posture is **degraded**: each phase reruns the query; with a present, fresh index it runs `impact` on every edited symbol and `detect_changes` before commit; otherwise it cross-checks callers with `rg` (phase 07 lists every caller) and marks blast radius as unconfirmed.

## Acceptance (implementation done, spec §17)

1. Component-boundary row present and true (already installed by the signing bundle); no consumer imports in `packages/git`.
2. Whole-product mutation allowlist is zero by the §12 rule (static plus runtime); seeded probes for the nine shapes fail as expected.
3. One write-scope matcher (Rust) with the Node facade passing the existing golden tests.
4. Every §15 vector, every §19 implementation-time condition (E1 real device, E3 against owner budgets, P-SPACE, P-RESOURCE, V-GATE, P-CUTOVER, P-RELEASE, V-CONSUMER, E4) has a real test or a recorded run with its verdict.
5. `npm test` and `cargo test --workspace`, `cargo clippy --workspace --all-targets -- -D warnings`, `cargo fmt --all -- --check` green on main after phase 07.
6. Workflow `integrate.mjs`, the Work merge/worktree core and the Unit commit/sync core are deleted in the phase 07 release.
7. Doctor green on every workspace with the eight Git checks of spec §12 registered (plus the existing holder-lock checks, reused unchanged).

## Traceability (spec section → phase)

| Spec | Phases |
|---|---|
| §1 boundary, `notARepository` | 01 (Inspect.resolveRepo), 07 (consumers), 08 (V-CONSUMER) |
| §2 entities, receipt, result codes | 01 (contracts), 02-06 (per operation) |
| §3 typed operations | 01 Publication; 02 Inspect, Refs, Remote; 03 Worktree; 05 ScopedCommit, Sync, Checkpoint; 06 Land, SafeRestore, RepositoryConfig, Recovery |
| §4 Publication, C1, combined addon | 01 |
| §5 locks, LockScope option (a), R30, containment | 02 (scope), 03 (40), 04 (30), 06 (20/40/50), 08 (V-ORDER, E4) |
| §6 N7 custody, successor admission, RUL84 | 04 (custody), 05 (lease validation, write-scope leaf) |
| §7 backend, env contexts, hooks, cutover grant | 01 (driver), 05 (hook context, G-062, `cutoverGrant`) |
| §8 scoped commit and sync, G-071, G-202 | 05 |
| §9 Land | 06 |
| §10 WAL, TargetAttempt, durability | 01 (primitive), 02-06 (payloads), 08 (E1, P-SPACE) |
| §11 cleanup and repair | 03 (worktree residue), 06 (native locks, delete) |
| §12 distribution, setup, doctor, C5, one door | 01 (addon, manifest, C5, fence, doctor), 07 (one door, stop-everything), 08 (P-RELEASE) |
| §13 caller migration | 07 |
| §14 dispositions | applied across 01-07; no phase reopens one |
| §15 vectors and experiments | owning phase per vector; 08 runs the cross-cutting set |
| §16 catalogue G-001..G-234 | 07 step "lesson test map" checks each retained lesson has a test |
| §17 acceptance | Acceptance above; 08 |
| §18 open items | 1: 08; 2: refused (05); 3: 01 (D7); 4: board row and D10; 5: 04 (with Q5); 6: 05; 7: 03 (Q2); 8: Q1 below; 9: 06 (consumer contract test); 10: 01 |
| §19 proofs | 08, with E1/E3 allowed after 01 |

## Open questions for the owner

**Owner answers, 2026-10-18 10:05 (Asia/Saigon).** Q1 agreed: a read-only workflow (Units without `writes`) runs outside a git repository; Inspect returns `notARepository`, a Unit with `writes` still needs a repository (closes Git spec §18 item 8; the runner change lands in phase 07 with V-CONSUMER). Q2 agreed: `fgos worktree create` ships in phase 03 before the Event Store cutover, since creating a worktree touches no event file. Q3: the owner runs the E1/P-SPACE script once with `sudo` on a loop device; phase 08 ships the script and a one-page run guide. Q4: the controller explains `e3-budgets.md` to the owner; no E3 measurement before the owner-set commit. Q5 agreed: this plan owns the cwd lease across the runner commit (phase 04); 6.4 drops its folded phase (checked 2026-10-18: nothing implemented yet; `src/run-supervisor/direct-launch.mjs` holds `dispatch-cwd` only during the attempt, `commitUnitWork` holds none). Q6 agreed: on Windows, lock-taking Git operations are refused by name (`git-lockscope-unavailable-windows`) and a follow-up item tracks the Windows LockScope handoff; no Windows workspace is activated today.

The questions below are kept as asked.

Each follows `core/skills/_shared/decision-question.md`. Until answered, the plan uses the recommendation marked as default.

**Q1. Read-only workflow outside a git repository (spec §18 item 8).**
- *What is happening:* `fgos run` throws "must run inside a git repository" before a read-only unit starts (`src/runner/execution/run.mjs:98-108`), so `business-discussion` cannot run in a plain business folder.
- *Cause:* the runner resolves the repo root unconditionally; Git's side is fixed (`notARepository`).
- *Options and cost:* (a) allow read-only units without a repo; units with `writes` still need one; one runner change plus V-CONSUMER cases. (b) keep requiring a repo; zero work, every business project must `git init`. (c) per-workflow config key; flexible but adds a setup/doctor key.
- *Recommendation:* (a), default in phase 07. Mission #2 needs it and `writes` already marks where a repo is required.
- *Scope:* runner behaviour for read-only units only; closes §18 item 8.

**Q2. Expose the `fgos worktree create` verb before the Event Store cutover?**
- *What is happening:* phase 03 builds the verb that replaces "`git worktree add`" in the `fgos-run` skill; spec §12 says Publication is the only Git capability exposed until the Event Store cutover.
- *Cause:* that §12 sentence protects Land and Checkpoint from event files; create never touches event files, but the text is literal.
- *Options and cost:* (a) ship create (not remove) and the skill change right after phase 03; agents stop running raw `git worktree add`, which takes no rank 40 today. (b) ship it with the phase 07 release; agents keep raw `git worktree add` for about three more weeks.
- *Recommendation:* (a). It removes a lock-free writer early and changes no event-file path. Default without an answer: (b), because the signed text is literal.
- *Scope:* release timing of one verb and one skill line; no protocol change.

**Q3. Who runs E1 and P-SPACE with root on a real device?**
- *What is happening:* E1 (power loss for objects, refs and the WAL) is an implementation-done condition and needs root or device-mapper on a real ext4 device; agents here have neither.
- *Cause:* fault injection needs `dm-flakey` or `dm-log-writes` and `sudo`.
- *Options and cost:* (a) the owner runs the phase 08 script once with `sudo` on a loop device backed by a real disk (about 30 minutes). (b) a disposable VM with root, set up by the owner (about 2 hours once). (c) ship with `durability.processCrash` only and leave E1 open; implementation is then not done by spec §17.
- *Recommendation:* (a).
- *Scope:* who provides root for one experiment; no design change.

**Q5. Who owns the lease extension across the runner commit: this plan or 6.4?**
- *What is happening:* the 6.4 plan records "Đã chốt 2026-10-16: gom vào 6.4" (fold a ~3h `dispatch-cwd` hold around `commitUnitWork` into 6.4; `plans/261016-1351-controller-death-settle-and-resume/plan.md:108`), while the signed Git spec §6 (2026-10-18) gives the lease change and successor admission to the Git plan. Both would edit the same lines of `run.mjs` and `assignment-runner.mjs`.
- *Cause:* the two decisions were taken two days apart for different documents; the later spec adds successor admission, which 6.4's fold does not cover.
- *Options and cost:* (a) this plan's phase 04 owns all of it; 6.4 drops its fold (one plan edit; 6.4 rebases on phase 04). (b) 6.4 keeps the hold around the commit; phase 04 adds only the domain record, handoff clearing and admission on top (two plans, one contract, more coordination). (c) phase 04 moves into 6.4 wholesale (6.4 grows by about 20h and must follow Git §6).
- *Recommendation:* (a): one owner for one lifetime, and the later signed spec already names this plan. Default without an answer: (a), with the 6.4 lead told before 6.4 opens.
- *Scope:* ownership of the lease lifetime and admission code only; no change to Git §6.

**Q6. Lock-taking Git operations on Windows.**
- *What is happening:* on win32 the holder-lock facade keeps every lock in a helper process (`src/holder-lock/driver.mjs:31`), so Node has no description to hand to Rust, and the spec forbids passing anything weaker. After phase 07 the addon is required and the Node writers are gone.
- *Cause:* spec §5 option (a) was designed around in-process descriptions; the Windows hold transport predates it.
- *Options and cost:* (a) refuse lock-taking typed operations on win32 by name (`git-lock-handover-unsupported`) and open a follow-up item for a hold-helper borrow route; no Windows workspace is activated today (board 4.4b). (b) build the hold-helper handover in this plan (about 12h more, plus Windows CI vectors). (c) drop Windows from the release targets.
- *Recommendation:* (a). It changes nothing for any running workspace and keeps the spec's guarantee. Default without an answer: (a).
- *Scope:* Windows behaviour of ScopedCommit, Sync, Land, Worktree, Refs and SafeRestore; Publication and Inspect stay available.

**Q4 (owner input, not a choice). E3 budgets before measuring.** A proposal exists in [`e3-budgets.md`](./e3-budgets.md) (starting numbers from the DC baseline); the owner edits or accepts it and commits it with an owner-set status line before any combined-addon measurement (phase 01 step 0). No E3 verdict is recorded without that file's commit preceding the run.

## Red Team Review

### Session 2026-10-18
**Findings:** 15 after deduplication of 37 (14 accepted, one partly; 1 turned into owner question Q5; 0 rejected). **Severity:** 6 Critical, 6 High, 3 Medium. Full table: [red-team report](../reports/red-team-261018-0922-git-component-plan.md).

| # | Finding | Severity | Disposition | Applied to |
|---|---|---|---|---|
| 1 | Raw fd across N-API; no adopt API; Windows hold transport | Critical | Accept | D5, Q6, phases 01, 02 |
| 2 | Successor admission fails open (absent record, best-effort domains, old releases) | Critical | Accept | D8, phase 04 |
| 3 | Failover self-exclusion, throw-path leaks, missing files | High | Accept | phase 04 |
| 4 | Commit children run without the lease until phase 07 | High | Accept | phase 04 |
| 5 | Old-`fgctl` fence cannot be placed as written | Critical | Accept | D6, phase 01, execution model |
| 6 | No addon route for dev host, tests, hook | Critical | Accept | D4, phases 01, 05 |
| 7 | 42 git-spawning files, phase 07 owned 15; holder-lock cycle | Critical | Accept | phases 01, 02, 07 |
| 8 | Lease ownership conflicts with 6.4's owner decision | High | Owner question | D12, Q5 |
| 9 | CAS fsync order inverted for the pin | High | Accept | phase 01 |
| 10 | `cutoverGrant` replay and binding | High | Accept (partly) | phase 05, D13 |
| 11 | Repository config runs external commands | High | Accept | phase 01 |
| 12 | Single-load marker mechanism | High | Accept | phase 01 |
| 13 | `write-scope.mjs` leaf contract | Medium | Accept | phase 07 |
| 14 | Supply chain, WAL root trust, stale npm channel | Medium | Accept | phases 01, 07, 08 |
| 15 | darwin scope, durable-install copy, constructors, floor, V-BORROW, V-EVENT, scaffolding | Medium | Accept | D11, D14, phases 01, 02, 05, 08 |

### Whole-Plan Consistency Sweep
Stale terms searched across all files (`custody.json`, `domainDeclared`, `facade-private`, `darwin-arm64`, normal landing for 01/04, empty per-port modules, `/dev/null` default, "one spawn site", "nine Git checks"): none remain. Phase efforts sum to 242h. Traceability still covers §1-§19. No unresolved contradiction.

## Validation Log

### Verification Results
- **Tier:** Full (8 phases): Fact Checker, Flow Tracer, Scope Auditor, Contract Verifier, run by the red team plus the planner's own pass.
- **Claims checked:** 64 (file paths, line citations, symbols, behavioural claims on the custody window and fence code).
- **Verified:** 63 | **Failed:** 1 | **Unverified:** 0.
- **Failure:** `src/runner/stray-writes.mjs` does not exist; the module is `src/runner/dispatch/stray-writes.mjs`. Corrected in phase 07.
- Behavioural traces confirmed: controller closes its lease copy at binding (`assignment-runner.mjs:2486-2494`); supervisor releases at gate exit (`supervise.rs:339-340`); runner commit runs later with no lease (`run.mjs:802-806`); holder-lock acquire runs predecessor admission and judges best-effort domains `Empty` from the record (`predecessor.rs:180-183`); old `fgctl` opens `.fgos/locks/activation.lock` through holder-lock acquire (`init.rs:170-204`).

### Questions recorded instead of asked
Per the delegation brief, no question was put to the owner during planning; Q1-Q6 in this file carry the decision-template answers and the defaults the plan follows until the owner answers.

### Whole-Plan Consistency Sweep
Re-read after validation edits: the single failure fix touched one path in phase 07; no other file referenced it.

### Event Store reconciliation sweep (2026-10-18 10:45)
M1, M2, M4, M5, M7, M8, M10 and two further gaps (CAS delete, mapping provenance) applied to phases 01, 04, 05, 07, 08 and the execution model; M3 and M9 written as amendments A1 and A2, not as decisions. Phase efforts now sum to 254h (01: 54h → 64h, 05: 30h → 32h). Searched for "both machines" and "three workspaces": only the Event Store Q2 list remains as the landing set. The Event Store plan's mismatch table marks each row with this decision.
