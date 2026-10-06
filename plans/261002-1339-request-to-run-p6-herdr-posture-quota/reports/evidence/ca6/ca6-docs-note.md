# How `fgos run` chooses between the herdr and cli transport

Source: `src/runner/execution/bind.mjs`, block "4. Transport (G7)" (lines 253-272), inside `bind()`.

- Default is `cli`, with `transportSource` `default-cli`; `herdr` is chosen only when a rule below overrides it.
- A human-pinned override invocation (`chosenCandidate.override.invocation`) stays as pinned and gets `transportSource` `override-pinned-invocation`. The transport is `herdr` only if the pinned invocation's adapter is `herdr-spawn`; otherwise it stays `cli`.
- Without a pin, `herdr` requires all three: the executor has a herdr invocation, `session.herdrPresent === true`, and the candidate is not the inline lead fallback (`isInlineFallback`).
- A herdr invocation is one with `via: 'cli'`, `adapter: 'herdr-spawn'` and a non-empty string `id` (`findHerdrInvocation`, line 45). One without an id is never chosen because a caller cannot name it.
- The herdr invocation must also pass `canApplyPosture` for the resolved posture. On success the transport is `herdr`, `transportSource` is `herdr-invocation-present`, and the invocation that runs is the herdr one.
- If the herdr invocation cannot apply the posture, the transport stays `cli` with `transportSource` `cli:herdr-invocation-cannot-apply-posture`.
- The choice is returned as `transport` plus `provenance.transport` (`{ value, source }`), so each decision can be traced.
