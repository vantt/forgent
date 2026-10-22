# OPC council brief (shared by every seat)

Lead: session `forgent-35`, 2026-10-22 13:00 (Asia/Saigon). Base: `origin/main` `7a6f366ed`, read in the linked worktree `/home/vantt/projects/forgent-worktrees/opc-design` (branch `opc/design-council`). Every path below is relative to that worktree; cite `file:line` there. Reports in English.

The council designs **operation-scoped containment**: one containment domain for a whole typed Git operation (Land, ScopedCommit, Sync, SafeRestore, Recovery, Publication, worktree add) instead of one `bwrap` sandbox per `git` child. **Design only.** No product code until the owner approves (RUL104: a new mechanism).

## Owner requirements (do not reopen)

- 2026-10-20: "cần thiết kế kỹ và đặc biệt hexagon vì biết đâu trong tương lai chúng ta có thể đổi sandbox". The sandbox technology sits behind a port; a driver must be replaceable.
- Board scope: **extend the existing Process containment port**, no parallel mechanism (L10, design principle 1). One conformance suite every driver must pass (design principle 8: one owning proof per behaviour, lowest layer).
- E1 must stay held, E3 within the owner's budgets (`plans/261018-0914-git-component-fgos-git/e3-budgets.md`).
- RUL104 applies to everything not in the mandate: anything extra goes in a "proposed additions" section with problem, evidence, benefit.

## Read first

1. `plans/reports/design-261020-1035-operation-scoped-containment.md`: the preliminary design, its invariants I1–I11 (§3), shared set (§4), port options P1–P3 (§6), Linux options L-A..L-F (§7), the six questions (§11), and "Input from HARDEN T0".
2. `docs/platform/process/spec.md` §10 (containment port), §8 history; `packages/process/contracts/containment.port.v1.json`.
3. `docs/platform/git/spec.md` §15 E4 (line ~740: watched borrow, `linux-pgroup` rule), §6 handover (line ~311), §10 durability; `docs/platform/holder-lock/spec.md` §5, §8 (borrowed path, drain/reach).
4. Code: `packages/process/rust/src/containment/{mod,linux,pgroup,macos,windows}.rs`; `packages/git/rust/src/driver.rs` (`select` at :282, borrowed branch :1121-1164, contained branch :1165-1245 incl. the 2 ms `try_wait` poll loop); `packages/holder-lock/rust/src/port.rs` (`run_borrowed_io`); run-supervisor gate (`docs/platform/run-supervisor/spec.md`, `packages/run-supervisor/rust/src/route.rs`) as prior art for a long-lived pid 1.
5. Evidence:
   - `plans/reports/gate-261020-0653-git-p06b-typed-perf-e3.md` (10.8 ms contained vs 3.1 ms plain vs 3.7 ms borrowed; Land ~65 contained children ≈ 0.5 s, ScopedCommit 8);
   - `plans/reports/debug-261022-0012-git-e3-push-variance.md` (push ≈ 16 children, ≈ 4 ms bwrap each; remaining variance is NVMe fsync);
   - `plans/261021-1118-harden-low-layers-bottom-up/plan.md` ledger rows R2 (worktree add = 218 bwrap + 249 git execs ≈ 0.5 s vs ≈ 20 ms), R3 (one unremountable host mount makes every `bwrap --dev-bind / /` fail), R5 (seat launch ≈ 1.2 s, ≈ 15 contained git), H6 (bwrap probe per process ≈ 2 ms);
   - `plans/reports/verification-261022-0005-git-e3-clean-rerun.md` (E3), `plans/reports/verification-261021-2336-git-e1-publication-and-scoped-commit.md` (E1);
   - `plans/reports/council-261021-1507-harden-t0-arbitration.md` §4 D3, `plans/reports/council-261022-0245-harden-t1-arbitration.md` (RT-M11 / R3).

## Settled by neighbours (align, do not override)

- **HARDEN T1 phase 4 (R3/RT-M11)** edits `containment/linux.rs` `spawn_in`/`end_failed_spawn` only: when bwrap reports no child pid, one diagnostic rerun of the same argv with `/bin/true` captures bwrap's stderr so the error names the refused mount. No port operation or contract shape changes. If OPC names the error (e.g. `containment-mount-refused`), T1 uses OPC's name.
- **HARDEN T2** will design R2 (worktree add) around OPC's port; it does not touch `driver.rs`'s contained branch before OPC is approved.
- HARDEN T0 added no probe cache: an unprobed driver breaks hosts without user namespaces.
- Borrowed / hook-bearing children (holder-lock `run_borrowed`) are outside any containment domain today; the watched-borrow rule of Git §15 E4 stands.

## Open questions the council answers

The six of design §11 (Q1 Linux mechanism, Q2 shared set, Q3 port shape, Q4 config key, Q5 host death, Q6 timing/target), plus:

- **Q7 R3.** Per-operation answer when bwrap refuses: named error (which name, where it surfaces: Git refusal, doctor row), fallback to `linux-pgroup` for that operation (a guarantee downgrade), or both? Align with T1 phase 4.
- **Q8 Do read-only children need a pid namespace at all?** `Inspect` runs hooks-off with `--no-optional-locks`. What does containment buy for them (escapees from filters? `status` clean filters?) and is that worth a domain? This is H6's open question.
- **Q9 Callers beyond typed operations.** Worktree add (R2), seat launch (R5), per-CLI `select` probe (H6): does the same capability fix them, and what is the operation boundary for a CLI call that is not a typed operation?
- **Q10 Cheap wins inside today's shape** (e.g. the 2 ms poll loop in `driver.rs`, bwrap flags). These are "better, not bigger" and may be worth doing regardless of the capability.

## What every seat returns

Write your report to the path your seat prompt names (inside the worktree). Put `git -C /home/vantt/projects/forgent-worktrees/opc-design rev-parse --short HEAD` at the top. Sections, in order:

1. **Position**: your answer to Q1–Q10 that your seat has a view on, each one line + evidence (`file:line`, measurement, or spec ref). "No view" is allowed.
2. **Findings**: severity (Critical/High/Medium/Low), claim, `file:line` evidence, consequence. A finding without evidence is not a finding.
3. **Recommended shape**: the port shape, drivers, and the deletion list (L10) as your seat would have it.
4. **Proposed additions** (RUL104): anything beyond the mandate, each with problem, evidence, benefit.
5. **What would change your position.**
6. Status block:

```text
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
Summary: one or two sentences
```

## Constraints

- Read-only: edit no source, test, spec or config file; no git mutation. Write only your own report.
- The repo's bash hook blocks commands containing the words "build", "target" or ".git" (even in paths): put such commands in a script file under `.fgos/runtime/tmp/` of the worktree.
- Never measure on main, never leave a host-visible mount (that is R3: it breaks every session's bwrap); any mount experiment runs under `unshare --mount --propagation private`. Timing measurements belong to the speed seat only, inside the lead's announced quiet window.
- `CARGO_TARGET_DIR` on ext4 (`~/.cache/...`), never `/tmp`.
- Timezone Asia/Saigon. No plan IDs or finding codes in any proposed code comment or commit text.
