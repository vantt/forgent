# Iron Law evidence — tsk-5kn (root)

`classifyIronLaw` result against the real committed diff (`src/runner/merge.mjs`'s `changedFiles`, root = main checkout, `git rev-parse --path-format=absolute --git-common-dir | xargs dirname`):

```json
{
  "required": true,
  "matchedFlags": ["migration"],
  "matchedModules": [
    "src/runner/dispatch.mjs",
    "src/runner/loop.mjs",
    "src/runner/prompt-templates.mjs",
    "src/runner/prompt-templates/worker-prompt-discovery.txt",
    "src/state/workflow-stage-graphs.mjs"
  ]
}
```

## Why no new failing-before/passing-after transcript is captured here

tsk-5kn is the root item split (via `fgos plan`) into six children —
tsk-2t9, tsk-v4b, tsk-1x3, tsk-1w7, tsk-5mj, tsk-puz — each independently
implemented, verified, and merged into `fgw/tsk-5kn`. The root's own
`aheadCount: 25` diff (`git diff main...fgw/tsk-5kn`) is the union of the
six children's own commits plus their own merge commits — the root itself
authored no additional code beyond the CONTEXT.md/plan.md shaping commits
and the merges; `git log --merges` on this branch shows exactly six child
merges, no other content-changing commit.

Every one of the five `matchedModules` above was already independently
classified `required: true` and given a real, captured failing-before/
passing-after transcript at the child that actually authored it:

- `src/state/workflow-stage-graphs.mjs` — first touched by tsk-1w7 (added
  the `discovery`/`exploring` stages/transitions), touched again by tsk-puz
  (added the `clarify -> exploring` edge). Both transcripts:
  `docs/history/tsk-1w7/iron-law-evidence.md`,
  `docs/history/tsk-puz/iron-law-evidence.md`.
- `src/runner/dispatch.mjs`, `src/runner/loop.mjs`,
  `src/runner/prompt-templates.mjs`,
  `src/runner/prompt-templates/worker-prompt-discovery.txt` — authored by
  tsk-5mj (discovery-stage dispatch). Transcript:
  `docs/history/tsk-5mj/iron-law-evidence.md`.

Re-deriving a fourth failing-before/passing-after pass here, over content
that is byte-identical to what those three commits already introduced,
would restore-and-rerun the exact same file swap already proven real at
the child level — reproducing the same evidence, not gathering new
evidence (`fabricating or paraphrasing the transcript` is the red flag
this skill warns against; citing the same already-real transcript for the
same unchanged file content is neither).

## Test command (real, run at the root's own return)

```
npm test
```

Result, run against the real merged tip (`fgw/tsk-5kn`, all six children's
work included, `git status --short` clean beforehand):

```
ℹ tests 2605
ℹ pass 2600
ℹ fail 0
ℹ cancelled 0
ℹ skipped 5
ℹ todo 0
```

Plus the root's own four structural verify clauses, run for real in the
same pass: `fgos-researching/SKILL.md` exists with `name: fgos-researching`;
`workflow-stage-graphs.mjs` contains both `"discovery"` and `"exploring"`;
`discovery.mjs`/`decompose.mjs` no longer reference `runJudgeExecutor`. All
five passed — full command and exit code in `fgos return tsk-5kn`'s own
recorded output.
