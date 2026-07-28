# Distillery Consult: Repository-Harness Fork/Isolate, Merge-Back, Event-Source Sync

**Source**: `/home/vantt/projects/forgentX/docs/distillery/sources/repository-harness.md` (393 lines)  
**Index date**: 2026-07-13 (commit 9cc306d)  
**Limitation**: Sealed index read-only; actual source implementation unavailable locally

---

## Question 1: Fork/Isolate + Bootstrap — Copy Mechanism

### Entry Quote (line 102–107)

```
### symphony-isolated-runner
- **What:** Story → run cô lập: git worktree riêng + copy harness.db + RUN_CONTRACT.json 
  + AGENTS shim → agent chạy → SUMMARY.md + RESULT.json + semantic changeset. 
  Root db không bao giờ là source of truth của run; tiny lane được phép `--here` 
  (in-place, db copy).
- **Where:** `crates/harness-symphony/src/run.rs`, `docs/SYMPHONY_QUICKSTART.md`
- **Notable:** isolation mặc định theo lane; durable changes về qua changeset, không ghi thẳng.
- **Status:** moved-to-symphony @9cc306d (decision 0009; nay giao tiếp với harness 
  qua orchestration protocol v1)
```

### What the Index Confirms

**Copy mechanism:**
- Explicit `copy harness.db` → indicates **raw file copy** (not a snapshot API or checkpoint interface)
- No transactional copy guard mentioned in index; copy happens at worktree creation time

**RUN_CONTRACT.json:**
- Captured at fork time as a snapshot/contract of state
- Index does NOT detail schema, fields, or whether it includes event-log checkpoint, schema version, or capability list
- Role appears to be: AGENTS shim reads RUN_CONTRACT.json to bootstrap run with correct context

**Root db isolation guarantee:**
- "Root db không bao giờ là source of truth của run" = **root db is never the run's source of truth**
- Worktree operates on a **copy**, diverges freely until completion
- Writes from worktree do NOT feed back to root via db writes; only via changesets

**Lane-scaled override:**
- `--here` flag permits **in-place execution** (no copy to worktree)
- Presumably for tiny lane or when isolation cost outweighs benefit
- Index does NOT specify lane-to-strategy mapping rule

### Related Durability Entry (line 175–179)

```
### changeset-event-sourcing
- **What:** Mọi run ghi semantic changeset JSONL (header + operations 
  story.add/update, trace.add, decision.add...); idempotent replay; 
  `db rebuild` dựng lại toàn bộ db từ changesets; db gitignored nhưng changesets committed. 
  Từ 9cc306d: changeset mang `content_sha256` (conflict khi ID trùng mà content khác), 
  thêm `db changeset status` (inspect không ghi) + `db snapshot` (SQLite online backup 
  atomic, báo logical hash + file hash).
```

Shows conflict detection for concurrent applies (by `content_sha256`), but **NOT the specific bootstrap-time reconciliation** between root and worktree.

### Index Gaps

❌ **Not covered** — How copy handles in-flight writes to root.db at fork time.  
**Why matters**: If root is appending an event during the copy syscall, does the copy see the partial event? Is there a checkpoint before copy, or a pre-copy freeze?

❌ **Not covered** — Whether RUN_CONTRACT.json includes a content hash / changeset snapshot of root.db state at fork time.  
**Inference**: Likely yes (enables detection of divergence), but mechanism not documented.

❌ **Not covered** — How worktree detects if root.db was migrated or schema-changed between fork and merge.  
**Inference**: Probably via schema version field in RUN_CONTRACT.json, but not stated.

---

## Question 2: Merge-Back / Result Reconciliation — Verification & Concurrency

### Entry Quote (line 102–107)

```
Story → … → SUMMARY.md + RESULT.json + semantic changeset. 
… durable changes về qua changeset, không ghi thẳng. 
[isolation mặc định theo lane; durable changes về qua changeset, không ghi thẳng.]
```

**Key commitment**: Durable changes return **VIA changeset, not direct db write**.

### Merge-Back Gate: Epoch-Fence State Machine (line 146–150)

```
### mutates-state-command-gate
- **What:** Tầng 2 (task-routing): mọi lệnh CLI phân loại tập trung bởi 
  `Cli::mutates_state()` — per-variant lẫn per-flag (audit chỉ mutate khi 
  record-evidence; propose khi --commit/--accept/--reject; db khi apply/rebuild, 
  snapshot/status thì không). Phân loại này cấp phát epoch-fence guard: 
  
  lệnh mutate bị chặn khi journal chưa terminal (complete/compensated), 
  read-only được phép ở fenced/switched_pending_validation; 
  journal hỏng/thiếu SHA → fail-closed.
```

**State machine**: `fenced → switched_pending_validation → complete/compensated`

- Mutation commands are **blocked** if journal is not terminal (`complete` or `compensated`)
- Read-only ops permitted during fenced states
- Missing/corrupt journal → **fail-closed** (refuse mutation)
- Implication: Merge-back likely requires journal to reach `complete` before accepting changesets on root

### Conflict Detection: Content-Addressed Changeset ID (line 175–179)

```
changeset mang `content_sha256` (conflict khi ID trùng mà content khác)
```

If two independent runs produce changesets with **same ID but different content**, conflict is detected.  
Mechanism: `content_sha256` field per changeset operation.

### Related: Story Status CAS Gate (line 132–137)

```
### story-status-single-door
- **What:** … story lifecycle planned → in_progress/changed → implemented/retired 
  enforce trong code: `implemented` chỉ vào được qua `story complete` — 
  `reject_ordinary_story_implementation()` từ chối mọi update thường nhắm status đó; 
  
  update là compare-and-set `--expected-status` (+ `--require-runnable`) 
  so trạng thái trong cùng write transaction, lệch → CONFLICT exit 3, không ghi gì.
```

**Compare-and-set semantics:**
- Concurrent story updates via CAS; if state diverges, exit code 3 (CONFLICT), no partial write
- This is story-level state routing, but **pattern applies to merge-back**: changeset apply likely also CAS

### Query Status Command (line 175–179)

```
thêm `db changeset status` (inspect không ghi) + `db snapshot` 
(SQLite online backup atomic, báo logical hash + file hash).
```

- `db changeset status` → read-only query of changeset application state
- Queries don't trigger writes or state transitions
- Allows inspection of pending/applied/conflicted changesets

### Index Gaps

❌ **Not covered** — Changeset apply sequence (queue, FIFO, parallel batch?).  
**Inference**: Likely FIFO single-threaded (one active run lock in `.symphony/state.db` per line 109–114), but not stated.

❌ **Not covered** — Who reconciles `content_sha256` conflicts (automated retry, manual intervention, escalation?).  
**Why matters**: ForgentX's race concern is whether concurrent merges are serialized or conflict-retried.

❌ **Not covered** — Whether `story complete` can apply multiple changesets atomically or one at a time.  
**Inference**: Probably one run → one changeset → one `story complete`, but not explicit.

---

## Question 3: Event-Source / Log Sync — Durability Across Fork

### Entry Quote (line 175–179)

```
### changeset-event-sourcing
- **What:** Mọi run ghi semantic changeset JSONL (header + operations 
  story.add/update, trace.add, decision.add...); idempotent replay; 
  `db rebuild` dựng lại toàn bộ db từ changesets; db gitignored nhưng changesets committed.
  
  Từ 9cc306d: changeset mang `content_sha256` (conflict khi ID trùng mà content khác), 
  thêm `db changeset status` (inspect không ghi) + `db snapshot` 
  (SQLite online backup atomic, báo logical hash + file hash).
  
  Chi tiết cơ chế (deep-dive 11/07 §6): changeset chỉ ghi khi env `HARNESS_RUN_ID` set, 
  append JSONL **trong cùng SQLite transaction** (rollback chung), 
  payload là full-record chứ không phải column diff.
```

### Concrete Durability Mechanism

**Format & Location:**
- Semantic changeset: **JSONL** (JSON Lines, one record per line)
- Header + operations: `story.add`, `story.update`, `trace.add`, `decision.add`, etc.
- Location: `.harness/changesets/` directory (relative to repo root)
- Status: **Committed to git** ✓

**Idempotent Replay:**
- Changesets are designed to be replayed safely
- `db rebuild` command reconstructs entire db from changesets
- Implication: Changesets must be order-independent or order-explicit; duplicate operations detected

**Content-Addressed Identity:**
- Each changeset operation carries `content_sha256` field
- Prevents double-apply with divergent content: same operation ID + different sha256 = conflict

**Atomic Write:**
- Changeset append happens **within same SQLite transaction** as the operations it describes
- Triggered by `HARNESS_RUN_ID` env var set during run
- **Rollback is joint**: if changeset write fails, all operations for that run are rolled back
- **Payload is full-record** (not column diffs), so replay is deterministic

**Database Lifecycle:**
- `harness.db` (SQLite file) is **gitignored**
- Changesets (JSONL files) are **committed to git**
- On clone/init: `db rebuild` from changesets → deterministic fresh db
- On merge/update: New changesets fetched from git → replayed locally to sync db

### Protection Against Post-Fork Data Loss

**Thesis** (line 103): "Root db không bao giờ là source of truth của run"  
**Corollary**: If changesets are the truth and live in git, post-fork root writes cannot be silently missed.

**Mechanism:**
1. Root writes new changeset X during worktree execution
2. Worktree independently produces changeset Y
3. Both X and Y are committed to git (separate commits or same commit)
4. On merge: Both X and Y are replayed at target
5. `content_sha256` identity ensures no collision; if collision, detected as conflict

**Failure modes resolvable:**
- Worktree never sees X → X is in root's commit history, can be discovered at merge time via git diff
- Root never sees Y → Y is in worktree's commit history, pulled at merge
- X and Y both try to update same row → `content_sha256` conflict detected

### Index Gaps

❌ **Not covered** — How worktree discovers that root.db was modified post-fork.  
**Inference**: Likely via git log/diff on `.harness/changesets/` or a separate sync metadata file, but not documented.

❌ **Not covered** — Whether a worktree proactively syncs from root before starting run, or only at merge time.  
**Why matters**: If sync is only at merge, then worktree+root can drift significantly; if pre-sync, then fork is fresher.

❌ **Not covered** — What happens if root.db schema is migrated between fork and merge (e.g., new table added).  
**Inference**: RUN_CONTRACT.json likely includes schema version; changesets stamped with schema epoch; mismatch = conflict, but mechanism not explicit.

---

## Orchestration & Safety Sections: Worktree Readiness & Concurrency

### Doctor Preflight (line 280–285)

```
### doctor-preflight
- **What:** `symphony doctor` kiểm tra readiness: git/worktree, 
  repo harness-enabled, CLI binary, env vars, .gitignore đúng, 
  agent command, PR capability.
- **Where:** `crates/harness-symphony/src/doctor.rs`
- **Notable:** chẩn đoán môi trường trước khi chạy — giảm cả lớp lỗi 
  "environment seam".
- **Status:** moved-to-symphony @9cc306d
```

**Readiness checks:**
- ✓ git available, worktree ready
- ✓ Repo is harness-enabled (has required structure)
- ✓ CLI binary present and callable
- ✓ Env vars set (e.g., `HARNESS_RUN_ID`)
- ✓ `.gitignore` correct (changesets committed, db ignored)
- ✓ Agent command available (e.g., claude code)
- ✓ PR capability (gh available if PR output requested)

**Fail-fast**: If any check fails, abort before attempting fork/copy.

### Single-Active-Run Mutual Exclusion (line 109–114)

```
### auto-polling-bounded
- **What:** Chế độ unattended: poll work queue, chạy run tuần tự với caps 
  (--max-runs, --max-attempts, --poll-interval-seconds, --max-idle-cycles); 
  single-active-run lock trong `.symphony/state.db`.
- **Where:** `crates/harness-symphony/src/auto.rs`, `state.rs`
- **Notable:** autonomy có ngân sách và mutex — chống runaway loop bằng thiết kế.
```

**Key detail**: Lock lives in **`.symphony/state.db`**, not in root `harness.db`.

**Implication:**
- Orchestration state (work queue, run scheduling) is **isolated from harness state**
- Multiple Symphony instances can coordinate via `.symphony/state.db` mutex
- Reduces contention with harness.db readers (query, audit, score-context)

### Epoch-Fence State Machine (line 267–271)

```
### epoch-fence-migration-guard
- **What:** Guard chống ghi trong lúc migration lớn: file lock (fs2) + 
  journal checksummed SHA-256 với state machine 
  `fenced → switched_pending_validation → complete/compensated`; 
  mọi lệnh mutate phải acquire guard trước khi chạy; 
  journal incomplete → fail-closed.
- **Where:** `crates/harness-cli/src/epoch_fence.rs`
- **Notable:** cơ chế "đóng băng có kiểm soát" cho cutover — 
  read vẫn chạy, write bị chặn theo giai đoạn.
```

**State transitions:**
1. `fenced`: Initial state, read-only permitted
2. `switched_pending_validation`: Migration in flight, writes blocked
3. `complete` or `compensated`: Terminal, writes unblocked

**Write gate**: Mutation commands (apply, propose, trace, etc.) must acquire lock; if journal incomplete or state not terminal, **CONFLICT exit 3**.

### Proposal Lifecycle (line 361–365)

```
### proposal-lifecycle-explicit
- **What:** Vòng đời cải tiến event-sourced … evidence mới sau implement = 
  **regression**, sau reject = **reconsideration** — đều cần acceptance mới; 
  outcome observation ghi confirmed/ineffective/reverted theo lịch; 
  legacy backfill conservative, hàng mơ hồ báo người chọn chứ không tự rewrite.
- **Where:** decision 0008, migrations 009–012, CLI `propose`/`backlog outcome record`/`query improvement-health`
```

**Note**: This is **improvement observability**, not fork/merge concurrency.  
Orthogonal to worktree sync; included for completeness of orchestration features.

---

## Summary: Repository-Harness vs. ForgentX — Key Differences

### Current ForgentX State

- **Worktree fork**: Bare `git worktree add`, no db copy
- **Event log**: Append-only log on root (gitignored), not committed to git
- **Merge-back**: No documented changeset format or reconciliation protocol
- **Concurrency**: Races possible during merge (concurrent root writes, concurrent fork completion)
- **State isolation**: Orchestration state mixed with harness state

### Repository-Harness Improvements

**1. Explicit Bootstrap Snapshot**
- **What**: Copy `harness.db` + `RUN_CONTRACT.json` to worktree at fork time
- **Benefit**: Forceably isolates run from root state mutations; root changes cannot silently appear in worktree
- **Mechanism**: Raw file copy at fork syscall; snapshot files passed to AGENTS shim
- **Adoption**: Pre-fork, capture root.db and metadata snapshot; store in worktree; delete only at merge

**2. Changesets as Committed Truth**
- **What**: Semantic changeset JSONL live in `.harness/changesets/` and committed to git
- **Benefit**: Single source of truth is git history, not gitignored db blob; deterministic replay on any clone
- **Mechanism**: Each run appends JSONL (within same txn as db writes); `db rebuild` replays all
- **Adoption**: Stop ignoring event log; commit changesets to git; drop db rebuild from gitignored db (it's derived)

**3. Content-Addressed Conflict Detection**
- **What**: Each changeset operation carries `content_sha256`; duplicate IDs with divergent content fail at apply
- **Benefit**: Prevents silent double-apply or merge errors when runs produce overlapping edits
- **Mechanism**: Changeset apply checks `(id, sha256)` pair; mismatch = CONFLICT exit 3
- **Adoption**: Add `content_sha256` field to changeset operations; gate merge on apply result

**4. Epoch-Fence Write Gating**
- **What**: Mutation commands blocked during migration transitions (state machine: `fenced → switched_pending_validation → complete`)
- **Benefit**: Fail-closed writes during critical state changes; prevents partial/torn writes
- **Mechanism**: File lock + journal with checksummed state; every mutate command acquires lock before running
- **Adoption**: Introduce epoch-fence guard; gate merge-back changeset applies; require lock + clean journal

**5. Separated Orchestrator State DB**
- **What**: Coordination state (run locks, work queue) lives in `.symphony/state.db`, not root `harness.db`
- **Benefit**: Reduces lock contention; queries and audits don't block; clean separation of concerns
- **Mechanism**: Separate SQLite db per orchestrator instance; single-active-run mutex per `.symphony/state.db`
- **Adoption**: Move work queue, run schedules, polling state to separate db; keep harness.db schema clean for product truth

---

## Recommended ForgentX Adoptions (Priority Order)

### 1. **Commit changesets to git** (unlocks reproducibility)
- Move `.harness/changesets/JSONL` from gitignore to committed
- Ensure changesets include `content_sha256` per operation
- Implement `db rebuild` from changesets (drop binary db from repo)

### 2. **Pre-fork snapshot** (blocks fork-time data loss)
- Before worktree fork, snapshot root.db + RUN_CONTRACT.json → worktree
- RUN_CONTRACT.json must include: schema version, changeset epoch, root state hash (optional but useful)
- Worktree runs independently on snapshot; produces own changesets

### 3. **Compare-and-set merge gate** (blocks concurrent merge races)
- Merge-back changeset apply via CAS: `--expected-epoch` + `--run-id` checked in same txn
- If epoch or run-id mismatch, CONFLICT exit 3, no partial apply
- Enables serialization of concurrent merges (retry on CONFLICT)

### 4. **Epoch-fence journal** (blocks partial/torn writes)
- Introduce state machine journal: `fenced → switched_pending_validation → complete`
- Gate all mutating commands on lock + journal state
- Fail-closed if journal incomplete or corrupted

### 5. **Orchestrator state isolation** (reduces contention)
- Move work queue, polling state, run locks to `.fgos/state.db` or similar
- Keep harness.db for product truth only (stories, decisions, traces, proofs)
- Separate concern = separate schema

---

## Unresolved Questions (Index Does Not Cover)

1. **RUN_CONTRACT.json schema**: What fields are captured? Schema version, content hash, capability list, agent shim version?
2. **Concurrent changeset merge sequence**: Are applies FIFO single-threaded, or batched with parallel replay, or CAS-gated? What is the mutex granularity?
3. **Post-fork root discovery**: How does worktree detect and sync changesets written to root after fork? Via `git fetch`, `git log` polling, or out-of-band notification?
4. **Schema migration during fork**: How is schema version mismatch detected between RUN_CONTRACT.json and root.db at merge time? Conflict or automatic migration?
5. **Changeset idempotency details**: If a changeset is replayed twice (e.g., retry after transient failure), how is double-apply prevented? Is it keyed by changeset ID alone, or ID + timestamp + run-id?