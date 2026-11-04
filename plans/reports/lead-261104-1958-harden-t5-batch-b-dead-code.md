# HARDEN T5 batch B: dead code (lead report)

Worktree `/home/vantt/projects/forgent-worktrees/harden-t5-batch-b`, branch `harden/t5-batch-b`, 5 commits on `origin/main` abd8b56d1. Not pushed. Net vs base: src+bin -1349/+69, test -1380/+119 (45 files, -2791/+217).
Final run: architecture, doc-health, dead-vocabulary-guard, proof-inventory, 8 confinement files, assignment-dispatch: 238/238 pass. Wider runs (94 files importing changed modules, 546 settlement files, merge/claim files): all green. Census `0 undeclared`.

## Item 1 - 8dabc57d1 delete direct confinement door
- Deleted: `executeThroughConfinement`, `finalizeConfinementResources` (incl. its `credentialKept` strip; `credentialKept` itself stays live in `cleanup.mjs`/doctor), `dispatch.mjs` export, census row, `RUN_DOOR_*` architecture rows, 3 unused imports. authority.mjs -509.
- Cascade found and removed in the same commit: with the door gone `cliSpawnAdapter` (transport.mjs) had no caller (census flagged `unresolved-binary`), so its 200-line body, `killChildTree`, `teeChunk`, spawn imports went. `cli-spawn` and `herdr-spawn` are still registered, now through one `registerSupervisedOnlyAdapter` (refuse by name; `herdr-spawn-supervised-only` code and test unchanged). transport.mjs -379. `test/process/one-door.test.mjs` kill allowlist row for transport.mjs removed.
- `architecture.test.mjs` R8 guard rewritten: no `EXECUTOR_ADAPTERS[` lookup may exist in src (was: exactly one, in authority).
- Tests re-pointed (kept, now on live fns `assessAndPrepare`, `prepareConfinementForLaunch`, `buildConfinementAttestation`, `finalizeAttemptHome`): p04 R1 cases 1-8 + R2 + H10/D2 + R3 (9 tests); p05 R3 own-worktree, R3 partial-maturity, R5 x2, R6 (5); blind refusals + attestation (2 tests via helper); backend-p03 "Authority Door" (1); authority R7 observe (1) and H9 launch door (1); reconciliation 16b (1).
- Tests retired (27) and owner:
  - authority.test: adapter handoff, 2 external-harness, failure wrapping, M3 shape, missing adapter, red-team result, HIGH-1 x2 (clobber, requirement threading), leased account trustAccountSource (10): behaviour removed with the door (live trust source is read in assignment-runner).
  - p04: F-a (owner: R1 case 1), R8 live bwrap (owner: authority.test launch-door test) (2). p05: R2 exec, R4 adapter opts (2): removed. backend-p03 adapter-failure cleanup (1), credential-hygiene failure cleanup (1): removed; attempt home removal owned by `finalizeAttemptHome` tests (attempt-steps, sweep, cleanup test in credential-hygiene).
  - reaper-fence 5 + 6 loop cases = 8 (digest compare of finalizer): removed; mismatch of a v2 marker owned by attempt-steps `home-marker-mismatch`. reconciliation 1 (cliSpawnAdapter parity) and 16 (finalizer idempotence): removed. provider-credential-renewal ownership mismatch (1): removed.
- Behaviour lost with the door (no live equivalent, all removed): completed-phase attestation with `falsification-probe` current evidence (live path records prepared/refused attestations only); `buildConfinementAttestation` still has `phase: completed|failed`/`error` params with no production caller (not removed, not examined).
- Verification: `grep` over src bin apps scripts packages found no dynamic or other caller.

## Item 2 - 6f2ccb617 dead modules, validator, exports
- Deleted `dispatch/prepare.mjs` (49), `dispatch/recovery.mjs` (178; live is `runner/recovery.mjs` + `recovery-planner.mjs`), `validatePlacementPolicyShape` (unreachable) and its call, 11 exports (all had zero readers incl. tests, also unused inside their files): `isSubstantiveEvidenceRef`, `operationDeclaresWorkProduct`, `tierCellMissingDetail`, `selectConfinedInvocationId`, `normalizeRunResultV4`, `OUTCOME_CATEGORIES`, `hasOperationPromptTemplate`, `readSecretSideFile`, `patchCommandRecord`, `readCommandState`, `CONSENT_STALE`. Src -386.
- Retired: `dispatch-effect-guarantee.test.mjs` (15): behaviour removed (assess had no caller). Manifest rows (prepare, recovery), suite-baseline row, 3 `prepare.mjs` entries in import-graph boundary lists removed.
- Docs fix (allowed): `docs/platform/agent-coordination/architecture/executor-health-and-fallback.md:155` dead backticked path reworded to "former module".
- NOT DONE: `loadRunnerConfig` is dead in production but is the fixture loader of 15 test files (~230 calls, 163 in dispatch.test.mjs) and has no layering semantics `loadRunnerConfigForDir` offers. Removing it means rewriting fixtures through the config door; left for its own batch (needs owner call). Its barrel export `dispatch.mjs:14` stays.
- Also noticed, not touched: orphaned doc-comment head in `config.mjs` (~:1262, the `capabilities` catalog docblock begins mid-sentence, pre-existing).

## Item 3 - 6c5c6d979 lock-wait
- `withLockRetry` was `fn({waitMs: waitMs ?? 60s})`. Its only callers (`bin/fgos.mjs` take, pick) pass `doTake`/`doPick`, which take no argument: **`--wait <ms>` never reached the claim door for take/pick** (pre-existing; owner may want to know). Callers now call the door directly and still validate the flags. `DEFAULT_LOCK_WAIT_MS` is a private const of `merge.mjs` (its only reader). Deleted `lock-wait.mjs`, its manifest/baseline rows, decision-codes baseline entry. `bin/fgos.mjs` comment reworded.
- Retired: `lock-wait.test.mjs` (5): behaviour removed; real lock waiting owned by merge-target-slot-multiprocess and holder-lock facade-multiprocess tests.

## Item 4 - 91b50c2f9 adapter sniff, parseHerdrUsage
- `settleRunOutcome` requires `opts.adapter` (named refusal `adapter-required`); sniff and the `|| 'cli-spawn'` fallback for usage parsing removed. Only prod caller (`settle-attempt.mjs:235`) already passes it. 4 test callers now pass `adapter: 'cli-spawn'`.
- `parseHerdrUsage` and the "herdr in executor name" branch deleted. Observable change: an executor whose id contains "herdr" previously got `usage.source: 'unavailable-herdr'`, now the parser of its agent name (all-null values either way). No real executor id in repo config contains it.
- Retired: usage-parsers `parseHerdrUsage` test and the herdr line of the dispatch test (1 test + 1 assertion): behaviour removed.

## Item 5 - 8af1a6b71 settled-result predicate
- Done: the two inline copies in `executeAssignment` (provider-capacity rehydrate, resume guard) now call `readSettledResult`; `interpretRunResult` import dropped. Resume-corrupt still throws `result-corrupt`; the two messages merged into one. -18 net.
- Not done: the third "sound" check in the T5 simplicity report was already `readSettledResult` (:1632, :2085, :2144).

## Docs lines left stale (not edited, outside allowed scope)
Name `executeThroughConfinement` as the live door: `docs/platform/agent-confinement/spec.md` :32 :51 :214 :249; `docs/platform/architecture-map.md:456` (CTR011); `docs/reading-map.md:152`; `docs/reference/dispatch-module-boundaries.md:27`; `docs/how-to/configure-and-operate-agent-confinement.md:10`; `docs/platform/agent-confinement/history/rollout-and-settled-facts.md` :28. `executor-health-and-fallback.md:32` table still calls `dispatch/recovery.mjs assess` a "related live subset" (unbackticked path, so doc-health passes). Decision/spec "Lịch sử quyết định" entry for the door removal and CHANGELOG are for the doc owner; no user-visible change in this batch.

## Questions
- `loadRunnerConfig`: rewrite 15 test files onto the config door now, or leave? (left)
- `--wait` on take/pick does nothing: fix or drop the flags?
- `buildConfinementAttestation` completed/failed phases and the non-supervised branch of `prepareConfinementForLaunch` (cli-spawn envelope v2 path) look unreachable from production now; not verified, not touched.

Status: DONE_WITH_CONCERNS
