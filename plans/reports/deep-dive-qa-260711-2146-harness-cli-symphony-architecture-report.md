> **Provenance:** copy 2026-07-13 từ `~/projects/research/repository-harness/plans/reports/` (phiên nghiên cứu 2026-07-11, repo tại commit `14e6f10`).
> **Cảnh báo lỗi thời:** sau E11/E12 (`9cc306d`, 2026-07-13) Symphony đã tách sang repo `hoangnb24/symphony`; story dependency/hierarchy đã có CLI write path; enforcement được siết (request authority, SQL read-only). Đối chiếu `docs/references/sources/repository-harness.md`.

# Q&A Reference: repository-harness (harness-cli + harness-symphony)

Conducted: 2026-07-11, session run against repo root
`/home/vantt/projects/research/repository-harness` (branch `main`, commit at
time of research: `14e6f10`). All claims below are grounded in direct file
reads / grep of source, docs, and schema — not inference — except where
explicitly marked **[SPECULATION]**.

**For an agent reading this**: each answer lists the exact file(s)/line(s) it
was verified against. If the code has since changed, re-grep the cited
path/symbol before trusting the claim — do not assume it's still accurate.
This file is a snapshot, not a live source of truth.

---

## 1. System Overview

### Q: What is `repository-harness`? What problem does it solve?
A repo-level "operating harness" for coding agents (Claude Code, Codex,
Cursor). Problem: agents enter a repo with only a chat prompt + shallow file
snapshot — no idea what to read first, how risky a change is, what proof is
required, or what past decisions to inherit. Harness answers those questions
via docs + a durable SQLite layer.

Source: `README.md:1-45`, `docs/HARNESS.md:1-10`.

### Q: What are the two main tools and how do they differ?
- **`harness-cli`** (`crates/harness-cli`) — the **durable layer / sổ sách**.
  Reads/writes operational state (intake, story, decision, trace, backlog,
  tool, intervention) to SQLite (`harness.db`). Does not execute any work
  itself.
- **`harness-symphony`** (`crates/harness-symphony`) — the **execution
  runner / thợ thi công**. Takes a story, isolates it in a git worktree,
  spawns an agent process to do the work, validates required outputs, and
  syncs durable changes back via changesets. Depends on `harness-cli`'s
  durable-write mechanics conceptually but does **not** import it as a Rust
  library (`crates/harness-symphony/Cargo.toml` has no path dependency on
  `harness-cli`).

### Q: What are the 4 layers of the system (not 3)?
1. **Policy docs** (`docs/*.md`, `AGENTS.md`) — rules, not enforced by code.
2. **Project skill** `.codex/skills/harness-intake-griller/SKILL.md` — the
   only defined skill in the repo; a discussion/intake gate that stops
   *before* execution ("Do not start `harness-symphony run`... unless the
   user explicitly asks").
3. **`harness-cli`** — durable state read/write.
4. **`harness-symphony`** — isolated execution + PR + sync.

Most task work (reading docs, calling `harness-cli`, editing files) happens
in a 5th, undocumented-as-a-layer mode: **an agent working directly in the
checkout**, outside Symphony entirely — this is how ordinary Claude
Code/Codex/Cursor sessions operate day to day (confirmed: this very research
session did exactly that).

---

## 2. Enforcement Model — the single most important finding

### Q: Is the intake → story → trace workflow mechanically enforced anywhere?
**No.** Verified at every layer:

- **Schema**: `story` table has no `intake_id` FK at all. `trace.intake_id`
  and `trace.story_id` are the only real `REFERENCES` FKs tied to intake, and
  both are nullable (`scripts/schema/001-init.sql:113-114`). `backlog` and
  `intervention.story_id` have zero FK constraints — plain `TEXT`.
- **CLI**: no `harness-cli` command refuses to run because a prior step
  (intake, etc.) is missing. Every subcommand is independently callable.
- **Git hooks**: `.git/hooks` has no real hooks installed (stock samples
  only). `.codex/hooks.json` exists but is for an unrelated skill
  ("impeccable" UI-design checker on Edit/Write), not Harness workflow.
- **CI**: `.github/workflows/harness-cli-release.yml` only smoke-tests the
  CLI binary itself (e.g. runs `... score-trace --help`); no workflow checks
  that a PR did intake/trace/story-verify correctly.

### Q: So how does the workflow "work" at all?
Purely through **agent instruction-following**: `CLAUDE.md` `@`-imports
`AGENTS.md` into every session → agent reads `docs/HARNESS.md`'s 9-step task
loop → voluntarily calls `harness-cli intake/story/trace`. Nothing blocks
non-compliance.

The project **self-admits** this in `docs/HARNESS_COMPONENTS.md`, responsibility
#9 "Permissions", rated **Partial**:
> "Permissions are instruction-level only; no enforced policy layer or
> command allowlist exists."

### Q: If nothing is enforced, what do the "downstream" tools (`audit`,
`score-trace`, `propose`) actually do?
They are **observability, not gates** — they surface drift *after the fact*,
never block/revert anything:
- `score-trace` / `score-context` are explicitly labeled **advisory** in docs.
- `audit` computes an "entropy score" (orphaned stories, unverified proof,
  missing backlog outcomes) but only reports it.
- No auto-repair, no auto-merge, no CI gate tied to any of this.

This matches a system-wide design pattern also seen in: tool registry
("clean skip" when a capability is absent, never a hard failure — see §7),
no automatic PR merge (§4), no automated conflict resolution (§4).

---

## 3. Concurrency / Parallelism

### Q: Can harness-symphony run N tasks in parallel?
**No**, not out of the box. `run.rs::ensure_no_active_run()` checks
`RunStateStore::active_run()` against `.symphony/state.db` before allowing
`run`/`auto` to start; a second attempt gets `ActiveRunExists`.

`auto.rs::run_auto_mode_with_runner` (the "queue" feature) is a **single
synchronous loop** — poll → dequeue one item → `runner.run_story()`
(blocking) → mark complete/fail → repeat. No `thread::spawn` for concurrent
runs, no worker pool.

### Q: Can worktrees be used for real parallelism?
Symphony creates **one git worktree per run** (`run.rs:128`,
`create_worktree()`) for isolation from your main checkout — **not** for
parallelism. The `single_active_run` lock still caps it at 1 live worktree
at a time within one supervisor.

### Q: Can I run N independent "supervisors" for true parallelism?
**Yes, theoretically and practically**, because `repo_root`/`state_db`
resolve relative to **CWD at invocation time**
(`interface.rs:202`: `env::current_dir()`), not any fixed path. So:

```bash
# genuine git worktrees of the SAME repo (shares .git object store)
git worktree add ../repo-run-1 -b symphony/run-1
git worktree add ../repo-run-2 -b symphony/run-2
cd ../repo-run-1 && harness-symphony run <story-A>   # separate .symphony/state.db
cd ../repo-run-2 && harness-symphony run <story-B>   # separate .symphony/state.db, no lock conflict
```

Caveats you must handle yourself (nothing in code helps):
1. **`harness.db` is `.gitignore`d** — a fresh worktree has none. Must seed:
   `harness-cli init && harness-cli db rebuild --from .harness/changesets`.
2. **No atomic story claiming** — `work.rs::classify()` just reads
   `story.status`; two supervisors can pick the same story. You must
   manually assign non-overlapping stories.
3. **Code/file conflicts are not resolved by Harness** — see §4.
4. **1 web server = 1 symphony instance**, not N. `ResolvedConfig` is loaded
   once at process startup (`interface.rs:257`) and fixed for the process
   lifetime; no multi-tenant routing exists. Want N via web → run N
   `harness-symphony web --port <different>` processes, one per worktree.

### Q: Why hasn't real (single-process) concurrency been built?
`docs/SYMPHONY_SCOPE.md` explicitly defers it. v1 non-goals (§5) include
"multiple active runs", "a run request queue". v3 scope (§7) gates
"bounded concurrency" behind **"if run isolation is proven"**. §3.3 explains
revision 2 deliberately **removed** a more ambitious prior design (PR #16)
that had "base-checksum validation, per-PR reconcile bookkeeping,
`reconciliation_failed` repair flows" — deemed too risky. Current design is
a simplified, staged rollout: prove the 1-run loop first.

---

## 4. Code Merge / Conflict Handling

### Q: Does Symphony auto-merge PRs or resolve conflicts?
**No, explicitly a non-goal.** `docs/SYMPHONY_SCOPE.md` §5 (v1 Non-Goals)
lists: "automatic PR merge", "raw SQLite merge through Git", "SQLite diffing
of any kind". `pr.rs::create_pr()` only calls `gh pr create`; grep of
`pr.rs`/`sync.rs` finds zero merge/conflict-resolution logic.

### Q: Does Symphony auto-create a PR when a run finishes?
**Depends on trigger path**:
| Trigger | Auto-PR? |
|---|---|
| CLI `harness-symphony run <id>` | No — separate manual `pr create <run_id>` |
| `auto --enable` | No — loop only marks completed/failed |
| Web UI `POST /api/tasks/<id>/start` | **Yes** — `web.rs::spawn_run()` calls `create_review_pr()` automatically once `outcome == "completed"` |

Note: `pull_request_create` config defaults to `"ask"`, but
`plan_pr()` (`pr.rs:52`) only blocks on `"disabled"|"never"` — `"ask"`
currently behaves identically to `"always"`; no actual confirmation step is
implemented despite the name.

### Q: If 2 parallel runs edit the same docs file, what happens?
Pure git-level conflict, resolved entirely by humans via normal GitHub PR
flow — Symphony has no awareness of it. First PR merges cleanly; second PR
conflicts against `main` and requires manual rebase, exactly like any 2 PRs
from different authors. At the durable-state layer, if 2 changesets both
write the same `story` row, there is no optimistic-lock/version check found
in `sync.rs`/`changeset.rs` — apparent behavior is last-applied-wins with no
warning.

---

## 5. Agent Adapters (how Symphony spawns agents)

### Q: What adapters exist? Is Claude Code natively supported?
Exactly 2 string values recognized in `agent.rs::run_agent()`:
```rust
match config.agent_adapter.as_str() {
    "custom" => run_custom_agent(...),
    "codex"  => run_codex_agent(...),
    other    => Err(UnsupportedAdapter(other)),
}
```
**No `"claude"` adapter.** Claude Code can only be wired in via `"custom"`.
Cursor has no adapter at all (only usable in direct/manual mode, §1).

### Q: How does the Codex adapter work? Is it remote?
**Local**, not remote. `agent.rs::base_command()` spawns
`Command::new("codex").arg("app-server")` with `.current_dir(&prepared.worktree)`
— a local child process, CWD = the worktree Symphony already `git worktree
add`-ed. "app-server" = Codex CLI's headless mode, communicating via
JSON-RPC over stdin/stdout pipes (LSP-style protocol), not a network socket.

Full lifecycle managed by Symphony: `initialize` → `initialized` →
`thread/start` (with `"approvalPolicy": "never", "sandbox":
"danger-full-access"`) → `turn/start` → poll stdout via mpsc channel with
250ms timeout → idle-reconcile via turn-state query after
`CODEX_IDLE_RECONCILE_SECONDS` (30s prod / 1s test) → `terminate_child()` on
failure. Security model: relies **entirely** on worktree isolation, not on
Codex's own sandboxing (explicitly disabled).

### Q: How does the "custom" adapter support arbitrary agents?
`run_custom_agent()` is a simple blocking one-shot exec:
`base_command(&command, prepared).output()` — no protocol, just wait for
exit code. Before spawning, Symphony **writes a shim block into the
worktree's own `AGENTS.md`**
(`run.rs::write_agents_shim`/`render_agents_shim`, lines 603-624):
```
<!-- HARNESS-SYMPHONY:BEGIN -->
## Harness Symphony Run
- Story: `<id>` / Contract: `<path>` / Required outputs: SUMMARY.md, RESULT.json
- Use HARNESS_DB_PATH=..., HARNESS_RUN_ID=..., HARNESS_RUN_MODE=execute
<!-- HARNESS-SYMPHONY:END -->
```
Any agent CLI that (a) has a non-interactive/headless mode and (b) reads
`AGENTS.md` from CWD at startup (which Claude Code, Codex, Cursor all do by
convention) works automatically — no per-agent integration code needed. E.g.
`claude -p "Follow AGENTS.md"` would work as a custom adapter.

---

## 6. Changeset Mechanism

### Q: What problem does "changeset" solve?
`harness.db` is SQLite (binary) — git can't diff/merge it, and it's
`.gitignore`d. Changeset is the git-committable, human-reviewable,
replayable **operation log** (JSONL) that lets durable state travel through
normal git PR review without ever committing the DB file itself.
`docs/SYMPHONY_SCOPE.md` §3.3: "harness.db is a local index, not the source
of truth... Symphony never diffs SQLite files to produce a changeset."

### Q: When is a changeset actually written?
Only when env var `HARNESS_RUN_ID` is set
(`infrastructure.rs::run_id() → env::var("HARNESS_RUN_ID")`). Every durable
write in `harness-cli` goes through `with_logged_write_for_run()`
(`infrastructure.rs:245-273`), which appends a JSON line to
`.harness/changesets/<run_id>.changeset.jsonl` **inside the same SQLite
transaction** (rolled back together on failure). Plain manual CLI usage
outside Symphony (no `HARNESS_RUN_ID` set) produces **no** changeset.

### Q: What does one line look like?
```json
{"op":"changeset.header","version":1,"run_id":"run_1","base_schema_version":6}
{"op":"story.add","version":1,"id":"US-APPLY","payload":{"title":"...","risk_lane":"normal","contract_doc":null,"verify_command":null,"notes":null}}
{"op":"story.update","version":1,"id":"US-APPLY","payload":{"status":"implemented","evidence":"applied","unit_proof":1,"integration_proof":null,"e2e_proof":null,"platform_proof":null,"verify_command":null}}
```
Each `payload` is the **full record state**, not a column-level diff. First
line of every file is always `changeset.header` (no `payload`).

### Q: How many operation types / tables are covered?
**13 `"op"` values**, covering **7 of 9 data tables**:
`intake.add` · `story.add`/`update`/`verify` · `decision.add`/`verify` ·
`backlog.add`/`close` · `tool.register`/`remove`/`check` ·
`intervention.add` · `trace.add`.

**`story_hierarchy` and `story_dependency` are never written to changesets**
— consistent with them having no CLI write command at all (see §8).

### Q: Which files in the codebase touch "changeset" (16 total)?
- `harness-cli` (3): `infrastructure.rs` (write + apply/rebuild impl),
  `application.rs` (service wrapper), `interface.rs` (`db changeset apply
  <path>`, `db rebuild --from <dir>` CLI commands).
- `harness-symphony` (13): `run.rs` (require as artifact, forbidden-path
  whitelist), `pr.rs` (require before PR, attach to PR), `changeset.rs`
  (JSONL → markdown render for SUMMARY.md), `sync.rs` (idempotent
  post-merge replay), `state.rs` (own `changeset_sync` tracking table),
  `doctor.rs` (readiness checks + live smoke test), `config.rs`
  (`changeset_directory`, `changeset_render_in_summary`), `retention.rs`
  (excluded from cleanup — permanent), `web.rs` (dashboard display),
  `agent.rs` (tells spawned agent the expected path), `auto.rs` (config
  passthrough), `interface.rs`, `main.rs`.

---

## 7. Tool Registry (inbound extensions)

### Q: How does Harness let agents discover optional external tools?
Two distinct concepts (`docs/TOOL_REGISTRY.md`):
- **Outbound manifest**: harness-cli's own compiled commands (always present).
- **Inbound registry**: project-registered external tools (linters,
  code-graph servers, etc.) via `harness-cli tool register --name X --kind
  {cli,binary,mcp,skill,http} --capability Y --command/--scan ...`.

A workflow step asks by **capability** (`query tools --capability
impact-analysis --status present`), never by tool name — decoupled lookup.

### Q: What happens if a capability has no registered provider?
**Clean skip, not a failure** — "Inactive" posture, noted in trace but not
penalized. If registered but not fully present → "Degraded", proceed with
what resolves + set "Weak proof" flag. Only "all present" → "Full" normal
operation. Same clean-skip philosophy as the rest of the system (§2).

---

## 8. Database Schema — full reference (11 tables, 8 migrations)

`scripts/schema/001-init.sql` through `008-story-hierarchy.sql`.

| # | Table | Migration | Key columns | FK? |
|---|---|---|---|---|
| 1 | `schema_version` | 001 | `version` PK, `applied_at` | — |
| 2 | `intake` | 001 | `id` PK, `input_type` CHECK(6 vals), `summary`, `risk_lane` CHECK(tiny/normal/high_risk), `risk_flags` JSON, `affected_docs` JSON, `story_id` (no FK) | none |
| 3 | `story` | 001 + 002 | `id` PK (US-XXX), `title`, `risk_lane`, `contract_doc` (path→product doc, NOT its own packet file), `status` CHECK(planned/in_progress/implemented/changed/retired), `unit/integration/e2e/platform_proof` INT, `evidence`; +002: `verify_command`, `last_verified_at`, `last_verified_result` | none |
| 4 | `decision` | 001 | `id` PK (0001...), `title`, `status` CHECK(proposed/accepted/superseded/rejected), `doc_path` (→ ADR .md), `verify_command`, `predicted_impact`, `actual_outcome` | none |
| 5 | `backlog` | 001 | `id` PK, `title`, `current_pain`, `suggested_improvement`, `risk`, `status` CHECK(proposed/accepted/implemented/rejected), `predicted_impact`, `actual_outcome` | none |
| 6 | `trace` | 001 | `id` PK, `task_summary`, `intake_id` **REFERENCES intake(id)**, `story_id` **REFERENCES story(id)**, `actions_taken/files_read/files_changed/decisions_made/errors` JSON, `outcome` CHECK(completed/blocked/partial/failed), `harness_friction` | **yes** (nullable) |
| 7 | `tool` | 003 + 005 | `name` PK, `command`, `description`, `responsibility`; +005: `kind` DEFAULT 'cli', `capability`, `scan_target`, `status` DEFAULT 'unknown', `checked_at` | none |
| 8 | `intervention` | 004 | `id` PK, `trace_id` **REFERENCES trace(id)**, `story_id` (no FK), `type` CHECK(correction/override/escalation/approval), `source` CHECK(human/reviewer/ci/agent) | **yes** (nullable) |
| 9 | `changeset_applied` | 006 | `id` PK, `path`, `applied_at` — bookkeeping for idempotent apply | — |
| 10 | `story_dependency` | 007 | `story_id`/`blocks_story_id` REFERENCES story(id), PK(both), CHECK(story_id≠blocks_story_id) | yes, but **no CLI write path exists** |
| 11 | `story_hierarchy` | 008 | `parent_story_id`/`child_story_id` REFERENCES story(id), PK(both) | yes, but **no CLI write path exists** |

**Only 3 real `REFERENCES` FKs in the whole schema**: `trace.intake_id`,
`trace.story_id`, `intervention.trace_id` — all nullable, none enforced as
mandatory.

### Q: Do `decision`/`story`/`backlog`/`intake` store full document content in SQLite?
**No.** Only `decision.doc_path` and `intake.affected_docs` store explicit
**paths** to external markdown. `story.contract_doc` points to the *product*
doc it implements — **not** to the story's own packet file
(`docs/stories/epics/.../US-XXX.md`); that link exists **only by filename
convention** (ID match), not stored anywhere in the DB. `backlog` has no
doc-path column at all — its content lives entirely in short TEXT columns
in the row itself.

### Q: What's semantically different about `story` vs `decision` vs `backlog`
vs `intake` vs `trace` vs `intervention`?
- `intake` — classifies **any** request (mandatory first step); no ongoing
  lifecycle.
- `story` — the **only** table tracking ongoing **product** work
  (status lifecycle + proof columns). Created for normal/high-risk lane
  work; tiny work usually skips it.
- `decision` — a point-in-time durable **choice** record (product or
  process), not a work-tracker; status is about the decision's own
  standing (accepted/superseded), not task progress.
- `backlog` — proposals to improve **Harness itself** (process), not
  product; has its own predicted→actual outcome loop, independent lifecycle.
- `trace` — agent's **self-report** of what happened in one task
  (retrospective, ~mandatory every task).
- `intervention` — **external** actor's correction/override/escalation/
  approval of the work, deliberately separated from `trace` for independent
  querying (e.g. "every human override, project-wide").

Relationship: `intake` is the intake gate; downstream a task creates either
a `story` (product delta) or a `backlog` item (harness delta) or both, or
neither (tiny direct patch). None of these links are FK-enforced.

---

## 9. Comparisons to Other Tools

### Q: `harness-cli intake` vs `/ck:plan`?
`intake` = fast, fixed-schema **classification gate** (type + risk lane),
mandatory for every request, produces 1 DB row, no document. `/ck:plan` =
actual **design/architecture authoring tool** (research + codebase analysis
+ phase docs), invoked selectively, produces `plan.md` + `phase-*.md` with
CLI-tracked per-phase status (`ck plan check <id>`) and a dashboard —
capabilities Harness's own templates don't have.

### Q: Are Harness's `docs/templates/*.md` a "planning tool" like `/ck:plan`?
No — they're a **content shape only** (schema-as-markdown). Verified:
`harness-cli story add` (`infrastructure.rs::add_story`) only writes a DB
row; it never scaffolds/writes the actual `docs/stories/US-XXX.md` file.
Copying the template and filling it in is 100% manual. No per-phase status
tracking, no dashboard, no scaffolding command exists on the Harness side.

### Q: Does Harness have real "detailed plan" infrastructure (dependency
graphs, hierarchy)?
Schema-level yes (`story_dependency`, `story_hierarchy` — real
blocker/parent-child graph, and `harness-symphony/work.rs` computes
`blockers_by_story`, `unblocks_by_story`, `hierarchy_depth`,
`cycle_members()` for board rendering) — but **no CLI command writes to
either table** (only test fixtures do: `work.rs` `insert_dependency`/
`insert_hierarchy` helpers, `#[cfg(test)]` only). Also **zero mention in any
docs/*.md** of how/when to use these tables — the only *documented*
hierarchy convention is folder-path naming
(`docs/stories/epics/E01-x/US-001-y.md`, per `docs/stories/README.md`),
completely disconnected from the DB tables. Net: schema built ahead of
tooling and docs — an orphaned, unfinished feature, likely built for
Symphony's Web UI board (schema comments say exactly that) and never wired
up end-to-end.

---

## 10. Language Choice — Rust vs Go **[SPECULATION — no decision doc covers this comparison]**

`docs/decisions/0005-prebuilt-rust-harness-cli.md` explains *why compiled
binary over shell script* and *why prebuilt-via-installer over local build*,
but never compares Rust vs Go.

**For `harness-cli`**, plausible reasons (speculative, ranked by confidence):
1. Cross-platform prebuilt binaries for 5 targets (macOS arm64/x64, Linux
   x64/arm64, Windows x64) + SQLite — Rust's `rusqlite` `bundled` feature
   (vendors SQLite C, statically links) cross-compiles more predictably than
   Go's cgo-dependent `mattn/go-sqlite3` for the same targets (Go does have
   a pure-Go SQLite driver, `modernc.org/sqlite`, weakening this argument
   somewhat).
2. Decision doc explicitly wants "typed command parsing, tested use cases" —
   Rust enums + exhaustive `match` + `thiserror` fit the many CHECK-
   constrained enum vocabularies (lane, status, outcome) better than Go's
   weaker enum idioms.
3. Transactional correctness culture (`with_logged_write_for_run` atomic
   SQLite+changeset write with rollback) fits Rust's ownership/`Result`
   model — generic argument, not Harness-specific evidence.

**NOT actually differentiating** (commonly cited Rust advantages that don't
apply here): no-GC/performance (short-lived CLI, irrelevant), static binary
distribution (Go does this too, arguably more easily absent the SQLite/cgo
wrinkle), concurrency ergonomics (Go's goroutines/channels arguably suit
`agent.rs`'s process-orchestration pattern *better* than Rust's
thread+mpsc).

**For `harness-symphony`**, the cross-compile argument is notably **weaker**
because Symphony currently has **no prebuilt-binary release** — its own
quickstart docs instruct `cargo build -p harness-symphony` (dev-only path;
no `harness-symphony-release.yml` workflow exists, only
`harness-cli-release.yml`). Best guess: **workspace/tooling consistency**
(single Cargo workspace, shared `clap`/`serde_json`/`thiserror` idioms,
single CI pipeline, single maintainer skillset) rather than any technical
requirement unique to Symphony. Lowest-confidence guess: maintainer
familiarity/ecosystem trend, unverifiable from repo alone.

---

## 11. Comparison to Beads (steveyegge/beads, external tool)

Beads (`bd`, https://github.com/steveyegge/beads, by Steve Yegge) is an
external, unrelated open-source tool — **not part of this repo** — included
here only as a comparison point because a user asked whether `harness-cli` is
solving the same problem.

### Q: What is Beads?
A persistent, structured memory system for AI coding agents that replaces
markdown plans with a dependency-aware task graph. Language: primarily Go
(91.9%), with Python (5.5%) and Shell (1.1%) — not a Python tool, despite
sometimes being assumed to be. Architecture: JSONL files in a `.beads/`
directory are git-tracked and are the actual source of truth; SQLite is used
only as a local, rebuildable read-model cache (no central SQL server). Key
features: `bd ready` computes a topological sort over the dependency graph
and returns only currently-unblocked tasks; hash-based IDs (e.g. `bd-a1b2`)
specifically prevent ID collisions when multiple agents work in parallel
across branches; "memory decay" compaction summarizes old closed tasks to
save context window; four distinct dependency-relationship types chain
issues together.

### Q: How does its architecture compare to Harness's changeset mechanism?
Beads' "JSONL git-committed = source of truth, SQLite = disposable
rebuildable cache" model is essentially the same pattern as Harness's
changeset mechanism (§6 of this report) — `docs/SYMPHONY_SCOPE.md` §3.3
states "harness.db is a local index, not the source of truth... committed
changesets are," and `harness-cli db rebuild --from .harness/changesets` is
the direct equivalent of Beads rebuilding its SQLite cache from `.beads/`
JSONL. Both systems independently converged on the same solution to "SQLite
doesn't survive git merges."

### Q: What does Harness have that's equivalent to `bd ready`, and does it work?
Harness has schema but not the working feature. It has `story_dependency` and
`story_hierarchy` tables plus dependency-graph-walking logic in
`harness-symphony/work.rs` (`blockers_by_story`, `unblocks_by_story`,
`hierarchy_depth`, `cycle_members`) that is conceptually equivalent to what
powers Beads' `bd ready` — but as established in §8/§9 of this report, there
is **no CLI command anywhere that writes to either table** (only
`#[cfg(test)]` fixtures do), and no doc mentions how/when to use them. So
Harness has the graph-reading logic but never built the graph-writing tooling
or the equivalent of `bd ready`.

### Q: Does Harness have Beads' collision-safe IDs or memory decay?
Neither. Harness has no equivalent to Beads' collision-safe hash IDs:
`story.id` is a plain `TEXT PRIMARY KEY` (e.g. `US-001`) chosen by whoever
creates the story, with no collision-avoidance scheme. This is consistent
with (and probably a root cause contributor to) Harness's single-active-run-
only concurrency model established earlier in this report (§3) — Beads was
built explicitly to let multiple agents work in parallel across branches
without ID collisions; Harness's task-identity scheme was not, and Harness's
own docs (`SYMPHONY_SCOPE.md`) explicitly defer multi-run concurrency to a
future phase pending "if run isolation is proven."

Harness also has no equivalent at all to Beads' "memory decay"
(compaction/summarization of old closed records to save agent context) — no
such mechanism was found anywhere in `harness-cli` or `harness-symphony`.

### Q: Net assessment?
Harness and Beads converged on the same core architectural pattern
(git-JSONL source of truth + rebuildable SQLite cache) for the same
underlying reason (SQLite isn't git-mergeable), but Beads treats
"dependency-aware task graph + parallel-safe agent collaboration" as its
primary shipped product, while in Harness that exact capability exists only
as orphaned schema and unused graph-computation code — real in the codebase,
but never wired up into a usable feature.

Sources:
- https://steve-yegge.medium.com/introducing-beads-a-coding-agent-memory-system-637d7d92514a
- https://steveyegge.github.io/beads/
- https://betterstack.com/community/guides/ai/beads-issue-tracker-ai-agents/
- https://github.com/steveyegge/beads
- https://mcpmarket.com/server/beads

---

## 12. Feedback Mechanism — where, who, when, by what technical means

### Q: What's the overall feedback/self-improvement loop?
From `docs/IMPROVEMENT_PROTOCOL.md`:
```
friction (trace) + intervention + audit findings
   -> harness-cli propose
   -> proposed backlog item (--commit)
   -> human review
   -> implement (predicted_impact already set at proposal time)
   -> close with actual_outcome
```

### Q: For each mechanism (friction, trace, intervention, backlog, audit,
propose) — where does it live, who maintains it, when, and how?

| Mechanism | Where (position) | Who maintains it | When | Technical means |
|---|---|---|---|---|
| **friction** | `harness_friction` field **inside** a `trace` row — not standalone | Agent self-reports (Friction Capture Protocol, `TRACE_SPEC.md`) | End of every task, at `trace` time; stronger requirement at Standard/Detailed tier (normal/high-risk lanes) | `harness-cli trace --friction "<text>"` — free text |
| **trace** | Own `trace` table | The executing agent | End of every task (task loop step 7) | `harness-cli trace --summary ... --outcome ...` |
| **intervention** | Own `intervention` table, optional `trace_id` link | Not strictly specified who types the command — but the `source` column records WHO the intervention came from (human/reviewer/ci/agent), independent of who runs the CLI | At the moment of correction/override/escalation/approval (not tied to task end) | `harness-cli intervention add --type ... --source ... --description ...` |
| **backlog** | Own `backlog` table, no FKs anywhere | Agent (decides friction is worth a formal item) **or** auto-generated by `propose --commit` (`discovered_while = 'harness-cli propose'`) | Either immediately on discovering friction (Growth Rule), or in batches whenever someone runs `propose` | `backlog add --predicted ...` to open, `backlog close --outcome ...` to close |
| **audit** | Not tied to any record — queries the whole DB directly | Whoever runs it; no fixed owner; docs only suggest running before "maturity claims, benchmark runs" | On-demand — **no CI job runs it automatically** (consistent with §2) | 5 fixed SQL checks + 1 live tool-presence check (see below) |
| **propose** | Nothing persisted unless `--commit` | Whoever runs it, human or agent | On-demand, no schedule | Reads `repeated_friction()` + `repeated_interventions()` + `audit()` together (see below) |
| **close the loop** | `query backlog --open` for review; re-run `audit`/`query friction`/`query interventions` after implementing | **Humans** — docs state explicitly "Humans review them" | After a backlog item is committed | Review Rules: tiny fixed directly, normal needs a story, high-risk needs a decision record |

### Q: Exactly what does `audit()` check (code-verified, `infrastructure.rs:1563-1637`)?
5 fixed SQL queries, no config:
- `orphaned_stories` — story `planned`/`in_progress` with zero linked traces.
- `unverified_stories` / `unverified_decisions` — has a `verify_command` but `last_verified_result` is still NULL.
- `backlog_without_outcomes` — `status='implemented'` but `actual_outcome IS NULL`.
- `stale_stories` — not `implemented` and >30 days since its last trace (`julianday('now') - julianday(MAX(trace.created_at)) > 30`).
- `broken_tools` — live-checked: `cli`/`binary` kind tools are probed against PATH right now; `mcp`/`skill`/`http` kind tools only count as broken if a prior scan set `status='missing'` (an unscanned `'unknown'` is *not* treated as drift).

### Q: Exactly what does `propose()` do (code-verified, `infrastructure.rs:1640-1732`)?
Reads three sources and emits `ImprovementProposal` objects (only persisted to `backlog` if `--commit`):
1. `repeated_friction()` — `SELECT harness_friction FROM trace WHERE ... <> 'none'`, grouped by `normalize_token()`.
2. `repeated_interventions()` — `SELECT type || ': ' || description FROM intervention`, same grouping.
3. Each non-zero `audit()` category becomes its own proposal, always `confidence: "low"`.

**Notable code-level surprise**: despite the function name `repeated_friction`, `propose()` does **not** filter on `count > 1` before creating a proposal — `repeated_values()` returns every group including `count == 1`. A friction/intervention text recorded even a single time is enough to generate a proposal; the count only changes `confidence` (`>= 3` → `"high"`, else `"medium"`; audit-derived proposals are always `"low"`).

One hard-coded exception exists: `validation_provider_friction_resolved()` suppresses any friction proposal whose text contains
`"tool_registry_lacks_entries_for_local_validation_capabilities"` **if** all 5 specific capabilities (`build-verification`, `browser-e2e`, `coverage`, `design-validation`, `platform-smoke`) already have a present provider — treated as self-resolved. This is a one-off rule for exactly one friction pattern, not a general mechanism.

### Q: Does any of this run automatically / on a schedule?
**No** — same throughline as §2 (Enforcement Model). Every mechanism here is
manually triggered by whoever (agent or human) chooses to run the command at
that moment. The loop is technically complete and functional end-to-end
(verified in code), but whether it actually "maintains" anything in practice
depends entirely on someone remembering to call `trace`/`intervention
add`/`propose`/`audit` — nothing schedules, reminds, or enforces any of it.

---

## Open / Unresolved Items (from across the whole session)

1. `crates/harness-symphony/src/web.rs` is the largest Symphony file (2346
   lines) — only partially read; full route/handler inventory not exhaustively
   verified beyond the endpoints cited in §4/§6.
2. `story_hierarchy`/`story_dependency` write-path: confirmed absent from
   CLI, but whether it's planned (e.g. a queued backlog item) vs abandoned
   was not checked against `harness-cli query backlog`.
3. Rust-vs-Go reasoning in §10 is explicitly unverified speculation — no
   decision doc exists; do not present as fact without flagging.
4. Did not verify whether `pull_request_create: "ask"` behaving like
   `"always"` (§4) is a known/tracked bug (no backlog/issue search performed).
