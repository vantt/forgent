# tsk-45f — plan

Mode: **standard** (tier `standard`, risk `standard` — already correct on the
item, no reclassification needed). No `CONTEXT.md` — scope was rewritten
directly via `fgos decision` on this item (2026-08-16) plus D10/D11/D13 on
tsk-60f, never a formal `fgos-coding-exploring` round.

## Impact-analysis capability gate

`fgos tool query --capability impact-analysis --status present` → gitnexus
present. Posture: **full**. `impact()` MUST run before editing
`toolsFromCapacities`/`decideCapacityCli`/`resolveExecutorConfig`, per
CLAUDE.md.

## Approach

Three pieces, in dependency order (piece 3's tool-mapping is what piece 2's
hand-back reads):

1. **Field consolidation** (D11) — `capacity.for` (array) becomes the one
   read path; `capacity.capability` (singular, tool-registry-only) is
   folded in as a tolerant fallback, never removed as accepted input this
   item (retiring it fully is a natural, separate, near-zero-risk cleanup
   once nothing writes it — out of this item's necessary scope, avoiding
   overreach past what D11 actually requires: unify the READ paths).
   - `toolsFromCapacities` (`src/state/tool-registry.mjs:74-91`): change
     `normalizeCapability(capacity?.capability)` to read
     `capacity?.for?.[0] ?? capacity?.capability` before normalizing —
     `for` wins when present (a capacity may serve several capabilities;
     the tool-registry's own per-entry shape only ever carried one, so the
     first is the correct single-value projection, not a lossy guess).
   - `validateCapacityShape` (`dispatch.mjs:637-728`): today only `for`
     validates against the `capabilities` catalog (line 671-682); the
     header comment at line 735 flags `capability`'s own catalog check as
     "a later task's scope" — this is that task. Add the same
     `capabilityNames.has(...)` check for `capacity.capability` when
     present, so a typo'd/undeclared `capability` string is now caught the
     same way a bad `for` entry already is.
   - **Config migration (D11's step (b), atomic-landing lesson from
     tsk-in1): NOT part of this branch's own commits.** `.fgos/config.json`
     is never writable from a linked worktree (ADR0020) and a worker-branch
     commit touching `.fgos/` is refused outright (`fgos-write-rejected`
     guard). Migrating `gitnexus`/`herdr`'s real `capability` → `for: [...]`
     happens as a direct main-checkout commit immediately after this item's
     code merges (mirrors AGENTS.md's own documented pattern for exactly
     this class of change) — prepared as ready-to-paste JSON in this plan
     so the merge-time window is short. Deferring this off the branch is
     itself the atomicity fix: once the code merges tolerant of BOTH
     fields, the config write can land in its own single commit with no
     window where anything reads a half-migrated file.

2. **MCP hand-back** (D10) — `decideCapacityCli`
   (`dispatch.mjs:1771-1855`, exact lines will shift after piece 1's edit)
   gains a new branch: once a `capacityId` resolves (by name or by `--for`
   purpose) and `decideCapacityDispatchMechanism` would otherwise answer
   `out-of-process`, check whether the capacity's own `invocations` include
   a `via:"mcp"` entry declaring a `tools` map (piece 3). If it does **and**
   the requested purpose (the `--for` value, or — for a direct
   `capacityId` call with no purpose — the capacity's own `for[0]` when it
   names exactly one) has an entry in that map, override the mechanism to
   `in-process` and add `mcpTool` to the result alongside `agentType`
   (never both on the same result — a capacity hands back exactly one kind
   of live-capability payload). **Never** builds an MCP client inside
   `dispatch.mjs`, **never** touches Gate B3 (`resolveExecutorConfig`,
   `dispatch.mjs:1033-1047`) — that gate still throws exactly as before for
   an mcp-only capacity someone mistakenly tries to `execute` (a caller
   that skipped `decide` and went straight to `execute`); the hand-back
   only changes what `decide` itself answers, so a caller who follows
   AGENTS.md's own "always ask decide first" rule (tsk-60f D1) never
   reaches Gate B3 for an MCP capacity at all.

3. **Invocation-level capability→tool mapping** — extend
   `validateInvocationShape` (`dispatch.mjs:600-636`, exact lines may
   shift) to accept an optional `tools` field on a `via:"mcp"` invocation:
   an object mapping a capability name (must already be in the
   `capabilities` catalog, same discipline as `for`) to an MCP tool
   identifier string. Read by piece 2's hand-back only; `resolveExecutorConfig`
   itself never reads it (mcp invocations already never reach that
   function's cli-only selection, Gate B2/B3 unchanged).

## Risk map

| Piece | Risk | Proof point |
|---|---|---|
| 1 (field read) | medium — touches `toolsFromCapacities` (read by `fgos tool query`/`fgos tool check`) and `validateCapacityShape` (read by every `ensureRunnerConfigForDir` call, i.e. every dispatch) | `impact({target:"toolsFromCapacities",direction:"upstream"})` and `impact({target:"validateCapacityShape",direction:"upstream"})` before editing (posture: full); existing `test/state/tool-registry.test.mjs`/`dispatch.test.mjs` config-validation suites must stay green with zero behavior change for a `capability`-only or `for`-only capacity |
| 1 (config migration) | high — a direct main-checkout write outside the normal branch/review path | prepare the exact JSON diff in this plan.md ahead of time (below) so the live window is a single paste-and-commit, not on-the-fly editing; verify with a real `fgos tool query --capability impact-analysis` immediately after, per this item's own verify |
| 2 (MCP hand-back) | medium — new branch in `decideCapacityCli`, the same function tsk-60f D2/D3 just changed | re-run `impact({target:"decideCapacityCli",direction:"upstream"})` (tsk-60f's own plan already confirmed LOW/1-direct-caller as of its own landing; re-check since this file just moved) |
| 3 (tools map) | low — additive optional field on an existing validated shape | existing invocation-shape tests stay green; new tests cover the field explicitly |

## Real config to migrate at merge time (piece 1's step (b))

Current live `runner.capacities` (`.fgos/config.json` on `main`, read
2026-08-16):

```json
"gitnexus": { "kind": "tool", "capability": "impact-analysis", ... },
"herdr":    { "kind": "tool", "capability": "pane-labeling", ... }
```

Target, additive (`for` added, `capability` LEFT IN PLACE — piece 1's code
already reads `for` first with `capability` as fallback, so leaving both
present during the transition is itself the safe, reversible middle state;
dropping `capability` from these two entries is separate future cleanup,
not required for this item's own verify to pass):

```json
"gitnexus": { "kind": "tool", "capability": "impact-analysis", "for": ["impact-analysis"], ... },
"herdr":    { "kind": "tool", "capability": "pane-labeling", "for": ["pane-labeling"], ... }
```

`gitnexus`'s `invocations[0]` (`{"via":"mcp","command":"mcp:gitnexus"}`)
also gains `"tools": {"impact-analysis": "mcp__gitnexus__impact"}` in the
same commit (piece 3's shape) — the concrete case this item's own `verify`
field demonstrates.

## Shape

No split. One item, 3 pieces, sequential commits on `fgw/tsk-45f`; the
config-migration half of piece 1 lands as a separate direct-main commit at
merge time, prepared above.

## Outstanding questions

None
