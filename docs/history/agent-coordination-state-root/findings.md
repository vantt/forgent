# State/Root Resolution Foundation — Investigation Findings (P0)

Investigation prompt: `docs/history/agent-coordination-state-root/prompt.md`.
RFC reviewed: `docs/history/agent-coordination-state-root/rfc-state-root-fix.md`.

## Conclusion: [DONE]

Root cause confirmed with convergent cross-provider evidence. A safe, bounded,
tested unit of the fix shipped (`isSessionWorktree`). The riskier guard-wiring
into CLI dispatch is deliberately deferred — Pass 4's explicit "no safe bounded
fix without more design → park and document" outcome, applied narrowly (only
to the wiring, not to the whole investigation).

## 1. Root-cause decision

`bin/fgos.mjs`'s `dataDir()` resolves `.fgos/` strictly from `process.cwd()`
(D5, `resolveRepoRoot(cwd,{strict:true})`) by deliberate design. That's safe
only because the two sanctioned worktree-creation paths are covered:
`createWorktree` (ADR0020) strips `.fgos/` entirely, and `fgos session start`
symlinks a shared `.fgos/`. A third, uncovered category — a worktree made
*outside* fgOS's own lifecycle (plain `git worktree add`, or an external
harness's worktree tool) — inherits a real, git-tracked, but frozen `.fgos/`
snapshot. `dataDir()` silently accepts it (no ENOENT, so the existing
line-5006 guard never fires), so any `fgos` verb run there without `--dir`
reads/writes that disconnected snapshot instead of main's live store.

This worktree (`.claude/worktrees/agent-coordination-state-root`), its sibling
`agent-coordination-foundation`, and `forgentX-worker-isolation` (+ its nested
`tsk-46f` worktree) are all live instances of this uncovered category.

## 2. Reproduction trace (read-only, no mutation)

```
cwd:      .claude/worktrees/agent-coordination-state-root
git rev-parse --show-toplevel                          → this worktree      (dataDir()'s basis, no --dir)
git rev-parse --path-format=absolute --git-common-dir's
  parent (resolveMainCheckoutRoot)                      → /home/vantt/projects/forgentX  (true main)
branch:   fgw/agent-coordination-state-root
```
The two roots differ — confirms the split mechanically, without running any
mutating verb.

Live inventory evidence (read-only `fgos show` sweep, 3 stores): `tsk-5x7-1`
is `status:blocked` in main AND in this worktree, but `status:retrospective`
in `forgentX-worker-isolation`'s own `.fgos` — several lifecycle stages
further (delivered→retrospective only follows a real approve/merge). Those
transition events were recorded only into worker-isolation's disconnected
local store.

Prior precedent: `tsk-46f` (`docs/history/tsk-46f/iron-law-evidence.md`)
already required a hand-amended merge commit so its `.fgos` tree matched
main — the same defect class, worked around once, never structurally fixed.

## 3. Group-thinking round

Protocol: `core.coordination-protocol.group-thinking-rfc-review-lite`
Coordination id: `coord_state_root_rfc_20260909`
Actors: coordinator/proposer = claude, objector-a = **codex-cli** (OpenAI),
objector-b = **agy-cli** (Gemini) — genuinely cross-provider.

Session did not formally close (quorum incomplete — 3 of 6 attempts across
the round hit a real, separately-worth-filing DX gap in the coordination
engine's own default operation template: `expectedOutputs` names only
`(status, summary)` with no enum, so a headless actor's freeform
`status:"DONE"`/`status:"objection"` fails the closed
`done|blocked|failed|no-evidence` schema, and a `status:"done"` claim on a
read-only operation additionally needs a companion `agent-report.md`
artifact, undocumented in the default template — worth a small follow-up to
the coordination engine's own docs/template, out of this P0's scope).
Despite that, both objectors' real, substantive findings were obtained and
are the review evidence below.

**Objector-A (codex-cli) — 2 objections:**
1. `isMainWorktree` alone is sound for *detecting non-main*, but the guard
   needs an explicit, **unforgeable** predicate for *legitimate session
   worktree* — a bare `.fgos` symlink check is forgeable (any worktree can
   carry a symlink pointing anywhere).
2. `COMMAND_REGISTRY`'s `touchesState` is too coarse — it flags mixed-mode
   verbs (`evolve`, `coordination show/chain`, `goal show`, `tool query`) as
   mutating even though their read-only invocations must keep working
   unguarded in a linked worktree (existing regression:
   `test/cli/fgos-stage.test.mjs:94-102`). A blanket guard keyed on
   `touchesState` would false-positive on real workflows.
   No objection on setup/doctor (Q3): both already canonicalize to main,
   confirmed by existing tests.
   Also flagged: two existing fixtures deliberately write non-main local
   `.fgos` state on purpose (`test/e2e/main-checkout-lock-hook*.test.mjs`) —
   any guard must not generalize into a blanket ban.

**Objector-B (agy-cli) — converges independently on finding #1**, citing the
same `session.mjs` lines, and additionally proposed a recovery runbook (see
§5) — corrected below for one inaccuracy (it assumed a monolithic
`events.jsonl`; the live store also uses sharded `.fgos/events/*.jsonl`
files, so a real reconciliation must diff/merge those too, not just the
legacy monolithic file).

Both objectors independently confirming the same core gap (bare symlink
check is insufficient) is exactly the signal RFC-Review-Lite exists to
surface — that's what got implemented (§4).

## 4. What shipped (do-now, smallest justified slice)

`src/runner/session.mjs`: new exported `isSessionWorktree(repoRoot)` —
true only when `.fgos` at `repoRoot` is a symlink **and** its realpath
equals the real main checkout's own `.fgos` realpath
(`resolveMainCheckoutRoot`, via `--git-common-dir`, itself unspoofable by a
worktree-local symlink). Closes objector-A's forgeability concern directly.

Tests added (`test/runner/session.test.mjs`, all passing): true for a
genuine `createSession` worktree and false for the main checkout itself;
false for an ad-hoc worktree carrying a real checked-out (non-symlink)
`.fgos` copy (the exact bug shape); false for a worktree whose `.fgos`
symlink is forged to point somewhere else (proves the target check, not
just presence, is load-bearing).

Full suite run: `test/runner/session.test.mjs` (18/18),
`test/runner/paths*.test.mjs` + `test/runner/worktree*.test.mjs` (113/113),
`test/architecture.test.mjs` (layering rule) — all green, zero regressions.

Commit: `8033890a` on `fgw/agent-coordination-state-root`
("feat(runner): add isSessionWorktree, an unforgeable session-worktree predicate").

GitNexus impact-analysis note: no indexed scan root matches this worktree's
exact path (closest, `/home/vantt/projects/forgentX`, is 96 commits behind
and on a different branch) — degraded per the project's own capability
gate. Blast radius confirmed instead via the full session/paths/worktree
test suites above plus the architecture layering test; `isSessionWorktree`
is a new, additive export with no existing call site, so blast radius is
inherently zero until a follow-up wires it in.

## 5. Deferred: guard-wiring into `dataDir()` / CLI verbs

Not implemented this round — needs its own scoped design pass, not a rushed
addition, because both objectors surfaced real specification gaps:

- Which verbs are unambiguously mutating (safe to hard-refuse) vs. mixed-mode
  (need per-invocation, not per-verb, classification)? `submit`/`pick`/
  `take`/`move`/`return`/`edit`/`ask`/`answer` look unambiguous but were not
  individually re-verified against `command-registry.mjs` in this round.
- The two `main-checkout-lock-hook` fixtures that deliberately write
  non-main local `.fgos` state must be explicitly exempted, not broken.
- The acceptance criteria's 5-scenario regression matrix (main checkout,
  linked worktree, explicit `--dir`, pick/return/approve, concurrent/session
  invocation) is real test-writing work, not safe to compress into this
  already-long session.

**Recommendation:** file a follow-up coding-domain item ("wire
`isSessionWorktree` + a per-invocation mutation guard into `dataDir()`")
scoped explicitly to the two gaps above, owned separately from this P0
stream. `approve`'s own main-checkout guard (`isMainWorktree`, STR44/P44)
already independently satisfies "approve still refuses to land from any
linked worktree" — no change needed there.

## 6. Recovery runbook for a disconnected store (proposed, not executed)

Read-only-first, reversible, corrected for the sharded event-log shape:

1. **Identify drift (read-only).** For the divergent item (e.g. `tsk-5x7-1`),
   compare `fgos show <id> --json` output resolved against each store's
   `--dir` (main vs. the disconnected worktree) to see exactly which fields
   differ, before touching any file.
2. **Locate the source events (read-only).** The disconnected store's new
   events live either in its `.fgos/events.jsonl` tail or in one/more
   `.fgos/events/<shard>.jsonl` files not present (or older) in main's own
   `.fgos/events/`. Identify them by shard filename + mtime, not by assuming
   a single flat log.
3. **Verify in an isolated copy.** Copy main's `.fgos` to a scratch temp dir
   (never the real main checkout), append/copy in the candidate shard
   file(s), then run `fgos show <id> --json --dir <scratch-dir>` to confirm
   the reconciled state resolves cleanly (no parse/state-machine error) and
   matches the expected corrected status.
4. **Apply (reversible).** Only after step 3 passes: copy the verified new
   shard file(s) into the real main checkout's `.fgos/events/` (an
   append-only add, not an edit of any existing file — trivially reversible
   by deleting the copied file(s)).
5. **Commit** the updated `.fgos/` tree in the main checkout, from the main
   checkout, so `fgos approve`/`fgos list` there now see the correct state.

This is a proposal only — **not executed** in this investigation (rule 1:
no copy/reset/mutate of `.fgos` state), and must run from the real main
checkout (`/home/vantt/projects/forgentX`), never from a linked worktree,
matching this investigation's own root-cause finding.

## 7. Deduplicated inventory (32 candidate ids, 3 stores checked: main, this
worktree, `forgentX-worker-isolation`)

| id | class | do now? | reason / evidence |
|---|---|---|---|
| tsk-oyc | **root cause** | merge | Describes exactly this defect ("worker `.fgos` writes land in a disconnected store"). Recommend linking it to this investigation's findings/commit rather than duplicating scope; the deferred guard-wiring (§5) is its natural follow-up. |
| tsk-5x7-1 | **reproducer** | do now (recovery only, from main) | Live divergence confirmed (§2/§6) — apply the §6 runbook from the real main checkout, not a code fix. |
| tsk-3rg5 | root-cause-adjacent | defer | "approve: dirty tracked `.fgos/*` in main checkout" — same architecture (`.fgos` is ordinary git-tracked content), different symptom, already has its own owner (`doing`). Cross-link, don't duplicate. |
| tsk-5rg | root-cause-adjacent | defer | "approve/move state event disappears" — same architecture family, own owner (`doing`). Cross-link. |
| tsk-46f | root-cause instance (closed) | n/a (historical) | The prior hand-recovery precedent (§2); already resolved via manual workaround, cited as evidence only. |
| tsk-5l0, tsk-5ie | adjacent integrity risk | defer | Truncation/sidecar-locking issues, `awaiting-approval` — independent of state-root split, no conflict, let them land on their own. |
| tsk-21fy | adjacent integrity risk | defer | Silent event loss on 7 decision commands — independent mechanism (write-path bug, not root-resolution). |
| tsk-56u | adjacent integrity risk | defer | Ordinary git commands destroying the event log — independent mechanism. |
| tsk-2u5 | dependency | defer | Stale worktree index — worktree lifecycle hygiene, not root-resolution itself. |
| tsk-25r | dependency | defer | Hidden worktree claim/merge/cleanup bugs — overlapping surface, broader scope than this P0. |
| tsk-4dk | cleanup | defer | 96% of `fgw/<id>` worktrees stale vs. work items — operational cleanup, no causal link to root-resolution. |
| tsk-239 | dependency | defer | Root/aggregator branch drift — adjacent (branch identity), not proven causal to the `.fgos`-root split. |
| tsk-2s9 | dependency | defer | Stuck root claim blocks return — distinct claim-lifecycle bug. |
| tsk-1l9 | unrelated noise | defer | Routine merge backlog ("land fgw/tsk-64h and fgw/tsk-2t5"), not a root-resolution finding. |
| tsk-2q8 | dependency | defer | `checkMergeStillResolves` root/parent-branch fallback — branch-resolution robustness, adjacent not causal. |
| tsk-5ypg | unrelated noise | defer | `settleClaim` CAS hashing — distinct mechanism (claim concurrency), no link to state-root split. |
| tsk-1fp | dependency | defer | Distribution/version-safety alignment — general distribution health, not causal. |
| tsk-1ax | cleanup | defer | Docs data-dictionary row — documentation only. |
| tsk-21p, tsk-5b5 | unrelated noise | defer | `fgos setup`'s skill-wrapper generation — unrelated subsystem. |
| tsk-4vh | dependency | defer | `resync-worktree` ENOBUFS crash — touches the same resync/strip machinery (`stripFgosAfterReset`) traced in §1; natural companion to the §5 follow-up, not itself the root cause. |
| tsk-4lc, tsk-49o, tsk-492, tsk-9tu, tsk-5x7-1(dup), tsk-371, tsk-5qj, tsk-3xk, tsk-3bf, tsk-47l, tsk-63z, tsk-3ru, tsk-1zk | unrelated noise | defer | Coordination/dispatch internals (per the prompt's own framing: "may be dependencies, not P0 scope"); confirmed unaffected by the state-root split in the inventory scan — own backlog track. |

No duplicates across stores beyond what's noted above; no id was unresolvable
in every store.

## 8. Remaining risks

- The coordination-engine DX gap noted in §3 (undocumented `agent-result.json`
  status enum + companion-artifact requirement for read-only "done" claims)
  will bite the next RFC-Review-Lite/Nominal-Group-Lite caller the same way.
  Worth a small, separate fix to the engine's own default operation template
  — not filed as a new item in this session (out of P0 scope), flagged here
  so it isn't lost.
- `forgentX-worker-isolation`'s disconnected store still holds `tsk-5x7-1`'s
  un-reconciled progress; §6's runbook is proposed, not applied.
- The guard-wiring deferral (§5) means the underlying defect (an ad-hoc
  worktree can still silently read/write a disconnected `.fgos`) is
  unchanged in this commit — `isSessionWorktree` is a building block, not
  yet load-bearing anywhere.
