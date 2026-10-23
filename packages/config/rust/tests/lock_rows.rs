//! Owning proof that the registry rows say what the crate's constants say, and that a config lock
//! nests where the rank rule lets a leaf nest. The registry's schema validity is proven by the Node
//! registry contract test.
#![cfg(unix)]
use fgos_config::locks::{scope_params, GLOBAL_CONFIG, PROJECT_CONFIG, RANK};
use fgos_holder_lock::scope::rank;
use fgos_holder_lock::{
    acquire, Acquire, BorrowedHandle, Handle, LockScope, Mode, Resource, ScopeError, Wait,
};
use serde_json::Value;
use std::path::Path;

fn registry() -> Value {
    serde_json::from_str(include_str!(
        "../../../holder-lock/contracts/lock-registry.v1.json"
    ))
    .expect("registry parses")
}

#[test]
fn registry_rows_match_the_names_ranks_and_paths_of_the_crate() {
    let registry = registry();
    let rows = registry["locks"].as_array().expect("locks");
    for (name, scope, template) in [
        (
            PROJECT_CONFIG,
            "repo",
            "<fgosDir>/locks/project-config.lock",
        ),
        (GLOBAL_CONFIG, "machine", "<lockRoot>/global-config.lock"),
    ] {
        let row = rows.iter().find(|r| r["name"] == name).expect("row exists");
        assert_eq!(row["kind"], "mutex", "{name}");
        assert_eq!(row["scope"], scope, "{name}");
        assert_eq!(row["rank"], RANK, "{name}");
        assert_eq!(row["owner"], "config", "{name}");
        assert_eq!(row["v3Path"], template, "{name}");
        assert!(
            registry["ranks"][RANK.to_string()]["kinds"]
                .as_array()
                .expect("kinds")
                .iter()
                .any(|k| k == "mutex"),
            "rank {RANK} admits mutex"
        );
        assert_eq!(rank(name).expect("rank resolves"), RANK, "{name}");
    }
}

#[test]
fn template_parameters_come_from_the_fgos_dir_and_the_lock_root() {
    let params = scope_params(Path::new("/p/.fgos"), Path::new("/m/locks"));
    assert_eq!(params["fgosDir"], "/p/.fgos");
    assert_eq!(params["lockRoot"], "/m/locks");
}

fn hold(root: &Path, name: &str) -> Handle {
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
fn a_config_lock_nests_inside_main_checkout_and_never_inside_another_leaf() {
    let root = std::env::temp_dir().join(format!("fgos-config-lock-rows-{}", std::process::id()));
    std::fs::create_dir_all(&root).expect("temp dir");
    let main_checkout = hold(&root, "main-checkout");
    let install = hold(&root, "install");
    let under_main = LockScope::seeded(vec![BorrowedHandle::new(&main_checkout).unwrap()]).unwrap();
    let under_leaf = LockScope::seeded(vec![BorrowedHandle::new(&install).unwrap()]).unwrap();
    for name in [PROJECT_CONFIG, GLOBAL_CONFIG] {
        under_main
            .assert_can_acquire(name)
            .expect("leaf under rank 50");
        assert!(
            matches!(
                under_leaf.assert_can_acquire(name),
                Err(ScopeError::Order { .. })
            ),
            "{name} under a held leaf is refused"
        );
    }
    drop((under_main, under_leaf));
    std::fs::remove_dir_all(&root).ok();
}
