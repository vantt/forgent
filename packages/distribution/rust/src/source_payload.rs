//! The source payload of a checkout: the files the release stages as its Node payload, and the one rule that
//! selects them. It is what the release builder packs and what the doctor row `active-release-matches-checkout`
//! compares the active release with, so both ask this module.
//!
//! The rule: every file under the entries `package.json` declares in `files` (plus `package.json` itself),
//! refusing absolute, escaping and symlinked entries and skipping `.git` and `node_modules` directories; then,
//! inside a Git repository, only the tracked paths and the untracked, non-ignored ones. A tree with no Git
//! layout (an unpacked tarball) keeps the filesystem walk alone and never starts Git.

use fgos_git::{GitDriver, Ignored, InspectCursor, Submodules, Untracked};
use serde_json::{json, Value};
use std::collections::{BTreeSet, HashSet};
use std::io;
use std::path::{Component, Path, PathBuf};

/// Why the payload could not be listed.
#[derive(Debug, thiserror::Error)]
pub enum SourcePayloadError {
    /// A declared entry or a path under it that the rule refuses.
    #[error("{0}")]
    Refused(String),
    #[error("{path}: {source}")]
    Io {
        path: PathBuf,
        #[source]
        source: io::Error,
    },
    #[error("package.json: {0}")]
    PackageJson(String),
    /// A failed Git read: the source set is never guessed.
    #[error("the Git read of the source set failed: {0}")]
    Git(String),
}

fn io_err(path: &Path) -> impl FnOnce(io::Error) -> SourcePayloadError + '_ {
    move |source| SourcePayloadError::Io {
        path: path.to_path_buf(),
        source,
    }
}

/// `path.resolve` without touching the file system: `.` and `..` folded away.
fn lexical(path: &Path) -> PathBuf {
    let mut out = PathBuf::new();
    for component in path.components() {
        match component {
            Component::CurDir => {}
            Component::ParentDir => {
                if !out.pop() {
                    out.push("..");
                }
            }
            other => out.push(other.as_os_str()),
        }
    }
    out
}

fn absolute(path: &Path) -> io::Result<PathBuf> {
    Ok(lexical(&std::path::absolute(path)?))
}

/// JavaScript's default string order (UTF-16 code units), which is the order the staged tree is listed in.
fn js_order(a: &str, b: &str) -> std::cmp::Ordering {
    a.encode_utf16().cmp(b.encode_utf16())
}

fn collect(base: &Path, relative: &Path, out: &mut Vec<String>) -> Result<(), SourcePayloadError> {
    let shown = relative.display();
    if relative.is_absolute() {
        return Err(SourcePayloadError::Refused(format!(
            "Absolute path refused in declared release payload entry: {shown}"
        )));
    }
    let full = base.join(relative);
    let resolved_full = lexical(&full);
    let resolved_base = lexical(base);
    // Strictly inside: `bin/..` resolves to the checkout itself and would stage the whole root.
    if resolved_full == resolved_base || !resolved_full.starts_with(&resolved_base) {
        return Err(SourcePayloadError::Refused(format!(
            "Declared release payload entry escapes the source checkout: {shown}"
        )));
    }
    if !full.exists() {
        return Err(SourcePayloadError::Refused(format!(
            "Declared release payload entry does not exist: {shown}"
        )));
    }
    let meta = std::fs::symlink_metadata(&full).map_err(io_err(&full))?;
    if meta.file_type().is_symlink() {
        return Err(SourcePayloadError::Refused(format!(
            "Symlink refused in release payload: {}",
            resolved_full.display()
        )));
    }
    if meta.is_file() {
        out.push(relative.to_string_lossy().into_owned());
    } else if meta.is_dir() {
        let mut names: Vec<String> = std::fs::read_dir(&full)
            .map_err(io_err(&full))?
            .map(|entry| entry.map(|e| e.file_name().to_string_lossy().into_owned()))
            .collect::<Result<_, _>>()
            .map_err(io_err(&full))?;
        names.sort_by(|a, b| js_order(a, b));
        for name in names {
            if name == ".git" || name == "node_modules" {
                continue;
            }
            collect(base, &relative.join(&name), out)?;
        }
    }
    Ok(())
}

/// The tracked plus untracked non-ignored paths under `root`, relative to it, read through the Git component;
/// `None` outside a repository.
fn repository_files(root: &Path) -> Result<Option<HashSet<String>>, SourcePayloadError> {
    let git =
        |e: fgos_git::OperationError| SourcePayloadError::Git(format!("{:?}: {}", e.code, e.cause));
    if GitDriver::topology_at(root).map_err(git)?.is_none() {
        return Ok(None);
    }
    let Some((driver, repo)) = GitDriver::open_at(root).map_err(git)? else {
        return Ok(None);
    };
    let Some(work_tree) = repo.work_tree() else {
        return Ok(None);
    };
    let top = std::fs::canonicalize(work_tree).map_err(io_err(work_tree))?;
    let here = std::fs::canonicalize(root).map_err(io_err(root))?;
    let prefix = here
        .strip_prefix(&top)
        .map(|p| {
            p.components()
                .map(|c| c.as_os_str().to_string_lossy().into_owned())
                .collect::<Vec<_>>()
                .join("/")
        })
        .map_err(|_| {
            SourcePayloadError::Git("the checkout is not inside its own work tree".into())
        })?;
    let mut files = HashSet::new();
    let mut add = |bytes: &[u8]| {
        let rel = String::from_utf8_lossy(bytes).into_owned();
        if prefix.is_empty() {
            files.insert(rel);
        } else if let Some(under) = rel.strip_prefix(&format!("{prefix}/")) {
            files.insert(under.to_owned());
        }
    };
    let mut cursor: Option<InspectCursor> = None;
    loop {
        let page = driver.tracked_paths(&repo, cursor, 4096).map_err(git)?;
        page.entries.iter().for_each(|p| add(p));
        cursor = page.next_cursor;
        if cursor.is_none() {
            break;
        }
    }
    loop {
        let page = driver
            .status(
                &repo,
                Untracked::All,
                Submodules::Configured,
                Ignored::Excluded,
                cursor,
                4096,
            )
            .map_err(git)?;
        page.entries
            .iter()
            .filter(|e| e.untracked)
            .for_each(|e| add(&e.path));
        cursor = page.next_cursor;
        if cursor.is_none() {
            break;
        }
    }
    Ok(Some(files))
}

/// The source payload of the checkout at `repo_root`: forward-slash paths relative to it, sorted, each once.
pub fn list_source_files(repo_root: &Path) -> Result<Vec<String>, SourcePayloadError> {
    let base = absolute(repo_root).map_err(io_err(repo_root))?;
    let package_path = base.join("package.json");
    let text = std::fs::read_to_string(&package_path).map_err(io_err(&package_path))?;
    let package: Value =
        serde_json::from_str(&text).map_err(|e| SourcePayloadError::PackageJson(e.to_string()))?;
    let mut collected = Vec::new();
    if let Some(declared) = package.get("files").and_then(Value::as_array) {
        for entry in declared {
            let entry = entry.as_str().ok_or_else(|| {
                SourcePayloadError::PackageJson("a `files` entry is not a string".into())
            })?;
            collect(&base, Path::new(entry), &mut collected)?;
        }
    }
    collect(&base, Path::new("package.json"), &mut collected)?;
    let allowed = repository_files(&base)?;
    let mut set = BTreeSet::new();
    for file in collected {
        let resolved = lexical(&base.join(&file));
        let Ok(rel) = resolved.strip_prefix(&base) else {
            continue;
        };
        let rel = rel
            .components()
            .map(|c| c.as_os_str().to_string_lossy().into_owned())
            .collect::<Vec<_>>()
            .join("/");
        if allowed.as_ref().is_none_or(|a| a.contains(&rel)) {
            set.insert(rel);
        }
    }
    let mut files: Vec<String> = set.into_iter().collect();
    files.sort_by(|a, b| js_order(a, b));
    Ok(files)
}

pub const EXIT_USAGE: i32 = 2;
pub const EXIT_VERSION_MISMATCH: i32 = 3;
pub const EXIT_FAILED: i32 = 1;
const PROTOCOL: u64 = 1;

/// `fgos internal source-payload <root> --protocol 1`: the release builder's door to the one source-payload rule.
/// One JSON line on stdout, `{v, protocol, op, result: "ok", files}` or `{..., result: "error", code, message}`.
pub fn route_main(args: &[String]) -> i32 {
    let (code, line) = route(args);
    println!("{line}");
    code
}

/// The route without I/O on stdout: the exit code and the answer line.
pub fn route(args: &[String]) -> (i32, Value) {
    let mut root: Option<&str> = None;
    let mut protocol: Option<&str> = None;
    let mut iter = args.iter();
    while let Some(arg) = iter.next() {
        match arg.as_str() {
            "--protocol" => match iter.next() {
                Some(value) => protocol = Some(value),
                None => return error("usage", "--protocol needs a value", EXIT_USAGE),
            },
            other if other.as_bytes().first() == Some(&b'-') => {
                return error("usage", &format!("unknown argument {other}"), EXIT_USAGE)
            }
            other if root.is_none() => root = Some(other),
            other => return error("usage", &format!("unexpected argument {other}"), EXIT_USAGE),
        }
    }
    if protocol != Some("1") {
        return error(
            "host-version-mismatch",
            "needs --protocol 1",
            EXIT_VERSION_MISMATCH,
        );
    }
    let Some(root) = root else {
        return error("usage", "needs the checkout root", EXIT_USAGE);
    };
    match list_source_files(Path::new(root)) {
        Ok(files) => (
            0,
            json!({ "v": 1, "protocol": PROTOCOL, "op": "source-payload", "result": "ok", "files": files }),
        ),
        Err(err) => error("source-payload-refused", &err.to_string(), EXIT_FAILED),
    }
}

fn error(code: &str, message: &str, exit: i32) -> (i32, Value) {
    (
        exit,
        json!({ "v": 1, "protocol": PROTOCOL, "op": "source-payload", "result": "error", "code": code, "message": message }),
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_scratch::scratch;
    use std::fs;
    use std::process::Command;

    fn put(root: &Path, relative: &str, content: &str) {
        let dest = root.join(relative);
        fs::create_dir_all(dest.parent().unwrap()).unwrap();
        fs::write(dest, content).unwrap();
    }

    fn git(root: &Path, args: &[&str]) {
        let ok = Command::new("git")
            .args([
                "-c",
                "user.name=Fixture",
                "-c",
                "user.email=fixture@example.test",
            ])
            .args(args)
            .current_dir(root)
            .output()
            .unwrap()
            .status
            .success();
        assert!(ok, "git {args:?}");
    }

    fn refused(root: &Path) -> String {
        list_source_files(root).unwrap_err().to_string()
    }

    #[test]
    fn the_payload_is_the_declared_files_and_package_json_sorted_without_git_directories_or_dependencies(
    ) {
        let dir = scratch("payload-walk");
        put(&dir, "package.json", r#"{"files":["src","bin/x.mjs"]}"#);
        put(&dir, "src/b.mjs", "b");
        put(&dir, "src/a.mjs", "a");
        put(&dir, "src/node_modules/dep/i.mjs", "dep");
        put(&dir, "src/.git/config", "g");
        put(&dir, "bin/x.mjs", "x");
        put(&dir, "other.txt", "not declared");
        assert_eq!(
            list_source_files(&dir).unwrap(),
            ["bin/x.mjs", "package.json", "src/a.mjs", "src/b.mjs"]
        );
    }

    #[test]
    fn a_declared_entry_that_is_absolute_escaping_the_root_itself_missing_or_a_link_is_refused_by_name(
    ) {
        let dir = scratch("payload-refusals");
        put(&dir, "real/f.mjs", "f");
        let declare = |entry: &str| {
            put(
                &dir,
                "package.json",
                &json!({ "files": [entry] }).to_string(),
            )
        };
        declare("/etc");
        assert!(
            refused(&dir).starts_with("Absolute path refused in declared release payload entry")
        );
        declare("../outside");
        assert!(
            refused(&dir).starts_with("Declared release payload entry escapes the source checkout")
        );
        declare("real/..");
        assert!(
            refused(&dir).starts_with("Declared release payload entry escapes the source checkout")
        );
        declare("absent");
        assert_eq!(
            refused(&dir),
            "Declared release payload entry does not exist: absent"
        );
        #[cfg(unix)]
        {
            std::os::unix::fs::symlink("real", dir.join("alias")).unwrap();
            declare("alias");
            assert!(refused(&dir).starts_with("Symlink refused in release payload:"));
            declare("real");
            std::os::unix::fs::symlink("f.mjs", dir.join("real/link.mjs")).unwrap();
            assert!(refused(&dir).starts_with("Symlink refused in release payload:"));
        }
    }

    #[test]
    fn inside_a_repository_only_tracked_and_untracked_non_ignored_files_are_the_payload_and_a_tree_without_git_is_walked_whole(
    ) {
        let dir = scratch("payload-git");
        put(&dir, "package.json", r#"{"files":[".agents"]}"#);
        put(
            &dir,
            ".gitignore",
            ".agents/hooks.json\n.agents/skills/instruction-audit/\n",
        );
        put(&dir, ".agents/source.mjs", "source");
        git(&dir, &["init", "-q"]);
        let before = list_source_files(&dir).unwrap();
        put(&dir, ".agents/hooks.json", "{}");
        put(
            &dir,
            ".agents/skills/instruction-audit/SKILL.md",
            "rendered",
        );
        assert_eq!(list_source_files(&dir).unwrap(), before);
        assert_eq!(before, [".agents/source.mjs", "package.json"]);
        fs::remove_dir_all(dir.join(".git")).unwrap();
        assert_eq!(
            list_source_files(&dir).unwrap(),
            [
                ".agents/hooks.json",
                ".agents/skills/instruction-audit/SKILL.md",
                ".agents/source.mjs",
                "package.json"
            ]
        );
    }

    #[test]
    fn a_payload_root_below_the_top_of_its_repository_lists_paths_relative_to_itself() {
        let dir = scratch("payload-nested");
        put(&dir, "sub/package.json", r#"{"files":["src"]}"#);
        put(&dir, "sub/src/a.mjs", "a");
        put(&dir, "top.txt", "t");
        git(&dir, &["init", "-q"]);
        assert_eq!(
            list_source_files(&dir.join("sub")).unwrap(),
            ["package.json", "src/a.mjs"]
        );
    }

    #[test]
    fn the_route_answers_one_ok_line_with_the_files_refuses_other_protocols_and_names_a_refused_payload(
    ) {
        let dir = scratch("payload-route");
        put(&dir, "package.json", r#"{"files":[]}"#);
        let root = dir.display().to_string();
        let args = |list: &[&str]| list.iter().map(|a| a.to_string()).collect::<Vec<_>>();
        let (code, line) = route(&args(&[&root, "--protocol", "1"]));
        assert_eq!((code, line["result"].clone()), (0, json!("ok")));
        assert_eq!(line["files"], json!(["package.json"]));
        let (code, line) = route(&args(&[&root, "--protocol", "2"]));
        assert_eq!(
            (code, line["code"].clone()),
            (3, json!("host-version-mismatch"))
        );
        let (code, _) = route(&args(&["--protocol", "1"]));
        assert_eq!(code, EXIT_USAGE);
        put(&dir, "package.json", r#"{"files":["absent"]}"#);
        let (code, line) = route(&args(&[&root, "--protocol", "1"]));
        assert_eq!((code, line["result"].clone()), (1, json!("error")));
        assert_eq!(line["code"], "source-payload-refused");
    }
}
