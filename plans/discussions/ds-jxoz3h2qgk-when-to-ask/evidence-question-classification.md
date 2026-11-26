# Evidence: 163 owner questions classified against the owner's ask rule

Owned by `DISCUSSION.md` §3 row 9 (this directory). Round 2, 2026-11-26.

## Method

- Source: every `questions.asked` event in this machine's question stream (`<git-common-dir>/fgos/events/project:questions`), 163 questions from 2026-11-19 to 2026-11-26, joined with their `answered` and `cancelled` events.
- Four Haiku agents each classified about 41 questions against the rule the owner stated on 2026-11-26 at 10:15. Under that rule a direction question goes to the owner, and an actionable question becomes a search for a safe, reversible way to act. The group labels came from a fixed list. The shaper merged the four results and spot-checked the borderline cases.
- One signal does not depend on any model. Of 94 questions answered with an option, the owner picked the asker's recommended option 89 times (95%). The total wait was 193 hours, the median wait 0.7 hours, and 13 questions waited more than 4 hours.

## Result

| Verdict | Count | Share |
|---|---|---|
| no-ask (actionable, a safe path exists) | 114 | 70% |
| ask-only-if-no-safe-path (mostly a confined head lacking hands for a host step) | 28 | 17% |
| ask (direction) | 21 | 13% |

| Group | n | ask | no-ask | only if no safe path | picked recommended / answered |
|---|---|---|---|---|---|
| missing-grant-or-door | 44 | 0 | 28 | 16 | 31/32 |
| footprint-widen | 40 | 0 | 40 | 0 | 30/30 |
| git-recovery-ops | 20 | 0 | 15 | 5 | 7/8 |
| cleanup-hygiene | 18 | 0 | 14 | 4 | 7/8 |
| component-or-org-structure | 10 | 10 | 0 | 0 | 0/0 (all settled in chat, then cancelled) |
| scope-or-acceptance-change | 9 | 4 | 5 | 0 | 4/7 |
| new-rule-or-policy | 5 | 5 | 0 | 0 | 0/0 |
| priority-or-order | 4 | 1 | 3 | 0 | 3/4 |
| reconfirm-settled-decision | 4 | 0 | 4 | 0 | 3/3 |
| resource-or-cost | 3 | 0 | 3 | 0 | 3/3 |
| trust-security-boundary | 3 | 0 | 0 | 3 | 1/2 |
| product-behaviour-change | 2 | 0 | 2 | 0 | 1/1 |
| tie-needs-intent | 1 | 1 | 0 | 0 | 0/0 |

## The five times the owner overrode the recommendation

- q-lnjt5zzbfq and q-aanvfxaopa: the owner kept the remainder as named debt instead of the recommended re-cut. Both narrowed an acceptance criterion.
- q-trgzaa34ua: the owner closed on focused tests, which waived the full-gate acceptance. This also narrowed an acceptance criterion.
- q-ddj673fmju: the owner did the host steps himself. This is the hands class.
- q-nt7ptsq2nd: the owner chose a standing global worker grant over a one-run pin, which widened a standing trust boundary.

Reading: the owner added information only where acceptance was narrowed or a standing trust boundary changed. Everywhere else his answer equalled the recommendation.

## The hands class

About 45 questions are not decisions: missing-grant-or-door, git-recovery-ops and the host-only cleanups. Each came from a confined head that could not run a host step (full suites, release activation, worktree removal, config patch, `fgos git recover`) and used the owner as hands. Prior art: backlog p-g5ktat4kej and plan 261124-0004-heads-operate-without-owner (done 2026-11-25 22:08); before those, q-werrxi4i7i, which the owner redirected toward "a generic escalation door bounded by protected things" (ds-liu5g4k3gh). By day, 17 hands-like questions came on 2026-11-25 and 2 on 2026-11-26, so it is too early to say whether that plan closed the class.

## Per-group lists

### missing-grant-or-door (44)

| id | verdict | owner picked recommended | headline | safe path |
|---|---|---|---|---|
| q-f74scrmcij | no-ask | true | fgos run from a lead is refused: prompt not seen after --json | Write a unit file in the plan directory and run fgos run --unit, or park phase 1 with the reason. |
| q-y7brsup6gb | no-ask | true | fgos run still refused after the route fix; my session may predate it | Use the --unit file workaround inside the plan directory, which the lead can do without a session restart. |
| q-ixu4hnbgyd | no-ask | true | Land of live-run phase 1 refused: cargo is not on the lead session's PATH | Ask the owner-run land path (fgos land from a shell with cargo) or keep the finished branch parked until the land door can run. |
| q-jteaglm67v | no-ask | - | Pin planner heads to Claude Opus: run one config command (my session is refused config writes) | Route the already-ordered planner pin through a permitted config door or wait for the supervisor to apply it. |
| q-h7fetx3l35 | no-ask | - | Pin planner heads to Claude Opus: run one config command (my session is refused config writes) | Route the already-ordered planner pin through a permitted config door or wait for the supervisor to apply it. |
| q-o3omqvtsuc | no-ask | true | Pin planner heads to Claude Opus: run two config commands (my session is refused config writes) | Route the two config set commands through a permitted config door, or leave the planner unstarted until a grant exists. |
| q-ns4o7uqamq | no-ask | - | Who writes the .fgos/config.yaml changes of heads-stable phases 3, 4 and 9, since no unit may write .fgos/? | Apply each phase's config patch item through the supervisor's config patch grant, as the plan's config-patch-items file describes. |
| q-3f6qen2bsd | no-ask | - | Apply the phase-4 secretary Claude pin to .fgos/config.yaml so phase 4 can land green? | Ask the supervisor to apply only the phase4 block of config-patch-items.yaml, as the owner-approved door allows. |
| q-vgwalbohwj | no-ask | true | Who runs the red-tests plan's integration gate on the host, since a unit sandbox cannot? | Record sandbox reds as unverified in the integration report and queue a host full-suite run through the supervisor. |
| q-vs4eqnprod | no-ask | - | Restage and activate fgos so the land door renders {plans}? Every plan.md paths land fails today. | Temporarily remove land.gates[4] from config until the host is restaged and activated, then re-add it. |
| q-y24ukwgfpo | no-ask | true | Add core/** to land.regenerate.when so a skill-only land rebuilds the mutation census? | Add core/** to land.regenerate.when in .fgos/config.yaml, a one-line reversible config change; never hand-edit the census. |
| q-rfxqncjrax | ask-only-if-no-safe-path | false | Who runs the account probe for Miu's quota, since a confined supervisor cannot see accounts? | Report the headroom the supervisor can read and request the probe grant through a plan, instead of stepping around the confinement fence. |
| q-dcbq73d2rr | ask-only-if-no-safe-path | true | Who activates the release with commit 8883c2a62 and removes 0118's five finished worktrees, since my sandbox cannot? | None inside the confined sandbox: activation and worktree removal are outside its grant; report phase 12 as waiting on a host run. |
| q-zcileomdpa | ask-only-if-no-safe-path | - | Who runs the heads-rotate plan's full-suite gate on the host, since every sandbox here cannot? | None inside the sandbox: acceptance needs npm test green, which only a host run proves; keep phase 4 open with the gate pending. |
| q-4lmw3q6la7 | no-ask | true | Will you relay the generated governance holder-table preview to DOCOS for its yes or changes? | Save the preview file and send it through a session with a mailbox grant; keep the hand-written table until DOCOS answers. |
| q-br5rlczzav | ask-only-if-no-safe-path | - | Who runs the component-authority plan's full-suite gate on the host, since every sandbox here cannot? | None inside the sandbox: keep phase 7 open with acceptance 5 pending rather than closing it on sandbox reds. |
| q-nudu6zlusf | no-ask | true | No head may write plans/backlog.md; how should new backlog rows reach the index? | Add the one index row by hand from an unconfined session and open a backlog item to fix the write grant. |
| q-ec5bdhkwoz | no-ask | true | Who adds the backlog index row for p-2qle2tjflb (HARDEN vong tiep) while no head can write plans/backlog.md? | Wait for the phase 13 grant fix to land, then let the supervisor's next wake add the index row. |
| q-ptcieh72p6 | ask-only-if-no-safe-path | true | Supervisor needs an unconfined hand: raise maxLeads to 3 and remove 7 landed-phase worktrees | Keep maxLeads at 2 and remove only worktrees the lead confirmed landed, through the existing worktree door. |
| q-p5p5q5jlvy | ask-only-if-no-safe-path | - | Secretary rotation 0.15 -> 0.30: add the one-line edit to your hand commands, or start lead:SUPERVISOR? | Route the one-line config edit to a lead through a plan footprint and a normal reviewed land. |
| q-xs6oex5amb | no-ask | true | Phase 2a: how do the mailbox test harnesses install a workspace's agent hooks once the Node table is gone? | Add the --only row option to doctor fix as recommended, scoped to the listed harness and contract files. |
| q-vbh2knqpnu | ask-only-if-no-safe-path | true | Heads-stable phase 11 needs three host steps: activate main, run the full suite, remove two worktrees | No confined route activates a release or runs the full suite; the work waits for an unconfined session. |
| q-q6peavqy7b | no-ask | true | Two host-only writes need a hand: heads-stable CHANGELOG lines and one backlog index line | Land the six CHANGELOG lines and the index row through a lead's footprint-widened plan step, not a direct host edit. |
| q-pcwf3slkfp | ask-only-if-no-safe-path | true | Head-stop rotation phase 1 needs one unconfined npm test and cargo test --workspace run | Hold phase 1 at verifying; a confined run is not valid proof, so only an unconfined run closes it. |
| q-2vehh564d2 | no-ask | true | Phase 11: who lands the six CHANGELOG lines, since no lead:SUPERVISOR is live and heads cannot write CHANGELOG.md? | Land the six CHANGELOG lines through a footprint-widened plan step as the plan's changelog step allows. |
| q-5v6jpbmbcy | ask-only-if-no-safe-path | true | Who runs the full npm test and cargo test on main once phase 8 of component-authority-doors lands? | Keep both plans parked at the gate until an unconfined run exists; confined results are not proof. |
| q-j4yeougr72 | ask-only-if-no-safe-path | true | Who builds, stages and activates a release carrying crate 888bb3563 so phase 10b and then phase 12 can run? | Keep phases 10b and 12 parked; the release build needs an unconfined session, so no in-sandbox route exists. |
| q-ozu6l2ioxa | ask-only-if-no-safe-path | - | Run one config command for the secretary rotation change? My confined session cannot write config. | Set the already-decided rotation key through an unconfined config door or a footprint-widened plan. |
| q-twjsu3cywc | ask-only-if-no-safe-path | - | Stage and activate a release with 764dbb6a1, and run one authority render? My confined session cannot. | Keep phase 12d2 parked; staging the release and running the render need an unconfined session. |
| q-vdefxq4upy | ask-only-if-no-safe-path | true | Run the full test gate and one release check for authority declare --update? My confined session cannot. | No confined route runs the full gate; close on focused proofs, or wait for an unconfined run. |
| q-qzcq5xti2k | no-ask | - | Phase 2 workers cannot run cargo: grant Bash(cargo/node) to claude units in project config, or run it unconfined? | Pin the already-confined standard invocation per unit through the request override, which needs no config change. |
| q-owq4jhwng7 | no-ask | true | Your cargo/node answer cannot go in project config (args are global-only): which route instead? | Rerun the unit pinned to the existing claude-herdr-bypass-bwrap invocation, which is already fully confined. |
| q-aucsjasc25 | ask-only-if-no-safe-path | true | Apply the global claude worker patch you chose in q-nt7ptsq2nd, then answer Applied | Hold phase 2 parked; confined heads cannot write the global config the patch needs. |
| q-nii67wdhv3 | ask-only-if-no-safe-path | true | Claude worker grant: who stages the release from main (>= 29dd50475) and runs the full suites? | Hold phase 2 parked; staging a release and running full suites need an unconfined session. |
| q-vfansuhg7y | no-ask | true | Who runs the owed full-suite witness-vs-walk check of the leak-check plan | Keep the subset walk as weak proof and file the owed full-suite check as a backlog row until an unconfined runner exists. |
| q-dhhezn67em | no-ask | true | Which checks should forgent's release recipe in .fgos/config.yaml run before fgctl upgrade? | Write the DoD suite as the release checks via fgos config patch from the main checkout. |
| q-dzh2ojhcvc | no-ask | true | Relay the owed full-suite leak check to lead:SUPERVISOR; it is not reachable from heads | File a backlog row for the owed check and the mailbox gap, as the second option allows. |
| q-kghmwfmrtm | no-ask | true | Run the event-store io-errors full gate in an unconfined session | Keep the phase parked and file the gate as a backlog row until an unconfined run exists. |
| q-l3rskjibl3 | no-ask | true | Build and activate a release with e36f10cf, and run the full suites unconfined, to finish heads plan phase 7 | Close phase 7 on the recorded probe with the gaps marked fixed but unproven live, and file the re-probe as a backlog row. |
| q-rpx35ztfph | no-ask | true | Run the full gate for plan 261125-1558 outside confinement; phases 1-4 code and docs are landed | Mark phase 4 done on the land-gate proof and record the full suite as owed weak proof. |
| q-irosdru6sy | no-ask | true | Release run failed npm test; who runs the unconfined suite to name the failures for heads-operate phase 7? | Park phase 7 and file the failing-test names as a backlog row until an unconfined run exists. |
| q-zgij6efo5g | no-ask | true | Who runs the unconfined npm test + cargo test on main 46683e20e for delete-dead-node phase 10? | File the suite run as a backlog row and park phase 10 until an unconfined runner exists. |
| q-okdzvolti3 | ask-only-if-no-safe-path | - | ACE phase 2 (pkm probe) cannot build pkm inside a unit sandbox; who runs the probe? | Pre-vendor pkm into an untracked dir in the p02 worktree, or run the probe once from an unconfined session; do not widen sandbox reads without a decision. |
| q-cmio6uyrqz | no-ask | true | Release checks fail (npm test exit 228 in 15s); who runs the full suite to find why? | Route the npm test run to lead:SUPERVISOR as a help request and retry the release after the result. |

### footprint-widen (40)

| id | verdict | owner picked recommended | headline | safe path |
|---|---|---|---|---|
| q-y3ypxlucin | no-ask | true | Phase 4 cần sửa head_request.rs (ngoài footprint) để session write tạo được file item mới: mở footprint? | Widen the plan footprint by head_request.rs and its test only, as the recommended option describes. |
| q-b3acdzi4ur | no-ask | true | Phase 4: a 'plans/backlog/*' grant makes secretary and supervisor heads fail to launch | Add session-attempt.mjs and its test to the footprint and change only requirementOf path mapping. |
| q-ekkgwaavrb | no-ask | true | Phase 5 (chuyển backlog/discussions sang plans/) cần sửa ~245 file ngoài footprint: mở footprint? | Widen the phase 5 footprint to the listed reference files and build:skills output in one reversible migration commit. |
| q-wb6bdz3c72 | no-ask | true | Phase 7: ~70 plan cũ có status ngoài plan-v1 nằm ngoài footprint; mở footprint tới dòng status của mọi plan.md? | Add plan.md status and contract lines to the footprint and change only those lines per the approved mapping. |
| q-76qpywi7if | no-ask | true | Phase 6: file land.rs mà phase ghi không tồn tại; cho sửa land thật trong packages/supervision? | Move the footprint to the real land door as layering law L10 requires, not a new file beside it. |
| q-exu5x27hbq | no-ask | true | Phase 5: add 5 wiring files to the plan footprint so `fgos migrate portfolio` is reachable? | Add exactly the five listed paths to the phase 5 footprint and make one route row or dependency line change each. |
| q-psvhjlmjxl | no-ask | true | Phase 5: add the host operation catalog to the footprint so `fgos migrate portfolio` is admitted? | Add catalog.rs to the footprint and add one descriptor and its catalog test id. |
| q-4qtu54bnxz | no-ask | true | Widen the red-tests plan footprint by one config fixture so phase 4 can turn green? | Add the one fixture file to the footprint and append only the secretary entry to standard-only. |
| q-pn6ur6wrjf | no-ask | true | Widen the heads-stable footprint so phase 5 can move the activation read down one layer? | Add the six listed paths to the footprint and move the pure read to the lowest shared layer as design principle 2 requires. |
| q-obm5mrukjc | no-ask | true | Widen the heads-stable footprint by three files so phase 6 can register its doctor row and surface hook failures? | Add only the three named paths to the plan footprint and land the count, inventory and hook fix as one reviewed change. |
| q-eyb5i7m7wq | no-ask | true | Land the footprint widen for the owner-approved config patch --project-only flag (seven paths)? | Add exactly the seven named paths to the plan footprint in one paths land. |
| q-2ul3tjw3kd | no-ask | - | Widen the heads-stable footprint by observe-kinds.json so the secretary can record question relays? | Add observe-kinds.json to the footprint and declare only the one record kind phase 8 needs. |
| q-lnq3nbjssw | no-ask | - | Widen the heads-stable footprint by src/cli/command-registry.mjs so config patch --project-only can be declared? | Add command-registry.mjs to the footprint, declare only the project-only flag, and regenerate the manifest through the exporter. |
| q-zwvjlsuqgc | no-ask | - | Widen the heads-stable footprint by attempt_step.rs so a live head's requests can run the active release? | Add attempt_step.rs for a head-request-only handover, leaving attempt-step pinning and its checks untouched. |
| q-r5w6funyv5 | no-ask | - | Widen heads-stable by the git one-door declarations file so phase 5's route host can be declared? | Add the declarations file to the footprint with one configured-binary entry carrying reason and retireWhen, as the identity.rs precedent. |
| q-qki26cwunf | no-ask | - | Widen heads-stable by apps/fgos/src/wiring/supervision.rs so the land door can remove a landed worktree? | Add supervision.rs and wire a removal port to the existing fgos_checkout::remove, copying no checks. |
| q-d5mrno2mfk | no-ask | - | Widen heads-stable by apps/fgos/src/wiring/session_write_publish.rs so the landed-worktree removal compiles? | Add session_write_publish.rs to the footprint and add worktree_removal: None at the two literals only. |
| q-3g32txifg5 | no-ask | - | Widen heads-stable by the credential renewal and probe-account files so phase 12b can fix the login expiry? | Add the four named paths to the footprint, bounded to the renewal decision, its record and its display. |
| q-swxkda2x5r | no-ask | true | Component-authority-doors phases 2-3 need callers outside the plan footprint: re-cut per row, widen, or cut scope? | Planner re-cuts phases 2-4 per door row, widening the footprint to each row's callers, with acceptance unchanged. |
| q-6rdolvgvz2 | no-ask | - | Add apps/fgos/src/main.rs to the component-authority-doors footprint so the new authority verb can be registered? | Add main.rs to the footprint for phases 1 and 5 and register the two lines only. |
| q-sieckdvccb | no-ask | true | Add apps/fgos/src/main.rs and test/cli/subcommand-flag-drift.test.mjs to the authority-doors footprint for the new verb? | Add the two files to the phase 1 and 5 footprint, changed only for verb registration and its drift list. |
| q-klz3vkxjee | no-ask | true | Add packages/host-runtime/rust/src/catalog.rs to the authority-doors footprint so locate passes caller admission? | Add catalog.rs to the footprint for phases 1 and 5, changing only the authority operation rows and the count. |
| q-75yeaifwzn | no-ask | true | Add test/rust-host/vectors/envelope/version.json to the authority-doors footprint to regenerate its verb list? | Add the vector file to the footprint and regenerate it with generate-vectors.mjs only; no hand edit. |
| q-bioobcr52m | no-ask | true | Phase 2a: widen it by six files that still use the Node hook table, so the table can be deleted? | Widen phase 2a by the six listed paths in the plan file, since the owner already decided the Node table is deleted. |
| q-jol5tcok22 | no-ask | true | Keep the three invocation-root copies as named debt, or widen phase 4 by their callers? | Record the three copies as named debt with retiredBy, as the row's own reasons require, and close phase 4 when the join half lands. |
| q-nog2h4wfjm | no-ask | true | Heads-operate phase 2: widen the footprint by three session-attempt files, and let its unit run cargo? | Planner adds the three listed files to phase 2's footprint and the lead reruns phase 2 in the same worktree. |
| q-ulx4nkztpq | no-ask | true | Phase 2 needs three files outside the plan footprint and leaves 4 door-row allowance lines; how to close them? | Mark phase 2 done with step 9 recorded as partly met and open one backlog item for the leftovers. |
| q-ms5ifcqex6 | no-ask | true | Widen the dead-Node-deletion plan footprint by 7 files that cite deleted tests or need the dead code? | Add the seven listed paths to the plan footprint; edits are limited to repointing deleted-test mentions and retiring the recorder. |
| q-zw4htizjz2 | no-ask | true | Stop the plan check counting the regenerated Git census as a footprint clash, so the land-gate fix can go ready? | Land the census exemption as its own small change first, then set this plan to ready. |
| q-4aalqblcof | no-ask | true | Widen the run-tests leak plan footprint by three test files that call runTests with a fake spawn? | Add the three named test files to the footprint and fix their fake spawns with the existing witness wrapper, keeping fail-closed. |
| q-pegjald5eu | no-ask | true | Widen plan 2108's footprint by one test file so the dead adapters.mjs can be deleted | Widen by the one test file and drop only its adapters.mjs case in the phase 8 fix unit. |
| q-5roz2uy3sa | no-ask | true | Phase 8 land fails doc-health: 38 docs link to the deleted files, 17 of them outside the footprint | Make link-only edits in the listed docs and leave all prose unchanged. |
| q-xcuwpxa4kn | no-ask | true | Widen heads plan footprint by 5 stale test and record files so phase 7 can fix 7 cargo failures | Add the five named paths to the footprint and run one fix unit on them. |
| q-if5yugbigg | no-ask | - | Phase 7: swap the wrong config fixture for repo-differences.v1.json so the last cargo failure can be fixed | Swap in repo-differences.v1.json in the footprint and add one array entry. |
| q-vqyxe5oi6j | no-ask | true | Add apps/fgos/src/routing.rs to plan 261125-2313's footprint so a confined head's mailbox inbox goes through the socket? | Add routing.rs to the footprint and change only the mailbox window arm and its test. |
| q-vkcf6eyeak | no-ask | - | Widen phase 3's footprint by bin/fgos.mjs and packages/supervision/rust/observe-kinds.json? | Widen by the two files as the later question q-myvzcbz3sx did. |
| q-myvzcbz3sx | no-ask | true | Widen phase 3's footprint by bin/fgos.mjs and packages/supervision/rust/observe-kinds.json? | Add the two files to the phase 3 footprint and run one unit for the --role flag. |
| q-qzchcwl7ya | no-ask | true | Widen phase 3's footprint by src/cli/command-registry.mjs (session stop entry only)? | Add command-registry.mjs to the footprint and edit only the session stop entry. |
| q-embi4w5hfi | no-ask | true | Add mailbox store tests/nudge.rs to plan 261125-2313's footprint so phase 5 can add agy to the nudge proof? | Add nudge.rs to the footprint and extend only the nudge-capability assertion with agy. |
| q-ep6wknrzop | no-ask | true | Widen phase 3's footprint by the generated command-manifest.json? | Add the manifest to the footprint and regenerate it with the export script, with no hand edit. |

### git-recovery-ops (20)

| id | verdict | owner picked recommended | headline | safe path |
|---|---|---|---|---|
| q-bo3abbpcm6 | no-ask | true | Run fgos git recover to clear interrupted pre-attempt land chain on main | Back up the journal directory, then run the standard fgos git recover door in the main checkout and verify main. |
| q-tj4cw2epbq | no-ask | true | Phase 5 data move: pause backlog and discussion writers for ~15 minutes so the move lands on the trunk tip? | Re-run the migration on the trunk tip with retry on land refusal, and restart heads after the land. |
| q-wpzbpqnq24 | no-ask | - | Run `fgos git recover`: the portfolio move is pushed (349060733) but the main checkout was not advanced | Use the standard fgos git recover door after backing up the journal, not a manual push or revert. |
| q-wjecldhcmr | no-ask | - | Main checkout diverged from origin; work-data-model lands are blocked until git recover runs | Run the standard fgos git recover in the main checkout, keeping the local commit, rather than dropping it. |
| q-gelkp64lo4 | no-ask | - | Unstage the stale board log in the main checkout so paths lands work again? | Unstage only that one index entry; the worktree file already equals HEAD, so nothing is lost. |
| q-rbleatcask | no-ask | - | Run fgos git recover? Every land is refused resource-recovery-required since a land died at 04:32Z. | Run the land door's own recovery, which settles only the interrupted land's merge resource, then retry the land. |
| q-ctjxjol33f | no-ask | - | Run fgos git recover in the main checkout so heads-stable phase 12a can land? | Wait for the next wake and let the recover door settle only what it judges safe; never hand-edit git state. |
| q-pfecbg6ffn | no-ask | - | Run fgos git recover in the main checkout so heads-stable phase 11's probe script can land? | Wait for the stuck land to clear or use the recover door from its owning session; never hand-edit main. |
| q-3hu7p6iy6p | no-ask | - | Run fgos git recover: a stuck land since 09:14 blocks every land on main (resource-recovery-required) | Wait for the stuck writer's chain to settle or retry the land; the merge slot recovered on its own. |
| q-7x7b33ekew | no-ask | false | Settle the pending Land blocking every land to main (resource-recovery-required) | Ask the supervisor, which holds the recover door, to settle only the owning writer's chain; never clear it by hand. |
| q-7t27x2qfk2 | ask-only-if-no-safe-path | true | Please run `fgos git recover` in an unconfined shell; every land in forgent is blocked until it runs | None from a confined head: recover needs .fgos/locks, which is read-only here; hold the plan blocked and report. |
| q-hlbqhlyrct | ask-only-if-no-safe-path | true | Main needs fgos git recover, and the secretary rotation 0.15 -> 0.30 edit: will you run both? | Run fgos git recover from an unconfined session; no confined route can take the merge-slot lock. |
| q-e62q73d2au | ask-only-if-no-safe-path | true | Run fgos git recover on main so the doors lead can land the doctor --only fix? | Leave the pending land journal untouched; a confined retry is refused until the owner runs recover. |
| q-kvlgsoyjje | ask-only-if-no-safe-path | - | Main checkout HEAD moved to de446a21f but its index and files stayed at f5514fd6c; run one read-tree to finish it? | Leave the main checkout as is and let the owner run the read-tree; confined .git writes are refused. |
| q-erkpiafbij | ask-only-if-no-safe-path | - | Push main 1a931d98c to origin and send the retry already typed in the doors lead pane? | Keep the local commit unpublished and let the owner push; a confined session cannot push. |
| q-3svd4ttdn7 | no-ask | true | Commit phase 2's finished but uncommitted work in the p02 worktree by hand, or let the lead redo it? | Lead reruns the unit fresh in a new worktree from main; the old worktree stays as reference. |
| q-hwtikojjei | no-ask | true | Commit phase 2's deny-rule fix by hand again, after rewording one doc line the commit check refuses? | Lead redoes the fix fresh in a new worktree with the reworded spec line, as the other option allows. |
| q-pc6qapoegx | no-ask | - | Clear an abandoned Land of a dead writer so plan 2108 phase 6 can land | Run fgos git status and fgos git recover in the main checkout, the documented non-destructive door. |
| q-5tmdgbgopd | no-ask | - | Two leads lost their request socket and cannot be stopped; both wait on an abandoned land | Park both phase 6 entries with the stated reason, which is reversible and admits nothing overlapping. |
| q-bvvdct5edg | no-ask | - | Run fgos git recover in the main checkout so phase 5 of plan 261125-2313 can land? | Run fgos git recover in the main checkout, the documented non-destructive door, then retry the land. |

### cleanup-hygiene (18)

| id | verdict | owner picked recommended | headline | safe path |
|---|---|---|---|---|
| q-w33h3vozt7 | no-ask | true | Plan headName collision between cores and doors plans prevents lead start | Rename the doors plan directory and update blockedBy in one reversible git mv commit. |
| q-x3ata7iuej | no-ask | true | Decide plan-v1 mapped statuses for legacy plans marked partial and deferred | Apply the recommended status mapping (partial to draft, deferred to withdrawn) to the two legacy plan status fields only. |
| q-tjzfq5em4h | no-ask | true | Two leads run the Windows custody plan: stop this restarted one, or the other? | Stop acting in the restarted lead, send the review report to the remaining lead, and let the supervisor stop the duplicate. |
| q-2dwvrkgabm | no-ask | true | Phase 6 cannot land: main checkout holds an uncommitted orchestration-skeleton DISCUSSION.md edit | Wait for the owning shaper's next land, or ask the supervisor to request it, and retry the land then. |
| q-uvr4yu4x3c | no-ask | - | Main's land gate is red on 48 citation findings from bddb4fe0d; who fixes them so code lands can pass? | Add the missing glosses in a docs-only commit that clears the 48 findings, then retry the land without weakening the gate. |
| q-t5anmlcb7q | ask-only-if-no-safe-path | true | Remove the two kept component-authority-doors worktrees (-p5c, -p8) whose work is already on main? | Leave the two worktrees in place and list them for a cleanup sweep; no confined destructive removal. |
| q-ddj673fmju | no-ask | false | heads-stable đã done theo lệnh anh; ai làm 3 việc nó để lại (1 test đỏ, 6 dòng CHANGELOG, probe của Miu)? | Open one backlog row and a small plan through the lead door for the test line, CHANGELOG lines and probe. |
| q-v7o5temdml | ask-only-if-no-safe-path | - | Remove the superseded p12b worktree? My confined session has no remove verb. | Leave the superseded worktree in place for a later cleanup sweep; it holds disk only. |
| q-73vfpynmhd | ask-only-if-no-safe-path | - | Remove the stale worktree authority-declare-update-p03? My confined session cannot. | Leave the clean stale worktree for a later prune; nothing in the plan waits on it. |
| q-2dncwfeoy4 | ask-only-if-no-safe-path | true | Remove two stale authority-declare-update worktrees (p03, p03-rerun)? My confined session cannot. | Leave both stale worktrees for a later prune; no plan waits on them. |
| q-jhzastcweb | no-ask | - | Every paths land is refused land-backlog-index-failed: who repairs the bad backlog and discussion files? | The secretary makes the listed mechanical fixes (Notes sections, frontmatter, source and citation) and lands them in one paths land. |
| q-3rhc6lroqc | no-ask | true | Paths lands refused land-backlog-index-failed, which also blocks heads-operate p01: who repairs the files? | The secretary's next wake makes the listed mechanical fixes and lands them with one paths land. |
| q-2ghcivkv34 | no-ask | - | Remove four superseded 2108 worktrees that confined heads cannot remove | Remove the four superseded worktrees through the delivered-to-main door, which refuses undelivered work. |
| q-42ihbng27e | no-ask | - | Remove three 1945 worktrees that confined heads cannot remove | Remove the clean merged worktrees through the delivered-to-main door and leave the dirty one until verified. |
| q-eyzkt2ttrg | no-ask | - | End the 2108 lead's pane; its request socket is gone and a stop cannot reach it | Leave the idle pane for the supervisor's next wake, which starts a fresh lead once leadLive is false. |
| q-pkvxdfpg3n | no-ask | - | Delete the leftover branches of done plan 261122-2108 (14 merged, 7 with commits not on main)? | Run git branch -d on the 14 merged branches only, and report the 7 unmerged ones. |
| q-ubi34e6xd3 | no-ask | - | Stop the duplicate ACE phase-1 run (gemini, ticket c-1456) and remove its worktree? | Stop only that run's pid after confirming it is the duplicate, then remove the worktree without force. |
| q-pmhxzsfpr7 | no-ask | - | Disk is full (3.4G free): discard the lead's two superseded worktrees p02 and p03 (about 21G)? | Verify each worktree tip is on its superseding branch, clear stale git-candidates dirs first if no land runs, then discard p02 and p03. |

### component-or-org-structure (10)

| id | verdict | owner picked recommended | headline | safe path |
|---|---|---|---|---|
| q-ruxzcol6db | ask | - | Sổ authority duy nhất: lấy architecture-manifest.json làm nền, các sổ khác sinh ra từ nó hay bị xóa? |  |
| q-je5lfplvuh | ask | - | Ai quản lý sổ authority: một thành phần architecture có spec và chủ, hay giao Convention, hay giữ như hiện nay? |  |
| q-7wd766tu4p | ask | - | Nền và chủ sổ authority: thành phần mới component-authority (locate + declare), architecture, hay documentation? |  |
| q-pdce2aqupm | ask | - | Tầng kiến trúc (layers, tiers, map file -> tầng) gộp vào component-authority hay để architecture giữ riêng? |  |
| q-6yhs63ru4i | ask | - | View sẵn cho coach: mở rộng định nghĩa truy vấn có sẵn của observe trước, hay dựng ngay SQLite + SQL view như pkm? |  |
| q-kml4ipaweg | ask | - | Dựng cho coach một lớp SQL view ổn định như pkm (v_friction, v_run...) để coach tự viết SQL chẩn đoán? |  |
| q-werrxi4i7i | ask | - | Privileged chores for confined heads: one policy door with rules as data, instead of one verb per chore? |  |
| q-ng4ojyph5r | ask | - | Which door is the one guaranteed head-to-head channel: the mailbox, fixed inside the cage? |  |
| q-hcnhbtf74z | ask | - | Who walks the channel ladder: each head by itself, or one send door that tries the channels in order? |  |
| q-ee2f2g3aoj | ask | - | Who may call the new plan-widen door: the supervisor only, or also the plan's own lead with an answered owner question? |  |

### scope-or-acceptance-change (9)

| id | verdict | owner picked recommended | headline | safe path |
|---|---|---|---|---|
| q-fvulgjz2iz | no-ask | true | Phase 3: test mới trùng các proof đã có; đóng phase bằng trích dẫn proof hiện có thay vì thêm file? | Drop the duplicate test branch and cite the four existing proofs by running those tests, recording the change in plan.md. |
| q-hui44iwzw4 | no-ask | true | Criterion 7: count `plan-contract-check --all` as met once every status is plan-v1, though other plans still fail it? | Record the remaining --all errors in the plan and open one backlog row for their owners, then mark criterion 7 met on the status vocabulary. |
| q-excujq527g | ask | - | Should the agent-start seam also cover the AgentKit, GitNexus and MDView text in AGENTS.md, or only fgOS's own? |  |
| q-msslhlmfkt | no-ask | - | Which row is the 'owner-approved rotation reliability work' for heads-stable, and should it join this plan as phase 12? | Fold the closest open row in as phase 12 with its phase file and footprint, since the owner already approved that work; name another row only if it differs. |
| q-tvhmli3fns | no-ask | true | Backlog reconciliation is red for 278 reasons, not one: what should the folded original-id phase make true? | Count Original ids through one reader in both scripts, keep the line-scan, and file the 277 unreconciled items as a backlog row. |
| q-trgzaa34ua | ask | false | Close authority-declare-update: who runs the full gates and the release check outside the cage? |  |
| q-lnjt5zzbfq | ask | false | Phase 6: give the checkout crate the two entries its copies need, or keep those copies as named debt? |  |
| q-aanvfxaopa | ask | false | Phase 8: allow own-child liveness polls and keep three missing-survivor copies as named debt, or build the survivors? |  |
| q-uxrx52jm2q | no-ask | true | Heads-operate phase 7 asks for planner and shaper probes, but no planner or shaper head is live | Record the two unprobed personas as a deferred row and re-probe when those heads start. |

### new-rule-or-policy (5)

| id | verdict | owner picked recommended | headline | safe path |
|---|---|---|---|---|
| q-djyjckiygr | ask | - | Twin Node khi port sang Rust: cho tồn tại có hạn máy kiểm, hay cấm hẳn (cắt chuyển một lần)? |  |
| q-von37r6ef6 | ask | - | How should a moot owner question leave your queue when its asker is gone? |  |
| q-xkrbp66xy6 | ask | - | Should `fgos questions ask` require a stated default and a question headline? |  |
| q-nfgvjge6zg | ask | - | Should a check at the end of each agent turn catch permission-asking and unexplained ids? |  |
| q-otq7dwgory | ask | - | Is a plan's file footprint part of the approved frame, so widening it needs your answer? |  |

### priority-or-order (4)

| id | verdict | owner picked recommended | headline | safe path |
|---|---|---|---|---|
| q-kjat6xjwfv | ask | false | Khởi chạy Architecture Advisory Panel (fgos-architecture-panel) cho orchestration-skeleton? |  |
| q-yoxcjqa46z | no-ask | true | Run orchestration-skeleton after 0118, 1950 and component-authority land, since its core files overlap all three? | Keep the planner's blockedBy as written so the skeleton waits for the three lands; reversible by editing blockedBy. |
| q-7wfzidusod | no-ask | true | orchestration-skeleton and owner-communication-standard each wait for the other: which runs first? | Start the skeleton after heads-stable and remove the cycle by editing the owner-communication blockedBy; record it in both plan files. |
| q-anofq5k6pf | no-ask | true | Release sequence: does each step end when the plan is done on main, or only after an fgOS release ships it? | Write 'a step ends at plan done on main' into the discussion acceptance criteria, as its scope allows. |

### reconfirm-settled-decision (4)

| id | verdict | owner picked recommended | headline | safe path |
|---|---|---|---|---|
| q-rzyim2hm3b | no-ask | true | Code bugfix guide đã land lên main dù plan đã bị đưa về draft (chờ owner duyệt) — giữ hay revert? | Revert the three code files to a branch, keep the plan in draft, and land again when the owner approves. |
| q-e2bpqz65c2 | no-ask | - | Chốt hẳn OS-D12 (mỗi bước mở một bản ghi lập lịch) và OS-D19 (handoff = đóng phiếu này, mở phiếu kia)? | Lock OS-D12 and OS-D19 as the discussion's tentative decisions, as the owner had already agreed in round 24. |
| q-n2o2nbs2or | no-ask | true | Should a sleeping lead's record name its worktree, or should the fresh lead find it from the plan and git? | Derive the worktree from plan and git; the backlog row already forbids a second tracking store. |
| q-s4oy6tinfr | no-ask | true | Approve declaring the new component `portfolio` in the authority model | Record the chat agreement in the question store and run the declare with that approval. |

### resource-or-cost (3)

| id | verdict | owner picked recommended | headline | safe path |
|---|---|---|---|---|
| q-luhbwwvlpc | no-ask | true | Ổ đĩa gốc đầy (còn 22 MB): cho dọn worktree đã giao và land candidate cũ để land tiếp? | Remove only worktrees that fgos worktree remove --delivered-to main proves merged, keep unmerged p05r and p05h, and release candidates with fgos git recover. |
| q-eoxlvo7i4r | no-ask | true | Lead slots: count a lead waiting outside as free, or raise the lane count from measured capacity? | Adopt the waiting-lead rule in phase 4 and state it in the supervision spec; defer the capacity-based lane count. |
| q-wwsaazcrbz | no-ask | true | Cap of two full test suites at once: lower maxLeads to 2, or add a suite lane? | Record maxLeads=2 in the discussion and let the planner write the config change. |

### trust-security-boundary (3)

| id | verdict | owner picked recommended | headline | safe path |
|---|---|---|---|---|
| q-va5vu7zeza | ask-only-if-no-safe-path | - | How should a confined supervisor's `config patch` be held to the project config file only? | Drop the config patch verb from the supervisor socket grant until the host refuses non-project destinations, failing closed. |
| q-nt7ptsq2nd | ask-only-if-no-safe-path | false | Phase 2 rerun: the request window drops --override, so the lead cannot pin claude-herdr-bypass-bwrap | Use the pinned confined invocation for the one rerun, with no standing change to global worker grants. |
| q-4xd2a3eqxq | ask-only-if-no-safe-path | true | Inside a linked worktree, should installed fgos run the owning project's release, or refuse and name the door? | Ship the refuse-and-name-the-door message for linked worktrees first, the reversible default, and defer the release lookup. |

### product-behaviour-change (2)

| id | verdict | owner picked recommended | headline | safe path |
|---|---|---|---|---|
| q-3iylevstr2 | no-ask | true | In projects without an authority model, should the skills skip fgos authority locate the way they skip impact analysis? | Gate locate on a present model and record authority inactive when absent, the same as the impact-analysis gate. |
| q-jwnker2n4y | no-ask | - | When a sleeping lead wakes, does it resume its old CLI session (full transcript) or start fresh with the handoff? | Resume only below the soft threshold on the same CLI, otherwise write a handoff, as the shaper recommended. |

### tie-needs-intent (1)

| id | verdict | owner picked recommended | headline | safe path |
|---|---|---|---|---|
| q-t6xfzdl3eu | ask | - | Bugfix workflow: which module gets the first resolveWorkflow wiring, and is that the whole slice? |  |
