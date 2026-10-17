# Windows probe on the owner's machine: one race in `predecessor-all-owners-dead`

## Source
- Report: `.fgos/runtime/tmp/platform-probe/probe-report-windows.json` (runtime scratch, not committed).
- Machine: Windows 10.0.26200.9457, x86_64, NTFS temp dir, Git 2.45.2.windows.1.
- Probe binary: `fgos-platform-probe` 0.1.0 (sha256 `f5679f5f…`), from `tools/platform-probe`.
- Duration: 149 s.

## Result: 13 pass, 1 fail, 0 skip
Compared with the CI run 38857403785 (windows-latest), which had 13 pass and 1 skip (herdr not on PATH):

- **herdr is on PATH on the owner's machine**, and `herdr-on-path` passes.
- **All Job Object and LockFileEx probes pass:** released on terminate, inherited handle after parent death, kill-on-close of the whole tree, ActiveProcesses count, toolhelp ancestry.
- **The git-borrow probes pass:** blocking hook, auto-gc, predecessor check, and predecessor check where the holder owns the job.
- **`predecessor-record-stale` and `predecessor-kill-wait` pass.**
- **FAIL: `predecessor-all-owners-dead`**, with 1 violation event in 50 repeats. CI had 0 in 50.

## The failing event (repeat 1)
- The scenario kills the holder and the job keeper while git is blocked in a hook.
- **The contender could still open the named job.** This happened in 2 of 50 repeats (`domainStillOpenWhenChecked: 2`): the job was not yet destroyed.
- **The job reported `ActiveProcesses == 0`.** The contender treated the domain as empty, did not terminate it, did not use the Toolhelp fallback, and proceeded.
- **Git was still running at that decision:** pid 35464 was `running (signaled=false)` and died 2.4 ms later. The hook processes were already gone.
- Lock wait from contender start: p50 23.5 ms. Extra wait: p50 44 ms. The fallback was used in 48 of 50 repeats.

## Why
The probe's contender (`tools/platform-probe/src/predecessor.rs:69-77`) applies the **count-only** rule: `domain_active == Some(0)` means empty.

Design r6 §6.0.1 (`design-261016-1238-…-v3-r6.md:198`) already says the count is not enough. "Empty" means `ActiveProcesses == 0` **and** every member process is signaled. Members come from `JobObjectBasicProcessIdList`, re-read on every query, then the contender waits on a `SYNCHRONIZE` handle for each one.

So this run confirms the measured hazard the design cites: the count reaches 0 before the process object is signaled. The run does **not** test the full r6 rule, because the probe never implemented the member-signaled half.

## Open question this exposes
In the failing case the job was already at 0 when it was opened. It is unknown whether `JobObjectBasicProcessIdList` still lists a process that is terminating but not yet signaled.

- **If it does:** the r6 rule covers the case.
- **If it does not:** the member list is empty, while the holder's process tree (the Toolhelp chain) still holds a live git. The rule then needs a further clause: when the job opens with count 0 and an empty list, also run the Toolhelp check on the recorded holder's tree before proceeding.

## Next step (gate for the Windows driver, 4.4b)
1. Implement the full r6 empty rule in the probe:
   - read the member list on every query, including when the count is 0;
   - wait for each member to be signaled;
   - record whether the list was empty at decision;
   - as a variant, add the Toolhelp check when the list is empty.
2. Run 200 repeats on the owner's machine, not 50: the race is rare (1 in 50 here, 0 in 50 on CI).
3. The 4.4b driver stays blocked until the full rule shows 0 violations there.

Linux and macOS are unaffected. The 4.2 holder-lock work continues as planned, because Windows reports `unsupported` until 4.4b.

## Unresolved questions
- Does `JobObjectBasicProcessIdList` list a terminating, not yet signaled process?
- Is the 2-in-50 "job still openable after both owners died" a teardown delay that ends on its own, or does it depend on load?

## Run 2 (08:59, probe with the full r6 rule, 200 repeats, exe sha256 `949f8c0e…`)
Result: 14 pass, 1 fail. Raw data: `.fgos/runtime/tmp/platform-probe/probe-report-windows-v2.json`.

### `predecessor-all-owners-dead` (full r6 rule): FAIL, 1 violation in 200
The failing event is repeat 15.
- The contender opened the job: `activeProcessesAtOpen = 3`, but `memberListSizeAtOpen = 2`.
- **The git pid was not in the list**; both hook pids were.
- The contender waited for the 2 listed members and proceeded without terminating the domain.
- Git was still alive and not signaled.

### `…-list-empty-toolhelp` variant: PASS, 0 in 200
This pass proves little. The job opened only once in those 200 repeats (count 0, list empty, Toolhelp found no live descendants). The "count > list" case never occurred in the variant.

### Finding
`JobObjectBasicProcessIdList` can **omit a live, unsignaled member** while `ActiveProcesses` still counts it. So the answer to the run-1 open question is: the list is not complete. Neither the count nor the list is enough, alone or together.

### Proposed rule (r6 amendment, to verify in probe v3)
When the job opens, the set to wait on is the union of three sources, and the contender proceeds only when every member of the union is signaled:
1. the job list;
2. every process in a Toolhelp snapshot for which `IsProcessInJob(proc, job)` is true;
3. the recorded holder's process tree.

The union is re-read on every query.

When the job does not open, the existing Toolhelp fallback applies.

Probe v3 also records, per event, whether `IsProcessInJob(git, job)` is true when git is missing from the list. That shows whether source 2 alone closes the gap.

The 4.4b driver stays blocked until v3 shows 0 violations in at least 500 repeats on the owner's machine.

## Probe v3 (union rule) merged; review note for the 4.4b driver
Probe v3 (`1ba9cb76a`, exe sha256 `09f7248c…`):
- waits on the union of the job list, the `IsProcessInJob` scan and the holder tree;
- adds `predecessor-dying-job-open`;
- runs 500 repeats by default;
- drops the list-empty-toolhelp variant, because the union rule covers it.

Review note:
- In the probe, a named pid whose `OpenProcess(SYNCHRONIZE)` fails is skipped (`Dom::refresh`). That is fine for a probe, where it almost always means "already gone".
- The driver must **fail closed**: a pid still present in the snapshot but not openable keeps the domain non-empty.
