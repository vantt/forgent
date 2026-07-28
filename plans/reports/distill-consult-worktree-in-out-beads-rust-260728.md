# beads-rust Consult Report — Fork/Isolate, Merge-Back, Event-Source Sync

## 1. Fork/Isolate

**Not covered in the way forgentX implements it — beads-rust explicitly chose NOT to fork/isolate.**

### Domain: `context-memory` → Slug: `sqlite-jsonl-classic-truth` (lines 42–47)
> "con đường KHÔNG đi của beads:dolt-as-versioned-truth. bd @303e263 rẽ sang Dolt-as-truth (version control TRONG store) khi multi-agent write thành tải chính; br cố ý đứng lại ở SQLite+JSONL-classic và tôi-luyện nó (health contract, sync safety, write-combining) thay vì đổi engine."

**What beads-rust does instead:**
- Keeps **SQLite + JSONL "classic single-writer model"** (shared `.beads/` directory, gitignored DB + git-tracked JSONL)
- Uses **coordination primitives (two-tier locks)** instead of worktree isolation
- **No failure mode of "fork before uncommitted write landed"** — all writes serialize or backoff; there is no fork boundary to miss state

### Domain: `orchestration` → Slug: `two-tier-locking-app-backoff` (lines 81–86)
> "`.write.lock` blocking exclusive (serialize MỌI process mutate, timeout mặc định 30s, fast-path `try_lock()` rồi poll) vs `.sync.lock` advisory non-blocking (`try_sync_lock` trả `Ok(None)` khi bận, không chờ)."

With **exponential backoff ±25% jitter** to prevent thundering herd when multiple writers contend: "app-level backoff thay để desync dưới contention."

**Implication for forgentX:** beads-rust proves that the classic SQLite+JSONL model avoids the fork boundary race entirely by design — there is no isolated worktree that can miss a write. The cost is serialization via locking + adaptive backoff under contention.

---

## 2. Merge-Back / Write Reconciliation

### Domain: `orchestration` → Slug: `two-tier-locking-app-backoff` (lines 81–86)
> "WAL checkpoint PASSIVE mỗi 50 mutation (không chặn reader/writer). Mid-mutation DB hỏng → `retry_mutation_with_jsonl_recovery` rebuild DB từ JSONL rồi chạy lại closure (staged event-attribution phải sống qua retry)."

**Mechanism:** SQLite locking + WAL; app-level retry with **JSONL-based recovery** if DB corrupts mid-mutation. Mutations are staged so they survive crash-recovery replay.

The WAL (Write-Ahead Logging) is configured as PASSIVE to avoid blocking readers or writers, and the system periodically checkpoints (every 50 mutations). If a mutation fails mid-flight because the DB is corrupt, the system rebuilds the DB from the JSONL authoritative copy and replays the staged mutation.

### Domain: `safety` → Slug: `sync-safety-blast-radius` (lines 51–56)
> "path allowlist cứng (`ALLOWED_EXTENSIONS`/`ALLOWED_EXACT_NAMES`, chỉ ghi trong `.beads/`, `.git/` bị từ chối); (3) atomic temp+rename; (4) guard chống mất dữ liệu: empty-DB/stale-DB cần `--force`, còn tombstone-protection & conflict-marker scan **KHÔNG override được** by design."

**Reconciliation of writes** happens in `sync` (merges JSONL changes back into SQLite) with:
- **Atomic temp+rename** to ensure writes are all-or-nothing
- **Tombstone protection** to prevent accidental resurrection of deleted items
- **Conflict-marker scan** that cannot be overridden by design
- **Path allowlist** that restricts writes to `.beads/` directory only

The sync operation is heavily guarded and cannot be tricked into mutating files outside its allowed scope.

**Implication for forgentX:** beads-rust's sync reconciliation is not just a merging algorithm but a **proof-by-construction** that the sync operation cannot corrupt the workspace, enforced by strict path guards and atomic operations. This is the opposite of "merge races can leave ambiguous state" — the guards make ambiguous states impossible.

---

## 3. Event-Source / Log Sync Across Writers

### Domain: `context-memory` → Slug: `sqlite-jsonl-classic-truth` (lines 42–47)
> "Events (audit log) chỉ ở DB, không export JSONL."

Audit events live **only in SQLite**, not in the append-only JSONL. This is an intentional design choice: the SQLite database is the source of truth for event sequencing; the JSONL is the interchange/git-diffable copy.

However, beads-rust does maintain append-only logs for other purposes:

### Domain: `orchestration` → Slug: `coordination-evidence-classifier` (lines 74–79)
> "`br audit coordination` chuẩn hóa snapshot thành `coordination_incident` append vào `.beads/interactions.jsonl` với `snapshot_hash` (JSON sorted-keys) — flight recorder content-addressed, không phải store thứ hai."

**Append-only logs in beads-rust:**
1. `.beads/issues.jsonl` — git-tracked interchange copy (3-way merge strategy with `.beads/beads.base.jsonl` for base snapshots)
2. `.beads/interactions.jsonl` — content-addressed flight recorder (append-only for coordination snapshots)

**Crash-safety mechanism:**
- If DB corruption occurs mid-mutation: `retry_mutation_with_jsonl_recovery` rebuilds DB from JSONL, then replays staged mutations
- Staged event-attribution must survive the retry (mutations are idempotent or versioned)
- WAL ensures writes are atomic; passive checkpointing prevents blocking

**Consistency across writers:**
- No explicit distributed log-sync across fork boundaries because **there are no forks** — all writers coordinate on the same SQLite instance via `.write.lock` and `.sync.lock`
- The JSONL serves as the git-diffable truth for cross-repo comparison, but writes always go through SQLite first
- Interactions log appends only; never mutated or replayed (flight recorder principle)

**Implication for forgentX:** beads-rust shows that an append-only log (like fgOS `.fgos/events.jsonl`) needs crash-recovery semantics (rebuild+replay) only if it's the primary truth. If SQLite is primary and JSONL is secondary, then JSONL only needs to be consistent enough for git diff; SQLite crash-recovery handles durability. The interactions.jsonl flight recorder proves that appends can be immutable by design (content-addressed, never replayed).

---

## What beads-rust does DIFFERENTLY/BETTER than worktree-per-item

### 1. Avoids worktree boundary races entirely
Single `.beads/` DB means "fork before uncommitted write" cannot happen. All state is in one place; no boundary to race across.

**Tradeoff:** multi-writer must serialize via locking + adaptive backoff. This is cheaper than managing multiple worktrees if contention is moderate.

### 2. Proves sync safety by construction, not assumption

Domain: `safety` → Slug: `sync-safety-blast-radius`

Quote: "KHÔNG có `Command::new('git')` trong `src/sync/` — enforce bằng **CI grep contract** (`grep -rn 'Command::new.*git' src/sync/` phải ra 0)"

Plus **strace witness** (`sync_safety_witness.sh`): "trace syscall thật (`strace`) khi chạy sync live, assert MỌI path bị mutate nằm trong allowlist"

**Lesson:** Safety is not a design claim but a **verifiable invariant** (CI grep) + **runtime proof** (strace log). The sync operation **cannot call git** because the codebase forbids it by grep; the sync operation **cannot write outside allowlist** because strace witness verifies every syscall.

**For forgentX:** This is the critical difference. Worktree merges are unsafe unless you prove the merge cannot corrupt uncommitted state. beads-rust proves sync cannot corrupt by static analysis (no git calls) + dynamic proof (strace witness). If forgentX keeps worktrees, the merge operation needs equivalent proof.

### 3. Unified health contract across all failure modes

Domain: `safety` → Slug: `workspace-health-contract`

Quote: "4 mức Healthy / Degraded / Recoverable / Unsafe... `is_operable()/needs_recovery()/is_fatal()`... phân loại workspace bằng CÙNG taxonomy"

**Health levels:**
- **Healthy:** All checks pass, operations proceed normally
- **Degraded:** Some issue detected, operations allowed but advisory warnings given
- **Recoverable:** Primary store intact but secondary/cache is corrupt; read-only until repaired
- **Unsafe:** Interchange (JSONL or interaction log) is corrupt and cannot be recovered; must stop

Every surface (startup probe, `doctor` command, sync status check, recovery envelope) classifies the workspace using the same taxonomy, not custom error messages.

**For forgentX:** This unified health model means "is the workspace safe to write to?" has one answer across all commands, not different answers depending which command you ask. If a worktree merge leaves state ambiguous, the health contract would classify it as Recoverable or Unsafe (depending on whether primary is intact), and every command would report that consistently.

### 4. Recovery without git

Domain: `tooling` → Slug: `br-only-cli-additions`

Quote: "`.br_history/` — snapshot JSONL timestamped tự động mỗi export, rotate theo count/age"

**Local backup mechanism:**
- Snapshots are taken automatically on each export operation
- Stored in `.br_history/` (gitignored)
- Can be listed, diffed, and restored with `br history list/diff/restore`
- Rotated by count and age (not unlimited)

**For forgentX:** If a worktree merge leaves the main branch in an ambiguous state, `.br_history/` provides an undo without needing to rely on git reflog. This is especially valuable if the merge commit itself is bad but git still has it.

### 5. Design-then-code with proof gates

Domain: `self-improvement` → Slug: `rollout-ladder-design-before-code`

Quote: "`WRITE_COMBINING_QUEUE_DESIGN.md` là 'design artifact only' — `src/write_combining.rs` ship CHỈ pure classifier/envelope types, ZERO runtime wiring"

**Pattern:**
1. Write a formal design document (e.g., `WRITE_COMBINING_QUEUE_DESIGN.md`)
2. State prerequisites explicitly (e.g., "idempotency key is a prerequisite before crash-recovery")
3. Ship only the type definitions and pure classifiers, zero runtime execution
4. Rollout in stages: direct-only baseline → shadow → advisory → opt-in → default-on
5. **Each stage requires proof:** parity test (queued behavior = direct behavior), failure-injection test (crash recovery works), resource profiling (memory/lock-wait improvements are real)

**For forgentX:** If you're going to merge worktree branches back into main, write the merge strategy as a design document first. State invariants (e.g., "merge cannot see writes after fork but before merge begins"). Ship only type definitions. Test merge in shadow mode (merge but don't commit to main). Proof-gate before enabling as default.

### 6. Output as API — drift is breakage

Domain: `quality-gates` → Slug: `snapshot-review-log-gate`

Quote: "Mỗi delta snapshot chấp nhận phải log trong `docs/snapshot_review_<DATE>.md`... CI gate `cargo insta test --check` FAIL build nếu có `*.snap.new` nào không có review-log khớp"

**Snapshot testing discipline:**
- All snapshot changes (help text, JSON schema, error messages) must be explicitly reviewed
- Each review is logged with a cause-class (feature add / format change / regression / etc.)
- Regressions are flagged with class `R` and block the build until fixed
- CI fails if a snapshot changed but has no review-log entry

**For forgentX:** Agent-to-agent handoff (including worktree → main merge) can accidentally change output format. If an agent expects a specific JSON shape and the merge changes it, the agent breaks silently. This gate ensures output changes are intentional and logged.

### 7. Synthetic scale testing with deterministic replay

Domain: `testing-evals` → Slug: `synthetic-scale-and-witness-harness`

Quote: "**synthetic scale** sinh JSONL tất định 10k–250k issue (CI) tới **1,000,000 issue / 10,000 simulated agent** (`BR_SYNTHETIC_MILLION=1`), validate qua `br sync --import-only`/`doctor`/`sync --status` thật; **contention replay lab** ghi worker-id/command/timing/estimated-lock-wait + 'replay seed', replay dựng lại workspace từ trace và báo worker/event phân-kỳ đầu tiên"

**Testing layers:**
1. **Synthetic scale:** Generate deterministic test data (10k–1M issues, reproducible)
2. **Contention replay:** Record all lock waits, timings, worker IDs during a test run
3. **Replay seed:** Re-run the exact same sequence from the seed to catch race conditions
4. **NUMA profiling:** Test on high-core machines with memory affinity to catch lock contention at scale

**For forgentX:** If worktree merges are going to be safe at scale (many concurrent agents), you need deterministic replay testing. Capture a trace of "fork → work → merge" race, then replay it 100 times to catch the race condition. Without replay, you'll only catch races randomly.

---

## Summary

**beads-rust is not a worktree system.** It trades away isolation for **proof-based safety**, **unified health diagnosis**, and **deterministic crash recovery**.

**Key takeaways for forgentX's fork/merge race problem:**

1. **Eliminate the boundary:** If you can keep everything in one SQLite instance with locking, you eliminate the race. Cost: adaptive backoff under contention.

2. **Prove safety, don't assume it:** Use static analysis (grep CI contract: no git calls) + dynamic proof (strace witness: verify every write is allowed). Don't ship "I think this is safe."

3. **Health is a state machine:** Define Healthy/Degraded/Recoverable/Unsafe once, use that taxonomy everywhere. When a merge leaves state ambiguous, the health model tells you whether it's safe to continue.

4. **Recovery without git:** Maintain a local append-only snapshot log (like `.br_history/`) so you can undo workspace corruption without git reflog.

5. **Design-then-code-then-proof:** Write the merge strategy as a design document. Ship types only. Proof-gate the rollout (shadow → advisory → opt-in → default). Don't enable by default until crash-recovery + parity tests pass.

6. **Output changes are API breaks:** If an agent-to-agent handoff expects a specific JSON schema, snapshot-test it. Any change requires a review entry.

7. **Test at scale with replay:** Use deterministic synthetic data + seed-based replay to catch contention races. Don't rely on random timing to expose bugs.

**The "road not taken" for beads-rust relative to beads' Dolt direction is this: instead of versioning control inside the store, beads-rust hardened the classic SQLite+JSONL model with proof-based safety, unified health diagnostics, and deterministic testing.** For forgentX, this means: if you're going to keep worktrees and merge back to main, you need proof gates that beads-rust demonstrates (crash recovery, parity, contention replay).

---

## Unresolved Questions

None — the beads-rust index is comprehensive for these three questions. The index does not detail the actual implementation of `retry_mutation_with_jsonl_recovery` or the exact encoding of the snapshot_hash, but both are inferable from the design documentation quoted above.
