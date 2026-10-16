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
    pub alive_at_proceed: Vec<u32>,
}

/// Takes the lock (polling), applies the predecessor rule, and reports which watched
/// processes were still alive at the moment it decided to proceed.
pub fn enter(lock: &Path, record: &Path, drain: Duration, watch: &[u32], wait_lock: Duration) -> Result<Enter, String> {
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
        alive_at_proceed: vec![],
    };
    let rec: Option<Value> = std::fs::read_to_string(record).ok().and_then(|s| serde_json::from_str(&s).ok());
    let id = rec.as_ref().and_then(|r| r["domainId"].as_str()).map(String::from);
    e.record_found = id.is_some();
    let mut empty = true;
    if let Some(id) = id {
        if let Some(dom) = plat::domain_open(&id) {
            e.domain_opened = true;
            let drained = |d: &plat::Dom| wait_until(drain, || plat::domain_active(d) == Some(0)).is_some();
            empty = drained(&dom);
            if !empty {
                plat::domain_kill(&dom);
                e.terminated = true;
                empty = drained(&dom);
            }
        }
    }
    if empty {
        e.alive_at_proceed = watch.iter().copied().filter(|p| plat::pid_alive(*p)).collect();
        e.proceeded = true;
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
            expect: "50 repeats: a contender that applies the predecessor rule never proceeds while git or its hook children are alive (0 violations); extra wait is small",
            timeout_s: 420,
            f: repeated_check,
        },
        Def {
            name: "predecessor-record-stale",
            expect: "a record pointing to an already-destroyed domain lets the contender proceed immediately",
            timeout_s: 60,
            f: record_stale,
        },
        Def {
            name: "predecessor-drain-timeout",
            expect: "members that do not die within the drain window are terminated by the contender, which then proceeds with nothing alive (or returns held); it never proceeds with live members",
            timeout_s: 60,
            f: drain_timeout,
        },
    ]
}

fn repeated_check(ctx: &Ctx) -> TestResult {
    if !which("git") {
        return skip("git is not on PATH");
    }
    const REPEATS: usize = 50;
    let repo = crate::git::setup_repo(ctx, true)?;
    let lock = ctx.p("lock");
    let record = ctx.p("predecessor.json");
    let mut extra = vec![];
    let mut lock_wait = vec![];
    let (mut violations, mut held, mut terminated, mut opened) = (0, 0, 0, 0);
    for i in 0..REPEATS {
        for f in ["holder.ready", "fg.pid", "bg.pid", "predecessor.json"] {
            let _ = std::fs::remove_file(ctx.p(f));
        }
        let mut holder = spawn(&mut ctx.role("githolder", &[&ctx.s("lock"), &ctx.s("holder.ready"), &repo.to_string_lossy(), "block"]))?;
        if wait_until(secs(30), || ctx.p("holder.ready").exists()).is_none() {
            return Err(format!("repeat {i}: holder never became ready"));
        }
        if wait_until(secs(60), || ctx.p("fg.pid").exists()).is_none() {
            return Err(format!("repeat {i}: git never reached the blocking hook"));
        }
        wait_until(secs(5), || ctx.p("bg.pid").exists());
        let ready = std::fs::read_to_string(ctx.p("holder.ready")).unwrap_or_default();
        let git_pid: Option<u32> = ready.split_whitespace().nth(1).and_then(|s| s.parse().ok());
        let watch: Vec<u32> = [git_pid, read_pid(&ctx.p("fg.pid")), read_pid(&ctx.p("bg.pid"))].into_iter().flatten().collect();
        let (l, r, w) = (lock.clone(), record.clone(), watch.clone());
        let contender: std::thread::JoinHandle<Result<Enter, String>> = std::thread::spawn(move || enter(&l, &r, secs(2), &w, secs(30)));
        std::thread::sleep(Duration::from_millis(20)); // contender is polling for the lock
        let _ = holder.kill();
        let _ = holder.wait();
        if cfg!(unix) {
            // No job on unix: the orphans keep the lock via the inherited fd until they end.
            std::thread::sleep(Duration::from_millis(100));
            watch.iter().for_each(|p| plat::kill_pid(*p));
        }
        let e = contender.join().map_err(|_| "contender panicked".to_string())??;
        if !e.proceeded {
            held += 1;
        }
        if !e.alive_at_proceed.is_empty() {
            violations += 1;
        }
        terminated += usize::from(e.terminated);
        opened += usize::from(e.domain_opened);
        extra.push(e.extra_wait_ms);
        lock_wait.push(e.lock_wait_ms);
        watch.iter().for_each(|p| plat::kill_pid(*p));
        wait_until(secs(10), || watch.iter().all(|p| !plat::pid_alive(*p)));
    }
    let data = json!({
        "repeats": REPEATS,
        "violationsProceededWithLiveProcesses": violations,
        "heldReturned": held,
        "contenderTerminatedDomain": terminated,
        "domainStillOpenWhenChecked": opened,
        "extraWaitMs": stats(&extra),
        "lockWaitMsFromContenderStart": stats(&lock_wait),
        "drainMs": 2000,
        "domainKind": plat::domain_kind(),
    });
    if violations > 0 {
        fail("contender proceeded while git or a child was still alive", data)
    } else if held > 0 {
        fail("contender returned held (domain never drained even after terminate)", data)
    } else {
        pass("0 violations: contender proceeded only after the predecessor domain was empty", data)
    }
}

fn contender_run(ctx: &Ctx, id: &str, drain: Duration, watch: &[u32]) -> Result<Enter, String> {
    write_predecessor_record(&ctx.p("lock"), plat::domain_kind(), id);
    enter(&ctx.p("lock"), &ctx.p("predecessor.json"), drain, watch, secs(5))
}

fn record_stale(ctx: &Ctx) -> TestResult {
    let mut extra = vec![];
    let mut bad = 0;
    for _ in 0..20 {
        let id = plat::make_stale_domain(ctx)?;
        let e = contender_run(ctx, &id, secs(2), &[])?;
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

fn drain_timeout(ctx: &Ctx) -> TestResult {
    let (id, pids, _keep) = plat::make_stubborn_domain(ctx)?;
    if wait_until(secs(10), || pids.iter().all(|p| plat::pid_alive(*p))).is_none() {
        return Err("stubborn member did not start".into());
    }
    let drain = Duration::from_millis(300);
    let e = contender_run(ctx, &id, drain, &pids)?;
    let dead = wait_until(secs(5), || pids.iter().all(|p| !plat::pid_alive(*p))).is_some();
    let data = json!({
        "drainMs": 300,
        "proceeded": e.proceeded,
        "heldReason": e.held_reason,
        "contenderTerminatedDomain": e.terminated,
        "extraWaitMs": e.extra_wait_ms,
        "aliveAtProceed": e.alive_at_proceed,
        "membersDeadAfterwards": dead,
        "domainKind": plat::domain_kind(),
    });
    if e.proceeded && !e.alive_at_proceed.is_empty() {
        return fail("contender proceeded with live members", data);
    }
    if e.proceeded && !(e.terminated && e.extra_wait_ms >= 300.0) {
        return fail("contender proceeded without waiting the drain window and terminating", data);
    }
    if !e.proceeded && e.held_reason.is_none() {
        return fail("contender neither proceeded nor named the hold", data);
    }
    pass(
        if e.proceeded { "drain expired, contender terminated the members and proceeded with nothing alive" } else { "contender returned named held" },
        data,
    )
}
