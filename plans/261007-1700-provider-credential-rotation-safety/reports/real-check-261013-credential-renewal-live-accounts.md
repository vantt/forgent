# Real check: credential renewal on live accounts

Run by the Lead (not the builder) on 2026-10-13 ~00:16-00:25 +07, against branch `feat/provider-credential-rotation-safety` @ `673a6ff8f`. Fingerprints are the first 10 hex of sha256; no value was printed. `refreshAhead` was called from a small script in the session scratch directory with a temporary `runtimeDir`, so the shared `~/.fgos/runtime/provider-capacity` was not touched.

## omp, xai account `vantt`

| Step | access | refresh | expires in | Result |
|---|---|---|---|---|
| Before | `64de81405e` | `eaec1a639a` | 318 min | |
| Two `refreshAhead` calls at once, `thresholdMs` 24 h | `63e7c5e57a` | `0acf9e5675` | 355 min | both `renewed/applied` |
| Plain `omp -p` from the real profile | unchanged | unchanged | 355 min | exit 0, answered `OK` |
| Two `refreshAhead` calls at once, default threshold | unchanged | unchanged | | both `fresh/outside-window` |

With a 24 h threshold the source stays inside the window after the first renewal, so the second caller renewed again. It did that **after** the first one had released the lock, using the pair the first had applied: if the calls had overlapped or the apply had failed, the second would have redeemed a spent refresh token and been refused. No scratch or pending directory was left behind.

## Codex, openai account `tetcu72`

| Step | access | refresh | JWT exp | last_refresh | Result |
|---|---|---|---|---|---|
| Before | `b901acb3d2` | `07350697fd` | +239.4 h | 2026-10-12T16:40Z | |
| `refreshAhead`, `thresholdMs` 300 h | `aa01720844` | `330cc547f3` | +240.0 h | 2026-10-12T17:16Z | `renewed/applied` |
| Plain `codex exec` from the real home | unchanged | unchanged | | | exit 0, answered `OK` |

So the scratch "due" marking (rewriting `last_refresh` and the JWT payload `exp` in the copy only) makes Codex renew, and the applied pair works from the source.

## Not covered

- Two confined (bwrap) dispatches end to end. The mechanism they call is the one exercised above; the dispatch wiring is covered by `test/runner/assignment-dispatch.test.mjs`.
- Write-back of a copy renewed inside a pane on a live account (covered by unit tests only).
- Reuse of an old refresh token: deliberately never tried.
