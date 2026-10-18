# Review: Event Store phase 05, sharing and sync (and its Git port changes)

- **Scope:** `b62ac8b92..457f01012` (branch `event-store/p05-sync`), 15 changed source/test files listed in the brief.
- **Contract read:** phase-05 plan, plan.md D6/D17/D18/D20/M4/M5, Event Store spec §5, §10, §11, §14, Git spec §4 and §10 rules 1–4a, the phase-lead report, design principles.
- **Mode:** read-only. Nothing in the repository was modified apart from this report.

## Verdict

**Not ready to merge as is: one High finding, confirmed by a real test.** The core mechanics work. Own-ref push never forces. Mirrors are written only by fetch. The two-parent merge has the right shape and parent order, and it gets the D6 date. The Event Store writes no git config itself (URL pinning goes through `ensure_fetch_mapping`). The tests are real: bare remotes, clones, a real SIGKILL, and no env switches. Three-clone convergence holds.

There is one problem with that: the change to `known_receipt_tip` lets any merge commit placed on the own ref count as authenticated, and sync then pushes it under this machine's id.

## Independent verification

- I ran the phase gate on an exported copy of HEAD (`git archive HEAD`, scratch target dir): `cargo test --locked --no-fail-fast -p fgos-event-store -p fgos-git -- --test-threads=1` gave **184 passed, 0 failed**. That is the reported 180 plus 4 probe tests of my own, which were never added to the repository.
- The probe tests (file kept outside the repo at `/tmp/claude-1000/-home-vantt-projects-forgent--claude-worktrees-es-p05-review/49faed84-617a-4c21-9289-a7b3de808338/scratchpad/src/packages/event-store/rust/tests/probe.rs`) gave these results:
  1. `probe_outside_merge_on_own_ref_is_accepted_and_pushed`: sync returned `Ok`, and the remote now holds the forged merge. **Confirms H1.**
  2. `probe_rewound_foreign_blocks_own_push`: sync returned `Err(EventStoreMirrorRewound)`, and our own ref was not pushed. **Confirms M1.**
  3. `probe_linked_worktree_on_prefence_branch_blocks_sync`: sync from the linked worktree returned `Err(EventStoreLegacyMismatch)`; the same store synced from the main checkout returned `Ok`. **Confirms M2.**
  4. `probe_lost_receipt_cache`: deleting `sealed.json` and then syncing returned `Ok`, and the read gave 2 events. I suspected a false tamper refusal here; it does not happen, so there is no finding.

## Critical

None.

I checked these specifically:
- **No force push.** `publication.rs` `push` sends `<ref>:<ref>` with no `+`, grants only the authority's own ref or `refs/fgos/legacy`, and treats a non-fast-forward as the typed `RejectedNonFastForward` (M4). `sync.rs` `push` maps that to `event-store-push-rejected-non-fast-forward`, and the next sync converges.
- **Fetch never touches the own ref.** Fetch targets only `refs/fgos/remotes/<remote>/...`.
- **No git config writes from the Event Store.** There is no `Command::new` and no config write in `packages/event-store/rust/src`. `refspec::ensure_refspecs` goes through `RepositoryConfig::ensure_fetch_mapping`, and the URL pin is read back from `fetch_mapping_provenance` (D20).

## High

### H1. A merge commit placed on the own ref by someone outside the store is treated as authenticated, then pushed

- **Where:** `packages/event-store/rust/src/seal.rs:621`. This is the condition `!stops.is_empty() && matches!(header, Seal::Merge { .. })` in `known_receipt_tip`, reached from `sync.rs:357` and from both seal paths (`seal.rs:200`, `seal.rs:377`).
- **What happens:** when the own ref's tip is any `merge` commit that descends from the receipts, all the code requires is that `walk_verified` passes (the right `machineId`, project scope) and that no event of this store's own origin goes above the receipt. The merge's second parent can carry an **invented origin** sealed under this machine id.
- **Probe:** origin `f`, sealed as `machine-aa` and merged by raw `git update-ref`. Sync accepted it and pushed it to the remote under `refs/fgos/events/machine-aa`.
- **Why that breaks the spec:**
  - Spec §10 step 2.3: if a reread tip was "moved by an actor outside the store … stop with `event-store-ref-moved`, keep the segment, and doctor fails".
  - §10 chain invariant: the own ref is written only by its own store.
  - D17 says a pusher with remote write rights can add an origin. It does not allow a local outside actor to get one published *as this machine*.
  - Before this change, the same tip returned `false`, giving ref-moved.
- **Fix:** authenticate the merge itself, not just the graph under it. Accept a `merge` tip only when all of these hold:
  - its first parent is itself a known tip (recursively `known_receipt_tip`);
  - its second parent equals a mirror tip of the own machine id that this store authenticated earlier (`sync.json` `tips`, or the mirror tip verified in this same sync);
  - its `seal.json` parents match the commit's parents.

  A simpler alternative: after `reconcile`'s CAS wins, record the merge OID durably as an own receipt-equivalent (for example `ownTip` in `sync.json`, written before the push) and accept only that exact OID. In either case, add a regression test equivalent to probe 1.

## Medium

### M1. One rewound or tampered foreign mirror, or a forged remote legacy ref, aborts the whole sync before our own reconcile and push

- **Where:**
  - `sync.rs:315-316` (`verify_mirrors(...)?` over every mirror);
  - `sync.rs:328-341` (legacy mismatch returns before the own-ref steps);
  - `sync.rs:121-170` (the first bad mirror returns `Err`).
- **What happens:** one remote accident on machine X's ref stops publication on every machine that fetches it, until a person repairs the remote. Our probe confirms our own ref was not pushed. Unpublished windows grow everywhere, and the retirement rule (`unpublishedSummary`) cannot clear.
- **Spec reason:**
  - D17 says rewind "records `event-store-mirror-rewound` … cache kept" and "doctor fails". It does not stop the machine's own publication.
  - Spec §14 offline/step 4 expects the own ref to push whenever transport works.
- **Fix:** verify per mirror. A failing *foreign* mirror keeps its last authenticated tip in `sync.json` (`tips`), records its error code in `error` or warnings, and sync continues to reconcile and push the own ref. Keep refusing outright only when the failure is on the **own-id** mirror, or when the legacy ref fails to match before a reconcile that would use it. If the owner wants fail-closed on purpose, write that into spec §14 instead.

### M2. Sync's outcome depends on which worktree runs it: the fence is read from the per-worktree HEAD

- **Where:** `sync.rs:178-205` (`legacy_pin` uses `resolve_head`), plus the same pattern in `read.rs:229-290`.
- **What happens:** a linked worktree on a branch made before the cutover (no `.fgos/events` fence in its HEAD) gets `event-store-legacy-mismatch` once `refs/fgos/legacy` exists. The probe confirmed this. The store, the refs and `sync.json` are shared by the whole clone (common dir), so one store gets two different verdicts.
- **Spec reason:**
  - D18: the fence is a tracked file that pins one OID per repository.
  - Spec §11 read boundary: own-clone events are visible "to every worktree of the clone".
  - Design principle 5: decide from real shared state.
- **Fix:** resolve the fence from one repository-wide authority rather than the caller's HEAD. Options include the default-branch tip, or the pin recorded at `fgos events migrate` time and checked against the default branch. Do it through the single helper of M3, so reader and sync agree. This was already true of the reader before this phase; sync makes it reachable from every agent worktree.

### M3. The fence parsing and validation exists twice, with different error codes for the same violation (DRY)

- **Where:** `sync.rs:178-205` `legacy_pin` versus `read.rs:229-290` `read_legacy`.
- **The difference:** the same "legacy seal differs from fence" condition is `event-store-legacy-mismatch` in sync and `event-store-ref-tampered` in read. Sync also had to widen `read::Fence` to `pub(crate)` to copy the logic.
- **Spec reason:** design principles 1 (one door) and 7 (one authority).
- **Fix:** one `fence::pinned_legacy(port, repo) -> Result<Option<Oid>>` used by read, sync and (later) doctor, with one error code.

### M4. The rule that a mirror cannot invent own-origin events is implemented three times, with diverging semantics (DRY)

- **Where:**
  - `read.rs:354-390` compares against `max(receipt, own_published, base)`;
  - `sync.rs:146-163` compares against `Receipt.last_seq` only, re-reading `sealed.json` for **every event**;
  - `seal.rs:634-640` compares against `Receipt.last_seq` only, with the same per-event file read.
- **Why it matters:** one D17 rule now has three slightly different meanings, so a future change will drift. The per-event `Receipt::read` is also O(events) file reads.
- **Fix:** one helper, for example `walk::own_origin_bounded(events, origin, receipts)`, with receipts loaded once per stream. Use it from all three places.

### M5. Each sync walks every mirror and the own tip from the root, more than once

- **Where:**
  - `sync.rs:139-147` `walk_verified` with empty coverage and certified set, per mirror, called at `sync.rs:315` and again at `sync.rs:426`;
  - `seal.rs:622-631`, a full walk inside `known_receipt_tip`;
  - `sync.rs:345-354`, a further full walk of the own ref.
- **Why it matters:** sync cost grows as O(total history × machines) on every run, including the opportunistic trigger (§14, `intervalSec` default 300). Spec §11 prescribes pruning at certified commits. RUL104 asks for faster, not bigger. E3 measures Git calls, not this algorithmic cost.
- **Fix:** `sync.json` `tips` already holds the previously authenticated tips, and the rewind check proves the new tip descends from them. Pass those as `certified` stops, so only the new commits are walked. Load receipts once per sync (see M4).

### M6. A Git recovery rule changed without a Git spec amendment: `recover_publications` now closes interrupted remote transfers on its own

- **Where:** `packages/git/rust/src/publication.rs:685-701`, and the test change at `packages/git/rust/tests/publication.rs:915-925`.
- **What happens:** every `recover_publications` call, which means every seal, now finds RemoteFetch or RemotePush chains stuck at `TargetAttempt` under its own reference and closes them through `recover` (outcome `Transfer { unknown: true }`).
- **Spec reason:**
  - Git spec §10 rule 4 says a chain with a TargetAttempt and no outcome "returns `recovery-required` … and preserves WAL".
  - Amendment A1 (rule 4a) lets a later operation close an old one only for **PublicationCas**, and only under the three proven conditions.
- **Assessment:** the behaviour looks safe (nothing is resent, observations are local only, and the call runs under the borrowed event-seal). But it widens A1 to Remote kinds inside an Event Store phase, without the Git spec text or the Git lead's signature.
- **Other details:**
  - The `wal.active(100_000)` bound truncates silently.
  - The test no longer asserts the direct `recover(...).remote == Remote::Unknown` result. The compacted outcome assertion still covers "unknown", which is fine.
- **Fix:** add a Git §10 rule (for example 4c, "Remote transfer closure under the same publication authority") with its preconditions, get Git lead sign-off before merge, and either make the bound explicit (error when exceeded) or page through.

### M7. The no-op RepositoryConfig path writes a made-up journal shape

- **Where:** `packages/git/rust/src/repository_config.rs:234-257`.
- **What happens:** to record that the current URL is approved again (D20), the no-op path appends `Prepared`, then a `TargetAttempt { Absent → Absent }`, then `Outcome::Transfer { acknowledged: true }` to a **ConfigChange** chain.
- **Why it's wrong:**
  - Under Git §10 rule 4, a TargetAttempt marks an irreversible effect, and here none happens.
  - `Transfer` is the remote-transfer outcome; it is used here only so that `fetch_mapping_provenance` will read the record.
  - Every `setup` run now appends a full chain, so the WAL grows.
- **Fix:** a typed outcome such as `ConfigApproved { url }` (or effect-free `Unchanged` with provenance), with `fetch_mapping_provenance` reading it. Document it in Git §3/§10. The re-approval behaviour itself is correct for D20 ("until setup re-runs ensureFetchMapping").

## Low

- **L1. Missing crash and vector coverage for sync's own steps.** The only SIGKILL is `AfterSealTargetCas`. There is no kill between the merge CAS and the push, or during the mirror CAS inside fetch. Two plan validation vectors are untested: "with no cached credentials, sync fails fast" and "objects of an interrupted seal become garbage". Fix: add driver checkpoints around `reconcile` and `fetch`, and a credential-less remote test (for example an `https://` URL to a closed local port with `GIT_TERMINAL_PROMPT` unset), asserting that the failure is recorded rather than prompted.
- **L2. Test precision.** In `three_clones.rs:13-27`, the "departed" machine A keeps syncing, so leaving is not really exercised; `assert!(b.sync(false).is_err())` does not check the code or the `sync.json` record. In `shared_machine_id.rs:13-14`, the comment says "without transport", but `sync(true)` still fetches.
- **L3. Duplicated commit identity and date handling.** `reconcile.rs:11-30` and `61-68` duplicate the commit identity and date formatting of `publish.rs:70-81`, and hand-parse raw commit bytes for the committer date. Fix: a shared `event_commit(port, tree, parents, seconds)` helper. For D6, take the date from the parents' commit facts through one parser.
- **L4. Repeated string handling.**
  - `refs/fgos/remotes/{remote}/events/{machine}` is formatted inline about 6 times in `sync.rs`.
  - The ref-list pagination loop exists three times (`sync.rs:94-118`, `seal.rs:590-610`, `read.rs:73-131`).

  Fix: small helpers in `refs.rs`.
- **L5. Placeholder writer identity.** `sync.rs:292-295` uses `"sync"` as the own-ref writer identity before the first append. Any WAL chain left under writer `"sync"` will fail `validate_publication_borrow` once the store id exists. Consider using `legacy_import`-style stable authority, or minting the store id first.
- **L6. D18 ordering not guarded.** "Main is pushed before the legacy ref" is not checked before pushing `refs/fgos/legacy` (`sync.rs:405-417`). A cheap guard: refuse until the remote-tracking default branch contains the fence commit. Phase 11's runbook may own this; say so in the spec if that is the intent.
- **L7. Small `sync.json` issues.**
  - A failed `sync.json` write (`sync.rs:458-459`) hides the sync result.
  - An error from `now()?` skips the record.
  - `SyncRecord` has no `v` field and accepts unknown fields, unlike the store's other durable files.
- **L8. Mirrors are live before sync verifies them.** Fetched tips are visible to readers before `verify_mirrors` runs, because fetch writes mirror refs directly (allowed by Git §4). Readers re-verify everything except rewind, so a rebuild read of a rewound mirror quietly shows fewer events. Doctor should surface `sync.json.error` for this.
- **L9. `unpublished_since` can clear too early.** It is cleared on a successful sync even if appends arrived after step 1. Retirement relies on `oldest_unsealed_age_sec`, so this is cosmetic.

## Areas checked with no finding

- Two-parent merge: tree is `seal.json` only, parents are own then mirror, the date is the later parent's (D6). The CAS stale path rereads and gives ref-moved (§10 2.3).
- Fast-forward of the own ref to a verified own-id mirror when the own ref is absent or behind; joining a machine with no own ref.
- Refspecs: exactly the two mappings, no push refspec; URL change gives `event-store-remote-changed`, and setup repins it (D20).
- Rewind detection keeps the authenticated baseline across failed syncs. The forged own-origin mirror is refused with ref-tampered, and a forged legacy ref with legacy-mismatch.
- The remote holds only `refs/fgos/events/<id>`: no mirrors, local or branch refs, or Git pins are pushed.
- Lost `sealed.json` (probe 4): sync and read recover.

Status: DONE_WITH_CONCERNS
Summary: Review written; one High (an outside-written merge on the own ref is accepted and pushed, confirmed by a probe) and seven Medium findings, no Critical; the two-crate gate is green (184/0 including probes).
