# Re-review: ac848d750 fix(git): address phase 02 review findings

Read-only. I read the full diff, the original review and the fix report, and traced Publication fetch/push, the WAL record digest path, the Remote transport policy and the new fetch/push outcome logic. I built one out-of-tree reproduction (scratch crate that `include!`s `packages/git/rust/tests/publication.rs`, offline, own target dir); nothing in the workspace was changed.

**Verdict:** H1, M1, M2, M3, M4, M5 and the Low items are fixed as described. M6 introduced one High regression: WAL records written before this commit for Publication fetch/push no longer verify, so they read as corrupt. That must be fixed before merge.

## Critical
None.

## High

**H-A. Historical Publication `RemoteFetch`/`RemotePush` records fail digest verification after M6 (regression).**
- Where: `packages/git/rust/src/wal.rs:85-96` (`#[serde(default)] targets`), checked at `wal.rs:424` (`r.digest != record_digest(r)?`) and `wal.rs:1019` (compaction residue).
- Cause: `record_digest` re-serializes the parsed `Record`. A historical record has no `targets` key. It parses with `targets: []` and re-serializes with `"targets":[]`, so the canonical JSON and the SHA-256 change, and the stored digest no longer matches.
- Reproduced: I created a Publication `RemoteFetch` intent through `Wal::begin`, rewrote its `00000000.json` in the pre-change shape (no `targets`, digest recomputed with `wal::canonical_digest` over that shape, as the old writer did), then read it. Result: `wal.inspect("hist")` returned `Corrupt("version/hash/chain")`, and `wal.scan` reported the same error entry.
- Effect: Event Store sync (`packages/event-store/rust/src/sync.rs:216,320,436`) writes these kinds in production. After an upgrade, any such record still on disk (pending, or terminal but not yet compacted) is unreadable. Publication recovery rules 4/4a-4c cannot run for that id. Every Refs/Remote admission refuses with `git-wal-unreadable` (`refs.rs:79-81`), because it requires a scan with no error entries. This is exactly the "historical records without target details" case named in the brief.
- Test gap: `tests/refs_remote.rs:874-881` round-trips through `serde_json::Value` and even asserts that `"targets":[]` appears. The assertion encodes the bug instead of proving compatibility; no test reads historical bytes through `Wal`.
- Fix: use `#[serde(default, skip_serializing_if = "Vec::is_empty")]` on both `targets` fields, so an empty list serializes as the historical shape. Non-event records always have non-empty targets (validated), so nothing is lost. Replace the round-trip test with a `Wal`-level test that writes a historical-shape record with its old digest and asserts it inspects, scans clean, and recovers under rules 4/4a-4c. Optionally also cover a two-record chain, because `previous_digest` links depend on the same digests.
- Unaffected: the compaction ledger v2 `binding_digest` (`wal.rs:1387-1396`) does not include `kind`, so ledger entries and C5 rollback matching are unaffected by the new field. Publication's recovery code (`publication.rs:165,173`) matches with `{ .. }` and does not read `targets`, so its rules are unchanged once records are readable.

## Medium

**M-A. The repo-local transport-config refusal decides "local" by matching an origin path, so it fails open on a path mismatch.**
- Where: `driver.rs:785-829`.
- Mechanism: `git config --show-origin` runs in `trusted_main_root`. A key counts as untrusted only when its origin path equals `common_dir/config` or `repo.git_dir/config.worktree`.
- Gap: for a linked-worktree `RepoHandle`, `git_dir` is `.git/worktrees/<id>`, but the listing (and the transfer, which also runs in the main root) reads the main checkout's `.git/config.worktree`. A `http.<url>.proxy`, `ssh.variant`, `credential.*` and so on placed there (when `extensions.worktreeConfig` is on) is never classified as local, so it is not refused, and URL-scoped `http.<url>.*` outranks the generic `-c` overrides.
- Same gap: any symlinked or non-canonical spelling of the path makes the comparison miss.
- Fix: decide by scope, not path. Use `git config --show-scope` (Git ≥ 2.26, under the floor) and treat `local`, `worktree` and any non-`global`/`system`/`command` scope as untrusted. Add a vector with a linked-worktree handle plus a main `config.worktree` entry.

**M-B. A compatibility break for Publication in CI needs an owner decision.**
- Publication transfers use `Policy::Remote` (`driver.rs:455-470`), so the new refusal applies to Event Store sync.
- `actions/checkout` writes `http.https://github.com/.extraheader` into repo-local config by default. Event Store sync in a GitHub Actions checkout will now refuse with `repository-transport-config-untrusted`.
- This is the correct security posture per the H1 decision, but it changes behaviour for projects using fgOS in CI (product priority 1).
- Options: document `persist-credentials: false` plus a trusted global credential, or have doctor detect and explain it. Either way, it belongs in CHANGELOG/doctor guidance.

## Low
- **L-A.** `publication.rs:1734-1771`: Publication push now performs an extra `ls-remote` before the intent. It costs one more network round-trip per push, and its value is used only for the journal. The target is also recorded under the *local* name (`refs/fgos/...`) with the *remote's* old tip and local next (`wal.rs:306` validates `name == resource_set[0]`). That mixes namespaces in one tuple. Either name it consistently in the schema description, or document it in the spec §10 paragraph.
- **L-B.** `remote.rs:248-249` still maps a WAL inspect error to `failure(e)` (Refused) rather than `recovery(...)`. This is residue of the L1 typed classification.
- **L-C.** `--atomic` against a server without atomic push support fails as a terminal Rejected with no fallback. That is acceptable, but worth one line in the spec.
- **L-D.** `remote.rs` fetch: after one CAS fails, the loop still attempts the remaining installs. The outcome is still classified correctly as unknown with observations. It is only worth stating as intended.

## Verified fixed (no finding)
- **H1:** `url.*` (all, including `pushInsteadOf`) refused in `command_config` (`driver.rs:1432`). Generic `http.proxy`, `sslVerify`, `extraHeader` and `followRedirects` are overridden with `-c` under `Policy::Remote`. Repo-local `http.*`, `ssh.*`, `protocol.*`, `credential.*`, `core.gitProxy`, `remote.pushDefault` and `remote.*.proxy`/`vcs` are refused. `core.sshCommand`, `uploadpack`/`receivepack` and include paths were already refused. `remote.*.pushurl` is irrelevant because pushes use the pinned explicit URL. This holds subject to M-A.
- **M1:** `--atomic` on both push callers; classification from per-target observations, all-unchanged → rejected, mixed → unknown.
- **M2:** forced semantics apply only to destinations validated under `refs/remotes/` (`remote.rs:207`; WAL `wal.rs:308`). Push destinations are only `refs/heads/`, refspecs carry no `+`, there is no `--force`, and `RefName` parsing refuses a leading `+`. All destinations are checked before the first CAS. Stale, failed and pre-install errors give a terminal not-acknowledged Transfer with observations.
- **M3:** main root refused before custody (`refs.rs:473`).
- **M4:** collision check plus refresh plus `read-tree -m -n -u` dry run before TargetAttempt.
- **M5:** rebase-merge/rebase-apply `head-name` and `BISECT_START` (bare branch name handled) count as in use.
- **Schema:** `wal-record.v1.schema.json` matches what is written: `targets` is optional with `required: [url, refspecs]`, and the tuple has 3 items with the Tip shape. It also matches what would be written after the H-A fix.

## Unresolved questions
- Do installed machines already hold uncompacted Publication fetch/push WAL records? This decides whether H-A is a field incident or only a pre-merge defect. The fix is the same either way.
- M-B: which CI credential story should fgOS support?
