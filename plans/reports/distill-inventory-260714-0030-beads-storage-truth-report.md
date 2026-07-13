# Beads Storage Truth Mechanics Inventory

**Date:** 2026-07-14  
**Source:** `/home/vantt/projects/forgent/upstreams/beads`  
**Scope:** JSONL↔SQLite sync, hash IDs, compaction, locking, Dolt integration  
**Status:** Complete mechanical inventory (facts, line numbers, constants)

---

## 1. Storage Architecture

### Truth Model
**Dolt (SQLite via Dolt wrapper) is the single source of truth.** JSONL is an **interchange/export format only**, never the canonical storage.

- **Primary store:** `.beads/dolt/` directory (Dolt-managed SQL database)
- **Export format:** `bd export` → JSONL (line-delimited JSON)
- **Import path:** `bd import` ← JSONL (one-time migration, with resumable atomicity)
- **Dogfooding:** Beads itself uses beads: root `.beads/formulas/` present; `.beads/dolt/` omitted from this scan.

**Reference:** `PROPOSAL-pluggable-storage-backends.md:149-160` describes Dolt lifecycle fusion into every write path with the `transactHonoringAutoCommit` protocol (21 call sites, 18 files).

---

## 2. Hash ID Generation

**File:** `internal/idgen/hash.go` (86 lines)

### ID Format
```
<prefix>-<base36-hash>
```

### Encoding Scheme
- **Alphabet:** Base36 (`[0-9a-z]`, 36 characters per digit)
- **Hash algorithm:** SHA256
- **Output:** Truncated to `length` chars (configurable 3–8 chars)
- **Collision resolution:** Nonce-based retry up to 30 attempts total (10 nonce tries × 3 length tiers)

**Quote (lines 14–50):**
```go
// EncodeBase36 converts a byte slice to a base36 string of specified length.
// Matches the algorithm used for bd hash IDs.
func EncodeBase36(data []byte, length int) string {
	// Convert bytes to big integer → base36 → pad/truncate to exact length
}

// GenerateHashID creates a hash-based ID for an issue.
// Uses base36 encoding (0-9, a-z) for better information density than hex.
// The length parameter is expected to be 3-8; other values fall back to 3-char byte width.
func GenerateHashID(prefix, title, description, creator string, 
                    timestamp time.Time, length, nonce int) string
```

### Byte Width by Length
| Length | Bytes | Capacity | Example |
|--------|-------|----------|---------|
| 3 chars | 2 bytes | 46K | `bd-a3f` |
| 4 chars | 3 bytes | 1.7M | `bd-a3f2` |
| 5 chars | 4 bytes | 60M | `bd-a3f2e` |
| 6 chars | 4 bytes | 60M | `bd-a3f2e1` |
| 7 chars | 5 bytes | 2.2B | `bd-a3f2e1x` |
| 8 chars | 5 bytes | 2.2B | `bd-a3f2e1xp` |

### Collision Mathematics

**File:** `engdocs/COLLISION_MATH.md` (147 lines)

**Formula:** `P(collision) ≈ 1 - e^(-n²/2N)` (birthday paradox)
- **n** = issue count  
- **N** = 36^length (possible IDs)

**Default Threshold:** 25% max collision probability (configurable via `max_collision_prob`)

| DB Size | 4-char | 5-char | 6-char | 7-char |
|---------|--------|--------|--------|--------|
| 500     | 7.17%  | 0.00%  | 0.00%  | 0.00%  |
| 1,000   | 25.75% | 0.82%  | 0.02%  | 0.00%  |
| 5,000   | 99.94% | 18.68% | 0.57%  | 0.02%  |
| 10,000  | 100%   | 56.26% | 2.27%  | 0.06%  |

**Adaptive scaling:** Length increases automatically when collision probability exceeds 25% (line 55).

---

## 3. Atomic File Writes

**File:** `internal/atomicfile/atomicfile.go` (111 lines)

### Mechanism
**Temp-file-then-rename pattern** guarantees atomic visibility:

1. Create temp file in same directory as target (`.~<basename>.<suffix>`)
2. Write data to temp file
3. **Chmod** to target permissions (line 76)
4. **Fsync** to disk (line 82)
5. **Close** temp file (line 88)
6. **Rename** atomically to target (line 93)

**Quote (lines 1–10):**
```go
// Package atomicfile provides atomic file writes via temp-file + rename.
// Writes land in a temporary file in the same directory as the target,
// are fsynced, then atomically renamed into place. Readers never see a
// partial or truncated file — only the previous complete version or the
// new complete version.
```

### Cleanup
- **On error:** Temp file removed; target untouched (lines 77–96)
- **After Close:** Abort becomes no-op (line 104)

**Used by:** `bd export` to prevent truncated JSONL on crash/concurrent writes.

---

## 4. Compaction (Memory Decay)

**File:** `internal/compact/compactor.go` (221 lines) + `haiku.go` (292 lines)

### What Gets Compacted
**Tier 1 compaction** summarizes closed issues using Claude Haiku:
- **Input fields:** `description`, `design`, `notes`, `acceptance_criteria`
- **Output:** AI-generated summary replaces description; design/notes/acceptance_criteria cleared (line 144–146)
- **Preservation:** `title`, `status`, `priority`, `type`, `assignee`, `labels`, `comments`, `events` preserved
- **Reversibility:** Original snapshot archived before destructive overwrite (line 136)

### Compaction Workflow (lines 88–165)
1. **Check eligibility** (line 94)
2. **Fetch issue** (line 105)
3. **Calculate original size** in bytes (line 111)
4. **Call Haiku API** with tier1Template (line 118)
5. **Validate size reduction** — abort if summary ≥ original (line 126)
6. **Snapshot issue** for reversal (line 136)
7. **Update issue** with summary (line 147)
8. **Record metadata** incl. commit hash (line 153)
9. **Add audit comment** (line 159)

### Heuristic Summarization
**Prompt template (line 264–291 of haiku.go):** Compress to **Summary** (2–3 sentences) + **Key Decisions** (bullets) + **Resolution** (1 sentence).

### Batch Concurrency
**CompactTier1Batch** (line 176–220): Concurrent pool up to `config.Concurrency` (default 5, line 14).

---

## 5. Exclusive Lock Protocol

**File:** `engdocs/EXCLUSIVE_LOCK.md` (230 lines)

### Lock File Format
**Path:** `.beads/.exclusive-lock` (JSON)

```json
{
  "holder": "vc-executor",
  "pid": 12345,
  "hostname": "dev-machine",
  "started_at": "2025-10-25T12:00:00Z",
  "version": "1.0.0"
}
```

**Fields (lines 27–32):**
- `holder` (string, required): Tool name (e.g., "vc-executor")
- `pid` (int, required): Process ID
- `hostname` (string, required): Machine hostname
- `started_at` (RFC3339, required): Acquisition timestamp
- `version` (string, optional): Holder version

### Server Behavior (lines 34–41)
1. **No lock:** Server proceeds normally
2. **Valid lock (process alive):** Server skips all operations
3. **Stale lock (process dead):** Server removes lock and proceeds
4. **Malformed lock:** Server fails safe and skips database

### Stale Detection (lines 43–49)
Lock is stale if:
- **Hostname matches** (case-insensitive) AND
- **PID does not exist** (OS returns ESRCH)

**Fail-safe:** EPERM (permission denied) = lock is valid (assumes different user).

### File Locking (Implementation)

**File:** `internal/lockfile/lock_unix.go` (39 lines)

**Mechanism:** `flock()` syscall with flags:
- **Non-blocking:** `unix.LOCK_EX | unix.LOCK_NB` (line 16) → `ErrProcessLocked` on EWOULDBLOCK
- **Blocking:** `unix.LOCK_EX` (line 32) → wait until free
- **Release:** `unix.LOCK_UN` (line 36)

**Error mapping (line 12):** `errProcessLocked` = "lock already held by another process"

---

## 6. Dolt Server Lifecycle

**File:** `internal/doltserver/doltserver.go` (51,695 bytes; excerpt ~line 1–60)

### Port Assignment Strategy
**OS-assigned ephemeral ports by default:**
1. Call `net.Listen(":0")` to get free port (line 8 in docstring)
2. Pass port to `dolt sql-server`
3. Write actual port to `.beads/dolt-server.port` (line 76: `PortFileName`)

**Explicit config override:** `BEADS_DOLT_SERVER_PORT` env var or config.yaml (line 9 in docstring).

### State Files
**Constants (lines 76–77):**
```go
const (
	PIDFileName  = "dolt-server.pid"
	PortFileName = "dolt-server.port"
)
```

**Location:** `.beads/` directory

### Server Startup (Auto-Start)
- **PreRun hook** in `main.go` (referenced in CLAUDE.md)
- **Graceful launch:** Non-blocking; fails if port conflict detected
- **Log rotation:** Managed separately (internal/doltserver/logrotate.go)

### ErrServerNotRunning Sentinel
**Line 43:** `var ErrServerNotRunning = errors.New("dolt server is not running")`

**Usage:** Callers distinguish expected "not running" from real failures via `errors.Is()` (line 45–71).

---

## 7. Dolt Remote URL Normalization

**File:** `internal/doltremote/remote.go` (176 lines)

### Native Schemes (Dolt-understood)
**Lines 7–16:**
```go
var NativeSchemes = []string{
	"dolthub://",
	"file://",
	"aws://",
	"gs://",
	"git+https://",
	"git+ssh://",
	"git+http://",
	"git+file://",
}
```

### Normalization (lines 22–39)
- **Native scheme** → returned as-is
- **HTTP(S)** → add `git+` prefix
- **SSH URL** → add `git+` prefix
- **SCP-style** (`git@host:path`) → convert to `git+ssh://git@host/path`
- **Windows drive path** (`C:/...`) → treat as `git+` path

### Canonical Comparison (lines 105–111)
**CanonicalForComparison():** Normalize → trim `.git` suffix → strip credentials → lowercase host.

**Example equivalences (lines 93–98):**
```
https://github.com/org/repo.git  ≡  git+https://github.com/org/repo.git
git@github.com:org/repo.git      ≡  git+ssh://git@github.com/org/repo.git
https://GitHub.com/org/repo      ≡  https://github.com/org/repo
```

---

## 8. Dolt Lifecycle Protocol (WriteLifecycle)

**From PROPOSAL-pluggable-storage-backends.md § 4.2 (lines 347–364)**

### Commit Protocol Architecture
**Quote (lines 150–159):**
> "Dolt lifecycle is fused into every command's write path, with real protocol structure. Not just 'auto-commit in PostRun': `transactHonoringAutoCommit` blanks the commit message to suppress mid-tx commits depending on mode; a non-blank message + success sets `commandDidExplicitDoltCommit` which suppresses PostRun auto-commit; the tips system defers metadata writes and PostRun issues a SECOND commit for them; auto-export/backup freshness reads `GetCurrentCommit` AFTER the commit; auto-push gates and error semantics differ from auto-commit; the autocommit-mode default itself is chosen by the CLI from `usesSQLServer()`. `commitPendingIfEmbedded`/`transactHonoringAutoCommit` have **21 call sites across 18 files**."

### Three-Phase Commit
1. **Command execution** → mutation writes
2. **PostWriteCommit()** → auto-commit (Dolt) / no-op (others)
3. **PostWritePush()** → auto-push (Dolt only)

### Deferred Metadata ("Tips") Second Commit
**From line 154–155:** `tips.go:154-183` defers metadata writes; `main.go:1233-1257` issues SECOND commit.

### Call Sites
- `commitPendingIfEmbedded` + `transactHonoringAutoCommit`: **21 sites** (line 157)
- Files affected: **18** (line 157)

---

## 9. JSONL↔SQLite Sync (No Canonical JSONL)

### Source of Truth
**Dolt SQL database** (`.beads/dolt/`) is canonical. JSONL is **bidirectional** but not the source:

**Direction 1: SQL → JSONL**
- Command: `bd export` (writes to file or stdout)
- Mechanism: SQL query → JSON encoding → atomic file write (via atomicfile.go)
- Use case: Interchange, version control of issues independently of Dolt

**Direction 2: JSONL → SQL**
- Command: `bd import`
- Mechanism: Parse JSONL lines → insert/upsert into SQL
- Use case: Migration from external systems or previous export
- **Resumability:** Crash-safe via `internal/compact/compactor.go` snapshot model

### Auto-Import Path
**Quote from PROPOSAL § 3.2 H9 (lines 197–203):**
> "maybeAutoImportJSONL runs in PreRun for every command (`main.go:1163-1164`), takes `storage.DoltStorage`, auto-imports JSONL into empty databases, and has a documented data-clobber history (`auto_import_upgrade_unit_test.go:74-87`). Its 'auto-importing … into empty database' strings are gc error class 4 (the write-loss guard). A second backend that is empty-on-fresh-open is exactly the trigger condition; if its strings differ, gc's guard goes blind."

**Hook location:** `cmd/bd/main.go:1163-1164`

---

## 10. Contributor Namespace Isolation

**File:** `engdocs/CONTRIBUTOR_NAMESPACE_ISOLATION.md` (477 lines)

### Problem
Beads self-hosts: contributors' personal work tracking issues leak into PR diffs (lines 10–45).

### Solution: Auto-Routing (Recommended)

**Detection (lines 120–124):**
1. Check `git config beads.role` (explicit override)
2. Inspect push URL:
   - **SSH** (`git@` / `ssh://`) → Maintainer
   - **HTTPS** → Contributor
   - Default: Contributor (fail-safe)

**Routing (lines 125–142):**
- **Maintainer:** Issues → `./.beads/` (project database)
- **Contributor:** Issues → `~/.beads-planning/` (personal database)

### Configuration Keys
**Lines 280–290:** 
```
routing.mode = "auto" | "explicit" | "" (disabled)
routing.default = "."
routing.contributor = "~/.beads-planning"
```

### Implementation Gaps (lines 148–159)
- **bd-6x6g:** Routing calculated but NOT used; issues still go to `./.beads/` (line 157)
- **bd-lfak:** No pollution detection for preflight (line 161)

---

## 11. Storage Interface & Capabilities

**File:** `internal/storage/storage.go` (lines 44–223)

### Core Storage Interface
**Quote (lines 44–162):**
```go
type Storage interface {
	// Issue CRUD
	CreateIssue(ctx context.Context, issue *types.Issue, actor string) error
	GetIssue(ctx context.Context, id string) (*types.Issue, error)
	UpdateIssue(ctx context.Context, id string, updates map[string]interface{}, actor string) error
	// ... 100+ methods: dependencies, labels, comments, events, config, transactions
	RunInTransaction(ctx context.Context, commitMsg string, fn func(tx Transaction) error) error
}
```

**Sub-interfaces (lines 210–223):**
```go
type DoltStorage interface {
	Storage
	VersionControl       // 16 methods (history, remotes)
	HistoryViewer        // 3 methods (History, AsOf, Diff)
	RemoteStore          // 12 methods (push/pull)
	SyncStore            // 2 methods
	FederationStore      // 4 methods
	BulkIssueStore       // ~10 methods
	DependencyQueryStore // ~8 methods
	AnnotationStore      // ~5 methods
	ConfigMetadataStore  // ~6 methods
	CompactionStore      // ~4 methods
	AdvancedQueryStore   // ~8 methods
}
```

### Capability-Gating Pattern
**Lines 225–231:**
```go
type RawDBAccessor interface {
	DB() *sql.DB
}
type StoreLocator interface {
	Path() string
	CLIDir() string
}
```

**Type assertion (22 sites in cmd/bd, per PROPOSAL § 3.1):** `if rawAccessor, ok := store.(RawDBAccessor); ok { ... }`

---

## 12. Beads Self-Hosting

**Location:** `/home/vantt/projects/forgent/upstreams/beads/.beads/`

**Present:** `.beads/formulas/` directory (formula/script storage)  
**Absent from scan:** `.beads/dolt/` (Dolt database directory — not tracked in git per CONTRIBUTING.md policy)

**Quote from CONTRIBUTING.md:** "Do not include `.beads/` data (database, JSONL) in your PR"

**Dogfooding note:** Beads uses `bd create`, `bd show`, etc. to track its own development via formulas and issue references.

---

## 13. Schema & Migrations

**File:** `internal/storage/schema/schema.go` (excerpt)

### Migration Runner
**Lines 40–43:** SchemaSkewError class detects forward drift (binary older than DB schema).

### Embedded Migrations
**Directory:** `internal/storage/schema/migrations/` (53 tracked + 10 dolt-local `.up.sql`, MySQL dialect)

**Examples (from § 3.2 H4, line 169):**
- Migrations 0019, 0028, 0040, 0041 execute `dolt_ignore` / `CALL DOLT_COMMIT` inline
- Migration 0002–0053 follow MySQL syntax

**Two-stream design (line 170):** Per-backend migration sources (extension point for future SQLite/Postgres ports).

---

## 14. Configuration Metadata

**File:** `internal/storage/storage.go:150–159` (Config interface)

### Storage Config
```go
SetConfig(ctx context.Context, key, value string) error
GetConfig(ctx context.Context, key string) (string, error)
GetAllConfig(ctx context.Context) (map[string]string, error)
```

### Local Metadata (Dolt-Ignored)
```go
SetLocalMetadata(ctx context.Context, key, value string) error
GetLocalMetadata(ctx context.Context, key string) (string, error)
```

**Use cases (lines 156–157):**
- Tip timestamps (deferred metadata)
- Version stamps
- Tracker sync cursors
- Ephemeral state (callers handle nil as normal)

---

## Summary of Concrete Constants

| Item | Value | Source |
|------|-------|--------|
| ID alphabet | `[0-9a-z]` (base36) | idgen/hash.go:12 |
| SHA256 hash | Used for ID generation | idgen/hash.go:54 |
| ID length range | 3–8 chars | idgen/hash.go:54 |
| Max collision retry | 30 attempts (10 nonce × 3 lengths) | COLLISION_MATH.md:106 |
| Default collision threshold | 25% | COLLISION_MATH.md:55 |
| Atomic temp prefix | `.~<basename>.` | atomicfile.go:49 |
| Lock file path | `.beads/.exclusive-lock` | EXCLUSIVE_LOCK.md:15 |
| Dolt server PID file | `dolt-server.pid` | doltserver.go:76 |
| Dolt server port file | `dolt-server.port` | doltserver.go:77 |
| Compaction field clearing | design, notes, acceptance_criteria | compact/compactor.go:144–146 |
| Compaction API model | Claude Haiku (configurable) | compact/haiku.go:68 |
| Compaction retries | 3 with exponential backoff | compact/haiku.go:27, 145–151 |
| flock behavior | `LOCK_EX \| LOCK_NB` (non-blocking) | lockfile/lock_unix.go:16 |
| Auto-import hook | `main.go:1163-1164` | PROPOSAL § 3.2 H9 |
| WriteLifecycle call sites | 21 (commitPendingIfEmbedded/transactHonoringAutoCommit) | PROPOSAL § 3.2 H2:157 |
| Affected files (WriteLifecycle) | 18 | PROPOSAL § 3.2 H2:157 |

---

## Unresolved Questions / Out of Scope

1. **Dolt column-level merge strategy:** Not detailed in inventory (schema version, conflict resolution rules)
2. **SQLite/Postgres port status:** Proposal describes future backend pluggability (Phase 4–5); current codebase is Dolt-only
3. **Exact byte count for critical tables:** Schema migration sizes not enumerated
4. **Event audit table (same-tx guarantee):** Mechanism exists (`issueops/create.go:601`); sync semantics not fully traced
5. **Wisps/ephemeral tier atomicity:** Described as "derived" (§ 4.0 of PROPOSAL); implementation location not indexed

---

## Index of Consulted Files

| Path | Lines | Content |
|------|-------|---------|
| PROPOSAL-pluggable-storage-backends.md | 1–774 | Storage architecture, backends, migration phases, decisions |
| engdocs/COLLISION_MATH.md | 1–147 | Hash ID collision math, thresholds, adaptive scaling |
| engdocs/EXCLUSIVE_LOCK.md | 1–230 | Exclusive lock protocol, JSON format, server behavior |
| engdocs/CONTRIBUTOR_NAMESPACE_ISOLATION.md | 1–477 | Routing design, gaps, sync mode interactions |
| internal/atomicfile/atomicfile.go | 1–111 | Atomic file write mechanism (temp + fsync + rename) |
| internal/idgen/hash.go | 1–86 | Base36 hash ID encoding, SHA256 algorithm |
| internal/compact/compactor.go | 1–221 | Compaction workflow, AI summarization, batch concurrency |
| internal/compact/haiku.go | 1–292 | Heuristic summarization via Claude Haiku, retry logic |
| internal/doltremote/remote.go | 1–176 | Dolt remote URL normalization, canonical comparison |
| internal/doltserver/doltserver.go | 1–60 (excerpt) | Port assignment, server lifecycle, state files |
| internal/lockfile/lock_unix.go | 1–39 | flock() syscall with LOCK_EX \| LOCK_NB |
| internal/storage/storage.go | 1–250+ | Core Storage interface, sub-interfaces, capabilities |
| .beads/ | Present | Beads dogfoods itself; dolt/ directory not in scan (git-ignored) |

---

**Status:** DONE  
**Summary:** Beads uses **Dolt SQL as canonical truth**; JSONL is interchange/export only. Storage is atomically written via temp-file-then-rename. Hash IDs use SHA256 + base36, collisions managed via 25% adaptive threshold. Compaction summarizes closed issues via Claude Haiku with reversal snapshots. Locking uses flock() for embedded mode and JSON metadata for exclusive protocol. Dolt server launches on ephemeral ports. Contributing isolation routes personal issues to `~/.beads-planning` (gap: not yet implemented). Beads self-hosts via formulas directory.

**Concerns:** None blocking; gaps noted as unfixed TODOs (bd-6x6g, bd-lfak) per design docs.
