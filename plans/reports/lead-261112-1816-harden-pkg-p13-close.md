# HARDEN packaging P13: close

Branch `harden/pkg-p13-close`, on origin/main `e182dec72`. Docs only. Closes the sub-plan `plans/261109-1617-harden-packaging-distribution/plan.md`.

## What landed

| Requirement | Where |
|---|---|
| 1 Verify table and the 15-step timing run, final tree | closing report, "Before and after" and "Verify table" |
| 2 MUST recount: 42 fail to 14 open, 31 partial to 18, each open one with its owner idea or choice | closing report "MUST recount" |
| 3 Checklist and alignment | `docs/platform/packaging-distribution/verification/packaging-checklist.md` (new; linked from the area README), ten new rows and one superseded row in `implementation-alignment.md`, seven proof surfaces in `install-and-release-proof.md` |
| 4 Spec | `spec.md` entry-point rows, new sections 6.1 uninstall, 6.2 command surface and exit codes, 6.3 pin drift, 6.4 release defaults, and the decision-history entry for owner decision 80 |
| 5 Owner guide (Vietnamese, to "anh") | `plans/reports/guide-261112-1817-owner-machine-packaging-close.md`: order, Rust 1.99.0, claude seat login, six `thehive` cells, cook-skill lines, what users see, two rollback paths, rehearsal results |
| 6 Closing report | `plans/reports/closing-261112-1817-harden-packaging-distribution.md` |
| 7 Plans and board | sub-plan marked completed (plan and phase), HARDEN plan: decision 80 landed note, H14 closed, phase 07 handoff bullet with the T9 note; board log line |
| Big lead A, B | manual acceptance and rollback rehearsal on `e182dec72` (closing report) |
| E | known red stated; backlog `p-pvs4go2qei` (how-to doctor tables) |
| Extra backlog rows | `p-yfpixqfmdq` (release that predates `git-wal-v1`), `p-xagoeec2i4` (`fgctl` exit 2 means two things) |

No code, no CHANGELOG line (no user-visible change in this phase; every phase added its own).

## Results worth the big lead's attention

1. **The new `fgctl` refuses `v0.2.0-rc.5`** (`git-addon-missing`) through both `repair` and `init --override-pin`. The rehearsed way back is rc.5's own installer and `fgctl`, plus restoring the moved config from the `config-migrate` backups and setting aside the two migration-written `config.yaml` files; rc.5 then runs with exactly its own baseline doctor result, and going forward again works. The refusal text is in the distribution crate (not this phase's file), so it is unchanged and a backlog row asks the owner.
2. **No real agent answer was produced in the scratch.** A real pi/deepseek nano run reached the provider and got 402 (no OpenRouter credit); the omp/gemini seat does not start in a scratch HOME (layout-dependent `PI_CONFIG_DIR: ../../tmp/...`, binaries under HOME), and I did not copy login stores that renew. The guide has the post-activation `fgos run "Reply with exactly the word OK" --json` as the owner's first step on a machine with accounts.
3. **"One agent CLI is enough" is true for claude, not yet for omp:** with only `omp` installed `seat-binding-dry-bind` and `confined-pane-accounts` (for the `xai` executor) still fail, so `fgctl init` exits 2. Not filed as a row: the owner's machines have every CLI; say if you want one.
4. The no-op timing target (4.5 s) held in two runs and missed by about 1 s in the third (load); the tail is doctor plus about 0.5 s.
5. Net lines: about +5,900 (code +3,270, tests +2,630) against a plan estimate of +700 to +900; the closing report says what paid.

## Gates

`scripts/doc-health.mjs` (with `FGOS_HOST_BIN` set to the built host): see the board line for the final counts. Citation drift: the known document-identity findings only. Not run: nothing in Rust or Node changed, so no cargo gate beyond the release build that produced the acceptance assets (`cargo build --locked --release --workspace`).

## Authority

- The per-rule status of the packaging standard now lives in one file (`verification/packaging-checklist.md`); the closing report counts from it and the spec points to it.
- The rollback sequence lives in the owner guide only; the spec says nothing about it. If the owner wants a supported rollback to a pre-addon release, the owner is the distribution crate's activation gate (`p-yfpixqfmdq`).

## Lessons

- Rehearse a rollback before writing it: the brief's target (rc.5) is refused by the new tool, and the way around it needed a config restore that no document had.
- Estimates counted the code that closes a rule and not its proof (45 percent of the net lines are tests).
- A scratch HOME is two things at once: a safety boundary and a different machine. A real-agent acceptance needs a machine whose accounts exist; copying login stores that renew is not safe.
- Scratch homes that run doctor belong on ext4; a `TMPDIR` under `/dev/shm` fails the confinement probe.
- `pkill -f <pattern>` can match the shell that runs it; use a pid.

Status: DONE_WITH_CONCERNS (see items 1 to 3).
