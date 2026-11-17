//! `fgctl uninstall` as a user meets it: a child process in a scratch project with its own HOME and
//! state root. The project's `fgos` is a stand-in script that records how it was called and replays
//! answers recorded from the real verb (its own tests own the wiring reversal;
//! `test/rust-host/fgctl-uninstall.test.mjs` runs the real shim once); what is proven here is the
//! plan, the order, what is removed and what stays.

use std::path::{Path, PathBuf};
use std::process::{Command, Output};

struct Scratch(PathBuf);

impl Scratch {
    fn new(name: &str) -> Self {
        let dir =
            std::env::temp_dir().join(format!("fgctl-uninstall-{name}-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).expect("create scratch dir");
        Scratch(dir.canonicalize().expect("canonical scratch dir"))
    }
    fn path(&self) -> &Path {
        &self.0
    }
}

impl Drop for Scratch {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(&self.0);
    }
}

const HEX: &str = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
/// What the project's own `fgos uninstall` answered, recorded from a real release (`fgctl init`, then the shim): a plan,
/// and a `--yes` run whose backup failed. The stand-in shim replays them, so what `fgctl` parses is what the host prints.
const OK_ANSWER: &str = include_str!("goldens/uninstall-answer-plan.json");
const FAILED_ANSWER: &str = include_str!("goldens/uninstall-answer-failed.json");

struct World {
    scratch: Scratch,
}

impl World {
    /// HOME, a state root under it, and a git project with an activation whose `fgos` answers `answer`.
    fn new(name: &str, answer: &str, exit: i32) -> Self {
        let scratch = Scratch::new(name);
        let home = scratch.path();
        let project = home.join("project");
        std::fs::create_dir_all(project.join(".fgos").join("installation").join("bin")).unwrap();
        let init = Command::new("git")
            .args(["init", "-q"])
            .current_dir(&project)
            .status()
            .unwrap();
        assert!(init.success());
        std::fs::write(project.join(".fgos").join("config.yaml"), "keep\n").unwrap();
        std::fs::write(project.join(".fgos").join("distribution.json"), "{}\n").unwrap();
        std::fs::write(
            project
                .join(".fgos")
                .join("installation")
                .join("activation.json"),
            "{}\n",
        )
        .unwrap();
        let bin = project.join(".fgos").join("installation").join("bin");
        let log = home.join("shim-calls.log");
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let shim = bin.join("fgos");
            std::fs::write(
                &shim,
                format!(
                    "#!/bin/sh\necho \"$@\" >> '{}'\ncat <<'EOF'\n{answer}\nEOF\nexit {exit}\n",
                    log.display()
                ),
            )
            .unwrap();
            std::fs::set_permissions(&shim, std::fs::Permissions::from_mode(0o755)).unwrap();
        }
        // The Windows launcher of a project is `fgos.cmd`; the stand-in logs its arguments and prints the answer.
        #[cfg(windows)]
        {
            let answer_file = home.join("shim-answer.json");
            std::fs::write(&answer_file, answer).unwrap();
            // cmd.exe does not read the `\\?\` form `canonicalize` returns.
            let plain = |path: &Path| fgos_git::plain_path(path).display().to_string();
            std::fs::write(
                bin.join("fgos.cmd"),
                format!(
                    "@echo off\r\necho %*>>\"{}\"\r\ntype \"{}\"\r\nexit /b {exit}\r\n",
                    plain(&log),
                    plain(&answer_file)
                ),
            )
            .unwrap();
        }
        let state = home.join("state").join("fgos");
        let release = state
            .join("releases")
            .join(fgos_distribution::release_dir_name(&format!(
                "sha256:{HEX}"
            )));
        std::fs::create_dir_all(&release).unwrap();
        std::fs::write(release.join("manifest.json"), "{}").unwrap();
        std::fs::create_dir_all(state.join("identity")).unwrap();
        std::fs::write(state.join("identity").join("who"), "keep").unwrap();
        // The Git door trusts only owner-only state directories.
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            for dir in [home.to_path_buf(), home.join("state"), state] {
                std::fs::set_permissions(dir, std::fs::Permissions::from_mode(0o700)).unwrap();
            }
        }
        World { scratch }
    }

    fn home(&self) -> &Path {
        self.scratch.path()
    }
    fn project(&self) -> PathBuf {
        self.home().join("project")
    }
    fn state(&self) -> PathBuf {
        self.home().join("state").join("fgos")
    }
    fn calls(&self) -> Vec<String> {
        std::fs::read_to_string(self.home().join("shim-calls.log"))
            .map(|log| log.lines().map(str::to_string).collect())
            .unwrap_or_default()
    }

    fn fgctl(&self, state_root: &Path, args: &[&str]) -> Output {
        let mut command = Command::new(env!("CARGO_BIN_EXE_fgctl"));
        command
            .args(args)
            .current_dir(self.project())
            .stdin(std::process::Stdio::null());
        command.env("HOME", self.home());
        command.env("XDG_STATE_HOME", self.home().join("state"));
        command.env("FGOS_STATE_ROOT", state_root);
        command.env_remove("FGOS_STATE_HOME");
        command.output().expect("spawn fgctl")
    }

    fn run(&self, args: &[&str]) -> Output {
        self.fgctl(&self.state(), args)
    }
}

fn text(bytes: &[u8]) -> String {
    String::from_utf8_lossy(bytes).into_owned()
}

#[test]
fn uninstall_help_carries_the_required_sections() {
    let world = World::new("help", OK_ANSWER, 0);
    let out = world.run(&["uninstall", "--help"]);
    assert_eq!(out.status.code(), Some(0));
    let stdout = text(&out.stdout);
    for field in [
        "Changes on disk",
        "Prerequisites",
        "Options",
        "--purge",
        "Examples",
        "Exit codes",
        "Next",
    ] {
        assert!(stdout.contains(field), "{stdout}");
    }
}

#[test]
fn without_yes_and_without_a_terminal_it_prints_the_plan_and_changes_nothing() {
    let world = World::new("plan", OK_ANSWER, 0);
    let out = world.run(&["uninstall"]);
    assert_eq!(out.status.code(), Some(0), "{}", text(&out.stderr));
    let stdout = text(&out.stdout);
    assert!(
        stdout.contains("settings.json: remove the fgOS hook"),
        "{stdout}"
    );
    // The directory is named the way the platform spells a path.
    let installation = Path::new(".fgos").join("installation");
    assert!(stdout.contains(installation.to_str().unwrap()), "{stdout}");
    assert!(
        stdout.contains("Keeps:") && stdout.contains("Nothing changed"),
        "{stdout}"
    );
    assert!(
        stdout.contains("claude plugin uninstall fgOS@fgos-plugins"),
        "{stdout}"
    );
    assert!(world
        .project()
        .join(".fgos/installation/activation.json")
        .exists());
    assert_eq!(
        world.calls(),
        vec!["uninstall"],
        "the plan is asked for without --yes"
    );

    let dry = world.run(&["uninstall", "--yes", "--dry-run"]);
    assert_eq!(dry.status.code(), Some(0));
    assert!(world.project().join(".fgos/installation").exists());
    assert_eq!(
        world.calls(),
        vec!["uninstall", "uninstall"],
        "--dry-run never passes --yes on"
    );
}

#[test]
fn yes_reverses_the_wiring_then_removes_the_activation_and_keeps_config_data_and_the_store() {
    let world = World::new("yes", OK_ANSWER, 0);
    let out = world.run(&["uninstall", "--yes"]);
    assert_eq!(out.status.code(), Some(0), "{}", text(&out.stderr));
    assert_eq!(world.calls(), vec!["uninstall", "uninstall --yes"]);
    assert!(!world.project().join(".fgos/installation").exists());
    for kept in [".fgos/config.yaml", ".fgos/distribution.json"] {
        assert!(world.project().join(kept).exists(), "{kept}");
    }
    let backups: Vec<_> = std::fs::read_dir(world.project().join(".fgos"))
        .unwrap()
        .flatten()
        .filter(|e| {
            e.file_name()
                .to_string_lossy()
                .starts_with("uninstall-backup-")
        })
        .collect();
    assert_eq!(
        backups.len(),
        1,
        "the activation record is copied before it goes"
    );
    assert!(backups[0].path().join("activation.json").exists());
    assert!(
        world.state().join("releases").exists(),
        "no --purge, no store removal"
    );
}

#[test]
fn purge_removes_the_release_store_entries_and_nothing_else_of_the_state_root() {
    let world = World::new("purge", OK_ANSWER, 0);
    let dry = world.run(&["uninstall", "--purge"]);
    let plan = text(&dry.stdout);
    assert!(
        plan.contains("--purge") && plan.contains("1 release(s)") && plan.contains("fgctl init"),
        "{plan}"
    );
    assert!(world.state().join("releases").exists());

    let out = world.run(&["uninstall", "--yes", "--purge"]);
    assert_eq!(out.status.code(), Some(0), "{}", text(&out.stderr));
    assert!(!world.state().join("releases").exists());
    assert!(world.state().join("identity").join("who").exists());
    assert!(world.project().join(".fgos/config.yaml").exists());
}

#[test]
fn a_failed_reversal_leaves_the_activation_and_the_store_in_place() {
    let world = World::new("failed", FAILED_ANSWER, 1);
    let out = world.run(&["uninstall", "--yes", "--purge"]);
    assert_eq!(out.status.code(), Some(1));
    let stderr = text(&out.stderr);
    assert!(
        stderr.contains("backup: backup failed, nothing changed")
            && stderr.contains("skipped: activation"),
        "{stderr}"
    );
    assert!(world
        .project()
        .join(".fgos/installation/activation.json")
        .exists());
    assert!(world.state().join("releases").exists());
}

#[test]
fn purge_refuses_a_state_root_that_is_the_home_directory() {
    let world = World::new("home-root", OK_ANSWER, 0);
    let out = world.fgctl(world.home(), &["uninstall", "--yes", "--purge"]);
    assert_eq!(out.status.code(), Some(1));
    assert!(
        text(&out.stderr).contains("refusing to purge"),
        "{}",
        text(&out.stderr)
    );
    assert!(
        world.project().join(".fgos/installation").exists(),
        "a refused purge changes nothing at all"
    );
    assert!(
        world.calls().iter().all(|call| call == "uninstall"),
        "{:?}",
        world.calls()
    );
}

#[test]
fn a_project_whose_shim_is_gone_cannot_be_applied_but_can_be_planned() {
    let world = World::new("no-shim", OK_ANSWER, 0);
    let shim = if cfg!(windows) { "fgos.cmd" } else { "fgos" };
    std::fs::remove_file(world.project().join(".fgos/installation/bin").join(shim)).unwrap();
    let plan = world.run(&["uninstall"]);
    assert_eq!(plan.status.code(), Some(0));
    assert!(
        text(&plan.stdout).contains("fgctl repair"),
        "{}",
        text(&plan.stdout)
    );
    let out = world.run(&["uninstall", "--yes"]);
    assert_eq!(out.status.code(), Some(1));
    assert!(text(&out.stderr).contains("fgctl repair"));
    assert!(world
        .project()
        .join(".fgos/installation/activation.json")
        .exists());
}
