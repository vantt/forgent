//! The argv window: one validator for every `fgos` argv a head sends over its request socket.
//!
//! [`plan`] reads the argv, applies the refusals no persona can lift (a flag that moves the root, the cwd or the
//! environment; a word that is not an `fgos` verb; a `config patch` that touches a grant, confinement or release key),
//! asks the permission table, and answers with what to do: run the argv on the host (`allow`), file an owner question
//! that carries it (`ask`), or refuse. It runs nothing: the run supervisor execs the host `fgos` with the returned
//! argv, no shell and no Node hop. [`read_answer`] reads the host's answer back.

use std::path::{Component, Path};

use serde_json::Value;

use crate::permissions::{self, Decision, Policy};

/// Most words one argv may hold, and the longest one word.
const MAX_WORDS: usize = 64;
const MAX_WORD_BYTES: usize = 8192;
/// The largest `config patch` file the window reads before the call (the config's own input limit is smaller).
const MAX_PATCH_BYTES: u64 = 1 << 20;
/// A reply frame holds 65536 bytes with its own envelope; a host answer over this is refused, not lost.
pub const ANSWER_MAX_BYTES: usize = 60_000;

/// Programs that are never an `fgos` verb: shells, interpreters and the usual raw commands. A first word naming one
/// is refused before the table is asked, so raw shell can never become a row.
const NOT_VERBS: &[&str] = &[
    "fgos", "sh", "bash", "zsh", "dash", "fish", "env", "sudo", "su", "exec", "eval", "node",
    "python", "python3", "perl", "ruby", "npm", "npx", "cargo", "rm", "mv", "cp", "cat", "curl",
    "wget", "ssh", "scp", "xargs", "nohup", "tmux", "herdr", "chmod", "chown", "dd", "kill",
    "pkill",
];

/// What to do with an argv.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Planned {
    /// Run the host `fgos` with exactly this argv (`--json` included).
    Run(Vec<String>),
    /// File one owner question carrying this argv (the caller's own words, no `--json`).
    Ask(Vec<String>),
}

/// Why an argv is refused: always the contract's `argv-not-allowed`, with the reason.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Refused(pub String);

fn refuse<T>(why: impl Into<String>) -> Result<T, Refused> {
    Err(Refused(why.into()))
}

/// The argv as plain strings: a non-empty array of at most [`MAX_WORDS`] strings, none empty, over-long or holding NUL.
pub fn words_of(value: &Value) -> Result<Vec<String>, Refused> {
    let Some(list) = value.as_array() else {
        return refuse("argv must be an array of strings");
    };
    if list.is_empty() || list.len() > MAX_WORDS {
        return refuse(format!("argv must hold 1 to {MAX_WORDS} words"));
    }
    list.iter()
        .map(|word| match word.as_str() {
            Some(text)
                if !text.is_empty() && text.len() <= MAX_WORD_BYTES && !text.contains('\0') =>
            {
                Ok(text.to_owned())
            }
            _ => refuse("every argv element must be a plain non-empty string"),
        })
        .collect()
}

fn is_verb_word(word: &str) -> bool {
    let mut chars = word.chars();
    chars.next().is_some_and(|c| c.is_ascii_lowercase())
        && chars.all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
}

/// A plain project-relative path (no root, no `..`).
fn plain_relative(path: &str) -> bool {
    !path.is_empty()
        && Path::new(path)
            .components()
            .all(|c| matches!(c, Component::Normal(_)))
}

/// Whether the config key `edit` and the protected path `guard` (a `*` segment stands for any one key) lie on one
/// branch: one is the other or a prefix of it, so a whole-object edit (`runner`) is caught as well as a leaf
/// (`runner.executors.x`). A key that does not parse is protected: the window cannot tell what it names.
fn protected(edit: &str, guard: &str) -> bool {
    use fgos_yaml_doc::path::parse_path;
    use fgos_yaml_doc::Segment;
    let (Ok(edit), Ok(guard)) = (parse_path(edit), parse_path(guard)) else {
        return true;
    };
    edit.iter().zip(guard.iter()).all(|(have, want)| match want {
        Segment::Key(key) if key == "*" => true,
        _ => have == want,
    })
}

/// The one shape of an allowed `config patch`: `config patch <file> [--reason <text>]`. Returns the file word.
fn patch_file_of(argv: &[String]) -> Result<&str, Refused> {
    let shape = "config patch takes exactly <file> [--reason <text>]";
    let Some(file) = argv.get(2).filter(|w| !w.starts_with('-')) else {
        return refuse(shape);
    };
    let tail_ok = match &argv[3..] {
        [] => true,
        [flag, _] => flag == "--reason",
        [one] => one.starts_with("--reason="),
        _ => false,
    };
    if tail_ok {
        Ok(file)
    } else {
        refuse(shape)
    }
}

/// Opens `file` under `root` the way a head may name it: a plain project-relative path outside `.fgos`, no symlink on
/// any component, a regular file. Reads at most [`MAX_PATCH_BYTES`].
fn read_patch_file(root: &Path, file: &str) -> Result<Vec<u8>, Refused> {
    use std::io::Read;
    use std::os::unix::fs::OpenOptionsExt;
    if !plain_relative(file) {
        return refuse("the config patch file must be a plain project-relative path");
    }
    if Path::new(file).components().any(|c| c.as_os_str() == ".fgos") {
        return refuse("the config patch file may not live under .fgos");
    }
    let unreadable = || Refused("the config patch file cannot be read by the window".into());
    let mut walk = root.to_path_buf();
    for part in Path::new(file).components() {
        walk.push(part);
        let meta = std::fs::symlink_metadata(&walk).map_err(|_| unreadable())?;
        if meta.file_type().is_symlink() {
            return refuse("the config patch file may not go through a symlink");
        }
    }
    let opened = std::fs::OpenOptions::new()
        .read(true)
        .custom_flags(libc::O_NOFOLLOW | libc::O_NONBLOCK)
        .open(&walk)
        .map_err(|_| unreadable())?;
    if !opened.metadata().map_err(|_| unreadable())?.is_file() {
        return refuse("the config patch file is not a regular file");
    }
    let mut bytes = Vec::new();
    opened
        .take(MAX_PATCH_BYTES + 1)
        .read_to_end(&mut bytes)
        .map_err(|_| unreadable())?;
    if bytes.len() as u64 > MAX_PATCH_BYTES {
        return refuse("the config patch file is over the size the window reads");
    }
    Ok(bytes)
}

/// Copies the checked patch bytes into a new private file at `stage` (owner-only, never overwriting).
fn stage_patch(stage: &Path, bytes: &[u8]) -> Result<(), Refused> {
    use std::io::Write;
    use std::os::unix::fs::OpenOptionsExt;
    std::fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .mode(0o600)
        .open(stage)
        .and_then(|mut f| f.write_all(bytes))
        .map_err(|_| Refused("the window could not stage the config patch for the host".into()))
}

/// Reads the patch file of a `config patch` and refuses it when one edit touches a protected key. Returns the bytes
/// the window checked: the host is given a private copy of exactly these, never the caller's path, so what is checked
/// is what is applied. A file the window cannot read or understand is refused rather than passed on blind.
fn check_config_patch(argv: &[String], root: &Path) -> Result<Vec<u8>, Refused> {
    let bytes = read_patch_file(root, patch_file_of(argv)?)?;
    let list = fgos_yaml_doc::parse(&bytes, fgos_yaml_doc::Profile::StrictConfig, "patch")
        .and_then(|doc| doc.to_json())
        .map_err(|_| Refused("the config patch file does not parse".into()))?;
    let Some(items) = list.as_array() else {
        return refuse("the config patch file is not a list of edits");
    };
    for item in items {
        let key = item
            .get("set")
            .or_else(|| item.get("unset"))
            .and_then(Value::as_str);
        match key {
            Some(key)
                if permissions::protected_config_paths()
                    .iter()
                    .any(|guard| protected(key, guard)) =>
            {
                return refuse(format!(
                    "config key {key} widens a head's grant, confinement, gates or release"
                ))
            }
            Some(_) => {}
            None => return refuse("a config patch edit names no key"),
        }
    }
    Ok(bytes)
}

/// Every value the argv gives `flag`, in `--flag value` and `--flag=value` spelling (a trailing bare flag has none).
fn flag_values<'a>(words: &'a [String], flag: &'a str) -> impl Iterator<Item = &'a str> {
    words.iter().enumerate().filter_map(move |(at, w)| {
        if w == flag {
            words.get(at + 1).map(String::as_str)
        } else {
            w.strip_prefix(flag).and_then(|rest| rest.strip_prefix('='))
        }
    })
}

/// A session target: a role, handle or slot key, as `fgos session read|type` take it.
fn is_target(word: &str) -> bool {
    let mut bytes = word.bytes();
    word.len() <= 128
        && bytes.next().is_some_and(|b| b.is_ascii_alphanumeric())
        && bytes.all(|b| b.is_ascii_alphanumeric() || b":@._/-".contains(&b))
}

/// The refusals no persona can lift, then the table's verdict: the argv's words and the row that decided.
fn screen(
    persona: &str,
    argv: &Value,
    root: &Path,
) -> Result<(Vec<String>, permissions::Verdict, Option<Vec<u8>>), Refused> {
    let words = words_of(argv)?;
    if let Some(flag) = permissions::refused_flags().iter().find(|flag| {
        words.iter().any(|w| {
            permissions::spells(w, flag)
                || (flag.len() == 2
                    && !permissions::is_long_flag(flag)
                    && w.starts_with(flag.as_str()))
        })
    }) {
        return refuse(format!(
            "{flag} changes the project root, the cwd or the environment of the call"
        ));
    }
    if !is_verb_word(&words[0]) || NOT_VERBS.contains(&words[0].as_str()) {
        return refuse(format!(
            "{:?} is not an fgos verb; raw commands are never a row",
            words[0]
        ));
    }
    let patch = if words[0] == "config" && words.get(1).map(String::as_str) == Some("patch") {
        Some(check_config_patch(&words, root)?)
    } else {
        None
    };
    let Some(verdict) = permissions::decide(persona, &words) else {
        return refuse(format!(
            "{persona:?} is not a persona of the permission table"
        ));
    };
    Ok((words, verdict, patch))
}

/// What the table says about `argv` for `persona` (the answer of `fgos can-i`): `allow` or `ask` as the table has it,
/// and `deny` with the reason for a refusal no persona can lift or a denying row. It runs and files nothing.
pub fn can_i(persona: &str, argv: &Value, root: &Path) -> (Decision, String) {
    match screen(persona, argv, root) {
        Err(Refused(why)) => (Decision::Deny, why),
        Ok((words, verdict, _)) => {
            let line = words.join(" ");
            let why = match (verdict.decision, &verdict.rule) {
                (Decision::Allow, Some(rule)) => {
                    format!("{line}: allowed by the row {:?}", rule.prefix.join(" "))
                }
                (Decision::Deny, Some(rule)) => {
                    format!("{line}: denied by the row {:?}", rule.prefix.join(" "))
                }
                (_, Some(rule)) => {
                    format!("{line}: the row {:?} asks the owner", rule.prefix.join(" "))
                }
                (_, None) => format!("{line}: no row matches, so the owner is asked"),
            };
            (verdict.decision, why)
        }
    }
}

/// Decides one argv from `persona` (a project at `root`): the whole window in one call.
///
/// A `config patch` runs on a private copy of the bytes the window checked, written to `patch_stage` (a path the caller
/// picks inside its own run directory, and removes after the call); the host never sees the caller's path.
pub fn plan(
    persona: &str,
    argv: &Value,
    root: &Path,
    patch_stage: &Path,
) -> Result<Planned, Refused> {
    let (mut words, verdict, patch) = screen(persona, argv, root)?;
    match verdict.decision {
        Decision::Deny => refuse(format!("{} is denied to {persona}", words.join(" "))),
        Decision::Ask => Ok(Planned::Ask(words)),
        Decision::Allow => {
            let rule = verdict.rule.expect("an allow has a row");
            if rule.policy != Policy::Forward {
                return refuse(format!(
                    "{} is a policy verb: send it as its own request verb, not as an argv",
                    rule.prefix.join(" ")
                ));
            }
            if let Some(flag) = rule
                .refuse_flags
                .iter()
                .find(|flag| words.iter().any(|w| permissions::spells(w, flag)))
            {
                return refuse(format!("{flag} is the host's to set, not a head's"));
            }
            for (flag, allowed) in &rule.args {
                let mut values = flag_values(&words, flag);
                if values.any(|v| !allowed.iter().any(|a| a == v)) {
                    return refuse(format!("{flag} takes one of {}", allowed.join(", ")));
                }
            }
            if let Some(at) = rule.target_at {
                if !words.get(at).is_some_and(|w| is_target(w)) {
                    return refuse(
                        "the session target must be a role, handle or slot key (letters, digits and : @ . _ / -, 1 to 128 bytes)",
                    );
                }
            }
            for (flag, most) in &rule.limits {
                let mut values = flag_values(&words, flag);
                if values.any(|v| v.parse::<u64>().map_or(true, |n| n > *most)) {
                    return refuse(format!("{flag} takes a whole number up to {most}"));
                }
            }
            if let Some(bytes) = patch {
                stage_patch(patch_stage, &bytes)?;
                words[2] = patch_stage.to_string_lossy().into_owned();
            }
            let mut run = words;
            run.extend(rule.append.iter().cloned());
            if !run.iter().any(|w| w == "--json") {
                run.push("--json".into());
            }
            Ok(Planned::Run(run))
        }
    }
}

/// The host's answer to a forwarded argv: its JSON `data` (the whole document when it has none), or its own refusal
/// as `(code, message)`. A host verb's `--json` answer is one pretty-printed document; a route prints one line.
pub fn read_answer(
    success: bool,
    stdout: &str,
    stderr: &str,
    exit: Option<i32>,
) -> Result<Value, (String, String)> {
    let whole = stdout.trim();
    let document = serde_json::from_str::<Value>(whole)
        .ok()
        .filter(Value::is_object)
        .or_else(|| {
            whole.lines().rev().find_map(|line| {
                serde_json::from_str::<Value>(line.trim())
                    .ok()
                    .filter(Value::is_object)
            })
        });
    if success {
        return match document {
            None => Err((
                "host-output-unreadable".into(),
                "the host verb printed no JSON document".into(),
            )),
            Some(doc) => {
                let data = doc.get("data").cloned().unwrap_or(doc);
                let size = data.to_string().len();
                if size > ANSWER_MAX_BYTES {
                    Err(("reply-too-large".into(), format!("the host verb answered {size} bytes, over the {ANSWER_MAX_BYTES} one reply carries")))
                } else {
                    Ok(data)
                }
            }
        };
    }
    let printed = stderr
        .lines()
        .rev()
        .find(|l| l.starts_with("fgos: ") && !l.starts_with("fgos: invocation fault recorded"))
        .map(|l| l[6..].trim().to_owned());
    let bracketed = printed.as_deref().and_then(|p| {
        let open = p.rfind(" [")?;
        let code = p[open + 2..].strip_suffix(']')?;
        is_verb_word(code).then(|| (code.to_owned(), p[..open].to_owned()))
    });
    let code = document
        .as_ref()
        .and_then(|d| d["code"].as_str().or_else(|| d["error"]["code"].as_str()))
        .filter(|c| is_verb_word(c))
        .map(String::from)
        .or_else(|| bracketed.as_ref().map(|(c, _)| c.clone()))
        .unwrap_or_else(|| "host-failed".into());
    let message = document
        .as_ref()
        .and_then(|d| {
            d["message"]
                .as_str()
                .or_else(|| d["error"]["message"].as_str())
        })
        .map(String::from)
        .or_else(|| bracketed.map(|(_, m)| m))
        .or(printed)
        .unwrap_or_else(|| {
            format!(
                "the host verb ended with exit {}",
                exit.map_or("by a signal".into(), |c| c.to_string())
            )
        });
    Err((code, message))
}
