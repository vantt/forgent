# herdr native status for confined panes: experiment (2026-10-05)

herdr 0.9.1-vantt.1, API protocol 22. Panes created by the experiment only, each launched behind `bwrap --ro-bind / / ...` (no pid namespace).

## Findings

| Question | Result |
|---|---|
| Does herdr detect claude, codex, agy, pi behind bwrap without `HERDR_AGENT`? | Yes. `agent get` and `agent explain` agree for all four (claude `blocked` on its trust dialog, the others `idle`). The hint is unnecessary. |
| What happens after fgos runs `pane report-agent --state working`? | `agent get` stays `working` while `agent explain` says `idle`: fgos becomes the single status authority. |
| `agent prompt --wait` on an unreported pane | Returns `done` in about 2 s. On a reported pane it times out. |
| `pane release-agent --source fgos` | Native status returns within about 6 s. |
| Can herdr see why a codex pane is stuck on "model is at capacity"? | No. Its title spinner matches `osc_title_working`, so the pane is `working`. The screen probe in `liveness.mjs` stays necessary. |

## Change made

- fgos no longer reports a state at launch. `ensureHerdrKnowsAgent` reports one only when herdr cannot address the pane after a 6 s grace (a process with no manifest).
- `readAgentState` reads `agent get` (one herdr call per poll instead of two) and asks `agent explain` only for `unknown`.
- Rounds that do not settle write `herdr-diagnosis.json`.

## Live check after the change

- claude-herdr solo read-only unit: pass, `agentKnownToHerdr: detected`, no `report-agent` needed.
- glm-herdr (confined, bwrap, pi) read-only unit: herdr detected agent `pi` with a live `working` status (`agent get`), `agentKnownToHerdr: detected`. The agent then looped on malformed tool calls (the open glm-herdr issue); run stopped by hand and its pane closed.

## Decisions on the remaining ideas

- `agent wait` as the poll sleep: not done. A round ends only on the result file; agent state matters for `blocked` and idle detection (seconds to minutes), so waking up to 1.5 s earlier gains nothing, and `agent wait` returns at once on an already-idle agent, which would spin the loop.
- Local manifest override for the codex "model is at capacity" screen: not done. herdr has only idle/working/blocked/done/unknown. `blocked` would make fgos wait for a person instead of falling back to the next executor; `idle` would be found only after the idle timeout, later than the existing 30 s working-screen probe. Upstream proposal if wanted: a limit state, or an `error` marker region in the codex manifest that suppresses `osc_title_working` while the line is on screen.
