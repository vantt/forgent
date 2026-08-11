# Plan: work-item priority matrix (tsk-4y5)

Scope: `CONTEXT.md`'s D2-D8 (D1 already spun off as `tsk-2b0`).

## Mode gate (mechanical count)

Flags counted:
- **Data model** — yes: new fields `urgent`/`impact`/`effort`, `priority`'s
  role change (input → calculated output), `intent` retirement.
- **Public contracts** — yes: `priority`'s write-source changes; frontier
  v2's read contract (`docs/specs/work-state.md` "Đọc (list/ready)")
  degrades in behavior even though no code in `frontier.mjs` changes.
- **External systems** — yes: D4/D8's refined pass reads the
  `impact-analysis` capability (GitNexus via `fgos tool query`).
- **Existing covered behavior** — yes: `work.mjs` schema validation,
  `decompose.mjs`'s `risksGate`, and frontier sort all have existing test
  coverage this change must not regress.
- **Weak proof around the area** — yes: `effort`'s calculation (D5) and
  `impact`'s semantic-relatedness half (D3) have no existing implementation
  to point to as precedent; some real-world drift from spec is expected.

5 flags, one of them (data model) already a hard-gate flag on its own →
**high-risk**.

## Impact-analysis capability posture (per this skill's step 3)

`fgos tool query --capability impact-analysis --status present` → **full**
(`gitnexus`, `kind: mcp`, `status: present`). D4/D8's blast-radius-informed
risk-discount / de-risk-bonus proof points below are NOT weak evidence —
the capability is actually present on this machine today.

## Split decision: NO split into separate work items (blocked mechanism, not a judgment call)

Step 5 of this skill directs creating child items via `parent` lineage.
Checked before deciding: `add`/`edit`'s real CLI parameter lists
(`bin/fgos.mjs:726-816`, `src/cli/command-registry.mjs`) have **no
`--parent` flag** — confirmed by direct code read during `tsk-4y5`'s own
`fgos-coding-exploring` pass, filed as `tsk-1xx`. The only writer of `parent` in
the repo is `decompose.mjs`'s own internal `addWork()` call inside
`judgeDecompose`'s auto-split path — not something a skill session can
invoke under one-door-write discipline. Splitting `tsk-4y5` into
proper parent-linked children is **not executable today**, not a judgment
call this plan is making — filing sibling items with plain `deps` instead
would lose the parent/rollup relationship the schema is designed to carry
for exactly this case, which is worse than not splitting.

**Decision:** `tsk-4y5` proceeds as one item, high-risk mode, with an
internal phased approach (three phases, one commit per phase, single
`fgos return` at the end per `fgos-coding-implement`'s existing "one commit per
item" habit interpreted as "one commit per phase, one return for the
whole item" — no schema/verb change needed to allow this). Re-visit
splitting into real children once `tsk-1xx` ships.

## Approach

**Phase A — schema + CLI surface (foundation, must land first).**
`src/state/work.mjs`: add `urgent` (optional string, one of a small enum,
absent-leaves-undefined), `impact` (optional non-negative number),
`effort` (optional non-negative number) — same additive-optional shape
`priority`/`intent` already use (Data Dictionary #25/#26 precedent).
`bin/fgos.mjs` + `src/cli/command-registry.mjs`: `--urgent`/`--impact`/
`--effort` flags on `add` and `edit`, mirroring `--priority`/`--intent`'s
existing wiring exactly. Risk: breaking `validateWorkShape`'s existing
contract for old events with no such fields. Proof point (→
`fgos-coding-validating`): full `npm test` green, plus the existing
`work.test.mjs` schema-validation suite specifically, run against a
fixture event log with zero occurrences of the three new fields (byte-
identical validation for every pre-existing item, same discipline
`priority`/`intent`'s own introduction proved for itself).

**Phase B — compute + write (depends on Phase A).**
`src/intake/discovery.mjs` (rough pass): extend `buildDiscoveryPrompt`
to also ask for `impact`/`risk` estimates (blocks + semantic scan,
`urgent` read as-is from the item, `effort` assumed at a floor default);
write `priority` (not `intent`) via the existing second `editWork` call
`intentScore` already uses today — same call site, different field name,
per D7 ("stop writing `intent`, do not remove it"). `src/intake/
decompose.mjs` (refined pass): extend `buildDecomposePrompt`'s judge
context with the real `impact-analysis` query result (present today, see
posture above) and `fgos-coding-planning`'s own mode/flag-count (this skill,
step 2 — needs its own `plan.md` to already exist, which it does by
construction since this skill runs before the refined pass fires); write
the refined `priority` via `edit --priority`. Risk: sign/inversion bug
(raw score "bigger = more important" vs stored `priority`'s ASC "smaller
= higher priority" convention) — the single highest-consequence
correctness risk in this whole phase. Proof point: a unit test asserting
`invert()`'s monotonicity directly (higher impact/urgent or lower
effort/risk-adjusted-score must always produce a strictly smaller stored
`priority` number), not just an end-to-end example.

**Phase C — consumer wiring + doc follow-up (depends on Phase B).**
`decompose.mjs`'s `risksGate`: read the `impact-analysis` blast-radius as
an additional (never a replacing) signal alongside the existing keyword
check — heavy-by-keyword must still gate even if blast-radius alone
would've said light (backward-compatible floor, per D4). Update
`docs/reference/work-item-pipeline-stages-verbs-and-handoffs.md` (this
item's own prior research artifact) to reflect the shipped design once
Phase B lands — it currently documents the pre-this-feature shape only.
Risk: low, mostly doc/regression-proofing. Proof point: existing
`decompose.test.mjs` `risksGate` suite stays green; a new case confirms a
keyword-light-but-blast-radius-heavy item still gates (floor holds) and a
keyword-heavy-but-blast-radius-light item still gates (never loosens an
existing gate — capability signal only ever adds caution, per D4/D8,
never removes it).

## Concrete cases worth proving (high-risk mode — fuller sketch)

- Empty/boundary: item with none of `urgent`/`impact`/`effort`/`risk` set
  (oldest possible item) — `priority` computation must degrade to
  "absent", never throw, never silently default to a misleading number.
- Existing behavior that must not regress: every item that already has an
  explicit `priority` (STR7, pre-this-feature) keeps sorting exactly where
  it did — D6 only changes *who writes* `priority`, never its ASC/absent-
  last read semantics.
- Concurrent access: two sessions computing rough-pass `priority` for
  different items at once — already covered by the existing `edit`
  door's CAS/event-log discipline, no new concurrency surface introduced.
- Partial failure: `impact-analysis` capability degrades mid-flight
  (`present` at Phase A's `plan.md` write time, `missing`/`unknown` by the
  time Phase B's refined pass actually runs) — refined pass must re-query
  live (never trust a stale posture note), matching `fgos-coding-validating`'s
  own existing discipline for this exact capability.

## Execution notes

Leaving Execute/verify alone per this skill's own rule — each phase above
names one real, runnable command as its proof point; `fgos-coding-implement`
runs them, `fgos return` re-verifies, same mechanical path as any other
item.
