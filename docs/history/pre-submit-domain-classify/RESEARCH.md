# Research log (tsk-3m6)

## Round 1 — 2026-08-11

**Asked:** Is there anything blocking the item from moving forward past
`discovery`, given CONTEXT.md already locked D1/D2 and named two
implementation-mechanism questions as deferred to `fgos-coding-planning`? In
particular: does a headless-capable classification mechanism already exist
that D1 (Bước A must also work on headless submit paths) could point at?

**Checked:**
- `.fgos/config.json` `runner.capacities` (repo, read directly) — today
  declares exactly three capacities: `judge-discovery`, `judge-decompose`,
  `gather`. No `classify`/`classification`-purpose capacity is registered
  here today.
- `fgos tool query --capability impact-analysis --status present` output,
  captured earlier this item (2026-08-10, exploring-stage scout) —
  `fgos list --id tsk-3m6 --json`'s `data.tools` also surfaces a
  `submit-assist-classify` entry (`kind: cli`, `capability: classification`,
  `command: agy`, description "submit-assist tier/kind/risk classification
  via agy (gemini backend)"). This is registered through the separate
  `fgos tool register` door (`registerTool`, `src/state/store.mjs`), NOT
  through `runner.capacities` — confirmed by the capacities list above
  containing no such key.
- `rg -- "submit-assist-classify"` across the repo — found in
  `test/runner/dispatch.test.mjs` (capacities fixtures using that name),
  and in three planning docs: `plans/reports/dispatch-architecture-audit-
  260808-1238-.../report.md`, `plans/reports/project-instability-scan-
  260809-1608-.../report.md`, and `plans/260808-2210-dispatch-vocabulary-
  rearrange/next-session-prompt.md`.
- `git log --oneline --grep="submit-assist-classify"` — one hit,
  `8d02778e docs(tsk-5td): close out dispatch-concept-boundary
  DISCUSSION.md`; the project-instability-scan report additionally cites a
  commit `a61651d` renaming the `submit-assist-classify` *capacity* to
  something else. Net effect: the name `submit-assist-classify` now only
  resolves to the `tools` registry entry, not a live capacity — the
  `plans/260808-2210-dispatch-vocabulary-rearrange/next-session-prompt.md`
  document (still only a resumable prompt, no `plan.md` committed —
  i.e. genuinely still open) is explicitly about untangling this exact
  `capacities.*` vs `tools.*` name collision, calling it coincidental
  ("ngẫu nhiên") that both registries independently picked the same name
  for the same underlying `agy`/`kind:cli` shape.

**Found:**
- This item's own original open question (iii) — "capacity
  `coding-classify-intake` từng được nhắc ở đây giờ đã bị xóa (tsk-49u)" —
  is accurate and still holds; no successor classify-purpose capacity has
  replaced it in `runner.capacities`.
- The item's earlier working assumption that `submit-assist-classify` is
  "có sẵn qua `.fgos/config.json` `runner.capacities`" is not accurate as
  of this session: that name now resolves only to a `tools` registry entry
  (a different registration door), not a `runner.capacities` entry. Whoever
  picks the headless mechanism for Bước A in `fgos-coding-planning` should not
  assume `capacities.submit-assist-classify` exists to dispatch through —
  it does not, today.
- A separate, already-tracked effort (`plans/260808-2210-dispatch-
  vocabulary-rearrange/next-session-prompt.md`) is mid-flight on exactly
  this `capacities` vs `tools` naming/vocabulary question, independent of
  this item. This item's planning stage should treat that as prior art to
  read before inventing a new capacity name, not as something to resolve
  itself — this item's own footprint should stay `domain`-classification
  only.

**Still open (for `fgos-coding-planning`, unchanged from CONTEXT.md):** which
concrete mechanism Bước A uses to satisfy D1's headless requirement. This
round found no existing ready-to-use classify-purpose capacity to point
at — planning starts from "register something new" or "reuse the `tools`
registry's `submit-assist-classify` entry directly", not "wire into an
existing capacity" as the item's own original text assumed.

**Verdict:** clear — nothing found here blocks moving the item forward;
the mechanism question stays exactly where CONTEXT.md already placed it
(deferred to planning), now with a corrected, cited premise instead of a
stale assumption.
