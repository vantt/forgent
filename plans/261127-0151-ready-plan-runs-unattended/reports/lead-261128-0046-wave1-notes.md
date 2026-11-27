# Lead notes: wave 1 (phases 1, 2, 3)

Lead: head:lead-forgent-261127-0151-ready-c75c2. Blockers 2318, 0143, 0144 are all `done`. Worktrees under
`/home/vantt/projects/forgent-worktrees/261127-0151-ready-plan-runs-unattended-p0{1,2,3}`.

## Runs

- First units (`code:implement`, gemini preferred) all failed on infrastructure. The gemini pools had no usable account,
  so the seat fell back to deepseek on thehive. Phase 1 failed with a provider disconnect
  (`NIXL_ERR_REMOTE_DISCONNECT`); phases 2 and 3 failed at `output-limit`, the same case as q-wuycblbhrk. Nothing was
  written.
- Re-run with a soft preference for `claude` (different provider, reason 3). All three passed:
  p01 `9dbd484022`, p02 `f2ade86388`, p03 `316509a052`.

## Reviews and dispositions

- **Phase 1** (subagent review):
  - Accepted (blocking): pointers claimed the coding unit is in AGENTS.md, but it is `when: domain`-restricted.
  - Accepted (nits): U7 source detail, U5 "U1-U4" wording, the ds-jxoz3h2qgk reference for the run-time ask rule,
    and the `5a.` list marker.
  - Fix commit: `392c2559a2`.
  - Open: `.fgos/instructions/effective/rules.json` is skip-worktree in worker worktrees, so its regenerated copy (both
    ids present, checked) is not committed. Raised as event 17b542db27562b20, the same case as plan 0144
    (`3f910d1872`).
  - Test proof is weak: `instruction-projections` and `skill-wrappers` fail in this confined lead with
    `git-addon-not-shipped`, on main as well as on the branch. Land gates and the phase 5 full gate must cover them.
- **Phase 2:**
  - Accepted (blocking): anchor the section heading; skip code fences; the `list --all` read is too large for the host
    reply.
  - Accepted: cache a failed read; a spacing fix; a test with a fenced template before the real section.
  - Rejected: finding 5 (the table shape is fixed by the plan) and finding 6 (lenient `None`).
  - Fix commit: `3e058e7e85`.
  - Lead recheck found the question read could never succeed. The host answers raw JSON, not an fgos.v1 envelope,
    and the read takes about 6 s against the 5 s `invokeHost` timeout. Fix commit: `d19f11b00e`.
  - Recheck on a gated copy of this plan: the answered id passes and `q-zzzzzzzzzz` alone is refused; a missing
    subsection is refused by name; 45/45 tests pass.
- **Phase 3:**
  - Accepted (blocking): a red result must exit non-zero (fix `9d139ea241`); `command-routes.json` must be
    regenerated, which needs a widen.
  - Accepted as a spec sentence: unconfined execution of worker code (owner decision D5); TMPDIR and `FGOS_*`
    stripping documented.
  - Deferred: a concurrency limit on `release check` (not in the acceptance criteria; candidate backlog row).
  - Rejected: narrowing to the lead's own plan (the spec allows any linked worktree).
  - Lead ran `cargo test -p fgos-run-supervisor --test head_request`: 66 pass, 1 fail. The failure is the handover
    test, which fails the same way on base (environment). All `release_check_*` tests pass.
  - `cargo test -p fgos routing` not run here (`ort_sys` link failure in this environment).
  - Widen from the lead was refused (merge-slot lock on a read-only fs); raised as event e597710e91e2f171.

## Lands

- p02 land 1: `worktree-admin-held` (busy contention).
- p02 land 2: prepare failed, `No space left on device`. The root disk is at 100% (3.0G free); my worktrees hold about
  22G, mostly `target/`.
- Parked wave 1 on the supervisor: event 0a30217e6e7c11b4.

## Next on wake

Once space is freed, land p02. Then:

- After the rules.json commit, land p01.
- After the widen, run one p03 unit that regenerates `command-routes.json` (`node scripts/export-command-selectors.mjs`),
  then land p03 with the `head_request` and `release` tests.

Set phases 1-3 `done` with `fgos land --paths`, then start wave 2 (phase 4).

## Landed

- p02 `c36df922e6`, p01 `f0348e3f07` (supervisor: committed rules.json `908a03866c`, merged main, landed by hand since no write
  scope covers `.fgos` paths), p03 `7c04d297ca` (supervisor merged main, ran the git one-door scan and census unconfined).
- p03 needed one more fix, `27652f3233`: the worktree check now lists worktrees through the git door
  (`GitDriver::list_worktrees`) instead of spawning git, which the one-door scan requires. Verified unconfined by the
  supervisor: release_check tests 3/3, scan 0 undeclared sites.
- The supervisor dropped two local decision ids (D5) from the run-supervisor spec entry for the citation-drift gate
  (`ba8d61ec45`).
- Confined-session limits met this wave: the head window drops `--sync` from `fgos run`; the git driver fails its
  probe in confined sessions (projection tests, one-door scan and git-door Rust tests cannot run there). Supervisor
  put the latter on the backlog list.

## Phase 4 (wave 2)

- Worktree p04 at `7c04d297ca`; `decide --for code:review` answered openai. Unit c-84341 wrote the report, then
  settled `output-limit` before claiming, so nothing was committed. The report is a plan-directory file, so the lead
  lands it with `fgos land --paths`.
- Lead Verify: 66 report ids, 0 outside the evidence file. Independent review: every sampled id, class, quote, refusal
  and total checks out; no claimed run overstated.
- Three nits, all accepted and fixed by the lead: line 99 wrongly said phase 11 removes worktrees; the summary
  overstated cleanup coverage (3 of 7); a per-class caught / partial / not-caught table was added for criterion 4.
