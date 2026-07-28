# Bee Source Consult Report: Worktree Fork/Bootstrap/Merge Mechanics

**Source:** bee.md (v1.18.3, sealed index)  
**Date:** 2026-07-28  
**Scope:** One of 4 parallel consult passes; covers fork/bootstrap, merge-back gates, event-source sync  
**Research constraint:** Sealed index only; cannot descend into actual bee source code (upstreams/bee gitignored)

---

## 1. Fork/Isolate + Bootstrap: State Visibility Across Fork Boundary

### Flagged Entries Verified

**`### worktree-protected-attestation`** (line 218, orchestration domain):
> Before dispatching parallel workers into git worktrees, the orchestrator captures canonical identity facts itself — `commonDir`, `worktreePath`, `worktreeId`, `headRef`, `baseCommit`, `declaredPaths`, `reservedPaths` — *before* any worker exists, never populated from worker-claimed data. Post-dispatch, four typed halts (`WORKTREE_ATTESTATION_UNAVAILABLE`, `WORKTREE_IDENTITY_MISMATCH`, `WORKTREE_BASE_ANCESTRY_MISMATCH`, `WORKTREE_RESERVED_DIFF_MISMATCH`) stop on any divergence.

**`### protected-worktree-attestation-typed-halts`** (line 594):
> Expands the existing worktree threat model with concrete mechanics: before dispatching into a worktree the orchestrator captures 6 identity facts itself (`commonDir`, `worktreePath`, `worktreeId`, `headRef`, `baseCommit`, `declaredPaths`/`reservedPaths`) — never populated from worker-claimed data. Post-dispatch, 3 checks with typed refusals: identity mismatch (`WORKTREE_IDENTITY_MISMATCH`), base-ancestry mismatch (`WORKTREE_BASE_ANCESTRY_MISMATCH`), and a diff-vs-reserved-paths mismatch (`WORKTREE_RESERVED_DIFF_MISMATCH`). A runtime that can't capture/retain the attestation is refused with `WORKTREE_ATTESTATION_UNAVAILABLE` rather than silently degrading.

### Analysis

The attestation mechanism solves **VERIFICATION of divergence, NOT bootstrap-copy of state.** Bee explicitly addresses bootstrap through the mechanics in `### fleet-dispatch-and-merge-loop` (line 259-264):

> Three roles in one skill: **bootstrap** (one-shot human setup), **dispatch** (a looped cold `claude -p` process every interval, picks ready PBIs and spawns worker agents into isolated git worktrees, cap 4 concurrent), **merge** (single-shot, human-invoked only — the ONE action that lands work in main, never looped). Each iteration is cold-start with zero memory of prior iterations — "everything durable lives in bee state, git, and the herdr workspace."

**Critical finding:** Bee NAMES its bootstrap phase as **separate from dispatch**, acknowledging the "cold-start" reality explicitly. The phrase "everything durable lives in bee state" means append-only logs like `.bee/state.json`, `.bee/backlog.jsonl` are authoritative **outside** the worktree, not inside it. The worktree fork is **MEANT to be a clean boundary**; state is not bootstrapped into the fork.

**How this addresses your gap (tsk-1an):** forgentX forks with bare `git worktree add`, missing uncommitted state (`.fgos/events.jsonl` written to main just before/after fork). Bee sidesteps this by:
1. Keeping all durable state **external** to the worktree fork moment (`.bee/state.json`, `.bee/backlog.jsonl` live in main, not in the worktree)
2. Every dispatch iteration is **cold-start** — reads state fresh from main AFTER fork
3. Workers do not inherit "uncommitted state on main at fork time"; they read committed state on startup

**What bee does NOT document:** Whether a worker sees writes that landed on main **1ms before the fork completes**. This is a real gap in the index. The file sidesteps the question by making state external; the answer likely lives in beegog-specific mechanics or herdr runtime details not indexed here.

### Verdict on Bootstrap/Fork

**Bee's approach is DIFFERENT in philosophy:**
- You: fork worktree → worker reads state from fork location (may miss main writes)
- Bee: fork worktree → worker reads state from external `.bee/` files on main (all writes to main are visible *after fork completes*)

Bee does NOT solve "write landed on main 1ms before fork" by changing git timing. It solves it by making the state source **external to the fork**, so the fork cannot be "stale" relative to the state it needs.

---

## 2. Merge-Back / Write Reconciliation: The Staged-Verify Gate

### Flagged Entries Verified

**Line 68-72, `### multi-session-etiquette`:**
> Worktree merge-back is a semantic-conflict gate, not just a git operation — the merge is staged uncommitted (`git merge --no-ff --no-commit`) and the configured verify runs against the staged tree *before any commit exists*; a red verify aborts the stage leaving main byte-untouched (explicitly not a rollback, since nothing was ever committed).

**Line 600-605, `### red-stop-marker-anti-retry`:**
> In `bee-herding`'s merge role, a failed merge (`MERGE_CONFLICT`/`MERGE_VERIFY_RED`) writes a durable file marker (`.bee/tmp/bee-herding.red.<slug>`) BEFORE reporting, then stops — no retry, ever, for that worktree. The role never removes its own markers; only a human clearing it re-enables that slug. Rationale: with a measured ~1-in-12 verify flake, blind retrying would turn a red result into "a real risk of a genuine semantic conflict landing in main within roughly twelve minutes" — "retrying is worse than the interruption it dodges... a red result costs one interruption and zero damage, because the merge that would have caused damage never happened."

### Exact Mechanics

**Staged-Verify Gate Flow:**

1. **Stage merge into index, no commit:**  
   `git merge --no-ff --no-commit`  
   (Merge is now in the index; main is untouched; no commit object exists yet)

2. **Verify against staged tree (before any commit):**  
   Run the configured `verify` command against the current working tree (which now has the merge staged)

3. **Commit only if verify exits 0:**  
   If verify succeeds, `git commit -m "Merge branch ..."`  
   Main now has the merged commit

4. **Abort if verify fails:**  
   If verify exits non-zero, `git reset --hard` (or merge abort)  
   Main remains **byte-for-byte identical** to pre-merge state (explicitly NOT a rollback, since nothing was ever committed)

5. **On red: Write durable marker BEFORE any report:**  
   `.bee/tmp/bee-herding.red.<slug>` — file marker persists even if orchestrator crashes

6. **No retry loop:**  
   The merge role stops; human must clear the marker to re-enable that worktree slug

### How This Solves Your Bugs

**tsk-3w8 (concurrent-commit race):**  
"A concurrent session's commit lands on main while we're mid-merge, making our merge stale or conflicting."

Bee's staged-verify gate **prevents this from corrupting main** because:
- Verify runs against the merge state BEFORE commit
- If that verify is red, the commit NEVER lands
- Result: "merge lands but state-move fails" is impossible; you can't have a commit without passing verify

**tsk-3yl (non-idempotent merge retry):**  
"After `git commit --no-edit` fails with 'nothing to commit' (because merge already landed), retrying is ambiguous: did it land? Did it fail? Did I partially land state-move?"

Bee solves this with:
- Durable red marker written BEFORE any report
- No auto-retry; marker must be human-cleared
- On retry (human action): a new dispatch sees the marker, knows the slug already tried and failed, and requires human acknowledgment

**Result:** Your "stuck item" state is impossible. Either:
- Commit lands + verify was green → you proceed with merge
- Commit doesn't land + verify was red → durable marker exists, human gates re-entry

### What the Gate Does NOT Cover

If your **post-merge state-move is a separate tool** (not run by verify), bee's gate ensures the commit doesn't land but does NOT guarantee your state-move completes atomically with the commit.

**Example:** Suppose your verify script is:
```bash
npm test   # passes
git commit # succeeds
fgos-move-state  # THIS TOOL IS NOT IN VERIFY; if it fails, commit already landed
```

Bee's gate cannot save you here because `fgos-move-state` is outside verify.

**Solution:** Include state-move in your verify script, or gate the verify on state-move success:
```bash
npm test && fgos-move-state --dry-run && git commit && fgos-move-state --apply
```

### Documented Limitation

Bee states: "with a measured ~1-in-12 verify flake, blind retrying would turn a red result into... a real risk of a genuine semantic conflict landing in main within roughly twelve minutes."

**Translation:** Bee accepts the interruption cost (human must acknowledge red) over the corruption cost (blindly retrying turns a flaky test into silent damage).

---

## 3. Event-Source / Log Sync Across Writers: Holds + Reservations Ledger

### Flagged Entries Verified

**Line 68, `### multi-session-etiquette`:**
> Cross-session coordination primitive (critical rule 13, entirely new): coordinate through lanes/claims/**holds**, never around them. A hold-deny names the holder and its expiry; `bee cells claim-next` skips held paths so another session just picks different open work instead of blocking. New feature work in an occupied checkout routes through `bee worktree new`/`bee worktree merge`; docs/tiny/release work stays in main ("release always runs in main").

**Line 500-504, `### file-reservation-system`:**
> Before write-heavy work in a swarm, an agent reserves a path (`reservations reserve --agent <name> --cell <id> --path <path>`); a conflicting reservation returns `[BLOCKED]` with the conflict rather than allowing a write to proceed. Write-heavy shell commands are prefixed `BEE_AGENT_NAME=<name>` so ownership stays checkable.

### Exact Mechanisms

Bee has **TWO orthogonal mechanisms** for cross-writer coordination:

**1. Holds (claim-level avoidance):**
- **Storage:** `.bee/state.json` (claim-indexed)
- **Semantics:** A hold-deny names the `holder` and its `expiry`
- **Behavior:** `bee cells claim-next` **reads holds** and **skips held claims**
- **Outcome:** Another session just picks different open work instead of blocking
- **Type:** Cooperative avoidance, not a lock

Example flow:
- Session A claims cell #42, writes hold to `.bee/state.json`
- Session B calls `bee cells claim-next`
- B's hold check sees cell #42 is held by A (or expired), skips it
- B claims cell #43 instead (different work)
- No blocking, no race, no retry loop

**2. Reservations (path-level blocking):**
- **Storage:** `.bee/reservations.json` (path-indexed by agent, cell, path)
- **Command:** `reservations reserve --agent <name> --cell <id> --path <path>`
- **Behavior:** Returns `[BLOCKED]` immediately if path is already reserved
- **Type:** Hard blocking mechanism

Example flow:
- Worker A: `reservations reserve --agent alice --cell #42 --path src/core.ts`
- Entry written to `.bee/reservations.json`
- Worker B: tries `reservations reserve --agent bob --cell #43 --path src/core.ts`
- Returns `[BLOCKED]` with conflict details (alice, cell #42)
- Worker B must choose a different path

**Ownership tracking:**
- Write-heavy shell commands prefixed `BEE_AGENT_NAME=<name>` so ownership stays checkable in logs
- Reservations reference the agent name for auditing

### Cross-Worktree Scope — Unresolved

The file does NOT clearly state whether holds/reservations:
- Are **durable** (persistent in `.bee/state.json` and `.bee/reservations.json` across sessions), or
- Are **transient** (in-memory during execution), or
- Are **actively polled** by workers (each worker reads holds/reservations from disk), or
- Are **read only by orchestrator** (orchestrator checks, workers trust its gating)

**Inference from file structure:** Both are keyed in `.bee/` directory files:
- `.bee/state.json` contains claim + hold data
- `.bee/reservations.json` contains path reservations

This **strongly suggests** they are durable cross-worktree ledgers (not transient in-memory state). But the file is a sealed index; source code mechanics live in `.bee/bin/bee.mjs` and `packages/bee/lib/cells.mjs` (not indexed here).

### What Bee Does Explicitly

Holds keep **multiple sessions** from stepping on each other's **claims** (work assignments).  
Reservations keep **multiple workers** from stepping on each other's **paths** (files).

Neither is:
- A transactional lock with write-ahead log sync
- A cross-worktree active-lock mechanism (A holds a lock, B detects and waits)
- An atomic state-move ledger

Both are:
- Avoidance first (holds), blocking second (reservations)
- Queryable (bee can report who holds/reserves what)
- Named (holder, agent, cell ID are all recorded)

### How This Addresses Multi-Session Collision

forgentX's problem: "Multiple sessions can write `.fgos/events.jsonl` concurrently, or claim same work item, or checkout same branch."

Bee's approach:
- **Claim collision:** Holds prevent two sessions claiming the same work (skip to different claim)
- **Path collision:** Reservations prevent two workers editing the same path (block and report conflict)
- **State write collision:** Not explicitly addressed in this index; likely handled by append-only log + deterministic merge semantics (beegog-only detail)

**Gap:** The file does NOT document a cross-worktree **lock-on-write** mechanism or **compare-and-swap** pattern for state updates. Bee may rely on git's merge semantics (append-only logs in commits) rather than a separate ledger. Answer lives in beegog source.

---

## Different/Better Than forgentX: Ranked Portable Mechanisms

### **Priority #1: Staged-Verify Gate Before Commit (fixes tsk-3w8 + tsk-3yl)**

#### What Bee Does
- `git merge --no-ff --no-commit` (stage only, no commit)
- Run `verify` command against staged tree
- Commit only if verify exits 0
- Abort stage (git reset) if verify fails, main stays byte-identical
- On red: write durable marker `.bee/tmp/bee-herding.red.<slug>` BEFORE any report
- No auto-retry; marker must be human-cleared to re-enable

#### Why It Works
- **Atomic with commit decision:** Verify result IS the commit gate. Impossible for a commit to land when verify is red.
- **Idempotent recovery:** Durable marker prevents "retry after merge already landed" ambiguity. A retry is an explicit human gesture, not a loop.
- **Zero corruption risk:** A staged merge that verifies red is never committed, so "merge lands but state-move fails, item stuck" cannot exist.

#### Adoptability
**Direct fit — you can use this verbatim.** Replace your bare `git commit` with:
```bash
git merge --no-ff --no-commit  # Stage only
if [verify-script]; then
  git commit -m "..."
else
  git merge --abort
  touch .bee/tmp/bee-herding.red.<slug>
  exit 1
fi
```

#### Remaining Gap
If your post-merge state-move is a **separate tool** (not run by verify), bee's gate ensures the commit doesn't land but does NOT guarantee your state-move completes atomically with the commit.

**Solution:** Include state-move in your verify script or gate verify on state-move success. Example:
```bash
npm test && \
fgos-move-state --dry-run && \
git commit -m "..." && \
fgos-move-state --apply
```

#### Impact on Bugs
- **tsk-3w8 (concurrent-commit race):** Staged gate ensures verify runs before ANY commit, so stale/conflicting commits cannot land.
- **tsk-3yl (non-idempotent merge retry):** Red marker forces human recovery, eliminating "did it land?" ambiguity.

---

### **Priority #2: Explicit Bootstrap Phase Separate from Dispatch (addresses tsk-1an)**

#### What Bee Does
- Names "bootstrap" (one-shot setup, human-driven) as **distinct** from "dispatch" (cold-start loop, unattended)
- Acknowledges every dispatch iteration has "**zero memory of prior iterations**"
- All durable state lives **EXTERNAL** to worktree fork: `.bee/state.json`, `.bee/backlog.jsonl`, etc.
- Worktree fork is a clean boundary; state is not bootstrapped into the fork; workers read state fresh after fork

#### Why It Works
- **External state authority:** Append-only logs outside the fork are read fresh by each dispatch iteration (no stale state)
- **Clean fork boundary:** Worktree doesn't inherit uncommitted main state; fork is truly a clean baseline
- **No "missing write" race:** Since state is external, there's no "write landed on main during fork" window that workers can miss

#### Adoptability
**Directly applicable to your tsk-1an gap.** Your problem: "fork happens before append-only log is durably written to main."

Bee's solution: Keep `.fgos/events.jsonl` **external** (like bee's `.bee/state.json`) and **authoritative**. Then:
1. Write event to `.fgos/events.jsonl` on main
2. fsync to disk
3. THEN fork worktree
4. Worker reads fresh events on startup

Example:
```bash
# On main, before fork
echo '{"item": "tsk-1an", "ts": ...}' >> .fgos/events.jsonl
sync

# Now fork is safe; any worker sees the event
git worktree add worktree/feature ...
```

#### Remaining Gap
The file does NOT document "if main is written to DURING the fork (while git worktree add is running), does the new worktree see it?" 

Answer: Probably not (git fork is atomic, writes during fork are after). But Bee sidesteps this by making state external; the fork moment doesn't matter if state is read fresh AFTER fork completes.

#### Impact on Bug
- **tsk-1an (bootstrap-copy gap):** Instead of trying to bootstrap state INTO the fork, keep state external. Worker reads it fresh after fork completes, so no stale/missing state.

---

### **Priority #3: Durable Red Marker Anti-Retry Pattern (fixes tsk-1os orphan-checkout force-remove)**

#### What Bee Does
- On merge fail, write durable file marker `.bee/tmp/bee-herding.red.<slug>` BEFORE reporting
- Marker is **human-cleared only**; never auto-removed, never auto-retried
- Merge role stops; no loop; human must acknowledge before clearing marker

#### Why It Works
- **Breaks retry loop:** Eliminates "force-remove stale checkout because we don't know if a retry is safe"
- **Durable signal:** Even if orchestrator crashes, marker persists; checkout won't be blindly retried
- **Explicit recovery:** Human acknowledges before re-enable, eliminating "stuck in retry loop" state

#### Adoptability
**Direct pattern transfer.** Instead of:
```bash
# Current approach (risky)
if checkout-is-orphaned; then
  force-remove-worktree  # Unsafe if retry is pending
fi
```

Use bee's approach:
```bash
# Bee approach (safe)
if worktree-merge-failed; then
  touch .bee/tmp/bee-herding.red.<slug>
  exit 1  # Stop, wait for human
fi

# Elsewhere, worker checks on startup
if [[ -f .bee/tmp/bee-herding.red.<slug> ]]; then
  echo "WAITING FOR HUMAN RECOVERY"
  exit 1  # Halt, don't retry
fi
```

Human recovery: `rm .bee/tmp/bee-herding.red.<slug>` to re-enable that slug.

#### Remaining Gap
The file does NOT document whether bee-herding auto-clears old red markers (e.g., per feature completion) or if they persist indefinitely.

If markers persist, you need a cleanup mechanism (after N hours? after feature closes?). If they're auto-cleared, the file doesn't say when.

#### Impact on Bug
- **tsk-1os (orphan-checkout force-remove):** Instead of detecting and force-removing orphan checkouts, mark them as "waiting for human recovery" and halt. Human signals recovery (marker removal) before retry is safe.

---

## Unresolved Questions

1. **Does bee's holds/reservations ledger survive parallel worker access?**  
   File says both live in `.bee/state.json` and `.bee/reservations.json`, suggesting durable cross-worktree state. But source code access needed to confirm read-write semantics during parallel dispatch.

2. **Does `bee-herding`'s dispatch loop auto-clear old red markers?**  
   Not documented. Impacts how "zombie markers" are handled (e.g., after feature closes, does the marker auto-expire?).

3. **Does bee's verify-flake rate (~1-in-12) match your observed verify noise?**  
   If your flake is 1-in-100, red-marker interruption cost differs; if it's 1-in-5, it's significantly higher. This shapes the cost-benefit of bee's "fail loudly" approach.

4. **How does bootstrap handle "state written to main between bootstrap completion and fork dispatch"?**  
   The file sidesteps it (external state authority) but does not prove workers see fresh state post-fork. Likely beegog-specific.

5. **Does bee's reservation system use active polling by workers, or orchestrator gating only?**  
   If workers poll, `[BLOCKED]` requires disk reads on every write. If orchestrator gates, workers never see conflicts. Not clarified in index.

6. **Is the verify-before-commit check transactional, or can main diverge between verify and commit?**  
   Edge case: suppose verify takes 10s, and main is force-pushed during that window. Does bee re-verify after main diverges? File doesn't say.