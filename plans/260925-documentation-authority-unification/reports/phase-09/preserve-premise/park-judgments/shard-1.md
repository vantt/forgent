# Parked premise judgments — shard 1 rework

**Evidence pin:** `c94545de5b45873cb2eb419f10124283fd730a2e` (unchanged).
**F-chain check HEAD:** `c58f2b230e14e73db42cb8ccc965ef8967bb085a`.
**Status: blocked on two checker representation gaps; not mechanically accepted.**
The row repairs are prepared, not applied to consumers. No independent approval,
gate closure, source deletion, authority flip or cutover readiness is claimed.

Read first: [rework brief](../../w25-shard-rework-brief.md),
[W23 review](../../reviews/w23-g6-shard-1-review.md),
[per-row verdicts](../../reviews/w23-g6-shard-1-review.json),
[L13-21](../../owner-answers.md), and the
[chain-check report and Lead correction](chain-check.md).
The starting findings are in [chain-check-c804a3213.json](chain-check-c804a3213.json).

## Counts before and after

| Measure | Before | After |
|---|---:|---:|
| Assigned rows, each exactly once | 263 | 263 |
| Preserve confirmed | 118 | 101 |
| Repoint | 37 | 54 |
| Successor bound | 108 | 108 |
| Owned park / retire with source | 0 / 0 | 0 / 0 |
| Active file patches | 19 | 25 |
| Rows carrying active patches | 37 | 37 |
| `alreadyComposed` rows, without parallel patches | 0 | 17 |

There are **39 changed rows**: all 34 W23 REWORKs, the four AGENTS context
conflicts, and one stale-chain dependency note. The remaining 224 judgments and
all original source/proof bindings are unchanged. Ten redundant file patches
were removed; 16 banner file patches were added. The review prose says 11
redundant files, but its enumerated duplicate rows occupy ten distinct files.

The baseline checker run at the check HEAD gave exit 1: 16 unresolved duplicates,
five row conflicts and 15 stale chain entries globally (36 unresolved).
For shard-1 files alone this is 16 + 5 + one stale entry = **22 unresolved**.
These agree with the corrected starting report's shard-1 findings.

After repair, unmodified checker validation stops with
`invalidShard: patch preimage: AGENTS.md`, plus the same 15 global stale entries
(exit 1, 16 unresolved). It does **not** inspect the repaired rows after rejecting
the shard. A separate call to its existing `inspect_rows` exposes the second
representation gap: `invalidAlreadyComposed` on f00183; it validates 16 other
markers and all 25 forward/reverse patch roundtrips. This is not a green checker
result and does not satisfy the brief's stale-only acceptance condition.

## Every changed row and its reason

### Existing F-chain retargets — remove duplicate patches

Every row below remains `repoint`, names the effective entry in
`alreadyComposed`, and carries no `patch` property. Its original successor and
source evidence remain bound, except f00477 gains its appropriate successor.

| Row | Effective chain entry | Reason |
|---|---|---|
| f00148 | `w2:predecessor:apps/fgos-gateway/Cargo.toml` | The chain already retargets the bound CTR010 citation. |
| f00156 | `file:apps/fgos-gateway/src/gateway.rs` | The chain already retargets the API header citation. |
| f00158 | `file:apps/fgos-gateway/src/gateway.rs` | The chain already retargets the default-port citation. |
| f00161 | `file:apps/fgos-gateway/src/gateway.rs` | The chain already retargets the error-category citation. |
| f00162 | `file:apps/fgos-gateway/src/gateway.rs` | The chain already retargets the ErrorEnvelope citation. |
| f00163 | `file:apps/fgos-gateway/src/gateway.rs` | The chain already retargets the client-error guidance citation. |
| f00175 | `w2:predecessor:apps/fgos-gateway/src/mcp.rs` | The chain already retargets the MCP contract citation. |
| f00177 | `file:apps/fgos-gateway/web/src/App.tsx` | The chain already retargets S01. |
| f00178 | `file:apps/fgos-gateway/web/src/api/client.ts` | The chain already retargets the typed-client contract citation. |
| f00181 | `file:apps/fgos-gateway/web/src/api/types.ts` | The chain already retargets the mirrored-schema citation. |
| f00183 | `file:apps/fgos-gateway/web/src/lib/network.ts` | The chain joins the split contract path while rewrapping the header; a second patch is wrong. See checker gap below. |
| f00187 | `file:apps/fgos-gateway/web/src/screens/TaskDetail.tsx` | The chain already retargets S03. |
| f00189 | `file:apps/fgos-gateway/web/src/screens/TaskDetail.tsx` | The chain already retargets M03. |
| f00191 | `file:apps/fgos-gateway/web/src/screens/Taskboard.tsx` | The chain already retargets S02. |
| f00193 | `file:apps/fgos-gateway/web/src/screens/Taskboard.tsx` | The chain already retargets M03. |
| f00477 | `file:core/skills/_shared/citation-format.md` | Change preserve to repoint: “OLDER” describes the rule, not a reason to break its locator. Bind the actual area-suffix inventory at the mapped audit, lines 50–61; do not reinstate that obsolete rule. |
| f00478 | `file:core/skills/_shared/citation-format.md` | The chain already retargets the mapped audit's D-local citation rule. |

### Rebase the AGENTS patch on the strict chain result

| Row | Reason |
|---|---|
| f00102 | Keep the approved foundations-map retarget; replace the patch's conflicting pre-chain context with exact F-chain context. |
| f00106 | Keep the approved handoff-contract retarget in the reading list; share that same rebased file patch. |
| f00117 | Keep the approved handoff-contract retarget in DoD question 3; share that same rebased file patch. |
| f00118 | Keep the approved foundations-law retarget in DoD question 4; share that same rebased file patch. |

All four rows carry one identical post-chain patch with explicit `base` metadata.
The effective predecessor is `file:AGENTS.md`; the chain is strict, not diagnostic.
The four replacement ordinals remain 8, 13, 60 and 63. Only the four requested
citation paths change; the surrounding chain's navigation and doctrine edits
remain intact. Exact `patch --batch --fuzz=0 -p1 --forward` then `--reverse`
succeeds with no offsets or fuzz and restores the complete chain result.

- Actual chain preimage SHA-256: `53e9bdde5d98a51b6eaca164b4f36c096fc7d98fadc2d7e08965092517a51935`.
- Prepared postimage SHA-256: `8635c80bbede10bab467f161d359ed4305e7846ca89edf5b0199d78bc216a8f8`.
- The original pin preimage digest is retained only as `base.pinSourceSha256`,
  not falsely asserted as the rebased patch's source digest.

### Removed-door / Updated banners — live decision locators

Each row changes preserve to repoint under L13-21.2. Its new patch replaces only
`docs/specs/runner.md` with `docs/platform/runner/decisions/h-36d872fbb0e5.md`.
The successor evidence binds the complete decision 0062, lines 1722–1741 at the
unchanged evidence pin, with move-set id `step10-runner-0002`. Dates, historical
accounts, replacement commands and surrounding prose stay unchanged.

| Row | Consumer / reason |
|---|---|
| f03127 | `dispatch-activation-and-handoff-redesign.md`: the present-tense Removed door banner needs a surviving decision locator. |
| f03134 | `dispatch-execute-concurrency-guard.md`: same live banner locator, not historical source identity. |
| f03136 | `dispatch-execute-lost-uncommitted-paths-warning.md`: same live banner locator. |
| f03139 | `dispatch-execute-prompt-file-flag.md`: same live banner locator. |
| f03143 | `dispatch-execute-repo-root-cwd-separation.md`: same live banner locator. |
| f03144 | `dispatch-execute-unsignaled-outcome.md`: same live banner locator. |
| f03170 | `executor-dispatch-manual-log-gap-and-step-b5-fix.md`: same live banner locator. |
| f03171 | `fanout-batch-background-execution-and-orphan-recovery.md`: same live banner locator. |
| f03177 | `fanout-execute-consolidation.md`: same live banner locator. |
| f03178 | `fgos-fanout-out-of-process-dispatch.md`: same live banner locator. |
| f03202 | `glm-openrouter-executor.md`: same live banner locator. |
| f03210 | `herdr-spawn-adapter-fresh-pane.md`: same live banner locator. |
| f03219 | `main-checkout-lock-scope-audit.md`: same live banner locator. |
| f03250 | `root-resolution-two-call-split-propagation.md`: same live banner locator. |
| f03294 | `worktree-isolation-existing-path-hazard.md`: same live banner locator. |
| f03352 | `handle-worktree-guard-refusal-of-compound-dispatch-command.md`: the Updated note is current guidance, so its decision locator must survive too. |

The first 15 consumers are under `docs/explanation/`; f03352 is under
`docs/how-to/`. Each row's JSON contains its complete path and bound evidence.
All 16 patches roundtrip against their actual F-chain results without fuzz.

### Rationale and stale dependency

| Row | Reason |
|---|---|
| f03404 | Keep `preserve-confirmed`, regroup as `native-file-contract`: this is a live Related pointer, not a completed-change capture. All five tracked `docs/how-to/coordination-examples/group-thinking-*.json` files survive unchanged. |
| f03442 | Keep the approved successor binding; add a note that `file:docs/io-contract.md` is stale. Its diagnostic chain reconstruction does not approve that entry or invalidate the independently pin-bound References passage. A separate turn owns the rebase. |

## Blocking checker gaps — no waiver

1. **Post-chain patch schema (AGENTS).** `validate_shard` always compares
   `patch.sourceSha256` to `blob(document.pin, file)` and generates the expected
   unified diff from that bare blob. L13-21.1 instead requires a conflicting
   patch to be rebased on the F-chain result. Those are different bytes. The
   rebased patch is correct and directly replayable, but the unmodified checker
   rejects it as `patch preimage: AGENTS.md`. Keeping the old digest would lie;
   keeping the old patch would preserve the known chain conflict.
2. **Wrapped old operand (f00183).** The correct effective entry is
   `file:apps/fgos-gateway/web/src/lib/network.ts`. Its old hunk contains
   `docs/contracts/` followed by newline/comment prefix and
   `fgos-gateway-api-v1.yaml`. Its new hunk contains the full literal successor.
   The marker validator demands the normalized contiguous old path be a literal
   substring of the old hunk (`any(p in old and p not in new ...)`). That cannot
   hold for this split spelling. The exact original bound lines and strict entry
   witness the retarget; a separate normalization check confirms it. The existing
   checker finding is retained as unresolved, not silently overridden.

The only needed out-of-scope repair is
`plans/260925-documentation-authority-unification/reports/phase-09/preserve-premise/park-judgments/check_shard.py`.
It needs to validate a declared strict-chain patch base and recognize the bound
split-path marker while preserving exact-entry/no-parallel-patch checks. This
turn does not edit that file, change proof inputs, weaken checks or invent a
success status. The required stale-only checker result is **blocked** until the
checker owner repairs these two gaps and reruns it.

## Deferred stale chain entries

The checker emits all 15 global stale predecessors even for `--shard 1`.
Each entry id is `file:<path>` below. All remain unresolved and untouched.
Only `docs/io-contract.md` touches a shard-1 source file (f03442, noted above).

- `.githooks/pre-commit`
- `docs/io-contract.md`
- `docs/platform/agent-confinement/contracts/confinement-authority-v1.md`
- `docs/platform/agent-confinement/decisions/confinement-authority-decisions.md`
- `docs/platform/agent-confinement/history/rollout-and-settled-facts.md`
- `docs/platform/agent-coordination/decisions/README.md`
- `docs/platform/runner/architecture/h-69197b459754.md`
- `docs/platform/runner/architecture/h-7af1f0242611.md`
- `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md`
- `docs/reading-map.md`
- `plugins/fgOS/skills/terminal/SKILL.md`
- `src/runner/dispatch/assignment-runner.mjs`
- `src/runner/dispatch/confinement/policies.mjs`
- `src/runner/dispatch/herdr-round.mjs`
- `test/runner/dispatch-worker-session.test.mjs`

## Verification, reuse and scope

- Reused the consolidated checker's `check_span`, `replay_chain`,
  `inspect_rows` and `patch_roundtrip`, and its existing composition replayer.
  Read-only history attributes `alreadyComposed`/bare-pin validation to
  `926000dbd`; the successor-source correction is `c58f2b230`.
- The unmodified checker `main()` was invoked before and after with
  `sys.argv = [check_shard_path, '--shard', '1']`. It normally writes a new
  `chain-check-<HEAD>.json`, outside this task's exact writable list. A narrowly
  matched `Path.write_text` output-sink wrapper captured only that report in
  memory. No validation, finding, exit status or checker source was changed.
  The literal CLI invocation is deferred because its report write is forbidden.
- Baseline exit: 1 (36 global unresolved). After repair exit: 1
  (`invalidShard: patch preimage: AGENTS.md` + 15 stale entries). No report file
  was created outside the scope.
- Separate data checks: exact 263-id coverage; original proof/id digests and
  row bindings; **963 evidence/successor spans** verified by the existing
  `check_span`; successor move-set identities/digests; consistent sibling
  patches, exact replacements and postimage hashes. AGENTS uses its declared
  strict-chain base; the other patches retain valid pin bases and also replay
  on the chain. These checks passed but do not replace official acceptance.
- Existing `inspect_rows`: **25/25 file patches, 50/50 forward/reverse
  applications**, exact restored chain bytes, no offsets or fuzz; 16 resolved
  markers, one unresolved f00183 marker representation gap. A separate exact
  old-hunk/split-comment normalization witness confirms f00183's actual retarget
  without marking the checker's finding resolved.
- The first exploratory data-check invocation stopped on the expected f00183
  marker failure. The subsequent diagnostic explicitly preserved and reported
  that failure; no green claim was manufactured.
- No shard-1 source file is under `docs/platform/`. Thus none of the lineage
  code-span rows or L13-21.5's candidate live-pointer files belongs to this
  shard. Candidate bytes quoted inside successor evidence are not editable
  source rows here. `packages/yaml-doc` mentions are excluded: no such shard-1
  source row, and they are package coordinates, not moved authority operands.
- L13-21.3's shard-3 history-convention parks are untouched. No pair accounting,
  other shard, chain, register, ledger or consumer file is edited.
- All workspace-analysis and replay Python invocations use `python3 -B`;
  all replay scratch is auto-cleaned
  `tempfile` directories under `/tmp/fgos-work/`. No git write, fgos CLI,
  native addon, product test, service start or prohibited audit script runs.
- Only `shard-1.json` and this file are changed in the workspace. Required
  acknowledgment/report/result files use the external assignment outbox.
  Markdown preview is deferred to Lead rather than creating another artifact
  or starting a service outside scope.
- Impact-analysis: **degraded/unqueried** (fgos CLI forbidden; no impact tool
  exposed). No product symbol or implementation is changed.

Checker SHA-256, unchanged:
`99eae741b0ce9343ca7f0b31de3d634960fab1551070815fb49ab9c04af81d95`.
Judgment JSON SHA-256:
`e71e00d8bd85e85bdab94a18ef49b50afddb9c8cee71d68ed49541356e5e0f2f`.
