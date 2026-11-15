//! The holder-lock doctor rows and their fix, judged in process by `fgos-holder-lock`: the driver's guarantee and
//! the two-process probe on each lock directory, the borrow vectors, the pointer to `fgos lock-status`, and the
//! creation of the lock directories. The crate decides every fact; this file words them for the report.

use super::Rows;
use fgos_distribution::doctor::{FixResult, RowOutcome, RowResult};
use fgos_holder_lock::borrow_vectors::{self, RunError};
use fgos_holder_lock::port::{self, Guarantee, Level};
use fgos_holder_lock::semantics::two_process_probe;
use fgos_holder_lock::state_root::{create_state_root, state_root};
use fgos_holder_lock::{HelperExe, DEFAULT_KILL_WAIT_MS};
use std::io;
use std::path::{Path, PathBuf};
use std::sync::mpsc;
use std::time::Duration;

pub const ROWS: &[&str] = &[
    "lock-kernel-semantics",
    "lock-borrow-vectors",
    "lock-holders",
];
pub const FIXES: &[&str] = &["lock-dirs"];

pub const GROUP: Rows = Rows {
    rows: ROWS,
    fixes: FIXES,
    judge,
    fix,
};

/// How long the borrow vectors may run before the row gives up on them (they take well under a second).
const BORROW_VECTORS_TIMEOUT: Duration = Duration::from_secs(30);
const MAX_LISTED: usize = 5;

fn judge(root: &Path, ids: &[&str]) -> Vec<RowOutcome> {
    ids.iter()
        .map(|id| match *id {
            "lock-kernel-semantics" => kernel_semantics(&lock_dirs(root)),
            "lock-borrow-vectors" => borrow_vectors_row(),
            "lock-holders" => holders_pointer(),
            other => unreachable!("holder-lock group asked for row {other}"),
        })
        .collect()
}

fn fix(root: &Path, ids: &[&str]) -> Vec<FixResult> {
    ids.iter()
        .map(|id| match *id {
            "lock-dirs" => fix_lock_dirs(&lock_dirs(root)),
            other => unreachable!("holder-lock group asked for fix {other}"),
        })
        .collect()
}

fn judged(passed: bool, message: String) -> RowOutcome {
    RowOutcome::Judged(RowResult {
        passed,
        status: None,
        message: Some(message),
        fix_command: None,
        detail: None,
    })
}

fn warn(text: &str) -> String {
    format!("warning: {text}")
}

fn listed(items: &[String]) -> String {
    let head = items
        .iter()
        .take(MAX_LISTED)
        .cloned()
        .collect::<Vec<_>>()
        .join("; ");
    if items.len() > MAX_LISTED {
        format!("{head}; and {} more", items.len() - MAX_LISTED)
    } else {
        head
    }
}

/// The two lock directories a workspace uses, workspace first: `<root>/.fgos/locks` and the machine lock root.
struct LockDirs {
    workspace: PathBuf,
    machine: PathBuf,
    /// What decided the machine's state root (`pinned`, `home`, ...) and the root itself, for the row's facts.
    state_root: PathBuf,
    source: &'static str,
}

impl LockDirs {
    fn both(&self) -> [(&'static str, &Path); 2] {
        [("workspace", &self.workspace), ("machine", &self.machine)]
    }
}

fn lock_dirs(root: &Path) -> LockDirs {
    let (state, source) = state_root();
    LockDirs {
        workspace: root.join(".fgos").join("locks"),
        machine: state.join("locks"),
        state_root: state,
        source: source.as_str(),
    }
}

// lock-kernel-semantics ------------------------------------------------------------------------------------

/// The guarantee as the row shows it: the four contract fields, compact, in the contract's order.
fn guarantee_shape(guarantee: &Guarantee) -> String {
    let word = |text: &str| serde_json::to_string(text).expect("a string is plain data");
    format!(
        "{{\"driver\":{},\"exclusion\":{},\"borrow\":{},\"holders\":{}}}",
        word(guarantee.driver),
        word(guarantee.exclusion.as_str()),
        word(guarantee.borrow.as_str()),
        word(guarantee.holders.as_str()),
    )
}

/// Why a guarantee refuses the locks, or `None` when the driver can exclude there.
fn guarantee_refusal(label: &str, dir: &Path, guarantee: &Guarantee) -> Option<String> {
    let shape = guarantee_shape(guarantee);
    let dir = dir.display();
    match guarantee.exclusion {
        Level::Unsupported => Some(format!(
            "{label} {dir} {shape}: holder-lock has no driver on {}; gateway, sessions, runner, dispatch, advance, recovery and the provider locks cannot run here",
            guarantee.platform
        )),
        Level::None => {
            let notes = guarantee.notes.join("; ");
            Some(format!(
                "{label} {dir} {shape}: the filesystem gives no lock exclusion ({}); move the state root or the workspace to a local disk",
                if notes.is_empty() { "network filesystem" } else { &notes }
            ))
        }
        _ => None,
    }
}

/// For `<fgosDir>/locks` and `<lockRoot>`: the driver's guarantee, then the two-process probe on that same
/// mount. A kernel guarantee with a green probe passes; a platform with no driver and a network filesystem
/// fail by name; a missing directory warns (the fix creates it).
fn kernel_semantics(dirs: &LockDirs) -> RowOutcome {
    let helper = HelperExe::current();
    let mut failures = Vec::new();
    let mut warnings = Vec::new();
    let mut passes = Vec::new();
    for (label, dir) in dirs.both() {
        if !dir.is_dir() {
            warnings.push(format!(
                "{label} {} does not exist yet, not measured (fgos doctor --fix creates it)",
                dir.display()
            ));
            continue;
        }
        let guarantee = port::guarantee(dir);
        let shape = guarantee_shape(&guarantee);
        if let Some(refusal) = guarantee_refusal(label, dir, &guarantee) {
            failures.push(refusal);
            continue;
        }
        let probe = match &helper {
            Ok(helper) => two_process_probe(dir, helper),
            Err(error) => Err(format!("the running executable is unknown: {error}")),
        };
        match probe {
            Ok(_) => passes.push(format!(
                "{label} {} {shape}, two-process probe green",
                dir.display()
            )),
            Err(error) => failures.push(format!(
                "{label} {} {shape}: two-process probe failed: {error}",
                dir.display()
            )),
        }
    }
    // The two fixed facts of the lock layer stay visible: the state root the locks live under and the
    // predecessor kill wait.
    let facts = [
        format!("stateRoot {} ({})", dirs.state_root.display(), dirs.source),
        format!("killWaitMs {DEFAULT_KILL_WAIT_MS} (fixed)"),
    ];
    let all = failures
        .iter()
        .chain(&warnings)
        .chain(&passes)
        .chain(&facts)
        .cloned()
        .collect::<Vec<_>>()
        .join("; ");
    if !failures.is_empty() {
        judged(false, all)
    } else if !warnings.is_empty() {
        judged(true, warn(&all))
    } else {
        judged(true, all)
    }
}

// lock-borrow-vectors --------------------------------------------------------------------------------------

/// A borrowed description must not leak to any background process of git. Any red vector fails: there is no
/// run-time switch that turns borrowing off.
fn borrow_vectors_row() -> RowOutcome {
    let (sender, receiver) = mpsc::channel();
    // The vectors start git and wait on it: a run that hangs must not hold the doctor, so it runs on its own
    // thread and the row stops waiting after the bound. The thread ends with the process.
    std::thread::spawn(move || {
        let ran = HelperExe::current()
            .map_err(|error| {
                RunError::Unavailable(format!("the running executable is unknown: {error}"))
            })
            .and_then(|helper| borrow_vectors::run(Path::new("git"), &helper, &[], false));
        let _ = sender.send(ran);
    });
    match receiver.recv_timeout(BORROW_VECTORS_TIMEOUT) {
        Ok(ran) => borrow_vectors_outcome(ran),
        Err(_) => judged(
            false,
            format!(
                "the borrow vectors did not finish within {} s",
                BORROW_VECTORS_TIMEOUT.as_secs()
            ),
        ),
    }
}

fn borrow_vectors_outcome(ran: Result<borrow_vectors::Report, RunError>) -> RowOutcome {
    match ran {
        Ok(report) if report.pass() => judged(
            true,
            format!(
                "all {} vectors and the sibling check green ({})",
                report.vectors.len(),
                report.git_version
            ),
        ),
        Ok(report) => {
            let mut red: Vec<String> = report
                .vectors
                .iter()
                .filter(|vector| !vector.pass)
                .map(|vector| format!("{}: {}", vector.name, vector.detail))
                .collect();
            if !report.sibling.0 {
                red.push(format!("sibling-refused: {}", report.sibling.1));
            }
            judged(
                false,
                format!(
                    "borrowed lock leaks ({}): {}",
                    report.git_version,
                    listed(&red)
                ),
            )
        }
        Err(RunError::Unavailable(detail)) | Err(RunError::Usage(detail)) => {
            judged(false, format!("borrow vectors unavailable: {detail}"))
        }
    }
}

// lock-holders (pointer) -----------------------------------------------------------------------------------

/// A pointer, never a judgment: the holders of every lock file, the predecessor records and the hot records
/// cost about a second to read, over the pointer cost cap, so the row names the verb that reads them
/// (`fgos lock-status` reports them as `problems`).
fn holders_pointer() -> RowOutcome {
    judged(
        true,
        "holders of fgOS locks, predecessor domains still running and hot records that need a person: run `fgos lock-status`"
            .to_owned(),
    )
}

// lock-dirs (fix) ------------------------------------------------------------------------------------------

/// The name Node gave an I/O failure (`EACCES`), which is what the fix's message has always said.
fn error_word(error: &io::Error) -> String {
    use io::ErrorKind::*;
    match error.kind() {
        PermissionDenied => "EACCES".to_owned(),
        NotFound => "ENOENT".to_owned(),
        AlreadyExists => "EEXIST".to_owned(),
        NotADirectory => "ENOTDIR".to_owned(),
        ReadOnlyFilesystem => "EROFS".to_owned(),
        StorageFull => "ENOSPC".to_owned(),
        _ => error.to_string(),
    }
}

#[cfg(unix)]
fn mode_is_open_to_others(dir: &Path) -> io::Result<bool> {
    use std::os::unix::fs::PermissionsExt;
    Ok(std::fs::metadata(dir)?.permissions().mode() & 0o077 != 0)
}

#[cfg(not(unix))]
fn mode_is_open_to_others(_dir: &Path) -> io::Result<bool> {
    Ok(false)
}

#[cfg(unix)]
fn make_private(dir: &Path) -> io::Result<()> {
    use std::os::unix::fs::PermissionsExt;
    std::fs::set_permissions(dir, std::fs::Permissions::from_mode(0o700))
}

#[cfg(not(unix))]
fn make_private(_dir: &Path) -> io::Result<()> {
    Ok(())
}

/// Creates `<fgosDir>/locks` and `<lockRoot>` with mode 0700 when missing, and tightens an existing one to
/// 0700 (the first acquire may have created it with the umask's mode before the fix ran).
fn fix_lock_dirs(dirs: &LockDirs) -> FixResult {
    let mut created = Vec::new();
    let mut skipped = Vec::new();
    for (_, dir) in dirs.both() {
        if dir.is_dir() {
            match mode_is_open_to_others(dir).and_then(|open| {
                if open {
                    make_private(dir)?;
                }
                Ok(open)
            }) {
                Ok(true) => created.push(format!("{} (mode tightened to 0700)", dir.display())),
                Ok(false) => {}
                Err(error) => skipped.push(format!("{}: {}", dir.display(), error_word(&error))),
            }
            continue;
        }
        match create_state_root(dir).and_then(|()| make_private(dir)) {
            Ok(()) => created.push(dir.display().to_string()),
            Err(error) => skipped.push(format!("{}: {}", dir.display(), error_word(&error))),
        }
    }
    let mut parts = Vec::new();
    if !created.is_empty() {
        parts.push(format!("created or tightened {}", created.join(", ")));
    }
    if !skipped.is_empty() {
        parts.push(format!("not created: {}", skipped.join("; ")));
    }
    FixResult::done(
        "lock-dirs",
        !created.is_empty(),
        if parts.is_empty() {
            "lock directories present".to_owned()
        } else {
            parts.join("; ")
        },
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    fn unique(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!(
            "fgos-doctor-holder-lock-{name}-{}-{:?}",
            std::process::id(),
            std::thread::current().id()
        ));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();
        dir
    }

    fn dirs_in(base: &Path) -> LockDirs {
        LockDirs {
            workspace: base.join("project/.fgos/locks"),
            machine: base.join("state/locks"),
            state_root: base.join("state"),
            source: "pinned",
        }
    }

    fn guarantee(exclusion: Level, notes: &[&str]) -> Guarantee {
        Guarantee {
            driver: "none",
            exclusion,
            borrow: Level::Unsupported,
            holders: Level::Unsupported,
            platform: "plan9",
            notes: notes.iter().map(ToString::to_string).collect(),
        }
    }

    fn message(outcome: RowOutcome) -> (bool, String) {
        match outcome {
            RowOutcome::Judged(row) => (row.passed, row.message.unwrap()),
            RowOutcome::Unavailable { message, .. } => panic!("unavailable: {message}"),
        }
    }

    #[test]
    fn a_guarantee_of_unsupported_fails_by_name_a_network_filesystem_too_and_a_kernel_one_passes() {
        let unsupported = guarantee_refusal(
            "workspace",
            Path::new("/x/locks"),
            &guarantee(Level::Unsupported, &[]),
        )
        .unwrap();
        assert!(unsupported
            .starts_with("workspace /x/locks {\"driver\":\"none\",\"exclusion\":\"unsupported\""));
        assert!(
            unsupported.contains(": holder-lock has no driver on plan9;"),
            "{unsupported}"
        );
        let network = guarantee_refusal(
            "machine",
            Path::new("/x/locks"),
            &guarantee(Level::None, &["nfs"]),
        )
        .unwrap();
        assert!(network.contains("no lock exclusion (nfs)"), "{network}");
        let unnamed = guarantee_refusal(
            "machine",
            Path::new("/x/locks"),
            &guarantee(Level::None, &[]),
        )
        .unwrap();
        assert!(
            unnamed.contains("no lock exclusion (network filesystem)"),
            "{unnamed}"
        );
        assert_eq!(
            guarantee_refusal(
                "machine",
                Path::new("/x/locks"),
                &guarantee(Level::Kernel, &[])
            ),
            None
        );
    }

    #[test]
    fn lock_dirs_creates_both_directories_private_once_and_tightens_a_directory_made_too_open() {
        let base = unique("dirs");
        let dirs = dirs_in(&base);
        let first = fix_lock_dirs(&dirs);
        assert_eq!(first.changed, Some(true), "{:?}", first.message);
        assert!(dirs.workspace.is_dir() && dirs.machine.is_dir());
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            for dir in [&dirs.workspace, &dirs.machine] {
                assert_eq!(
                    std::fs::metadata(dir).unwrap().permissions().mode() & 0o777,
                    0o700
                );
            }
        }
        assert_eq!(
            fix_lock_dirs(&dirs),
            FixResult::done("lock-dirs", false, "lock directories present")
        );
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(&dirs.machine, std::fs::Permissions::from_mode(0o775))
                .unwrap();
            let tightened = fix_lock_dirs(&dirs);
            assert_eq!(tightened.changed, Some(true));
            assert!(tightened
                .message
                .unwrap()
                .contains("(mode tightened to 0700)"));
            assert_eq!(
                std::fs::metadata(&dirs.machine)
                    .unwrap()
                    .permissions()
                    .mode()
                    & 0o777,
                0o700
            );
        }
        std::fs::remove_dir_all(&base).unwrap();
    }

    #[test]
    fn lock_dirs_names_a_directory_it_could_not_make_and_still_makes_the_other() {
        let base = unique("blocked");
        let dirs = dirs_in(&base);
        // A file where the workspace's `.fgos` should be: the directory cannot be made under it.
        std::fs::create_dir_all(base.join("project")).unwrap();
        std::fs::write(base.join("project/.fgos"), "x").unwrap();
        let result = fix_lock_dirs(&dirs);
        assert_eq!(result.changed, Some(true));
        let text = result.message.unwrap();
        assert!(
            text.contains(&format!("created or tightened {}", dirs.machine.display())),
            "{text}"
        );
        assert!(
            text.contains(&format!("; not created: {}: ", dirs.workspace.display())),
            "{text}"
        );
        std::fs::remove_dir_all(&base).unwrap();
    }

    #[cfg(unix)]
    #[test]
    fn lock_kernel_semantics_warns_for_a_missing_directory_then_passes_on_the_real_mount_once_it_exists(
    ) {
        let base = unique("semantics");
        let dirs = dirs_in(&base);
        let (passed, missing) = message(kernel_semantics(&dirs));
        assert!(passed);
        assert!(
            missing.starts_with(&format!(
                "warning: workspace {} does not exist yet, not measured (fgos doctor --fix creates it)",
                dirs.workspace.display()
            )),
            "{missing}"
        );
        fix_lock_dirs(&dirs);
        // The probe plays its holder with `sleep` on POSIX, so the test binary is a fine helper executable.
        let (passed, text) = message(kernel_semantics(&dirs));
        assert!(passed, "{text}");
        assert!(!text.starts_with("warning:"), "{text}");
        assert!(text.contains(&format!("workspace {} {{\"driver\":\"flock\",\"exclusion\":\"kernel\",\"borrow\":\"kernel\",\"holders\":\"kernel\"}}, two-process probe green", dirs.workspace.display())), "{text}");
        assert!(
            text.contains(&format!("machine {} ", dirs.machine.display()))
                && text.contains(", two-process probe green")
        );
        assert!(
            text.ends_with(&format!(
                "; stateRoot {} (pinned); killWaitMs 2000 (fixed)",
                dirs.state_root.display()
            )),
            "{text}"
        );
        assert_eq!(
            std::fs::read_dir(&dirs.workspace).unwrap().count(),
            0,
            "the probe file is removed"
        );
        std::fs::remove_dir_all(&base).unwrap();
    }

    #[test]
    fn the_borrow_vectors_answer_is_worded_for_a_pass_a_leak_and_an_unavailable_driver() {
        use borrow_vectors::{Report, VectorResult};
        let vector = |name: &str, pass: bool| VectorResult {
            name: name.to_owned(),
            pass,
            elapsed_ms: 1.0,
            detail: format!("{name} detail"),
        };
        let report = |vectors: Vec<VectorResult>, sibling: bool| Report {
            vectors,
            sibling: (sibling, "sibling detail".to_owned()),
            git_version: "git version 2.50.0".to_owned(),
            elapsed_ms: 5.0,
            kept: None,
        };
        let green = report(vec![vector("a", true), vector("b", true)], true);
        assert_eq!(
            message(borrow_vectors_outcome(Ok(green))),
            (
                true,
                "all 2 vectors and the sibling check green (git version 2.50.0)".to_owned()
            )
        );
        let leaking = report(vec![vector("a", false), vector("b", true)], false);
        assert_eq!(
            message(borrow_vectors_outcome(Ok(leaking))),
            (
                false,
                "borrowed lock leaks (git version 2.50.0): a: a detail; sibling-refused: sibling detail".to_owned()
            )
        );
        assert_eq!(
            message(borrow_vectors_outcome(Err(RunError::Unavailable(
                "no driver".into()
            )))),
            (false, "borrow vectors unavailable: no driver".to_owned())
        );
        let many: Vec<String> = (0..7).map(|n| format!("v{n}")).collect();
        assert_eq!(listed(&many), "v0; v1; v2; v3; v4; and 2 more");
    }

    #[cfg(unix)]
    #[test]
    fn the_borrow_vectors_row_passes_with_the_real_driver_and_real_git() {
        let (passed, text) = message(borrow_vectors_row());
        assert!(passed, "{text}");
        assert!(
            text.starts_with("all 4 vectors and the sibling check green (git version "),
            "{text}"
        );
    }

    #[test]
    fn lock_holders_is_a_read_only_pointer_to_the_lock_status_verb() {
        let (passed, text) = message(holders_pointer());
        assert!(passed);
        assert!(text.ends_with("run `fgos lock-status`"), "{text}");
    }

    #[test]
    fn the_group_names_exactly_the_rows_and_the_fix_the_registry_gives_to_the_holder_lock() {
        let registry = crate::wiring::doctor::registry().unwrap();
        let owned = |kind: &str| -> Vec<String> {
            let mut ids: Vec<String> = match kind {
                "row" => registry
                    .rows
                    .iter()
                    .filter(|row| row.owner.label == "holder-lock")
                    .map(|row| row.id.clone())
                    .collect(),
                _ => registry
                    .fixes
                    .iter()
                    .filter(|fix| fix.owner.label == "holder-lock")
                    .map(|fix| fix.id.clone())
                    .collect(),
            };
            ids.sort();
            ids
        };
        let mut rows: Vec<String> = ROWS.iter().map(ToString::to_string).collect();
        rows.sort();
        assert_eq!(owned("row"), rows);
        assert_eq!(owned("fix"), FIXES);
    }
}
