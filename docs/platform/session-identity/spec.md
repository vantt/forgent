# Session Identity Component Specification

```txt
Document type: BA-grade area specification
Audience: Human reviewer, maintainer, implementation agent
Purpose: Define the single authority for "who is the writer of this process"
Design status: Accepted
Implementation status: Implemented (activation pending)
Canonical: Yes
Owner: Session Identity component
Source: packages/session-identity/rust
Contracts: packages/session-identity/contracts/
Last reviewed: 2026-10-15
Related:
- docs/io-contract.md
- docs/platform/component-boundary.md
- docs/specs/observe.md
- plans/261015-2102-identity-resolver-rust-crate/plan.md
```

## 1. Purpose

Session Identity answers one question for the calling process: which writer is it, and how far can that id be trusted. The answer is `{id, source}`, recorded as `writer` on every state write ([io-contract](../../io-contract.md)) and used to recognize a claim's owner.

It is attribution, not authentication. Lock authority does not come from this id.

## 2. Ownership boundary

| Owns | Does not own |
|---|---|
| The order and validity rule for env session ids | Minting worker ids, scrubbing env, lineage (run supervisor) |
| Confirming an env id against `<fgosDir>/sessions.json` (read only; an unreadable file means "not confirmed") | Writing `sessions.json` (`src/runner/session.mjs`) |
| The process-tree rule: highest ancestor with a terminal, else session id, else caller pid | Liveness, start time, boot id (process facts) |
| The read-only native verb `fgos identity` | Lock or claim-settle authority |
| The contract and the shared vectors | Observe shard file names (Observe derives them from `{id, source}`) |

There is one implementation: the Rust crate `fgos-session-identity`. Observe calls it in process. Node calls it through the facade `src/util/session-identity.mjs`, which decides nothing about the id.

## 3. The rule

1. **Env.** `FGOS_SESSION_ID`, then `CODEX_THREAD_ID`, then `CLAUDE_CODE_SESSION_ID`. A value counts when, trimmed, it is non-empty, at most 200 characters and matches `^[A-Za-z0-9._-]+$`; otherwise the next variable is tried. The first usable value is the id; `source` is `registry` when `sessions.json` lists it, else `env`.
2. **Terminal root (Linux).** Walk from the caller (included) up through `/proc/<pid>/stat`. The id is the **highest** ancestor whose controlling terminal is set; `source: pid`.
3. **Session.** No terminal anywhere above: the caller's session id; `source: pid`.
4. **Unresolved.** Nothing readable (Windows, `/proc` hidden, caller gone): the caller's own pid; `source: unresolved`.

No step counts hops, so wrapper layers between a caller and its terminal never change the answer. Other unix systems skip step 2 (session id from `getsid`).

The rule lives in `packages/session-identity/rust/src/resolve.rs`; the OS is read only through the `ProcessTree` port (`proc_tree.rs`). The vectors in `session-identity.golden.v1.json` are run by cargo and, for the env cases, by the Node facade through the real binary.

## 4. Verb and contract

`fgos identity [--pid <n>] [--fgos-dir <dir>]` — native route `session-identity.resolve`, host kind `cli`, effect read, runs under `FGOS_RUST_HOST_RECURSION_GUARD`. `--pid` defaults to the process that started `fgos` (unix) or `fgos` itself (Windows). `--fgos-dir` absent skips registry confirmation. Bad options exit non-zero with no envelope. The answer is the standard `fgos.v1` envelope with `data = {id, source}`; `id` is a string for `registry`/`env` and a positive integer for `pid`/`unresolved`.

## 5. Node facade

`resolveWriterIdentity(fgosDir)`:

- Finds the host binary by `src/util/host-bin-path.mjs`: `FGOS_HOST_BIN`, then the activation next to `fgosDir`, then the nearest activation above the cwd. The activation rule is the fgctl shim's (`<releasePath>/bin/fgos`, executable, inside the release).
- Runs `fgos identity --pid <own pid>` directly (no shim, no `invokeHost`), with a 2000 ms kill deadline; the child is killed and reaped before the facade returns.
- Caches per process: `pid`/`unresolved` answers by the session env alone; `env`/`registry` answers by session env and fgos dir. Failures are never cached.
- Never runs the binary while the process holds `events.lock` or `claims.lock`: both lock helpers resolve before locking, and `probeIdentity` refuses (`identity-in-lock`) while either is held.

Errors (`WriterIdentityError`, category `precondition`, exit 2): `host-missing`, `host-version-mismatch` (the active release has no `identity` verb), `timeout`, `host-error`, `bad-output`, `identity-in-lock`. A verb that writes state fails before writing. `unresolved` is a valid answer and blocks nothing.

## 6. Known limits

- A terminal or IDE started from a shell without a new session: its terminals share the launching shell's id.
- Subagents of one Claude session share `CLAUDE_CODE_SESSION_ID`.
- Containers in different pid namespaces sharing one `.fgos` can collide on pid ids.
- A self-hosted CI runner whose jobs share one session shares one id.
- A `nohup` process outliving its pane falls to its session id.
- Env ids leak: a process started from a Codex shell carries `CODEX_THREAD_ID`, which now outranks `CLAUDE_CODE_SESSION_ID`.
- `FGOS_HOST_BIN` is inherited: children use their parent's host binary.
- A pane root pid can be reused after the pane closes.
- The `/proc` reader here and the one in `packages/observe/rust/src/store_lock.rs` are two adapters; both move into the process-facts component when it exists.

## 7. Doctor

`writer-identity-resolvable` asks both doors' binaries directly (no cache): the running host and the activation a plain `git commit` hook uses. An older activated release shows as `host-version-mismatch`.

## 8. Decision history

- 2026-10-15 — Writer identity moves from `src/util/session-identity.mjs` into this crate as the single authority; Observe's own copies (`shard.rs`, `friction.rs`) are removed; no Node fallback when the binary is missing. Env order adds `CODEX_THREAD_ID`; the 3-hop pid walk becomes "highest ancestor with a terminal, else session id". Evidence and reviews: [plan](../../../plans/261015-2102-identity-resolver-rust-crate/plan.md), [S6](../../../plans/reports/spike-s6-261015-1638-rust-identity-call-latency-pre-commit-hook.md), [S7](../../../plans/reports/spike-s7-261015-1859-human-opened-pane-identity-observation.md).
