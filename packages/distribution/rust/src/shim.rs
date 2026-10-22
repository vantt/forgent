//! Workspace stable shims (`.fgos/installation/bin/`).
//!
//! `fgctl` writes the same small launcher in two forms next to
//! `activation.json`: a POSIX `sh` script (Linux, macOS, Git Bash) and a `.cmd`
//! batch file (PowerShell and `cmd.exe`, no `sh` needed). Both read the
//! activation binding at run time, refuse unless its `status` is `ready`, and
//! exec the active release's entry. The bodies are pure data so every platform's
//! shim can be generated and checked from any machine.

use std::path::{Path, PathBuf};

/// Names of the launchers the release tree exposes under `bin/`.
const ENTRY_FGOS: &str = "fgos";
const ENTRY_FGOS_RUNNER: &str = "fgos-runner";

/// The `sh` launcher for `entry` (`fgos` or `fgos-runner`). It runs on every
/// fgOS call, agent hooks included, so it starts no helper program: the
/// activation file is read with shell builtins only (no `dirname`, `sed`,
/// `head` or `tr`), and the shell `exec`s the entry. Reading rules: the first
/// line of the form `"<key>": "<value>"` (spaces around the colon, trailing
/// commas and a trailing carriage return allowed) gives the value; carriage
/// returns inside it are dropped, and in `releasePath` every backslash becomes
/// a slash and repeated slashes collapse.
fn sh_body(entry: &str) -> String {
    let body = format!(
        r#"#!/bin/sh
# fgOS workspace stable shim -- written by fgctl. Do not hand-edit; run
# `fgctl repair` to regenerate it.
set -eu
case $0 in */*) self_dir=${{0%/*}} ;; *) self_dir=. ;; esac
activation="$self_dir/../activation.json"
[ -f "$activation" ] || {{ echo "fgos: no active runtime -- run fgctl init" >&2; exit 3; }}
cr='CR'
# value KEY LINE: sets $value from a line `"KEY": "VALUE"`; false otherwise.
value() {{
  v=${{2%"$cr"}}
  v=${{v#"${{v%%[![:space:]]*}}"}}
  case $v in "\"$1\""*) v=${{v#"\"$1\""}} ;; *) return 1 ;; esac
  v=${{v#"${{v%%[![:space:]]*}}"}}
  case $v in :*) v=${{v#:}} ;; *) return 1 ;; esac
  v=${{v#"${{v%%[![:space:]]*}}"}}
  case $v in \"*) v=${{v#\"}} ;; *) return 1 ;; esac
  while :; do case $v in *,) v=${{v%,}} ;; *) break ;; esac; done
  case $v in *\") v=${{v%\"}} ;; *) return 1 ;; esac
  while :; do case $v in *"$cr"*) v=${{v%%"$cr"*}}${{v#*"$cr"}} ;; *) break ;; esac; done
  value=$v
}}
status= release_path= found_status= found_path=
while IFS= read -r line || [ -n "$line" ]; do
  if [ -z "$found_status" ] && value status "$line"; then status=$value; found_status=1; fi
  if [ -z "$found_path" ] && value releasePath "$line"; then release_path=$value; found_path=1; fi
done < "$activation"
[ "$status" = "ready" ] || {{ echo "fgos: active runtime is not ready ($status) -- run fgctl repair" >&2; exit 3; }}
while :; do case $release_path in *\\*) release_path=${{release_path%%\\*}}/${{release_path#*\\}} ;; *) break ;; esac; done
while :; do case $release_path in *//*) release_path=${{release_path%%//*}}/${{release_path#*//}} ;; *) break ;; esac; done
[ -n "$release_path" ] || {{ echo "fgos: activation.json missing releasePath -- run fgctl repair" >&2; exit 3; }}
entry="$release_path/bin/{entry}"
if [ ! -x "$entry" ] && [ -x "${{entry}}.exe" ]; then
  entry="${{entry}}.exe"
fi
[ -x "$entry" ] || {{ echo "fgos: active release entry not found: $entry -- run fgctl repair" >&2; exit 3; }}
exec "$entry" "$@"
"#
    );
    // A literal carriage return: the only way a POSIX shell names one
    // without running a program.
    body.replacen("cr='CR'", "cr='\r'", 1)
}

/// The `.cmd` launcher. `target` is the release-relative Windows file it runs
/// (`bin\fgos.exe`, or `bin\fgos-runner.cmd`); `via_call` is true for a batch
/// target, which must be `call`ed so control returns here.
///
/// Parsing notes, since `cmd.exe` has no JSON reader: `activation.json` is
/// written by `serde_json`'s pretty printer, so each value sits on its own line
/// as `  "key": "value",`. `findstr` picks the key's line, delayed expansion
/// (enabled only after the lines are read, so a `!` in a path survives) strips
/// the key, the quotes and the comma, and JSON's doubled backslashes collapse.
/// The release path is handed back through `endlocal` before the launch so the
/// caller's own arguments are never subject to delayed expansion (a `!` in an
/// argument stays a `!`).
fn cmd_body(target: &str, via_call: bool) -> String {
    let launch = if via_call {
        r#"call "%FGOS_SHIM_ENTRY%" %*"#
    } else {
        r#""%FGOS_SHIM_ENTRY%" %*"#
    };
    let lines = [
        "@echo off",
        "rem fgOS workspace stable shim -- written by fgctl. Do not hand-edit; run",
        "rem `fgctl repair` to regenerate it.",
        "setlocal EnableExtensions DisableDelayedExpansion",
        r#"set "ACTIVATION=%~dp0..\activation.json""#,
        r#"if not exist "%ACTIVATION%" ("#,
        "  >&2 echo fgos: no active runtime -- run fgctl init",
        "  exit /b 3",
        ")",
        r#"set "STATUS_LINE=""#,
        r#"set "RELEASE_LINE=""#,
        r#"for /f "usebackq delims=" %%L in (`findstr /r /c:"^ *.status.:" "%ACTIVATION%"`) do if not defined STATUS_LINE set "STATUS_LINE=%%L""#,
        r#"for /f "usebackq delims=" %%L in (`findstr /r /c:"^ *.releasePath.:" "%ACTIVATION%"`) do if not defined RELEASE_LINE set "RELEASE_LINE=%%L""#,
        "setlocal EnableDelayedExpansion",
        r#"if not defined STATUS_LINE ("#,
        "  >&2 echo fgos: activation.json has no status -- run fgctl repair",
        "  exit /b 3",
        ")",
        r#"set "STATUS=!STATUS_LINE:*: =!""#,
        r#"set "STATUS=!STATUS:"=!""#,
        r#"if "!STATUS:~-1!"=="," set "STATUS=!STATUS:~0,-1!""#,
        r#"if /i not "!STATUS!"=="ready" ("#,
        "  >&2 echo fgos: active runtime is not ready ^(!STATUS!^) -- run fgctl repair",
        "  exit /b 3",
        ")",
        r#"if not defined RELEASE_LINE ("#,
        "  >&2 echo fgos: activation.json missing releasePath -- run fgctl repair",
        "  exit /b 3",
        ")",
        r#"set "RELEASE=!RELEASE_LINE:*: =!""#,
        r#"set "RELEASE=!RELEASE:"=!""#,
        r#"if "!RELEASE:~-1!"=="," set "RELEASE=!RELEASE:~0,-1!""#,
        r#"set "RELEASE=!RELEASE:\\=\!""#,
        r#"if "!RELEASE:~0,4!"=="\\?\" set "RELEASE=!RELEASE:~4!""#,
        &format!(r#"set "ENTRY=!RELEASE!\{target}""#),
        r#"if not exist "!ENTRY!" ("#,
        "  >&2 echo fgos: active release entry not found: !ENTRY! -- run fgctl repair",
        "  exit /b 3",
        ")",
        r#"endlocal & set "FGOS_SHIM_ENTRY=%ENTRY%""#,
        launch,
        "exit /b %ERRORLEVEL%",
    ];
    let mut body = lines.join("\r\n");
    body.push_str("\r\n");
    body
}

/// One launcher file under `.fgos/installation/bin/`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WorkspaceShim {
    /// File name inside `bin/`.
    pub name: &'static str,
    pub body: String,
    /// True when the file is needed on every host that runs a Windows shell
    /// (`.cmd`); false for the `sh` pair, which a Windows host only needs for
    /// Git Bash.
    pub windows_shell: bool,
}

/// Every launcher `fgctl` writes, on every host (the directory is
/// workspace-local and gitignored, and a checkout shared between WSL/Git Bash
/// and PowerShell needs both forms).
pub fn workspace_shims() -> Vec<WorkspaceShim> {
    vec![
        WorkspaceShim {
            name: "fgos",
            body: sh_body(ENTRY_FGOS),
            windows_shell: false,
        },
        WorkspaceShim {
            name: "fgos-runner",
            body: sh_body(ENTRY_FGOS_RUNNER),
            windows_shell: false,
        },
        WorkspaceShim {
            name: "fgos.cmd",
            body: cmd_body(r"bin\fgos.exe", false),
            windows_shell: true,
        },
        WorkspaceShim {
            name: "fgos-runner.cmd",
            body: cmd_body(r"bin\fgos-runner.cmd", true),
            windows_shell: true,
        },
    ]
}

/// Writes every launcher into `bin_dir` (replacing what is there) and marks the
/// `sh` ones executable.
pub fn write_workspace_shims(bin_dir: &Path) -> std::io::Result<()> {
    std::fs::create_dir_all(bin_dir)?;
    for shim in workspace_shims() {
        let path = bin_dir.join(shim.name);
        std::fs::write(&path, &shim.body)?;
        #[cfg(unix)]
        if !shim.windows_shell {
            use std::os::unix::fs::PermissionsExt;
            let _ = std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o755));
        }
    }
    Ok(())
}

/// The launchers a host must have to run fgOS from its own shell. Every host
/// needs the `sh` pair; a Windows host also needs the `.cmd` pair, which is what
/// PowerShell and `cmd.exe` resolve.
pub fn required_shim_names(windows_host: bool) -> Vec<&'static str> {
    workspace_shims()
        .into_iter()
        .filter(|s| !s.windows_shell || windows_host)
        .map(|s| s.name)
        .collect()
}

/// Checks that every required launcher in `bin_dir` is present and exactly what
/// this `fgctl` would write; the error names the first problem and the fix.
pub fn check_workspace_shims(bin_dir: &Path, windows_host: bool) -> Result<(), String> {
    let required = required_shim_names(windows_host);
    for shim in workspace_shims() {
        if !required.contains(&shim.name) {
            continue;
        }
        let path = bin_dir.join(shim.name);
        match std::fs::read_to_string(&path) {
            Ok(found) if found == shim.body => {}
            Ok(_) => {
                return Err(format!(
                    "workspace shim {} differs from the one this fgctl writes; run fgctl repair",
                    path.display()
                ))
            }
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
                return Err(format!(
                    "workspace shim {} is missing; run fgctl repair",
                    path.display()
                ))
            }
            Err(e) => return Err(format!("workspace shim {} unreadable: {e}", path.display())),
        }
    }
    Ok(())
}

/// The launcher the post-activation tail runs: the `.cmd` form on a Windows
/// host (no `sh` is assumed there), the `sh` form elsewhere. `shim_path` is the
/// `sh` form (`bin/fgos`).
pub fn tail_shim_path(shim_path: &Path, windows_host: bool) -> PathBuf {
    if windows_host {
        shim_path.with_extension("cmd")
    } else {
        shim_path.to_path_buf()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sh_shims_keep_their_exact_original_bodies() {
        let shims = workspace_shims();
        let fgos = shims.iter().find(|s| s.name == "fgos").unwrap();
        assert!(fgos.body.starts_with("#!/bin/sh\n"));
        assert!(fgos.body.contains(r#"entry="$release_path/bin/fgos""#));
        assert!(fgos.body.contains(r#"exec "$entry" "$@""#));
        let runner = shims.iter().find(|s| s.name == "fgos-runner").unwrap();
        assert!(runner
            .body
            .contains(r#"entry="$release_path/bin/fgos-runner""#));
    }

    #[test]
    fn cmd_shims_are_crlf_only_and_need_no_sh() {
        for shim in workspace_shims().iter().filter(|s| s.windows_shell) {
            assert!(shim.body.starts_with("@echo off\r\n"), "{}", shim.name);
            assert!(shim.body.ends_with("\r\n"), "{}", shim.name);
            // Every line break is CRLF: stripping CRLF pairs leaves no bare LF.
            assert!(
                !shim.body.replace("\r\n", "").contains('\n'),
                "{}",
                shim.name
            );
            assert!(!shim.body.contains("#!/bin/sh"), "{}", shim.name);
            assert!(!shim.body.contains("sh \""), "{}", shim.name);
            assert!(shim.body.contains("exit /b 3"), "{}", shim.name);
            assert!(shim.body.contains("is not ready"), "{}", shim.name);
        }
    }

    #[test]
    fn cmd_shims_launch_the_right_windows_entry() {
        let shims = workspace_shims();
        let fgos = shims.iter().find(|s| s.name == "fgos.cmd").unwrap();
        assert!(fgos.body.contains(r#"set "ENTRY=!RELEASE!\bin\fgos.exe""#));
        assert!(fgos.body.contains("\r\n\"%FGOS_SHIM_ENTRY%\" %*\r\n"));
        assert!(!fgos.body.contains("call \"%FGOS_SHIM_ENTRY%\""));
        let runner = shims.iter().find(|s| s.name == "fgos-runner.cmd").unwrap();
        assert!(runner
            .body
            .contains(r#"set "ENTRY=!RELEASE!\bin\fgos-runner.cmd""#));
        // A batch target must be `call`ed or control never comes back.
        assert!(runner
            .body
            .contains("\r\ncall \"%FGOS_SHIM_ENTRY%\" %*\r\n"));
    }

    #[test]
    fn cmd_shim_reads_activation_the_way_fgctl_writes_it() {
        // Fixture mirrors the pretty printer's layout for the two fields read.
        let fgos = workspace_shims()
            .into_iter()
            .find(|s| s.name == "fgos.cmd")
            .unwrap();
        assert!(fgos.body.contains(r#"/c:"^ *.status.:""#));
        assert!(fgos.body.contains(r#"/c:"^ *.releasePath.:""#));
        // Verbatim `\\?\` prefix and JSON's doubled backslashes are both handled.
        assert!(fgos.body.contains(r#"!RELEASE:\\=\!"#));
        assert!(fgos.body.contains(r#"if "!RELEASE:~0,4!"=="\\?\""#));
    }

    #[test]
    fn required_shims_depend_on_the_host() {
        assert_eq!(required_shim_names(false), vec!["fgos", "fgos-runner"]);
        assert_eq!(
            required_shim_names(true),
            vec!["fgos", "fgos-runner", "fgos.cmd", "fgos-runner.cmd"]
        );
    }

    #[test]
    fn tail_runs_the_cmd_form_only_on_windows() {
        let sh = Path::new("ws/.fgos/installation/bin/fgos");
        assert_eq!(tail_shim_path(sh, false), sh);
        assert_eq!(
            tail_shim_path(sh, true),
            Path::new("ws/.fgos/installation/bin/fgos.cmd")
        );
    }

    #[test]
    fn write_then_check_round_trips_and_detects_drift_and_absence() {
        let dir = std::env::temp_dir().join(format!(
            "fgctl-shim-test-{}-{}",
            std::process::id(),
            crate::store::now_millis()
        ));
        write_workspace_shims(&dir).unwrap();
        for host in [false, true] {
            check_workspace_shims(&dir, host).unwrap();
        }

        std::fs::write(dir.join("fgos.cmd"), "@echo hand-edited\r\n").unwrap();
        // The sh pair is all a non-Windows host needs; the edited .cmd only fails Windows.
        check_workspace_shims(&dir, false).unwrap();
        let err = check_workspace_shims(&dir, true).unwrap_err();
        assert!(
            err.contains("fgos.cmd") && err.contains("fgctl repair"),
            "{err}"
        );

        std::fs::remove_file(dir.join("fgos-runner")).unwrap();
        let err = check_workspace_shims(&dir, false).unwrap_err();
        assert!(
            err.contains("fgos-runner") && err.contains("missing"),
            "{err}"
        );

        write_workspace_shims(&dir).unwrap();
        check_workspace_shims(&dir, true).unwrap();
        let _ = std::fs::remove_dir_all(&dir);
    }

    /// A workspace with the `fgos` sh shim, an `activation.json` of `text`,
    /// and a release entry that prints its arguments.
    #[cfg(unix)]
    fn shim_scene(tag: &str, text: &str) -> (std::path::PathBuf, std::path::PathBuf) {
        use std::os::unix::fs::PermissionsExt;
        let root = std::env::temp_dir().join(format!(
            "fgctl-shim-run-{tag}-{}-{}",
            std::process::id(),
            crate::store::now_millis()
        ));
        let bin = root.join("installation").join("bin");
        write_workspace_shims(&bin).unwrap();
        let release = root.join("release");
        std::fs::create_dir_all(release.join("bin")).unwrap();
        let entry = release.join("bin").join("fgos");
        std::fs::write(&entry, "#!/bin/sh\necho \"ran $0 $*\"\n").unwrap();
        std::fs::set_permissions(&entry, std::fs::Permissions::from_mode(0o755)).unwrap();
        let text = text.replace("RELEASE", release.to_str().unwrap());
        std::fs::write(root.join("installation").join("activation.json"), text).unwrap();
        (root, bin.join("fgos"))
    }

    #[cfg(unix)]
    fn run_shim(shim: &Path, path_var: &str) -> std::process::Output {
        std::process::Command::new(shim)
            .args(["hook", "mailbox"])
            .env_clear()
            .env("PATH", path_var)
            .output()
            .unwrap()
    }

    #[cfg(unix)]
    #[test]
    fn the_sh_shim_reads_activation_and_execs_the_entry_with_only_shell_builtins() {
        let pretty = "{\n  \"status\": \"ready\",\n  \"releasePath\": \"RELEASE\",\n  \"shimVersion\": \"1\"\n}\n";
        let path = std::env::var("PATH").unwrap_or_default();
        for (tag, text, path_var) in [
            ("pretty", pretty.to_string(), path.as_str()),
            // No helper program is run: an empty PATH still reaches the entry.
            ("no-path", pretty.to_string(), ""),
            ("crlf", pretty.replace('\n', "\r\n"), path.as_str()),
            (
                "messy",
                "{\n\"status\"  :   \"ready\",,\n   \"releasePath\":\"RELEASE\"\n,\"status\": \"later\"\n}".to_string(),
                path.as_str(),
            ),
        ] {
            let (root, shim) = shim_scene(tag, &text);
            let out = run_shim(&shim, path_var);
            let stdout = String::from_utf8_lossy(&out.stdout);
            assert_eq!(out.status.code(), Some(0), "{tag}: {out:?}");
            assert!(stdout.starts_with("ran ") && stdout.trim_end().ends_with("/release/bin/fgos hook mailbox"), "{tag}: {stdout}");
            let _ = std::fs::remove_dir_all(&root);
        }
    }

    #[cfg(unix)]
    #[test]
    fn the_sh_shim_normalises_the_release_path_and_refuses_what_it_cannot_run() {
        let path = std::env::var("PATH").unwrap_or_default();
        // Backslashes become slashes and repeated slashes collapse.
        let (root, shim) = shim_scene(
            "slashes",
            "{\n  \"status\": \"ready\",\n  \"releasePath\": \"RELEASE\"\n}\n",
        );
        let activation = root.join("installation").join("activation.json");
        let text = std::fs::read_to_string(&activation).unwrap();
        let release = root.join("release").to_str().unwrap().to_string();
        let messy = release
            .replacen('/', "//", 1)
            .replace("/release", "\\\\release");
        std::fs::write(&activation, text.replace(&release, &messy)).unwrap();
        let out = run_shim(&shim, &path);
        assert_eq!(out.status.code(), Some(0), "{out:?}");
        assert!(String::from_utf8_lossy(&out.stdout).contains(&format!("ran {release}/bin/fgos")));
        let _ = std::fs::remove_dir_all(&root);

        for (tag, text, words) in [
            (
                "not-ready",
                "{\n  \"status\": \"staging\",\n  \"releasePath\": \"RELEASE\"\n}\n",
                "not ready (staging)",
            ),
            (
                "no-status",
                "{\n  \"releasePath\": \"RELEASE\"\n}\n",
                "not ready ()",
            ),
            (
                "no-path",
                "{\n  \"status\": \"ready\"\n}\n",
                "missing releasePath",
            ),
            (
                "no-entry",
                "{\n  \"status\": \"ready\",\n  \"releasePath\": \"/nonexistent/release\"\n}\n",
                "active release entry not found: /nonexistent/release/bin/fgos",
            ),
        ] {
            let (root, shim) = shim_scene(tag, text);
            let out = run_shim(&shim, &path);
            assert_eq!(out.status.code(), Some(3), "{tag}");
            assert!(
                String::from_utf8_lossy(&out.stderr).contains(words),
                "{tag}: {out:?}"
            );
            let _ = std::fs::remove_dir_all(&root);
        }
        let (root, shim) = shim_scene("absent", "");
        std::fs::remove_file(root.join("installation").join("activation.json")).unwrap();
        let out = run_shim(&shim, &path);
        assert_eq!(out.status.code(), Some(3));
        assert!(String::from_utf8_lossy(&out.stderr).contains("no active runtime"));
        let _ = std::fs::remove_dir_all(&root);
    }

    #[cfg(unix)]
    #[test]
    fn sh_shims_are_executable_and_cmd_shims_are_not_required_to_be() {
        use std::os::unix::fs::PermissionsExt;
        let dir = std::env::temp_dir().join(format!(
            "fgctl-shim-mode-{}-{}",
            std::process::id(),
            crate::store::now_millis()
        ));
        write_workspace_shims(&dir).unwrap();
        for name in ["fgos", "fgos-runner"] {
            let mode = std::fs::metadata(dir.join(name))
                .unwrap()
                .permissions()
                .mode();
            assert_eq!(mode & 0o111, 0o111, "{name}");
        }
        let _ = std::fs::remove_dir_all(&dir);
    }
}
