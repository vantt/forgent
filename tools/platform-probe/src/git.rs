//! git run inside the lock holder: the holder takes the lock, spawns `git commit`
//! (inside its own job on Windows, with the lock fd inherited on unix), the holder
//! is killed mid-run, and we watch whether the lock is ever free while git or its
//! children still run.

use crate::plat;
use crate::util::*;
use serde_json::json;
use std::io::Write;
use std::path::Path;
use std::process::{Command, Stdio};
use std::time::{Duration, Instant};

pub fn tests() -> Vec<Def> {
    vec![
        Def {
            name: "git-borrow-blocking-hook",
            expect: "kill the holder while git is blocked in a hook: lock is never observed free while git or its hook children are alive (windows: they all die with the job; unix: lock stays held through the inherited fd)",
            timeout_s: 180,
            f: |c| scenario(c, true),
        },
        Def {
            name: "git-borrow-auto-gc",
            expect: "same invariant with gc.auto=1 and loose objects, killing the holder as soon as git returns while a detached gc and a background hook child may still run",
            timeout_s: 180,
            f: |c| scenario(c, false),
        },
    ]
}

fn git(repo: &Path, args: &[&str]) -> bool {
    let mut c = Command::new("git");
    c.arg("-C").arg(repo).args(args);
    matches!(run_capture(c, secs(60)), Some((true, _)))
}

fn loose_in_17(repo: &Path) -> usize {
    std::fs::read_dir(repo.join(".git").join("objects").join("17")).map(|r| r.count()).unwrap_or(0)
}

fn setup_repo(ctx: &Ctx, block: bool) -> Result<std::path::PathBuf, String> {
    let repo = ctx.p("repo");
    let mut c = Command::new("git");
    c.arg("init").arg("-q").arg(&repo);
    if !matches!(run_capture(c, secs(60)), Some((true, _))) {
        return Err("git init failed".into());
    }
    for kv in [("gc.auto", "1"), ("user.name", "probe"), ("user.email", "probe@example.invalid"), ("commit.gpgsign", "false")] {
        if !git(&repo, &["config", kv.0, kv.1]) {
            return Err(format!("git config {} failed", kv.0));
        }
    }
    // Hooks run through sh on every OS; use forward slashes so Git for Windows' sh accepts the paths.
    let exe = ctx.exe.to_string_lossy().replace('\\', "/");
    let bg = ctx.s("bg.pid").replace('\\', "/");
    let fg = ctx.s("fg.pid").replace('\\', "/");
    let mut hook = format!("#!/bin/sh\n\"{exe}\" --role sleeper \"{bg}\" &\n");
    if block {
        hook.push_str(&format!("\"{exe}\" --role sleeper \"{fg}\"\n"));
    }
    let hook_path = repo.join(".git").join("hooks").join("post-commit");
    std::fs::write(&hook_path, hook).map_err(|e| format!("write hook: {e}"))?;
    plat::make_executable(&hook_path);

    // Loose objects: gc.auto=1 triggers when more than one loose object sits in objects/17.
    let blobs = ctx.p("blobs");
    std::fs::create_dir_all(&blobs).map_err(|e| e.to_string())?;
    let mut n = 0usize;
    while n < 6000 {
        let mut list = String::new();
        for _ in 0..1500 {
            let p = blobs.join(format!("b{n}"));
            std::fs::write(&p, format!("probe blob {n}\n")).map_err(|e| e.to_string())?;
            list.push_str(&p.to_string_lossy());
            list.push('\n');
            n += 1;
        }
        let mut child = Command::new("git")
            .arg("-C")
            .arg(&repo)
            .args(["hash-object", "-w", "--stdin-paths"])
            .stdin(Stdio::piped())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .map_err(|e| format!("hash-object: {e}"))?;
        child.stdin.take().ok_or("stdin")?.write_all(list.as_bytes()).map_err(|e| e.to_string())?;
        child.wait().map_err(|e| e.to_string())?;
        if loose_in_17(&repo) >= 3 {
            break;
        }
    }
    if loose_in_17(&repo) < 2 {
        return Err("could not create enough loose objects to trigger auto gc".into());
    }
    Ok(repo)
}

fn scenario(ctx: &Ctx, block: bool) -> TestResult {
    if !which("git") {
        return skip("git is not on PATH");
    }
    let repo = setup_repo(ctx, block)?;
    let loose_before = loose_in_17(&repo);
    let lock = ctx.s("lock");
    let ready = ctx.s("holder.ready");
    let mode = if block { "block" } else { "noblock" };
    let mut holder = spawn(&mut ctx.role("githolder", &[&lock, &ready, &repo.to_string_lossy(), mode]))?;
    let holder_pid = holder.id();
    if wait_until(secs(30), || ctx.p("holder.ready").exists()).is_none() {
        return Err("holder never became ready".into());
    }
    let ready_text = std::fs::read_to_string(ctx.p("holder.ready")).unwrap_or_default();
    let git_pid: Option<u32> = ready_text.split_whitespace().nth(1).and_then(|s| s.parse().ok());
    let job_note = ready_text.split_whitespace().nth(2).unwrap_or("").to_string();
    let trigger = if block { "fg.pid" } else { "git.done" };
    if wait_until(secs(90), || ctx.p(trigger).exists()).is_none() {
        return Err(format!("git did not reach the expected state ({trigger} missing)"));
    }
    wait_until(secs(5), || ctx.p("bg.pid").exists());
    let held_before = !plat::lock_free(&ctx.p("lock"));
    let fg = read_pid(&ctx.p("fg.pid"));
    let bg = read_pid(&ctx.p("bg.pid"));

    let t_kill = Instant::now();
    let _ = holder.kill();
    let _ = holder.wait();
    let kill_ms = ms(t_kill.elapsed());

    let observe = if cfg!(windows) { secs(15) } else { secs(2) };
    let mut violations = 0u32;
    let mut samples = 0u32;
    let mut gc_pid: Option<u32> = None;
    let mut gc_seen_running = false;
    let mut all_dead_ms: Option<f64> = None;
    let mut first_free_ms: Option<f64> = None;
    let t0 = Instant::now();
    while t0.elapsed() < observe {
        if gc_pid.is_none() {
            gc_pid = read_pid(&repo.join(".git").join("gc.pid"));
        }
        let watch: Vec<u32> = [git_pid, fg, bg, gc_pid].into_iter().flatten().collect();
        let alive: Vec<u32> = watch.iter().copied().filter(|p| plat::pid_alive(*p)).collect();
        if gc_pid.is_some_and(|g| alive.contains(&g)) {
            gc_seen_running = true;
        }
        let free = plat::lock_free(&ctx.p("lock"));
        samples += 1;
        if free && !alive.is_empty() {
            violations += 1;
        }
        if free && first_free_ms.is_none() {
            first_free_ms = Some(ms(t0.elapsed()));
        }
        if alive.is_empty() {
            all_dead_ms = Some(ms(t0.elapsed()));
            break;
        }
        std::thread::sleep(Duration::from_millis(3));
    }
    let watch: Vec<u32> = [git_pid, fg, bg, gc_pid].into_iter().flatten().collect();
    let orphans: Vec<u32> = watch.iter().copied().filter(|p| plat::pid_alive(*p)).collect();
    let orphans_survived = !orphans.is_empty();
    let lock_free_after_observe = plat::lock_free(&ctx.p("lock"));
    // Unix has no job: orphans are expected to live on; end them and time the lock release.
    let mut release_after_orphan_kill_ms: Option<f64> = None;
    if orphans_survived {
        let t = Instant::now();
        for p in &orphans {
            plat::kill_pid(*p);
        }
        release_after_orphan_kill_ms = wait_until(secs(10), || plat::lock_free(&ctx.p("lock"))).map(|_| ms(t.elapsed()));
    }
    let data = json!({
        "mode": mode,
        "holderPid": holder_pid,
        "gitPid": git_pid,
        "holderMechanism": job_note,
        "hookForegroundPid": fg,
        "hookBackgroundPid": bg,
        "autoGcPid": gc_pid,
        "autoGcObservedRunning": gc_seen_running,
        "looseObjectsInDir17": loose_before,
        "lockHeldBeforeKill": held_before,
        "holderKillMs": kill_ms,
        "samples": samples,
        "lockFreeWhileGitOrChildAliveViolations": violations,
        "allWatchedProcessesDeadMs": all_dead_ms,
        "firstLockFreeObservedMs": first_free_ms,
        "orphansSurvivedHolderDeath": orphans_survived,
        "orphanPids": orphans,
        "lockFreeAfterObserve": lock_free_after_observe,
        "lockReleasedMsAfterOrphansKilled": release_after_orphan_kill_ms,
    });
    if !held_before {
        return fail("lock was not held while git ran", data);
    }
    if violations > 0 {
        return fail("lock observed free while git or a child was still alive", data);
    }
    if cfg!(windows) && orphans_survived {
        return fail("processes survived the holder's death: the job did not contain them", data);
    }
    pass("lock never free while git or its children were alive", data)
}
