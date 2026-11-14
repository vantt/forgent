# Lead report: account health B landing

Landing lead for HARDEN account health B (plan `plans/261113-1257-harden-account-health-run-diagnosis/plan.md`) on fg-server2, 2026-11-14. All six phases, the plan and two research reports are on `origin/main`, one landing at a time. Two CI-script fixes landed in between, because the first main commit after the v0.2.0-rc.8 release went red for reasons outside B.

## Landed ranges

| Landing | Range on main | Main CI | Main Release assets check |
|---|---|---|---|
| Plan, agent sandbox Windows survey, Windows runtime support research (+owner answers) | `7d3206e82..e5b03f378` | [43477043337](https://github.com/vantt/forgent/actions/runs/43477043337) green | [43477043127](https://github.com/vantt/forgent/actions/runs/43477043127) green |
| P01 agent protocol: 429 is a usage limit, provider signal read | `e5b03f378..81af9e0d6` | [43484309472](https://github.com/vantt/forgent/actions/runs/43484309472) red, non-B (below) | [43484309437](https://github.com/vantt/forgent/actions/runs/43484309437) red, non-B |
| Upgrade proof runs the previous fgctl with its own directory on PATH | `81af9e0d6..bc5624dd0` | [43499009110](https://github.com/vantt/forgent/actions/runs/43499009110) red (next cause) | [43499008831](https://github.com/vantt/forgent/actions/runs/43499008831) red (next cause) |
| Upgrade proof starts from a release that writes config.yaml | `bc5624dd0..433dfea6a` | [43501873736](https://github.com/vantt/forgent/actions/runs/43501873736) known reds only | [43501873597](https://github.com/vantt/forgent/actions/runs/43501873597) Windows assets only |
| P03 run result: `provider` category, no-report is infra | `433dfea6a..0799bd187` | [43509297649](https://github.com/vantt/forgent/actions/runs/43509297649) known reds only | [43509297685](https://github.com/vantt/forgent/actions/runs/43509297685) Windows assets only |
| P06 unit summary v3 | `0799bd187..661148e5e` | [43515105905](https://github.com/vantt/forgent/actions/runs/43515105905) Windows assets only | [43515105924](https://github.com/vantt/forgent/actions/runs/43515105924) Windows assets only |
| P02 receipt carries `providerSignal` | `661148e5e..77642a4cc` | [43522174684](https://github.com/vantt/forgent/actions/runs/43522174684) Windows assets only | [43522174553](https://github.com/vantt/forgent/actions/runs/43522174553) Windows assets only |
| P04 settle: signal on the failure, quarantine dated, capacity audit log | `77642a4cc..0e951a5f0` | [43529564017](https://github.com/vantt/forgent/actions/runs/43529564017) Windows assets only | [43529563908](https://github.com/vantt/forgent/actions/runs/43529563908) Windows assets only |
| P05 provider probes judge through the agent protocol; Node wording list retired | `0e951a5f0..` this push (report and board line ride with it) | see the board line after this landing | see the board line after this landing |

Every phase was replayed from its own commits only (P04 and P05 without the merge commits of P01-P03), census regenerated with `git-one-door-scan.mjs --write-census` on every census conflict (the only conflict in every pick and rebase), CHANGELOG line from the lead report under `## [Unreleased]`, plan row marked `landed`; plan `status: completed` with P05.

## Gates per phase (logs in /dev/shm)

- `git diff --stat origin/main...HEAD` equal to the phase branch's own diff plus one CHANGELOG line; the only deletions are P05's retired `provider-auth-failure.mjs` and its test, as planned.
- Rust (P01, P03, P06, P02, P05): `cargo fmt --all --check`, `cargo clippy --workspace --all-targets -- -D warnings`, `cargo check` for x86_64-pc-windows-msvc and aarch64-apple-darwin on the touched crates: green. `cargo test --workspace`: green except one test, below. `acctb-pNN-rust.log`.
- Full `npm test` (`node scripts/run-tests.mjs`): P01 8862/0, P03 8862/0, P06 8862/0, P02 8862/0, P04 8865/0, P05 8859 with 1 fail (`mailbox-live-confined` "ending a confined run leaves no process", a known load flake; 19/0 alone). No run-tests ERROR line in any run. `acctb-pNN-full-*.log`.
- After each rebase onto the newest main: the phase's focused set rerun green (P03 153, P06 176, P02 25 node + 23 cargo, P04 286, P05 282 + 1 platform skip), one-door scan 0 undeclared.
- P05 addon, door and `Cargo.lock` diff byte-identical to the branch OPC approved (`b7464fd5c`) plus the door.mjs ABI comment OPC asked for (`ee795fce4`), so no new OPC review; `cargo metadata --locked` clean.

## Reds on main that are not from B

1. **Upgrade proof from rc.8, Linux (fixed).** P01's commit was the first main commit whose Release assets check used v0.2.0-rc.8 (published 18:27Z) as the previous release. `scripts/ci-external-consumer.sh` ran rc.8's `fgctl init` without its own directory on PATH, so rc.8's doctor row `project-fgos-launcher` (state `no-fgctl`) stopped init. Reproduced on the rc.8 asset in an isolated HOME (exit 2 without, Ready with). Fixed in `762532f57`. The next stop was rc.8 writing `.fgos/config.yaml` where the proof expected the legacy `config.json`; fixed in `d7fba0a04` (the YAML case goes through rc.8's own `fgos config set/show`). Branch run [43500931731](https://github.com/vantt/forgent/actions/runs/43500931731): "Upgrade proof passed: v0.2.0-rc.8 -> candidate, config values kept".
2. **Windows assets (open, release owner).** The published rc.8 release carries its Windows assets as `fgos-v0.2.0-assets-check-x86_64-pc-windows-msvc.tar.gz` and `fgctl-v0.2.0-assets-check-...`, so every Windows upgrade proof stops on "SHA256SUMS lists no fgos-v0.2.0-rc.8-x86_64-pc-windows-msvc.tar.gz". Cause: in the rc.8 Release run 43475029626 two jobs upload `release-assets-x86_64-pc-windows-msvc` (the release's own assets job, and `suite` -> ci.yml -> addon reproducibility with the assets-check version); publish downloads `release-assets-*`, the later one wins, and its check accepts any version. The ci-last-reds lead owns the workflow fix (PR #15: version in the artifact name, publish downloads only its tag, a tag-name check with a test); my equivalent branch `origin/land/acct-b-ci` was dropped on forgent-6a's word and deleted. The rc.8 Windows assets still need a re-upload under rc.8 names.
3. **holder-lock negative control (open).** `control_without_the_gc_switch_leaks_the_lock_to_background_gc` (borrow_git.rs:170) read Free in 3 of 4 main CI runs between 81af9e0d6 and 0799bd187, then passed on 661148e5e and 77642a4cc.
4. **fgos-process `spawn_mapped` (open).** `a_detached_child_leads_its_own_session_logs_privately_and_is_not_waited_for` failed 6 of 40 local runs on main code: the detached child sees one extra inherited fd (e.g. `[0,1,2,3,12]`). Not seen on CI yet.
5. **process-containment workflow** red on main since before B (Windows `containment_conformance windows_job::spawn_plumbing`); not part of this gate.

Items 2-5 were reported to forgent-6a during the landing. B kept landing under one rule, which forgent-6a ratified afterwards: every CI and Release assets job green except the named non-B reds. forgent-6a routed items 3 and 4 to the ci-last-reds lead.

## Authority

None moved. The release artifact naming (item 2) is a release-workflow decision; the ci-last-reds lead holds it in PR #15.

## Lessons

- The first main commit after a release is published is the first to run the upgrade proof from that release; schedule it as a gate of its own (or run the Release assets check by `workflow_dispatch` on the release commit right after publish), so a phase landing does not discover it.
- A release workflow that calls ci.yml must not share artifact names with the reusable workflow it also calls; name artifacts with the version, and make publish check exact names.
- Stacking the next phase's landing branch on the current one and gating it while main CI runs (about an hour per landing) kept the critical path at CI time, not local gate time; after each landing only a rebase and the focused set were left.
- zsh does not word-split an unquoted `$F`: a focused run given `$F` with four files ran none of them and still printed a green count. Read `ℹ tests` against the expected count, or list files literally.
- Every Rust or scanned-file commit conflicts on `mutation-census.v1.json` when replayed; a small "continue the pick/rebase, regenerate the census on a census-only conflict, stop on anything else" helper made six replays mechanical.
