//! The "predecessor domain must be empty" acquire rule, exercised against real
//! domains: after the kernel lock is taken, the contender reads the record next
//! to the lock file and only proceeds once the previous holder's process domain
//! is empty (Windows: named job; unix control: the previous holder's process).

use crate::plat;
use crate::util::*;
use serde_json::{json, Value};
use std::path::Path;
use std::time::{Duration, Instant};

pub struct Enter {
    pub proceeded: bool,
    pub held_reason: Option<String>,
    pub lock_wait_ms: f64,
    /// Time spent in the predecessor check after the lock was taken.
    pub extra_wait_ms: f64,
    pub record_found: bool,
    pub domain_opened: bool,
    pub terminated: bool,
    pub fallback_used: bool,
    /// Job accounting (`ActiveProcesses`) when the domain was opened.
    pub open_active: Option<u32>,
    /// Member list size when the domain was opened (None: the domain could not be opened).
    pub open_list_len: Option<usize>,
    /// Per watched pid: was it in the member list at open.
    pub watch_in_open_list: Vec<Value>,
    /// The extra check ran: domain opened with count 0 and an empty list, so the recorded holder's tree was checked.
    pub toolhelp_checked: bool,
    /// That check found live descendants of the recorded holder (None: not run).
    pub toolhelp_live_descendants: Option<Vec<u32>>,
    pub alive_at_proceed: Vec<u32>,
    /// Per watched pid at the decision: state, and how long after the decision it was still running.
    pub diag: Vec<Value>,
}

/// How the contender treats a predecessor domain it finds non-empty.
#[derive(Clone, Copy)]
pub struct Rule {
    /// Upper bound for waiting until killed processes are signaled (kill-wait).
    pub kill_wait: Duration,
    /// Use the process-tree fallback when the domain cannot be opened and the record names a holder.
    pub fallback: bool,
    /// When the domain opens with count 0 and an empty member list, also check the recorded holder's process tree.
    pub toolhelp_on_empty_list: bool,
}

/// Takes the lock (polling), applies the predecessor rule, and reports which watched
/// processes were still alive at the moment it decided to proceed.
///
/// Rule: open the domain; if it is not empty (accounting 0 AND every listed member signaled), kill it at
/// once (the holder is dead because we hold the lock) and wait up to `kill_wait` for the same condition. If the domain cannot
/// be opened, optionally wait on the recorded holder's process tree instead.
pub fn enter(lock: &Path, record: &Path, rule: Rule, watch: &[u32], wait_lock: Duration) -> Result<Enter, String> {
    let t_start = Instant::now();
    let mut guard = None;
    wait_until(wait_lock, || {
        guard = plat::try_acquire(lock);
        guard.is_some()
    })
    .ok_or("contender never obtained the lock")?;
    let t_lock = Instant::now();
    let mut e = Enter {
        proceeded: false,
        held_reason: None,
        lock_wait_ms: ms(t_lock - t_start),
        extra_wait_ms: 0.0,
        record_found: false,
        domain_opened: false,
        terminated: false,
        fallback_used: false,
        open_active: None,
        open_list_len: None,
        watch_in_open_list: vec![],
        toolhelp_checked: false,
        toolhelp_live_descendants: None,
        alive_at_proceed: vec![],
        diag: vec![],
    };
    let rec: Option<Value> = std::fs::read_to_string(record).ok().and_then(|s| serde_json::from_str(&s).ok());
    let id = rec.as_ref().and_then(|r| r["domainId"].as_str()).map(String::from);
    let holder = rec.as_ref().and_then(|r| Some((r["holder"]["pid"].as_u64()? as u32, r["holder"]["creationTime"].as_u64()?)));
    e.record_found = id.is_some();
    let mut empty = true;
    let mut chain_first: Vec<u32> = vec![];
    if let Some(id) = id {
        if let Some(mut dom) = plat::domain_open(&id) {
            e.domain_opened = true;
            let (open_active, open_list) = plat::domain_open_view(&dom);
            e.open_active = open_active;
            e.open_list_len = Some(open_list.len());
            e.watch_in_open_list = watch.iter().map(|p| json!({"pid": p, "inListAtOpen": open_list.contains(p)})).collect();
            // Full rule: accounting is 0 and every listed member is signaled; the list is re-read on each query,
            // including when accounting is already 0 at open.
            empty = plat::domain_active(&mut dom) == Some(0);
            if empty && rule.toolhelp_on_empty_list && open_active == Some(0) && open_list.is_empty() {
                if let Some((hp, hc)) = holder {
                    if let Some(f) = plat::fallback_wait(hp, hc, rule.kill_wait) {
                        e.toolhelp_checked = true;
                        e.toolhelp_live_descendants = Some(f.live_at_first_snapshot);
                        empty = f.empty;
                        chain_first = f.chain_at_first_snapshot;
                    }
                }
            }
            if !empty {
                plat::domain_kill(&mut dom);
                e.terminated = true;
                empty = wait_until(rule.kill_wait, || plat::domain_active(&mut dom) == Some(0)).is_some();
            }
        } else if rule.fallback {
            if let Some((hp, hc)) = holder {
                if let Some(f) = plat::fallback_wait(hp, hc, rule.kill_wait) {
                    e.fallback_used = true;
                    empty = f.empty;
                    chain_first = f.chain_at_first_snapshot;
                }
            }
        }
    }
    if empty {
        e.alive_at_proceed = watch.iter().copied().filter(|p| plat::pid_alive(*p)).collect();
        e.proceeded = true;
        for p in watch {
            let state = plat::pid_state(*p);
            let alive = e.alive_at_proceed.contains(p);
            let dead_after = if alive { wait_until(secs(2), || !plat::pid_alive(*p)).map(ms) } else { None };
            e.diag.push(json!({
                "pid": p,
                "stateAtDecision": state,
                "aliveAtDecision": alive,
                "deadMsAfterDecision": dead_after,
                "inFallbackChainAtFirstSnapshot": chain_first.contains(p),
            }));
        }
    } else {
        e.held_reason = Some("predecessor-domain-not-empty".into());
    }
    e.extra_wait_ms = ms(t_lock.elapsed());
    drop(guard);
    Ok(e)
}

fn pct(v: &[f64], p: f64) -> f64 {
    if v.is_empty() {
        return 0.0;
    }
    let mut s = v.to_vec();
    s.sort_by(|a, b| a.total_cmp(b));
    s[(((s.len() - 1) as f64) * p).round() as usize]
}

fn stats(v: &[f64]) -> Value {
    json!({"p50": pct(v, 0.5), "p95": pct(v, 0.95), "max": pct(v, 1.0)})
}

pub fn tests() -> Vec<Def> {
    vec![
        Def {
            name: "git-borrow-blocking-hook-predecessor-check",
            expect: "repeated, job kept by a second owner: the contender kills the predecessor domain at once and never proceeds while git or its hook children are alive (0 violations); extra wait is a few ms, not a drain window",
            timeout_s: 3600,
            f: |c| repeated_check(c, Mode::Supervisor),
        },
        Def {
            name: "git-borrow-blocking-hook-predecessor-check-holder-owned",
            expect: "documents the hazard of the first rule: when only the holder owns the job its name vanishes (open fails = looks empty) while members are still terminating; no fallback is applied; informational, never fails",
            timeout_s: 3600,
            f: |c| repeated_check(c, Mode::HolderOnlyNoFallback),
        },
        Def {
            name: "predecessor-all-owners-dead",
            expect: "full rule (accounting 0 and every listed member signaled, list re-read on every query, also when the count is 0 at open): holder and job keeper both killed while git is blocked in a hook; a job that cannot be opened falls back to the recorded holder's process tree; the contender never proceeds while git or a hook child is alive (0 violations)",
            timeout_s: 3600,
            f: |c| repeated_check(c, Mode::AllOwnersDead),
        },
        Def {
            name: "predecessor-all-owners-dead-list-empty-toolhelp",
            expect: "same as predecessor-all-owners-dead, plus: when the job opens with count 0 and an empty member list, the recorded holder's process tree is also checked before proceeding; a run of both tests shows whether that extra clause is needed (0 violations here, violations in the plain test)",
            timeout_s: 3600,
            f: |c| repeated_check(c, Mode::AllOwnersDeadListEmptyToolhelp),
        },
        Def {
            name: "predecessor-record-stale",
            expect: "a record pointing to an already-destroyed domain lets the contender proceed immediately",
            timeout_s: 60,
            f: record_stale,
        },
        Def {
            name: "predecessor-kill-wait",
            expect: "members that never exit by themselves (the job handle is kept open elsewhere) are killed by the contender at once; it waits only for them to be signaled and proceeds with nothing alive, or returns held; never proceeds with live members",
            timeout_s: 60,
            f: kill_wait,
        },
    ]
}

#[derive(Clone, Copy, PartialEq)]
enum Mode {
    /// The probe holds a second handle to the job: it outlives the holder.
    Supervisor,
    /// Only the holder holds the job; the contender uses the first rule with no fallback.
    HolderOnlyNoFallback,
    /// Holder and a separate job keeper are both killed; the contender must use the process-tree fallback.
    AllOwnersDead,
    /// As `AllOwnersDead`, plus the process-tree check when the job opens with count 0 and an empty list.
    AllOwnersDeadListEmptyToolhelp,
}

impl Mode {
    fn owners_dead(self) -> bool {
        matches!(self, Mode::AllOwnersDead | Mode::AllOwnersDeadListEmptyToolhelp)
    }
}

fn repeated_check(ctx: &Ctx, mode: Mode) -> TestResult {
    // Unix has no job: the lock outlives every orphan, so every mode is the same strict control.
    let supervisor_owned = mode == Mode::Supervisor;
    let strict = mode != Mode::HolderOnlyNoFallback || cfg!(unix);
    if !which("git") {
        return skip("git is not on PATH");
    }
    let repeats = repeats();
    let repo = crate::git::setup_repo(ctx, true)?;
    let lock = ctx.p("lock");
    let record = ctx.p("predecessor.json");
    let mut extra = vec![];
    let mut lock_wait = vec![];
    let (mut violations, mut held, mut terminated, mut opened, mut fallbacks) = (0, 0, 0, 0, 0);
    // Opened-job evidence: what the member list looked like, and whether the extra tree check mattered.
    let (mut open_count_zero, mut open_list_empty, mut open_zero_and_empty, mut git_in_list) = (0, 0, 0, 0);
    let (mut toolhelp_runs, mut toolhelp_live) = (0, 0);
    let mut open_samples: Vec<Value> = vec![];
    let mut events: Vec<Value> = vec![];
    for i in 0..repeats {
        for f in ["holder.ready", "fg.pid", "bg.pid", "predecessor.json"] {
            let _ = std::fs::remove_file(ctx.p(f));
        }
        let sup = if supervisor_owned { Some(plat::Sup::new()?) } else { None };
        let mut keeper = None;
        let keeper_job = if mode.owners_dead() { plat::fresh_domain_name() } else { String::new() };
        if !keeper_job.is_empty() {
            let (name, ready) = (keeper_job.clone(), ctx.s("keeper.ready"));
            let _ = std::fs::remove_file(ctx.p("keeper.ready"));
            keeper = Some(spawn(&mut ctx.role("jobkeeper", &[&name, &ready]))?);
            if wait_until(secs(15), || ctx.p("keeper.ready").exists()).is_none() {
                return Err(format!("repeat {i}: job keeper never became ready"));
            }
        }
        let repo_s = repo.to_string_lossy().into_owned();
        let (lock_s, ready_s) = (ctx.s("lock"), ctx.s("holder.ready"));
        let mut args: Vec<&str> = vec![&lock_s, &ready_s, &repo_s, "block"];
        if let Some(s) = sup.as_ref().filter(|s| !s.name().is_empty()) {
            args.push(s.name());
        }
        if !keeper_job.is_empty() {
            args.push(&keeper_job);
        }
        let mut holder = spawn(&mut ctx.role("githolder", &args))?;
        if wait_until(secs(30), || ctx.p("holder.ready").exists()).is_none() {
            return Err(format!("repeat {i}: holder never became ready"));
        }
        if wait_until(secs(60), || ctx.p("fg.pid").exists()).is_none() {
            return Err(format!("repeat {i}: git never reached the blocking hook"));
        }
        wait_until(secs(5), || ctx.p("bg.pid").exists());
        let ready = std::fs::read_to_string(ctx.p("holder.ready")).unwrap_or_default();
        let named: Vec<(&str, Option<u32>)> = vec![
            ("git", ready.split_whitespace().nth(1).and_then(|s| s.parse().ok())),
            ("hook-foreground", read_pid(&ctx.p("fg.pid"))),
            ("hook-background", read_pid(&ctx.p("bg.pid"))),
        ];
        let watch: Vec<u32> = named.iter().filter_map(|n| n.1).collect();
        let membership: Vec<Value> = named
            .iter()
            .filter_map(|(role, p)| p.map(|p| json!({"role": role, "pid": p, "inSupervisorJobBeforeKill": sup.as_ref().and_then(|s| s.contains(p))})))
            .collect();
        let (l, r, w) = (lock.clone(), record.clone(), watch.clone());
        let rule = Rule { kill_wait: secs(2), fallback: mode != Mode::HolderOnlyNoFallback, toolhelp_on_empty_list: mode == Mode::AllOwnersDeadListEmptyToolhelp };
        let contender: std::thread::JoinHandle<Result<Enter, String>> = std::thread::spawn(move || enter(&l, &r, rule, &w, secs(30)));
        std::thread::sleep(Duration::from_millis(20)); // contender is polling for the lock
        let t_kill = Instant::now();
        // All-owners-dead: the keeper goes first, then the holder; the job closes with the last handle.
        if let Some(k) = keeper.as_mut() {
            let _ = k.kill();
            let _ = k.wait();
        }
        let _ = holder.kill();
        let _ = holder.wait();
        if cfg!(unix) {
            // No job on unix: the orphans keep the lock via the inherited fd until they end.
            std::thread::sleep(Duration::from_millis(100));
            watch.iter().for_each(|p| plat::kill_pid(*p));
        }
        let e = contender.join().map_err(|_| "contender panicked".to_string())??;
        let since_kill_ms = ms(t_kill.elapsed());
        let violated = !e.alive_at_proceed.is_empty();
        if !e.proceeded {
            held += 1;
        }
        if violated {
            violations += 1;
        }
        let git_pid = named[0].1;
        let git_listed = git_pid.is_some_and(|g| e.watch_in_open_list.iter().any(|w| w["pid"] == g && w["inListAtOpen"] == true));
        if e.domain_opened {
            open_count_zero += usize::from(e.open_active == Some(0));
            open_list_empty += usize::from(e.open_list_len == Some(0));
            open_zero_and_empty += usize::from(e.open_active == Some(0) && e.open_list_len == Some(0));
            git_in_list += usize::from(git_listed);
        }
        toolhelp_runs += usize::from(e.toolhelp_checked);
        toolhelp_live += usize::from(e.toolhelp_live_descendants.as_ref().is_some_and(|v| !v.is_empty()));
        let per_event = |ev: &Enter| {
            json!({
                "repeat": i,
                "domainOpenedWhenChecked": ev.domain_opened,
                "activeProcessesAtOpen": ev.open_active,
                "memberListSizeAtOpen": ev.open_list_len,
                "gitPidInListAtOpen": git_listed,
                "watchedPidsInListAtOpen": ev.watch_in_open_list,
                "toolhelpCheckRan": ev.toolhelp_checked,
                "toolhelpFoundLiveDescendants": ev.toolhelp_live_descendants.as_ref().map(|v| !v.is_empty()),
                "toolhelpLiveDescendantPids": ev.toolhelp_live_descendants,
            })
        };
        if e.domain_opened && open_samples.len() < 12 {
            open_samples.push(per_event(&e));
        }
        if (violated || !e.proceeded) && events.len() < 12 {
            let mut ev = per_event(&e);
            ev.as_object_mut().into_iter().for_each(|o| {
                o.insert("violated".into(), json!(violated));
            });
            events.push(json!({
                "open": ev,
                "repeat": i,
                "contenderTerminated": e.terminated,
                "fallbackUsed": e.fallback_used,
                "lockWaitMs": e.lock_wait_ms,
                "extraWaitMs": e.extra_wait_ms,
                "msFromHolderKillToReturn": since_kill_ms,
                "members": membership,
                "stateAtDecision": e.diag,
            }));
        }
        terminated += usize::from(e.terminated);
        opened += usize::from(e.domain_opened);
        fallbacks += usize::from(e.fallback_used);
        extra.push(e.extra_wait_ms);
        lock_wait.push(e.lock_wait_ms);
        drop(sup);
        watch.iter().for_each(|p| plat::kill_pid(*p));
        wait_until(secs(10), || watch.iter().all(|p| !plat::pid_alive(*p)));
    }
    let data = json!({
        "jobOwner": match mode {
            Mode::Supervisor => "second owner (probe holds a handle)",
            Mode::HolderOnlyNoFallback => "holder only, no fallback",
            Mode::AllOwnersDead => "holder and keeper process, both killed, process-tree fallback",
            Mode::AllOwnersDeadListEmptyToolhelp => "holder and keeper process, both killed, process-tree fallback and tree check on count 0 with empty list",
        },
        "repeats": repeats,
        "openedWithActiveCountZero": open_count_zero,
        "openedWithEmptyMemberList": open_list_empty,
        "openedWithCountZeroAndEmptyList": open_zero_and_empty,
        "gitPidInListAtOpen": git_in_list,
        "toolhelpCheckRuns": toolhelp_runs,
        "toolhelpFoundLiveDescendants": toolhelp_live,
        "openedSamples": open_samples,
        "violationsProceededWithLiveProcesses": violations,
        "heldReturned": held,
        "contenderTerminatedDomain": terminated,
        "domainStillOpenWhenChecked": opened,
        "fallbackUsedCount": fallbacks,
        "extraWaitMs": stats(&extra),
        "lockWaitMsFromContenderStart": stats(&lock_wait),
        "killWaitMs": 2000,
        "domainKind": plat::domain_kind(),
        "violationEvents": events,
    });
    if !strict {
        // Hazard documentation: with a holder-owned job the name can vanish before the members are dead.
        let note = format!("holder-only job, no fallback: {violations}/{repeats} repeats proceeded while members were still dying (job name already gone in {} of them)", repeats - opened);
        return pass(&note, data);
    }
    let p95 = pct(&extra, 0.95);
    if violations > 0 {
        fail("contender proceeded while git or a child was still alive", data)
    } else if held > 0 {
        fail("contender returned held (domain never emptied after kill)", data)
    } else if mode.owners_dead() && cfg!(windows) && fallbacks == 0 && toolhelp_runs == 0 {
        fail("the process-tree fallback was never exercised (the job stayed openable)", data)
    } else if p95 > 500.0 {
        fail("extra wait p95 above 500 ms: the domain is not being killed at once", data)
    } else {
        pass("0 violations: contender proceeded only after the predecessor domain was empty", data)
    }
}

fn contender_run(ctx: &Ctx, id: &str, rule: Rule, watch: &[u32]) -> Result<Enter, String> {
    write_predecessor_record(&ctx.p("lock"), plat::domain_kind(), id, None);
    enter(&ctx.p("lock"), &ctx.p("predecessor.json"), rule, watch, secs(5))
}

fn record_stale(ctx: &Ctx) -> TestResult {
    let mut extra = vec![];
    let mut bad = 0;
    for _ in 0..20 {
        let id = plat::make_stale_domain(ctx)?;
        let e = contender_run(ctx, &id, Rule { kill_wait: secs(2), fallback: true, toolhelp_on_empty_list: false }, &[])?;
        if !e.proceeded || e.domain_opened || e.terminated {
            bad += 1;
        }
        extra.push(e.extra_wait_ms);
    }
    let data = json!({"repeats": 20, "unexpectedOutcomes": bad, "extraWaitMs": stats(&extra), "domainKind": plat::domain_kind()});
    if bad == 0 {
        pass("stale record: contender proceeded immediately", data)
    } else {
        fail("stale record was not treated as an empty domain", data)
    }
}

fn kill_wait(ctx: &Ctx) -> TestResult {
    let (id, pids, _keep) = plat::make_stubborn_domain(ctx)?;
    if wait_until(secs(10), || pids.iter().all(|p| plat::pid_alive(*p))).is_none() {
        return Err("stubborn member did not start".into());
    }
    let e = contender_run(ctx, &id, Rule { kill_wait: secs(2), fallback: true, toolhelp_on_empty_list: false }, &pids)?;
    let dead = wait_until(secs(5), || pids.iter().all(|p| !plat::pid_alive(*p))).is_some();
    let data = json!({
        "killWaitMs": 2000,
        "proceeded": e.proceeded,
        "heldReason": e.held_reason,
        "contenderTerminatedDomain": e.terminated,
        "extraWaitMs": e.extra_wait_ms,
        "aliveAtProceed": e.alive_at_proceed,
        "stateAtDecision": e.diag,
        "membersDeadAfterwards": dead,
        "domainKind": plat::domain_kind(),
    });
    if e.proceeded && !e.alive_at_proceed.is_empty() {
        return fail("contender proceeded with live members", data);
    }
    if e.proceeded && !e.terminated {
        return fail("contender proceeded without killing the members", data);
    }
    if e.proceeded && e.extra_wait_ms > 500.0 {
        return fail("kill was not immediate: the contender waited like a drain window", data);
    }
    if !e.proceeded && e.held_reason.is_none() {
        return fail("contender neither proceeded nor named the hold", data);
    }
    pass(
        if e.proceeded { "contender killed the members at once and proceeded with nothing alive" } else { "contender returned named held" },
        data,
    )
}
