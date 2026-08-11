# Plan — tsk-3xd: decompose child directive prose (action + read_first)

Mode: **standard**

Lane decided via `fgos-routing`'s Mode-gate (direct-entry fallback — no
prior Orient handoff existed for this item in this session): 3 flags
counted — **data model** (two new optional work-item fields), **public
contract** (`fgos plan --children`'s caller-supplied child schema
gains new accepted keys), **existing covered behavior** (`test/intake/
decompose.test.mjs` already asserts `normalizeChild`'s exact output shape,
e.g. the footprint tests at :701-741). No hard-gate flag (not auth, not
data loss, not audit/security, not an external provider, not removing a
validation) and fewer than 4 flags → standard, not high-risk.

## Proof surface (whole item)

`node --test test/intake/plan.test.mjs` — real, runnable, verified
passing today (107/107, ~3.2s) as this plan was written. NOT `npm test --
test/intake/plan.test.mjs`: `npm test` is `node --test 'test/**/*.test.mjs'`
(package.json:23) and `npm run`'s `--` args are appended after the script's
own glob argument, not substituted for it — so that form still runs the
WHOLE suite (confirmed: it produced an unrelated coverage-manifest
`deepStrictEqual` diff over the full `src/` file list, not a
`decompose.test.mjs`-scoped result). `node --test <path>` bypasses the
glob and genuinely scopes to this one file. Scoped so it is not the
generic whole-suite `npm test` the clarify-stage second-pass judge
correctly flagged as too broad to prove this item's own claim. Execution
adds the new `test()` blocks named in the risk map below into this same
file; this same command then exercises them — no new command needed once
they exist. Supersedes the item's clarify-stage placeholder verify (`npm
test`), recorded via `fgos edit --verify` before the `planApprove` gate.

## Impact-analysis posture

`fgos tool query --capability impact-analysis --status present` → GitNexus
registered and `present`. **Degraded**, not full: a PostToolUse hook this
session flagged the index stale (`last indexed: 251d0b5`), and
`mcp__gitnexus__impact` on `normalizeChild` (upstream, `src/intake/
decompose.mjs`) returned `impactedCount: 0` — a false negative, cross-
checked by grep: `normalizeChild` IS called, from `buildDecomposeChildrenVerdict`
(decompose.mjs:279), which is itself called from both the `judgeDecompose`
branch (:317-318) and the caller-supplied `--children` branch (:417-420).
Blast-radius numbers below come from this grep cross-check, not the stale
GitNexus index — named plainly per `CLAUDE.md`'s impact-analysis gate
("present but stale — degraded, mark proof weak, name the gap").

## Approach

**Chosen path:** extend `decompose.mjs`'s existing three-layer pipeline in
place — judge-scout prompt schema (tầng 1) → `normalizeChild` (tầng 2) →
`addWork` (tầng 3) — plus wire the already-collected `footprint` field into
both worker-prompt-templates. No new module, no new stage, no new event
kind (per `CONTEXT.md` D1/D3 and this skill's own hard rules).

**Rejected alternatives** (already ruled out in `CONTEXT.md`, cited here
for the record, never reopened):
- Reusing the existing `description` field instead of new `action`/
  `read_first` fields — rejected, `CONTEXT.md` D1.
- Mechanically extracting `action` from the parent's `plan.md` instead of
  LLM-generating it in the same verdict call — rejected, `CONTEXT.md` D2
  (brittle, no guaranteed child↔phase mapping, breaks for tiny/small mode).
- Also fixing the manual `fgos add --parent` CLI flag gap in this item —
  rejected, `CONTEXT.md` D3 (separate CLI surface, already tsk-535's scope).

**Files touched:**
- `src/intake/plan.mjs` — judge-scout prompt template (tầng 1),
  `normalizeChild` (tầng 2), `addWork` loop (tầng 3).
- `src/runner/prompt-templates/worker-prompt-default.txt` — add
  `{read_first}`/`{action}` interpolation.
- `src/runner/prompt-templates/worker-prompt-skill-pointer.txt` — same.
- `test/intake/plan.test.mjs` — new assertions (existing file, 2284
  lines, already covers `normalizeChild`/`resolveDecompose` exhaustively —
  no new test file needed, matches its own established per-behavior
  `test()` convention).

**Order:** all three tầng live in one file and are causally chained
(prompt schema → what `normalizeChild` can keep → what `addWork` writes),
so they land together as one commit, not phased across separate items —
`fgos graph tsk-3xd --json` confirms this item sits in a 6-node component
(`tsk-52g`, `tsk-52g-1`, `tsk-52g-2`, `tsk-4zg`, `tsk-535`, `tsk-3xd`) and
is already a real `topUnblock` entry (`unblocks: 1, newlyUnblocks: 2`) —
finishing it as one coherent piece is what actually clears that, not
splitting it further.

## Risk map

| Component | Risk | Proof point (for fgos-coding-validating) |
|---|---|---|
| `action`/`read_first` as new optional work-item fields | LOW — additive, no `SCHEMA_VERSION` bump (precedent: `footprint`/`domain` both added under version 2 unchanged, `work.mjs:422,439-460`) | Unit test: `SCHEMA_VERSION` still 3 after the change; a child carrying `action`/`read_first` survives `normalizeChild` → `addWork` unchanged. |
| Judge-scout prompt requiring `action` cite a real D-ID | MEDIUM — model output quality: could omit `action` or cite a fabricated D-ID | Unit test mirroring the existing missing-`verify` pattern (`decompose.test.mjs:270`): a child with `action` missing, or citing a D-ID absent from `CONTEXT.md`, invalidates the whole verdict — never silently drops just that child. |
| Mechanical D-ID-existence check in `normalizeChild` | MEDIUM — reusing the `findUncoveredLockedDecisions` pattern for a new purpose; a parsing miss could false-accept an uncited action or false-reject a valid one | Unit test with a fixture `CONTEXT.md` declaring `D1`/`D2`: child action citing `D1` passes, citing `D9` (nonexistent) fails. Cite `docs/explanation/auto-decompose-can-drop-a-locked-decision-from-every-childs-footprint.md` as the precedent for why per-decision coverage checks belong here, not left implicit. |
| `{read_first}`/`{action}` interpolation in both worker-prompt-templates | LOW — mechanical string templating, same shape as existing `{description}`/`{refs}` | Direct render check: a work item with `footprint`/`action` set produces a prompt string containing both, for each template. |
| `buildDecomposeChildrenVerdict`'s shared caller-supplied `--children` path | LOW — already covered by the same `normalizeChild`/`addWork` change, no separate code path | Existing `--children`-branch tests (decompose.test.mjs) continue passing unchanged; add one asserting a caller-supplied child's `action`/`read_first` survive the same way. |

## Assumptions (unproven, flagged for fgos-coding-validating)

- The judge-scout LLM, when re-prompted with the D-ID-citation requirement,
  reliably produces a citable `action` in practice (not just in the
  fixture tests above) — genuinely unproven until real dispatch runs
  post-merge; `fgos-coding-validating`'s reality check should weigh whether this
  needs a bypass/soft-fail path (e.g. treat a missing citation as
  `need-human` rather than hard-`invalid`) or whether hard-`invalid` (this
  plan's current choice, matching the existing missing-`verify` precedent)
  is the right failure mode.
- `read_first` derived purely from `footprint` is good enough directive
  value — assumes callers already populate `footprint` meaningfully for
  most children; if most existing callers leave `footprint` empty in
  practice, `read_first` will often be empty too. This is an existing,
  pre-existing gap (footprint is already optional today), not one this
  item worsens — worth naming so `fgos-coding-validating` doesn't treat an empty
  `read_first` on some children as a regression.

## Split decision

No split. One coherent, single-file-scoped fix (plus two prompt-template
siblings and existing test file) — matches `CONTEXT.md` D3's scope
boundary exactly. Proceeds as itself.
