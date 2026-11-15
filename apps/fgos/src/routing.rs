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
use fgos_distribution::suggest::suggest;
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
];

/// Debt: the native verbs written before the shared parser, which keep their own reading of a call: the
/// sub-command is the token right after the verb when it is not a flag, a flag name is judged up to its `=`,
/// `--dir=<path>` names the project, and, in the invocation doors, a root the Git door refuses still reaches
/// them. Every other native verb reads only the shared parser's output (the Node CLI's rules: the sub-command
/// is the first positional, a flag name is the whole token after `--`, `--dir` is the parsed flag). A verb
/// leaves this list when it moves onto the shared reading; a verb is never added.
pub const PRE_DOOR_NATIVE_VERBS: [&str; 8] = [
    "config",
    "convention",
    "friction",
    "gate-bypass",
    "identity",
    "mailbox",
    "metrics",
    "version",
];

/// Whether `selector` keeps the reading `PRE_DOOR_NATIVE_VERBS` names.
pub fn keeps_pre_door_reading(selector: &str) -> bool {
    PRE_DOOR_NATIVE_VERBS.contains(&selector)
}

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
        Self {
            first: tokens.first().map(|t| t.to_string_lossy().into_owned()),
            parsed: parse(&tokens),
            flags_scope: parse(&tokens[..before_separator]),
        }
    }

    /// The call as the registry's declarations read it.
    pub fn parsed(&self) -> &ParsedArgs {
        &self.parsed
    }

    /// The sub-command word of a verb of `selector`: the first positional of the shared parser, or, for a
    /// pre-door verb, the token right after the verb when it is not a flag.
    fn sub_word(&self, selector: &str) -> Option<&str> {
        if keeps_pre_door_reading(selector) {
            self.first
                .as_deref()
                .filter(|word| !word.is_empty() && !word.starts_with('-'))
        } else {
            self.parsed.positional.first().map(String::as_str)
        }
    }

    /// The project a verb of `selector` is aimed at, as `--dir` names it: the value the verb's reader gives it
    /// (a pre-door verb also takes `--dir=<path>`, and a trailing bare `--dir` names nothing). A bare `--dir`
    /// read by the shared parser is the empty path, which the root door refuses, as the Node CLI does.
    pub fn named_dir(&self, selector: &str, cli_args: &[OsString]) -> Option<String> {
        if keeps_pre_door_reading(selector) {
            return pre_door_named_dir(cli_args);
        }
        match self.parsed.flag("dir")? {
            FlagValue::One(FlagScalar::Str(path)) => Some(path.clone()),
            FlagValue::One(FlagScalar::Bool) | FlagValue::Many(_) => Some(String::new()),
        }
    }
}

/// Debt, with `PRE_DOOR_NATIVE_VERBS`: the first `--dir <path>` or `--dir=<path>` token of the call (a trailing
/// bare `--dir` names nothing), as the pre-door native verbs have always read it.
fn pre_door_named_dir(args: &[OsString]) -> Option<String> {
    args.iter()
        .enumerate()
        .find_map(|(i, arg)| match arg.to_str() {
            Some("--dir") => args
                .get(i + 1)
                .map(|value| value.to_string_lossy().into_owned()),
            Some(token) => token.strip_prefix("--dir=").map(str::to_owned),
            None => None,
        })
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
        match call.sub_word(selector) {
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
/// token after `--`, as the shared parser reads it (`--dir=/x` is the flag `dir=/x`); a pre-door verb's own
/// reading also takes `--flag=value`, so its name is compared up to the `=`.
fn unknown_flag(route: &CommandRouteDescriptor, call: &Call) -> Option<String> {
    let pre_door = keeps_pre_door_reading(&route.selector);
    let sub = call.sub_word(&route.selector);
    let accepted: &Vec<String> = match (&route.subcommand_flags, &route.accepted_flags) {
        (Some(by_sub), _) => by_sub.get(sub?)?,
        (None, Some(flags)) => flags,
        (None, None) => return None,
    };
    call.flags_scope
        .names_in_node_order()
        .into_iter()
        .find_map(|key| {
            let name = if pre_door {
                key.split('=').next().unwrap_or("")
            } else {
                key
            };
            if accepted.iter().any(|f| f == name) {
                return None;
            }
            Some(if pre_door {
                pre_door_unknown_flag_text(route, key, name, accepted)
            } else {
                node_unknown_flag_text(route, sub, key, accepted)
            })
        })
}

/// The refusal text a pre-door verb has always answered with.
fn pre_door_unknown_flag_text(
    route: &CommandRouteDescriptor,
    key: &str,
    name: &str,
    accepted: &[String],
) -> String {
    let token = format!("--{key}");
    let mut known: Vec<&str> = accepted.iter().map(String::as_str).collect();
    known.sort_unstable();
    let near = suggest(name, known.into_iter())
        .map(|f| format!(" Did you mean --{f}?"))
        .unwrap_or_default();
    // Printed sorted: the list is in registry order, and these verbs have always shown it alphabetical.
    let mut listed: Vec<&str> = accepted.iter().map(String::as_str).collect();
    listed.sort_unstable();
    format!(
        "unknown flag \"{token}\" for \"fgos {}\".{near} Valid flags: {}. See \"fgos {} --help\".",
        route.selector,
        listed
            .iter()
            .map(|f| format!("--{f}"))
            .collect::<Vec<_>>()
            .join(", "),
        route.selector,
    )
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
    let verb = match (route.subcommands, sub) {
        (Some(true), Some(sub)) => format!("{} {sub}", route.selector),
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
    fn an_unknown_flag_is_named_with_a_near_miss_and_the_valid_flags() {
        let fault =
            check_call(route("config"), &call("config", &["show", "--paht", "x"])).unwrap_err();
        assert_eq!(fault.class, UNKNOWN_FLAG);
        assert_eq!(fault.sub.as_deref(), Some("show"));
        assert!(
            fault.message.starts_with(
                "unknown flag \"--paht\" for \"fgos config\". Did you mean --path? Valid flags: "
            ),
            "{}",
            fault.message
        );
        assert!(fault.message.ends_with(". See \"fgos config --help\"."));
    }

    #[test]
    fn a_flag_with_an_equals_value_is_judged_by_its_name_and_a_bare_separator_ends_the_flags() {
        assert!(check_call(route("config"), &call("config", &["show", "--path=a.b"])).is_ok());
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
    fn the_valid_flags_of_a_verb_off_the_pre_door_list_print_in_registry_order() {
        let route = fake(serde_json::json!({
            "subcommands": true,
            "subcommand_flags": {"fence": ["dir", "help", "json", "yes", "name"]},
        }));
        assert_eq!(
            node_unknown_flag_text(&route, Some("fence"), "bogus", &route.subcommand_flags.as_ref().unwrap()["fence"]),
            "unknown flag \"--bogus\" for \"fgos probe fence\". Valid flags: --yes, --name, --dir, --json. See \"fgos probe fence --help\"."
        );
        // A pre-door verb keeps printing its flags alphabetically whatever order the table holds them in.
        let accepted: Vec<String> = ["yes", "name"].map(String::from).to_vec();
        let text = pre_door_unknown_flag_text(&route, "bogus", "bogus", &accepted);
        assert!(text.contains("Valid flags: --name, --yes."), "{text}");
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
    fn a_verb_off_the_pre_door_list_reads_its_sub_command_and_flags_only_through_the_shared_parser()
    {
        let route = fake(serde_json::json!({
            "accepted_flags": ["json", "dir"],
            "subcommand_flags": {"status": ["json", "dir"]},
        }));
        // The sub-command is the first positional, even after a flag that took no value.
        let read = call("probe", &["--json", "--dir", "/x", "status"]);
        assert_eq!(read.sub_word("probe"), Some("status"));
        // A flag that takes the next token as its value leaves no sub-command, as in the Node CLI.
        let read = call("probe", &["--json", "status"]);
        assert_eq!(read.sub_word("probe"), None);
        // The pre-door reading of the same call still finds the word right after the verb.
        let read = call("config", &["show"]);
        assert_eq!(read.sub_word("config"), Some("show"));
        let read = call("config", &["--json", "show"]);
        assert_eq!(read.sub_word("config"), None);
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
    fn the_project_a_call_names_follows_the_reading_of_its_verb() {
        let named = |verb: &str, rest: &[&str]| {
            let mut args = vec![verb];
            args.extend_from_slice(rest);
            let args = os(&args);
            Call::new(&args).named_dir(verb, &args)
        };
        // A pre-door verb keeps both spellings, and a trailing bare flag names nothing.
        assert_eq!(named("config", &["--dir", "/x"]).as_deref(), Some("/x"));
        assert_eq!(named("config", &["--dir=/x"]).as_deref(), Some("/x"));
        assert_eq!(named("config", &["show", "--dir"]), None);
        assert_eq!(named("config", &["--json"]), None);
        // Every other verb has the one spelling, and a bare flag is the empty path the root door refuses.
        assert_eq!(named("probe", &["--dir", "/x"]).as_deref(), Some("/x"));
        assert_eq!(named("probe", &["--dir=/x"]), None);
        assert_eq!(named("probe", &["show", "--dir"]).as_deref(), Some(""));
        assert_eq!(named("probe", &[]), None);
    }
}
