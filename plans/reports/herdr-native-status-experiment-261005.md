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

## Not done

- Replacing the per-tick CLI poll with `agent wait --timeout`: now possible for confined panes, not attempted.
- An upstream herdr manifest rule for the codex capacity screen.
