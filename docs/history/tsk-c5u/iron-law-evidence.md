# Iron Law evidence — tsk-c5u

## Classification (real, run after commit `e92cfe66`)

```json
{
  "required": true,
  "matchedFlags": ["audit"],
  "matchedModules": []
}
```

Produced by `classifyIronLaw({ filesChanged, description })`
(`src/evolve/iron-law.mjs`), `filesChanged` from `changedFiles('.', item)`
against the real committed diff `main...fgw/tsk-c5u` (commit `e92cfe66`).

## Why `required: true` fired, and why no code-level failing-test-first
transcript exists for this diff

`matchedModules` is **empty** — zero files in this diff match any of
`MODULE_RULES`'s eight self-modifying-capable path patterns
(`src/runner/`, `src/evolve/`, `bin/fgos.mjs`, `src/state/store.mjs`,
`src/state/status-fsm.mjs`, `src/intake/risk-keywords.mjs`,
`src/intake/classify.mjs`, `src/state/workflow-stage-graphs.mjs`). The
entire `required: true` result comes from `matchedFlags: ["audit"]`
alone — `classifyIronLaw` runs the same `HEAVY_KEYWORDS`/`matchesKeyword`
check `gate-bypass.mjs`'s own hard-gate floor uses (`src/evolve/
iron-law.mjs:13,86-90`, `src/intake/risk-keywords.mjs`), against this
item's own submitted `description` text — which contains the word
"audit" once, in the phrase "the fgos decision audit-trail requirement"
(describing the pre-existing `fgos decision` LOGGING convention this
item's new shared file documents, not a new audit/compliance feature).

This is the identical documented, accepted false-positive shape already
hit once earlier in this same item's lifecycle, at the `validateApprove`
gate (`fgos gate-check` returned `canAutoApprove: false` for the same
reason — see the item's own decision log, `gate-approve --actor human`
recorded 2026-08-21T03:01:31Z after a person confirmed proceeding).
`gate-bypass.mjs`'s own code comment (`:159-167`) names this exact
limitation as accepted-by-design: "A title/description that merely
mentions a hard-gate word as a topic... still hard-gates — accepted,
because the failure mode is asking a human unnecessarily (friction),
never silently skipping a real risk." `classifyIronLaw` shares the same
keyword-matching mechanism and the same accepted failure mode.

The real committed file set (`git diff --name-only main...HEAD` against
commit `e92cfe66`):

```
.agents/skills/_shared/catchup-self-recovery.md
core/skills/_shared/catchup-self-recovery.md
docs/history/merge-approve-self-recovery-consolidation/RESEARCH.md
docs/history/merge-approve-self-recovery-consolidation/plan.md
plugins/fgOS/skills/_shared/catchup-self-recovery.md
plugins/fgOS/skills/approve/SKILL.md
plugins/fgOS/skills/merge-loop/references/blocked-pick-decision-tree.md
plugins/fgOS/skills/merge-next/SKILL.md
```

Every entry is a `.md` path — no `src/`, `bin/`, or `test/` file changed
(independently confirmed: `git diff --name-only main...HEAD | grep -qv
'\.md$'` returns nothing, the same scope-guard assertion the item's own
`verify` command runs). There is no code behavior for a failing-test-
first transcript to demonstrate: nothing on `MODULE_RULES`'s list, or any
other executable path, was touched, so there is no self-modifying-capable
code this diff could have weakened, and stashing/restoring a "before"
implementation state (the recipe in `docs/how-to/produce-failing-test-
first-proof-for-an-iron-law-gated-diff.md`) has no code-level red state
to honestly produce here. Fabricating one would violate this skill's own
Red Flag ("fabricating or paraphrasing the failing-test-first transcript
... instead of pasting the real command output").

## The evidence that actually applies here: full-suite proof, real run

Since no code changed, the relevant proof is that the full test suite is
unaffected — run for real, not asserted:

```
npm test
...
ℹ tests 3777
ℹ suites 0
ℹ pass 3772
ℹ fail 0
ℹ cancelled 0
ℹ skipped 5
ℹ todo 0
ℹ duration_ms 347939.783541

[exited with code 0]
```

Run independently by the driver session (not the dispatched worker's own
self-report) against the real committed tree at `e92cfe66`, in the
item's own worktree. 3772 passing, 0 failing, 5 pre-existing skips — the
same shape a clean baseline run would show, consistent with a diff that
touches no executable path.

The item's own full acceptance `verify` command (also independently
re-run by the driver, every clause checked separately) passed in full:
new shared file exists at all three mirrored locations
(`core/`, `.agents/`, `plugins/fgOS/`) and is byte-identical between the
two consumed-at-runtime copies (`plugins/fgOS/skills/_shared/
catchup-self-recovery.md` vs. `.agents/skills/_shared/
catchup-self-recovery.md`); all three consumer skills
(`approve/SKILL.md`, `merge-next/SKILL.md`,
`merge-loop/references/blocked-pick-decision-tree.md`) reference it;
`approve/SKILL.md` now names `verify-fail-post-merge`; and the scope
guard confirms every changed file is `.md`.
