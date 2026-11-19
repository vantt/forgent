# Facts for phase 1: what existed, what was measured, what was settled

Taken at base `40949614f077844005a986ca1f0f75c0c5e8f508` (origin/main, the base of this phase), 2026-11-19.
Every statement about current code names a file and line that was read at that commit.

## 1. Step zero: the base and the cited facts

- `plan.md` frontmatter `base` is `f3c32fb891d0237a4c5392b307a499ce8380a95c`, 33 commits behind this phase's
  base. **The lead should refresh `base` in `plan.md`** (it is outside this phase's write scope).
- Of every file the plan cites (the path-rule copies, the graph copies, `src/native/door.mjs`, the addon
  sources, the parity and native-load tests, `case-admission.mjs`, `Cargo.toml`, `ports.v1.json`,
  `slice-kinds.yaml`, `plan-contract.md`, `.githooks/pre-commit`), only `docs/architecture-manifest.json`
  changed between the two commits (a new `.fgos` door entry and `src/state/fgos-file-registry.mjs` moved to
  `src/util/`). No cited fact moved in substance. Small line corrections: the `*` and backtick strip in
  `packages/supervision/rust/src/portfolio.rs` is line 318 (plan says 317) and `read_phase_table` is line 343
  (342); `activeOverlaps` in `scripts/plan-contract-check.mjs` spans lines 149-156; `footprintOverlapAmong`
  is lines 599-623 (its `continue` for an empty footprint is line 603); the `hot-lock` door entry in the
  architecture manifest is at line 267, not 268.
- Plan check re-run through `reports/run-plan-check.mjs` (section 7): `--plan` is `ok` for this plan and for
  `261119-0528-resource-check-door-and-adapters`; `--all` has one failing plan of another lane
  (`261118-1117-external-ui-integration-multica`) and **no active-plan overlap line**, so the gate of decision
  30 holds. Overlap measurement of this plan against every `ready` or `running` plan by the script's own
  rule: none. Full output: `plan-check-verdicts-old-script.txt`.
- `owner-question-store` is still `ready` at this base (phase 8 of that plan is done); it blocks the door
  plan, not this one.

## 2. Prior art: what existed, and why it moved

Searched with `git log -S<symbol>` over `src scripts packages apps core test bin`, and by hand over `docs`.
A first run over the whole tree also matched hundreds of `.fgos` state-log and retrospective commits that only
quote the names; those are noise and are not listed.

| Symbol | First in code | Later changes | What it is and what happened to it |
|---|---|---|---|
| `footprintOverlapAmong` | `5ec5bcccd` 2026-07-29, merge-readiness ranking (`graph-harness`) | `0f4e861f4` 2026-08-02 decompose gate on footprint overlap; `tsk-2jn` normalised the membership check (`docs/history/tsk-2jn-footprint-normalize-overlap`); `a28daefe5` 2026-08-14 honours a declared `deps` edge in the gate | Equal-path conflicts among Work footprints; still present, never replaced. Its wrapper `footprintOverlap(view)` was the "D4-revised" extraction |
| `computeSchedule`, `detectCycles` | `8266e5910` 2026-08-05, tsk-3c7 | `cb91f6326` 2026-08-06 widened to the unified graph (tsk-3u2); `e59cf6503` 2026-08-07 scoped to a candidate set (tsk-ik3) | Wave packing over the ready frontier and Tarjan component sets; still present. Nothing was removed |
| `pathsOverlap` | `6527596eb` 2026-10-01, planning P2 (Unit in phase files); the name is first documented in `docs/distillery/sources/beehive.md`, whence the idea was ported | none | Regex-glob overlap used by plan-lint only |
| `globsMeet` | `3130002d4` 2026-11-03, proposal classify | `8c915a8b2` 2026-11-03; `df7b73490` 2026-11-08 "one glob engine" merged two glob walkers inside `write-scope.mjs` | Segment-wise glob intersection for propose and classify. The 2026-11-08 change is a precedent: an earlier attempt to put one engine behind several callers, kept inside the JS file |
| `fn overlaps` | `0074f94ae` 2026-10-19, dormant scoped commit and land guards (`fgos-write-scope`) | `ab8ebdfd5` 2026-11-17 plan-contract check (JS, character cut); `cbfd2d83a` 2026-11-18 supervisor reader (Rust, character cut) | The two newest copies were written beside an existing, segment-cut, canonicalising one. `apps/fgos/src/wiring/doctor/git.rs:236` has an unrelated `overlaps` over ref prefixes; it is not a copy |
| `writeScopesOverlap` | `5b2b91044` 2026-10-19, case model with admission | none | Scope-level overlap of the JS port, used by `src/workflow/case-admission.mjs:171` |

Removed mechanisms found by searching deleted files (`git log --diff-filter=D`):
`src/verbs/coordination/dag-scheduler.mjs`, a dynamic ready-frontier DAG scheduler with a concurrency cap, was
deleted with the L4 coordination engine in `2180b4e72` 2026-10-02, on purpose (the engine was retired); its
proposal `agent-coordination/proposals/dag-request-scheduler.md` went in `97dd62aa7` 2026-11-03 with the
legacy docs roots. The new `graph` package is not that scheduler: it computes facts, never admits or runs
anything, so nothing is resurrected. The git spec's RUL84 (written `fa8c7611d` 2026-10-17) asked for the JS
matcher to become "a thin facade in the same switch"; the switch was never made, so
`src/runner/dispatch/write-scope.mjs` is still a second implementation pinned by the parity test.
`docs/platform/git/spec.md:723` still calls it "Thin shared Rust matcher facade, no copied implementation",
which is not what the file is; **phase 2 owns that spec and should correct the row**.

Search of `test/` as well as `src`: the cases live in `test/state/graph-metrics.test.mjs` (detectCycles at 657,
computeSchedule at 734), `test/report/capability-plan-lint.test.mjs:414`, `test/runner/write-scope-globs.test.mjs`,
`test/workflow/propose-validate.test.mjs`, `test/git/write-scope-parity.test.mjs` and
`test/runner/write-scope.test.mjs`.

Reused by the new packages: `fgos-write-scope` as the path authority and its segment-cut meaning;
`computeSchedule` and `detectCycles` behaviour as the oracle for `graph`; the shared-contract-file pattern of
`packages/supervision/contracts/plan-vocabulary.v1.json`. Missing: one canonical cycle path per component, a
catalog of rule checks, and a recording of the old plan-check verdicts (section 7).

## 3. The meanings of "do these two paths collide", run on one set of pairs

Run on this tree with the real functions (`footprintOverlapAmong` with two single-entry candidates,
`overlaps` of `plan-contract-check`, `writeScopesOverlap`, `pathsOverlap`, `globsMeet`). The supervisor's
`overlaps` is the same meaning as the plan-check one (it cuts at the first `*` too), and the Rust
`fgos_write_scope::overlaps` is the same meaning as `writeScopesOverlap`.

| a | b | equal-only (`footprintOverlapAmong`) | character cut (`plan-contract-check` `overlaps`) | segment cut (`writeScopesOverlap`) | regex glob (`pathsOverlap`) | `globsMeet` |
|---|---|---|---|---|---|---|
| `src` | `src/a.mjs` | false | true | true | true | false |
| `src/fo*` | `src/foo.mjs` | false | false | true | true | true |
| `./src` | `src/a.mjs` | false | false | true | false | false |
| `src/a*` | `src/*b` | false | true | true | false | true |
| `src/*/x` | `src/y/*` | false | true | true | false | true |
| `src/a/**` | `src/b/**` | false | false | false | false | false |
| `src/a*` | `src/b*` | false | false | true | false | false |
| `docs` | `docs-old/x` | false | false | false | false | false |
| `a\b` | `a/b` | true | true | refuse | false | false |
| `src/*.mjs` | `src/sub/foo.mjs` | false | true | true | false | false |
| `**` | `src/a` | false | true | true | true | true |
| `src/x` | `SRC/x` | false | false | false | false | false |
| `ab**` | `ab/c` | false | true | refuse | true | false |
| `.` | `src` | false | false | refuse | false | false |
| `src/**/x` | `src/y/z/x` | false | true | true | true | true |
| `src/a*/q` | `src/*b/q` | false | true | true | false | true |

How to read it. Unsound means "disjoint" is answered for two entries that can name one file:

- `src/fo*` against `src/foo.mjs`: the character cut keeps `src/fo`, which does not contain `src/foo.mjs`; equal-only never matches.
- `./src` against `src/a.mjs`: neither the character cut nor the regex canonicalises.
- `src/a*` against `src/*b` (`src/ab` matches both): the regex reading answers `false`.
- `src` against `src/a.mjs`: equal-only answers `false`.
- `a\b`: the segment cut refuses the entry (a backslash is not legal); the others read it as a path or as a string.
- `globsMeet` answers a different question (plain entries as exact paths, not subtrees), which is why `src` against `src/a.mjs` is `false` there.

The segment cut is the only reading that is sound and conservative; `docs` against `docs-old/x` is `false` in
all of them (whole segments). The readers of both phase tables also delete every `*` and every backtick from a
footprint cell before the rule runs (`portfolio.rs:318`, `scripts/plan-contract-check.mjs:42`), so
`apps/fgos/tests/questions_*.rs` reaches the rule as `apps/fgos/tests/questions_.rs`; the Rust reader also turns
a non-integer wave into `None`, keeps a duplicate id and drops a non-string frontmatter entry, where the JS
check refuses each. Those readers are fixed in the door plan (decision 31).

## 4. Measured maxima and the limits they fixed

Measured at the base commit by scripts kept in the scratchpad (`findPhaseTable` of the plan-contract check
over every `plans/*/plan.md`; file sizes with `stat`).

| What | Measured | Where |
|---|---|---|
| Plans | 128 directories with a `plan.md`; 15 under the contract; 14 have a phase table | `plans/` |
| Largest frontmatter `footprint` list | 95 entries | `261117-1856-secretary-session-spine` |
| Longest frontmatter footprint entry | 74 bytes | `261118-1159-owner-question-store` |
| Largest phase table | 27 rows | `261118-1341-s6a-execution-tier-rust` |
| Most entries in one footprint cell | 35 | `261118-1341-s6a-execution-tier-rust` |
| Longest entry read from a table cell | 95 bytes | `261118-2048-foundation-reverse-deps-and-fgos-root-door` |
| Longest table cell | 1181 bytes | `261117-1856-secretary-session-spine` |
| Longest phase id | 3 characters | `261117-1856-secretary-session-spine` |
| Longest `dependsOn` cell | 96 bytes | `261118-1341-s6a-execution-tier-rust` |
| Largest `plan.md` | 128519 bytes | `261021-1118-harden-low-layers-bottom-up` |
| Largest phase file | 87072 bytes | `plans/reports/phase-lead-261021-1129-test-governance-p2-ported-areas.md` |
| Largest file in a plan directory | 1345165 bytes | `261017-1313-fgos-platform-program-board/log.md`; the door never reads it (the board plan tells readers never to read it whole) |
| Open Work items | 13 (plan fact) | not re-measurable here |
| Folded Work view | not measured | this worktree has no activation and the Work state is not in a ref this checkout reads; the nearest proxy is 270 table lines in `docs/backlog.md`. The node limit is a refusal by name, so a wrong guess is loud, never silent (decision 7) |

Values fixed in the contracts (`graph.v1.json`, `resource-referee.v1.json`) and the write-scope spec:

| Limit | Value | Why |
|---|---|---|
| Nodes | 20000 | about 700 times the largest plan table; Work walks every item regardless of status |
| Edges | 200000 | ten per node at the node limit |
| Exclusion pairs, emitted pairs | 100000 | the same number on both sides, because pairs feed exclusions |
| Pair comparisons | 50000000 | the 20000-node ceiling would need 200000000 entry-pair tests at one entry each, so a full run of the largest allowed set is cut short by design; the value is a judgement, not a timing, and the one timing recorded at the door plan's landing (decision 19) can move it |
| Claims per unit, entries per item | 512 | five times the largest list measured (95) |
| Entry or claim `ref` length | 1024 bytes | ten times the longest entry (95) |
| Id length | 256 bytes | phase ids are at most 3 characters |
| Rules | 200 | the catalog has seven checks |
| Input bytes, per file | 4 MiB | 32 times the largest `plan.md` read (128519 bytes) |

No existing plan today exceeds any limit, so no existing plan is refused by the new bounds.

## 5. Names (decision 26) re-confirmed against the verb tables

- Packages: `write-scope`, `graph`, `resource-referee`; crates `fgos-write-scope` (exists, unchanged name),
  `fgos-graph`, `fgos-resource-referee`. `Cargo.lock` has `fgos-write-scope` only; no `packages/graph`,
  `packages/resource-referee` or `packages/write-scope` directory exists yet.
- Door: `fgos resource-check`. The route table `packages/host-runtime/contracts/command-routes.json` has no
  `resource-check` key; the keys that contain `check`, `graph`, `plan` or `referee` are `gate-check`, `graph`
  (line 622), `main-checkout-reset`, `plan`, `plan-lint` (line 1045) and `recheck-blocked`. `resource-check`
  appears nowhere in `src docs/platform core domains packages apps bin test scripts` outside the two plans.
- Collisions the specs address: `referee` is a seat name (`test/runner/execution/patterns/catalog.test.mjs:676,692,2135`,
  role `judge`); `graph` is a Work verb (`src/cli/command-registry.mjs:1103`,
  `packages/host-runtime/contracts/command-routes.json:622`); `fgos plan` is a Work verb.

## 6. Choices that go to the owner, and wording to fix elsewhere

Ideas and open choices, kept out of the specs' scope per the "better, not bigger" rule; each costs nothing to cut.

1. **Claim-space registry.** The contract lists `path`, `ref` and `port`. Decision 13 requires at least one equality space ("any other space compared by equality"); `ref` and `port` have no caller in these plans. Cutting the registry to `path` alone is a one-line contract change. Problem solved if kept: two parallel units contending for a port or a ref. Benefit: the registry shape is exercised.
2. **Edge kind `related`** (non-ordering, groups only) has no producer. It exists so the registry has a kind that does not order, which the plan asks the registry to record. Removing it leaves a registry in which every kind orders.
3. **Phase 4 wording.** `phase-04-graph-crate.md` step 3 says the default priority is "input order, ties by id". No two nodes tie (each has one input position); the spec says "input order". The lead should reword that line.
4. **Git spec row.** `docs/platform/git/spec.md:723` mislabels the JS port (section 2). Phase 2 owns that file.
5. **Equality-space collisions** are four lines of grouping in the door, not a package function, because only the door calls them; a second caller would be the moment to share it.

## 7. The plan-check runner and the snapshot

- `reports/run-plan-check.mjs`: run from the repository root, `node plans/<this plan>/reports/run-plan-check.mjs --plan <dir>` or `--all`. It first uses `FGOS_ACTIVE_MANIFEST_PATH` or the activated release's manifest; when the addon does not load that way it calls `ensureAddonForScript()` (one `cargo build -p fgos-node-addon` plus a staged manifest under the ignored `.fgos/runtime/git-addon`), then runs `scripts/plan-contract-check.mjs` unchanged, and exits 3 without a verdict if any result carries `git-addon-unavailable`. In this worktree the activated release's payload is not this checkout's, so the second path ran; the build took about twelve seconds cold.
- `reports/plan-check-verdicts-old-script.txt`: the output of `--all` at this base.
- `reports/phase-tables-snapshot.md`: the status, footprint count and verbatim phase table of each of the 15 plans under the contract, with the old script's verdict per plan. All but one are `ok`; the exception is the other lane's `261118-1117-external-ui-integration-multica`, which lacks its sections and table. The door plan records its own baseline of the old verdicts with the pre-swap script at its own base (decision 20); this snapshot is the table input to compare against and is not a gate.
