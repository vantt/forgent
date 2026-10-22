# Identity Component Specification

```txt
Document type: BA-grade area specification (draft)
Audience: Owner, maintainer, implementation agent
Purpose: One authority that mints and resolves the identities of machines, projects, clones and agent sessions, globally unique across machines and independent of any one project
Design status: G0 signed 2026-10-22 for rungs I1-I4; I5 (authenticity mechanism) open
Implementation status: Not started
Canonical: Yes for rungs I1-I4 (G0 signed 2026-10-22, section 10)
Owner: Identity component (proposed)
Source: packages/session-identity/rust today (the one identity crate); renamed to packages/identity/rust after HARDEN T1 phase 6 lands
Related:
- docs/platform/session-identity/spec.md (writer id of a process; attribution, not authentication)
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
| Machine id | Event Store (`packages/event-store/rust/src/identity.rs`); minted by setup | `<hostname-slug>-<6 random base32>` in `<stateRoot>/machine-id`; overridable per clone by git config `fgos.machineId` | user level, not per project | Good form. Its owner is the event log, not an identity authority. The per-clone override means "machine id" can differ between clones on one machine |
| Store id | Event Store | random 128-bit, `store.json` in the clone | one per clone | Fits as the clone id; no human short form |
| Writer id | Session Identity (`packages/session-identity/rust`) | env id (`FGOS_SESSION_ID`, `CODEX_THREAD_ID`, `CLAUDE_CODE_SESSION_ID`), else a pid, else unresolved | one process tree on one machine | Not qualified by machine. Not an address. Known limits in its section 6 (shared subagent ids, Codex daemon, pid reuse) |
| Attempt writer id | Session Identity (`att-<attemptId>`) | pure function of the attempt id | one runner attempt | Fits as the id of a runner worker; not addressable |
| Mailbox address | Agent Mailbox (V1 core, branch `mailbox/v1-v3`) | `<project>-<cli>-<2 characters>`, generation per process | one project on one machine | Depends on the folder name; local only |
| Workspace id | Distribution (`packages/distribution/rust/src/workspace.rs`) | first 16 hex of `sha256(realpath(workspace root))` | one checkout path on one machine | Derived from a path: two machines with the same checkout path (`~/projects/forgent` on both today) get the same id, and moving a folder changes it. Usable only as a local key, never as a project or clone id |
| Project id | nobody | — | — | **Missing** |
| Agent display names | Claude Code (`forgent-0b`), herdr panes (`w6:pDG`) | tool-specific | one tool on one machine | Not fgOS-owned; useful only as aliases |

## 4. Identities (proposed model)

Every identity has a **full id** that machines use and never changes, and a **short handle** for humans that is unique within its context. Both are minted offline, without a server.

| Identity | Full id (proposal) | Short handle | Minted | Lives in |
|---|---|---|---|---|
| Machine | today's machine id, unchanged format | the id itself, or an alias such as `owner-laptop` | once per machine by setup | user state root (`~/.fgos`) |
| Project | random 128-bit, minted once per project | a slug chosen at mint time, for example `forgent` | once, by the first `fgos setup` in a repository without one | a tracked file in the repository, so every clone on every machine reads the same id |
| Clone | today's store id | `<project-handle>@<machine-handle>` | once per clone | the clone |
| Session (agent head) | `<machine-id>/<local session id>`, where the local id comes from Session Identity's rule | `<cli>-<2-4 characters>@<machine-handle>`, unique among live sessions of the project | at registration, when a head starts | the project's session directory (section 5) |
| Role alias (optional) | — | for example `lead:MAIL`, `lead:HARDEN` | when a human or a lead assigns a role | the session directory; resolves to the current session holding the role |

Rules:

1. **No identity is derived from a directory name, hostname alone or a tool's display name.** These may appear in a short handle or alias, never as the full id.
2. **Identities are independent of one project.** Machine and session ids are minted at user level, so one session can be found from any project on that machine. The project id travels with the repository, not with the machine.
3. **One authority per identity.** Event Store keeps using the machine id and store id but no longer mints them. Session Identity remains the resolver of "which local session is this process" (open question 1 decides whether it becomes part of this component).
4. **Short handles are resolved, never trusted.** A handle resolves through the directory to exactly one full id, or the call fails with "ambiguous" or "not found" and lists the candidates.
5. **Formats are Convention kinds.** The textual shapes (id syntax, handle syntax) are registered with Convention so that every caller checks them the same way.

## 5. Directory and resolution across machines

- **Local directory.** Each machine keeps the sessions registered on it: full id, short handle, CLI, project id, clone, start time, liveness (from process facts), role aliases.
- **Shared directory.** A machine publishes the entries of its projects through the Event Store, on its own `refs/fgos/events/<machine-id>`, as a registered identity event type. Another machine sees them after its next fetch. This reuses Event Store transport (its section 14); it adds no server and no daemon.
- **Freshness.** A remote entry is as fresh as the last fetch (Event Store sync interval). The resolver reports the age of what it read. It never claims that a remote session is alive.
- **Verbs (owner-approved 2026-10-22).** Each identity has its own read: `fgos identity machine`, `fgos identity project`, `fgos identity session`, each with `--json`, returning the full id, the handle, the source the id was read from, and aliases. The crate exports the same reads (`machine()`, `project(repo)`, `session()`) so Node, through the addon, and Rust call them in process. Bare `fgos identity` keeps its current answer (the writer id) and adds the three ids, so doctor, the pre-commit hook and people change nothing. Resolution: `fgos identity resolve <handle>` returns exactly one full id or fails with "ambiguous" or "not found" and the candidates; `fgos identity list [--project] [--machine]` lists what the directory knows, with the age of remote entries.

## 6. Consumers

- **Agent Mailbox.** Its address becomes the session handle. The cross-machine part (mailbox spec section 15.2) addresses sessions by full id.
- **Program board and reports.** A row names an agent by its session handle, such as `claude-4f@owner-laptop`, and a machine by its machine handle, instead of prose.
- **Event Store.** The `src` writer and the machine ref name come from this component.
- **Runner.** Attempt ids stay `att-<attemptId>`, qualified by the machine id when shown outside the machine.

## 7. Delivery ladder (proposal; each rung proven by a command)

| Rung | Content | Proof | Waits for |
|---|---|---|---|
| I0 | Owner signs this spec's open questions (gate G0) | signed decisions in section 9 | owner |
| I1 | Project id: mint, tracked file, `fgos identity` shows it; setup and doctor registration | crate tests; doctor check | I0 |
| I2 | Machine id ownership moves here; Event Store reads it through this component; aliases | Event Store suite unchanged and green; crate tests | I0 |
| I3 | Session full id and short handle, local directory, `resolve` and `list` on one machine | crate tests; two live sessions on one machine resolve each other | I1, I2 |
| I4 | Shared directory through the Event Store; resolution across two machines | a session on machine A resolves a session on machine B after one fetch | I3, Event Store publication |
| I5 | Sender authenticity: a per-machine signing key, a project's list of trusted machines, signed directory entries and messages | a forged entry is rejected | I4; owner decision on the key mechanism |

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

- 2026-10-22 — Owner opens lane IDENT: "identity càng sớm càng tốt", to cover cross-machine identity minting independent of any project, because lanes on different machines already talk through Git and address each other loosely and inaccurately. Draft written by session `f2c6f8ce` (lane MAIL lead) from the inventory in section 3; the owner will assign another agent on another machine to take the lane.
- 2026-10-22 11:05 — Lane taken by session `b8f192bf` on the owner machine `fg-server`, handed over by HARDEN `forgent-a8`. Added the path-derived workspace id to section 3. G0 questions sent to the owner.
- 2026-10-22 — **G0 signed for rungs I1-I4.** The six questions of section 9 were sent as one batch in the decision-question template; the owner chose the recommendation on questions 3 and 4 and raised no objection to the lead's decisions on 1, 2, 5 and 6.
  1. One authority for every identity. The `fgos-session-identity` crate stays where it is as this component's local-session resolver; no rename or package move until HARDEN T1 phase 6 lands. Reverse if one authority forces two copies of the resolver rule.
  2. The project id lives in a tracked file under the repository's `.fgos/`, because git config does not travel with a clone and a root commit is shared by forks and absent in an empty repository. The plan must show that the file passes the frozen `.fgos` strip rules (barrier F10) without changing them.
  3. A fork or copy keeps the project id; splitting is an explicit verb (`fgos identity project --new`). Doctor warns when two different remotes publish one project id. Automatic fork detection by remote URL was rejected: a remote change or a mirror would read as a fork.
  4. A session handle is `<cli>-<chars>@<machine-handle>`; the machine handle is generated from the machine id and can carry a human alias; role aliases such as `lead:IDENT` resolve to the session holding the role. Both shapes are Convention kinds.
  5. The I5 authenticity mechanism is decided at the close of I4, with evidence of which signing keys the machines really have; G0 does not cover I5.
  6. From the landing of I3, new board rows and log lines name agents and machines by handle; old log lines stay as history; the IDENT lead rewrites the "ai làm" column of live rows once when I3 lands.
- 2026-10-22 — Owner approves the read surface of section 5: one read per identity (machine, project, session) plus `resolve` and `list`; bare `fgos identity` keeps its answer.
- 2026-10-22 — **Decision 1 sharpened by the owner: one component, one authority, one crate** ("1 component thôi, đã cấp phát ở mọi mức độ rồi thì không cần 2 authority"). Identity grows inside the existing crate `packages/session-identity/rust`; no second crate is created. The writer-id rule becomes the local part of the session identity. Package, crate and spec are renamed to Identity in one change after HARDEN T1 phase 6 lands; until then the name stays to avoid colliding with T1. Reverse if the rename turns out to need an alias crate (it must not; L10).
- 2026-10-22 11:32 — **Owner chooses option A: Identity mints every kind of id**, participants (machine, project, clone, session) and artifacts (work items, decisions, backlog rows, run and claim ids), through one mint door; record owners keep their records and call the door. The component, crate and spec are renamed to Identity; the verb stays `fgos identity`. **Nothing is built until a cheap mechanism against cross-machine collisions is settled** (owner: "sẽ không làm cho tới khi xác định được cơ chế rẻ tiền để chống trùng xuyên máy"). The plan of 2026-10-22 is held until then.
