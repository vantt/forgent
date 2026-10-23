---
phase: 02
title: "CF01 liveness evidence; the one remote door (RT01, F-7, CF07, display-form pin); Worktree and Refs compaction (F-C1)"
status: pending
depends_on: [01]
parallel: "none for Git files; phase 06 may run beside it"
effort: ~1d
net_size: "Node +10 / Rust +20 / tests +60 (estimate)"
---

# Phase 02 — CF01, the remote door, compaction

## Context

Arbitration D1 step 2 and §2.1 ("one remote door, Publication's"; "Compaction (F-C1)"), §2.3 (CF01), D3 (RT01 is a fix), RT02 (ConfigChange stays retained). [plan.md](plan.md) Facts, D-T2-1 (display-form pins), D-T2-2 (CF07 here), D-T2-3 (remote half of E-24). Three slices, three commits, one lead; the order below is the commit order.

## Requirements

### Slice A — CF01 (`src/runner/dispatch/worker-session-boot.mjs`)

<!-- Updated: Red Team 2026-10-23 - bind-before-listen race; poll loop semantics -->
- `serverAnswers` (`:33-40`) becomes a tri-state judgment `alive | dead | unknown`, decided from the OS's own answer, not from a failed route (design principle 5):
  - **alive**: `capabilities` answered `result: 'capabilities'` with a non-null `serverIncarnation`;
  - **dead**: a connect to the Unix socket path is **refused** (`ECONNREFUSED`) **twice**, across a short interval (≥ the existing `pollMs`), with the socket file's inode and mtime unchanged between the two attempts. A socket file exists after `bind()` and before `listen()`, so one refusal can be a server that is still starting; the second, on the same inode, is the evidence. The core has no "no server" answer of its own (`core.rs:681` stores the incarnation read with `.ok()`), so the route alone never proves dead; a null incarnation on a successful answer is **unknown**;
  - **unknown**: anything else — any `TerminalControlError` (missing host, timeout, version mismatch, empty or non-JSON stdout, `client.mjs:41-78`), a connect that succeeds but whose route does not answer, a connect timeout, a changed inode between the two probes, any other throw.
- Only **dead** unlinks the socket (`:81-84`) and starts a server. **unknown** keeps the socket and throws a named error (`worker-session-server-unknown: <cause>`); no second startup path. The post-start poll loop (`:106-115`, the second `serverAnswers` use) treats **dead and unknown alike as "keep polling"** until its existing deadline; it never unlinks. Prior art `ec9d41c23` is reused; the connect probe uses `node:net` through the function's existing injection seams (`unlinkFn`, `spawnFn`, `sleepFn`, plus one `connectFn`) so the test injects it. Server-lifecycle evidence, not pane access (arbitration §2.3).
- Test first: extend `test/runner/dispatch-worker-session-boot.test.mjs` (owner of alive/dead) with "a route that does not answer keeps the socket and starts nothing", "an answer without an incarnation keeps the socket", "a socket refused once and then answering is not removed" (the bind-to-listen window).

### Slice B — the one remote door (Rust, `packages/git/rust/src/{driver.rs (redact only),publication.rs,remote.rs,sequence.rs}`, `packages/identity/rust/src/mint.rs`)

<!-- Updated: Red Team 2026-10-23 - door narrowed to read+classify; ssh user kept in display form; grammar hardened; all sequence_home callers listed -->
- **One door = one read-and-classify function**, not one call path. A `pub(crate) fn remote_target(&self, repo, grant) -> Result<(String /*raw url*/, &'static str /*scheme*/)>` on `GitDriver` replaces both `remote.rs::transfer_url` (`:41-68`) and Publication's `remote_url` (`publication.rs:1405-1435`). The two **call halves stay**, because they run under different authorities: `remote.rs::transfer_call` (`:70-90`; caller's `LockScope`, rank check `remote_scope` `:92-103`, `Policy::Remote`) and Publication's `remote_call` (`publication.rs:1437-1454`; publication borrow, `Policy::Publication`). Publication's `remote_call` stops inlining the argv and calls `transfer_argv` (`remote.rs:24-39`), which becomes the one argv builder in fact. Callers of the door: `remote.rs:122,150,220,422`, `sequence.rs:89,103,157`, `publication.rs:1550,1674`.
- **Door behaviour** (D-T2-1, revised): read the URL raw (`remote get-url --`); refuse every ASCII control byte and whitespace, a leading `-`, `?`, `#` and `::` anywhere; refuse credentials on the raw string with `url_has_credentials_or_controls`, extended so a user or host that starts with `-` is refused in the `ssh://` form too (today only the whole string is checked, `remote.rs:620-632`); compare **raw** with `grant.pinned_url`; classify; return the raw URL.
- **`redact` keeps a password-free ssh user name** (`driver.rs:1757-1778`): it masks userinfo only when `url_has_credentials_or_controls` would refuse it (passwords, `%`, https userinfo) and keeps truncating a query. For every URL the door accepts, display form == raw form, so every existing pin (Event Store provenance `refspec.rs:45`, `remoteTracking` `inspect.rs:1133` → `src/runner/worktree.mjs:470`, the sequence home, config provenance `repository_config.rs:306`) keeps matching for `https`/`file`/scp origins, and an `ssh://user@…` pin now binds the account. Existing on-disk provenance recorded as `ssh://[redacted]@…` (only for ssh origins with a user, which were already refused by Publication) answers Event Store's existing `remote URL changed; rerun setup` (`refspec.rs:45-48`) once; `fgos setup` re-records it. No migration code.
- **Scheme ladder** (RT01, D3): `/…` and `file://` → `file`; `https://` → `https`; `ssh://` → `ssh`; **scp form** → `ssh` only when: no `://`; no `::`; the first `:` comes before any `/`; the part before it is `[user@]host` where host matches `[A-Za-z0-9._-]+` (no brackets, no leading `-`) and the user passes the ssh userinfo rule. Everything else → `remote-protocol-not-supported`. The door's grammar is the guard; git's `protocol.allow=never` is a second line, not the first. No new transport.
- **The credential unit test** `remote.rs:659` moves next to the door and carries phase 1's cases plus `ext::sh -c x`, `fd::17`, `ssh://-oProxyCommand=x@h/r`, `a b@h:p`, `[::1]:p`, `h:p?x`, a tab byte.
- **Sequence home** (RT01 + CF07): `sequence_home` returns `Result<SequenceHome>`:
  - origin **absent** (no `remote.origin.url` in the driver's `config_facts` listing; re-grep) → `Local`;
  - origin present → the door's read-and-classify runs now; a refusal is returned **before** any counter commit (named cause);
  - any read error → returned, never `Local`.
  
  Every caller moves in the same commit (L10; `rg -n "sequence_home" packages`, 2026-10-23, 8 sites): `packages/identity/rust/src/mint.rs:166` (claim: refusal through `git_refusal`), `mint.rs:206` (`release_sequence`, the compensating give-back: on a home error it returns the typed refusal with its cause, never `Ok(false)`, and its caller reports the unreturned number by name; one case in `packages/identity/rust/tests` states it), `packages/git/rust/tests/sequence.rs:84,132(×2),191,204,219` (`.unwrap()` / assert the refusal).
- `Inspect::remote_url` stays the display read for its display callers (`inspect.rs:1133`, `repository_config.rs:306`, addon `remoteUrl`, Event Store `refspec.rs:45`).

### Slice C — compaction of Worktree and Refs chains (F-C1)

<!-- Updated: Red Team 2026-10-23 - authority, stuck chains, deferral channel, replay table -->
- One constant: `RECENT_TERMINAL` moves from `publication.rs:203` to `wal.rs` and every user imports it.
- **One release-and-compact helper** (reuse, not a new mechanism): Publication's `release_pin_and_compact` (`publication.rs:1800`) becomes a crate helper taking the port's authority and lock scope, and Worktree and Refs call it. It runs `release_pin` first (idempotent: it resumes a `PinReleaseAttempt` and returns at `PinReleased`, `refs.rs:342-363`), then `wal.compact`. So an older chain that stopped between its outcome and its pin release is **released and compacted** by the next pass, not retried as `RecoveryRequired` forever.
- **Where and under which authority:** at the end of `finish_worktree` (`worktree.rs:509-535`) and of `change_ref`'s terminal path (`refs.rs:601+`), still holding the same `worktree-admin` scope the operation took, which is the scope `release_pin` already runs under (`worktree.rs:528-534`); the WAL authority passed to `compact` is the port's own `Authority { scope, binding }` (`worktree.rs:476`), whose `validate_publication_borrow` the lead confirms admits these kinds (else this slice stops `BLOCKED` with the refusal named). The pass covers terminal chains **of the same kind** beyond the `RECENT_TERMINAL` most recently changed; unknown-evidence and unresolved chains are never compacted (`wal.rs:2181-2200`); **ConfigChange is excluded** (RT02).
- **Deferral channel:** a compaction that cannot finish leaves the chain retained (the next pass retries it) and is reported as a named warning in the operation's returned receipt where the port returns one (Refs `receipt(...)`; Worktree create/remove results — the lead names the field), never `eprintln!`, never a failure of the operation that already succeeded.
- **Same-id replay after compaction** — one answer per compacted outcome, equal to the retained-chain answer (`refs.rs:725-744`):

  | Ledger outcome (`wal.rs:1888-1938`) | Retained answer today | Compacted answer after this slice |
  |---|---|---|
  | `"s"` Success (tip, attribution) | receipt | the same receipt, from the caller's intent (checked by `c.matches(&intent)`, `wal.rs:1339-1342`) and the ledger's tip and attribution |
  | `"l"` Loss | `stale` `compare-and-swap-stale` | `stale` `compare-and-swap-stale` |
  | `"a"` AbandonedBeforeAttempt, `"x"` Superseded, anything else | `operation-recovery-required` | `operation-recovery-required` (unchanged) |

  Worktree keeps `worktree-operation-already-exists` for retained and compacted alike (`worktree.rs:505`). Callers that replay Refs by id: the lead lists them (`rg -n "createGitRefs|\.changeRef\(|operationId" src/runner/worktree.mjs`; spec F-9 cites `:718,1235`) with what each does on `operation-recovery-required`, in the commit body.
- Tests (test-first): extend `wal.rs:3256` `ten_thousand_terminal_operations_have_no_record_directories` with the Worktree kind; extend `tests/worktree.rs` with "finished worktree operations beyond the recent few leave no record directory" and "a chain stopped between its outcome and its pin release is released and compacted by the next operation"; extend `tests/refs_remote.rs` with one case per replay row above; `tests/repository_config.rs` owner case stays green (ConfigChange retained).

## Files

**Create**: none. **Modify**: `src/runner/dispatch/worker-session-boot.mjs`; `packages/git/rust/src/{driver.rs (redact),publication.rs,remote.rs,sequence.rs,refs.rs,worktree.rs,wal.rs}`; `packages/identity/rust/src/mint.rs` (`:166`, `:206`) and one identity test; tests `test/runner/dispatch-worker-session-boot.test.mjs`, `packages/git/rust/tests/{worktree.rs,refs_remote.rs,sequence.rs}`, `packages/git/rust/src/{wal.rs,driver.rs}` inline. **Delete**: `remote.rs::transfer_url`, Publication's `remote_url`, the second scheme ladder, Publication's inlined transfer argv. **Tests to retire**: none (the `remote.rs:659` unit test moves with the door; owner unchanged).

Not touched: `packages/git/contracts/mutation-census.v1.json` (big lead regenerates).

## Steps

1. Slice A test → fix → `node` one-file run → commit `fix(dispatch): keep the herdr socket when the server's state is unknown`.
2. Slice B: door function and scp grammar → Remote and sequence callers → `mint.rs` → phase 1's RT01/F-7/CF07 tests green → commit `fix(git): one remote door reads the configured URL and accepts scp-form ssh origins`. IDENT told on the board before the merge.
3. Slice C tests → compaction calls and replay → commit `fix(git): compact finished worktree and ref chains beyond the recent few`.
4. OPC review of slices B and C (`forgent-35`), verdict in the report.
5. Re-measure F-C1 on this machine's checkout with the speed seat's read-only `scan-bench.mjs` shape (`inspectGit` p50 at 322 chains was 28.5 ms) after one compaction pass on a **copy** of the WAL (never the live checkout); report.

## Verification (exact)

```sh
export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/t2-p02-target
cargo test -p fgos-git --test sequence --test refs_remote --test publication --test worktree --test repository_config --test land_crash_matrix --test recovery_matrix
cargo test -p fgos-git --lib
cargo test -p fgos-identity
cargo test -p fgos-event-store
cargo clippy -p fgos-git -p fgos-identity --all-targets -- -D warnings
```

Node (one-file command, plan.md): `test/runner/dispatch-worker-session-boot.test.mjs test/git/remote.test.mjs test/git/refs.test.mjs test/git/worktree.test.mjs test/runner/worktree-admin-multiprocess.test.mjs`.

`rg -n "remote-protocol-not-supported" packages/git/rust/src` → one ladder. `rg -n "fn transfer_url|fn transfer_call" packages/git/rust/src` → nothing.

## Net size

Node +10 (`serverAnswers` tri-state and the double probe). Rust +20 (−30 the second read/ladder and inlined argv; +25 grammar and `redact` rule; +10 `sequence_home` result and both mint callers; +15 shared release-and-compact helper and compacted replay). Tests +60.

## Test-cost line

Added ≈ 4 cases (2 Node boot, 1 worktree, 1 refs replay), extended 1; retired 0; no new CLI/host spawn.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| A repository whose Event Store provenance holds `ssh://[redacted]@…` sees `remote URL changed; rerun setup` once | L × L | Those origins were already refused by Publication; the message names the fix; CHANGELOG line |
| scp grammar admits a helper (`ext::`), an option or a local path | M × H | `::`, leading `-` (user or host, both forms), brackets, whitespace and controls refused by the door; host charset; unit cases above |
| `release_sequence` now refuses on a home error | L × M | Typed refusal naming the unreturned number; test; previously it silently gave back to the wrong (local) home |
| `sequence_home` refusal now blocks a clone whose origin is unreachable but readable | L × M | Unchanged: a readable origin was already `Remote`; only unreadable and unsupported origins change, both from silent-local/late to named early refusal |
| Compaction in the add path adds fsyncs (ledger install) | M × M | Amortised to ≈ one compaction per add at steady state; R2 re-measure in phase 17 compares add p50 (184 ms) and the 322-chain scan; if a fresh-repo add regresses by more than 3 fsyncs (≈ 16 ms), the lead compacts at admission instead (Publication's site) and reports |
| Old release replays a compacted Refs id | L × M | Answers `operation-recovery-required` (fail-closed); the 4 newest stay whole |

## Rollback

Revert the three commits on the track branch (each slice alone). Compacted ledger entries written by tests only; on a machine, see plan.md Rollback (old releases read v2 receipts).

## Done when

Phase 1's RT01, F-7 and CF07 tests green; CF01 Node cases green; compaction cases green; crash matrices green; OPC verdict recorded; the re-measure figure in the report.
