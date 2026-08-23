# Plan: migrate `needs`/`for` — demand-side capability declaration (tsk-1o7)

Mode: **high-risk** — 4 flags counted per `fgos-routing`'s Mode-gate: external
systems (dispatch to external CLI providers), public contracts (capacity
config schema + `capacity-dispatch-fallback.md`'s own documented Step B
contract), existing covered behavior (`resolveExecutorConfig` already has a
test suite that must stay green), audit/security (item's own framing: a
missed spot fails *silently*, no error, no warning). 4+ flags → high-risk,
consistent with the item's own pre-set `risk: high` / `tier: heavy`.

Direct-entry into this skill (no `fgos-routing` Orient hand-off this
session, no prior `plan.md` round): lane decided here per the fallback rule,
not re-derived from a hand-off that never happened.

## Context

`tsk-1o7` carries no `docsRef`/`CONTEXT.md` of its own. Its full description
is a condensed copy of §7.2 of `docs/history/dispatch-concept-boundary/
DISCUSSION.md` (owned by `tsk-5td`, anchor `#task-demand-declares`) — a
`fgos-coding-shaping` document, not a `fgos-coding-exploring` one. That doc's own
§4 ("Quyết định đã chốt") is the locked-decision source this plan cites,
since `fgos-clarifying` already found this item's intent clear enough to
skip a Socratic pass:

- **D5** — fgOS accepts US-027: binding matches by *capability promise*,
  never by tool name.
- **D6** — the demand side declares two fields: `needs` (capability →
  which provider) and `for` (purpose `gather`|`judge` → which lane).
- **D15 boundary** (explicitly out of scope here, per the item's own "KHONG
  LAM O DAY"): no `carries` field (that's `tsk-2ie5`), no `allowCrossProvider`
  semantic change, no `tier` semantic change.
- `for` has **no real code consumer yet** — `tsk-2ie5` is named as its first
  real consumer (§7.2). This item adds `for` to the capacity schema/
  vocabulary only; only `needs` gets functional consumption (the actual
  match-key change `resolveExecutorConfig` performs).

## Blast radius (impact-analysis: **full** — GitNexus registered and
`present`, live-checked 2026-08-09)

`impact(resolveExecutorConfig, upstream)`: **risk HIGH**, 6 upstream
symbols, 3 execution flows affected (`spawnWorker`, `dispatchClaimedItem`,
`runWatch`). This differs from the item description's own recollection
("CRITICAL, 8 upstream symbol, 7 execution flow", sourced from the same
DISCUSSION.md) — recording the live number honestly rather than the
stale one. The direction and conclusion (a shared, high-risk function on
the runner's dispatch path) are unchanged either way; this is a numbers
discrepancy, not a scope disagreement.

## Approach

Chosen path: an **additive, backward-compatible** capacity-schema extension
plus a fallback-preserving resolve-path change — **split into two items**
because one of the three files the item names is `.fgos/config.json`, which
ADR0020's `fgos-write-rejected` guard permanently blocks from `fgos approve`
on a `fgw/<id>` branch (`docs/how-to/fix-fgos-write-rejected-merge-block.md`;
precedent `tsk-4eu`/`tsk-5ge`). Per `AGENTS.md`'s own instruction, this split
happens now, at plan time, not discovered at merge time.

Alternative rejected: doing the `.fgos/config.json` edit inside this same
branch and hand-editing it onto main at merge time the way `tsk-5ge` did
for `tsk-4eu`. Rejected because `tsk-4eu`/`tsk-5ge` is a precedent for a
*post-hoc* split forced by a late discovery, not a pattern to imitate
deliberately — the ADR0020 warning is baked into this item's own
description specifically so a session doesn't have to rediscover it late.

### This item (tsk-1o7) — code, docs, tests only

1. **`validateCapacityShape`** (`src/runner/dispatch.mjs:443-467`): accept
   two new optional fields — `needs` (non-empty string when present) and
   `for` (one of `gather`/`judge` when present, D2's own split) — same
   "optional, byte-identical when absent" style every sibling field here
   already uses (`model`, `allowCrossProvider`, `agentType`,
   `forceCliSpawn`).
2. **`resolveExecutorConfig`** (`dispatch.mjs:605-642`), the
   `capacity.kind === 'cli' && fgosDir` presence-check block (lines
   608-621): when `capacity.needs` is set, resolve by searching
   `listWork(fgosDir).tools` for entries where `tool.capability ===
   capacity.needs`, then require at least one match with
   `resolvedStatus(...) === 'present'` — same two-step "registered? /
   present?" error shape already thrown today, just keyed on capability
   instead of name. **When `capacity.needs` is absent, keep today's exact
   `tools[capacityId]` name lookup unchanged.** This is the backward-compat
   seam: the real `submit-assist-classify` capacity in production
   `.fgos/config.json` has no `needs` field until the child item lands, and
   must keep resolving exactly as it does today until then.
3. **`.claude/skills/_shared/capacity-dispatch-fallback.md` Step B**
   (line 66): today's presence-check queries `--capability <CAPACITY_ID>` —
   the capacity's own id, not a real capability (bug #2 from the item's
   own list). Change Step A's already-loaded `cfg` read to also capture
   `cfg.runner.capacities[<CAPACITY_ID>].needs`, and have Step B query
   `--capability <that value>` when present, falling back to today's
   `--capability <CAPACITY_ID>` when the capacity declares no `needs` yet —
   same backward-compat seam as #2.
4. **Supersede D3** of `docs/history/agent-executor-submit-assist-classify/
   CONTEXT.md` (line 46): append a new decision noting D3's claim (the tool
   "must be registered via `--capability submit-assist-classify` before
   `resolveExecutorConfig` can resolve") conflated the tool's own free-text
   `capability` label with the resolver's actual match key (`--name`,
   today). After this item, `--capability` becomes the real match key only
   once the owning capacity declares `needs`. Append, cite, never rewrite
   D3 in place.
5. **`test/runner/dispatch.test.mjs`**: add the two tests `item.verify`
   already names — (a) a second tool registered under the same
   `capability` as an existing one resolves correctly by `needs`, with no
   name coincidence involved; (b) a capacity declaring `needs` resolves
   through capability match, proving the old `tools[capacityId]` lookup is
   no longer load-bearing for a migrated capacity. Every existing test in
   this file stays green unmodified — they exercise the no-`needs`
   fallback path, which stays byte-identical.

### Child item (created below, `.fgos/config.json` only)

Add `needs`/`for` to the real `judge-discovery`, `judge-decompose`,
`submit-assist-classify` capacity blocks in `.fgos/config.json`, and
re-register `submit-assist-classify`'s tool `capability` (via `fgos tool
register`, a state-store verb — not a `.fgos/config.json` edit, safe on a
branch) to match whatever label the child item settles on. Picking that
real label and setting `needs` to match are the same act as the config
edit itself, so they are not separated further. Hand-edited directly on the
main checkout once created, per the `tsk-5ge` precedent — never through
`fgos approve` on a branch.

**Order.** This item first (behavior-preserving — adds the capability-match
path without touching real config). The child item second, once this
item's code is merged, since its whole point is to start exercising the
new path for real. `tsk-5wz` item 4 touches the same `submit-assist-
classify` entry point — neither piece of this split runs in parallel with
`tsk-5wz`, per the item's own coordination note.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| `resolveExecutorConfig` presence-check | HIGH (GitNexus: 6 upstream symbols, 3 flows) | New tests (5a/5b above) + full existing `dispatch.test.mjs` suite green, proving the no-`needs` fallback is exactly today's behavior |
| Silent-fallback misread in `capacity-dispatch-fallback.md` Step B | MEDIUM — a skill session could misread "backend isn't available" as "not configured" when it's really a stale capability query | Manual read-through of Step B's two branches after the edit; no automated proof for a prose-only skill fragment (`docs/how-to/write-verify-for-a-skill-prose-change.md`) |
| D3 supersede leaving a dangling instruction elsewhere | LOW | `rg -n "capability submit-assist-classify" docs/ .claude/` after the edit — only the corrected D3 entry should match |
| `.fgos/config.json` migration timing (child item) | MEDIUM — real capacity resolution only changes once `needs` is set for real | Backward-compat fallback (this item) means the child item can land whenever, with zero forced-coupling window |

## Assumptions

- The real capability label `submit-assist-classify`'s tool should
  re-register under (e.g. `classification`, per the DISCUSSION.md §7.2
  draft verify) is the child item's own call — not material to this
  item's code/test/doc scope, since this item never touches the real
  config. Pinned here rather than asked, per the material/grounded/
  answerable filter: it does not change this item's scope, behavior, or
  acceptance criteria.

## Outstanding questions

None
