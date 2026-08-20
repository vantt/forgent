# Plan — core-foundation vs domain-specific directory/module boundary (tsk-397)

Written by `fgos-coding-planning`, native-first from `fgos-coding-exploring`
(same session). Source: `CONTEXT.md`'s 34-D-ID table (this feature dir),
full rationale in `DISCUSSION.md` §6/§7.

Mode: **high-risk**

Flag count against `fgos-routing`'s own Mode-gate table (applied directly
here — no lane was handed off from an Orient step, this item entered via
`fgos-coding-shaping`'s native-first path, the documented direct-entry
fallback case): **4 flags** — `public contracts` (`.agents/skills/`,
`.claude/skills/`, `.claude/agents/`, `plugins/fgOS/skills/` are vendored
byte-identical into every external project via `fgos setup`;
D7/D24/D30 all promise this stays unchanged, but the promise is only as
good as the assembly-mechanism tasks that keep it true), `existing covered
behavior` (touches `stage-fsm.mjs` — this repo's own densest-tested module
per multiple decisions' own scout notes — plus `dispatch.mjs`,
`handoff.mjs`, `workflow-stage-graphs.mjs`, all kernel-layer per
`architecture-manifest.json:80`), `multi-domain` (the entire point of the
item is generalizing a single-domain structure to a real multi-domain
one), and `weak proof around the area` in the sense that no part of this
repo has ever been reorganized at this scope before — no precedent to
lean on. 4 flags alone crosses the "4+ flags → high-risk" line in the
mode-gate table; the user's own explicit mandate (2 independent post-
implementation review rounds, a rollback tag before the final merge to
main) is additional, independent confirmation this is not honestly a
`standard`-lane item.

## Approach

**Chosen path:** decompose into the 15 independently-workable pieces
`DISCUSSION.md` §7 already specced (each with its own D-ID citations,
dependency notes, and draft verify — refined across 19 shaping rounds
plus one independent completeness review). Materialize them as real
children of `tsk-397` at the single gate (`fgos-coding-validating`,
next), each merging back into `fgw/tsk-397` — never `main` directly, the
existing default leaf-merges-to-root mechanism already gives this for
free as long as each child is born with `parent: tsk-397`, which the
native `--verdict decompose --children` materialization path already
does.

**Alternative rejected:** treat `tsk-397` as one pass-through item and
implement it in a single continuous session. Rejected because: (a) the
15 pieces have real, different file footprints and dependency ordering
already worked out — forcing them through one undifferentiated
implementation pass throws that structure away for no benefit; (b) a
single giant commit sequence is exactly the shape most likely to produce
the "broken repo" outcome the user explicitly warned against — smaller,
independently-verified pieces are safer, not slower, at this scale; (c)
`fgos-fanout` already exists for running decomposed children concurrently
where footprints don't overlap, which a single-item approach forfeits
entirely.

**`fgos graph --json`/`--what-if` — not applicable pre-materialization.**
These 15 pieces do not exist as real work items yet (nothing is created
until `fgos-coding-validating`'s single gate). `fgos graph --what-if`
needs a real registered item id to simulate against; running it now
against unrelated existing backlog items would not inform this item's own
ordering. The phased order below is instead the direct product of the
real dependency notes already recorded per-task in `DISCUSSION.md` §7
(each task's own "Quan hệ" field) — hand-derived across 19 rounds, not a
guess. Once the children are real (post-gate), a normal
`fgos graph --what-if <child-id>` pass is available to `fgos-fanout` or
whoever schedules the actual execution waves.

**Impact-analysis capability posture:** `full`, freshly reindexed this
session (`npx gitnexus analyze`, 19,129 nodes / 26,811 edges / 554
clusters / 300 flows — see `CONTEXT.md`'s own scout-evidence section).
Every risk-map entry below that leans on blast-radius reasoning is backed
by a fresh index, not a stale or absent one — this is the "full" case:
proof points below stand as written, no weakening needed.

### Risk map

| Component | How risky | Proof point (carried to `fgos-coding-validating`) |
|---|---|---|
| `stage-fsm.mjs` (densest-tested module) — 2 flat-property reads removed | Medium — high test density means high regression-catch probability, but also high chance of an incidental snapshot/golden-file break unrelated to the real change | `npm test -- stage-fsm` green + `impact({target:"transitionStage", direction:"upstream"})` blast radius reviewed before touching |
| `workflow-stage-graphs.mjs` aggregator rewrite (scan `domains/*/registry.yaml`+`workflows/*.yaml` instead of inline objects) | High — kernel layer (`architecture-manifest.json:80`), 459 real references repo-wide (`rg` count, this session) | Golden-shape test: parse real `registry.yaml`+`workflows/feature.yaml` post-migration, assert output object is structurally identical to today's in-memory `codingDomain` (§7 task-1's own verify) |
| `.agents/skills/`/`.claude/agents/` external contract (assembly-mechanism tasks) | High if broken — silently changes what every external `fgos setup` consumer receives | `test/e2e/coexistence-canary.test.mjs` (existing) green, byte-diff of a sample generated file pre/post migration = 0 |
| `agent-type`/`task-spec` eligibility inversion (`claims`→`skills`) | Medium — reverses already-shipped tsk-2t9c behavior; a agent-type that WAS eligible could become ineligible if `skills`/`requires-skill` are mis-authored | Manual diff: for every real `agents/*.yaml` + real task-spec today, confirm eligibility outcome under the new model matches the old model's outcome (§7 task-eligibility-inversion's own verify already names this) |
| `handoff.mjs` sync-nesting cap (new `openSyncDepth` param) | Low — additive parameter, pure function, existing tests cover current behavior | New test: nested-sync-over-cap refused; sequential-sync-long-chain NOT refused (§7 task-sync-nesting-cap's own verify) |

### Files likely touched (aggregate — see each child spec's own `footprint` for the authoritative per-piece list)

`src/state/workflow-stage-graphs.mjs`, `src/state/stage-fsm.mjs`,
`src/state/handoff.mjs`, `src/intake/plan.mjs`, `src/runner/loop.mjs`,
`src/runner/dispatch.mjs`, `src/setup/registrations.mjs`,
`scripts/project-agents.mjs`, `scripts/build-skill-wrappers.mjs`,
`src/config/skill-wrappers.mjs`, `docs/architecture-manifest.json`,
`test/architecture.test.mjs`, `AGENTS.md`, `CLAUDE.md`, `agents/*.yaml`,
`docs/task-specs/coding/*.md` (moved), the entire new `core/` and
`domains/coding/` trees.

### Phased execution order — CORRECTED at `fgos-coding-validating`'s reality gate

**Second correction, at the engine's own `fgos plan --verdict decompose` call
(not just this session's own reality-gate reading):** the engine's real
`footprintOverlapAmong` hard-gate independently re-derived 14 of these same
collisions (plus rejected the first submission outright — `outcome:
"need-human"` — since a prose-only "spine" ordering isn't enough; each
colliding pair needs a **direct** `deps` index edge in the child-spec JSON
itself, transitive ordering through a third child does not satisfy it).
The JSON block below is the corrected, resubmitted version — array order
IS the topological order, and every `deps` array is the authoritative,
engine-checked sequencing. The prose spine below still describes the same
reasoning for a human reader; the JSON's own `deps` fields are what
actually enforce it.

**Round-16 planning wrote this as 4 concurrency-safe "waves" — WRONG.** The
reality gate's own footprint cross-check (running each child's real
`footprint` array against every other child's, mechanically, not by
re-reading judgment) found 7 real file-level collisions the original
wave grouping called concurrent-safe:

| Shared path | Colliding tasks |
|---|---|
| `src/state/workflow-stage-graphs.mjs` | domain-registry-split, role-rename, taskspec-path-resolver, bundle-for-stage |
| `docs/task-specs/coding/*.md` | taskspec-migration, role-rename |
| `src/setup/registrations.mjs` | taskspec-migration, taskspec-path-resolver, eligibility-inversion, agent-domain-split |
| `domains/coding/task-specs/` | taskspec-migration, eligibility-inversion |
| `core/task-specs/` | core-task-specs, eligibility-inversion |
| `agents/` + `scripts/project-agents.mjs` | eligibility-inversion, agent-domain-split |
| `src/runner/dispatch.mjs` | persona-key-extension, eligibility-inversion |

Two of these were previously *known* dependencies already correctly
ordered (taskspec-path-resolver *after* taskspec-migration+registry-split;
eligibility-inversion *after* taskspec-migration) — the reality gate's
value here is the **5 that were NOT previously flagged**: role-rename
colliding with both registry-split and taskspec-migration; bundle-for-
stage colliding with taskspec-path-resolver (both touch
`workflow-stage-graphs.mjs`, not just their already-known upstream
deps); core-task-specs colliding with eligibility-inversion; agent-
domain-split colliding with eligibility-inversion on 3 real files (not
merely "pairs naturally", as originally written — they cannot run
concurrently); persona-key-extension colliding with eligibility-
inversion on `dispatch.mjs`.

**Corrected structure — a sequential spine (real file collisions, must
run one-at-a-time, in this order) plus parallel-safe pieces (no
collision with anything, only soft ordering preconditions):**

**Sequential spine:**
1. `{#task-role-rename}` (D16) — first, alone: touches both
   `workflow-stage-graphs.mjs` (before registry-split restructures it)
   and `docs/task-specs/coding/*.md` (before taskspec-migration moves
   them) — doing the rename here means neither downstream task inherits
   a stale `human-advisor`/`position:` reference.
2. `{#task-taskspec-migration}` (D9) **‖** `{#task-domain-registry-split}`
   (D3/D4/D10/D17/D29/D30/D31) — these two do NOT share a file with each
   other (verified: `registrations.mjs`+`docs/task-specs/` vs
   `workflow-stage-graphs.mjs`+`stage-fsm.mjs`+`plan.mjs`+`loop.mjs`) —
   genuinely safe to run concurrently once step 1 is done.
3. `{#task-taskspec-path-resolver}` (D11) — needs both step-2 pieces
   done (registry.yaml/workflows location from registry-split,
   task-specs at new path from migration).
4. `{#task-bundle-for-stage}` (D14/D29/D30) — needs step 3 done first
   (both add functions to the same now-restructured
   `workflow-stage-graphs.mjs`; running concurrently with step 3 would
   race the same file).
5. `{#task-persona-key-extension}` (D15/D20) — before eligibility-
   inversion, since both touch `dispatch.mjs` and eligibility-inversion
   is the one that actually implements resolve-logic against the key
   shape this step defines.
6. `{#task-eligibility-inversion}` (D20/D21/D22/D26) — needs step 1
   (task-specs headers already `role:`), step 2's taskspec-migration
   (needs `domains/coding/task-specs/` to exist), and benefits from
   `{#task-core-task-specs}` (parallel-safe, below) existing first so
   all 20 task-specs (13 coding + 7 core) get `requires-skill` coverage
   in one pass — sequence core-task-specs before this step, not
   concurrent with it (shared `core/task-specs/` path).
7. `{#task-agent-domain-split}` (D24/D33) — strictly AFTER step 6, never
   concurrent with it (3 real shared files: `agents/`,
   `scripts/project-agents.mjs`, `src/setup/registrations.mjs`) —
   corrects the original plan's "pairs naturally... same lượt" framing,
   which understated a real collision.
8. `{#task-doctrine-domain-split}` (D23) **before** `{#task-coding-skill-
   migration}` (D3/D7/D34) — both touch
   `.agents/skills/fgos-routing/SKILL.md` (doctrine-split adds a Read
   instruction to it; skill-migration physically relocates it to
   `core/skills/fgos-routing/`) — editing content before the move is
   simpler than editing after.
9. `{#task-sync-nesting-cap}` (D25/D28) — last: needs step 6's real
   `requires-skill` data to have anything to mismatch against.

**Parallel-safe (no file collision with the spine or each other — only
soft preconditions, safe to run via `fgos-fanout` alongside whichever
spine step is current, once the precondition is met):**
- `{#task-domain-specs-folder}` (D8) — soft precondition: after spine
  step 2 (registry-split) creates `domains/coding/` for real.
- `{#task-skill-assembly-mechanism}` (D7) — no precondition; must finish
  before spine step 8's skill-migration half starts.
- `{#task-architecture-manifest-domain-silo}` (D12) — soft precondition:
  after spine step 2 (needs `domains/` to exist to write a rule against).
- `{#task-core-task-specs}` (D27) — soft precondition: after spine step 1
  (role-rename) so these 7 new files are authored `role:` from the
  start; must finish before spine step 6 (eligibility-inversion) per
  step 6's own note above.

## Shape

Concrete cases worth proving against, at high-risk depth:

- **Empty/boundary:** a domain with zero workflows other than `feature`
  (today's real state) — aggregator must not crash or drop `feature`
  when `workflows/` has exactly one file. A domain with `workflowFor`
  absent entirely (today's real state, `{}` implied) — `defaultWorkflow`
  fallback must still resolve every `item.kind`.
- **Existing behavior that must not regress:** every one of this repo's
  existing 700+ tests (`npm test`) — the aggregate root verify. Specific
  named suites per risk-map entry above.
- **Concurrent access:** N/A at the file-layout level (this is a
  single-writer main-checkout convention already); DOES apply to
  `fgos-fanout` running the "parallel-safe" pieces concurrently with
  whichever sequential-spine step is current (§"Phased execution order"
  above, corrected at the reality gate after finding 7 real footprint
  collisions the original wave grouping missed) — each child's
  `footprint` (below) is written precisely so `footprintOverlapAmong`
  can catch a real collision before any two run at once, and this plan's
  own sequencing is now derived FROM that same footprint data, not
  independent of it.
- **Partial failure:** if a later spine step fails mid-implementation
  after an earlier one already merged into `fgw/tsk-397`, the earlier
  wave's own merged state must still leave `fgw/tsk-397` in a
  green-`npm test` state on its own — no child may leave the shared
  branch red for a sibling to inherit. This is why each child below
  carries its own full, real `verify`, not a shared placeholder.

## Root-level merge & review protocol (user-mandated, binding — not a suggestion for `fgos-coding-validating` to soften)

Stated directly by the user at this item's `fgos-coding-shaping` →
`fgos-coding-exploring` → `fgos-coding-planning` handoff. Applies to
`tsk-397` itself (the root), after every child above has been
implemented, reviewed once each in the ordinary way, and merged into
`fgw/tsk-397`:

1. **End-to-end dry run through the real feature workflow, before either
   review round.** Once every child above is merged into `fgw/tsk-397`
   and `npm test` is green there, dispatch ONE real work item through the
   FULL lifecycle — `pick` → `discovery`/`exploring` (whichever the
   item's own discovery verdict picks) → `planning` → `executing` →
   `return` → `approve`/merge — and confirm it completes without any
   stage/skill/dispatch resolution breaking. This is the one proof point
   nothing else in this plan covers: every child's own verify is a unit-
   level check on its own piece (registry parsing, skill assembly, doctor
   checks, eligibility matching in isolation) — none of them proves the
   pieces still compose into a working end-to-end pipeline once ALL of
   `domains/coding/registry.yaml`+`workflows/feature.yaml`,
   `domains/coding/skills/`, `domains/coding/task-specs/`,
   `domains/coding/AGENTS.md`, and the new `skills`/`requires-skill`
   eligibility match are simultaneously in play for one real item, the
   way they will be for every real item afterward. Use the existing
   `dogfood-fixture` mechanism for this (`/dogfood-fixture:list` to pick
   a real canonical scenario, `/dogfood-fixture:submit <scenario>` to
   submit its canonical text into the backlog, then drive it through
   `fgos-coding-driving` normally) rather than inventing a throwaway item
   — the fixture scenarios exist exactly for this kind of real,
   reproducible pipeline smoke-test. If it fails anywhere in the
   pipeline, that is a real regression this plan's own per-child verifies
   missed — fix it before either review round below, not after.
2. **Two independent review rounds, not one**, on `fgw/tsk-397` as a
   whole (the aggregate of every merged child), before `tsk-397` is
   considered done. Each round must be run independently — a fresh
   review context each time (e.g. two separate `code-review`/
   `code-reviewer` passes, or the `ck:code-review ultra` multi-agent
   mode run twice with different framing), not the same review re-read
   twice. Reconcile findings from both before proceeding.
3. **Every child merges to `fgw/tsk-397` (the parent), never straight to
   `main`.** This is the existing default (`graph-harness.mjs`'s
   `mergeTier` reads `item.parent` alone) as long as each child is
   materialized with `parent: tsk-397` — `fgos-coding-validating`'s own
   `--verdict decompose --children` path already does this
   automatically; no extra step needed beyond materializing correctly.
4. **Tag current `main` before `fgw/tsk-397` itself merges into `main`.**
   A real `git tag` (e.g. `pre-tsk-397-merge`) on `main`'s HEAD at the
   moment just before the root merge — the rollback point for a change
   at this scope. This is a manual step for whoever runs the final
   `fgos approve`/`sync-root` on `tsk-397`, not something a child's own
   verify command can automate; recorded here so it is not forgotten.
5. **Stop before `executing`.** This plan (and `fgos-coding-validating`'s
   reality check right after it) is as far as this session goes. No
   `fgos-coding-implement` invocation, no code written, no children
   materialized-and-then-immediately-worked, without the user's explicit
   go-ahead in a later turn.

## Split — 15 children

One honest piece of work is not accurate here — `DISCUSSION.md` §7
already specced 15 independently-workable pieces, each with a real D-ID
citation, footprint, and verify. Written below, **created nowhere** —
`fgos-coding-validating` materializes them at the single gate.

**Array order below is the real topological order (index 0 first), and
every `deps` entry is a DIRECT edge** — the engine's own
`footprintOverlapAmong` check (run against the first submission of this
block, see the Feasibility matrix's own note on this) only accepts a
direct pairwise `deps` edge as proof two colliding children won't run
concurrently, never a transitive chain — so every one of the 16 real
collisions found (14 the engine's mechanical check reported + 2 more this
session found by hand, past what its exact-path-string matching catches:
a glob-vs-directory and an exact-file-vs-directory-prefix pair) is
resolved by a **direct** `deps` index below, not merely implied by order.

```json
[
  {
    "title": "Đổi tên role human-advisor -> advisor, sweep position->role trong task-spec header",
    "verify": "npm test -- roleGraph handoff && grep -rL \"human-advisor\" src/ | wc -l",
    "action": "D16: roleGraph.roles + moi edge to:human-advisor doi thanh advisor; sweep header position->role o moi task-spec",
    "footprint": ["src/state/workflow-stage-graphs.mjs", "docs/task-specs/coding/*.md"],
    "kind": "chore",
    "risk": "light",
    "deps": []
  },
  {
    "title": "Di dời docs/task-specs/coding/*.md sang domains/coding/task-specs/",
    "verify": "npm test -- task-specs && node bin/fgos.mjs doctor --check task-specs-resolve",
    "action": "D9: 13 task-spec thật di dời nguyên vẹn, sửa 2 hardcode path trong registrations.mjs",
    "footprint": ["docs/task-specs/coding/", "domains/coding/task-specs/", "src/setup/registrations.mjs"],
    "kind": "chore",
    "risk": "standard",
    "deps": [0]
  },
  {
    "title": "Tách DOMAINS registry thành aggregator + registry.yaml + workflows/*.yaml",
    "verify": "npm test",
    "action": "D3/D4/D10/D17/D29/D30/D31: registry.yaml (roleGraph+cờ+selector) + workflows/feature.yaml, aggregator quét cả 2, xoá 2 điểm đọc property phẳng (stage-fsm.mjs:94, plan.mjs:519+loop.mjs:1297)",
    "footprint": ["src/state/workflow-stage-graphs.mjs", "src/state/stage-fsm.mjs", "src/intake/plan.mjs", "src/runner/loop.mjs", "domains/coding/registry.yaml", "domains/coding/workflows/feature.yaml"],
    "kind": "task",
    "risk": "heavy",
    "deps": [0]
  },
  {
    "title": "Tạo domains/coding/specs/ + domains/marketing/specs/ rỗng",
    "verify": "test -d domains/coding/specs && test -d domains/marketing/specs && git status --short docs/specs | wc -l",
    "action": "D8-revised: 2 folder rỗng mới, docs/specs/ không đụng",
    "footprint": ["domains/coding/specs/", "domains/marketing/specs/"],
    "kind": "chore",
    "risk": "light",
    "deps": [2]
  },
  {
    "title": "Thêm bước assembly vào skill-wrappers.mjs/build-skill-wrappers.mjs",
    "verify": "npm test -- skill-wrappers coexistence-canary",
    "action": "D7: lắp .agents/skills/* từ core/skills/*+domains/*/skills/* trước generate-wrapper; materializeSkillsIntoProject chạy sau",
    "footprint": ["src/config/skill-wrappers.mjs", "scripts/build-skill-wrappers.mjs"],
    "kind": "task",
    "risk": "standard",
    "deps": []
  },
  {
    "title": "Thêm resolveTaskSpecPath(domain, specId), sửa registrations.mjs gọi qua hàm này",
    "verify": "npm test -- registrations task-specs-resolve agent-claims-resolve",
    "action": "D11: resolver mới trong workflow-stage-graphs.mjs, đóng gap path.join thô ở registrations.mjs dòng 407/424",
    "footprint": ["src/state/workflow-stage-graphs.mjs", "src/setup/registrations.mjs"],
    "kind": "task",
    "risk": "standard",
    "deps": [0, 1, 2]
  },
  {
    "title": "Thêm bundleForStage(domain, stage), sửa fgos-coding-implement bỏ hardcode task-spec path",
    "verify": "npm test -- bundleForStage && grep -c \"docs/task-specs/coding\" .agents/skills/fgos-coding-implement/SKILL.md",
    "action": "D14/D29/D30: resolver mới trả {skill,taskSpec} qua resolveWorkflow trước, driving gọi 1 lần mỗi stage-entry",
    "footprint": ["src/state/workflow-stage-graphs.mjs", ".agents/skills/fgos-coding-implement/SKILL.md"],
    "kind": "task",
    "risk": "standard",
    "deps": [0, 2, 5]
  },
  {
    "title": "Mở rộng architecture-manifest.json + architecture.test.mjs thêm rule domain-siloing",
    "verify": "npm test -- architecture",
    "action": "D12: core không import domain cụ thể, domain không import domain khác -- reuse one-directional-import mechanism",
    "footprint": ["docs/architecture-manifest.json", "test/architecture.test.mjs"],
    "kind": "task",
    "risk": "standard",
    "deps": [2]
  },
  {
    "title": "Tạo core/task-specs/ -- 7 task-spec cho 7 skill domain-agnostic",
    "verify": "npm test -- task-specs-resolve",
    "action": "D27: rút hợp đồng input/output/gates/verify-template từ SKILL.md hiện có của 7 skill ra file task-spec tường minh",
    "footprint": ["core/task-specs/"],
    "kind": "docs",
    "risk": "light",
    "deps": [0]
  },
  {
    "title": "Mở rộng persona/agent-type resolution key thành (domain, stage, role)",
    "verify": "npm test -- dispatch",
    "action": "D15/D20: thêm tham số stage vào key tra cứu, no-op hôm nay, shape sẵn cho tương lai",
    "footprint": ["src/runner/dispatch.mjs"],
    "kind": "task",
    "risk": "light",
    "deps": []
  },
  {
    "title": "Đảo hướng eligibility: agents/*.yaml claims->skills, task-spec thêm agent/requires-skill",
    "verify": "npm test -- project-agents checks",
    "action": "D20/D21/D22/D26: agent-type khai skills thay claims, task-spec khai agent/requires-skill, dispatch.mjs resolve qua skill-match với tie-break D32",
    "footprint": ["agents/", "scripts/project-agents.mjs", "src/setup/registrations.mjs", "src/runner/dispatch.mjs", "domains/coding/task-specs/", "core/task-specs/"],
    "kind": "feature",
    "risk": "heavy",
    "deps": [1, 5, 8, 9]
  },
  {
    "title": "Tách agents/*.yaml thành core/agents/ + domains/<name>/agents/, doctor check unique tên",
    "verify": "npm test -- project-agents && node bin/fgos.mjs doctor",
    "action": "D24/D33: project-agents.mjs quét cả 2 nguồn, doctor check mới bắt tên agent-type unique toàn cục",
    "footprint": ["agents/", "core/agents/", "domains/coding/agents/", "scripts/project-agents.mjs", "src/setup/registrations.mjs"],
    "kind": "task",
    "risk": "standard",
    "deps": [1, 5, 10]
  },
  {
    "title": "Tách doctrine core/domain: AGENTS.md gốc rút gọn, domains/coding/AGENTS.md mới, routing tự Read",
    "verify": "npm test && grep -c \"fgos-coding-\" AGENTS.md",
    "action": "D23: cắt mục fgOS Workflow + GitNexus khỏi root, dời sang domains/coding/AGENTS.md, fgos-routing đọc thêm khi domain resolve",
    "footprint": ["AGENTS.md", "CLAUDE.md", "domains/coding/AGENTS.md", ".agents/skills/fgos-routing/SKILL.md"],
    "kind": "task",
    "risk": "standard",
    "deps": []
  },
  {
    "title": "Di dời 8 skill fgos-coding-* vào domains/coding/skills/, 7 skill vào core/skills/, _shared/ vào core/skills/_shared/",
    "verify": "npm test -- coexistence-canary",
    "action": "D3/D7/D34: 2 nơi trở thành canonical authoring mới, .agents/skills/ không còn sửa tay",
    "footprint": [".agents/skills/", "core/skills/", "domains/coding/skills/"],
    "kind": "chore",
    "risk": "standard",
    "deps": [4, 12]
  },
  {
    "title": "Mở rộng handoff.mjs thêm cap độ sâu sync LỒNG",
    "verify": "npm test -- handoff",
    "action": "D25/D28: openSyncDepth param mirror openCallDepth, chỉ tăng khi sync lồng thật, không tính sync tuần tự",
    "footprint": ["src/state/handoff.mjs"],
    "kind": "task",
    "risk": "standard",
    "deps": [10]
  }
]
```

## Feasibility matrix (`fgos-coding-validating`, this session)

Every medium+ risk-map row above, scored PASS/FAIL against real evidence
— never plausibility language.

| Assumption | Risk | Proof required | Evidence found | Result |
|---|---|---|---|---|
| `stage-fsm.mjs`'s 2 flat-property reads can be safely redirected through `resolveWorkflow` | Medium | Read the real lines, confirm `resolveWorkflow` already exists and is exported | `src/state/workflow-stage-graphs.mjs` read directly this session (D17's own scout, re-confirmed by the independent opus review agent's spot-check: "stage-fsm.mjs:94, plan.mjs:519, loop.mjs:1297... all hold") | PASS |
| `workflow-stage-graphs.mjs` aggregator rewrite is buildable against real `yaml` package, no new dependency | High | Confirm `yaml` is a real, already-present dependency | `package.json:37`, `"dependencies": {"yaml": "^2.9.0"}` — the repo's ONLY real dependency, read directly this session | PASS |
| The 15-child split's concurrency plan (which pieces are safe to run via `fgos-fanout` at once) | High | Cross-check every child's real `footprint` array against every other's | Done mechanically this session (Python set-intersection over the JSON block above) — found 7 real collisions the original wave grouping missed; **plan.md's own "Phased execution order" section above was rewritten to match this evidence**, not the other way around | PASS (after correction — see the decision logged at seq 21388) |
| `.agents/skills/`/`.claude/agents/` external render-target shape stays byte-identical through the assembly-mechanism changes | High | Existing coexistence test still covers this | `test/e2e/coexistence-canary.test.mjs` exists (cited across multiple D-IDs, D7/D24); not re-run here (no code changed yet — this is a planning-stage gate, not an implementation verify) — **flagged, not proven**: this test's CURRENT pass/fail state should be re-confirmed once `{#task-skill-assembly-mechanism}` is actually implemented, not assumed green from citation alone |
| Current `main`/branch test baseline is green before any of this item's own code changes | Medium (methodological — affects how every child's own `npm test`-based verify should be read) | Run `npm test` for real, right now, before any child starts | **Ran `npm test` this session: 3483 tests, 3476 pass, 2 fail, 5 skipped, 83.4s.** The 2 failures are both in `test/runner/dispatch.test.mjs` (`.fgos/config.json`'s committed `runner` section not matching 2 assertions about `agy`'s `--dangerously-skip-permissions` arg and the worker's exact tool-grant list — looks like local `.fgos/config.json` drift from this machine's own RTK tooling, unrelated to any of tsk-397's 34 locked decisions or 15 planned children) | **FAIL as a blanket "npm test green" assumption — FLAGGED, not blocking.** Neither failing test is in any child's own named narrow verify scope (`stage-fsm`, `handoff`, `task-specs`, `dispatch` scoped tests would need checking individually — `dispatch.test.mjs` IS touched by `{#task-persona-key-extension}`'s own bare-suite verify, worth narrowing). Whoever runs a bare `npm test` verify (root item's own aggregate verify, `{#task-domain-registry-split}`'s own verify) must recognize these 2 specific pre-existing failures by name and not treat them as caused by this item's own work. Triaging/fixing them is explicitly OUT OF SCOPE for tsk-397 (not one of the 34 locked decisions) — noted here so nobody mistakes them for a regression this item caused. |

## Post-sync verification (main merged into `fgw/tsk-397`, 2026-08-20)

`tsk-3av` (out-of-process fanout/dispatch consolidation) landed on `main`
(`66f7b420 Merge branch 'fgw/tsk-3av'`) after this item forked at
`15ad6f06`. Synced `fgw/tsk-397` with `main` (merge commit `6a49f8b5`, no
conflicts) and diffed every file `main` touched since the fork against
this plan's own footprint list. Real drift found and corrected:

- **`src/runner/dispatch.mjs` is now a thin barrel re-export** (a
  DIFFERENT, earlier-merged item, `tsk-2uf-1`, not `tsk-3av` itself — split
  the former 2204-line file into `src/runner/dispatch/{config,resolve,
  mechanism,transport,prepare,cli}.mjs`). `executorIdForWork` (the
  persona/agent-type resolution key function both `{#task-persona-key-
  extension}` and `{#task-eligibility-inversion}` need to change) now
  lives in `src/runner/dispatch/cli.mjs`, not the barrel. **Corrected**:
  both children's live `footprint` field (`fgos edit tsk-397-10`/
  `tsk-397-11 --footprint ...`, seq 21528/21529) now names
  `src/runner/dispatch/cli.mjs` in place of `src/runner/dispatch.mjs`.
  The two still collide on the same real file, so their existing spine
  ordering (step 5 before step 6, §"Corrected structure") is unaffected —
  only the path string was stale, not the sequencing.
- **`workflow-stage-graphs.mjs`'s `codingDomain` object gained a new
  `workerContract` field** (`tsk-2uf-2`, additive, unwired). `{#task-
  domain-registry-split}` splits this exact object into `registry.yaml` —
  whoever implements it must carry `workerContract` across the split, not
  drop it as an unrecognized field.
- `docs/architecture-manifest.json` (+11 lines), `src/setup/
  registrations.mjs` (+250/-9), `src/intake/plan.mjs` (+48/-4) also
  changed on `main` since the fork, but all purely additive/orthogonal
  (new manifest entries for the new `dispatch/*.mjs` files, new
  `registerCheck`/`registerFix`/config-default entries via the file's
  existing additive-registration pattern, a new `context-render` helper +
  message-formatting tweaks) — no collision with any of the 15 children's
  own planned edits, no plan change needed.

No other footprint file this plan names was touched by `main` since the
fork. `npm test` re-run pending as part of executing the first child.

## Outstanding questions

None
