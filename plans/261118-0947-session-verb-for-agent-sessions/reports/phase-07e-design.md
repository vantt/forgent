# Phase 7e design: one Identity record per session, found by any identifier

Read-only design against origin/main (2026-11-19), using post-phase-5 names (`fgos session`, socket verbs
`session <x>`; `head bind session` becomes `session bind session`). Written by a design agent; lead decisions at the end.

## 0. Prior art (`git log -S`)

| Searched | Found | Removed / intended? |
|---|---|---|
| `Entry` fields | Only `e7000adca` (directory created); later changes are behaviour (`388f01c20`, `da1a7ad66`, `771c44ce8`, `90757718a`, `41d1fbdfb`). | The record never had pane, socket, mailbox or generation fields. Nothing retired. |
| `aliases` | `e7000adca` (role aliases), `f411dbf18` (mailbox delivers an alias only to the head Identity resolved). | Live; mailbox aliases go through `directory::resolve`. |
| `herdr` / `pane` in identity | Only rename/diff text. | No pane field ever existed. |
| `.fgos/sessions.json` | `b7486e847` removed `REGISTRY_FILE`, `Source::Registry`, `registry_confirms`; `1abeaaf77`, `56f8af848` removed readers. | Intended (phase 4). Not reintroduced. |
| Mailbox `Binding.handle` | `12dbdee98`; only ever holds the Codex thread id (`drain.rs:272-283`). Claude's `find_head` sets `None`; the nudge reads `messagingSocketPath` fresh (`nudge.rs:162-170`). | Redundant; this phase drops it. |

Precedent for additive fields without a version bump: pins stay `v: 1` (identity spec §5a).

## 1. The record

`Entry` (`packages/identity/rust/src/directory.rs:55-71`) keeps every field and `v: 1`. `FORMAT_VERSION` is not
bumped: `scan`/`read_named` filter `entry.v == FORMAT_VERSION`, so `v: 2` would hide entries from older builds and
break rollback. New optional field:

```
ids?: { v: 1, updatedAt,
  cliSession?: { source, id, name?, nameSource?, socket?, pid?, startTime? },
  terminal?:   { driver: "herdr", key?, paneId, tabId?, workspaceId? },
  mailbox?:    { fgosDir, name },
  head?:       { persona, name, gen } }
```

- All groups `#[serde(default, skip_serializing_if = "Option::is_none")]`; older builds ignore `ids` (and drop it if
  they rewrite; the next owner refills it).
- Merge rule (`refresh_from` ~369, new `merge_ids`): a write carries only its writer's groups; each replaces the held
  group whole; other groups are kept; nothing accumulates.
- The herdr tab label is not stored (resolved live, §2 step 6).

| Event | Writer (door) | Groups |
|---|---|---|
| Supervised head starts | Supervisor `register_session` (`terminal.rs:927`) via `register_writer` | `terminal` (slot key + tab/pane ids), `head` (persona/name from `session.role`, `gen` from the envelope) |
| Agent bound to its attempt (first bind and `/clear` rebind) | `bind_agent_session_in` (~710) from `identity_bind` (`head_request.rs:428`) | moves `terminal`+`head` with the roles; `cliSession` read by the supervisor from `<config>/sessions/<agent pid>.json`; `mailbox` from a new optional bind argument |
| Unconfined session registers | `register_current` (~515) / `register_writer` from the mailbox hook | `terminal` from `HERDR_*` env, `cliSession`, `mailbox` |
| Unconfined `/clear` | mailbox hook via `register_writer` | same; extends "one current binding per head" to this path |
| Rotation | successor's own `register_session`; `session answered` → `register_attempt_roles` | only the role moves; each generation is its own record |
| Refresh on change (`/rename`, new socket, pane moved) | new `directory::refresh_ids` (read, id check, merge, store under lock); confined heads via `session bind session` again | `cliSession`, `terminal`, `mailbox` |

Refresh trigger (`mailbox_hook.rs` ~161-189, `ensure_identity` ~210): on a new binding and on Stop; compare fresh
facts with stored `ids`; write only on difference.

## 2. The single resolver

`directory::resolve(root, query, judge, shared, terminal_port)` replaces today's function (~936); same callers
(provider ~522, mailbox address, `identity_holds`). Exact matching only:

1. starts with `/`: `cliSession.socket`;
2. `<machine-id>/<local>`: full id (incl. remote);
3. role prefix (`lead:`, `work:`, `head:`): roles;
4. all digits: `liveness.pid` or `cliSession.pid`;
5. else any of `handle`, `cliSession.id`, `cliSession.name`, `terminal.paneId`, `terminal.tabId`, `terminal.key`, `mailbox.name`;
6. no hit: injected `terminal_port` maps a herdr tab label to tab ids live, retry 5;
7. still nothing: shared view by handle, role or full id only.

Answers: one hit `Ok`; several `ambiguous` with each candidate's matched field; a hit only through `cliSession` whose
pid is dead while the entry lives is dropped, and if only such remain, refuse `stale` (the ENOENT case; mailbox maps it
to `unknown-name` with that detail). Output `Listed` gains `ids`, `matched`, `stale: [group]`.

## 3. Readers

- Mailbox `--to` (`mailbox_identity.rs:195-279`): `resolve(to)` then `cliSession.id == HeadView.key`, fallback
  `mailbox.name`. Order: exact short name, exact key, Identity exact (any identifier), then unique prefixes.
- Registration check (`ensure_registered_via` ~148): `read_named` by own handle, passes `ids`.
- Sender label: `HandleOf` → `SenderOf -> {handle, role}` read at render (`drain.rs:209`, `render_reply` 365-382);
  `MailFrom` gains `role` (render only); `frame.v1.txt:37` adds `role="{{role}}"`.
- Head path: `identityHolder` (`head-start.mjs:62-77`) returns the record; fronting (~215) and `beside`
  (`rotate.mjs:330`) read `record.ids.terminal.key`; `placement.json` stays lineage state only.
- Mailbox snapshot drops `Binding.handle` (`registry.rs:42`, `HandleTooLong`, writes ~227/254); `Binding` is
  `deny_unknown_fields`, so old snapshots with `handle` still parse (`#[serde(default, skip_serializing)]` or a
  snapshot version bump).

## 4. Files, tests, contracts

Rust: identity `directory.rs` (Entry, Listed, refresh_from, register*, bind_agent_session_in,
register_attempt_roles, drop_role, resolve, new refresh_ids), `provider.rs` (101, 522-535); run-supervisor
`supervise/terminal.rs` (SessionPlan 94, session_plan 158, register_session 927), `head_request.rs` (identity_bind
428); apps `mailbox_identity.rs`, `mailbox_hook.rs`; mailbox `claude_head.rs` 60-82, `drain.rs`, core `registry.rs`,
`delivery.rs` 285, `frame.rs` ~221.
Node (thin): `session-attempt.mjs:126` (gen), `head-start.mjs` 62-77/215, `rotate.mjs:330`, `command-registry.mjs`
resolve help (regenerate manifest/routes).
Contracts: `identity.read.v1.json`, `identity.write.v1.json`, `head-request.v1.json` (bind args), `envelope.v3.json`
+ digest vectors (`session.gen`), `frame.v1.txt`, `lock-registry.v1.json` (new `identity-directory` machine mutex,
rank 80). Specs: identity §5/§6, mailbox §5.1/§5.1.1/§6.4, session-host §8.1/§8.4/§8.7.
Tests: identity `tests/directory.rs` (per-group write/replace/keep, resolve by each identifier, ambiguous, stale,
old v1 file reads, refresh racing a role take loses no role, bind moves terminal+head), `register_current.rs`
(HERDR_* captured); run-supervisor `tests/head_request.rs`, `supervise_terminal_fake_herdr.rs`; mailbox core
`frame.rs`, `snapshot.rs`; wiring `apps/fgos/tests/mailbox_routes.rs` (sender shows `head:secretary-miu`,
`--to <pane id>` arrives), `test/session-rotation/rotate.test.mjs` (successor gen N+1 + role),
`test/session-host/head-start.test.mjs` (fronting from the record); cost check `mailbox-ident-cost.rs`.

## 5. Risks

- Concurrent read-modify-write of entries (existing role moves + new hook refresh): new `identity-directory`
  machine mutex around every rewrite of an existing entry; create-once and reads stay lock-free; the hook takes it
  only after the mailbox lock is released, short wait, skip on busy (next trigger retries); confined heads write via
  their supervisor.
- Hot path: steady tool calls read nothing new; Stop/new-binding add one small file read; writes only on change;
  non-handle resolve scans ≤1024 files only on `resolve`/`send`.
- Staleness: separate `cliSession.pid` check and `stale` answer; reused pane ids caught by dead liveness pid.
- Cross-machine: local identifiers never published; remote resolve stays handle/role/full id; spec says so.
- Mixed builds: an older build may drop `ids` until the owner rewrites it (accepted; matches rollback).

## Lead decisions (2026-11-19)

1. `gen` goes in the envelope (`session.gen`, set where the session attempt is built; digest vectors regenerated):
   the supervisor owns it, so a head cannot report a wrong generation.
2. Mailbox `--to` order: exact short name, exact key, Identity exact (any identifier), then unique prefixes —
   exact answers always beat prefixes.
