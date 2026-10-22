//! The machine id: validity, read, atomic mint, alias, and the handle derived
//! from it. This file owns the machine-id rule; owners of other formats
//! (Event Store refs) call it and test only their own mapping.

use fgos_identity::machine::{self, valid_machine_id};
use fgos_identity::text::{base32_prefix, slug};
use fgos_identity::Error;
use std::fs;
use std::path::PathBuf;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Barrier};

static NEXT: AtomicU64 = AtomicU64::new(0);

fn state_root() -> PathBuf {
    let dir = std::env::temp_dir().join(format!(
        "fgos-identity-machine-{}-{}",
        std::process::id(),
        NEXT.fetch_add(1, Ordering::Relaxed)
    ));
    fs::create_dir_all(&dir).unwrap();
    dir
}

#[test]
fn machine_id_shape_is_two_to_sixty_three_lowercase_characters() {
    for bad in ["", "a", "-ab", "Ab", "a/b", "a b"] {
        assert!(!valid_machine_id(bad), "{bad:?}");
    }
    assert!(valid_machine_id("ab"));
    assert!(valid_machine_id("4f-server-abc234"));
    assert!(valid_machine_id(&"a".repeat(63)));
    assert!(!valid_machine_id(&"a".repeat(64)));
}

#[test]
fn read_reports_missing_invalid_and_valid_ids_apart() {
    let root = state_root();
    assert!(matches!(machine::read(&root), Err(Error::Missing(_))));
    fs::write(root.join("machine-id"), "BAD\n").unwrap();
    assert!(matches!(machine::read(&root), Err(Error::Invalid(_))));
    fs::write(root.join("machine-id"), "home-abc123\r\n").unwrap();
    assert_eq!(machine::read(&root).unwrap(), "home-abc123");
    let _ = fs::remove_dir_all(root);
}

#[test]
fn concurrent_mints_install_one_complete_id_and_never_replace_it() {
    let root = state_root();
    let barrier = Arc::new(Barrier::new(8));
    let results = std::thread::scope(|scope| {
        let threads: Vec<_> = (0..8)
            .map(|_| {
                let barrier = barrier.clone();
                let root = &root;
                scope.spawn(move || {
                    barrier.wait();
                    machine::mint(root, "A HOST").unwrap()
                })
            })
            .collect();
        threads.into_iter().map(|t| t.join().unwrap()).collect::<Vec<_>>()
    });
    assert_eq!(results.iter().filter(|(created, _)| *created).count(), 1);
    assert!(results.iter().all(|(_, id)| id == &results[0].1));
    assert!(results[0].1.starts_with("a-host-"));
    assert!(valid_machine_id(&results[0].1));
    assert_eq!(
        machine::mint(&root, "another-host").unwrap(),
        (false, results[0].1.clone())
    );
    assert!(fs::read_dir(&root)
        .unwrap()
        .all(|e| e.unwrap().file_name() == "machine-id"));
    let _ = fs::remove_dir_all(root);
}

#[test]
fn mint_refuses_a_hostname_without_slug_characters() {
    let root = state_root();
    assert!(matches!(machine::mint(&root, "世界!"), Err(Error::Invalid(_))));
    assert!(!root.join("machine-id").exists());
    let _ = fs::remove_dir_all(root);
}

#[test]
fn handle_drops_the_suffix_prefixes_a_leading_digit_and_cuts_to_forty() {
    assert_eq!(machine::handle("fg-server-abc234", None), "fg-server");
    assert_eq!(machine::handle("4f-server-abc234", None), "m-4f-server");
    assert_eq!(machine::handle("laptop", None), "laptop");
    let long = format!("{}-abc234", "a".repeat(56));
    assert_eq!(machine::handle(&long, None), "a".repeat(40));
    let hyphen_cut = format!("{}-b{}-abc234", "a".repeat(39), "c".repeat(10));
    assert_eq!(machine::handle(&hyphen_cut, None), "a".repeat(39));
    assert_eq!(machine::handle("fg-server-abc234", Some("owner")), "owner");
}

#[test]
fn every_derived_handle_follows_the_convention_machine_handle_rule() {
    let rule = fgos_convention::rules::packaged_rules();
    let rule = rule.identifier("machine-handle").expect("machine-handle kind");
    let ids = [
        "fg-server-abc234",
        "4f-server-abc234",
        "9-abc234",
        "x-abc234",
        "laptop",
        "00",
    ];
    for id in ids {
        let handle = machine::handle(id, None);
        assert_eq!(rule.check(&handle), Ok(()), "{id} -> {handle}");
    }
    let long = format!("{}-abc234", "a".repeat(56));
    assert_eq!(rule.check(&machine::handle(&long, None)), Ok(()));
}

#[test]
fn alias_round_trips_and_replaces_atomically() {
    let root = state_root();
    assert_eq!(machine::read_alias(&root).unwrap(), None);
    machine::write_alias(&root, "owner").unwrap();
    assert_eq!(machine::read_alias(&root).unwrap().as_deref(), Some("owner"));
    machine::write_alias(&root, "lab").unwrap();
    assert_eq!(machine::read_alias(&root).unwrap().as_deref(), Some("lab"));
    let _ = fs::remove_dir_all(root);
}

#[test]
fn slug_collapses_runs_and_trims_separators() {
    assert_eq!(slug("A HOST"), "a-host");
    assert_eq!(slug("--Foo__Bar--"), "foo-bar");
    assert_eq!(slug("世界/?!"), "");
}

#[test]
fn base32_prefix_matches_rfc_4648() {
    assert_eq!(base32_prefix(b"foob", 6), "mzxw6y");
    assert_eq!(base32_prefix(b"foobar", 4), "mzxw");
}
