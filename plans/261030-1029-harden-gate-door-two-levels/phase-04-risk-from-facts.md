# Phase 04: Risk from facts; the Iron Law reads the same facts; the keyword list leaves every gate

Decision 55 (4a). Runs in parallel with phase 03 (disjoint files). The RUL35 supersede text and its minted id are in phase 08, which lands in the same drop; this phase must not land without it.

## Context

- One keyword list, `src/intake/risk-keywords.mjs` (34 EN/VI words), gates today through: the gate-bypass floor (moved to Rust `decide_v0` in phase 01), the Iron Law (`src/evolve/iron-law.mjs:13,80-87`), the heavy-risk park (`src/intake/plan.mjs:737`, via `work.risk` set by `classify.mjs:66-70`), and the fanout prose (`core/skills/fgos-fanout/SKILL.md:130-145`). tsk-224 measured an 83.6% false trigger on plan prose.
- The Iron Law already has a hardcoded path-class list, `MODULE_RULES` (`src/evolve/iron-law.mjs:15-26`), written for fgOS's own source (`src/runner/`, `bin/fgos.mjs`, ...). It runs on every runner-sourced approve in every project, so on another project these rows match by accident or never.
- Iron Law result fields `matchedFlags` and `matchedModules` are read by `src/runner/iron-law-gate.mjs:52,64-71`, `src/verbs/merge/iron-law-level.mjs:37,53`, `src/verbs/merge/approve.mjs:376`, `src/verbs/merge/sync-root.mjs:89`.
- Config: sections are `core/config-standard/<section>.yaml` plus `core/config-schema/<section>.schema.yaml`, bundled by `packages/config/rust/src/bundle.rs:18,23`; project overrides global by layering (`docs/platform/config/spec.md`).

## Requirements

1. **One path-class table.** New config section `riskPaths` (owner: gate): `classes: [{name, risk: high|medium, ironLaw: bool, patterns: [glob]}]`. Project over global through the config door; no second reader. Standard rows per Q4. This repository's `.fgos/config.yaml` gets fgOS's rows: today's `MODULE_RULES` (with `ironLaw: true`), the Git and lock cores (`packages/git/**`, `packages/holder-lock/**`, `packages/event-store/**`), the gate crate itself, contracts (`packages/*/contracts/**`) and the config schema (`core/config-schema/**`).
2. **Facts in `decide`.** Risk class of a subject: `high` when any written or deleted path is in a `high` class, when it deletes tracked files (merge facts), or when `outsideReach` is not empty (push, network, external API, write outside the worktree, from the Unit's capability and confinement facts); `medium` when a path is in a `medium` class; else `low`. `auto` only when the class is `low`, the size is covered by the bypass level, no open items, and the self-reported cost is `REVERSIBLE`. A caller may pass `raise: [reason]` (the agent's own judgment or an impact-analysis caller count from the skill); it can only turn `auto` into `ask`. `deny` only when facts cannot be read (diff unavailable, config refused), with the named cause; never `auto` on missing facts.
3. **Hint, never a block.** `subject.hint` (title, description) is copied into `gate.asked` for the human to read; no code matches words in it.
4. **Iron Law on the same facts.** `classifyIronLaw({filesChanged})` asks the door `riskOf(paths)` through `src/gate/door.mjs` and is required when any changed path falls in a class with `ironLaw: true`. The `description` input and the keyword test go. Result fields become `{required, matchedClasses, matchedPaths}`; every reader listed in Context moves in this phase. `ironLaw.level` (RUL64) and `--acknowledge-iron-law` are unchanged.
5. **Keyword list leaves the gates.** Per Q2: (a) `HEAVY_KEYWORDS` and `matchesKeyword` move into `src/intake/classify.mjs` as its private tier hint, `src/intake/risk-keywords.mjs` is deleted; or (b) the heavy list is deleted and classify keeps only light and kind words.
6. **Config registration** through the existing door only: standard file, schema, bundle entry, doctor coverage through `fgos config check` (no new doctor row); `fgos setup` config-merge picks the section up from the bundle.

## Files

- **Create:** `core/config-standard/riskPaths.yaml`, `core/config-schema/riskPaths.schema.yaml`; `packages/gate/rust/src/decide/facts.rs` (declared from `decide.rs`, so `lib.rs` is not touched); `packages/gate/rust/tests/facts.rs`.
- **Modify:** `packages/gate/rust/src/decide.rs` (facts policy replaces `decide_v0`); `packages/config/rust/src/bundle.rs:18,23` and the config contract fixtures that enumerate sections (`packages/config/contracts/fixtures/registry-defaults.v1.json`, `docs.v1.json`, and any other fixture `rg -l gateBypass packages/config/contracts/fixtures` lists); `.fgos/config.yaml`; `src/evolve/iron-law.mjs`; `src/runner/iron-law-gate.mjs:52,64-71`; `src/verbs/merge/iron-law-level.mjs:37,53`; `src/verbs/merge/approve.mjs:376` (refusal text only); `src/verbs/merge/sync-root.mjs:89`; `src/intake/classify.mjs:7,42`; `docs/architecture-manifest.json` (drop `src/intake/risk-keywords.mjs`).
- **Delete:** `decide_v0`'s keyword floor and its ported keyword table (phase 01); `MODULE_RULES` and the keyword loop in `src/evolve/iron-law.mjs`; `src/intake/risk-keywords.mjs` (both Q2 options delete the shared module).

## Tests to retire, and the test that now owns the behaviour

| Retired | Now owned by |
|---|---|
| keyword-floor rows in `packages/gate/rust/tests/decide.rs` (from phase 01) | `packages/gate/rust/tests/facts.rs` (risk class from paths, deletions, reach, size; raise-only) |
| keyword cases in `test/evolve/iron-law.test.mjs` (description flags, Vietnamese words) | behaviour removed; path cases stay in that file, now driven by a config fixture with `ironLaw: true` rows |
| `matchedFlags` assertions in `test/cli/fgos-iron-law-gate.test.mjs`, `test/cli/fgos-approve-3.test.mjs`, `test/cli/fgos-approve-5.test.mjs`, `test/direct/merge-gate.test.mjs`, `test/e2e/self-improve-loop.test.mjs` | same tests assert `matchedClasses`; no case added |
| risk-keyword unit tests, if any (`rg -l "risk-keywords" test`) | classify's own test (Q2 a) or removed (Q2 b) |

## Steps

1. Check the previous release's config door against an unknown section: run the activated release's `fgos config check` on a scratch project whose config has `riskPaths`. If it refuses the whole config, the rollback step below removes the section first.
2. Schema, standard, bundle, fixtures; this repository's rows.
3. Facts policy in `decide`; delete the floor.
4. Iron Law onto `riskOf`; move every `matchedFlags` reader.
5. Q2 outcome for classify; delete `risk-keywords.mjs`; architecture manifest.

## Validation

- `cargo test -p fgos-gate`, `cargo test -p fgos-config`, `cargo clippy -p fgos-gate -- -D warnings`
- Focused Node via `fr.mjs`: `test/evolve/iron-law.test.mjs`, `test/cli/fgos-iron-law-gate.test.mjs`, `test/direct/merge-gate.test.mjs`, `test/cli/fgos-approve-3.test.mjs`, `test/cli/fgos-approve-5.test.mjs`, `test/e2e/self-improve-loop.test.mjs`, `test/config/config-door.test.mjs`, `test/architecture.test.mjs`, the classify test
- `npm run fgos:dev -- config check` and `npm run fgos:dev -- config explain riskPaths.classes`
- `rg -n "HEAVY_KEYWORDS|matchesKeyword|risk-keywords|matchedFlags" src bin` shows only `classify.mjs` (Q2 a) or nothing (Q2 b).

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| A risky change described in words but touching no listed path now passes the gate | M x M | Deletions, reach outside the worktree and size still ask; the merge check on the real diff is mandatory (phase 06); the agent can raise |
| Projects get no fact-based risk from paths until they add rows | M x M | Q4 standard rows; CHANGELOG line tells users how to add rows |
| The previous release refuses a config holding `riskPaths` on rollback | M x H | Step 1 measures it; rollback removes the section before re-activating |
| Iron Law stops firing on fgOS's own source if this repo's rows are wrong | L x H | The rows are a verbatim move of `MODULE_RULES`; one test reads the repo config and asserts each old module still matches |

## Rollback

Revert with drop B; before re-activating the previous release, remove `riskPaths` from `.fgos/config.yaml` and from any project or global config that added it (`fgos config unset riskPaths`) if step 1 showed the previous release refuses it.

## Net size (estimate)

Rust: about +200 facts, -60 keyword floor. Node: -52 (`risk-keywords.mjs`), about -45 in `iron-law.mjs`, about +10 elsewhere; Q2(a) moves about 20 lines into `classify.mjs`. Config YAML: about +40. Tests: about +150 Rust, about -90 Node.
