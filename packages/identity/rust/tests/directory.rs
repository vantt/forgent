//! The local directory: registration, resolve by handle and by role, list,
//! pruning, the cap, handle and role contention, and which process an
//! entry's liveness is judged by. The OS is replaced by an injected judge and
//! a fake process tree; the wiring over the real verb is one test in the
//! host's CLI tests.

use fgos_identity::directory::{self, Entry, MAX_ENTRIES};
use fgos_identity::refusal::{Candidate, Liveness};
use fgos_identity::{ProcStat, ProcessTree};
use fgos_process::facts::{Record, Verdict};
use fgos_process::ProcId;
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Barrier};

static NEXT: AtomicU64 = AtomicU64::new(0);

fn state_root() -> PathBuf {
    let dir = std::env::temp_dir().join(format!(
        "fgos-identity-directory-{}-{}",
        std::process::id(),
        NEXT.fetch_add(1, Ordering::Relaxed)
    ));
    fs::create_dir_all(&dir).unwrap();
    dir
}

fn head(pid: u32) -> Record {
    Record {
        pid: Some(ProcId(pid)),
        start_time: Some("100".into()),
        ..Record::default()
    }
}

/// Every head pid is alive except the ones named.
fn judge(dead: &'static [u32]) -> impl Fn(&Record) -> Verdict + Sync {
    move |record| match record.pid {
        Some(pid) if dead.contains(&pid.0) => Verdict::Dead,
        Some(_) => Verdict::Alive,
        None => Verdict::Unknown,
    }
}

fn entry(name: &str, pid: Option<u32>, roles: &[&str]) -> Entry {
    Entry::new(
        format!("fg-abc234/{name}"),
        format!("claude-{name}@fg"),
        "claude".into(),
        None,
        Some("/work/app".into()),
        roles.iter().map(|role| role.to_string()).collect(),
        pid.map(head),
    )
}

fn files(root: &Path) -> usize {
    fs::read_dir(directory::directory(root)).map_or(0, |dir| dir.count())
}

#[test]
fn two_sessions_resolve_by_handle_and_by_role() {
    let root = state_root();
    let alive = judge(&[]);
    directory::register(&root, entry("aaaa", Some(10), &["lead:MAIL"]), false, &alive).unwrap();
    directory::register(&root, entry("bbbb", Some(20), &["lead:IDENT"]), false, &alive).unwrap();

    let by_handle = directory::resolve(&root, "claude-aaaa@fg", &alive).unwrap();
    assert_eq!(by_handle.id, "fg-abc234/aaaa");
    assert_eq!(by_handle.liveness, Liveness::Alive);
    assert_eq!(directory::resolve(&root, "lead:IDENT", &alive).unwrap().handle, "claude-bbbb@fg");
    assert_eq!(directory::list(&root, None, false, &alive).unwrap().sessions.len(), 2);
}

#[test]
fn unknown_names_are_not_found_with_the_close_candidates() {
    let root = state_root();
    let alive = judge(&[]);
    directory::register(&root, entry("aaaa", Some(10), &["lead:MAIL"]), false, &alive).unwrap();

    let by_handle = directory::resolve(&root, "claude-aaa", &alive).unwrap_err();
    assert_eq!(by_handle.reason, "not-found");
    assert!(by_handle.detail.contains("claude-aaaa@fg"), "{}", by_handle.detail);
    assert_eq!(
        by_handle.candidates,
        [Candidate { id: "fg-abc234/aaaa".into(), handle: "claude-aaaa@fg".into(), liveness: Liveness::Alive }]
    );
    let by_role = directory::resolve(&root, "lead:MA", &alive).unwrap_err();
    assert_eq!(by_role.reason, "not-found");
    assert!(by_role.detail.contains("lead:MAIL"), "{}", by_role.detail);
    assert_eq!(by_role.candidates.iter().map(|c| c.handle.as_str()).collect::<Vec<_>>(), ["claude-aaaa@fg"]);
    assert_eq!(directory::resolve(&root, "", &alive).unwrap_err().reason, "not-found");
}

#[test]
fn a_role_held_twice_is_ambiguous_and_lists_both() {
    let root = state_root();
    let alive = judge(&[]);
    directory::register(&root, entry("aaaa", Some(10), &["lead:MAIL"]), false, &alive).unwrap();
    directory::register(&root, entry("bbbb", Some(20), &[]), false, &alive).unwrap();
    // Two concurrent takes can leave a role on two entries; plant that state.
    for file in fs::read_dir(directory::directory(&root)).unwrap() {
        let path = file.unwrap().path();
        let mut value: serde_json::Value = serde_json::from_slice(&fs::read(&path).unwrap()).unwrap();
        value["roles"] = serde_json::json!(["lead:MAIL"]);
        fs::write(&path, serde_json::to_vec(&value).unwrap()).unwrap();
    }
    let refusal = directory::resolve(&root, "lead:MAIL", &alive).unwrap_err();
    assert_eq!(refusal.reason, "ambiguous");
    assert!(refusal.detail.contains("claude-aaaa@fg") && refusal.detail.contains("claude-bbbb@fg"));
    assert_eq!(refusal.candidates.len(), 2);
    let mut ids: Vec<&str> = refusal.candidates.iter().map(|c| c.id.as_str()).collect();
    ids.sort();
    assert_eq!(ids, ["fg-abc234/aaaa", "fg-abc234/bbbb"]);
}

#[test]
fn a_dead_session_is_never_resolved_and_the_next_write_removes_it() {
    let root = state_root();
    directory::register(&root, entry("aaaa", Some(10), &["lead:MAIL"]), false, &judge(&[])).unwrap();
    let after_death = judge(&[10]);

    assert_eq!(directory::resolve(&root, "claude-aaaa@fg", &after_death).unwrap_err().reason, "not-found");
    assert!(directory::list(&root, None, false, &after_death).unwrap().sessions.is_empty());
    assert_eq!(files(&root), 1, "a read never removes");

    directory::register(&root, entry("bbbb", Some(20), &[]), false, &after_death).unwrap();
    assert_eq!(files(&root), 2, "a write that takes no role and is below the cap scans nothing, so it prunes nothing");
    // A write that takes a role scans, removes the dead entry and finds its role free.
    directory::register(&root, entry("bbbb", Some(20), &["lead:MAIL"]), false, &after_death).unwrap();
    assert_eq!(files(&root), 1, "the role write removed the dead entry");
}

#[test]
fn a_session_without_a_terminal_ancestor_is_unknown_and_prune_never_removes_it() {
    let root = state_root();
    let alive = judge(&[]);
    directory::register(&root, entry("aaaa", None, &[]), false, &alive).unwrap();
    directory::register(&root, entry("bbbb", Some(20), &[]), false, &alive).unwrap();

    let before = directory::list(&root, None, false, &alive).unwrap();
    assert_eq!(before.sessions.iter().map(|s| s.liveness).collect::<Vec<_>>(), [Liveness::Unknown, Liveness::Alive]);
    assert_eq!(directory::resolve(&root, "claude-aaaa@fg", &alive).unwrap().liveness, Liveness::Unknown);

    let nothing_dead = directory::list(&root, None, true, &alive).unwrap();
    assert_eq!(nothing_dead.pruned, 0, "unknown may be a live headless agent");
    assert_eq!(nothing_dead.sessions.len(), 2);

    let one_dead = directory::list(&root, None, true, &judge(&[20])).unwrap();
    assert_eq!(one_dead.pruned, 1);
    assert_eq!(one_dead.sessions.iter().map(|s| s.handle.as_str()).collect::<Vec<_>>(), ["claude-aaaa@fg"]);
    assert_eq!(files(&root), 1);
}

#[test]
fn list_by_project_keeps_only_that_projects_sessions() {
    let root = state_root();
    let alive = judge(&[]);
    let mut mine = entry("aaaa", Some(10), &[]);
    mine.project_id = Some("a".repeat(32));
    directory::register(&root, mine, false, &alive).unwrap();
    directory::register(&root, entry("bbbb", Some(20), &[]), false, &alive).unwrap();

    let listed = directory::list(&root, Some(&"a".repeat(32)), false, &alive).unwrap();
    assert_eq!(listed.sessions.len(), 1);
    assert_eq!(listed.sessions[0].handle, "claude-aaaa@fg");
}

#[test]
fn a_role_held_by_a_live_session_is_refused_unless_taken() {
    let root = state_root();
    let alive = judge(&[]);
    directory::register(&root, entry("aaaa", Some(10), &["lead:MAIL"]), false, &alive).unwrap();

    let refused = directory::register(&root, entry("bbbb", Some(20), &["lead:MAIL"]), false, &alive).unwrap_err();
    assert_eq!(refused.reason, "role-held");
    assert!(refused.detail.contains("claude-aaaa@fg") && refused.detail.contains("--take"));
    assert_eq!(directory::resolve(&root, "lead:MAIL", &alive).unwrap().handle, "claude-aaaa@fg");

    directory::register(&root, entry("bbbb", Some(20), &["lead:MAIL"]), true, &alive).unwrap();
    assert_eq!(directory::resolve(&root, "lead:MAIL", &alive).unwrap().handle, "claude-bbbb@fg");
    let former = directory::resolve(&root, "claude-aaaa@fg", &alive).unwrap();
    assert!(former.roles.is_empty(), "the role moved, it was not copied");
}

#[test]
fn a_session_drops_only_its_own_role_and_it_then_resolves_not_found() {
    let root = state_root();
    let alive = judge(&[]);
    directory::register(&root, entry("aaaa", Some(10), &["lead:MAIL", "lead:IDENT"]), false, &alive).unwrap();
    directory::register(&root, entry("bbbb", Some(20), &["lead:HARDEN"]), false, &alive).unwrap();

    let after = directory::drop_role(&root, "fg-abc234/aaaa", "lead:MAIL", &alive).unwrap();
    assert_eq!(after.roles, ["lead:IDENT"]);
    assert_eq!(directory::resolve(&root, "lead:MAIL", &alive).unwrap_err().reason, "not-found");
    assert_eq!(directory::resolve(&root, "lead:IDENT", &alive).unwrap().handle, "claude-aaaa@fg");

    let not_held = directory::drop_role(&root, "fg-abc234/aaaa", "lead:MAIL", &alive).unwrap_err();
    assert_eq!(not_held.reason, "role-not-held");
    assert!(not_held.candidates.is_empty(), "nobody holds lead:MAIL now");
    // Another live session's role is out of reach: the caller names only itself.
    let foreign = directory::drop_role(&root, "fg-abc234/aaaa", "lead:HARDEN", &alive).unwrap_err();
    assert_eq!(foreign.reason, "role-not-held");
    assert_eq!(foreign.candidates.iter().map(|c| c.handle.as_str()).collect::<Vec<_>>(), ["claude-bbbb@fg"], "the holder is named");
    assert_eq!(directory::resolve(&root, "lead:HARDEN", &alive).unwrap().handle, "claude-bbbb@fg");
    assert_eq!(directory::drop_role(&root, "fg-abc234/cccc", "lead:MAIL", &alive).unwrap_err().reason, "not-registered");
    assert_eq!(directory::drop_role(&root, "fg-abc234/aaaa", "MAIL", &alive).unwrap_err().reason, "invalid-role");
}

#[test]
fn a_role_must_be_lead_and_a_lane_id() {
    let root = state_root();
    let alive = judge(&[]);
    for bad in ["lead:mail", "lead:", "boss:MAIL", "MAIL", "lead:1A", "lead:ABCDEFGHIJKLMNOPQ"] {
        let refused = directory::register(&root, entry("aaaa", Some(10), &[bad]), false, &alive).unwrap_err();
        assert_eq!(refused.reason, "invalid-role", "{bad}");
    }
    assert_eq!(files(&root), 0);
    assert!(directory::role_problem("lead:T1-P6").is_none());
}

#[test]
fn registering_again_refreshes_the_entry_and_keeps_its_roles_and_first_time() {
    let root = state_root();
    let alive = judge(&[]);
    let first = directory::register(&root, entry("aaaa", Some(10), &["lead:MAIL"]), false, &alive).unwrap();
    let again = directory::register(&root, entry("aaaa", Some(11), &["lead:IDENT"]), false, &alive).unwrap();

    assert_eq!(again.roles, ["lead:IDENT", "lead:MAIL"]);
    assert_eq!(again.registered_at, first.registered_at);
    assert_eq!(files(&root), 1);
}

#[test]
fn a_second_live_session_with_the_same_handle_is_refused_with_both_ids() {
    let root = state_root();
    let alive = judge(&[]);
    directory::register(&root, entry("aaaa", Some(10), &[]), false, &alive).unwrap();
    let mut clash = entry("aaaa", Some(20), &[]);
    clash.id = "fg-abc234/other".into();

    let refused = directory::register(&root, clash.clone(), false, &alive).unwrap_err();
    assert_eq!(refused.reason, "handle-in-use");
    assert!(refused.detail.contains("fg-abc234/aaaa") && refused.detail.contains("fg-abc234/other"));
    // Once the first one is dead the handle is free: the dead entry is replaced, not left beside it.
    let taken = directory::register(&root, clash, false, &judge(&[10])).unwrap();
    assert_eq!(taken.id, "fg-abc234/other");
    assert_eq!(files(&root), 1);
    assert_eq!(directory::resolve(&root, "claude-aaaa@fg", &judge(&[10])).unwrap().id, "fg-abc234/other");
}

#[test]
fn racing_registrations_of_one_handle_let_exactly_one_session_in() {
    let root = state_root();
    let barrier = Arc::new(Barrier::new(8));
    let alive = judge(&[]);
    let results: Vec<bool> = std::thread::scope(|scope| {
        let threads: Vec<_> = (0..8)
            .map(|n| {
                let (root, barrier, alive) = (&root, barrier.clone(), &alive);
                scope.spawn(move || {
                    let mut contender = entry("aaaa", Some(10 + n), &[]);
                    contender.id = format!("fg-abc234/racer-{n}");
                    barrier.wait();
                    directory::register(root, contender, false, alive).is_ok()
                })
            })
            .collect();
        threads.into_iter().map(|t| t.join().unwrap()).collect()
    });
    assert_eq!(results.iter().filter(|won| **won).count(), 1);
    assert_eq!(files(&root), 1);
}

#[test]
fn a_full_directory_refuses_a_new_entry_and_prune_is_the_way_out() {
    let root = state_root();
    let alive = judge(&[]);
    for n in 0..MAX_ENTRIES {
        directory::register(&root, entry(&format!("s{n}"), Some(1_000 + n as u32), &[]), false, &alive).unwrap();
    }
    let refused = directory::register(&root, entry("extra", Some(1), &[]), false, &alive).unwrap_err();
    assert_eq!(refused.reason, "directory-full");
    assert!(refused.detail.contains("list --prune"));
    // A session already in the directory still refreshes.
    directory::register(&root, entry("s0", Some(1_000), &[]), false, &alive).unwrap();

    // At the cap a write removes the dead entries first, so a new session fits.
    let one_dead = judge(&[1_005]);
    directory::register(&root, entry("extra", Some(1), &[]), false, &one_dead).unwrap();
    assert_eq!(files(&root), MAX_ENTRIES, "one dead entry went, one session came");
    assert!(!directory::list(&root, None, false, &one_dead).unwrap().sessions.iter().any(|s| s.handle == "claude-s5@fg"));

    // Every head dies: prune empties the directory and a new session fits.
    let all_dead = |_: &Record| Verdict::Dead;
    assert_eq!(directory::list(&root, None, true, &all_dead).unwrap().pruned, MAX_ENTRIES);
    directory::register(&root, entry("extra", Some(1), &[]), false, &alive).unwrap();
}

#[test]
fn a_full_directory_of_entries_that_may_be_alive_is_never_pruned_by_a_write() {
    let root = state_root();
    let alive = judge(&[]);
    for n in 0..MAX_ENTRIES {
        directory::register(&root, entry(&format!("u{n}"), None, &[]), false, &alive).unwrap();
    }
    let refused = directory::register(&root, entry("extra", Some(1), &[]), false, &alive).unwrap_err();
    assert_eq!(refused.reason, "directory-full");
    assert_eq!(files(&root), MAX_ENTRIES, "unknown liveness is never removed");
}

#[test]
fn files_this_build_does_not_read_are_left_alone() {
    let root = state_root();
    let alive = judge(&[]);
    directory::register(&root, entry("aaaa", Some(10), &[]), false, &alive).unwrap();
    let foreign = directory::directory(&root).join("future.json");
    fs::write(&foreign, r#"{"v":2}"#).unwrap();

    assert_eq!(directory::list(&root, None, true, &alive).unwrap().sessions.len(), 1);
    directory::register(&root, entry("bbbb", Some(20), &[]), false, &alive).unwrap();
    assert!(foreign.exists());
}

/// A fake process table: pid to its parent, session and terminal.
struct Table(HashMap<u32, ProcStat>);
impl ProcessTree for Table {
    fn stat(&self, pid: u32) -> Option<ProcStat> {
        self.0.get(&pid).copied()
    }
}

#[test]
fn liveness_is_judged_by_the_terminal_head_never_the_fgos_child() {
    let stat = |ppid, tty_nr| ProcStat { ppid, session: 100, tty_nr };
    let tree = Table(HashMap::from([
        (300, stat(200, 34816)), // the fgos child that registers
        (200, stat(100, 34816)), // the agent
        (100, stat(1, 34816)),   // the shell holding the terminal
        (1, stat(0, 0)),
    ]));
    let record_of = |pid: u32| Some(head(pid));

    let record = directory::head_liveness(&tree, 300, &record_of).unwrap();
    assert_eq!(record.pid, Some(ProcId(100)));

    let detached = Table(HashMap::from([(300, stat(200, 0)), (200, stat(1, 0)), (1, stat(0, 0))]));
    assert_eq!(directory::head_liveness(&detached, 300, &record_of), None, "no terminal ancestor: unknown");
    assert_eq!(directory::head_liveness(&Table(HashMap::new()), 300, &record_of), None);
}

fn machine_root() -> PathBuf {
    let root = state_root();
    fs::write(root.join("machine-id"), "fg-abc234\n").unwrap();
    root
}

fn head_of(pid: u32) -> fgos_identity::HeadRef {
    let start_time = fgos_process::facts::identity_of(ProcId(pid)).unwrap().start_time;
    fgos_identity::HeadRef { pid, start_time }
}

#[test]
fn a_writer_key_registers_the_session_it_names_with_the_live_head_and_resolves() {
    let root = machine_root();
    let key = fgos_identity::WriterKey { source: "CODEX_THREAD_ID", value: "thread-9" };
    let roles = vec!["lead:MAIL".to_string()];
    let listed = directory::register_writer(&root, None, &key, &head_of(std::process::id()), &roles, false).unwrap();
    assert_eq!(listed.id, "fg-abc234/thread-9");
    assert_eq!(listed.cli, "codex");
    assert!(listed.handle.starts_with("codex-"), "{}", listed.handle);
    assert_eq!(listed.liveness, Liveness::Alive);
    let found = directory::resolve(&root, &listed.handle, &judge(&[])).unwrap();
    assert_eq!(found.id, listed.id);
    assert_eq!(directory::resolve(&root, "lead:MAIL", &judge(&[])).unwrap().id, listed.id);
    // the same key registers again as a refresh, the roles kept
    let again = directory::register_writer(&root, None, &key, &head_of(std::process::id()), &[], false).unwrap();
    assert_eq!(again.roles, roles);
    let _ = fs::remove_dir_all(root);
}

#[test]
fn a_writer_key_outside_the_rule_or_a_head_that_is_not_running_registers_nothing() {
    let root = machine_root();
    let bad = fgos_identity::WriterKey { source: "OMP_SESSION_ID", value: "s-1" };
    assert_eq!(directory::register_writer(&root, None, &bad, &head_of(std::process::id()), &[], false).unwrap_err().reason, "invalid-writer-key");

    let mut child = std::process::Command::new("sleep").arg("5").spawn().unwrap();
    let gone = head_of(child.id());
    child.kill().unwrap();
    child.wait().unwrap();
    let key = fgos_identity::WriterKey { source: "CLAUDE_CODE_SESSION_ID", value: "s-2" };
    assert_eq!(directory::register_writer(&root, None, &key, &gone, &[], false).unwrap_err().reason, "head-not-live");
    let nobody = fgos_identity::HeadRef { pid: u32::MAX, start_time: "1".into() };
    assert_eq!(directory::register_writer(&root, None, &key, &nobody, &[], false).unwrap_err().reason, "head-not-live");
    // a live process with another start time is a reused pid, not the head
    let mut reused = head_of(std::process::id());
    reused.start_time.push('0');
    let refusal = directory::register_writer(&root, None, &key, &reused, &[], false).unwrap_err();
    assert_eq!(refusal.reason, "head-not-live");
    assert!(refusal.detail.contains("pid was reused"), "{}", refusal.detail);
    assert_eq!(files(&root), 0, "a refused registration leaves no entry");
    let _ = fs::remove_dir_all(root);
}

#[test]
fn a_full_id_resolves_the_exact_live_entry_of_this_machine_and_never_another_machines() {
    let root = machine_root();
    let alive = judge(&[]);
    let a = entry("alpha", Some(1), &[]);
    directory::register(&root, a.clone(), false, &alive).unwrap();
    directory::register(&root, entry("beta", Some(2), &[]), false, &alive).unwrap();
    directory::register(&root, entry("gone", Some(3), &[]), false, &alive).unwrap();

    assert_eq!(directory::resolve(&root, "fg-abc234/alpha", &alive).unwrap().handle, a.handle);
    assert_eq!(directory::resolve(&root, " fg-abc234/alpha ", &alive).unwrap().handle, a.handle);
    let missing = directory::resolve(&root, "fg-abc234/nobody", &alive).unwrap_err();
    assert_eq!(missing.reason, "not-found");
    assert_eq!(directory::resolve(&root, "fg-abc234/gone", &judge(&[3])).unwrap_err().reason, "not-found", "a dead head is not resolved");

    let other = directory::resolve(&root, "fg-other99/alpha", &alive).unwrap_err();
    assert_eq!(other.reason, "not-found");
    assert!(other.detail.contains("shared directory"), "{}", other.detail);
    let _ = fs::remove_dir_all(root);
}
