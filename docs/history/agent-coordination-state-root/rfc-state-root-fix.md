# RFC — state/root resolution fix shape (P0 investigation)

Investigation prompt: `docs/history/agent-coordination-state-root/prompt.md`.

## Root cause claim

`bin/fgos.mjs`'s `dataDir()` resolves `.fgos/` strictly from `process.cwd()`
(D5, `src/runner/paths.mjs`'s `resolveRepoRoot(cwd, {strict:true})`), by
deliberate design: never git-resolving upward, never treating a linked
worktree as equivalent to main. This is safe only because the two sanctioned
ways to get a worktree are covered:

- (a) `fgos pick`/`take`'s own `createWorktree` strips `.fgos/` entirely per
  ADR0020, so a caller there gets a clear `.fgos/ not found -- use --dir`
  error (`bin/fgos.mjs` ~line 5006) if it forgets `--dir <mainRoot>`;
- (b) `fgos session start` symlinks a shared `.fgos/`.

Neither covers a third category: a worktree created *outside* fgOS's own
lifecycle (a plain `git worktree add`, or an external harness's own worktree
tool — e.g. this very investigation's own worktree
`.claude/worktrees/agent-coordination-state-root`, its sibling
`.claude/worktrees/agent-coordination-foundation`, `forgentX-worker-isolation`,
and its nested `tsk-46f` worktree). Because `.fgos/events.jsonl` and the
sharded `.fgos/events/*.jsonl` are ordinary git-tracked files (`git ls-files
.fgos/` confirms this), such a worktree's checkout carries a real, populated,
but frozen-at-branch-point `.fgos/` snapshot. `dataDir()` silently accepts it
(no ENOENT, so the line-5006 guard never fires), so any `fgos` verb run there
without an explicit `--dir` reads/writes that disconnected snapshot instead
of the true main checkout's live store.

## Evidence

1. **Code.** `src/runner/paths.mjs` (`resolveRepoRoot` strict-mode doc comment,
   `resolveMainCheckoutRoot`'s ADR0020 note); `bin/fgos.mjs:132-143`
   (`dataDir`, `--dir` escape-hatch comment tsk-56t D1); `bin/fgos.mjs:5006`
   (ENOENT-only guard message); `src/runner/worktree.mjs:177-236`
   (`detectTrunk`, `isMainWorktree` — already structurally correct, already
   used by `approve`'s main-checkout safety guard per STR44/P44, catching
   both registered-session and ad-hoc worktrees, but only at that one call
   site).
2. **Read-only reproduction** from inside
   `.claude/worktrees/agent-coordination-state-root` (forked from main tip,
   untouched): `git rev-parse --show-toplevel` = this worktree (what
   `dataDir()` would use with no `--dir`); `git rev-parse
   --path-format=absolute --git-common-dir`'s parent = `/home/vantt/projects/forgentX`
   (the true main). They differ. No `fgos` verb was mutated to prove this —
   pure git-identity check.
3. **Live inventory evidence** (read-only `fgos show` sweep across 3 stores —
   main, this worktree, `forgentX-worker-isolation`): `tsk-5x7-1` shows
   `status:blocked` in main AND in this freshly-forked worktree, but
   `status:retrospective` in `forgentX-worker-isolation`'s own `.fgos` —
   several lifecycle stages further (delivered→retrospective normally only
   follows a real approve/merge). Those transition events were recorded only
   into worker-isolation's disconnected local store and never reached the
   canonical one main/approve reads. This is a live, currently-existing
   instance of the defect, not a hypothetical.
4. `approve`'s own guard (`isMainWorktree`, STR44/P44) already refuses to
   merge from any linked worktree (registered or ad-hoc) — so the
   investigation's acceptance criterion "approve still refuses to land from
   any linked worktree" is already satisfied by existing code, not something
   to build.
5. `tsk-46f`'s own recorded incident
   (`docs/history/tsk-46f/iron-law-evidence.md`, "Branch-drift recovery
   proof") already had to hand-amend a merge commit so its committed `.fgos`
   tree exactly matched main — a manual instance of exactly this class of
   problem, worked around once, never structurally fixed.

## Proposed fix shape (bounded, not yet implemented)

Extend the same structural check already proven for `approve`
(`isMainWorktree` from `src/runner/worktree.mjs`) to the point where
`bin/fgos.mjs`'s `dataDir()` resolves an **implicit** (no `--dir` passed)
`.fgos/` for a **mutating** verb: if `.fgos/` is present at cwd, cwd is not
the true main worktree (`isMainWorktree` false), and cwd is not a `fgos
session`-symlinked worktree (session.mjs's own marker/symlink check) —
refuse with a clear error pointing at `--dir <mainRoot>`, mirroring the
existing ENOENT-case message at line 5006.

Read-only verbs (`list`/`show`/`ready`/etc.) may be left as-is or only warn,
to avoid breaking legitimate read-only introspection from an ad-hoc
worktree.

**Non-goals:** no distribution/isolation rewrite; no new Work lifecycle
primitive; no change to `createWorktree`/ADR0020 stripping itself; no
touching `--dir`'s existing contract; no new group-thinking protocol.

## Question for this review

Does the evidence support this root-cause + proposed-fix-shape as **do now**
(smallest justified fix), or does new evidence/dissent argue for **defer**
(recovery/runbook proposal only, park implementation)? Specifically:

1. Does the proposed guard correctly distinguish all 3 legitimate cases
   (main checkout, ADR0020-stripped `fgw/<id>`, `fgos session`-symlinked)
   from the illegitimate 4th (ad-hoc/harness worktree with a real stale
   `.fgos/`) without false-positiving on any real workflow (check
   `src/state/store.mjs`, existing tests, and fixtures for anything that
   deliberately writes into a non-main worktree's local `.fgos/`)?
2. Is reusing `isMainWorktree` at this new call site sound, or does the
   mutating-verb path need a distinct check (e.g. one that also recognizes a
   `fgos session`-symlinked worktree, which `isMainWorktree` does not
   itself distinguish from a plain non-main worktree)?
3. Does `fgos setup`/`doctor`, or the dev-checkout shell helper
   (`scripts/fgos-shell-integration.sh`, which resolves root via
   `--git-common-dir`), interact with this guard in a way that needs a
   doctor/setup registration?
4. Given `tsk-5x7-1`'s live divergence and `tsk-46f`'s prior hand-recovery,
   what is a safe, reversible recovery procedure for state already stuck in
   a disconnected store like `forgentX-worker-isolation`'s (read-only
   inspection only — no destructive action; propose a runbook, do not
   execute one)?
