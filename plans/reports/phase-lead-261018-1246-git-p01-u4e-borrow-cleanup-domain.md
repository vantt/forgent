# Git phase 01, unit 4e: borrow cleanup domain and Publication

Implemented the coordinator's cleanup decision and reviewed/validated the previously uncommitted Linux Publication backend. Borrowed children lead their own process groups through the existing fd-mapped spawn. Cleanup signals only that group and provable descendants, by identity, and drains before success. Unrelated direct children are waited for with repeated description scans under `killWaitMs`; other foreign holders return `lock-description-foreign-holder` without being killed or unlocked. A process disappearing between fdinfo and parent lookup triggers a recheck.

Publication admission also needed the same transient-copy handling: its former instantaneous only-self check intermittently refused before Intent. New non-spawning `validate_quiescent(&Handle)` reuses holder-lock's bounded scan without a kill domain, preserves the required self-holder evidence, and revalidates resource identity after waiting. Publication uses it before Intent/supersession. Process was not edited; fd opacity, validation-before-spawn, predecessor admission, and the existing transport remain intact. Reused the macOS group setup, holder scan, identity signals and unreaped-root release path; no dependency, config default or environment switch was added. `impact-analysis: inactive` (zero providers).

Real-process regressions pass: unrelated pre-exec `/bin/true` survives and exits 0 while borrowed Git succeeds; borrowed grandchild retaining the fd is killed/drained; foreign orphan survives named refusal and keeps exclusion even after the caller closes its copy; Publication waits out a pre-exec copy before CAS. The old unconditional setsid-kill test now asserts refusal, survival and exclusion when orphan ancestry cannot be proved, as the coordinator's foreign-holder rule requires.

Five consecutive full default-parallel runs on final source:

`CARGO_TARGET_DIR=.fgos/runtime/phase-target cargo test --locked -p fgos-git -p fgos-durable-file -p fgos-holder-lock`

| Run | Exit | Duration |
|---|---|---|
| 1 | 0 | 97.82 s |
| 2 | 0 | 106.83 s |
| 3 | 0 | 116.30 s |
| 4 | 0 | 125.34 s |
| 5 | 0 | 134.91 s |

Each includes the SHA-1/SHA-256 × files/reftable matrix, filesystem-boundary faults, before/after-CAS SIGKILL, recovery/ABA, remote mirror/non-FF and cleanup tests. The mirror failure did not recur. The ignored crash-child entry is explicitly invoked by its parent test. Three-crate locked all-target clippy with `-D warnings`, WAL Draft 2020-12 schema validation and `git diff --check` pass. Node holder-lock glob: **no differences from the 11 known baseline failures**. Raw gates and clippy are preserved in the assignment outbox. Earlier attempts exposed the repaired races; one direct-file logging attempt hit the real RLIMIT_FSIZE test's stdout limit, so final gates retain pipe stdout and record it in the parent.

Event Store interface remains `HolderAuthority::new` → `PublicationPort::new`, optional pinned `RemoteGrant`, plus recover/supersede/pin-release-and-compact as documented in unit 4d. Lead confirmation is still pending; combined-addon integration and RepositoryConfig provenance writing remain later work. Cross-platform execution, stable-media, performance and release gates remain unclaimed. Coordinator owns board/changelog/release integration. No git add/commit or Work lifecycle mutation was performed. Convention confirmed this report path; MDView preview is unavailable because its database is read-only.

Status: DONE_WITH_CONCERNS
Summary: Confined borrow cleanup and removed transient-child Publication admission failures; five consecutive full parallel gates and clippy pass.
Concerns/Blockers: Event Store interface confirmation and later integration/release gates remain pending.
Context refs:

- (none)
