//! Stress: 8 processes × 40 rounds on one lock, 10 holders SIGKILLed inside
//! the critical section. Every worker checks on entry that no live process
//! is inside; 0 violations and every worker finishing is the bar.
#![cfg(target_os = "linux")]

mod common;

use std::fs;
use std::time::{Duration, Instant};

use common::*;

#[test]
fn child_entry() {
    common::child_entry()
}

const WORKERS: usize = 8;
const ROUNDS: &str = "40";
const KILLS: usize = 10;

#[test]
fn eight_processes_with_sigkills_never_overlap_and_never_stick() {
    let dir = temp_dir("stress");
    let res = resource(&dir, "stress");
    let marker = res.path.with_extension("marker");
    let violations = res.path.with_extension("violations");
    let killed = res.path.with_extension("killed");
    let mut spawned = 0usize;
    let mut spawn = |dir: &std::path::Path| -> Guard {
        spawned += 1;
        let ready = dir.join(format!("ready-{spawned}"));
        let mut child = spawn_role("stress", &res.path, &ready, ROUNDS);
        wait_ready(&ready, &mut child);
        child
    };
    let mut workers: Vec<Guard> = (0..WORKERS).map(|_| spawn(&dir)).collect();
    let mut kills = 0usize;
    let started = Instant::now();
    let deadline = started + Duration::from_secs(120);
    // Kill holders found inside the critical section, replacing each victim
    // so eight workers keep competing.
    while kills < KILLS && Instant::now() < deadline {
        if let Ok(text) = fs::read_to_string(&marker) {
            if let Ok(pid) = text.trim().parse::<u32>() {
                if let Some(pos) = workers.iter().position(|w| w.id() == pid) {
                    let mut victim = workers.swap_remove(pos);
                    {
                        use std::io::Write;
                        let mut f = fs::OpenOptions::new().create(true).append(true).open(&killed).unwrap();
                        writeln!(f, "{pid}").unwrap();
                    }
                    kill_and_reap(&mut victim);
                    kills += 1;
                    workers.push(spawn(&dir));
                }
            }
        }
        std::thread::sleep(Duration::from_micros(300));
    }
    assert_eq!(kills, KILLS, "could not catch {KILLS} holders inside the critical section");
    for mut w in workers {
        loop {
            if let Some(status) = w.try_wait().unwrap() {
                assert!(status.success(), "worker failed: {status}");
                break;
            }
            assert!(Instant::now() < deadline, "a worker is stuck");
            std::thread::sleep(Duration::from_millis(10));
        }
    }
    let found = fs::read_to_string(&violations).unwrap_or_default();
    assert!(found.is_empty(), "mutual exclusion violated:\n{found}");
    println!("stress: {WORKERS} workers x {ROUNDS} rounds, {KILLS} holders SIGKILLed in the critical section, 0 violations, {:.2} s", started.elapsed().as_secs_f64());
    let _ = fs::remove_dir_all(&dir);
}
