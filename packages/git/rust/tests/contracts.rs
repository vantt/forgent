use fgos_git::{ObjectFormat, Oid, RefName};
#[test]
fn validates_both_object_formats() {
    assert!(Oid::parse(&"a".repeat(40), ObjectFormat::Sha1).is_ok());
    assert!(Oid::parse(&"0".repeat(64), ObjectFormat::Sha256).is_ok());
    for invalid in [
        "a".repeat(40),
        "g".repeat(64),
        "A".repeat(64),
        "a".repeat(63),
    ] {
        assert!(Oid::parse(&invalid, ObjectFormat::Sha256).is_err());
    }
}
#[test]
fn ref_syntax_matches_git_for_literal_candidates() {
    // A real repository in the OS temp directory; no production repo writes.
    let dir = std::env::temp_dir().join(format!("fgos-git-contract-{}", std::process::id()));
    std::fs::create_dir(&dir).unwrap();
    assert!(std::process::Command::new("git")
        .args(["init", "--bare", "--quiet"])
        .arg(&dir)
        .status()
        .unwrap()
        .success());
    for name in [
        "refs/fgos/events/machine",
        "refs/heads/feature",
        "HEAD",
        "refs/a..b",
        "refs/a.lock",
        "refs/a//b",
        "refs/.hidden",
        "refs/a@{b",
        "refs/a b",
        "refs/a?b",
        "refs/a/",
        "refs/a.",
    ] {
        let git = std::process::Command::new("git")
            .current_dir(&dir)
            .args(["check-ref-format", name])
            .status()
            .unwrap();
        assert_eq!(RefName::parse(name).is_ok(), git.success(), "{name}");
    }
    std::fs::remove_dir_all(dir).unwrap();
}
#[test]
fn result_codes_match_machine_contract() {
    let contract: serde_json::Value =
        serde_json::from_str(include_str!("../../contracts/result-codes.v1.json")).unwrap();
    let codes = [
        fgos_git::ResultCode::Unchanged,
        fgos_git::ResultCode::Created,
        fgos_git::ResultCode::Committed,
        fgos_git::ResultCode::Landed,
        fgos_git::ResultCode::ConflictedOpen,
        fgos_git::ResultCode::ConflictAborted,
        fgos_git::ResultCode::Busy,
        fgos_git::ResultCode::Stale,
        fgos_git::ResultCode::Refused,
        fgos_git::ResultCode::Cancelled,
        fgos_git::ResultCode::Failed,
        fgos_git::ResultCode::PublishedCheckoutPending,
        fgos_git::ResultCode::CommittedButContractViolation,
        fgos_git::ResultCode::RemoteOutcomeUnknown,
        fgos_git::ResultCode::RecoveryRequired,
        fgos_git::ResultCode::Superseded,
    ];
    assert_eq!(serde_json::to_value(codes).unwrap(), contract["codes"]);
}

#[cfg(windows)]
#[test]
fn lock_taking_git_refuses_windows_by_name() {
    assert_eq!(
        fgos_git::require_lock_scope_platform().unwrap_err().cause,
        "git-lockscope-unavailable-windows"
    );
}
