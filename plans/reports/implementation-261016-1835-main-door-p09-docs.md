# Main door P09 docs: holder-lock spec, runner/work-state/boundary/reading-map text, changelog

## Files changed

| File | Change |
|---|---|
| `docs/platform/holder-lock/spec.md` | Header status and section 1, 2, 6 text brought in line; new sections 14 (main checkout one door, borrowing through fd + hook, merge slot), 15 (hot mutex `state` / `porting-events`: fast path, reclaim under kernel lock, `stateTx`, exec guard, reentry throws at once), 16 (`worktree-admin`), 17 (`fgos lock fence`), 18 (cutover fences of the four main-door rows); old sections 14-16 renumbered 19-21; two history entries; related-files rows. 4.2 content untouched except the three "next track" pointers. |
| `docs/specs/runner.md` | STR65 `main-checkout-lock.mjs` bullet replaced by `repo-locks.mjs`; `.githooks/pre-commit` bullet: holder-pid check replaced by the three-condition borrower check. |
| `docs/specs/work-state.md` | `events.lock` text (entry `repair`, RUL10 notes 1 and 2, RUL58, fork test line, `repair` known-limit line, `store.mjs` and `events.mjs` file entries) now describes the one hot mutex `state`. |
| `docs/platform/component-boundary.md` | Holder-lock row: owns main checkout / merge slot / `worktree-admin` / `fgos lock fence`; the state store owns the hot mutex, temporary until the store moves to Rust. |
| `docs/specs/reading-map.md` | New rows `src/runner/repo-locks.mjs`, `src/state/hot-lock.mjs`; `src/state/` row and holder-lock row updated. |
| `CHANGELOG.md` | Three lines under `[Unreleased] / Changed`. |
| `docs/io-contract.md` | Not touched: no mention of `FGOS_MAIN_LOCK_HOLDER_PID`, `main-checkout`, `events.lock` or `claims.lock`. |

## Claims replaced (old -> new)

| Old | New |
|---|---|
| Main checkout lock: `wx` create + reclaim of a dead pid, `ttlMs` per record, `DEFAULT_TTL_MS` / `HOOK_TTL_MS` as lock windows | Kernel lock `main-checkout` (rank 50); no TTL, no pid decision |
| Self-recognition (same identity = refresh), `allowSelfRecognition: false` | None; two descriptions in one process exclude each other, the handle is passed explicitly |
| `AMBIGUOUS` state, `protocol.json` marker, `unsupported-protocol`, `forceReclaimAmbiguousLock` | None; the kernel answers `held` or `free`; version change is a tombstone fence |
| `FGOS_MAIN_LOCK_HOLDER_PID` in the hook | `FGOS_LOCK_FD=main-checkout:3` + three-condition borrower check |
| `fgos unlock` clearing a lock | `fgos lock fence <name>` stops a live holder; nothing takes a lock from a live holder |
| `events.lock` and `claims.lock` as separate locks, `.fgos/events.lock` 2 s / 10 ms | One hot mutex `state`, record `<fgosDir>/locks/state.hot`, 5 s wait, reclaim only under `state.reclaim.lock` |
| Hot-lock call-site order and exec guard rolled out as trace -> warn -> throw | Throw at once (owner decision 2026-10-16) |
| Holder-lock spec: "main checkout and hot state belong to the next track" | Specified in sections 14-18 |

## Open points

- The plan directory `plans/261016-1306-main-checkout-single-door-hot-lock/` (plan.md, phase-09 file) does not exist in this worktree and the main checkout path was outside my read permission, so I could not read Lead decisions D1-D8, the phase's Docs/CHANGELOG lists, or the exact doctor check names. The history entry lists the decisions that the committed contracts and the P00 report prove (hot record path, reclaim lock, `fgosDir` of `state`, `<ref>` kept, borrow env, fence) without D-numbers, and links the plan path. Lead should compare the history entry and the three CHANGELOG lines with the phase file and add D-numbers or lines that are missing.
- The `hot-lock-timeout` -> category `lock-timeout` mapping in work-state RUL10 is my reading of the contract (error list names `hot-lock-timeout`, v1 category was `lock-timeout`); confirm when the code lands.
- Section 16 states that every `git worktree add|remove|prune|move` call of the runner runs under `worktree-admin`; the contract and registry only fix the lock, the wrapped call list comes from the P00 call-site table (`git worktree add` rows). Confirm the list of verbs with the implementing phase.
- The doctor check for the new rows and `fgos lock fence` code are later phases; the spec describes the target. `lock-fences` in section 13 is not extended in text beyond the section 18 table.
- `bash` and `grep` were denied in this session; work-state.md and runner.md were scanned by reading through subagents (line numbers only, then I read each line). runner.md also edited: the "Khóa hoạt động cây chính" section (Blocked when / Side effects), RUL49, RUL50, catch-up line (`main-checkout.lock` -> khóa `main-checkout`).
- Left on purpose in runner.md: beacon identity text (line ~1201, the beacon is not a lock), ADR history blocks (~1815-1864, ~2017-2037, ~3036: dated decision records), line ~1244 (`mergeRunnerItem` "renew/check lock ownership", reason `lock-lost-mid-merge`): the reason names stay until the merge code phase decides whether a kernel lock can still be "lost"; line 73 / RUL86 / RUL96 / RUL101 belong to the cold-lock track.

Status: DONE_WITH_CONCERNS
Summary: docs, changelog and report written for the main-door docs part; plan.md and the phase file were unreadable, so D1-D8 and the phase's exact lists need a Lead cross-check.
Context refs:
- (none)
Expected outputs:
- (none)
