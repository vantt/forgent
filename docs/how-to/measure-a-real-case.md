# How-To: Measure a Real Case with Observe Metrics

This runbook guides engineers and operators through conducting a measurable, reproducible trial ("case") on a real project using `fgos metrics case` and `fgos metrics harness`.

---

## 1. Lifecycle Overview

Every case tracks the boundary of human and agent effort:
```
[ Open Case ] ---> [ Perform Work / Missions ] ---> [ Count Interventions ] ---> [ Close Case ] ---> [ Inspect Scorecard ]
```

---

## 2. Step-by-Step Procedure

### Step 1: Open a Case
Before beginning work on a feature, bugfix, or comparison run, open a case journal record:
```bash
fgos metrics case open <case-name> --harness fgos --task "Implement feature X or solve issue #123"
```
- `<case-name>`: Unique identifier (e.g., `feature-auth-eval-1`).
- `--harness`: The orchestration harness being evaluated (`fgos`, `plain`, or `cook-plan`).
- `--task`: Short description of the goal.
- `open` captures the workspace HEAD commit automatically (`headAtOpen`).

### Step 2: Work on the Task
Operate normally using standard commands and tooling:
- Run work item lifecycles (`fgos submit`, `fgos cook`, etc.).
- Coordinate multi-agent sessions or direct agent tasks.
- Keep track of manual touches and interventions.

### Step 3: Count Interventions
Track any human intervention required during the case window:
- **Questions answered:** Prompting or clarifying ambiguities (`fgos answer`, human prompts).
- **Manual reviews / gates approved:** Approving plans or gate reviews (`fgos gate-approve`).
- **Manual git resolutions:** Resolving git conflicts or fixing test breaks manually.

### Step 4: Close the Case
When the task is complete, delivered, or discarded, close the case:
```bash
fgos metrics case close <case-name> \
  --verdict usable \
  --interventions <N> \
  --items <item-id-1>,<item-id-2> \
  --note "Completed cleanly with 2 manual clarifications"
```
- `--verdict`: Verdict of the trial (`usable`, `fixed`, or `discarded`).
- `--interventions`: Integer count of manual interventions during the case window.
- `--items`: Optional comma-separated work item IDs associated with this case (used to focus section `work`).
- `--sessions`: Optional comma-separated session or unit run IDs.
- `close` captures the workspace HEAD commit at close (`headAtClose`) and calculates total duration.

### Step 5: Inspect Scorecard
Generate and review the full scorecard:
```bash
fgos metrics harness --case <case-name> --dir .
```
Or view metrics across an entire date window without a named case:
```bash
fgos metrics harness --since 2026-09-01 --dir .
```

---

## 3. Bake-Off Rules

When running side-by-side or comparative bake-offs between harnesses (e.g., `fgos` vs `cook-plan` vs `plain`):
1. **Comparable Scope & Complexity:** Both cases must address tasks of equivalent domain complexity, risk profile, and file modification footprint.
2. **One Active Case per Project:** Run only one case at a time per project to avoid contaminating transcript token counts, commit ranges, or shared sessions.
3. **Dedicated Installation & Harness Config:**
   - When evaluating `cook-plan` or other harnesses, configure them according to their official documentation.
   - Do not mix harness flags within a single case run.
4. **Transparent Interventions Reporting:** Every non-automated prompt, manual edit, or manual gate bypass must be counted in `--interventions`.

---

## 4. Scorecard Field Explanations

| Field | Meaning |
|---|---|
| `case.duration_min` | Total elapsed duration from `open` to `close` in minutes. |
| `case.interventions_manual` | Number of manual human interventions logged at close. |
| `case.verdict` | Final evaluation outcome (`usable`, `fixed`, `discarded`). |
| `runs.total` | Total number of execution runs triggered during the window. |
| `runs.overall.ok` / `exec_failed` | Breakdown of run outcomes (successes vs execution failures vs verdict failures). |
| `sessions.assignments_p50` / `p90` | Median and 90th percentile of task assignments per session. |
| `sessions.duration_sec_p50` / `p90` | Median and 90th percentile duration of unit runs / sessions in seconds. |
| `tokens.total_tokens` | Total LLM tokens consumed (input + output + cache creation + cache read). |
| `tokens.cache_read_input_tokens` | Prompt tokens serviced from prompt cache (vital for measuring cache efficiency). |
| `commits.count` | Number of git commits made between `headAtOpen` and `headAtClose`. |
| `work.add_to_delivered_hours.p50` / `p90` | Median and p90 hours from item creation (`work.add`) to delivery (`delivered`). |
| `work.doing_to_awaiting_approval_hours` | Median and p90 active development hours from `doing` to `awaiting-approval`. |
| `work.interventions_per_item.mean` / `p90` | Mean and p90 manual/automated interventions (`asked` + `answered` + `gate-approved`) per item. |
| `faults.total` / `by_class` | Count of system or CLI host-level invocation faults encountered during the case. |

---

## 5. Staging & Verifying the Host Runtime

Before measuring a real case, ensure the workspace is running the current release binary:
1. Build release binaries:
   ```bash
   cargo build --release -p fgos -p fgctl
   ```
2. Build the distribution tree to a temporary directory:
   ```bash
   node scripts/build-rust-distribution.mjs --out /tmp/fgos-release-candidate
   ```
3. Stage and upgrade via `fgctl`:
   ```bash
   ./target/release/fgctl stage --from /tmp/fgos-release-candidate
   ./target/release/fgctl upgrade --from /tmp/fgos-release-candidate
   ```
4. Verify the active release:
   ```bash
   ./target/release/fgctl status
   ./target/release/fgctl verify
   .fgos/installation/bin/fgos metrics ping
   ```
