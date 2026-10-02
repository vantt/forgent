# Panelist-1: per-invocation config vs provider adapter for confined herdr panes

## Recommendation
Option A: keep the recipe as per-invocation config. Do not add an adapter now. Add one cheap guard instead (see "Residual risk"). This matches the framing step's conclusion; I re-checked it against the sources.

## What I read (no files modified)
- `docs/specs/confinement-authority.md` 13.1 (recipe, history, why it was forgotten).
- `.fgos/config.json`, the herdr-spawn invocations with `confinement.backend: bwrap`:
  - `codex-herdr-fgovn` binds private-home to env `CODEX_HOME`.
  - `agy-herdr-mucdong` binds private-home to env `HOME`.
  - `pi-herdr-vantt` binds private-home to env `PI_CODING_AGENT_DIR`.
  - `claude-herdr-bwrap` and `glm-herdr-bwrap` have no binding (no private home).
- `src/runner/dispatch/confinement/drivers/bwrap.mjs` lines 25-100 and 325-345.

## Where the per-agent knowledge already lives
The "home layout and credential files" an adapter would declare is already split in two declarative places:
1. Home layout: one `resourceBindings` entry per invocation. It is a single env-var name, the only agent-specific fact (CODEX_HOME / HOME / PI_CODING_AGENT_DIR).
2. Credential files: the machine-global account inventory (`runner.providers.<p>.accounts.<id>.credentialSource`, kind `codex-home` or `home-files` with an explicit file list). It is per account, not per agent family, so it cannot move into a per-agent adapter without being split again.

`bwrap.mjs` is agent-agnostic: `copyHomeFiles` copies an allow-list, owner-only, fails closed, rejects `..`, absolute paths, symlink escapes and non-regular files. Only the kind named `codex-home` is codex-specific, and it is just `auth.json`. So the driver needs no per-agent code to support agy or pi.

## Trade-offs
Option A, per-invocation config
- Pros: no new abstraction (YAGNI/KISS); matches the existing `codex-cli-bwrap` shape; the security-relevant file allow-list stays explicit, auditable and owner-controlled in machine config; project config cannot widen it; zero new contract to spec and register.
- Cons: the env-var name is repeated per invocation and per account-bound invocation; a new invocation can omit the binding. That omission is exactly the 2026-10-01 regression (`cfd670c43` applied posture without binding, so panes died at startup). The recipe is knowledge in prose (13.1), not enforced.

Option B, provider adapter declaring layout plus credential files
- Pros: one place says "codex means CODEX_HOME + auth.json", so new invocations inherit it and cannot forget; could back the doctor check and fail at prepare time.
- Cons: three agents with three different layouts gives only 3 data points, too few to abstract well; the credential file list is account-specific, so the adapter would either duplicate the inventory or become a second source of truth with precedence rules; the existing provider adapter is pure/shadow-only (per framing), so it would need new authority over mounts and file copies, which is a trust-boundary change under CTR010 and the project-over-global config rules; the adapter could silently choose which files to copy, weakening the explicit allow-list property; per `AGENTS.md` it needs a spec/registry entry before code. Larger blast radius for a change whose failure mode so far was a missed config line, not a design flaw.

## Residual risk and the cheap fix
The real failure was forgetting, not duplication. 13.1 says `fgos doctor` check `confined-pane-accounts` already flags panes that would start logged out. The gap I could confirm is only the inverse: nothing I read rejects a herdr-spawn invocation with `confinement.backend: bwrap` and no private-home binding for a non-claude agent. Suggest extending that check, or config validation in `src/runner/dispatch/config.mjs`, to flag it. I did not verify whether the check already covers this; that should be confirmed before building anything.

## Revisit trigger
Move to an adapter if a fourth or fifth agent family needs a different layout (for example more than one env var or a non-file credential), or if the same layout fact starts being repeated across many invocations and drifts.

## Unresolved questions
- Does `confined-pane-accounts` already fail on a missing private-home binding, or only on missing account login?
- The `credential-provisioning-unsupported` rejection for non-cli-spawn adapters (`assignment-runner.mjs:1677`) is a separate path from the herdr-spawn recipe; I did not trace how the two interact.
- No sandbox probe was run; conclusions come from reading code and config only.
