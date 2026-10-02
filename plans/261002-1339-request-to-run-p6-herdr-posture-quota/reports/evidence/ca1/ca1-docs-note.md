# How `fgos run` chooses herdr vs cli transport

Source: the "Transport (G7)" block in `src/runner/execution/bind.mjs` (step 4, lines 253-272).

- Default is `cli`: `transport = 'cli'`, `transportSource = 'default-cli'`, invocation is the chosen candidate's own.
- herdr is picked only when all three hold: the executor has a herdr-spawn invocation (`findHerdrInvocation`), `session.herdrPresent === true`, and the candidate is not an inline fallback.
- Even then, herdr requires `canApplyPosture(...)` to pass for that herdr invocation; on success `transportSource = 'herdr-invocation-present'` and the herdr invocation id replaces the original.
- If the posture cannot be applied, transport stays `cli` with `transportSource = 'cli:herdr-invocation-cannot-apply-posture'`.
- A human-pinned override invocation wins over all of this: `transportSource = 'override-pinned-invocation'`, the invocation stays as pinned, and transport is `herdr` only if the pinned invocation's adapter is `herdr-spawn`.
- The decision is reported via `transport` and `transportSource`, so the reason for a cli fallback is visible.
