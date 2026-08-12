# plan.md — gather-capacity-purpose-binding (tsk-2ie5)

Mode: high-risk

Lane decided per `fgos-routing`'s own Mode-gate (applied directly here —
this item entered via `/fgOS:pick` -> `fgos-coding-driving`, which never
runs `fgos-routing`'s Orient step, so no lane was handed off; the
direct-entry fallback applies). Flags counted: **audit/security** (content
classification / cross-provider governance is the item's own point),
**external systems** (dispatch to a non-Claude CLI provider),
**public contracts** (`.fgos/config.json` capacity shape is a contract
other sessions/tools read; `fgos-researching`'s own SKILL.md prose is
likewise read by every session that runs it), **existing covered
behavior** (`fgos-researching`'s current always-native fan-out, and
`dispatch.mjs`'s already-tested `resolveExecutorConfig`/
`validateCapacityShape`, must keep passing). 4 flags, plus "external
provider" is itself one of the named hard-gate flags → **high-risk**
regardless of count. Matches the item's own submitted `risk: "high"` /
`tier: "heavy"`.

## Approach

Full decision grounding lives in `CONTEXT.md` (same directory) — this
section only maps those decisions onto the actual files and cites the
impact evidence used to order the work.

**Impact-analysis posture: degraded** (GitNexus registered/present but its
index is stale — hook-reported "last indexed: 4ce7a96", predates this
branch's own commits). Direct `rg`/`grep` cross-checks below are the
primary evidence, per `CLAUDE.md`'s own guidance for a degraded posture.

**Blast radius, grounded in a direct grep, not GitNexus** (`rg
'resolveExecutorCommand|spawnWorker|resolveCapacityCli|decideCapacityCli'
src bin --include='*.mjs'`, excluding `dispatch.mjs` itself): the function
this item extends (`resolveExecutorConfig`, called at config-load /
dispatch-resolve time, which is where `carries` validation and its real
gate must live) has exactly ONE production caller path today —
`src/runner/loop.mjs`'s `spawnWorker` (two call sites, both inside the
async claim/dispatch cycle, `loop.mjs:717`/`:1065`). `bin/fgos.mjs` never
calls it directly. This item's own new call site — `fgos-researching`
invoking the capacity-resolution path in-session — will be the SECOND
real caller ever. Risk is therefore narrow and well-understood: adding
`carries` validation to `validateCapacityShape` and a real read-gate to
`resolveExecutorConfig` risks `loop.mjs`'s existing async dispatch path
(already covered by `test/runner/dispatch.test.mjs`) plus this item's own
new in-session path — no third caller exists to regress silently.

### Layer map (per `tsk-5td` D10's own T0–TG framing, cited for orientation only)

| Layer | This item's piece |
|---|---|
| T2 (unit of work) | `gather` — unchanged, already exists (`tsk-5kn`) |
| T3 (named capacity) | Registering a `gather`-purpose capacity — child 2 |
| T4 (supply) | Whichever provider a build-time probe finds (per description: "khong doan truoc") — child 2's own concern at registration time |
| TG (gate, cross-cutting) | `carries` validation + real read-gate — child 1, `dispatch.mjs` |
| Caller wiring | `fgos-researching`'s fan-out calling the capacity path with fallback — child 1 |

### Risk map

| Component | How risky | Proof point (carried to `fgos-coding-validating`) |
|---|---|---|
| `validateCapacityShape` gains `carries` enum check | Medium — shared validation path, but single caller (`loop.mjs`) plus this item's new one; existing tests already exercise `for`/`allowCrossProvider` validation the same way `carries` will follow | New test: an out-of-enum `carries` value throws at config-load, not silently accepted; existing `for`/`allowCrossProvider` tests still pass unmodified |
| `resolveExecutorConfig` gains a real `carries` read-gate | Medium — this is the actual security-relevant piece (D15's whole point: a declared `carries: user-text` capacity must be refused BEFORE spawn if handed repo content) | New test: a capacity declared `carries: user-text` invoked with repo-content-shaped input is rejected before any spawn; a `carries: repo-content` capacity accepts the same input |
| `fgos-researching` fan-out wiring | Medium-high — must preserve parallelism (explicit "PHAI GIU DUNG" constraint) and must never hard-fail when the capacity is absent | New test/measurement: N gather branches still run concurrently after wiring (wall-clock, not sequential); a config with no `gather`-purpose capacity registered still completes via the existing native Task path, zero errors |
| Dispatch-log line for an in-session (non-`loop.mjs`) capacity call | Low-medium, new surface — no existing writer to reuse or regress; this item defines its own | New test: one gather dispatch produces one durable log line (mechanism TBD by whoever implements — see Outstanding below) |
| `.fgos/config.json` capacity registration (child 2) | Low, ADR0020-gated | `fgos doctor` green; `fgos setup`'s config-merge round-trips the new capacity entry |

## Split

The item's own footprint (`.fgos/config.json`) cannot land through this
item's `fgw/tsk-2ie5` branch — ADR0020's `fgos-write-rejected` guard
permanently blocks any worker branch from carrying a `.fgos/` change
through `fgos approve` (`docs/how-to/fix-fgos-write-rejected-merge-block.md`,
precedent `tsk-5vf`/`tsk-n4i-1`/`tsk-4eu`/`tsk-5ge`). This alone forces a
split — `tsk-2ie5` becomes a pure parent once children exist
(`fgos-coding-driving`'s own anchored-by-open-children rule), never itself
carrying code past this point.

1. **Implement gather capacity dispatch** (parent: tsk-2ie5)
   - Footprint: `src/runner/dispatch.mjs`, `.claude/skills/fgos-researching/SKILL.md`, `test/runner/dispatch.test.mjs`
   - Covers original verify items 1–9 (npm test; purpose-based binding via `for: gather`; presence/cross-provider gate — `kind !== 'task'`, already shipped by tsk-1o7, regression-tested here rather than re-implemented; one dispatch-log line per gather call; fallback to native Task dispatch when the capacity is absent/not present; parallelism preserved — measured wall-clock; `carries` closed-enum validation at config-load; a real pre-dispatch gate on `carries`; grep proof that `carries` ships only alongside the code that reads it)
   - Verify: `npm test && grep -n "carries" src/runner/dispatch.mjs test/runner/dispatch.test.mjs | grep -q .` (real command to be sharpened by `fgos-coding-validating`/`fgos-coding-implement` against the actual test names written)

2. **Hand-edit `.fgos/config.json`: register the `gather` capacity** (parent: tsk-2ie5, depends on piece 1 landing — `carries`/`for`-aware validation must exist before the real entry is registered, so it is actually checked rather than silently accepted by pre-this-item code)
   - Footprint: `.fgos/config.json`
   - Applied as a direct, single-parent commit on the main checkout — never through a normal `fgw/<id>` branch/approve cycle (same operator-action shape as `tsk-5ge`)
   - Entry shape: `for: "gather"`, `needs: "<capability, TBD by build-time probe>"`, `carries: "repo-content"` (locked, `CONTEXT.md` D1), `allowCrossProvider: true`, `command`/`args` per whichever provider the probe finds present
   - Verify: `fgos doctor` green; `node bin/fgos.mjs setup` round-trips the new capacity through config-merge without dropping it

## Assumptions

- The `needs` capability name for `gather` is left to whoever implements
  piece 1/piece 2 to name concretely (e.g. `prompt-completion`) — this is
  an implementation-only choice per `fgos-coding-exploring`'s own scope
  boundary (does not change behavior, data shape, or acceptance criteria;
  `needs` is validated at resolve-time against whatever the tools
  registry declares, not against a closed enum, so no config-schema risk
  rides on the exact string). `fgos-coding-validating` should confirm piece 1's
  own tests do not hardcode a real production capability name that piece
  2 would then be locked into matching.
- Which provider satisfies that capability is explicitly deferred to a
  build-time probe (`CONTEXT.md`, `tsk-5td` description) — not decided in
  this plan, not guessed ahead of time.
- The exact mechanism for the in-session dispatch-log line (piece 1) is
  left to implementation: it must produce a durable, per-call log line
  distinguishable from `loop.mjs`'s own `capacity.dispatch` event, but
  need not reuse that event's exact writer given gather calls have no
  work-item claim of their own to attach an event to. `fgos-coding-validating`
  should confirm whatever shape is chosen is durable (survives process
  exit) before treating piece 1 as done.
- `tsk-5td` (soft dependency, not declared in `deps`) — its decision log
  is stable through 18 rounds with none overturned; treated as reliable
  citation material, not re-litigated here.

## Outstanding questions

None
