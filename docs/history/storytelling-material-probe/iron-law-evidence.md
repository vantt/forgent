# Iron Law evidence — tsk-1hy

`classifyIronLaw` against the real committed diff (after `git add`/
`git commit`, per `docs/how-to/produce-failing-test-first-proof-for-an-
iron-law-gated-diff.md`'s own timing warning):

```json
{
  "required": true,
  "matchedFlags": ["schema"],
  "matchedModules": []
}
```

**Read this honestly, not just mechanically satisfied.** `matchedModules`
is empty — this item's diff touches none of `MODULE_RULES`'s
self-modifying-capable paths (`src/runner/`, `src/evolve/`,
`bin/fgos.mjs`, `src/state/store.mjs`, `src/state/status-fsm.mjs`,
`src/state/workflow-stage-graphs.mjs`, `src/intake/risk-keywords.mjs`,
`src/intake/classify.mjs`). The single `matchedFlags: ["schema"]` comes
from `HEAVY_KEYWORDS` matching the word "schema" inside this item's own
*description* text — specifically the read-only boundary line "không tạo
state mới... **không dùng schema store**" (`CONTEXT.md` D2). The
classifier is a keyword match on raw description text, not a semantic
read — it cannot tell a rule *forbidding* schema changes from one
*requesting* them. This item genuinely never adds an event type, never
writes `.fgos/`, and never touches the schema store, exactly as D2 locked.
Still following the mechanical rule as written (`required: true` → write
this file) rather than talking myself out of it.

## Failing-test-first proof

Only one test file this item's diff touches:
`test/scripts/probe-storytelling-material.test.mjs`. Since the
implementation (`scripts/probe-storytelling-material.mjs`) is a brand-new
file with no prior version to `git stash`, "before" here means the file
not existing yet — reconstructed by temporarily removing it after the
implementation commit, then restoring via `git checkout -- <file>` (same
retroactive-reconstruction shape the how-to doc's own tsk-5cf case
describes, disclosed here for the same reason).

**Red** — `rm scripts/probe-storytelling-material.mjs`, then
`node --test test/scripts/probe-storytelling-material.test.mjs`:

```
node:internal/modules/esm/resolve:271
    throw new ERR_MODULE_NOT_FOUND(
          ^

Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/home/vantt/projects/forgentX/.claude/worktrees/tsk-1hy-sgeZGw/scripts/probe-storytelling-material.mjs' imported from /home/vantt/projects/forgentX/.claude/worktrees/tsk-1hy-sgeZGw/test/scripts/probe-storytelling-material.test.mjs
...
Node.js v24.18.0
✖ test/scripts/probe-storytelling-material.test.mjs (41.611074ms)
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

**Green** — `git checkout -- scripts/probe-storytelling-material.mjs`,
then the identical test command:

```
✔ gatherAskVista keeps only work.move events with a non-empty ask (1.588348ms)
✔ gatherDecisionVista excludes the four named boilerplate patterns and missing rationales (0.371798ms)
✔ gatherDecisionVista's singletons exclude ordinary (non-boilerplate) duplicates too (0.269459ms)
✔ gatherDecisionVista's singletons keep only the genuinely once-occurring real material (0.207013ms)
✔ groupById groups readable entries by their work item id, preserving order (0.18547ms)
✔ formatReport is grouped, readable text — not a flat unstructured stream (1.354789ms)
✔ CLI reads a real events.jsonl via --log and prints both vistas, optionally writing --report (36.787782ms)
ℹ tests 7
ℹ pass 7
ℹ fail 0
```

Working tree confirmed clean after restore (`git status --short`, no
diff against the committed implementation).

## Full suite

`npm test` run against the full implementation (before the red/green
reconstruction above, same committed code): **2651/2657 pass, 1 fail**.
The one failure — `test/docs/launcher-vocabulary-guard.test.mjs` — is
pre-existing and unrelated: it flags four files
(`docs/history/backlog-execution-reconciliation/RECONCILIATION.md`,
`docs/history/tsk-4eu-executors-key-tier-validation/iron-law-evidence.md`,
`docs/how-to/produce-failing-test-first-proof-for-an-iron-law-gated-diff.md`,
`plans/260808-2210-dispatch-vocabulary-rearrange/next-session-prompt.md`)
that were already committed to `main` at `2c85c92`, ancestor of this
branch's own base commit `617318d` — confirmed via
`git log --oneline -1 -- <those 4 paths>`. This item's own diff neither
adds nor touches any of those four paths.

## GitNexus blast radius (informational, per CONTEXT.md D9)

`detect_changes({scope: 'compare', base_ref: 'main'})` against this
worktree reported `risk_level: "high"`, touching `AGENTS.md`, `CLAUDE.md`,
and `spawnWorker` (`src/runner/dispatch.mjs`) — but this item never
touched any of those three. Cross-checked directly:
`git diff --stat 617318d..HEAD -- . ':!.fgos'` (`617318d` is this
branch's own real `branchHeadAtTake`) shows exactly the 5 files this item
actually added (`CONTEXT.md`, `plan.md`, this file's own predecessor
report, the script, the test) — zero overlap with what `detect_changes`
flagged. The `base_ref: main` compare picked up unrelated drift between
this branch's real base and `main`'s current tip (other work merged to
`main` since this branch was created), not this item's own diff — a
suspicious result, cross-checked per `CLAUDE.md`'s own impact-analysis
gate guidance, and confirmed not applicable here. This item's own real
blast radius is zero existing symbols touched — five new files only.
