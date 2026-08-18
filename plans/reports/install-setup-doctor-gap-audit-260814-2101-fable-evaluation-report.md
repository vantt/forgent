# Install/Setup/Doctor Gap Audit — Fable Evaluation

**Date:** 2026-08-14
**Inputs:** three haiku inventory scans (01-backlog, 02-code, 03-history in the session scratchpad's `install-setup-audit/`), cross-checked against the live repo at `main`.
**Method:** every HIGH-risk claim below was verified by reading the current code/docs this session (file:line cited). Claims not re-verified are marked "unverified".

---

## A. Confirmed still-open gaps

The 44 "STILL OPEN" items split into three honest buckets: (A1) verified still-real against current code, (A2) open but not re-verified this session, (A3) stale — the code already contradicts the item's premise, close-check before working.

### A1. Verified still-real (spot-checked this session)

1. **tsk-2xj — `fgos doctor` ignores `--dir`, runs every check and `runFixes` on `process.cwd()`.** Verified: `bin/fgos.mjs:4858-4865` — `runFixes(process.cwd())` and `check(process.cwd())`; the parsed `dir` is used by the very next verb (`unlock`, :4876) but never here. `checkConfigNotStale` reads `sharedConfigFilePath(cwd)` raw (`src/setup/registrations.mjs:377`), so from a linked worktree every config-family check reports "run fgos setup" falsely (ADR0020: worktrees never carry `.fgos/`). **The item's own open question is now answered:** `doctor --fix` from a worktree *does* materialize `.fgos/` there — `fixGateBypassConfigured` calls `writeSharedConfig(cwd, …)` (`registrations.mjs:899-911`) and `writeSharedConfig` does `fs.mkdirSync(path.dirname(sharedPath), {recursive:true})` (`src/config/shared-config-file.mjs:87`). The second cost is real today, not latent. See C1 for the unfiled sibling (setup/uninstall have the same bug).

2. **tsk-37t — worker-slot ceiling cannot un-stick a repo past its ceiling; `fgos report` accepts a nonexistent id.** Both halves verified: `src/state/worker-slots.mjs:159-161` — `free = Math.max(0, ceiling - occupied)` then refuse at `free === 0`, and `excludeId` only removes one item (`:112`), so occupied 11 vs ceiling 8 still refuses even the reclaim path. And `addDecision` (`src/state/store.mjs:870-880`) validates `text`/`rationale` but never that the work item exists — a wrong id in `fgos report` writes a decision record `fgos show` can never retrieve. Matters more now that `fgos-coding-driving` calls `report` automatically at every stop.

3. **tsk-1u77 — install-packaging e2e's single-writer `.fgos/` snapshot assumption is unchanged.** The item's "test fails" premise was refuted (passes when quiescent, tsk-36i scan), but the flake mechanism is intact: `test/install-packaging.test.mjs:64` and `:138-139` still `snapshotDir(REPO_ROOT/.fgos)` before/after a multi-second npm subprocess window, so any concurrent session's legitimate `.fgos` write inside that window fails the test and blocks whatever approve/verify was running it. The suggested fix (scope the diff to paths the external process could touch) was never done.

4. **tsk-1lg — impact-analysis index staleness is structurally invisible to doctor.** The perishable half (reindex GitNexus) rots on contact; the durable half verified: `checkToolRegistryConfigured` (`src/setup/registrations.mjs:404-423`) returns `passed: true` on **all three** branches — inactive, full, *and degraded* (`:419-422` literally reports "degraded — … run fgos tool check" with `passed: true`). `fgos tool query` returns no freshness field. The AGENTS.md impact-analysis capability gate keys off exactly this signal. See C3 for the unfiled sharpening.

5. **tsk-2p6 — no automated check that a risk-heavy / Iron-Law-touching item reaching `delivered` has a `plan.md`.** Verified negatively: the full registered-check list in `docs/specs/distribution.md` row 7 (23 checks, current) contains nothing of the kind. Real precedent: tsk-4ax/tsk-55p landed with only `iron-law-evidence.md`.

6. **tsk-2lc — `wontfix` reachability: PARTIALLY fixed, item needs re-scoping before work.** Verified: `src/state/status-fsm.mjs:169` now has `awaiting-human -> wontfix` — the item update's sharpest complaint (7 items parked at awaiting-human uncloseable) is resolved. Only `blocked/todo/doing/awaiting-human -> wontfix` exist (`:156-169`); awaiting-approval/delivered/retrospective/cleanup/done still cannot reach it, and the FSM refusal message still never suggests a valid edge. Re-scope to the remaining half before working.

### A2. Open, not re-verified this session (genuine work, mostly outside the setup/doctor code itself)

- **tsk-1o8** — five delivered items stuck off main behind three blocked roots; each root needs an owner-level decision (Iron Law acknowledgment or a design pick on fgw/tsk-5d4). Not a code fix; a person must decide. The item's own three rounds of corrections are the most carefully evidenced text in the backlog — treat it as current.
- **tsk-4yv** — `finishWorktreeSetup` failure (e.g. npm ci flake) leaks the just-registered worktree; detached merge worktrees never reclaimed (`src/runner/worktree.mjs`). Unverified, plausible.
- **tsk-64o** — delivered event for tsk-5dk missing `mergedSha` despite two clean reproductions; asks for durable tracing at the two `resolveRefSha` call points. Investigation item, still open.
- **tsk-5nj** — `.fgos/state.json` is write-only (~86ms/mutate, double-serialize 3.66MB, written outside the lock, no tmp+rename). Evidence in tsk-36i's report; still open.
- **tsk-1m3, tsk-21f, tsk-3uw, tsk-26c, tsk-4xr, tsk-45f, tsk-49o, tsk-3hb, tsk-63jf, tsk-5tm-6, tsk-3gv, tsk-28x** — lifecycle/skill/adapter work items, open by design (not latent breakage). tsk-63jf is a two-line text fix (one cited constant name, one `proposed` in an FSM comment) — cheap, note it trips Iron Law on `status-fsm.mjs`.
- **Herdr cluster (tsk-1nih, tsk-4ab, tsk-3b0, tsk-3d5, tsk-5d4, tsk-1ytv, tsk-ldb)** — real cockpit issues (pane injection into a parked awaiting-human session is the sharpest, tsk-1nih point 1) but outside the install/setup subsystem; unverified here.
- **Web-dashboard plan chain (tsk-54j → tsk-48w/k4v/5jr/18to)** — planned features, not gaps. tsk-48w is the one that touches this subsystem: it must register the new config section into setup's config-merge + doctor's registry per the AGENTS.md gate (precedent `registrations.mjs` herdr-launcher-configured).
- **tsk-12m** (awaiting-human) — changelog automation, explicitly deferred; manual CHANGELOG + `changelog-unreleased-stale` doctor check exist. Leave parked.
- **tsk-r87** — events.lock fixed 2s budget vs measured 65-88ms per holder under 16-worker parallelism; tsk-36i re-measured and sharpened it. Open.

### A3. Stale — premise already refuted or fixed; close-check rather than work

- **tsk-11t, tsk-18g, tsk-2dq, tsk-5yz** — all carry `[BÁC BỎ]` refutations from the tsk-36i scan (tests pass at main / already patched). Candidates for wontfix; tsk-18g's collect-all-drift suggestion may survive as a rewrite.
- **tsk-3at** (awaiting-human) — refuted: tsk-2ce added snapshot/restore (`test/report/enduser-index.test.mjs:57-72`). Should be answered/closed.
- **tsk-1do — likely already fixed by tsk-56u.** Verified: `.githooks/pre-commit` now has an unconditional staged-`.fgos/`-deletion guard (`stagedFgosDeletions`, `.githooks/pre-commit:127`, invoked `:235`), which is exactly the commit-time guard tsk-1do asks for; AGENTS.md documents it. Confirm `git commit -a` coverage, then close.
- **tsk-3ra — premise contradicts ADR0020.** The item expects `.fgos/` to be *symlinked* into worktrees; ADR0020 explicitly rejected symlinking (comment at `src/runner/worktree.mjs:403`: "shared store if it were symlinked instead (rejected, ADR0020)") — worktrees deliberately have neither files nor symlink. The observed state it reports is the designed state. Close or rewrite.

---

## B. Contradictions and unsynced documentation

1. **The history inventory (file 03) is stale in four places — do NOT create items from its "Known Gaps" list without this correction:**
   - *"RUL11: doctor --fix does not exist yet"* — superseded. `docs/specs/distribution.md:232`: "RUL11. `fgos doctor --fix` exists and is real". tsk-1qm (done) did land its spec supersede.
   - *"Spec says 3 checks, code has 5"* — closed. Spec row 7 now enumerates 23 registered checks and states the update-in-same-change rule.
   - *tsk-5lk "implementation pending"* — shipped. Dead-line reporting is live inside `shell-integration-sourced` (dead-line block in `registrations.mjs`, "delete them by hand (fgos never edits your shell profile…)"), canonical main-checkout path resolution is live (`integrationScriptPath`, `registrations.mjs:229-240`), and setup tests sandbox HOME (`test/cli/fgos-setup.test.mjs:174-184`, `test/setup/helpers/setup-checks-harness.mjs:85-90`).
   - *tsk-4iv "stage clarify → exploring"* — shipped. `uninstall` verb exists (`bin/fgos.mjs:4807-4857`) with tests (`test/setup/uninstall-wiring.test.mjs`).
2. **tsk-4iv D1 vs shipped code:** D1 locked "remove installed package via *detected manager (npm/pnpm/yarn)*"; the shipped `--remove-package` hardcodes `execFileSync('npm', ['uninstall','-g','forgent'])` with a code comment scoping it to "npm global installs only, Linux/macOS only" (`bin/fgos.mjs`, uninstall case). The narrowing was a conscious SPIKE outcome (tsk-4iv-2) but D1's decision text was never amended — decision record and shipped scope now disagree. Behavioral consequence filed as C4.
3. **tsk-2lc's own updated text** claims wontfix is unreachable from awaiting-human — now false (`status-fsm.mjs:169`). The A3/A1 note above covers the re-scope.
4. **Code inventory (file 02) internal errors:** it says "Built-in fixes registered: none shown yet" while its own Part XI (and spec row 7b) list 5 registered fixes; and it lists 4 built-in checks where the registry carries 23. Trust the spec row 7/7b lists, not file 02's counts.

---

## C. NEW issues nobody has filed yet

1. **`fgos setup` and `fgos uninstall` have tsk-2xj's exact `--dir` bug — and setup's is worse, because setup writes unconditionally.** No open item covers either (tsk-2xj is explicitly doctor-only). Evidence: `bin/fgos.mjs:4705` `const repoRoot = process.cwd();` then `ensureSharedConfigDefaults(repoRoot)` (:4729), `runFixes(repoRoot)` (:4748, unconditional per tsk-5hi), `installGitHooks(repoRoot)` (:4740), `materializeSkillsIntoProject(PACKAGE_ROOT, repoRoot)` (:4755); `bin/fgos.mjs:4814` same for uninstall. Run `fgos setup` from a linked worktree and it **creates `<worktree>/.fgos/config.json`** (`writeSharedConfig` mkdirs recursively, `src/config/shared-config-file.mjs:87`) — the ADR0020 violation tsk-2xj only worried `doctor --fix` might cause, delivered through the verb whose whole pitch is "safe to run anytime". The tsk-56u pre-commit guard catches the *commit*, not the write. Any fix for tsk-2xj should widen to all three verbs, or this should be its own item dependent on tsk-2xj's shaping question (which checks/writes follow `--dir`).

2. **README's recommended install command points at a git tag that does not exist.** `README.md:17`: `npm install -g github:vantt/forgent#v0.1.0`; `git tag -l` returns only `pre-tsk-3ce`. Every first-time user following the *recommended* path gets an npm resolution failure; the "latest release tag" link they're told to check lists no semver tag either. tsk-jtb (done, retrospective) added the recommendation and the release-cut runbook (`docs/how-to/cut-a-fgos-release-tag.md`) and deliberately left tag-cutting manual — but no open item tracks actually cutting the first tag, so the README has been shipping a dead command since tsk-jtb landed. File 03 knew "no semver tags exist" (§4.5) but only as a blocker for tsk-2qc's cache design, never as this user-facing breakage.

3. **Doctor's "degraded" tool-registry posture can never fail a check, and no item asks to change that.** `registrations.mjs:419-422` returns `passed: true` for degraded (missing/never-checked tools). tsk-1lg *contains* this observation but its actionable ask is a one-off reindex; nothing filed asks for: (a) degraded → `passed: false` (or a warn tier), or (b) a freshness/staleness field on `fgos tool query` output. Until then the AGENTS.md capability gate's "Degraded" branch is prose no tool output can actually trigger a person to read.

4. **`uninstall --remove-package` silently "succeeds" for pnpm/yarn global installs.** It runs `npm uninstall -g forgent` unconditionally with no detection that the running copy was npm-installed; for a pnpm-installed copy (the exact audience STR88's install fix was for), npm removes nothing, exits 0, and the report claims removal. tsk-4iv-2 consciously scoped the SPIKE to npm, but no follow-up item exists for manager detection or an honest refusal on non-npm installs.

5. **The check registry is split-brained about worktree resolution — half already answers tsk-2xj's open question.** Ten-plus checks self-resolve via `resolveMainCheckout(cwd)` (`registrations.mjs:405,496,558,607,661,711,730,773,848,1342,1435,1462`) and are therefore worktree-correct even today; the config-family checks and fixes read/write `sharedConfigFilePath(cwd)` raw (`:377`, `:911`). tsk-2xj frames "which checks should follow --dir" as an open design question — the registry itself already answered it one way for the majority. Fold this evidence into tsk-2xj's shaping (probably no separate item; without it the fix risks re-litigating a settled pattern).

6. **`fgos rollup` reads only `parent`, never a milestone's `targets`** — so milestone progress (the distribution vision's own §6 tracking device) must be assembled by hand via per-item `fgos show`. Stated as a known limitation in distribution-vision.md §6 (quoted in file 02 Part XII); never filed as an item. Unverified against code this session. LOW.

---

## D. Risk ranking (A + C only)

### HIGH — breaks or silently corrupts state for a real user right now
| # | Finding | Why HIGH |
|---|---------|----------|
| C2 | README recommends installing nonexistent tag `#v0.1.0` | The documented, *recommended* install path fails for every new external user. First-contact breakage; fix is cutting one tag + nothing else. |
| C1 | `fgos setup`/`uninstall` ignore `--dir`, setup materializes `.fgos/` inside a linked worktree | Unconditional writes to the wrong tree; ADR0020 violation created by the "safe" verb; only the commit-time guard stands between it and the shared event log. |
| tsk-2xj | `fgos doctor` ignores `--dir`: false "run fgos setup" alarms from any worktree; `--fix` writes `.fgos/` into the worktree (now confirmed real, not latent) | The diagnostic itself lies from the most common session location (worktrees), and its repair path causes the very state it should detect. |

### MEDIUM — works but wrong-diagnosis / wedge / silent loss under real conditions
| # | Finding | Why MEDIUM |
|---|---------|----------|
| tsk-37t | Ceiling-wedged repo unrecoverable except hand-editing config; `fgos report` silently swallows decision records for nonexistent ids | Wedge needs a drifted-over-ceiling repo; silent report loss now automated in the driver loop. |
| C4 | `uninstall --remove-package` false-success on pnpm/yarn installs | Wrong report, package left installed; scoped audience but exactly the pnpm audience fgOS courts. |
| C3 + tsk-1lg | Degraded tool-registry posture invisible in doctor; no freshness signal | Already produced one wrong blast-radius answer that survived review (tsk-46a incident). |
| tsk-1u77 | install-packaging e2e flakes under ambient `.fgos` concurrency | Blocks approve/verify pipelines intermittently on this very machine's 100+-worktree reality. |
| tsk-2p6 | No plan.md-presence check for heavy-risk deliveries | Governance hole; already happened twice (tsk-4ax/tsk-55p). |
| tsk-1o8 | Five delivered items stuck off main pending owner decisions | Real shipped work invisible on trunk; risk grows with drift, but needs a human, not code. |
| tsk-r87, tsk-5nj, tsk-4yv, tsk-64o | Lock budget vs measured cost; write-only non-atomic state.json; worktree leak; missing mergedSha | Each a real but conditional degradation; none corrupts on the happy path today. |
| C5 | Worktree-resolution split across the check registry | Amplifies tsk-2xj; near-free to fix inside it. |

### LOW — cosmetic, doc-only, or stale-item hygiene
| # | Finding |
|---|---------|
| A3 batch | Close-check tsk-11t, tsk-18g, tsk-2dq, tsk-5yz, tsk-3at (refuted), tsk-1do (fixed by tsk-56u), tsk-3ra (premise vs ADR0020); re-scope tsk-2lc to its surviving half. Backlog hygiene: 8 of 44 "open" items are dead weight steering future audits wrong. |
| tsk-63jf | Two stale text references (one trips Iron Law via `status-fsm.mjs` comment). |
| C6 | `fgos rollup` ignores milestone `targets`. |
| tsk-12m | Changelog automation — deliberately parked; leave parked. |
| B items | Doc/decision syncs: amend tsk-4iv D1 record; treat file 02/03 counts as stale when drafting items. |

---

## Unresolved questions

1. tsk-2xj's shaping question stands — which checks/fixes should follow `--dir` vs `process.cwd()` — but C5's evidence (majority already use `resolveMainCheckout`) suggests the answer is mostly settled by precedent.
2. Whether C1 should be folded into tsk-2xj (one item, three verbs) or filed separately with a dependency — footprints overlap heavily (`bin/fgos.mjs` setup/doctor/uninstall cases, all Iron-Law-gated).
3. C2's fix is a human act (cut tag v0.1.0 per the existing runbook) — whether an fgOS item should also add a doctor/CI check that the README's pinned tag exists is a product call.
