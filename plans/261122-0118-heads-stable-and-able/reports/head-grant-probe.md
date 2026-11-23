# Head grant probe: secretary and supervisor

Status: **final, with two gaps** (2026-11-24 02:20 +07, head:lead-forgent-261122-0118-heads-b52f9). The owner, through the
manual supervisor session, ordered the plan closed with any missing part named. Missing: the secretary's live rows (no
`head-grant-probe-secretary.json` exists), and a green `cargo test --workspace` (one red belongs to this plan, below).

Probe: `node test/live/head-grant-probe.live.mjs`, run inside each confined head on release `sha256:ef959860…`
(activated 2026-11-23 23:11 +07). The expected outcome comes from `grantOf` in `src/session-host/head-grants.mjs`; the
observed outcome comes from the head's own CLI call through its request socket.

- Supervisor: `reports/head-grant-probe-supervisor.json` (`b76553b29`), role `head:supervisor-forgent`.
- Secretary: **missing**. `reports/head-grant-probe-secretary.json` was asked of Miu by the supervisor and never landed.

`TMPDIR` in the supervisor head is `/tmp` and writable, which re-confirms `p-d3ub553ogh` live.

## Supervisor: verb by verb

| verb | expected | observed | evidence (code from the call) |
|---|---|---|---|
| session start | served | served | `persona-not-found` for `no-such-persona` |
| session stop | served | served | `stop-target-not-head` |
| session write | served | served | `path-not-granted` for `outside-grant/probe.txt`; live write of `plans/backlog.md` in `de15263ae` (23:37) |
| session read | served | served | `session-not-found` |
| session type | served | served | `session-not-found` |
| questions list | served | served | `done` |
| questions ask | served | served | `parts-incomplete` |
| questions ack | served | served | `question-unknown` |
| questions cancel | served | served | `question-unknown` |
| questions answer | refused | refused as expected | `verb-not-granted` |
| land | served | served | `path-outside-grant` |
| run | served | served | `writes-need-linked-worktree` |
| request result | served | served | `ticket-unknown` |
| worktree create | refused | refused as expected | `verb-not-granted` |
| supervisor handled | served | served | `event-unknown` |
| supervisor queue | served | served | `done` |
| supervisor plans | served | served | `done` |
| supervisor raise | served | served | `bad-args` for an invalid kind |
| slots | served | served | `done` |
| metrics record | served | served | `kind-not-allowed` |
| metrics prune | served | served | `done` (dry run, nothing applied) |
| friction record | served | served | disposition refusal |
| watcher tune | served | served (probe printed `failed`) | `host-failed: watcher.enabled is not tunable` (see below) |
| config patch | served | served (probe printed `failed`) | `patch-invalid` for `/dev/null/no-such-file` (see below) |
| session rotate | served | out of scope | acts on the caller; live soft rotation of this lead's lineage, `rotation.log` gen 8 (plan note 2026-11-22 22:25) |
| session answered | served | out of scope | acts on the caller; no use in the window |
| session restore role | served | out of scope | acts on the caller; no use in the window |
| session bind session | served | out of scope | acts on the caller; request-log line `head-request mbx-2670725 session bind session` |
| supervisor done | served | out of scope | acts on the caller; no use in the window |
| supervisor wake | served | out of scope | unsafe: always records a wake and may start a supervisor head |

**The two `failed` rows are served.** In both, the request reached the host, the route ran and the host answered with a
domain refusal of the probe's harmless arguments: `watcher tune` refuses the key `enabled`, and `config patch` refuses a
path that cannot exist. A transport or route failure would have no such reason. The probe printed `failed` because it
classifies by a list of known domain codes, and `watcher tune` reports its domain refusal under the generic
`host-failed` code (the same class of gap as `friction record`, found and fixed in the probe in `5b5eb89f8`). That gap is
outside this plan and goes to the supervisor for a backlog row.

## Secretary: verb by verb

**Missing.** Miu never ran the probe on release `ef959860` or `9e5ae72c`, so no secretary row is proven live. What stays
unproven from a confined secretary: every secretary verb of `grantOf('secretary')`, its `session write plans/backlog.md`
(phase 13), and its `TMPDIR`. Phase 13's grant is proven live only from the supervisor (`de15263ae`), and the secretary's
`TMPDIR` only by `test/session-host/head-start.test.mjs`. The command for whoever closes it: run
`node test/live/head-grant-probe.live.mjs` inside Miu on the active release and land the JSON as
`reports/head-grant-probe-secretary.json`.

## Suite (acceptance criterion 5)

**Not green.** Source: the unconfined run by the manual supervisor on main `980d1276d` (code unchanged at `728212c1f`),
`plans/reports/report-261124-0215-manual-supervisor-suite-and-release.md` and
`plans/reports/triage-261124-0200-main-red-triage.md` (`292290ffe`). Logs: `.fgos/runtime/tmp/suite-npm.log` and
`.fgos/runtime/tmp/suite-cargo2.log`.

- `npm test`: exit 1, 15 failures. The two this plan caused (`head-permission-mode.test.mjs:47`, `head-start.test.mjs:370`)
  were fixed in `896340551` and are no longer red. The triage assigns the other 15 to other owners or to the machine.
- `cargo test --workspace --no-fail-fast`: exit 101, three failures. Two belong elsewhere: `fgos-config`
  `registry_defaults` (`7106dbf78`, docos) and `fgos` `cli_tests` interrupt-of-host (not classified).
- **The third red belongs to this plan.** `fgos-run-supervisor` `head_request`
  `the_contract_names_exactly_the_refusal_codes_and_verbs_the_server_speaks`
  (`packages/run-supervisor/rust/tests/head_request.rs:883`). Phase 2's `31dcaab69` added the verb `config patch` to
  `packages/run-supervisor/contracts/head-request.v1.json`, but the test's expected verb list never gained it. The
  contract is right, so the fix is the test: add `"config patch"` as the first entry of that list. That file is no
  longer in this plan's footprint (narrowed 2026-11-23), so it is handed to the supervisor (see the plan note). The
  suite report said that none of the reds belongs to this plan; this row corrects it.

## Folded rows

| row | closed by | evidence |
|---|---|---|
| p-vquz26ibnn (2) config patch joins the supervisor grant | phase 2 | `b310eb241`, `3e13a0e61`; probe row `config patch` served |
| p-vquz26ibnn (a) secretary wakes on new questions or mail | phase 10, in part | `2fa775706`; `reports/secretary-wake.md`: the 15-minute tick missed hours in five generations, cause raised (event `8d135e51e0068a99`) |
| p-vquz26ibnn (b) time from question asked to owner seeing it | phase 8 | `827bbb7e1`; `reports/question-relay.md` (median 15.5 min against 76.4 before) |
| p-vquz26ibnn (c) a lead that parks a phase raises an event | phases 2, 7 | `01c149eda`, `36afd4d6b`; this lead raised `6651ac0004954653` on parking phase 11 |
| p-vquz26ibnn (7) wake rate and false idle alarms | phases 1, 9 | `reports/baseline-wake-and-idle.md`, `reports/after-wake-and-idle.md`: false idle rows 688 to 319, wakes not lowered (watcher fallback, raised for a backlog row) |
| p-vquz26ibnn (8) retire condition of manual `lead:SUPERVISOR` | phase 7 | `01c149eda`; `docs/platform/supervision/spec.md` |
| p-vquz26ibnn verb-by-verb list from a confined head | phase 11, in part | this report: supervisor rows only, secretary rows missing |
| p-ndortdckid heads record friction | phases 2, 7 | probe row `friction record` served |
| p-of5vpvce3e coordinating head never on a weak provider | phase 4 | `9abfa5257`; `test/session-host/head-start.test.mjs` "pins every coordinating persona to claude" |
| p-s2t244hkqj seat judge | explicit no | plan Non-goals |
| p-ycausep3zs head picks up a newer release | phase 5 | `78220dddb` |
| p-5gczifzh7h supervisor checks a lead's claimed wait | phase 7 | `01c149eda`, `test/skills/fgos-supervisor-idle-lead.test.mjs` |
| p-erwx4t7gl6 land door runs the plan check | phase 3 | `aa6b13729`; the `{plans}` gate is live (it refused this lead's land `c-3080-1795447949682` on 2026-11-23) |
| p-ekqtvofdoh admission writes `base` and `lead` | phases 3, 7 | `aa6b13729`, `01c149eda`; this plan's frontmatter carries both |
| p-d3ub553ogh secretary sandbox TMPDIR | already closed | `bbe0ffe2a`; probe `tmpdir` `/tmp` writable in the supervisor; secretary not probed live |
| p-bakpfrvigb orphan rotation state | phase 6 | `32e39e0ea` |
| rotation Stop hook fires in no head (owner 2026-11-22 09:08) | phase 6, phase 11 | probe `stopTraceLastLine`: a fresh line at 2026-11-23 16:15Z in the supervisor head (`source: sidecar`, `stale: false`, `below-soft`); live soft rotation gen 7 to 8 |
| p-6sd4fslxv7 landed worktree removed by the land door | phase 7 | `36afd4d6b`; `worktreesRemoved` on this plan's land `896340551` |
| p-4r4h3jqtth head ran 33 h without rotating | already done | plan `261121-0745-head-rotation-trace`, `65ad518d5` |
| rotation reliability (owner 2026-11-22 16:05) | phase 12 | `809c83190`, `df93b230f`, `8883c2a62`; live soft rotation gen 7 to 8 |
| p-kqs6fjalvh pool login expires inside a long seat | phase 12 (12b) | `039acaa7e` |
| p-dw3h5wscns heads may write `plans/backlog.md` | phase 13 | `5ebc25616`; live supervisor write `de15263ae` on release `ef959860`; secretary write not probed live |
