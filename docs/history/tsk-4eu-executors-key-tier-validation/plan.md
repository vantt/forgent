# plan.md — tsk-4eu: `executors.<key>` not-a-tier dies silently

Mode: **small** (0-1 flags: only "existing covered behavior" applies —
`loadRunnerConfig`'s validation of `cfg.executors` changes from
shape-only to shape+key; no auth, authorization, data model,
audit/security, external system, public contract, cross-platform, weak
test coverage, or multi-domain flag applies). No `CONTEXT.md` exists for
this item — `fgos-clarifying` found intent fully understood from the
item's own description (exact code lines, exact root cause, exact fix,
exact verify) and `discover` moved `clarify -> decompose` directly,
skipping `discovery`/`exploring`. This plan's only source of truth is
therefore the item's own description, verified against the real repo
below (Bootstrap's "docsRef -> CONTEXT.md" step does not apply — there is
no docsRef).

## Verified against the real repo (not taken on faith from the description)

- `src/state/work.mjs:145` — `export const TIERS = Object.freeze(['light', 'standard', 'heavy']);` — confirmed.
- `src/runner/dispatch.mjs:478-483` — the `cfg.executors` validation loop iterates `Object.entries(cfg.executors)` and calls `validateExecutorShape(executor, ...)` per value, never checking that `tier` (the key) is one of `TIERS` — confirmed, shape-only.
- `src/runner/dispatch.mjs:600` (`resolveExecutorConfig`) — `perTier = cfg.executors[tier]`, `executor = byCapacity ?? perTier ?? cfg.executor` — confirmed, single lookup path keyed by tier.
- `src/runner/dispatch.mjs:~1103` — `tier = tierOverride ?? capacity?.tier ?? DEFAULTS.tier` — always resolves to one of `light`/`standard`/`heavy`, never a capacity id like `judge` — confirmed.
- `.fgos/config.json` `runner.executors` currently holds exactly one key, `judge` (with `--allowedTools ...Read...`), which can never be reached by the lookup above — confirmed live in this repo's own tracked config.
- `.fgos/config.json` `runner.capacities.judge-decompose` is `{"kind":"task"}` — no `command`/`args`/`adapter`/`agentType`, so `byCapacity` resolves `undefined` for it, and it falls through to `perTier` (`cfg.executors['light'|'standard'|'heavy']`, never `.judge`) then to the global `executor`, which has no `Read` in its `--allowedTools` — confirmed, this is the live bug.
- `.fgos/config.json` `runner.capacities.judge-discovery` already carries its own `command`/`args` (including `Read`) — confirmed unaffected by this change.
- `src/runner/dispatch.mjs:228` `DEFAULT_RUNNER_CONFIG` declares only `executor` (global), never `executors` — confirmed `fgos setup` on a clean repo cannot ship a bad key.
- `grep -rn "executors\." test/ src/setup/` — every non-`light`/`standard`/`heavy` hit in `test/runner/dispatch.test.mjs` is either a comment/test-name string or a fixture that only ever uses `executors.light` — confirmed no existing fixture uses a non-tier key, so tightening validation breaks nothing already covered.

## Approach

Single chained commit, three parts, in this order (each part's own test
must pass before moving to the next — no reason to reorder further):

1. **Validate the key, not just the shape** (`src/runner/dispatch.mjs`,
   the loop at 478-483). Import `TIERS` from `src/state/work.mjs` (a pure,
   dependency-free module `dispatch.mjs` already imports from elsewhere —
   verified no new import direction). For each key in `cfg.executors`, if
   it is not in `TIERS`, throw `RunnerConfigError` naming the bad key and
   the valid set (`light, standard, heavy`). This turns the silent-pass
   into a load-time failure — the config-load equivalent of the module's
   existing `RunnerConfigError` shape-checks right next to it.
2. **Move `executors.judge`'s content to `capacities.judge-decompose`**
   in `.fgos/config.json` — this is the fix for the live bug, not just the
   validation. Delete the `executors.judge` key entirely (step 1 would now
   reject it anyway). `capacities.judge-discovery` stays untouched
   (already correct, already has its own command/args).
3. **Pin the regression with two new tests** in
   `test/runner/dispatch.test.mjs`:
   - `loadRunnerConfig` throws `RunnerConfigError` for a config with
     `executors.<non-tier-key>`, and the message names the bad key plus
     the valid tier set.
   - `resolveExecutorConfig`/`resolveExecutorCommand` for capacity
     `judge-decompose` (using this repo's real post-fix
     `.fgos/config.json` shape, or an equivalent fixture) resolves args
     containing `Read` — the regression proof for the actual symptom.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| `loadRunnerConfig` key validation | Low — new `RunnerConfigError` throw, additive, existing fixtures already confirmed tier-only | New test in item 3 above: rejects a non-tier `executors` key with a clear message |
| `.fgos/config.json` edit | Low — one config file, no code path reads `executors.judge` today (confirmed above — it was already unreachable dead config) | `fgos doctor` green; `fgos setup` on a clean repo still produces valid config (confirmed `DEFAULT_RUNNER_CONFIG` never declared `executors`) |
| `judge-decompose` resolving `Read` | Medium (this IS the live symptom) — regression proof is the whole point of this item | New test in item 3 above: `resolveExecutorConfig(cfg, tier, 'judge-decompose', ...)` args contain `Read` |

Impact-analysis capability gate (`CLAUDE.md`): `fgos tool query
--capability impact-analysis --status present` returns `gitnexus`
present, BUT its index is flagged stale (`last indexed: 19bc5e4`, 8
commits behind this branch's base HEAD, including a commit that touched
`src/runner/dispatch.mjs` itself — `8b9a6ec`). Posture: **degraded** —
`gitnexus present`, but its blast-radius answer for
`dispatch.mjs`/`work.mjs` is not provably fresh, so `fgos-coding-implement`
must still run `impact()` per `CLAUDE.md`'s MUST rules but treat that
evidence as weak and name the gap. This plan's own "Verified against the
real repo" section above already cross-checked the touched symbols by
direct read/grep of the current file contents (not through GitNexus),
per `CLAUDE.md`'s own "a suspicious answer is worth a grep/rg cross-check"
guidance — that direct-read evidence stands regardless of index
staleness; `impact()` at implementation time is still required for the
caller-graph view (who else calls `loadRunnerConfig`/the validation
loop) that a direct read alone does not give.

## No split

One honest piece of work, one chained commit — the item's own text
already states this ("BA VIEC PHAI LAM ... mot item, mot commit chuoi")
and the Approach above does not surface any piece that is independently
shippable or blocks unrelated work; `fgos graph --what-if` was not run
because there is no split candidate to compare.

## Explicitly out of scope (per the item's own text, not this plan's own invention)

Making the resolver purpose-aware (reading `executors.judge` by PURPOSE
instead of by tier) is D6 of tsk-5td (`for:`) and tsk-2ie5's scope — not
touched here. This item only makes the wrong config fail loudly and
routes `judge-decompose` to the right args.

## Correction during executing: `.fgos/config.json` cannot ship on this branch

Discovered at `fgos approve` time, not planning time: `merge.mjs`'s
`fgos-write-rejected` guard (ADR0020) permanently refuses any `fgw/<id>`
branch merge that stages a change under `.fgos/`. See
`iron-law-evidence.md`'s own section on this for the full recipe
(`docs/how-to/fix-fgos-write-rejected-merge-block.md`, precedent
`tsk-5vf`/`tsk-n4i-1`). `.fgos/config.json`'s content fix
(`executors.judge` → `capacities.judge-decompose`) was dropped from this
branch entirely (commit `97d54a1`) and must land as a separate, direct
operator commit on the main checkout — outside this item's own merge.
This item's own delivered scope narrows to: the `TIERS`-key validation in
`src/runner/dispatch.mjs`, and the two pinned regression tests in
`test/runner/dispatch.test.mjs`.

## Outstanding questions

None
