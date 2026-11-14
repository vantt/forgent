//! The invocation-fault record: a malformed `fgos` call leaves one line in
//! `.fgos/logs/invocation-faults.jsonl` naming the call site, never its values.
//!
//! This is the Rust writer of a record whose other writer is
//! `src/observe/invocation-fault-log.mjs`. Neither can serve both processes: the
//! Node side must record a fault when the host itself is unreachable, and the host
//! must record its own without spawning Node. Both are held to one contract by
//! `test/rust-host/fixtures/invocation-fault-vectors.json`, which both test suites
//! read.
//!
//! Two properties hold on a path that has already failed:
//! - [`record`] never panics and never reports an error to its caller; it answers
//!   the path it wrote or `None`.
//! - nothing here creates `.fgos/`. A linked worktree carries no store by design,
//!   so a record goes to the resolved store, else to the main checkout's existing
//!   store, else nowhere.

use fgos_identity::resolve_current;
use serde_json::{json, Value};
use std::fs::{self, OpenOptions};
use std::io::{self, Write};
use std::path::{Path, PathBuf};

use crate::time::now_iso;

/// Past this size the oldest half of the log is dropped.
pub const LOG_MAX_BYTES: u64 = 1024 * 1024;

/// The log's path under a store directory (`.fgos/`).
pub fn store_log_path(store: &Path) -> PathBuf {
    store.join("logs").join("invocation-faults.jsonl")
}

const FLAG_NAME_MAX_TAIL: usize = 39;

/// What a caller knows at the point of failure. The fault class comes from the
/// call site's position; it is never derived from `message`.
#[derive(Debug, Clone, Copy)]
pub struct FaultInput<'a> {
    /// The store the invocation already resolved, when it did.
    pub fgos_dir: Option<&'a Path>,
    pub cwd: &'a Path,
    pub verb: Option<&'a str>,
    /// The sub-verb as typed, when the caller names one; kept in the argv shape.
    pub sub: Option<&'a str>,
    pub fault_class: &'a str,
    pub message: &'a str,
    pub argv: &'a [String],
}

/// UTF-16 length, which is what the Node writer counts.
fn utf16_len(text: &str) -> usize {
    text.encode_utf16().count()
}

/// `-x` or `--name`: a letter, then at most 39 letters, digits or hyphens.
fn is_flag_name(name: &str) -> bool {
    let rest = name
        .strip_prefix("--")
        .or_else(|| name.strip_prefix('-'))
        .unwrap_or("");
    let mut chars = rest.chars();
    chars
        .next()
        .is_some_and(|first| first.is_ascii_alphabetic())
        && chars.clone().count() <= FLAG_NAME_MAX_TAIL
        && chars.all(|c| c.is_ascii_alphanumeric() || c == '-')
}

/// A flag token with a value reduced to `name=<len>`, a bare flag as it is, and
/// `None` for a token that is not a flag.
fn shape_flag(token: &str) -> Option<String> {
    let (name, value) = match token.split_once('=') {
        Some((name, value)) => (name, Some(value)),
        None => (token, None),
    };
    is_flag_name(name).then(|| match value {
        Some(value) => format!("{name}=<{}>", utf16_len(value)),
        None => name.to_owned(),
    })
}

/// The shape of a call: the verb (and `sub`, when the caller names the sub-verb)
/// as typed, a flag by its name, and every other token, a flag's value included,
/// by its length (`<12>`), so a secret passed as an argument never reaches the log.
pub fn argv_shape(argv: &[String], sub: Option<&str>) -> Vec<String> {
    argv.iter()
        .enumerate()
        .map(|(index, token)| {
            if index == 0 || (index == 1 && sub == Some(token.as_str())) {
                return token.clone();
            }
            shape_flag(token).unwrap_or_else(|| format!("<{}>", utf16_len(token)))
        })
        .collect()
}

/// `message` with every appearance of a call token that [`argv_shape`] changes
/// replaced by that token's shape, longest token first. The unknown-flag message
/// quotes the whole token the caller typed, so without this the record would hold
/// an argument value the argv rule keeps out. Cleaning against the argv, not
/// against the message's own words, also covers malformed tokens no word rule
/// recognizes (`--api_key=x`, `--=x`, an over-long name).
fn redact_message(message: &str, argv: &[String], sub: Option<&str>) -> String {
    let shapes = argv_shape(argv, sub);
    let mut swaps: Vec<(&str, &str)> = argv
        .iter()
        .zip(&shapes)
        .skip(1)
        .filter(|(token, shape)| !token.is_empty() && token != shape)
        .map(|(token, shape)| (token.as_str(), shape.as_str()))
        .collect();
    swaps.sort_by_key(|(token, _)| std::cmp::Reverse(token.len()));
    let mut out = String::with_capacity(message.len());
    let mut rest = message;
    while let Some(ch) = rest.chars().next() {
        match swaps.iter().find(|(token, _)| rest.starts_with(token)) {
            Some((token, shape)) => {
                out.push_str(shape);
                rest = &rest[token.len()..];
            }
            None => {
                out.push(ch);
                rest = &rest[ch.len_utf8()..];
            }
        }
    }
    out
}

/// Where a fault record would go, or `None` when there is nowhere to put it.
/// Prefers the store the invocation already resolved, falls back to the main
/// checkout's existing store, and never creates a directory.
pub fn log_path(fgos_dir: Option<&Path>, cwd: &Path) -> Option<PathBuf> {
    let store = match fgos_dir.filter(|dir| dir.exists()) {
        Some(dir) => dir.to_path_buf(),
        None => {
            let main = fgos_git::main_checkout_root(cwd).ok().flatten()?;
            let fallback = main.join(".fgos");
            fallback.exists().then_some(fallback)?
        }
    };
    Some(store_log_path(&store))
}

/// Drops the oldest half of the log's lines once it is past [`LOG_MAX_BYTES`].
fn halve_if_over_cap(log: &Path) -> io::Result<()> {
    match fs::metadata(log) {
        Ok(meta) if meta.len() > LOG_MAX_BYTES => {}
        Ok(_) => return Ok(()),
        Err(err) if err.kind() == io::ErrorKind::NotFound => return Ok(()),
        Err(err) => return Err(err),
    }
    let bytes = fs::read(log)?;
    let lines: Vec<&[u8]> = bytes
        .split(|byte| *byte == b'\n')
        .filter(|line| !line.is_empty())
        .collect();
    let mut kept = Vec::with_capacity(bytes.len() / 2 + 1);
    for line in &lines[lines.len().div_ceil(2)..] {
        kept.extend_from_slice(line);
        kept.push(b'\n');
    }
    let mut temp = log.as_os_str().to_owned();
    temp.push(format!(".{}.tmp", std::process::id()));
    let temp = PathBuf::from(temp);
    let written = private(OpenOptions::new().write(true).create(true).truncate(true))
        .open(&temp)
        .and_then(|mut file| file.write_all(&kept))
        .and_then(|()| fs::rename(&temp, log));
    if written.is_err() {
        let _ = fs::remove_file(&temp);
    }
    written
}

#[cfg(unix)]
fn private(options: &mut OpenOptions) -> &mut OpenOptions {
    use std::os::unix::fs::OpenOptionsExt;
    options.mode(0o600)
}

#[cfg(not(unix))]
fn private(options: &mut OpenOptions) -> &mut OpenOptions {
    options
}

#[cfg(unix)]
fn make_private(log: &Path) -> io::Result<()> {
    use std::os::unix::fs::PermissionsExt;
    fs::set_permissions(log, fs::Permissions::from_mode(0o600))
}

#[cfg(not(unix))]
fn make_private(_log: &Path) -> io::Result<()> {
    Ok(())
}

/// Appends one whole line to the log: the file is created 0600 and, past the cap,
/// loses its oldest half first. Takes no lock: one `write` of a whole line under
/// `O_APPEND` keeps concurrent appends from tearing a line, but the halving
/// (read, temp file, rename) can drop an append made while it runs. A lost
/// diagnostic line past the cap is accepted, as on the Node side.
fn append_capped(log: &Path, record: &Value) -> io::Result<()> {
    if let Some(parent) = log.parent() {
        // `create_dir`, not `create_dir_all`: a store that vanished since the
        // check must not be recreated here.
        match fs::create_dir(parent) {
            Err(err) if err.kind() != io::ErrorKind::AlreadyExists => return Err(err),
            _ => {}
        }
    }
    halve_if_over_cap(log)?;
    let mut line = serde_json::to_vec(record).map_err(io::Error::other)?;
    line.push(b'\n');
    private(OpenOptions::new().append(true).create(true))
        .open(log)?
        .write_all(&line)?;
    // The line has landed; a failed chmod must not report it as lost.
    let _ = make_private(log);
    Ok(())
}

/// Appends one fault record. Answers the path written, or `None` when nothing was
/// written; a caller that announces the record names the path only on `Some`.
///
/// The writer identity comes from the identity crate and cannot fail here, so the
/// record never carries the Node side's `writerError`.
pub fn record(input: &FaultInput<'_>) -> Option<PathBuf> {
    if input.fault_class.is_empty() {
        return None;
    }
    let log = log_path(input.fgos_dir, input.cwd)?;
    let store = log.parent().and_then(Path::parent);
    let record = json!({
        "ts": now_iso(),
        "faultClass": input.fault_class,
        "verb": input.verb,
        "message": redact_message(input.message, input.argv, input.sub),
        "cwd": input.cwd.to_string_lossy(),
        "argv": argv_shape(input.argv, input.sub),
        "writer": resolve_current(store),
    });
    append_capped(&log, &record).ok()?;
    Some(log)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicU32, Ordering};

    fn vectors() -> Value {
        let path = Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../../test/rust-host/fixtures/invocation-fault-vectors.json");
        serde_json::from_slice(&fs::read(&path).expect("the shared vector file is readable"))
            .expect("the shared vector file is JSON")
    }

    fn strings(value: &Value) -> Vec<String> {
        value
            .as_array()
            .expect("an array of strings")
            .iter()
            .map(|item| item.as_str().expect("a string").to_owned())
            .collect()
    }

    /// A fresh canonical scratch directory per call.
    fn scratch() -> PathBuf {
        static NEXT: AtomicU32 = AtomicU32::new(0);
        let dir = std::env::temp_dir().join(format!(
            "fgos-fault-{}-{}",
            std::process::id(),
            NEXT.fetch_add(1, Ordering::SeqCst)
        ));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        fs::canonicalize(dir).unwrap()
    }

    /// Builds the repository on disk the way the VCS lays it out; the host reads
    /// the topology from these files, so no VCS process is needed.
    fn build_layout(root: &Path, layout: &Value) {
        if let Some(main) = layout["repository"].as_str() {
            let vcs = root.join(main).join(".git");
            fs::create_dir_all(&vcs).unwrap();
            if let Some(wt) = layout["linkedWorktree"].as_str() {
                let admin = vcs.join("worktrees").join(wt);
                fs::create_dir_all(&admin).unwrap();
                fs::write(admin.join("commondir"), "../..\n").unwrap();
                let wt_gitfile = root.join(wt).join(".git");
                fs::write(admin.join("gitdir"), format!("{}\n", wt_gitfile.display())).unwrap();
                fs::create_dir_all(root.join(wt)).unwrap();
                fs::write(wt_gitfile, format!("gitdir: {}\n", admin.display())).unwrap();
            }
        } else {
            fs::create_dir_all(root.join("plain")).unwrap();
        }
        for store in layout["stores"].as_array().unwrap() {
            fs::create_dir_all(root.join(store.as_str().unwrap()).join(".fgos")).unwrap();
        }
    }

    #[test]
    fn argv_shape_follows_the_shared_vectors() {
        for row in vectors()["argvShape"].as_array().unwrap() {
            let argv = strings(&row["argv"]);
            let got = argv_shape(&argv, row["sub"].as_str());
            assert_eq!(got, strings(&row["expectedArgvShape"]), "{}", row["name"]);
        }
    }

    #[test]
    fn log_path_follows_the_shared_vectors() {
        for row in vectors()["pathChoice"].as_array().unwrap() {
            let root = scratch();
            build_layout(&root, &row["layout"]);
            let fgos_dir = row["call"]["fgosDir"].as_str().map(|dir| root.join(dir));
            let cwd = root.join(row["call"]["cwd"].as_str().unwrap());
            let expected = row["expected"].as_str().map(|path| root.join(path));
            assert_eq!(
                log_path(fgos_dir.as_deref(), &cwd),
                expected,
                "{}",
                row["name"]
            );
            fs::remove_dir_all(&root).unwrap();
        }
    }

    #[test]
    fn a_record_has_the_shared_key_order_and_the_shape_of_the_call() {
        let root = scratch();
        fs::create_dir_all(root.join(".fgos")).unwrap();
        let argv = ["work", "add", "--api-key", "sk-live-0123456789abcdef"].map(String::from);
        let written = record(&FaultInput {
            fgos_dir: Some(&root.join(".fgos")),
            cwd: &root,
            verb: Some("work"),
            sub: Some("add"),
            fault_class: "arg-parse",
            message: "bad call",
            argv: &argv,
        })
        .expect("the store exists, so the record lands");
        let text = fs::read_to_string(&written).unwrap();
        assert!(!text.contains("sk-live"));
        let value: serde_json::Map<String, Value> = serde_json::from_str(text.trim_end()).unwrap();
        let keys: Vec<String> = value.keys().cloned().collect();
        assert_eq!(keys, strings(&vectors()["recordKeyOrder"]));
        assert_eq!(value["argv"], json!(["work", "add", "--api-key", "<24>"]));
        assert!(value["writer"]["id"].is_string());
        assert!(value["writer"]["source"].is_string());
        fs::remove_dir_all(&root).unwrap();
    }

    #[test]
    fn a_flag_value_in_the_message_keeps_only_its_length() {
        let argv =
            |tokens: &[&str]| -> Vec<String> { tokens.iter().map(|t| t.to_string()).collect() };
        let cases: [(&[&str], &str, &str); 9] = [
            (
                &["list", "--key=secret"],
                "unknown flag --key=secret for verb list",
                "unknown flag --key=<6> for verb list",
            ),
            (
                &["list", "--key=secret"],
                "unknown flag \"--key=secret\".",
                "unknown flag \"--key=<6>\".",
            ),
            (&["list", "--dir"], "bad --dir", "bad --dir"),
            (&["list", "a=b"], "a=b is not a flag", "<3> is not a flag"),
            (
                &["list", "--k=v"],
                "  spaced\t--k=v  ",
                "  spaced\t--k=<1>  ",
            ),
            (
                &["list", "--token=abc def ghi"],
                "unknown flag \"--token=abc def ghi\"",
                "unknown flag \"--token=<11>\"",
            ),
            (
                &["list", "--api_key=XYZ123"],
                "unknown flag --api_key=XYZ123",
                "unknown flag <16>",
            ),
            (
                &["list", "--=XYZ123"],
                "unknown flag --=XYZ123",
                "unknown flag <9>",
            ),
            (
                &[
                    "list",
                    "--aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa=XYZ123",
                ],
                "unknown flag --aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa=XYZ123",
                "unknown flag <56>",
            ),
        ];
        for (tokens, message, expected) in cases {
            assert_eq!(
                redact_message(message, &argv(tokens), None),
                expected,
                "{message}"
            );
        }
    }

    #[test]
    fn nothing_is_recorded_without_a_store_and_no_store_is_created() {
        let root = scratch();
        let wt_root = scratch();
        build_layout(
            &wt_root,
            &json!({ "repository": "main", "stores": [], "linkedWorktree": "wt" }),
        );
        for cwd in [root.clone(), wt_root.join("wt")] {
            let argv = ["nosuchverb".to_owned()];
            let written = record(&FaultInput {
                fgos_dir: None,
                cwd: &cwd,
                verb: Some("nosuchverb"),
                sub: None,
                fault_class: "unknown-verb",
                message: "unknown verb",
                argv: &argv,
            });
            assert_eq!(written, None);
            assert!(!cwd.join(".fgos").exists());
        }
        assert!(!wt_root.join("main/.fgos").exists());
        fs::remove_dir_all(&root).unwrap();
        fs::remove_dir_all(&wt_root).unwrap();
    }

    #[test]
    fn a_worktree_fault_lands_in_the_main_checkout_store() {
        let root = scratch();
        build_layout(
            &root,
            &json!({ "repository": "main", "stores": ["main"], "linkedWorktree": "wt" }),
        );
        let wt = root.join("wt");
        let argv = ["submit".to_owned()];
        let written = record(&FaultInput {
            fgos_dir: Some(&wt.join(".fgos")),
            cwd: &wt,
            verb: Some("submit"),
            sub: None,
            fault_class: "store-missing",
            message: ".fgos/ not found",
            argv: &argv,
        })
        .unwrap();
        assert_eq!(
            written,
            root.join("main/.fgos/logs/invocation-faults.jsonl")
        );
        assert!(!wt.join(".fgos").exists());
        let value: Value =
            serde_json::from_str(fs::read_to_string(&written).unwrap().trim_end()).unwrap();
        assert_eq!(value["cwd"], json!(wt.to_string_lossy()));
        fs::remove_dir_all(&root).unwrap();
    }

    #[test]
    fn an_empty_fault_class_records_nothing() {
        let root = scratch();
        fs::create_dir_all(root.join(".fgos")).unwrap();
        let written = record(&FaultInput {
            fgos_dir: Some(&root.join(".fgos")),
            cwd: &root,
            verb: None,
            sub: None,
            fault_class: "",
            message: "m",
            argv: &[],
        });
        assert_eq!(written, None);
        assert!(!root.join(".fgos/logs").exists());
        fs::remove_dir_all(&root).unwrap();
    }

    #[test]
    fn a_log_past_its_cap_drops_the_oldest_half_keeps_whole_lines_and_stays_private() {
        let root = scratch();
        let log = root.join("logs/faults.jsonl");
        let filler = "x".repeat(1000);
        let total = usize::try_from(LOG_MAX_BYTES / 1000).unwrap() + 10;
        for n in 0..total {
            append_capped(&log, &json!({ "n": n, "filler": filler })).unwrap();
        }
        let kept: Vec<u64> = fs::read_to_string(&log)
            .unwrap()
            .lines()
            .map(|line| {
                serde_json::from_str::<Value>(line).unwrap()["n"]
                    .as_u64()
                    .unwrap()
            })
            .collect();
        assert!(
            kept.len() < total,
            "the cap dropped records while the log grew"
        );
        assert_eq!(kept.last(), Some(&(total as u64 - 1)));
        assert!(
            kept.windows(2).all(|pair| pair[0] < pair[1]),
            "what is kept keeps its order"
        );
        assert!(fs::metadata(&log).unwrap().len() <= LOG_MAX_BYTES + 2000);
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            assert_eq!(
                fs::metadata(&log).unwrap().permissions().mode() & 0o777,
                0o600
            );
        }
        assert_eq!(
            fs::read_dir(root.join("logs")).unwrap().count(),
            1,
            "no temp file is left behind"
        );
        fs::remove_dir_all(&root).unwrap();
    }
}
