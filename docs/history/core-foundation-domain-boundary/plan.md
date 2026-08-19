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

### Phased execution order (dependency waves, from §7's own "Quan hệ" fields)

- **Wave 1 (no dependencies, safe to run concurrently via `fgos-fanout` once materialized):** `{#task-taskspec-migration}` (D9), `{#task-domain-registry-split}` (D3/D4/D10/D17/D29/D30/D31), `{#task-role-rename}` (D16), `{#task-domain-specs-folder}` (D8), `{#task-skill-assembly-mechanism}` (D7), `{#task-persona-key-extension}` (D15/D20), `{#task-doctrine-domain-split}` (D23).
- **Wave 2 (depends on Wave 1 pieces named):** `{#task-taskspec-path-resolver}` (D11, needs domain-registry-split + taskspec-migration), `{#task-bundle-for-stage}` (D14/D29/D30, needs domain-registry-split + taskspec-migration), `{#task-coding-skill-migration}` (D3/D7/D34, needs skill-assembly-mechanism), `{#task-architecture-manifest-domain-silo}` (D12, needs domain-registry-split), `{#task-core-task-specs}` (D27, should follow role-rename so new files are authored `role:` not `position:` from the start).
- **Wave 3:** `{#task-eligibility-inversion}` (D20/D21/D22/D26, needs taskspec-migration; benefits from core-task-specs existing so all 7+13 task-specs get `requires-skill` coverage in one pass), `{#task-agent-domain-split}` (D24/D33, pairs naturally with eligibility-inversion since both touch `agents/*.yaml`).
- **Wave 4:** `{#task-sync-nesting-cap}` (D25/D28, needs eligibility-inversion's real `requires-skill` data to have anything to mismatch against).

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
  `fgos-fanout` running Wave 1's independent children concurrently — each
  child's `footprint` (below) is written precisely so
  `footprintOverlapAmong` can catch a real collision before any two
  Wave-1 children run at once.
- **Partial failure:** if a Wave-2/3/4 child fails mid-implementation
  after an earlier wave already merged into `fgw/tsk-397`, the earlier
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

```json
[
  {
    "title": "Di dời docs/task-specs/coding/*.md sang domains/coding/task-specs/",
    "verify": "npm test -- task-specs && node bin/fgos.mjs doctor --check task-specs-resolve",
    "action": "D9: 13 task-spec thật di dời nguyên vẹn, sửa 2 hardcode path trong registrations.mjs",
    "footprint": ["docs/task-specs/coding/", "domains/coding/task-specs/", "src/setup/registrations.mjs"],
    "kind": "chore",
    "risk": "standard"
  },
  {
    "title": "Tách DOMAINS registry thành aggregator + registry.yaml + workflows/*.yaml",
    "verify": "npm test",
    "action": "D3/D4/D10/D17/D29/D30/D31: registry.yaml (roleGraph+cờ+selector) + workflows/feature.yaml, aggregator quét cả 2, xoá 2 điểm đọc property phẳng (stage-fsm.mjs:94, plan.mjs:519+loop.mjs:1297)",
    "footprint": ["src/state/workflow-stage-graphs.mjs", "src/state/stage-fsm.mjs", "src/intake/plan.mjs", "src/runner/loop.mjs", "domains/coding/registry.yaml", "domains/coding/workflows/feature.yaml"],
    "kind": "task",
    "risk": "heavy"
  },
  {
    "title": "Đổi tên role human-advisor -> advisor, sweep position->role trong task-spec header",
    "verify": "npm test -- roleGraph handoff && grep -rL 'human-advisor' src/ | wc -l",
    "action": "D16: roleGraph.roles + mọi edge to:'human-advisor' đổi thành 'advisor'; sweep header position->role ở mọi task-spec",
    "footprint": ["src/state/workflow-stage-graphs.mjs", "docs/task-specs/coding/*.md"],
    "kind": "chore",
    "risk": "light"
  },
  {
    "title": "Tạo domains/coding/specs/ + domains/marketing/specs/ rỗng",
    "verify": "test -d domains/coding/specs && test -d domains/marketing/specs && git status --short docs/specs | wc -l",
    "action": "D8-revised: 2 folder rỗng mới, docs/specs/ không đụng",
    "footprint": ["domains/coding/specs/", "domains/marketing/specs/"],
    "kind": "chore",
    "risk": "light"
  },
  {
    "title": "Thêm bước assembly vào skill-wrappers.mjs/build-skill-wrappers.mjs",
    "verify": "npm test -- skill-wrappers coexistence-canary",
    "action": "D7: lắp .agents/skills/* từ core/skills/*+domains/*/skills/* trước generate-wrapper; materializeSkillsIntoProject chạy sau",
    "footprint": ["src/config/skill-wrappers.mjs", "scripts/build-skill-wrappers.mjs"],
    "kind": "task",
    "risk": "standard"
  },
  {
    "title": "Thêm resolveTaskSpecPath(domain, specId), sửa registrations.mjs gọi qua hàm này",
    "verify": "npm test -- registrations task-specs-resolve agent-claims-resolve",
    "action": "D11: resolver mới trong workflow-stage-graphs.mjs, đóng gap path.join thô ở registrations.mjs dòng 407/424",
    "footprint": ["src/state/workflow-stage-graphs.mjs", "src/setup/registrations.mjs"],
    "kind": "task",
    "risk": "standard"
  },
  {
    "title": "Thêm bundleForStage(domain, stage), sửa fgos-coding-implement bỏ hardcode task-spec path",
    "verify": "npm test -- bundleForStage && grep -c 'docs/task-specs/coding' .agents/skills/fgos-coding-implement/SKILL.md",
    "action": "D14/D29/D30: resolver mới trả {skill,taskSpec} qua resolveWorkflow trước, driving gọi 1 lần mỗi stage-entry",
    "footprint": ["src/state/workflow-stage-graphs.mjs", ".agents/skills/fgos-coding-implement/SKILL.md"],
    "kind": "task",
    "risk": "standard"
  },
  {
    "title": "Di dời 8 skill fgos-coding-* vào domains/coding/skills/, 7 skill vào core/skills/, _shared/ vào core/skills/_shared/",
    "verify": "npm test -- coexistence-canary",
    "action": "D3/D7/D34: 2 nơi trở thành canonical authoring mới, .agents/skills/ không còn sửa tay",
    "footprint": [".agents/skills/", "core/skills/", "domains/coding/skills/"],
    "kind": "chore",
    "risk": "standard"
  },
  {
    "title": "Mở rộng architecture-manifest.json + architecture.test.mjs thêm rule domain-siloing",
    "verify": "npm test -- architecture",
    "action": "D12: core không import domain cụ thể, domain không import domain khác -- reuse one-directional-import mechanism",
    "footprint": ["docs/architecture-manifest.json", "test/architecture.test.mjs"],
    "kind": "task",
    "risk": "standard"
  },
  {
    "title": "Tạo core/task-specs/ -- 7 task-spec cho 7 skill domain-agnostic",
    "verify": "npm test -- task-specs-resolve",
    "action": "D27: rút hợp đồng input/output/gates/verify-template từ SKILL.md hiện có của 7 skill ra file task-spec tường minh",
    "footprint": ["core/task-specs/"],
    "kind": "docs",
    "risk": "light"
  },
  {
    "title": "Đảo hướng eligibility: agents/*.yaml claims->skills, task-spec thêm agent/requires-skill",
    "verify": "npm test -- project-agents checks",
    "action": "D20/D21/D22/D26: agent-type khai skills thay claims, task-spec khai agent/requires-skill, dispatch.mjs resolve qua skill-match với tie-break D32",
    "footprint": ["agents/", "scripts/project-agents.mjs", "src/setup/registrations.mjs", "src/runner/dispatch.mjs", "domains/coding/task-specs/", "core/task-specs/"],
    "kind": "feature",
    "risk": "heavy"
  },
  {
    "title": "Tách doctrine core/domain: AGENTS.md gốc rút gọn, domains/coding/AGENTS.md mới, routing tự Read",
    "verify": "npm test && grep -c 'fgos-coding-' AGENTS.md",
    "action": "D23: cắt mục fgOS Workflow + GitNexus khỏi root, dời sang domains/coding/AGENTS.md, fgos-routing đọc thêm khi domain resolve",
    "footprint": ["AGENTS.md", "CLAUDE.md", "domains/coding/AGENTS.md", ".agents/skills/fgos-routing/SKILL.md"],
    "kind": "task",
    "risk": "standard"
  },
  {
    "title": "Tách agents/*.yaml thành core/agents/ + domains/<name>/agents/, doctor check unique tên",
    "verify": "npm test -- project-agents && node bin/fgos.mjs doctor",
    "action": "D24/D33: project-agents.mjs quét cả 2 nguồn, doctor check mới bắt tên agent-type unique toàn cục",
    "footprint": ["agents/", "core/agents/", "domains/coding/agents/", "scripts/project-agents.mjs", "src/setup/registrations.mjs"],
    "kind": "task",
    "risk": "standard"
  },
  {
    "title": "Mở rộng persona/agent-type resolution key thành (domain, stage, role)",
    "verify": "npm test -- dispatch",
    "action": "D15/D20: thêm tham số stage vào key tra cứu, no-op hôm nay, shape sẵn cho tương lai",
    "footprint": ["src/runner/dispatch.mjs"],
    "kind": "task",
    "risk": "light"
  },
  {
    "title": "Mở rộng handoff.mjs thêm cap độ sâu sync LỒNG",
    "verify": "npm test -- handoff",
    "action": "D25/D28: openSyncDepth param mirror openCallDepth, chỉ tăng khi sync lồng thật, không tính sync tuần tự",
    "footprint": ["src/state/handoff.mjs"],
    "kind": "task",
    "risk": "standard"
  }
]
```

## Outstanding questions

None
