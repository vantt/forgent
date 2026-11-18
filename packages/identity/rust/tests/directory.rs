//! The local directory: registration, resolve by handle and by role, list,
//! pruning, the cap, handle and role contention, and which process an
//! entry's liveness is judged by. The OS is replaced by an injected judge and
//! a fake process tree; the wiring over the real verb is one test in the
//! host's CLI tests.

use fgos_identity::directory::{
    self, CliSessionIds, Entry, HeadIds, Ids, MailboxIds, TerminalIds, TerminalPort, MAX_ENTRIES,
};
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
    directory::register(
        &root,
        entry("aaaa", Some(10), &["lead:MAIL"]),
        false,
        &alive,
    )
    .unwrap();
    directory::register(
        &root,
        entry("bbbb", Some(20), &["lead:IDENT"]),
        false,
        &alive,
    )
    .unwrap();

    let by_handle = directory::resolve(
        &root,
        "claude-aaaa@fg",
        &alive,
        None,
        &directory::NoTerminal,
    )
    .unwrap();
    assert_eq!(by_handle.id, "fg-abc234/aaaa");
    assert_eq!(by_handle.liveness, Liveness::Alive);
    assert_eq!(
        directory::resolve(&root, "lead:IDENT", &alive, None, &directory::NoTerminal)
            .unwrap()
            .handle,
        "claude-bbbb@fg"
    );
    assert_eq!(
        directory::list(&root, None, false, &alive, None)
            .unwrap()
            .sessions
            .len(),
        2
    );
}

#[test]
fn unknown_names_are_not_found_with_the_close_candidates() {
    let root = state_root();
    let alive = judge(&[]);
    directory::register(
        &root,
        entry("aaaa", Some(10), &["lead:MAIL"]),
        false,
        &alive,
    )
    .unwrap();

    let by_handle =
        directory::resolve(&root, "claude-aaa", &alive, None, &directory::NoTerminal).unwrap_err();
    assert_eq!(by_handle.reason, "not-found");
    assert!(
        by_handle.detail.contains("claude-aaaa@fg"),
        "{}",
        by_handle.detail
    );
    assert_eq!(
        by_handle.candidates,
        [Candidate {
            id: "fg-abc234/aaaa".into(),
            handle: "claude-aaaa@fg".into(),
            liveness: Liveness::Alive,
            remote: None,
            matched: Vec::new(),
        }]
    );
    let by_role =
        directory::resolve(&root, "lead:MA", &alive, None, &directory::NoTerminal).unwrap_err();
    assert_eq!(by_role.reason, "not-found");
    assert!(by_role.detail.contains("lead:MAIL"), "{}", by_role.detail);
    assert_eq!(
        by_role
            .candidates
            .iter()
            .map(|c| c.handle.as_str())
            .collect::<Vec<_>>(),
        ["claude-aaaa@fg"]
    );
    assert_eq!(
        directory::resolve(&root, "", &alive, None, &directory::NoTerminal)
            .unwrap_err()
            .reason,
        "not-found"
    );
}

#[test]
fn a_role_held_twice_is_ambiguous_and_lists_both() {
    let root = state_root();
    let alive = judge(&[]);
    directory::register(
        &root,
        entry("aaaa", Some(10), &["lead:MAIL"]),
        false,
        &alive,
    )
    .unwrap();
    directory::register(&root, entry("bbbb", Some(20), &[]), false, &alive).unwrap();
    // Two concurrent takes can leave a role on two entries; plant that state.
    for file in fs::read_dir(directory::directory(&root)).unwrap() {
        let path = file.unwrap().path();
        let mut value: serde_json::Value =
            serde_json::from_slice(&fs::read(&path).unwrap()).unwrap();
        value["roles"] = serde_json::json!(["lead:MAIL"]);
        fs::write(&path, serde_json::to_vec(&value).unwrap()).unwrap();
    }
    let refusal =
        directory::resolve(&root, "lead:MAIL", &alive, None, &directory::NoTerminal).unwrap_err();
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
    directory::register(
        &root,
        entry("aaaa", Some(10), &["lead:MAIL"]),
        false,
        &judge(&[]),
    )
    .unwrap();
    let after_death = judge(&[10]);

    assert_eq!(
        directory::resolve(
            &root,
            "claude-aaaa@fg",
            &after_death,
            None,
            &directory::NoTerminal
        )
        .unwrap_err()
        .reason,
        "not-found"
    );
    assert!(directory::list(&root, None, false, &after_death, None)
        .unwrap()
        .sessions
        .is_empty());
    assert_eq!(files(&root), 1, "a read never removes");

    directory::register(&root, entry("bbbb", Some(20), &[]), false, &after_death).unwrap();
    assert_eq!(
        files(&root),
        2,
        "a write that takes no role and is below the cap scans nothing, so it prunes nothing"
    );
    // A write that takes a role scans, removes the dead entry and finds its role free.
    directory::register(
        &root,
        entry("bbbb", Some(20), &["lead:MAIL"]),
        false,
        &after_death,
    )
    .unwrap();
    assert_eq!(files(&root), 1, "the role write removed the dead entry");
}

#[test]
fn a_session_without_a_terminal_ancestor_is_unknown_and_prune_never_removes_it() {
    let root = state_root();
    let alive = judge(&[]);
    directory::register(&root, entry("aaaa", None, &[]), false, &alive).unwrap();
    directory::register(&root, entry("bbbb", Some(20), &[]), false, &alive).unwrap();

    let before = directory::list(&root, None, false, &alive, None).unwrap();
    assert_eq!(
        before
            .sessions
            .iter()
            .map(|s| s.liveness)
            .collect::<Vec<_>>(),
        [Liveness::Unknown, Liveness::Alive]
    );
    assert_eq!(
        directory::resolve(
            &root,
            "claude-aaaa@fg",
            &alive,
            None,
            &directory::NoTerminal
        )
        .unwrap()
        .liveness,
        Liveness::Unknown
    );

    let nothing_dead = directory::list(&root, None, true, &alive, None).unwrap();
    assert_eq!(
        nothing_dead.pruned, 0,
        "unknown may be a live headless agent"
    );
    assert_eq!(nothing_dead.sessions.len(), 2);

    let one_dead = directory::list(&root, None, true, &judge(&[20]), None).unwrap();
    assert_eq!(one_dead.pruned, 1);
    assert_eq!(
        one_dead
            .sessions
            .iter()
            .map(|s| s.handle.as_str())
            .collect::<Vec<_>>(),
        ["claude-aaaa@fg"]
    );
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

    let listed = directory::list(&root, Some(&"a".repeat(32)), false, &alive, None).unwrap();
    assert_eq!(listed.sessions.len(), 1);
    assert_eq!(listed.sessions[0].handle, "claude-aaaa@fg");
}

#[test]
fn a_role_held_by_a_live_session_is_refused_unless_taken() {
    let root = state_root();
    let alive = judge(&[]);
    directory::register(
        &root,
        entry("aaaa", Some(10), &["lead:MAIL"]),
        false,
        &alive,
    )
    .unwrap();

    let refused = directory::register(
        &root,
        entry("bbbb", Some(20), &["lead:MAIL"]),
        false,
        &alive,
    )
    .unwrap_err();
    assert_eq!(refused.reason, "role-held");
    assert!(refused.detail.contains("claude-aaaa@fg") && refused.detail.contains("--take"));
    assert_eq!(
        directory::resolve(&root, "lead:MAIL", &alive, None, &directory::NoTerminal)
            .unwrap()
            .handle,
        "claude-aaaa@fg"
    );

    directory::register(&root, entry("bbbb", Some(20), &["lead:MAIL"]), true, &alive).unwrap();
    assert_eq!(
        directory::resolve(&root, "lead:MAIL", &alive, None, &directory::NoTerminal)
            .unwrap()
            .handle,
        "claude-bbbb@fg"
    );
    let former = directory::resolve(
        &root,
        "claude-aaaa@fg",
        &alive,
        None,
        &directory::NoTerminal,
    )
    .unwrap();
    assert!(former.roles.is_empty(), "the role moved, it was not copied");
}

#[test]
fn a_session_drops_only_its_own_role_and_it_then_resolves_not_found() {
    let root = state_root();
    let alive = judge(&[]);
    directory::register(
        &root,
        entry("aaaa", Some(10), &["lead:MAIL", "lead:IDENT"]),
        false,
        &alive,
    )
    .unwrap();
    directory::register(
        &root,
        entry("bbbb", Some(20), &["lead:HARDEN"]),
        false,
        &alive,
    )
    .unwrap();

    let after = directory::drop_role(&root, "fg-abc234/aaaa", "lead:MAIL", &alive).unwrap();
    assert_eq!(after.roles, ["lead:IDENT"]);
    assert_eq!(
        directory::resolve(&root, "lead:MAIL", &alive, None, &directory::NoTerminal)
            .unwrap_err()
            .reason,
        "not-found"
    );
    assert_eq!(
        directory::resolve(&root, "lead:IDENT", &alive, None, &directory::NoTerminal)
            .unwrap()
            .handle,
        "claude-aaaa@fg"
    );

    let not_held = directory::drop_role(&root, "fg-abc234/aaaa", "lead:MAIL", &alive).unwrap_err();
    assert_eq!(not_held.reason, "role-not-held");
    assert!(not_held.candidates.is_empty(), "nobody holds lead:MAIL now");
    // Another live session's role is out of reach: the caller names only itself.
    let foreign = directory::drop_role(&root, "fg-abc234/aaaa", "lead:HARDEN", &alive).unwrap_err();
    assert_eq!(foreign.reason, "role-not-held");
    assert_eq!(
        foreign
            .candidates
            .iter()
            .map(|c| c.handle.as_str())
            .collect::<Vec<_>>(),
        ["claude-bbbb@fg"],
        "the holder is named"
    );
    assert_eq!(
        directory::resolve(&root, "lead:HARDEN", &alive, None, &directory::NoTerminal)
            .unwrap()
            .handle,
        "claude-bbbb@fg"
    );
    assert_eq!(
        directory::drop_role(&root, "fg-abc234/cccc", "lead:MAIL", &alive)
            .unwrap_err()
            .reason,
        "not-registered"
    );
    assert_eq!(
        directory::drop_role(&root, "fg-abc234/aaaa", "MAIL", &alive)
            .unwrap_err()
            .reason,
        "invalid-role"
    );
}

#[test]
fn a_role_must_be_lead_with_a_lane_id_or_work_with_a_work_item_id() {
    let root = state_root();
    let alive = judge(&[]);
    for bad in [
        "lead:mail",
        "lead:",
        "boss:MAIL",
        "MAIL",
        "lead:1A",
        "lead:ABCDEFGHIJKLMNOPQ",
        "work:",
        "work:Tsk-1",
        "work:1abc",
        "work:a:b",
        "work:abcdefghijklmnopqrstuvwxyz01234",
    ] {
        let refused =
            directory::register(&root, entry("aaaa", Some(10), &[bad]), false, &alive).unwrap_err();
        assert_eq!(refused.reason, "invalid-role", "{bad}");
    }
    assert_eq!(files(&root), 0);
    assert!(directory::role_problem("lead:T1-P6").is_none());
    assert!(directory::role_problem("work:tsk-4f2a9c1b3d").is_none());
    assert!(directory::role_problem("work:fix-the-login-form").is_none());
}

#[test]
fn a_work_role_has_one_live_holder_moves_with_take_and_resolves() {
    let root = state_root();
    let alive = judge(&[]);
    directory::register(
        &root,
        entry("aaaa", Some(10), &["work:tsk-4f2a9c1b3d"]),
        false,
        &alive,
    )
    .unwrap();
    assert_eq!(
        directory::resolve(
            &root,
            "work:tsk-4f2a9c1b3d",
            &alive,
            None,
            &directory::NoTerminal
        )
        .unwrap()
        .handle,
        "claude-aaaa@fg"
    );

    let refused = directory::register(
        &root,
        entry("bbbb", Some(20), &["work:tsk-4f2a9c1b3d"]),
        false,
        &alive,
    )
    .unwrap_err();
    assert_eq!(refused.reason, "role-held");
    assert!(refused.detail.contains("claude-aaaa@fg") && refused.detail.contains("--take"));

    directory::register(
        &root,
        entry("bbbb", Some(20), &["work:tsk-4f2a9c1b3d"]),
        true,
        &alive,
    )
    .unwrap();
    assert_eq!(
        directory::resolve(
            &root,
            "work:tsk-4f2a9c1b3d",
            &alive,
            None,
            &directory::NoTerminal
        )
        .unwrap()
        .handle,
        "claude-bbbb@fg"
    );
    assert!(directory::resolve(
        &root,
        "claude-aaaa@fg",
        &alive,
        None,
        &directory::NoTerminal
    )
    .unwrap()
    .roles
    .is_empty());

    let after =
        directory::drop_role(&root, "fg-abc234/bbbb", "work:tsk-4f2a9c1b3d", &alive).unwrap();
    assert!(after.roles.is_empty());
    assert_eq!(
        directory::resolve(
            &root,
            "work:tsk-4f2a9c1b3d",
            &alive,
            None,
            &directory::NoTerminal
        )
        .unwrap_err()
        .reason,
        "not-found"
    );
}

#[test]
fn registering_again_refreshes_the_entry_and_keeps_its_roles_and_first_time() {
    let root = state_root();
    let alive = judge(&[]);
    let first = directory::register(
        &root,
        entry("aaaa", Some(10), &["lead:MAIL"]),
        false,
        &alive,
    )
    .unwrap();
    let again = directory::register(
        &root,
        entry("aaaa", Some(11), &["lead:IDENT"]),
        false,
        &alive,
    )
    .unwrap();

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
    assert!(
        refused.detail.contains("fg-abc234/aaaa") && refused.detail.contains("fg-abc234/other")
    );
    // Once the first one is dead the handle is free: the dead entry is replaced, not left beside it.
    let taken = directory::register(&root, clash, false, &judge(&[10])).unwrap();
    assert_eq!(taken.id, "fg-abc234/other");
    assert_eq!(files(&root), 1);
    assert_eq!(
        directory::resolve(
            &root,
            "claude-aaaa@fg",
            &judge(&[10]),
            None,
            &directory::NoTerminal
        )
        .unwrap()
        .id,
        "fg-abc234/other"
    );
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
        directory::register(
            &root,
            entry(&format!("s{n}"), Some(1_000 + n as u32), &[]),
            false,
            &alive,
        )
        .unwrap();
    }
    let refused =
        directory::register(&root, entry("extra", Some(1), &[]), false, &alive).unwrap_err();
    assert_eq!(refused.reason, "directory-full");
    assert!(refused.detail.contains("list --prune"));
    // A session already in the directory still refreshes.
    directory::register(&root, entry("s0", Some(1_000), &[]), false, &alive).unwrap();

    // At the cap a write removes the dead entries first, so a new session fits.
    let one_dead = judge(&[1_005]);
    directory::register(&root, entry("extra", Some(1), &[]), false, &one_dead).unwrap();
    assert_eq!(
        files(&root),
        MAX_ENTRIES,
        "one dead entry went, one session came"
    );
    assert!(!directory::list(&root, None, false, &one_dead, None)
        .unwrap()
        .sessions
        .iter()
        .any(|s| s.handle == "claude-s5@fg"));

    // Every head dies: prune empties the directory and a new session fits.
    let all_dead = |_: &Record| Verdict::Dead;
    assert_eq!(
        directory::list(&root, None, true, &all_dead, None)
            .unwrap()
            .pruned,
        MAX_ENTRIES
    );
    directory::register(&root, entry("extra", Some(1), &[]), false, &alive).unwrap();
}

#[test]
fn a_full_directory_of_entries_that_may_be_alive_is_never_pruned_by_a_write() {
    let root = state_root();
    let alive = judge(&[]);
    for n in 0..MAX_ENTRIES {
        directory::register(&root, entry(&format!("u{n}"), None, &[]), false, &alive).unwrap();
    }
    let refused =
        directory::register(&root, entry("extra", Some(1), &[]), false, &alive).unwrap_err();
    assert_eq!(refused.reason, "directory-full");
    assert_eq!(
        files(&root),
        MAX_ENTRIES,
        "unknown liveness is never removed"
    );
}

#[test]
fn files_this_build_does_not_read_are_left_alone() {
    let root = state_root();
    let alive = judge(&[]);
    directory::register(&root, entry("aaaa", Some(10), &[]), false, &alive).unwrap();
    let foreign = directory::directory(&root).join("future.json");
    fs::write(&foreign, r#"{"v":2}"#).unwrap();

    assert_eq!(
        directory::list(&root, None, true, &alive, None)
            .unwrap()
            .sessions
            .len(),
        1
    );
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
    let stat = |ppid, tty_nr| ProcStat {
        ppid,
        session: 100,
        tty_nr,
    };
    let tree = Table(HashMap::from([
        (300, stat(200, 34816)), // the fgos child that registers
        (200, stat(100, 34816)), // the agent
        (100, stat(1, 34816)),   // the shell holding the terminal
        (1, stat(0, 0)),
    ]));
    let record_of = |pid: u32| Some(head(pid));

    let record = directory::head_liveness(&tree, 300, &record_of).unwrap();
    assert_eq!(record.pid, Some(ProcId(100)));

    let detached = Table(HashMap::from([
        (300, stat(200, 0)),
        (200, stat(1, 0)),
        (1, stat(0, 0)),
    ]));
    assert_eq!(
        directory::head_liveness(&detached, 300, &record_of),
        None,
        "no terminal ancestor: unknown"
    );
    assert_eq!(
        directory::head_liveness(&Table(HashMap::new()), 300, &record_of),
        None
    );
}

fn machine_root() -> PathBuf {
    let root = state_root();
    fs::write(root.join("machine-id"), "fg-abc234\n").unwrap();
    root
}

fn head_of(pid: u32) -> fgos_identity::HeadRef {
    let start_time = fgos_process::facts::identity_of(ProcId(pid))
        .unwrap()
        .start_time;
    fgos_identity::HeadRef { pid, start_time }
}

#[test]
fn a_writer_key_registers_the_session_it_names_with_the_live_head_and_resolves() {
    let root = machine_root();
    let key = fgos_identity::WriterKey {
        source: "CODEX_THREAD_ID",
        value: "thread-9",
    };
    let roles = vec!["lead:MAIL".to_string()];
    let listed = directory::register_writer(
        &root,
        None,
        &key,
        &head_of(std::process::id()),
        &roles,
        false,
        None,
    )
    .unwrap();
    assert_eq!(listed.id, "fg-abc234/thread-9");
    assert_eq!(listed.cli, "codex");
    assert!(listed.handle.starts_with("codex-"), "{}", listed.handle);
    assert_eq!(listed.liveness, Liveness::Alive);
    let found = directory::resolve(
        &root,
        &listed.handle,
        &judge(&[]),
        None,
        &directory::NoTerminal,
    )
    .unwrap();
    assert_eq!(found.id, listed.id);
    assert_eq!(
        directory::resolve(
            &root,
            "lead:MAIL",
            &judge(&[]),
            None,
            &directory::NoTerminal
        )
        .unwrap()
        .id,
        listed.id
    );
    // the same key registers again as a refresh, the roles kept
    let again = directory::register_writer(
        &root,
        None,
        &key,
        &head_of(std::process::id()),
        &[],
        false,
        None,
    )
    .unwrap();
    assert_eq!(again.roles, roles);
    let _ = fs::remove_dir_all(root);
}

#[test]
fn a_writer_key_outside_the_rule_or_a_head_that_is_not_running_registers_nothing() {
    let root = machine_root();
    let bad = fgos_identity::WriterKey {
        source: "OMP_SESSION_ID",
        value: "s-1",
    };
    assert_eq!(
        directory::register_writer(
            &root,
            None,
            &bad,
            &head_of(std::process::id()),
            &[],
            false,
            None
        )
        .unwrap_err()
        .reason,
        "invalid-writer-key"
    );

    let mut child = std::process::Command::new("sleep")
        .arg("5")
        .spawn()
        .unwrap();
    let gone = head_of(child.id());
    child.kill().unwrap();
    child.wait().unwrap();
    let key = fgos_identity::WriterKey {
        source: "CLAUDE_CODE_SESSION_ID",
        value: "s-2",
    };
    assert_eq!(
        directory::register_writer(&root, None, &key, &gone, &[], false, None)
            .unwrap_err()
            .reason,
        "head-not-live"
    );
    let nobody = fgos_identity::HeadRef {
        pid: u32::MAX,
        start_time: "1".into(),
    };
    assert_eq!(
        directory::register_writer(&root, None, &key, &nobody, &[], false, None)
            .unwrap_err()
            .reason,
        "head-not-live"
    );
    // a live process with another start time is a reused pid, not the head
    let mut reused = head_of(std::process::id());
    reused.start_time.push('0');
    let refusal =
        directory::register_writer(&root, None, &key, &reused, &[], false, None).unwrap_err();
    assert_eq!(refusal.reason, "head-not-live");
    assert!(
        refusal.detail.contains("pid was reused"),
        "{}",
        refusal.detail
    );
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

    assert_eq!(
        directory::resolve(
            &root,
            "fg-abc234/alpha",
            &alive,
            None,
            &directory::NoTerminal
        )
        .unwrap()
        .handle,
        a.handle
    );
    assert_eq!(
        directory::resolve(
            &root,
            " fg-abc234/alpha ",
            &alive,
            None,
            &directory::NoTerminal
        )
        .unwrap()
        .handle,
        a.handle
    );
    let missing = directory::resolve(
        &root,
        "fg-abc234/nobody",
        &alive,
        None,
        &directory::NoTerminal,
    )
    .unwrap_err();
    assert_eq!(missing.reason, "not-found");
    assert_eq!(
        directory::resolve(
            &root,
            "fg-abc234/gone",
            &judge(&[3]),
            None,
            &directory::NoTerminal
        )
        .unwrap_err()
        .reason,
        "not-found",
        "a dead head is not resolved"
    );

    let other = directory::resolve(
        &root,
        "fg-other99/alpha",
        &alive,
        None,
        &directory::NoTerminal,
    )
    .unwrap_err();
    assert_eq!(other.reason, "not-found");
    assert!(
        other.detail.contains("shared directory"),
        "{}",
        other.detail
    );
    let _ = fs::remove_dir_all(root);
}

#[test]
fn a_head_role_names_a_persona_and_a_session_name_and_only_one_live_session_holds_it() {
    use fgos_identity::directory::role_problem;
    assert_eq!(role_problem("head:secretary-miu"), None);
    assert!(role_problem("head:Secretary").is_some());
    assert!(role_problem("head:").is_some());
    assert!(role_problem(&format!("head:secretary-{}", "a".repeat(98))).is_some());

    let root = state_root();
    let alive = judge(&[]);
    directory::register(
        &root,
        entry("aaaa", Some(10), &["head:secretary-miu"]),
        false,
        &alive,
    )
    .unwrap();
    let refused = directory::register(
        &root,
        entry("bbbb", Some(20), &["head:secretary-miu"]),
        false,
        &alive,
    )
    .unwrap_err();
    assert_eq!(refused.reason, "role-held");

    directory::register(
        &root,
        entry("bbbb", Some(20), &["head:secretary-miu"]),
        true,
        &alive,
    )
    .unwrap();
    assert_eq!(
        directory::resolve(
            &root,
            "head:secretary-miu",
            &alive,
            None,
            &directory::NoTerminal
        )
        .unwrap()
        .handle,
        "claude-bbbb@fg"
    );
}

fn attempt_key(id: &str) -> fgos_identity::WriterKey<'_> {
    fgos_identity::WriterKey {
        source: "FGOS_SESSION_ID",
        value: id,
    }
}

fn claude_key(id: &str) -> fgos_identity::WriterKey<'_> {
    fgos_identity::WriterKey {
        source: "CLAUDE_CODE_SESSION_ID",
        value: id,
    }
}

#[test]
fn an_attempt_binds_its_agent_session_on_its_head_and_the_role_moves_to_it_under_the_clis_label() {
    let root = machine_root();
    let me = std::process::id();
    let gate = head_of(me);
    let role = vec!["head:secretary-miu".to_string()];
    let attempt = attempt_key("att-cmd_1");
    directory::register_writer(&root, None, &attempt, &gate, &role, false, None).unwrap();
    let before = directory::resolve(
        &root,
        "head:secretary-miu",
        &judge(&[]),
        None,
        &directory::NoTerminal,
    )
    .unwrap();
    assert_eq!(
        (before.id.as_str(), before.cli.as_str()),
        ("fg-abc234/att-cmd_1", "worker")
    );

    let bound = directory::bind_agent_session(
        &root,
        None,
        &attempt,
        &claude_key("uuid-1"),
        &gate,
        me,
        None,
    )
    .unwrap();
    assert_eq!(bound.id, "fg-abc234/uuid-1");
    assert_eq!(bound.cli, "claude");
    assert_eq!(bound.roles, role);
    let holder = directory::resolve(
        &root,
        "head:secretary-miu",
        &judge(&[]),
        None,
        &directory::NoTerminal,
    )
    .unwrap();
    assert_eq!(holder.id, bound.id, "the role left the attempt entry");
    assert!(holder.handle.starts_with("claude-"), "{}", holder.handle);
    // The attempt is now that session; without its head only its own entry is looked at.
    let now = |head| {
        directory::attempt_session(&root, &attempt, head, &judge(&[]))
            .unwrap()
            .unwrap()
            .id
    };
    assert_eq!(now(Some(&gate)), bound.id);
    assert_eq!(now(None), "fg-abc234/att-cmd_1");
    // A later role registration of the attempt lands on the bound session.
    let other = vec!["head:secretary-miu".to_string(), "lead:MAIL".to_string()];
    let again =
        directory::register_attempt_roles(&root, None, &attempt, &gate, &other, false, None)
            .unwrap();
    assert_eq!(again.id, bound.id);
    assert_eq!(again.roles, other);
    // Binding the same session again is a refresh.
    assert!(directory::bind_agent_session(
        &root,
        None,
        &attempt,
        &claude_key("uuid-1"),
        &gate,
        me,
        None
    )
    .is_ok());
    let _ = fs::remove_dir_all(root);
}

#[test]
fn a_bind_from_outside_the_head_of_an_unregistered_attempt_with_an_attempt_key_or_another_heads_session_is_refused(
) {
    let root = machine_root();
    let me = std::process::id();
    let gate = head_of(me);
    let attempt = attempt_key("att-cmd_2");
    let bind = |agent: &fgos_identity::WriterKey, caller: u32| {
        directory::bind_agent_session(&root, None, &attempt, agent, &gate, caller, None)
            .unwrap_err()
            .reason
    };
    assert_eq!(bind(&claude_key("uuid-2"), me), "attempt-not-registered");
    directory::register_writer(&root, None, &attempt, &gate, &[], false, None).unwrap();
    assert_eq!(bind(&attempt_key("att-cmd_3"), me), "invalid-writer-key");
    assert_eq!(bind(&claude_key("att-cmd_3"), me), "invalid-writer-key");
    assert_eq!(
        bind(&claude_key("uuid-2"), std::os::unix::process::parent_id()),
        "caller-not-under-head"
    );
    let mut other = std::process::Command::new("sleep")
        .arg("30")
        .spawn()
        .unwrap();
    directory::register_writer(
        &root,
        None,
        &claude_key("uuid-2"),
        &head_of(other.id()),
        &[],
        false,
        None,
    )
    .unwrap();
    assert_eq!(bind(&claude_key("uuid-2"), me), "session-in-use");
    other.kill().unwrap();
    other.wait().unwrap();
    let _ = fs::remove_dir_all(root);
}

/// The first child of `parent`, waited for.
fn child_of(parent: u32) -> u32 {
    let deadline = std::time::Instant::now() + std::time::Duration::from_secs(5);
    loop {
        for entry in fs::read_dir("/proc").unwrap().flatten() {
            let Some(pid) = entry
                .file_name()
                .to_str()
                .and_then(|n| n.parse::<u32>().ok())
            else {
                continue;
            };
            if fgos_process::facts::relation_of(ProcId(pid)).is_some_and(|r| r.parent == parent) {
                return pid;
            }
        }
        assert!(
            std::time::Instant::now() < deadline,
            "no child of {parent} appeared"
        );
        std::thread::sleep(std::time::Duration::from_millis(20));
    }
}

#[cfg(target_os = "linux")]
#[test]
fn a_bind_from_an_agent_nested_under_the_gates_agent_is_refused_and_the_head_keeps_its_roles() {
    let root = machine_root();
    let me = std::process::id();
    let gate = head_of(me);
    let role = vec!["head:secretary-miu".to_string()];
    let attempt = attempt_key("att-cmd_6");
    directory::register_writer(&root, None, &attempt, &gate, &role, false, None).unwrap();
    // The gate the attempt's hooks check their agent against.
    assert_eq!(
        directory::attempt_gate(&root, &attempt).as_ref(),
        Some(&gate)
    );
    // The gate's agent (a `sh`) whose hook (a `sleep`) runs directly under it binds.
    let mut agent = std::process::Command::new("/bin/sh")
        .args(["-c", "sleep 30; :"])
        .spawn()
        .unwrap();
    let hook = child_of(agent.id());
    let bound = directory::bind_agent_session(
        &root,
        None,
        &attempt,
        &claude_key("uuid-head"),
        &gate,
        hook,
        None,
    )
    .unwrap();
    // A second `sh` started under the gate's agent, as a tool would start `claude -p`, inherits the attempt's
    // environment; its own hook asks to bind its session.
    let mut nested_tree = std::process::Command::new("/bin/sh")
        .args(["-c", "/bin/sh -c 'sleep 30; :'; :"])
        .spawn()
        .unwrap();
    let nested = child_of(nested_tree.id());
    let nested_hook = child_of(nested);
    let refusal = directory::bind_agent_session(
        &root,
        None,
        &attempt,
        &claude_key("uuid-nested"),
        &gate,
        nested_hook,
        None,
    )
    .unwrap_err();
    assert_eq!(refusal.reason, "agent-not-gate-child", "{}", refusal.detail);
    let holder = directory::resolve(
        &root,
        "head:secretary-miu",
        &judge(&[]),
        None,
        &directory::NoTerminal,
    )
    .unwrap();
    assert_eq!(holder.id, bound.id, "the head keeps its roles");
    for child in [&mut agent, &mut nested_tree] {
        let _ = child.kill();
        let _ = child.wait();
    }
    let _ = fs::remove_dir_all(root);
}

#[test]
fn a_second_bind_on_the_same_live_head_moves_the_roles_pane_and_head_to_the_new_session_and_retires_the_old_one(
) {
    let root = machine_root();
    let me = std::process::id();
    let gate = head_of(me);
    let role = vec!["head:secretary-miu".to_string()];
    let attempt = attempt_key("att-cmd_4");
    // The supervisor registers the attempt with the pane it opened and the head it starts.
    let supervised = Ids {
        terminal: Some(pane("w1-p1")),
        head: Some(head_ids(3)),
        ..Ids::default()
    };
    directory::register_writer(
        &root,
        None,
        &attempt,
        &gate,
        &role,
        false,
        Some(&supervised),
    )
    .unwrap();
    let agent_a = Ids {
        cli_session: Some(cli("uuid-a", None)),
        mailbox: Some(mailbox("miu")),
        ..Ids::default()
    };
    let first = directory::bind_agent_session(
        &root,
        None,
        &attempt,
        &claude_key("uuid-a"),
        &gate,
        me,
        Some(&agent_a),
    )
    .unwrap();
    let first_ids = first.ids.clone().unwrap();
    assert_eq!(
        first_ids.terminal, supervised.terminal,
        "the pane moved to the bound session"
    );
    assert_eq!(
        first_ids.head, supervised.head,
        "the head moved to the bound session"
    );
    assert_eq!(first_ids.cli_session, agent_a.cli_session);
    assert_eq!(first_ids.mailbox, agent_a.mailbox);
    let attempt_entry = directory::list(&root, None, false, &judge(&[]), None)
        .unwrap()
        .sessions
        .into_iter()
        .find(|s| s.id == "fg-abc234/att-cmd_4")
        .unwrap();
    assert_eq!(attempt_entry.ids, None, "the attempt keeps no pane or head");
    assert_eq!(
        directory::resolve(&root, "w1-p1", &judge(&[]), None, &directory::NoTerminal)
            .unwrap()
            .id,
        first.id,
        "the pane names one session"
    );
    // The CLI started a new session on the same process (e.g. after `/clear`), and its hook binds again.
    let agent_b = Ids {
        cli_session: Some(cli("uuid-b", None)),
        ..Ids::default()
    };
    let second = directory::bind_agent_session(
        &root,
        None,
        &attempt,
        &claude_key("uuid-b"),
        &gate,
        me,
        Some(&agent_b),
    )
    .unwrap();
    assert_eq!(second.id, "fg-abc234/uuid-b");
    let second_ids = second.ids.clone().unwrap();
    assert_eq!(second_ids.terminal, supervised.terminal);
    assert_eq!(second_ids.head, supervised.head);
    assert_eq!(second_ids.cli_session, agent_b.cli_session);
    assert_eq!(
        second.roles, role,
        "the roles left the session bound before"
    );
    let holder = directory::resolve(
        &root,
        "head:secretary-miu",
        &judge(&[]),
        None,
        &directory::NoTerminal,
    )
    .unwrap();
    assert_eq!(holder.id, second.id);
    assert_eq!(
        directory::resolve(
            &root,
            &first.handle,
            &judge(&[]),
            None,
            &directory::NoTerminal
        )
        .unwrap_err()
        .reason,
        "not-found",
        "the session bound before is retired"
    );
    let now = directory::attempt_session(&root, &attempt, Some(&gate), &judge(&[]))
        .unwrap()
        .unwrap();
    assert_eq!(now.id, second.id);
    let again = directory::register_attempt_roles(&root, None, &attempt, &gate, &role, false, None)
        .unwrap();
    assert_eq!(
        again.id, second.id,
        "a later role registration lands on the current binding"
    );
    let _ = fs::remove_dir_all(root);
}

fn pane(pane_id: &str) -> TerminalIds {
    TerminalIds {
        driver: "herdr".into(),
        key: Some(format!("slot-{pane_id}")),
        pane_id: pane_id.into(),
        tab_id: Some(format!("tab-{pane_id}")),
        workspace_id: Some("ws-1".into()),
    }
}

fn head_ids(gen: u64) -> HeadIds {
    HeadIds {
        persona: "secretary".into(),
        name: "miu".into(),
        gen,
    }
}

fn mailbox(name: &str) -> MailboxIds {
    MailboxIds {
        fgos_dir: "/work/app/.fgos".into(),
        name: name.into(),
    }
}

fn cli(id: &str, pid: Option<u32>) -> CliSessionIds {
    CliSessionIds {
        source: "CLAUDE_CODE_SESSION_ID".into(),
        id: id.into(),
        name: Some(format!("name-{id}")),
        name_source: Some("cli".into()),
        socket: Some(format!("/run/claude/{id}.sock")),
        pid,
        start_time: pid.map(|_| "100".into()),
    }
}

fn with_ids(mut entry: Entry, ids: Ids) -> Entry {
    entry.ids = Some(ids);
    entry
}

/// The `ids` block as the entry file holds it.
fn stored_ids(root: &Path, handle: &str) -> Option<Ids> {
    directory::list(root, None, false, &judge(&[]), None)
        .unwrap()
        .sessions
        .into_iter()
        .find(|s| s.handle == handle)
        .unwrap()
        .ids
}

#[test]
fn each_identifier_group_is_replaced_whole_by_its_writer_and_every_other_group_is_kept() {
    let root = state_root();
    let alive = judge(&[]);
    let first = Ids {
        terminal: Some(pane("w1-p1")),
        head: Some(head_ids(1)),
        ..Ids::default()
    };
    directory::register(
        &root,
        with_ids(entry("aaaa", Some(10), &["lead:MAIL"]), first.clone()),
        false,
        &alive,
    )
    .unwrap();
    let held = stored_ids(&root, "claude-aaaa@fg").unwrap();
    assert_eq!(
        (held.v, held.terminal.clone(), held.head.clone()),
        (1, first.terminal.clone(), first.head.clone())
    );
    assert!(!held.updated_at.is_empty());

    // A refresh carrying only the CLI session adds it and keeps the pane and head.
    let with_cli = Ids {
        cli_session: Some(cli("c-1", None)),
        ..Ids::default()
    };
    directory::refresh_ids(&root, "fg-abc234/aaaa", "claude-aaaa@fg", &with_cli).unwrap();
    let held = stored_ids(&root, "claude-aaaa@fg").unwrap();
    assert_eq!(held.cli_session, with_cli.cli_session);
    assert_eq!(held.terminal, first.terminal);
    assert_eq!(held.head, first.head);

    // A moved pane replaces the whole terminal group: no field of the old pane survives.
    let moved = TerminalIds {
        driver: "herdr".into(),
        key: None,
        pane_id: "w2-p7".into(),
        tab_id: None,
        workspace_id: None,
    };
    let refreshed = directory::refresh_ids(
        &root,
        "fg-abc234/aaaa",
        "claude-aaaa@fg",
        &Ids {
            terminal: Some(moved.clone()),
            ..Ids::default()
        },
    )
    .unwrap();
    assert_eq!(
        refreshed.roles,
        vec!["lead:MAIL".to_string()],
        "a refresh keeps the roles"
    );
    let held = stored_ids(&root, "claude-aaaa@fg").unwrap();
    assert_eq!(held.terminal, Some(moved));
    assert_eq!(held.cli_session, with_cli.cli_session);

    // An unchanged refresh changes nothing, not even the time.
    let before = held.updated_at.clone();
    std::thread::sleep(std::time::Duration::from_millis(5));
    directory::refresh_ids(&root, "fg-abc234/aaaa", "claude-aaaa@fg", &with_cli).unwrap();
    assert_eq!(
        stored_ids(&root, "claude-aaaa@fg").unwrap().updated_at,
        before
    );

    // Registering again with the mailbox group adds it and keeps the rest and the roles.
    let again = directory::register(
        &root,
        with_ids(
            entry("aaaa", Some(10), &[]),
            Ids {
                mailbox: Some(mailbox("miu")),
                ..Ids::default()
            },
        ),
        false,
        &alive,
    )
    .unwrap();
    assert_eq!(again.roles, vec!["lead:MAIL".to_string()]);
    let held = again.ids.unwrap();
    assert_eq!(held.mailbox, Some(mailbox("miu")));
    assert_eq!(held.cli_session, with_cli.cli_session);
    assert_eq!(held.head, first.head);

    // Refused: another session's id under this handle, an unknown handle, an empty value.
    for (own, handle) in [
        ("fg-abc234/other", "claude-aaaa@fg"),
        ("fg-abc234/aaaa", "claude-zzzz@fg"),
    ] {
        assert_eq!(
            directory::refresh_ids(&root, own, handle, &with_cli)
                .unwrap_err()
                .reason,
            "not-registered"
        );
    }
    let empty = Ids {
        mailbox: Some(mailbox(" ")),
        ..Ids::default()
    };
    let refusal =
        directory::refresh_ids(&root, "fg-abc234/aaaa", "claude-aaaa@fg", &empty).unwrap_err();
    assert_eq!(refusal.reason, "invalid-ids");
    assert!(
        refusal.detail.contains("mailbox.name"),
        "{}",
        refusal.detail
    );
    assert_eq!(
        directory::register(
            &root,
            with_ids(entry("bbbb", Some(20), &[]), empty),
            false,
            &alive
        )
        .unwrap_err()
        .reason,
        "invalid-ids"
    );
    let _ = fs::remove_dir_all(root);
}

/// A terminal driver that knows one tab label.
struct OneLabel(&'static str, &'static str);

impl TerminalPort for OneLabel {
    fn tab_ids(&self, label: &str) -> Vec<String> {
        if label == self.0 {
            vec![self.1.to_string()]
        } else {
            Vec::new()
        }
    }
}

#[test]
fn a_session_resolves_from_each_identifier_it_holds_and_says_which_field_matched() {
    let root = machine_root();
    let alive = judge(&[]);
    let ids = Ids {
        cli_session: Some(cli("c-77", Some(4242))),
        terminal: Some(pane("w1-p3")),
        mailbox: Some(mailbox("miu")),
        head: Some(head_ids(2)),
        ..Ids::default()
    };
    directory::register(
        &root,
        with_ids(entry("aaaa", Some(10), &["head:secretary-miu"]), ids),
        false,
        &alive,
    )
    .unwrap();
    directory::register(&root, entry("bbbb", Some(20), &[]), false, &alive).unwrap();
    let port = OneLabel("Miu", "tab-w1-p3");
    let cases = [
        ("claude-aaaa@fg", "handle"),
        ("fg-abc234/aaaa", "id"),
        ("head:secretary-miu", "role"),
        ("10", "liveness.pid"),
        ("4242", "cliSession.pid"),
        ("/run/claude/c-77.sock", "cliSession.socket"),
        ("c-77", "cliSession.id"),
        ("name-c-77", "cliSession.name"),
        ("w1-p3", "terminal.paneId"),
        ("tab-w1-p3", "terminal.tabId"),
        ("slot-w1-p3", "terminal.key"),
        ("miu", "mailbox.name"),
        ("Miu", "terminal.tabLabel"),
    ];
    for (query, field) in cases {
        let found = directory::resolve(&root, query, &alive, None, &port)
            .unwrap_or_else(|r| panic!("{query}: {} {}", r.reason, r.detail));
        assert_eq!(found.id, "fg-abc234/aaaa", "{query}");
        assert_eq!(found.matched, vec![field.to_string()], "{query}");
        assert_eq!(
            found.ids.as_ref().unwrap().head,
            Some(head_ids(2)),
            "the whole record comes back"
        );
    }
    // A label is read live, never stored: without the driver it names nothing.
    assert_eq!(
        directory::resolve(&root, "Miu", &alive, None, &directory::NoTerminal)
            .unwrap_err()
            .reason,
        "not-found"
    );
    // Matching is exact: a prefix of a pane id is not that pane.
    assert_eq!(
        directory::resolve(&root, "w1-p", &alive, None, &port)
            .unwrap_err()
            .reason,
        "not-found"
    );
    let _ = fs::remove_dir_all(root);
}

#[test]
fn an_identifier_two_live_sessions_hold_is_ambiguous_and_each_candidate_names_its_matched_field() {
    let root = state_root();
    let alive = judge(&[]);
    let a = Ids {
        mailbox: Some(mailbox("shared")),
        ..Ids::default()
    };
    let b = Ids {
        terminal: Some(TerminalIds {
            driver: "herdr".into(),
            key: None,
            pane_id: "shared".into(),
            tab_id: None,
            workspace_id: None,
        }),
        ..Ids::default()
    };
    directory::register(
        &root,
        with_ids(entry("aaaa", Some(10), &[]), a),
        false,
        &alive,
    )
    .unwrap();
    directory::register(
        &root,
        with_ids(entry("bbbb", Some(20), &[]), b),
        false,
        &alive,
    )
    .unwrap();
    let refusal =
        directory::resolve(&root, "shared", &alive, None, &directory::NoTerminal).unwrap_err();
    assert_eq!(refusal.reason, "ambiguous");
    let mut matched: Vec<(String, Vec<String>)> = refusal
        .candidates
        .iter()
        .map(|c| (c.handle.clone(), c.matched.clone()))
        .collect();
    matched.sort();
    assert_eq!(
        matched,
        vec![
            (
                "claude-aaaa@fg".to_string(),
                vec!["mailbox.name".to_string()]
            ),
            (
                "claude-bbbb@fg".to_string(),
                vec!["terminal.paneId".to_string()]
            ),
        ]
    );
    assert!(
        refusal.detail.contains("by mailbox.name"),
        "{}",
        refusal.detail
    );
    let _ = fs::remove_dir_all(root);
}

#[test]
fn a_session_reached_only_through_a_cli_session_whose_process_ended_is_refused_stale() {
    let root = state_root();
    // The head (pid 10) lives on; the CLI session's process (pid 4242) is gone.
    let cli_gone = judge(&[4242]);
    directory::register(
        &root,
        with_ids(
            entry("aaaa", Some(10), &["lead:MAIL"]),
            Ids {
                cli_session: Some(cli("c-old", Some(4242))),
                ..Ids::default()
            },
        ),
        false,
        &cli_gone,
    )
    .unwrap();
    for query in ["c-old", "/run/claude/c-old.sock", "4242"] {
        let refusal =
            directory::resolve(&root, query, &cli_gone, None, &directory::NoTerminal).unwrap_err();
        assert_eq!(refusal.reason, "stale", "{query}");
        assert_eq!(refusal.candidates[0].handle, "claude-aaaa@fg");
    }
    // By its handle or role the session still resolves, and says its CLI session is out of date.
    let found =
        directory::resolve(&root, "lead:MAIL", &cli_gone, None, &directory::NoTerminal).unwrap();
    assert_eq!(found.stale, vec!["cliSession".to_string()]);
    // While the CLI process runs, the same identifier is an answer.
    let found =
        directory::resolve(&root, "c-old", &judge(&[]), None, &directory::NoTerminal).unwrap();
    assert!(found.stale.is_empty());
    let _ = fs::remove_dir_all(root);
}

#[test]
fn an_entry_written_before_identifiers_existed_reads_resolves_and_takes_them_on_refresh() {
    let root = machine_root();
    let dir = directory::directory(&root);
    // Register, then put back the exact bytes an older build wrote (no `ids` key).
    directory::register(
        &root,
        entry("aaaa", Some(10), &["lead:MAIL"]),
        false,
        &judge(&[]),
    )
    .unwrap();
    let file = fs::read_dir(&dir).unwrap().next().unwrap().unwrap().path();
    let old = r#"{"v":1,"id":"fg-abc234/aaaa","handle":"claude-aaaa@fg","cli":"claude","projectId":null,"clone":"/work/app","registeredAt":"2026-11-01T00:00:00.000Z","roles":["lead:MAIL"],"liveness":{"pid":10,"startTime":"100"}}"#;
    fs::write(&file, format!("{old}\n")).unwrap();
    let found = directory::resolve(
        &root,
        "lead:MAIL",
        &judge(&[]),
        None,
        &directory::NoTerminal,
    )
    .unwrap();
    assert_eq!(
        (found.id.as_str(), found.ids.as_ref()),
        ("fg-abc234/aaaa", None)
    );
    let refreshed = directory::refresh_ids(
        &root,
        "fg-abc234/aaaa",
        "claude-aaaa@fg",
        &Ids {
            mailbox: Some(mailbox("miu")),
            ..Ids::default()
        },
    )
    .unwrap();
    assert_eq!(refreshed.registered_at, "2026-11-01T00:00:00.000Z");
    assert_eq!(refreshed.roles, vec!["lead:MAIL".to_string()]);
    let text = fs::read_to_string(&file).unwrap();
    assert!(text.contains(r#""v":1,"#), "{text}");
    assert!(
        text.contains(r#""mailbox":{"fgosDir":"/work/app/.fgos","name":"miu"}"#),
        "{text}"
    );
    let _ = fs::remove_dir_all(root);
}

#[test]
fn a_refresh_racing_a_role_take_never_hands_the_role_back_or_loses_the_refresh() {
    let root = Arc::new(state_root());
    let alive = judge(&[]);
    directory::register(&root, entry("aaaa", Some(10), &[]), false, &alive).unwrap();
    directory::register(&root, entry("bbbb", Some(20), &[]), false, &alive).unwrap();
    for round in 0..12u32 {
        // aaaa holds the role; bbbb takes it while aaaa refreshes its pane.
        directory::register(&root, entry("aaaa", Some(10), &["lead:MAIL"]), true, &alive).unwrap();
        let start = Arc::new(Barrier::new(2));
        let pane_id = format!("w1-p{round}");
        let refresher = {
            let (root, start, pane_id) = (Arc::clone(&root), Arc::clone(&start), pane_id.clone());
            std::thread::spawn(move || {
                start.wait();
                directory::refresh_ids(
                    &root,
                    "fg-abc234/aaaa",
                    "claude-aaaa@fg",
                    &Ids {
                        terminal: Some(pane(&pane_id)),
                        ..Ids::default()
                    },
                )
                .unwrap();
            })
        };
        let taker = {
            let (root, start) = (Arc::clone(&root), Arc::clone(&start));
            std::thread::spawn(move || {
                start.wait();
                directory::register(
                    &root,
                    entry("bbbb", Some(20), &["lead:MAIL"]),
                    true,
                    &judge(&[]),
                )
                .unwrap();
            })
        };
        refresher.join().unwrap();
        taker.join().unwrap();
        let sessions = directory::list(&root, None, false, &alive, None)
            .unwrap()
            .sessions;
        let of = |handle: &str| sessions.iter().find(|s| s.handle == handle).unwrap();
        assert_eq!(
            of("claude-aaaa@fg").roles,
            Vec::<String>::new(),
            "round {round}: the role came back"
        );
        assert_eq!(
            of("claude-bbbb@fg").roles,
            vec!["lead:MAIL".to_string()],
            "round {round}"
        );
        assert_eq!(
            of("claude-aaaa@fg")
                .ids
                .as_ref()
                .and_then(|ids| ids.terminal.clone()),
            Some(pane(&pane_id)),
            "round {round}: the refresh was lost"
        );
    }
    let _ = fs::remove_dir_all(&*root);
}
