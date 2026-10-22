# MP-B1 phase 06: Seat Binding config proposal for forgentX, mdview and mcp-skill-hub

Date: 2026-10-22. Read-only analysis; no config file was edited. This report replaces the pre-SEAT diff in [phase-06-config-proposal-for-owner.md](../261019-2312-model-pool-b1-fallback-and-account-order/phase-06-config-proposal-for-owner.md). That file's owner decisions still stand. Its mechanism (rigor sets tier, `rigorToTier`) was removed by Seat Binding ([seat-binding.md](../../docs/specs/seat-binding.md) §5.2).

## 1. Summary

Under SEAT, a seat's tier comes from config keys, in this order: seat > persona > role > workflow seat recommendation > capability `tier` > `<prefix>:*` `tier` > `defaults.tier`. `maxTier` caps the result and shows the cap. A capability's own `maxTier` may be higher than the global one. `--override` cannot raise a tier above the resolved one (§5.4, §5.5). So every owner tier choice must now be a committed project-config line.

| Workspace | What is wrong today | What this proposal changes |
|---|---|---|
| forgentX | All code work runs at `standard`; owner rule is `advanced`. `docs:write` has no pool and runs gemini flash at `standard`. The doc-plan Doer's `--override '{"tier":"flagship"}'` is now refused. | `code:*`, `coding:*`, `fgos-coding-implement` and `execute` move to `advanced`. `docs:write` moves to `flagship`, prefer openai then claude. Architecture already matches the owner's decision; no change there. |
| mdview | `setup` converted it on 2026-10-22. Every architecture seat now runs at `standard` (sonnet). `synthesize-recommendation` used to run at `flagship`. 3 `group-cognition:explore` seats and `docs:write` do not bind. | Add `tierFallback`. Add an `architecture:*` block (flagship; frontier for the shape system seat, the critique producer and the synthesize producer), with `maxTier: flagship`. Code moves to `advanced`. |
| mcp-skill-hub | Doctor binds 0 of 42 seats ("no pool configured"), so every Workflow unit there is refused. | The same as mdview. `tierFallback` alone makes all 59 seats bind. |
| `~/.fgos/config.json` | No change is needed for the above. | Only open decision Q3 option (c) would touch it (§6). |

Every number in this report comes from running the real doctor check functions and `fgos dispatch explain` against scratch copies of the proposed files (method in §8).

## 2. forgentX

### 2.1 Current state (live `.fgos/config.json`, main `7751773ad`)

```json
"defaults": { "tier": "standard" },
"maxTier": "flagship",
"tierFallback": {
  "nano|mini|standard|advanced": ["gemini", "deepseek", "z-ai", "claude", "openai"],
  "flagship|frontier": ["claude", "openai", "gemini", "xai", "deepseek", "z-ai"]
},
"capabilities": {
  "execute":               { "prefer": [{"executor":"gemini"},{"executor":"deepseek"},{"executor":"glm"},"claude"] },
  "docs:write":            { "description": "...", "serves": {...} },
  "code:*":                { "roles": { "red-team": { "prefer": ["xai"] } } },
  "code:review|code:debug":{ "prefer": [{"executor":"openai","invocation":"codex-cli-bwrap"},{"executor":"claude","invocation":"claude-cli-bwrap"}] },
  "architecture:frame":    { "tier": "flagship", "rigor": "high", ... },
  "architecture:shape":    { "tier": "flagship", "maxTier": "frontier", "rigor": "critical", ... },
  "architecture:critique": { "tier": "flagship", "maxTier": "frontier", "rigor": "high", "seats": {"producer":{"tier":"frontier"}}, ... },
  "architecture:synthesize": { "tier": "flagship", "maxTier": "frontier", "rigor": "critical", "seats": {"producer":{"tier":"frontier"}}, ... },
  "architecture:explain":  { "tier": "flagship", "rigor": "critical", ... }
}
```

(The `tierFallback` keys are abbreviated: each tier is its own key in the file. `mini` is listed but has no cell in any family.)

Live bindings (`fgos dispatch explain --for <cap> --json`, herdr present):

| Capability | Binds today |
|---|---|
| `execute`, `code:implement`, `code:test`, `code:refactor`, `coding:implement`, `fgos-coding-implement` | gemini#omp-herdr, `standard` (defaults.tier), `gemini-3.8-flash-medium`, account gemini/tetcu72 |
| `code:review`, `code:debug` | openai#codex-cli-bwrap, `standard`, `gpt-5.6-terra` → claude#claude-cli-bwrap sonnet |
| `docs:write` (no prefer) | gemini#omp-herdr `standard` via `tierFallback.standard`. openai is last in the walk, as **openai#pi-herdr `gpt-5.6-terra`** |
| `coding:plan` | claude#claude-herdr-bwrap, `standard`, sonnet |

Architecture council, per seat (doctor dry-bind; all 62 seats bind):

| Seat | Tier (source) | Binds |
|---|---|---|
| shape / system | frontier (workflow recommendation; cap `architecture:shape.maxTier`) | openai `gpt-6-astra` |
| shape / alternative, constraint, synthesis | flagship | claude opus, gemini argon-high, xai grok-4.6 |
| critique / producer | frontier (`seats.producer.tier`) | **xai grok-4.6**, the same model as xai's flagship cell |
| critique / reviewer, red-team | flagship | **deepseek v4-pro**, gemini argon-high |
| synthesize / producer | frontier | claude fable |
| synthesize / reviewer, red-team, tester | flagship | gemini, **deepseek v4-pro**, xai |
| frame, explain | flagship | openai gpt-6.1-sol; claude opus |

Owner decision 2 (synthesizer frontier, other architecture seats flagship, frontier above the flagship cap) is already met in forgentX, because `37ab5c0fc` converted it to capability `tier`/`maxTier`/`seats`. Nothing was lowered. Two side effects are open questions Q2 and Q3 (§7).

### 2.2 Change F1: code work at `advanced` (owner decision 1)

```diff
   "capabilities": {
     "code:*": {
-      "roles": { "red-team": { "prefer": ["xai"] } }
+      "roles": { "red-team": { "prefer": ["xai"] } },
+      "tier": "advanced"
     },
+    "coding:*": { "tier": "advanced" },
     "fgos-coding-implement": {
       ...
+      "tier": "advanced"
     },
```

Why it is needed: before SEAT, code could only reach `advanced` through rigor, and no rigor value mapped to `advanced`. That was B1 open question 1, which the big lead then answered with "(b) standard". SEAT's capability `tier` is exactly the per-capability default the owner asked for (owner 10-17: code = sonnet = advanced, not opus). That answer is now superseded. `fgos-coding-implement` has no `:` in its name, so no prefix entry covers it and it needs its own line.

Effect (verified with explain against the scratch copy):

| Capability | Before → after |
|---|---|
| `code:implement`, `code:test`, `code:refactor`, `coding:implement`, `fgos-coding-implement` | gemini flash-medium → **gemini#omp-herdr `gemini-3.8-flash-high`** (tetcu72); walk: deepseek `v4-pro` → glm `glm-5.3` → claude sonnet |
| `code:review`, `code:debug` | codex `gpt-5.6-terra` → **codex `gpt-5.6-sol`** → claude sonnet (pins unchanged; see Q1) |
| `coding:plan`, `coding:discover`, `coding:explore`, `coding:validate` | claude sonnet `standard` → claude sonnet `advanced` (claude's standard and advanced cells are both sonnet, so the model does not change; the walk's other families get their advanced cells) |

`maxTier: flagship` is unchanged and is not reached.

### 2.3 Change F2: doc-plan Doer routing as config (owner decision 3)

```diff
     "execute": {
       ...
+      "tier": "advanced"
     },
     "docs:write": {
       "description": "...",
       "serves": { ... },
+      "tier": "flagship",
+      "prefer": ["openai", "claude"]
     },
```

Effect (verified):

- `execute` → **gemini#omp-herdr `gemini-3.8-flash-high`, account gemini/tetcu72** (the only gemini account). `execute`'s `prefer` leads with gemini, so this is the owner's "non-docs turns on flash-high at tetcu72". Fallback walk: deepseek v4-pro, glm-5.3, claude sonnet.
- `docs:write` → **openai#pi-herdr `gpt-6.1-sol` at `flagship`**, accounts tried in declared order tetcu72, fgovn, tetnu; then claude#claude-herdr-bwrap opus.
  - The model matches the owner's `gpt-6.1-sol`.
  - The invocation is **pi-herdr, not Codex**. Commit `0fc014d3e` (2026-10-21 20:14) put `pi-herdr` in openai's invocation list before `codex-herdr`, and herdr is the default transport when present. With no herdr it would be `codex-cli-bwrap`.
  - The pi template hardcodes `--thinking medium`, so the effort is medium unless the cell carries an effort (§5).
  - The owner's 10-20 Doer runs went through the Codex TUI. pi on openai is not yet proven by a real docs run (validation step 4).
- How the Doer launches change:
  - Docs turns: `fgos run "<pointer prompt>" --capability docs:write [--writes … --worktree …]`.
  - Other turns: `fgos run … --capability execute`, or no flag, since `execute` is the default.
  - Drop `--override '{"tier":…}'` from both. Raising the tier is refused (`tier-escalation-unauthorized`), and the config now gives the tier.
  - `--provider` stays a soft preference.
- Why `claude` is second for docs: with `prefer: ["openai"]` alone, a seat whose three openai accounts all fail is refused. claude opus is the premium fallback the flagship tier already allows. Dropping it is a one-word edit if the owner wants openai only.

### 2.4 No other forgentX change

- GLM and DeepSeek cells (owner decision 7) are already live: z-ai nano/standard `glm-5.3-flash` (thehive first, then openrouter), advanced `glm-5.3`; deepseek nano/standard `deepseek-v4.1-flash`, advanced `v4-pro`.
- The code `prefer` lists `[gemini, deepseek, glm, claude]` are already live, except `code:review`/`code:debug` (Q1).

## 3. mdview

### 3.1 Current state (live file; `setup` converted it on 2026-10-22, backup `.fgos/config.json.pre-seat-binding-20261021T200242499Z`)

- The conversion deleted `rigorToTier` and added `defaults.tier: standard`.
- The config has no `maxTier` and no `tierFallback`.
- No architecture capability carries `rigor` or `tier`. Each one has `prefer: [claude-herdr, openai, gemini, xai, glm-herdr]`.
- `modelPolicies` differ from forgentX:
  - gemini flagship/frontier is `gemini-3.1-pro-low`/`-high`;
  - xai has no `nano` cell;
  - there are no `@pool` entries.

Effect today (doctor dry-bind, 55 of 58 seats bind):

| Seat | Before SEAT | Now |
|---|---|---|
| `architecture-advisory(-reopen)/synthesize-recommendation` all seats | flagship (unit `rigor: high` → `rigorToTier`) | **standard**: claude-herdr sonnet, codex terra, agy flash-medium |
| shape / system | standard | frontier (workflow recommendation; no cap) |
| every other architecture seat | standard | standard |
| `group-cognition/sense-making-panel` member-1..3 | bound via default executor | **not bound**: no prefer, no tierFallback |
| `docs:write` (`fgos run --capability docs:write`) | default executor | **refused** `headless-no-executor` |

### 3.2 Change M1: `tierFallback` (owner B1 decision 2)

```diff
   "runner": {
+    "tierFallback": {
+      "nano":     ["gemini", "deepseek", "z-ai", "claude", "openai"],
+      "mini":     ["gemini", "deepseek", "z-ai", "claude", "openai"],
+      "standard": ["gemini", "deepseek", "z-ai", "claude", "openai"],
+      "advanced": ["gemini", "deepseek", "z-ai", "claude", "openai"],
+      "flagship": ["claude", "openai", "gemini", "xai"],
+      "frontier": ["claude", "openai", "gemini", "xai"]
+    },
```

- These are the owner's tier groups: doer tiers use the cheap families; flagship and frontier use only the premium ones. Unlike forgentX after `0fc014d3e`, deepseek and z-ai are not in the premium lists (see Q3).
- `mini` has no cells yet, so doctor `tier-fallback` warns until §5 lands.
- Effect: all seats bind. `group-cognition:explore` and `docs:write` now bind gemini#agy-herdr-mucdong flash-medium, then deepseek, glm, claude, openai.
- For the family `claude`, the walk takes executor `claude` (claude-cli-bwrap), not `claude-herdr`. That is a consequence of `executor-family-unique` failing here: the file has two claude and two z-ai executors. This proposal does not fix that. Merging those executors is its own item.

### 3.3 Change M2: architecture council restored above `standard` (owner decision 2)

```diff
+    "maxTier": "flagship",
     "capabilities": {
+      "architecture:*": { "tier": "flagship" },
       "architecture:shape": {
         ...
+        "maxTier": "frontier"
       },
       "architecture:critique": {
         ...
+        "maxTier": "frontier",
+        "seats": { "producer": { "tier": "frontier" } }
       },
       "architecture:synthesize": {
         ...
+        "maxTier": "frontier",
+        "seats": { "producer": { "tier": "frontier" } }
       },
```

Effect (dry-bind, herdr present):

| Seat | Tier | Binds |
|---|---|---|
| synthesize / producer | frontier | claude-herdr fable |
| shape / system | frontier | claude-herdr fable |
| critique / producer | frontier | claude-herdr fable |
| synthesize / reviewer, red-team | flagship | codex `gpt-6.1-sol`, agy `gemini-3.1-pro-low` |
| frame, explain, other shape seats | flagship | claude-herdr opus, codex `gpt-6.1-sol`, agy `gemini-3.1-pro-low`, xai grok-4.6 |

- No seat is lower than before SEAT. `synthesize-recommendation` goes from flagship back to frontier for its producer.
- `maxTier: flagship` mirrors forgentX (owner decision 1). Without it, nothing caps a future workflow recommendation. Each `architecture:*` `maxTier: frontier` exists only to let the declared frontier seats pass that cap.
- **Not included: copying forgentX's architecture `rigor` (critical/high).** With `rigor: critical` on `architecture:synthesize`, the doctor dry-bind (session without herdr) refuses the new `tester` checker seat with `posture-unavailable`: `glm-herdr` has no invocation for that posture. Copying the rigor first needs a `prefer` fix in mdview. That is a separate item; this proposal changes tiers only.

### 3.4 Change M3: code at `advanced`, with the same lines as forgentX F1 (owner decision 1)

```diff
+      "code:*": { "tier": "advanced" },
+      "coding:*": { "tier": "advanced" },
       "execute": { ..., "tier": "advanced" },
       "fgos-coding-implement": { ..., "tier": "advanced" },
```

Effect:

- `code:implement` → gemini#agy-cli-bwrap-mucdong `gemini-3.8-flash-high`, then claude sonnet.
- `code:review`/`code:debug` → codex `gpt-5.6-sol`.
- `fgos-coding-implement` → agy-herdr-mucdong flash-high.
- `execute`, `code:test`, `code:refactor`, `coding:plan` → claude sonnet (no model change).

No `docs:write` line is added: owner decision 3 is about the forgentX doc plan.

Doctor after M1 to M3 (run against the scratch copy):

| Doctor row | Result |
|---|---|
| `seat-binding-dry-bind` | pass, 59 of 59 seats |
| `tier-fallback` | pass, with the `mini` warning |
| `model-policy-pools` | pass |
| `executor-family-unique` | fail, **as before** |
| `blind-steps-use-proven-pools` | fail, **as before**, with the same 4 `glm-herdr` entries. The proposal changes no `prefer`, so it neither causes nor fixes this |

## 4. mcp-skill-hub

### 4.1 Current state (live file; backup `.fgos/config.json.pre-seat-binding-20261021T200244529Z`)

- No capability has `prefer`, `tier` or `rigor`.
- The config has no `tierFallback` and no `maxTier`.
- `modelPolicies` are the same as mdview's.
- Executors: claude, claude-herdr, glm, glm-herdr, openai (codex and pi on fgovn/tetcu72/tetnu), gemini (agy, mucdong/tetnu), xai (omp, vantt), deepseek (pi, openrouter).
- Accounts come from the global `runner.providers`: openai 3, xai vantt, gemini tetcu72, z-ai and deepseek openrouter. Claude uses its own login.
- Doctor `seat-binding-dry-bind`: **0 seats of 27 units bind**; 42 seats are "no pool configured (headless-no-executor)". Before SEAT these seats fell back to the default executor. SEAT removed that fallback (§5.3), so every Workflow unit is refused here today.

### 4.2 Changes H1 to H3: the same three blocks as mdview (M1, M2, M3, without the `fgos-coding-implement` line, since this file has no such capability)

The minimum that makes Workflow units run again is **H1 (`tierFallback`) alone**: with it, 59 of 59 seats bind. It uses only families this workspace has executors and accounts for (gemini via agy, deepseek and glm via openrouter, claude, openai via codex/pi, and xai for the premium tiers).

Effect with H1 to H3:

- Every capability without `prefer` walks the tier list:
  - doer tiers: gemini#agy-herdr-mucdong, then deepseek#pi-cli-bwrap-openrouter, glm#pi-cli-bwrap-openrouter, claude#claude-cli-bwrap, openai#codex-herdr-fgovn;
  - flagship and frontier: claude, openai, gemini, xai.
- Code: gemini flash-high at `advanced`.
- Architecture:
  - frontier seats (shape/system, critique producer, synthesize producer) run claude fable;
  - the other seats run at flagship, spread across claude opus, codex gpt-6.1-sol, agy gemini-3.1-pro-low and xai grok-4.6.

Doctor after H1 to H3 (against the scratch copy):

| Doctor row | Result |
|---|---|
| `seat-binding-dry-bind` | pass, 59 seats |
| `blind-steps-use-proven-pools` | pass |
| `tier-fallback` | pass, with the `mini` warning |
| `executor-family-unique` | fail, as before |

The architecture `rigor` mirror does pass here (62 seats). For one shape across both workspaces it is left out here too, as in mdview.

Risk to know about: in doer tiers this workspace now leads with gemini through **agy** (mucdong). One 2026-09-18 track recorded agy idling and producing no evidence, while openai and xai were reliable. Owner decision 2 fixed this order, so the proposal keeps it. If it repeats, narrow it: put `openai` first in the doer lists of this workspace only.

## 5. Model refresh (SEAT plan step 7; owner picks per cell)

The cells come from the [ladder research](research-261020-1339-model-family-tier-ladders.md) §5.

- Effort vocabulary is `low, medium, high, max`. `xhigh` is not accepted yet.
- Object cells with effort are project-only: the global sanitizer drops them.
- Vendor model claims are unverified (spec §13).
- Applied to a scratch copy of forgentX, the whole block loads, and doctor passes `tier-fallback` (no `mini` warning left), `seat-binding-dry-bind` (62 seats) and `model-policy-pools`.

```diff
   "modelPolicies": {
     "claude":   { ...,
+      "mini": { "model": "haiku", "effort": "high" } },
     "openai":   {
-      "nano": "gpt-5.6-luna",
+      "nano": { "model": "gpt-6-luna", "effort": "low" },
+      "mini": { "model": "gpt-6-luna", "effort": "high" },
-      "advanced": "gpt-5.6-sol",
+      "advanced": { "model": "gpt-6.1-sol", "effort": "medium" },
-      "flagship": "gpt-6.1-sol",
+      "flagship": { "model": "gpt-6.1-sol", "effort": "high" },
       ... },
     "gemini":   { ..., "mini": "gemini-3.8-flash-low" },
     "xai":      { ..., "mini": "grok-4.3",
-      "flagship": "grok-4.6", "frontier": "grok-4.6"
+      "flagship": "grok-4.7", "frontier": "grok-4.7" },
     "deepseek": { ..., "mini": <same list as standard> },
     "z-ai":     { ..., "mini": <same list as standard> }
   }
```

- **`mini`.** gemini, deepseek, z-ai and xai reuse their `nano` or `standard` cell. These are declared collapses, which §5.3 allows. claude and openai gain real mini cells.
- **`gpt-6.1-sol` at `advanced`.** This would also move code reviews (F1) from `gpt-5.6-sol` to `gpt-6.1-sol` at medium effort.
- **`docs:write` effort.** With an effort on the openai flagship cell, `docs:write` runs `gpt-6.1-sol` at `high` instead of pi's hardcoded `medium`. Explain shows `effort=high`.
- **mdview and mcp-skill-hub** get the same block. They also need gemini flagship/frontier `gemini-3.1-pro-*` → `gemini-4-argon-high` to match forgentX and the global file, and an xai `nano` cell.
- **Empty deepseek and glm cells at flagship/frontier.** These cannot be expressed in a project file alone. Deleting the key in the project falls through to the same cell in `~/.fgos/config.json`, which merges per key; this was verified. A `null` cell is a load error. See Q3.

## 6. Global `~/.fgos/config.json`

- No change is needed for §2 to §4. Every new key goes into project files, as spec §9 step 5 requires.
- A global edit is needed only if the owner picks Q3 (c): deleting `modelPolicies.deepseek.flagship/frontier` and `modelPolicies.z-ai.flagship/frontier`. Every workspace release on the machine reads this file. A missing cell makes an older release fall back to `executor.model`, and SEAT skips that family. Take a backup first.
- The global file still carries `runner.rigorToTier`. The new release ignores it and prints one stderr note per command. Leave it until no older release on any machine reads the file.

## 7. Open decisions for the owner

**Q1: `code:review` / `code:debug` pins.**

- **What:** both are pinned to `openai#codex-cli-bwrap`, then `claude#claude-cli-bwrap`. The pre-SEAT phase 06 proposed replacing them with `[gemini, deepseek, glm, claude]`.
- **Cause:** two owner answers conflict:
  - owner 10-20 13:26 (spec §10.4): "code:review and code:debug keep codex, then claude";
  - spec §8 names the pins as candidates to remove, keeping only the confinement requirement.
- **Options:**
  - (a) keep as is. Cost: none. Reviews never use a herdr pane.
  - (b) keep the family order but drop the invocation pin: `prefer: ["openai", "claude"]`, keeping `confinement: required`. Cost: binds codex-herdr or pi-herdr, which carry the recorded `herdr-partial-maturity` caveat.
  - (c) the cheap families from the pre-SEAT proposal. Cost: reverses the 10-20 answer, and review quality moves to flash.
- **Recommendation:** (a). It is the later owner answer, and F1 already moves reviews to `advanced`.
- **Scope:** forgentX and mdview `code:review`/`code:debug` only.

**Q2: the frontier critique seat lands on a model that is not frontier.**

- **What:** `architecture:critique` `seats.producer.tier = frontier` binds **xai grok-4.6**, which is xai's flagship cell too. With the §5 refresh it would be grok-4.7 in both cells.
- **Cause:** the critique `prefer` leads with xai, and xai has no model above flagship.
- **Options:**
  - (a) add `"prefer": ["openai", "claude"]` to that seat. Cost: one `gpt-6-astra` call per critique round. Verified: the producer binds openai gpt-6-astra, the reviewer and red-team bind xai and gemini, 62 seats bind.
  - (b) keep xai. Cost: the "frontier" label buys nothing.
  - (c) drop the seat's frontier tier. Cost: reverses the "one critique seat frontier" answer (10-19 23:20, "tạm đồng ý").
- **Recommendation:** (a).
- **Scope:** forgentX. mdview and mcp-skill-hub already bind claude fable there.

**Q3: deepseek and GLM in premium seats.**

- **What:** commit `0fc014d3e` (10-21 20:14) added deepseek and z-ai to forgentX's flagship and frontier `tierFallback`. Because architecture `prefer` lists name deepseek, `deepseek-v4-pro` now takes **primary** flagship seats: critique reviewer and synthesize red-team, in both architecture workflows.
- **Cause:** that commit conflicts with B1 decision 2 (premium tiers fall back only to claude, openai, gemini, xai) and with SEAT step 7 ("empty deepseek/glm cells where the family does not reach a tier").
- **Options:**
  - (a) keep. Cost: an advanced-class model judges in the council.
  - (b) keep deepseek as backup only: move `{"executor":"deepseek"}` to the end of each architecture `prefer`, project only. Verified: no deepseek primary seat is left, 62 seats bind.
  - (c) make the families unmet at flagship/frontier: remove them from `tierFallback.flagship/frontier` and delete their cells in the project **and** global file. Cost: a global edit, and no premium backup if all four premium families fail.
- **Recommendation:** (b). It keeps the backup that `0fc014d3e` wanted and the council quality decision 2 wanted.
- **Scope:** forgentX architecture capabilities. mdview and mcp-skill-hub get M1's premium lists without deepseek/z-ai, so ask whether to align forgentX's lists to them.

**Q4: model refresh (§5), owner taste per cell.**

- **What:** the cells are new model ids plus `mini` cells. Nothing binds `mini` today, so the `mini` cells have no runtime effect until a capability or seat asks for `mini`.
- **Cause:** the SEAT plan deferred these to the owner.
- **Options:**
  - (a) adopt the whole block. Cost: `gpt-6.1-sol` on code reviews and `advanced` turns, at the same list price as 5.6-sol (research §1).
  - (b) adopt only the `mini` cells and `grok-4.7`.
  - (c) defer.
- **Recommendation:** (a) for forgentX. For mdview and mcp-skill-hub, adopt it after one real run each.
- **Scope:** `modelPolicies` of the three project files.

Decided inside the frame and reported (no question):

- **`docs:write` uses pi-herdr.** Keep `0fc014d3e`'s invocation order and prove it with one real run. If pi fails on gpt-6.1-sol, pin `{"executor":"openai","invocation":"codex-herdr"}`.
- **`coding:*` planning stages at `advanced`.** This follows owner 10-17: code leads and reviews run on sonnet.
- **mdview and mcp-skill-hub get `maxTier: flagship` and tier-only architecture blocks.** The reason is the rigor-mirror evidence in §3.3.
- **mcp-skill-hub keeps the gemini-first doer order.** Owner decision 2 fixed it.

## 8. Validation and rollback

Method used for this report (read-only):

1. The proposed files were built as scratch copies under the session scratchpad. `fgos dispatch explain --for <cap> --dir <scratch-root> --json </dev/null` was run from inside each workspace, so the activated host is used.
2. The real doctor functions were called on each copy: `checkSeatBindingDryBind`, `checkBlindStepsUseProvenPools`, `checkTierFallback`, `checkExecutorFamilyUnique` and `checkModelPolicyPools`, the first two with the doctor's own headless session without herdr. Per-seat tables in §2 to §4 use a herdr-present session, the way live runs bind.
3. Live doctor (`fgos doctor --json </dev/null`) was run in each workspace for the current state.

After approval, per workspace:

1. Back up: `mkdir -p .fgos/runtime/config-backup-261022-<hhmm> && cp .fgos/config.json .fgos/runtime/config-backup-261022-<hhmm>/`. Add `~/.fgos/config.json` only for Q3 (c).
2. Apply only the approved blocks, one commit per block in forgentX (config only). mdview and mcp-skill-hub follow their own repos' rules.
3. Run `fgos doctor --json </dev/null` and read these rows:

   | Doctor row | Expected |
   |---|---|
   | `seat-binding-config` | pass |
   | `seat-binding-dry-bind` | forgentX 62 seats, mdview 59, mcp-skill-hub 59, no policy refusal |
   | `tier-fallback` | no warning once §5 `mini` cells land |
   | `blind-steps-use-proven-pools` | unchanged |

4. `fgos dispatch explain --for <cap> --json </dev/null` for every changed capability: `execute`, `docs:write`, `code:implement`, `code:review`, `coding:plan`, `fgos-coding-implement`, and each `architecture:*`. Compare with the tables above.
5. forgentX only: run `node --test test/runner/execution/bind-committed-config.test.mjs test/runner/dispatch-policy-baseline-snapshot.test.mjs`. Both read the committed config. Review the snapshot diff line by line; do not regenerate it blindly.
6. One real round per changed path:
   - a docs turn with `--capability docs:write` (pi on gpt-6.1-sol);
   - an `execute` turn (gemini flash-high);
   - in mcp-skill-hub, one Workflow unit (it is refused today).

Rollback: copy the backup back over `.fgos/config.json`, or revert the config commit. No release change is involved. The `.pre-seat-binding-*` files are the pre-SEAT configs; the old release needs them, the current release refuses them. Do not use them for this rollback.

## Unresolved

- Whether pi on `openai` serves `gpt-6.1-sol` correctly in a real docs turn. Validation step 6 proves it.
- Whether the `effort` field reaches deepseek and z-ai through OpenRouter. Spec §13 lists this as unverified. It matters only if those cells gain effort.
