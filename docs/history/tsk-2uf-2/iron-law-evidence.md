# Iron Law evidence — tsk-2uf-2

`classifyIronLaw` result against the real committed diff (`83961b57...d1cc7093`):

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/state/workflow-stage-graphs.mjs"]}
```

## Test command

The item's own `verify`:

```bash
npm test && test -f .agents/skills/_shared/coding-worker-contract.md && grep -qF 'cold-pickup' .agents/skills/_shared/coding-worker-contract.md && grep -qF '[BLOCKED]' .agents/skills/_shared/coding-worker-contract.md && ! grep -qE 'fgos (return|discover|plan) ' .agents/skills/_shared/coding-worker-contract.md
```

## Shape of this change

Docs/registry work, not a behavior change to any running code path: a new
provider-neutral worker contract (`.agents/skills/_shared/coding-worker-
contract.md`, mirrored byte-identical at `plugins/fgOS/skills/_shared/`),
`fgos-coding-implement/SKILL.md` split into a driver half (unchanged
below its own "Driver vs. worker" section) and a pointer to that
contract for a dispatched worker, and a new opt-in `workerContract` field
on `workflow-stage-graphs.mjs`'s `codingDomain` entry plus its
`workerContractFor(domain)` accessor — additive, unwired to any caller in
this item (same "no caller yet" precedent tsk-2uf-1's own
`prepareDispatch` set). The Iron Law still trips because
`workflow-stage-graphs.mjs` is a matched module in its own right
(a frozen per-domain registry), regardless of how small the added field is.

The before/after contrast reverts the item's own committed diff on the
worktree back to its pre-item content (`git checkout 83961b57 --
<files>`, the `fgw/tsk-2uf-1` merge immediately before this item's
checkpoint commit `d1cc7093`) — the two new `_shared/coding-worker-
contract.md` files removed entirely, the other three files restored to
their pre-item committed content — then runs the real item `verify`
against that pre-item tree, and again after restoring the checkpoint
content.

## Failing-before transcript

Reverted state: `.agents/skills/_shared/coding-worker-contract.md` and
`plugins/fgOS/skills/_shared/coding-worker-contract.md` removed;
`.agents/skills/fgos-coding-implement/SKILL.md`,
`plugins/fgOS/skills/fgos-coding-implement/SKILL.md`, and
`src/state/workflow-stage-graphs.mjs` restored to `83961b57`. The item's
own verify command's file/content checks, run as-is against this tree:

```
$ test -f .agents/skills/_shared/coding-worker-contract.md
exit: 1                            # file does not exist yet

$ grep -qF 'cold-pickup' .agents/skills/_shared/coding-worker-contract.md
exit: 2                            # grep: No such file or directory

$ grep -qF '[BLOCKED]' .agents/skills/_shared/coding-worker-contract.md
exit: 2                            # grep: No such file or directory
```

A clean, unambiguous failure: the contract file the verify command checks
for does not exist on the pre-item tree, and the two content greps that
depend on it cannot even run. `npm test` itself still passes on this same
reverted tree (3636/3636, 5 skipped) — this item adds new prose/registry
surface rather than fixing a code defect, so no existing test regresses
by its absence; the item's own verify command is what actually proves the
new surface landed, and that is exactly the part shown failing above.

## Passing-after transcript

Checkpoint content restored (`git checkout HEAD -- <the three modified
files>`, the two new contract files restored byte-identical from
`git show HEAD:<path>`), worktree confirmed diff-clean against `HEAD`
(`git diff HEAD -- <all five files>` — empty). Same checks:

```
$ test -f .agents/skills/_shared/coding-worker-contract.md && echo OK
test -f: OK

$ grep -qF 'cold-pickup' .agents/skills/_shared/coding-worker-contract.md && echo OK
cold-pickup: OK

$ grep -qF '[BLOCKED]' .agents/skills/_shared/coding-worker-contract.md && echo OK
BLOCKED: OK

$ ! grep -qE 'fgos (return|discover|plan) ' .agents/skills/_shared/coding-worker-contract.md && echo OK
no forbidden verb: OK
```

Full `npm test` (re-run with the worktree cwd verified via `pwd` +
`git branch --show-current` inside the same shell invocation, to rule out
a stray cwd):

```
/home/vantt/projects/forgentX/.claude/worktrees/tsk-2uf-2-pvUFIs
fgw/tsk-2uf-2
ℹ tests 3641
ℹ suites 0
ℹ pass 3636
ℹ fail 0
ℹ cancelled 0
ℹ skipped 5
ℹ todo 0
ℹ duration_ms 150708.242835
```

`node --test test/skills/fgos-mirror.test.mjs` alone (13/13 pass) —
confirms the `.claude/skills` generated wrapper needs no regeneration (it
is a content-free redirect, unaffected by the source's body changing) and
the new `_shared/coding-worker-contract.md` pair is already covered
generically by the existing mirror-parity assertions, with no test-file
edit needed for either.
