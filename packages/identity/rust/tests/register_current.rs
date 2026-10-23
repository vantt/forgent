//! Registering the calling session in process: the entry carries the id and
//! handle the writer-id rule gives this process, and resolving that handle
//! finds it. Its own file because it sets the session id in the environment,
//! which no other test in a shared binary may race with.

use fgos_identity::current::current_session;
use fgos_identity::directory;
use fgos_identity::machine;
use fgos_process::facts::judge_here;

#[test]
fn registering_the_current_session_names_it_by_its_own_handle() {
    let root = std::env::temp_dir().join(format!("fgos-identity-current-{}", std::process::id()));
    std::fs::create_dir_all(&root).unwrap();
    machine::mint(&root, "testhost").unwrap();
    // SAFETY: this binary holds one test, so nothing else reads the environment meanwhile.
    unsafe { std::env::set_var("CLAUDE_CODE_SESSION_ID", "0f0e0d0c-aaaa-bbbb-cccc-111122223333") };
    let pid = std::process::id();

    let own = current_session(&root, pid, None).unwrap();
    assert!(own.info.handle.starts_with("claude-"), "{}", own.info.handle);
    assert_eq!(
        directory::resolve(&root, &own.info.handle, &judge_here).unwrap_err().reason,
        "not-found",
        "a session is not in the directory before it registers"
    );

    let roles = vec!["lead:IDENT".to_string()];
    let listed = directory::register_current(&root, pid, None, Some(root.as_path()), &roles, false).unwrap();
    assert_eq!(listed.handle, own.info.handle);
    assert_eq!(listed.id, own.info.id);
    assert_eq!(listed.roles, roles);
    let found = directory::resolve(&root, &own.info.handle, &judge_here).unwrap();
    assert_eq!(found.id, own.info.id);
    assert_eq!(directory::resolve(&root, "lead:IDENT", &judge_here).unwrap().handle, own.info.handle);
}
