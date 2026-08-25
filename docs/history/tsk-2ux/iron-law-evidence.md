# Iron Law evidence — tsk-2ux

`classifyIronLaw` against the real committed diff (`f1643e39`, trunk vs.
`fgw/tsk-2ux`):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
    "src/runner/dispatch/prepare.mjs",
    "src/runner/prompt-templates/worker-prompt-skill-pointer.txt"
  ]
}
```

Command run:

```bash
node --input-type=module -e "
import { changedFiles } from './src/runner/merge.mjs';
import { classifyIronLaw } from './src/evolve/iron-law.mjs';
import { listWork } from './src/state/store.mjs';
const item = listWork('/home/vantt/projects/forgentX/.fgos').work[process.argv[1]];
const filesChanged = changedFiles('.', item);
console.log(JSON.stringify(classifyIronLaw({ filesChanged, description: item.description })));
" "tsk-2ux"
```

## Test command

```bash
node --test test/runner/dispatch.test.mjs
```

## Failing-test-first proof

Dispatched out-of-process (`agy`/`gemini-3.6-flash-medium`, `outcome:
unsignaled` — no clean `[DONE]` token, confirmed done via real driver-side
git forensics per `../_shared/coding-worker-contract.md`'s precedent
instead of the worker's own self-report). The worker committed
implementation + tests together (`f1643e39`), so the driver reproduced the
failing-before state itself: checked out the pre-fix versions of the two
implementation files (`git checkout 6ef838ca -- src/runner/dispatch/
prepare.mjs src/runner/prompt-templates/worker-prompt-skill-pointer.txt`,
`6ef838ca` = the commit immediately before `f1643e39`) while keeping the
new test file at `HEAD`, ran the suite, then restored `HEAD` and reran.

**Before** (pre-fix `prepare.mjs`/`worker-prompt-skill-pointer.txt`, new
tests present):

```
✖ buildPrompt renders docsRefPointer under "Files to read first" when docsRef is set on work item (11.471809ms)
  AssertionError [ERR_ASSERTION]: The input did not match the regular expression /# Files to read first\n\(không có\)\ndocs\/history\/my-feature\/plan\.md and \.\.\.\/CONTEXT\.md \(if present\) — the locked decisions and chosen approach for this item/. Input:

  '# Goal\n' +
    'Add the widget (kind: feature)\n' +
    '\n' +
    '# Agent skill\n' +
    'You are a fgOS agent for domain coding at the executing stage. Before doing\n' +
    'anything else, read .claude/skills/fgos-coding-implement/SKILL.md in your own checkout — it is the same skill\n' +
    'an interactive fgOS session loads for this exact domain and stage, and it\n' +
    'governs how this work item must be done.\n' +
    '\n' +
    '# Description\n' +
    '(không có)\n' +
    '\n' +
    '# Directive\n' +
    '(không có)\n' +
    '\n' +
    ... (no {docsRefPointer} line present at all under "# Files to read first")
✖ buildPrompt normalizes trailing slash in docsRef when rendering docsRefPointer (27.192308ms)
✖ buildPrompt renders "(none)" for docsRefPointer when work.docsRef is absent or empty (0.786563ms)
✔ buildPrompt for non-executing stage (e.g. discovery) does not leak literal {docsRefPointer} template variable (0.285885ms)
```

3 of the 4 new tests failed against the pre-fix code (the 4th, a negative
assertion for a non-`docsRefPointer`-declaring template, trivially holds
both before and after — expected, not a weak test: it pins that
`worker-prompt-discovery.txt` never gains a stray literal placeholder).

**After** (`HEAD` = `f1643e39`, files restored):

```
ℹ tests 309
ℹ suites 0
ℹ pass 309
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

`git status` clean after restoring `HEAD` — the driver-side reproduction
made no net change to the worktree.
