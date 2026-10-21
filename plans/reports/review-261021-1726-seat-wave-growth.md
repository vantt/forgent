# Review: SEAT wave growth (seat-p09 vs 105c73726)

Read-only review. Diff `105c73726..seat-p09`: 279 files, +17980/-6138. Judged against AGENTS.md
design principles 1, 2, 6, 7, 8 and RUL104.

## Verdict

**Trim after merge**, with one small correctness fix worth landing before (D1). The growth is mostly
not decision logic copied out of the crate. It is (1) one-shot migration code and its tests and fixtures,
which have a clear removal trigger, and (2) Node tests that prove crate behaviour a second or third
time. Real decision duplication (category c) exists in three places. It is a follow-up item, not a
merge blocker.

Steady state: if every trim below lands, the wave's net Node delta drops from about +821 to about +150,
which is about the size of the facade itself (`client.mjs` + `seat-policy.mjs`). `bind.mjs` already
shrank from 803 to 571 lines.

## Defect found while reviewing (fix before or right after merge)

**D1. Doctor dry-bind binds a different unit than the runtime does.** `workflowUnitContract`
(`src/setup/workflow-definition-files.mjs:104-115`) projects a workflow template without `persona`,
`blind` or `prefer`. The runtime projection (`src/workflow/runner.mjs:264-282`) carries all three.
`seatedPanelUnits` (`src/workflow/seats.mjs:184-194`) is a third copy and drops them too. Shipped
workflows set them: `core/workflows/delphi.yaml:37` (`persona: panelist` plus `blind: true`) and
`domains/marketing/workflows/content-publish.yaml:51`. Because `bind.mjs:76` and `bind.mjs:308` read
`unit.persona` and `unit.prefer`, `seat-binding-dry-bind` can pass a seat that runtime refuses or puts
on another tier: blind seats cannot take in-process candidates, and persona taste keys can change the
tier. Fix: make one template→unit projection, used by the runner, the doctor and `--seats`. That is
about -15 lines net.

## Node modules

(a) thin adapter or facade · (b) one-shot migration code (removal trigger named) · (c) decision logic
that duplicates the crate

| Module (+lines) | Class | Evidence and what to do |
|---|---|---|
| `seat-binding/client.mjs` (+172) | a | Spawns the route and fails closed. No decisions. Keep. |
| `execution/seat-policy.mjs` (+111) | a | Builds the request, digest and cache. `stripComments` (`:66-70`) copies `stripConfigComments` (`dispatch/config.mjs:280`). Reuse it, -9. |
| `execution/seat-resolver.mjs` (+327) | a (by spec §3) | The spec gives Node the seat list. Rigor and checker composition are crate inputs ("effective rigor is an input", `lib.rs:7`). The prefix rule `capabilityEntriesOf` (`:77-84`) mirrors `policy.rs:16-18`. That is acceptable while persona and rigor stay on the Node side. |
| `execution/seat-ledger.mjs` (+77) | a | Placement order and barrier, shared by run and dry-bind. Keep. |
| `execution/legacy-seat-read.mjs` (+116) | b, permanent for now | The single read path for pre-fence history. Its `posture()` (`:13`) and `LEGACY_DEFAULT_CHECKERS` (`:34`) copy seat-resolver's on purpose, because they freeze the old semantics. Removal needs an owner decision: a one-time rewrite of pre-fence `unit.json` adding `seatSchema`/`seats`, or dropping that history. |
| `setup/seat-binding-conversion.mjs` (+296) | b | Trigger: every workspace that activates fgOS (forgentX, mdview, mcp-skill-hub, …) passes `seat-binding-config` on the new release. About 260 lines go. `ladderCommentLines` (`:258`) plus the `$comment` refresh stay (about 30 lines). |
| `setup/seat-binding-checks.mjs` (+200) | b for the config and drain rows, a for dry-bind | `checkSeatBindingDrain` + `openWorkflowRuns` (`:64-150`) is the wave's stop predicate (spec §9.1). The config row's rigorToTier/marker test goes with the conversion. About -110. |
| `dispatch/config.mjs` (+144) | b ~55, c ~60 | b: `dropRetiredGlobalKeys`, `assertProjectConverted`, `refuseGlobalSeatBindingKeys`, the `rigorToTier` throw at `:1854`. Trigger: no pre-wave release activated on the machine. c: `validateTierName`, `validateSeatTasteMap` and the empty-prefer check repeat the crate's config validation (`policy.rs:42-69`: "prefer must not be empty", "unknown tier name", role keys). `MODEL_POLICY_TIERS` (`:663`) is a second copy of `TIER_LADDER` (`tier.rs:175`). The only thing pinning the two equal is a third literal in `test/seat-binding/client.test.mjs:58`. Spec §5.1 says one constant. |
| `dispatch/plan.mjs` (+248, moved from `assignment-policy.mjs` -535) | c | `effectiveDispatchPolicy` is still a second seat chooser for the Work path. It composes rigor itself (`raiseRigor`, separate from `effectiveRigorOf`), picks the executor (`?? 'claude'`), picks the model as `policy.cells[family][0].model` while skipping stage 2 (no pin, effort, account or walk), and has a no-`runnerConfig` branch that settles tier and model without the crate (contradicts "no JS policy fallback", spec §4.1). `dispatch/cli.mjs:583-601` repeats the cell→model pick. Spec §3 calls for a "thin consumer". Follow-up item: route it through `bind()`, about -150. |
| `execution/run.mjs` (+202) | a | Lease-conflict rebind, receipt read, door-choice preflight, seat-keyed refusals. That is the protocol, not policy. |
| `execution/bind.mjs` (−232 net) | a, with two c leaks | Still in Node: the inline-lead fallback (`:395-418`), a "who runs this seat" decision, and override scope matching `findMatchingOverride` (`:44-56`), though spec §3 says pins and overrides are crate-owned. Low priority. Move them when the Work path moves. |
| `dispatch/executor-governance.mjs` (+82) | a (moved) | Moved out of the deleted `assignment-policy.mjs`. Net zero. |
| `setup/workflow-definition-files.mjs` (+115) | a (moved from deleted `workflow-pool-independence.mjs`, -199) | The root enumeration (`:13-31`) repeats `loader.mjs:96-104`. Its unit projection is the D1 copy. |
| `convention/seat-id.mjs` (+51) | a | Reads the shared rule JSON. A JS mirror of `packages/convention/rust/src/rules.rs` (+62), with both run on the golden vectors. Acceptable because it avoids an exec per id check. |

## Tests: duplicated proofs (principle 8)

| Proof | Duplicates | Action |
|---|---|---|
| `test/seat-binding/golden.test.mjs` (56): all 83 golden cases through the route | `packages/seat-binding/rust/tests/golden.rs` owns the cases. The wire is already proven by `client.test.mjs` ("the real host answers a bind…", "a refused seat comes back as a result…"). | Delete now. Keep the helper, which `exec-budget` and `client` tests use. |
| `execution/bind-tier-composition.test.mjs` (208), 9 of 10 tests | Golden: "variant A/B/C …", "seat key beats persona beats role…", "persona key beats role key", "an override above the resolved tier is refused", "a door-chosen persona selector that raises the tier is refused". | Delete now and keep only "a workflow seat recommendation names the workflow, the unit and the seat" (the Node `workflowTierOf`). About -180. |
| `execution/bind.test.mjs` (1173): the maxTier/override/rigor block (9 tests), effort (4), spread (5 of 6), skills (2), pins (2), walk (2) | Golden "effective rigor never changes effort or tier", the maxTier, override, effort, "shape … spreads …", pin and walk cases. | Follow-up. Keep the Node-fact tests: herdr transport, inline lead, invocation/posture facts, persona chain, timeout, account view, "same provider via another executor counts as used". About -300. |
| `tier-fallback.test.mjs` (221), walk cases | Golden walk cases ("never leaves the tier", "two entries of one cell…", "a fault excludes one pool…"). | Follow-up, about -120. |
| `setup/seat-binding-dry-bind.test.mjs` (292), about 6 panel/debate spread cases | Golden independence and spread cases. | Follow-up. Keep the row-semantics tests (refused = fail, max-tier-cap = info, malformed files). About -100. |
| `tier-fallback-config.test.mjs` validation cases and the "rigor sets no tier" cases in `dispatch-plan-policy.test.mjs` | Golden config-error cases, and `bind.test` plus golden for "rigor never selects a tier" (proven in 4 places). | These go together with the c-item on duplicated validation. About -140. |
| Unconverted-project refusal | Proven in `config-seat-binding-layers.test.mjs`, `cli/unconverted-project-refusal.test.mjs` (3 tests across every door), the `seat-binding-checks` config row and `seat-binding-fence.test.mjs`. | All migration tests. They retire with the conversion. |

Migration-only test material, which retires on the conversion trigger:
`seat-binding-conversion.test` 424, `seat-binding-fence.test` 172,
`config-seat-binding-layers.test` 148, `unconverted-project-refusal.test` 105, `seat-binding-checks`
config/drain cases about 110, fixtures `seat-binding-config/forgentx-runner.json` 1410 + `global-runner.json`
288. `tool-executor-seats.golden.json` (452) + its test (77) is a "plans exactly as before" refactor
equivalence snapshot. After merge it only pins output, and its one behaviour ("not an agent seat") has a
golden twin. It can go right after merge.

## Estimate

| Bucket | Node src/bin | Tests + fixtures |
|---|---|---|
| **Safe now, small**: D1 projection, `stripComments`, cell→model helper, legacy `posture` import, golden.test, bind-tier-composition | about -35 | about -240 |
| **Right after merge**: tool-executor-seats snapshot | 0 | about -530 |
| **Follow-up A, migration** (trigger: all activated workspaces pass `seat-binding-config` + `seat-binding-drain`, and no pre-wave release is activated) | about -440 | about -2,650 (including 1,698 fixture lines) |
| **Follow-up B, duplicated proofs** (bind, tier-fallback, dry-bind) | 0 | about -520 |
| **Follow-up C, one authority**: Work path through `bind()`; tier vocabulary and config validation from the crate | about -210 | about -140 |
| Owner decision: rewrite pre-fence records, then delete `legacy-seat-read` | -116 | -141 |

Totals: **safe now ≈ -35 Node / -240 tests**. **Follow-ups ≈ -650 Node / -3,840 tests and fixtures**.

## Unresolved questions

1. Is the Work path (`plan.mjs`) meant to stay a stage-1-only consumer for this release? The spec says
   "thin consumer". Today it picks the executor and model itself.
2. Which workspaces still activate a pre-wave release? Trigger A depends on that inventory. The repo
   does not hold it.
3. Does the owner want pre-fence history kept forever (legacy reader stays), or a one-time record rewrite?
