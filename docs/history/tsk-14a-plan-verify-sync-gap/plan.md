# Plan: tsk-14a — sync a pass-through item's designed verify onto `work.verify`

Mode: **standard** (no `fgos-routing` Orient hand-off existed for this item —
driven directly via `fgos-coding-driving` from `/fgOS:cook` — so the lane is
decided here per the direct-entry fallback. Flags counted against
`fgos-routing`'s own list: "existing covered behavior" — this touches the
`planning`→`executing` hand-off every coding item goes through, with an
existing test suite — and "weak proof around the area" — event-sourced
gate/verify semantics are subtle and have already produced one real
incident (tsk-38h, cited in this item's own description). 2 flags → 2–3
range → standard. No hard-gate flag (auth/data-loss/audit/external
provider/removing a validation) applies, so not high-risk.)

No `CONTEXT.md` exists for this item — its discovery verdict came back
`clear` (`docs/history/tsk-14a-plan-verify-sync-gap/RESEARCH.md`), which
skips `exploring` outright (D2). This plan's evidence base is that
RESEARCH.md instead of a locked-decisions table; there is no D-ID to cite.

## Approach

**Root cause (RESEARCH.md Round 1, findings 1-3).** `resolvePlan`
(`src/intake/plan.mjs:543`) stamps every `planning`→`executing` transition
with:

```js
const planApproveVerify = view.gates?.[id]?.planApprove?.verify ?? work.verify;
```

`planApprove` is a retired gate name (no live skill writes it post
`coding-planning-validating-gate-redesign`), so this line always falls
through to `work.verify` — whatever the item's own `verify` field already
holds, real or placeholder. Nothing upstream of this line ever writes
plan.md's actually-designed proof-surface command onto `work.verify` for a
pass-through (non-split) item. `fgos-coding-validating`'s own gate-approve
call (`SKILL.md:305-308`) is explicit that it re-records "the item's own
current `verify` field ... read fresh" — it proves the existing value holds,
it does not design a new one. So for a pass-through item, nothing in the
current flow ever promotes plan.md's designed command into `work.verify`
before that value gets stamped onto the executing transition and later run
literally as a shell command by `fgos return`.

**Relationship to tsk-4m4 (RESEARCH.md Round 1, finding 4).** Same code
site, complementary scope: tsk-4m4 says nothing there *checks*
`planApproveVerify` for correctness (it wants that judgment moved to
planApprove/validateApprove); this item says nothing upstream ever
*populates* it with the real designed command in the first place. tsk-14a's
own fix supplies exactly the value tsk-4m4's future judgment would need to
check — the two are sequenced by the `deps` field but not blocking in
substance: this item's fix is additive (write a real value earlier) and
does not touch the judgment-placement question tsk-4m4 owns.

**Fix direction (this item's own description, confirmed still accurate).**
`fgos-coding-planning` already names, for a pass-through item, the one
command that proves it done (Shape, step 5 of its own flow — "leave
execution alone ... it only needs to name ... the one command"). That
command exists in `plan.md` prose today but is never written back onto the
item. The fix: when this skill (`fgos-coding-planning`) shapes a
**pass-through** (non-split) item and names its proof-surface command, sync
that command onto `work.verify` via `fgos edit --verify` **before** handing
off to `fgos-coding-validating` — but only when the item does not already
carry a real, distinct verify (never overwrite a value a person or an
earlier round already set deliberately).

**Why a skill-prose fix, not an engine (`src/`) change.** `resolvePlan`'s
own `planApproveVerify` fallback chain is correct AS a fallback — it should
keep reading whatever `work.verify` says. The gap is that nothing populates
`work.verify` with the real value in the first place; that is squarely
`fgos-coding-planning`'s own responsibility (it is the skill that knows the
designed command), not the engine's. Moving the judgment of *where verify
correctness is judged* — which the dead `planApprove` key reference and the
`work.verify`-is-assumed-real contract both bear on — is tsk-4m4's own
contract-level scope, not this item's.

**Proof point.** `impact-analysis` posture: **full** — `gitnexus` is
registered and `present` (`fgos tool query --capability impact-analysis
--status present`). Not applicable here: this change touches only
`.claude/skills/fgos-coding-planning/SKILL.md` prose, no `src/` symbol, so
there is no blast radius for GitNexus to measure. If a later round of this
item's own implementation finds the fix needs a `src/` change instead
(e.g. because skill-prose compliance proves too fragile to rely on),
`impact({target: "resolvePlan", direction: "upstream"})` becomes required
before touching it.

## Shape

One piece, pass-through (no split — the fix is a single, self-contained
prose addition to one skill file). File touched:
`.claude/skills/fgos-coding-planning/SKILL.md`.

Add to `fgos-coding-planning`'s own Shape step (step 3, after the pass-through
branch of step 4 "Decide the split, if any" — i.e., in the "one piece is
honestly enough" branch): once the proof-surface command for a pass-through
item is named in `plan.md`, check the item's own current `verify`
(`fgos list --id <id> --json`'s `data.work[id].verify`) against the
canonical placeholder set (`FALLBACK_VERIFY` / the discovery-stage
placeholder text) the same way `hasRealVerify` does. If it is still a
placeholder, sync the just-designed command onto the item:

```bash
root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
node "$root/bin/fgos.mjs" edit "<item-id>" --verify "<the designed proof-surface command>" --dir "$root"
```

If the item already carries a real, distinct verify, do nothing — never
overwrite a value someone already set deliberately.

### Cases this needs to hold for

- A pass-through item whose `verify` is still the discovery-stage
  placeholder (`FALLBACK_VERIFY`, or `RETIRED_P14_PLACEHOLDER`) — the
  reported failure mode (tsk-38h) — gets synced.
- A pass-through item whose `verify` is already real (someone ran `fgos
  edit --verify` earlier, or a caller-supplied discovery verdict already
  proposed a real one that `hasRealVerify` recognized) — untouched, no
  redundant edit.
- A **split** item — untouched by this change; split children already get
  a real verify forced at creation time via `normalizeChild`
  (`plan.mjs:175-219`), which this item's own description already
  confirms is not the gap.
- An item whose discovery-stage placeholder text does not exactly match
  either canonical constant (e.g. this very item's own `verify` field
  before this round, `"chưa xác định — P15 bổ sung"` — a custom placeholder
  string, not `FALLBACK_VERIFY` verbatim) — `hasRealVerify` would
  incorrectly treat it as "real" and skip the sync. **Out of scope for
  this item**: that is a `hasRealVerify` string-matching gap, not the
  verify-sync gap this item describes. Flagged here as an Outstanding
  question rather than silently folded in, since fixing it would touch
  `src/intake/discovery.mjs` — a different file and a different, unscoped
  correctness question.

## Verify

Per `docs/how-to/write-verify-for-a-skill-prose-change.md` (this item
touches a `.claude/skills/**/SKILL.md` path). `test/skills/fgos-mirror.test.mjs`
(covered by `npm test`) requires every `fgos-*` dev-skill to stay
byte-identical across `.claude/skills/`, `.agents/skills/`, and
`plugins/fgOS/skills/` — so the edit must land in all three, and the
scope guard below allows exactly those three plus this item's own
`docs/history/` evidence:

```bash
npm test && \
grep -q 'sync that command onto the item' .claude/skills/fgos-coding-planning/SKILL.md && \
grep -q -- '--verify "<the designed proof-surface command>"' .claude/skills/fgos-coding-planning/SKILL.md && \
! git diff --name-only main...HEAD | grep -qvE '^(\.claude/skills/fgos-coding-planning/SKILL\.md|\.agents/skills/fgos-coding-planning/SKILL\.md|plugins/fgOS/skills/fgos-coding-planning/SKILL\.md|docs/history/tsk-14a-plan-verify-sync-gap/.*)$'
```

- `npm test` — regression floor for every other item shape, and (via
  `fgos-mirror.test.mjs`) proof the three copies are still byte-identical.
- POSITIVE — the new sync instruction and its concrete `fgos edit --verify`
  invocation both exist in the (canonical `.claude/`) skill file.
- NEGATIVE/scope-guard — nothing outside the three mirrored skill copies
  and this item's own docs history changed (this is a prose-only fix; a
  `src/` diff here would mean the fix drifted from this plan's own scope
  decision above).

## Outstanding questions

None
