# Git phase 02, unit 3: review fixes

Branch `git/p02-scope-refs`, base `d05481aa8ee5b0b3efbcb34d4114c28909a5df42`. No staging or commit. `impact-analysis: inactive` (zero registered providers). The requested report path overrides the convention result's current minute. Reused the existing hardened driver, Publication transfer kinds/recovery, WAL transitions, checkout facts, holder scope, and bounded byte-path readers; history confirmed that RemoteTransfer was the phase-02 addition beside the older Publication kinds.

| Finding | Resolution and proof |
|---|---|
| H1 | Preflight refuses every `url.*` key. Remote overrides generic HTTP proxy, TLS verification, extra headers and redirect settings with safe values; other repository-local transport settings, including URL-scoped HTTP, refuse. Real bare repositories reproduce raw Git's explicit-URL redirects for both rewrite keys and prove the hardened port leaves both destinations unchanged. Transport-config vectors cover safe overrides and refusal. |
| M1 | Both push callers use `--atomic`. Non-event push classifies every observed target; unchanged targets establish rejection and mixed observations remain unknown. A two-target rejection leaves both remote refs unchanged. |
| M2 | Remote-tracking fetch accepts rewinds with exact-old no-dereference CAS. All destinations are checked before installation. A stale second destination prevents the first install; pre-install failures and failed installs with no effect close as not-acknowledged Transfer with observations. Readable partial installs close as unknown; uncertain attempted writes retain recovery evidence. Files/reftable vectors prove rewind, pre-install failure and terminal stale outcomes. Push never forces. |
| M3 | Checked-out fast-forward refuses the trusted main root before custody/effects; regression included. |
| M4 | Index refresh and `read-tree -m -n -u` run before TargetAttempt. A real Git 2.53 probe showed dry-run alone can allow ignored-content replacement, so bounded ignored-path/incoming-tree collision checks also run. The regression preserves ignored directory contents, the old branch tip and a chain with no TargetAttempt. |
| M5 | Registered admin `rebase-merge/head-name`, `rebase-apply/head-name` and `BISECT_START` count branches as in use; detached-state regression covers all three. |
| M6 | Removed RemoteTransfer. Both callers now emit RemoteFetch/RemotePush with per-target old/new tips. Publication retains its authority, expected/next and recovery rules; historical records without target details remain readable, while non-event records require complete targets. The schema covers the actual kinds/resources; 20 real serialized WAL records validate against it. |
| L1 | Error classification uses explicit typed ResultCode constructors; no substring inference remains. |
| L2 | Only `locked initializing` is uncertain; an ordinary user-locked registered checkout permits unrelated Refs operations. |
| L3 | Linked-cwd discovery chooses the longest registered checkout prefix; nested-worktree regression included. |
| L4 | Unborrowed local fetch CAS uses LocalMutation, never Inspect; it retains the hardened driver and network prohibition without read-only optional-lock flags. |
| L5 | Holder-lock §5 documents first-caller/per-worker registration, early-load denial and the same-process trust boundary. |
| L6 | Both remote callers share URL credential validation: SSH usernames are allowed, passwords and non-SSH userinfo refuse. Unit vectors cover both. |
| L7 | A failed write still observing old never claims CAS Loss; native `.lock` regression retains recovery evidence. |
| L8 | Corrected the stale §16 checkpoint; §3 and §10 describe the shared transfer kinds and fetch rule. |

Validation commands (caller-owned Cargo target selection):

```sh
cargo test -p fgos-holder-lock -p fgos-git -p fgos-node-addon -p fgos-event-store
cargo clippy -p fgos-holder-lock -p fgos-git -p fgos-node-addon -p fgos-event-store --all-targets -- -D warnings
node --test test/git/*.test.mjs test/architecture.test.mjs
cargo test -p fgos-git --test refs_remote
cargo test -p fgos-git --test refs_remote wal_schema_records -- --nocapture
npm test
git diff --check
```

Rust suite and clippy pass; standalone addon harness warnings about unavailable Node-API symbols are expected outside Node. Actual addon behavior runs inside Node: **44 passed, 1 Windows skip**. Refs/Remote: **16 passed**. For schema proof, parse the `WAL_SCHEMA_RECORD ` lines from the dedicated test and validate each JSON record with Python `jsonschema.Draft202012Validator` against `packages/git/contracts/wal-record.v1.schema.json` (**20 records**, schema self-check also passed). No new config defaults, dependencies, bypasses or target-directory scripts were introduced.

`npm test` cannot enter its suite: EROFS opening `/home/vantt/.local/state/fgos/locks/full-suite.lock`. No gate was bypassed. Windows/macOS, host-wide fencing, stable-media durability and full host-side npm remain unproven here. MDView preview was attempted and failed because its database is read-only.

No out-of-scope edits were made. The mandated program-board lane update is outside the allowed write scope and remains for the coordinator: `plans/261017-1313-fgos-platform-program-board/plan.md`.

Status: DONE_WITH_CONCERNS
Summary: Addressed H1, M1–M6 and L1–L8 with real Git regression evidence, shared transfer WAL records and updated contracts.
Concerns/Blockers: Full npm and platform/host-only checks need a writable host; coordinator owns the excluded board update.
Context refs:
- plans/reports/review-261019-0747-git-p02-scope-refs-remote.md
- plans/reports/phase-lead-261019-0707-git-p02-scope-inspect-refs-remote.md
- plans/reports/phase-lead-261019-0723-git-p02-u2-handover-refs-remote.md
- docs/platform/git/spec.md §2/3/5/7/10
- docs/platform/holder-lock/spec.md §5
