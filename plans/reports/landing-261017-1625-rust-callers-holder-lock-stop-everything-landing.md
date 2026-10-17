# Rust callers on holder-lock: stop-everything landing

Date 2026-10-17, 16:13–16:25. The owner approved the landing ("em landing đi, không có ai đang làm").

- **Plan:** [plan.md](../261016-1306-fgctl-rust-callers-on-holder-lock/plan.md), phase 05 sections B and C.
- **Section A report:** `phase-lead-261017-1516-rust-callers-p05a-integration-and-full-suite.md`, now on main.

## Result
- **main:** `30c190691` fast-forwarded from `rust-callers/integration`, then merged with two docs-only origin commits as `09f824ea0`, pushed.
  - Merging main into integration conflicted in `docs/specs/distribution.md` rows 7 and 7b. The two sides changed different rows: main added doctor checks to row 7, the branch added the fence sentence to row 7b. Resolved by taking main's row 7 and the branch's row 7b; `registrations.test.mjs` 57/57.
  - After the merge, holder-lock, setup and rust-host tests on integration: 1094 run, 1089 pass, 1 fail (`skill-wrappers.test.mjs:755`, a gitignored generated wrapper absent in a worktree; it passes in the main checkout).
- **Release:** `sha256:79ead131ccab9751639751ac3cc0abd947fe05f88384be08a472cb52bb1c1e56`, built from main with `cargo build --release --workspace` and `scripts/build-rust-distribution.mjs` (705 files).
- **fgctl:** the new `fgctl` is installed at `~/.local/bin/fgctl` (`which -a` lists only that path). The previous binary is kept at `.fgos/runtime/tmp/landing-4.4a/fgctl.prev`.
- **Activation:** the new `fgctl upgrade --from <tree>` activated the release in mdview, mcp-skill-hub, then forgentX. The upgrade tail's `doctor --fix` in mdview placed the machine-wide install tombstone a few minutes before the other two workspaces were activated; nothing ran in them in between (every writer was stopped), so the landing rule "activate all three before any fence" was met in effect but not in order.

## Section B: old binaries against the new fences
On a scratch workspace with a scratch state home, fences placed by the integration code:

| Old binary | Result |
|---|---|
| installed `fgctl` (pre-landing), `init --from <release fixture>` | exit 1 after 4 ms: `stage failed: stage already in progress` (the install tombstone) |
| previous release host `af277e02…`, `metrics case open` | exit 1 after 5.03 s: `observe-lock-timeout: timed out after 5s acquiring lock at …/.fgos/observe/.lock` |

Neither call hung. Log: `.fgos/runtime/tmp/landing-4.4a/section-b.log`.

## Fences

| Workspace | Fences | How they were placed |
|---|---|---|
| mdview | 199 of 199 | by the `doctor --fix` at the end of `fgctl upgrade` |
| mcp-skill-hub | 15 of 15 | by the `doctor --fix` at the end of `fgctl upgrade` |
| forgentX | 2271 of 2271 | 15 placed through `fixLockFences(root, {excludePids})`, see below |

forgentX's 15 were the three new Rust-caller locks plus lock paths created after the earlier landing (three new unit-run `.recovery.lock` paths and dispatch-cwd locks of the lead worktrees). The stop scan listed the same kind of non-fgOS processes as the earlier landing: two `mdview serve`, two codex app-server daemons, the gitnexus and mdview MCP children of the Claude sessions, and the idle session `forgentx-5f` with its shell. None held an fgOS lock file (checked through `/proc/<pid>/fd`; the codex daemons hold only codex's own `.lock` files), so they were excluded instead of killed.

## Doctor through the shim, after fencing

| Check | forgentX | mdview | mcp-skill-hub |
|---|---|---|---|
| lock-kernel-semantics | pass | pass | pass |
| lock-borrow-vectors | pass | pass | pass |
| lock-holders | pass, 0 held | pass, 0 held | pass, 0 held |
| lock-fences | pass, 2271/2271 | pass, 199/199 | pass, 15/15 |
| state-root | pass | pass | pass |
| active-release-matches-checkout | pass, changed=0 | skipped (not a source checkout) | skipped (not a source checkout) |

The other failing checks were there before this landing and are not caused by it: `config-not-stale` (missing `lock` key, needs `fgos setup`), `executor-family-unique`, `model-policy-tier-coverage`, `provider-capacity-state`, `executor-profile-warnings`, tool and doc registry checks, `work-step-vocabulary` (tsk-5db), `root-drift`, `main-checkout-guard-warnings` (old September records), and codex trust for forgentX.

## Found during the landing
- **Leaked test holder:** pid 196630, a `node -e` process holding an `activation` lock on a deleted `/tmp/fgctl-lockreclaim-proj-*` fixture, parent 1, running 2 h 41 min, cwd the `rc-p03` lead worktree. It was stopped before the landing. A reclaim test in the fgctl suite leaves its holder child alive when it fails or is interrupted; worth a follow-up item.
- **Lead launch stall:** two lead panes received their prompt but never submitted it (`agent_prompt_stalled`); the launcher now presses Enter once on that error.

- **Two release pins for the same tree:** during the landing, another session pinned `sha256:227abc99…` in `.fgos/distribution.json` (`b319d4b1d`, "the release that carries the model, pool and account slice"), built from the same tree `09f824ea0` on another machine. This machine's `fgctl upgrade` wrote `79ead131…` into the same file. The committed pin `227abc99…` was kept; the local value is saved at `.fgos/runtime/tmp/landing-4.4a/distribution.json.local`. Both releases carry the same source, and no doctor check fails on the difference.

## Rollback
- **Previous release:** `sha256:af277e023d0112f06eb03525fe338adb1b7a3ab4523dc31e3540cb3d312f2597` in all three workspaces.
- **Steps (after fences):** stop every writer, revert the merge on main, copy `fgctl.prev` back to `~/.local/bin/fgctl`, activate the previous release in the three workspaces, then remove the tombstone directories listed by `fenceStatus` (activation and observe per workspace, install once under the state root).

## Next
The 4.3 repo-lock part may now continue: its P08 (the `fgctl` side) and P10 section A, then its own landing.

No component-boundary change.
