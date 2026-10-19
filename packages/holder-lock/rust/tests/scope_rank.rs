#![cfg(unix)]
mod common;
use fgos_holder_lock::{
    acquire, probe, release, Acquire, BorrowedHandle, LockScope, Mode, Probe, Resource, ScopeError,
    Wait,
};
use std::collections::BTreeMap;

fn held(root: &std::path::Path, name: &str) -> fgos_holder_lock::Handle {
    match acquire(
        &Resource::new(name, root.join(format!("{name}.lock"))),
        Mode::Ex,
        Wait::Try,
        2000,
    ) {
        Acquire::Acquired(h) => h,
        other => panic!("{other:?}"),
    }
}

#[test]
fn every_r30_acquisition_profile_against_every_held_rank_subset() {
    let _serial = common::serial();
    let root = common::temp_dir("scope-r30");
    let names = [
        "runner",
        "attempt",
        "merge-slot",
        "dispatch-cwd",
        "worktree-admin",
        "main-checkout",
        "event-seal",
        "state",
        "event-append",
        "activation",
    ];
    let owners: Vec<_> = names.iter().map(|name| held(&root, name)).collect();
    // R30 rows with acquisitions, including recovery's final rank-80 leaf.
    // Rows with no acquire (linked commit, sync, restore, publication, Remote)
    // cannot invert an order: their separate admission policy is Git's job.
    let profiles: &[&[&str]] = &[
        &["main-checkout"],
        &["merge-slot", "worktree-admin", "main-checkout"],
        &["worktree-admin"],
        &["repo-config"],
        &["merge-slot", "worktree-admin", "main-checkout", "recovery"],
        &["worktree-admin", "recovery"],
        &["main-checkout", "recovery"],
        &["recovery"],
    ];
    for mask in 0usize..(1 << owners.len()) {
        let copies = owners
            .iter()
            .enumerate()
            .filter(|(i, _)| mask & (1 << i) != 0)
            .map(|(_, h)| BorrowedHandle::new(h).unwrap())
            .collect();
        let scope = LockScope::seeded(copies).unwrap();
        let held_max = scope
            .holding()
            .unwrap()
            .iter()
            .map(|h| h.rank)
            .max()
            .unwrap_or(0);
        for profile in profiles {
            // The first acquisition decides admission; subsequent acquisitions
            // in each profile are strictly increasing in the registry.
            let first = profile[0];
            let rank = fgos_holder_lock::scope::rank(first).unwrap();
            assert_eq!(
                scope.assert_can_acquire(first).is_ok(),
                rank > held_max,
                "mask={mask}, profile={profile:?}"
            );
            for pair in profile.windows(2) {
                assert!(
                    fgos_holder_lock::scope::rank(pair[0]).unwrap()
                        < fgos_holder_lock::scope::rank(pair[1]).unwrap()
                );
            }
        }
    }
    for h in owners {
        release(h);
    }
    std::fs::remove_dir_all(root).unwrap();
}

#[test]
fn scope_acquires_exact_template_refuses_before_io_and_closes_before_return() {
    let _serial = common::serial();
    let root = common::temp_dir("scope-acquire");
    let params = BTreeMap::from([("fgosDir".into(), root.to_str().unwrap().into())]);
    let resource = Resource::new("worktree-admin", root.join("locks/worktree-admin.lock"));
    {
        let mut scope = LockScope::seeded(vec![]).unwrap();
        scope.acquire("worktree-admin", &params, Wait::Try).unwrap();
        assert_eq!(probe(&resource).unwrap(), Probe::Held);
        assert!(matches!(
            scope.acquire("worktree-admin", &BTreeMap::new(), Wait::Try),
            Err(ScopeError::Order { .. })
        ));
        assert!(matches!(
            scope.acquire("merge-slot", &BTreeMap::new(), Wait::Try),
            Err(ScopeError::Order { .. })
        ));
        // Another scope sees no process-wide ranks, only kernel exclusion.
        let mut other = LockScope::seeded(vec![]).unwrap();
        assert!(matches!(
            other.acquire("worktree-admin", &params, Wait::Try),
            Err(ScopeError::Acquire(_))
        ));
    }
    assert_eq!(probe(&resource).unwrap(), Probe::Free);
    let owner = held(&root, "main-checkout");
    let mut scope = LockScope::seeded(vec![BorrowedHandle::new(&owner).unwrap()]).unwrap();
    let absent = root.join("must-not-create");
    let params = BTreeMap::from([("fgosDir".into(), absent.to_str().unwrap().into())]);
    assert!(matches!(
        scope.acquire("worktree-admin", &params, Wait::Try),
        Err(ScopeError::Order { .. })
    ));
    assert!(!absent.exists());
    drop(scope);
    assert_eq!(
        probe(&Resource::new("main-checkout", owner.path())).unwrap(),
        Probe::Held
    );
    release(owner);
    std::fs::remove_dir_all(root).unwrap();
}

#[test]
fn registry_matches_node_for_every_row() {
    let output = std::process::Command::new("node").args(["--input-type=module", "-e", "import {loadLockRegistry,lockEntry} from './src/holder-lock/registry.mjs'; console.log(JSON.stringify(loadLockRegistry().locks.map(l => [l.name,lockEntry(l.name).rank])))"])
        .current_dir(std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../.."))
        .output().unwrap();
    assert!(output.status.success(), "{:?}", output);
    let rows: Vec<(String, u64)> = serde_json::from_slice(&output.stdout).unwrap();
    for (name, rank) in rows {
        assert_eq!(fgos_holder_lock::scope::rank(&name).unwrap(), rank);
    }
}

#[test]
fn borrowed_copy_never_unlocks_owner_and_replaced_authority_is_refused() {
    let _serial = common::serial();
    let root = common::temp_dir("scope-copy");
    let owner = held(&root, "dispatch-cwd");
    let copy = BorrowedHandle::new(&owner).unwrap();
    let path = owner.path().to_owned();
    drop(copy);
    assert_eq!(
        probe(&Resource::new("dispatch-cwd", &path)).unwrap(),
        Probe::Held
    );
    let copy = BorrowedHandle::new(&owner).unwrap();
    let duplicate = BorrowedHandle::new(&owner).unwrap();
    assert!(matches!(
        LockScope::seeded(vec![copy, duplicate]),
        Err(ScopeError::InvalidHandle(_))
    ));
    let scope = LockScope::seeded(vec![BorrowedHandle::new(&owner).unwrap()]).unwrap();
    std::fs::rename(&path, root.join("old-lock")).unwrap();
    std::fs::write(&path, b"").unwrap();
    assert!(scope.validate().is_err());
    assert!(BorrowedHandle::new(&owner).is_err());
    drop(scope);
    release(owner);
    std::fs::remove_dir_all(root).unwrap();
}

#[test]
#[cfg(target_os = "linux")]
fn borrowed_handle_runs_through_the_existing_io_door_without_extra_inherited_copies() {
    let _serial = common::serial();
    let root = common::temp_dir("scope-io");
    let owner = held(&root, "dispatch-cwd");
    let copy = BorrowedHandle::new(&owner).unwrap();
    let spec = fgos_holder_lock::BorrowSpec {
        argv: vec!["python3".into(), "-c".into(), "import os; key=(os.fstat(3).st_dev,os.fstat(3).st_ino); matches=[]\nfor fd in os.listdir('/proc/self/fd'):\n try:\n  st=os.fstat(int(fd))\n  if (st.st_dev,st.st_ino)==key: matches.append(int(fd))\n except OSError: pass\nprint(matches)".into()],
        ..Default::default()
    };
    let result = fgos_holder_lock::run_borrowed_io(
        &copy,
        &spec,
        &fgos_holder_lock::BorrowIo {
            stdin: vec![],
            stdout_limit: 4096,
            stderr_limit: 4096,
            deadline: std::time::Instant::now() + std::time::Duration::from_secs(10),
        },
    )
    .unwrap();
    assert_eq!(result.outcome.exit, Some(0));
    assert_eq!(result.stdout, b"[3]\n");
    drop(copy);
    assert_eq!(
        probe(&Resource::new("dispatch-cwd", owner.path())).unwrap(),
        Probe::Held
    );
    release(owner);
    std::fs::remove_dir_all(root).unwrap();
}
