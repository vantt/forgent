# plan.md — tsk-1jt: D4 proof-test the named `claude` executor

Mode: **standard** (2 mode-gate flags — public contracts: this D4 test
exercises `.agents/skills/_shared/coding-worker-contract.md`, a shared
contract with real other consumers (`pi`, `agy`, `codex`); weak proof
around the area: the item's own stated purpose is proving/disproving an
unverified "claude satisfies the worker contract out-of-process" claim.
No hard-gate flag — no auth/data-loss/audit-security/external-provider/
removing-validation). No `CONTEXT.md` exists for this item — discovery
verdict was `clear`, skipping `exploring`. Research lives in the sibling
feature dir `docs/history/claude-named-executor/RESEARCH.md` Round 2
(tsk-1cn's own dir, reused for research continuity since this item builds
directly on tsk-1cn's landed config) — this item's own `docsRef` points
here instead, so its `plan.md` never collides with tsk-1cn's own (a real
mistake caught and fixed during this item's own Bootstrap: an earlier
attempt pointed `docsRef` at the shared dir and clobbered tsk-1cn's
`plan.md` by reusing its exact filename — restored from `main` before this
file was written).

## Approach

Mirror tsk-47r's own proven D4 mechanism exactly
(`docs/history/claude-named-executor/RESEARCH.md` Round 2, citing
`docs/history/pi-executor-runtime-capacity/RESEARCH.md` Rounds 3-4) — no
new mechanism to invent:

1. **Create a genuinely disposable throwaway work item** via the real
   `fgos submit`/`fgos take --role session` doors (`kind: chore`, a small
   real `verify`, a `footprint` naming exactly one file) — never simulated,
   never hand-crafted state.
2. **Claim its worktree** the same way `/fgOS:pick` does
   (`fgos pick <throwaway-id>`).
3. **Dispatch `claude` against it via the literal named-executor path**,
   bypassing purpose-based `decide` (RESEARCH.md Round 2's own finding:
   Native-First Doctrine's rule 2 would otherwise prefer in-process
   dispatch for a same-provider target):

   ```bash
   node src/runner/dispatch.mjs execute claude --work <throwaway-id> --has-live-task-access
   ```

   (or the equivalent `--prompt` form built from the real `buildPrompt`
   output against the throwaway item's own work object at
   `stage: 'executing'` — never a hand-written approximation, same
   discipline tsk-47r's Round 3/4 already proved out).
4. **Read real evidence, never the worker's own self-report alone**:
   `.fgos/events.jsonl`'s `executor.dispatch` log entry for this dispatch,
   plus `git log`/`git show --stat` on the throwaway item's own worktree —
   confirms whether `claude` (a) read the layered skill-pointer chain down
   to `coding-worker-contract.md`, (b) honored the footprint boundary
   (touched only the named file), (c) reported through the contract's
   exact two-token vocabulary (`[DONE]`/`[BLOCKED]`), (d) never called
   `fgos` itself.
5. **Record the round** in `docs/history/claude-named-executor/
   RESEARCH.md` (Round 3, the shared feature dir — keeps the whole
   `claude`-executor research narrative in one place, same as pi's own
   single `pi-executor-runtime-capacity/RESEARCH.md`), with the real
   verdict — **GREEN**, **RED** (a specific contract assumption `claude`
   cannot satisfy, named precisely), or **BLOCKED** (e.g. the
   shared-account usage cap Round 2 already flagged as a real risk, per
   `pi`'s own Round 3 precedent) — all three are valid, documented
   outcomes; never fabricate a GREEN/RED from an inconclusive run.
6. **Append the real finding to `coding-worker-contract.md`**, the same
   place tsk-47r's own step 3 appended `pi`'s finding (its existing
   "Return-channel note" section) — only on GREEN or RED, since BLOCKED
   has nothing to append (precedent: `pi`'s Round 3 BLOCKED appended
   nothing, only Round 4's real GREEN did).
7. **Clean up**: `wontfix` the throwaway item and remove its
   worktree/branch immediately after — never left dangling in the backlog
   (same discipline tsk-47r's own step 2 already followed for both
   `tsk-1nif` and `tsk-1o8j`).

If the run comes back BLOCKED (shared-account usage cap), that is still
this item's own honest, complete outcome — not a reason to retry
indefinitely against the same cap, per `pi`'s own Round 3 precedent
("forcing a GREEN or RED verdict from zero tool calls would be
fabricating the item's own most valuable output"). A BLOCKED result still
gets recorded in `RESEARCH.md` and this item still returns — a future
session can retry once the account has quota again, the same way tsk-47r
opened Round 4 after Round 3's block, without needing every result to also
be a GREEN.

**Impact-analysis posture:** `full` — GitNexus (`forgent`) is `present`
(confirmed live during tsk-1cn's own drive, unchanged since). Not
load-bearing here: this item touches no function/class/method symbol — it
runs a live dispatch and appends prose to a doc, no source-code edit at
all.

## Risk map

| Component | Risk | What proves it |
|---|---|---|
| D4 claim (does `claude` follow `coding-worker-contract.md` when dispatched out-of-process) | Medium — this IS the open question the item exists to answer, exactly like `pi`'s own D4 | Step 4's real evidence: `.fgos/events.jsonl`'s `executor.dispatch` entry + the throwaway item's own worktree `git log`/`git show --stat` |
| Shared-account usage cap (RESEARCH.md Round 2's own flagged risk) | Medium — foreseeable, not avoidable from this item's own authority | If it fires, record `BLOCKED` per `pi`'s Round 3 precedent — a valid, honest outcome, not a defect to engineer around |
| `dispatch.mjs execute claude` mechanically resolving/spawning at all | Low — already proven at the config-resolution level (`test/runner/dispatch.test.mjs`, tsk-1cn) and no code-path special-casing found for `command === 'claude'` (RESEARCH.md Round 2, `src/runner/dispatch/cli.mjs:536` → `executeExecutorCli` → `resolveExecutorConfig`) | Round 3's own first real invocation, live |

## Files touched

- `docs/history/claude-named-executor/RESEARCH.md` — Round 3 (the D4 run,
  real evidence, accumulate)
- `docs/history/claude-named-executor/evidence/` — saved raw
  prompt/stdout, mirroring `pi-executor-runtime-capacity/evidence/`'s own
  convention
- `.agents/skills/_shared/coding-worker-contract.md` — append the real
  GREEN/RED finding (only if not BLOCKED)
- A throwaway `fgos submit`-created item — created and `wontfix`'d within
  this item's own drive, never a lasting artifact

## No split

One honest piece — the three-step D4 mechanism is strictly sequential
(each step depends on the previous step's real output), exactly the same
"splitting would only add claim/worktree/merge overhead with no real
parallelism" reasoning `pi`'s own tsk-47r Split section already gave for
its own three-step Approach.

## Outstanding questions

None
