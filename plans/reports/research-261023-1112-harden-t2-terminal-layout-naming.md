# Terminal-control layout and naming review (HARDEN T2)

Read-only review, 2026-10-23 (Asia/Saigon). Question from the owner: should terminal-control's layout and tab/pane naming improve, for example three columns when a group of three opens on a widescreen. No source, test, spec or config file was touched; no herdr pane or tab was created, resized or closed. Only `herdr ... --help` and one `herdr pane layout` read were run.

Paths below are relative to `/home/vantt/projects/forgent`. TC = `packages/terminal-control`.

## 1. How placement works today

### 1.1 Flow of one allocate

- `Core::allocate` publishes nothing until a pane exists: `place` -> record -> group hint (TC/rust/src/core.rs:196-240).
- `place`: an empty live group opens a new tab (the pane that comes with the tab is the first pane); otherwise `place_measured` if the driver declares `layout.geometry`, else `place_by_count` (core.rs:303-313).
- `place_measured` measures every live group pane with `layout_geometry`, builds `PlaceInput`, asks the policy, applies `Split` or `NewTab`, then `keep_if_roomy` re-measures the new pane and closes it if it is under the minimum, opening a new tab instead (core.rs:329-401).
- The first pane of a tab is accepted even if the whole tab is smaller than the minimum, to avoid opening tabs forever (docs/platform/terminal-control/spec.md:112).

### 1.2 The policy (measured-split)

- Registry: one policy, `measured-split` (TC/rust/src/policy/mod.rs:68-72; TC/contracts/placement-policy.v1.json `registry`). Node keeps a second copy of the name list, `KNOWN_POLICIES` (src/terminal-control/config.mjs:15).
- Rule (policy/measured_split.rs:143-204): for every live group pane and each of `right`, `down`, take the smaller child at ratio 0.5 (`width/2` or `height/2`), require it to be >= `minCols` or `minRows` and the other axis to be >= its minimum, score = smaller child divided by the minimum (exact fraction compare, :129-135). Highest score wins, tie goes to `right` before `down`, then to the earliest anchor in `groupPanes` order (:149-152, :181-189). No candidate, or a tab already at `maxPanesPerTab` panes (counting every owner's panes, :154, :207-214) -> `NewTab`.
- Ratio is the constant 0.5 (:114). herdr's `ratio` is the share kept by the old pane (spec.md:111).
- The policy reads only geometry and limits, never labels or role hints (module doc, :1-3; `roleHint` is hard-coded `None` at core.rs:354, so it is inert, council E-26).

### 1.3 Geometry that is read

- `pane layout --pane P` gives the tab area and every pane rect (herdr.rs:94-103, 618-628). Live sample: area 352x69, two panes 176x69 each, plus a `splits[]` tree with `direction`, `id`, `ratio`, `rect` per split (output of `herdr pane layout`, read once).
- For every pane in the answer the driver then spawns `pane process-info` and reads the real pty size with ioctl on `/proc/<shell_pid>/fd/0` (herdr.rs:358-361, 618-628, 676-688). Reason: with two clients attached the reported rect was 40x8 while the pty was 18x51 (spec.md:110).
- The pty size is used only in `keep_if_roomy` (core.rs:386-401, `pane.pty` first, rect second). The policy itself reads `rect` (measured_split.rs:157-158). So the per-pane process-info spawns done before the policy are not used by the policy.

### 1.4 Config defaults and the floor

- `terminal.layout`: `policy: measured-split`, `minCols: 80`, `minRows: 20`, `maxPanesPerTab: 8` (src/terminal-control/config.mjs:27; rationale spec.md:123-125: "a 352x69 tab holds eight 88x34 panes").
- Hard floor 40x8 is enforced only by doctor, not by the policy (config.mjs:19, 103-109).
- No-geometry fallback: split the newest live group pane `down` at ratio 0.3, new tab at `maxPanesPerTab` (core.rs:19-20, 408-417). Because the ratio is the old pane's share, each new pane gets 70% of the previous one: 30% / 21% / 14.7% ... uneven by construction. Only reachable if herdr lacks `pane layout` (herdr.rs:389-393), so effectively dead on current herdr.

### 1.5 herdr driver commands

- New tab: `herdr tab create --label <label> --no-focus [--cwd] [--env]` (herdr.rs:425-431). Session without a workspace: `workspace create --label`, then `tab rename <tab> <label>` (herdr.rs:439-451).
- Split: `herdr pane split --pane A --direction right|down --ratio R --no-focus` (herdr.rs:458-475). `herdr pane split --help` lists `--direction`, `--ratio`, `--cwd`, `--env`; no label option.
- Label: `pane rename <pane> <label>`, `tab rename` (herdr.rs:608-616). `herdr pane report-metadata --source ID --title/--display-agent/--state-label/--token` exists (help) and is unused by the driver.

### 1.6 What herdr supports natively

From `herdr pane --help`, `pane resize --help`, `tab --help`, `herdr --skill`:

- Native: `pane layout` (rects and split tree with ratios), `pane split --ratio`, `pane resize --direction left|right|up|down --amount <FLOAT>` (moves a split border; unit and semantics not documented in help, must be measured), `pane swap`, `pane move`, `pane zoom`, `pane neighbor/edges`.
- Not found: any equalize, even-layout, tile or "layout preset" command. The driver must compute targets itself. The capability list also names `pane.resize/pane.swap/pane.move` with no trait method and a test forbidding drivers to declare them (council E-26, driver/mod.rs:23-25), so resize would first need a real port method.

## 2. What a person sees today (derived by hand from the rule above)

Assumes the tab area equals the terminal size, no border cost (the live sample shows 352 -> 176+176, so no border cells). Defaults 80x20, max 8. Score = smaller child / minimum; "tie" resolved right before down, earliest anchor.

### 2a. Widescreen 240x60

```
1 pane   240x60
2 panes  right 120/60 (tie 1.5 vs 1.5 -> right)   +---------+---------+
                                                  |  P1     |  P2     |
                                                  | 120x60  | 120x60  |
                                                  +---------+---------+
3 panes  P1 down (tie, earliest anchor)           +---------+---------+
                                                  | P1 120x30|        |
                                                  +---------+  P2     |
                                                  | P3 120x30| 120x60 |
                                                  +---------+---------+
4 panes  P2 down (only fit)                       2x2 of 120x30
5 panes  every pane 120x30: right 60<80, down 15<20  -> NEW TAB
```

Three panes are 2+1, not three columns. A tab holds at most 4 here.

### 2b. Normal 160x45

```
1 pane  160x45: right 80/80 = 1.00, down 22/20 = 1.10 -> down
2 panes  +-----------------+
         | P1 160x23       |
         +-----------------+
         | P2 160x22       |
         +-----------------+
3 panes  P1 right (tie, earliest)   +---------+-------+ top 80x23 each
                                    |   P1    |  P3   |
                                    +---------+-------+
                                    |   P2 160x22     | bottom full width
                                    +-----------------+
4 panes  P2 right -> 2x2 of 80x23/80x22
5 panes  new tab
```

The second pane goes under the first, not beside it, because `down` scores 1.10 against 1.00. A tab holds 4.

### 2c. Narrow and tall 110x80

```
1 pane  right 55<80 not allowed, down 40/20 = 2.0 -> down
2 panes  110x40 / 110x40
3 panes  P1 down (tie 1.0, earliest): 110x20 / 110x20 / 110x40   (25% / 25% / 50%)
4 panes  P2 down: four rows 110x20
5 panes  new tab
```

Reasonable direction, uneven at 3 (fixture portrait-110x80 only pins the first split).

### 2d. Very wide 352x69 (spec's reference)

Fixtures (TC/contracts/policy-fixtures/): three panes already present is left column 176x35 + 176x34, right 176x69, and the 4th pane splits k2 down. A 352x69 tab fills 8 panes (88x34 each). The 3-pane shape is again 2+1.

Summary: only counts that are a power of two give equal panes; N=3 is always one big pane and two half-size panes; the heuristic never produces three columns.

## 3. Naming today

### 3.1 Dispatched worker panes

- Group key: `portKey(dispatchBatchKey ?? runId ?? workId ?? key)` (src/runner/dispatch/herdr-round.mjs:391; `portKey` strips to `[A-Za-z0-9._-]`, max 128, src/runner/dispatch/terminal-slot.mjs:34-37).
- Display: `slotDisplay({ groupKey, agent: agentKind, model })` (herdr-round.mjs:397), label = `groupKey.slice(0,40)` (terminal-slot.mjs:78-87). `role` is never passed.
- Tab label: that string, set by `tab create --label` for the first pane only (core.rs:316, herdr.rs:427). A person sees a tab named by a batch/run/work id slug, for example a sanitised id with no title, no role, no provider.
- Pane label: never written for allocated panes. `split` has no label argument and `label_pane` is called only by the port's `label` op (core.rs:662-666). `display.role/agent/model` are stored in the record (core.rs:221) but never reach herdr (also `report-metadata --title/--display-agent` is unused). What herdr shows for such a pane is herdr's own default plus its agent detection; not verifiable from code.
- Second tab of the same group (overflow, anchor died) reuses the same label (core.rs:323-327), so two tabs with identical names.

### 3.2 A person's own session pane (/fgOS:terminal)

- plugins/fgOS/skills/terminal/rename.sh:95-98 builds `task_id | fg.ssid:<writer id> | a.ssid:<claude session id>`, drops unresolved segments, drops fg.ssid if equal to a.ssid (:91-93), then attaches the pane and calls `label` (:103-105). Example: `tsk-x | fg.ssid:<uuid> | a.ssid:<uuid>`.
- No truncation anywhere in this path. Two 36-char ids push the actual task id into a line herdr will clip; the tab bar and pane title truncate on the right, so the only useful part (task id) survives but the rest is noise.
- Only the pane is renamed, never the tab; the tab keeps whatever it had.
- The same line is re-written at every stage change (SKILL.md "single pinned call site"), harmless but it is the only place a label is rewritten.

### 3.3 Inconsistencies

1. Two label formats in the same herdr session: worker tab = id slug; own pane = `tsk | fg.ssid | a.ssid`. Neither carries a work-item title, role, or provider in readable form.
2. Worker panes carry no label at all while the lead's pane carries a long one.
3. Role and provider are collected (`slotDisplay`, `Display.role/agent/model`, port contract) but never shown.
4. Raw ids dominate (batch key, run id, two uuids); nothing human is read from the work item.
5. A group's overflow tab repeats the first tab's label.
6. `role` is dropped at the call site (herdr-round.mjs:397) and `roleHint` is inert (core.rs:354), so any scheme using role needs plumbing, not just formatting.

## 4. Proposals

Prior art to respect: the 2026-10-15 council "rejects ... a layout engine by screen ratio" (spec.md:191). Proposals below stay inside the placement-policy seam (spec.md:102 says "a better layout can be added without touching the core or a driver"), use measured geometry, and add no model of screen ratio beyond the measured area. Owner should still confirm that decision is not being reopened by P2.

### P0. Measure once per allocate (bug, pure improvement)

- Problem: `place_measured` calls `layout_geometry` once per live group pane (core.rs:335-336); each call spawns `pane process-info` for every pane of that tab (herdr.rs:618-628), then `keep_if_roomy` repeats the call (core.rs:389). Spawns per allocate into a tab of N panes about (N+1)(N+1) (council E-26). The policy does not use the pty value; only `keep_if_roomy` does (measured_split.rs:157-158).
- Change: in `place_measured` measure once per distinct `tab_id` (the stored record has `tab_id`), and read pty only for the new pane in `keep_if_roomy`. Equivalent: make pty reading an argument of `layout_geometry`. No contract change.
- Cost: core.rs about 25 lines, herdr.rs about 10, one test update; Risk: low (policy input is the same rects). RUL104: better, not bigger.

### P1. Geometry-aware split rule (policy extension)

- Problem: widescreen group of 3 is 2+1 (section 2a), group of 3 on 160x45 is 2 on top + 1 wide (2b). Owner prefers three columns on a wide screen.
- Change: add a second named policy `even-split` (registry in policy/mod.rs, contract `registry.names`, `KNOWN_POLICIES`), selected by `terminal.layout.policy`, default unchanged until the owner picks. It still sees only `PlaceInput`. Rule, with n = panes the tab would hold after this one:
  1. Choose shape from measured area A = `tab.area`: `cols = max c <= n with A.width / c >= minCols`, `rows = ceil(n / cols)`; require `A.height / rows >= minRows` else `NewTab`. This makes a 240x60 tab take 3 columns (80x60), 4 panes become 2x2 at 240 wide (60 < 80 so four columns are refused) or 4 columns at 352 wide (88 >= 80); a 110x80 tab takes rows (cols = 1); 160x45 takes 2 columns x 2 rows for 3-4 panes.
  2. Place the new pane next to the last pane of the shortest row/column so shapes stay balanced; direction comes from the shape, not from a score.
  3. Keep the existing size check and `maxPanesPerTab`.
- Ratio (equal sizing, see P2): the policy returns the ratio, so it can plan equal pieces when it knows the final count.
- Looks like:

```
240x60, N=3                 160x45, N=3                  110x80, N=3
+-----+-----+-----+         +--------+--------+          +----------+
| P1  | P2  | P3  |         |  P1    |  P2    |          |   P1     |
| 80  | 80  | 80  |         +--------+--------+          +----------+
+-----+-----+-----+         |      P3 160     |          |   P2     |
                            +-----------------+          +----------+
                                                         |   P3     |
                                                         +----------+
```
- Cost: new policy about 90 lines in policy/even_split.rs plus 8 fixtures beside the existing 16; mod.rs registration; config.mjs `KNOWN_POLICIES` one word (or the council E-14 plan to read names from the core); contract JSON `names` and a short rule block; spec section 8 text. Risk: medium: 3-column cells are exactly 80 at 240 wide, so a client that is a few cells narrower silently drops to 2+1 (rule then falls back to rows/grid; documented). Addition the owner must pick: yes, a new policy (a behaviour change only if the default is switched).

### P2. Equal sizing after each split

- Problem: nested halving gives equal panes only for 1, 2, 4, 8. Three columns by halving are 50/25/25 (A | (B|C)); three rows 25/25/50.
- Two routes, neither is a new mechanism:
  - (a) Plan ahead with the ratio field the policy already returns. If the caller knows how many panes the batch will open, the policy splits the first pane at `1/n` and the next at `1/(n-1)`..., giving equal pieces with no resize. Needs an optional `groupSize` on `PlaceRequest` (the dispatch batch knows its size; `PlaceInput` is a versioned contract so this is an optional additive field).
  - (b) Rebalance after the split when the final count is unknown: the policy returns an optional list of resize steps; the driver issues `herdr pane resize --pane P --direction left|right|up|down --amount X` and re-reads `pane layout` (its `splits[].ratio` gives the current border) until each border is within one cell of target. herdr has no equalize command; the unit of `--amount` must be measured in a scratch herdr session before relying on it, and `pane.resize` must be turned from a forbidden capability into a trait method (council E-26 would otherwise delete the capability).
- Cost: (a) about 15 lines policy + 5 lines `groupSize` plumbing from herdr-round.mjs:413 through route.rs/port.rs/contract; (b) about 60 lines driver + capability + tests. Risk: (a) low, but only covers batches with known size; (b) medium, border moves race with the user's own resizes (never rebalance panes a person has resized, detect by comparing before/after rects) and the pty-vs-rect mismatch of spec.md:110 applies. Addition the owner must pick; recommend (a) first.

### P3. Readable label scheme (extension of the existing label format)

- Problem: section 3.3.
- Change: one label builder, used for tab and pane, human part first and ids as a trailing machine suffix, keeping the existing rule that no code reads a label back (core.rs:6, contract line "labels are display only"):

```
tab   : <work-item title, 24 chars> . <n> panes
pane  : <role> . <provider/model short> . <short work id>      [fg.ssid:... a.ssid:...] only for own-pane
```
  Examples: tab `fix terminal layout . 3`, pane `worker . claude-sonnet . tsk-1lv`, own pane `tsk-1lv fix terminal layout | fg.ssid:ab12cd34`. Ids shortened to 8 chars in the visible part; full ids stay in the allocation record (`display` already stores label, role, agent, model: core.rs:221) and in herdr metadata if wanted (`pane report-metadata --title --display-agent`, an existing herdr feature, display only).
- Needed plumbing: pass the work title and role into `slotDisplay` (herdr-round.mjs:397; both are known to the round), write the pane label after `allocate` through the existing `label` op or, cheaper, as part of `pane_split`/`tab_create` (herdr.rs:425-475; label is a `tab create --label` today, `pane rename` after split), and give `rename.sh:95-98` the same builder through one shared function (the `terminal-port.sh` already centralises the port calls).
- Cost: terminal-slot.mjs about 25 lines, herdr-round.mjs 3 lines, herdr.rs about 10 lines (rename after split), rename.sh about 10 lines, one test per builder; total about 60 lines. Risk: low; labels are never read for decisions. The title truncation rule must be one function used by both shell and Node to avoid a third format (council "one door"). Part of this is RUL104-compatible (fixing the missing pane labels and unused role is "better"); the title and the visible format are a design choice for the owner.

### P4. Overflow tab label and numbering (small)

Second tab of a group gets the same label (core.rs:323-327). Add ` (2)` from the count of the group's tabs; the group is already known. About 5 lines. Pure improvement.

### P5. Remove the dead 0.3-down fallback (cleanup, optional)

`place_by_count` produces 30/21/15 percent panes (section 1.4) and is unreachable on any herdr that declares `pane layout`. Council E-26/D13 already lists related deletions; fold in or leave. Not an owner choice.

## 5. Recommendation and order

1. P0 now: it fixes a real O(N^2) spawn pattern and costs nothing visible; also frees the budget for P1/P2 which add reads.
2. P4 now: five lines, no decision.
3. P3 (the labels) next: the biggest daily readability win, low risk; ask the owner for the exact visible format (title length, whether provider shows) before building.
4. P1 plus P2(a) together as one new opt-in policy `even-split`, ship it behind `terminal.layout.policy`, keep `measured-split` as default until the owner has tried it on a real screen; this matches the owner's wide-screen preference and keeps the council decision (no screen-ratio engine, measured geometry only).
5. P2(b) only if the owner wants equal panes for batches of unknown size; it needs the herdr resize unit measured and a capability change.
6. P5 with the E-26 cleanup.

Questions for the owner (not blocking P0, P4):
- Is "three columns" wanted whenever width allows, or only when the tab is at least about 3 x minCols wide (so 240 cols counts, 200 does not)? The rule above uses minCols = 80 per column; lowering minCols to 60 would allow three columns at 180.
- Should 4 panes on a widescreen be four columns (needs >= 320 cols) or 2x2?
- Does the visible label need the provider/model, or only role and work title?
- Does this reopen the 2026-10-15 council rejection of a "layout engine by screen ratio"? The proposal does not use screen ratio, only measured width per cell, but it is a new policy.

## Bugs versus preferences

Bugs: P0 (O(N^2) herdr spawns per allocate, pty read that the policy never uses); worker panes have no label and `role` is dropped before reaching the driver; duplicate tab labels on overflow; the 0.3-down fallback is geometric and uneven (unreachable today). Preferences: 2+1 instead of three columns, second pane under the first at 160x45, label format.

Status: DONE
Summary: Report covers today's placement policy (cited), what 1-5 panes look like at 240x60, 160x45 and 110x80, the naming flow, and five proposals with a recommended order. Main findings are that 3 panes always become 2+1, worker panes never get a pane label, and geometry is measured O(N^2) times per allocate.
Concerns/Blockers: The semantics of `herdr pane resize --amount` are undocumented and were not probed (no mutation allowed); the pane shapes in section 2 are hand-derived from the code and fixtures, not observed on a live herdr.
