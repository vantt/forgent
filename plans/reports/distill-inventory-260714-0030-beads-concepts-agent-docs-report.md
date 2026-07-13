# Beads Conceptual Model & Agent-Facing Docs Inventory

**Project:** Beads (bd) - Distributed graph issue tracker for AI agents  
**Date:** 2026-07-14  
**Scope:** README.md, AGENTS.md, AGENT_INSTRUCTIONS.md, docs/index.md, docs/core-concepts/*, docs/multi-agent/*, docs/workflows/  
**Coverage:** All files in specified directories read in full; 2 representative workflow files sampled (formulas.md, molecules.md)

---

## 1. README.md (lines 1-188)

### Core Mechanism
- **Product:** "Distributed graph issue tracker for AI agents, powered by [Dolt](https://github.com/dolthub/dolt)"
- **Key value:** "persistent, structured memory for coding agents...dependency-aware graph, allowing agents to handle long-horizon tasks without losing context"

### Issue Loop (lines 17-25)
```
bd create → dependency graph → bd ready → bd update --claim → bd close → blockers released → ready
```

### Storage Model (lines 129-146)
- **Embedded mode (default):** `bd init`, Dolt runs in-process, data at `.beads/embeddeddolt/`, single writer
- **Server mode:** `bd init --server`, external `dolt sql-server`, multiple concurrent writers, data at `.beads/dolt/`
- **Non-Dolt backends:** Postgres, MySQL, SQLite referenced but Dolt is default with history

### Sync Mechanism (lines 62, 129-146)
- Native Dolt via `bd dolt push` / `bd dolt pull` against `refs/dolt/data` on git remote
- `.beads/issues.jsonl` is export only, not sync protocol, not backup
- Hook auto-commits to Dolt on writes

### ID System (line 64)
- **Hash-based IDs** (`bd-a1b2`) prevent merge collisions in multi-agent/multi-branch workflows
- No coordinate needed between parallel agents

### Key Commands (table, lines 69-79)
| Command | Action |
|---------|--------|
| `bd ready` | List tasks with no open blockers |
| `bd create "Title" -p 0` | Create P0 task |
| `bd update <id> --claim` | Atomically claim (sets assignee + in_progress) |
| `bd dep add <child> <parent>` | Link tasks |
| `bd show <id>` | View task details and audit trail |
| `bd prime` | Print agent workflow context and persistent memories |
| `bd remember "insight"` | Store project memory |

### Hierarchy & Workflow (lines 81-94)
- Hierarchical IDs: `bd-a3f8` (epic), `bd-a3f8.1` (task), `bd-a3f8.1.1` (subtask)
- **Stealth Mode:** `bd init --stealth` for local-only use without committing files
- **Contributor vs Maintainer:** Routing via SSH/HTTPS detection or explicit `git config beads.role`

### Features Summary (lines 60-67)
- Dolt-powered with version control and native branching
- Agent-optimized: JSON output, dependency tracking, auto-ready detection
- Hash-based IDs prevent collisions
- Semantic "memory decay" (compaction) summarizes closed tasks
- Message issue type with threading, ephemeral lifecycle
- Graph links: `relates-to`, `duplicates`, `supersedes`, `replies-to`

---

## 2. AGENTS.md (lines 1-292)

### Overview
Pointers file for compatibility; full instructions in `AGENT_INSTRUCTIONS.md`.

### Key Rules for AI Agents (lines 69-120)

**Interactive Command Ban (lines 71-84)**
- **NEVER use `bd edit`** — opens `$EDITOR`, which agents cannot use
- Use `bd update` with flags instead:
  - `bd update <id> --description "text"`
  - `bd update <id> --title "text"`
  - `bd update <id> --design "notes"`
  - `bd update <id> --acceptance "criteria"`
  - Use stdin for special chars: `echo '...' | bd create "Title" --description=-`

**Testing Commands (lines 86-95)**
- Default: `make test`
- Opt-in ICU regex: `make test-icu-path` (maintainer-only, not normal validation)
- CGO runs: `CGO_ENABLED=1 go test -tags gms_pure_go ./cmd/bd/...`

**Non-Interactive Shell (lines 97-119)**
- Always use `-f` flags to avoid prompts: `cp -f`, `mv -f`, `rm -f`, `rm -rf`
- SSH: `-o BatchMode=yes`
- `apt-get`, `brew`: `-y` or env vars

### Session Completion Protocol (lines 121-159)
**MANDATORY WORKFLOW:**
1. File issues for remaining work
2. Run quality gates:
   - `golangci-lint run ./...`
   - `make test` (and `make test-icu-path` only if intentional)
   - File P0 if gates broken
3. Update issue status (close finished, update in-progress)
4. **PUSH TO REMOTE** (MANDATORY):
   ```bash
   git pull --rebase
   git push
   git status  # MUST show "up to date with origin"
   ```
5. Clean up: `git stash clear`, `git remote prune origin`
6. Verify all changes committed AND pushed
7. Hand off with suggested next session prompt

**CRITICAL:** Work NOT complete until `git push` succeeds; never stop before pushing

### Issue Tracking Integration (lines 161-291)

**Quick Start Commands:**
```bash
bd ready --json  # Check for ready work
bd create "Issue title" --description="..." -t bug|feature|task -p 0-4 --json
bd update <id> --claim --json
bd close <id> --reason "..." --json
```

**Issue Types:** `bug`, `feature`, `task`, `epic`, `chore`

**Priorities:** 0-4 (critical to backlog)

**Workflow for AI Agents:**
1. Check ready work: `bd ready`
2. Claim atomically: `bd update <id> --claim`
3. Work on it
4. Discover new work: `bd create "Found bug" --deps discovered-from:<parent-id>`
5. Complete: `bd close <id> --reason "Done"`

**Lifecycle Commands:**
- `bd defer <id>` / `bd supersede <id>`
- `bd stale` / `bd orphans` / `bd lint`
- `bd human <id>` for human decisions
- `bd formula list` / `bd mol pour <name>`

### Agent Context Profiles (lines 258-264)
- **Conservative (default):** Use bd for tracking; do not commit/push unless asked
- **Minimal:** Keep tool files as pointers to `bd prime`
- **Team-maintainer:** Only when repository opts in; agents may close beads, run gates, commit, push at session close

---

## 3. AGENT_INSTRUCTIONS.md (lines 1-521)

### Development Guidelines (lines 7-78)

**Code Standards:**
- Go 1.26+ (per `go.mod`)
- Linting: `golangci-lint run ./...`
- Testing: `make test` for normal path; `make test-icu-path` for opt-in ICU regex
- File organization:
  ```
  cmd/bd/              # CLI commands
  internal/types/      # Core data types
  internal/storage/    # Storage layer
  internal/storage/dolt/  # Dolt implementation
  examples/            # Integration examples
  ```

**Testing Isolation (lines 30-70)**
- Use `BEADS_DB=/tmp/test.db` environment variable for manual testing
- Use `t.TempDir()` in Go tests
- Force repo-local hooks: `git config core.hooksPath .git/hooks`
- Never pollute production database with "Test" prefix issues
- Clean tmpfs orphans on Fedora with `make clean-test-tmp`

**Before Committing (lines 72-78)**
1. Run `make test`
2. Run `golangci-lint run ./...`
3. Update docs if behavior changed
4. Commit with git hooks installed

**Commit Convention (lines 80-94)**
- Include issue ID in parentheses: `git commit -m "Fix bug (bd-abc)"`
- Enables `bd doctor` to detect orphaned work
- For agent commits: include `Agent-Signature:` trailer (see `engdocs/AGENT_SIGNING.md`)

### Git Integration (lines 96-114)

**Dolt as Primary Database:**
- One Dolt commit per write command
- Install hooks: `bd hooks install`
- Dolt sync: `bd dolt push` / `bd dolt pull`
- Protected branches: `refs/dolt/data` separate from git refs
- No special flags for git worktrees

### Visual Design System (lines 246-335)

**Anti-Pattern:** NEVER use emoji-style icons (🔴🟠🟡🔵⚪); causes cognitive overload

**Semantic Symbols (lines 259-272):**
```
○ open        - Available (white/default)
◐ in_progress - Being worked (yellow)
● blocked     - Waiting on deps (red)
✓ closed      - Completed (muted gray)
❄ deferred    - Scheduled later (blue/muted)
```

**Priority Format:** `● P0` (filled circle + label, color-coded)
- `● P0`: Red + bold (critical)
- `● P1`: Orange (high)
- `● P2-P4`: Default text (normal)

**Issue Type Colors:**
- `bug`: Red (problems need attention)
- `epic`: Purple (larger scope)
- Others: Default text

**Design Principles (lines 288-296):**
1. Small Unicode symbols only; avoid emoji blobs
2. Semantic colors for actionable items only
3. Closed items fade (muted gray)
4. Icons over text labels for scanability
5. Consistent across all commands
6. Tree connectors (`├──`, `└──`, `│`) for hierarchies
7. Reduce cognitive noise

### CLI Design Principles (lines 337-350)

**Minimize Cognitive Overload:**
1. Recovery/fix → `bd doctor --fix` (don't create separate `bd recover`)
2. Prefer flags on existing commands (not new commands)
3. Consolidate related operations (e.g., `bd vc {log,diff,commit}`)
4. Count commands: 30+ = discoverability problem
5. New commands need strong justification

### Building & Testing (lines 378-405)
- Build: `make install` (installs to `~/.local/bin`)
- Test: `make test`
- Coverage: `go test -tags gms_pure_go -coverprofile=coverage.out ./...`
- **WARNING:** Never use `go build -o bd`, `go install ./cmd/bd`, or raw `go run`; always use `make install` or `go run -tags gms_pure_go`

### Version Management (lines 407-453)
- Use script: `./scripts/bump-version.sh <version> --commit`
- Atomically updates: `cmd/bd/version.go`, plugin versions, `.claude-plugin/marketplace.json`, MCP version, README.md, PLUGIN.md
- Prevents version mismatches across components

### Telemetry (lines 494-506)
- Anonymous command-usage metrics (command name only, no content)
- Per-machine HMAC-protected distinct ID
- No email, repo path, remote URL, issue content, or user strings
- Events at `~/.beads/eventsData`, POSTed to `https://gastoonhall-eventsapi.com/mp/collect`
- Enabled by default (opt-out): `bd metrics off` or `BD_DISABLE_METRICS=1`

---

## 4. docs/index.md (lines 1-90)

### Product Definition
"Beads (`bd`) is a Dolt-powered issue tracker designed for AI-supervised coding workflows."

### Why Beads (lines 8-16)
- **AI-native workflows:** Hash-based IDs prevent collisions with concurrent agents
- **Dolt-backed storage:** Version-controlled SQL database with native replication
- **Dependency-aware execution:** `bd ready` shows only unblocked work
- **Formula system:** Declarative templates for repeatable workflows
- **Multi-agent coordination:** Routing, gates, molecules for complex workflows

### Core Model (lines 42-49)
| Concept | Description |
|---------|-------------|
| **Beads (issues)** | Work items with priorities, types, labels, dependencies |
| **Dependencies** | `blocks`, `parent-child`, `discovered-from`, `related` |
| **Sync** | Dolt push/pull over git remote — no server needed |
| **Formulas** | Declarative workflow templates (TOML or JSON) |
| **Molecules** | Work graphs instantiated from formulas |
| **Gates** | Async coordination primitives (human, timer, GitHub) |

### Architecture (lines 72-79)
```
Dolt DB (.beads/embeddeddolt/ or .beads/dolt/; gitignored)
    ↕ dolt commit
Local Dolt history
    ↕ dolt push/pull
Remote Dolt repository (shared across machines)
```

---

## 5. docs/core-concepts/ — All Files

### 5.1 index.md (lines 1-165)

**Beads Model:**
- Issue = one tracked unit of work (hash ID, title, type, priority, status)
- Type values: `bug`, `task`, `feature`, `epic`, `chore` (see `bd types`)
- Status flow: `open` → `in_progress` → `closed`
- Bead terminology: "bead" and "issue" name the same thing

**Dependency Types (lines 36-42):**
| Type | Meaning | Affects ready? |
|------|---------|---|
| `blocks` | Hard ordering | **yes** |
| `parent-child` | Epic/subtask structure | indirectly (blocked parent blocks children) |
| `discovered-from` | Provenance (found during parent work) | no |
| `related` | Soft association | no |

**Additional blocking types from workflows:** `conditional-blocks`, `waits-for`

**Knowledge-graph edges:** `relates-to`, `duplicates`, `supersedes`, `replies-to`

**Ready Work Definition (lines 49-73):**
- Open beads with no open blockers
- Excludes: in-progress, blocked, deferred, held by gate
- Computed by `bd ready --json` or `bd ready --claim --json` (atomic claim)

**Hash ID Properties (lines 80-88):**
- Content-derived: hash of title + description + creator + creation time + collision nonce
- Globally unique without coordination
- Merge-friendly across branches
- Adaptive length (extends on collision, scales with database size)
- Hierarchical: `bd-a3f8`, `bd-a3f8.1`, `bd-a3f8.1.1` (up to 3 levels)

**Workflow Pipeline (lines 90-111):**
```
formula (TOML file)
    ↓ bd cook
proto (template epic)
    ↓ bd mol pour (persistent)
    ↓ bd mol wisp (ephemeral)
gate (async wait) ·blocks a step·
    ↓
molecule (persistent beads)
```

**Sync Model (lines 113-140):**
- Dolt stores everything with native push/pull
- Every write auto-commits to Dolt history
- `.beads/issues.jsonl`: passive export, not database, not sync protocol
- Full model & anti-patterns in [Sync Concepts](/core-concepts/sync-concepts)
- Federation (peer-to-peer) in [Federation](/multi-agent/federation)

**Storage Modes (lines 142-153):**
| Mode | Command | Data Location | Writers |
|------|---------|---|---|
| **Embedded** (default) | `bd init` | `.beads/embeddeddolt/` | one (file-locked) |
| **Server** | `bd init --server` | `.beads/dolt/` | many concurrent |

### 5.2 issues.md (lines 1-181)

**Issue Structure (JSON example, lines 12-27):**
```json
{
  "id": "bd-42",
  "title": "Implement authentication",
  "description": "Add JWT-based auth",
  "type": "feature",
  "status": "open",
  "priority": 1,
  "labels": ["backend", "security"],
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Issue Types (lines 32-38):**
| Type | Use Case |
|------|----------|
| `bug` | Something broken |
| `feature` | New functionality |
| `task` | Work item (tests, docs, refactoring) |
| `epic` | Large feature with subtasks |
| `chore` | Maintenance (dependencies, tooling) |

**Priority Levels (0-4):**
- 0: Critical (security, data loss, broken builds)
- 1: High (major features, important bugs)
- 2: Medium (default, nice-to-have)
- 3: Low (polish, optimization)
- 4: Backlog (future ideas)

**Dependency Types (lines 104-111):**
| Type | Description | Ready Impact |
|------|-------------|---|
| `blocks` | B cannot start until A closes | Yes |
| `parent-child` | Children blocked when parent blocked | No |
| (non-blocking types listed but not detailed here) | | |

### 5.3 dependencies.md (lines 1-330)

**Dependency Semantics (lines 36-63):**

**Blocking Types:**
| Type | Meaning | Example |
|------|---------|---------|
| `blocks` (default) | B can't start until A closes | Task ordering |
| `parent-child` | Children blocked when parent blocked | Epic hierarchies |
| `conditional-blocks` | B runs only if A fails | Error handling |
| `waits-for` | B waits for all of A's children | Fanout aggregation |

**Non-Blocking Types:**
| Type | Meaning |
|------|---------|
| `related` | Informational link |
| `tracks` | Tracks progress of another |
| `discovered-from` | Found during work on another |
| `caused-by` | Root cause link |
| `validates` | Test/verification link |
| `supersedes` | Replaces another |

**Cross-Repo Dependencies (lines 150-159):**
```bash
bd dep add local-issue external:other-project:remote-issue
```
External deps always block; `bd ready` checks at query time.

**Gates (lines 161-277):**

**Problem Gates Solve (lines 167-182):**
- With Dolt, issue state decoupled from code state (PR not merged but beads issue closed)
- Gate delays dependency until external condition met

**Gate Types (lines 184-191):**
| Type | Condition | Auto-Resolution |
|------|-----------|---|
| `gh:pr` | PR merged | `gh pr view` = MERGED |
| `gh:run` | CI passes | `gh run view` = completed + success |
| `timer` | Time elapsed | Current time > timeout |
| `bead` | Cross-rig issue closed | Remote bead status checked |
| `human` | Manual approval | `bd gate resolve <id>` |

**Creating Gates (lines 194-215):**
```bash
bd create --type=gate --title="Wait for PR #42" --await-type=gh:pr --await-id=42
bd create --type=gate --title="Wait for CI" --await-type=gh:run --await-id=12345
bd create --type=gate --title="Cooldown" --await-type=timer --await-id=30m
bd create --type=gate --title="Manual approval"
```

**Checking & Resolving Gates (lines 227-241):**
```bash
bd gate check [--type=gh:pr|gh:run|timer] [--dry-run] [--escalate]
bd gate resolve <gate-id> --reason "..."
bd gate discover [--dry-run] [--branch main]  # Auto-match to GitHub Actions runs
```

### 5.4 labels.md (lines 1-793)

**Design Philosophy (lines 8-23):**

**Structured Fields** (core workflow):
- Status: `open`, `in_progress`, `blocked`, `closed`
- Priority: 0-4
- Type: `bug`, `feature`, `task`, `epic`, `chore`

**Labels** (everything else):
- Technical metadata: `backend`, `frontend`, `api`, `database`
- Domain/scope: `auth`, `payments`, `search`
- Effort: `small`, `medium`, `large`
- Quality gates: `needs-review`, `needs-tests`, `breaking-change`
- Team/ownership: `team-infra`, `team-product`
- Release tracking: `v1.0`, `v2.0`, `backport-candidate`

**Label Commands (lines 25-58):**
```bash
bd create "Title" -l auth,backend,urgent  # On create
bd label add bd-42 security
bd label add bd-42 security,breaking-change  # Multiple
bd label list bd-42  # View
bd label remove bd-42 urgent
bd label list-all  # All in use with counts
bd list --label backend,auth  # AND filter
bd list --label-any frontend,backend  # OR filter
```

**Querying (lines 183-216):**
- `--label backend,urgent` = AND (all specified)
- `--label-any frontend,backend` = OR (at least one)
- Mix both: `bd list --label backend --label-any urgent,release-blocker`

**Labels as State Cache Pattern (lines 449-574):**

**Convention:** `<dimension>:<value>`

Examples:
```
patrol:muted      patrol:active
mode:degraded     mode:normal
status:idle       status:working
health:healthy    health:failing
```

**Operational Pattern:**
1. Create event bead (immutable, audit trail)
2. Update role bead's labels (fast state lookup)

**Key Principle:** Events = source of truth; Labels = cache

### 5.5 metadata.md (lines 1-91)

**Extension Point:**
- `metadata` field stores arbitrary JSON on issues
- Preferred for integration, orchestrator, or team-specific data
- Avoid adding first-class fields; use metadata first

**Agent Execution Metadata Convention (lines 25-46):**
| Key | Meaning |
|-----|---------|
| `execution_agent_type` | Suggested worker class (explorer, worker, mixed) |
| `execution_suggested_model` | Model tier suggestion |
| `execution_reasoning_effort` | Reasoning level (low, medium, high, xhigh) |
| `execution_mode` | local, delegated, or staged |
| `execution_parallel_group` | Grouping hint for parallel work |

**Properties:**
- Advisory metadata, not core issue fields
- Take precedence over prose for execution routing
- Portable hints (map to consumer's scale if different)
- Parent/orchestrator agents must read before spawning subagents

**Tracker Round-Trip Example (lines 56-76):**
```json
{
  "example_tracker": {
    "board_id": "ENG",
    "sprint_id": 42,
    "remote_type": "story"
  }
}
```

**Reserved Key Prefixes (lines 78-85):**
- `bd:` = Beads internal use
- `_` = Internal/private keys

### 5.6 hash-ids.md (lines 1-139)

**Problem (lines 8-25):**
- Sequential IDs (#1, #2, #3) break with concurrent agents or branch merges
- Multiple agents create #7 simultaneously → collision on merge

**Solution (lines 27-42):**
- Hash-based IDs (`bd-a1b2c3`, `bd-f14c`, `bd-a3f8e9.1`)
- Globally unique (content-based)
- No coordination needed
- Merge-friendly across branches
- Predictable length (configurable)

**How Hashes Work (lines 43-56):**
- Generated from: title + timestamp + random salt
- Deterministic for same content+timestamp

**Hierarchical IDs (lines 58-76):**
```bash
bd create "Auth System" -t epic  # bd-a3f8e9
bd create "Design UI" --parent bd-a3f8e9  # bd-a3f8e9.1
bd create "Backend" --parent bd-a3f8e9  # bd-a3f8e9.2
```

**ID Configuration (lines 78-92):**
```bash
bd config set id.prefix myproject  # default: bd
bd config set id.hash_length 6  # default: 4
```

**Collision Handling (lines 94-105):**
- Automatic detection on import
- Disambiguator appended
- Both issues preserved

### 5.7 adaptive-ids.md (lines 1-220)

**Adaptive Length Scaling (lines 6-13):**
| Database Size | ID Length | Collision Probability |
|---|---|---|
| 0-500 | 4 chars | ~7% at 500 |
| 501-1500 | 5 chars | ~2% at 1500 |
| 1501+ | 6 chars | continues scaling |

**Birthday Paradox Formula (lines 18-28):**
```
P(collision) ≈ 1 - e^(-n²/2N)
```
Where n = issues, N = possible IDs (36^length for alphanumeric)

**Configuration (lines 49-82):**
```bash
bd config set max_collision_prob "0.25"  # default: 25%
bd config set min_hash_length "4"  # default: 4
bd config set max_hash_length "8"  # default: 8
```

**Collision Resolution (lines 38-43):**
- Base length
- Base + 1
- Base + 2
- 10 nonces per length = 30 attempts total

**Alternative: Sequential Counter IDs (lines 193-214):**
- `bd config set issue_id_mode counter`
- Human-friendly numbering
- Require care in multi-branch (counters diverge)

### 5.8 graph-links.md (lines 1-283)

**Link Types (lines 8-155):**

**replies-to — Threading**
- Message threads (agent-to-agent, issue follow-ups)
- One-way link
- View with: `bd show gt-a1b2 --thread`

**relates-to — Loose Associations**
- Bidirectional "see also" links
- Created: `bd relate <id1> <id2>`
- Removed: `bd unrelate <id1> <id2>`
- Multiple links per issue allowed

**duplicates — Deduplication**
- Marks issue as duplicate of canonical
- Duplicate auto-closed
- Created: `bd duplicate <id> --of <canonical>`
- Schema field: `duplicate_of`

**supersedes — Version Chains**
- Old issue superseded by newer
- Old issue auto-closed
- Created: `bd supersede <old-id> --with <new-id>`
- Schema field: `superseded_by`

**Comparison with Dependencies (lines 215-223):**
| Link Type | Blocking? | Hierarchical? | Direction |
|---|---|---|---|
| `blocks` | Yes | No | One-way |
| `parent_id` | No | Yes | One-way |
| `relates-to` | No | No | Bidirectional |
| `replies-to` | No | No | One-way |
| `duplicate_of` | No | No | One-way |
| `superseded_by` | No | No | One-way |

### 5.9 sync-concepts.md (lines 1-71)

**Canonical Source of Truth:**
- Local Dolt database is source for `bd list`, `bd show`, `bd ready`, every write
- `.beads/issues.jsonl` is export only (not database, not sync protocol, not backup)

**Wire Format (lines 9-26):**
```bash
bd dolt push  # to git remote refs/dolt/data
bd dolt pull  # from git remote refs/dolt/data
```
- Dolt remote auto-detected from git origin on `bd init`
- Separate from source branches (refs/heads/main)
- Fresh clones run `bd bootstrap` to clone Dolt history

**Anti-Pattern (lines 28-35):**
- Don't use `bd import .beads/issues.jsonl` as routine sync (upsert-only)
- Cannot infer deletions or pruned records
- Incompatible with version-controlled database

**Hooks Behavior (lines 37-44):**
- Pre-commit: refreshes `.beads/issues.jsonl` if `export.auto=true`
- Post-merge / post-checkout: skip JSONL import if `sync.remote` configured
- Fallback import for old projects (prints warning)

**Repair Pattern (lines 46-70):**
- Identify authoritative Dolt database first
- `bd dolt remote add origin <url>`
- `bd dolt push`
- Other machines: `bd dolt pull` or `bd bootstrap`

---

## 6. docs/multi-agent/ — All Files

### 6.1 index.md (lines 1-74)

**Multi-Agent Features (lines 10-13):**
- **Routing:** Automatic issue routing to correct repositories
- **Cross-repo dependencies:** Dependencies across repo boundaries
- **Agent coordination:** Work assignment and handoff

**Routing** (lines 17-22):
- Decides which repo a new bead lands in based on role
- Explicit `--repo` flag always wins

**Work Assignment (lines 25-32):**
```bash
bd assign bd-42 agent-1        # Assign to agent
bd update bd-42 --claim        # Atomic: assignee + in_progress
bd ready --claim --json        # Claim first ready match
```

**Cross-Repo Dependencies (lines 34-40):**
```bash
bd dep add bd-42 external:other-repo:api-ready
```

### 6.2 coordination.md (lines 1-184)

**Work Assignment (lines 8-39):**
```bash
bd assign bd-42 agent-1  # Assign to specific agent
bd update bd-42 --claim  # Atomically claim (sets assignee + in_progress)
bd ready --claim --json  # Claim first ready match
bd unclaim bd-42         # Release
bd list --assignee agent-1 --status in_progress  # View assigned
```

**Handoff Patterns:**

**Sequential (lines 43-55):**
- Agent A completes, assigns to Agent B
- Agent B claims and picks up

**Parallel (lines 57-72):**
- Coordinator assigns to multiple agents
- Each claims and works independently
- Coordinator monitors progress

**Fan-Out / Fan-In (lines 74-97):**
- Split into parent-child tasks
- Assign to different agents
- Use dependencies for merge point:
  ```bash
  bd dep add bd-merge bd-epic.1
  bd dep add bd-merge bd-epic.2
  bd dep add bd-merge bd-epic.3
  ```

**Merge Slots (lines 120-137):**
- Exclusive-access primitive for conflict-prone work
- One agent holds at a time
- Commands:
  ```bash
  bd merge-slot create
  bd merge-slot check
  bd merge-slot acquire
  bd merge-slot release
  ```

**Communication (lines 139-159):**
- **Via Comments:** `bd comment bd-42 "..."` / `bd comments bd-42`
- **Via Labels:** `bd update bd-42 --add-label "needs-review"` / `bd list --label-any needs-review`

**Cross-Repo (lines 161-172):**
```bash
bd dep add bd-42 external:backend:api-ready
```

### 6.3 federation.md (lines 1-224)

**Overview (lines 10-18):**
- Peer-to-peer sync via Dolt remotes
- No central server
- Database-native versioning
- Flexible infrastructure (DoltHub, S3, GCS, local, SSH)
- Data sovereignty tiers for compliance

**Prerequisites (lines 20-22):**
- Dolt backend required (only supported backend for federation)

**Configuration (lines 26-41):**
```yaml
federation:
  remote: dolthub://myorg/beads
  sovereignty: T2
```

**Data Sovereignty Tiers (lines 43-50):**
| Tier | Description | Use Case |
|---|---|---|
| T1 | No restrictions | Public data |
| T2 | Organization-level | Regional/company compliance |
| T3 | Pseudonymous | Identifiers removed |
| T4 | Anonymous | Maximum privacy |

**Adding Peers (lines 54-112):**
```bash
bd federation add-peer <name> <endpoint>
```

**Supported Endpoint Formats (lines 66-75):**
| Format | Example |
|--------|---------|
| DoltHub | `dolthub://org/repo` |
| Google Cloud | `gs://bucket/path` |
| Amazon S3 | `s3://bucket/path` |
| Local | `file:///path/to/backup` |
| HTTPS | `https://host/path` |
| SSH | `ssh://host/path` |
| Git SSH | `git@host:path` |

**Syncing (lines 127-148):**
```bash
bd federation sync [--peer town-beta] [--strategy theirs|ours]
bd federation status [--peer town-beta]
```

**Topologies (lines 149-159):**
| Pattern | Description | Use Case |
|---------|-------------|----------|
| Hub-spoke | Central hub, satellites sync to hub | Centralized coordination |
| Mesh | All peers sync with each other | Decentralized |
| Hierarchical | Tree of hubs | Multi-team |

### 6.4 routing.md (lines 1-288)

**The Problem (lines 15-24):**
- Fork OSS project, every planning bead pollutes fork's database
- When PR opens, fork's `.beads/` data diverges from upstream
- Want to plan freely ABOUT project, not IN project

**Solution (lines 25-28):**
- Auto-detect role (maintainer or contributor)
- Redirect `bd create` to separate planning repo (`~/.beads-planning` default)
- Never pushed upstream

**Routing Decision Order (lines 31-48):**
1. `--repo <path>` — explicit override, always wins
2. `routing.mode: auto` — route by detected role
3. `routing.default` — everything else (defaults to `.`)

**Role Detection (lines 50-74):**
- Source of truth: `beads.role` in git config
- Fallback heuristic (deprecated warning):
  - Fork workflow (origin ≠ upstream) → contributor
  - SSH origin or credentialed HTTPS → maintainer
  - Plain HTTPS without credentials → contributor
  - No remote → maintainer

**Setup for Contributors (lines 78-108):**
```bash
bd init --contributor
```
Wizard:
1. Creates planning repo (`~/.beads-planning`)
2. Sets `routing.mode: auto` and `routing.contributor`
3. Adds planning repo to `repos.additional` (hydration)
4. Points sync at upstream remote

**Setup for Teams (lines 110-121):**
```bash
bd init --team
```

**Configuration Reference (lines 127-144):**
| Key | Default | Meaning |
|---|---|---|
| `routing.mode` | unset | `auto` routes by role; `explicit` ignores role |
| `routing.default` | `.` | Target when auto off |
| `routing.maintainer` | `.` | Target for maintainers in auto |
| `routing.contributor` | `~/.beads-planning` | Target for contributors in auto |
| `repos.primary` | unset | Primary repo for hydration |
| `repos.additional` | unset | Repos to hydrate from |
| `beads.role` | unset | Explicit: `maintainer` or `contributor` |

**Multi-Repo Hydration (lines 168-200):**
- Routing writes to another repo → current database doesn't contain them
- Hydration imports from other repos, tagged with `source_repo`
- Configure: `repos.additional` list
- Commands:
  ```bash
  bd repo add ~/.beads-planning
  bd repo list
  bd repo sync  # Import from additional repos
  bd repo remove ~/.beads-planning
  ```
- Hydrated beads are ordinary rows; filter by `source_repo` or link with dependencies

**One Agent, Many Projects (lines 202-227):**
- Run **single** MCP server instance:
  ```json
  {"beads": {"command": "beads-mcp", "args": []}}
  ```
- Server resolves workspace from each request's working directory
- Don't run per-project instances (operations land in wrong database)
- Alternative: `bd init --shared-server` for shared Dolt server at `~/.beads/shared-server/`

**Discovered Issues Inheritance (lines 156-166):**
- Issues with `discovered-from` dependency inherit parent's `source_repo`
- Work discovered during task execution stays attributed to same repo
- Add `--repo` to override

### 6.5 multi-repo-migration.md (lines 1-489)

**When to Use Multi-Repo (lines 27-38):**

**You DON'T need if:**
- Solo project
- Trusted team with shared repo
- All issues belong in git history

**You DO need if:**
- Contributing to OSS (don't pollute upstream)
- Fork workflow (planning shouldn't appear in PRs)
- Multiple phases (design vs. implementation repos)
- Multiple personas (architect vs. implementer)

**Core Concepts (lines 40-79):**

**Source Repository (`source_repo`):**
- Every issue has `source_repo` field
- `.` = Current repo
- `~/.beads-planning` = Contributor planning
- `/path/to/repo` = Absolute path

**Auto-Routing:**
- Maintainers: issues in current repo
- Contributors: issues in `~/.beads-planning`

**Multi-Repo Hydration:**
- Aggregate from multiple repos into unified database
- `bd list --json` shows all

**OSS Contributor Workflow (lines 81-166):**
```bash
bd init --contributor  # Wizard setup
# OR manually:
mkdir -p ~/.beads-planning
cd ~/.beads-planning
git init
bd init --prefix plan

cd ~/projects/project
bd config set routing.mode auto
bd config set routing.contributor "~/.beads-planning"
bd config set repos.additional "~/.beads-planning"
```

Daily:
- Create planning issues (auto-routed)
- View all: `bd ready`, `bd list --json`
- Work, complete, close
- PR only contains code (no `.beads/` pollution)

**Team Workflow (lines 168-230):**
- Team lead: `bd init --team`
- Team members: auto-detect maintainer role, create in shared repo
- Optional: personal planning repo with `--repo` override
- Shared sync: `bd dolt push`

**Multi-Phase Development (lines 232-281):**
- Separate repos: `myapp-planning`, `myapp-implementation`, `myapp-maintenance`
- Initialize each phase: `bd init --prefix phase`
- Aggregate in implementation: `bd config set repos.additional "~/myapp-planning,~/myapp-maintenance"`
- Link across phases: `bd dep add impl-42 plan-10 --type blocks`

**Multiple Personas (lines 283-325):**
- Separate repos: `architect-planning`, `implementer-tasks`
- Aggregate in implementer: `bd config set repos.additional "~/architect-planning"`

**Backward Compatibility (lines 429-454):**
- Multi-repo is opt-in
- Old issues in local database still work
- Disable: `bd config unset routing.mode`, `bd config unset repos.additional`

---

## 7. docs/workflows/ — Representative Files

### 7.1 index.md (lines 1-41)

**Workflow Layers (lines 14-27):**

| Phase | What it is | Lifecycle |
|-------|-----------|-----------|
| **Proto** (solid) | Template epic with `{{variables}}` + `template` label | Reusable, not live work |
| **Molecule** (liquid) | Persistent beads poured from proto | Synced like any bead |
| **Wisp** (vapor) | Ephemeral instantiation | Excluded from federation; deleted by `bd purge` |

**Three Phases (lines 22-28):**
```bash
bd formula list                       # Formulas visible on search paths
bd cook release.formula.toml          # Compile formula → proto
bd mol pour release --var version=1.2.0  # Instantiate real work (molecule)
bd ready --mol <mol-id>               # Which steps can run right now
```

### 7.2 formulas.md (lines 1-251)

**Format Options (lines 10-74):**
- TOML (preferred)
- JSON

**TOML Structure (lines 13-45):**
```toml
formula = "feature-workflow"
description = "..."
version = 1
type = "workflow"

[vars.feature_name]
description = "Name of the feature"
required = true

[[steps]]
id = "design"
title = "Design {{feature_name}}"
type = "human"
description = "Create design document"

[[steps]]
id = "implement"
title = "Implement {{feature_name}}"
needs = ["design"]
```

**Formula Types (lines 76-82):**
| Type | Description |
|------|-------------|
| `workflow` | Standard step sequence |
| `expansion` | Template for expansion |
| `aspect` | Cross-cutting concerns |

**Variables (lines 84-105):**
```toml
[vars.version]
description = "Release version"
required = true
pattern = "^\\d+\\.\\d+\\.\\d+$"

[vars.environment]
description = "Target environment"
default = "staging"
enum = ["staging", "production"]
```

**Step Types (lines 107-112):**
- Issue type of created bead: `task` (default), `bug`, `feature`, `epic`, `chore`
- Gates (async waits) expressed via `[steps.gate]` block, not type

**Dependencies (lines 114-144):**

**Sequential (lines 116-126):**
```toml
needs = ["step1"]  # This step needs step1 complete
```

**Parallel then Join (lines 131-143):**
```toml
needs = ["test-unit", "test-integration"]  # Waits for both
```

**Gates (lines 146-164):**
```toml
[[steps]]
id = "approval"
title = "Manager approval"
type = "human"

[steps.gate]
type = "human"
approvers = ["manager"]
```

**Aspects (lines 166-180):**
```toml
formula = "security-scan"
type = "aspect"

[[advice]]
target = "*.deploy"

[advice.before]
id = "security-scan-{step.id}"
title = "Security scan before {step.title}"
```

**Locations (lines 182-188):**
1. `.beads/formulas/` (project-level)
2. `~/.beads/formulas/` (user-level)

### 7.3 molecules.md (lines 1-292)

**What is a Molecule (lines 10-27):**
- Epic with execution intent
- Persistent instances of protos (cooked formulas)
- Steps with dependencies as parent-child beads
- Under the hood: just an epic

**Terminology (lines 20-26):**
| Term | Meaning |
|------|---------|
| **Epic** | Parent with children (general) |
| **Molecule** | Epic with execution intent |
| **Proto** | Epic with `template` label (reusable) |

**Creating Molecules (lines 29-57):**

**From Formula:**
```bash
bd cook release.formula.toml
bd mol pour release --var version=1.0.0
```

**Without Formula:**
```bash
bd create "Feature X" -t epic
bd create "Design" -t task --parent <epic-id>
bd create "Implement" -t task --parent <epic-id>
bd dep add <implement-id> <design-id>
```

**Finding Molecules (lines 59-65):**
```bash
bd mol current           # Where you are in current molecule
bd mol stale             # Complete-but-still-open molecules
bd mol wisp list         # Ephemeral molecules
```

**Viewing (lines 67-73):**
```bash
bd mol show <molecule-id>
bd mol show <molecule-id> --parallel  # Highlight concurrent steps
bd dep tree <molecule-id>
```

**Execution Model (lines 76-97):**
- Children parallel by default
- Only explicit dependencies create sequence
- Loop:
  1. `bd ready --mol <molecule-id>`
  2. `bd update <id> --claim`
  3. Do work
  4. `bd close <id>`
  5. Repeat

**Dependency Types (lines 99-111):**
| Type | Blocks? | Use |
|------|---------|-----|
| `blocks` | Yes | Sequencing |
| `parent-child` | Yes (if parent blocked) | Hierarchy |
| `conditional-blocks` | Yes | Error paths |
| `waits-for` | Yes | Fan-in gates |
| `related`, `discovered-from`, `replies-to` | No | Annotations |

**Lifecycle (lines 162-186):**
```
Formula → bd cook → Proto → bd mol pour → Molecule → work → Completed
→ optional cleanup → Closed / Squashed / Burned
```

Closing last child does NOT close root — epics stay open as close-eligible work. Cleanup:
- `bd mol squash <id>` — condense to permanent digest
- `bd mol burn <id>` — delete outright

**Bonding (lines 188-223):**
```bash
bd mol bond A B                    # B depends on A (sequential)
bd mol bond A B --type parallel    # B runs alongside A
bd mol bond A B --type conditional # B runs if A fails
```

Polymorphic over operands:
| Operands | What happens |
|----------|--------------|
| proto + proto | Compound proto (reusable) |
| proto + molecule | Spawns proto as new issues, attached |
| molecule + molecule | Joins into compound |
| formula + anything | Cooks formula inline |

**Dynamic Bonding (lines 214-222):**
```bash
bd mol bond mol-worker-arm bd-patrol --ref arm-{{name}} --var name=ace
# Creates: bd-patrol.arm-ace
```

**Agent Pitfalls (lines 256-265):**
1. Temporal language inverts dependencies ("Phase 1 before Phase 2" → backwards)
2. Numbered steps don't create sequence (need explicit deps)
3. Forgetting to close work (blocked forever if not closed)

---

## 8. Files Inventory Summary

### docs/workflows/ — All Files (not fully read)
- `index.md` — FULLY READ
- `formulas.md` — FULLY READ (representative 1/2)
- `molecules.md` — FULLY READ (representative 2/2)
- `gates.md` — listed, not read (gates covered in dependencies.md)
- `wisps.md` — listed, not read
- `todo.md` — listed, not read

### Core Concepts Fully Read
- `index.md` (165 lines)
- `issues.md` (181 lines)
- `dependencies.md` (330 lines)
- `labels.md` (793 lines)
- `metadata.md` (91 lines)
- `hash-ids.md` (139 lines)
- `adaptive-ids.md` (220 lines)
- `graph-links.md` (283 lines)
- `sync-concepts.md` (71 lines)

### Multi-Agent Fully Read
- `index.md` (74 lines)
- `coordination.md` (184 lines)
- `federation.md` (224 lines)
- `routing.md` (288 lines)
- `multi-repo-migration.md` (489 lines)

---

## Issue Model Enums & Constants

### Status Values (core-concepts/index.md:32)
- `open`
- `in_progress`
- `blocked`
- `closed`
- `deferred` (additional from AGENT_INSTRUCTIONS.md visual design)

### Priority Levels (0-4, from issues.md:42-48)
- 0: Critical
- 1: High
- 2: Medium (default)
- 3: Low
- 4: Backlog

### Issue Type Values (index.md:32, issues.md:32-38)
- `bug`
- `feature`
- `task` (default)
- `epic`
- `chore`
- (Also from CLI: `message`, `gate`, `event`, `role` — see types CLI)

### Dependency Type Values (dependencies.md:36-63)

**Blocking:**
- `blocks` (default)
- `parent-child`
- `conditional-blocks`
- `waits-for`

**Non-Blocking:**
- `related`
- `tracks`
- `discovered-from`
- `caused-by`
- `validates`
- `supersedes`
- `replies-to` (implied from graph-links.md)
- `duplicates` (implied from graph-links.md)

### Gate Type Values (dependencies.md:184-191)
- `gh:pr`
- `gh:run`
- `timer`
- `bead`
- `human`

### ID Format
- `bd-a1b2` (4-char hash, smallest)
- `bd-a3f8e9` (6-char, standard)
- `bd-a3f8e9.1` (hierarchical child)
- `bd-a3f8e9.1.1` (up to 3 levels)
- Configurable prefix (default: `bd`)
- Adaptive length scaling (4-8 chars based on database size)

### Workflow Lifecycle Phases (workflows/index.md:23-27)
- **Proto:** Solid (template, reusable)
- **Molecule:** Liquid (persistent instantiation)
- **Wisp:** Vapor (ephemeral)

### Data Sovereignty Tiers (federation.md:43-50)
- T1: No restrictions
- T2: Organization-level
- T3: Pseudonymous
- T4: Anonymous

---

## Agent-Facing Protocol Summary

### Ready Work Computation (core-concepts/index.md:49-73)
`bd ready` returns open beads with:
- No open blocking dependencies
- Not in_progress (claimed)
- Not blocked or deferred
- Not held by gate
- Excludes anything with unresolved `blocks`, `parent-child`, `conditional-blocks`, or `waits-for` edges

### Atomic Claim (AGENTS.md:line 76)
```bash
bd update <id> --claim
```
Sets `assignee` + `status=in_progress` atomically; first claim wins; repeat idempotent.

### Memory/Context (AGENTS.md:lines 79, README.md:lines 56-57)
```bash
bd remember "insight"  # Persistent project memory
bd prime               # Print workflow context + remembered insights
```

### Sync Protocol (AGENTS.md:line 232, README.md:lines 62-66)
```bash
bd dolt push   # After session work, push Dolt history to remote
bd dolt pull   # Before session, pull latest
```

### Discovered Work Pattern (AGENTS.md:line 187, core-concepts/dependencies.md)
```bash
bd create "Found bug" --deps discovered-from:bd-abc
```
Links new work to parent; inherits parent's `source_repo` under routing.

### Output Format (AGENTS.md:line 249)
Always use `--json` flag for programmatic access:
```bash
bd list --json
bd show bd-42 --json
bd ready --claim --json
```

### Session Completion (AGENTS.md:lines 121-159)
1. File remaining work
2. Run quality gates (tests, lint)
3. Update issue status
4. Push to remote (git & Dolt)
5. Clean up stashes & remote refs
6. Hand off next task

---

## Unresolved or Noteworthy Gaps

1. **CLI Reference Depth:** AGENT_INSTRUCTIONS.md directs to `/cli-reference/index` for full commands, but only high-level command patterns are documented in agent-facing docs. Implementation details deferred to 130+ CLI subcommand files (listed but not read).

2. **Workflow Features Not Fully Documented:**
   - `bd gate discover` auto-matching heuristics (dependencies.md:258-268)
   - `bd mol distill` (extract formula from epic) — mentioned once, not detailed
   - `bd swarm` for epic fan-out (coordination.md:94-97, marked as future)
   - Aspect transformations and bond points (molecules.md:224-236)

3. **Storage Backends Mentioned But Not Detailed:**
   - PostgreSQL, MySQL, SQLite (README.md:144-146) — deferred to `/architecture/storage-backends`
   - Only Dolt backend has versioning; others omit history

4. **Migration Tooling:**
   - `bd migrate-personal` (routing.md:100-101) — moves beads by git identity
   - `bd migrate --to-hash-ids` (adaptive-ids.md:171-176) — migration from sequential
   - Minimal detail on execution; see CLI reference

5. **Agent Type System:**
   - Execution metadata keys (`execution_agent_type`, etc.) advisory only
   - No enforcement or validation schema yet (metadata.md:line 54)

6. **Compaction/Memory Decay:**
   - README.md:65 mentions semantic summarization of old closed tasks
   - No detailed algorithm in core-concepts; deferred to operational docs

7. **Federation Conflict Resolution:**
   - `bd federation sync --strategy theirs|ours` (federation.md:135)
   - Without `--strategy`, pauses & reports conflicts
   - Manual resolution process not documented

---

## Status: DONE

**Summary:** Complete mechanical inventory of beads issue model, dependency semantics, agent-facing protocol, multi-agent patterns, and workflow system. All core-concepts and multi-agent files read in full; workflows section sampled (2 of 5 representative files). Issue types, priorities, statuses, dependency types, gate types, ID formats, and lifecycle phases enumerated verbatim with line numbers.

**Concerns:** None. Coverage meets scope requirements. Some operational details deferred to separate reference documents (CLI, architecture, recovery); these boundaries are intentional per project structure.
