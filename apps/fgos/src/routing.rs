//! Which lane an invocation takes, decided in one pure module from the route table and the call.
//!
//! The route table (`command-routes.json`) is generated from the CLI registry, so the registry's declarations
//! reach this module as data: which first positionals a `legacy-cli` selector serves natively
//! (`native_subcommands`), and the store declarations (`store`, `mutates_store`, `lands_work`,
//! `event_store_child`) as shape lists. A call is read once, with the argument parser of the Node CLI
//! (`fgos_host_runtime::cli_args`), over the tokens after the verb; the rows of
//! `test/rust-host/fixtures/store-declaration-vectors.json` are the contract both readers of a declaration
//! answer.

use crate::wiring;
use fgos_host_runtime::cli_args::{parse_args, FlagScalar, FlagValue, ParsedArgs};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::ffi::OsString;
use std::sync::OnceLock;

/// Embedded command-routes descriptor, generated from the CLI registry.
const COMMAND_ROUTES_JSON: &str =
    include_str!("../../../packages/host-runtime/contracts/command-routes.json");

/// A store declaration of the registry: the whole verb (`true`) or a list of invocation shapes
/// (`next`, `recover --action`, `sync --opportunistic=true`).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum Declaration {
    All(bool),
    Shapes(Vec<String>),
}

/// Routing descriptor for one command selector.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandRouteDescriptor {
    pub selector: String,
    pub route_kind: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub legacy_payload: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub operation_id: Option<String>,
    pub owner_path: String,
    pub compatibility_tests: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub subcommands: Option<bool>,
    /// Flags (without `--`) a native verb without sub-commands accepts.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub accepted_flags: Option<Vec<String>>,
    /// Flags a native verb accepts, per sub-command.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub subcommand_flags: Option<HashMap<String, Vec<String>>>,
    /// On a legacy-cli selector: the first positionals the host serves natively; every other one reaches the
    /// legacy payload.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub native_subcommands: Option<Vec<String>>,
    /// What the verb does about the `.fgos/` store: `none`, `open`, `read` or `require`.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub store: Option<String>,
    /// Which invocations write the shared store.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub mutates_store: Option<Declaration>,
    /// Which invocations run Land.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub lands_work: Option<Declaration>,
    /// Which invocations are themselves a seal or publish child of the Event Store.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub event_store_child: Option<Declaration>,
}

static ROUTES: OnceLock<HashMap<String, CommandRouteDescriptor>> = OnceLock::new();

/// Returns the embedded command route table parsed lazily once.
pub fn command_routes() -> &'static HashMap<String, CommandRouteDescriptor> {
    ROUTES.get_or_init(|| {
        serde_json::from_str(COMMAND_ROUTES_JSON)
            .expect("embedded command-routes.json must be valid JSON")
    })
}

/// The sub-commands each native verb with sub-commands serves, by selector.
pub static NATIVE_SUBCOMMANDS: &[(&str, &[&str])] = &[
    ("metrics", fgos_observe::metrics_cli::AVAILABLE_SUBCOMMANDS),
    (
        "friction",
        fgos_observe::friction_cli::AVAILABLE_SUBCOMMANDS,
    ),
    ("convention", fgos_convention::AVAILABLE_SUBCOMMANDS),
    ("mailbox", wiring::mailbox_verbs::AVAILABLE_SUBCOMMANDS),
    ("config", fgos_config::provider::AVAILABLE_SUBCOMMANDS),
    ("gateway", wiring::gateway_control::AVAILABLE_SUBCOMMANDS),
    ("events", wiring::events::AVAILABLE_SUBCOMMANDS),
    ("session", wiring::session::AVAILABLE_SUBCOMMANDS),
    ("git", wiring::git_incidents::AVAILABLE_SUBCOMMANDS),
    ("lock", wiring::lock_fence::AVAILABLE_SUBCOMMANDS),
];

/// The `hook` kinds the host runs before the composition root.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HookKind {
    Mailbox,
    MailboxSync,
}

impl HookKind {
    /// Every kind with a handler in the host: the entries of `native_subcommands` of `hook` must all be here.
    pub const ALL: [(&'static str, HookKind); 2] = [
        ("mailbox", HookKind::Mailbox),
        ("mailbox-sync", HookKind::MailboxSync),
    ];

    fn named(name: &str) -> Option<Self> {
        Self::ALL
            .iter()
            .find(|(kind, _)| *kind == name)
            .map(|(_, kind)| *kind)
    }
}

/// The selector whose first token after the verb is the agent's raw argument (`fgos hook <kind> --cli ...`): a
/// flag before the kind makes it an unknown kind, as in the Node CLI, which reads `hook` before any argument parse.
const RAW_KIND_VERB: &str = "hook";

/// What runs an invocation.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Lane {
    /// A hook kind served in the host before the composition root: exact stdout bytes, exit 0 on every path.
    HookProtocol(HookKind),
    /// A native operation of the composition root.
    Native { operation_id: String },
    /// The legacy-node payload.
    Legacy,
}

/// One call read once: the tokens after the verb, with the Node CLI's parser.
pub struct Call {
    first: Option<String>,
    parsed: ParsedArgs,
    /// The flags before a bare `--`: what follows it is positional for the native verbs' own parsers.
    flags_scope: ParsedArgs,
    /// The tokens after the first bare `--`: arguments, never flags.
    after_separator: Vec<String>,
    /// The tokens after the verb.
    tokens: Vec<String>,
}

impl Call {
    /// `cli_args[0]` is the verb; everything after it is the call. Tokens are decoded the way Node receives them.
    pub fn new(cli_args: &[OsString]) -> Self {
        let tokens: Vec<OsString> = cli_args
            .iter()
            .skip(1)
            .map(|a| OsString::from(a.to_string_lossy().into_owned()))
            .collect();
        let before_separator = tokens
            .iter()
            .position(|t| t == "--")
            .unwrap_or(tokens.len());
        let parse = |tokens: &[OsString]| parse_args(tokens).unwrap_or_default();
        let text = |tokens: &[OsString]| -> Vec<String> {
            tokens
                .iter()
                .map(|t| t.to_string_lossy().into_owned())
                .collect()
        };
        Self {
            first: tokens.first().map(|t| t.to_string_lossy().into_owned()),
            parsed: parse(&tokens),
            flags_scope: parse(&tokens[..before_separator]),
            after_separator: text(tokens.get(before_separator + 1..).unwrap_or_default()),
            tokens: text(&tokens),
        }
    }

    /// The call as the registry's declarations read it.
    pub fn parsed(&self) -> &ParsedArgs {
        &self.parsed
    }

    /// The flags and positionals before a bare `--`.
    pub fn flags(&self) -> &ParsedArgs {
        &self.flags_scope
    }

    /// The sub-command word of a verb: the first positional of the shared parser.
    pub fn sub_word(&self) -> Option<&str> {
        self.parsed.positional.first().map(String::as_str)
    }

    /// The arguments of a verb after its sub-command: the positionals before a bare `--`, then everything after it.
    pub fn arguments(&self) -> Vec<String> {
        self.flags_scope
            .positional
            .iter()
            .skip(1)
            .chain(&self.after_separator)
            .cloned()
            .collect()
    }

    /// The tokens after the verb with the sub-command taken out: what a verb's own flags and arguments are read from.
    pub fn without_sub(&self) -> Vec<String> {
        let sub_at = self.parsed.first_positional_at;
        self.tokens
            .iter()
            .enumerate()
            .filter(|(at, _)| Some(*at) != sub_at)
            .map(|(_, token)| token.clone())
            .collect()
    }

    /// The project the call is aimed at, as `--dir` names it. A bare `--dir` is the empty path, which the root door
    /// refuses, as the Node CLI does.
    pub fn named_dir(&self) -> Option<String> {
        match self.flags_scope.flag("dir")? {
            FlagValue::One(FlagScalar::Str(path)) => Some(path.clone()),
            FlagValue::One(FlagScalar::Bool) | FlagValue::Many(_) => Some(String::new()),
        }
    }

    /// The value of a flag that takes one: absent is `None`, a bare use is refused.
    pub fn value(&self, name: &str) -> Result<Option<String>, String> {
        match self.flags_scope.flag(name) {
            None => Ok(None),
            Some(FlagValue::One(FlagScalar::Str(text))) => Ok(Some(text.clone())),
            Some(_) => Err(format!("--{name} requires a value")),
        }
    }

    /// Whether a flag that takes no value is given: a use that took the next token as a value is refused, since
    /// that token is a word of the call, not the flag's.
    pub fn switch(&self, name: &str) -> Result<bool, String> {
        match self.flags_scope.flag(name) {
            None => Ok(false),
            Some(FlagValue::One(FlagScalar::Bool)) => Ok(true),
            Some(_) => Err(format!("--{name} takes no value")),
        }
    }

    /// The first flag, in the order the Node CLI lists them, that is neither in `allowed` nor one every verb takes.
    pub fn flag_outside(&self, allowed: &[&str]) -> Option<&str> {
        self.flags_scope
            .names_in_node_order()
            .into_iter()
            .find(|name| !allowed.contains(name) && !GLOBAL_FLAGS.contains(name))
    }
}

/// Whether one shape of a declaration (`sub`, `sub --flag`, `sub --flag=true`) matches the parsed call: the first
/// positional is `sub`, and the flag is present (or, with `=true`, exactly bare).
fn shape_matches(shape: &str, parsed: &ParsedArgs) -> bool {
    let mut words = shape.split(' ');
    let (Some(sub), flag) = (words.next(), words.next()) else {
        return false;
    };
    if parsed.positional.first().map(String::as_str) != Some(sub) {
        return false;
    }
    let Some(flag) = flag.and_then(|f| f.strip_prefix("--")) else {
        return true;
    };
    match flag.strip_suffix("=true") {
        Some(name) => parsed.flag(name) == Some(&FlagValue::One(FlagScalar::Bool)),
        None => parsed.flag(flag).is_some(),
    }
}

/// A registry declaration resolved for one call; absent is false.
pub fn declared(declaration: &Option<Declaration>, call: &Call) -> bool {
    match declaration {
        Some(Declaration::All(all)) => *all,
        Some(Declaration::Shapes(shapes)) => shapes
            .iter()
            .any(|shape| shape_matches(shape, call.parsed())),
        None => false,
    }
}

/// The lane of an invocation of `route`.
pub fn decide(route: &CommandRouteDescriptor, call: &Call) -> Lane {
    if route.route_kind == "native" {
        return match &route.operation_id {
            Some(operation_id) => Lane::Native {
                operation_id: operation_id.clone(),
            },
            None => Lane::Legacy,
        };
    }
    let Some(served) = &route.native_subcommands else {
        return Lane::Legacy;
    };
    let sub = if route.selector == RAW_KIND_VERB {
        call.first.as_deref()
    } else {
        call.parsed.positional.first().map(String::as_str)
    };
    let Some(sub) = sub.filter(|sub| served.iter().any(|s| s == sub)) else {
        return Lane::Legacy;
    };
    if route.selector == RAW_KIND_VERB {
        return HookKind::named(sub).map_or(Lane::Legacy, Lane::HookProtocol);
    }
    match &route.operation_id {
        Some(operation_id) => Lane::Native {
            operation_id: operation_id.clone(),
        },
        None => Lane::Legacy,
    }
}

/// A malformed call of a native verb: the fault class it is recorded under, the text, and the sub-command when
/// the call named one the verb serves.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CallFault {
    pub class: &'static str,
    pub message: String,
    pub sub: Option<String>,
}

/// The fault class of a missing or unknown sub-command.
pub const ARG_PARSE: &str = "arg-parse";
/// The fault class of a flag the verb does not accept.
pub const UNKNOWN_FLAG: &str = "unknown-flag";

/// The checks a native call passes before anything runs: the sub-command is one the verb serves, and every flag
/// before a bare `--` is one the registry projection lists. The flag named is the first in the order JavaScript
/// lists the Node parser's flags, so the host and the Node CLI name the same one.
pub fn check_call(
    route: &CommandRouteDescriptor,
    call: &Call,
) -> Result<Option<String>, CallFault> {
    let selector = route.selector.as_str();
    let mut served_sub = None;
    if route.subcommands == Some(true) {
        let (name, available) = NATIVE_SUBCOMMANDS
            .iter()
            .find(|(name, _)| *name == selector)
            .copied()
            .unwrap_or((selector, &[]));
        match call.sub_word() {
            Some(sub) if available.contains(&sub) => served_sub = Some(sub.to_owned()),
            Some(sub) => {
                return Err(CallFault {
                    class: ARG_PARSE,
                    message: format!(
                        "unknown {name} subcommand \"{sub}\". Available: {}",
                        available.join(", ")
                    ),
                    sub: None,
                })
            }
            None => {
                return Err(CallFault {
                    class: ARG_PARSE,
                    message: format!(
                        "{name} requires a subcommand. Available: {}",
                        available.join(", ")
                    ),
                    sub: None,
                })
            }
        }
    }
    match unknown_flag(route, call) {
        Some(message) => Err(CallFault {
            class: UNKNOWN_FLAG,
            message,
            sub: served_sub,
        }),
        None => Ok(served_sub),
    }
}

/// The flags every verb accepts, which the Node CLI's unknown-flag text never lists among a verb's own
/// (`GLOBAL_FLAGS` in `src/cli/flag-check.mjs`).
const GLOBAL_FLAGS: [&str; 3] = ["dir", "json", "help"];

/// The first flag before a bare `--` that the route's registry projection does not list. The name is the whole
/// token after `--`, as the shared parser reads it (`--dir=/x` is the flag `dir=/x`).
fn unknown_flag(route: &CommandRouteDescriptor, call: &Call) -> Option<String> {
    let sub = call.sub_word();
    let accepted: &Vec<String> = match (&route.subcommand_flags, &route.accepted_flags) {
        (Some(by_sub), _) => by_sub.get(sub?)?,
        (None, Some(flags)) => flags,
        (None, None) => return None,
    };
    call.flags_scope
        .names_in_node_order()
        .into_iter()
        .find(|key| !accepted.iter().any(|f| f == key))
        .map(|key| node_unknown_flag_text(route, sub, key, accepted))
}

/// The refusal text of the Node CLI (`unknownFlagMessage`, `src/cli/flag-check.mjs`), byte for byte: the verb and
/// its sub-command, a hint to write `--k <value>` when the token carries an `=`, the flags of the sub-command
/// beyond the global ones (or none), and the help call for that sub-command.
fn node_unknown_flag_text(
    route: &CommandRouteDescriptor,
    sub: Option<&str>,
    key: &str,
    accepted: &[String],
) -> String {
    let verb = match (&route.subcommand_flags, sub) {
        (Some(_), Some(sub)) => format!("{} {sub}", route.selector),
        _ => route.selector.clone(),
    };
    let hint = key.split_once('=').map_or_else(String::new, |(name, _)| {
        format!(" (write \"--{name} <value>\", not \"--name=value\")")
    });
    let own: Vec<String> = accepted
        .iter()
        .filter(|flag| !GLOBAL_FLAGS.contains(&flag.as_str()))
        .map(|flag| format!("--{flag}"))
        .collect();
    let valid = if own.is_empty() {
        "It takes no flags besides --dir, --json.".to_owned()
    } else {
        format!("Valid flags: {}, --dir, --json.", own.join(", "))
    };
    format!(
        "unknown flag \"--{key}\" for \"fgos {verb}\"{hint}. {valid} See \"fgos {verb} --help\"."
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::Value;

    fn os(args: &[&str]) -> Vec<OsString> {
        args.iter().map(OsString::from).collect()
    }

    fn route(selector: &str) -> &'static CommandRouteDescriptor {
        &command_routes()[selector]
    }

    fn call(verb: &str, rest: &[&str]) -> Call {
        let mut args = vec![verb];
        args.extend_from_slice(rest);
        Call::new(&os(&args))
    }

    #[test]
    fn the_table_has_a_route_for_every_verb_and_none_for_an_option_token() {
        assert!(command_routes().keys().all(|k| !k.starts_with('-')));
        assert!(route("config").operation_id.is_some());
    }

    #[test]
    fn every_shared_store_declaration_row_resolves_as_the_registry_resolves_it() {
        let doc: Value = serde_json::from_str(include_str!(
            "../../../test/rust-host/fixtures/store-declaration-vectors.json"
        ))
        .unwrap();
        let rows = doc["rows"].as_array().unwrap();
        assert!(!rows.is_empty());
        for row in rows {
            let verb = row["verb"].as_str().unwrap();
            let argv: Vec<&str> = row["argv"]
                .as_array()
                .unwrap()
                .iter()
                .map(|t| t.as_str().unwrap())
                .collect();
            let (route, call) = (route(verb), call(verb, &argv));
            let label = format!("{verb} {argv:?}");
            assert_eq!(
                declared(&route.mutates_store, &call),
                row["mutates"],
                "mutates: {label}"
            );
            assert_eq!(
                declared(&route.lands_work, &call),
                row["landsWork"],
                "landsWork: {label}"
            );
            assert_eq!(
                declared(&route.event_store_child, &call),
                row["eventStoreChild"],
                "eventStoreChild: {label}"
            );
        }
    }

    #[test]
    fn every_first_positional_a_selector_serves_natively_has_a_server() {
        let mut checked = 0;
        for route in command_routes().values() {
            for sub in route.native_subcommands.iter().flatten() {
                checked += 1;
                if route.selector == RAW_KIND_VERB {
                    assert!(
                        HookKind::named(sub).is_some(),
                        "hook kind {sub} has no handler"
                    );
                } else {
                    assert!(
                        route.operation_id.is_some(),
                        "{} {sub} names no operation",
                        route.selector
                    );
                }
            }
        }
        assert!(checked > 0);
        let hook = route("hook").native_subcommands.as_ref().unwrap();
        let mut handled: Vec<&str> = HookKind::ALL.iter().map(|(name, _)| *name).collect();
        handled.sort_unstable();
        let mut listed: Vec<&str> = hook.iter().map(String::as_str).collect();
        listed.sort_unstable();
        assert_eq!(listed, handled, "every hook handler is declared");
    }

    /// The sub-commands a verb serves are the ones its registry entry declares, so a sub-command added to
    /// either side alone is caught here, not by a user.
    #[test]
    fn a_native_verb_serves_exactly_the_sub_commands_its_route_lists() {
        for (selector, served) in NATIVE_SUBCOMMANDS {
            let listed = route(selector)
                .subcommand_flags
                .as_ref()
                .unwrap_or_else(|| panic!("{selector} lists no sub-commands"));
            let mut listed: Vec<&str> = listed.keys().map(String::as_str).collect();
            listed.sort_unstable();
            let mut served: Vec<&str> = served.to_vec();
            served.sort_unstable();
            assert_eq!(served, listed, "{selector}");
        }
    }

    #[test]
    fn every_native_route_names_its_operation_and_its_sub_commands_and_none_lands_work() {
        for route in command_routes().values() {
            if route.route_kind == "native" {
                assert!(route.operation_id.is_some(), "{}", route.selector);
                assert!(
                    route.lands_work.is_none(),
                    "{} lands work natively",
                    route.selector
                );
                if route.subcommands == Some(true) {
                    assert!(
                        NATIVE_SUBCOMMANDS.iter().any(|(n, _)| *n == route.selector),
                        "{} has no sub-command table",
                        route.selector
                    );
                }
            }
            for sub in route.native_subcommands.iter().flatten() {
                assert!(
                    !declared(&route.lands_work, &call(&route.selector, &[sub])),
                    "{} {sub} lands work natively",
                    route.selector
                );
            }
        }
    }

    #[test]
    fn the_lane_follows_the_route_kind_and_the_first_token_of_a_hook() {
        assert_eq!(
            decide(
                route("hook"),
                &call("hook", &["mailbox", "--cli", "claude"])
            ),
            Lane::HookProtocol(HookKind::Mailbox)
        );
        assert_eq!(
            decide(route("hook"), &call("hook", &["mailbox-sync"])),
            Lane::HookProtocol(HookKind::MailboxSync)
        );
        for other in [
            call("hook", &["dispatch-decide"]),
            call("hook", &["--cli", "claude", "mailbox"]),
            call("hook", &[]),
        ] {
            assert_eq!(decide(route("hook"), &other), Lane::Legacy);
        }
        assert_eq!(
            decide(route("config"), &call("config", &["show"])),
            Lane::Native {
                operation_id: "config.read".into()
            }
        );
        assert_eq!(decide(route("add"), &call("add", &[])), Lane::Legacy);
    }

    #[test]
    fn a_call_is_read_over_the_tokens_after_the_verb() {
        let read = call("config", &["show", "--json"]);
        assert_eq!(read.parsed().positional, ["show"]);
        assert!(read.parsed().flag("json").is_some());
        let read = call("config", &["--json", "show"]);
        assert!(
            read.parsed().positional.is_empty(),
            "a flag before the sub-verb takes it as its value"
        );
    }

    #[test]
    fn a_missing_or_unknown_sub_command_is_an_arg_parse_fault_naming_what_is_available() {
        let fault = check_call(route("config"), &call("config", &[])).unwrap_err();
        assert_eq!(fault.class, ARG_PARSE);
        assert!(
            fault
                .message
                .starts_with("config requires a subcommand. Available: "),
            "{}",
            fault.message
        );
        let fault = check_call(route("config"), &call("config", &["nosuch"])).unwrap_err();
        assert_eq!(fault.class, ARG_PARSE);
        assert!(
            fault
                .message
                .starts_with("unknown config subcommand \"nosuch\". Available: "),
            "{}",
            fault.message
        );
        assert_eq!(fault.sub, None);
        assert_eq!(
            check_call(route("config"), &call("config", &["show", "--json"])),
            Ok(Some("show".into()))
        );
    }

    #[test]
    fn config_refuses_an_unknown_flag_in_the_node_cli_text() {
        let fault =
            check_call(route("config"), &call("config", &["show", "--paht", "x"])).unwrap_err();
        assert_eq!(fault.class, UNKNOWN_FLAG);
        assert_eq!(fault.sub.as_deref(), Some("show"));
        assert_eq!(
            fault.message,
            "unknown flag \"--paht\" for \"fgos config show\". Valid flags: --path, --dir, --json. See \"fgos config show --help\"."
        );
    }

    #[test]
    fn a_flag_with_an_equals_value_is_refused_whole_and_a_bare_separator_ends_the_flags() {
        let fault =
            check_call(route("config"), &call("config", &["show", "--path=a.b"])).unwrap_err();
        assert_eq!(
            fault.message,
            "unknown flag \"--path=a.b\" for \"fgos config show\" (write \"--path <value>\", not \"--name=value\"). Valid flags: --path, --dir, --json. See \"fgos config show --help\"."
        );
        let fault =
            check_call(route("config"), &call("config", &["show", "--nope=1"])).unwrap_err();
        assert!(
            fault.message.contains("unknown flag \"--nope=1\""),
            "{}",
            fault.message
        );
        assert!(check_call(route("config"), &call("config", &["show", "--", "--nope"])).is_ok());
    }

    #[test]
    fn a_dir_spelled_with_an_equals_sign_is_an_unknown_flag_for_every_verb() {
        for (verb, rest) in [
            ("config", &["show", "--dir=/x"][..]),
            ("convention", &["check", "--dir=/x"]),
            ("identity", &["writer", "--dir=/x"]),
            ("mailbox", &["status", "--dir=/x"]),
            ("metrics", &["ping", "--dir=/x"]),
            ("friction", &["ping", "--dir=/x"]),
            ("version", &["--dir=/x"]),
            ("gate-bypass", &["--dir=/x"]),
        ] {
            let fault = check_call(route(verb), &call(verb, rest)).unwrap_err();
            assert_eq!(fault.class, UNKNOWN_FLAG, "{verb}");
            assert!(
                fault.message.contains("unknown flag \"--dir=/x\"")
                    && fault
                        .message
                        .contains("(write \"--dir <value>\", not \"--name=value\")"),
                "{verb}: {}",
                fault.message
            );
        }
    }

    #[test]
    fn of_several_unknown_flags_the_first_in_javascript_key_order_is_named() {
        let fault =
            check_call(route("config"), &call("config", &["show", "--zzz", "--1"])).unwrap_err();
        assert!(
            fault.message.contains("unknown flag \"--1\""),
            "{}",
            fault.message
        );
        let fault = check_call(
            route("config"),
            &call("config", &["show", "--zzz", "--aaa"]),
        )
        .unwrap_err();
        assert!(
            fault.message.contains("unknown flag \"--zzz\""),
            "{}",
            fault.message
        );
    }

    #[test]
    fn git_refuses_an_unknown_flag_in_the_node_cli_text() {
        let text = |rest: &[&str]| {
            check_call(route("git"), &call("git", rest))
                .unwrap_err()
                .message
        };
        assert_eq!(
            text(&["status", "--bogus"]),
            "unknown flag \"--bogus\" for \"fgos git status\". It takes no flags besides --dir, --json. See \"fgos git status --help\"."
        );
        assert_eq!(
            text(&["recover", "--dir=/x"]),
            "unknown flag \"--dir=/x\" for \"fgos git recover\" (write \"--dir <value>\", not \"--name=value\"). It takes no flags besides --dir, --json. See \"fgos git recover --help\"."
        );
    }

    #[test]
    fn the_valid_flags_of_a_verb_print_in_registry_order() {
        let route = fake(serde_json::json!({
            "subcommands": true,
            "subcommand_flags": {"fence": ["dir", "help", "json", "yes", "name"]},
        }));
        assert_eq!(
            node_unknown_flag_text(&route, Some("fence"), "bogus", &route.subcommand_flags.as_ref().unwrap()["fence"]),
            "unknown flag \"--bogus\" for \"fgos probe fence\". Valid flags: --yes, --name, --dir, --json. See \"fgos probe fence --help\"."
        );
    }

    #[test]
    fn lock_status_refuses_an_unknown_flag_in_the_node_cli_text_and_accepts_a_positional() {
        let text = |rest: &[&str]| {
            check_call(route("lock-status"), &call("lock-status", rest))
                .unwrap_err()
                .message
        };
        assert_eq!(
            text(&["--bogus"]),
            "unknown flag \"--bogus\" for \"fgos lock-status\". It takes no flags besides --dir, --json. See \"fgos lock-status --help\"."
        );
        assert_eq!(
            text(&["--dir=/x"]),
            "unknown flag \"--dir=/x\" for \"fgos lock-status\" (write \"--dir <value>\", not \"--name=value\"). It takes no flags besides --dir, --json. See \"fgos lock-status --help\"."
        );
        assert!(check_call(
            route("lock-status"),
            &call("lock-status", &["extra", "--json"])
        )
        .is_ok());
    }

    fn fake(json: serde_json::Value) -> CommandRouteDescriptor {
        let mut route = serde_json::json!({
            "selector": "probe", "route_kind": "native", "operation_id": "probe.run",
            "owner_path": "x", "compatibility_tests": ["x"],
        });
        route
            .as_object_mut()
            .unwrap()
            .extend(json.as_object().unwrap().clone());
        serde_json::from_value(route).unwrap()
    }

    #[test]
    fn a_call_reads_its_sub_command_and_flags_only_through_the_shared_parser() {
        let route = fake(serde_json::json!({
            "accepted_flags": ["json", "dir"],
            "subcommand_flags": {"status": ["json", "dir"]},
        }));
        // The sub-command is the first positional, even after a flag that took no value.
        let read = call("probe", &["--json", "--dir", "/x", "status"]);
        assert_eq!(read.sub_word(), Some("status"));
        // A flag that takes the next token as its value leaves no sub-command, as in the Node CLI.
        let read = call("probe", &["--json", "status"]);
        assert_eq!(read.sub_word(), None);
        let read = call("config", &["--json", "show"]);
        assert_eq!(read.sub_word(), None);
        // `--flag=value` is one unknown flag named whole, never `flag` with a value.
        let fault = check_call(&route, &call("probe", &["status", "--dir=/x"])).unwrap_err();
        assert!(
            fault.message.contains("unknown flag \"--dir=/x\""),
            "{}",
            fault.message
        );
        assert!(check_call(&route, &call("probe", &["status", "--dir", "/x"])).is_ok());
    }

    #[test]
    fn the_project_a_call_names_is_its_dir_flag_and_a_bare_dir_is_the_empty_path() {
        let named = |rest: &[&str]| call("probe", rest).named_dir();
        assert_eq!(named(&["--dir", "/x"]).as_deref(), Some("/x"));
        assert_eq!(named(&["--dir=/x"]), None);
        assert_eq!(named(&["show", "--dir"]).as_deref(), Some(""));
        assert_eq!(named(&["--json"]), None);
        // What follows a bare `--` is never a flag.
        assert_eq!(named(&["--", "--dir", "/x"]), None);
    }

    #[test]
    fn a_call_hands_a_verb_its_words_flags_and_the_arguments_after_a_bare_separator() {
        let read = call(
            "probe",
            &["send", "--to", "a", "--wake", "--", "--body", "x"],
        );
        assert_eq!(read.sub_word(), Some("send"));
        assert_eq!(read.arguments(), ["--body", "x"]);
        assert_eq!(read.value("to"), Ok(Some("a".into())));
        assert_eq!(read.switch("wake"), Ok(true));
        assert_eq!(read.value("missing"), Ok(None));
        assert_eq!(read.switch("missing"), Ok(false));
        let read = call("probe", &["send", "--to", "--wake", "--reply", "x"]);
        assert_eq!(read.value("to"), Err("--to requires a value".into()));
        assert_eq!(read.switch("reply"), Err("--reply takes no value".into()));
        assert_eq!(read.flag_outside(&["to", "wake"]), Some("reply"));
        // The sub-command is taken out wherever it stands among the flags.
        let read = call("probe", &["--limit", "3", "list", "--json"]);
        assert_eq!(read.without_sub(), ["--limit", "3", "--json"]);
    }
}
