# Iron Law evidence — `tsk-1y6-1`

`classifyIronLaw` (`src/evolve/iron-law.mjs`) run against this item's real
committed diff (`changedFiles`, `src/runner/merge.mjs`), after the
implementation commit `d694a7d2` landed — never before it, since the diff
sees committed history only and a pre-commit run under-reports `required`
(`docs/history/tsk-2l0-iron-law-check-commit-ordering/`).

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["bin/fgos.mjs"]
}
```

Changed files the classifier was actually called with:

```
bin/fgos.mjs
docs/history/iron-law-gate-human-ux/CONTEXT.md
docs/history/iron-law-gate-human-ux/DISCUSSION.md
docs/history/iron-law-gate-human-ux/plan.md
docs/specs/distribution.md
plans/260815-1444-iron-law-gate-ux-execution/EXECUTION-PROMPT.md
src/setup/registrations.mjs
test/cli/fgos-approve.test.mjs
test/cli/fgos-iron-law-gate.test.mjs
test/setup/checks.test.mjs
```

`bin/fgos.mjs` is the tripped module. It is also the file this item exists
to change, so the gate is doing exactly what it was built for: this diff
edits the very verb (`approve`) that decides whether such a diff may land.

## Failing-test-first proof

`test/cli/fgos-iron-law-gate.test.mjs` was written and run BEFORE any
production code changed. The run below is the real, unedited transcript of
that first execution against unmodified `bin/fgos.mjs` and
`src/setup/registrations.mjs`.

Command:

```
node --test test/cli/fgos-iron-law-gate.test.mjs
```

Result — 5 fail / 5 pass:

```
✔ approve of a ROOT item (target is trunk) whose diff touches a gated module still REFUSES — the gate is alive at the only boundary it guards (459.222724ms)
✖ approve of a LEAF item (target is fgw/<root>, never trunk) whose OWN commit touches the SAME gated module PROCEEDS with no --acknowledge-iron-law (D1) (368.268095ms)
✔ sync-root of a root with NO parent (target is trunk) whose branch touches a gated module REFUSES (2864.613627ms)
✖ sync-root of a NESTED root (target is fgw/<parent>) whose branch touches the same gated module PROCEEDS (D1) (4487.611673ms)
✖ sync-root discriminates on !item.parent, NOT resolveRoot: a root whose parent id is absent from the view still targets fgw/<parent>, so the gate stays quiet (plan.md A1b) (290.401354ms)
✔ a missing ironLaw key fails closed to ask — the root approve above still refuses (D7) (447.366137ms)
✔ an unrecognized ironLaw.level fails closed to ask rather than reading as warn (D7) (455.196921ms)
✖ ironLaw.level = warn lets the same root approve through AND writes exactly one decision record with kind engine (D3/D8) (450.730916ms)
✔ ironLaw.level = ask writes NO skip record when it refuses — the record marks a real skip, never an attempt (D8) (436.945215ms)
✖ merge next at level warn does NOT skip an Iron-Law item — the pure pre-check reads the same level the real gate does (439.425418ms)
ℹ tests 10
ℹ pass 5
ℹ fail 5
```

The split is the point, and it is why this is genuine red rather than a
suite that would go green on a deleted gate:

- The **5 failures** are the new behavior, absent from the code at that
  moment. Each failed because the gate still refused where D1 says it must
  not, or because `ironLaw.level` did not exist yet.
- The **5 passes** are behavior this item must NOT regress — the gate still
  refusing at the trunk boundary, and failing closed to `ask`. They passed
  before the change and pass after it.

Two representative failure messages from that run, quoted verbatim — both
are the old gate refusing at a boundary D1 removes:

```
✖ sync-root discriminates on !item.parent, NOT resolveRoot ...
  AssertionError [ERR_ASSERTION]: target is fgw/ghost-parent, never trunk — the gate must not fire:
  fgos: sync-root: "gate-sync-dangling" trips the Iron Law — a failing test must precede this
  self-modifying diff before it can land. Matched flags: [none]; matched modules:
  [src/runner/iron-law-gate-probe.mjs]. Re-run with --acknowledge-iron-law to confirm
  failing-test-first proof and proceed.
  4 !== 0
```

```
✖ ironLaw.level = warn lets the same root approve through ...
  AssertionError [ERR_ASSERTION]: warn prints and records instead of refusing:
  fgos: approve: "gate-level-warn" trips the Iron Law — a failing test must precede this
  self-modifying diff before it can land. Matched flags: [none]; matched modules:
  [src/runner/iron-law-gate-probe.mjs]. Re-run with --acknowledge-iron-law to confirm
  failing-test-first proof and proceed.
  4 !== 0
```

## Green after the change

Same command, after the implementation:

```
ℹ tests 10
ℹ pass 10
ℹ fail 0
```

The item's own recorded `verify`, run verbatim:

```
npm test && grep -q 'ironLaw' src/setup/registrations.mjs && node --test test/cli/fgos-iron-law-gate.test.mjs
```

```
ℹ tests 3348
ℹ pass 3343
ℹ fail 0
VERIFY_EXIT=0
```

## Honest gaps in this evidence

Two things a reviewer should not have to discover for themselves.

**Two red runs sat between the first transcript and green, both from my own
mistakes, not from the feature.** After the production edit, one run failed
on a `DEFAULT_IRON_LAW_LEVEL is not defined` reference error (I moved the
constant to `registrations.mjs` and imported only half of it), and another
failed because the sync-root fixtures cut `fgw/<parent>` from main before
the item's own `.fgos/events.jsonl` state commits, so ADR0020 rejected the
merge (`fgos-write-rejected`) for a reason unrelated to the gate. Neither
was a real behavior finding; both are noted so the transcript's jump from
5-fail to 10-pass is not read as smoother than it was.

**Earlier `npm test` runs in this session were invalid and are not quoted
above.** The session's working directory was repeatedly swapped into a
sibling worktree by a concurrently running agent, so two full-suite runs
executed against the main checkout rather than this branch and reported a
green that meant nothing here. The numbers quoted above come only from runs
whose `pwd` was verified as this worktree in the same shell invocation.

## Files this diff touches beyond the item's declared footprint

Three, each a direct consequence of a locked decision rather than added
scope:

- `test/cli/fgos-approve.test.mjs` — one test asserted that a leaf whose own
  commit touches a gated module REFUSES, which is precisely the behavior D1
  removes. Rewritten to assert it proceeds, keeping the leaf-scoped-diff
  half (tsk-4voj D1's own subject) by checking the file really did land on
  `fgw/<root>`. The refusal half it used to carry now lives in
  `test/cli/fgos-iron-law-gate.test.mjs` at the trunk boundary.
- `test/setup/checks.test.mjs` — two hardcoded lists (every registered
  doctor check; a config file holding every default key) that a new
  registration necessarily extends.
- `docs/specs/distribution.md` — Data Dictionary rows 7 and 7b carry an
  explicit obligation that a module adding a check or fix updates the row in
  the same change, enforced by `test/setup/registrations.test.mjs`.

`.fgos/config.json` was in the declared footprint but is not in this diff: a
linked worktree never carries a working-tree copy of `.fgos/` (ADR0020), so
it cannot be edited from here. It also does not need to be — the registered
`configDefault` means `fgos setup` / `fgos doctor --fix` writes the key, and
until then `readIronLawLevel` degrades an absent key to `ask`, which is
byte-identical to the behavior before this change.
