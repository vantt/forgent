# Plan — rename `fgos-executing` → `fgos-coding-implement`

## Mode

**Standard.** Flags counted against the mode-gate checklist:

- auth — no
- authorization — no
- data model — no
- audit/security — no
- external systems — no
- **public contracts — yes.** The renamed string doubles as the
  `capacityId` the runner (`src/runner/dispatch.mjs`) uses to look up
  dispatch config, per D3. Any out-of-repo capacity config keyed literally
  `fgos-executing` breaks silently after this change — an accepted,
  external-only risk per D3's rationale.
- cross-platform — no
- **existing covered behavior — yes.** `test/runner/dispatch.test.mjs`
  (~19 refs), `test/runner/loop.test.mjs`,
  `test/runner/prompt-templates.test.mjs`, and
  `test/state/workflow-stage-graphs.test.mjs` already assert the old
  literal string; the full suite must stay green after the rename.
- weak proof around the area — no (well-covered by the tests above)
- multi-domain — no (single `coding` domain)

2 flags, no hard-gate flag (no auth/data-loss/audit-security/external-
provider/validation-removal) → **standard**, not high-risk. The file count
(~200) makes this look bigger than it is — the change itself is a single,
mechanically bounded, fully reversible rename with no data-shape or
behavior change to what the skill does.

## Impact-analysis capability gate

`fgos tool query --capability impact-analysis --status present` → 1
provider (`gitnexus`, `status: present`). Per `CLAUDE.md`: **full**. The
proof point below (skillMap edit) carries a real `impact()` call, not a
weakened one.

## Approach

**Chosen path:** one atomic, cross-cutting find-and-replace pass over the
locked scope (`CONTEXT.md` D1/D2/D3), landing as a single commit — not
split into separate work items. Rejected alternative: splitting into
"code+tests" vs "docs" as two child items — rejected because the two
halves are not independently valuable or independently verifiable; a
docs-only rename would leave the runtime `capacityId` and the skill dir
name out of sync with the docs describing them, which is exactly the
inconsistency D3 exists to avoid. `fgos graph --json` confirms `tsk-f38`
sits in a 9-item component together with `tsk-38t`/`tsk-3w3`/`tsk-3xo`
(the multi-domain status-schema work) — no `topUnblock`/`criticalPath`
leverage argument favors slicing this rename itself into pieces.

**Dependency:** `tsk-38t` (Phase 2 multi-domain status schema split) must
land first — user-supplied hard ordering constraint, confirmed by
`fgos graph --json`'s `topUnblock` listing `tsk-38t` at `unblocks:2,
newlyUnblocks:3`, a real leverage item, and by both items sitting in the
same dependency component. `tsk-38t` also touches
`src/state/workflow-stage-graphs.mjs` (the same file D3's capacityId edit
lands in) — landing this rename first would risk a conflicting concurrent
edit to that file; recorded as a real dependency (`deps: [tsk-38t]`), not
just a note.

### Risk map

| Component | Risk | Proof point |
|---|---|---|
| `src/state/workflow-stage-graphs.mjs` skillMap + comment (D3) | Medium — this is the runtime `capacityId` default, consumed by `src/runner/dispatch.mjs` | Run GitNexus `impact({target: "skillForStage", direction: "upstream"})` (or the `skillMap` object literal) before editing, per `CLAUDE.md`'s MUST-run rule — full posture applies. Report blast radius before touching the file. |
| `src/runner/dispatch.mjs` capacityId consumption | Low — reads the already-renamed skillMap value, no separate literal to edit if D3's skillMap edit is the single source | Confirm via `rg "fgos-executing"` in this file returns nothing after the skillMap edit (should already be zero if this file has no independent hardcoded copy — verify during execution, not assumed here) |
| Test suite (4 files, ~30 refs) | Medium — largest single blast radius by reference count | `npm test` green is part of the item's own `verify` command (already locked) |
| Skill dir rename (`.claude/skills/`, `.agents/skills/`) | Low — pure rename + frontmatter/H1 text edit, two mirrored copies | `verify`'s `test -f`/`grep -q` assertions on both new paths (already locked) |
| Cross-referencing `SKILL.md` prose (6 skills × 2 mirrors) | Low — prose-only edits, no behavior | Covered by `verify`'s content grep |
| Doc rename + index cascade (D2) | Low — one file rename + one JSON index entry | `verify`'s `test -f` on the new doc path; index entry update is a plain text/JSON edit, no schema risk |
| `docs/history/*`, `plans/*`, `plans/reports/*` full rewrite (D1 override) | Low-medium — largest file count (~130+), purely textual, but a missed file leaves a stale reference with no automated catch beyond `verify`'s repo-wide grep | `verify`'s `rg --hidden` content check already covers this — a missed file fails verify directly |

**File touch order** (informational — `fgos-coding-implement` still designs
its own execution steps per this skill's "leave execution alone" rule):
skill dir rename first (so the new name exists before anything references
it), then the live code (`workflow-stage-graphs.mjs`, impact-checked),
then tests, then the remaining docs/history/plans sweep last (largest
file count, lowest individual risk).

## Assumptions

- `src/runner/dispatch.mjs` has no independently hardcoded copy of the
  literal `fgos-executing` outside of consuming `workflow-stage-graphs.mjs`'s
  skillMap — not material to scope/behavior (an implementation detail
  `fgos-executing`, the execution-stage skill itself, confirms directly
  against the real file), pinned here rather than asked, per this skill's
  own material/grounded/answerable filter.

## Split decision

No split. One honest piece of work — see "Chosen path" above.

## Proof surface

The item's own `verify` (locked during `clarify`, unchanged here):

```
npm test && test -f .claude/skills/fgos-coding-implement/SKILL.md && test -f .agents/skills/fgos-coding-implement/SKILL.md && grep -q "^name: fgos-coding-implement$" .claude/skills/fgos-coding-implement/SKILL.md && grep -q "^name: fgos-coding-implement$" .agents/skills/fgos-coding-implement/SKILL.md && test -f docs/how-to/smoke-test-fgos-coding-implement-with-a-trivial-item.md && grep -q "executing: .fgos-coding-implement." src/state/workflow-stage-graphs.mjs && ! rg -l --hidden "fgos-executing" --glob "!node_modules" --glob "!.git" --glob "!.claude/worktrees/**" --glob "!.fgos/state.json" --glob "!.fgos/events.jsonl*" --glob "!docs/history/rename-fgos-executing-to-fgos-coding-implement/**" . && ! git ls-files | grep "fgos-executing" | grep -v "^docs/history/rename-fgos-executing-to-fgos-coding-implement/"
```
