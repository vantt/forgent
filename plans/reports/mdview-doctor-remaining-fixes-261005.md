# mdview doctor remaining fixes, 2026-10-05

Project: `/home/vantt/projects/mdview`. All commands ran from inside mdview as `env -u CLAUDE_CODE_SESSION_ID node /home/vantt/projects/forgentX/bin/fgos.mjs <verb>`. Follow-up to `mdview-fgos-install-update-261005.md`.

## 1. Result

Two of the four targeted checks are now fixed or partly fixed: `provider-capacity-state` passes, and the mdview-side half of `model-policy-tier-coverage` is fixed. The other two (`coordination-sessions-closed`, `confined-pane-accounts`) could not be fixed by an official command and are reported with exact owner steps. The task-spec and domain-workflow checks no longer fail (fixed on the forgentX side today).

| Check | Before | Action | After |
|-------|--------|--------|-------|
| provider-capacity-state | quarantine `quota-limit` until 2026-10-04T11:29:45Z (expired) | `dispatch reconcile provider-capacity clear-quarantine --provider gemini --account mucdong --reason ...`. The record is on provider `gemini`, account `mucdong` (the check text says "mucdong"). Only that one account entry was cleared; the audit record was appended by the command. | pass |
| model-policy-tier-coverage | project `xai` missing `nano`; global `openai` missing `standard`, `flagship` and `frontier` (three tiers, not one) | Project: added `runner.modelPolicies.xai.nano = "grok-4.3"` in `/home/vantt/projects/mdview/.fgos/config.json`, copied from `xai.standard`, the nearest existing tier (the xai file has no tier below standard; `standard` is the adjacent one). One key, verified by diff. Global: not changed (see 3). | project half fixed; still fails on the 3 global openai tiers |
| coordination-sessions-closed | 5 sessions active, oldest 33d | none: no official close verb exists (see 4) | fail, unchanged |
| confined-pane-accounts | no `runner.providers.z-ai.accounts` in the global config | none: proposal only (see 5) | fail, unchanged |
| doc-source-conservation, tool-registry-configured (gitnexus), executor-profile-warnings, shell-integration-sourced | as in the earlier report | untouched by design | unchanged (owner decisions or informational) |

## 2. Commands run

1. `git status --porcelain` before (saved), doctor (read-only) three times: before, after step 1, after step 2.
2. `dispatch inspect --provider-capacity` (read-only): showed the quarantine under provider `gemini`, account `mucdong`; all other providers had `quarantine: null`.
3. Backup: `~/.fgos/runtime/provider-capacity/state.json` and `mdview/.fgos/config.json` into `/home/vantt/.claude/jobs/a019f72e/tmp/mdview-backup2-261005/` (relative paths preserved: `home/.fgos/runtime/provider-capacity/state.json`, `.fgos/config.json`).
4. `dispatch reconcile provider-capacity clear-quarantine --provider gemini --account mucdong --reason "quarantine until=2026-10-04T11:29:45Z expired; cleared after expiry"`. Note: this state file lives in `~/.fgos/runtime/provider-capacity/` (global, outside mdview), which is where the official command writes; the quarantine was already expired.
5. One `Edit` of `mdview/.fgos/config.json` (the `nano` key above).
6. Discovery only: `coordination --help` on the Node entry and on every release host under `~/.local/state/fgos/releases/*/bin/fgos` (all answer `unknown verb "coordination"` or fail digest check), `session --help`, read of `.fgos/coordination/sessions/*/session.json` (manifest fields and file mtimes only), reading global and project config values for `modelPolicies` and `providers` (credential values never printed; account entries were printed masked and contain only file names and paths).

Not run: `setup`, `doctor --fix`, submit/pick/move/approve, anything that deletes files. Nothing committed in mdview. `.fgos/secrets.local.env` and credential files were not read (only the directory listing of `~/.pi/accounts/*` names).

Side effect: two `coordination --help` attempts appended fault lines to mdview's git-ignored `.fgos/logs/invocation-faults.jsonl`.

## 3. Global openai tiers (left alone)

Global `~/.fgos/config.json` has `runner.modelPolicies.openai = {"nano": "gpt-5.5"}` only. The check needs `standard`, `flagship` and `frontier` too, three keys and a model choice for `frontier`, which goes beyond the "single key" authorisation. Not edited, no backup needed. Proposal for the owner: if `openai` should mirror the sibling entry `openai-codex` (all tiers `gpt-5.5`), add `standard`, `advanced`, `flagship`, `frontier` as `gpt-5.5` (nearest existing tier: `nano`). If `openai` is meant to be partial, drop the entry or declare it. Note the global file has `provider "openai"` derived from some global executor; the owner should confirm which one still uses it.

## 4. Coordination sessions (could not close)

The coordination engine was retired in commit `2180b4e72` ("L4 coordination engine retired"); `fgos coordination` no longer exists in the Node entry or in any installed release host, so there is no official close command. Closing would require hand-editing `session.json`, which the task forbids. The check in `src/setup/registrations.mjs` (`checkCoordinationSessionsClosed`) was left behind and still reads `.fgos/coordination/sessions`.

All five sessions are idle for far more than 24 hours (the files in each session dir were last written within minutes of creation):

| id | state | created | last file activity | idle |
|----|-------|---------|--------------------|------|
| coord_mtjpv51p_pi8y7a | active | 2026-09-02T06:29:58Z | 2026-09-02T06:29:59Z | about 795 h (33 d) |
| coord_mtjpwbjj_bfeyqw | active | 2026-09-02T06:30:53Z | 2026-09-02T06:30:55Z | about 795 h |
| coord_mtjpxa8e_mkugxx | active | 2026-09-02T06:31:38Z | 2026-09-02T06:31:59Z | about 795 h |
| coord_mtjpy4yb_1zfb5k | active | 2026-09-02T06:32:18Z | 2026-09-02T06:34:41Z | about 795 h |
| coord_mtjr5c3y_ozpq1h | active | 2026-09-02T07:05:53Z | 2026-09-02T07:06:21Z | about 795 h |

Owner options: (a) retire the check (forgentX-side bug B5 below), or (b) move or archive `.fgos/coordination/` by hand, which is a decision about deleting state, not done here.

## 5. confined-pane-accounts (proposal, not applied)

Facts: executor `glm-herdr` (invocation `pi-herdr-openrouter`) is declared in mdview's project config with `providerModel: "z-ai"`, `PI_CODING_AGENT_DIR=${HOME}/.pi/accounts/openrouter` and `OPENROUTER_API_KEY=${GLM_OPENROUTER_API_KEY}`. The global config's `runner.providers` has `openai`, `xai`, `gemini` only. Existing entries use `credentialSource: {kind: "home-files", home: "${HOME}/.pi/accounts/<name>", files: [...]}` (xai/vantt lists `auth.json`, `models-store.json`, `settings.json`, `trust.json`, `bin/fd`). The directory `~/.pi/accounts/openrouter` exists with exactly those files.

Proposed addition to `~/.fgos/config.json` under `runner.providers`:

```json
"z-ai": {
  "accounts": {
    "openrouter": {
      "label": "openrouter",
      "credentialSource": {
        "kind": "home-files",
        "home": "${HOME}/.pi/accounts/openrouter",
        "files": ["auth.json", "models-store.json", "settings.json", "trust.json", "bin/fd"]
      }
    }
  }
}
```

Not applied: it edits the owner's global config, and I cannot confirm without reading credential files that the `openrouter` home holds the key for z-ai (the xai shape proves the structure, not which account is right). No secret has to be invented: the entry references an existing directory. The `${GLM_OPENROUTER_API_KEY}` env var is a second route and must be set in the owner's environment either way.

## 6. mdview git status

Identical before and after (7 untracked paths: `.agents/`, `.claude/settings.json`, `.claude/skills/`, `docs/decisions/`, `docs/doc-registry.json`, `docs/doc-registry.md`, `docs/enduser-docs-index.json`). Changes happened only in git-ignored `.fgos/` (`config.json` one key, `logs/invocation-faults.jsonl`) and in the global `~/.fgos/runtime/provider-capacity/state.json`.

## 7. Remaining for the owner

- Global `openai` modelPolicies: 3 tiers (section 3).
- z-ai provider account: apply or adjust the proposal (section 5).
- 5 stale coordination sessions: decide to archive the directory or retire the check (section 4).
- doc-source-conservation (17 outcome sources), gitnexus missing, legacy executor-profile warnings, shell-integration (informational in an agent shell): unchanged owner decisions.

## 8. forgentX-side finding

B5. `coordination-sessions-closed` (`src/setup/registrations.mjs`) still checks a subsystem whose engine and CLI were retired (`2180b4e72`), and its message promises an action ("review") that has no command. It should be retired or made to skip.
