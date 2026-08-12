# gate-bypass — plan

Item: `tsk-6bx` (Pieces 1-2, D1-D5), extended by `tsk-1ds` (Piece 3, D6) and
`tsk-1vi` (Piece 4, D7-D8). Decisions: `docs/history/gate-bypass/CONTEXT.md`.

## Mode (mechanical count)

Flags checked against the item:

| Flag | Applies? | Why |
|---|---|---|
| auth | no | — |
| authorization | no | — |
| data model | no | new config file, not a schema change to work items |
| audit/security | **yes** | the feature's whole purpose is deciding when a human confirmation step gets skipped — that is an audit/security-relevant control surface even though D4 keeps a floor |
| external systems | no | — |
| public contracts | no | `.fgos/gate-bypass.json` is internal state, not a published contract |
| cross-platform | no | — |
| existing covered behavior | **yes** | rewrites the Gate step already shipped in `fgos-coding-exploring` and `fgos-coding-planning` (this file's own skill) |
| weak proof around the area | **yes** | skill-prose Gate behavior has exactly one existing test today (`test/skills/fgos-mirror.test.mjs`), and it only checks byte-identity between `.claude/skills/fgos/` and `.agents/skills/fgos/` — it asserts nothing about the Gate logic itself |
| multi-domain | no | single `coding` domain |

`audit/security` alone is a hard-gate flag → **mode = high-risk**, independent of the 3-flag count (which would already land `standard` on its own). A smaller mode would not honestly cover an item whose entire point is loosening a human-oversight default.

## Approach

Chosen path: two independently workable pieces, ordered infra-first so the
skill-prose piece has something real to call instead of writing against a
guessed interface.

Rejected: doing it as one item. `fgos-mirror.test.mjs`'s byte-identity
requirement means every skill-prose edit must land in two trees at once —
mixing that with new state/CLI code in one diff makes the diff harder to
review and re-tests two very different kinds of risk (state-layer
correctness vs. prose-mirror drift) in the same pass.

`fgos graph --json` was run; `tsk-6bx` has no deps and sits in its own
size-1 component, so there is no existing cross-item ordering constraint to
honor — the ordering below is purely about this item's own internal shape,
not the graph's.

### Risk map

| Component | How risky | What would prove it |
|---|---|---|
| `.fgos/gate-bypass.json` level storage + read/write | low | unit test: round-trip read/write, missing-file default (`off`), malformed-file behavior |
| tier-coverage check (`level` × item `tier` → covered?) | low | unit test: table-driven over all `(level, tier)` pairs against `TIERS` ordering |
| "zero open items" completeness scan | **medium** | unit test against a fixture `CONTEXT.md`/`plan.md` with deferred questions/assumption markers present vs. absent — false-negative here (calling an incomplete artifact "clear") is exactly the failure D2 exists to prevent |
| hard-gate floor check reuse (D4) | **medium** | unit test: an item carrying a `src/intake/risk-keywords.mjs` hard-gate hit is never skippable even at `level: heavy` — this is the floor the whole feature's safety story rests on, needs its own explicit proof, not incidental coverage |
| `fgos-coding-exploring`/`fgos-coding-planning` Gate section rewrite | medium | `test/skills/fgos-mirror.test.mjs` (byte-identity, already exists) + manual read-through: does the rewritten Gate section still ask exactly the two locked wordings ("Decisions locked...", "Work shape is ready...") on the non-skip path? |
| D3 audit visibility (log + "auto-approved" line) | low | unit/integration test: skipping a gate produces a `fgos decision` log entry; no test can assert the conversational line gets *said* — that's a prose instruction, proven only by following the skill, same as every other Gate wording in this repo today |

The medium entries (completeness scan, hard-gate floor reuse) are the two
that need a real proof point at `fgos-coding-validating`, not a guess here — they
are the two ways this feature could fail in the direction that matters
(silently skipping a gate that should have fired).

## Shape (high-risk — fuller map)

### Piece 1 — gate-bypass infra (state/CLI layer)

What: `.fgos/gate-bypass.json` (level: `off`/`light`/`standard`/`heavy`,
default `off` when absent — matches D5's reuse of `TIERS`), a
`isTierCovered(tier, level)` pure helper, a `hasOpenItems(artifactPath)`
completeness scanner (D2), and reuse of the existing hard-gate
detector from `src/intake/risk-keywords.mjs` (D4) exposed as a single
`canAutoApprove(item, artifactPath)` function combining all three per D5's
two-axes-plus-floor shape.

Files likely touched: new `src/state/gate-bypass.mjs`, new
`test/state/gate-bypass.test.mjs`, `src/cli/command-registry.mjs` (a
read/status verb, mirroring `fgos-runner.json`'s pattern of a plain JSON
file with no CLI verb required to edit it by hand — a `status`-only verb is
enough, matching `TIERS`' own no-CLI-setter precedent).

Verify: `node --test test/state/gate-bypass.test.mjs`

Depends on: nothing (first piece).

### Piece 2 — wire the Gate steps

What: rewrite `fgos-coding-exploring`'s and `fgos-coding-planning`'s Gate sections to
call `canAutoApprove` before presenting their respective approval question;
on a covered+clear result, post the D3 visible line and log the D3 decision
instead of asking; otherwise present the gate exactly as today, unchanged
wording. Mirror every edit into `.agents/skills/fgos/` in the same commit
(`fgos-mirror.test.mjs`'s existing requirement, not a new one this item
invents).

Files likely touched: `.claude/skills/fgos/fgos-coding-exploring/SKILL.md`,
`.claude/skills/fgos/fgos-coding-planning/SKILL.md`, and their byte-identical
`.agents/skills/fgos/` counterparts.

Verify: `node --test test/skills/fgos-mirror.test.mjs`

Depends on: Piece 1 (`canAutoApprove` must exist to call).

### Cases worth proving against (high-risk depth)

- Artifact with an explicit "TODO"/deferred-question marker still present →
  never auto-approved, regardless of level/tier.
- Item carrying a hard-gate risk-keyword hit at `level: heavy` → still
  stops for a human (D4 floor test, the single most important case in this
  whole feature).
- `.fgos/gate-bypass.json` missing entirely → defaults to `off`, identical
  behavior to today, no regression for repos that never opt in.
- Malformed/corrupt `.fgos/gate-bypass.json` → fails closed (`off`), never
  fails open.
- A gate that gets auto-approved still produces a real decision-log entry
  (`fgos list`'s `view.decisions` shows it) — this is what makes D3's
  audit trail testable at all, not just a prose promise.

## Split

Two pieces as shaped above. Per the schema's own `parent` field semantics
(`src/state/work.mjs:195-216`) and the command registry, no CLI verb
(`add`/`edit`) accepts a `--parent` value today — `add`'s field list is
`id/title/kind/risk/verify/deps/refs/learn/tier/domain/footprint/
discovered-from/docs-ref/acceptance/goal-tier/targets`, no `parent`. Setting
`parent` is the decompose auto-judge's own machine action — confirmed at
`src/intake/plan.mjs:349` (`parent: id` written when a split is
judged) — consistent with `fgos-routing`'s "the
engine's verb always wins" precedence rule. This plan documents the two
child titles and their verify commands as the shape for that later
machine step to act on; this session does not fabricate a `--parent` flag
that does not exist, and does not create the children by hand.

- **Child 1**: "gate-bypass config + tier-coverage + completeness check
  (state/CLI layer)" — kind: feature, risk: standard, verify:
  `node --test test/state/gate-bypass.test.mjs`.
- **Child 2**: "wire fgos-coding-exploring/fgos-coding-planning Gate steps to
  gate-bypass check, mirror to .agents" — kind: feature, risk: standard,
  verify: `node --test test/skills/fgos-mirror.test.mjs`. Depends on Child 1.

## Execution

Per the locked decision that Execute/verify already have a working
mechanical path (goal-check + `return`'s re-verify), this plan does not
redesign that — each piece above already names its one proof command.

## Piece 3 — validateApprove bypass (D6, `tsk-1ds`)

Item: `tsk-1ds`. Decision: `docs/history/gate-bypass/CONTEXT.md` D6, first
written up in `docs/history/gate-question-quality-and-routing/
DISCUSSION.md#task-validate-bypass`. Extends Pieces 1-2 above to the third
skill-embedded gate — `fgos-coding-validating`'s `validateApprove`, the one this
file's own original "Deferred to planning" section flagged as a maybe.

### Mode (mechanical count)

| Flag | Applies? | Why |
|---|---|---|
| auth | no | — |
| authorization | no | — |
| data model | no | no schema change |
| audit/security | **yes** | same nature as Pieces 1-2 — decides when a human confirmation step is skipped |
| external systems | no | — |
| public contracts | no | internal skill mechanism |
| cross-platform | no | — |
| existing covered behavior | **yes** | rewrites the Gate step already shipped in `fgos-coding-validating`, and the mirror invariant (`test/skills/fgos-mirror.test.mjs`) means the edit must land in `.claude/skills/fgos-coding-validating/SKILL.md` AND its byte-identical `.agents/skills/fgos-coding-validating/SKILL.md` counterpart, or an existing, currently-green test breaks |
| weak proof around the area | no | `canAutoApprove`'s core mechanism (hard-gate floor, tier coverage) already has 14 passing tests in `test/state/gate-bypass.test.mjs`; only the new third axis is unproven, and this piece's own verify adds that proof |
| multi-domain | no | single `coding` domain |

`audit/security` alone is a hard-gate flag → **mode = high-risk** per the
same rule Pieces 1-2 used, independent of the flag count. In practice this
piece is much smaller than Pieces 1-2: it reuses an already-proven,
already-tested mechanism (`canAutoApprove`'s D4 floor + D5 tier check)
rather than building it from scratch, and touches three files instead of a
whole new subsystem — but the lane rule is mechanical, not vibes, so the
flag still governs.

### Approach

Chosen path: one honest piece, not split further. Unlike Pieces 1-2 (new
infra + a separate wiring pass across two skills), this is a single
`canAutoApproveValidate` export plus wiring it into exactly one Gate
section — splitting it would separate two things that are only meaningful
together (the new export has no caller until the Gate section calls it,
and the Gate section has nothing to call until the export exists).

`fgos graph --what-if tsk-1ds --json` was not run: `tsk-1ds` has no `deps`
and no candidate sibling split, so there is no ordering choice for that
command to inform.

Impact-analysis posture (`CLAUDE.md`'s capability gate): **full** —
`fgos tool query --capability impact-analysis --status present` returned
GitNexus `present`. Not exercised as a proof point here because this piece
is purely additive to `src/state/gate-bypass.mjs` (a new export, D6 and
the item description both bar editing `canAutoApprove`/`hasOpenItems`
themselves) — there is no existing symbol being *edited* for impact
analysis to bound the blast radius of.

### Risk map

| Component | How risky | What would prove it |
|---|---|---|
| `canAutoApproveValidate(item, verdict, level)` — reuses D4 floor + D5 tier axis verbatim, swaps `hasOpenItems` for `verdict === 'READY'` | low | unit tests mirroring the existing `canAutoApprove` table: `READY` → true (subject to floor/tier), `READY WITH CONSTRAINTS` → false, `NOT READY` → never reached (Gate section skips the check entirely on `NOT READY`, per "Giữ nguyên" in the item description) |
| D4 hard-gate floor still holds through the new axis | **medium** | explicit test: a hard-gate keyword hit + verdict `READY` at level `heavy` still returns `false` — same single-most-important-case shape Pieces 1-2's own test file already established for `canAutoApprove` |
| `fgos-coding-validating/SKILL.md` Gate section rewrite (`.claude/skills/` AND `.agents/skills/` copies) | medium | `test/skills/fgos-mirror.test.mjs` (byte-identity, already exists, currently green) + manual read-through: does the non-bypass branch still ask exactly "Feasibility validated. Approve moving to executing?", and does `NOT READY` still skip the question and return to `fgos-coding-planning` untouched |
| `--actor bypass` gate-approve record shape | low | same `fgos gate-approve <id> --gate validateApprove --actor bypass --verify "..."` call already used by `fgos-coding-exploring`/`fgos-coding-planning`'s own bypass branch — no new record shape invented |

The medium entries (D4 floor through the new axis, the Gate section
rewrite + its mirror) are the two `fgos-coding-validating` should treat as real
proof points, not a guess here.

### Shape

What: add `canAutoApproveValidate` to `src/state/gate-bypass.mjs`,
alongside (never replacing) the existing `canAutoApprove` — same file,
same exports list, one new function. Rewrite `fgos-coding-validating`'s `## Gate`
section (`.claude/skills/fgos-coding-validating/SKILL.md` lines ~171-190 today) to
run the same auto-approve check `fgos-coding-exploring`'s own Gate section already
uses (`docs/history/gate-bypass/CONTEXT.md` D1-D5, the exact bash shape at
`.claude/skills/fgos-coding-exploring/SKILL.md` lines 273-284: `Promise.all` import
of `store.mjs` + `gate-bypass.mjs`, `.fgos` resolved via `git rev-parse
--git-common-dir`, fail-closed on anything other than the literal `true`),
substituting `canAutoApproveValidate(item, verdict, level)` for
`canAutoApprove(item, artifactText, level)` — `verdict` comes from this
skill's own already-computed `READY`/`READY WITH CONSTRAINTS`/`NOT READY`
result, not a file read. Mirror the identical edit into
`.agents/skills/fgos-coding-validating/SKILL.md` in the same commit (the same
`fgos-mirror.test.mjs` requirement Pieces 1-2 already satisfied for their
own two skills).

Files touched: `src/state/gate-bypass.mjs` (add-only),
`.claude/skills/fgos-coding-validating/SKILL.md`, `.agents/skills/fgos-coding-validating/
SKILL.md` (mirror), `test/state/gate-bypass.test.mjs` (add cases for the
new export).

Verify: the item's own locked verify (`node --test
test/state/gate-bypass.test.mjs && node -e "...canAutoApproveValidate is a
function..." && grep -q canAutoApproveValidate .claude/skills/
fgos-coding-validating/SKILL.md`) plus, to keep the repo-wide suite green per this
repo's own DoD, `node --test test/skills/fgos-mirror.test.mjs` — pinned
here as an assumption (not material to scope/behavior/acceptance, so no
`fgos-coding-exploring` hand-back needed) since the item's own verify text
predates noticing the mirror file also needs the edit.

### Cases worth proving against

- Verdict `READY`, tier covered, no hard-gate keyword, level covers the
  item's tier → bypass, `--actor bypass`.
- Verdict `READY WITH CONSTRAINTS` (even one constraint) → always ask,
  regardless of level/tier — no floor/tier check even needs to run first,
  same "any constraint asks" shape D6 locked.
- Verdict `NOT READY` → unchanged: no question, returns to `fgos-coding-planning`,
  `canAutoApproveValidate` never called.
- Hard-gate keyword hit + verdict `READY` at level `heavy` → still asks (D4
  floor holds through the new axis, the single most important case here).
- Gate-bypass level `off` + verdict `READY` → still asks (same "off
  approves nothing" floor `isTierCovered` already gives every other gate).

## Piece 4 — local-first, fallback-to-root import (D7/D8, `tsk-1vi`)

Item: `tsk-1vi`. Decisions: `docs/history/gate-bypass/CONTEXT.md` D7/D8,
first discussed in `docs/history/gate-bypass/DISCUSSION.md`. Fixes the
stale-branch crash Piece 3 (`tsk-1ds`/D6) left latent: `canAutoApproveValidate`
(and, it turns out, the same cwd-relative import pattern in Pieces 1-2's own
Gate sections) breaks when a claimed item's `fgw/<id>` worktree branch
predates a function `gate-bypass.mjs`/`store.mjs` later gained on `main`.

### Mode (mechanical count)

| Flag | Applies? | Why |
|---|---|---|
| auth | no | — |
| authorization | no | — |
| data model | no | no schema change |
| audit/security | **yes** | same nature as Pieces 1-3 — touches the code path that decides when a human confirmation step is skipped, even though D7 leaves the decision logic itself (`canAutoApprove`/`canAutoApproveValidate`) byte-for-byte unchanged; a bug in the fallback could in principle cause the wrong axis to be evaluated |
| external systems | no | — |
| public contracts | no | internal skill mechanism |
| cross-platform | no | — |
| existing covered behavior | **yes** | rewrites the Gate section already shipped in all three of `fgos-coding-exploring`, `fgos-coding-planning`, *and* `fgos-coding-validating` (Pieces 1-3 only ever touched one or two at a time); `test/skills/fgos-mirror.test.mjs` requires each edit land byte-identically in both `.claude/skills/<name>/SKILL.md` and `.agents/skills/<name>/SKILL.md` — 6 files, not 3 |
| weak proof around the area | **yes** | the fallback control-flow lives entirely in each Gate section's inline `node -e` shell snippet, which has zero existing unit-test coverage today (unlike Piece 3's `canAutoApproveValidate`, which reused an already-tested core); only a static existence/count check is possible from `verify` per `docs/how-to/write-verify-for-a-skill-prose-change.md` — real runtime proof is a smoke-test/event-log concern, not verify's job |
| multi-domain | no | single `coding` domain |

`audit/security` alone is a hard-gate flag → **mode = high-risk**, same rule
Pieces 1-3 already applied, independent of the flag count (which is 3 here
regardless). In practice this piece is small and mechanical — the same
one-line fallback-retry pattern applied to three near-identical Gate
sections — but the lane rule stays mechanical, matching this feature's own
established precedent rather than a size-based exception.

### Approach

Chosen path: one honest piece, not split further. The three Gate sections
get the identical fallback-retry shape; splitting per-file would separate
work with no independent value (each file's fix is the same three-line
pattern, none usable alone as a partial fix — the bug reproduces on any one
of the three today, so a partial rollout would leave two of three
skill-embedded gates still exception-prone).

`fgos graph --what-if tsk-1vi --json` was not run: `tsk-1vi` has no `deps`
and no candidate sibling split, so there is no ordering choice for that
command to inform (same reasoning Piece 3 already gave for `tsk-1ds`).

Impact-analysis posture (`CLAUDE.md`'s capability gate): **degraded** —
`fgos tool query --capability impact-analysis --status present` returned
GitNexus `present`, but the tool's own PostToolUse hook flagged the index
as stale (`last indexed: 4ce7a96`, 208 commits behind current `HEAD`).
Named plainly per `CLAUDE.md`'s gate rather than trusted at face value.
Cross-checked manually instead (`rg`/`grep` over the three `SKILL.md`
files and `src/state/gate-bypass.mjs`/`store.mjs`): no other caller of
these Gate sections' `node -e` import pattern exists elsewhere in the
repo, and — same as Piece 3's own reasoning — this piece is purely
additive to the Gate sections' shell snippets and touches no exported
symbol in `gate-bypass.mjs`/`store.mjs` itself (D7 explicitly leaves both
files unedited), so there is no existing symbol being *edited* for impact
analysis to bound the blast radius of regardless of index freshness.

### Risk map

| Component | How risky | What would prove it |
|---|---|---|
| Local-first-fallback retry logic in each Gate section's `node -e` script | **medium** | proven empirically by `fgos-coding-validating` (see Feasibility matrix below), reproducible: `node -e` from inside a fixture worktree whose local `gate-bypass.mjs` is missing the export correctly falls back to `$root`'s copy instead of throwing |
| Self-referential case preserved (an item editing `gate-bypass.mjs` itself still sees its own branch's new export first) | **medium** | proven empirically, same run: `node -e` from inside a fixture worktree whose local `gate-bypass.mjs` carries its *own, different* export correctly uses the local one over `$root`'s — this is the one behavior D7 exists specifically to protect |
| Implementation must stay inline `node -e`, never a separate `.mjs` file | **medium** | proven empirically: the identical fallback logic, run as a separate file instead of a `node -e` string, silently resolves `'./src/state/...'` against the file's own location instead of `process.cwd()` — breaks the self-referential case with no error, while the stale-branch case still "passes" by coincidence. Documented above in Shape as a hard constraint for whoever implements this. |
| `test/skills/fgos-mirror.test.mjs` byte-identity across all three skills' `.claude/`/`.agents/` copies | low | already-existing, currently-green test; `npm test` (the item's own verify) already runs it — no new proof needed, just don't forget the mirror edit |
| `src/state/gate-bypass.mjs`/`store.mjs` themselves stay untouched (D7's explicit constraint) | low | verify's NEGATIVE clause: `! git diff --name-only main...HEAD \| grep -qE '^src/state/(gate-bypass\|store)\.mjs$'` |

The three medium entries (fallback-retry correctness, self-referential
preservation, inline-`node -e` constraint) are the real proof points this
feature's own precedent (Pieces 1-3) called for at `fgos-coding-validating` — all
three were exercised empirically during this validating pass itself
(command run, real output captured) rather than left as "should work",
since the risk lives in shell-snippet prose that has no unit-test surface
of its own, unlike `gate-bypass.mjs`'s existing `canAutoApprove`/
`canAutoApproveValidate` (already covered by `test/state/
gate-bypass.test.mjs`).

### Shape

What: in each of `fgos-coding-exploring`'s, `fgos-coding-planning`'s, and
`fgos-coding-validating`'s `## Gate` sections, change the `node -e` script's single
`import('./src/state/...')` calls into a local-first, fallback-to-`$root`
sequence — try the existing cwd-relative import first; if the needed named
export is `undefined` or the import throws, retry the same import from
`` `${root}/src/state/...` `` (the `root` shell variable each Gate section
already resolves earlier via `git rev-parse --path-format=absolute
--git-common-dir`) before falling through to the existing `false`. Exact JS
structure (try/catch around a second `import()` vs. a pre-check on the
destructured export) is left to whoever implements this piece — `CONTEXT.md`
D7 deliberately did not pin one. Recommended, not required: add the
explanatory "this worktree's own branch already carries whatever version it
needs [...falls back to \$root when it doesn't]" line to `fgos-coding-validating`'s
Gate section too, matching `fgos-coding-exploring`'s/`fgos-coding-planning`'s own Gate
sections — currently the one of the three missing that context for a future
reader.

**Hard implementation constraint, found empirically during `fgos-coding-validating`'s
reality-gate pass (not a guess):** the fallback logic must stay inline as
the `node -e "..."` argument's own string content — never extracted into a
separate `.mjs` script file invoked as `node script.mjs`, even one that
looks byte-identical. Node's ESM import resolution treats a relative
specifier (`'./src/state/gate-bypass.mjs'`) differently depending on how
the code runs: inside a `node -e` eval string it resolves against
`process.cwd()` (the worktree, when the script is invoked from inside one)
— this is the mechanism the whole feature already depends on. Inside a
`.mjs` file loaded via `node <path>`, the identical specifier instead
resolves against *that file's own location on disk*, never the process's
cwd. Reproduced directly (`/tmp/.../tsk-1vi-proof/probe.mjs`, same
resolve-local-else-fallback logic verbatim, run against a worktree fixture
carrying its own new `canAutoApproveValidate`): as `node -e` from inside
the worktree, local correctly wins (`{"source":"local","result":
"worktree-IN-PROGRESS-canAutoApproveValidate"}`); as a separate `.mjs`
file invoked the same way, it silently resolves to `$root` instead
(`{"source":"root", ...}`) — the self-referential case breaks with no
error, no crash, nothing to notice in review, because the stale-branch
case (Case A) still "passes" by coincidence either way. Whoever implements
this piece must keep the fallback logic as the literal string handed to
`node -e`, not refactor it into a shared helper file for readability.

Files touched: `.claude/skills/fgos-coding-exploring/SKILL.md`,
`.claude/skills/fgos-coding-planning/SKILL.md`,
`.claude/skills/fgos-coding-validating/SKILL.md`, and their byte-identical
`.agents/skills/<name>/SKILL.md` mirrors (`test/skills/fgos-mirror.test.mjs`'s
existing requirement) — 6 files. Plus `docs/reference/gate-bypass-config.md`
(found during `fgos-coding-validating`'s reality-gate pass, missed in this piece's
first draft): its "Gate-step wiring" section quotes the exact same `node -e`
snippet and states in prose "The `gate-bypass.mjs`/`store.mjs` code imports
stay cwd-relative — the worktree's own branch already carries whatever
version it needs" — a factual claim about current behavior that D7 makes
false. Update the quoted snippet and that sentence to describe the
local-first-fallback-to-`$root` behavior instead, once the exact
implementation shape is chosen; best-effort documentation accuracy, not
mechanically enforced by `verify` (this doc is illustrative reference
material, not a skill-prose path under `.claude/skills/**` per
`docs/how-to/write-verify-for-a-skill-prose-change.md`'s own scope). No
changes to `src/state/gate-bypass.mjs` or `src/state/store.mjs` (D7's
explicit constraint, reused verbatim from `CONTEXT.md`).

Verify (the item's own locked verify, already covers the mirror
requirement automatically since it runs full `npm test` rather than a
narrower `node --test` subset — unlike Piece 3's original gap):

```
npm test && grep -q "src/state/gate-bypass.mjs" .claude/skills/fgos-coding-exploring/SKILL.md && grep -q "src/state/gate-bypass.mjs" .claude/skills/fgos-coding-planning/SKILL.md && grep -q "src/state/gate-bypass.mjs" .claude/skills/fgos-coding-validating/SKILL.md && [ "$(grep -o "gate-bypass.mjs" .claude/skills/fgos-coding-exploring/SKILL.md | wc -l)" -gt 3 ] && [ "$(grep -o "gate-bypass.mjs" .claude/skills/fgos-coding-planning/SKILL.md | wc -l)" -gt 2 ] && [ "$(grep -o "gate-bypass.mjs" .claude/skills/fgos-coding-validating/SKILL.md | wc -l)" -gt 1 ] && ! git diff --name-only main...HEAD | grep -qE "^src/state/(gate-bypass|store)\.mjs$"
```

Baselines (3/2/1) are today's real `grep -o "gate-bypass.mjs" | wc -l`
(total substring occurrences, not `grep -c`'s matching-line count) per
file (measured directly, not assumed). `grep -c` was tried first during
implementation and found unreliable: the new fallback import call landed
on the same line as an existing prose mention in `fgos-coding-exploring`'s Gate
section, so the LINE count didn't increase even though a real second
occurrence of the module path was added — `grep -o | wc -l` counts the
actual substring, immune to incidental line-wrapping. A strictly-greater
count after the change proves a second, distinct import path was added without pinning
the exact JS syntax used to add it.

### Cases worth proving against

- Worktree-local copy has the needed export → uses it, unchanged from
  today's behavior (covers both an unrelated item on a fresh-enough branch,
  and an item that is itself modifying `gate-bypass.mjs` and needs its own
  in-progress code — the case D7 exists to protect).
- Worktree-local copy is missing the export (`tsk-5lr`'s reproduction) →
  falls back to `$root`'s current code, check runs correctly instead of
  throwing.
- Worktree-local import throws for a reason *other than* a missing export
  (e.g. a syntax error mid-edit) → still falls back to `$root`, same as the
  missing-export case — the fallback trigger is "didn't get a usable
  function back," not narrowly "export was `undefined`."
- Both local and `$root` imports fail (global-install shape, `tsk-65q`'s
  scope, not reproducible in this repo's own dev-checkout context) → falls
  through to the existing `false`, unchanged from today — not a regression,
  not fixed by this piece either.
- `src/state/gate-bypass.mjs`/`store.mjs` diffs stay empty on `main...HEAD`
  — D7's explicit "add-only via a second import call, not a rewrite of the
  functions themselves" constraint holds.
- `docs/reference/gate-bypass-config.md`'s "Gate-step wiring" section no
  longer asserts the cwd-relative import is unconditional — updated to
  describe the fallback, manual read-through (no automated check).

## Outstanding questions

None
