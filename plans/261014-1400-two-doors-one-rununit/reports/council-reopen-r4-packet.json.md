{
 "packet": "final-recommendation",
 "revision": "r4 (reopen, round 2): r3 with only the reviewer F1-F4 and red-team RT1-RT5 findings fixed; every other r3 claim, and through it the r2 packet, stands unchanged",
 "assignment": "unit-run-1791959166509-17455425/producer/2",
 "role": "producer",
 "mutation": "read-only",
 "repoHead": "f69a446f0 (worktree council-reopen)",
 "approvalStatus": "NOT APPROVED. Recommendation for owner/Lead. Owner decisions (2)-(5) are settled inputs. Reviewer and red-team of r3 returned 'findings'; r4 answers them but no check has accepted r4 yet.",
 "verdict": {
  "summary": "The owner's target shape holds: two mechanical doors (`fgos workflow start` = pre-planned; `fgos run` = one Unit, adaptive) on one runUnit boundary, with dispatch as a lower tier that knows nothing about Unit or Work. Shortest route: (R0) make the Doer path go green with 4 small fixes. The main break is NOT the sandbox: the runner already commits (commitUnitWork, run.mjs:497-507), but the brief told the agent to commit itself. (R1) the `fgos run \"<prompt>\"` one-liner + Unit `prefer`/`persona` as a soft preference that keeps governance and failover. (R2) delete D1/D3/`dispatch log`, move fanout-batch onto runUnit, add an import-guard test. (R3) D7/D8 onto runUnit as a separate, bounded item with its own acceptance gate. R0-R2 deliver N1+N2. The Work separation the owner asked for (5) is complete only when R3's gate passes, not at R2.",
  "A_target_shape_and_route": {
   "confirm": "Confirmed, with one refinement: a door is the syntax, runUnit is the only completion boundary (RunResult v3 + claim v2 + runner commit). `fgos run \"<prompt>\"` is just sugar that builds a one-shot Unit and calls runUnit, never a third engine.",
   "R0_doer_green": [
    "R0.1 Brief for a MUTATING unit-run producer gains one line: 'Only write files inside writes; do not git add/commit; the runner commits after pass.' (src/runner/dispatch/brief.mjs or the brief template). Root cause of the 13:22 probe: the objective demanded a commit -> the agent hit the read-only gitdir -> claimed blocked -> outcome != pass -> run.mjs:497 never reached commitUnitWork. Proof: rerun exactly that probe -> outcome pass + commit.sha in unit-summary.",
    "R0.2 Scoped landing (fixes F1/RT1). commitUnitWork today stages `add -A` and then runs an unrestricted `git commit` (commit-unit-work.mjs:48,61), so every staged index entry lands. New behaviour: (a) BEFORE staging, read `git diff --cached --name-only`. If it lists anything, fail closed: outcome execution-failure, reason 'index has staged entries not made by this round'. Nothing is reset and the unrelated work stays staged. A confined worker cannot stage (its gitdir is read-only), so a pre-staged entry always comes from someone else. (b) Stage with `git add -A -- <each write as :(literal)<path>> ':(exclude).fgos'`. :(literal) neutralises pathspec magic, which isValidRepoRelativePath (unit.mjs:50-59) does not reject. A write path is an exact file or a directory prefix, the same rule checkCoverage uses (evidence-attribution.mjs:123-127); no globs. (c) Commit and list only that staged set. (d) Deletions inside writes land. A rename that crosses the writes boundary lands only its in-scope half; the other half is reported as out of scope. Required regressions: a file staged outside writes before the round (commit refused, file still staged); a dirty outside file (not committed, reported); a deletion inside writes; a rename across the boundary; a write that is a directory; a write containing pathspec magic characters.",
    "R0.3 Coverage (fixes F2/RT2). Settlement passes `declaredCoverage: { paths: unit.writes }` (the object shape checkCoverage reads, evidence-attribution.mjs:125; a bare array yields [] and coverageMatched stays false) into attributeWorkspaceChanges (settlement.mjs:656). This needs unit.writes threaded into the assignment / effective contract (today writeScope = the whole worktree, an absolute path). Path rules: same literal/prefix rule as R0.2. coverageMatched means 'inside declared scope' only. The level stays 'correlated' without a positive adapter attestation, so it is not proof of authorship. Bounded acceptance: proven only for files that are new after launch, the probe's case. Pre-existing dirt is still classified 'excluded' with coverageMatched=false, because settlement passes no dirtyBeforeHashes (evidence-attribution.mjs:49-80); fixing that baseline is out of scope here and named as a residual risk. Tests: a declared file and a declared directory match; an undeclared file does not.",
    "R0.4 RunResult.confinement takes its label from the backend that actually ran (lane D step 1, unchanged from r2). Probe evidence: prepared-invocation requirement.mode='required', backend bwrap local-bwrap-v1, yet result.confinement=null because settlement.mjs:697 tests mode==='confined'.",
    "R0.5 Scope observation, kept separate from landing (fixes RT5). After settle and before commit, the runner computes outOfScope = the changed paths from the round's evidence (changedFiles) that are not inside writes, by the same rule. It returns them as `commit.outOfScope` on the commit record that run.mjs:504-505 already attaches to the Unit result and persists in the unit record / attempts. This needs no RunResult v3 or claim v2 schema change. A non-empty outOfScope is a warning, consistent with the #8 ladder. The files stay in the worktree, uncommitted. Test: an outside edit produces a non-empty commit.outOfScope in unit-summary."
   ],
   "R1_one_liner_and_unit_prefer": "`fgos run \"<prompt>\" [--provider X] [--persona Y] [--writes a,b] [--capability c]` -> builds Unit{id auto, objective=prompt, capability default per presence of --writes, writes, prefer:[X], persona:Y} -> runUnit. No --writes = read-only, absorbing D2 `--contract` (owner (4)). --writes from the main checkout: fail closed with 'create a worktree first or pass --worktree' (runUnit does not create worktrees, run.mjs:164; the mutating gate requires a linked worktree). Auto-worktree is a later decision.",
   "R2_delete_and_cut": "Delete `dispatch execute <executor>` (D1), `--assignment` (D3), `--contract` (D2, absorbed), and the `dispatch log` verb; record a decision superseding the D1 part of RUL68 plus RUL76/RUL77 'one lane per door' (owner (4) is the authority; Lead writes the record). Rewrite AGENTS.md:167 + executor-dispatch-fallback.md Step B/B.5 in the SAME commit as the deletion (never teach a door that no longer exists). Do not merge af132275b (owner); still take 360aced90 and 5d8b7cdb1 (no conflict with the owner decisions).",
   "R3_later": "D7 spawnWorker and D8 operation-choice onto runUnit (see D). Bounded, not 'whenever the loop is next touched' (fixes RT4): the Lead submits it as its own work item in the same session that closes R2. Its acceptance gate is in D.R3_gate.",
   "why_this_order": "R0 is needed for N2 to work at all; every step is small code with a named test. Size is an estimate, not a measured effort bound. R1 is sugar over code that already exists (the bind override persona at bind.mjs:390-409). R2 is deletion + a doctrine edit. R3 touches the runner loop, the most expensive part, and blocks neither N1 nor N2, so it comes last as a separate gated item."
  },
  "B_who_commits": {
   "answer": "The runner commits; this is already designed and built (commit 5cd01e884 'commit a producer's work from the trusted runner; git metadata read-only for confined workers'). runUnit calls commitUnitWork after pass (run.mjs:497-507). Keep it. Refinement: the commit is scoped to unit.writes, and an index carrying foreign staged entries fails closed (R0.2). A pathspec-only `git add` would not achieve this on its own.",
   "rejected": [
    {
     "option": "Relax the sandbox so git common dir is writable",
     "why": "bwrap ro-binds the worktree's gitdir on purpose (probe prepared-invocation); a commit also has to write objects/refs into the main repo's common dir -> a worker could move any branch ref or overwrite objects (rationale written at commit-unit-work.mjs:3-8). This undoes a deliberate security decision."
    },
    {
     "option": "Lead commits after review",
     "why": "Brings back the hand-off step that Release con người (D-ADR0030 #2) wants removed; a Lead review remains possible on the commit the runner already made (review before merge, not before commit)."
    }
   ],
   "commitMessage": "Subject = first line of agentClaim.summary (commit-unit-work.mjs:29-34). If a fixed message is needed, a later option: an optional Unit `commitMessage` field. Not added now (YAGNI)."
  },
  "C_unit_provider_persona": {
   "shape": "Unit allows `prefer: [<executorId> | {executor, invocation?}]` (the same shape as capability prefer, reusing normalizeCandidates) and `persona: <name>`. Remove 'prefer' from DISALLOWED_UNIT_FIELDS (unit.mjs:7-16); keep the ban on executor, model, tier, invocation, actors, overrides. Executor ids already map one-to-one to providers (RUL70), so --provider openai == prefer ['openai'].",
   "semantics": "SOFT preference: unit.prefer is prepended to the capability's prefer list, never REPLACES it. Today a human --override executor replaces the whole pool with a single candidate (bind.mjs:149-156), so failover has nothing to walk; reusing that mechanism for Unit prefer would lose failover. Every candidate still goes through bind()'s filters: independence (bind.mjs:215-236), posture capability, quarantine/provider-limit, locked-persona (bind.mjs:393-399). A Unit persona that conflicts with locked-persona -> refused, same as an override.",
   "humanOverride": "`--override` stays the hard pin with origin human-cli (and acceptDependence for exceptions); not merged with Unit prefer.",
   "test": "A Unit with prefer [A], where A is under provider-limit, falls over to B from the capability list. A Unit persona that conflicts with locked-persona is refused. A prefer candidate that fails independence or posture is filtered out like any other candidate. If any of these fails, the prefer integration is wrong and gets fixed; failover is not removed."
  },
  "D_cut_work_from_dispatch_and_flow": {
   "rule": "src/workflow/**, src/runner/execution/**, src/runner/dispatch/** and src/runner/dispatch.mjs never import src/state/** or work-*.mjs (Work depends on flow/dispatch, never the reverse). Enforce with an architecture-guard test modeled on test/runner/execution/patterns/architecture-guard.test.mjs. Verified today (grep): src/workflow and src/runner/execution have zero such imports, so they are guarded strictly with no allowlist. dispatch.mjs and fanout-batch.mjs are cleaned in R2. D7/D8 sit on a named allowlist that must be empty at R3's gate.",
   "currentViolations_verified": [
    "dispatch.mjs:90-94 imports resolveWorkForDispatch, logExecutorDispatch, state/store; re-exports spawnWorker, executorIdForWork, buildPrompt (:37,:68,:70)",
    "`dispatch log` requires --id <workItemId> (dispatch.mjs:111-135)",
    "the `dispatch fanout-batch` subcommand (dispatch.mjs:137+) -> fanout-batch.mjs imports listWork, worker-slots, work-compat, work-dispatch and calls executeExecutorCli directly (:106), then commitUnitWork itself (:119): a hand-rolled duplicate of runUnit",
    "D7 spawnWorker (work-dispatch.mjs:96, called from loop.mjs:1077,1505) -> executeThroughConfinement directly (:257); loop.mjs:374 has a third commitUnitWork call site",
    "D8 operation-choice.mjs -> executeAssignment directly (scout :27), bypassing runUnit"
   ],
   "now_in_R2": "Delete `dispatch log` (provenance is in the Assignment store + unit-summary; a Work-tier caller that wants an executor.dispatch event writes it itself, D-0049 section 3 default kept). Move fanout-batch out of the `dispatch` namespace into the Work tier (the fgos-fanout verb) and have it call runUnit per child; drop its direct executeExecutorCli + commitUnitWork calls. Afterwards executeExecutorCli has exactly one caller: the internal transport step in assignment-runner.mjs:2670.",
   "later_R3": "D7 and D8 onto runUnit, with Work as a consumer: Work builds the Unit, reads RunResult/unit-summary and writes its own lifecycle. Owner of the follow-up: the Lead. Timing: submitted as its own item when R2 closes. Until it lands, the summary must say 'N1/N2 delivered, Work separation incomplete (D7/D8)'.",
   "R3_gate": [
    "The guard allowlist is empty: no file under the guarded set imports Work/state.",
    "loop.mjs and work-dispatch.mjs call runUnit; there is no direct executeThroughConfinement / executeAssignment call from Work code, and no commitUnitWork call site outside run.mjs.",
    "executeExecutorCli has exactly one caller (the assignment-runner transport step).",
    "If the gate is not met by the item's close, separation stays recorded as incomplete and needs a new rollout disposition from the owner."
   ]
  },
  "E_lanes": {
   "laneA": "Closed (owner). Its remainder (provenance id) disappears together with `dispatch log` in R2.",
   "laneB": "Still valid; change only where it lands: --effort is a bind() override on `fgos run`/`workflow start` (+ the one-liner), pushed into argv; NOT on D1 (being deleted). The model-drift warning stays in RunResult provenance.",
   "laneC": "Still valid in the RUL65b-narrowed form. Once D1/D9 are deleted or moved onto runUnit, the 'classifier without a lease' half shrinks: every surviving door goes through Assignment, which holds a lease (RUL68), and runUnit already has account rotation + nextCandidate (run.mjs:516-540). The rest: a provider-specific structured retry-time signal (if one exists) + self-reschedule = a Workflow-runner decision question. UNPROVEN: whether the herdr-spawn adapter (which the probe used) fully classifies provider-limit.",
   "laneD": "Still valid and now ON THE R0 CRITICAL PATH. Step 1, confinement null (R0.4), was reconfirmed by the probe. New small work: R0.3 (coverage) and R0.5 (scope observation). #8 stays at warning (unchanged). #6 docs-only interim: the r2 'scope-checked' stopgap is now realised as R0.5 observation plus R0.2 selective landing, using existing git and no new bwrap tooling. This is post-hoc: a worker can still write outside writes inside the worktree. That write is reported and never committed, but it is not prevented. Write-time prevention (the r2 docs-only dissent) stays open."
  }
 },
 "evidence": [
  {
   "claim": "The 13:22 probe: override openai took effect, 44s, claim v2 blocked because of index.lock on a read-only fs",
   "source": ".fgos/assignments/unit-run-1791958907479-720a95d7/{unit.json, unit-summary.json, producer/1/runs/01/result.json, outbox/result-1.json}; durationMs 43553; policy.executorId openai source cliOverride",
   "status": "re-verified by producer r3"
  },
  {
   "claim": "The probe objective itself demanded a commit; the brief has no line saying the runner commits",
   "source": "probe brief-1.md:29; grep brief.mjs/operation-prompt-templates.mjs found no such line",
   "status": "re-verified"
  },
  {
   "claim": "runUnit commits after pass via commitUnitWork; a failed commit fails the round",
   "source": "src/runner/execution/run.mjs:497-507; commit 5cd01e884",
   "status": "re-verified"
  },
  {
   "claim": "commitUnitWork uses `git add -A` excluding .fgos, not limited to writes",
   "source": "src/runner/execution/commit-unit-work.mjs:47",
   "status": "re-verified"
  },
  {
   "claim": "bwrap ro-binds the worktree gitdir on purpose; only the worktree, the outbox and a tmp home are writable",
   "source": "probe protected/prepared-invocation/*.json workerInvocation.args: --ro-bind of the main repo's worktrees/doer-probe gitdir",
   "status": "re-verified"
  },
  {
   "claim": "result.confinement null although requirement.mode=required and backend=bwrap",
   "source": "probe prepared-invocation requirement/backend; result.json confinement null; settlement.mjs:697",
   "status": "re-verified"
  },
  {
   "claim": "coverageMatched is always false because settlement passes no declaredCoverage",
   "source": "settlement.mjs:656; evidence-attribution.mjs:123-127; probe evidence.attribution[0].coverageMatched=false",
   "status": "re-verified"
  },
  {
   "claim": "The effective contract's writeScope = the whole worktree, not unit.writes",
   "source": "probe effective-execution-contract.json workspace.writeScope",
   "status": "re-verified"
  },
  {
   "claim": "Unit forbids executor/provider/model/tier/invocation/actors/prefer/overrides (G2); persona is not on the list",
   "source": "src/runner/execution/unit.mjs:7-16, :93",
   "status": "re-verified"
  },
  {
   "claim": "An override executor replaces the whole candidate pool",
   "source": "src/runner/execution/bind.mjs:149-156",
   "status": "re-verified"
  },
  {
   "claim": "bind already supports override persona + the locked-persona check",
   "source": "bind.mjs:390-409",
   "status": "re-verified"
  },
  {
   "claim": "runUnit does not create worktrees; it uses cwd or --worktree",
   "source": "run.mjs:164; the run.mjs:2 guard forbids importing worktree.mjs",
   "status": "re-verified"
  },
  {
   "claim": "dispatch log needs a Work id; dispatch.mjs imports work-dispatch/state",
   "source": "src/runner/dispatch.mjs:37,68,70,90-94,111-135",
   "status": "re-verified"
  },
  {
   "claim": "fanout-batch calls the transport directly + commits itself + imports Work",
   "source": "src/runner/fanout-batch.mjs:6-12,106,119",
   "status": "re-verified"
  },
  {
   "claim": "spawnWorker goes straight to executeThroughConfinement; called from loop",
   "source": "work-dispatch.mjs:96,257; loop.mjs:1077,1505; loop.mjs:374 commitUnitWork",
   "status": "re-verified"
  },
  {
   "claim": "executeExecutorCli has 3 callers",
   "source": "cli.mjs:1523, assignment-runner.mjs:2670, fanout-batch.mjs:106",
   "status": "re-verified"
  },
  {
   "claim": "D8 operation-choice -> executeAssignment",
   "source": "scout-261014-1045-dispatch-door-map.md:27",
   "status": "from scout, not re-verified"
  },
  {
   "claim": "19 real Doer turns through the raw door",
   "source": "/home/vantt/projects/forgentX/.fgos/runtime/tmp/doer-turn-*.out.json (count 19)",
   "status": "count re-verified; contents not read"
  },
  {
   "claim": "RUL68 one-way bridge text",
   "source": "docs/specs/runner.md:1048",
   "status": "re-verified"
  },
  {
   "claim": "commitUnitWork reads the whole cached diff and commits without a path restriction, so pre-staged entries land",
   "source": "src/runner/execution/commit-unit-work.mjs:48-49,61",
   "status": "re-verified by producer r4 (F1/RT1)"
  },
  {
   "claim": "checkCoverage reads declaredCoverage.paths || declaredCoverage.writeScope and matches exact path or directory prefix",
   "source": "src/runner/dispatch/evidence-attribution.mjs:123-127",
   "status": "re-verified (F2/RT2)"
  },
  {
   "claim": "Pre-existing dirt without hashes is classified excluded, coverageMatched false, before coverage is consulted; settlement passes no hashes",
   "source": "evidence-attribution.mjs:49-80; settlement.mjs:656",
   "status": "re-verified (RT2)"
  },
  {
   "claim": "Unit writes validator rejects absolute, '..', backslash and NUL but not pathspec magic",
   "source": "src/runner/execution/unit.mjs:50-59,151-165",
   "status": "re-verified (RT1)"
  },
  {
   "claim": "The commit record is attached to the Unit result and attempts, separate from runResult",
   "source": "src/runner/execution/run.mjs:497-507",
   "status": "re-verified (RT5)"
  },
  {
   "claim": "src/workflow and src/runner/execution import nothing from src/state or work-*.mjs",
   "source": "grep of import specifiers at f69a446f0",
   "status": "verified by producer r4 (RT4)"
  }
 ],
 "alternatives": [
  {
   "option": "Relax the sandbox so git common dir is writable",
   "disposition": "rejected",
   "why": "See B; undoes 5cd01e884."
  },
  {
   "option": "Lead commits after review",
   "disposition": "rejected as the default",
   "why": "Adds a waiting step; review can still happen before merge."
  },
  {
   "option": "Unit prefer = hard pin (reuse override)",
   "disposition": "rejected",
   "why": "Loses failover (bind.mjs:149-156), against owner (3)."
  },
  {
   "option": "Cut all of Work now (D7/D8 included)",
   "disposition": "deferred to R3 as a bounded, gated item",
   "why": "The runner loop is the most expensive part and blocks neither N1 nor N2. R3 has a named owner, a submit point and a gate (D.R3_gate); the guard test stops the boundary from spreading meanwhile."
  },
  {
   "option": "One-liner automatically creates a worktree",
   "disposition": "deferred",
   "why": "Needs runUnit to import worktree (violates the run.mjs:2 guard) or a new layer; fail closed with a clear message is enough for now."
  },
  {
   "option": "Build the scope-checked bwrap subpath posture for #6",
   "disposition": "realised differently, not superseded",
   "why": "The r2 stopgap 'scope-checked' becomes R0.5 (observe and report out-of-scope edits) plus R0.2 (land only writes) with existing git, no new bwrap tooling. The prevention question stays open (see dissent)."
  },
  {
   "option": "R0.2 with pathspec on `git add` only",
   "disposition": "rejected",
   "why": "The unrestricted `git commit` still lands foreign pre-staged entries (F1/RT1)."
  },
  {
   "option": "R0.2 via `git commit --only -- <writes>` (leave foreign staged entries staged, commit around them)",
   "disposition": "kept as an alternative, not the default",
   "why": "It works, but it lands on top of an index someone else is using, and untracked/unmatched pathspecs need extra handling. Failing closed is simpler, and since a worker cannot stage, it is never triggered by the round itself."
  },
  {
   "option": "Temporary index (GIT_INDEX_FILE seeded from HEAD)",
   "disposition": "rejected",
   "why": "It leaves the worktree's real index out of step with the new HEAD (reverse-staged view)."
  }
 ],
 "attributedFindings": [
  {
   "by": "r2 council (framing, panelist-1..3, synthesizer, reviewers, red-team)",
   "finding": "Unchanged: confinement-null diagnosis (2 causes), #8 ladder, RUL65b narrowing of lane C, missing durable record (now persisted by the Lead at council-261014-1231-...md)."
  },
  {
   "by": "owner (2026-10-14)",
   "finding": "Decisions (1)-(5): two doors, Unit provider+persona, delete D1/D3, fold D2, do not merge af132275b, dispatch is the low tier, Work only consumes."
  },
  {
   "by": "owner probe 13:22",
   "finding": "Override works; commit breaks; confinement null; coverageMatched false; no one-liner yet."
  },
  {
   "by": "producer r3 (this revision)",
   "finding": "The commit break comes from the brief/objective, not from a missing mechanism: commitUnitWork already exists and is called after pass."
  },
  {
   "by": "producer r3",
   "finding": "coverageMatched is false because settlement never supplies declaredCoverage, a different cause than confinement null."
  },
  {
   "by": "producer r3",
   "finding": "Unit prefer must prepend, not replace, or failover is lost."
  },
  {
   "by": "producer r3",
   "finding": "fanout-batch and loop.mjs each call commitUnitWork themselves: three commit sites, a concrete sign of the duplicated flow that the runUnit boundary should absorb."
  },
  {
   "by": "reviewer of r3 (F1) + red-team of r3 (RT1)",
   "finding": "A pathspec on `git add` does not scope the commit; pre-staged entries land; pathspec magic is not excluded.",
   "disposition": "accepted -> R0.2 rewritten (fail closed on foreign staged entries, :(literal) pathspecs, scoped commit list, deletion/rename/magic regressions)."
  },
  {
   "by": "reviewer of r3 (F2) + red-team of r3 (RT2)",
   "finding": "declaredCoverage must be {paths}, not an array; path semantics differ from git pathspecs; pre-existing dirt without hashes stays excluded.",
   "disposition": "accepted -> R0.3 uses {paths: unit.writes}, one shared literal/prefix rule, acceptance bounded to new files, dirty-baseline named as a residual risk."
  },
  {
   "by": "reviewer of r3 (F3) + red-team of r3 (RT5 second half)",
   "finding": "The parent docs-only dissent was compressed without its authors; the confinement-fix ordering dissent was dropped without a disposition.",
   "disposition": "accepted -> unresolvedDissent restores all parent sides and gives ordering an explicit disposition."
  },
  {
   "by": "reviewer of r3 (F4) + red-team of r3 (RT3)",
   "finding": "The reversal trigger 'governance failure -> hard pin, no failover' overrides owner decision (3).",
   "disposition": "accepted -> trigger replaced: fix or refuse the faulty prefer integration; failover stays; only a new owner decision can change it."
  },
  {
   "by": "red-team of r3 (RT4)",
   "finding": "R3 had no owner, schedule or gate; the guard did not name the workflow surface; R2 must not be called completed separation.",
   "disposition": "accepted -> R3 owner/submit point/gate (D.R3_gate), src/workflow/** added to the guard, verdict summary distinguishes delivered N1/N2 from incomplete separation."
  },
  {
   "by": "red-team of r3 (RT5 first half)",
   "finding": "Selective landing is not scope checking; there was no path for the warning to reach the result.",
   "disposition": "accepted -> R0.5 commit.outOfScope on the existing commit record; 'superseded' claim withdrawn."
  }
 ],
 "dispositions": [
  {
   "item": "r2 step 0: merge af132275b",
   "disposition": "reversed by owner (4): do not merge. 360aced90, 5d8b7cdb1 still taken."
  },
  {
   "item": "r2 step 4: defer the D1 wrapper pending measurement + RUL68 supersession",
   "disposition": "resolved by owner: no wrapper, D1 is deleted; the one-liner on runUnit replaces it. Superseding RUL68-D1/RUL76/RUL77 is still REQUIRED as a decision record (Lead writes it, owner is the authority)."
  },
  {
   "item": "r2 step 5: delete D1 only after measurement",
   "disposition": "resolved by owner; the measurement gate is dropped. The 19 Doer turns are the demand evidence."
  },
  {
   "item": "r2 step 6: refuse raw-D1 mutating runs from main",
   "disposition": "moot: D1 is deleted."
  },
  {
   "item": "r2 step 1 (confinement null)",
   "disposition": "kept; moved into R0."
  },
  {
   "item": "r2 step 2 (#8 warning)",
   "disposition": "kept unchanged."
  },
  {
   "item": "r2 step 3 (doctrine after code)",
   "disposition": "kept; tied to the R2 deletion commit."
  },
  {
   "item": "r2 Q4 interim 'scope-checked'",
   "disposition": "realised as R0.5 observation + R0.2 selective landing (not 'superseded'); prevention still open."
  },
  {
   "item": "r2 named default: executor.dispatch event stays with the Work-tier caller",
   "disposition": "kept; that is the 'Work only consumes' direction."
  },
  {
   "item": "r3 reversal trigger 'governance failure -> hard pin, no failover'",
   "disposition": "withdrawn (F4/RT3): it contradicted owner (3)."
  }
 ],
 "unresolvedDissent": [
  {
   "topic": "Measure before building the short door",
   "sides": "r2: framing, panelist-1, panelist-3 wanted to build the shortcut; panelist-2 (adopted by r2) wanted doctrine first, measure, then build only if needed.",
   "status": "Overruled by owner decision (4) plus the 19-turn demand evidence, NOT refuted on the merits. The 19 files show demand, not external caller coverage. Panelist-2's residual risk survives: no ingress count of external callers of D1/D3. Mitigation: a clear error pointing to the new syntax."
  },
  {
   "topic": "Docs-only confinement shape",
   "sides": "framing/panelist-1: a third named posture via bind(). panelist-2: a capability-specific allowlist, fail closed. panelist-3: no subpath bwrap, worktree + scope-check.",
   "status": "Open, all three positions kept. R0.2/R0.5 implement panelist-3's observe-and-land variant with existing tools. That does not answer panelist-2 (fail closed at write time) or framing/panelist-1 (a bind posture), and none of the three is proven."
  },
  {
   "topic": "Order of the confinement fix",
   "sides": "panelist-1: before the wrapper; panelist-3: inside step 0; panelist-2: after af132275b.",
   "status": "Superseded by the new rollout, not refuted. The owner removed the wrapper and the af132275b merge (4), so two anchors are gone; the fix is R0.4, before R1. The underlying r2 reason, that #8 rejection depends on attestation, is unchanged."
  },
  {
   "topic": "Commit scope: writes-only + fail closed on a foreign index (r4) vs `add -A` (current 5cd01e884)",
   "sides": "producer r3/r4 recommends writes-only. The counter-argument (producer r3, reviewer, red-team): a worker that legitimately creates extra files outside writes sees them left behind, so writes must be complete.",
   "status": "A producer recommendation, not a seat consensus; needs Lead/owner confirmation."
  },
  {
   "topic": "D7/D8 timing",
   "sides": "producer r3/r4: defer to a bounded R3. red-team RT4: acceptable only with a gate and without claiming separation done.",
   "status": "A rollout default under owner question (D) 'now or later'; separation is not achieved until D.R3_gate passes."
  }
 ],
 "namedDefaults": [
  {
   "default": "The runner commits; workers never commit (brief says so explicitly).",
   "reversibleBy": "owner decision"
  },
  {
   "default": "The commit covers only unit.writes (:(literal) pathspecs, exact file or directory prefix). An index already carrying foreign staged entries fails the round closed without touching them. Outside edits are reported in commit.outOfScope, not committed.",
   "reversibleBy": "owner choosing add -A, `commit --only`, or fail-the-round on any outside edit"
  },
  {
   "default": "Unit prefer is soft (prepend); --override stays the human hard pin.",
   "reversibleBy": "owner"
  },
  {
   "default": "The one-liner without --writes = read-only; with --writes from main checkout = refused.",
   "reversibleBy": "an auto-worktree decision"
  },
  {
   "default": "Field name `prefer` (same shape as capability prefer), not `provider`.",
   "reversibleBy": "Lead/owner preferring the name `provider` (alias)"
  },
  {
   "default": "D7/D8 stay on the guard allowlist until R3, which the Lead submits when R2 closes and which closes only on D.R3_gate.",
   "reversibleBy": "owner wanting it done now"
  },
  {
   "default": "#8 stays at warning; receipt v3 + claim v2 unchanged.",
   "reversibleBy": "as r2"
  },
  {
   "default": "Unit writes and attribution coverage share one path rule: exact file or directory prefix, no globs.",
   "reversibleBy": "a later decision to add globs to both, together"
  }
 ],
 "residualRisks": [
  "Deleting D1/D3 may break external projects or scripts that call them (no ingress count); mitigate with an error message that points to the new door.",
  "Writes-only landing leaves legitimate files that were missing from writes uncommitted; they show up only in commit.outOfScope, not as an error.",
  "A worker can still write outside writes inside the worktree (only blocked at commit); not real confinement.",
  "UNPROVEN: the herdr-spawn adapter classifies provider-limit fully for the R1 failover path.",
  "UNPROVEN: whether the probe will pass after R0.1 has not been rerun (the read-only producer cannot run it).",
  "The test suite is not hermetic inside an agent session (run with env -u CLAUDE_CODE_SESSION_ID).",
  "D7/D8 still bypass runUnit until R3's gate passes; Work separation (owner (5)) is incomplete until then.",
  "Attribution of pre-existing dirt stays 'excluded' (no dirtyBeforeHashes from settlement); R0.3 is proven only for files new after launch.",
  "The fail-closed index check could block a round if a human stages something in a Unit worktree mid-run; the error has to say why and what to do.",
  "Rename and deletion behaviour of the scoped commit is unproven until the R0.2 regressions exist.",
  "All R0 size estimates are estimates, not measured effort bounds."
 ],
 "reversalTriggers": [
  "Rerun the probe after R0.1 and the commit still fails -> the root cause lies elsewhere; revisit B without automatically loosening the sandbox.",
  "A Unit prefer test shows a governance filter bypassed -> refuse or roll back the faulty prefer integration, fix it and retest. Owner (3) failover stays; changing it needs a new owner decision.",
  "An external caller of D1/D3 is found that cannot migrate quickly -> keep a refusal stub for one release.",
  "An unrelated staged or out-of-scope path lands in a Unit commit -> stop writes-only acceptance and repair R0.2.",
  "Writes-only landing repeatedly drops needed files -> owner chooses between fail-the-round on outside edits and add -A + warning.",
  "An observed outside edit is missing from commit.outOfScope -> R0.5 is not done; do not call the docs-only interim realised.",
  "D7/D8 exceptions survive R3's close -> separation stays incomplete and needs a new rollout disposition from the owner.",
  "bwrap subpath write-binds proven -> reopen write-time prevention for docs-only."
 ],
 "whatChangedAndWhy": [
  "r4 vs r3, only what the checks found:",
  "R0.2 (F1/RT1): a pathspec add no longer counts as scoped landing. Fail closed on a foreign staged index, :(literal) pathspecs, a scoped commit list, and named regressions for pre-staged, deletion, rename, directory and magic cases.",
  "R0.3 (F2/RT2): declaredCoverage is {paths: unit.writes}; one shared literal/prefix rule; coverageMatched is not proof; acceptance bounded to new files.",
  "R0.5 new (RT5): scope observation kept separate from landing, reported as commit.outOfScope on the existing commit record, with no schema change. The docs-only interim is 'realised', not 'superseded'.",
  "Dissent (F3/RT5): all parent sides restored with authors; the ordering dissent marked superseded-not-refuted; new entries for commit scope and D7/D8 timing.",
  "Reversal trigger (F4/RT3): the 'hard pin, no failover' trigger is withdrawn; failover stays per owner (3).",
  "R3 (RT4): given an owner (Lead), a submit point (R2 close) and a gate (D.R3_gate); src/workflow/** joins the guard; the verdict no longer implies separation is done at R2.",
  "Missing expertise: added git index / scoped commit semantics and Workflow/Work dependency architecture, as both checks named.",
  "Unchanged from r3: the target shape, B's choice of runner commit, C's soft-prefer shape, R1, R2, lanes A/B/C, and all r2 carry-overs."
 ],
 "missing expertise": [
  "Git index isolation and scoped commit semantics (staged entries, renames, deletions, pathspec magic)",
  "bwrap / Linux namespace sandbox policy (subpath write binds, git directory handling)",
  "provider CLI output formats for usage-limit signals (Codex/OpenAI, xai) and herdr provider-limit classification",
  "caller inventory of D1/D3 across external project installations (migration of deleted doors)",
  "run-specific filesystem write attribution and concurrency isolation",
  "Workflow/Work dependency architecture and migration acceptance"
 ],
 "actionsRequiredFromLead": [
  "Do R0.1-R0.5 (one item, one commit each, each with its named test), then rerun exactly the 13:22 probe as the acceptance gate.",
  "Write the decision record superseding RUL68-D1 / RUL76 / RUL77 (owner (4)) before the R2 deletion commit.",
  "Confirm the writes-only + fail-closed commit default (dissent: commit scope).",
  "When R2 closes, submit R3 as its own item with D.R3_gate as its acceptance.",
  "Update lane-b/c/d briefs per E; lane A closed."
 ],
 "challengeTargetsForReviewers": [
  "Does R0.2 (fail closed on a foreign index + :(literal) pathspecs + scoped commit) close F1/RT1, including renames and deletions?",
  "Is {paths: unit.writes} with the literal/prefix rule consistent between R0.2, R0.3 and R0.5?",
  "Are all parent dissent sides restored with their authors, and is no dissent turned into agreement?",
  "Does any trigger or default still override owner (3) failover or owner (5) separation?",
  "Is the R3 gate concrete enough to tell 'separation done' from 'not done'?",
  "Is the missing-expertise array complete?"
 ]
}
