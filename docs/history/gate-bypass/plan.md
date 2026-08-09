# gate-bypass — plan

Item: `tsk-6bx`. Decisions: `docs/history/gate-bypass/CONTEXT.md` (D1-D5).

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
| existing covered behavior | **yes** | rewrites the Gate step already shipped in `fgos-exploring` and `fgos-planning` (this file's own skill) |
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
| `fgos-exploring`/`fgos-planning` Gate section rewrite | medium | `test/skills/fgos-mirror.test.mjs` (byte-identity, already exists) + manual read-through: does the rewritten Gate section still ask exactly the two locked wordings ("Decisions locked...", "Work shape is ready...") on the non-skip path? |
| D3 audit visibility (log + "auto-approved" line) | low | unit/integration test: skipping a gate produces a `fgos decision` log entry; no test can assert the conversational line gets *said* — that's a prose instruction, proven only by following the skill, same as every other Gate wording in this repo today |

The medium entries (completeness scan, hard-gate floor reuse) are the two
that need a real proof point at `fgos-validating`, not a guess here — they
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

What: rewrite `fgos-exploring`'s and `fgos-planning`'s Gate sections to
call `canAutoApprove` before presenting their respective approval question;
on a covered+clear result, post the D3 visible line and log the D3 decision
instead of asking; otherwise present the gate exactly as today, unchanged
wording. Mirror every edit into `.agents/skills/fgos/` in the same commit
(`fgos-mirror.test.mjs`'s existing requirement, not a new one this item
invents).

Files likely touched: `.claude/skills/fgos/fgos-exploring/SKILL.md`,
`.claude/skills/fgos/fgos-planning/SKILL.md`, and their byte-identical
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
`src/intake/decompose.mjs:349` (`parent: id` written when a split is
judged) — consistent with `fgos-routing`'s "the
engine's verb always wins" precedence rule. This plan documents the two
child titles and their verify commands as the shape for that later
machine step to act on; this session does not fabricate a `--parent` flag
that does not exist, and does not create the children by hand.

- **Child 1**: "gate-bypass config + tier-coverage + completeness check
  (state/CLI layer)" — kind: feature, risk: standard, verify:
  `node --test test/state/gate-bypass.test.mjs`.
- **Child 2**: "wire fgos-exploring/fgos-planning Gate steps to
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
skill-embedded gate — `fgos-validating`'s `validateApprove`, the one this
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
| existing covered behavior | **yes** | rewrites the Gate step already shipped in `fgos-validating`, and the mirror invariant (`test/skills/fgos-mirror.test.mjs`) means the edit must land in `.claude/skills/fgos-validating/SKILL.md` AND its byte-identical `.agents/skills/fgos-validating/SKILL.md` counterpart, or an existing, currently-green test breaks |
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
| `fgos-validating/SKILL.md` Gate section rewrite (`.claude/skills/` AND `.agents/skills/` copies) | medium | `test/skills/fgos-mirror.test.mjs` (byte-identity, already exists, currently green) + manual read-through: does the non-bypass branch still ask exactly "Feasibility validated. Approve moving to executing?", and does `NOT READY` still skip the question and return to `fgos-planning` untouched |
| `--actor bypass` gate-approve record shape | low | same `fgos gate-approve <id> --gate validateApprove --actor bypass --verify "..."` call already used by `fgos-exploring`/`fgos-planning`'s own bypass branch — no new record shape invented |

The medium entries (D4 floor through the new axis, the Gate section
rewrite + its mirror) are the two `fgos-validating` should treat as real
proof points, not a guess here.

### Shape

What: add `canAutoApproveValidate` to `src/state/gate-bypass.mjs`,
alongside (never replacing) the existing `canAutoApprove` — same file,
same exports list, one new function. Rewrite `fgos-validating`'s `## Gate`
section (`.claude/skills/fgos-validating/SKILL.md` lines ~171-190 today) to
run the same auto-approve check `fgos-exploring`'s own Gate section already
uses (`docs/history/gate-bypass/CONTEXT.md` D1-D5, the exact bash shape at
`.claude/skills/fgos-exploring/SKILL.md` lines 273-284: `Promise.all` import
of `store.mjs` + `gate-bypass.mjs`, `.fgos` resolved via `git rev-parse
--git-common-dir`, fail-closed on anything other than the literal `true`),
substituting `canAutoApproveValidate(item, verdict, level)` for
`canAutoApprove(item, artifactText, level)` — `verdict` comes from this
skill's own already-computed `READY`/`READY WITH CONSTRAINTS`/`NOT READY`
result, not a file read. Mirror the identical edit into
`.agents/skills/fgos-validating/SKILL.md` in the same commit (the same
`fgos-mirror.test.mjs` requirement Pieces 1-2 already satisfied for their
own two skills).

Files touched: `src/state/gate-bypass.mjs` (add-only),
`.claude/skills/fgos-validating/SKILL.md`, `.agents/skills/fgos-validating/
SKILL.md` (mirror), `test/state/gate-bypass.test.mjs` (add cases for the
new export).

Verify: the item's own locked verify (`node --test
test/state/gate-bypass.test.mjs && node -e "...canAutoApproveValidate is a
function..." && grep -q canAutoApproveValidate .claude/skills/
fgos-validating/SKILL.md`) plus, to keep the repo-wide suite green per this
repo's own DoD, `node --test test/skills/fgos-mirror.test.mjs` — pinned
here as an assumption (not material to scope/behavior/acceptance, so no
`fgos-exploring` hand-back needed) since the item's own verify text
predates noticing the mirror file also needs the edit.

### Cases worth proving against

- Verdict `READY`, tier covered, no hard-gate keyword, level covers the
  item's tier → bypass, `--actor bypass`.
- Verdict `READY WITH CONSTRAINTS` (even one constraint) → always ask,
  regardless of level/tier — no floor/tier check even needs to run first,
  same "any constraint asks" shape D6 locked.
- Verdict `NOT READY` → unchanged: no question, returns to `fgos-planning`,
  `canAutoApproveValidate` never called.
- Hard-gate keyword hit + verdict `READY` at level `heavy` → still asks (D4
  floor holds through the new axis, the single most important case here).
- Gate-bypass level `off` + verdict `READY` → still asks (same "off
  approves nothing" floor `isTierCovered` already gives every other gate).

## Outstanding questions

None
