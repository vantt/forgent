# HARDEN re-check of T0–T3: merged drift list

- **Big lead:** lead:HARDEN (`claude-p74h@fg-server2`).
- **Decision:** owner decision 48 (2026-10-28 14:48, «B»).
- **Code base:** every audit read main pinned at `b4817283f`, in the detached worktree `forgent-worktrees/harden-recheck`.
- **Per-layer audits:**
  - [T0](audit-261028-1448-harden-recheck-t0.md)
  - [T1](audit-261028-1448-harden-recheck-t1.md)
  - [T2](audit-261028-1448-harden-recheck-t2.md)
  - [T3](audit-261028-1448-harden-recheck-t3.md)
- **Not covered here:** the spec cross-check waits for DOC Land.

## Verdict

No layer has left its approved target shape. Each one-door scan reports 0 undeclared sites, and the layering checks found no upward import. The drift sits at the edges, and there are five kinds of it:

- dead surfaces that were never deleted;
- hand-kept copies of a list or rule;
- three readers outside a door;
- one Windows regression;
- stale names.

The audits reported 34 findings: T0 8, T1 10, T2 6, T3 5, plus 5 open items. Two findings describe the same thing: T2-2 and T3-3 are both the cutover grant. None was rated High. The big lead raises R2 to **High** for Windows.

## Verified by the big lead (independently, by reading code on the pinned tree)

- **R2.** On Windows, every commit in a main checkout whose lock file exists is refused.
  - The route answers `unavailable`: `packages/holder-lock/rust/src/route.rs:240`.
  - `mainLockVerdict` treats that answer as `error`: `.githooks/pre-commit:169-171`.
  - `main()` then refuses the commit: `:633-635`.
  - Introduced by HARDEN T1 in `bf7b60054` (10-22).
- **T3-1.** `events import-legacy` is still shipped: `src/verbs/events/import-legacy.mjs`, `bin/fgos.mjs:2925`, `command-registry.mjs:1611,1618`. The H33 package removed the Rust import but left this Node verb behind.
- **T2-2/T3-3.** The cutover grant has no producer. Every caller passes `null`, and the grant code spans Git Rust, the WAL schema, a route contract, distribution and the hook.
- **R1 dead code.** `fgos_identity::scrub_and_set` is called only by its own test.
- **R7 has no caller.** The only other mention of `scripts/next-doc-id.mjs` is an exclude in `check-decision-codes.mjs:21`.
- **T0-D2 dead route.** No product writer exists for the route at `src/native/door.mjs:40-44`.
- **T2-1 dead operation.** `checkpoint_tracked_files` has no caller in `src/` other than the facade itself.

## Decisions taken inside the approved frame (RUL104, decision 48)

### Batch A: HARDEN fixes now

One Sonnet lead works on one branch, with one commit per item. Reviews: OPC for the hook and the Git doctor rows; lead:ES for the event-store items.

| Item | Fix shape |
|---|---|
| R2 (High, Windows) | On Windows, the hook gets the lock verdict through a route that probes by path. It never treats `unavailable` as `held`, and it must not open a fail-open path. The fix needs a proof that runs on Linux, plus `cargo check` for msvc. |
| T0-D6 (R14 keep rule) | `unsupported` and `unreadable` keep the run dir instead of deleting it. `pruneRunDirs` scans once per call, not once per directory. |
| T0-D2 | Delete the `native-addon.json` route and the test writers that feed it. |
| T0-D3 | Use `uniqueTmpTag` at `case-runtime.mjs:150` and `recover.mjs:200`. |
| T0-D7 | Correct two test comments that describe deleted mechanisms. |
| R5 | Move `routeEnv` out of the lock-private driver into the shared leaf, and have its four copies import it. |
| R6 | `identity-mint.mjs` reuses `door()` from `session-identity.mjs`. |
| R7 | Delete `scripts/next-doc-id.mjs` and its test. |
| T2-3 (H30) | One `inspectGit` per doctor run, through `createDoctorRun`. |
| T2-5 | Move the recovery choices out of `git-checks.mjs`, or name them in the report if they cannot move without a contract change. |
| T3-1 | Delete the `events import-legacy` verb, its route, its registry entry and its test. This is the leftover of the H33 package the owner approved. |
| T3-5 | Fix the stale names and comments about a migration that no longer exists, without touching `docs/`. |
| R9 | Keep one proof that the hook refuses a commit while main is held. The other two tests are retired, and the retirement names the test that keeps the behaviour. |

### Handed to other lanes

These go out on the board. HARDEN does not edit those lanes' files.

| Item | Lane | Fix shape |
|---|---|---|
| T0-D1 | SEAT | Replace the canonical JSON twin in `seat-policy.mjs` with the door's `canonicalJson`, after a byte-equality run over the stored bound digests. |
| R4 | SEAT | Drop `seat-binding-in-lock`, which `exec-under-hot-lock` already enforces. |
| R10 | MAIL | Remove the private `HOME` filter in `mailbox_identity.rs`. |
| T2-6 | MAIL, cockpit scripts | Raw `herdr` execs in `scripts/`. The fix is either to go through the terminal-control port or to say why each script cannot. |
| T0-D4 | TEST | Two kill-by-bare-pid sites in test tooling: `run-tests.mjs:509` and `killIfSame` in `mailbox-live-confined.mjs`. |

### Carried to the next layers

| Item | Carried to | Reason |
|---|---|---|
| T0-D5 | T4 re-check | Two `/proc/<pid>/stat` parsers in run-supervisor; run-supervisor is T4. |
| R1 | T5 | The session-variable list exists in four hand-kept copies, and the Rust `scrub_and_set` is dead. The launcher is part of Execution Core and dispatch. |
| T3 open item | T4 and T5 | `Direct::classify` still has no production caller. |
| T3 open item | T4 and T5 | Node wording lists remain. |

### Accepted as is, with the reason

| Item | Reason |
|---|---|
| T0-D8 | `durable-file` gained `beneath.rs` for the Git WAL (`8debed9c6`). It is a reviewed open-beneath door that one owner uses. Removing it would make Git bigger. The approved shape is updated to include it. |
| R8 | The seven identity doctor rows each check a real, separate condition. Folding them would be churn without a gain. |
| T3-4 | `--reason migrated` stays while stored friction records carry it. It is a reader-side value. |
| T0-R1 | The canonical JSON cost through N-API stays open with no hot caller, as at T0 close. |
| H17, H19, H22, holder-lock budget | Unchanged. They stay on the hand-off ledger. |

## Owner questions (large drift)

These are sent to the owner in the decision-question template.

| Question | Item | Change | Owner of the files |
|---|---|---|---|
| Q1 | T2-1, T2-2/T3-3 | Delete the two dead Git surfaces: the checkpoint operation and the cutover grant. This changes a WAL record field, a route contract and `ports.v1.json`. | OPC |
| Q2 | T2-4 | Move the three hand-written `.git`/ref readers onto the Git Inspect and Refs ports: `state/store.mjs:514`, `runtime-inspection.mjs:259`, `confinement/resources.mjs:251`. | — |
| Q3 | T3-2 | The host registers Identity's stream from its own embedded registry. The change joins it to the manifest consumer door. | lead:ES and IDENT |

## Unverified (kept as items)

- **Decompose-child ids.** `src/intake/plan.mjs:832` derives decompose-child work ids as the highest sibling plus one. Whether the mint rule covers child ids needs the identity spec, which is read after DOC Land.
- **Possible duplicate proofs.** Proofs between Node and Rust tests for the same Git behaviour were not examined. These belong to the TEST lane's work.
