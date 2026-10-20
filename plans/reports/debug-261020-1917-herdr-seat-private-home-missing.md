# Debug: herdr seats that never start, private home reported missing

Times are Asia/Saigon (UTC+7) unless marked Z. Read-only investigation; nothing was edited except this report. Scratch experiments used throwaway dirs under the session scratchpad only.

## 1. Summary

The two failures are not one fault.

| | Case 1 (16:08, xai producer) | Case 2 (18:32, xai synthesizer) |
|---|---|---|
| Home missing at launch | Yes, but see section 3: proven only as "source vanished within milliseconds of bwrap starting" | No. Home existed, bwrap started, omp ran 32 s |
| Proven cause | Not proven. Hypothesis (a) eliminated; deletion candidates in code all eliminated or unproven | Proven: brief delivery to omp ended `delivery-unknown`, the supervisor cancelled the seat, the brief text then landed in zsh |
| Related existing report | none | `plans/reports/debug-261020-1611-pi-herdr-brief-not-submitted.md` (same class, typed path) |

The lead's description of case 2 ("pi exited at once, home no longer exists") is refuted by herdr's own log. The missing home in case 2 is the normal `finalize-home` removal that runs after every close.

## 2. Case 2 (proven): delivery-unknown, not a home fault

Run dir `.fgos/assignments/unit-run-1792495203944-8d839c6e/synthesizer/1/runs/01`.

Timeline (Z in brackets):

| Local | Event | Source |
|---|---|---|
| 18:31:29.8 | dispatch id minted `disp_1792495889832_85856325` | id is epoch ms |
| 18:31:34.76 | prepared-invocation published; marker digest non-null, so home existed | `protected/prepared-invocation/*.json` mtime, `resourceBindings[private-home].ownershipMarkerDigest` |
| 18:31:40.2 | pane 1374 spawned | `~/.config/herdr/herdr-server.log` |
| 18:31:56.5 | launcher.sh written and typed | file mtime |
| 18:32:02.27 | gate bound by supervisor | `supervisor-binding.json` `boundAt` 11:32:02.273Z |
| 18:32:07.9 | agent bound, pid 2 in the sandbox pid ns | `agent-binding.json` |
| 18:32:08.3 | herdr detects `agent=Omp` in pane 1374 | server log line `agent changed pane=1374 ... Omp` |
| 18:32:28.6 | `stop-requested.json` cause `cancel` | file |
| 18:32:39.6 | gate SIGKILL, cause cancel | `gate-exit.json` `exitedAt` 11:32:39.637Z |
| 18:32:40.2 | herdr: pane 1374 agent `Omp` -> none | server log |
| 18:32:39.99 | receipt `outcome: cancelled`, `reason: terminal:delivery-unknown` | `receipt.json` |
| 18:32:43.7 | stdout.log final write: 4099 bytes, all `quote>` lines (brief typed into zsh) | file mtime and head |

Evidence chain:

- omp was alive from 18:32:08 to 18:32:40 (herdr agent detection). The pane text shows the omp banner, then `╰─ %` (zsh partial-line marker after a killed TUI), then zsh prompts with the brief executed as shell lines (`zsh: command not found: Before`, `cd: too many arguments`).
- `stop-requested.json` is written by the supervisor itself: `packages/run-supervisor/rust/src/supervise/terminal.rs:705-712` (`end_early` calls `begin_stop("cancel", early_reason(outcome))`), and `early_reason(DeliveryUnknown)` is `terminal:delivery-unknown` (`terminal.rs:528`). The receipt carries exactly that reason. No human or orchestrator cancel is needed to explain it.
- `deliver_brief` (`packages/agent-protocol/rust/src/terminal/mod.rs:381-415`) types with `pane send-text` and presses Enter (`omp.rs`: `submit_by_prompt_door: false`, `enter_gap_ms: 300`), then `confirm_submitted` returns `DeliveryUnknown` when it cannot confirm. This is the mechanism the 16:11 report found for pi: a long raw-typed brief is taken slowly and the first Enter is swallowed. omp has the same profile.
- The brief reaches zsh because the kill (18:32:39.6) happens while `send-text` of the 7 KB brief is still being written or echoed; what remains is typed into the shell that comes back. Order is proven (omp gone at 18:32:40, shell lines after); the exact byte at which the split happened is not.

Conclusion: case 2 is brief-delivery failure on a typed-path CLI, the known class. The private home was healthy (bwrap started, omp rendered).

## 3. Case 1: what is proven

Run dir `.fgos/assignments/unit-run-1792487181128-290534a4/producer/1/runs/01`, attempt `cmd_1792487202804_9b07f782`, home `/tmp/fgos-confinement/disp_1792487203604_806fd292/home`.

Timeline:

| Local | Event | Source |
|---|---|---|
| 16:06:26.9 | provider capacity selected (xai/vantt) | `provider-capacity-selection.json` `selectedAt` |
| 16:06:42.98 | `attempt.lock` created (controller holds it) | mtime |
| 16:06:43.60 | capture dir, outbox, `gate-exit.json` created | mtimes |
| 16:06:43.64 | confinement plan written for `disp_...3604` | `~/.local/state/fgos/attestations/disp_1792487203604_806fd292.plan.json` |
| 16:08:19.98 | prepare finished: `prepared.json` and prepared-invocation published | same dir mtime; `publishedAt` 09:08:19.981Z |
| 16:08:21.60 | pane wS:p619 allocated (herdr pane 1362) | `terminal/herdr/*/allocations/cmd_..json`, server log |
| 16:08:24 | envelope and attempt-secrets written | mtimes |
| 16:08:30.08 | launcher typed (`launch-requested.json` `at` 1792487310080) | allocation dir |
| 16:08:30 | bwrap: `Can't get type of source .../home: No such file or directory` | pane read |
| 16:08:35.49 | `start-refused.json` terminal-launch-not-started (5 s after typing) | file |
| 16:08:40.4 | `finalize-home` done, `detail.homes = 1` | `steps/finalize-home.json` |

Findings:

1. Prepare took 96 s between plan and publish (16:06:43.6 to 16:08:19.98). Cause not examined; it sits inside `prepareConfinementForLaunch` (`assignment-runner.mjs:2327`), where the home is created and the login copied.
2. Hypothesis (a), launcher typed before the home exists, is eliminated. The prepared record at 16:08:19.98 holds a non-null `ownershipMarkerDigest`, i.e. the marker file existed, and `credentialProvisioned: true`. The launcher was typed 10.1 s later and the pane only existed from 16:08:21.6. Home creation is synchronous inside prepare, which returns before the terminal is allocated. No ordering race exists in the code path (`bwrap.mjs:545-558` `materialize`: `ensurePrivateDir`, marker, credential copy, all before the invocation is returned).
3. The exact error text pins the failure moment. In bubblewrap 0.6.1 a source that does not exist at argument parsing prints `Can't find source path` (reproduced). `Can't get type of source` is printed only when the source existed at parse and was gone by the mount stage. I reproduced it: with the real flag order (`--ro-bind / / --dev --proc --tmpfs /tmp --unshare-pid --as-pid-1 --die-with-parent --bind ...`) and a deleter removing the source 0 to 8 ms after start, 15 of 80 runs printed exactly `Can't get type of source <path>: No such file or directory`. With the source present, 480 runs under 16 CPU burners and 8 parallel launches all succeeded, so load alone does not produce it.
4. So the home existed at 16:08:19.98 and at the instant bwrap parsed its arguments, and was not stat-able milliseconds later.
5. Contradiction not resolved: `finalize-home` at 16:08:40.4 counted `homes: 1`. `finalizeAttemptHome` (`authority.mjs:1887-1892`) counts a home only if `fs.existsSync(target)` and then requires a valid v2 marker for this attempt and run dir, else it throws and the step cannot be `done`. A home deleted at 16:08:30 and recreated with the same marker is not something any code path does. So either the home was only invisible for a moment (rename away and back, hidden by a mount, or a lookup anomaly), or it was deleted and the finalize count has another explanation I did not find.

## 4. Hypothesis (b): deleters examined

Every code path that removes a private home was read; none can remove a live v2 attempt home.

| Candidate | Verdict | Evidence |
|---|---|---|
| `finalizeAttemptHome` (adopt, supervisor step) | Runs only after close, lock free, domain empty. Ran at 16:08:40 and 18:32:51 as designed | `authority.mjs:1887`, `steps/finalize-home.json` |
| adopt scan from another `fgos run` (`run.mjs:502`, `loop.mjs:1331`) | Cannot judge this attempt in the pre-supervisor window. The controller holds `attempt.lock`, so adopt returns `running`; before the envelope exists it returns `legacy-run` | `packages/run-supervisor/rust/src/adopt.rs:104-130`, `assignment-runner.mjs:2136` |
| `removeConfinementDir` / `cleanupConfinementResource` | Refuse any v2 marker with `attempt-home-owned-by-adopt` | `cleanup.mjs:215-217` |
| `fgos doctor --fix` reaper (`registrations.mjs:5521-5535`) | Reads v1 markers only (`readOwnershipMarker`), removes empty dispatch dirs only when empty and older than 10 min. Our dir held `home` | `registrations.mjs:5470-5500` |
| `settleHeldCredentialHomes` | Only homes with `credentialKept.attempts >= 5` | `cleanup.mjs:333-360` |
| `legacy-sweep.mjs` | Explicitly deletes nothing; a present home keeps the run | file header, `judgeLegacyHolders` |
| Old orphan reaper (removed in `056dac663`, 2026-10-18) | Still present in 40+ staged releases under `~/.local/state/fgos/releases`, but even its last versions skip v2 markers (`readAttemptOwnershipMarker` guard in `056dac663^:cleanup.mjs`). Active release `4efa6e15` has none | grep of release trees |
| Tests with a real `/tmp` root | `test/run-supervisor/support/terminal-harness.mjs:207` and `confinement-doctor-checks.test.mjs:110-114` touch the real `/tmp/fgos-confinement`, but none removes by glob. No test file deletes under that root | grep of `test/` |
| `systemd-tmpfiles` | `D /tmp 1777 root root -`: boot-time only, no age. Timer last ran 09:59 | `/usr/lib/tmpfiles.d/tmp.conf`, `systemctl list-timers` |
| Operator or agent cleanup | `find /tmp -maxdepth 1 -name 'fgos-*' ... -mmin +120` ran 09:07 local (02:07Z) and the tmp-cleanup report at 15:12; neither covers 16:08, and `/tmp/fgos-confinement/disp_*` are depth 2 | session transcripts |
| Other sessions running commands at 09:06:30Z to 09:08:45Z | Only a `git fetch` and the herdr/pi debug session's pane experiments (herdr panes, no fgos run in window) | session jsonl scan |
| Mount namespace split between controller and pane | Eliminated: herdr server, my shell and the running `fgos workflow resume` share mnt `4026531841`, /tmp is not a separate mount | `/proc/*/ns/mnt`, `mountinfo` |

Everything touching `/tmp` in the window (find with `-newermt` 16:08:10 to 16:08:40 on `/tmp` depth 2 and all fgOS state dirs) returned only this run's own files.

## 5. Smallest cause-aligned fixes

Case 2 (proven, matches the existing report): stop typing the brief through the raw-type path for omp and pi. Use the prompt door (`herdr agent prompt`) as codex already does (`submit_by_prompt_door: true`), and have `deliver_brief` stop sending once the supervisor has begun a stop so no text reaches the shell after the kill. Change is in `packages/agent-protocol/rust/src/terminal/omp.rs` and `pi.rs` profiles plus a `finished()` check in the typing loop; no new mechanism.

Case 1 (cause unproven, so no cause-aligned fix is claimed). The smallest step that turns this into a provable fault: add a preflight line in the generated `launcher.sh` that, before `exec bwrap`, tests each `--bind` source that lives under the confinement root and on failure writes a typed refusal (`start-refused` code `private-home-missing`, with `stat` output of the home, its parent and the root: inode, ctime, mode) instead of letting bwrap fail inside the pane. That replaces the opaque "launch root process not identified" with the missing fact (deleted vs invisible vs wrong inode), and it is a safe refusal rather than a launch into a home that is not there. It does not fix the cause; say so if it is adopted.

## 6. Monitoring gaps

- Nothing records the home's inode and ctime at prepare end and at launch; with those two values the contradiction in 3.5 is decidable in one failure.
- `terminal-launch-not-started` carries no hint of why; the pane's last lines (bwrap error) are not captured into `start-refused.json`.
- Prepare's 96 s stall is not logged; an unlogged stall before a launch widens every window downstream.

## 7. Unproven, to settle with the next occurrence

- Who or what made the home unavailable to bwrap at 16:08:30 while it existed at 16:08:19.98 and 16:08:40.4. Section 3.5 shows deletion alone does not fit the finalize count.
- Why prepare took 96 s (credential provisioning wait on the xai account is the first suspect; not examined).
- Whether the 10-18 13:29 to 13:32 `terminal-launch-not-started` runs share this cause. One of them left an empty `home` (mode 0775, created at 13:30:38, 69 s after finalize), which looks like a late-starting worker creating `$HOME` after the home was removed; not examined further.
- Exact byte offset at which case 2's brief split between omp and zsh.

Evidence files (relative to repo root): `.fgos/assignments/unit-run-1792487181128-290534a4/producer/1/runs/01/`, `.fgos/assignments/unit-run-1792495203944-8d839c6e/synthesizer/1/runs/01/`, `~/.local/state/fgos/attestations/disp_1792487203604_806fd292.*`, `~/.local/state/fgos/terminal/herdr/*/allocations/cmd_1792487202804_9b07f782.*`, `~/.config/herdr/herdr-server.log`.
