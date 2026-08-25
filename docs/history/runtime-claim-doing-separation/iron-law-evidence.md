# Iron Law evidence — tsk-40m

`classifyIronLaw` on this item's final committed diff (`7c4c4a13`, trunk...branch) returns:

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
    "bin/fgos.mjs",
    "src/runner/anti-loop.mjs",
    "src/runner/claim-port.mjs",
    "src/runner/loop.mjs",
    "src/state/store.mjs"
  ]
}
```

All five are on `MODULE_RULES` (`src/evolve/iron-law.mjs`) as self-modifying-capable
modules the diff genuinely changes — no description-keyword false positive.

## The failing-test-first proof: claimWork() must never durably write status:'doing'

The whole point of tsk-40m (`CONTEXT.md` D1-D6) is that live claim/session/slot
coordination moves out of the durable, git-tracked eventlog into a gitignored
runtime overlay (`.fgos/runtime/claims/<id>.json`). The single sharpest
observable proof of that: after `claimWork()` runs, the durable eventlog must
contain **zero** `work.move(->doing)` events for the claimed item — before this
item, every claim wrote exactly one.

### RED — run against the pre-fix code (parent commit `6c3cfe40`)

```
$ node iron-law-red-green-claim-doesnt-write-doing.mjs <pre-fix claim-port.mjs> <pre-fix store.mjs>
durable work.move(->doing) events after claim: 1
FAIL: claim wrote a durable doing transition to the tracked eventlog
```

### GREEN — run against the post-fix code (this branch, commit `7c4c4a13`)

```
$ node iron-law-red-green-claim-doesnt-write-doing.mjs <post-fix claim-port.mjs> <post-fix store.mjs>
durable work.move(->doing) events after claim: 0
PASS: claim wrote no durable doing transition -- runtime-only claim
```

Both runs used the exact same script and the exact same test scenario (fresh
repo, `todo` item, `claimWork(..., { isolate: false })`), swapping only which
commit's `claim-port.mjs`/`store.mjs` were imported — a genuine before/after
comparison of the real, deployed modules, not a paraphrase.

### Full suite, post-fix

```
$ npm test
ℹ tests 4031
ℹ pass 4026
ℹ fail 0
ℹ skipped 5
ℹ duration_ms 154611.628615
```

```
$ node --test test/state/runtime-coordination.test.mjs test/runner/claim-port.test.mjs test/cli/fgos-claim.test.mjs test/cli/fgos-claim-2.test.mjs
ℹ tests 87
ℹ pass 87
ℹ fail 0
```

## Verification source

- `src/evolve/iron-law.mjs` — `classifyIronLaw`'s `MODULE_RULES` list, confirming
  the five matched files are self-modifying-capable and trigger `required: true`
  on a real files-changed match.
- The RED/GREEN transcripts above — real command runs against the real
  `claim-port.mjs`/`store.mjs` module contents from each commit (the pre-fix
  copy loaded via a temporary `git worktree add` at the parent commit, removed
  after use), not paraphrased or fabricated.
- `docs/history/runtime-claim-doing-separation/CONTEXT.md` D1-D6 and
  `plan.md`'s risk map — the decisions and proof points this evidence
  satisfies, in particular D2 (CAS via claimId + preClaimStatus +
  preClaimRevision replacing `expectedStatus:'doing'`) and D5 (durable
  `awaiting-approval`/`blocked` transitions only ever written by
  `settleClaim`, never by `claimWork` itself).
