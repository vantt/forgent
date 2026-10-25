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
/// a slash and repeated slashes collapse. Reading stops once both keys are
/// found. Every name the shim sets starts with `_fgos_`, so a caller's
/// exported variables reach the entry unchanged; a lost carriage-return byte
/// (a tool that strips a lone CR) only stops the CR handling, never the loop.
fn sh_body(entry: &str) -> String {
    let body = format!(
        r#"#!/bin/sh
# fgOS workspace stable shim -- written by fgctl. Do not hand-edit; run
# `fgctl repair` to regenerate it.
set -eu
case $0 in */*) _fgos_self_dir=${{0%/*}} ;; *) _fgos_self_dir=. ;; esac
_fgos_activation="$_fgos_self_dir/../activation.json"
[ -f "$_fgos_activation" ] || {{ echo "fgos: no active runtime -- run fgctl init" >&2; exit 3; }}
[ -r "$_fgos_activation" ] || {{ echo "fgos: activation.json is not readable -- run fgctl repair" >&2; exit 3; }}
_fgos_cr='CR'
# _fgos_value KEY LINE: sets $_fgos_value from a line `"KEY": "VALUE"`; false otherwise.
_fgos_value() {{
  _fgos_v=${{2%"$_fgos_cr"}}
  _fgos_v=${{_fgos_v#"${{_fgos_v%%[![:space:]]*}}"}}
  case $_fgos_v in "\"$1\""*) _fgos_v=${{_fgos_v#"\"$1\""}} ;; *) return 1 ;; esac
  _fgos_v=${{_fgos_v#"${{_fgos_v%%[![:space:]]*}}"}}
  case $_fgos_v in :*) _fgos_v=${{_fgos_v#:}} ;; *) return 1 ;; esac
  _fgos_v=${{_fgos_v#"${{_fgos_v%%[![:space:]]*}}"}}
  case $_fgos_v in \"*) _fgos_v=${{_fgos_v#\"}} ;; *) return 1 ;; esac
  while :; do case $_fgos_v in *,) _fgos_v=${{_fgos_v%,}} ;; *) break ;; esac; done
  case $_fgos_v in *\") _fgos_v=${{_fgos_v%\"}} ;; *) return 1 ;; esac
  [ -z "$_fgos_cr" ] || while :; do case $_fgos_v in *"$_fgos_cr"*) _fgos_v=${{_fgos_v%%"$_fgos_cr"*}}${{_fgos_v#*"$_fgos_cr"}} ;; *) break ;; esac; done
  _fgos_value=$_fgos_v
}}
_fgos_status= _fgos_release_path= _fgos_found_status= _fgos_found_path=
while IFS= read -r _fgos_line || [ -n "$_fgos_line" ]; do
  if [ -z "$_fgos_found_status" ] && _fgos_value status "$_fgos_line"; then _fgos_status=$_fgos_value; _fgos_found_status=1; fi
  if [ -z "$_fgos_found_path" ] && _fgos_value releasePath "$_fgos_line"; then _fgos_release_path=$_fgos_value; _fgos_found_path=1; fi
  [ -z "$_fgos_found_status" ] || [ -z "$_fgos_found_path" ] || break
done < "$_fgos_activation"
[ "$_fgos_status" = "ready" ] || {{ echo "fgos: active runtime is not ready ($_fgos_status) -- run fgctl repair" >&2; exit 3; }}
while :; do case $_fgos_release_path in *\\*) _fgos_release_path=${{_fgos_release_path%%\\*}}/${{_fgos_release_path#*\\}} ;; *) break ;; esac; done
while :; do case $_fgos_release_path in *//*) _fgos_release_path=${{_fgos_release_path%%//*}}/${{_fgos_release_path#*//}} ;; *) break ;; esac; done
[ -n "$_fgos_release_path" ] || {{ echo "fgos: activation.json missing releasePath -- run fgctl repair" >&2; exit 3; }}
_fgos_entry="$_fgos_release_path/bin/{entry}"
if [ ! -x "$_fgos_entry" ] && [ -x "${{_fgos_entry}}.exe" ]; then
  _fgos_entry="${{_fgos_entry}}.exe"
fi
[ -x "$_fgos_entry" ] || {{ echo "fgos: active release entry not found: $_fgos_entry -- run fgctl repair" >&2; exit 3; }}
exec "$_fgos_entry" "$@"
"#
    );
    // A literal carriage return: the only way a POSIX shell names one
    // without running a program.
    body.replacen("_fgos_cr='CR'", "_fgos_cr='\r'", 1)
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
/// `sh` ones executable. Each file is replaced by rename through the durable
/// file door, never rewritten in place: a shell already running the old shim
/// (every agent hook call runs it) never reads a half-written one.
pub fn write_workspace_shims(bin_dir: &Path) -> std::io::Result<()> {
    std::fs::create_dir_all(bin_dir)?;
    for shim in workspace_shims() {
        let path = bin_dir.join(shim.name);
        let mode = if shim.windows_shell { 0o644 } else { 0o755 };
        fgos_durable_file::replace_durably_with_mode(
            bin_dir,
            shim.name,
            shim.body.as_bytes(),
            mode,
        )
        .map_err(std::io::Error::other)?;
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
        assert!(fgos
            .body
            .contains(r#"_fgos_entry="$_fgos_release_path/bin/fgos""#));
        assert!(fgos.body.contains(r#"exec "$_fgos_entry" "$@""#));
        let runner = shims.iter().find(|s| s.name == "fgos-runner").unwrap();
        assert!(runner
            .body
            .contains(r#"_fgos_entry="$_fgos_release_path/bin/fgos-runner""#));
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

        // A rewrite replaces each file by rename, never in place: a shell
        // already reading the old shim keeps reading the old bytes, and no
        // temporary file is left beside the launchers.
        let mut old = std::fs::File::open(dir.join("fgos.cmd")).unwrap();
        write_workspace_shims(&dir).unwrap();
        check_workspace_shims(&dir, true).unwrap();
        let mut seen = String::new();
        std::io::Read::read_to_string(&mut old, &mut seen).unwrap();
        assert_eq!(
            seen, "@echo hand-edited\r\n",
            "the old file was not rewritten in place"
        );
        let mut names: Vec<String> = std::fs::read_dir(&dir)
            .unwrap()
            .map(|e| e.unwrap().file_name().to_string_lossy().into_owned())
            .collect();
        names.sort();
        let mut wanted: Vec<String> = workspace_shims()
            .iter()
            .map(|s| s.name.to_string())
            .collect();
        wanted.sort();
        assert_eq!(names, wanted);
        let _ = std::fs::remove_dir_all(&dir);
    }

    /// A workspace with the `fgos` sh shim, an `activation.json` of `text`,
    /// and a release entry that prints its arguments.
    #[cfg(unix)]
    fn shim_scene(tag: &str, text: &str) -> (std::path::PathBuf, std::path::PathBuf) {
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
        // Written by a child process, so no descriptor of it open for writing
        // is inherited by a sibling test's fork (exec would fail with "text
        // file busy").
        let written = std::process::Command::new("sh")
            .arg("-c")
            .arg("printf '#!/bin/sh\\necho \"ran $0 $*\"\\n' > \"$1\" && chmod 755 \"$1\"")
            .arg("sh")
            .arg(&entry)
            .status()
            .unwrap();
        assert!(written.success());
        let text = text.replace("RELEASE", release.to_str().unwrap());
        std::fs::write(root.join("installation").join("activation.json"), text).unwrap();
        (root, bin.join("fgos"))
    }

    #[cfg(unix)]
    fn run_shim(shim: &Path, path_var: &str) -> std::process::Output {
        // The shim was just written by this process: a sibling test's fork may
        // still hold it open for writing for a moment.
        for _ in 0..50 {
            match std::process::Command::new(shim)
                .args(["hook", "mailbox"])
                .env_clear()
                .env("PATH", path_var)
                .output()
            {
                Err(e) if e.kind() == std::io::ErrorKind::ExecutableFileBusy => {
                    std::thread::sleep(std::time::Duration::from_millis(20))
                }
                other => return other.unwrap(),
            }
        }
        panic!("{} stayed busy", shim.display())
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
                "{\n\"status\"  :   \"ready\",,\n   \"releasePath\":\"RELEASE\"\n  \"status\": \"later\",\n}".to_string(),
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

    /// Runs `shim` with `env` only, ending it after `limit`; `None` when it had not returned.
    #[cfg(unix)]
    fn run_shim_within(
        shim: &Path,
        env: &[(&str, &str)],
        limit: std::time::Duration,
    ) -> Option<std::process::Output> {
        let path = std::env::var("PATH").unwrap_or_default();
        for _ in 0..50 {
            let spawned = std::process::Command::new(shim)
                .args(["hook", "mailbox"])
                .env_clear()
                .env("PATH", &path)
                .envs(env.iter().copied())
                .stdout(std::process::Stdio::piped())
                .stderr(std::process::Stdio::piped())
                .spawn();
            let mut child = match spawned {
                Err(e) if e.kind() == std::io::ErrorKind::ExecutableFileBusy => {
                    std::thread::sleep(std::time::Duration::from_millis(20));
                    continue;
                }
                other => other.unwrap(),
            };
            let start = std::time::Instant::now();
            while start.elapsed() < limit {
                if child.try_wait().unwrap().is_some() {
                    return Some(child.wait_with_output().unwrap());
                }
                std::thread::sleep(std::time::Duration::from_millis(10));
            }
            let _ = child.kill();
            let _ = child.wait();
            return None;
        }
        panic!("{} stayed busy", shim.display())
    }

    const PRETTY: &str = "{\n  \"status\": \"ready\",\n  \"releasePath\": \"RELEASE\",\n  \"shimVersion\": \"1\"\n}\n";

    #[cfg(unix)]
    #[test]
    fn a_sh_shim_whose_carriage_return_byte_was_lost_still_returns_and_runs_the_entry() {
        let (root, shim) = shim_scene("no-cr", PRETTY);
        // A tool that strips a lone carriage return leaves `cr=''`.
        let body = std::fs::read_to_string(&shim).unwrap();
        assert!(body.contains("_fgos_cr='\r'"));
        std::fs::remove_file(&shim).unwrap();
        let written = std::process::Command::new("sh")
            .arg("-c")
            .arg("printf '%s' \"$2\" > \"$1\" && chmod 755 \"$1\"")
            .arg("sh")
            .arg(&shim)
            .arg(body.replace("_fgos_cr='\r'", "_fgos_cr=''"))
            .status()
            .unwrap();
        assert!(written.success());
        let out = run_shim_within(&shim, &[], std::time::Duration::from_secs(5))
            .expect("the shim returned");
        assert_eq!(out.status.code(), Some(0), "{out:?}");
        assert!(String::from_utf8_lossy(&out.stdout)
            .trim_end()
            .ends_with("/release/bin/fgos hook mailbox"));
        // Without the byte a CRLF activation is no longer understood, but the shim still returns.
        let activation = root.join("installation").join("activation.json");
        let crlf = std::fs::read_to_string(&activation)
            .unwrap()
            .replace('\n', "\r\n");
        std::fs::write(&activation, crlf).unwrap();
        let out = run_shim_within(&shim, &[], std::time::Duration::from_secs(5))
            .expect("the shim returned on a CRLF activation");
        assert_eq!(out.status.code(), Some(3), "{out:?}");
        let _ = std::fs::remove_dir_all(&root);
    }

    #[cfg(unix)]
    #[test]
    fn a_sh_shim_leaves_the_callers_exported_variables_to_the_entry_untouched() {
        let (root, shim) = shim_scene("caller-env", PRETTY);
        let entry = root.join("release").join("bin").join("fgos");
        let names = [
            "v",
            "value",
            "line",
            "cr",
            "status",
            "release_path",
            "found_status",
            "found_path",
            "entry",
            "activation",
            "self_dir",
        ];
        let script = format!("#!/bin/sh\nfor n in {}; do eval \"printf '%s=%s;' \\\"$n\\\" \\\"\\${{$n-unset}}\\\"\"; done\n", names.join(" "));
        let written = std::process::Command::new("sh")
            .arg("-c")
            .arg("rm -f \"$1\" && printf '%s' \"$2\" > \"$1\" && chmod 755 \"$1\"")
            .arg("sh")
            .arg(&entry)
            .arg(&script)
            .status()
            .unwrap();
        assert!(written.success());
        let env: Vec<(&str, String)> = names.iter().map(|n| (*n, format!("caller-{n}"))).collect();
        let env: Vec<(&str, &str)> = env.iter().map(|(n, v)| (*n, v.as_str())).collect();
        let out = run_shim_within(&shim, &env, std::time::Duration::from_secs(5))
            .expect("the shim returned");
        assert_eq!(out.status.code(), Some(0), "{out:?}");
        let expected: String = names.iter().map(|n| format!("{n}=caller-{n};")).collect();
        assert_eq!(String::from_utf8_lossy(&out.stdout), expected);
        let _ = std::fs::remove_dir_all(&root);
    }

    #[cfg(unix)]
    #[test]
    fn an_unreadable_activation_refuses_with_exit_3_and_the_repair_hint() {
        use std::os::unix::fs::PermissionsExt;
        let (root, shim) = shim_scene("unreadable", PRETTY);
        let activation = root.join("installation").join("activation.json");
        std::fs::set_permissions(&activation, std::fs::Permissions::from_mode(0o000)).unwrap();
        // Root reads a mode-000 file anyway; the refusal is then not reachable, and the
        // test says so instead of passing silently.
        if std::fs::read(&activation).is_ok() {
            eprintln!("skipped: running as root, a mode-000 activation.json is still readable");
        } else {
            let out = run_shim_within(&shim, &[], std::time::Duration::from_secs(5))
                .expect("the shim returned");
            assert_eq!(out.status.code(), Some(3), "{out:?}");
            assert!(
                String::from_utf8_lossy(&out.stderr).contains("-- run fgctl repair"),
                "{out:?}"
            );
        }
        std::fs::set_permissions(&activation, std::fs::Permissions::from_mode(0o600)).unwrap();
        let _ = std::fs::remove_dir_all(&root);
    }

    #[cfg(unix)]
    #[test]
    fn a_sh_shim_stops_reading_once_it_has_both_keys() {
        // Both keys first, then a long tail. The same shim without its early stop is the
        // yardstick, run on the same file in the same place: the shim must take a small
        // fraction of its time, whatever the machine's speed.
        let pad = "x".repeat(200);
        let tail: String = (0..60_000)
            .map(|i| format!("  \"pad{i}\": \"{pad}\",\n"))
            .collect();
        let (root, shim) = shim_scene(
            "long-tail",
            &format!("{{\n  \"status\": \"ready\",\n  \"releasePath\": \"RELEASE\",\n{tail}}}\n"),
        );
        let stop = "  [ -z \"$_fgos_found_status\" ] || [ -z \"$_fgos_found_path\" ] || break\n";
        let body = std::fs::read_to_string(&shim).unwrap();
        assert!(body.contains(stop));
        let yardstick = shim.with_file_name("fgos-without-early-stop");
        let written = std::process::Command::new("sh")
            .arg("-c")
            .arg("printf '%s' \"$2\" > \"$1\" && chmod 755 \"$1\"")
            .arg("sh")
            .arg(&yardstick)
            .arg(body.replace(stop, ""))
            .status()
            .unwrap();
        assert!(written.success());
        let timed = |file: &Path| {
            let start = std::time::Instant::now();
            let out =
                run_shim_within(file, &[], std::time::Duration::from_secs(120)).expect("returned");
            assert_eq!(out.status.code(), Some(0), "{out:?}");
            start.elapsed()
        };
        let without = timed(&yardstick);
        let with = timed(&shim);
        assert!(
            with * 5 < without,
            "with the early stop {with:?}, without it {without:?}"
        );
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
