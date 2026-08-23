# plan — tsk-224 gate redesign (fgos-coding-planning / fgos-coding-validating)

Decisions: `CONTEXT.md` D1-D14 (same folder). Evidence: `RESEARCH.md`.
Every choice below cites the D-ID it honors; nothing here reopens one.

Mode: **high-risk** — 5 flags, one of them a hard-gate flag.

| Flag | Applies? | Why |
|---|---|---|
| authorization | **yes** | The gate governs whether a machine may proceed without a person — the autonomy envelope itself. |
| audit/security | **yes** (hard-gate) | Changes a safety check (`gate-bypass D4`'s floor) and the audit-trail line `gate-bypass D3` requires. |
| public contracts | **yes** | `canAutoApprove*` exports are consumed by three skill-embedded Gate blocks; `--gate <name>` vocabulary on `gate-approve` records. |
| existing covered behavior | **yes** | `test/state/gate-bypass.test.mjs` and `test/skills/fgos-mirror.test.mjs` both cover what this touches. |
| weak proof around the area | **yes** | Skill prose is LLM-interpreted at runtime; no shell command asserts its behavior (`docs/how-to/write-verify-for-a-skill-prose-change.md`). |
| auth · data model · external systems · cross-platform · multi-domain | no | No access-control code, no new field (D14 is prose-only), nothing outside this repo, single domain. |

**Why a smaller lane would not honestly cover this.** `standard` would fit
the effort (≈14 files, mostly prose) but not the blast radius: this gate
decides, for **every future coding item in the repo**, whether a person is
asked at all. A wrong design silently removes human oversight everywhere,
and the failure is invisible — a gate that stops asking produces no event
(`write-verify-for-a-skill-prose-change.md`: "không bắt được ca âm"). The
lane is set by consequence, not by line count. Note this is a different
axis from the item's `tier: light`, which per D11 measures delegation
appetite, not risk — the two disagreeing is expected, not a contradiction.

`impact-analysis: degraded` — `fgos tool query --capability impact-analysis
--status present` returns `gitnexus` `status: present`, but its index is
**228 commits behind HEAD** (indexed at `79fead39`, HEAD `2c9a49c3`,
checked 2026-08-13). Per `CLAUDE.md`'s capability gate, `present` never
means the index is fresh (tsk-j7y), so the honest posture is `degraded`.

**Named plainly, per that gate's own requirement:** GitNexus's blast-radius
answers would be stale for this branch and are **not trusted anywhere in
this plan**. No proof point below leans on them — every caller/coupling
claim in this plan was established by direct `grep`/`Read` against the
working tree instead (see "Files touched" and the Approach table). Running
`gitnexus analyze` was considered and skipped deliberately: it buys nothing
for a plan that takes no blast-radius evidence, and a fresh index is not a
precondition for any row of the feasibility matrix.

*(Corrected after `fgos-coding-validating`'s reality gate caught the
original `full` as stale — recorded here rather than silently amended, per
the same honesty discipline the rest of this plan follows.)*

## Approach

### Chosen path

Land the predicate first, then the two coupled prose changes as one atom,
then the re-entry protocol, then the supersede rows.

**One merged gate, at `fgos-coding-validating`, immediately before
materialize** (D1, D7). `fgos-coding-planning` loses its Gate section
entirely and ends at a written `plan.md`.

**Predicate: replace `canAutoApproveValidate` with a new
`canAutoApproveMergedGate`.** It keeps today's monotone shape — any failing
check returns `false`, i.e. ask (D9) — and reads four inputs in this order:

| # | Check | D-ID | Source |
|---|---|---|---|
| 1 | hard-gate floor | D10 | item `title`+`description` **∪ footprint paths ∪ child titles/verify/action** — see Assumption A1 |
| 2 | tier ceiling (delegation appetite) | D11 | `item.tier` × config `level`, `isTierCovered` unchanged |
| 3 | mechanical open items | D8 (surviving half of `gate-bypass D2`) | fresh `plan.md` text, `hasOpenItems` unchanged |
| 4 | the session's own cost verdict | D3, D4, D5 | supplied by the skill, same self-reported shape `gate-bypass D6` already established |

`canAutoApprove` is left **untouched** — after D1 its only remaining caller
is `fgos-coding-exploring`'s `contextApprove`, which D2 keeps as-is.

Deleting `canAutoApproveValidate` rather than renaming in place is
deliberate and fail-safe: a stale `fgw/<id>` branch whose Gate block still
destructures the old name gets `undefined`, `gate-bypass D7`'s
`typeof === 'function'` guard fails, the `$root` fallback also yields
`undefined`, and the Gate block's own "anything but `true` is `false`" rule
asks. Failing closed, exactly as D9 requires.

### Alternatives rejected

- **Keep two gates, only reword them.** Rejected: `tsk-5wr` showed the
  second gate is near-empty (agent self-scores, then asks permission for
  its own score), and rewording does not remove a stop. D1.
- **Grow `canAutoApproveValidate`'s signature in place.** Rejected: a stale
  branch would pass `level` into the `costVerdict` slot. It happens to fail
  closed too, but by luck rather than structure — the same accidental
  safety `gate-bypass D7` was written to stop relying on.
- **Include `plan.md` narrative prose in the hard-gate haystack.**
  Rejected on measurement, see A1.
- **Split into child items.** Rejected, see "Split decision" below.

### Risk map

| Component | Risk | What would prove it |
|---|---|---|
| Atomicity of the planning+validating prose pair | **high** | Both land in one commit. Verify's NEGATIVE asserts the old gate question is gone; a window with two gates or zero gates cannot exist across a commit boundary. |
| Widened hard-gate source (D10) | **medium** | Measured, A1 below. Unit test pinning a footprint-path hit and a prose-only non-hit. |
| New predicate's fail-closed behavior on every axis | **medium** | Unit tests: one per axis, plus malformed/missing config, plus the deleted-export stale-branch path. |
| Re-entry not re-asking `contextApprove` (D14c) | **medium** | Prose-only; runtime proof is post-hoc via the event log, per the how-to doc's own honest limits. Named as a known weak proof, not hidden. |
| Three-way skill mirror drift | **medium** | `npm test` runs `test/skills/fgos-mirror.test.mjs`, which enforces byte-identity across all three roots. |
| Supersede rows (D13) | light | `grep` in verify. |

### Files touched

**No projection script exists** — `.claude/skills/`, `.agents/skills/`, and
`plugins/fgOS/skills/` are hand-maintained copies held byte-identical by
`test/skills/fgos-mirror.test.mjs`. Every SKILL.md edit lands **three
times**.

| File | Change |
|---|---|
| `src/state/gate-bypass.mjs` | delete `canAutoApproveValidate`, add `canAutoApproveMergedGate` |
| `test/state/gate-bypass.test.mjs` | tests for the new predicate |
| `fgos-coding-planning/SKILL.md` ×3 | delete Gate section (D1); step 4 → prose/JSON child specs, no `fgos add --parent` (D7); step 6 → record the gap via `fgos decision` before hand-back (D14a) |
| `fgos-coding-validating/SKILL.md` ×3 | Gate becomes the single merged gate: criterion (D3-D5), 3 triggers (D6), question shape (D12), new predicate; materialize branch → `--verdict decompose --children` from `plan.md`; delete the "children already created, cite by id" branch (D7) |
| `fgos-coding-exploring/SKILL.md` ×3 | re-entry section: read planning's recorded gap, handle only that, no step-1 rescan, no `contextApprove` re-ask (D14b, D14c) |
| `docs/history/gate-bypass/CONTEXT.md` | append supersede rows, never edit D2/D4/D6 bodies (D13) |
| `docs/history/gate-question-quality-and-routing/DISCUSSION.md` | append supersede row for its own D6 (D13) |
| `CHANGELOG.md` | `## [Unreleased]` entry — user-visible behavior change, per AGENTS.md's install/setup/doctor gate |

### Order

`fgos graph --json`: `tsk-224` is a **singleton component**, `topUnblock:
[]` — it blocks nothing and nothing blocks it, so ordering carries no
external leverage. The order below is driven purely by internal coupling.

1. Predicate + its tests — nothing else references it yet, so it can land
   green on its own.
2. `fgos-coding-planning` + `fgos-coding-validating` prose — **one commit,
   non-negotiable.** Splitting them creates a window with either two gates
   or none.
3. `fgos-coding-exploring` re-entry protocol (D14).
4. Supersede rows + `CHANGELOG.md`.

## Shape

### Phase 1 — predicate

Add `canAutoApproveMergedGate(item, planText, childSpecs, costVerdict,
level)`; delete `canAutoApproveValidate`. Keep every existing helper
(`isTierCovered`, `hasOpenItems`, `readGateBypassLevel`) untouched and
reused verbatim — D8 supersedes only `gate-bypass D2`'s "never
self-report" clause, not its mechanical completeness check.

### Phase 2 — the coupled prose atom

`fgos-coding-planning`: Gate section deleted; step 4 writes child specs as
a JSON block inside `plan.md` (each: `title`, `verify`, `action` citing a
real D-ID, `footprint`, optional `kind`/`risk`/`deps`) — the exact shape
`normalizeChild` already validates (`src/intake/plan.mjs:203-219`), so the
spec is written once and handed straight to the verdict in phase 2's other
half. Step 6's Material branch gains the `fgos decision` write (D14a).

`fgos-coding-validating`: the merged Gate presents the cost verdict, the
triggers that fired, and the agent's own attempt (D12); calls the new
predicate; on approve (or bypass) fires `fgos plan --verdict decompose
--children` with the JSON `plan.md` already carries, or `--verdict
pass-through` when there is no split.

### Phase 3 — re-entry protocol

`fgos-coding-exploring` gains a short re-entry section keyed on the
`fgos decision` planning wrote: handle exactly that gap, append the new
D-ID, keep `## Outstanding questions` at `None`, skip the gate.

### Phase 4 — supersede rows + changelog

Append-only, per D13.

### Cases worth proving

- **Empty/boundary:** missing `.fgos/gate-bypass.json` → `DEFAULT_LEVEL`
  `off` → `isTierCovered` false → asks. Malformed JSON → same.
- **Existing behavior that must not regress:** `contextApprove` still
  auto-approves through the untouched `canAutoApprove`; the three-way
  skill mirror stays byte-identical; `normalizeChild`'s `action`/D-ID
  rejection is unchanged (this item feeds it, never relaxes it).
- **Negative case the design deliberately cannot prove by shell:** "the
  gate should have asked and did not" emits no event. Accepted and named
  (`write-verify-for-a-skill-prose-change.md`); the mitigation is D9's
  monotone invariant plus the merge gate downstream, not a test.
- **Partial failure:** predicate throws → Gate block's "anything but
  `true` is `false`" → asks.
- **Stale branch:** Gate block referencing the deleted
  `canAutoApproveValidate` → asks (walked through above).

## Assumptions

- **A1 (measured, not guessed) — the hard-gate haystack widens to
  `plan.md`'s STRUCTURED fields only, never its narrative prose.** D10
  says the source becomes the union of submit text, `plan.md`, footprint,
  and child specs; it does not say whether narrative prose counts.
  Measured on all 318 real `plan.md` files in `docs/history/`: scanning
  prose would trip the floor on **266 (83.6%)**, driven by `audit` (242),
  `auth` (217), `security` (210) — versus 13.9% on item text alone. A
  floor that fires on five plans out of six stops discriminating, which
  defeats D10's own purpose. Reading "footprint + spec con" as the
  structured half keeps the added coverage D10 wanted (a bland submit text
  whose plan touches `src/**/migration.mjs`) without inheriting the
  vocabulary problem. `fgos-coding-validating`'s reality gate should
  re-check this row.
- **A2** — the merged gate's record keeps the gate name
  `validateApprove` rather than minting a new one, so in-flight items
  carrying `gates[id].planApprove` need no migration. Per D4, being wrong
  here self-corrects within one cycle → cheap → assumption, not a question.
- **A3** — `costVerdict` uses a two-value vocabulary the skill supplies
  (reversible / expensive). Exact token spelling is an implementation
  detail; only the monotone direction (D9) is load-bearing.

## Split decision

**No split. One honest piece.**

`fgos graph --what-if` was not run per-candidate because there are no
competing candidates to compare: `topUnblock: []` means no ordering of
sub-pieces changes what gets unblocked downstream.

The pieces interlock rather than separate. Phase 2's two halves must land
in one commit (a window with two gates or zero gates is worse than either
end state). Phase 1 is consumed by phase 2. Phases 3-4 alone carry
near-zero standalone value. Splitting would produce children whose merge
order is load-bearing and whose individual verifies each prove only a
slice, while the parent's verify stays red until all land.

Applying this item's own D3/D5 to the decision: tầng A ran (`fgos graph`,
the mirror-structure check, the 318-plan measurement) and closed what it
could. On tầng B the two options are asymmetric — being wrong about *not*
splitting costs a longer single implementation, correctable at any time,
while being wrong about splitting materializes children at the wrong
boundaries and needs `wontfix` cleanup. D5 says take the reversible option
and do not ask. Taken.

## Outstanding questions

None
