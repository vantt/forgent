//! Read-only detection of fgOS shell integration lines in a person's shell rc files.
//!
//! `fgos uninstall` names the lines it never edits: deleting a line from a person's own shell profile stays a
//! human act, so nothing here writes. Only rc files that already exist are reported, and only `source` lines
//! that name fgOS's own `fgos-shell-integration.sh` count: lines the person wrote are none of fgOS's business.
//!
//! The rules are those of the Node module this replaces for the verbs (`src/setup/shell-rc.mjs`); that module
//! stays only for the repository's session-start hook, which prints the rc file names as context.

use std::io;
use std::path::{Path, PathBuf};

const RC_FILE_NAMES: [&str; 2] = [".bashrc", ".zshrc"];

/// Well-known default profile locations (Microsoft docs): Windows PowerShell 5.1 and PowerShell 7+ keep
/// separate profile files under the user's Documents folder. Detection only: `source "..."` is not PowerShell.
const WINDOWS_PROFILES: [[&str; 3]; 2] = [
    [
        "Documents",
        "PowerShell",
        "Microsoft.PowerShell_profile.ps1",
    ],
    [
        "Documents",
        "WindowsPowerShell",
        "Microsoft.PowerShell_profile.ps1",
    ],
];

const SCRIPT_NAME: &str = "fgos-shell-integration.sh";

/// The integration script of a payload: the release's `scripts/fgos-shell-integration.sh`, found from the
/// payload root the manifest names (`components.legacyNode.root`). Existing rc lines source this file, so it
/// keeps shipping.
pub fn integration_script_path(payload_root: &Path) -> PathBuf {
    payload_root.join("scripts").join(SCRIPT_NAME)
}

/// The script an rc line can name for a payload that sits in a Git checkout: its `scripts/` file, rewritten to the
/// same path in the main checkout when the payload is a linked worktree, so a worktree never earns a line of
/// its own. `None` for a payload outside any checkout (a release, an unpacked archive): no rc line was ever
/// written for such a place, so there is nothing to look for.
pub fn checkout_integration_script(payload_root: &Path) -> Option<PathBuf> {
    let executing = integration_script_path(payload_root);
    let repo = fgos_git::GitDriver::topology_at(executing.parent()?)
        .ok()
        .flatten()?;
    // The line names the script in the plain spelling a shell reads, not the verbatim one a canonical path has.
    let canonical = fgos_git::plain_path(&repo.trusted_main_root())
        .join("scripts")
        .join(SCRIPT_NAME);
    Some(if canonical.exists() {
        canonical
    } else {
        executing
    })
}

/// The rc files of `home` that exist: bash and zsh, or the PowerShell profiles when `platform` is `win32`.
pub fn detect_rc_files(home: &Path, platform: &str) -> Vec<PathBuf> {
    let candidates: Vec<PathBuf> = if platform == "win32" {
        WINDOWS_PROFILES
            .iter()
            .map(|parts| {
                parts
                    .iter()
                    .fold(home.to_path_buf(), |p, part| p.join(part))
            })
            .collect()
    } else {
        RC_FILE_NAMES.iter().map(|name| home.join(name)).collect()
    };
    candidates.into_iter().filter(|p| p.exists()).collect()
}

/// JavaScript's `\s`: Unicode white space plus the byte-order mark, without U+0085.
fn is_space(c: char) -> bool {
    (c.is_whitespace() && c != '\u{85}') || c == '\u{feff}'
}

fn is_quote(c: char) -> bool {
    c == '"' || c == '\''
}

/// The lines of `text`, ended at the line terminators of a JavaScript multiline match.
fn lines(text: &str) -> impl Iterator<Item = &str> {
    text.split(['\n', '\r', '\u{2028}', '\u{2029}'])
}

/// What follows `source` or `.` and its white space, for a line that is a source command; `None` otherwise.
fn after_source_command(line: &str) -> Option<&str> {
    let body = line.trim_start_matches(is_space);
    let rest = body
        .strip_prefix("source")
        .or_else(|| body.strip_prefix('.'))?;
    let argument = rest.trim_start_matches(is_space);
    (argument.len() < rest.len()).then_some(argument)
}

/// Whether `rest` is only white space, or white space and a `#` comment.
fn ends_line(rest: &str) -> bool {
    let rest = rest.trim_start_matches(is_space);
    rest.is_empty() || rest.starts_with('#')
}

/// Whether the line is `source "<script>"` (quotes optional, a trailing comment allowed).
fn names_script(line: &str, script: &str) -> bool {
    let Some(argument) = after_source_command(line) else {
        return false;
    };
    let unquoted = argument
        .strip_prefix(is_quote)
        .filter(|rest| rest.starts_with(script))
        .unwrap_or(argument);
    let Some(rest) = unquoted.strip_prefix(script) else {
        return false;
    };
    ends_line(rest.strip_prefix(is_quote).unwrap_or(rest)) || ends_line(rest)
}

/// The path an fgOS integration `source` line names, whichever path it is.
fn any_script_target(line: &str) -> Option<String> {
    let argument = after_source_command(line)?;
    let token_end = argument.find(is_space).unwrap_or(argument.len());
    let (token, after_token) = argument.split_at(token_end);
    let token = token.strip_prefix(is_quote).unwrap_or(token);
    // The longest capture that ends at the script name and leaves only a quote, a comment or nothing.
    let mut end = token.len();
    while let Some(at) = token[..end].rfind(SCRIPT_NAME) {
        let capture_end = at + SCRIPT_NAME.len();
        let rest = &token[capture_end..];
        let rest = rest.strip_prefix(is_quote).unwrap_or(rest);
        if (rest.is_empty() && ends_line(after_token)) || rest.starts_with('#') {
            let capture = &token[..capture_end];
            return Some(
                capture
                    .strip_prefix(is_quote)
                    .unwrap_or(capture)
                    .to_string(),
            );
        }
        end = at;
    }
    None
}

fn read_lossy(rc: &Path) -> io::Result<String> {
    Ok(String::from_utf8_lossy(&std::fs::read(rc)?).into_owned())
}

/// Whether `rc` holds a `source` line naming `script`. A missing file holds none.
pub fn has_source_line(rc: &Path, script: &Path) -> io::Result<bool> {
    if !rc.exists() {
        return Ok(false);
    }
    let script = script.to_string_lossy();
    Ok(lines(&read_lossy(rc)?).any(|line| names_script(line, &script)))
}

/// Every fgOS integration `source` line in `rc` whose target no longer exists on disk. These accumulate
/// because each removed worktree or temp checkout leaves its own line behind, and every one makes an
/// interactive shell emit `no such file or directory` on open.
pub fn dead_source_lines(rc: &Path) -> io::Result<Vec<String>> {
    if !rc.exists() {
        return Ok(Vec::new());
    }
    Ok(lines(&read_lossy(rc)?)
        .filter_map(any_script_target)
        .filter(|target| !Path::new(target).exists())
        .collect())
}

/// The rc files of `home` that hold a source line naming `script`: what `uninstall` reports and never edits.
pub fn rc_files_sourcing(home: &Path, platform: &str, script: &Path) -> io::Result<Vec<PathBuf>> {
    let mut found = Vec::new();
    for rc in detect_rc_files(home, platform) {
        if has_source_line(&rc, script)? {
            found.push(rc);
        }
    }
    Ok(found)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_scratch::scratch;

    #[test]
    fn only_rc_files_that_exist_are_detected_bash_before_zsh() {
        let home = scratch("detect");
        assert!(detect_rc_files(&home, "linux").is_empty());
        std::fs::write(home.join(".zshrc"), "").unwrap();
        assert_eq!(detect_rc_files(&home, "linux"), vec![home.join(".zshrc")]);
        std::fs::write(home.join(".bashrc"), "").unwrap();
        assert_eq!(
            detect_rc_files(&home, "darwin"),
            vec![home.join(".bashrc"), home.join(".zshrc")]
        );
    }

    #[test]
    fn windows_detects_both_powershell_profiles_and_never_bash_files() {
        let home = scratch("win");
        std::fs::write(home.join(".bashrc"), "").unwrap();
        for dir in ["PowerShell", "WindowsPowerShell"] {
            let d = home.join("Documents").join(dir);
            std::fs::create_dir_all(&d).unwrap();
            std::fs::write(d.join("Microsoft.PowerShell_profile.ps1"), "").unwrap();
        }
        let found = detect_rc_files(&home, "win32");
        assert_eq!(found.len(), 2);
        assert!(found
            .iter()
            .all(|p| p.extension().is_some_and(|e| e == "ps1")));
    }

    #[test]
    fn a_source_line_naming_the_script_matches_with_quotes_dot_and_comment_and_nothing_else_does() {
        let home = scratch("has");
        let script = home.join("scripts").join(SCRIPT_NAME);
        let s = script.display();
        let rc = home.join(".bashrc");
        for yes in [
            format!("source {s}"),
            format!("source \"{s}\""),
            format!("  . '{s}'  # added"),
            format!("echo hi\nsource \"{s}\"\n"),
            format!("source \"{s}\"#glued"),
        ] {
            std::fs::write(&rc, &yes).unwrap();
            assert!(has_source_line(&rc, &script).unwrap(), "{yes:?}");
        }
        for no in [
            format!("# source {s}"),
            format!("echo source {s}"),
            format!("source {s}.bak"),
            format!("source {s} extra"),
            format!("sources {s}"),
            format!("source\"{s}\""),
            "source /other/fgos-shell-integration.sh".to_string(),
            String::new(),
        ] {
            std::fs::write(&rc, &no).unwrap();
            assert!(!has_source_line(&rc, &script).unwrap(), "{no:?}");
        }
        assert!(!has_source_line(&home.join(".absent"), &script).unwrap());
    }

    #[test]
    fn a_line_per_terminator_style_is_judged_alone() {
        let home = scratch("crlf");
        let script = home.join(SCRIPT_NAME);
        let rc = home.join(".zshrc");
        std::fs::write(&rc, format!("a\r\nsource {}\r\nb", script.display())).unwrap();
        assert!(has_source_line(&rc, &script).unwrap());
    }

    #[test]
    fn dead_lines_are_the_fgos_lines_whose_target_is_gone_and_a_persons_own_lines_are_never_reported(
    ) {
        let home = scratch("dead");
        let live = home.join("live").join(SCRIPT_NAME);
        std::fs::create_dir_all(live.parent().unwrap()).unwrap();
        std::fs::write(&live, "").unwrap();
        let gone = home.join("gone").join(SCRIPT_NAME);
        let rc = home.join(".bashrc");
        std::fs::write(
            &rc,
            format!(
                "source \"{}\"\n. '{}' # old\nsource {}/mine.sh\n# source {}\nsource /nowhere/{SCRIPT_NAME} trailing\n",
                live.display(),
                gone.display(),
                home.display(),
                gone.display()
            ),
        )
        .unwrap();
        assert_eq!(
            dead_source_lines(&rc).unwrap(),
            vec![gone.display().to_string()]
        );
        assert!(dead_source_lines(&home.join(".none")).unwrap().is_empty());
    }

    #[test]
    fn the_script_an_rc_line_can_name_exists_only_for_a_payload_inside_a_checkout() {
        let root = scratch("checkout");
        let payload = root.join("payload");
        std::fs::create_dir_all(payload.join("scripts")).unwrap();
        assert_eq!(checkout_integration_script(&payload), None, "no checkout");
        let git = root.join(".git");
        std::fs::create_dir_all(git.join("objects")).unwrap();
        std::fs::create_dir_all(git.join("refs")).unwrap();
        std::fs::write(git.join("HEAD"), "ref: refs/heads/main\n").unwrap();
        assert_eq!(
            checkout_integration_script(&payload),
            Some(integration_script_path(&payload)),
            "the main checkout has no such script of its own: the payload's file is named"
        );
        let canonical = root.join("scripts");
        std::fs::create_dir_all(&canonical).unwrap();
        std::fs::write(canonical.join(SCRIPT_NAME), "").unwrap();
        assert_eq!(
            checkout_integration_script(&payload),
            Some(canonical.join(SCRIPT_NAME)),
            "the main checkout's own script wins"
        );
    }

    #[test]
    fn uninstall_names_only_the_rc_files_that_source_this_payloads_script() {
        let home = scratch("sourcing");
        let payload = scratch("payload");
        let script = integration_script_path(&payload);
        assert_eq!(script, payload.join("scripts").join(SCRIPT_NAME));
        std::fs::write(
            home.join(".bashrc"),
            format!("source \"{}\"\n", script.display()),
        )
        .unwrap();
        std::fs::write(
            home.join(".zshrc"),
            "source /elsewhere/fgos-shell-integration.sh\n",
        )
        .unwrap();
        assert_eq!(
            rc_files_sourcing(&home, "linux", &script).unwrap(),
            vec![home.join(".bashrc")]
        );
    }

    #[test]
    fn detection_writes_nothing() {
        let home = scratch("readonly");
        let rc = home.join(".bashrc");
        std::fs::write(&rc, "source /x/fgos-shell-integration.sh\n").unwrap();
        let before = std::fs::metadata(&rc).unwrap().modified().unwrap();
        let _ = rc_files_sourcing(&home, "linux", &home.join(SCRIPT_NAME)).unwrap();
        let _ = dead_source_lines(&rc).unwrap();
        assert_eq!(
            std::fs::read_to_string(&rc).unwrap(),
            "source /x/fgos-shell-integration.sh\n"
        );
        assert_eq!(std::fs::metadata(&rc).unwrap().modified().unwrap(), before);
    }

    #[test]
    fn edge_lines_are_judged_as_the_node_patterns_judged_them() {
        // (line, names the script, dead target); read from the Node module's answers for the same lines.
        let script = "/h/scripts/fgos-shell-integration.sh";
        let table: [(&str, bool, bool); 11] = [
            ("source S", true, true),
            ("source \"S\"#glued", true, true),
            ("source \"S\" extra", false, false),
            ("source\"S\"", false, false),
            ("source S'", true, true),
            ("source 'S'\"", false, false),
            ("source  \"S\"   ", true, true),
            ("\tsource S#", true, true),
            ("source S\n# c", true, true),
            (".S", false, false),
            (". Sx", false, false),
        ];
        let dir = scratch("edge");
        let rc = dir.join(".bashrc");
        for (line, names, dead) in table {
            std::fs::write(&rc, line.replace('S', script)).unwrap();
            assert_eq!(
                has_source_line(&rc, Path::new(script)).unwrap(),
                names,
                "{line:?}"
            );
            assert_eq!(
                !dead_source_lines(&rc).unwrap().is_empty(),
                dead,
                "{line:?}"
            );
        }
    }
}
