# Identity Component Specification

```txt
Document type: BA-grade area specification (draft)
Audience: Owner, maintainer, implementation agent
Purpose: One authority that mints and resolves the identities of machines, projects, clones and agent sessions, globally unique across machines and independent of any one project
Design status: G0 signed 2026-10-22 for rungs I1-I4; I5 (authenticity mechanism) open
Implementation status: Rungs I1 (project id), I2 (machine id and handle), I3a (session full id and handle), I3b (local directory, role aliases, resolve, list) and the mint door implemented; I4 and later not started
Canonical: Yes for rungs I1-I4 (G0 signed 2026-10-22, section 10)
Owner: Identity component (proposed)
Source: packages/identity/rust
Contracts: packages/identity/contracts/
Related:
- docs/io-contract.md (writer id recorded on every state write)
- docs/specs/observe.md
- plans/261015-2102-identity-resolver-rust-crate/plan.md (origin of the local-session resolver)
- docs/platform/event-store/spec.md section 5 (machine id, store id) and section 14 (sharing through git)
- docs/platform/agent-mailbox/spec.md section 5.1 (addresses) and section 15.2 (cross-machine delivery)
- docs/platform/convention/spec.md (format rules for names and paths)
- plans/261017-1313-fgos-platform-program-board/plan.md (lane IDENT)
```

## 1. Purpose

fgOS runs on several machines and in several projects at once. Its lanes coordinate through Git: the program board, its log and reports. Agents on different machines already need to name each other, and agents and humans need to name machines and projects. Today they do so with names nobody minted for that purpose, so the names are ambiguous and drift.

This component answers four questions with one authority. Every answer is globally unique without a central server, stable over time, and readable by a human:

1. **Which machine is this?**
2. **Which project is this, whatever its directory is called?**
3. **Which agent session is this, and on which machine?**
4. **How does one agent address another**, on the same machine or on another one, so that the address resolves to exactly one live session or to a clear "not found"?

A fifth question, **is this message really from who it claims**, is in scope as a later rung (section 7). The first rungs give attribution only, like Session Identity today.

It also answers a sixth question for every other owner: **which id does this new record get**, so that work items, decisions, backlog rows, run and claim ids never collide across machines (section 4a). The record stays with its owner; only the id comes from here.

**Not this component.** The word "identity" has other owners in fgOS, and they keep them:

| Term | Owner |
|---|---|
| Process identity (pid, boot id, start time, liveness) | Process (`fgos_process::facts`) |
| Git author and committer identity (`user.name`, `user.email`) | Git |
| Event Store store identity (`store.json`) | Event Store; the store id itself is minted here |
| Release and activation identity (hashes) | Distribution |

## 2. Problem, with evidence (2026-10-22)

| Symptom | Evidence |
|---|---|
| Agents name sessions by Claude Code's automatic names, which are per machine and collide in shape | This session is `forgent-0b` on the owner's machine. The HARDEN lead is `forgent-a8` on the second machine. Both machines check out the same repo at the same path `~/projects/forgent`, so the `forgent-` prefix tells nothing about the machine |
| Machines are named in prose | The board says "máy owner", "máy thứ hai" and "`fg-server2`" for machines. No row carries a machine id |
| One agent is named by four different handles | A board row names one lead as "phiên `forgent-a8` (máy thứ hai, `~/projects/forgent`, fgOS writer `8e8e56bb…`, herdr pane `w6:pDG`)" |
| Projects are identified by directory name | Mailbox names are `<project>-<cli>-<2 characters>`, where `<project>` is the folder name (agent-mailbox spec section 5.1.1). Two clones of one project with different folder names get different names, and two different projects with the same folder name collide |
| The writer id is not an address | Session Identity resolves `{id, source}` from env variables or a pid. A pid-based id means nothing on another machine, and an env id can be set by anyone (its spec: "attribution, not authentication") |
| No sender authenticity across machines | Anyone who can push to the repository can write any name into the board or into Event Store refs |

## 3. What already exists (reuse, do not rebuild)

| Identity | Today's owner | Form | Scope | Gap for this component |
|---|---|---|---|---|
| Machine id | Identity (`packages/identity/rust/src/machine.rs`; minted by `fgos doctor --fix`; Event Store reads it through the crate) | `<hostname-slug>-<6 random base32>` in `<stateRoot>/machine-id`; overridable per clone by git config `fgos.machineId` | user level, not per project | Moved here (rung I2). The per-clone override stays Event Store's own ref-name rule, so "machine id" for a ref can still differ between clones on one machine |
| Store id | Event Store | random 128-bit, `store.json` in the clone | one per clone | Fits as the clone id; no human short form |
| Writer id | Identity, local session (section 7a; `packages/identity/rust`) | env id (`FGOS_SESSION_ID`, `CODEX_THREAD_ID`, `PI_SESSION_ID`, `CLAUDE_CODE_SESSION_ID`), else a pid, else unresolved | one process tree on one machine | Not qualified by machine. Not an address. Known limits in its section 6 (shared subagent ids, Codex daemon, pid reuse) |
| Attempt writer id | Identity, local session (`att-<attemptId>`) | pure function of the attempt id | one runner attempt | Fits as the id of a runner worker; not addressable |
| Mailbox address | Agent Mailbox (V1 core, branch `mailbox/v1-v3`) | `<project>-<cli>-<2 characters>`, generation per process | one project on one machine | Depends on the folder name; local only |
| Workspace id | Distribution (`packages/distribution/rust/src/workspace.rs`) | first 16 hex of `sha256(realpath(workspace root))` | one checkout path on one machine | Derived from a path: two machines with the same checkout path (`~/projects/forgent` on both today) get the same id, and moving a folder changes it. Usable only as a local key, never as a project or clone id |
| Project id | nobody | — | — | **Missing** |
| Agent display names | Claude Code (`forgent-0b`), herdr panes (`w6:pDG`) | tool-specific | one tool on one machine | Not fgOS-owned; useful only as aliases |

## 4. Identities (proposed model)

Every identity has a **full id** that machines use and never changes, and a **short handle** for humans that is unique within its context. Both are minted offline, without a server.

| Identity | Full id (proposal) | Short handle | Minted | Lives in |
|---|---|---|---|---|
| Machine | today's machine id, unchanged format | the alias when set (`owner-laptop`), else the id without its last `-<6>` suffix (`fg-server`), `m-` prefixed when it starts with a digit, at most 40 characters; Convention kind `machine-handle` | once per machine by `fgos doctor --fix` (fix `identity-machine-id`); never replaced | `<stateRoot>/machine-id` and `machine-alias` (`~/.local/state/fgos` by default, holder-lock's state root) |
| Project | random 128-bit, minted once per project | a slug chosen at mint time, for example `forgent` | once, by an explicit `fgos identity project --init` on one machine (never by setup or doctor, which would mint one id per clone) | a tracked file in the repository, so every clone on every machine reads the same id |
| Clone | today's store id | `<project-handle>@<machine-handle>` | once per clone | the clone |
| Session (agent head) | `<machine-id>/<local session id>`, where the local id comes from the writer-id rule (section 7a); a pid-sourced local id is `pid-<24 hex>` of sha256(boot id, pid, start time) | `<cli>-<4 base32 characters>@<machine-handle>`; the CLI is `claude` (`CLAUDE_CODE_SESSION_ID`), `codex` (`CODEX_THREAD_ID`), `pi` or `omp` (`PI_SESSION_ID`, which both export; the label is read from the process ancestry, section 7a L3), `worker` (`FGOS_SESSION_ID` starting `att-`), `fgos` (any other `FGOS_SESSION_ID`) or `shell` (pid); the suffix is the first 4 characters of lowercase base32 of sha256(local id) and never lengthens; a caller that cannot be told from any other has no handle | computed on every read (implemented, rung I3a); registered only by an explicit `fgos identity session --register` (implemented, rung I3b) | the machine's session directory (section 5) |
| Role alias (optional) | — | for example `lead:MAIL`, `lead:HARDEN` | when a human or a lead assigns a role | the session directory; `lead:<LANE>` (Convention kind `lane-id`) resolves to the live session holding the role |

Rules:

1. **No identity is derived from a directory name, hostname alone or a tool's display name.** These may appear in a short handle or alias, never as the full id.
2. **Identities are independent of one project.** Machine and session ids are minted at user level, so one session can be found from any project on that machine. The project id travels with the repository, not with the machine.
3. **One authority per identity.** Event Store keeps using the machine id and store id but no longer mints them. Session Identity remains the resolver of "which local session is this process" (open question 1 decides whether it becomes part of this component).
4. **Short handles are resolved, never trusted.** A handle resolves through the directory to exactly one full id, or the call fails with "ambiguous" or "not found" and lists the candidates.
5. **Formats are Convention kinds.** The textual shapes (id syntax, handle syntax) are registered with Convention so that every caller checks them the same way.

## 4a. Minting ids for every owner (settled 2026-10-22)

Three rules, no daemon, no server of its own, almost no garbage:

1. **Random ids** (work items, backlog rows, project id, run, claim and reservation ids): `<prefix>-<10 lowercase base32 characters>`, 50 random bits, no state and no coordination. A kind that must sort by time puts a time part before the random part. An id is never derived from a title or another content field, because two machines with the same content would get the same id.
2. **Machine-scoped ids** (machine-local things such as sessions): `<machine-id>/<local id>`, unique by construction once machine ids are.
3. **Sequential ids** (`D-ADR####`, decision file numbers): the format is not changed, no temporary id, no suffix, no renumbering. Each sequence kind has one counter ref on the project's remote, `refs/fgos/seq/<kind>`, pointing at one commit with no parent whose message is the last number claimed. To claim, read the ref, add one, create a new parentless commit and push it with `--force-with-lease=<ref>:<old sha>` (`<ref>:` when the ref does not exist yet); the forge accepts it only if nobody claimed in between, and a refused claimer fetches and tries the next number. A number is claimed right before the commit that uses it; if that commit fails and nobody claimed after, the ref is pushed back with the same lease. Without a network the claim fails and the writer retries; the format is never changed to work around it. A repository with no remote claims against its local ref.

Garbage: one ref and one commit of about 200 bytes per sequence kind on the remote; each claim replaces the previous commit. Evidence: probe on `github.com/vantt/forgent` (`plans/reports/research-261022-1217-identity-sequence-counter-ref-github-probe.md`): a race of two claims accepted exactly one, the loser's retry got the next number, a stale lease was refused, one claim costs about 2.5-3 s. When GitHub removes replaced commits is not observable.

Pushes and ref writes go through the Git component, like every other git mutation (`sequence_tip` and `sequence_push`, `packages/git/rust/src/sequence.rs`). **A claim commit carries a random claimant as its author name** (found by the first race test, 2026-10-22): two claims of the same number from the same tip within one second would otherwise build byte-identical commits (same empty tree, same message, same second), and pushing the second is a no-op the forge accepts, so both claimers would believe they own the number.

**Implemented (2026-10-22).** `fgos identity mint <kind> [--json]`, operation `identity.write`: `work` gives `tsk-<10 base32>`, `backlog` gives `p-<10 base32>`, `d-adr` gives `D-ADR####`, `decision-file` gives `####`. A sequence claim is one more than the larger of the counter and the highest number the repository's own documents already carry (`D-ADR####` in a heading of `docs/specs/*.md` or `docs/platform-foundations.md`, the `NNNN-` prefix of a file in `docs/decisions/`), so the first claim on an existing project starts after what is already written; it retries a refused lease up to 5 times (`sequence-contended` after that) and, without a reachable remote, refuses with `sequence-unreachable` and claims nothing. `mint d-adr|decision-file --release <number>` gives a number back only while it is still the counter's tip. Library: `fgos_identity::mint::{random, claim_sequence, claim_counter, release_sequence}`. Convention registers the identifier kinds `work-item-id` and `backlog-id`; the prefix and length of each kind live in the crate. Node mints random work ids in process through the native addon (`sessionIdentity.mintRandom`, `src/util/identity-mint.mjs`), with no exec and so no lock rule; sequence kinds stay CLI-only because no Node caller needs them: `fgos add` and `fgos submit` without `--id`, the runner's discovered work and `promote-to-component` mint a work id before they write. The decision-id renumbering at merge (`nextFreeDecisionId`, `renumberDecisionText` and the decision-index collision resolution in `src/runner/merge.mjs`) is deleted. Safety net: doctor row `identity-ids-unique` fails on a repeated backlog id, a `D-ADR` number headed with two different titles or a repeated decision file number. Run ids, claim ids, reservation ids and operation ids stay with their owners (machine-local records, not changed).

## 5. Directory and resolution across machines

- **Local directory (implemented, rung I3b).** Each machine keeps the sessions registered on it, one file per session under `<stateRoot>/identity/sessions/` (user level, so every project on the machine sees it; not `.fgos/sessions.json`, which is the worktree session registry): full id, short handle, CLI, project id when the working directory is in a project with an id, the working directory it registered from, registration time, role aliases, and the liveness record. **Registration is explicit only**: `fgos identity session --register`, or `--role lead:<LANE> [--take]` which implies it (operation `identity.write`); the bare verb, `identity session` without flags, hooks and workers never write, so they add no entries. **Liveness** is the process facts (`fgos_process::facts::Record`) of the agent head, the highest ancestor of the caller holding a terminal (the same walk as the writer-id rule), never the transient `fgos` child that registered it; a session with no terminal ancestor records none and reads as `unknown`, which resolves but is never proven dead. A dead head is never resolved or listed, and every write first removes the dead entries. At 512 entries a write is refused (`directory-full`) and `fgos identity list --prune` removes the entries proven dead, the same rule as the prune on every write; an entry whose liveness is `unknown` may be a live session (a headless agent has no terminal ancestor) and is never removed, so one agent cannot erase another's registration. A second live session whose handle equals a registered live handle is refused (`handle-in-use`, naming both full ids; handles never change); the file name is derived from the handle, so racing registrations of one handle are settled by the atomic create, with no lock. A role held by another live session is refused (`role-held`) unless `--take` moves it. `fgos identity session --drop-role lead:<LANE>` (operation `identity.write`) removes that role from the calling session's own entry and from no other session (library: `directory::drop_role`, `drop_current_role`); a role the session does not hold is refused `role-not-held` (the roles it holds are the candidates), a session with no entry `not-registered`, and afterwards `resolve lead:<LANE>` is `not-found` unless another session holds it. A role of another live session can only move through `--take`. A file this build cannot read (another format version) is never touched, and counts toward the cap. Any process of the same OS user can register or `--take` a role, because the trust boundary is the OS user; a consumer that needs a stronger hold keeps its own check (the mailbox delivers only to a head that its project record holds).
- **In-process doors (implemented).** A Rust caller that is not the CLI (the mailbox hook on the first tool call of an agent head) uses the library, behind the crate's `directory` feature (no host runtime; the `provider` feature is only the CLI verb): `current::current_session(state_root, caller_pid, fgos_dir)` answers who this process is (`info.id`, `info.handle`) from one small file and `/proc`, and `directory::resolve(state_root, <handle>, &judge_here)` is the cheap read of an entry; `directory::register_current(state_root, caller_pid, fgos_dir, clone_dir, roles, take)` is exactly what `identity session --register` runs (no network, no lock, one durable write, a directory scan bounded by 512 files). A hook whose process env lacks the session id (a Codex hook has no `CODEX_THREAD_ID`) reads the id from its payload and passes the raw key: `WriterKey {source, value}` (`source` is one of the writer-id rule's env variable names, `value` the id). `current::session_for(state_root, &key, head_pid)` (`head_pid: Option<u32>`, the process a shared variable's CLI label is read from; the other keys ignore it) answers the session (`info.id`, `info.handle`, `local.cli`) by the same validity rule and CLI mapping as the env path, and `directory::register_writer(state_root, clone_dir, &key, head_pid, roles, take)` registers it, reading the head's process facts itself from `head_pid`; both share their bodies with the env path, so Identity stays the only authority deriving full ids, handles and liveness. Refusals: `invalid-writer-key` (the source is not one of the rule's env variables, or the value is not a usable id), `head-not-live` (`head_pid` cannot be read or is not running), plus `machine-id-missing` and the registration refusals above. Measured in process (release build, 10 other entries): resolving the own handle about 0.07-0.15 ms, registering about 0.1-0.9 ms (the larger figure with a project id read from a real repository), so a 50 ms budget leaves wide room. A `Refusal` carries `reason`, `detail` and `candidates` (the names for `not-found`, the sessions for `ambiguous`; empty otherwise).
- **Refusals as data (implemented).** A refusal is exit 65 with `fgos: error: <message> [<reason>]` on stderr, for people. When the caller passes `--json` the same refusal is also one line of JSON on stdout, for agents: `error` (the message), `reason` (the stable code) and `candidates` (the sessions it concerns, each `{id, handle, liveness}` with `liveness` `alive` or `unknown`, `[]` when none: for `not-found` the live sessions whose handle or role contains the query, for `ambiguous` the sessions the name matches, for `role-not-held` the live sessions that do hold the role), the same fields as the crate's typed `Refusal`. It has no `contract` key: `docs/io-contract.md` keeps the error path out of the `fgos.v1` success envelope (a caller tells success from failure by the exit code, and a real envelope by `contract === "fgos.v1"`), and the only earlier stdout failure shape (`dispatch decide`, `{error, errorClass}`) is not enveloped either. Declared as `definitions.refusal` in `identity.read.v1.json` and `identity.write.v1.json`. Example, `fgos identity resolve claude-4f --json`, exit 65:

  ```json
  {"error":"no live session is named \"claude-4f\"; candidates: claude-4f2a@fg-server","reason":"not-found","candidates":[{"id":"fg-server-abc234/0f0e0d0c","handle":"claude-4f2a@fg-server","liveness":"alive"}]}
  ```

  When the shared directory arrives (rung I4), candidates and resolve entries gain an optional `machine` (`{id, handle}`) and `fetchedAt`, and `liveness` a third value `remote` (an entry of another machine, whose liveness is not proven). Not implemented yet; callers must ignore unknown fields and treat any value other than `alive` as unproven.

- **Shared directory.** A machine publishes the entries of its projects through the Event Store, on its own `refs/fgos/events/<machine-id>`, as a registered identity event type. Another machine sees them after its next fetch. This reuses Event Store transport (its section 14); it adds no server and no daemon.
- **Freshness.** A remote entry is as fresh as the last fetch (Event Store sync interval). The resolver reports the age of what it read. It never claims that a remote session is alive.
- **Verbs (owner-approved 2026-10-22).** Each identity has its own read: `fgos identity machine`, `fgos identity project`, `fgos identity session`, each with `--json`, returning the full id, the handle, the source the id was read from, and aliases. `machine` is implemented: `{id, handle, alias}`, read-only (operation `identity.read`), exit 65 with reason `machine-id-missing` when no id was minted; `session` is implemented: `{id, handle}` with the full id `<machine-id>/<local id>` (operation `identity.read`), exit 65 with reason `machine-id-missing` or `unresolved` (no handle exists for a caller that cannot be told from any other). `project` is implemented: `{id, handle, createdAt}` read from the tracked file `.fgos/project.json` of the trusted main checkout (so a linked worktree answers with the main checkout's file), exit 65 with reason `project-id-missing` or `project-id-unreadable`. `machine --alias <name>` is a write (operation `identity.write`, the name must follow the Convention `machine-handle` kind, an alias that does not is ignored when read). `project --init [--handle <name>]` is the other write (operation `identity.write`): it mints only on the main checkout and refuses when the file exists (`project-id-exists`), in a linked worktree (`linked-worktree`), or when the remote default branch, as last fetched, already tracks the file (`project-id-on-remote`, read through the Git component); it prints the commit command and never commits. `project --new` mints a different id on purpose (a fork split) and skips the exists and remote checks. The handle follows the Convention `project-handle` kind and defaults to the slug of the folder name at mint time only. The file is `{"v":1,"projectId":"<32 hex>","handle":"<slug>","createdAt":"<iso>"}`; it is not ignored, passes the pre-commit root allowlist and the `.fgos` strip rules unchanged, and worker branches never write it because the write refuses in a worktree. Bare `fgos identity` is also `fgos identity writer`, operation `identity.writer`, contract `1.1.0`: the answer stays `{id, source}` and adds the optional `machine` (`{id, handle}`) and `session` (`{id, handle}`), each `null` when unknown (no machine id minted, or an unresolved caller); the bare verb never writes and never fails on a missing machine id, because the pre-commit hook and the doctor row read it. The crate exports the same reads (`machine()`, `project(repo)`, `session()`) so Node, through the addon, and Rust call them in process. Bare `fgos identity` keeps its current answer (the writer id) and adds the three ids, so doctor, the pre-commit hook and people change nothing. Resolution (implemented for the local directory): `fgos identity resolve <handle|lead:<LANE>|full id>` returns exactly one live session (`id`, `handle`, `cli`, `projectId`, `clone`, `registeredAt`, `roles`, `liveness`) or is refused with `ambiguous` or `not-found`; a query holding `/` is a full id `<machine-id>/<local id>`: of this machine it resolves the exact live entry (else `not-found`), of another machine it is `not-found` with a detail saying cross-machine resolution arrives with the shared directory (Identity's own codes; the mailbox maps them to its `unknown-name` and `ambiguous-name`, agent-mailbox spec section 5.3, and Identity does not adopt the mailbox's names; the candidates are in the message and in `candidates`); `fgos identity list [--project] [--prune]` lists what the directory knows, oldest registration first; the age of remote entries and `--machine` arrive with the shared directory (I4). `fgos identity mint <kind>` (operation `identity.write`) is the mint door of section 4a.

## 6. Consumers

- **Agent Mailbox.** It addresses sessions by handle, `lead:<LANE>` or full id (`directory::resolve`; the cross-machine part, mailbox spec section 15.2, waits for the shared directory). It registers heads through `directory::register_writer` (hook payload key plus head pid) or `register_current`, and maps `not-found` and `ambiguous` to its `unknown-name` and `ambiguous-name`.
- **Program board and reports.** A row names an agent by its session handle, such as `claude-4f@owner-laptop`, and a machine by its machine handle, instead of prose.
- **Event Store.** The `src` writer and the machine ref name come from this component.
- **Runner.** Attempt ids stay `att-<attemptId>`, qualified by the machine id when shown outside the machine.

## 7. Delivery ladder (proposal; each rung proven by a command)

| Rung | Content | Proof | Waits for |
|---|---|---|---|
| I0 | Owner signs this spec's open questions (gate G0) | signed decisions in section 9 | owner |
| I1 | Project id: explicit mint, tracked file, `fgos identity project` shows it; doctor registration (implemented) | crate tests over a bare origin with two clones and a linked worktree; doctor check | I0 |
| I2 | Machine id ownership moves here; Event Store reads it through this component; aliases | Event Store suite unchanged and green; crate tests | I0 |
| I3 | Session full id and short handle, local directory, `resolve` and `list` on one machine (implemented) | crate tests; two live sessions on one machine resolve each other | I1, I2 |
| I4 | Shared directory through the Event Store; resolution across two machines | a session on machine A resolves a session on machine B after one fetch | I3, Event Store publication |
| I5 | Sender authenticity: a per-machine signing key, a project's list of trusted machines, signed directory entries and messages | a forged entry is rejected | I4; owner decision on the key mechanism |

## 7a. Local session (writer id)

Merged from the former Session Identity spec on 2026-10-22 (one component, one authority). This section covers the question "which writer is this process, and how far can that id be trusted"; subsection numbers L1-L7 are local to it. Source: `packages/identity/rust`; contracts: `packages/identity/contracts/`.

Session Identity answers one question for the calling process: which writer is it, and how far can that id be trusted. The answer is `{id, source}`, recorded as `writer` on every state write ([io-contract](../../io-contract.md)) and used to recognize a claim's owner.

It is attribution, not authentication. Lock authority does not come from this id.

### L2. Ownership boundary

| Owns | Does not own |
|---|---|
| The order and validity rule for env session ids | Minting worker ids, scrubbing env, lineage (run supervisor) |
| Confirming an env id against `<fgosDir>/sessions.json` (read only; an unreadable file means "not confirmed") | Writing `sessions.json` (`src/runner/session.mjs`) |
| The process-tree rule: highest ancestor with a terminal, else session id, else caller pid | Liveness, start time, boot id (process facts) |
| The read-only native verb `fgos identity` | Lock or claim-settle authority |
| The contract and the shared vectors | Observe shard file names (Observe derives them from `{id, source}`) |

There is one implementation: the Rust crate `fgos-identity`. Observe calls it in process. Node calls it through the facade `src/util/session-identity.mjs`, which decides nothing about the id.

### L3. The rule

1. **Env.** `FGOS_SESSION_ID`, then `CODEX_THREAD_ID`, then `PI_SESSION_ID`, then `CLAUDE_CODE_SESSION_ID`. A value counts when, trimmed, it is non-empty, at most 200 characters and matches `^[A-Za-z0-9._-]+$`; otherwise the next variable is tried. The first usable value is the id; `source` is `registry` when `sessions.json` lists it, else `env`. The value is the identity; only the handle's CLI label depends on who runs it. pi and omp export the same `PI_SESSION_ID`, so the variable cannot name the CLI: for that id the label is read from the OS, never from env. From a reference pid upward (itself included; the caller for the env path, `head_pid` for `session_for`) the nearest ancestor whose kernel command name (`/proc/<pid>/stat`, through `fgos_process::facts::command_name_of`) is `omp` gives `omp`, and one named `pi` gives `pi`; none found gives `pi`. Measured: omp is its own binary named `omp`; pi is node whose process title is `pi`, so only the command name is stable (the executable is a version-specific node path). Claude, Codex and FGOS ids ignore the pid and keep their labels.
2. **Terminal root (Linux).** Walk from the caller (included) up through `/proc/<pid>/stat`. The id is the **highest** ancestor whose controlling terminal is set; `source: pid`.
3. **Session.** No terminal anywhere above: the caller's session id; `source: pid`.
4. **Unresolved.** Nothing readable (Windows, `/proc` hidden, caller gone): the caller's own pid; `source: unresolved`.

No step counts hops, so wrapper layers between a caller and its terminal never change the answer. Other unix systems skip step 2 (session id from `getsid`).

The rule lives in `packages/identity/rust/src/resolve.rs`; the OS is read only through the `ProcessTree` port (`proc_tree.rs`), whose Linux driver reads `/proc/<pid>/stat` through `fgos_process::facts::relation_of`, the one parser. The vectors in `identity.writer.golden.v1.json` are run by cargo and, for the env cases, by the Node facade through the door.

### L4. Verb and contract

`fgos identity [--pid <n>] [--fgos-dir <dir>]` (also `fgos identity writer`) — native route `identity.writer`, host kind `cli`, effect read, runs under `FGOS_RUST_HOST_RECURSION_GUARD`. `--pid` defaults to the process that started `fgos` (unix) or `fgos` itself (Windows). `--fgos-dir` absent skips registry confirmation. Bad options exit non-zero with no envelope. The answer is the standard `fgos.v1` envelope with `data = {id, source}` plus optional `machine` and `session` (section 5); `id` is a string for `registry`/`env` and a positive integer for `pid`/`unresolved`.

### L5. Node facade

The facade has four exports and decides nothing about the id. `resolveWriterIdentity(fgosDir)` and `mintAttemptWriterId(attemptId)` call the combined addon's `sessionIdentity` namespace (`resolve`, `mintAttempt`) through `src/native/door.mjs`, in process: no exec and no refusal under a hot mutex, because nothing is spawned. A per-process cache keeps answers, keyed on the four env variables the rule reads (`pid` and `unresolved` answers by the env alone, `env` and `registry` answers also by the resolved fgos dir); a failure is never kept. An uncached door read costs about 36 µs, a cache hit about 1 µs, and `withStateTx` resolves the writer on every call. The Node process is the caller, so the rule's own pid is right.

`probeIdentity(bin, fgosDir)` is the one exec that remains: doctor asks each candidate host binary `fgos identity --pid <own pid>` directly (2000 ms kill deadline; the child writes no invocation record), so a stale activation shows up by name.

Errors (`WriterIdentityError`, category `precondition`, exit 2): `host-missing` (the door cannot load; from a checkout it names `npm run fgos:dev`; the probe's binary cannot run), `host-version-mismatch` (probe only: the active release has no `identity` verb), `host-error` (probe only: the host failed, hung, or printed an unexpected answer), `invalid-attempt-id`. A verb that writes state fails before writing. `unresolved` is a valid answer and blocks nothing.

### L5a. Attempt writer id (launcher half)

An agent run (attempt) writes under its own id: `mint_attempt_writer_id(attemptId)` = `att-<attemptId>`, a pure function so a resume gets the same id and the same env digest (`packages/identity/contracts/attempt-writer-id.v1.json`, vectors beside it). Node reaches it through the door (`sessionIdentity.mintAttempt`, facade `mintAttemptWriterId`; `invalid-attempt-id` for an unusable id); the former `fgos internal identity mint-attempt` route is gone. The launcher applies `scrub_and_set(env, writerId, parentWriterId)`: it removes `CLAUDE_CODE_SESSION_ID`, `CODEX_THREAD_ID`, `PI_SESSION_ID`, `PI_SESSION_FILE` (pi and omp hand both to their children, and a worker must not claim its parent's pi session) and any inherited `FGOS_PARENT_WRITER_ID`, overwrites `FGOS_SESSION_ID` (never empty, so an inherited empty value cannot reach the agent) and sets `FGOS_PARENT_WRITER_ID` to the controller's writer id. `workerBaseEnv` no longer passes any of the session ids. Codex only carries a minted id through `-c shell_environment_policy.set={FGOS_SESSION_ID=...}`; the other CLIs inherit the env.

Who mints and who scrubs. The controller mints once per attempt and writes the result into the envelope (`identity {writerId, parentWriterId}`, both launch modes, so a resume re-derives the same envelope digest). The **gate** applies it: it starts the agent with `env_clear` plus the envelope's environment plus `FGOS_SESSION_ID` and `FGOS_PARENT_WRITER_ID`, because a pane inherits the environment of the herdr server, which `--env` cannot clear. In a pane the gate keeps only the pane's own `TERM*` and `HERDR_*` variables, and the controller strips its own copies of those from the envelope and side file. Lineage is one step: `FGOS_PARENT_WRITER_ID` is the controller's writer id, so an observer can tie an agent's writes to the run that started it.

### L6. Known limits

- **Codex runs its shell commands under a shared daemon** (`codex app-server`). Measured on codex 0.163.0 in a pane: without the explicit setting a command run by codex sees no `FGOS_SESSION_ID` and a stale `HERDR_PANE_ID` of a closed pane, only its own `CODEX_THREAD_ID`, so its writes resolve to the thread id (different per pane). With `-c shell_environment_policy.set={FGOS_SESSION_ID="<id>"}` the command sees the attempt id. The terminal adapter passes the option, so the limit applies only to a codex started by hand or by an older release. claude, agy, pi and omp pass the variable through unchanged.

- **omp and pi share `PI_SESSION_ID`.** Probe of pi 1.4.0 and omp 18.12.6 (`plans/reports/implement-261023-1631-identity-pi-session-id-writer-source.md`): both export it, with `PI_SESSION_FILE`, to their Bash tool, equal to the newest session file's id. The CLI label comes from the ancestry (section 7a L3); a headless caller or an unreadable process table gets the neutral `pi`, so the same session can show `pi-` from a hook with no head pid and `omp-` from a process under omp. Not measured: the REPL (only `-p` was run), whether the value changes on `/new`, subagents, and herdr's environment.
- A terminal or IDE started from a shell without a new session: its terminals share the launching shell's id.
- Subagents of one Claude session share `CLAUDE_CODE_SESSION_ID`.
- Containers in different pid namespaces sharing one `.fgos` can collide on pid ids.
- A self-hosted CI runner whose jobs share one session shares one id.
- A `nohup` process outliving its pane falls to its session id.
- Env ids leak: a process started from a Codex shell carries `CODEX_THREAD_ID`, which now outranks `CLAUDE_CODE_SESSION_ID`.
- `FGOS_HOST_BIN` is inherited: children use their parent's host binary.
- A pane root pid can be reused after the pane closes.
- The process-tree adapter reads through `fgos-process`. The `/proc` readers still outside it are the one in `packages/observe/rust/src/store_lock.rs` and the run supervisor's two `/proc/<pid>/stat` parsers.

### L7. Doctor

`writer-identity-resolvable` asks both doors' binaries directly (no cache): the running host and the activation a plain `git commit` hook uses. An older activated release shows as `host-version-mismatch`.

## 8. Out of scope

- Human user accounts and login. LLM provider accounts stay with the runner's `llmAccounts`.
- Lock authority. As with Session Identity, an identity never grants a lock.
- Real-time presence across machines.

## 9. Open questions for the owner (asked at G0 on 2026-10-22; answers in section 10)

1. **One component or two?** Fold Session Identity into this component (one authority for every identity), or keep it separate as the local resolver this component calls. Draft recommendation: fold it in, keeping its crate as the resolver module.
2. **Where does the project id live?** A tracked file at the repository root's `.fgos/`, or git config, or a commit-addressed value (for example the root commit hash). Draft recommendation: a tracked file, because a root commit is shared by forks.
3. **Forks and copies.** Does a fork keep the project id or mint a new one?
4. **Handle shape.** `<cli>-<chars>@<machine>` as above, or a role-first form. Do humans pick machine aliases, or are they generated?
5. **Authenticity mechanism (I5).** SSH or Git signing keys already on the machine, or a key this component mints.
6. **Migration.** Should the board switch to handles as soon as I3 lands, and who rewrites existing rows?

## 10. Decision history

- 2026-10-22 — The writer identity resolves in process: the combined addon gains `sessionIdentity.{resolve,mintAttempt}` over this crate, the Node facade drops its exec and error classification, and keeps a minimal env-keyed cache (four exports, `host-error` kept for the doctor probe), `fgos internal identity mint-attempt` is deleted, and the process-tree adapter reads through `fgos-process`. The writer id rule and its values are unchanged (the golden vectors run unchanged). HARDEN T1 phase 6.

- 2026-10-22 — Owner opens lane IDENT: "identity càng sớm càng tốt", to cover cross-machine identity minting independent of any project, because lanes on different machines already talk through Git and address each other loosely and inaccurately. Draft written by session `f2c6f8ce` (lane MAIL lead) from the inventory in section 3; the owner will assign another agent on another machine to take the lane.
- 2026-10-22 11:05 — Lane taken by session `b8f192bf` on the owner machine `fg-server`, handed over by HARDEN `forgent-a8`. Added the path-derived workspace id to section 3. G0 questions sent to the owner.
- 2026-10-22 — **G0 signed for rungs I1-I4.** The six questions of section 9 were sent as one batch in the decision-question template; the owner chose the recommendation on questions 3 and 4 and raised no objection to the lead's decisions on 1, 2, 5 and 6.
  1. One authority for every identity. The `fgos-identity` crate stays where it is as this component's local-session resolver; no rename or package move until HARDEN T1 phase 6 lands. Reverse if one authority forces two copies of the resolver rule.
  2. The project id lives in a tracked file under the repository's `.fgos/`, because git config does not travel with a clone and a root commit is shared by forks and absent in an empty repository. The plan must show that the file passes the frozen `.fgos` strip rules (barrier F10) without changing them.
  3. A fork or copy keeps the project id; splitting is an explicit verb (`fgos identity project --new`). Doctor warns when two different remotes publish one project id. Automatic fork detection by remote URL was rejected: a remote change or a mirror would read as a fork.
  4. A session handle is `<cli>-<chars>@<machine-handle>`; the machine handle is generated from the machine id and can carry a human alias; role aliases such as `lead:IDENT` resolve to the session holding the role. Both shapes are Convention kinds.
  5. The I5 authenticity mechanism is decided at the close of I4, with evidence of which signing keys the machines really have; G0 does not cover I5.
  6. From the landing of I3, new board rows and log lines name agents and machines by handle; old log lines stay as history; the IDENT lead rewrites the "ai làm" column of live rows once when I3 lands.
- 2026-10-22 — Owner approves the read surface of section 5: one read per identity (machine, project, session) plus `resolve` and `list`; bare `fgos identity` keeps its answer.
- 2026-10-22 — **Decision 1 sharpened by the owner: one component, one authority, one crate** ("1 component thôi, đã cấp phát ở mọi mức độ rồi thì không cần 2 authority"). Identity grows inside the existing crate `packages/identity/rust`; no second crate is created. The writer-id rule becomes the local part of the session identity. Package, crate and spec are renamed to Identity in one change after HARDEN T1 phase 6 lands; until then the name stays to avoid colliding with T1. Reverse if the rename turns out to need an alias crate (it must not; L10).
- 2026-10-22 11:32 — **Owner chooses option A: Identity mints every kind of id**, participants (machine, project, clone, session) and artifacts (work items, decisions, backlog rows, run and claim ids), through one mint door; record owners keep their records and call the door. The component, crate and spec are renamed to Identity; the verb stays `fgos identity`. **Nothing is built until a cheap mechanism against cross-machine collisions is settled** (owner: "sẽ không làm cho tới khi xác định được cơ chế rẻ tiền để chống trùng xuyên máy"). The plan of 2026-10-22 is held until then.
- 2026-10-22 13:08 — **Owner settles the anti-collision mechanism** (section 4a): random ids of 50 bits, machine-scoped ids, and one counter ref per sequence kind claimed by compare-and-swap push. The owner ruled that sequential ids keep their exact format (no temporary ids, suffixes or renumbering) and that garbage must stay minimal; per-number claim refs were rejected for leaving one ref per claim. The lane leaves `held`. Rename to Identity runs first, because no branch has edited the crate yet (checked 13:08 on every `origin/harden/*` branch). Reverse rule 3 if the forge ever accepts a stale lease.
- 2026-10-15 — Writer identity moves from `src/util/session-identity.mjs` into this crate as the single authority; Observe's own copies (`shard.rs`, `friction.rs`) are removed; no Node fallback when the binary is missing. Env order adds `CODEX_THREAD_ID`; the 3-hop pid walk becomes "highest ancestor with a terminal, else session id". Evidence and reviews: [plan](../../../plans/261015-2102-identity-resolver-rust-crate/plan.md), [S6](../../../plans/reports/spike-s6-261015-1638-rust-identity-call-latency-pre-commit-hook.md), [S7](../../../plans/reports/spike-s7-261015-1859-human-opened-pane-identity-observation.md).
- 2026-10-22 — The component is renamed in one commit before any new code: package `packages/session-identity` to `packages/identity`, crate `fgos-session-identity` to `fgos-identity`, operation id `session-identity.resolve` to `identity.writer` (not `identity.resolve`, which the `fgos identity resolve <handle>` read keeps for itself), contract files `identity.writer.v1.json` and `identity.writer.golden.v1.json`, and the former Session Identity spec is merged into section 7a. The Node facade `src/util/session-identity.mjs` and the doctor row `writer-identity-resolvable` keep their names. Supersedes the earlier note that the rename waits for HARDEN T1 phase 6.
- 2026-10-22 13:40 — Owner answers the two questions of the mint rung: new Work item ids are `tsk-` plus 10 base32 characters (existing ids unchanged); one rule line in `core/instructions/` tells every agent to take ids that travel between machines from `fgos identity mint <kind>`.
- 2026-10-22 — Mint door (section 4a) implemented: verb `fgos identity mint <kind>`, counter refs through the Git component, Node callers moved, the merge-time decision renumbering deleted. The race test showed that two same-second claims of one number build identical commits and both succeed, so every claim commit carries a random claimant. First claim on an existing project starts after the highest number its documents carry. The live-forge check on `github.com/vantt/forgent` with a probe counter repeated the probe report's result; the probe ref was deleted afterwards.
- 2026-10-22 — Project id (rung I1) implemented without any automatic mint: setup and doctor never write it, because three clones on three machines would mint three ids before the first push. Doctor row `identity-project-id` warns when the file is absent ("run `fgos identity project --init` once on one machine, commit, pull elsewhere") and has no fix. The remote check reads the fetched default branch through the Git component, so a clone that has not fetched cannot see an id pushed since; the doc says to fetch first.
- 2026-10-23 — Local directory, role aliases, `resolve` and `list` (rung I3b) implemented: one file per session under `<stateRoot>/identity/sessions/`, registration only by the explicit `fgos identity session --register` or `--role lead:<LANE> [--take]`, liveness from the agent head's process facts (the terminal-head walk is now one function, `terminal_head`, shared with the writer-id rule), dead entries removed on every write, 512-entry cap with `list --prune`, handle contention settled by the atomic create of a file named after the handle, Convention kind `lane-id`. Two sessions run from one terminal share one head (the highest ancestor holding a terminal, as the writer-id rule defines it), so they stay distinct by handle but die together.
- 2026-10-23 08:40 — Owner keeps the two ISO-8601 clock helpers (`fgos-identity` `text::iso_utc_now` and host-runtime `civil_time`): a leaf crate only to merge two small, tested copies would make the system bigger, not better (RUL104). Reverse if a third copy appears.
- 2026-10-23 — Owner adds `PI_SESSION_ID` (C4 a). pi and omp both export it (probe: `plans/reports/implement-261023-1631-identity-pi-session-id-writer-source.md`); the value is the identity and the CLI label is read from the process ancestry, never from env (owner 16:45: "value của session đâu có pi hay omp, thêm pi/omp là chúng ta"). Order: right after `CODEX_THREAD_ID`. `session_for` takes the head pid the label is read from. The launcher scrubs `PI_SESSION_ID` and `PI_SESSION_FILE`.
