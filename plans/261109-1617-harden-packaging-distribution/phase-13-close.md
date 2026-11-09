---
phase: 13
title: "Close: re-run the skill checklist on the final tree, Vietnamese guide, closing report, spec and verification docs"
status: pending
depends_on: ["P01-P12 landed on main"]
parallel: "group G6, last"
effort: ~0.5d
net_size: "docs only"
---

# Phase 13 - Close

## Context

The audit was a read-only pass with a live scratch-HOME run. Closing repeats the same measures on the final tree so the before and after are comparable, then leaves the learning where the repo's rules say (AGENTS.md L5 question 6).

## Requirements

1. **Re-run the skill's Verify table** (`SKILL.md`, 12 rows) in a scratch HOME (`HOME`, every `XDG_*`, `TMPDIR` redirected, `PATH` without the real `~/.local/bin`), plus the audit's 15-step timing run. Record rule, pass or gap, evidence.
2. **Recount** the MUST fails (audit: 42 fail, 31 partial) and list each still open with its owner idea or choice (Q-A, Q-B, Q-C and the plan's Owner ideas table).
3. **Checklist.** Write the filled `templates/project-checklist.md` as `docs/platform/packaging-distribution/verification/packaging-checklist.md` (smallest owning surface; step 1 confirms against `docs/reading-map.md`) and update `verification/implementation-alignment.md` for every new claim (vision section 7).
4. **Spec.** The narrative of decision 80 (Q1, Q3, Q4/5 and the two urgent items as landed by their leads) goes into `spec.md` "Lịch sử quyết định" (`:752`), and settled facts (uninstall behaviour, pin-drift row, init closing block, exit codes, deviation CMD-08 if Q-A kept 4) into the matching spec sections.
5. **Vietnamese owner guide** (`fgos convention path --type guide --slug owner-machine-packaging-close`): how to activate the release on the owner machines and on fg-server and fg-server2; the order; what users will now see (`Ready` block, exit 1 on a not-ok init, `fgctl uninstall` and `--purge`, doctor `ok` and `next`, pin-drift warning); P01's routing check repeated; revert commands. Per owner-machine-sync memory, linked from the board row.
6. **Closing report** (`fgos convention path --type closing --slug harden-packaging-distribution`): the before and after timing table, net lines per phase against estimates (this plan adds, so say how much and what paid), the MUST recount, deviations, Owner ideas still pending, open items for T9.
7. Update the HARDEN plan: the phase 07 handoff row for Packaging-Distribution, decision 80's landed status, and the T9 note (arms `version`, `doctor`, `setup`, `uninstall` now thin). Update the board row (read the "Các luồng" and "File chung dễ va" sections first, per AGENTS.md; add one line to its log).
8. `fgos doctor` and `npm test` plus `cargo test --workspace` green on main; `fgos convention check`. View the closing report with `mdview_view_file` and tell the owner the URL.

## Files

**Create:** the checklist, the guide, the closing report.
**Modify:** `docs/platform/packaging-distribution/spec.md`, `verification/implementation-alignment.md`, `verification/install-and-release-proof.md` (if its claims moved), `plans/261021-1118-harden-low-layers-bottom-up/plan.md` (rows only), this plan's status, `CHANGELOG.md` (only if a line is missing).
**Delete:** none. **Tests to retire:** none.

## Validation

Every claim in the new docs is checked against source, tests or the scratch run; links resolved; `scripts/doc-health.mjs`.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| A phase's landing drifted from the plan | Med x Low | the closing report states each deviation |
| Owner guide steps untested on a real machine | Med x Med | run its commands on a scratch copy first; owner machine steps stay owner-gated |

## Rollback

Docs only; revert the commit.

## Closes

The sub-plan; the skill checklist statuses.
