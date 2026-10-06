# Should fgOS add a dissent/agreement gate to panels?

**Position: no-gate (keep passive measurement only), confidence 0.8.** If you add anything later, make it an opt-in, advisory flag. Do not add a mandatory gate.

## Evidence (read-only scan of `[assignment-path-redacted]`)
- There are 36 unit summaries with 79 seats in total. Only **6 seats (7.6%) carry a valid stance**. The other 73 show `"missing"`, mostly because 34 of the 36 units declared empty `stanceOptions`, which means nobody asked them for a stance.
- Only 2 units declared options (`no-gate/optional-gate/mandatory-gate`). Both were earlier runs of this same question:
  - `[runtime-id-redacted]`: 2 of 3 seats valid, both no-gate (0.8, 0.95), and **1 seat missing**.
  - `[runtime-id-redacted]`: 4 of 4 seats valid, all no-gate (0.78 to 0.95).
- The summary records a missing stance as `missing` without invalidating the claim. This is the passive design described in the brief, and it already works.

What this means: right now there are almost no stance data points to put a gate on. Any agreement threshold would be tuned on n≈6 points, all from one question. A gate that rejects a run whenever a stance is missing would have failed 1 of the 2 measured runs, even though that run produced a usable synthesis.

## Counterfactuals
| Scenario | Mandatory gate | Optional gate | No gate (passive) |
|---|---|---|---|
| Seat omits stance (seen in 1 of 2 runs) | Run blocks or retries, which slows consuming projects | Blocks only if the operator enabled it | Recorded as `missing`. Synthesis proceeds |
| Unanimous agreement (seen in 1 of 2 runs) | Passes. But unanimity among same-model seats can be an echo, not independent evidence, so the gate gives false assurance | Same | Same data, and nobody mistakes it for proof |
| Real split (not seen yet) | Forces a human or another round, which goes against "release humans second" | The operator chose the friction, so it's acceptable | Synthesis must already handle disagreement. The spread is visible in the summary |
| Open-ended question with no stance options (34 of 36 units) | Not applicable, or the gate needs special-case logic | Not applicable | Not applicable. Nothing to do |

## Perspective spread
- **Ship-speed (priority 1):** each gate adds a failure mode plus retry or human paths to every panel run. A passive measurement costs nothing. This view favors no-gate.
- **Human-release (priority 2):** a mandatory dissent gate escalates to humans exactly in the contested cases. That's arguably the right moment to involve someone, but the synthesis step already surfaces it without blocking. This view favors no-gate or optional-gate.
- **Reproducible DoD (priority 3):** a gate with a numeric threshold looks reproducible, but stances are self-reported LLM confidences, and the threshold would rest on n=6 points. That's false precision. Recording the spread gives a reproducible *record* without a fake *criterion*. This view leans no-gate.
- **Steelman for a gate:** panels of the same model can converge too easily. A dissent requirement (for example, a forced red-team seat) increases real diversity. But that is a *composition* control (who sits on the panel), not an *agreement* gate (whether output is accepted). Agreement gates reward agreeing, which is the wrong incentive for independent seats.

## Recommendation (executable)
1. **Keep passive stance measurement and add no gate.** Leave claim validity independent of stance, as it is today.
2. **Increase measurement coverage first.** Declare `stanceOptions` whenever a panel question has discrete options, so the stance data stops being 92% `missing`.
3. **Report agreement in the unit summary**: choice distribution, mean confidence, and missing count. Flag `low-agreement` or `high-missing` as *advisory* text in the synthesis input. Never use these as a blocking status.
4. **Re-evaluate after about 30 or more units with declared options.** Promote to an *optional*, per-workflow gate only if the data shows that low-agreement runs had worse downstream outcomes (rework, reverted decisions). Never make it mandatory by default.
5. Address convergence risk through panel composition (a red-team or critique seat, which the architecture-advisory flow already has), not through an acceptance gate.

## Caveats
- The evidence is small and comes from a single question. The 6 unanimous no-gate stances may themselves be same-model convergence, so they shouldn't be read as independent confirmation.
- I did not inspect fgOS source code. The claims about the passive design come from the brief plus the summary JSON shape.
