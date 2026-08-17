# fgOS mission boundary — CONTEXT

Item: tsk-4us. Decisions locked entirely inside a live `fgos-coding-shaping`
discussion (5 rounds, 2026-08-17) — see
`docs/history/fgos-mission-boundary/DISCUSSION.md` for the full scout
evidence, Q&A transcript, and §6/§7 synthesis this file summarizes.
`fgos-coding-exploring` re-scoped no new gray areas: `refs` already resolved
every material/grounded/answerable question this skill would otherwise ask.

## Feature boundary

fgOS's real mission is (1) developing other projects and (2) running
business-base workflows for others — not (3) developing itself, which is
dogfood, not the point of existing. Agents working inside `forgentX` (where
fgOS self-hosts on its own source) keep drifting into treating mission #3
as central. This feature establishes that boundary as a standing decision
(`docs/decisions/0035`) plus an `AGENTS.md` pointer, and names the
mechanism by which fgOS recognizes which mission an install is serving: a
`mission` config key (`self-dev` | `host`) declared once at `fgos
init`/`fgos setup`, not asked per-decision.

In scope: writing `docs/decisions/0035` and the `AGENTS.md` pointer.
Registering the `mission` config default/doctor check in code, and wiring
any real consumer (Iron Law's `MODULE_RULES`, tsk-1js) to read it, is named
here as the mechanism's first real implementation candidate but its own
scope/split is `fgos-coding-planning`'s judgment, not locked here.

## Locked decisions

| D-ID | Decision | Rationale |
|---|---|---|
| D1 | Mission self-vs-host is a decision AXIS separate from, standing beside (not appended as a 5th tier to), the 4-tier product priority ladder in `docs/decisions/0030` | `0030`'s 4 tiers answer "when two values conflict, which wins" (one axis, differing degree). Self-vs-host classifies who is being served, BEFORE any of those 4 tiers apply — a different axis. Confirmed by the user directly (round 2), held unchanged into round 3. |
| D2 | Enforcement mechanism is a `mission` config key declared ONCE at `fgos init`/`fgos setup` (deterministic), registered through the existing registry (`registerConfigDefault`/`registerCheck`, `src/setup/registrations.mjs`) — never asked per-decision, never bee-style repo-divorce | User rejected per-decision design-intent questioning as bad UX. Principle: declare once at setup is the deterministic primary path; self-inference is only the least-bad fallback when undeclared, never the design center. |
| D3 | `tsk-1js` (Iron Law's `MODULE_RULES` hardcoding fgOS's own paths, silently `required:false` on any host project) is the first real implementation candidate of the `mission` mechanism — `self-dev` reads today's 9-line list as fgOS's own default, `host` reads that project's own sensitive-module list (empty by default, not fgOS's) | `tsk-1js` independently proposed the same "MODULE_RULES as per-project config" direction before this discussion started, while shaping an unrelated item (tsk-1y6) — convergent evidence. Kept as an illustrative example, not a dependency (user declined attaching one, round 1). |
| D4 | Physical placement: `docs/decisions/0035` (real next number after 0034) + a new `AGENTS.md` pointer right after "Product priority order" — no new law entry in `docs/platform-foundations.md` | Content is narrow/concrete enough for one decision + one AGENTS.md paragraph; a separate platform-foundations law would duplicate the record, violating KISS. "Standing beside" (D1) doesn't require its own L-law. |
| D5 | Config key name is `mission`; value set is the minimal two: `self-dev` \| `host` — mission #1 (develop other projects) and #2 (run business workflows) are NOT split into separate values | Name matches the vocabulary used throughout the discussion (mission #1/#2/#3 from the user's original framing); avoids names already meaning something else in fgOS (`kind`/`tier`; `scope` already means something else in review/gate/footprint contexts). No mechanical consumer (Iron Law/`MODULE_RULES`) yet needs to distinguish #1 from #2 — both only need "this host is not fgOS itself". Matches the STR82 precedent (declined until real dogfood evidence demands it). |

Machine record: all five decisions also landed via `fgos decision --id
tsk-4us` during the shaping discussion (seq 18960, 18967-18970) — this
table is the prose restatement, not a duplicate source of truth.

## Pinned terms

- **mission #1** — fgOS used to develop another project (not itself).
- **mission #2** — fgOS used as the platform running a business-base
  workflow for someone else.
- **mission #3** — fgOS developing its own source. A necessary dogfood
  activity, never the reason fgOS exists; must never be the default lens
  an agent applies while working inside `forgentX`.
- **`mission` config key** — the declared value (`self-dev` | `host`) an
  install carries, set once at setup, read by any consumer (starting with
  Iron Law, `tsk-1js`) that needs to know which module list/behavior
  applies. Not the same as `docs/decisions/0030`'s priority tiers — a
  different axis (D1).
- **repo-divorce / `product_root`** — upstream `beegog`'s (bee) pattern of
  physically separating a coordinator repo from a nested product repo.
  Explicitly OUT of scope for forgentX (D2/round 3) — fgOS tried this
  topology before (`forgent-workshop` at `~/projects/forgent`, itself
  bee-upstream's own product workshop, unrelated to fgOS's own history) and
  deliberately walked away from it after real problems; this is a closed
  door, not an untried option.

## Scout evidence cited

- `docs/distillery/sources/beegog.md` — `evolving-loop-two-gates` (line
  620-624), `grooming-project-first` (626-630), `zero-dep-vendored-helpers`
  (492-496), `product-root-repo-divorce-topology` (580-584),
  `chain-integrity-guard-tail` (408-413, the real state-transition-guard
  mechanism behind bee's self-mod discipline).
- `docs/distillery/porting-log.md` line 105 — `product-root-repo-divorce-topology`
  logged `candidate`, unported; forgent already recognized the right
  direction by convention, never mechanized.
- `README.md` — forgent's own mission statement already reads mission
  #1/#2 ("so developers can forge new agents instead of building
  everything from scratch"), but as prose only, never an enforced rule.
- `docs/distribution-vision.md` §1 — self-acknowledges current
  self-referential dogfood state and reuse-elsewhere as the real target.
- `docs/backlog.md` STR25 — forgent once modeled bee's
  workshop-vs-object topology conceptually; STR82 — auto-detect fallback
  precedent, declined until real dogfood evidence.
- `fgos list --json` (main checkout) + filesystem check
  (`~/projects/{mdview,herdr-gateway,fgos-test-drive,forgent/repo}/.fgos`)
  — confirmed fgOS already runs live on ≥4 real host checkouts outside
  forgentX; `~/projects/forgent/package.json` (`forgent-workshop`,
  `dependencies: {forgent: "file:./repo"}`) confirmed the real
  repo-divorce instance is bee-upstream's own, not forgentX's lineage.
- `src/evolve/iron-law.mjs` `MODULE_RULES` (tsk-1js's own source) — read
  in full; its own code comment ("D10+D14 self-modifying-capable module
  list") independently names the same self-dev-scoped concept this
  discussion converged on.
- `src/setup/registrations.mjs` — `registerConfigDefault`/`registerCheck`
  registry pattern (e.g. `runner` config line 1040, `dependencies-installed`
  check line 1076) confirmed as the existing, correct home for a new
  `mission` config default — no new mechanism needed.
- `~/.fgos/config.json` — `ironLaw: {level: "ask"}` confirmed as existing
  per-install config precedent for Iron Law specifically.
- `docs/decisions/` listing — confirmed `0035` is the real next available
  number (latest existing: `0034`; two files share `0032` but do not block
  a new number).
- Impact-analysis capability gate (`fgos tool query --capability
  impact-analysis --status present`): **degraded** — GitNexus registered
  and present, but its index was flagged stale by the session's own
  PostToolUse hook (`last indexed: 7bb3231`) during this same session.
  Low relevance here since this item's own locked scope is docs-only, but
  recorded per the CLAUDE.md gate's own requirement.

## Canonical references

- `docs/history/fgos-mission-boundary/DISCUSSION.md` — full discussion,
  §6 design synthesis, §7 task breakdown (`#task-mission-boundary-vision`).
- `docs/decisions/0030-them-release-con-nguoi-vao-thu-tu-uu-tien-san-pham.md`
  — the priority ladder this decision stands beside, not inside.
- `tsk-1js` — Iron Law `MODULE_RULES` bug, first implementation candidate
  (not a dependency).
- `docs/distillery/sources/beegog.md`, `docs/distillery/porting-log.md` —
  upstream pattern source, still-unported candidates this decision draws
  on without adopting bee's repo-divorce topology.

## Outstanding questions

None
