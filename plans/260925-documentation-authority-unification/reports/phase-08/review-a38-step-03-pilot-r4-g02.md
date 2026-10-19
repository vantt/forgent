# Step 3 pilot round 4 review: g02, batch-040, docs/specs/reading-map.md

Pin `ae141550c` (reviewed worktree `c7b3564b1`). Read the batch-040 record for this file (90 edges, `diff`, `checks`, `descriptionTruth` for 33 patches, `authoringRules`) and `step-03-r4-changes.json` for this file. Read the consumer source at the pin in full (72 lines). Applied the record diff to a scratch copy with `patch`: it applies cleanly, and source lines 35, 36 and 59 are byte-unchanged. Read the target passages at the pin:
- `docs/platform/claude-plugin/spec.md` lines 50-58 and 165-182.
- `docs/platform/herdr-web-dashboard/spec.md` lines 76-84 and 237-243.
- `docs/platform/runner/spec.md` lines 188-200.
- The runner subcomponent `h-6979005beaf7/spec.md` (RUL40, RUL84, line 198).
Checked git ancestry for the 08215 dead-link claim. I did not run the checker or the probes.

## File verdict

- Path: `docs/specs/reading-map.md`. Set: batch-040.
- Verdict: **ok**. There are no new defects, and no outcome change needs correction.
- Dispositions, 90 edges (82 inventory plus 8 added): 33 patch, 30 parked (22 inventory plus 8 added), 24 preserve, 3 row-flip.
- Against round 3: 4 patches became parks (08169, 08170, 08171, 08209). That matches the 4 outcome ids in `step-03-r4-changes.json` (disposition, target and diffReplacement changed, anchor stays null).

## Round-3 defects confirmed fixed

- **maps-j-08169.** Now parked as `description-rewrite`, with no diff hunk on source line 35.
  - Evidence: the `/fgOS:check` gloss and the "12 verb wrapper" claim are false for the target. `claude-plugin/spec.md` line 55 says "`/fgOS:check [id]` is not shipped". R1 (line 168) says "wraps more than the original 12 verbs ... `/fgOS:check` has no shipped skill". Line 180 says "`/fgOS:check` is not shipped".
  - The cited line numbers (55, 168, 180) are right. The park is aligned with the system-overview plugin park.
  - The smallest blocker is real: the gloss must be rewritten from the target. Its `partial-holder` witness category fits, because the target holds the surface but not the 12-verb claim.
- **maps-j-08170.** Now parked as `description-rewrite`, with no diff hunk on line 36.
  - Evidence: the herdr spec says port "4170 by default (`gateway.port` overrides it)" at lines 79-81, and R5 (lines 239-241) says "Its port defaults to 4170". The source row says "port 8788".
  - The other row claims still match the target: "bật mặc định" matches "Static serving defaults ON", and "token bắt buộc" is consistent with the target's token rule. I saw only the start of the token rule at about line 236, not all of it.
  - The blocker is the 8788 default, and the park text states it.
- **maps-j-08171.** Parked together with 08170 on the same row, which L12-32(3) requires ("same-row edges share the disposition").
  - The doc-registry alias to `docs/knowledge/herdr-web-dashboard-layout-userflow-and-visual-language/herdr-web-dashboard-layout.md` was valid.
  - The layout gloss itself is not wrong, but retargeting one citation on a row that still carries 8788 would leave a half-true row. Accepted.
- **maps-j-08209.** Now parked as `description-rewrite`.
  - Evidence: the source says "chưa có call site (Slice 3 wiring)". `docs/platform/runner/spec.md` line 196 reads "Call site: ba chỗ trong `bin/fgos.mjs` ... `approve`, pre-check của `merge next`, và `sync-root`". The shipped-status gloss is stale, and a path-only patch would make the row false.
  - The blocker is concrete: correct the shipped-status claim, then retarget.
  - The 196 live and 277 carriage hits for the legacy path are citation or partial-holder hits for the whole runner spec, not a holder of the iron-law call-site claim. A `partial-holder` category is accurate.
- **Round-3 text-only defects** (reasons naming the superseded `#added-in-candidate-...` anchor on 08181, 08182, 08189, 08191, 08192): fixed. Each reason now names the anchor in the `anchor` field: `#business-rules`, or the retired-decisions H2 slug for 08191. The reasons are consistent with the record fields.
- **Round-2 fixes still hold.**
  - 08215: `git log --all` and `ls-tree` show no `f4-benchmark.md` anywhere, so the dead-link park and "never existed" are true. This matches the ruling 1 checker rule.
  - 08194 and the anchor precision on 08181, 08182, 08189, 08191, 08192: unchanged and still correct.

## New defects

None.

## Lead-judgment questions (none blocks the verdict)

1. **08192 description comparison (source line 43).** The `descriptionTruth` verdict is "matches" for `defaults` and `verbFileLists`. The claims in question are "`bind()` (chọn executor 5 mức)", "`fgos run` (... herdr mặc định)" and the preset list `solo/reviewed/panel` + `consult/research-fan-out/rfc/code-change`.
   - The recorded targetEvidence lines are only 32 (RUL6), 166 (RUL77) and 178 (RUL84). They do not quote those claims.
   - I found no contradiction, and the target half-supports the herdr claim (subcomponent line 198: `bind()` picks the pane invocation inside herdr and a cli one outside).
   - The "5 mức" claim lives at `docs/platform/runner/architecture/h-7af1f0242611.md:55`, and the pattern list at `architecture/h-69197b459754.md:78` and `decisions/h-36d872fbb0e5.md:1525`. None of that is under the patched `#business-rules` anchor.
   - So the record's "matches" is weakly evidenced. The row is incomplete after cutover, not false.
   - It is the same row-wide-pointer pattern I raised in round 3 (question 2) and the Lead accepted. I recommend keeping it, with the claim-holder gap noted. If you want stricter evidence, add a second hit group for h-7af1f0242611.
2. **08189 (line 41)** is the same shape, with a narrower claim set (RUL89). The subcomponent RUL89 at line 183 holds it. Accept.
3. **Unchanged round-3 items, accepted as authored under L12-32(6).** 08150 is a partial §3.3 holder. The prose locator "spec Work-State RUL10" has no path token, so it is out of scope.

## Spot-checks of other patches

I scanned the source rows of the patch edges for counts, ports, defaults and shipped-status claims against their `descriptionTruth` and evidence.
- Line 47: "7 verb" for `src/verbs/merge/`. `runner/spec.md` line 188 says "cả 7 verb cụm merge", so it holds.
- Line 58: no count claims on the row. The "34 từ khóa" claim appears at spec line 195, not in the consumer row.
- Line 38: the "cấu hình mặc định tại `.fgos/config.json`" claims match the recorded runner-spec evidence at lines 63 and 82.
- Rows 22, 25, 28-34, 46-57 and 64-71 assert only file and verb lists, and their comparisons match.

All 24 preserve targets and the 3 row-flips (08136, 08142, 08143) are unchanged from round 3.

## Parks verified (remaining 26 inventory parks and the 8 added edges)

Unchanged from round 3 (all confirmed there) apart from the four above. The categories match the blockers.
- **GAP-02:** 08138, 08154, 08177, 08180, 08203, 08204.
- **Scan-scope parity:** 08157.
- **Carriage:** 08185, 08186, 08187, 08188.
- **Workflow carry:** 08190.
- **Description rewrite:** 08145, 08152, 08176, 08193, 08194, and the 8 added `L44`/`L45` edges.
- **Dead link:** 08215.

## Denominator and numerator

- batch-040 round-4 recheck: 1 file reviewed in this report (g02), 1 ok, 0 rework. batch-040 has 11 files in A51 and 5 in the narrowed recheck; the other 4 belong to g05 and g06.
- Outcome-change edges in this file: 4 reviewed, 4 correct, 0 need correction.
- All 90 edges read for dispositions: 0 need correction. 86 text-only changes were not individually re-judged beyond the reason/anchor consistency check above.

Status: DONE_WITH_CONCERNS
Summary: `docs/specs/reading-map.md` is ok. The four outcome parks (08169, 08170, 08171, 08209) each match the target evidence, the round-3 defects are fixed, and the diff applies cleanly. The one concern is that 08192's description comparison is weakly evidenced (the "5 mức", herdr-default and preset claims sit outside the patched anchor), which the Lead should decide whether to accept.
