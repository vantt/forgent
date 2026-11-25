# Planner report: Agent Context Engine plan and ASC plan revision

Date: 2026-11-25 (Asia/Saigon). Worktree `docos-asc-plan`, branch `docos/asc-plan-refresh`, base `4f44bb780`.
Decisions read: ACE-D1 to ACE-D6 (latest copy, landed on main as `b6a73b529`), ASC-D1 to ASC-D9. Both plans stay
`draft`, with no lead line, and every phase is `draft`. `node scripts/plan-contract-check.mjs` prints `ok` for both.

## 1. What each plan contains

**ACE, [plans/261125-1631-agent-context-engine/plan.md](../261125-1631-agent-context-engine/plan.md)** (new, 6 phases):
1. Spec and v1 contracts (`rule-unit`, `when-keys`, `effective-rules`, `refusals`). Writes new files only.
2. A pkm fit probe: a scratch Cargo project and the report `reports/pkm-fit.md`. It answers seven questions with
   running code before anything depends on pkm.
3. The Rust crate `fgos-agent-context-engine` at tier 3. The pkm store adapter sits behind a cargo feature, so a
   reader can link the crate without pkm. The phase adds the door `fgos internal context-engine compile|check`,
   declares the component, and supersedes RUL102. In the same change it deletes the Node registry and composer and
   moves their one consumer, the projection (L10). `rules.json`, which carries a digest, replaces `repo.json`.
4. The write-time check: structural checks, and a nearest-rule check through pkm search. It runs in the pre-commit
   hook for staged units and in the build.
5. The gathering (ACE-D4): the 31 clusters and the 14 conflicts are resolved, and every hand-written AGENTS.md rule
   section moves into a unit. Proof: an independent rerun of the P2 method.
6. Integration: the full gate, a release check that `rules.json` ships, and the changelog.

Prior art reused: the Node registry and composer semantics (`04be428b6`, `be24172ad`, `19d0640dc`, `0f4c36482`),
the composition contract §5-9, the tracked effective set and the ledger digest, the pkm link and model doctor rows of
the documentation crate, and RUL102's weight guard (this plan is the move that guard foresaw). The 2026-10-21 counsel
said ACE should be Node with no crate; ACE-D3 and ACE-D6 supersede that part.

**ASC, [plans/261122-1946-agent-start-context/plan.md](../261122-1946-agent-start-context/plan.md)** (revised, same
10 phases): ASC reads ACE's checked rule set through the `RuleSet` port. It takes its fact keys from ACE and its
values through ACE's `ValueSource` adapter, and it remains the only selector.

## 2. What changed in the ASC plan, and why

| Change | Why |
|---|---|
| The outcome says that ASC and ACE are two components. The 2026-11-22 approval ("ASC is the first slice of ACE") is marked superseded and kept as a record | ACE-D1 |
| `start-facts.v1.json` is removed from phase 2 and from criterion 1. `start-request.v1.json` references ACE's `when-keys.v1.json` and says which keys each start kind must supply | ASC-D9, ACE-D5 (3) |
| The refusal `start-unit-invalid` becomes `start-rule-set-invalid` (missing set, wrong version, or digest mismatch) | ACE refuses bad rules when they are written, never at start (ACE-D5 (2)) |
| In phase 3, `UnitSource` (reading the three roots, owner check) becomes `RuleSet` (ACE's compiled set). The order now comes from ACE's composition order, and ASC no longer applies `supersedes` or `conflicts`. ASC links ACE without pkm, and a `cargo tree` check proves it | ACE-D5 (1), ACE-D6 |
| The RUL102 amendment and the contract-row move leave phase 3, and `docs/platform/packaging-distribution/spec.md` leaves the footprint | ACE-D3: ACE phase 3 owns it and records all three roles. This resolves old owner question 3 |
| Phase 5 moves the ritual and `FIRST_STEPS` straight into ACE units with `when:`, no longer into `core/agents/*.yaml` | Each piece of text moves once. ACE-D1 says rules live in ACE |
| Phase 6 now only switches the projection to `compose`. Adding `when:` frontmatter and the key test left it | ACE-D5: the keys are ACE's and so is the write-time check (ACE phases 3 and 4). This resolves old owner question 1 |
| Phase 9 moves no text. It only sets `when:` on the units that ACE phase 5 created | Each piece of text moves once. ACE phase 5 owns the AGENTS.md move |
| `blockedBy` gains `261125-1631`. A data-edge table names each ACE phase each ASC phase needs | The plan contract does not admit two active plans whose footprints overlap |
| Phases 2 and 4 go from `ready` to `draft` | The brief says nothing is marked ready. Both stay startable later, since they write only new directories |
| The stale `261124-2320` wait on `CHANGELOG.md` is dropped. That plan is `done` | Checked on `4f44bb780` |

## 3. Critical path

ACE 1 → ACE 3 → ACE 4 → ACE 5 → ACE 6 → ASC 3 → ASC 5 → ASC 6 → ASC 9 → ASC 11.

These can run beside it: ACE 2 (wave 1), ASC 2 (after ACE 1) and ASC 4 (now), plus ASC 7, 8 and 10 after ASC 5.
External waits: ACE 3 and ACE 5 wait for `261122-2108` and `261124-0004`, both running. ACE 5 also waits for
`261122-1950` if the owner orders it first (question 2). ACE does have the same running-plan waits as ASC, and the
footprint overlaps are listed in each plan.

## 4. What pkm covers, and the gaps

Read in source `d488fe0`. Phase 2 confirms each point by running it.

- **Covered:**
  - custom node types and edges declared in a pack file (inverse, domain, range, cardinality);
  - lifecycle classes, with `in_force` and `in_force_units` giving the effective set at note level and at unit level;
  - the built-in edges `superseded_by` and `amends`, and the symmetric `related`;
  - R12 (replacement chain), R14 (schema), R15 (cardinality) and R16 (duplicate id within a scope);
  - near-duplicate detection (`implicit-replacement`, including a unit form);
  - PPR related notes;
  - the `writes: none` vault mode with the db outside the tree, which fits L3.
- **Gaps:**
  - There is no built-in `conflicts_with`, `depends_on` or `refines`. ACE declares them in its own pack file.
  - pkm enforces no meaning on custom edges. ACE checks conflicts, missing dependencies and law overrides itself,
    ported from the Node composer.
  - pkm detects near-duplicates but not contradictions. The 0.93 cosine default may miss paraphrases, so phase 2
    tunes the threshold on real P2 pairs.
  - R12 requires an end date on every replaced rule.
  - Search needs a worker and a ~130 MB model at write time. This is not needed at start (ACE-D6 holds).
  - It is unverified whether a draft rule can be queried without first writing it into the tree (probe question 6).
  - `crates/pkm-lifecycle` is pkm's own install and doctor tooling, not note lifecycle. ACE does not need it.

## 5. Open owner questions

**Q1. The approval id for both component declarations.**
- What is happening: both phase 3s run `fgos authority declare --kind component`, which needs `--approved-by` with an
  answered question.
- Cause: ASC-D1 was relayed as supervisor event `16707082c8c40dac`, and ACE-D3 was settled in chat. Neither is a
  question in the store.
- Options:
  - (a) One question recording both, answered once. Cost: one owner answer.
  - (b) Two separate questions. Cost: two answers.
  - (c) Add a waiver to the declare door. Cost: it widens the door, which RUL104 forbids.
- Recommendation: (a). The secretary files it.
- Scope: the two declarations only.

**Q2. Order with the communication standard plan `261122-1950`.**
- What is happening: ACE 5 and that draft both rewrite the asking-a-person doctrine. This covers clusters 12-14 and
  19, conflict C7, `decision-question.md`, `coordination-driver.md`, `fgos-shaping`, `AGENTS.md` and the effective set.
- Cause: two drafts on one doctrine.
- Options:
  - (a) 1950 lands first, and ACE 5 treats its standard as the owner of those rules. Cost: ACE 5 waits for it.
  - (b) ACE 5 first, and 1950 rebases. Cost: 1950 rewrites text that ACE 5 has just moved, so it moves twice.
  - (c) Fold 1950's phase 1 into ACE 5. Cost: a larger phase and a lost separate review.
- Recommendation: (a). It already does part of the gathering, and each text moves once.
- Scope: the ordering of these two plans.

**Q3. Scope of "every rule" (ACE-D1) for skill-local rules.**
- What is happening: ACE 5 moves only rules that are stated in more than one place, plus the hand-written AGENTS.md
  rules. A rule stated in exactly one skill stays there.
- Cause: ACE-D1 says "every rule", while the existing composition contract §4 names the canonical skill source as
  the owner of skill-specific rules.
- Options:
  - (a) As planned. Cost: skill-local rules are not in the effective set and not covered by the nearest check.
  - (b) Move all ~519 statements into units. Cost: a very large phase, skills turn into lists of pointers, and an
    always-on cost.
  - (c) As (a), and also index skill text read-only for the nearest check. Cost: a second corpus to keep.
- Recommendation: (a) now and (c) later only if the P2 rerun finds new drift there. ACE-D4's verify line ("no
  duplicate cluster outside pointers") is met by (a).
- Scope: ACE phase 5 only.

**Q4. The nearest-rule check when the embedding model is missing.**
- What is happening: the pre-commit hook needs the ~130 MB model to search.
- Cause: pkm search embeds the text. A fresh machine has no model until `fgos doctor --fix` runs
  `doc-locate-model-fetch`.
- Options:
  - (a) Refuse with `rule-search-unavailable` and the fix. Cost: a first rule commit on a fresh machine needs one
    fetch.
  - (b) Warn and pass, and let CI catch it. Cost: a duplicate can land, which goes against ACE-D5 (2).
  - (c) Skip silently. Cost: the check gives no signal.
- Recommendation: (a). It matches "refuse when written", and the fix is one existing command.
- Scope: ACE phase 4.

**Q5. Move the gathering into its own plan, so ASC is not held behind it.**
- What is happening: ASC phases 3 and later wait for the whole ACE plan, including phase 5. Phase 5 is large, waits
  on two running plans, and may park conflicts for the owner.
- Cause: the plan contract admits no two active plans with overlapping footprints, so ASC must list ACE in
  `blockedBy`.
- Options:
  - (a) Keep it as written. Cost: ASC starts only after the gathering, and a parked conflict stalls ASC. That goes
    against priority 2 ("a hanging question must not block other progress").
  - (b) Split ACE 5 into a third plan, blocked by ASC. ASC 9 then moves the AGENTS.md sections into units again (as
    the earlier ASC plan did), and the gathering plan turns the other copies into pointers to them. Cost: one more
    plan, and ASC's critical path drops ACE 5 and 6.
  - (c) Merge both plans into one. Cost: it loses the two-component boundary in planning and makes a very large plan.
- Recommendation: (b). Each text still moves once (ASC 9 moves the AGENTS.md text; the gathering only deletes
  copies and rewrites to resolve conflicts), and ASC is no longer held by owner-parked conflicts.
- Scope: plan structure only. No decision changes. If the owner chooses (b), the planner splits the plan.

## 6. Notes for the lead

- I used the plan name and the report path that the brief gave. `fgos convention` does not run inside the worktree,
  which has no `.fgos/installation`.
- No component-boundary change is made by these drafts themselves. ACE phase 3 changes the map through
  `fgos authority declare`.
- Nothing is committed.

Status: DONE_WITH_CONCERNS
Summary: Wrote the ACE plan (6 phases, pkm-based Rust store, Node registry moved out in one change, gathering of the
31 clusters and 14 conflicts) and revised the ASC plan to ACE-D1 to ACE-D6 and ASC-D9. Both plans pass the plan
contract check and stay draft.
Concerns: the plan contract forces ASC to wait for the whole ACE plan, including the gathering (Q5 proposes a split).
pkm gaps are read from source and not yet proven by running code (ACE phase 2).
