# RESEARCH — tsk-13z: land fgw/tsk-4b2's real content on main

## Round 1 — 2026-08-11T06:24Z

**Asked:** Does `fgw/tsk-4b2` (tip `7add82b8`) still merge cleanly against
current main (`11f04361`), and is the item's own verify command
(`git merge-base --is-ancestor 7add82b8 main && npm test`) a real,
runnable check with no open product/scope question left?

**Checked:**

- `git branch -a | grep tsk-4b2` — `fgw/tsk-4b2` still exists.
- `git log -1 fgw/tsk-4b2` — tip is `7add82b83da6c5246a02b276a93a77a43e309f36`,
  dated 2026-08-10, matches the item's cited tip.
- `git merge-base --is-ancestor 7add82b8 main` — NOT an ancestor, confirms
  the bug as described.
- `git log --oneline main..fgw/tsk-4b2` — 7 commits unique to the branch:
  `7add82b8` (merge fgw/tsk-4v6), `7a94751c` (merge fgw/tsk-12p),
  `dbd31b42`/`687abfb8` (tsk-4v6 pieces), `b52ef27f` (tsk-12p evidence),
  `d7ce57c6` (fgos-routing table fix), `c6995274` (tsk-4v6 plan revision).
- `git merge-tree 30653bf1 main fgw/tsk-4b2` (legacy 3-way dry-run,
  git 2.34.1 has no `--write-tree` mode) — **0 conflict markers**, 9 file
  changes total, all clean auto-merges:
  `.agents/skills/fgos-routing/SKILL.md`,
  `.claude/skills/fgos-routing/SKILL.md` (routing table gets the
  `fgos-clarifying`/`fgos-researching` rows — see finding below),
  `docs/history/tsk-12p/iron-law-evidence.md` (new),
  `docs/history/tsk-4b2-discovery-exploring-stage-wiring/plan.md` (merged),
  `docs/history/tsk-4v6/iron-law-evidence.md` (new),
  `src/runner/loop.mjs`, `src/runner/prompt-templates/worker-prompt-discovery.txt`,
  `test/e2e/runner-loop.test.mjs`, `test/runner/loop.test.mjs`.
- `git diff main fgw/tsk-4b2 --stat` (full-tree diff, NOT a merge
  simulation) shows ~150 files / ~10K lines of apparent "deletions" —
  this is a red herring: `fgw/tsk-4b2` forked from an old point
  (`30653bf1`) and never rebased, so its tree lacks ~150 files of
  unrelated work main has gained since. The real signal is the
  merge-tree dry-run above (9 files, 0 conflicts), not this raw diff.
- **Key finding — main already has PART of tsk-4b2's own fix, through a
  different path**: `git log -S"## Discovery and exploring stages" main --
  .claude/skills/fgos-coding-driving/SKILL.md` points to commit
  `5b394faf feat(tsk-4b2): wire discovery/exploring stages into the real
  flow` (2026-08-10, authored directly, not via a branch merge). That
  commit IS an ancestor of both `main` and `fgw/tsk-4b2` — it's shared
  history, not a duplicate implementation. `fgw/tsk-4b2`'s own 7 unique
  commits are refinements layered ON TOP of that shared base (a
  `fgos-routing` table fix, `fgos-runner` discovery-sweep verdict
  handling, Iron Law evidence docs) — genuinely unlanded, not already
  redundant.
- Confirmed one concrete still-live bug the merge fixes: current
  `.claude/skills/fgos-routing/SKILL.md` on main (== this worktree's
  HEAD) still reads `clarify -> fgos-coding-exploring` (wrong — the registry
  resolves `clarify -> fgos-clarifying`, confirmed via
  `src/state/workflow-stage-graphs.mjs:148`). Commit `d7ce57c6` on
  `fgw/tsk-4b2` is exactly this fix, and the merge-tree dry-run shows it
  applies cleanly.

**Found:**

- `fgw/tsk-4b2` merges cleanly against current main today — the two
  historical friction failures (`main@277a64be`, `main@480c2a39`) are
  stale; main has moved on and the conflict surface from those attempts
  no longer exists.
- The item's own verify command
  (`git merge-base --is-ancestor 7add82b8 main && npm test`) is real and
  runnable as written — no change needed.
- tsk-4b2's own footprint (`src/intake/discovery.mjs`, `bin/fgos.mjs`,
  several test files, both `fgos-coding-driving`/`fgos-coding-exploring` SKILL.md
  mirrors) is *mostly* already on main via `5b394faf`; the merge only
  needs to land the remaining 9-file delta.

**Still open:** none blocking. The item's own description already lays
out the completion path (fresh conflict check — done here, clean — then
the standard `fgos cleanup -> move --to blocked/awaiting-approval ->
fgos approve` sequence used to land tsk-4v6). No product/scope decision
is needed; this is pure land-the-branch work.

## Verdict

**Clear.** `verify: "git merge-base --is-ancestor 7add82b8 main && npm test"`
(unchanged from the item's own stated verify — already real and
confirmed runnable).
