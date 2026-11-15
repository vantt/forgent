//! The doctor rows of the Observe component. Both are read-only: the Observe directory is never created by a
//! doctor run (the store creates it on its first write), and the friction store is read, not touched.

use fgos_distribution::doctor::{FixResult, RowOutcome, RowResult};
use std::path::{Path, PathBuf};

pub const ROW_IDS: &[&str] = &["observe-dir-writable", "observe-host-resolvable"];

fn no_fixes(_: &Path, ids: &[&str]) -> Vec<FixResult> {
    ids.iter()
        .map(|id| FixResult::done(id, false, format!("no fix {id} is run in process")))
        .collect()
}

/// The adapter the doctor registers for the observe rows (there is no observe fix).
pub const GROUP: super::Rows = super::Rows {
    rows: ROW_IDS,
    fixes: &[],
    judge: judge_rows,
    fix: no_fixes,
};

fn row(passed: bool, message: String) -> RowOutcome {
    RowOutcome::Judged(RowResult {
        passed,
        status: None,
        message: Some(message),
        fix_command: None,
        detail: None,
    })
}

/// pass when `.fgos/observe` can take a shard or does not exist yet; fail when it exists and cannot.
pub fn dir_writable_row(root: &Path) -> RowOutcome {
    match fgos_observe::shard::probe_observe_dir(root) {
        Ok(false) => row(
            true,
            "info: .fgos/observe does not exist yet; the observe store creates it on first write"
                .into(),
        ),
        Ok(true) => row(true, ".fgos/observe is writable".into()),
        Err(error) => row(false, format!(".fgos/observe is not writable: {error}")),
    }
}

/// A real read of the friction store by this host, so a store it refuses (a symlinked directory or shard, an
/// I/O error) fails the row instead of passing on a ping.
pub fn host_resolvable_row(root: &Path, host: &Path) -> RowOutcome {
    match fgos_observe::friction::rank(root, Some(1)) {
        Ok(_) => row(
            true,
            format!(
                "host binary at {} resolved and verified (friction store readable)",
                host.display()
            ),
        ),
        Err(why) => row(
            false,
            format!(
                "host binary at {} failed the friction read probe: fgos: error: invocation failed: provider failed: {why}",
                host.display()
            ),
        ),
    }
}

/// Judges the Observe rows `ids` of the project at `root`.
pub fn judge_rows(root: &Path, ids: &[&str]) -> Vec<RowOutcome> {
    let host = std::env::current_exe().unwrap_or_else(|_| PathBuf::from("fgos"));
    ids.iter()
        .map(|id| match *id {
            "observe-dir-writable" => dir_writable_row(root),
            "observe-host-resolvable" => host_resolvable_row(root, &host),
            other => RowOutcome::Unavailable {
                message: format!("no observe row {other}"),
                next: "run fgos doctor again".to_owned(),
            },
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn temp(tag: &str) -> PathBuf {
        let dir =
            std::env::temp_dir().join(format!("fgos-doctor-observe-{tag}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    fn message(outcome: RowOutcome) -> (bool, String) {
        match outcome {
            RowOutcome::Judged(result) => (result.passed, result.message.unwrap()),
            RowOutcome::Unavailable { message, .. } => panic!("{message}"),
        }
    }

    #[test]
    fn a_doctor_run_in_a_repository_with_no_setup_writes_nothing_under_the_observe_directory() {
        let root = temp("fresh");
        let (passed, text) = message(dir_writable_row(&root));
        assert!(
            passed && text.starts_with("info: .fgos/observe does not exist yet"),
            "{text}"
        );
        let (passed, text) = message(host_resolvable_row(&root, Path::new("/h/fgos")));
        assert!(passed && text.contains("friction store readable"), "{text}");
        assert!(
            !root.join(".fgos").exists(),
            "a read never creates the directory"
        );
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn an_existing_observe_directory_is_proven_writable_and_left_as_it_was() {
        let root = temp("existing");
        fs::create_dir_all(root.join(".fgos/observe")).unwrap();
        assert_eq!(
            message(dir_writable_row(&root)),
            (true, ".fgos/observe is writable".into())
        );
        assert_eq!(fs::read_dir(root.join(".fgos/observe")).unwrap().count(), 0);
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn a_friction_store_the_host_refuses_fails_the_row_with_the_cause() {
        #[cfg(unix)]
        {
            let root = temp("symlinked");
            fs::create_dir_all(root.join(".fgos/observe")).unwrap();
            fs::create_dir_all(root.join("real")).unwrap();
            std::os::unix::fs::symlink(root.join("real"), root.join(".fgos/observe/friction"))
                .unwrap();
            let (passed, text) = message(host_resolvable_row(&root, Path::new("/h/fgos")));
            assert!(!passed);
            assert!(
                text.starts_with("host binary at /h/fgos failed the friction read probe: fgos: error: invocation failed: provider failed: observe store component must be a real directory"),
                "{text}"
            );
            let _ = fs::remove_dir_all(root);
        }
    }
}
