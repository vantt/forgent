---
type: explanation
title: Why a stale worktree index produced a wrong Iron Law test count
tags: [iron-law, evidence, worktree, addendum]
source_capture_ids: [tsk-5x4, tsk-2u5, tsk-2u5-1, tsk-1d7, tsk-jgs]
authoritative_for: why the tsk-51m root Iron Law evidence file recorded a test count lower than any of its own children, why the fix is an addendum rather than an edit, and the general stale-worktree-index guard this incident led to
---
# Why a stale worktree index produced a wrong Iron Law test count

Found in a post-batch audit of `tsk-51m` (2026-08-13), from two
evidence-doc-accuracy findings grouped together because both are
`docs/history`-only corrections, touching no `src/`.

## Finding 1: a root's evidence file reported fewer tests than any single child

`docs/history/merge-conductor-throughput-and-human-release/iron-law-evidence-tsk-51m-root.md`
claimed `npm test` against `fgw/tsk-51m`'s real HEAD — "the root's own
post-merge tree containing all 5 children" — produced 2985 tests. But
every one of the five children's own evidence files reported *more*:
`tsk-55p` 2991, `tsk-2ypd` 3003, `tsk-xyr` 3017, `tsk-4ax` 3029 (each
confirmed directly by grep). A tree that genuinely contains all five
children cannot have fewer tests than any one child measured alone — the
math is impossible on its face.

**Root cause, traced to a real commit**: `254f61e9` ("fix: restore
content accidentally reverted by a stale worktree index in the previous
commit") had already diagnosed the mechanism. The commit before it
(`docs(tsk-51m): record root-level Iron Law evidence`) ran from worktree
`tsk-51m-wSxZpU`, whose index/working tree was stale — that commit
unintentionally reverted 405 lines of `bin/fgos.mjs` plus 2838 lines
across 20 files back to before the five children existed. The 2985 test
count in the evidence file was measured against that stale, reverted
tree — not the real tree that actually landed. `254f61e9` fixed the code
revert, but no addendum ever corrected the now-wrong test count sitting
in the evidence file itself.

**Fix**: append an addendum to the evidence file — never edit the
original historical record — with a fresh `npm test` run against the
real current `main`, the corrected count, and an explanation of why the
original number was wrong.

## Finding 2: a stored verify string stopped being verbatim-reproducible

`tsk-60h`'s stored `verify` field (visible via `fgos show tsk-60h`)
greps for the literal string `"catchup playbook already attempted"` in
`plugins/fgOS/skills/merge-loop/SKILL.md`. That exact string no longer
exists — `tsk-4xq`'s later rewrite (see
`docs/how-to/self-resolve-verify-timeout-integration-drift-and-unclassified-merge-failures.md`)
consolidated the 4b rule down to `"playbook already attempted"`, dropping
the `catchup` prefix. The underlying behavior is unchanged (semantics
preserved, consolidated for DRY) — only the exact string stopped
matching.

Notably, `tsk-60h`'s own `plan.md` risk map had *predicted* exactly this
collision ("text overlap with `tsk-4xq`") and called for a re-verify
after that later merge — a step that had simply never happened.

**Fix, and why it is scoped this narrowly**: `tsk-60h`'s stored `verify`
field is never edited — it is a `delivered`, immutable historical record.
Instead, a note is added to `docs/history/tsk-60h-merge-conflict-catchup-playbook/plan.md`
recording the drift with concrete evidence (the line, the commit), so a
future reader does not mistake the stored string for something still
verbatim-reproducible today.

## The general mechanism, and the guard it led to (`tsk-2u5`)

The stale-index revert (`254f61e9`'s own fix, Finding 1 above) turned
out to be one instance of a general, previously-unguarded hazard. A
linked worktree checked out on branch X can desync from its own
index/working-tree whenever a *different* process — an ephemeral merge
worktree from `sync-root`/`approve`, for example — force-moves X's ref
via `git branch -f` without ever touching the first worktree's own
working tree or index. `HEAD`/`git log` inside the desynced worktree
still read the *new* commit correctly, because `HEAD` is a symbolic ref
pointing at the branch ref that just moved — but the files on disk and
the index are still the *old* snapshot. A "narrowly-staged" commit from
that worktree (`git add` exactly one new file) then silently drags the
old version of every *other* tracked file along with it, reverting them.

The `tsk-51m` incident above was caught only by luck — a ground-truth
grep noticed `performCatchUp`/`withMergeTargetSlot` had vanished from
`bin/fgos.mjs` right after the bad commit. No system guard existed to
catch this automatically.

**Locked design** (`docs/history/stale-worktree-index-guard/CONTEXT.md`):

- **D1** — the guard lives in the existing `.githooks/pre-commit` file
  (no per-worktree `core.hooksPath` override, which would also silently
  disable the pre-existing `.fgos`-deletion guard), scoped to `fgw/*`
  branch commits, and must run *before* the existing `.fgos`
  staged-deletion guard so that guard reads an already-correct index.
- **D2** — detection is read-only, never mutates: compare a
  reflog-based `lastSynced` marker against the branch's current tip.
  Equal → no-op. Not an ancestor, or the reflog is unreadable → refuse,
  fail closed. Ancestor but behind → refuse with the exact repair
  command; the hook itself never attempts an in-hook auto-fix, because a
  reset+reapply that fails partway would strand the agent's only copy of
  its real change in a temp patch — the exact class of work-loss this
  guard exists to prevent.
- **D3** — repair is a separate verb, `fgos resync-worktree` (never
  embedded in the hook): extract the staged diff, save it under
  `--git-common-dir` (never the worktree's own `--git-dir`, which fgOS
  can force-remove later), `git reset --hard` to the real tip, re-strip
  `.fgos/` after the reset (bundled fix for a related pre-existing bug
  where the reset would otherwise resurrect a stale `.fgos/` snapshot,
  violating ADR0020), then `git apply --index` the saved patch (never
  `--3way`) — a real content conflict refuses outright and keeps the
  patch on disk rather than guessing a merge.
- **D4** — a bundled fix: `installGitHooks` now writes an *absolute*
  path to the main checkout's `.githooks/` instead of the relative
  string it wrote before, so every worktree resolves to the same,
  current hook file regardless of which commit its own branch happens to
  have checked out.
- **D5** — deliberately out of scope: no proactive resync pushed into
  sibling worktrees the moment a ref force-moves (would race a still-live
  session, and conflicts with a separate documented decision governing
  ephemeral merge worktrees). Detection-at-commit plus an on-demand
  repair verb was judged sufficient to stop the silent-revert failure
  mode without that added complexity.

## Follow-up: the repair verb's own bare invocation was broken (`tsk-jgs`)

Found during a post-merge `/ck-code-review` of `tsk-2u5`/`tsk-1d7`
(commit `c9c71534`): `fgos resync-worktree` run **bare** (no `--dir`) from
inside a stale worktree — exactly what `.githooks/pre-commit`'s own
refusal message instructs a user to do — failed to resolve the main
checkout and errored with a misleading `"could not read HEAD reflog"`
instead of performing the repair.

**Root cause**: `bin/fgos.mjs`'s `resync-worktree` case passed `dir`
(`dataDir(flags.dir)`, which resolves `.fgos` relative to cwd) straight
through as `resyncWorktree`'s `repoRoot`, instead of resolving/defaulting
to the main checkout the way every other git-operating verb in the same
file does (via `path.dirname(dir)`). Since a linked worktree's own
`.fgos/` never exists at all (ADR0020), this path is broken by
construction whenever `--dir` is omitted. Reproduced live: a real
worktree with a force-moved branch, `node bin/fgos.mjs resync-worktree`
run bare from inside it failed with the misleading reflog error; the
identical call with `--dir <mainRoot>` succeeded (`resynced: true`).
Compounding: `command-registry.mjs`'s own `resync-worktree` entry listed
the bare invocation as a valid example and never marked `--dir` required
— nothing in the interface warned that the documented, hook-instructed
usage was actually broken.

**Fix**: make the bare/default invocation genuinely work — auto-resolve
the main checkout the same way other worktree-aware verbs already do
(via `git --git-common-dir` resolution) — rather than just documenting
`--dir` as mandatory, since the hook's own refusal message specifically
tells a user to run the command bare. A real subprocess-level test
(invoking the actual `fgos resync-worktree` CLI end-to-end from inside a
worktree) was added alongside the fix — the prior test coverage only
exercised the underlying `resyncWorktree()` function and the hook's own
refusal message directly, never the real CLI path, which is exactly what
let this ship in the first place.

## The shared lesson

Both findings share the same shape: a historical evidence record is a
point-in-time snapshot, and later, unrelated changes (a stale-index
revert, a later text consolidation) can silently invalidate a number or
a string inside it without anyone noticing, because nothing re-checks an
already-`delivered` evidence file against the present state of the
world. The fix pattern in both cases is the same — append an addendum
with the correction and its evidence, never rewrite the original record
— preserving the historical record's own integrity while keeping a
future reader from trusting a number or string that quietly stopped
being true.
