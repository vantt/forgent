# tsk-3ac — Capability-gated labeling helper as the orchestrator seam

Item: `tsk-3ac` (tier/kind/risk = standard/feature/standard), child T3 of
`tsk-2sj`.

Mode: **standard** — 3 flags apply: *external systems* (the helper shells
out to the `herdr` CLI, and the new gate shells out to `fgos tool query`),
*public contracts* (`rename.sh`'s own always-exit-0 contract plus the prose
of three skills), *weak proof around the area* (nothing in `npm test`
covers `rename.sh` or any of the three `SKILL.md` files — the only hits for
them under `test/` are comments). No hard-gate flag. `tiny`/`small` would
not honestly cover it: the change alters the runtime precondition of a
script every `/fgOS:pick` already runs, and moves a call site between
skills, which is more than "a few files, no gray areas".

## Nguồn quyết định

This item has **no `CONTEXT.md` of its own**, and that is the correct
structure: it was created by `fgos-coding-planning` as a split child with
`--stage planning`, inheriting its parent's already-locked decisions rather
than repeating an `exploring` pass. The locked sources are:

- `docs/history/orchestrator-worker-slots/DISCUSSION.md` §4 (D2, D5), §5
  vòng 4, §6 "Nhãn: session tự đặt qua helper skill có gate", §7
  `#task-labeling-port`.
- `docs/history/orchestrator-worker-slots/plan.md` — "T3 — Helper đặt nhãn
  có capability-gate" and the "Chia việc" table, which **corrects**
  `DISCUSSION.md` §7 on one point: T3 does NOT depend on T1 (D5 pins the
  session as knowing its own id, so no binding read from the engine is
  needed). `fgos graph tsk-3ac --json` agrees — `deps: []`, nothing
  downstream waits on it.
- `docs/history/orchestrator-worker-slots/RESEARCH.md` F-E — the tool
  registry is the existing mechanism; no new mechanism is needed.

Verify convention: `docs/how-to/write-verify-for-a-skill-prose-change.md`
(`npm test && POSITIVE && NEGATIVE`).

## Approach

### Đường đã chọn

**The seam is `rename.sh` itself, not its call sites.**

The capability gate goes inside the script. Every caller — `/fgOS:pick`
step 3, `fgos-coding-driving`, any future launcher — therefore inherits the
gate for free, and swapping herdr for tmux/cmux later means registering a
different provider, not editing N prose files. Four concrete pieces:

1. **Declare the capability.** `fgos tool register --name herdr --kind cli
   --capability pane-labeling --command herdr`, through the existing
   registry (`src/state/tool-registry.mjs`; `normalizeCapability` `:49`
   folds the label to `pane-labeling`, `KINDS` `:35` accepts `cli` — the
   real line numbers today; RESEARCH F-E's `:43`/`:34` are one edit stale,
   the symbols themselves are unchanged). No new
   mechanism (RESEARCH F-E). This is a state write through the one door,
   not a code change — it lands in `.fgos/events.jsonl`, which this repo
   tracks, so it propagates to clones.

2. **Gate `rename.sh` on the capability.** Ahead of the existing
   herdr-specific guards, query the registry; **zero registered providers
   ⇒ silent no-op, exit 0** — the same shape the script already has when
   `HERDR_ENV` is unset. That is what makes an environment with no
   pane-label concept a clean skip rather than a failure (D5, and the
   "absent capability = clean skip" contract `tool-registry.mjs`'s own
   header already states).

3. **Pin the execution-lane call site at `fgos-coding-driving`.** It knows
   the item id earliest and sees every stage change, so one call there
   replaces N launchers each remembering to call it (§6, "Phân công đặt
   nhãn theo lane — Lane execution"). §6 also pre-answers the obvious
   objection: calling a gated, no-op helper is a mechanical action, not a
   routing judgment, so it does not break that skill's "purely mechanical
   loop" hard rule.

4. **Remove the scattered call in `discover-next` step 6** — a
   "nice-to-have" optional rename that predates the pinned call site.

### Gate on *registered*, not on `--status present`

`fgos tool query --capability pane-labeling --status present` only answers
`present` once someone has run `fgos tool check` on that machine; until
then the status reads `unknown` and the filter returns nothing
(`bin/fgos.mjs:4110-4121`, `resolvedStatus`). Gating on `--status present`
would therefore turn labeling off on every fresh clone until an unrelated
command happened to be run — a silent regression with no signal.

So the split is: **registry answers "does this environment have the
concept"; the adapter's own guards answer "and is it usable right now".**
The existing `HERDR_ENV=1` / `command -v herdr` / `HERDR_PANE_ID` chain is
a strictly better presence check than a PATH probe anyway (herdr on PATH
does not mean this session is inside a herdr pane), so nothing is lost.

### Nothing reads a label (D2)

This item adds no reader of any pane label. The gate reads the *tool
registry*, never a label; `herdr pane rename` is write-only. D2 holds by
construction.

### Phương án đã cân nhắc và loại

| Phương án | Vì sao loại |
|---|---|
| Adapter poll loop draws the label itself | D5, explicitly rejected in §5 vòng 4: the commonest real case is a person opening a session and typing `/fgOS:pick` with no orchestrator process running at all — only the session knows what the pane is doing |
| Gate on `--status present` | Silently disables labeling until someone runs `fgos tool check` (see above) |
| New CLI verb / new registry for pane capability | RESEARCH F-E: `fgos tool register`/`query` already is the mechanism |
| Put the gate in each caller's prose instead of the script | Three prose call sites today, each free to forget it; the script is the one place every caller converges on |
| Remove `/fgOS:pick` step 3's own rename call | Out of the item's declared footprint, and it would leave pick's `EnterWorktree`-fallback branch (where `fgos-coding-driving` is never invoked) with no label at all. `rename.sh` is idempotent, so the extra call is redundant, never wrong |

### Bản đồ rủi ro

`impact-analysis: degraded`. `fgos tool query --capability impact-analysis
--status present` returns gitnexus `present`, but that overlay is a cached
`tool check` result and `present` never means the index is fresh
(`CLAUDE.md`'s own gate wording). Checked directly: `node
.gitnexus/run.cjs status` reports `stale` — indexed commit `79fead3`
against current `18dbd4a`. So the posture is **degraded**, not `full`.

It is **not load-bearing for this item** either way: nothing in the
footprint is a code symbol GitNexus indexes (three `SKILL.md` prose files
and one bash script), so no row of the risk map below leans on blast-radius
evidence at all — blast radius here is established by `grep -rn` over call
sites, which is the primary evidence regardless of posture. The parent
plan's standing constraint (never let GitNexus alone lower a risk rating;
cross-check with `rg`/`grep`) is honored trivially. The gap is named
plainly rather than dropped: GitNexus's index is behind current HEAD, so
any blast-radius answer it gave would be stale — none was used.

| Thành phần | Mức | Cái gì chứng minh được |
|---|---|---|
| New gate in `rename.sh` | **TRUNG BÌNH** — every `/fgOS:pick` runs this script; a gate that mis-fires turns labeling off silently, or makes the script exit non-zero | Real run inside this very herdr pane (`HERDR_ENV=1`, `HERDR_PANE_ID` set, `herdr` on PATH): label applied before/after registration; `bash -n`; exit code 0 in all four combinations (provider registered/not × inside pane/not) |
| Registering `herdr` in the shared registry | THẤP — additive; the only reader of `pane-labeling` is the new gate. `checkToolRegistryConfigured` (`registrations.mjs:364`) always returns `passed: true`, so doctor cannot fail on it | `fgos doctor` still green; `fgos tool query` shows the provider |
| Prose call site moved to `fgos-coding-driving` | THẤP-TRUNG BÌNH — prose is LLM-interpreted, no static assert possible | `npm test` green; POSITIVE/NEGATIVE greps; runtime proof belongs to the event log per `write-verify-for-a-skill-prose-change.md` §"Chủ sở hữu chứng-minh-runtime" |
| Removing `discover-next` step 6 | THẤP — an explicitly optional nice-to-have; the labeling it offered now comes from the pinned call site one tier down (`/fgOS:discover` → `fgos-coding-driving`) | NEGATIVE grep; step renumbering stays consistent |

### Thứ tự

No ordering constraint from the graph (`deps: []`, nothing downstream).
Internally: register the capability first, so the gate can be exercised
against both a populated and an empty registry; then the script; then the
three prose files.

## Shape

1. `fgos tool register` the `pane-labeling` capability with `herdr` as its
   provider.
2. `plugins/fgOS/skills/terminal/rename.sh` — add the capability gate ahead
   of the herdr guards; keep every existing guard and the always-exit-0
   contract intact.
3. `plugins/fgOS/skills/terminal/SKILL.md` — document the gate and the
   `pane-labeling` capability (this is also the verify's POSITIVE anchor).
4. `.claude/skills/fgos-coding-driving/SKILL.md` — pin the execution-lane
   call, once per driving invocation, at the same position the
   `shownItemOnce` title/description print already occupies (both are
   "orient a human once per invocation", and the id is known there).
5. `plugins/fgOS/skills/discover-next/SKILL.md` — delete step 6.

### Ca đáng chứng minh

- **Biên rỗng:** no provider registered ⇒ exit 0, no `herdr` call.
- **Biên đủ:** provider registered + inside a herdr pane ⇒ label applied.
- **Hành vi cũ không vỡ:** provider registered but `HERDR_ENV` unset ⇒ exit
  0, silent (today's contract, unchanged).
- **Hỏng một phần:** `project_root` not a real checkout / `node` fails ⇒
  the query pipeline fails ⇒ exit 0, silent. Fail-closed is the right
  direction for a decoration.
- **Idempotence:** two callers in a row (`/fgOS:pick` step 3 then
  `fgos-coding-driving`) produce the same label, no error.

### Verify

```
npm test && grep -q 'pane-labeling' plugins/fgOS/skills/terminal/SKILL.md && ! grep -q 'Optional: rename the herdr pane' plugins/fgOS/skills/discover-next/SKILL.md
```

Unchanged from the item record — it already matches the required
`npm test && POSITIVE && NEGATIVE` shape, with a phrase (not a single word)
pinned on each side, so trap #5 of the how-to does not apply.

## Assumptions

- **A1 — Registering `herdr` for `pane-labeling` is enough to keep today's
  labeling behavior alive.** *Provable here* — this session runs inside a
  real herdr pane, so both branches of the gate can be exercised for real
  rather than reasoned about.
- **A2 — No consumer other than the new gate reads the `pane-labeling`
  capability.** *Provable by grep* over `src/`, `bin/`, `plugins/`,
  `herdr-plugin/src/`.
- **A3 — A second, redundant `rename.sh` call (pick step 3 + driving) is
  harmless.** *Grounded, not merely assumed*: `herdr pane rename` is
  idempotent for the same label, and the script's own contract is
  always-exit-0 regardless.
- **A4 — The two remaining "Optional: rename the herdr pane" mentions in
  `plan-next/SKILL.md` and `retro-next/SKILL.md` are deliberately left
  alone.** They are outside the item's declared `--footprint` (the sibling
  conflict contract T1/T2/T4 were split against), and they are not
  incorrect after this change — they route through the same now-gated
  script. Named here as a known, deliberate leftover rather than silently
  omitted; a follow-up item can consolidate them if the redundancy ever
  costs anything.
- **A5 — A8/D10's "landing place on the item for the driver's final
  report" is not part of this item.** The parent `plan.md`'s A8 assigns
  the *write* to T1 (engine) and only the *prose calling it* to T3. T1 has
  not shipped that write, and this item is contractually independent of T1
  (`deps: []`), so the prose has nothing to call yet. Its absence is
  scope, not an omission — it belongs to whichever item lands after T1's
  engine side exists.

## Outstanding questions

None
