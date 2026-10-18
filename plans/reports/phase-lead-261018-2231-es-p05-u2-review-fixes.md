# Event Store phase 05: review fixes

Implemented H1 and M1–M7 after reading the review, phase/plan decisions, Event Store §11/§14, signed Git §4/§10 and design principles. History searches traced authentication to `a2bb4b636` and phase-05 changes to `457f01012`; reused the existing Publication port, receipt/coverage walks, filesystem checkpoints and durable-file writer. `impact-analysis: inactive` (zero registered providers). No staging or commits.

| Finding | Change and regression evidence |
|---|---|
| H1 | Remove graph-only authentication of merges and the mirror-ref shortcut. Before reconcile CAS, durably authorize exactly the verified prior tip and computed candidate in `reconciled.json`; retain both across pre/post-CAS failures. `sync_review` rejects forged own merges both before and after the first append, preserves segments, and proves the remote remains unchanged. Real SIGKILL after merge CAS recovers and publishes; a native-lock CAS failure retains the prior merge's authentication. |
| M1 | Verify mirrors independently. Foreign failures retain authenticated tips/positions and record typed warnings while own publication continues; own-id failures still refuse. `v_event` checks rewound/forged foreign history and forged legacy against actual remote own-ref publication; `sync_review` checks own-id rewind refusal. Invalid local legacy still refuses. Reconciliation never uses legacy history. |
| M2/M3 | One `fence` helper resolves tracked bytes through the trusted main checkout, sharing the clone's authority across worktrees. One mismatch code: `event-store-legacy-mismatch`. `v_event` syncs and reads from a linked worktree on a pre-fence commit; legacy reader regressions verify mismatch and missing-fetch errors. |
| M4 | One own-origin bound checker, with receipts loaded once per read/sync. Reader bounds retain verified own-publication/cursor coverage for receipt-loss recovery. The third implementation disappears with H1's graph-authentication shortcut. Unit and real-mirror tests assert `event-store-ref-tampered`; receipt-loss tests stay covered. |
| M5 | Persist authenticated mirror positions alongside tips; use those tips as certified stops, verifying older status files in full once. Remove the redundant full own walk. `sync_review` temporarily removes a previously verified event blob to prove steady sync does not reopen it, restores it, then verifies incremental positions and a full read. |
| M6 | Revert automatic interrupted-transfer closure. Git's `remote_unknown_recovery_never_resends_and_corrupt_backlog_never_clears_admission` asserts automatic recovery returns `RecoveryRequired` and preserves the unresolved chain; explicit recovery reports `Remote::Unknown` without a remote, after which publication works. No recovery-spec expansion is needed. |
| M7 | No-op setup writes only ConfigChange Intent → `ConfigApproved`, with URL provenance in Intent. No fictitious Prepared/TargetAttempt/Transfer. The existing mapping test asserts two records, zero attempts, renewed URL provenance and idempotency. Schema/spec projection remains outside the grant, below. |

Cheap Lows: add real merge-CAS SIGKILL and credentialless closed-localhost HTTP failure/status tests (L1 partial); actually stop syncing the departed clone and assert offline error/status (L2); share event commit identity/date construction and check the merge date against both parents (L3); share mirror naming and ref pagination (L4); version/reject unknown sync fields, retain the original error when status writing fails, and record clock failures as warnings (L7).

Deferred Lows: fetch-internal CAS kill/garbage-object qualification, pre-append writer authority (L5), main-before-legacy rollout ordering (L6), doctor surfacing of rewind warnings (L8), and the append/status timestamp race (L9). These are not claimed fixed.

Proof: final locked two-crate gate: **189 passed, 0 failed, 2 intentionally ignored**; all-target locked clippy with warnings denied passes. `git diff --check` passes. Logs: `/tmp/es-p05-u2-verified-test.log` and `/tmp/es-p05-u2-verified-clippy.log`. MDView preview was attempted; its database is read-only.

Reproduce from the worktree root; no target directory is hard-coded:

```sh
cargo test --locked --no-fail-fast -p fgos-event-store -p fgos-git -- --test-threads=1
cargo clippy --locked -p fgos-event-store -p fgos-git --all-targets -- -D warnings
cargo test --locked -p fgos-event-store --test sync_review --test v_event --test shared_machine_id -- --test-threads=1
```

Required merge follow-up outside the write grant:

- `packages/git/contracts/wal-record.v1.schema.json`: add the effect-free outcome alternative `{"type":"object","additionalProperties":false,"properties":{"kind":{"const":"configApproved"}},"required":["kind"]}`.
- `docs/platform/git/spec.md`, §3/§10 proposed text: “When every requested mapping already exists, ensureFetchMapping re-approves the observed remote URL by recording ConfigChange Intent followed directly by terminal ConfigApproved. The Intent retains URL and refspec provenance; no target effect, TargetAttempt, or Transfer occurs. ConfigApproved is valid only for ConfigChange before any TargetAttempt; the operation id remains bound. fetchMappingProvenance recognizes this approval alongside successful config installation.”
- `docs/platform/event-store/spec.md`: record the clone-wide tracked-fence authority, exact prior/candidate reconciliation authorization, certified sync positions, and foreign-warning/own-refusal behavior described above.
- `CHANGELOG.md`: note the authenticated reconciliation, isolated foreign-mirror failures and consistent fence errors.

Status: BLOCKED
Summary: Review fixes and regression coverage implemented within scope; schema/spec/changelog projections require writes outside the grant before merge.
Concerns/Blockers: The WAL schema must recognize ConfigApproved; do not merge until the coordinator applies the listed contract/documentation changes.
Context refs:
- (none)
