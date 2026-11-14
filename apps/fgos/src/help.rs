//! The help door: every help form answered by the host from the embedded verb
//! manifest, with no Node process.
//!
//! Help is metadata about the CLI's own verb surface. It is never wrapped in
//! the `fgos.v1` envelope, never runs a verb, and a refused request is one
//! stderr line with exit 4 and nothing on stdout. The text and JSON forms are
//! the bytes the Node renderer printed before the host took the door over, so
//! the renderer below keeps its line order, labels and wording.

use fgos_host_runtime::cli_args::{parse_args, FlagScalar, FlagValue};
use serde_json::{Map, Value};
use std::ffi::OsString;
use std::sync::OnceLock;

/// The verb manifest generated from the registry (`export-command-selectors.mjs`).
const MANIFEST_JSON: &str =
    include_str!("../../../packages/host-runtime/contracts/command-manifest.json");

const TOP_USAGE: &str = "Usage: fgos --help [<verb> [<sub>]] [--json]";

/// A refused help request: the stderr line without its `fgos: ` prefix.
#[derive(Debug, PartialEq, Eq)]
pub struct Refusal(pub String);

static MANIFEST: OnceLock<Value> = OnceLock::new();

fn manifest() -> &'static Value {
    MANIFEST.get_or_init(|| {
        serde_json::from_str(MANIFEST_JSON)
            .expect("embedded command-manifest.json must be valid JSON")
    })
}

fn commands() -> &'static [Value] {
    manifest()
        .get("commands")
        .and_then(Value::as_array)
        .map(Vec::as_slice)
        .expect("embedded command-manifest.json lists commands")
}

/// The verbs of the surface in the registry's order, as the manifest lists them: what an unknown-verb usage line names.
pub fn verb_names() -> Vec<&'static str> {
    commands()
        .iter()
        .filter_map(|entry| entry.get("name").and_then(Value::as_str))
        .collect()
}

/// `fgos --help|-h [<verb> [<sub>]] [--json]`: `args` is everything after the
/// leading help token. The whole manifest, or one verb's entry; anything else
/// on the line is refused rather than ignored.
pub fn top_level(args: &[OsString]) -> Result<String, Refusal> {
    let args: Vec<String> = args
        .iter()
        .map(|a| a.to_string_lossy().into_owned())
        .collect();
    let json = args.iter().any(|a| a == "--json");
    // `--dir <root>` is the global store flag (the `fgos` shell function
    // appends it to every call); help reads no store, so it is accepted and
    // unused. A repeated help token (`fgos -h --help`) asks the same thing.
    let words: Vec<&str> = args
        .iter()
        .enumerate()
        .filter(|(i, a)| {
            !(*a == "--dir" || a.starts_with("--dir=") || (*i > 0 && args[*i - 1] == "--dir"))
        })
        .map(|(_, a)| a.as_str())
        .filter(|a| !matches!(*a, "--json" | "--help" | "-h"))
        .collect();
    if let Some(option) = words.iter().find(|a| a.starts_with('-')) {
        return Err(Refusal(format!(
            "unknown option \"{option}\" for --help. {TOP_USAGE}"
        )));
    }
    if words.len() > 2 {
        return Err(Refusal(format!(
            "too many words for --help: \"{}\". {TOP_USAGE}",
            words.join(" ")
        )));
    }
    if let Some(verb_name) = words.first() {
        return verb(verb_name, words.get(1).copied(), json);
    }
    if json {
        // The file is the serializer's own output; its bytes are the answer.
        Ok(MANIFEST_JSON.to_string())
    } else {
        Ok(render_help_text(commands()))
    }
}

/// `fgos <verb> [<sub>] --help|-h [--json]`: `cli_args[0]` is the verb. For a
/// verb with sub-verbs the first word names the one to narrow to; any other
/// verb's words are its own arguments and are ignored. The words come from the
/// same parser the verbs use, so `--help <word>` hands the word to the flag as
/// its value, and a help token that is the value of the previous flag still
/// asks for help. `hook` keeps the agent's raw argv: only an exact `--json`
/// token counts there.
pub fn for_verb(cli_args: &[OsString]) -> Result<String, Refusal> {
    let name = cli_args
        .first()
        .map(|a| a.to_string_lossy().into_owned())
        .unwrap_or_default();
    // Arguments reach Node as lossily decoded strings; decode the same way so a
    // non-UTF-8 token reads as it always did instead of being refused.
    let rest: Vec<OsString> = cli_args
        .iter()
        .skip(1)
        .map(|a| OsString::from(a.to_string_lossy().into_owned()))
        .collect();
    if name == "hook" {
        return verb(&name, None, rest.iter().any(|a| a == "--json"));
    }
    let parsed = parse_args(&rest).map_err(|err| Refusal(err.to_string()))?;
    let json = parsed.flag("json").is_some();
    let has_subcommands = commands()
        .iter()
        .find(|e| e.get("name").and_then(Value::as_str) == Some(name.as_str()))
        .is_some_and(|e| truthy(e.get("subcommands")));
    let sub = if has_subcommands {
        let help_word = match parsed.flag("help") {
            Some(FlagValue::One(FlagScalar::Str(word))) => Some(word.as_str()),
            _ => None,
        };
        help_word
            .into_iter()
            .chain(parsed.positional.iter().map(String::as_str))
            .find(|word| *word != "-h")
    } else {
        None
    };
    verb(&name, sub, json)
}

/// One verb's help: its manifest entry, narrowed to one sub-verb when `sub` is
/// given.
pub fn verb(name: &str, sub: Option<&str>, json: bool) -> Result<String, Refusal> {
    let Some(entry) = commands()
        .iter()
        .find(|e| e.get("name").and_then(Value::as_str) == Some(name))
    else {
        return Err(Refusal(format!("unknown verb \"{name}\". {TOP_USAGE}")));
    };
    let mut shown = entry.clone();
    if let Some(sub) = sub {
        let subcommands = entry.get("subcommands").and_then(Value::as_object);
        let Some(subcommands) = subcommands else {
            return Err(Refusal(format!(
                "{name} takes no sub-verb (got \"{sub}\"). Usage: fgos {name} --help [--json]"
            )));
        };
        let Some(spec) = subcommands.get(sub) else {
            let known: Vec<&str> = subcommands.keys().map(String::as_str).collect();
            return Err(Refusal(format!(
                "unknown {name} sub-verb \"{sub}\" (known: {}).",
                known.join(", ")
            )));
        };
        let mut narrowed = Map::new();
        narrowed.insert(sub.to_string(), spec.clone());
        shown["subcommands"] = Value::Object(narrowed);
    }
    if json {
        let mut text = serde_json::to_string_pretty(&shown).expect("a manifest entry serializes");
        text.push('\n');
        Ok(text)
    } else {
        Ok(render_help_text(std::slice::from_ref(&shown)))
    }
}

/// JavaScript truthiness of a manifest value: what `if (value)` decides.
fn truthy(value: Option<&Value>) -> bool {
    match value {
        None | Some(Value::Null) => false,
        Some(Value::Bool(b)) => *b,
        Some(Value::String(s)) => !s.is_empty(),
        Some(Value::Number(n)) => n.as_f64().is_some_and(|f| f != 0.0 && !f.is_nan()),
        Some(_) => true,
    }
}

/// A value as a JavaScript template literal prints it.
fn js_text(value: Option<&Value>) -> String {
    match value {
        None => "undefined".to_string(),
        Some(Value::Null) => "null".to_string(),
        Some(Value::String(s)) => s.clone(),
        Some(Value::Bool(b)) => b.to_string(),
        Some(Value::Number(n)) => match n.to_string().parse::<f64>() {
            Ok(f) if f.fract() == 0.0 && f.abs() < 1e21 => format!("{f:.0}"),
            Ok(f) => f.to_string(),
            Err(_) => n.to_string(),
        },
        // Array.prototype.toString: elements joined by commas, null as empty.
        Some(Value::Array(items)) => items
            .iter()
            .map(|item| {
                if item.is_null() {
                    String::new()
                } else {
                    js_text(Some(item))
                }
            })
            .collect::<Vec<_>>()
            .join(","),
        Some(Value::Object(_)) => "[object Object]".to_string(),
    }
}

/// `value ?? fallback`, printed.
fn js_text_or(value: Option<&Value>, fallback: &str) -> String {
    match value {
        None | Some(Value::Null) => fallback.to_string(),
        other => js_text(other),
    }
}

/// `String.prototype.trimEnd`: JavaScript's white-space and line-terminator set.
fn js_trim_end(text: &str) -> &str {
    text.trim_end_matches(|c: char| {
        matches!(
            c,
            '\t' | '\n' | '\u{b}' | '\u{c}' | '\r' | ' ' | '\u{a0}' | '\u{1680}' | '\u{2000}'
                ..='\u{200a}'
                    | '\u{2028}'
                    | '\u{2029}'
                    | '\u{202f}'
                    | '\u{205f}'
                    | '\u{3000}'
                    | '\u{feff}'
        )
    })
}

/// The deprecation note of an entry, as the one line the help prints.
fn format_deprecation(deprecated: Option<&Value>) -> Option<String> {
    if !truthy(deprecated) {
        return None;
    }
    match deprecated? {
        Value::String(text) => Some(text.clone()),
        object @ (Value::Object(_) | Value::Array(_)) => {
            let mut parts = Vec::new();
            if truthy(object.get("since")) {
                parts.push(format!("since {}", js_text(object.get("since"))));
            }
            if truthy(object.get("use_instead")) {
                parts.push(format!("use {}", js_text(object.get("use_instead"))));
            }
            if parts.is_empty() {
                Some(serde_json::to_string(object).expect("a manifest value serializes"))
            } else {
                Some(parts.join("; "))
            }
        }
        other => Some(js_text(Some(other))),
    }
}

fn string_list(value: Option<&Value>) -> Vec<String> {
    match value {
        Some(Value::Array(items)) => items.iter().map(|v| js_text(Some(v))).collect(),
        _ => Vec::new(),
    }
}

/// A required param that can be supplied positionally (mixed) or only
/// positionally (submit's text, session's sub) is never a real `--flag`:
/// required is split into the two shapes so each renders in its own idiom, and
/// only the flag-only remainder gets the `--name` form.
fn render_parameter_lines(parameters: Option<&Value>, indent: &str) -> Vec<String> {
    let required = string_list(parameters.and_then(|p| p.get("required")));
    let positional = string_list(parameters.and_then(|p| p.get("positional")));
    let flag_required: Vec<String> = required
        .iter()
        .filter(|r| !positional.contains(r))
        .map(|r| format!("--{r}"))
        .collect();
    let mut lines = Vec::new();
    if !positional.is_empty() {
        lines.push(format!("{indent}positional: {}", positional.join(", ")));
    }
    if !flag_required.is_empty() {
        lines.push(format!("{indent}required: {}", flag_required.join(", ")));
    }
    lines
}

/// The flags one verb (or one sub-verb) reads, one line each, with the default
/// the schema declares; a description that names its default is left as
/// written, a switch otherwise defaults to off and a valued flag to unset.
fn render_flag_lines(parameters: Option<&Value>, indent: &str) -> Vec<String> {
    let positional = string_list(parameters.and_then(|p| p.get("positional")));
    let Some(properties) = parameters
        .and_then(|p| p.get("properties"))
        .and_then(Value::as_object)
    else {
        return Vec::new();
    };
    properties
        .iter()
        .filter(|(name, _)| !positional.contains(name))
        .map(|(name, spec)| {
            let text = js_text_or(spec.get("description"), "");
            let is_boolean = spec.get("type").and_then(Value::as_str) == Some("boolean");
            let default = js_text_or(
                spec.get("default"),
                if is_boolean { "off" } else { "unset" },
            );
            let note = if text.to_ascii_lowercase().contains("default") {
                String::new()
            } else {
                format!(" (default: {default})")
            };
            format!(
                "{indent}--{name}{}  {text}{note}",
                if is_boolean { "" } else { " <value>" }
            )
        })
        .collect()
}

/// The `guide` of a verb, as the sections a person needs before running it:
/// what it changes on disk, what it needs, every flag with its default,
/// examples, exit codes and the next command.
fn render_guide(entry: &Value, guide: &Value) -> Vec<String> {
    let name = js_text(entry.get("name"));
    let mut flags = Vec::new();
    if let Some(subcommands) = entry.get("subcommands").filter(|s| truthy(Some(s))) {
        if let Some(subcommands) = subcommands.as_object() {
            for (sub, spec) in subcommands {
                flags.push(format!("        fgos {name} {sub}"));
                flags.extend(render_flag_lines(spec.get("parameters"), "            "));
            }
        }
    } else {
        flags.extend(render_flag_lines(entry.get("parameters"), "        "));
    }
    let mut lines = vec![
        "    Changes on disk:".to_string(),
        format!("        {}", js_text(guide.get("changes"))),
        "    Prerequisites:".to_string(),
        format!("        {}", js_text(guide.get("prerequisites"))),
        "    Options:".to_string(),
    ];
    lines.extend(flags);
    lines.push(
        "        Every verb also takes --dir <root> (default: the project found from the current directory) and --json."
            .to_string(),
    );
    lines.push("    Examples:".to_string());
    lines.extend(
        string_list(entry.get("examples"))
            .into_iter()
            .map(|example| format!("        {example}")),
    );
    lines.push("    Exit codes:".to_string());
    lines.extend(
        string_list(guide.get("exitCodes"))
            .into_iter()
            .map(|code| format!("        {code}")),
    );
    lines.push("    Next:".to_string());
    lines.push(format!("        {}", js_text(guide.get("next"))));
    lines
}

/// `read` (both false), `write` (touches only), `external` (effect only) or
/// `write+external`.
fn effect_label(touches_state: bool, external_effect: bool) -> &'static str {
    match (touches_state, external_effect) {
        (true, true) => "write+external",
        (true, false) => "write",
        (false, true) => "external",
        (false, false) => "read",
    }
}

fn render_help_text(entries: &[Value]) -> String {
    let schema_version = js_text(manifest().get("schema_version"));
    let mut lines = vec![
        format!("fgos — the fgOS work-item CLI (schema_version {schema_version})"),
        String::new(),
    ];
    // The whole list names a deprecated verb once, under Compatibility; one
    // verb's own help keeps its full entry.
    let single = entries.len() == 1;
    let deprecated = |entry: &&Value| truthy(entry.get("deprecated"));
    let compatibility: Vec<&Value> = if single {
        Vec::new()
    } else {
        entries.iter().filter(deprecated).collect()
    };
    let listed: Vec<&Value> = if single {
        entries.iter().collect()
    } else {
        entries.iter().filter(|e| !deprecated(e)).collect()
    };
    for entry in listed {
        let label = effect_label(
            truthy(entry.get("touchesState")),
            truthy(entry.get("externalEffect")),
        );
        let name = js_text(entry.get("name"));
        lines.push(format!("{} [{label}]", js_text(entry.get("invoke"))));
        lines.push(format!("    {}", js_text(entry.get("description"))));
        lines.extend(render_parameter_lines(entry.get("parameters"), "    "));
        if let Some(subcommands) = entry.get("subcommands").and_then(Value::as_object) {
            for (sub, spec) in subcommands {
                lines.push(format!("    fgos {name} {sub}"));
                lines.push(format!("        {}", js_text(spec.get("description"))));
                lines.extend(render_parameter_lines(spec.get("parameters"), "        "));
            }
        }
        if let Some(guide) = entry.get("guide").filter(|g| single && truthy(Some(g))) {
            lines.extend(render_guide(entry, guide));
        }
        if let Some(text) = format_deprecation(entry.get("deprecated")) {
            lines.push(format!("    DEPRECATED — {text}"));
        }
        lines.push(String::new());
    }
    if !compatibility.is_empty() {
        lines.push(
            "Compatibility (deprecated, still callable; `fgos <verb> --help` has the detail):"
                .to_string(),
        );
        for entry in compatibility {
            lines.push(format!(
                "    {} — {}",
                js_text(entry.get("invoke")),
                format_deprecation(entry.get("deprecated")).unwrap_or_default()
            ));
        }
        lines.push(String::new());
    }
    format!("{}\n", js_trim_end(&lines.join("\n")))
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn os(args: &[&str]) -> Vec<OsString> {
        args.iter().map(OsString::from).collect()
    }

    fn refusal(result: Result<String, Refusal>) -> String {
        result.expect_err("the request is refused").0
    }

    fn entry_named(name: &str) -> &'static Value {
        commands()
            .iter()
            .find(|e| e["name"] == name)
            .unwrap_or_else(|| panic!("manifest has no {name}"))
    }

    #[test]
    fn the_manifest_file_is_the_serializer_output_so_the_whole_json_form_prints_the_file() {
        let reserialized = serde_json::to_string_pretty(manifest()).unwrap() + "\n";
        assert_eq!(reserialized, MANIFEST_JSON);
        assert_eq!(top_level(&os(&["--json"])).unwrap(), MANIFEST_JSON);
    }

    #[test]
    fn every_manifest_entry_renders_as_text_and_json_and_every_sub_verb_narrows() {
        assert!(commands().len() > 1);
        for entry in commands() {
            let name = entry["name"].as_str().unwrap();
            let text = verb(name, None, false).unwrap();
            assert!(
                text.starts_with("fgos — the fgOS work-item CLI (schema_version "),
                "{name}"
            );
            assert!(
                text.contains(&format!("{} [", entry["invoke"].as_str().unwrap())),
                "{name}"
            );
            let shown: Value = serde_json::from_str(&verb(name, None, true).unwrap()).unwrap();
            assert_eq!(&shown, entry, "{name}");
            for sub in entry
                .get("subcommands")
                .and_then(Value::as_object)
                .into_iter()
                .flat_map(|m| m.keys())
            {
                let narrowed: Value =
                    serde_json::from_str(&verb(name, Some(sub), true).unwrap()).unwrap();
                assert_eq!(
                    narrowed["subcommands"].as_object().unwrap().len(),
                    1,
                    "{name} {sub}"
                );
                assert!(narrowed["subcommands"].get(sub).is_some(), "{name} {sub}");
                let text = verb(name, Some(sub), false).unwrap();
                assert!(
                    text.contains(&format!("    fgos {name} {sub}\n")),
                    "{name} {sub}"
                );
            }
        }
    }

    #[test]
    fn every_route_selector_is_a_manifest_verb_and_back() {
        let routes: Value = serde_json::from_str(include_str!(
            "../../../packages/host-runtime/contracts/command-routes.json"
        ))
        .unwrap();
        let mut selectors: Vec<&str> = routes
            .as_object()
            .unwrap()
            .keys()
            .map(String::as_str)
            .filter(|s| !s.starts_with('-'))
            .collect();
        let mut names: Vec<&str> = commands()
            .iter()
            .map(|e| e["name"].as_str().unwrap())
            .collect();
        selectors.sort_unstable();
        names.sort_unstable();
        assert_eq!(selectors, names);
    }

    #[test]
    fn top_level_text_lists_live_verbs_then_one_compatibility_section() {
        let text = top_level(&[]).unwrap();
        assert!(text.starts_with("fgos — the fgOS work-item CLI (schema_version 3.0)\n\n"));
        assert!(text.ends_with("\n") && !text.ends_with("\n\n"));
        let compat = text.split("Compatibility (deprecated, still callable; `fgos <verb> --help` has the detail):\n").nth(1).unwrap();
        assert!(
            compat
                .lines()
                .all(|l| l.starts_with("    ") && l.contains(" — ")),
            "{compat}"
        );
        assert_eq!(
            compat.lines().count(),
            commands()
                .iter()
                .filter(|e| truthy(e.get("deprecated")))
                .count()
        );
        for entry in commands().iter().filter(|e| truthy(e.get("deprecated"))) {
            assert!(
                !text.contains(&format!("{} [", entry["invoke"].as_str().unwrap())),
                "{}",
                entry["name"]
            );
        }
    }

    #[test]
    fn a_deprecated_verb_keeps_its_full_entry_when_asked_for_alone() {
        let text = verb("setup", None, false).unwrap();
        assert!(
            text.contains("    DEPRECATED — since 2026-09-14; use fgctl init"),
            "{text}"
        );
        assert!(!text.contains("Compatibility ("));
    }

    #[test]
    fn help_words_may_follow_json_and_dir_and_a_repeated_help_token() {
        let plain = top_level(&os(&["config"])).unwrap();
        assert_eq!(
            top_level(&os(&["--dir", "/x", "config", "--json"])).unwrap(),
            verb("config", None, true).unwrap()
        );
        assert_eq!(
            top_level(&os(&["--dir=/x", "config", "-h", "--help"])).unwrap(),
            plain
        );
        assert_eq!(
            top_level(&os(&["config", "--dir", "--json"])).unwrap(),
            verb("config", None, true).unwrap(),
            "the token after --dir is its value, yet --json anywhere asks for JSON"
        );
        let narrowed = top_level(&os(&["config", "show"])).unwrap();
        assert_eq!(narrowed, verb("config", Some("show"), false).unwrap());
    }

    #[test]
    fn verb_help_reads_its_words_the_way_the_verbs_read_a_call() {
        let narrowed = verb("config", Some("show"), false).unwrap();
        let whole = verb("config", None, false).unwrap();
        for args in [
            vec!["config", "show", "--help"],
            vec!["config", "--help", "show"],
            vec!["config", "-h", "show"],
            vec!["config", "--dir", "/x", "show", "-h"],
            vec!["config", "show", "--title", "--help"],
        ] {
            assert_eq!(for_verb(&os(&args)).unwrap(), narrowed, "{args:?}");
        }
        for args in [
            vec!["config", "-h"],
            vec!["config", "--help"],
            // a help token that is the value of the previous flag still asks for help, with no word to narrow to
            vec!["config", "--title", "-h"],
        ] {
            assert_eq!(for_verb(&os(&args)).unwrap(), whole, "{args:?}");
        }
        // a verb without sub-verbs ignores its own words
        assert_eq!(
            for_verb(&os(&["init", "whatever", "--help"])).unwrap(),
            verb("init", None, false).unwrap()
        );
        // `--json` takes the next word as its value, and is still JSON
        assert_eq!(
            for_verb(&os(&["config", "--json", "show", "--help"])).unwrap(),
            verb("config", None, true).unwrap()
        );
        assert_eq!(
            for_verb(&os(&["config", "show", "--help", "--json"])).unwrap(),
            verb("config", Some("show"), true).unwrap()
        );
        assert_eq!(
            refusal(for_verb(&os(&["config", "nope", "--help"]))),
            refusal(verb("config", Some("nope"), false))
        );
    }

    #[test]
    fn hook_help_keeps_the_raw_argv_and_reads_only_an_exact_json_token() {
        let whole = verb("hook", None, false).unwrap();
        assert_eq!(
            for_verb(&os(&["hook", "mailbox", "--help"])).unwrap(),
            whole
        );
        assert_eq!(
            for_verb(&os(&["hook", "-h", "--format", "agy"])).unwrap(),
            whole
        );
        assert_eq!(
            for_verb(&os(&["hook", "mailbox", "--help", "--json"])).unwrap(),
            verb("hook", None, true).unwrap()
        );
        assert_eq!(
            for_verb(&os(&["hook", "--json=1", "--help"])).unwrap(),
            whole
        );
    }

    #[test]
    fn top_level_refusals_name_the_request_and_the_usage() {
        assert_eq!(
            refusal(top_level(&os(&["foo"]))),
            "unknown verb \"foo\". Usage: fgos --help [<verb> [<sub>]] [--json]"
        );
        assert_eq!(
            refusal(top_level(&os(&["--bogus"]))),
            "unknown option \"--bogus\" for --help. Usage: fgos --help [<verb> [<sub>]] [--json]"
        );
        assert_eq!(
            refusal(top_level(&os(&["a", "b", "c"]))),
            "too many words for --help: \"a b c\". Usage: fgos --help [<verb> [<sub>]] [--json]"
        );
        assert_eq!(
            refusal(top_level(&os(&["init", "start"]))),
            "init takes no sub-verb (got \"start\"). Usage: fgos init --help [--json]"
        );
        let known: Vec<&str> = entry_named("config")["subcommands"]
            .as_object()
            .unwrap()
            .keys()
            .map(String::as_str)
            .collect();
        assert_eq!(
            refusal(top_level(&os(&["config", "nope"]))),
            format!(
                "unknown config sub-verb \"nope\" (known: {}).",
                known.join(", ")
            )
        );
    }

    #[test]
    fn parameters_render_positional_only_and_mixed_required_in_their_own_idiom() {
        let parameters = json!({
            "required": ["text", "kind", "title"],
            "positional": ["text", "kind"],
            "properties": {}
        });
        assert_eq!(
            render_parameter_lines(Some(&parameters), "  "),
            vec![
                "  positional: text, kind".to_string(),
                "  required: --title".to_string()
            ]
        );
        assert!(
            render_parameter_lines(Some(&json!({"required": [], "properties": {}})), "  ")
                .is_empty()
        );
        assert!(render_parameter_lines(None, "  ").is_empty());
    }

    #[test]
    fn flag_lines_skip_positionals_and_name_a_default_unless_the_description_does() {
        let parameters = json!({
            "positional": ["text"],
            "properties": {
                "text": {"type": "string", "description": "the text"},
                "json": {"type": "boolean", "description": "machine output"},
                "kind": {"type": "string", "description": "the kind"},
                "limit": {"type": "number", "description": "how many", "default": 20},
                "mode": {"type": "string", "description": "Default is fast"},
                "bare": {"type": "string"}
            }
        });
        assert_eq!(
            render_flag_lines(Some(&parameters), "    "),
            vec![
                "    --json  machine output (default: off)",
                "    --kind <value>  the kind (default: unset)",
                "    --limit <value>  how many (default: 20)",
                "    --mode <value>  Default is fast",
                "    --bare <value>   (default: unset)",
            ]
        );
    }

    #[test]
    fn deprecation_is_a_string_or_structured_metadata() {
        assert_eq!(format_deprecation(None), None);
        assert_eq!(format_deprecation(Some(&Value::Null)), None);
        assert_eq!(
            format_deprecation(Some(&json!("use x"))),
            Some("use x".into())
        );
        assert_eq!(
            format_deprecation(Some(&json!({"since": "1.0", "use_instead": "fgos y"}))),
            Some("since 1.0; use fgos y".into())
        );
        assert_eq!(
            format_deprecation(Some(&json!({"use_instead": "fgos y"}))),
            Some("use fgos y".into())
        );
        assert_eq!(
            format_deprecation(Some(&json!({"note": "n"}))),
            Some("{\"note\":\"n\"}".into())
        );
    }

    #[test]
    fn a_guided_verb_prints_its_sections_in_order_and_only_when_shown_alone() {
        let guided: Vec<&Value> = commands()
            .iter()
            .filter(|e| e.get("guide").is_some())
            .collect();
        assert!(!guided.is_empty());
        for entry in guided {
            let name = entry["name"].as_str().unwrap();
            let text = verb(name, None, false).unwrap();
            let at = |label: &str| {
                text.find(label)
                    .unwrap_or_else(|| panic!("{name} lacks {label}"))
            };
            let order = [
                "    Changes on disk:\n",
                "    Prerequisites:\n",
                "    Options:\n",
                "    Examples:\n",
                "    Exit codes:\n",
                "    Next:\n",
            ];
            assert!(order.windows(2).all(|w| at(w[0]) < at(w[1])), "{name}");
            assert!(
                text.contains("        Every verb also takes --dir <root>"),
                "{name}"
            );
            let listing = top_level(&[]).unwrap();
            assert!(
                !listing.contains("    Changes on disk:"),
                "the whole list carries no guide sections"
            );
        }
    }

    #[test]
    fn a_verb_with_sub_verbs_lists_each_under_its_guide_options() {
        let entry = json!({
            "name": "demo", "invoke": "fgos demo <sub>", "description": "d", "touchesState": true, "externalEffect": true,
            "parameters": {"required": [], "properties": {}},
            "subcommands": {
                "one": {"description": "first", "parameters": {"required": ["id"], "positional": [], "properties": {"id": {"type": "string", "description": "the id"}}}}
            },
            "examples": ["fgos demo one --id 1"],
            "guide": {"changes": "nothing", "prerequisites": "none", "exitCodes": ["0 ok"], "next": "stop"}
        });
        let text = render_help_text(std::slice::from_ref(&entry));
        assert!(
            text.contains("fgos demo <sub> [write+external]\n    d\n"),
            "{text}"
        );
        assert!(
            text.contains("    fgos demo one\n        first\n        required: --id\n"),
            "{text}"
        );
        assert!(text.contains("    Options:\n        fgos demo one\n            --id <value>  the id (default: unset)\n"), "{text}");
        assert!(text.ends_with("    Next:\n        stop\n"), "{text}");
    }

    #[test]
    fn effect_labels_cover_the_four_cases() {
        assert_eq!(effect_label(false, false), "read");
        assert_eq!(effect_label(true, false), "write");
        assert_eq!(effect_label(false, true), "external");
        assert_eq!(effect_label(true, true), "write+external");
    }

    #[test]
    fn the_verbs_of_the_usage_line_are_the_route_table_verbs_in_registry_order() {
        let mut named: Vec<&str> = verb_names();
        assert!(
            named.iter().position(|v| *v == "review") < named.iter().position(|v| *v == "approve")
        );
        named.sort_unstable();
        let mut routes: Vec<&str> = crate::routing::command_routes()
            .keys()
            .map(String::as_str)
            .collect();
        routes.sort_unstable();
        assert_eq!(named, routes);
    }

    fn flags_of(parameters: Option<&Value>) -> Vec<String> {
        let positional: Vec<&str> = parameters
            .and_then(|p| p.get("positional"))
            .and_then(Value::as_array)
            .map(|a| a.iter().filter_map(Value::as_str).collect())
            .unwrap_or_default();
        parameters
            .and_then(|p| p.get("properties"))
            .and_then(Value::as_object)
            .map(|m| {
                m.keys()
                    .filter(|k| !positional.contains(&k.as_str()))
                    .cloned()
                    .collect()
            })
            .unwrap_or_default()
    }

    #[test]
    fn one_verbs_help_prints_only_that_verbs_block_and_narrowing_drops_the_other_sub_verbs() {
        for entry in commands() {
            let name = entry["name"].as_str().unwrap();
            let text = verb(name, None, false).unwrap();
            for other in commands().iter().filter(|e| e["name"] != entry["name"]) {
                let line = format!("\n{} [", other["invoke"].as_str().unwrap());
                assert!(
                    !text.contains(&line),
                    "{name} help leaked {}",
                    other["name"]
                );
            }
            let subs: Vec<&String> = entry
                .get("subcommands")
                .and_then(Value::as_object)
                .map(|m| m.keys().collect())
                .unwrap_or_default();
            for sub in &subs {
                let narrowed = verb(name, Some(sub.as_str()), false).unwrap();
                for other in subs.iter().filter(|o| *o != sub) {
                    assert!(
                        !narrowed.contains(&format!("\n    fgos {name} {other}\n")),
                        "{name} {sub} help leaked {other}"
                    );
                }
            }
        }
    }

    #[test]
    fn the_whole_list_names_every_live_verb_with_its_effect_label() {
        let text = top_level(&[]).unwrap();
        for entry in commands().iter().filter(|e| !truthy(e.get("deprecated"))) {
            let label = effect_label(
                truthy(entry.get("touchesState")),
                truthy(entry.get("externalEffect")),
            );
            let line = format!("{} [{label}]\n", entry["invoke"].as_str().unwrap());
            assert!(text.contains(&line), "missing {line:?}");
        }
        assert!(
            text.contains("[write+external]\n    ") && text.contains("fgos dispatch <show-run|inspect|watch|recover|reconcile|decide|explain|probe-account|probe-session> [args] [write+external]\n"),
            "dispatch line"
        );
    }

    #[test]
    fn a_guided_verb_names_every_flag_example_and_exit_code_of_its_entry() {
        let guided: Vec<&Value> = commands()
            .iter()
            .filter(|e| e.get("guide").is_some())
            .collect();
        assert!(
            guided.len() >= 5,
            "init doctor config uninstall run at least"
        );
        for entry in guided {
            let name = entry["name"].as_str().unwrap();
            let text = verb(name, None, false).unwrap();
            let flags: Vec<String> = match entry.get("subcommands").and_then(Value::as_object) {
                Some(subs) => subs
                    .values()
                    .flat_map(|s| flags_of(s.get("parameters")))
                    .collect(),
                None => flags_of(entry.get("parameters")),
            };
            for flag in flags {
                assert!(
                    text.contains(&format!("--{flag}")),
                    "{name} help omits --{flag}"
                );
            }
            for example in entry["examples"].as_array().unwrap() {
                assert!(
                    text.contains(example.as_str().unwrap()),
                    "{name} omits an example"
                );
            }
            for code in entry["guide"]["exitCodes"].as_array().unwrap() {
                assert!(
                    text.contains(code.as_str().unwrap()),
                    "{name} omits an exit code"
                );
            }
        }
    }

    #[test]
    fn the_shipped_manifest_renders_positional_only_and_mixed_arguments_in_their_own_idiom() {
        let block_of = |name: &str| {
            top_level(&[])
                .unwrap()
                .split("\n\n")
                .find(|b| b.starts_with(&format!("fgos {name} ")))
                .unwrap_or_else(|| panic!("no {name} block"))
                .to_string()
        };
        let submit = block_of("submit");
        assert!(
            submit.contains("positional: text") && !submit.contains("required: --text"),
            "{submit}"
        );
        let mv = block_of("move");
        assert!(
            mv.contains("positional: id") && mv.contains("required: --to") && !mv.contains("--id"),
            "{mv}"
        );
        let dispatch = verb("dispatch", None, false).unwrap();
        assert!(dispatch.contains("    positional: sub\n"), "{dispatch}");
        let show_run = dispatch
            .split("    fgos dispatch ")
            .find(|b| b.starts_with("show-run\n"))
            .expect("show-run block");
        assert!(show_run.contains("positional: run-id"), "{show_run}");
    }

    #[test]
    fn every_deprecated_verb_prints_a_plain_notice_alone_and_setup_is_listed_under_compatibility() {
        for entry in commands().iter().filter(|e| truthy(e.get("deprecated"))) {
            let name = entry["name"].as_str().unwrap();
            let text = verb(name, None, false).unwrap();
            assert!(text.contains("DEPRECATED — "), "{name}");
            assert!(
                !text.contains("undefined") && !text.contains("[object Object]"),
                "{name}: {text}"
            );
        }
        let setup = verb("setup", None, false).unwrap();
        for part in ["fgctl init", "fgos doctor --fix", "git hooks path"] {
            assert!(setup.contains(part), "setup notice lacks {part}");
        }
        let whole = top_level(&[]).unwrap();
        let (verbs, compatibility) = whole
            .split_once("Compatibility (")
            .expect("a Compatibility section");
        assert!(
            !verbs.contains("\nfgos setup ["),
            "setup is listed among the verbs"
        );
        assert!(
            compatibility
                .lines()
                .any(|l| l.contains("fgos setup") && l.contains("fgctl init")),
            "{compatibility}"
        );
    }
}
