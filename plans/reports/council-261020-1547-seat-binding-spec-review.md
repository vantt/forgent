# Council review of the Seat Binding spec draft

## Run

- Workflow `architecture-advisory`, case `wf-run-1792496104999-4c0d9095`, settled 2026-10-20 20:25 (Asia/Saigon). The close gate was answered `[]` by the big lead (`forgentx-95`): the four missing-expertise items become verification steps in the consolidation pass instead of a new council (see below).
- Earlier attempts `wf-run-1792486052113-e33b6ca4` and `wf-run-1792494965025-176eda84` failed on herdr seat launches, not on content (backlog `p-d2dc4f2e`).
- Subject: [spec draft](spec-draft-261020-1017-seat-binding-component.md), [inventory](research-261020-0955-seat-binding-needs-and-mechanisms-inventory.md), [tier ladders](research-261020-1339-model-family-tier-ladders.md).
- Evidence (run-local, `.fgos/assignments/`): settled packet `unit-run-1792498871506-22e9d338/producer/2/runs/01/outbox/packet-1.json`; explanation `unit-run-1792502428145-a2c7079c/producer/1/runs/01/outbox/report-1.md`; round-2 reviewer `pass`, round-2 red-team `findings` (two wording defects in the packet's self-description, no change to the verdict).

## Verdict

**Not ready to plan. No owner decision is reopened.** Sections 3–6 and the examples of the draft still carry text the owner later superseded. Eight contracts a planner needs are not written, so a planner would have to invent product behaviour. One consolidation pass of the draft closes all eight. Seven council voices reached this independently; round-2 reviewer and red-team upheld it.

## Blocking defects (smallest fix in brackets)

| # | Defect | Fix |
|---|---|---|
| G1 | Schema and precedence: §3–6 still say Node-first, four roles, global `roles`, `seats.<role>`, presets without tier; persona taste has no config path | Rewrite §3–6 from the owner answers; one schema for `capabilities.<cap-or-prefix>` (`tier, maxTier, rigor, families, roles.<role>, personas.<persona>, seats.<seat>`) and one per-property precedence table |
| G2 | Seat identity: the bind ask carries role, not seat; bindings, assignment dirs, role ledger, panel resume and handoff refs are role-keyed, so three `producer` seats collapse into one slot | Carry seat + role + pattern posture in every ask/result; key storage by unitRun + seat + round + attempt; debate sides become seats; one seat resolver for execution, simulation, doctor, admission |
| G3 | Tier composition: no floor step; examples refuse approved seats; `sameSeat` pins no model | Configured tier (R1 > R2 > default) → stronger-of workflow floor → authorized raise → refuse above the resolved ceiling (capability `maxTier` may exceed global); never clamp; fix examples; continuity pins family+model+effort or refuses by name |
| G4 | Cells: model+effort decided, but `parseTierCell` rejects non-strings, identity omits effort; inline-lead fallback (`session-lead-inline`, `model: 'default'`) bypasses refusals | Cell = string, `{model, pool?, effort?}` or array; omitted tier = unmet; effort in identity and gate; remove the inline fallback when candidates were refused by policy or supply |
| G5 | Human authority is a string: `bin/fgos.mjs:2851` defaults `origin = 'human-cli'`, `unit-handoff.mjs:198` synthesises it, `bind.mjs:385` trusts it | The admission/invocation door computes a trusted `raiseAuthorized`; the crate never reads `origin`; default authority is agent; refusal `tier-escalation-unauthorized` |
| G6 | Three authorities pick an account (pure bind, live lease under lock, gate/doctor replay) | Persist versioned `bindingInput` + `leaseReceipt` per attempt; Rust ranks; adapter acquires exactly the named account or returns `lease-conflict` and the runner rebinds; replay reads the snapshot |
| G7 | Persona scope: loader scans flat workflow files only; one namespace for all domains' agents | Loader attaches `{sourcePath, workflowDir, owningDomain}`; four-tier lookup accepting `agent.<name>.yaml`; persona resolved before taste; qualified identity + digest persisted |
| G8 | One wave has no stop: old activations crash on new keys (`config.mjs:1365`, `rigorToTier` required at 1711); `snapshotRunnerConfig` omits `defaults`/`maxTier`/`tierFallback`; in-flight records role-keyed | Schema fence; backup-first idempotent `fgos setup`; activate release before migrating config; rollback = prior release + pre-migration config; drain predicate with a doctor check; Rust route fails closed, no JS fallback |

Accepted smaller findings, to fold in as operative sentences: stance attaches to panel posture (P2); `maxTier` is the only cost ceiling this wave (P3); pattern-specific hard/soft independence table (B3); no host exec under the provider lock (R1); ordered bind → ledger publish → parallel launch (R5); drain needs a doctor stop (R9).

## Dissent kept, with defaults

1. **Shape S vs B.** Six voices default to S (Rust owns policy, ranking and walk; Node adapter acquires); panelist-2 prefers B (Rust owns static policy only). Default S, because it is the owner's sentence in §3.1; B stays a named fork, raised only if S's two-stage protocol or measured exec budget fails.
2. Interview before consolidation: not needed; consolidate first.
3. Drain vs reader shim for in-flight records: default drain.

## Owner confirmations (asked together, before planning)

1. Floor-wins reading of "R1 > R2 > default": a workflow seat tier is a floor that project config cannot lower; R1 > R2 orders only what sits above it. (Owner 13:50 vs 13:58 sentences are in literal tension.)
2. `family#invocation` pin is hard.
3. Drain and refuse resume of old role-keyed records, with a doctor stop, instead of a reader shim.
4. `--provider` stays executor-keyed this wave.
5. Global `prefer` read as deprecated input mapped to `families` until every activation validates `families`, then `fgos setup` converts the global file.

## Missing expertise → verification in the consolidation pass

| Item | How it is covered |
|---|---|
| Rust host internal-route facade cost | Measure one existing facade (Session Identity / Convention) exec cost per call; record the budget S must meet |
| Effort levels each executor CLI can render | Read each CLI's flag surface (claude, codex, gemini, omp, pi, grok); cell effort refusals list only real levels |
| Trusted human authority for a direct `fgos run` | Check whether admission/consent machinery can attest it; if not, G5 starts as "only `fgos workflow answer --approve` raises tier" |
| Vendor tier/model/price claims | Spot-check the T-section ladder against vendor docs before the model config diff (step 7 of lane SEAT) |

## Next step

A consolidation pass writes a **new revision** of the draft (new file, the current draft kept for comparison): rewrite §3–6 and the examples from the owner answers, write G1–G8 and the accepted sentences as operative text, move historical Q&A to a non-operative appendix, record Shape B as a named fork, carry the five owner confirmations and the two red-team wording corrections. Then the owner approves the consolidated text (lane SEAT gate 1), then the plan.

Do not: start a plan from the current draft; add anything from the council's do-not-add list (cost accounting, new patterns, model evaluator, thinking-control API, second walker, JS policy fallback, `tierCeiling`, R2 packaging).

## Unresolved questions

- The five owner confirmations above.
- Whether a trusted human-authority input for a direct `fgos run` exists today (verification item 3).
