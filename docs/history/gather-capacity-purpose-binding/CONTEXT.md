# gather-capacity-purpose-binding

Claimed item: tsk-2ie5. Written by `fgos-coding-exploring`, invoked directly from
`fgos-coding-planning`'s own "Mid-planning CONTEXT.md gap" step — the item landed
at stage `decompose` (a legal `clarify -> decompose` shortcut edge, fired
by a caller-supplied `clear` verdict) without ever generating a `CONTEXT.md`
of its own, so `fgos-coding-planning` could not cite one. `item.stage` stayed
`decompose` throughout this pass; no backward stage move was applied.

## Feature boundary

Bring `fgos-researching`'s two independent `gather` fan-out branches
(today: a live in-session Task-tool call, zero config, zero presence
check, zero cross-provider check, zero dispatch log — confirmed by reading
`.claude/skills/fgos-researching/SKILL.md`'s own hard rule, "this skill
always runs in-session with live Task access, so a fan-out dispatch is
always `native`... this is not a registered capacity") into the capacity
dispatch mechanism, keyed by *purpose* (`for: gather`) rather than by tool
name — the first real consumer of `for`/`needs` purpose-based binding
outside a validate-only path. Adds the third capacity declaration,
`carries`, as the first cross-provider capacity whose content is
genuinely variable (a research prompt can carry repo file paths/content,
unlike a fixed classify-style prompt). Falls back to today's native
Task-tool call when the capacity is absent/not present — never errors,
never blocks `fgos-researching`'s own parallelism.

Explicitly OUT of scope (per the item's own "PHAI GIU DUNG" and dependency
ordering): migrating `submit-assist-classify`'s own dispatch to the same
mechanism (tsk-5wz, must happen strictly AFTER this item lands, never
before or in parallel — this item is what proves `kind:"cli"` is a stable
specimen worth generalizing from).

## What's already delivered (changes this item's real remaining scope)

Scouted directly against `src/runner/dispatch.mjs` on this branch, not
assumed from the item's own (now partially stale) "BANG CHUNG CODE"
section:

- **`needs`-based presence check: already shipped** (tsk-1o7,
  `resolveExecutorConfig`, `dispatch.mjs:~660-680`) — when a capacity
  declares `needs`, the presence gate filters the tools registry by
  `tool.capability === capacity.needs`, not by name. A capacity naming no
  `needs` keeps the old `tools[capacityId]` name lookup unchanged
  (documented backward-compat seam).
- **Gate widened to `kind !== 'task'`: already shipped** (tsk-1o7/tsk-592,
  same function, comment reads "D13/tsk-592: gate widened from `kind ===
  'cli'` to `kind !== 'task'`"). `mcp`/`skill`/`http`/`binary` capacities
  already get the same presence check a `cli` capacity always had.
- **`for` purpose enum: already shipped, validate-only.**
  `CAPACITY_PURPOSES = Object.freeze(['gather', 'judge'])`
  (`dispatch.mjs:405`), enforced in `validateCapacityShape`
  (`dispatch.mjs:486-487`, throws on an out-of-enum value). Zero capacity
  in `.fgos/config.json` declares `for` yet — this item is the first real
  consumer.
- **Cross-provider check: already shipped, unchanged by this item.**
  `resolveExecutorConfig` throws unless `capacity.allowCrossProvider ===
  true` when the resolved command isn't a Claude CLI (`dispatch.mjs:693`).

**Genuinely missing, confirmed by grep returning zero hits in
`dispatch.mjs`/`src/runner/loop.mjs`:**

- `carries` — not declared, not validated, not read anywhere. This item
  is where it is born (D15, superseding `sensitiveData`'s D7 — see below).
- Any registered `gather` capacity in `.fgos/config.json` — the `for`
  enum's own `gather` value has never been used on a real entry.
- `fgos-researching` calling into the capacity mechanism at all — its own
  SKILL.md still asserts (correctly, today) that its fan-out is always
  native.
- A dispatch-log line for an in-session (not `loop.mjs`-driven) capacity
  call. The one `capacity.dispatch` event that exists today
  (`src/runner/loop.mjs:745`) fires only from the async claim/dispatch
  cycle tied to a work item's own claim — `fgos-researching`'s gather call
  has no claim of its own to attach that event to. **How** an in-session
  skill calls into `dispatch.mjs`'s exported resolution functions
  (`resolveCapacityCli`/`decideCapacityCli`/`resolveExecutorCommand`) and
  what a gather-specific log line looks like is an implementation
  question for `fgos-coding-planning`, not resolved here — it fails this skill's
  own "material" bar (an implementer's mechanism choice, not a
  scope/behavior/data-shape choice a person needs to weigh in on).

## Locked decisions

| D-ID | Decision | Source |
|---|---|---|
| D1 | `carries: repo-content` is the correct declared value for the `gather` capacity's own registration (not `user-text`). | Grounded in two independent pieces of evidence: (a) `fgos-researching`'s own step 2 hard rule — "Search this repo first... read what you find directly with citations" — is one of the two mechanical branches every gather round runs, so repo paths/content routinely enter gather prompts; (b) `tsk-5td` D15's own rationale text names this exact fact: "tsk-2ie5 (gather) la cross-provider capacity thu hai va riskier that vi noi dung research co the mang manh repo, khac han mot cau ask" (gather's research content can carry repo fragments, unlike a fixed ask). `carries` is a closed enum (`user-text`\|`repo-content`; `secrets`/credentials never a legal value) per D15 below — this locks which of the two values applies to this specific capacity. |
| D2 | This item's own scope is narrower than its original description assumed: the presence/`needs`/`kind!=='task'` gates are already shipped (tsk-1o7). Remaining real work is `carries` (validate + real read-gate), one registered `gather` capacity, `fgos-researching`'s own dispatch wiring + fallback, and a gather-specific dispatch-log line. | Direct source read of `src/runner/dispatch.mjs` on this branch (see "What's already delivered" above) — supersedes the item's own "BANG CHUNG CODE" section where it cites `dispatch.mjs:604`/`:603`/`:630` as still gating on `kind === 'cli'`; those line numbers reflect pre-tsk-1o7 code. |

### Decisions inherited from `tsk-5td` (cited, never reopened — that item's own D-IDs, not renumbered here)

`tsk-5td` is a `docs`-kind vocabulary item, still at stage `clarify`
(status `doing`), whose own `docs/history/dispatch-concept-boundary/
DISCUSSION.md` exists only in its own still-open worktree
(`fgw/tsk-5td`), not on `main` or this branch — read directly from that
item's own decision log (`fgos list --id tsk-5td --json`) rather than
assuming the DISCUSSION.md file, since it is not reachable from here.

- **D3** — `kind` = provider kind (where the provider lives), never
  transport or protocol.
- **D5** — fgOS adopts US-027: binding matches by capability promise,
  never by tool name. Names `gather` as the item that resolves this for
  itself: "khong phai 'chua lam' ma la BAT KHA voi khoa ten."
- **D6** — a capacity's caller side declares TWO fields: `needs`
  (capability, picks provider) and `for` (purpose `gather`\|`judge`,
  picks lane). Binding matches on both, never on name.
- **D8** — `capacity` = a named capability of fgOS itself (behavior-promise
  + functional-helper); `capacities.<id>` is its declaration, not itself.
- **D9** — audit records BOTH `provider` (freely-set label) and `command`
  (the actual spawned command) in the `capacity.dispatch` event, so a
  mislabeled `provider` never hides where content actually went.
- **D13** — `mechanism` = whether the provider lives inside or outside;
  presence/cross-provider gates key on `kind !== 'task'`, never `kind ===
  'cli'` (already shipped per D2 above — cited here for the vocabulary,
  not as remaining work).
- **D15** — a capacity declares THREE things, not two: `for` + `needs` +
  **`carries`** (the content class it's permitted to receive). `carries`
  must declare an explicit value set, never a free string, and ships only
  alongside the code that reads it. Explicitly supersedes
  `docs/history/agent-executor-submit-assist-classify/CONTEXT.md`'s D7
  (`sensitiveData: false`, metadata-only, never shipped, 0 hits in
  `.fgos/config.json`/`src/`) — D15's own rationale names `tsk-2ie5` by id
  as the very capacity whose existence retires D7's YAGNI condition.

## Pinned terms

- **gather** — a T2 unit that returns a digest (never a verdict); the
  fan-out branch this item wires into the capacity mechanism (`tsk-5td`
  D1/D2).
- **`for`** — a capacity's declared purpose (`gather`\|`judge`), a closed
  enum (`CAPACITY_PURPOSES`, `dispatch.mjs:405`).
- **`needs`** — a capacity's declared required capability, an open string
  resolved against the tools registry's own `capability` field at dispatch
  time (never a closed enum — any tool can register any capability).
- **`carries`** — a capacity's declared permitted content class, a closed
  enum (`user-text`\|`repo-content`; `secrets` never legal) — new field
  this item introduces, per `tsk-5td` D15.

## Scout evidence

- `src/runner/dispatch.mjs:405` — `CAPACITY_PURPOSES` enum, already
  shipped.
- `src/runner/dispatch.mjs:453-495` (`validateCapacityShape`) —
  `allowCrossProvider`/`for` validated; `carries` absent entirely.
- `src/runner/dispatch.mjs:634-680` (`resolveExecutorConfig`) —
  `needs`-based presence check and `kind !== 'task'` gate, already
  shipped (tsk-1o7).
- `src/runner/dispatch.mjs:693-696` — cross-provider `allowCrossProvider`
  check, already shipped, unchanged by this item.
- `src/runner/loop.mjs:742-760` — the one existing `capacity.dispatch`
  audit event, fired only from the async claim/dispatch cycle; gather's
  in-session call has no equivalent today.
- `.claude/skills/fgos-researching/SKILL.md:57-72` — the skill's own
  current hard rule asserting its fan-out is always native, "not a
  registered capacity" (the exact text this item's implementation will
  need to update).
- `.fgos/config.json` — today's only two registered capacities
  (`judge-discovery`/`judge-decompose`, both `kind: "task"`;
  `submit-assist-classify`, `kind: "cli"`); no `gather`-purpose capacity
  exists yet.
- `fgos list --id tsk-5td --json` — full D1-D18 decision log for the
  vocabulary item this one consumes from (DISCUSSION.md itself not
  reachable from this branch — see note above).
- Impact-analysis capability gate (per `CLAUDE.md`): `fgos tool query
  --capability impact-analysis --status present` → gitnexus registered,
  status `present` — but the index itself is stale (hook-reported: "last
  indexed: 4ce7a96", predates this session's own commits on this branch)
  → posture **degraded** per `CLAUDE.md`'s own three-way framing (`present`
  only means installed, never that the index is fresh). `fgos-coding-planning`'s
  proof points may still use GitNexus output, but must mark that evidence
  weak and cross-check any zero-result/"not found" answer with a direct
  `rg`/`grep` pass before trusting it.

## Canonical references

- `tsk-5td` (deps-adjacent, not a declared `deps` entry — see Outstanding
  questions) — vocabulary/decision source for D3/D5/D6/D8/D9/D13/D15.
- `tsk-1o7` (declared `deps`, delivered, item itself still resolving
  through retrospective/cleanup) — shipped the `needs`/`kind!=='task'`
  presence-check mechanics this item builds on.
- `docs/history/agent-executor-submit-assist-classify/CONTEXT.md` — D7,
  explicitly superseded by `tsk-5td` D15.
- `docs/how-to/fix-fgos-write-rejected-merge-block.md` — ADR0020 pattern
  this item's own `.fgos/config.json` touch must follow (see Outstanding
  questions).

## Outstanding questions

None for this skill's own scope (product/behavior/data-shape). Two
process risks are surfaced for `fgos-coding-planning` to size and structure, not
asked here since neither changes what gets built:

- **ADR0020 split.** This item's footprint includes `.fgos/config.json`.
  A `fgw/tsk-2ie5` branch can never carry a `.fgos/` change through `fgos
  approve` (ADR0020's `fgos-write-rejected` guard). `fgos-coding-planning` must
  split the config-registration step into its own child item (hand-edited
  on the main checkout) from the start, per precedent (`tsk-5vf`/
  `tsk-n4i-1`/`tsk-5ge`) — never discovered only at merge time.
- **`tsk-5td` is not a declared dependency but this item's decisions rest
  on it.** `tsk-5td` is still `doing`/`clarify` in its own right (a docs
  item that mints D-IDs but hasn't itself reached `decompose`). Its
  decision log is stable enough to cite (18 rounds, explicitly marked
  "giu qua N vong khong bi lat" / held through N rounds without being
  overturned, for every D-ID cited above) but `fgos-coding-planning` should note
  this as a soft dependency risk in `plan.md` rather than silently assume
  it.
