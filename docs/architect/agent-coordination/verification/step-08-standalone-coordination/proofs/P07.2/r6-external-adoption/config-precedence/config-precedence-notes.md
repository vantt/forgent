# R6 config-precedence proof — decisiveness follow-up

## Gap found (independent Reviewer, confirmed by Coordinator)

The original R6 config-precedence run (`r6-driver.sh` step 4,
`agent-led-envelope-under-fake-global-home.json`) resolved
`policy.model = "sonnet"` for both `op_001`/`op_002`, with
`policy.provenance.model = { value: "sonnet", source: { scope:
"runnerConfig", id: "claude.standard" } }`. That is mdview's real
project-config value (`.fgos/config.json`'s `runner.models.standard`)
correctly winning over the deliberately-broken fake-global value
(`"fake-global-standard"`) — BUT `"sonnet"` is *also*
`src/runner/dispatch/config.mjs`'s `DEFAULT_RUNNER_CONFIG.models.standard`
hardcoded default. The observed result was therefore equally consistent
with a hypothetical bug where config resolution silently fell through to
the hardcoded default instead of genuinely reading mdview's project
config — not fully self-decisive. `op_001`/`op_002`'s own
`assignment.json`/`result.json` were also never copied into this
directory (only the envelope, which never surfaces the resolved `model`
field, was captured).

## Fix

1. Confirmed `mdview/.fgos/config.json` is gitignored
   (`mdview/.gitignore:17: /.fgos/* .fgos/config.json`) before editing it.
2. Backed up mdview's real `.fgos/config.json`, then temporarily changed
   `runner.models.standard` from `"sonnet"` to `"opus"` — a real, valid,
   dispatchable Claude model (same catalog mdview's own config already
   uses for `heavy`, and the catalog `DEFAULT_RUNNER_CONFIG` in this repo
   draws from) that is clearly distinguishable from BOTH the hardcoded
   default for the `standard` tier (`"sonnet"`) AND the fake-global value
   (`"fake-global-standard"`).
3. Re-ran the exact same live dispatch as the original step 4 — same
   request file (`agent-led-request-mdview.json`), same fake-global
   `HOME` override, from mdview's own cwd, through a freshly
   `npm pack`/`npm install -g`'d real installed CLI (same
   install/packaging precedent `r6-driver.sh` step 1 used, never
   `npm link`). This claimed `asgn_p072_r6_external_adoption_mdview_op_006`.
4. Captured the resolved-value artifact:
   `resolved-value-evidence/op_006-distinguishable-project-value/result.json` —
   `policy.model = "opus"`, `policy.provenance.model = { value: "opus",
   source: { scope: "runnerConfig", id: "claude.standard" } }`. This
   resolves to the NEW distinguishable project value, never the
   hardcoded default (`"sonnet"`) and never the fake-global value
   (`"fake-global-standard"`) — now fully self-decisive proof that
   project config, not a default fallback, is what wins.
5. Also copied in the ORIGINAL run's `op_001`/`op_002`
   `assignment.json`/`result.json` (`resolved-value-evidence/op_001/`,
   `resolved-value-evidence/op_002/`) — the resolved-value artifact that
   was missing from the original committed proof.
6. Reverted `mdview/.fgos/config.json` back to its original captured
   content immediately after (byte-identical md5 confirmed:
   `acb1f3763a84c317655cc370c11c51cf`).
7. Confirmed mdview's tracked git state is unchanged before/after (only
   the same pre-existing, unrelated `.fgos/events.jsonl` drift present in
   both `mdview-git-status-before.txt` and `mdview-git-status-after.txt`
   from the original run — no new tracked-file change from this
   follow-up).

The live LLM step itself still fails with the same unrelated
HOME-isolation auth artifact as the original run (`status: "failed"`,
`agentClaim.summary: "agent-result.json was present but failed schema
validation"`) — expected and irrelevant to this proof: the point being
verified is fgOS's own config *resolution* (which value `policy.model`
and its `provenance` record before dispatch), not the downstream LLM
call's success.

## Artifacts

- `resolved-value-evidence/op_001/{assignment,result}.json` — original
  fake-global-home run, first operation (`model: "sonnet"`, ambiguous).
- `resolved-value-evidence/op_002/{assignment,result}.json` — original
  fake-global-home run, second operation (`model: "sonnet"`, ambiguous).
- `resolved-value-evidence/op_006-distinguishable-project-value/{assignment,result}.json` —
  follow-up run under the distinguishable project value (`model:
  "opus"`, decisive).
- `agent-led-envelope-under-distinguishable-project-config.json` — the
  envelope for the op_006 dispatch (same shape/failure mode as the
  original `agent-led-envelope-under-fake-global-home.json`).
