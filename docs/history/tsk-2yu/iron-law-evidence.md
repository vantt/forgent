# Iron Law evidence: tsk-2yu

`classifyIronLaw` (`src/evolve/iron-law.mjs`), run against the real
committed diff (`changedFiles`, `src/runner/merge.mjs`) on `fgw/tsk-2yu`
after commit `1620444e` (merge of `fgw/tsk-2yu-1`):

```json
{
  "required": true,
  "matchedFlags": [
    "migration"
  ],
  "matchedModules": []
}
```

Command run:

```bash
node --input-type=module -e "
import { changedFiles } from './src/runner/merge.mjs';
import { classifyIronLaw } from './src/evolve/iron-law.mjs';
import { listWork } from './src/state/store.mjs';
const item = listWork('/home/vantt/projects/forgentX/.fgos').work['tsk-2yu'];
const filesChanged = changedFiles('/home/vantt/projects/forgentX', item);
console.log(JSON.stringify(classifyIronLaw({ filesChanged, description: item.description }), null, 2));
"
```

## Verify command

```
node scripts/check-decision-citation-drift.mjs --decisions-dir docs/decisions --backlog docs/backlog.md --specs-dir docs/specs --skills-dir .agents/skills --skills-dir plugins/fgOS/skills --write-baseline && node -e "const d=require('./scripts/check-decision-citation-drift.baseline.json');const n=Object.values(d).flat().length;if(n>=1788)process.exit(1);console.log('baseline count:',n)"
```

## Failing-before / passing-after transcript

**Before** (real transcript, obtained via a temporary `git worktree add`
at commit `39923c38` — the validating-pass commit immediately before the
fix commit `ebcfb7db` — then running the exact verify command there):

```
$ git worktree add /tmp/.../tsk-2yu-before 39923c38
$ cd /tmp/.../tsk-2yu-before
$ node scripts/check-decision-citation-drift.mjs --decisions-dir docs/decisions --backlog docs/backlog.md --specs-dir docs/specs --skills-dir .agents/skills --skills-dir plugins/fgOS/skills --write-baseline && node -e "const d=require('./scripts/check-decision-citation-drift.baseline.json');const n=Object.values(d).flat().length;if(n>=1788)process.exit(1);console.log('baseline count:',n)"

check-decision-citation-drift: wrote baseline with 1788 known finding(s) across 73 file(s).
EXIT CODE: 1
```

(the `node -e` threshold check never printed its own success line since
`n=1788 >= 1788` hit `process.exit(1)` first)

**After** (real transcript, same command run on the current `fgw/tsk-2yu`
HEAD, which already carries the merged `fgw/tsk-2yu-1` fix — 124
`bare-citation` findings in `docs/specs/work-state.md` resolved with a
one-line gloss each):

```
$ node scripts/check-decision-citation-drift.mjs --decisions-dir docs/decisions --backlog docs/backlog.md --specs-dir docs/specs --skills-dir .agents/skills --skills-dir plugins/fgOS/skills --write-baseline && node -e "const d=require('./scripts/check-decision-citation-drift.baseline.json');const n=Object.values(d).flat().length;if(n>=1788)process.exit(1);console.log('baseline count:',n)"

check-decision-citation-drift: wrote baseline with 1664 known finding(s) across 73 file(s).
baseline count: 1664
EXIT CODE: 0
```

## Scope note

This item's own recorded `verify` only requires the baseline count to
drop below 1788 — it does not require the full 1788-finding backlog to be
cleared. Per `plan.md`'s own "Split" section, this is a deliberate
calibration-slice scope: one child (`tsk-2yu-1`, delivered) fixed the 124
`bare-citation` findings in `docs/specs/work-state.md` as a proof-of-
approach batch; the remaining 1664 findings (301 `d-local-outside-home`
in `work-state.md` + 1363 across the other 72 files) are explicitly
deferred to a follow-on planning round, not fixed by this item. The
baseline (`scripts/check-decision-citation-drift.baseline.json`) still
ratchets against the current 1664, so no new drift is permitted regardless
of how the remaining backlog is later scheduled.
