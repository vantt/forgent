//! Owning proof of the machine view: the global file, the accounts file when unconfined and the
//! standard, never a project file. Real files in temp directories, the bundled schemas and standard.
mod common;

use std::fs;

use fgos_config::detect::NoDetectors;
use fgos_config::machine::{context, snapshot};
use fgos_config::snapshot::{AccountsState, SessionClass, SnapshotError};

fn lay(id: &str, files: &[(&str, &str)]) -> std::path::PathBuf {
    let dir = common::temp("machine-view", id);
    for (rel, text) in files {
        let path = dir.join(rel);
        fs::create_dir_all(path.parent().unwrap()).unwrap();
        fs::write(path, text).unwrap();
    }
    dir.join("home/.fgos")
}

const ACCOUNTS: &str = "runner:\n  llmAccounts:\n    main:\n      acc1: {login: ~/.one}\n";

#[test]
fn a_global_value_wins_over_the_standard_and_a_standard_value_names_its_bundled_file() {
    let global = lay(
        "layers",
        &[("home/.fgos/config.yaml", "gateway:\n  port: 5555\n")],
    );
    let ctx = context(&NoDetectors).unwrap();
    let snap = snapshot(&ctx, &global, SessionClass::Unconfined).unwrap();
    assert_eq!(snap.value["gateway"]["port"], 5555);
    assert_eq!(snap.value["gateway"]["bind"], "0.0.0.0");
    let layer = |name: &str| {
        let wanted = [name.to_string()];
        let found = snap.origins.iter().find(|o| {
            let names: Vec<_> = o.path.iter().map(|s| format!("{s:?}")).collect();
            names.len() == 2 && names[1].contains(&wanted[0])
        });
        found.map(|o| (o.provenance.layer, o.provenance.file.clone()))
    };
    assert_eq!(layer("port").map(|l| l.0), Some("global"));
    let (layer_of_bind, file) = layer("bind").unwrap();
    assert_eq!(layer_of_bind, "standard");
    assert!(
        file.unwrap().contains("gateway"),
        "the standard file of the section"
    );
}

#[test]
fn a_project_file_is_never_read_so_it_cannot_fail_or_change_the_machine_value() {
    // The project beside this home holds a global-only section, which would fail a project read.
    let global = lay(
        "no-project",
        &[("project/.fgos/config.yaml", "gateway:\n  port: 1\n")],
    );
    let ctx = context(&NoDetectors).unwrap();
    let snap = snapshot(&ctx, &global, SessionClass::Unconfined).unwrap();
    assert_eq!(snap.value["gateway"]["port"], 4170);
    assert!(!snap.revisions.contains_key("project"));
}

#[test]
fn accounts_are_in_the_view_only_when_unconfined() {
    let global = lay(
        "accounts",
        &[("home/.fgos/private/accounts.yaml", ACCOUNTS)],
    );
    let ctx = context(&NoDetectors).unwrap();
    let open = snapshot(&ctx, &global, SessionClass::Unconfined).unwrap();
    assert_eq!(
        open.value["runner"]["llmAccounts"]["main"]["acc1"]["login"],
        "~/.one"
    );
    assert_eq!(open.accounts, AccountsState::Present);
    let confined = snapshot(&ctx, &global, SessionClass::Confined).unwrap();
    assert!(confined.value["runner"].get("llmAccounts").is_none());
    assert_eq!(confined.accounts, AccountsState::UnavailableConfined);
    assert!(!confined.revisions.contains_key("accounts"));
}

#[test]
fn a_broken_global_file_fails_the_view_by_id() {
    let global = lay(
        "broken",
        &[("home/.fgos/config.yaml", "gateway: [unclosed\n")],
    );
    let ctx = context(&NoDetectors).unwrap();
    match snapshot(&ctx, &global, SessionClass::Unconfined) {
        Err(SnapshotError::Refused(all)) => assert_eq!(all[0].code, "config-parse"),
        other => panic!("{:?}", other.map(|s| s.value)),
    }
}

#[test]
fn the_bundled_context_is_shared_not_rebuilt() {
    let (a, b) = (
        context(&NoDetectors).unwrap(),
        context(&NoDetectors).unwrap(),
    );
    assert!(std::ptr::eq(a.schemas, b.schemas) && std::ptr::eq(a.standard, b.standard));
}
