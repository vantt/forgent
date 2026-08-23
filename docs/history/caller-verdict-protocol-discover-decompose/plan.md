---
type: how-to
title: "tsk-27y — plan: caller-supplied verdict protocol for fgos discover/fgos plan"
---

# tsk-27y — plan

## Mode

**standard**. Flags counted: **public contracts** (new CLI flags on `fgos
discover`/`fgos plan`, registered in `src/cli/command-registry.mjs` —
part of the CLI's introspectable contract other tooling/agents read) +
**existing covered behavior** (`resolveDiscovery`/`resolveDecompose` and the
`discover`/`decompose` CLI verbs are already covered by
`test/intake/discovery.test.mjs`, `test/intake/plan.test.mjs`,
`test/cli/fgos.test.mjs`, `test/cli/fgos-help.test.mjs`, `test/runner/
loop.test.mjs`, `test/e2e/runner-loop.test.mjs` — new behavior must not
regress any of it). 2 flags, no hard-gate flag (no auth/data-loss/audit-
security/external-provider/removed-validation) → standard, not high-risk.
No split: one cohesive protocol addition across a bounded, tightly-coupled
file set — a smaller mode would understate the CLI-contract + skill-wiring
surface; splitting would just separate parts that have to land together to
be usable at all.

## Approach

**Chosen path**: give `resolveDiscovery`/`resolveDecompose` a new optional
trailing parameter carrying a caller-supplied verdict (same shape
`judgeDiscovery`/`judgeDecompose` already return). When present, skip the
`judgeDiscovery`/`judgeDecompose` subprocess call entirely (D2: checked
before `readLockedContext`/plan.md-mode heuristic) and feed the supplied
verdict straight into the same downstream write path (`addDiscovery`/
`moveStage`/`putInAwaiting` for discovery; `logDecomposeVerdict`/
`moveStage`/`addWork`/`putInAwaiting` for decompose) — including
decompose's mechanical safety gates (D3), which stay unconditional. New CLI
flags on `bin/fgos.mjs`'s `discover`/`decompose` case blocks build that
verdict object from argv and pass it through. `fgos-coding-exploring`/
`fgos-coding-validating`'s own SKILL.md (and `.agents/` mirror) then call the new
flags once their own gate approves, closing the loop the item's original
description named (`.claude/skills/fgos-coding-exploring/SKILL.md` /
`.agents/skills/fgos-coding-exploring/SKILL.md`, same pair for `fgos-coding-validating` —
corrected from the description's own guess of `fgos-coding-planning`, see Piece 7
below) — this resolves CONTEXT.md's one outstanding question: the original
submitted description already commits to this as in-scope footprint, so
it is a Piece of this plan, not a fresh product decision requiring a
hand-back to `fgos-coding-exploring`.

**Alternatives rejected**:
- Extending `readLockedContext`'s file-based heuristic further instead of
  an explicit flag — rejected: that heuristic is exactly the fragile
  mechanism CONTEXT.md's Feature boundary names as the gap this item exists
  to close (silent-fail on a repoRoot/worktree mismatch); it also has no
  branch for decompose's `need-human`/`decompose`-with-children outcomes,
  only a binary "trust it or don't."
- Putting the caller-verdict branch inside `judgeDiscovery`/
  `judgeDecompose` themselves — rejected: those functions' whole contract
  is "spawn the model, parse its answer" (module header, D4 fail-safe);
  mixing in "or trust a pre-supplied answer" muddies a function whose only
  job today is the subprocess call. `resolveDiscovery`/`resolveDecompose`
  already own the "should I even call the judge" decision (the
  `readLockedContext` skip lives there, not inside `judgeDiscovery`) — the
  caller-verdict skip belongs at the same level, by the same precedent.
- A new CLI verb (`fgos discover-native`/`fgos plan-native`) instead
  of new flags on the existing verbs — rejected: DRY: same item, same
  stage-transition doors, same gates; a parallel verb would duplicate the
  stage-guard check (`bin/fgos.mjs:889`, `:912`) and the registry entry for
  no real benefit over an optional flag.

**Risk map**:

| Component | Risk | Proof point (validating) |
|---|---|---|
| `resolveDiscovery`/`resolveDecompose` new optional param | low — additive, every existing call site (`loop.mjs:977,997`, all existing tests) omits it and stays byte-identical | full test suite green with no existing test changed |
| CLI flag parsing (malformed `--children` JSON) | medium — user-typed input | new test: malformed `--children` JSON produces a clear validation error, mirrors `parseAcceptanceFlag`'s existing error shape |
| D2 precedence (verdict flag before `readLockedContext`) | low, but behavior-changing for a caller that passes both | new test: item has both a committed CONTEXT.md AND a `--verdict` flag — verdict flag wins, no model call, `readLockedContext` path not taken |
| D1 full decompose scope — reusing `normalizeChild` for caller-supplied children | medium — `normalizeChild` (`decompose.mjs:177-201`) is unexported but same-file, no new export needed; must reject a child missing `verify` exactly like a model-produced one | new test: caller-supplied child missing `verify` → `{kind: 'invalid'}`, same as today's model-verdict path |
| D3 gates on caller-supplied children | low — gates are pre-existing, unconditional call, no new logic | new test: caller-supplied `decompose` verdict with two children sharing a footprint path still parks in `need-human` via the existing footprint-overlap gate |
| Skill wiring (`fgos-coding-exploring`/`fgos-coding-validating` SKILL.md + `.agents/` mirror — corrected from `fgos-coding-planning`, see Piece 7 below) | low — prose-only edit, `diff` must confirm mirror pairs stay byte-identical (precedent: `docs/history/fgos-coding-planning-context-gap-handback/plan.md`) | `diff .claude/skills/fgos-coding-exploring/SKILL.md .agents/skills/fgos-coding-exploring/SKILL.md` (and the `fgos-coding-validating` pair) both empty |

`impact-analysis: full` (GitNexus present, `CLAUDE.md`'s capability gate) —
before editing `resolveDiscovery`/`resolveDecompose`/the `discover`/
`decompose` CLI case blocks at `fgos-coding-implement`, run real `impact()` calls
on those symbols and report blast radius, per `CLAUDE.md`'s MUST rule; this
plan does not fabricate a blast-radius number here since none of the risk
items above depend on one (no `blastRadiusGate` threshold concern — this
item's own change is additive/optional-param shaped, not a hot-path
behavior change for existing callers).

`fgos graph --json`: `tsk-27y` appears in neither `criticalPath` nor
`topUnblock` — no other open backlog item depends on it landing first, so
ordering here is internal to this item only, not backlog-wide.

**Files touched, in order**:

1. `src/intake/plan.mjs` — `resolveDecompose` gains the optional
   caller-verdict param; branch that skips `judgeDecompose` when present,
   reuses `normalizeChild` for supplied children, keeps D3's gates
   unconditional.
2. `src/intake/discovery.mjs` — `resolveDiscovery` gains the optional
   caller-verdict param, same skip-and-reuse shape as above (simpler shape:
   `{clear, question?, verify?}`, no children).
3. `bin/fgos.mjs` — `discover`/`decompose` case blocks (`:886-919`) parse
   the new flags (`--verdict`, `--verify`, `--question`, `--reason`,
   `--children`), build the verdict object, pass it as the new trailing
   argument.
4. `src/cli/command-registry.mjs` — register the new flags on both `discover`
   (`:130-149`) and `decompose` (`:150-169`) entries.
5. `test/intake/plan.test.mjs`, `test/intake/discovery.test.mjs` — new
   cases per the risk map above.
6. `test/cli/fgos.test.mjs` — CLI-level flag parsing/malformed-JSON test.
7. `.claude/skills/fgos-coding-exploring/SKILL.md` + `.agents/skills/fgos-coding-exploring/
   SKILL.md`, `.claude/skills/fgos-coding-validating/SKILL.md` + `.agents/skills/
   fgos-coding-validating/SKILL.md` — call the new flags once their own gate
   approves; mirror pairs edited identically, `diff` confirms.

   **Correction found during executing (tsk-27y, this item):** the file
   list above originally named `fgos-coding-planning/SKILL.md` as the second call
   site (per the item's own original description, written before the
   pipeline was traced start to finish). Tracing it live during this item's
   own `executing` stage — including this session hitting the exact bug
   this item fixes, when it forgot to fire `fgos discover` after
   `fgos-coding-exploring`'s gate and had to debug why the item was still stuck at
   `clarify` — showed `fgos-coding-planning` hands off to `fgos-coding-validating` BEFORE
   the `decompose`→`executing` edge fires (`fgos-coding-validating/SKILL.md`'s own
   existing hard rule: "Before this session ... calls `fgos plan` ...").
   `fgos-coding-validating` is the actual last gate before that edge, so it is the
   correct call site — `fgos-coding-planning` never calls an engine verb at all
   (its own hard rule: "Do not apply any stage move yourself"). This is a
   file-target fix, not a scope change: the intent CONTEXT.md/plan.md
   already locked (call the new flag once the decision is truly locked and
   gate-approved) is unchanged; only which skill's gate that maps to was
   wrong in the original guess.

## Concrete cases to prove against (validating)

- Discovery: `--verdict clear --verify "<cmd>"` moves the item to
  `decompose` with that exact verify, no model call.
- Discovery: `--verdict unclear --question "<text>"` parks in
  `awaiting-human` with that exact question, no model call.
- Decompose: `--verdict pass-through` moves to `executing`, no model call.
- Decompose: `--verdict need-human --reason "<text>"` parks in
  `awaiting-human`, no model call.
- Decompose: `--verdict decompose --reason "<text>" --children '[...]'`
  writes children exactly as a model-produced `decompose` verdict would,
  through the same gates (D3) — including the existing footprint-overlap
  and heavy-risk/blast-radius gates still firing when applicable.
- Boundary: malformed `--children` JSON → clear validation error, no partial
  write.
- Existing behavior unchanged: every current call site (runner sweep, every
  existing test) that never passes the new param behaves byte-identically.
- Precedence (D2): both a verdict flag and a committed CONTEXT.md/plan.md
  tiny-small mode present on the same call → verdict flag wins.

## Assumptions

- No split — this lands as one item (see Mode above).
- Flag names/shapes as listed in CONTEXT.md's own Assumptions section
  (`--verdict`/`--verify`/`--question`/`--reason`/`--children`), carried
  forward unchanged here.
- Verify for this item as a whole (no split, so this is the item's own
  `verify`, not a per-child one): `npm test` (`package.json`'s `test`
  script: `node --test 'test/**/*.test.mjs'`) — matches AGENTS.md's own
  definition-of-done proof bar (state + cli + runner + e2e suite green) and
  covers every risk-map proof point above in one run.

## Verify

```
npm test
```
