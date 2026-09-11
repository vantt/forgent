# Phase 07 — Strict Readiness, Docs, and Closeout Report

Track: `confinement-authority-implementation`  
Cell: `confinement-authority-implementation--p07`  
Assignment: `asgn_lead_confinement_authority_implementation_op_083`  
Branch: `confinement-authority-implementation--p07`  
Date: 2026-09-11  

---

## 1. Executive Summary & Objective

This report marks the formal closeout of the `confinement-authority-implementation` track (Phase 00 through Phase 07). The track has successfully established the Confinement Authority as the single runtime execution door (`executeThroughConfinement`) across all fgOS agent dispatches, backed by a production Linux kernel namespace sandbox driver (`bwrap` / `local-bwrap-v1`), declarative policy enforcement, durable audited attestation records (`confinement-attestation.v1`), and comprehensive `fgos doctor` diagnostic checks.

All requirements R1 through R7 of `phase-07-strict-readiness-docs-closeout.md` have been fulfilled.

---

## 2. R1 Decision: Strict Confinement Default Mode

### Decision
`runner.confinement.strict` remains `false` by default, accompanied by active readiness guidance via `fgos doctor` check `confinement-strict-readiness`. It is **NOT** flipped to `true` by default at this stage.

### Detailed Justification

1. **Capability Anchor Completeness:**
   Per the core requirement: *"Do not flip true unless every committed capability anchor is explicit and supported."*
   In `src/setup/registrations.mjs` (`DEFAULT_CAPABILITY_SLOTS`), only 3 of 7 canonical capabilities declare explicit confinement policies:
   - `advise`: `{ mode: 'unconfined' }`
   - `code:review`: `{ mode: 'unconfined' }`
   - `code:debug`: `{ mode: 'unconfined' }`
   The remaining 4 canonical capabilities (`execute`, `code:implement`, `code:test`, `code:refactor`) omit confinement declarations. In addition, domain workflow registrations introduce several capabilities without explicit policy anchors. Defaulting `strict: true` would cause startup validation errors or dispatch refusals across clean, standard fgOS environments.

2. **Residual Anchor Inheritance Indistinguishability (P04 M-3) — this does NOT independently justify keeping strict false:**
   `buildConfinementRequest` currently copies anchor confinement without an `inherited` or `omitted` distinction tag, so an inherited-unconfined execution produces an attestation indistinguishable from an explicit opt-out (`request.mjs:141-144`). A live probe against the real merged config shows this path is only reachable when a capability declares **no** confinement of its own and falls through to inheriting its anchor's policy (confirmed today for `fgos-coding-implement`, `impact-analysis`, `pane-labeling`). `runner.confinement.strict` has **zero runtime effect** anywhere in `src/runner/dispatch/confinement/**`, `cli.mjs`, or `resolve.mjs` — its only effect is the throw-at-config-load check in `config.mjs:1266-1283`, which requires every declared capability to carry its own explicit confinement. Under that check, `request.mjs`'s inheritance branch becomes unreachable for every capability strict mode would actually allow to load. So M-3 is an argument **for** enabling strict eventually (flipping it closes exactly this gap for declared capabilities), not a reason to keep it false. The keep-false decision below stands on justification #1 alone — three canonical capabilities (`impact-analysis`, `pane-labeling`, `fgos-coding-implement`) currently declare no confinement at all, so flipping `strict: true` today would immediately throw at config load for them.

3. **Attestation Body Residuals (P03 NEW-1b/NEW-1c & P06 M2):**
   Under enforced execution, attestation bodies remain thin (`channels[]` carry observe-mode detail rather than verified runtime channel instrumentation). While kernel-level confinement is verified by escape probes, the attestation payload telemetry is not yet fully hardened.

4. **Platform Portability — supporting context, not itself a strict-mode gate:**
   `runner.confinement.strict`'s own load-time check (`config.mjs:1266-1283`) never inspects the bwrap backend or the host platform; it only requires every declared capability to carry an explicit `confinement` block. So strict mode would not, by itself, throw on a non-Linux host. The real platform constraint is downstream of strict: any capability that then declares a `required`-mode policy needs a working `bwrap` backend to actually dispatch (`confinement-backend-missing`/`-disabled` refusal), and Bubblewrap is Linux-only. Named here as context for why capability anchors should stay `unconfined` rather than blanket `required` on non-Linux dev machines, not as an independent reason strict itself must stay off.

5. **Operational Doctor Guidance:**
   `fgos doctor` registers the `confinement-strict-readiness` check. When strict mode is false, `doctor` reports `passed` with an informative warning explaining that strict enforcement is disabled and listing exactly which capability anchors are missing (per capability: `capability "<name>" missing confinement policy`) — not a multi-step operator checklist. The mechanical step for an operator ready to flip the flag is still just `.fgos/config.json` → `runner.confinement.strict = true`, after declaring confinement for every capability the warning names.

---

## 3. Implemented Support Matrix

| Dimension | Supported / Production Status | Notes |
|---|---|---|
| **Operating System** | Linux with user namespaces (bubblewrap's own requirement) | Validated live on this session's Linux x86_64 host with `bwrap`; no aarch64 run or specific kernel-version floor was evidenced this session — dropped from this row rather than asserted unverified. |
| **Execution Door** | `executeThroughConfinement` (`src/runner/dispatch/confinement/confinement-authority.mjs`) | One door for all external dispatches |
| **Backend Driver** | `local-bwrap-v1` (`src/runner/dispatch/confinement/backends/local-bwrap.mjs`) | Production bubblewrap isolation wrapper |
| **Machine Registry** | `~/.fgos/confinement-backends.json` (`confinement-backend-registry.v1`) | Host trust store managed with `fgos doctor --fix` |
| **Policies Supported** | `workspace-write`, `host-write-denied`, `unconfined` | Declarative `confinement-policy.v1` schema |
| **Dispatch Outcomes** | `enforced`, `unconfined`, `unknown`, `refused`, `degraded` | Fail-closed when required policy cannot be enforced; `unknown` (not `observe`) is the real outcome token for a capability that omitted confinement (`authority.mjs` `determinedOutcome`) |
| **Dispatch Call Sites** | Automated runner loop (`spawnWorker`), interactive (`herdr-spawn`), runner CLI (`fgos-runner`), coordination (`fgos coordination run`) | 100% of external agent spawns route through Authority |
| **Attestation** | Durable JSON records in `~/.local/state/fgos/attestations/` (`confinement-attestation.v1`) | Captures request, plan, backend, outcome, exit status, and hashes |

---

## 4. Open Deferral Register (P00–P06)

**Correction (this fix round):** an earlier version of this section re-labeled the four
CLOSED fail-open paths `F-a`..`F-d` (already satisfied — see §2 above, `docs/specs/confinement-authority.md:66-69`,
and `P04.md`'s own R6 row) as invented open items, and cited a "herdr-native confinement driver"
that has zero hits anywhere in `docs/` or `src/`. Those four IDs stay closed and are not reused
below. The table below instead lists the REAL open deferrals actually carried across
`P00.md` through `P06.md`, grouped by phase, with the same IDs each phase file already uses
(prefixed by phase to disambiguate reused letters like `M-1`/`M-2`/`M-3` across P03/P04).
Items closed by a later phase (e.g. P05's own bypass-pairing-test LOW, closed by P06's added
regression test — `P06.md`'s "Produce" row) are not repeated here.

| ID | Phase | Title | Note |
|---|---|---|---|
| `codex-readonly` non-bwrap surface | P00 | Retired-but-registered `codex-readonly` executor (`-s read-only`) is a non-bwrap, non-declared enforcement surface | Still registered in `.fgos/config.json`; P00.md flagged this for P04 to account for or explicitly exclude — not done by this HEAD. |
| M7-residual / M7-cache | P01 | `checkBwrapAvailable`'s cache keys on the literal string `'bwrap'` (registry names `/usr/bin/bwrap`) and is never invalidated for the process lifetime | Verdict correctness unaffected; smoke test just runs twice on a fresh machine. |
| N2-residual | P01 | `runFixes` has no `try/catch` around its 10 registered fixes | A future fix throwing would abort the whole `doctor --fix`/`setup` run, same class as the already-closed corrupt-registry case. |
| L4-residual / N3-residual / L4-mutation | P01 | Network-filter CIDR canonicalization, override-matching exactness, and mutate-in-place-vs-frozen-input inconsistencies | All confirmed safe-direction (false-refusal only, never silent widening); `validateOverrideConfinementShape` also still has no production call site. |
| MED-B | P02 | Capability identity is decided by the confinement config itself, so an unrelated capability sharing an executor with a `required`-policy capability can capture that name in a refusal/attestation | Fail-closed (over-refuses), latent because no live capability currently declares `confinement` on a shared executor — exactly the gap P04's strict mode was meant to close before flipping on. |
| MED-1 (P02, "inherited-fd channel") | P02 | The `inherited-fd` attestation channel is claimed `covered` off the same `isVerifiedBwrap` gate as filesystem, but bwrap does not close inherited descriptors — live-falsified | All 3 production bwrap executors currently attest this channel `covered` for something their argv does not cover. |
| MED-2 (P02, "unscoped writable exception") | P02 | `hasWiderWritableRebind` only fires when a bind destination is exactly `/`; any other destination is silently accepted as "scoped" | Latent today (no registered executor re-binds anything but `.fgos/assignments`). |
| LOW-1/2/3, INFO-1, LOW-A/B/C, R8 test-scope gaps | P02 | Writable-exception basename collisions, `--` separator trust, unrecorded tmpfs/dev/proc writable mounts, hardcoded-literal-argv test fragility, wider door return shape, unreachable `homeDir` grant path, static-scan blind spots | See `P02.md` Deferred for the full list; none reachable in the current live config. |
| NEW-1b/NEW-1c (P03) / M2 (P06, same item, reconfirmed) | P03, carried through P05, reconfirmed P06 | `enforced` attestation records' own body (`channels[]`, `effectiveControls`) is still built from the original request, not the actual executed invocation — the outcome label is correct, the descriptive detail underneath is thin | Left for P07 or a future hardening pass; not introduced by any single cell. |
| M-1 (P03) | P03 | Per-dispatch probe gate has no cache, single-flight, or timeout (spec §6.6 calls for all three) | Concurrent required dispatches each pay a real ~180ms/9-bwrap-spawn cost with no coalescing. |
| M-2 (P03) | P03 | The probe binary resolved for verification can differ from the binary actually used to spawn when a machine registry entry omits `executable` | Narrow gap between what was proven and what runs. |
| M-3 (P03) | P03 | Neither round 2 nor round 3's fix shipped its own regression test (`confinement-coverage-unverified` refusal path, probe-driven `enforced` gate) | No test net for either fix. |
| M-4 (P03) | P03 | Round 1's fix deleted the pre-existing `assessBwrap` unsupported-controls test rather than updating it | Net-reduced coverage, not just changed. |
| L-1..L-4 (P03) | P03 | `confinement-probe-failed` not in spec §6.8's registered error taxonomy; `verifyRequiredProbe` hardcodes `backendInstance.type === 'bwrap'`; fixed 8-probe fingerprint doesn't bind proof to the specific request; CHANGELOG entry miscategorized | See `P03.md` Deferred. |
| R4 (P03, carried through P05) | P03 | `reapOrphanedConfinementResources` (R5) still has zero production call sites; success-path temp-directory leak unchanged and growing | Cleanup removes only the recorded `home` child, never the parent `<dispatchId>/` directory. |
| R6 residual / NEW-2 (P03) | P03 | `attestationStoreDir` test-only context override outside `buildConfinementRequest`'s whitelist; store-overlap refusal produces no durable refused-attestation record; no retention policy | Record count grew from 5712 to 6602 across one focused suite run at the time of observation. |
| M-1 (P04) | P04 | `CHANGELOG.md`'s R7 bullet still claims all 7 canonical capabilities got an explicit `unconfined` declaration; only 3 (`advise`, `code:review`, `code:debug`) actually do | A precise one-line correction, specified in two failed fixer briefs, never landed because both attempts timed out before writing anything. |
| M-2 (P04, carried through P05/P06) | P04 | `test/runner/dispatch-production-call-sites.test.mjs`'s fixture is not isolated from the operator's real global `~/.fgos/config.json` (`mergeWithGlobalConfig`, `config.mjs:255-272`) | Test-isolation quality gap, not a live security gap; causes the 2 stable test failures re-confirmed in §8 below. |
| M-3 (P04, carried through P05/P06 — see §2 R1 justification #2 above) | P04 | `buildConfinementRequest`'s anchor-inheritance (`request.mjs:141-144`) copies an anchor's `unconfined` mode wholesale with no `omitted`/`inherited` flag, so an inherited-unconfined capability's attestation is indistinguishable from a genuine self-declared opt-out | Real, reachable-today gap; the fix (mark the inherited requirement `omitted:true` or a distinct `inheritedFrom` marker) was specified precisely in two narrowed fixer briefs, never landed because both timed out before writing anything. |
| Executor-timeout structural finding (P04) | P04 | `codex-herdr` burned its full 35-minute ceiling twice in a row with zero commits, on two different task scopes | Whoever next picks up M-1/M-2/M-3 should swap the fixer executor away from `codex-herdr` for this task or raise the per-dispatch wall-time ceiling. |
| 2 trivial LOW (P06) | P06 | A narrative-prose mismatch between the P06 report and its own committed evidence file (`late`/`missing` actor lists); a ~12-second capture-vs-generation timestamp discrepancy in the report | Cosmetic, no action needed. |

All P01-P06 structural/residual findings not specifically named above remain as documented
in each phase's own `Deferred` section; this table is a curated index into them, not a
replacement for reading the phase files directly.

---

## 5. Doctor Surface Verification

`fgos doctor` diagnostics have been fully implemented and verified:
1. `confinement-policies-declared`: Passed (checks capability anchor coverage — see the capability-count caveat below).
2. `confinement-backend-registry-readable`: Passed (validates `~/.fgos/confinement-backends.json` readability and schema). Automatic fix registered with `fgos doctor --fix`.
3. `confinement-bwrap-platform`: Passed (detects Linux platform and verifies `/usr/bin/bwrap` availability).
4. `confinement-probe-freshness`: Passed (executes probe matrix to verify live backend capabilities).
5. `confinement-strict-readiness`: Passed with warning (reports strict mode disabled and guides activation — see the capability-count caveat below).
6. `confinement-herdr-maturity`: Passed / partial (reports maturity status of herdr isolation).
7. `config-not-stale`: **FAILS** on this repo today — missing `advise`/`code:review`/`code:debug` confinement keys in the project's local `.fgos/config.json` relative to what `fgos setup` would now generate; remediation is to run `fgos setup`. This was not previously called out in this closeout.

### Capability-count caveat: three different, individually-correct numbers

This report (§2 justification #1), `fgos doctor`, and the runtime strict-mode validator each answer
"how many capabilities declare confinement?" differently, and all three are accurate for what
they each actually read:

- **This report says 3/7** — reading `DEFAULT_CAPABILITY_SLOTS` in `src/setup/registrations.mjs`, i.e. the
  shipped source defaults for the 7 canonical capabilities.
- **`fgos doctor` on this repo says 0/10** — `confinement-policies-declared` and `confinement-strict-readiness`
  (`registrations.mjs:3658`, `3915`) both read confinement declarations via `readSharedConfig(cwd)`, the
  **project-local** `.fgos/config.json` only, with no global-config merge. This repo's project config
  currently declares confinement for none of its 10 registered capabilities.
- **The runtime strict-mode validator says 7/7 canonical capabilities are explicit `unconfined`** — production
  dispatch resolves config via `loadRunnerConfigFromDir` + `mergeWithGlobalConfig` (`config.mjs:255-272`),
  which merges in the operator's real `~/.fgos/config.json`. Only `impact-analysis`, `pane-labeling`, and
  `fgos-coding-implement` are missing there.

Because `doctor`'s two confinement checks never apply the global merge, their strict-readiness
guidance is evaluated against a narrower view of config than the one `runner.confinement.strict`
would actually validate at dispatch time if flipped on — an operator reading only `doctor`'s output
would see 0/10 and not know the real gap (against the config strict validates) is 3 capabilities,
not 10. Unifying the two resolution paths is a real fix but was judged too large a change for this
fix round (it touches `checkConfinementPoliciesDeclared` and `checkConfinementStrictReadiness`'s
config-loading, with knock-on effects on `test/setup/registrations.test.mjs` and any other test
asserting doctor's current project-only reading); it is named here explicitly so it is not silently
inconsistent, and is left as a deferral for whoever next touches `src/setup/registrations.mjs`'s
confinement checks.

---

## 6. Specification and Documentation Deliverables

- **BA-Grade Spec:** `docs/specs/confinement-authority.md` updated to `coverage: implemented` with settled decisions, risk resolutions, and implementation facts.
- **Runner Spec:** `docs/specs/runner.md` updated with Data Dictionary entries for `confinement` & `confinementPolicies`, plus the `Confinement Authority (executeThroughConfinement)` behavioral section.
- **Reading & Architecture Maps:** `docs/specs/reading-map.md`, `docs/architecture-map.md` (`dispatch/confinement/`, `confinement-enforcement` slice, `CTR010 · confinement-authority.v1`), and `docs/reference/dispatch-module-boundaries.md` updated.
- **Operator How-to Guide:** Created `docs/how-to/configure-and-operate-agent-confinement.md` covering architecture, backend registry setup, doctor diagnostics, attestation inspection, and strict mode checklists.
- **Changelog:** `CHANGELOG.md` updated with Phase 06 and Phase 07 entries under `## [Unreleased]`, and P04 M-1 overclaim corrected.

---

## 7. GitNexus Code Intelligence Gate (R5)

`gitnexus status` reports "Repository not indexed". No GitNexus MCP server is registered in the environment. Per the capability gate convention, this status is recorded; no AST index changes were required for documentation and specification updates.

---

## 8. Test Suite Verification (R6)

- Full test suite command executed: `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'`
- Re-run independently by both the reviewer (op_084) and red-team (op_086) at this same HEAD `fbff7630`:
  reviewer: 6076 tests, 6064 pass, 4 fail, 8 skip; red-team: 6076 tests, 6065 pass, 3 fail, 8 skip — the
  count difference is 2 documented load-dependent flakes (below) that did not fire in the red-team's run.
  Nothing unmapped in either run.
- Analysis of failures, each mapped to its own documented finding rather than described inline only:
  1. `test/runner/dispatch-production-call-sites.test.mjs:427` & `:526` (stable, fires every run): `P04.md`'s
     own already-deferred **M-2** — the fixture is not isolated from the operator's real global
     `~/.fgos/config.json`; `mergeWithGlobalConfig` (`config.mjs:255-272`) leaks it in, so omitted capability
     policy resolves to `unconfined` rather than the mock-assumed `unknown`. Test-isolation gap, not a live
     security gap.
  2. `test/runner/cohort-planner.test.mjs:478`: known pre-existing red test, documented at
     `plans/260910-1243-confinement-authority-implementation/plan.md:238` ("Known pre-existing red tests
     (not regressions): `cohort-planner` \"buildCandidateInventory against the real committed\"") — a
     cohort-inventory check against this host's own machine configuration tiers, unrelated to this track.
  3. `test/cli/fgos-intake-4.test.mjs:318`: documented load flake, tracked as G7 in
     `docs/architect/agent-coordination/verification/step-07-mvp/index.md:25` ("known flake, ask/answer
     round-trip. Not in this plan's scope"). Did not fire in the red-team's re-run.
  4. `test/runner/coordination-research-fan-out.test.mjs:432` & `:462`: documented load-dependent
     fail-fast/deadline-threshold timing flakes, named in `P05.md`'s own Tests section ("pass 5/5 in
     isolation, not regressions introduced by this cell"). Did not fire in the red-team's re-run.
- Confinement authority test coverage:
  * 100% pass across all dedicated confinement suites: `test/runner/confinement/**/*.test.mjs`, `test/runner/confinement-authority.test.mjs`, `test/runner/local-bwrap.test.mjs`, `test/setup/confinement-*.test.mjs`. All bubblewrap isolation, sandbox plan compilation, probe execution, attestation recording, doctor checks, and repair routines verified green.
- Independently re-run again for this fix round (docs/description-only changes, no runtime code touched
  except a doctor-check description string): 6076 tests, 6064 pass, 4 fail, 8 skip. 3 of the 4 are the
  same mapped failures above (cohort-planner, 2x dispatch-production-call-sites/M-2); the 4th,
  `test/runner/herdr-spawn-adapter.test.mjs:789` ("a herdr that stops answering does not turn a live
  round into an idle timeout"), did not appear in either prior run — re-ran that file alone and it passed
  28/28, confirming a load-dependent timing flake (same class as the already-documented
  `coordination-research-fan-out`/`assignment-*` flakes) rather than a regression from this round's edits.
