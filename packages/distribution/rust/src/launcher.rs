//! The project launcher: the one `fgos` on `PATH` that runs each project's own activated fgos.
//!
//! A release install puts only `fgctl` on `PATH`; `fgctl init` then activates a release per project in
//! `<project>/.fgos/installation/activation.json`. This module owns a tiny launcher, written next to `fgctl`
//! (and so next to the workspace shims of `shim.rs`), that walks up from the working directory to the nearest
//! activation and runs the release it names: each project runs the release it activated, from any
//! subdirectory, in any shell, interactive or not (hooks and agents included), with no rc file edit.
//!
//! Trust: everything under a project's `.fgos/installation/` can arrive with a `git clone` (Git keeps the exec
//! bit), so the launcher executes nothing from the project. It reads only `status` and `artifactDigest` from the
//! activation and runs `<stateRoot>/releases/<artifactDigest>/bin/fgos`, the same release directory `fgctl
//! verify` checks: a release only `fgctl` puts into this machine's store, after verifying its digest. A digest
//! that is not `sha256:` and 64 lowercase hex digits, a status other than `ready`, or a release missing from the
//! store is refused by name with exit 126 and the fix. The state root follows the one formula
//! (`fgos_holder_lock::state_root`): `FGOS_STATE_ROOT`, `FGOS_STATE_HOME` (a blank value counts as unset), then
//! `XDG_STATE_HOME/fgos`, `HOME/.local/state/fgos`, `USERPROFILE/.local/state/fgos`, then the relative
//! `.local/state/fgos`. A root that is not absolute is refused: it would resolve inside the project, which can
//! ship its own `releases/`. The `sh` form runs only shell builtins.
//!
//! The launcher carries a marker line so doctor can tell its own file from a foreign `fgos` (an npm global, say)
//! and never overwrites the latter. The marker text never changes: an older launcher must still read as ours so
//! the fix replaces it. The bodies are the bytes the earlier Node module wrote
//! (`tests/goldens/launcher-digests.json`).

use std::io;
use std::path::{Path, PathBuf};

use serde::Serialize;

/// The marker line text; never changes.
pub const LAUNCHER_MARKER: &str = "fgos-project-launcher v1";

const SH_BODY: &str = include_str!("launcher.sh");
const CMD_LINES: &str = include_str!("launcher-cmd.txt");

/// The file the launcher is written as: `fgos.cmd` on Windows, `fgos` elsewhere.
pub fn launcher_file_name(windows: bool) -> &'static str {
    if windows {
        "fgos.cmd"
    } else {
        "fgos"
    }
}

/// The launcher text: the `sh` form, or the batch form with CRLF line ends.
pub fn launcher_body(windows: bool) -> String {
    if windows {
        let lines: Vec<&str> = CMD_LINES.lines().collect();
        format!("{}\r\n", lines.join("\r\n"))
    } else {
        SH_BODY.to_string()
    }
}

/// Where `fgos` stands on `PATH`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum LauncherState {
    /// The first `fgos` is our launcher and current.
    Ready,
    /// The first `fgos` is our launcher but out of date.
    Stale,
    /// The first `fgos` is someone else's file (never overwritten).
    Foreign,
    /// No `fgos` on `PATH`, and `fgctl` is, so the launcher can go beside it.
    Missing,
    /// No `fgos` on `PATH` and no `fgctl` either: nowhere trustworthy to put it.
    NoFgctl,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct LauncherStatus {
    pub state: LauncherState,
    pub file: Option<PathBuf>,
}

/// The search path a lookup reads: `PATH` and, on Windows, `PATHEXT`.
#[derive(Debug, Clone, Copy)]
pub struct SearchPath<'a> {
    pub path: &'a str,
    pub pathext: &'a str,
    pub windows: bool,
}

impl SearchPath<'_> {
    fn find(&self, name: &str) -> Option<PathBuf> {
        fgos_process::spawn::resolve_program(name, self.path, self.pathext, self.windows)
    }
}

/// Where `fgos` stands on `search`.
pub fn inspect_launcher(search: SearchPath) -> LauncherStatus {
    let body = launcher_body(search.windows);
    if let Some(first) = search.find("fgos") {
        let text = std::fs::read(&first)
            .ok()
            .map(|b| String::from_utf8_lossy(&b).into_owned());
        let state = match text {
            Some(text) if text.contains(LAUNCHER_MARKER) => {
                if text == body {
                    LauncherState::Ready
                } else {
                    LauncherState::Stale
                }
            }
            _ => LauncherState::Foreign,
        };
        return LauncherStatus {
            state,
            file: Some(first),
        };
    }
    match search.find("fgctl") {
        None => LauncherStatus {
            state: LauncherState::NoFgctl,
            file: None,
        },
        Some(fgctl) => LauncherStatus {
            state: LauncherState::Missing,
            file: Some(
                fgctl
                    .parent()
                    .unwrap_or_else(|| Path::new("."))
                    .join(launcher_file_name(search.windows)),
            ),
        },
    }
}

/// Writes the launcher (executable on POSIX), replacing the file by rename so a shell already running the old
/// launcher never reads a half-written one.
pub fn write_launcher(file: &Path, windows: bool) -> io::Result<()> {
    let dir = file.parent().unwrap_or_else(|| Path::new("."));
    let name = file
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| io::Error::other("the launcher path has no file name"))?;
    fgos_durable_file::replace_durably_with_mode(
        dir,
        name,
        launcher_body(windows).as_bytes(),
        0o755,
    )
    .map_err(io::Error::other)?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        std::fs::set_permissions(file, std::fs::Permissions::from_mode(0o755))?;
    }
    Ok(())
}

/// Whether the payload that runs is a source checkout: its Node payload root sits inside a Git repository and
/// carries the shell-integration script, which is then what provides `fgos` (no launcher needed). A released
/// payload sits in the release store, outside any repository.
pub fn source_checkout(legacy_node_root: &Path) -> bool {
    let script = legacy_node_root
        .join("scripts")
        .join("fgos-shell-integration.sh");
    script.is_file()
        && matches!(
            fgos_git::GitDriver::topology_at(legacy_node_root),
            Ok(Some(_))
        )
}

/// A doctor verdict for the launcher row.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct LauncherCheck {
    pub passed: bool,
    pub message: String,
}

/// Row `project-fgos-launcher`: a release install has a single `fgos` on `PATH` that runs each project's own
/// activated fgos; a source checkout keeps the shell-integration script instead.
pub fn check_project_launcher(search: SearchPath, source_checkout: bool) -> LauncherCheck {
    let verdict = |passed, message: String| LauncherCheck { passed, message };
    if source_checkout {
        return verdict(
            true,
            "running from a source checkout -- shell integration provides fgos, no launcher needed"
                .into(),
        );
    }
    let status = inspect_launcher(search);
    let file = status
        .file
        .as_deref()
        .map(|f| f.display().to_string())
        .unwrap_or_default();
    match status.state {
        LauncherState::Ready => verdict(true, format!("fgos on PATH is the project launcher at {file}: each project runs its own activated fgos")),
        LauncherState::Stale => verdict(false, format!("the fgos launcher at {file} is out of date -- run fgos doctor --fix")),
        LauncherState::Foreign => verdict(false, format!("the fgos found first on PATH ({file}) is not the project launcher, so projects may not run their own fgos -- remove it or put the fgctl directory earlier on PATH, then run fgos doctor --fix")),
        LauncherState::Missing => verdict(false, format!("no fgos on PATH -- run fgos doctor --fix to write the project launcher at {file}")),
        LauncherState::NoFgctl => verdict(false, "neither fgos nor fgctl is on PATH -- add the directory fgctl was installed into (default ~/.local/bin) to PATH, then run fgos doctor --fix".into()),
    }
}

/// What the launcher fix did.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct LauncherFix {
    pub fixed: bool,
    pub message: String,
}

/// Fix of row `project-fgos-launcher`: writes the launcher beside `fgctl`; a foreign `fgos` is never touched.
pub fn fix_project_launcher(search: SearchPath) -> io::Result<LauncherFix> {
    let status = inspect_launcher(search);
    let file = status
        .file
        .as_deref()
        .map(|f| f.display().to_string())
        .unwrap_or_default();
    let fix = |fixed, message: String| LauncherFix { fixed, message };
    Ok(match status.state {
        LauncherState::Ready => fix(false, "launcher already current".into()),
        LauncherState::Foreign => fix(false, format!("left {file} alone: it is not the project launcher; remove it or put the fgctl directory earlier on PATH")),
        LauncherState::NoFgctl => fix(false, "neither fgos nor fgctl is on PATH, so there is no directory to write the launcher into; add the fgctl directory to PATH first".into()),
        LauncherState::Stale | LauncherState::Missing => {
            let target = status.file.as_deref().unwrap_or_else(|| Path::new("fgos"));
            write_launcher(target, search.windows)?;
            fix(true, format!("wrote the project launcher at {file}"))
        }
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use sha2::{Digest, Sha256};

    fn digest(text: &str) -> String {
        Sha256::digest(text.as_bytes())
            .iter()
            .map(|b| format!("{b:02x}"))
            .collect()
    }

    #[test]
    fn the_bodies_are_the_bytes_the_earlier_module_wrote() {
        let pinned: serde_json::Value =
            serde_json::from_str(include_str!("../tests/goldens/launcher-digests.json")).unwrap();
        assert_eq!(
            digest(&launcher_body(false)),
            pinned["sh"].as_str().unwrap()
        );
        assert_eq!(
            digest(&launcher_body(true)),
            pinned["cmd"].as_str().unwrap()
        );
        assert!(
            launcher_body(true).ends_with("\r\n")
                && !launcher_body(true).replace("\r\n", "").contains('\n')
        );
        assert!(
            launcher_body(false).contains(LAUNCHER_MARKER)
                && launcher_body(true).contains(LAUNCHER_MARKER)
        );
    }

    struct Sandbox {
        root: PathBuf,
        bin: PathBuf,
    }

    impl Sandbox {
        fn new(label: &str) -> Sandbox {
            static COUNTER: std::sync::atomic::AtomicUsize = std::sync::atomic::AtomicUsize::new(0);
            let n = COUNTER.fetch_add(1, std::sync::atomic::Ordering::SeqCst);
            let root = std::fs::canonicalize(std::env::temp_dir())
                .unwrap()
                .join(format!("fgos-launcher-{}-{n}-{label}", std::process::id()));
            let _ = std::fs::remove_dir_all(&root);
            let bin = root.join("bin");
            std::fs::create_dir_all(&bin).unwrap();
            Sandbox { root, bin }
        }

        fn search<'a>(&self, path: &'a str) -> SearchPath<'a> {
            SearchPath {
                path,
                pathext: ".EXE;.CMD;.BAT",
                windows: false,
            }
        }

        fn put_fgctl(&self) {
            write_script(&self.bin.join("fgctl"), "#!/bin/sh\nexit 0\n");
        }
    }

    impl Drop for Sandbox {
        fn drop(&mut self) {
            let _ = std::fs::remove_dir_all(&self.root);
        }
    }

    #[cfg(unix)]
    fn write_script(file: &Path, text: &str) {
        use std::os::unix::fs::PermissionsExt;
        std::fs::create_dir_all(file.parent().unwrap()).unwrap();
        std::fs::write(file, text).unwrap();
        std::fs::set_permissions(file, std::fs::Permissions::from_mode(0o755)).unwrap();
    }

    #[cfg(not(unix))]
    fn write_script(file: &Path, text: &str) {
        std::fs::create_dir_all(file.parent().unwrap()).unwrap();
        std::fs::write(file, text).unwrap();
    }

    #[cfg(unix)]
    #[test]
    fn a_release_install_with_fgctl_on_path_and_no_fgos_gets_the_launcher_beside_fgctl_and_then_reads_ready(
    ) {
        let sb = Sandbox::new("missing");
        sb.put_fgctl();
        let path = sb.bin.to_string_lossy().into_owned();
        let before = inspect_launcher(sb.search(&path));
        assert_eq!(before.state, LauncherState::Missing);
        assert_eq!(before.file, Some(sb.bin.join("fgos")));
        let check = check_project_launcher(sb.search(&path), false);
        assert_eq!(
            check,
            LauncherCheck {
                passed: false,
                message: format!(
                    "no fgos on PATH -- run fgos doctor --fix to write the project launcher at {}",
                    sb.bin.join("fgos").display()
                )
            }
        );
        let fixed = fix_project_launcher(sb.search(&path)).unwrap();
        assert!(fixed.fixed);
        assert_eq!(
            fixed.message,
            format!(
                "wrote the project launcher at {}",
                sb.bin.join("fgos").display()
            )
        );
        assert_eq!(
            inspect_launcher(sb.search(&path)).state,
            LauncherState::Ready
        );
        assert!(check_project_launcher(sb.search(&path), false).passed);
        assert_eq!(
            fix_project_launcher(sb.search(&path)).unwrap(),
            LauncherFix {
                fixed: false,
                message: "launcher already current".into()
            }
        );
        use std::os::unix::fs::PermissionsExt;
        assert_eq!(
            std::fs::metadata(sb.bin.join("fgos"))
                .unwrap()
                .permissions()
                .mode()
                & 0o777,
            0o755
        );
    }

    #[cfg(unix)]
    #[test]
    fn a_foreign_fgos_earlier_on_path_is_reported_and_never_overwritten() {
        let sb = Sandbox::new("foreign");
        sb.put_fgctl();
        let other = sb.root.join("other");
        write_script(&other.join("fgos"), "#!/bin/sh\necho npm-global\n");
        let path = format!("{}:{}", other.display(), sb.bin.display());
        assert_eq!(
            inspect_launcher(sb.search(&path)).state,
            LauncherState::Foreign
        );
        let check = check_project_launcher(sb.search(&path), false);
        assert!(
            !check.passed
                && check.message.starts_with(&format!(
                    "the fgos found first on PATH ({})",
                    other.join("fgos").display()
                ))
        );
        let fix = fix_project_launcher(sb.search(&path)).unwrap();
        assert!(!fix.fixed);
        assert_eq!(fix.message, format!("left {} alone: it is not the project launcher; remove it or put the fgctl directory earlier on PATH", other.join("fgos").display()));
        assert_eq!(
            std::fs::read_to_string(other.join("fgos")).unwrap(),
            "#!/bin/sh\necho npm-global\n"
        );
        assert!(!sb.bin.join("fgos").exists());
    }

    #[cfg(unix)]
    #[test]
    fn an_out_of_date_launcher_is_rewritten_and_neither_fgctl_nor_fgos_on_path_is_reported_with_the_way_out(
    ) {
        let sb = Sandbox::new("stale");
        sb.put_fgctl();
        let file = sb.bin.join("fgos");
        write_script(&file, &format!("#!/bin/sh\n# {LAUNCHER_MARKER}\nexit 1\n"));
        let path = sb.bin.to_string_lossy().into_owned();
        assert_eq!(
            inspect_launcher(sb.search(&path)).state,
            LauncherState::Stale
        );
        assert!(check_project_launcher(sb.search(&path), false)
            .message
            .ends_with("is out of date -- run fgos doctor --fix"));
        assert!(fix_project_launcher(sb.search(&path)).unwrap().fixed);
        assert_eq!(
            inspect_launcher(sb.search(&path)).state,
            LauncherState::Ready
        );
        let empty = sb.root.join("empty");
        std::fs::create_dir_all(&empty).unwrap();
        let empty_path = empty.to_string_lossy().into_owned();
        assert_eq!(
            inspect_launcher(sb.search(&empty_path)).state,
            LauncherState::NoFgctl
        );
        let check = check_project_launcher(sb.search(&empty_path), false);
        assert!(
            !check.passed
                && check
                    .message
                    .contains("add the directory fgctl was installed into")
        );
        assert!(!fix_project_launcher(sb.search(&empty_path)).unwrap().fixed);
    }

    #[test]
    fn from_a_source_checkout_the_check_needs_no_launcher() {
        let check = check_project_launcher(
            SearchPath {
                path: "",
                pathext: "",
                windows: false,
            },
            true,
        );
        assert!(check.passed && check.message.contains("shell integration provides fgos"));
    }

    #[test]
    fn a_payload_is_a_source_checkout_only_inside_a_repository_and_with_the_integration_script() {
        let sb = Sandbox::new("source");
        let payload = sb.root.join("payload");
        write_script(
            &payload.join("scripts").join("fgos-shell-integration.sh"),
            "# integration\n",
        );
        assert!(
            !source_checkout(&payload),
            "no repository around the payload"
        );
        std::fs::create_dir_all(sb.root.join(".git")).unwrap();
        std::fs::write(sb.root.join(".git").join("HEAD"), "ref: refs/heads/main\n").unwrap();
        std::fs::create_dir_all(sb.root.join(".git").join("objects")).unwrap();
        std::fs::create_dir_all(sb.root.join(".git").join("refs")).unwrap();
        assert!(
            source_checkout(&payload),
            "inside a repository, with the script"
        );
        std::fs::remove_file(payload.join("scripts").join("fgos-shell-integration.sh")).unwrap();
        assert!(!source_checkout(&payload), "without the script");
    }

    /// The batch launcher runs for real only where `cmd.exe` exists.
    #[cfg(windows)]
    #[test]
    fn the_cmd_launcher_runs_the_store_release_the_nearest_activation_names_and_refuses_outside_a_project(
    ) {
        use std::process::Command;
        let sb = Sandbox::new("cmd");
        let launcher = sb.bin.join("fgos.cmd");
        write_launcher(&launcher, true).unwrap();
        let state = sb.root.join("state");
        let digest = "a".repeat(64);
        // A stand-in release host: a copy of cmd.exe, so `fgos.exe /d /c echo <text>` prints the text.
        let release_bin = state
            .join("releases")
            .join(format!("sha256-{digest}"))
            .join("bin");
        std::fs::create_dir_all(&release_bin).unwrap();
        let shell =
            std::env::var("ComSpec").unwrap_or_else(|_| "C:\\Windows\\System32\\cmd.exe".into());
        std::fs::copy(&shell, release_bin.join("fgos.exe")).unwrap();
        let project = sb.root.join("proj");
        let installation = project.join(".fgos").join("installation");
        let sub = project.join("src");
        std::fs::create_dir_all(installation.join("bin")).unwrap();
        std::fs::create_dir_all(&sub).unwrap();
        std::fs::write(
            installation.join("bin").join("fgos.cmd"),
            "@echo PLANTED %*\r\n",
        )
        .unwrap();
        let activation = |digest: &str| {
            let text =
                format!("{{\n  \"status\": \"ready\",\n  \"artifactDigest\": \"{digest}\"\n}}\n");
            std::fs::write(installation.join("activation.json"), text).unwrap();
        };
        let run = |args: &[&str], cwd: &Path, state_root: &Path| {
            let mut command = Command::new("cmd.exe");
            command
                .args(["/d", "/c"])
                .arg(&launcher)
                .args(args)
                .current_dir(cwd);
            command.env("FGOS_STATE_ROOT", state_root);
            command.output().unwrap()
        };
        activation(&format!("sha256:{digest}"));
        let inside = run(&["/d", "/c", "echo", "release-ran"], &sub, &state);
        let text = String::from_utf8_lossy(&inside.stdout);
        assert!(text.contains("release-ran") && !text.contains("PLANTED"));
        activation(&format!("sha256:{}", "b".repeat(64)));
        let missing = run(&["doctor"], &sub, &state);
        assert_eq!(missing.status.code(), Some(126));
        assert!(String::from_utf8_lossy(&missing.stderr)
            .contains("is not in this machine's release store"));
        activation("sha256:..\\..\\evil");
        let traversal = run(&["doctor"], &sub, &state);
        assert_eq!(traversal.status.code(), Some(126));
        assert!(String::from_utf8_lossy(&traversal.stderr).contains("artifactDigest is not sha256"));
        activation(&format!("sha256:{digest}"));
        let relative = run(&["/d", "/c", "echo", "PLANTED"], &sub, Path::new("store"));
        assert_eq!(relative.status.code(), Some(126));
        assert!(String::from_utf8_lossy(&relative.stderr)
            .contains("the state root store is not an absolute path"));
        let elsewhere = sb.root.join("elsewhere");
        std::fs::create_dir_all(&elsewhere).unwrap();
        let outside = run(&["doctor"], &elsewhere, &state);
        assert_eq!(outside.status.code(), Some(127));
        assert!(String::from_utf8_lossy(&outside.stderr).contains("no .fgos\\installation found"));
    }

    #[cfg(unix)]
    mod script {
        use super::*;
        use std::process::Command;

        const DIGEST_A: &str =
            "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        const DIGEST_B: &str =
            "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

        type Hostile<'a> = (&'a str, Vec<(&'a str, &'a str)>, String);
        type InputCase<'a> = (&'a str, Vec<(&'a str, String)>, PathBuf);

        struct Ran {
            status: i32,
            stdout: String,
            stderr: String,
        }

        /// The launcher sees PATH plus the variables named here: never this machine's HOME, state root or XDG.
        fn run(launcher: &Path, args: &[&str], cwd: &Path, extra: &[(&str, &str)]) -> Ran {
            for _ in 0..50 {
                let mut command = Command::new(launcher);
                command
                    .args(args)
                    .current_dir(cwd)
                    .env_clear()
                    .env("PATH", std::env::var("PATH").unwrap_or_default())
                    .envs(extra.iter().copied());
                match command.output() {
                    Ok(out) => {
                        return Ran {
                            status: out.status.code().unwrap_or(-1),
                            stdout: String::from_utf8_lossy(&out.stdout).into_owned(),
                            stderr: String::from_utf8_lossy(&out.stderr).into_owned(),
                        }
                    }
                    // a script written a moment ago can still be held open by another test's fork
                    Err(e) if e.raw_os_error() == Some(26) => {
                        std::thread::sleep(std::time::Duration::from_millis(20))
                    }
                    Err(e) => panic!("{e}"),
                }
            }
            panic!("the launcher stayed busy");
        }

        fn put_release(state_root: &Path, dir_name: &str, name: &str) {
            write_script(
                &state_root
                    .join("releases")
                    .join(dir_name)
                    .join("bin")
                    .join("fgos"),
                &format!("#!/bin/sh\necho \"{name} args=$* cwd=$PWD\"\n"),
            );
        }

        /// A project activation in the shape fgctl writes it (pretty JSON, one key per line).
        fn put_activation(dir: &Path, fields: &[(&str, &str)]) {
            let installation = dir.join(".fgos").join("installation");
            std::fs::create_dir_all(&installation).unwrap();
            let body: Vec<String> = std::iter::once("  \"schemaVersion\": 1".to_string())
                .chain(fields.iter().map(|(k, v)| format!("  \"{k}\": \"{v}\"")))
                .collect();
            std::fs::write(
                installation.join("activation.json"),
                format!("{{\n{}\n}}\n", body.join(",\n")),
            )
            .unwrap();
        }

        fn launcher(sb: &Sandbox) -> PathBuf {
            let file = sb.bin.join("fgos");
            write_launcher(&file, false).unwrap();
            file
        }

        #[test]
        fn each_project_runs_the_release_it_activated_from_any_subdirectory_and_the_nearest_project_wins(
        ) {
            let sb = Sandbox::new("nearest");
            let launcher = launcher(&sb);
            let state = sb.root.join("state");
            put_release(&state, DIGEST_A, "release-a");
            put_release(&state, DIGEST_B, "release-b");
            let (a, b, inner) = (
                sb.root.join("a"),
                sb.root.join("b"),
                sb.root.join("a").join("inner"),
            );
            for dir in [&a, &b, &inner, &a.join("src").join("deep")] {
                std::fs::create_dir_all(dir).unwrap();
            }
            put_activation(&a, &[("status", "ready"), ("artifactDigest", DIGEST_A)]);
            put_activation(&b, &[("status", "ready"), ("artifactDigest", DIGEST_B)]);
            put_activation(&inner, &[("status", "ready"), ("artifactDigest", DIGEST_B)]);
            let env = [("FGOS_STATE_ROOT", state.to_str().unwrap())];
            assert!(
                run(&launcher, &["doctor"], &a.join("src").join("deep"), &env)
                    .stdout
                    .starts_with("release-a args=doctor ")
            );
            assert!(run(&launcher, &["version"], &b, &env)
                .stdout
                .starts_with("release-b args=version "));
            assert!(run(&launcher, &[], &inner, &env)
                .stdout
                .starts_with("release-b "));
        }

        #[test]
        fn a_committed_installation_never_runs_and_anything_but_a_store_release_is_refused_by_name()
        {
            let sb = Sandbox::new("hostile");
            let launcher = launcher(&sb);
            let state = sb.root.join("state");
            put_release(&state, DIGEST_A, "release-a");
            let home = sb.root.join("home");
            let env = [
                ("HOME", home.to_str().unwrap()),
                ("FGOS_STATE_ROOT", state.to_str().unwrap()),
            ];
            let clone = sb.root.join("clone");
            std::fs::create_dir_all(&clone).unwrap();
            write_script(
                &clone.join(".fgos/installation/bin/fgos"),
                "#!/bin/sh\necho PLANTED\n",
            );
            let bare = run(&launcher, &["doctor"], &clone, &env);
            assert_eq!(
                bare.status, 127,
                "a planted shim with no activation is not a project"
            );
            assert!(!bare.stdout.contains("PLANTED"));
            let evil = clone.join("evil-release");
            write_script(&evil.join("bin/fgos"), "#!/bin/sh\necho PLANTED\n");
            let walks_out = "sha256:../../../clone/evil-release";
            let upper = format!("sha256:{}", "A".repeat(64));
            let hostile: Vec<Hostile> = vec![
                (
                    "a digest the store does not hold",
                    vec![("status", "ready"), ("artifactDigest", DIGEST_B)],
                    format!("release {DIGEST_B} is not in this machine's release store"),
                ),
                (
                    "a digest that walks out of the store",
                    vec![("status", "ready"), ("artifactDigest", walks_out)],
                    "artifactDigest is not sha256 and 64 lowercase hex digits".into(),
                ),
                (
                    "a digest in upper case",
                    vec![("status", "ready"), ("artifactDigest", &upper)],
                    "artifactDigest is not sha256".into(),
                ),
                (
                    "a release path and no digest",
                    vec![("status", "ready"), ("releasePath", evil.to_str().unwrap())],
                    "artifactDigest is not sha256".into(),
                ),
                (
                    "a status other than ready",
                    vec![("status", "staging"), ("artifactDigest", DIGEST_A)],
                    "status is not ready (staging)".into(),
                ),
            ];
            for (label, fields, reason) in hostile {
                put_activation(&clone, &fields);
                let result = run(&launcher, &["doctor"], &clone, &env);
                assert_eq!(result.status, 126, "{label}");
                assert!(!result.stdout.contains("PLANTED"), "{label}");
                assert!(
                    result.stderr.contains(&reason),
                    "{label}: {}",
                    result.stderr
                );
                assert!(
                    result
                        .stderr
                        .contains("clone/.fgos/installation/activation.json: ")
                        && result.stderr.contains("run 'fgctl init' in the project")
                        && result.stderr.contains("'fgctl verify'"),
                    "{label}: {}",
                    result.stderr
                );
            }
            put_activation(
                &clone,
                &[
                    ("status", "ready"),
                    ("artifactDigest", DIGEST_A),
                    ("releasePath", evil.to_str().unwrap()),
                ],
            );
            let real = run(&launcher, &["doctor"], &clone, &env);
            assert_eq!(real.status, 0, "{}", real.stderr);
            assert!(
                real.stdout.starts_with("release-a args=doctor "),
                "the store release runs, never the planted shim or the named path"
            );
        }

        #[test]
        fn a_state_root_that_is_not_absolute_is_refused_so_a_store_planted_inside_the_project_never_runs(
        ) {
            let sb = Sandbox::new("relative");
            let launcher = launcher(&sb);
            let clone = sb.root.join("clone");
            write_script(
                &clone
                    .join(".local/state/fgos/releases")
                    .join(DIGEST_A)
                    .join("bin/fgos"),
                "#!/bin/sh\necho PLANTED\n",
            );
            put_activation(&clone, &[("status", "ready"), ("artifactDigest", DIGEST_A)]);
            let home = sb.root.join("home");
            let home = home.to_str().unwrap();
            let cases: Vec<(&str, Vec<(&str, &str)>)> = vec![
                ("HOME set but empty", vec![("HOME", "")]),
                ("no HOME and no USERPROFILE", vec![]),
                (
                    "a relative FGOS_STATE_ROOT",
                    vec![("FGOS_STATE_ROOT", ".local/state/fgos"), ("HOME", home)],
                ),
                (
                    "a relative XDG_STATE_HOME",
                    vec![("XDG_STATE_HOME", ".local/state"), ("HOME", home)],
                ),
            ];
            for (label, env) in cases {
                let result = run(&launcher, &["doctor"], &clone, &env);
                assert_eq!(result.status, 126, "{label}");
                assert!(!result.stdout.contains("PLANTED"), "{label}");
                assert!(
                    result
                        .stderr
                        .contains("the state root .local/state/fgos is not an absolute path"),
                    "{label}: {}",
                    result.stderr
                );
            }
        }

        #[test]
        fn the_store_is_found_from_the_same_state_root_inputs_as_the_host_in_either_release_directory_spelling(
        ) {
            let sb = Sandbox::new("inputs");
            let launcher = launcher(&sb);
            let project = sb.root.join("project");
            std::fs::create_dir_all(&project).unwrap();
            put_activation(
                &project,
                &[("status", "ready"), ("artifactDigest", DIGEST_A)],
            );
            let (home, pinned, fsh, xdg) = (
                sb.root.join("home"),
                sb.root.join("pinned"),
                sb.root.join("fsh"),
                sb.root.join("xdg"),
            );
            let s = |p: &Path| p.to_str().unwrap().to_string();
            let other = s(&sb.root.join("other"));
            let cases: Vec<InputCase> = vec![
                (
                    "pinned",
                    vec![
                        ("FGOS_STATE_ROOT", s(&pinned)),
                        ("FGOS_STATE_HOME", other),
                        ("HOME", s(&home)),
                    ],
                    pinned.clone(),
                ),
                (
                    "blank-pin",
                    vec![
                        ("FGOS_STATE_ROOT", "  ".into()),
                        ("FGOS_STATE_HOME", s(&fsh)),
                        ("HOME", s(&home)),
                    ],
                    fsh.clone(),
                ),
                (
                    "xdg",
                    vec![("XDG_STATE_HOME", s(&xdg)), ("HOME", s(&home))],
                    xdg.join("fgos"),
                ),
                (
                    "home",
                    vec![("HOME", s(&home))],
                    home.join(".local/state/fgos"),
                ),
            ];
            for (label, env, state_root) in cases {
                let dir_name = if label == "home" {
                    format!("sha256-{}", "a".repeat(64))
                } else {
                    DIGEST_A.to_string()
                };
                put_release(&state_root, &dir_name, &format!("release-{label}"));
                let env: Vec<(&str, &str)> = env.iter().map(|(k, v)| (*k, v.as_str())).collect();
                let result = run(&launcher, &["version"], &project, &env);
                assert_eq!(result.status, 0, "{label}: {}", result.stderr);
                assert!(
                    result
                        .stdout
                        .starts_with(&format!("release-{label} args=version ")),
                    "{label}: {}",
                    result.stdout
                );
            }
        }

        #[test]
        fn outside_any_project_the_launcher_refuses_with_a_fix_and_exit_127() {
            let sb = Sandbox::new("outside");
            let launcher = launcher(&sb);
            let elsewhere = sb.root.join("elsewhere");
            std::fs::create_dir_all(&elsewhere).unwrap();
            let home = sb.root.join("home");
            let result = run(
                &launcher,
                &["doctor"],
                &elsewhere,
                &[("HOME", home.to_str().unwrap())],
            );
            assert_eq!(result.status, 127);
            assert!(
                result.stderr.contains("no .fgos/installation found above ")
                    && result.stderr.contains("fgctl init"),
                "{}",
                result.stderr
            );
        }
    }
}
