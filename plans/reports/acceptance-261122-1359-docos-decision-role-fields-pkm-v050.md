# Acceptance: decision role fields, read by pkm v0.5.0 over the real documents

Date: 2026-11-22 (Asia/Saigon). Phase 3 of [the decision role fields plan](../261122-1238-docos-decision-role-fields/plan.md). Repo main at `9e3842f21`. pkm `v0.5.0` (`fb1eaa51`) built locally. The vault is the repository itself, read-only: `writes: none`, with the graph database outside the repository.

## Result

**Accepted.** pkm computes the set in force from the projected role fields, and every answer matches the decision events.

| Measure | Expected from the events | pkm `in_force --units` at 2026-11-22 |
|---|---|---|
| Units ended | D-ADR0023 (by 0025), D-ADR0025 (by 0030), D-ADR0036 (by 0054), D-ADR0061 (by 0062) | the same 4, each with the right replacing unit |
| Units amended, still in force | L3, D-ADR0002, D-ADR0006, D-ADR0026 (by 0028 and 0029), D-ADR0028, D-ADR0043, 0051, 0049, D-ADR0072, D-ADR0076, RUL102 | the same 11 |
| Units in force | | 295 |
| `--as-of 2026-10-18T14:40Z` | D-ADR0061 in force, D-ADR0062 not yet | as expected |
| `--as-of 2026-10-18T14:43Z` | D-ADR0062 in force, D-ADR0061 ended | as expected |

Compared with the probe's run A on the prose (14 units ended, 5 of them correct), no unit ends by mistake, L3 is no longer ended by a partial supersession, and dates now separate the two sides of a replacement.

## What the run found and fixed

- **A wrong target that I wrote this morning.** The backfilled event for D-ADR0076 named `D-ADR0049`, which does not exist; its narrative says "narrows 0049", meaning decision 0049 of the runner decisions file. A correction event now says `amends:0049` (`9e3842f21`), and pkm lists 0049 as amended by D-ADR0076.
- **Two scopes, one number.** D-ADR0032 is two decisions (runner: Iron Law; work-state: Team Harness). The projection now keys a decision by scope and id (`8cb301708`), so neither borrows the other's heading.
- **Narratives outside their scope's holder.** D-ADR0055, 0057, 0058 and 0077 are recorded under one scope and told in another area. The projection looks under `docs/platform/` when the holder has no heading and only one scope owns the number (`2a3e7f2f3`).

## Open

- **D-ADR0032 (work-state, Team Harness) had no D-ADR heading.** Corrected later the same day: its narrative was there under the bare heading `### 0032` in `docs/platform/work-state/decisions/retired-decision-history.md`, which is now `### D-ADR0032 — Multi-role Team Harness…` with its role field line (landed in `ee2b0a01a`).
- **Three relation targets name no unit:** D-ADR0027 (a retired document hash), D-ADR0077 (a spec line), D-ADR0078 (a commit). Nothing in force ends, which is right; the warnings stay.
- **pkm's incremental index missed an edited file.** After the 0076 correction, `in_force` (which updates the index incrementally before each command) still showed the old target; a full `index build --full` showed the new one. Worth a pkm issue once reproduced on a small vault.
- **Relations between RUL bullets** that no decision event carries (RUL72 and RUL69, RUL108 and RUL101) and clause targets (L3 clauses 1 and 4, pkm request 2) are outside this plan.

## Artifacts

Scratch folder `/tmp/claude-1000/-home-vantt-projects-forgentX/f3456e8e-44f8-4048-8d93-95c0ef5a5a34/scratchpad/role-accept/`: `profile.yaml`, `fgos-decisions-pack.yaml` (relations read only from `[replaces::]` and `[amends::]`), `run.sh`, `inforce-final.json` and the two `--as-of` outputs.
