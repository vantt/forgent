# launcher-vocabulary-rename — CONTEXT

## Feature boundary

Rename the pinned term "orchestrator" (decision 0026's name for the
pick-1-rootTask + stand-up + step-out role) to "launcher" across fgOS-owned
prose, and free the word "orchestrator" for a later, different meaning
(candidate: N-unit concurrent dispatch + result fan-in — `fgos-fanout`,
`fgos-runner --watch`). This item only frees the word and records that it
is reserved; it does not assign the new meaning.

The person locked "launcher" as the replacement term on 2026-08-08, after
scoring 4 candidates (launcher/invoker/activator/commander).

`impact-analysis: full` (GitNexus present, `fgos tool query --capability
impact-analysis --status present` — informational only; this item is
docs/prose-only, no code symbols are renamed, so blast-radius evidence
does not apply to this item's own scope).

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | The rename is delivered as a **new, separate decision record** that supersedes 0026 **on the "orchestrator" naming only** — 0026's own doctrine/design (native-first dispatch, the pick-1-rootTask + stand-up + step-out role's behavior) is untouched and stays cited from 0026. This follows the repo's own written policy, not a fresh judgment call: `docs/decisions/0000-index.md` line 27 states plainly "Đổi một quyết định = supersede record tương ứng bằng một record mới, không sửa tại chỗ" (changing a decision = supersede the record with a new one, never edit in place), backed by STR72's required backward pointer (`superseded_by` in the old record's frontmatter, `supersedes: [<old-id>]` in the new one). This is not a novel choice: it is the exact shape decision 0024 already used to rename `proposed`→`awaiting-approval` — 0024's frontmatter reads `supersedes: [0006]`, and 0024's own body says "record này chỉ supersede THUẬT NGỮ, không phải cạnh chuyển trạng thái" (this record supersedes the TERM only, not the state-transition edges) — term-only partial supersede, same shape this item needs. 0012's supersede of 0002 (deps/parent split) is the same pattern a second time. New record gets the next number in sequence: **0028**. |
| D2 | Consequence of D1: **`docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md` is never renamed.** Precedent: when 0024 superseded 0006's term, `0006-trang-thai-proposed.md`'s filename was NOT changed — it stays exactly as originally named, a historical record, only gaining a `superseded_by: 0024` frontmatter pointer. Applying the same rule to 0026 means its filename keeps the word "orchestrator" permanently, as a historical artifact — this is consistent with this item's own allowlist principle for `plans/reports/**` ("bản ghi lịch sử, không sửa ngược"). **This resolves the file-rename question the item's own description raised as material** ("Có đổi tên FILE 0026... hay không? 6 skill... đang trỏ tới file này bằng đường dẫn"): since the file is never renamed, the 12 skill files (6 in `.claude/skills/`, 6 mirrored in `.agents/skills/` — confirmed by scout below) that reference `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md` by path need **zero path changes**. 0026's own body prose may still gain inline notes pointing at the new 0028 record (normal supersede hygiene), but that is `fgos-coding-planning`'s shaping detail, not a second decision. |

## Pinned terms

- **launcher** — the pick-1-rootTask + stand-up + step-out role formerly
  called "orchestrator" in decision 0026's prose. Locked by the person,
  2026-08-08, after comparing launcher/invoker/activator/commander.
- **orchestrator** (post-rename) — reserved, unassigned. Do not attach a
  new meaning to it in this item; a future item may claim it for N-unit
  concurrent dispatch + fan-in (candidates already floated: `fgos-fanout`,
  `fgos-runner --watch`).

## Scout evidence

`rg -il "orchestrator" --glob '!node_modules' --glob '!.git' .` (repo
root) returns matches far broader than the item description's own
enumerated scope list. The description's scope list already anticipates
this ("mọi docs/history/* khác dùng từ này theo NGHĨA 0026 (kiểm từng chỗ,
đừng đổi hàng loạt mù)") — per-spot triage is explicitly `fgos-coding-planning`/
execution's job, not re-litigated here. Full result set, for planning's
own Approach/Shape step to triage spot-by-spot against the item's PHẠM VI
ĐỔI / ALLOWLIST:

- Already in the item's own named scope: `docs/decisions/0026-...md`,
  `docs/history/two-layer-dispatch/{CONTEXT,DISCUSSION}.md`,
  `docs/how-to/wire-a-skill-through-the-native-vs-cli-spawn-dispatch-
  decision.md`, `docs/how-to/reuse-the-shared-capacity-dispatch-fallback-
  fragment.md`, `src/runner/{worker-log,loop,dispatch}.mjs` (comments only).
- Confirmed allowlisted, skip entirely: `herdr-plugin/src/{main,pick,
  ports}.rs` (`PaneOrchestrator`, a distinct Rust concept — terminal pane
  open/focus trait, correct usage, do not touch), `docs/distillery/**`
  (verbatim upstream extraction), `plans/reports/**` (historical records).
- **Not named in the item's scope list, needs per-spot triage at planning
  time** (present tense/sense unconfirmed per spot): `docs/architecture-
  map.md`, `docs/backlog.md`, `docs/decisions/0013-discovered-from-runner-
  report-channel.md`, `docs/enduser-docs-index.json`, `docs/explanation/
  discovery-decompose-reporoot-verify-overwrite.md`, `docs/explanation/
  why-execution-fan-out-reuses-computeschedule-instead-of-selectwave.md`,
  `docs/explanation/why-fgos-dispatch-splits-into-gather-packets-and-a-
  gated-exec-packet.md`, `docs/explanation/why-stage-skills-forbid-ad-hoc-
  task-delegation-for-their-own-reasoning.md`, and roughly two dozen more
  `docs/history/<feature>/{CONTEXT,plan,session-source,repro-notes}.md`
  files (full list reproducible via the same `rg` command above — not
  hand-copied here to avoid staleness). `docs/history/herdr-*` entries in
  this set are already allowlisted by the item description ("mọi
  docs/history/herdr-* nói về PaneOrchestrator") when their usage is the
  Rust pane concept, not 0026's sense — still needs a per-file check, not
  a blanket skip, since a herdr-prefixed doc could in principle cite 0026
  too.
- Path-reference scout for D1/D2 (`rg -l "0026-vision-orchestrator"`):
  exactly 6 files under `.claude/skills/` (`fgos-clarifying`,
  `fgos-coding-exploring`, `_shared/capacity-dispatch-fallback.md`,
  `fgos-coding-planning`, `fgos-coding-implement`, `fgos-coding-validating`) and the same
  6 mirrored under `.agents/skills/` — 12 total, matching the item
  description's own count. `plugins/fgOS/skills/` has zero references.
  None of these need edits under D2 (file path unchanged).

## Canonical references

- `docs/decisions/0000-index.md` (supersede policy, line 27 + STR72
  backward-pointer rule, lines 30-32)
- `docs/decisions/0024-doi-ten-status-proposed-thanh-awaiting-approval.md`
  (precedent: term-only partial supersede, filename of superseded record
  unchanged)
- `docs/decisions/0012-typed-edge-model-supersedes-deps-parent-separation.md`
  (second precedent, same shape)
- `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-
  spawn.md` (the record being partially superseded)

## Outstanding questions deferred to planning

- Exact title/wording of the new 0028 decision record — authoring detail,
  `fgos-coding-planning`'s call.
- Per-spot classification of every "not named in scope" file listed above
  (does this specific occurrence use "orchestrator" in 0026's sense, or an
  unrelated/generic sense?) — `fgos-coding-planning`'s Approach/Shape step, using
  the scout list above as its starting point rather than re-scouting from
  scratch.
- Guard test's precise allowlist implementation (regex vs path-list) for
  `test/docs/launcher-vocabulary-guard.test.mjs` — implementation detail,
  not a product decision.
