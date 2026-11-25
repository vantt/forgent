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

/// The config key a patch item edits sits under a protected prefix: equal to it, or below it as `prefix.key` or `prefix[...]`.
fn protected(key: &str) -> bool {
    permissions::protected_config_prefixes()
        .iter()
        .any(|prefix| {
            key == prefix
                || key
                    .strip_prefix(prefix.as_str())
                    .is_some_and(|rest| rest.starts_with('.') || rest.starts_with('['))
        })
}

/// Reads the patch file of a `config patch` and refuses it when one edit touches a protected key. The file is read
/// from `root` before the call, so a head cannot name a key the window does not see; a file the window cannot read or
/// understand is refused rather than passed on blind.
fn check_config_patch(argv: &[String], root: &Path) -> Result<(), Refused> {
    use std::io::Read;
    let Some(file) = argv.iter().skip(2).find(|w| !w.starts_with('-')) else {
        return refuse("config patch names no patch file");
    };
    if !plain_relative(file) {
        return refuse("the config patch file must be a plain project-relative path");
    }
    let mut bytes = Vec::new();
    let read = std::fs::File::open(root.join(file))
        .and_then(|f| f.take(MAX_PATCH_BYTES + 1).read_to_end(&mut bytes));
    if read.is_err() || bytes.len() as u64 > MAX_PATCH_BYTES {
        return refuse("the config patch file cannot be read by the window");
    }
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
            Some(key) if protected(key) => {
                return refuse(format!(
                    "config key {key} is under a grant, confinement or release prefix"
                ))
            }
            Some(_) => {}
            None => return refuse("a config patch edit names no key"),
        }
    }
    Ok(())
}

/// The refusals no persona can lift, then the table's verdict: the argv's words and the row that decided.
fn screen(
    persona: &str,
    argv: &Value,
    root: &Path,
) -> Result<(Vec<String>, permissions::Verdict), Refused> {
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
    if words[0] == "config" && words.get(1).map(String::as_str) == Some("patch") {
        check_config_patch(&words, root)?;
    }
    let Some(verdict) = permissions::decide(persona, &words) else {
        return refuse(format!(
            "{persona:?} is not a persona of the permission table"
        ));
    };
    Ok((words, verdict))
}

/// What the table says about `argv` for `persona` (the answer of `fgos can-i`): `allow` or `ask` as the table has it,
/// and `deny` with the reason for a refusal no persona can lift or a denying row. It runs and files nothing.
pub fn can_i(persona: &str, argv: &Value, root: &Path) -> (Decision, String) {
    match screen(persona, argv, root) {
        Err(Refused(why)) => (Decision::Deny, why),
        Ok((words, verdict)) => {
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
pub fn plan(persona: &str, argv: &Value, root: &Path) -> Result<Planned, Refused> {
    let (words, verdict) = screen(persona, argv, root)?;
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
                let value = words.iter().enumerate().find_map(|(at, w)| {
                    if w == flag {
                        words.get(at + 1).map(String::as_str)
                    } else {
                        w.strip_prefix(flag.as_str())
                            .and_then(|rest| rest.strip_prefix('='))
                    }
                });
                if value.is_some_and(|v| !allowed.iter().any(|a| a == v)) {
                    return refuse(format!("{flag} takes one of {}", allowed.join(", ")));
                }
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
